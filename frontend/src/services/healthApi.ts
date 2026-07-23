import { environment } from '../config/environment'
import type { HealthResponse } from '../types/health'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const HEALTH_REQUEST_TIMEOUT_MS = 8_000

export async function getApiHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetchWithTimeout(
    `${environment.apiUrl}/api/health`,
    { signal },
    HEALTH_REQUEST_TIMEOUT_MS,
  )

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`)
  }

  return response.json() as Promise<HealthResponse>
}
