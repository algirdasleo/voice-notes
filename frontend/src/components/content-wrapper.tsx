import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppLayout } from "./app-layout"
import { ContentPage } from "@/pages/dashboard/content"
import { ContentCreateDialog } from "@/components/content-create-dialog"
import { type ContentItem } from "@/types/content"
import { getAllContent, deleteContent } from "@/api/content"

export function ContentPageWrapper() {
  const [content, setContent] = useState<ContentItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const fetchContent = useCallback(async () => {
    setIsLoading(true)
    try {
      const contentList = await getAllContent()
      setContent(contentList)
    } catch (error) {
      console.error("Failed to load content:", error)
      setContent(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
      <ContentPage content={content ?? undefined} isLoading={isLoading} onDelete={handleDelete} />
      <ContentCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onContentCreated={fetchContent}
      />
    </AppLayout>
  )
}
