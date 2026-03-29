-- Delegowani administratorzy parafii (ministranci z uprawnieniami rankingu)
-- mogą dodawać i usuwać wpisy historii punktów ręcznych.

alter table public.punkty_reczne enable row level security;

drop policy if exists "Admin can insert punkty reczne" on public.punkty_reczne;
create policy "Admin can insert punkty reczne"
  on public.punkty_reczne
  for insert
  with check (
    public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking_settings')
    or public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking')
  );

drop policy if exists "Admin can delete punkty reczne" on public.punkty_reczne;
create policy "Admin can delete punkty reczne"
  on public.punkty_reczne
  for delete
  using (
    public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking_settings')
    or public.has_parafia_permission(public.punkty_reczne.parafia_id, 'manage_ranking')
  );
