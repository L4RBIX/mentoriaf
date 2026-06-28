import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID");

export const createWriteoffSchema = z
  .object({
    sender_id: uuidSchema,
    store_id: uuidSchema,
    product_id: uuidSchema,
    quantity: z.coerce
      .number()
      .positive("Quantity must be greater than 0"),
    reason: z.string().min(1, "Reason is required"),
    writeoff_type: z.enum(["no_deduction", "employee_deduction"]),
    deduction_employee_id: uuidSchema.nullish(),
    comment: z.string().min(10, "Comment must be at least 10 characters"),
    captured_at: z.string().datetime({ offset: true }).nullish(),
    latitude: z.coerce.number().nullish(),
    longitude: z.coerce.number().nullish(),
    source: z.string().default("pwa"),
  })
  .refine(
    (d) =>
      d.writeoff_type !== "employee_deduction" ||
      Boolean(d.deduction_employee_id),
    {
      path: ["deduction_employee_id"],
      message: "deduction_employee_id is required when writeoff_type is employee_deduction",
    }
  );

export type CreateWriteoffInput = z.infer<typeof createWriteoffSchema>;

export const approveSchema = z.object({
  reviewer_id: uuidSchema,
  reviewer_comment: z.string().optional(),
});

export const rejectSchema = z.object({
  reviewer_id: uuidSchema,
  reviewer_comment: z.string().min(1, "A rejection comment is required"),
});

export const listQuerySchema = z.object({
  status: z
    .enum(["draft", "pending", "approved", "rejected"])
    .optional(),
  store_id: uuidSchema.optional(),
  product_id: uuidSchema.optional(),
  fraud_risk: z.enum(["low", "medium", "high"]).optional(),
  sort: z
    .enum(["risk_desc", "newest", "oldest"])
    .optional()
    .default("risk_desc"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
