import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv, env } from "@/lib/env";
import type { Database } from "./database.types";

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  _client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

export const STORAGE_BUCKET = env.supabaseStorageBucket();
