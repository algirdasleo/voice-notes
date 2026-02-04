import type { VoiceNote, VoiceNoteCreate, VoiceNoteUpdate } from "@/types/voice-note"
import type { ApiResponse } from "@/types/api"
import { apiFetch } from "./client"

export async function createNote(payload: VoiceNoteCreate): Promise<ApiResponse<VoiceNote>> {
  return apiFetch<VoiceNote>("/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getNotes(): Promise<ApiResponse<VoiceNote[]>> {
  return apiFetch<VoiceNote[]>("/notes")
}

export async function getNoteById(noteId: string): Promise<ApiResponse<VoiceNote>> {
  return apiFetch<VoiceNote>(`/notes/${noteId}`)
}

export async function updateNote(
  noteId: string,
  payload: VoiceNoteUpdate
): Promise<ApiResponse<VoiceNote>> {
  return apiFetch<VoiceNote>(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteNote(noteId: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/notes/${noteId}`, { method: "DELETE" })
}
