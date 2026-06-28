'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Language, t as translate } from '@/lib/i18n';

const STORAGE_KEY = 'phylax_language';
const DEFAULT: Language = 'ru';
const VALID: Language[] = ['ru', 'kk', 'en'];

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT,
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && (VALID as string[]).includes(stored)) setLangState(stored);
    } catch {}
  }, []);

  function setLang(next: Language) {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: (key) => translate(lang, key) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
