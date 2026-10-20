// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAccessToken } from "@/lib/token";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import {
  upsertUser,
  limitAnalyze,
  analyzeForUser,
} from "@/lib/services/analyze";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user) {
      throw new AppError("UNAUTH", "Sign in first.", 401);
    }

    const body = await req.json().catch(() => ({}));
    const { tz } = z
      .object({
        tz: z.string().max(64).default("UTC"),
      })
      .parse(body);

    const token = await getAccessToken(req);
    if (!token) {
      throw new AppError(
        "YT_AUTH",
        "Please sign in again to grant YouTube access.",
        401
      );
    }

    const user = await upsertUser(session.user);
    await limitAnalyze(user.id);

    const out = await analyzeForUser(user.id, token, tz);
    return NextResponse.json(out);
  } catch (e) {
    return toErrorResponse(e);
  }
}
