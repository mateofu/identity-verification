export class RequestTimeoutError extends Error {
  constructor(timeoutInMilliseconds: number) {
    super(`The request exceeded ${timeoutInMilliseconds} milliseconds.`)
    this.name = 'RequestTimeoutError'
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutInMilliseconds: number,
): Promise<Response> {
  const requestController = new AbortController()
  let didTimeOut = false

  const handleExternalAbort = () => requestController.abort()
  if (init.signal?.aborted) requestController.abort()
  init.signal?.addEventListener('abort', handleExternalAbort, { once: true })

  const timeoutId = globalThis.setTimeout(() => {
    didTimeOut = true
    requestController.abort()
  }, timeoutInMilliseconds)

  try {
    return await fetch(input, { ...init, signal: requestController.signal })
  } catch (error: unknown) {
    if (didTimeOut) throw new RequestTimeoutError(timeoutInMilliseconds)
    throw error
  } finally {
    globalThis.clearTimeout(timeoutId)
    init.signal?.removeEventListener('abort', handleExternalAbort)
  }
}
