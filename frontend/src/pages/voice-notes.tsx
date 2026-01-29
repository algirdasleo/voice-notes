import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MicSelectorDemo } from "@/components/mic-selector-demo"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

interface VoiceNote {
  id: string
  title: string
  topic?: string
  date?: string
  duration: string
  tags?: string[]
}

const BADGE_COLORS = ["blue", "green", "red", "purple", "yellow", "pink", "cyan"] as const

const getBadgeColor = (tag: string, index: number) => {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}

export const VoiceNotesPage = ({ notes, isLoading = false }: VoiceNotesPageProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <p className="text-muted-foreground">No notes yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <div className="flex justify-center w-full flex-1">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <ItemGroup className="gap-4">
            {notes.map(note => (
              <Item
                key={note.id}
                variant="outline"
                asChild
                role="listitem"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <a href="#">
                  <ItemMedia variant="image">
                    <img
                      src={`https://avatar.vercel.sh/${note.title}`}
                      alt={note.title}
                      width={32}
                      height={32}
                      className="object-cover rounded grayscale"
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="line-clamp-1">
                      {note.title}
                      {note.topic && (
                        <span className="text-muted-foreground ml-2">• {note.topic}</span>
                      )}
                    </ItemTitle>
                    <div className="flex gap-2 mb-2">
                      {note.date && <ItemDescription>{note.date}</ItemDescription>}
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {note.tags.map((tag, index) => (
                          <Badge
                            key={tag}
                            variant={getBadgeColor(tag, index) as any}
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </ItemContent>
                  <ItemContent className="flex-none text-center">
                    <ItemDescription>{note.duration}</ItemDescription>
                  </ItemContent>
                </a>
              </Item>
            ))}
          </ItemGroup>
        </div>
      </div>
      <div className="w-full mb-8">
        <MicSelectorDemo />
      </div>
    </div>
  )
}
