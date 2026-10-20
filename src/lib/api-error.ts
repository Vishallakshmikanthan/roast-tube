/** The API wraps service errors as { error: { code, message } }. */
export function apiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const { error, message } = body as { error?: unknown; message?: unknown };
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return typeof message === "string" ? message : fallback;
}
