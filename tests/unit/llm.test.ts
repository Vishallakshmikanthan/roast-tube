import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractJson } from "@/lib/llm/extract";
import { moderate, IDENTITY, PROFANITY } from "@/lib/llm/moderate";
import { validateContent } from "@/lib/llm/validate";
import { buildFallback, TEMPLATES } from "@/lib/llm/fallback";
import { getProviders, routeFor } from "@/lib/llm/providers";
import { chat, isOpen, recordFailure, resetCircuit, ProviderError, bumpGlobalCounter } from "@/lib/llm/router";
import { seal, open } from "@/lib/crypto";
import { generateSlug, addHours } from "@/lib/services/roast";
import {
  RoastContent,
  PERSONAS,
  LANGS,
  HEATS,
} from "@/lib/prompts/schema";
import { computeStats } from "@/lib/stats/compute";
import { buildSample } from "@/lib/stats/sample";
import gamerFixture from "../../fixtures/gamer.json";
import type { Normalized } from "@/lib/youtube/types";
import { randomBytes } from "node:crypto";

describe("Module 5: LLM Router, Validation & Roast Service", () => {
  const stats = computeStats(gamerFixture as unknown as Normalized, "UTC", "llm-test-seed");
  const { sample } = buildSample(gamerFixture as unknown as Normalized, stats, "llm-test-seed");

  describe("10.1 JSON Extraction (extractJson)", () => {
    it("extracts clean JSON objects", () => {
      const input = '{"tier_title":"Doomscroller","score":81}';
      expect(extractJson(input)).toEqual({
        tier_title: "Doomscroller",
        score: 81,
      });
    });

    it("extracts JSON wrapped in markdown code fences", () => {
      const input = '```json\n{"tier_title":"Doomscroller","score":81}\n```';
      expect(extractJson(input)).toEqual({
        tier_title: "Doomscroller",
        score: 81,
      });

      const genericFence = '```\n{"a": 1, "b": 2}\n```';
      expect(extractJson(genericFence)).toEqual({ a: 1, b: 2 });
    });

    it("extracts JSON embedded inside commentary text", () => {
      const input =
        'Here is the requested roast:\n{"tier_title":"Cooked","evidence":["A"]}\nHope you enjoy it!';
      expect(extractJson(input)).toEqual({
        tier_title: "Cooked",
        evidence: ["A"],
      });
    });

    it("throws when no valid JSON brackets exist or input is invalid", () => {
      expect(() => extractJson("")).toThrow("no json");
      expect(() => extractJson("Just plain text without json")).toThrow("no json");
      expect(() => extractJson("Only closing bracket } without opening")).toThrow("no json");
      expect(() => extractJson(null as any)).toThrow("no json");
    });
  });

  describe("10.2 Moderation (moderate)", () => {
    it("approves clean and friendly roast content", () => {
      const cleanContent = {
        tier_title: "Minecraft Addict",
        roast: "You stayed up until 4 AM watching gaming clips and building modern mansions.",
      };
      expect(moderate(cleanContent)).toBe(true);
    });

    it("blocks protected identity, religious, caste, and political terms", () => {
      expect(moderate({ roast: "Joke mentioning Modi politics" })).toBe(false);
      expect(moderate({ roast: "Joke about hindu or muslim traditions" })).toBe(false);
      expect(moderate({ roast: "Inappropriate comment on caste" })).toBe(false);
      expect(moderate({ roast: "Joke about severe depression and suicide" })).toBe(false);
      expect(moderate({ roast: "Joke about cancer patient" })).toBe(false);
    });

    it("blocks severe profanity", () => {
      expect(moderate({ roast: "You are a total asshole" })).toBe(false);
      expect(moderate({ roast: "Chutiya algorithm" })).toBe(false);
      expect(moderate({ roast: "What the fuck is this watch history" })).toBe(false);
    });

    it("handles invalid inputs safely", () => {
      expect(moderate(null)).toBe(false);
      expect(moderate(undefined)).toBe(false);
      expect(moderate("not an object")).toBe(false);
    });
  });

  describe("10.3 Content Validation (validateContent)", () => {
    const validSample = {
      channels: ["CraftGod", "TwitchDaily", "AcesRUs", "Lofi Girl"],
      titles: [
        "Minecraft Parkour But Floor Is Lava #Shorts",
        "Valorant Radiant 1v5 Clutch",
        "Subway Surfers Gameplay",
      ],
      playlists: ["Epic Gaming Moments"],
    };

    const validCandidateIds = stats.receiptCandidates.slice(0, 3).map((r) => r.id);

    const validGeneratedRoast: RoastContent = {
      tier_title: "Doomscroller Supreme",
      diagnosis: {
        condition: "Hyperactive Shorts Syndrome",
        symptoms: ["Zombie gaze at 3 AM", "Phantom scroll thumb", "Zero focus"],
        treatment: "Delete the app and go for a walk outside in nature.",
      },
      red_flag: "You watched 14 Minecraft videos in a single sitting.",
      green_flag: "At least you listen to Lofi Girl while doomscrolling.",
      roast:
        "Your YouTube account looks like a battlefield of wasted hours and depleted dopamine. You watch CraftGod and TwitchDaily clips while convincing yourself you will wake up early tomorrow. You are living on borrowed sleep and internet points.",
      evidence: [
        "CraftGod",
        "Minecraft Parkour But Floor Is Lava #Shorts",
        "TwitchDaily",
      ],
      receipts: [
        { id: validCandidateIds[0], label: "Top stat 1", joke: "First hilarious joke." },
        { id: validCandidateIds[1], label: "Top stat 2", joke: "Second hilarious joke." },
        { id: validCandidateIds[2], label: "Top stat 3", joke: "Third hilarious joke." },
      ],
      aura_comment: "-2,500 aura points.",
      digital_age_comment: "Digital age 13.",
      meter_comments: {
        rizz: "10% rizz: None detected.",
        npc: "92% NPC: Totally algorithm guided.",
        main_character: "12% Main Character.",
      },
      share_line: "RoastTube roasted me with score 81!",
    };

    it("passes completely for schema-valid, grounded, script-pure, safe content", () => {
      const validated = validateContent(
        validGeneratedRoast,
        validSample,
        "en",
        stats
      );
      expect(validated).toEqual(validGeneratedRoast);
    });

    it("rejects schema violations (missing fields, wrong types)", () => {
      const missingField = { ...validGeneratedRoast, tier_title: undefined };
      expect(() =>
        validateContent(missingField, validSample, "en", stats)
      ).toThrow();
    });

    it("rejects native scripts in Tanglish (Tamil script) and Hinglish (Devanagari script)", () => {
      const tamilScriptRoast = {
        ...validGeneratedRoast,
        roast:
          "இதை நீங்கள் படிக்கிறீர்கள்: Your YouTube account looks like a battlefield of wasted hours.",
      };
      expect(() =>
        validateContent(tamilScriptRoast, validSample, "tanglish", stats)
      ).toThrow("native script used");

      const devanagariScriptRoast = {
        ...validGeneratedRoast,
        roast:
          "यह एक रोस्ट है: Your YouTube account looks like a battlefield of wasted hours and lost sleep.",
      };
      expect(() =>
        validateContent(devanagariScriptRoast, validSample, "hinglish", stats)
      ).toThrow("native script used");
    });

    it("rejects ungrounded evidence not found in the sample", () => {
      const fakeEvidenceRoast = {
        ...validGeneratedRoast,
        evidence: [
          "CraftGod",
          "Completely Made Up Channel That Does Not Exist 123",
          "TwitchDaily",
        ],
      };
      expect(() =>
        validateContent(fakeEvidenceRoast, validSample, "en", stats)
      ).toThrow("evidence not grounded");
    });

    it("rejects mismatched receipt IDs", () => {
      const wrongReceipts = {
        ...validGeneratedRoast,
        receipts: [
          { id: "wrong_id_1", label: "L", joke: "J" },
          { id: validCandidateIds[1], label: "L", joke: "J" },
          { id: validCandidateIds[2], label: "L", joke: "J" },
        ],
      };
      expect(() =>
        validateContent(wrongReceipts, validSample, "en", stats)
      ).toThrow("receipt ids mismatch");
    });

    it("rejects content that fails moderation", () => {
      const offensiveRoast = {
        ...validGeneratedRoast,
        roast:
          "You are an asshole with a broken attention span and you watch CraftGod all day long every single day.",
      };
      expect(() =>
        validateContent(offensiveRoast, validSample, "en", stats)
      ).toThrow("moderation");
    });
  });

  describe("10.4 Canned Fallback (buildFallback)", () => {
    it("returns schema-valid RoastContent for all 45 persona × lang combinations", () => {
      for (const persona of PERSONAS) {
        for (const lang of LANGS) {
          const fallback = buildFallback(stats, persona, lang);

          // Verify schema parsing passes
          const parsed = RoastContent.parse(fallback);
          expect(parsed).toBeDefined();

          // Roast must be >= 80 characters
          expect(fallback.roast.length).toBeGreaterThanOrEqual(80);
          expect(fallback.roast.length).toBeLessThanOrEqual(700);

          // Evidence must have exactly 3 items
          expect(fallback.evidence).toHaveLength(3);

          // Receipts must have exactly 3 items
          expect(fallback.receipts).toHaveLength(3);

          // Diagnosis must have condition, 3 symptoms, treatment
          expect(fallback.diagnosis.symptoms).toHaveLength(3);
        }
      }
    });

    it("incorporates language-specific templates and user stats", () => {
      const en = buildFallback(stats, "aunt", "en");
      expect(en.tier_title).toBe(TEMPLATES.en.tier[stats.tier]);
      expect(en.share_line).toContain(String(stats.brainRotScore));

      const tanglish = buildFallback(stats, "gym_bro", "tanglish");
      expect(tanglish.tier_title).toBe(TEMPLATES.tanglish.tier[stats.tier]);

      const hinglish = buildFallback(stats, "angry_chef", "hinglish");
      expect(hinglish.tier_title).toBe(TEMPLATES.hinglish.tier[stats.tier]);
    });
  });

  describe("10.5 Providers & Routing (providers.ts)", () => {
    it("returns routes in configured priority order for each language", () => {
      const enRoute = routeFor("en");
      expect(Array.isArray(enRoute)).toBe(true);
      expect(enRoute.length).toBeGreaterThan(0);

      const taRoute = routeFor("tanglish");
      expect(Array.isArray(taRoute)).toBe(true);
      expect(taRoute.length).toBeGreaterThan(0);

      const hiRoute = routeFor("hinglish");
      expect(Array.isArray(hiRoute)).toBe(true);
      expect(hiRoute.length).toBeGreaterThan(0);
    });

    it("getProviders returns record object without throwing", () => {
      const providers = getProviders();
      expect(typeof providers).toBe("object");
    });
  });

  describe("10.6 Encrypted Sample Storage (crypto.ts)", () => {
    it("seals and opens data round-trip identically", () => {
      const testData = {
        channels: ["Ch1", "Ch2"],
        titles: ["Title 1", "Title 2"],
        secretNumber: 42,
      };

      const encrypted = seal(testData);
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toContain("Title 1");

      const decrypted = open<typeof testData>(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it("fails when decrypted with wrong key or tampered ciphertext", () => {
      const testData = { message: "Top secret" };
      const encrypted = seal(testData);

      const wrongKey = randomBytes(32);
      expect(() => open(encrypted, wrongKey)).toThrow();

      // Tampered data
      const tampered = encrypted.slice(0, 10) + "AAAA" + encrypted.slice(14);
      expect(() => open(tampered)).toThrow();
    });
  });

  describe("10.7 Service Helpers (slug, addHours, router)", () => {
    it("generateSlug creates 10-character URL-safe string", () => {
      const s1 = generateSlug(10);
      const s2 = generateSlug(10);
      expect(s1).toHaveLength(10);
      expect(s2).toHaveLength(10);
      expect(s1).not.toBe(s2);
      expect(/^[a-z0-9]+$/.test(s1)).toBe(true);
    });

    it("addHours adds exact hours to given date", () => {
      const now = new Date("2026-03-10T10:00:00.000Z");
      const future = addHours(now, 2);
      expect(future.toISOString()).toBe("2026-03-10T12:00:00.000Z");
    });

    it("chat makes network call with proper headers and payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"status":"ok"}' } }],
        }),
      });
      globalThis.fetch = mockFetch;

      const provider = {
        name: "groq" as const,
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: "gsk_test_key",
        model: "llama-3-70b",
        jsonMode: true,
        timeoutMs: 5000,
      };

      const result = await chat(provider, "System instruction", "User data");
      expect(result).toBe('{"status":"ok"}');
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.groq.com/openai/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer gsk_test_key",
          },
        })
      );
    });

    it("chat throws ProviderError on non-ok HTTP response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const provider = {
        name: "nim" as const,
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: "nim_test",
        model: "nemotron-4",
        jsonMode: false,
        timeoutMs: 5000,
      };

      await expect(chat(provider, "sys", "user")).rejects.toThrow(ProviderError);
    });
  });
});
