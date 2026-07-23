# Architecture

## Context

The application captures a live selfie and an identity-document image, then compares the detected faces. Biometric data is sensitive, so the initial design avoids persistence and processes images in memory.

## Architectural style

The project uses a modular monolith with two deployable applications:

- A React single-page application responsible for camera access, document acquisition, user guidance and result presentation.
- A FastAPI application responsible for input validation, image processing, face detection, embedding generation and comparison.

The face-model adapter uses OpenCV YuNet for detection and OpenCV SFace for alignment, feature extraction and cosine comparison. The adapter is protected by an inference lock because its detector input size is mutable and requests may execute concurrently.

This style keeps deployment and local development simple while preserving module boundaries. Microservices are not justified for the current scale.

## Request flow

1. The browser captures a selfie through `MediaDevices.getUserMedia`.
2. The user captures or uploads the document image.
3. The frontend submits both files as `multipart/form-data`.
4. The API validates size, declared media type and decoded image content.
5. The face adapter requires one significant face in the selfie and selects the most likely portrait from document variants.
6. The comparison service calculates the embedding similarity.
7. The API returns a normalized result and immediately releases image data.

## Backend boundaries

- `api`: HTTP transport, request parsing and response mapping.
- `schemas`: public API contracts.
- `services`: application use cases and image-processing orchestration.
- `adapters`: external face-model and image-library integration.
- `core`: configuration and shared domain errors.

HTTP routes must not contain image-processing or comparison logic. Services must not depend on FastAPI request objects.

## Frontend boundaries

- `components`: reusable presentation and interaction units.
- `hooks`: browser lifecycle and camera behavior.
- `services`: HTTP integration.
- `types`: stable application contracts.
- `config`: environment-dependent values.

Components must not build API URLs or call `fetch` directly.

## Privacy and security

- Images and embeddings are not persisted.
- Image content is never written to application logs.
- File size and actual decoded content are validated.
- Only supported raster formats are accepted.
- CORS origins are explicit and environment-driven.
- Production camera access requires HTTPS.
- Similarity is not presented as a statistical probability of identity.

## Testing strategy

- Unit tests cover image validation, comparison rules and deterministic frame-quality selection.
- API integration tests cover multipart requests and error mappings.
- Component tests cover preview, replacement, submission and result presentation states.
- Camera permission and device behavior require a manual browser check because they depend on real browser hardware APIs.
