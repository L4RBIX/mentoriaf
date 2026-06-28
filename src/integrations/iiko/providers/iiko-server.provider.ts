// Real iikoServer provider.
// AUTH: POST {IIKO_BASE_URL}/auth?login={login}&pass={sha1(password)} → plain token text.
// TODO: Confirm the exact write-off document endpoint and payload schema with real
// iikoServer credentials. The endpoint below (`/documents/import/writeOff`) is
// the most commonly documented path but requires validation against the target
// iikoServer version.
// Error: "Real iiko write-off endpoint requires test credentials and confirmed payload."
import "server-only";
import { env, isIikoRealConfigured } from "@/lib/env";
import { getIikoToken, invalidateIikoToken } from "../iiko-auth";
import { mapToIikoPayload } from "../iiko-mapper";
import type { IikoCreateWriteoffInput, IikoSyncResult } from "../iiko.types";

const WRITE_OFF_PATH = "/documents/import/writeOff";

async function callWithTokenRefresh(
  url: string,
  body: unknown
): Promise<{ status: number; data: unknown }> {
  const attempt = async (token: string) => {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(body as Record<string, unknown>), key: token }),
    });
    return { status: resp.status, data: resp.ok ? await resp.json() : await resp.text() };
  };

  let token = await getIikoToken();
  let result = await attempt(token);

  if (result.status === 401) {
    // Token expired — invalidate cache and retry once.
    invalidateIikoToken();
    token = await getIikoToken(true);
    result = await attempt(token);
  }

  return result;
}

export async function realCreateWriteOffAct(
  input: IikoCreateWriteoffInput
): Promise<IikoSyncResult> {
  if (!isIikoRealConfigured()) {
    throw new Error(
      "Real iiko write-off endpoint requires test credentials and confirmed payload. " +
        "Set IIKO_BASE_URL, IIKO_LOGIN, IIKO_PASSWORD in .env.local."
    );
  }

  const baseUrl = env.iikoBaseUrl()!;
  const payload = mapToIikoPayload(input);

  let result: { status: number; data: unknown };
  try {
    result = await callWithTokenRefresh(`${baseUrl}${WRITE_OFF_PATH}`, payload);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[iiko-server] write-off call failed", error);
    return {
      status: "failed",
      mode: "real",
      iikoDocumentId: null,
      externalNumber: input.externalNumber,
      payload,
      response: null,
      error,
    };
  }

  if (result.status >= 200 && result.status < 300) {
    const resp = result.data as { id?: string; documentNumber?: string } | null;
    return {
      status: "synced",
      mode: "real",
      iikoDocumentId: resp?.id ?? resp?.documentNumber ?? `IIKO-REAL-${input.externalNumber}`,
      externalNumber: input.externalNumber,
      payload,
      response: result.data,
    };
  }

  const error = `iiko write-off failed: HTTP ${result.status}: ${JSON.stringify(result.data)}`;
  console.error("[iiko-server]", error);
  return {
    status: "failed",
    mode: "real",
    iikoDocumentId: null,
    externalNumber: input.externalNumber,
    payload,
    response: result.data,
    error,
  };
}
