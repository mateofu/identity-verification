import { describe, expect, it } from 'vitest'

import { calculateCoverCrop } from './coverCrop'

describe('calculateCoverCrop', () => {
  it('crops a portrait camera frame to the horizontal document viewport', () => {
    const crop = calculateCoverCrop(1080, 1920, 720, 456)

    expect(crop.x).toBe(0)
    expect(crop.y).toBeGreaterThan(0)
    expect(crop.width / crop.height).toBeCloseTo(720 / 456)
  })

  it('crops an overly wide camera frame from both sides', () => {
    const crop = calculateCoverCrop(1920, 1080, 4, 3)

    expect(crop.x).toBeGreaterThan(0)
    expect(crop.y).toBe(0)
    expect(crop.width / crop.height).toBeCloseTo(4 / 3)
  })

  it('rejects invalid dimensions', () => {
    expect(calculateCoverCrop(0, 1080, 720, 456)).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })
})
