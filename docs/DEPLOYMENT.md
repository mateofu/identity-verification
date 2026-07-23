# Free public demo deployment

This deployment uses Vercel Hobby for the Vite frontend and a public Hugging Face Docker Space on free CPU hardware for the FastAPI backend.

## 1. Publish the source repository

Before pushing, verify that `.env`, `node_modules`, generated builds, personal photographs and identity documents are not tracked. Git operations and repository creation are intentionally left to the repository owner.

After the push, confirm that the `Quality` GitHub Actions workflow succeeds.

## 2. Deploy the backend to a Docker Space

1. Create a public Hugging Face Space and select **Docker** with free CPU hardware.
2. Publish the contents of the repository's `backend` directory at the root of the Space repository. The included `README.md` declares `sdk: docker` and `app_port: 8000`.
3. In the Space settings, add this variable using the final Vercel project URL:

   ```text
   ALLOWED_ORIGINS=https://YOUR-PROJECT.vercel.app
   ```

4. Wait for the Space to report **Running**.
5. Verify these URLs:

   ```text
   https://YOUR-SPACE.hf.space/api/health
   https://YOUR-SPACE.hf.space/api/docs
   ```

The free Space sleeps after a period of inactivity. A new visitor wakes it. The frontend retries the health request and disables facial comparison until the API is ready.

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
   VITE_API_URL=https://YOUR-SPACE.hf.space
   ```

5. Deploy and copy the final `https://YOUR-PROJECT.vercel.app` URL.
6. If the actual URL differs from `ALLOWED_ORIGINS`, update that Space variable. The backend restarts automatically. Multiple exact origins can be separated with commas.

## 4. Production smoke test

Use a desktop and, if available, a mobile device:

1. Open the Vercel URL in a private browser window.
2. Wait until the header reports **Servicio disponible**.
3. Grant camera permission and capture a selfie.
4. Capture a document with the rear camera or upload an authorized test image.
5. Confirm both previews and run the comparison.
6. Exercise `match`, `no_match`, `inconclusive`, permission denial and retry paths.
7. Leave the application unused long enough to test the cold-start messaging separately.

## 5. Demo disclosure

Include this note with the public URL:

> This technical demo uses free infrastructure. If the AI service was inactive, wait until the status changes to "Servicio disponible" before comparing images.

Do not use real identity documents for public demonstrations. The application does not persist images, but uploaded content is still processed by the hosting provider.
