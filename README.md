# Holistiq

Holistiq is a wellness check-in product with a Next.js frontend and a FastAPI
backend. The frontend handles the authenticated app shell and interaction
design, while the backend is designed to own data persistence, analytics,
family-sharing state, and future integrations.

## Frontend

Run the Next.js app:

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Backend

The FastAPI backend lives in [backend/README.md](/Users/d16zheng/Projects/Holistiq/backend/README.md:1).

Quick start:

```bash
pip install -e ./backend
cp backend/.env.example backend/.env
uvicorn backend.app.main:app --reload --app-dir .
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at
`/docs`.

## Backend Capabilities

- Supabase bearer-token verification
- Per-user check-in persistence
- Reminder and privacy settings
- Family-member records and graph-sharing permissions
- Connected-app snapshot ingestion
- Daily summary and trend analytics in Python
- A frontend hydration endpoint at `/api/v1/wellness/state`
