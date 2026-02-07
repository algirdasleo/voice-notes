import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppLayout } from "./app-layout"
import { VoiceNotesPage } from "@/pages/dashboard/voice-notes"
import { type VoiceNote } from "@/types/voice-note"
import { getNotes } from "@/api/notes"

export function VoiceNotesPageWrapper() {
  const [notes, setNotes] = useState<VoiceNote[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getNotes()
      setNotes(response.data || null)
    } catch (error) {
      console.error("Failed to load notes:", error)
      setNotes(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

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
      <VoiceNotesPage
        notes={notes ?? undefined}
        isLoading={isLoading}
        onNoteCreated={fetchNotes}
        onNoteUpdated={fetchNotes}
        onNoteDeleted={fetchNotes}
      />
    </AppLayout>
  )
}
