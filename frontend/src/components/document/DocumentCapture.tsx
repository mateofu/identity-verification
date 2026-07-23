import { useRef } from 'react'

import { useDocumentCamera } from '../../hooks/useDocumentCamera'
import { useDocumentImage } from '../../hooks/useDocumentImage'
import type { DocumentCameraStatus, DocumentImageError } from '../../types/document'

interface DocumentCaptureProps {
  onBack: () => void
  onContinue: (documentFile: File) => void
}

const validationMessages: Record<DocumentImageError, string> = {
  'unsupported-type': 'Selecciona una imagen JPEG, PNG o WebP.',
  'file-too-large': 'La imagen supera el tamaño máximo de 10 MB.',
  'invalid-image': 'El archivo no contiene una imagen válida.',
}

const cameraMessages: Partial<Record<DocumentCameraStatus, string>> = {
  requesting: 'Esperando el permiso para usar la cámara…',
  capturing: 'Procesando la fotografía del documento…',
  denied: 'El acceso fue bloqueado. Habilita la cámara o utiliza Subir imagen.',
  unavailable: 'No encontramos una cámara disponible. Puedes subir una imagen.',
  error: 'No pudimos usar la cámara. Intenta nuevamente o sube una imagen.',
}

export function DocumentCapture({ onBack, onContinue }: DocumentCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { selectedImage, validationError, selectDocumentImage, clearDocumentImage } =
    useDocumentImage()
  const { cameraStatus, videoElementRef, startCamera, cancelCamera, captureDocument } =
    useDocumentCamera()

  const isCameraVisible = cameraStatus === 'active' || cameraStatus === 'capturing'
  const isCameraBusy = cameraStatus === 'requesting' || cameraStatus === 'capturing'
  const statusMessage = cameraMessages[cameraStatus]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [selectedFile] = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selectedFile) void selectDocumentImage(selectedFile)
  }

  const handleCameraCapture = async () => {
    const capturedFile = await captureDocument()
    if (capturedFile) await selectDocumentImage(capturedFile)
  }

  const openCamera = () => {
    clearDocumentImage()
    void startCamera()
  }

  const openFilePicker = () => {
    cancelCamera()
    clearDocumentImage()
    fileInputRef.current?.click()
  }

  return (
    <section className="capture-panel" aria-labelledby="document-heading">
      <div className="step-label">Paso 2 de 3</div>
      <h2 id="document-heading">Agrega tu documento</h2>
      <p className="capture-description">
        Usa una foto nítida del lado que contiene tu rostro. Evita reflejos y asegúrate de mostrar
        el documento completo.
      </p>

      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />

      {(validationError || statusMessage) && (
        <p
          className={`camera-message${validationError || cameraStatus === 'error' || cameraStatus === 'denied' ? ' camera-message--error' : ''}`}
          role={validationError ? 'alert' : 'status'}
        >
          {validationError ? validationMessages[validationError] : statusMessage}
        </p>
      )}

      <div
        className={`document-frame${selectedImage ? ' document-frame--preview' : ''}${isCameraVisible ? ' document-frame--camera' : ''}`}
      >
        {selectedImage ? (
          <img src={selectedImage.previewUrl} alt="Vista previa del documento seleccionado" />
        ) : (
          <>
            <video
              ref={videoElementRef}
              className={isCameraVisible ? 'is-visible' : ''}
              muted
              playsInline
              aria-label="Vista en vivo de la cámara para el documento"
            />
            {!isCameraVisible && (
              <div className="document-placeholder">
                <div className="document-icon" aria-hidden="true" />
                <strong>Cédula, licencia o carné</strong>
                <span>JPEG, PNG o WebP · máximo 10 MB</span>
              </div>
            )}
            {isCameraVisible && <div className="document-guide" aria-hidden="true" />}
          </>
        )}
      </div>

      <div className="camera-actions">
        {!selectedImage && !isCameraVisible && (
          <>
            <button
              className="button button--primary"
              type="button"
              onClick={openCamera}
              disabled={isCameraBusy}
            >
              {cameraStatus === 'requesting' ? 'Activando cámara…' : 'Tomar foto'}
            </button>
            <button className="button button--secondary" type="button" onClick={openFilePicker}>
              Subir imagen
            </button>
          </>
        )}

        {isCameraVisible && (
          <>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void handleCameraCapture()}
              disabled={isCameraBusy}
            >
              {cameraStatus === 'capturing' ? 'Capturando…' : 'Capturar documento'}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={cancelCamera}
              disabled={isCameraBusy}
            >
              Cancelar
            </button>
          </>
        )}

        {selectedImage && (
          <>
            <button
              className="button button--primary"
              type="button"
              onClick={() => onContinue(selectedImage.file)}
            >
              Usar este documento
            </button>
            <button className="button button--secondary" type="button" onClick={openCamera}>
              Tomar otra foto
            </button>
            <button className="button button--secondary" type="button" onClick={openFilePicker}>
              Subir otra imagen
            </button>
          </>
        )}

        {!isCameraVisible && (
          <button className="button button--ghost" type="button" onClick={onBack}>
            Volver al rostro
          </button>
        )}
      </div>

      <p className="privacy-note">
        El documento permanece temporalmente en el navegador y no se guarda.
      </p>
    </section>
  )
}
