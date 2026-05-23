alter table public.quiz_entries
  add column if not exists session_id uuid;

update public.quiz_entries
set session_id = gen_random_uuid()
where session_id is null;

alter table public.quiz_entries
  alter column session_id set default gen_random_uuid(),
  alter column session_id set not null;

create index if not exists idx_quiz_entries_entry_date_session
  on public.quiz_entries (entry_date desc, session_id);
