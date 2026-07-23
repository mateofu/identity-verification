import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchWithTimeout, RequestTimeoutError } from './fetchWithTimeout'

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns a response completed within the time limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    const response = await fetchWithTimeout('/api/health', {}, 1_000)

    expect(response.status).toBe(204)
  })

  it('aborts and reports a controlled timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      }),
    )

    const requestPromise = fetchWithTimeout('/api/health', {}, 1_000)
    const rejectionExpectation = expect(requestPromise).rejects.toBeInstanceOf(RequestTimeoutError)
    await vi.advanceTimersByTimeAsync(1_000)

    await rejectionExpectation
  })
})
