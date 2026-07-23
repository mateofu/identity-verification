import { useCallback, useEffect, useRef, useState } from 'react'

import type { DocumentImageError, SelectedDocumentImage } from '../types/document'

const MAXIMUM_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function isDecodableImage(imageFile: File): Promise<boolean> {
  try {
    const imageBitmap = await createImageBitmap(imageFile)
    const hasValidDimensions = imageBitmap.width > 0 && imageBitmap.height > 0
    imageBitmap.close()
    return hasValidDimensions
  } catch {
    return false
  }
}

export function useDocumentImage() {
  const previewUrlRef = useRef<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<SelectedDocumentImage | null>(null)
  const [validationError, setValidationError] = useState<DocumentImageError | null>(null)

  const clearDocumentImage = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    setSelectedImage(null)
    setValidationError(null)
  }, [])

  const selectDocumentImage = useCallback(
    async (imageFile: File) => {
      clearDocumentImage()

      if (!SUPPORTED_IMAGE_TYPES.has(imageFile.type)) {
        setValidationError('unsupported-type')
        return
      }

      if (imageFile.size > MAXIMUM_DOCUMENT_SIZE_BYTES) {
        setValidationError('file-too-large')
        return
      }

      if (!(await isDecodableImage(imageFile))) {
        setValidationError('invalid-image')
        return
      }

      const previewUrl = URL.createObjectURL(imageFile)
      previewUrlRef.current = previewUrl
      setSelectedImage({ file: imageFile, previewUrl })
    },
    [clearDocumentImage],
  )

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  return {
    selectedImage,
    validationError,
    selectDocumentImage,
    clearDocumentImage,
  }
}
