'use client';

import { useState } from 'react';
import Link from 'next/link';
import { approveWriteOff, createWriteOff, getAnalyticsSummary, rejectWriteOff, resetDemo } from '@/lib/api';
import type { AnalyticsSummary } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';

const STEPS = [
  {
    id: 1,
    label: 'Old process',
    title: 'Reused photo passes undetected.',
    sub: 'No duplicate check. No fingerprint. No AI.',
    panel: {
      header: 'OLD PROCESS',
      badge: { text: 'APPROVED', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
      rows: [
        { k: 'Product', v: 'Tomatoes · 40 pcs' },
        { k: 'Branch', v: 'Bahandi Branch #3' },
        { k: 'Photo check', v: 'None', accent: 'rgba(255,255,255,0.25)' },
        { k: 'Sent via', v: 'WhatsApp chat', accent: 'rgba(255,255,255,0.25)' },
      ],
      metric: { label: 'Loss', value: '₸18,400', color: '#ef4444' },
    },
  },
  {
    id: 2,
    label: 'Detection',
    title: 'PHYLAX detects the duplicate.',
    sub: 'Photo fingerprint. 98.4% match. Auto-routed.',
    panel: {
      header: 'PHYLAX',
      badge: { text: 'FLAGGED', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      rows: [
        { k: 'Photo hash', v: 'phash:a4f2b1c8d9e3', accent: 'rgba(255,255,255,0.5)' },
        { k: 'Duplicate match', v: 'Request #1847', accent: '#ef4444' },
        { k: 'Match score', v: '98.4%', accent: '#ef4444' },
        { k: 'Route', v: 'Control Department', accent: '#ef4444' },
      ],
      alert: 'Duplicate photo detected',
      metric: { label: 'Risk', value: '91/100', color: '#ef4444' },
    },
  },
  {
    id: 3,
    label: 'Rejection',
    title: 'Reviewer rejects. Loss prevented.',
    sub: 'Reviewer sees AI verdict. One click to reject.',
    panel: {
      header: 'CONTROL DEPARTMENT',
      badge: { text: 'REJECTED', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      rows: [
        { k: 'Reviewer', v: 'Control Department' },
        { k: 'Decision', v: 'Rejected', accent: '#ef4444' },
        { k: 'Reason', v: 'Duplicate photo', accent: '#ef4444' },
        { k: 'Audit', v: 'Recorded', accent: '#22c55e' },
      ],
      metric: { label: 'Prevented', value: '₸18,400', color: '#22c55e' },
    },
  },
  {
    id: 4,
    label: 'Approved',
    title: 'Normal request approved. iiko synced.',
    sub: 'Legitimate write-off. One approval. One act.',
    panel: {
      header: 'SUPERVISOR-ADMIN',
      badge: { text: 'SYNCED', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      rows: [
        { k: 'Product', v: 'Patty · 3 pcs' },
        { k: 'Risk', v: '18/100', accent: '#22c55e' },
        { k: 'IIKO_MODE', v: 'sandbox' },
        { k: 'document_id', v: 'IIKO-SBX-WO-2341', accent: '#22c55e' },
      ],
      metric: { label: 'iiko status', value: 'synced', color: '#22c55e' },
    },
  },
];

export default function DemoPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [normalId, setNormalId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const current = STEPS[step];
  const preventedLoss = analytics?.preventedToday ?? 0;

  async function runAction(label: string, action: () => Promise<void>) {
    setRunning(label);
    setApiError(null);
    try {
      await action();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Backend unavailable');
    } finally {
      setRunning(null);
    }
  }

  async function resetLiveDemo() {
    await resetDemo();
    setDuplicateId(null);
    setNormalId(null);
    setAnalytics(null);
    setStep(0);
  }

  async function createDuplicateRequest() {
    const req = await createWriteOff({
      branch: 'Bahandi Branch #3',
      product: 'Tomatoes',
      quantity: 40,
      unit: 'kg',
      reason: 'Tomatoes spoiled in storage',
      writeOffType: 'without_deduction',
      comment: 'Tomatoes bad today',
      senderRole: 'cook',
      demoAsset: 'tomatoes_reused',
    });
    setDuplicateId(req.backendId ?? req.id);
    setStep(1);
  }

  async function rejectDuplicateRequest() {
    if (!duplicateId) throw new Error('Create duplicate request first');
    await rejectWriteOff(duplicateId, 'Rejected: duplicate photo detected. Request a new live photo.');
    setStep(2);
  }

  async function createNormalRequest() {
    const req = await createWriteOff({
      branch: 'Bahandi Branch #1',
      product: 'Patty',
      quantity: 3,
      unit: 'pcs',
      reason: 'Fell on floor',
      writeOffType: 'with_deduction',
      deductionEmployee: 'Aibek M.',
      comment: 'Three patties fell during prep rush. Floor contaminated.',
      senderRole: 'cook',
      demoAsset: 'patty',
    });
    setNormalId(req.backendId ?? req.id);
    setStep(3);
  }

  async function approveNormalRequest() {
    if (!normalId) throw new Error('Create normal request first');
    await approveWriteOff(normalId);
    setStep(3);
  }

  async function showAnalytics() {
    const data = await getAnalyticsSummary();
    setAnalytics(data);
  }

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
            GUIDED DEMO · STEP {step + 1} OF {STEPS.length}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0, color: '#fff' }}>
            {current.title}
          </h1>
          <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>{current.sub}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {preventedLoss > 0 && (
            <div style={{ padding: '8px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontFamily: 'monospace', fontSize: 12, color: '#22c55e', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, color: 'rgba(34,197,94,0.6)', letterSpacing: '0.08em' }}>PREVENTED</span>
              <span>₸{preventedLoss.toLocaleString()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => void runAction('Reset demo', resetLiveDemo)}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer' }}
          >
            {t('reset_demo')}
          </button>
        </div>
      </div>

      {apiError && (
        <div style={{ marginBottom: 24, padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontFamily: 'monospace', fontSize: 11 }}>
          Backend unavailable · {apiError}
        </div>
      )}

      {/* Step progress */}
      <div style={{ display: 'flex', gap: '1px', marginBottom: 48, background: 'rgba(255,255,255,0.07)' }}>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: i === step ? 'rgba(255,255,255,0.08)' : i < step ? 'rgba(34,197,94,0.05)' : '#0a0a0a',
              border: 'none',
              borderLeft: `2px solid ${i === step ? '#fff' : i < step ? '#22c55e' : 'transparent'}`,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', color: i < step ? '#22c55e' : i === step ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
              {i < step ? '✓ ' : ''}{String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: i === step ? '#fff' : i < step ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.35)' }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Demo panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
        {/* Visual card */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1.5rem', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
              {current.panel.header}
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.08em',
              padding: '3px 10px',
              background: current.panel.badge.bg,
              color: current.panel.badge.color,
            }}>
              {current.panel.badge.text}
            </span>
          </div>

          {current.panel.alert && (
            <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.18)', fontFamily: 'monospace', fontSize: 12, color: '#ef4444', letterSpacing: '0.04em' }}>
              ⚠ {current.panel.alert}
            </div>
          )}

          <div style={{ padding: '1.5rem' }}>
            {current.panel.rows.map((row) => (
              <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{row.k}</span>
                <span style={{ color: row.accent ?? 'rgba(255,255,255,0.7)' }}>{row.v}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{current.panel.metric.label}:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: current.panel.metric.color, lineHeight: 1 }}>
              {current.panel.metric.value}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
              WHAT&apos;S HAPPENING
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
              {step === 0 && 'Without PHYLAX, a reused tomato photo from request #1847 is submitted again. The reviewer sees nothing unusual and approves. ₸18,400 is written off.'}
              {step === 1 && 'PHYLAX computes a perceptual hash of the photo and detects a 98.4% match with request #1847. Risk score: 91/100. Automatically routed to Control Department.'}
              {step === 2 && 'Control Department reviewer sees the AI verdict, duplicate alert, and match score. One click rejects. ₸18,400 is prevented. Audit event recorded.'}
              {step === 3 && 'A separate legitimate request for 3 patties is approved by the Supervisor. PHYLAX creates an iiko write-off act automatically. iiko inventory updated.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer' }}
              >
                ← BACK
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                style={{ flex: 1, padding: '12px', background: '#f5f5f0', border: 'none', color: '#070707', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer' }}
              >
                NEXT STEP →
              </button>
            ) : (
              <Link
                href="/app/reviewer"
                style={{ flex: 1, padding: '12px', background: '#f5f5f0', border: 'none', color: '#070707', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                OPEN REVIEWER →
              </Link>
            )}
          </div>

          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Reset demo', fn: resetLiveDemo },
              { label: 'Create duplicate request', fn: createDuplicateRequest },
              { label: 'Reject duplicate', fn: rejectDuplicateRequest },
              { label: 'Create normal request', fn: createNormalRequest },
              { label: 'Approve normal request', fn: approveNormalRequest },
              { label: 'Show analytics', fn: showAnalytics },
            ].map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={() => void runAction(button.label, button.fn)}
                disabled={running !== null}
                style={{
                  padding: '10px 12px',
                  background: button.label === running ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: button.label === 'Reject duplicate' ? '#ef4444' : button.label === 'Approve normal request' || button.label === 'Show analytics' ? '#22c55e' : 'rgba(255,255,255,0.65)',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  cursor: running ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: running && running !== button.label ? 0.45 : 1,
                }}
              >
                {button.label === running ? 'RUNNING · ' : ''}{button.label}
              </button>
            ))}
            {analytics && (
              <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span>prevented_today=<span style={{ color: '#22c55e' }}>₸{analytics.preventedToday.toLocaleString()}</span></span>
                <span>high_risk_count=<span style={{ color: '#ef4444' }}>{analytics.highRiskRequests}</span></span>
                <span>iiko_synced_acts=<span style={{ color: '#22c55e' }}>{analytics.iikoSyncedActs}</span></span>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>Every write-off must prove itself.</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
              Подделать списание физически невозможно.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
