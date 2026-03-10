-- =============================================
-- FIX: RLS dla zarzadzania ministrantami w trybie wejscia admina
-- =============================================
-- Umozliwia przypisywanie do grup, zatwierdzanie, usuwanie i edycje danych
-- czlonkow parafii podczas aktywnej sesji impersonacji jako ksiadz.

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

-- profiles: aktualizacja profilu członka przez księdza lub admina w impersonacji
alter table public.profiles enable row level security;

drop policy if exists "Admin can update member profiles" on public.profiles;
create policy "Admin can update member profiles" on public.profiles
  for update using (
    exists (
      select 1
      from public.parafia_members pm
      where pm.profile_id = profiles.id
        and public.can_manage_parafia_as_ksiadz(pm.parafia_id)
    )
  );

-- parafia_members: zarządzanie członkami
alter table public.parafia_members enable row level security;

drop policy if exists "Admin can update members" on public.parafia_members;
create policy "Admin can update members" on public.parafia_members
  for update using (
    public.can_manage_parafia_as_ksiadz(parafia_members.parafia_id)
  );

drop policy if exists "Admin can delete members" on public.parafia_members;
create policy "Admin can delete members" on public.parafia_members
  for delete using (
    public.can_manage_parafia_as_ksiadz(parafia_members.parafia_id)
  );
