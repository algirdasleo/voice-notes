import type { ApiResponse } from "@/types/api"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    const data = await res.json().catch(() => undefined)

    return res.ok ? { data } : { error: data?.detail || `Request failed` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}
