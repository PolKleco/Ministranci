'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Church, Users, Settings, MessageSquare, Trophy,
  LogOut, Search, Trash2, Pencil, Check, X, Plus,
  Moon, Sun, BarChart3, Eye, ChevronDown, ChevronUp,
  Copy, RefreshCw, Globe, MapPin, Loader2, AlertTriangle,
  Lock, ArrowLeft, Send, Smile, Paperclip, Megaphone,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Youtube, ImageIcon, Pin,
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
import { Badge } from '@/components/ui/badge';
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
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';

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

interface Stats {
  parafie: number;
  profiles: number;
  ministranci: number;
  ksieza: number;
  obecnosci30: number;
  watki: number;
}

// ==================== SUPABASE ADMIN ====================

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!;
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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

function TiptapImageView({ node, updateAttributes, selected }: any) {
  const [showControls, setShowControls] = useState(false);
  const wrapperStyle: React.CSSProperties = { display: 'inline-block' };
  if (node.attrs.float === 'left') Object.assign(wrapperStyle, { float: 'left' as const, margin: '4px 16px 8px 0', maxWidth: '50%' });
  else if (node.attrs.float === 'right') Object.assign(wrapperStyle, { float: 'right' as const, margin: '4px 0 8px 16px', maxWidth: '50%' });
  else if (node.attrs.float === 'center') Object.assign(wrapperStyle, { display: 'block', textAlign: 'center' as const, margin: '8px 0' });
  const imgStyle: React.CSSProperties = { maxWidth: '100%', borderRadius: '8px', cursor: 'pointer', ...(node.attrs.width ? { width: `${node.attrs.width}px` } : {}) };
  return (
    <NodeViewWrapper as="span" style={wrapperStyle} className="tiptap-image-wrapper">
      <span className="relative inline-block" onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)}>
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

function TiptapYoutubeView({ node, updateAttributes, selected }: any) {
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
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Supabase client ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sb, setSb] = useState<any>(null);

  // Tiptap Image extension with float & width + hover controls
  const FloatImage = useMemo(() => TiptapImage.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        float: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-float'), renderHTML: (attributes: any) => attributes.float ? { 'data-float': attributes.float } : {} },
        width: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-width'), renderHTML: (attributes: any) => attributes.width ? { 'data-width': attributes.width } : {} },
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
        float: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-float'), renderHTML: (attributes: any) => attributes.float ? { 'data-float': attributes.float } : {} },
        width: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('data-width'), renderHTML: (attributes: any) => attributes.width ? { 'data-width': attributes.width, style: `width: ${attributes.width}px; max-width: 100%;` } : {} },
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
    if (!sb || !tiptapEditor) return;
    setIsUploadingInline(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `admin/inline/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage
        .from('watki-files')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) { alert('Blad uploadu: ' + error.message); return; }
      const { data: { publicUrl } } = sb.storage.from('watki-files').getPublicUrl(path);
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

  // Renderowanie tresci HTML
  const renderTresc = (text: string) => {
    if (!text) return null;
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return <div className="tiptap-content text-sm" dangerouslySetInnerHTML={{ __html: text }} />;
    }
    return <p className="text-sm whitespace-pre-wrap">{text}</p>;
  };

  // ==================== INIT ====================

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
      setSb(createAdminClient());
    }
    const dm = localStorage.getItem('darkMode');
    if (dm === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ==================== AUTH ====================

  const handleLogin = () => {
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (password === adminPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setAuthError('');
      setSb(createAdminClient());
    } else {
      setAuthError('Nieprawidlowe haslo');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    setSb(null);
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
    if (!sb) return;
    const [p, pr, ob, w] = await Promise.all([
      sb.from('parafie').select('id', { count: 'exact', head: true }),
      sb.from('profiles').select('id, typ', { count: 'exact' }),
      sb.from('obecnosci').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      sb.from('tablica_watki').select('id', { count: 'exact', head: true }),
    ]);
    const allProfiles = pr.data || [];
    setStats({
      parafie: p.count || 0,
      profiles: pr.count || 0,
      ministranci: allProfiles.filter((x: any) => x.typ === 'ministrant').length,
      ksieza: allProfiles.filter((x: any) => x.typ === 'ksiadz').length,
      obecnosci30: ob.count || 0,
      watki: w.count || 0,
    });
  }, [sb]);

  const loadParafie = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from('parafie').select('*').order('created_at', { ascending: false });
    if (data) {
      setParafie(data);
      setRecentParafie(data.slice(0, 5));
    }
  }, [sb]);

  const loadProfiles = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data);
  }, [sb]);

  const loadMembers = useCallback(async (parafiaId: string) => {
    if (!sb) return;
    const { data } = await sb.from('parafia_members').select('*').eq('parafia_id', parafiaId);
    if (data) setMembers(data);
  }, [sb]);

  const loadWatki = useCallback(async (parafiaId?: string) => {
    if (!sb) return;
    let q = sb.from('tablica_watki').select('*').order('created_at', { ascending: false });
    if (parafiaId) q = q.eq('parafia_id', parafiaId);
    const { data } = await q.limit(50);
    if (data) setWatki(data);
  }, [sb]);

  const loadPunktacja = useCallback(async (parafiaId?: string) => {
    if (!sb) return;
    let q = sb.from('punktacja_config').select('*');
    if (parafiaId) q = q.eq('parafia_id', parafiaId);
    const { data } = await q.order('klucz');
    if (data) setPunktacja(data);
  }, [sb]);

  const loadRangi = useCallback(async (parafiaId?: string) => {
    if (!sb) return;
    let q = sb.from('rangi_config').select('*');
    if (parafiaId) q = q.eq('parafia_id', parafiaId);
    const { data } = await q.order('kolejnosc');
    if (data) setRangi(data);
  }, [sb]);

  const loadOdznaki = useCallback(async (parafiaId?: string) => {
    if (!sb) return;
    let q = sb.from('odznaki_config').select('*');
    if (parafiaId) q = q.eq('parafia_id', parafiaId);
    const { data } = await q.order('nazwa');
    if (data) setOdznaki(data);
  }, [sb]);

  // Load banery powitalne
  const loadBanery = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from('app_config').select('*').in('klucz', [
      'baner_ministrant_tytul', 'baner_ministrant_opis',
      'baner_ksiadz_tytul', 'baner_ksiadz_opis',
    ]);
    if (data) {
      const get = (k: string) => data.find((d: any) => d.klucz === k)?.wartosc || '';
      setBanerMinistrant({ tytul: get('baner_ministrant_tytul'), opis: get('baner_ministrant_opis') });
      setBanerKsiadz({ tytul: get('baner_ksiadz_tytul'), opis: get('baner_ksiadz_opis') });
    }
  }, [sb]);

  const saveBanery = async () => {
    if (!sb) return;
    setBanerLoading(true);
    const rows = [
      { klucz: 'baner_ministrant_tytul', wartosc: banerMinistrant.tytul },
      { klucz: 'baner_ministrant_opis', wartosc: banerMinistrant.opis },
      { klucz: 'baner_ksiadz_tytul', wartosc: banerKsiadz.tytul },
      { klucz: 'baner_ksiadz_opis', wartosc: banerKsiadz.opis },
    ];
    for (const row of rows) {
      await sb.from('app_config').upsert(row, { onConflict: 'klucz' });
    }
    setSuccessMsg('Banery powitalne zapisane');
    setBanerLoading(false);
  };

  // Load all data on auth
  useEffect(() => {
    if (isAuthenticated && sb) {
      loadStats();
      loadParafie();
      loadProfiles();
      loadBanery();
    }
  }, [isAuthenticated, sb, loadStats, loadParafie, loadProfiles, loadBanery]);

  // Load scope-specific data
  useEffect(() => {
    if (!sb || !isAuthenticated) return;
    if (scope === 'parafia' && selectedParafia) {
      loadMembers(selectedParafia.id);
      loadWatki(selectedParafia.id);
      loadPunktacja(selectedParafia.id);
      loadRangi(selectedParafia.id);
      loadOdznaki(selectedParafia.id);
    } else if (scope === 'global') {
      loadWatki();
      loadPunktacja();
      loadRangi();
      loadOdznaki();
    }
  }, [sb, isAuthenticated, scope, selectedParafia, loadMembers, loadWatki, loadPunktacja, loadRangi, loadOdznaki]);

  // ==================== SCOPE ====================

  const findParafiaByCode = async () => {
    if (!sb || !kodParafii.trim()) return;
    setScopeLoading(true);
    setScopeError('');
    const { data } = await sb.from('parafie').select('*').eq('kod_zaproszenia', kodParafii.trim()).single();
    if (data) {
      setSelectedParafia(data);
      setScopeError('');
    } else {
      setScopeError('Nie znaleziono parafii z tym kodem');
      setSelectedParafia(null);
    }
    setScopeLoading(false);
  };

  // ==================== AKCJE: PARAFIE ====================

  const updateParafia = async () => {
    if (!sb || !editParafia) return;
    setActionLoading(true);
    await sb.from('parafie').update({
      nazwa: editParafiaForm.nazwa,
      miasto: editParafiaForm.miasto,
      adres: editParafiaForm.adres,
    }).eq('id', editParafia.id);
    setEditParafia(null);
    loadParafie();
    setSuccessMsg('Parafia zaktualizowana');
    setActionLoading(false);
  };

  const deleteParafia = async (id: string) => {
    if (!sb) return;
    setActionLoading(true);
    await sb.from('parafie').delete().eq('id', id);
    setDeleteConfirm(null);
    loadParafie();
    loadStats();
    if (selectedParafia?.id === id) {
      setSelectedParafia(null);
      setScope('global');
    }
    setSuccessMsg('Parafia usunieta');
    setActionLoading(false);
  };

  // ==================== AKCJE: UŻYTKOWNICY ====================

  const deleteProfile = async (id: string) => {
    if (!sb) return;
    setActionLoading(true);
    await sb.from('profiles').delete().eq('id', id);
    setDeleteConfirm(null);
    loadProfiles();
    loadStats();
    setSuccessMsg('Profil usuniety');
    setActionLoading(false);
  };

  const updateProfileType = async (id: string, newTyp: 'ksiadz' | 'ministrant') => {
    if (!sb) return;
    await sb.from('profiles').update({ typ: newTyp }).eq('id', id);
    loadProfiles();
    setSuccessMsg('Typ uzytkownika zmieniony');
  };

  const updateMemberGroup = async (memberId: string, newGrupa: string | null) => {
    if (!sb) return;
    await sb.from('parafia_members').update({ grupa: newGrupa }).eq('id', memberId);
    if (selectedParafia) loadMembers(selectedParafia.id);
    setSuccessMsg('Grupa zmieniona');
  };

  const deleteMember = async (id: string) => {
    if (!sb) return;
    setActionLoading(true);
    await sb.from('parafia_members').delete().eq('id', id);
    setDeleteConfirm(null);
    if (selectedParafia) loadMembers(selectedParafia.id);
    setSuccessMsg('Czlonek usuniety z parafii');
    setActionLoading(false);
  };

  // ==================== AKCJE: OGŁOSZENIA ====================

  const sendAnnouncement = async () => {
    if (!sb) return;
    const tresc = tiptapEditor?.getHTML() || announcementForm.tresc;
    if (!tresc || tresc === '<p></p>') return;
    setActionLoading(true);

    // Generuj tytul z tresci (tak jak w glownej aplikacji dla ogloszen)
    const plainText = tresc.replace(/<[^>]*>/g, '').trim();
    const tytul = plainText ? `[ADMIN] ${plainText.substring(0, 50)}${plainText.length > 50 ? '...' : ''}` : '[ADMIN] Ogloszenie';

    try {
      if (scope === 'global') {
        const { data: allParafie, error: fetchErr } = await sb.from('parafie').select('id, admin_id');
        if (fetchErr) {
          setScopeError(`Blad pobierania parafii: ${fetchErr.message}`);
          setActionLoading(false);
          return;
        }
        if (allParafie && allParafie.length > 0) {
          const inserts = allParafie.map((p: any) => ({
            parafia_id: p.id,
            autor_id: p.admin_id,
            tytul,
            tresc,
            kategoria: 'ogłoszenie' as const,
            grupa_docelowa: announcementForm.grupa_docelowa,
            przypiety: true,
          }));
          const { error: insertErr } = await sb.from('tablica_watki').insert(inserts);
          if (insertErr) {
            setScopeError(`Blad wysylania ogloszenia: ${insertErr.message}`);
            setActionLoading(false);
            return;
          }
          setSuccessMsg(`Ogloszenie wyslane do ${allParafie.length} parafii`);
        }
      } else if (selectedParafia) {
        const { error: insertErr } = await sb.from('tablica_watki').insert({
          parafia_id: selectedParafia.id,
          autor_id: selectedParafia.admin_id,
          tytul,
          tresc,
          kategoria: 'ogłoszenie',
          grupa_docelowa: announcementForm.grupa_docelowa,
          przypiety: true,
        });
        if (insertErr) {
          setScopeError(`Blad wysylania ogloszenia: ${insertErr.message}`);
          setActionLoading(false);
          return;
        }
        setSuccessMsg('Ogloszenie wyslane');
      }

      setShowAnnouncementModal(false);
      setAnnouncementForm({ tytul: '', tresc: '', grupa_docelowa: 'wszyscy' });
      tiptapEditor?.commands.clearContent();
      await loadWatki(scope === 'parafia' ? selectedParafia?.id : undefined);
    } catch (err: any) {
      setScopeError(`Nieoczekiwany blad: ${err?.message || 'Nieznany blad'}`);
    }
    setActionLoading(false);
  };

  const updateAnnouncement = async () => {
    if (!sb || !editingWatekId) return;
    const tresc = tiptapEditor?.getHTML() || announcementForm.tresc;
    if (!tresc || tresc === '<p></p>') return;
    setActionLoading(true);

    const plainText = tresc.replace(/<[^>]*>/g, '').trim();
    const tytul = plainText ? `[ADMIN] ${plainText.substring(0, 50)}${plainText.length > 50 ? '...' : ''}` : '[ADMIN] Ogloszenie';

    try {
      const { error } = await sb.from('tablica_watki').update({
        tytul,
        tresc,
        grupa_docelowa: announcementForm.grupa_docelowa,
      }).eq('id', editingWatekId);

      if (error) {
        setScopeError(`Blad edycji ogloszenia: ${error.message}`);
        setActionLoading(false);
        return;
      }

      setSuccessMsg('Ogloszenie zaktualizowane');
      setShowAnnouncementModal(false);
      setAnnouncementForm({ tytul: '', tresc: '', grupa_docelowa: 'wszyscy' });
      setEditingWatekId(null);
      tiptapEditor?.commands.clearContent();
      await loadWatki(scope === 'parafia' ? selectedParafia?.id : undefined);
    } catch (err: any) {
      setScopeError(`Nieoczekiwany blad: ${err?.message || 'Nieznany blad'}`);
    }
    setActionLoading(false);
  };

  const deleteWatek = async (id: string) => {
    if (!sb) return;
    setActionLoading(true);
    await sb.from('tablica_watki').delete().eq('id', id);
    setDeleteConfirm(null);
    loadWatki(scope === 'parafia' ? selectedParafia?.id : undefined);
    setSuccessMsg('Watek usuniety');
    setActionLoading(false);
  };

  // ==================== AKCJE: KONFIGURACJA ====================

  const updatePunktacjaValue = async () => {
    if (!sb || !editPunktacja) return;
    setActionLoading(true);

    if (scope === 'global') {
      // Aktualizuj we wszystkich parafiach
      await sb.from('punktacja_config').update({ wartosc: Number(editPunktacjaValue) }).eq('klucz', editPunktacja.klucz);
      setSuccessMsg('Punktacja zaktualizowana we wszystkich parafiach');
    } else {
      await sb.from('punktacja_config').update({ wartosc: Number(editPunktacjaValue) }).eq('id', editPunktacja.id);
      setSuccessMsg('Punktacja zaktualizowana');
    }

    setEditPunktacja(null);
    loadPunktacja(scope === 'parafia' ? selectedParafia?.id : undefined);
    setActionLoading(false);
  };

  const updateRanga = async (id: string, field: string, value: any) => {
    if (!sb) return;
    await sb.from('rangi_config').update({ [field]: value }).eq('id', id);
    loadRangi(scope === 'parafia' ? selectedParafia?.id : undefined);
    setSuccessMsg('Ranga zaktualizowana');
  };

  const toggleOdznaka = async (id: string, aktywna: boolean) => {
    if (!sb) return;
    await sb.from('odznaki_config').update({ aktywna: !aktywna }).eq('id', id);
    loadOdznaki(scope === 'parafia' ? selectedParafia?.id : undefined);
  };

  // ==================== HELPERS ====================

  const getMemberCount = (parafiaId: string) => {
    return profiles.filter(p => p.parafia_id === parafiaId).length;
  };

  const getParafiaName = (parafiaId: string | null) => {
    if (!parafiaId) return '—';
    const p = parafie.find(x => x.id === parafiaId);
    return p ? p.nazwa : '—';
  };

  const filteredParafie = parafie.filter(p =>
    p.nazwa.toLowerCase().includes(searchParafie.toLowerCase()) ||
    p.miasto.toLowerCase().includes(searchParafie.toLowerCase()) ||
    p.admin_email.toLowerCase().includes(searchParafie.toLowerCase()) ||
    p.kod_zaproszenia.toLowerCase().includes(searchParafie.toLowerCase())
  );

  const filteredProfiles = profiles.filter(p =>
    p.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
    p.imie.toLowerCase().includes(searchUsers.toLowerCase()) ||
    p.nazwisko.toLowerCase().includes(searchUsers.toLowerCase())
  );

  // Deduplikacja punktacji w trybie globalnym — pokaż unikalne klucze
  const uniquePunktacja = scope === 'global'
    ? Object.values(punktacja.reduce((acc, p) => {
        if (!acc[p.klucz]) acc[p.klucz] = p;
        return acc;
      }, {} as Record<string, PunktacjaConfig>))
    : punktacja;

  const uniqueRangi = scope === 'global'
    ? Object.values(rangi.reduce((acc, r) => {
        if (!acc[r.nazwa]) acc[r.nazwa] = r;
        return acc;
      }, {} as Record<string, RangaConfig>))
    : rangi;

  const uniqueOdznaki = scope === 'global'
    ? Object.values(odznaki.reduce((acc, o) => {
        if (!acc[o.nazwa]) acc[o.nazwa] = o;
        return acc;
      }, {} as Record<string, OdznakaConfig>))
    : odznaki;

  // ==================== RENDER: LOGIN ====================

  if (!isAuthenticated) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Panel Administratora</CardTitle>
              <CardDescription className="text-gray-400">
                Wprowadz haslo, aby uzyskac dostep
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Haslo administratora</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Wprowadz haslo..."
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>
                {authError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {authError}
                  </div>
                )}
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Zaloguj sie
                </Button>
                <a href="/" className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Powrot do strony glownej
                </a>
              </div>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Panel Admina</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super administrator aplikacji</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Scope switcher */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => { setScope('global'); setSelectedParafia(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    scope === 'global'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Cala aplikacja
                </button>
                <button
                  onClick={() => setScope('parafia')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    scope === 'parafia'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Konkretna parafia
                </button>
              </div>

              <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="w-4 h-4 mr-1" />
                Wyloguj
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
            <TabsList className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl">
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
            </TabsList>

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
                {showEmojiPicker && (
                  <div className="absolute z-50 mt-1">
                    <Picker data={emojiData} locale="pl" theme={darkMode ? 'dark' : 'light'} onEmojiSelect={(emoji: { native: string }) => {
                      tiptapEditor?.chain().focus().insertContent(emoji.native).run();
                      setShowEmojiPicker(false);
                    }} />
                  </div>
                )}
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
