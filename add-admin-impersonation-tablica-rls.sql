-- =============================================
-- FIX: RLS dla tablicy/ankiet w trybie wejscia admina do parafii
-- =============================================

create or replace function public.can_manage_parafia_as_ksiadz(p_parafia_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_has_access boolean := false;
begin
  if auth.uid() is null or p_parafia_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.parafie p
    where p.id = p_parafia_id
      and p.admin_id = auth.uid()
  )
  into v_has_access;

  if v_has_access then
    return true;
  end if;

  begin
    execute $query$
      select exists (
        select 1
        from public.admin_impersonation_sessions s
        where s.admin_user_id = auth.uid()
          and s.target_parafia_id = $1
          and s.impersonated_typ = 'ksiadz'
          and s.ended_at is null
      )
    $query$
    into v_has_access
    using p_parafia_id;
  exception
    when undefined_table then
      return false;
  end;

  return coalesce(v_has_access, false);
end;
$$;

-- tablica_watki
alter table public.tablica_watki enable row level security;

drop policy if exists "Watki viewable by parish members" on public.tablica_watki;
create policy "Watki viewable by parish members" on public.tablica_watki
  for select using (
    exists (select 1 from public.parafia_members where parafia_members.parafia_id = tablica_watki.parafia_id and parafia_members.profile_id = auth.uid())
    or public.can_manage_parafia_as_ksiadz(tablica_watki.parafia_id)
  );

drop policy if exists "Ksiadz can insert any watek" on public.tablica_watki;
create policy "Ksiadz can insert any watek" on public.tablica_watki
  for insert with check (
    public.can_manage_parafia_as_ksiadz(tablica_watki.parafia_id)
  );

drop policy if exists "Autor or admin can update watek" on public.tablica_watki;
create policy "Autor or admin can update watek" on public.tablica_watki
  for update using (
    auth.uid() = autor_id
    or public.can_manage_parafia_as_ksiadz(tablica_watki.parafia_id)
  );

drop policy if exists "Admin can delete watek" on public.tablica_watki;
create policy "Admin can delete watek" on public.tablica_watki
  for delete using (
    public.can_manage_parafia_as_ksiadz(tablica_watki.parafia_id)
  );

-- tablica_wiadomosci
alter table public.tablica_wiadomosci enable row level security;

drop policy if exists "Wiadomosci viewable by parish members" on public.tablica_wiadomosci;
create policy "Wiadomosci viewable by parish members" on public.tablica_wiadomosci
  for select using (
    exists (
      select 1 from public.tablica_watki tw
      join public.parafia_members pm on pm.parafia_id = tw.parafia_id
      where tw.id = tablica_wiadomosci.watek_id and pm.profile_id = auth.uid()
    )
    or exists (
      select 1
      from public.tablica_watki tw
      where tw.id = tablica_wiadomosci.watek_id
        and public.can_manage_parafia_as_ksiadz(tw.parafia_id)
    )
  );

drop policy if exists "Autor or admin can delete wiadomosc" on public.tablica_wiadomosci;
create policy "Autor or admin can delete wiadomosc" on public.tablica_wiadomosci
  for delete using (
    auth.uid() = autor_id
    or exists (
      select 1
      from public.tablica_watki tw
      where tw.id = tablica_wiadomosci.watek_id
        and public.can_manage_parafia_as_ksiadz(tw.parafia_id)
    )
  );

-- ankiety
alter table public.ankiety enable row level security;

drop policy if exists "Ankiety viewable by parish members" on public.ankiety;
create policy "Ankiety viewable by parish members" on public.ankiety
  for select using (
    exists (select 1 from public.parafia_members where parafia_members.parafia_id = ankiety.parafia_id and parafia_members.profile_id = auth.uid())
    or public.can_manage_parafia_as_ksiadz(ankiety.parafia_id)
  );

drop policy if exists "Admin can insert ankiety" on public.ankiety;
create policy "Admin can insert ankiety" on public.ankiety
  for insert with check (
    public.can_manage_parafia_as_ksiadz(ankiety.parafia_id)
  );

drop policy if exists "Admin can update ankiety" on public.ankiety;
create policy "Admin can update ankiety" on public.ankiety
  for update using (
    public.can_manage_parafia_as_ksiadz(ankiety.parafia_id)
  );

-- ankiety_opcje
alter table public.ankiety_opcje enable row level security;

drop policy if exists "Admin can insert opcje" on public.ankiety_opcje;
create policy "Admin can insert opcje" on public.ankiety_opcje
  for insert with check (
    exists (
      select 1
      from public.ankiety a
      where a.id = ankiety_opcje.ankieta_id
        and public.can_manage_parafia_as_ksiadz(a.parafia_id)
    )
  );

-- ankiety_odpowiedzi
alter table public.ankiety_odpowiedzi enable row level security;

drop policy if exists "Admin sees all odpowiedzi" on public.ankiety_odpowiedzi;
create policy "Admin sees all odpowiedzi" on public.ankiety_odpowiedzi
  for select using (
    exists (
      select 1
      from public.ankiety a
      where a.id = ankiety_odpowiedzi.ankieta_id
        and public.can_manage_parafia_as_ksiadz(a.parafia_id)
    )
  );

-- powiadomienia
alter table public.powiadomienia enable row level security;

drop policy if exists "Admin can insert powiadomienia" on public.powiadomienia;
create policy "Admin can insert powiadomienia" on public.powiadomienia
  for insert with check (
    public.can_manage_parafia_as_ksiadz(powiadomienia.parafia_id)
  );
