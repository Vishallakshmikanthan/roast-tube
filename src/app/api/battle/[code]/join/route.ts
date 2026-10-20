// src/app/api/battle/[code]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import { joinBattle } from "@/lib/services/battle";
import { upsertUser } from "@/lib/services/analyze";

export const maxDuration = 30;

const joinBattleSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID"),
  consent: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    assertSameOrigin(req);

    const session = await auth();
    if (!session?.user) {
      throw new AppError("UNAUTH", "Sign in first.", 401);
    }

    const { code } = await params;
    const body = await req.json();
    const input = joinBattleSchema.parse(body);

    const user = await upsertUser(session.user);
    const result = await joinBattle(user.id, code, input);

    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
