import type { ApiResponse } from "@/types/api"
import type { HealthStatus } from "@/types/health"
import { apiFetch } from "./client"

export async function checkHealth(): Promise<ApiResponse<HealthStatus>> {
  return apiFetch<HealthStatus>("/health")
}
