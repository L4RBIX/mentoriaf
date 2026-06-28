export type PhotoQuality = "clear" | "blurry" | "too_dark" | "suspicious";

export interface VisionAnalysis {
  ai_verdict: {
    provider: "gemini" | "local";
    product_verified: boolean;
    damage_verified: boolean;
    quantity_estimate?: number;
    quantity_confidence?: number;
    suspected_staging?: boolean;
    summary: string;
    flags: string[];
    error?: string;
  };
  detected_product: string;
  matches_selected_product: boolean;
  visible_damage: boolean;
  damage_type: string;
  estimated_quantity: number;
  photo_quality: PhotoQuality;
  matches_comment: boolean;
  suspicious_signs: string[];
  confidence: number;
  reviewer_hint: string;
}

export interface VisionContext {
  productName: string;
  quantity: number;
  unit: string;
  reason: string;
  comment: string;
  branch?: string;
  writeOffType?: string;
}

export type VisionResult =
  | ({ ok: true } & VisionAnalysis)
  | { ok: false; error: string; ai_verdict: VisionAnalysis["ai_verdict"] };
