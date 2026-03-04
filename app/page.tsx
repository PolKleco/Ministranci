'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Church,
  Crown,
  Medal,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Ticket,
  Users,
} from 'lucide-react';

const headingFontClass = 'font-serif';

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
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
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/18 bg-sky-300/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

const MODULES = [
  'Aktualności',
  'Ministranci',
  'Ranking',
  'Wydarzenia',
  'Kalendarz',
  'Posługi',
  'Modlitwy',
  'Wskazówki',
];

const PRIEST_FEATURES = [
  {
    title: 'Tablica parafii',
    desc: 'Ogłoszenia, dyskusje i ankiety w jednym miejscu, z archiwum i obowiązkowymi odpowiedziami.',
  },
  {
    title: 'Panel ministrantów',
    desc: 'Zatwierdzanie nowych osób, grupy, przypisywanie posług, dyżury i szybki kontakt mailowy.',
  },
  {
    title: 'Ranking i punktacja',
    desc: 'Obecności, bonusy, minusowe punkty, rangi i odznaki konfigurowane bezpośrednio w aplikacji.',
  },
  {
    title: 'Wydarzenia i funkcje',
    desc: 'Planowanie Mszy i nabożeństw z przypisaniem konkretnych funkcji ministrantów na godziny.',
  },
];

const MINISTRANT_FEATURES = [
  'Najbliższa służba i przypisane funkcje widoczne od razu po wejściu',
  'Zgłaszanie obecności po Mszy, a potem śledzenie akceptacji i punktów',
  'Ranking parafii, rangi, odznaki i serie regularności',
  'Modlitwy przed i po służbie oraz przewodnik ministranta',
];

const LITURGY_FEATURES = [
  'Kalendarz liturgiczny z okresami, świętami, wspomnieniami i kolorami szat',
  'Baza posług liturgicznych z opisami, zdjęciami i filmami YouTube',
  'Modlitwy własne parafii oraz łacina z tłumaczeniami',
  'Wskazówki „przed Mszą”, „podczas Mszy” i najważniejsze zasady służby',
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09111d] text-white">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes fadeLift {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .intro-0 { animation: fadeLift 0.75s ease-out both; }
        .intro-1 { animation: fadeLift 0.75s ease-out 0.12s both; }
        .intro-2 { animation: fadeLift 0.75s ease-out 0.24s both; }
      `}</style>

      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/8 bg-[#09111d]/85 backdrop-blur-xl' : ''
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300/20 to-cyan-300/10">
              <Church className="h-4.5 w-4.5 text-sky-200" />
            </div>
            <div>
              <div className={`${headingFontClass} text-2xl leading-none text-white`}>Ministranci</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.26em] text-slate-400">Docelowa wersja 3</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#moduly" className="hidden text-sm text-slate-300 transition-colors hover:text-white sm:block">
              Moduły
            </a>
            <a href="#dla-kogo" className="hidden text-sm text-slate-300 transition-colors hover:text-white sm:block">
              Dla kogo
            </a>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-sky-300 px-5 py-2 text-sm font-semibold text-slate-950"
            >
              Otwórz aplikację
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-22 pt-28 sm:pb-28 sm:pt-34">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 16% 18%, rgba(125, 211, 252, 0.18), transparent 24%),
              radial-gradient(circle at 82% 20%, rgba(34, 211, 238, 0.15), transparent 22%),
              radial-gradient(circle at 50% 70%, rgba(59, 130, 246, 0.08), transparent 28%),
              linear-gradient(180deg, #09111d 0%, #0a1628 42%, #0d1a2c 100%)
            `,
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-14 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
            <div>
              <div className="intro-0">
                <Tag>Landing oparty na realnej aplikacji</Tag>
              </div>

              <h1 className={`${headingFontClass} intro-1 mt-6 max-w-3xl text-5xl leading-[0.96] text-white sm:text-7xl`}>
                Parafia widzi porządek.
                <span className="block text-sky-200">Ministrant widzi, co ma zrobić.</span>
              </h1>

              <p className="intro-2 mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                To nie jest już ogólny landing. Ta wersja pokazuje prawdziwy produkt: 8 modułów, osobny widok księdza i
                ministranta, realny grafik służb, ranking, ogłoszenia, ankiety, kalendarz liturgiczny i baza posług.
              </p>

              <div className="intro-2 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-300 px-7 py-4 text-base font-semibold text-slate-950 transition-all hover:shadow-[0_14px_40px_rgba(125,211,252,0.18)]"
                >
                  Załóż darmowe konto parafii
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#podglad"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-medium text-white transition-colors hover:bg-white/[0.06]"
                >
                  Zobacz podgląd produktu
                  <ChevronDown className="h-4 w-4" />
                </a>
              </div>

              <div className="intro-2 mt-9 grid gap-3 sm:grid-cols-3">
                {[
                  ['8 modułów', 'w głównej aplikacji'],
                  ['2 role', 'ksiądz i ministrant'],
                  ['5 osób', 'w darmowym planie'],
                ].map(([value, label], index) => (
                  <div key={index} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="text-xl font-semibold text-sky-200">{value}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div id="podglad" className="intro-2">
              <div className="rounded-[2.1rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_90px_rgba(2,8,23,0.5)] backdrop-blur-sm">
                <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[1.8rem] border border-white/8 bg-[#0d1f36] p-5">
                    <div className="flex items-center justify-between border-b border-white/8 pb-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Widok księdza</div>
                        <div className="mt-1 text-lg font-semibold text-white">Panel parafii</div>
                      </div>
                      <div className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Dzisiaj
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-[#112845] p-4">
                          <Users className="h-4 w-4 text-sky-200" />
                          <div className="mt-3 text-2xl font-semibold text-white">5 / 5</div>
                          <div className="mt-1 text-xs leading-5 text-slate-300">limit darmowego planu</div>
                        </div>
                        <div className="rounded-2xl bg-[#112845] p-4">
                          <Calendar className="h-4 w-4 text-cyan-200" />
                          <div className="mt-3 text-2xl font-semibold text-white">6</div>
                          <div className="mt-1 text-xs leading-5 text-slate-300">wydarzeń w tygodniu</div>
                        </div>
                        <div className="rounded-2xl bg-[#112845] p-4">
                          <Bell className="h-4 w-4 text-emerald-200" />
                          <div className="mt-3 text-2xl font-semibold text-white">3</div>
                          <div className="mt-1 text-xs leading-5 text-slate-300">rzeczy do akcji</div>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-[#112845] p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-white">Co jest pod ręką</div>
                            <div className="text-xs text-slate-400">Bez przełączania między czatami i notatkami</div>
                          </div>
                          <div className="rounded-full border border-sky-300/15 bg-sky-300/8 px-3 py-1 text-xs text-sky-200">
                            4 obszary
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {[
                            ['Ogłoszenia, dyskusje i ankiety', 'tablica'],
                            ['Zatwierdzanie obecności i ranking', 'punkty'],
                            ['Plan wydarzeń i przypisane funkcje', 'grafik'],
                            ['Grupy, dyżury i posługi ministrantów', 'zarządzanie'],
                          ].map(([label, action], index) => (
                            <div key={index} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Check className="h-4 w-4 text-emerald-300" />
                                <span className="text-sm text-slate-200">{label}</span>
                              </div>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                                {action}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-white/8 bg-[#0f2742] p-5">
                    <div className="mx-auto w-full max-w-[280px] rounded-[2rem] border border-white/8 bg-[#091a2d] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="rounded-[1.5rem] bg-[#10243b] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Widok ministranta</span>
                          <span className="rounded-full bg-sky-300/10 px-2.5 py-1 text-[10px] text-sky-200">Telefon</span>
                        </div>

                        <div className="mt-5 rounded-3xl bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Najbliższa służba</div>
                          <div className="mt-2 text-2xl font-semibold text-white">Niedziela 10:30</div>
                          <div className="mt-1 text-xs leading-5 text-slate-300">Krzyż, świece, procesja wejścia</div>
                        </div>

                        <div className="mt-4 rounded-3xl bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">Postęp</span>
                            <span className="text-xs text-sky-200">+35 pkt</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-white/6">
                            <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-sky-300 to-cyan-300" />
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                            <Medal className="h-3.5 w-3.5 text-sky-200" />
                            Ranga: Solidny
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <MessageSquare className="h-4 w-4 text-cyan-200" />
                              Aktualności
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-300">
                              Ogłoszenie i ankieta są widoczne bezpośrednio w aplikacji.
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <BookOpen className="h-4 w-4 text-sky-200" />
                              Modlitwy i wskazówki
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-300">
                              Przewodnik, modlitwy i baza wiedzy są zawsze pod ręką.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/6 bg-[#0b1728] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-slate-200">
            Najmocniejsza wersja landing page jest wtedy, gdy pokazuje faktyczny układ produktu już na pierwszym ekranie.
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-300" />
              realne funkcje
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-300" />
              prawdziwy model cenowy
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-300" />
              prawdziwe role użytkowników
            </span>
          </div>
        </div>
      </section>

      <section id="moduly" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <Tag>Mapa aplikacji</Tag>
            <h2 className={`${headingFontClass} mt-5 text-4xl text-white sm:text-6xl`}>
              8 modułów zamiast kilku osobnych narzędzi
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Główna aplikacja naprawdę jest podzielona na konkretne zakładki. To warto pokazać na landing page, bo
              od razu buduje zrozumienie produktu i jego zakresu.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((module, index) => (
              <Reveal key={module} delay={index * 50}>
                <div className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Moduł {index + 1}</div>
                  <div className="mt-3 text-lg font-semibold text-white">{module}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="dla-kogo" className="bg-[#0b1728] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <Reveal>
            <Tag>Dla księdza</Tag>
            <h2 className={`${headingFontClass} mt-5 text-4xl text-white sm:text-6xl`}>
              Zarządzanie parafią bez ręcznego pilnowania wszystkiego
            </h2>
            <div className="mt-8 grid gap-4">
              {PRIEST_FEATURES.map((item, index) => (
                <div key={index} className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] p-5">
                  <div className="text-base font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Tag>Dla ministranta</Tag>
            <h2 className={`${headingFontClass} mt-5 text-4xl text-white sm:text-6xl`}>
              Prosty widok, który prowadzi krok po kroku
            </h2>
            <div className="mt-8 space-y-4">
              {MINISTRANT_FEATURES.map((item, index) => (
                <div key={index} className="flex items-start gap-3 rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <Smartphone className="mt-1 h-4 w-4 shrink-0 text-sky-200" />
                  <span className="text-sm leading-7 text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <Tag>Liturgia i formacja</Tag>
            <h2 className={`${headingFontClass} mt-5 text-4xl text-white sm:text-6xl`}>
              To nie jest tylko grafik. To realne wsparcie służby.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Aplikacja ma wbudowane elementy, których zwykle brakuje w zwykłych “organizatorach”: kalendarz
              liturgiczny, modlitwy, przewodnik i rozwijane posługi z materiałami.
            </p>

            <div className="mt-8 space-y-4">
              {LITURGY_FEATURES.map((item, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-4">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="text-sm leading-7 text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] bg-[#10243b] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Calendar className="h-4 w-4 text-sky-200" />
                    Kalendarz liturgiczny
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Widok miesięczny, święta, wspomnienia oraz kolory liturgiczne widoczne bez dodatkowych materiałów.
                  </p>
                </div>

                <div className="rounded-[1.6rem] bg-[#10243b] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <BookOpen className="h-4 w-4 text-cyan-200" />
                    Modlitwy i łacina
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Modlitwa przed i po służbie, plus sekcje łacińskie z tłumaczeniem dla lepszej formacji.
                  </p>
                </div>

                <div className="rounded-[1.6rem] bg-[#10243b] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-sky-200" />
                    Posługi z multimediami
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Każda posługa może mieć opis rozszerzony, galerię zdjęć i film instruktażowy.
                  </p>
                </div>

                <div className="rounded-[1.6rem] bg-[#10243b] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Star className="h-4 w-4 text-cyan-200" />
                    Przewodnik ministranta
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Zasady przed Mszą, podczas Mszy i najważniejsze reguły zachowania w jednym miejscu.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#0b1728] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <Reveal>
            <Tag>Powiadomienia i dostępność</Tag>
            <h2 className={`${headingFontClass} mt-5 text-4xl text-white sm:text-6xl`}>
              Aplikacja działa jak narzędzie codzienne, nie jak martwy panel
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              W kodzie są realne powiadomienia push, wsparcie instalacji na iPhone oraz mechanika przypominająca o
              ankietach, ogłoszeniach i zmianach. To warto pokazać, bo odróżnia aplikację od zwykłego “panelu www”.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Push dla ogłoszeń, dyskusji i ankiet',
                'Obowiązkowe ankiety z terminem odpowiedzi',
                'Widok PWA i instrukcja instalacji na iPhone',
                'Archiwum ogłoszeń, ankiet, dyskusji i wydarzeń',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-4">
                  <Bell className="mt-1 h-4 w-4 shrink-0 text-sky-200" />
                  <span className="text-sm leading-7 text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
              <div className="rounded-[1.8rem] bg-[#10243b] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Model produktu</div>
                <div className="mt-3 flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-sky-200" />
                  <div className="text-lg font-semibold text-white">Freemium bez cięcia funkcji</div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Plan darmowy</span>
                      <span className="text-xs font-semibold text-sky-200">5 ministrantów</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Wszystkie funkcje są dostępne od startu. Ograniczenie dotyczy tylko liczby ministrantów.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Premium</span>
                      <span className="text-xs font-semibold text-amber-200">bez limitu</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Premium odblokowuje nieograniczoną liczbę ministrantów. Reszta systemu zostaje taka sama.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-300/12 bg-sky-300/6 p-4">
                    <div className="flex items-start gap-3">
                      <Crown className="mt-1 h-4 w-4 text-sky-200" />
                      <p className="text-sm leading-7 text-slate-200">
                        To mocny argument sprzedażowy: nie trzeba ukrywać funkcji za paywallem. Landing może mówić
                        wprost, że darmowy plan jest pełny, tylko mniejszy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 pb-24 pt-20">
        <Reveal className="mx-auto max-w-5xl rounded-[2.2rem] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(125,211,252,0.1),rgba(255,255,255,0.03))] px-6 py-10 text-center sm:px-10">
          <Tag>Docelowe CTA</Tag>
          <h2 className={`${headingFontClass} mt-5 text-4xl text-white sm:text-6xl`}>
            Ten wariant najlepiej pasuje do Twojej aplikacji
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-200">
            Bo nie sprzedaje abstrakcyjnej obietnicy. Pokazuje dokładnie to, co naprawdę masz: dwie role użytkownika,
            8 modułów, liturgiczne wsparcie, freemium bez cięcia funkcji i produkt, który da się zrozumieć od razu.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-300 px-8 py-4 text-base font-semibold text-slate-950"
            >
              Załóż darmowe konto parafii
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#moduly"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-8 py-4 text-base font-medium text-white"
            >
              Wróć do modułów
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
