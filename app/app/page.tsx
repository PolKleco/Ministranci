'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Church, Users, Calendar, Book, LogOut, Mail,
  Copy, X, Plus, Check, CheckCircle, Hourglass,
  UserPlus, Send, Loader2, Bell, Pencil, Trash2,
  Trophy, Flame, Star, Clock, Shield, Settings, ChevronDown, ChevronUp, Award, Target, Lock, Unlock,
  MessageSquare, Pin, PinOff, LockKeyhole, BarChart3, Vote, ArrowLeft, Eye, EyeOff, Smile, BookOpen, Lightbulb, HandHelping,
  Moon, Sun, QrCode, ChevronRight, ImageIcon, Video, Paperclip, Search, RotateCcw, PartyPopper, Sparkles, FileText, GripVertical,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Youtube, Palette, Type
} from 'lucide-react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import YoutubeExtension from '@tiptap/extension-youtube';
import TiptapUnderline from '@tiptap/extension-underline';
import TiptapColor from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import {
  getLiturgicalMonth, KOLORY_LITURGICZNE, RANGI, MIESIACE, DNI_TYGODNIA, DNI_TYGODNIA_FULL,
  type DzienLiturgiczny,
} from '@/lib/kalendarz-liturgiczny';

// ==================== DIECEZJE W POLSCE ====================

const DIECEZJE_POLSKIE = [
  'Archidiecezja białostocka',
  'Archidiecezja częstochowska',
  'Archidiecezja gdańska',
  'Archidiecezja gnieźnieńska',
  'Archidiecezja katowicka',
  'Archidiecezja krakowska',
  'Archidiecezja lubelska',
  'Archidiecezja łódzka',
  'Archidiecezja poznańska',
  'Archidiecezja przemyska',
  'Archidiecezja szczecińsko-kamieńska',
  'Archidiecezja warmińska',
  'Archidiecezja warszawska',
  'Archidiecezja wrocławska',
  'Diecezja bielsko-żywiecka',
  'Diecezja bydgoska',
  'Diecezja drohiczyńska',
  'Diecezja elbląska',
  'Diecezja ełcka',
  'Diecezja gliwicka',
  'Diecezja kaliska',
  'Diecezja kielecka',
  'Diecezja koszalińsko-kołobrzeska',
  'Diecezja legnicka',
  'Diecezja łomżyńska',
  'Diecezja łowicka',
  'Diecezja opolska',
  'Diecezja pelplińska',
  'Diecezja płocka',
  'Diecezja radomska',
  'Diecezja rzeszowska',
  'Diecezja sandomierska',
  'Diecezja siedlecka',
  'Diecezja sosnowiecka',
  'Diecezja świdnicka',
  'Diecezja tarnowska',
  'Diecezja toruńska',
  'Diecezja warszawsko-praska',
  'Diecezja włocławska',
  'Diecezja zamojsko-lubaczowska',
  'Diecezja zielonogórsko-gorzowska',
  'Ordynariat Polowy',
];

// ==================== TYPY ====================

type UserType = 'ksiadz' | 'ministrant';
type GrupaType = string;

interface GrupaConfig {
  id: string;
  nazwa: string;
  kolor: string;
  emoji: string;
  opis: string;
}
type FunkcjaType = string;

interface FunkcjaConfig {
  id: string;
  nazwa: string;
  opis: string;
  emoji: string;
  kolor: string;
  obrazek_url?: string;
  dlugi_opis?: string;
  zdjecia?: string[];
  youtube_url?: string;
}

interface Profile {
  id: string;
  email: string;
  imie: string;
  nazwisko: string;
  typ: UserType | 'nowy';
  parafia_id: string | null;
}

interface Parafia {
  id: string;
  nazwa: string;
  miasto: string;
  adres: string;
  admin_id: string;
  admin_email: string;
  kod_zaproszenia: string;
}

interface Member {
  id: string;
  profile_id: string;
  parafia_id: string;
  email: string;
  imie: string;
  nazwisko: string;
  typ: UserType;
  grupa: GrupaType | null;
  role: string[];
}

interface Funkcja {
  id: string;
  sluzba_id: string;
  typ: FunkcjaType;
  ministrant_id: string | null;
  aktywna: boolean;
  zaakceptowana: boolean;
}

interface Sluzba {
  id: string;
  nazwa: string;
  data: string;
  godzina: string;
  parafia_id: string;
  utworzono_przez: string;
  status: 'zaplanowana' | 'wykonana';
  funkcje: Funkcja[];
}

interface SzablonWydarzenia {
  id: string;
  nazwa: string;
  godzina: string;
  funkcje: Record<string, string>;
  parafia_id: string;
  utworzono_przez: string;
}

interface Zaproszenie {
  id: string;
  email: string;
  parafia_id: string;
  parafia_nazwa: string;
  admin_email: string;
}

interface Posluga {
  id: string;
  slug: string;
  nazwa: string;
  opis: string;
  emoji: string;
  kolor: string;
  obrazek_url?: string;
  kolejnosc: number;
  dlugi_opis?: string;
  zdjecia?: string[];
  youtube_url?: string;
}

// ==================== TYPY — RANKING SŁUŻBY ====================

interface PunktacjaConfig {
  id: string;
  parafia_id: string;
  klucz: string;
  wartosc: number;
  opis: string;
}

interface RangaConfig {
  id: string;
  parafia_id: string;
  nazwa: string;
  min_pkt: number;
  kolor: string;
  kolejnosc: number;
}

interface OdznakaConfig {
  id: string;
  parafia_id: string;
  nazwa: string;
  opis: string;
  warunek_typ: string;
  warunek_wartosc: number;
  bonus_pkt: number;
  aktywna: boolean;
}

interface Dyzur {
  id: string;
  ministrant_id: string;
  parafia_id: string;
  dzien_tygodnia: number;
  aktywny: boolean;
}

interface Obecnosc {
  id: string;
  ministrant_id: string;
  parafia_id: string;
  data: string;
  godzina: string;
  typ: 'msza' | 'nabożeństwo';
  nazwa_nabożeństwa: string;
  status: 'oczekuje' | 'zatwierdzona' | 'odrzucona';
  punkty_bazowe: number;
  mnoznik: number;
  punkty_finalne: number;
  zatwierdzona_przez: string | null;
  created_at: string;
}

interface MinusowePunkty {
  id: string;
  ministrant_id: string;
  parafia_id: string;
  data: string;
  powod: string;
  punkty: number;
}

interface OdznakaZdobyta {
  id: string;
  ministrant_id: string;
  odznaka_config_id: string;
  bonus_pkt: number;
  zdobyta_data: string;
}

interface RankingEntry {
  id: string;
  ministrant_id: string;
  parafia_id: string;
  total_pkt: number;
  streak_tyg: number;
  max_streak_tyg: number;
  total_obecnosci: number;
  total_minusowe: number;
  ranga: string;
}

// ==================== TYPY — TABLICA OGŁOSZEŃ ====================

interface TablicaWatek {
  id: string;
  parafia_id: string;
  autor_id: string;
  tytul: string;
  tresc: string;
  kategoria: 'ogłoszenie' | 'dyskusja' | 'ankieta';
  grupa_docelowa: string;
  przypiety: boolean;
  zamkniety: boolean;
  archiwum_data: string | null;
  created_at: string;
  updated_at: string;
}

interface TablicaWiadomosc {
  id: string;
  watek_id: string;
  autor_id: string;
  tresc: string;
  created_at: string;
}

interface Ankieta {
  id: string;
  watek_id: string;
  parafia_id: string;
  pytanie: string;
  typ: 'tak_nie' | 'jednokrotny' | 'wielokrotny';
  obowiazkowa: boolean;
  wyniki_ukryte: boolean;
  termin: string | null;
  aktywna: boolean;
  created_at: string;
}

interface AnkietaOpcja {
  id: string;
  ankieta_id: string;
  tresc: string;
  kolejnosc: number;
}

interface AnkietaOdpowiedz {
  id: string;
  ankieta_id: string;
  opcja_id: string;
  respondent_id: string;
  zmieniona: boolean;
  zmieniona_at: string | null;
  created_at: string;
}

interface Powiadomienie {
  id: string;
  odbiorca_id: string;
  parafia_id: string;
  typ: string;
  tytul: string;
  tresc: string;
  odniesienie_typ: string | null;
  odniesienie_id: string | null;
  przeczytane: boolean;
  wymaga_akcji: boolean;
  created_at: string;
}

// ==================== GRUPY DOMYŚLNE ====================

const DEFAULT_GRUPY: GrupaConfig[] = [
  { id: 'kandydaci', nazwa: 'Kandydaci na ministrantów', kolor: 'amber', emoji: '🟡', opis: 'Nowi, przygotowujący się do służby' },
  { id: 'mlodsi', nazwa: 'Ministranci młodsi', kolor: 'blue', emoji: '🔵', opis: 'Początkujący ministranci' },
  { id: 'starsi', nazwa: 'Ministranci starsi', kolor: 'green', emoji: '🟢', opis: 'Doświadczeni ministranci' },
  { id: 'lektorzy_mlodsi', nazwa: 'Lektorzy młodsi', kolor: 'purple', emoji: '🟣', opis: 'Początkujący lektorzy' },
  { id: 'lektorzy_starsi', nazwa: 'Lektorzy starsi', kolor: 'red', emoji: '🔴', opis: 'Doświadczeni lektorzy' },
];

const DEFAULT_FUNKCJE: FunkcjaConfig[] = [
  { id: 'ceremoniarz', nazwa: 'Ceremoniarz', opis: 'Koordynujesz przebieg liturgii. Dbasz o porządek i wskazujesz ministrantom ich zadania.', emoji: '👑', kolor: 'purple' },
  { id: 'krzyz', nazwa: 'Krzyż', opis: 'Niesiesz krzyż procesyjny na czele pochodu. Trzymaj go prosto i pewnie.', emoji: '✝️', kolor: 'amber' },
  { id: 'swieca1', nazwa: 'Świeca 1', opis: 'Niesiesz świecę po lewej stronie. Idź równo ze Świecą 2.', emoji: '🕯️', kolor: 'yellow' },
  { id: 'swieca2', nazwa: 'Świeca 2', opis: 'Niesiesz świecę po prawej stronie. Idź równo ze Świecą 1.', emoji: '🕯️', kolor: 'yellow' },
  { id: 'kadzidlo', nazwa: 'Kadzidło', opis: 'Obsługujesz kadzidło — przygotuj węgielki przed Mszą i podawaj łódkę z kadzidłem.', emoji: '🔥', kolor: 'red' },
  { id: 'lodka', nazwa: 'Łódka', opis: 'Podajesz łódkę z kadzidłem do trybularza.', emoji: '🚢', kolor: 'cyan' },
  { id: 'ministrant_ksiegi', nazwa: 'Ministrant księgi', opis: 'Trzymasz mszał i podajesz księgi liturgiczne kapłanowi.', emoji: '📖', kolor: 'emerald' },
  { id: 'ministrant_oltarza', nazwa: 'Ministrant ołtarza', opis: 'Przygotowujesz ołtarz, podajesz ampułki i naczynia liturgiczne.', emoji: '⛪', kolor: 'blue' },
  { id: 'gong', nazwa: 'Gong', opis: 'Uderzasz w gong w odpowiednich momentach liturgii.', emoji: '🔔', kolor: 'orange' },
  { id: 'dzwonki', nazwa: 'Dzwonki', opis: 'Dzwonisz dzwonkami podczas przeistoczenia i innych momentów.', emoji: '🔔', kolor: 'yellow' },
];

// ==================== POSŁUGI ====================

// DEFAULT_POSLUGI — teraz seedowane przez Supabase (init_poslugi), ta stała służy jako fallback
const DEFAULT_POSLUGI: Posluga[] = [
  { id: 'ceremoniarz', slug: 'ceremoniarz', nazwa: 'Ceremoniarz', opis: 'Koordynuje służbę liturgiczną, ustawia procesje', emoji: '👑', kolor: 'amber', kolejnosc: 1 },
  { id: 'krucyferariusz', slug: 'krucyferariusz', nazwa: 'Krucyferariusz', opis: 'Niesie krzyż procesyjny', emoji: '✝️', kolor: 'red', kolejnosc: 2 },
  { id: 'turyferariusz', slug: 'turyferariusz', nazwa: 'Turyferariusz', opis: 'Obsługuje kadzidło (trybularz)', emoji: '💨', kolor: 'purple', kolejnosc: 3 },
  { id: 'nawikulariusz', slug: 'nawikulariusz', nazwa: 'Nawikulariusz', opis: 'Podaje kadzidło do trybularza', emoji: '🚢', kolor: 'cyan', kolejnosc: 4 },
  { id: 'ministrant_swiatla', slug: 'ministrant_swiatla', nazwa: 'Ministrant światła', opis: 'Niesie świece w procesjach', emoji: '🕯️', kolor: 'yellow', kolejnosc: 5 },
  { id: 'ministrant_ksiegi', slug: 'ministrant_ksiegi', nazwa: 'Ministrant księgi', opis: 'Trzyma mszał i podaje księgi', emoji: '📖', kolor: 'emerald', kolejnosc: 6 },
  { id: 'ministrant_oltarza', slug: 'ministrant_oltarza', nazwa: 'Ministrant ołtarza', opis: 'Przygotowuje ołtarz, podaje ampułki', emoji: '⛪', kolor: 'blue', kolejnosc: 7 },
  { id: 'ministrant_dzwonkow', slug: 'ministrant_dzwonkow', nazwa: 'Ministrant gongu i dzwonków', opis: 'Dzwoni dzwonkami i gongiem', emoji: '🔔', kolor: 'green', kolejnosc: 8 },
  { id: 'lektor', slug: 'lektor', nazwa: 'Lektor', opis: 'Proklamuje czytania biblijne', emoji: '📜', kolor: 'indigo', kolejnosc: 9 }
];

const KOLOR_KLASY: Record<string, { bg: string; text: string; hover: string; border: string; cardBg: string }> = {
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-900 dark:text-amber-200', hover: 'hover:bg-amber-200 dark:hover:bg-amber-800/40', border: 'border-amber-300 dark:border-amber-700', cardBg: 'bg-amber-50 dark:bg-amber-900/10' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-200', hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/40', border: 'border-blue-300 dark:border-blue-700', cardBg: 'bg-blue-50 dark:bg-blue-900/10' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-900 dark:text-green-200', hover: 'hover:bg-green-200 dark:hover:bg-green-800/40', border: 'border-green-300 dark:border-green-700', cardBg: 'bg-green-50 dark:bg-green-900/10' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-200', hover: 'hover:bg-purple-200 dark:hover:bg-purple-800/40', border: 'border-purple-300 dark:border-purple-700', cardBg: 'bg-purple-50 dark:bg-purple-900/10' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-900 dark:text-red-200', hover: 'hover:bg-red-200 dark:hover:bg-red-800/40', border: 'border-red-300 dark:border-red-700', cardBg: 'bg-red-50 dark:bg-red-900/10' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-900 dark:text-emerald-200', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800/40', border: 'border-emerald-300 dark:border-emerald-700', cardBg: 'bg-emerald-50 dark:bg-emerald-900/10' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-900 dark:text-yellow-200', hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800/40', border: 'border-yellow-300 dark:border-yellow-700', cardBg: 'bg-yellow-50 dark:bg-yellow-900/10' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-200', hover: 'hover:bg-orange-200 dark:hover:bg-orange-800/40', border: 'border-orange-300 dark:border-orange-700', cardBg: 'bg-orange-50 dark:bg-orange-900/10' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-900 dark:text-cyan-200', hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-800/40', border: 'border-cyan-300 dark:border-cyan-700', cardBg: 'bg-cyan-50 dark:bg-cyan-900/10' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-900 dark:text-indigo-200', hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800/40', border: 'border-indigo-300 dark:border-indigo-700', cardBg: 'bg-indigo-50 dark:bg-indigo-900/10' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-900 dark:text-pink-200', hover: 'hover:bg-pink-200 dark:hover:bg-pink-800/40', border: 'border-pink-300 dark:border-pink-700', cardBg: 'bg-pink-50 dark:bg-pink-900/10' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-900 dark:text-rose-200', hover: 'hover:bg-rose-200 dark:hover:bg-rose-800/40', border: 'border-rose-300 dark:border-rose-700', cardBg: 'bg-rose-50 dark:bg-rose-900/10' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-900 dark:text-gray-100', hover: 'hover:bg-gray-200 dark:hover:bg-gray-600', border: 'border-gray-300 dark:border-gray-600', cardBg: 'bg-gray-50 dark:bg-gray-800/50' },
  brown: { bg: 'bg-orange-200 dark:bg-orange-900/30', text: 'text-orange-950 dark:text-orange-200', hover: 'hover:bg-orange-300 dark:hover:bg-orange-800/40', border: 'border-orange-400 dark:border-orange-700', cardBg: 'bg-orange-50 dark:bg-orange-900/10' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-900 dark:text-teal-200', hover: 'hover:bg-teal-200 dark:hover:bg-teal-800/40', border: 'border-teal-300 dark:border-teal-700', cardBg: 'bg-teal-50 dark:bg-teal-900/10' },
};

// ==================== MODLITWY ====================

const MODLITWY = {
  przed: `Panie Jezu Chryste, dziękuję Ci, że mogę służyć przy Twoim ołtarzu.
Proszę Cię, pomóż mi pełnić tę służbę godnie i z wielką czcią.
Niech moja posługa będzie wyrazem mojej miłości do Ciebie.
Amen.`,

  po: `Panie Jezu, dziękuję Ci za możliwość uczestniczenia w świętej Mszy.
Błogosław mojej służbie i pomóż mi być wiernym ministrantem.
Niech to, czego doświadczyłem przy ołtarzu, owocuje w moim życiu.
Amen.`,

  lacina: `V: Ad Deum qui laetificat iuventutem meam.
R: Amen.

V: Introibo ad altare Dei.
R: Ad Deum qui laetificat iuventutem meam.

Confiteor Deo omnipotenti...
Misereatur nostri omnipotens Deus...
Indulgentiam, absolutionem...`
};

// ==================== WSKAZÓWKI ====================

const WSKAZOWKI = {
  przed: [
    'Przyjdź 15 minut wcześniej',
    'Zadbaj o czysty strój liturgiczny',
    'Sprawdź przygotowanie ołtarza',
    'Odmów modlitwę przed służbą',
    'Zachowaj skupienie i wyciszenie'
  ],
  podczas: [
    'Zachowaj godną postawę i skupienie',
    'Odpowiadaj głośno i wyraźnie',
    'Wykonuj gesty staranne i powolne',
    'Uważnie obserwuj znaki księdza',
    'Przyjmuj właściwą pozycję: stojącą, klęczącą'
  ],
  funkcje: [
    { nazwa: 'Krzyż', opis: 'Niesie krzyż procesyjny na czele procesji' },
    { nazwa: 'Świece', opis: 'Niosą świece po bokach krzyża lub księdza' },
    { nazwa: 'Kadzidło', opis: 'Obsługuje kadzidło podczas uroczystych momentów' },
    { nazwa: 'Ceremoniarz', opis: 'Koordynuje całą służbę ministrantów' },
    { nazwa: 'Ministrant ołtarza', opis: 'Podaje księgę, ampułki, dzwonek' }
  ],
  zasady: [
    'Służba ministranta to wielki dar i odpowiedzialność',
    'Szanuj świętość liturgii i miejsca świętego',
    'Jeśli nie możesz przyjść, zawiadom z wyprzedzeniem',
    'Ucz się systematycznie - obserwuj i pytaj starszych',
    'Bądź przykładem dla innych w szkole i parafii'
  ]
};

// ==================== TIPTAP IMAGE NODE VIEW ====================

function TiptapImageView({ node, updateAttributes, selected }: any) {
  const [showControls, setShowControls] = useState(false);

  const wrapperStyle: React.CSSProperties = { display: 'inline-block' };
  if (node.attrs.float === 'left') {
    Object.assign(wrapperStyle, { float: 'left' as const, margin: '4px 16px 8px 0', maxWidth: '50%' });
  } else if (node.attrs.float === 'right') {
    Object.assign(wrapperStyle, { float: 'right' as const, margin: '4px 0 8px 16px', maxWidth: '50%' });
  } else if (node.attrs.float === 'center') {
    Object.assign(wrapperStyle, { display: 'block', textAlign: 'center' as const, margin: '8px 0' });
  }

  const imgStyle: React.CSSProperties = {
    maxWidth: '100%',
    borderRadius: '8px',
    cursor: 'pointer',
    ...(node.attrs.width ? { width: `${node.attrs.width}px` } : {}),
  };

  return (
    <NodeViewWrapper
      as="span"
      style={wrapperStyle}
      className="tiptap-image-wrapper"
    >
      <span
        className="relative inline-block"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={imgStyle}
          className={selected ? 'outline-2 outline-indigo-500 outline-offset-2' : ''}
        />
        {showControls && (
          <span
            className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/80 backdrop-blur-sm rounded-lg p-1 z-10"
            onMouseDown={(e) => e.preventDefault()}
          >
            {[{ label: 'S', w: 150 }, { label: 'M', w: 300 }, { label: 'L', w: 500 }, { label: 'Auto', w: null }].map(p => (
              <button key={p.label} type="button" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.width == p.w ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ width: p.w })}>{p.label}</button>
            ))}
            <span className="inline-block w-px h-3.5 bg-white/30 mx-0.5" />
            {[{ label: '←', v: 'left', title: 'Lewo' }, { label: '↔', v: 'center', title: 'Środek' }, { label: '→', v: 'right', title: 'Prawo' }].map(o => (
              <button key={o.title} type="button" title={o.title} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.float === o.v ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ float: node.attrs.float === o.v ? null : o.v })}>{o.label}</button>
            ))}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}

function TiptapYoutubeView({ node, updateAttributes, selected }: any) {
  const [showControls, setShowControls] = useState(false);

  const wrapperStyle: React.CSSProperties = { display: 'inline-block' };
  if (node.attrs.float === 'left') {
    Object.assign(wrapperStyle, { float: 'left' as const, margin: '4px 16px 8px 0', maxWidth: '50%' });
  } else if (node.attrs.float === 'right') {
    Object.assign(wrapperStyle, { float: 'right' as const, margin: '4px 0 8px 16px', maxWidth: '50%' });
  } else if (node.attrs.float === 'center') {
    Object.assign(wrapperStyle, { display: 'block', textAlign: 'center' as const, margin: '8px 0' });
  }

  const iframeWidth = node.attrs.width || node.attrs.width || 480;
  const iframeHeight = Math.round(iframeWidth * (320 / 480));

  return (
    <NodeViewWrapper
      as="span"
      style={wrapperStyle}
      className="tiptap-youtube-wrapper"
    >
      <span
        className="relative inline-block"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <iframe
          src={node.attrs.src}
          width={iframeWidth}
          height={iframeHeight}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ maxWidth: '100%', borderRadius: '8px', border: 'none' }}
          className={selected ? 'outline-2 outline-indigo-500 outline-offset-2' : ''}
        />
        {showControls && (
          <span
            className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/80 backdrop-blur-sm rounded-lg p-1 z-10"
            onMouseDown={(e) => e.preventDefault()}
          >
            {[{ label: 'S', w: 200 }, { label: 'M', w: 350 }, { label: 'L', w: 500 }, { label: 'Auto', w: null }].map(p => (
              <button key={p.label} type="button" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.width == p.w ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ width: p.w })}>{p.label}</button>
            ))}
            <span className="inline-block w-px h-3.5 bg-white/30 mx-0.5" />
            {[{ label: '←', v: 'left', title: 'Lewo' }, { label: '↔', v: 'center', title: 'Środek' }, { label: '→', v: 'right', title: 'Prawo' }].map(o => (
              <button key={o.title} type="button" title={o.title} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.float === o.v ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ float: node.attrs.float === o.v ? null : o.v })}>{o.label}</button>
            ))}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}

// ==================== GŁÓWNY KOMPONENT ====================

export default function MinistranciApp() {
  // Stan aplikacji
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset-sent'>('login');

  // Stany formularzy
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  const [userType, setUserType] = useState<UserType>('ministrant');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [diecezja, setDiecezja] = useState('');
  const [diecezjaSearch, setDiecezjaSearch] = useState('');
  const [diecezjaOpen, setDiecezjaOpen] = useState(false);
  const diecezjaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diecezjaOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (diecezjaRef.current && !diecezjaRef.current.contains(e.target as Node)) {
        setDiecezjaOpen(false);
        setDiecezjaSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [diecezjaOpen]);

  // Walidacja i błędy auth
  const [showPassword, setShowPassword] = useState(false);
  const [authErrors, setAuthErrors] = useState<{
    email?: string;
    password?: string;
    imie?: string;
    nazwisko?: string;
    diecezja?: string;
    general?: string;
  }>({});

  // OAuth — uzupełnianie profilu
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [profileCompletionForm, setProfileCompletionForm] = useState({
    imie: '',
    nazwisko: '',
    typ: 'ministrant' as UserType,
  });

  // Stan parafii
  const [currentParafia, setCurrentParafia] = useState<Parafia | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [zaproszenia, setZaproszenia] = useState<Zaproszenie[]>([]);

  // Stany UI
  const [activeTab, setActiveTab] = useState('tablica');
  const [showParafiaModal, setShowParafiaModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSluzbaModal, setShowSluzbaModal] = useState(false);
  const [showPoslugiModal, setShowPoslugiModal] = useState(false);
  const [showGrupaModal, setShowGrupaModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGrupyEditModal, setShowGrupyEditModal] = useState(false);
  const [showPoslugaEditModal, setShowPoslugaEditModal] = useState(false);
  const [showAddPoslugaModal, setShowAddPoslugaModal] = useState(false);

  // Dane
  const [sluzby, setSluzby] = useState<Sluzba[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedSluzba, setSelectedSluzba] = useState<Sluzba | null>(null);

  // Grupy, funkcje i posługi (edytowalne)
  const [grupy, setGrupy] = useState<GrupaConfig[]>(DEFAULT_GRUPY);
  const [funkcjeConfig, setFunkcjeConfig] = useState<FunkcjaConfig[]>(DEFAULT_FUNKCJE);
  const [showFunkcjeConfigModal, setShowFunkcjeConfigModal] = useState(false);
  const [newFunkcjaForm, setNewFunkcjaForm] = useState({ nazwa: '', opis: '' });
  const [editingFunkcja, setEditingFunkcja] = useState<FunkcjaConfig | null>(null);
  const [draggedFunkcjaIdx, setDraggedFunkcjaIdx] = useState<number | null>(null);
  const [showEditFunkcjaModal, setShowEditFunkcjaModal] = useState(false);
  const [editFunkcjaFile, setEditFunkcjaFile] = useState<File | null>(null);
  const [editFunkcjaPreview, setEditFunkcjaPreview] = useState('');
  const [editFunkcjaGalleryFiles, setEditFunkcjaGalleryFiles] = useState<File[]>([]);
  const [editFunkcjaGalleryPreviews, setEditFunkcjaGalleryPreviews] = useState<string[]>([]);
  const [poslugi, setPoslugi] = useState<Posluga[]>([]);
  const [editingPosluga, setEditingPosluga] = useState<Posluga | null>(null);
  const [newPoslugaForm, setNewPoslugaForm] = useState({ nazwa: '', opis: '', emoji: '⭐', kolor: 'gray', dlugi_opis: '', youtube_url: '' });
  const [newPoslugaFile, setNewPoslugaFile] = useState<File | null>(null);
  const [newPoslugaPreview, setNewPoslugaPreview] = useState('');
  const [editPoslugaFile, setEditPoslugaFile] = useState<File | null>(null);
  const [editPoslugaPreview, setEditPoslugaPreview] = useState('');
  const [expandedPosluga, setExpandedPosluga] = useState<string | null>(null);
  const [editGalleryFiles, setEditGalleryFiles] = useState<File[]>([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState<string[]>([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [newGrupaForm, setNewGrupaForm] = useState({ nazwa: '', kolor: 'gray', emoji: '⚪', opis: '' });
  const [emailSelectedGrupy, setEmailSelectedGrupy] = useState<string[]>([]);
  const [emailSelectedMinistranci, setEmailSelectedMinistranci] = useState<string[]>([]);
  const [emailSearchMinistrant, setEmailSearchMinistrant] = useState('');

  // Szablony wydarzeń
  const [szablony, setSzablony] = useState<SzablonWydarzenia[]>([]);
  const [showSzablonyView, setShowSzablonyView] = useState(false);
  const [showSzablonModal, setShowSzablonModal] = useState(false);
  const [selectedSzablon, setSelectedSzablon] = useState<SzablonWydarzenia | null>(null);
  const [szablonForm, setSzablonForm] = useState({ nazwa: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
  const [showPublishSzablonModal, setShowPublishSzablonModal] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishFunkcje, setPublishFunkcje] = useState<Record<FunkcjaType, string>>({} as Record<FunkcjaType, string>);

  // ==================== STAN — RANKING SŁUŻBY ====================
  const [punktacjaConfig, setPunktacjaConfig] = useState<PunktacjaConfig[]>([]);
  const [rangiConfig, setRangiConfig] = useState<RangaConfig[]>([]);
  const [odznakiConfig, setOdznakiConfig] = useState<OdznakaConfig[]>([]);
  const [dyzury, setDyzury] = useState<Dyzur[]>([]);
  const [obecnosci, setObecnosci] = useState<Obecnosc[]>([]);
  const [minusowePunkty, setMinusowePunkty] = useState<MinusowePunkty[]>([]);
  const [odznakiZdobyte, setOdznakiZdobyte] = useState<OdznakaZdobyta[]>([]);
  const [rankingData, setRankingData] = useState<RankingEntry[]>([]);
  const [showZglosModal, setShowZglosModal] = useState(false);
  const [showDyzuryModal, setShowDyzuryModal] = useState(false);
  const [showEditProfilModal, setShowEditProfilModal] = useState(false);
  const [editProfilForm, setEditProfilForm] = useState({ imie: '', nazwisko: '', email: '' });
  const [editDyzury, setEditDyzury] = useState(false);
  const [showGrafikModal, setShowGrafikModal] = useState(false);
  const [showDyzuryAdminModal, setShowDyzuryAdminModal] = useState(false);
  const [searchMinistrant, setSearchMinistrant] = useState('');
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [showDodajPunktyModal, setShowDodajPunktyModal] = useState(false);
  const [dodajPunktyForm, setDodajPunktyForm] = useState({ punkty: '', powod: '' });
  const [showRankingSettings, setShowRankingSettings] = useState(false);
  const [showResetPunktacjaModal, setShowResetPunktacjaModal] = useState(false);
  const [zglosForm, setZglosForm] = useState({ data: '', typ: 'msza' as 'msza' | 'nabożeństwo', nazwa_nabożeństwa: '', godzina: '' });
  const [rankingSettingsTab, setRankingSettingsTab] = useState<'punkty' | 'rangi' | 'odznaki' | 'ogolne'>('punkty');
  const [newPunktacjaForm, setNewPunktacjaForm] = useState({ klucz: '', wartosc: 0, opis: '' });
  const [showNewPunktacjaForm, setShowNewPunktacjaForm] = useState(false);
  const [editingOdznakaId, setEditingOdznakaId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ punkty: number; total: number } | null>(null);
  const prevObecnosciRef = useRef<Obecnosc[]>([]);
  const [showIOSInstallBanner, setShowIOSInstallBanner] = useState(false);
  const [showAllZgloszenia, setShowAllZgloszenia] = useState(false);

  // ==================== STAN — TABLICA OGŁOSZEŃ ====================
  const [tablicaWatki, setTablicaWatki] = useState<TablicaWatek[]>([]);
  const [tablicaWiadomosci, setTablicaWiadomosci] = useState<TablicaWiadomosc[]>([]);
  const [ankiety, setAnkiety] = useState<Ankieta[]>([]);
  const [ankietyOpcje, setAnkietyOpcje] = useState<AnkietaOpcja[]>([]);
  const [ankietyOdpowiedzi, setAnkietyOdpowiedzi] = useState<AnkietaOdpowiedz[]>([]);
  const [powiadomienia, setPowiadomienia] = useState<Powiadomienie[]>([]);
  const [selectedWatek, setSelectedWatek] = useState<TablicaWatek | null>(null);
  const [showNewWatekModal, setShowNewWatekModal] = useState(false);
  const [editingWatek, setEditingWatek] = useState<TablicaWatek | null>(null);
  const [previewOgloszenie, setPreviewOgloszenie] = useState<TablicaWatek | null>(null);
  const [showNewAnkietaModal, setShowNewAnkietaModal] = useState(false);
  const [newWatekForm, setNewWatekForm] = useState({ tytul: '', tresc: '', kategoria: 'ogłoszenie' as 'ogłoszenie' | 'dyskusja' | 'ankieta', grupa_docelowa: 'wszyscy', archiwum_data: '' });
  const [newAnkietaForm, setNewAnkietaForm] = useState({ pytanie: '', typ: 'tak_nie' as 'tak_nie' | 'jednokrotny' | 'wielokrotny', obowiazkowa: true, wyniki_ukryte: false, termin: '', opcje: ['', ''], archiwum_data: '' });
  const [showArchiwum, setShowArchiwum] = useState(false);
  const [newWiadomoscTresc, setNewWiadomoscTresc] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<'wiadomosc' | 'watek' | null>(null);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [infoBanerTresc, setInfoBanerTresc] = useState({ tytul: '', opis: '' });
  const [editingParafiaNazwa, setEditingParafiaNazwa] = useState(false);
  const [parafiaNazwaInput, setParafiaNazwaInput] = useState('');
  const [editingAnkietaId, setEditingAnkietaId] = useState<string | null>(null);
  const [ukryjMinistrantow, setUkryjMinistrantow] = useState(false);
  const [editAnkietaForm, setEditAnkietaForm] = useState({ pytanie: '', obowiazkowa: false, wyniki_ukryte: true, termin: '', aktywna: true, opcje: [] as { id: string; tresc: string; kolejnosc: number }[], noweOpcje: [''] });

  // QR Code
  const [showQrModal, setShowQrModal] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // Tiptap Image extension with float & width + hover controls
  const FloatImage = useMemo(() => TiptapImage.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        float: {
          default: null,
          parseHTML: element => element.getAttribute('data-float'),
          renderHTML: attributes => attributes.float ? { 'data-float': attributes.float } : {},
        },
        width: {
          default: null,
          parseHTML: element => element.getAttribute('data-width'),
          renderHTML: attributes => {
            if (!attributes.width) return {};
            return { 'data-width': attributes.width, style: `width: ${attributes.width}px` };
          },
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(TiptapImageView);
    },
  }), []);

  // Tiptap YouTube extension with float & width + hover controls
  const FloatYoutube = useMemo(() => YoutubeExtension.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        float: {
          default: null,
          parseHTML: element => element.getAttribute('data-float'),
          renderHTML: attributes => attributes.float ? { 'data-float': attributes.float } : {},
        },
        width: {
          default: null,
          parseHTML: element => element.getAttribute('data-width'),
          renderHTML: attributes => {
            if (!attributes.width) return {};
            return { 'data-width': attributes.width, style: `width: ${attributes.width}px; max-width: 100%;` };
          },
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(TiptapYoutubeView);
    },
  }), []);

  // Tiptap editor
  const tiptapEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      FloatImage.configure({ allowBase64: false, inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FloatYoutube.configure({ width: 480, height: 320, nocookie: true }),
      TiptapUnderline,
      TextStyle,
      TiptapColor,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-content min-h-[100px] max-h-[300px] overflow-auto px-3 py-2 text-sm outline-none' },
    },
    onUpdate: ({ editor }) => {
      setNewWatekForm(prev => ({ ...prev, tresc: editor.getHTML() }));
    },
  });

  const poslugaEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapUnderline,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-posluga min-h-[100px] max-h-[200px] overflow-auto px-3 py-2 text-sm outline-none' },
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Formularze
  const [parafiaNazwa, setParafiaNazwa] = useState('');
  const [parafiaMiasto, setParafiaMiasto] = useState('');
  const [parafiaAdres, setParafiaAdres] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const [sluzbaForm, setSluzbaForm] = useState({
    nazwa: '',
    data: '',
    godzina: '',
    funkcje: {} as Record<FunkcjaType, string>
  });

  // Kalendarz liturgiczny
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DzienLiturgiczny | null>(null);

  // Dzisiejszy dzień liturgiczny (dla belki koloru)
  const dzisLiturgiczny = useMemo(() => {
    const now = new Date();
    const days = getLiturgicalMonth(now.getFullYear(), now.getMonth());
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return days.find(d => d.date === todayStr) || null;
  }, []);

  // ==================== FUNKCJE ŁADOWANIA ====================

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setCurrentUser(profile as Profile);
        // Sprawdź czy profil wymaga uzupełnienia (użytkownik OAuth z typ='nowy')
        if (profile.typ === 'nowy' || !profile.imie) {
          setProfileCompletionForm({
            imie: profile.imie || '',
            nazwisko: profile.nazwisko || '',
            typ: 'ministrant',
          });
          setShowProfileCompletion(true);
        }
      }
    } catch {
      // Błąd sieci / sesji — nie blokuj ekranu
    }
    setLoading(false);
  }, []);

  const loadParafiaData = useCallback(async () => {
    if (!currentUser?.parafia_id) return;

    const { data: parafia } = await supabase
      .from('parafie')
      .select('*')
      .eq('id', currentUser.parafia_id)
      .single();

    if (parafia) {
      setCurrentParafia(parafia as Parafia);
      // Załaduj grupy z bazy (jeśli zapisane)
      if (parafia.grupy && Array.isArray(parafia.grupy) && parafia.grupy.length > 0) {
        setGrupy(parafia.grupy as GrupaConfig[]);
      }
      // Załaduj konfigurację funkcji (jeśli zapisane)
      if (parafia.funkcje_config && Array.isArray(parafia.funkcje_config) && parafia.funkcje_config.length > 0) {
        setFunkcjeConfig(parafia.funkcje_config as FunkcjaConfig[]);
      }
    }

    const { data: membersData } = await supabase
      .from('parafia_members')
      .select('*')
      .eq('parafia_id', currentUser.parafia_id);

    if (membersData) setMembers(membersData as Member[]);
  }, [currentUser?.parafia_id]);

  const loadSluzby = useCallback(async () => {
    if (!currentUser?.parafia_id) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: sluzbyData } = await supabase
      .from('sluzby')
      .select('*, funkcje(*)')
      .eq('parafia_id', currentUser.parafia_id)
      .gte('data', today)
      .order('data', { ascending: true });

    if (sluzbyData) setSluzby(sluzbyData as Sluzba[]);
  }, [currentUser?.parafia_id]);

  const loadSzablony = useCallback(async () => {
    if (!currentUser?.parafia_id) return;

    const { data } = await supabase
      .from('szablony_wydarzen')
      .select('*')
      .eq('parafia_id', currentUser.parafia_id)
      .order('created_at', { ascending: false });

    if (data) setSzablony(data as SzablonWydarzenia[]);
  }, [currentUser?.parafia_id]);

  const loadPoslugi = useCallback(async () => {
    if (!currentUser?.parafia_id) return;

    const { data } = await supabase
      .from('poslugi')
      .select('*')
      .eq('parafia_id', currentUser.parafia_id)
      .order('kolejnosc');

    if (data && data.length > 0) {
      setPoslugi(data as Posluga[]);
    } else if (data && data.length === 0) {
      const { error: rpcError } = await supabase.rpc('init_poslugi', {
        p_parafia_id: currentUser.parafia_id
      });
      if (!rpcError) {
        const { data: seeded } = await supabase
          .from('poslugi')
          .select('*')
          .eq('parafia_id', currentUser.parafia_id)
          .order('kolejnosc');
        if (seeded) setPoslugi(seeded as Posluga[]);
      }
    }
  }, [currentUser?.parafia_id]);

  const uploadPoslugaImage = async (file: File, poslugaId: string): Promise<string | null> => {
    if (!currentUser?.parafia_id) return null;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${currentUser.parafia_id}/${poslugaId}.${ext}`;

    const { error } = await supabase.storage
      .from('poslugi-images')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      console.error('Image upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('poslugi-images')
      .getPublicUrl(path);

    return publicUrl;
  };

  const deletePoslugaImage = async (obrazekUrl: string) => {
    if (!currentUser?.parafia_id || !obrazekUrl) return;
    const bucketPath = obrazekUrl.split('/poslugi-images/')[1];
    if (bucketPath) {
      await supabase.storage.from('poslugi-images').remove([bucketPath]);
    }
  };

  const uploadPoslugaGalleryImages = async (files: File[], poslugaId: string): Promise<string[]> => {
    if (!currentUser?.parafia_id || files.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${currentUser.parafia_id}/${poslugaId}/gallery/${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage
        .from('poslugi-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('poslugi-images')
          .getPublicUrl(path);
        urls.push(publicUrl);
      }
    }
    return urls;
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const loadZaproszenia = useCallback(async () => {
    if (!currentUser?.email) return;

    const { data: zaproszeniaData } = await supabase
      .from('zaproszenia')
      .select('*')
      .eq('email', currentUser.email);

    if (zaproszeniaData) setZaproszenia(zaproszeniaData as Zaproszenie[]);
  }, [currentUser?.email]);

  // ==================== ŁADOWANIE — RANKING SŁUŻBY ====================

  const loadRankingData = useCallback(async () => {
    if (!currentUser?.parafia_id) return;
    const pid = currentUser.parafia_id;

    const [
      { data: pConfig },
      { data: rConfig },
      { data: oConfig },
      { data: dyzuryData },
      { data: obecnosciData },
      { data: minusoweData },
      { data: odznakiZdobyteData },
      { data: rankingRows },
    ] = await Promise.all([
      supabase.from('punktacja_config').select('*').eq('parafia_id', pid),
      supabase.from('rangi_config').select('*').eq('parafia_id', pid).order('kolejnosc'),
      supabase.from('odznaki_config').select('*').eq('parafia_id', pid),
      supabase.from('dyzury').select('*').eq('parafia_id', pid),
      supabase.from('obecnosci').select('*').eq('parafia_id', pid).order('data', { ascending: false }),
      supabase.from('minusowe_punkty').select('*').eq('parafia_id', pid),
      supabase.from('odznaki_zdobyte').select('*'),
      supabase.from('ranking').select('*').eq('parafia_id', pid).order('total_pkt', { ascending: false }),
    ]);

    if (pConfig) setPunktacjaConfig(pConfig as PunktacjaConfig[]);
    if (rConfig) setRangiConfig(rConfig as RangaConfig[]);
    if (oConfig) setOdznakiConfig(oConfig as OdznakaConfig[]);
    if (dyzuryData) setDyzury(dyzuryData as Dyzur[]);
    if (obecnosciData) setObecnosci(obecnosciData as Obecnosc[]);
    if (minusoweData) setMinusowePunkty(minusoweData as MinusowePunkty[]);
    if (odznakiZdobyteData) setOdznakiZdobyte(odznakiZdobyteData as OdznakaZdobyta[]);
    if (rankingRows) setRankingData(rankingRows as RankingEntry[]);
  }, [currentUser?.parafia_id]);

  // ==================== ŁADOWANIE — TABLICA OGŁOSZEŃ ====================

  const loadTablicaData = useCallback(async () => {
    if (!currentUser?.parafia_id) return;
    const pid = currentUser.parafia_id;

    const [
      { data: watkiData },
      { data: ankietyData },
      { data: opcjeData },
      { data: odpowiedziData },
      { data: powiadomieniaData },
    ] = await Promise.all([
      supabase.from('tablica_watki').select('*').eq('parafia_id', pid).order('przypiety', { ascending: false }).order('updated_at', { ascending: false }),
      supabase.from('ankiety').select('*').eq('parafia_id', pid),
      supabase.from('ankiety_opcje').select('*'),
      supabase.from('ankiety_odpowiedzi').select('*'),
      supabase.from('powiadomienia').select('*').eq('odbiorca_id', currentUser.id).order('created_at', { ascending: false }),
    ]);

    if (watkiData) {
      const watki = watkiData as TablicaWatek[];
      // Auto-usuwanie wątków zarchiwizowanych ponad 1 miesiąc temu
      const now = new Date();
      const miesiacTemu = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const doUsuniecia = watki.filter(w => w.archiwum_data && new Date(w.archiwum_data) < miesiacTemu);
      if (doUsuniecia.length > 0) {
        await Promise.all(doUsuniecia.map(w => supabase.from('tablica_watki').delete().eq('id', w.id)));
      }
      setTablicaWatki(watki.filter(w => !doUsuniecia.some(d => d.id === w.id)));
    }
    if (ankietyData) setAnkiety(ankietyData as Ankieta[]);
    if (opcjeData) setAnkietyOpcje(opcjeData as AnkietaOpcja[]);
    if (odpowiedziData) setAnkietyOdpowiedzi(odpowiedziData as AnkietaOdpowiedz[]);
    if (powiadomieniaData) setPowiadomienia(powiadomieniaData as Powiadomienie[]);
  }, [currentUser?.parafia_id, currentUser?.id]);

  const loadWatekWiadomosci = useCallback(async (watekId: string) => {
    const { data } = await supabase
      .from('tablica_wiadomosci')
      .select('*')
      .eq('watek_id', watekId)
      .order('created_at', { ascending: true });
    if (data) setTablicaWiadomosci(data as TablicaWiadomosc[]);
  }, []);

  // Helper: zamień adresy email w tekście na klikalne linki mailto:
  const linkifyEmails = (text: string) => {
    const parts = text.split(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)
        ? <a key={i} href={`mailto:${part}`} className="underline hover:opacity-70 transition-opacity">{part}</a>
        : part
    );
  };

  // Helper: pobierz wartość z punktacja_config
  const getConfigValue = useCallback((klucz: string, fallback: number = 0): number => {
    const entry = punktacjaConfig.find(p => p.klucz === klucz);
    return entry ? Number(entry.wartosc) : fallback;
  }, [punktacjaConfig]);

  // Helper: oblicz punkty bazowe na podstawie rangi liturgicznej dnia
  const obliczPunktyBazowe = useCallback((data: string, typ: 'msza' | 'nabożeństwo', nazwa_nabożeństwa: string): { bazowe: number; mnoznik: number } => {
    if (typ === 'nabożeństwo') {
      const klucz = `nabożeństwo_${nazwa_nabożeństwa}`;
      return { bazowe: getConfigValue(klucz, 8), mnoznik: 1 };
    }

    const dateObj = new Date(data);
    const dayOfWeek = dateObj.getDay();

    // Niedziela = 0 pkt
    if (dayOfWeek === 0) return { bazowe: getConfigValue('msza_niedziela', 0), mnoznik: 1 };

    // Pobierz dzień liturgiczny
    const days = getLiturgicalMonth(dateObj.getFullYear(), dateObj.getMonth());
    const liturgDay = days.find(d => d.date === data);

    // Mnożnik sezonowy
    let mnoznik = getConfigValue('mnoznik_domyslny', 1);
    if (liturgDay?.okres === 'Wielki Post') mnoznik = getConfigValue('mnoznik_wielki_post', 1.5);
    else if (liturgDay?.okres === 'Adwent') mnoznik = getConfigValue('mnoznik_adwent', 1.5);

    // Punkty bazowe na podstawie rangi
    let bazowe = getConfigValue('msza_dzien_powszedni', 5);
    if (liturgDay) {
      const rangaMap: Record<string, string> = {
        uroczystosc: 'msza_uroczystosc',
        swieto: 'msza_swieto',
        wspomnienie: 'msza_wspomnienie_obowiazkowe',
        wspomnienie_dowolne: 'msza_wspomnienie_dowolne',
        dzien_powszedni: 'msza_dzien_powszedni',
      };
      bazowe = getConfigValue(rangaMap[liturgDay.ranga] || 'msza_dzien_powszedni', 5);
    }

    return { bazowe, mnoznik };
  }, [getConfigValue]);

  // Helper: pobierz aktualną rangę ministranta
  const getRanga = useCallback((pkt: number): RangaConfig | null => {
    const sorted = [...rangiConfig].sort((a, b) => b.min_pkt - a.min_pkt);
    return sorted.find(r => pkt >= r.min_pkt) || null;
  }, [rangiConfig]);

  // Helper: następna ranga
  const getNextRanga = useCallback((pkt: number): RangaConfig | null => {
    const sorted = [...rangiConfig].sort((a, b) => a.min_pkt - b.min_pkt);
    return sorted.find(r => r.min_pkt > pkt) || null;
  }, [rangiConfig]);

  // ==================== AKCJE — RANKING SŁUŻBY ====================

  const zglosObecnosc = async () => {
    if (!currentUser?.parafia_id || !zglosForm.data) return;

    // Porównuj daty jako stringi YYYY-MM-DD żeby uniknąć problemów ze strefami czasowymi
    const todayStr = new Date().toISOString().split('T')[0];
    const dataStr = zglosForm.data; // już jest w formacie YYYY-MM-DD z inputa
    const limitDni = getConfigValue('limit_dni_zgloszenie', 2);

    // Oblicz różnicę dni przez parsowanie lokalnych dat
    const todayParts = todayStr.split('-').map(Number);
    const dataParts = dataStr.split('-').map(Number);
    const todayMs = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const dataMs = Date.UTC(dataParts[0], dataParts[1] - 1, dataParts[2]);
    const diffDays = Math.floor((todayMs - dataMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alert('Nie możesz zgłosić obecności na przyszły dzień.');
      return;
    }
    if (diffDays > limitDni) {
      alert(`Nie możesz zgłosić obecności — upłynął limit ${limitDni} dni od daty służby.`);
      return;
    }

    const { bazowe, mnoznik } = obliczPunktyBazowe(zglosForm.data, zglosForm.typ, zglosForm.nazwa_nabożeństwa);

    const { error } = await supabase.from('obecnosci').insert({
      ministrant_id: currentUser.id,
      parafia_id: currentUser.parafia_id,
      data: zglosForm.data,
      godzina: zglosForm.godzina,
      typ: zglosForm.typ,
      nazwa_nabożeństwa: zglosForm.typ === 'nabożeństwo' ? zglosForm.nazwa_nabożeństwa : '',
      punkty_bazowe: bazowe,
      mnoznik,
      punkty_finalne: Math.round(bazowe * mnoznik),
    });

    if (error) {
      alert('Błąd zgłoszenia: ' + error.message);
    } else {
      setShowZglosModal(false);
      setZglosForm({ data: '', typ: 'msza', nazwa_nabożeństwa: '', godzina: '' });
      loadRankingData();
    }
  };

  const sprawdzOdznaki = async (ministrantId: string, parafiaId: string, newTotalObecnosci: number, newTotalPkt: number, newStreakTyg: number) => {
    // Pobierz aktualne odznaki zdobyte przez tego ministranta
    const { data: juzZdobyte } = await supabase.from('odznaki_zdobyte')
      .select('odznaka_config_id')
      .eq('ministrant_id', ministrantId);
    const zdobyteIds = new Set((juzZdobyte || []).map(z => z.odznaka_config_id));

    // Sprawdź każdą aktywną odznakę
    for (const odznaka of odznakiConfig.filter(o => o.aktywna)) {
      if (zdobyteIds.has(odznaka.id)) continue; // już zdobyta

      let spelnia = false;
      switch (odznaka.warunek_typ) {
        case 'total_obecnosci':
          spelnia = newTotalObecnosci >= odznaka.warunek_wartosc;
          break;
        case 'streak_tyg':
          spelnia = newStreakTyg >= odznaka.warunek_wartosc;
          break;
        case 'pelny_tydzien': {
          // Sprawdź czy ministrant ma 6 zatwierdzonych dni w bieżącym tygodniu (pon-sob)
          const now = new Date();
          const dayOfWeek = now.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(now);
          monday.setDate(now.getDate() + mondayOffset);
          const saturday = new Date(monday);
          saturday.setDate(monday.getDate() + 5);
          const monStr = monday.toISOString().split('T')[0];
          const satStr = saturday.toISOString().split('T')[0];
          const { count } = await supabase.from('obecnosci')
            .select('*', { count: 'exact', head: true })
            .eq('ministrant_id', ministrantId)
            .eq('parafia_id', parafiaId)
            .eq('status', 'zatwierdzona')
            .eq('typ', 'msza')
            .gte('data', monStr)
            .lte('data', satStr);
          spelnia = (count || 0) >= 6;
          break;
        }
        case 'ranking_miesieczny': {
          // Sprawdź czy ministrant jest na 1. miejscu w rankingu
          const sorted = [...rankingData].sort((a, b) => Number(b.total_pkt) - Number(a.total_pkt));
          spelnia = sorted.length > 0 && sorted[0].ministrant_id === ministrantId;
          break;
        }
        case 'nabożeństwo_droga_krzyzowa':
        case 'nabożeństwo_rozaniec':
        case 'nabożeństwo_majowe': {
          const nabName = odznaka.warunek_typ.replace('nabożeństwo_', '');
          const { count: nabCount } = await supabase.from('obecnosci')
            .select('*', { count: 'exact', head: true })
            .eq('ministrant_id', ministrantId)
            .eq('parafia_id', parafiaId)
            .eq('status', 'zatwierdzona')
            .eq('typ', 'nabożeństwo')
            .eq('nazwa_nabożeństwa', nabName);
          spelnia = (nabCount || 0) >= odznaka.warunek_wartosc;
          break;
        }
        case 'zero_minusowych_tyg': {
          // Wymaga pełnego miesiąca kalendarzowego aktywności
          // Sprawdź datę pierwszej zatwierdzonej obecności
          const { data: pierwszaObecnoscN } = await supabase.from('obecnosci')
            .select('data')
            .eq('ministrant_id', ministrantId)
            .eq('parafia_id', parafiaId)
            .eq('status', 'zatwierdzona')
            .order('data', { ascending: true })
            .limit(1)
            .single();
          if (!pierwszaObecnoscN) break;

          const pierwszaDataN = new Date(pierwszaObecnoscN.data + 'T00:00:00');
          const terazN = new Date();
          // Sprawdź czy minął pełny miesiąc kalendarzowy
          const miesiacPozniej = new Date(pierwszaDataN);
          miesiacPozniej.setMonth(miesiacPozniej.getMonth() + 1);
          if (terazN < miesiacPozniej) break;

          // Sprawdź brak minusowych w ostatnich N tygodniach
          const wymaganyOkres = odznaka.warunek_wartosc;
          const weeksAgo = new Date();
          weeksAgo.setDate(weeksAgo.getDate() - wymaganyOkres * 7);
          const { count: minusCount } = await supabase.from('minusowe_punkty')
            .select('*', { count: 'exact', head: true })
            .eq('ministrant_id', ministrantId)
            .eq('parafia_id', parafiaId)
            .gte('data', weeksAgo.toISOString().split('T')[0]);
          spelnia = (minusCount || 0) === 0;
          break;
        }
        case 'rekord_parafii': {
          // Wymaga pełnego miesiąca kalendarzowego aktywności + min. 2 ministrantów
          const { data: pierwszaObecnoscR } = await supabase.from('obecnosci')
            .select('data')
            .eq('ministrant_id', ministrantId)
            .eq('parafia_id', parafiaId)
            .eq('status', 'zatwierdzona')
            .order('data', { ascending: true })
            .limit(1)
            .single();
          if (!pierwszaObecnoscR) break;

          const pierwszaDataR = new Date(pierwszaObecnoscR.data + 'T00:00:00');
          const terazR = new Date();
          const miesiacPozniejR = new Date(pierwszaDataR);
          miesiacPozniejR.setMonth(miesiacPozniejR.getMonth() + 1);
          if (terazR < miesiacPozniejR) break;

          const { data: topRows } = await supabase.from('ranking')
            .select('ministrant_id, total_pkt')
            .eq('parafia_id', parafiaId)
            .order('total_pkt', { ascending: false })
            .limit(2);
          spelnia = (topRows || []).length >= 2
            && topRows![0].ministrant_id === ministrantId
            && Number(topRows![0].total_pkt) > Number(topRows![1].total_pkt);
          break;
        }
        default:
          break;
      }

      if (spelnia) {
        await supabase.from('odznaki_zdobyte').insert({
          ministrant_id: ministrantId,
          odznaka_config_id: odznaka.id,
          bonus_pkt: odznaka.bonus_pkt,
        });
        // Dodaj bonus punktów do rankingu
        if (odznaka.bonus_pkt > 0) {
          await supabase.from('ranking').update({
            total_pkt: newTotalPkt + odznaka.bonus_pkt,
          }).eq('ministrant_id', ministrantId).eq('parafia_id', parafiaId);
          newTotalPkt += odznaka.bonus_pkt;
        }
      }
    }
  };

  const zatwierdzObecnosc = async (obecnoscId: string) => {
    if (!currentUser) return;

    const obecnosc = obecnosci.find(o => o.id === obecnoscId);
    if (!obecnosc) return;

    await supabase.from('obecnosci').update({
      status: 'zatwierdzona',
      zatwierdzona_przez: currentUser.id,
    }).eq('id', obecnoscId);

    // Upsert ranking
    const { data: existing } = await supabase.from('ranking')
      .select('*')
      .eq('ministrant_id', obecnosc.ministrant_id)
      .eq('parafia_id', obecnosc.parafia_id)
      .single();

    let newTotalPkt: number;
    let newTotalObecnosci: number;
    let streakTyg: number;

    if (existing) {
      newTotalPkt = Number(existing.total_pkt) + obecnosc.punkty_finalne;
      newTotalObecnosci = (existing.total_obecnosci || 0) + 1;
      streakTyg = existing.streak_tyg || 0;
      const ranga = getRanga(newTotalPkt);
      await supabase.from('ranking').update({
        total_pkt: newTotalPkt,
        total_obecnosci: newTotalObecnosci,
        ranga: ranga?.nazwa || 'Ready',
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      newTotalPkt = obecnosc.punkty_finalne;
      newTotalObecnosci = 1;
      streakTyg = 0;
      const ranga = getRanga(newTotalPkt);
      await supabase.from('ranking').insert({
        ministrant_id: obecnosc.ministrant_id,
        parafia_id: obecnosc.parafia_id,
        total_pkt: newTotalPkt,
        total_obecnosci: newTotalObecnosci,
        ranga: ranga?.nazwa || 'Ready',
      });
    }

    // Sprawdź odznaki
    await sprawdzOdznaki(obecnosc.ministrant_id, obecnosc.parafia_id, newTotalObecnosci, newTotalPkt, streakTyg);

    // Push notification do ministranta
    if (currentParafia) {
      const ministrant = members.find(m => m.profile_id === obecnosc.ministrant_id);
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parafia_id: currentParafia.id,
          grupa_docelowa: 'wszyscy',
          title: `Brawo! +${obecnosc.punkty_finalne} pkt`,
          body: `Twoje zgłoszenie zostało zatwierdzone! Masz już ${newTotalPkt} pkt ${ministrant ? `${ministrant.imie} ${ministrant.nazwisko || ''}`.trim() : ''}`,
          url: '/app',
          kategoria: 'zatwierdzenie',
          autor_id: currentUser.id,
          target_user_id: obecnosc.ministrant_id,
        }),
      }).catch(() => {});
    }

    loadRankingData();
  };

  const dodajPunktyRecznie = async () => {
    if (!selectedMember || !currentUser?.parafia_id) return;
    const pkt = parseInt(dodajPunktyForm.punkty);
    if (!pkt || pkt === 0) return;

    const { data: existing } = await supabase.from('ranking')
      .select('*')
      .eq('ministrant_id', selectedMember.profile_id)
      .eq('parafia_id', currentUser.parafia_id)
      .single();

    if (existing) {
      const newTotal = Number(existing.total_pkt) + pkt;
      const ranga = getRanga(newTotal);
      await supabase.from('ranking').update({
        total_pkt: newTotal,
        ranga: ranga?.nazwa || existing.ranga,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      const ranga = getRanga(pkt);
      await supabase.from('ranking').insert({
        ministrant_id: selectedMember.profile_id,
        parafia_id: currentUser.parafia_id,
        total_pkt: pkt,
        total_obecnosci: 0,
        ranga: ranga?.nazwa || 'Ready',
      });
    }

    setShowDodajPunktyModal(false);
    setDodajPunktyForm({ punkty: '', powod: '' });
    loadRankingData();
  };

  const odrzucObecnosc = async (obecnoscId: string) => {
    await supabase.from('obecnosci').update({
      status: 'odrzucona',
      zatwierdzona_przez: currentUser?.id,
    }).eq('id', obecnoscId);
    loadRankingData();
  };

  const zatwierdzWszystkie = async () => {
    const oczekujace = obecnosci.filter(o => o.status === 'oczekuje');
    for (const o of oczekujace) {
      await zatwierdzObecnosc(o.id);
    }
  };

  const toggleDyzur = async (dzienTygodnia: number) => {
    if (!currentUser?.parafia_id) return;

    const existing = dyzury.find(d => d.ministrant_id === currentUser.id && d.dzien_tygodnia === dzienTygodnia);

    if (existing) {
      await supabase.from('dyzury').delete().eq('id', existing.id);
    } else {
      await supabase.from('dyzury').insert({
        ministrant_id: currentUser.id,
        parafia_id: currentUser.parafia_id,
        dzien_tygodnia: dzienTygodnia,
      });
    }
    loadRankingData();
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !editProfilForm.imie.trim()) {
      alert('Imię jest wymagane!');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        imie: editProfilForm.imie.trim(),
        nazwisko: editProfilForm.nazwisko.trim(),
        email: editProfilForm.email.trim(),
      })
      .eq('id', currentUser.id);

    if (profileError) {
      alert('Błąd zapisu profilu: ' + profileError.message);
      return;
    }

    // Zaktualizuj też w tabeli members
    if (currentUser.parafia_id) {
      await supabase
        .from('parafia_members')
        .update({
          imie: editProfilForm.imie.trim(),
          nazwisko: editProfilForm.nazwisko.trim(),
          email: editProfilForm.email.trim(),
        })
        .eq('profile_id', currentUser.id)
        .eq('parafia_id', currentUser.parafia_id);
    }

    setCurrentUser({
      ...currentUser,
      imie: editProfilForm.imie.trim(),
      nazwisko: editProfilForm.nazwisko.trim(),
      email: editProfilForm.email.trim(),
    });
    setShowEditProfilModal(false);
    loadParafiaData();
  };

  const toggleDyzurAdmin = async (ministrantId: string, dzienTygodnia: number) => {
    if (!currentUser?.parafia_id) return;

    const existing = dyzury.find(d => d.ministrant_id === ministrantId && d.dzien_tygodnia === dzienTygodnia);

    if (existing) {
      await supabase.from('dyzury').delete().eq('id', existing.id);
    } else {
      await supabase.from('dyzury').insert({
        ministrant_id: ministrantId,
        parafia_id: currentUser.parafia_id,
        dzien_tygodnia: dzienTygodnia,
      });
    }
    loadRankingData();
  };

  const handleDeleteMember = async (member: Member) => {
    if (!currentUser?.parafia_id) return;
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: member.profile_id,
          parafiaId: currentUser.parafia_id,
          requesterId: currentUser.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Błąd usuwania konta:', err);
      }
      loadParafiaData();
      loadRankingData();
    } catch (err) {
      console.error('Błąd usuwania ministranta:', err);
    }
    setShowDeleteMemberModal(false);
    setMemberToDelete(null);
  };

  const updateConfigValue = async (klucz: string, nowaWartosc: number) => {
    const entry = punktacjaConfig.find(p => p.klucz === klucz);
    if (entry) {
      await supabase.from('punktacja_config').update({ wartosc: nowaWartosc }).eq('id', entry.id);
      loadRankingData();
    }
  };

  const handleResetPunktacja = async () => {
    if (!currentUser?.parafia_id) return;
    const pid = currentUser.parafia_id;
    // Usuń obecności i kary
    await supabase.from('obecnosci').delete().eq('parafia_id', pid);
    await supabase.from('minusowe_punkty').delete().eq('parafia_id', pid);
    // Wyzeruj tabele ranking (update zamiast delete — zachowaj rekordy)
    const { data: rankingRows } = await supabase.from('ranking').select('id').eq('parafia_id', pid);
    if (rankingRows) {
      for (const row of rankingRows) {
        await supabase.from('ranking').update({
          total_pkt: 0, total_obecnosci: 0, total_minusowe: 0, streak_tyg: 0, max_streak_tyg: 0,
        }).eq('id', row.id);
      }
    }
    // Usuń zdobyte odznaki
    const ministrantIds = members.filter(m => m.parafia_id === pid).map(m => m.profile_id);
    if (ministrantIds.length > 0) {
      await supabase.from('odznaki_zdobyte').delete().in('ministrant_id', ministrantIds);
    }
    loadRankingData();
    setShowResetPunktacjaModal(false);
  };

  const updateRanga = async (id: string, nazwa: string, min_pkt: number) => {
    await supabase.from('rangi_config').update({ nazwa, min_pkt }).eq('id', id);
    loadRankingData();
  };

  const updateRangaKolor = async (id: string, kolor: string) => {
    await supabase.from('rangi_config').update({ kolor }).eq('id', id);
    loadRankingData();
  };

  const addRanga = async () => {
    if (!currentParafia) return;
    const maxKolejnosc = rangiConfig.reduce((max, r) => Math.max(max, r.kolejnosc), 0);
    await supabase.from('rangi_config').insert({
      parafia_id: currentParafia.id,
      nazwa: 'Nowa ranga',
      min_pkt: (rangiConfig[rangiConfig.length - 1]?.min_pkt || 0) + 500,
      kolor: 'gray',
      kolejnosc: maxKolejnosc + 1,
    });
    loadRankingData();
  };

  const deleteRanga = async (id: string) => {
    await supabase.from('rangi_config').delete().eq('id', id);
    loadRankingData();
  };

  const addPunktacja = async (klucz: string, wartosc: number, opis: string) => {
    if (!currentParafia) return;
    await supabase.from('punktacja_config').insert({
      parafia_id: currentParafia.id,
      klucz,
      wartosc,
      opis,
    });
    loadRankingData();
  };

  const updateConfigOpis = async (klucz: string, opis: string) => {
    const entry = punktacjaConfig.find(p => p.klucz === klucz);
    if (entry) {
      await supabase.from('punktacja_config').update({ opis }).eq('id', entry.id);
      loadRankingData();
    }
  };

  const deletePunktacja = async (id: string) => {
    await supabase.from('punktacja_config').delete().eq('id', id);
    loadRankingData();
  };

  const updateOdznaka = async (id: string, updates: Partial<OdznakaConfig>) => {
    await supabase.from('odznaki_config').update(updates).eq('id', id);
    loadRankingData();
  };

  const addOdznaka = async () => {
    if (!currentParafia) return;
    await supabase.from('odznaki_config').insert({
      parafia_id: currentParafia.id,
      nazwa: 'Nowa odznaka',
      opis: 'Opis odznaki',
      warunek_typ: 'total_obecnosci',
      warunek_wartosc: 1,
      bonus_pkt: 10,
      aktywna: true,
    });
    loadRankingData();
  };

  const deleteOdznaka = async (id: string) => {
    await supabase.from('odznaki_config').delete().eq('id', id);
    loadRankingData();
  };

  const initRankingConfig = async () => {
    if (!currentParafia) return;
    const { error } = await supabase.rpc('init_ranking_config', { p_parafia_id: currentParafia.id });
    if (error) {
      alert('Błąd inicjalizacji: ' + error.message);
    } else {
      loadRankingData();
    }
  };

  // ==================== USEEFFECT - INICJALIZACJA ====================

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentParafia(null);
        setMembers([]);
        setSluzby([]);
        setZaproszenia([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (currentUser?.parafia_id) {
      loadParafiaData();
      loadSluzby();
      loadPoslugi();
      loadSzablony();
    }
  }, [currentUser?.parafia_id, loadParafiaData, loadSluzby, loadPoslugi, loadSzablony]);

  useEffect(() => {
    if (currentUser?.email) {
      loadZaproszenia();
    }
  }, [currentUser?.email, loadZaproszenia]);

  useEffect(() => {
    if (currentUser?.parafia_id) {
      loadRankingData();
    }
  }, [currentUser?.parafia_id, loadRankingData]);

  useEffect(() => {
    if (currentUser?.parafia_id) {
      loadTablicaData();
    }
  }, [currentUser?.parafia_id, loadTablicaData]);

  // Zaladuj baner powitalny z app_config
  useEffect(() => {
    if (!currentUser?.typ) return;
    const prefix = currentUser.typ === 'ksiadz' ? 'baner_ksiadz' : 'baner_ministrant';
    supabase.from('app_config').select('klucz, wartosc').in('klucz', [`${prefix}_tytul`, `${prefix}_opis`])
      .then(({ data }) => {
        if (data && data.length > 0) {
          const get = (k: string) => data.find((d: any) => d.klucz === k)?.wartosc || '';
          const tytul = get(`${prefix}_tytul`);
          const opis = get(`${prefix}_opis`);
          if (tytul || opis) {
            setInfoBanerTresc({ tytul, opis });
          }
        }
      });
  }, [currentUser?.typ]);

  // Pokaż baner instalacji PWA na iOS Safari
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    const dismissed = localStorage.getItem('ios-install-dismissed');
    if (isIOS && !isStandalone && !dismissed) {
      setShowIOSInstallBanner(true);
    }
  }, []);

  // Odświeżaj dane gdy użytkownik wraca do aplikacji (np. po kliknięciu w push)
  useEffect(() => {
    if (!currentUser?.parafia_id) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadRankingData();
        loadTablicaData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentUser?.parafia_id, loadRankingData, loadTablicaData]);

  // Polling co 30s żeby wykryć zatwierdzone zgłoszenia w tle
  useEffect(() => {
    if (!currentUser?.parafia_id || currentUser.typ !== 'ministrant') return;
    const interval = setInterval(() => loadRankingData(), 30000);
    return () => clearInterval(interval);
  }, [currentUser?.parafia_id, currentUser?.typ, loadRankingData]);

  // Wykryj nowo zatwierdzone zgłoszenia i pokaż celebrację
  useEffect(() => {
    if (currentUser?.typ !== 'ministrant' || obecnosci.length === 0) {
      prevObecnosciRef.current = obecnosci;
      return;
    }
    const prev = prevObecnosciRef.current;
    if (prev.length > 0) {
      const myObecnosci = obecnosci.filter(o => o.ministrant_id === currentUser.id);
      const myPrev = prev.filter(o => o.ministrant_id === currentUser.id);
      const newlyApproved = myObecnosci.filter(o =>
        o.status === 'zatwierdzona' && myPrev.find(p => p.id === o.id)?.status === 'oczekuje'
      );
      if (newlyApproved.length > 0) {
        const punkty = newlyApproved.reduce((sum, o) => sum + o.punkty_finalne, 0);
        const myRanking = rankingData.find(r => r.ministrant_id === currentUser.id);
        setCelebration({ punkty, total: myRanking ? Number(myRanking.total_pkt) : punkty });
      }
    }
    prevObecnosciRef.current = obecnosci;
  }, [obecnosci, currentUser?.typ, currentUser?.id, rankingData]);

  // Inicjalizacja Tiptap edytora przy otwarciu modala
  const editorInitialized = useRef(false);
  useEffect(() => {
    if (showNewWatekModal && tiptapEditor && !editorInitialized.current) {
      editorInitialized.current = true;
      // Defer setContent to avoid flushSync warning during React render
      queueMicrotask(() => {
        const content = newWatekForm.tresc || '';
        if (content && !content.includes('<p>') && !content.includes('<img')) {
          tiptapEditor.commands.setContent(trescToHtml(content));
        } else {
          tiptapEditor.commands.setContent(content || '<p></p>');
        }
      });
    }
    if (!showNewWatekModal) {
      editorInitialized.current = false;
      // Clear editor content when dialog closes to avoid flushSync error on re-mount
      if (tiptapEditor) {
        tiptapEditor.commands.clearContent(false);
      }
    }
  }, [showNewWatekModal, tiptapEditor]);

  // ==================== AUTENTYKACJA ====================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    const errors: typeof authErrors = {};

    if (!email.trim()) {
      errors.email = 'Wpisz adres e-mail';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Nieprawidłowy format adresu e-mail';
    }

    if (!password) {
      errors.password = 'Wpisz hasło';
    } else if (password.length < 6) {
      errors.password = 'Hasło musi mieć co najmniej 6 znaków';
    }

    if (!isLogin) {
      if (!imie.trim()) errors.imie = 'Wpisz swoje imię';
      if (!nazwisko.trim()) errors.nazwisko = 'Wpisz swoje nazwisko';
      if (userType === 'ksiadz' && !diecezja) errors.diecezja = 'Wybierz swoją diecezję';
    }

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    setAuthErrors({});
    setAuthLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setAuthErrors({ general: 'Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.' });
        } else {
          setAuthErrors({ general: 'Błąd logowania. Spróbuj ponownie później.' });
        }
        setAuthLoading(false);
        return;
      }
    } else {
      if (!acceptedTerms) {
        setAuthErrors({ general: 'Musisz zaakceptować regulamin i politykę prywatności.' });
        setAuthLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { imie: imie.trim(), nazwisko: nazwisko.trim(), typ: userType, ...(userType === 'ksiadz' && diecezja ? { diecezja } : {}) }
        }
      });

      if (error) {
        if (error.message === 'User already registered') {
          setAuthErrors({ email: 'Użytkownik o tym adresie e-mail już istnieje.' });
        } else if (error.message.includes('password')) {
          setAuthErrors({ password: 'Hasło jest za słabe. Użyj co najmniej 6 znaków.' });
        } else {
          setAuthErrors({ general: error.message });
        }
        setAuthLoading(false);
        return;
      }
    }

    setAuthLoading(false);
  };

  const handleResetPassword = async () => {
    const errors: typeof authErrors = {};

    if (!email.trim()) {
      errors.email = 'Wpisz adres e-mail, na który wyślemy link do resetowania hasła';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Nieprawidłowy format adresu e-mail';
    }

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    setAuthErrors({});
    setAuthLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/app`,
    });

    if (error) {
      setAuthErrors({ general: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' });
      setAuthLoading(false);
      return;
    }

    setAuthMode('reset-sent');
    setAuthLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    if (error) {
      alert(`Błąd logowania: ${error.message}`);
      setAuthLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!currentUser) return;
    if (!profileCompletionForm.imie.trim()) {
      alert('Imię jest wymagane!');
      return;
    }
    if (!acceptedTerms) {
      alert('Musisz zaakceptować regulamin i politykę prywatności!');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        imie: profileCompletionForm.imie.trim(),
        nazwisko: profileCompletionForm.nazwisko.trim(),
        typ: profileCompletionForm.typ,
      })
      .eq('id', currentUser.id);

    if (error) {
      alert('Błąd zapisu profilu: ' + error.message);
      return;
    }

    setCurrentUser({
      ...currentUser,
      imie: profileCompletionForm.imie.trim(),
      nazwisko: profileCompletionForm.nazwisko.trim(),
      typ: profileCompletionForm.typ,
    });
    setShowProfileCompletion(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowProfileCompletion(false);
    setEmail('');
    setPassword('');
    setImie('');
  };

  const saveParafiaNazwa = async () => {
    if (!currentParafia || !parafiaNazwaInput.trim()) return;
    const { error } = await supabase.from('parafie').update({ nazwa: parafiaNazwaInput.trim() }).eq('id', currentParafia.id);
    if (error) { alert('Błąd: ' + error.message); return; }
    setCurrentParafia({ ...currentParafia, nazwa: parafiaNazwaInput.trim() });
    setEditingParafiaNazwa(false);
  };

  // ==================== PARAFIA ====================

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateParafia = async () => {
    if (!parafiaNazwa || !parafiaMiasto || !currentUser) {
      alert('Wypełnij wymagane pola!');
      return;
    }

    // Utwórz parafię
    const { data: newParafia, error: parafiaError } = await supabase
      .from('parafie')
      .insert({
        nazwa: parafiaNazwa,
        miasto: parafiaMiasto,
        adres: parafiaAdres,
        admin_id: currentUser.id,
        admin_email: currentUser.email,
        kod_zaproszenia: generateInviteCode()
      })
      .select()
      .single();

    if (parafiaError || !newParafia) {
      alert('Błąd tworzenia parafii!');
      return;
    }

    // Dodaj księdza jako członka
    await supabase.from('parafia_members').insert({
      profile_id: currentUser.id,
      parafia_id: newParafia.id,
      email: currentUser.email,
      imie: currentUser.imie,
      nazwisko: currentUser.nazwisko,
      typ: 'ksiadz',
      role: []
    });

    // Zaktualizuj profil użytkownika
    await supabase
      .from('profiles')
      .update({ parafia_id: newParafia.id })
      .eq('id', currentUser.id);

    setCurrentUser({ ...currentUser, parafia_id: newParafia.id });
    setShowParafiaModal(false);
    setParafiaNazwa('');
    setParafiaMiasto('');
    setParafiaAdres('');
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !currentParafia || !currentUser) {
      alert('Wypełnij email!');
      return;
    }

    const { error } = await supabase.from('zaproszenia').insert({
      email: inviteEmail,
      parafia_id: currentParafia.id,
      parafia_nazwa: currentParafia.nazwa,
      admin_email: currentUser.email
    });

    if (error) {
      alert('Błąd wysyłania zaproszenia!');
      return;
    }

    alert(`Zaproszenie wysłane do ${inviteEmail}`);
    setShowInviteModal(false);
    setInviteEmail('');
  };

  const handleJoinByCode = async () => {
    if (!joinCode || !currentUser) {
      alert('Wpisz kod zaproszenia!');
      return;
    }

    // Szukaj parafii po kodzie
    const { data: parafia } = await supabase
      .from('parafie')
      .select('*')
      .eq('kod_zaproszenia', joinCode.toUpperCase())
      .single();

    if (!parafia) {
      alert('Nie znaleziono parafii o tym kodzie!');
      return;
    }

    // Dodaj jako członka
    const { error: memberError } = await supabase.from('parafia_members').insert({
      profile_id: currentUser.id,
      parafia_id: parafia.id,
      email: currentUser.email,
      imie: currentUser.imie,
      nazwisko: currentUser.nazwisko,
      typ: currentUser.typ,
      role: []
    });

    if (memberError) {
      alert('Już należysz do tej parafii!');
      return;
    }

    // Zaktualizuj profil
    await supabase
      .from('profiles')
      .update({ parafia_id: parafia.id })
      .eq('id', currentUser.id);

    setCurrentUser({ ...currentUser, parafia_id: parafia.id });
    setShowJoinModal(false);
    setJoinCode('');
  };

  const handleAcceptInvite = async (zaproszenie: Zaproszenie) => {
    if (!currentUser) return;

    // Dodaj jako członka parafii
    await supabase.from('parafia_members').insert({
      profile_id: currentUser.id,
      parafia_id: zaproszenie.parafia_id,
      email: currentUser.email,
      imie: currentUser.imie,
      nazwisko: currentUser.nazwisko,
      typ: currentUser.typ,
      role: []
    });

    // Zaktualizuj profil
    await supabase
      .from('profiles')
      .update({ parafia_id: zaproszenie.parafia_id })
      .eq('id', currentUser.id);

    // Usuń zaproszenie
    await supabase
      .from('zaproszenia')
      .delete()
      .eq('id', zaproszenie.id);

    setCurrentUser({ ...currentUser, parafia_id: zaproszenie.parafia_id });
    setZaproszenia(zaproszenia.filter(z => z.id !== zaproszenie.id));
  };

  const handleRejectInvite = async (zaproszenie: Zaproszenie) => {
    await supabase
      .from('zaproszenia')
      .delete()
      .eq('id', zaproszenie.id);

    setZaproszenia(zaproszenia.filter(z => z.id !== zaproszenie.id));
  };

  // ==================== SŁUŻBY ====================

  const FUNKCJE_TYPES: FunkcjaType[] = funkcjeConfig.map(f => f.nazwa);
  const FUNKCJE_OPISY: Record<string, string> = Object.fromEntries(funkcjeConfig.map(f => [f.nazwa, f.opis]));

  const handleCreateSluzba = async () => {
    if (!sluzbaForm.nazwa || !sluzbaForm.data || !sluzbaForm.godzina || !currentUser?.parafia_id) {
      alert('Wypełnij wymagane pola!');
      return;
    }

    if (selectedSluzba) {
      // Edycja - zaktualizuj wydarzenie
      await supabase
        .from('sluzby')
        .update({
          nazwa: sluzbaForm.nazwa,
          data: sluzbaForm.data,
          godzina: sluzbaForm.godzina
        })
        .eq('id', selectedSluzba.id);

      // Usuń stare funkcje i dodaj nowe
      await supabase
        .from('funkcje')
        .delete()
        .eq('sluzba_id', selectedSluzba.id);

      const funkcjeToInsert = FUNKCJE_TYPES.map(typ => {
        const assigned = sluzbaForm.funkcje[typ];
        return {
          sluzba_id: selectedSluzba.id,
          typ,
          ministrant_id: (assigned && assigned !== 'BEZ' && assigned !== 'UNASSIGNED' && assigned !== '') ? assigned : null,
          aktywna: assigned !== 'BEZ',
          zaakceptowana: false
        };
      });

      await supabase.from('funkcje').insert(funkcjeToInsert);
    } else {
      // Nowe wydarzenie
      const { data: newSluzba, error } = await supabase
        .from('sluzby')
        .insert({
          nazwa: sluzbaForm.nazwa,
          data: sluzbaForm.data,
          godzina: sluzbaForm.godzina,
          parafia_id: currentUser.parafia_id,
          utworzono_przez: currentUser.id,
          status: 'zaplanowana'
        })
        .select()
        .single();

      if (error || !newSluzba) {
        alert('Błąd tworzenia wydarzenia!');
        return;
      }

      const funkcjeToInsert = FUNKCJE_TYPES.map(typ => {
        const assigned = sluzbaForm.funkcje[typ];
        return {
          sluzba_id: newSluzba.id,
          typ,
          ministrant_id: (assigned && assigned !== 'BEZ' && assigned !== 'UNASSIGNED' && assigned !== '') ? assigned : null,
          aktywna: assigned !== 'BEZ',
          zaakceptowana: false
        };
      });

      await supabase.from('funkcje').insert(funkcjeToInsert);

      // Push notification o nowym wydarzeniu (fire and forget)
      if (currentParafia) {
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa: 'wszyscy',
            title: 'Nowe wydarzenie',
            body: `${sluzbaForm.nazwa} — ${new Date(sluzbaForm.data).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} o ${sluzbaForm.godzina}`,
            url: '/app',
            kategoria: 'wydarzenie',
            autor_id: currentUser.id,
          }),
        }).catch(() => {});
      }
    }

    // Odśwież listę
    await loadSluzby();
    setShowSluzbaModal(false);
    setSelectedSluzba(null);
    setSluzbaForm({ nazwa: '', data: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
  };

  const handleEditSluzba = (sluzba: Sluzba) => {
    setSelectedSluzba(sluzba);
    const funkcjeMap: Record<FunkcjaType, string> = {} as Record<FunkcjaType, string>;
    sluzba.funkcje.forEach(f => {
      if (!f.aktywna) {
        funkcjeMap[f.typ as FunkcjaType] = 'BEZ';
      } else if (f.ministrant_id) {
        funkcjeMap[f.typ as FunkcjaType] = f.ministrant_id;
      } else {
        funkcjeMap[f.typ as FunkcjaType] = 'UNASSIGNED';
      }
    });

    setSluzbaForm({
      nazwa: sluzba.nazwa,
      data: sluzba.data,
      godzina: sluzba.godzina,
      funkcje: funkcjeMap
    });
    setShowSluzbaModal(true);
  };

  const handleDeleteSluzba = async () => {
    if (!selectedSluzba) return;

    await supabase
      .from('sluzby')
      .delete()
      .eq('id', selectedSluzba.id);

    await loadSluzby();
    setShowSluzbaModal(false);
    setSelectedSluzba(null);
  };

  const handleAcceptSluzba = async (sluzba: Sluzba) => {
    if (!currentUser) return;

    await supabase
      .from('funkcje')
      .update({ zaakceptowana: true })
      .eq('sluzba_id', sluzba.id)
      .eq('ministrant_id', currentUser.id);

    await loadSluzby();
  };

  const handleRejectSluzba = async (sluzba: Sluzba) => {
    if (!currentUser) return;

    await supabase
      .from('funkcje')
      .update({ ministrant_id: null, zaakceptowana: false })
      .eq('sluzba_id', sluzba.id)
      .eq('ministrant_id', currentUser.id);

    await loadSluzby();
  };

  // ==================== SZABLONY WYDARZEŃ ====================

  const handleCreateSzablon = async () => {
    if (!szablonForm.nazwa || !szablonForm.godzina || !currentUser?.parafia_id) {
      alert('Wypełnij wymagane pola!');
      return;
    }

    const funkcjeData: Record<string, string> = {};
    FUNKCJE_TYPES.forEach(typ => {
      const val = szablonForm.funkcje[typ];
      if (val === 'BEZ') {
        funkcjeData[typ] = 'BEZ';
      }
      // UNASSIGNED i puste pomijamy — domyślnie nie przypisano
    });

    if (selectedSzablon) {
      await supabase
        .from('szablony_wydarzen')
        .update({
          nazwa: szablonForm.nazwa,
          godzina: szablonForm.godzina,
          funkcje: funkcjeData,
        })
        .eq('id', selectedSzablon.id);
    } else {
      await supabase
        .from('szablony_wydarzen')
        .insert({
          nazwa: szablonForm.nazwa,
          godzina: szablonForm.godzina,
          funkcje: funkcjeData,
          parafia_id: currentUser.parafia_id,
          utworzono_przez: currentUser.id,
        });
    }

    await loadSzablony();
    setShowSzablonModal(false);
    setSelectedSzablon(null);
    setSzablonForm({ nazwa: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
  };

  const handleDeleteSzablon = async () => {
    if (!selectedSzablon) return;

    await supabase
      .from('szablony_wydarzen')
      .delete()
      .eq('id', selectedSzablon.id);

    await loadSzablony();
    setShowSzablonModal(false);
    setSelectedSzablon(null);
  };

  const handlePublishSzablon = async () => {
    if (!selectedSzablon || !publishDate || !currentUser?.parafia_id) {
      alert('Wybierz datę!');
      return;
    }

    const { data: newSluzba, error } = await supabase
      .from('sluzby')
      .insert({
        nazwa: selectedSzablon.nazwa,
        data: publishDate,
        godzina: selectedSzablon.godzina,
        parafia_id: currentUser.parafia_id,
        utworzono_przez: currentUser.id,
        status: 'zaplanowana'
      })
      .select()
      .single();

    if (error || !newSluzba) {
      alert('Błąd publikacji wydarzenia!');
      return;
    }

    const funkcjeToInsert = FUNKCJE_TYPES.map(typ => {
      const szablonVal = selectedSzablon.funkcje[typ];
      const assigned = publishFunkcje[typ];
      return {
        sluzba_id: newSluzba.id,
        typ,
        ministrant_id: (assigned && assigned !== 'BEZ' && assigned !== 'UNASSIGNED' && assigned !== '') ? assigned : null,
        aktywna: szablonVal !== 'BEZ' && assigned !== 'BEZ',
        zaakceptowana: false
      };
    });

    await supabase.from('funkcje').insert(funkcjeToInsert);

    // Push notification
    if (currentParafia) {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parafia_id: currentParafia.id,
          grupa_docelowa: 'wszyscy',
          title: 'Nowe wydarzenie',
          body: `${selectedSzablon.nazwa} — ${new Date(publishDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} o ${selectedSzablon.godzina}`,
          url: '/app',
          kategoria: 'wydarzenie',
          autor_id: currentUser.id,
        }),
      }).catch(() => {});
    }

    await loadSluzby();
    setShowPublishSzablonModal(false);
    setSelectedSzablon(null);
    setPublishDate('');
    setPublishFunkcje({} as Record<FunkcjaType, string>);
    setShowSzablonyView(false);
  };

  // ==================== MINISTRANCI ====================

  const handleUpdatePoslugi = async () => {
    if (!selectedMember) return;

    await supabase
      .from('parafia_members')
      .update({ role: selectedMember.role })
      .eq('id', selectedMember.id);

    await loadParafiaData();
    setShowPoslugiModal(false);
    setSelectedMember(null);
  };

  const handleUpdateGrupa = async (grupa: GrupaType) => {
    if (!selectedMember) return;

    await supabase
      .from('parafia_members')
      .update({ grupa })
      .eq('id', selectedMember.id);

    await loadParafiaData();
    setShowGrupaModal(false);
    setSelectedMember(null);
  };

  // ==================== ZARZĄDZANIE GRUPAMI ====================

  const saveGrupyToDb = async (newGrupy: GrupaConfig[]) => {
    if (!currentUser?.parafia_id) return;
    await supabase
      .from('parafie')
      .update({ grupy: newGrupy })
      .eq('id', currentUser.parafia_id);
  };

  const saveFunkcjeConfigToDb = async (newFunkcje: FunkcjaConfig[]) => {
    if (!currentUser?.parafia_id) return;
    await supabase
      .from('parafie')
      .update({ funkcje_config: newFunkcje })
      .eq('id', currentUser.parafia_id);
  };

  const handleAddFunkcja = () => {
    if (!newFunkcjaForm.nazwa.trim()) {
      alert('Podaj nazwę funkcji!');
      return;
    }
    const id = newFunkcjaForm.nazwa.toLowerCase().replace(/\s+/g, '_').replace(/[^a-ząćęłńóśźż0-9_]/gi, '');
    const newFunkcja: FunkcjaConfig = {
      id,
      nazwa: newFunkcjaForm.nazwa.trim(),
      opis: newFunkcjaForm.opis.trim(),
      emoji: '⭐',
      kolor: 'gray',
    };
    const updated = [...funkcjeConfig, newFunkcja];
    setFunkcjeConfig(updated);
    saveFunkcjeConfigToDb(updated);
    setNewFunkcjaForm({ nazwa: '', opis: '' });
  };

  const handleDeleteFunkcja = (id: string) => {
    const updated = funkcjeConfig.filter(f => f.id !== id);
    setFunkcjeConfig(updated);
    saveFunkcjeConfigToDb(updated);
  };

  const handleMoveFunkcja = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= funkcjeConfig.length) return;
    const updated = [...funkcjeConfig];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setFunkcjeConfig(updated);
    saveFunkcjeConfigToDb(updated);
  };

  const handleSaveFunkcjaEdit = async () => {
    if (!editingFunkcja || !editingFunkcja.nazwa.trim()) return;

    let obrazekUrl = editingFunkcja.obrazek_url;

    // Upload nowego obrazka
    if (editFunkcjaFile) {
      if (editingFunkcja.obrazek_url) {
        await deletePoslugaImage(editingFunkcja.obrazek_url);
      }
      const url = await uploadPoslugaImage(editFunkcjaFile, `funkcja_${editingFunkcja.id}`);
      if (url) obrazekUrl = url;
    }

    // Upload nowych zdjęć do galerii
    let zdjeciaUrls = editingFunkcja.zdjecia || [];
    if (editFunkcjaGalleryFiles.length > 0) {
      const newUrls = await uploadPoslugaGalleryImages(editFunkcjaGalleryFiles, `funkcja_${editingFunkcja.id}`);
      zdjeciaUrls = [...zdjeciaUrls, ...newUrls];
    }

    const updatedFunkcja: FunkcjaConfig = {
      ...editingFunkcja,
      nazwa: editingFunkcja.nazwa.trim(),
      opis: editingFunkcja.opis.trim(),
      obrazek_url: obrazekUrl || undefined,
      dlugi_opis: poslugaEditor?.getHTML() || editingFunkcja.dlugi_opis || '',
      zdjecia: zdjeciaUrls.length > 0 ? zdjeciaUrls : undefined,
      youtube_url: editingFunkcja.youtube_url || undefined,
    };

    const updated = funkcjeConfig.map(f =>
      f.id === editingFunkcja.id ? updatedFunkcja : f
    );
    setFunkcjeConfig(updated);
    saveFunkcjeConfigToDb(updated);
    setShowEditFunkcjaModal(false);
    setEditingFunkcja(null);
    setEditFunkcjaFile(null);
    setEditFunkcjaPreview('');
    setEditFunkcjaGalleryFiles([]);
    setEditFunkcjaGalleryPreviews([]);
  };

  const handleAddGrupa = () => {
    if (!newGrupaForm.nazwa.trim()) {
      alert('Podaj nazwę grupy!');
      return;
    }
    const id = newGrupaForm.nazwa.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newGrupa: GrupaConfig = {
      id,
      nazwa: newGrupaForm.nazwa,
      kolor: newGrupaForm.kolor,
      emoji: newGrupaForm.emoji,
      opis: newGrupaForm.opis,
    };
    const updated = [...grupy, newGrupa];
    setGrupy(updated);
    saveGrupyToDb(updated);
    setNewGrupaForm({ nazwa: '', kolor: 'gray', emoji: '⚪', opis: '' });
  };

  const handleDeleteGrupa = (id: string) => {
    const updated = grupy.filter(g => g.id !== id);
    setGrupy(updated);
    saveGrupyToDb(updated);
  };

  const handleRenameGrupa = (id: string, nazwa: string) => {
    const updated = grupy.map(g => g.id === id ? { ...g, nazwa } : g);
    setGrupy(updated);
    saveGrupyToDb(updated);
  };

  // ==================== ZARZĄDZANIE POSŁUGAMI ====================

  const handleAddPosluga = async () => {
    if (!newPoslugaForm.nazwa.trim() || !currentUser?.parafia_id) {
      alert('Podaj nazwę posługi!');
      return;
    }

    const slug = newPoslugaForm.nazwa.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const tempId = crypto.randomUUID();

    let obrazekUrl: string | undefined;
    if (newPoslugaFile) {
      const url = await uploadPoslugaImage(newPoslugaFile, tempId);
      if (url) obrazekUrl = url;
    }

    let zdjeciaUrls: string[] = [];
    if (newGalleryFiles.length > 0) {
      zdjeciaUrls = await uploadPoslugaGalleryImages(newGalleryFiles, tempId);
    }

    const { error } = await supabase.from('poslugi').insert({
      id: tempId,
      parafia_id: currentUser.parafia_id,
      slug,
      nazwa: newPoslugaForm.nazwa,
      opis: newPoslugaForm.opis,
      emoji: newPoslugaForm.emoji,
      kolor: newPoslugaForm.kolor,
      obrazek_url: obrazekUrl || null,
      kolejnosc: poslugi.length,
      dlugi_opis: poslugaEditor?.getHTML() || '',
      zdjecia: zdjeciaUrls,
      youtube_url: newPoslugaForm.youtube_url || '',
    });

    if (error) {
      alert('Błąd dodawania posługi: ' + error.message);
      return;
    }

    await loadPoslugi();
    if (poslugaEditor) poslugaEditor.commands.clearContent();
    setNewPoslugaForm({ nazwa: '', opis: '', emoji: '⭐', kolor: 'gray', dlugi_opis: '', youtube_url: '' });
    setNewPoslugaFile(null);
    setNewPoslugaPreview('');
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
    setShowAddPoslugaModal(false);
  };

  const handleUpdatePoslugaDetails = async () => {
    if (!editingPosluga) return;

    let obrazekUrl = editingPosluga.obrazek_url;

    if (editPoslugaFile) {
      if (editingPosluga.obrazek_url) {
        await deletePoslugaImage(editingPosluga.obrazek_url);
      }
      const url = await uploadPoslugaImage(editPoslugaFile, editingPosluga.id);
      if (url) obrazekUrl = url;
    }

    let zdjeciaUrls = editingPosluga.zdjecia || [];
    if (editGalleryFiles.length > 0) {
      const newUrls = await uploadPoslugaGalleryImages(editGalleryFiles, editingPosluga.id);
      zdjeciaUrls = [...zdjeciaUrls, ...newUrls];
    }

    const { error } = await supabase
      .from('poslugi')
      .update({
        nazwa: editingPosluga.nazwa,
        opis: editingPosluga.opis,
        emoji: editingPosluga.emoji,
        kolor: editingPosluga.kolor,
        obrazek_url: obrazekUrl || null,
        dlugi_opis: poslugaEditor?.getHTML() || editingPosluga.dlugi_opis || '',
        zdjecia: zdjeciaUrls,
        youtube_url: editingPosluga.youtube_url || '',
      })
      .eq('id', editingPosluga.id);

    if (error) {
      alert('Błąd aktualizacji: ' + error.message);
      return;
    }

    await loadPoslugi();
    setEditingPosluga(null);
    setEditPoslugaFile(null);
    setEditPoslugaPreview('');
    setEditGalleryFiles([]);
    setEditGalleryPreviews([]);
    setShowPoslugaEditModal(false);
  };

  const handleDeletePosluga = async (id: string) => {
    const posluga = poslugi.find(p => p.id === id);
    if (posluga?.obrazek_url) {
      await deletePoslugaImage(posluga.obrazek_url);
    }
    if (posluga?.zdjecia) {
      for (const url of posluga.zdjecia) {
        await deletePoslugaImage(url);
      }
    }

    const { error } = await supabase
      .from('poslugi')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Błąd usuwania: ' + error.message);
      return;
    }

    await loadPoslugi();
  };

  // ==================== FUNKCJE — TABLICA OGŁOSZEŃ ====================

  // Konwersja starego markdown na HTML (dla kompatybilności)
  const trescToHtml = (text: string): string => {
    if (!text) return '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const html = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, rawLabel, url) => {
      const labelParts = rawLabel.split('|');
      const fileName = labelParts[0];
      const params: Record<string, string> = {};
      for (let j = 1; j < labelParts.length; j++) {
        const [key, val] = labelParts[j].split('=');
        if (key && val) params[key.trim()] = val.trim();
      }
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (imageExts.includes(ext)) {
        const widthAttr = params.width ? ` data-width="${params.width}" style="width:${params.width}px"` : '';
        return `<img src="${url}" alt="${fileName}"${widthAttr} />`;
      }
      return `<a href="${url}" target="_blank">${fileName}</a>`;
    });
    return html.split('\n').map(line => `<p>${line || '<br>'}</p>`).join('');
  };

  // Upload pliku i wstawienie do Tiptap
  const uploadAndInsertFile = async (file: File) => {
    if (!currentUser?.parafia_id || !tiptapEditor) return;
    setIsUploadingInline(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${currentUser.parafia_id}/inline/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('watki-files')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        alert('Błąd uploadu: ' + error.message);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('watki-files')
        .getPublicUrl(path);
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      if (imageExts.includes(ext)) {
        tiptapEditor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
      } else {
        tiptapEditor.chain().focus().setLink({ href: publicUrl, target: '_blank' }).insertContent(file.name).unsetLink().run();
      }
    } finally {
      setIsUploadingInline(false);
    }
  };

  // Renderowanie treści — obsługa HTML (nowy) i markdown (stary)
  const renderTresc = (text: string) => {
    if (!text) return null;
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return <div className="tiptap-content text-sm" dangerouslySetInnerHTML={{ __html: text }} />;
    }
    // Stary format markdown
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return <p className="text-sm whitespace-pre-wrap">{parts.map((part, i) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const rawLabel = match[1];
        const url = match[2];
        const fileName = rawLabel.split('|')[0];
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (imageExts.includes(ext)) {
          return <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={fileName} className="rounded-lg mt-2 mb-1 object-contain" style={{ maxWidth: '100%', maxHeight: '320px' }} /></a>;
        }
        return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"><Paperclip className="w-3 h-3" />{fileName}</a>;
      }
      return part;
    })}</p>;
  };

  const createWatek = async () => {
    if (!currentUser || !currentParafia) {
      alert('Błąd: nie załadowano danych użytkownika lub parafii.');
      return;
    }
    if (!newWatekForm.archiwum_data) {
      alert('Podaj termin przeniesienia do archiwum!');
      return;
    }
    const tresc = tiptapEditor?.getHTML() || newWatekForm.tresc;
    const { tytul, kategoria, grupa_docelowa } = newWatekForm;
    // Dla ogłoszenia tytuł generujemy z treści
    const plainTresc = tresc.replace(/<[^>]+>/g, '').trim();
    const finalTytul = kategoria === 'ogłoszenie'
      ? (plainTresc.substring(0, 50) + (plainTresc.length > 50 ? '...' : '') || 'Ogłoszenie')
      : tytul.trim();
    if (!finalTytul) { alert('Podaj tytuł!'); return; }
    if (kategoria === 'ogłoszenie' && !tresc.trim()) { alert('Podaj treść ogłoszenia!'); return; }

    try {
      const { data: inserted, error } = await supabase.from('tablica_watki').insert({
        parafia_id: currentParafia.id,
        autor_id: currentUser.id,
        tytul: finalTytul,
        tresc: tresc.trim(),
        kategoria,
        grupa_docelowa,
        archiwum_data: newWatekForm.archiwum_data || null,
      }).select().single();

      if (error) { alert('Błąd: ' + error.message); return; }

      // Push notification (fire and forget)
      if (inserted && currentParafia) {
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa,
            title: kategoria === 'ogłoszenie' ? 'Nowe ogłoszenie' : 'Nowa dyskusja',
            body: finalTytul,
            url: '/app',
            kategoria,
            autor_id: currentUser.id,
          }),
        }).catch(console.error);
      }

      setShowNewWatekModal(false);
      setNewWatekForm({ tytul: '', tresc: '', kategoria: 'ogłoszenie', grupa_docelowa: 'wszyscy', archiwum_data: '' });
      await loadTablicaData();
    } catch (err) {
      alert('Nieoczekiwany błąd: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const updateWatek = async () => {
    if (!editingWatek) return;
    const tresc = tiptapEditor?.getHTML() || newWatekForm.tresc;
    const { tytul, kategoria, grupa_docelowa } = newWatekForm;
    const plainTresc = tresc.replace(/<[^>]+>/g, '').trim();
    const finalTytul = kategoria === 'ogłoszenie'
      ? (plainTresc.substring(0, 50) + (plainTresc.length > 50 ? '...' : '') || 'Ogłoszenie')
      : tytul.trim();
    if (!finalTytul) { alert('Podaj tytuł!'); return; }
    if (kategoria === 'ogłoszenie' && !tresc.trim()) { alert('Podaj treść ogłoszenia!'); return; }

    const { error } = await supabase.from('tablica_watki').update({
      tytul: finalTytul,
      tresc: tresc.trim(),
      kategoria,
      grupa_docelowa,
      archiwum_data: newWatekForm.archiwum_data || null,
    }).eq('id', editingWatek.id);

    if (error) { alert('Błąd: ' + error.message); return; }
    const editedId = editingWatek.id;
    setShowNewWatekModal(false);
    setEditingWatek(null);
    setNewWatekForm({ tytul: '', tresc: '', kategoria: 'ogłoszenie', grupa_docelowa: 'wszyscy', archiwum_data: '' });
    await loadTablicaData();
    // Odśwież selectedWatek jeśli edytowaliśmy aktualnie otwarty wątek
    if (selectedWatek?.id === editedId) {
      const { data: updated } = await supabase.from('tablica_watki').select('*').eq('id', editedId).single();
      if (updated) setSelectedWatek(updated as TablicaWatek);
    }
  };

  const createAnkieta = async () => {
    if (!currentUser || !currentParafia) {
      alert('Błąd: nie załadowano danych użytkownika lub parafii.');
      return;
    }
    if (!newAnkietaForm.archiwum_data) {
      alert('Podaj termin przeniesienia do archiwum!');
      return;
    }
    const { pytanie, typ, obowiazkowa, termin, opcje } = newAnkietaForm;
    if (!pytanie.trim()) { alert('Podaj pytanie ankiety!'); return; }

    // Walidacja opcji PRZED wstawieniem do bazy
    if (typ !== 'tak_nie') {
      const validOpcje = opcje.filter(o => o.trim());
      if (validOpcje.length < 2) { alert('Dodaj minimum 2 opcje!'); return; }
    }

    try {
      // Stwórz wątek ankiety
      const { data: watek, error: watekErr } = await supabase.from('tablica_watki').insert({
        parafia_id: currentParafia.id,
        autor_id: currentUser.id,
        tytul: pytanie.trim(),
        tresc: '',
        kategoria: 'ankieta' as const,
        grupa_docelowa: 'wszyscy',
        archiwum_data: newAnkietaForm.archiwum_data || null,
      }).select().single();

      if (watekErr || !watek) { alert('Błąd tworzenia wątku: ' + (watekErr?.message || 'Brak danych')); return; }

      // Stwórz ankietę
      const { data: ankieta, error: ankietaErr } = await supabase.from('ankiety').insert({
        watek_id: watek.id,
        parafia_id: currentParafia.id,
        pytanie: pytanie.trim(),
        typ,
        obowiazkowa,
        wyniki_ukryte: newAnkietaForm.wyniki_ukryte,
        termin: termin || null,
      }).select().single();

      if (ankietaErr || !ankieta) { alert('Błąd tworzenia ankiety: ' + (ankietaErr?.message || 'Brak danych')); return; }

      // Dodaj opcje (dla nie-tak_nie — tak_nie tworzy trigger automatycznie)
      if (typ !== 'tak_nie') {
        const validOpcje = opcje.filter(o => o.trim());
        const { error: opcjeErr } = await supabase.from('ankiety_opcje').insert(
          validOpcje.map((o, i) => ({ ankieta_id: ankieta.id, tresc: o.trim(), kolejnosc: i + 1 }))
        );
        if (opcjeErr) { alert('Błąd dodawania opcji: ' + opcjeErr.message); return; }
      }

      // Push notification for ankieta (fire and forget)
      if (watek && currentParafia) {
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa: 'wszyscy',
            title: obowiazkowa ? 'Nowa ankieta (obowiązkowa)' : 'Nowa ankieta',
            body: pytanie.trim(),
            url: '/app',
            kategoria: 'ankieta',
            autor_id: currentUser.id,
          }),
        }).catch(console.error);
      }

      setShowNewAnkietaModal(false);
      setNewAnkietaForm({ pytanie: '', typ: 'tak_nie', obowiazkowa: true, wyniki_ukryte: false, termin: '', opcje: ['', ''], archiwum_data: '' });
      await loadTablicaData();
    } catch (err) {
      alert('Nieoczekiwany błąd: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const sendWiadomosc = async () => {
    if (!currentUser || !selectedWatek || !newWiadomoscTresc.trim()) return;
    const { error } = await supabase.from('tablica_wiadomosci').insert({
      watek_id: selectedWatek.id,
      autor_id: currentUser.id,
      tresc: newWiadomoscTresc.trim(),
    });
    if (error) { alert('Błąd: ' + error.message); return; }
    setNewWiadomoscTresc('');
    await loadWatekWiadomosci(selectedWatek.id);
  };

  const odpowiedzAnkieta = async (ankietaId: string, opcjaId: string) => {
    if (!currentUser) return;
    // Sprawdź czy ministrant już wcześniej odpowiadał (zmiana odpowiedzi)
    const ankieta = ankiety.find(a => a.id === ankietaId);
    if (ankieta?.termin && new Date(ankieta.termin) < new Date()) {
      alert('Termin odpowiedzi na tę ankietę już minął!');
      return;
    }
    const miałPoprzednia = ankietyOdpowiedzi.some(o => o.ankieta_id === ankietaId && o.respondent_id === currentUser.id);

    if (ankieta && ankieta.typ !== 'wielokrotny') {
      await supabase.from('ankiety_odpowiedzi')
        .delete()
        .eq('ankieta_id', ankietaId)
        .eq('respondent_id', currentUser.id);
    }

    const { error } = await supabase.from('ankiety_odpowiedzi').insert({
      ankieta_id: ankietaId,
      opcja_id: opcjaId,
      respondent_id: currentUser.id,
      zmieniona: miałPoprzednia,
      zmieniona_at: miałPoprzednia ? new Date().toISOString() : null,
    });
    if (error && !error.message.includes('duplicate')) { alert('Błąd: ' + error.message); return; }

    // Oznacz powiadomienie jako przeczytane
    await supabase.from('powiadomienia')
      .update({ przeczytane: true, wymaga_akcji: false })
      .eq('odniesienie_id', ankietaId)
      .eq('odbiorca_id', currentUser.id);

    await loadTablicaData();
  };

  const togglePrzypiety = async (watekId: string, current: boolean) => {
    // Instant feedback — aktualizuj lokalny stan natychmiast
    setSelectedWatek(prev => prev && prev.id === watekId ? { ...prev, przypiety: !current } : prev);
    setTablicaWatki(prev => prev.map(w => w.id === watekId ? { ...w, przypiety: !current } : w));
    const { error } = await supabase.from('tablica_watki').update({ przypiety: !current }).eq('id', watekId);
    if (error) { alert('Błąd: ' + error.message); }
    await loadTablicaData();
  };

  const toggleZamkniety = async (watekId: string, current: boolean) => {
    setSelectedWatek(prev => prev && prev.id === watekId ? { ...prev, zamkniety: !current } : prev);
    setTablicaWatki(prev => prev.map(w => w.id === watekId ? { ...w, zamkniety: !current } : w));
    const { error } = await supabase.from('tablica_watki').update({ zamkniety: !current }).eq('id', watekId);
    if (error) { alert('Błąd: ' + error.message); }
    await loadTablicaData();
  };

  const toggleWynikiUkryte = async (ankietaId: string, current: boolean) => {
    setAnkiety(prev => prev.map(a => a.id === ankietaId ? { ...a, wyniki_ukryte: !current } : a));
    const { error } = await supabase.from('ankiety').update({ wyniki_ukryte: !current }).eq('id', ankietaId);
    if (error) { alert('Błąd: ' + error.message); }
    await loadTablicaData();
  };

  const deleteWatek = async (watekId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wątek?')) return;
    // Przenieś do archiwum — ustaw archiwum_data na teraz
    await supabase.from('tablica_watki').update({ archiwum_data: new Date().toISOString() }).eq('id', watekId);
    setSelectedWatek(null);
    await loadTablicaData();
  };

  const permanentDeleteWatek = async (watekId: string) => {
    if (!confirm('Czy na pewno chcesz trwale usunąć ten wątek? Tej operacji nie można cofnąć.')) return;
    await supabase.from('tablica_watki').delete().eq('id', watekId);
    await loadTablicaData();
  };

  const restoreWatek = async (watekId: string) => {
    await supabase.from('tablica_watki').update({ archiwum_data: null }).eq('id', watekId);
    await loadTablicaData();
  };

  const markPowiadomienieRead = async (id: string) => {
    await supabase.from('powiadomienia').update({ przeczytane: true }).eq('id', id);
    await loadTablicaData();
  };

  // ==================== PUSH NOTIFICATIONS ====================
  const registerPushSubscription = useCallback(async () => {
    if (!currentUser?.id || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
        const padding = '='.repeat((4 - vapidKey.length % 4) % 4);
        const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const applicationServerKey = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) applicationServerKey[i] = rawData.charCodeAt(i);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, subscription: subscription.toJSON() }),
      });
    } catch {
      // Push not supported in this browser — ignore silently
    }
  }, [currentUser?.id]);

  // Rejestracja push notifications po zalogowaniu
  useEffect(() => {
    if (currentUser?.id && currentParafia?.id) {
      registerPushSubscription();
    }
  }, [currentUser?.id, currentParafia?.id, registerPushSubscription]);

  const startEditAnkieta = (ankieta: Ankieta) => {
    const opcje = ankietyOpcje.filter(o => o.ankieta_id === ankieta.id).sort((a, b) => a.kolejnosc - b.kolejnosc);
    setEditAnkietaForm({
      pytanie: ankieta.pytanie,
      obowiazkowa: ankieta.obowiazkowa,
      wyniki_ukryte: ankieta.wyniki_ukryte,
      termin: ankieta.termin ? new Date(ankieta.termin).toISOString().slice(0, 16) : '',
      aktywna: ankieta.aktywna,
      opcje: opcje.map(o => ({ id: o.id, tresc: o.tresc, kolejnosc: o.kolejnosc })),
      noweOpcje: [''],
    });
    setEditingAnkietaId(ankieta.id);
  };

  const saveEditAnkieta = async () => {
    if (!editingAnkietaId) return;
    try {
      // Aktualizuj ankietę
      const { error: ankietaErr } = await supabase.from('ankiety').update({
        pytanie: editAnkietaForm.pytanie.trim(),
        obowiazkowa: editAnkietaForm.obowiazkowa,
        wyniki_ukryte: editAnkietaForm.wyniki_ukryte,
        termin: editAnkietaForm.termin || null,
        aktywna: editAnkietaForm.aktywna,
      }).eq('id', editingAnkietaId);
      if (ankietaErr) { alert('Błąd: ' + ankietaErr.message); return; }

      // Aktualizuj tytuł wątku (= pytanie ankiety)
      const ankieta = ankiety.find(a => a.id === editingAnkietaId);
      if (ankieta) {
        await supabase.from('tablica_watki').update({ tytul: editAnkietaForm.pytanie.trim() }).eq('id', ankieta.watek_id);
      }

      // Aktualizuj istniejące opcje
      for (const opcja of editAnkietaForm.opcje) {
        if (opcja.tresc.trim()) {
          await supabase.from('ankiety_opcje').update({ tresc: opcja.tresc.trim() }).eq('id', opcja.id);
        }
      }

      // Dodaj nowe opcje
      const noweValid = editAnkietaForm.noweOpcje.filter(o => o.trim());
      if (noweValid.length > 0) {
        const maxKolejnosc = editAnkietaForm.opcje.length;
        await supabase.from('ankiety_opcje').insert(
          noweValid.map((o, i) => ({ ankieta_id: editingAnkietaId, tresc: o.trim(), kolejnosc: maxKolejnosc + i + 1 }))
        );
      }

      setEditingAnkietaId(null);
      await loadTablicaData();
    } catch (err) {
      alert('Błąd: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteAnkietaOpcja = async (opcjaId: string) => {
    // Sprawdź czy ktoś zagłosował na tę opcję
    const glosy = ankietyOdpowiedzi.filter(o => o.opcja_id === opcjaId);
    if (glosy.length > 0 && !confirm(`Ta opcja ma ${glosy.length} głosów. Usunąć?`)) return;
    await supabase.from('ankiety_odpowiedzi').delete().eq('opcja_id', opcjaId);
    await supabase.from('ankiety_opcje').delete().eq('id', opcjaId);
    setEditAnkietaForm(prev => ({ ...prev, opcje: prev.opcje.filter(o => o.id !== opcjaId) }));
    await loadTablicaData();
  };

  const nieprzeczytanePowiadomienia = powiadomienia.filter(p => !p.przeczytane).length;

  const archiwalneWatki = useMemo(() => {
    const now = new Date();
    return tablicaWatki.filter(w => {
      if (!w.archiwum_data || new Date(w.archiwum_data) > now) return false;
      const gd = w.grupa_docelowa;
      if (gd === 'ksieza' && currentUser?.typ !== 'ksiadz') return false;
      if (gd === 'ministranci' && currentUser?.typ !== 'ministrant') return false;
      return true;
    });
  }, [tablicaWatki, currentUser?.typ]);

  // ==================== RENDERY ====================

  const getMemberName = (id: string | null) => {
    if (!id) return '';
    if (id === currentUser?.id) return 'Ty';
    const member = members.find(m => m.profile_id === id);
    return member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '';
  };

  const isSluzbaAssignedToMe = (sluzba: Sluzba) => {
    return sluzba.funkcje.some(f => f.ministrant_id === currentUser?.id);
  };

  const getMyFunkcje = (sluzba: Sluzba) => {
    return sluzba.funkcje.filter(f => f.ministrant_id === currentUser?.id && f.aktywna);
  };

  const hasUnacceptedFunkcje = (sluzba: Sluzba) => {
    return sluzba.funkcje.some(f => f.ministrant_id === currentUser?.id && !f.zaakceptowana && f.aktywna);
  };

  // ==================== EKRAN ŁADOWANIA ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // ==================== EKRAN UZUPEŁNIANIA PROFILU (OAuth) ====================

  if (currentUser && showProfileCompletion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Church className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-center text-2xl">Dokończ rejestrację</CardTitle>
            <CardDescription className="text-center">
              Uzupełnij swoje dane, aby korzystać z aplikacji
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="completion-imie">Imię *</Label>
              <Input
                id="completion-imie"
                value={profileCompletionForm.imie}
                onChange={(e) => setProfileCompletionForm({ ...profileCompletionForm, imie: e.target.value })}
                placeholder="Jan"
              />
            </div>
            <div>
              <Label htmlFor="completion-nazwisko">Nazwisko</Label>
              <Input
                id="completion-nazwisko"
                value={profileCompletionForm.nazwisko}
                onChange={(e) => setProfileCompletionForm({ ...profileCompletionForm, nazwisko: e.target.value })}
                placeholder="Kowalski"
              />
            </div>
            <div>
              <Label htmlFor="completion-typ">Typ konta *</Label>
              <Select
                value={profileCompletionForm.typ}
                onValueChange={(v) => setProfileCompletionForm({ ...profileCompletionForm, typ: v as UserType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ministrant">Ministrant</SelectItem>
                  <SelectItem value="ksiadz">Ksiądz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="completion-terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-indigo-600"
              />
              <label htmlFor="completion-terms" className="text-sm text-gray-600 dark:text-gray-400">
                Akceptuję{' '}
                <a href="/regulamin" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">
                  regulamin
                </a>
                {' '}i{' '}
                <a href="/polityka-prywatnosci" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">
                  politykę prywatności
                </a>
              </label>
            </div>

            <Button onClick={handleCompleteProfile} className="w-full" disabled={!acceptedTerms}>
              Zapisz i kontynuuj
            </Button>

            <Button variant="ghost" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== EKRAN LOGOWANIA ====================

  if (!currentUser) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ background: '#050510' }}>
        {/* Tło dekoracyjne */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }} />
          <div className="absolute top-[10%] right-[15%] w-1 h-1 bg-amber-400/30 rounded-full" />
          <div className="absolute top-[25%] left-[20%] w-0.5 h-0.5 bg-amber-400/20 rounded-full" />
          <div className="absolute bottom-[30%] left-[10%] w-1.5 h-1.5 bg-amber-400/15 rounded-full" />
        </div>

        <div className="w-full max-w-[420px] relative z-10">
          {/* Logo i nagłówek */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg, #d4a853 0%, #b8912e 100%)', boxShadow: '0 8px 32px rgba(212,168,83,0.3)' }}>
              <Church className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">
              {authMode === 'login' && 'Witaj ponownie'}
              {authMode === 'register' && 'Dołącz do nas'}
              {authMode === 'forgot' && 'Resetowanie hasła'}
              {authMode === 'reset-sent' && 'Sprawdź skrzynkę'}
            </h1>
            <p className="text-slate-400 text-sm">
              {authMode === 'login' && 'Zaloguj się do swojego konta'}
              {authMode === 'register' && 'Utwórz nowe konto w aplikacji'}
              {authMode === 'forgot' && 'Wyślemy Ci link do zresetowania hasła'}
              {authMode === 'reset-sent' && 'Link do resetowania hasła został wysłany'}
            </p>
          </div>

          {/* Karta formularza */}
          <div className="rounded-2xl border border-white/[0.06] p-6 sm:p-8" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Błąd ogólny */}
            {authErrors.general && (
              <div className="flex items-start gap-3 p-3 rounded-xl mb-5 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-red-400" />
                </div>
                <p className="text-sm text-red-300 leading-relaxed">{authErrors.general}</p>
              </div>
            )}

            {/* ===== EKRAN: LINK WYSŁANY ===== */}
            {authMode === 'reset-sent' ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <Mail className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-slate-300 text-sm mb-1">Wiadomość została wysłana na adres:</p>
                <p className="text-amber-400 font-medium mb-6">{email}</p>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Kliknij link w wiadomości e-mail, aby ustawić nowe hasło. Jeśli nie widzisz wiadomości, sprawdź folder spam.
                </p>
                <button
                  onClick={() => { setAuthMode('login'); setIsLogin(true); setAuthErrors({}); }}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Wróć do logowania
                </button>
              </div>
            ) : authMode === 'forgot' ? (
              /* ===== EKRAN: RESETOWANIE HASŁA ===== */
              <div className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-2">Adres e-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setAuthErrors(prev => ({ ...prev, email: undefined })); }}
                      placeholder="twoj@email.pl"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                        authErrors.email
                          ? 'border border-red-500/50 bg-red-500/5 focus:border-red-400/70 focus:ring-1 focus:ring-red-400/20'
                          : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10'
                      }`}
                    />
                  </div>
                  {authErrors.email && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.email}</p>}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #d4a853 0%, #b8912e 100%)', boxShadow: '0 4px 16px rgba(212,168,83,0.25)' }}
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Wyślij link resetujący
                </button>

                <div className="text-center pt-1">
                  <button
                    onClick={() => { setAuthMode('login'); setIsLogin(true); setAuthErrors({}); }}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Wróć do logowania
                  </button>
                </div>
              </div>
            ) : (
              /* ===== EKRAN: LOGOWANIE / REJESTRACJA ===== */
              <div className="space-y-4">
                {/* E-mail */}
                <div>
                  <label htmlFor="auth-email" className="block text-sm font-medium text-slate-300 mb-2">Adres e-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setAuthErrors(prev => ({ ...prev, email: undefined })); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                      placeholder="twoj@email.pl"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                        authErrors.email
                          ? 'border border-red-500/50 bg-red-500/5 focus:border-red-400/70 focus:ring-1 focus:ring-red-400/20'
                          : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10'
                      }`}
                    />
                  </div>
                  {authErrors.email && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.email}</p>}
                </div>

                {/* Hasło */}
                <div>
                  <label htmlFor="auth-password" className="block text-sm font-medium text-slate-300 mb-2">Hasło</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setAuthErrors(prev => ({ ...prev, password: undefined })); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                        authErrors.password
                          ? 'border border-red-500/50 bg-red-500/5 focus:border-red-400/70 focus:ring-1 focus:ring-red-400/20'
                          : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {authErrors.password && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.password}</p>}
                </div>

                {/* Link "Nie pamiętasz hasła?" - tylko przy logowaniu */}
                {isLogin && (
                  <div className="text-right -mt-1">
                    <button
                      onClick={() => { setAuthMode('forgot'); setAuthErrors({}); }}
                      className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                    >
                      Nie pamiętasz hasła?
                    </button>
                  </div>
                )}

                {/* Pola rejestracji */}
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="auth-imie" className="block text-sm font-medium text-slate-300 mb-2">Imię</label>
                        <input
                          id="auth-imie"
                          value={imie}
                          onChange={(e) => { setImie(e.target.value); setAuthErrors(prev => ({ ...prev, imie: undefined })); }}
                          placeholder="Jan"
                          className={`w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                            authErrors.imie
                              ? 'border border-red-500/50 bg-red-500/5 focus:border-red-400/70 focus:ring-1 focus:ring-red-400/20'
                              : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10'
                          }`}
                        />
                        {authErrors.imie && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.imie}</p>}
                      </div>
                      <div>
                        <label htmlFor="auth-nazwisko" className="block text-sm font-medium text-slate-300 mb-2">Nazwisko</label>
                        <input
                          id="auth-nazwisko"
                          value={nazwisko}
                          onChange={(e) => { setNazwisko(e.target.value); setAuthErrors(prev => ({ ...prev, nazwisko: undefined })); }}
                          placeholder="Kowalski"
                          className={`w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                            authErrors.nazwisko
                              ? 'border border-red-500/50 bg-red-500/5 focus:border-red-400/70 focus:ring-1 focus:ring-red-400/20'
                              : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10'
                          }`}
                        />
                        {authErrors.nazwisko && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.nazwisko}</p>}
                      </div>
                    </div>

                    {/* Typ konta */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Typ konta</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setUserType('ministrant'); setDiecezja(''); setDiecezjaSearch(''); setAuthErrors(prev => ({ ...prev, diecezja: undefined })); }}
                          className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            userType === 'ministrant'
                              ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15] hover:text-slate-300'
                          }`}
                        >
                          <Users className="w-5 h-5 mx-auto mb-1.5" />
                          Ministrant
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserType('ksiadz')}
                          className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            userType === 'ksiadz'
                              ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15] hover:text-slate-300'
                          }`}
                        >
                          <Church className="w-5 h-5 mx-auto mb-1.5" />
                          Ksiądz
                        </button>
                      </div>
                    </div>

                    {/* Diecezja — tylko dla księdza */}
                    {userType === 'ksiadz' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Diecezja</label>
                        <div className="relative" ref={diecezjaRef}>
                          <button
                            type="button"
                            onClick={() => setDiecezjaOpen(!diecezjaOpen)}
                            className={`w-full px-4 py-3 rounded-xl text-sm text-left outline-none transition-all duration-200 flex items-center justify-between ${
                              authErrors.diecezja
                                ? 'border border-red-500/50 bg-red-500/5'
                                : 'border border-white/[0.08] bg-white/[0.03]'
                            } ${diecezja ? 'text-slate-200' : 'text-slate-500'}`}
                          >
                            <span className="truncate">{diecezja || 'Wybierz diecezję...'}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 ml-2 transition-transform duration-200 ${diecezjaOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {diecezjaOpen && (
                            <div
                              className="absolute z-50 bottom-full left-0 right-0 mb-2 rounded-xl border border-white/[0.1] overflow-hidden"
                              style={{ background: '#0f0f1e', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                            >
                              {/* Pole wyszukiwania */}
                              <div className="p-2 border-b border-white/[0.06]">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                  <input
                                    type="text"
                                    value={diecezjaSearch}
                                    onChange={(e) => setDiecezjaSearch(e.target.value)}
                                    placeholder="Szukaj diecezji..."
                                    autoFocus
                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.06] outline-none focus:border-amber-400/30"
                                  />
                                </div>
                              </div>

                              {/* Lista diecezji */}
                              <div className="max-h-[200px] overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,168,83,0.3) transparent' }}>
                                {DIECEZJE_POLSKIE
                                  .filter(d => d.toLowerCase().includes(diecezjaSearch.toLowerCase()))
                                  .map(d => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => {
                                        setDiecezja(d);
                                        setDiecezjaOpen(false);
                                        setDiecezjaSearch('');
                                        setAuthErrors(prev => ({ ...prev, diecezja: undefined }));
                                      }}
                                      className={`w-full px-4 py-2.5 text-xs text-left transition-colors flex items-center gap-2 ${
                                        d === diecezja
                                          ? 'bg-amber-400/10 text-amber-300'
                                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                                      }`}
                                    >
                                      {d === diecezja && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                                      <span className={d === diecezja ? '' : 'ml-5'}>{d}</span>
                                    </button>
                                  ))
                                }
                                {DIECEZJE_POLSKIE.filter(d => d.toLowerCase().includes(diecezjaSearch.toLowerCase())).length === 0 && (
                                  <p className="px-4 py-3 text-xs text-slate-600 text-center">Nie znaleziono diecezji</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {authErrors.diecezja && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.diecezja}</p>}
                      </div>
                    )}

                    {/* Regulamin */}
                    <div className="flex items-start gap-3 pt-1">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          id="terms-auth"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <label
                          htmlFor="terms-auth"
                          className="w-[18px] h-[18px] rounded border border-white/[0.15] bg-white/[0.03] flex items-center justify-center cursor-pointer transition-all peer-checked:bg-amber-500/20 peer-checked:border-amber-400/50"
                        >
                          {acceptedTerms && <Check className="w-3 h-3 text-amber-400" />}
                        </label>
                      </div>
                      <label htmlFor="terms-auth" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                        Akceptuję{' '}
                        <a href="/regulamin" target="_blank" className="text-amber-400/70 hover:text-amber-400 underline underline-offset-2 transition-colors">regulamin</a>
                        {' '}i{' '}
                        <a href="/polityka-prywatnosci" target="_blank" className="text-amber-400/70 hover:text-amber-400 underline underline-offset-2 transition-colors">politykę prywatności</a>
                      </label>
                    </div>
                  </>
                )}

                {/* Przycisk główny */}
                <button
                  onClick={handleAuth}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 hover:brightness-110 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #d4a853 0%, #b8912e 100%)', boxShadow: '0 4px 16px rgba(212,168,83,0.25)' }}
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLogin ? 'Zaloguj się' : 'Utwórz konto'}
                </button>

                {/* Separator */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                </div>

                {/* Przełączanie logowanie/rejestracja */}
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    {isLogin ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}
                    {' '}
                    <button
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setAuthMode(isLogin ? 'register' : 'login');
                        setAcceptedTerms(false);
                        setAuthErrors({});
                      }}
                      className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== EKRAN BRAKU PARAFII ====================

  if (!currentUser.parafia_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 min-w-0">
              <Church className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold truncate">Witaj, {currentUser.imie} {currentUser.nazwisko || ''}!</h1>
              <button
                onClick={() => {
                  setEditProfilForm({ imie: currentUser.imie, nazwisko: currentUser.nazwisko || '', email: currentUser.email || '' });
                  setShowEditProfilModal(true);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
                title="Edytuj profil"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Wyloguj</span>
            </Button>
          </div>

          {currentUser.typ !== 'ksiadz' && zaproszenia.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Zaproszenia do parafii</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {zaproszenia.map((z) => (
                  <div key={z.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{z.parafia_nazwa}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">od {z.admin_email}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button onClick={() => handleAcceptInvite(z)} size="sm" className="flex-1 sm:flex-none">
                        <Check className="w-4 h-4 mr-1" />
                        Akceptuj
                      </Button>
                      <Button onClick={() => handleRejectInvite(z)} variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <X className="w-4 h-4 mr-1" />
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className={`grid ${currentUser.typ === 'ksiadz' ? '' : 'md:grid-cols-2'} gap-6`}>
            {currentUser.typ === 'ksiadz' && (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowParafiaModal(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Utwórz parafię
                  </CardTitle>
                  <CardDescription>
                    Załóż nową parafię i zaproś ministrantów
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {currentUser.typ !== 'ksiadz' && (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowJoinModal(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Dołącz do parafii
                  </CardTitle>
                  <CardDescription>
                    Wpisz kod zaproszenia od księdza
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>

        {/* Modal tworzenia parafii */}
        <Dialog open={showParafiaModal} onOpenChange={setShowParafiaModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Utwórz nową parafię</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nazwa parafii *</Label>
                <Input
                  value={parafiaNazwa}
                  onChange={(e) => setParafiaNazwa(e.target.value)}
                  placeholder="Parafia św. Jana"
                />
              </div>
              <div>
                <Label>Miasto *</Label>
                <Input
                  value={parafiaMiasto}
                  onChange={(e) => setParafiaMiasto(e.target.value)}
                  placeholder="Warszawa"
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Input
                  value={parafiaAdres}
                  onChange={(e) => setParafiaAdres(e.target.value)}
                  placeholder="ul. Przykładowa 1"
                />
              </div>
              <Button onClick={handleCreateParafia} className="w-full">
                Utwórz parafię
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal dołączania po kodzie */}
        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dołącz do parafii</DialogTitle>
              <DialogDescription>
                Wpisz 8-znakowy kod zaproszenia otrzymany od księdza
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kod zaproszenia</Label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC12345"
                  maxLength={8}
                />
              </div>
              <Button onClick={handleJoinByCode} className="w-full">
                Dołącz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ==================== GŁÓWNY INTERFEJS ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2.5 py-2 sm:px-4 sm:py-3">
          {/* Linia 1: nazwa parafii + tryb nocny + wyloguj */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => { if (!editingParafiaNazwa) { setActiveTab('tablica'); setSelectedWatek(null); setTablicaWiadomosci([]); setEditingAnkietaId(null); } }}>
              <Church className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                {editingParafiaNazwa ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={parafiaNazwaInput}
                      onChange={(e) => setParafiaNazwaInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveParafiaNazwa(); if (e.key === 'Escape') setEditingParafiaNazwa(false); }}
                      className="h-8 text-sm sm:text-lg font-bold w-36 sm:w-60"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 dark:text-green-400" onClick={saveParafiaNazwa}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400" onClick={() => setEditingParafiaNazwa(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-xl font-bold">{currentParafia?.nazwa}</h1>
                    {currentUser.typ === 'ksiadz' && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={(e) => { e.stopPropagation(); setParafiaNazwaInput(currentParafia?.nazwa || ''); setEditingParafiaNazwa(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-300">{currentUser.imie} {currentUser.nazwisko || ''}</p>
                  <button
                    onClick={() => {
                      setEditProfilForm({ imie: currentUser.imie, nazwisko: currentUser.nazwisko || '', email: currentUser.email || '' });
                      setShowEditProfilModal(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
                    title="Edytuj profil"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 sm:h-9 px-2 sm:px-3">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Wyloguj</span>
              </Button>
            </div>
          </div>

          {/* Linia 2: kod zaproszenia + kopiuj + QR */}
          {currentUser.typ === 'ksiadz' && currentParafia && (
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">Kod zaproszenia:</span>
              <code className="text-xs md:text-sm font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded tracking-wider">
                {currentParafia.kod_zaproszenia}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(currentParafia.kod_zaproszenia);
                  alert('Kod skopiowany!');
                }}
                title="Kopiuj kod"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setShowQrModal(true)}
                title="Pokaż kod QR"
              >
                <QrCode className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Modal QR Code */}
          <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
            <DialogContent className="max-w-sm text-center">
              <DialogHeader>
                <DialogTitle>Kod QR zaproszenia</DialogTitle>
                <DialogDescription>
                  Ministrant skanuje ten kod, aby dołączyć do parafii
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG
                    value={currentParafia?.kod_zaproszenia || ''}
                    size={200}
                    level="H"
                  />
                </div>
                <code className="text-2xl font-bold tracking-widest">{currentParafia?.kod_zaproszenia}</code>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Belka koloru liturgicznego */}
        {dzisLiturgiczny && (() => {
          const KOLOR_BELKI: Record<string, { bg: string; text: string }> = {
            zielony: { bg: 'bg-green-600', text: 'text-white' },
            bialy: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-gray-800 dark:text-gray-100' },
            czerwony: { bg: 'bg-red-600', text: 'text-white' },
            fioletowy: { bg: 'bg-purple-700', text: 'text-white' },
            rozowy: { bg: 'bg-pink-400', text: 'text-white' },
          };
          const k = KOLOR_BELKI[dzisLiturgiczny.kolor] || KOLOR_BELKI.zielony;
          return (
            <div className={`${k.bg} ${k.text} px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2`}>
              <span className="font-semibold">{KOLORY_LITURGICZNE[dzisLiturgiczny.kolor]?.nazwa || dzisLiturgiczny.kolor}</span>
              <span className="opacity-75">|</span>
              <span className="truncate">{dzisLiturgiczny.nazwa || dzisLiturgiczny.okres}</span>
            </div>
          );
        })()}
      </div>

      {/* Nawigacja */}
      <div className="max-w-7xl mx-auto px-2.5 py-3 sm:px-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {(() => {
            const litColor = dzisLiturgiczny ? ({
              zielony: { list: 'bg-white dark:bg-gray-900', trigger: 'text-green-700 dark:text-green-400 data-[state=active]:text-green-800 dark:data-[state=active]:text-green-300 [&_svg]:text-green-600 dark:[&_svg]:text-green-400' },
              bialy: { list: 'bg-white dark:bg-gray-900', trigger: 'text-amber-700 dark:text-amber-400 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400' },
              czerwony: { list: 'bg-white dark:bg-gray-900', trigger: 'text-red-700 dark:text-red-400 data-[state=active]:text-red-800 dark:data-[state=active]:text-red-300 [&_svg]:text-red-600 dark:[&_svg]:text-red-400' },
              fioletowy: { list: 'bg-white dark:bg-gray-900', trigger: 'text-purple-700 dark:text-purple-400 data-[state=active]:text-purple-800 dark:data-[state=active]:text-purple-300 [&_svg]:text-purple-600 dark:[&_svg]:text-purple-400' },
              rozowy: { list: 'bg-white dark:bg-gray-900', trigger: 'text-pink-600 dark:text-pink-400 data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-300 [&_svg]:text-pink-500 dark:[&_svg]:text-pink-400' },
            } as Record<string, { list: string; trigger: string }>)[dzisLiturgiczny.kolor] || { list: 'bg-white dark:bg-gray-900', trigger: 'text-green-700 dark:text-green-400' } : { list: 'bg-muted', trigger: '' };
            const tc = litColor.trigger;
            return (
          <TabsList className={`grid w-full grid-cols-4 md:grid-cols-8 mb-3 sm:mb-6 ${litColor.list}`}>
            <TabsTrigger value="tablica" className={`relative ${tc}`} onClick={() => { setSelectedWatek(null); setTablicaWiadomosci([]); setEditingAnkietaId(null); }}>
              <MessageSquare className="w-4 h-4 sm:mr-2" />
              Aktualności
              {nieprzeczytanePowiadomienia > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {nieprzeczytanePowiadomienia}
                </span>
              )}
            </TabsTrigger>
            {currentUser.typ === 'ksiadz' && (
              <TabsTrigger value="ministranci" className={tc}>
                <Users className="w-4 h-4 sm:mr-2" />
                Ministranci
                <span className="ml-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-1.5">{members.filter(m => m.typ === 'ministrant').length}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="ranking" className={`${tc} relative`}>
              <Trophy className="w-4 h-4 sm:mr-2" />
              Ranking
              {currentUser.typ === 'ksiadz' && obecnosci.filter(o => o.status === 'oczekuje').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {obecnosci.filter(o => o.status === 'oczekuje').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sluzby" className={tc}>
              <Star className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Wydarzenia</span><span className="sm:hidden">Wydarzenia</span>
              {sluzby.length > 0 && <span className="ml-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full px-1.5">{sluzby.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="kalendarz" className={tc}>
              <Calendar className="w-4 h-4 sm:mr-2" />
              Kalendarz
            </TabsTrigger>
            <TabsTrigger value="poslugi" className={tc}>
              <HandHelping className="w-4 h-4 sm:mr-2" />
              Posługi
            </TabsTrigger>
            <TabsTrigger value="modlitwy" className={tc}>
              <BookOpen className="w-4 h-4 sm:mr-2" />
              Modlitwy
            </TabsTrigger>
            <TabsTrigger value="wskazowki" className={tc}>
              <Lightbulb className="w-4 h-4 sm:mr-2" />
              Wskazówki
            </TabsTrigger>
          </TabsList>
            );
          })()}

          {/* ==================== PANEL TABLICA OGŁOSZEŃ ==================== */}
          <TabsContent value="tablica">
            <div className="space-y-4">
              {/* Nagłówek */}
              {selectedWatek ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedWatek(null); setTablicaWiadomosci([]); setEditingAnkietaId(null); }}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg sm:text-xl font-bold truncate">
                    {selectedWatek.kategoria === 'ogłoszenie' ? 'Ogłoszenie' : selectedWatek.tytul}
                  </h2>
                </div>
              ) : (
                <>
                  {(() => {
                    const litGradient: Record<string, { gradient: string; shadow: string; subtitle: string }> = {
                      zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20', subtitle: 'text-emerald-200' },
                      bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20', subtitle: 'text-amber-100' },
                      czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20', subtitle: 'text-red-200' },
                      fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20', subtitle: 'text-purple-200' },
                      rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20', subtitle: 'text-pink-200' },
                    };
                    const litStyle = litGradient[dzisLiturgiczny?.kolor || 'zielony'] || litGradient.zielony;
                    return (
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${litStyle.gradient} p-4 sm:p-5 shadow-lg ${litStyle.shadow}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">📢</div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Aktualności</h2>
                          <p className={`${litStyle.subtitle} text-xs sm:text-sm`}>{dzisLiturgiczny ? `${dzisLiturgiczny.nazwa || dzisLiturgiczny.okres}` : 'Ogłoszenia, dyskusje i ankiety'}</p>
                        </div>
                      </div>
                      {currentUser.typ === 'ministrant' && (
                        <Button size="sm" onClick={() => {
                          setNewWatekForm({ tytul: '', tresc: '', kategoria: 'dyskusja', grupa_docelowa: 'wszyscy', archiwum_data: '' });
                          setShowNewWatekModal(true);
                        }} className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-none">
                          <Plus className="w-4 h-4 mr-1" />
                          Dyskusja
                        </Button>
                      )}
                    </div>
                  </div>
                    ); })()}
                  {currentUser.typ === 'ksiadz' && (
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40" onClick={() => setShowNewAnkietaModal(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Dodaj ankietę
                      </Button>
                      <Button size="sm" variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40" onClick={() => {
                        setNewWatekForm({ tytul: '', tresc: '', kategoria: 'ogłoszenie', grupa_docelowa: 'wszyscy', archiwum_data: '' });
                        setShowNewWatekModal(true);
                      }}>
                        <Plus className="w-4 h-4 mr-1" />
                        Ogłoszenie
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => {
                        setNewWatekForm({ tytul: '', tresc: '', kategoria: 'dyskusja', grupa_docelowa: 'wszyscy', archiwum_data: '' });
                        setShowNewWatekModal(true);
                      }}>
                        <Plus className="w-4 h-4 mr-1" />
                        Dyskusja
                      </Button>
                      <Button size="sm" variant={showArchiwum ? 'default' : 'ghost'} onClick={() => setShowArchiwum(!showArchiwum)}>
                        <Book className="w-4 h-4 mr-1" />
                        Archiwum ({archiwalneWatki.length})
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* === ARCHIWUM === */}
              {!selectedWatek && showArchiwum && currentUser.typ === 'ksiadz' && (
                <div className="space-y-3">
                  {archiwalneWatki.length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Book className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Archiwum jest puste</p>
                      </CardContent>
                    </Card>
                  )}
                  {archiwalneWatki.map(watek => {
                    const autorWatku = members.find(m => m.profile_id === watek.autor_id);
                    const dniDoUsuniecia = watek.archiwum_data ? Math.max(0, Math.ceil((new Date(new Date(watek.archiwum_data).getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

                    return (
                      <Card
                        key={watek.id}
                        className="cursor-pointer hover:shadow-md transition-shadow opacity-60 hover:opacity-80 border-gray-300 dark:border-gray-600"
                        onClick={() => {
                          if (watek.kategoria === 'ogłoszenie') { setPreviewOgloszenie(watek); return; }
                          setSelectedWatek(watek);
                          loadWatekWiadomosci(watek.id);
                          const watekPowiadomienia = powiadomienia.filter(p => !p.przeczytane && p.odniesienie_id === watek.id);
                          watekPowiadomienia.forEach(p => markPowiadomienieRead(p.id));
                        }}
                      >
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-100 dark:bg-gray-800 text-gray-500">
                                  {watek.kategoria === 'ankieta' ? 'Ankieta' : watek.kategoria === 'ogłoszenie' ? 'Ogłoszenie' : 'Dyskusja'}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 dark:bg-orange-900/20 text-orange-500">
                                  Usunięcie za {dniDoUsuniecia} dni
                                </Badge>
                              </div>
                              <p className="font-semibold text-sm truncate">{watek.kategoria === 'ogłoszenie' ? (watek.tresc?.replace(/<[^>]+>/g, '').substring(0, 80) || watek.tytul) : watek.tytul}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {autorWatku ? `${autorWatku.imie} ${autorWatku.nazwisko || ''}`.trim() : 'Ksiądz'} · {new Date(watek.created_at).toLocaleDateString('pl')}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  onClick={(e) => { e.stopPropagation(); restoreWatek(watek.id); }}>
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Przywróć
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={(e) => { e.stopPropagation(); permanentDeleteWatek(watek.id); }}>
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Usuń trwale
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Baner informacyjny */}
              {!selectedWatek && showInfoBanner && (
                <Card className="border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Church className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-indigo-900 dark:text-indigo-200 space-y-1">
                          <p className="font-semibold">{linkifyEmails(infoBanerTresc.tytul || 'Witaj w aplikacji dla ministrantów!')}</p>
                          <p className="text-xs text-indigo-700 dark:text-indigo-300">
                            {linkifyEmails(infoBanerTresc.opis || 'Ogłoszenia i ankiety od księdza \u00b7 Wydarzenia \u00b7 Ranking i punkty \u00b7 Obecności \u00b7 Kalendarz liturgiczny')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex-shrink-0" onClick={() => setShowInfoBanner(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Powiadomienia wymagające akcji */}
              {!selectedWatek && powiadomienia.filter(p => p.wymaga_akcji && !p.przeczytane).length > 0 && (
                <Card className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Wymagane odpowiedzi ({powiadomienia.filter(p => p.wymaga_akcji && !p.przeczytane).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {powiadomienia.filter(p => p.wymaga_akcji && !p.przeczytane).map(p => {
                      const ankieta = ankiety.find(a => a.id === p.odniesienie_id);
                      const watek = ankieta ? tablicaWatki.find(w => w.id === ankieta.watek_id) : null;
                      return (
                        <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-100 dark:border-red-800">
                          <div>
                            <p className="font-medium text-sm">{p.tytul}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.tresc}</p>
                          </div>
                          {watek && (
                            <Button size="sm" variant="destructive" onClick={() => {
                              setSelectedWatek(watek);
                              loadWatekWiadomosci(watek.id);
                            }}>
                              Odpowiedz
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* === WIDOK WĄTKU (szczegóły) === */}
              {selectedWatek && (() => {
                const watekAnkieta = ankiety.find(a => a.watek_id === selectedWatek.id);
                const watekOpcje = watekAnkieta ? ankietyOpcje.filter(o => o.ankieta_id === watekAnkieta.id).sort((a, b) => a.kolejnosc - b.kolejnosc) : [];
                const mojeOdpowiedzi = watekAnkieta ? ankietyOdpowiedzi.filter(o => o.ankieta_id === watekAnkieta.id && o.respondent_id === currentUser.id) : [];
                const wszystkieOdpowiedzi = watekAnkieta ? ankietyOdpowiedzi.filter(o => o.ankieta_id === watekAnkieta.id) : [];
                const autorWatku = members.find(m => m.profile_id === selectedWatek.autor_id);

                return (
                  <div className="space-y-4">
                    {/* Info o wątku */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={selectedWatek.kategoria === 'ogłoszenie' ? 'default' : selectedWatek.kategoria === 'ankieta' ? 'destructive' : 'secondary'}>
                                {selectedWatek.kategoria === 'ogłoszenie' ? 'Ogłoszenie' : selectedWatek.kategoria === 'ankieta' ? 'Ankieta' : 'Dyskusja'}
                              </Badge>
                              {selectedWatek.zamkniety && <LockKeyhole className="w-4 h-4 text-red-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Ważna do: {watekAnkieta?.termin ? new Date(watekAnkieta.termin).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'bez terminu'}
                            </p>
                          </div>
                          {currentUser.typ === 'ksiadz' && watekAnkieta && (
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 px-3 text-xs ${ukryjMinistrantow ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900'}`}
                                onClick={() => setUkryjMinistrantow(!ukryjMinistrantow)}
                              >
                                {ukryjMinistrantow ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                                {ukryjMinistrantow ? 'Pokaż ministrantów' : 'Ukryj ministrantów'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950 dark:hover:border-red-600"
                                onClick={() => deleteWatek(selectedWatek.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Usuń
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      {selectedWatek.tresc && (
                        <CardContent>
                          {renderTresc(selectedWatek.tresc || '')}
                        </CardContent>
                      )}
                    </Card>

                    {/* Ankieta */}
                    {watekAnkieta && (
                      <Card className="border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              {editingAnkietaId === watekAnkieta.id ? 'Edycja ankiety' : watekAnkieta.pytanie}
                            </CardTitle>
                            {currentUser.typ === 'ksiadz' && editingAnkietaId !== watekAnkieta.id && (
                              <Button variant="ghost" size="sm" title="Edytuj ankietę" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => startEditAnkieta(watekAnkieta)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            {watekAnkieta.obowiazkowa && <Badge variant="destructive" className="mr-2">Obowiązkowa</Badge>}
                            {!watekAnkieta.aktywna && <Badge variant="secondary" className="mr-2">Zamknięta</Badge>}
                            {watekAnkieta.wyniki_ukryte ? <Badge variant="outline" className="mr-2">Wyniki ukryte</Badge> : <Badge variant="outline" className="mr-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">Wyniki jawne</Badge>}
                            {watekAnkieta.termin && <>Termin: {new Date(watekAnkieta.termin).toLocaleDateString('pl-PL')}</>}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">

                          {/* === TRYB EDYCJI KSIĘDZA === */}
                          {currentUser.typ === 'ksiadz' && editingAnkietaId === watekAnkieta.id && (
                            <div className="space-y-4">
                              <div>
                                <Label>Pytanie</Label>
                                <Input
                                  value={editAnkietaForm.pytanie}
                                  onChange={(e) => setEditAnkietaForm({ ...editAnkietaForm, pytanie: e.target.value })}
                                />
                              </div>

                              <div>
                                <Label>Opcje odpowiedzi</Label>
                                <div className="space-y-2 mt-1">
                                  {editAnkietaForm.opcje.map((opcja, i) => (
                                    <div key={opcja.id} className="flex gap-2">
                                      <Input
                                        value={opcja.tresc}
                                        onChange={(e) => {
                                          const nowe = [...editAnkietaForm.opcje];
                                          nowe[i] = { ...nowe[i], tresc: e.target.value };
                                          setEditAnkietaForm({ ...editAnkietaForm, opcje: nowe });
                                        }}
                                      />
                                      {editAnkietaForm.opcje.length > 2 && (
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400" onClick={() => deleteAnkietaOpcja(opcja.id)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  {editAnkietaForm.noweOpcje.map((opcja, i) => (
                                    <div key={`new-${i}`} className="flex gap-2">
                                      <Input
                                        value={opcja}
                                        placeholder="Nowa opcja..."
                                        onChange={(e) => {
                                          const nowe = [...editAnkietaForm.noweOpcje];
                                          nowe[i] = e.target.value;
                                          setEditAnkietaForm({ ...editAnkietaForm, noweOpcje: nowe });
                                        }}
                                      />
                                      {editAnkietaForm.noweOpcje.length > 1 && (
                                        <Button variant="ghost" size="sm" onClick={() => {
                                          setEditAnkietaForm({ ...editAnkietaForm, noweOpcje: editAnkietaForm.noweOpcje.filter((_, idx) => idx !== i) });
                                        }}>
                                          <X className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button variant="outline" size="sm" onClick={() => setEditAnkietaForm({ ...editAnkietaForm, noweOpcje: [...editAnkietaForm.noweOpcje, ''] })}>
                                      <Plus className="w-4 h-4 mr-1" />
                                      Dodaj opcję
                                    </Button>
                                </div>
                              </div>

                              <div>
                                <Label>Termin (opcjonalnie)</Label>
                                <Input
                                  type="datetime-local"
                                  value={editAnkietaForm.termin}
                                  onChange={(e) => setEditAnkietaForm({ ...editAnkietaForm, termin: e.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" id="edit-obowiazkowa" checked={editAnkietaForm.obowiazkowa} onChange={(e) => setEditAnkietaForm({ ...editAnkietaForm, obowiazkowa: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
                                  <Label htmlFor="edit-obowiazkowa" className="font-normal text-sm">Obowiązkowa</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" id="edit-wyniki-ukryte" checked={editAnkietaForm.wyniki_ukryte} onChange={(e) => setEditAnkietaForm({ ...editAnkietaForm, wyniki_ukryte: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
                                  <Label htmlFor="edit-wyniki-ukryte" className="font-normal text-sm">Ukryj wyniki</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" id="edit-aktywna" checked={editAnkietaForm.aktywna} onChange={(e) => setEditAnkietaForm({ ...editAnkietaForm, aktywna: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
                                  <Label htmlFor="edit-aktywna" className="font-normal text-sm">Aktywna (przyjmuje głosy)</Label>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button onClick={saveEditAnkieta} className="flex-1">
                                  <Check className="w-4 h-4 mr-2" />
                                  Zapisz
                                </Button>
                                <Button variant="outline" onClick={() => setEditingAnkietaId(null)} className="flex-1">
                                  Anuluj
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* === WIDOK MINISTRANTA === */}
                          {currentUser.typ === 'ministrant' && (() => {
                            const juzOdpowiedzial = mojeOdpowiedzi.length > 0;
                            const pokazWyniki = juzOdpowiedzial && !watekAnkieta.wyniki_ukryte;
                            const totalMinistranci = members.filter(m => m.typ === 'ministrant').length;
                            const terminMinal = watekAnkieta.termin ? new Date(watekAnkieta.termin) < new Date() : false;

                            return (
                              <div className="space-y-2">
                                {terminMinal && (
                                  <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Termin odpowiedzi minął — głosowanie zamknięte</p>
                                  </div>
                                )}
                                {/* Przyciski głosowania */}
                                {watekOpcje.map(opcja => {
                                  const isSelected = mojeOdpowiedzi.some(o => o.opcja_id === opcja.id);
                                  const odpowiedziOpcji = wszystkieOdpowiedzi.filter(o => o.opcja_id === opcja.id);
                                  const count = odpowiedziOpcji.length;
                                  const pct = totalMinistranci > 0 ? Math.round((count / totalMinistranci) * 100) : 0;
                                  const osoby = odpowiedziOpcji.map(o => {
                                    const m = members.find(mb => mb.profile_id === o.respondent_id);
                                    return m ? `${m.imie} ${m.nazwisko || ''}`.trim() : '?';
                                  });
                                  const isTak = opcja.tresc.toLowerCase() === 'tak';
                                  const isNie = opcja.tresc.toLowerCase() === 'nie';
                                  const barColor = isTak ? 'bg-green-500 dark:bg-green-400' : isNie ? 'bg-red-500 dark:bg-red-400' : 'bg-indigo-500 dark:bg-indigo-400';
                                  const selectedClass = isSelected
                                    ? isTak ? 'bg-green-600 hover:bg-green-700 text-white' : isNie ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                                    : isTak ? 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950' : isNie ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950' : '';

                                  return (
                                    <div key={opcja.id} className="space-y-1">
                                      <Button
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={`w-full justify-between ${selectedClass}`}
                                        onClick={() => odpowiedzAnkieta(watekAnkieta.id, opcja.id)}
                                        disabled={!watekAnkieta.aktywna || terminMinal}
                                      >
                                        <span className="flex items-center gap-2">
                                          {isSelected && <Check className="w-4 h-4" />}
                                          {opcja.tresc}
                                        </span>
                                        {pokazWyniki && <span className="text-xs opacity-70">{count} ({pct}%)</span>}
                                      </Button>
                                      {pokazWyniki && (
                                        <>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                          </div>
                                          {osoby.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {osoby.map((imie, i) => (
                                                <Badge key={i} variant="secondary" className={isTak ? 'text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : isNie ? 'text-xs bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' : 'text-xs'}>{imie}</Badge>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Przycisk Akceptuj */}
                                {juzOdpowiedzial && (
                                  <Button
                                    className="w-full mt-2 bg-green-600 hover:bg-green-700"
                                    onClick={() => { setSelectedWatek(null); setTablicaWiadomosci([]); setEditingAnkietaId(null); }}
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Akceptuj
                                  </Button>
                                )}
                              </div>
                            );
                          })()}

                          {/* === WIDOK KSIĘDZA — wyniki (gdy nie edytuje) === */}
                          {currentUser.typ === 'ksiadz' && editingAnkietaId !== watekAnkieta.id && (() => {
                            const totalMinistranci = members.filter(m => m.typ === 'ministrant').length;
                            const respondenci = new Set(wszystkieOdpowiedzi.map(o => o.respondent_id));
                            const brakOdpowiedzi = members.filter(m => m.typ === 'ministrant' && !respondenci.has(m.profile_id));
                            const zmienione = wszystkieOdpowiedzi.filter(o => o.zmieniona);

                            return (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                  Odpowiedzi: {respondenci.size} / {totalMinistranci}
                                  {zmienione.length > 0 && <span className="text-orange-500 ml-2">({zmienione.length} {zmienione.length === 1 ? 'zmiana' : 'zmian'})</span>}
                                </p>

                                {watekOpcje.map(opcja => {
                                  const odpowiedziOpcji = wszystkieOdpowiedzi.filter(o => o.opcja_id === opcja.id);
                                  const count = odpowiedziOpcji.length;
                                  const pct = totalMinistranci > 0 ? Math.round((count / totalMinistranci) * 100) : 0;
                                  const isTak = opcja.tresc.toLowerCase() === 'tak';
                                  const isNie = opcja.tresc.toLowerCase() === 'nie';
                                  const barColor = isTak ? 'bg-green-500 dark:bg-green-400' : isNie ? 'bg-red-500 dark:bg-red-400' : 'bg-indigo-500 dark:bg-indigo-400';
                                  const labelColor = isTak ? 'text-green-700 dark:text-green-300' : isNie ? 'text-red-700 dark:text-red-300' : '';
                                  const countColor = isTak ? 'text-green-600 dark:text-green-400' : isNie ? 'text-red-600 dark:text-red-400' : '';
                                  const badgeClass = isTak ? 'text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : isNie ? 'text-xs bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'text-xs';

                                  return (
                                    <div key={opcja.id} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className={`text-sm font-semibold ${labelColor}`}>{opcja.tresc}</span>
                                        <span className={`text-sm font-bold ${countColor}`}>{count} ({pct}%)</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                        <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                      </div>
                                      {!ukryjMinistrantow && odpowiedziOpcji.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {odpowiedziOpcji.map((odp, i) => {
                                            const m = members.find(mb => mb.profile_id === odp.respondent_id);
                                            const imie = m ? `${m.imie} ${m.nazwisko || ''}`.trim() : '?';
                                            return odp.zmieniona ? (
                                              <Badge key={i} variant="secondary" className="text-xs border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" title={`Zmieniona ${odp.zmieniona_at ? new Date(odp.zmieniona_at).toLocaleString('pl-PL') : ''}`}>
                                                {imie} <span className="ml-1 text-[10px]">zmieniona</span>
                                              </Badge>
                                            ) : (
                                              <Badge key={i} variant="secondary" className={badgeClass}>{imie}</Badge>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {!ukryjMinistrantow && brakOdpowiedzi.length > 0 && (
                                  <div className="pt-3 border-t">
                                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Brak odpowiedzi:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {brakOdpowiedzi.map(m => (
                                        <Badge key={m.id} variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-700">{m.imie} {m.nazwisko || ''}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {!ukryjMinistrantow && brakOdpowiedzi.length === 0 && (
                                  <p className="text-xs text-green-600 dark:text-green-400 pt-2">Wszyscy odpowiedzieli!</p>
                                )}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}

                    {/* Wiadomości w wątku */}
                    <div className="space-y-2">
                      {tablicaWiadomosci.length > 0 && (
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Komentarze ({tablicaWiadomosci.length})</p>
                      )}
                      {tablicaWiadomosci.map(msg => {
                        const autor = members.find(m => m.profile_id === msg.autor_id);
                        return (
                          <div key={msg.id} className={`p-3 rounded-lg ${msg.autor_id === currentUser.id ? 'bg-indigo-100 dark:bg-indigo-900/30 ml-4 sm:ml-8' : 'bg-white dark:bg-gray-800 border mr-4 sm:mr-8'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">{msg.autor_id === currentUser.id ? 'Ty' : (autor ? `${autor.imie} ${autor.nazwisko || ''}`.trim() : 'Ksiądz')}</span>
                              <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm">{msg.tresc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pole do pisania wiadomości */}
                    {!selectedWatek.zamkniety && (
                      <div className="relative">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 flex-shrink-0" onClick={() => setShowEmojiPicker(showEmojiPicker === 'wiadomosc' ? null : 'wiadomosc')}>
                            <Smile className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Input
                            placeholder="Napisz komentarz..."
                            value={newWiadomoscTresc}
                            onChange={(e) => setNewWiadomoscTresc(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendWiadomosc(); } }}
                          />
                          <Button onClick={sendWiadomosc} disabled={!newWiadomoscTresc.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                        {showEmojiPicker === 'wiadomosc' && (
                          <div className="absolute bottom-12 left-0 z-50">
                            <Picker data={data} locale="pl" theme={darkMode ? 'dark' : 'light'} onEmojiSelect={(emoji: { native: string }) => { setNewWiadomoscTresc(prev => prev + emoji.native); setShowEmojiPicker(null); }} />
                          </div>
                        )}
                      </div>
                    )}
                    {selectedWatek.zamkniety && (
                      <p className="text-center text-sm text-gray-400 py-2">Wątek zamknięty — brak możliwości komentowania</p>
                    )}
                  </div>
                );
              })()}

              {/* === LISTA WĄTKÓW === */}
              {!selectedWatek && (() => {
                const now = new Date();
                const aktywneWatki = tablicaWatki.filter(w => {
                  const gd = w.grupa_docelowa;
                  if (gd === 'ksieza' && currentUser.typ !== 'ksiadz') return false;
                  if (gd === 'ministranci' && currentUser.typ !== 'ministrant') return false;
                  if (w.archiwum_data && new Date(w.archiwum_data) <= now) return false;
                  return true;
                });

                return (
                <div className="space-y-3">
                  {aktywneWatki.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Brak ogłoszeń</p>
                        {currentUser.typ === 'ksiadz' && <p className="text-sm text-gray-400 mt-1">Utwórz pierwszy wątek lub ankietę!</p>}
                      </CardContent>
                    </Card>
                  ) : (
                    aktywneWatki.map(watek => {
                      const watekAnkieta = ankiety.find(a => a.watek_id === watek.id);
                      const autorWatku = members.find(m => m.profile_id === watek.autor_id);
                      const wiadomosciCount = 0; // Policzenie wiadomości wymagałoby joina — uproszczenie
                      const mojaOdp = watekAnkieta ? ankietyOdpowiedzi.some(o => o.ankieta_id === watekAnkieta.id && o.respondent_id === currentUser.id) : false;

                      return (
                        <Card
                          key={watek.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${watek.kategoria === 'ankieta' ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : watek.kategoria === 'ogłoszenie' ? 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20' : watek.przypiety ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : ''}`}
                          onClick={() => {
                            if ((watek.kategoria === 'ogłoszenie' || watek.kategoria === 'dyskusja') && currentUser.typ === 'ksiadz') {
                              setPreviewOgloszenie(watek);
                              return;
                            }
                            setSelectedWatek(watek);
                            loadWatekWiadomosci(watek.id);
                            // Oznacz powiadomienia tego wątku jako przeczytane
                            const watekPowiadomienia = powiadomienia.filter(p => !p.przeczytane && p.odniesienie_id === watek.id);
                            watekPowiadomienia.forEach(p => markPowiadomienieRead(p.id));
                          }}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {watek.przypiety && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                                  <Badge variant={watek.kategoria === 'ankieta' ? 'destructive' : 'secondary'} className={`text-xs ${watek.kategoria === 'ogłoszenie' ? 'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600' : ''}`}>
                                    {watek.kategoria === 'ogłoszenie' ? 'Ogłoszenie' : watek.kategoria === 'ankieta' ? 'Ankieta' : 'Dyskusja'}
                                  </Badge>
                                  {watek.zamkniety && <LockKeyhole className="w-3 h-3 text-red-500" />}
                                  {watekAnkieta && watekAnkieta.wyniki_ukryte && <EyeOff className="w-3 h-3 text-red-500" />}
                                </div>
                                {watek.kategoria !== 'ogłoszenie' && <CardTitle className="text-base">{watek.tytul}</CardTitle>}
                                {watek.kategoria === 'ogłoszenie' && watek.tresc && (
                                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mt-1">{renderTresc(watek.tresc)}</div>
                                )}
                                {watekAnkieta && (
                                  <CardDescription className="text-xs mt-1">
                                    Ważna do: {watekAnkieta.termin ? new Date(watekAnkieta.termin).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'bez terminu'}
                                  </CardDescription>
                                )}
                                {watek.kategoria === 'dyskusja' && (
                                  <CardDescription className="text-xs mt-1">
                                    {autorWatku ? `${autorWatku.imie} ${autorWatku.nazwisko || ''}`.trim() : 'Ksiądz'} &middot; {new Date(watek.updated_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {/* Ankiety — oryginalne przyciski bez zmian */}
                                {currentUser.typ === 'ksiadz' && watekAnkieta && (
                                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 px-2 text-xs ${watek.przypiety ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300' : 'text-gray-500 hover:text-amber-600 hover:border-amber-300'}`}
                                        onClick={() => togglePrzypiety(watek.id, watek.przypiety)}
                                      >
                                        <Pin className="w-3 h-3 mr-1" />
                                        {watek.przypiety ? 'Odepnij' : 'Przypnij'}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950 dark:hover:border-red-600"
                                        onClick={() => deleteWatek(watek.id)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Usuń
                                      </Button>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-full text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950 dark:hover:border-indigo-600"
                                      onClick={() => {
                                        setSelectedWatek(watek);
                                        loadWatekWiadomosci(watek.id);
                                        const watekPowiadomienia = powiadomienia.filter(p => !p.przeczytane && p.odniesienie_id === watek.id);
                                        watekPowiadomienia.forEach(p => markPowiadomienieRead(p.id));
                                      }}
                                    >
                                      Szczegóły
                                    </Button>
                                  </div>
                                )}
                                {/* Ogłoszenia */}
                                {currentUser.typ === 'ksiadz' && !watekAnkieta && watek.kategoria === 'ogłoszenie' && (
                                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                    {watek.tytul?.startsWith('[ADMIN]') ? (
                                      <>
                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700 mb-1">
                                          <Shield className="w-3 h-3 mr-1" />
                                          Admin
                                        </Badge>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-full text-xs text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-950 dark:hover:border-teal-600"
                                          onClick={() => setPreviewOgloszenie(watek)}
                                        >
                                          <Eye className="w-3 h-3 mr-1" />
                                          Pogląd
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-full text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950 dark:hover:border-red-600"
                                          onClick={() => deleteWatek(watek.id)}
                                        >
                                          <Trash2 className="w-3 h-3 mr-1" />
                                          Usuń
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-7 px-2 text-xs ${watek.przypiety ? 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-950 dark:border-teal-700 dark:text-teal-300' : 'text-gray-500 hover:text-amber-600 hover:border-amber-300'}`}
                                            onClick={() => togglePrzypiety(watek.id, watek.przypiety)}
                                          >
                                            <Pin className="w-3 h-3 mr-1" />
                                            {watek.przypiety ? 'Odepnij' : 'Przypnij'}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950 dark:hover:border-red-600"
                                            onClick={() => deleteWatek(watek.id)}
                                          >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Usuń
                                          </Button>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-full text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950 dark:hover:border-indigo-600"
                                          onClick={() => {
                                            setEditingWatek(watek);
                                            setNewWatekForm({ tytul: watek.tytul, tresc: watek.tresc || '', kategoria: watek.kategoria as 'ogłoszenie' | 'dyskusja' | 'ankieta', grupa_docelowa: watek.grupa_docelowa || 'wszyscy', archiwum_data: watek.archiwum_data ? new Date(watek.archiwum_data).toISOString().split('T')[0] : '' });
                                            setShowNewWatekModal(true);
                                          }}
                                        >
                                          Edytuj
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-full text-xs text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-950 dark:hover:border-teal-600"
                                          onClick={() => setPreviewOgloszenie(watek)}
                                        >
                                          <Eye className="w-3 h-3 mr-1" />
                                          Pogląd
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                                {/* Dyskusje */}
                                {currentUser.typ === 'ksiadz' && !watekAnkieta && watek.kategoria === 'dyskusja' && (
                                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 px-2 text-xs ${watek.przypiety ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300' : 'text-gray-500 hover:text-amber-600 hover:border-amber-300'}`}
                                        onClick={() => togglePrzypiety(watek.id, watek.przypiety)}
                                      >
                                        <Pin className="w-3 h-3 mr-1" />
                                        {watek.przypiety ? 'Odepnij' : 'Przypnij'}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950 dark:hover:border-red-600"
                                        onClick={() => deleteWatek(watek.id)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Usuń
                                      </Button>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-full text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950 dark:hover:border-indigo-600"
                                      onClick={() => {
                                        setEditingWatek(watek);
                                        setNewWatekForm({ tytul: watek.tytul, tresc: watek.tresc || '', kategoria: watek.kategoria as 'ogłoszenie' | 'dyskusja' | 'ankieta', grupa_docelowa: watek.grupa_docelowa || 'wszyscy', archiwum_data: watek.archiwum_data ? new Date(watek.archiwum_data).toISOString().split('T')[0] : '' });
                                        setShowNewWatekModal(true);
                                      }}
                                    >
                                      Edytuj
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-full text-xs text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-400 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-950 dark:hover:border-teal-600"
                                      onClick={() => setPreviewOgloszenie(watek)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Podgląd
                                    </Button>
                                  </div>
                                )}
                                {currentUser.typ === 'ministrant' && watekAnkieta && !mojaOdp && watekAnkieta.aktywna && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">Odpowiedz!</Badge>
                                )}
                                {currentUser.typ === 'ministrant' && watekAnkieta && mojaOdp && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            </div>
                            {watekAnkieta && (() => {
                              const opcje = ankietyOpcje.filter(o => o.ankieta_id === watekAnkieta.id).sort((a, b) => a.kolejnosc - b.kolejnosc);
                              const odpowiedzi = ankietyOdpowiedzi.filter(o => o.ankieta_id === watekAnkieta.id);
                              const unikatoweOsoby = new Set(odpowiedzi.map(o => o.respondent_id)).size;
                              const pokazWyniki = currentUser.typ === 'ksiadz' || (!watekAnkieta.wyniki_ukryte && mojaOdp);
                              return pokazWyniki ? (
                                <div className="flex items-center gap-3 flex-wrap mt-2">
                                  {opcje.map(opcja => {
                                    const count = odpowiedzi.filter(od => od.opcja_id === opcja.id).length;
                                    const pct = unikatoweOsoby > 0 ? Math.round((count / unikatoweOsoby) * 100) : 0;
                                    const isTak = opcja.tresc.toLowerCase() === 'tak';
                                    const isNie = opcja.tresc.toLowerCase() === 'nie';
                                    const bgColor = isTak ? 'bg-green-50 dark:bg-green-950' : isNie ? 'bg-red-50 dark:bg-red-950' : 'bg-indigo-50 dark:bg-indigo-950';
                                    const textColor = isTak ? 'text-green-700 dark:text-green-300' : isNie ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200';
                                    const countColor = isTak ? 'text-green-600 dark:text-green-400' : isNie ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400';
                                    return (
                                      <span key={opcja.id} className={`inline-flex items-center gap-1 rounded-full ${bgColor} px-2.5 py-0.5 text-sm font-medium`}>
                                        <span className={textColor}>{opcja.tresc}:</span>
                                        <span className={`font-bold ${countColor}`}>{count}</span>
                                        <span className="text-gray-500 dark:text-gray-400">({pct}%)</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : null;
                            })()}
                          </CardHeader>
                          {watek.kategoria !== 'ogłoszenie' && watek.tresc && (
                            <CardContent className="pt-0">
                              <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{renderTresc(watek.tresc || '')}</div>
                              {(watek.tresc.split('\n').length > 2 || watek.tresc.length > 100) && (
                                <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">Pokaż więcej...</p>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })
                  )}

                </div>
                );
              })()}
            </div>
          </TabsContent>

          {/* Panel Ranking Służby */}
          <TabsContent value="ranking">
            <div className="space-y-6">
              {/* === WIDOK MINISTRANTA === */}
              {currentUser.typ === 'ministrant' && (() => {
                const myRanking = rankingData.find(r => r.ministrant_id === currentUser.id);
                const totalPkt = myRanking ? Number(myRanking.total_pkt) : 0;
                const currentRanga = getRanga(totalPkt);
                const nextRanga = getNextRanga(totalPkt);
                const myObecnosci = obecnosci.filter(o => o.ministrant_id === currentUser.id);
                const myDyzury = dyzury.filter(d => d.ministrant_id === currentUser.id);
                const myOdznaki = odznakiZdobyte.filter(o => o.ministrant_id === currentUser.id);
                const myMinusowe = minusowePunkty.filter(m => m.ministrant_id === currentUser.id);
                const totalMinusowe = myMinusowe.reduce((sum, m) => sum + Number(m.punkty), 0);
                const myPosition = rankingData.findIndex(r => r.ministrant_id === currentUser.id) + 1;
                const myMember = members.find(m => m.profile_id === currentUser.id);
                const myGrupa = myMember?.grupa ? grupy.find(g => g.id === myMember.grupa) : null;

                return (
                  <div className="space-y-5">
                    {/* Przyciski akcji */}
                    <div className="flex gap-3">
                      <Button onClick={() => setShowZglosModal(true)} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Zgłoś obecność
                      </Button>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <Button variant="outline" onClick={() => setShowDyzuryModal(true)} className="w-full font-bold">
                          <Clock className="w-4 h-4 mr-2" />
                          Moje dyżury
                        </Button>
                        {myDyzury.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {myDyzury.map(d => (
                              <span key={d.id} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                {DNI_TYGODNIA_FULL[d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* === HERO PROFIL === */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-5 text-white shadow-xl shadow-purple-500/20">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-extrabold truncate">{currentUser.imie} {currentUser.nazwisko || ''}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {myGrupa && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">{myGrupa.emoji} {myGrupa.nazwa}</span>}
                              {currentRanga && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${KOLOR_KLASY[currentRanga.kolor]?.bg} ${KOLOR_KLASY[currentRanga.kolor]?.text}`}>{currentRanga.nazwa}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-3xl font-black tabular-nums">{totalPkt}</div>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-70">XP</div>
                          </div>
                        </div>
                        {myPosition > 0 && <div className="text-xs mt-2 font-semibold opacity-80">#{myPosition} w parafii</div>}
                        {nextRanga && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs font-medium opacity-80 mb-1">
                              <span>{currentRanga?.nazwa}</span>
                              <span>{nextRanga.nazwa} ({nextRanga.min_pkt} XP)</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                              <div className="bg-gradient-to-r from-amber-300 to-yellow-400 h-3 rounded-full transition-all shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                                style={{ width: `${Math.min(100, ((totalPkt - (currentRanga?.min_pkt || 0)) / (nextRanga.min_pkt - (currentRanga?.min_pkt || 0))) * 100)}%` }} />
                            </div>
                            <div className="text-xs mt-1 opacity-70">Brakuje {nextRanga.min_pkt - totalPkt} XP do {nextRanga.nazwa}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {[
                            { icon: <Flame className="w-4 h-4" />, val: `${myRanking?.streak_tyg || 0} tyg.`, label: 'Seria' },
                            { icon: <Calendar className="w-4 h-4" />, val: myRanking?.total_obecnosci || 0, label: 'Służba' },
                            { icon: <Target className="w-4 h-4" />, val: totalMinusowe, label: 'Kary' },
                          ].map((s, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                              <div className="flex items-center justify-center mb-0.5 opacity-80">{s.icon}</div>
                              <div className="font-extrabold text-sm">{s.val}</div>
                              <div className="text-[10px] uppercase tracking-wider opacity-60">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* === LEADERBOARD === */}
                    <div className="rounded-2xl overflow-hidden border border-amber-200/50 dark:border-amber-700/30 shadow-lg shadow-amber-500/5">
                      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-4 py-3">
                        <h3 className="font-extrabold text-white flex items-center gap-2 text-base tracking-tight">
                          <Trophy className="w-5 h-5" />
                          LEADERBOARD
                        </h3>
                      </div>
                      <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                        {rankingData.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm p-4">Brak danych w rankingu.</p>
                        ) : (
                          rankingData.map((r, i) => {
                            const member = members.find(m => m.profile_id === r.ministrant_id);
                            const ranga = getRanga(Number(r.total_pkt));
                            const isMe = r.ministrant_id === currentUser.id;
                            const positionStyles = i === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' : i === 1 ? 'bg-gradient-to-r from-gray-100 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/30' : i === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10' : '';
                            return (
                              <div key={r.id} className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : positionStyles}`}>
                                <div className="w-8 shrink-0 text-center">
                                  {i === 0 ? <span className="text-2xl">🥇</span> : i === 1 ? <span className="text-2xl">🥈</span> : i === 2 ? <span className="text-2xl">🥉</span> : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-semibold text-sm truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>
                                      {isMe ? `${currentUser.imie} ${currentUser.nazwisko || ''}`.trim() : member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}
                                    </span>
                                    {isMe && <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                                  </div>
                                  {ranga && <span className={`text-[10px] font-semibold uppercase tracking-wider ${KOLOR_KLASY[ranga.kolor]?.text || 'text-gray-500'}`}>{ranga.nazwa}</span>}
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-extrabold text-sm tabular-nums">{Number(r.total_pkt)}</div>
                                  <div className="text-[10px] text-gray-400 uppercase">XP</div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* === HISTORIA MISJI === */}
                    <div className="rounded-2xl overflow-hidden border dark:border-gray-700">
                      <div className="bg-gradient-to-r from-slate-700 to-gray-800 px-4 py-3">
                        <h3 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-tight uppercase">
                          <Clock className="w-4 h-4 text-gray-300" />
                          Historia misji
                        </h3>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-3">
                        {myObecnosci.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Brak misji. Zacznij służyć i zdobywaj XP!</p>
                        ) : (
                          <div className="space-y-1.5">
                            {(showAllZgloszenia ? myObecnosci : myObecnosci.slice(0, 3)).map(o => {
                              const d = new Date(o.data);
                              const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
                              const isDyzur = myDyzury.some(dy => dy.dzien_tygodnia === d.getDay());
                              return (
                                <div key={o.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border ${o.status === 'zatwierdzona' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' : o.status === 'odrzucona' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'}`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    {o.status === 'zatwierdzona' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" />}
                                    {o.status === 'oczekuje' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                                    {o.status === 'odrzucona' && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                                    <span className="text-xs sm:text-sm truncate font-medium">
                                      {dayName} {d.toLocaleDateString('pl-PL')}
                                    </span>
                                    {isDyzur && <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">DYŻUR</span>}
                                    {o.typ === 'nabożeństwo' && (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-[10px] font-medium text-purple-600 dark:text-purple-400">{o.nazwa_nabożeństwa}</span>
                                    )}
                                  </div>
                                  <span className={`font-extrabold text-sm tabular-nums ${o.status === 'zatwierdzona' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                    {o.status === 'zatwierdzona' ? `+${o.punkty_finalne}` : o.status === 'oczekuje' ? '...' : 'X'}
                                  </span>
                                </div>
                              );
                            })}
                            {myObecnosci.length > 3 && (
                              <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 mt-1" onClick={() => setShowAllZgloszenia(!showAllZgloszenia)}>
                                {showAllZgloszenia ? <><ChevronUp className="w-3 h-3 mr-1" /> Zwiń</> : <><ChevronDown className="w-3 h-3 mr-1" /> Pokaż wszystkie ({myObecnosci.length})</>}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* === KARY === */}
                    {myMinusowe.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border border-red-200 dark:border-red-800">
                        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5">
                          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><Target className="w-4 h-4" /> Kary</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-3 space-y-1.5">
                          {myMinusowe.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                              <span className="text-sm">{new Date(m.data).toLocaleDateString('pl-PL')} — {m.powod}</span>
                              <span className="font-extrabold text-red-600 dark:text-red-400 tabular-nums">{m.punkty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* === LEVEL PROGRESSION === */}
                    <div className="rounded-2xl overflow-hidden border dark:border-gray-700">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
                        <h3 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-tight uppercase"><Shield className="w-4 h-4" /> Poziomy ({rangiConfig.length})</h3>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-3 space-y-1.5">
                        {rangiConfig.map((r, i) => {
                          const isCurrentRanga = currentRanga?.id === r.id;
                          const isPast = totalPkt >= r.min_pkt;
                          const progress = isCurrentRanga && nextRanga ? Math.min(100, ((totalPkt - r.min_pkt) / (nextRanga.min_pkt - r.min_pkt)) * 100) : isPast ? 100 : 0;
                          return (
                            <div key={r.id} className={`relative overflow-hidden rounded-xl p-2.5 border transition-all ${isCurrentRanga ? 'border-indigo-300 dark:border-indigo-600 shadow-md shadow-indigo-500/10' : isPast ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}>
                              {(isPast || isCurrentRanga) && <div className={`absolute inset-y-0 left-0 ${isCurrentRanga ? 'bg-indigo-100/70 dark:bg-indigo-900/30' : 'bg-emerald-50 dark:bg-emerald-900/10'}`} style={{ width: `${progress}%` }} />}
                              <div className="relative flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isCurrentRanga ? 'bg-indigo-500 text-white' : isPast ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>{isPast ? '✓' : i + 1}</div>
                                  <div>
                                    <span className={`font-bold text-sm ${isCurrentRanga ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{r.nazwa}</span>
                                    {isCurrentRanga && <span className="ml-1.5 text-[10px] font-bold text-indigo-500 uppercase">Aktualny</span>}
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-gray-500 tabular-nums">{r.min_pkt} XP</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* === ACHIEVEMENTS === */}
                    <div className="rounded-2xl overflow-hidden border dark:border-gray-700">
                      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3">
                        <h3 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-tight uppercase"><Award className="w-4 h-4" /> Odznaki {myOdznaki.length}/{odznakiConfig.filter(o => o.aktywna).length}</h3>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-3 space-y-2">
                        {odznakiConfig.filter(o => o.aktywna).map(odznaka => {
                          const zdobyta = myOdznaki.find(z => z.odznaka_config_id === odznaka.id);
                          return (
                            <div key={odznaka.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${zdobyta ? 'border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 opacity-40 grayscale'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${zdobyta ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                {zdobyta ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm">{odznaka.nazwa}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{odznaka.opis}</div>
                              </div>
                              {odznaka.bonus_pkt > 0 && <span className={`text-xs font-extrabold shrink-0 tabular-nums ${zdobyta ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>+{odznaka.bonus_pkt}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* === QUEST REWARDS === */}
                    <div className="rounded-2xl overflow-hidden border dark:border-gray-700">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                        <h3 className="font-extrabold text-white flex items-center gap-2 text-sm tracking-tight uppercase"><Star className="w-4 h-4" /> Zdobywanie XP</h3>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-4 space-y-5">
                        {[
                          { title: 'Msze (pon-sob)', filter: 'msza_', icon: '⛪', prefix: '', suffix: ' XP' },
                          { title: 'Nabożeństwa', filter: 'nabożeństwo_', icon: '🙏', prefix: '', suffix: ' XP' },
                          { title: 'Mnożniki sezonowe', filter: 'mnoznik_', icon: '⚡', prefix: 'x', suffix: '' },
                          { title: 'Bonusy za serie', filter: 'bonus_seria_', icon: '🔥', prefix: '+', suffix: ' XP' },
                        ].map(section => {
                          const items = punktacjaConfig.filter(p => p.klucz.startsWith(section.filter));
                          if (items.length === 0) return null;
                          return (
                            <div key={section.filter}>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5"><span>{section.icon}</span> {section.title}</h4>
                              <div className="space-y-1">
                                {items.map(p => (
                                  <div key={p.klucz} className="flex justify-between items-center text-sm py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <span className="text-gray-600 dark:text-gray-300">{p.opis}</span>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{section.prefix}{p.wartosc}{section.suffix}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {punktacjaConfig.filter(p => p.klucz.startsWith('ranking_')).length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5"><span>🏆</span> Ranking miesięczny</h4>
                            <div className="space-y-1">
                              {punktacjaConfig.filter(p => p.klucz.startsWith('ranking_')).map(p => (
                                <div key={p.klucz} className="flex justify-between items-center text-sm py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <span className="text-gray-600 dark:text-gray-300">{p.opis}</span>
                                  <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">+{p.wartosc} XP</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5"><span>💀</span> Kary</h4>
                          <div className="space-y-1">
                            {punktacjaConfig.filter(p => p.klucz.startsWith('minus_')).map(p => (
                              <div key={p.klucz} className="flex justify-between items-center text-sm py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                <span className="text-gray-600 dark:text-gray-300">{p.opis}</span>
                                <span className="font-extrabold text-red-500 tabular-nums">{p.wartosc} XP</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-dashed pt-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5"><span>📜</span> Zasady</h4>
                          <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <li className="flex gap-2"><span>•</span> Niedziela jest <strong className="text-gray-700 dark:text-gray-200">obowiązkowa</strong> — 0 XP</li>
                            <li className="flex gap-2"><span>•</span> Zgłoszenie max <strong className="text-gray-700 dark:text-gray-200">{getConfigValue('limit_dni_zgloszenie', 2)} dni</strong> od daty</li>
                            <li className="flex gap-2"><span>•</span> Brak na dyżurze: <strong className="text-red-600 dark:text-red-400">{getConfigValue('minus_nieobecnosc_dyzur', -5)} XP</strong></li>
                            <li className="flex gap-2"><span>•</span> Ksiądz zatwierdza każde zgłoszenie</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* === WIDOK KSIĘDZA === */}
              {currentUser.typ === 'ksiadz' && (
                <div className="space-y-6">
                  {/* Przycisk ustawień */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-900/20" onClick={() => setShowResetPunktacjaModal(true)}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Wyzeruj punktację
                    </Button>
                    <Button variant="outline" onClick={() => setShowRankingSettings(!showRankingSettings)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Ustawienia punktacji
                      {showRankingSettings ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>

                  {/* Panel ustawień (rozwijany) */}
                  {showRankingSettings && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Ustawienia punktacji
                        </CardTitle>
                        <CardDescription>Edytuj wartości punktowe, rangi i odznaki</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Jeśli brak danych — przycisk inicjalizacji */}
                        {punktacjaConfig.length === 0 && rangiConfig.length === 0 && odznakiConfig.length === 0 && (
                          <div className="text-center py-6 space-y-3">
                            <p className="text-gray-500 dark:text-gray-400">Brak konfiguracji punktacji. Kliknij poniżej, aby zainicjalizować domyślne punkty, rangi i odznaki.</p>
                            <Button onClick={initRankingConfig}>
                              <Plus className="w-4 h-4 mr-2" />
                              Zainicjalizuj konfigurację
                            </Button>
                          </div>
                        )}

                        {(punktacjaConfig.length > 0 || rangiConfig.length > 0 || odznakiConfig.length > 0) && (
                        <>
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {(['punkty', 'rangi', 'odznaki', 'ogolne'] as const).map(tab => (
                            <Button key={tab} variant={rankingSettingsTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setRankingSettingsTab(tab)}>
                              {tab === 'punkty' ? 'Punkty' : tab === 'rangi' ? 'Rangi' : tab === 'odznaki' ? 'Odznaki' : 'Ogólne'}
                            </Button>
                          ))}
                        </div>

                        {/* Edycja punktów */}
                        {rankingSettingsTab === 'punkty' && (
                          <div className="space-y-4">
                            {[
                              { label: 'Punkty za msze', prefix: 'msza_', step: 1 },
                              { label: 'Nabożeństwa', prefix: 'nabożeństwo_', step: 1 },
                              { label: 'Mnożniki sezonowe', prefix: 'mnoznik_', step: 0.1 },
                              { label: 'Bonusy za serie', prefix: 'bonus_seria_', step: 1 },
                              { label: 'Ranking miesięczny', prefix: 'ranking_', step: 1 },
                              { label: 'Minusowe punkty', prefix: 'minus_', step: 1 },
                            ].map(({ label, prefix, step }) => {
                              const items = punktacjaConfig.filter(p => p.klucz.startsWith(prefix));
                              if (items.length === 0) return null;
                              return (
                                <div key={prefix}>
                                  <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</h4>
                                  {items.map(p => (
                                    <div key={p.klucz} className="flex items-center gap-2 mb-2">
                                      <Input
                                        className="flex-1 text-sm"
                                        value={p.opis}
                                        onChange={(e) => {
                                          setPunktacjaConfig(prev => prev.map(x => x.klucz === p.klucz ? { ...x, opis: e.target.value } : x));
                                        }}
                                        onBlur={() => updateConfigOpis(p.klucz, p.opis)}
                                      />
                                      <Input
                                        type="number"
                                        step={step}
                                        className="w-20"
                                        value={p.wartosc}
                                        onChange={(e) => updateConfigValue(p.klucz, Number(e.target.value))}
                                      />
                                      <span className="text-xs text-gray-400 w-8">{prefix.startsWith('mnoznik') ? 'x' : 'pkt'}</span>
                                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 px-2" onClick={() => deletePunktacja(p.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}

                            {/* Dodaj nowy wpis */}
                            <div className="border-t pt-4">
                              {!showNewPunktacjaForm ? (
                                <Button variant="outline" size="sm" onClick={() => setShowNewPunktacjaForm(true)}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Dodaj nowy wpis punktacji
                                </Button>
                              ) : (
                                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Klucz (np. msza_custom)"
                                      className="flex-1"
                                      value={newPunktacjaForm.klucz}
                                      onChange={(e) => setNewPunktacjaForm(prev => ({ ...prev, klucz: e.target.value }))}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Wartość"
                                      className="w-24"
                                      value={newPunktacjaForm.wartosc || ''}
                                      onChange={(e) => setNewPunktacjaForm(prev => ({ ...prev, wartosc: Number(e.target.value) }))}
                                    />
                                  </div>
                                  <Input
                                    placeholder="Opis (np. Msza — specjalna)"
                                    value={newPunktacjaForm.opis}
                                    onChange={(e) => setNewPunktacjaForm(prev => ({ ...prev, opis: e.target.value }))}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={async () => {
                                      if (newPunktacjaForm.klucz && newPunktacjaForm.opis) {
                                        await addPunktacja(newPunktacjaForm.klucz, newPunktacjaForm.wartosc, newPunktacjaForm.opis);
                                        setNewPunktacjaForm({ klucz: '', wartosc: 0, opis: '' });
                                        setShowNewPunktacjaForm(false);
                                      }
                                    }}>
                                      <Check className="w-4 h-4 mr-1" />
                                      Dodaj
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowNewPunktacjaForm(false)}>
                                      Anuluj
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Edycja rang */}
                        {rankingSettingsTab === 'rangi' && (
                          <div className="space-y-3">
                            {rangiConfig.map(r => (
                              <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <Select value={r.kolor} onValueChange={(val) => {
                                  setRangiConfig(prev => prev.map(x => x.id === r.id ? { ...x, kolor: val } : x));
                                  updateRangaKolor(r.id, val);
                                }}>
                                  <SelectTrigger className={`w-10 h-8 p-0 ${KOLOR_KLASY[r.kolor]?.bg}`}>
                                    <span />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.keys(KOLOR_KLASY).map(k => (
                                      <SelectItem key={k} value={k}>
                                        <span className={`inline-block w-4 h-4 rounded ${KOLOR_KLASY[k]?.bg} mr-2`} />
                                        {k}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  className="flex-1"
                                  value={r.nazwa}
                                  onChange={(e) => {
                                    setRangiConfig(prev => prev.map(x => x.id === r.id ? { ...x, nazwa: e.target.value } : x));
                                  }}
                                  onBlur={() => updateRanga(r.id, r.nazwa, r.min_pkt)}
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">od</span>
                                <Input
                                  type="number"
                                  className="w-24"
                                  value={r.min_pkt}
                                  onChange={(e) => {
                                    setRangiConfig(prev => prev.map(x => x.id === r.id ? { ...x, min_pkt: Number(e.target.value) } : x));
                                  }}
                                  onBlur={() => updateRanga(r.id, r.nazwa, r.min_pkt)}
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">pkt</span>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 px-2" onClick={() => deleteRanga(r.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addRanga}>
                              <Plus className="w-4 h-4 mr-2" />
                              Dodaj rangę
                            </Button>
                          </div>
                        )}

                        {/* Edycja odznak */}
                        {rankingSettingsTab === 'odznaki' && (
                          <div className="space-y-3">
                            {odznakiConfig.map(o => (
                              <div key={o.id} className={`p-3 rounded-lg space-y-2 ${o.aktywna ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700 opacity-60'}`}>
                                {editingOdznakaId === o.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={o.nazwa}
                                      placeholder="Nazwa odznaki"
                                      onChange={(e) => setOdznakiConfig(prev => prev.map(x => x.id === o.id ? { ...x, nazwa: e.target.value } : x))}
                                    />
                                    <Input
                                      value={o.opis}
                                      placeholder="Opis odznaki"
                                      onChange={(e) => setOdznakiConfig(prev => prev.map(x => x.id === o.id ? { ...x, opis: e.target.value } : x))}
                                    />
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <Label className="text-xs text-gray-500 dark:text-gray-400">Typ warunku</Label>
                                        <Select value={o.warunek_typ} onValueChange={(val) => setOdznakiConfig(prev => prev.map(x => x.id === o.id ? { ...x, warunek_typ: val } : x))}>
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {['total_obecnosci', 'pelny_tydzien', 'ranking_miesieczny', 'sezon_adwent', 'sezon_wielki_post', 'triduum', 'nabożeństwo_droga_krzyzowa', 'nabożeństwo_rozaniec', 'nabożeństwo_majowe', 'rekord_parafii', 'zero_minusowych_tyg', 'streak_tyg'].map(t => (
                                              <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500 dark:text-gray-400">Wartość</Label>
                                        <Input
                                          type="number"
                                          className="w-20 h-8"
                                          value={o.warunek_wartosc}
                                          onChange={(e) => setOdznakiConfig(prev => prev.map(x => x.id === o.id ? { ...x, warunek_wartosc: Number(e.target.value) } : x))}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500 dark:text-gray-400">Bonus pkt</Label>
                                        <Input
                                          type="number"
                                          className="w-20 h-8"
                                          value={o.bonus_pkt}
                                          onChange={(e) => setOdznakiConfig(prev => prev.map(x => x.id === o.id ? { ...x, bonus_pkt: Number(e.target.value) } : x))}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={async () => {
                                        await updateOdznaka(o.id, { nazwa: o.nazwa, opis: o.opis, warunek_typ: o.warunek_typ, warunek_wartosc: o.warunek_wartosc, bonus_pkt: o.bonus_pkt });
                                        setEditingOdznakaId(null);
                                      }}>
                                        <Check className="w-4 h-4 mr-1" />
                                        Zapisz
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => { setEditingOdznakaId(null); loadRankingData(); }}>
                                        Anuluj
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-purple-500" />
                                        <span className="font-medium text-sm">{o.nazwa}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-xs">+{o.bonus_pkt} pkt</Badge>
                                        <Button variant="ghost" size="sm" className="px-2" onClick={() => updateOdznaka(o.id, { aktywna: !o.aktywna })}>
                                          {o.aktywna ? <Unlock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="px-2" onClick={() => setEditingOdznakaId(o.id)}>
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 px-2" onClick={() => deleteOdznaka(o.id)}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{o.opis}</div>
                                    <div className="text-xs text-gray-400">Warunek: {o.warunek_typ} &ge; {o.warunek_wartosc}</div>
                                  </>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addOdznaka}>
                              <Plus className="w-4 h-4 mr-2" />
                              Dodaj odznakę
                            </Button>
                          </div>
                        )}

                        {/* Ogólne */}
                        {rankingSettingsTab === 'ogolne' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-sm font-medium">Limit dni na zgłoszenie</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Ile dni po służbie ministrant może zgłosić obecność</div>
                              </div>
                              <Input
                                type="number"
                                className="w-20"
                                value={getConfigValue('limit_dni_zgloszenie', 2)}
                                onChange={(e) => updateConfigValue('limit_dni_zgloszenie', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        )}
                        </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Oczekujące zgłoszenia */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Hourglass className="w-4 h-4 text-yellow-500" />
                          Oczekujące zgłoszenia ({obecnosci.filter(o => o.status === 'oczekuje').length})
                        </CardTitle>
                        {obecnosci.filter(o => o.status === 'oczekuje').length > 1 && (
                          <Button size="sm" onClick={zatwierdzWszystkie} className="px-2 sm:px-3">
                            <Check className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Zatwierdź wszystkie</span>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {obecnosci.filter(o => o.status === 'oczekuje').length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Brak oczekujących zgłoszeń.</p>
                      ) : (
                        <div className="space-y-2">
                          {obecnosci.filter(o => o.status === 'oczekuje').map(o => {
                            const member = members.find(m => m.profile_id === o.ministrant_id);
                            const d = new Date(o.data);
                            const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
                            const isDyzur = dyzury.some(dy => dy.ministrant_id === o.ministrant_id && dy.dzien_tygodnia === d.getDay());
                            return (
                              <div key={o.id} className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm sm:text-base truncate">{member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}</div>
                                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    {dayName} {d.toLocaleDateString('pl-PL')} {o.godzina && `• ${o.godzina}`}
                                    {isDyzur && <Badge variant="outline" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">DYŻUR</Badge>}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                    {o.typ === 'nabożeństwo' ? o.nazwa_nabożeństwa : 'Msza'}
                                    {' • '}{o.punkty_finalne} pkt {o.mnoznik > 1 ? `(${o.punkty_bazowe} × ${o.mnoznik})` : ''}
                                  </div>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => zatwierdzObecnosc(o.id)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => odrzucObecnosc(o.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Ranking parafii */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Ranking parafii
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rankingData.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Brak danych w rankingu.</p>
                      ) : (
                        <div className="space-y-2">
                          {rankingData.map((r, i) => {
                            const member = members.find(m => m.profile_id === r.ministrant_id);
                            const ranga = getRanga(Number(r.total_pkt));
                            return (
                              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-lg w-8">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                  </span>
                                  <div>
                                    <span className="font-medium">{member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}</span>
                                    {ranga && (
                                      <Badge className={`ml-2 text-xs ${KOLOR_KLASY[ranga.kolor]?.bg} ${KOLOR_KLASY[ranga.kolor]?.text}`}>
                                        {ranga.nazwa}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold">{Number(r.total_pkt)} pkt</span>
                                  {Number(r.total_minusowe) < 0 && (
                                    <span className="text-xs text-red-600 dark:text-red-400 ml-2">{r.total_minusowe} min.</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Statystyki */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Statystyki miesiąca</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <div className="font-bold text-lg">{obecnosci.filter(o => o.status === 'zatwierdzona').length}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Zatwierdzone</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                          <div className="font-bold text-lg">{obecnosci.filter(o => o.status === 'odrzucona').length}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Odrzucone</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                          <div className="font-bold text-lg">{minusowePunkty.length}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Minusowe</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Panel Wydarzenia */}
          <TabsContent value="sluzby">
            <div className="space-y-4">
              {!showSzablonyView ? (
                <>
                  {/* === Widok wydarzeń === */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4 sm:p-5 shadow-lg shadow-indigo-500/20">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">📅</div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Wydarzenia</h2>
                          <p className="text-indigo-200 text-xs sm:text-sm">Msze, nabożeństwa i celebracje</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {currentUser.typ === 'ksiadz' && (
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setShowFunkcjeConfigModal(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Funkcje
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowSzablonyView(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Szablony
                      </Button>
                      <Button size="sm" onClick={() => {
                        setSelectedSluzba(null);
                        setSluzbaForm({ nazwa: '', data: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
                        setShowSluzbaModal(true);
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj wydarzenie
                        </Button>
                      </div>
                    )}

                  <div className="grid gap-4">
                    {sluzby.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                          Brak zaplanowanych wydarzeń
                        </CardContent>
                      </Card>
                    ) : (
                      sluzby.map(sluzba => {
                        const isMySluzba = isSluzbaAssignedToMe(sluzba);
                        const myFunkcje = getMyFunkcje(sluzba);
                        const needsAcceptance = hasUnacceptedFunkcje(sluzba);

                        return (
                          <Card key={sluzba.id} className={isMySluzba ? 'border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : ''}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle>{sluzba.nazwa}</CardTitle>
                                  <CardDescription>
                                    {new Date(sluzba.data).toLocaleDateString('pl-PL')} • {sluzba.godzina}
                                  </CardDescription>
                                </div>
                                {currentUser.typ === 'ksiadz' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Edytuj wydarzenie"
                                    onClick={() => handleEditSluzba(sluzba)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {/* Widok księdza — pełna lista funkcji */}
                              {currentUser.typ === 'ksiadz' && (
                                <div className="space-y-2">
                                  {sluzba.funkcje
                                    .filter(f => f.aktywna)
                                    .map((funkcja) => (
                                      <div key={funkcja.id} className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                                        <span className="font-medium text-sm shrink-0">{funkcja.typ}:</span>
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                          <span className="text-sm truncate">
                                            {getMemberName(funkcja.ministrant_id) || '(nie przypisano)'}
                                          </span>
                                          {funkcja.ministrant_id && (
                                            funkcja.zaakceptowana ? (
                                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            ) : (
                                              <Hourglass className="w-4 h-4 text-amber-600" />
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}

                              {/* Widok ministranta — tylko jego funkcje */}
                              {currentUser.typ === 'ministrant' && (() => {
                                const dniDoWydarzenia = Math.ceil((new Date(sluzba.data).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));

                                return (
                                  <div className="space-y-2">
                                    {isMySluzba ? (
                                      <>
                                        {myFunkcje.map((f) => (
                                          <div key={f.id} className="space-y-2">
                                            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                              <span className="font-medium">Twoja funkcja: {f.typ}</span>
                                              {f.zaakceptowana ? (
                                                <Badge className="bg-green-100 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">Zaakceptowana</Badge>
                                              ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700">Oczekuje</Badge>
                                              )}
                                            </div>
                                            {f.zaakceptowana && (
                                              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 space-y-2">
                                                <p className="text-sm text-indigo-800 dark:text-indigo-200">{FUNKCJE_OPISY[f.typ as FunkcjaType] || 'Brak opisu funkcji.'}</p>
                                                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                  {dniDoWydarzenia === 0 ? 'Wydarzenie dzisiaj!' :
                                                   dniDoWydarzenia === 1 ? 'Wydarzenie jutro!' :
                                                   dniDoWydarzenia < 0 ? 'Wydarzenie już się odbyło' :
                                                   `Do wydarzenia: ${dniDoWydarzenia} ${dniDoWydarzenia < 5 ? 'dni' : 'dni'}`}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {needsAcceptance && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleAcceptSluzba(sluzba)}
                                            className="w-full mt-2"
                                          >
                                            <Check className="w-4 h-4 mr-1" />
                                            Akceptuję wydarzenie
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-sm text-gray-400 text-center py-2">Nie jesteś przypisany do tego wydarzenia</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* === Widok szablonów === */}
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowSzablonyView(false)}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <h2 className="text-xl sm:text-2xl font-bold">Szablony wydarzeń</h2>
                    </div>
                    <Button onClick={() => {
                      setSelectedSzablon(null);
                      setSzablonForm({ nazwa: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
                      setShowSzablonModal(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj szablon
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {szablony.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Brak szablonów</p>
                          <p className="text-sm mt-1">Utwórz szablon, aby szybko publikować powtarzające się wydarzenia</p>
                        </CardContent>
                      </Card>
                    ) : (
                      szablony.map(szablon => {
                        const aktywnaFunkcje = FUNKCJE_TYPES.filter(t => szablon.funkcje[t] !== 'BEZ');
                        return (
                          <Card key={szablon.id} className="border-indigo-200 dark:border-indigo-800">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{szablon.nazwa}</CardTitle>
                                  <CardDescription>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {szablon.godzina} • {aktywnaFunkcje.length} funkcji
                                  </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Edytuj szablon"
                                    onClick={() => {
                                      setSelectedSzablon(szablon);
                                      setSzablonForm({
                                        nazwa: szablon.nazwa,
                                        godzina: szablon.godzina,
                                        funkcje: { ...szablon.funkcje } as Record<FunkcjaType, string>,
                                      });
                                      setShowSzablonModal(true);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex flex-wrap gap-1 mb-3">
                                {aktywnaFunkcje.map(f => (
                                  <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                                ))}
                              </div>
                              <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                onClick={() => {
                                  setSelectedSzablon(szablon);
                                  setPublishDate('');
                                  const initialFunkcje = {} as Record<FunkcjaType, string>;
                                  FUNKCJE_TYPES.forEach(typ => {
                                    initialFunkcje[typ] = szablon.funkcje[typ] === 'BEZ' ? 'BEZ' : 'UNASSIGNED';
                                  });
                                  setPublishFunkcje(initialFunkcje);
                                  setShowPublishSzablonModal(true);
                                }}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publikuj wydarzenie
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Panel Ministranci (tylko ksiądz) */}
          {currentUser.typ === 'ksiadz' && (
            <TabsContent value="ministranci">
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold">Ministranci</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => { setEmailSelectedGrupy([]); setEmailSelectedMinistranci([]); setEmailSearchMinistrant(''); setShowEmailModal(true); }} variant="outline">
                      Wyślij maila
                    </Button>
                    <Button size="sm" onClick={() => setShowGrupyEditModal(true)} variant="outline">
                      Zarządzaj grupami
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Szukaj ministranta..."
                    value={searchMinistrant}
                    onChange={(e) => setSearchMinistrant(e.target.value)}
                    className="pl-9 bg-white dark:bg-gray-900"
                  />
                  {searchMinistrant && (
                    <button onClick={() => setSearchMinistrant('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button className="w-full py-5 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-700 dark:hover:bg-indigo-600" onClick={() => setShowGrafikModal(true)}>
                  <Shield className="w-5 h-5 mr-2" />
                  Grafik dyżurów
                </Button>

                {/* Nieprzypisani */}
                {members.filter(m => !m.grupa && m.typ === 'ministrant').length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">⚠️ Nieprzypisani</h3>
                    </div>
                    <div className="grid gap-3">
                      {members.filter(m => !m.grupa && m.typ === 'ministrant' && (!searchMinistrant || `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(searchMinistrant.toLowerCase()))).map(member => (
                        <Card key={member.id} className="border-amber-400 dark:border-amber-600 overflow-hidden">
                          <CardContent className="py-3 sm:py-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold">{member.imie}</p>
                                {member.nazwisko && <p className="font-semibold text-gray-700 dark:text-gray-300 -mt-0.5">{member.nazwisko}</p>}
                                <p className="text-xs text-gray-500 dark:text-gray-400">{rankingData.find(r => r.ministrant_id === member.profile_id)?.total_pkt || 0} pkt <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setDodajPunktyForm({ punkty: '', powod: '' }); setShowDodajPunktyModal(true); }} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400 align-middle"><Plus className="w-3 h-3" /></button></p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowGrupaModal(true);
                                    }}
                                  >
                                    Zmień grupę
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowPoslugiModal(true);
                                    }}
                                  >
                                    Przypisz posługi
                                  </Button>
                                {(() => {
                                  const memberDyzury = dyzury.filter(d => d.ministrant_id === member.profile_id);
                                  if (memberDyzury.length > 0) {
                                    const biernik: Record<string, string> = { 'Środa': 'Środę', 'Sobota': 'Sobotę', 'Niedziela': 'Niedzielę' };
                                    const dniNazwy = memberDyzury.map(d => {
                                      const idx = d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1;
                                      const nazwa = DNI_TYGODNIA_FULL[idx];
                                      return biernik[nazwa] || nazwa;
                                    });
                                    const prefix = dniNazwy[0] === 'Wtorek' ? 'we' : 'w';
                                    return <p className="text-xs text-gray-500 dark:text-gray-400">Dyżur {prefix} {dniNazwy.join(', ')}</p>;
                                  }
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setShowDyzuryAdminModal(true);
                                      }}
                                    >
                                      Dodaj dyżur
                                    </Button>
                                  );
                                })()}
                                <button
                                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors mt-1"
                                  onClick={() => { setMemberToDelete(member); setShowDeleteMemberModal(true); }}
                                >
                                  usuń konto
                                </button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grupy */}
                {grupy.map(grupa => {
                  const groupMembers = members.filter(m => m.grupa === grupa.id && m.typ === 'ministrant' && (!searchMinistrant || `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(searchMinistrant.toLowerCase())));
                  const kolory = KOLOR_KLASY[grupa.kolor] || KOLOR_KLASY.gray;

                  return groupMembers.length > 0 && (
                    <div key={grupa.id}>
                      <div className={`flex items-center justify-between mb-2 p-2 ${kolory.bg} rounded`}>
                        <h3 className={`text-lg font-bold ${kolory.text}`}>
                          {grupa.emoji} {grupa.nazwa}
                        </h3>
                        <Badge variant="secondary">{groupMembers.length}</Badge>
                      </div>
                      <div className="grid gap-3 mb-6">
                        {groupMembers.map(member => (
                          <Card key={member.id} className={`${kolory.cardBg} ${kolory.border} overflow-hidden`}>
                            <CardContent className="py-3 sm:py-4">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold">{member.imie}</p>
                                  {member.nazwisko && <p className="font-semibold text-gray-700 dark:text-gray-300 -mt-0.5">{member.nazwisko}</p>}
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{rankingData.find(r => r.ministrant_id === member.profile_id)?.total_pkt || 0} pkt <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setDodajPunktyForm({ punkty: '', powod: '' }); setShowDodajPunktyModal(true); }} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400 align-middle"><Plus className="w-3 h-3" /></button></p>
                                  {member.role.length > 0 && (
                                    <div className="mt-2">
                                      {(() => {
                                        const firstRole = member.role[0];
                                        const firstPosluga = poslugi.find(p => p.slug === firstRole);
                                        return (
                                          <div className="flex flex-wrap gap-1 items-center">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                              {firstPosluga?.obrazek_url ? (
                                                <img src={firstPosluga.obrazek_url} alt={firstPosluga?.nazwa} className="w-4 h-4 rounded-full object-cover inline" />
                                              ) : firstPosluga?.emoji} {firstPosluga?.nazwa}
                                            </Badge>
                                            {member.role.length > 1 && (
                                              <details className="inline">
                                                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 list-none">+{member.role.length - 1} więcej</summary>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {member.role.slice(1).map(r => {
                                                    const posluga = poslugi.find(p => p.slug === r);
                                                    return (
                                                      <Badge key={r} variant="outline" className="flex items-center gap-1">
                                                        {posluga?.obrazek_url ? (
                                                          <img src={posluga.obrazek_url} alt={posluga?.nazwa} className="w-4 h-4 rounded-full object-cover inline" />
                                                        ) : posluga?.emoji} {posluga?.nazwa}
                                                      </Badge>
                                                    );
                                                  })}
                                                </div>
                                              </details>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setShowGrupaModal(true);
                                      }}
                                    >
                                      Zmień grupę
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setShowPoslugiModal(true);
                                      }}
                                    >
                                      Przypisz posługi
                                    </Button>
                                  {(() => {
                                    const memberDyzury = dyzury.filter(d => d.ministrant_id === member.profile_id);
                                    if (memberDyzury.length > 0) {
                                      const biernik: Record<string, string> = { 'Środa': 'Środę', 'Sobota': 'Sobotę', 'Niedziela': 'Niedzielę' };
                                      const dniNazwy = memberDyzury.map(d => {
                                        const idx = d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1;
                                        const nazwa = DNI_TYGODNIA_FULL[idx];
                                        return biernik[nazwa] || nazwa;
                                      });
                                      const prefix = dniNazwy[0] === 'Wtorek' ? 'we' : 'w';
                                      return <p className="text-xs text-gray-500 dark:text-gray-400">Dyżur {prefix} {dniNazwy.join(', ')}</p>;
                                    }
                                    return (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                          setSelectedMember(member);
                                          setShowDyzuryAdminModal(true);
                                        }}
                                      >
                                        Dodaj dyżur
                                      </Button>
                                    );
                                  })()}
                                  <button
                                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors mt-1"
                                    onClick={() => { setMemberToDelete(member); setShowDeleteMemberModal(true); }}
                                  >
                                    usuń konto
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}

              </div>
            </TabsContent>
          )}

          {/* Panel Posługi — Gaming */}
          <TabsContent value="poslugi">
            <div className="space-y-4">
              {/* Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 p-4 sm:p-5 shadow-lg shadow-pink-500/20">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">⛪</div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Posługi Liturgiczne</h2>
                      <p className="text-pink-200 text-xs sm:text-sm">{poslugi.length} {poslugi.length === 1 ? 'posługa' : poslugi.length < 5 ? 'posługi' : 'posług'} w bazie</p>
                    </div>
                  </div>
                  {currentUser.typ === 'ksiadz' && (
                    <Button onClick={() => { if (poslugaEditor) poslugaEditor.commands.clearContent(); setShowAddPoslugaModal(true); }} className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-none">
                      <Plus className="w-4 h-4 mr-1" />
                      Dodaj
                    </Button>
                  )}
                </div>
              </div>

              {currentUser.typ === 'ksiadz' && (
                <div className="rounded-xl bg-pink-50 dark:bg-pink-900/10 border border-pink-200/50 dark:border-pink-800/30 px-4 py-3">
                  <p className="text-sm text-pink-700 dark:text-pink-300">
                    Posługi można przypisywać ministrantom w panelu &quot;Ministranci&quot;
                  </p>
                </div>
              )}

              <div className="grid gap-3">
                {poslugi.map(posluga => {
                  const kolory = KOLOR_KLASY[posluga.kolor] || KOLOR_KLASY.gray;
                  const isExpanded = expandedPosluga === posluga.id;
                  const hasDetails = !!(posluga.dlugi_opis || (posluga.zdjecia && posluga.zdjecia.length > 0) || posluga.youtube_url);
                  const youtubeEmbed = posluga.youtube_url ? getYoutubeEmbedUrl(posluga.youtube_url) : null;
                  return (
                    <div key={posluga.id} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
                      <div
                        className={`p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
                        onClick={() => hasDetails && setExpandedPosluga(isExpanded ? null : posluga.id)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {posluga.obrazek_url ? (
                            <img src={posluga.obrazek_url} alt={posluga.nazwa} className="h-14 sm:h-20 max-w-18 sm:max-w-24 object-contain shrink-0" />
                          ) : (
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${kolory.bg} flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-sm`}>
                              {posluga.emoji}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{posluga.nazwa}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{posluga.opis}</p>
                            {hasDetails && (
                              <div className="flex items-center gap-1 mt-1.5 text-xs text-pink-500 dark:text-pink-400 font-medium">
                                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <span>{isExpanded ? 'Zwiń' : 'Szczegóły'}</span>
                              </div>
                            )}
                          </div>
                          {currentUser.typ === 'ksiadz' && (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Edytuj posługę"
                                onClick={() => {
                                  setEditingPosluga({ ...posluga });
                                  setEditGalleryFiles([]);
                                  setEditGalleryPreviews([]);
                                  if (poslugaEditor) {
                                    const opis = posluga.dlugi_opis || '';
                                    const html = /<[a-z][\s\S]*>/i.test(opis) ? opis : opis.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('');
                                    poslugaEditor.commands.setContent(html);
                                  }
                                  setShowPoslugaEditModal(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Usuń posługę"
                                onClick={() => handleDeletePosluga(posluga.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-4 space-y-4">
                          {posluga.dlugi_opis && (
                            <div className="text-sm break-words text-gray-700 dark:text-gray-300">
                              {/<[a-z][\s\S]*>/i.test(posluga.dlugi_opis)
                                ? <div className="tiptap-posluga" dangerouslySetInnerHTML={{ __html: posluga.dlugi_opis }} />
                                : <p className="whitespace-pre-wrap">{posluga.dlugi_opis}</p>
                              }
                            </div>
                          )}
                          {posluga.zdjecia && posluga.zdjecia.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-500">Zdjęcia</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {posluga.zdjecia.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt={`${posluga.nazwa} ${i + 1}`} className="w-full h-32 sm:h-40 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {youtubeEmbed && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Video className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-500">Film</span>
                              </div>
                              <div className="aspect-video rounded-lg overflow-hidden">
                                <iframe
                                  src={youtubeEmbed}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={posluga.nazwa}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Panel Kalendarz Liturgiczny */}
          <TabsContent value="kalendarz">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-4 sm:p-5 shadow-lg shadow-orange-500/20">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">🗓️</div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Kalendarz Liturgiczny</h2>
                    <p className="text-orange-200 text-xs sm:text-sm">Okresy, święta i wspomnienia</p>
                  </div>
                </div>
              </div>

              {/* Nawigacja miesięczna */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                >
                  ←
                </Button>
                <h3 className="text-xl font-bold">
                  {MIESIACE[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                >
                  →
                </Button>
              </div>

              {/* Legenda kolorów */}
              <div className="flex flex-wrap gap-3 text-xs">
                {Object.entries(KOLORY_LITURGICZNE).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${val.dot}`} />
                    <span>{val.nazwa}</span>
                  </div>
                ))}
              </div>

              {/* Siatka kalendarza */}
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const days = getLiturgicalMonth(year, month);
                const firstDayOfMonth = new Date(year, month, 1);
                // poniedziałek = 0, niedziela = 6
                const startDow = (firstDayOfMonth.getDay() + 6) % 7;
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                const cells: (DzienLiturgiczny | null)[] = [];
                for (let i = 0; i < startDow; i++) cells.push(null);
                days.forEach(d => cells.push(d));
                while (cells.length % 7 !== 0) cells.push(null);

                return (
                  <div>
                    {/* Nagłówki dni tygodnia */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DNI_TYGODNIA.map(d => (
                        <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Komórki kalendarza */}
                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="h-16 sm:h-20 md:h-24" />;
                        }

                        const kolory = KOLORY_LITURGICZNE[day.kolor] || KOLORY_LITURGICZNE.zielony;
                        const isToday = day.date === todayStr;
                        const isUroczystosc = day.ranga === 'uroczystosc' || day.ranga === 'swieto';
                        const dayNum = new Date(day.date).getDate();

                        return (
                          <button
                            key={day.date}
                            onClick={() => setSelectedDay(day)}
                            className={`h-16 sm:h-20 md:h-24 rounded-lg p-1 text-left transition-all hover:ring-2 hover:ring-indigo-400 ${kolory.bg} ${kolory.border} border ${isToday ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${kolory.dot} shrink-0`} />
                              <span className={`text-sm font-bold ${kolory.text}`}>{dayNum}</span>
                            </div>
                            {day.nazwa && (
                              <p className={`text-[10px] md:text-xs leading-tight mt-0.5 ${kolory.text} ${isUroczystosc ? 'font-semibold' : ''} line-clamp-2`}>
                                {day.nazwa}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Dialog szczegółów dnia */}
            <Dialog open={!!selectedDay} onOpenChange={(open) => { if (!open) setSelectedDay(null); }}>
              <DialogContent>
                {selectedDay && (() => {
                  const kolory = KOLORY_LITURGICZNE[selectedDay.kolor] || KOLORY_LITURGICZNE.zielony;
                  const dateObj = new Date(selectedDay.date);
                  const dow = (dateObj.getDay() + 6) % 7;
                  return (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${kolory.dot}`} />
                          {dateObj.getDate()} {MIESIACE[dateObj.getMonth()]} {dateObj.getFullYear()}
                        </DialogTitle>
                        <DialogDescription>
                          {DNI_TYGODNIA_FULL[dow]}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${kolory.bg} ${kolory.border} border`}>
                          {selectedDay.nazwa ? (
                            <p className={`text-lg font-bold ${kolory.text}`}>{selectedDay.nazwa}</p>
                          ) : (
                            <p className={`text-lg ${kolory.text}`}>Dzień powszedni</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Okres</p>
                            <p className="font-medium">{selectedDay.okres}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ranga</p>
                            <p className="font-medium">{RANGI[selectedDay.ranga]}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Kolor liturgiczny</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${kolory.dot}`} />
                              <p className="font-medium">{kolory.nazwa}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Panel Modlitwy — Gaming */}
          <TabsContent value="modlitwy">
            <div className="space-y-4">
              {/* Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-4 sm:p-5 shadow-lg shadow-purple-500/20">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">🙏</div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Modlitwy</h2>
                    <p className="text-purple-200 text-xs sm:text-sm">Duchowe przygotowanie do służby</p>
                  </div>
                </div>
              </div>

              {/* Modlitwa przed Mszą */}
              <Accordion type="single" collapsible>
                <AccordionItem value="przed" className="border-0">
                  <AccordionTrigger className="rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20 border border-amber-200/50 dark:border-amber-700/50 px-4 py-3 hover:no-underline hover:from-amber-500/20 hover:to-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⛪</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">Modlitwa przed Mszą</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-amber-200/30 dark:border-amber-700/30 p-4 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {MODLITWY.przed}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="po" className="border-0">
                  <AccordionTrigger className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border border-emerald-200/50 dark:border-emerald-700/50 px-4 py-3 hover:no-underline hover:from-emerald-500/20 hover:to-green-500/20 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✨</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Modlitwa po Mszy Świętej</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30 p-4 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {MODLITWY.po}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lacina" className="border-0">
                  <AccordionTrigger className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 border border-indigo-200/50 dark:border-indigo-700/50 px-4 py-3 hover:no-underline hover:from-indigo-500/20 hover:to-blue-500/20 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📜</span>
                      <span className="font-bold text-indigo-800 dark:text-indigo-300">Odpowiedzi ministrantów (łacina)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-indigo-200/30 dark:border-indigo-700/30 p-4 whitespace-pre-line font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {MODLITWY.lacina}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Panel Wskazówki — Gaming */}
          <TabsContent value="wskazowki">
            <div className="space-y-4">
              {/* Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-4 sm:p-5 shadow-lg shadow-blue-500/20">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">📖</div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Przewodnik Ministranta</h2>
                    <p className="text-blue-200 text-xs sm:text-sm">Twoja baza wiedzy do służby</p>
                  </div>
                </div>
              </div>

              {/* Przed Mszą */}
              <div className="rounded-2xl overflow-hidden border border-emerald-200/50 dark:border-emerald-700/50 shadow-md shadow-emerald-500/5">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">🟢</span>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Przed Mszą Świętą</h3>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 space-y-2">
                  {WSKAZOWKI.przed.map((w, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{w}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Podczas Mszy */}
              <div className="rounded-2xl overflow-hidden border border-blue-200/50 dark:border-blue-700/50 shadow-md shadow-blue-500/5">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Podczas Mszy Świętej</h3>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 space-y-2">
                  {WSKAZOWKI.podczas.map((w, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{w}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funkcje podczas Mszy */}
              <div className="rounded-2xl overflow-hidden border border-purple-200/50 dark:border-purple-700/50 shadow-md shadow-purple-500/5">
                <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Funkcje podczas Mszy</h3>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 space-y-3">
                  {WSKAZOWKI.funkcje.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-purple-800 dark:text-purple-300">{f.nazwa}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{f.opis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ważne zasady */}
              <div className="rounded-2xl overflow-hidden border border-amber-200/50 dark:border-amber-700/50 shadow-md shadow-amber-500/5">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Ważne zasady</h3>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 space-y-2">
                  {WSKAZOWKI.zasady.map((z, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-amber-600 dark:text-amber-400 text-xs">✓</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{z}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal zaproszenia email */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wyślij zaproszenie email</DialogTitle>
            <DialogDescription>
              Wpisz adres email ministranta, który chcesz zaprosić
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="ministrant@email.pl"
              />
            </div>
            <Button onClick={handleSendInvite} className="w-full">
              Wyślij zaproszenie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Baner instalacji PWA na iOS */}
      {showIOSInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Zainstaluj aplikację</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Żeby dostawać powiadomienia push na iPhone:
                </p>
                <ol className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">1</span>
                    Kliknij ikonę <span className="inline-flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-gray-600 rounded"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></span> na dole Safari
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">2</span>
                    Wybierz <strong>&quot;Dodaj do ekranu początkowego&quot;</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">3</span>
                    Otwórz apkę z ekranu głównego
                  </li>
                </ol>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                onClick={() => {
                  setShowIOSInstallBanner(false);
                  localStorage.setItem('ios-install-dismissed', 'true');
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebracja — zatwierdzone zgłoszenie */}
      {celebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          {/* Konfetti */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C00', '#7C4DFF', '#00E676'][i % 10],
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              </div>
            ))}
          </div>
          {/* Karta */}
          <div className="pointer-events-auto animate-celebration-card bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-yellow-400 dark:border-yellow-500 p-6 sm:p-8 mx-4 max-w-sm text-center">
            <div className="text-5xl mb-3">
              <PartyPopper className="w-12 h-12 mx-auto text-yellow-500 animate-bounce" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Brawo!</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-3xl sm:text-4xl font-extrabold text-green-600 dark:text-green-400">+{celebration.punkty}</span>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">punktów za służbę</p>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3">
              <p className="text-xs text-indigo-600 dark:text-indigo-300">Łącznie masz już</p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{celebration.total} pkt</p>
            </div>
            <button
              className="pointer-events-auto mt-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setCelebration(null)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {/* Modal tworzenia/edycji wydarzenia */}
      <Dialog open={showSluzbaModal} onOpenChange={(open) => {
        setShowSluzbaModal(open);
        if (!open) {
          setSelectedSluzba(null);
          setSluzbaForm({ nazwa: '', data: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSluzba ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nazwa wydarzenia *</Label>
              <Input
                value={sluzbaForm.nazwa}
                onChange={(e) => setSluzbaForm({ ...sluzbaForm, nazwa: e.target.value })}
                placeholder="Msza Święta"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={sluzbaForm.data}
                  onChange={(e) => setSluzbaForm({ ...sluzbaForm, data: e.target.value })}
                />
              </div>
              <div>
                <Label>Godzina *</Label>
                <Input
                  type="time"
                  value={sluzbaForm.godzina}
                  onChange={(e) => setSluzbaForm({ ...sluzbaForm, godzina: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Przypisz funkcje</Label>
              <div className="space-y-2">
                {FUNKCJE_TYPES.map(funkcja => (
                  <div key={funkcja} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="w-full sm:w-32 text-sm font-medium">{funkcja}:</span>
                    <Select
                      value={sluzbaForm.funkcje[funkcja] || 'UNASSIGNED'}
                      onValueChange={(v) => setSluzbaForm({
                        ...sluzbaForm,
                        funkcje: { ...sluzbaForm.funkcje, [funkcja]: v }
                      })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="-- Nie przypisano --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">-- Nie przypisano --</SelectItem>
                        <SelectItem value="BEZ">🚫 Bez {funkcja}</SelectItem>
                        {members.filter(m => m.typ === 'ministrant').map(m => (
                          <SelectItem key={m.profile_id} value={m.profile_id}>
                            {m.imie} {m.nazwisko || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateSluzba} className="flex-1">
                {selectedSluzba ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
              </Button>
              {selectedSluzba && (
                <Button variant="destructive" onClick={handleDeleteSluzba}>
                  <X className="w-4 h-4 mr-1" />
                  Usuń wydarzenie
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal zarządzania funkcjami */}
      <Dialog open={showFunkcjeConfigModal} onOpenChange={setShowFunkcjeConfigModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zarządzaj funkcjami</DialogTitle>
            <DialogDescription>
              Dodawaj i usuwaj funkcje przypisywane do wydarzeń
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            {funkcjeConfig.map((f, idx) => {
              const kolory = KOLOR_KLASY[f.kolor] || KOLOR_KLASY.gray;
              return (
                <div
                  key={f.id}
                  draggable
                  onDragStart={() => setDraggedFunkcjaIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (draggedFunkcjaIdx !== null) handleMoveFunkcja(draggedFunkcjaIdx, idx); setDraggedFunkcjaIdx(null); }}
                  onDragEnd={() => setDraggedFunkcjaIdx(null)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border overflow-hidden transition-all ${draggedFunkcjaIdx === idx ? 'opacity-50 border-dashed border-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => handleMoveFunkcja(idx, idx - 1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleMoveFunkcja(idx, idx + 1)} disabled={idx === funkcjeConfig.length - 1} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 cursor-grab shrink-0" />
                  {f.obrazek_url ? (
                    <img src={f.obrazek_url} alt={f.nazwa} className="h-9 w-9 object-contain shrink-0 rounded-full" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full bg-white ${kolory.border} border-2 flex items-center justify-center text-base shrink-0`}>
                      {f.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.nazwa}</p>
                    {f.opis && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{f.opis}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingFunkcja({ ...f });
                        setEditFunkcjaFile(null);
                        setEditFunkcjaPreview('');
                        setEditFunkcjaGalleryFiles([]);
                        setEditFunkcjaGalleryPreviews([]);
                        if (poslugaEditor) {
                          const opis = f.dlugi_opis || '';
                          const html = /<[a-z][\s\S]*>/i.test(opis) ? opis : opis.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('');
                          poslugaEditor.commands.setContent(html);
                        }
                        setShowEditFunkcjaModal(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFunkcja(f.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Dodaj nową funkcję</p>
            <div>
              <Label>Nazwa *</Label>
              <Input
                value={newFunkcjaForm.nazwa}
                onChange={(e) => setNewFunkcjaForm({ ...newFunkcjaForm, nazwa: e.target.value })}
                placeholder="np. Łódka"
              />
            </div>
            <div>
              <Label>Opis (widoczny dla ministranta)</Label>
              <Input
                value={newFunkcjaForm.opis}
                onChange={(e) => setNewFunkcjaForm({ ...newFunkcjaForm, opis: e.target.value })}
                placeholder="np. Podajesz łódkę z kadzidłem"
              />
            </div>
            <Button onClick={handleAddFunkcja} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj funkcję
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal edycji funkcji */}
      <Dialog open={showEditFunkcjaModal} onOpenChange={(open) => {
        setShowEditFunkcjaModal(open);
        if (!open) {
          setEditingFunkcja(null);
          setEditFunkcjaFile(null);
          setEditFunkcjaPreview('');
          setEditFunkcjaGalleryFiles([]);
          setEditFunkcjaGalleryPreviews([]);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj funkcję</DialogTitle>
          </DialogHeader>
          {editingFunkcja && (
            <div className="space-y-4">
              <div>
                <Label>Nazwa</Label>
                <Input
                  value={editingFunkcja.nazwa}
                  onChange={(e) => setEditingFunkcja({ ...editingFunkcja, nazwa: e.target.value })}
                />
              </div>
              <div>
                <Label>Krótki opis</Label>
                <Input
                  value={editingFunkcja.opis}
                  onChange={(e) => setEditingFunkcja({ ...editingFunkcja, opis: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={editingFunkcja.emoji}
                    onChange={(e) => setEditingFunkcja({ ...editingFunkcja, emoji: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Kolor</Label>
                  <Select value={editingFunkcja.kolor} onValueChange={(v) => setEditingFunkcja({ ...editingFunkcja, kolor: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(KOLOR_KLASY).map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Własny obrazek (zamiast emoji)</Label>
                <div className="flex items-center gap-3 mt-1">
                  {(editFunkcjaPreview || editingFunkcja.obrazek_url) && (
                    <img src={editFunkcjaPreview || editingFunkcja.obrazek_url} alt={editingFunkcja.nazwa} className="w-12 h-12 rounded-full object-cover border" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="flex-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setEditFunkcjaFile(file);
                      setEditFunkcjaPreview(URL.createObjectURL(file));
                    }}
                  />
                  {(editFunkcjaPreview || editingFunkcja.obrazek_url) && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditFunkcjaFile(null);
                      setEditFunkcjaPreview('');
                      setEditingFunkcja({ ...editingFunkcja, obrazek_url: undefined });
                    }}>
                      Usuń
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Jeśli dodasz obrazek, zastąpi on emoji</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Karta szczegółów</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Długi opis</Label>
                    {poslugaEditor && (
                      <div className="border rounded-md overflow-hidden mt-1">
                        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/50">
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('bold') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('italic') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('underline') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-3.5 h-3.5" /></Button>
                          <div className="w-px h-5 bg-border mx-0.5" />
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-3.5 h-3.5" /></Button>
                          <div className="w-px h-5 bg-border mx-0.5" />
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('bulletList') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleBulletList().run()}><List className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('orderedList') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-3.5 h-3.5" /></Button>
                        </div>
                        <EditorContent editor={poslugaEditor} />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Zdjęcia do galerii</Label>
                    {((editingFunkcja.zdjecia && editingFunkcja.zdjecia.length > 0) || editFunkcjaGalleryPreviews.length > 0) && (
                      <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                        {(editingFunkcja.zdjecia || []).map((url, i) => (
                          <div key={`existing-${i}`} className="relative group">
                            <img src={url} alt={`Zdjęcie ${i + 1}`} className="w-full h-24 object-cover rounded border" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const updated = (editingFunkcja.zdjecia || []).filter((_, idx) => idx !== i);
                                setEditingFunkcja({ ...editingFunkcja, zdjecia: updated });
                                deletePoslugaImage(url);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {editFunkcjaGalleryPreviews.map((preview, i) => (
                          <div key={`new-${i}`} className="relative group">
                            <img src={preview} alt={`Nowe ${i + 1}`} className="w-full h-24 object-cover rounded border border-green-300" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setEditFunkcjaGalleryFiles(editFunkcjaGalleryFiles.filter((_, idx) => idx !== i));
                                setEditFunkcjaGalleryPreviews(editFunkcjaGalleryPreviews.filter((_, idx) => idx !== i));
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setEditFunkcjaGalleryFiles([...editFunkcjaGalleryFiles, ...files]);
                        setEditFunkcjaGalleryPreviews([...editFunkcjaGalleryPreviews, ...files.map(ff => URL.createObjectURL(ff))]);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Link do YouTube</Label>
                    <Input
                      value={editingFunkcja.youtube_url || ''}
                      onChange={(e) => setEditingFunkcja({ ...editingFunkcja, youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {editingFunkcja.youtube_url && getYoutubeEmbedUrl(editingFunkcja.youtube_url) && (
                      <div className="aspect-video rounded-lg overflow-hidden mt-2">
                        <iframe
                          src={getYoutubeEmbedUrl(editingFunkcja.youtube_url)!}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Podgląd"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveFunkcjaEdit} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Zapisz zmiany
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal tworzenia/edycji szablonu */}
      <Dialog open={showSzablonModal} onOpenChange={(open) => {
        setShowSzablonModal(open);
        if (!open) {
          setSelectedSzablon(null);
          setSzablonForm({ nazwa: '', godzina: '', funkcje: {} as Record<FunkcjaType, string> });
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSzablon ? 'Edytuj szablon' : 'Nowy szablon'}</DialogTitle>
            <DialogDescription>
              Szablon pozwala szybko tworzyć powtarzające się wydarzenia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nazwa szablonu *</Label>
              <Input
                value={szablonForm.nazwa}
                onChange={(e) => setSzablonForm({ ...szablonForm, nazwa: e.target.value })}
                placeholder="np. Msza Święta niedzielna"
              />
            </div>

            <div>
              <Label>Godzina *</Label>
              <Input
                type="time"
                value={szablonForm.godzina}
                onChange={(e) => setSzablonForm({ ...szablonForm, godzina: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-2 block">Funkcje w szablonie</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Wybierz, które funkcje mają być aktywne. Ministrantów przypiszesz przy publikacji.</p>
              <div className="space-y-2">
                {FUNKCJE_TYPES.map(funkcja => (
                  <div key={funkcja} className="flex items-center gap-2">
                    <span className="w-32 text-sm font-medium">{funkcja}:</span>
                    <Select
                      value={szablonForm.funkcje[funkcja] || 'UNASSIGNED'}
                      onValueChange={(v) => setSzablonForm({
                        ...szablonForm,
                        funkcje: { ...szablonForm.funkcje, [funkcja]: v }
                      })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Aktywna (do przypisania)</SelectItem>
                        <SelectItem value="BEZ">Wyłączona</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateSzablon} className="flex-1">
                {selectedSzablon ? 'Zapisz zmiany' : 'Utwórz szablon'}
              </Button>
              {selectedSzablon && (
                <Button variant="destructive" onClick={handleDeleteSzablon}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Usuń
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal publikacji szablonu */}
      <Dialog open={showPublishSzablonModal} onOpenChange={(open) => {
        setShowPublishSzablonModal(open);
        if (!open) {
          setSelectedSzablon(null);
          setPublishDate('');
          setPublishFunkcje({} as Record<FunkcjaType, string>);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publikuj wydarzenie</DialogTitle>
            <DialogDescription>
              Szablon: {selectedSzablon?.nazwa} • {selectedSzablon?.godzina}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data wydarzenia *</Label>
              <Input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Przypisz ministrantów do funkcji</Label>
              <div className="space-y-2">
                {FUNKCJE_TYPES.filter(typ => selectedSzablon?.funkcje[typ] !== 'BEZ').map(funkcja => (
                  <div key={funkcja} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="w-full sm:w-32 text-sm font-medium">{funkcja}:</span>
                    <Select
                      value={publishFunkcje[funkcja] || 'UNASSIGNED'}
                      onValueChange={(v) => setPublishFunkcje({
                        ...publishFunkcje,
                        [funkcja]: v
                      })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="-- Nie przypisano --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">-- Nie przypisano --</SelectItem>
                        {members.filter(m => m.typ === 'ministrant').map(m => (
                          <SelectItem key={m.profile_id} value={m.profile_id}>
                            {m.imie} {m.nazwisko || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handlePublishSzablon} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              Publikuj wydarzenie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal posług */}
      <Dialog open={showPoslugiModal} onOpenChange={(open) => {
        setShowPoslugiModal(open);
        if (!open) setSelectedMember(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Przypisz posługi - {selectedMember?.imie} {selectedMember?.nazwisko || ''}</DialogTitle>
            <DialogDescription>
              Zaznacz posługi, które będzie pełnił ministrant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {poslugi.map(posluga => {
              const kolory = KOLOR_KLASY[posluga.kolor] || KOLOR_KLASY.gray;
              return (
                <div key={posluga.id} className="flex items-start gap-3 p-3 border rounded">
                  <input
                    type="checkbox"
                    checked={selectedMember?.role.includes(posluga.slug) || false}
                    onChange={(e) => {
                      if (!selectedMember) return;
                      const newRole = e.target.checked
                        ? [...selectedMember.role, posluga.slug]
                        : selectedMember.role.filter(r => r !== posluga.slug);
                      setSelectedMember({ ...selectedMember, role: newRole });
                    }}
                    className="mt-1"
                  />
                  <div className={`w-10 h-10 rounded-full ${kolory.bg} flex items-center justify-center text-lg shrink-0 overflow-hidden`}>
                    {posluga.obrazek_url ? (
                      <img src={posluga.obrazek_url} alt={posluga.nazwa} className="w-full h-full object-cover" />
                    ) : posluga.emoji}
                  </div>
                  <div>
                    <p className="font-semibold">{posluga.nazwa}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{posluga.opis}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpdatePoslugi} className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              Zapisz
            </Button>
            <Button variant="outline" onClick={() => setShowPoslugiModal(false)} className="flex-1">
              Anuluj
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal zmiany grupy */}
      <Dialog open={showGrupaModal} onOpenChange={(open) => {
        setShowGrupaModal(open);
        if (!open) setSelectedMember(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień grupę - {selectedMember?.imie} {selectedMember?.nazwisko || ''}</DialogTitle>
            <DialogDescription>
              Wybierz grupę dla ministranta
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {grupy.map(grupa => {
              const kolory = KOLOR_KLASY[grupa.kolor] || KOLOR_KLASY.gray;
              return (
                <Button
                  key={grupa.id}
                  onClick={() => handleUpdateGrupa(grupa.id)}
                  className={`h-auto py-4 justify-start ${kolory.bg} ${kolory.hover} ${kolory.text}`}
                >
                  <div className="text-left">
                    <p className="font-bold">{grupa.emoji} {grupa.nazwa}</p>
                    <p className="text-sm">{grupa.opis}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal maila zbiorczego - multi-select */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wyślij maila zbiorczego</DialogTitle>
            <DialogDescription>
              Wybierz odbiorców wiadomości
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Wyślij do wybranych ministrantów */}
            <button
              onClick={() => {
                if (emailSelectedGrupy.includes('__pick__')) {
                  setEmailSelectedGrupy([]);
                  setEmailSelectedMinistranci([]);
                  setEmailSearchMinistrant('');
                } else {
                  setEmailSelectedGrupy(['__pick__']);
                }
              }}
              className={`w-full h-auto py-4 px-4 rounded-lg flex items-center justify-between transition-all bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 ${emailSelectedGrupy.includes('__pick__') ? 'ring-2 ring-offset-2 ring-indigo-400 border-indigo-400' : 'opacity-70'}`}
            >
              <span className="font-bold flex items-center gap-2">
                <input type="checkbox" checked={emailSelectedGrupy.includes('__pick__')} readOnly className="w-4 h-4" />
                Wyślij do ...
              </span>
              {emailSelectedMinistranci.length > 0 && (
                <Badge variant="secondary">{emailSelectedMinistranci.length} wybrano</Badge>
              )}
            </button>
            {emailSelectedGrupy.includes('__pick__') && (
              <div className="ml-2 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Szukaj ministranta..."
                    value={emailSearchMinistrant}
                    onChange={(e) => setEmailSearchMinistrant(e.target.value)}
                    className="pl-9 bg-white dark:bg-gray-900"
                  />
                  {emailSearchMinistrant && (
                    <button onClick={() => setEmailSearchMinistrant('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2 dark:border-gray-700">
                  {members.filter(m => m.typ === 'ministrant' && (!emailSearchMinistrant || `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(emailSearchMinistrant.toLowerCase()))).map(m => {
                    const isChecked = emailSelectedMinistranci.includes(m.profile_id);
                    const grupa = m.grupa ? grupy.find(g => g.id === m.grupa) : null;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setEmailSelectedMinistranci(prev =>
                            prev.includes(m.profile_id)
                              ? prev.filter(id => id !== m.profile_id)
                              : [...prev, m.profile_id]
                          );
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <input type="checkbox" checked={isChecked} readOnly className="w-4 h-4 shrink-0" />
                        <span className="truncate">{m.imie} {m.nazwisko || ''}</span>
                        {grupa && <span className="text-xs text-gray-400 shrink-0">{grupa.emoji}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Do wszystkich */}
            {!emailSelectedGrupy.includes('__pick__') && (() => {
              const allMinistrants = members.filter(m => m.typ === 'ministrant');
              const allSelected = emailSelectedGrupy.includes('__all__');
              return (
                <button
                  onClick={() => {
                    if (allSelected) {
                      setEmailSelectedGrupy([]);
                    } else {
                      setEmailSelectedGrupy(['__all__']);
                    }
                  }}
                  className={`w-full h-auto py-4 px-4 rounded-lg flex items-center justify-between transition-all bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 ${allSelected ? 'ring-2 ring-offset-2 ring-blue-400 border-blue-400' : 'opacity-70'}`}
                >
                  <span className="font-bold flex items-center gap-2">
                    <input type="checkbox" checked={allSelected} readOnly className="w-4 h-4" />
                    Do wszystkich
                  </span>
                  <Badge variant="secondary">{allMinistrants.length} osób</Badge>
                </button>
              );
            })()}

            {/* Grupy */}
            {!emailSelectedGrupy.includes('__all__') && !emailSelectedGrupy.includes('__pick__') && grupy.map(grupa => {
              const groupMembers = members.filter(m => m.grupa === grupa.id && m.typ === 'ministrant');
              const kolory = KOLOR_KLASY[grupa.kolor] || KOLOR_KLASY.gray;
              const isSelected = emailSelectedGrupy.includes(grupa.id);

              return groupMembers.length > 0 && (
                <button
                  key={grupa.id}
                  onClick={() => {
                    setEmailSelectedGrupy(prev =>
                      prev.includes(grupa.id)
                        ? prev.filter(g => g !== grupa.id)
                        : [...prev, grupa.id]
                    );
                  }}
                  className={`w-full h-auto py-4 px-4 rounded-lg flex items-center justify-between transition-all ${kolory.bg} ${kolory.text} ${isSelected ? `ring-2 ring-offset-2 ${kolory.border}` : 'opacity-70'}`}
                >
                  <span className="font-bold flex items-center gap-2">
                    <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4" />
                    {grupa.emoji} {grupa.nazwa}
                  </span>
                  <Badge variant="secondary">{groupMembers.length} osób</Badge>
                </button>
              );
            })}
          </div>
          {(emailSelectedGrupy.length > 0 && (emailSelectedGrupy.includes('__pick__') ? emailSelectedMinistranci.length > 0 : true)) && (
            <Button
              className="w-full mt-2"
              onClick={() => {
                let emails = '';
                if (emailSelectedGrupy.includes('__pick__')) {
                  emails = members
                    .filter(m => emailSelectedMinistranci.includes(m.profile_id))
                    .map(m => m.email)
                    .join(',');
                } else if (emailSelectedGrupy.includes('__all__')) {
                  emails = members.filter(m => m.typ === 'ministrant').map(m => m.email).join(',');
                } else {
                  emails = members
                    .filter(m => emailSelectedGrupy.includes(m.grupa || '') && m.typ === 'ministrant')
                    .map(m => m.email)
                    .join(',');
                }
                window.location.href = `mailto:${emails}`;
                setShowEmailModal(false);
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              {emailSelectedGrupy.includes('__pick__')
                ? `Wyślij do ${emailSelectedMinistranci.length} ${emailSelectedMinistranci.length === 1 ? 'osoby' : 'osób'}`
                : emailSelectedGrupy.includes('__all__')
                  ? 'Wyślij do wszystkich'
                  : `Wyślij do ${emailSelectedGrupy.length} ${emailSelectedGrupy.length === 1 ? 'grupy' : 'grup'}`}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal edycji grup */}
      <Dialog open={showGrupyEditModal} onOpenChange={setShowGrupyEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zarządzaj grupami</DialogTitle>
            <DialogDescription>
              Edytuj nazwy, dodawaj lub usuwaj grupy ministrantów
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {grupy.map(grupa => {
              const kolory = KOLOR_KLASY[grupa.kolor] || KOLOR_KLASY.gray;
              return (
                <div key={grupa.id} className={`flex items-center gap-3 p-3 rounded-lg border ${kolory.border}`}>
                  <span className="text-xl">{grupa.emoji}</span>
                  <Input
                    value={grupa.nazwa}
                    onChange={(e) => handleRenameGrupa(grupa.id, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Usuń grupę"
                    onClick={() => handleDeleteGrupa(grupa.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">Dodaj nową grupę</h4>
            <div className="space-y-3">
              <div>
                <Label>Nazwa grupy</Label>
                <Input
                  value={newGrupaForm.nazwa}
                  onChange={(e) => setNewGrupaForm({ ...newGrupaForm, nazwa: e.target.value })}
                  placeholder="Np. Schola liturgiczna"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={newGrupaForm.emoji}
                    onChange={(e) => setNewGrupaForm({ ...newGrupaForm, emoji: e.target.value })}
                    placeholder="⚪"
                  />
                </div>
                <div>
                  <Label>Kolor</Label>
                  <Select value={newGrupaForm.kolor} onValueChange={(v) => setNewGrupaForm({ ...newGrupaForm, kolor: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(KOLOR_KLASY).map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Opis</Label>
                <Input
                  value={newGrupaForm.opis}
                  onChange={(e) => setNewGrupaForm({ ...newGrupaForm, opis: e.target.value })}
                  placeholder="Krótki opis grupy"
                />
              </div>
              <Button onClick={handleAddGrupa} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj grupę
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal edycji posługi */}
      <Dialog open={showPoslugaEditModal} onOpenChange={(open) => {
        setShowPoslugaEditModal(open);
        if (!open) {
          setEditingPosluga(null);
          setEditPoslugaFile(null);
          setEditPoslugaPreview('');
          setEditGalleryFiles([]);
          setEditGalleryPreviews([]);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj posługę</DialogTitle>
          </DialogHeader>
          {editingPosluga && (
            <div className="space-y-4">
              <div>
                <Label>Nazwa</Label>
                <Input
                  value={editingPosluga.nazwa}
                  onChange={(e) => setEditingPosluga({ ...editingPosluga, nazwa: e.target.value })}
                />
              </div>
              <div>
                <Label>Krótki opis</Label>
                <Input
                  value={editingPosluga.opis}
                  onChange={(e) => setEditingPosluga({ ...editingPosluga, opis: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={editingPosluga.emoji}
                    onChange={(e) => setEditingPosluga({ ...editingPosluga, emoji: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Kolor</Label>
                  <Select value={editingPosluga.kolor} onValueChange={(v) => setEditingPosluga({ ...editingPosluga, kolor: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(KOLOR_KLASY).map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Własny obrazek (zamiast emoji)</Label>
                <div className="flex items-center gap-3 mt-1">
                  {(editPoslugaPreview || editingPosluga.obrazek_url) && (
                    <img src={editPoslugaPreview || editingPosluga.obrazek_url} alt={editingPosluga.nazwa} className="w-12 h-12 rounded-full object-cover border" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setEditPoslugaFile(file);
                      setEditPoslugaPreview(URL.createObjectURL(file));
                    }}
                  />
                  {(editPoslugaPreview || editingPosluga.obrazek_url) && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditPoslugaFile(null);
                      setEditPoslugaPreview('');
                      setEditingPosluga({ ...editingPosluga, obrazek_url: undefined });
                    }}>
                      Usuń
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Jeśli dodasz obrazek, zastąpi on emoji</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Karta szczegółów</h3>

                <div className="space-y-4">
                  <div>
                    <Label>Długi opis</Label>
                    {poslugaEditor && (
                      <div className="border rounded-md overflow-hidden mt-1">
                        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/50">
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('bold') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('italic') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('underline') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-3.5 h-3.5" /></Button>
                          <div className="w-px h-5 bg-border mx-0.5" />
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-3.5 h-3.5" /></Button>
                          <div className="w-px h-5 bg-border mx-0.5" />
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('bulletList') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleBulletList().run()}><List className="w-3.5 h-3.5" /></Button>
                          <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('orderedList') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-3.5 h-3.5" /></Button>
                        </div>
                        <EditorContent editor={poslugaEditor} />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Zdjęcia do galerii</Label>
                    {((editingPosluga.zdjecia && editingPosluga.zdjecia.length > 0) || editGalleryPreviews.length > 0) && (
                      <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                        {(editingPosluga.zdjecia || []).map((url, i) => (
                          <div key={`existing-${i}`} className="relative group">
                            <img src={url} alt={`Zdjęcie ${i + 1}`} className="w-full h-24 object-cover rounded border" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const updated = (editingPosluga.zdjecia || []).filter((_, idx) => idx !== i);
                                setEditingPosluga({ ...editingPosluga, zdjecia: updated });
                                deletePoslugaImage(url);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {editGalleryPreviews.map((preview, i) => (
                          <div key={`new-${i}`} className="relative group">
                            <img src={preview} alt={`Nowe ${i + 1}`} className="w-full h-24 object-cover rounded border border-green-300" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setEditGalleryFiles(editGalleryFiles.filter((_, idx) => idx !== i));
                                setEditGalleryPreviews(editGalleryPreviews.filter((_, idx) => idx !== i));
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setEditGalleryFiles([...editGalleryFiles, ...files]);
                        setEditGalleryPreviews([...editGalleryPreviews, ...files.map(f => URL.createObjectURL(f))]);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Link do YouTube</Label>
                    <Input
                      value={editingPosluga.youtube_url || ''}
                      onChange={(e) => setEditingPosluga({ ...editingPosluga, youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {editingPosluga.youtube_url && getYoutubeEmbedUrl(editingPosluga.youtube_url) && (
                      <div className="aspect-video rounded-lg overflow-hidden mt-2">
                        <iframe
                          src={getYoutubeEmbedUrl(editingPosluga.youtube_url)!}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Podgląd"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdatePoslugaDetails} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Zapisz zmiany
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal dodawania posługi */}
      <Dialog open={showAddPoslugaModal} onOpenChange={(open) => {
        setShowAddPoslugaModal(open);
        if (!open) {
          setNewGalleryFiles([]);
          setNewGalleryPreviews([]);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dodaj nową posługę</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nazwa posługi *</Label>
              <Input
                value={newPoslugaForm.nazwa}
                onChange={(e) => setNewPoslugaForm({ ...newPoslugaForm, nazwa: e.target.value })}
                placeholder="Np. Ministrant wody"
              />
            </div>
            <div>
              <Label>Krótki opis</Label>
              <Input
                value={newPoslugaForm.opis}
                onChange={(e) => setNewPoslugaForm({ ...newPoslugaForm, opis: e.target.value })}
                placeholder="Krótki opis posługi"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Emoji</Label>
                <Input
                  value={newPoslugaForm.emoji}
                  onChange={(e) => setNewPoslugaForm({ ...newPoslugaForm, emoji: e.target.value })}
                  placeholder="⭐"
                />
              </div>
              <div>
                <Label>Kolor</Label>
                <Select value={newPoslugaForm.kolor} onValueChange={(v) => setNewPoslugaForm({ ...newPoslugaForm, kolor: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(KOLOR_KLASY).map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Własny obrazek (zamiast emoji)</Label>
              <div className="flex items-center gap-3 mt-1">
                {newPoslugaPreview && (
                  <img src={newPoslugaPreview} alt="podgląd" className="w-12 h-12 rounded-full object-cover border" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setNewPoslugaFile(file);
                    setNewPoslugaPreview(URL.createObjectURL(file));
                  }}
                />
                {newPoslugaPreview && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setNewPoslugaFile(null);
                    setNewPoslugaPreview('');
                  }}>
                    Usuń
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Jeśli dodasz obrazek, zastąpi on emoji</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Karta szczegółów</h3>

              <div className="space-y-4">
                <div>
                  <Label>Długi opis</Label>
                  {poslugaEditor && (
                    <div className="border rounded-md overflow-hidden mt-1">
                      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/50">
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('bold') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Button>
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('italic') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Button>
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('underline') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-3.5 h-3.5" /></Button>
                        <div className="w-px h-5 bg-border mx-0.5" />
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-3.5 h-3.5" /></Button>
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-3.5 h-3.5" /></Button>
                        <div className="w-px h-5 bg-border mx-0.5" />
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('bulletList') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleBulletList().run()}><List className="w-3.5 h-3.5" /></Button>
                        <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${poslugaEditor.isActive('orderedList') ? 'bg-accent' : ''}`} onClick={() => poslugaEditor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-3.5 h-3.5" /></Button>
                      </div>
                      <EditorContent editor={poslugaEditor} />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Zdjęcia do galerii</Label>
                  {newGalleryPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                      {newGalleryPreviews.map((preview, i) => (
                        <div key={i} className="relative group">
                          <img src={preview} alt={`Nowe ${i + 1}`} className="w-full h-24 object-cover rounded border" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setNewGalleryFiles(newGalleryFiles.filter((_, idx) => idx !== i));
                              setNewGalleryPreviews(newGalleryPreviews.filter((_, idx) => idx !== i));
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setNewGalleryFiles([...newGalleryFiles, ...files]);
                      setNewGalleryPreviews([...newGalleryPreviews, ...files.map(f => URL.createObjectURL(f))]);
                    }}
                  />
                </div>

                <div>
                  <Label>Link do YouTube</Label>
                  <Input
                    value={newPoslugaForm.youtube_url}
                    onChange={(e) => setNewPoslugaForm({ ...newPoslugaForm, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {newPoslugaForm.youtube_url && getYoutubeEmbedUrl(newPoslugaForm.youtube_url) && (
                    <div className="aspect-video rounded-lg overflow-hidden mt-2">
                      <iframe
                        src={getYoutubeEmbedUrl(newPoslugaForm.youtube_url)!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Podgląd"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={handleAddPosluga} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj posługę
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal edycji profilu */}
      <Dialog open={showEditProfilModal} onOpenChange={setShowEditProfilModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj profil</DialogTitle>
            <DialogDescription>Zmień swoje dane.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Imię *</Label>
              <Input
                value={editProfilForm.imie}
                onChange={(e) => setEditProfilForm({ ...editProfilForm, imie: e.target.value })}
                placeholder="Twoje imię"
              />
            </div>
            <div>
              <Label>Nazwisko</Label>
              <Input
                value={editProfilForm.nazwisko}
                onChange={(e) => setEditProfilForm({ ...editProfilForm, nazwisko: e.target.value })}
                placeholder="Twoje nazwisko"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editProfilForm.email}
                onChange={(e) => setEditProfilForm({ ...editProfilForm, email: e.target.value })}
                placeholder="Twój email"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              Zapisz zmiany
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal zgłoszenia obecności — Gaming */}
      <Dialog open={showZglosModal} onOpenChange={setShowZglosModal}>
        <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl shadow-emerald-500/10">
          <DialogTitle className="sr-only">Zgłoś obecność</DialogTitle>
          <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 p-4">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nowa misja
            </h3>
            <p className="text-emerald-100 text-xs mt-1">Masz {getConfigValue('limit_dni_zgloszenie', 2)} dni od daty służby na zgłoszenie</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Data służby *</Label>
              <Input type="date" value={zglosForm.data} max={new Date().toISOString().split('T')[0]} onChange={(e) => setZglosForm({ ...zglosForm, data: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Godzina (opcjonalnie)</Label>
              <Input type="time" value={zglosForm.godzina} onChange={(e) => setZglosForm({ ...zglosForm, godzina: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Typ</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => setZglosForm({ ...zglosForm, typ: 'msza' })} className={`p-3 rounded-xl border-2 text-center transition-all ${zglosForm.typ === 'msza' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <span className="text-2xl">⛪</span>
                  <p className="text-sm font-bold mt-1">Msza</p>
                </button>
                <button onClick={() => setZglosForm({ ...zglosForm, typ: 'nabożeństwo' })} className={`p-3 rounded-xl border-2 text-center transition-all ${zglosForm.typ === 'nabożeństwo' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <span className="text-2xl">🙏</span>
                  <p className="text-sm font-bold mt-1">Nabożeństwo</p>
                </button>
              </div>
            </div>
            {zglosForm.typ === 'nabożeństwo' && (
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Rodzaj nabożeństwa</Label>
                <Select value={zglosForm.nazwa_nabożeństwa} onValueChange={(v) => setZglosForm({ ...zglosForm, nazwa_nabożeństwa: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="droga_krzyzowa">Droga Krzyżowa</SelectItem>
                    <SelectItem value="gorzkie_zale">Gorzkie Żale</SelectItem>
                    <SelectItem value="majowe">Nabożeństwo Majowe</SelectItem>
                    <SelectItem value="rozaniec">Różaniec</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {zglosForm.data && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                {(() => {
                  const { bazowe, mnoznik } = obliczPunktyBazowe(zglosForm.data, zglosForm.typ, zglosForm.nazwa_nabożeństwa);
                  const finalne = Math.round(bazowe * mnoznik);
                  return (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /><span className="font-bold text-sm">Nagroda:</span></div>
                      <span className="font-extrabold text-xl text-amber-600 dark:text-amber-400 tabular-nums">{finalne} XP {mnoznik > 1 && <span className="text-xs text-gray-500">({bazowe}×{mnoznik})</span>}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            <Button onClick={zglosObecnosc} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-base" disabled={!zglosForm.data || (zglosForm.typ === 'nabożeństwo' && !zglosForm.nazwa_nabożeństwa)}>
              <Send className="w-5 h-5 mr-2" />
              Wyślij zgłoszenie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pogląd ogłoszenia - widok ministranta */}
      <Dialog open={!!previewOgloszenie} onOpenChange={(open) => { if (!open) setPreviewOgloszenie(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Podgląd</DialogTitle>
            <DialogDescription>Tak wygląda {previewOgloszenie?.kategoria === 'dyskusja' ? 'dyskusja' : 'ogłoszenie'} w panelu ministranta</DialogDescription>
          </DialogHeader>
          {previewOgloszenie && (
            <Card className={previewOgloszenie.kategoria === 'dyskusja' ? '' : 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20'}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  {previewOgloszenie.przypiety && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                  <Badge className={`text-xs ${previewOgloszenie.kategoria === 'dyskusja' ? '' : 'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600'}`} variant={previewOgloszenie.kategoria === 'dyskusja' ? 'secondary' : 'default'}>
                    {previewOgloszenie.kategoria === 'dyskusja' ? 'Dyskusja' : 'Ogłoszenie'}
                  </Badge>
                  {previewOgloszenie.grupa_docelowa !== 'wszyscy' && previewOgloszenie.grupa_docelowa?.split(',').map(g => g.trim()).filter(Boolean).map(g => (
                    <Badge key={g} variant="outline" className="text-xs">{grupy.find(gr => gr.nazwa === g)?.emoji} {g}</Badge>
                  ))}
                </div>
                {previewOgloszenie.kategoria === 'dyskusja' && previewOgloszenie.tytul && (
                  <p className="font-semibold text-sm mt-1">{previewOgloszenie.tytul}</p>
                )}
                {previewOgloszenie.tresc && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{renderTresc(previewOgloszenie.tresc)}</div>
                )}
              </CardHeader>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal nowego wątku */}
      <Dialog open={showNewWatekModal} onOpenChange={(open) => {
        setShowNewWatekModal(open);
        if (!open) {
          setEditingWatek(null);
          setNewWatekForm({ tytul: '', tresc: '', kategoria: 'ogłoszenie', grupa_docelowa: 'wszyscy', archiwum_data: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWatek ? (newWatekForm.kategoria === 'ogłoszenie' ? 'Edytuj ogłoszenie' : 'Edytuj wątek') : newWatekForm.kategoria === 'ogłoszenie' ? 'Nowe ogłoszenie' : 'Nowa dyskusja'}</DialogTitle>
            <DialogDescription>
              {editingWatek ? (newWatekForm.kategoria === 'ogłoszenie' ? 'Zmień treść ogłoszenia' : 'Zmień treść wątku') : newWatekForm.kategoria === 'ogłoszenie' ? 'Napisz ogłoszenie dla ministrantów' : 'Rozpocznij nową dyskusję'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {newWatekForm.kategoria === 'dyskusja' && (
              <div>
                <Label>Tytuł *</Label>
                <Input
                  value={newWatekForm.tytul}
                  onChange={(e) => setNewWatekForm({ ...newWatekForm, tytul: e.target.value })}
                  placeholder="Tytuł dyskusji"
                />
              </div>
            )}
            <div className="relative">
              <Label className="mb-1 block">Treść {newWatekForm.kategoria === 'ogłoszenie' ? '*' : ''}</Label>
              {/* Toolbar */}
              {tiptapEditor && (
                <div className="flex flex-wrap items-center gap-0.5 p-1 border border-b-0 border-input rounded-t-md bg-muted/50">
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('bold') ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Button>
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('italic') ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Button>
                  <div className="w-px h-5 bg-border mx-0.5" />
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-3.5 h-3.5" /></Button>
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-3.5 h-3.5" /></Button>
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-3.5 h-3.5" /></Button>
                  <div className="w-px h-5 bg-border mx-0.5" />
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-3.5 h-3.5" /></Button>
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-3.5 h-3.5" /></Button>
                  <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`} onClick={() => tiptapEditor.chain().focus().setTextAlign('right').run()}><AlignRight className="w-3.5 h-3.5" /></Button>
                  <div className="w-px h-5 bg-border mx-0.5" />
                  <div className="w-px h-5 bg-border mx-0.5" />
                  {/* Kolory */}
                  {['#000000', '#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c'].map(color => (
                    <button key={color} type="button" className={`w-5 h-5 rounded-full border-2 ${tiptapEditor.isActive('textStyle', { color }) ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => tiptapEditor.chain().focus().setColor(color).run()} />
                  ))}
                  <button type="button" className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[8px]" onClick={() => tiptapEditor.chain().focus().unsetColor().run()}>✕</button>
                  <div className="w-px h-5 bg-border mx-0.5" />
                  {/* Wstaw plik */}
                  <label>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 gap-1 cursor-pointer" asChild>
                      <span>{isUploadingInline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}<span className="text-[10px]">Wstaw plik</span></span>
                    </Button>
                    <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" disabled={isUploadingInline} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAndInsertFile(file); e.target.value = ''; }} />
                  </label>
                  {/* YouTube */}
                  <Button type="button" variant="ghost" size="sm" className={`h-7 px-2 gap-1 ${showYoutubeInput ? 'bg-accent' : ''}`} onClick={() => { setShowYoutubeInput(!showYoutubeInput); setYoutubeUrl(''); }}><Youtube className="w-3.5 h-3.5" /><span className="text-[10px]">Wstaw filmik</span></Button>
                  {/* Emoji */}
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowEmojiPicker(showEmojiPicker === 'watek' ? null : 'watek')}><Smile className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {/* YouTube input */}
              {showYoutubeInput && (
                <div className="flex items-center gap-1 p-1.5 border-x border-input bg-red-50 dark:bg-red-950/20">
                  <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 text-xs rounded border border-input bg-background"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (youtubeUrl.trim()) {
                          tiptapEditor?.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run();
                          setYoutubeUrl('');
                          setShowYoutubeInput(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowYoutubeInput(false);
                        setYoutubeUrl('');
                      }
                    }}
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                    if (youtubeUrl.trim()) {
                      tiptapEditor?.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run();
                      setYoutubeUrl('');
                      setShowYoutubeInput(false);
                    }
                  }}>Wstaw</Button>
                </div>
              )}
              {/* Edytor */}
              <div className="w-full rounded-b-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <EditorContent editor={tiptapEditor} />
              </div>
              {showEmojiPicker === 'watek' && (
                <div className="absolute z-50 mt-1">
                  <Picker data={data} locale="pl" theme={darkMode ? 'dark' : 'light'} onEmojiSelect={(emoji: { native: string }) => {
                    tiptapEditor?.chain().focus().insertContent(emoji.native).run();
                    setShowEmojiPicker(null);
                  }} />
                </div>
              )}
            </div>
            {currentUser?.typ === 'ksiadz' && (
              <div>
                <Label className="mb-2 block">Grupa docelowa</Label>
                <div className="flex flex-wrap gap-2">
                  {[{ nazwa: 'wszyscy', emoji: '👥' }, ...grupy].map(grupa => {
                    const isWszyscy = grupa.nazwa === 'wszyscy';
                    const selected = isWszyscy
                      ? newWatekForm.grupa_docelowa === 'wszyscy'
                      : newWatekForm.grupa_docelowa !== 'wszyscy' && newWatekForm.grupa_docelowa.split(',').map(s => s.trim()).includes(grupa.nazwa);
                    return (
                      <button
                        key={grupa.nazwa}
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-accent'
                        }`}
                        onClick={() => {
                          if (isWszyscy) {
                            setNewWatekForm(prev => ({ ...prev, grupa_docelowa: 'wszyscy' }));
                          } else {
                            setNewWatekForm(prev => {
                              const current = prev.grupa_docelowa === 'wszyscy' ? [] : prev.grupa_docelowa.split(',').map(s => s.trim()).filter(Boolean);
                              const next = selected ? current.filter(g => g !== grupa.nazwa) : [...current, grupa.nazwa];
                              return { ...prev, grupa_docelowa: next.length === 0 ? 'wszyscy' : next.join(',') };
                            });
                          }
                        }}
                      >
                        {selected ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{grupa.emoji} {isWszyscy ? 'Wszyscy' : grupa.nazwa}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <Label className="text-red-600 dark:text-red-400 font-bold">Termin przeniesienia do archiwum *</Label>
              <Input
                type="date"
                value={newWatekForm.archiwum_data}
                onChange={(e) => setNewWatekForm({ ...newWatekForm, archiwum_data: e.target.value })}
              />
            </div>
            <Button onClick={editingWatek ? updateWatek : createWatek} className="w-full" disabled={!newWatekForm.archiwum_data || (newWatekForm.kategoria === 'ogłoszenie' ? (tiptapEditor ? tiptapEditor.isEmpty : (!newWatekForm.tresc || newWatekForm.tresc === '<p></p>')) : !newWatekForm.tytul.trim())}>
              <Send className="w-4 h-4 mr-2" />
              {editingWatek ? 'Zapisz zmiany' : 'Opublikuj'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nowej ankiety */}
      <Dialog open={showNewAnkietaModal} onOpenChange={setShowNewAnkietaModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nowa ankieta</DialogTitle>
            <DialogDescription>
              Utwórz ankietę — ministranci dostaną powiadomienie i będą musieli odpowiedzieć
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pytanie *</Label>
              <Input
                value={newAnkietaForm.pytanie}
                onChange={(e) => setNewAnkietaForm({ ...newAnkietaForm, pytanie: e.target.value })}
                placeholder="Czy będziesz w sobotę na zbiórce?"
              />
            </div>
            <div>
              <Label>Typ ankiety</Label>
              <Select value={newAnkietaForm.typ} onValueChange={(v) => setNewAnkietaForm({ ...newAnkietaForm, typ: v as 'tak_nie' | 'jednokrotny' | 'wielokrotny' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tak_nie">Tak / Nie</SelectItem>
                  <SelectItem value="jednokrotny">Jednokrotny wybór</SelectItem>
                  <SelectItem value="wielokrotny">Wielokrotny wybór</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newAnkietaForm.typ !== 'tak_nie' && (
              <div className="space-y-2">
                <Label>Opcje odpowiedzi</Label>
                {newAnkietaForm.opcje.map((opcja, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opcja}
                      onChange={(e) => {
                        const nowe = [...newAnkietaForm.opcje];
                        nowe[i] = e.target.value;
                        setNewAnkietaForm({ ...newAnkietaForm, opcje: nowe });
                      }}
                      placeholder={`Opcja ${i + 1}`}
                    />
                    {newAnkietaForm.opcje.length > 2 && (
                      <Button variant="ghost" size="sm" onClick={() => {
                        const nowe = newAnkietaForm.opcje.filter((_, idx) => idx !== i);
                        setNewAnkietaForm({ ...newAnkietaForm, opcje: nowe });
                      }}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {newAnkietaForm.opcje.length < 6 && (
                  <Button variant="outline" size="sm" onClick={() => setNewAnkietaForm({ ...newAnkietaForm, opcje: [...newAnkietaForm.opcje, ''] })}>
                    <Plus className="w-4 h-4 mr-1" />
                    Dodaj opcję
                  </Button>
                )}
              </div>
            )}
            <div>
              <Label>Termin odpowiedzi (opcjonalnie)</Label>
              <Input
                type="datetime-local"
                value={newAnkietaForm.termin}
                onChange={(e) => setNewAnkietaForm({ ...newAnkietaForm, termin: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-red-600 dark:text-red-400 font-bold">Termin przeniesienia do archiwum *</Label>
              <Input
                type="date"
                value={newAnkietaForm.archiwum_data}
                onChange={(e) => setNewAnkietaForm({ ...newAnkietaForm, archiwum_data: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="obowiazkowa"
                checked={newAnkietaForm.obowiazkowa}
                onChange={(e) => setNewAnkietaForm({ ...newAnkietaForm, obowiazkowa: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="obowiazkowa" className="font-normal">Obowiązkowa (ministranci dostaną powiadomienie)</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wyniki_ukryte"
                checked={newAnkietaForm.wyniki_ukryte}
                onChange={(e) => setNewAnkietaForm({ ...newAnkietaForm, wyniki_ukryte: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="wyniki_ukryte" className="font-normal">Ukryj wyniki (ministranci nie widzą kto jak głosował)</Label>
            </div>
            <Button onClick={createAnkieta} className="w-full" disabled={!newAnkietaForm.pytanie.trim() || !newAnkietaForm.archiwum_data}>
              <Vote className="w-4 h-4 mr-2" />
              Utwórz ankietę
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal grafik dyżurów */}
      <Dialog open={showGrafikModal} onOpenChange={(open) => { setShowGrafikModal(open); if (!open) setEditDyzury(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Grafik dyżurów
              </DialogTitle>
              <Button size="sm" variant={editDyzury ? 'default' : 'outline'} onClick={() => setEditDyzury(!editDyzury)} className={`mr-8 ${editDyzury ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}>
                {editDyzury ? 'Gotowe' : 'Edytuj'}
              </Button>
            </div>
            <DialogDescription>Tygodniowy harmonogram służby ministrantów</DialogDescription>
          </DialogHeader>
          {!editDyzury ? (
            dyzury.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Brak dyżurów</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Kliknij &quot;Edytuj&quot;, aby przypisać ministrantów do dni tygodnia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {DNI_TYGODNIA_FULL.map((dzien, i) => {
                  const dzienIdx = i === 6 ? 0 : i + 1;
                  const dyzuryDnia = dyzury.filter(d => d.dzien_tygodnia === dzienIdx);
                  const isWeekend = i >= 5;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${dyzuryDnia.length > 0 ? (isWeekend ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/40' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700') : 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800 opacity-60'}`}>
                      <div className={`w-20 shrink-0 text-center py-1 px-2 rounded-lg font-semibold text-xs uppercase tracking-wide ${isWeekend ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        {dzien.slice(0, 3)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 flex-1 min-h-[28px] items-center">
                        {dyzuryDnia.length > 0 ? dyzuryDnia.map(d => {
                          const member = members.find(m => m.profile_id === d.ministrant_id);
                          const grupa = member?.grupa ? grupy.find(g => g.id === member.grupa) : null;
                          const kolor = grupa ? KOLOR_KLASY[grupa.kolor] : null;
                          return (
                            <span key={d.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${kolor ? `${kolor.bg} ${kolor.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                              {grupa?.emoji && <span className="text-xs">{grupa.emoji}</span>}
                              {member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}
                            </span>
                          );
                        }) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">brak dyżurów</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-2">
              {DNI_TYGODNIA_FULL.map((dzien, i) => {
                const dzienIdx = i === 6 ? 0 : i + 1;
                const dyzuryDnia = dyzury.filter(d => d.dzien_tygodnia === dzienIdx);
                const ministranciNaDyzurze = dyzuryDnia.map(d => d.ministrant_id);
                const dostepniMinistranci = members.filter(m => m.typ === 'ministrant' && !ministranciNaDyzurze.includes(m.profile_id));
                const isWeekend = i >= 5;
                return (
                  <div key={i} className={`p-3 rounded-xl border ${isWeekend ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/40' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                    <p className={`font-semibold text-sm mb-2 ${isWeekend ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{dzien}</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {dyzuryDnia.map(d => {
                        const member = members.find(m => m.profile_id === d.ministrant_id);
                        const grupa = member?.grupa ? grupy.find(g => g.id === member.grupa) : null;
                        const kolor = grupa ? KOLOR_KLASY[grupa.kolor] : null;
                        return (
                          <span key={d.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${kolor ? `${kolor.bg} ${kolor.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                            {grupa?.emoji && <span className="text-xs">{grupa.emoji}</span>}
                            {member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}
                            <button
                              onClick={() => toggleDyzurAdmin(d.ministrant_id, dzienIdx)}
                              className="ml-0.5 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                      {dostepniMinistranci.length > 0 && (
                        <select
                          className="text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 bg-white dark:bg-gray-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) toggleDyzurAdmin(e.target.value, dzienIdx);
                          }}
                        >
                          <option value="">+ dodaj</option>
                          {dostepniMinistranci.map(m => (
                            <option key={m.id} value={m.profile_id}>
                              {m.imie} {m.nazwisko || ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {dyzuryDnia.length === 0 && dostepniMinistranci.length === 0 && (
                        <span className="text-xs text-gray-400 italic">Brak ministrantów</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal dodaj punkty */}
      <Dialog open={showDodajPunktyModal} onOpenChange={setShowDodajPunktyModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dodaj punkty</DialogTitle>
            <DialogDescription>{selectedMember ? `${selectedMember.imie} ${selectedMember.nazwisko || ''}`.trim() : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Liczba punktów</label>
              <Input
                type="number"
                placeholder="np. 5"
                value={dodajPunktyForm.punkty}
                onChange={(e) => setDodajPunktyForm(prev => ({ ...prev, punkty: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Powód (opcjonalnie)</label>
              <Input
                placeholder="np. pomoc przy sprzątaniu"
                value={dodajPunktyForm.powod}
                onChange={(e) => setDodajPunktyForm(prev => ({ ...prev, powod: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={dodajPunktyRecznie} disabled={!dodajPunktyForm.punkty || parseInt(dodajPunktyForm.punkty) === 0}>
              Dodaj {dodajPunktyForm.punkty ? `${dodajPunktyForm.punkty} pkt` : 'punkty'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal potwierdzenia usunięcia ministranta */}
      <Dialog open={showDeleteMemberModal} onOpenChange={(open) => { setShowDeleteMemberModal(open); if (!open) setMemberToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń ministranta</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć <strong>{memberToDelete ? `${memberToDelete.imie} ${memberToDelete.nazwisko || ''}`.trim() : ''}</strong> z parafii? Zostaną usunięte wszystkie dane: obecności, dyżury i punkty. Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteMemberModal(false); setMemberToDelete(null); }}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={() => memberToDelete && handleDeleteMember(memberToDelete)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Usuń na stałe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal potwierdzenia wyzerowania punktacji */}
      <Dialog open={showResetPunktacjaModal} onOpenChange={setShowResetPunktacjaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wyzeruj punktację</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz wyzerować punktację wszystkich ministrantów? Zostaną usunięte wszystkie obecności i punkty karne. Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPunktacjaModal(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleResetPunktacja}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Wyzeruj punktację
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal dyżurów admina */}
      <Dialog open={showDyzuryAdminModal} onOpenChange={setShowDyzuryAdminModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dyżury: {selectedMember ? `${selectedMember.imie} ${selectedMember.nazwisko || ''}`.trim() : ''}</DialogTitle>
            <DialogDescription>Wybierz dni tygodnia, w które ministrant pełni dyżur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {DNI_TYGODNIA_FULL.map((dzien, i) => {
              const dzienIdx = i === 6 ? 0 : i + 1;
              const isActive = dyzury.some(d => d.ministrant_id === selectedMember?.profile_id && d.dzien_tygodnia === dzienIdx);
              return (
                <Button
                  key={i}
                  variant={isActive ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => selectedMember && toggleDyzurAdmin(selectedMember.profile_id, dzienIdx)}
                >
                  {isActive ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {dzien}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal dyżurów — Gaming */}
      <Dialog open={showDyzuryModal} onOpenChange={setShowDyzuryModal}>
        <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl shadow-indigo-500/10">
          <DialogTitle className="sr-only">Moje dyżury</DialogTitle>
          <div className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 p-4">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Moje dyżury
            </h3>
            <p className="text-indigo-100 text-xs mt-1">
              Nieobecność na dyżurze: <span className="font-bold text-red-200">{getConfigValue('minus_nieobecnosc_dyzur', -5)} XP</span>
            </p>
          </div>
          <div className="p-4 space-y-2">
            {DNI_TYGODNIA_FULL.map((dzien, i) => {
              const dzienIdx = i === 6 ? 0 : i + 1;
              const isActive = dyzury.some(d => d.ministrant_id === currentUser?.id && d.dzien_tygodnia === dzienIdx);
              return (
                <button
                  key={i}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  onClick={() => toggleDyzur(dzienIdx)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    {isActive ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <span className={`font-bold text-sm ${isActive ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{dzien}</span>
                  {isActive && <span className="ml-auto text-[10px] font-bold text-indigo-500 uppercase">Aktywny</span>}
                  {dzienIdx === 0 && !isActive && <span className="ml-auto text-[10px] text-gray-400">0 XP</span>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
