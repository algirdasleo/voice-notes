export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  icon: string
  color: string
  created_at: string
  note_count: number
}

export interface ProjectCreate {
  name: string
  description?: string
  icon?: string
  color?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
  icon?: string
  color?: string
}

export interface ProjectNoteAction {
  note_ids: string[]
}

export interface ProjectsPageProps {
  projects?: Project[]
  isLoading?: boolean
  onProjectCreated?: () => void
  onProjectUpdated?: () => void
  onProjectDeleted?: () => void
}

export interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  project?: Project | null
}

export interface ProjectNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onChanged?: () => void
}

export const PROJECT_COLORS = [
  "blue",
  "red",
  "green",
  "purple",
  "pink",
  "cyan",
  "yellow",
  "orange",
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]

export const PROJECT_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  red: "bg-red-500/15 text-red-700 dark:text-red-400",
  green: "bg-green-500/15 text-green-700 dark:text-green-400",
  purple: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  cyan: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  yellow: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
}

export const PROJECT_DOT_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  red: "bg-red-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
}

export const PROJECT_ICONS: Record<string, string> = {
  Folder: "📁",
  Book: "📚",
  Briefcase: "💼",
  Code: "💻",
  Globe: "🌍",
  Heart: "❤️",
  Home: "🏠",
  Lightbulb: "💡",
  Music: "🎵",
  Rocket: "🚀",
  Star: "⭐",
  Target: "🎯",
  Zap: "⚡",
  Camera: "📷",
  Map: "🗺️",
  Gift: "🎁",
}

export function getProjectIcon(icon: string): string {
  return PROJECT_ICONS[icon] || "📁"
}

export const ICON_OPTIONS = Object.entries(PROJECT_ICONS).map(([value, emoji]) => ({
  value,
  label: `${emoji} ${value}`,
}))
