import "server-only";
import { createHash } from "crypto";
import { env } from "@/lib/env";

interface TokenCache {
  token: string;
  obtainedAt: number;
}

let _cache: TokenCache | null = null;

function sha1(input: string): string {
  return createHash("sha1").update(input, "utf8").digest("hex");
}

async function fetchNewToken(): Promise<string> {
  const baseUrl = env.iikoBaseUrl();
  const login = env.iikoLogin();
  const password = env.iikoPassword();

  if (!baseUrl || !login || !password) {
    throw new Error(
      "Real iiko write-off endpoint requires test credentials and confirmed payload. " +
        "Set IIKO_BASE_URL, IIKO_LOGIN, IIKO_PASSWORD in .env.local."
    );
  }

  const passHash = sha1(password);
  const url = `${baseUrl}/auth?login=${encodeURIComponent(login)}&pass=${passHash}`;

  const resp = await fetch(url, { method: "POST" });
  if (!resp.ok) {
    throw new Error(`iiko auth failed: HTTP ${resp.status} ${resp.statusText}`);
  }
  const token = (await resp.text()).trim();
  if (!token) throw new Error("iiko auth returned empty token");
  return token;
}

export async function getIikoToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && env.iikoTokenCacheEnabled() && _cache) {
    return _cache.token;
  }
  const token = await fetchNewToken();
  if (env.iikoTokenCacheEnabled()) {
    _cache = { token, obtainedAt: Date.now() };
  }
  return token;
}

export function invalidateIikoToken(): void {
  _cache = null;
}
