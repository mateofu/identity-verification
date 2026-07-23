// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDocumentCamera } from '../../hooks/useDocumentCamera'
import { useDocumentImage } from '../../hooks/useDocumentImage'
import { DocumentCapture } from './DocumentCapture'

vi.mock('../../hooks/useDocumentCamera', () => ({ useDocumentCamera: vi.fn() }))
vi.mock('../../hooks/useDocumentImage', () => ({ useDocumentImage: vi.fn() }))

const mockedUseDocumentCamera = vi.mocked(useDocumentCamera)
const mockedUseDocumentImage = vi.mocked(useDocumentImage)

function configureHooks(
  cameraStatus: ReturnType<typeof useDocumentCamera>['cameraStatus'] = 'idle',
) {
  const startCamera = vi.fn()
  const cancelCamera = vi.fn()
  const captureDocument = vi
    .fn()
    .mockResolvedValue(
      new File(['captured-document'], 'document-capture.jpg', { type: 'image/jpeg' }),
    )
  const selectDocumentImage = vi.fn().mockResolvedValue(undefined)

  mockedUseDocumentCamera.mockReturnValue({
    cameraStatus,
    videoElementRef: { current: null },
    startCamera,
    cancelCamera,
    captureDocument,
  })
  mockedUseDocumentImage.mockReturnValue({
    selectedImage: null,
    validationError: null,
    selectDocumentImage,
    clearDocumentImage: vi.fn(),
  })

  return { startCamera, cancelCamera, captureDocument, selectDocumentImage }
}

describe('DocumentCapture', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('offers separate camera and file upload actions', async () => {
    const user = userEvent.setup()
    const { startCamera } = configureHooks()
    const { container } = render(<DocumentCapture onBack={vi.fn()} onContinue={vi.fn()} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const inputClick = vi.spyOn(fileInput, 'click')

    await user.click(screen.getByRole('button', { name: 'Tomar foto' }))
    expect(startCamera).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Subir imagen' }))
    expect(inputClick).toHaveBeenCalledOnce()
  })

  it('sends a camera capture through the same image validation flow', async () => {
    const user = userEvent.setup()
    const { captureDocument, selectDocumentImage } = configureHooks('active')
    render(<DocumentCapture onBack={vi.fn()} onContinue={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Capturar documento' }))

    expect(captureDocument).toHaveBeenCalledOnce()
    expect(selectDocumentImage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'document-capture.jpg', type: 'image/jpeg' }),
    )
  })
})
