import { useObjectUrl } from '../../hooks/useObjectUrl'
import { useVerification } from '../../hooks/useVerification'
import type {
  QualityWarning,
  VerificationDecision,
  VerificationErrorCode,
} from '../../types/verification'

interface VerificationSummaryProps {
  selfieFile: File
  documentFile: File
  onBack: () => void
  onChangeSelfie: () => void
  onRestart: () => void
  isServiceReady: boolean
}

const errorMessages: Record<VerificationErrorCode, string> = {
  INVALID_IMAGE: 'Una de las imágenes no es válida. Captúrala nuevamente.',
  IMAGE_TOO_LARGE: 'Una de las imágenes supera el tamaño permitido.',
  UNSUPPORTED_IMAGE_TYPE: 'El formato de una de las imágenes no es compatible.',
  FACE_NOT_FOUND: 'No se encontró un rostro claro en una de las imágenes.',
  MULTIPLE_FACES_FOUND: 'Se detectó más de un rostro en una de las imágenes.',
  FACE_COMPARISON_FAILED: 'No fue posible completar la comparación facial.',
}

function getVerificationErrorMessage(
  code: VerificationErrorCode,
  field?: 'selfie' | 'document' | null,
): string {
  if (code === 'FACE_NOT_FOUND' && field === 'selfie') {
    return 'No se encontró un rostro claro en la captura facial. Toma una nueva selfie con mejor iluminación.'
  }

  if (code === 'FACE_NOT_FOUND' && field === 'document') {
    return 'No se encontró el rostro en el documento. Usa una imagen frontal, nítida y más cercana.'
  }

  if (code === 'MULTIPLE_FACES_FOUND' && field) {
    return `Se detectó más de un rostro en ${field === 'selfie' ? 'la captura facial' : 'el documento'}.`
  }

  return errorMessages[code]
}

function formatFileSize(sizeInBytes: number): string {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
}

const decisionLabels: Record<VerificationDecision, string> = {
  match: 'Coincidencia detectada',
  no_match: 'No se detectó coincidencia',
  inconclusive: 'Resultado no concluyente',
}

const qualityMessages: Record<QualityWarning, string> = {
  LOW_SELFIE_FACE_CONFIDENCE:
    'La captura facial no tiene calidad suficiente. Usa iluminación frontal y mantén el rostro centrado.',
  LOW_DOCUMENT_FACE_CONFIDENCE:
    'La fotografía del documento tiene baja calidad o antigüedad. Usa una toma más cercana, nítida y sin reflejos.',
  SELFIE_FACE_TOO_SMALL:
    'Tu rostro está demasiado lejos. Acércate a la cámara y mantenlo dentro de la guía.',
  DOCUMENT_FACE_TOO_SMALL:
    'El retrato del documento es demasiado pequeño. Acerca el documento hasta llenar la guía.',
  LOW_SELFIE_FACE_SHARPNESS:
    'La captura facial está desenfocada. Mantente quieto y limpia el lente de la cámara.',
  LOW_DOCUMENT_FACE_SHARPNESS:
    'El retrato del documento está desenfocado. Mantén el documento quieto antes de capturar.',
  POOR_SELFIE_FACE_EXPOSURE:
    'Tu rostro está demasiado oscuro o iluminado. Usa una luz frontal uniforme.',
  POOR_DOCUMENT_FACE_EXPOSURE:
    'El retrato del documento está demasiado oscuro o iluminado. Evita reflejos y contraluz.',
}

export function VerificationSummary({
  selfieFile,
  documentFile,
  onBack,
  onChangeSelfie,
  onRestart,
  isServiceReady,
}: VerificationSummaryProps) {
  const selfiePreviewUrl = useObjectUrl(selfieFile)
  const documentPreviewUrl = useObjectUrl(documentFile)
  const { requestStatus, verificationResult, verificationFailure, submitVerification } =
    useVerification()

  return (
    <section className="capture-panel" aria-labelledby="summary-heading">
      <div className="step-label">Paso 3 de 3</div>
      <h2 id="summary-heading">Imágenes preparadas</h2>
      <p className="capture-description">Revisa los archivos y ejecuta la comparación facial.</p>

      <div className="file-summary-grid">
        <article className="file-summary file-summary--preview">
          {selfiePreviewUrl && <img src={selfiePreviewUrl} alt="Captura facial seleccionada" />}
          <span>Captura facial</span>
          <strong>{selfieFile.name}</strong>
          <small>{formatFileSize(selfieFile.size)}</small>
        </article>
        <article className="file-summary file-summary--preview">
          {documentPreviewUrl && (
            <img src={documentPreviewUrl} alt="Documento seleccionado completo" />
          )}
          <span>Documento</span>
          <strong>{documentFile.name}</strong>
          <small>{formatFileSize(documentFile.size)}</small>
        </article>
      </div>

      {verificationResult && (
        <div
          className={`verification-result verification-result--${verificationResult.decision.replace('_', '-')}`}
          role="status"
        >
          <span>{decisionLabels[verificationResult.decision]}</span>
          <strong>{verificationResult.similarityPercentage.toFixed(2)}%</strong>
          <em>Puntuación de similitud</em>
          <small>Umbral de decisión: {verificationResult.thresholdPercentage.toFixed(2)}%</small>
          {verificationResult.quality.warnings.length > 0 && (
            <ul className="quality-warnings">
              {verificationResult.quality.warnings.map((warning) => (
                <li key={warning}>{qualityMessages[warning]}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {verificationFailure && (
        <div className="verification-error" role="alert">
          <strong>No pudimos verificar las imágenes</strong>
          <span>
            {getVerificationErrorMessage(verificationFailure.code, verificationFailure.field)}
          </span>
          <small>Código: {verificationFailure.code}</small>
        </div>
      )}

      <div className="camera-actions">
        <button
          className="button button--primary"
          type="button"
          disabled={requestStatus === 'submitting' || !isServiceReady}
          onClick={() => void submitVerification(selfieFile, documentFile)}
        >
          {!isServiceReady
            ? 'Esperando servicio…'
            : requestStatus === 'submitting'
              ? 'Comparando rostros…'
              : requestStatus === 'error'
                ? 'Intentar nuevamente'
                : 'Comparar rostros'}
        </button>
        <button className="button button--secondary" type="button" onClick={onBack}>
          Cambiar documento
        </button>
        <button className="button button--secondary" type="button" onClick={onChangeSelfie}>
          Cambiar rostro
        </button>
        <button className="button button--ghost" type="button" onClick={onRestart}>
          Reiniciar proceso
        </button>
      </div>
    </section>
  )
}
