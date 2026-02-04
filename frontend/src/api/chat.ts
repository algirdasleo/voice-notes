import type { ChatMessage, ChatRequest, ChatWebSocketHandlers } from "@/types/chat"

export function createChatWebSocket(sessionId?: string): WebSocket {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
  const wsUrl = apiUrl.replace(/^http/, "ws")

  const url = new URL(`${wsUrl}/chat/ws`)
  if (sessionId) {
    url.searchParams.append("session_id", sessionId)
  }

  return new WebSocket(url.toString())
}

export function sendChatMessage(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    const payload: ChatRequest = {
      type: "message",
      content: message,
    }
    ws.send(JSON.stringify(payload))
  }
}

export function closeChatWebSocket(ws: WebSocket): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const closeMessage: ChatRequest = {
      type: "close",
    }
    ws.send(JSON.stringify(closeMessage))
    ws.close()
  }
}

export function setupChatWebSocketListeners(ws: WebSocket, handlers: ChatWebSocketHandlers): void {
  if (handlers.onOpen) {
    ws.addEventListener("open", handlers.onOpen)
  }

  if (handlers.onMessage) {
    ws.addEventListener("message", event => {
      try {
        const data = JSON.parse(event.data) as ChatMessage
        handlers.onMessage?.(data)
      } catch (error) {
        console.error("Failed to parse chat message:", error)
      }
    })
  }

  if (handlers.onError) {
    ws.addEventListener("error", handlers.onError)
  }

  if (handlers.onClose) {
    ws.addEventListener("close", handlers.onClose)
  }
}
