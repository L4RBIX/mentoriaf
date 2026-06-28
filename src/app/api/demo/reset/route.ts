export const runtime = "nodejs";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError } from "@/lib/http";
import { isLocalBackendMode, resetLocalDemo } from "@/lib/local-backend";

export async function POST(): Promise<Response> {
  try {
    if (isLocalBackendMode()) return jsonOk(await resetLocalDemo());

    const supabase = getSupabaseAdmin();
    const { data: rows, error: selectError } = await supabase
      .from("writeoff_requests")
      .select("id, request_number");

    if (selectError) return jsonError(500, selectError.message);
    const seedNumbers = new Set(["WO-1844", "WO-1845", "WO-1846", "WO-1847", "WO-1850"]);
    const ids = (rows ?? []).filter((row) => !seedNumbers.has(row.request_number)).map((row) => row.id);

    if (ids.length > 0) {
      await supabase.from("risk_events").delete().in("request_id", ids);
      await supabase.from("audit_logs").delete().in("request_id", ids);
      await supabase.from("photo_fingerprints").delete().in("request_id", ids);
      await supabase.from("iiko_sync_logs").delete().in("request_id", ids);
      const { error: deleteError } = await supabase.from("writeoff_requests").delete().in("id", ids);
      if (deleteError) return jsonError(500, deleteError.message);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
