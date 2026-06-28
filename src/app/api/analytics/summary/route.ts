export const runtime = "nodejs";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonOk, handleApiError } from "@/lib/http";
import { isLocalBackendMode, getLocalAnalytics } from "@/lib/local-backend";

export async function GET(): Promise<Response> {
  try {
    if (isLocalBackendMode()) {
      return jsonOk(await getLocalAnalytics());
    }

    const supabase = getSupabaseAdmin();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    type TodayRow = {
      id: string;
      status: string;
      fraud_risk: string;
      quantity: number;
      store_id: string;
      product_id: string;
      products: { estimated_price: number; name: string } | null;
      stores: { name: string } | null;
    };

    // Fetch today's requests with product for price info.
    const { data: todayRows } = await supabase
      .from("writeoff_requests")
      .select("id, status, fraud_risk, quantity, store_id, product_id, products(estimated_price, name), stores(name)")
      .gte("created_at", todayIso);

    const rows = (todayRows ?? []) as unknown as TodayRow[];

    const totalWriteoffsToday = rows.length;
    let totalValueToday = 0;
    let preventedLossToday = 0;
    let highRiskCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    const storeValueMap = new Map<string, { name: string; qty: number; value: number; count: number }>();
    const productValueMap = new Map<string, { name: string; qty: number; value: number; count: number }>();

    for (const r of rows) {
      const price = r.products?.estimated_price ?? 0;
      const storeName = r.stores?.name ?? "Unknown";
      const productName = r.products?.name ?? "Unknown";
      const value = r.quantity * price;

      if (r.status === "approved") {
        totalValueToday += value;
        approvedCount++;
        const sv = storeValueMap.get(r.store_id) ?? { name: storeName, qty: 0, value: 0, count: 0 };
        sv.qty += r.quantity; sv.value += value; sv.count++;
        storeValueMap.set(r.store_id, sv);
        const pv = productValueMap.get(r.product_id) ?? { name: productName, qty: 0, value: 0, count: 0 };
        pv.qty += r.quantity; pv.value += value; pv.count++;
        productValueMap.set(r.product_id, pv);
      }

      if (r.status === "rejected" && r.fraud_risk === "high") {
        preventedLossToday += value;
      }
      if (r.status === "rejected") rejectedCount++;
      if (r.fraud_risk === "high" && r.status === "pending") highRiskCount++;
    }

    // Pending count.
    const { count: pendingCount } = await supabase
      .from("writeoff_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    type IntegrityRow = { store_id: string; status: string; fraud_risk: string; stores: { name: string } | null };
    // Store integrity index (all-time).
    const { data: allRows } = await supabase
      .from("writeoff_requests")
      .select("store_id, status, fraud_risk, stores(name)");

    const integrityMap = new Map<string, { name: string; total: number; highRisk: number; rejected: number }>();
    for (const r of (allRows ?? []) as unknown as IntegrityRow[]) {
      const name = r.stores?.name ?? "Unknown";
      const entry = integrityMap.get(r.store_id) ?? { name, total: 0, highRisk: 0, rejected: 0 };
      entry.total++;
      if (r.fraud_risk === "high") entry.highRisk++;
      if (r.status === "rejected") entry.rejected++;
      integrityMap.set(r.store_id, entry);
    }

    const storeIntegrityIndex = [...integrityMap.entries()].map(([store_id, s]) => ({
      store_id,
      store_name: s.name,
      score: Math.round(100 * (1 - (s.total > 0 ? s.highRisk / s.total : 0))),
      high_risk_ratio: s.total > 0 ? s.highRisk / s.total : 0,
      rejection_ratio: s.total > 0 ? s.rejected / s.total : 0,
    }));

    const top_stores_by_loss = [...storeValueMap.entries()]
      .map(([store_id, s]) => ({ store_id, store_name: s.name, total_quantity: s.qty, total_value: s.value, request_count: s.count }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5);

    const top_products_by_loss = [...productValueMap.entries()]
      .map(([product_id, p]) => ({ product_id, product_name: p.name, total_quantity: p.qty, total_value: p.value, request_count: p.count }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5);

    return jsonOk({
      total_writeoffs_today: totalWriteoffsToday,
      total_value_today: totalValueToday,
      prevented_loss_today: preventedLossToday,
      high_risk_count: highRiskCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      pending_count: pendingCount ?? 0,
      top_stores_by_loss,
      top_products_by_loss,
      store_integrity_index: storeIntegrityIndex,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
