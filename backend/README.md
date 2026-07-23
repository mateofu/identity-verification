# Identity Verification API

FastAPI service for the Identity Verification demo. It uses OpenCV YuNet for face detection and SFace for face recognition.

The service processes images in memory and does not persist biometric data. It runs
on the port supplied through `PORT`, defaulting to `8000` for local execution.
Configure `ALLOWED_ORIGINS` with the exact public URL of the Vercel frontend.
Separate multiple exact origins with commas.
`MAXIMUM_PROCESSING_IMAGE_PIXELS` limits the resolution used by OpenCV and
defaults to 2 megapixels to keep inference memory bounded on small instances.

Public endpoints:

- `GET /api/health`
- `POST /api/v1/verifications`
- `GET /api/docs`
