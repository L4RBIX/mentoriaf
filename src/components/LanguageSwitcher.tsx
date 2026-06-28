'use client';

import { useLanguage } from './LanguageProvider';
import type { Language } from '@/lib/i18n';

const LANGS: { code: Language; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kk', label: 'KZ' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 4,
        padding: 2,
        gap: 1,
        flexShrink: 0,
      }}
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.06em',
            color: lang === code ? '#fff' : 'rgba(255,255,255,0.35)',
            background: lang === code ? 'rgba(255,255,255,0.11)' : 'transparent',
            border: 'none',
            borderRadius: 2,
            padding: '4px 9px',
            cursor: 'pointer',
            transition: 'background 140ms ease, color 140ms ease',
            lineHeight: 1.4,
            fontWeight: lang === code ? 500 : 400,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
