import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppLayout } from "./app-layout"
import { VoiceNotesPage } from "@/pages/voice-notes"

const loadVoiceNotes = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          title: "Morning Standup",
          topic: "Team Sync",
          date: "Jan 28, 2026",
          duration: "5:30",
          tags: ["standup", "quick-sync"],
        },
        {
          id: "2",
          title: "Client Call Notes",
          topic: "Business",
          date: "Jan 27, 2026",
          duration: "18:45",
          tags: ["client", "important"],
        },
        {
          id: "3",
          title: "Feature Brainstorm",
          topic: "Development",
          date: "Jan 26, 2026",
          duration: "25:10",
          tags: ["feature", "ideas"],
        },
      ])
    }, 1000)
  })
}

export function VoiceNotesPageWrapper() {
  const [notes, setNotes] = useState<Array<{
    id: string
    title: string
    topic?: string
    date?: string
    duration: string
    tags?: string[]
  }> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadVoiceNotes().then(data => {
      setNotes(data as typeof notes)
      setIsLoading(false)
    })
  }, [])

  return (
    <AppLayout
      breadcrumbs={[{ label: "Voice Notes" }]}
      headerAction={
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <Plus className="size-4 mr-2" />
          Create new
        </Button>
      }
    >
      <VoiceNotesPage notes={notes ?? undefined} isLoading={isLoading} />
    </AppLayout>
  )
}
