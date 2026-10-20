// src/lib/services/roast.ts
import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { analyses, roasts } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { open, seal } from "@/lib/crypto";
import { getProviders, routeFor } from "@/lib/llm/providers";
import { chat, isOpen, recordFailure, bumpGlobalCounter } from "@/lib/llm/router";
import { extractJson } from "@/lib/llm/extract";
import { validateContent } from "@/lib/llm/validate";
import { buildFallback } from "@/lib/llm/fallback";
import { composeSystem, composeUser } from "@/lib/prompts/compose";
import {
  type Heat,
  type Lang,
  type Persona,
  type RoastContent,
  PROMPT_VERSION,
} from "@/lib/prompts/schema";
import type { Sample, Stats } from "@/lib/stats";

export function generateSlug(len = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  const bytes = randomBytes(len);
  for (let i = 0; i < len; i++) {
    slug += chars[bytes[i] % chars.length];
  }
  return slug;
}

export function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3600 * 1000);
}

export async function loadSample(analysisId: string): Promise<Sample | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(`sample:${analysisId}`);
    if (!raw) return null;
    return open<Sample>(raw);
  } catch {
    return null;
  }
}

export async function storeSample(
  analysisId: string,
  sample: Sample
): Promise<void> {
  if (!redis) return;
  try {
    const encrypted = seal(sample);
    await redis.set(`sample:${analysisId}`, encrypted, { ex: 86400 }); // 24 hours
  } catch {
    // Ignore Redis error in test / mock
  }
}

export async function enforceLimits(userId: string): Promise<void> {
  if (!redis) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `ratelimit:roast:${userId}:${today}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86400);
    }
    const cap = env.USER_ROAST_PER_DAY || 12;
    if (count > cap) {
      throw new AppError(
        "RATE_LIMIT",
        `You have reached your daily roast limit (${cap}). Try again tomorrow!`,
        429
      );
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
  }
}

export interface GetOrCreateRoastInput {
  analysisId: string;
  persona: Persona;
  lang: Lang;
  heat: Heat;
}

export async function getOrCreateRoast(
  userId: string,
  input: GetOrCreateRoastInput
) {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  const analysis = await db.query.analyses.findFirst({
    where: and(eq(analyses.id, input.analysisId), eq(analyses.userId, userId)),
  });

  if (!analysis) {
    throw new AppError("NOT_FOUND", "Analysis not found.", 404);
  }

  if (analysis.expiresAt < new Date()) {
    throw new AppError("EXPIRED", "That analysis expired. Run it again.", 410);
  }

  const cached = await db.query.roasts.findFirst({
    where: and(
      eq(roasts.analysisId, analysis.id),
      eq(roasts.persona, input.persona),
      eq(roasts.lang, input.lang),
      eq(roasts.heat, input.heat)
    ),
  });

  if (cached) {
    return cached; // cache hits are free
  }

  await enforceLimits(userId);

  const sample = await loadSample(analysis.id);
  if (!sample) {
    throw new AppError("SAMPLE_EXPIRED", "Please re-run your analysis.", 410);
  }

  const stats = analysis.stats as Stats;
  const gentle = stats.sensitiveSkew;
  const system = composeSystem({ ...input, gentle });
  const user = composeUser(stats, sample);

  let content: RoastContent | null = null;
  let meta: {
    promptVersion: string;
    attempts: number;
    provider?: string;
    model?: string;
  } = {
    promptVersion: PROMPT_VERSION,
    attempts: 0,
  };

  const providers = getProviders();
  const order = routeFor(input.lang).filter((n) => providers[n]);

  for (const name of order) {
    if (await isOpen(name)) continue;
    for (let attempt = 0; attempt < 2 && !content; attempt++) {
      if (meta.attempts >= 3) break;
      meta.attempts++;
      try {
        await bumpGlobalCounter();
        const text = await chat(providers[name], system, user);
        content = validateContent(extractJson(text), sample, input.lang, stats);
        meta = { ...meta, provider: name, model: providers[name].model };
      } catch (e) {
        await recordFailure(name, e);
      }
    }
    if (content) break;
  }

  const degraded = !content;
  if (!content) {
    content = buildFallback(stats, input.persona, input.lang);
  }

  const slug = generateSlug(10);
  const expiresAt = degraded
    ? addHours(new Date(), 1)
    : analysis.expiresAt;

  // Insert or handle conflict
  try {
    const [inserted] = await db
      .insert(roasts)
      .values({
        analysisId: analysis.id,
        persona: input.persona,
        lang: input.lang,
        heat: input.heat,
        content: { ...content, _meta: meta },
        degraded,
        slug,
        isPublic: false,
        expiresAt,
      })
      .returning();

    return inserted;
  } catch (err: any) {
    // If unique constraint collided, fetch and return the winner
    const existing = await db.query.roasts.findFirst({
      where: and(
        eq(roasts.analysisId, analysis.id),
        eq(roasts.persona, input.persona),
        eq(roasts.lang, input.lang),
        eq(roasts.heat, input.heat)
      ),
    });
    if (existing) return existing;
    throw err;
  }
}
