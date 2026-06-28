import type { IikoCreateWriteoffInput, IikoSyncResult } from "../iiko.types";
import { mapToIikoPayload } from "../iiko-mapper";

export async function sandboxCreateWriteOffAct(
  input: IikoCreateWriteoffInput
): Promise<IikoSyncResult> {
  const payload = mapToIikoPayload(input);
  const iikoDocumentId = `IIKO-SBX-WO-${input.externalNumber}`;
  const syncedAt = new Date().toISOString();

  const response = {
    ok: true,
    message: "Sandbox iiko write-off act created",
    inventoryUpdated: true,
    documentNumber: input.externalNumber,
    organizationId: input.iikoOrganizationId ?? "sandbox-org",
    syncedAt,
  };

  return {
    status: "synced",
    mode: "sandbox",
    iikoDocumentId,
    externalNumber: input.externalNumber,
    payload,
    response,
  };
}
