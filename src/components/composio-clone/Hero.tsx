'use client';

import dynamic from "next/dynamic";
import { DemoMoment } from "./DemoMoment";
import { IntegrationStrip } from "./IntegrationStrip";
import { useLanguage } from "@/components/LanguageProvider";

const WarpTunnelCanvas = dynamic(
  () => import("./WarpTunnelCanvas").then((m) => m.WarpTunnelCanvas),
  { ssr: false }
);

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className="hero-section dark-section">
      {/* Desktop: full-width canvas, fades out at bottom */}
      <div
        aria-hidden="true"
        className="hero-warp-desktop"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
        }}
      >
        <div className="hero-warp-inner">
          <WarpTunnelCanvas />
        </div>
      </div>

      {/* Mobile: canvas with same bottom fade */}
      <div
        aria-hidden="true"
        className="hero-warp-mobile"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      >
        <div className="hero-warp-inner">
          <WarpTunnelCanvas />
        </div>
      </div>

      <div className="hero-copy">
        <h1>{t('hero_h1')}</h1>
        <p className="hero-line">{t('hero_line')}</p>
        <p className="hero-subcopy">{t('hero_sub')}</p>
        <div className="hero-actions">
          <a className="button button-light" href="/app/demo">
            {t('launch_live_demo')}
          </a>
          <a className="button button-outline" href="/app/reviewer">
            {t('open_risk_queue')}
          </a>
        </div>
      </div>
      <IntegrationStrip />
      <DemoMoment />
    </section>
  );
}
