# StoreAssistAI — Enterprise Knowledge & Voice Assistant

**StoreAssistAI** is a full-stack, enterprise-grade AI knowledge management platform. It features real-time token streaming, multi-step agent reasoning with LangGraph, Model Context Protocol (FastMCP) tool execution, and an interactive, bi-directional voice interface (Speech-to-Text & Text-to-Speech).

---

## ✨ Key Features

- **Real-Time Token Streaming:** Powered by the **Vercel AI SDK** (`useChat`) on the frontend and FastAPI `StreamingResponse` on the backend for ultra-low latency token delivery.
- **Hands-Free Bi-Directional Voice UX:**
- **Speech-to-Text (Voice Input):** Live transcription using browser-native `SpeechRecognition`.
- **Text-to-Speech (Voice Response):** Automatic or on-demand audio playback using `speechSynthesis` with Markdown sanitization.
- **LangGraph Multi-Step Reasoning:** Autonomous agent orchestration for intent evaluation, vector retrieval, and deterministic tool calls.
- **Retrieval-Augmented Generation (RAG):** Dynamic document ingestion into vector storage (**ChromaDB**) with metadata filtering.
- **FastMCP Integration:** Structured, protocol-compliant Model Context Protocol tools for executing business logic and mathematical calculations.
- **Decoupled Modern UI:** Polished dark-mode enterprise interface built with Next.js App Router and Tailwind CSS.

---

## 🏗️ System Architecture

-Frontend(Next.js)
      |
      |
FastAPI Backend(data validation and structuring)
      |
      |
Langgraph(llm looks for tools)
      |
      |
MCP server(includes tools)
  |       |          |
  |       |          |
  |       |          | 
RAG(vector search and data ingestion) + calculate_order_total
                |
                |
            LLM uses relevant tool to respond back to client/frontend


## Key Challenges

 - State Handling in useSpeech(Web API)
 - Connecting the mcp server to the client and ensuring accuracy in llm tool calling
 - Ensuring proper validation of structured input and output in Typescript and Pydantic(Python)


---

## Limitations
- The Document ingestion and vector search can only be performed by store owner/admin, otherwise the system becomes susceptible to malicious data injections.
- chroma db is storing the data in disk, in real world production scenario, it would need a persistent cloud storage
- System is prone to rate limiting issues
- No user authentication or session management
- doesnt utilize a relational database such as Mongodb or Postgresql to store user data or any business related data
- Chroma db and its embedding model has limited capabilities, which is only suitable for testing, but not real world production grade app. A cloud based solution such as Pinecone or Qdrant
  would be suitable,along with embedding models for SentenceTransformers.
- Few MCP capabilities, excludes Resources and Prompts.

## 🛠️ Tech Stack

### Frontend (Presentation & Voice Layer)
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS (Dark Slate and Yellow Theme)
- **AI Streaming:** Vercel AI SDK (`@ai-sdk/react`)
- **Voice Capabilities:** Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

### Backend (Agentic Engine & Retrieval)
- **Framework:** FastAPI (Python async streaming)
- **Orchestration:** LangGraph & LangChain Core
- **Tool Protocol:** FastMCP (Model Context Protocol)
- **Vector Database:** ChromaDB
- **LLM Provider:** Google Gemini

---
      
