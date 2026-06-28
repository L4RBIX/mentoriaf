import type {
  AiVerdict,
  AnalyticsSummary,
  AuditEvent,
  Branch,
  CreateWriteOffInput,
  HealthStatus,
  IikoStatus,
  ReviewRoute,
  RiskFlag,
  RiskLevel,
  WriteOffRequest,
  WriteOffStatus,
  WriteOffType,
} from './types';

interface ApiStore {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  iiko_warehouse_id?: string;
  warehouseId?: string;
}

interface ApiProduct {
  id: string;
  name: string;
  unit?: string;
  estimated_price?: number;
  estimatedPrice?: number;
}

interface ApiUser {
  id: string;
  name: string;
  role: string;
}

interface ApiMeta {
  mode: string;
  stores: ApiStore[];
  products: ApiProduct[];
  users: ApiUser[];
}

interface ApiRiskEvent {
  id?: string;
  type?: string;
  severity?: 'low' | 'medium' | 'high';
  message?: string;
  score_delta?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface ApiAuditLog {
  id: string;
  request_id: string;
  actor_id?: string | null;
  actor_name?: string;
  action: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface ApiVerification {
  duplicate_detected?: boolean;
  duplicate_match_percent?: number;
  duplicate_request_id?: string | null;
  duplicate_request_number?: string | null;
  detected_product?: string | null;
  visible_damage?: boolean | null;
  estimated_quantity?: number | null;
  matches_selected_product?: boolean | null;
  matches_comment?: boolean | null;
  fraud_risk?: 'low' | 'medium' | 'high';
  risk_score?: number;
  risk_flags?: string[];
  reviewer_hint?: string | null;
  ai_verdict?: ApiAiVerdict | null;
}

interface ApiAiVerdict {
  provider?: 'gemini' | 'local';
  product_verified?: boolean;
  damage_verified?: boolean;
  quantity_estimate?: number;
  quantity_confidence?: number;
  suspected_staging?: boolean;
  summary?: string;
  comment?: string;
  flags?: string[];
  error?: string;
  error_detail?: string;
}

interface ApiWriteoffSummary {
  id: string;
  request_number?: string;
  store?: ApiStore | null;
  product?: ApiProduct | null;
  sender?: ApiUser | null;
  quantity: number;
  status: string;
  risk_score?: number;
  fraud_risk?: 'low' | 'medium' | 'high';
  duplicate_detected?: boolean;
  photo_url?: string;
  photo_hash?: string | null;
  iiko_status?: string;
  created_at?: string;
}

interface ApiWriteoffDetail extends ApiWriteoffSummary {
  store_id?: string;
  product_id?: string;
  sender_id?: string;
  unit?: string;
  source?: string;
  reason?: string;
  writeoff_type?: string;
  deduction_employee_id?: string | null;
  deduction_employee?: { full_name?: string; name?: string } | null;
  comment?: string;
  duplicate_match_percent?: number;
  duplicate_request_id?: string | null;
  duplicate_request_number?: string | null;
  reviewer_id?: string | null;
  reviewer?: { id?: string; name?: string } | null;
  reviewer_comment?: string | null;
  iiko_document_id?: string | null;
  iiko_synced_at?: string | null;
  iiko_sync?: {
    mode?: string;
    status?: string;
    iikoDocumentId?: string | null;
  };
  ai_verdict?: ApiAiVerdict | null;
  risk_events?: ApiRiskEvent[];
  audit_logs?: ApiAuditLog[];
  verification?: ApiVerification;
}

interface ApiAnalytics {
  prevented_loss_today?: number;
  high_risk_count?: number;
  approved_count?: number;
  rejected_count?: number;
  pending_count?: number;
  total_writeoffs_today?: number;
  store_integrity_index?: Array<{
    store_id: string;
    store_name: string;
    score: number;
    high_risk_ratio?: number;
    rejection_ratio?: number;
  }>;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

let metaPromise: Promise<ApiMeta> | null = null;

class ClientApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ClientApiError';
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => null) as unknown;
  if (!res.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      ? String((data as { error: unknown }).error)
      : `Request failed (${res.status})`;
    throw new ClientApiError(res.status, message);
  }
  return data as T;
}

async function getMeta(): Promise<ApiMeta> {
  metaPromise ??= requestJson<ApiMeta>('/api/demo/meta');
  return metaPromise;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/^bahandi\s+/, '').replace(/\s+/g, ' ').trim();
}

function toDisplayBranch(name: string): string {
  return name.startsWith('Bahandi ') ? name : `Bahandi ${name}`;
}

function toUnit(unit: string | undefined): 'pcs' | 'kg' | 'box' {
  if (unit === 'kg' || unit === 'box') return unit;
  return 'pcs';
}

function toWriteOffType(value: string | undefined): WriteOffType {
  return value === 'employee_deduction' ? 'with_deduction' : 'without_deduction';
}

function fromWriteOffType(value: WriteOffType): 'no_deduction' | 'employee_deduction' {
  return value === 'with_deduction' ? 'employee_deduction' : 'no_deduction';
}

function riskLevel(score: number): RiskLevel {
  if (score >= 71) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

function routeFor(score: number, duplicate: boolean, flags: RiskFlag[]): ReviewRoute {
  if (duplicate || score >= 71) return 'control';
  if (score >= 31 || flags.some((flag) => flag.type.includes('quantity'))) return 'supply';
  return 'supervisor';
}

function eventFromAction(action: string): AuditEvent['event'] {
  if (action.includes('approved')) return 'approved';
  if (action.includes('rejected')) return 'rejected';
  if (action.includes('iiko_sync_success')) return 'iiko_synced';
  if (action.includes('new_photo_requested')) return 'new_photo_requested';
  if (action.includes('verified') || action.includes('risk_score') || action.includes('duplicate') || action.includes('vision')) return 'verifying';
  if (action.includes('created') || action.includes('uploaded')) return 'created';
  return 'pending';
}

function mapRiskFlag(event: ApiRiskEvent, index: number): RiskFlag {
  const type = event.type ?? `risk_flag_${index}`;
  return {
    type: type.includes('duplicate') ? 'duplicate_photo' : type.includes('quantity') ? 'quantity_anomaly' : type.includes('comment') ? 'weak_comment' : 'sender_pattern',
    severity: event.severity ?? 'medium',
    detail: event.message ?? type,
  };
}

function mapAudit(log: ApiAuditLog): AuditEvent {
  const detail = log.metadata ? Object.entries(log.metadata).map(([key, value]) => `${key}=${String(value)}`).join(' · ') : undefined;
  return {
    id: log.id,
    requestId: log.request_id,
    event: eventFromAction(log.action),
    actor: log.actor_name ?? log.actor_id ?? (log.action.startsWith('iiko') ? 'iiko Adapter' : 'PHYLAX AI'),
    timestamp: log.created_at,
    detail,
  };
}

function displayId(row: ApiWriteoffDetail): string {
  const number = row.request_number ?? row.id;
  return number.replace(/^WO-/, '');
}

export function isProofImageUrl(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('data:image/')
    || trimmed.startsWith('data/image')
    || trimmed.startsWith('/demo-assets/')
    || /^https?:\/\//i.test(trimmed)
  );
}

export function toDisplayPhotoHash(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (isProofImageUrl(trimmed)) return undefined;
  if (trimmed.length > 100) return undefined;
  return trimmed;
}

function proofImageUrl(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => Boolean(value && isProofImageUrl(value)));
}

function mapWriteoff(row: ApiWriteoffDetail, fallback?: Partial<CreateWriteOffInput>): WriteOffRequest {
  const verification = row.verification;
  const score = row.risk_score ?? verification?.risk_score ?? 0;
  const duplicate = row.duplicate_detected ?? verification?.duplicate_detected ?? false;
  const matchScore = row.duplicate_match_percent ?? verification?.duplicate_match_percent ?? undefined;
  const providerVerdict = row.ai_verdict ?? verification?.ai_verdict ?? undefined;
  const flags = row.risk_events?.map(mapRiskFlag) ?? verification?.risk_flags?.map((detail) => ({
    type: detail.toLowerCase().includes('duplicate') ? 'duplicate_photo' : detail.toLowerCase().includes('quantity') ? 'quantity_anomaly' : 'weak_comment',
    severity: detail.toLowerCase().includes('duplicate') ? 'high' : 'medium',
    detail,
  })) ?? [];
  const route = routeFor(score, duplicate, flags);
  const status = row.status === 'approved' && (row.iiko_status === 'synced' || row.iiko_sync?.status === 'synced')
    ? 'synced'
    : (row.status as WriteOffStatus);
  const product = row.product?.name ?? fallback?.product ?? 'Unknown product';
  const branch = row.store?.name ? toDisplayBranch(row.store.name) : fallback?.branch ?? 'Unknown branch';
  const senderRole = fallback?.senderRole ?? 'cook';
  const summary = providerVerdict?.summary ?? providerVerdict?.comment ?? verification?.reviewer_hint ?? undefined;
  const displayPhotoHash = toDisplayPhotoHash(row.photo_hash);
  const imageUrl = proofImageUrl(row.photo_url, row.photo_hash);

  const aiVerdict: AiVerdict = {
    provider: providerVerdict?.provider,
    duplicateDetected: duplicate,
    matchScore: matchScore ? Math.round(matchScore * 10) / 10 : undefined,
    matchedRequestId: row.duplicate_request_number?.replace(/^WO-/, '') ?? verification?.duplicate_request_number?.replace(/^WO-/, '') ?? undefined,
    productVerified: providerVerdict?.product_verified ?? verification?.matches_selected_product ?? !flags.some((flag) => flag.detail.toLowerCase().includes('product mismatch')),
    damageVerified: providerVerdict?.damage_verified ?? verification?.visible_damage ?? !duplicate,
    quantityVerified: providerVerdict?.quantity_estimate ? row.quantity <= providerVerdict.quantity_estimate * 1.3 : verification?.estimated_quantity ? row.quantity <= verification.estimated_quantity * 1.3 : !flags.some((flag) => flag.type === 'quantity_anomaly'),
    quantityEstimate: providerVerdict?.quantity_estimate,
    quantityConfidence: providerVerdict?.quantity_confidence,
    suspectedStaging: providerVerdict?.suspected_staging,
    riskScore: score,
    riskLevel: riskLevel(score),
    flags,
    visionFlags: providerVerdict?.flags,
    summary,
    error: providerVerdict?.error,
    errorDetail: providerVerdict?.error_detail,
    suggestedRoute: route,
    reasoning: summary ?? row.reviewer_comment ?? (duplicate ? 'Duplicate photo detected.' : 'Verification completed.'),
  };

  return {
    id: displayId(row),
    backendId: row.id,
    requestNumber: row.request_number,
    branch,
    product,
    quantity: row.quantity,
    unit: toUnit(row.unit ?? row.product?.unit ?? fallback?.unit),
    reason: row.reason ?? fallback?.reason ?? 'Write-off request',
    writeOffType: toWriteOffType(row.writeoff_type) ?? fallback?.writeOffType ?? 'without_deduction',
    deductionEmployee: row.deduction_employee?.full_name ?? row.deduction_employee?.name ?? fallback?.deductionEmployee,
    comment: row.comment ?? fallback?.comment ?? '',
    photoHash: displayPhotoHash,
    proofImageUrl: imageUrl,
    proofSource: row.source === 'upload' || fallback?.photoSource === 'uploaded_test_photo' ? 'uploaded_test_photo' : 'camera_demo_capture',
    sender: row.sender?.name ?? (senderRole === 'cook' ? 'A. Bekova' : 'N. Smagul'),
    senderRole,
    createdAt: row.created_at ?? new Date().toISOString(),
    status,
    route,
    aiVerdict,
    reviewerNote: row.reviewer_comment ?? undefined,
    reviewer: row.reviewer?.name ?? undefined,
    iiko: {
      mode: row.iiko_sync?.mode === 'real' ? 'production' : 'sandbox',
      status: row.iiko_status === 'synced' || row.iiko_sync?.status === 'synced' ? 'synced' : row.iiko_status === 'failed' ? 'failed' : 'pending',
      documentId: row.iiko_document_id ?? row.iiko_sync?.iikoDocumentId ?? undefined,
      warehouse: branch,
      documentType: 'write-off act',
      syncedAt: row.iiko_synced_at ?? undefined,
    },
    auditEvents: row.audit_logs?.map(mapAudit) ?? [],
  };
}

async function resolveStore(branch: string): Promise<ApiStore> {
  const meta = await getMeta();
  const normalized = normalizeName(branch);
  const store = meta.stores.find((item) => normalizeName(item.name) === normalized)
    ?? meta.stores.find((item) => normalizeName(item.name).includes(normalized) || normalized.includes(normalizeName(item.name)))
    ?? meta.stores[0];
  if (!store) throw new Error('No stores available. Run npm run seed or use local demo mode.');
  return store;
}

async function resolveProduct(product: string): Promise<ApiProduct> {
  const meta = await getMeta();
  const normalized = normalizeName(product === 'Patty' ? 'Cutlets' : product);
  const item = meta.products.find((entry) => normalizeName(entry.name) === normalizeName(product))
    ?? meta.products.find((entry) => normalizeName(entry.name) === normalized)
    ?? meta.products[0];
  if (!item) throw new Error('No products available. Run npm run seed or use local demo mode.');
  return item;
}

async function resolveSender(role: 'cashier' | 'cook'): Promise<ApiUser> {
  const meta = await getMeta();
  const preferred = role === 'cashier' ? 'local-cashier' : 'local-sender';
  const user = meta.users.find((item) => item.id === preferred)
    ?? meta.users.find((item) => item.role === 'employee')
    ?? meta.users[0];
  if (!user) throw new Error('No sender users available. Run npm run seed or use local demo mode.');
  return user;
}

async function resolveReviewer(route?: ReviewRoute): Promise<ApiUser> {
  const meta = await getMeta();
  const id = route === 'control' ? 'local-reviewer-control' : route === 'supply' ? 'local-reviewer-supply' : 'local-reviewer-supervisor';
  const user = meta.users.find((item) => item.id === id)
    ?? meta.users.find((item) => item.role === 'reviewer')
    ?? meta.users[0];
  if (!user) throw new Error('No reviewer users available. Run npm run seed or use local demo mode.');
  return user;
}

async function demoBlob(asset: NonNullable<CreateWriteOffInput['demoAsset']>): Promise<Blob> {
  const file = asset.endsWith('.jpg') ? asset : `${asset}.jpg`;
  const res = await fetch(`/demo-assets/${file}`);
  if (!res.ok) throw new Error(`Demo asset unavailable: ${file}`);
  return res.blob();
}

export async function health(): Promise<HealthStatus> {
  const raw = await requestJson<{
    status: 'ok' | 'error';
    database: 'connected' | 'local' | 'error';
    gemini_configured?: boolean;
    iiko_mode?: 'sandbox' | 'real';
    vision_provider?: 'gemini' | 'local';
    vision_status?: 'ready' | 'disabled';
    timestamp: string;
  }>('/api/health');

  return {
    status: raw.status,
    database: raw.database,
    geminiConfigured: Boolean(raw.gemini_configured),
    iikoMode: raw.iiko_mode === 'real' ? 'production' : 'sandbox',
    visionProvider: raw.vision_provider ?? (raw.gemini_configured ? 'gemini' : 'local'),
    visionStatus: raw.vision_status ?? (raw.gemini_configured ? 'ready' : 'disabled'),
    timestamp: raw.timestamp,
  };
}

export async function createWriteOff(input: CreateWriteOffInput): Promise<WriteOffRequest> {
  const [store, product, sender] = await Promise.all([
    resolveStore(input.branch),
    resolveProduct(input.product),
    resolveSender(input.senderRole),
  ]);
  const photo = input.photo ?? (input.demoAsset ? await demoBlob(input.demoAsset) : undefined);
  if (!photo) throw new Error('Photo proof is required');

  const form = new FormData();
  form.append('sender_id', sender.id);
  form.append('store_id', store.id);
  form.append('product_id', product.id);
  form.append('quantity', String(input.quantity));
  form.append('reason', input.reason);
  form.append('writeoff_type', fromWriteOffType(input.writeOffType));
  form.append('comment', input.comment);
  form.append('captured_at', new Date().toISOString());
  form.append('latitude', String(store.latitude ?? 43.222));
  form.append('longitude', String(store.longitude ?? 76.8512));
  form.append('source', input.photoSource === 'uploaded_test_photo' ? 'upload' : 'pwa');
  form.append('photo', photo, input.photo instanceof File ? input.photo.name : `${input.demoAsset ?? 'proof'}.jpg`);

  const created = await requestJson<ApiWriteoffDetail>('/api/writeoffs', { method: 'POST', body: form });
  return mapWriteoff({
    ...created,
    store,
    product,
    sender,
    quantity: input.quantity,
    unit: product.unit,
    source: input.photoSource === 'uploaded_test_photo' ? 'upload' : 'pwa',
    reason: input.reason,
    writeoff_type: fromWriteOffType(input.writeOffType),
    comment: input.comment,
    created_at: new Date().toISOString(),
  }, input);
}

export async function listWriteOffs(): Promise<WriteOffRequest[]> {
  const statuses = ['pending', 'approved', 'rejected'] as const;
  const lists = await Promise.all(statuses.map((status) =>
    requestJson<ApiWriteoffSummary[]>(`/api/writeoffs?status=${status}&limit=100`).catch(() => [])
  ));
  const summaries = lists.flat();
  const details = await Promise.all(summaries.map((item) => getWriteOff(item.id).catch(() => mapWriteoff(item))));
  return details
    .filter((item): item is WriteOffRequest => Boolean(item))
    .sort((a, b) => (b.aiVerdict?.riskScore ?? 0) - (a.aiVerdict?.riskScore ?? 0));
}

export async function getWriteOff(id: string): Promise<WriteOffRequest | null> {
  const raw = await requestJson<ApiWriteoffDetail>(`/api/writeoffs/${id}`);
  return mapWriteoff(raw);
}

export async function approveWriteOff(id: string): Promise<WriteOffRequest> {
  const current = await getWriteOff(id);
  const reviewer = await resolveReviewer(current?.route);
  const raw = await requestJson<ApiWriteoffDetail>(`/api/writeoffs/${current?.backendId ?? id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reviewer_id: reviewer.id, reviewer_comment: 'Confirmed by reviewer. Approved.' }),
  });
  return mapWriteoff(raw);
}

export async function rejectWriteOff(id: string, reason = 'Duplicate photo detected. Request rejected.'): Promise<WriteOffRequest> {
  const current = await getWriteOff(id);
  const reviewer = await resolveReviewer(current?.route);
  const raw = await requestJson<ApiWriteoffDetail>(`/api/writeoffs/${current?.backendId ?? id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reviewer_id: reviewer.id, reviewer_comment: reason }),
  });
  return mapWriteoff(raw);
}

export async function requestNewPhoto(id: string): Promise<WriteOffRequest> {
  const current = await getWriteOff(id);
  const raw = await requestJson<ApiWriteoffDetail>(`/api/writeoffs/${current?.backendId ?? id}/request-new-photo`, {
    method: 'POST',
    body: JSON.stringify({ comment: 'Reviewer requested new camera proof' }),
  });
  return mapWriteoff(raw);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const raw = await requestJson<ApiAnalytics>('/api/analytics/summary');
  const branches: Branch[] = raw.store_integrity_index?.map((row) => ({
    id: row.store_id,
    name: toDisplayBranch(row.store_name),
    riskScore: Math.max(0, Math.min(100, 100 - row.score)),
    alertCount: Math.round((row.high_risk_ratio ?? 0) * 10),
    preventedLoss: row.store_name.includes('#3') ? raw.prevented_loss_today ?? 0 : 0,
  })) ?? [];
  const total = (raw.approved_count ?? 0) + (raw.rejected_count ?? 0) + (raw.pending_count ?? 0);

  return {
    preventedToday: raw.prevented_loss_today ?? 0,
    highRiskRequests: raw.high_risk_count ?? 0,
    approvalRate: total > 0 ? Math.round(((raw.approved_count ?? 0) / total) * 100) : 0,
    iikoSyncedActs: raw.approved_count ?? 0,
    branches,
    anomalies: ['Branch #3 writes off tomatoes 4× above normal on Tuesdays.'],
  };
}

export async function getAuditLog(): Promise<AuditEvent[]> {
  const raw = await requestJson<ApiAuditLog[]>('/api/audit');
  return raw.map(mapAudit);
}

export async function getIikoStatus(id: string): Promise<IikoStatus> {
  const current = await getWriteOff(id);
  const raw = await requestJson<{
    mode?: 'sandbox' | 'production' | 'real';
    status?: 'pending' | 'synced' | 'failed';
    document_id?: string | null;
    warehouse?: string | null;
    document_type?: string | null;
    synced_at?: string | null;
  }>(`/api/iiko/status/${current?.backendId ?? id}`);

  return {
    mode: raw.mode === 'real' ? 'production' : raw.mode ?? 'sandbox',
    status: raw.status ?? 'pending',
    documentId: raw.document_id ?? undefined,
    warehouse: raw.warehouse ?? undefined,
    documentType: raw.document_type ?? undefined,
    syncedAt: raw.synced_at ?? undefined,
  };
}

export async function resetDemo(): Promise<void> {
  metaPromise = null;
  await requestJson<{ ok: true }>('/api/demo/reset', { method: 'POST', body: JSON.stringify({}) });
}

export async function runDemoScenario(): Promise<void> {
  await requestJson<unknown>('/api/demo/scenario', { method: 'POST', body: JSON.stringify({}) });
}
