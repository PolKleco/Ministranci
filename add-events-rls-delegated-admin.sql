-- Umożliwia edycję wydarzeń i funkcji administratorom parafialnym
-- z uprawnieniem "__perm__:manage_events" lub rolą "__parafia_admin__".

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

alter table public.sluzby enable row level security;
alter table public.funkcje enable row level security;

drop policy if exists "Ksiadz can insert sluzby" on public.sluzby;
drop policy if exists "Ksiadz can update sluzby" on public.sluzby;
drop policy if exists "Ksiadz can delete sluzby" on public.sluzby;

create policy "Ksiadz can insert sluzby" on public.sluzby
  for insert with check (
    public.has_parafia_permission(parafia_id, 'manage_events')
    and auth.uid() = utworzono_przez
  );

create policy "Ksiadz can update sluzby" on public.sluzby
  for update using (
    public.has_parafia_permission(parafia_id, 'manage_events')
  )
  with check (
    public.has_parafia_permission(parafia_id, 'manage_events')
  );

create policy "Ksiadz can delete sluzby" on public.sluzby
  for delete using (
    public.has_parafia_permission(parafia_id, 'manage_events')
  );

drop policy if exists "Funkcje insert by sluzba creator" on public.funkcje;
drop policy if exists "Funkcje update by sluzba creator or assigned" on public.funkcje;
drop policy if exists "Funkcje delete by sluzba creator" on public.funkcje;

create policy "Funkcje insert by sluzba creator" on public.funkcje
  for insert with check (
    exists (
      select 1
      from public.sluzby s
      where s.id = funkcje.sluzba_id
        and public.has_parafia_permission(s.parafia_id, 'manage_events')
    )
  );

create policy "Funkcje update by sluzba creator or assigned" on public.funkcje
  for update using (
    exists (
      select 1
      from public.sluzby s
      where s.id = funkcje.sluzba_id
        and public.has_parafia_permission(s.parafia_id, 'manage_events')
    )
    or ministrant_id = auth.uid()
  )
  with check (
    exists (
      select 1
      from public.sluzby s
      where s.id = funkcje.sluzba_id
        and public.has_parafia_permission(s.parafia_id, 'manage_events')
    )
    or ministrant_id = auth.uid()
  );

create policy "Funkcje delete by sluzba creator" on public.funkcje
  for delete using (
    exists (
      select 1
      from public.sluzby s
      where s.id = funkcje.sluzba_id
        and public.has_parafia_permission(s.parafia_id, 'manage_events')
    )
  );
