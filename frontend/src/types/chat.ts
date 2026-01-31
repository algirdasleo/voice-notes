export interface ChatItem {
  id: string
  title: string
  description?: string
  duration?: string
}

export interface ChatPageProps {
  chats?: ChatItem[]
}
