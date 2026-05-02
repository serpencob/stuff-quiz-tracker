alter table public.people enable row level security;
alter table public.quiz_entries enable row level security;

drop policy if exists people_full_access on public.people;
create policy people_full_access
  on public.people
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists quiz_entries_full_access on public.quiz_entries;
create policy quiz_entries_full_access
  on public.quiz_entries
  for all
  to anon, authenticated
  using (true)
  with check (true);
