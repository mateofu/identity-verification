export interface DetectedFaces {
  selfie: number
  document: number
}

export interface VerificationResult {
  matched: boolean
  decision: VerificationDecision
  similarityPercentage: number
  thresholdPercentage: number
  detectedFaces: DetectedFaces
  quality: FaceQualitySummary
}

export type VerificationDecision = 'match' | 'no_match' | 'inconclusive'

export interface FaceQualitySummary {
  selfieDetectionConfidence: number
  documentDetectionConfidence: number
  warnings: QualityWarning[]
}

export type QualityWarning =
  | 'LOW_SELFIE_FACE_CONFIDENCE'
  | 'LOW_DOCUMENT_FACE_CONFIDENCE'
  | 'SELFIE_FACE_TOO_SMALL'
  | 'DOCUMENT_FACE_TOO_SMALL'
  | 'LOW_SELFIE_FACE_SHARPNESS'
  | 'LOW_DOCUMENT_FACE_SHARPNESS'
  | 'POOR_SELFIE_FACE_EXPOSURE'
  | 'POOR_DOCUMENT_FACE_EXPOSURE'

export type VerificationErrorCode =
  | 'INVALID_IMAGE'
  | 'IMAGE_TOO_LARGE'
  | 'UNSUPPORTED_IMAGE_TYPE'
  | 'FACE_NOT_FOUND'
  | 'MULTIPLE_FACES_FOUND'
  | 'FACE_COMPARISON_FAILED'

export interface VerificationError {
  code: VerificationErrorCode
  message: string
  field?: 'selfie' | 'document' | null
}

export type VerificationRequestStatus = 'idle' | 'submitting' | 'success' | 'error'
