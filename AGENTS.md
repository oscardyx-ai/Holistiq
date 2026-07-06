# Holistiq – Project Context

Holistiq is a wellness tracking web app. Stack: Next.js (App Router),
TypeScript, Tailwind CSS, Supabase (Postgres + Auth via Google OAuth),
@supabase/ssr. Integrations: Deepgram (speech-to-text), Groq (LLM
inference), Resend (email).

## Current features

- Google OAuth login via Supabase Auth
- Today tab: check-ins, streak, weekly review; Insights, Learn, Family tabs
- Conversational check-in (ConversationalCheckin.tsx + /api/chat-checkin):
  chatbot-style, typed or voice input. Voice = Deepgram nova-3 via
  /api/transcribe; extraction = Groq llama-3.1-8b-instant.
- Tiered questionnaire engine (lib/questionnaire/): 126 questions,
  trigger/trend rules, SafetyScreen, TierSelector in settings
- Family invite email via Resend
- Full-bleed layout: dark green (#1a4332) sticky navbar, cream body
- Lottie lotus tied to streak

## Supabase schema

user_profiles, check_in_sessions (answers JSON), reminder_settings,
privacy_settings, family_members, connected_app_snapshots.
No health goals tables yet — deferred intentionally.

## Verify / in progress

- Check-in data persists correctly to check_in_sessions
- Confirmation UI after family invite email

## Planned

1. Learn tab AI summaries (Claude Haiku, cached)
2. Health profile / goals data layer

## Conventions

- Supabase clients: @/lib/supabase/client.ts / server.ts
- Components in /components, pages in /app
- Backend = Next.js API routes only (FastAPI removed, don't reintroduce)
- Never touch next-env.d.ts
- After major changes: rm -rf .next && npm run dev
