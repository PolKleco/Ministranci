-- Delegowani administratorzy parafii (ministranci z uprawnieniami rankingu)
-- mogą zarządzać minusami oraz wyjątkami auto-kary za dyżury.

do $$
begin
  if to_regclass('public.minusowe_punkty') is not null then
    execute 'alter table public.minusowe_punkty enable row level security';

    execute 'drop policy if exists "Admin can insert minusowe" on public.minusowe_punkty';
    execute $sql$
      create policy "Admin can insert minusowe"
        on public.minusowe_punkty
        for insert
        with check (
          public.has_parafia_permission(public.minusowe_punkty.parafia_id, 'manage_ranking_settings')
          or public.has_parafia_permission(public.minusowe_punkty.parafia_id, 'manage_ranking')
        )
    $sql$;

    execute 'drop policy if exists "Admin can delete minusowe" on public.minusowe_punkty';
    execute $sql$
      create policy "Admin can delete minusowe"
        on public.minusowe_punkty
        for delete
        using (
          public.has_parafia_permission(public.minusowe_punkty.parafia_id, 'manage_ranking_settings')
          or public.has_parafia_permission(public.minusowe_punkty.parafia_id, 'manage_ranking')
        )
    $sql$;
  end if;

  if to_regclass('public.auto_dyzur_minus_ignored') is not null then
    execute 'alter table public.auto_dyzur_minus_ignored enable row level security';

    execute 'drop policy if exists "Admin can manage auto dyzur ignored" on public.auto_dyzur_minus_ignored';
    execute $sql$
      create policy "Admin can manage auto dyzur ignored"
        on public.auto_dyzur_minus_ignored
        for all
        using (
          public.has_parafia_permission(public.auto_dyzur_minus_ignored.parafia_id, 'manage_ranking_settings')
          or public.has_parafia_permission(public.auto_dyzur_minus_ignored.parafia_id, 'manage_ranking')
        )
        with check (
          public.has_parafia_permission(public.auto_dyzur_minus_ignored.parafia_id, 'manage_ranking_settings')
          or public.has_parafia_permission(public.auto_dyzur_minus_ignored.parafia_id, 'manage_ranking')
        )
    $sql$;
  end if;
end $$;
