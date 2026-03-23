-- Opcjonalna godzina dyżuru ministranta
alter table if exists public.dyzury
  add column if not exists godzina text;
