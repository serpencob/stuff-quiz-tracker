# Supabase backend

This folder holds SQL migrations and optional seed data for the quiz tracker schema.

The React app uses the Supabase JS client in the browser with the **anon** key. Apply all migrations (including open-access RLS) before testing from `frontend`.

Migration files (run in this order):

1. `migrations/202605010001_initial_schema.sql` — tables and indexes  
2. `migrations/202605010002_open_access_policies.sql` — RLS + permissive policies for the MVP  
3. `migrations/202605020001_group_quiz_sessions.sql` — group quiz sessions (dashboard chart) + RLS
4. `migrations/202605230001_add_quiz_entry_sessions.sql` — explicit individual quiz session IDs

---

## Apply migrations with the Supabase CLI

These steps apply your local `migrations/` folder to a **remote** Supabase project (hosted Postgres).

### Prerequisites

1. A [Supabase](https://supabase.com) account and a **new or existing project**.
2. The **project reference ID**: in the dashboard, open **Project Settings → General** and copy **Reference ID** (also appears in the project URL: `https://supabase.com/dashboard/project/<project-ref>`).
3. The Supabase CLI installed on your machine. Pick one:

   - **macOS (Homebrew):** `brew install supabase/tap/supabase`
   - **npm (cross-platform):** `npm install -g supabase`
   - **Other options:** see [Supabase CLI docs](https://supabase.com/docs/guides/cli).

   Confirm: `supabase --version`

### Step 1 — Log in to Supabase

From any directory:

```bash
supabase login
```

This opens a browser flow and stores a token for the CLI.

### Step 2 — Open a terminal at the repository root

The repo root is the directory that contains the `supabase/` folder (next to `frontend/`, `README.md`, etc.):

```bash
cd /path/to/stuff-quiz-tracker
```

### Step 3 — Initialize Supabase config (only if missing)

If there is **no** `supabase/config.toml` in this repo yet, generate one once:

```bash
supabase init
```

- Creates `supabase/config.toml` and standard folders.
- Your existing `supabase/migrations/*.sql` files are left in place and are picked up by the CLI.

If `supabase init` complains that the folder already exists, skip this step.

### Step 4 — Link the CLI to your remote project

Still at the **repository root**:

```bash
supabase link --project-ref <your-project-ref>
```

Replace `<your-project-ref>` with the Reference ID from the dashboard.

- The CLI may ask for the **database password** (the one you set when creating the project, or reset under **Project Settings → Database**).
- After linking, the CLI stores project metadata locally (e.g. under `supabase/.temp/` — do not commit secrets; `.gitignore` should exclude temp/cache files if you add patterns).

### Step 5 — Push migrations to the remote database

```bash
supabase db push
```

This:

- Compares your local `supabase/migrations/` SQL files with what has already been applied on the remote database.
- Applies any **pending** migrations in order (by filename).

You should see confirmation that migrations ran successfully. If something fails, read the error output (common issues: typo in SQL, permission, or connection).

### Step 6 — (Optional) Load seed data

Seed file: `supabase/seed.sql` (example rows only).

**Recommended — SQL Editor**  
Dashboard → **SQL Editor → New query**, paste the full contents of `supabase/seed.sql`, then **Run**.

**Optional — `psql`**  
If you use PostgreSQL’s client and have the **database connection string** (Dashboard → **Project Settings → Database**), you can run:

```bash
psql "<your-connection-string>" -f supabase/seed.sql
```

Use the URI from the dashboard (often labeled “Connection string” / “URI”) and keep credentials out of shared logs or commits.

### Step 7 — Verify in the dashboard

1. **Table Editor** — confirm tables `people`, `quiz_entries`, and `group_quiz_sessions` exist.
2. **Authentication** is not required for this MVP schema; the app uses the **anon** key with RLS policies from migration `202605010002_*`.

### Step 8 — Wire the frontend

In the repo root `.env` (or hosting env vars):

- `VITE_SUPABASE_URL` — **Project Settings → API → Project URL**
- `VITE_SUPABASE_ANON_KEY` — **Project Settings → API → anon public key**

Then run the app from `frontend` per the root `README.md`.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| `supabase: command not found` | Install the CLI (Prerequisites) and ensure your PATH includes it. |
| Link asks for password you forgot | Dashboard → **Project Settings → Database → Reset database password** (save it somewhere safe). |
| `db push` says nothing to apply | Migrations may already be applied; check **Database → Migrations** in the dashboard or migration history. |
| Push fails on SQL error | Open the failing migration file, fix SQL, then push again; if the broken migration partially ran, you may need to repair manually in SQL Editor or ask Supabase docs for **repair migration** workflows. |
| Wrong project linked | Run `supabase link --project-ref <correct-ref>` again from the repo root. |

---

## Alternative: run SQL by hand (no CLI)

If you prefer not to use the CLI:

1. Open Supabase **SQL Editor**.
2. Run `migrations/202605010001_initial_schema.sql` in full, then execute.
3. Run `migrations/202605010002_open_access_policies.sql` in full, then execute.
4. Run `migrations/202605020001_group_quiz_sessions.sql` in full, then execute.
5. Run `migrations/202605230001_add_quiz_entry_sessions.sql` in full, then execute.

Order matters; do not skip the RLS migration if you use the browser client with the anon key.
