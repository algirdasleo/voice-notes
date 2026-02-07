import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { AppLayout } from "./app-layout"
import { VoiceNotesPage } from "@/pages/dashboard/voice-notes"
import { type VoiceNote } from "@/types/voice-note"
import { getNotes } from "@/api/notes"
import { getBadgeColor } from "@/lib/badge-utils"

export function VoiceNotesPageWrapper() {
  const [notes, setNotes] = useState<VoiceNote[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getNotes(selectedTag ?? undefined)
      setNotes(response.data || null)
    } catch (error) {
      console.error("Failed to load notes:", error)
      setNotes(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTag])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Collect all unique tags from loaded notes (unfiltered fetch for tag list)
  const [allNotes, setAllNotes] = useState<VoiceNote[]>([])

  useEffect(() => {
    // Fetch all notes once (without filter) to build the tag list
    let cancelled = false
    getNotes().then(res => {
      if (!cancelled && res.data) setAllNotes(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [notes]) // re-fetch tag list whenever filtered notes change (e.g. after create/delete)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    allNotes.forEach(n => n.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [allNotes])

  return (
    <AppLayout breadcrumbs={[{ label: "Voice Notes" }]} showBeams>
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 justify-center max-w-3xl mx-auto w-full">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          {allTags.map((tag, index) => {
            const isActive = selectedTag === tag
            return (
              <Badge
                key={tag}
                variant={isActive ? getBadgeColor(index) : "outline"}
                className={`text-xs cursor-pointer transition-colors ${
                  isActive ? "ring-1 ring-primary/30" : "hover:bg-accent"
                }`}
                onClick={() => setSelectedTag(isActive ? null : tag)}
              >
                {tag}
                {isActive && <X className="size-3 ml-0.5" />}
              </Badge>
            )
          })}
          {selectedTag && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setSelectedTag(null)}
            >
              Clear
            </Button>
          )}
        </div>
      )}

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
