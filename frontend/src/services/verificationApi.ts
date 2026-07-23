import { environment } from '../config/environment'
import type {
  QualityWarning,
  VerificationError,
  VerificationErrorCode,
  VerificationResult,
} from '../types/verification'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const VERIFICATION_REQUEST_TIMEOUT_MS = 90_000

interface VerificationApiResponse {
  matched: boolean
  decision: 'match' | 'no_match' | 'inconclusive'
  similarity_percentage: number
  threshold_percentage: number
  detected_faces: {
    selfie: number
    document: number
  }
  quality: {
    selfie_detection_confidence: number
    document_detection_confidence: number
    warnings: QualityWarning[]
  }
}

interface VerificationApiError {
  code?: string
  message?: string
  field?: 'selfie' | 'document' | null
}

const knownErrorCodes = new Set<VerificationErrorCode>([
  'INVALID_IMAGE',
  'IMAGE_TOO_LARGE',
  'UNSUPPORTED_IMAGE_TYPE',
  'FACE_NOT_FOUND',
  'MULTIPLE_FACES_FOUND',
  'FACE_COMPARISON_FAILED',
])

function isKnownErrorCode(code: string | undefined): code is VerificationErrorCode {
  return code !== undefined && knownErrorCodes.has(code as VerificationErrorCode)
}

export class VerificationApiRequestError extends Error {
  readonly code: VerificationErrorCode
  readonly field?: 'selfie' | 'document' | null

  constructor(error: VerificationError) {
    super(error.message)
    this.name = 'VerificationApiRequestError'
    this.code = error.code
    this.field = error.field
  }
}

export async function verifyIdentity(
  selfieFile: File,
  documentFile: File,
  signal?: AbortSignal,
): Promise<VerificationResult> {
  const requestBody = new FormData()
  requestBody.append('selfie', selfieFile)
  requestBody.append('document', documentFile)

  const response = await fetchWithTimeout(
    `${environment.apiUrl}/api/v1/verifications`,
    {
      method: 'POST',
      body: requestBody,
      signal,
    },
    VERIFICATION_REQUEST_TIMEOUT_MS,
  )

  if (!response.ok) {
    const responseError = (await response.json().catch(() => ({}))) as VerificationApiError
    throw new VerificationApiRequestError({
      code: isKnownErrorCode(responseError.code) ? responseError.code : 'FACE_COMPARISON_FAILED',
      message: responseError.message ?? 'The verification request failed.',
      field: responseError.field,
    })
  }

  const result = (await response.json()) as VerificationApiResponse
  return {
    matched: result.matched,
    decision: result.decision,
    similarityPercentage: result.similarity_percentage,
    thresholdPercentage: result.threshold_percentage,
    detectedFaces: result.detected_faces,
    quality: {
      selfieDetectionConfidence: result.quality.selfie_detection_confidence,
      documentDetectionConfidence: result.quality.document_detection_confidence,
      warnings: result.quality.warnings,
    },
  }
}
