import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, toErrorResponse } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { compare, generateBattleCode, buildBattleFallback } from "@/lib/services/battle";
import { purgeExpiredData } from "@/lib/services/purge";
import { GET as healthGet } from "@/app/api/health/route";
import { POST as analyzePost } from "@/app/api/analyze/route";
import { POST as roastPost } from "@/app/api/roast/route";
import { POST as reportPost } from "@/app/api/report/route";
import { GET as cronPurgeGet } from "@/app/api/cron/purge/route";
import { POST as battlePost } from "@/app/api/battle/route";
import { GET as battleGet } from "@/app/api/battle/[code]/route";
import { POST as battleJoinPost } from "@/app/api/battle/[code]/join/route";
import { computeStats } from "@/lib/stats/compute";
import gamerFixture from "../../fixtures/gamer.json";
import studentFixture from "../../fixtures/student.json";
import type { Normalized } from "@/lib/youtube/types";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe("Module 6: API Routes & Service Infrastructure", () => {
  describe("11.1 Security: Same-Origin & Error Handling (api.ts)", () => {
    it("allows requests when origin matches the host", () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        headers: { origin: "http://localhost:3000" },
      });
      expect(() => assertSameOrigin(req)).not.toThrow();
    });

    it("allows requests with no origin header (e.g. direct server/test calls)", () => {
      const req = new NextRequest("http://localhost:3000/api/analyze");
      expect(() => assertSameOrigin(req)).not.toThrow();
    });

    it("rejects cross-origin requests with 403 AppError", () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        headers: { origin: "https://malicious-site.com" },
      });
      expect(() => assertSameOrigin(req)).toThrow(AppError);
      try {
        assertSameOrigin(req);
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
        expect(err.status).toBe(403);
      }
    });

    it("formats AppError into standardized JSON response", async () => {
      const err = new AppError("NOT_FOUND", "Analysis not found", 404);
      const res = toErrorResponse(err);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({
        error: { code: "NOT_FOUND", message: "Analysis not found" },
      });
    });

    it("formats Zod validation errors as 400 VALIDATION_ERROR", async () => {
      const schema = z.object({ tz: z.string() });
      try {
        schema.parse({});
      } catch (e) {
        const res = toErrorResponse(e);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error.code).toBe("VALIDATION_ERROR");
        expect(body.error.message).toContain("Required");
      }
    });

    it("formats unexpected errors as 500 INTERNAL_ERROR", async () => {
      const res = toErrorResponse(new Error("Database connection lost"));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({
        error: { code: "INTERNAL_ERROR", message: "Database connection lost" },
      });
    });
  });

  describe("11.2 Deterministic Battle Comparison & Fallback", () => {
    const statsA = computeStats(gamerFixture as unknown as Normalized, "UTC", "seed-a");
    const statsB = computeStats(studentFixture as unknown as Normalized, "UTC", "seed-b");

    it("compares two accounts deterministically", () => {
      const res = compare(statsA, statsB);

      expect(res).toHaveProperty("compatibility");
      expect(res.compatibility).toBeGreaterThanOrEqual(0);
      expect(res.compatibility).toBeLessThanOrEqual(100);

      expect(res).toHaveProperty("shared");
      expect(Array.isArray(res.shared)).toBe(true);

      // Gamer has score ~81, Student has score ~12 -> Worse is A (higher brain rot)
      expect(res.worse).toBe("A");
      expect(res.scoreA).toBe(statsA.brainRotScore);
      expect(res.scoreB).toBe(statsB.brainRotScore);
    });

    it("generateBattleCode creates 8-character invite code", () => {
      const code1 = generateBattleCode(8);
      const code2 = generateBattleCode(8);
      expect(code1).toHaveLength(8);
      expect(code2).toHaveLength(8);
      expect(code1).not.toBe(code2);
    });

    it("buildBattleFallback produces complete schema-valid battle content", () => {
      const comparison = compare(statsA, statsB);
      const fallback = buildBattleFallback(comparison, "Alice", "Bob", "en");

      expect(fallback.verdict_title).toContain(String(comparison.compatibility));
      expect(fallback.duo_roast.length).toBeGreaterThanOrEqual(80);
      expect(fallback.duo_roast).toContain("Alice");
      expect(fallback.duo_roast).toContain("Bob");
      expect(fallback.winner_line).toContain("Bob");
      expect(fallback.loser_line).toContain("Alice");
      expect(fallback.wifi_line.length).toBeGreaterThan(0);
      expect(fallback.share_line.length).toBeGreaterThan(0);
    });
  });

  describe("11.3 Health Endpoint (/api/health)", () => {
    it("returns health status with timestamp and services status", async () => {
      const res = await healthGet();
      expect(res).toBeDefined();
      const body = await res.json();
      expect(body).toHaveProperty("status");
      expect(body).toHaveProperty("services");
      expect(body).toHaveProperty("timestamp");
    });
  });

  describe("11.4 Analyze Route (/api/analyze) Security Checks", () => {
    it("rejects unauthenticated requests with 401 UNAUTH", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify({ tz: "UTC" }),
      });

      const res = await analyzePost(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTH");
    });

    it("rejects cross-origin requests with 403 FORBIDDEN", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: { origin: "https://malicious.evil.com" },
        body: JSON.stringify({ tz: "UTC" }),
      });

      const res = await analyzePost(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("11.5 Roast Route (/api/roast) Security Checks", () => {
    it("rejects unauthenticated calls with 401 UNAUTH", async () => {
      const req = new NextRequest("http://localhost:3000/api/roast", {
        method: "POST",
        body: JSON.stringify({
          analysisId: "11111111-1111-1111-1111-111111111111",
          persona: "aunt",
          lang: "en",
          heat: "mild",
        }),
      });

      const res = await roastPost(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTH");
    });

    it("rejects cross-origin calls with 403 FORBIDDEN", async () => {
      const req = new NextRequest("http://localhost:3000/api/roast", {
        method: "POST",
        headers: { origin: "https://evil.com" },
        body: JSON.stringify({
          analysisId: "11111111-1111-1111-1111-111111111111",
          persona: "aunt",
          lang: "en",
          heat: "mild",
        }),
      });

      const res = await roastPost(req);
      expect(res.status).toBe(403);
    });
  });

  describe("11.6 Report Route (/api/report)", () => {
    it("validates request body and rejects missing fields with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/report", {
        method: "POST",
        body: JSON.stringify({ slug: "test" }), // missing reason
      });

      const res = await reportPost(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("11.7 Cron Purge Route (/api/cron/purge)", () => {
    it("rejects requests without authorization header with 401 UNAUTHORIZED", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/purge", {
        method: "GET",
      });

      const res = await cronPurgeGet(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects requests with invalid bearer secret with 401 UNAUTHORIZED", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/purge", {
        method: "GET",
        headers: { authorization: "Bearer invalid_secret_123" },
      });

      const res = await cronPurgeGet(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("11.8 Battle Routes (/api/battle)", () => {
    it("rejects unauthenticated POST /api/battle with 401 UNAUTH", async () => {
      const req = new NextRequest("http://localhost:3000/api/battle", {
        method: "POST",
        body: JSON.stringify({
          persona: "aunt",
          lang: "en",
          heat: "medium",
        }),
      });

      const res = await battlePost(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTH");
    });

    it("rejects unauthenticated POST /api/battle/[code]/join with 401 UNAUTH", async () => {
      const req = new NextRequest("http://localhost:3000/api/battle/testcode1/join", {
        method: "POST",
        body: JSON.stringify({
          consent: true,
        }),
      });

      const res = await battleJoinPost(req, { params: Promise.resolve({ code: "testcode1" }) });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTH");
    });

    it("GET /api/battle/[code] handles unknown battle or DB error gracefully", async () => {
      const req = new NextRequest("http://localhost:3000/api/battle/nonexistent");
      const res = await battleGet(req, { params: Promise.resolve({ code: "nonexistent" }) });
      // Returns error status (404 NOT_FOUND or 500 DB_ERROR when db mock/env is unset)
      expect([404, 500]).toContain(res.status);
    });
  });
});

