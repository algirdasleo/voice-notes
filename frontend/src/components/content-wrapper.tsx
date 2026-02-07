import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { AppLayout } from "./app-layout"
import { ContentPage } from "@/pages/dashboard/content"
import { ContentCreateDialog } from "@/components/content-create-dialog"
import { type ContentItem } from "@/types/content"
import { getAllContent, getContentTypes, deleteContent } from "@/api/content"

const CONTENT_TYPE_COLORS: Record<string, string> = {
  "Meeting Report": "blue",
  "To-Do List": "green",
  Translate: "purple",
  "Blog Post": "pink",
  Email: "cyan",
  Summary: "yellow",
  "Custom Prompt": "red",
}

function getContentTypeBadgeColor(type: string) {
  return (CONTENT_TYPE_COLORS[type] || "default") as
    | "blue"
    | "green"
    | "purple"
    | "pink"
    | "cyan"
    | "yellow"
    | "red"
    | "default"
}

export function ContentPageWrapper() {
  const [content, setContent] = useState<ContentItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])

  // Fetch available content types once
  useEffect(() => {
    getContentTypes().then(setAvailableTypes).catch(console.error)
  }, [])

  const fetchContent = useCallback(async () => {
    setIsLoading(true)
    try {
      const contentList = await getAllContent(selectedType ?? undefined)
      setContent(contentList)
    } catch (error) {
      console.error("Failed to load content:", error)
      setContent(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedType])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const handleDelete = async (contentId: string) => {
    try {
      await deleteContent(contentId)
      setContent(prev => prev?.filter(c => c.id !== contentId) ?? null)
    } catch (error) {
      console.error("Failed to delete content:", error)
    }
  }

  return (
    <AppLayout
      breadcrumbs={[{ label: "Content" }]}
      headerAction={
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Generate content
        </Button>
      }
    >
      {/* Content type filter bar */}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 justify-center max-w-3xl mx-auto w-full">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          {availableTypes.map(type => {
            const isActive = selectedType === type
            return (
              <Badge
                key={type}
                variant={isActive ? getContentTypeBadgeColor(type) : "outline"}
                className={`text-xs cursor-pointer transition-colors ${
                  isActive ? "ring-1 ring-primary/30" : "hover:bg-accent"
                }`}
                onClick={() => setSelectedType(isActive ? null : type)}
              >
                {type}
                {isActive && <X className="size-3 ml-0.5" />}
              </Badge>
            )
          })}
          {selectedType && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setSelectedType(null)}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      <ContentPage content={content ?? undefined} isLoading={isLoading} onDelete={handleDelete} />
      <ContentCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onContentCreated={fetchContent}
      />
    </AppLayout>
  )
}
