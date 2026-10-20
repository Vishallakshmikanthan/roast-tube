// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, analyses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import { redis } from "@/lib/redis";
import { upsertUser } from "@/lib/services/analyze";

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user) {
      throw new AppError("UNAUTH", "Sign in first.", 401);
    }

    if (!db) {
      throw new AppError("DB_ERROR", "Database not configured.", 500);
    }

    const user = await upsertUser(session.user);

    // 1) Find all user's analyses to delete their Redis samples
    const userAnalyses = await db.query.analyses.findMany({
      where: eq(analyses.userId, user.id),
      columns: { id: true },
    });

    if (redis) {
      const pipeline = redis.pipeline();
      for (const a of userAnalyses) {
        pipeline.del(`sample:${a.id}`);
      }
      const today = new Date().toISOString().slice(0, 10);
      pipeline.del(`ratelimit:analyze:${user.id}:${today}`);
      pipeline.del(`ratelimit:roast:${user.id}:${today}`);
      await pipeline.exec().catch(() => {});
    }

    // 2) Delete user row from Postgres (cascades to analyses, roasts, battles)
    await db.delete(users).where(eq(users.id, user.id));

    // Return 204 No Content with cleared cookies
    const response = new NextResponse(null, { status: 204 });

    // Clear session cookies
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");

    return response;
  } catch (e) {
    return toErrorResponse(e);
  }
}
