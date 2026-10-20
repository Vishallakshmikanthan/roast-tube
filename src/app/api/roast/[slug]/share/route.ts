// src/app/api/roast/[slug]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { roasts, analyses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import { upsertUser } from "@/lib/services/analyze";

const shareBodySchema = z.object({
  public: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user) {
      throw new AppError("UNAUTH", "Sign in first.", 401);
    }

    const { slug } = await params;
    const body = await req.json();
    const { public: isPublic } = shareBodySchema.parse(body);

    if (!db) {
      throw new AppError("DB_ERROR", "Database not configured.", 500);
    }

    const user = await upsertUser(session.user);

    const roast = await db.query.roasts.findFirst({
      where: eq(roasts.slug, slug),
    });

    if (!roast) {
      throw new AppError("NOT_FOUND", "Roast not found.", 404);
    }

    const analysis = await db.query.analyses.findFirst({
      where: and(eq(analyses.id, roast.analysisId), eq(analyses.userId, user.id)),
    });

    if (!analysis) {
      throw new AppError(
        "FORBIDDEN",
        "Only the owner can toggle sharing for this roast.",
        403
      );
    }

    const [updated] = await db
      .update(roasts)
      .set({ isPublic })
      .where(eq(roasts.id, roast.id))
      .returning();

    return NextResponse.json({
      slug: updated.slug,
      isPublic: updated.isPublic,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
