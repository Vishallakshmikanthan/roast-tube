// src/app/api/battle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import { createBattle } from "@/lib/services/battle";
import { upsertUser } from "@/lib/services/analyze";
import { PERSONAS, LANGS, HEATS } from "@/lib/prompts/schema";

const battleCreateSchema = z.object({
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
    const input = battleCreateSchema.parse(body);

    const user = await upsertUser(session.user);
    const result = await createBattle(user.id, input);

    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
