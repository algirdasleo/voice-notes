import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { type ChatItem, type ChatPageProps } from "@/types/chat"

export const ChatPage = ({ chats = [] }: ChatPageProps) => {
  if (chats.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <p className="text-muted-foreground">No chats yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <ItemGroup className="gap-4">
          {chats.map((chat: ChatItem) => (
            <Item key={chat.id} variant="outline" asChild role="listitem">
              <a href={`/chat/${chat.id}`}>
                <ItemContent>
                  <ItemTitle className="line-clamp-1">{chat.title}</ItemTitle>
                  {chat.description && <ItemDescription>{chat.description}</ItemDescription>}
                </ItemContent>
              </a>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </div>
  )
}
