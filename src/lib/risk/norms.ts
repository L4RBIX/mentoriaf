import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const NORM_STALE_MS = 24 * 60 * 60 * 1000; // recompute every 24 hours

export interface NormRecord {
  avg_daily_quantity: number;
  avg_daily_value: number;
  request_count: number;
}

export async function getOrComputeNorm(
  storeId: string,
  productId: string
): Promise<NormRecord | null> {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("writeoff_norms")
    .select("*")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .single();

  const isStale =
    !existing?.last_calculated_at ||
    Date.now() - new Date(existing.last_calculated_at).getTime() > NORM_STALE_MS;

  if (existing && !isStale) {
    return {
      avg_daily_quantity: existing.avg_daily_quantity,
      avg_daily_value: existing.avg_daily_value,
      request_count: existing.request_count,
    };
  }

  // Compute from last 30 days of approved requests for this store+product.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  type NormRow = { quantity: number; created_at: string; products: { estimated_price: number } | null };
  const { data: rawRows } = await supabase
    .from("writeoff_requests")
    .select("quantity, created_at, products(estimated_price)")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .eq("status", "approved")
    .gte("created_at", since);

  const rows = (rawRows ?? []) as unknown as NormRow[];
  if (rows.length === 0) return null;

  const byDay = new Map<string, number>();
  const byDayValue = new Map<string, number>();

  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const price = r.products?.estimated_price ?? 0;
    byDay.set(day, (byDay.get(day) ?? 0) + r.quantity);
    byDayValue.set(day, (byDayValue.get(day) ?? 0) + r.quantity * price);
  }

  const days = byDay.size;
  const totalQty = [...byDay.values()].reduce((s, v) => s + v, 0);
  const totalVal = [...byDayValue.values()].reduce((s, v) => s + v, 0);
  const avgDailyQty = totalQty / days;
  const avgDailyVal = totalVal / days;

  const norm: NormRecord = {
    avg_daily_quantity: avgDailyQty,
    avg_daily_value: avgDailyVal,
    request_count: rows.length,
  };

  // Upsert (insert or update).
  await supabase.from("writeoff_norms").upsert(
    {
      store_id: storeId,
      product_id: productId,
      avg_daily_quantity: avgDailyQty,
      avg_daily_value: avgDailyVal,
      request_count: rows.length,
      last_calculated_at: new Date().toISOString(),
    },
    { onConflict: "store_id,product_id" }
  );

  return norm;
}
