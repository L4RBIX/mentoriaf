export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/http";
import { approveSchema } from "@/lib/validation";
import { assertIsPending, assertNotSelfReview } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { createWriteOffAct } from "@/integrations/iiko/iiko.service";
import { isLocalBackendMode, approveLocalWriteoff } from "@/lib/local-backend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await request.json() as unknown;
    if (isLocalBackendMode()) {
      const localBody = body as { reviewer_id?: string; reviewer_comment?: string };
      if (!localBody.reviewer_id) return jsonError(400, "reviewer_id is required");
      const row = await approveLocalWriteoff(id, localBody.reviewer_id, localBody.reviewer_comment);
      if (!row) return jsonError(404, "Write-off request not found");
      return jsonOk(row);
    }

    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) return jsonError(400, "Validation failed", parsed.error.issues);
    const { reviewer_id, reviewer_comment } = parsed.data;

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from("writeoff_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) return jsonError(404, "Write-off request not found");

    assertIsPending(row);
    assertNotSelfReview(row, reviewer_id);

    const reviewedAt = new Date().toISOString();
    await supabase.from("writeoff_requests").update({
      status: "approved",
      reviewer_id,
      reviewer_comment: reviewer_comment ?? null,
      reviewed_at: reviewedAt,
    }).eq("id", id);

    await logAudit({
      requestId: id,
      actorId: reviewer_id,
      action: "request_approved",
      metadata: { reviewer_comment: reviewer_comment ?? null },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    // ── iiko integration ─────────────────────────────────────────────
    const [storeRes, productRes, senderRes, reviewerRes] = await Promise.all([
      supabase.from("stores").select("name, iiko_organization_id, iiko_warehouse_id").eq("id", row.store_id).single(),
      supabase.from("products").select("name, unit, estimated_price, iiko_product_id").eq("id", row.product_id).single(),
      supabase.from("users").select("name").eq("id", row.sender_id).single(),
      supabase.from("users").select("name").eq("id", reviewer_id).single(),
    ]);

    let deductionEmployeeName: string | null = null;
    if (row.deduction_employee_id) {
      const { data } = await supabase.from("employees").select("full_name").eq("id", row.deduction_employee_id).single();
      deductionEmployeeName = data?.full_name ?? null;
    }

    const externalNumber = `FORGED-WO-${row.request_number}`;

    await logAudit({
      requestId: id,
      actorId: reviewer_id,
      action: "iiko_sync_started",
      metadata: { external_number: externalNumber, mode: process.env.IIKO_MODE ?? "sandbox" },
    });

    const iikoResult = await createWriteOffAct({
      requestId: id,
      externalNumber,
      date: reviewedAt,
      storeId: row.store_id,
      storeName: storeRes.data?.name ?? "Unknown",
      iikoOrganizationId: storeRes.data?.iiko_organization_id,
      warehouseId: storeRes.data?.iiko_warehouse_id,
      reason: row.reason,
      comment: row.comment,
      createdBy: senderRes.data?.name ?? "Unknown",
      approvedBy: reviewerRes.data?.name ?? "Unknown",
      deductionType: row.writeoff_type,
      deductionEmployeeName,
      items: [
        {
          productId: row.product_id,
          iikoProductId: productRes.data?.iiko_product_id ?? null,
          productName: productRes.data?.name ?? "Unknown",
          amount: row.quantity,
          unit: row.unit,
          estimatedPrice: productRes.data?.estimated_price ?? 0,
        },
      ],
    });

    await supabase.from("writeoff_requests").update({
      iiko_status: iikoResult.status === "synced" ? "synced" : "failed",
      iiko_document_id: iikoResult.iikoDocumentId,
      iiko_external_number: iikoResult.externalNumber,
      iiko_payload: iikoResult.payload as never,
      iiko_response: iikoResult.response as never,
      iiko_error: iikoResult.error ?? null,
      iiko_synced_at: iikoResult.status === "synced" ? new Date().toISOString() : null,
    }).eq("id", id);

    await logAudit({
      requestId: id,
      actorId: reviewer_id,
      action: iikoResult.status === "synced" ? "iiko_sync_success" : "iiko_sync_failed",
      metadata: {
        iiko_document_id: iikoResult.iikoDocumentId,
        mode: iikoResult.mode,
        error: iikoResult.error,
      },
    });

    const { data: finalRow } = await supabase.from("writeoff_requests").select("*").eq("id", id).single();
    return jsonOk({ ...finalRow, iiko_sync: iikoResult });
  } catch (err) {
    return handleApiError(err);
  }
}
