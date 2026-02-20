'use client';

import Link from 'next/link';
import { Cinzel } from 'next/font/google';
import { Church, ChevronLeft } from 'lucide-react';

const cinzel = Cinzel({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export default function Regulamin() {
  return (
    <div className="bg-[#050510] text-slate-100 min-h-screen">
      <nav className="bg-[#050510]/85 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Church className="w-5 h-5 text-amber-400" />
            <span className={`${cinzel.className} text-slate-200 font-semibold text-lg`}>
              Ministranci
            </span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Powrót
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1
          className={`${cinzel.className} text-3xl sm:text-4xl font-bold mb-2`}
          style={{
            background: 'linear-gradient(135deg, #f5f0e8 0%, #d4a853 50%, #f5f0e8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Regulamin
        </h1>
        <p className="text-slate-500 text-sm mb-12">
          Ostatnia aktualizacja: 20 lutego 2026 r.
        </p>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            1. Postanowienia ogólne
          </h2>
          <div className="text-slate-400 leading-relaxed space-y-3">
            <p>
              Niniejszy Regulamin określa zasady korzystania z aplikacji internetowej &bdquo;Ministranci&rdquo;
              (dalej: &bdquo;Aplikacja&rdquo; lub &bdquo;Serwis&rdquo;), dostępnej pod adresem internetowym,
              za pośrednictwem której świadczona jest usługa zarządzania grupami ministrantów w parafiach.
            </p>
            <p>
              Korzystanie z Aplikacji jest bezpłatne i wymaga rejestracji konta użytkownika.
            </p>
            <p>
              Przed rozpoczęciem korzystania z Aplikacji każdy Użytkownik zobowiązany jest zapoznać się
              z niniejszym Regulaminem oraz{' '}
              <Link href="/polityka-prywatnosci" className="text-amber-400 hover:text-amber-300 underline">
                Polityką Prywatności
              </Link>.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            2. Definicje
          </h2>
          <ul className="text-slate-400 leading-relaxed space-y-2 ml-2">
            <li>
              <strong className="text-slate-300">Użytkownik</strong> &mdash; osoba fizyczna, która zarejestrowała
              konto w Aplikacji.
            </li>
            <li>
              <strong className="text-slate-300">Administrator Parafii</strong> &mdash; Użytkownik o typie konta
              &bdquo;ksiądz&rdquo;, który utworzył parafię w Aplikacji i zarządza jej członkami.
            </li>
            <li>
              <strong className="text-slate-300">Ministrant</strong> &mdash; Użytkownik o typie konta
              &bdquo;ministrant&rdquo;, będący członkiem parafii.
            </li>
            <li>
              <strong className="text-slate-300">Parafia</strong> &mdash; jednostka organizacyjna w Aplikacji,
              zrzeszająca Administratora Parafii i Ministrantów.
            </li>
            <li>
              <strong className="text-slate-300">Usługa</strong> &mdash; świadczona drogą elektroniczną usługa
              zarządzania grupą ministrantów, obejmująca ewidencję obecności, system gamifikacji,
              tablicę ogłoszeń i planowanie służb.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            3. Warunki korzystania
          </h2>
          <div className="text-slate-400 leading-relaxed space-y-3">
            <p>
              Do korzystania z Aplikacji wymagane jest urządzenie z dostępem do Internetu
              oraz aktualna przeglądarka internetowa.
            </p>
            <p>
              Rejestracja konta wymaga podania prawdziwych danych osobowych (imię, nazwisko, adres e-mail).
            </p>
            <p>
              Osoby poniżej 16 roku życia mogą korzystać z Aplikacji wyłącznie za zgodą
              rodzica lub opiekuna prawnego, zgodnie z art. 8 RODO.
            </p>
            <p>
              Każdy Użytkownik może posiadać tylko jedno konto w Aplikacji.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            4. Obowiązki użytkownika
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Użytkownik zobowiązuje się do:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>Korzystania z Aplikacji zgodnie z jej przeznaczeniem</li>
            <li>Nieudostępniania danych logowania osobom trzecim</li>
            <li>Niepublikowania treści obraźliwych, wulgarnych lub niezgodnych z prawem</li>
            <li>Niepodejmowania prób nieuprawnionego dostępu do danych innych Użytkowników</li>
            <li>Niezakłócania prawidłowego działania Aplikacji</li>
            <li>Przestrzegania prawa polskiego i zasad współżycia społecznego</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            5. Rola Administratora Parafii
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Administrator Parafii (ksiądz) odpowiada za:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>Zarządzanie członkami parafii (zapraszanie, usuwanie)</li>
            <li>Weryfikację tożsamości ministrantów dołączających do parafii</li>
            <li>Zapewnienie zgody rodziców/opiekunów prawnych dla osób poniżej 16 roku życia</li>
            <li>Moderowanie treści publikowanych na tablicy ogłoszeń</li>
            <li>Prawidłowe prowadzenie ewidencji obecności</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            6. Dane osobowe
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Zasady przetwarzania danych osobowych określa{' '}
            <Link href="/polityka-prywatnosci" className="text-amber-400 hover:text-amber-300 underline">
              Polityka Prywatności
            </Link>
            , stanowiąca integralną część niniejszego Regulaminu. Rejestrując konto, Użytkownik
            wyraża zgodę na przetwarzanie swoich danych osobowych zgodnie z Polityką Prywatności.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            7. Własność intelektualna
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Wszelkie prawa własności intelektualnej do Aplikacji, w tym kod źródłowy, projekt
            graficzny, logo i nazwa, należą do twórcy Aplikacji. Użytkownik nie nabywa żadnych
            praw własności intelektualnej poprzez korzystanie z Serwisu. Treści publikowane
            przez Użytkowników na tablicy ogłoszeń pozostają ich własnością.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            8. Ograniczenie odpowiedzialności
          </h2>
          <div className="text-slate-400 leading-relaxed space-y-3">
            <p>
              Aplikacja udostępniana jest w stanie &bdquo;takim, jaki jest&rdquo; (as is).
              Twórca Aplikacji dokłada starań, aby Serwis działał prawidłowo, jednak
              nie gwarantuje nieprzerwanego i bezbłędnego działania.
            </p>
            <p>
              Twórca Aplikacji nie ponosi odpowiedzialności za:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Przerwy w działaniu Aplikacji wynikające z przyczyn technicznych</li>
              <li>Utratę danych spowodowaną działaniem siły wyższej</li>
              <li>Treści publikowane przez Użytkowników</li>
              <li>Sposób wykorzystania Aplikacji przez Użytkowników</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            9. Zmiana Regulaminu
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Twórca Aplikacji zastrzega sobie prawo do zmiany niniejszego Regulaminu.
            O zmianach Użytkownicy będą informowani za pośrednictwem Aplikacji.
            Dalsze korzystanie z Aplikacji po wprowadzeniu zmian oznacza akceptację
            nowego Regulaminu.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            10. Postanowienia końcowe
          </h2>
          <div className="text-slate-400 leading-relaxed space-y-3">
            <p>
              W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy
              prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o świadczeniu usług
              drogą elektroniczną oraz RODO.
            </p>
            <p>
              Ewentualne spory wynikające z korzystania z Aplikacji rozstrzygane będą
              przez sąd właściwy dla siedziby twórcy Aplikacji.
            </p>
            <p>
              Regulamin wchodzi w życie z dniem 20 lutego 2026 r.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Church className="w-4 h-4 text-amber-400/50" />
            <span className={`${cinzel.className} text-slate-500 font-semibold text-sm`}>
              Ministranci
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/polityka-prywatnosci" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
              Polityka prywatności
            </Link>
            <span className="text-slate-800">|</span>
            <Link href="/app" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
              Aplikacja
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
