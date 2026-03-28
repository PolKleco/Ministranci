create table if not exists public.auto_dyzur_minus_ignored (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid not null references public.parafie(id) on delete cascade,
  ministrant_id uuid not null references public.profiles(id) on delete cascade,
  data date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (parafia_id, ministrant_id, data)
);

create index if not exists idx_auto_dyzur_minus_ignored_parafia
  on public.auto_dyzur_minus_ignored(parafia_id);

create index if not exists idx_auto_dyzur_minus_ignored_ministrant_data
  on public.auto_dyzur_minus_ignored(ministrant_id, data);

alter table public.auto_dyzur_minus_ignored enable row level security;

drop policy if exists "Auto dyzur ignored viewable by parish members" on public.auto_dyzur_minus_ignored;
create policy "Auto dyzur ignored viewable by parish members" on public.auto_dyzur_minus_ignored
  for select using (
    exists (
      select 1
      from public.parafia_members pm
      where pm.parafia_id = auto_dyzur_minus_ignored.parafia_id
        and pm.profile_id = auth.uid()
    )
  );

drop policy if exists "Admin can manage auto dyzur ignored" on public.auto_dyzur_minus_ignored;
create policy "Admin can manage auto dyzur ignored" on public.auto_dyzur_minus_ignored
  for all using (
    exists (
      select 1
      from public.parafie p
      where p.id = auto_dyzur_minus_ignored.parafia_id
        and p.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.parafie p
      where p.id = auto_dyzur_minus_ignored.parafia_id
        and p.admin_id = auth.uid()
    )
  );
