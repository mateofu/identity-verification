import { useState } from 'react'

import { CameraCapture } from './components/camera/CameraCapture'
import { DocumentCapture } from './components/document/DocumentCapture'
import { ThemeToggle } from './components/theme/ThemeToggle'
import { VerificationSummary } from './components/verification/VerificationSummary'
import { useApiHealth } from './hooks/useApiHealth'
import { useTheme } from './hooks/useTheme'

type VerificationStep = 'selfie' | 'document' | 'summary'

export default function App() {
  const connectionStatus = useApiHealth()
  const { theme, toggleTheme } = useTheme()
  const [currentStep, setCurrentStep] = useState<VerificationStep>('selfie')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const handleSelfieCompleted = (capturedSelfie: File) => {
    setSelfieFile(capturedSelfie)
    setCurrentStep(documentFile ? 'summary' : 'document')
  }

  const handleDocumentCompleted = (selectedDocument: File) => {
    setDocumentFile(selectedDocument)
    setCurrentStep('summary')
  }

  const restartVerification = () => {
    setSelfieFile(null)
    setDocumentFile(null)
    setCurrentStep('selfie')
  }

  const changeSelfie = () => {
    setSelfieFile(null)
    setCurrentStep('selfie')
  }

  return (
    <main>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <span className="eyebrow">Identity verification</span>
            <h1>Verifica tu identidad</h1>
            <p>Compara una captura en vivo con la fotografía de tu documento.</p>
          </div>
          <div className="header-controls">
            <div className={`api-status api-status--${connectionStatus}`} role="status">
              <span aria-hidden="true" />
              {connectionStatus === 'checking' && 'Conectando…'}
              {connectionStatus === 'ready' && 'Servicio disponible'}
              {connectionStatus === 'reconnecting' && 'Reconectando…'}
              {connectionStatus === 'error' && 'Servicio no disponible'}
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        {connectionStatus !== 'ready' && (
          <div className="service-startup-notice" role="status">
            <strong>
              {connectionStatus === 'error'
                ? 'El servicio de IA todavía no responde'
                : 'Preparando el servicio de IA…'}
            </strong>
            <span>
              La infraestructura gratuita puede tardar hasta un minuto en iniciar. Reintentaremos
              automáticamente.
            </span>
          </div>
        )}

        {currentStep === 'selfie' && <CameraCapture onContinue={handleSelfieCompleted} />}
        {currentStep === 'document' && (
          <DocumentCapture
            onBack={() => setCurrentStep('selfie')}
            onContinue={handleDocumentCompleted}
          />
        )}
        {currentStep === 'summary' && selfieFile && documentFile && (
          <VerificationSummary
            selfieFile={selfieFile}
            documentFile={documentFile}
            onBack={() => setCurrentStep('document')}
            onChangeSelfie={changeSelfie}
            onRestart={restartVerification}
            isServiceReady={connectionStatus === 'ready'}
          />
        )}
      </div>
    </main>
  )
}
