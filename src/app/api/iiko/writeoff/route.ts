export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError } from "@/lib/http";
import { createWriteOffAct } from "@/integrations/iiko/iiko.service";
import { logAudit } from "@/lib/audit";
import { isLocalBackendMode, approveLocalWriteoff, getLocalWriteoff } from "@/lib/local-backend";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json() as { request_id?: string };
    const requestId = body.request_id;
    if (!requestId) return jsonError(400, "request_id is required");

    if (isLocalBackendMode()) {
      const existing = await getLocalWriteoff(requestId);
      if (!existing) return jsonError(404, "Write-off request not found");
      const row = await approveLocalWriteoff(requestId, "local-reviewer-supervisor", "iiko sync requested");
      return jsonOk(row);
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from("writeoff_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !row) return jsonError(404, "Write-off request not found");
    if (row.status !== "approved") {
      return jsonError(409, "Only approved requests can be synced with iiko");
    }

    const [storeRes, productRes, senderRes] = await Promise.all([
      supabase.from("stores").select("name, iiko_organization_id, iiko_warehouse_id").eq("id", row.store_id).single(),
      supabase.from("products").select("name, unit, estimated_price, iiko_product_id").eq("id", row.product_id).single(),
      supabase.from("users").select("name").eq("id", row.sender_id).single(),
    ]);

    const externalNumber = row.iiko_external_number ?? `FORGED-WO-${row.request_number}`;

    await logAudit({ requestId, action: "iiko_sync_started", metadata: { external_number: externalNumber } });

    const result = await createWriteOffAct({
      requestId,
      externalNumber,
      date: row.reviewed_at ?? new Date().toISOString(),
      storeId: row.store_id,
      storeName: storeRes.data?.name ?? "Unknown",
      iikoOrganizationId: storeRes.data?.iiko_organization_id,
      warehouseId: storeRes.data?.iiko_warehouse_id,
      reason: row.reason,
      comment: row.comment,
      createdBy: senderRes.data?.name ?? "Unknown",
      approvedBy: row.reviewer_id ?? "System",
      deductionType: row.writeoff_type,
      items: [{
        productId: row.product_id,
        iikoProductId: productRes.data?.iiko_product_id ?? null,
        productName: productRes.data?.name ?? "Unknown",
        amount: row.quantity,
        unit: row.unit,
        estimatedPrice: productRes.data?.estimated_price ?? 0,
      }],
    });

    await supabase.from("writeoff_requests").update({
      iiko_status: result.status === "synced" ? "synced" : "failed",
      iiko_document_id: result.iikoDocumentId,
      iiko_external_number: result.externalNumber,
      iiko_payload: result.payload as never,
      iiko_response: result.response as never,
      iiko_error: result.error ?? null,
      iiko_synced_at: result.status === "synced" ? new Date().toISOString() : null,
    }).eq("id", requestId);

    await logAudit({
      requestId,
      action: result.status === "synced" ? "iiko_sync_success" : "iiko_sync_failed",
      metadata: { iiko_document_id: result.iikoDocumentId, mode: result.mode },
    });

    return jsonOk({
      status: result.status,
      mode: result.mode,
      iiko_document_id: result.iikoDocumentId,
      external_number: result.externalNumber,
      payload: result.payload,
      response: result.response,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
