# FluentLeap — local build, Stripe and Ollama integration

This repository contains a static front-end served by Nginx and a small Node.js API (Fastify) in `api/`.

Quick local run (requires Docker and Docker Compose):

```powershell
# from repo root
docker compose up --build
```

API endpoints added:

- POST `/api/stripe/create-payment-intent` -> creates a Stripe PaymentIntent. Requires `STRIPE_SECRET_KEY` env var.
- POST `/api/ollama/proxy` -> forwards prompt to an Ollama HTTP instance. Configure `OLLAMA_URL` and optional model.

Environment variables (for local Docker Compose or production):

- `DATABASE_URL` - Postgres connection string (already in `docker-compose.yml` for compose)
- `STRIPE_SECRET_KEY` - secret key for Stripe API
- `OLLAMA_URL` - optional, default `http://localhost:11434`

CI / publish:

A GitHub Actions workflow is included at `.github/workflows/ci-build-and-publish.yml` that builds and pushes images to GitHub Container Registry (GHCR) when you push to `main`/`master`. Make sure `GITHUB_TOKEN` has package write permissions (default for workflows) or replace with a PAT stored in `secrets.GHCR_PAT`.

Notes:

- Ollama must be running and reachable from the server for the Ollama proxy endpoint to work.
- Stripe keys are secrets; do not commit them. For GitHub Actions, add them as repository secrets.
