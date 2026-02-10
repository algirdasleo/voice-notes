import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Loader2, Search, StickyNote } from "lucide-react"
import { type ProjectNotesDialogProps, PROJECT_DOT_COLOR_MAP } from "@/types/projects"
import { type VoiceNote } from "@/types/voice-note"
import { getNotes } from "@/api/notes"
import { getProjectNotes, addNotesToProject, removeNotesFromProject } from "@/api/projects"
import { getBadgeColor } from "@/lib/badge-utils"

export function ProjectNotesDialog({
  open,
  onOpenChange,
  project,
  onChanged,
}: ProjectNotesDialogProps) {
  const [allNotes, setAllNotes] = useState<VoiceNote[]>([])
  const [assignedNoteIds, setAssignedNoteIds] = useState<Set<string>>(new Set())
  const [originalAssignedIds, setOriginalAssignedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (open && project) {
      setSearchQuery("")
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project])

  const loadData = async () => {
    if (!project) return
    setIsLoading(true)
    try {
      const [notesRes, assignedRes] = await Promise.all([getNotes(), getProjectNotes(project.id)])
      setAllNotes(notesRes.data || [])
      const assignedIds = new Set((assignedRes.data || []).map(n => n.id))
      setAssignedNoteIds(assignedIds)
      setOriginalAssignedIds(new Set(assignedIds))
    } catch {
      console.error("Failed to load notes")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return allNotes
    const q = searchQuery.toLowerCase()
    return allNotes.filter(
      n =>
        n.title.toLowerCase().includes(q) ||
        n.transcription.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [allNotes, searchQuery])

  const toggleNote = (noteId: string) => {
    setAssignedNoteIds(prev => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const toggleAll = () => {
    const filteredIds = filteredNotes.map(n => n.id)
    const allSelected = filteredIds.every(id => assignedNoteIds.has(id))
    setAssignedNoteIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        filteredIds.forEach(id => next.delete(id))
      } else {
        filteredIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const hasChanges = useMemo(() => {
    if (assignedNoteIds.size !== originalAssignedIds.size) return true
    for (const id of assignedNoteIds) {
      if (!originalAssignedIds.has(id)) return true
    }
    return false
  }, [assignedNoteIds, originalAssignedIds])

  const handleSave = async () => {
    if (!project || !hasChanges) return
    setIsSaving(true)

    try {
      // Find notes to add and remove
      const toAdd = [...assignedNoteIds].filter(id => !originalAssignedIds.has(id))
      const toRemove = [...originalAssignedIds].filter(id => !assignedNoteIds.has(id))

      if (toAdd.length > 0) {
        await addNotesToProject(project.id, toAdd)
      }
      if (toRemove.length > 0) {
        await removeNotesFromProject(project.id, toRemove)
      }

      onOpenChange(false)
      onChanged?.()
    } catch {
      console.error("Failed to update project notes")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`size-2.5 rounded-full ${PROJECT_DOT_COLOR_MAP[project?.color ?? "blue"] || "bg-blue-500"}`}
            />
            Manage Notes — {project?.name}
          </DialogTitle>
          <DialogDescription>
            Select the voice notes you want to include in this project.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Note list */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {/* Select all */}
            {filteredNotes.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  checked={
                    filteredNotes.length > 0 && filteredNotes.every(n => assignedNoteIds.has(n.id))
                  }
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({filteredNotes.length})
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {assignedNoteIds.size} selected
                </span>
              </div>
            )}

            <ScrollArea className="max-h-75 pr-3">
              <div className="space-y-1">
                {filteredNotes.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <StickyNote className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No notes match your search" : "No notes available"}
                    </p>
                  </div>
                ) : (
                  filteredNotes.map(note => (
                    <label
                      key={note.id}
                      className="flex items-start gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={assignedNoteIds.has(note.id)}
                        onCheckedChange={() => toggleNote(note.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {note.transcription}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {note.tags.slice(0, 3).map((tag, i) => (
                              <Badge
                                key={tag}
                                variant={getBadgeColor(i)}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save ({assignedNoteIds.size} notes)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
