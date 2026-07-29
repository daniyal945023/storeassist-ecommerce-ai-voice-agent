export interface DocumentModel {
    id: string
    content: string
    category: string
}

export interface UserInputModel {
    query: string
    num_results?: number
}

export interface AgentChatInput {
    user_id: string
    message: string
}

export interface APIResponse {
     status: 'success' | 'error'
    response: string
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}