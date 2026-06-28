export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function jsonError(
  status: number,
  message: string,
  details?: unknown
): Response {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function handleApiError(err: unknown): Response {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message, err.details);
  }
  console.error("[API error]", err);
  const message =
    err instanceof Error ? err.message : "Unexpected internal error";
  return jsonError(500, message);
}

export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
