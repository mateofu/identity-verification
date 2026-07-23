// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

vi.mock('./hooks/useApiHealth', () => ({ useApiHealth: () => 'ready' }))
vi.mock('./hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}))
vi.mock('./components/theme/ThemeToggle', () => ({ ThemeToggle: () => null }))
vi.mock('./components/camera/CameraCapture', () => ({
  CameraCapture: ({ onContinue }: { onContinue: (file: File) => void }) => (
    <button
      type="button"
      onClick={() => onContinue(new File(['selfie'], 'selfie.jpg', { type: 'image/jpeg' }))}
    >
      Completar rostro
    </button>
  ),
}))
vi.mock('./components/document/DocumentCapture', () => ({
  DocumentCapture: ({ onContinue }: { onContinue: (file: File) => void }) => (
    <button
      type="button"
      onClick={() => onContinue(new File(['document'], 'document.jpg', { type: 'image/jpeg' }))}
    >
      Completar documento
    </button>
  ),
}))
vi.mock('./components/verification/VerificationSummary', () => ({
  VerificationSummary: ({
    documentFile,
    onChangeSelfie,
  }: {
    documentFile: File
    onChangeSelfie: () => void
  }) => (
    <div>
      <span>Resumen con {documentFile.name}</span>
      <button type="button" onClick={onChangeSelfie}>
        Cambiar rostro
      </button>
    </div>
  ),
}))

describe('App verification flow', () => {
  afterEach(cleanup)

  it('keeps the selected document when the user changes only the selfie', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Antes de comenzar' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Comenzar verificación' }))
    await user.click(screen.getByRole('button', { name: 'Completar rostro' }))
    await user.click(screen.getByRole('button', { name: 'Completar documento' }))
    expect(screen.getByText('Resumen con document.jpg')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Cambiar rostro' }))
    await user.click(screen.getByRole('button', { name: 'Completar rostro' }))

    expect(screen.getByText('Resumen con document.jpg')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Completar documento' })).toBeNull()
  })
})
