# Stuff Quiz Tracker Monorepo

Quiz statistics tracker:

- `frontend`: React + Vite + TypeScript — talks to **Supabase** directly (anon key + RLS policies)
- `supabase`: SQL migrations and seed data

## Features

- **Dashboard:** Line chart of **group** quiz sessions (correct count 0–15 each); new sessions use **today’s date** automatically. **Individual** logging: per-person correct/incorrect in local state, saved in **one Submit** per batch (same automatic date).
- **Analytics:** Add people; filter by person and date range; **correct vs incorrect per day** (summed when multiple entries share a day).
- **LocalStorage** fallback when `VITE_DATA_MODE=local` (includes `group_quiz_sessions` in browser storage).

## Prerequisites

- Node.js 20+
- Bun 1.2+

## Quick start

1. `bun install`
2. `cp .env.example .env` at the **repository root** (same folder as `README.md`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project (Settings → API). Only names starting with `VITE_` are exposed to the app. After changing env vars, restart the dev server. Vite loads `.env` from the repo root (`frontend/vite.config.ts` → `envDir`).
3. Apply migrations (Supabase SQL editor or CLI), in order:
   - `supabase/migrations/202605010001_initial_schema.sql`
   - `supabase/migrations/202605010002_open_access_policies.sql`
   - `supabase/migrations/202605020001_group_quiz_sessions.sql`
4. `bun run dev`

### Data mode

- `VITE_DATA_MODE=supabase` (default): Postgres via Supabase JS client  
- `VITE_DATA_MODE=local`: browser-only storage, no shared data

## Scripts

- `bun run dev` — start Vite dev server  
- `bun run build`  
- `bun run typecheck`

## Routes

- `/` — Dashboard  
- `/analytics` — People + charts (`/people` and `/history` redirect here)

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
