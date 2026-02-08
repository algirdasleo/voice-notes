import type { ChatMessage, ChatRequest, ChatWebSocketHandlers } from "@/types/chat"
import { apiFetch } from "./client"

export async function createChatWebSocket(): Promise<WebSocket> {
  // 1. Get a short-lived ticket via the authenticated HTTP endpoint
  const res = await apiFetch<{ ticket: string }>("/chat/ws-ticket", { method: "POST" })
  if (!res.data?.ticket) {
    throw new Error("Failed to obtain WebSocket ticket")
  }

  // 2. Open the WebSocket with the ticket as a query param
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
  const wsUrl = apiUrl.replace(/^http/, "ws")
  const url = new URL(`${wsUrl}/chat/ws`)
  url.searchParams.append("ticket", res.data.ticket)

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
  if (!ws) return

  // Send a graceful close message if the socket is open
  if (ws.readyState === WebSocket.OPEN) {
    const closeMessage: ChatRequest = { type: "close" }
    ws.send(JSON.stringify(closeMessage))
  }

  // Close sockets that are either OPEN or still CONNECTING
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close()
  }
}

export function setupChatWebSocketListeners(ws: WebSocket, handlers: ChatWebSocketHandlers): void {
  if (handlers.onOpen) {
    ws.addEventListener("open", handlers.onOpen)
  }

  ws.addEventListener("message", event => {
    try {
      const data = JSON.parse(event.data) as ChatMessage

      // Handle streaming tokens
      if (data.type === "token" && handlers.onToken) {
        handlers.onToken(data.content)
        return
      }

      // Handle stream end
      if (data.type === "end" && handlers.onStreamEnd) {
        handlers.onStreamEnd()
        return
      }

      // Forward all other messages to the general handler
      handlers.onMessage?.(data)
    } catch (error) {
      console.error("Failed to parse chat message:", error)
    }
  })

  if (handlers.onError) {
    ws.addEventListener("error", handlers.onError)
  }

  if (handlers.onClose) {
    ws.addEventListener("close", handlers.onClose)
  }
}
