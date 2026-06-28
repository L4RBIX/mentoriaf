import { describe, it, expect } from "vitest";
import { sandboxCreateWriteOffAct } from "@/integrations/iiko/providers/sandbox.provider";
import type { IikoCreateWriteoffInput } from "@/integrations/iiko/iiko.types";

const SAMPLE_INPUT: IikoCreateWriteoffInput = {
  requestId: "req-001",
  externalNumber: "FORGED-WO-WO-20260627-TEST",
  date: "2026-06-27T10:00:00.000Z",
  storeId: "store-001",
  storeName: "Branch #1",
  iikoOrganizationId: "org-001",
  warehouseId: "wh-001",
  reason: "Tomatoes spoiled",
  comment: "Confirmed by supervisor",
  createdBy: "Bakyt Nurbekov",
  approvedBy: "Aliya Reviewer",
  deductionType: "no_deduction",
  items: [
    {
      productId: "prod-001",
      iikoProductId: null,
      productName: "Tomatoes",
      amount: 40,
      unit: "kg",
      estimatedPrice: 460,
    },
  ],
};

describe("iiko sandbox provider", () => {
  it("returns status synced", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    expect(result.status).toBe("synced");
  });

  it("returns mode sandbox", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    expect(result.mode).toBe("sandbox");
  });

  it("returns iiko document id starting with IIKO-SBX-WO-", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    expect(result.iikoDocumentId).toBeTruthy();
    expect(result.iikoDocumentId!.startsWith("IIKO-SBX-WO-")).toBe(true);
  });

  it("returns externalNumber unchanged", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    expect(result.externalNumber).toBe(SAMPLE_INPUT.externalNumber);
  });

  it("response has inventoryUpdated: true", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    const response = result.response as Record<string, unknown>;
    expect(response.inventoryUpdated).toBe(true);
  });

  it("response.ok is true", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    const response = result.response as Record<string, unknown>;
    expect(response.ok).toBe(true);
  });

  it("payload contains document items", async () => {
    const result = await sandboxCreateWriteOffAct(SAMPLE_INPUT);
    const payload = result.payload as { document: { items: unknown[] } };
    expect(payload.document.items).toHaveLength(1);
  });
});
