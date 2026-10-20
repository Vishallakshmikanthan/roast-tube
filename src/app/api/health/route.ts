// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export async function GET() {
  let dbOk = false;
  let redisOk = false;

  try {
    if (db) {
      await db.execute(sql`SELECT 1`);
      dbOk = true;
    }
  } catch {
    dbOk = false;
  }

  try {
    if (redis) {
      const ping = await redis.ping();
      redisOk = ping === "PONG";
    } else {
      redisOk = true;
    }
  } catch {
    redisOk = false;
  }

  const ok = dbOk && redisOk;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      services: {
        db: dbOk,
        redis: redisOk,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
