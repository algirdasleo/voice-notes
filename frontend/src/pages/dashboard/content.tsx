import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Calendar, ChevronRight, ClipboardCopy, FileText, Trash2 } from "lucide-react"
import { type ContentItem, type ContentPageProps } from "@/types/content"

const CONTENT_TYPE_CONFIG: Record<string, { color: string; icon: string }> = {
  "Meeting Report": { color: "blue", icon: "📋" },
  "To-Do List": { color: "green", icon: "✅" },
  Translate: { color: "purple", icon: "🌐" },
  "Blog Post": { color: "pink", icon: "✍️" },
  Email: { color: "cyan", icon: "📧" },
  Summary: { color: "yellow", icon: "📝" },
  "Custom Prompt": { color: "red", icon: "⚡" },
}

function getContentTypeColor(type: string) {
  return (CONTENT_TYPE_CONFIG[type]?.color || "default") as
    | "blue"
    | "green"
    | "purple"
    | "pink"
    | "cyan"
    | "yellow"
    | "red"
    | "default"
}

function getContentTypeIcon(type: string) {
  return CONTENT_TYPE_CONFIG[type]?.icon || "📄"
}

export const ContentPage = ({ content, isLoading = false, onDelete }: ContentPageProps) => {
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = (contentId: string) => {
    onDelete?.(contentId)
    setDeleteConfirmId(null)
    if (selectedContent?.id === contentId) {
      setSelectedContent(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-3xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!content || content.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BookOpen className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No content yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generate your first piece of content by selecting voice notes and choosing a content
              type.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          {content.map((item: ContentItem) => (
            <Card
              key={item.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20 py-0"
              onClick={() => setSelectedContent(item)}
            >
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">
                      {getContentTypeIcon(item.content_type)}
                    </span>
                    <CardTitle className="text-sm line-clamp-1">{item.title}</CardTitle>
                  </div>
                  <Badge
                    variant={getContentTypeColor(item.content_type)}
                    className="shrink-0 text-[10px]"
                  >
                    {item.content_type}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs mt-1">
                  {item.body.replace(/[#*_`>-]/g, "").slice(0, 120)}...
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 pb-4 px-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="size-3" />
                    <span className="truncate max-w-25">{item.note.title}</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Content Detail Dialog */}
        <Dialog open={!!selectedContent} onOpenChange={open => !open && setSelectedContent(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh]">
            {selectedContent && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getContentTypeIcon(selectedContent.content_type)}
                    </span>
                    <DialogTitle>{selectedContent.title}</DialogTitle>
                  </div>
                  <DialogDescription className="flex items-center gap-3 pt-1">
                    <Badge variant={getContentTypeColor(selectedContent.content_type)}>
                      {selectedContent.content_type}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="size-3" />
                      {new Date(selectedContent.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <FileText className="size-3" />
                      {selectedContent.note.title}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh] rounded-md border bg-muted/30 p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedContent.body}
                  </div>
                </ScrollArea>
                <DialogFooter className="flex-row justify-between sm:justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      setDeleteConfirmId(selectedContent.id)
                    }}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedContent.body)}
                  >
                    <ClipboardCopy className="size-4 mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Content</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this content? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
