'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/[0.06] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-400 text-sm text-center sm:text-left">
          Ta strona używa plików cookies niezbędnych do działania aplikacji
          (uwierzytelnianie, sesja użytkownika). Korzystając z serwisu,
          akceptujesz ich użycie.{' '}
          <a href="/polityka-prywatnosci" className="text-amber-400 hover:text-amber-300 underline">
            Polityka prywatności
          </a>
        </p>
        <button
          onClick={acceptCookies}
          className="shrink-0 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-6 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
        >
          Akceptuję
        </button>
      </div>
    </div>
  );
}
