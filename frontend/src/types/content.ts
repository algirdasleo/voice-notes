export interface ContentItem {
  id: string
  title: string
  topic?: string
  date?: string
  duration?: string
}

export interface ContentPageProps {
  content?: ContentItem[]
  isLoading?: boolean
}
