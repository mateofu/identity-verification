# Free public demo deployment

This deployment uses Vercel Hobby for the Vite frontend and a Render Free Web
Service for the FastAPI backend.

## 1. Publish and validate the repository

Before pushing, verify that `.env`, `node_modules`, generated builds, personal
photographs and identity documents are not tracked. Confirm that the `Quality`
GitHub Actions workflow succeeds.

## 2. Deploy the backend on Render

1. Create a **Web Service** connected to the GitHub repository.
2. Use these settings:

   ```text
   Name: identity-verification-api
   Branch: main
   Language: Docker
   Root Directory: backend
   Dockerfile Path: ./Dockerfile
   Instance Type: Free
   Health Check Path: /api/health
   ```

3. Add these environment variables:

   ```text
   ALLOWED_ORIGINS=https://YOUR-PROJECT.vercel.app
   MAXIMUM_IMAGE_SIZE_BYTES=10485760
   MAXIMUM_IMAGE_PIXELS=6000000
   MAXIMUM_PROCESSING_IMAGE_PIXELS=2000000
   ```

   `MAXIMUM_IMAGE_PIXELS` limits the dimensions accepted by the API.
   `MAXIMUM_PROCESSING_IMAGE_PIXELS` proportionally reduces the resolution
   used by OpenCV to keep inference memory bounded.

4. Deploy and verify:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/api/health
   https://YOUR-RENDER-SERVICE.onrender.com/api/docs
   ```

The free service sleeps after a period of inactivity. A new request wakes it.
The frontend retries the health request and disables facial comparison until
the API is ready.

## 3. Deploy the frontend to Vercel

1. Import the GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel reads `frontend/vercel.json`; verify:

   ```text
   Framework: Vite
   Build command: npm run build
   Output directory: dist
   ```

4. Add this environment variable for Production and Preview:

   ```text
   VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
   ```

5. Deploy and copy the final `https://YOUR-PROJECT.vercel.app` URL.
6. Replace `ALLOWED_ORIGINS` in Render with that exact URL and redeploy.

## 4. Production smoke test

Use a desktop and, if available, a mobile device:

1. Open the Vercel URL in a private browser window.
2. Wait until the header reports **Servicio disponible**.
3. Select **Comenzar verificación** on the welcome screen.
4. Grant camera permission and capture a selfie.
5. Capture a document with the rear camera or upload an authorized test image.
6. Confirm both previews and run the comparison.
7. Exercise `match`, `no_match`, `inconclusive`, permission denial and retry paths.
8. Test the cold-start messaging after the backend has been idle.

## 5. Demo disclosure

Include this note with the public URL:

> This technical demo uses free infrastructure. If the AI service was inactive,
> wait until the status changes to "Servicio disponible" before comparing images.

Do not use real identity documents for public demonstrations. The application
does not persist images, but uploaded content is still processed by the hosting
provider.
