import type { VisionContext } from "./vision.types";

export function buildVisionPrompt(ctx: VisionContext): string {
  return `You are an AI controller for a restaurant write-off anti-fraud system.

Analyze this image and the claimed request.

Selected product: ${ctx.productName}
Claimed quantity: ${ctx.quantity} ${ctx.unit}
Reason: ${ctx.reason}
Comment: ${ctx.comment}

Check:
1. What product is visible?
2. Does it match the selected product?
3. Is there visible damage, spoilage, deformation, dirt, or contamination?
4. Approximate quantity visible.
5. Does the image look real or suspicious/staged?
6. Does the comment match the photo?
7. What should the reviewer pay attention to?

Return ONLY valid JSON matching the provided schema. Do not include any explanation outside the JSON object.`;
}
