import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env, isGeminiVisionReady } from "@/lib/env";

export type VisionProvider = "gemini" | "local";

export interface AiVerdict {
  provider: VisionProvider;
  product_verified: boolean;
  damage_verified: boolean;
  quantity_estimate?: number;
  quantity_confidence?: number;
  suspected_staging?: boolean;
  summary: string;
  flags: string[];
  error?: string;
  /** Short safe error code only. Never raw provider errors or secrets. */
  error_detail?: string;
}

export interface VerifyWriteOffPhotoInput {
  image: Buffer | Uint8Array | string;
  mimeType?: string;
  selectedProduct: string;
  quantity: number;
  unit: string;
  reason: string;
  comment: string;
  branch: string;
  writeOffType: string;
}

interface GeminiResponse {
  text?: string;
}

type GeminiGenerateRequest = Parameters<GoogleGenAI["models"]["generateContent"]>[0];
type GenerateContent = (request: GeminiGenerateRequest) => Promise<GeminiResponse>;

interface ProviderOptions {
  generateContent?: GenerateContent;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Supported mime types
// ---------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ---------------------------------------------------------------------------
// Zod schema — accept null for optional numeric/boolean fields because Gemini
// structured output often returns null instead of omitting optional fields.
// ---------------------------------------------------------------------------

const nullableNumber = (schema: z.ZodNumber) =>
  z.union([schema, z.null()]).optional().transform((v) => (v == null ? undefined : v));

const aiVerdictSchema = z.object({
  product_verified: z.boolean(),
  damage_verified: z.boolean(),
  quantity_estimate: nullableNumber(z.number().finite().nonnegative()),
  quantity_confidence: nullableNumber(z.number().finite().min(0).max(1)),
  suspected_staging: z
    .union([z.boolean(), z.null()])
    .optional()
    .transform((v) => v ?? false),
  summary: z.string().min(1).max(500),
  flags: z.array(z.string().min(1).max(200)).max(20),
});

// ---------------------------------------------------------------------------
// Gemini response schema (inline data schema passed to the API)
// ---------------------------------------------------------------------------

const GEMINI_RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    product_verified: { type: "boolean" as const },
    damage_verified: { type: "boolean" as const },
    quantity_estimate: { type: "number" as const },
    quantity_confidence: { type: "number" as const },
    suspected_staging: { type: "boolean" as const },
    summary: { type: "string" as const },
    flags: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: ["product_verified", "damage_verified", "summary", "flags"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function localVisionFallback(error = "vision_unavailable", errorDetail?: string): AiVerdict {
  return {
    provider: "local",
    product_verified: false,
    damage_verified: false,
    suspected_staging: false,
    summary: "Vision unavailable. Duplicate/photo metadata checks still completed.",
    flags: ["vision_unavailable"],
    error,
    ...(errorDetail ? { error_detail: errorDetail } : {}),
  };
}

export function visionHealth(): {
  vision_provider: VisionProvider;
  vision_status: "ready" | "disabled";
  gemini_configured: boolean;
} {
  const ready = isGeminiVisionReady();
  return {
    vision_provider: ready ? "gemini" : "local",
    vision_status: ready ? "ready" : "disabled",
    gemini_configured: Boolean(env.geminiApiKey()),
  };
}

function imageToBase64(image: VerifyWriteOffPhotoInput["image"]): string {
  if (typeof image === "string") {
    // Strip data URL prefix ("data:image/jpeg;base64,...")
    return image.includes(",") ? (image.split(",").at(-1) ?? image) : image;
  }
  return Buffer.from(image).toString("base64");
}

function imageByteLength(image: VerifyWriteOffPhotoInput["image"]): number {
  if (Buffer.isBuffer(image)) return image.length;
  if (image instanceof Uint8Array) return image.byteLength;
  return image.length; // string — approximate
}

function stripMarkdownJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Classify a Gemini error into a short safe code for logging and error_detail.
 * Never returns anything that could expose secrets.
 */
function classifyGeminiError(err: unknown): string {
  if (!(err instanceof Error)) return "gemini_unknown";
  const msg = err.message;
  if (msg === "vision_timeout") return "gemini_timeout";
  // JSON parse or Zod validation failures
  if (
    err.name === "SyntaxError" ||
    err.name === "ZodError" ||
    msg.toLowerCase().includes("json") ||
    msg.toLowerCase().includes("parse")
  ) {
    return "gemini_invalid_json";
  }
  // HTTP status from API errors — check common error shapes
  const errObj = err as unknown as Record<string, unknown>;
  const httpStatus = errObj.status ?? errObj.httpStatusCode ?? errObj.code;
  const statusStr = String(httpStatus ?? "");
  if (statusStr === "429" || msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return "gemini_api_error_429";
  }
  if (statusStr === "400" || msg.includes("400")) return "gemini_api_error_400";
  if (statusStr === "403" || msg.includes("403")) return "gemini_api_error_403";
  if (statusStr === "500" || msg.includes("500")) return "gemini_api_error_500";
  if (msg.toLowerCase().includes("mime") || msg.toLowerCase().includes("unsupported")) {
    return "unsupported_mime";
  }
  return "gemini_api_error";
}

/**
 * Dev-only logging — never runs in production, never logs the API key or full image.
 */
function logVisionError(
  err: unknown,
  input: VerifyWriteOffPhotoInput,
  timeoutMs: number,
  errorCode: string,
  elapsedMs: number,
): void {
  if (process.env.NODE_ENV === "production") return;
  const name = err instanceof Error ? err.name : typeof err;
  const message = err instanceof Error ? err.message : String(err);
  const errObj2 = err as unknown as Record<string, unknown>;
  const status = errObj2?.status ?? errObj2?.httpStatusCode ?? "n/a";
  console.error("[PHYLAX/vision] Gemini error →", errorCode, {
    model: env.geminiModel(),
    mimeType: input.mimeType ?? "image/jpeg",
    imageBytes: imageByteLength(input.image),
    timeoutMs,
    elapsedMs,
    errorName: name,
    errorMessage: message,
    errorStatus: status,
    jsonParseAttempt: errorCode === "gemini_invalid_json",
  });
}

export function parseGeminiVerdict(text: string): AiVerdict {
  const raw = JSON.parse(stripMarkdownJson(text)) as unknown;
  const verdict = aiVerdictSchema.parse(raw);
  return {
    provider: "gemini",
    product_verified: verdict.product_verified,
    damage_verified: verdict.damage_verified,
    quantity_estimate: verdict.quantity_estimate,
    quantity_confidence: verdict.quantity_confidence,
    suspected_staging: verdict.suspected_staging ?? false,
    summary: verdict.summary,
    flags: verdict.flags,
  };
}

function buildPrompt(input: VerifyWriteOffPhotoInput): string {
  return `Verify a restaurant write-off photo.

Selected product: ${input.selectedProduct}
Claimed quantity: ${input.quantity} ${input.unit}
Branch: ${input.branch}
Write-off type: ${input.writeOffType}
Reason: ${input.reason}
Comment: ${input.comment}

Check:
- Does the photo show the selected product?
- Does the visible condition match the write-off reason/comment?
- Is there visible damage, spoilage, floor contact, or quality issue?
- Estimate visible quantity if possible.
- Is the photo suspicious, staged, screenshot-like, or unrelated?
- Give short flags only.

Return only JSON with this exact shape:
{
  "product_verified": true,
  "damage_verified": false,
  "quantity_estimate": 40,
  "quantity_confidence": 0.65,
  "suspected_staging": false,
  "summary": "Photo appears to show tomatoes, but visible damage is unclear.",
  "flags": ["product_match", "damage_unclear"]
}

Rules:
- Be conservative.
- Do not automatically reject.
- AI ranks. Human decides.
- If uncertain, set damage_verified=false and add "manual_review".
- Keep summary under 200 characters.
- Omit quantity_estimate if not visible; do not return null.`;
}

async function defaultGenerateContent(request: GeminiGenerateRequest): Promise<GeminiResponse> {
  const apiKey = env.geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const client = new GoogleGenAI({ apiKey });
  return client.models.generateContent(request);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("vision_timeout")), timeoutMs);
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function verifyWriteOffPhoto(
  input: VerifyWriteOffPhotoInput,
  options: ProviderOptions = {},
): Promise<AiVerdict> {
  if (!isGeminiVisionReady() && !options.generateContent) {
    return localVisionFallback("vision_unavailable");
  }

  // Validate mime type early — Gemini only supports jpeg/png/webp
  const mimeType = input.mimeType ?? "image/jpeg";
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      console.warn("[PHYLAX/vision] unsupported mime type:", mimeType, "— falling back");
    }
    return localVisionFallback("unsupported_mime", `unsupported_mime: ${mimeType}`);
  }

  const generateContent = options.generateContent ?? defaultGenerateContent;
  const timeoutMs = options.timeoutMs ?? env.visionTimeoutMs();
  const startedAt = Date.now();

  try {
    const response = await withTimeout(
      generateContent({
        model: env.geminiModel(),
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(input) },
              {
                inlineData: {
                  mimeType,
                  data: imageToBase64(input.image),
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      }),
      timeoutMs,
    );

    if (!response.text) {
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) {
        console.warn("[PHYLAX/vision] Gemini returned empty text response", {
          model: env.geminiModel(),
          mimeType,
        });
      }
      return localVisionFallback("gemini_empty_response", "gemini_empty_response");
    }

    return parseGeminiVerdict(response.text);
  } catch (err) {
    const errorCode = classifyGeminiError(err);
    logVisionError(err, input, timeoutMs, errorCode, Date.now() - startedAt);
    return localVisionFallback(errorCode, errorCode);
  }
}
