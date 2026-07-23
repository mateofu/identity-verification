---
title: Identity Verification API
emoji: 🔐
colorFrom: blue
colorTo: green
sdk: docker
app_port: 8000
---

# Identity Verification API

FastAPI service for the Identity Verification demo. It uses OpenCV YuNet for face detection and SFace for face recognition.

The service processes images in memory and does not persist biometric data. Configure `ALLOWED_ORIGINS` with the exact public URL of the Vercel frontend. Separate multiple exact origins with commas.

Public endpoints:

- `GET /api/health`
- `POST /api/v1/verifications`
- `GET /api/docs`
