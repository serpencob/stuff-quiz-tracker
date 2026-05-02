insert into public.people (name)
values
  ('Alana'),
  ('Anton'),
  ('Justine'),
  ('Marilia'),
  ('Nick'),
  ('Ranjit')
on conflict do nothing;
