// All vision calls in PHYLAX go through the normalized backend provider.
// On ANY error or timeout the pipeline continues without hard-failing.
import { verifyWriteOffPhoto, visionHealth } from "@/backend/vision";
import type { VisionContext, VisionResult } from "./vision.types";

export type { VisionContext, VisionResult };

export function isVisionConfigured(): boolean {
  return visionHealth().vision_status === "ready";
}

export async function analyzeWriteoffPhoto(
  imageBuffer: Buffer,
  mimeType: string,
  ctx: VisionContext
): Promise<VisionResult> {
  const aiVerdict = await verifyWriteOffPhoto({
    image: imageBuffer,
    mimeType,
    selectedProduct: ctx.productName,
    quantity: ctx.quantity,
    unit: ctx.unit,
    reason: ctx.reason,
    comment: ctx.comment,
    branch: ctx.branch ?? "Unknown branch",
    writeOffType: ctx.writeOffType ?? "unknown",
  });

  if (aiVerdict.provider === "local") {
    return {
      ok: false,
      error: aiVerdict.error ?? "vision_unavailable",
      ai_verdict: aiVerdict,
    };
  }

  return {
    ok: true,
    ai_verdict: aiVerdict,
    detected_product: aiVerdict.product_verified ? ctx.productName : "unknown",
    matches_selected_product: aiVerdict.product_verified,
    visible_damage: aiVerdict.damage_verified,
    damage_type: aiVerdict.damage_verified ? "visible_quality_issue" : "unclear",
    estimated_quantity: aiVerdict.quantity_estimate ?? 0,
    photo_quality: aiVerdict.suspected_staging ? "suspicious" : "clear",
    matches_comment: aiVerdict.damage_verified,
    suspicious_signs: aiVerdict.flags.filter((flag) => flag.includes("suspicious") || flag.includes("staged")),
    confidence: aiVerdict.quantity_confidence ?? 0,
    reviewer_hint: aiVerdict.summary,
  };
}
