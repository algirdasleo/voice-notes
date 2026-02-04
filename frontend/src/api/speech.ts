import type { ApiResponse } from "@/types/api"
import type { TranscribeResponse } from "@/types/speech"

export async function transcribeAudio(audioFile: File): Promise<ApiResponse<TranscribeResponse>> {
  const formData = new FormData()
  formData.append("file", audioFile)

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/speech/transcribe`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  )

  const data = response.ok ? await response.json() : undefined

  if (!response.ok) {
    return {
      error: data?.detail || `HTTP ${response.status}`,
    }
  }

  return { data }
}
