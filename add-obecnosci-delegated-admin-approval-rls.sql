-- Delegowani administratorzy parafii mogą zatwierdzać/odrzucać zgłoszenia aktywności
-- oraz usuwać wpisy obecności zgodnie z nadanymi uprawnieniami rankingu.

alter table public.obecnosci enable row level security;

drop policy if exists "Admin can update obecnosci" on public.obecnosci;
create policy "Admin can update obecnosci"
  on public.obecnosci
  for update
  using (
    public.has_parafia_permission(public.obecnosci.parafia_id, 'approve_ranking_submissions')
    or public.has_parafia_permission(public.obecnosci.parafia_id, 'manage_ranking')
  );

drop policy if exists "Admin can delete obecnosci" on public.obecnosci;
create policy "Admin can delete obecnosci"
  on public.obecnosci
  for delete
  using (
    public.has_parafia_permission(public.obecnosci.parafia_id, 'manage_ranking_settings')
    or public.has_parafia_permission(public.obecnosci.parafia_id, 'manage_ranking')
  );
