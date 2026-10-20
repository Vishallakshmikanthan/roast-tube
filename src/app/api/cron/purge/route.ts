// src/app/api/cron/purge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/api";
import { purgeExpiredData } from "@/lib/services/purge";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET || process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      throw new AppError("UNAUTHORIZED", "Invalid or missing cron secret.", 401);
    }

    const result = await purgeExpiredData();
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
