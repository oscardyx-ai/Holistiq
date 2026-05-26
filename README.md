# Holistiq

Holistiq is a wellness check-in product built to run as a single Next.js app
on Vercel. Supabase handles authentication and Postgres persistence, while the
Next route handlers own the app's server-side data and analytics logic.

## Local Development

Install dependencies:

```bash
npm install
```

Create your local env file:

```bash
cp .env.example .env.local
```

Set real values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Apply the Supabase schema in
[supabase/migrations/20260525_create_holistiq_schema.sql](/Users/d16zheng/Projects/Holistiq/supabase/migrations/20260525_create_holistiq_schema.sql:1)
through the Supabase SQL editor before using the app data routes.

Run the app:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Current Architecture

- Supabase Auth powers Google sign-in.
- `app/api/backend/[...path]/route.ts` now handles the app data API inside Next.
- Supabase Postgres stores check-ins, settings, family members, and connected app snapshots.
- Daily summaries and trend analytics are computed in TypeScript on the server.

## Optional Services

- `RESEND_API_KEY` enables family invite emails.
- `DEEPGRAM_API_KEY` powers transcription.
- `GROQ_API_KEY` powers voice check-in extraction.

## Legacy Backend

The old FastAPI backend remains in [backend/README.md](backend/README.md) as
reference code, but it is no longer required for local development or Vercel
deployment.
