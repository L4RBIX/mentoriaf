'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuditLog, listWriteOffs } from '@/lib/api';
import { StatusBadge, RiskBadge } from '@/components/app/StatusBadge';
import type { AuditEvent, WriteOffRequest } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  created:    { label: 'CREATED',    color: 'rgba(255,255,255,0.5)' },
  verifying:  { label: 'VERIFYING', color: '#51a2ff' },
  pending:    { label: 'PENDING',   color: '#f59e0b' },
  approved:   { label: 'APPROVED',  color: '#22c55e' },
  rejected:   { label: 'REJECTED',  color: '#ef4444' },
  iiko_synced:{ label: 'IIKO SYNC', color: '#22c55e' },
  new_photo_requested:{ label: 'NEW PHOTO', color: '#51a2ff' },
};

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function AuditPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<WriteOffRequest[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setApiError(null);
        const [requestData, auditData] = await Promise.all([listWriteOffs(), getAuditLog()]);
        if (!active) return;
        setRequests(requestData);
        setEvents(auditData);
      } catch (err) {
        if (active) setApiError(err instanceof Error ? err.message : 'Backend unavailable');
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const requestMap = useMemo(() => new Map(requests.flatMap((r) => [[r.backendId ?? r.id, r], [r.id, r]])), [requests]);
  const allEvents = events
    .map((e) => ({
      ...e,
      request: requestMap.get(e.requestId) ?? requests.find((r) => r.id === e.requestId.replace(/^WO-/, '')),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 120px' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          {t('audit_log_label')}
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 10px', color: '#fff' }}>
          {t('audit_history')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontFamily: 'monospace', fontStyle: 'italic' }}>
          AI ranks. Human decides. Audit remembers.
        </p>
      </div>

      {apiError && (
        <div style={{ marginBottom: 24, padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontFamily: 'monospace', fontSize: 11 }}>
          Backend unavailable · {apiError}
        </div>
      )}

      <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', overflow: 'hidden' }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 80px 100px 140px 160px 120px 1fr',
            gap: 16,
            padding: '0.6rem 1.25rem',
            background: '#111',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'monospace',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          <span>TIME</span>
          <span>REQ #</span>
          <span>EVENT</span>
          <span>ACTOR</span>
          <span>BRANCH</span>
          <span>RISK</span>
          <span>DETAIL</span>
        </div>

        {allEvents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            No audit events yet.
          </div>
        ) : (
          allEvents.map((ev, i) => {
            const evStyle = EVENT_LABELS[ev.event] ?? { label: ev.event, color: 'rgba(255,255,255,0.4)' };
            return (
              <div
                key={ev.id}
                className="audit-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 80px 100px 140px 160px 120px 1fr',
                  gap: 16,
                  padding: '0.85rem 1.25rem',
                  borderBottom: i < allEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{fmtTime(ev.timestamp)}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>#{ev.requestId}</span>
                <span style={{ color: evStyle.color, letterSpacing: '0.06em', fontSize: 9 }}>{evStyle.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{ev.actor}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{ev.request?.branch ?? '—'}</span>
                <span>
                  {ev.request?.aiVerdict ? (
                    <RiskBadge score={ev.request.aiVerdict.riskScore} />
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>—</span>
                  )}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.detail ?? '—'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Requests summary */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
          REQUEST LEDGER
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 160px 100px 80px 120px 140px 1fr',
            gap: 16,
            padding: '0.5rem 1.25rem',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderBottom: 'none',
            fontFamily: 'monospace',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          <span>ID</span>
          <span>BRANCH</span>
          <span>PRODUCT</span>
          <span>RISK</span>
          <span>STATUS</span>
          <span>REVIEWER</span>
          <span>IIKO DOC</span>
        </div>
        {requests.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 160px 100px 80px 120px 140px 1fr',
              gap: 16,
              padding: '0.65rem 1.25rem',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderBottom: 'none',
              fontFamily: 'monospace',
              fontSize: 11,
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>#{r.id}</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{r.branch}</span>
            <span style={{ color: '#fff' }}>{r.product}</span>
            <span>{r.aiVerdict ? <RiskBadge score={r.aiVerdict.riskScore} /> : '—'}</span>
            <span><StatusBadge status={r.status} /></span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{r.reviewer ?? '—'}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{r.iiko?.documentId ?? '—'}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
