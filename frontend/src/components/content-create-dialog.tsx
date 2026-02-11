import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Sparkles } from "lucide-react"
import { type VoiceNote } from "@/types/voice-note"
import { type ContentGenerateRequest } from "@/types/content"
import { getNotes } from "@/api/notes"
import { generateContent } from "@/api/content"
import { getBadgeColor } from "@/lib/badge-utils"

const CONTENT_TYPES = [
  { label: "📋 Meeting Report", value: "Meeting Report" },
  { label: "✅ To-Do List", value: "To-Do List" },
  { label: "🌐 Translate", value: "Translate" },
  { label: "✍️ Blog Post", value: "Blog Post" },
  { label: "📧 Email", value: "Email" },
  { label: "📝 Summary", value: "Summary" },
  { label: "⚡ Custom Prompt", value: "Custom Prompt" },
]

interface ContentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContentCreated?: () => void
}

export function ContentCreateDialog({
  open,
  onOpenChange,
  onContentCreated,
}: ContentCreateDialogProps) {
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set())
  const [contentType, setContentType] = useState<string>("")
  const [targetLanguage, setTargetLanguage] = useState<string>("")
  const [customPrompt, setCustomPrompt] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedNoteIds(new Set())
      setContentType("")
      setTargetLanguage("")
      setCustomPrompt("")
      setError(null)
      loadNotes()
    }
  }, [open])

  const loadNotes = async () => {
    setIsLoadingNotes(true)
    try {
      const response = await getNotes()
      setNotes(response.data || [])
    } catch {
      setError("Failed to load voice notes")
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const toggleNote = (noteId: string) => {
    setSelectedNoteIds(prev => {
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
    if (selectedNoteIds.size === notes.length) {
      setSelectedNoteIds(new Set())
    } else {
      setSelectedNoteIds(new Set(notes.map(n => n.id)))
    }
  }

  const handleGenerate = async () => {
    if (selectedNoteIds.size === 0 || !contentType) return

    setIsGenerating(true)
    setError(null)

    const payload: ContentGenerateRequest = {
      note_ids: Array.from(selectedNoteIds),
      content_type: contentType,
      ...(contentType === "Translate" && targetLanguage ? { target_language: targetLanguage } : {}),
      ...(contentType === "Custom Prompt" && customPrompt ? { custom_prompt: customPrompt } : {}),
    }

    try {
      const response = await generateContent(payload)
      if (response.error) {
        setError(response.error)
      } else {
        onOpenChange(false)
        onContentCreated?.()
      }
    } catch {
      setError("Failed to generate content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate =
    selectedNoteIds.size > 0 &&
    contentType !== "" &&
    (contentType !== "Translate" || targetLanguage.trim() !== "") &&
    (contentType !== "Custom Prompt" || customPrompt.trim() !== "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Generate Content
          </DialogTitle>
          <DialogDescription>
            Select voice notes and a content type to generate AI-powered content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 overflow-y-auto min-h-0 flex-1">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content Type</label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select content type..." />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Translation Language Input */}
          {contentType === "Translate" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Language</label>
              <Input
                placeholder="e.g. Spanish, French, German..."
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              />
            </div>
          )}

          {/* Custom Prompt Input */}
          {contentType === "Custom Prompt" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Prompt</label>
              <Textarea
                placeholder="Describe what you want to generate..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Voice Notes Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Voice Notes{" "}
                {selectedNoteIds.size > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({selectedNoteIds.size} selected)
                  </span>
                )}
              </label>
              {notes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={toggleAll}
                >
                  {selectedNoteIds.size === notes.length ? "Deselect all" : "Select all"}
                </Button>
              )}
            </div>

            {isLoadingNotes ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-md" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No voice notes available. Create some notes first.
              </p>
            ) : (
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-1">
                  {notes.map(note => {
                    const isSelected = selectedNoteIds.has(note.id)
                    return (
                      <label
                        key={note.id}
                        className={`flex items-start gap-3 rounded-md p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                          isSelected ? "bg-accent/30" : ""
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleNote(note.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">{note.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1.5">
                              {note.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={tag}
                                  variant={getBadgeColor(index)}
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
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
