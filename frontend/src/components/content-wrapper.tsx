import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppLayout } from "./app-layout"
import { ContentPage } from "@/pages/content"
import { type ContentItem } from "@/types/content"

const loadContent = async (): Promise<ContentItem[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          title: "Product Roadmap Discussion",
          topic: "Product Strategy",
          date: "Jan 28, 2026",
          duration: "12:45",
        },
        {
          id: "2",
          title: "Team Meeting Notes",
          topic: "General",
          date: "Jan 27, 2026",
          duration: "8:30",
        },
        {
          id: "3",
          title: "Client Feedback Session",
          topic: "Customer Insights",
          date: "Jan 26, 2026",
          duration: "15:20",
        },
        {
          id: "4",
          title: "Architecture Review",
          topic: "Technical",
          date: "Jan 25, 2026",
          duration: "22:15",
        },
      ])
    }, 1000)
  })
}

export function ContentPageWrapper() {
  const [content, setContent] = useState<ContentItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadContent().then(data => {
      setContent(data)
      setIsLoading(false)
    })
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
