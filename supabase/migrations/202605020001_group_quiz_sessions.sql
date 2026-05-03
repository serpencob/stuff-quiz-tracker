create table if not exists public.group_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  correct_count integer not null check (correct_count >= 0 and correct_count <= 15),
  quiz_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_group_quiz_sessions_quiz_date_created
  on public.group_quiz_sessions (quiz_date desc, created_at desc);

alter table public.group_quiz_sessions enable row level security;

drop policy if exists group_quiz_sessions_full_access on public.group_quiz_sessions;
create policy group_quiz_sessions_full_access
  on public.group_quiz_sessions
  for all
  to anon, authenticated
  using (true)
  with check (true);
