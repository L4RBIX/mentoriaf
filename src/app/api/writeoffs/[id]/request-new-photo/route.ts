export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/http";
import { logAudit } from "@/lib/audit";
import { isLocalBackendMode, requestLocalNewPhoto } from "@/lib/local-backend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    if (isLocalBackendMode()) {
      const row = await requestLocalNewPhoto(id);
      if (!row) return jsonError(404, "Write-off request not found");
      return jsonOk(row);
    }

    const supabase = getSupabaseAdmin();
    const body = (await request.json().catch(() => ({}))) as { actor_id?: string; comment?: string };
    const { data: row, error } = await supabase
      .from("writeoff_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) return jsonError(404, "Write-off request not found");
    await logAudit({
      requestId: id,
      actorId: body.actor_id ?? null,
      action: "new_photo_requested",
      metadata: { comment: body.comment ?? "Reviewer requested new camera proof" },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return jsonOk(row);
  } catch (err) {
    return handleApiError(err);
  }
}
