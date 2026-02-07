export interface ContentItem {
  id: string
  title: string
  content_type: string
  body: string
  created_at: string
  note: {
    id: string
    title: string
    transcription: string
  }
}

export interface ContentCreate {
  note_id: string
  title: string
  content_type: string
  body: string
}

export interface ContentGenerateRequest {
  note_ids: string[]
  content_type: string
}

export interface ContentUpdate {
  title?: string
  content_type?: string
  body?: string
}

export interface ContentPageProps {
  content?: ContentItem[]
  isLoading?: boolean
  onCreateClick?: () => void
  onDelete?: (contentId: string) => void
}
