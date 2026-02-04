import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppLayout } from "./app-layout"
import { ContentPage } from "@/pages/dashboard/content"
import { type ContentItem } from "@/types/content"
import { getAllContent } from "@/api/content"

export function ContentPageWrapper() {
  const [content, setContent] = useState<ContentItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const contentList = await getAllContent()
        setContent(contentList)
      } catch (error) {
        console.error("Failed to load content:", error)
        setContent(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [])

  return (
    <AppLayout
      breadcrumbs={[{ label: "Content" }]}
      headerAction={
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <Plus className="size-4 mr-2" />
          Create new
        </Button>
      }
    >
      <ContentPage content={content ?? undefined} isLoading={isLoading} />
    </AppLayout>
  )
}
