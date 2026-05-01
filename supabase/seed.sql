insert into public.people (name)
values
  ('Alice'),
  ('Bob')
on conflict do nothing;
