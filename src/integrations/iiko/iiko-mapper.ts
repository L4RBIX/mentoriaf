import type { IikoCreateWriteoffInput } from "./iiko.types";

export interface IikoWriteoffPayload {
  document: {
    documentNumber: string;
    dateIncoming: string; // ISO
    status: "PROCESSED";
    note: string;
    defaultStore: { id: string } | null;
    items: IikoWriteoffItem[];
  };
  organizationId: string | null;
}

export interface IikoWriteoffItem {
  product: { id: string | null; name: string };
  num: number;
  amount: number;
  unit: string;
  price: number;
}

// Best-effort mapping from our internal input to iikoServer documents API payload.
// TODO: confirm exact payload structure with real iikoServer API credentials.
// Ref: iikoServer REST API /documents/import/writeOff endpoint (JSON variant).
export function mapToIikoPayload(input: IikoCreateWriteoffInput): IikoWriteoffPayload {
  return {
    organizationId: input.iikoOrganizationId ?? null,
    document: {
      documentNumber: input.externalNumber,
      dateIncoming: input.date,
      status: "PROCESSED",
      note: [
        input.reason,
        input.comment,
        input.deductionType === "employee_deduction" && input.deductionEmployeeName
          ? `Deduction: ${input.deductionEmployeeName}`
          : null,
        `Approved by: ${input.approvedBy}`,
        `FORGED request: ${input.requestId}`,
      ]
        .filter(Boolean)
        .join(" | "),
      defaultStore: input.warehouseId ? { id: input.warehouseId } : null,
      items: input.items.map((item, i) => ({
        product: { id: item.iikoProductId ?? null, name: item.productName },
        num: i + 1,
        amount: item.amount,
        unit: item.unit,
        price: item.estimatedPrice,
      })),
    },
  };
}
