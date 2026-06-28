import { haversineDistanceMeters } from "@/lib/geo";
import {
  type FraudRisk,
  type RiskFlag,
  type RiskInput,
  type RiskScoreResult,
  RISK_THRESHOLDS,
  WEIGHTS,
} from "./risk-rules";

const TRUSTED_SOURCES = ["pwa", "telegram"];
const DAMAGE_KEYWORDS = [
  "spoil",
  "rotten",
  "damage",
  "deform",
  "dent",
  "mold",
  "mould",
  "expired",
  "contamina",
  "испорч",
  "порч",
  "гнил",
  "дефект",
  "повреждён",
  "повреждён",
  "плесен",
];

function hasDamageClaim(text: string): boolean {
  const lower = text.toLowerCase();
  return DAMAGE_KEYWORDS.some((kw) => lower.includes(kw));
}

function scoreLevel(score: number): FraudRisk {
  if (score >= RISK_THRESHOLDS.HIGH) return "high";
  if (score >= RISK_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export function calculateRiskScore(input: RiskInput): RiskScoreResult {
  const flags: RiskFlag[] = [];
  let delta = WEIGHTS.BASE;

  // ── Duplicate photo ────────────────────────────────────────────────────
  if (input.duplicateStrength === "strong") {
    const msg = input.duplicateRequestNumber
      ? `Duplicate photo detected (${input.duplicateMatchPercent?.toFixed(1)}% match) — image already used in request ${input.duplicateRequestNumber}`
      : `Duplicate photo detected (${input.duplicateMatchPercent?.toFixed(1)}% match)`;
    flags.push({
      type: "duplicate_photo",
      severity: "high",
      message: msg,
      scoreDelta: WEIGHTS.DUPLICATE_STRONG,
      metadata: {
        distance: input.duplicateDistance,
        matchPercent: input.duplicateMatchPercent,
      },
    });
    delta += WEIGHTS.DUPLICATE_STRONG;
  } else if (input.duplicateStrength === "possible") {
    flags.push({
      type: "possible_duplicate_photo",
      severity: "medium",
      message: `Possible duplicate photo (${input.duplicateMatchPercent?.toFixed(1)}% match) — review carefully`,
      scoreDelta: WEIGHTS.DUPLICATE_POSSIBLE,
      metadata: {
        distance: input.duplicateDistance,
        matchPercent: input.duplicateMatchPercent,
      },
    });
    delta += WEIGHTS.DUPLICATE_POSSIBLE;
  }

  // ── Vision-derived rules (only when vision ran and returned usable data) ──
  if (input.visionAvailable && input.aiVision) {
    const v = input.aiVision;

    if (!v.matchesSelectedProduct) {
      flags.push({
        type: "product_mismatch",
        severity: "high",
        message: "AI did not detect the claimed product in the photo",
        scoreDelta: WEIGHTS.PRODUCT_MISMATCH,
      });
      delta += WEIGHTS.PRODUCT_MISMATCH;
    } else {
      // product matches — small deduction
      flags.push({
        type: "product_match",
        severity: "low",
        message: "AI confirmed claimed product is visible",
        scoreDelta: WEIGHTS.PRODUCT_MATCH,
      });
      delta += WEIGHTS.PRODUCT_MATCH;
    }

    const claimsDamage = hasDamageClaim(input.reason) || hasDamageClaim(input.comment);
    if (claimsDamage && !v.visibleDamage) {
      flags.push({
        type: "no_damage_despite_claim",
        severity: "high",
        message: "Comment claims damage/spoilage but no visible damage detected",
        scoreDelta: WEIGHTS.NO_DAMAGE_DESPITE_CLAIM,
      });
      delta += WEIGHTS.NO_DAMAGE_DESPITE_CLAIM;
    } else if (v.visibleDamage && claimsDamage) {
      flags.push({
        type: "clear_damage_visible",
        severity: "low",
        message: "Visible damage confirmed — consistent with claim",
        scoreDelta: WEIGHTS.CLEAR_DAMAGE_VISIBLE,
      });
      delta += WEIGHTS.CLEAR_DAMAGE_VISIBLE;
    }

    if (v.estimatedQuantity !== null && v.estimatedQuantity > 0) {
      const over = input.claimedQuantity / v.estimatedQuantity;
      if (over > 1.3) {
        flags.push({
          type: "quantity_exceeds_visible",
          severity: "medium",
          message: `Claimed quantity (${input.claimedQuantity}) is ${Math.round((over - 1) * 100)}% above visually estimated ${v.estimatedQuantity}`,
          scoreDelta: WEIGHTS.QUANTITY_EXCEEDS_VISIBLE_ESTIMATE,
          metadata: { claimed: input.claimedQuantity, estimated: v.estimatedQuantity },
        });
        delta += WEIGHTS.QUANTITY_EXCEEDS_VISIBLE_ESTIMATE;
      } else if (over <= 1.2) {
        flags.push({
          type: "quantity_matches_estimate",
          severity: "low",
          message: "Claimed quantity is within 20% of AI visual estimate",
          scoreDelta: WEIGHTS.QUANTITY_MATCHES_ESTIMATE,
        });
        delta += WEIGHTS.QUANTITY_MATCHES_ESTIMATE;
      }
    }

    if (v.suspectedStaging) {
      flags.push({
        type: "suspected_staging",
        severity: "medium",
        message: "AI flagged the photo as suspicious, staged, screenshot-like, or unrelated",
        scoreDelta: WEIGHTS.SUSPECTED_STAGING,
      });
      delta += WEIGHTS.SUSPECTED_STAGING;
    }
  }

  // ── Vision unavailability bump ────────────────────────────────────────
  if (!input.visionAvailable) {
    flags.push({
      type: "vision_unavailable",
      severity: "low",
      message: "AI image verification layer was unavailable — scoring based on duplicate detection and metadata only",
      scoreDelta: WEIGHTS.VISION_UNAVAILABLE,
    });
    delta += WEIGHTS.VISION_UNAVAILABLE;
  }

  // ── Comment quality ───────────────────────────────────────────────────
  if (input.comment.length < 20) {
    flags.push({
      type: "weak_comment",
      severity: "low",
      message: `Comment is too short (${input.comment.length} chars) — insufficient justification`,
      scoreDelta: WEIGHTS.WEAK_COMMENT,
    });
    delta += WEIGHTS.WEAK_COMMENT;
  }

  // ── Source / capture metadata ─────────────────────────────────────────
  if (!TRUSTED_SOURCES.includes(input.source)) {
    flags.push({
      type: "untrusted_source",
      severity: "medium",
      message: `Photo uploaded from untrusted source "${input.source}" — not a live camera capture`,
      scoreDelta: WEIGHTS.UNTRUSTED_SOURCE,
    });
    delta += WEIGHTS.UNTRUSTED_SOURCE;
  }

  if (!input.capturedAt) {
    flags.push({
      type: "missing_captured_at",
      severity: "medium",
      message: "Photo capture timestamp is missing — cannot verify when the photo was taken",
      scoreDelta: WEIGHTS.MISSING_CAPTURED_AT,
    });
    delta += WEIGHTS.MISSING_CAPTURED_AT;
  }

  if (input.captureLatitude === null || input.captureLongitude === null) {
    flags.push({
      type: "missing_geo",
      severity: "low",
      message: "Geolocation not provided — cannot verify photo was taken at the store",
      scoreDelta: WEIGHTS.MISSING_GEO,
    });
    delta += WEIGHTS.MISSING_GEO;
  } else if (input.storeLat !== null && input.storeLon !== null) {
    // Both capture and store geo present — check distance.
    const distM = haversineDistanceMeters(
      input.captureLatitude,
      input.captureLongitude,
      input.storeLat,
      input.storeLon
    );
    if (distM > 1000) {
      flags.push({
        type: "far_from_store",
        severity: "high",
        message: `Photo taken ${Math.round(distM)}m from the selected store (threshold: 1000m)`,
        scoreDelta: WEIGHTS.FAR_FROM_STORE,
        metadata: { distanceMeters: Math.round(distM) },
      });
      delta += WEIGHTS.FAR_FROM_STORE;
    } else if (
      input.capturedAt &&
      TRUSTED_SOURCES.includes(input.source) &&
      input.duplicateStrength === "none"
    ) {
      // Clean camera metadata: captured_at + trusted source + geo within range.
      // Exempted when a duplicate photo is detected — metadata quality doesn't
      // offset fraud risk when the photo itself has already been flagged.
      flags.push({
        type: "clean_metadata",
        severity: "low",
        message: "Camera metadata is clean — photo taken at store location via trusted source",
        scoreDelta: WEIGHTS.CLEAN_METADATA,
      });
      delta += WEIGHTS.CLEAN_METADATA;
    }
  }

  // ── Context / anomaly signals ─────────────────────────────────────────
  if (input.quantityAboveNorm) {
    flags.push({
      type: "quantity_above_norm",
      severity: "high",
      message: "Quantity exceeds 2× the average daily norm for this product at this store",
      scoreDelta: WEIGHTS.ABOVE_NORM_QUANTITY,
    });
    delta += WEIGHTS.ABOVE_NORM_QUANTITY;
  }

  if (input.frequentSender) {
    flags.push({
      type: "frequent_sender",
      severity: "medium",
      message: "Sender has created ≥5 write-off requests in the last 24 hours",
      scoreDelta: WEIGHTS.FREQUENT_SENDER,
    });
    delta += WEIGHTS.FREQUENT_SENDER;
  }

  if (
    input.writeoffType === "employee_deduction" &&
    input.repeatedDeductionEmployee
  ) {
    flags.push({
      type: "repeated_deduction_employee",
      severity: "high",
      message: "Same employee has been assigned deduction in ≥3 recent requests — possible targeting",
      scoreDelta: WEIGHTS.REPEATED_DEDUCTION_EMPLOYEE,
    });
    delta += WEIGHTS.REPEATED_DEDUCTION_EMPLOYEE;
  }

  const score = Math.max(0, Math.min(100, delta));
  return { score, level: scoreLevel(score), flags };
}

export { scoreLevel };
export type { FraudRisk, RiskFlag, RiskInput, RiskScoreResult };
