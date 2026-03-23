-- Wskazanie, który stary dyżur ma zostać zastąpiony przy zmianie terminu.
alter table if exists public.dyzury
  add column if not exists zastepuje_dzien_tygodnia integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dyzury_zastepuje_dzien_tygodnia_check'
  ) then
    alter table public.dyzury
      add constraint dyzury_zastepuje_dzien_tygodnia_check
      check (zastepuje_dzien_tygodnia between 0 and 6);
  end if;
end $$;
