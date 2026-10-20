// src/lib/services/purge.ts
import { lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyses, roasts, battles, reports } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";

export async function purgeExpiredData() {
  if (!db) {
    throw new AppError("DB_ERROR", "Database not configured.", 500);
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

  // 1) Purge expired roasts
  const deletedRoasts = await db
    .delete(roasts)
    .where(lt(roasts.expiresAt, now))
    .returning({ id: roasts.id });

  // 2) Purge expired battles
  const deletedBattles = await db
    .delete(battles)
    .where(lt(battles.expiresAt, now))
    .returning({ id: battles.id });

  // 3) Purge expired analyses (cascade deletes any associated child rows)
  const deletedAnalyses = await db
    .delete(analyses)
    .where(lt(analyses.expiresAt, now))
    .returning({ id: analyses.id });

  // 4) Purge reports older than 90 days
  const deletedReports = await db
    .delete(reports)
    .where(lt(reports.createdAt, ninetyDaysAgo))
    .returning({ id: reports.id });

  return {
    deleted: {
      roasts: deletedRoasts.length,
      battles: deletedBattles.length,
      analyses: deletedAnalyses.length,
      reports: deletedReports.length,
    },
    timestamp: now.toISOString(),
  };
}
