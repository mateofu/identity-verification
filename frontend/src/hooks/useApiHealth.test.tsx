// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getApiHealth } from '../services/healthApi'
import { useApiHealth } from './useApiHealth'

vi.mock('../services/healthApi', () => ({
  getApiHealth: vi.fn(),
}))

const mockedGetApiHealth = vi.mocked(getApiHealth)

describe('useApiHealth', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('reports an unavailable service immediately when the browser is offline', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)

    const { result } = renderHook(() => useApiHealth())

    await waitFor(() => expect(result.current).toBe('error'))
    expect(mockedGetApiHealth).not.toHaveBeenCalled()
  })
})
