export const runtime = "nodejs";

import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isLocalBackendMode, getLocalMeta } from "@/lib/local-backend";
import { visionHealth } from "@/backend/vision";

export async function GET(): Promise<Response> {
  const vision = visionHealth();
  if (isLocalBackendMode()) {
    await getLocalMeta();
    return Response.json({
      status: "ok",
      database: "local",
      iiko_mode: env.iikoMode(),
      ...vision,
      timestamp: new Date().toISOString(),
    });
  }

  let dbConnected = false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("stores").select("id").limit(1);
    dbConnected = !error;
  } catch {
    dbConnected = false;
  }

  return Response.json({
    status: "ok",
    database: dbConnected ? "connected" : "error",
    iiko_mode: env.iikoMode(),
    ...vision,
    timestamp: new Date().toISOString(),
  });
}
