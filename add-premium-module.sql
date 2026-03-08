
-- =============================================
-- MODUŁ PREMIUM I SYSTEM PŁATNOŚCI
-- =============================================

-- 1. Plany subskrypcji
create table if not exists plany (
  id uuid default gen_random_uuid() primary key,
  nazwa text not null,
  cena_miesieczna integer not null,
  max_ministrantow integer not null,
  created_at timestamptz default now()
);

-- 2. Kody rabatowe
create table if not exists rabaty (
  id uuid default gen_random_uuid() primary key,
  kod text unique not null,
  procent_znizki integer not null check (procent_znizki between 1 and 100),
  jednorazowy boolean default true,
  wazny_do date,
  uzycia integer default 0,
  max_uzyc integer default 1,
  parafia_id uuid references parafie(id) on delete set null,
  created_at timestamptz default now()
);

-- 3. Rozszerzenie tabeli `parafie` o dane subskrypcji
alter table parafie add column if not exists plan_id uuid references plany(id);
alter table parafie add column if not exists rabat_id uuid references rabaty(id);
alter table parafie add column if not exists tier text default 'free';
alter table parafie add column if not exists is_active boolean default false;

-- RLS
alter table plany enable row level security;
alter table rabaty enable row level security;

-- Polityki dla `plany` (publiczne do odczytu)
create policy "Plany są publiczne" on plany for select using (true);
create policy "Admini mogą zarządzać planami" on plany for all using (true); -- Dostosuj, jeśli masz superadmina

-- Polityki dla `rabaty`
create policy "Rabaty są publiczne do odczytu" on rabaty for select using (true);
create policy "Admini mogą zarządzać rabatami" on rabaty for all using (true); -- Dostosuj, jeśli masz superadmina
