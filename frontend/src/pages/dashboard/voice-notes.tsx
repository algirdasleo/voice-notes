import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip"
import { MicSelectorDemo } from "@/components/mic-selector-demo"
import { type VoiceNote, type VoiceNotesPageProps, type CreationStep } from "@/types/voice-note"
import { getBadgeColor } from "@/lib/badge-utils"
import { transcribeAudio } from "@/api/speech"
import { createNote, suggestTags, getNoteById, updateNote, deleteNote } from "@/api/notes"
import {
  X,
  Plus,
  Loader2,
  Save,
  Mic,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Tag,
  FileText,
  ChevronRight,
} from "lucide-react"

const NOTE_EMOJIS = ["🎙️", "📝", "💡", "🗣️", "🎤", "✨", "📌", "🔖", "💬", "🧠"]

function getNoteEmoji(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  }
  return NOTE_EMOJIS[Math.abs(hash) % NOTE_EMOJIS.length]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export const VoiceNotesPage = ({
  notes,
  isLoading = false,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
}: VoiceNotesPageProps) => {
  // Creation state
  const [step, setStep] = useState<CreationStep>("idle")
  const [transcription, setTranscription] = useState("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState("")
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detail view state
  const [selectedNote, setSelectedNote] = useState<VoiceNote | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoadingNote, setIsLoadingNote] = useState(false)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editTranscription, setEditTranscription] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<VoiceNote | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Open note detail
  const handleOpenNote = useCallback(async (note: VoiceNote) => {
    setIsDetailOpen(true)
    setIsLoadingNote(true)
    setIsEditing(false)

    try {
      const result = await getNoteById(note.id)
      if (result.data) {
        setSelectedNote(result.data)
      } else {
        setSelectedNote(note)
      }
    } catch {
      setSelectedNote(note)
    } finally {
      setIsLoadingNote(false)
    }
  }, [])

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedNote(null)
    setIsEditing(false)
  }

  // Edit note
  const startEditing = () => {
    if (!selectedNote) return
    setEditTitle(selectedNote.title)
    setEditTranscription(selectedNote.transcription)
    setEditTags([...selectedNote.tags])
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const handleUpdateNote = async () => {
    if (!selectedNote) return
    setIsUpdating(true)

    try {
      const result = await updateNote(selectedNote.id, {
        title: editTitle,
        transcription: editTranscription,
        tags: editTags,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data) {
        setSelectedNote(result.data)
      }
      setIsEditing(false)
      onNoteUpdated?.()
    } catch {
      setError("Failed to update note")
    } finally {
      setIsUpdating(false)
    }
  }

  const addEditTag = () => {
    const tag = editTagInput.trim().toLowerCase()
    if (tag && !editTags.includes(tag)) {
      setEditTags(prev => [...prev, tag])
      setEditTagInput("")
    }
  }

  const removeEditTag = (tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag))
  }

  // Delete note
  const confirmDelete = (note: VoiceNote) => {
    setNoteToDelete(note)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteNote = async () => {
    if (!noteToDelete) return
    setIsDeleting(true)

    try {
      const result = await deleteNote(noteToDelete.id)
      if (result.error) {
        setError(result.error)
        return
      }

      setIsDeleteDialogOpen(false)
      setNoteToDelete(null)

      if (selectedNote?.id === noteToDelete.id) {
        handleCloseDetail()
      }

      onNoteDeleted?.()
    } catch {
      setError("Failed to delete note")
    } finally {
      setIsDeleting(false)
    }
  }

  // Recording & creation
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

      const words = text.split(" ").slice(0, 5).join(" ")
      setTitle(words.length < text.length ? `${words}...` : words)

      setStep("review")

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
        <div className="w-full max-w-3xl">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center w-full min-h-screen">
        <div className="flex justify-center w-full flex-1">
          <div className="flex w-full max-w-3xl flex-col gap-4">
            {/* Transcribing indicator */}
            <AnimatePresence>
              {step === "transcribing" && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
                          <div className="relative rounded-full bg-green-100 dark:bg-green-900 p-2">
                            <Loader2 className="size-4 animate-spin text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            Transcribing your voice note...
                          </p>
                          <p className="text-xs text-green-600/70 dark:text-green-400/70">
                            This may take a moment
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review Panel */}
            <AnimatePresence>
              {step === "review" && (
                <motion.div
                  initial={{ opacity: 0, y: -16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        New Voice Note
                      </CardTitle>
                      <CardDescription>Review and edit before saving</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Title
                        </label>
                        <Input
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          placeholder="Note title"
                        />
                      </div>

                      {/* Transcription */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Transcription
                        </label>
                        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed max-h-40 overflow-y-auto">
                          {transcription}
                        </div>
                      </div>

                      <Separator />

                      {/* Tags */}
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="size-3" />
                          Tags
                        </label>

                        {/* Selected tags */}
                        <AnimatePresence>
                          {selectedTags.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-1.5 flex-wrap"
                            >
                              {selectedTags.map((tag, index) => (
                                <motion.span
                                  key={tag}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  <Badge
                                    variant={getBadgeColor(index)}
                                    className="text-xs cursor-pointer gap-1 pr-1 hover:opacity-80 transition-opacity"
                                    onClick={() => toggleTag(tag)}
                                  >
                                    {tag}
                                    <X className="size-3" />
                                  </Badge>
                                </motion.span>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Suggested tags */}
                        {suggestedTags.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs text-muted-foreground">Suggested:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {suggestedTags
                                .filter(tag => !selectedTags.includes(tag))
                                .map(tag => (
                                  <motion.span
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="text-xs cursor-pointer hover:bg-accent transition-colors"
                                      onClick={() => toggleTag(tag)}
                                    >
                                      <Plus className="size-2.5 mr-0.5" />
                                      {tag}
                                    </Badge>
                                  </motion.span>
                                ))}
                            </div>
                          </div>
                        )}

                        {suggestedTags.length === 0 && step === "review" && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-3 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Loading suggested tags...
                            </span>
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
                      {error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-destructive"
                        >
                          {error}
                        </motion.p>
                      )}

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
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error for transcription failure */}
            <AnimatePresence>
              {step === "idle" && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-destructive/50 bg-destructive/10 p-3"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes List */}
            {(!notes || notes.length === 0) && step === "idle" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="rounded-full bg-muted p-4">
                  <Mic className="size-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold">No voice notes yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Record your first voice note using the microphone below
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {notes?.map((note: VoiceNote, idx: number) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      delay: idx * 0.04,
                    }}
                  >
                    <Card
                      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20 py-0"
                      onClick={() => handleOpenNote(note)}
                    >
                      <CardHeader className="pb-3 pt-5 px-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg shrink-0">{getNoteEmoji(note.title)}</span>
                            <CardTitle className="text-sm line-clamp-1">{note.title}</CardTitle>
                          </div>
                          <div onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleOpenNote(note)
                                    setTimeout(startEditing, 300)
                                  }}
                                >
                                  <Pencil className="size-3.5 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => confirmDelete(note)}
                                >
                                  <Trash2 className="size-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs mt-1">
                          {note.transcription.slice(0, 120)}
                          {note.transcription.length > 120 ? "..." : ""}
                        </CardDescription>
                      </CardHeader>
                      {note.tags && note.tags.length > 0 && (
                        <CardContent className="px-5 pb-0 pt-0">
                          <div className="flex gap-1 flex-wrap">
                            {note.tags.map((tag: string, index: number) => (
                              <Badge
                                key={tag}
                                variant={getBadgeColor(index)}
                                className="text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      )}
                      <CardFooter className="pt-0 pb-4 px-5 flex items-center justify-between">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              {timeAgo(note.created_at)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatDate(note.created_at)} at {formatTime(note.created_at)}
                          </TooltipContent>
                        </Tooltip>
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
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

      {/* Note Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0"
        >
          {isLoadingNote ? (
            <>
              <DialogTitle className="sr-only">Loading note details</DialogTitle>
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Separator />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </>
          ) : selectedNote ? (
            <>
              <DialogTitle
                className={!isEditing ? "text-lg leading-snug px-6 pt-6" : "text-base px-6 pt-6"}
              >
                {!isEditing ? selectedNote.title : "Edit Note"}
              </DialogTitle>
              <DialogHeader className="px-6 pt-0 pb-0">
                <DialogDescription
                  className={!isEditing ? "flex items-center gap-2 text-xs" : "text-sm"}
                >
                  {!isEditing ? (
                    <>
                      <Calendar className="size-3" />
                      {formatDate(selectedNote.created_at)} at {formatTime(selectedNote.created_at)}
                    </>
                  ) : (
                    "Make changes to your voice note"
                  )}
                </DialogDescription>
              </DialogHeader>

              <Separator className="mt-4" />

              <ScrollArea className="flex-1 overflow-y-auto px-6">
                <div className="py-4 space-y-5">
                  {!isEditing ? (
                    <>
                      {/* Tags */}
                      {selectedNote.tags && selectedNote.tags.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="size-3" />
                            Tags
                          </label>
                          <div className="flex gap-1.5 flex-wrap">
                            {selectedNote.tags.map((tag: string, index: number) => (
                              <Badge key={tag} variant={getBadgeColor(index)} className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transcription */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="size-3" />
                          Transcription
                        </label>
                        <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {selectedNote.transcription}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Edit Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Title
                        </label>
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Note title"
                        />
                      </div>

                      {/* Edit Transcription */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Transcription
                        </label>
                        <Textarea
                          value={editTranscription}
                          onChange={e => setEditTranscription(e.target.value)}
                          className="min-h-32 text-sm"
                        />
                      </div>

                      {/* Edit Tags */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="size-3" />
                          Tags
                        </label>

                        <div className="flex gap-1.5 flex-wrap">
                          {editTags.map((tag, index) => (
                            <Badge
                              key={tag}
                              variant={getBadgeColor(index)}
                              className="text-xs cursor-pointer gap-1 pr-1"
                              onClick={() => removeEditTag(tag)}
                            >
                              {tag}
                              <X className="size-3" />
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={editTagInput}
                            onChange={e => setEditTagInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addEditTag()
                              }
                            }}
                            placeholder="Add tag..."
                            className="h-8 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addEditTag}
                            disabled={!editTagInput.trim()}
                            className="h-8"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <DialogFooter className="px-6 py-4 sm:justify-start">
                {!isEditing ? (
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={startEditing}>
                      <Pencil className="size-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => confirmDelete(selectedNote)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleUpdateNote}
                      disabled={isUpdating || !editTitle.trim()}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-3.5 mr-1.5" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Voice Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{noteToDelete?.title}&rdquo;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNote} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
