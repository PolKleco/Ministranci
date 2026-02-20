'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Cinzel } from 'next/font/google';
import {
  Trophy, Calendar, BookOpen, Bell, Church,
  Flame, Star, ChevronRight, ArrowRight,
  MessageSquare, Award, Hourglass,
  HandHelping, Shield,
  ChevronDown, Sparkles, Target, BarChart3,
} from 'lucide-react';

const cinzel = Cinzel({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

// ── Scroll reveal hook ────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(e.target);
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-amber-400/25" />
      <div className="w-1.5 h-1.5 rotate-45 bg-amber-400/40" />
      <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-amber-400/25" />
    </div>
  );
}

// ── Data ──────────────────────────────────────────────

const PROBLEMS = [
  {
    icon: Hourglass,
    title: 'Ręczne śledzenie obecności',
    desc: 'Papierowe listy, ołówki, zapomniane notatki. Godziny poświęcone na coś, co powinno zajmować sekundy.',
  },
  {
    icon: BarChart3,
    title: 'Spadająca motywacja',
    desc: 'Ministranci tracą zapał po kilku miesiącach. Bez systemu nagród i postępu, służba staje się rutyną.',
  },
  {
    icon: MessageSquare,
    title: 'Chaos komunikacyjny',
    desc: 'Ogłoszenia giną, informacje nie docierają. Każda zmiana w grafiku wymaga dziesiątek telefonów.',
  },
  {
    icon: Calendar,
    title: 'Planowanie w ciemno',
    desc: 'Kto służy w niedzielę? Kto niesie krzyż? Kto jest na wakacjach? Wieczne pytania bez odpowiedzi.',
  },
];

const FEATURES = [
  {
    icon: Trophy,
    title: 'Ranking i gamifikacja',
    desc: 'System punktów, 10 rang i 14 odznak. Ministranci rywalizują, zdobywają strzałki i śledzą postępy jak w grze.',
    accent: '#f59e0b',
  },
  {
    icon: Bell,
    title: 'Tablica ogłoszeń',
    desc: 'Wiadomości, ankiety i dyskusje w jednym miejscu. Z edytorem tekstu, obrazkami i filmami YouTube.',
    accent: '#3b82f6',
  },
  {
    icon: Calendar,
    title: 'Planowanie służb',
    desc: 'Przypisuj ministrantów do 7 ról liturgicznych. Krzyż, świece, kadzidło, ceremoniarz — wszystko zaplanowane.',
    accent: '#10b981',
  },
  {
    icon: BookOpen,
    title: 'Kalendarz liturgiczny',
    desc: 'Ponad 250 świąt i uroczystości z kolorami liturgicznymi. Automatyczne obliczanie dat ruchomych.',
    accent: '#a855f7',
  },
  {
    icon: HandHelping,
    title: 'Encyklopedia posług',
    desc: '12 ról liturgicznych z opisami, zdjęciami i filmami instruktażowymi. Idealny podręcznik ministranta.',
    accent: '#f43f5e',
  },
  {
    icon: Shield,
    title: 'Zarządzanie parafią',
    desc: 'Grupy ministrantów, kody zaproszeń, zarządzanie członkami. Całość pod kontrolą jednego dashboardu.',
    accent: '#06b6d4',
  },
];

const RANKS = [
  { name: 'Gotowy', pts: 0 },
  { name: 'Nowicjusz', pts: 50 },
  { name: 'Aktywny', pts: 150 },
  { name: 'Solidny', pts: 350 },
  { name: 'Niezawodny', pts: 600 },
  { name: 'Wprawny', pts: 1000 },
  { name: 'Zaawansowany', pts: 1500 },
  { name: 'Filar', pts: 2200 },
  { name: 'Elita', pts: 3200 },
  { name: 'Top', pts: 5000 },
];

// ── Page ──────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[#050510] text-slate-100 min-h-screen overflow-x-hidden">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .hero-animate { animation: heroFadeIn 0.9s ease-out both; }
        .hero-animate-d1 { animation: heroFadeIn 0.9s ease-out 0.2s both; }
        .hero-animate-d2 { animation: heroFadeIn 0.9s ease-out 0.4s both; }
      `}</style>

      {/* ─── Navigation ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050510]/85 backdrop-blur-xl border-b border-white/[0.04]'
            : ''
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Church className="w-5 h-5 text-amber-400" />
            <span className={`${cinzel.className} text-slate-200 font-semibold text-lg`}>
              Ministranci
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#funkcje"
              className="hidden sm:block text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Funkcje
            </a>
            <a
              href="#jak-to-dziala"
              className="hidden sm:block text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Jak to działa
            </a>
            <Link
              href="/app"
              className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-5 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Otwórz aplikację
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 20%, rgba(217,175,90,0.07) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 50% 70%, rgba(107,33,168,0.04) 0%, transparent 50%),
              #050510
            `,
          }}
        />

        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/20"
            style={{
              left: `${12 + i * 16}%`,
              top: `${18 + (i % 3) * 22}%`,
              animation: `float ${3 + i * 0.6}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-16">
          <div className="hero-animate flex items-center justify-center gap-2 mb-8">
            <Church className="w-5 h-5 text-amber-400/70" />
            <span className="text-amber-400/70 text-sm tracking-[0.3em] uppercase font-medium">
              Ministranci
            </span>
          </div>

          <h1
            className={`${cinzel.className} hero-animate-d1 text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-6`}
            style={{
              background: 'linear-gradient(135deg, #f5f0e8 0%, #d4a853 50%, #f5f0e8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Służba z pasją.
            <br />
            Parafia z porządkiem.
          </h1>

          <p className="hero-animate-d2 text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Aplikacja, która łączy tradycję z technologią. Motywuj ministrantów,
            planuj służby i buduj zaangażowaną wspólnotę parafialną.
          </p>

          <div className="hero-animate-d2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold px-8 py-3.5 rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
            >
              <span className="relative z-10">Rozpocznij teraz</span>
              <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <a
              href="#funkcje"
              className="inline-flex items-center gap-2 text-slate-300 font-medium px-8 py-3.5 rounded-full border border-slate-700 hover:border-slate-500 transition-colors"
            >
              Dowiedz się więcej
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="relative bg-[#0a0a1a] border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {(
            [
              { value: '10', label: 'Rang do zdobycia', Icon: Trophy },
              { value: '14', label: 'Unikalnych odznak', Icon: Award },
              { value: '250+', label: 'Świąt w kalendarzu', Icon: Calendar },
              { value: '7', label: 'Ról liturgicznych', Icon: HandHelping },
            ] as const
          ).map((stat, i) => (
            <Reveal key={i} delay={i * 100} className="text-center">
              <stat.Icon className="w-5 h-5 text-amber-400/50 mx-auto mb-2" />
              <div className={`${cinzel.className} text-3xl sm:text-4xl font-bold text-amber-400 mb-1`}>
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <Ornament />

      {/* ─── Problems ─── */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-amber-400/50 text-xs tracking-[0.25em] uppercase font-medium">
              Znany problem?
            </span>
            <h2 className={`${cinzel.className} text-3xl sm:text-4xl font-bold text-slate-100 mt-3`}>
              Czy to brzmi znajomo?
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Prowadzenie grupy ministrantów to piękna misja, ale codzienne
              zarządzanie bywa wyzwaniem.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-5">
            {PROBLEMS.map((p, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-red-500/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                    <p.icon className="w-5 h-5 text-red-400/70" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{p.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Ornament />

      {/* ─── Features ─── */}
      <section id="funkcje" className="relative bg-[#0a0a1a] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-amber-400/50 text-xs tracking-[0.25em] uppercase font-medium">
              Funkcje
            </span>
            <h2 className={`${cinzel.className} text-3xl sm:text-4xl font-bold text-slate-100 mt-3`}>
              Wszystko, czego potrzebuje Twoja parafia
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/15 transition-all duration-300 h-full">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${f.accent}15`, color: f.accent }}
                  >
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Ornament />

      {/* ─── How it works ─── */}
      <section id="jak-to-dziala" className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-amber-400/50 text-xs tracking-[0.25em] uppercase font-medium">
              Jak to działa
            </span>
            <h2 className={`${cinzel.className} text-3xl sm:text-4xl font-bold text-slate-100 mt-3`}>
              Trzy kroki do lepszej parafii
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            {/* Priest path */}
            <Reveal>
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 text-purple-400 font-medium text-sm">
                  <Church className="w-4 h-4" />
                  Dla księdza
                </span>
              </div>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Załóż parafię',
                    desc: 'Stwórz parafię, skonfiguruj system punktów, rang i odznak pod swoje potrzeby.',
                  },
                  {
                    step: '02',
                    title: 'Zaproś ministrantów',
                    desc: 'Udostępnij kod zaproszenia. Ministranci dołączą w kilka sekund.',
                  },
                  {
                    step: '03',
                    title: 'Zarządzaj i śledź',
                    desc: 'Planuj służby, publikuj ogłoszenia, zatwierdzaj obecności i obserwuj zaangażowanie.',
                  },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold shrink-0">
                        {s.step}
                      </div>
                      {i < 2 && <div className="w-px flex-1 bg-purple-500/10 mt-2" />}
                    </div>
                    <div className="pb-4">
                      <h4 className="font-semibold text-slate-200 mb-1">{s.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Ministrant path */}
            <Reveal delay={200}>
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 text-amber-400 font-medium text-sm">
                  <Star className="w-4 h-4" />
                  Dla ministranta
                </span>
              </div>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Dołącz do parafii',
                    desc: 'Zarejestruj się i wpisz kod zaproszenia od księdza.',
                  },
                  {
                    step: '02',
                    title: 'Służ i zgłaszaj',
                    desc: 'Po każdej służbie zgłoś obecność. Ksiądz zatwierdzi ją jednym kliknięciem.',
                  },
                  {
                    step: '03',
                    title: 'Zdobywaj i rywalizuj',
                    desc: 'Zbieraj punkty, awansuj w rankingu, zdobywaj odznaki i strzałki.',
                  },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">
                        {s.step}
                      </div>
                      {i < 2 && <div className="w-px flex-1 bg-amber-500/10 mt-2" />}
                    </div>
                    <div className="pb-4">
                      <h4 className="font-semibold text-slate-200 mb-1">{s.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ─── Gamification ─── */}
      <section className="relative bg-[#0a0a1a] py-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 40% at 50% 60%, rgba(245,158,11,0.03) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-amber-400/50 text-xs tracking-[0.25em] uppercase font-medium">
              Gamifikacja
            </span>
            <h2 className={`${cinzel.className} text-3xl sm:text-4xl font-bold text-slate-100 mt-3`}>
              Służba, która wciąga
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              System rang, odznak i strzałek sprawia, że ministranci sami chcą
              służyć. Zdrowa rywalizacja buduje zaangażowanie.
            </p>
          </Reveal>

          {/* Ranks progression */}
          <Reveal>
            <div className="relative py-8 mb-4">
              <div className="absolute top-1/2 left-[5%] right-[5%] h-px bg-gradient-to-r from-slate-800 via-amber-500/20 to-amber-400/30 hidden md:block -translate-y-4" />
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3 md:gap-2">
                {RANKS.map((rank, i) => {
                  const t = (i + 1) / RANKS.length;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 relative">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-500"
                        style={{
                          backgroundColor: `rgba(245,158,11,${(0.04 + t * 0.14).toFixed(2)})`,
                          borderColor: `rgba(245,158,11,${(0.08 + t * 0.35).toFixed(2)})`,
                          boxShadow: i >= 7 ? `0 0 ${10 + i * 3}px rgba(245,158,11,${(t * 0.18).toFixed(2)})` : 'none',
                        }}
                      >
                        {i < 3 ? (
                          <Star className="w-4 h-4" style={{ color: `rgba(245,158,11,${(0.3 + t * 0.7).toFixed(2)})` }} />
                        ) : i < 7 ? (
                          <Flame className="w-4 h-4" style={{ color: `rgba(245,158,11,${(0.3 + t * 0.7).toFixed(2)})` }} />
                        ) : (
                          <Trophy className="w-4 h-4" style={{ color: `rgba(245,158,11,${(0.3 + t * 0.7).toFixed(2)})` }} />
                        )}
                      </div>
                      <div className="text-center">
                        <span
                          className="text-[10px] sm:text-xs font-medium block"
                          style={{ color: `rgba(245,158,11,${(0.35 + t * 0.65).toFixed(2)})` }}
                        >
                          {rank.name}
                        </span>
                        <span className="text-[9px] text-slate-600 hidden sm:block">
                          {rank.pts} pkt
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Badges, streaks, multipliers */}
          <div className="grid sm:grid-cols-3 gap-5 mt-8">
            {[
              {
                Icon: Award,
                title: '14 odznak',
                desc: 'Od "Pierwszej Służby" po "Rekord Parafii". Każda za wyjątkowe osiągnięcie.',
              },
              {
                Icon: Flame,
                title: 'Strzałki (streaks)',
                desc: 'Bonusy za regularność: +5 za 3 dni/tyg., +30 za pełny tydzień, +120 za 8 tygodni z rzędu.',
              },
              {
                Icon: Target,
                title: 'Mnożniki sezonowe',
                desc: 'Wielki Post i Adwent to ×1.5 punktów. Najlepsi zdobywają dodatkowe nagrody miesięczne.',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                  <item.Icon className="w-7 h-7 text-amber-400/50 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-200 mb-2">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Ornament />

      {/* ─── CTA ─── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 50%, rgba(245,158,11,0.05) 0%, transparent 60%),
              #050510
            `,
          }}
        />
        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <Sparkles className="w-7 h-7 text-amber-400/35 mx-auto mb-6" />
          <h2 className={`${cinzel.className} text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 mb-6`}>
            Gotowy na zmianę?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Dołącz do parafii, które korzystają z nowoczesnego zarządzania
            ministrantami. Rejestracja jest darmowa.
          </p>
          <Link
            href="/app"
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold px-10 py-4 rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] text-lg"
          >
            <span className="relative z-10">Rozpocznij teraz</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <p className="text-slate-600 text-sm mt-6">
            Bez karty kredytowej &middot; Bez limitu czasu &middot; Bez ograniczeń
          </p>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Church className="w-4 h-4 text-amber-400/50" />
              <span className={`${cinzel.className} text-slate-500 font-semibold text-sm`}>
                Ministranci
              </span>
            </div>
            <p className="text-slate-700 text-xs">
              Stworzone z miłością do służby liturgicznej
            </p>
            <Link
              href="/app"
              className="text-amber-400/50 hover:text-amber-400 text-sm transition-colors flex items-center gap-1"
            >
              Zaloguj się
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/[0.03]">
            <Link
              href="/polityka-prywatnosci"
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Polityka prywatności
            </Link>
            <span className="text-slate-800">|</span>
            <Link
              href="/regulamin"
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Regulamin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
