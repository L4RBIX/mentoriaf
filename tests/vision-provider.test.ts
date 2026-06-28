import { describe, expect, it, vi, afterEach } from "vitest";
import {
  parseGeminiVerdict,
  verifyWriteOffPhoto,
  visionHealth,
} from "@/backend/vision";

const input = {
  image: Buffer.from("fake-image"),
  mimeType: "image/jpeg",
  selectedProduct: "Tomatoes",
  quantity: 40,
  unit: "kg",
  reason: "Delivery damage",
  comment: "Tomatoes damaged on delivery",
  branch: "Bahandi Branch #3",
  writeOffType: "no_deduction",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Gemini vision provider", () => {
  it("parses normal Gemini JSON into normalized verdict", () => {
    const verdict = parseGeminiVerdict(JSON.stringify({
      product_verified: true,
      damage_verified: false,
      quantity_estimate: 40,
      quantity_confidence: 0.65,
      suspected_staging: false,
      summary: "Photo appears to show tomatoes, but visible damage is unclear.",
      flags: ["product_match", "damage_unclear"],
    }));

    expect(verdict.provider).toBe("gemini");
    expect(verdict.product_verified).toBe(true);
    expect(verdict.damage_verified).toBe(false);
    expect(verdict.quantity_estimate).toBe(40);
    expect(verdict.flags).toContain("damage_unclear");
  });

  it("falls back on invalid JSON", async () => {
    const verdict = await verifyWriteOffPhoto(input, {
      generateContent: async () => ({ text: "not json" }),
    });

    expect(verdict.provider).toBe("local");
    expect(verdict.error).toBe("gemini_invalid_json");
    expect(verdict.flags).toContain("vision_unavailable");
  });

  it("falls back on timeout", async () => {
    const verdict = await verifyWriteOffPhoto(input, {
      timeoutMs: 1,
      generateContent: () => new Promise(() => undefined),
    });

    expect(verdict.provider).toBe("local");
    expect(verdict.error).toBe("gemini_timeout");
  });

  it("accepts nullable optional fields from Gemini", () => {
    const verdict = parseGeminiVerdict(JSON.stringify({
      product_verified: true,
      damage_verified: false,
      quantity_estimate: null,
      quantity_confidence: null,
      suspected_staging: null,
      summary: "Photo shows the product.",
      flags: ["product_match"],
    }));

    expect(verdict.provider).toBe("gemini");
    expect(verdict.quantity_estimate).toBeUndefined();
    expect(verdict.quantity_confidence).toBeUndefined();
    expect(verdict.suspected_staging).toBe(false);
  });

  it("falls back when GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("VISION_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "");

    const verdict = await verifyWriteOffPhoto(input);
    const health = visionHealth();

    expect(verdict.provider).toBe("local");
    expect(health.gemini_configured).toBe(false);
    expect(health.vision_provider).toBe("local");
    expect(health.vision_status).toBe("disabled");
  });

  it("reports ready health when Gemini key is configured", () => {
    vi.stubEnv("VISION_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    expect(visionHealth()).toEqual({
      vision_provider: "gemini",
      vision_status: "ready",
      gemini_configured: true,
    });
  });
});
