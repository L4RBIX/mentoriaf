export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/http";
import { runVerificationPipeline } from "@/lib/pipeline/verify-writeoff";
import { isLocalBackendMode, getLocalWriteoff } from "@/lib/local-backend";

export async function POST(
  request: NextRequest,
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

    const result = await runVerificationPipeline(row, {
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
