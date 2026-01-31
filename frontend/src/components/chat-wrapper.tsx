import { AppLayout } from "./app-layout"
import { ChatPage } from "@/pages/dashboard/chat"

export function ChatPageWrapper() {
  return (
    <AppLayout breadcrumbs={[{ label: "Chats" }]}>
      <ChatPage />
    </AppLayout>
  )
}
