import { useCallback, useEffect, useRef, useState } from 'react'

import type { CameraStatus, CapturedPhoto } from '../types/camera'
import { assessFrameQuality } from '../utils/frameQuality'

const SELFIE_FILE_NAME = 'selfie.jpg'
const JPEG_QUALITY = 0.92
const BURST_FRAME_COUNT = 3
const BURST_INTERVAL_MS = 140
const QUALITY_FRAME_MAX_WIDTH = 240

interface EvaluatedFrame {
  blob: Blob
  quality: number
  acceptable: boolean
}

function getCameraErrorStatus(error: unknown): CameraStatus {
  if (!(error instanceof DOMException)) return 'error'

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'denied'
  }

  if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
    return 'unavailable'
  }

  return 'error'
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('The browser could not encode the camera frame.'))
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, BURST_INTERVAL_MS))
}

async function captureEvaluatedFrame(videoElement: HTMLVideoElement): Promise<EvaluatedFrame> {
  const captureCanvas = document.createElement('canvas')
  captureCanvas.width = videoElement.videoWidth
  captureCanvas.height = videoElement.videoHeight

  const captureContext = captureCanvas.getContext('2d')
  if (!captureContext) throw new Error('Canvas 2D is unavailable.')
  captureContext.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height)

  const qualityCanvas = document.createElement('canvas')
  const qualityScale = Math.min(1, QUALITY_FRAME_MAX_WIDTH / captureCanvas.width)
  qualityCanvas.width = Math.max(2, Math.round(captureCanvas.width * qualityScale))
  qualityCanvas.height = Math.max(2, Math.round(captureCanvas.height * qualityScale))

  const qualityContext = qualityCanvas.getContext('2d', { willReadFrequently: true })
  if (!qualityContext) throw new Error('Canvas 2D is unavailable.')
  qualityContext.drawImage(captureCanvas, 0, 0, qualityCanvas.width, qualityCanvas.height)

  const imageData = qualityContext.getImageData(0, 0, qualityCanvas.width, qualityCanvas.height)
  const qualityAssessment = assessFrameQuality(imageData)
  return {
    blob: await canvasToJpeg(captureCanvas),
    quality: qualityAssessment.score,
    acceptable: qualityAssessment.acceptable,
  }
}

export function useCamera() {
  const videoElementRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null)

  const stopCamera = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => {
      track.stop()
    })
    mediaStreamRef.current = null

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null
    }
  }, [])

  const clearCapturedPhoto = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    setCapturedPhoto(null)
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
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      mediaStreamRef.current = mediaStream

      if (!videoElementRef.current) {
        mediaStream.getTracks().forEach((track) => {
          track.stop()
        })
        mediaStreamRef.current = null
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

  const capturePhoto = useCallback(async () => {
    const videoElement = videoElementRef.current

    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      setCameraStatus('error')
      return
    }

    try {
      setCameraStatus('capturing')
      const evaluatedFrames: EvaluatedFrame[] = []

      for (let frameIndex = 0; frameIndex < BURST_FRAME_COUNT; frameIndex += 1) {
        if (frameIndex > 0) await waitForNextFrame()
        evaluatedFrames.push(await captureEvaluatedFrame(videoElement))
      }

      const bestFrame = evaluatedFrames.reduce((currentBest, candidate) => {
        if (candidate.acceptable !== currentBest.acceptable) {
          return candidate.acceptable ? candidate : currentBest
        }
        return candidate.quality > currentBest.quality ? candidate : currentBest
      })

      if (!bestFrame.acceptable) {
        setCameraStatus('poor-quality')
        return
      }

      const imageBlob = bestFrame.blob
      const imageFile = new File([imageBlob], SELFIE_FILE_NAME, {
        type: imageBlob.type,
        lastModified: Date.now(),
      })
      const previewUrl = URL.createObjectURL(imageFile)

      clearCapturedPhoto()
      previewUrlRef.current = previewUrl
      setCapturedPhoto({ file: imageFile, previewUrl })
      stopCamera()
      setCameraStatus('idle')
    } catch {
      stopCamera()
      setCameraStatus('error')
    }
  }, [clearCapturedPhoto, stopCamera])

  const retakePhoto = useCallback(async () => {
    clearCapturedPhoto()
    await startCamera()
  }, [clearCapturedPhoto, startCamera])

  useEffect(() => {
    return () => {
      stopCamera()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [stopCamera])

  return {
    cameraStatus,
    capturedPhoto,
    videoElementRef,
    startCamera,
    cancelCamera,
    capturePhoto,
    retakePhoto,
  }
}
