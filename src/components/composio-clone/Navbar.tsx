'use client';

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Navbar({ isScrolled }: { isScrolled: boolean }) {
  const { t } = useLanguage();
  return (
    <header className={`composio-header ${isScrolled ? "is-scrolled" : ""}`}>
      <nav className="composio-nav" aria-label="Main navigation">
        <Link className="brand-link" href="/">
          <span className="font-mono font-semibold tracking-tight text-white text-[1.15rem]">PHYLAX</span>
        </Link>
        <ul className="nav-links">
          <li>
            <a href="/app">{t('nav_platform')}</a>
          </li>
          <li>
            <a href="/app/reviewer">{t('nav_reviewer')}</a>
          </li>
          <li>
            <a href="/app/dashboard">{t('nav_analytics')}</a>
          </li>
          <li>
            <a href="/app/iiko">IIKO</a>
          </li>
          <li>
            <a href="/app/demo">{t('nav_demo')}</a>
          </li>
          <li>
            <LanguageSwitcher />
          </li>
          <li>
            <a className="nav-cta" href="/app/demo">
              {t('nav_launch_demo')}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
