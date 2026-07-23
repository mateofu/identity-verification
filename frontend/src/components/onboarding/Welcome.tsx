interface WelcomeProps {
  onStart: () => void
}

const verificationSteps = [
  {
    title: 'Captura tu rostro',
    description: 'Usaremos la cámara frontal para obtener una fotografía en vivo.',
  },
  {
    title: 'Agrega tu documento',
    description: 'Captura o carga el lado del documento que contiene tu fotografía.',
  },
  {
    title: 'Compara las imágenes',
    description: 'La IA analizará ambos rostros y mostrará el nivel de similitud.',
  },
]

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <section className="welcome-panel" aria-labelledby="welcome-heading">
      <div className="step-label">Proceso de verificación</div>
      <h2 id="welcome-heading">Antes de comenzar</h2>
      <p className="welcome-description">
        Completa tres pasos sencillos. Busca un lugar bien iluminado y ten tu documento a la mano.
      </p>

      <ol className="welcome-steps">
        {verificationSteps.map((step, index) => (
          <li key={step.title}>
            <span className="welcome-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="welcome-privacy">
        Tus imágenes se procesan temporalmente para realizar la comparación y no se almacenan.
      </p>

      <button className="button button--primary welcome-action" type="button" onClick={onStart}>
        Comenzar verificación
      </button>
    </section>
  )
}
