import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FolderOpen,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  StickyNote,
} from "lucide-react"
import {
  type Project,
  type ProjectsPageProps,
  PROJECT_DOT_COLOR_MAP,
  getProjectIcon,
} from "@/types/projects"

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export const ProjectsPage = ({
  projects,
  isLoading = false,
  onEditProject,
  onManageNotes,
  onDeleteProject,
}: ProjectsPageProps & {
  onEditProject?: (project: Project) => void
  onManageNotes?: (project: Project) => void
  onDeleteProject?: (projectId: string) => void
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleDelete = (projectId: string) => {
    onDeleteProject?.(projectId)
    setDeleteConfirmId(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-3xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FolderOpen className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create your first project to start organizing your voice notes into meaningful groups.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const projectToDelete = projects.find(p => p.id === deleteConfirmId)

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project: Project) => (
            <Card
              key={project.id}
              className="group relative cursor-pointer transition-all hover:shadow-md"
              onClick={() => onManageNotes?.(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg text-lg ${
                        PROJECT_DOT_COLOR_MAP[project.color]
                          ? `${PROJECT_DOT_COLOR_MAP[project.color]}/10`
                          : "bg-muted"
                      }`}
                    >
                      {getProjectIcon(project.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1 text-xs line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          onEditProject?.(project)
                        }}
                      >
                        <Pencil className="size-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          onManageNotes?.(project)
                        }}
                      >
                        <StickyNote className="size-4 mr-2" />
                        Manage Notes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={e => {
                          e.stopPropagation()
                          setDeleteConfirmId(project.id)
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardFooter className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div
                      className={`size-2 rounded-full ${PROJECT_DOT_COLOR_MAP[project.color] || "bg-blue-500"}`}
                    />
                    {project.color}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="size-3" />
                    {project.note_count} {project.note_count === 1 ? "note" : "notes"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(project.created_at)}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{projectToDelete?.name}"? Your voice notes will not
                be deleted, only the project grouping will be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
