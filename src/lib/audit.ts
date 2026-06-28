import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface AuditEntry {
  requestId?: string | null;
  actorId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Inserts a row into audit_logs. Never throws — logs to console on failure.
// Audit logs are append-only and must never be deleted by application code.
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("audit_logs").insert({
      request_id: entry.requestId ?? null,
      actor_id: entry.actorId ?? null,
      action: entry.action,
      metadata: (entry.metadata ?? {}) as never,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
    if (error) console.error("[audit] insert failed:", error.message);
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
}
