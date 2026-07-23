import { describe, expect, it } from 'vitest'

import { assessFrameQuality, calculateFrameQuality } from './frameQuality'

function createFrame(values: number[]) {
  const data = new Uint8ClampedArray(values.flatMap((value) => [value, value, value, 255]))
  return { data, width: 2, height: 2 }
}

describe('calculateFrameQuality', () => {
  it('prefers a well-exposed detailed frame over a dark flat frame', () => {
    const detailedFrame = createFrame([70, 200, 190, 100])
    const darkFlatFrame = createFrame([10, 10, 10, 10])

    expect(calculateFrameQuality(detailedFrame)).toBeGreaterThan(
      calculateFrameQuality(darkFlatFrame),
    )
  })

  it('returns zero for invalid dimensions', () => {
    expect(calculateFrameQuality({ data: new Uint8ClampedArray(), width: 0, height: 0 })).toBe(0)
  })

  it('rejects frames that are clearly dark and flat', () => {
    expect(assessFrameQuality(createFrame([10, 10, 10, 10])).acceptable).toBe(false)
  })

  it('accepts frames with usable exposure, contrast and detail', () => {
    expect(assessFrameQuality(createFrame([70, 200, 190, 100])).acceptable).toBe(true)
  })
})
