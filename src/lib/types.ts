export type UserRole = 'cashier' | 'cook' | 'supervisor' | 'control' | 'supply' | 'owner';

export type WriteOffStatus = 'draft' | 'verifying' | 'pending' | 'approved' | 'rejected' | 'synced';

export type RiskLevel = 'low' | 'medium' | 'high';

export type WriteOffType = 'without_deduction' | 'with_deduction';

export type ReviewRoute = 'supervisor' | 'control' | 'supply';

export interface Branch {
  id: string;
  name: string;
  riskScore: number;
  alertCount: number;
  preventedLoss: number;
}

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  branch: string;
}

export interface Product {
  id: string;
  name: string;
  unit: 'pcs' | 'kg' | 'box';
}

export interface RiskFlag {
  type: 'duplicate_photo' | 'quantity_anomaly' | 'weak_comment' | 'sender_pattern' | 'anti_collusion';
  severity: 'low' | 'medium' | 'high';
  detail: string;
}

export interface AiVerdict {
  provider?: 'gemini' | 'local';
  duplicateDetected: boolean;
  matchScore?: number;
  matchedRequestId?: string;
  productVerified: boolean;
  damageVerified: boolean;
  quantityVerified: boolean;
  quantityEstimate?: number;
  quantityConfidence?: number;
  suspectedStaging?: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  flags: RiskFlag[];
  visionFlags?: string[];
  summary?: string;
  error?: string;
  errorDetail?: string;
  suggestedRoute: ReviewRoute;
  reasoning: string;
}

export interface IikoStatus {
  mode: 'sandbox' | 'production';
  status: 'pending' | 'synced' | 'failed';
  documentId?: string;
  warehouse?: string;
  documentType?: string;
  syncedAt?: string;
}

export interface AuditEvent {
  id: string;
  requestId: string;
  event: 'created' | 'verifying' | 'pending' | 'approved' | 'rejected' | 'iiko_synced' | 'new_photo_requested';
  actor: string;
  timestamp: string;
  detail?: string;
}

export interface WriteOffRequest {
  id: string;
  backendId?: string;
  requestNumber?: string;
  branch: string;
  product: string;
  quantity: number;
  unit: 'pcs' | 'kg' | 'box';
  reason: string;
  writeOffType: WriteOffType;
  deductionEmployee?: string;
  comment: string;
  photoHash?: string;
  proofImageUrl?: string;
  proofSource?: 'uploaded_test_photo' | 'live_camera_capture' | 'camera_demo_capture';
  sender: string;
  senderRole: 'cashier' | 'cook';
  createdAt: string;
  status: WriteOffStatus;
  route?: ReviewRoute;
  aiVerdict?: AiVerdict;
  reviewerNote?: string;
  reviewer?: string;
  iiko?: IikoStatus;
  auditEvents: AuditEvent[];
}

export interface AnalyticsSummary {
  preventedToday: number;
  highRiskRequests: number;
  approvalRate: number;
  iikoSyncedActs: number;
  branches: Branch[];
  anomalies: string[];
}

export interface HealthStatus {
  status: 'ok' | 'error';
  database: 'supabase' | 'local' | 'error';
  supabaseConfigured?: boolean;
  geminiConfigured: boolean;
  iikoMode: 'sandbox' | 'production';
  visionProvider: 'gemini' | 'local';
  visionStatus: 'ready' | 'disabled' | 'fallback';
  timestamp: string;
}

export interface CreateWriteOffInput {
  branch: string;
  product: string;
  quantity: number;
  unit?: 'pcs' | 'kg' | 'box';
  reason: string;
  writeOffType: WriteOffType;
  deductionEmployee?: string;
  comment: string;
  senderRole: 'cashier' | 'cook';
  photo?: File | Blob;
  photoSource?: 'uploaded_test_photo' | 'live_camera_capture' | 'camera_demo_capture';
  demoAsset?: 'tomatoes_reused' | 'tomatoes_1847' | 'patty' | 'buns' | 'cheese';
}

export interface GeocodedStore {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  geocode_status: 'ok' | 'approximate' | 'failed' | 'curated';
  geocode_provider?: string;
  coordinates_source?: string;
  geocoded_at?: string;
  demo_note?: string;
}
