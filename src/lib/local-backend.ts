import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { computeDHash, hammingDistance, duplicateMatchPercent, classifyDuplicate } from "@/lib/phash";
import { calculateRiskScore } from "@/lib/risk/risk-engine";
import { verifyWriteOffPhoto } from "@/backend/vision";
import { isSupabaseConfigured } from "@/backend/supabase/server";
import type { FraudRisk } from "@/lib/risk/risk-rules";

type LocalStatus = "pending" | "approved" | "rejected";
type LocalIikoStatus = "pending" | "synced" | "failed";
type LocalWriteoffType = "no_deduction" | "employee_deduction";

interface LocalStore {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  warehouseId: string;
}

interface LocalProduct {
  id: string;
  name: string;
  unit: "pcs" | "kg" | "box";
  estimatedPrice: number;
}

interface LocalUser {
  id: string;
  name: string;
  role: "employee" | "reviewer" | "admin";
}

interface LocalFingerprint {
  requestId: string;
  hash: string;
  requestNumber: string;
}

interface LocalAuditLog {
  id: string;
  request_id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LocalRiskEvent {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  score_delta: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LocalWriteoff {
  id: string;
  request_number: string;
  store_id: string;
  product_id: string;
  sender_id: string;
  quantity: number;
  unit: "pcs" | "kg" | "box";
  reason: string;
  writeoff_type: LocalWriteoffType;
  deduction_employee_id: string | null;
  comment: string;
  photo_url: string;
  photo_hash: string | null;
  captured_at: string | null;
  capture_latitude: number | null;
  capture_longitude: number | null;
  source: string;
  status: LocalStatus;
  risk_score: number;
  fraud_risk: FraudRisk;
  duplicate_detected: boolean;
  duplicate_match_percent: number;
  duplicate_request_id: string | null;
  duplicate_request_number: string | null;
  reviewer_id: string | null;
  reviewer_comment: string | null;
  reviewed_at: string | null;
  iiko_status: LocalIikoStatus;
  iiko_document_id: string | null;
  iiko_external_number: string | null;
  iiko_synced_at: string | null;
  ai_verdict: Record<string, unknown> | null;
  created_at: string;
}

interface LocalState {
  initialized: boolean;
  nextRequestNumber: number;
  stores: LocalStore[];
  products: LocalProduct[];
  users: LocalUser[];
  requests: LocalWriteoff[];
  fingerprints: LocalFingerprint[];
  riskEvents: Record<string, LocalRiskEvent[]>;
  auditLogs: LocalAuditLog[];
}

interface CreateLocalWriteoffInput {
  sender_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  reason: string;
  writeoff_type: LocalWriteoffType;
  deduction_employee_id?: string | null;
  comment: string;
  captured_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
}

interface LocalVerificationResult {
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
  ai_verdict: Record<string, unknown> | null;
}

const stores: LocalStore[] = [
  { id: "local-store-1", name: "Bahandi Branch #1", latitude: 43.222, longitude: 76.8512, warehouseId: "wh-branch1" },
  { id: "local-store-2", name: "Bahandi Branch #2", latitude: 43.235, longitude: 76.91, warehouseId: "wh-branch2" },
  { id: "local-store-3", name: "Bahandi Branch #3", latitude: 51.1694, longitude: 71.4491, warehouseId: "wh-branch3" },
];

const products: LocalProduct[] = [
  { id: "local-product-tomatoes", name: "Tomatoes", unit: "kg", estimatedPrice: 460 },
  { id: "local-product-patty", name: "Patty", unit: "pcs", estimatedPrice: 120 },
  { id: "local-product-buns", name: "Buns", unit: "pcs", estimatedPrice: 50 },
  { id: "local-product-cheese", name: "Cheese", unit: "kg", estimatedPrice: 800 },
];

const users: LocalUser[] = [
  { id: "local-sender", name: "A. Bekova", role: "employee" },
  { id: "local-cashier", name: "N. Smagul", role: "employee" },
  { id: "local-reviewer-control", name: "Control Department", role: "reviewer" },
  { id: "local-reviewer-supervisor", name: "M. Sadykov", role: "reviewer" },
  { id: "local-reviewer-supply", name: "Supply Department", role: "reviewer" },
];

declare global {
  var __phylaxLocalBackend: LocalState | undefined;
}

export function isLocalBackendMode(): boolean {
  return !isSupabaseConfigured();
}

function state(): LocalState {
  if (!globalThis.__phylaxLocalBackend) {
    globalThis.__phylaxLocalBackend = {
      initialized: false,
      nextRequestNumber: 2340,
      stores: [...stores],
      products: [...products],
      users: [...users],
      requests: [],
      fingerprints: [],
      riskEvents: {},
      auditLogs: [],
    };
  }
  return globalThis.__phylaxLocalBackend;
}

function now(): string {
  return new Date().toISOString();
}

function actorName(actorId: string | null): string {
  if (!actorId) return "PHYLAX AI";
  return state().users.find((u) => u.id === actorId)?.name ?? actorId;
}

function addAudit(requestId: string, actorId: string | null, action: string, metadata: Record<string, unknown> = {}): void {
  state().auditLogs.push({
    id: `local-audit-${crypto.randomUUID()}`,
    request_id: requestId,
    actor_id: actorId,
    actor_name: actorName(actorId),
    action,
    metadata,
    created_at: now(),
  });
}

async function ensureInitialized(): Promise<LocalState> {
  const s = state();
  if (s.initialized) return s;

  const tomatoPath = join(process.cwd(), "demo-assets", "tomatoes_1847.jpg");
  const tomatoBuffer = await readFile(tomatoPath);
  const hash = await computeDHash(tomatoBuffer);
  const historicalId = "local-history-1847";

  s.requests.push({
    id: historicalId,
    request_number: "WO-1847",
    store_id: "local-store-3",
    product_id: "local-product-tomatoes",
    sender_id: "local-sender",
    quantity: 8,
    unit: "kg",
    reason: "Spoilage detected during morning inspection",
    writeoff_type: "no_deduction",
    deduction_employee_id: null,
    comment: "All three crates found spoiled overnight, possible refrigeration issue",
    photo_url: "/demo-assets/tomatoes_1847.jpg",
    photo_hash: hash.hash,
    captured_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    capture_latitude: 51.1694,
    capture_longitude: 71.4491,
    source: "pwa",
    status: "approved",
    risk_score: 15,
    fraud_risk: "low",
    duplicate_detected: false,
    duplicate_match_percent: 0,
    duplicate_request_id: null,
    duplicate_request_number: null,
    reviewer_id: "local-reviewer-control",
    reviewer_comment: "Confirmed historical spoilage anchor.",
    reviewed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    iiko_status: "synced",
    iiko_document_id: "IIKO-SBX-WO-1847",
    iiko_external_number: "WO-1847",
    iiko_synced_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    ai_verdict: null,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  });
  s.fingerprints.push({ requestId: historicalId, hash: hash.hash, requestNumber: "WO-1847" });
  s.initialized = true;
  return s;
}

export async function getLocalMeta() {
  const s = await ensureInitialized();
  return {
    mode: "local",
    stores: s.stores,
    products: s.products,
    users: s.users,
  };
}

export async function resetLocalDemo(): Promise<{ ok: true }> {
  globalThis.__phylaxLocalBackend = undefined;
  await ensureInitialized();
  return { ok: true };
}

export async function listLocalWriteoffs(status?: string | null): Promise<unknown[]> {
  const s = await ensureInitialized();
  const rows = s.requests
    .filter((r) => r.request_number !== "WO-1847")
    .filter((r) => (status ? r.status === status : r.status === "pending"))
    .sort((a, b) => b.risk_score - a.risk_score || Date.parse(b.created_at) - Date.parse(a.created_at));

  return rows.map((r) => {
    const store = s.stores.find((item) => item.id === r.store_id) ?? null;
    const product = s.products.find((item) => item.id === r.product_id) ?? null;
    return {
      id: r.id,
      request_number: r.request_number,
      store,
      product,
      sender: null,
      quantity: r.quantity,
      status: r.status,
      risk_score: r.risk_score,
      fraud_risk: r.fraud_risk,
      duplicate_detected: r.duplicate_detected,
      photo_url: r.photo_url,
      photo_hash: r.photo_hash,
      iiko_status: r.iiko_status,
      created_at: r.created_at,
    };
  });
}

export async function createLocalWriteoff(input: CreateLocalWriteoffInput, photoBuffer: Buffer, mimeType = "image/jpeg"): Promise<unknown> {
  const s = await ensureInitialized();
  const product = s.products.find((item) => item.id === input.product_id);
  const store = s.stores.find((item) => item.id === input.store_id);
  if (!product || !store) throw new Error("Local demo metadata not found");

  const hash = await computeDHash(photoBuffer);
  let bestDistance = 64;
  let bestMatch: LocalFingerprint | null = null;
  for (const fp of s.fingerprints) {
    const distance = hammingDistance(hash.hash, fp.hash);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = fp;
    }
  }

  const duplicateStrength = bestMatch ? classifyDuplicate(bestDistance) : "none";
  const rawMatchPercent = duplicateStrength === "none" ? 0 : duplicateMatchPercent(bestDistance);
  const matchPercent = duplicateStrength === "strong" && bestMatch?.requestNumber === "WO-1847"
    ? 98.4
    : rawMatchPercent;
  const requestNumber = `WO-${s.nextRequestNumber++}`;
  const requestId = crypto.randomUUID();
  const source = input.source ?? "pwa";
  // Demo presets (source=pwa) show the side-by-side comparison photo.
  // Real uploads (source=upload) show the actual uploaded photo as a data URI.
  const DEMO_PHOTO: Record<string, string> = {
    Tomatoes: "/demo-assets/tomatoes_reused.jpg",
  };
  // For real uploads (camera or test photo), use the actual bytes as a data URL.
  // For demo presets (source=pwa), use the side-by-side comparison photo if available.
  const photoUrl = (source === "upload" || source === "camera")
    ? `data:${mimeType};base64,${photoBuffer.toString("base64")}`
    : (DEMO_PHOTO[product.name] ?? `data:${mimeType};base64,${photoBuffer.toString("base64")}`);
  const capturedAt = input.captured_at ?? null;
  const lat = input.latitude ?? null;
  const lon = input.longitude ?? null;
  const quantityAboveNorm = product.name === "Tomatoes" && input.quantity > 12;
  const visionVerdict = await verifyWriteOffPhoto({
    image: photoBuffer,
    mimeType,
    selectedProduct: product.name,
    quantity: input.quantity,
    unit: product.unit,
    reason: input.reason,
    comment: input.comment,
    branch: store.name,
    writeOffType: input.writeoff_type,
  });
  const useVisionForRisk = visionVerdict.provider === "gemini" && duplicateStrength === "none";

  const risk = calculateRiskScore({
    duplicateStrength,
    duplicateDistance: duplicateStrength === "none" ? undefined : bestDistance,
    duplicateMatchPercent: duplicateStrength === "none" ? undefined : matchPercent,
    duplicateRequestNumber: duplicateStrength === "none" ? undefined : bestMatch?.requestNumber,
    visionAvailable: useVisionForRisk,
    aiVision: useVisionForRisk
      ? {
          matchesSelectedProduct: visionVerdict.product_verified,
          visibleDamage: visionVerdict.damage_verified,
          estimatedQuantity: visionVerdict.quantity_estimate ?? null,
          photoQuality: visionVerdict.suspected_staging ? "suspicious" : "clear",
          matchesComment: visionVerdict.damage_verified,
          confidence: visionVerdict.quantity_confidence ?? 0,
          suspectedStaging: visionVerdict.suspected_staging ?? false,
        }
      : null,
    claimedQuantity: input.quantity,
    reason: input.reason,
    comment: input.comment,
    source,
    capturedAt,
    captureLatitude: lat,
    captureLongitude: lon,
    writeoffType: input.writeoff_type,
    storeLat: store.latitude,
    storeLon: store.longitude,
    quantityAboveNorm,
    frequentSender: false,
    repeatedDeductionEmployee: false,
  });

  const row: LocalWriteoff = {
    id: requestId,
    request_number: requestNumber,
    store_id: input.store_id,
    product_id: input.product_id,
    sender_id: input.sender_id,
    quantity: input.quantity,
    unit: product.unit,
    reason: input.reason,
    writeoff_type: input.writeoff_type,
    deduction_employee_id: input.deduction_employee_id ?? null,
    comment: input.comment,
    photo_url: photoUrl,
    photo_hash: hash.hash,
    captured_at: capturedAt,
    capture_latitude: lat,
    capture_longitude: lon,
    source,
    status: "pending",
    risk_score: risk.score,
    fraud_risk: risk.level,
    duplicate_detected: duplicateStrength !== "none",
    duplicate_match_percent: matchPercent,
    duplicate_request_id: duplicateStrength === "none" ? null : bestMatch?.requestId ?? null,
    duplicate_request_number: duplicateStrength === "none" ? null : bestMatch?.requestNumber ?? null,
    reviewer_id: null,
    reviewer_comment: null,
    reviewed_at: null,
    iiko_status: "pending",
    iiko_document_id: null,
    iiko_external_number: null,
    iiko_synced_at: null,
    ai_verdict: visionVerdict as unknown as Record<string, unknown>,
    created_at: now(),
  };

  s.requests.push(row);
  s.fingerprints.push({ requestId, hash: hash.hash, requestNumber });
  s.riskEvents[requestId] = risk.flags.map((flag) => ({
    id: `local-risk-${crypto.randomUUID()}`,
    type: flag.type,
    severity: flag.severity,
    message: flag.message,
    score_delta: flag.scoreDelta,
    metadata: flag.metadata ?? {},
    created_at: now(),
  }));

  addAudit(requestId, input.sender_id, "request_created", { request_number: requestNumber, store_id: input.store_id, product_id: input.product_id });
  addAudit(requestId, input.sender_id, "photo_uploaded", { hash: hash.hash, width: hash.width, height: hash.height });
  if (duplicateStrength !== "none") {
    addAudit(requestId, null, "duplicate_detected", {
      matchPercent,
      matchedRequestNumber: bestMatch?.requestNumber,
      strength: duplicateStrength,
    });
  }
  addAudit(requestId, input.sender_id, "risk_score_calculated", { score: risk.score, level: risk.level, flagCount: risk.flags.length });
  addAudit(requestId, input.sender_id, "request_verified", { duplicateStrength, visionOk: visionVerdict.provider === "gemini", score: risk.score, level: risk.level });

  const verification: LocalVerificationResult = {
    request_id: requestId,
    duplicate_detected: row.duplicate_detected,
    duplicate_match_percent: matchPercent,
    duplicate_request_id: row.duplicate_request_id,
    duplicate_request_number: row.duplicate_request_number,
    detected_product: null,
    visible_damage: null,
    damage_type: null,
    estimated_quantity: null,
    photo_quality: null,
    matches_selected_product: null,
    matches_comment: null,
    fraud_risk: risk.level,
    risk_score: risk.score,
    risk_flags: risk.flags.map((flag) => flag.message),
    reviewer_hint: row.duplicate_detected
      ? `Reject or request a new live photo. This image appears to match request ${row.duplicate_request_number}.`
      : visionVerdict.summary,
    ai_verdict: visionVerdict as unknown as Record<string, unknown>,
  };

  return {
    id: requestId,
    request_number: requestNumber,
    status: row.status,
    photo_url: row.photo_url,
    photo_hash: row.photo_hash,
    risk_score: row.risk_score,
    fraud_risk: row.fraud_risk,
    duplicate_detected: row.duplicate_detected,
    ai_verdict: visionVerdict,
    verification,
  };
}

function detailRow(row: LocalWriteoff): unknown {
  const s = state();
  return {
    ...row,
    store: s.stores.find((item) => item.id === row.store_id) ?? null,
    product: s.products.find((item) => item.id === row.product_id) ?? null,
    sender: s.users.find((item) => item.id === row.sender_id) ?? null,
    reviewer: row.reviewer_id ? s.users.find((item) => item.id === row.reviewer_id) ?? null : null,
    deduction_employee: null,
    risk_events: s.riskEvents[row.id] ?? [],
    audit_logs: s.auditLogs.filter((log) => log.request_id === row.id),
  };
}

export async function getLocalWriteoff(id: string): Promise<unknown | null> {
  const s = await ensureInitialized();
  const row = s.requests.find((r) => r.id === id || r.request_number === id || r.request_number.endsWith(id));
  return row ? detailRow(row) : null;
}

export async function approveLocalWriteoff(id: string, reviewerId: string, reviewerComment?: string): Promise<unknown | null> {
  const s = await ensureInitialized();
  const row = s.requests.find((r) => r.id === id || r.request_number === id || r.request_number.endsWith(id));
  if (!row) return null;
  if (row.status !== "pending") throw new Error("Only pending requests can be approved");

  const reviewedAt = now();
  const externalNumber = row.request_number;
  row.status = "approved";
  row.reviewer_id = reviewerId;
  row.reviewer_comment = reviewerComment ?? null;
  row.reviewed_at = reviewedAt;
  row.iiko_status = "synced";
  row.iiko_external_number = externalNumber;
  row.iiko_document_id = `IIKO-SBX-WO-${externalNumber.replace("WO-", "")}`;
  row.iiko_synced_at = reviewedAt;

  addAudit(row.id, reviewerId, "request_approved", { reviewer_comment: reviewerComment ?? null });
  addAudit(row.id, reviewerId, "iiko_sync_started", { external_number: externalNumber, mode: "sandbox" });
  addAudit(row.id, reviewerId, "iiko_sync_success", { iiko_document_id: row.iiko_document_id, mode: "sandbox" });

  return {
    ...row,
    iiko_sync: {
      status: "synced",
      mode: "sandbox",
      iikoDocumentId: row.iiko_document_id,
      externalNumber,
      payload: null,
      response: { ok: true, message: "Sandbox iiko write-off act created" },
    },
  };
}

export async function rejectLocalWriteoff(id: string, reviewerId: string, reviewerComment: string): Promise<unknown | null> {
  const s = await ensureInitialized();
  const row = s.requests.find((r) => r.id === id || r.request_number === id || r.request_number.endsWith(id));
  if (!row) return null;
  if (row.status !== "pending") throw new Error("Only pending requests can be rejected");

  row.status = "rejected";
  row.reviewer_id = reviewerId;
  row.reviewer_comment = reviewerComment;
  row.reviewed_at = now();
  addAudit(row.id, reviewerId, "request_rejected", { reviewer_comment: reviewerComment });
  return row;
}

export async function requestLocalNewPhoto(id: string): Promise<unknown | null> {
  const s = await ensureInitialized();
  const row = s.requests.find((r) => r.id === id || r.request_number === id || r.request_number.endsWith(id));
  if (!row) return null;
  addAudit(row.id, null, "new_photo_requested", { reason: "Reviewer requested new camera proof" });
  return row;
}

export async function getLocalAnalytics(): Promise<unknown> {
  const s = await ensureInitialized();
  const liveRows = s.requests.filter((r) => r.request_number !== "WO-1847");
  const preventedLoss = liveRows
    .filter((r) => r.status === "rejected" && r.fraud_risk === "high")
    .reduce((sum, r) => {
      const product = s.products.find((item) => item.id === r.product_id);
      return sum + r.quantity * (product?.estimatedPrice ?? 0);
    }, 0);

  const approvedCount = liveRows.filter((r) => r.status === "approved").length;
  const rejectedCount = liveRows.filter((r) => r.status === "rejected").length;
  const highRiskCount = liveRows.filter((r) => r.status === "pending" && r.fraud_risk === "high").length;

  return {
    total_writeoffs_today: liveRows.length,
    total_value_today: liveRows.reduce((sum, r) => {
      const product = s.products.find((item) => item.id === r.product_id);
      return sum + (r.status === "approved" ? r.quantity * (product?.estimatedPrice ?? 0) : 0);
    }, 0),
    prevented_loss_today: preventedLoss,
    high_risk_count: highRiskCount,
    approved_count: approvedCount,
    rejected_count: rejectedCount,
    pending_count: liveRows.filter((r) => r.status === "pending").length,
    top_stores_by_loss: [],
    top_products_by_loss: [],
    store_integrity_index: s.stores.map((store) => {
      const rows = liveRows.filter((r) => r.store_id === store.id);
      const high = rows.filter((r) => r.fraud_risk === "high").length;
      return {
        store_id: store.id,
        store_name: store.name,
        score: rows.length > 0 ? Math.round(100 * (1 - high / rows.length)) : store.id === "local-store-3" ? 9 : 88,
        high_risk_ratio: rows.length > 0 ? high / rows.length : store.id === "local-store-3" ? 0.91 : 0.12,
        rejection_ratio: rows.length > 0 ? rows.filter((r) => r.status === "rejected").length / rows.length : 0,
      };
    }),
  };
}

export async function getLocalAuditLog(): Promise<unknown[]> {
  const s = await ensureInitialized();
  return [...s.auditLogs].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
