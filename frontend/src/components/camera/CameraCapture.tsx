import { useCamera } from '../../hooks/useCamera'
import type { CameraStatus } from '../../types/camera'

interface CameraCaptureProps {
  onContinue: (selfieFile: File) => void
}

const cameraMessages: Partial<Record<CameraStatus, string>> = {
  capturing: 'Capturando tres imágenes y seleccionando la mejor…',
  'poor-quality':
    'La captura quedó oscura, sobreexpuesta o desenfocada. Mejora la iluminación y vuelve a intentarlo.',
  requesting: 'Esperando el permiso del navegador…',
  denied:
    'El acceso fue bloqueado. Habilita la cámara en los permisos del navegador e intenta nuevamente.',
  unavailable: 'No encontramos una cámara disponible en este dispositivo.',
  error: 'Ocurrió un problema al iniciar o capturar la cámara. Intenta nuevamente.',
}

export function CameraCapture({ onContinue }: CameraCaptureProps) {
  const {
    cameraStatus,
    capturedPhoto,
    videoElementRef,
    startCamera,
    cancelCamera,
    capturePhoto,
    retakePhoto,
  } = useCamera()

  const isCapturing = cameraStatus === 'capturing'
  const isCameraActive = cameraStatus === 'active' || cameraStatus === 'poor-quality' || isCapturing
  const isRequestingPermission = cameraStatus === 'requesting'
  const statusMessage = cameraMessages[cameraStatus]

  return (
    <section className="capture-panel" aria-labelledby="camera-heading">
      <div className="step-label">Paso 1 de 3</div>
      <h2 id="camera-heading">Captura tu rostro</h2>
      <p className="capture-description">
        Ubícate de frente, con buena iluminación y sin cubrir tu rostro.
      </p>

      {statusMessage && (
        <p className={`camera-message camera-message--${cameraStatus}`} role="status">
          {statusMessage}
        </p>
      )}

      <div className="camera-frame">
        {capturedPhoto ? (
          <img src={capturedPhoto.previewUrl} alt="Vista previa del rostro capturado" />
        ) : (
          <video
            ref={videoElementRef}
            className={isCameraActive ? 'is-visible' : ''}
            muted
            playsInline
            aria-label="Vista en vivo de la cámara frontal"
          />
        )}

        {!capturedPhoto && !isCameraActive && (
          <div className="camera-placeholder" aria-hidden="true">
            <div className="face-guide" />
            <span>La vista previa aparecerá aquí</span>
          </div>
        )}

        {isCameraActive && <div className="face-overlay" aria-hidden="true" />}
      </div>

      <div className="camera-actions">
        {!capturedPhoto && !isCameraActive && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => void startCamera()}
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? 'Solicitando permiso…' : 'Activar cámara'}
          </button>
        )}

        {isCameraActive && (
          <>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void capturePhoto()}
              disabled={isCapturing}
            >
              {isCapturing ? 'Seleccionando mejor toma…' : 'Capturar rostro'}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={cancelCamera}
              disabled={isCapturing}
            >
              Cancelar
            </button>
          </>
        )}

        {capturedPhoto && (
          <>
            <button
              className="button button--primary"
              type="button"
              onClick={() => onContinue(capturedPhoto.file)}
            >
              Usar esta foto
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void retakePhoto()}
            >
              Tomar otra foto
            </button>
          </>
        )}
      </div>

      <p className="privacy-note">
        Solo conservamos la mejor toma temporalmente en tu navegador; todavía no se envía al
        servidor.
      </p>
    </section>
  )
}
