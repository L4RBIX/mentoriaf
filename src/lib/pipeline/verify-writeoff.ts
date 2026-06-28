import "server-only";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { computeDHash, hammingDistance, duplicateMatchPercent, classifyDuplicate } from "@/lib/phash";
import { analyzeWriteoffPhoto } from "@/integrations/vision/vision.service";
import { calculateRiskScore } from "@/lib/risk/risk-engine";
import { getOrComputeNorm } from "@/lib/risk/norms";
import { isSenderFrequent, isRepeatedDeductionEmployee } from "@/lib/risk/anomaly";
import { logAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export type WriteoffRow = Database["public"]["Tables"]["writeoff_requests"]["Row"];

export interface VerificationResult {
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
  fraud_risk: "low" | "medium" | "high";
  risk_score: number;
  risk_flags: string[];
  reviewer_hint: string | null;
  ai_verdict: Record<string, unknown> | null;
}

export interface VerifyOptions {
  photoBuffer?: Buffer;
  isInitialCreate?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function runVerificationPipeline(
  request: WriteoffRow,
  options: VerifyOptions = {}
): Promise<VerificationResult> {
  const supabase = getSupabaseAdmin();

  // ── 1. Get image buffer ──────────────────────────────────────────────
  let photoBuffer = options.photoBuffer;
  if (!photoBuffer) {
    const { data: blob, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(request.photo_storage_path);
    if (error || !blob)
      throw new Error(`Failed to download photo: ${error?.message}`);
    photoBuffer = Buffer.from(await blob.arrayBuffer());
  }

  // ── 2. dHash ─────────────────────────────────────────────────────────
  const { hash, width, height } = await computeDHash(photoBuffer);

  // Remove stale fingerprints from a previous verify run, then insert fresh.
  await supabase
    .from("photo_fingerprints")
    .delete()
    .eq("request_id", request.id);

  await supabase.from("photo_fingerprints").insert({
    request_id: request.id,
    hash,
    hash_algorithm: "dhash",
    width,
    height,
  });

  if (options.isInitialCreate) {
    await logAudit({
      requestId: request.id,
      actorId: request.sender_id,
      action: "photo_uploaded",
      metadata: { hash, width, height },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  }

  // ── 3. Duplicate detection ───────────────────────────────────────────
  const { data: fingerprints } = await supabase
    .from("photo_fingerprints")
    .select("id, request_id, hash")
    .neq("request_id", request.id);

  let duplicateStrength: "strong" | "possible" | "none" = "none";
  let bestDistance = 64;
  let bestMatchRequestId: string | null = null;
  let bestMatchPercent = 0;

  if (fingerprints && fingerprints.length > 0) {
    for (const fp of fingerprints) {
      if (fp.hash.length !== hash.length) continue;
      const dist = hammingDistance(hash, fp.hash);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatchRequestId = fp.request_id;
        bestMatchPercent = duplicateMatchPercent(dist);
        duplicateStrength = classifyDuplicate(dist);
      }
    }
  }

  let duplicateRequestNumber: string | null = null;
  if (bestMatchRequestId) {
    const { data: dup } = await supabase
      .from("writeoff_requests")
      .select("request_number")
      .eq("id", bestMatchRequestId)
      .single();
    duplicateRequestNumber = dup?.request_number ?? null;
  }

  if (duplicateStrength !== "none") {
    await logAudit({
      requestId: request.id,
      action: "duplicate_detected",
      metadata: {
        strength: duplicateStrength,
        distance: bestDistance,
        matchPercent: bestMatchPercent,
        matchedRequestId: bestMatchRequestId,
        matchedRequestNumber: duplicateRequestNumber,
      },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  }

  // ── 4. Gemini Vision ─────────────────────────────────────────────────
  const productRes = await supabase
    .from("products")
    .select("name, unit")
    .eq("id", request.product_id)
    .single();
  const product = productRes.data;
  const storeRes = await supabase
    .from("stores")
    .select("name, latitude, longitude")
    .eq("id", request.store_id)
    .single();
  const store = storeRes.data;

  const visionResult = await analyzeWriteoffPhoto(
    photoBuffer,
    "image/jpeg",
    {
      productName: product?.name ?? "Unknown",
      quantity: request.quantity,
      unit: request.unit,
      reason: request.reason,
      comment: request.comment,
      branch: store?.name ?? "Unknown",
      writeOffType: request.writeoff_type,
    }
  );

  const visionOk = visionResult.ok;
  const aiVision = visionOk && "detected_product" in visionResult
    ? {
        matchesSelectedProduct: visionResult.matches_selected_product,
        visibleDamage: visionResult.visible_damage,
        estimatedQuantity: visionResult.estimated_quantity,
        photoQuality: visionResult.photo_quality as "clear" | "blurry" | "too_dark" | "suspicious",
        matchesComment: visionResult.matches_comment,
        confidence: visionResult.confidence,
        suspectedStaging: visionResult.ai_verdict.suspected_staging ?? false,
      }
    : null;

  if (visionOk) {
    await logAudit({
      requestId: request.id,
      action: "vision_analysis_completed",
      metadata: { model: env.geminiModel(), result: visionResult },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  }

  // ── 5. Context signals ───────────────────────────────────────────────
  const norm = await getOrComputeNorm(request.store_id, request.product_id);
  const quantityAboveNorm =
    norm !== null && request.quantity > 2 * norm.avg_daily_quantity;

  const frequentSender = await isSenderFrequent(request.sender_id);
  const repeatedDeductionEmployee = await isRepeatedDeductionEmployee(
    request.deduction_employee_id
  );

  // ── 6. Risk scoring ───────────────────────────────────────────────────
  const riskInput = {
    duplicateStrength,
    duplicateDistance: bestDistance < 64 ? bestDistance : undefined,
    duplicateMatchPercent: bestMatchPercent > 0 ? bestMatchPercent : undefined,
    duplicateRequestNumber: duplicateRequestNumber ?? undefined,
    visionAvailable: visionOk,
    aiVision,
    claimedQuantity: request.quantity,
    reason: request.reason,
    comment: request.comment,
    source: request.source,
    capturedAt: request.captured_at,
    captureLatitude: request.capture_latitude,
    captureLongitude: request.capture_longitude,
    writeoffType: request.writeoff_type,
    storeLat: store?.latitude ?? null,
    storeLon: store?.longitude ?? null,
    quantityAboveNorm,
    frequentSender,
    repeatedDeductionEmployee,
  };

  const { score, level, flags } = calculateRiskScore(riskInput);

  // ── 7. Persist risk events (replace previous) ─────────────────────────
  await supabase.from("risk_events").delete().eq("request_id", request.id);

  if (flags.length > 0) {
    await supabase.from("risk_events").insert(
      flags.map((f) => ({
        request_id: request.id,
        type: f.type,
        severity: f.severity,
        message: f.message,
        score_delta: f.scoreDelta,
        metadata: (f.metadata ?? {}) as never,
      }))
    );
  }

  // ── 8. Update the request row ─────────────────────────────────────────
  const aiVerdictJson = visionResult.ai_verdict as unknown as Record<string, unknown>;

  const dupMatchPercent = duplicateStrength !== "none" ? bestMatchPercent : 0;

  await supabase
    .from("writeoff_requests")
    .update({
      risk_score: score,
      fraud_risk: level,
      duplicate_detected: duplicateStrength !== "none",
      duplicate_match_percent: dupMatchPercent,
      duplicate_request_id: duplicateStrength !== "none" ? bestMatchRequestId : null,
      ai_verdict: aiVerdictJson as never,
    })
    .eq("id", request.id);

  await logAudit({
    requestId: request.id,
    actorId: request.sender_id,
    action: "risk_score_calculated",
    metadata: { score, level, flagCount: flags.length },
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });

  await logAudit({
    requestId: request.id,
    actorId: request.sender_id,
    action: "request_verified",
    metadata: { duplicateStrength, visionOk, score, level },
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });

  // ── 9. Optional auto-reject on strong duplicate ───────────────────────
  if (duplicateStrength === "strong" && env.autoRejectStrongDuplicate()) {
    await supabase.from("writeoff_requests").update({
      status: "rejected",
      reviewer_comment: "Auto-rejected: strong duplicate photo detected",
      reviewed_at: new Date().toISOString(),
    }).eq("id", request.id);

    await logAudit({
      requestId: request.id,
      action: "request_rejected",
      metadata: { auto: true, reason: "strong_duplicate" },
    });
  }

  // ── 10. Build result ──────────────────────────────────────────────────
  const visionForResult =
    visionResult.ok && "detected_product" in visionResult ? visionResult : null;

  const reviewerHint =
    visionForResult?.reviewer_hint ??
    (duplicateStrength === "strong"
      ? `Reject or request a new live photo. This image appears to match request ${duplicateRequestNumber ?? bestMatchRequestId}.`
      : duplicateStrength === "possible"
      ? "Possible reuse of a previous photo — request new live photo."
      : null);

  return {
    request_id: request.id,
    duplicate_detected: duplicateStrength !== "none",
    duplicate_match_percent: dupMatchPercent,
    duplicate_request_id: duplicateStrength !== "none" ? bestMatchRequestId : null,
    duplicate_request_number: duplicateRequestNumber,
    detected_product: visionForResult?.detected_product ?? null,
    visible_damage: visionForResult?.visible_damage ?? null,
    damage_type: visionForResult?.damage_type ?? null,
    estimated_quantity: visionForResult?.estimated_quantity ?? null,
    photo_quality: visionForResult?.photo_quality ?? null,
    matches_selected_product: visionForResult?.matches_selected_product ?? null,
    matches_comment: visionForResult?.matches_comment ?? null,
    fraud_risk: level,
    risk_score: score,
    risk_flags: flags.map((f) => f.message),
    reviewer_hint: reviewerHint,
    ai_verdict: aiVerdictJson,
  };
}
