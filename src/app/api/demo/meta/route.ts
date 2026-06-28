export const runtime = "nodejs";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, handleApiError } from "@/lib/http";
import { getLocalMeta, isLocalBackendMode } from "@/lib/local-backend";

export async function GET(): Promise<Response> {
  try {
    if (isLocalBackendMode()) return jsonOk(await getLocalMeta());

    const supabase = getSupabaseAdmin();
    const [stores, products, users] = await Promise.all([
      supabase.from("stores").select("id, name, latitude, longitude, iiko_warehouse_id").order("name"),
      supabase.from("products").select("id, name, unit, estimated_price").order("name"),
      supabase.from("users").select("id, name, role").order("name"),
    ]);

    return jsonOk({
      mode: "supabase",
      stores: stores.data ?? [],
      products: products.data ?? [],
      users: users.data ?? [],
    });
  } catch (err) {
    return handleApiError(err);
  }
}
