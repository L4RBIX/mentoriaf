export interface IikoItem {
  productId: string;
  iikoProductId?: string | null;
  productName: string;
  amount: number;
  unit: string;
  estimatedPrice: number;
}

export interface IikoCreateWriteoffInput {
  requestId: string;
  externalNumber: string;
  date: string; // ISO date string
  storeId: string;
  storeName: string;
  iikoOrganizationId?: string | null;
  warehouseId?: string | null;
  reason: string;
  comment: string;
  createdBy: string;
  approvedBy: string;
  deductionType: "no_deduction" | "employee_deduction";
  deductionEmployeeName?: string | null;
  items: IikoItem[];
}

export interface IikoSyncResult {
  status: "synced" | "failed";
  mode: "real" | "sandbox";
  iikoDocumentId: string | null;
  externalNumber: string;
  payload: unknown;
  response: unknown;
  error?: string;
}
