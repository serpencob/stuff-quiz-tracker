# Stuff Quiz Tracker Monorepo

Initial scaffold for a quiz statistics app with:

- `frontend`: React + Vite + TypeScript
- `backend`: Express + TypeScript API service
- `supabase`: SQL migrations and seed data

## Prerequisites

- Node.js 20+
- Bun 1.2+

## Quick start

1. Install dependencies:
   - `bun install`
2. Copy environment template:
   - `cp .env.example .env`
3. Run frontend:
   - `bun run dev:frontend`
4. Run backend:
   - `bun run dev:backend`

## Workspace scripts

- `bun run dev:frontend`
- `bun run dev:backend`
- `bun run build`
- `bun run typecheck`

## Next implementation steps

- Connect frontend forms to backend routes
- Add CRUD endpoints for people and quiz entries
- Add charts and historical analytics views
- Configure Supabase project and apply migrations