from pydantic import BaseModel
from fastmcp import FastMCP
import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, SystemMessage
from langchain_core.tools import StructuredTool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
import os
import json
from typing import TypedDict, Annotated

load_dotenv()

app = FastAPI(title="E-Commerce AI Support Server")
mcp = FastMCP("E-Commerce MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path="./chroma_data")

collection = chroma_client.get_or_create_collection(
    name="ecommerce_knowledge_base"
)

llm = ChatOpenAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)


# --- Pydantic Data Models ---
class DocumentModel(BaseModel):
    id: str
    content: str
    category: str = "general"

class UserInputModel(BaseModel):
    query: str
    num_results: int = 2

class AgentChatInput(BaseModel):
    user_id: str
    message: str

class APIResponse(BaseModel):
    status: str
    response: str


# --- FastMCP Tools ---
@mcp.tool()
def add_data_to_RAG_collection(id: str, content: str, category: str = "general") -> str:
    """Adds product details, policies, or FAQs into the store knowledge base."""
    try:
        collection.upsert(
            documents=[content],
            ids=[id],
            metadatas=[{"category": category}]
        )
        return f"Successfully added document '{id}' to the store knowledge base."
    except Exception as e:
        return f"Error: {str(e)}. Failed to add document '{id}'."


@mcp.tool()
def search_RAG_collection(query: str, num_results: int = 2) -> str:
    """Searches the e-commerce store knowledge base for product information, return policies, or shipping rules."""
    result = collection.query(
        query_texts=[query],
        n_results=num_results
    )
    docs = result.get("documents", [[]])[0]
    return "\n---\n".join(docs) if docs else "No matching store policies or products found."


@mcp.tool()
def calculate_order_total(item_prices: list[float], discount_percent: float = 0.0, shipping_fee: float = 0.0, tax_percent: float = 0.0) -> str:
    """
    Calculates the final order cost given a list of item prices, discount percentage, shipping fee, and tax rate.
    """
    if not item_prices:
        return "Error: Item prices list cannot be empty."

    subtotal = sum(item_prices)
    discount_amount = subtotal * (discount_percent / 100.0)
    discounted_subtotal = subtotal - discount_amount
    tax_amount = discounted_subtotal * (tax_percent / 100.0)
    final_total = discounted_subtotal + tax_amount + shipping_fee

    return (
        f"Order Calculation Summary:\n"
        f"- Subtotal: ${subtotal:.2f}\n"
        f"- Discount ({discount_percent}%): -${discount_amount:.2f}\n"
        f"- Tax ({tax_percent}%): +${tax_amount:.2f}\n"
        f"- Shipping Fee: +${shipping_fee:.2f}\n"
        f"- Final Order Total: ${final_total:.2f}"
    )


# --- Tool Mapping ---
mcp_tools_map = {
    "add_data_to_RAG_collection": add_data_to_RAG_collection,
    "calculate_order_total": calculate_order_total,
    "search_RAG_collection": search_RAG_collection
}

langgraph_tools = [
    StructuredTool.from_function(
        func=add_data_to_RAG_collection,
        name="add_data_to_RAG_collection",
        description="Adds product descriptions, warranty info, or store policies into the store vector database."
    ),
    StructuredTool.from_function(
        func=calculate_order_total,
        name="calculate_order_total",
        description="Calculates final e-commerce order costs including subtotal, discounts, tax, and shipping fees."
    ),
    StructuredTool.from_function(
        func=search_RAG_collection,
        name="search_RAG_collection",
        description="Searches store FAQs, shipping details, return policies, and product specifications."
    ),
]

llm_with_tools = llm.bind_tools(langgraph_tools)


# --- LangGraph Workflow ---
class AgentState(TypedDict):
    user_id: str
    query: str
    messages: Annotated[list[BaseMessage], add_messages]

def agent_input_node(state: AgentState) -> dict:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def tool_node(state: AgentState) -> dict:
    last_response = state["messages"][-1]
    tool_responses = []
    if getattr(last_response, "tool_calls", None):
        for tool_call in last_response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            if tool_name in mcp_tools_map:
                func = mcp_tools_map[tool_name]
                result = func(**tool_args)
            else:
                result = f"Error: Tool {tool_name} not found."

            tool_responses.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))

    return {"messages": tool_responses}

def should_continue_node(state: AgentState):
    last_response = state["messages"][-1]
    if hasattr(last_response, "tool_calls") and last_response.tool_calls:
        return "tools"
    return END

workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_input_node)
workflow.add_node("tools", tool_node)
workflow.add_edge(START, "agent")
workflow.add_edge("tools", "agent")
workflow.add_conditional_edges("agent", should_continue_node, {
    "tools": "tools",
    END: END,
})

agent_app = workflow.compile()


# --- FastAPI Endpoints ---
@app.post("/api/documents/add")
async def add_document_endpoint(payload: DocumentModel):
    """Inserts product specs or policy details into ChromaDB."""
    result = add_data_to_RAG_collection(
        id=payload.id,
        content=payload.content,
        category=payload.category
    )
    return APIResponse(status="success", response=result)

@app.post("/api/documents/search")
async def get_rag_result_endpoint(payload: UserInputModel):
    """Directly searches the knowledge base."""
    response = search_RAG_collection(
        query=payload.query,
        num_results=payload.num_results
    )
    return APIResponse(status="success", response=response)

@app.post("/api/agent/chat", response_model=APIResponse)
async def chat_with_agent(payload: AgentChatInput):
    initial_state = {
        "user_id": payload.user_id,
        "query": payload.message,
        "messages": [HumanMessage(content=payload.message)]
    }
    
    try:
        final_state = await agent_app.ainvoke(initial_state)
        final_reply = final_state["messages"][-1].content
        return APIResponse(status="success", response=final_reply)
    except Exception as e:
        return APIResponse(status="error", response=f"Failed to generate response: {str(e)}")