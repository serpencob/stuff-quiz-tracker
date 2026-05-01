create extension if not exists "pgcrypto";

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_entries (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  entry_date date not null,
  correct_count integer not null check (correct_count >= 0),
  incorrect_count integer not null check (incorrect_count >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_entries_person_date
  on public.quiz_entries (person_id, entry_date desc);
