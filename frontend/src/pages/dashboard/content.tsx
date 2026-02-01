import { Skeleton } from "@/components/ui/skeleton"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { type ContentItem, type ContentPageProps } from "@/types/content"

export const ContentPage = ({ content, isLoading = false }: ContentPageProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="space-y-4">
            <Skeleton className="h-17 w-full rounded-md" />
            <Skeleton className="h-17 w-full rounded-md" />
            <Skeleton className="h-17 w-full rounded-md" />
            <Skeleton className="h-17 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!content || content.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <p className="text-muted-foreground">No content yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <ItemGroup className="gap-4">
          {content.map((item: ContentItem) => (
            <Item
              key={item.id}
              variant="outline"
              asChild
              role="listitem"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <a href="#">
                <ItemMedia variant="image">
                  <img
                    src={`https://avatar.vercel.sh/${item.title}`}
                    alt={item.title}
                    width={32}
                    height={32}
                    className="object-cover rounded grayscale"
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="line-clamp-1">
                    {item.title}
                    {item.topic && (
                      <span className="text-muted-foreground ml-2">• {item.topic}</span>
                    )}
                  </ItemTitle>
                  <div className="flex gap-2">
                    {item.date && <ItemDescription>{item.date}</ItemDescription>}
                    {item.duration && <ItemDescription>•</ItemDescription>}
                    {item.duration && <ItemDescription>{item.duration}</ItemDescription>}
                  </div>
                </ItemContent>
              </a>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </div>
  )
}
