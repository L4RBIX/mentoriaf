import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import type { Database } from "../src/lib/supabase/database.types.js";
import { computeDHash } from "../src/lib/phash.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "writeoff-photos";

if (!url || !key) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ASSETS = join(process.cwd(), "demo-assets");

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function ensureBucket() {
  const { error } = await supabase.storage.createBucket(bucket, { public: true });
  if (error && !error.message.includes("already exists")) {
    throw new Error(`Failed to create storage bucket: ${error.message}`);
  }
  console.log(`  ✓ Storage bucket "${bucket}" ready`);
}

async function uploadFile(assetName: string, storagePath: string): Promise<string> {
  const filePath = join(ASSETS, assetName);
  if (!existsSync(filePath)) {
    throw new Error(`Demo asset not found: ${filePath}. Run: npm run demo:assets`);
  }
  const buffer = await readFile(filePath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${assetName}: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function run() {
  console.log("Seeding FORGED demo data...\n");

  await ensureBucket();

  // ── Stores ──────────────────────────────────────────────────────────────
  const { data: stores, error: storesErr } = await supabase
    .from("stores")
    .insert([
      { name: "Branch #1", address: "Almaty, Abay Ave 1", latitude: 43.2220, longitude: 76.8512, iiko_organization_id: "iiko-org-branch1", iiko_warehouse_id: "wh-branch1" },
      { name: "Branch #2", address: "Almaty, Furmanov 100", latitude: 43.2350, longitude: 76.9100, iiko_organization_id: "iiko-org-branch2", iiko_warehouse_id: "wh-branch2" },
      { name: "Branch #3", address: "Astana, Republic Ave 5", latitude: 51.1694, longitude: 71.4491, iiko_organization_id: "iiko-org-branch3", iiko_warehouse_id: "wh-branch3" },
    ])
    .select();
  if (storesErr) throw storesErr;
  const [branch1, branch2, branch3] = stores!;
  console.log(`  ✓ 3 stores created`);

  // ── Products ─────────────────────────────────────────────────────────────
  const { data: products, error: productsErr } = await supabase
    .from("products")
    .insert([
      { name: "Tomatoes", category: "Vegetables", unit: "kg", estimated_price: 460 },
      { name: "Buns", category: "Bakery", unit: "pcs", estimated_price: 50 },
      { name: "Cutlets", category: "Meat", unit: "pcs", estimated_price: 120 },
      { name: "Cheese", category: "Dairy", unit: "kg", estimated_price: 800 },
      { name: "Sauce", category: "Condiments", unit: "L", estimated_price: 200 },
    ])
    .select();
  if (productsErr) throw productsErr;
  const [tomatoes, buns, , ,] = products!;
  console.log(`  ✓ 5 products created  (Tomatoes price: ₸${tomatoes.estimated_price}/kg)`);

  // ── Employees (deduction targets) ─────────────────────────────────────
  const { error: empErr } = await supabase
    .from("employees")
    .insert([
      { full_name: "Aigerim Bekova", store_id: branch1.id, position: "Cook" },
      { full_name: "Dauren Seitkali", store_id: branch1.id, position: "Cook" },
      { full_name: "Marat Akhmetov", store_id: branch2.id, position: "Cashier" },
      { full_name: "Zarina Nurgali", store_id: branch2.id, position: "Waiter" },
      { full_name: "Ruslan Idrisov", store_id: branch3.id, position: "Manager" },
      { full_name: "Saule Ospanova", store_id: branch3.id, position: "Cook" },
    ])
    .select();
  if (empErr) throw empErr;
  console.log(`  ✓ 6 employees created`);

  // ── Users ────────────────────────────────────────────────────────────────
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .insert([
      { name: "Bakyt Nurbekov", email: "bakyt@forged.demo", role: "employee", store_id: branch1.id },
      { name: "Aliya Reviewer", email: "aliya@forged.demo", role: "reviewer", store_id: null },
      { name: "Timur Reviewer", email: "timur@forged.demo", role: "reviewer", store_id: null },
      { name: "Admin Forged", email: "admin@forged.demo", role: "admin", store_id: null },
    ])
    .select();
  if (usersErr) throw usersErr;
  const [sender, reviewer1, reviewer2] = users!;
  console.log(`  ✓ 4 users created`);
  console.log(`    sender_id   = ${sender.id}   (${sender.name})`);
  console.log(`    reviewer1_id= ${reviewer1.id} (${reviewer1.name})`);
  console.log(`    reviewer2_id= ${reviewer2.id} (${reviewer2.name})`);

  // ── Upload tomatoes_1847.jpg ──────────────────────────────────────────
  const t1847StoragePath = "seed/tomatoes_1847.jpg";
  const t1847Url = await uploadFile("tomatoes_1847.jpg", t1847StoragePath);
  const t1847Buffer = await readFile(join(ASSETS, "tomatoes_1847.jpg"));
  const { hash: t1847Hash, width: t1847W, height: t1847H } = await computeDHash(t1847Buffer);
  console.log(`  ✓ tomatoes_1847.jpg uploaded (dHash: ${t1847Hash})`);

  // ── Request #1847 (historical approved — fingerprint anchor) ──────────
  const { data: req1847, error: r1847err } = await supabase
    .from("writeoff_requests")
    .insert({
      request_number: "WO-1847",
      store_id: branch1.id,
      product_id: tomatoes.id,
      sender_id: sender.id,
      quantity: 8,
      unit: "kg",
      reason: "Spoilage detected during morning inspection",
      writeoff_type: "no_deduction",
      comment: "All three crates found spoiled overnight, possible refrigeration issue",
      photo_url: t1847Url,
      photo_storage_path: t1847StoragePath,
      captured_at: daysAgo(7),
      capture_latitude: 43.2222,
      capture_longitude: 76.8514,
      source: "pwa",
      status: "approved",
      risk_score: 15,
      fraud_risk: "low",
      duplicate_detected: false,
      duplicate_match_percent: 0,
      reviewer_id: reviewer1.id,
      reviewer_comment: "Confirmed — refrigerator log supports claim",
      reviewed_at: daysAgo(7),
      iiko_status: "synced",
      iiko_document_id: "IIKO-SBX-WO-FORGED-WO-WO-1847",
      iiko_external_number: "FORGED-WO-WO-1847",
      created_at: daysAgo(7),
    })
    .select()
    .single();
  if (r1847err || !req1847) throw r1847err ?? new Error("Failed to insert WO-1847");

  // Insert its fingerprint (this is what the live demo will match against).
  await supabase.from("photo_fingerprints").insert({
    request_id: req1847.id,
    hash: t1847Hash,
    hash_algorithm: "dhash",
    width: t1847W,
    height: t1847H,
    created_at: daysAgo(7),
  });
  console.log(`  ✓ Request WO-1847 created with fingerprint (${t1847Hash})`);

  // ── Norm-baseline approved requests (3 days, Tomatoes @ Branch #1) ────
  const normData = [
    { n: 3, qty: 5, rn: "WO-1844" },
    { n: 2, qty: 6, rn: "WO-1845" },
    { n: 1, qty: 7, rn: "WO-1846" },
  ];
  for (const { n, qty, rn } of normData) {
    await supabase.from("writeoff_requests").insert({
      request_number: rn,
      store_id: branch1.id,
      product_id: tomatoes.id,
      sender_id: sender.id,
      quantity: qty,
      unit: "kg",
      reason: "Regular spoilage",
      writeoff_type: "no_deduction",
      comment: "Standard daily spoilage writeoff, checked and confirmed",
      photo_url: t1847Url,
      photo_storage_path: t1847StoragePath,
      source: "pwa",
      status: "approved",
      risk_score: 12,
      fraud_risk: "low",
      reviewer_id: reviewer1.id,
      reviewer_comment: "Routine approval",
      reviewed_at: daysAgo(n),
      iiko_status: "synced",
      iiko_external_number: `FORGED-WO-${rn}`,
      created_at: daysAgo(n),
    });
  }
  console.log(`  ✓ 3 norm-baseline approved requests created  (avg daily qty ≈ 6 kg)`);
  console.log(`    → norm threshold: 2×6 = 12 kg. Demo request quantity=40 triggers +20 risk flag.`);

  // ── Some additional historical data for analytics ─────────────────────
  const bunsUrl = await uploadFile("buns.jpg", "seed/buns.jpg");
  await supabase.from("writeoff_requests").insert({
    request_number: "WO-1850",
    store_id: branch2.id,
    product_id: buns.id,
    sender_id: sender.id,
    quantity: 20,
    unit: "pcs",
    reason: "Buns stale — end of day",
    writeoff_type: "no_deduction",
    comment: "Unsold buns from yesterday now stale, confirmed by supervisor",
    photo_url: bunsUrl,
    photo_storage_path: "seed/buns.jpg",
    source: "pwa",
    captured_at: daysAgo(1),
    status: "approved",
    risk_score: 10,
    fraud_risk: "low",
    reviewer_id: reviewer2.id,
    reviewer_comment: "Approved — routine",
    reviewed_at: daysAgo(1),
    iiko_status: "synced",
    created_at: daysAgo(1),
  });
  console.log(`  ✓ 1 additional approved request (Buns @ Branch #2) for analytics`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORGED seed complete.

Demo IDs (copy into demo-scenario or frontend):
  sender_id   = ${sender.id}
  reviewer_id = ${reviewer1.id}
  store_id    = ${branch1.id}  (Branch #1)
  tomatoes_id = ${tomatoes.id}
  buns_id     = ${buns.id}

Run the full demo scenario:
  npm run demo:scenario
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
