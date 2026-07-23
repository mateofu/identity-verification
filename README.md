# Identity Verification

Aplicación web para capturar un rostro en vivo, adquirir la fotografía de un documento y comparar ambos rostros localmente mediante modelos de visión.

## Demo en producción

https://identity-verification-sooty.vercel.app

> La demostración utiliza infraestructura gratuita. Si el servicio de IA estaba
> inactivo, espera hasta que el estado cambie a **Servicio disponible** antes de
> comparar las imágenes.

## Funcionalidades

- Pantalla inicial con explicación del proceso y tratamiento temporal de las imágenes.
- Acceso real a la cámara frontal mediante `MediaDevices.getUserMedia`.
- Ráfaga automática de tres frames y selección de la toma con mejor exposición, contraste y nitidez.
- Rechazo temprano de capturas claramente deficientes.
- Captura con cámara trasera o carga de cédula, licencia o carné en JPEG, PNG o WebP.
- Previsualización completa de las dos imágenes antes de enviarlas.
- Detección facial con YuNet y reconocimiento con SFace.
- Resultados `match`, `no_match` e `inconclusive`, acompañados de una puntuación de similitud.
- Evaluación del tamaño, proporción, nitidez y exposición de cada rostro antes de emitir una decisión.
- Procesamiento en memoria sin persistencia de imágenes ni vectores biométricos.
- Tema claro y oscuro, estados de conectividad y mensajes de error controlados.

## Stack y arquitectura

- Frontend: React 19, TypeScript, Vite, Vitest y Biome.
- Backend: Python 3.12, FastAPI, OpenCV, NumPy, Pydantic, Pytest, Ruff y mypy estricto.
- Infraestructura local: Docker y Docker Compose.

El repositorio utiliza un monolito modular con límites explícitos entre transporte HTTP, servicios de aplicación y adaptadores de visión. Consulta [la documentación de arquitectura](docs/ARCHITECTURE.md) y [el contrato de la API](docs/API_CONTRACT.md).

## Ejecución local

Requisitos: Docker Desktop y Docker Compose. Node.js solo es necesario si se desean ejecutar herramientas del frontend fuera de Docker.

```powershell
Copy-Item .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/health
- OpenAPI: http://localhost:8000/api/docs

Para detener los servicios:

```powershell
docker compose down
```

## Flujo de demostración

1. Pulsa **Comenzar verificación** en la pantalla de bienvenida.
2. Activa la cámara y concede el permiso solicitado por el navegador.
3. Mantén un solo rostro centrado y con iluminación frontal.
4. Pulsa **Capturar rostro**; el navegador seleccionará la mejor de tres tomas.
5. Fotografía o carga el lado del documento que contiene el retrato.
6. Confirma visualmente las dos imágenes en el resumen.
7. Pulsa **Comparar rostros** y revisa la decisión y la puntuación.

`localhost` permite usar la cámara durante el desarrollo. Un despliegue remoto necesita HTTPS.

## Controles de calidad

```powershell
docker compose exec frontend npm run quality
docker compose exec backend ruff check app tests tools
docker compose exec backend ruff format --check app tests tools
docker compose exec backend mypy app tests
docker compose exec backend pytest -q
```

`npm run quality` ejecuta type-check, lint, pruebas y build de producción. El backend aplica análisis estático estricto y pruebas unitarias y de integración.

## Interpretación del resultado

La cifra presentada es una **puntuación de similitud coseno**, no una probabilidad estadística de identidad. El umbral predeterminado de SFace es configurable mediante `FACE_MATCH_THRESHOLD`. Si la confianza de detección facial es insuficiente, el resultado será `inconclusive` aunque la similitud alcance el umbral.

El umbral debe calibrarse con datos representativos y autorizados antes de utilizar la aplicación en un contexto real.

## Privacidad y seguridad

- Las imágenes, rostros alineados y embeddings se mantienen en memoria y se descartan al terminar cada solicitud.
- No existe base de datos ni historial biométrico.
- Los payloads de imágenes no se escriben en logs.
- La API limita tamaño, formatos y dimensiones decodificadas.
- Los orígenes CORS son explícitos y configurables.
- No deben incorporarse documentos reales al repositorio ni a los fixtures de prueba.

## Limitaciones conocidas

- La captura en vivo cumple el alcance del reto, pero no implementa una prueba de vida certificada ni protección completa contra fotografías o pantallas.
- El sistema no valida todavía campos, autenticidad física u OCR del documento.
- Fotografías antiguas, pequeñas, borrosas o con reflejos pueden producir un resultado inconcluso.
- La aplicación es una demostración técnica y no sustituye una solución KYC certificada ni una revisión humana.

## Documentación adicional

- [Arquitectura](docs/ARCHITECTURE.md)
- [Contrato de la API](docs/API_CONTRACT.md)
- [Despliegue público gratuito](docs/DEPLOYMENT.md)
- [Decisiones arquitectónicas](docs/decisions)
- [Avisos de terceros](THIRD_PARTY_NOTICES.md)
