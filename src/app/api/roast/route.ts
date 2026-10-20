// src/app/api/roast/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import { getOrCreateRoast } from "@/lib/services/roast";
import { upsertUser } from "@/lib/services/analyze";
import { PERSONAS, LANGS, HEATS } from "@/lib/prompts/schema";

export const maxDuration = 30;

const roastInputSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID"),
  persona: z.enum(PERSONAS),
  lang: z.enum(LANGS),
  heat: z.enum(HEATS),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user) {
      throw new AppError("UNAUTH", "Sign in first.", 401);
    }

    const body = await req.json();
    const input = roastInputSchema.parse(body);

    const user = await upsertUser(session.user);
    const row = await getOrCreateRoast(user.id, input);

    return NextResponse.json({
      slug: row.slug,
      content: row.content,
      degraded: row.degraded,
      isPublic: row.isPublic,
      persona: row.persona,
      lang: row.lang,
      heat: row.heat,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
