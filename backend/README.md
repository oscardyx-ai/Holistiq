# Holistiq FastAPI Backend

This service is the backend companion to the Next.js frontend. It is designed
to work with Supabase Auth and a Postgres database, while keeping the
wellbeing-scoring and analytics logic in Python.

## What It Handles

- Supabase bearer-token verification
- User profile hydration from JWT claims
- Check-in CRUD for morning, night, and weekly sessions
- Reminder and privacy settings
- Family-member records and graph-sharing permissions
- Connected-app snapshots
- Daily summary and trend analytics
- A single wellness-state endpoint that can hydrate the frontend

## Quick Start

1. Create a virtual environment.
2. Install dependencies:

```bash
npm run setup:backend
```

3. Copy env values:

```bash
cp backend/.env.example backend/.env
```

4. Start the API:

```bash
npm run dev:backend
```

The API will be available at `http://127.0.0.1:8000`, with docs at `/docs`.

## Environment

- `DATABASE_URL`
  - Defaults to a local SQLite file for quick development.
  - For production, point this at Supabase Postgres or another Postgres instance.
- `SUPABASE_JWT_SECRET`
  - Used for HS256 verification if your project uses a shared JWT secret.
- `SUPABASE_URL`
  - Used to derive the JWKS endpoint for RS256 verification when a shared secret
    is not present.
- `ALLOW_INSECURE_DEV_AUTH`
  - When `true`, accepts `X-Dev-User` headers for local development.

## Suggested Frontend Integration

- Load `/api/v1/wellness/state` after Supabase sign-in.
- Persist check-ins through `POST /api/v1/check-ins`.
- Replace local reminder/privacy/family state with the settings endpoints.
- Use `/api/v1/insights/summary` and `/api/v1/insights/trends` for dashboards.
