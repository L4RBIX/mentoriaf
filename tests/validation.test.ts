import { describe, it, expect } from "vitest";
import { createWriteoffSchema, approveSchema, rejectSchema } from "@/lib/validation";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("createWriteoffSchema", () => {
  const base = {
    sender_id: VALID_ID,
    store_id: VALID_ID,
    product_id: VALID_ID,
    quantity: "10",
    reason: "Spoiled product",
    writeoff_type: "no_deduction",
    comment: "Product visibly spoiled",
  };

  it("accepts valid input", () => {
    expect(() => createWriteoffSchema.parse(base)).not.toThrow();
  });

  it("rejects quantity <= 0", () => {
    const r = createWriteoffSchema.safeParse({ ...base, quantity: "0" });
    expect(r.success).toBe(false);
  });

  it("rejects comment shorter than 10 chars", () => {
    const r = createWriteoffSchema.safeParse({ ...base, comment: "short" });
    expect(r.success).toBe(false);
  });

  it("requires deduction_employee_id when writeoff_type = employee_deduction", () => {
    const r = createWriteoffSchema.safeParse({ ...base, writeoff_type: "employee_deduction" });
    expect(r.success).toBe(false);
  });

  it("accepts employee_deduction with deduction_employee_id", () => {
    const r = createWriteoffSchema.safeParse({
      ...base,
      writeoff_type: "employee_deduction",
      deduction_employee_id: VALID_ID,
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid store_id UUID", () => {
    const r = createWriteoffSchema.safeParse({ ...base, store_id: "not-a-uuid" });
    expect(r.success).toBe(false);
  });
});

describe("approveSchema", () => {
  it("accepts valid reviewer_id", () => {
    expect(() => approveSchema.parse({ reviewer_id: VALID_ID })).not.toThrow();
  });

  it("accepts reviewer_id + comment", () => {
    expect(() =>
      approveSchema.parse({ reviewer_id: VALID_ID, reviewer_comment: "Confirmed" })
    ).not.toThrow();
  });
});

describe("rejectSchema", () => {
  it("requires reviewer_comment", () => {
    const r = rejectSchema.safeParse({ reviewer_id: VALID_ID });
    expect(r.success).toBe(false);
  });

  it("accepts reviewer_id + comment", () => {
    expect(() =>
      rejectSchema.parse({ reviewer_id: VALID_ID, reviewer_comment: "Duplicate photo" })
    ).not.toThrow();
  });
});
