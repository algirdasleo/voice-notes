export interface ChatItem {
  id: string
  title: string
  description?: string
  duration?: string
}

export interface ChatPageProps {
  chats?: ChatItem[]
}
export interface ChatMessage {
  type: "message" | "response" | "error" | "close"
  content: string
  errors?: unknown[]
}

export interface ChatRequest {
  type: "message" | "close"
  content?: string
}

export interface ChatWebSocketHandlers {
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Event) => void
  onClose?: () => void
  onOpen?: () => void
}
