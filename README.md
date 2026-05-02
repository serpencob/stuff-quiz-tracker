# Stuff Quiz Tracker Monorepo

Quiz statistics tracker:

- `frontend`: React + Vite + TypeScript — talks to **Supabase** directly (anon key + RLS policies)
- `supabase`: SQL migrations and seed data

Features:

- People add/list
- Quiz entries (date, correct/incorrect, optional note)
- Date filters (7/30/90/all), totals, accuracy
- History charts (Recharts)
- **LocalStorage** fallback when `VITE_DATA_MODE=local`

## Prerequisites

- Node.js 20+
- Bun 1.2+

## Quick start

1. `bun install`
2. `cp .env.example .env` at the **repository root** (same folder as `README.md`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project (Settings → API). Only names starting with `VITE_` are exposed to the app. After changing env vars, restart the dev server. Vite is set up to load `.env` from the repo root, not from `frontend/` alone.
3. Apply migrations (Supabase SQL editor or CLI), in order:
   - `supabase/migrations/202605010001_initial_schema.sql`
   - `supabase/migrations/202605010002_open_access_policies.sql`
4. `bun run dev`

Data mode:

- `VITE_DATA_MODE=supabase` (default): Postgres via Supabase JS client
- `VITE_DATA_MODE=local`: browser-only storage, no shared data

## Scripts

- `bun run dev` — start Vite dev server
- `bun run build`
- `bun run typecheck`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
