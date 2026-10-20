// src/app/api/roast/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roasts, analyses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/api";
import { upsertUser } from "@/lib/services/analyze";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!db) {
      throw new AppError("DB_ERROR", "Database not configured.", 500);
    }

    const roast = await db.query.roasts.findFirst({
      where: eq(roasts.slug, slug),
    });

    if (!roast) {
      throw new AppError("NOT_FOUND", "Roast not found.", 404);
    }

    const analysis = await db.query.analyses.findFirst({
      where: eq(analyses.id, roast.analysisId),
    });

    if (!roast.isPublic) {
      const session = await auth();
      if (!session?.user) {
        throw new AppError("NOT_FOUND", "Roast not found.", 404);
      }
      const user = await upsertUser(session.user);
      if (analysis?.userId !== user.id) {
        throw new AppError("NOT_FOUND", "Roast not found.", 404);
      }
    }

    return NextResponse.json({
      slug: roast.slug,
      content: roast.content,
      degraded: roast.degraded,
      isPublic: roast.isPublic,
      persona: roast.persona,
      lang: roast.lang,
      heat: roast.heat,
      stats: analysis?.stats,
      createdAt: roast.createdAt,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
