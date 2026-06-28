export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/http";
import { verifyWriteOffPhoto } from "@/backend/vision";
import { env } from "@/lib/env";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Dev-only direct test for the Gemini vision pipeline. Returns 404 in production. */
export async function POST(request: NextRequest): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return jsonError(404, "Not found");
  }

  try {
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) {
      return jsonError(400, "Multipart field 'photo' (File) is required");
    }

    const rawMime = file.type || "image/jpeg";
    const mimeType = ACCEPTED.has(rawMime) ? rawMime : "image/jpeg";

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) return jsonError(400, "Empty photo file");
    if (buffer.length > 8 * 1024 * 1024) return jsonError(413, "Photo must be ≤ 8MB");

    const startedAt = Date.now();
    const verdict = await verifyWriteOffPhoto({
      image: buffer,
      mimeType,
      selectedProduct: (form.get("product") as string | null) ?? "Unknown product",
      quantity: Number((form.get("quantity") as string | null) ?? "1"),
      unit: (form.get("unit") as string | null) ?? "pcs",
      reason: (form.get("reason") as string | null) ?? "test",
      comment: (form.get("comment") as string | null) ?? "Vision pipeline direct test",
      branch: (form.get("branch") as string | null) ?? "Test Branch",
      writeOffType: (form.get("writeoff_type") as string | null) ?? "no_deduction",
    });
    const elapsedMs = Date.now() - startedAt;

    return jsonOk({
      elapsedMs,
      model: env.geminiModel(),
      timeoutMs: env.visionTimeoutMs(),
      mimeType,
      imageBytes: buffer.length,
      provider: verdict.provider,
      product_verified: verdict.product_verified,
      damage_verified: verdict.damage_verified,
      quantity_estimate: verdict.quantity_estimate,
      quantity_confidence: verdict.quantity_confidence,
      suspected_staging: verdict.suspected_staging,
      summary: verdict.summary,
      flags: verdict.flags,
      error: verdict.error,
      error_detail: verdict.error_detail,
      _meta: {
        mimeType,
        imageBytes: buffer.length,
        detectedMime: rawMime,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(500, message);
  }
}
