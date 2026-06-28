'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAnalyticsSummary } from '@/lib/api';
import { BRANCHES } from '@/lib/demo-data';
import type { AnalyticsSummary } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="metric-card">
      {accent && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: `radial-gradient(ellipse at 50% 100%, ${accent}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value" style={{ color: accent ?? '#fff' }}>{value}</div>
      {sub && <div className="metric-card-sub">{sub}</div>}
    </div>
  );
}

function riskColor(score: number) {
  return score >= 71 ? '#ef4444' : score >= 31 ? '#f59e0b' : '#22c55e';
}

function riskLabel(score: number) {
  return score >= 71 ? 'High' : score >= 31 ? 'Medium' : 'Low';
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setApiError(null);
        const data = await getAnalyticsSummary();
        if (active) setSummary(data);
      } catch (err) {
        if (active) setApiError(err instanceof Error ? err.message : 'Backend unavailable');
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const branches = summary?.branches.length ? summary.branches : BRANCHES;

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 120px' }}>
      {/* Header */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
          OWNER · ANALYTICS
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0, color: '#fff' }}>
          {t('branch_oversight')}
        </h1>
      </div>

      {apiError && (
        <div style={{ marginBottom: 24, padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontFamily: 'monospace', fontSize: 11 }}>
          Backend unavailable · {apiError}
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: 48 }}>
        <MetricCard label={t('prevented_today_label')} value={`₸${(summary?.preventedToday ?? 0).toLocaleString()}`} sub="vs. zero-control baseline" accent="#22c55e" />
        <MetricCard label={t('high_risk_req')} value={String(summary?.highRiskRequests ?? 0)} sub="routed to Control Dept." accent="#ef4444" />
        <MetricCard label={t('approval_rate')} value={`${summary?.approvalRate ?? 0}%`} sub="of total requests" />
        <MetricCard label={t('iiko_synced_acts')} value={String(summary?.iikoSyncedActs ?? 0)} sub="write-off acts created" accent="#22c55e" />
      </div>

      {/* Branch Risk Map link */}
      <Link href="/app/map" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 32 }}>
        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 160ms ease',
          }}
          className="premium-card"
        >
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>
              BRANCH INTELLIGENCE
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>{t('open_branch_risk_map')}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              87 branches · Kazakhstan
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, color: 'rgba(255,255,255,0.2)' }}>→</div>
        </div>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
        {/* Branch risk table */}
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
            BRANCH INTEGRITY INDEX
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0a0a0a', overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px 120px 140px',
                gap: 16,
                padding: '0.5rem 1.25rem',
                background: '#111',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              <span>BRANCH</span>
              <span>RISK</span>
              <span>ALERTS</span>
              <span>PREVENTED</span>
              <span>STATUS</span>
            </div>

            {branches.map((b) => (
              <div
                key={b.id}
                className="branch-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 120px 140px',
                  gap: 16,
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: b.riskScore >= 71 ? 'rgba(239,68,68,0.04)' : 'transparent',
                  boxShadow: b.riskScore >= 71 ? 'inset 3px 0 0 rgba(239,68,68,0.4)' : 'none',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#fff' }}>{b.name}</span>
                <span style={{ color: riskColor(b.riskScore), fontWeight: b.riskScore >= 71 ? 600 : 400 }}>
                  {b.riskScore}
                </span>
                <span style={{ color: b.alertCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
                  {b.alertCount > 0 ? `${b.alertCount} alerts` : '—'}
                </span>
                <span style={{ color: b.preventedLoss > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                  {b.preventedLoss > 0 ? `₸${b.preventedLoss.toLocaleString()}` : '—'}
                </span>
                <span style={{ color: riskColor(b.riskScore), fontSize: 10, letterSpacing: '0.06em' }}>
                  {riskLabel(b.riskScore)} risk
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)' }}>
            ANOMALY RADAR
          </div>

          <div
            style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.16)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', color: '#ef4444' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ef4444',
                  flexShrink: 0,
                }}
              />
              PATTERN DETECTED
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, margin: 0 }}>
              Branch #3 writes off tomatoes 4× above normal on Tuesdays.
            </p>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              Route: <span style={{ color: '#f59e0b' }}>Supply Department</span>
            </div>
          </div>

          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)' }}>THIS WEEK</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Requests processed', value: String((summary?.highRiskRequests ?? 0) + (summary?.iikoSyncedActs ?? 0) + 9) },
                { label: 'Duplicates blocked', value: '1' },
                { label: 'Avg risk score', value: '42/100' },
                { label: 'iiko sync rate', value: '100%' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.38)' }}>{row.label}</span>
                  <span style={{ color: '#fff' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              border: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'rgba(255,255,255,0.28)',
              lineHeight: 1.65,
              fontStyle: 'italic',
            }}
          >
            &quot;Подделать списание физически невозможно.&quot;
          </div>
        </div>
      </div>
    </main>
  );
}
