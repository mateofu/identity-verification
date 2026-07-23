import { useCallback, useEffect, useRef, useState } from 'react'

import { VerificationApiRequestError, verifyIdentity } from '../services/verificationApi'
import type {
  VerificationErrorCode,
  VerificationRequestStatus,
  VerificationResult,
} from '../types/verification'

interface VerificationFailure {
  code: VerificationErrorCode
  message: string
  field?: 'selfie' | 'document' | null
}

export function useVerification() {
  const abortControllerRef = useRef<AbortController | null>(null)
  const [requestStatus, setRequestStatus] = useState<VerificationRequestStatus>('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [verificationFailure, setVerificationFailure] = useState<VerificationFailure | null>(null)

  const submitVerification = useCallback(async (selfieFile: File, documentFile: File) => {
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setRequestStatus('submitting')
    setVerificationResult(null)
    setVerificationFailure(null)

    try {
      const result = await verifyIdentity(selfieFile, documentFile, abortController.signal)
      setVerificationResult(result)
      setRequestStatus('success')
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return

      if (error instanceof VerificationApiRequestError) {
        setVerificationFailure({
          code: error.code,
          message: error.message,
          field: error.field,
        })
      } else {
        setVerificationFailure({
          code: 'FACE_COMPARISON_FAILED',
          message: 'No fue posible conectar con el servicio de verificación.',
        })
      }
      setRequestStatus('error')
    }
  }, [])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  return {
    requestStatus,
    verificationResult,
    verificationFailure,
    submitVerification,
  }
}
