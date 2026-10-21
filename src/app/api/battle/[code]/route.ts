// src/app/api/battle/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api";
import { getBattleByCode } from "@/lib/services/battle";
import { upsertUser } from "@/lib/services/analyze";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const session = await auth();
    let currentUserId: string | undefined;

    if (session?.user) {
      try {
        const u = await upsertUser(session.user);
        currentUserId = u.id;
      } catch {
        // Continue unauthenticated if user upsert fails
      }
    }

    const battle = await getBattleByCode(code, currentUserId);
    return NextResponse.json(battle);
  } catch (e) {
    return toErrorResponse(e);
  }
}
