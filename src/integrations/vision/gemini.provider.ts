import { GoogleGenAI } from "@google/genai";
import { buildVisionPrompt } from "./prompt";
import type { VisionAnalysis, VisionContext, VisionResult } from "./vision.types";
import { env } from "@/lib/env";
import { localVisionFallback } from "@/backend/vision";

const RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    detected_product: { type: "string" as const },
    matches_selected_product: { type: "boolean" as const },
    visible_damage: { type: "boolean" as const },
    damage_type: { type: "string" as const },
    estimated_quantity: { type: "number" as const },
    photo_quality: {
      type: "string" as const,
      enum: ["clear", "blurry", "too_dark", "suspicious"],
    },
    matches_comment: { type: "boolean" as const },
    suspicious_signs: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    confidence: { type: "number" as const },
    reviewer_hint: { type: "string" as const },
  },
  required: [
    "detected_product",
    "matches_selected_product",
    "visible_damage",
    "damage_type",
    "estimated_quantity",
    "photo_quality",
    "matches_comment",
    "suspicious_signs",
    "confidence",
    "reviewer_hint",
  ],
};

export async function analyzeWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
  ctx: VisionContext
): Promise<VisionResult> {
  const apiKey = env.geminiApiKey();
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not configured", ai_verdict: localVisionFallback() };

  const client = new GoogleGenAI({ apiKey });
  const model = env.geminiModel();
  const timeoutMs = env.visionTimeoutMs();

  const imageBase64 = imageBuffer.toString("base64");

  const timeoutPromise = new Promise<VisionResult>((resolve) =>
    setTimeout(
      () => resolve({ ok: false, error: `Vision analysis timed out after ${timeoutMs}ms`, ai_verdict: localVisionFallback("gemini_timeout", "gemini_timeout") }),
      timeoutMs
    )
  );

  const analysisPromise: Promise<VisionResult> = (async () => {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: buildVisionPrompt(ctx) },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });

      const text = response.text;
      if (!text) return { ok: false, error: "Empty response from Gemini", ai_verdict: localVisionFallback() };

      const parsed = JSON.parse(text) as VisionAnalysis;
      return {
        ok: true,
        ...parsed,
        ai_verdict: {
          provider: "gemini",
          product_verified: parsed.matches_selected_product,
          damage_verified: parsed.visible_damage,
          quantity_estimate: parsed.estimated_quantity,
          quantity_confidence: parsed.confidence,
          suspected_staging: parsed.photo_quality === "suspicious" || parsed.suspicious_signs.length > 0,
          summary: parsed.reviewer_hint,
          flags: parsed.suspicious_signs.length > 0
            ? parsed.suspicious_signs
            : [parsed.matches_selected_product ? "product_match" : "product_unverified"],
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown Gemini error";
      return { ok: false, error: message, ai_verdict: localVisionFallback() };
    }
  })();

  return Promise.race([analysisPromise, timeoutPromise]);
}
