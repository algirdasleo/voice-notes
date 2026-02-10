import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppLayout } from "./app-layout"
import { ProjectsPage } from "@/pages/dashboard/projects"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { ProjectNotesDialog } from "@/components/project-notes-dialog"
import { type Project } from "@/types/projects"
import { getProjects, deleteProject } from "@/api/projects"

export function ProjectsPageWrapper() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [managingProject, setManagingProject] = useState<Project | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getProjects()
      if (error) throw new Error(error)
      setProjects(data || [])
    } catch (error) {
      console.error("Failed to load projects:", error)
      setProjects(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      setProjects(prev => prev?.filter(p => p.id !== projectId) ?? null)
    } catch (error) {
      console.error("Failed to delete project:", error)
    }
  }

  return (
    <AppLayout
      breadcrumbs={[{ label: "Projects" }]}
      headerAction={
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          New project
        </Button>
      }
    >
      <ProjectsPage
        projects={projects ?? undefined}
        isLoading={isLoading}
        onProjectCreated={fetchProjects}
        onProjectUpdated={fetchProjects}
        onProjectDeleted={fetchProjects}
        onEditProject={project => setEditingProject(project)}
        onManageNotes={project => setManagingProject(project)}
        onDeleteProject={handleDelete}
      />

      {/* Create dialog */}
      <ProjectFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchProjects}
      />

      {/* Edit dialog */}
      <ProjectFormDialog
        open={!!editingProject}
        onOpenChange={open => !open && setEditingProject(null)}
        project={editingProject}
        onSuccess={fetchProjects}
      />

      {/* Manage notes dialog */}
      <ProjectNotesDialog
        open={!!managingProject}
        onOpenChange={open => !open && setManagingProject(null)}
        project={managingProject}
        onChanged={fetchProjects}
      />
    </AppLayout>
  )
}
