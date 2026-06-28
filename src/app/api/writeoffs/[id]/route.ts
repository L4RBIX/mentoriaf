export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError } from "@/lib/http";
import { isLocalBackendMode, getLocalWriteoff } from "@/lib/local-backend";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    if (isLocalBackendMode()) {
      const row = await getLocalWriteoff(id);
      if (!row) return jsonError(404, "Write-off request not found");
      return jsonOk(row);
    }

    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from("writeoff_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) return jsonError(404, "Write-off request not found");

    const [storeRes, productRes, senderRes, riskEventsRes, auditLogsRes] =
      await Promise.all([
        supabase.from("stores").select("id, name, address").eq("id", row.store_id).single(),
        supabase.from("products").select("id, name, unit, category, estimated_price").eq("id", row.product_id).single(),
        supabase.from("users").select("id, name, role").eq("id", row.sender_id).single(),
        supabase.from("risk_events").select("id, type, severity, message, score_delta, metadata, created_at").eq("request_id", id).order("created_at"),
        supabase.from("audit_logs").select("id, actor_id, action, metadata, ip_address, user_agent, created_at").eq("request_id", id).order("created_at"),
      ]);

    let reviewer = null;
    if (row.reviewer_id) {
      const { data } = await supabase.from("users").select("id, name").eq("id", row.reviewer_id).single();
      reviewer = data;
    }

    let deductionEmployee = null;
    if (row.deduction_employee_id) {
      const { data } = await supabase.from("employees").select("id, full_name, position").eq("id", row.deduction_employee_id).single();
      deductionEmployee = data;
    }

    return jsonOk({
      ...row,
      store: storeRes.data ?? null,
      product: productRes.data ?? null,
      sender: senderRes.data ?? null,
      deduction_employee: deductionEmployee,
      reviewer,
      risk_events: riskEventsRes.data ?? [],
      audit_logs: auditLogsRes.data ?? [],
    });
  } catch (err) {
    return handleApiError(err);
  }
}
