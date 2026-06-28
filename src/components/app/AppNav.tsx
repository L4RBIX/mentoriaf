'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function AppNav() {
  const path = usePathname();
  const { t } = useLanguage();

  const links = [
    { href: '/app',           key: 'nav_platform' },
    { href: '/app/sender',    key: 'nav_sender' },
    { href: '/app/reviewer',  key: 'nav_reviewer' },
    { href: '/app/dashboard', key: 'nav_analytics' },
    { href: '/app/map',       key: 'nav_map' },
    { href: '/app/audit',     key: 'nav_audit' },
    { href: '/app/iiko',      key: 'nav_iiko' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(6,6,6,0.94)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.09em',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          PHYLAX
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
            overflowX: 'auto',
          }}
        >
          {links.map((l) => {
            const active = path === l.href || (l.href !== '/app' && path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`app-nav-link${active ? ' active' : ''}`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>

        <LanguageSwitcher />

        <Link
          href="/app/demo"
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.09em',
            color: '#050505',
            background: '#eeeee9',
            padding: '7px 16px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {t('nav_live_demo')}
        </Link>
      </div>
    </header>
  );
}
