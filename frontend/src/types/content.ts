export interface ContentItem {
  id: string
  note_id: string
  user_id: string
  title: string
  content_type: string
  body: string
  created_at: string
}

export interface ContentCreate {
  note_id: string
  title: string
  content_type: string
  body: string
}

export interface ContentUpdate {
  title?: string
  content_type?: string
  body?: string
}

export interface ContentPageProps {
  content?: ContentItem[]
  isLoading?: boolean
}
