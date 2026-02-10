import type { Project, ProjectCreate, ProjectUpdate, ProjectNoteAction } from "@/types/projects"
import type { VoiceNote } from "@/types/voice-note"
import type { ApiResponse } from "@/types/api"
import { apiFetch } from "./client"

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  return apiFetch<Project[]>("/projects")
}

export async function createProject(payload: ProjectCreate): Promise<ApiResponse<Project>> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getProjectById(projectId: string): Promise<ApiResponse<Project>> {
  return apiFetch<Project>(`/projects/${projectId}`)
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpdate
): Promise<ApiResponse<Project>> {
  return apiFetch<Project>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteProject(projectId: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/projects/${projectId}`, { method: "DELETE" })
}

export async function getProjectNotes(projectId: string): Promise<ApiResponse<VoiceNote[]>> {
  return apiFetch<VoiceNote[]>(`/projects/${projectId}/notes`)
}

export async function addNotesToProject(
  projectId: string,
  noteIds: string[]
): Promise<ApiResponse<{ added: number }>> {
  const body: ProjectNoteAction = { note_ids: noteIds }
  return apiFetch<{ added: number }>(`/projects/${projectId}/notes`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function removeNotesFromProject(
  projectId: string,
  noteIds: string[]
): Promise<ApiResponse<{ removed: number }>> {
  const body: ProjectNoteAction = { note_ids: noteIds }
  return apiFetch<{ removed: number }>(`/projects/${projectId}/notes`, {
    method: "DELETE",
    body: JSON.stringify(body),
  })
}
