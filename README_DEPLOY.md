# Deployment Instructions

This project includes a Dockerfile and a GitHub Actions workflow to build and deploy the app.

## Options

1. DockerHub image build & push (recommended if you have DockerHub):
   - Set the following GitHub repository secrets:
     - `DOCKERHUB_USERNAME` — your Docker Hub username
     - `DOCKERHUB_TOKEN` — a Docker Hub access token (or your password)
   - Push to `main` — the workflow will build and push the image to `DOCKERHUB_USERNAME/business-report-system:latest`.

2. SSH deploy to your server:
   - Ensure your server has Docker and docker-compose installed and a suitable `docker-compose.yml` in the remote dir.
   - Set the following GitHub repository secrets:
     - `SSH_PRIVATE_KEY` — private key for SSH
     - `SSH_HOST` — server host (IP or domain)
     - `SSH_USER` — SSH username
     - `SSH_PORT` — optional (defaults to 22)
     - `SSH_REMOTE_DIR` — path on the server where the project/docker-compose is
     - (optional) `DOCKER_IMAGE` — image to pull on remote
   - Push to `main` — the workflow will SSH and run `docker-compose up -d`.

3. Manual Docker run (locally)

```bash
# build
docker build -t business-report-system:latest .
# run
docker run -p 4000:4000 business-report-system:latest
```

## Notes
- The Dockerfile builds the client (Vite) and copies `dist` into the image; `server.cjs` serves the API and static files.
- The GitHub Actions workflow will not auto-deploy to Render or Railway — those platforms require using their APIs or GitHub integrations and API keys.

If you want, I can set up a Render deploy workflow as well — I will need a Render Service ID and API key (or you can add them as GitHub secrets and I will add the workflow).