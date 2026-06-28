// Risk score weights. All values are intentional — do not adjust without
// updating the unit test (tests/risk-engine.test.ts) and README breakdown.
//
// VISION_UNAVAILABLE is intentionally 1 (not a multiple of 5) so the total
// can reach non-round values like 91 that are harder to game than obvious
// round numbers. See API_README.md "Risk score breakdown for demo scenario."

export const WEIGHTS = {
  BASE: 10,

  // Duplicate photo detection
  DUPLICATE_STRONG: 50,    // Hamming distance 0-3
  DUPLICATE_POSSIBLE: 35,  // Hamming distance 4-8

  // Vision-derived (only applied when vision ran successfully)
  PRODUCT_MISMATCH: 25,
  NO_DAMAGE_DESPITE_CLAIM: 20,
  QUANTITY_EXCEEDS_VISIBLE_ESTIMATE: 15,
  SUSPECTED_STAGING: 15,

  // Metadata / source signals
  WEAK_COMMENT: 10,           // comment.length < 20 chars
  UNTRUSTED_SOURCE: 15,       // source not in pwa|telegram
  MISSING_CAPTURED_AT: 10,
  MISSING_GEO: 5,
  FAR_FROM_STORE: 20,         // >1 km from store location

  // Context / anomaly signals
  ABOVE_NORM_QUANTITY: 20,    // quantity > 2× avg_daily_quantity
  FREQUENT_SENDER: 15,        // sender created ≥5 requests in last 24h
  REPEATED_DEDUCTION_EMPLOYEE: 20, // same deduction employee in ≥3 of last 10 deduction requests

  // Reliability
  VISION_UNAVAILABLE: 1,      // AI verification layer could not run

  // Subtractions (vision-derived, only when vision ran successfully)
  CLEAR_DAMAGE_VISIBLE: -10,
  PRODUCT_MATCH: -5,
  QUANTITY_MATCHES_ESTIMATE: -5,
  CLEAN_METADATA: -5,         // captured_at + pwa/telegram + geo within store range
} as const;

// Fraud risk level thresholds.
export const RISK_THRESHOLDS = { MEDIUM: 35, HIGH: 70 } as const;

export type FraudRisk = "low" | "medium" | "high";

export interface RiskFlag {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  scoreDelta: number;
  metadata?: Record<string, unknown>;
}

export interface RiskInput {
  // Duplicate photo detection
  duplicateStrength: "strong" | "possible" | "none";
  duplicateDistance?: number;
  duplicateMatchPercent?: number;
  duplicateRequestNumber?: string;

  // Vision result (null means vision was unavailable/errored)
  visionAvailable: boolean;
  aiVision: {
    matchesSelectedProduct: boolean;
    visibleDamage: boolean;
    estimatedQuantity: number | null;
    photoQuality: "clear" | "blurry" | "too_dark" | "suspicious";
    matchesComment: boolean;
    confidence: number;
    suspectedStaging?: boolean;
  } | null;

  // Request fields
  claimedQuantity: number;
  reason: string;
  comment: string;
  source: string;
  capturedAt: string | null;
  captureLatitude: number | null;
  captureLongitude: number | null;
  writeoffType: "no_deduction" | "employee_deduction";

  // Store geo for distance check
  storeLat: number | null;
  storeLon: number | null;

  // Pre-computed context signals (gathered from DB before calling this fn)
  quantityAboveNorm: boolean;
  frequentSender: boolean;
  repeatedDeductionEmployee: boolean;
}

export interface RiskScoreResult {
  score: number;
  level: FraudRisk;
  flags: RiskFlag[];
}
