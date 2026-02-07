import { useState, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MicSelectorDemo } from "@/components/mic-selector-demo"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { type VoiceNote, type VoiceNotesPageProps, type CreationStep } from "@/types/voice-note"
import { getBadgeColor } from "@/lib/badge-utils"
import { transcribeAudio } from "@/api/speech"
import { createNote, suggestTags } from "@/api/notes"
import { X, Plus, Loader2, Save } from "lucide-react"

export const VoiceNotesPage = ({
  notes,
  isLoading = false,
  onNoteCreated,
}: VoiceNotesPageProps) => {
  const [step, setStep] = useState<CreationStep>("idle")
  const [transcription, setTranscription] = useState("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState("")
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setStep("transcribing")
    setError(null)
    setTranscription("")
    setSuggestedTags([])
    setSelectedTags([])
    setTitle("")

    try {
      const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" })
      const transcribeResult = await transcribeAudio(audioFile)

      if (transcribeResult.error || !transcribeResult.data) {
        setError(transcribeResult.error || "Transcription failed")
        setStep("idle")
        return
      }

      const text = transcribeResult.data.text
      setTranscription(text)

      // Generate a title from first few words
      const words = text.split(" ").slice(0, 5).join(" ")
      setTitle(words.length < text.length ? `${words}...` : words)

      setStep("review")

      // Fetch suggested tags in background
      const tagsResult = await suggestTags(text)
      if (tagsResult.data?.tags) {
        setSuggestedTags(tagsResult.data.tags)
      }
    } catch {
      setError("Something went wrong during transcription")
      setStep("idle")
    }
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase()
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
      setCustomTagInput("")
    }
  }

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addCustomTag()
    }
  }

  const handleSave = async () => {
    if (!transcription || !title) return
    setIsSaving(true)
    setError(null)

    try {
      const result = await createNote({
        title,
        transcription,
        tags: selectedTags,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Reset state
      setStep("idle")
      setTranscription("")
      setSuggestedTags([])
      setSelectedTags([])
      setTitle("")
      onNoteCreated?.()
    } catch {
      setError("Failed to save note")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setStep("idle")
    setTranscription("")
    setSuggestedTags([])
    setSelectedTags([])
    setTitle("")
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="space-y-4">
            <Skeleton className="h-17 w-full rounded-md" />
            <Skeleton className="h-17 w-full rounded-md" />
            <Skeleton className="h-17 w-full rounded-md" />
            <Skeleton className="h-17 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <div className="flex justify-center w-full flex-1">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          {/* Transcription / Review Panel */}
          {step === "transcribing" && (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-green-600" />
                <span className="text-green-600 font-medium text-sm">
                  Transcribing your voice note...
                </span>
              </div>
            </Card>
          )}

          {step === "review" && (
            <Card className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Note title"
                />
              </div>

              {/* Transcription */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Transcription</label>
                <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
                  {transcription}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tags</label>

                {/* Selected tags */}
                {selectedTags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedTags.map((tag, index) => (
                      <Badge
                        key={tag}
                        variant={getBadgeColor(index)}
                        className="text-xs cursor-pointer gap-1 pr-1"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        <X className="size-3" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggested tags */}
                {suggestedTags.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Suggested:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {suggestedTags
                        .filter(tag => !selectedTags.includes(tag))
                        .map(tag => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-accent"
                            onClick={() => toggleTag(tag)}
                          >
                            + {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {suggestedTags.length === 0 && step === "review" && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading suggested tags...</span>
                  </div>
                )}

                {/* Custom tag input */}
                <div className="flex gap-2">
                  <Input
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder="Add custom tag..."
                    className="h-8 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim()}
                    className="h-8"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving || !title.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Error for transcription failure */}
          {step === "idle" && error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Notes List */}
          {(!notes || notes.length === 0) && step === "idle" ? (
            <p className="text-muted-foreground">
              No notes yet. Record your first voice note below!
            </p>
          ) : (
            <ItemGroup className="gap-4">
              {notes?.map((note: VoiceNote) => (
                <Item
                  key={note.id}
                  variant="outline"
                  asChild
                  role="listitem"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 bg-sidebar"
                >
                  <a href="#">
                    <ItemMedia variant="image">
                      <img
                        src={`https://avatar.vercel.sh/${note.title}`}
                        alt={note.title}
                        width={32}
                        height={32}
                        className="object-cover rounded grayscale"
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="line-clamp-1">{note.title}</ItemTitle>
                      <div className="flex gap-2 mb-2">
                        {note.created_at && (
                          <ItemDescription>
                            {new Date(note.created_at).toLocaleDateString()}
                          </ItemDescription>
                        )}
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {note.tags.map((tag: string, index: number) => (
                            <Badge key={tag} variant={getBadgeColor(index)} className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </ItemContent>
                  </a>
                </Item>
              ))}
            </ItemGroup>
          )}
        </div>
      </div>

      {/* Recorder */}
      <div className="w-full mb-8">
        <MicSelectorDemo
          onRecordingComplete={handleRecordingComplete}
          disabled={step === "transcribing"}
        />
      </div>
    </div>
  )
}
