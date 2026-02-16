// =============================================
// KALENDARZ LITURGICZNY - logika i dane
// =============================================

export interface DzienLiturgiczny {
  date: string;
  nazwa: string;
  kolor: 'zielony' | 'bialy' | 'czerwony' | 'fioletowy' | 'rozowy';
  ranga: 'uroczystosc' | 'swieto' | 'wspomnienie' | 'wspomnienie_dowolne' | 'dzien_powszedni';
  okres: string;
}

// ==================== ALGORYTM COMPUTUS ====================
// Oblicza datę Wielkanocy dla danego roku (algorytm Anonymous Gregorian)

export function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ==================== HELPERS ====================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mmdd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

// ==================== ŚWIĘTA STAŁE ====================
// Polski kalendarz liturgiczny - najważniejsze święta stałe

interface FeastEntry {
  nazwa: string;
  kolor: DzienLiturgiczny['kolor'];
  ranga: DzienLiturgiczny['ranga'];
}

const FIXED_FEASTS: Record<string, FeastEntry> = {
  // STYCZEŃ
  '01-01': { nazwa: 'Świętej Bożej Rodzicielki Maryi', kolor: 'bialy', ranga: 'uroczystosc' },
  '01-02': { nazwa: 'Św. Bazylego Wielkiego i Grzegorza z Nazjanzu', kolor: 'bialy', ranga: 'wspomnienie' },
  '01-03': { nazwa: 'Najświętszego Imienia Jezus', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '01-06': { nazwa: 'Objawienie Pańskie (Trzech Króli)', kolor: 'bialy', ranga: 'uroczystosc' },
  '01-13': { nazwa: 'Św. Hilariusza', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '01-17': { nazwa: 'Św. Antoniego, opata', kolor: 'bialy', ranga: 'wspomnienie' },
  '01-20': { nazwa: 'Św. Fabiana i Sebastiana', kolor: 'czerwony', ranga: 'wspomnienie_dowolne' },
  '01-21': { nazwa: 'Św. Agnieszki, dziewicy i męczennicy', kolor: 'czerwony', ranga: 'wspomnienie' },
  '01-24': { nazwa: 'Św. Franciszka Salezego', kolor: 'bialy', ranga: 'wspomnienie' },
  '01-25': { nazwa: 'Nawrócenie Św. Pawła Apostoła', kolor: 'bialy', ranga: 'swieto' },
  '01-26': { nazwa: 'Św. Tymoteusza i Tytusa', kolor: 'bialy', ranga: 'wspomnienie' },
  '01-28': { nazwa: 'Św. Tomasza z Akwinu', kolor: 'bialy', ranga: 'wspomnienie' },
  '01-31': { nazwa: 'Św. Jana Bosko', kolor: 'bialy', ranga: 'wspomnienie' },

  // LUTY
  '02-02': { nazwa: 'Ofiarowanie Pańskie (MB Gromnicznej)', kolor: 'bialy', ranga: 'swieto' },
  '02-03': { nazwa: 'Św. Błażeja', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '02-05': { nazwa: 'Św. Agaty', kolor: 'czerwony', ranga: 'wspomnienie' },
  '02-06': { nazwa: 'Św. Pawła Miki i Towarzyszy', kolor: 'czerwony', ranga: 'wspomnienie' },
  '02-10': { nazwa: 'Św. Scholastyki', kolor: 'bialy', ranga: 'wspomnienie' },
  '02-11': { nazwa: 'NMP z Lourdes', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '02-14': { nazwa: 'Św. Cyryla i Metodego', kolor: 'bialy', ranga: 'wspomnienie' },
  '02-22': { nazwa: 'Katedry Św. Piotra Apostoła', kolor: 'bialy', ranga: 'swieto' },
  '02-23': { nazwa: 'Św. Polikarpa', kolor: 'czerwony', ranga: 'wspomnienie' },

  // MARZEC
  '03-04': { nazwa: 'Św. Kazimierza, królewicza', kolor: 'bialy', ranga: 'swieto' },
  '03-07': { nazwa: 'Św. Perpetuy i Felicyty', kolor: 'czerwony', ranga: 'wspomnienie' },
  '03-08': { nazwa: 'Św. Jana Bożego', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '03-09': { nazwa: 'Św. Franciszki Rzymianki', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '03-17': { nazwa: 'Św. Patryka', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '03-19': { nazwa: 'Św. Józefa, Oblubieńca NMP', kolor: 'bialy', ranga: 'uroczystosc' },
  '03-25': { nazwa: 'Zwiastowanie Pańskie', kolor: 'bialy', ranga: 'uroczystosc' },

  // KWIECIEŃ
  '04-02': { nazwa: 'Św. Franciszka z Pauli', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '04-04': { nazwa: 'Św. Izydora', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '04-07': { nazwa: 'Św. Jana Chrzciciela de la Salle', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '04-11': { nazwa: 'Św. Stanisława, biskupa i męczennika', kolor: 'czerwony', ranga: 'uroczystosc' },
  '04-23': { nazwa: 'Św. Wojciecha, biskupa i męczennika', kolor: 'czerwony', ranga: 'uroczystosc' },
  '04-25': { nazwa: 'Św. Marka Ewangelisty', kolor: 'czerwony', ranga: 'swieto' },
  '04-29': { nazwa: 'Św. Katarzyny Sieneńskiej', kolor: 'bialy', ranga: 'wspomnienie' },

  // MAJ
  '05-01': { nazwa: 'Św. Józefa, Rzemieślnika', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '05-02': { nazwa: 'Św. Atanazego', kolor: 'bialy', ranga: 'wspomnienie' },
  '05-03': { nazwa: 'NMP Królowej Polski', kolor: 'bialy', ranga: 'uroczystosc' },
  '05-06': { nazwa: 'Świętych Apostołów Filipa i Jakuba', kolor: 'czerwony', ranga: 'swieto' },
  '05-08': { nazwa: 'Św. Stanisława, biskupa i męczennika', kolor: 'czerwony', ranga: 'uroczystosc' },
  '05-13': { nazwa: 'NMP Fatimskiej', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '05-14': { nazwa: 'Św. Macieja Apostoła', kolor: 'czerwony', ranga: 'swieto' },
  '05-20': { nazwa: 'Św. Bernardyna ze Sieny', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '05-22': { nazwa: 'Św. Rity z Cascii', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '05-26': { nazwa: 'Św. Filipa Nereusza', kolor: 'bialy', ranga: 'wspomnienie' },
  '05-31': { nazwa: 'Nawiedzenie NMP', kolor: 'bialy', ranga: 'swieto' },

  // CZERWIEC
  '06-01': { nazwa: 'Św. Justyna, męczennika', kolor: 'czerwony', ranga: 'wspomnienie' },
  '06-05': { nazwa: 'Św. Bonifacego', kolor: 'czerwony', ranga: 'wspomnienie' },
  '06-11': { nazwa: 'Św. Barnaby Apostoła', kolor: 'czerwony', ranga: 'wspomnienie' },
  '06-13': { nazwa: 'Św. Antoniego z Padwy', kolor: 'bialy', ranga: 'wspomnienie' },
  '06-22': { nazwa: 'Św. Paulina z Noli', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '06-24': { nazwa: 'Narodzenie Św. Jana Chrzciciela', kolor: 'bialy', ranga: 'uroczystosc' },
  '06-28': { nazwa: 'Św. Ireneusza', kolor: 'czerwony', ranga: 'wspomnienie' },
  '06-29': { nazwa: 'Św. Piotra i Pawła, Apostołów', kolor: 'czerwony', ranga: 'uroczystosc' },

  // LIPIEC
  '07-03': { nazwa: 'Św. Tomasza Apostoła', kolor: 'czerwony', ranga: 'swieto' },
  '07-04': { nazwa: 'Św. Elżbiety Portugalskiej', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '07-11': { nazwa: 'Św. Benedykta, opata', kolor: 'bialy', ranga: 'swieto' },
  '07-15': { nazwa: 'Św. Bonawentury', kolor: 'bialy', ranga: 'wspomnienie' },
  '07-16': { nazwa: 'NMP z Góry Karmel', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '07-22': { nazwa: 'Św. Marii Magdaleny', kolor: 'bialy', ranga: 'swieto' },
  '07-23': { nazwa: 'Św. Brygidy', kolor: 'bialy', ranga: 'swieto' },
  '07-25': { nazwa: 'Św. Jakuba Apostoła', kolor: 'czerwony', ranga: 'swieto' },
  '07-26': { nazwa: 'Św. Joachima i Anny', kolor: 'bialy', ranga: 'wspomnienie' },
  '07-29': { nazwa: 'Św. Marty, Marii i Łazarza', kolor: 'bialy', ranga: 'wspomnienie' },
  '07-31': { nazwa: 'Św. Ignacego z Loyoli', kolor: 'bialy', ranga: 'wspomnienie' },

  // SIERPIEŃ
  '08-01': { nazwa: 'Św. Alfonsa Marii Liguoriego', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-04': { nazwa: 'Św. Jana Marii Vianneya', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-06': { nazwa: 'Przemienienie Pańskie', kolor: 'bialy', ranga: 'swieto' },
  '08-08': { nazwa: 'Św. Dominika', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-09': { nazwa: 'Św. Teresy Benedykty od Krzyża (Edyty Stein)', kolor: 'czerwony', ranga: 'swieto' },
  '08-10': { nazwa: 'Św. Wawrzyńca, diakona', kolor: 'czerwony', ranga: 'swieto' },
  '08-11': { nazwa: 'Św. Klary', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-14': { nazwa: 'Św. Maksymiliana Marii Kolbego', kolor: 'czerwony', ranga: 'wspomnienie' },
  '08-15': { nazwa: 'Wniebowzięcie NMP', kolor: 'bialy', ranga: 'uroczystosc' },
  '08-20': { nazwa: 'Św. Bernarda', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-22': { nazwa: 'NMP Królowej', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-24': { nazwa: 'Św. Bartłomieja Apostoła', kolor: 'czerwony', ranga: 'swieto' },
  '08-26': { nazwa: 'NMP Częstochowskiej', kolor: 'bialy', ranga: 'uroczystosc' },
  '08-27': { nazwa: 'Św. Moniki', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-28': { nazwa: 'Św. Augustyna', kolor: 'bialy', ranga: 'wspomnienie' },
  '08-29': { nazwa: 'Męczeństwo Św. Jana Chrzciciela', kolor: 'czerwony', ranga: 'wspomnienie' },

  // WRZESIEŃ
  '09-03': { nazwa: 'Św. Grzegorza Wielkiego', kolor: 'bialy', ranga: 'wspomnienie' },
  '09-08': { nazwa: 'Narodzenie NMP', kolor: 'bialy', ranga: 'swieto' },
  '09-12': { nazwa: 'Najświętszego Imienia Maryi', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '09-14': { nazwa: 'Podwyższenie Krzyża Świętego', kolor: 'czerwony', ranga: 'swieto' },
  '09-15': { nazwa: 'NMP Bolesnej', kolor: 'bialy', ranga: 'wspomnienie' },
  '09-20': { nazwa: 'Św. Andrzeja Kim Taegon i Towarzyszy', kolor: 'czerwony', ranga: 'wspomnienie' },
  '09-21': { nazwa: 'Św. Mateusza, Apostoła i Ewangelisty', kolor: 'czerwony', ranga: 'swieto' },
  '09-23': { nazwa: 'Św. o. Pio z Pietrelciny', kolor: 'bialy', ranga: 'wspomnienie' },
  '09-29': { nazwa: 'Świętych Archaniołów Michała, Gabriela i Rafała', kolor: 'bialy', ranga: 'swieto' },
  '09-30': { nazwa: 'Św. Hieronima', kolor: 'bialy', ranga: 'wspomnienie' },

  // PAŹDZIERNIK
  '10-01': { nazwa: 'Św. Teresy od Dzieciątka Jezus', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-02': { nazwa: 'Świętych Aniołów Stróżów', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-04': { nazwa: 'Św. Franciszka z Asyżu', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-07': { nazwa: 'NMP Różańcowej', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-15': { nazwa: 'Św. Teresy od Jezusa (z Ávili)', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-16': { nazwa: 'Św. Jadwigi Śląskiej', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-17': { nazwa: 'Św. Ignacego Antiocheńskiego', kolor: 'czerwony', ranga: 'wspomnienie' },
  '10-18': { nazwa: 'Św. Łukasza Ewangelisty', kolor: 'czerwony', ranga: 'swieto' },
  '10-22': { nazwa: 'Św. Jana Pawła II', kolor: 'bialy', ranga: 'wspomnienie' },
  '10-28': { nazwa: 'Św. Szymona i Judy Tadeusza, Apostołów', kolor: 'czerwony', ranga: 'swieto' },

  // LISTOPAD
  '11-01': { nazwa: 'Wszystkich Świętych', kolor: 'bialy', ranga: 'uroczystosc' },
  '11-02': { nazwa: 'Wspomnienie Wiernych Zmarłych', kolor: 'fioletowy', ranga: 'wspomnienie' },
  '11-04': { nazwa: 'Św. Karola Boromeusza', kolor: 'bialy', ranga: 'wspomnienie' },
  '11-09': { nazwa: 'Rocznica poświęcenia Bazyliki Laterańskiej', kolor: 'bialy', ranga: 'swieto' },
  '11-10': { nazwa: 'Św. Leona Wielkiego', kolor: 'bialy', ranga: 'wspomnienie' },
  '11-11': { nazwa: 'Św. Marcina z Tours', kolor: 'bialy', ranga: 'wspomnienie' },
  '11-15': { nazwa: 'Św. Alberta Wielkiego', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '11-21': { nazwa: 'Ofiarowanie NMP', kolor: 'bialy', ranga: 'wspomnienie' },
  '11-22': { nazwa: 'Św. Cecylii', kolor: 'czerwony', ranga: 'wspomnienie' },
  '11-24': { nazwa: 'Św. Andrzeja Dung-Lac i Towarzyszy', kolor: 'czerwony', ranga: 'wspomnienie' },
  '11-30': { nazwa: 'Św. Andrzeja Apostoła', kolor: 'czerwony', ranga: 'swieto' },

  // GRUDZIEŃ
  '12-03': { nazwa: 'Św. Franciszka Ksawerego', kolor: 'bialy', ranga: 'wspomnienie' },
  '12-04': { nazwa: 'Św. Barbary', kolor: 'czerwony', ranga: 'wspomnienie_dowolne' },
  '12-06': { nazwa: 'Św. Mikołaja', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
  '12-07': { nazwa: 'Św. Ambrożego', kolor: 'bialy', ranga: 'wspomnienie' },
  '12-08': { nazwa: 'Niepokalane Poczęcie NMP', kolor: 'bialy', ranga: 'uroczystosc' },
  '12-13': { nazwa: 'Św. Łucji', kolor: 'czerwony', ranga: 'wspomnienie' },
  '12-14': { nazwa: 'Św. Jana od Krzyża', kolor: 'bialy', ranga: 'wspomnienie' },
  '12-25': { nazwa: 'Narodzenie Pańskie (Boże Narodzenie)', kolor: 'bialy', ranga: 'uroczystosc' },
  '12-26': { nazwa: 'Św. Szczepana, pierwszego męczennika', kolor: 'czerwony', ranga: 'swieto' },
  '12-27': { nazwa: 'Św. Jana, Apostoła i Ewangelisty', kolor: 'bialy', ranga: 'swieto' },
  '12-28': { nazwa: 'Świętych Młodzianków, męczenników', kolor: 'czerwony', ranga: 'swieto' },
  '12-31': { nazwa: 'Św. Sylwestra I', kolor: 'bialy', ranga: 'wspomnienie_dowolne' },
};

// ==================== ŚWIĘTA RUCHOME ====================

function getMoveableFeasts(year: number): Record<string, FeastEntry> {
  const easter = computeEaster(year);
  const feasts: Record<string, FeastEntry> = {};

  const add = (offset: number, entry: FeastEntry) => {
    feasts[formatDate(addDays(easter, offset))] = entry;
  };

  // Wielki Post
  add(-46, { nazwa: 'Środa Popielcowa', kolor: 'fioletowy', ranga: 'uroczystosc' });

  // Wielki Tydzień
  add(-7, { nazwa: 'Niedziela Palmowa (Męki Pańskiej)', kolor: 'czerwony', ranga: 'uroczystosc' });
  add(-3, { nazwa: 'Wielki Czwartek (Msza Wieczerzy Pańskiej)', kolor: 'bialy', ranga: 'uroczystosc' });
  add(-2, { nazwa: 'Wielki Piątek (Męki Pańskiej)', kolor: 'czerwony', ranga: 'uroczystosc' });
  add(-1, { nazwa: 'Wielka Sobota (Wigilia Paschalna)', kolor: 'bialy', ranga: 'uroczystosc' });

  // Wielkanoc
  add(0, { nazwa: 'Niedziela Zmartwychwstania Pańskiego', kolor: 'bialy', ranga: 'uroczystosc' });
  add(1, { nazwa: 'Poniedziałek Wielkanocny', kolor: 'bialy', ranga: 'uroczystosc' });
  add(7, { nazwa: 'Niedziela Miłosierdzia Bożego', kolor: 'bialy', ranga: 'uroczystosc' });

  // Po Wielkanocy
  add(39, { nazwa: 'Wniebowstąpienie Pańskie', kolor: 'bialy', ranga: 'uroczystosc' });
  add(49, { nazwa: 'Zesłanie Ducha Świętego (Pięćdziesiątnica)', kolor: 'czerwony', ranga: 'uroczystosc' });
  add(56, { nazwa: 'Najświętszej Trójcy', kolor: 'bialy', ranga: 'uroczystosc' });
  add(60, { nazwa: 'Najświętszego Ciała i Krwi Chrystusa (Boże Ciało)', kolor: 'bialy', ranga: 'uroczystosc' });
  add(68, { nazwa: 'Najświętszego Serca Pana Jezusa', kolor: 'bialy', ranga: 'uroczystosc' });
  add(69, { nazwa: 'Niepokalanego Serca NMP', kolor: 'bialy', ranga: 'wspomnienie' });

  // Chrzest Pański - niedziela po 6 stycznia
  // (jeśli Trzech Króli = 6 stycznia, to Chrzest = następna niedziela)
  const epiphany = new Date(year, 0, 6);
  const daysUntilSunday = (7 - epiphany.getDay()) % 7;
  const baptism = new Date(year, 0, 6 + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  feasts[formatDate(baptism)] = { nazwa: 'Chrzest Pański', kolor: 'bialy', ranga: 'swieto' };

  // Chrystusa Króla - ostatnia niedziela roku liturgicznego (34. niedziela zwykła)
  // = niedziela przed 1. niedzielą Adwentu = ostatnia niedziela przed Adwentem
  const christmasDate = new Date(year, 11, 25);
  const christmasDow = christmasDate.getDay(); // 0=Sun
  const advent1 = addDays(christmasDate, -(christmasDow === 0 ? 28 : 21 + christmasDow));
  const christKing = addDays(advent1, -7);
  feasts[formatDate(christKing)] = { nazwa: 'Jezusa Chrystusa, Króla Wszechświata', kolor: 'bialy', ranga: 'uroczystosc' };

  // Święto Świętej Rodziny - niedziela w oktawie Bożego Narodzenia
  // (niedziela między 25 a 31 grudnia, a jeśli nie ma → 30 grudnia)
  let holyFamily: Date | null = null;
  for (let d = 26; d <= 31; d++) {
    const dt = new Date(year, 11, d);
    if (dt.getDay() === 0) {
      holyFamily = dt;
      break;
    }
  }
  if (!holyFamily) holyFamily = new Date(year, 11, 30);
  feasts[formatDate(holyFamily)] = { nazwa: 'Świętej Rodziny', kolor: 'bialy', ranga: 'swieto' };

  return feasts;
}

// ==================== OKRESY LITURGICZNE ====================

interface SeasonRange {
  start: Date;
  end: Date;
  nazwa: string;
  kolor: DzienLiturgiczny['kolor'];
}

function getLiturgicalSeasons(year: number): SeasonRange[] {
  const easter = computeEaster(year);
  const easterPrev = computeEaster(year - 1);

  // Adwent poprzedniego roku → Boże Narodzenie
  const christmasPrev = new Date(year - 1, 11, 25);
  const christmasPrevDow = christmasPrev.getDay();
  const advent1Prev = addDays(christmasPrev, -(christmasPrevDow === 0 ? 28 : 21 + christmasPrevDow));

  // Chrzest Pański
  const epiphany = new Date(year, 0, 6);
  const daysUntilSunday = (7 - epiphany.getDay()) % 7;
  const baptism = new Date(year, 0, 6 + (daysUntilSunday === 0 ? 7 : daysUntilSunday));

  // Środa Popielcowa
  const ashWednesday = addDays(easter, -46);

  // Zesłanie Ducha Świętego
  const pentecost = addDays(easter, 49);

  // Adwent tego roku
  const christmas = new Date(year, 11, 25);
  const christmasDow = christmas.getDay();
  const advent1 = addDays(christmas, -(christmasDow === 0 ? 28 : 21 + christmasDow));

  const seasons: SeasonRange[] = [
    // Boże Narodzenie (kontynuacja z poprzedniego roku) → do Chrztu Pańskiego
    { start: new Date(year, 0, 1), end: baptism, nazwa: 'Okres Bożego Narodzenia', kolor: 'bialy' },
    // Okres Zwykły I
    { start: addDays(baptism, 1), end: addDays(ashWednesday, -1), nazwa: 'Okres Zwykły', kolor: 'zielony' },
    // Wielki Post
    { start: ashWednesday, end: addDays(easter, -3), nazwa: 'Wielki Post', kolor: 'fioletowy' },
    // Triduum + Wielkanoc
    { start: addDays(easter, -3), end: pentecost, nazwa: 'Okres Wielkanocny', kolor: 'bialy' },
    // Okres Zwykły II
    { start: addDays(pentecost, 1), end: addDays(advent1, -1), nazwa: 'Okres Zwykły', kolor: 'zielony' },
    // Adwent
    { start: advent1, end: new Date(year, 11, 24), nazwa: 'Adwent', kolor: 'fioletowy' },
    // Boże Narodzenie
    { start: new Date(year, 11, 25), end: new Date(year, 11, 31), nazwa: 'Okres Bożego Narodzenia', kolor: 'bialy' },
  ];

  return seasons;
}

function getSeasonForDate(date: Date, seasons: SeasonRange[]): { nazwa: string; kolor: DzienLiturgiczny['kolor'] } {
  for (const season of seasons) {
    if (date >= season.start && date <= season.end) {
      return { nazwa: season.nazwa, kolor: season.kolor };
    }
  }
  return { nazwa: 'Okres Zwykły', kolor: 'zielony' };
}

// ==================== NIEDZIELE ADWENTU I WIELKIEGO POSTU ====================

function getSundayNames(year: number): Record<string, FeastEntry> {
  const easter = computeEaster(year);
  const names: Record<string, FeastEntry> = {};

  // Niedziele Wielkiego Postu
  const lentSundays = [
    '1. Niedziela Wielkiego Postu',
    '2. Niedziela Wielkiego Postu',
    '3. Niedziela Wielkiego Postu',
    '4. Niedziela Wielkiego Postu (Laetare)',
    '5. Niedziela Wielkiego Postu',
  ];
  for (let i = 0; i < 5; i++) {
    const sunday = addDays(easter, -7 * (6 - i));
    const kolor: DzienLiturgiczny['kolor'] = i === 3 ? 'rozowy' : 'fioletowy';
    names[formatDate(sunday)] = { nazwa: lentSundays[i], kolor, ranga: 'uroczystosc' };
  }

  // Niedziele Wielkanocne
  const easterSundays = [
    '2. Niedziela Wielkanocna', // = Miłosierdzia - already in moveable
    '3. Niedziela Wielkanocna',
    '4. Niedziela Wielkanocna (Dobrego Pasterza)',
    '5. Niedziela Wielkanocna',
    '6. Niedziela Wielkanocna',
    '7. Niedziela Wielkanocna',
  ];
  for (let i = 0; i < 6; i++) {
    const sunday = addDays(easter, 7 * (i + 1));
    const key = formatDate(sunday);
    if (!names[key]) { // nie nadpisuj Miłosierdzia
      names[key] = { nazwa: easterSundays[i], kolor: 'bialy', ranga: 'uroczystosc' };
    }
  }

  // Adwent
  const christmas = new Date(year, 11, 25);
  const christmasDow = christmas.getDay();
  const advent1 = addDays(christmas, -(christmasDow === 0 ? 28 : 21 + christmasDow));
  const adventSundays = [
    '1. Niedziela Adwentu',
    '2. Niedziela Adwentu',
    '3. Niedziela Adwentu (Gaudete)',
    '4. Niedziela Adwentu',
  ];
  for (let i = 0; i < 4; i++) {
    const sunday = addDays(advent1, 7 * i);
    const kolor: DzienLiturgiczny['kolor'] = i === 2 ? 'rozowy' : 'fioletowy';
    names[formatDate(sunday)] = { nazwa: adventSundays[i], kolor, ranga: 'uroczystosc' };
  }

  return names;
}

// ==================== GŁÓWNA FUNKCJA ====================

export function getLiturgicalMonth(year: number, month: number): DzienLiturgiczny[] {
  const seasons = getLiturgicalSeasons(year);
  const moveableFeasts = getMoveableFeasts(year);
  const sundayNames = getSundayNames(year);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: DzienLiturgiczny[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = formatDate(date);
    const mmddStr = mmdd(date);
    const dayOfWeek = date.getDay(); // 0=Sun
    const season = getSeasonForDate(date, seasons);

    // Priorytet: ruchome > niedzielne > stałe > sezon
    const moveable = moveableFeasts[dateStr];
    const sundayName = sundayNames[dateStr];
    const fixed = FIXED_FEASTS[mmddStr];

    let entry: DzienLiturgiczny;

    if (moveable) {
      // Święta ruchome mają najwyższy priorytet (Wielkanoc, Boże Ciało, itp.)
      entry = { date: dateStr, ...moveable, okres: season.nazwa };
    } else if (sundayName && dayOfWeek === 0) {
      // Nazwy niedziel Adwentu/Postu/Wielkanocnych
      entry = { date: dateStr, ...sundayName, okres: season.nazwa };
    } else if (fixed && (fixed.ranga === 'uroczystosc' || fixed.ranga === 'swieto')) {
      // Uroczystości i święta stałe mają priorytet
      entry = { date: dateStr, ...fixed, okres: season.nazwa };
    } else if (dayOfWeek === 0) {
      // Zwykła niedziela
      entry = {
        date: dateStr,
        nazwa: `Niedziela - ${season.nazwa}`,
        kolor: season.kolor,
        ranga: 'uroczystosc',
        okres: season.nazwa,
      };
    } else if (fixed) {
      // Wspomnienia stałe - w Wielkim Poście i Adwencie kolor okresu ma priorytet
      const isPenitentialSeason = season.nazwa === 'Wielki Post' || season.nazwa === 'Adwent';
      entry = {
        date: dateStr,
        ...fixed,
        kolor: isPenitentialSeason ? season.kolor : fixed.kolor,
        okres: season.nazwa,
      };
    } else {
      // Dzień powszedni
      entry = {
        date: dateStr,
        nazwa: '',
        kolor: season.kolor,
        ranga: 'dzien_powszedni',
        okres: season.nazwa,
      };
    }

    days.push(entry);
  }

  return days;
}

// ==================== NAZWY POLSKIE ====================

export const KOLORY_LITURGICZNE: Record<string, { nazwa: string; bg: string; text: string; border: string; dot: string }> = {
  zielony: { nazwa: 'Zielony', bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300', dot: 'bg-green-500' },
  bialy: { nazwa: 'Biały', bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200', dot: 'bg-yellow-300' },
  czerwony: { nazwa: 'Czerwony', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', dot: 'bg-red-500' },
  fioletowy: { nazwa: 'Fioletowy', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', dot: 'bg-purple-500' },
  rozowy: { nazwa: 'Różowy', bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-300', dot: 'bg-pink-400' },
};

export const RANGI: Record<string, string> = {
  uroczystosc: 'Uroczystość',
  swieto: 'Święto',
  wspomnienie: 'Wspomnienie obowiązkowe',
  wspomnienie_dowolne: 'Wspomnienie dowolne',
  dzien_powszedni: 'Dzień powszedni',
};

export const MIESIACE = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

export const DNI_TYGODNIA = ['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'];
export const DNI_TYGODNIA_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
