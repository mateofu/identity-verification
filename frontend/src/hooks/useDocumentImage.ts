import { useCallback, useEffect, useRef, useState } from 'react'

import type { DocumentImageError, SelectedDocumentImage } from '../types/document'
import { prepareImageForUpload } from '../utils/imageResize'

const MAXIMUM_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024
const MAXIMUM_DOCUMENT_PIXELS = 6_000_000
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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

      let preparedImage: File
      try {
        preparedImage = await prepareImageForUpload(imageFile, MAXIMUM_DOCUMENT_PIXELS)
      } catch {
        setValidationError('invalid-image')
        return
      }

      const previewUrl = URL.createObjectURL(preparedImage)
      previewUrlRef.current = previewUrl
      setSelectedImage({ file: preparedImage, previewUrl })
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
