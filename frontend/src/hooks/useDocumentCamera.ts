import { useCallback, useEffect, useRef, useState } from 'react'

import type { DocumentCameraStatus } from '../types/document'
import { calculateCoverCrop } from '../utils/coverCrop'

const DOCUMENT_FILE_NAME = 'document-capture.jpg'
const JPEG_QUALITY = 0.94
const DOCUMENT_FRAME_WIDTH = 158
const DOCUMENT_FRAME_HEIGHT = 100

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
      const crop = calculateCoverCrop(
        videoElement.videoWidth,
        videoElement.videoHeight,
        videoElement.clientWidth || DOCUMENT_FRAME_WIDTH,
        videoElement.clientHeight || DOCUMENT_FRAME_HEIGHT,
      )
      if (crop.width === 0 || crop.height === 0) {
        throw new Error('The visible document area could not be calculated.')
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(crop.width)
      canvas.height = Math.round(crop.height)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D is unavailable.')

      context.drawImage(
        videoElement,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )
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
