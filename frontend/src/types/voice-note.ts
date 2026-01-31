export interface VoiceNote {
  id: string
  title: string
  topic?: string
  date?: string
  duration: string
  tags?: string[]
}

export interface VoiceNotesPageProps {
  notes?: VoiceNote[]
  isLoading?: boolean
}
