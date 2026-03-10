'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Church, Users, Settings, MessageSquare, Trophy,
  LogOut, Search, Trash2, Pencil, Check, X, Plus,
  Moon, Sun, BarChart3, Eye, ChevronDown, ChevronUp,
  Globe, MapPin, Loader2, AlertTriangle,
  Lock, ArrowLeft, Send, Smile, Megaphone, Mail, EyeOff, KeyRound,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Youtube, ImageIcon,
} from 'lucide-react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
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
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LazyEmojiPicker from '@/components/LazyEmojiPicker';

import Image from 'next/image';
import Link from 'next/link';
import { sanitizeRichHtml } from '@/lib/sanitize-rich-html';

// ==================== TYPY ====================

interface Parafia {
  id: string;
  nazwa: string;
  miasto: string;
  adres: string;
  admin_id: string;
  admin_email: string;
  kod_zaproszenia: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  imie: string;
  nazwisko: string;
  typ: 'ksiadz' | 'ministrant';
  parafia_id: string | null;
  created_at: string;
}

interface Member {
  id: string;
  profile_id: string;
  parafia_id: string;
  email: string;
  imie: string;
  nazwisko: string;
  typ: 'ksiadz' | 'ministrant';
  grupa: string | null;
  role: string[];
}

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
  created_at: string;
}

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

interface Rabat {
  id: string;
  kod: string;
  procent_znizki: number;
  jednorazowy: boolean;
  wazny_do: string | null;
  uzycia: number;
  max_uzyc: number;
  created_at: string;
}

interface Stats {
  parafie: number;
  profiles: number;
  ministranci: number;
  ksieza: number;
  obecnosci30: number;
  watki: number;
}

type RenderAttributes = Record<string, string | number | null | undefined>;
type AppConfigRow = { klucz: string; wartosc: string };
type AdminAction =
  | 'loadStats'
  | 'loadParafie'
  | 'loadProfiles'
  | 'loadMembers'
  | 'loadWatki'
  | 'loadPunktacja'
  | 'loadRangi'
  | 'loadOdznaki'
  | 'loadBanery'
  | 'saveBanery'
  | 'findParafiaByCode'
  | 'updateParafia'
  | 'deleteProfile'
  | 'updateProfileType'
  | 'updateMemberGroup'
  | 'deleteMember'
  | 'sendAnnouncement'
  | 'updateAnnouncement'
  | 'deleteWatek'
  | 'updatePunktacjaValue'
  | 'toggleOdznaka'
  | 'fetchRabaty'
  | 'createRabat'
  | 'deleteRabat'
  | 'publishKsiadzPanelTemplate';


// ==================== SUPABASE ====================

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ==================== KOLORY ====================

const KOLOR_KLASY: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-900 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-900 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-900 dark:text-gray-100', border: 'border-gray-300 dark:border-gray-600' },
  brown: { bg: 'bg-orange-200 dark:bg-orange-900/30', text: 'text-orange-950 dark:text-orange-200', border: 'border-orange-400 dark:border-orange-700' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-900 dark:text-teal-200', border: 'border-teal-300 dark:border-teal-700' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-900 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-900 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-900 dark:text-rose-200', border: 'border-rose-300 dark:border-rose-700' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-900 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700' },
};

// ==================== TIPTAP IMAGE NODE VIEW ====================

function TiptapImageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const [showControls, setShowControls] = useState(false);
  const wrapperStyle: React.CSSProperties = { display: 'inline-block' };
  if (node.attrs.float === 'left') Object.assign(wrapperStyle, { float: 'left' as const, margin: '4px 16px 8px 0', maxWidth: '50%' });
  else if (node.attrs.float === 'right') Object.assign(wrapperStyle, { float: 'right' as const, margin: '4px 0 8px 16px', maxWidth: '50%' });
  else if (node.attrs.float === 'center') Object.assign(wrapperStyle, { display: 'block', textAlign: 'center' as const, margin: '8px 0' });
  const imgStyle: React.CSSProperties = { maxWidth: '100%', borderRadius: '8px', cursor: 'pointer', ...(node.attrs.width ? { width: `${node.attrs.width}px` } : {}) };
  return (
    <NodeViewWrapper as="span" style={wrapperStyle} className="tiptap-image-wrapper">
      <span className="relative inline-block" onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={node.attrs.src} alt={node.attrs.alt || ''} style={imgStyle} className={selected ? 'outline-2 outline-indigo-500 outline-offset-2' : ''} />
        {showControls && (
          <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/80 backdrop-blur-sm rounded-lg p-1 z-10" onMouseDown={(e) => e.preventDefault()}>
            {[{ label: 'S', w: 150 }, { label: 'M', w: 300 }, { label: 'L', w: 500 }, { label: 'Auto', w: null }].map(p => (
              <button key={p.label} type="button" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.width == p.w ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ width: p.w })}>{p.label}</button>
            ))}
            <span className="inline-block w-px h-3.5 bg-white/30 mx-0.5" />
            {[{ label: '\u2190', v: 'left', title: 'Lewo' }, { label: '\u2194', v: 'center', title: 'Srodek' }, { label: '\u2192', v: 'right', title: 'Prawo' }].map(o => (
              <button key={o.title} type="button" title={o.title} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.float === o.v ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ float: node.attrs.float === o.v ? null : o.v })}>{o.label}</button>
            ))}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}

// ==================== TIPTAP YOUTUBE NODE VIEW ====================

function TiptapYoutubeView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const [showControls, setShowControls] = useState(false);
  const wrapperStyle: React.CSSProperties = { display: 'inline-block' };
  if (node.attrs.float === 'left') Object.assign(wrapperStyle, { float: 'left' as const, margin: '4px 16px 8px 0', maxWidth: '50%' });
  else if (node.attrs.float === 'right') Object.assign(wrapperStyle, { float: 'right' as const, margin: '4px 0 8px 16px', maxWidth: '50%' });
  else if (node.attrs.float === 'center') Object.assign(wrapperStyle, { display: 'block', textAlign: 'center' as const, margin: '8px 0' });
  const iframeWidth = node.attrs.width || 480;
  const iframeHeight = Math.round(iframeWidth * (320 / 480));
  return (
    <NodeViewWrapper as="span" style={wrapperStyle} className="tiptap-youtube-wrapper">
      <span className="relative inline-block" onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)}>
        <iframe src={node.attrs.src} width={iframeWidth} height={iframeHeight} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style={{ maxWidth: '100%', borderRadius: '8px', border: 'none' }} className={selected ? 'outline-2 outline-indigo-500 outline-offset-2' : ''} />
        {showControls && (
          <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/80 backdrop-blur-sm rounded-lg p-1 z-10" onMouseDown={(e) => e.preventDefault()}>
            {[{ label: 'S', w: 200 }, { label: 'M', w: 350 }, { label: 'L', w: 500 }, { label: 'Auto', w: null }].map(p => (
              <button key={p.label} type="button" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.width == p.w ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ width: p.w })}>{p.label}</button>
            ))}
            <span className="inline-block w-px h-3.5 bg-white/30 mx-0.5" />
            {[{ label: '\u2190', v: 'left', title: 'Lewo' }, { label: '\u2194', v: 'center', title: 'Srodek' }, { label: '\u2192', v: 'right', title: 'Prawo' }].map(o => (
              <button key={o.title} type="button" title={o.title} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.attrs.float === o.v ? 'bg-indigo-500 text-white' : 'text-white/80 hover:bg-white/20'}`} onClick={() => updateAttributes({ float: node.attrs.float === o.v ? null : o.v })}>{o.label}</button>
            ))}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}

// ==================== GRUPY DOCELOWE ====================

const GRUPY_DOCELOWE = [
  { nazwa: 'wszyscy', emoji: '\uD83D\uDC65', label: 'Wszyscy' },
  { nazwa: 'ksieza', emoji: '\u271D\uFE0F', label: 'Tylko ksieza' },
  { nazwa: 'ministranci', emoji: '\u26EA', label: 'Tylko ministranci' },
  { nazwa: 'Kandydaci na ministrantow', emoji: '\uD83D\uDFE1', label: 'Kandydaci' },
  { nazwa: 'Ministranci mlodsi', emoji: '\uD83D\uDD35', label: 'Mlodsi' },
  { nazwa: 'Ministranci starsi', emoji: '\uD83D\uDFE2', label: 'Starsi' },
  { nazwa: 'Lektorzy mlodsi', emoji: '\uD83D\uDFE3', label: 'Lektorzy ml.' },
  { nazwa: 'Lektorzy starsi', emoji: '\uD83D\uDD34', label: 'Lektorzy st.' },
];

// ==================== KOMPONENT GŁÓWNY ====================

export default function AdminPanel() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset-sent' | 'new-password'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // Scope
  const [scope, setScope] = useState<'global' | 'parafia'>('global');
  const [kodParafii, setKodParafii] = useState('');
  const [selectedParafia, setSelectedParafia] = useState<Parafia | null>(null);
  const [scopeError, setScopeError] = useState('');
  const [scopeLoading, setScopeLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardDetail, setDashboardDetail] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<Stats>({ parafie: 0, profiles: 0, ministranci: 0, ksieza: 0, obecnosci30: 0, watki: 0 });
  const [parafie, setParafie] = useState<Parafia[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [watki, setWatki] = useState<TablicaWatek[]>([]);
  const [punktacja, setPunktacja] = useState<PunktacjaConfig[]>([]);
  const [rangi, setRangi] = useState<RangaConfig[]>([]);
  const [odznaki, setOdznaki] = useState<OdznakaConfig[]>([]);
  const [recentParafie, setRecentParafie] = useState<Parafia[]>([]);
  const [rabaty, setRabaty] = useState<Rabat[]>([]);
  const [nowyRabat, setNowyRabat] = useState({
    kod: '',
    procent_znizki: 10,
    max_uzyc: 1,
    wazny_do: '',
  });
  const [loadingRabaty, setLoadingRabaty] = useState(true);

  // Banery powitalne
  const [banerMinistrant, setBanerMinistrant] = useState({ tytul: '', opis: '' });
  const [banerKsiadz, setBanerKsiadz] = useState({ tytul: '', opis: '' });
  const [banerLoading, setBanerLoading] = useState(false);
  const [banerExpanded, setBanerExpanded] = useState(false);

  // Search
  const [searchParafie, setSearchParafie] = useState('');
  const [searchUsers, setSearchUsers] = useState('');

  // Modals
  const [editParafia, setEditParafia] = useState<Parafia | null>(null);
  const [editParafiaForm, setEditParafiaForm] = useState({ nazwa: '', miasto: '', adres: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ tytul: '', tresc: '', grupa_docelowa: 'wszyscy' });
  const [editingWatekId, setEditingWatekId] = useState<string | null>(null);
  const [editPunktacja, setEditPunktacja] = useState<PunktacjaConfig | null>(null);
  const [editPunktacjaValue, setEditPunktacjaValue] = useState('');

  // Status
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Tiptap state
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [embeddedPanel, setEmbeddedPanel] = useState<'none' | 'ksiadz' | 'ministrant'>('none');
  const [previewPanelParafiaId, setPreviewPanelParafiaId] = useState('');
  const [publishScope, setPublishScope] = useState<'all' | 'new' | 'specific'>('all');
  const [publishTargetParafiaIds, setPublishTargetParafiaIds] = useState<string[]>([]);

  const adminRequest = useCallback(async <T,>(action: AdminAction, payload?: Record<string, unknown>) => {
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    const res = await fetch('/api/admin/panel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result?.ok) {
      throw new Error(result?.error || 'Operacja nie powiodla sie');
    }
    return (result?.data as T) ?? (undefined as T);
  }, []);

  const verifyAdminAccess = useCallback(async (accessToken?: string) => {
    let token = accessToken;
    if (!token) {
      const { data: { session } } = await supabaseAuth.auth.getSession();
      token = session?.access_token;
    }
    if (!token) return false;

    const res = await fetch('/api/admin/panel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'loadStats' }),
    });

    const result = await res.json().catch(() => ({}));
    return !!res.ok && !!result?.ok;
  }, []);

  const adminUploadFile = useCallback(async (file: File) => {
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { authorization: `Bearer ${session.access_token}` },
      body: formData,
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result?.ok) {
      throw new Error(result?.error || 'Nie udalo sie wgrac pliku');
    }
    return result.data as { publicUrl: string; ext: string; fileName: string };
  }, []);

  // Tiptap Image extension with float & width + hover controls
  const FloatImage = useMemo(() => TiptapImage.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        float: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-float'), renderHTML: (attributes: RenderAttributes) => attributes.float ? { 'data-float': attributes.float } : {} },
        width: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-width'), renderHTML: (attributes: RenderAttributes) => attributes.width ? { 'data-width': attributes.width } : {} },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(TiptapImageView);
    },
  }), []);

  const FloatYoutube = useMemo(() => YoutubeExtension.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        float: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-float'), renderHTML: (attributes: RenderAttributes) => attributes.float ? { 'data-float': attributes.float } : {} },
        width: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-width'), renderHTML: (attributes: RenderAttributes) => attributes.width ? { 'data-width': attributes.width, style: `width: ${attributes.width}px; max-width: 100%;` } : {} },
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
      setAnnouncementForm(prev => ({ ...prev, tresc: editor.getHTML() }));
    },
  });

  // Editor init on modal open
  const editorInitialized = useRef(false);
  useEffect(() => {
    if (showAnnouncementModal && tiptapEditor && !editorInitialized.current) {
      editorInitialized.current = true;
      queueMicrotask(() => {
        tiptapEditor.commands.setContent(announcementForm.tresc || '');
      });
    }
    if (!showAnnouncementModal) {
      editorInitialized.current = false;
    }
  }, [showAnnouncementModal, tiptapEditor, announcementForm.tresc]);

  // Upload pliku i wstawienie do Tiptap
  const uploadAndInsertFile = async (file: File) => {
    if (!tiptapEditor) return;
    setIsUploadingInline(true);
    try {
      const { publicUrl, ext } = await adminUploadFile(file);
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      if (imageExts.includes(ext)) {
        tiptapEditor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
      } else {
        tiptapEditor.chain().focus().setLink({ href: publicUrl, target: '_blank' }).insertContent(file.name).unsetLink().run();
      }
    } catch (err) {
      alert(err instanceof Error ? `Blad uploadu: ${err.message}` : 'Blad uploadu');
    } finally {
      setIsUploadingInline(false);
    }
  };

  // Renderowanie tresci HTML
  const renderTresc = (text: string) => {
    if (!text) return null;
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return <div className="tiptap-content text-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(text) }} />;
    }
    return <p className="text-sm whitespace-pre-wrap">{text}</p>;
  };

  // ==================== INIT ====================

  useEffect(() => {
    const dm = localStorage.getItem('darkMode');
    if (dm === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check existing Supabase session
    supabaseAuth.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const hasAdminAccess = await verifyAdminAccess(session.access_token);
        setIsAuthenticated(hasAdminAccess);
      }
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('new-password');
        setAuthChecking(false);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        return;
      }
      if (session && event === 'SIGNED_IN') {
        void (async () => {
          const hasAdminAccess = await verifyAdminAccess(session.access_token);
          setIsAuthenticated(hasAdminAccess);
          if (!hasAdminAccess) {
            setAuthError('Brak uprawnień administratora dla tego konta');
            await supabaseAuth.auth.signOut();
          }
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, [verifyAdminAccess]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ==================== AUTH ====================

  const handleLogin = useCallback(async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Wypełnij wszystkie pola');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    if (error) {
      setAuthError('Nieprawidłowy email lub hasło');
      setAuthLoading(false);
      return;
    }

    const hasAdminAccess = await verifyAdminAccess(data.session?.access_token);
    if (!hasAdminAccess) {
      await supabaseAuth.auth.signOut();
      setAuthError('Brak uprawnień administratora dla tego konta');
      setAuthLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setAuthLoading(false);
    setAuthEmail('');
    setAuthPassword('');
  }, [authEmail, authPassword, verifyAdminAccess]);

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleForgotPassword = async () => {
    if (!authEmail.trim()) {
      setAuthError('Podaj adres e-mail');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(authEmail.trim(), {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin`,
    });

    if (error) {
      setAuthError('Nie udało się wysłać wiadomości. Spróbuj ponownie.');
      setAuthLoading(false);
      return;
    }

    setAuthMode('reset-sent');
    setAuthLoading(false);
  };

  const handleSetNewPassword = async () => {
    if (!newPassword) {
      setAuthError('Podaj nowe hasło');
      return;
    }
    if (newPassword.length < 6) {
      setAuthError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setAuthError('Hasła nie są identyczne');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    const { error } = await supabaseAuth.auth.updateUser({ password: newPassword });

    if (error) {
      setAuthError('Nie udało się zmienić hasła. Spróbuj ponownie.');
      setAuthLoading(false);
      return;
    }

    setNewPassword('');
    setNewPasswordConfirm('');
    setAuthLoading(false);
    setIsAuthenticated(true);
    setAuthMode('login');
  };

  // ==================== DARK MODE ====================

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  // ==================== LOAD DATA ====================

  const loadStats = useCallback(async () => {
    const nextStats = await adminRequest<Stats>('loadStats');
    setStats(nextStats);
  }, [adminRequest]);

  const loadParafie = useCallback(async () => {
    const data = await adminRequest<Parafia[]>('loadParafie');
    setParafie(data || []);
    setRecentParafie((data || []).slice(0, 5));
  }, [adminRequest]);

  const loadProfiles = useCallback(async () => {
    const data = await adminRequest<Profile[]>('loadProfiles');
    setProfiles(data || []);
  }, [adminRequest]);

  const loadMembers = useCallback(async (parafiaId: string) => {
    const data = await adminRequest<Member[]>('loadMembers', { parafiaId });
    setMembers(data || []);
  }, [adminRequest]);

  const loadWatki = useCallback(async (parafiaId?: string) => {
    const data = await adminRequest<TablicaWatek[]>('loadWatki', { parafiaId: parafiaId || null });
    const rows = data || [];
    const sorted = [...rows].sort((a, b) => {
      const aIsAdminAnnouncement = a.kategoria === 'ogłoszenie' && (a.tytul || '').startsWith('[ADMIN]');
      const bIsAdminAnnouncement = b.kategoria === 'ogłoszenie' && (b.tytul || '').startsWith('[ADMIN]');
      if (aIsAdminAnnouncement !== bIsAdminAnnouncement) {
        return aIsAdminAnnouncement ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setWatki(sorted);
  }, [adminRequest]);

  const loadPunktacja = useCallback(async (parafiaId?: string) => {
    const data = await adminRequest<PunktacjaConfig[]>('loadPunktacja', { parafiaId: parafiaId || null });
    setPunktacja(data || []);
  }, [adminRequest]);

  const loadRangi = useCallback(async (parafiaId?: string) => {
    const data = await adminRequest<RangaConfig[]>('loadRangi', { parafiaId: parafiaId || null });
    setRangi(data || []);
  }, [adminRequest]);

  const loadOdznaki = useCallback(async (parafiaId?: string) => {
    const data = await adminRequest<OdznakaConfig[]>('loadOdznaki', { parafiaId: parafiaId || null });
    setOdznaki(data || []);
  }, [adminRequest]);

  // Load banery powitalne
  const loadBanery = useCallback(async () => {
    const data = await adminRequest<AppConfigRow[]>('loadBanery');
    const configRows = data || [];
    const get = (k: string) => configRows.find((d) => d.klucz === k)?.wartosc || '';
    setBanerMinistrant({ tytul: get('baner_ministrant_tytul'), opis: get('baner_ministrant_opis') });
    setBanerKsiadz({ tytul: get('baner_ksiadz_tytul'), opis: get('baner_ksiadz_opis') });
  }, [adminRequest]);

  const saveBanery = async () => {
    setBanerLoading(true);
    try {
      const rows = [
        { klucz: 'baner_ministrant_tytul', wartosc: banerMinistrant.tytul },
        { klucz: 'baner_ministrant_opis', wartosc: banerMinistrant.opis },
        { klucz: 'baner_ksiadz_tytul', wartosc: banerKsiadz.tytul },
        { klucz: 'baner_ksiadz_opis', wartosc: banerKsiadz.opis },
      ];
      await adminRequest('saveBanery', { rows });
      setSuccessMsg('Banery powitalne zapisane');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie zapisac banerow');
    } finally {
      setBanerLoading(false);
    }
  };

  const togglePublishTargetParafia = (parafiaId: string) => {
    setPublishTargetParafiaIds((prev) => (
      prev.includes(parafiaId)
        ? prev.filter((id) => id !== parafiaId)
        : [...prev, parafiaId]
    ));
  };

  const publishKsiadzPanelTemplate = async () => {
    if (!previewPanelParafiaId) {
      setScopeError('Wybierz parafie zrodlowa panelu ksiedza');
      return;
    }
    if (publishScope === 'specific' && publishTargetParafiaIds.length === 0) {
      setScopeError('Wybierz co najmniej jedna parafie docelowa');
      return;
    }

    setActionLoading(true);
    setScopeError('');
    try {
      const result = await adminRequest<{ affected: number }>('publishKsiadzPanelTemplate', {
        sourceParafiaId: previewPanelParafiaId,
        scope: publishScope,
        targetParafiaIds: publishTargetParafiaIds,
      });

      if (publishScope === 'all') {
        setSuccessMsg(`Opublikowano dla wszystkich parafii (${result?.affected ?? 0})`);
      } else if (publishScope === 'new') {
        setSuccessMsg('Opublikowano szablon dla nowych parafii');
      } else {
        setSuccessMsg(`Opublikowano dla wybranych parafii (${result?.affected ?? 0})`);
      }
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie opublikowac zmian');
    } finally {
      setActionLoading(false);
    }
  };

  // Load all data on auth
  useEffect(() => {
    if (isAuthenticated) {
      void loadStats().catch(() => {});
      void loadParafie().catch(() => {});
      void loadProfiles().catch(() => {});
      void loadBanery().catch(() => {});
    }
  }, [isAuthenticated, loadStats, loadParafie, loadProfiles, loadBanery]);

  // Load scope-specific data
  useEffect(() => {
    if (!isAuthenticated) return;
    if (scope === 'parafia' && selectedParafia) {
      void loadMembers(selectedParafia.id).catch(() => {});
      void loadWatki(selectedParafia.id).catch(() => {});
      void loadPunktacja(selectedParafia.id).catch(() => {});
      void loadRangi(selectedParafia.id).catch(() => {});
      void loadOdznaki(selectedParafia.id).catch(() => {});
    } else if (scope === 'global') {
      void loadWatki().catch(() => {});
      void loadPunktacja().catch(() => {});
      void loadRangi().catch(() => {});
      void loadOdznaki().catch(() => {});
    }
  }, [isAuthenticated, scope, selectedParafia, loadMembers, loadWatki, loadPunktacja, loadRangi, loadOdznaki]);

  useEffect(() => {
    if (parafie.length === 0) {
      setPreviewPanelParafiaId('');
      setPublishTargetParafiaIds([]);
      return;
    }
    const ids = new Set(parafie.map((p) => p.id));
    setPreviewPanelParafiaId((prev) => (prev && ids.has(prev) ? prev : parafie[0].id));
    setPublishTargetParafiaIds((prev) => prev.filter((id) => ids.has(id)));
  }, [parafie]);

  // ==================== SCOPE ====================

  const findParafiaByCode = async () => {
    if (!kodParafii.trim()) return;
    setScopeLoading(true);
    setScopeError('');
    try {
      const data = await adminRequest<Parafia | null>('findParafiaByCode', { kodParafii: kodParafii.trim() });
      if (data) {
        setSelectedParafia(data);
        setScopeError('');
      } else {
        setScopeError('Nie znaleziono parafii z tym kodem');
        setSelectedParafia(null);
      }
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie znalezc parafii');
      setSelectedParafia(null);
    } finally {
      setScopeLoading(false);
    }
  };

  // ==================== AKCJE: PARAFIE ====================

  const updateParafia = async () => {
    if (!editParafia) return;
    setActionLoading(true);
    setScopeError('');
    try {
      await adminRequest('updateParafia', {
        id: editParafia.id,
        nazwa: editParafiaForm.nazwa,
        miasto: editParafiaForm.miasto,
        adres: editParafiaForm.adres,
      });
      setEditParafia(null);
      await loadParafie();
      setSuccessMsg('Parafia zaktualizowana');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie zaktualizowac parafii');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteParafia = async (id: string) => {
    setActionLoading(true);
    setScopeError('');
    try {
      const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
      if (sessionError) {
        throw new Error('Nie udało się pobrać sesji. Zaloguj się ponownie.');
      }
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Brak aktywnej sesji. Zaloguj się ponownie.');
      }

      const res = await fetch('/api/admin/delete-parish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ parafiaId: id }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const suffix = result?.partial ? ' (operacja częściowo wykonana, sprawdź logi serwera)' : '';
        throw new Error((result?.error || 'Nie udało się usunąć parafii') + suffix);
      }

      setDeleteConfirm(null);
      await Promise.all([loadParafie(), loadProfiles(), loadStats()]);
      if (selectedParafia?.id === id) {
        setSelectedParafia(null);
        setScope('global');
      }
      setSuccessMsg('Parafia usunieta');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie usunac parafii');
    }
    setActionLoading(false);
  };

  // ==================== AKCJE: UŻYTKOWNICY ====================

  const deleteProfile = async (id: string) => {
    setActionLoading(true);
    setScopeError('');
    try {
      await adminRequest('deleteProfile', { id });
      setDeleteConfirm(null);
      await Promise.all([loadProfiles(), loadStats()]);
      setSuccessMsg('Profil usuniety');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie usunac profilu');
    } finally {
      setActionLoading(false);
    }
  };

  const updateProfileType = async (id: string, newTyp: 'ksiadz' | 'ministrant') => {
    setScopeError('');
    try {
      await adminRequest('updateProfileType', { id, typ: newTyp });
      await loadProfiles();
      setSuccessMsg('Typ uzytkownika zmieniony');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie zmienic typu uzytkownika');
    }
  };

  const updateMemberGroup = async (memberId: string, newGrupa: string | null) => {
    setScopeError('');
    try {
      await adminRequest('updateMemberGroup', { memberId, grupa: newGrupa });
      if (selectedParafia) await loadMembers(selectedParafia.id);
      setSuccessMsg('Grupa zmieniona');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie zmienic grupy');
    }
  };

  const deleteMember = async (id: string) => {
    setActionLoading(true);
    setScopeError('');
    try {
      await adminRequest('deleteMember', { memberId: id });
      setDeleteConfirm(null);
      if (selectedParafia) await loadMembers(selectedParafia.id);
      setSuccessMsg('Czlonek usuniety z parafii');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie usunac czlonka');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== AKCJE: OGŁOSZENIA ====================

  const sendAnnouncement = async () => {
    const tresc = tiptapEditor?.getHTML() || announcementForm.tresc;
    if (!tresc || tresc === '<p></p>') return;
    setActionLoading(true);

    try {
      if (scope === 'global') {
        const result = await adminRequest<{ count?: number }>('sendAnnouncement', {
          scope: 'global',
          tresc,
          grupaDocelowa: announcementForm.grupa_docelowa,
        });
        setSuccessMsg(`Ogloszenie wyslane do ${result?.count ?? 0} parafii`);
      } else if (selectedParafia) {
        await adminRequest('sendAnnouncement', {
          scope: 'parafia',
          parafiaId: selectedParafia.id,
          autorId: selectedParafia.admin_id,
          tresc,
          grupaDocelowa: announcementForm.grupa_docelowa,
        });
        setSuccessMsg('Ogloszenie wyslane');
      }

      setShowAnnouncementModal(false);
      setAnnouncementForm({ tytul: '', tresc: '', grupa_docelowa: 'wszyscy' });
      tiptapEditor?.commands.clearContent();
      await loadWatki(scope === 'parafia' ? selectedParafia?.id : undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nieznany blad';
      setScopeError(`Nieoczekiwany blad: ${message}`);
    }
    setActionLoading(false);
  };

  const updateAnnouncement = async () => {
    if (!editingWatekId) return;
    const tresc = tiptapEditor?.getHTML() || announcementForm.tresc;
    if (!tresc || tresc === '<p></p>') return;
    setActionLoading(true);

    try {
      await adminRequest('updateAnnouncement', { id: editingWatekId, tresc, grupaDocelowa: announcementForm.grupa_docelowa });

      setSuccessMsg('Ogloszenie zaktualizowane');
      setShowAnnouncementModal(false);
      setAnnouncementForm({ tytul: '', tresc: '', grupa_docelowa: 'wszyscy' });
      setEditingWatekId(null);
      tiptapEditor?.commands.clearContent();
      await loadWatki(scope === 'parafia' ? selectedParafia?.id : undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nieznany blad';
      setScopeError(`Nieoczekiwany blad: ${message}`);
    }
    setActionLoading(false);
  };

  const deleteWatek = async (id: string) => {
    setActionLoading(true);
    setScopeError('');
    try {
      await adminRequest('deleteWatek', { id });
      setDeleteConfirm(null);
      await loadWatki(scope === 'parafia' ? selectedParafia?.id : undefined);
      setSuccessMsg('Watek usuniety');
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie usunac watku');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== AKCJE: KONFIGURACJA ====================

  const updatePunktacjaValue = async () => {
    if (!editPunktacja) return;
    setActionLoading(true);
    setScopeError('');

    try {
      if (scope === 'global') {
        await adminRequest('updatePunktacjaValue', {
          scope: 'global',
          klucz: editPunktacja.klucz,
          wartosc: Number(editPunktacjaValue),
        });
        setSuccessMsg('Punktacja zaktualizowana we wszystkich parafiach');
      } else {
        await adminRequest('updatePunktacjaValue', {
          scope: 'parafia',
          id: editPunktacja.id,
          wartosc: Number(editPunktacjaValue),
        });
        setSuccessMsg('Punktacja zaktualizowana');
      }
      setEditPunktacja(null);
      await loadPunktacja(scope === 'parafia' ? selectedParafia?.id : undefined);
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie zaktualizowac punktacji');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleOdznaka = async (id: string, aktywna: boolean) => {
    setScopeError('');
    try {
      await adminRequest('toggleOdznaka', { id, aktywna });
      await loadOdznaki(scope === 'parafia' ? selectedParafia?.id : undefined);
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Nie udalo sie zaktualizowac odznaki');
    }
  };

  // ==================== AKCJE: KODY RABATOWE ====================

  const fetchRabaty = useCallback(async () => {
    setLoadingRabaty(true);
    try {
      const data = await adminRequest<Rabat[]>('fetchRabaty');
      setRabaty(data || []);
    } catch (err) {
      console.error('Błąd pobierania kodów rabatowych:', err);
      alert(err instanceof Error ? err.message : 'Nie udało się pobrać kodów rabatowych.');
    } finally {
      setLoadingRabaty(false);
    }
  }, [adminRequest]);

  async function handleCreateRabat(e: React.FormEvent) {
    e.preventDefault();
    const { kod, procent_znizki, max_uzyc, wazny_do } = nowyRabat;

    if (!kod || !procent_znizki || !max_uzyc) {
      alert('Wypełnij wszystkie wymagane pola.');
      return;
    }

    try {
      await adminRequest('createRabat', {
        kod,
        procent_znizki,
        max_uzyc,
        wazny_do: wazny_do || null,
      });
      alert('Kod rabatowy został utworzony!');
      setNowyRabat({
        kod: '',
        procent_znizki: 10,
        max_uzyc: 1,
        wazny_do: '',
      });
      fetchRabaty();
    } catch (err) {
      console.error('Błąd tworzenia kodu rabatowego:', err);
      alert(err instanceof Error ? err.message : 'Nie udało się utworzyć kodu rabatowego.');
    }
  }

  async function handleDeleteRabat(id: string) {
    if (window.confirm('Czy na pewno chcesz usunąć ten kod rabatowy?')) {
      try {
        await adminRequest('deleteRabat', { id });
        alert('Kod rabatowy został usunięty.');
        fetchRabaty();
      } catch (err) {
        console.error('Błąd usuwania kodu rabatowego:', err);
        alert(err instanceof Error ? err.message : 'Nie udało się usunąć kodu rabatowego.');
      }
    }
  }

  const handleInputChangeRabat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNowyRabat((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  useEffect(() => {
    if (activeTab === 'kody-rabatowe') {
      fetchRabaty();
    }
  }, [activeTab, fetchRabaty]);

  // ==================== HELPERS ====================

  const memberCountsByParafia = useMemo(() => {
    return profiles.reduce<Record<string, number>>((acc, profile) => {
      if (!profile.parafia_id) return acc;
      acc[profile.parafia_id] = (acc[profile.parafia_id] || 0) + 1;
      return acc;
    }, {});
  }, [profiles]);

  const getMemberCount = (parafiaId: string) => {
    return memberCountsByParafia[parafiaId] || 0;
  };

  const getParafiaName = (parafiaId: string | null) => {
    if (!parafiaId) return '—';
    const p = parafie.find(x => x.id === parafiaId);
    return p ? p.nazwa : '—';
  };

  const filteredParafie = useMemo(() => {
    const query = searchParafie.toLowerCase();
    return parafie.filter((p) =>
      p.nazwa.toLowerCase().includes(query) ||
      p.miasto.toLowerCase().includes(query) ||
      p.admin_email.toLowerCase().includes(query) ||
      p.kod_zaproszenia.toLowerCase().includes(query)
    );
  }, [parafie, searchParafie]);

  const filteredProfiles = useMemo(() => {
    const query = searchUsers.toLowerCase();
    return profiles.filter((p) =>
      p.email.toLowerCase().includes(query) ||
      p.imie.toLowerCase().includes(query) ||
      p.nazwisko.toLowerCase().includes(query)
    );
  }, [profiles, searchUsers]);

  // Deduplikacja punktacji w trybie globalnym — pokaż unikalne klucze
  const uniquePunktacja = useMemo(() => {
    if (scope !== 'global') return punktacja;
    return Object.values(punktacja.reduce((acc, p) => {
      if (!acc[p.klucz]) acc[p.klucz] = p;
      return acc;
    }, {} as Record<string, PunktacjaConfig>));
  }, [scope, punktacja]);

  const uniqueRangi = useMemo(() => {
    if (scope !== 'global') return rangi;
    return Object.values(rangi.reduce((acc, r) => {
      if (!acc[r.nazwa]) acc[r.nazwa] = r;
      return acc;
    }, {} as Record<string, RangaConfig>));
  }, [scope, rangi]);

  const uniqueOdznaki = useMemo(() => {
    if (scope !== 'global') return odznaki;
    return Object.values(odznaki.reduce((acc, o) => {
      if (!acc[o.nazwa]) acc[o.nazwa] = o;
      return acc;
    }, {} as Record<string, OdznakaConfig>));
  }, [scope, odznaki]);

  // ==================== RENDER: LOADING ====================

  if (authChecking) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </div>
    );
  }

  // ==================== RENDER: LOGIN ====================

  if (!isAuthenticated || authMode === 'new-password') {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                {authMode === 'new-password' ? (
                  <KeyRound className="w-8 h-8 text-white" />
                ) : authMode === 'forgot' || authMode === 'reset-sent' ? (
                  <Mail className="w-8 h-8 text-white" />
                ) : (
                  <Image src="/logo/mark-white.svg" alt="Logo Ministranci" width={32} height={32} className="w-8 h-8" />
                )}
              </div>
              <CardTitle className="text-2xl text-white">
                {authMode === 'login' && 'Panel Administratora'}
                {authMode === 'forgot' && 'Resetowanie hasła'}
                {authMode === 'reset-sent' && 'Sprawdź skrzynkę'}
                {authMode === 'new-password' && 'Nowe hasło'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {authMode === 'login' && 'Zaloguj się, aby uzyskać dostęp'}
                {authMode === 'forgot' && 'Wyślemy link do zresetowania hasła'}
                {authMode === 'reset-sent' && 'Link do resetowania hasła został wysłany'}
                {authMode === 'new-password' && 'Ustaw nowe hasło do swojego konta'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authError && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {authError}
                </div>
              )}

              {authMode === 'reset-sent' ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-gray-300 text-sm">
                    Wiadomość została wysłana na adres:
                  </p>
                  <p className="text-amber-400 font-medium">{authEmail}</p>
                  <p className="text-gray-500 text-xs">
                    Kliknij link w wiadomości e-mail, aby ustawić nowe hasło. Jeśli nie widzisz wiadomości, sprawdź folder spam.
                  </p>
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Wróć do logowania
                  </button>
                </div>

              ) : authMode === 'forgot' ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Adres e-mail</Label>
                    <Input
                      type="email"
                      value={authEmail}
                      onChange={(e) => { setAuthEmail(e.target.value); setAuthError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                      placeholder="twoj@email.pl"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button
                    onClick={handleForgotPassword}
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Mail className="w-4 h-4 mr-2" />
                    Wyślij link resetujący
                  </Button>
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors w-full"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do logowania
                  </button>
                </div>

              ) : authMode === 'new-password' ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Nowe hasło</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setAuthError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSetNewPassword()}
                        placeholder="Minimum 6 znaków"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Potwierdź nowe hasło</Label>
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordConfirm}
                      onChange={(e) => { setNewPasswordConfirm(e.target.value); setAuthError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSetNewPassword()}
                      placeholder="Powtórz hasło"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button
                    onClick={handleSetNewPassword}
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <KeyRound className="w-4 h-4 mr-2" />
                    Ustaw nowe hasło
                  </Button>
                </div>

              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Adres e-mail</Label>
                    <Input
                      type="email"
                      value={authEmail}
                      onChange={(e) => { setAuthEmail(e.target.value); setAuthError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="twoj@email.pl"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Hasło</Label>
                    <div className="relative">
                      <Input
                        type={showAuthPassword ? 'text' : 'password'}
                        value={authPassword}
                        onChange={(e) => { setAuthPassword(e.target.value); setAuthError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Wprowadź hasło..."
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right -mt-2">
                    <button
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); }}
                      className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                    >
                      Nie pamiętasz hasła?
                    </button>
                  </div>
                  <Button
                    onClick={handleLogin}
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Lock className="w-4 h-4 mr-2" />
                    Zaloguj się
                  </Button>
                  <Link href="/" className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Powrót do strony głównej
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==================== RENDER: PANEL ====================

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">

        {/* Success toast */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Image src="/logo/mark-white.svg" alt="Logo Ministranci" width={20} height={20} className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Panel Admina</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super administrator aplikacji</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Scope switcher */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => { setScope('global'); setSelectedParafia(null); }}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    scope === 'global'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Cala aplikacja</span>
                  <span className="sm:hidden">Wszystko</span>
                </button>
                <button
                  onClick={() => setScope('parafia')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    scope === 'parafia'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Konkretna parafia</span>
                  <span className="sm:hidden">Parafia</span>
                </button>
              </div>

              <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Wyloguj</span>
              </Button>
            </div>
          </div>

          {/* Parafia selector */}
          {scope === 'parafia' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={kodParafii}
                    onChange={(e) => setKodParafii(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && findParafiaByCode()}
                    placeholder="Wpisz kod zaproszenia parafii..."
                    className="max-w-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <Button onClick={findParafiaByCode} disabled={scopeLoading} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                    {scopeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {selectedParafia && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700">
                    <Church className="w-3 h-3 mr-1" />
                    {selectedParafia.nazwa} — {selectedParafia.miasto}
                  </Badge>
                )}
                {scopeError && <span className="text-red-500 text-sm">{scopeError}</span>}
              </div>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6 overflow-x-auto no-scrollbar">
              <TabsList className="w-max min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="parafie" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                  <Church className="w-4 h-4 mr-1.5" />
                  Parafie
                </TabsTrigger>
                <TabsTrigger value="uzytkownicy" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                  <Users className="w-4 h-4 mr-1.5" />
                  Uzytkownicy
                </TabsTrigger>
                <TabsTrigger value="ogloszenia" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Ogloszenia
                </TabsTrigger>
                <TabsTrigger value="konfiguracja" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                  <Settings className="w-4 h-4 mr-1.5" />
                  Konfiguracja
                </TabsTrigger>
                <TabsTrigger value="kody-rabatowe" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
                  <KeyRound className="w-4 h-4 mr-1.5" />
                  Kody Rabatowe
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ==================== DASHBOARD ==================== */}
            <TabsContent value="dashboard">
              <div className="space-y-4">
                {/* Stats grid — compact clickable tiles */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { key: 'parafie', label: 'Parafie', value: stats.parafie, icon: Church, color: 'text-amber-500', activeBg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600' },
                    { key: 'uzytkownicy', label: 'Uzytkownicy', value: stats.profiles, icon: Users, color: 'text-blue-500', activeBg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600' },
                    { key: 'ministranci', label: 'Ministranci', value: stats.ministranci, icon: Users, color: 'text-green-500', activeBg: 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600' },
                    { key: 'ksieza', label: 'Ksieza', value: stats.ksieza, icon: Shield, color: 'text-purple-500', activeBg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600' },
                    { key: 'obecnosci', label: 'Obecnosci 30d', value: stats.obecnosci30, icon: Check, color: 'text-emerald-500', activeBg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600' },
                    { key: 'watki', label: 'Watki', value: stats.watki, icon: MessageSquare, color: 'text-orange-500', activeBg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600' },
                  ].map((s) => {
                    const active = dashboardDetail === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setDashboardDetail(active ? null : s.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                          active
                            ? s.activeBg
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <s.icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                        <div className="min-w-0">
                          <div className="text-lg font-bold leading-tight">{s.value}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{s.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail panel */}
                {dashboardDetail === 'parafie' && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Church className="w-4 h-4 text-amber-500" />
                        Ostatnio utworzone parafie
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-1.5">
                        {recentParafie.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-gray-50 dark:bg-gray-700/50 text-sm">
                            <div className="min-w-0">
                              <span className="font-medium">{p.nazwa}</span>
                              <span className="text-gray-400 mx-1.5">·</span>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">{p.miasto}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-gray-400">{getMemberCount(p.id)} czl.</span>
                              <span className="font-mono text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">{p.kod_zaproszenia}</span>
                            </div>
                          </div>
                        ))}
                        {recentParafie.length === 0 && <p className="text-gray-500 text-center py-3 text-sm">Brak parafii</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2 text-xs text-amber-600 hover:text-amber-700" onClick={() => setActiveTab('parafie')}>
                        Zobacz wszystkie parafie →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {dashboardDetail === 'uzytkownicy' && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Uzytkownicy ({stats.profiles})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-green-50 dark:bg-green-900/20 text-sm">
                          <Users className="w-3.5 h-3.5 text-green-500" />
                          <span>Ministranci: <strong>{stats.ministranci}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-purple-50 dark:bg-purple-900/20 text-sm">
                          <Shield className="w-3.5 h-3.5 text-purple-500" />
                          <span>Ksieza: <strong>{stats.ksieza}</strong></span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {profiles.slice(0, 8).map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">
                            <span className="font-medium">{p.imie} {p.nazwisko}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">{p.email}</span>
                              <Badge variant={p.typ === 'ksiadz' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">{p.typ === 'ksiadz' ? 'K' : 'M'}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-600 hover:text-blue-700" onClick={() => setActiveTab('uzytkownicy')}>
                        Zobacz wszystkich uzytkownikow →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {dashboardDetail === 'ministranci' && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        Ministranci ({stats.ministranci})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-1">
                        {profiles.filter(p => p.typ === 'ministrant').slice(0, 10).map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">
                            <span className="font-medium">{p.imie} {p.nazwisko}</span>
                            <span className="text-gray-400">{getParafiaName(p.parafia_id)}</span>
                          </div>
                        ))}
                        {stats.ministranci > 10 && <p className="text-[10px] text-gray-400 text-center pt-1">...i {stats.ministranci - 10} wiecej</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2 text-xs text-green-600 hover:text-green-700" onClick={() => setActiveTab('uzytkownicy')}>
                        Zobacz wszystkich →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {dashboardDetail === 'ksieza' && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        Ksieza ({stats.ksieza})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-1">
                        {profiles.filter(p => p.typ === 'ksiadz').slice(0, 10).map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">
                            <span className="font-medium">{p.imie} {p.nazwisko}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">{p.email}</span>
                              <span className="text-gray-300">·</span>
                              <span className="text-gray-400">{getParafiaName(p.parafia_id)}</span>
                            </div>
                          </div>
                        ))}
                        {stats.ksieza > 10 && <p className="text-[10px] text-gray-400 text-center pt-1">...i {stats.ksieza - 10} wiecej</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {dashboardDetail === 'obecnosci' && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Obecnosci z ostatnich 30 dni
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-sm">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <div>
                          <div className="font-bold text-lg">{stats.obecnosci30}</div>
                          <div className="text-xs text-gray-500">zarejestrowanych obecnosci w ciagu ostatnich 30 dni</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {dashboardDetail === 'watki' && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        Ostatnie watki
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-1">
                        {watki.slice(0, 8).map((w) => (
                          <div key={w.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">
                            <div className="min-w-0 flex-1">
                              <span className="font-medium truncate block">{w.tytul}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{w.kategoria}</Badge>
                              <span className="text-gray-400 text-[10px]">{new Date(w.created_at).toLocaleDateString('pl-PL')}</span>
                            </div>
                          </div>
                        ))}
                        {watki.length === 0 && <p className="text-gray-500 text-center py-3 text-sm">Brak watkow</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2 text-xs text-orange-600 hover:text-orange-700" onClick={() => setActiveTab('ogloszenia')}>
                        Zobacz wszystkie ogloszenia →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Szybki Dostep</CardTitle>
                    <CardDescription>Podglad panelu i publikacja zmian z panelu ksiedza.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="mb-3 space-y-1">
                      <Label className="text-xs text-gray-500">Parafia zrodlowa (panel ksiedza)</Label>
                      <Select value={previewPanelParafiaId} onValueChange={setPreviewPanelParafiaId}>
                        <SelectTrigger className="bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Wybierz parafie" />
                        </SelectTrigger>
                        <SelectContent>
                          {parafie.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nazwa} — {p.miasto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => setEmbeddedPanel('ksiadz')}
                      >
                        <Shield className="w-4 h-4 mr-1.5" />
                        Panel księdza
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          setEmbeddedPanel('ministrant');
                          setSuccessMsg('Panel ministranta podlaczymy w kolejnym kroku.');
                        }}
                      >
                        <Users className="w-4 h-4 mr-1.5" />
                        Panel ministranta
                      </Button>
                    </div>

                    {embeddedPanel === 'ksiadz' && (
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Podglad panelu księdza
                        </div>
                        {previewPanelParafiaId ? (
                          <iframe
                            src={`/app?preview_role=ksiadz&preview_parafia=${encodeURIComponent(previewPanelParafiaId)}&preview_embed=1`}
                            title="Panel księdza"
                            className="w-full h-[85vh] min-h-[640px] bg-white"
                          />
                        ) : (
                          <div className="px-3 py-6 text-sm text-gray-500">Brak parafii do podgladu panelu księdza.</div>
                        )}
                      </div>
                    )}

                    {embeddedPanel === 'ksiadz' && (
                      <div className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ustawienia publikacji</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button
                            variant={publishScope === 'all' ? 'default' : 'outline'}
                            className={publishScope === 'all' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                            onClick={() => setPublishScope('all')}
                          >
                            Wszystkie
                          </Button>
                          <Button
                            variant={publishScope === 'new' ? 'default' : 'outline'}
                            className={publishScope === 'new' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                            onClick={() => setPublishScope('new')}
                          >
                            Tylko nowe
                          </Button>
                          <Button
                            variant={publishScope === 'specific' ? 'default' : 'outline'}
                            className={publishScope === 'specific' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                            onClick={() => setPublishScope('specific')}
                          >
                            Konkretne
                          </Button>
                        </div>

                        {publishScope === 'specific' && (
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 max-h-44 overflow-y-auto space-y-1">
                            {parafie.map((p) => {
                              const selected = publishTargetParafiaIds.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => togglePublishTargetParafia(p.id)}
                                  className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                                    selected
                                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {p.nazwa} — {p.miasto}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <Button
                          onClick={publishKsiadzPanelTemplate}
                          disabled={actionLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                          Publikuj
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Banery powitalne — zwijany */}
                <button
                  onClick={() => setBanerExpanded(!banerExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Megaphone className="w-4 h-4 text-indigo-500" />
                    Baner powitalny
                    {(banerMinistrant.tytul || banerKsiadz.tytul) && (
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        M: {banerMinistrant.tytul ? `"${banerMinistrant.tytul.substring(0, 25)}${banerMinistrant.tytul.length > 25 ? '...' : ''}"` : '—'}
                        {' · '}
                        K: {banerKsiadz.tytul ? `"${banerKsiadz.tytul.substring(0, 25)}${banerKsiadz.tytul.length > 25 ? '...' : ''}"` : '—'}
                      </span>
                    )}
                  </span>
                  {banerExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {banerExpanded && (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 -mt-1 rounded-t-none border-t-0">
                    <CardContent className="px-4 pb-4 pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ministrant */}
                        <div className="space-y-2 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                            <Users className="w-3.5 h-3.5" />
                            Ministrant
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Tytul (pogrubiony)</Label>
                            <Input
                              value={banerMinistrant.tytul}
                              onChange={(e) => setBanerMinistrant(prev => ({ ...prev, tytul: e.target.value }))}
                              placeholder="np. Witaj w aplikacji dla ministrantow!"
                              className="h-8 text-sm bg-white dark:bg-gray-700"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Opis (tekst pod tytulem)</Label>
                            <textarea
                              value={banerMinistrant.opis}
                              onChange={(e) => setBanerMinistrant(prev => ({ ...prev, opis: e.target.value }))}
                              placeholder="np. Ogloszenia i ankiety · Ranking i punkty · Obecnosci"
                              rows={3}
                              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          {(banerMinistrant.tytul || banerMinistrant.opis) && (
                            <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
                              <p className="text-[10px] text-gray-400 mb-1">Podglad:</p>
                              <div className="flex items-start gap-2">
                                <Church className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                  {banerMinistrant.tytul && <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">{banerMinistrant.tytul}</p>}
                                  {banerMinistrant.opis && <p className="text-[10px] text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">{banerMinistrant.opis}</p>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ksiadz */}
                        <div className="space-y-2 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-purple-700 dark:text-purple-400">
                            <Shield className="w-3.5 h-3.5" />
                            Ksiadz
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Tytul (pogrubiony)</Label>
                            <Input
                              value={banerKsiadz.tytul}
                              onChange={(e) => setBanerKsiadz(prev => ({ ...prev, tytul: e.target.value }))}
                              placeholder="np. Panel zarzadzania parafia"
                              className="h-8 text-sm bg-white dark:bg-gray-700"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Opis (tekst pod tytulem)</Label>
                            <textarea
                              value={banerKsiadz.opis}
                              onChange={(e) => setBanerKsiadz(prev => ({ ...prev, opis: e.target.value }))}
                              placeholder="np. Zarzadzaj obecnosciami · Sluzby · Ogloszenia"
                              rows={3}
                              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          {(banerKsiadz.tytul || banerKsiadz.opis) && (
                            <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
                              <p className="text-[10px] text-gray-400 mb-1">Podglad:</p>
                              <div className="flex items-start gap-2">
                                <Church className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                  {banerKsiadz.tytul && <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">{banerKsiadz.tytul}</p>}
                                  {banerKsiadz.opis && <p className="text-[10px] text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">{banerKsiadz.opis}</p>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button onClick={saveBanery} disabled={banerLoading} className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white" size="sm">
                        {banerLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
                        Zapisz banery
                      </Button>
                    </CardContent>
                  </Card>
                )}

              </div>
            </TabsContent>

            {/* ==================== PARAFIE ==================== */}
            <TabsContent value="parafie">
              <div className="space-y-4">
                {scope === 'global' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          value={searchParafie}
                          onChange={(e) => setSearchParafie(e.target.value)}
                          placeholder="Szukaj parafii (nazwa, miasto, email, kod)..."
                          className="pl-10 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <Badge variant="outline">{filteredParafie.length} parafii</Badge>
                    </div>

                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Nazwa</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Miasto</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Admin</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Kod</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Czlonkowie</th>
                                <th className="text-right p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Akcje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredParafie.map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                  <td className="p-3 font-medium">{p.nazwa}</td>
                                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{p.miasto}</td>
                                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{p.admin_email}</td>
                                  <td className="p-3">
                                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{p.kod_zaproszenia}</span>
                                  </td>
                                  <td className="p-3 text-sm">{getMemberCount(p.id)}</td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setScope('parafia');
                                          setKodParafii(p.kod_zaproszenia);
                                          setSelectedParafia(p);
                                        }}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditParafia(p);
                                          setEditParafiaForm({ nazwa: p.nazwa, miasto: p.miasto, adres: p.adres });
                                        }}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => setDeleteConfirm({ type: 'parafia', id: p.id, name: p.nazwa })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {filteredParafie.length === 0 && (
                          <p className="text-gray-500 text-center py-8">Brak wynikow</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : selectedParafia ? (
                  <div className="space-y-4">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Church className="w-5 h-5 text-amber-500" />
                          {selectedParafia.nazwa}
                        </CardTitle>
                        <CardDescription>{selectedParafia.miasto} — {selectedParafia.adres || 'Brak adresu'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Admin</Label>
                            <p className="font-medium text-sm">{selectedParafia.admin_email}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Kod zaproszenia</Label>
                            <p className="font-mono text-sm font-medium">{selectedParafia.kod_zaproszenia}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Czlonkowie</Label>
                            <p className="font-medium text-sm">{members.length}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Utworzona</Label>
                            <p className="font-medium text-sm">{new Date(selectedParafia.created_at).toLocaleDateString('pl-PL')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditParafia(selectedParafia);
                              setEditParafiaForm({ nazwa: selectedParafia.nazwa, miasto: selectedParafia.miasto, adres: selectedParafia.adres });
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edytuj
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setDeleteConfirm({ type: 'parafia', id: selectedParafia.id, name: selectedParafia.nazwa })}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Usun
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Members table */}
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg">Czlonkowie parafii ({members.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Imie i nazwisko</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Email</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Typ</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Grupa</th>
                                <th className="text-right p-3 text-sm font-medium text-gray-500">Akcje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {members.map((m) => (
                                <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                  <td className="p-3 font-medium">{m.imie} {m.nazwisko}</td>
                                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{m.email}</td>
                                  <td className="p-3">
                                    <Badge variant={m.typ === 'ksiadz' ? 'default' : 'secondary'} className="text-xs">
                                      {m.typ === 'ksiadz' ? 'Ksiadz' : 'Ministrant'}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <Select
                                      value={m.grupa || 'brak'}
                                      onValueChange={(v) => updateMemberGroup(m.id, v === 'brak' ? null : v)}
                                    >
                                      <SelectTrigger className="w-40 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="brak">Brak grupy</SelectItem>
                                        <SelectItem value="kandydaci">Kandydaci</SelectItem>
                                        <SelectItem value="mlodsi">Mlodsi</SelectItem>
                                        <SelectItem value="starsi">Starsi</SelectItem>
                                        <SelectItem value="lektorzy_mlodsi">Lektorzy ml.</SelectItem>
                                        <SelectItem value="lektorzy_starsi">Lektorzy st.</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-3 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500"
                                      onClick={() => setDeleteConfirm({ type: 'member', id: m.id, name: `${m.imie} ${m.nazwisko}` })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {members.length === 0 && (
                          <p className="text-gray-500 text-center py-8">Brak czlonkow</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="py-12 text-center">
                      <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">Wpisz kod zaproszenia parafii powyzej, aby zobaczyc jej dane</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ==================== UŻYTKOWNICY ==================== */}
            <TabsContent value="uzytkownicy">
              <div className="space-y-4">
                {scope === 'global' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          value={searchUsers}
                          onChange={(e) => setSearchUsers(e.target.value)}
                          placeholder="Szukaj uzytkownikow (email, imie, nazwisko)..."
                          className="pl-10 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <Badge variant="outline">{filteredProfiles.length} uzytkownikow</Badge>
                    </div>

                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Imie i nazwisko</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Email</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Typ</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-500">Parafia</th>
                                <th className="text-right p-3 text-sm font-medium text-gray-500">Akcje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProfiles.map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                  <td className="p-3 font-medium">{p.imie} {p.nazwisko}</td>
                                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{p.email}</td>
                                  <td className="p-3">
                                    <Select
                                      value={p.typ}
                                      onValueChange={(v) => updateProfileType(p.id, v as 'ksiadz' | 'ministrant')}
                                    >
                                      <SelectTrigger className="w-36 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ksiadz">Ksiadz</SelectItem>
                                        <SelectItem value="ministrant">Ministrant</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{getParafiaName(p.parafia_id)}</td>
                                  <td className="p-3 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500"
                                      onClick={() => setDeleteConfirm({ type: 'profile', id: p.id, name: `${p.imie} ${p.nazwisko} (${p.email})` })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {filteredProfiles.length === 0 && (
                          <p className="text-gray-500 text-center py-8">Brak wynikow</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : selectedParafia ? (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">Czlonkowie: {selectedParafia.nazwa} ({members.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left p-3 text-sm font-medium text-gray-500">Imie i nazwisko</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-500">Email</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-500">Typ</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-500">Grupa</th>
                              <th className="text-right p-3 text-sm font-medium text-gray-500">Akcje</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((m) => (
                              <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="p-3 font-medium">{m.imie} {m.nazwisko}</td>
                                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{m.email}</td>
                                <td className="p-3">
                                  <Badge variant={m.typ === 'ksiadz' ? 'default' : 'secondary'} className="text-xs">
                                    {m.typ === 'ksiadz' ? 'Ksiadz' : 'Ministrant'}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={m.grupa || 'brak'}
                                    onValueChange={(v) => updateMemberGroup(m.id, v === 'brak' ? null : v)}
                                  >
                                    <SelectTrigger className="w-40 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="brak">Brak grupy</SelectItem>
                                      <SelectItem value="kandydaci">Kandydaci</SelectItem>
                                      <SelectItem value="mlodsi">Mlodsi</SelectItem>
                                      <SelectItem value="starsi">Starsi</SelectItem>
                                      <SelectItem value="lektorzy_mlodsi">Lektorzy ml.</SelectItem>
                                      <SelectItem value="lektorzy_starsi">Lektorzy st.</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() => setDeleteConfirm({ type: 'member', id: m.id, name: `${m.imie} ${m.nazwisko}` })}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {members.length === 0 && <p className="text-gray-500 text-center py-8">Brak czlonkow</p>}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="py-12 text-center">
                      <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">Wpisz kod zaproszenia parafii powyzej</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ==================== OGŁOSZENIA ==================== */}
            <TabsContent value="ogloszenia">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {scope === 'global'
                      ? 'Ogloszenia — wszystkie parafie'
                      : selectedParafia
                        ? `Ogloszenia — ${selectedParafia.nazwa}`
                        : 'Ogloszenia'
                    }
                  </h2>
                  <Button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={scope === 'parafia' && !selectedParafia}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {scope === 'global' ? 'Wyslij do wszystkich' : 'Nowe ogloszenie'}
                  </Button>
                </div>

                {scope === 'parafia' && !selectedParafia ? (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="py-12 text-center">
                      <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">Wpisz kod zaproszenia parafii powyzej</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {watki.map((w) => (
                      <Card key={w.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  className={
                                    w.kategoria === 'ogłoszenie'
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                      : w.kategoria === 'ankieta'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                  }
                                >
                                  {w.kategoria}
                                </Badge>
                                {w.przypiety && <Badge variant="outline" className="text-xs">Przypiety</Badge>}
                                {w.zamkniety && <Badge variant="outline" className="text-xs text-red-500">Zamkniety</Badge>}
                                {scope === 'global' && (
                                  <span className="text-xs text-gray-400">{getParafiaName(w.parafia_id)}</span>
                                )}
                              </div>
                              {w.kategoria !== 'ogłoszenie' && <h3 className="font-medium">{w.tytul}</h3>}
                              {w.tresc && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">{renderTresc(w.tresc)}</div>
                              )}
                              <p className="text-xs text-gray-400 mt-2">{new Date(w.created_at).toLocaleString('pl-PL')}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {w.tytul?.startsWith('[ADMIN]') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-amber-500 hover:text-amber-600"
                                  onClick={() => {
                                    setEditingWatekId(w.id);
                                    setAnnouncementForm({ tytul: w.tytul, tresc: w.tresc || '', grupa_docelowa: w.grupa_docelowa || 'wszyscy' });
                                    setShowAnnouncementModal(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                onClick={() => setDeleteConfirm({ type: 'watek', id: w.id, name: w.tytul })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {watki.length === 0 && (
                      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardContent className="py-8 text-center">
                          <p className="text-gray-500">Brak ogloszen</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ==================== KONFIGURACJA ==================== */}
            <TabsContent value="konfiguracja">
              {scope === 'parafia' && !selectedParafia ? (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Wpisz kod zaproszenia parafii powyzej</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {scope === 'global' && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Tryb globalny — zmiany zostana zastosowane we <strong>wszystkich parafiach</strong>.
                        Wyswietlane wartosci sa z pierwszej znalezionej parafii (jako wzor).
                      </p>
                    </div>
                  )}

                  {/* Punktacja */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Punktacja ({uniquePunktacja.length} regul)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left p-3 text-sm font-medium text-gray-500">Klucz</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-500">Opis</th>
                              <th className="text-right p-3 text-sm font-medium text-gray-500">Wartosc</th>
                              <th className="text-right p-3 text-sm font-medium text-gray-500">Edytuj</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniquePunktacja.map((p) => (
                              <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                <td className="p-3 font-mono text-xs">{p.klucz}</td>
                                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{p.opis}</td>
                                <td className="p-3 text-right font-bold">
                                  <span className={Number(p.wartosc) < 0 ? 'text-red-500' : Number(p.wartosc) > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                                    {p.wartosc}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setEditPunktacja(p); setEditPunktacjaValue(String(p.wartosc)); }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rangi */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" />
                        Rangi ({uniqueRangi.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {uniqueRangi.map((r) => {
                          const k = KOLOR_KLASY[r.kolor] || KOLOR_KLASY.gray;
                          return (
                            <div key={r.id} className={`p-3 rounded-lg border ${k.bg} ${k.border} ${k.text}`}>
                              <div className="font-bold text-sm">{r.nazwa}</div>
                              <div className="text-xs mt-1 opacity-70">{r.min_pkt}+ pkt</div>
                              <div className="text-xs opacity-50">#{r.kolejnosc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Odznaki */}
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Odznaki ({uniqueOdznaki.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {uniqueOdznaki.map((o) => (
                          <div key={o.id} className={`flex items-center justify-between p-3 rounded-lg border ${o.aktywna ? 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'}`}>
                            <div>
                              <div className="font-medium text-sm">{o.nazwa}</div>
                              <div className="text-xs text-gray-500">{o.opis}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                Warunek: {o.warunek_typ} ({o.warunek_wartosc}) — +{o.bonus_pkt} pkt
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOdznaka(o.id, o.aktywna)}
                              className={o.aktywna ? 'text-emerald-600' : 'text-gray-400'}
                            >
                              {o.aktywna ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                          </TabsContent>
                        <TabsContent value="kody-rabatowe">
                          <div className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle>Utwórz nowy kod rabatowy</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <form onSubmit={handleCreateRabat} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="kod">Kod</Label>
                                      <Input
                                        id="kod"
                                        name="kod"
                                        value={nowyRabat.kod}
                                        onChange={handleInputChangeRabat}
                                        placeholder="np. WIOSNA25"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="procent_znizki">Procent zniżki (%)</Label>
                                      <Input
                                        id="procent_znizki"
                                        name="procent_znizki"
                                        type="number"
                                        value={nowyRabat.procent_znizki}
                                        onChange={handleInputChangeRabat}
                                        min="1"
                                        max="100"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="max_uzyc">Maksymalna liczba użyć</Label>
                                      <Input
                                        id="max_uzyc"
                                        name="max_uzyc"
                                        type="number"
                                        value={nowyRabat.max_uzyc}
                                        onChange={handleInputChangeRabat}
                                        min="1"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="wazny_do">Ważny do (opcjonalnie)</Label>
                                      <Input
                                        id="wazny_do"
                                        name="wazny_do"
                                        type="date"
                                        value={nowyRabat.wazny_do}
                                        onChange={handleInputChangeRabat}
                                      />
                                    </div>
                                  </div>
                                  <Button type="submit">Utwórz kod</Button>
                                </form>
                              </CardContent>
                            </Card>
            
                            <Card>
                              <CardHeader>
                                <CardTitle>Istniejące kody rabatowe</CardTitle>
                              </CardHeader>
                                                <CardContent>
                                                  {loadingRabaty ? (
                                                    <p>Ładowanie...</p>
                                                  ) : rabaty && rabaty.length > 0 ? (
                                                    <Table>
                                                      <TableHeader>
                                                        <TableRow>
                                                          <TableHead>Kod</TableHead>
                                                          <TableHead>Zniżka (%)</TableHead>
                                                          <TableHead>Max użyć</TableHead>
                                                          <TableHead>Użycia</TableHead>
                                                          <TableHead>Ważny do</TableHead>
                                                          <TableHead>Akcje</TableHead>
                                                        </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                        {rabaty.map((rabat) => (
                                                          <TableRow key={rabat.id}>
                                                            <TableCell className="font-medium">{rabat.kod}</TableCell>
                                                            <TableCell>{rabat.procent_znizki}%</TableCell>
                                                            <TableCell>{rabat.max_uzyc}</TableCell>
                                                            <TableCell>{rabat.uzycia}</TableCell>
                                                            <TableCell>
                                                              {rabat.wazny_do
                                                                ? new Date(rabat.wazny_do).toLocaleDateString()
                                                                : 'Bezterminowo'}
                                                            </TableCell>
                                                            <TableCell>
                                                              <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteRabat(rabat.id)}
                                                              >
                                                                Usuń
                                                              </Button>
                                                            </TableCell>
                                                          </TableRow>
                                                        ))}
                                                      </TableBody>
                                                    </Table>
                                                  ) : (
                                                    <p>Brak kodów rabatowych.</p>
                                                  )}
                                                </CardContent>                            </Card>
                          </div>
                        </TabsContent>
            
                      </Tabs>
                    </main>
            

        {/* ==================== MODALE ==================== */}

        {/* Edit parafia modal */}
        <Dialog open={!!editParafia} onOpenChange={() => setEditParafia(null)}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Edytuj parafie</DialogTitle>
              <DialogDescription>Zmien dane parafii</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nazwa</Label>
                <Input
                  value={editParafiaForm.nazwa}
                  onChange={(e) => setEditParafiaForm({ ...editParafiaForm, nazwa: e.target.value })}
                />
              </div>
              <div>
                <Label>Miasto</Label>
                <Input
                  value={editParafiaForm.miasto}
                  onChange={(e) => setEditParafiaForm({ ...editParafiaForm, miasto: e.target.value })}
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Input
                  value={editParafiaForm.adres}
                  onChange={(e) => setEditParafiaForm({ ...editParafiaForm, adres: e.target.value })}
                />
              </div>
              <Button onClick={updateParafia} disabled={actionLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Zapisz zmiany
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation modal */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-red-600">Potwierdzenie usunięcia</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunac: <strong>{deleteConfirm?.name}</strong>?
                {deleteConfirm?.type === 'parafia' && ' Zostana usunieci wszyscy czlonkowie, sluzby, ogloszenia i konfiguracja.'}
                {deleteConfirm?.type === 'profile' && ' Uzytkownik zostanie usuniety z systemu.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Anuluj</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={actionLoading}
                onClick={() => {
                  if (!deleteConfirm) return;
                  if (deleteConfirm.type === 'parafia') deleteParafia(deleteConfirm.id);
                  else if (deleteConfirm.type === 'profile') deleteProfile(deleteConfirm.id);
                  else if (deleteConfirm.type === 'member') deleteMember(deleteConfirm.id);
                  else if (deleteConfirm.type === 'watek') deleteWatek(deleteConfirm.id);
                }}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Usun
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Announcement modal — full Tiptap editor */}
        <Dialog open={showAnnouncementModal} onOpenChange={(open) => {
          setShowAnnouncementModal(open);
          if (!open) {
            setAnnouncementForm({ tytul: '', tresc: '', grupa_docelowa: 'wszyscy' });
            setEditingWatekId(null);
            tiptapEditor?.commands.clearContent();
            setShowYoutubeInput(false);
            setShowEmojiPicker(false);
          }
        }}>
          <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingWatekId
                  ? 'Edytuj ogloszenie'
                  : scope === 'global' ? 'Wyslij ogloszenie do wszystkich parafii' : 'Nowe ogloszenie'}
              </DialogTitle>
              <DialogDescription>
                {editingWatekId
                  ? 'Zmien tresc ogloszenia admina.'
                  : scope === 'global'
                    ? `Ogloszenie zostanie utworzone w ${parafie.length} parafiach jako przypiety watek [ADMIN].`
                    : `Ogloszenie dla parafii: ${selectedParafia?.nazwa}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Tresc z Tiptap */}
              <div className="relative">
                <Label className="mb-1 block">Tresc *</Label>
                {/* Toolbar */}
                {tiptapEditor && (
                  <div className="flex flex-wrap items-center gap-0.5 p-1 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-700/50">
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('bold') ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('italic') ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('heading', { level: 1 }) ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('heading', { level: 2 }) ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive('heading', { level: 3 }) ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-3.5 h-3.5" /></Button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive({ textAlign: 'left' }) ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive({ textAlign: 'center' }) ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-3.5 h-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className={`h-7 w-7 p-0 ${tiptapEditor.isActive({ textAlign: 'right' }) ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => tiptapEditor.chain().focus().setTextAlign('right').run()}><AlignRight className="w-3.5 h-3.5" /></Button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
                    {/* Kolory */}
                    {['#000000', '#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c'].map(color => (
                      <button key={color} type="button" className={`w-5 h-5 rounded-full border-2 ${tiptapEditor.isActive('textStyle', { color }) ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => tiptapEditor.chain().focus().setColor(color).run()} />
                    ))}
                    <button type="button" className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[8px]" onClick={() => tiptapEditor.chain().focus().unsetColor().run()}>&#x2715;</button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
                    {/* Wstaw plik */}
                    <label>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 gap-1 cursor-pointer" asChild>
                        <span>{isUploadingInline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}<span className="text-[10px]">Wstaw plik</span></span>
                      </Button>
                      <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" disabled={isUploadingInline} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAndInsertFile(file); e.target.value = ''; }} />
                    </label>
                    {/* YouTube */}
                    <Button type="button" variant="ghost" size="sm" className={`h-7 px-2 gap-1 ${showYoutubeInput ? 'bg-amber-200 dark:bg-amber-800' : ''}`} onClick={() => { setShowYoutubeInput(!showYoutubeInput); setYoutubeUrl(''); }}><Youtube className="w-3.5 h-3.5" /><span className="text-[10px]">Wstaw filmik</span></Button>
                    {/* Emoji */}
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
                {/* YouTube input */}
                {showYoutubeInput && (
                  <div className="flex items-center gap-1 p-1.5 border-x border-gray-300 dark:border-gray-600 bg-red-50 dark:bg-red-950/20">
                    <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (youtubeUrl.trim()) { tiptapEditor?.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run(); setYoutubeUrl(''); setShowYoutubeInput(false); }
                        } else if (e.key === 'Escape') { setShowYoutubeInput(false); setYoutubeUrl(''); }
                      }}
                      autoFocus
                    />
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                      if (youtubeUrl.trim()) { tiptapEditor?.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run(); setYoutubeUrl(''); setShowYoutubeInput(false); }
                    }}>Wstaw</Button>
                  </div>
                )}
                {/* Edytor */}
                <div className="w-full rounded-b-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ring-offset-background focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-offset-2">
                  <EditorContent editor={tiptapEditor} />
                </div>
                <LazyEmojiPicker
                  open={showEmojiPicker}
                  className="absolute z-50 mt-1"
                  locale="pl"
                  theme={darkMode ? 'dark' : 'light'}
                  onSelect={(emoji) => {
                    tiptapEditor?.chain().focus().insertContent(emoji.native).run();
                    setShowEmojiPicker(false);
                  }}
                />
              </div>

              {/* Grupa docelowa — chips */}
              <div>
                <Label className="mb-2 block">Grupa docelowa</Label>
                <div className="flex flex-wrap gap-2">
                  {GRUPY_DOCELOWE.map(grupa => {
                    const isWszyscy = grupa.nazwa === 'wszyscy';
                    const isSpecial = grupa.nazwa === 'ksieza' || grupa.nazwa === 'ministranci';
                    const selected = isWszyscy
                      ? announcementForm.grupa_docelowa === 'wszyscy'
                      : isSpecial
                        ? announcementForm.grupa_docelowa === grupa.nazwa
                        : announcementForm.grupa_docelowa !== 'wszyscy' && announcementForm.grupa_docelowa !== 'ksieza' && announcementForm.grupa_docelowa !== 'ministranci' && announcementForm.grupa_docelowa.split(',').map(s => s.trim()).includes(grupa.nazwa);
                    return (
                      <button
                        key={grupa.nazwa}
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          selected
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => {
                          if (isWszyscy || isSpecial) {
                            setAnnouncementForm(prev => ({ ...prev, grupa_docelowa: grupa.nazwa }));
                          } else {
                            setAnnouncementForm(prev => {
                              const specialValues = ['wszyscy', 'ksieza', 'ministranci'];
                              const current = specialValues.includes(prev.grupa_docelowa) ? [] : prev.grupa_docelowa.split(',').map(s => s.trim()).filter(Boolean);
                              const next = selected ? current.filter(g => g !== grupa.nazwa) : [...current, grupa.nazwa];
                              return { ...prev, grupa_docelowa: next.length === 0 ? 'wszyscy' : next.join(',') };
                            });
                          }
                        }}
                      >
                        {selected ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{grupa.emoji} {grupa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {scopeError && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {scopeError}
                  </p>
                </div>
              )}
              <Button
                onClick={editingWatekId ? updateAnnouncement : sendAnnouncement}
                disabled={actionLoading || (tiptapEditor ? tiptapEditor.isEmpty : !announcementForm.tresc)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingWatekId ? <Pencil className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {editingWatekId ? 'Zapisz zmiany' : scope === 'global' ? `Wyslij do ${parafie.length} parafii` : 'Opublikuj'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit punktacja modal */}
        <Dialog open={!!editPunktacja} onOpenChange={() => setEditPunktacja(null)}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Edytuj wartosc punktacji</DialogTitle>
              <DialogDescription>
                {editPunktacja?.opis}
                {scope === 'global' && (
                  <span className="block mt-1 text-amber-600 font-medium">Zmiana zostanie zastosowana we wszystkich parafiach!</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Klucz</Label>
                <Input value={editPunktacja?.klucz || ''} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div>
                <Label>Wartosc</Label>
                <Input
                  type="number"
                  value={editPunktacjaValue}
                  onChange={(e) => setEditPunktacjaValue(e.target.value)}
                  step="0.5"
                />
              </div>
              <Button onClick={updatePunktacjaValue} disabled={actionLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Zapisz
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
