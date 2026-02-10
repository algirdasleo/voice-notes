import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import {
  type ProjectCreate,
  type ProjectUpdate,
  type ProjectFormDialogProps,
  PROJECT_COLORS,
  PROJECT_DOT_COLOR_MAP,
  ICON_OPTIONS,
} from "@/types/projects"
import { createProject, updateProject } from "@/api/projects"

export function ProjectFormDialog({
  open,
  onOpenChange,
  onSuccess,
  project,
}: ProjectFormDialogProps) {
  const isEditing = !!project
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("Folder")
  const [color, setColor] = useState("blue")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name)
        setDescription(project.description)
        setIcon(project.icon)
        setColor(project.color)
      } else {
        setName("")
        setDescription("")
        setIcon("Folder")
        setColor("blue")
      }
      setError(null)
    }
  }, [open, project])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing && project) {
        const payload: ProjectUpdate = { name: name.trim(), description, icon, color }
        const { error: apiError } = await updateProject(project.id, payload)
        if (apiError) throw new Error(apiError)
      } else {
        const payload: ProjectCreate = { name: name.trim(), description, icon, color }
        const { error: apiError } = await createProject(payload)
        if (apiError) throw new Error(apiError)
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your project details."
              : "Create a new project to organize your voice notes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Work Ideas, Travel Plans..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              placeholder="A short description of this project..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIcon(opt.value)}
                  className={`flex items-center justify-center size-9 rounded-md text-lg transition-all ${
                    icon === opt.value ? "bg-primary/10 ring-2 ring-primary/50" : "hover:bg-accent"
                  }`}
                  title={opt.value}
                >
                  {opt.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full transition-all ${PROJECT_DOT_COLOR_MAP[c] || "bg-gray-400"} ${
                    color === c ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-110"
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
