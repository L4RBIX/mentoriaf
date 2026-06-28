'use client';

import { useEffect, useMemo, useState } from 'react';
import { approveWriteOff, listWriteOffs, rejectWriteOff, requestNewPhoto, toDisplayPhotoHash } from '@/lib/api';
import { StatusBadge, RiskBadge, RouteBadge } from '@/components/app/StatusBadge';
import type { WriteOffRequest } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function QueueItem({ req, selected, onClick }: { req: WriteOffRequest; selected: boolean; onClick: () => void }) {
  const risk = req.aiVerdict;
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected ? 'true' : 'false'}
      className="queue-item-btn"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>#{req.id}</span>
        <StatusBadge status={req.status} />
      </div>
      <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>
        {req.product} · {req.quantity} {req.unit}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{req.branch}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {req.route && <RouteBadge route={req.route} />}
        {risk && <RiskBadge score={risk.riskScore} />}
      </div>
    </button>
  );
}

/** Compact row for use inside narrow panels */
function PanelRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '0.42rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontFamily: 'monospace',
        fontSize: 11,
        gap: 10,
        minWidth: 0,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, fontSize: 10 }}>{label}</span>
      <span
        style={{
          color: accent ?? 'rgba(255,255,255,0.65)',
          textAlign: 'right',
          wordBreak: 'break-all',
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Row for the main detail panel */
function DetailRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '0.6rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontFamily: 'monospace',
        fontSize: 12,
        gap: 16,
        minWidth: 0,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: accent ?? 'rgba(255,255,255,0.7)', textAlign: 'right', minWidth: 0 }}>{value}</span>
    </div>
  );
}

const CARD: React.CSSProperties = {
  background: '#0f0f0f',
  border: '1px solid rgba(255,255,255,0.08)',
};

const CARD_HEADER: React.CSSProperties = {
  padding: '0.65rem 1rem',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  background: '#141414',
  fontFamily: 'monospace',
  fontSize: 9,
  letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.28)',
};

export default function ReviewerPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<WriteOffRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => (b.aiVerdict?.riskScore ?? 0) - (a.aiVerdict?.riskScore ?? 0)),
    [requests]
  );
  const selected = sortedRequests.find((r) => r.id === selectedId) ?? sortedRequests[0];
  const risk = selected?.aiVerdict;
  const isDone =
    selected?.status === 'approved' || selected?.status === 'rejected' || selected?.status === 'synced';
  const proofImageUrl = selected?.proofImageUrl;
  const proofSourceLabel = selected?.proofSource === 'uploaded_test_photo' ? 'uploaded test photo' : 'camera/demo capture';
  const photoHashLabel = toDisplayPhotoHash(selected?.photoHash) ?? 'pending';
  const aiSummary = risk?.summary ?? risk?.reasoning;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setApiError(null);
        const data = await listWriteOffs();
        if (!active) return;
        setRequests(data);
        setSelectedId((current) => current || data[0]?.id || '');
      } catch (err) {
        if (active) setApiError(err instanceof Error ? err.message : 'Backend unavailable');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setPhotoModalOpen(false);
  }, [selected?.id]);

  useEffect(() => {
    if (!photoModalOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPhotoModalOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [photoModalOpen]);

  async function refresh(updated?: WriteOffRequest) {
    const data = await listWriteOffs();
    setRequests(updated ? data.map((item) => item.id === updated.id ? updated : item) : data);
  }

  async function handleApprove() {
    if (!selected || isDone) return;
    setActionLoading(true);
    setApiError(null);
    try {
      const updated = await approveWriteOff(selected.backendId ?? selected.id);
      await refresh(updated);
      setSelectedId(updated.id);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected || isDone) return;
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setActionLoading(true);
    setApiError(null);
    try {
      const updated = await rejectWriteOff(selected.backendId ?? selected.id, rejectNote || 'Duplicate photo detected. Request rejected.');
      await refresh(updated);
      setSelectedId(updated.id);
      setShowRejectInput(false);
      setRejectNote('');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestNewPhoto() {
    if (!selected || isDone) return;
    setActionLoading(true);
    setApiError(null);
    try {
      const updated = await requestNewPhoto(selected.backendId ?? selected.id);
      await refresh(updated);
      setSelectedId(updated.id);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', overflow: 'hidden', minWidth: 0 }}>
      {/* Queue sidebar */}
      <div
        style={{
          width: 272,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#090909',
        }}
      >
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)' }}>
            {t('risk_queue')} · {sortedRequests.length}
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ padding: '1.25rem', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              Loading backend queue...
            </div>
          )}
          {apiError && (
            <div style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: 10, color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.16)' }}>
              Backend unavailable · {apiError}
            </div>
          )}
          {sortedRequests.map((r) => (
            <QueueItem key={r.id} req={r} selected={r.id === selectedId} onClick={() => setSelectedId(r.id)} />
          ))}
        </div>
      </div>

      {/* Main + right panel */}
      {selected ? (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 356px',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* ─── Main detail ─── */}
          <div
            style={{
              overflowY: 'auto',
              padding: '2rem 2.25rem',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              minWidth: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                  }}
                >
                  REQUEST #{selected.id}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: '#fff', letterSpacing: '-0.01em' }}>
                  {selected.product} · {selected.quantity} {selected.unit}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <StatusBadge status={selected.status} />
                {risk && <RiskBadge score={risk.riskScore} />}
              </div>
            </div>

            {/* Photo / duplicate proof block */}
            <div
              style={{
                background: risk?.duplicateDetected ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${risk?.duplicateDetected ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.07)'}`,
                padding: proofImageUrl ? 0 : '1.1rem 1.25rem',
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: proofImageUrl ? 0 : 8,
                overflow: 'hidden',
              }}
            >
              {proofImageUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(true)}
                    style={{
                      appearance: 'none',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      background: '#050505',
                      cursor: 'zoom-in',
                      width: '100%',
                      display: 'block',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofImageUrl}
                      alt={`${selected.product} proof image`}
                      style={{
                        width: '100%',
                        height: 'min(360px, 46vh)',
                        objectFit: 'contain',
                        display: 'block',
                        background: '#050505',
                      }}
                    />
                  </button>
                  <div style={{ padding: '0.95rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: risk?.duplicateDetected ? '#ef4444' : 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                        {risk?.duplicateDetected ? '⚠ DUPLICATE MATCH DETECTED' : '● PHOTO PROOF'}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        source: {proofSourceLabel}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.3)',
                        wordBreak: 'break-all',
                      }}
                    >
                      hash: {photoHashLabel}
                    </div>
                    {risk?.duplicateDetected && (
                      <div style={{ display: 'flex', gap: 20, fontFamily: 'monospace', fontSize: 12 }}>
                        <span>
                          Match:{' '}
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>{risk.matchScore}%</span>
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>Request #{risk.matchedRequestId}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                risk?.duplicateDetected ? (
                  <>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', letterSpacing: '0.06em' }}>
                      ⚠ DUPLICATE MATCH DETECTED
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.3)',
                        wordBreak: 'break-all',
                      }}
                    >
                      hash: {photoHashLabel}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      source: {proofSourceLabel}
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontFamily: 'monospace', fontSize: 12 }}>
                      <span>
                        Match:{' '}
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{risk.matchScore}%</span>
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>Request #{risk.matchedRequestId}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                      ● PHOTO PROOF
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      source: {proofSourceLabel}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', wordBreak: 'break-all' }}>
                      hash: {photoHashLabel}
                    </div>
                  </>
                )
              )}
            </div>

            {/* Request fields */}
            <div style={{ marginBottom: 28 }}>
              <DetailRow label="Branch" value={selected.branch} />
              <DetailRow label="Sender" value={`${selected.sender} (${selected.senderRole})`} />
              <DetailRow label="Reason" value={selected.reason} />
              <DetailRow label="Source" value={proofSourceLabel} />
              {selected.writeOffType === 'with_deduction' && selected.deductionEmployee && (
                <DetailRow label="Deduction" value={selected.deductionEmployee} />
              )}
              <DetailRow label="Comment" value={selected.comment} />
              {selected.route && (
                <DetailRow
                  label="Route"
                  value={<RouteBadge route={selected.route} />}
                />
              )}
            </div>

            {/* Actions */}
            {!isDone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {showRejectInput && (
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    style={{
                      background: '#111',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fff',
                      padding: '10px 12px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      minHeight: 56,
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="action-btn action-btn-approve"
                    disabled={actionLoading}
                  >
                    {t('approve')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="action-btn action-btn-reject"
                    disabled={actionLoading}
                  >
                    {showRejectInput ? t('confirm_reject') : t('reject')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNewPhoto}
                  className="action-btn action-btn-neutral"
                  style={{ width: '100%' }}
                  disabled={actionLoading}
                >
                  {t('request_new_photo')}
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  background:
                    selected.status === 'rejected' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                  border: `1px solid ${
                    selected.status === 'rejected'
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(34,197,94,0.2)'
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: 600,
                    color: selected.status === 'rejected' ? '#ef4444' : '#22c55e',
                    letterSpacing: '0.04em',
                  }}
                >
                  {selected.status === 'rejected' ? '✕ REJECTED' : '✓ APPROVED'}
                </div>
                {(selected.status === 'approved' || selected.status === 'synced') && selected.iiko?.documentId && (
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    iiko synced · {selected.iiko.documentId}
                  </div>
                )}
                {selected.status === 'rejected' && risk?.duplicateDetected && (
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#22c55e' }}>
                    ₸18,400 prevented
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Right sidebar ─── */}
          <div
            style={{
              overflowY: 'auto',
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              background: '#080808',
              minWidth: 0,
            }}
          >
            {/* AI Verdict */}
            {risk && (
              <div style={CARD}>
                <div style={CARD_HEADER}>AI VERDICT</div>
                <div style={{ padding: '1rem' }}>
                  {/* Big risk score */}
                  <div
                    style={{
                      marginBottom: 16,
                      padding: '16px',
                      background:
                        risk.riskScore >= 71
                          ? 'rgba(239,68,68,0.05)'
                          : risk.riskScore >= 31
                          ? 'rgba(245,158,11,0.04)'
                          : 'rgba(34,197,94,0.04)',
                      border: `1px solid ${
                        risk.riskScore >= 71
                          ? 'rgba(239,68,68,0.15)'
                          : risk.riskScore >= 31
                          ? 'rgba(245,158,11,0.13)'
                          : 'rgba(34,197,94,0.13)'
                      }`,
                    }}
                  >
                    <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
                      RISK SCORE
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '2.8rem',
                        fontWeight: 700,
                        lineHeight: 1,
                        color:
                          risk.riskScore >= 71
                            ? '#ef4444'
                            : risk.riskScore >= 31
                            ? '#f59e0b'
                            : '#22c55e',
                      }}
                    >
                      {risk.riskScore}
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 400,
                          color: 'rgba(255,255,255,0.2)',
                          marginLeft: 3,
                        }}
                      >
                        / 100
                      </span>
                    </div>
                  </div>

                  {/* Compact rows */}
                  <PanelRow
                    label="Provider"
                    value={
                      risk.provider === 'gemini' ? (
                        <span style={{ color: '#51a2ff' }}>Gemini</span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>Local fallback</span>
                      )
                    }
                  />
                  <PanelRow
                    label="Duplicate"
                    value={
                      risk.duplicateDetected ? (
                        <span style={{ color: '#ef4444' }}>YES · {risk.matchScore}%</span>
                      ) : (
                        <span style={{ color: '#22c55e' }}>No</span>
                      )
                    }
                  />
                  <PanelRow
                    label="Product"
                    value={
                      risk.productVerified ? (
                        <span style={{ color: '#22c55e' }}>Verified</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Failed</span>
                      )
                    }
                  />
                  <PanelRow
                    label="Damage"
                    value={
                      risk.damageVerified ? (
                        <span style={{ color: '#22c55e' }}>Verified</span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>Unverified</span>
                      )
                    }
                  />
                  {typeof risk.quantityEstimate === 'number' && (
                    <PanelRow
                      label="Qty est."
                      value={`${risk.quantityEstimate}${typeof risk.quantityConfidence === 'number' ? ` · ${Math.round(risk.quantityConfidence * 100)}%` : ''}`}
                    />
                  )}
                  {aiSummary && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.2)',
                          marginBottom: 6,
                        }}
                      >
                        SUMMARY
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.52)',
                          lineHeight: 1.55,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {aiSummary}
                      </div>
                    </div>
                  )}
                  {(risk.error || risk.errorDetail) && (
                    <PanelRow
                      label="Error"
                      value={risk.errorDetail ?? risk.error ?? 'vision_unavailable'}
                      accent="#f59e0b"
                    />
                  )}
                  {selected.route && (
                    <PanelRow label="Route" value={<RouteBadge route={selected.route} />} />
                  )}

                  {/* Flags */}
                  {risk.flags.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.2)',
                          marginBottom: 8,
                        }}
                      >
                        FLAGS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {risk.flags.map((f, i) => (
                          <div
                            key={i}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 10,
                              color: 'rgba(239,68,68,0.85)',
                              lineHeight: 1.4,
                            }}
                          >
                            · {f.detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {risk.visionFlags && risk.visionFlags.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.2)',
                          marginBottom: 8,
                        }}
                      >
                        VISION FLAGS
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {risk.visionFlags.slice(0, 3).map((flag) => (
                          <span key={flag} style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px' }}>
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* iiko Adapter */}
            {selected.iiko && (
              <div style={CARD}>
                <div style={CARD_HEADER}>IIKO ADAPTER</div>
                <div style={{ padding: '0.85rem 1rem' }}>
                  <PanelRow label="IIKO_MODE" value={selected.iiko.mode} />
                  <PanelRow
                    label="status"
                    value={selected.iiko.status}
                    accent={selected.iiko.status === 'synced' ? '#22c55e' : '#f59e0b'}
                  />
                  {selected.iiko.documentId && (
                    <PanelRow
                      label="document_id"
                      value={selected.iiko.documentId}
                      accent="rgba(255,255,255,0.45)"
                    />
                  )}
                  {selected.iiko.warehouse && (
                    <PanelRow label="warehouse" value={selected.iiko.warehouse} />
                  )}
                </div>
              </div>
            )}

            {/* Audit trail */}
            <div style={CARD}>
              <div style={CARD_HEADER}>AUDIT TRAIL</div>
              <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {selected.auditEvents.map((ev, i) => {
                  const evColor =
                    ev.event === 'rejected'
                      ? '#ef4444'
                      : ev.event === 'approved' || ev.event === 'iiko_synced'
                      ? '#22c55e'
                      : 'rgba(255,255,255,0.2)';
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '0.55rem 0',
                        borderBottom:
                          i < selected.auditEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <span style={{ color: evColor, fontSize: 8, flexShrink: 0, paddingTop: 3 }}>●</span>
                      <div>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {ev.event.replace('_', ' ')}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>
                          {ev.actor} · {fmtTime(ev.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          {t('select_from_queue')}
        </div>
      )}
      {selected && proofImageUrl && photoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Proof photo preview"
          onClick={() => setPhotoModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(0,0,0,0.84)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1040px, 100%)',
              maxHeight: 'calc(100vh - 48px)',
              background: '#080808',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.9rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>
                  PHOTO PROOF · REQUEST #{selected.id}
                </div>
                <div style={{ color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selected.product} · {selected.branch}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                style={{
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  padding: '8px 10px',
                  cursor: 'pointer',
                }}
              >
                CLOSE
              </button>
            </div>
            <div style={{ padding: 16, background: '#050505', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofImageUrl}
                alt={`${selected.product} proof image enlarged`}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 220px)',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <div
              style={{
                padding: '0.85rem 1rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 12,
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              <PanelRow label="branch" value={selected.branch} />
              <PanelRow label="risk" value={risk ? `${risk.riskScore}/100` : 'pending'} accent={risk && risk.riskScore >= 71 ? '#ef4444' : 'rgba(255,255,255,0.65)'} />
              <PanelRow label="provider" value={risk?.provider === 'gemini' ? 'Gemini' : 'Local'} accent={risk?.provider === 'gemini' ? '#51a2ff' : '#f59e0b'} />
              <PanelRow label="source" value={proofSourceLabel} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
