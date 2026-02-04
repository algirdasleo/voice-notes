import { useEffect, useState } from "react"
import { AppLayout } from "./app-layout"
import { ChatPage } from "@/pages/dashboard/chat"
import { fetchChats } from "@/api/chat"
import type { ChatItem } from "@/types/chat"

export function ChatPageWrapper() {
  const [chats, setChats] = useState<ChatItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadChats = async () => {
      try {
        const loadedChats = await fetchChats()
        setChats(loadedChats)
      } catch (error) {
        console.error("Failed to load chats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChats()
  }, [])

  return (
    <AppLayout breadcrumbs={[{ label: "Chats" }]}>
      <ChatPage chats={chats} isLoading={isLoading} />
    </AppLayout>
  )
}
