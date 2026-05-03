# Deployment Guide (Free Tiers)

## Production (recommended)

- Host **`frontend`** on Vercel or Netlify (static site, free tier).
- Use **Supabase** Postgres + REST (free tier). There is **no Node backend** in this repo.

### Environment variables (hosting dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Project URL (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Yes | `anon` `public` key |
| `VITE_DATA_MODE` | No | Default `supabase`. Use `local` only for offline demo |

Apply **all** migrations from `supabase/migrations/` before going live (including `202605020001_group_quiz_sessions.sql` for the dashboard group chart).

### Security note

Open RLS policies (`202605010002_open_access_policies.sql`) mean anyone with the anon key can read/write. That matches the MVP “no roles” requirement. For production with abuse risk, tighten policies or add auth.

## Browser-only fallback

Set `VITE_DATA_MODE=local`. Deploy `frontend` only. Data stays in that browser.

## Vercel

- Root directory: `frontend`
- Build: `bun run build`
- Output: `dist`

## Netlify

- Base directory: `frontend`
- Build: `bun run build`
- Publish: `frontend/dist`
- SPA redirects: `frontend/public/_redirects`
