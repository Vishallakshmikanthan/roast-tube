// src/lib/services/analyze.ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, analyses } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { fetchAll } from "@/lib/youtube/fetch";
import { isInsufficientData, getInsufficientDataCard } from "@/lib/youtube/normalize";
import { computeStats } from "@/lib/stats/compute";
import { buildSample } from "@/lib/stats/sample";
import { storeSample } from "@/lib/services/roast";
import type { Normalized, InsufficientDataResult } from "@/lib/youtube/types";
import type { Stats } from "@/lib/stats/compute";

export interface SessionUserData {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  googleSub?: string;
  firstName?: string;
}

export async function upsertUser(sessionUser: SessionUserData) {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  const googleSub = sessionUser.googleSub || sessionUser.id;
  if (!googleSub) {
    throw new AppError("UNAUTH", "Missing user identifier.", 401);
  }

  const displayName =
    sessionUser.firstName ||
    sessionUser.name?.split(" ")[0] ||
    "Friend";

  const avatarUrl = sessionUser.image || null;

  const existing = await db.query.users.findFirst({
    where: eq(users.googleSub, googleSub),
  });

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ displayName, avatarUrl })
      .where(eq(users.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      googleSub,
      displayName,
      avatarUrl,
    })
    .returning();

  return created;
}

export async function limitAnalyze(userId: string): Promise<void> {
  if (!redis) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `ratelimit:analyze:${userId}:${today}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86400); // 24 hours
    }
    const cap = env.USER_ANALYZE_PER_DAY || 3;
    if (count > cap) {
      throw new AppError(
        "RATE_LIMIT",
        `You have reached your daily analysis limit (${cap}). Try again tomorrow!`,
        429
      );
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
  }
}

export interface AnalyzeResult {
  analysisId: string;
  stats: Stats;
  partial: boolean;
}

export async function analyzeForUser(
  userId: string,
  token: string,
  tz: string
): Promise<AnalyzeResult | InsufficientDataResult> {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  // 1) Fetch YouTube data
  const fetchResult = await fetchAll(token);
  const normalized = fetchResult.data;
  if (isInsufficientData(normalized)) {
    return getInsufficientDataCard(normalized);
  }

  // 2) Deterministic Stats calculation
  const stats = computeStats(
    normalized,
    tz,
    `${userId}:stats`,
    fetchResult.partial
  );

  // 3) Sample extraction and sensitive filtering
  const { sample, sensitiveSkew } = buildSample(
    normalized,
    stats,
    `${userId}:sample`
  );
  stats.sensitiveSkew = sensitiveSkew;

  // 4) Insert analysis into DB (expires in 30 days)
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const [analysis] = await db
    .insert(analyses)
    .values({
      userId,
      stats,
      tz,
      expiresAt,
    })
    .returning();

  // 5) Store encrypted sample in Redis (TTL 24 hours)
  await storeSample(analysis.id, sample);

  return {
    analysisId: analysis.id,
    stats,
    partial: stats.partial,
  };
}
