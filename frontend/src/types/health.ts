export type ApiConnectionStatus = 'checking' | 'ready' | 'reconnecting' | 'error'

export interface HealthResponse {
  status: 'ok'
}
