-- Historia ręcznych korekt punktów widoczna dla ministranta w "Historii misji".
create table if not exists public.punkty_reczne (
  id uuid default gen_random_uuid() primary key,
  ministrant_id uuid references public.profiles(id) on delete cascade not null,
  parafia_id uuid references public.parafie(id) on delete cascade not null,
  data date not null default current_date,
  powod text not null default '',
  punkty numeric not null,
  created_at timestamptz default now()
);

alter table public.punkty_reczne enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'punkty_reczne'
      and policyname = 'Punkty reczne viewable by parish members'
  ) then
    create policy "Punkty reczne viewable by parish members"
      on public.punkty_reczne
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'punkty_reczne'
      and policyname = 'Admin can insert punkty reczne'
  ) then
    create policy "Admin can insert punkty reczne"
      on public.punkty_reczne
      for insert
      with check (
        public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking_settings')
        or public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'punkty_reczne'
      and policyname = 'Admin can delete punkty reczne'
  ) then
    create policy "Admin can delete punkty reczne"
      on public.punkty_reczne
      for delete
      using (
        public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking_settings')
        or public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking')
      );
  end if;
end $$;
