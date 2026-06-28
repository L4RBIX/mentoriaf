export const runtime = "nodejs";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { jsonOk, jsonError, handleApiError } from "@/lib/http";
import {
  approveLocalWriteoff,
  createLocalWriteoff,
  getLocalAnalytics,
  isLocalBackendMode,
  rejectLocalWriteoff,
  resetLocalDemo,
} from "@/lib/local-backend";

export async function POST(): Promise<Response> {
  try {
    if (!isLocalBackendMode()) {
      return jsonError(409, "Run npm run demo:scenario for the Supabase-backed scenario");
    }

    await resetLocalDemo();
    const assets = join(process.cwd(), "demo-assets");

    const duplicate = await createLocalWriteoff({
      sender_id: "local-sender",
      store_id: "local-store-3",
      product_id: "local-product-tomatoes",
      quantity: 40,
      reason: "Tomatoes spoiled in storage",
      writeoff_type: "no_deduction",
      comment: "Tomatoes bad today",
      captured_at: new Date().toISOString(),
      latitude: 51.1694,
      longitude: 71.4491,
      source: "pwa",
    }, await readFile(join(assets, "tomatoes_reused.jpg"))) as { id: string };

    const rejected = await rejectLocalWriteoff(
      duplicate.id,
      "local-reviewer-control",
      "Rejected: duplicate photo detected. Request a new live photo."
    );

    const normal = await createLocalWriteoff({
      sender_id: "local-sender",
      store_id: "local-store-1",
      product_id: "local-product-patty",
      quantity: 3,
      reason: "Fell on floor",
      writeoff_type: "employee_deduction",
      deduction_employee_id: "local-sender",
      comment: "Three patties fell during prep rush. Floor contaminated.",
      captured_at: new Date().toISOString(),
      latitude: 43.222,
      longitude: 76.8512,
      source: "pwa",
    }, await readFile(join(assets, "patty.jpg"))) as { id: string };

    const approved = await approveLocalWriteoff(
      normal.id,
      "local-reviewer-supervisor",
      "Confirmed floor contamination. Approved."
    );

    return jsonOk({
      duplicate,
      rejected,
      normal,
      approved,
      analytics: await getLocalAnalytics(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
