import { describe, expect, it } from 'vitest'

import { constrainImageDimensions } from './imageResize'

describe('constrainImageDimensions', () => {
  it('keeps an image that is already within the pixel limit', () => {
    expect(constrainImageDimensions(1920, 1080, 6_000_000)).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('reduces a mobile photo proportionally below the pixel limit', () => {
    const resized = constrainImageDimensions(3024, 4032, 6_000_000)

    expect(resized.width / resized.height).toBeCloseTo(3024 / 4032, 3)
    expect(resized.width * resized.height).toBeLessThanOrEqual(6_000_000)
  })

  it('rejects invalid dimension inputs', () => {
    expect(constrainImageDimensions(0, 4032, 6_000_000)).toEqual({
      width: 0,
      height: 0,
    })
  })
})
