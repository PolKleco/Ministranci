-- =============================================
-- TABELE DLA APLIKACJI MINISTRANCI
-- Wklej cały ten kod w SQL Editor w Supabase
-- =============================================

-- 1. Profile użytkowników
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  imie text not null,
  nazwisko text not null default '',
  typ text not null check (typ in ('ksiadz', 'ministrant', 'nowy')),
  diecezja text default null,
  parafia_id uuid,
  created_at timestamptz default now()
);

-- 2. Parafie
create table parafie (
  id uuid default gen_random_uuid() primary key,
  nazwa text not null,
  miasto text not null,
  adres text default '',
  admin_id uuid references profiles(id) not null,
  admin_email text not null,
  kod_zaproszenia text unique not null,
  created_at timestamptz default now()
);

-- Kolumna JSONB na konfigurację funkcji (dynamiczne typy funkcji w wydarzeniach)
-- ALTER TABLE parafie ADD COLUMN IF NOT EXISTS funkcje_config jsonb default '[]';

-- Dodaj klucz obcy z profiles do parafie
alter table profiles add constraint fk_parafia foreign key (parafia_id) references parafie(id);

-- 3. Członkowie parafii
create table parafia_members (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  email text not null,
  imie text not null,
  nazwisko text not null default '',
  typ text not null check (typ in ('ksiadz', 'ministrant')),
  grupa text check (grupa in ('mlodsi', 'starsi', 'lektorzy')),
  role text[] default '{}',
  created_at timestamptz default now(),
  unique(profile_id, parafia_id)
);

-- 4. Służby
create table sluzby (
  id uuid default gen_random_uuid() primary key,
  nazwa text not null,
  data date not null,
  godzina text not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  utworzono_przez uuid references profiles(id) not null,
  status text default 'zaplanowana' check (status in ('zaplanowana', 'wykonana')),
  created_at timestamptz default now()
);

-- 5. Funkcje w służbach
create table funkcje (
  id uuid default gen_random_uuid() primary key,
  sluzba_id uuid references sluzby(id) on delete cascade not null,
  typ text not null,
  ministrant_id uuid references profiles(id),
  aktywna boolean default true,
  zaakceptowana boolean default false
);

-- 6. Harmonogram mszy
create table harmonogram (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid references parafie(id) on delete cascade not null,
  dzien text not null,
  godzina text not null,
  typ text default ''
);

-- 7. Zaproszenia
create table zaproszenia (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  parafia_nazwa text not null,
  admin_email text not null,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) - zabezpieczenia
-- =============================================

alter table profiles enable row level security;
alter table parafie enable row level security;
alter table parafia_members enable row level security;
alter table sluzby enable row level security;
alter table funkcje enable row level security;
alter table harmonogram enable row level security;
alter table zaproszenia enable row level security;

-- Profiles: każdy może czytać, użytkownik edytuje swój
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admin can update member profiles" on profiles for update using (
  exists (
    select 1 from parafia_members pm
    join parafie p on p.id = pm.parafia_id
    where pm.profile_id = profiles.id and p.admin_id = auth.uid()
  )
);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Parafie: każdy może czytać, admin może edytować
create policy "Parafie are viewable by everyone" on parafie for select using (true);
create policy "Admin can insert parafie" on parafie for insert with check (auth.uid() = admin_id);
create policy "Admin can update parafie" on parafie for update using (auth.uid() = admin_id);

-- Members: czytanie dla członków parafii, dodawanie/edycja
create policy "Members are viewable by parish members" on parafia_members for select using (true);
create policy "Anyone can join parish" on parafia_members for insert with check (auth.uid() = profile_id);
create policy "Admin can update members" on parafia_members for update using (
  exists (select 1 from parafie where parafie.id = parafia_members.parafia_id and parafie.admin_id = auth.uid())
);
create policy "Admin can delete members" on parafia_members for delete using (
  exists (select 1 from parafie where parafie.id = parafia_members.parafia_id and parafie.admin_id = auth.uid())
);

-- Sluzby: czytanie dla członków, tworzenie/edycja dla księdza
create policy "Sluzby viewable by parish members" on sluzby for select using (true);
create policy "Ksiadz can insert sluzby" on sluzby for insert with check (auth.uid() = utworzono_przez);
create policy "Ksiadz can update sluzby" on sluzby for update using (auth.uid() = utworzono_przez);
create policy "Ksiadz can delete sluzby" on sluzby for delete using (auth.uid() = utworzono_przez);

-- Funkcje: czytanie dla wszystkich, edycja powiązana
create policy "Funkcje viewable by everyone" on funkcje for select using (true);
create policy "Funkcje insert by sluzba creator" on funkcje for insert with check (
  exists (select 1 from sluzby where sluzby.id = funkcje.sluzba_id and sluzby.utworzono_przez = auth.uid())
);
create policy "Funkcje update by sluzba creator or assigned" on funkcje for update using (
  exists (select 1 from sluzby where sluzby.id = funkcje.sluzba_id and sluzby.utworzono_przez = auth.uid())
  or ministrant_id = auth.uid()
);
create policy "Funkcje delete by sluzba creator" on funkcje for delete using (
  exists (select 1 from sluzby where sluzby.id = funkcje.sluzba_id and sluzby.utworzono_przez = auth.uid())
);

-- Harmonogram: czytanie dla wszystkich, edycja dla admina
create policy "Harmonogram viewable by everyone" on harmonogram for select using (true);
create policy "Admin can insert harmonogram" on harmonogram for insert with check (
  exists (select 1 from parafie where parafie.id = harmonogram.parafia_id and parafie.admin_id = auth.uid())
);
create policy "Admin can delete harmonogram" on harmonogram for delete using (
  exists (select 1 from parafie where parafie.id = harmonogram.parafia_id and parafie.admin_id = auth.uid())
);

-- Zaproszenia: czytanie dla zaproszonych, tworzenie dla admina
create policy "User can see own zaproszenia" on zaproszenia for select using (true);
create policy "Admin can insert zaproszenia" on zaproszenia for insert with check (true);
create policy "User can delete own zaproszenia" on zaproszenia for delete using (true);

-- =============================================
-- TRIGGER: automatyczne tworzenie profilu po rejestracji
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_imie text;
  v_nazwisko text;
  v_typ text;
  v_diecezja text;
  v_provider text;
  v_full_name text;
begin
  v_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');

  if v_provider = 'email' then
    -- Rejestracja email: używamy pól przekazanych w signUp
    v_imie := coalesce(new.raw_user_meta_data->>'imie', '');
    v_nazwisko := coalesce(new.raw_user_meta_data->>'nazwisko', '');
    v_typ := coalesce(new.raw_user_meta_data->>'typ', 'ministrant');
    v_diecezja := new.raw_user_meta_data->>'diecezja';
  else
    -- Rejestracja OAuth: wyciągamy imię/nazwisko z metadanych providera
    v_imie := coalesce(
      new.raw_user_meta_data->>'given_name',
      new.raw_user_meta_data->>'first_name',
      ''
    );
    v_nazwisko := coalesce(
      new.raw_user_meta_data->>'family_name',
      new.raw_user_meta_data->>'last_name',
      ''
    );

    -- Fallback: jeśli imię puste, próbujemy podzielić full_name
    if v_imie = '' then
      v_full_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        ''
      );
      if v_full_name != '' then
        v_imie := split_part(v_full_name, ' ', 1);
        v_nazwisko := coalesce(
          nullif(trim(substring(v_full_name from position(' ' in v_full_name) + 1)), ''),
          ''
        );
      end if;
    end if;

    -- Użytkownicy OAuth zaczynają jako 'nowy' (wymagają uzupełnienia profilu)
    v_typ := 'nowy';
    v_diecezja := null;
  end if;

  insert into public.profiles (id, email, imie, nazwisko, typ, diecezja)
  values (
    new.id,
    coalesce(new.email, ''),
    v_imie,
    v_nazwisko,
    v_typ,
    v_diecezja
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================
-- RANKING SŁUŻBY — SYSTEM GRYWALNOŚCI
-- =============================================

-- 8. Konfiguracja punktacji (klucz-wartość, edytowalna przez księdza)
create table punktacja_config (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid references parafie(id) on delete cascade not null,
  klucz text not null,
  wartosc numeric not null,
  opis text default '',
  created_at timestamptz default now(),
  unique(parafia_id, klucz)
);

-- 9. Konfiguracja rang (edytowalna przez księdza)
create table rangi_config (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid references parafie(id) on delete cascade not null,
  nazwa text not null,
  min_pkt integer not null default 0,
  kolor text default 'gray',
  kolejnosc integer not null default 0,
  created_at timestamptz default now()
);

-- 10. Konfiguracja odznak (edytowalna przez księdza)
create table odznaki_config (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid references parafie(id) on delete cascade not null,
  nazwa text not null,
  opis text default '',
  warunek_typ text not null,
  warunek_wartosc integer not null default 1,
  bonus_pkt integer not null default 0,
  aktywna boolean default true,
  created_at timestamptz default now()
);

-- 11. Dyżury ministrantów (stałe dni tygodnia)
create table dyzury (
  id uuid default gen_random_uuid() primary key,
  ministrant_id uuid references profiles(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  dzien_tygodnia integer not null check (dzien_tygodnia between 0 and 6),
  aktywny boolean default true,
  created_at timestamptz default now(),
  unique(ministrant_id, parafia_id, dzien_tygodnia)
);

-- 12. Obecności (zgłoszenia ministrantów)
create table obecnosci (
  id uuid default gen_random_uuid() primary key,
  ministrant_id uuid references profiles(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  data date not null,
  godzina text default '',
  typ text not null check (typ in ('msza', 'nabożeństwo')),
  nazwa_nabożeństwa text default '',
  status text default 'oczekuje' check (status in ('oczekuje', 'zatwierdzona', 'odrzucona')),
  punkty_bazowe numeric default 0,
  mnoznik numeric default 1.0,
  punkty_finalne numeric default 0,
  zatwierdzona_przez uuid references profiles(id),
  created_at timestamptz default now()
);

-- 13. Minusowe punkty
create table minusowe_punkty (
  id uuid default gen_random_uuid() primary key,
  ministrant_id uuid references profiles(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  data date not null,
  powod text not null,
  punkty numeric not null,
  created_at timestamptz default now()
);

-- 14. Odznaki zdobyte przez ministrantów
create table odznaki_zdobyte (
  id uuid default gen_random_uuid() primary key,
  ministrant_id uuid references profiles(id) on delete cascade not null,
  odznaka_config_id uuid references odznaki_config(id) on delete cascade not null,
  bonus_pkt integer default 0,
  zdobyta_data timestamptz default now(),
  unique(ministrant_id, odznaka_config_id)
);

-- 15. Ranking (cache — aktualizowany przy zatwierdzaniu obecności)
create table ranking (
  id uuid default gen_random_uuid() primary key,
  ministrant_id uuid references profiles(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  total_pkt numeric default 0,
  streak_tyg integer default 0,
  max_streak_tyg integer default 0,
  total_obecnosci integer default 0,
  total_minusowe numeric default 0,
  ranga text default 'Ready',
  updated_at timestamptz default now(),
  unique(ministrant_id, parafia_id)
);


-- =============================================
-- RLS — RANKING SŁUŻBY
-- =============================================

alter table punktacja_config enable row level security;
alter table rangi_config enable row level security;
alter table odznaki_config enable row level security;
alter table dyzury enable row level security;
alter table obecnosci enable row level security;
alter table minusowe_punkty enable row level security;
alter table odznaki_zdobyte enable row level security;
alter table ranking enable row level security;

-- punktacja_config: wszyscy czytają, admin parafii edytuje
create policy "Punktacja viewable by parish members" on punktacja_config
  for select using (true);
create policy "Admin can insert punktacja" on punktacja_config
  for insert with check (
    exists (select 1 from parafie where parafie.id = punktacja_config.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can update punktacja" on punktacja_config
  for update using (
    exists (select 1 from parafie where parafie.id = punktacja_config.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete punktacja" on punktacja_config
  for delete using (
    exists (select 1 from parafie where parafie.id = punktacja_config.parafia_id and parafie.admin_id = auth.uid())
  );

-- rangi_config: wszyscy czytają, admin edytuje
create policy "Rangi viewable by everyone" on rangi_config
  for select using (true);
create policy "Admin can insert rangi" on rangi_config
  for insert with check (
    exists (select 1 from parafie where parafie.id = rangi_config.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can update rangi" on rangi_config
  for update using (
    exists (select 1 from parafie where parafie.id = rangi_config.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete rangi" on rangi_config
  for delete using (
    exists (select 1 from parafie where parafie.id = rangi_config.parafia_id and parafie.admin_id = auth.uid())
  );

-- odznaki_config: wszyscy czytają, admin edytuje
create policy "Odznaki config viewable by everyone" on odznaki_config
  for select using (true);
create policy "Admin can insert odznaki config" on odznaki_config
  for insert with check (
    exists (select 1 from parafie where parafie.id = odznaki_config.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can update odznaki config" on odznaki_config
  for update using (
    exists (select 1 from parafie where parafie.id = odznaki_config.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete odznaki config" on odznaki_config
  for delete using (
    exists (select 1 from parafie where parafie.id = odznaki_config.parafia_id and parafie.admin_id = auth.uid())
  );

-- dyzury: ministrant widzi swoje, admin widzi wszystkie w parafii
create policy "Dyzury viewable by parish members" on dyzury
  for select using (true);
create policy "Ministrant can insert own dyzury" on dyzury
  for insert with check (auth.uid() = ministrant_id);
create policy "Ministrant can update own dyzury" on dyzury
  for update using (auth.uid() = ministrant_id);
create policy "Ministrant can delete own dyzury" on dyzury
  for delete using (auth.uid() = ministrant_id);
create policy "Admin can manage dyzury" on dyzury
  for all using (
    exists (select 1 from parafie where parafie.id = dyzury.parafia_id and parafie.admin_id = auth.uid())
  );

-- obecnosci: ministrant widzi swoje, admin widzi i zatwierdza
create policy "Obecnosci viewable by parish members" on obecnosci
  for select using (true);
create policy "Ministrant can insert own obecnosci" on obecnosci
  for insert with check (auth.uid() = ministrant_id);
create policy "Admin can update obecnosci" on obecnosci
  for update using (
    exists (select 1 from parafie where parafie.id = obecnosci.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete obecnosci" on obecnosci
  for delete using (
    exists (select 1 from parafie where parafie.id = obecnosci.parafia_id and parafie.admin_id = auth.uid())
  );

-- minusowe_punkty: wszyscy w parafii widzą, system/admin dodaje
create policy "Minusowe viewable by parish members" on minusowe_punkty
  for select using (true);
create policy "Admin can insert minusowe" on minusowe_punkty
  for insert with check (
    exists (select 1 from parafie where parafie.id = minusowe_punkty.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete minusowe" on minusowe_punkty
  for delete using (
    exists (select 1 from parafie where parafie.id = minusowe_punkty.parafia_id and parafie.admin_id = auth.uid())
  );

-- odznaki_zdobyte: wszyscy widzą
create policy "Odznaki zdobyte viewable by everyone" on odznaki_zdobyte
  for select using (true);
create policy "System can insert odznaki zdobyte" on odznaki_zdobyte
  for insert with check (true);
create policy "Admin can delete odznaki zdobyte" on odznaki_zdobyte
  for delete using (
    exists (
      select 1 from parafia_members pm
      join parafie p on p.id = pm.parafia_id
      where pm.profile_id = odznaki_zdobyte.ministrant_id and p.admin_id = auth.uid()
    )
  );

-- ranking: wszyscy widzą
create policy "Ranking viewable by everyone" on ranking
  for select using (true);
create policy "System can upsert ranking" on ranking
  for insert with check (true);
create policy "System can update ranking" on ranking
  for update using (true);
create policy "Admin can delete ranking" on ranking
  for delete using (
    exists (select 1 from parafie where parafie.id = ranking.parafia_id and parafie.admin_id = auth.uid())
  );


-- =============================================
-- DOMYŚLNE DANE — wstawiane po utworzeniu parafii
-- Użyj funkcji inicjalizującej po INSERT do parafie
-- =============================================

create or replace function public.init_ranking_config(p_parafia_id uuid)
returns void as $$
begin
  -- Punkty za msze
  insert into punktacja_config (parafia_id, klucz, wartosc, opis) values
    (p_parafia_id, 'msza_dzien_powszedni', 5, 'Msza — dzień powszedni'),
    (p_parafia_id, 'msza_wspomnienie_dowolne', 7, 'Msza — wspomnienie dowolne'),
    (p_parafia_id, 'msza_wspomnienie_obowiazkowe', 8, 'Msza — wspomnienie obowiązkowe'),
    (p_parafia_id, 'msza_swieto', 12, 'Msza — święto'),
    (p_parafia_id, 'msza_uroczystosc', 15, 'Msza — uroczystość'),
    (p_parafia_id, 'msza_niedziela', 0, 'Msza — niedziela (obowiązkowa)'),
    -- Nabożeństwa
    (p_parafia_id, 'nabożeństwo_droga_krzyzowa', 10, 'Droga Krzyżowa (Wielki Post)'),
    (p_parafia_id, 'nabożeństwo_gorzkie_zale', 10, 'Gorzkie Żale (Wielki Post)'),
    (p_parafia_id, 'nabożeństwo_majowe', 8, 'Nabożeństwo Majowe (maj)'),
    (p_parafia_id, 'nabożeństwo_rozaniec', 8, 'Różaniec (październik)'),
    -- Mnożniki sezonowe
    (p_parafia_id, 'mnoznik_wielki_post', 1.5, 'Mnożnik — Wielki Post'),
    (p_parafia_id, 'mnoznik_adwent', 1.5, 'Mnożnik — Adwent'),
    (p_parafia_id, 'mnoznik_domyslny', 1.0, 'Mnożnik — pozostałe okresy'),
    -- Serie (streaki)
    (p_parafia_id, 'bonus_seria_3dni', 5, 'Bonus za 3 dni w tygodniu'),
    (p_parafia_id, 'bonus_seria_5dni', 15, 'Bonus za 5 dni w tygodniu'),
    (p_parafia_id, 'bonus_seria_6dni', 30, 'Bonus za pełny tydzień (6/6)'),
    (p_parafia_id, 'bonus_seria_4tyg', 50, 'Bonus za 4 tygodnie z rzędu'),
    (p_parafia_id, 'bonus_seria_8tyg', 120, 'Bonus za 8 tygodni z rzędu'),
    -- Ranking miesięczny
    (p_parafia_id, 'ranking_1_miejsce', 30, 'Bonus za 1. miejsce w miesiącu'),
    (p_parafia_id, 'ranking_2_miejsce', 20, 'Bonus za 2. miejsce w miesiącu'),
    (p_parafia_id, 'ranking_3_miejsce', 10, 'Bonus za 3. miejsce w miesiącu'),
    -- Minusowe punkty
    (p_parafia_id, 'minus_nieobecnosc_dyzur', -5, 'Nieobecność na dyżurze'),
    -- Ogólne
    (p_parafia_id, 'limit_dni_zgloszenie', 2, 'Limit dni na zgłoszenie obecności');

  -- Rangi
  insert into rangi_config (parafia_id, nazwa, min_pkt, kolor, kolejnosc) values
    (p_parafia_id, 'Ready', 0, 'gray', 1),
    (p_parafia_id, 'Rookie', 50, 'brown', 2),
    (p_parafia_id, 'Active', 150, 'green', 3),
    (p_parafia_id, 'Solid', 350, 'teal', 4),
    (p_parafia_id, 'Reliable', 600, 'blue', 5),
    (p_parafia_id, 'Skilled', 1000, 'indigo', 6),
    (p_parafia_id, 'Advanced', 1500, 'purple', 7),
    (p_parafia_id, 'Core Player', 2200, 'orange', 8),
    (p_parafia_id, 'Elite', 3200, 'amber', 9),
    (p_parafia_id, 'Top Tier', 5000, 'red', 10);

  -- Odznaki
  insert into odznaki_config (parafia_id, nazwa, opis, warunek_typ, warunek_wartosc, bonus_pkt) values
    (p_parafia_id, 'Pierwsza służba', 'Pierwsze zatwierdzone zgłoszenie', 'total_obecnosci', 1, 10),
    (p_parafia_id, 'Tygodniowy wojownik', 'Pełny tydzień służby (pon–sob)', 'pelny_tydzien', 1, 10),
    (p_parafia_id, 'Mistrz miesiąca', '1. miejsce w rankingu miesięcznym', 'ranking_miesieczny', 1, 30),
    (p_parafia_id, 'Wierny sługa', '30 zatwierdzonych dni łącznie', 'total_obecnosci', 30, 25),
    (p_parafia_id, 'Setka', '100 zatwierdzonych dni łącznie', 'total_obecnosci', 100, 50),
    (p_parafia_id, 'Adwentowy bohater', 'Min. 80% dni Adwentu', 'sezon_adwent', 80, 40),
    (p_parafia_id, 'Wielkopostny wojownik', 'Min. 80% dni Wielkiego Postu', 'sezon_wielki_post', 80, 50),
    (p_parafia_id, 'Triduum Paschalne', 'Służba we wszystkie 3 dni Triduum', 'triduum', 3, 30),
    (p_parafia_id, 'Droga wierności', '10 Dróg Krzyżowych w jednym W. Poście', 'nabożeństwo_droga_krzyzowa', 10, 30),
    (p_parafia_id, 'Różańcowy mistrz', '20 Różańców w październiku', 'nabożeństwo_rozaniec', 20, 30),
    (p_parafia_id, 'Majowy pielgrzym', '20 Nabożeństw Majowych w maju', 'nabożeństwo_majowe', 20, 30),
    (p_parafia_id, 'Rekord parafii', 'Najwyższy wynik w historii parafii', 'rekord_parafii', 1, 50),
    (p_parafia_id, 'Niezawodny', '0 nieobecności na dyżurach przez 2 miesiące', 'zero_minusowych_tyg', 8, 40),
    (p_parafia_id, 'Żelazna seria', '8-tygodniowy streak', 'streak_tyg', 8, 30);
end;
$$ language plpgsql security definer;

-- Trigger: automatyczna inicjalizacja konfiguracji przy tworzeniu parafii
create or replace function public.auto_init_ranking_config()
returns trigger as $$
begin
  perform public.init_ranking_config(new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_parafia_created_init_ranking
  after insert on parafie
  for each row execute procedure public.auto_init_ranking_config();


-- =============================================
-- TABLICA OGŁOSZEŃ — KOMUNIKACJA PARAFII
-- =============================================

-- 16. Wątki na tablicy (tematy, ogłoszenia, ankiety)
create table tablica_watki (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid references parafie(id) on delete cascade not null,
  autor_id uuid references profiles(id) on delete cascade not null,
  tytul text not null,
  tresc text default '',
  kategoria text not null check (kategoria in ('ogłoszenie', 'dyskusja', 'ankieta')),
  grupa_docelowa text default 'wszyscy'
    check (grupa_docelowa in ('wszyscy', 'mlodsi', 'starsi', 'lektorzy')),
  przypiety boolean default false,
  zamkniety boolean default false,
  archiwum_data timestamptz default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MIGRACJA: ALTER TABLE tablica_watki ADD COLUMN archiwum_data timestamptz DEFAULT NULL;

-- 17. Wiadomości w wątkach (odpowiedzi/komentarze)
create table tablica_wiadomosci (
  id uuid default gen_random_uuid() primary key,
  watek_id uuid references tablica_watki(id) on delete cascade not null,
  autor_id uuid references profiles(id) on delete cascade not null,
  tresc text not null,
  created_at timestamptz default now()
);

-- 18. Ankiety podpięte do wątków
create table ankiety (
  id uuid default gen_random_uuid() primary key,
  watek_id uuid references tablica_watki(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  pytanie text not null,
  typ text not null check (typ in ('tak_nie', 'jednokrotny', 'wielokrotny')),
  obowiazkowa boolean default false,
  wyniki_ukryte boolean default true,
  termin timestamptz,
  aktywna boolean default true,
  created_at timestamptz default now()
);

-- 19. Opcje ankiet
create table ankiety_opcje (
  id uuid default gen_random_uuid() primary key,
  ankieta_id uuid references ankiety(id) on delete cascade not null,
  tresc text not null,
  kolejnosc integer not null default 0
);

-- 20. Odpowiedzi na ankiety
create table ankiety_odpowiedzi (
  id uuid default gen_random_uuid() primary key,
  ankieta_id uuid references ankiety(id) on delete cascade not null,
  opcja_id uuid references ankiety_opcje(id) on delete cascade not null,
  respondent_id uuid references profiles(id) on delete cascade not null,
  zmieniona boolean default false,
  zmieniona_at timestamptz,
  created_at timestamptz default now(),
  unique(ankieta_id, opcja_id, respondent_id)
);

-- 21. Śledzenie odczytów wątków
create table tablica_przeczytane (
  id uuid default gen_random_uuid() primary key,
  watek_id uuid references tablica_watki(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  ostatnia_wizyta timestamptz default now(),
  unique(watek_id, user_id)
);

-- 22. Powiadomienia
create table powiadomienia (
  id uuid default gen_random_uuid() primary key,
  odbiorca_id uuid references profiles(id) on delete cascade not null,
  parafia_id uuid references parafie(id) on delete cascade not null,
  typ text not null check (typ in ('nowy_watek', 'ankieta', 'odpowiedz', 'przypomnienie')),
  tytul text not null,
  tresc text default '',
  odniesienie_typ text check (odniesienie_typ in ('watek', 'ankieta')),
  odniesienie_id uuid,
  przeczytane boolean default false,
  wymaga_akcji boolean default false,
  created_at timestamptz default now()
);


-- 23. Szablony wydarzeń
create table szablony_wydarzen (
  id uuid default gen_random_uuid() primary key,
  nazwa text not null,
  godzina text not null,
  funkcje jsonb default '{}',
  parafia_id uuid references parafie(id) on delete cascade not null,
  utworzono_przez uuid references profiles(id) not null,
  created_at timestamptz default now()
);

-- =============================================
-- RLS — TABLICA OGŁOSZEŃ
-- =============================================

alter table tablica_watki enable row level security;
alter table tablica_wiadomosci enable row level security;
alter table ankiety enable row level security;
alter table ankiety_opcje enable row level security;
alter table ankiety_odpowiedzi enable row level security;
alter table tablica_przeczytane enable row level security;
alter table powiadomienia enable row level security;

-- tablica_watki: członkowie parafii czytają, ksiądz tworzy wszystko, ministrant tylko dyskusje
create policy "Watki viewable by parish members" on tablica_watki
  for select using (
    exists (select 1 from parafia_members where parafia_members.parafia_id = tablica_watki.parafia_id and parafia_members.profile_id = auth.uid())
    or exists (select 1 from parafie where parafie.id = tablica_watki.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Ksiadz can insert any watek" on tablica_watki
  for insert with check (
    exists (select 1 from parafie where parafie.id = tablica_watki.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Ministrant can insert dyskusja" on tablica_watki
  for insert with check (
    auth.uid() = autor_id and kategoria = 'dyskusja'
  );
create policy "Autor or admin can update watek" on tablica_watki
  for update using (
    auth.uid() = autor_id
    or exists (select 1 from parafie where parafie.id = tablica_watki.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete watek" on tablica_watki
  for delete using (
    exists (select 1 from parafie where parafie.id = tablica_watki.parafia_id and parafie.admin_id = auth.uid())
  );

-- tablica_wiadomosci: członkowie czytają, zalogowani piszą (jeśli wątek otwarty)
create policy "Wiadomosci viewable by parish members" on tablica_wiadomosci
  for select using (
    exists (
      select 1 from tablica_watki tw
      join parafia_members pm on pm.parafia_id = tw.parafia_id
      where tw.id = tablica_wiadomosci.watek_id and pm.profile_id = auth.uid()
    )
    or exists (
      select 1 from tablica_watki tw
      join parafie p on p.id = tw.parafia_id
      where tw.id = tablica_wiadomosci.watek_id and p.admin_id = auth.uid()
    )
  );
create policy "Members can insert wiadomosci" on tablica_wiadomosci
  for insert with check (auth.uid() = autor_id);
create policy "Autor can update own wiadomosc" on tablica_wiadomosci
  for update using (auth.uid() = autor_id);
create policy "Autor or admin can delete wiadomosc" on tablica_wiadomosci
  for delete using (
    auth.uid() = autor_id
    or exists (
      select 1 from tablica_watki tw
      join parafie p on p.id = tw.parafia_id
      where tw.id = tablica_wiadomosci.watek_id and p.admin_id = auth.uid()
    )
  );

-- ankiety: członkowie czytają, admin tworzy/edytuje
create policy "Ankiety viewable by parish members" on ankiety
  for select using (
    exists (select 1 from parafia_members where parafia_members.parafia_id = ankiety.parafia_id and parafia_members.profile_id = auth.uid())
    or exists (select 1 from parafie where parafie.id = ankiety.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can insert ankiety" on ankiety
  for insert with check (
    exists (select 1 from parafie where parafie.id = ankiety.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can update ankiety" on ankiety
  for update using (
    exists (select 1 from parafie where parafie.id = ankiety.parafia_id and parafie.admin_id = auth.uid())
  );

-- ankiety_opcje: członkowie czytają, admin edytuje
create policy "Opcje viewable by everyone" on ankiety_opcje
  for select using (true);
create policy "Admin can insert opcje" on ankiety_opcje
  for insert with check (
    exists (
      select 1 from ankiety a
      join parafie p on p.id = a.parafia_id
      where a.id = ankiety_opcje.ankieta_id and p.admin_id = auth.uid()
    )
  );

-- ankiety_odpowiedzi: respondent widzi swoje, admin widzi wszystkie
create policy "Respondent sees own odpowiedzi" on ankiety_odpowiedzi
  for select using (auth.uid() = respondent_id);
create policy "Admin sees all odpowiedzi" on ankiety_odpowiedzi
  for select using (
    exists (
      select 1 from ankiety a
      join parafie p on p.id = a.parafia_id
      where a.id = ankiety_odpowiedzi.ankieta_id and p.admin_id = auth.uid()
    )
  );
create policy "Respondent can insert odpowiedz" on ankiety_odpowiedzi
  for insert with check (auth.uid() = respondent_id);
create policy "Respondent can delete own odpowiedz" on ankiety_odpowiedzi
  for delete using (auth.uid() = respondent_id);

-- tablica_przeczytane: użytkownik widzi/edytuje swoje
create policy "User sees own przeczytane" on tablica_przeczytane
  for select using (auth.uid() = user_id);
create policy "User can upsert przeczytane" on tablica_przeczytane
  for insert with check (auth.uid() = user_id);
create policy "User can update przeczytane" on tablica_przeczytane
  for update using (auth.uid() = user_id);

-- powiadomienia: odbiorca widzi swoje, system/admin tworzy
create policy "User sees own powiadomienia" on powiadomienia
  for select using (auth.uid() = odbiorca_id);
create policy "Admin can insert powiadomienia" on powiadomienia
  for insert with check (
    exists (select 1 from parafie where parafie.id = powiadomienia.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "User can update own powiadomienia" on powiadomienia
  for update using (auth.uid() = odbiorca_id);


-- =============================================
-- TRIGGERY — TABLICA OGŁOSZEŃ
-- =============================================

-- Auto aktualizacja updated_at na wątku po nowej wiadomości
create or replace function public.update_watek_timestamp()
returns trigger as $$
begin
  update tablica_watki set updated_at = now() where id = new.watek_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_wiadomosc_created_update_watek
  after insert on tablica_wiadomosci
  for each row execute procedure public.update_watek_timestamp();

-- Auto tworzenie opcji Tak/Nie dla ankiet typu tak_nie
create or replace function public.auto_create_tak_nie_opcje()
returns trigger as $$
begin
  if new.typ = 'tak_nie' then
    insert into ankiety_opcje (ankieta_id, tresc, kolejnosc) values
      (new.id, 'Tak', 1),
      (new.id, 'Nie', 2);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_ankieta_created_opcje
  after insert on ankiety
  for each row execute procedure public.auto_create_tak_nie_opcje();

-- Auto powiadomienia przy obowiązkowej ankiecie
create or replace function public.auto_notify_ankieta()
returns trigger as $$
begin
  if new.obowiazkowa = true then
    insert into powiadomienia (odbiorca_id, parafia_id, typ, tytul, tresc, odniesienie_typ, odniesienie_id, wymaga_akcji)
    select
      pm.profile_id,
      new.parafia_id,
      'ankieta',
      'Nowa ankieta wymaga odpowiedzi',
      new.pytanie,
      'ankieta',
      new.id,
      true
    from parafia_members pm
    where pm.parafia_id = new.parafia_id
      and pm.typ = 'ministrant';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_ankieta_created_notify
  after insert on ankiety
  for each row execute procedure public.auto_notify_ankieta();

-- Auto powiadomienia przy nowym ogłoszeniu
create or replace function public.auto_notify_ogloszenie()
returns trigger as $$
begin
  if new.kategoria = 'ogłoszenie' or new.kategoria = 'ankieta' then
    insert into powiadomienia (odbiorca_id, parafia_id, typ, tytul, tresc, odniesienie_typ, odniesienie_id, wymaga_akcji)
    select
      pm.profile_id,
      new.parafia_id,
      'nowy_watek',
      new.tytul,
      left(new.tresc, 100),
      'watek',
      new.id,
      false
    from parafia_members pm
    where pm.parafia_id = new.parafia_id
      and pm.typ = 'ministrant'
      and (new.grupa_docelowa = 'wszyscy' or pm.grupa = new.grupa_docelowa);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_watek_created_notify
  after insert on tablica_watki
  for each row execute procedure public.auto_notify_ogloszenie();

-- Auto usuwanie powiadomień przy usunięciu wątku
create or replace function public.auto_cleanup_powiadomienia_watek()
returns trigger as $$
begin
  -- Usuń powiadomienia powiązane z wątkiem
  delete from powiadomienia where odniesienie_typ = 'watek' and odniesienie_id = old.id;
  -- Usuń powiadomienia powiązane z ankietami tego wątku
  delete from powiadomienia where odniesienie_typ = 'ankieta' and odniesienie_id in (
    select id from ankiety where watek_id = old.id
  );
  return old;
end;
$$ language plpgsql security definer;

create trigger on_watek_deleted_cleanup
  before delete on tablica_watki
  for each row execute procedure public.auto_cleanup_powiadomienia_watek();


-- =============================================
-- PUSH SUBSCRIPTIONS — Web Push Notifications
-- =============================================

create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "User can view own push_subscriptions" on push_subscriptions
  for select using (auth.uid() = user_id);
create policy "User can insert own push_subscriptions" on push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "User can delete own push_subscriptions" on push_subscriptions
  for delete using (auth.uid() = user_id);


-- =============================================
-- POSŁUGI LITURGICZNE — persystencja w Supabase
-- =============================================

-- Tabela posługi
create table poslugi (
  id uuid default gen_random_uuid() primary key,
  parafia_id uuid references parafie(id) on delete cascade not null,
  slug text not null,
  nazwa text not null,
  opis text default '',
  emoji text default '⭐',
  kolor text default 'gray',
  obrazek_url text,
  kolejnosc integer not null default 0,
  created_at timestamptz default now(),
  unique(parafia_id, slug)
);

alter table poslugi enable row level security;

create policy "Poslugi viewable by everyone" on poslugi
  for select using (true);
create policy "Admin can insert poslugi" on poslugi
  for insert with check (
    exists (select 1 from parafie where parafie.id = poslugi.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can update poslugi" on poslugi
  for update using (
    exists (select 1 from parafie where parafie.id = poslugi.parafia_id and parafie.admin_id = auth.uid())
  );
create policy "Admin can delete poslugi" on poslugi
  for delete using (
    exists (select 1 from parafie where parafie.id = poslugi.parafia_id and parafie.admin_id = auth.uid())
  );

-- Funkcja seedująca domyślne posługi
create or replace function public.init_poslugi(p_parafia_id uuid)
returns void as $$
begin
  insert into poslugi (parafia_id, slug, nazwa, opis, emoji, kolor, kolejnosc) values
    (p_parafia_id, 'ceremoniarz', 'Ceremoniarz', 'Koordynuje służbę liturgiczną, ustawia procesje', '👑', 'amber', 1),
    (p_parafia_id, 'krucyferariusz', 'Krucyferariusz', 'Niesie krzyż procesyjny', '✝️', 'red', 2),
    (p_parafia_id, 'turyferariusz', 'Turyferariusz', 'Obsługuje kadzidło (trybularz)', '💨', 'purple', 3),
    (p_parafia_id, 'nawikulariusz', 'Nawikulariusz', 'Podaje kadzidło do trybularza', '🚢', 'cyan', 4),
    (p_parafia_id, 'ministrant_swiatla', 'Ministrant światła', 'Niesie świece w procesjach', '🕯️', 'yellow', 5),
    (p_parafia_id, 'ministrant_ksiegi', 'Ministrant księgi', 'Trzyma mszał i podaje księgi', '📖', 'emerald', 6),
    (p_parafia_id, 'ministrant_oltarza', 'Ministrant ołtarza', 'Przygotowuje ołtarz, podaje ampułki', '⛪', 'blue', 7),
    (p_parafia_id, 'ministrant_dzwonkow', 'Ministrant gongu i dzwonków', 'Dzwoni dzwonkami i gongiem', '🔔', 'green', 8),
    (p_parafia_id, 'lektor', 'Lektor', 'Proklamuje czytania biblijne', '📜', 'indigo', 9)
  on conflict (parafia_id, slug) do nothing;
end;
$$ language plpgsql security definer;

-- Aktualizacja triggera — dodanie init_poslugi
create or replace function public.auto_init_ranking_config()
returns trigger as $$
begin
  perform public.init_ranking_config(new.id);
  perform public.init_poslugi(new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Seed posług dla istniejących parafii
do $$
declare
  p record;
begin
  for p in select id from parafie loop
    perform public.init_poslugi(p.id);
  end loop;
end;
$$;

-- =============================================
-- STORAGE BUCKET — obrazki posług
-- =============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'poslugi-images',
  'poslugi-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "Public read poslugi images"
  on storage.objects for select
  using (bucket_id = 'poslugi-images');

create policy "Admin can upload poslugi images"
  on storage.objects for insert
  with check (
    bucket_id = 'poslugi-images'
  );

create policy "Admin can update poslugi images"
  on storage.objects for update
  using (
    bucket_id = 'poslugi-images'
  );

create policy "Admin can delete poslugi images"
  on storage.objects for delete
  using (
    bucket_id = 'poslugi-images'
  );


-- =============================================
-- ROZSZERZENIE POSŁUG — szczegóły (długi opis, galeria, YouTube)
-- =============================================

ALTER TABLE poslugi ADD COLUMN dlugi_opis text default '';
ALTER TABLE poslugi ADD COLUMN zdjecia text[] default '{}';
ALTER TABLE poslugi ADD COLUMN youtube_url text default '';

-- =============================================
-- KONFIGURACJA APLIKACJI (banery powitalne itp.)
-- =============================================

create table if not exists app_config (
  klucz text primary key,
  wartosc text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table app_config enable row level security;

create policy "app_config_read" on app_config for select using (true);
create policy "app_config_write" on app_config for all using (true);

-- Domyslne wartosci banerow
insert into app_config (klucz, wartosc) values
  ('baner_ministrant_tytul', 'Witaj w aplikacji dla ministrantów!'),
  ('baner_ministrant_opis', 'Ogłoszenia i ankiety od księdza · Wydarzenia · Ranking i punkty · Obecności · Kalendarz liturgiczny'),
  ('baner_ksiadz_tytul', 'Panel zarządzania parafią'),
  ('baner_ksiadz_opis', 'Zarządzaj obecnościami · Służby · Ogłoszenia · Ranking · Konfiguracja')
on conflict (klucz) do nothing;

-- RLS — Szablony wydarzeń
alter table szablony_wydarzen enable row level security;
create policy "Szablony viewable by parish members" on szablony_wydarzen
  for select using (
    parafia_id in (select parafia_id from parafia_members where profile_id = auth.uid())
  );
create policy "Ksiadz can manage szablony" on szablony_wydarzen
  for all using (
    exists (select 1 from parafie where parafie.id = szablony_wydarzen.parafia_id and parafie.admin_id = auth.uid())
  );
