export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError } from "@/lib/http";
import { getLocalWriteoff, isLocalBackendMode } from "@/lib/local-backend";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    if (isLocalBackendMode()) {
      const row = await getLocalWriteoff(id) as {
        iiko_status?: string;
        iiko_document_id?: string | null;
        iiko_synced_at?: string | null;
        store?: { name?: string } | null;
      } | null;
      if (!row) return jsonError(404, "Write-off request not found");
      return jsonOk({
        mode: "sandbox",
        status: row.iiko_status ?? "pending",
        document_id: row.iiko_document_id ?? null,
        warehouse: row.store?.name ?? null,
        document_type: "write-off act",
        synced_at: row.iiko_synced_at ?? null,
      });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("writeoff_requests")
      .select("iiko_status, iiko_document_id, iiko_synced_at, stores(name)")
      .eq("id", id)
      .single();

    if (error || !data) return jsonError(404, "Write-off request not found");
    const row = data as unknown as {
      iiko_status: string;
      iiko_document_id: string | null;
      iiko_synced_at: string | null;
      stores: { name: string } | null;
    };
    return jsonOk({
      mode: process.env.IIKO_MODE === "real" ? "production" : "sandbox",
      status: row.iiko_status,
      document_id: row.iiko_document_id,
      warehouse: row.stores?.name ?? null,
      document_type: "write-off act",
      synced_at: row.iiko_synced_at,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
