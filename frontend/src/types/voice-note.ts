export interface VoiceNote {
  id: string
  user_id: string
  title: string
  transcription: string
  tags: string[]
  created_at: string
}

export interface VoiceNoteCreate {
  title: string
  transcription: string
  tags?: string[]
}

export interface VoiceNoteUpdate {
  title?: string
  transcription?: string
  tags?: string[]
}

export interface SuggestTagsResponse {
  tags: string[]
}

export interface VoiceNotesPageProps {
  notes?: VoiceNote[]
  isLoading?: boolean
  onNoteCreated?: () => void
  onNoteUpdated?: () => void
  onNoteDeleted?: () => void
}

export type CreationStep = "idle" | "transcribing" | "review"
