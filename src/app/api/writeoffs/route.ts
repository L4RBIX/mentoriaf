export const runtime = "nodejs";

import { type NextRequest } from "next/server";
import sharp from "sharp";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/http";
import { createWriteoffSchema, listQuerySchema } from "@/lib/validation";
import { generateRequestNumber } from "@/lib/request-number";
import { runVerificationPipeline } from "@/lib/pipeline/verify-writeoff";
import { logAudit } from "@/lib/audit";
import { isLocalBackendMode, listLocalWriteoffs, createLocalWriteoff } from "@/lib/local-backend";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = request.nextUrl;
    if (isLocalBackendMode()) {
      return jsonOk(await listLocalWriteoffs(searchParams.get("status")));
    }

    const queryRaw = Object.fromEntries(searchParams.entries());
    const q = listQuerySchema.parse(queryRaw);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("writeoff_requests")
      .select(
        "id, request_number, quantity, status, risk_score, fraud_risk, duplicate_detected, photo_url, iiko_status, created_at, store_id, product_id, sender_id, stores(id, name), products(id, name, unit)"
      )
      .range(q.offset, q.offset + q.limit - 1);

    if (q.status) query = query.eq("status", q.status);
    else query = query.eq("status", "pending");

    if (q.store_id) query = query.eq("store_id", q.store_id);
    if (q.product_id) query = query.eq("product_id", q.product_id);
    if (q.fraud_risk) query = query.eq("fraud_risk", q.fraud_risk);

    switch (q.sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      default:
        query = query.order("risk_score", { ascending: false });
    }

    const { data, error } = await query;
    if (error) return jsonError(500, error.message);

    type ListRow = {
      id: string; request_number: string; quantity: number; status: string;
      risk_score: number; fraud_risk: string; duplicate_detected: boolean;
      photo_url: string; iiko_status: string; created_at: string;
      store_id: string; product_id: string; sender_id: string;
      stores: { id: string; name: string } | null;
      products: { id: string; name: string; unit: string } | null;
    };
    const rows = (data ?? []) as unknown as ListRow[];
    const summaries = rows.map((r) => ({
      id: r.id,
      request_number: r.request_number,
      store: r.stores ?? null,
      product: r.products ?? null,
      sender: null,
      quantity: r.quantity,
      status: r.status,
      risk_score: r.risk_score,
      fraud_risk: r.fraud_risk,
      duplicate_detected: r.duplicate_detected,
      photo_url: r.photo_url,
      iiko_status: r.iiko_status,
      created_at: r.created_at,
    }));

    return jsonOk(summaries);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const fields: Record<string, string> = {};
    let photoBuffer: Buffer | null = null;
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (key === "photo" && value instanceof File) {
          photoBuffer = Buffer.from(await value.arrayBuffer());
          mimeType = value.type || "image/jpeg";
        } else if (typeof value === "string") {
          fields[key] = value;
        }
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      const { photo_base64, ...rest } = body;
      for (const [k, v] of Object.entries(rest)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          fields[k] = String(v);
        }
      }
      if (photo_base64 && typeof photo_base64 === "string") {
        const base64 = photo_base64.includes(",")
          ? photo_base64.split(",")[1]
          : photo_base64;
        const prefix = photo_base64.startsWith("data:") ? photo_base64.split(";")[0].split(":")[1] : null;
        if (prefix) mimeType = prefix;
        photoBuffer = Buffer.from(base64, "base64");
      }
    }

    if (!photoBuffer || photoBuffer.length === 0) {
      return jsonError(400, "photo is required (multipart file or photo_base64)");
    }
    if (photoBuffer.length > MAX_PHOTO_BYTES) {
      return jsonError(413, "photo must be 8MB or smaller");
    }
    if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
      return jsonError(400, "photo must be JPEG, PNG, or WebP");
    }

    // Validate image can be decoded.
    const metadata = await sharp(photoBuffer).metadata().catch(() => null);
    if (!metadata) return jsonError(400, "photo is not a valid image");
    const decodedMimeType = metadata.format ? FORMAT_TO_MIME[metadata.format] : undefined;
    if (!decodedMimeType || !ACCEPTED_MIME_TYPES.has(decodedMimeType)) {
      return jsonError(400, "photo must be JPEG, PNG, or WebP");
    }
    mimeType = decodedMimeType;

    if (isLocalBackendMode()) {
      const quantity = Number(fields.quantity);
      if (!fields.sender_id || !fields.store_id || !fields.product_id || !fields.reason || !fields.writeoff_type || !fields.comment || !Number.isFinite(quantity)) {
        return jsonError(400, "Validation failed");
      }
      const result = await createLocalWriteoff({
        sender_id: fields.sender_id,
        store_id: fields.store_id,
        product_id: fields.product_id,
        quantity,
        reason: fields.reason,
        writeoff_type: fields.writeoff_type === "employee_deduction" ? "employee_deduction" : "no_deduction",
        deduction_employee_id: fields.deduction_employee_id || null,
        comment: fields.comment,
        captured_at: fields.captured_at || null,
        latitude: fields.latitude ? Number(fields.latitude) : null,
        longitude: fields.longitude ? Number(fields.longitude) : null,
        source: fields.source || "pwa",
      }, photoBuffer, mimeType);
      return jsonOk(result, 201);
    }

    const parsed = createWriteoffSchema.safeParse(fields);
    if (!parsed.success) {
      return jsonError(400, "Validation failed", parsed.error.issues);
    }
    const input = parsed.data;

    const supabase = getSupabaseAdmin();
    const requestId = crypto.randomUUID();
    const requestNumber = generateRequestNumber();
    const storagePath = `writeoffs/${input.store_id}/${requestId}.${metadata.format ?? "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, photoBuffer, { contentType: mimeType, upsert: false });

    if (uploadError) return jsonError(500, `Photo upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    const photoUrl = urlData.publicUrl;

    const { data: newRow, error: insertError } = await supabase
      .from("writeoff_requests")
      .insert({
        id: requestId,
        request_number: requestNumber,
        store_id: input.store_id,
        product_id: input.product_id,
        sender_id: input.sender_id,
        quantity: input.quantity,
        unit: input.reason, // will be overwritten from product below
        reason: input.reason,
        writeoff_type: input.writeoff_type,
        deduction_employee_id: input.deduction_employee_id ?? null,
        comment: input.comment,
        photo_url: photoUrl,
        photo_storage_path: storagePath,
        captured_at: input.captured_at ?? null,
        capture_latitude: input.latitude ?? null,
        capture_longitude: input.longitude ?? null,
        source: input.source,
        status: "pending",
      })
      .select()
      .single();

    if (insertError || !newRow) {
      return jsonError(500, insertError?.message ?? "Failed to create request");
    }

    // Fetch product unit and update the row.
    const { data: product } = await supabase
      .from("products")
      .select("unit")
      .eq("id", input.product_id)
      .single();
    if (product) {
      await supabase
        .from("writeoff_requests")
        .update({ unit: product.unit })
        .eq("id", requestId);
      newRow.unit = product.unit;
    }

    await logAudit({
      requestId,
      actorId: input.sender_id,
      action: "request_created",
      metadata: { request_number: requestNumber, store_id: input.store_id, product_id: input.product_id },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    // Run full verification pipeline inline.
    const verification = await runVerificationPipeline(newRow, {
      photoBuffer,
      isInitialCreate: true,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const { data: finalRow } = await supabase
      .from("writeoff_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    return jsonOk({
      id: requestId,
      request_number: requestNumber,
      status: finalRow?.status ?? "pending",
      photo_url: photoUrl,
      risk_score: finalRow?.risk_score ?? 0,
      fraud_risk: finalRow?.fraud_risk ?? "low",
      duplicate_detected: finalRow?.duplicate_detected ?? false,
      ai_verdict: verification.ai_verdict,
      verification,
    }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
