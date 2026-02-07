import type {
  ContentItem,
  ContentCreate,
  ContentUpdate,
  ContentGenerateRequest,
} from "@/types/content"
import type { ApiResponse } from "@/types/api"
import { apiFetch } from "./client"

export async function getAllContent(): Promise<ContentItem[]> {
  const response = await apiFetch<ContentItem[]>("/content")
  return response.data || []
}

export async function getContentTypes(): Promise<string[]> {
  const response = await apiFetch<string[]>("/content/types")
  return response.data || []
}

export async function generateContent(
  payload: ContentGenerateRequest
): Promise<ApiResponse<ContentItem>> {
  return apiFetch<ContentItem>("/content/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function createContent(payload: ContentCreate): Promise<ApiResponse<ContentItem>> {
  return apiFetch<ContentItem>("/content", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getContentByNoteId(noteId: string): Promise<ApiResponse<ContentItem[]>> {
  return apiFetch<ContentItem[]>(`/content/${noteId}`)
}

export async function updateContent(
  contentId: string,
  payload: ContentUpdate
): Promise<ApiResponse<ContentItem>> {
  return apiFetch<ContentItem>(`/content/${contentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteContent(contentId: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/content/${contentId}`, { method: "DELETE" })
}
