-- Panel zbiórki ministrantów
-- 1) Rozszerza tabelę sluzby o pola zbiórki
-- 2) Dodaje tabelę obecności na zbiórce

create or replace function public.has_parafia_permission(p_parafia_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parafia_members pm
    where pm.parafia_id = p_parafia_id
      and pm.profile_id = auth.uid()
      and (
        pm.typ = 'ksiadz'
        or coalesce(pm.role, '{}'::text[]) @> array['__parafia_admin__']
        or coalesce(pm.role, '{}'::text[]) @> array['__perm__:' || p_permission]
      )
  );
$$;

alter table public.sluzby
  add column if not exists typ text default 'wydarzenie';

update public.sluzby
set typ = 'wydarzenie'
where typ is null or btrim(typ) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sluzby_typ_check'
      and conrelid = 'public.sluzby'::regclass
  ) then
    alter table public.sluzby
      add constraint sluzby_typ_check check (typ in ('wydarzenie', 'zbiorka'));
  end if;
end$$;

alter table public.sluzby
  add column if not exists miejsce text,
  add column if not exists notatka text,
  add column if not exists zbiorka_dla_wszystkich boolean default true,
  add column if not exists grupy_docelowe text[] default '{}'::text[],
  add column if not exists punkty_za_obecnosc integer default 0,
  add column if not exists punkty_za_nieobecnosc integer default 0;

create table if not exists public.zbiorka_obecnosci (
  id uuid default gen_random_uuid() primary key,
  sluzba_id uuid references public.sluzby(id) on delete cascade not null,
  ministrant_id uuid references public.profiles(id) on delete cascade not null,
  parafia_id uuid references public.parafie(id) on delete cascade not null,
  status text not null check (status in ('obecny', 'nieobecny', 'usprawiedliwiony')),
  punkty_przyznane integer default 0,
  created_at timestamptz default now(),
  unique (sluzba_id, ministrant_id)
);

create index if not exists idx_zbiorka_obecnosci_sluzba on public.zbiorka_obecnosci(sluzba_id);
create index if not exists idx_zbiorka_obecnosci_parafia on public.zbiorka_obecnosci(parafia_id);
create index if not exists idx_zbiorka_obecnosci_ministrant on public.zbiorka_obecnosci(ministrant_id);

alter table public.zbiorka_obecnosci enable row level security;

drop policy if exists "Zbiorka attendance viewable by parish members" on public.zbiorka_obecnosci;
create policy "Zbiorka attendance viewable by parish members" on public.zbiorka_obecnosci
  for select using (
    exists (
      select 1
      from public.parafia_members pm
      where pm.parafia_id = zbiorka_obecnosci.parafia_id
        and pm.profile_id = auth.uid()
    )
  );

drop policy if exists "Zbiorka attendance insert by event managers" on public.zbiorka_obecnosci;
create policy "Zbiorka attendance insert by event managers" on public.zbiorka_obecnosci
  for insert with check (
    public.has_parafia_permission(parafia_id, 'manage_events')
  );

drop policy if exists "Zbiorka attendance update by event managers" on public.zbiorka_obecnosci;
create policy "Zbiorka attendance update by event managers" on public.zbiorka_obecnosci
  for update
  using (public.has_parafia_permission(parafia_id, 'manage_events'))
  with check (public.has_parafia_permission(parafia_id, 'manage_events'));

drop policy if exists "Zbiorka attendance delete by event managers" on public.zbiorka_obecnosci;
create policy "Zbiorka attendance delete by event managers" on public.zbiorka_obecnosci
  for delete using (
    public.has_parafia_permission(parafia_id, 'manage_events')
  );
