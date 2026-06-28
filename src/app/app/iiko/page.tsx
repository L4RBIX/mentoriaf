'use client';

import { useEffect, useState } from 'react';
import { listWriteOffs } from '@/lib/api';
import type { IikoStatus } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';

const flowSteps = ['Request', 'Review', 'Approve', 'iiko Adapter', 'Write-off act', 'Inventory'];

const adapterCards = [
  { label: 'iikoServer API', detail: 'Same contract in sandbox and production.' },
  { label: 'Token cache', detail: 'Auth tokens cached and refreshed automatically.' },
  { label: 'Product mapping', detail: 'PHYLAX products mapped to iiko nomenclature.' },
  { label: 'Warehouse mapping', detail: 'Branch IDs mapped to iiko warehouse IDs.' },
  { label: 'Write-off act', detail: 'Created on approval with full document metadata.' },
  { label: 'Audit log', detail: 'Every sync stored with iiko document ID.' },
];

export default function IikoPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<IikoStatus>({
    mode: 'sandbox',
    status: 'synced',
    documentId: 'IIKO-SBX-WO-2341',
    warehouse: 'Bahandi Branch #3',
    documentType: 'write-off act',
  });
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setApiError(null);
        const requests = await listWriteOffs();
        const synced = requests.find((item) => item.iiko?.status === 'synced' && item.iiko.documentId);
        if (active && synced?.iiko) setStatus(synced.iiko);
      } catch (err) {
        if (active) setApiError(err instanceof Error ? err.message : 'Backend unavailable');
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const sandboxFields = [
    { key: 'IIKO_MODE', value: status.mode },
    { key: 'provider', value: 'sandbox provider' },
    { key: 'status', value: status.status, accent: status.status === 'synced' ? '#22c55e' : '#f59e0b' },
    { key: 'document_id', value: status.documentId ?? '—', accent: 'rgba(255,255,255,0.6)' },
    { key: 'warehouse', value: status.warehouse ?? '—' },
    { key: 'document_type', value: status.documentType ?? 'write-off act' },
  ];

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 120px' }}>
      <div style={{ marginBottom: 56 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          {t('iiko_integration')}
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 12px', color: '#fff' }}>
          {t('iiko_heading')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 520 }}>
          Demo runs through a sandbox provider with the same contract as real iikoServer API.
          When test access is available, IIKO_MODE switches from sandbox to real without changing business logic.
        </p>
      </div>

      {apiError && (
        <div style={{ marginBottom: 24, padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontFamily: 'monospace', fontSize: 11 }}>
          Backend unavailable · {apiError}
        </div>
      )}

      {/* Flow */}
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', marginBottom: 64, paddingBottom: 8, gap: 0 }}>
        {flowSteps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div className={`flow-step-box${i === 3 ? ' flow-active' : ''}`}>
              {step}
            </div>
            {i < flowSteps.length - 1 && (
              <span className="flow-step-arrow">→</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
        {/* Adapter cards */}
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            ADAPTER LAYER
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {adapterCards.map((card) => (
              <div
                key={card.label}
                style={{ background: '#0f0f0f', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
              >
                <h3 style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff', margin: 0, fontWeight: 500 }}>
                  {card.label}
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>
                  {card.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sandbox panel */}
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            SANDBOX STATUS
          </div>
          <div
            style={{
              background: '#0f0f0f',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 34, background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff605c' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd44' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ca4e' }} />
              <em style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'normal', letterSpacing: '0.04em' }}>
                iiko adapter · sandbox
              </em>
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
              {sandboxFields.map((f) => (
                <div
                  key={f.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{f.key}</span>
                  <span style={{ color: f.accent ?? 'rgba(255,255,255,0.65)' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              padding: '1rem 1.25rem',
              background: 'rgba(34,197,94,0.04)',
              border: '1px solid rgba(34,197,94,0.14)',
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.7,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e' }}>
              <span className="pulse-dot" />
              iiko adapter synced
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>
              Switch IIKO_MODE=production when real test access is available.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
