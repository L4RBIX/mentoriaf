'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, CheckSquare, BarChart2, Map, Grid } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const BOTTOM_NAV = [
  { href: '/app',           icon: Grid,        labelKey: 'nav_platform' },
  { href: '/app/sender',    icon: Camera,      labelKey: 'nav_sender' },
  { href: '/app/reviewer',  icon: CheckSquare, labelKey: 'nav_reviewer' },
  { href: '/app/dashboard', icon: BarChart2,   labelKey: 'nav_analytics' },
  { href: '/app/map',       icon: Map,         labelKey: 'nav_map' },
];

export function AppNav() {
  const path = usePathname();
  const { t } = useLanguage();

  const allLinks = [
    { href: '/app',           key: 'nav_platform' },
    { href: '/app/sender',    key: 'nav_sender' },
    { href: '/app/reviewer',  key: 'nav_reviewer' },
    { href: '/app/dashboard', key: 'nav_analytics' },
    { href: '/app/map',       key: 'nav_map' },
    { href: '/app/audit',     key: 'nav_audit' },
    { href: '/app/iiko',      key: 'nav_iiko' },
  ];

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="app-top-bar">
        <div className="app-top-bar-inner">
          <Link href="/" className="app-top-bar-brand">PHYLAX</Link>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="app-top-nav">
            {allLinks.map((l) => {
              const active = path === l.href || (l.href !== '/app' && path.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} className={`app-nav-link${active ? ' active' : ''}`}>
                  {t(l.key)}
                </Link>
              );
            })}
          </nav>

          <div className="app-top-bar-actions">
            <LanguageSwitcher />
            <Link href="/app/demo" className="app-demo-btn">{t('nav_live_demo')}</Link>
          </div>
        </div>
      </header>

      {/* ── Bottom tab bar — mobile only ────────────────────────────────── */}
      <nav className="app-bottom-nav" aria-label="Main navigation">
        {BOTTOM_NAV.map((item) => {
          const active = path === item.href || (item.href !== '/app' && path.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`app-bottom-tab${active ? ' active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
