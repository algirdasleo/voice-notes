export interface ChatMessage {
  type: "message" | "response" | "token" | "end" | "error" | "close"
  content: string
  errors?: unknown[]
}

export interface ChatRequest {
  type: "message" | "close"
  content?: string
  project_ids?: string[]
}

export interface ChatWebSocketHandlers {
  onMessage?: (message: ChatMessage) => void
  onToken?: (token: string) => void
  onStreamEnd?: () => void
  onError?: (error: Event) => void
  onClose?: () => void
  onOpen?: () => void
}

export type ChatRole = "user" | "assistant"

export interface ChatBubble {
  id: string
  role: ChatRole
  content: string
  isStreaming?: boolean
  timestamp: Date
}
