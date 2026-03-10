-- =============================================
-- ADMIN: WEJSCIE DO PANELU PARAFII (IMPERSONACJA)
-- =============================================

create table if not exists public.admin_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  admin_email text not null,
  target_parafia_id uuid not null references public.parafie(id) on delete cascade,
  impersonated_typ text not null check (impersonated_typ in ('ksiadz', 'ministrant')),
  previous_typ text not null check (previous_typ in ('ksiadz', 'ministrant', 'nowy')),
  previous_parafia_id uuid references public.parafie(id) on delete set null,
  previous_member_data jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text
);

create unique index if not exists admin_impersonation_one_active_per_admin_idx
  on public.admin_impersonation_sessions (admin_user_id)
  where ended_at is null;

create index if not exists admin_impersonation_target_parafia_idx
  on public.admin_impersonation_sessions (target_parafia_id, started_at desc);

alter table public.admin_impersonation_sessions enable row level security;
