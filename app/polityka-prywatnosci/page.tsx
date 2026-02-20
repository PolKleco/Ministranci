'use client';

import Link from 'next/link';
import { Cinzel } from 'next/font/google';
import { Church, ChevronLeft } from 'lucide-react';

const cinzel = Cinzel({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export default function PolitykaPrywatnosci() {
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
          Polityka Prywatności
        </h1>
        <p className="text-slate-500 text-sm mb-12">
          Ostatnia aktualizacja: 20 lutego 2026 r.
        </p>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            1. Administrator danych
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Administratorem danych osobowych przetwarzanych w aplikacji &bdquo;Ministranci&rdquo; jest administrator parafii
            (ksiądz), który zakłada parafię w systemie. Każda parafia w aplikacji stanowi odrębną jednostkę
            przetwarzania danych, a jej administrator odpowiada za dane osobowe członków swojej parafii.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            2. Jakie dane zbieramy
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            W ramach korzystania z aplikacji przetwarzamy następujące dane osobowe:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>Adres e-mail (do logowania i komunikacji)</li>
            <li>Imię i nazwisko</li>
            <li>Typ konta (ministrant lub ksiądz)</li>
            <li>Grupa ministrancka (przypisanie do grupy w parafii)</li>
            <li>Dane obecności na służbach liturgicznych</li>
            <li>Punkty, rangi i odznaki (system gamifikacji)</li>
            <li>Treści publikowane na tablicy ogłoszeń (wiadomości, komentarze, odpowiedzi w ankietach)</li>
            <li>Zdjęcie profilowe (jeśli zostanie dodane)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            3. Cel przetwarzania danych
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Dane osobowe przetwarzane są w następujących celach:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>Umożliwienie rejestracji i logowania w aplikacji</li>
            <li>Zarządzanie grupą ministrantów w parafii</li>
            <li>Ewidencja obecności na służbach liturgicznych</li>
            <li>Prowadzenie systemu motywacyjnego (rangi, punkty, odznaki)</li>
            <li>Komunikacja wewnątrz parafii (ogłoszenia, dyskusje, ankiety)</li>
            <li>Planowanie służb liturgicznych</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            4. Podstawa prawna przetwarzania
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Dane osobowe przetwarzane są na podstawie:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>
              <strong className="text-slate-300">Art. 6 ust. 1 lit. a) RODO</strong> &mdash; zgoda użytkownika wyrażona
              podczas rejestracji w aplikacji
            </li>
            <li>
              <strong className="text-slate-300">Art. 6 ust. 1 lit. b) RODO</strong> &mdash; niezbędność przetwarzania
              do wykonania umowy (świadczenie usługi aplikacji)
            </li>
            <li>
              <strong className="text-slate-300">Art. 9 ust. 2 lit. d) RODO</strong> &mdash; przetwarzanie danych
              dotyczących przynależności religijnej w ramach uprawnionej działalności prowadzonej przez podmiot
              o celu religijnym (parafia)
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            5. Dane osób niepełnoletnich
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Aplikacja jest przeznaczona m.in. dla ministrantów, którzy mogą być osobami niepełnoletnimi.
            Zgodnie z art. 8 RODO oraz polską ustawą o ochronie danych osobowych:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>
              Rejestracja osoby poniżej <strong className="text-slate-300">16 roku życia</strong> wymaga zgody
              rodzica lub opiekuna prawnego
            </li>
            <li>
              Rodzic lub opiekun prawny powinien wyrazić zgodę na przetwarzanie danych dziecka
              przed założeniem konta
            </li>
            <li>
              Administrator parafii (ksiądz) zobowiązany jest do weryfikacji, czy ministranci
              poniżej 16 roku życia posiadają zgodę rodzica na korzystanie z aplikacji
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            6. Odbiorcy danych
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Dane osobowe mogą być przekazywane następującym odbiorcom:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li>
              <strong className="text-slate-300">Supabase Inc.</strong> &mdash; dostawca infrastruktury bazodanowej
              i uwierzytelniania. Dane przechowywane są na serwerach w Unii Europejskiej.
            </li>
            <li>
              <strong className="text-slate-300">Administrator parafii</strong> &mdash; ksiądz zarządzający parafią
              ma dostęp do danych ministrantów w swojej parafii.
            </li>
          </ul>
          <p className="text-slate-400 leading-relaxed mt-3">
            Dane nie są udostępniane podmiotom trzecim w celach marketingowych ani reklamowych.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            7. Okres przechowywania danych
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Dane osobowe przechowywane są przez okres korzystania z aplikacji. Po usunięciu konta
            użytkownika dane są trwale usuwane z bazy danych. Wątki przeniesione do archiwum
            są automatycznie usuwane po upływie 1 miesiąca od daty archiwizacji.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            8. Prawa użytkownika
          </h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            Zgodnie z RODO, każdemu użytkownikowi przysługują następujące prawa:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
            <li><strong className="text-slate-300">Prawo dostępu</strong> do swoich danych (art. 15 RODO)</li>
            <li><strong className="text-slate-300">Prawo do sprostowania</strong> danych (art. 16 RODO)</li>
            <li><strong className="text-slate-300">Prawo do usunięcia</strong> danych &mdash; &bdquo;prawo do bycia zapomnianym&rdquo; (art. 17 RODO)</li>
            <li><strong className="text-slate-300">Prawo do ograniczenia</strong> przetwarzania (art. 18 RODO)</li>
            <li><strong className="text-slate-300">Prawo do przenoszenia</strong> danych (art. 20 RODO)</li>
            <li><strong className="text-slate-300">Prawo do sprzeciwu</strong> wobec przetwarzania (art. 21 RODO)</li>
            <li><strong className="text-slate-300">Prawo do cofnięcia zgody</strong> w dowolnym momencie (art. 7 ust. 3 RODO)</li>
          </ul>
          <p className="text-slate-400 leading-relaxed mt-3">
            W celu realizacji powyższych praw należy skontaktować się z administratorem parafii
            lub napisać na adres podany w sekcji &bdquo;Kontakt&rdquo;.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            9. Pliki cookies
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Aplikacja wykorzystuje pliki cookies niezbędne do prawidłowego działania serwisu,
            w szczególności do utrzymania sesji użytkownika (uwierzytelnianie). Są to cookies
            techniczne, bez których korzystanie z aplikacji nie byłoby możliwe. Aplikacja
            nie wykorzystuje cookies marketingowych ani analitycznych.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`${cinzel.className} text-xl font-semibold text-amber-400/90 mb-4`}>
            10. Kontakt
          </h2>
          <p className="text-slate-400 leading-relaxed">
            W sprawach związanych z ochroną danych osobowych można kontaktować się
            z administratorem aplikacji za pośrednictwem administratora parafii (księdza)
            lub bezpośrednio pod adresem e-mail wskazanym w profilu parafii.
          </p>
          <p className="text-slate-400 leading-relaxed mt-3">
            Użytkownik ma również prawo wniesienia skargi do organu nadzorczego &mdash;
            Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa,
            www.uodo.gov.pl).
          </p>
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
            <Link href="/regulamin" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
              Regulamin
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
