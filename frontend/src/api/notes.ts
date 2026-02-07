import type {
  VoiceNote,
  VoiceNoteCreate,
  VoiceNoteUpdate,
  SuggestTagsResponse,
} from "@/types/voice-note"
import type { ApiResponse } from "@/types/api"
import { apiFetch } from "./client"

export async function createNote(payload: VoiceNoteCreate): Promise<ApiResponse<VoiceNote>> {
  return apiFetch<VoiceNote>("/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getNotes(tag?: string): Promise<ApiResponse<VoiceNote[]>> {
  const params = new URLSearchParams()
  if (tag) params.set("tag", tag)
  const query = params.toString()
  return apiFetch<VoiceNote[]>(`/notes${query ? `?${query}` : ""}`)
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

export async function suggestTags(text: string): Promise<ApiResponse<SuggestTagsResponse>> {
  return apiFetch<SuggestTagsResponse>("/notes/suggest-tags", {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}
