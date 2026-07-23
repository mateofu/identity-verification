import { afterEach, describe, expect, it, vi } from 'vitest'

import { type VerificationApiRequestError, verifyIdentity } from './verificationApi'

function createImageFile(name: string): File {
  return new File(['image-content'], name, { type: 'image/jpeg' })
}

describe('verifyIdentity', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps the API response to the frontend contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            matched: true,
            decision: 'match',
            similarity_percentage: 53.39,
            threshold_percentage: 36.3,
            detected_faces: { selfie: 1, document: 1 },
            quality: {
              selfie_detection_confidence: 92.1,
              document_detection_confidence: 78.4,
              warnings: [],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const result = await verifyIdentity(
      createImageFile('selfie.jpg'),
      createImageFile('document.jpg'),
    )

    expect(result).toEqual({
      matched: true,
      decision: 'match',
      similarityPercentage: 53.39,
      thresholdPercentage: 36.3,
      detectedFaces: { selfie: 1, document: 1 },
      quality: {
        selfieDetectionConfidence: 92.1,
        documentDetectionConfidence: 78.4,
        warnings: [],
      },
    })
  })

  it('preserves controlled API error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'FACE_NOT_FOUND',
            message: 'No face was detected in the document image.',
            field: 'document',
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const verificationPromise = verifyIdentity(
      createImageFile('selfie.jpg'),
      createImageFile('document.jpg'),
    )

    await expect(verificationPromise).rejects.toMatchObject({
      code: 'FACE_NOT_FOUND',
      field: 'document',
    } satisfies Partial<VerificationApiRequestError>)
  })
})
