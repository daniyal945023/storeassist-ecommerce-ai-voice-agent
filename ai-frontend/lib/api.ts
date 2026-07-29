import { APIResponse, AgentChatInput, DocumentModel, UserInputModel } from './types';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

//send message to backend endpoints
export async function sendAgentMessage(payload: AgentChatInput): Promise<APIResponse> {
  const response = await fetch(
    `${FASTAPI_BASE_URL}/api/agent/chat`,
     {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  })

  if(!response.ok){
    throw new Error(`Backend Server error: ${response.statusText}`)
    }
  
    return response.json();
  
}

export async function ingestDocuments(payload: DocumentModel): Promise<APIResponse> {
    const response = await fetch(
        `${FASTAPI_BASE_URL}/api/documents/add`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }
    )

    if(!response.ok){
      throw new Error(`Backend server error: ${response.statusText}`)
    } 
        return response.json()
    
}

export async function searchDocuments(payload: UserInputModel): Promise<APIResponse> {
   const response = await fetch(
    `${FASTAPI_BASE_URL}/api/documents/search`,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }
   )

   if(!response.ok){
    throw new Error(`Backend server error: ${response.statusText}`)
   }
   
    return response.json()
   
}