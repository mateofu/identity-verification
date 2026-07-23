import { useCallback, useEffect, useRef, useState } from 'react'

import type { DocumentCameraStatus } from '../types/document'

const DOCUMENT_FILE_NAME = 'document-capture.jpg'
const JPEG_QUALITY = 0.94

function getCameraErrorStatus(error: unknown): DocumentCameraStatus {
  if (!(error instanceof DOMException)) return 'error'
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'denied'
  if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
    return 'unavailable'
  }
  return 'error'
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode document image.'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export function useDocumentCamera() {
  const videoElementRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<DocumentCameraStatus>('idle')

  const stopCamera = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => {
      track.stop()
    })
    mediaStreamRef.current = null
    if (videoElementRef.current) videoElementRef.current.srcObject = null
  }, [])

  const cancelCamera = useCallback(() => {
    stopCamera()
    setCameraStatus('idle')
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    stopCamera()
    setCameraStatus('requesting')

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unavailable')
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      mediaStreamRef.current = mediaStream

      if (!videoElementRef.current) {
        stopCamera()
        setCameraStatus('error')
        return
      }

      videoElementRef.current.srcObject = mediaStream
      await videoElementRef.current.play()
      setCameraStatus('active')
    } catch (error: unknown) {
      stopCamera()
      setCameraStatus(getCameraErrorStatus(error))
    }
  }, [stopCamera])

  const captureDocument = useCallback(async (): Promise<File | null> => {
    const videoElement = videoElementRef.current
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      setCameraStatus('error')
      return null
    }

    try {
      setCameraStatus('capturing')
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D is unavailable.')

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      const imageBlob = await canvasToJpeg(canvas)
      stopCamera()
      setCameraStatus('idle')
      return new File([imageBlob], DOCUMENT_FILE_NAME, {
        type: imageBlob.type,
        lastModified: Date.now(),
      })
    } catch {
      stopCamera()
      setCameraStatus('error')
      return null
    }
  }, [stopCamera])

  useEffect(() => stopCamera, [stopCamera])

  return {
    cameraStatus,
    videoElementRef,
    startCamera,
    cancelCamera,
    captureDocument,
  }
}
