export const runtime = "nodejs";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, handleApiError } from "@/lib/http";
import { getLocalAuditLog, isLocalBackendMode } from "@/lib/local-backend";

export async function GET(): Promise<Response> {
  try {
    if (isLocalBackendMode()) return jsonOk(await getLocalAuditLog());

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, request_id, actor_id, action, metadata, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    return jsonOk(data ?? []);
  } catch (err) {
    return handleApiError(err);
  }
}
