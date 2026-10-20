// src/lib/api.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin) {
    // If no origin header (e.g. server-to-server or test), allow if auth header is valid or check host
    return;
  }

  try {
    const originUrl = new URL(origin);
    const reqUrl = new URL(req.url);

    // Allow if origin matches request host (standard same-origin)
    if (originUrl.host === reqUrl.host) {
      return;
    }

    // Allow if origin matches configured AUTH_URL
    if (env.AUTH_URL) {
      const authUrl = new URL(env.AUTH_URL);
      if (originUrl.host === authUrl.host) {
        return;
      }
    }
  } catch {
    // Invalid URL format
  }

  throw new AppError("FORBIDDEN", "Cross-origin requests are not allowed.", 403);
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status }
    );
  }

  if (err instanceof z.ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Validation failed";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message } },
      { status: 400 }
    );
  }

  const message =
    err instanceof Error ? err.message : "An unexpected error occurred.";
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message } },
    { status: 500 }
  );
}
