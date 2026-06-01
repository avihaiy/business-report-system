Deploying the backend (`server.cjs`) to Render (Docker)

1) Create a new Web Service on Render
   - Connect your GitHub repo `avihaiy/business-report-system`.
   - Choose "Docker" as the environment (Render will use the repository Dockerfile).
   - Set the service name (e.g., `business-report-api`), and the port to `4000`.
   - Enable `Auto Deploy` from the `main` branch.

2) Environment / Secrets
   - In your GitHub repository, add a repository secret named `VITE_API_BASE` with the public URL of your deployed API, e.g. `https://business-report-api.onrender.com`.
   - In Render, ensure the service is reachable (it will provide a URL).

3) Frontend (GitHub Pages / Vercel / Static hosting)
   - The frontend build reads `VITE_API_BASE` at build time and/or `window.__API_BASE__` at runtime.
   - For GitHub Actions builds we added the workflow secret usage so the build will pick up `VITE_API_BASE` when Actions runs.

4) Optional: runtime override
   - If you host the frontend static files separately and need to point to the API after build, add this snippet to `index.html` before the bundle script:
     <script>window.__API_BASE__ = 'https://your-api.example.com'</script>

5) Verify
   - Deploy the backend on Render and copy the public URL.
   - Add the `VITE_API_BASE` secret to GitHub (Repository → Settings → Secrets → Actions).
   - Push a commit to `main` to trigger the build & deploy workflows.
   - Visit the frontend and test editing users — changes should persist because the frontend now sends PUT requests to the central API and the server writes `data/db.json`.

If you’d like, I can deploy the backend to Render for you (requires repo access) or prepare a `docker-compose` + `nginx` setup for a VPS. Tell me which you prefer.