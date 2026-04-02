'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { DEKANATY } from '@/lib/dekanaty';
import {
  Church, Users, Calendar, Book, LogOut, Mail,
  Copy, X, Plus, Check, CheckCircle, Hourglass,
  UserPlus, UserCheck, Send, Loader2, Bell, Pencil, Trash2,
  Trophy, Star, Clock, Shield, Settings, ChevronDown, ChevronUp, Award, Target, Lock, Unlock,
  MessageSquare, Pin, LockKeyhole, BarChart3, Vote, ArrowLeft, Eye, EyeOff, Smile, BookOpen, Lightbulb, HandHelping, Reply,
  Moon, Sun, QrCode, ChevronRight, ImageIcon, Video, Paperclip, Search, RotateCcw, PartyPopper, Sparkles, GripVertical,
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Youtube, Ticket, Download, CreditCard
} from 'lucide-react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
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
import LazyEmojiPicker from '@/components/LazyEmojiPicker';
import {
  getLiturgicalMonth, KOLORY_LITURGICZNE, RANGI, MIESIACE, DNI_TYGODNIA, DNI_TYGODNIA_FULL,
  type DzienLiturgiczny,
} from '@/lib/kalendarz-liturgiczny';
import { sanitizeRichHtml } from '@/lib/sanitize-rich-html';

// ==================== LIMITY ====================
const DARMOWY_LIMIT_MINISTRANTOW = 5;

const buildInitialPremiumInvoiceForm = (email = ''): PremiumInvoiceForm => ({
  invoiceType: 'company',
  email,
  fullName: '',
  companyName: '',
  taxId: '',
  street: '',
  postalCode: '',
  city: '',
  country: 'PL',
  consentEmailInvoice: true,
});
const ADMIN_PREVIEW_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const BLOCKED_PRIEST_EMAIL_DOMAINS = ['niepodam.pl'];
const AKTYWNOSC_ZGLOSZENIA_KEY = 'zgloszenia_aktywnosci_wlaczone';
const AUTO_DYZUR_MINUS_LOOKBACK_DAYS = 35;
const ANDROID_APP_PACKAGE_ID = 'net.ministranci.twa';
const ANDROID_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_APP_PACKAGE_ID}`;
const ANDROID_APP_CONTEXT_SESSION_KEY = 'ministranci_android_app_context';
const IOS_APP_CONTEXT_SESSION_KEY = 'ministranci_ios_app_context';
const ANDROID_APP_VERSION_SESSION_KEY = 'ministranci_android_app_vc';
const IOS_APP_VERSION_SESSION_KEY = 'ministranci_ios_app_vc';
const MOBILE_APP_PLATFORM_QUERY_PARAM = 'app_platform';
const ANDROID_APP_PLATFORM_QUERY_VALUE = 'android-app';
const IOS_APP_PLATFORM_QUERY_VALUE = 'ios-app';
const GOOGLE_PLAY_PREMIUM_PRODUCT_ID = (process.env.NEXT_PUBLIC_GOOGLE_PLAY_PREMIUM_PRODUCT_ID || 'premium_yearly').trim();
const GOOGLE_PLAY_PREMIUM_BASE_PLAN_ID = (process.env.NEXT_PUBLIC_GOOGLE_PLAY_PREPAID_BASE_PLAN_ID || 'yearly-prepaid').trim();
const GOOGLE_PLAY_NATIVE_CHECKOUT_URL = 'ministranci-billing://checkout';
const APPLE_PREMIUM_PRODUCT_ID = (process.env.NEXT_PUBLIC_APPLE_PREMIUM_PRODUCT_ID || 'premium_yearly_ios').trim();
const APPLE_IOS_BUNDLE_ID = (process.env.NEXT_PUBLIC_IOS_BUNDLE_ID || 'net.ministranci.ios').trim();
const APPLE_NATIVE_CHECKOUT_URL = 'ministranci-ios-billing://checkout';
const GOOGLE_PLAY_PROCESSED_TOKEN_SESSION_PREFIX = 'ministranci_google_play_processed_';
const APPLE_PROCESSED_TX_SESSION_PREFIX = 'ministranci_apple_processed_';
// Podnoś ten numer tylko wtedy, gdy chcesz WYMUSIĆ aktualizację starszych wersji mobilnych.
const MIN_REQUIRED_ANDROID_APP_VERSION_CODE = 4;
const PREMIUM_ANDROID_BILLING_INFO = 'W aplikacji Android płatności Premium są obsługiwane przez Google Play Billing.';
const PREMIUM_IOS_BILLING_INFO = 'W aplikacji iOS płatności Premium są obsługiwane przez App Store Billing.';

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

const getLocalISODate = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parsePositiveInt = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const getGooglePlayNativeErrorMessage = (errorCode: string) => {
  if (!errorCode) return 'Nie udało się uruchomić płatności Google Play.';
  if (errorCode === 'missing_parafia_id') return 'Brak identyfikatora parafii do zakupu.';
  if (errorCode === 'prepaid_offer_not_found') {
    return 'W Google Play nie znaleziono aktywnej przedpłaty (base plan: yearly-prepaid).';
  }
  if (errorCode === 'product_not_found') {
    return 'Produkt premium_yearly nie jest aktywny dla tego testu w Google Play.';
  }
  if (errorCode === 'already_owned') {
    return 'To konto ma już aktywny zakup tego produktu.';
  }
  if (errorCode.startsWith('purchase_failed_')) {
    return `Google Play zwrócił błąd zakupu (${errorCode.replace('purchase_failed_', '')}).`;
  }
  if (errorCode.startsWith('billing_setup_')) {
    return `Nie udało się połączyć z Google Play Billing (${errorCode.replace('billing_setup_', '')}).`;
  }
  if (errorCode.startsWith('query_products_')) {
    return `Nie udało się pobrać produktu z Google Play (${errorCode.replace('query_products_', '')}).`;
  }
  if (errorCode.startsWith('launch_failed_')) {
    return `Nie udało się otworzyć okna płatności Google Play (${errorCode.replace('launch_failed_', '')}).`;
  }
  return `Błąd Google Play: ${errorCode}`;
};

const getAppleNativeErrorMessage = (errorCode: string) => {
  if (!errorCode) return 'Nie udało się uruchomić płatności App Store.';
  if (errorCode === 'missing_parafia_id') return 'Brak identyfikatora parafii do zakupu.';
  if (errorCode === 'product_not_found') {
    return 'Produkt Premium nie jest aktywny dla tego testu w App Store.';
  }
  if (errorCode === 'already_owned') {
    return 'To konto ma już aktywny zakup tego produktu.';
  }
  if (errorCode.startsWith('purchase_failed_')) {
    return `App Store zwrócił błąd zakupu (${errorCode.replace('purchase_failed_', '')}).`;
  }
  return `Błąd App Store: ${errorCode}`;
};

const buildInitialAktywnoscForm = () => ({
  opis: '',
  data: getLocalISODate(),
  punkty: '',
});

const readLocalStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const readSessionStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSessionStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures in private/locked environments.
  }
};

const writeLocalStorage = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const isStandaloneApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
  } catch {
    // Ignorujemy niedostępne API w nietypowych przeglądarkach/webview.
  }
  if (typeof navigator !== 'undefined' && 'standalone' in navigator) {
    return Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  }
  return false;
};

const REPLY_MARKER_RE = /^\[\[reply:([^\]]+)\]\]\n?/;
const parseWiadomoscReply = (tresc: string): { replyToId: string | null; body: string } => {
  const match = tresc.match(REPLY_MARKER_RE);
  if (!match) return { replyToId: null, body: tresc };
  return { replyToId: match[1], body: tresc.replace(REPLY_MARKER_RE, '').trimStart() };
};
const buildWiadomoscReplyPayload = (body: string, replyToId: string | null) => (
  replyToId ? `[[reply:${replyToId}]]\n${body}` : body
);
const truncateReplyPreview = (text: string, max = 140) => (
  text.length > max ? `${text.slice(0, max)}...` : text
);
const AUTO_DYZUR_HISTORY_MARKER_RE = /\s*\[auto_dyzur:[^\]]+\]\s*/gi;
const ZBIORKA_HISTORY_MARKER_RE = /\s*\[zbiorka:[^\]]+\]\s*/gi;
const cleanHistoriaPowod = (powod: string | null | undefined) => (
  (powod || '')
    .replace(AUTO_DYZUR_HISTORY_MARKER_RE, ' ')
    .replace(ZBIORKA_HISTORY_MARKER_RE, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
);
const buildZbiorkaHistoryMarker = (sluzbaId: string, ministrantId: string) => `[zbiorka:${sluzbaId}:${ministrantId}]`;
const PARISH_ADMIN_ROLE = '__parafia_admin__';
const PARISH_PERMISSION_PREFIX = '__perm__:';
const LEGACY_RANKING_PERMISSION_TOKEN = `${PARISH_PERMISSION_PREFIX}manage_ranking`;
const PARISH_PERMISSION_DEFINITIONS = [
  { key: 'manage_news', label: 'Aktualności', description: 'Tworzenie i edycja ogłoszeń, dyskusji i ankiet' },
  { key: 'manage_members', label: 'Ministranci', description: 'Zatwierdzanie kont, grupy, posługi, dyżury i usuwanie kont' },
  { key: 'approve_ranking_submissions', label: 'Ranking: zgłoszenia', description: 'Zatwierdzanie i odrzucanie zgłoszeń obecności' },
  { key: 'manage_ranking_settings', label: 'Ranking: ustawienia', description: 'Konfiguracja punktacji, rang, odznak i reset rankingu' },
  { key: 'manage_events', label: 'Wydarzenia', description: 'Tworzenie i edycja wydarzeń oraz przypisywanie funkcji' },
  { key: 'manage_function_templates', label: 'Funkcje liturgiczne', description: 'Tworzenie i edycja listy funkcji liturgicznych' },
  { key: 'manage_poslugi_catalog', label: 'Baza posług', description: 'Dodawanie, edycja i usuwanie posług' },
  { key: 'edit_prayers', label: 'Modlitwy', description: 'Edycja modlitw i odpowiedzi łacińskich' },
  { key: 'manage_invites', label: 'Zaproszenia', description: 'Dostęp do kodu zaproszenia i plakatu QR' },
  { key: 'manage_premium', label: 'Premium', description: 'Podgląd i zarządzanie pakietem Premium parafii' },
] as const;
type ParishPermissionKey = typeof PARISH_PERMISSION_DEFINITIONS[number]['key'];
const PARISH_PERMISSION_KEYS: ParishPermissionKey[] = PARISH_PERMISSION_DEFINITIONS.map((permission) => permission.key);
const RANKING_APPROVAL_PERMISSION_KEY: ParishPermissionKey = 'approve_ranking_submissions';
const FULL_CONFIGURATION_PERMISSION_KEYS: ParishPermissionKey[] = PARISH_PERMISSION_KEYS.filter(
  (permission) => permission !== RANKING_APPROVAL_PERMISSION_KEY
);
const CLEAR_ASSIGN_MEMBER_VALUE = '__clear_assign_member__';
const EXTERNAL_ASSIGNMENT_VALUE = 'EXTERNAL';
const PRIEST_RANKING_INFO_DISMISSED_KEY_PREFIX = 'priest-ranking-info-dismissed';
const PRIEST_MINISTRANCI_INFO_DISMISSED_KEY_PREFIX = 'priest-ministranci-info-dismissed';
const PRIEST_WYDARZENIA_INFO_DISMISSED_KEY_PREFIX = 'priest-wydarzenia-info-dismissed';
const PRIEST_POSLUGI_INFO_DISMISSED_KEY_PREFIX = 'priest-poslugi-info-dismissed';
const buildFullConfigurationPermissions = (includeRankingApproval: boolean): ParishPermissionKey[] => (
  includeRankingApproval
    ? [...PARISH_PERMISSION_KEYS]
    : [...FULL_CONFIGURATION_PERMISSION_KEYS]
);
const hasFullConfigurationPermissions = (permissions: ParishPermissionKey[]) => (
  FULL_CONFIGURATION_PERMISSION_KEYS.every((permission) => permissions.includes(permission))
);
const fromParishPermissionToken = (token: string): ParishPermissionKey | null => {
  if (!token.startsWith(PARISH_PERMISSION_PREFIX)) return null;
  const key = token.slice(PARISH_PERMISSION_PREFIX.length) as ParishPermissionKey;
  return PARISH_PERMISSION_KEYS.includes(key) ? key : null;
};
const normalizeMemberRoles = (roles: string[] | null | undefined) => Array.from(new Set((roles ?? []).filter(Boolean)));
const hasParishAdminRole = (roles: string[] | null | undefined) => normalizeMemberRoles(roles).includes(PARISH_ADMIN_ROLE);
const getAssignedPermissionKeys = (roles: string[] | null | undefined): ParishPermissionKey[] => {
  const normalized = normalizeMemberRoles(roles);
  if (hasParishAdminRole(normalized)) return [...PARISH_PERMISSION_KEYS];
  const keys = normalized
    .map((role) => fromParishPermissionToken(role))
    .filter((key): key is ParishPermissionKey => key !== null);
  if (normalized.includes(LEGACY_RANKING_PERMISSION_TOKEN)) {
    keys.push('approve_ranking_submissions', 'manage_ranking_settings');
  }
  return Array.from(new Set(keys));
};
const getPoslugaRoles = (roles: string[] | null | undefined) => normalizeMemberRoles(roles).filter((role) => role !== PARISH_ADMIN_ROLE && !role.startsWith(PARISH_PERMISSION_PREFIX));

// ==================== TYPY ====================

type UserType = 'ksiadz' | 'ministrant';
type GrupaType = string;
type RankingSettingsTab = 'punkty' | 'rangi' | 'odznaki' | 'ogolne';
type FunkcjaAssignmentMap = Record<string, string>;
type FunkcjePerHourMap = Record<string, FunkcjaAssignmentMap>;

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
  created_at?: string;
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
  zatwierdzony: boolean;
  created_at?: string;
}

interface Funkcja {
  id: string;
  sluzba_id: string;
  typ: FunkcjaType;
  ministrant_id: string | null;
  osoba_zewnetrzna?: string | null;
  aktywna: boolean;
  zaakceptowana: boolean;
  godzina?: string;
}

type ZbiorkaObecnoscStatus = 'obecny' | 'nieobecny' | 'usprawiedliwiony';

interface ZbiorkaObecnosc {
  id: string;
  sluzba_id: string;
  ministrant_id: string;
  parafia_id: string;
  status: ZbiorkaObecnoscStatus;
  punkty_przyznane: number;
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
  ekstra_punkty?: number | null;
  typ?: 'wydarzenie' | 'zbiorka';
  miejsce?: string | null;
  notatka?: string | null;
  zbiorka_dla_wszystkich?: boolean | null;
  grupy_docelowe?: string[] | null;
  punkty_za_obecnosc?: number | null;
  punkty_za_nieobecnosc?: number | null;
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

type KsiadzPanelTemplate = {
  parafia?: {
    grupy?: GrupaConfig[] | null;
    funkcje_config?: FunkcjaConfig[] | null;
  };
  poslugi?: Array<{
    slug: string;
    nazwa: string;
    opis: string;
    emoji: string;
    kolor: string;
    kolejnosc: number;
    obrazek_url?: string | null;
    dlugi_opis?: string | null;
    zdjecia?: string[] | null;
    youtube_url?: string | null;
  }>;
  punktacja?: Array<{
    klucz: string;
    wartosc: number;
    opis: string;
  }>;
  rangi?: Array<{
    nazwa: string;
    min_pkt: number;
    kolor: string;
    kolejnosc: number;
  }>;
  odznaki?: Array<{
    nazwa: string;
    opis: string;
    warunek_typ: string;
    warunek_wartosc: number;
    bonus_pkt: number;
    aktywna: boolean;
  }>;
  modlitwy?: {
    przed?: string;
    po?: string;
    lacina?: string;
  };
};

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
  godzina?: string | null;
  zastepuje_dzien_tygodnia?: number | null;
  aktywny: boolean;
  status: 'oczekuje' | 'zatwierdzona' | 'odrzucona';
}

interface Obecnosc {
  id: string;
  ministrant_id: string;
  parafia_id: string;
  data: string;
  godzina: string;
  typ: 'msza' | 'nabożeństwo' | 'wydarzenie' | 'aktywnosc';
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
  created_at?: string;
}

interface AutoDyzurMinusIgnored {
  id: string;
  parafia_id: string;
  ministrant_id: string;
  data: string;
  created_by?: string | null;
  created_at?: string;
}

interface PunktyReczne {
  id: string;
  ministrant_id: string;
  parafia_id: string;
  data: string;
  powod: string;
  punkty: number;
  created_at: string;
}

type SelectedMemberPunktyHistoriaEntry =
  | {
    kind: 'obecnosc';
    id: string;
    createdAt: string;
    obec: Obecnosc;
  }
  | {
    kind: 'korekta';
    id: string;
    createdAt: string;
    korekta: PunktyReczne;
  }
  | {
    kind: 'minusowe';
    id: string;
    createdAt: string;
    minusowe: MinusowePunkty;
  };

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

interface AppConfigEntry {
  klucz: string;
  wartosc: string | null;
}

type WelcomeBannerVariant = {
  aktywny: boolean;
  tytul: string;
  opis: string;
  bezterminowo: boolean;
  dniWyswietlania: number;
  startAt: string;
};

type WelcomeBannerRole = 'ksiadz' | 'ministrant';

type WelcomeBannerRoleConfig = {
  nowi: WelcomeBannerVariant;
  wszyscy: WelcomeBannerVariant;
  parafia: WelcomeBannerVariant & { parafiaId: string };
};

type WelcomeBannerConfig = {
  ksiadz: WelcomeBannerRoleConfig;
  ministrant: WelcomeBannerRoleConfig;
};

interface LiturgicalDayOverride {
  nazwa: string;
  kolor: DzienLiturgiczny['kolor'];
  ranga: DzienLiturgiczny['ranga'];
  okres: string;
}

interface PremiumSubscription {
  tier: string;
  rabat_id: string | null;
  premium_status?: string | null;
  premium_source?: string | null;
  premium_expires_at?: string | null;
  rabaty?: {
    kod: string;
    procent_znizki: number | null;
  } | null;
}

type InvoiceType = 'company' | 'private';

interface PremiumInvoiceForm {
  invoiceType: InvoiceType;
  email: string;
  fullName: string;
  companyName: string;
  taxId: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  consentEmailInvoice: boolean;
}

type PremiumInvoiceField = keyof PremiumInvoiceForm;
type PremiumInvoiceErrors = Partial<Record<PremiumInvoiceField, string>>;

interface AdminImpersonationSession {
  id: string;
  target_parafia_id: string;
  target_parafia_nazwa: string | null;
  impersonated_typ: 'ksiadz' | 'ministrant';
  started_at: string;
}

interface PendingObecnosciCardProps {
  pendingObecnosci: Obecnosc[];
  memberByProfileId: Map<string, Member>;
  approvedDyzuryKeySet: Set<string>;
  approvingObecnosciIds: Set<string>;
  rejectingObecnosciIds: Set<string>;
  bulkApprovingObecnosci: boolean;
  onApprove: (id: string) => void;
  onApproveWithCustomPoints: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll: () => void;
}

function PendingObecnosciCard({
  pendingObecnosci,
  memberByProfileId,
  approvedDyzuryKeySet,
  approvingObecnosciIds,
  rejectingObecnosciIds,
  bulkApprovingObecnosci,
  onApprove,
  onApproveWithCustomPoints,
  onReject,
  onApproveAll,
}: PendingObecnosciCardProps) {
  return (
    <Card className={pendingObecnosci.length > 0 ? 'border-yellow-300 dark:border-yellow-600 shadow-md shadow-yellow-100 dark:shadow-yellow-900/20' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-yellow-500" />
            Oczekujące zgłoszenia ({pendingObecnosci.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {pendingObecnosci.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Brak oczekujących zgłoszeń.</p>
        ) : (
          <div className="space-y-2">
            {pendingObecnosci.map((o) => {
              const member = memberByProfileId.get(o.ministrant_id);
              const d = new Date(o.data);
              const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
              const isDyzur = approvedDyzuryKeySet.has(`${o.ministrant_id}:${d.getDay()}`);
              const isApproving = approvingObecnosciIds.has(o.id);
              const isRejecting = rejectingObecnosciIds.has(o.id);
              const isAktywnosc = o.typ === 'aktywnosc';
              return (
                <div key={o.id} className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="min-w-0">
                    {isAktywnosc ? (
                      <>
                        <div className="font-medium text-sm sm:text-base truncate">
                          {member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'} zgłosił aktywność:
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate">
                          {o.nazwa_nabożeństwa || 'Brak opisu aktywności'}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          {dayName} {d.toLocaleDateString('pl-PL')} • propozycja: {o.punkty_finalne} pkt
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-sm sm:text-base truncate">{member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          {dayName} {d.toLocaleDateString('pl-PL')} {o.godzina && `• ${o.godzina}`}
                          {isDyzur && <Badge variant="outline" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">DYŻUR</Badge>}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          {o.typ === 'wydarzenie' ? `⭐ ${o.nazwa_nabożeństwa}` : o.typ === 'nabożeństwo' ? o.nazwa_nabożeństwa : 'Msza'}
                          {' • '}{o.punkty_finalne} pkt {o.mnoznik > 1 ? `(${o.punkty_bazowe} × ${o.mnoznik})` : ''}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(o.id)}
                      disabled={bulkApprovingObecnosci || isApproving || isRejecting}
                      title="Zatwierdź"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    {isAktywnosc && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                        onClick={() => onApproveWithCustomPoints(o.id)}
                        disabled={bulkApprovingObecnosci || isApproving || isRejecting}
                        title="Przyznaj mniej / więcej punktów"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(o.id)}
                      disabled={bulkApprovingObecnosci || isApproving || isRejecting}
                      title="Odrzuć"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {pendingObecnosci.length > 1 && (
              <button
                onClick={onApproveAll}
                disabled={bulkApprovingObecnosci}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-green-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {bulkApprovingObecnosci ? 'Zatwierdzanie...' : `Zatwierdź wszystkie (${pendingObecnosci.length})`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RankingParafiiCardProps {
  rankingData: RankingEntry[];
  members: Member[];
  getRanga: (pkt: number) => RangaConfig | null | undefined;
  currentParafiaNazwa?: string;
}

function RankingParafiiCard({
  rankingData,
  members,
  getRanga,
  currentParafiaNazwa,
}: RankingParafiiCardProps) {
  const rankingRef = useRef<HTMLDivElement | null>(null);
  const maxPkt = rankingData.length > 0 ? Math.max(...rankingData.map((r) => Number(r.total_pkt)), 1) : 1;

  const handleDownloadPdf = async () => {
    const el = rankingRef.current;
    if (!el) return;
    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const imgW = canvas.width;
    const imgH = canvas.height;
    const pdfW = 210;
    const pdfH = (imgH * pdfW) / imgW;
    const pdf = new jsPDF('p', 'mm', pdfH > 297 ? [pdfW, pdfH + 10] : 'a4');
    pdf.addImage(imgData, 'PNG', 0, 5, pdfW, pdfH);
    pdf.save(`ranking-${currentParafiaNazwa || 'parafia'}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div ref={rankingRef} className="rounded-2xl overflow-hidden border border-amber-200/50 dark:border-amber-700/30 shadow-lg shadow-amber-500/5">
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-4 py-3 flex items-center justify-between">
        <h3 className="font-extrabold text-white flex items-center gap-2 text-base tracking-tight">
          <Trophy className="w-5 h-5" />
          RANKING PARAFII
        </h3>
        {rankingData.length > 0 && (
          <button onClick={handleDownloadPdf} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors" title="Pobierz PDF">
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900">
        {rankingData.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm p-4">Brak danych w rankingu.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rankingData.map((r, i) => {
              const member = members.find((m) => m.profile_id === r.ministrant_id);
              const ranga = getRanga(Number(r.total_pkt));
              const pct = Math.round((Number(r.total_pkt) / maxPkt) * 100);
              const positionBg = i === 0
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20'
                : i === 1
                ? 'bg-gradient-to-r from-gray-100 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/30'
                : i === 2
                ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10'
                : '';
              const barColor = i === 0
                ? 'from-amber-400 to-yellow-400'
                : i === 1
                ? 'from-gray-400 to-slate-400'
                : i === 2
                ? 'from-orange-400 to-amber-400'
                : 'from-indigo-400 to-purple-400';

              return (
                <div key={r.id} className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 ${positionBg}`}>
                  <div className="w-8 shrink-0 text-center">
                    {i === 0 ? <span className="text-xl sm:text-2xl">🥇</span>
                      : i === 1 ? <span className="text-xl sm:text-2xl">🥈</span>
                      : i === 2 ? <span className="text-xl sm:text-2xl">🥉</span>
                      : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm truncate">{member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}</span>
                      {ranga && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${KOLOR_KLASY[ranga.kolor]?.bg} ${KOLOR_KLASY[ranga.kolor]?.text}`}>
                          {ranga.nazwa}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-sm tabular-nums">{Number(r.total_pkt)}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatystykiMiesiacaCardProps {
  obecnosci: Obecnosc[];
  minusowePunkty: MinusowePunkty[];
}

function StatystykiMiesiacaCard({ obecnosci, minusowePunkty }: StatystykiMiesiacaCardProps) {
  const zatwierdzoneCount = obecnosci.filter((o) => o.status === 'zatwierdzona').length;
  const odrzuconeCount = obecnosci.filter((o) => o.status === 'odrzucona').length;
  const minusoweCount = minusowePunkty.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Statystyki miesiąca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="font-bold text-lg">{zatwierdzoneCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Zatwierdzone</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="font-bold text-lg">{odrzuconeCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Odrzucone</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="font-bold text-lg">{minusoweCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Minusowe</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KsiadzWydarzeniaHeaderProps {
  kolorLiturgiczny?: string | null;
  onOpenFunkcjeConfig: () => void;
  onOpenAddWydarzenie: () => void;
  onOpenAddZbiorka: () => void;
  showFunkcjeButton?: boolean;
  showAddWydarzenieButton?: boolean;
  showAddZbiorkaButton?: boolean;
}

function KsiadzWydarzeniaHeader({
  kolorLiturgiczny,
  onOpenFunkcjeConfig,
  onOpenAddWydarzenie,
  onOpenAddZbiorka,
  showFunkcjeButton = true,
  showAddWydarzenieButton = true,
  showAddZbiorkaButton = true,
}: KsiadzWydarzeniaHeaderProps) {
  const litBtn: Record<string, { gradient: string; hoverGradient: string; shadow: string }> = {
    zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', hoverGradient: 'hover:from-teal-700 hover:via-emerald-700 hover:to-green-700', shadow: 'shadow-emerald-500/25' },
    bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', hoverGradient: 'hover:from-amber-600 hover:via-yellow-600 hover:to-amber-500', shadow: 'shadow-amber-500/25' },
    czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', hoverGradient: 'hover:from-red-700 hover:via-rose-700 hover:to-red-600', shadow: 'shadow-red-500/25' },
    fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', hoverGradient: 'hover:from-purple-800 hover:via-violet-700 hover:to-purple-700', shadow: 'shadow-purple-500/25' },
    rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', hoverGradient: 'hover:from-pink-600 hover:via-rose-500 hover:to-pink-500', shadow: 'shadow-pink-500/25' },
    zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', hoverGradient: 'hover:from-amber-700 hover:via-yellow-600 hover:to-amber-500', shadow: 'shadow-amber-500/25' },
    niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', hoverGradient: 'hover:from-blue-700 hover:via-indigo-700 hover:to-sky-700', shadow: 'shadow-blue-500/25' },
    czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', hoverGradient: 'hover:from-slate-900 hover:via-black hover:to-zinc-900', shadow: 'shadow-gray-500/25' },
  };
  const lb = litBtn[kolorLiturgiczny || 'zielony'] || litBtn.zielony;

  return (
    <>
      {(showAddWydarzenieButton || showAddZbiorkaButton) && (
        <div className="grid gap-2 grid-cols-2">
          {showAddZbiorkaButton && (
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-bold h-9 px-3 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 transition-all duration-200"
              onClick={onOpenAddZbiorka}
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj zbiórkę
            </button>
          )}
          {showAddWydarzenieButton && (
            <button className={`inline-flex items-center justify-center rounded-md text-sm font-bold h-9 px-3 w-full bg-gradient-to-r ${lb.gradient} ${lb.hoverGradient} text-white shadow-lg ${lb.shadow} transition-all duration-200`}
              onClick={onOpenAddWydarzenie}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj wydarzenie
            </button>
          )}
        </div>
      )}
      {showFunkcjeButton && (
        <button className="inline-flex items-center justify-center rounded-md text-sm font-bold h-9 px-3 w-full bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-700 hover:via-sky-700 hover:to-blue-700 text-white shadow shadow-sky-500/20 transition-all duration-200"
          onClick={onOpenFunkcjeConfig}>
          <Settings className="w-4 h-4 mr-2" />
          Funkcje ministrantów
        </button>
      )}
    </>
  );
}

interface MinistrantWydarzeniaHeaderProps {
  kolorLiturgiczny?: string | null;
  onOpenZglosModal: () => void;
}

function MinistrantWydarzeniaHeader({
  kolorLiturgiczny,
  onOpenZglosModal,
}: MinistrantWydarzeniaHeaderProps) {
  const litG: Record<string, { gradient: string; shadow: string }> = {
    zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20' },
    bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
    czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20' },
    fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20' },
    rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20' },
    zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
    niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', shadow: 'shadow-blue-500/20' },
    czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', shadow: 'shadow-gray-500/20' },
  };
  const lg = litG[kolorLiturgiczny || 'zielony'] || litG.zielony;

  return (
    <>
      <Button onClick={onOpenZglosModal} className="w-full h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 text-white shadow-xl shadow-blue-500/25 font-extrabold text-lg rounded-xl">
        <Plus className="w-5 h-5 mr-2" />
        Zgłoś obecność
      </Button>
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${lg.gradient} p-4 sm:p-5 shadow-lg ${lg.shadow}`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">📅</div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Wydarzenia</h2>
            <p className="text-white/70 text-xs sm:text-sm">Msze, nabożeństwa i celebracje</p>
          </div>
        </div>
      </div>
    </>
  );
}

interface NewPunktacjaFormState {
  klucz: string;
  wartosc: number;
  opis: string;
}

interface RankingSettingsPanelProps {
  showRankingSettings: boolean;
  onToggleShowRankingSettings: () => void;
  onOpenResetPunktacja: () => void;
  punktacjaConfig: PunktacjaConfig[];
  rangiConfig: RangaConfig[];
  odznakiConfig: OdznakaConfig[];
  rankingSettingsTab: RankingSettingsTab;
  onChangeRankingSettingsTab: (tab: RankingSettingsTab) => void;
  onInitRankingConfig: () => void;
  punktacjaDraftDirty: boolean;
  punktacjaSaving: boolean;
  onSavePunktacjaDraft: () => void;
  onMutatePunktacjaConfig: (updater: (prev: PunktacjaConfig[]) => PunktacjaConfig[]) => void;
  onUpdateConfigOpis: (klucz: string, nowyOpis: string) => void;
  getPunktacjaValue: (entry: PunktacjaConfig) => number;
  onSetPunktacjaDraftValue: (id: string, value: number) => void;
  onDeletePunktacja: (id: string) => void;
  showNewPunktacjaForm: boolean;
  onShowNewPunktacjaForm: (show: boolean) => void;
  newPunktacjaForm: NewPunktacjaFormState;
  onMutateNewPunktacjaForm: (updater: (prev: NewPunktacjaFormState) => NewPunktacjaFormState) => void;
  onAddPunktacja: (klucz: string, wartosc: number, opis: string) => Promise<void>;
  onMutateRangiConfig: (updater: (prev: RangaConfig[]) => RangaConfig[]) => void;
  onUpdateRangaKolor: (id: string, kolor: string) => void;
  onUpdateRanga: (id: string, nazwa: string, min_pkt: number) => void;
  onDeleteRanga: (id: string) => void;
  onAddRanga: () => void;
  editingOdznakaId: string | null;
  onSetEditingOdznakaId: (id: string | null) => void;
  onMutateOdznakiConfig: (updater: (prev: OdznakaConfig[]) => OdznakaConfig[]) => void;
  onUpdateOdznaka: (id: string, updates: Partial<OdznakaConfig>) => Promise<void>;
  onReloadRankingData: () => void;
  onDeleteOdznaka: (id: string) => void;
  onAddOdznaka: () => void;
  limitDniConfig: PunktacjaConfig | null;
  getConfigValue: (klucz: string, fallback: number) => number;
  aktywnoscZgloszeniaWlaczone: boolean;
  onOpenToggleAktywnoscZgloszen: () => void;
}

function RankingSettingsPanel({
  showRankingSettings,
  onToggleShowRankingSettings,
  onOpenResetPunktacja,
  punktacjaConfig,
  rangiConfig,
  odznakiConfig,
  rankingSettingsTab,
  onChangeRankingSettingsTab,
  onInitRankingConfig,
  punktacjaDraftDirty,
  punktacjaSaving,
  onSavePunktacjaDraft,
  onMutatePunktacjaConfig,
  onUpdateConfigOpis,
  getPunktacjaValue,
  onSetPunktacjaDraftValue,
  onDeletePunktacja,
  showNewPunktacjaForm,
  onShowNewPunktacjaForm,
  newPunktacjaForm,
  onMutateNewPunktacjaForm,
  onAddPunktacja,
  onMutateRangiConfig,
  onUpdateRangaKolor,
  onUpdateRanga,
  onDeleteRanga,
  onAddRanga,
  editingOdznakaId,
  onSetEditingOdznakaId,
  onMutateOdznakiConfig,
  onUpdateOdznaka,
  onReloadRankingData,
  onDeleteOdznaka,
  onAddOdznaka,
  limitDniConfig,
  getConfigValue,
  aktywnoscZgloszeniaWlaczone,
  onOpenToggleAktywnoscZgloszen,
}: RankingSettingsPanelProps) {
  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-900/20" onClick={onOpenResetPunktacja}>
          Wyzeruj punktację
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={aktywnoscZgloszeniaWlaczone
            ? 'text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:border-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'
            : 'text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:border-rose-700 dark:bg-rose-900/20 dark:hover:bg-rose-900/30'}
          onClick={onOpenToggleAktywnoscZgloszen}
        >
          {aktywnoscZgloszeniaWlaczone ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          {aktywnoscZgloszeniaWlaczone ? 'Wyłącz zgłoszenia aktywności' : 'Włącz zgłoszenia aktywności'}
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleShowRankingSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Ustawienia punktacji
          {showRankingSettings ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>
      </div>

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
            {punktacjaConfig.length === 0 && rangiConfig.length === 0 && odznakiConfig.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <p className="text-gray-500 dark:text-gray-400">Brak konfiguracji punktacji. Kliknij poniżej, aby zainicjalizować domyślne punkty, rangi i odznaki.</p>
                <Button onClick={onInitRankingConfig}>
                  <Plus className="w-4 h-4 mr-2" />
                  Zainicjalizuj konfigurację
                </Button>
              </div>
            )}

            {(punktacjaConfig.length > 0 || rangiConfig.length > 0 || odznakiConfig.length > 0) && (
              <>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(['punkty', 'rangi', 'odznaki', 'ogolne'] as const).map((tab) => (
                    <Button key={tab} variant={rankingSettingsTab === tab ? 'default' : 'outline'} size="sm" onClick={() => onChangeRankingSettingsTab(tab)}>
                      {tab === 'punkty' ? 'Punkty' : tab === 'rangi' ? 'Rangi' : tab === 'odznaki' ? 'Odznaki' : 'Ogólne'}
                    </Button>
                  ))}
                </div>

                {rankingSettingsTab === 'punkty' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={onSavePunktacjaDraft} disabled={!punktacjaDraftDirty || punktacjaSaving}>
                        {punktacjaSaving ? 'Zapisywanie...' : 'Zapisz zmiany punktacji'}
                      </Button>
                    </div>
                    {[
                      { label: 'Punkty za msze', prefix: 'msza_', step: 1 },
                      { label: 'Nabożeństwa', prefix: 'nabożeństwo_', step: 1 },
                      { label: 'Mnożniki sezonowe', prefix: 'mnoznik_', step: 0.1 },
                      { label: 'Bonusy za serie', prefix: 'bonus_seria_', step: 1 },
                      { label: 'Ranking miesięczny', prefix: 'ranking_', step: 1 },
                      { label: 'Minusowe punkty', prefix: 'minus_', step: 1 },
                    ].map(({ label, prefix, step }) => {
                      const items = punktacjaConfig.filter((p) => p.klucz.startsWith(prefix));
                      if (items.length === 0) return null;
                      return (
                        <div key={prefix}>
                          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</h4>
                          {items.map((p) => (
                            <div key={p.klucz} className="flex flex-wrap items-center gap-2 mb-2">
                              <Input
                                className="flex-1 min-w-[120px] text-sm"
                                value={p.opis}
                                onChange={(e) => {
                                  onMutatePunktacjaConfig((prev) => prev.map((x) => x.klucz === p.klucz ? { ...x, opis: e.target.value } : x));
                                }}
                                onBlur={() => onUpdateConfigOpis(p.klucz, p.opis)}
                              />
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step={step}
                                  className="w-20"
                                  value={getPunktacjaValue(p)}
                                  onChange={(e) => {
                                    const nextValue = Number(e.target.value);
                                    onSetPunktacjaDraftValue(p.id, Number.isFinite(nextValue) ? nextValue : 0);
                                  }}
                                />
                                <span className="text-xs text-gray-400 w-6">{prefix.startsWith('mnoznik') ? 'x' : 'pkt'}</span>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 px-2" onClick={() => onDeletePunktacja(p.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    <div className="border-t pt-4">
                      {!showNewPunktacjaForm ? (
                        <Button variant="outline" size="sm" onClick={() => onShowNewPunktacjaForm(true)}>
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
                              onChange={(e) => onMutateNewPunktacjaForm((prev) => ({ ...prev, klucz: e.target.value }))}
                            />
                            <Input
                              type="number"
                              placeholder="Wartość"
                              className="w-24"
                              value={newPunktacjaForm.wartosc || ''}
                              onChange={(e) => onMutateNewPunktacjaForm((prev) => ({ ...prev, wartosc: Number(e.target.value) }))}
                            />
                          </div>
                          <Input
                            placeholder="Opis (np. Msza — specjalna)"
                            value={newPunktacjaForm.opis}
                            onChange={(e) => onMutateNewPunktacjaForm((prev) => ({ ...prev, opis: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={async () => {
                              if (newPunktacjaForm.klucz && newPunktacjaForm.opis) {
                                await onAddPunktacja(newPunktacjaForm.klucz, newPunktacjaForm.wartosc, newPunktacjaForm.opis);
                                onMutateNewPunktacjaForm(() => ({ klucz: '', wartosc: 0, opis: '' }));
                                onShowNewPunktacjaForm(false);
                              }
                            }}>
                              <Check className="w-4 h-4 mr-1" />
                              Dodaj
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onShowNewPunktacjaForm(false)}>
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {rankingSettingsTab === 'rangi' && (
                  <div className="space-y-3">
                    {rangiConfig.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Select value={r.kolor} onValueChange={(val) => {
                          onMutateRangiConfig((prev) => prev.map((x) => x.id === r.id ? { ...x, kolor: val } : x));
                          onUpdateRangaKolor(r.id, val);
                        }}>
                          <SelectTrigger className={`w-10 h-8 p-0 ${KOLOR_KLASY[r.kolor]?.bg}`}>
                            <span />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(KOLOR_KLASY).map((k) => (
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
                            onMutateRangiConfig((prev) => prev.map((x) => x.id === r.id ? { ...x, nazwa: e.target.value } : x));
                          }}
                          onBlur={() => onUpdateRanga(r.id, r.nazwa, r.min_pkt)}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">od</span>
                        <Input
                          type="number"
                          className="w-24"
                          value={r.min_pkt}
                          onChange={(e) => {
                            onMutateRangiConfig((prev) => prev.map((x) => x.id === r.id ? { ...x, min_pkt: Number(e.target.value) } : x));
                          }}
                          onBlur={() => onUpdateRanga(r.id, r.nazwa, r.min_pkt)}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">pkt</span>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 px-2" onClick={() => onDeleteRanga(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={onAddRanga}>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj rangę
                    </Button>
                  </div>
                )}

                {rankingSettingsTab === 'odznaki' && (
                  <div className="space-y-3">
                    {odznakiConfig.map((o) => (
                      <div key={o.id} className={`p-3 rounded-lg space-y-2 ${o.aktywna ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700 opacity-60'}`}>
                        {editingOdznakaId === o.id ? (
                          <div className="space-y-2">
                            <Input
                              value={o.nazwa}
                              placeholder="Nazwa odznaki"
                              onChange={(e) => onMutateOdznakiConfig((prev) => prev.map((x) => x.id === o.id ? { ...x, nazwa: e.target.value } : x))}
                            />
                            <Input
                              value={o.opis}
                              placeholder="Opis odznaki"
                              onChange={(e) => onMutateOdznakiConfig((prev) => prev.map((x) => x.id === o.id ? { ...x, opis: e.target.value } : x))}
                            />
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Typ warunku</Label>
                                <Select value={o.warunek_typ} onValueChange={(val) => onMutateOdznakiConfig((prev) => prev.map((x) => x.id === o.id ? { ...x, warunek_typ: val } : x))}>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['total_obecnosci', 'pelny_tydzien', 'ranking_miesieczny', 'sezon_adwent', 'sezon_wielki_post', 'triduum', 'nabożeństwo_droga_krzyzowa', 'nabożeństwo_rozaniec', 'nabożeństwo_majowe', 'rekord_parafii', 'zero_minusowych_tyg', 'streak_tyg'].map((t) => (
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
                                  onChange={(e) => onMutateOdznakiConfig((prev) => prev.map((x) => x.id === o.id ? { ...x, warunek_wartosc: Number(e.target.value) } : x))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Bonus pkt</Label>
                                <Input
                                  type="number"
                                  className="w-20 h-8"
                                  value={o.bonus_pkt}
                                  onChange={(e) => onMutateOdznakiConfig((prev) => prev.map((x) => x.id === o.id ? { ...x, bonus_pkt: Number(e.target.value) } : x))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={async () => {
                                await onUpdateOdznaka(o.id, { nazwa: o.nazwa, opis: o.opis, warunek_typ: o.warunek_typ, warunek_wartosc: o.warunek_wartosc, bonus_pkt: o.bonus_pkt });
                                onSetEditingOdznakaId(null);
                              }}>
                                <Check className="w-4 h-4 mr-1" />
                                Zapisz
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { onSetEditingOdznakaId(null); onReloadRankingData(); }}>
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
                                <Button variant="ghost" size="sm" className="px-2" onClick={() => { void onUpdateOdznaka(o.id, { aktywna: !o.aktywna }); }}>
                                  {o.aktywna ? <Unlock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="px-2" onClick={() => onSetEditingOdznakaId(o.id)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 px-2" onClick={() => onDeleteOdznaka(o.id)}>
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
                    <Button variant="outline" size="sm" onClick={onAddOdznaka}>
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj odznakę
                    </Button>
                  </div>
                )}

                {rankingSettingsTab === 'ogolne' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={onSavePunktacjaDraft} disabled={!punktacjaDraftDirty || punktacjaSaving}>
                        {punktacjaSaving ? 'Zapisywanie...' : 'Zapisz zmiany punktacji'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">Limit dni na zgłoszenie</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Ile dni po służbie ministrant może zgłosić obecność</div>
                      </div>
                      <Input
                        type="number"
                        className="w-20"
                        value={limitDniConfig ? getPunktacjaValue(limitDniConfig) : getConfigValue('limit_dni_zgloszenie', 2)}
                        onChange={(e) => {
                          if (!limitDniConfig) return;
                          const nextValue = Number(e.target.value);
                          onSetPunktacjaDraftValue(limitDniConfig.id, Number.isFinite(nextValue) ? nextValue : 0);
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
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
  przed: `Oto za chwilę przystąpię do ołtarza Bożego,
do Boga, który rozwesela młodość moją.

Do świętej przystępuję służby.
Chcę ją dobrze pełnić.

Proszę Cię, Panie Jezu,
o łaskę skupienia, aby moje myśli były przy Tobie,
aby moje oczy były zwrócone na ołtarz,
a serce moje oddane tylko Tobie.

Amen.`,

  po: `Boże, którego dobroć powołała mnie
do służby przy Twoim ołtarzu,

spraw, abym uświęcony uczestnictwem
w Twoich tajemnicach,

przez dzień dzisiejszy i całe moje życie
szedł drogą zbawienia.

Przez Chrystusa, Pana naszego.
Amen.`,

  lacina: [
    { k: 'In nomine Patris, et Filii, et Spiritus Sancti.', m: 'Amen.', kPl: 'W imię Ojca i Syna, i Ducha Świętego.', mPl: 'Amen.' },
    { k: 'Gratia Domini nostri Iesu Christi, et caritas Dei, et communicatio Sancti Spiritus sit cum omnibus vobis.', m: 'Et cum spiritu tuo.', kPl: 'Łaska Pana naszego Jezusa Chrystusa, miłość Boga Ojca i dar jedności Ducha Świętego niech będą z wami wszystkimi.', mPl: 'I z duchem twoim.' },
    { k: 'Dominus vobiscum.', m: 'Et cum spiritu tuo.', kPl: 'Pan z wami.', mPl: 'I z duchem twoim.' },
    { k: 'Fratres, agnoscamus peccata nostra, ut apti simus ad sacra mysteria celebranda.', m: 'Confiteor Deo omnipotenti et vobis, fratres, quia peccavi nimis cogitatione, verbo, opere et omissione: mea culpa, mea culpa, mea maxima culpa. Ideo precor beatam Mariam semper Virginem, omnes Angelos et Sanctos, et vos, fratres, orare pro me ad Dominum Deum nostrum.', kPl: 'Bracia, uznajmy nasze grzechy, abyśmy mogli z czystym sercem złożyć Najświętszą Ofiarę.', mPl: 'Spowiadam się Bogu wszechmogącemu i wam, bracia i siostry, że bardzo zgrzeszyłem myślą, mową, uczynkiem i zaniedbaniem: moja wina, moja wina, moja bardzo wielka wina. Przeto błagam Najświętszą Maryję, zawsze Dziewicę, wszystkich Aniołów i Świętych, i was, bracia i siostry, o modlitwę za mnie do Pana Boga naszego.' },
    { k: 'Kyrie, eleison.', m: 'Kyrie, eleison.', kPl: 'Panie, zmiłuj się.', mPl: 'Panie, zmiłuj się.' },
    { k: 'Christe, eleison.', m: 'Christe, eleison.', kPl: 'Chryste, zmiłuj się.', mPl: 'Chryste, zmiłuj się.' },
    { k: 'Kyrie, eleison.', m: 'Kyrie, eleison.', kPl: 'Panie, zmiłuj się.', mPl: 'Panie, zmiłuj się.' },
    { k: 'Gloria in excelsis Deo...', m: 'Et in terra pax hominibus bonae voluntatis. Laudamus te, benedicimus te, adoramus te, glorificamus te, gratias agimus tibi propter magnam gloriam tuam, Domine Deus, Rex caelestis, Deus Pater omnipotens. Domine Fili Unigenite, Iesu Christe, Domine Deus, Agnus Dei, Filius Patris, qui tollis peccata mundi, miserere nobis; qui tollis peccata mundi, suscipe deprecationem nostram. Qui sedes ad dexteram Patris, miserere nobis. Quoniam tu solus Sanctus, tu solus Dominus, tu solus Altissimus, Iesu Christe, cum Sancto Spiritu: in gloria Dei Patris. Amen.', kPl: 'Chwała na wysokości Bogu...', mPl: 'A na ziemi pokój ludziom dobrej woli. Chwalimy Cię, błogosławimy Cię, wielbimy Cię, wysławiamy Cię, dzięki Ci składamy, bo wielka jest chwała Twoja, Panie Boże, Królu nieba, Boże Ojcze wszechmogący. Panie, Synu Jednorodzony, Jezu Chryste, Panie Boże, Baranku Boży, Synu Ojca, który gładzisz grzechy świata, zmiłuj się nad nami; który gładzisz grzechy świata, przyjm błaganie nasze. Który siedzisz po prawicy Ojca, zmiłuj się nad nami. Albowiem tylko Tyś jest święty, tylko Tyś jest Panem, tylko Tyś Najwyższy, Jezu Chryste, z Duchem Świętym: w chwale Boga Ojca. Amen.' },
    { k: 'Verbum Domini.', m: 'Deo gratias.', kPl: 'Oto słowo Boże.', mPl: 'Bogu niech będą dzięki.' },
    { k: 'Lectio sancti Evangelii secundum...', m: 'Gloria tibi, Domine.', kPl: 'Słowa Ewangelii według świętego...', mPl: 'Chwała Tobie, Panie.' },
    { k: 'Evangelium Domini nostri Iesu Christi.', m: 'Laus tibi, Christe.', kPl: 'Oto słowo Pańskie.', mPl: 'Chwała Tobie, Chryste.' },
    { k: 'Credo in unum Deum...', m: 'Patrem omnipotentem, factorem caeli et terrae, visibilium omnium et invisibilium. Et in unum Dominum Iesum Christum, Filium Dei Unigenitum, et ex Patre natum ante omnia saecula. Deum de Deo, lumen de lumine, Deum verum de Deo vero, genitum, non factum, consubstantialem Patri: per quem omnia facta sunt. Qui propter nos homines et propter nostram salutem descendit de caelis. Et incarnatus est de Spiritu Sancto ex Maria Virgine, et homo factus est. Crucifixus etiam pro nobis sub Pontio Pilato; passus et sepultus est, et resurrexit tertia die, secundum Scripturas, et ascendit in caelum, sedet ad dexteram Patris. Et iterum venturus est cum gloria, iudicare vivos et mortuos, cuius regni non erit finis. Et in Spiritum Sanctum, Dominum et vivificantem: qui ex Patre Filioque procedit. Qui cum Patre et Filio simul adoratur et conglorificatur: qui locutus est per prophetas. Et unam, sanctam, catholicam et apostolicam Ecclesiam. Confiteor unum baptisma in remissionem peccatorum. Et expecto resurrectionem mortuorum, et vitam venturi saeculi. Amen.', kPl: 'Wierzę w jednego Boga...', mPl: 'Ojca wszechmogącego, Stworzyciela nieba i ziemi, wszystkich rzeczy widzialnych i niewidzialnych. I w jednego Pana Jezusa Chrystusa, Syna Bożego Jednorodzonego, który z Ojca jest zrodzony przed wszystkimi wiekami. Bóg z Boga, Światłość ze Światłości, Bóg prawdziwy z Boga prawdziwego, zrodzony a nie stworzony, współistotny Ojcu, a przez Niego wszystko się stało. On to dla nas ludzi i dla naszego zbawienia zstąpił z nieba. I za sprawą Ducha Świętego przyjął ciało z Maryi Dziewicy i stał się człowiekiem. Ukrzyżowany również za nas pod Poncjuszem Piłatem, został umęczony i pogrzebany, i zmartwychwstał dnia trzeciego, jak oznajmia Pismo, i wstąpił do nieba; siedzi po prawicy Ojca. I powtórnie przyjdzie w chwale sądzić żywych i umarłych, a królestwu Jego nie będzie końca. Wierzę w Ducha Świętego, Pana i Ożywiciela, który od Ojca i Syna pochodzi. Który z Ojcem i Synem wspólnie odbiera uwielbienie i chwałę; który mówił przez Proroków. Wierzę w jeden, święty, powszechny i apostolski Kościół. Wyznaję jeden chrzest na odpuszczenie grzechów. I oczekuję wskrzeszenia umarłych i życia wiecznego w przyszłym świecie. Amen.' },
    { k: 'Orate, fratres...', m: 'Suscipiat Dominus sacrificium de manibus tuis ad laudem et gloriam nominis sui, ad utilitatem quoque nostram totiusque Ecclesiae suae sanctae.', kPl: 'Módlcie się, aby moją i waszą ofiarę przyjął Bóg Ojciec wszechmogący.', mPl: 'Niech Pan przyjmie ofiarę z rąk twoich na cześć i chwałę swojego imienia, a także na pożytek nasz i całego Kościoła świętego.' },
    { k: 'Per omnia saecula saeculorum.', m: 'Amen.', kPl: 'Na wieki wieków.', mPl: 'Amen.' },
    { k: 'Dominus vobiscum.', m: 'Et cum spiritu tuo.', kPl: 'Pan z wami.', mPl: 'I z duchem twoim.' },
    { k: 'Sursum corda.', m: 'Habemus ad Dominum.', kPl: 'W górę serca.', mPl: 'Wznosimy je do Pana.' },
    { k: 'Gratias agamus Domino Deo nostro.', m: 'Dignum et iustum est.', kPl: 'Dzięki składajmy Panu Bogu naszemu.', mPl: 'Godne to i sprawiedliwe.' },
    { k: 'Sanctus...', m: 'Sanctus, Sanctus, Sanctus Dominus Deus Sabaoth. Pleni sunt caeli et terra gloria tua. Hosanna in excelsis. Benedictus qui venit in nomine Domini. Hosanna in excelsis.', kPl: 'Święty...', mPl: 'Święty, Święty, Święty, Pan Bóg Zastępów. Pełne są niebiosa i ziemia chwały Twojej. Hosanna na wysokości. Błogosławiony, który idzie w imię Pańskie. Hosanna na wysokości.' },
    { k: 'Mysterium fidei.', m: 'Mortem tuam annuntiamus, Domine, et tuam resurrectionem confitemur, donec venias.', kPl: 'Oto wielka tajemnica wiary.', mPl: 'Głosimy śmierć Twoją, Panie Jezu, wyznajemy Twoje zmartwychwstanie i oczekujemy Twego przyjścia w chwale.' },
    { k: 'Per ipsum, et cum ipso... per omnia saecula saeculorum.', m: 'Amen.', kPl: 'Przez Chrystusa, z Chrystusem i w Chrystusie... przez wszystkie wieki wieków.', mPl: 'Amen.' },
    { k: 'Praeceptis salutaribus moniti... audemus dicere:', m: 'Pater noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie, et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo.', kPl: 'Pouczeni przez Zbawiciela... ośmielamy się mówić:', mPl: 'Ojcze nasz, któryś jest w niebie, święć się imię Twoje; przyjdź królestwo Twoje; bądź wola Twoja jako w niebie, tak i na ziemi. Chleba naszego powszedniego daj nam dzisiaj i odpuść nam nasze winy, jako i my odpuszczamy naszym winowajcom. I nie wódź nas na pokuszenie, ale nas zbaw ode złego.' },
    { k: 'Libera nos, quaesumus, Domine... Iesu Christi.', m: 'Quia tuum est regnum, et potestas, et gloria in saecula.', kPl: 'Wybaw nas, Panie, od zła wszelkiego... Jezusa Chrystusa.', mPl: 'Bo Twoje jest królestwo i potęga, i chwała na wieki.' },
    { k: 'Pax Domini sit semper vobiscum.', m: 'Et cum spiritu tuo.', kPl: 'Pokój Pański niech zawsze będzie z wami.', mPl: 'I z duchem twoim.' },
    { k: 'Agnus Dei...', m: 'Agnus Dei, qui tollis peccata mundi, miserere nobis. Agnus Dei, qui tollis peccata mundi, miserere nobis. Agnus Dei, qui tollis peccata mundi, dona nobis pacem.', kPl: 'Baranku Boży...', mPl: 'Baranku Boży, który gładzisz grzechy świata, zmiłuj się nad nami. Baranku Boży, który gładzisz grzechy świata, zmiłuj się nad nami. Baranku Boży, który gładzisz grzechy świata, obdarz nas pokojem.' },
    { k: 'Ecce Agnus Dei, ecce qui tollit peccata mundi. Beati qui ad cenam Agni vocati sunt.', m: 'Domine, non sum dignus, ut intres sub tectum meum, sed tantum dic verbo, et sanabitur anima mea.', kPl: 'Oto Baranek Boży, który gładzi grzechy świata. Błogosławieni, którzy zostali wezwani na Jego ucztę.', mPl: 'Panie, nie jestem godzien, abyś przyszedł do mnie, ale powiedz tylko słowo, a będzie uzdrowiona dusza moja.' },
    { k: 'Corpus Christi.', m: 'Amen.', kPl: 'Ciało Chrystusa.', mPl: 'Amen.' },
    { k: 'Ite, missa est.', m: 'Deo gratias.', kPl: 'Idźcie, ofiara spełniona.', mPl: 'Bogu niech będą dzięki.' },
  ]
};

const PATRONOWIE_MINISTRANTOW = [
  {
    id: 'tarsycjusz',
    nazwa: 'Św. Tarsycjusz',
    tytul: 'Patron ministrantów i lektorów',
    zdjecie: 'https://commons.wikimedia.org/wiki/Special:FilePath/Antony_Troncet_-_The_Martyrdom_of_Saint_Tarcisius_-_2012.86_-_Minneapolis_Institute_of_Arts.jpg',
    opis: 'Św. Tarsycjusz jest jednym z najważniejszych patronów służby liturgicznej. Tradycja podaje, że jako młody chrześcijanin niósł Komunię Świętą do więźniów i oddał życie, broniąc Najświętszego Sakramentu. Dla ministrantów jest wzorem miłości do Eucharystii, odwagi w wierze i wierności Jezusowi nawet w trudnych sytuacjach.',
    modlitwa: 'Święty Tarsycjuszu, naucz mnie kochać Jezusa obecnego w Eucharystii. Wyproś mi odwagę, czystość serca i wierność w służbie przy ołtarzu. Amen.',
  },
  {
    id: 'dominik-savio',
    nazwa: 'Św. Dominik Savio',
    tytul: 'Patron młodych i ministrantów',
    zdjecie: 'https://commons.wikimedia.org/wiki/Special:FilePath/Life_of_Dominic_Savio_%28page_6_crop%29.jpg',
    opis: 'Św. Dominik Savio był uczniem św. Jana Bosko i od najmłodszych lat pragnął świętości w codzienności. Swoją drogę budował przez modlitwę, radość, posłuszeństwo i troskę o innych. Ministrantom przypomina, że świętość zaczyna się od małych, wiernie wykonywanych obowiązków: punktualności, skupienia i dobrego przykładu.',
    modlitwa: 'Święty Dominiku Savio, pomóż mi być radosnym i wiernym ministrantem. Ucz mnie żyć blisko Boga na co dzień i służyć z czystym sercem. Amen.',
  },
  {
    id: 'jan-berchmans',
    nazwa: 'Św. Jan Berchmans',
    tytul: 'Patron ministrantów i studentów',
    zdjecie: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jean_Berchmans_%281599-1621%29.jpg',
    opis: 'Św. Jan Berchmans, jezuita, zasłynął z tego, że zwyczajne obowiązki wykonywał nadzwyczaj wiernie. Nie szukał wielkich rzeczy, ale codziennie dbał o porządek serca, modlitwę i wierność regule życia. Dla ministranta jest przykładem, że dojrzała służba rodzi się z systematyczności, pokory i odpowiedzialności.',
    modlitwa: 'Święty Janie Berchmansie, uproś mi ducha wierności w małych rzeczach. Pomóż mi służyć spokojnie, sumiennie i z miłością do Boga. Amen.',
  },
  {
    id: 'alojzy-gonzaga',
    nazwa: 'Św. Alojzy Gonzaga',
    tytul: 'Patron młodzieży i czystości serca',
    zdjecie: 'https://commons.wikimedia.org/wiki/Special:FilePath/Saint_Aloysius_Gonzaga.jpg',
    opis: 'Św. Alojzy Gonzaga pochodził z możnej rodziny, ale wybrał drogę służby Bogu i ludziom. Wyróżniał się modlitwą, skromnością i troską o chorych, którym pomagał aż do oddania własnego życia. Ministrantom pokazuje, że prawdziwa wielkość to czyste serce, dyscyplina wewnętrzna i gotowość do ofiary dla innych.',
    modlitwa: 'Święty Alojzy Gonzago, wypraszaj mi czystość serca, opanowanie i wierność Jezusowi. Ucz mnie służby pełnej szacunku, ciszy i miłości. Amen.',
  },
] as const;

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

function TiptapImageView({ node, updateAttributes, selected }: NodeViewProps) {
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

function TiptapYoutubeView({ node, updateAttributes, selected }: NodeViewProps) {
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
  const [isAdminPreviewMode, setIsAdminPreviewMode] = useState(false);
  const [adminImpersonationSession, setAdminImpersonationSession] = useState<AdminImpersonationSession | null>(null);
  const [adminImpersonationStopping, setAdminImpersonationStopping] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset-sent' | 'email-sent'>('login');

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
  const [dekanat, setDekanat] = useState('');
  const [dekanatSearch, setDekanatSearch] = useState('');
  const [dekanatOpen, setDekanatOpen] = useState(false);
  const dekanatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dekanatOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dekanatRef.current && !dekanatRef.current.contains(e.target as Node)) {
        setDekanatOpen(false);
        setDekanatSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dekanatOpen]);

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
    dekanat?: string;
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
  const [showZbiorkaModal, setShowZbiorkaModal] = useState(false);
  const [showZbiorkaAttendanceModal, setShowZbiorkaAttendanceModal] = useState(false);
  const [showPoslugiModal, setShowPoslugiModal] = useState(false);
  const [showGrupaModal, setShowGrupaModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGrupyEditModal, setShowGrupyEditModal] = useState(false);
  const [showPoslugaEditModal, setShowPoslugaEditModal] = useState(false);
  const [showAddPoslugaModal, setShowAddPoslugaModal] = useState(false);
  const [showParishAdminsModal, setShowParishAdminsModal] = useState(false);
  const [adminRoleSavingIds, setAdminRoleSavingIds] = useState<Set<string>>(new Set());
  const [adminSearchMinistrant, setAdminSearchMinistrant] = useState('');
  const [permissionsMemberId, setPermissionsMemberId] = useState('');
  const [permissionsDraft, setPermissionsDraft] = useState<ParishPermissionKey[]>([]);
  const [fullConfigAccessDraft, setFullConfigAccessDraft] = useState(false);
  const [fullConfigWithRankingApprovalsDraft, setFullConfigWithRankingApprovalsDraft] = useState(false);
  const [permissionAssignDraft, setPermissionAssignDraft] = useState<Partial<Record<ParishPermissionKey, string>>>({});

  // Dane
  const [sluzby, setSluzby] = useState<Sluzba[]>([]);
  const [sluzbyArchiwum, setSluzbyArchiwum] = useState<Sluzba[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedSluzba, setSelectedSluzba] = useState<Sluzba | null>(null);
  const [selectedZbiorka, setSelectedZbiorka] = useState<Sluzba | null>(null);
  const [selectedZbiorkaAttendance, setSelectedZbiorkaAttendance] = useState<Sluzba | null>(null);

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
  const [expandedPosluga, setExpandedPosluga] = useState<string | null>(null);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [newGrupaForm, setNewGrupaForm] = useState({ nazwa: '', kolor: 'gray', emoji: '⚪', opis: '' });
  const [emailSelectedGrupy, setEmailSelectedGrupy] = useState<string[]>([]);
  const [emailSelectedMinistranci, setEmailSelectedMinistranci] = useState<string[]>([]);
  const [emailSearchMinistrant, setEmailSearchMinistrant] = useState('');
  const canEditPoslugaEmoji = !!isAdminPreviewMode || !!adminImpersonationSession;

  // ==================== STAN — RANKING SŁUŻBY ====================
  const [punktacjaConfig, setPunktacjaConfig] = useState<PunktacjaConfig[]>([]);
  const [rangiConfig, setRangiConfig] = useState<RangaConfig[]>([]);
  const [odznakiConfig, setOdznakiConfig] = useState<OdznakaConfig[]>([]);
  const [dyzury, setDyzury] = useState<Dyzur[]>([]);
  const [obecnosci, setObecnosci] = useState<Obecnosc[]>([]);
  const [minusowePunkty, setMinusowePunkty] = useState<MinusowePunkty[]>([]);
  const [punktyReczne, setPunktyReczne] = useState<PunktyReczne[]>([]);
  const [odznakiZdobyte, setOdznakiZdobyte] = useState<OdznakaZdobyta[]>([]);
  const [rankingData, setRankingData] = useState<RankingEntry[]>([]);
  const [showZglosModal, setShowZglosModal] = useState(false);
  const [showAktywnoscModal, setShowAktywnoscModal] = useState(false);
  const [aktywnoscForm, setAktywnoscForm] = useState(buildInitialAktywnoscForm);
  const [aktywnoscSubmitting, setAktywnoscSubmitting] = useState(false);
  const [showCustomPointsModal, setShowCustomPointsModal] = useState(false);
  const [customPointsTarget, setCustomPointsTarget] = useState<Obecnosc | null>(null);
  const [customPointsValue, setCustomPointsValue] = useState('');
  const [customPointsSaving, setCustomPointsSaving] = useState(false);
  const [showDyzuryModal, setShowDyzuryModal] = useState(false);
  const [dyzurConfirm, setDyzurConfirm] = useState<{
    dzien: number;
    type: 'first' | 'add' | 'change';
    godzina: string;
    replaceFromDzien: number | null;
    allowModeChoice: boolean;
  } | null>(null);
  const [showEditProfilModal, setShowEditProfilModal] = useState(false);
  const [editProfilForm, setEditProfilForm] = useState({ imie: '', nazwisko: '', email: '' });
  const [editDyzury, setEditDyzury] = useState(false);
  const [showGrafikModal, setShowGrafikModal] = useState(false);
  const [grafikAddHourByDay, setGrafikAddHourByDay] = useState<Record<number, string>>({});
  const [dyzurHourDraftById, setDyzurHourDraftById] = useState<Record<string, string>>({});
  const [showDyzuryAdminModal, setShowDyzuryAdminModal] = useState(false);
  const [showZatwierdzModal, setShowZatwierdzModal] = useState(false);
  const [searchMinistrant, setSearchMinistrant] = useState('');
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [showDeleteParafiaModal, setShowDeleteParafiaModal] = useState<1 | 2 | null>(null);
  const [deleteParafiaLoading, setDeleteParafiaLoading] = useState(false);
  const [deleteParafiaConfirmText, setDeleteParafiaConfirmText] = useState('');
  const [showDodajPunktyModal, setShowDodajPunktyModal] = useState(false);
  const [showPunktyHistoriaModal, setShowPunktyHistoriaModal] = useState(false);
  const [selectedPunktyHistoriaMember, setSelectedPunktyHistoriaMember] = useState<Member | null>(null);
  const [deletingPunktyHistoriaEntryKey, setDeletingPunktyHistoriaEntryKey] = useState<string | null>(null);
  const [dodajPunktyForm, setDodajPunktyForm] = useState({ punkty: '', powod: '' });
  const [showRankingSettings, setShowRankingSettings] = useState(false);
  const [showResetPunktacjaModal, setShowResetPunktacjaModal] = useState(false);
  const [showToggleAktywnoscZgloszenModal, setShowToggleAktywnoscZgloszenModal] = useState(false);
  const [toggleAktywnoscZgloszenSaving, setToggleAktywnoscZgloszenSaving] = useState(false);
  const [zglosForm, setZglosForm] = useState({ data: '', typ: 'msza' as 'msza' | 'nabożeństwo' | 'wydarzenie', nazwa_nabożeństwa: '', godzina: '', wydarzenie_id: '' });
  const [zglosSubmitting, setZglosSubmitting] = useState(false);
  const [zglosSuccess, setZglosSuccess] = useState(false);
  const [rankingSettingsTab, setRankingSettingsTab] = useState<RankingSettingsTab>('punkty');
  const [newPunktacjaForm, setNewPunktacjaForm] = useState<NewPunktacjaFormState>({ klucz: '', wartosc: 0, opis: '' });
  const [showNewPunktacjaForm, setShowNewPunktacjaForm] = useState(false);
  const [punktacjaDraft, setPunktacjaDraft] = useState<Record<string, number>>({});
  const [punktacjaSaving, setPunktacjaSaving] = useState(false);
  const [approvingObecnosciIds, setApprovingObecnosciIds] = useState<Set<string>>(new Set());
  const [rejectingObecnosciIds, setRejectingObecnosciIds] = useState<Set<string>>(new Set());
  const [bulkApprovingObecnosci, setBulkApprovingObecnosci] = useState(false);
  const [approvingDyzurIds, setApprovingDyzurIds] = useState<Set<string>>(new Set());
  const [editingOdznakaId, setEditingOdznakaId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ punkty: number; total: number } | null>(null);
  const prevObecnosciRef = useRef<Obecnosc[]>([]);
  const authAccessTokenRef = useRef<string | null>(null);
  const impersonationAutoExitSentRef = useRef(false);
  const [sluzbaInlineSavingIds, setSluzbaInlineSavingIds] = useState<Set<string>>(new Set());
  const [deletingSluzbaIds, setDeletingSluzbaIds] = useState<Set<string>>(new Set());
  const [showIOSInstallBanner, setShowIOSInstallBanner] = useState(false);
  const [showAllZgloszenia, setShowAllZgloszenia] = useState(false);
  const [showAllSluzbyForMinistrant, setShowAllSluzbyForMinistrant] = useState(false);
  const [showPriestRankingInfo, setShowPriestRankingInfo] = useState(false);
  const [hidePriestRankingInfoPermanently, setHidePriestRankingInfoPermanently] = useState(false);
  const [showPriestMinistranciInfo, setShowPriestMinistranciInfo] = useState(false);
  const [hidePriestMinistranciInfoPermanently, setHidePriestMinistranciInfoPermanently] = useState(false);
  const [showPriestWydarzeniaInfo, setShowPriestWydarzeniaInfo] = useState(false);
  const [hidePriestWydarzeniaInfoPermanently, setHidePriestWydarzeniaInfoPermanently] = useState(false);
  const [showPriestPoslugiInfo, setShowPriestPoslugiInfo] = useState(false);
  const [hidePriestPoslugiInfoPermanently, setHidePriestPoslugiInfoPermanently] = useState(false);
  const [isAndroidAppContext, setIsAndroidAppContext] = useState(false);
  const [isIosAppContext, setIsIosAppContext] = useState(false);
  const [androidAppVersionCode, setAndroidAppVersionCode] = useState<number | null>(null);

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
  const [tablicaCategoryFilter, setTablicaCategoryFilter] = useState<'wszystkie' | 'ogłoszenie' | 'dyskusja' | 'ankieta'>('wszystkie');
  const [expandedArchSluzba, setExpandedArchSluzba] = useState<string | null>(null);
  const [newWiadomoscTresc, setNewWiadomoscTresc] = useState('');
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<'wiadomosc' | 'watek' | null>(null);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [infoBanerReady, setInfoBanerReady] = useState(false);
  const [infoBanerEnabled, setInfoBanerEnabled] = useState(true);
  const [infoBanerTresc, setInfoBanerTresc] = useState({ tytul: '', opis: '' });
  const [modlitwyTresc, setModlitwyTresc] = useState({ przed: '', po: '' });
  const [editingModlitwa, setEditingModlitwa] = useState<'przed' | 'po' | null>(null);
  const [modlitwaEditText, setModlitwaEditText] = useState('');
  const [lacinaData, setLacinaData] = useState<typeof MODLITWY.lacina | null>(null);
  const [editingLacinaIdx, setEditingLacinaIdx] = useState<number | null>(null);
  const [lacinaEditForm, setLacinaEditForm] = useState({ k: '', m: '', kPl: '', mPl: '' });
  const [editingLacinaMode, setEditingLacinaMode] = useState(false);
  const [editingParafiaNazwa, setEditingParafiaNazwa] = useState(false);
  const [parafiaNazwaInput, setParafiaNazwaInput] = useState('');
  const [editingAnkietaId, setEditingAnkietaId] = useState<string | null>(null);
  const [ukryjMinistrantow, setUkryjMinistrantow] = useState(false);
  const [editAnkietaForm, setEditAnkietaForm] = useState({ pytanie: '', obowiazkowa: false, wyniki_ukryte: true, termin: '', aktywna: true, opcje: [] as { id: string; tresc: string; kolejnosc: number }[], noweOpcje: [''] });
  const [watekLastReadMap, setWatekLastReadMap] = useState<Record<string, string>>({});
  const [watekUnreadCounts, setWatekUnreadCounts] = useState<Record<string, number>>({});

  // QR Code
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrPdfLoading, setQrPdfLoading] = useState(false);

  // Po każdym logowaniu otwieraj domyślnie zakładkę "Aktualności".
  useEffect(() => {
    if (!currentUser?.id) return;
    setActiveTab('tablica');
    setSelectedWatek(null);
    setTablicaWiadomosci([]);
    setEditingAnkietaId(null);
    setShowArchiwum(false);
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const versionFromQuery = parsePositiveInt(url.searchParams.get('app_vc') ?? url.searchParams.get('mobile_vc'));
    const platformFromQuery = (url.searchParams.get(MOBILE_APP_PLATFORM_QUERY_PARAM) ?? '').trim().toLowerCase();
    const referrer = typeof document !== 'undefined' ? (document.referrer || '') : '';
    const isAndroidReferrer = referrer.startsWith(`android-app://${ANDROID_APP_PACKAGE_ID}`);
    const isAndroidPlatformQuery = platformFromQuery === ANDROID_APP_PLATFORM_QUERY_VALUE;
    const isIosPlatformQuery = platformFromQuery === IOS_APP_PLATFORM_QUERY_VALUE;
    const storedAndroidContextFlag = readSessionStorage(ANDROID_APP_CONTEXT_SESSION_KEY) === '1';
    const storedIosContextFlag = readSessionStorage(IOS_APP_CONTEXT_SESSION_KEY) === '1';
    const storedAndroidVersionCode = parsePositiveInt(readSessionStorage(ANDROID_APP_VERSION_SESSION_KEY));
    const storedIosVersionCode = parsePositiveInt(readSessionStorage(IOS_APP_VERSION_SESSION_KEY));
    const isAndroidUserAgent = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
    const isIosUserAgent = typeof navigator !== 'undefined' && /(iphone|ipad|ipod)/i.test(navigator.userAgent || '');

    const isAndroidAppSignal = isAndroidReferrer || isAndroidPlatformQuery;
    const isIosAppSignal = isIosPlatformQuery;

    if (isAndroidAppSignal) {
      writeSessionStorage(ANDROID_APP_CONTEXT_SESSION_KEY, '1');
      if (versionFromQuery !== null) {
        writeSessionStorage(ANDROID_APP_VERSION_SESSION_KEY, String(versionFromQuery));
      }
    }

    if (isIosAppSignal) {
      writeSessionStorage(IOS_APP_CONTEXT_SESSION_KEY, '1');
      if (versionFromQuery !== null) {
        writeSessionStorage(IOS_APP_VERSION_SESSION_KEY, String(versionFromQuery));
      }
    }

    const resolvedAndroidContext = isAndroidAppSignal || (storedAndroidContextFlag && isAndroidUserAgent);
    const resolvedIosContext = isIosAppSignal || (storedIosContextFlag && isIosUserAgent);

    setIsAndroidAppContext(resolvedAndroidContext && !resolvedIosContext);
    setIsIosAppContext(resolvedIosContext && !resolvedAndroidContext);
    setAndroidAppVersionCode(
      versionFromQuery
      ?? storedAndroidVersionCode
      ?? storedIosVersionCode
    );
  }, []);
  const qrPosterRef = useRef<HTMLDivElement | null>(null);
  const wiadomoscInputRef = useRef<HTMLInputElement | null>(null);

  // Premium / Subskrypcja
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumCode, setPremiumCode] = useState('');
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [premiumCheckoutLoading, setPremiumCheckoutLoading] = useState(false);
  const [premiumOneTimeCheckoutLoading, setPremiumOneTimeCheckoutLoading] = useState(false);
  const [premiumPortalLoading, setPremiumPortalLoading] = useState(false);
  const [googlePlayCheckoutLoading, setGooglePlayCheckoutLoading] = useState(false);
  const [appleCheckoutLoading, setAppleCheckoutLoading] = useState(false);
  const [premiumInvoiceForm, setPremiumInvoiceForm] = useState<PremiumInvoiceForm>(() => buildInitialPremiumInvoiceForm(''));
  const [premiumInvoiceErrors, setPremiumInvoiceErrors] = useState<PremiumInvoiceErrors>({});
  const [premiumInvoiceRequested, setPremiumInvoiceRequested] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  const currentParafiaMember = useMemo(
    () => members.find((m) => m.profile_id === currentUser?.id) ?? null,
    [members, currentUser?.id]
  );
  const currentParafiaMemberRoles = useMemo(
    () => normalizeMemberRoles(currentParafiaMember?.role),
    [currentParafiaMember?.role]
  );
  const currentUserPermissionKeys = useMemo(
    () => getAssignedPermissionKeys(currentParafiaMember?.role),
    [currentParafiaMember?.role]
  );
  const isPriestUser = currentUser?.typ === 'ksiadz';
  const isLegacyParishAdmin = hasParishAdminRole(currentParafiaMember?.role);
  const hasLegacyRankingPermission = currentParafiaMemberRoles.includes(LEGACY_RANKING_PERMISSION_TOKEN);
  const hasPriestPermission = (permission: ParishPermissionKey) => (
    isPriestUser || isLegacyParishAdmin || currentUserPermissionKeys.includes(permission)
  );
  const canManageNews = hasPriestPermission('manage_news');
  const canManageMembers = hasPriestPermission('manage_members');
  const canApproveRankingSubmissions = hasLegacyRankingPermission || hasPriestPermission('approve_ranking_submissions');
  const canManageRankingSettings = hasLegacyRankingPermission || hasPriestPermission('manage_ranking_settings');
  const canManageRanking = canApproveRankingSubmissions || canManageRankingSettings;
  const canManageEvents = hasPriestPermission('manage_events');
  const canEditLiturgicalCalendar = isPriestUser || canManageEvents;
  const canManageFunctionTemplates = hasPriestPermission('manage_function_templates');
  const canManagePoslugiCatalog = hasPriestPermission('manage_poslugi_catalog');
  const canEditPrayers = hasPriestPermission('edit_prayers');
  const canManageInvites = hasPriestPermission('manage_invites');
  const canManagePremium = hasPriestPermission('manage_premium');
  const clientPlatform = isAndroidAppContext ? 'android-app' : isIosAppContext ? 'ios-app' : 'web';
  const canUseStripeBilling = clientPlatform === 'web';
  const mobilePremiumBillingInfo = isIosAppContext ? PREMIUM_IOS_BILLING_INFO : PREMIUM_ANDROID_BILLING_INFO;
  const premiumDaysLeft = useMemo(() => {
    const rawDate = subscription?.premium_expires_at;
    if (!rawDate) return null;
    const expiresAt = new Date(rawDate);
    if (Number.isNaN(expiresAt.getTime())) return null;
    const diffMs = expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [subscription?.premium_expires_at]);
  const isRegularMinistrant = currentUser?.typ === 'ministrant';
  const canUseMinistrantTablica = currentUser?.typ === 'ministrant' && !canManageNews;
  const canUseMinistrantRanking = currentUser?.typ === 'ministrant';
  const canUseMinistrantEvents = currentUser?.typ === 'ministrant' && !canManageEvents && !canManageFunctionTemplates;
  const canUseMinistrantPoslugi = currentUser?.typ === 'ministrant' && !canManagePoslugiCatalog;
  const canUseMinistrantModlitwy = currentUser?.typ === 'ministrant' && !canEditPrayers;
  const priestRankingInfoStorageKey = useMemo(() => {
    if (!currentUser?.id || !currentUser?.parafia_id) return null;
    return `${PRIEST_RANKING_INFO_DISMISSED_KEY_PREFIX}:${currentUser.id}:${currentUser.parafia_id}`;
  }, [currentUser?.id, currentUser?.parafia_id]);
  const priestMinistranciInfoStorageKey = useMemo(() => {
    if (!currentUser?.id || !currentUser?.parafia_id) return null;
    return `${PRIEST_MINISTRANCI_INFO_DISMISSED_KEY_PREFIX}:${currentUser.id}:${currentUser.parafia_id}`;
  }, [currentUser?.id, currentUser?.parafia_id]);
  const priestWydarzeniaInfoStorageKey = useMemo(() => {
    if (!currentUser?.id || !currentUser?.parafia_id) return null;
    return `${PRIEST_WYDARZENIA_INFO_DISMISSED_KEY_PREFIX}:${currentUser.id}:${currentUser.parafia_id}`;
  }, [currentUser?.id, currentUser?.parafia_id]);
  const priestPoslugiInfoStorageKey = useMemo(() => {
    if (!currentUser?.id || !currentUser?.parafia_id) return null;
    return `${PRIEST_POSLUGI_INFO_DISMISSED_KEY_PREFIX}:${currentUser.id}:${currentUser.parafia_id}`;
  }, [currentUser?.id, currentUser?.parafia_id]);
  const ensureRankingApprovalPermission = () => {
    if (canApproveRankingSubmissions) return true;
    alert('Nie masz uprawnień do zatwierdzania zgłoszeń.');
    return false;
  };
  const ensureRankingSettingsPermission = () => {
    if (canManageRankingSettings) return true;
    alert('Nie masz uprawnień do konfiguracji rankingu.');
    return false;
  };
  const selectedMemberPunktyHistoria = useMemo<SelectedMemberPunktyHistoriaEntry[]>(() => {
    if (!selectedPunktyHistoriaMember) return [];
    const memberId = selectedPunktyHistoriaMember.profile_id;
    const historyEntries: SelectedMemberPunktyHistoriaEntry[] = [
      ...obecnosci
        .filter((o) => o.ministrant_id === memberId && o.status === 'zatwierdzona')
        .map((o) => ({
          kind: 'obecnosc' as const,
          id: o.id,
          createdAt: o.created_at || `${o.data}T00:00:00`,
          obec: o,
        })),
      ...punktyReczne
        .filter((p) => p.ministrant_id === memberId)
        .map((p) => ({
          kind: 'korekta' as const,
          id: p.id,
          createdAt: p.created_at || `${p.data}T00:00:00`,
          korekta: p,
        })),
      ...minusowePunkty
        .filter((m) => m.ministrant_id === memberId)
        .map((m) => ({
          kind: 'minusowe' as const,
          id: m.id,
          createdAt: m.created_at || `${m.data}T00:00:00`,
          minusowe: m,
        })),
    ];

    const getHistoryDate = (entry: SelectedMemberPunktyHistoriaEntry) => {
      if (entry.kind === 'obecnosc') return entry.obec.data;
      if (entry.kind === 'korekta') return entry.korekta.data;
      return entry.minusowe.data;
    };

    return historyEntries.sort((a, b) => {
      const dateDiff = getHistoryDate(b).localeCompare(getHistoryDate(a));
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [selectedPunktyHistoriaMember, obecnosci, punktyReczne, minusowePunkty]);

  const authFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session.access_token;
      const refreshed = await supabase.auth.refreshSession();
      return refreshed.data.session?.access_token || null;
    };

    const applyClientPlatformHeaders = (headers: Headers) => {
      if (!headers.has('x-client-platform')) {
        headers.set('x-client-platform', clientPlatform);
      }
      if ((isAndroidAppContext || isIosAppContext) && androidAppVersionCode !== null && !headers.has('x-mobile-app-vc')) {
        headers.set('x-mobile-app-vc', String(androidAppVersionCode));
      }
    };

    const baseHeaders = new Headers(init.headers || {});
    applyClientPlatformHeaders(baseHeaders);
    let accessToken = await getAccessToken();
    if (accessToken) {
      baseHeaders.set('Authorization', `Bearer ${accessToken}`);
    }

    let response = await fetch(input, { ...init, headers: baseHeaders });
    if (response.status !== 401) return response;

    accessToken = await getAccessToken();
    if (!accessToken) return response;

    const retryHeaders = new Headers(init.headers || {});
    applyClientPlatformHeaders(retryHeaders);
    retryHeaders.set('Authorization', `Bearer ${accessToken}`);
    response = await fetch(input, { ...init, headers: retryHeaders });
    return response;
  }, [androidAppVersionCode, clientPlatform, isAndroidAppContext, isIosAppContext]);

  const canUseAdminImpersonation = !!currentUser?.email && ADMIN_PREVIEW_EMAILS.includes(currentUser.email.toLowerCase());

  const loadAdminImpersonationStatus = useCallback(async () => {
    if (!canUseAdminImpersonation) {
      setAdminImpersonationSession(null);
      return;
    }
    try {
      const res = await authFetch('/api/admin/impersonation/status', { method: 'GET' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.ok) {
        setAdminImpersonationSession(null);
        return;
      }
      setAdminImpersonationSession((result.active ? result.session : null) as AdminImpersonationSession | null);
    } catch {
      setAdminImpersonationSession(null);
    }
  }, [authFetch, canUseAdminImpersonation]);

  const stopAdminImpersonationSession = useCallback(async () => {
    if (!adminImpersonationSession) return true;
    try {
      const res = await authFetch('/api/admin/impersonation/stop', { method: 'POST' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.ok) {
        return false;
      }
      setAdminImpersonationSession(null);
      return true;
    } catch {
      return false;
    }
  }, [adminImpersonationSession, authFetch]);

  const stopAdminImpersonationKeepalive = useCallback(() => {
    if (!adminImpersonationSession || impersonationAutoExitSentRef.current) return;
    const accessToken = authAccessTokenRef.current;
    if (!accessToken) return;

    impersonationAutoExitSentRef.current = true;
    void fetch('/api/admin/impersonation/stop', {
      method: 'POST',
      keepalive: true,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    }).catch(() => {
      // Zamknięcie karty / przeładowanie — ignorujemy błędy best-effort.
    });
  }, [adminImpersonationSession]);

  const handleStopAdminImpersonation = useCallback(async () => {
    if (adminImpersonationStopping) return;
    setAdminImpersonationStopping(true);
    try {
      const stopped = await stopAdminImpersonationSession();
      if (!stopped) {
        alert('Nie udało się zakończyć trybu admina.');
        return;
      }
      window.location.assign('/admin');
    } catch (err) {
      alert('Wystąpił błąd: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdminImpersonationStopping(false);
    }
  }, [adminImpersonationStopping, stopAdminImpersonationSession]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser?.id) {
      setWatekLastReadMap({});
      return;
    }
    try {
      const raw = readLocalStorage(`watek-last-read:${currentUser.id}`);
      setWatekLastReadMap(raw ? JSON.parse(raw) as Record<string, string> : {});
    } catch {
      setWatekLastReadMap({});
    }
  }, [currentUser?.id]);

  const markWatekLocallyRead = useCallback((watekId: string, whenIso = new Date().toISOString()) => {
    if (!currentUser?.id) return;
    setWatekLastReadMap((prev) => {
      const next = { ...prev, [watekId]: whenIso };
      writeLocalStorage(`watek-last-read:${currentUser.id}`, JSON.stringify(next));
      return next;
    });
    setWatekUnreadCounts((prev) => ({ ...prev, [watekId]: 0 }));
  }, [currentUser?.id]);

  const refreshWatekUnreadCounts = useCallback(async () => {
    if (!currentUser?.id) {
      setWatekUnreadCounts({});
      return;
    }
    const now = new Date();
    const dyskusje = tablicaWatki.filter((w) => {
      if (w.kategoria !== 'dyskusja') return false;
      if (w.archiwum_data && new Date(w.archiwum_data) <= now) return false;
      if (w.grupa_docelowa === 'ksieza' && !canManageNews) return false;
      if (w.grupa_docelowa === 'ministranci' && currentUser.typ !== 'ministrant') return false;
      return true;
    });
    if (dyskusje.length === 0) {
      setWatekUnreadCounts({});
      return;
    }

    const entries = await Promise.all(
      dyskusje.map(async (w) => {
        let query = supabase
          .from('tablica_wiadomosci')
          .select('*', { count: 'exact', head: true })
          .eq('watek_id', w.id)
          .neq('autor_id', currentUser.id);
        const lastRead = watekLastReadMap[w.id];
        if (lastRead) query = query.gt('created_at', lastRead);
        const { count, error } = await query;
        return [w.id, error ? 0 : (count || 0)] as const;
      })
    );

    setWatekUnreadCounts(Object.fromEntries(entries));
  }, [currentUser?.id, currentUser?.typ, canManageNews, tablicaWatki, watekLastReadMap]);

  useEffect(() => {
    if (activeTab !== 'tablica' || selectedWatek) return;
    refreshWatekUnreadCounts();
  }, [activeTab, selectedWatek, refreshWatekUnreadCounts]);

  useEffect(() => {
    setReplyToMessageId(null);
  }, [selectedWatek?.id]);

  const handleDownloadQrPosterPdf = useCallback(async () => {
    const el = qrPosterRef.current;
    if (!el || qrPdfLoading) return;

    setQrPdfLoading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const drawW = pageW - margin * 2;
      const drawH = (imgH * drawW) / imgW;

      if (drawH <= pageH - margin * 2) {
        const y = (pageH - drawH) / 2;
        pdf.addImage(imgData, 'PNG', margin, y, drawW, drawH);
      } else {
        const fitH = pageH - margin * 2;
        const fitW = (imgW * fitH) / imgH;
        const x = (pageW - fitW) / 2;
        pdf.addImage(imgData, 'PNG', x, margin, fitW, fitH);
      }

      const parishSlug = (currentParafia?.nazwa || 'parafia')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`plakat-qr-${parishSlug || 'parafia'}-${date}.pdf`);
    } catch (error) {
      console.error('Błąd generowania plakatu PDF:', error);
      alert('Nie udało się wygenerować PDF. Spróbuj ponownie.');
    } finally {
      setQrPdfLoading(false);
    }
  }, [currentParafia?.nazwa, qrPdfLoading]);

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
    const saved = readLocalStorage('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    writeLocalStorage('darkMode', String(next));
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
  const [parafiaKodRabatowy, setParafiaKodRabatowy] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const [sluzbaForm, setSluzbaForm] = useState({
    nazwa: '',
    data: '',
    godzina: '',
    funkcjePerHour: {} as FunkcjePerHourMap
  });
  const [sluzbaValidationAttempted, setSluzbaValidationAttempted] = useState(false);
  const [sluzbaExternalAssignments, setSluzbaExternalAssignments] = useState<Record<string, string>>({});
  const [sluzbaEkstraPunkty, setSluzbaEkstraPunkty] = useState<number | null>(null);
  const sluzbaCleanGodzina = sluzbaForm.godzina.split(',').map(g => g.trim()).filter(Boolean).join(', ');
  const sluzbaRequiredErrors = {
    nazwa: sluzbaValidationAttempted && !sluzbaForm.nazwa.trim(),
    data: sluzbaValidationAttempted && !sluzbaForm.data,
    godzina: sluzbaValidationAttempted && !sluzbaCleanGodzina,
  };
  const [zbiorkaSaving, setZbiorkaSaving] = useState(false);
  const [zbiorkaAttendanceSaving, setZbiorkaAttendanceSaving] = useState(false);
  const [zbiorkaForm, setZbiorkaForm] = useState({
    data: '',
    godzina: '',
    miejsce: '',
    notatka: '',
    grupyDocelowe: [] as string[],
    punktyZaObecnosc: 10,
    punktyZaNieobecnosc: 10,
  });
  const [zbiorkaAttendance, setZbiorkaAttendance] = useState<Record<string, ZbiorkaObecnoscStatus>>({});
  const [zbiorkaAssignmentsBySluzba, setZbiorkaAssignmentsBySluzba] = useState<Record<string, ZbiorkaObecnosc[]>>({});

  // Kalendarz liturgiczny
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DzienLiturgiczny | null>(null);
  const [calendarOverrides, setCalendarOverrides] = useState<Record<string, LiturgicalDayOverride>>({});
  const [calendarEditMode, setCalendarEditMode] = useState(false);
  const [calendarEditSaving, setCalendarEditSaving] = useState(false);
  const [calendarEditForm, setCalendarEditForm] = useState<LiturgicalDayOverride>({
    nazwa: '',
    kolor: 'zielony',
    ranga: 'dzien_powszedni',
    okres: '',
  });

  const applyLiturgicalDayOverride = useCallback((day: DzienLiturgiczny): DzienLiturgiczny => {
    const override = calendarOverrides[day.date];
    return override ? { ...day, ...override } : day;
  }, [calendarOverrides]);

  // Dzisiejszy dzień liturgiczny (dla belki koloru)
  const dzisLiturgiczny = useMemo(() => {
    const now = new Date();
    const days = getLiturgicalMonth(now.getFullYear(), now.getMonth()).map(applyLiturgicalDayOverride);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return days.find(d => d.date === todayStr) || null;
  }, [applyLiturgicalDayOverride]);

  // ==================== FUNKCJE ŁADOWANIA ====================

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const previewRoleParam = params?.get('preview_role');
        const previewRole: UserType | null = previewRoleParam === 'ksiadz' || previewRoleParam === 'ministrant'
          ? previewRoleParam
          : null;
        const previewParafia = params?.get('preview_parafia') || null;
        const wantsPreviewSession = Boolean(previewParafia && previewRole);

        let canPreviewRole = !!profile.email && ADMIN_PREVIEW_EMAILS.includes(profile.email.toLowerCase());
        if (!canPreviewRole && wantsPreviewSession) {
          try {
            const previewAccessRes = await authFetch('/api/admin/impersonation/status', { method: 'GET' });
            canPreviewRole = previewAccessRes.ok;
          } catch {
            canPreviewRole = false;
          }
        }

        const previewSession = canPreviewRole && wantsPreviewSession;

        const effectiveProfile: Profile = previewSession
          ? { ...(profile as Profile), typ: previewRole as UserType, parafia_id: previewParafia }
          : (profile as Profile);

        setIsAdminPreviewMode(Boolean(previewSession));
        setCurrentUser(effectiveProfile);
        // Sprawdź czy profil wymaga uzupełnienia (użytkownik OAuth z typ='nowy')
        if (effectiveProfile.typ === 'nowy' || !effectiveProfile.imie) {
          setProfileCompletionForm({
            imie: effectiveProfile.imie || '',
            nazwisko: effectiveProfile.nazwisko || '',
            typ: 'ministrant',
          });
          setShowProfileCompletion(true);
        }
      }
    } catch {
      // Błąd sieci / sesji — nie blokuj ekranu
      setIsAdminPreviewMode(false);
    }
    setLoading(false);
  }, [authFetch]);

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

    if (membersData) setMembers(membersData.map(m => ({ ...m, role: normalizeMemberRoles(m.role) })) as Member[]);
  }, [currentUser?.parafia_id]);

  const loadSluzby = useCallback(async () => {
    if (!currentUser?.parafia_id) return;

    const today = getLocalISODate();

    const { data: sluzbyData } = await supabase
      .from('sluzby')
      .select('*, funkcje(*)')
      .eq('parafia_id', currentUser.parafia_id)
      .gte('data', today)
      .order('data', { ascending: true });

    if (sluzbyData) {
      const nextSluzby = sluzbyData as Sluzba[];
      setSluzby(nextSluzby);

      const zbiorkaSluzbyIds = nextSluzby.filter((s) => s.typ === 'zbiorka').map((s) => s.id);
      if (zbiorkaSluzbyIds.length > 0) {
        const { data: attendanceRows, error: attendanceError } = await supabase
          .from('zbiorka_obecnosci')
          .select('*')
          .in('sluzba_id', zbiorkaSluzbyIds);
        if (attendanceError) {
          console.warn('Nie udało się załadować obecności zbiórek:', attendanceError.message);
          setZbiorkaAssignmentsBySluzba({});
        } else {
          const bySluzba: Record<string, ZbiorkaObecnosc[]> = {};
          (attendanceRows as ZbiorkaObecnosc[] || []).forEach((row) => {
            if (!bySluzba[row.sluzba_id]) bySluzba[row.sluzba_id] = [];
            bySluzba[row.sluzba_id].push(row);
          });
          setZbiorkaAssignmentsBySluzba(bySluzba);
        }
      } else {
        setZbiorkaAssignmentsBySluzba({});
      }

      // Recovery: jeśli w wydarzeniach istnieją funkcje, których nie ma w funkcje_config,
      // dołącz je do listy, aby były widoczne w "Funkcje ministrantów" i przy edycji.
      setFunkcjeConfig((prev) => {
        const normalize = (value: string) =>
          value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const existingNames = new Set(prev.map((f) => normalize(f.nazwa)));
        const existingIds = new Set(prev.map((f) => f.id));

        const missingNames = Array.from(
          new Set(
            nextSluzby
              .flatMap((sluzba) => sluzba.funkcje || [])
              .map((funkcja) => (typeof funkcja.typ === 'string' ? funkcja.typ.trim() : ''))
              .filter(Boolean)
          )
        ).filter((name) => !existingNames.has(normalize(name)));

        if (missingNames.length === 0) return prev;

        const toId = (name: string) =>
          name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-ząćęłńóśźż0-9_]/gi, '') || 'funkcja';

        const recovered = missingNames.map((nazwa, index) => {
          const baseId = toId(nazwa);
          let id = baseId;
          let suffix = 2;
          while (existingIds.has(id)) {
            id = `${baseId}_${suffix}`;
            suffix += 1;
          }
          existingIds.add(id);

          return {
            id,
            nazwa,
            opis: '',
            emoji: '⭐',
            kolor: 'gray',
          } as FunkcjaConfig;
        });

        return [...prev, ...recovered];
      });
    }

    // Archiwum — wydarzenia z przeszłości (max 30 dni wstecz)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = getLocalISODate(thirtyDaysAgo);

    const { data: archiwumData } = await supabase
      .from('sluzby')
      .select('*, funkcje(*)')
      .eq('parafia_id', currentUser.parafia_id)
      .lt('data', today)
      .gte('data', thirtyDaysAgoStr)
      .order('data', { ascending: false });

    if (archiwumData) setSluzbyArchiwum(archiwumData as Sluzba[]);

    // Auto-usuwanie wydarzeń starszych niż 30 dni
    await supabase
      .from('sluzby')
      .delete()
      .eq('parafia_id', currentUser.parafia_id)
      .lt('data', thirtyDaysAgoStr);
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
      { data: ignoredAutoMinusData },
      { data: punktyReczneData },
      { data: odznakiZdobyteData },
      { data: rankingRows },
    ] = await Promise.all([
      supabase.from('punktacja_config').select('*').eq('parafia_id', pid),
      supabase.from('rangi_config').select('*').eq('parafia_id', pid).order('kolejnosc'),
      supabase.from('odznaki_config').select('*').eq('parafia_id', pid),
      supabase.from('dyzury').select('*').eq('parafia_id', pid),
      supabase.from('obecnosci').select('*').eq('parafia_id', pid).order('data', { ascending: false }),
      supabase.from('minusowe_punkty').select('*').eq('parafia_id', pid),
      supabase.from('auto_dyzur_minus_ignored').select('*').eq('parafia_id', pid),
      supabase.from('punkty_reczne').select('*').eq('parafia_id', pid).order('created_at', { ascending: false }),
      supabase.from('odznaki_zdobyte').select('*').eq('parafia_id', pid),
      supabase.from('ranking').select('*').eq('parafia_id', pid).order('total_pkt', { ascending: false }),
    ]);

    const shouldSyncAutoDyzurMinus =
      currentUser?.typ === 'ksiadz'
      && !!currentUser.id
      && !!currentParafia?.admin_id
      && currentParafia.admin_id === currentUser.id;

    if (shouldSyncAutoDyzurMinus) {
      const pConfigRows = (pConfig || []) as PunktacjaConfig[];
      const dyzuryRows = (dyzuryData || []) as Dyzur[];
      const obecnosciRows = (obecnosciData || []) as Obecnosc[];
      const minusoweRows = (minusoweData || []) as MinusowePunkty[];
      const ignoredAutoRows = (ignoredAutoMinusData || []) as AutoDyzurMinusIgnored[];
      const ignoredAutoKeySet = new Set(ignoredAutoRows.map((row) => `${row.ministrant_id}:${row.data}`));

      const minusDyzurConfig = pConfigRows.find((cfg) => cfg.klucz === 'minus_nieobecnosc_dyzur');
      const penaltyValue = -Math.abs(Math.round(Number(minusDyzurConfig?.wartosc ?? -5)));
      const limitCfg = pConfigRows.find((cfg) => cfg.klucz === 'limit_dni_zgloszenie');
      const reportWindowDays = Math.max(0, Math.round(Number(limitCfg?.wartosc ?? 2)));

      const applyRankingDeltaForAutoPenalty = async (ministrantId: string, delta: number) => {
        if (!delta) return true;
        const { data: existingRanking, error: rankingFetchError } = await supabase
          .from('ranking')
          .select('*')
          .eq('ministrant_id', ministrantId)
          .eq('parafia_id', pid)
          .maybeSingle();
        if (rankingFetchError) {
          console.warn('Nie udało się pobrać rankingu do auto-kary dyżuru:', rankingFetchError.message);
          return false;
        }

        if (existingRanking) {
          const nextTotal = Number(existingRanking.total_pkt || 0) + delta;
          const nextRanga = getRanga(nextTotal);
          const { error: rankingUpdateError } = await supabase
            .from('ranking')
            .update({
              total_pkt: nextTotal,
              ranga: nextRanga?.nazwa || existingRanking.ranga || 'Ready',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRanking.id);
          if (rankingUpdateError) {
            console.warn('Nie udało się zaktualizować rankingu po auto-karze dyżuru:', rankingUpdateError.message);
            return false;
          }
          return true;
        }

        const baseRanga = getRanga(delta);
        const { error: rankingInsertError } = await supabase
          .from('ranking')
          .insert({
            ministrant_id: ministrantId,
            parafia_id: pid,
            total_pkt: delta,
            total_obecnosci: 0,
            ranga: baseRanga?.nazwa || 'Ready',
          });
        if (rankingInsertError) {
          console.warn('Nie udało się utworzyć rankingu po auto-karze dyżuru:', rankingInsertError.message);
          return false;
        }
        return true;
      };

      if (penaltyValue !== 0) {
        const approvedDyzury = dyzuryRows.filter((dyzur) => dyzur.status === 'zatwierdzona' && dyzur.aktywny !== false);
        const attendanceKeySet = new Set(
          obecnosciRows
            .filter((o) => o.typ !== 'aktywnosc' && o.status !== 'odrzucona')
            .map((o) => `${o.ministrant_id}|${o.data}`)
        );

        const existingAutoEntries = minusoweRows
          .map((row) => {
            const match = (row.powod || '').match(/\[auto_dyzur:([^\]]+)\]/);
            return match ? { key: match[1], row } : null;
          })
          .filter((entry): entry is { key: string; row: MinusowePunkty } => entry !== null);

        const existingAutoKeySet = new Set(existingAutoEntries.map((entry) => entry.key));
        const expectedAutoPenalties = new Map<string, { ministrantId: string; dataISO: string; powod: string; punkty: number }>();

        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        // Kara pojawia się dopiero po upływie całego okna zgłoszenia (diffDays > limitDni).
        cutoffDate.setDate(cutoffDate.getDate() - (reportWindowDays + 1));
        const startDate = new Date(cutoffDate);
        startDate.setDate(startDate.getDate() - AUTO_DYZUR_MINUS_LOOKBACK_DAYS);

        for (const dyzur of approvedDyzury) {
          for (const probe = new Date(startDate); probe <= cutoffDate; probe.setDate(probe.getDate() + 1)) {
            if (probe.getDay() !== dyzur.dzien_tygodnia) continue;

            const dataISO = getLocalISODate(probe);
            if (attendanceKeySet.has(`${dyzur.ministrant_id}|${dataISO}`)) continue;

            const autoKey = `${dyzur.ministrant_id}:${dataISO}`;
            if (ignoredAutoKeySet.has(autoKey)) continue;
            const dayName = DNI_TYGODNIA_FULL[dyzur.dzien_tygodnia === 0 ? 6 : dyzur.dzien_tygodnia - 1];
            const powod = `Brak na dyżurze (${dayName}, ${dataISO}) [auto_dyzur:${autoKey}]`;
            expectedAutoPenalties.set(autoKey, {
              ministrantId: dyzur.ministrant_id,
              dataISO,
              powod,
              punkty: penaltyValue,
            });
          }
        }

        let autoSyncChanged = false;

        for (const existingEntry of existingAutoEntries) {
          if (expectedAutoPenalties.has(existingEntry.key)) continue;

          const rollbackDelta = Math.abs(Number(existingEntry.row.punkty || penaltyValue));
          const { error: minusDeleteError } = await supabase
            .from('minusowe_punkty')
            .delete()
            .eq('id', existingEntry.row.id);
          if (minusDeleteError) {
            console.warn('Nie udało się usunąć nieaktualnej auto-kary dyżuru:', minusDeleteError.message);
            continue;
          }

          const rollbackOk = await applyRankingDeltaForAutoPenalty(existingEntry.row.ministrant_id, rollbackDelta);
          if (!rollbackOk) {
            const { error: restoreError } = await supabase.from('minusowe_punkty').insert({
              ministrant_id: existingEntry.row.ministrant_id,
              parafia_id: existingEntry.row.parafia_id,
              data: existingEntry.row.data,
              powod: existingEntry.row.powod,
              punkty: existingEntry.row.punkty,
            });
            if (restoreError) {
              console.warn('Nie udało się odtworzyć auto-kary dyżuru po błędzie rollbacku rankingu:', restoreError.message);
            }
            continue;
          }
          autoSyncChanged = true;
        }

        for (const [autoKey, penalty] of expectedAutoPenalties) {
          if (existingAutoKeySet.has(autoKey)) continue;

          const { error: minusInsertError } = await supabase.from('minusowe_punkty').insert({
            ministrant_id: penalty.ministrantId,
            parafia_id: pid,
            data: penalty.dataISO,
            powod: penalty.powod,
            punkty: penalty.punkty,
          });
          if (minusInsertError) {
            console.warn('Nie udało się dodać auto-kary dyżuru:', minusInsertError.message);
            continue;
          }

          const rankingOk = await applyRankingDeltaForAutoPenalty(penalty.ministrantId, penalty.punkty);
          if (!rankingOk) {
            const { error: rollbackMinusError } = await supabase
              .from('minusowe_punkty')
              .delete()
              .eq('ministrant_id', penalty.ministrantId)
              .eq('parafia_id', pid)
              .eq('data', penalty.dataISO)
              .eq('powod', penalty.powod);
            if (rollbackMinusError) {
              console.warn('Nie udało się wycofać auto-kary dyżuru po błędzie aktualizacji rankingu:', rollbackMinusError.message);
            }
            continue;
          }
          autoSyncChanged = true;
        }

        if (autoSyncChanged) {
          await loadRankingData();
          return;
        }
      }

      const rankingRowsData = (rankingRows || []) as RankingEntry[];
      const reczneRows = (punktyReczneData || []) as PunktyReczne[];
      const odznakiRows = (odznakiZdobyteData || []) as OdznakaZdobyta[];
      let rankingConsistencyChanged = false;
      const memberIdSet = new Set((members || []).map((m) => m.profile_id));
      const canFilterByCurrentMembers = memberIdSet.size > 0;

      if (canFilterByCurrentMembers) {
        const orphanRankingRows = rankingRowsData.filter((row) => !memberIdSet.has(row.ministrant_id));
        for (const orphanRow of orphanRankingRows) {
          const { error: deleteOrphanRankingError } = await supabase
            .from('ranking')
            .delete()
            .eq('id', orphanRow.id);
          if (deleteOrphanRankingError) {
            console.warn('Nie udało się usunąć osieroconego wpisu rankingu:', deleteOrphanRankingError.message);
            continue;
          }
          rankingConsistencyChanged = true;
        }
        if (rankingConsistencyChanged) {
          await loadRankingData();
          return;
        }
      }

      const rangiRows = (rConfig || []) as RangaConfig[];
      const getRangaNameForTotal = (totalPkt: number) => {
        if (!rangiRows.length) return 'Ready';
        const sorted = [...rangiRows].sort((a, b) => a.min_pkt - b.min_pkt);
        let current = sorted[0];
        for (const row of sorted) {
          if (Number(row.min_pkt || 0) <= totalPkt) current = row;
        }
        return current?.nazwa || 'Ready';
      };

      const expectedTotalByMinistrant = new Map<string, number>();
      const expectedObecnosciByMinistrant = new Map<string, number>();
      for (const row of obecnosciRows) {
        if (row.status !== 'zatwierdzona') continue;
        if (canFilterByCurrentMembers && !memberIdSet.has(row.ministrant_id)) continue;
        expectedTotalByMinistrant.set(
          row.ministrant_id,
          Number(expectedTotalByMinistrant.get(row.ministrant_id) || 0) + Number(row.punkty_finalne || 0)
        );
        expectedObecnosciByMinistrant.set(
          row.ministrant_id,
          Number(expectedObecnosciByMinistrant.get(row.ministrant_id) || 0) + 1
        );
      }
      for (const row of reczneRows) {
        if (canFilterByCurrentMembers && !memberIdSet.has(row.ministrant_id)) continue;
        expectedTotalByMinistrant.set(
          row.ministrant_id,
          Number(expectedTotalByMinistrant.get(row.ministrant_id) || 0) + Number(row.punkty || 0)
        );
      }
      for (const row of minusoweRows) {
        if (canFilterByCurrentMembers && !memberIdSet.has(row.ministrant_id)) continue;
        expectedTotalByMinistrant.set(
          row.ministrant_id,
          Number(expectedTotalByMinistrant.get(row.ministrant_id) || 0) + Number(row.punkty || 0)
        );
      }
      for (const row of odznakiRows) {
        if (canFilterByCurrentMembers && !memberIdSet.has(row.ministrant_id)) continue;
        expectedTotalByMinistrant.set(
          row.ministrant_id,
          Number(expectedTotalByMinistrant.get(row.ministrant_id) || 0) + Number(row.bonus_pkt || 0)
        );
      }

      const rankingByMinistrant = new Map(rankingRowsData.map((row) => [row.ministrant_id, row]));
      const allMinistrantIds = new Set<string>([
        ...rankingByMinistrant.keys(),
        ...expectedTotalByMinistrant.keys(),
        ...expectedObecnosciByMinistrant.keys(),
      ]);

      for (const ministrantId of allMinistrantIds) {
        const expectedTotal = Number(expectedTotalByMinistrant.get(ministrantId) || 0);
        const expectedObecnosci = Number(expectedObecnosciByMinistrant.get(ministrantId) || 0);
        const expectedRanga = getRangaNameForTotal(expectedTotal);
        const existingRanking = rankingByMinistrant.get(ministrantId);

        if (existingRanking) {
          const currentTotal = Number(existingRanking.total_pkt || 0);
          const currentObecnosci = Number(existingRanking.total_obecnosci || 0);
          const currentRanga = existingRanking.ranga || 'Ready';
          if (
            currentTotal === expectedTotal
            && currentObecnosci === expectedObecnosci
            && currentRanga === expectedRanga
          ) {
            continue;
          }

          const { error: rankingFixError } = await supabase
            .from('ranking')
            .update({
              total_pkt: expectedTotal,
              total_obecnosci: expectedObecnosci,
              ranga: expectedRanga,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRanking.id);
          if (rankingFixError) {
            console.warn('Nie udało się skorygować niespójnego rankingu:', rankingFixError.message);
            continue;
          }
          rankingConsistencyChanged = true;
          continue;
        }

        if (expectedTotal === 0 && expectedObecnosci === 0) continue;

        const { error: rankingInsertError } = await supabase
          .from('ranking')
          .insert({
            ministrant_id: ministrantId,
            parafia_id: pid,
            total_pkt: expectedTotal,
            total_obecnosci: expectedObecnosci,
            ranga: expectedRanga,
          });
        if (rankingInsertError) {
          console.warn('Nie udało się utworzyć brakującego wpisu rankingu:', rankingInsertError.message);
          continue;
        }
        rankingConsistencyChanged = true;
      }

      if (rankingConsistencyChanged) {
        await loadRankingData();
        return;
      }
    }

    if (pConfig) setPunktacjaConfig(pConfig as PunktacjaConfig[]);
    if (rConfig) setRangiConfig(rConfig as RangaConfig[]);
    if (oConfig) setOdznakiConfig(oConfig as OdznakaConfig[]);
    if (dyzuryData) setDyzury(dyzuryData as Dyzur[]);
    if (obecnosciData) setObecnosci(obecnosciData as Obecnosc[]);
    if (minusoweData) setMinusowePunkty(minusoweData as MinusowePunkty[]);
    if (punktyReczneData) setPunktyReczne(punktyReczneData as PunktyReczne[]);
    if (odznakiZdobyteData) setOdznakiZdobyte(odznakiZdobyteData as OdznakaZdobyta[]);
    if (rankingRows) setRankingData(rankingRows as RankingEntry[]);
  }, [currentUser?.parafia_id, currentUser?.id, currentUser?.typ, currentParafia?.admin_id, members]);

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

  // Helper: zamień adresy email i URL-e w tekście na klikalne linki.
  const linkifyEmails = (text: string) => {
    const tokenRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const urlRegex = /^(?:https?:\/\/|www\.)[^\s]+$/i;
    const parts = text.split(tokenRegex);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      if (emailRegex.test(part)) {
        return (
          <a key={i} href={`mailto:${part}`} className="underline hover:opacity-70 transition-opacity">
            {part}
          </a>
        );
      }

      if (urlRegex.test(part)) {
        const href = part.startsWith('http://') || part.startsWith('https://') ? part : `https://${part}`;
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-70 transition-opacity break-all"
          >
            {part}
          </a>
        );
      }

      return part;
    });
  };

  // Helper: pobierz wartość z punktacja_config
  const getConfigValue = useCallback((klucz: string, fallback: number = 0): number => {
    const entry = punktacjaConfig.find(p => p.klucz === klucz);
    return entry ? Number(entry.wartosc) : fallback;
  }, [punktacjaConfig]);

  // Helper: oblicz punkty bazowe na podstawie rangi liturgicznej dnia
  const obliczPunktyBazowe = useCallback((data: string, typ: 'msza' | 'nabożeństwo' | 'wydarzenie', nazwa_nabożeństwa: string, wydarzenieId?: string): { bazowe: number; mnoznik: number } => {
    if (typ === 'wydarzenie' && wydarzenieId) {
      const wyd = sluzby.find(s => s.id === wydarzenieId);
      return { bazowe: wyd?.ekstra_punkty || 0, mnoznik: 1 };
    }
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
    const baseLiturgDay = days.find(d => d.date === data) || null;
    const liturgDay = baseLiturgDay ? applyLiturgicalDayOverride(baseLiturgDay) : null;

    // Mnożnik sezonowy:
    // brak klucza sezonowego powinien dziedziczyć wartość domyślną,
    // a nie wracać do historycznego fallbacku 1.5.
    const domyslnyMnoznikRaw = getConfigValue('mnoznik_domyslny', 1);
    const domyslnyMnoznik = Number.isFinite(domyslnyMnoznikRaw) && domyslnyMnoznikRaw > 0 ? domyslnyMnoznikRaw : 1;
    let mnoznik = domyslnyMnoznik;
    if (liturgDay?.okres === 'Wielki Post') {
      const wielkiPostRaw = getConfigValue('mnoznik_wielki_post', domyslnyMnoznik);
      mnoznik = Number.isFinite(wielkiPostRaw) && wielkiPostRaw > 0 ? wielkiPostRaw : domyslnyMnoznik;
    } else if (liturgDay?.okres === 'Adwent') {
      const adwentRaw = getConfigValue('mnoznik_adwent', domyslnyMnoznik);
      mnoznik = Number.isFinite(adwentRaw) && adwentRaw > 0 ? adwentRaw : domyslnyMnoznik;
    }

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
  }, [getConfigValue, sluzby, applyLiturgicalDayOverride]);

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

  const applyRankingHistoryDeleteDelta = async (
    ministrantId: string,
    parafiaId: string,
    deltaPoints: number,
    deltaObecnosci: number = 0
  ) => {
    if (!deltaPoints && !deltaObecnosci) return;
    const { data: existingRanking, error: rankingFetchError } = await supabase
      .from('ranking')
      .select('*')
      .eq('ministrant_id', ministrantId)
      .eq('parafia_id', parafiaId)
      .maybeSingle();
    if (rankingFetchError) throw new Error(rankingFetchError.message);

    if (existingRanking) {
      const nextTotalPkt = Number(existingRanking.total_pkt || 0) + deltaPoints;
      const nextTotalObecnosci = Math.max(0, Number(existingRanking.total_obecnosci || 0) + deltaObecnosci);
      const ranga = getRanga(nextTotalPkt);
      const { error: rankingUpdateError } = await supabase
        .from('ranking')
        .update({
          total_pkt: nextTotalPkt,
          total_obecnosci: nextTotalObecnosci,
          ranga: ranga?.nazwa || existingRanking.ranga || 'Ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRanking.id);
      if (rankingUpdateError) throw new Error(rankingUpdateError.message);
      return;
    }

    if (deltaPoints === 0 && deltaObecnosci <= 0) return;

    const ranga = getRanga(deltaPoints);
    const { error: rankingInsertError } = await supabase
      .from('ranking')
      .insert({
        ministrant_id: ministrantId,
        parafia_id: parafiaId,
        total_pkt: deltaPoints,
        total_obecnosci: Math.max(0, deltaObecnosci),
        ranga: ranga?.nazwa || 'Ready',
      });
    if (rankingInsertError) throw new Error(rankingInsertError.message);
  };

  const usunWpisPunktowy = async (entry: SelectedMemberPunktyHistoriaEntry) => {
    if (!ensureRankingSettingsPermission()) return;
    if (!selectedPunktyHistoriaMember) return;
    const isAutoDyzurMinus = entry.kind === 'minusowe' && /\[auto_dyzur:[^\]]+\]/i.test(entry.minusowe.powod || '');
    const confirmMsg = isAutoDyzurMinus
      ? 'Usunąć ten wpis? Ten automatyczny minus nie zostanie już dodany ponownie.'
      : 'Czy na pewno chcesz usunąć ten wpis punktów?';
    if (!window.confirm(confirmMsg)) return;

    const entryKey = `${entry.kind}:${entry.id}`;
    setDeletingPunktyHistoriaEntryKey(entryKey);
    try {
      let ministrantId = '';
      let parafiaId = '';
      let deltaPoints = 0;
      let deltaObecnosci = 0;
      let deleteError: { message?: string } | null = null;

      if (entry.kind === 'obecnosc') {
        const points = Math.round(Number(entry.obec.punkty_finalne || 0));
        ministrantId = entry.obec.ministrant_id;
        parafiaId = entry.obec.parafia_id;
        deltaPoints = -points;
        deltaObecnosci = -1;
        await applyRankingHistoryDeleteDelta(ministrantId, parafiaId, deltaPoints, deltaObecnosci);
        const { error } = await supabase.from('obecnosci').delete().eq('id', entry.obec.id);
        deleteError = error;
      } else if (entry.kind === 'korekta') {
        const points = Math.round(Number(entry.korekta.punkty || 0));
        ministrantId = entry.korekta.ministrant_id;
        parafiaId = entry.korekta.parafia_id;
        deltaPoints = -points;
        await applyRankingHistoryDeleteDelta(ministrantId, parafiaId, deltaPoints, 0);
        const { error } = await supabase.from('punkty_reczne').delete().eq('id', entry.korekta.id);
        deleteError = error;
      } else {
        const points = Math.round(Number(entry.minusowe.punkty || 0));
        ministrantId = entry.minusowe.ministrant_id;
        parafiaId = entry.minusowe.parafia_id;
        deltaPoints = -points;
        const autoMatch = (entry.minusowe.powod || '').match(/\[auto_dyzur:([^\]]+)\]/i);
        if (autoMatch) {
          const { error: ignoreInsertError } = await supabase
            .from('auto_dyzur_minus_ignored')
            .upsert(
              {
                parafia_id: parafiaId,
                ministrant_id: ministrantId,
                data: entry.minusowe.data,
                created_by: currentUser?.id || null,
              },
              { onConflict: 'parafia_id,ministrant_id,data' }
            );
          if (ignoreInsertError) {
            throw new Error(`Nie udało się zapisać wyjątku auto-kary: ${ignoreInsertError.message}`);
          }
        }
        await applyRankingHistoryDeleteDelta(ministrantId, parafiaId, deltaPoints, 0);
        const { error } = await supabase.from('minusowe_punkty').delete().eq('id', entry.minusowe.id);
        deleteError = error;
      }

      if (deleteError) {
        if (ministrantId && parafiaId && (deltaPoints || deltaObecnosci)) {
          try {
            await applyRankingHistoryDeleteDelta(ministrantId, parafiaId, -deltaPoints, -deltaObecnosci);
          } catch (rollbackError) {
            console.warn('Nie udało się cofnąć zmiany rankingu po błędzie usuwania wpisu punktów:', rollbackError);
          }
        }
        throw new Error(deleteError.message || 'Nieznany błąd usuwania');
      }

      // Nie blokuj UI na pełnym reloadzie (może być ciężki przez auto-sync dyżurów).
      void loadRankingData();
    } catch (error) {
      alert(`Nie udało się usunąć wpisu punktów: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setDeletingPunktyHistoriaEntryKey(null);
    }
  };

  const zglosObecnosc = async () => {
    if (!currentUser?.parafia_id || !zglosForm.data || zglosSubmitting) return;

    // Porównuj daty jako stringi YYYY-MM-DD żeby uniknąć problemów ze strefami czasowymi
    const todayStr = getLocalISODate();
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

    if (zglosForm.typ === 'wydarzenie') {
      const selectedWydarzenie = sluzby.find((s) => s.id === zglosForm.wydarzenie_id);
      if (!selectedWydarzenie) {
        alert('To wydarzenie nie jest już dostępne do zgłoszenia.');
        return;
      }
      if (zglosForm.data !== selectedWydarzenie.data) {
        alert('Data zgłoszenia musi być zgodna z datą wybranego wydarzenia.');
        return;
      }
    }

    const { bazowe, mnoznik } = obliczPunktyBazowe(zglosForm.data, zglosForm.typ, zglosForm.nazwa_nabożeństwa, zglosForm.wydarzenie_id);

    const wydarzenieNazwa = zglosForm.typ === 'wydarzenie' ? (sluzby.find(s => s.id === zglosForm.wydarzenie_id)?.nazwa || '') : '';

    setZglosSubmitting(true);
    try {
      const { error } = await supabase.from('obecnosci').insert({
        ministrant_id: currentUser.id,
        parafia_id: currentUser.parafia_id,
        data: zglosForm.data,
        godzina: zglosForm.godzina,
        typ: zglosForm.typ,
        nazwa_nabożeństwa: zglosForm.typ === 'nabożeństwo' ? zglosForm.nazwa_nabożeństwa : (zglosForm.typ === 'wydarzenie' ? wydarzenieNazwa : ''),
        punkty_bazowe: bazowe,
        mnoznik,
        punkty_finalne: Math.round(bazowe * mnoznik),
      });

      if (error) {
        alert('Błąd zgłoszenia: ' + error.message);
        return;
      }

      setShowZglosModal(false);
      setZglosForm({ data: '', typ: 'msza', nazwa_nabożeństwa: '', godzina: '', wydarzenie_id: '' });
      loadRankingData();
      setZglosSuccess(true);
      setTimeout(() => setZglosSuccess(false), 3000);
    } finally {
      setZglosSubmitting(false);
    }
  };

  const zglosAktywnosc = async () => {
    if (!currentUser?.parafia_id || aktywnoscSubmitting) return;
    if (!aktywnoscZgloszeniaWlaczone) {
      alert('Ksiądz wyłączył możliwość zgłaszania aktywności dodatkowych.');
      return;
    }

    const cleanOpis = aktywnoscForm.opis.trim();
    const cleanData = aktywnoscForm.data;
    const proposedPoints = Number.parseInt(aktywnoscForm.punkty, 10);
    if (!cleanOpis || !cleanData || !Number.isFinite(proposedPoints) || proposedPoints <= 0) {
      alert('Uzupełnij opis, datę i proponowaną liczbę punktów.');
      return;
    }

    const todayStr = getLocalISODate();
    const limitDni = getConfigValue('limit_dni_zgloszenie', 2);
    const todayParts = todayStr.split('-').map(Number);
    const dataParts = cleanData.split('-').map(Number);
    const todayMs = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const dataMs = Date.UTC(dataParts[0], dataParts[1] - 1, dataParts[2]);
    const diffDays = Math.floor((todayMs - dataMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alert('Nie możesz zgłosić aktywności na przyszły dzień.');
      return;
    }
    if (diffDays > limitDni) {
      alert(`Nie możesz zgłosić aktywności — upłynął limit ${limitDni} dni od daty.`);
      return;
    }

    setAktywnoscSubmitting(true);
    try {
      const { error } = await supabase.from('obecnosci').insert({
        ministrant_id: currentUser.id,
        parafia_id: currentUser.parafia_id,
        data: cleanData,
        godzina: '',
        typ: 'aktywnosc',
        nazwa_nabożeństwa: cleanOpis,
        punkty_bazowe: proposedPoints,
        mnoznik: 1,
        punkty_finalne: proposedPoints,
      });

      if (error) {
        alert('Błąd zgłoszenia aktywności: ' + error.message);
        return;
      }

      setShowAktywnoscModal(false);
      setAktywnoscForm(buildInitialAktywnoscForm());
      loadRankingData();
      setZglosSuccess(true);
      setTimeout(() => setZglosSuccess(false), 3000);
    } finally {
      setAktywnoscSubmitting(false);
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

  const zatwierdzObecnosc = async (obecnoscId: string, options?: { skipReload?: boolean; approvedPoints?: number }) => {
    if (!currentUser) throw new Error('Brak danych użytkownika');
    if (!canApproveRankingSubmissions) throw new Error('Brak uprawnień do zatwierdzania zgłoszeń');

    const obecnosc = obecnosci.find(o => o.id === obecnoscId);
    if (!obecnosc) throw new Error('Nie znaleziono zgłoszenia');
    const approvedPoints = typeof options?.approvedPoints === 'number'
      ? Math.max(0, Math.round(options.approvedPoints))
      : Math.max(0, Math.round(Number(obecnosc.punkty_finalne || 0)));
    const shouldPersistApprovedPoints = typeof options?.approvedPoints === 'number' || obecnosc.typ === 'aktywnosc';

    let statusUpdated = false;
    try {
      const statusPatch: {
        status: 'zatwierdzona';
        zatwierdzona_przez: string;
        punkty_bazowe?: number;
        mnoznik?: number;
        punkty_finalne?: number;
      } = {
        status: 'zatwierdzona',
        zatwierdzona_przez: currentUser.id,
      };
      if (shouldPersistApprovedPoints) {
        statusPatch.punkty_bazowe = approvedPoints;
        statusPatch.mnoznik = 1;
        statusPatch.punkty_finalne = approvedPoints;
      }
      const { error: statusError } = await supabase.from('obecnosci').update(statusPatch).eq('id', obecnoscId);
      if (statusError) throw new Error(statusError.message);
      statusUpdated = true;

      // Upsert ranking
      const { data: existing } = await supabase.from('ranking')
        .select('*')
        .eq('ministrant_id', obecnosc.ministrant_id)
        .eq('parafia_id', obecnosc.parafia_id)
        .maybeSingle();

      let newTotalPkt: number;
      let newTotalObecnosci: number;
      let streakTyg: number;

      if (existing) {
        newTotalPkt = Number(existing.total_pkt) + approvedPoints;
        newTotalObecnosci = (existing.total_obecnosci || 0) + 1;
        streakTyg = existing.streak_tyg || 0;
        const ranga = getRanga(newTotalPkt);
        const { error: rankingUpdateError } = await supabase.from('ranking').update({
          total_pkt: newTotalPkt,
          total_obecnosci: newTotalObecnosci,
          ranga: ranga?.nazwa || 'Ready',
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
        if (rankingUpdateError) throw new Error(rankingUpdateError.message);
      } else {
        newTotalPkt = approvedPoints;
        newTotalObecnosci = 1;
        streakTyg = 0;
        const ranga = getRanga(newTotalPkt);
        const { error: rankingInsertError } = await supabase.from('ranking').insert({
          ministrant_id: obecnosc.ministrant_id,
          parafia_id: obecnosc.parafia_id,
          total_pkt: newTotalPkt,
          total_obecnosci: newTotalObecnosci,
          ranga: ranga?.nazwa || 'Ready',
        });
        if (rankingInsertError) throw new Error(rankingInsertError.message);
      }

      // Sprawdź odznaki
      await sprawdzOdznaki(obecnosc.ministrant_id, obecnosc.parafia_id, newTotalObecnosci, newTotalPkt, streakTyg);

      // Push notification do ministranta
      if (currentParafia) {
        const ministrant = members.find(m => m.profile_id === obecnosc.ministrant_id);
        authFetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa: 'wszyscy',
            title: `Brawo! +${approvedPoints} pkt`,
            body: `Twoje zgłoszenie zostało zatwierdzone! Masz już ${newTotalPkt} pkt ${ministrant ? `${ministrant.imie} ${ministrant.nazwisko || ''}`.trim() : ''}`,
            url: '/app',
            kategoria: 'zatwierdzenie',
            target_user_id: obecnosc.ministrant_id,
          }),
        }).catch(() => {});
      }

      if (!options?.skipReload) {
        loadRankingData();
      }
    } catch (err) {
      if (statusUpdated) {
        const rollbackPatch: {
          status: 'oczekuje';
          zatwierdzona_przez: null;
          punkty_bazowe?: number;
          mnoznik?: number;
          punkty_finalne?: number;
        } = {
          status: 'oczekuje',
          zatwierdzona_przez: null,
        };
        if (shouldPersistApprovedPoints) {
          rollbackPatch.punkty_bazowe = obecnosc.punkty_bazowe;
          rollbackPatch.mnoznik = obecnosc.mnoznik;
          rollbackPatch.punkty_finalne = obecnosc.punkty_finalne;
        }
        await supabase.from('obecnosci').update(rollbackPatch).eq('id', obecnoscId);
      }
      throw err;
    }
  };

  const dodajPunktyRecznie = async () => {
    if (!ensureRankingSettingsPermission()) return;
    if (!selectedMember || !currentUser?.parafia_id) return;
    const pkt = parseInt(dodajPunktyForm.punkty);
    if (!pkt || pkt === 0) return;
    const powod = dodajPunktyForm.powod.trim();
    const today = getLocalISODate();

    const { data: existing, error: existingRankingError } = await supabase.from('ranking')
      .select('*')
      .eq('ministrant_id', selectedMember.profile_id)
      .eq('parafia_id', currentUser.parafia_id)
      .maybeSingle();
    if (existingRankingError) {
      alert('Nie udało się pobrać rankingu: ' + existingRankingError.message);
      return;
    }

    let rollbackRankingUpdate: (() => Promise<void>) | null = null;
    if (existing) {
      const prevTotal = Number(existing.total_pkt || 0);
      const prevRanga = existing.ranga || 'Ready';
      const newTotal = Number(existing.total_pkt) + pkt;
      const ranga = getRanga(newTotal);
      const { error: rankingUpdateError } = await supabase.from('ranking').update({
        total_pkt: newTotal,
        ranga: ranga?.nazwa || existing.ranga,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
      if (rankingUpdateError) {
        alert('Nie udało się zapisać punktów: ' + rankingUpdateError.message);
        return;
      }
      rollbackRankingUpdate = async () => {
        const { error: rollbackError } = await supabase
          .from('ranking')
          .update({
            total_pkt: prevTotal,
            ranga: prevRanga,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (rollbackError) throw rollbackError;
      };
    } else {
      const ranga = getRanga(pkt);
      const { data: insertedRankingRow, error: rankingInsertError } = await supabase.from('ranking').insert({
        ministrant_id: selectedMember.profile_id,
        parafia_id: currentUser.parafia_id,
        total_pkt: pkt,
        total_obecnosci: 0,
        ranga: ranga?.nazwa || 'Ready',
      }).select('id').single();
      if (rankingInsertError) {
        alert('Nie udało się zapisać punktów: ' + rankingInsertError.message);
        return;
      }
      rollbackRankingUpdate = async () => {
        const { error: rollbackError } = await supabase
          .from('ranking')
          .delete()
          .eq('id', insertedRankingRow.id);
        if (rollbackError) throw rollbackError;
      };
    }

    const { error: punktyReczneError } = await supabase.from('punkty_reczne').insert({
      ministrant_id: selectedMember.profile_id,
      parafia_id: currentUser.parafia_id,
      data: today,
      powod,
      punkty: pkt,
    });
    if (punktyReczneError) {
      if (rollbackRankingUpdate) {
        try {
          await rollbackRankingUpdate();
        } catch (rollbackError) {
          console.warn('Nie udało się cofnąć zmiany rankingu po błędzie zapisu ręcznych punktów:', rollbackError);
        }
      }
      alert('Nie udało się zapisać wpisu do historii misji, więc zmiana punktów została cofnięta: ' + punktyReczneError.message);
      return;
    }

    setShowDodajPunktyModal(false);
    setDodajPunktyForm({ punkty: '', powod: '' });
    loadRankingData();
  };

  const odrzucObecnosc = async (obecnoscId: string) => {
    if (!currentUser) throw new Error('Brak danych użytkownika');
    if (!canApproveRankingSubmissions) throw new Error('Brak uprawnień do odrzucania zgłoszeń');
    const { error } = await supabase.from('obecnosci').update({
      status: 'odrzucona',
      zatwierdzona_przez: currentUser.id,
    }).eq('id', obecnoscId);
    if (error) throw new Error(error.message);
    loadRankingData();
  };

  const handleApproveObecnosc = async (obecnoscId: string, options?: { skipReload?: boolean; approvedPoints?: number }) => {
    if (!ensureRankingApprovalPermission()) return;
    if (bulkApprovingObecnosci || approvingObecnosciIds.has(obecnoscId)) return;
    setApprovingObecnosciIds((prev) => {
      const next = new Set(prev);
      next.add(obecnoscId);
      return next;
    });
    try {
      await zatwierdzObecnosc(obecnoscId, options);
    } catch (err) {
      alert('Nie udało się zatwierdzić zgłoszenia: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setApprovingObecnosciIds((prev) => {
        const next = new Set(prev);
        next.delete(obecnoscId);
        return next;
      });
    }
  };

  const handleApproveObecnoscWithCustomPoints = (obecnoscId: string) => {
    if (!ensureRankingApprovalPermission()) return;
    if (bulkApprovingObecnosci || approvingObecnosciIds.has(obecnoscId) || rejectingObecnosciIds.has(obecnoscId)) return;
    const obecnosc = obecnosci.find((o) => o.id === obecnoscId);
    if (!obecnosc) {
      alert('Nie znaleziono zgłoszenia.');
      return;
    }
    const currentPoints = Math.max(0, Math.round(Number(obecnosc.punkty_finalne || 0)));
    setCustomPointsTarget(obecnosc);
    setCustomPointsValue(String(currentPoints));
    setShowCustomPointsModal(true);
  };

  const saveCustomPendingPoints = async () => {
    if (!ensureRankingApprovalPermission()) return;
    if (!customPointsTarget || customPointsSaving) return;

    const normalized = customPointsValue.replace(',', '.').trim();
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      alert('Podaj poprawną liczbę punktów (0 lub więcej).');
      return;
    }

    const updatedPoints = Math.round(parsed);
    const obecnoscId = customPointsTarget.id;
    setCustomPointsSaving(true);

    try {
      await handleApproveObecnosc(obecnoscId, { approvedPoints: updatedPoints });
      setShowCustomPointsModal(false);
      setCustomPointsTarget(null);
      setCustomPointsValue('');
    } catch {
      // handleApproveObecnosc pokazuje komunikat błędu
    } finally {
      setCustomPointsSaving(false);
    }
  };

  const handleRejectObecnosc = async (obecnoscId: string) => {
    if (!ensureRankingApprovalPermission()) return;
    if (rejectingObecnosciIds.has(obecnoscId)) return;
    setRejectingObecnosciIds((prev) => {
      const next = new Set(prev);
      next.add(obecnoscId);
      return next;
    });
    try {
      await odrzucObecnosc(obecnoscId);
    } catch (err) {
      alert('Nie udało się odrzucić zgłoszenia: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRejectingObecnosciIds((prev) => {
        const next = new Set(prev);
        next.delete(obecnoscId);
        return next;
      });
    }
  };

  const zatwierdzWszystkie = async () => {
    if (!ensureRankingApprovalPermission()) return;
    if (bulkApprovingObecnosci || pendingObecnosci.length === 0) return;
    setBulkApprovingObecnosci(true);
    try {
      let failed = 0;
      for (const o of pendingObecnosci) {
        try {
          await handleApproveObecnosc(o.id, { skipReload: true });
        } catch {
          failed += 1;
        }
      }
      loadRankingData();
      if (failed > 0) {
        alert(`Nie udało się zatwierdzić ${failed} z ${pendingObecnosci.length} zgłoszeń.`);
      }
    } finally {
      setBulkApprovingObecnosci(false);
    }
  };

  const handleDyzurClick = (dzienTygodnia: number) => {
    if (!currentUser?.parafia_id) return;
    const existing = dyzury.find(d => d.ministrant_id === currentUser.id && d.dzien_tygodnia === dzienTygodnia);

    // Zatwierdzony dyżur — ministrant może go usunąć po potwierdzeniu.
    if (existing?.status === 'zatwierdzona') {
      const dayName = DNI_TYGODNIA_FULL[dzienTygodnia === 0 ? 6 : dzienTygodnia - 1];
      const godzina = existing.godzina?.trim();
      const suffix = godzina ? ` • ${godzina}` : '';
      const shouldDelete = window.confirm(`Czy na pewno chcesz usunąć swój dyżur: ${dayName}${suffix}?`);
      if (!shouldDelete) return;
      supabase
        .from('dyzury')
        .delete()
        .eq('id', existing.id)
        .eq('ministrant_id', currentUser.id)
        .then(({ error }) => {
          if (error) {
            alert('Nie udało się usunąć dyżuru: ' + error.message);
            return;
          }
          loadRankingData();
        });
      return;
    }

    // Oczekujący — ministrant może cofnąć wniosek
    if (existing?.status === 'oczekuje') {
      supabase.from('dyzury').delete().eq('id', existing.id).then(() => loadRankingData());
      return;
    }

    // Nowy dzień — pokaż dialog potwierdzenia
    const approvedMyDyzury = dyzury.filter(d => d.ministrant_id === currentUser.id && d.status === 'zatwierdzona');
    const hasAnyApproved = approvedMyDyzury.length > 0;
    setDyzurConfirm({
      dzien: dzienTygodnia,
      type: hasAnyApproved ? 'add' : 'first',
      godzina: '',
      replaceFromDzien: null,
      allowModeChoice: hasAnyApproved,
    });
  };

  const confirmDyzur = async () => {
    if (!currentUser?.parafia_id || !dyzurConfirm) return;
    if (dyzurConfirm.type === 'change' && dyzurConfirm.replaceFromDzien === null) {
      alert('Wybierz, który obecny dzień dyżuru chcesz zmienić.');
      return;
    }

    if (dyzurConfirm.type === 'change') {
      // Jedna aktywna prośba o zmianę naraz — nowa nadpisuje poprzednią.
      await supabase
        .from('dyzury')
        .delete()
        .eq('parafia_id', currentUser.parafia_id)
        .eq('ministrant_id', currentUser.id)
        .eq('status', 'oczekuje');
    }

    await supabase.from('dyzury').insert({
      ministrant_id: currentUser.id,
      parafia_id: currentUser.parafia_id,
      dzien_tygodnia: dyzurConfirm.dzien,
      godzina: dyzurConfirm.godzina.trim() || null,
      zastepuje_dzien_tygodnia: dyzurConfirm.type === 'change' ? dyzurConfirm.replaceFromDzien : null,
      status: dyzurConfirm.type === 'change' ? 'oczekuje' : 'zatwierdzona',
    });
    setDyzurConfirm(null);
    loadRankingData();
  };

  const handleSaveCalendarDayOverride = async () => {
    if (!canEditLiturgicalCalendar) return;
    if (!currentUser?.parafia_id || !selectedDay) return;
    const pid = currentUser.parafia_id;
    const key = `kalendarz_override_${pid}_${selectedDay.date}`;
    const payload: LiturgicalDayOverride = {
      nazwa: calendarEditForm.nazwa.trim(),
      kolor: calendarEditForm.kolor,
      ranga: calendarEditForm.ranga,
      okres: calendarEditForm.okres.trim(),
    };
    setCalendarEditSaving(true);
    const { error } = await supabase.from('app_config').upsert(
      { klucz: key, wartosc: JSON.stringify(payload) },
      { onConflict: 'klucz' }
    );
    setCalendarEditSaving(false);
    if (error) {
      alert('Nie udało się zapisać zmian dnia: ' + error.message);
      return;
    }
    setCalendarOverrides((prev) => ({ ...prev, [selectedDay.date]: payload }));
    setSelectedDay((prev) => (prev ? { ...prev, ...payload } : prev));
    setCalendarEditMode(false);
  };

  const handleResetCalendarDayOverride = async () => {
    if (!canEditLiturgicalCalendar) return;
    if (!currentUser?.parafia_id || !selectedDay) return;
    const pid = currentUser.parafia_id;
    const key = `kalendarz_override_${pid}_${selectedDay.date}`;
    setCalendarEditSaving(true);
    const { error } = await supabase.from('app_config').delete().eq('klucz', key);
    setCalendarEditSaving(false);
    if (error) {
      alert('Nie udało się przywrócić domyślnego dnia: ' + error.message);
      return;
    }
    setCalendarOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedDay.date];
      return next;
    });
    const dateObj = new Date(`${selectedDay.date}T00:00:00`);
    const baseDay = getLiturgicalMonth(dateObj.getFullYear(), dateObj.getMonth()).find((d) => d.date === selectedDay.date) || null;
    setSelectedDay(baseDay);
    setCalendarEditMode(false);
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

    if (currentUser.parafia_id) {
      const { error: memberSyncError } = await supabase
        .from('parafia_members')
        .update({
          imie: editProfilForm.imie.trim(),
          nazwisko: editProfilForm.nazwisko.trim(),
          email: editProfilForm.email.trim(),
        })
        .eq('profile_id', currentUser.id)
        .eq('parafia_id', currentUser.parafia_id);

      if (memberSyncError) {
        console.warn('Nie udało się zsynchronizować parafia_members po edycji profilu:', memberSyncError.message);
      }
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

  const toggleDyzurAdmin = async (ministrantId: string, dzienTygodnia: number, godzina?: string | null) => {
    if (!currentUser?.parafia_id) return;

    const existing = dyzury.find(d => d.ministrant_id === ministrantId && d.dzien_tygodnia === dzienTygodnia);

    if (existing) {
      await supabase.from('dyzury').delete().eq('id', existing.id);
    } else {
      await supabase.from('dyzury').insert({
        ministrant_id: ministrantId,
        parafia_id: currentUser.parafia_id,
        dzien_tygodnia: dzienTygodnia,
        godzina: godzina?.trim() || null,
        status: 'zatwierdzona',
      });
    }
    loadRankingData();
  };

  const updateDyzurHourAdmin = async (dyzurId: string, godzina: string) => {
    const normalizedHour = godzina.trim();
    const { error } = await supabase
      .from('dyzury')
      .update({ godzina: normalizedHour || null })
      .eq('id', dyzurId);

    if (error) {
      alert('Nie udało się zapisać godziny dyżuru: ' + error.message);
      return;
    }

    setDyzurHourDraftById((prev) => {
      const next = { ...prev };
      delete next[dyzurId];
      return next;
    });
    loadRankingData();
  };

  const handleDyzurDecision = async (dyzurId: string, decision: 'zatwierdzona' | 'odrzucona') => {
    if (decision === 'odrzucona') {
      await supabase.from('dyzury').delete().eq('id', dyzurId);
    } else {
      const pendingRequest = dyzury.find((d) => d.id === dyzurId);
      if (pendingRequest) {
        // Akceptacja zmiany dyżuru podmienia poprzedni zatwierdzony termin.
        const replaceFrom = pendingRequest.zastepuje_dzien_tygodnia;
        if (replaceFrom !== null && replaceFrom !== undefined) {
          await supabase
            .from('dyzury')
            .delete()
            .eq('parafia_id', pendingRequest.parafia_id)
            .eq('ministrant_id', pendingRequest.ministrant_id)
            .eq('status', 'zatwierdzona')
            .eq('dzien_tygodnia', replaceFrom);
        } else {
          // Fallback dla starszych próśb bez wskazanego dnia zastępowanego.
          const approvedForMember = dyzury.filter(
            (d) =>
              d.ministrant_id === pendingRequest.ministrant_id &&
              d.parafia_id === pendingRequest.parafia_id &&
              d.status === 'zatwierdzona'
          );
          if (approvedForMember.length === 1) {
            await supabase.from('dyzury').delete().eq('id', approvedForMember[0].id);
          }
        }
      }
      await supabase.from('dyzury').update({ status: decision, zastepuje_dzien_tygodnia: null }).eq('id', dyzurId);
    }
    loadRankingData();
  };

  const handleApprovePendingDyzurRequest = async (dyzurId: string) => {
    if (approvingDyzurIds.has(dyzurId)) return;
    setApprovingDyzurIds((prev) => {
      const next = new Set(prev);
      next.add(dyzurId);
      return next;
    });
    try {
      await handleDyzurDecision(dyzurId, 'zatwierdzona');
    } catch (err) {
      alert('Nie udało się zatwierdzić zmiany dyżuru: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setApprovingDyzurIds((prev) => {
        const next = new Set(prev);
        next.delete(dyzurId);
        return next;
      });
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!currentUser?.parafia_id) return;
    try {
      const res = await authFetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: member.profile_id,
          parafiaId: currentUser.parafia_id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Błąd usuwania konta:', err);
        alert(err?.error ? `Nie udało się usunąć konta: ${err.error}` : 'Nie udało się usunąć konta.');
      }
      loadParafiaData();
      loadRankingData();
    } catch (err) {
      console.error('Błąd usuwania ministranta:', err);
    }
    setShowDeleteMemberModal(false);
    setMemberToDelete(null);
  };

  useEffect(() => {
    const ids = new Set(punktacjaConfig.map((p) => p.id));
    setPunktacjaDraft((prev) => {
      const next: Record<string, number> = {};
      for (const [id, value] of Object.entries(prev)) {
        if (ids.has(id)) next[id] = value;
      }
      return next;
    });
  }, [punktacjaConfig]);

  const getPunktacjaValue = useCallback((entry: PunktacjaConfig) => {
    const draft = punktacjaDraft[entry.id];
    return draft ?? entry.wartosc;
  }, [punktacjaDraft]);

  const punktacjaDraftDirty = useMemo(
    () => punktacjaConfig.some((p) => punktacjaDraft[p.id] !== undefined && Number(punktacjaDraft[p.id]) !== Number(p.wartosc)),
    [punktacjaConfig, punktacjaDraft]
  );
  const limitDniConfig = useMemo(
    () => punktacjaConfig.find((p) => p.klucz === 'limit_dni_zgloszenie') ?? null,
    [punktacjaConfig]
  );
  const aktywnoscZgloszeniaWlaczone = useMemo(
    () => getConfigValue(AKTYWNOSC_ZGLOSZENIA_KEY, 1) > 0,
    [getConfigValue]
  );
  const pendingObecnosci = useMemo(
    () => obecnosci.filter((o) => o.status === 'oczekuje'),
    [obecnosci]
  );
  const pendingDyzury = useMemo(
    () => dyzury.filter((d) => d.status === 'oczekuje'),
    [dyzury]
  );
  const memberByProfileId = useMemo(
    () => new Map(members.map((m) => [m.profile_id, m])),
    [members]
  );
  const approvedDyzuryKeySet = useMemo(
    () => new Set(
      dyzury
        .filter((d) => d.status === 'zatwierdzona')
        .map((d) => `${d.ministrant_id}:${d.dzien_tygodnia}`)
    ),
    [dyzury]
  );
  const sluzbyModalTitleClass = useMemo(() => {
    const map: Record<string, string> = {
      zielony: 'bg-gradient-to-r from-teal-600 to-emerald-700 dark:from-teal-400 dark:to-emerald-400',
      bialy: 'bg-gradient-to-r from-amber-600 to-yellow-700 dark:from-amber-400 dark:to-yellow-400',
      czerwony: 'bg-gradient-to-r from-red-600 to-rose-700 dark:from-red-400 dark:to-rose-400',
      fioletowy: 'bg-gradient-to-r from-purple-700 to-violet-700 dark:from-purple-400 dark:to-violet-400',
      rozowy: 'bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400',
      zloty: 'bg-gradient-to-r from-amber-700 to-yellow-600 dark:from-amber-400 dark:to-yellow-300',
      niebieski: 'bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400',
      czarny: 'bg-gradient-to-r from-slate-800 to-zinc-900 dark:from-slate-300 dark:to-zinc-300',
    };
    return map[dzisLiturgiczny?.kolor || 'zielony'] || map.zielony;
  }, [dzisLiturgiczny?.kolor]);
  const sluzbyAssignLabelClass = useMemo(() => {
    const map: Record<string, string> = {
      zielony: 'text-emerald-700 dark:text-emerald-300',
      bialy: 'text-amber-700 dark:text-amber-300',
      czerwony: 'text-red-700 dark:text-red-300',
      fioletowy: 'text-violet-700 dark:text-violet-300',
      rozowy: 'text-pink-700 dark:text-pink-300',
      zloty: 'text-amber-700 dark:text-amber-300',
      niebieski: 'text-blue-700 dark:text-blue-300',
      czarny: 'text-gray-800 dark:text-gray-100',
    };
    return map[dzisLiturgiczny?.kolor || 'zielony'] || map.zielony;
  }, [dzisLiturgiczny?.kolor]);
  const savePunktacjaDraft = async () => {
    if (!ensureRankingSettingsPermission()) return;
    const pending = punktacjaConfig
      .filter((p) => punktacjaDraft[p.id] !== undefined && Number(punktacjaDraft[p.id]) !== Number(p.wartosc))
      .map((p) => ({ id: p.id, wartosc: Number(punktacjaDraft[p.id]) }));

    if (pending.length === 0) return;

    setPunktacjaSaving(true);
    try {
      const results = await Promise.all(
        pending.map((item) => supabase.from('punktacja_config').update({ wartosc: item.wartosc }).eq('id', item.id))
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) {
        alert('Błąd zapisu punktacji: ' + failed.error.message);
        return;
      }
      setPunktacjaConfig((prev) => prev.map((p) => {
        const updated = pending.find((x) => x.id === p.id);
        return updated ? { ...p, wartosc: updated.wartosc } : p;
      }));
      setPunktacjaDraft((prev) => {
        const next = { ...prev };
        for (const item of pending) delete next[item.id];
        return next;
      });
      loadRankingData();
    } finally {
      setPunktacjaSaving(false);
    }
  };

  const handleResetPunktacja = async () => {
    if (!ensureRankingSettingsPermission()) return;
    if (!currentUser?.parafia_id) return;
    const pid = currentUser.parafia_id;
    // Usuń obecności i kary
    await Promise.all([
      supabase.from('obecnosci').delete().eq('parafia_id', pid),
      supabase.from('minusowe_punkty').delete().eq('parafia_id', pid),
      supabase.from('punkty_reczne').delete().eq('parafia_id', pid),
    ]);
    // Wyzeruj ranking jednym zapytaniem (zachowaj rekordy)
    await supabase.from('ranking').update({
      total_pkt: 0,
      total_obecnosci: 0,
      total_minusowe: 0,
      streak_tyg: 0,
      max_streak_tyg: 0,
    }).eq('parafia_id', pid);
    // Usuń zdobyte odznaki
    const ministrantIds = members.filter(m => m.parafia_id === pid).map(m => m.profile_id);
    if (ministrantIds.length > 0) {
      await supabase.from('odznaki_zdobyte').delete().in('ministrant_id', ministrantIds);
    }
    loadRankingData();
    setShowResetPunktacjaModal(false);
  };

  const handleToggleAktywnoscZgloszen = async () => {
    if (!ensureRankingSettingsPermission()) return;
    if (!currentParafia || toggleAktywnoscZgloszenSaving) return;

    const nextValue = aktywnoscZgloszeniaWlaczone ? 0 : 1;
    const existing = punktacjaConfig.find((p) => p.klucz === AKTYWNOSC_ZGLOSZENIA_KEY);

    setToggleAktywnoscZgloszenSaving(true);
    try {
      if (existing) {
        const { error } = await supabase
          .from('punktacja_config')
          .update({ wartosc: nextValue, opis: 'Czy ministranci mogą zgłaszać aktywności do dodatkowych punktów' })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('punktacja_config')
          .insert({
            parafia_id: currentParafia.id,
            klucz: AKTYWNOSC_ZGLOSZENIA_KEY,
            wartosc: nextValue,
            opis: 'Czy ministranci mogą zgłaszać aktywności do dodatkowych punktów',
          });
        if (error) throw error;
      }

      await loadRankingData();
      setShowToggleAktywnoscZgloszenModal(false);
    } catch (err) {
      alert('Nie udało się zmienić ustawienia zgłoszeń aktywności: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setToggleAktywnoscZgloszenSaving(false);
    }
  };

  const updateRanga = async (id: string, nazwa: string, min_pkt: number) => {
    if (!ensureRankingSettingsPermission()) return;
    await supabase.from('rangi_config').update({ nazwa, min_pkt }).eq('id', id);
    loadRankingData();
  };

  const updateRangaKolor = async (id: string, kolor: string) => {
    if (!ensureRankingSettingsPermission()) return;
    await supabase.from('rangi_config').update({ kolor }).eq('id', id);
    loadRankingData();
  };

  const addRanga = async () => {
    if (!ensureRankingSettingsPermission()) return;
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
    if (!ensureRankingSettingsPermission()) return;
    await supabase.from('rangi_config').delete().eq('id', id);
    loadRankingData();
  };

  const addPunktacja = async (klucz: string, wartosc: number, opis: string) => {
    if (!ensureRankingSettingsPermission()) return;
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
    if (!ensureRankingSettingsPermission()) return;
    const entry = punktacjaConfig.find(p => p.klucz === klucz);
    if (entry) {
      await supabase.from('punktacja_config').update({ opis }).eq('id', entry.id);
      loadRankingData();
    }
  };

  const deletePunktacja = async (id: string) => {
    if (!ensureRankingSettingsPermission()) return;
    await supabase.from('punktacja_config').delete().eq('id', id);
    loadRankingData();
  };

  const updateOdznaka = async (id: string, updates: Partial<OdznakaConfig>) => {
    if (!ensureRankingSettingsPermission()) return;
    await supabase.from('odznaki_config').update(updates).eq('id', id);
    loadRankingData();
  };

  const addOdznaka = async () => {
    if (!ensureRankingSettingsPermission()) return;
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
    if (!ensureRankingSettingsPermission()) return;
    await supabase.from('odznaki_config').delete().eq('id', id);
    loadRankingData();
  };

  const initRankingConfig = async () => {
    if (!ensureRankingSettingsPermission()) return;
    if (!currentParafia) return;
    const { error } = await supabase.rpc('init_ranking_config', { p_parafia_id: currentParafia.id });
    if (error) {
      alert('Błąd inicjalizacji: ' + error.message);
    } else {
      loadRankingData();
    }
  };

  const loadSubscription = useCallback(async () => {
    if (!currentParafia) return;
    const { data, error } = await supabase
      .from('parafie')
      .select('*')
      .eq('id', currentParafia.id)
      .single();

    if (error) {
      console.error('loadSubscription error:', error);
      return;
    }

    if (data && data.tier === 'premium') {
      const normalized: PremiumSubscription = {
        tier: typeof data.tier === 'string' ? data.tier : 'free',
        rabat_id: typeof data.rabat_id === 'string' ? data.rabat_id : null,
        premium_status: typeof data.premium_status === 'string' ? data.premium_status : null,
        premium_source: typeof data.premium_source === 'string' ? data.premium_source : null,
        premium_expires_at: typeof data.premium_expires_at === 'string' ? data.premium_expires_at : null,
      };

      if (normalized.premium_expires_at) {
        const premiumEndDate = new Date(normalized.premium_expires_at);
        if (!Number.isNaN(premiumEndDate.getTime()) && premiumEndDate.getTime() <= Date.now()) {
          setSubscription(null);
          return;
        }
      }

      // Pobierz dane rabatu osobno jeśli jest
      if (normalized.rabat_id) {
        const { data: rabat } = await supabase
          .from('rabaty')
          .select('kod, procent_znizki')
          .eq('id', normalized.rabat_id)
          .single();
        setSubscription({ ...normalized, rabaty: rabat });
      } else {
        setSubscription(normalized);
      }
    } else {
      setSubscription(null);
    }
  }, [currentParafia]);

  useEffect(() => {
    if (currentParafia) loadSubscription();
  }, [currentParafia, loadSubscription]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentParafia) return;
    const url = new URL(window.location.href);
    const stripeStatus = url.searchParams.get('stripe');
    if (!stripeStatus) return;

    if (stripeStatus === 'success') {
      alert('Płatność zakończona. Odświeżam status Premium.');
      loadSubscription();
    } else if (stripeStatus === 'cancel') {
      alert('Płatność została anulowana.');
    }

    url.searchParams.delete('stripe');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [currentParafia, loadSubscription]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentParafia?.id || !isAndroidAppContext) return;

    const url = new URL(window.location.href);
    const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : '';
    if (!rawHash) return;

    const params = new URLSearchParams(rawHash);
    const status = (params.get('gp_purchase_status') || '').trim().toLowerCase();
    if (!status) return;

    const parafiaIdFromHash = (params.get('gp_parafia_id') || '').trim();
    const purchaseToken = (params.get('gp_purchase_token') || '').trim();
    const orderId = (params.get('gp_order_id') || '').trim() || null;
    const productId = (params.get('gp_product_id') || GOOGLE_PLAY_PREMIUM_PRODUCT_ID).trim();
    const basePlanId = (params.get('gp_base_plan_id') || GOOGLE_PLAY_PREMIUM_BASE_PLAN_ID).trim() || null;
    const offerId = (params.get('gp_offer_id') || '').trim() || null;
    const acknowledgedRaw = (params.get('gp_ack') || '').trim();
    const acknowledged = acknowledgedRaw === '1' ? true : acknowledgedRaw === '0' ? false : null;
    const errorCode = (params.get('gp_error') || '').trim();

    // Czyścimy hash od razu, żeby token nie zostawał w URL.
    url.hash = '';
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);

    if (parafiaIdFromHash && parafiaIdFromHash !== currentParafia.id) {
      alert('Zakup został zwrócony dla innej parafii. Otwórz właściwą parafię i spróbuj ponownie.');
      return;
    }

    if (status === 'canceled') {
      alert('Zakup został anulowany.');
      return;
    }

    if (status === 'error') {
      alert(getGooglePlayNativeErrorMessage(errorCode));
      return;
    }

    if (status !== 'success' && status !== 'pending') return;

    if (!purchaseToken) {
      alert('Google Play nie zwrócił purchaseToken. Spróbuj ponownie.');
      return;
    }

    const processedTokenKey = `${GOOGLE_PLAY_PROCESSED_TOKEN_SESSION_PREFIX}${purchaseToken}`;
    if (readSessionStorage(processedTokenKey) === '1') return;

    let cancelled = false;
    const finalizePurchase = async () => {
      setGooglePlayCheckoutLoading(true);
      try {
        const verifyRes = await authFetch('/api/billing/google/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafiaId: currentParafia.id,
            productId,
            basePlanId,
            offerId,
            purchaseToken,
            packageName: ANDROID_APP_PACKAGE_ID,
            purchaseKind: 'subscription',
            orderId,
            acknowledged,
          }),
        });

        const verifyPayload = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok && verifyRes.status !== 202) {
          const apiError = typeof verifyPayload?.error === 'string'
            ? verifyPayload.error
            : 'Nie udało się zapisać zakupu Google Play.';
          alert(apiError);
          return;
        }

        writeSessionStorage(processedTokenKey, '1');
        if (status === 'pending') {
          alert('Zakup Google Play jest oczekujący. Aktywacja Premium nastąpi po potwierdzeniu płatności.');
        } else {
          alert('Płatność Google Play została przyjęta. Aktywacja Premium może potrwać chwilę.');
        }
        await loadSubscription();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        alert(`Nie udało się zapisać zakupu Google Play. ${message}`);
      } finally {
        if (!cancelled) {
          setGooglePlayCheckoutLoading(false);
        }
      }
    };

    void finalizePurchase();
    return () => {
      cancelled = true;
    };
  }, [authFetch, currentParafia?.id, isAndroidAppContext, loadSubscription]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentParafia?.id || !isIosAppContext) return;

    const url = new URL(window.location.href);
    const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : '';
    if (!rawHash) return;

    const params = new URLSearchParams(rawHash);
    const status = (params.get('ap_purchase_status') || '').trim().toLowerCase();
    if (!status) return;

    const parafiaIdFromHash = (params.get('ap_parafia_id') || '').trim();
    const transactionId = (params.get('ap_transaction_id') || '').trim();
    const originalTransactionId = (params.get('ap_original_transaction_id') || '').trim() || null;
    const productId = (params.get('ap_product_id') || APPLE_PREMIUM_PRODUCT_ID).trim();
    const errorCode = (params.get('ap_error') || '').trim();

    // Czyścimy hash od razu, żeby dane zakupu nie zostawały w URL.
    url.hash = '';
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);

    if (parafiaIdFromHash && parafiaIdFromHash !== currentParafia.id) {
      alert('Zakup został zwrócony dla innej parafii. Otwórz właściwą parafię i spróbuj ponownie.');
      return;
    }

    if (status === 'canceled') {
      alert('Zakup został anulowany.');
      return;
    }

    if (status === 'error') {
      alert(getAppleNativeErrorMessage(errorCode));
      return;
    }

    if (status !== 'success' && status !== 'pending') return;

    if (!transactionId) {
      alert('App Store nie zwrócił transactionId. Spróbuj ponownie.');
      return;
    }

    const processedTxKey = `${APPLE_PROCESSED_TX_SESSION_PREFIX}${transactionId}`;
    if (readSessionStorage(processedTxKey) === '1') return;

    let cancelled = false;
    const finalizePurchase = async () => {
      setAppleCheckoutLoading(true);
      try {
        const verifyRes = await authFetch('/api/billing/apple/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafiaId: currentParafia.id,
            productId,
            transactionId,
            originalTransactionId,
            bundleId: APPLE_IOS_BUNDLE_ID,
          }),
        });

        const verifyPayload = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok && verifyRes.status !== 202) {
          const apiError = typeof verifyPayload?.error === 'string'
            ? verifyPayload.error
            : 'Nie udało się zapisać zakupu App Store.';
          alert(apiError);
          return;
        }

        writeSessionStorage(processedTxKey, '1');
        if (status === 'pending') {
          alert('Zakup App Store jest oczekujący. Aktywacja Premium nastąpi po potwierdzeniu płatności.');
        } else {
          alert('Płatność App Store została przyjęta. Aktywacja Premium może potrwać chwilę.');
        }
        await loadSubscription();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        alert(`Nie udało się zapisać zakupu App Store. ${message}`);
      } finally {
        if (!cancelled) {
          setAppleCheckoutLoading(false);
        }
      }
    };

    void finalizePurchase();
    return () => {
      cancelled = true;
    };
  }, [authFetch, currentParafia?.id, isIosAppContext, loadSubscription]);

  useEffect(() => {
    if (!currentUser) return;
    setPremiumInvoiceForm((prev) => {
      const next = { ...prev };
      if (!next.email && currentUser.email) {
        next.email = currentUser.email;
      }
      if (!next.fullName) {
        const suggestedName = `${currentUser.imie || ''} ${currentUser.nazwisko || ''}`.trim();
        if (suggestedName) next.fullName = suggestedName;
      }
      if (!next.companyName && currentParafia?.nazwa) {
        next.companyName = currentParafia.nazwa;
      }
      return next;
    });
  }, [currentParafia?.nazwa, currentUser]);

  useEffect(() => {
    if (!showPremiumModal) return;
    setPremiumInvoiceRequested(false);
    setPremiumInvoiceErrors({});
  }, [showPremiumModal]);

  const setPremiumInvoiceField = <K extends PremiumInvoiceField>(key: K, value: PremiumInvoiceForm[K]) => {
    setPremiumInvoiceForm((prev) => ({ ...prev, [key]: value }));
    setPremiumInvoiceErrors((prev) => {
      if (!prev[key] && key !== 'invoiceType') return prev;
      const next = { ...prev };
      delete next[key];
      if (key === 'invoiceType') {
        delete next.companyName;
        delete next.taxId;
      }
      return next;
    });
  };

  const togglePremiumInvoiceRequested = () => {
    setPremiumInvoiceRequested((prev) => !prev);
    setPremiumInvoiceErrors({});
  };

  const getNormalizedInvoicePayload = (): PremiumInvoiceForm => ({
    ...premiumInvoiceForm,
    email: premiumInvoiceForm.email.trim().toLowerCase(),
    fullName: premiumInvoiceForm.fullName.trim(),
    companyName: premiumInvoiceForm.companyName.trim(),
    taxId: premiumInvoiceForm.taxId.replace(/[\s-]/g, '').toUpperCase(),
    street: premiumInvoiceForm.street.trim(),
    postalCode: premiumInvoiceForm.postalCode.trim().toUpperCase(),
    city: premiumInvoiceForm.city.trim(),
    country: 'PL',
  });

  const validatePremiumInvoiceForm = (): { data: PremiumInvoiceForm | null; errors: PremiumInvoiceErrors } => {
    if (!premiumInvoiceRequested) {
      return { data: null, errors: {} };
    }

    const data = getNormalizedInvoicePayload();
    const errors: PremiumInvoiceErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Podaj poprawny e-mail do faktury.';
    }
    if (data.fullName.length < 3) {
      errors.fullName = 'Podaj imie i nazwisko do faktury.';
    }
    if (data.invoiceType === 'company' && data.companyName.length < 2) {
      errors.companyName = 'Podaj nazwe firmy lub parafii do faktury.';
    }
    if (data.invoiceType === 'company' && !(/^([0-9]{10}|[A-Z]{2}[A-Z0-9]{8,14})$/.test(data.taxId))) {
      errors.taxId = 'Podaj poprawny NIP/VAT ID.';
    }
    if (data.street.length < 3) {
      errors.street = 'Podaj ulice i numer.';
    }
    if (data.postalCode.length < 3) {
      errors.postalCode = 'Podaj kod pocztowy.';
    }
    if (data.city.length < 2) {
      errors.city = 'Podaj miasto.';
    }
    if (data.country !== 'PL') {
      errors.country = 'Sprzedaz Premium jest teraz dostepna tylko w Polsce (PL).';
    }
    if (!data.consentEmailInvoice) {
      errors.consentEmailInvoice = 'Aby kontynuowac, zaznacz zgode na wysylke faktury e-mailem.';
    }
    return { data, errors };
  };

  const getPremiumInvoiceFieldClass = (field: PremiumInvoiceField) => (
    premiumInvoiceErrors[field]
      ? 'border-red-500 focus-visible:ring-red-500 dark:border-red-400'
      : ''
  );

  const getPremiumInvoiceLabelClass = (field: PremiumInvoiceField) => (
    premiumInvoiceErrors[field]
      ? 'text-red-700 dark:text-red-300'
      : ''
  );

  const renderPremiumInvoiceError = (field: PremiumInvoiceField) => {
    const message = premiumInvoiceErrors[field];
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-700 dark:text-red-300">{message}</p>;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || currentUser) return;
    const url = new URL(window.location.href);
    const authView = url.searchParams.get('auth');
    if (authView === 'register') {
      setIsLogin(false);
      setAuthMode('register');
      setAuthErrors({});
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      return;
    }
    if (authView === 'login') {
      setIsLogin(true);
      setAuthMode('login');
      setAuthErrors({});
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [currentUser]);

  const handleRedeemCode = async (code?: string, parafiaId?: string) => {
    const kodDoUzycia = (code || premiumCode).trim();
    const parafiaDoUzycia = parafiaId || currentParafia?.id;
    if (!kodDoUzycia || !parafiaDoUzycia) return;

    try {
      const res = await authFetch('/api/premium/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: kodDoUzycia, parafiaId: parafiaDoUzycia }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Nie udało się aktywować kodu rabatowego.');
        return;
      }

      alert(result.message || 'Pakiet Premium został aktywowany!');
      setShowPremiumModal(false);
      setPremiumCode('');
      loadSubscription();
    } catch (err) {
      alert('Wystąpił błąd: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleStartStripeCheckout = async () => {
    if (!currentParafia) return;
    if (!canUseStripeBilling) {
      alert(mobilePremiumBillingInfo);
      return;
    }
    const { data: invoiceData, errors } = validatePremiumInvoiceForm();
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setPremiumInvoiceErrors(errors);
      alert(firstError);
      return;
    }
    setPremiumInvoiceErrors({});
    setPremiumCheckoutLoading(true);
    try {
      const res = await authFetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parafiaId: currentParafia.id,
          ...(invoiceData ? { invoiceData } : {}),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Nie udało się rozpocząć płatności.');
        return;
      }

      if (!result.url) {
        alert('Brak linku do płatności.');
        return;
      }

      window.location.assign(String(result.url));
    } catch (err) {
      alert('Wystąpił błąd: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPremiumCheckoutLoading(false);
    }
  };

  const handleStartStripeOneTimeCheckout = async () => {
    if (!currentParafia) return;
    if (!canUseStripeBilling) {
      alert(mobilePremiumBillingInfo);
      return;
    }
    const { data: invoiceData, errors } = validatePremiumInvoiceForm();
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setPremiumInvoiceErrors(errors);
      alert(firstError);
      return;
    }
    setPremiumInvoiceErrors({});
    setPremiumOneTimeCheckoutLoading(true);
    try {
      const res = await authFetch('/api/billing/stripe/checkout-onetime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parafiaId: currentParafia.id,
          ...(invoiceData ? { invoiceData } : {}),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Nie udało się rozpocząć płatności jednorazowej.');
        return;
      }
      if (!result.url) {
        alert('Brak linku do płatności jednorazowej.');
        return;
      }
      window.location.assign(String(result.url));
    } catch (err) {
      alert('Wystąpił błąd: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPremiumOneTimeCheckoutLoading(false);
    }
  };

  const handleStartGooglePlayCheckout = async () => {
    if (!currentParafia?.id) return;
    if (!isAndroidAppContext) {
      alert('Zakup Google Play jest dostępny tylko w aplikacji Android.');
      return;
    }
    setGooglePlayCheckoutLoading(true);
    try {
      const checkoutUrl = new URL(GOOGLE_PLAY_NATIVE_CHECKOUT_URL);
      checkoutUrl.searchParams.set('parafiaId', currentParafia.id);
      checkoutUrl.searchParams.set('productId', GOOGLE_PLAY_PREMIUM_PRODUCT_ID);
      checkoutUrl.searchParams.set('basePlanId', GOOGLE_PLAY_PREMIUM_BASE_PLAN_ID);
      window.location.assign(checkoutUrl.toString());

      // Jeśli urządzenie nie obsłuży deeplinku, nie blokuj przycisku na stałe.
      window.setTimeout(() => {
        setGooglePlayCheckoutLoading(false);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGooglePlayCheckoutLoading(false);
      alert(`Nie udało się uruchomić płatności Google Play. ${message}`);
    }
  };

  const handleStartAppleCheckout = async () => {
    if (!currentParafia?.id) return;
    if (!isIosAppContext) {
      alert('Zakup App Store jest dostępny tylko w aplikacji iOS.');
      return;
    }
    setAppleCheckoutLoading(true);
    try {
      const checkoutUrl = new URL(APPLE_NATIVE_CHECKOUT_URL);
      checkoutUrl.searchParams.set('parafiaId', currentParafia.id);
      checkoutUrl.searchParams.set('productId', APPLE_PREMIUM_PRODUCT_ID);
      window.location.assign(checkoutUrl.toString());

      // Jeśli urządzenie nie obsłuży deeplinku, nie blokuj przycisku na stałe.
      window.setTimeout(() => {
        setAppleCheckoutLoading(false);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAppleCheckoutLoading(false);
      alert(`Nie udało się uruchomić płatności App Store. ${message}`);
    }
  };

  const handleOpenStripePortal = async () => {
    if (!currentParafia) return;
    if (!canUseStripeBilling) {
      alert(mobilePremiumBillingInfo);
      return;
    }
    setPremiumPortalLoading(true);
    try {
      const res = await authFetch('/api/billing/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parafiaId: currentParafia.id }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Nie udało się otworzyć panelu płatności.');
        return;
      }
      if (!result.url) {
        alert('Brak linku do panelu Stripe.');
        return;
      }
      window.location.assign(String(result.url));
    } catch (err) {
      alert('Wystąpił błąd: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPremiumPortalLoading(false);
    }
  };

  // ==================== USEEFFECT - INICJALIZACJA ====================

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      authAccessTokenRef.current = session?.access_token || null;
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authAccessTokenRef.current = session?.access_token || null;
      if (session) {
        loadProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsAdminPreviewMode(false);
        setAdminImpersonationSession(null);
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
    if (!currentUser?.id) {
      setAdminImpersonationSession(null);
      return;
    }
    void loadAdminImpersonationStatus();
  }, [currentUser?.id, loadAdminImpersonationStatus]);

  useEffect(() => {
    impersonationAutoExitSentRef.current = false;
  }, [adminImpersonationSession?.id]);

  useEffect(() => {
    if (!adminImpersonationSession) return;

    const handlePageExit = () => {
      stopAdminImpersonationKeepalive();
    };

    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
    };
  }, [adminImpersonationSession, stopAdminImpersonationKeepalive]);

  // Auto-fill join code from URL param (QR code link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kod = params.get('kod');
    if (kod) {
      sessionStorage.setItem('join_kod', kod.toUpperCase());
      params.delete('kod');
      const restQuery = params.toString();
      window.history.replaceState({}, '', restQuery ? `${window.location.pathname}?${restQuery}` : window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.parafia_id) return;
    const savedKod = sessionStorage.getItem('join_kod');
    if (savedKod) {
      setJoinCode(savedKod);
      setShowJoinModal(true);
      sessionStorage.removeItem('join_kod');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.parafia_id) {
      loadParafiaData();
      loadSluzby();
      loadPoslugi();
    }
  }, [currentUser?.parafia_id, loadParafiaData, loadSluzby, loadPoslugi]);

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
    let cancelled = false;
    setInfoBanerReady(false);
    setInfoBanerEnabled(false);
    setInfoBanerTresc({ tytul: '', opis: '' });

    const parseWelcomeBannerConfig = (raw: string): WelcomeBannerConfig | null => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as Partial<WelcomeBannerConfig> & Partial<WelcomeBannerRoleConfig>;
        const sanitizeVariant = (value: unknown): WelcomeBannerVariant => {
          const source = (value || {}) as Partial<WelcomeBannerVariant>;
          const dniRaw = Number(source.dniWyswietlania);
          const legacyDniRaw = Number((source as { dniOdRejestracji?: number }).dniOdRejestracji);
          const normalizedDaysRaw = Number.isFinite(dniRaw) ? dniRaw : legacyDniRaw;
          const dniWyswietlania = Number.isFinite(normalizedDaysRaw) ? Math.max(1, Math.min(3650, Math.round(normalizedDaysRaw))) : 30;
          return {
            aktywny: Boolean(source.aktywny),
            tytul: typeof source.tytul === 'string' ? source.tytul : '',
            opis: typeof source.opis === 'string' ? source.opis : '',
            bezterminowo: source.bezterminowo !== undefined ? Boolean(source.bezterminowo) : false,
            dniWyswietlania,
            startAt: typeof source.startAt === 'string' ? source.startAt : '',
          };
        };
        const sanitizeRoleConfig = (value: unknown): WelcomeBannerRoleConfig => {
          const source = (value || {}) as Partial<WelcomeBannerRoleConfig>;
          return {
            nowi: sanitizeVariant(source.nowi),
            wszyscy: sanitizeVariant(source.wszyscy),
            parafia: {
              ...sanitizeVariant(source.parafia),
              parafiaId: typeof source.parafia?.parafiaId === 'string' ? source.parafia.parafiaId : '',
            },
          };
        };

        if (parsed.ksiadz || parsed.ministrant) {
          return {
            ksiadz: sanitizeRoleConfig(parsed.ksiadz),
            ministrant: sanitizeRoleConfig(parsed.ministrant),
          };
        }

        // Backward compatibility: old v2 shape without split -> apply to both roles.
        const shared = sanitizeRoleConfig(parsed);
        return {
          ksiadz: {
            nowi: { ...shared.nowi },
            wszyscy: { ...shared.wszyscy },
            parafia: { ...shared.parafia },
          },
          ministrant: {
            nowi: { ...shared.nowi },
            wszyscy: { ...shared.wszyscy },
            parafia: { ...shared.parafia },
          },
        };
      } catch {
        return null;
      }
    };

    const isTruthyFlag = (value: string) => {
      const raw = value.trim().toLowerCase();
      if (!raw) return true;
      return ['1', 'true', 'yes', 'on'].includes(raw);
    };
    const isVariantWithinDisplayWindow = (variant: WelcomeBannerVariant) => {
      if (!variant.aktywny) return false;
      if (variant.bezterminowo) return true;
      const days = Math.max(1, Number(variant.dniWyswietlania) || 1);
      if (!variant.startAt) return true;
      const startAtDate = new Date(variant.startAt);
      if (Number.isNaN(startAtDate.getTime())) return true;
      const elapsedDays = (Date.now() - startAtDate.getTime()) / (1000 * 60 * 60 * 24);
      return elapsedDays < days;
    };

    void (async () => {
      try {
        const { data } = await supabase
          .from('app_config')
          .select('klucz, wartosc')
          .in('klucz', [
            'baner_powitalny_v2',
            'baner_ministrant_aktywny',
            'baner_ministrant_tytul',
            'baner_ministrant_opis',
            'baner_ksiadz_aktywny',
            'baner_ksiadz_tytul',
            'baner_ksiadz_opis',
          ]);
        if (cancelled) return;
        const rows = (data || []) as AppConfigEntry[];
        const get = (k: string) => rows.find((d) => d.klucz === k)?.wartosc || '';

        const configV2 = parseWelcomeBannerConfig(get('baner_powitalny_v2'));
        let selected: WelcomeBannerVariant | null = null;

        if (configV2) {
          const roleKey: WelcomeBannerRole = currentUser.typ === 'ksiadz' ? 'ksiadz' : 'ministrant';
          const roleConfig = configV2[roleKey];
          const createdAtDate = currentUser.created_at ? new Date(currentUser.created_at) : null;
          const createdAtValid = !!createdAtDate && !Number.isNaN(createdAtDate.getTime());
          const daysSinceRegister = createdAtValid
            ? Math.max(0, (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
            : Number.POSITIVE_INFINITY;

          const showNowi = roleConfig.nowi.aktywny && (
            roleConfig.nowi.bezterminowo
              ? true
              : daysSinceRegister < Math.max(1, Number(roleConfig.nowi.dniWyswietlania) || 1)
          );

          if (showNowi) {
            selected = roleConfig.nowi;
          } else if (
            isVariantWithinDisplayWindow(roleConfig.parafia)
            && !!roleConfig.parafia.parafiaId
            && !!currentUser.parafia_id
            && roleConfig.parafia.parafiaId === currentUser.parafia_id
          ) {
            selected = roleConfig.parafia;
          } else if (isVariantWithinDisplayWindow(roleConfig.wszyscy)) {
            selected = roleConfig.wszyscy;
          }
        } else {
          // Legacy fallback
          const prefix = currentUser.typ === 'ksiadz' ? 'baner_ksiadz' : 'baner_ministrant';
          const legacyActive = isTruthyFlag(get(`${prefix}_aktywny`));
          if (legacyActive) {
            selected = {
              aktywny: true,
              tytul: get(`${prefix}_tytul`),
              opis: get(`${prefix}_opis`),
              bezterminowo: false,
              dniWyswietlania: 30,
              startAt: '',
            };
          }
        }

        setInfoBanerEnabled(!!selected?.aktywny);
        setInfoBanerTresc({
          tytul: selected?.tytul || '',
          opis: selected?.opis || '',
        });
        setInfoBanerReady(true);
      } catch {
        if (cancelled) return;
        setInfoBanerEnabled(false);
        setInfoBanerTresc({ tytul: '', opis: '' });
        setInfoBanerReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.typ, currentUser?.created_at, currentUser?.parafia_id]);

  // Zaladuj modlitwy z app_config
  useEffect(() => {
    if (!currentUser?.parafia_id) return;
    const pid = currentUser.parafia_id;
    supabase.from('app_config').select('klucz, wartosc')
      .in('klucz', [`modlitwa_przed_${pid}`, `modlitwa_po_${pid}`, `modlitwa_lacina_${pid}`])
      .then(({ data }) => {
        if (data && data.length > 0) {
          const rows = data as AppConfigEntry[];
          const przed = rows.find((d) => d.klucz === `modlitwa_przed_${pid}`)?.wartosc || '';
          const po = rows.find((d) => d.klucz === `modlitwa_po_${pid}`)?.wartosc || '';
          setModlitwyTresc({ przed, po });
          const lacinaJson = rows.find((d) => d.klucz === `modlitwa_lacina_${pid}`)?.wartosc;
          if (lacinaJson) {
            try { setLacinaData(JSON.parse(lacinaJson)); } catch { /* ignore */ }
          }
        }
      });
  }, [currentUser?.parafia_id]);

  // Załaduj lokalne nadpisania dni kalendarza liturgicznego dla parafii
  useEffect(() => {
    if (!currentUser?.parafia_id) {
      setCalendarOverrides({});
      return;
    }
    const pid = currentUser.parafia_id;
    const prefix = `kalendarz_override_${pid}_`;
    supabase
      .from('app_config')
      .select('klucz, wartosc')
      .like('klucz', `${prefix}%`)
      .then(({ data }) => {
        const next: Record<string, LiturgicalDayOverride> = {};
        (data as AppConfigEntry[] | null)?.forEach((row) => {
          if (!row.klucz.startsWith(prefix) || !row.wartosc) return;
          const date = row.klucz.slice(prefix.length);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
          try {
            const parsed = JSON.parse(row.wartosc);
            if (!parsed || typeof parsed !== 'object') return;
            const kolor = String((parsed as { kolor?: string }).kolor || '') as DzienLiturgiczny['kolor'];
            const ranga = String((parsed as { ranga?: string }).ranga || '') as DzienLiturgiczny['ranga'];
            const dozwoloneKolory: DzienLiturgiczny['kolor'][] = ['zielony', 'bialy', 'czerwony', 'fioletowy', 'rozowy', 'zloty', 'niebieski', 'czarny'];
            const dozwoloneRangi: DzienLiturgiczny['ranga'][] = ['uroczystosc', 'swieto', 'wspomnienie', 'wspomnienie_dowolne', 'dzien_powszedni'];
            if (!dozwoloneKolory.includes(kolor) || !dozwoloneRangi.includes(ranga)) return;
            next[date] = {
              nazwa: String((parsed as { nazwa?: string }).nazwa || ''),
              kolor,
              ranga,
              okres: String((parsed as { okres?: string }).okres || ''),
            };
          } catch {
            // ignore
          }
        });
        setCalendarOverrides(next);
      });
  }, [currentUser?.parafia_id]);

  useEffect(() => {
    if (!selectedDay) {
      setCalendarEditMode(false);
      return;
    }
    setCalendarEditForm({
      nazwa: selectedDay.nazwa || '',
      kolor: selectedDay.kolor,
      ranga: selectedDay.ranga,
      okres: selectedDay.okres || '',
    });
    setCalendarEditMode(false);
  }, [selectedDay]);

  useEffect(() => {
    if (typeof window === 'undefined' || !priestRankingInfoStorageKey) {
      setHidePriestRankingInfoPermanently(false);
      return;
    }
    setHidePriestRankingInfoPermanently(readLocalStorage(priestRankingInfoStorageKey) === 'true');
  }, [priestRankingInfoStorageKey]);

  useEffect(() => {
    const shouldShow = activeTab === 'ranking' && isPriestUser && canManageRanking && !hidePriestRankingInfoPermanently;
    setShowPriestRankingInfo(shouldShow);
  }, [activeTab, isPriestUser, canManageRanking, hidePriestRankingInfoPermanently]);

  useEffect(() => {
    if (typeof window === 'undefined' || !priestMinistranciInfoStorageKey) {
      setHidePriestMinistranciInfoPermanently(false);
      return;
    }
    setHidePriestMinistranciInfoPermanently(readLocalStorage(priestMinistranciInfoStorageKey) === 'true');
  }, [priestMinistranciInfoStorageKey]);

  useEffect(() => {
    const shouldShow = activeTab === 'ministranci' && isPriestUser && canManageMembers && !hidePriestMinistranciInfoPermanently;
    setShowPriestMinistranciInfo(shouldShow);
  }, [activeTab, isPriestUser, canManageMembers, hidePriestMinistranciInfoPermanently]);

  useEffect(() => {
    if (typeof window === 'undefined' || !priestWydarzeniaInfoStorageKey) {
      setHidePriestWydarzeniaInfoPermanently(false);
      return;
    }
    setHidePriestWydarzeniaInfoPermanently(readLocalStorage(priestWydarzeniaInfoStorageKey) === 'true');
  }, [priestWydarzeniaInfoStorageKey]);

  useEffect(() => {
    const shouldShow = activeTab === 'sluzby' && isPriestUser && (canManageEvents || canManageFunctionTemplates) && !hidePriestWydarzeniaInfoPermanently;
    setShowPriestWydarzeniaInfo(shouldShow);
  }, [activeTab, isPriestUser, canManageEvents, canManageFunctionTemplates, hidePriestWydarzeniaInfoPermanently]);

  useEffect(() => {
    if (typeof window === 'undefined' || !priestPoslugiInfoStorageKey) {
      setHidePriestPoslugiInfoPermanently(false);
      return;
    }
    setHidePriestPoslugiInfoPermanently(readLocalStorage(priestPoslugiInfoStorageKey) === 'true');
  }, [priestPoslugiInfoStorageKey]);

  useEffect(() => {
    const shouldShow = activeTab === 'poslugi' && isPriestUser && canManagePoslugiCatalog && !hidePriestPoslugiInfoPermanently;
    setShowPriestPoslugiInfo(shouldShow);
  }, [activeTab, isPriestUser, canManagePoslugiCatalog, hidePriestPoslugiInfoPermanently]);

  // Pokaż baner instalacji PWA na iOS Safari
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = isStandaloneApp();
    const dismissed = readLocalStorage('ios-install-dismissed');
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
    if (!currentUser?.parafia_id || !isRegularMinistrant) return;
    const interval = setInterval(() => loadRankingData(), 30000);
    return () => clearInterval(interval);
  }, [currentUser?.parafia_id, isRegularMinistrant, loadRankingData]);

  // Wykryj nowo zatwierdzone zgłoszenia i pokaż celebrację
  useEffect(() => {
    if (!isRegularMinistrant || obecnosci.length === 0) {
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
  }, [obecnosci, isRegularMinistrant, currentUser?.id, rankingData]);

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
  }, [showNewWatekModal, tiptapEditor, newWatekForm.tresc]);

  // ==================== AUTENTYKACJA ====================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isBlockedPriestEmail = (candidateEmail: string): boolean => {
    const domain = candidateEmail.trim().toLowerCase().split('@')[1] || '';
    return BLOCKED_PRIEST_EMAIL_DOMAINS.includes(domain);
  };

  const shouldShowChangedEmailLoginHint = async (loginEmail: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login-email-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      const result = await response.json().catch(() => ({}));
      return Boolean(response.ok && result?.ok && result?.showChangedEmailHint);
    } catch {
      return false;
    }
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
      if (userType === 'ksiadz' && diecezja && !dekanat) errors.dekanat = 'Wybierz swój dekanat';
      if (userType === 'ksiadz' && isBlockedPriestEmail(email.trim())) {
        errors.email = 'Rejestracja księdza z domeną @niepodam.pl jest zablokowana.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    setAuthErrors({});
    setAuthLoading(true);

    if (isLogin) {
      const loginEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          const changedEmailHint = await shouldShowChangedEmailLoginHint(loginEmail);
          if (changedEmailHint) {
            setAuthErrors({
              general: 'Ten adres e-mail został zmieniony w aplikacji. Do logowania użyj adresu podanego podczas rejestracji.',
            });
          } else {
            setAuthErrors({ general: 'Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.' });
          }
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

      if (userType === 'ksiadz') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { imie: imie.trim(), nazwisko: nazwisko.trim(), typ: userType, ...(diecezja ? { diecezja, dekanat: dekanat.trim() } : {}) },
            emailRedirectTo: `${window.location.origin}/app`
          }
        });

        if (error) {
          if (error.message === 'User already registered') {
            setAuthErrors({ email: 'Użytkownik o tym adresie e-mail już istnieje.' });
          } else if (error.message.toLowerCase().includes('@niepodam.pl') || error.message.toLowerCase().includes('zablokowana')) {
            setAuthErrors({ email: 'Rejestracja księdza z domeną @niepodam.pl jest zablokowana.' });
          } else if (error.message.includes('password')) {
            setAuthErrors({ password: 'Hasło jest za słabe. Użyj co najmniej 6 znaków.' });
          } else if (error.message.toLowerCase().includes('rate limit')) {
            setAuthErrors({ general: 'Przekroczono limit wiadomości e-mail. Spróbuj ponownie za kilka minut.' });
          } else {
            setAuthErrors({ general: error.message });
          }
          setAuthLoading(false);
          return;
        }

        setAuthMode('email-sent');
        setAuthLoading(false);
        return;
      }

      // Ministrant — rejestracja backendowa bez wysyłania maila potwierdzającego
      const registerRes = await fetch('/api/auth/register-ministrant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          imie: imie.trim(),
          nazwisko: nazwisko.trim(),
        }),
      });
      const registerResult = await registerRes.json().catch(() => ({}));
      if (!registerRes.ok || !registerResult?.ok) {
        const message = String(registerResult?.error || 'Błąd rejestracji');
        if (message === 'User already registered') {
          setAuthErrors({ email: 'Użytkownik o tym adresie e-mail już istnieje.' });
        } else if (message.toLowerCase().includes('password')) {
          setAuthErrors({ password: 'Hasło jest za słabe. Użyj co najmniej 6 znaków.' });
        } else {
          setAuthErrors({ general: message });
        }
        setAuthLoading(false);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) {
        setAuthErrors({ general: 'Konto utworzone, ale nie udało się zalogować. Spróbuj zalogować się ręcznie.' });
        setAuthLoading(false);
        return;
      }
    }

    setAuthLoading(false);
  };

  const handleGoogleAuth = async () => {
    if (isIosAppContext) {
      setAuthErrors({ general: 'Logowanie przez Google nie jest dostępne w aplikacji iOS.' });
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setAuthErrors({ general: 'Musisz zaakceptować regulamin i politykę prywatności.' });
      return;
    }

    setAuthErrors({});
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setAuthErrors({ general: 'Nie udało się zalogować przez Google. Spróbuj ponownie.' });
      setAuthLoading(false);
      return;
    }
  };

  const showGoogleAuthButton = !isIosAppContext;

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
    if (adminImpersonationSession) {
      const stopped = await stopAdminImpersonationSession();
      if (!stopped) {
        stopAdminImpersonationKeepalive();
      }
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowProfileCompletion(false);
    setEmail('');
    setPassword('');
    setImie('');
  };

  const handleDeleteParafia = async () => {
    if (!currentUser?.parafia_id || !currentParafia) {
      alert('Brak danych parafii — odśwież stronę i spróbuj ponownie.');
      return;
    }
    setDeleteParafiaLoading(true);
    try {
      const res = await authFetch('/api/admin/delete-parish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parafiaId: currentUser.parafia_id })
      });
      const result = await res.json();
      if (!res.ok) {
        const suffix = result?.partial ? ' (operacja częściowo wykonana, sprawdź logi serwera)' : '';
        alert('Błąd usuwania: ' + (result.error || 'Nieznany błąd') + suffix);
        setDeleteParafiaLoading(false);
        return;
      }
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      alert('Błąd połączenia z serwerem: ' + String(err));
      setDeleteParafiaLoading(false);
    }
  };

  const saveParafiaNazwa = async () => {
    if (!currentParafia || !parafiaNazwaInput.trim()) return;
    const { error } = await supabase.from('parafie').update({ nazwa: parafiaNazwaInput.trim() }).eq('id', currentParafia.id);
    if (error) { alert('Błąd: ' + error.message); return; }
    setCurrentParafia({ ...currentParafia, nazwa: parafiaNazwaInput.trim() });
    setEditingParafiaNazwa(false);
  };

  const saveModlitwa = async (typ: 'przed' | 'po', text: string) => {
    if (!currentUser?.parafia_id) return;
    const klucz = `modlitwa_${typ}_${currentUser.parafia_id}`;
    await supabase.from('app_config').upsert({ klucz, wartosc: text }, { onConflict: 'klucz' });
    setModlitwyTresc(prev => ({ ...prev, [typ]: text }));
    setEditingModlitwa(null);
  };

  const saveLacinaData = async (data: typeof MODLITWY.lacina) => {
    if (!currentUser?.parafia_id) return;
    const klucz = `modlitwa_lacina_${currentUser.parafia_id}`;
    await supabase.from('app_config').upsert({ klucz, wartosc: JSON.stringify(data) }, { onConflict: 'klucz' });
    setLacinaData(data);
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

    const normalizedAdminEmail = currentUser.email.trim().toLowerCase();

    // Szybka walidacja po stronie klienta (twarda blokada jest też w SQL triggerze)
    const { count: existingParafiaCount, error: checkParafiaError } = await supabase
      .from('parafie')
      .select('id', { count: 'exact', head: true })
      .eq('admin_email', normalizedAdminEmail);

    if (checkParafiaError) {
      alert('Nie udało się sprawdzić parafii dla tego emaila. Spróbuj ponownie.');
      return;
    }

    if ((existingParafiaCount ?? 0) > 0) {
      alert('Ten email ma już przypisaną parafię.');
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
        admin_email: normalizedAdminEmail,
        kod_zaproszenia: generateInviteCode()
      })
      .select()
      .single();

    if (parafiaError || !newParafia) {
      const duplicateAdminEmailError = parafiaError?.code === '23505'
        && (parafiaError.message || '').toLowerCase().includes('ma juz parafie');
      if (duplicateAdminEmailError) {
        alert('Ten email ma już przypisaną parafię.');
        return;
      }
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

    // Zastosuj opublikowany szablon panelu ksiedza dla nowych parafii (jesli istnieje)
    try {
      const { data: templateRow } = await supabase
        .from('app_config')
        .select('wartosc')
        .eq('klucz', 'ksiadz_panel_template_default')
        .maybeSingle();

      if (templateRow?.wartosc) {
        const parsed = JSON.parse(templateRow.wartosc) as KsiadzPanelTemplate;

        if (parsed.parafia) {
          await supabase
            .from('parafie')
            .update({
              grupy: parsed.parafia.grupy ?? null,
              funkcje_config: parsed.parafia.funkcje_config ?? null,
            })
            .eq('id', newParafia.id);
        }

        const replaceRows = async (table: 'poslugi' | 'punktacja_config' | 'rangi_config' | 'odznaki_config', rows: Record<string, unknown>[]) => {
          await supabase.from(table).delete().eq('parafia_id', newParafia.id);
          if (rows.length > 0) {
            await supabase.from(table).insert(rows);
          }
        };

        await replaceRows('poslugi', (parsed.poslugi || []).map((row, index) => ({
          id: crypto.randomUUID(),
          parafia_id: newParafia.id,
          slug: row.slug || `posluga_${index + 1}`,
          nazwa: row.nazwa || `Posluga ${index + 1}`,
          opis: row.opis || '',
          emoji: row.emoji || '⭐',
          kolor: row.kolor || 'gray',
          kolejnosc: Number.isFinite(Number(row.kolejnosc)) ? Number(row.kolejnosc) : index,
          obrazek_url: row.obrazek_url || null,
          dlugi_opis: row.dlugi_opis || '',
          zdjecia: row.zdjecia || [],
          youtube_url: row.youtube_url || '',
        })));

        await replaceRows('punktacja_config', (parsed.punktacja || []).map((row) => ({
          id: crypto.randomUUID(),
          parafia_id: newParafia.id,
          klucz: row.klucz,
          wartosc: Number.isFinite(Number(row.wartosc)) ? Number(row.wartosc) : 0,
          opis: row.opis || '',
        })));

        await replaceRows('rangi_config', (parsed.rangi || []).map((row, index) => ({
          id: crypto.randomUUID(),
          parafia_id: newParafia.id,
          nazwa: row.nazwa || `Ranga ${index + 1}`,
          min_pkt: Number.isFinite(Number(row.min_pkt)) ? Number(row.min_pkt) : 0,
          kolor: row.kolor || 'gray',
          kolejnosc: Number.isFinite(Number(row.kolejnosc)) ? Number(row.kolejnosc) : index,
        })));

        await replaceRows('odznaki_config', (parsed.odznaki || []).map((row, index) => ({
          id: crypto.randomUUID(),
          parafia_id: newParafia.id,
          nazwa: row.nazwa || `Odznaka ${index + 1}`,
          opis: row.opis || '',
          warunek_typ: row.warunek_typ || 'obecnosci',
          warunek_wartosc: Number.isFinite(Number(row.warunek_wartosc)) ? Number(row.warunek_wartosc) : 0,
          bonus_pkt: Number.isFinite(Number(row.bonus_pkt)) ? Number(row.bonus_pkt) : 0,
          aktywna: Boolean(row.aktywna),
        })));

        const modlitwyRows = [
          { klucz: `modlitwa_przed_${newParafia.id}`, wartosc: parsed.modlitwy?.przed || '' },
          { klucz: `modlitwa_po_${newParafia.id}`, wartosc: parsed.modlitwy?.po || '' },
          { klucz: `modlitwa_lacina_${newParafia.id}`, wartosc: parsed.modlitwy?.lacina || '' },
        ];
        await supabase.from('app_config').upsert(modlitwyRows, { onConflict: 'klucz' });
      }
    } catch (templateError) {
      console.error('Blad zastosowania szablonu ksiedza dla nowej parafii:', templateError);
    }

    // Aktywuj kod rabatowy jeśli podano
    if (parafiaKodRabatowy.trim()) {
      await handleRedeemCode(parafiaKodRabatowy, newParafia.id);
    }

    setCurrentUser({ ...currentUser, parafia_id: newParafia.id });
    setShowParafiaModal(false);
    setParafiaNazwa('');
    setParafiaMiasto('');
    setParafiaAdres('');
    setParafiaKodRabatowy('');
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

    // Dodaj jako członka (ministrant oczekuje na zatwierdzenie)
    const { error: memberError } = await supabase.from('parafia_members').insert({
      profile_id: currentUser.id,
      parafia_id: parafia.id,
      email: currentUser.email,
      imie: currentUser.imie,
      nazwisko: currentUser.nazwisko,
      typ: currentUser.typ,
      role: [],
      zatwierdzony: currentUser.typ === 'ksiadz'
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

    // Dodaj jako członka parafii (ministrant oczekuje na zatwierdzenie)
    await supabase.from('parafia_members').insert({
      profile_id: currentUser.id,
      parafia_id: zaproszenie.parafia_id,
      email: currentUser.email,
      imie: currentUser.imie,
      nazwisko: currentUser.nazwisko,
      typ: currentUser.typ,
      role: [],
      zatwierdzony: currentUser.typ === 'ksiadz'
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
  const FUNKCJA_DUP_SEPARATOR = '__DUP__';

  const normalizeFunkcjaName = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const getFunkcjaBaseType = (key: string) => key.split(FUNKCJA_DUP_SEPARATOR)[0];

  const getFunkcjaSlotNumber = (key: string) => {
    const parts = key.split(FUNKCJA_DUP_SEPARATOR);
    if (parts.length < 2) return 1;
    const slot = Number(parts[1]);
    return Number.isFinite(slot) && slot > 1 ? slot : 1;
  };

  const isMultiAssigneeFunkcja = (typ: string) => {
    const normalized = normalizeFunkcjaName(typ);
    return normalized.includes('dzwonk') || normalized.includes('paten');
  };

  const getHourFunkcjaKeys = (hourFunkcje: FunkcjaAssignmentMap) =>
    [
      ...FUNKCJE_TYPES,
      ...Array.from(new Set(Object.keys(hourFunkcje).map(getFunkcjaBaseType)))
        .filter((typ) => !FUNKCJE_TYPES.includes(typ))
        .sort((a, b) => a.localeCompare(b, 'pl')),
    ].flatMap((typ) => {
      const extras = Object.keys(hourFunkcje)
        .filter((key) => getFunkcjaBaseType(key) === typ && key !== typ)
        .sort((a, b) => getFunkcjaSlotNumber(a) - getFunkcjaSlotNumber(b));
      return [typ, ...extras];
    });

  const getExternalAssignmentKey = (hour: string, funkcjaKey: string) => `${hour}::${funkcjaKey}`;

  const findMissingExternalAssignmentLabel = (
    godzina: string,
    funkcjePerHour: FunkcjePerHourMap,
    externalAssignments: Record<string, string>
  ) => {
    const hours = parseGodziny(godzina);
    for (const h of hours) {
      const hourFunkcje = funkcjePerHour[h] || {};
      const keys = new Set<string>([...FUNKCJE_TYPES, ...Object.keys(hourFunkcje)]);
      for (const key of keys) {
        const assigned = hourFunkcje[key] || 'BEZ';
        if (assigned !== EXTERNAL_ASSIGNMENT_VALUE) continue;
        const externalName = (externalAssignments[getExternalAssignmentKey(h, key)] || '').trim();
        if (!externalName) {
          const baseTyp = getFunkcjaBaseType(key);
          const slot = getFunkcjaSlotNumber(key);
          return slot > 1 ? `${baseTyp} (${slot})` : baseTyp;
        }
      }
    }
    return null;
  };

  const buildFunkcjeRecords = (
    sluzbaId: string,
    godzina: string,
    funkcjePerHour: FunkcjePerHourMap,
    externalAssignments: Record<string, string>
  ) => {
    const hours = parseGodziny(godzina);
    const records: {
      sluzba_id: string;
      typ: string;
      ministrant_id: string | null;
      osoba_zewnetrzna: string | null;
      aktywna: boolean;
      zaakceptowana: boolean;
      godzina: string;
    }[] = [];
    hours.forEach(h => {
      const hourFunkcje = funkcjePerHour[h] || {};
      const keys = new Set<string>([...FUNKCJE_TYPES, ...Object.keys(hourFunkcje)]);
      keys.forEach((key) => {
        const typ = getFunkcjaBaseType(key);
        const assigned = hourFunkcje[key] || 'BEZ';
        const externalName = assigned === EXTERNAL_ASSIGNMENT_VALUE
          ? (externalAssignments[getExternalAssignmentKey(h, key)] || '').trim()
          : '';
        records.push({
          sluzba_id: sluzbaId,
          typ,
          ministrant_id: (assigned !== 'BEZ' && assigned !== 'UNASSIGNED' && assigned !== EXTERNAL_ASSIGNMENT_VALUE) ? assigned : null,
          osoba_zewnetrzna: assigned === EXTERNAL_ASSIGNMENT_VALUE ? (externalName || null) : null,
          aktywna: assigned !== 'BEZ',
          zaakceptowana: false,
          godzina: h,
        });
      });
    });
    return records;
  };

  const handleCreateSluzba = async () => {
    const cleanNazwa = sluzbaForm.nazwa.trim();
    const cleanGodzina = sluzbaCleanGodzina;
    setSluzbaValidationAttempted(true);
    if (!cleanNazwa || !sluzbaForm.data || !cleanGodzina || !currentUser?.parafia_id) {
      alert('Wypełnij wymagane pola!');
      return;
    }

    const missingExternalAssignment = findMissingExternalAssignmentLabel(
      cleanGodzina,
      sluzbaForm.funkcjePerHour,
      sluzbaExternalAssignments
    );
    if (missingExternalAssignment) {
      alert(`Uzupełnij imię i nazwisko osoby z zewnątrz dla funkcji: ${missingExternalAssignment}.`);
      return;
    }

    const buildSluzbaSaveErrorMessage = (prefix: string, error: { message?: string } | null | undefined) => {
      const details = error?.message || 'Nieznany błąd';
      if (details.includes('osoba_zewnetrzna')) {
        return `${prefix}: ${details}. W bazie brakuje migracji kolumny osoby z zewnątrz (uruchom add-funkcje-external-assignee.sql).`;
      }
      return `${prefix}: ${details}`;
    };

    if (selectedSluzba) {
      // Edycja
      const previousSluzbaSnapshot = {
        nazwa: selectedSluzba.nazwa,
        data: selectedSluzba.data,
        godzina: selectedSluzba.godzina,
        ekstra_punkty: selectedSluzba.ekstra_punkty ?? null,
      };
      const previousFunkcjeSnapshot = (selectedSluzba.funkcje || []).map((f) => ({
        id: f.id,
        sluzba_id: selectedSluzba.id,
        typ: f.typ,
        ministrant_id: f.ministrant_id,
        osoba_zewnetrzna: f.osoba_zewnetrzna ?? null,
        aktywna: f.aktywna,
        zaakceptowana: f.zaakceptowana,
        godzina: f.godzina ?? null,
      }));

      const { error: updateSluzbaError } = await supabase
        .from('sluzby')
        .update({
          nazwa: cleanNazwa,
          data: sluzbaForm.data,
          godzina: cleanGodzina,
          ekstra_punkty: sluzbaEkstraPunkty
        })
        .eq('id', selectedSluzba.id);
      if (updateSluzbaError) {
        alert(buildSluzbaSaveErrorMessage('Nie udało się zapisać zmian wydarzenia', updateSluzbaError));
        return;
      }

      const funkcjeToInsert = buildFunkcjeRecords(
        selectedSluzba.id,
        cleanGodzina,
        sluzbaForm.funkcjePerHour,
        sluzbaExternalAssignments
      );
      const fallbackHour = parseGodziny(cleanGodzina)[0] || cleanGodzina;
      const buildFunkcjaSyncPairs = <T extends { typ: string; godzina?: string | null }>(rows: T[]) => {
        const counts: Record<string, number> = {};
        return rows.map((row) => {
          const hour = (row.godzina || fallbackHour).trim();
          const counterKey = `${hour}::${row.typ}`;
          const slot = (counts[counterKey] || 0) + 1;
          counts[counterKey] = slot;
          return {
            key: `${hour}::${row.typ}::${slot}`,
            row,
          };
        });
      };

      const previousPairs = buildFunkcjaSyncPairs(previousFunkcjeSnapshot);
      const previousByKey = new Map(previousPairs.map((entry) => [entry.key, entry.row]));
      const nextPairsRaw = buildFunkcjaSyncPairs(funkcjeToInsert);
      const nextPairs = nextPairsRaw.filter((entry) => {
        if (previousByKey.has(entry.key)) return true;
        // Starsze wydarzenia często nie mają zapisanych "pustych" funkcji.
        // Pomijamy je przy edycji, żeby aktualizacja mogła iść wyłącznie przez UPDATE.
        return entry.row.aktywna || !!entry.row.ministrant_id || !!entry.row.osoba_zewnetrzna;
      });
      const canUseUpdateOnly =
        previousPairs.length === nextPairs.length &&
        nextPairs.every((entry) => previousByKey.has(entry.key));

      if (canUseUpdateOnly) {
        const appliedUpdates: { id: string; previous: typeof previousFunkcjeSnapshot[number] }[] = [];
        for (const entry of nextPairs) {
          const previousRow = previousByKey.get(entry.key);
          if (!previousRow) continue;

          const { error: updateFunkcjaError } = await supabase
            .from('funkcje')
            .update({
              typ: entry.row.typ,
              ministrant_id: entry.row.ministrant_id,
              osoba_zewnetrzna: entry.row.osoba_zewnetrzna,
              aktywna: entry.row.aktywna,
              zaakceptowana: entry.row.zaakceptowana,
              godzina: entry.row.godzina,
            })
            .eq('id', previousRow.id)
            .eq('sluzba_id', selectedSluzba.id);

          if (updateFunkcjaError) {
            await supabase.from('sluzby').update(previousSluzbaSnapshot).eq('id', selectedSluzba.id);
            for (const applied of [...appliedUpdates].reverse()) {
              await supabase
                .from('funkcje')
                .update({
                  typ: applied.previous.typ,
                  ministrant_id: applied.previous.ministrant_id,
                  osoba_zewnetrzna: applied.previous.osoba_zewnetrzna,
                  aktywna: applied.previous.aktywna,
                  zaakceptowana: applied.previous.zaakceptowana,
                  godzina: applied.previous.godzina,
                })
                .eq('id', applied.id)
                .eq('sluzba_id', selectedSluzba.id);
            }
            alert(buildSluzbaSaveErrorMessage('Nie udało się zapisać funkcji po edycji', updateFunkcjaError));
            await loadSluzby();
            return;
          }

          appliedUpdates.push({ id: previousRow.id, previous: previousRow });
        }
      } else {
        const { error: deleteFunkcjeError } = await supabase
          .from('funkcje')
          .delete()
          .eq('sluzba_id', selectedSluzba.id);
        if (deleteFunkcjeError) {
          alert(buildSluzbaSaveErrorMessage('Nie udało się przygotować aktualizacji funkcji', deleteFunkcjeError));
          await loadSluzby();
          return;
        }

        const { error: insertFunkcjeError } = await supabase.from('funkcje').insert(funkcjeToInsert);
        if (insertFunkcjeError) {
          const { error: restoreSluzbaError } = await supabase
            .from('sluzby')
            .update(previousSluzbaSnapshot)
            .eq('id', selectedSluzba.id);

          let restoreFunkcjeError: { message?: string } | null = null;
          if (previousFunkcjeSnapshot.length > 0) {
            const restoreResult = await supabase.from('funkcje').insert(previousFunkcjeSnapshot);
            restoreFunkcjeError = restoreResult.error;
          }

          if (restoreSluzbaError || restoreFunkcjeError) {
            alert(
              `${buildSluzbaSaveErrorMessage('Nie udało się zapisać funkcji po edycji', insertFunkcjeError)} ` +
              `Dodatkowo nie udało się automatycznie przywrócić poprzedniego stanu.`
            );
          } else {
            alert(
              `${buildSluzbaSaveErrorMessage('Nie udało się zapisać funkcji po edycji', insertFunkcjeError)} ` +
              `Poprzedni stan wydarzenia został przywrócony.`
            );
          }
          await loadSluzby();
          return;
        }
      }
    } else {
      // Nowe wydarzenie
      const { data: newSluzba, error } = await supabase
        .from('sluzby')
        .insert({
          nazwa: cleanNazwa,
          data: sluzbaForm.data,
          godzina: cleanGodzina,
          parafia_id: currentUser.parafia_id,
          utworzono_przez: currentUser.id,
          status: 'zaplanowana',
          ekstra_punkty: sluzbaEkstraPunkty
        })
        .select()
        .single();

      if (error || !newSluzba) {
        alert('Błąd tworzenia wydarzenia!');
        return;
      }

      const funkcjeToInsert = buildFunkcjeRecords(
        newSluzba.id,
        cleanGodzina,
        sluzbaForm.funkcjePerHour,
        sluzbaExternalAssignments
      );
      const { error: insertFunkcjeError } = await supabase.from('funkcje').insert(funkcjeToInsert);
      if (insertFunkcjeError) {
        await supabase.from('sluzby').delete().eq('id', newSluzba.id);
        alert(buildSluzbaSaveErrorMessage('Nie udało się zapisać funkcji nowego wydarzenia', insertFunkcjeError));
        return;
      }

      if (currentParafia) {
        authFetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa: 'wszyscy',
            title: 'Nowe wydarzenie',
            body: `${cleanNazwa} — ${new Date(sluzbaForm.data).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} o ${cleanGodzina}`,
            url: '/app',
            kategoria: 'wydarzenie',
          }),
        }).catch(() => {});
      }
    }

    await loadSluzby();
    setShowSluzbaModal(false);
    setSluzbaValidationAttempted(false);
    setSelectedSluzba(null);
    setSluzbaForm({ nazwa: '', data: '', godzina: '', funkcjePerHour: {} });
    setSluzbaExternalAssignments({});
  };

  const resetZbiorkaFormState = () => {
    setSelectedZbiorka(null);
    setZbiorkaForm({
      data: '',
      godzina: '',
      miejsce: '',
      notatka: '',
      grupyDocelowe: [],
      punktyZaObecnosc: 10,
      punktyZaNieobecnosc: 10,
    });
    setZbiorkaAttendance({});
  };

  const getMinistranciByTargetGroups = (targetGroupsRaw: string[] | null | undefined) => {
    const allMinistranci = members.filter((m) => m.typ === 'ministrant' && m.zatwierdzony !== false);
    const selectedGroups = new Set((targetGroupsRaw || []).map((group) => group.trim()).filter(Boolean));
    return allMinistranci.filter((m) => selectedGroups.has((m.grupa || 'Bez grupy').trim()));
  };

  const applyZbiorkaRankingDelta = async ({
    ministrantId,
    delta,
    statusLabel,
    data,
    sluzbaId,
    nextPoints,
  }: {
    ministrantId: string;
    delta: number;
    statusLabel: string;
    data: string;
    sluzbaId: string;
    nextPoints: number;
  }) => {
    if (!currentUser?.parafia_id || delta === 0) return;
    const { data: existingRanking, error: rankingFetchError } = await supabase
      .from('ranking')
      .select('*')
      .eq('ministrant_id', ministrantId)
      .eq('parafia_id', currentUser.parafia_id)
      .maybeSingle();
    if (rankingFetchError) throw rankingFetchError;

    let rollbackRankingUpdate: (() => Promise<void>) | null = null;
    if (existingRanking) {
      const prevTotal = Number(existingRanking.total_pkt || 0);
      const prevRanga = existingRanking.ranga || 'Ready';
      const newTotal = Number(existingRanking.total_pkt || 0) + delta;
      const ranga = getRanga(newTotal);
      const { error: rankingUpdateError } = await supabase
        .from('ranking')
        .update({
          total_pkt: newTotal,
          ranga: ranga?.nazwa || existingRanking.ranga,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRanking.id);
      if (rankingUpdateError) throw rankingUpdateError;
      rollbackRankingUpdate = async () => {
        const { error: rollbackError } = await supabase
          .from('ranking')
          .update({
            total_pkt: prevTotal,
            ranga: prevRanga,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRanking.id);
        if (rollbackError) throw rollbackError;
      };
    } else {
      const ranga = getRanga(delta);
      const { data: insertedRankingRow, error: rankingInsertError } = await supabase
        .from('ranking')
        .insert({
          ministrant_id: ministrantId,
          parafia_id: currentUser.parafia_id,
          total_pkt: delta,
          total_obecnosci: 0,
          ranga: ranga?.nazwa || 'Ready',
        })
        .select('id')
        .single();
      if (rankingInsertError) throw rankingInsertError;
      rollbackRankingUpdate = async () => {
        const { error: rollbackError } = await supabase
          .from('ranking')
          .delete()
          .eq('id', insertedRankingRow.id);
        if (rollbackError) throw rollbackError;
      };
    }

    const historyMarker = buildZbiorkaHistoryMarker(sluzbaId, ministrantId);
    const historyPowod = `Zbiórka (${data}) — ${statusLabel} ${historyMarker}`.trim();

    const [markerHistoryResult, legacyHistoryResult] = await Promise.all([
      supabase
        .from('punkty_reczne')
        .select('id, ministrant_id, parafia_id, data, powod, punkty, created_at')
        .eq('ministrant_id', ministrantId)
        .eq('parafia_id', currentUser.parafia_id)
        .like('powod', `%${historyMarker}%`),
      supabase
        .from('punkty_reczne')
        .select('id, ministrant_id, parafia_id, data, powod, punkty, created_at')
        .eq('ministrant_id', ministrantId)
        .eq('parafia_id', currentUser.parafia_id)
        .eq('data', data)
        .ilike('powod', `Zbiórka (${data})%`)
        .not('powod', 'ilike', '%[zbiorka:%'),
    ]);

    if (markerHistoryResult.error || legacyHistoryResult.error) {
      if (rollbackRankingUpdate) {
        try {
          await rollbackRankingUpdate();
        } catch (rollbackError) {
          console.warn('Nie udało się cofnąć rankingu po błędzie odczytu historii zbiórki:', rollbackError);
        }
      }
      throw markerHistoryResult.error || legacyHistoryResult.error;
    }

    const historyRowsToReplace = [...(markerHistoryResult.data || []), ...(legacyHistoryResult.data || [])]
      .filter((row, index, arr) => arr.findIndex((candidate) => candidate.id === row.id) === index);
    const historyIdsToReplace = historyRowsToReplace.map((row) => row.id);

    if (historyIdsToReplace.length > 0) {
      const { error: deleteHistoryError } = await supabase
        .from('punkty_reczne')
        .delete()
        .in('id', historyIdsToReplace);
      if (deleteHistoryError) {
        if (rollbackRankingUpdate) {
          try {
            await rollbackRankingUpdate();
          } catch (rollbackError) {
            console.warn('Nie udało się cofnąć rankingu po błędzie czyszczenia historii zbiórki:', rollbackError);
          }
        }
        throw deleteHistoryError;
      }
    }

    if (nextPoints !== 0) {
      const { error: historiaError } = await supabase.from('punkty_reczne').insert({
        ministrant_id: ministrantId,
        parafia_id: currentUser.parafia_id,
        data,
        powod: historyPowod,
        punkty: nextPoints,
      });
      if (historiaError) {
        if (historyRowsToReplace.length > 0) {
          const { error: restoreHistoryError } = await supabase.from('punkty_reczne').insert(
            historyRowsToReplace.map((row) => ({
              id: row.id,
              ministrant_id: row.ministrant_id,
              parafia_id: row.parafia_id,
              data: row.data,
              powod: row.powod,
              punkty: row.punkty,
              created_at: row.created_at,
            }))
          );
          if (restoreHistoryError) {
            console.warn('Nie udało się przywrócić historii zbiórki po błędzie zapisu:', restoreHistoryError.message);
          }
        }
        if (rollbackRankingUpdate) {
          try {
            await rollbackRankingUpdate();
          } catch (rollbackError) {
            console.warn('Nie udało się cofnąć zmiany rankingu po błędzie zapisu historii zbiórki:', rollbackError);
          }
        }
        throw historiaError;
      }
    }
  };

  const openCreateZbiorkaModal = () => {
    setSelectedSluzba(null);
    resetZbiorkaFormState();
    setShowZbiorkaModal(true);
  };

  const openEditZbiorkaModal = async (sluzba: Sluzba) => {
    setSelectedSluzba(null);
    setSelectedZbiorka(sluzba);
    setZbiorkaForm({
      data: sluzba.data || '',
      godzina: sluzba.godzina || '',
      miejsce: sluzba.miejsce || '',
      notatka: sluzba.notatka || '',
      grupyDocelowe: [],
      punktyZaObecnosc: Math.max(0, Number(sluzba.punkty_za_obecnosc || 0)),
      punktyZaNieobecnosc: Math.abs(Number(sluzba.punkty_za_nieobecnosc || 0)),
    });

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from('zbiorka_obecnosci')
      .select('*')
      .eq('sluzba_id', sluzba.id);

    if (attendanceError) {
      alert(`Nie udało się otworzyć zbiórki: ${attendanceError.message}. Uruchom migrację add-zbiorka-panel.sql w Supabase.`);
      return;
    }

    const groupsFromAttendance = Array.from(new Set(
      (attendanceRows as ZbiorkaObecnosc[] || [])
        .map((row) => {
          const ministrant = members.find((member) => member.profile_id === row.ministrant_id);
          return (ministrant?.grupa || 'Bez grupy').trim();
        })
        .filter(Boolean)
    ));
    const storedGroups = Array.isArray(sluzba.grupy_docelowe)
      ? sluzba.grupy_docelowe.map((group) => (typeof group === 'string' ? group.trim() : '')).filter(Boolean)
      : [];
    setZbiorkaForm((prev) => ({
      ...prev,
      grupyDocelowe: storedGroups.length > 0 ? storedGroups : groupsFromAttendance,
    }));
    setZbiorkaAttendance({});
    setShowZbiorkaModal(true);
  };

  const openZbiorkaAttendanceModal = async (sluzba: Sluzba) => {
    if (!currentUser?.parafia_id) return;
    const targetMinistranci = getMinistranciByTargetGroups(sluzba.grupy_docelowe || []);
    if (targetMinistranci.length === 0) {
      alert('Ta zbiórka nie ma przypisanych ministrantów w wybranych grupach.');
      return;
    }

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from('zbiorka_obecnosci')
      .select('*')
      .eq('sluzba_id', sluzba.id);

    if (attendanceError) {
      alert(`Nie udało się otworzyć panelu obecności: ${attendanceError.message}. Uruchom migrację add-zbiorka-panel.sql w Supabase.`);
      return;
    }

    const existingAttendance = (attendanceRows as ZbiorkaObecnosc[] || []);
    const existingStatusByMinistrant = new Map(
      existingAttendance.map((row) => [row.ministrant_id, row.status])
    );
    const initialAttendance: Record<string, ZbiorkaObecnoscStatus> = {};
    targetMinistranci.forEach((ministrant) => {
      const existingStatus = existingStatusByMinistrant.get(ministrant.profile_id);
      if (existingStatus) {
        initialAttendance[ministrant.profile_id] = existingStatus;
      }
    });

    setSelectedZbiorkaAttendance(sluzba);
    setZbiorkaAttendance(initialAttendance);
    setShowZbiorkaAttendanceModal(true);
  };

  const handleSaveZbiorkaAttendance = async () => {
    if (!currentUser?.parafia_id || !selectedZbiorkaAttendance) return;

    const targetMinistranci = getMinistranciByTargetGroups(selectedZbiorkaAttendance.grupy_docelowe || []);
    if (targetMinistranci.length === 0) {
      alert('Brak ministrantów w wybranych grupach dla tej zbiórki.');
      return;
    }

    const punktyZaObecnosc = Math.max(0, Number(selectedZbiorkaAttendance.punkty_za_obecnosc || 0));
    const punktyZaNieobecnosc = -Math.abs(Number(selectedZbiorkaAttendance.punkty_za_nieobecnosc || 0));

    const statusToPoints = (status: ZbiorkaObecnoscStatus) => {
      if (status === 'obecny') return punktyZaObecnosc;
      if (status === 'nieobecny') return punktyZaNieobecnosc;
      return 0;
    };

    setZbiorkaAttendanceSaving(true);
    try {
      const { data: existingAttendanceData, error: existingAttendanceError } = await supabase
        .from('zbiorka_obecnosci')
        .select('*')
        .eq('sluzba_id', selectedZbiorkaAttendance.id);
      if (existingAttendanceError) {
        alert(`Nie udało się pobrać obecności: ${existingAttendanceError.message}`);
        return;
      }

      const existingAttendance = (existingAttendanceData || []) as ZbiorkaObecnosc[];
      const existingStatusByMinistrant = new Map(
        existingAttendance.map((row) => [row.ministrant_id, row.status])
      );

      const nextAttendanceRows = targetMinistranci
        .map((ministrant) => {
          const status = zbiorkaAttendance[ministrant.profile_id] || existingStatusByMinistrant.get(ministrant.profile_id) || null;
          if (!status) return null;
          return {
            sluzba_id: selectedZbiorkaAttendance.id,
            parafia_id: currentUser.parafia_id!,
            ministrant_id: ministrant.profile_id,
            status,
            punkty_przyznane: statusToPoints(status),
          };
        })
        .filter((row): row is {
          sluzba_id: string;
          parafia_id: string;
          ministrant_id: string;
          status: ZbiorkaObecnoscStatus;
          punkty_przyznane: number;
        } => row !== null);

      const { error: deleteAttendanceError } = await supabase
        .from('zbiorka_obecnosci')
        .delete()
        .eq('sluzba_id', selectedZbiorkaAttendance.id);
      if (deleteAttendanceError) {
        alert(`Nie udało się zaktualizować obecności: ${deleteAttendanceError.message}`);
        return;
      }

      const { error: insertAttendanceError } = await supabase
        .from('zbiorka_obecnosci')
        .insert(nextAttendanceRows);
      if (insertAttendanceError) {
        alert(`Nie udało się zapisać obecności: ${insertAttendanceError.message}`);
        return;
      }

      const existingPointsByMinistrant = new Map(existingAttendance.map((row) => [row.ministrant_id, Number(row.punkty_przyznane || 0)]));
      const nextPointsByMinistrant = new Map(nextAttendanceRows.map((row) => [row.ministrant_id, Number(row.punkty_przyznane || 0)]));
      const nextStatusByMinistrant = new Map(nextAttendanceRows.map((row) => [row.ministrant_id, row.status]));
      const allMinistrantIds = new Set<string>([
        ...existingPointsByMinistrant.keys(),
        ...nextPointsByMinistrant.keys(),
      ]);

      for (const ministrantId of allMinistrantIds) {
        const prevPoints = existingPointsByMinistrant.get(ministrantId) || 0;
        const nextPoints = nextPointsByMinistrant.get(ministrantId) || 0;
        const delta = nextPoints - prevPoints;
        if (delta === 0) continue;

        const status = nextStatusByMinistrant.get(ministrantId);
        const statusLabel = status ? `status: ${status}` : 'korekta listy';
        await applyZbiorkaRankingDelta({
          ministrantId,
          delta,
          statusLabel,
          data: selectedZbiorkaAttendance.data,
          sluzbaId: selectedZbiorkaAttendance.id,
          nextPoints,
        });
      }

      await Promise.all([
        loadSluzby(),
        loadRankingData(),
      ]);
      setShowZbiorkaAttendanceModal(false);
      setSelectedZbiorkaAttendance(null);
      setZbiorkaAttendance({});
    } catch (err) {
      alert('Nie udało się zapisać obecności: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setZbiorkaAttendanceSaving(false);
    }
  };

  const handleSaveZbiorka = async () => {
    if (!currentUser?.parafia_id || !currentUser?.id) return;
    if (!zbiorkaForm.data || !zbiorkaForm.godzina.trim()) {
      alert('Uzupełnij datę i godzinę zbiórki.');
      return;
    }

    if (zbiorkaForm.grupyDocelowe.length === 0) {
      alert('Wybierz przynajmniej jedną grupę na liście uczestników.');
      return;
    }

    const punktyZaObecnosc = Math.max(0, Number(zbiorkaForm.punktyZaObecnosc) || 0);
    const punktyZaNieobecnosc = -Math.abs(Number(zbiorkaForm.punktyZaNieobecnosc) || 0);
    const selectedGroups = Array.from(new Set(zbiorkaForm.grupyDocelowe.map((group) => group.trim()).filter(Boolean)));

    const buildZbiorkaSaveErrorMessage = (prefix: string, error: { message?: string } | null | undefined) => {
      const details = error?.message || 'Nieznany błąd';
      if (
        details.includes('zbiorka_obecnosci')
        || details.includes('grupy_docelowe')
        || details.includes('zbiorka_dla_wszystkich')
        || details.includes('punkty_za_obecnosc')
        || details.includes('punkty_za_nieobecnosc')
        || details.includes('miejsce')
        || details.includes('notatka')
        || details.includes('typ')
      ) {
        return `${prefix}: ${details}. W Supabase uruchom migrację add-zbiorka-panel.sql.`;
      }
      return `${prefix}: ${details}`;
    };

    setZbiorkaSaving(true);
    try {
      const payload = {
        nazwa: 'Zbiórka ministrantów',
        data: zbiorkaForm.data,
        godzina: zbiorkaForm.godzina,
        status: 'zaplanowana',
        typ: 'zbiorka',
        miejsce: zbiorkaForm.miejsce.trim() || null,
        notatka: zbiorkaForm.notatka.trim() || null,
        zbiorka_dla_wszystkich: false,
        grupy_docelowe: selectedGroups,
        punkty_za_obecnosc: punktyZaObecnosc,
        punkty_za_nieobecnosc: punktyZaNieobecnosc,
      };

      let sluzbaId = selectedZbiorka?.id || null;

      if (selectedZbiorka) {
        const { error: updateError } = await supabase
          .from('sluzby')
          .update(payload)
          .eq('id', selectedZbiorka.id)
          .eq('parafia_id', currentUser.parafia_id);
        if (updateError) {
          alert(buildZbiorkaSaveErrorMessage('Nie udało się zapisać zbiórki', updateError));
          return;
        }
      } else {
        const { data: createdSluzba, error: insertError } = await supabase
          .from('sluzby')
          .insert({
            ...payload,
            parafia_id: currentUser.parafia_id,
            utworzono_przez: currentUser.id,
          })
          .select('id')
          .single();
        if (insertError || !createdSluzba) {
          alert(buildZbiorkaSaveErrorMessage('Nie udało się utworzyć zbiórki', insertError));
          return;
        }
        sluzbaId = createdSluzba.id;
      }

      if (!sluzbaId) {
        alert('Brak identyfikatora zbiórki po zapisie.');
        return;
      }

      await loadSluzby();
      loadRankingData();
      setShowZbiorkaModal(false);
      resetZbiorkaFormState();
    } catch (err) {
      alert('Nie udało się zapisać zbiórki: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setZbiorkaSaving(false);
    }
  };

  const parseGodziny = (godzina: string): string[] => {
    const parts = godzina.split(',').map(g => g.trim()).filter(Boolean);
    return parts.length > 0 ? parts : [godzina];
  };

  const addDuplicateFunkcjaSlot = (hour: string, baseTyp: string) => {
    if (!isMultiAssigneeFunkcja(baseTyp)) return;
    setSluzbaForm((prev) => {
      const hourFunkcje = { ...(prev.funkcjePerHour[hour] || {}) };
      let maxSlot = 1;
      Object.keys(hourFunkcje).forEach((key) => {
        if (getFunkcjaBaseType(key) === baseTyp) {
          maxSlot = Math.max(maxSlot, getFunkcjaSlotNumber(key));
        }
      });
      const newKey = `${baseTyp}${FUNKCJA_DUP_SEPARATOR}${maxSlot + 1}`;
      hourFunkcje[newKey] = 'UNASSIGNED';
      return {
        ...prev,
        funkcjePerHour: {
          ...prev.funkcjePerHour,
          [hour]: hourFunkcje,
        },
      };
    });
  };

  const removeDuplicateFunkcjaSlot = (hour: string, key: string) => {
    const baseTyp = getFunkcjaBaseType(key);
    if (key === baseTyp) return;
    setSluzbaForm((prev) => {
      const hourFunkcje = { ...(prev.funkcjePerHour[hour] || {}) };
      delete hourFunkcje[key];
      return {
        ...prev,
        funkcjePerHour: {
          ...prev.funkcjePerHour,
          [hour]: hourFunkcje,
        },
      };
    });
    setSluzbaExternalAssignments((prev) => {
      const next = { ...prev };
      delete next[getExternalAssignmentKey(hour, key)];
      return next;
    });
  };

  const handleEditSluzba = (sluzba: Sluzba) => {
    if (sluzba.typ === 'zbiorka') {
      void openEditZbiorkaModal(sluzba);
      return;
    }

    setSelectedZbiorka(null);
    setSelectedSluzba(sluzba);
    const hours = parseGodziny(sluzba.godzina);
    const funkcjePerHour: FunkcjePerHourMap = {};
    const externalAssignments: Record<string, string> = {};
    const mapFunkcjeToHourAssignments = (funkcje: Funkcja[], hour: string): FunkcjaAssignmentMap => {
      const counts: Record<string, number> = {};
      const hourFunkcje: FunkcjaAssignmentMap = {};
      funkcje.forEach((f) => {
        const baseTyp = f.typ as string;
        const next = (counts[baseTyp] || 0) + 1;
        counts[baseTyp] = next;
        const key = next === 1 ? baseTyp : `${baseTyp}${FUNKCJA_DUP_SEPARATOR}${next}`;
        if (!f.aktywna) {
          hourFunkcje[key] = 'BEZ';
        } else if (f.ministrant_id) {
          hourFunkcje[key] = f.ministrant_id;
        } else if (f.osoba_zewnetrzna) {
          hourFunkcje[key] = EXTERNAL_ASSIGNMENT_VALUE;
          externalAssignments[getExternalAssignmentKey(hour, key)] = f.osoba_zewnetrzna;
        } else {
          hourFunkcje[key] = 'UNASSIGNED';
        }
      });
      return hourFunkcje;
    };

    if (hours.length > 1) {
      // Multi-hour event: group funkcje by godzina
      hours.forEach(h => {
        funkcjePerHour[h] = mapFunkcjeToHourAssignments(sluzba.funkcje.filter(f => f.godzina === h), h);
      });
    } else {
      // Single-hour: all funkcje go to that hour
      funkcjePerHour[hours[0]] = mapFunkcjeToHourAssignments(sluzba.funkcje, hours[0]);
    }

    setSluzbaForm({
      nazwa: sluzba.nazwa,
      data: sluzba.data,
      godzina: sluzba.godzina,
      funkcjePerHour,
    });
    setSluzbaValidationAttempted(false);
    setSluzbaExternalAssignments(externalAssignments);
    setSluzbaEkstraPunkty(sluzba.ekstra_punkty ?? null);
    setShowSluzbaModal(true);
  };

  const deleteSluzbaById = useCallback(async (sluzbaId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser?.parafia_id) {
      return { ok: false, error: 'Brak parafii użytkownika. Odśwież stronę i spróbuj ponownie.' };
    }

    const { data: directDeletedRows, error: directDeleteError } = await supabase
      .from('sluzby')
      .delete()
      .eq('id', sluzbaId)
      .eq('parafia_id', currentUser.parafia_id)
      .select('id');

    if (!directDeleteError && Array.isArray(directDeletedRows) && directDeletedRows.length > 0) {
      return { ok: true };
    }

    const response = await authFetch('/api/parafia/sluzby-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sluzbaId,
        parafiaId: currentUser.parafia_id,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      const fallbackError = typeof result?.error === 'string' ? result.error : 'Nie udało się usunąć wydarzenia.';
      if (directDeleteError) {
        return { ok: false, error: `${fallbackError} (${directDeleteError.message})` };
      }
      return { ok: false, error: fallbackError };
    }

    return { ok: true };
  }, [authFetch, currentUser?.parafia_id]);

  const handleDeleteSluzba = async () => {
    if (!selectedSluzba) return;
    const sluzbaId = selectedSluzba.id;

    if (deletingSluzbaIds.has(sluzbaId)) return;

    setDeletingSluzbaIds((prev) => {
      const next = new Set(prev);
      next.add(sluzbaId);
      return next;
    });

    try {
      const deletion = await deleteSluzbaById(sluzbaId);
      if (!deletion.ok) {
        alert(deletion.error || 'Nie udało się usunąć wydarzenia.');
        return;
      }

      await loadSluzby();
      setShowSluzbaModal(false);
      setSelectedSluzba(null);
    } finally {
      setDeletingSluzbaIds((prev) => {
        const next = new Set(prev);
        next.delete(sluzbaId);
        return next;
      });
    }
  };

  const handleDeleteSluzbaFromList = async (sluzba: Sluzba) => {
    if (!confirm(sluzba.typ === 'zbiorka' ? 'Czy na pewno chcesz usunąć tę zbiórkę?' : 'Czy na pewno chcesz usunąć to wydarzenie?')) return;
    if (deletingSluzbaIds.has(sluzba.id)) return;

    setDeletingSluzbaIds((prev) => {
      const next = new Set(prev);
      next.add(sluzba.id);
      return next;
    });

    try {
      const deletion = await deleteSluzbaById(sluzba.id);
      if (!deletion.ok) {
        alert(deletion.error || 'Nie udało się usunąć wydarzenia.');
        return;
      }

      if (selectedSluzba?.id === sluzba.id) {
        setShowSluzbaModal(false);
        setSelectedSluzba(null);
      }

      await loadSluzby();
    } finally {
      setDeletingSluzbaIds((prev) => {
        const next = new Set(prev);
        next.delete(sluzba.id);
        return next;
      });
    }
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

  const handleInlineFunkcjaAssignment = async (sluzbaId: string, funkcja: Funkcja, nextValue: string) => {
    if (!canManageEvents) return;

    let externalName: string | null = null;
    if (nextValue === EXTERNAL_ASSIGNMENT_VALUE) {
      const raw = window.prompt('Wpisz imię i nazwisko osoby z zewnątrz dla tej funkcji:', funkcja.osoba_zewnetrzna || '');
      if (raw === null) return;
      const trimmed = raw.trim();
      if (!trimmed) {
        alert('Wpisz imię i nazwisko osoby z zewnątrz.');
        return;
      }
      externalName = trimmed;
    }

    const nextAssignment: Pick<Funkcja, 'aktywna' | 'ministrant_id' | 'osoba_zewnetrzna' | 'zaakceptowana'> =
      nextValue === 'BEZ'
        ? { aktywna: false, ministrant_id: null, osoba_zewnetrzna: null, zaakceptowana: false }
        : nextValue === 'UNASSIGNED'
          ? { aktywna: true, ministrant_id: null, osoba_zewnetrzna: null, zaakceptowana: false }
          : nextValue === EXTERNAL_ASSIGNMENT_VALUE
            ? { aktywna: true, ministrant_id: null, osoba_zewnetrzna: externalName, zaakceptowana: false }
            : { aktywna: true, ministrant_id: nextValue, osoba_zewnetrzna: null, zaakceptowana: false };

    setSluzbaInlineSavingIds((prev) => {
      const next = new Set(prev);
      next.add(funkcja.id);
      return next;
    });

    const { error } = await supabase
      .from('funkcje')
      .update(nextAssignment)
      .eq('id', funkcja.id)
      .eq('sluzba_id', sluzbaId);

    if (error) {
      alert('Nie udało się zapisać funkcji: ' + error.message);
      setSluzbaInlineSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(funkcja.id);
        return next;
      });
      return;
    }

    setSluzby((prev) => prev.map((sl) => {
      if (sl.id !== sluzbaId) return sl;
      return {
        ...sl,
        funkcje: sl.funkcje.map((f) => (f.id === funkcja.id ? { ...f, ...nextAssignment } : f)),
      };
    }));

    setSluzbaInlineSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(funkcja.id);
      return next;
    });
  };

  // ==================== MINISTRANCI ====================

  const handleUpdatePoslugi = async () => {
    if (!selectedMember) return;

    const { error } = await supabase
      .from('parafia_members')
      .update({ role: normalizeMemberRoles(selectedMember.role) })
      .eq('id', selectedMember.id);

    if (error) {
      alert('Błąd zapisu posług: ' + error.message);
      return;
    }

    await loadParafiaData();
    setShowPoslugiModal(false);
    setSelectedMember(null);
  };

  useEffect(() => {
    if (!permissionsMemberId) {
      setFullConfigAccessDraft(false);
      setFullConfigWithRankingApprovalsDraft(false);
      return;
    }

    const hasFullConfig = hasFullConfigurationPermissions(permissionsDraft);
    setFullConfigAccessDraft(hasFullConfig);
    setFullConfigWithRankingApprovalsDraft(
      hasFullConfig && permissionsDraft.includes(RANKING_APPROVAL_PERMISSION_KEY)
    );
  }, [permissionsMemberId, permissionsDraft]);

  const handleSelectPermissionsMember = (member: Member) => {
    setPermissionsMemberId(member.id);
    setPermissionsDraft(getAssignedPermissionKeys(member.role));
    setAdminSearchMinistrant('');
  };

  const handleToggleFullConfigAccessDraft = (checked: boolean) => {
    if (checked) {
      setPermissionsDraft(buildFullConfigurationPermissions(fullConfigWithRankingApprovalsDraft));
      return;
    }
    setPermissionsDraft([]);
  };

  const handleToggleFullConfigRankingApprovalsDraft = (checked: boolean) => {
    setFullConfigWithRankingApprovalsDraft(checked);
    if (!fullConfigAccessDraft) return;
    setPermissionsDraft(buildFullConfigurationPermissions(checked));
  };

  const saveMemberPermissions = async (memberId: string, permissions: ParishPermissionKey[]) => {
    if (!currentUser?.parafia_id) {
      alert('Brak aktywnej parafii.');
      return false;
    }
    if (!memberId) {
      alert('Wybierz ministranta.');
      return false;
    }

    const uniquePermissions = Array.from(new Set(permissions));

    setAdminRoleSavingIds((prev) => {
      const next = new Set(prev);
      next.add(memberId);
      return next;
    });

    try {
      const res = await authFetch('/api/parafia/admin-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          parafiaId: currentUser.parafia_id,
          permissions: uniquePermissions,
        }),
      });
      const result = await res.json().catch(() => ({}));
      const applyMemberRolesToState = (nextRolesInput: string[] | null | undefined) => {
        const nextRoles = normalizeMemberRoles(nextRolesInput);
        const nextPermissionKeys = getAssignedPermissionKeys(nextRoles);
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: nextRoles } : m)));
        if (selectedMember?.id === memberId) {
          setSelectedMember((prev) => (prev ? { ...prev, role: nextRoles } : prev));
        }
        if (permissionsMemberId === memberId) {
          setPermissionsDraft(nextPermissionKeys);
        }
      };

      if (!res.ok || !result?.ok) {
        // Fallback: gdy token auth nie dotrze do endpointu, spróbuj bezpośredniego zapisu przez Supabase.
        if (res.status === 401 || res.status === 403) {
          const targetMember = members.find((m) => m.id === memberId);
          const currentRoles = normalizeMemberRoles(targetMember?.role);
          const baseRoles = currentRoles.filter(
            (role) => role !== PARISH_ADMIN_ROLE && !role.startsWith(PARISH_PERMISSION_PREFIX)
          );
          const permissionRoles = uniquePermissions.map((permission) => `${PARISH_PERMISSION_PREFIX}${permission}`);
          const directRolesPayload = normalizeMemberRoles([...baseRoles, ...permissionRoles]);

          const { data: directUpdated, error: directError } = await supabase
            .from('parafia_members')
            .update({ role: directRolesPayload })
            .eq('id', memberId)
            .eq('parafia_id', currentUser.parafia_id)
            .select('id, role')
            .single();

          if (!directError && directUpdated) {
            applyMemberRolesToState(directUpdated.role);
            return true;
          }
        }

        alert('Nie udało się zapisać uprawnień: ' + (result?.error || 'Błąd serwera'));
        return false;
      }

      applyMemberRolesToState(result.member?.role);
      return true;
    } finally {
      setAdminRoleSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const handleSaveMemberPermissions = async () => {
    if (!permissionsMemberId) {
      alert('Wybierz ministranta.');
      return;
    }
    const ok = await saveMemberPermissions(permissionsMemberId, permissionsDraft);
    if (ok) alert('Uprawnienia zostały zapisane.');
  };

  const handleRemoveFullConfigAccessForMember = async (member: Member) => {
    const currentPermissions = getAssignedPermissionKeys(member.role);
    const nextPermissions = currentPermissions.filter(
      (permission) => permission !== RANKING_APPROVAL_PERMISSION_KEY && !FULL_CONFIGURATION_PERMISSION_KEYS.includes(permission)
    );
    const ok = await saveMemberPermissions(member.id, nextPermissions);
    if (ok) {
      if (permissionsMemberId === member.id) {
        setPermissionsMemberId('');
        setPermissionsDraft([]);
        setFullConfigAccessDraft(false);
        setFullConfigWithRankingApprovalsDraft(false);
      }
      alert(`Usunięto pełny dostęp: ${member.imie} ${member.nazwisko || ''}`.trim());
    }
  };

  const handleAssignPermissionForPermissionCard = async (permission: ParishPermissionKey) => {
    const memberId = permissionAssignDraft[permission];
    if (!memberId) {
      alert('Wybierz ministranta do przypisania.');
      return;
    }
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      alert('Nie znaleziono ministranta.');
      return;
    }
    const currentPermissions = getAssignedPermissionKeys(member.role);
    if (currentPermissions.includes(permission)) {
      alert('Ten ministrant ma już to uprawnienie.');
      return;
    }
    const ok = await saveMemberPermissions(memberId, [...currentPermissions, permission]);
    if (!ok) return;
    setPermissionAssignDraft((prev) => ({ ...prev, [permission]: '' }));
  };

  const handleRemovePermissionForPermissionCard = async (permission: ParishPermissionKey, member: Member) => {
    const nextPermissions = getAssignedPermissionKeys(member.role).filter((item) => item !== permission);
    await saveMemberPermissions(member.id, nextPermissions);
  };

  const manageParafiaMember = async (
    payload: { action: 'approve' | 'setGroup' | 'reject'; memberId: string; grupa?: string | null }
  ): Promise<{ ok: true; member?: Partial<Member> } | { ok: false; error: string }> => {
    if (!currentUser?.parafia_id) {
      return { ok: false, error: 'Brak aktywnej parafii.' };
    }

    try {
      const res = await authFetch('/api/parafia/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          parafiaId: currentUser.parafia_id,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.ok) {
        return { ok: false, error: result?.error || 'Błąd serwera' };
      }
      return { ok: true, member: result?.member as Partial<Member> | undefined };
    } catch {
      return { ok: false, error: 'Błąd połączenia z serwerem' };
    }
  };

  const handleUpdateGrupa = async (grupa: GrupaType) => {
    if (!selectedMember) return;

    const result = await manageParafiaMember({
      action: 'setGroup',
      memberId: selectedMember.id,
      grupa,
    });
    if (!result.ok) {
      alert('Nie udało się przypisać grupy: ' + result.error);
      return;
    }

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
    if (!currentUser?.parafia_id) return false;
    try {
      const res = await authFetch('/api/parafia/funkcje-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parafiaId: currentUser.parafia_id,
          funkcjeConfig: newFunkcje,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.ok) {
        alert('Nie udało się zapisać funkcji: ' + (result?.error || 'Błąd serwera'));
        await loadParafiaData();
        return false;
      }
      return true;
    } catch {
      alert('Nie udało się zapisać funkcji: błąd połączenia z serwerem.');
      await loadParafiaData();
      return false;
    }
  };

  const handleAddFunkcja = async () => {
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
    const ok = await saveFunkcjeConfigToDb(updated);
    if (!ok) return;
    setFunkcjeConfig(updated);
    setNewFunkcjaForm({ nazwa: '', opis: '' });
  };

  const handleDeleteFunkcja = async (id: string) => {
    const updated = funkcjeConfig.filter(f => f.id !== id);
    const ok = await saveFunkcjeConfigToDb(updated);
    if (!ok) return;
    setFunkcjeConfig(updated);
  };

  const handleMoveFunkcja = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= funkcjeConfig.length) return;
    const updated = [...funkcjeConfig];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    const ok = await saveFunkcjeConfigToDb(updated);
    if (!ok) return;
    setFunkcjeConfig(updated);
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
    const ok = await saveFunkcjeConfigToDb(updated);
    if (!ok) return;
    setFunkcjeConfig(updated);
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
    const emojiToSave = canEditPoslugaEmoji ? newPoslugaForm.emoji : '⭐';

    const { error } = await supabase.from('poslugi').insert({
      id: tempId,
      parafia_id: currentUser.parafia_id,
      slug,
      nazwa: newPoslugaForm.nazwa,
      opis: newPoslugaForm.opis,
      emoji: emojiToSave,
      kolor: newPoslugaForm.kolor,
      obrazek_url: null,
      kolejnosc: poslugi.length,
      dlugi_opis: poslugaEditor?.getHTML() || '',
      zdjecia: [],
      youtube_url: newPoslugaForm.youtube_url || '',
    });

    if (error) {
      alert('Błąd dodawania posługi: ' + error.message);
      return;
    }

    await loadPoslugi();
    if (poslugaEditor) poslugaEditor.commands.clearContent();
    setNewPoslugaForm({ nazwa: '', opis: '', emoji: '⭐', kolor: 'gray', dlugi_opis: '', youtube_url: '' });
    setShowAddPoslugaModal(false);
  };

  const handleUpdatePoslugaDetails = async () => {
    if (!editingPosluga) return;
    const emojiToSave = canEditPoslugaEmoji ? editingPosluga.emoji : (poslugi.find((p) => p.id === editingPosluga.id)?.emoji || editingPosluga.emoji);

    const { error } = await supabase
      .from('poslugi')
      .update({
        nazwa: editingPosluga.nazwa,
        opis: editingPosluga.opis,
        emoji: emojiToSave,
        kolor: editingPosluga.kolor,
        obrazek_url: editingPosluga.obrazek_url || null,
        dlugi_opis: poslugaEditor?.getHTML() || editingPosluga.dlugi_opis || '',
        zdjecia: editingPosluga.zdjecia || [],
        youtube_url: editingPosluga.youtube_url || '',
      })
      .eq('id', editingPosluga.id);

    if (error) {
      alert('Błąd aktualizacji: ' + error.message);
      return;
    }

    await loadPoslugi();
    setEditingPosluga(null);
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
      return <div className="tiptap-content text-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(text) }} />;
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
        authFetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa,
            title: kategoria === 'ogłoszenie' ? 'Nowe ogłoszenie' : 'Nowa dyskusja',
            body: finalTytul,
            url: '/app',
            kategoria,
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
        authFetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parafia_id: currentParafia.id,
            grupa_docelowa: 'wszyscy',
            title: obowiazkowa ? 'Nowa ankieta (obowiązkowa)' : 'Nowa ankieta',
            body: pytanie.trim(),
            url: '/app',
            kategoria: 'ankieta',
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
    if (!currentUser || !selectedWatek) return;
    if (selectedWatek.kategoria === 'ogłoszenie') return;
    const body = newWiadomoscTresc.trim();
    if (!body) return;
    const { error } = await supabase.from('tablica_wiadomosci').insert({
      watek_id: selectedWatek.id,
      autor_id: currentUser.id,
      tresc: buildWiadomoscReplyPayload(body, replyToMessageId),
    });
    if (error) { alert('Błąd: ' + error.message); return; }
    setNewWiadomoscTresc('');
    setReplyToMessageId(null);
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

  const openWatek = useCallback((watek: TablicaWatek) => {
    setSelectedWatek(watek);
    loadWatekWiadomosci(watek.id);
    markWatekLocallyRead(watek.id);
    const ankietaDlaWatku = ankiety.find(a => a.watek_id === watek.id);
    const powiadomieniaDoOznaczenia = powiadomienia.filter((p) => {
      if (p.przeczytane) return false;
      if (p.odniesienie_id === watek.id) return true;
      if (ankietaDlaWatku && p.odniesienie_id === ankietaDlaWatku.id) return true;
      return false;
    });
    powiadomieniaDoOznaczenia.forEach((p) => {
      markPowiadomienieRead(p.id);
    });
  }, [ankiety, loadWatekWiadomosci, markWatekLocallyRead, powiadomienia]);

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
      await authFetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, subscription: subscription.toJSON() }),
      });
    } catch {
      // Push not supported in this browser — ignore silently
    }
  }, [authFetch, currentUser?.id]);

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
      if (gd === 'ksieza' && !canManageNews) return false;
      if (gd === 'ministranci' && currentUser?.typ !== 'ministrant') return false;
      return true;
    });
  }, [tablicaWatki, currentUser?.typ, canManageNews]);

  // ==================== RENDERY ====================

  const getMemberName = (id: string | null, externalName?: string | null) => {
    if (externalName?.trim()) return externalName.trim();
    if (!id) return '';
    if (id === currentUser?.id) return 'Ty';
    const member = members.find(m => m.profile_id === id);
    return member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '';
  };

  const isSluzbaAssignedToMe = (sluzba: Sluzba) => {
    if (sluzba.typ === 'zbiorka') {
      const myGroup = (members.find((member) => member.profile_id === currentUser?.id)?.grupa || 'Bez grupy').trim();
      const targetGroups = Array.isArray(sluzba.grupy_docelowe)
        ? sluzba.grupy_docelowe.map((group) => (typeof group === 'string' ? group.trim() : '')).filter(Boolean)
        : [];
      if (targetGroups.length > 0) {
        return targetGroups.includes(myGroup);
      }
      const attendance = zbiorkaAssignmentsBySluzba[sluzba.id] || [];
      return attendance.some((row) => row.ministrant_id === currentUser?.id);
    }
    return sluzba.funkcje.some(f => f.ministrant_id === currentUser?.id);
  };

  const getMyFunkcje = (sluzba: Sluzba) => {
    if (sluzba.typ === 'zbiorka') return [];
    return sluzba.funkcje.filter(f => f.ministrant_id === currentUser?.id && f.aktywna);
  };

  const hasUnacceptedFunkcje = (sluzba: Sluzba) => {
    if (sluzba.typ === 'zbiorka') return false;
    return sluzba.funkcje.some(f => f.ministrant_id === currentUser?.id && !f.zaakceptowana && f.aktywna);
  };

  const zbiorkaHeaderTone = (() => {
    const toneMap: Record<string, { title: string; description: string }> = {
      zielony: {
        title: 'bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent',
        description: 'text-emerald-700/80 dark:text-emerald-300/80',
      },
      bialy: {
        title: 'bg-gradient-to-r from-amber-700 to-yellow-600 dark:from-amber-300 dark:to-yellow-300 bg-clip-text text-transparent',
        description: 'text-amber-700/80 dark:text-amber-300/80',
      },
      czerwony: {
        title: 'bg-gradient-to-r from-red-700 to-rose-600 dark:from-red-300 dark:to-rose-300 bg-clip-text text-transparent',
        description: 'text-red-700/80 dark:text-red-300/80',
      },
      fioletowy: {
        title: 'bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-300 dark:to-purple-300 bg-clip-text text-transparent',
        description: 'text-violet-700/80 dark:text-violet-300/80',
      },
      rozowy: {
        title: 'bg-gradient-to-r from-pink-700 to-rose-600 dark:from-pink-300 dark:to-rose-300 bg-clip-text text-transparent',
        description: 'text-pink-700/80 dark:text-pink-300/80',
      },
      zloty: {
        title: 'bg-gradient-to-r from-yellow-700 to-amber-600 dark:from-yellow-300 dark:to-amber-300 bg-clip-text text-transparent',
        description: 'text-yellow-700/80 dark:text-yellow-300/80',
      },
      niebieski: {
        title: 'bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent',
        description: 'text-blue-700/80 dark:text-blue-300/80',
      },
      czarny: {
        title: 'bg-gradient-to-r from-gray-800 to-slate-700 dark:from-gray-200 dark:to-slate-200 bg-clip-text text-transparent',
        description: 'text-gray-600 dark:text-gray-300',
      },
    };

    return toneMap[dzisLiturgiczny?.kolor || 'zielony'] || toneMap.zielony;
  })();

  const shouldForceMobileUpdate = isAndroidAppContext && (
    androidAppVersionCode === null || androidAppVersionCode < MIN_REQUIRED_ANDROID_APP_VERSION_CODE
  );

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

  if (shouldForceMobileUpdate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-amber-200 dark:border-amber-800">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-amber-700 dark:text-amber-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Wymagana aktualizacja aplikacji</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Ta wersja aplikacji mobilnej jest już nieaktualna. Aby kontynuować, zaktualizuj aplikację w Google Play.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {androidAppVersionCode !== null
                  ? `Wykryta wersja: ${androidAppVersionCode} • wymagane minimum: ${MIN_REQUIRED_ANDROID_APP_VERSION_CODE}`
                  : `Nie udało się odczytać wersji aplikacji • wymagane minimum: ${MIN_REQUIRED_ANDROID_APP_VERSION_CODE}`}
              </div>
              <div className="pt-2 grid gap-2">
                <Button
                  onClick={() => { window.location.href = ANDROID_PLAY_STORE_URL; }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Zaktualizuj w Google Play
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Sprawdź ponownie po aktualizacji
                </Button>
              </div>
            </CardContent>
          </Card>
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
              <img
                src={darkMode ? '/logo/mark-white.svg' : '/logo/mark-dark.svg'}
                alt="Logo Ministranci"
                className="w-12 h-12"
              />
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
      <div className="auth-screen min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, #050510 0%, #080a19 56%, #0b1020 100%)' }}>
        {/* Tło dekoracyjne */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-22%] left-[-14%] w-[620px] h-[620px] rounded-full opacity-[0.20]" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.46) 0%, transparent 72%)' }} />
          <div className="absolute bottom-[-18%] right-[-9%] w-[520px] h-[520px] rounded-full opacity-[0.16]" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 72%)' }} />
          <div className="absolute top-[14%] right-[24%] w-[360px] h-[360px] rounded-full opacity-[0.11]" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.24) 0%, transparent 74%)' }} />
          <div className="absolute bottom-[8%] left-[16%] w-[300px] h-[300px] rounded-full opacity-[0.10]" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 74%)' }} />
          <div className="absolute top-[10%] right-[15%] w-1 h-1 bg-amber-300/35 rounded-full" />
          <div className="absolute top-[25%] left-[20%] w-0.5 h-0.5 bg-amber-200/30 rounded-full" />
          <div className="absolute bottom-[30%] left-[10%] w-1.5 h-1.5 bg-violet-300/20 rounded-full" />
        </div>

        <div className="w-full max-w-[420px] relative z-10">
          {/* Logo i nagłówek */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 8px 32px rgba(245,158,11,0.28)' }}>
              <img src="/logo/mark-white.svg" alt="Logo Ministranci" className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">
              {authMode === 'login' && 'Witaj ponownie'}
              {authMode === 'register' && 'Dołącz do nas'}
              {authMode === 'forgot' && 'Resetowanie hasła'}
              {authMode === 'reset-sent' && 'Sprawdź skrzynkę'}
              {authMode === 'email-sent' && 'Sprawdź skrzynkę'}
            </h1>
            <p className="text-slate-400 text-sm">
              {authMode === 'login' && 'Zaloguj się do swojego konta'}
              {authMode === 'register' && 'Utwórz nowe konto w aplikacji'}
              {authMode === 'forgot' && 'Wyślemy Ci link do zresetowania hasła'}
              {authMode === 'reset-sent' && 'Link do resetowania hasła został wysłany'}
              {authMode === 'email-sent' && 'Potwierdź rejestrację konta'}
            </p>
          </div>

          {/* Karta formularza */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 sm:p-8" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-400/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />
            <div className="pointer-events-none absolute left-1/3 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-violet-300/8 blur-3xl" />
            <div className="relative z-10">

            {/* Błąd ogólny */}
            {authErrors.general && (
              <div className="flex items-start gap-3 p-3 rounded-xl mb-5 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-red-400" />
                </div>
                <p className="text-sm text-red-300 leading-relaxed">{authErrors.general}</p>
              </div>
            )}

            {/* ===== EKRAN: POTWIERDZENIE EMAIL (KSIĄDZ) ===== */}
            {authMode === 'email-sent' ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Mail className="w-7 h-7 text-amber-300" />
                </div>
                <p className="text-slate-200 font-semibold text-lg mb-1">Potwierdź swój adres e-mail</p>
                <p className="text-amber-300 font-medium mb-4">{email}</p>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Wysłaliśmy wiadomość z linkiem potwierdzającym na Twój adres e-mail.
                  Kliknij link w wiadomości, aby aktywować konto księdza.
                </p>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Jeśli nie widzisz wiadomości, sprawdź folder spam.
                </p>
                <button
                  onClick={() => { setAuthMode('login'); setIsLogin(true); setAuthErrors({}); }}
                  className="text-sm text-amber-300 hover:text-amber-200 transition-colors font-medium"
                >
                  Wróć do logowania
                </button>
              </div>
            ) : authMode === 'reset-sent' ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <Mail className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-slate-300 text-sm mb-1">Wiadomość została wysłana na adres:</p>
                <p className="text-amber-300 font-medium mb-6">{email}</p>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Kliknij link w wiadomości e-mail, aby ustawić nowe hasło. Jeśli nie widzisz wiadomości, sprawdź folder spam.
                </p>
                <button
                  onClick={() => { setAuthMode('login'); setIsLogin(true); setAuthErrors({}); }}
                  className="text-sm text-amber-300 hover:text-amber-200 transition-colors font-medium"
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
                          : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/20'
                      }`}
                    />
                  </div>
                  {authErrors.email && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.email}</p>}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}
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
                          : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/20'
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
                          : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/20'
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
                      className="text-xs text-amber-300/80 hover:text-amber-200 transition-colors"
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
                              : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/20'
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
                              : 'border border-white/[0.08] bg-white/[0.03] focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/20'
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
                          onClick={() => { setUserType('ministrant'); setDiecezja(''); setDekanat(''); setDiecezjaSearch(''); setAuthErrors(prev => ({ ...prev, diecezja: undefined, dekanat: undefined })); }}
                          className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            userType === 'ministrant'
                              ? 'border-amber-300/45 bg-amber-300/10 text-amber-200'
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
                              ? 'border-amber-300/45 bg-amber-300/10 text-amber-200'
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
                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.06] outline-none focus:border-amber-300/40"
                                  />
                                </div>
                              </div>

                              {/* Lista diecezji */}
                              <div className="max-h-[200px] overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(245,158,11,0.35) transparent' }}>
                                {DIECEZJE_POLSKIE
                                  .filter(d => d.toLowerCase().includes(diecezjaSearch.toLowerCase()))
                                  .map(d => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => {
                                        setDiecezja(d);
                                        setDekanat('');
                                        setDiecezjaOpen(false);
                                        setDiecezjaSearch('');
                                        setAuthErrors(prev => ({ ...prev, diecezja: undefined, dekanat: undefined }));
                                      }}
                                      className={`w-full px-4 py-2.5 text-xs text-left transition-colors flex items-center gap-2 ${
                                        d === diecezja
                                          ? 'bg-amber-300/10 text-amber-200'
                                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                                      }`}
                                    >
                                      {d === diecezja && <Check className="w-3 h-3 text-amber-300 shrink-0" />}
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

                    {/* Dekanat — pojawia się po wyborze diecezji (ksiądz) */}
                    {userType === 'ksiadz' && diecezja && DEKANATY[diecezja] && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Dekanat</label>
                        <div className="relative" ref={dekanatRef}>
                          <button
                            type="button"
                            onClick={() => setDekanatOpen(!dekanatOpen)}
                            className={`w-full px-4 py-3 rounded-xl text-sm text-left outline-none transition-all duration-200 flex items-center justify-between ${
                              authErrors.dekanat
                                ? 'border border-red-500/50 bg-red-500/5'
                                : 'border border-white/[0.08] bg-white/[0.03]'
                            } ${dekanat ? 'text-slate-200' : 'text-slate-500'}`}
                          >
                            <span className="truncate">{dekanat || 'Wybierz dekanat...'}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 ml-2 transition-transform duration-200 ${dekanatOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {dekanatOpen && (
                            <div
                              className="absolute z-50 bottom-full left-0 right-0 mb-2 rounded-xl border border-white/[0.1] overflow-hidden"
                              style={{ background: '#0f0f1e', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                            >
                              <div className="p-2 border-b border-white/[0.06]">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                  <input
                                    type="text"
                                    value={dekanatSearch}
                                    onChange={(e) => setDekanatSearch(e.target.value)}
                                    placeholder="Szukaj dekanatu..."
                                    autoFocus
                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.06] outline-none focus:border-amber-300/40"
                                  />
                                </div>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(245,158,11,0.35) transparent' }}>
                                {(DEKANATY[diecezja] || [])
                                  .filter(d => d.toLowerCase().includes(dekanatSearch.toLowerCase()))
                                  .map(d => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => {
                                        setDekanat(d);
                                        setDekanatOpen(false);
                                        setDekanatSearch('');
                                        setAuthErrors(prev => ({ ...prev, dekanat: undefined }));
                                      }}
                                      className={`w-full px-4 py-2.5 text-xs text-left transition-colors flex items-center gap-2 ${
                                        d === dekanat
                                          ? 'bg-amber-300/10 text-amber-200'
                                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                                      }`}
                                    >
                                      {d === dekanat && <Check className="w-3 h-3 text-amber-300 shrink-0" />}
                                      <span className={d === dekanat ? '' : 'ml-5'}>{d}</span>
                                    </button>
                                  ))
                                }
                                {(DEKANATY[diecezja] || []).filter(d => d.toLowerCase().includes(dekanatSearch.toLowerCase())).length === 0 && (
                                  <p className="px-4 py-3 text-xs text-slate-600 text-center">Nie znaleziono dekanatu</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {authErrors.dekanat && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{authErrors.dekanat}</p>}
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
                          className="w-[18px] h-[18px] rounded border border-white/[0.15] bg-white/[0.03] flex items-center justify-center cursor-pointer transition-all peer-checked:bg-amber-300/20 peer-checked:border-amber-300/55"
                        >
                          {acceptedTerms && <Check className="w-3 h-3 text-amber-300" />}
                        </label>
                      </div>
                      <label htmlFor="terms-auth" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                        Akceptuję{' '}
                        <a href="/regulamin" target="_blank" className="text-amber-300/80 hover:text-amber-200 underline underline-offset-2 transition-colors">regulamin</a>
                        {' '}i{' '}
                        <a href="/polityka-prywatnosci" target="_blank" className="text-amber-300/80 hover:text-amber-200 underline underline-offset-2 transition-colors">politykę prywatności</a>
                      </label>
                    </div>
                  </>
                )}

                {/* Przycisk główny */}
                <button
                  onClick={handleAuth}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 hover:brightness-110 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLogin ? 'Zaloguj się' : 'Utwórz konto'}
                </button>

                {showGoogleAuthButton && (
                  <>
                    {/* Separator */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.06]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 text-xs text-slate-500 bg-[#0b0f1d]">lub</span>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleAuth}
                      disabled={authLoading}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-slate-100 transition-all duration-200 disabled:opacity-50 border border-white/[0.14] bg-white/[0.04] hover:bg-white/[0.07] flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.5 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z" />
                          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 34.8 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
                          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.5-2.4 4.6-4.6 6l.1-.1 6.3 5.3C36.7 39.6 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
                        </svg>
                      )}
                      Kontynuuj z Google
                    </button>
                  </>
                )}

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
                      className="text-amber-300 hover:text-amber-200 font-medium transition-colors"
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
              <img
                src={darkMode ? '/logo/mark-white.svg' : '/logo/mark-dark.svg'}
                alt="Logo Ministranci"
                className="w-6 h-6 sm:w-8 sm:h-8 shrink-0"
              />
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

            {currentUser.typ !== 'ksiadz' && (
              <Card className="border-sky-200/70 dark:border-sky-900/40 bg-sky-50/50 dark:bg-sky-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    Nie masz kodu od księdza?
                  </CardTitle>
                  <CardDescription>
                    Zachęć księdza, aby wdrożył aplikację w parafii. Po założeniu parafii otrzymasz kod i dołączysz od razu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Powiedz księdzu, że znalazłeś fajną aplikację dla ministrantów, która pomaga ogarniać służby,
                    ogłoszenia i grafik w parafii.
                  </p>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Pokaż księdzu stronę aplikacji
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal tworzenia parafii */}
        <Dialog open={showParafiaModal} onOpenChange={setShowParafiaModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Church className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {parafiaNazwa || 'Nowa parafia'}
              </DialogTitle>
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
              <div className="pt-2 border-t">
                <Label>Kod rabatowy (opcjonalnie)</Label>
                <Input
                  value={parafiaKodRabatowy}
                  onChange={(e) => setParafiaKodRabatowy(e.target.value)}
                  placeholder="np. WIOSNA25"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jeśli posiadasz kod rabatowy, wpisz go tutaj aby aktywować Premium
                </p>
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

  // ==================== EKRAN OCZEKIWANIA NA ZATWIERDZENIE ====================

  if (currentUser.typ === 'ministrant' && currentParafiaMember && currentParafiaMember.zatwierdzony === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="shadow-xl border-amber-200 dark:border-amber-800">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto text-3xl">
                ⏳
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Oczekiwanie na zatwierdzenie</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Twoje konto zostało zgłoszone do parafii <strong>{currentParafia?.nazwa}</strong>. Ksiądz musi zatwierdzić Twoje konto, zanim uzyskasz dostęp do aplikacji.
              </p>
              <div className="pt-2 flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Odśwież
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Wyloguj
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==================== GŁÓWNY INTERFEJS ====================

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2.5 py-2 sm:px-4 sm:py-3">
          {/* Linia 1: nazwa parafii na całą szerokość */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => { if (!editingParafiaNazwa) { setActiveTab('tablica'); setSelectedWatek(null); setTablicaWiadomosci([]); setEditingAnkietaId(null); setShowArchiwum(false); } }}>
            <img
              src={darkMode ? '/logo/mark-white.svg' : '/logo/mark-dark.svg'}
              alt="Logo Ministranci"
              className="w-6 h-6 sm:w-8 sm:h-8 shrink-0"
            />
            {editingParafiaNazwa ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={parafiaNazwaInput}
                  onChange={(e) => setParafiaNazwaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveParafiaNazwa(); if (e.key === 'Escape') setEditingParafiaNazwa(false); }}
                  className="h-8 text-sm sm:text-lg font-bold w-36 sm:w-60"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 dark:text-green-400 shrink-0" onClick={saveParafiaNazwa}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 shrink-0" onClick={() => setEditingParafiaNazwa(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-sm sm:text-xl font-bold truncate max-w-[70vw] sm:max-w-[56vw]">
                  {currentParafia?.nazwa}
                </h1>
                {currentUser.typ === 'ksiadz' && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0 text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={(e) => { e.stopPropagation(); setParafiaNazwaInput(currentParafia?.nazwa || ''); setEditingParafiaNazwa(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* Linia 2: imię/nazwisko + ikonki */}
          <div className="flex items-center justify-between mt-1">
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
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {canManagePremium && (() => {
                const count = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length;
                const isPremium = !!subscription;
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPremiumModal(true); }}
                    title={isPremium ? `Premium aktywne${premiumDaysLeft !== null ? `, zostało ${premiumDaysLeft} dni` : ''}` : `${count}/${DARMOWY_LIMIT_MINISTRANTOW} ministrantów`}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isPremium ? (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] sm:text-xs font-semibold text-amber-500">
                          {premiumDaysLeft !== null ? `${premiumDaysLeft} dni` : 'Premium'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-[3px]">
                          {Array.from({ length: DARMOWY_LIMIT_MINISTRANTOW }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 sm:w-2.5 h-4 sm:h-5 rounded-sm transition-all ${
                                i < count
                                  ? count >= DARMOWY_LIMIT_MINISTRANTOW
                                    ? 'bg-red-400 dark:bg-red-500'
                                    : count >= DARMOWY_LIMIT_MINISTRANTOW - 1
                                      ? 'bg-amber-400 dark:bg-amber-500'
                                      : 'bg-indigo-400 dark:bg-indigo-500'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-medium ${
                          count >= DARMOWY_LIMIT_MINISTRANTOW
                            ? 'text-red-500'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {count}/{DARMOWY_LIMIT_MINISTRANTOW}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })()}
              {currentUser.typ === 'ksiadz' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Usuń parafię"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteParafiaModal(1);
                  }}
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              {adminImpersonationSession && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopAdminImpersonation}
                  disabled={adminImpersonationStopping}
                  className="h-9 px-2 sm:px-3 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                >
                  {adminImpersonationStopping ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Shield className="w-4 h-4 sm:mr-2" />}
                  <span className="hidden sm:inline">Wyjdź z trybu admina</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="h-9 w-9 p-0">
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 px-2 sm:px-3">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Wyloguj</span>
              </Button>
            </div>
          </div>

          {adminImpersonationSession && (
            <div className="mt-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs text-amber-900 dark:text-amber-100">
              Tryb admina aktywny: działasz jako {adminImpersonationSession.impersonated_typ === 'ksiadz' ? 'ksiądz' : 'ministrant'}
              {' '}w parafii <span className="font-semibold">{adminImpersonationSession.target_parafia_nazwa || currentParafia?.nazwa || adminImpersonationSession.target_parafia_id}</span>.
            </div>
          )}

          {/* Linia 2: kod zaproszenia + kopiuj + QR */}
          {canManageInvites && currentParafia && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">Kod zaproszenia:</span>
              <code className="text-xs md:text-sm font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded tracking-wider break-all">
                {currentParafia.kod_zaproszenia}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(currentParafia.kod_zaproszenia);
                  alert('Kod skopiowany!');
                }}
                title="Kopiuj kod"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setShowQrModal(true)}
                title="Pokaż kod QR"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Modal QR Code */}
          <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
            <DialogContent className="w-[calc(100%-1rem)] max-w-3xl max-h-[90dvh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>Kod QR zaproszenia</DialogTitle>
                <DialogDescription>
                  Gotowy plakat do wydruku dla ministrantów
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                <div
                  ref={qrPosterRef}
                  className="mx-auto w-full max-w-[760px] rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-gray-900 shadow-xl overflow-hidden"
                >
                  <div className="rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-5 py-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-90">Służba Liturgiczna</p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">Dołącz do ministrantów</h2>
                    <p className="mt-2 text-sm sm:text-base text-emerald-50">
                      Zeskanuj kod QR i dołącz do parafialnej grupy w aplikacji.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="space-y-3">
                      <p className="text-base sm:text-lg font-semibold">
                        To zajmie mniej niż minutę:
                      </p>
                      <div className="space-y-2 text-sm sm:text-base leading-relaxed text-gray-700">
                        <p>1. Otwórz aparat lub aplikację do skanowania QR.</p>
                        <p>2. Zeskanuj kod z plakatu.</p>
                        <p>3. Załóż konto i dołącz do parafii.</p>
                      </div>
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-emerald-700 font-bold">Kod zaproszenia</p>
                        <p className="mt-1 text-2xl sm:text-3xl font-black tracking-[0.18em] text-emerald-900">
                          {currentParafia?.kod_zaproszenia}
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-emerald-800">
                          Parafia: <span className="font-semibold">{currentParafia?.nazwa || 'Twoja parafia'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mx-auto w-full max-w-[240px]">
                      <div className="rounded-2xl border-4 border-emerald-100 bg-white p-4 shadow-md w-full">
                        <QRCodeSVG
                          value={`https://www.ministranci.net/join?kod=${encodeURIComponent(currentParafia?.kod_zaproszenia || '')}`}
                          size={240}
                          level="H"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-2">
                <Button
                  type="button"
                  onClick={handleDownloadQrPosterPdf}
                  disabled={qrPdfLoading}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {qrPdfLoading ? 'Generowanie PDF...' : 'Pobierz plakat PDF'}
                </Button>
              </DialogFooter>
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
            zloty: { bg: 'bg-amber-500', text: 'text-white' },
            niebieski: { bg: 'bg-blue-600', text: 'text-white' },
            czarny: { bg: 'bg-gray-900', text: 'text-white' },
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
      <div className="max-w-7xl mx-auto px-2.5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4 sm:py-6 overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {(() => {
            const litColor = dzisLiturgiczny ? ({
              zielony: { list: 'bg-white dark:bg-gray-900', trigger: 'text-green-700 dark:text-green-400 data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900/40 data-[state=active]:text-green-900 dark:data-[state=active]:text-green-200 data-[state=active]:border-green-300 dark:data-[state=active]:border-green-700 [&_svg]:text-green-600 dark:[&_svg]:text-green-400' },
              bialy: { list: 'bg-white dark:bg-gray-900', trigger: 'text-amber-700 dark:text-amber-400 data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-200 data-[state=active]:border-amber-300 dark:data-[state=active]:border-amber-700 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400' },
              czerwony: { list: 'bg-white dark:bg-gray-900', trigger: 'text-red-700 dark:text-red-400 data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/40 data-[state=active]:text-red-900 dark:data-[state=active]:text-red-200 data-[state=active]:border-red-300 dark:data-[state=active]:border-red-700 [&_svg]:text-red-600 dark:[&_svg]:text-red-400' },
              fioletowy: { list: 'bg-white dark:bg-gray-900', trigger: 'text-purple-700 dark:text-purple-400 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/40 data-[state=active]:text-purple-900 dark:data-[state=active]:text-purple-200 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-700 [&_svg]:text-purple-600 dark:[&_svg]:text-purple-400' },
              rozowy: { list: 'bg-white dark:bg-gray-900', trigger: 'text-pink-600 dark:text-pink-400 data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/40 data-[state=active]:text-pink-900 dark:data-[state=active]:text-pink-200 data-[state=active]:border-pink-300 dark:data-[state=active]:border-pink-700 [&_svg]:text-pink-500 dark:[&_svg]:text-pink-400' },
              zloty: { list: 'bg-white dark:bg-gray-900', trigger: 'text-amber-700 dark:text-amber-400 data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-200 data-[state=active]:border-amber-300 dark:data-[state=active]:border-amber-700 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400' },
              niebieski: { list: 'bg-white dark:bg-gray-900', trigger: 'text-blue-700 dark:text-blue-400 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-900 dark:data-[state=active]:text-blue-200 data-[state=active]:border-blue-300 dark:data-[state=active]:border-blue-700 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400' },
              czarny: { list: 'bg-white dark:bg-gray-900', trigger: 'text-gray-800 dark:text-gray-200 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:border-gray-400 dark:data-[state=active]:border-gray-600 [&_svg]:text-gray-700 dark:[&_svg]:text-gray-300' },
            } as Record<string, { list: string; trigger: string }>)[dzisLiturgiczny.kolor] || { list: 'bg-white dark:bg-gray-900', trigger: 'text-green-700 dark:text-green-400' } : { list: 'bg-muted', trigger: '' };
            const tc = litColor.trigger;
            return (
            <TabsList className={`grid w-full grid-cols-4 md:grid-cols-8 mb-3 sm:mb-6 ${litColor.list}`}>
              <TabsTrigger value="tablica" className={`relative ${tc}`} onClick={() => { setSelectedWatek(null); setTablicaWiadomosci([]); setEditingAnkietaId(null); setShowArchiwum(false); }}>
                <MessageSquare className="w-4 h-4 sm:mr-2" />
                Aktualności
                {nieprzeczytanePowiadomienia > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {nieprzeczytanePowiadomienia}
                  </span>
                )}
              </TabsTrigger>
              {canManageMembers && (
                <TabsTrigger value="ministranci" className={`${tc} relative`}>
                  <Users className="w-4 h-4 sm:mr-2" />
                  Ministranci
                  <span className="ml-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-1.5">{members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length}</span>
                  {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
                      {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="ranking" className={`${tc} relative`}>
                <Trophy className="w-4 h-4 sm:mr-2" />
                Ranking
                {canApproveRankingSubmissions && obecnosci.filter(o => o.status === 'oczekuje').length > 0 && (
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
                  {canUseMinistrantTablica && (() => {
                    const litGradient: Record<string, { gradient: string; shadow: string; subtitle: string }> = {
                      zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20', subtitle: 'text-emerald-200' },
                      bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20', subtitle: 'text-amber-100' },
                      czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20', subtitle: 'text-red-200' },
                      fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20', subtitle: 'text-purple-200' },
                      rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20', subtitle: 'text-pink-200' },
                      zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20', subtitle: 'text-amber-100' },
                      niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', shadow: 'shadow-blue-500/20', subtitle: 'text-blue-100' },
                      czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', shadow: 'shadow-gray-500/20', subtitle: 'text-gray-200' },
                    };
                    const litStyle = litGradient[dzisLiturgiczny?.kolor || 'zielony'] || litGradient.zielony;
                    return (
                      <>
                        <Button onClick={() => setShowZglosModal(true)} className="w-full h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 text-white shadow-xl shadow-blue-500/25 font-extrabold text-lg rounded-xl">
                          <Plus className="w-5 h-5 mr-2" />
                          Zgłoś obecność
                        </Button>
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
                            <Button size="sm" onClick={() => {
                              setNewWatekForm({ tytul: '', tresc: '', kategoria: 'dyskusja', grupa_docelowa: 'wszyscy', archiwum_data: '' });
                              setShowNewWatekModal(true);
                            }} className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-none">
                              <Plus className="w-4 h-4 mr-1" />
                              Dyskusja
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  {canManageNews && (
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40" onClick={() => setShowNewAnkietaModal(true)}>
                        Dodaj ankietę
                      </Button>
                      <Button size="sm" variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40" onClick={() => {
                        setNewWatekForm({ tytul: '', tresc: '', kategoria: 'ogłoszenie', grupa_docelowa: 'wszyscy', archiwum_data: '' });
                        setShowNewWatekModal(true);
                      }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Ogłoszenie
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => {
                        setNewWatekForm({ tytul: '', tresc: '', kategoria: 'dyskusja', grupa_docelowa: 'wszyscy', archiwum_data: '' });
                        setShowNewWatekModal(true);
                      }}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Dyskusja
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowArchiwum(true)}>
                        <Book className="w-4 h-4 mr-1" />
                        Archiwum ({archiwalneWatki.length + sluzbyArchiwum.length})
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Baner informacyjny */}
              {!selectedWatek && showInfoBanner && infoBanerReady && infoBanerEnabled && (
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
                              openWatek(watek);
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
                const wiadomoscById = new Map(tablicaWiadomosci.map((m) => [m.id, m]));
                const replyTarget = replyToMessageId ? wiadomoscById.get(replyToMessageId) || null : null;
                const replyTargetParsed = replyTarget ? parseWiadomoscReply(replyTarget.tresc) : null;
                const replyTargetAutor = replyTarget ? members.find((m) => m.profile_id === replyTarget.autor_id) : null;

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
                              Termin przeniesienia do archiwum: {selectedWatek.archiwum_data ? new Date(selectedWatek.archiwum_data).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'bez terminu'}
                            </p>
                          </div>
                          {canManageNews && watekAnkieta && (
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
                            {canManageNews && editingAnkietaId !== watekAnkieta.id && (
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
                          {canManageNews && editingAnkietaId === watekAnkieta.id && (
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
                          {canUseMinistrantTablica && (() => {
                            const juzOdpowiedzial = mojeOdpowiedzi.length > 0;
                            const pokazWyniki = juzOdpowiedzial && !watekAnkieta.wyniki_ukryte;
                            const totalMinistranci = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length;
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
                          {canManageNews && editingAnkietaId !== watekAnkieta.id && (() => {
                            const totalMinistranci = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length;
                            const respondenci = new Set(wszystkieOdpowiedzi.map(o => o.respondent_id));
                            const brakOdpowiedzi = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false && !respondenci.has(m.profile_id));
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

                    {selectedWatek.kategoria === 'ogłoszenie' ? (
                      <Card className="border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
                        <CardContent className="py-3">
                          <p className="text-sm text-teal-800 dark:text-teal-200">
                            To ogłoszenie jest tylko do odczytu. Komentarze są wyłączone.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Wiadomości w wątku */}
                        <div className="space-y-2">
                          {tablicaWiadomosci.length > 0 && (
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Komentarze ({tablicaWiadomosci.length})</p>
                          )}
                          {tablicaWiadomosci.map(msg => {
                            const autor = members.find(m => m.profile_id === msg.autor_id);
                            const { replyToId, body } = parseWiadomoscReply(msg.tresc);
                            const repliedMsg = replyToId ? wiadomoscById.get(replyToId) : undefined;
                            const repliedAutor = repliedMsg ? members.find(m => m.profile_id === repliedMsg.autor_id) : null;
                            const repliedBody = repliedMsg ? parseWiadomoscReply(repliedMsg.tresc).body : '';
                            const isReplyTarget = replyToMessageId === msg.id;
                            return (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-lg ${msg.autor_id === currentUser.id ? 'bg-indigo-100 dark:bg-indigo-900/30 ml-4 sm:ml-8' : 'bg-white dark:bg-gray-800 border mr-4 sm:mr-8'} ${isReplyTarget ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold">{msg.autor_id === currentUser.id ? 'Ty' : (autor ? `${autor.imie} ${autor.nazwisko || ''}`.trim() : 'Ksiądz')}</span>
                                  <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {replyToId && (
                                  <div className="mb-2 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-900/20 p-2">
                                    <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                                      Odpowiedź na: {repliedAutor ? `${repliedAutor.imie} ${repliedAutor.nazwisko || ''}`.trim() : 'wiadomość'}
                                    </p>
                                    <p className="text-xs text-indigo-900/80 dark:text-indigo-200/90 break-words">
                                      {repliedMsg ? truncateReplyPreview(repliedBody) : 'Wiadomość, do której odnosi się odpowiedź, nie jest już dostępna.'}
                                    </p>
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{body}</p>
                                {!selectedWatek.zamkniety && (
                                  <div className="mt-2 flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        setReplyToMessageId(msg.id);
                                        setShowEmojiPicker(null);
                                        setTimeout(() => wiadomoscInputRef.current?.focus(), 0);
                                      }}
                                    >
                                      <Reply className="w-3.5 h-3.5 mr-1" />
                                      Odpowiedz
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Pole do pisania wiadomości */}
                        {!selectedWatek.zamkniety && (
                          <div className="relative">
                            {replyToMessageId && (
                              <div className="mb-2 flex items-start justify-between gap-2 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                                    Odpowiadasz: {replyTargetAutor ? `${replyTargetAutor.imie} ${replyTargetAutor.nazwisko || ''}`.trim() : 'wiadomość'}
                                  </p>
                                  <p className="text-xs text-indigo-900/80 dark:text-indigo-200/90 break-words">
                                    {replyTargetParsed ? truncateReplyPreview(replyTargetParsed.body) : 'Wiadomość, do której chcesz odpowiedzieć, nie jest już dostępna.'}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                  onClick={() => setReplyToMessageId(null)}
                                  title="Anuluj odpowiedź"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 flex-shrink-0" onClick={() => setShowEmojiPicker(showEmojiPicker === 'wiadomosc' ? null : 'wiadomosc')}>
                                <Smile className="w-4 h-4 text-gray-400" />
                              </Button>
                              <Input
                                ref={wiadomoscInputRef}
                                placeholder="Napisz komentarz..."
                                value={newWiadomoscTresc}
                                onChange={(e) => setNewWiadomoscTresc(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendWiadomosc(); } }}
                              />
                              <Button onClick={sendWiadomosc} disabled={!newWiadomoscTresc.trim()}>
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                            <LazyEmojiPicker
                              open={showEmojiPicker === 'wiadomosc'}
                              className="absolute bottom-12 left-0 z-50"
                              locale="pl"
                              theme={darkMode ? 'dark' : 'light'}
                              onSelect={(emoji) => { setNewWiadomoscTresc(prev => prev + emoji.native); setShowEmojiPicker(null); }}
                            />
                          </div>
                        )}
                        {selectedWatek.zamkniety && (
                          <p className="text-center text-sm text-gray-400 py-2">Wątek zamknięty — brak możliwości komentowania</p>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* === LISTA WĄTKÓW === */}
              {!selectedWatek && (() => {
                const now = new Date();
                const aktywneWatki = tablicaWatki.filter(w => {
                  const gd = w.grupa_docelowa;
                  if (gd === 'ksieza' && !canManageNews) return false;
                  if (gd === 'ministranci' && currentUser.typ !== 'ministrant') return false;
                  if (w.archiwum_data && new Date(w.archiwum_data) <= now) return false;
                  return true;
                });
                const filtrowaneWatki = aktywneWatki.filter((w) => (
                  tablicaCategoryFilter === 'wszystkie' || w.kategoria === tablicaCategoryFilter
                ));
                const uporzadkowaneWatki = tablicaCategoryFilter === 'ogłoszenie'
                  ? [
                      ...filtrowaneWatki.filter((w) => w.kategoria === 'ogłoszenie' && w.tytul?.startsWith('[ADMIN]')),
                      ...filtrowaneWatki.filter((w) => !(w.kategoria === 'ogłoszenie' && w.tytul?.startsWith('[ADMIN]'))),
                    ]
                  : filtrowaneWatki;

                return (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5">
                    {[
                      { key: 'wszystkie', label: 'Wszystkie' },
                      { key: 'ogłoszenie', label: 'Ogłoszenia' },
                      { key: 'dyskusja', label: 'Dyskusje' },
                      { key: 'ankieta', label: 'Ankiety' },
                    ].map((f) => {
                      const active = tablicaCategoryFilter === f.key;
                      return (
                        <Button
                          key={f.key}
                          type="button"
                          size="sm"
                          variant="ghost"
                          className={`h-7 rounded-full px-2.5 text-[11px] ${active ? 'bg-gray-200/80 text-gray-900 dark:bg-gray-700/80 dark:text-gray-100' : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200'}`}
                          onClick={() => setTablicaCategoryFilter(f.key as 'wszystkie' | 'ogłoszenie' | 'dyskusja' | 'ankieta')}
                        >
                          {f.label}
                        </Button>
                      );
                    })}
                  </div>
                  {uporzadkowaneWatki.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {tablicaCategoryFilter === 'wszystkie' ? 'Brak aktualności' : 'Brak wpisów dla wybranego filtra'}
                        </p>
                        {canManageNews && tablicaCategoryFilter === 'wszystkie' && <p className="text-sm text-gray-400 mt-1">Utwórz pierwszy wątek lub ankietę!</p>}
                      </CardContent>
                    </Card>
                  ) : (
                    uporzadkowaneWatki.map(watek => {
                      const watekAnkieta = ankiety.find(a => a.watek_id === watek.id);
                      const autorWatku = members.find(m => m.profile_id === watek.autor_id);
                      const mojaOdp = watekAnkieta ? ankietyOdpowiedzi.some(o => o.ankieta_id === watekAnkieta.id && o.respondent_id === currentUser.id) : false;

                      return (
                        <Card
                          key={watek.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${watek.kategoria === 'ankieta' ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : watek.kategoria === 'ogłoszenie' ? 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20' : watek.przypiety ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : ''}`}
                          onClick={() => {
                            if (watek.kategoria === 'ogłoszenie' && canManageNews) {
                              setPreviewOgloszenie(watek);
                              return;
                            }
                            openWatek(watek);
                          }}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {watek.przypiety && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                                  <Badge variant={watek.kategoria === 'ankieta' ? 'destructive' : 'secondary'} className={`text-xs ${watek.kategoria === 'ogłoszenie' ? 'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600' : ''}`}>
                                    {watek.kategoria === 'ogłoszenie' ? 'Ogłoszenie' : watek.kategoria === 'ankieta' ? 'Ankieta' : 'Dyskusja'}
                                  </Badge>
                                  {watek.kategoria === 'dyskusja' && (watekUnreadCounts[watek.id] || 0) > 0 && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {watekUnreadCounts[watek.id]}
                                    </Badge>
                                  )}
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
                              <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-1 min-w-0">
                                {/* Ankiety — oryginalne przyciski bez zmian */}
                                {canManageNews && watekAnkieta && (
                                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-wrap items-center justify-end gap-1">
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
                                        openWatek(watek);
                                      }}
                                    >
                                      Szczegóły
                                    </Button>
                                  </div>
                                )}
                                {/* Ogłoszenia */}
                                {canManageNews && !watekAnkieta && watek.kategoria === 'ogłoszenie' && (
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
                                        <div className="flex flex-wrap items-center justify-end gap-1">
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
                                {canManageNews && !watekAnkieta && watek.kategoria === 'dyskusja' && (
                                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-wrap items-center justify-end gap-1">
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
                                      className="h-7 w-full text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950 dark:hover:border-indigo-600"
                                      onClick={() => {
                                        openWatek(watek);
                                      }}
                                    >
                                      Szczegóły
                                    </Button>
                                  </div>
                                )}
                                {canUseMinistrantTablica && watekAnkieta && !mojaOdp && watekAnkieta.aktywna && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">Odpowiedz!</Badge>
                                )}
                                {canUseMinistrantTablica && watekAnkieta && mojaOdp && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            </div>
                            {watekAnkieta && (() => {
                              const opcje = ankietyOpcje.filter(o => o.ankieta_id === watekAnkieta.id).sort((a, b) => a.kolejnosc - b.kolejnosc);
                              const odpowiedzi = ankietyOdpowiedzi.filter(o => o.ankieta_id === watekAnkieta.id);
                              const unikatoweOsoby = new Set(odpowiedzi.map(o => o.respondent_id)).size;
                              const pokazWyniki = canManageNews || (!watekAnkieta.wyniki_ukryte && mojaOdp);
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
              {currentUser?.typ === 'ministrant' && canApproveRankingSubmissions && pendingObecnosci.length > 0 && (
                <PendingObecnosciCard
                  pendingObecnosci={pendingObecnosci}
                  memberByProfileId={memberByProfileId}
                  approvedDyzuryKeySet={approvedDyzuryKeySet}
                  approvingObecnosciIds={approvingObecnosciIds}
                  rejectingObecnosciIds={rejectingObecnosciIds}
                  bulkApprovingObecnosci={bulkApprovingObecnosci}
                  onApprove={(id) => { void handleApproveObecnosc(id); }}
                  onApproveWithCustomPoints={handleApproveObecnoscWithCustomPoints}
                  onReject={(id) => { void handleRejectObecnosc(id); }}
                  onApproveAll={() => { void zatwierdzWszystkie(); }}
                />
              )}

              {showPriestRankingInfo && (
                <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
                          <p className="font-semibold">Po co jest ranking?</p>
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            Ranking zbiera punkty za obecność i zaangażowanie ministrantów. Pomaga motywować, doceniać regularność i sprawiedliwie prowadzić formację.
                          </p>
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            W tym panelu możesz m.in. ustawiać punktację, zarządzać rangami i odznakami, zatwierdzać zgłoszenia obecności oraz podglądać statystyki parafii.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowPriestRankingInfo(false)}>
                          Ukryj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowPriestRankingInfo(false);
                            setHidePriestRankingInfoPermanently(true);
                            if (typeof window !== 'undefined' && priestRankingInfoStorageKey) {
                              writeLocalStorage(priestRankingInfoStorageKey, 'true');
                            }
                          }}
                        >
                          Nie pokazuj więcej
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* === WIDOK MINISTRANTA === */}
              {canUseMinistrantRanking && (() => {
                const myRanking = rankingData.find(r => r.ministrant_id === currentUser.id);
                const totalPkt = myRanking ? Number(myRanking.total_pkt) : 0;
                const currentRanga = getRanga(totalPkt);
                const nextRanga = getNextRanga(totalPkt);
                const myObecnosci = obecnosci.filter(o => o.ministrant_id === currentUser.id);
                const myDyzury = dyzury.filter(d => d.ministrant_id === currentUser.id);
                const myPunktyReczne = punktyReczne.filter(p => p.ministrant_id === currentUser.id);
                const myOdznaki = odznakiZdobyte.filter(o => o.ministrant_id === currentUser.id);
                const myMinusowe = minusowePunkty.filter(m => m.ministrant_id === currentUser.id);
                const totalMinusowe = myMinusowe.reduce((sum, m) => sum + Number(m.punkty), 0);
                const approvedObecnosci = myObecnosci.filter((o) => o.status === 'zatwierdzona');
                const punktyZeSluzby = approvedObecnosci
                  .filter((o) => o.typ !== 'aktywnosc')
                  .reduce((sum, o) => sum + Number(o.punkty_finalne || 0), 0);
                const punktyZAktywnosci = approvedObecnosci
                  .filter((o) => o.typ === 'aktywnosc')
                  .reduce((sum, o) => sum + Number(o.punkty_finalne || 0), 0);
                const punktyZKorekt = myPunktyReczne.reduce((sum, p) => sum + Number(p.punkty || 0), 0);
                const punktyZAktywnosciLacznie = punktyZAktywnosci + punktyZKorekt;
                const myPosition = rankingData.findIndex(r => r.ministrant_id === currentUser.id) + 1;
                const myMember = members.find(m => m.profile_id === currentUser.id);
                const myGrupa = myMember?.grupa ? grupy.find(g => g.id === myMember.grupa) : null;
                const historiaMisji = [
                  ...myObecnosci.map((o) => ({ kind: 'obecnosc' as const, id: o.id, createdAt: `${o.data}T00:00:00`, obec: o })),
                  ...myPunktyReczne.map((p) => ({ kind: 'korekta' as const, id: p.id, createdAt: p.created_at || `${p.data}T00:00:00`, korekta: p })),
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                return (
                  <div className="space-y-5">
                    {/* Przyciski akcji */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Button onClick={() => setShowZglosModal(true)} className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 font-bold">
                          <Plus className="w-4 h-4 mr-2" />
                          Zgłoś obecność
                        </Button>
                        <Button
                          onClick={() => {
                            if (!aktywnoscZgloszeniaWlaczone) return;
                            setShowAktywnoscModal(true);
                          }}
                          variant="outline"
                          disabled={!aktywnoscZgloszeniaWlaczone}
                          className={aktywnoscZgloszeniaWlaczone
                            ? 'w-full border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-400 dark:border-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:bg-cyan-900/40 font-bold'
                            : 'w-full border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400 font-bold cursor-not-allowed'}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {aktywnoscZgloszeniaWlaczone ? 'Zgłoś aktywność' : 'Zgłoszenia aktywności wyłączone'}
                        </Button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button onClick={() => setShowDyzuryModal(true)} className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 hover:from-teal-600 hover:via-cyan-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/20 font-bold">
                          <Clock className="w-4 h-4 mr-2" />
                          Moje dyżury
                        </Button>
                        {myDyzury.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {myDyzury.map(d => (
                              <span key={d.id} className={`px-2 py-0.5 rounded text-xs font-medium ${d.status === 'oczekuje' ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300' : 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'}`}>
                                {d.status === 'oczekuje' ? '⏳ ' : ''}
                                {DNI_TYGODNIA_FULL[d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1]}
                                {d.godzina?.trim() ? ` • ${d.godzina.trim()}` : ''}
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                          {[
                            { icon: <Calendar className="w-4 h-4" />, val: `+${punktyZeSluzby}`, label: 'Punkty służba' },
                            { icon: <Sparkles className="w-4 h-4" />, val: `${punktyZAktywnosciLacznie > 0 ? '+' : ''}${punktyZAktywnosciLacznie}`, label: 'Punkty aktywności' },
                            { icon: <Target className="w-4 h-4" />, val: `-${Math.abs(totalMinusowe)}`, label: 'Minusowe punkty' },
                          ].map((s, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                              <div className="flex items-center justify-center mb-0.5 opacity-80">{s.icon}</div>
                              <div className="font-extrabold text-sm tabular-nums">{s.val}</div>
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
                        {historiaMisji.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Brak misji. Zacznij służyć i zdobywaj XP!</p>
                        ) : (
                          <div className="space-y-1.5">
                            {(showAllZgloszenia ? historiaMisji : historiaMisji.slice(0, 3)).map((item) => {
                              if (item.kind === 'obecnosc') {
                                const o = item.obec;
                                const d = new Date(`${o.data}T00:00:00`);
                                const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
                                const isDyzur = myDyzury.some(dy => dy.dzien_tygodnia === d.getDay() && dy.status === 'zatwierdzona');
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
                                      {o.typ === 'wydarzenie' && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-[10px] font-medium text-amber-600 dark:text-amber-400">⭐ {o.nazwa_nabożeństwa}</span>
                                      )}
                                      {o.typ === 'aktywnosc' && (
                                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-[10px] font-medium text-cyan-700 dark:text-cyan-300 truncate max-w-[180px]">
                                          Aktywność: {o.nazwa_nabożeństwa || '—'}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`font-extrabold text-sm tabular-nums ${o.status === 'zatwierdzona' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                      {o.status === 'zatwierdzona' ? `+${o.punkty_finalne}` : o.status === 'oczekuje' ? '...' : 'X'}
                                    </span>
                                  </div>
                                );
                              }

                              const p = item.korekta;
                              const d = new Date(`${p.data}T00:00:00`);
                              const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
                              const isPlus = Number(p.punkty) > 0;
                              const cleanedPowod = cleanHistoriaPowod(p.powod);
                              const powodLabel = cleanedPowod && cleanedPowod !== 'Ręczna korekta punktów'
                                ? cleanedPowod
                                : '';
                              return (
                                <div key={p.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border ${isPlus ? 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'}`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isPlus ? 'bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.5)]' : 'bg-red-500'}`} />
                                    <span className="text-xs sm:text-sm truncate font-medium">
                                      {dayName} {d.toLocaleDateString('pl-PL')}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPlus ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                      Ksiądz
                                    </span>
                                    {powodLabel && <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 truncate">{powodLabel}</span>}
                                  </div>
                                  <span className={`font-extrabold text-sm tabular-nums ${isPlus ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isPlus ? `+${p.punkty}` : p.punkty}
                                  </span>
                                </div>
                              );
                            })}
                            {historiaMisji.length > 3 && (
                              <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 mt-1" onClick={() => setShowAllZgloszenia(!showAllZgloszenia)}>
                                {showAllZgloszenia ? <><ChevronUp className="w-3 h-3 mr-1" /> Zwiń</> : <><ChevronDown className="w-3 h-3 mr-1" /> Pokaż wszystkie ({historiaMisji.length})</>}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* === MINUSOWE PUNKTY === */}
                    {myMinusowe.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border border-red-200 dark:border-red-800">
                        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5">
                          <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><Target className="w-4 h-4" /> Minusowe punkty</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-3 space-y-1.5">
                          {myMinusowe.map((m) => {
                            const cleanedPowod = cleanHistoriaPowod(m.powod);
                            const powodDisplay = cleanedPowod || m.powod || 'Brak opisu';
                            return (
                              <div key={m.id} className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                                <span className="text-sm">{new Date(m.data).toLocaleDateString('pl-PL')} — {powodDisplay}</span>
                                <span className="font-extrabold text-red-600 dark:text-red-400 tabular-nums">{m.punkty}</span>
                              </div>
                            );
                          })}
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
              {canManageRanking && (
                <div className="space-y-6">
                  {canManageRankingSettings && (
                    <RankingSettingsPanel
                      showRankingSettings={showRankingSettings}
                      onToggleShowRankingSettings={() => setShowRankingSettings(!showRankingSettings)}
                      onOpenResetPunktacja={() => setShowResetPunktacjaModal(true)}
                      punktacjaConfig={punktacjaConfig}
                      rangiConfig={rangiConfig}
                      odznakiConfig={odznakiConfig}
                      rankingSettingsTab={rankingSettingsTab}
                      onChangeRankingSettingsTab={setRankingSettingsTab}
                      onInitRankingConfig={initRankingConfig}
                      punktacjaDraftDirty={punktacjaDraftDirty}
                      punktacjaSaving={punktacjaSaving}
                      onSavePunktacjaDraft={savePunktacjaDraft}
                      onMutatePunktacjaConfig={setPunktacjaConfig}
                      onUpdateConfigOpis={updateConfigOpis}
                      getPunktacjaValue={getPunktacjaValue}
                      onSetPunktacjaDraftValue={(id, value) => setPunktacjaDraft((prev) => ({ ...prev, [id]: value }))}
                      onDeletePunktacja={deletePunktacja}
                      showNewPunktacjaForm={showNewPunktacjaForm}
                      onShowNewPunktacjaForm={setShowNewPunktacjaForm}
                      newPunktacjaForm={newPunktacjaForm}
                      onMutateNewPunktacjaForm={setNewPunktacjaForm}
                      onAddPunktacja={addPunktacja}
                      onMutateRangiConfig={setRangiConfig}
                      onUpdateRangaKolor={updateRangaKolor}
                      onUpdateRanga={updateRanga}
                      onDeleteRanga={deleteRanga}
                      onAddRanga={addRanga}
                      editingOdznakaId={editingOdznakaId}
                      onSetEditingOdznakaId={setEditingOdznakaId}
                      onMutateOdznakiConfig={setOdznakiConfig}
                      onUpdateOdznaka={updateOdznaka}
                      onReloadRankingData={loadRankingData}
                      onDeleteOdznaka={deleteOdznaka}
                      onAddOdznaka={addOdznaka}
                      limitDniConfig={limitDniConfig}
                      getConfigValue={getConfigValue}
                      aktywnoscZgloszeniaWlaczone={aktywnoscZgloszeniaWlaczone}
                      onOpenToggleAktywnoscZgloszen={() => setShowToggleAktywnoscZgloszenModal(true)}
                    />
                  )}

                  {canApproveRankingSubmissions && !(currentUser?.typ === 'ministrant' && pendingObecnosci.length > 0) && (
                    <PendingObecnosciCard
                      pendingObecnosci={pendingObecnosci}
                      memberByProfileId={memberByProfileId}
                      approvedDyzuryKeySet={approvedDyzuryKeySet}
                      approvingObecnosciIds={approvingObecnosciIds}
                      rejectingObecnosciIds={rejectingObecnosciIds}
                      bulkApprovingObecnosci={bulkApprovingObecnosci}
                      onApprove={(id) => { void handleApproveObecnosc(id); }}
                      onApproveWithCustomPoints={handleApproveObecnoscWithCustomPoints}
                      onReject={(id) => { void handleRejectObecnosc(id); }}
                      onApproveAll={() => { void zatwierdzWszystkie(); }}
                    />
                  )}

                  <RankingParafiiCard
                    rankingData={rankingData}
                    members={members}
                    getRanga={getRanga}
                    currentParafiaNazwa={currentParafia?.nazwa}
                  />

                  <StatystykiMiesiacaCard obecnosci={obecnosci} minusowePunkty={minusowePunkty} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Panel Wydarzenia */}
          <TabsContent value="sluzby">
            <div className="space-y-4">
                  {showPriestWydarzeniaInfo && (
                    <Card className="border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
                      <CardContent className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-emerald-900 dark:text-emerald-100 space-y-1">
                              <p className="font-semibold">Po co jest panel Wydarzenia?</p>
                              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                                To miejsce do planowania i koordynowania wszystkich wydarzeń liturgicznych w parafii.
                              </p>
                              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                                W tym panelu możesz m.in. dodawać i edytować wydarzenia, ustawiać funkcje liturgiczne, przypisywać ministrantów, śledzić akceptacje funkcji i zarządzać punktami dodatkowymi.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setShowPriestWydarzeniaInfo(false)}>
                              Ukryj
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowPriestWydarzeniaInfo(false);
                                setHidePriestWydarzeniaInfoPermanently(true);
                                if (typeof window !== 'undefined' && priestWydarzeniaInfoStorageKey) {
                                  writeLocalStorage(priestWydarzeniaInfoStorageKey, 'true');
                                }
                              }}
                            >
                              Nie pokazuj więcej
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {canUseMinistrantEvents && (
                    <MinistrantWydarzeniaHeader
                      kolorLiturgiczny={dzisLiturgiczny?.kolor}
                      onOpenZglosModal={() => setShowZglosModal(true)}
                    />
                  )}
                  {(canManageEvents || canManageFunctionTemplates) && (
                    <KsiadzWydarzeniaHeader
                      kolorLiturgiczny={dzisLiturgiczny?.kolor}
                      onOpenFunkcjeConfig={() => setShowFunkcjeConfigModal(true)}
                      onOpenAddWydarzenie={() => {
                        setSelectedZbiorka(null);
                        setSelectedSluzba(null);
                        setSluzbaForm({ nazwa: '', data: '', godzina: '', funkcjePerHour: {} });
                        setSluzbaValidationAttempted(false);
                        setSluzbaExternalAssignments({});
                        setSluzbaEkstraPunkty(null);
                        setShowSluzbaModal(true);
                      }}
                      onOpenAddZbiorka={() => {
                        openCreateZbiorkaModal();
                      }}
                      showFunkcjeButton={canManageFunctionTemplates}
                      showAddWydarzenieButton={canManageEvents}
                      showAddZbiorkaButton={canManageEvents}
                    />
                  )}

                  {(() => {
                    const sluzbyForViewer = canUseMinistrantEvents
                      ? sluzby.filter((s) => s.typ !== 'zbiorka' || isSluzbaAssignedToMe(s))
                      : sluzby;
                    const assignedCount = canUseMinistrantEvents
                      ? sluzbyForViewer.filter((s) => isSluzbaAssignedToMe(s)).length
                      : sluzbyForViewer.length;
                    const shouldShowOnlyAssigned = canUseMinistrantEvents
                      && !showAllSluzbyForMinistrant
                      && assignedCount > 0;
                    const visibleSluzby = shouldShowOnlyAssigned
                      ? sluzbyForViewer.filter((s) => isSluzbaAssignedToMe(s))
                      : sluzbyForViewer;

                    return (
                      <>
                        {canUseMinistrantEvents && sluzby.length > 0 && (
                          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3 py-2">
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                              Pokazano <strong>{visibleSluzby.length}</strong> z <strong>{sluzbyForViewer.length}</strong> wydarzeń
                            </p>
                            {assignedCount > 0 && assignedCount < sluzbyForViewer.length && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllSluzbyForMinistrant((prev) => !prev)}
                              >
                                {showAllSluzbyForMinistrant ? 'Pokaż przypisane' : 'Pokaż wszystkie'}
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="grid gap-4">
                          {visibleSluzby.length === 0 ? (
                            <Card>
                              <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                                {canUseMinistrantEvents
                                  ? 'Nie masz obecnie przypisanych wydarzeń.'
                                  : 'Brak zaplanowanych wydarzeń'}
                              </CardContent>
                            </Card>
                          ) : (
                            visibleSluzby.map(sluzba => {
                        const isMySluzba = isSluzbaAssignedToMe(sluzba);
                        const myFunkcje = getMyFunkcje(sluzba);
                        const needsAcceptance = hasUnacceptedFunkcje(sluzba);
                        const shouldShowMinistrantView = canUseMinistrantEvents || (currentUser?.typ === 'ministrant' && isMySluzba);

                        return (
                          <Card key={sluzba.id} className={`overflow-hidden ${isMySluzba ? 'border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50'}`}>
                            {canManageEvents && (() => {
                              const cg: Record<string, string> = { zielony: 'from-teal-500 to-emerald-500', bialy: 'from-amber-400 to-yellow-400', czerwony: 'from-red-500 to-rose-500', fioletowy: 'from-purple-600 to-violet-500', rozowy: 'from-pink-400 to-rose-400', zloty: 'from-amber-500 to-yellow-500', niebieski: 'from-blue-500 to-indigo-500', czarny: 'from-slate-700 to-gray-900' };
                              return <div className={`h-1.5 bg-gradient-to-r ${cg[dzisLiturgiczny?.kolor || 'zielony'] || cg.zielony}`} />;
                            })()}
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <CardTitle className="flex items-center gap-2.5 text-lg">
                                    {(() => {
                                      const cc: Record<string, string> = { zielony: 'from-teal-600 to-emerald-700 dark:from-teal-400 dark:to-emerald-400', bialy: 'from-amber-600 to-yellow-700 dark:from-amber-400 dark:to-yellow-400', czerwony: 'from-red-600 to-rose-700 dark:from-red-400 dark:to-rose-400', fioletowy: 'from-purple-600 to-violet-700 dark:from-purple-400 dark:to-violet-400', rozowy: 'from-pink-500 to-rose-600 dark:from-pink-400 dark:to-rose-400', zloty: 'from-amber-700 to-yellow-600 dark:from-amber-300 dark:to-yellow-300', niebieski: 'from-blue-700 to-indigo-700 dark:from-blue-300 dark:to-indigo-300', czarny: 'from-gray-800 to-zinc-900 dark:from-gray-200 dark:to-zinc-100' };
                                      return <span className={`bg-gradient-to-r ${cc[dzisLiturgiczny?.kolor || 'zielony'] || cc.zielony} bg-clip-text text-transparent font-extrabold`}>{sluzba.nazwa}</span>;
                                    })()}
                                    {sluzba.ekstra_punkty && sluzba.ekstra_punkty > 0 && (
                                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">+{sluzba.ekstra_punkty} pkt</span>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(sluzba.data).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' })}
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <Clock className="w-3.5 h-3.5" />
                                    {sluzba.godzina}
                                    {sluzba.typ === 'zbiorka' && sluzba.miejsce && (
                                      <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="truncate">{sluzba.miejsce}</span>
                                      </>
                                    )}
                                  </CardDescription>
                                </div>
                                {canManageEvents && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      title={sluzba.typ === 'zbiorka' ? 'Edytuj zbiórkę' : 'Edytuj wydarzenie'}
                                      onClick={() => handleEditSluzba(sluzba)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                      title={sluzba.typ === 'zbiorka' ? 'Usuń zbiórkę' : 'Usuń wydarzenie'}
                                      disabled={deletingSluzbaIds.has(sluzba.id)}
                                      onClick={() => void handleDeleteSluzbaFromList(sluzba)}
                                    >
                                      {deletingSluzbaIds.has(sluzba.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {canManageEvents && sluzba.typ === 'zbiorka' && (
                                <div className="space-y-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/15 p-3">
                                  <div className="text-sm">
                                    <span className="font-semibold">Miejsce:</span> {sluzba.miejsce || '—'}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-semibold">Grupy:</span>{' '}
                                    {(() => {
                                      const targetGroups = Array.isArray(sluzba.grupy_docelowe)
                                        ? sluzba.grupy_docelowe.map((group) => (typeof group === 'string' ? group.trim() : '')).filter(Boolean)
                                        : [];
                                      if (targetGroups.length > 0) {
                                        return targetGroups.join(', ');
                                      }
                                      const assignedRows = zbiorkaAssignmentsBySluzba[sluzba.id] || [];
                                      const fallbackGroups = Array.from(new Set(
                                        assignedRows
                                          .map((row) => {
                                            const ministrant = members.find((member) => member.profile_id === row.ministrant_id);
                                            return (ministrant?.grupa || 'Bez grupy').trim();
                                          })
                                          .filter(Boolean)
                                      ));
                                      return fallbackGroups.length > 0 ? fallbackGroups.join(', ') : '—';
                                    })()}
                                  </div>
                                  {sluzba.notatka && (
                                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      <span className="font-semibold">Notatka:</span> {sluzba.notatka}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <Badge variant="outline" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                                      +{Number(sluzba.punkty_za_obecnosc || 0)} pkt za obecność
                                    </Badge>
                                    <Badge variant="outline" className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">
                                      {Number(sluzba.punkty_za_nieobecnosc || 0)} pkt za nieobecność
                                    </Badge>
                                  </div>
                                  <Button
                                    type="button"
                                    className="w-full sm:w-auto"
                                    onClick={() => void openZbiorkaAttendanceModal(sluzba)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Sprawdź obecność
                                  </Button>
                                </div>
                              )}

                              {/* Widok księdza — pełna lista funkcji */}
                              {canManageEvents && sluzba.typ !== 'zbiorka' && (() => {
                                const hours = parseGodziny(sluzba.godzina);
                                const hasPerHour = hours.length > 1 && sluzba.funkcje.some(f => f.godzina);
                                const isActiveSluzba = sluzba.status === 'zaplanowana';
                                const litColor = dzisLiturgiczny?.kolor || 'zielony';
                                const availableMinistranci = members.filter(
                                  (m) => m.typ === 'ministrant' && m.zatwierdzony !== false
                                );
                                const litFunkcjaStyle: Record<string, { row: string; label: string; selectTrigger: string; hourBox: string; hourTitle: string; singleBox: string }> = {
                                  zielony: {
                                    row: 'border-emerald-200/90 dark:border-emerald-800/45 bg-gradient-to-r from-white via-emerald-50/80 to-teal-50/70 dark:from-gray-800 dark:via-emerald-950/28 dark:to-teal-950/22',
                                    label: 'text-emerald-900 dark:text-emerald-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-emerald-200 dark:border-emerald-800/60',
                                    hourBox: 'bg-emerald-50/75 dark:bg-emerald-900/16 border-emerald-200/85 dark:border-emerald-800/45',
                                    hourTitle: 'text-emerald-700 dark:text-emerald-300',
                                    singleBox: 'border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/45 dark:bg-emerald-900/14',
                                  },
                                  bialy: {
                                    row: 'border-amber-200/90 dark:border-amber-800/45 bg-gradient-to-r from-white via-amber-50/80 to-yellow-50/75 dark:from-gray-800 dark:via-amber-950/26 dark:to-yellow-950/22',
                                    label: 'text-amber-900 dark:text-amber-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-amber-200 dark:border-amber-800/60',
                                    hourBox: 'bg-amber-50/75 dark:bg-amber-900/16 border-amber-200/85 dark:border-amber-800/45',
                                    hourTitle: 'text-amber-700 dark:text-amber-300',
                                    singleBox: 'border-amber-200/80 dark:border-amber-800/40 bg-amber-50/45 dark:bg-amber-900/14',
                                  },
                                  czerwony: {
                                    row: 'border-rose-200/90 dark:border-rose-800/45 bg-gradient-to-r from-white via-rose-50/80 to-red-50/75 dark:from-gray-800 dark:via-rose-950/26 dark:to-red-950/22',
                                    label: 'text-rose-900 dark:text-rose-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-rose-200 dark:border-rose-800/60',
                                    hourBox: 'bg-rose-50/75 dark:bg-rose-900/16 border-rose-200/85 dark:border-rose-800/45',
                                    hourTitle: 'text-rose-700 dark:text-rose-300',
                                    singleBox: 'border-rose-200/80 dark:border-rose-800/40 bg-rose-50/45 dark:bg-rose-900/14',
                                  },
                                  fioletowy: {
                                    row: 'border-violet-200/90 dark:border-violet-800/45 bg-gradient-to-r from-white via-violet-50/80 to-purple-50/75 dark:from-gray-800 dark:via-violet-950/26 dark:to-purple-950/22',
                                    label: 'text-violet-900 dark:text-violet-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-violet-200 dark:border-violet-800/60',
                                    hourBox: 'bg-violet-50/75 dark:bg-violet-900/16 border-violet-200/85 dark:border-violet-800/45',
                                    hourTitle: 'text-violet-700 dark:text-violet-300',
                                    singleBox: 'border-violet-200/80 dark:border-violet-800/40 bg-violet-50/45 dark:bg-violet-900/14',
                                  },
                                  rozowy: {
                                    row: 'border-pink-200/90 dark:border-pink-800/45 bg-gradient-to-r from-white via-pink-50/80 to-rose-50/75 dark:from-gray-800 dark:via-pink-950/26 dark:to-rose-950/22',
                                    label: 'text-pink-900 dark:text-pink-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-pink-200 dark:border-pink-800/60',
                                    hourBox: 'bg-pink-50/75 dark:bg-pink-900/16 border-pink-200/85 dark:border-pink-800/45',
                                    hourTitle: 'text-pink-700 dark:text-pink-300',
                                    singleBox: 'border-pink-200/80 dark:border-pink-800/40 bg-pink-50/45 dark:bg-pink-900/14',
                                  },
                                  zloty: {
                                    row: 'border-amber-200/90 dark:border-amber-800/45 bg-gradient-to-r from-white via-amber-50/80 to-yellow-50/75 dark:from-gray-800 dark:via-amber-950/26 dark:to-yellow-950/22',
                                    label: 'text-amber-900 dark:text-amber-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-amber-200 dark:border-amber-800/60',
                                    hourBox: 'bg-amber-50/75 dark:bg-amber-900/16 border-amber-200/85 dark:border-amber-800/45',
                                    hourTitle: 'text-amber-700 dark:text-amber-300',
                                    singleBox: 'border-amber-200/80 dark:border-amber-800/40 bg-amber-50/45 dark:bg-amber-900/14',
                                  },
                                  niebieski: {
                                    row: 'border-blue-200/90 dark:border-blue-800/45 bg-gradient-to-r from-white via-blue-50/80 to-indigo-50/75 dark:from-gray-800 dark:via-blue-950/26 dark:to-indigo-950/22',
                                    label: 'text-blue-900 dark:text-blue-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-blue-200 dark:border-blue-800/60',
                                    hourBox: 'bg-blue-50/75 dark:bg-blue-900/16 border-blue-200/85 dark:border-blue-800/45',
                                    hourTitle: 'text-blue-700 dark:text-blue-300',
                                    singleBox: 'border-blue-200/80 dark:border-blue-800/40 bg-blue-50/45 dark:bg-blue-900/14',
                                  },
                                  czarny: {
                                    row: 'border-gray-300/90 dark:border-gray-700/50 bg-gradient-to-r from-white via-gray-100/70 to-zinc-100/70 dark:from-gray-800 dark:via-gray-900/35 dark:to-zinc-900/30',
                                    label: 'text-gray-900 dark:text-gray-100',
                                    selectTrigger: 'bg-white/95 dark:bg-gray-900/70 border-gray-300 dark:border-gray-700/70',
                                    hourBox: 'bg-gray-100/70 dark:bg-gray-900/30 border-gray-300/80 dark:border-gray-700/60',
                                    hourTitle: 'text-gray-700 dark:text-gray-300',
                                    singleBox: 'border-gray-300/80 dark:border-gray-700/60 bg-gray-100/45 dark:bg-gray-900/25',
                                  },
                                };
                                const litStyle = litFunkcjaStyle[litColor] || litFunkcjaStyle.zielony;
                                const getFunkcjaOrderIndex = (typ: string) => {
                                  const idx = FUNKCJE_TYPES.findIndex((item) => item === typ);
                                  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
                                };
                                const sortFunkcje = (funkcje: Funkcja[]) => (
                                  [...funkcje].sort((a, b) => {
                                    const diff = getFunkcjaOrderIndex(a.typ) - getFunkcjaOrderIndex(b.typ);
                                    if (diff !== 0) return diff;
                                    return a.typ.localeCompare(b.typ, 'pl');
                                  })
                                );
                                const renderFunkcjaRow = (funkcja: Funkcja, label: string) => {
                                  const selectedValue = !funkcja.aktywna
                                    ? 'BEZ'
                                    : (funkcja.osoba_zewnetrzna ? EXTERNAL_ASSIGNMENT_VALUE : (funkcja.ministrant_id || 'UNASSIGNED'));
                                  const saving = sluzbaInlineSavingIds.has(funkcja.id);

                                  return (
                                    <div key={funkcja.id} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-md border shadow-sm ${litStyle.row}`}>
                                      <div className="sm:w-44 shrink-0 flex items-center gap-2">
                                        <span className={`font-semibold text-sm ${litStyle.label}`}>{label}:</span>
                                        {!isActiveSluzba && (
                                          <Badge variant="secondary" className="text-[10px]">Zakończone</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          <Select
                                            value={selectedValue}
                                            onValueChange={(v) => { void handleInlineFunkcjaAssignment(sluzba.id, funkcja, v); }}
                                            disabled={!isActiveSluzba || saving}
                                          >
                                            <SelectTrigger className={`w-full min-w-0 h-9 ${litStyle.selectTrigger}`}>
                                              <SelectValue placeholder="--" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="BEZ">Wyłączona</SelectItem>
                                              <SelectItem value="UNASSIGNED">-- Nie przypisano --</SelectItem>
                                              <SelectItem value={EXTERNAL_ASSIGNMENT_VALUE}>Osoba z zewnątrz</SelectItem>
                                              {availableMinistranci.map((m) => (
                                                <SelectItem key={m.profile_id} value={m.profile_id}>
                                                  {m.imie} {m.nazwisko || ''}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          {funkcja.aktywna && funkcja.osoba_zewnetrzna && (
                                            <p className="mt-1 truncate text-[11px] text-sky-600 dark:text-sky-300">
                                              {funkcja.osoba_zewnetrzna}
                                            </p>
                                          )}
                                        </div>
                                        {saving ? (
                                          <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />
                                        ) : funkcja.aktywna && funkcja.osoba_zewnetrzna ? (
                                          <Users className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                                        ) : funkcja.aktywna && funkcja.ministrant_id ? (
                                          funkcja.zaakceptowana ? (
                                            <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />
                                          ) : (
                                            <Hourglass className="w-4 h-4 text-amber-500 shrink-0" />
                                          )
                                        ) : (
                                          <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                };

                                if (hasPerHour) {
                                  return (
                                    <div className="space-y-3">
                                      {hours.map(h => {
                                        const hourFunkcje = sortFunkcje(sluzba.funkcje.filter(f => f.godzina === h && f.aktywna));
                                        if (hourFunkcje.length === 0) return null;
                                        const typCounter: Record<string, number> = {};
                                        return (
                                          <div key={h} className={`rounded-lg p-2.5 border ${litStyle.hourBox}`}>
                                            <p className={`text-xs font-bold mb-1.5 flex items-center gap-1 ${litStyle.hourTitle}`}><Clock className="w-3 h-3" />{h}</p>
                                            <div className="space-y-1">
                                              {hourFunkcje.map((funkcja) => {
                                                typCounter[funkcja.typ] = (typCounter[funkcja.typ] || 0) + 1;
                                                const slot = typCounter[funkcja.typ];
                                                const label = slot > 1 ? `${funkcja.typ} (${slot})` : funkcja.typ;
                                                return renderFunkcjaRow(funkcja, label);
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                                // Single hour or legacy
                                const singleHourFunkcje = sortFunkcje(sluzba.funkcje.filter(f => f.aktywna));
                                const singleTypCounter: Record<string, number> = {};
                                return (
                                  <div className={`space-y-1.5 rounded-lg border p-2 ${litStyle.singleBox}`}>
                                    {singleHourFunkcje.map((funkcja) => {
                                      singleTypCounter[funkcja.typ] = (singleTypCounter[funkcja.typ] || 0) + 1;
                                      const slot = singleTypCounter[funkcja.typ];
                                      const label = slot > 1 ? `${funkcja.typ} (${slot})` : funkcja.typ;
                                      return renderFunkcjaRow(funkcja, label);
                                    })}
                                  </div>
                                );
                              })()}

                              {/* Widok ministranta — pełna lista funkcji + jego funkcje */}
                              {shouldShowMinistrantView && sluzba.typ !== 'zbiorka' && (() => {
                                const dniDoWydarzenia = Math.ceil((new Date(sluzba.data).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                                const aktywneFunkcje = sluzba.funkcje.filter((f) => f.aktywna);
                                const hours = parseGodziny(sluzba.godzina);
                                const hasPerHour = hours.length > 1 && aktywneFunkcje.some((f) => f.godzina);
                                const getFunkcjaOrderIndex = (typ: string) => {
                                  const idx = FUNKCJE_TYPES.findIndex((item) => item === typ);
                                  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
                                };
                                const sortFunkcje = (funkcje: Funkcja[]) => (
                                  [...funkcje].sort((a, b) => {
                                    const diff = getFunkcjaOrderIndex(a.typ) - getFunkcjaOrderIndex(b.typ);
                                    if (diff !== 0) return diff;
                                    return a.typ.localeCompare(b.typ, 'pl');
                                  })
                                );
                                const renderFunkcjaAssignmentRow = (funkcja: Funkcja, label: string) => (
                                  <div key={funkcja.id} className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800/70 rounded-md border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 shrink-0">{label}:</span>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={`text-sm truncate ${(funkcja.ministrant_id || funkcja.osoba_zewnetrzna) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                        {getMemberName(funkcja.ministrant_id, funkcja.osoba_zewnetrzna) || 'nie przypisano'}
                                      </span>
                                      {funkcja.ministrant_id && (
                                        funkcja.zaakceptowana ? <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" /> : <Hourglass className="w-4 h-4 text-amber-500 shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                );

                                return (
                                  <div className="space-y-3">
                                    <div className="rounded-lg border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-900/10 p-2.5">
                                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5">Funkcje w wydarzeniu</p>
                                      {aktywneFunkcje.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">Brak funkcji</p>
                                      ) : hasPerHour ? (
                                        <div className="space-y-2">
                                          {hours.map((h) => {
                                            const hourFunkcje = sortFunkcje(aktywneFunkcje.filter((f) => f.godzina === h));
                                            if (hourFunkcje.length === 0) return null;
                                            const typCounter: Record<string, number> = {};
                                            return (
                                              <div key={h} className="rounded-md border border-indigo-100 dark:border-indigo-800/35 bg-white/80 dark:bg-gray-900/40 p-2">
                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-1 flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {h}
                                                </p>
                                                <div className="space-y-1.5">
                                                  {hourFunkcje.map((funkcja) => {
                                                    typCounter[funkcja.typ] = (typCounter[funkcja.typ] || 0) + 1;
                                                    const slot = typCounter[funkcja.typ];
                                                    const label = slot > 1 ? `${funkcja.typ} (${slot})` : funkcja.typ;
                                                    return renderFunkcjaAssignmentRow(funkcja, label);
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {(() => {
                                            const typCounter: Record<string, number> = {};
                                            return sortFunkcje(aktywneFunkcje).map((funkcja) => {
                                              typCounter[funkcja.typ] = (typCounter[funkcja.typ] || 0) + 1;
                                              const slot = typCounter[funkcja.typ];
                                              const label = slot > 1 ? `${funkcja.typ} (${slot})` : funkcja.typ;
                                              return renderFunkcjaAssignmentRow(funkcja, label);
                                            });
                                          })()}
                                        </div>
                                      )}
                                    </div>

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
                                            Akceptuj funkcję
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-xs text-gray-400 text-center">Nie jesteś przypisany do funkcji w tym wydarzeniu.</p>
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
                    );
                  })()}
            </div>
          </TabsContent>

          {/* Panel Ministranci (tylko ksiądz) */}
          {canManageMembers && (
            <TabsContent value="ministranci">
              <div className="space-y-4">
                {showPriestMinistranciInfo && (
                  <Card className="border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20">
                    <CardContent className="py-3 px-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-sky-900 dark:text-sky-100 space-y-1">
                            <p className="font-semibold">Po co jest panel Ministranci?</p>
                            <p className="text-xs text-sky-800 dark:text-sky-200">
                              To miejsce do prowadzenia składu parafii i codziennej pracy z ministrantami.
                            </p>
                            <p className="text-xs text-sky-800 dark:text-sky-200">
                              W tym panelu możesz m.in. zatwierdzać nowych ministrantów, przypisywać grupy, ustawiać grafik dyżurów, zarządzać posługami i wysyłać wiadomości mailowe.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setShowPriestMinistranciInfo(false)}>
                            Ukryj
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowPriestMinistranciInfo(false);
                              setHidePriestMinistranciInfoPermanently(true);
                              if (typeof window !== 'undefined' && priestMinistranciInfoStorageKey) {
                                writeLocalStorage(priestMinistranciInfoStorageKey, 'true');
                              }
                            }}
                          >
                            Nie pokazuj więcej
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length > 0 && (
                  <Button className="w-full py-5 text-base font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20" onClick={() => setShowZatwierdzModal(true)}>
                    <UserCheck className="w-5 h-5 mr-2" />
                    Zatwierdź ministrantów ({members.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length})
                  </Button>
                )}
                {pendingDyzury.length > 0 && (
                  <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 shadow-md shadow-amber-500/10">
                    <CardContent className="py-3 px-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                            <Hourglass className="w-4 h-4" />
                            Prośby o zmianę dyżuru ({pendingDyzury.length})
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Ministranci czekają na akceptację nowego terminu dyżuru.
                          </p>
                          <div className="space-y-1.5 pt-1">
                            {pendingDyzury.slice(0, 4).map((d) => {
                              const member = memberByProfileId.get(d.ministrant_id);
                              const dayName = DNI_TYGODNIA_FULL[d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1];
                              const replaceFromName = d.zastepuje_dzien_tygodnia !== null && d.zastepuje_dzien_tygodnia !== undefined
                                ? DNI_TYGODNIA_FULL[d.zastepuje_dzien_tygodnia === 0 ? 6 : d.zastepuje_dzien_tygodnia - 1]
                                : null;
                              const memberName = member ? `${member.imie} ${member.nazwisko || ''}`.trim() : 'Nieznany ministrant';
                              const godzina = d.godzina?.trim();
                              const isApproving = approvingDyzurIds.has(d.id);
                              return (
                                <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white/90 dark:bg-gray-900/50 px-2.5 py-1.5">
                                  <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                                    {memberName} • {replaceFromName ? `${replaceFromName} → ${dayName}` : dayName}{godzina ? ` • ${godzina}` : ''}
                                  </span>
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-[11px] bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={() => handleApprovePendingDyzurRequest(d.id)}
                                    disabled={isApproving}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {isApproving ? 'Akceptuję...' : 'Akceptuj'}
                                  </Button>
                                </div>
                              );
                            })}
                            {pendingDyzury.length > 4 && (
                              <Badge variant="outline" className="bg-white/90 dark:bg-gray-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                                +{pendingDyzury.length - 4} więcej
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => setShowGrafikModal(true)}
                        >
                          Otwórz grafik dyżurów
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-end items-center flex-wrap gap-2">
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
                  {pendingDyzury.length > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                      {pendingDyzury.length} oczekuje
                    </span>
                  )}
                </Button>

                {/* Nieprzypisani */}
                {members.filter(m => !m.grupa && m.typ === 'ministrant' && m.zatwierdzony !== false).length > 0 && (
                  <div>
                    <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-xl px-4 py-2 mb-2 shadow-md shadow-red-500/15">
                      <h3 className="text-lg font-bold text-white">⚠️ Nieprzypisani</h3>
                    </div>
                    <div className="grid gap-3">
                      {members.filter(m => !m.grupa && m.typ === 'ministrant' && m.zatwierdzony !== false && (!searchMinistrant || `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(searchMinistrant.toLowerCase()))).map(member => (
                        <Card key={member.id} className="border-amber-400 dark:border-amber-600 overflow-hidden">
                          <CardContent className="py-3 sm:py-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold">{member.imie}</p>
                                {member.nazwisko && <p className="font-semibold text-gray-700 dark:text-gray-300 -mt-0.5">{member.nazwisko}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowGrupaModal(true);
                                    }}
                                  >
                                    Przypisz grupę
                                  </Button>
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
                  const groupMembers = members.filter(m => m.grupa === grupa.id && m.typ === 'ministrant' && m.zatwierdzony !== false && (!searchMinistrant || `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(searchMinistrant.toLowerCase())));
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
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{rankingData.find(r => r.ministrant_id === member.profile_id)?.total_pkt || 0} pkt</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPunktyHistoriaMember(member);
                                        setShowPunktyHistoriaModal(true);
                                      }}
                                      className="inline-flex items-center justify-center h-5 px-2 rounded-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700/70 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300"
                                    >
                                      Sprawdź pkt
                                    </button>
                                    {canManageRankingSettings && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMember(member);
                                          setDodajPunktyForm({ punkty: '', powod: '' });
                                          setShowDodajPunktyModal(true);
                                        }}
                                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400"
                                        title="Dodaj punkty"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {(getAssignedPermissionKeys(member.role).length > 0 || getPoslugaRoles(member.role).length > 0) && (
                                    <div className="mt-2">
                                      {(() => {
                                        const rolePoslugi = getPoslugaRoles(member.role);
                                        const assignedPermissions = getAssignedPermissionKeys(member.role);
                                        const firstRole = rolePoslugi[0];
                                        const firstPosluga = poslugi.find((p) => p.slug === firstRole);
                                        return (
                                          <div className="flex flex-wrap gap-1 items-center">
                                            {assignedPermissions.length > 0 && (
                                              <Badge variant="outline" className="flex items-center gap-1 border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300">
                                                <Shield className="w-3 h-3" />
                                                Uprawnienia: {assignedPermissions.length}
                                              </Badge>
                                            )}
                                            {firstPosluga && (
                                              <Badge variant="outline" className="flex items-center gap-1">
                                                {firstPosluga.obrazek_url ? (
                                                  <img src={firstPosluga.obrazek_url} alt={firstPosluga.nazwa} className="w-4 h-4 rounded-full object-cover inline" />
                                                ) : firstPosluga.emoji} {firstPosluga.nazwa}
                                              </Badge>
                                            )}
                                            {rolePoslugi.length > 1 && (
                                              <details className="inline">
                                                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 list-none">+{rolePoslugi.length - 1} więcej</summary>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {rolePoslugi.slice(1).map((r) => {
                                                    const posluga = poslugi.find((p) => p.slug === r);
                                                    if (!posluga) return null;
                                                    return (
                                                      <Badge key={r} variant="outline" className="flex items-center gap-1">
                                                        {posluga.obrazek_url ? (
                                                          <img src={posluga.obrazek_url} alt={posluga.nazwa} className="w-4 h-4 rounded-full object-cover inline" />
                                                        ) : posluga.emoji} {posluga.nazwa}
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
                                        if (!member.grupa) {
                                          alert('Najpierw przypisz grupę temu ministrantowi, a potem posługi.');
                                          return;
                                        }
                                        setSelectedMember(member);
                                        setShowPoslugiModal(true);
                                      }}
                                    >
                                      Przypisz posługi
                                    </Button>
                                  {(() => {
                                    const memberDyzury = dyzury.filter(d => d.ministrant_id === member.profile_id);
                                    if (memberDyzury.length > 0) {
                                      const hasPendingDyzurChange = memberDyzury.some((d) => d.status === 'oczekuje');
                                      const biernik: Record<string, string> = { 'Środa': 'Środę', 'Sobota': 'Sobotę', 'Niedziela': 'Niedzielę' };
                                      const dniNazwy = memberDyzury.map(d => {
                                        const idx = d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1;
                                        const nazwa = DNI_TYGODNIA_FULL[idx];
                                        const dzienName = biernik[nazwa] || nazwa;
                                        const godzina = d.godzina?.trim();
                                        return godzina ? `${dzienName} (${godzina})` : dzienName;
                                      });
                                      const prefix = dniNazwy[0] === 'Wtorek' ? 'we' : 'w';
                                      return (
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Dyżur {prefix} {dniNazwy.join(', ')}</p>
                                          {hasPendingDyzurChange && (
                                            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">⏳ Prośba o zmianę dyżuru</p>
                                          )}
                                        </div>
                                      );
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
              {showPriestPoslugiInfo && (
                <Card className="border-fuchsia-200 dark:border-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-900/20">
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <HandHelping className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-fuchsia-900 dark:text-fuchsia-100 space-y-1">
                          <p className="font-semibold">Po co jest panel Posługi?</p>
                          <p className="text-xs text-fuchsia-800 dark:text-fuchsia-200">
                            To miejsce do budowania i porządkowania bazy posług liturgicznych w parafii.
                          </p>
                          <p className="text-xs text-fuchsia-800 dark:text-fuchsia-200">
                            W tym panelu możesz m.in. dodawać i edytować posługi, uzupełniać opisy i filmy, usuwać nieaktualne pozycje oraz nadawać uprawnienia admina.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowPriestPoslugiInfo(false)}>
                          Ukryj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowPriestPoslugiInfo(false);
                            setHidePriestPoslugiInfoPermanently(true);
                            if (typeof window !== 'undefined' && priestPoslugiInfoStorageKey) {
                              writeLocalStorage(priestPoslugiInfoStorageKey, 'true');
                            }
                          }}
                        >
                          Nie pokazuj więcej
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {canUseMinistrantPoslugi && (() => {
                const litG: Record<string, { gradient: string; shadow: string }> = {
                  zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20' },
                  bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20' },
                  fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20' },
                  rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20' },
                  zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', shadow: 'shadow-blue-500/20' },
                  czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', shadow: 'shadow-gray-500/20' },
                };
                const lg = litG[dzisLiturgiczny?.kolor || 'zielony'] || litG.zielony;
                return (
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${lg.gradient} p-4 sm:p-5 shadow-lg ${lg.shadow}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">⛪</div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Posługi Liturgiczne</h2>
                        <p className="text-white/70 text-xs sm:text-sm">{poslugi.length} {poslugi.length === 1 ? 'posługa' : poslugi.length < 5 ? 'posługi' : 'posług'} w bazie</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {(canManagePoslugiCatalog || isPriestUser) && (
                <div className="flex gap-2 flex-wrap">
                  {canManagePoslugiCatalog && (
                    <Button size="sm" onClick={() => { if (poslugaEditor) poslugaEditor.commands.clearContent(); setShowAddPoslugaModal(true); }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Dodaj posługę
                    </Button>
                  )}
                  {isPriestUser && (
                    <Button size="sm" variant="outline" onClick={() => setShowParishAdminsModal(true)}>
                      <Shield className="w-4 h-4 mr-1" />
                      Nadaj admina
                      <span className="ml-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                        {members.filter((m) => m.typ === 'ministrant' && m.zatwierdzony !== false && getAssignedPermissionKeys(m.role).length > 0).length}
                      </span>
                    </Button>
                  )}
                </div>
              )}

              {canManagePoslugiCatalog && (
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
                          {canManagePoslugiCatalog && (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Edytuj posługę"
                                onClick={() => {
                                  setEditingPosluga({ ...posluga });
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
                                ? <div className="tiptap-posluga" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(posluga.dlugi_opis) }} />
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
              {canUseMinistrantModlitwy && (() => {
                const litG: Record<string, { gradient: string; shadow: string }> = {
                  zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20' },
                  bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20' },
                  fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20' },
                  rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20' },
                  zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', shadow: 'shadow-blue-500/20' },
                  czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', shadow: 'shadow-gray-500/20' },
                };
                const lg = litG[dzisLiturgiczny?.kolor || 'zielony'] || litG.zielony;
                return (
                  <>
                    <Button onClick={() => setShowZglosModal(true)} className="w-full h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 text-white shadow-xl shadow-blue-500/25 font-extrabold text-lg rounded-xl">
                      <Plus className="w-5 h-5 mr-2" />
                      Zgłoś obecność
                    </Button>
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${lg.gradient} p-4 sm:p-5 shadow-lg ${lg.shadow}`}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                      <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">🗓️</div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Kalendarz Liturgiczny</h2>
                          <p className="text-white/70 text-xs sm:text-sm">Okresy, święta i wspomnienia</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
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
                const days = getLiturgicalMonth(year, month).map(applyLiturgicalDayOverride);
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
                        const hasOverride = Boolean(calendarOverrides[day.date]);
                        const dayNum = new Date(day.date).getDate();

                        return (
                          <button
                            key={day.date}
                            onClick={() => setSelectedDay(day)}
                            className={`h-16 sm:h-20 md:h-24 rounded-lg p-1 text-left transition-all hover:ring-2 hover:ring-indigo-400 ${kolory.bg} ${kolory.border} border ${isToday ? 'ring-2 ring-indigo-600 ring-offset-1' : ''} ${hasOverride ? 'ring-1 ring-sky-500/60' : ''}`}
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
                  const previewKolory = calendarEditMode
                    ? (KOLORY_LITURGICZNE[calendarEditForm.kolor] || KOLORY_LITURGICZNE.zielony)
                    : kolory;
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
                        {canEditLiturgicalCalendar && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-900/20 px-3 py-2">
                            <p className="text-xs text-indigo-700 dark:text-indigo-200">
                              Zmiany są widoczne tylko w tej parafii.
                            </p>
                            {!calendarEditMode ? (
                              <Button size="sm" variant="outline" onClick={() => setCalendarEditMode(true)}>
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edytuj dzień
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setCalendarEditMode(false)}>
                                Anuluj edycję
                              </Button>
                            )}
                          </div>
                        )}

                        {calendarEditMode && canEditLiturgicalCalendar ? (
                          <div className="space-y-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-gray-900/50 p-3">
                            <div className="space-y-1">
                              <Label htmlFor="calendar-edit-name">Nazwa dnia</Label>
                              <Input
                                id="calendar-edit-name"
                                value={calendarEditForm.nazwa}
                                onChange={(e) => setCalendarEditForm((prev) => ({ ...prev, nazwa: e.target.value }))}
                                placeholder="Np. Święto parafialne"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="calendar-edit-period">Okres liturgiczny</Label>
                              <Input
                                id="calendar-edit-period"
                                value={calendarEditForm.okres}
                                onChange={(e) => setCalendarEditForm((prev) => ({ ...prev, okres: e.target.value }))}
                                placeholder="Np. Okres zwykły"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label>Ranga</Label>
                                <Select
                                  value={calendarEditForm.ranga}
                                  onValueChange={(value) => setCalendarEditForm((prev) => ({ ...prev, ranga: value as DzienLiturgiczny['ranga'] }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(RANGI).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label>Kolor liturgiczny</Label>
                                <Select
                                  value={calendarEditForm.kolor}
                                  onValueChange={(value) => setCalendarEditForm((prev) => ({ ...prev, kolor: value as DzienLiturgiczny['kolor'] }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(KOLORY_LITURGICZNE).map(([key, value]) => (
                                      <SelectItem key={key} value={key}>
                                        <span className="inline-flex items-center gap-2">
                                          <span className={`inline-block w-2 h-2 rounded-full ${value.dot}`} />
                                          {value.nazwa}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button size="sm" onClick={handleSaveCalendarDayOverride} disabled={calendarEditSaving}>
                                {calendarEditSaving ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    Zapisywanie...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Zapisz zmiany
                                  </>
                                )}
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleResetCalendarDayOverride} disabled={calendarEditSaving}>
                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                Przywróć domyślne
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-4 rounded-lg ${kolory.bg} ${kolory.border} border`}>
                            {selectedDay.nazwa ? (
                              <p className={`text-lg font-bold ${kolory.text}`}>{selectedDay.nazwa}</p>
                            ) : (
                              <p className={`text-lg ${kolory.text}`}>Dzień powszedni</p>
                            )}
                          </div>
                        )}

                        {calendarEditMode && (
                          <div className={`p-4 rounded-lg ${previewKolory.bg} ${previewKolory.border} border`}>
                            <p className={`text-sm font-semibold ${previewKolory.text}`}>Podgląd dnia</p>
                            <p className={`text-lg font-bold mt-1 ${previewKolory.text}`}>{calendarEditForm.nazwa || 'Dzień powszedni'}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Okres</p>
                            <p className="font-medium">{calendarEditMode ? (calendarEditForm.okres || '—') : (selectedDay.okres || '—')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ranga</p>
                            <p className="font-medium">{calendarEditMode ? RANGI[calendarEditForm.ranga] : RANGI[selectedDay.ranga]}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Kolor liturgiczny</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${previewKolory.dot}`} />
                              <p className="font-medium">
                                {previewKolory.nazwa}
                              </p>
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
              {canUseMinistrantModlitwy && (() => {
                const litG: Record<string, { gradient: string; shadow: string }> = {
                  zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20' },
                  bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20' },
                  fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20' },
                  rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20' },
                  zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', shadow: 'shadow-blue-500/20' },
                  czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', shadow: 'shadow-gray-500/20' },
                };
                const lg = litG[dzisLiturgiczny?.kolor || 'zielony'] || litG.zielony;
                return (
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${lg.gradient} p-4 sm:p-5 shadow-lg ${lg.shadow}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">🙏</div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Modlitwy</h2>
                        <p className="text-white/70 text-xs sm:text-sm">Duchowe przygotowanie do służby</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  const dzis = getLocalISODate(new Date());
                  const url = `https://niezbednik.niedziela.pl/liturgia/${dzis}`;
                  if (typeof window !== 'undefined') {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full text-left rounded-2xl overflow-hidden border border-indigo-200/50 dark:border-indigo-700/50 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 hover:from-indigo-500/20 hover:to-blue-500/20 transition-colors shadow-md shadow-indigo-500/10"
              >
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-indigo-900 dark:text-indigo-200">Czytania z dnia</p>
                      <p className="text-xs text-indigo-600/90 dark:text-indigo-300/80 truncate">
                        Otwórz czytania liturgiczne na {new Date().toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-indigo-500 dark:text-indigo-300 shrink-0" />
                </div>
              </button>
              {/* Modlitwa przed Mszą */}
              <Accordion type="single" collapsible>
                <AccordionItem value="przed" className="border-0">
                  <AccordionTrigger className="rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20 border border-amber-200/50 dark:border-amber-700/50 px-4 py-3 hover:no-underline hover:from-amber-500/20 hover:to-yellow-500/20 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⛪</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">Modlitwa przed Mszą</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-amber-200/30 dark:border-amber-700/30 p-4">
                      {editingModlitwa === 'przed' ? (
                        <div className="space-y-2">
                          <textarea
                            value={modlitwaEditText}
                            onChange={(e) => setModlitwaEditText(e.target.value)}
                            className="w-full min-h-[150px] rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 p-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => saveModlitwa('przed', modlitwaEditText)}>
                              <Check className="w-3 h-3 mr-1" />Zapisz
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingModlitwa(null)}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {canEditPrayers && (
                            <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-7 w-7 p-0 text-amber-400 hover:text-amber-600" onClick={() => { setModlitwaEditText(modlitwyTresc.przed || MODLITWY.przed); setEditingModlitwa('przed'); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300 pr-8">{modlitwyTresc.przed || MODLITWY.przed}</p>
                        </div>
                      )}
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
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30 p-4">
                      {editingModlitwa === 'po' ? (
                        <div className="space-y-2">
                          <textarea
                            value={modlitwaEditText}
                            onChange={(e) => setModlitwaEditText(e.target.value)}
                            className="w-full min-h-[150px] rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 p-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => saveModlitwa('po', modlitwaEditText)}>
                              <Check className="w-3 h-3 mr-1" />Zapisz
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingModlitwa(null)}>Anuluj</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {canEditPrayers && (
                            <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-7 w-7 p-0 text-emerald-400 hover:text-emerald-600" onClick={() => { setModlitwaEditText(modlitwyTresc.po || MODLITWY.po); setEditingModlitwa('po'); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300 pr-8">{modlitwyTresc.po || MODLITWY.po}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="patronowie" className="border-0">
                  <AccordionTrigger className="rounded-xl bg-gradient-to-r from-rose-500/10 to-fuchsia-500/10 dark:from-rose-500/20 dark:to-fuchsia-500/20 border border-rose-200/50 dark:border-rose-700/50 px-4 py-3 hover:no-underline hover:from-rose-500/20 hover:to-fuchsia-500/20 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🛡️</span>
                      <span className="font-bold text-rose-800 dark:text-rose-300">Patronowie ministrantów</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {PATRONOWIE_MINISTRANTOW.map((patron) => (
                          <div key={patron.id} className="rounded-xl overflow-hidden border border-blue-100 dark:border-blue-900/40 bg-white dark:bg-gray-900 shadow-sm">
                            <img
                              src={patron.zdjecie}
                              alt={patron.nazwa}
                              loading="lazy"
                              className="w-full h-52 object-contain bg-gray-100 dark:bg-gray-800 p-2"
                            />
                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">{patron.nazwa}</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mt-0.5">{patron.tytul}</p>
                              </div>
                              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{patron.opis}</p>
                              <div className="rounded-lg border border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-50/70 dark:bg-indigo-900/20 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-300 mb-1">Krótka modlitwa</p>
                                <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-200">{patron.modlitwa}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    <div className="mt-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-indigo-200/30 dark:border-indigo-700/30 p-4 space-y-3">
                      {canEditPrayers && (
                        <div className="flex justify-end">
                          <Button size="sm" variant={editingLacinaMode ? 'default' : 'outline'} className={editingLacinaMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''} onClick={() => { setEditingLacinaMode(!editingLacinaMode); setEditingLacinaIdx(null); }}>
                            <Pencil className="w-3 h-3 mr-1" />{editingLacinaMode ? 'Gotowe' : 'Edytuj'}
                          </Button>
                        </div>
                      )}
                      {(lacinaData || MODLITWY.lacina).map((item, i) => (
                        <div key={i} className="rounded-lg border border-indigo-100 dark:border-indigo-800/30 overflow-hidden">
                          {editingLacinaMode && editingLacinaIdx === i ? (
                            <div className="p-3 space-y-2 bg-indigo-50/50 dark:bg-indigo-900/10">
                              <div>
                                <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Kapłan (łacina):</label>
                                <textarea value={lacinaEditForm.k} onChange={(e) => setLacinaEditForm(prev => ({ ...prev, k: e.target.value }))} className="w-full rounded border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 p-2 text-sm resize-y min-h-[40px]" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Kapłan (polski):</label>
                                <textarea value={lacinaEditForm.kPl} onChange={(e) => setLacinaEditForm(prev => ({ ...prev, kPl: e.target.value }))} className="w-full rounded border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 p-2 text-sm resize-y min-h-[40px]" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Ministrant (łacina):</label>
                                <textarea value={lacinaEditForm.m} onChange={(e) => setLacinaEditForm(prev => ({ ...prev, m: e.target.value }))} className="w-full rounded border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 p-2 text-sm resize-y min-h-[40px]" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Ministrant (polski):</label>
                                <textarea value={lacinaEditForm.mPl} onChange={(e) => setLacinaEditForm(prev => ({ ...prev, mPl: e.target.value }))} className="w-full rounded border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 p-2 text-sm resize-y min-h-[40px]" />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => {
                                  const current = [...(lacinaData || MODLITWY.lacina)];
                                  current[i] = { ...lacinaEditForm };
                                  saveLacinaData(current);
                                  setEditingLacinaIdx(null);
                                }}>
                                  <Check className="w-3 h-3 mr-1" />Zapisz
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingLacinaIdx(null)}>Anuluj</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              {editingLacinaMode && (
                                <div className="absolute top-1 right-1 flex gap-1 z-10">
                                  <button className="w-6 h-6 rounded-full bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 flex items-center justify-center" onClick={() => { setLacinaEditForm({ k: item.k, m: item.m, kPl: item.kPl, mPl: item.mPl }); setEditingLacinaIdx(i); }}>
                                    <Pencil className="w-3 h-3 text-indigo-600 dark:text-indigo-300" />
                                  </button>
                                  <button className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 flex items-center justify-center" onClick={() => {
                                    if (!confirm('Usunąć tę odpowiedź?')) return;
                                    const current = [...(lacinaData || MODLITWY.lacina)];
                                    current.splice(i, 1);
                                    saveLacinaData(current);
                                  }}>
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              )}
                              <div className="bg-indigo-50/80 dark:bg-indigo-900/20 px-3 py-2">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Kapłan:</p>
                                <p className="text-sm text-indigo-900 dark:text-indigo-200 italic">{item.k}</p>
                                <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-0.5">{item.kPl}</p>
                              </div>
                              <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-2">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Ministrant:</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">{item.m}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.mPl}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {editingLacinaMode && (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => {
                          const current = [...(lacinaData || MODLITWY.lacina)];
                          current.push({ k: '', m: '', kPl: '', mPl: '' });
                          saveLacinaData(current);
                          setLacinaEditForm({ k: '', m: '', kPl: '', mPl: '' });
                          setEditingLacinaIdx(current.length - 1);
                        }}>
                          <Plus className="w-4 h-4 mr-1" />Dodaj odpowiedź
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Panel Wskazówki — Gaming */}
          <TabsContent value="wskazowki">
            <div className="space-y-4">
              {isRegularMinistrant && (() => {
                const litG: Record<string, { gradient: string; shadow: string }> = {
                  zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20' },
                  bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', shadow: 'shadow-red-500/20' },
                  fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', shadow: 'shadow-purple-500/20' },
                  rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', shadow: 'shadow-pink-500/20' },
                  zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', shadow: 'shadow-amber-500/20' },
                  niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', shadow: 'shadow-blue-500/20' },
                  czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', shadow: 'shadow-gray-500/20' },
                };
                const lg = litG[dzisLiturgiczny?.kolor || 'zielony'] || litG.zielony;
                return (
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${lg.gradient} p-4 sm:p-5 shadow-lg ${lg.shadow}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl">📖</div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Przewodnik Ministranta</h2>
                        <p className="text-white/70 text-xs sm:text-sm">Twoja baza wiedzy do służby</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

      {/* Toast sukcesu zgłoszenia */}
      {zglosSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300 max-w-[calc(100vw-1rem)]">
          <div className="bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg shadow-green-500/30 flex items-center gap-2 font-semibold text-sm max-w-full">
            <Check className="w-5 h-5" />
            <span className="truncate">Zgłoszenie zostało wysłane!</span>
          </div>
        </div>
      )}

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
                  writeLocalStorage('ios-install-dismissed', 'true');
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
          setSluzbaValidationAttempted(false);
          setSelectedSluzba(null);
          setSelectedZbiorka(null);
          setSluzbaForm({ nazwa: '', data: '', godzina: '', funkcjePerHour: {} });
          setSluzbaExternalAssignments({});
          setSluzbaEkstraPunkty(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent ${sluzbyModalTitleClass}`}>
              {selectedSluzba ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={sluzbaRequiredErrors.nazwa ? 'text-red-600 dark:text-red-400' : ''}>Nazwa wydarzenia *</Label>
              <Input
                value={sluzbaForm.nazwa}
                onChange={(e) => setSluzbaForm({ ...sluzbaForm, nazwa: e.target.value })}
                placeholder="Msza Święta"
                className={sluzbaRequiredErrors.nazwa ? 'border-red-500 focus-visible:ring-red-400' : ''}
              />
            </div>

            <div>
              <Label className={sluzbaRequiredErrors.data ? 'text-red-600 dark:text-red-400' : ''}>Data *</Label>
              <div className="relative">
                <Calendar className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${sluzbaRequiredErrors.data ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <Input
                  type="date"
                  value={sluzbaForm.data}
                  onChange={(e) => setSluzbaForm({ ...sluzbaForm, data: e.target.value })}
                  className={`pl-9 ${!sluzbaForm.data ? 'safari-muted-picker-hint' : ''} ${sluzbaRequiredErrors.data ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                />
              </div>
            </div>

            {(() => {
              // Parse godzina for UI: split by comma, keep empty slots for new inputs
              const rawParts = sluzbaForm.godzina.split(',').map(g => g.trim());
              const displayHours = rawParts.length > 0 && rawParts.some(p => p !== '') ? rawParts : [''];
              return (
                <div className={`border rounded-lg p-3 space-y-3 ${sluzbaRequiredErrors.godzina ? 'border-red-500 bg-red-50/40 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-gray-900'}`}>
                  <Label className={`font-semibold block ${sluzbaRequiredErrors.godzina ? 'text-red-600 dark:text-red-400' : ''}`}>Godzina *</Label>
                  <div className="space-y-2">
                    {displayHours.map((godz, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Clock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${sluzbaRequiredErrors.godzina ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
                          <Input
                            type="time"
                            value={godz}
                            className={`pl-9 ${!godz ? 'safari-muted-picker-hint' : ''} ${sluzbaRequiredErrors.godzina ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                            onChange={(e) => {
                              const newHours = [...displayHours];
                              const oldHour = newHours[i];
                              newHours[i] = e.target.value;
                              const newGodzina = newHours.join(', ');
                              const newFunkcjePerHour = { ...sluzbaForm.funkcjePerHour };
                              if (oldHour && oldHour !== e.target.value) {
                                newFunkcjePerHour[e.target.value] = newFunkcjePerHour[oldHour] || {};
                                delete newFunkcjePerHour[oldHour];
                                setSluzbaExternalAssignments((prev) => {
                                  const next = { ...prev };
                                  const oldPrefix = `${oldHour}::`;
                                  const newPrefix = `${e.target.value}::`;
                                  Object.keys(prev).forEach((k) => {
                                    if (k.startsWith(oldPrefix)) {
                                      const suffix = k.slice(oldPrefix.length);
                                      next[`${newPrefix}${suffix}`] = prev[k];
                                      delete next[k];
                                    }
                                  });
                                  return next;
                                });
                              }
                              setSluzbaForm({ ...sluzbaForm, godzina: newGodzina, funkcjePerHour: newFunkcjePerHour });
                            }}
                          />
                        </div>
                        {displayHours.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-8 px-2"
                            onClick={() => {
                              const newHours = displayHours.filter((_, j) => j !== i);
                              const newGodzina = newHours.filter(Boolean).join(', ');
                              const newFunkcjePerHour = { ...sluzbaForm.funkcjePerHour };
                              if (godz) delete newFunkcjePerHour[godz];
                              if (godz) {
                                setSluzbaExternalAssignments((prev) => {
                                  const next = { ...prev };
                                  const prefix = `${godz}::`;
                                  Object.keys(prev).forEach((k) => {
                                    if (k.startsWith(prefix)) delete next[k];
                                  });
                                  return next;
                                });
                              }
                              setSluzbaForm({ ...sluzbaForm, godzina: newGodzina, funkcjePerHour: newFunkcjePerHour });
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      const current = sluzbaForm.godzina.trim();
                      const newGodzina = current ? current + ', ' : '';
                      setSluzbaForm({ ...sluzbaForm, godzina: newGodzina });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Dodaj kolejną godzinę
                  </Button>
                </div>
              );
            })()}

            <div className="rounded-lg border border-amber-200 dark:border-amber-700 p-3 bg-amber-50/50 dark:bg-amber-900/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sluzbaEkstraPunkty !== null}
                  onChange={(e) => setSluzbaEkstraPunkty(e.target.checked ? 10 : null)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Ekstra punkty za obecność</span>
              </label>
              {sluzbaEkstraPunkty !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    value={sluzbaEkstraPunkty}
                    onChange={(e) => setSluzbaEkstraPunkty(Number(e.target.value))}
                    className="w-24"
                    min={1}
                  />
                  <span className="text-xs text-amber-600 dark:text-amber-400">pkt — wydarzenie pojawi się w &quot;Zgłoś obecność&quot;</span>
                </div>
              )}
            </div>

            {(() => {
              const hours = parseGodziny(sluzbaForm.godzina);
              if (hours.length <= 1) {
                // Single hour — flat list
                const h = hours[0] || '';
                const hourFunkcje = sluzbaForm.funkcjePerHour[h] || {};
                const funkcjaKeys = getHourFunkcjaKeys(hourFunkcje);
                return (
                  <div>
                    <Label className={`mb-2 block text-base font-bold ${sluzbyAssignLabelClass}`}>Przypisz funkcje</Label>
                    <div className="space-y-2">
                      {funkcjaKeys.map((funkcjaKey) => {
                        const funkcja = getFunkcjaBaseType(funkcjaKey);
                        const slot = getFunkcjaSlotNumber(funkcjaKey);
                        const isDuplicate = funkcjaKey !== funkcja;
                        const canDuplicate = isMultiAssigneeFunkcja(funkcja);
                        const currentValue = hourFunkcje[funkcjaKey] || 'BEZ';
                        const externalKey = getExternalAssignmentKey(h, funkcjaKey);
                        const isExternal = currentValue === EXTERNAL_ASSIGNMENT_VALUE;
                        return (
                        <div key={funkcjaKey} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="w-full sm:w-32 text-sm font-medium flex items-center gap-1.5">
                            <span>{funkcja}{slot > 1 ? ` (${slot})` : ''}:</span>
                            {canDuplicate && !isDuplicate && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                onClick={() => addDuplicateFunkcjaSlot(h, funkcja)}
                                title={`Dodaj kolejnego ministranta: ${funkcja}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                            {isDuplicate && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                                onClick={() => removeDuplicateFunkcjaSlot(h, funkcjaKey)}
                                title={`Usuń dodatkowy slot: ${funkcja}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <Select
                              value={currentValue}
                              onValueChange={(v) => {
                                setSluzbaForm({
                                  ...sluzbaForm,
                                  funkcjePerHour: {
                                    ...sluzbaForm.funkcjePerHour,
                                    [h]: { ...sluzbaForm.funkcjePerHour[h], [funkcjaKey]: v }
                                  }
                                });
                                if (v !== EXTERNAL_ASSIGNMENT_VALUE) {
                                  setSluzbaExternalAssignments((prev) => {
                                    if (!(externalKey in prev)) return prev;
                                    const next = { ...prev };
                                    delete next[externalKey];
                                    return next;
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Wyłączona" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEZ">Wyłączona</SelectItem>
                                <SelectItem value="UNASSIGNED">-- Nie przypisano --</SelectItem>
                                <SelectItem value={EXTERNAL_ASSIGNMENT_VALUE}>Osoba z zewnątrz</SelectItem>
                                {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).map(m => (
                                  <SelectItem key={m.profile_id} value={m.profile_id}>
                                    {m.imie} {m.nazwisko || ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isExternal && (
                              <Input
                                value={sluzbaExternalAssignments[externalKey] || ''}
                                onChange={(e) => setSluzbaExternalAssignments((prev) => ({
                                  ...prev,
                                  [externalKey]: e.target.value,
                                }))}
                                placeholder="Imię i nazwisko osoby z zewnątrz"
                              />
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                );
              }
              // Multi-hour — sections per hour
              return (
                <div className="space-y-3">
                  <Label className={`block text-base font-bold ${sluzbyAssignLabelClass}`}>Przypisz funkcje do każdej godziny</Label>
                  {hours.map(h => {
                    const hourFunkcje = sluzbaForm.funkcjePerHour[h] || {};
                    const funkcjaKeys = getHourFunkcjaKeys(hourFunkcje);
                    return (
                    <div key={h} className="border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                      <Label className="font-semibold block text-indigo-600 dark:text-indigo-400">{h}</Label>
                      <div className="space-y-1">
                        {funkcjaKeys.map((funkcjaKey) => {
                          const funkcja = getFunkcjaBaseType(funkcjaKey);
                          const slot = getFunkcjaSlotNumber(funkcjaKey);
                          const isDuplicate = funkcjaKey !== funkcja;
                          const canDuplicate = isMultiAssigneeFunkcja(funkcja);
                          const currentValue = hourFunkcje[funkcjaKey] || 'BEZ';
                          const externalKey = getExternalAssignmentKey(h, funkcjaKey);
                          const isExternal = currentValue === EXTERNAL_ASSIGNMENT_VALUE;
                          return (
                          <div key={funkcjaKey} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                            <div className="w-28 text-xs font-medium truncate flex items-center gap-1">
                              <span>{funkcja}{slot > 1 ? ` (${slot})` : ''}:</span>
                              {canDuplicate && !isDuplicate && (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                  onClick={() => addDuplicateFunkcjaSlot(h, funkcja)}
                                  title={`Dodaj kolejnego ministranta: ${funkcja}`}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {isDuplicate && (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                                  onClick={() => removeDuplicateFunkcjaSlot(h, funkcjaKey)}
                                  title={`Usuń dodatkowy slot: ${funkcja}`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            <Select
                              value={currentValue}
                              onValueChange={(v) => {
                                setSluzbaForm({
                                  ...sluzbaForm,
                                  funkcjePerHour: {
                                    ...sluzbaForm.funkcjePerHour,
                                    [h]: { ...sluzbaForm.funkcjePerHour[h], [funkcjaKey]: v }
                                  }
                                });
                                if (v !== EXTERNAL_ASSIGNMENT_VALUE) {
                                  setSluzbaExternalAssignments((prev) => {
                                    if (!(externalKey in prev)) return prev;
                                    const next = { ...prev };
                                    delete next[externalKey];
                                    return next;
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue placeholder="--" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEZ">Wyłączona</SelectItem>
                                <SelectItem value="UNASSIGNED">-- Nie przypisano --</SelectItem>
                                <SelectItem value={EXTERNAL_ASSIGNMENT_VALUE}>Osoba z zewnątrz</SelectItem>
                                {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).map(m => (
                                  <SelectItem key={m.profile_id} value={m.profile_id}>
                                    {m.imie} {m.nazwisko || ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            </div>
                            {isExternal && (
                              <Input
                                value={sluzbaExternalAssignments[externalKey] || ''}
                                onChange={(e) => setSluzbaExternalAssignments((prev) => ({
                                  ...prev,
                                  [externalKey]: e.target.value,
                                }))}
                                placeholder="Imię i nazwisko osoby z zewnątrz"
                                className="h-8 text-xs"
                              />
                            )}
                          </div>
                        )})}
                      </div>
                    </div>
                  )})}
                </div>
              );
            })()}

            {canManageFunctionTemplates && (
              <Button
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => setShowFunkcjeConfigModal(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Utwórz funkcję
              </Button>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCreateSluzba} className="flex-1">
                {selectedSluzba ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
              </Button>
              {selectedSluzba && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSluzba}
                  disabled={deletingSluzbaIds.has(selectedSluzba.id)}
                >
                  {deletingSluzbaIds.has(selectedSluzba.id) ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-1" />
                  )}
                  {deletingSluzbaIds.has(selectedSluzba.id) ? 'Usuwanie...' : 'Usuń wydarzenie'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal tworzenia/edycji zbiórki */}
      <Dialog open={showZbiorkaModal} onOpenChange={(open) => {
        setShowZbiorkaModal(open);
        if (!open) resetZbiorkaFormState();
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`text-xl sm:text-2xl font-extrabold tracking-tight ${zbiorkaHeaderTone.title}`}>
              {selectedZbiorka ? 'Edytuj zbiórkę ministrantów' : 'Dodaj zbiórkę ministrantów'}
            </DialogTitle>
            <DialogDescription className={zbiorkaHeaderTone.description}>
              Uzupełnij dane zbiórki i wskaż grupy. Obecność sprawdzisz przyciskiem „Sprawdź obecność” w utworzonej zbiórce.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const availableMinistranci = members
              .filter((m) => m.typ === 'ministrant' && m.zatwierdzony !== false)
              .sort((a, b) => `${a.imie} ${a.nazwisko || ''}`.localeCompare(`${b.imie} ${b.nazwisko || ''}`, 'pl'));
            const availableGroups = Array.from(new Set(availableMinistranci.map((m) => (m.grupa || 'Bez grupy').trim())))
              .sort((a, b) => a.localeCompare(b, 'pl'));
            const groupCounts = availableMinistranci.reduce<Record<string, number>>((acc, ministrant) => {
              const groupName = (ministrant.grupa || 'Bez grupy').trim();
              acc[groupName] = (acc[groupName] || 0) + 1;
              return acc;
            }, {});
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/45 dark:bg-indigo-950/20 p-3">
                  <div className="space-y-1">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={zbiorkaForm.data}
                      onChange={(e) => setZbiorkaForm((prev) => ({ ...prev, data: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Godzina *</Label>
                    <Input
                      type="time"
                      value={zbiorkaForm.godzina}
                      onChange={(e) => setZbiorkaForm((prev) => ({ ...prev, godzina: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200/70 dark:border-sky-900/50 bg-sky-50/45 dark:bg-sky-950/20 p-3 space-y-1">
                  <Label>Miejsce (np. kościół / salka)</Label>
                  <Input
                    value={zbiorkaForm.miejsce}
                    onChange={(e) => setZbiorkaForm((prev) => ({ ...prev, miejsce: e.target.value }))}
                  />
                </div>

                <div className="rounded-xl border border-violet-200/70 dark:border-violet-900/50 bg-violet-50/45 dark:bg-violet-950/20 p-3 space-y-1">
                  <Label>Opis / notatka</Label>
                  <textarea
                    value={zbiorkaForm.notatka}
                    onChange={(e) => setZbiorkaForm((prev) => ({ ...prev, notatka: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Krótka informacja organizacyjna dla ministrantów"
                  />
                </div>

                <div className="space-y-2 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/45 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-semibold">Lista uczestników</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setZbiorkaForm((prev) => ({ ...prev, grupyDocelowe: [...availableGroups] }))}
                      >
                        Zaznacz wszystkich
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setZbiorkaForm((prev) => ({ ...prev, grupyDocelowe: [] }));
                          setZbiorkaAttendance({});
                        }}
                      >
                        Wyczyść
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Zbiórkę zobaczą tylko wybrane grupy.
                  </p>
                  {availableGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Brak zatwierdzonych ministrantów w parafii.</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {availableGroups.map((groupName) => {
                        const checked = zbiorkaForm.grupyDocelowe.includes(groupName);
                        return (
                          <label
                            key={groupName}
                            className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-sm cursor-pointer transition-colors ${
                              checked
                                ? 'border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/70 dark:bg-emerald-900/20'
                                : 'border-emerald-200/70 dark:border-emerald-900/35 bg-white/85 dark:bg-gray-900/65'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{groupName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {groupCounts[groupName] || 0} ministrantów
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setZbiorkaForm((prev) => ({
                                  ...prev,
                                  grupyDocelowe: isChecked
                                    ? [...prev.grupyDocelowe, groupName]
                                    : prev.grupyDocelowe.filter((group) => group !== groupName),
                                }));
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/45 dark:bg-amber-950/20 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Obecność ministrantów ustawisz po utworzeniu zbiórki, przyciskiem „Sprawdź obecność”.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/45 dark:bg-rose-950/20 p-3">
                  <div>
                    <Label>Dodaj punkty za obecność</Label>
                    <Input
                      type="number"
                      min={0}
                      value={zbiorkaForm.punktyZaObecnosc}
                      onChange={(e) => setZbiorkaForm((prev) => ({ ...prev, punktyZaObecnosc: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                  </div>
                  <div>
                    <Label>Odejmij punkty za nieobecność</Label>
                    <Input
                      type="number"
                      min={0}
                      value={zbiorkaForm.punktyZaNieobecnosc}
                      onChange={(e) => setZbiorkaForm((prev) => ({ ...prev, punktyZaNieobecnosc: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveZbiorka} className="w-full" disabled={zbiorkaSaving}>
                  {zbiorkaSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : selectedZbiorka ? 'Zapisz zbiórkę' : 'Utwórz zbiórkę'}
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal obecności zbiórki */}
      <Dialog open={showZbiorkaAttendanceModal} onOpenChange={(open) => {
        setShowZbiorkaAttendanceModal(open);
        if (!open) {
          setSelectedZbiorkaAttendance(null);
          setZbiorkaAttendance({});
        }
      }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`text-xl sm:text-2xl font-extrabold tracking-tight ${zbiorkaHeaderTone.title}`}>
              Sprawdź obecność
            </DialogTitle>
            <DialogDescription className={zbiorkaHeaderTone.description}>
              Oznacz obecność ministrantów przypisanych do tej zbiórki.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            if (!selectedZbiorkaAttendance) {
              return (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Brak wybranej zbiórki.
                </p>
              );
            }

            const targetMinistranci = getMinistranciByTargetGroups(selectedZbiorkaAttendance.grupy_docelowe || []);

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-100/60 dark:bg-amber-950/30 p-3 text-sm">
                  <p><span className="font-semibold">Zbiórka:</span> {selectedZbiorkaAttendance.nazwa}</p>
                  <p><span className="font-semibold">Data:</span> {new Date(selectedZbiorkaAttendance.data).toLocaleDateString('pl-PL')} {selectedZbiorkaAttendance.godzina}</p>
                </div>

                {targetMinistranci.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Brak ministrantów w wybranych grupach tej zbiórki.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {targetMinistranci.map((ministrant) => {
                      const selectedStatus = zbiorkaAttendance[ministrant.profile_id];
                      const rowTone = selectedStatus === 'obecny'
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/25'
                        : selectedStatus === 'nieobecny'
                          ? 'border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-950/25'
                          : 'border-amber-100 dark:border-amber-900/30 bg-white/90 dark:bg-gray-900/70';
                      const triggerTone = selectedStatus === 'obecny'
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                        : selectedStatus === 'nieobecny'
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                          : 'border-input';

                      return (
                        <div key={ministrant.profile_id} className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 transition-colors ${rowTone}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ministrant.imie} {ministrant.nazwisko || ''}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ministrant.grupa || 'Bez grupy'}</p>
                          </div>
                          <div className="w-[170px]">
                            <Select
                              value={zbiorkaAttendance[ministrant.profile_id]}
                              onValueChange={(value) => setZbiorkaAttendance((prev) => ({
                                ...prev,
                                [ministrant.profile_id]: value as ZbiorkaObecnoscStatus,
                              }))}
                            >
                              <SelectTrigger className={`h-8 ${triggerTone}`}>
                                <SelectValue placeholder="Wybierz status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="obecny">Obecny</SelectItem>
                                <SelectItem value="nieobecny">Nieobecny</SelectItem>
                                <SelectItem value="usprawiedliwiony">Usprawiedliwiony</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void handleSaveZbiorkaAttendance()}
                  disabled={zbiorkaAttendanceSaving || targetMinistranci.length === 0}
                >
                  {zbiorkaAttendanceSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Zapisywanie obecności...
                    </>
                  ) : 'Zapisz obecność'}
                </Button>
              </div>
            );
          })()}
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

      {/* Modal adminów parafii */}
      <Dialog
        open={showParishAdminsModal}
        onOpenChange={(open) => {
          setShowParishAdminsModal(open);
          if (!open) {
            setAdminSearchMinistrant('');
            setPermissionsMemberId('');
            setPermissionsDraft([]);
            setFullConfigAccessDraft(false);
            setFullConfigWithRankingApprovalsDraft(false);
            setPermissionAssignDraft({});
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zarządzaj uprawnieniami administratora</DialogTitle>
            <DialogDescription>
              Wybierz ministranta i zaznacz dokładnie, które działania księdza ma mieć odblokowane.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const adminCandidates = members.filter((m) => m.typ === 'ministrant' && m.zatwierdzony !== false);
              const assignedAdmins = adminCandidates.filter((m) => getAssignedPermissionKeys(m.role).length > 0);
              const selectedPermissionsMember = members.find((m) => m.id === permissionsMemberId) || null;
              const search = adminSearchMinistrant.trim().toLowerCase();
              const searchedCandidates = search
                ? adminCandidates.filter((m) => `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(search))
                : [];
              const fullConfigMembers = adminCandidates.filter((member) => (
                hasFullConfigurationPermissions(getAssignedPermissionKeys(member.role))
              ));
              const isSaving = permissionsMemberId ? adminRoleSavingIds.has(permissionsMemberId) : false;
              const canEditFullConfig = Boolean(selectedPermissionsMember);

              return (
                <>
                  <div className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-semibold text-center">
                    Pełne uprawnienia admina
                  </div>
                  <div className="rounded-md border border-indigo-200 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-900/20 p-2.5 space-y-2">
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                      Wybrany ministrant: {selectedPermissionsMember ? `${selectedPermissionsMember.imie} ${selectedPermissionsMember.nazwisko || ''}` : 'brak'}
                    </p>
                    {!selectedPermissionsMember && (
                      <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                        Wyszukaj ministranta poniżej, aby nadać pełny dostęp.
                      </p>
                    )}

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                      <Input
                        placeholder="Wyszukaj ministranta po imieniu lub nazwisku..."
                        value={adminSearchMinistrant}
                        onChange={(e) => setAdminSearchMinistrant(e.target.value)}
                        className="pl-9 pr-9 border-indigo-200 dark:border-indigo-700 bg-white/80 dark:bg-indigo-950/20"
                      />
                      {adminSearchMinistrant && (
                        <button
                          type="button"
                          onClick={() => setAdminSearchMinistrant('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                          aria-label="Wyczyść wyszukiwanie"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {search && searchedCandidates.length === 0 && (
                      <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">Brak wyników dla podanej frazy.</p>
                    )}

                    {searchedCandidates.length > 0 && (
                      <div className="space-y-1 max-h-36 overflow-y-auto rounded-md border border-indigo-200 dark:border-indigo-700 bg-white/70 dark:bg-indigo-950/20 p-1.5">
                        {searchedCandidates.map((member) => {
                          const selected = member.id === permissionsMemberId;
                          const assignedCount = getAssignedPermissionKeys(member.role).length;
                          return (
                            <button
                              key={`search-${member.id}`}
                              type="button"
                              className={`w-full text-left rounded-md border px-2.5 py-2 transition-colors ${selected ? 'border-indigo-500 bg-indigo-100/80 dark:bg-indigo-900/40' : 'border-transparent hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20'}`}
                              onClick={() => handleSelectPermissionsMember(member)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 truncate">{member.imie} {member.nazwisko || ''}</p>
                                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                                    {assignedCount > 0 ? `${assignedCount} ${assignedCount === 1 ? 'uprawnienie' : 'uprawnień'}` : 'Brak uprawnień delegowanych'}
                                  </p>
                                </div>
                                {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <label className={`flex items-start gap-2 ${canEditFullConfig ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={fullConfigAccessDraft}
                        onChange={(e) => handleToggleFullConfigAccessDraft(e.target.checked)}
                        disabled={!canEditFullConfig}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-indigo-800 dark:text-indigo-200">Pełny dostęp do konfiguracji</span>
                        <span className="block text-xs text-indigo-700/80 dark:text-indigo-300/80">
                          Nadaje wszystkie uprawnienia księdza. Domyślnie bez zatwierdzania zgłoszeń.
                        </span>
                      </span>
                    </label>

                    <label className={`flex items-start gap-2 ${!fullConfigAccessDraft || !canEditFullConfig ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={fullConfigWithRankingApprovalsDraft}
                        onChange={(e) => handleToggleFullConfigRankingApprovalsDraft(e.target.checked)}
                        disabled={!fullConfigAccessDraft || !canEditFullConfig}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-indigo-800 dark:text-indigo-200">z zatwierdzaniem zgłoszeń do punktacji</span>
                        <span className="block text-xs text-indigo-700/80 dark:text-indigo-300/80">
                          Jeśli zaznaczone, ministrant dostaje też prawo zatwierdzania zgłoszeń.
                        </span>
                      </span>
                    </label>

                    <div className="rounded-md border border-indigo-200/80 dark:border-indigo-700/80 bg-white/60 dark:bg-indigo-950/20 p-2 space-y-1.5">
                      <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                        Kto ma pełny dostęp ({fullConfigMembers.length})
                      </p>
                      {fullConfigMembers.length === 0 ? (
                        <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">Nikt jeszcze nie ma pełnego dostępu.</p>
                      ) : (
                        <div className="space-y-1">
                          {fullConfigMembers.map((member) => {
                            const memberPermissions = getAssignedPermissionKeys(member.role);
                            const hasRankingApproval = memberPermissions.includes(RANKING_APPROVAL_PERMISSION_KEY);
                            const removing = adminRoleSavingIds.has(member.id);
                            return (
                              <div
                                key={`full-config-${member.id}`}
                                className="flex items-center justify-between gap-2 rounded-md border border-indigo-200 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-900/30 px-2 py-1.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleSelectPermissionsMember(member)}
                                  className="min-w-0 text-left"
                                >
                                  <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                    {member.imie} {member.nazwisko || ''}
                                  </p>
                                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                                    {hasRankingApproval ? 'z zatwierdzaniem zgłoszeń' : 'bez zatwierdzania zgłoszeń'}
                                  </p>
                                </button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 shrink-0"
                                  disabled={removing}
                                  onClick={() => handleRemoveFullConfigAccessForMember(member)}
                                  title="Usuń pełny dostęp"
                                  aria-label={`Usuń pełny dostęp dla ${member.imie} ${member.nazwisko || ''}`}
                                >
                                  {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleSaveMemberPermissions}
                      disabled={isSaving || !canEditFullConfig}
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Zapisywanie...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Zapisz uprawnienia
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="rounded-md bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1.5 text-sm font-semibold text-center">
                    Ograniczone uprawnienia admina
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-semibold">Wszystkie uprawnienia i przypisani ministranci</p>
                    <div className="space-y-3">
                      {PARISH_PERMISSION_DEFINITIONS.map((permission) => {
                        const assignedMembers = adminCandidates.filter((member) => (
                          getAssignedPermissionKeys(member.role).includes(permission.key)
                        ));
                        const availableMembers = adminCandidates.filter((member) => (
                          !assignedMembers.some((assigned) => assigned.id === member.id)
                        ));
                        const selectedAssignMemberId = permissionAssignDraft[permission.key] || '';
                        const assignLoading = selectedAssignMemberId ? adminRoleSavingIds.has(selectedAssignMemberId) : false;
                        return (
                          <div key={permission.key} className="rounded-lg border p-3 bg-gray-50/60 dark:bg-gray-900/30">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{permission.label}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{permission.description}</p>
                              </div>
                              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                                {assignedMembers.length}
                              </span>
                            </div>

                            {assignedMembers.length === 0 ? (
                              <p className="text-xs text-gray-400 mt-1.5">Brak przypisanych ministrantów</p>
                            ) : (
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {assignedMembers.map((member) => {
                                  const removing = adminRoleSavingIds.has(member.id);
                                  return (
                                    <div
                                      key={`${permission.key}-${member.id}`}
                                      className="rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30 px-2.5 py-2"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSelectPermissionsMember(member)}
                                          className="flex items-center gap-1.5 text-left min-w-0"
                                        >
                                          <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300 shrink-0" />
                                          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 truncate">
                                            {member.imie} {member.nazwisko || ''}
                                          </span>
                                        </button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                          disabled={removing}
                                          onClick={() => handleRemovePermissionForPermissionCard(permission.key, member)}
                                        >
                                          {removing ? '...' : 'Usuń'}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
                              <Select
                                value={selectedAssignMemberId || CLEAR_ASSIGN_MEMBER_VALUE}
                                onValueChange={(value) => setPermissionAssignDraft((prev) => ({
                                  ...prev,
                                  [permission.key]: value === CLEAR_ASSIGN_MEMBER_VALUE ? '' : value,
                                }))}
                              >
                                <SelectTrigger className="h-8 text-xs sm:flex-1">
                                  <SelectValue placeholder={availableMembers.length > 0 ? 'Wybierz ministranta do przypisania' : 'Wszyscy przypisani'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={CLEAR_ASSIGN_MEMBER_VALUE}>
                                    Wybierz
                                  </SelectItem>
                                  {availableMembers.map((member) => (
                                    <SelectItem key={`${permission.key}-option-${member.id}`} value={member.id}>
                                      {member.imie} {member.nazwisko || ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 border border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                                disabled={!selectedAssignMemberId || assignLoading}
                                onClick={() => handleAssignPermissionForPermissionCard(permission.key)}
                              >
                                {assignLoading ? 'Trwa...' : 'Przypisz admina'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-semibold">Aktualnie przypisani administratorzy</p>
                    {assignedAdmins.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Brak przypisanych administratorów.</p>
                    ) : (
                      <div className="space-y-2">
                        {assignedAdmins.map((member) => {
                          const selected = member.id === permissionsMemberId;
                          const assignedPermissions = getAssignedPermissionKeys(member.role);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleSelectPermissionsMember(member)}
                              className={`w-full text-left rounded-lg border p-2.5 transition-colors ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 shrink-0" />
                                    <span className="text-xs font-semibold truncate">{member.imie} {member.nazwisko || ''}</span>
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {assignedPermissions.map((permissionKey) => {
                                      const permission = PARISH_PERMISSION_DEFINITIONS.find((item) => item.key === permissionKey);
                                      if (!permission) return null;
                                      return (
                                        <span
                                          key={permissionKey}
                                          className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300"
                                        >
                                          {permission.label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                                <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                                  {assignedPermissions.length}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </>
              );
            })()}
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
                    checked={(selectedMember?.role || []).includes(posluga.slug)}
                    onChange={(e) => {
                      if (!selectedMember) return;
                      const currentRole = normalizeMemberRoles(selectedMember.role);
                      const newRole = e.target.checked
                        ? [...currentRole, posluga.slug]
                        : currentRole.filter(r => r !== posluga.slug);
                      setSelectedMember({ ...selectedMember, role: normalizeMemberRoles(newRole) });
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
                  {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false && (!emailSearchMinistrant || `${m.imie} ${m.nazwisko || ''}`.toLowerCase().includes(emailSearchMinistrant.toLowerCase()))).map(m => {
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
              const allMinistrants = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false);
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
              const groupMembers = members.filter(m => m.grupa === grupa.id && m.typ === 'ministrant' && m.zatwierdzony !== false);
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
                  emails = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).map(m => m.email).join(',');
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
              <div className={`grid gap-3 ${canEditPoslugaEmoji ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {canEditPoslugaEmoji && (
                  <div>
                    <Label>Emoji</Label>
                    <Input
                      value={editingPosluga.emoji}
                      onChange={(e) => setEditingPosluga({ ...editingPosluga, emoji: e.target.value })}
                    />
                  </div>
                )}
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
            <div className={`grid gap-3 ${canEditPoslugaEmoji ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {canEditPoslugaEmoji && (
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={newPoslugaForm.emoji}
                    onChange={(e) => setNewPoslugaForm({ ...newPoslugaForm, emoji: e.target.value })}
                    placeholder="⭐"
                  />
                </div>
              )}
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

      {/* Modal zgłoszenia obecności — Liturgiczny */}
      <Dialog open={showZglosModal} onOpenChange={setShowZglosModal}>
        <DialogContent className="w-[calc(100%-1rem)] p-0 overflow-y-auto border-0 shadow-2xl max-h-[90dvh]">
          <DialogTitle className="sr-only">Zgłoś obecność</DialogTitle>
          {(() => {
            const litModal: Record<string, { gradient: string; subtitleColor: string; border: string; activeBg: string; activeBorder: string; btnGradient: string; btnHover: string }> = {
              zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', subtitleColor: 'text-emerald-100', border: 'border-emerald-500', activeBg: 'bg-emerald-50 dark:bg-emerald-900/20', activeBorder: 'border-emerald-500', btnGradient: 'from-teal-500 via-emerald-500 to-green-500', btnHover: 'hover:from-teal-600 hover:via-emerald-600 hover:to-green-600' },
              bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', subtitleColor: 'text-amber-100', border: 'border-amber-500', activeBg: 'bg-amber-50 dark:bg-amber-900/20', activeBorder: 'border-amber-500', btnGradient: 'from-amber-400 via-yellow-400 to-amber-300', btnHover: 'hover:from-amber-500 hover:via-yellow-500 hover:to-amber-400' },
              czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', subtitleColor: 'text-red-100', border: 'border-red-500', activeBg: 'bg-red-50 dark:bg-red-900/20', activeBorder: 'border-red-500', btnGradient: 'from-red-500 via-rose-500 to-red-400', btnHover: 'hover:from-red-600 hover:via-rose-600 hover:to-red-500' },
              fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', subtitleColor: 'text-purple-100', border: 'border-purple-500', activeBg: 'bg-purple-50 dark:bg-purple-900/20', activeBorder: 'border-purple-500', btnGradient: 'from-purple-600 via-violet-500 to-purple-500', btnHover: 'hover:from-purple-700 hover:via-violet-600 hover:to-purple-600' },
              rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', subtitleColor: 'text-pink-100', border: 'border-pink-500', activeBg: 'bg-pink-50 dark:bg-pink-900/20', activeBorder: 'border-pink-500', btnGradient: 'from-pink-400 via-rose-400 to-pink-300', btnHover: 'hover:from-pink-500 hover:via-rose-500 hover:to-pink-400' },
              zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', subtitleColor: 'text-amber-100', border: 'border-amber-500', activeBg: 'bg-amber-50 dark:bg-amber-900/20', activeBorder: 'border-amber-500', btnGradient: 'from-amber-500 via-yellow-500 to-amber-400', btnHover: 'hover:from-amber-600 hover:via-yellow-600 hover:to-amber-500' },
              niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', subtitleColor: 'text-blue-100', border: 'border-blue-500', activeBg: 'bg-blue-50 dark:bg-blue-900/20', activeBorder: 'border-blue-500', btnGradient: 'from-blue-500 via-indigo-500 to-sky-500', btnHover: 'hover:from-blue-600 hover:via-indigo-600 hover:to-sky-600' },
              czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', subtitleColor: 'text-gray-200', border: 'border-gray-600', activeBg: 'bg-gray-100 dark:bg-gray-800/30', activeBorder: 'border-gray-600', btnGradient: 'from-slate-700 via-gray-800 to-zinc-800', btnHover: 'hover:from-slate-800 hover:via-gray-900 hover:to-zinc-900' },
            };
            const lm = litModal[dzisLiturgiczny?.kolor || 'zielony'] || litModal.zielony;
            return (
              <>
                <div className={`bg-gradient-to-r ${lm.gradient} p-4`}>
                  <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Nowa misja
                  </h3>
                  <p className={`${lm.subtitleColor} text-xs mt-1`}>Masz {getConfigValue('limit_dni_zgloszenie', 2)} dni od daty służby na zgłoszenie</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Data służby *</Label>
                    <Input type="date" value={zglosForm.data} max={getLocalISODate()} onChange={(e) => setZglosForm({ ...zglosForm, data: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Godzina (opcjonalnie)</Label>
                    <Input type="time" value={zglosForm.godzina} onChange={(e) => setZglosForm({ ...zglosForm, godzina: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Typ</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button onClick={() => setZglosForm({ ...zglosForm, typ: 'msza', wydarzenie_id: '' })} className={`p-3 rounded-xl border-2 text-center transition-all ${zglosForm.typ === 'msza' ? `${lm.activeBorder} ${lm.activeBg}` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                        <span className="text-2xl">⛪</span>
                        <p className="text-sm font-bold mt-1">Msza</p>
                      </button>
                      <button onClick={() => setZglosForm({ ...zglosForm, typ: 'nabożeństwo', wydarzenie_id: '' })} className={`p-3 rounded-xl border-2 text-center transition-all ${zglosForm.typ === 'nabożeństwo' ? `${lm.activeBorder} ${lm.activeBg}` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                        <span className="text-2xl">🙏</span>
                        <p className="text-sm font-bold mt-1">Nabożeństwo</p>
                      </button>
                      {sluzby.filter(s => s.ekstra_punkty && s.ekstra_punkty > 0 && (() => {
                        const eventDate = new Date(s.data + 'T00:00:00');
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const diff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
                        return diff >= 0 && diff <= 3;
                      })()).map(wyd => (
                        <button
                          key={wyd.id}
                          onClick={() => {
                            const firstHour = wyd.godzina?.split(',')[0]?.trim() || '';
                            setZglosForm({
                              ...zglosForm,
                              typ: 'wydarzenie',
                              wydarzenie_id: wyd.id,
                              nazwa_nabożeństwa: '',
                              data: wyd.data,
                              godzina: firstHour,
                            });
                          }}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${zglosForm.typ === 'wydarzenie' && zglosForm.wydarzenie_id === wyd.id ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                        >
                          <span className="text-2xl">⭐</span>
                          <p className="text-sm font-bold mt-1 truncate">{wyd.nazwa}</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">+{wyd.ekstra_punkty} pkt</p>
                        </button>
                      ))}
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
                        const { bazowe, mnoznik } = obliczPunktyBazowe(zglosForm.data, zglosForm.typ, zglosForm.nazwa_nabożeństwa, zglosForm.wydarzenie_id);
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
                  {zglosForm.typ === 'nabożeństwo' && !zglosForm.nazwa_nabożeństwa && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">Wybierz rodzaj nabożeństwa z listy powyżej</p>
                  )}
                  <Button onClick={zglosObecnosc} className={`w-full h-12 bg-gradient-to-r ${lm.btnGradient} ${lm.btnHover} text-white font-extrabold text-base`} disabled={zglosSubmitting || !zglosForm.data || (zglosForm.typ === 'nabożeństwo' && !zglosForm.nazwa_nabożeństwa) || (zglosForm.typ === 'wydarzenie' && !zglosForm.wydarzenie_id)}>
                    <Send className="w-5 h-5 mr-2" />
                    {zglosSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal zgłoszenia aktywności */}
      <Dialog
        open={showAktywnoscModal}
        onOpenChange={(open) => {
          setShowAktywnoscModal(open);
          if (!open && !aktywnoscSubmitting) {
            setAktywnoscForm(buildInitialAktywnoscForm());
          }
        }}
      >
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-md p-0 overflow-y-auto border-0 shadow-2xl max-h-[90dvh]">
          <DialogTitle className="sr-only">Zgłoś aktywność</DialogTitle>
          {(() => {
            const litModal: Record<string, { gradient: string; subtitleColor: string; btnGradient: string; btnHover: string }> = {
              zielony: { gradient: 'from-teal-600 via-emerald-600 to-green-600', subtitleColor: 'text-emerald-100', btnGradient: 'from-teal-500 via-emerald-500 to-green-500', btnHover: 'hover:from-teal-600 hover:via-emerald-600 hover:to-green-600' },
              bialy: { gradient: 'from-amber-500 via-yellow-500 to-amber-400', subtitleColor: 'text-amber-100', btnGradient: 'from-amber-400 via-yellow-400 to-amber-300', btnHover: 'hover:from-amber-500 hover:via-yellow-500 hover:to-amber-400' },
              czerwony: { gradient: 'from-red-600 via-rose-600 to-red-500', subtitleColor: 'text-red-100', btnGradient: 'from-red-500 via-rose-500 to-red-400', btnHover: 'hover:from-red-600 hover:via-rose-600 hover:to-red-500' },
              fioletowy: { gradient: 'from-purple-700 via-violet-600 to-purple-600', subtitleColor: 'text-purple-100', btnGradient: 'from-purple-600 via-violet-500 to-purple-500', btnHover: 'hover:from-purple-700 hover:via-violet-600 hover:to-purple-600' },
              rozowy: { gradient: 'from-pink-500 via-rose-400 to-pink-400', subtitleColor: 'text-pink-100', btnGradient: 'from-pink-400 via-rose-400 to-pink-300', btnHover: 'hover:from-pink-500 hover:via-rose-500 hover:to-pink-400' },
              zloty: { gradient: 'from-amber-600 via-yellow-500 to-amber-400', subtitleColor: 'text-amber-100', btnGradient: 'from-amber-500 via-yellow-500 to-amber-400', btnHover: 'hover:from-amber-600 hover:via-yellow-600 hover:to-amber-500' },
              niebieski: { gradient: 'from-blue-600 via-indigo-600 to-sky-600', subtitleColor: 'text-blue-100', btnGradient: 'from-blue-500 via-indigo-500 to-sky-500', btnHover: 'hover:from-blue-600 hover:via-indigo-600 hover:to-sky-600' },
              czarny: { gradient: 'from-slate-800 via-gray-900 to-zinc-800', subtitleColor: 'text-gray-200', btnGradient: 'from-slate-700 via-gray-800 to-zinc-800', btnHover: 'hover:from-slate-800 hover:via-gray-900 hover:to-zinc-900' },
            };
            const lm = litModal[dzisLiturgiczny?.kolor || 'zielony'] || litModal.zielony;
            const canSubmit = !!aktywnoscForm.opis.trim() && !!aktywnoscForm.data && Number.parseInt(aktywnoscForm.punkty, 10) > 0;

            return (
              <>
                <div className={`bg-gradient-to-r ${lm.gradient} p-4`}>
                  <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Zgłoś aktywność
                  </h3>
                  <p className={`${lm.subtitleColor} text-xs mt-1`}>
                    Ksiądz może zatwierdzić, przyznać mniej/więcej punktów albo odrzucić zgłoszenie.
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Co zrobiłeś? *</Label>
                    <textarea
                      value={aktywnoscForm.opis}
                      onChange={(e) => setAktywnoscForm((prev) => ({ ...prev, opis: e.target.value.slice(0, 240) }))}
                      placeholder="Np. pomoc przy przygotowaniu liturgii"
                      rows={3}
                      className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Kiedy? *</Label>
                    <Input
                      type="date"
                      value={aktywnoscForm.data}
                      max={getLocalISODate()}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setAktywnoscForm((prev) => ({ ...prev, data: selectedDate }));
                        requestAnimationFrame(() => e.target.blur());
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Ile punktów proponujesz? *</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={aktywnoscForm.punkty}
                      onChange={(e) => setAktywnoscForm((prev) => ({ ...prev, punkty: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder="Np. 8"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={zglosAktywnosc}
                    className={`w-full h-12 bg-gradient-to-r ${lm.btnGradient} ${lm.btnHover} text-white font-extrabold text-base`}
                    disabled={aktywnoscSubmitting || !canSubmit}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {aktywnoscSubmitting ? 'Wysyłanie...' : 'Wyślij do zatwierdzenia'}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal: przyznaj mniej / więcej punktów i zatwierdź */}
      <Dialog
        open={showCustomPointsModal}
        onOpenChange={(open) => {
          setShowCustomPointsModal(open);
          if (!open && !customPointsSaving) {
            setCustomPointsTarget(null);
            setCustomPointsValue('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Przyznaj mniej / więcej punktów</DialogTitle>
            <DialogDescription>
              Ustaw punktację dla aktywności. Zapis od razu zatwierdzi zgłoszenie.
            </DialogDescription>
          </DialogHeader>
          {customPointsTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                  {(() => {
                    const member = memberByProfileId.get(customPointsTarget.ministrant_id);
                    return member ? `${member.imie} ${member.nazwisko || ''}`.trim() : 'Ministrant';
                  })()}
                </p>
                <p className="text-sm text-indigo-900 dark:text-indigo-100 mt-1 break-words">
                  {customPointsTarget.nazwa_nabożeństwa || 'Brak opisu aktywności'}
                </p>
              </div>

              <div>
                <Label>Liczba punktów</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={customPointsValue}
                  onChange={(e) => setCustomPointsValue(e.target.value)}
                  placeholder="Np. 8"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCustomPointsModal(false);
                setCustomPointsTarget(null);
                setCustomPointsValue('');
              }}
              disabled={customPointsSaving}
            >
              Anuluj
            </Button>
            <Button type="button" onClick={() => { void saveCustomPendingPoints(); }} disabled={customPointsSaving || !customPointsTarget}>
              {customPointsSaving ? 'Zapisywanie i zatwierdzanie...' : 'Zmień punkty i zatwierdź aktywność'}
            </Button>
          </DialogFooter>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            {(() => {
              const lc: Record<string, string> = { zielony: 'text-emerald-700 dark:text-emerald-400', bialy: 'text-amber-600 dark:text-amber-400', czerwony: 'text-red-600 dark:text-red-400', fioletowy: 'text-purple-700 dark:text-purple-400', rozowy: 'text-pink-600 dark:text-pink-400', zloty: 'text-amber-700 dark:text-amber-400', niebieski: 'text-blue-700 dark:text-blue-400', czarny: 'text-gray-800 dark:text-gray-100' };
              return <DialogTitle className={`text-lg font-bold ${lc[dzisLiturgiczny?.kolor || 'zielony'] || lc.zielony}`}>{editingWatek ? (newWatekForm.kategoria === 'ogłoszenie' ? 'Edytuj ogłoszenie' : 'Edytuj wątek') : newWatekForm.kategoria === 'ogłoszenie' ? 'Nowe ogłoszenie' : 'Nowa dyskusja'}</DialogTitle>;
            })()}
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
            {newWatekForm.kategoria === 'ogłoszenie' && (
              <div className="rounded-md border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 px-3 py-2">
                <p className="text-sm text-teal-800 dark:text-teal-200">
                  Ogłoszenie jest publikowane w trybie tylko do odczytu. Komentarze są wyłączone.
                </p>
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
              <LazyEmojiPicker
                open={showEmojiPicker === 'watek'}
                className="absolute z-50 mt-1"
                locale="pl"
                theme={darkMode ? 'dark' : 'light'}
                onSelect={(emoji) => {
                  tiptapEditor?.chain().focus().insertContent(emoji.native).run();
                  setShowEmojiPicker(null);
                }}
              />
            </div>
            {canManageNews && (
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
            {(() => {
              const lb: Record<string, string> = { zielony: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 hover:from-teal-700 hover:via-emerald-700 hover:to-green-700', bialy: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-500', czerwony: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-700 hover:via-rose-700 hover:to-red-600', fioletowy: 'bg-gradient-to-r from-purple-700 via-violet-600 to-purple-600 hover:from-purple-800 hover:via-violet-700 hover:to-purple-700', rozowy: 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-400 hover:from-pink-600 hover:via-rose-500 hover:to-pink-500', zloty: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 hover:from-amber-700 hover:via-yellow-600 hover:to-amber-500', niebieski: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-700', czarny: 'bg-gradient-to-r from-slate-800 via-gray-900 to-zinc-800 hover:from-slate-900 hover:via-black hover:to-zinc-900' };
              return (
                <Button onClick={editingWatek ? updateWatek : createWatek} className={`w-full text-white border-0 ${lb[dzisLiturgiczny?.kolor || 'zielony'] || lb.zielony}`} disabled={!newWatekForm.archiwum_data || (newWatekForm.kategoria === 'ogłoszenie' ? (tiptapEditor ? tiptapEditor.isEmpty : (!newWatekForm.tresc || newWatekForm.tresc === '<p></p>')) : !newWatekForm.tytul.trim())}>
                  <Send className="w-4 h-4 mr-2" />
                  {editingWatek ? 'Zapisz zmiany' : 'Opublikuj'}
                </Button>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nowej ankiety */}
      <Dialog open={showNewAnkietaModal} onOpenChange={setShowNewAnkietaModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            {(() => {
              const lc: Record<string, string> = { zielony: 'text-emerald-700 dark:text-emerald-400', bialy: 'text-amber-600 dark:text-amber-400', czerwony: 'text-red-600 dark:text-red-400', fioletowy: 'text-purple-700 dark:text-purple-400', rozowy: 'text-pink-600 dark:text-pink-400', zloty: 'text-amber-700 dark:text-amber-400', niebieski: 'text-blue-700 dark:text-blue-400', czarny: 'text-gray-800 dark:text-gray-100' };
              return <DialogTitle className={`text-lg font-bold ${lc[dzisLiturgiczny?.kolor || 'zielony'] || lc.zielony}`}>Nowa ankieta</DialogTitle>;
            })()}
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
            {(() => {
              const lb: Record<string, string> = { zielony: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 hover:from-teal-700 hover:via-emerald-700 hover:to-green-700', bialy: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-500', czerwony: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-700 hover:via-rose-700 hover:to-red-600', fioletowy: 'bg-gradient-to-r from-purple-700 via-violet-600 to-purple-600 hover:from-purple-800 hover:via-violet-700 hover:to-purple-700', rozowy: 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-400 hover:from-pink-600 hover:via-rose-500 hover:to-pink-500', zloty: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 hover:from-amber-700 hover:via-yellow-600 hover:to-amber-500', niebieski: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-700', czarny: 'bg-gradient-to-r from-slate-800 via-gray-900 to-zinc-800 hover:from-slate-900 hover:via-black hover:to-zinc-900' };
              return (
                <Button onClick={createAnkieta} className={`w-full text-white border-0 ${lb[dzisLiturgiczny?.kolor || 'zielony'] || lb.zielony}`} disabled={!newAnkietaForm.pytanie.trim() || !newAnkietaForm.archiwum_data}>
                  <Vote className="w-4 h-4 mr-2" />
                  Utwórz ankietę
                </Button>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal archiwum */}
      <Dialog open={showArchiwum} onOpenChange={setShowArchiwum}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-gray-500" />
              Archiwum ({archiwalneWatki.length + sluzbyArchiwum.length})
            </DialogTitle>
            <DialogDescription>
              Zarchiwizowane ogłoszenia, dyskusje, ankiety i wydarzenia
            </DialogDescription>
          </DialogHeader>
          {archiwalneWatki.length === 0 && sluzbyArchiwum.length === 0 ? (
            <div className="text-center py-8">
              <Book className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Archiwum jest puste</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                // Połącz wątki i wydarzenia w jedną listę, sortuj od najnowszych
                const allItems = [
                  ...archiwalneWatki.map(w => ({ type: 'watek' as const, data: w, date: new Date(w.archiwum_data || w.created_at) })),
                  ...sluzbyArchiwum.map(s => ({ type: 'sluzba' as const, data: s, date: new Date(s.data) })),
                ];
                allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

                return allItems.map((item) => {
                  if (item.type === 'watek') {
                    const watek = item.data;
                    const autorWatku = members.find(m => m.profile_id === watek.autor_id);
                    const dniDoUsuniecia = watek.archiwum_data ? Math.max(0, Math.ceil((new Date(new Date(watek.archiwum_data).getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                    return (
                      <div
                        key={`watek-${watek.id}`}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-900"
                        onClick={() => {
                          setShowArchiwum(false);
                          if (watek.kategoria === 'ogłoszenie') { setPreviewOgloszenie(watek); return; }
                          openWatek(watek);
                        }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
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
                    );
                  } else {
                    const sluzba = item.data;
                    const dniOdWydarzenia = Math.floor((new Date().getTime() - new Date(sluzba.data).getTime()) / (1000 * 60 * 60 * 24));
                    const dniDoUsuniecia = Math.max(0, 30 - dniOdWydarzenia);
                    const isExpanded = expandedArchSluzba === sluzba.id;
                    const aktywneFunkcje = sluzba.funkcje.filter(f => f.aktywna);
                    const hours = parseGodziny(sluzba.godzina);
                    const isMultiHour = hours.length > 1;
                    return (
                      <div key={`sluzba-${sluzba.id}`} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                        <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => setExpandedArchSluzba(isExpanded ? null : sluzba.id)}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                                  Wydarzenie
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 dark:bg-orange-900/20 text-orange-500">
                                  Usunięcie za {dniDoUsuniecia} dni
                                </Badge>
                                {sluzba.ekstra_punkty && sluzba.ekstra_punkty > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                                    +{sluzba.ekstra_punkty} pkt
                                  </Badge>
                                )}
                              </div>
                              <p className="font-semibold text-sm">{sluzba.nazwa}</p>
                              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(sluzba.data).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' })}
                                <span className="text-gray-300 dark:text-gray-600 mx-0.5">|</span>
                                <Clock className="w-3 h-3" />
                                {sluzba.godzina}
                              </p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-gray-800">
                            <div className="p-3 space-y-2">
                              {aktywneFunkcje.length === 0 ? (
                                <p className="text-xs text-gray-400 italic text-center py-2">Brak funkcji</p>
                              ) : isMultiHour ? (
                                <div className="space-y-2">
                                  {hours.map(h => {
                                    const hourFunkcje = aktywneFunkcje.filter(f => f.godzina === h);
                                    if (hourFunkcje.length === 0) return null;
                                    return (
                                      <div key={h} className="rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 p-2.5 border border-indigo-100 dark:border-indigo-800/30">
                                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />{h}</p>
                                        <div className="space-y-1">
                                          {hourFunkcje.map(f => (
                                            <div key={f.id} className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 text-sm shadow-sm">
                                              <span className="font-semibold text-gray-700 dark:text-gray-200 shrink-0">{f.typ}:</span>
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={`truncate ${(f.ministrant_id || f.osoba_zewnetrzna) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                                  {getMemberName(f.ministrant_id, f.osoba_zewnetrzna) || 'nie przypisano'}
                                                </span>
                                                {f.ministrant_id && (
                                                  f.zaakceptowana ? <CheckCircle className="w-3.5 h-3.5 text-green-500 dark:text-green-400 shrink-0" /> : <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {aktywneFunkcje.map(f => (
                                    <div key={f.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700 shadow-sm">
                                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 shrink-0">{f.typ}:</span>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`text-sm truncate ${(f.ministrant_id || f.osoba_zewnetrzna) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                          {getMemberName(f.ministrant_id, f.osoba_zewnetrzna) || 'nie przypisano'}
                                        </span>
                                        {f.ministrant_id && (
                                          f.zaakceptowana ? <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" /> : <Hourglass className="w-4 h-4 text-amber-500 shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="px-3 pb-3 flex items-center gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={async () => {
                                  if (!confirm('Czy na pewno chcesz trwale usunąć to wydarzenie?')) return;
                                  if (deletingSluzbaIds.has(sluzba.id)) return;
                                  setDeletingSluzbaIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(sluzba.id);
                                    return next;
                                  });
                                  const deletion = await deleteSluzbaById(sluzba.id);
                                  setDeletingSluzbaIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(sluzba.id);
                                    return next;
                                  });
                                  if (!deletion.ok) {
                                    alert(deletion.error || 'Nie udało się usunąć wydarzenia.');
                                    return;
                                  }
                                  await loadSluzby();
                                }}
                                disabled={deletingSluzbaIds.has(sluzba.id)}
                              >
                                {deletingSluzbaIds.has(sluzba.id) ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3 mr-1" />
                                )}
                                {deletingSluzbaIds.has(sluzba.id) ? 'Usuwanie...' : 'Usuń trwale'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                });
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal zatwierdzania ministrantów */}
      <Dialog open={showZatwierdzModal} onOpenChange={setShowZatwierdzModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">Zatwierdzanie ministrantów</DialogTitle>
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Zatwierdzanie ministrantów
            </h3>
            <p className="text-amber-100 text-sm">Nowi ministranci oczekujący na dostęp</p>
          </div>
          <div className="p-4 space-y-3">
            {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length === 0 ? (
              <p className="text-center text-gray-500 py-4">Brak oczekujących ministrantów</p>
            ) : (
              members.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-900">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{member.imie} {member.nazwisko || ''}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    {member.created_at && (
                      <p className="text-xs text-gray-400">{new Date(member.created_at).toLocaleDateString('pl-PL')}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        const result = await manageParafiaMember({
                          action: 'approve',
                          memberId: member.id,
                        });
                        if (!result.ok) {
                          alert('Nie udało się zatwierdzić ministranta: ' + result.error);
                          return;
                        }
                        const nextApprovedValue = typeof result.member?.zatwierdzony === 'boolean'
                          ? result.member.zatwierdzony
                          : true;
                        setMembers(prev => {
                          const updated = prev.map(m => m.id === member.id ? { ...m, zatwierdzony: nextApprovedValue } : m);
                          if (updated.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length === 0) {
                            setShowZatwierdzModal(false);
                          }
                          return updated;
                        });
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Zatwierdź
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={async () => {
                        if (!confirm(`Czy na pewno chcesz odrzucić ${member.imie} ${member.nazwisko || ''}?`)) return;
                        const result = await manageParafiaMember({
                          action: 'reject',
                          memberId: member.id,
                        });
                        if (!result.ok) {
                          alert('Nie udało się odrzucić ministranta: ' + result.error);
                          return;
                        }
                        setMembers(prev => {
                          const updated = prev.filter(m => m.id !== member.id);
                          if (updated.filter(m => m.typ === 'ministrant' && m.zatwierdzony === false).length === 0) {
                            setShowZatwierdzModal(false);
                          }
                          return updated;
                        });
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Odrzuć
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal grafik dyżurów */}
      <Dialog
        open={showGrafikModal}
        onOpenChange={(open) => {
          setShowGrafikModal(open);
          if (!open) {
            setEditDyzury(false);
            setGrafikAddHourByDay({});
            setDyzurHourDraftById({});
          }
        }}
      >
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
                  const dyzuryDnia = dyzury
                    .filter(d => d.dzien_tygodnia === dzienIdx)
                    .sort((a, b) => (a.godzina?.trim() || '').localeCompare(b.godzina?.trim() || '', 'pl'));
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
                          const isPending = d.status === 'oczekuje';
                          return (
                            <span key={d.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${isPending ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' : kolor ? `${kolor.bg} ${kolor.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                              {isPending && <span className="text-xs">⏳</span>}
                              {!isPending && grupa?.emoji && <span className="text-xs">{grupa.emoji}</span>}
                              {member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}
                              {d.godzina?.trim() && <span className="text-[10px] opacity-80">• {d.godzina.trim()}</span>}
                              {isPending && (
                                <>
                                  <button onClick={() => handleDyzurDecision(d.id, 'zatwierdzona')} className="ml-1 w-5 h-5 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors" title="Zatwierdź">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleDyzurDecision(d.id, 'odrzucona')} className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors" title="Odrzuć">
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              )}
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
                const dyzuryDnia = dyzury
                  .filter(d => d.dzien_tygodnia === dzienIdx)
                  .sort((a, b) => (a.godzina?.trim() || '').localeCompare(b.godzina?.trim() || '', 'pl'));
                const ministranciNaDyzurze = dyzuryDnia.map(d => d.ministrant_id);
                const dostepniMinistranci = members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false && !ministranciNaDyzurze.includes(m.profile_id));
                const isWeekend = i >= 5;
                return (
                  <div key={i} className={`p-3 rounded-xl border ${isWeekend ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/40' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                    <p className={`font-semibold text-sm mb-2 ${isWeekend ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{dzien}</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {dyzuryDnia.map(d => {
                        const member = members.find(m => m.profile_id === d.ministrant_id);
                        const grupa = member?.grupa ? grupy.find(g => g.id === member.grupa) : null;
                        const kolor = grupa ? KOLOR_KLASY[grupa.kolor] : null;
                        const isPending = d.status === 'oczekuje';
                        return (
                          <span key={d.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${isPending ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' : kolor ? `${kolor.bg} ${kolor.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                            {isPending && <span className="text-xs">⏳</span>}
                            {!isPending && grupa?.emoji && <span className="text-xs">{grupa.emoji}</span>}
                            {member ? `${member.imie} ${member.nazwisko || ''}`.trim() : '?'}
                            <Input
                              type="time"
                              className="h-7 w-[105px] px-2 text-xs bg-white/80 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600"
                              value={dyzurHourDraftById[d.id] ?? (d.godzina?.trim() || '')}
                              onChange={(e) => setDyzurHourDraftById((prev) => ({ ...prev, [d.id]: e.target.value }))}
                              onBlur={(e) => {
                                const currentHour = d.godzina?.trim() || '';
                                const nextHour = e.target.value.trim();
                                if (nextHour !== currentHour) {
                                  void updateDyzurHourAdmin(d.id, nextHour);
                                } else {
                                  setDyzurHourDraftById((prev) => {
                                    const next = { ...prev };
                                    delete next[d.id];
                                    return next;
                                  });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.currentTarget as HTMLInputElement).blur();
                                }
                              }}
                            />
                            {isPending ? (
                              <>
                                <button onClick={() => handleDyzurDecision(d.id, 'zatwierdzona')} className="ml-0.5 w-5 h-5 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors" title="Zatwierdź">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDyzurDecision(d.id, 'odrzucona')} className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors" title="Odrzuć">
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => toggleDyzurAdmin(d.ministrant_id, dzienIdx)}
                                className="ml-0.5 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {dostepniMinistranci.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Input
                            type="time"
                            className="h-8 w-[120px] px-2 text-xs"
                            value={grafikAddHourByDay[dzienIdx] || ''}
                            onChange={(e) => setGrafikAddHourByDay((prev) => ({ ...prev, [dzienIdx]: e.target.value }))}
                          />
                          <select
                            className="text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 bg-white dark:bg-gray-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                void toggleDyzurAdmin(e.target.value, dzienIdx, grafikAddHourByDay[dzienIdx] || null);
                              }
                            }}
                          >
                            <option value="">+ dodaj</option>
                            {dostepniMinistranci.map(m => (
                              <option key={m.id} value={m.profile_id}>
                                {m.imie} {m.nazwisko || ''}
                              </option>
                            ))}
                          </select>
                        </div>
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

      {/* Modal historia punktów ministranta */}
      <Dialog
        open={showPunktyHistoriaModal}
        onOpenChange={(open) => {
          setShowPunktyHistoriaModal(open);
          if (!open) setSelectedPunktyHistoriaMember(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Historia punktów
              {selectedPunktyHistoriaMember && (
                <span className="ml-2 text-base font-semibold text-gray-600 dark:text-gray-300">
                  {`${selectedPunktyHistoriaMember.imie} ${selectedPunktyHistoriaMember.nazwisko || ''}`.trim()}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Aktualnie: {selectedPunktyHistoriaMember ? Number(rankingData.find((r) => r.ministrant_id === selectedPunktyHistoriaMember.profile_id)?.total_pkt || 0) : 0} pkt
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-2">
            {selectedMemberPunktyHistoria.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Brak historii punktów.</p>
	            ) : (
	              selectedMemberPunktyHistoria.map((item) => {
	                const entryKey = `${item.kind}:${item.id}`;
	                const isDeleting = deletingPunktyHistoriaEntryKey === entryKey;
	                if (item.kind === 'obecnosc') {
	                  const o = item.obec;
	                  const d = new Date(`${o.data}T00:00:00`);
	                  const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
	                  const eventLabel = o.typ === 'msza'
	                    ? 'Msza'
	                    : o.typ === 'nabożeństwo'
	                      ? (o.nazwa_nabożeństwa || 'Nabożeństwo')
	                      : o.typ === 'wydarzenie'
	                        ? `Wydarzenie: ${o.nazwa_nabożeństwa || '—'}`
	                        : `Aktywność: ${o.nazwa_nabożeństwa || '—'}`;
	                  return (
	                    <div key={o.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-2.5 flex items-center justify-between gap-3">
	                      <div className="min-w-0">
	                        <div className="text-sm font-semibold truncate">{dayName} {d.toLocaleDateString('pl-PL')}</div>
	                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{eventLabel}</div>
	                        <div className="mt-1 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
	                          Zatwierdzona
	                        </div>
	                      </div>
	                      <div className="flex items-center gap-2 shrink-0">
	                        <div className="text-sm font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
	                          +{o.punkty_finalne}
	                        </div>
	                        {canManageRankingSettings && (
	                          <button
	                            type="button"
	                            disabled={isDeleting}
	                            onClick={() => void usunWpisPunktowy(item)}
	                            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
	                            title="Usuń wpis"
	                          >
	                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
	                          </button>
	                        )}
	                      </div>
	                    </div>
	                  );
	                }

	                if (item.kind === 'minusowe') {
	                  const m = item.minusowe;
	                  const d = new Date(`${m.data}T00:00:00`);
	                  const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
	                  const cleanedPowod = cleanHistoriaPowod(m.powod);
	                  const powodLabel = cleanedPowod || 'Minusowe punkty';
	                  return (
	                    <div key={m.id} className="rounded-xl border p-2.5 flex items-center justify-between gap-3 border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10">
	                      <div className="min-w-0">
	                        <div className="text-sm font-semibold truncate">{dayName} {d.toLocaleDateString('pl-PL')}</div>
	                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
	                          {powodLabel}
	                        </div>
	                      </div>
	                      <div className="flex items-center gap-2 shrink-0">
	                        <div className="text-sm font-extrabold tabular-nums text-red-600 dark:text-red-400">
	                          {m.punkty}
	                        </div>
	                        {canManageRankingSettings && (
	                          <button
	                            type="button"
	                            disabled={isDeleting}
	                            onClick={() => void usunWpisPunktowy(item)}
	                            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
	                            title="Usuń wpis"
	                          >
	                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
	                          </button>
	                        )}
	                      </div>
	                    </div>
	                  );
	                }

	                const p = item.korekta;
	                const d = new Date(`${p.data}T00:00:00`);
	                const dayName = DNI_TYGODNIA[d.getDay() === 0 ? 6 : d.getDay() - 1];
	                const isPlus = Number(p.punkty) > 0;
	                const cleanedPowod = cleanHistoriaPowod(p.powod);
	                const powodLabel = cleanedPowod && cleanedPowod !== 'Ręczna korekta punktów'
                  ? cleanedPowod
                  : '';
	                return (
	                  <div key={p.id} className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 ${isPlus ? 'border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-900/10' : 'border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10'}`}>
	                    <div className="min-w-0">
	                      <div className="text-sm font-semibold truncate">{dayName} {d.toLocaleDateString('pl-PL')}</div>
	                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
	                        Ksiądz{powodLabel ? ` • ${powodLabel}` : ''}
	                      </div>
	                    </div>
	                    <div className="flex items-center gap-2 shrink-0">
	                      <div className={`text-sm font-extrabold tabular-nums ${isPlus ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
	                        {isPlus ? `+${p.punkty}` : p.punkty}
	                      </div>
	                      {canManageRankingSettings && (
	                        <button
	                          type="button"
	                          disabled={isDeleting}
	                          onClick={() => void usunWpisPunktowy(item)}
	                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
	                          title="Usuń wpis"
	                        >
	                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
	                        </button>
	                      )}
	                    </div>
	                  </div>
	                );
	              })
	            )}
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

      {/* Modal usuwania parafii usunięty — logika przeniesiona do window.confirm/prompt */}

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

      {/* Modal: włącz/wyłącz zgłoszenia aktywności */}
      <Dialog open={showToggleAktywnoscZgloszenModal} onOpenChange={setShowToggleAktywnoscZgloszenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{aktywnoscZgloszeniaWlaczone ? 'Wyłącz zgłoszenia aktywności' : 'Włącz zgłoszenia aktywności'}</DialogTitle>
            <DialogDescription>
              Możesz włączyć lub wyłączyć możliwość zgłaszania przez ministrantów aktywności do dodatkowych punktów.
              {aktywnoscZgloszeniaWlaczone
                ? ' Po wyłączeniu ministranci nie będą mogli wysyłać nowych zgłoszeń aktywności.'
                : ' Po włączeniu ministranci znów będą mogli zgłaszać aktywności.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowToggleAktywnoscZgloszenModal(false)} disabled={toggleAktywnoscZgloszenSaving}>
              Anuluj
            </Button>
            <Button
              onClick={() => { void handleToggleAktywnoscZgloszen(); }}
              className={aktywnoscZgloszeniaWlaczone
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
              disabled={toggleAktywnoscZgloszenSaving}
            >
              {toggleAktywnoscZgloszenSaving
                ? 'Zapisywanie...'
                : aktywnoscZgloszeniaWlaczone
                  ? 'Wyłącz zgłoszenia'
                  : 'Włącz zgłoszenia'}
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
              const existingDyzur = dyzury.find(d => d.ministrant_id === selectedMember?.profile_id && d.dzien_tygodnia === dzienIdx);
              const isActive = !!existingDyzur;
              const isPending = existingDyzur?.status === 'oczekuje';
              return (
                <div key={i} className="flex gap-2 items-center">
                  <Button
                    variant={isActive ? (isPending ? 'outline' : 'default') : 'outline'}
                    className={`flex-1 justify-start ${isPending ? 'border-amber-400 text-amber-700 dark:text-amber-300' : ''}`}
                    onClick={() => selectedMember && (isPending ? handleDyzurDecision(existingDyzur!.id, 'zatwierdzona') : toggleDyzurAdmin(selectedMember.profile_id, dzienIdx))}
                  >
                    {isPending ? <Clock className="w-4 h-4 mr-2" /> : isActive ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {dzien}
                    {isPending && <span className="ml-auto text-xs font-bold text-amber-500">Oczekuje</span>}
                  </Button>
                  {isPending && (
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDyzurDecision(existingDyzur!.id, 'odrzucona')}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="pt-2">
            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold" onClick={() => setShowDyzuryAdminModal(false)}>
              <Check className="w-4 h-4 mr-2" />
              Zatwierdź
            </Button>
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
          {dyzury.some(d => d.ministrant_id === currentUser?.id && d.status === 'zatwierdzona') && (
            <div className="mx-4 mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Dodanie kolejnego dnia zapisuje się od razu. Zmiana istniejącego dnia wymaga akceptacji księdza.
              </p>
            </div>
          )}
          <div className="p-4 pt-2 space-y-2">
            {DNI_TYGODNIA_FULL.map((dzien, i) => {
              const dzienIdx = i === 6 ? 0 : i + 1;
              const myDyzur = dyzury.find(d => d.ministrant_id === currentUser?.id && d.dzien_tygodnia === dzienIdx);
              const isActive = !!myDyzur;
              const isPending = myDyzur?.status === 'oczekuje';
              const isApproved = myDyzur?.status === 'zatwierdzona';
              const dyzurGodzina = myDyzur?.godzina?.trim() || '';
              return (
                <button
                  key={i}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isApproved ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/60 dark:hover:bg-red-900/10' : isPending ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  onClick={() => handleDyzurClick(dzienIdx)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPending ? 'bg-amber-400 text-white' : isApproved ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    {isPending ? <Clock className="w-4 h-4" /> : isApproved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <span className={`font-bold text-sm ${isPending ? 'text-amber-700 dark:text-amber-300' : isApproved ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{dzien}</span>
                  {dyzurGodzina && <span className="ml-auto text-xs font-semibold text-gray-600 dark:text-gray-300">{dyzurGodzina}</span>}
                  {isPending && <span className={`${dyzurGodzina ? 'ml-2' : 'ml-auto'} text-[10px] font-bold text-amber-500 uppercase`}>Cofnij wniosek</span>}
                  {isApproved && <span className={`${dyzurGodzina ? 'ml-2' : 'ml-auto'} text-[10px] font-bold text-red-500 uppercase`}>Usuń dyżur</span>}
                  {!isActive && <span className="ml-auto text-[10px] text-gray-400">Wybierz</span>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog potwierdzenia dyżuru */}
      <Dialog open={!!dyzurConfirm} onOpenChange={(open) => { if (!open) setDyzurConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dyzurConfirm?.type === 'first'
                ? 'Potwierdź dyżur'
                : dyzurConfirm?.type === 'add'
                  ? 'Dodaj dzień dyżuru'
                  : 'Zmiana dyżuru'}
            </DialogTitle>
            <DialogDescription>
              {dyzurConfirm?.type === 'first'
                ? `Czy chcesz wybrać ${DNI_TYGODNIA_FULL[dyzurConfirm.dzien === 0 ? 6 : dyzurConfirm.dzien - 1]} jako dzień dyżuru?`
                : dyzurConfirm?.type === 'add'
                  ? `Czy chcesz dodać kolejny dzień dyżuru: ${dyzurConfirm ? DNI_TYGODNIA_FULL[dyzurConfirm.dzien === 0 ? 6 : dyzurConfirm.dzien - 1] : ''}? Ten dzień zostanie zapisany od razu.`
                  : `Zmiana na dzień (${dyzurConfirm ? DNI_TYGODNIA_FULL[dyzurConfirm.dzien === 0 ? 6 : dyzurConfirm.dzien - 1] : ''}) wymaga akceptacji księdza. Po akceptacji poprzedni dyżur zostanie zastąpiony. Czy chcesz wysłać prośbę?`
              }
            </DialogDescription>
          </DialogHeader>
          {dyzurConfirm?.allowModeChoice && (
            <div className="space-y-1">
              <Label>Co chcesz zrobić?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={dyzurConfirm.type === 'add' ? 'default' : 'outline'}
                  onClick={() => setDyzurConfirm((prev) => (prev ? { ...prev, type: 'add', replaceFromDzien: null } : prev))}
                >
                  Dodaj kolejny
                </Button>
                <Button
                  type="button"
                  variant={dyzurConfirm.type === 'change' ? 'default' : 'outline'}
                  onClick={() => setDyzurConfirm((prev) => {
                    if (!prev) return prev;
                    const approvedDays = dyzury
                      .filter((d) => d.ministrant_id === currentUser?.id && d.status === 'zatwierdzona')
                      .sort((a, b) => a.dzien_tygodnia - b.dzien_tygodnia);
                    const defaultReplaceFrom = approvedDays.length === 1 ? approvedDays[0].dzien_tygodnia : null;
                    return { ...prev, type: 'change', replaceFromDzien: defaultReplaceFrom };
                  })}
                >
                  Zmień istniejący
                </Button>
              </div>
            </div>
          )}
          {dyzurConfirm?.type === 'change' && (
            <div className="space-y-1">
              <Label>Który dzień chcesz zmienić?</Label>
              <Select
                value={dyzurConfirm.replaceFromDzien !== null ? String(dyzurConfirm.replaceFromDzien) : '__none__'}
                onValueChange={(value) =>
                  setDyzurConfirm((prev) =>
                    prev
                      ? {
                        ...prev,
                        replaceFromDzien: value === '__none__' ? null : Number(value),
                      }
                      : prev
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz obecny dzień dyżuru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Wybierz dzień</SelectItem>
                  {dyzury
                    .filter((d) => d.ministrant_id === currentUser?.id && d.status === 'zatwierdzona')
                    .sort((a, b) => a.dzien_tygodnia - b.dzien_tygodnia)
                    .map((d) => {
                      const dayName = DNI_TYGODNIA_FULL[d.dzien_tygodnia === 0 ? 6 : d.dzien_tygodnia - 1];
                      const godzina = d.godzina?.trim();
                      return (
                        <SelectItem key={d.id} value={String(d.dzien_tygodnia)}>
                          {dayName}{godzina ? ` • ${godzina}` : ''}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="dyzur-godzina">Godzina (opcjonalnie)</Label>
            <Input
              id="dyzur-godzina"
              type="time"
              value={dyzurConfirm?.godzina || ''}
              onChange={(e) => setDyzurConfirm((prev) => (prev ? { ...prev, godzina: e.target.value } : prev))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDyzurConfirm(null)}>Anuluj</Button>
            <Button onClick={confirmDyzur}>
              {dyzurConfirm?.type === 'change'
                ? 'Wyślij prośbę'
                : dyzurConfirm?.type === 'add'
                  ? 'Dodaj dzień'
                  : 'Tak, wybieram'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal usuwania parafii */}
      <Dialog open={showDeleteParafiaModal !== null} onOpenChange={(open) => { if (!open) { setShowDeleteParafiaModal(null); setDeleteParafiaConfirmText(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Usuń parafię
            </DialogTitle>
            <DialogDescription>
              {showDeleteParafiaModal === 1
                ? `Czy na pewno chcesz usunąć parafię "${currentParafia?.nazwa || ''}"?`
                : 'Wpisz KASUJ aby ostatecznie potwierdzić usunięcie.'}
            </DialogDescription>
          </DialogHeader>

          {showDeleteParafiaModal === 1 && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold mb-1">Zostaną trwale usunięte:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Wszystkie dane parafii</li>
                  <li>Konta ministrantów</li>
                  <li>Twoje konto księdza</li>
                </ul>
                <p className="mt-2 font-semibold">Tej operacji nie można cofnąć!</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteParafiaModal(null); }}>
                  Anuluj
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setShowDeleteParafiaModal(2)}>
                  Tak, chcę usunąć
                </Button>
              </div>
            </div>
          )}

          {showDeleteParafiaModal === 2 && (
            <div className="space-y-3">
              <div>
                <Label>Wpisz KASUJ aby potwierdzić</Label>
                <Input
                  value={deleteParafiaConfirmText}
                  onChange={(e) => setDeleteParafiaConfirmText(e.target.value)}
                  placeholder="KASUJ"
                  className="mt-1 uppercase font-mono"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteParafiaModal(null); setDeleteParafiaConfirmText(''); }}>
                  Anuluj
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteParafiaConfirmText.trim().toUpperCase() !== 'KASUJ' || deleteParafiaLoading}
                  onClick={() => { handleDeleteParafia(); }}
                >
                  {deleteParafiaLoading ? 'Usuwanie...' : 'Potwierdź usunięcie'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Premium */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" />
              Subskrypcja Premium
            </DialogTitle>
            <DialogDescription>
              Zarządzaj statusem konta parafii. W razie problemów prosimy o kontakt: lsoministranci@gmail.com
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {subscription ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-lg text-amber-700 dark:text-amber-400">Konto Premium Aktywne</h3>
                  <p className="text-sm text-amber-600/80 dark:text-amber-500/80 mt-1">
                    Nieograniczona liczba ministrantów
                  </p>
                  {premiumDaysLeft !== null && (
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mt-2">
                      {premiumDaysLeft === 0 ? 'Koniec okresu: dzisiaj' : `Do końca okresu: ${premiumDaysLeft} dni`}
                    </p>
                  )}
                  {subscription.premium_expires_at && !Number.isNaN(new Date(subscription.premium_expires_at).getTime()) && (
                    <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                      Data końca: {new Date(subscription.premium_expires_at).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                </div>

                {subscription.premium_source === 'stripe' && canUseStripeBilling && (
                  <Button onClick={handleOpenStripePortal} disabled={premiumPortalLoading} className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {premiumPortalLoading ? 'Otwieranie...' : 'Zarządzaj płatnością (abonament)'}
                  </Button>
                )}
                {subscription.premium_source === 'stripe' && !canUseStripeBilling && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                    {mobilePremiumBillingInfo}
                  </div>
                )}
                {subscription.premium_source !== 'stripe' && canUseStripeBilling && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20">
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        Dane do faktury (opcjonalne)
                      </p>
                      <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                        Rozwiń tylko jeśli chcesz otrzymać fakturę.
                      </p>
                      <Button
                        type="button"
                        variant={premiumInvoiceRequested ? 'default' : 'outline'}
                        className="mt-3 w-full"
                        onClick={togglePremiumInvoiceRequested}
                      >
                        {premiumInvoiceRequested ? 'Faktura: włączona' : 'Chcę fakturę'}
                      </Button>

                      {premiumInvoiceRequested && (
                        <>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button
                          type="button"
                          variant={premiumInvoiceForm.invoiceType === 'company' ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => setPremiumInvoiceField('invoiceType', 'company')}
                        >
                          Firma / parafia
                        </Button>
                        <Button
                          type="button"
                          variant={premiumInvoiceForm.invoiceType === 'private' ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => setPremiumInvoiceField('invoiceType', 'private')}
                        >
                          Osoba prywatna
                        </Button>
                      </div>

                      <div className="grid gap-2 mt-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label className={getPremiumInvoiceLabelClass('email')}>E-mail do faktury</Label>
                          <Input
                            type="email"
                            value={premiumInvoiceForm.email}
                            onChange={(e) => setPremiumInvoiceField('email', e.target.value)}
                            placeholder="np. parafia@domena.pl"
                            className={getPremiumInvoiceFieldClass('email')}
                          />
                          {renderPremiumInvoiceError('email')}
                        </div>
                        <div className="sm:col-span-2">
                          <Label className={getPremiumInvoiceLabelClass('fullName')}>Imię i nazwisko</Label>
                          <Input
                            value={premiumInvoiceForm.fullName}
                            onChange={(e) => setPremiumInvoiceField('fullName', e.target.value)}
                            placeholder="Jan Kowalski"
                            className={getPremiumInvoiceFieldClass('fullName')}
                          />
                          {renderPremiumInvoiceError('fullName')}
                        </div>
                        {premiumInvoiceForm.invoiceType === 'company' && (
                          <>
                            <div className="sm:col-span-2">
                              <Label className={getPremiumInvoiceLabelClass('companyName')}>Nazwa firmy / parafii</Label>
                              <Input
                                value={premiumInvoiceForm.companyName}
                                onChange={(e) => setPremiumInvoiceField('companyName', e.target.value)}
                                placeholder="Parafia pw. ..."
                                className={getPremiumInvoiceFieldClass('companyName')}
                              />
                              {renderPremiumInvoiceError('companyName')}
                            </div>
                            <div className="sm:col-span-2">
                              <Label className={getPremiumInvoiceLabelClass('taxId')}>NIP / VAT ID</Label>
                              <Input
                                value={premiumInvoiceForm.taxId}
                                onChange={(e) => setPremiumInvoiceField('taxId', e.target.value)}
                                placeholder="np. 1234567890 lub PL1234567890"
                                className={getPremiumInvoiceFieldClass('taxId')}
                              />
                              {renderPremiumInvoiceError('taxId')}
                            </div>
                          </>
                        )}
                        <div className="sm:col-span-2">
                          <Label className={getPremiumInvoiceLabelClass('street')}>Ulica i numer</Label>
                          <Input
                            value={premiumInvoiceForm.street}
                            onChange={(e) => setPremiumInvoiceField('street', e.target.value)}
                            placeholder="ul. Kwiatowa 12"
                            className={getPremiumInvoiceFieldClass('street')}
                          />
                          {renderPremiumInvoiceError('street')}
                        </div>
                        <div>
                          <Label className={getPremiumInvoiceLabelClass('postalCode')}>Kod pocztowy</Label>
                          <Input
                            value={premiumInvoiceForm.postalCode}
                            onChange={(e) => setPremiumInvoiceField('postalCode', e.target.value)}
                            placeholder="00-000"
                            className={getPremiumInvoiceFieldClass('postalCode')}
                          />
                          {renderPremiumInvoiceError('postalCode')}
                        </div>
                        <div>
                          <Label className={getPremiumInvoiceLabelClass('city')}>Miasto</Label>
                          <Input
                            value={premiumInvoiceForm.city}
                            onChange={(e) => setPremiumInvoiceField('city', e.target.value)}
                            placeholder="Warszawa"
                            className={getPremiumInvoiceFieldClass('city')}
                          />
                          {renderPremiumInvoiceError('city')}
                        </div>
                        <div>
                          <Label className={getPremiumInvoiceLabelClass('country')}>Kraj</Label>
                          <Input
                            value="PL"
                            readOnly
                            disabled
                            maxLength={2}
                            className={`bg-gray-100 dark:bg-gray-800 ${getPremiumInvoiceFieldClass('country')}`}
                          />
                          {renderPremiumInvoiceError('country')}
                        </div>
                      </div>
                      <label className={`mt-3 flex items-start gap-2 text-xs ${premiumInvoiceErrors.consentEmailInvoice ? 'text-red-700 dark:text-red-300' : 'text-indigo-800 dark:text-indigo-200'}`}>
                        <input
                          type="checkbox"
                          className={`mt-0.5 ${premiumInvoiceErrors.consentEmailInvoice ? 'accent-red-600' : ''}`}
                          checked={premiumInvoiceForm.consentEmailInvoice}
                          onChange={(e) => setPremiumInvoiceField('consentEmailInvoice', e.target.checked)}
                        />
                        Zezwalam na wysłanie faktury e-mailem na podany adres.
                      </label>
                      {renderPremiumInvoiceError('consentEmailInvoice')}
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleStartStripeOneTimeCheckout}
                      disabled={premiumOneTimeCheckoutLoading}
                      className="w-full"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {premiumOneTimeCheckoutLoading ? 'Przechodzę do płatności...' : 'Odnów Premium na rok (jednorazowo)'}
                    </Button>
                  </div>
                )}
                {subscription.premium_source !== 'stripe' && !canUseStripeBilling && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                    {mobilePremiumBillingInfo}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info o limicie */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Plan darmowy</p>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length} / {DARMOWY_LIMIT_MINISTRANTOW} ministrantów
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length / DARMOWY_LIMIT_MINISTRANTOW) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/70">
                    {members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length >= DARMOWY_LIMIT_MINISTRANTOW
                      ? 'Osiągnięto limit — aktywuj Premium, aby dodać więcej ministrantów.'
                      : `Możesz dodać jeszcze ${DARMOWY_LIMIT_MINISTRANTOW - members.filter(m => m.typ === 'ministrant' && m.zatwierdzony !== false).length} ministrantów za darmo.`}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg text-center">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4" /> Premium = nieograniczona liczba ministrantów
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-500/60 mt-1">
                    Wszystkie funkcje dostępne w obu planach. Jedyna różnica to limit ministrantów.
                  </p>
                </div>

                {!canUseStripeBilling && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                      {mobilePremiumBillingInfo}
                    </div>
                    {isAndroidAppContext && (
                      <>
                        <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Google Play Billing
                          </p>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                            Cena - 299zł/rok
                          </p>
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                            Przedpłata roczna (bez auto-odnowienia). Odnowisz ręcznie.
                          </p>
                        </div>
                        <Button
                          onClick={handleStartGooglePlayCheckout}
                          disabled={googlePlayCheckoutLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {googlePlayCheckoutLoading ? 'Otwieranie Google Play...' : 'Zapłać jednorazowo za 1 rok'}
                        </Button>
                      </>
                    )}
                    {isIosAppContext && (
                      <>
                        <div className="p-3 rounded-lg border border-sky-300 dark:border-sky-700 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
                          <p className="text-sm font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            App Store Billing
                          </p>
                          <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 mt-1">
                            Cena - 299zł/rok
                          </p>
                          <p className="text-xs text-sky-700/80 dark:text-sky-300/80 mt-1">
                            Zakup roczny przez App Store. Odnowienie kontrolujesz w Apple ID.
                          </p>
                        </div>
                        <Button
                          onClick={handleStartAppleCheckout}
                          disabled={appleCheckoutLoading}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {appleCheckoutLoading ? 'Otwieranie App Store...' : 'Zapłać jednorazowo za 1 rok'}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {canUseStripeBilling && (
                  <>
                <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Płatność Premium
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                    Cena - 249zł/rok
                  </p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                    Wybierz sposób płatności: abonament roczny (auto-odnowienie) albo jednorazowo na 1 rok.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    Dane do faktury (opcjonalne)
                  </p>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                    Rozwiń tylko jeśli chcesz otrzymać fakturę.
                  </p>
                  <Button
                    type="button"
                    variant={premiumInvoiceRequested ? 'default' : 'outline'}
                    className="mt-3 w-full"
                    onClick={togglePremiumInvoiceRequested}
                  >
                    {premiumInvoiceRequested ? 'Faktura: włączona' : 'Chcę fakturę'}
                  </Button>

                  {premiumInvoiceRequested && (
                    <>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                      type="button"
                      variant={premiumInvoiceForm.invoiceType === 'company' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setPremiumInvoiceField('invoiceType', 'company')}
                    >
                      Firma / parafia
                    </Button>
                    <Button
                      type="button"
                      variant={premiumInvoiceForm.invoiceType === 'private' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setPremiumInvoiceField('invoiceType', 'private')}
                    >
                      Osoba prywatna
                    </Button>
                  </div>

                  <div className="grid gap-2 mt-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label className={getPremiumInvoiceLabelClass('email')}>E-mail do faktury</Label>
                      <Input
                        type="email"
                        value={premiumInvoiceForm.email}
                        onChange={(e) => setPremiumInvoiceField('email', e.target.value)}
                        placeholder="np. parafia@domena.pl"
                        className={getPremiumInvoiceFieldClass('email')}
                      />
                      {renderPremiumInvoiceError('email')}
                    </div>
                    <div className="sm:col-span-2">
                      <Label className={getPremiumInvoiceLabelClass('fullName')}>Imię i nazwisko</Label>
                      <Input
                        value={premiumInvoiceForm.fullName}
                        onChange={(e) => setPremiumInvoiceField('fullName', e.target.value)}
                        placeholder="Jan Kowalski"
                        className={getPremiumInvoiceFieldClass('fullName')}
                      />
                      {renderPremiumInvoiceError('fullName')}
                    </div>
                    {premiumInvoiceForm.invoiceType === 'company' && (
                      <>
                        <div className="sm:col-span-2">
                          <Label className={getPremiumInvoiceLabelClass('companyName')}>Nazwa firmy / parafii</Label>
                          <Input
                            value={premiumInvoiceForm.companyName}
                            onChange={(e) => setPremiumInvoiceField('companyName', e.target.value)}
                            placeholder="Parafia pw. ..."
                            className={getPremiumInvoiceFieldClass('companyName')}
                          />
                          {renderPremiumInvoiceError('companyName')}
                        </div>
                        <div className="sm:col-span-2">
                          <Label className={getPremiumInvoiceLabelClass('taxId')}>NIP / VAT ID</Label>
                          <Input
                            value={premiumInvoiceForm.taxId}
                            onChange={(e) => setPremiumInvoiceField('taxId', e.target.value)}
                            placeholder="np. 1234567890 lub PL1234567890"
                            className={getPremiumInvoiceFieldClass('taxId')}
                          />
                          {renderPremiumInvoiceError('taxId')}
                        </div>
                      </>
                    )}
                    <div className="sm:col-span-2">
                      <Label className={getPremiumInvoiceLabelClass('street')}>Ulica i numer</Label>
                      <Input
                        value={premiumInvoiceForm.street}
                        onChange={(e) => setPremiumInvoiceField('street', e.target.value)}
                        placeholder="ul. Kwiatowa 12"
                        className={getPremiumInvoiceFieldClass('street')}
                      />
                      {renderPremiumInvoiceError('street')}
                    </div>
                    <div>
                      <Label className={getPremiumInvoiceLabelClass('postalCode')}>Kod pocztowy</Label>
                      <Input
                        value={premiumInvoiceForm.postalCode}
                        onChange={(e) => setPremiumInvoiceField('postalCode', e.target.value)}
                        placeholder="00-000"
                        className={getPremiumInvoiceFieldClass('postalCode')}
                      />
                      {renderPremiumInvoiceError('postalCode')}
                    </div>
                    <div>
                      <Label className={getPremiumInvoiceLabelClass('city')}>Miasto</Label>
                      <Input
                        value={premiumInvoiceForm.city}
                        onChange={(e) => setPremiumInvoiceField('city', e.target.value)}
                        placeholder="Warszawa"
                        className={getPremiumInvoiceFieldClass('city')}
                      />
                      {renderPremiumInvoiceError('city')}
                    </div>
                    <div>
                      <Label className={getPremiumInvoiceLabelClass('country')}>Kraj</Label>
                      <Input
                        value="PL"
                        readOnly
                        disabled
                        maxLength={2}
                        className={`bg-gray-100 dark:bg-gray-800 ${getPremiumInvoiceFieldClass('country')}`}
                      />
                      {renderPremiumInvoiceError('country')}
                    </div>
                  </div>
                  <label className={`mt-3 flex items-start gap-2 text-xs ${premiumInvoiceErrors.consentEmailInvoice ? 'text-red-700 dark:text-red-300' : 'text-indigo-800 dark:text-indigo-200'}`}>
                    <input
                      type="checkbox"
                      className={`mt-0.5 ${premiumInvoiceErrors.consentEmailInvoice ? 'accent-red-600' : ''}`}
                      checked={premiumInvoiceForm.consentEmailInvoice}
                      onChange={(e) => setPremiumInvoiceField('consentEmailInvoice', e.target.checked)}
                    />
                    Zezwalam na wysłanie faktury e-mailem na podany adres.
                  </label>
                  {renderPremiumInvoiceError('consentEmailInvoice')}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Button onClick={handleStartStripeCheckout} disabled={premiumCheckoutLoading} className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {premiumCheckoutLoading ? 'Przechodzę do płatności...' : 'Zapłać online za Premium (rok)'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Abonament odnawia się automatycznie co rok (karta/Apple Pay).
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleStartStripeOneTimeCheckout}
                    disabled={premiumOneTimeCheckoutLoading}
                    className="w-full border border-amber-300 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 text-slate-900 font-semibold hover:from-amber-200 hover:via-orange-200 hover:to-amber-300"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {premiumOneTimeCheckoutLoading ? 'Przechodzę do płatności...' : 'Zapłać jednorazowo za 1 rok (BLIK/online)'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Wersja jednorazowa: brak auto-odnowienia, odnowisz ręcznie przed końcem okresu.
                  </p>
                </div>
                  </>
                )}

                {/* Input kodu */}
                <div className="space-y-2">
                  <Label>Kod rabatowy</Label>
                  <div className="flex gap-2">
                    <Input
                      value={premiumCode}
                      onChange={(e) => setPremiumCode(e.target.value)}
                      placeholder="Wpisz kod"
                      className="font-mono"
                    />
                    <Button onClick={() => handleRedeemCode()} disabled={!premiumCode.trim()}>
                      Aktywuj
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
