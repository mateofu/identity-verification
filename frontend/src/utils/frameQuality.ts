export interface PixelFrame {
  data: Uint8ClampedArray
  width: number
  height: number
}

const IDEAL_LUMINANCE = 140
const MAX_LUMINANCE_DISTANCE = 140
const MINIMUM_LUMINANCE = 45
const MAXIMUM_LUMINANCE = 220
const MINIMUM_CONTRAST = 15
const MINIMUM_SHARPNESS = 2.5

export interface FrameQualityAssessment {
  score: number
  acceptable: boolean
}

export function assessFrameQuality({ data, width, height }: PixelFrame): FrameQualityAssessment {
  if (width < 2 || height < 2 || data.length < width * height * 4) {
    return { score: 0, acceptable: false }
  }

  const luminance = new Float32Array(width * height)
  let luminanceSum = 0

  for (let pixelIndex = 0; pixelIndex < luminance.length; pixelIndex += 1) {
    const dataIndex = pixelIndex * 4
    const value =
      data[dataIndex] * 0.2126 + data[dataIndex + 1] * 0.7152 + data[dataIndex + 2] * 0.0722
    luminance[pixelIndex] = value
    luminanceSum += value
  }

  const meanLuminance = luminanceSum / luminance.length
  let varianceSum = 0
  let edgeSum = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const value = luminance[pixelIndex]
      varianceSum += (value - meanLuminance) ** 2
      if (x > 0) edgeSum += Math.abs(value - luminance[pixelIndex - 1])
      if (y > 0) edgeSum += Math.abs(value - luminance[pixelIndex - width])
    }
  }

  const contrast = Math.sqrt(varianceSum / luminance.length)
  const edgeCount = (width - 1) * height + (height - 1) * width
  const sharpness = edgeSum / edgeCount
  const exposure = Math.max(
    0,
    1 - Math.abs(meanLuminance - IDEAL_LUMINANCE) / MAX_LUMINANCE_DISTANCE,
  )

  return {
    score: contrast * 0.35 + sharpness * 0.45 + exposure * 20,
    acceptable:
      meanLuminance >= MINIMUM_LUMINANCE &&
      meanLuminance <= MAXIMUM_LUMINANCE &&
      contrast >= MINIMUM_CONTRAST &&
      sharpness >= MINIMUM_SHARPNESS,
  }
}

export function calculateFrameQuality(frame: PixelFrame): number {
  return assessFrameQuality(frame).score
}
