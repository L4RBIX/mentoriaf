import "server-only";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sandboxCreateWriteOffAct } from "./providers/sandbox.provider";
import { realCreateWriteOffAct } from "./providers/iiko-server.provider";
import type { IikoCreateWriteoffInput, IikoSyncResult } from "./iiko.types";

export type { IikoCreateWriteoffInput, IikoSyncResult };

export async function createWriteOffAct(
  input: IikoCreateWriteoffInput
): Promise<IikoSyncResult> {
  const mode = env.iikoMode();
  const supabase = getSupabaseAdmin();

  let result: IikoSyncResult;
  try {
    result =
      mode === "real"
        ? await realCreateWriteOffAct(input)
        : await sandboxCreateWriteOffAct(input);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    result = {
      status: "failed",
      mode,
      iikoDocumentId: null,
      externalNumber: input.externalNumber,
      payload: null,
      response: null,
      error,
    };
  }

  // Always log to iiko_sync_logs (audit trail).
  await supabase.from("iiko_sync_logs").insert({
    request_id: input.requestId,
    mode,
    endpoint: `${env.iikoBaseUrl() ?? "sandbox"}/documents/import/writeOff`,
    request_payload: result.payload as never,
    response_payload: result.response as never,
    status: result.status === "synced" ? "success" : "failed",
    error: result.error ?? null,
  });

  return result;
}
