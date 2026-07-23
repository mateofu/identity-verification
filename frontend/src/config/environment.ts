const DEFAULT_API_URL = 'http://localhost:8000'

export const environment = Object.freeze({
  apiUrl: (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/$/, ''),
})
