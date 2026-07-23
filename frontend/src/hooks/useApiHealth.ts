import { useEffect, useRef, useState } from 'react'

import { getApiHealth } from '../services/healthApi'
import type { ApiConnectionStatus } from '../types/health'

const HEALTHY_CHECK_INTERVAL_MS = 20_000
const RETRY_CHECK_INTERVAL_MS = 5_000

export function useApiHealth(): ApiConnectionStatus {
  const [connectionStatus, setConnectionStatus] = useState<ApiConnectionStatus>('checking')
  const connectionStatusRef = useRef<ApiConnectionStatus>('checking')

  useEffect(() => {
    let timeoutId: number | undefined
    let activeRequest: AbortController | null = null
    let isDisposed = false

    const updateStatus = (status: ApiConnectionStatus) => {
      connectionStatusRef.current = status
      setConnectionStatus(status)
    }

    const scheduleNextCheck = (delayInMilliseconds: number) => {
      window.clearTimeout(timeoutId)
      if (isDisposed || document.hidden) return
      timeoutId = window.setTimeout(() => void checkHealth(), delayInMilliseconds)
    }

    const checkHealth = async () => {
      if (isDisposed || document.hidden) return
      if (!navigator.onLine) {
        updateStatus('error')
        return
      }

      activeRequest?.abort()
      activeRequest = new AbortController()

      if (connectionStatusRef.current === 'error') updateStatus('reconnecting')

      try {
        await getApiHealth(activeRequest.signal)
        if (isDisposed) return
        updateStatus('ready')
        scheduleNextCheck(HEALTHY_CHECK_INTERVAL_MS)
      } catch (error: unknown) {
        if (isDisposed || (error instanceof DOMException && error.name === 'AbortError')) return
        updateStatus('error')
        scheduleNextCheck(RETRY_CHECK_INTERVAL_MS)
      }
    }

    const handleOffline = () => {
      activeRequest?.abort()
      window.clearTimeout(timeoutId)
      updateStatus('error')
    }

    const handleOnline = () => {
      updateStatus('reconnecting')
      void checkHealth()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        activeRequest?.abort()
        window.clearTimeout(timeoutId)
        return
      }
      void checkHealth()
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    void checkHealth()

    return () => {
      isDisposed = true
      activeRequest?.abort()
      window.clearTimeout(timeoutId)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return connectionStatus
}
