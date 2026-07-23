// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVerification } from '../../hooks/useVerification'
import { VerificationSummary } from './VerificationSummary'

vi.mock('../../hooks/useVerification', () => ({
  useVerification: vi.fn(),
}))

const mockedUseVerification = vi.mocked(useVerification)
const selfieFile = new File(['selfie'], 'selfie.jpg', { type: 'image/jpeg' })
const documentFile = new File(['document'], 'document.jpg', { type: 'image/jpeg' })

function renderSummary(
  overrides: Partial<ReturnType<typeof useVerification>> = {},
  isServiceReady = true,
) {
  const submitVerification = vi.fn()
  mockedUseVerification.mockReturnValue({
    requestStatus: 'idle',
    verificationResult: null,
    verificationFailure: null,
    submitVerification,
    ...overrides,
  })

  const onBack = vi.fn()
  const onChangeSelfie = vi.fn()
  const onRestart = vi.fn()
  render(
    <VerificationSummary
      selfieFile={selfieFile}
      documentFile={documentFile}
      onBack={onBack}
      onChangeSelfie={onChangeSelfie}
      onRestart={onRestart}
      isServiceReady={isServiceReady}
    />,
  )

  return { submitVerification, onBack, onChangeSelfie, onRestart }
}

describe('VerificationSummary', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn((file: Blob) => `blob:${file.size}`)
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows both previews and lets the user replace either image', async () => {
    const user = userEvent.setup()
    const { onBack, onChangeSelfie } = renderSummary()

    expect(screen.getByAltText('Captura facial seleccionada')).toBeTruthy()
    expect(screen.getByAltText('Documento seleccionado completo')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Cambiar documento' }))
    await user.click(screen.getByRole('button', { name: 'Cambiar rostro' }))

    expect(onBack).toHaveBeenCalledOnce()
    expect(onChangeSelfie).toHaveBeenCalledOnce()
  })

  it('submits the selected files', async () => {
    const user = userEvent.setup()
    const { submitVerification } = renderSummary()

    await user.click(screen.getByRole('button', { name: 'Comparar rostros' }))

    expect(submitVerification).toHaveBeenCalledWith(selfieFile, documentFile)
  })

  it('blocks verification while the backend is starting', () => {
    renderSummary({}, false)

    const compareButton = screen.getByRole('button', { name: 'Esperando servicio…' })
    expect(compareButton.hasAttribute('disabled')).toBe(true)
  })

  it('presents an inconclusive result and its quality warning', () => {
    renderSummary({
      requestStatus: 'success',
      verificationResult: {
        matched: false,
        decision: 'inconclusive',
        similarityPercentage: 48.2,
        thresholdPercentage: 36.3,
        detectedFaces: { selfie: 1, document: 1 },
        quality: {
          selfieDetectionConfidence: 92,
          documentDetectionConfidence: 52,
          warnings: ['LOW_DOCUMENT_FACE_CONFIDENCE'],
        },
      },
    })

    expect(screen.getByText('Resultado no concluyente')).toBeTruthy()
    expect(screen.getByText('48.20%')).toBeTruthy()
    expect(screen.getByText(/documento tiene baja calidad o antigüedad/i)).toBeTruthy()
  })
})
