# FluentLeap — local build, Stripe and Ollama integration

This repository contains a static front-end served by Nginx and a small Node.js API (Fastify) in `api/`.

Quick local run (requires Docker and Docker Compose):

```powershell
# from repo root
docker compose up --build
```

### Running with a Pre-built Docker Image

If you prefer not to build the image locally, you can pull it from our public ECR repository:

```bash
# Pull the latest image
docker pull 506279660589.dkr.ecr.us-east-1.amazonaws.com/dea:latest

# Run the image
docker run -p 8080:80 -e STRIPE_SECRET_KEY=your_stripe_secret_key -e OLLAMA_URL=http://localhost:11434 506279660589.dkr.ecr.us-east-1.amazonaws.com/dea:latest
```

**Note:** You will need to replace `your_stripe_secret_key` with your actual Stripe secret key. The `OLLAMA_URL` is optional and defaults to `http://localhost:11434`.

API endpoints added:

- POST `/api/stripe/create-payment-intent` -> creates a Stripe PaymentIntent. Requires `STRIPE_SECRET_KEY` env var.
- POST `/api/ollama/proxy` -> forwards prompt to an Ollama HTTP instance. Configure `OLLAMA_URL` and optional model.

Environment variables (for local Docker Compose or production):

- `DATABASE_URL` - Postgres connection string (already in `docker-compose.yml` for compose)
- `STRIPE_SECRET_KEY` - secret key for Stripe API
- `OLLAMA_URL` - optional, default `http://localhost:11434`

Auth0 (front-end + API)
-----------------------

This repo includes a minimal front-end Auth0 integration. Follow these steps to create an Auth0 application and API so users can log in and call protected API endpoints (for example `/api/orders`).

Auth0 dashboard settings (exact fields):

- Create an API (Auth0 → APIs → Create API)
  - Name: Deacademy API
  - Identifier: <https://api.deacademy> (this will be the `AUTH0_AUDIENCE` for your server)
  - Signing Algorithm: RS256

- Create a Single Page Application (Auth0 → Applications → Create Application)
  - Name: Deacademy Web
  - Application Type: Single Page Application
  - Allowed Callback URLs: `https://your-domain.example/` and `http://localhost:8080/` (add whichever you'll use locally)
  - Allowed Logout URLs: `http://localhost:8080/` (and production URL)
  - Allowed Web Origins: `http://localhost:8080`

Client-side wiring
------------------

1. Edit `index.html` and set `window.AUTH0_CONFIG` values near the bottom of the file (these values are already set below using the example values you provided):

- `domain`: `genai-3604538806120605.us.auth0.com`
- `clientId`: `XrhqJd7H5JMAZgA3XrO75qszxbiaKLdK`
- `audience`: `https://denglishacademy.com`

Note: the SPA only needs the public Client ID, domain and audience. Do NOT store or commit any client secret in the repo.

2. The front-end includes `auth.js` which provides `deacademyAuth` on `window`.

- It attaches login/logout to the header `#loginBtn` and will store tokens in localStorage.
- Use `window.deacademyAuth.authFetch('/api/orders')` to call protected API endpoints.

Server-side environment variables
---------------------------------

- `AUTH0_DOMAIN` — set to your tenant domain. Example for this project:

 `genai-3604538806120605.us.auth0.com`

- `AUTH0_AUDIENCE` — set to the API Identifier you created. Recommended for this project:

  `https://denglishacademy.com`

- `AUTH0_ISSUER` — set to `https://{AUTH0_DOMAIN}/` (include trailing slash). Example:

 `https://genai-3604538806120605.us.auth0.com/`

Make sure these environment variables are present in your runtime environment (Docker Compose, production env, or GitHub Actions secrets). The API uses JWKS from Auth0 to validate tokens.

## Auth0 API Identifier & Client Grant

You mentioned an API Identifier and a client grant (Grant ID: `cgr_xclfvy3DaVqU9Nu1`). To ensure the client (SPA or backend client) can request the scopes it needs, authorize the client for the API in the Auth0 Dashboard:

1. In Auth0 Dashboard → APIs, create a new API Identifier if you don't already have one and set it to `https://denglishacademy.com`.
2. In Auth0 Dashboard → Applications, find the client (SPA or Machine-to-Machine app), open the "APIs" tab and click "Authorize" for the API above.
3. Select the scopes (permissions) you want this client to have. For this project you might add a small set such as:

- `read:orders` — allow reading orders from the API
- `write:orders` — (optional) allow creating/updating orders via API

4. Save the grant. Auth0 will create a Client Grant (you reported Grant ID `cgr_xclfvy3DaVqU9Nu1`).

Caution: avoid using the Auth0 Management API identifier (`https://{tenant}/api/v2/`) for your public SPA. Instead use the dedicated API identifier `https://denglishacademy.com` to scope access to your application API. Only use the Management API for trusted machine-to-machine clients and administrative operations.

Security notes
--------------

- Keep client secrets and private keys out of the repo. Use GitHub Secrets or environment variables.
- When deploying to production, add your production domain(s) to the Auth0 Allowed Callback and Origins lists.

CI / publish:

A GitHub Actions workflow is included at `.github/workflows/ci-build-and-publish.yml` that builds and pushes images to GitHub Container Registry (GHCR) when you push to `main`/`master`. Make sure `GITHUB_TOKEN` has package write permissions (default for workflows) or replace with a PAT stored in `secrets.GHCR_PAT`.

Notes:

- Ollama must be running and reachable from the server for the Ollama proxy endpoint to work.
- Stripe keys are secrets; do not commit them. For GitHub Actions, add them as repository secrets.
