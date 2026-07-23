const JPEG_QUALITY = 0.9

export interface ImageDimensions {
  width: number
  height: number
}

export function constrainImageDimensions(
  width: number,
  height: number,
  maximumPixels: number,
): ImageDimensions {
  if (width <= 0 || height <= 0 || maximumPixels <= 0) {
    return { width: 0, height: 0 }
  }

  if (width * height <= maximumPixels) {
    return { width, height }
  }

  const scale = Math.sqrt(maximumPixels / (width * height))
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('The browser could not resize the selected image.'))
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export async function prepareImageForUpload(imageFile: File, maximumPixels: number): Promise<File> {
  const imageBitmap = await createImageBitmap(imageFile)

  try {
    if (imageBitmap.width <= 0 || imageBitmap.height <= 0) {
      throw new Error('The selected image has invalid dimensions.')
    }

    const targetDimensions = constrainImageDimensions(
      imageBitmap.width,
      imageBitmap.height,
      maximumPixels,
    )

    if (
      targetDimensions.width === imageBitmap.width &&
      targetDimensions.height === imageBitmap.height
    ) {
      return imageFile
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetDimensions.width
    canvas.height = targetDimensions.height
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas 2D is unavailable.')
    }

    context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
    const resizedBlob = await canvasToJpeg(canvas)
    const baseName = imageFile.name.replace(/\.[^.]+$/, '') || 'document'

    return new File([resizedBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: imageFile.lastModified,
    })
  } finally {
    imageBitmap.close()
  }
}
