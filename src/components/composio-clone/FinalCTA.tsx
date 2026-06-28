'use client';

import { useLanguage } from "@/components/LanguageProvider";

export function FinalCTA() {
  const { t } = useLanguage();
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <span className="final-cta-kicker">PHYLAX ANTI-FRAUD</span>
        <h2>{t('cta_heading')}</h2>
        <p>{t('cta_body')}</p>
        <div className="final-cta-actions">
          <a className="button button-light" href="/app/demo">
            {t('nav_launch_demo')}
          </a>
          <a className="button button-outline" href="#">
            {t('how_it_works')}
          </a>
        </div>
      </div>
    </section>
  );
}
