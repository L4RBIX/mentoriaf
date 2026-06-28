import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const FREQUENT_SENDER_THRESHOLD = 5;
const REPEATED_DEDUCTION_THRESHOLD = 3;

export async function countRecentRequestsBySender(
  senderId: string,
  windowMs = 24 * 60 * 60 * 1000
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await supabase
    .from("writeoff_requests")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", senderId)
    .gte("created_at", since);
  return count ?? 0;
}

export async function isSenderFrequent(senderId: string): Promise<boolean> {
  const count = await countRecentRequestsBySender(senderId);
  return count >= FREQUENT_SENDER_THRESHOLD;
}

// Count how many recent employee_deduction requests targeted the same employee.
export async function countRecentDeductionsForEmployee(
  deductionEmployeeId: string,
  windowMs = 7 * 24 * 60 * 60 * 1000
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await supabase
    .from("writeoff_requests")
    .select("*", { count: "exact", head: true })
    .eq("deduction_employee_id", deductionEmployeeId)
    .eq("writeoff_type", "employee_deduction")
    .gte("created_at", since);
  return count ?? 0;
}

export async function isRepeatedDeductionEmployee(
  deductionEmployeeId: string | null
): Promise<boolean> {
  if (!deductionEmployeeId) return false;
  const count = await countRecentDeductionsForEmployee(deductionEmployeeId);
  return count >= REPEATED_DEDUCTION_THRESHOLD;
}

export async function countSameProductLast24h(
  storeId: string,
  productId: string
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("writeoff_requests")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .gte("created_at", since);
  return count ?? 0;
}
