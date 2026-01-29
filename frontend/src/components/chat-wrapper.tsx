import { AppLayout } from "./app-layout"
import { ChatPage } from "@/pages/chat"

export function ChatPageWrapper() {
  return (
    <AppLayout breadcrumbs={[{ label: "Chats" }]}>
      <ChatPage />
    </AppLayout>
  )
}
