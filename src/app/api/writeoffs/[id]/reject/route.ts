export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/http";
import { rejectSchema } from "@/lib/validation";
import { assertIsPending, assertNotSelfReview } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { isLocalBackendMode, rejectLocalWriteoff } from "@/lib/local-backend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await request.json() as unknown;
    if (isLocalBackendMode()) {
      const localBody = body as { reviewer_id?: string; reviewer_comment?: string };
      if (!localBody.reviewer_id || !localBody.reviewer_comment) {
        return jsonError(400, "reviewer_id and reviewer_comment are required");
      }
      const row = await rejectLocalWriteoff(id, localBody.reviewer_id, localBody.reviewer_comment);
      if (!row) return jsonError(404, "Write-off request not found");
      return jsonOk(row);
    }

    const parsed = rejectSchema.safeParse(body);
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

    await supabase.from("writeoff_requests").update({
      status: "rejected",
      reviewer_id,
      reviewer_comment,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);

    await logAudit({
      requestId: id,
      actorId: reviewer_id,
      action: "request_rejected",
      metadata: { reviewer_comment },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const { data: finalRow } = await supabase.from("writeoff_requests").select("*").eq("id", id).single();
    return jsonOk(finalRow);
  } catch (err) {
    return handleApiError(err);
  }
}
