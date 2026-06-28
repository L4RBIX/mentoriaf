// FORGED — TypeScript contract types for frontend integration.
// All API endpoints return data conforming to these shapes.

export type UserRole = "employee" | "reviewer" | "admin" | "owner";
export type WriteoffType = "no_deduction" | "employee_deduction";
export type WriteoffStatus = "draft" | "pending" | "approved" | "rejected";
export type FraudRisk = "low" | "medium" | "high";
export type IikoStatus = "not_synced" | "pending" | "synced" | "failed";

// ── Full request detail (GET /api/writeoffs/:id) ────────────────────────
export interface WriteoffRequest {
  id: string;
  request_number: string;
  store: {
    id: string;
    name: string;
    address: string | null;
  };
  product: {
    id: string;
    name: string;
    unit: string;
    category: string | null;
    estimated_price: number;
  };
  sender: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  deduction_employee: {
    id: string;
    full_name: string;
    position: string | null;
  } | null;
  quantity: number;
  unit: string;
  reason: string;
  writeoff_type: WriteoffType;
  comment: string;
  photo_url: string;
  captured_at: string | null;
  capture_latitude: number | null;
  capture_longitude: number | null;
  source: string;
  status: WriteoffStatus;
  risk_score: number;
  fraud_risk: FraudRisk;
  duplicate_detected: boolean;
  duplicate_match_percent: number;
  duplicate_request_id: string | null;
  ai_verdict: RiskAnalysis | { error: string } | null;
  risk_events: RiskEvent[];
  reviewer: {
    id: string;
    name: string;
  } | null;
  reviewer_comment: string | null;
  reviewed_at: string | null;
  iiko_status: IikoStatus;
  iiko_document_id: string | null;
  iiko_external_number: string | null;
  iiko_response: IikoSyncResult | null;
  iiko_synced_at: string | null;
  audit_logs: AuditLog[];
  created_at: string;
  updated_at: string;
}

// ── List item (GET /api/writeoffs) ────────────────────────────────────
export interface WriteoffSummary {
  id: string;
  request_number: string;
  store: { id: string; name: string } | null;
  product: { id: string; name: string; unit: string } | null;
  sender: { id: string; name: string } | null;
  quantity: number;
  status: WriteoffStatus;
  risk_score: number;
  fraud_risk: FraudRisk;
  duplicate_detected: boolean;
  photo_url: string;
  iiko_status: IikoStatus;
  created_at: string;
}

// ── Verify result (POST /api/writeoffs/:id/verify) ────────────────────
export interface VerifyResponse {
  request_id: string;
  duplicate_detected: boolean;
  duplicate_match_percent: number;
  duplicate_request_id: string | null;
  duplicate_request_number: string | null;
  detected_product: string | null;
  visible_damage: boolean | null;
  damage_type: string | null;
  estimated_quantity: number | null;
  photo_quality: string | null;
  matches_selected_product: boolean | null;
  matches_comment: boolean | null;
  fraud_risk: FraudRisk;
  risk_score: number;
  risk_flags: string[];
  reviewer_hint: string | null;
  ai_verdict: RiskAnalysis | { error: string } | null;
}

// ── AI / vision analysis result ──────────────────────────────────────
export interface RiskAnalysis {
  detected_product: string;
  matches_selected_product: boolean;
  visible_damage: boolean;
  damage_type: string;
  estimated_quantity: number;
  photo_quality: "clear" | "blurry" | "too_dark" | "suspicious";
  matches_comment: boolean;
  suspicious_signs: string[];
  confidence: number;
  reviewer_hint: string;
}

// ── Individual risk event ────────────────────────────────────────────
export interface RiskEvent {
  id: string;
  type: string;
  severity: FraudRisk;
  message: string;
  score_delta: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Audit log entry ────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  request_id: string | null;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── iiko sync result ───────────────────────────────────────────────
export interface IikoSyncResult {
  status: "synced" | "failed";
  mode: "real" | "sandbox";
  iikoDocumentId: string | null;
  externalNumber: string;
  payload: unknown;
  response: unknown;
  error?: string;
}

// ── Analytics summary (GET /api/analytics/summary) ────────────────
export interface AnalyticsSummary {
  total_writeoffs_today: number;
  total_value_today: number;
  prevented_loss_today: number;
  high_risk_count: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  top_stores_by_loss: Array<{
    store_id: string;
    store_name: string;
    total_quantity: number;
    total_value: number;
    request_count: number;
  }>;
  top_products_by_loss: Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_value: number;
    request_count: number;
  }>;
  store_integrity_index: Array<{
    store_id: string;
    store_name: string;
    score: number; // 0-100, higher = more trustworthy
    high_risk_ratio: number;
    rejection_ratio: number;
  }>;
}
