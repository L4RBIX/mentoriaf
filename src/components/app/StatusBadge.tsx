import type { WriteOffStatus, RiskLevel, ReviewRoute } from '@/lib/types';

const STATUS_COLORS: Record<WriteOffStatus, { bg: string; color: string }> = {
  draft:      { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' },
  verifying:  { bg: 'rgba(81,162,255,0.1)',   color: '#51a2ff' },
  pending:    { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  approved:   { bg: 'rgba(34,197,94,0.1)',    color: '#22c55e' },
  rejected:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  synced:     { bg: 'rgba(34,197,94,0.1)',    color: '#22c55e' },
};

const ROUTE_LABELS: Record<ReviewRoute, string> = {
  supervisor: 'Supervisor',
  control:    'Control Dept.',
  supply:     'Supply Dept.',
};

export function StatusBadge({ status }: { status: WriteOffStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: '0.08em',
        padding: '2px 8px',
        background: c.bg,
        color: c.color,
        whiteSpace: 'nowrap',
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export function RiskBadge({ score }: { score: number }) {
  const color = score >= 71 ? '#ef4444' : score >= 31 ? '#f59e0b' : '#22c55e';
  const bg    = score >= 71 ? 'rgba(239,68,68,0.12)' : score >= 31 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)';
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: '0.08em',
        padding: '2px 8px',
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      RISK {score}/100
    </span>
  );
}

export function RouteBadge({ route }: { route: ReviewRoute }) {
  const color = route === 'control' ? '#ef4444' : route === 'supply' ? '#f59e0b' : 'rgba(255,255,255,0.6)';
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: '0.06em',
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {ROUTE_LABELS[route]}
    </span>
  );
}

export function RiskLevel({ level }: { level: RiskLevel }) {
  const map = {
    low:    { color: '#22c55e', label: 'Low' },
    medium: { color: '#f59e0b', label: 'Medium' },
    high:   { color: '#ef4444', label: 'High' },
  };
  const { color, label } = map[level];
  return <span style={{ color, fontFamily: 'monospace', fontSize: 11 }}>{label}</span>;
}
