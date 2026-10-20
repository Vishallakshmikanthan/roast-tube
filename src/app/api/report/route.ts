// src/app/api/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { roasts, reports } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/api";
import { redis } from "@/lib/redis";

const reportSchema = z.object({
  slug: z.string().min(1).max(32),
  reason: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  try {
    // 1) Rate limit by IP: 20 reports per 10 minutes
    if (redis) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown_ip";
      const key = `ratelimit:report:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 600); // 10 minutes
      }
      if (count > 20) {
        throw new AppError(
          "RATE_LIMIT",
          "Too many reports submitted. Please wait before reporting again.",
          429
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const { slug, reason } = reportSchema.parse(body);

    if (!db) {
      throw new AppError("DB_ERROR", "Database not configured.", 500);
    }

    const roast = await db.query.roasts.findFirst({
      where: eq(roasts.slug, slug),
    });

    if (!roast) {
      throw new AppError("NOT_FOUND", "Roast not found.", 404);
    }

    // Insert report
    await db.insert(reports).values({
      roastId: roast.id,
      reason,
    });

    // Check report count for this roast; auto-unpublish if >= 3
    const [reportCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.roastId, roast.id));

    const totalReports = Number(reportCountResult?.count ?? 0);
    if (totalReports >= 3 && roast.isPublic) {
      await db
        .update(roasts)
        .set({ isPublic: false })
        .where(eq(roasts.id, roast.id));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
