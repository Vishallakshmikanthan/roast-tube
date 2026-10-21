// src/lib/services/battle.ts
import { and, eq, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { battles, analyses, users } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import type { Stats } from "@/lib/stats/compute";
import {
  BattleContent,
  composeBattleSystem,
  composeBattleUser,
  type BattleData,
} from "@/lib/prompts/battle";
import type { Persona, Lang, Heat } from "@/lib/prompts/schema";
import { getProviders, routeFor } from "@/lib/llm/providers";
import { chat, isOpen, recordFailure, bumpGlobalCounter } from "@/lib/llm/router";
import { extractJson } from "@/lib/llm/extract";
import { moderate } from "@/lib/llm/moderate";
import { generateSlug } from "@/lib/services/roast";

export function compare(a: Stats, b: Stats) {
  const chA = new Set(a.topChannels.map((c) => c.name));
  const chB = new Set(b.topChannels.map((c) => c.name));
  const shared = [...chA].filter((x) => chB.has(x));

  const catA = new Map(a.topCategories.map((c) => [c.name, c.share]));
  const catB = new Map(b.topCategories.map((c) => [c.name, c.share]));
  const cats = new Set([...catA.keys(), ...catB.keys()]);

  let dot = 0;
  let na = 0;
  let nb = 0;
  cats.forEach((k) => {
    const x = catA.get(k) ?? 0;
    const y = catB.get(k) ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  });

  const cosine = na && nb ? dot / Math.sqrt(na * nb) : 0;
  const compatibility = Math.round(
    100 * (0.7 * cosine + 0.3 * Math.min(1, shared.length / 3))
  );

  const diff = a.brainRotScore - b.brainRotScore;
  const worse: "A" | "B" | "tie" =
    Math.abs(diff) < 5 ? "tie" : diff > 0 ? "A" : "B";

  return {
    compatibility,
    shared,
    worse,
    scoreA: a.brainRotScore,
    scoreB: b.brainRotScore,
  };
}

export function generateBattleCode(len = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // easily readable without 0/O, 1/l
  let code = "";
  const bytes = randomBytes(len);
  for (let i = 0; i < len; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export function buildBattleFallback(
  comparison: ReturnType<typeof compare>,
  nameA: string,
  nameB: string,
  _lang: Lang
): BattleContent {
  const sharedText =
    comparison.shared.length > 0
      ? `Both of you are obsessed with ${comparison.shared.slice(0, 3).join(", ")}.`
      : "You two have virtually nothing in common on YouTube, which is probably for the best.";

  const winner =
    comparison.worse === "tie"
      ? "Neither of you wins; you are both equally deep in the dopamine trenches."
      : comparison.worse === "A"
      ? `${nameB} took the win by having a marginally more functional attention span.`
      : `${nameA} took the win by having a marginally more functional attention span.`;

  const loser =
    comparison.worse === "tie"
      ? "Both of you should consider an immediate digital detox."
      : comparison.worse === "A"
      ? `${nameA} is terminally cooked with a higher brain rot score.`
      : `${nameB} is terminally cooked with a higher brain rot score.`;

  return {
    verdict_title: `${comparison.compatibility}% Algorithmic Compatibility`,
    duo_roast: `Looking at ${nameA} and ${nameB}'s watch history side-by-side feels like inspecting two halves of an algorithmic disaster. While one scrolls endless clips into the night, the other accumulates saved videos that will never see the light of day. Together, you form a nearly unstoppable vortex of wasted hours.`,
    shared_sin: sharedText.slice(0, 200),
    winner_line: winner.slice(0, 180),
    loser_line: loser.slice(0, 180),
    wifi_line:
      "Under no legal or moral circumstances should you two share a Wi-Fi password.",
    share_line: `RoastTube Battle: ${nameA} vs ${nameB} - ${comparison.compatibility}% compatibility!`.slice(
      0,
      120
    ),
  };
}

export async function createBattle(
  creatorUserId: string,
  input: {
    analysisId?: string;
    persona: Persona;
    lang: Lang;
    heat: Heat;
  }
) {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  let analysis = null;
  if (input.analysisId) {
    analysis = await db.query.analyses.findFirst({
      where: and(
        eq(analyses.id, input.analysisId),
        eq(analyses.userId, creatorUserId)
      ),
    });
  } else {
    analysis = await db.query.analyses.findFirst({
      where: eq(analyses.userId, creatorUserId),
      orderBy: [desc(analyses.createdAt)],
    });
  }

  if (!analysis) {
    throw new AppError(
      "NOT_FOUND",
      "No YouTube analysis found for your account. Please scan your YouTube first.",
      404
    );
  }

  const code = generateBattleCode(8);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours for invite

  const [battle] = await db
    .insert(battles)
    .values({
      code,
      creatorUserId,
      creatorAnalysisId: analysis.id,
      persona: input.persona,
      lang: input.lang,
      heat: input.heat,
      status: "pending",
      expiresAt,
    })
    .returning();

  return {
    code: battle.code,
    battleId: battle.id,
  };
}

export async function getBattleByCode(code: string, currentUserId?: string) {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  const battle = await db.query.battles.findFirst({
    where: eq(battles.code, code),
  });

  if (!battle) {
    throw new AppError("NOT_FOUND", "Battle invite not found.", 404);
  }

  if (battle.expiresAt < new Date() && battle.status === "pending") {
    await db
      .update(battles)
      .set({ status: "expired" })
      .where(eq(battles.id, battle.id));
    battle.status = "expired";
  }

  const [creatorUser, creatorAnalysis, opponentUser] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, battle.creatorUserId),
    }),
    db.query.analyses.findFirst({
      where: eq(analyses.id, battle.creatorAnalysisId),
    }),
    battle.opponentUserId
      ? db.query.users.findFirst({
          where: eq(users.id, battle.opponentUserId),
        })
      : null,
  ]);

  const isCreator = currentUserId ? currentUserId === battle.creatorUserId : false;
  const isOpponent = currentUserId ? currentUserId === battle.opponentUserId : false;

  const creatorStats = creatorAnalysis?.stats as Stats | undefined;

  return {
    id: battle.id,
    code: battle.code,
    status: battle.status,
    creatorName: creatorUser?.displayName || "Player 1",
    creatorAvatar: creatorUser?.avatarUrl || null,
    creatorScore: creatorStats?.brainRotScore ?? null,
    creatorTier: creatorStats?.tier ?? null,
    opponentName: opponentUser?.displayName || null,
    opponentAvatar: opponentUser?.avatarUrl || null,
    persona: battle.persona,
    lang: battle.lang,
    heat: battle.heat,
    result: battle.result,
    slug: battle.slug,
    isCreator,
    isOpponent,
    expiresAt: battle.expiresAt,
    createdAt: battle.createdAt,
  };
}

export async function joinBattle(
  opponentUserId: string,
  code: string,
  input: {
    analysisId?: string;
    consent: boolean;
  }
) {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  const battle = await db.query.battles.findFirst({
    where: eq(battles.code, code),
  });

  if (!battle) {
    throw new AppError("NOT_FOUND", "Battle not found.", 404);
  }

  if (battle.status === "done") {
    return {
      status: "done",
      result: battle.result,
      slug: battle.slug,
    };
  }

  if (opponentUserId === battle.creatorUserId) {
    throw new AppError(
      "INVALID_STATE",
      "You cannot battle against yourself! Share this invite link with a friend.",
      400
    );
  }

  if (battle.status !== "pending") {
    throw new AppError("INVALID_STATE", `Battle is already ${battle.status}.`, 400);
  }

  if (battle.expiresAt < new Date()) {
    await db
      .update(battles)
      .set({ status: "expired" })
      .where(eq(battles.id, battle.id));
    throw new AppError("EXPIRED", "This battle invite has expired.", 410);
  }

  if (!input.consent) {
    await db
      .update(battles)
      .set({ status: "declined" })
      .where(eq(battles.id, battle.id));
    return { status: "declined" };
  }

  let opponentAnalysis = null;
  if (input.analysisId) {
    opponentAnalysis = await db.query.analyses.findFirst({
      where: and(
        eq(analyses.id, input.analysisId),
        eq(analyses.userId, opponentUserId)
      ),
    });
  } else {
    opponentAnalysis = await db.query.analyses.findFirst({
      where: eq(analyses.userId, opponentUserId),
      orderBy: [desc(analyses.createdAt)],
    });
  }

  // Find creator and opponent data
  const [creatorAnalysis, creatorUser, opponentUser] =
    await Promise.all([
      db.query.analyses.findFirst({
        where: eq(analyses.id, battle.creatorAnalysisId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, battle.creatorUserId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, opponentUserId),
      }),
    ]);

  if (!creatorAnalysis || !opponentAnalysis) {
    throw new AppError("NOT_FOUND", "Analysis data not found.", 404);
  }

  const statsA = creatorAnalysis.stats as Stats;
  const statsB = opponentAnalysis.stats as Stats;
  const nameA = creatorUser?.displayName || "Player 1";
  const nameB = opponentUser?.displayName || "Player 2";

  // Deterministic comparison
  const comparison = compare(statsA, statsB);

  // Prepare battle prompt
  const battleData: BattleData = {
    nameA,
    nameB,
    compatibility: comparison.compatibility,
    scoreA: comparison.scoreA,
    scoreB: comparison.scoreB,
    worse: comparison.worse,
    sharedChannels: comparison.shared,
    topCategoriesA: statsA.topCategories,
    topCategoriesB: statsB.topCategories,
  };

  const persona = battle.persona as Persona;
  const lang = battle.lang as Lang;
  const heat = battle.heat as Heat;
  const gentle = statsA.sensitiveSkew || statsB.sensitiveSkew;

  const system = composeBattleSystem({ persona, lang, heat, gentle });
  const userMsg = composeBattleUser(battleData);

  let result: BattleContent | null = null;
  const providers = getProviders();
  const order = routeFor(lang).filter((n) => providers[n]);

  for (const name of order) {
    if (await isOpen(name)) continue;
    try {
      await bumpGlobalCounter();
      const text = await chat(providers[name], system, userMsg);
      const parsed = extractJson(text);
      const validated = BattleContent.parse(parsed);
      if (moderate(validated)) {
        result = validated;
        break;
      }
    } catch (e) {
      await recordFailure(name, e);
    }
  }

  if (!result) {
    result = buildBattleFallback(comparison, nameA, nameB, lang);
  }

  const slug = generateSlug(10);
  const resultExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

  const finalResult = {
    ...result,
    comparison,
    nameA,
    nameB,
  };

  const [updated] = await db
    .update(battles)
    .set({
      opponentUserId,
      opponentAnalysisId: opponentAnalysis.id,
      status: "done",
      result: finalResult,
      slug,
      expiresAt: resultExpiresAt,
    })
    .where(eq(battles.id, battle.id))
    .returning();

  return {
    status: "done",
    result: updated.result,
    slug: updated.slug,
  };
}
