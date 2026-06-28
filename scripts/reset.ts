import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}
const supabase = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SINCE = "1970-01-01T00:00:00Z";

async function del(table: string) {
  const { error } = await (supabase.from(table as Parameters<typeof supabase.from>[0]) as ReturnType<typeof supabase.from>)
    .delete()
    .gte("created_at", SINCE);
  if (error) console.warn(`  ⚠  ${table}: ${error.message}`);
  else console.log(`  ✓  ${table} cleared`);
}

async function run() {
  console.log("Resetting all FORGED demo data...\n");
  await del("writeoff_requests");
  await del("audit_logs");
  await del("writeoff_norms");
  await del("users");
  await del("employees");
  await del("products");
  await del("stores");
  console.log("\nReset complete. Run `npm run seed` to re-populate.");
}

run().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
