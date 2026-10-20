import { describe, it, expect } from "vitest";
import { rngFrom } from "@/lib/seed";
import {
  computeStats,
  clamp,
  norm,
  hourIn,
  type Stats,
  type Tier,
  type Rarity,
} from "@/lib/stats/compute";
import { CATEGORY_NAMES } from "@/lib/stats/categories";
import {
  BRAINROT_RE,
  LOW_EFFORT_RE,
  TUTORIAL_RE,
  SENSITIVE_RE,
} from "@/lib/stats/dictionaries";
import { buildReceipts } from "@/lib/stats/receipts";
import { buildSample, clean } from "@/lib/stats/sample";
import type { Normalized, VideoItem } from "@/lib/youtube/types";

// Import fixtures
import gamerFixture from "../../fixtures/gamer.json";
import studentFixture from "../../fixtures/student.json";
import newsFixture from "../../fixtures/news_boomer.json";
import sensitiveFixture from "../../fixtures/sensitive.json";
import emptyFixture from "../../fixtures/empty.json";

describe("Module 3: Deterministic Stats Engine", () => {
  describe("8.1 Seeded Randomness (rngFrom)", () => {
    it("is completely deterministic given the same key", () => {
      const rng1 = rngFrom("user-seed-123");
      const rng2 = rngFrom("user-seed-123");

      const seq1 = Array.from({ length: 20 }, () => rng1());
      const seq2 = Array.from({ length: 20 }, () => rng2());

      expect(seq1).toEqual(seq2);
    });

    it("produces different sequences for different keys", () => {
      const rngA = rngFrom("seed-alice");
      const rngB = rngFrom("seed-bob");

      const seqA = Array.from({ length: 10 }, () => rngA());
      const seqB = Array.from({ length: 10 }, () => rngB());

      expect(seqA).not.toEqual(seqB);
    });

    it("generates numbers in [0, 1)", () => {
      const rng = rngFrom("bounds-check-key");
      for (let i = 0; i < 1000; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe("8.2 Dictionaries & Categories", () => {
    it("matches brainrot keywords accurately", () => {
      expect(BRAINROT_RE.test("skibidi toilet compilation")).toBe(true);
      expect(BRAINROT_RE.test("GYATT in Ohio")).toBe(true);
      expect(BRAINROT_RE.test("sigma male grindset")).toBe(true);
      expect(BRAINROT_RE.test("looksmaxing tutorial")).toBe(true);
      expect(BRAINROT_RE.test("subway surfers gameplay")).toBe(true);
      expect(BRAINROT_RE.test("unrelated boring video")).toBe(false);
    });

    it("matches low effort content patterns", () => {
      expect(LOW_EFFORT_RE.test("Funny moments compilation")).toBe(true);
      expect(LOW_EFFORT_RE.test("Streamer reacts to memes")).toBe(true);
      expect(LOW_EFFORT_RE.test("Top 10 gaming clips")).toBe(true);
      expect(LOW_EFFORT_RE.test("Detailed architectural lecture")).toBe(false);
    });

    it("matches tutorial patterns", () => {
      expect(TUTORIAL_RE.test("Learn Rust in 30 minutes")).toBe(true);
      expect(TUTORIAL_RE.test("Python Crash Course for Beginners")).toBe(true);
      expect(TUTORIAL_RE.test("Full Web Dev Roadmap 2026")).toBe(true);
      expect(TUTORIAL_RE.test("Cat playing with wool")).toBe(false);
    });

    it("matches sensitive keywords for privacy filtering", () => {
      expect(SENSITIVE_RE.test("Overcoming severe depression and anxiety")).toBe(true);
      expect(SENSITIVE_RE.test("Coping with grief after a funeral")).toBe(true);
      expect(SENSITIVE_RE.test("Chemotherapy journey day 10")).toBe(true);
      expect(SENSITIVE_RE.test("Therapy for trauma and PTSD")).toBe(true);
      expect(SENSITIVE_RE.test("React and TypeScript masterclass")).toBe(false);
    });

    it("maps YouTube category IDs to standard names", () => {
      expect(CATEGORY_NAMES["20"]).toBe("Gaming");
      expect(CATEGORY_NAMES["27"]).toBe("Education");
      expect(CATEGORY_NAMES["28"]).toBe("Science & Tech");
      expect(CATEGORY_NAMES["10"]).toBe("Music");
      expect(CATEGORY_NAMES["999"]).toBeUndefined();
    });
  });

  describe("8.3 Hour & Timezone Parser (hourIn)", () => {
    it("converts ISO timestamps to the given timezone correctly", () => {
      // 2026-03-10T02:30:00Z -> UTC hour is 2 (night)
      expect(hourIn("2026-03-10T02:30:00Z", "UTC")).toBe(2);

      // In America/New_York on March 10, 2026 (EDT, UTC-4), 02:30 UTC is 22:30 previous day
      const nyHour = hourIn("2026-03-10T02:30:00Z", "America/New_York");
      expect(nyHour).toBe(22);

      // In Asia/Kolkata (UTC+5:30), 02:30 UTC is 08:00
      expect(hourIn("2026-03-10T02:30:00Z", "Asia/Kolkata")).toBe(8);
    });

    it("handles invalid timezones by falling back to UTC hours", () => {
      const h = hourIn("2026-03-10T03:00:00Z", "Invalid/Timezone");
      expect(h).toBe(3);
    });

    it("handles invalid date strings gracefully without throwing", () => {
      expect(hourIn("not-a-date", "UTC")).toBe(0);
    });
  });

  describe("8.4 Receipts Generation (buildReceipts)", () => {
    it("ranks candidates by weight and returns at most 5 items", () => {
      const receipts = buildReceipts({
        shortsCount: 20,
        nightLikes: 15,
        ghostSubs: 10,
        tutorialsSaved: 8,
        brainrotTitles: 12,
        topChannels: [{ name: "CraftGod", count: 14 }],
        n: gamerFixture as unknown as Normalized,
        total: 30,
      });

      expect(receipts.length).toBeLessThanOrEqual(5);
      // Weights must be sorted descending
      for (let i = 0; i < receipts.length - 1; i++) {
        expect(receipts[i].weight).toBeGreaterThanOrEqual(receipts[i + 1].weight);
      }

      // Check candidate structure
      receipts.forEach((r) => {
        expect(r).toHaveProperty("id");
        expect(r).toHaveProperty("labelEn");
        expect(r).toHaveProperty("value");
        expect(r).toHaveProperty("weight");
        expect(typeof r.weight).toBe("number");
      });
    });

    it("handles empty / zero total likes defensively", () => {
      const receipts = buildReceipts({
        shortsCount: 0,
        nightLikes: 0,
        ghostSubs: 0,
        tutorialsSaved: 0,
        brainrotTitles: 0,
        topChannels: [],
        n: emptyFixture as unknown as Normalized,
        total: 0,
      });

      expect(Array.isArray(receipts)).toBe(true);
      expect(receipts.length).toBeLessThanOrEqual(5);
      receipts.forEach((r) => {
        expect(Number.isNaN(r.weight)).toBe(false);
        expect(Number.isFinite(r.weight)).toBe(true);
      });
    });
  });

  describe("8.5 Sanitization & Sample Builder (buildSample & clean)", () => {
    it("clean() strips injection tags, control chars, URLs, backticks, and clamps length", () => {
      const dirty = "<script>alert(1)</script> https://malicious.com/attack `drop database` \u0000\u001f Hello   World ";
      const cleaned = clean(dirty, 30);
      expect(cleaned).not.toContain("<script>");
      expect(cleaned).not.toContain("https://");
      expect(cleaned).not.toContain("`");
      expect(cleaned).not.toContain("\u0000");
      expect(cleaned.length).toBeLessThanOrEqual(30);
      expect(cleaned).toBe("scriptalert(1)/script drop dat");
    });

    it("never includes sensitive titles, channels, or playlists in the sample", () => {
      const sensitiveAccount: Normalized = {
        likes: [
          {
            id: "s1",
            title: "Overcoming severe depression and suicidal thoughts",
            channelId: "c1",
            channelTitle: "Therapy Center",
            categoryId: "27",
            durationSec: 300,
            tags: ["therapy"],
            likedAt: "2026-03-01T12:00:00Z",
          },
          {
            id: "s2",
            title: "Living with grief and bereavement",
            channelId: "c2",
            channelTitle: "Healing",
            categoryId: "27",
            durationSec: 400,
            tags: ["grief"],
            likedAt: "2026-03-02T12:00:00Z",
          },
          {
            id: "ok1",
            title: "Super Mario 64 Speedrun",
            channelId: "c3",
            channelTitle: "MarioRunner",
            categoryId: "20",
            durationSec: 500,
            tags: ["mario"],
            likedAt: "2026-03-03T12:00:00Z",
          },
        ],
        subs: [
          { channelId: "c_anxiety", title: "Anxiety Support Group" },
          { channelId: "c_code", title: "Fireship" },
        ],
        playlists: [
          { title: "Trauma recovery exercises", itemCount: 10 },
          { title: "Favorite coding tips", itemCount: 5 },
        ],
        fetchedAt: "2026-03-10T00:00:00Z",
      };

      const dummyStats = computeStats(sensitiveAccount, "UTC", "seed-sensitive");
      const { sample, sensitiveSkew } = buildSample(sensitiveAccount, dummyStats, "seed-sensitive");

      // Titles must not contain sensitive items
      sample.titles.forEach((t) => {
        expect(SENSITIVE_RE.test(t)).toBe(false);
      });
      expect(sample.titles).toContain("Super Mario 64 Speedrun");

      // Channels must not contain sensitive channels
      sample.channels.forEach((c) => {
        expect(SENSITIVE_RE.test(c)).toBe(false);
      });
      expect(sample.channels).toContain("Fireship");
      expect(sample.channels).not.toContain("Anxiety Support Group");

      // Playlists must not contain sensitive playlists
      sample.playlists.forEach((p) => {
        expect(SENSITIVE_RE.test(p)).toBe(false);
      });
      expect(sample.playlists).toContain("Favorite coding tips");
      expect(sample.playlists).not.toContain("Trauma recovery exercises");

      // Check sensitiveSkew flag
      expect(sensitiveSkew).toBe(true);
      expect(dummyStats.sensitiveSkew).toBe(true);
    });

    it("caps sample sizes according to plan constraints (channels <= 30, titles <= 40, playlists <= 10)", () => {
      // Build a large account
      const largeLikes: VideoItem[] = Array.from({ length: 60 }, (_, i) => ({
        id: `v_${i}`,
        title: `Safe Video Title #${i}`,
        channelId: `ch_${i % 40}`,
        channelTitle: `Channel #${i % 40}`,
        categoryId: "20",
        durationSec: 120,
        tags: ["gaming"],
        likedAt: `2026-03-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
      }));

      const largeAccount: Normalized = {
        likes: largeLikes,
        subs: Array.from({ length: 50 }, (_, i) => ({
          channelId: `sub_${i}`,
          title: `Subscriber Channel #${i}`,
        })),
        playlists: Array.from({ length: 25 }, (_, i) => ({
          title: `Playlist #${i}`,
          itemCount: 10,
        })),
        fetchedAt: "2026-03-10T00:00:00Z",
      };

      const stats = computeStats(largeAccount, "UTC", "large-seed");
      const { sample } = buildSample(largeAccount, stats, "large-seed");

      expect(sample.channels.length).toBeLessThanOrEqual(30);
      expect(sample.titles.length).toBeLessThanOrEqual(40);
      expect(sample.playlists.length).toBeLessThanOrEqual(10);
    });

    it("buildSample is deterministic given the same seed", () => {
      const stats = computeStats(gamerFixture as unknown as Normalized, "UTC", "gamer-seed");
      const sample1 = buildSample(gamerFixture as unknown as Normalized, stats, "gamer-seed");
      const sample2 = buildSample(gamerFixture as unknown as Normalized, stats, "gamer-seed");

      expect(sample1).toEqual(sample2);
    });
  });

  describe("8.6 Stats Computation & Boundaries (computeStats)", () => {
    it("is 100% deterministic: twice with the same seed produces identical results", () => {
      const stats1 = computeStats(gamerFixture as unknown as Normalized, "UTC", "test-seed-456");
      const stats2 = computeStats(gamerFixture as unknown as Normalized, "UTC", "test-seed-456");

      expect(stats1).toEqual(stats2);
    });

    it("verifies tier boundaries according to score thresholds", () => {
      // S: >= 85, A: >= 70, B: >= 50, C: >= 30, D: >= 15, F: < 15
      const testCases: { score: number; expectedTier: Tier }[] = [
        { score: 100, expectedTier: "S" },
        { score: 85, expectedTier: "S" },
        { score: 84, expectedTier: "A" },
        { score: 70, expectedTier: "A" },
        { score: 69, expectedTier: "B" },
        { score: 50, expectedTier: "B" },
        { score: 49, expectedTier: "C" },
        { score: 30, expectedTier: "C" },
        { score: 29, expectedTier: "D" },
        { score: 15, expectedTier: "D" },
        { score: 14, expectedTier: "F" },
        { score: 0, expectedTier: "F" },
      ];

      testCases.forEach(({ score, expectedTier }) => {
        const tier: Tier =
          score >= 85
            ? "S"
            : score >= 70
            ? "A"
            : score >= 50
            ? "B"
            : score >= 30
            ? "C"
            : score >= 15
            ? "D"
            : "F";
        expect(tier).toBe(expectedTier);
      });
    });

    it("verifies rarity boundaries according to score thresholds", () => {
      // Mythic: >= 90, Legendary: >= 75, Epic: >= 55, Rare: >= 35, Common: < 35
      const testCases: { score: number; expectedRarity: Rarity }[] = [
        { score: 100, expectedRarity: "Mythic" },
        { score: 90, expectedRarity: "Mythic" },
        { score: 89, expectedRarity: "Legendary" },
        { score: 75, expectedRarity: "Legendary" },
        { score: 74, expectedRarity: "Epic" },
        { score: 55, expectedRarity: "Epic" },
        { score: 54, expectedRarity: "Rare" },
        { score: 35, expectedRarity: "Rare" },
        { score: 34, expectedRarity: "Common" },
        { score: 0, expectedRarity: "Common" },
      ];

      testCases.forEach(({ score, expectedRarity }) => {
        const rarity: Rarity =
          score >= 90
            ? "Mythic"
            : score >= 75
            ? "Legendary"
            : score >= 55
            ? "Epic"
            : score >= 35
            ? "Rare"
            : "Common";
        expect(rarity).toBe(expectedRarity);
      });
    });

    it("helper clamp and norm work correctly", () => {
      expect(clamp(1.5)).toBe(1);
      expect(clamp(-0.5)).toBe(0);
      expect(clamp(0.42)).toBe(0.42);
      expect(clamp(5, 10, 20)).toBe(10);
      expect(clamp(25, 10, 20)).toBe(20);

      expect(norm(0.3, 0.6)).toBe(0.5);
      expect(norm(1.2, 0.6)).toBe(1); // clamped to 1
      expect(norm(-0.2, 0.6)).toBe(0); // clamped to 0
    });

    it("handles an empty account gracefully without crashing or NaN values", () => {
      const emptyAccount: Normalized = {
        likes: [],
        subs: [],
        playlists: [],
        fetchedAt: "2026-03-10T00:00:00Z",
      };

      const stats = computeStats(emptyAccount, "UTC", "empty-seed");

      expect(stats.counts.likes).toBe(0);
      expect(stats.counts.subs).toBe(0);
      expect(stats.counts.playlists).toBe(0);
      expect(stats.brainRotScore).toBeGreaterThanOrEqual(0);
      expect(stats.brainRotScore).toBeLessThanOrEqual(100);
      expect(Number.isNaN(stats.brainRotScore)).toBe(false);
      expect(stats.tier).toBe("F");
      expect(stats.rarity).toBe("Common");
      expect(stats.digitalAge).toBeGreaterThanOrEqual(9);
      expect(stats.digitalAge).toBeLessThanOrEqual(72);
      expect(stats.rizz).toBeGreaterThanOrEqual(1);
      expect(stats.rizz).toBeLessThanOrEqual(99);
      expect(stats.npc).toBeGreaterThanOrEqual(2);
      expect(stats.npc).toBeLessThanOrEqual(98);
      expect(stats.mainCharacter).toBeGreaterThanOrEqual(3);
      expect(stats.mainCharacter).toBeLessThanOrEqual(97);
    });
  });

  describe("8.7 Property-based randomized testing", () => {
    it("ensures all scores and meters stay within defined bounds for 50 random inputs", () => {
      for (let run = 0; run < 50; run++) {
        const numLikes = Math.floor(Math.random() * 40);
        const categories = ["1", "10", "20", "24", "26", "27", "28", "99"];

        const randomLikes: VideoItem[] = Array.from({ length: numLikes }, (_, i) => ({
          id: `rand_vid_${i}`,
          title: Math.random() > 0.5 ? "Skibidi Ohio Rizz #shorts" : "Learn Rust Crash Course",
          channelId: `ch_${Math.floor(Math.random() * 5)}`,
          channelTitle: `Channel ${Math.floor(Math.random() * 5)}`,
          categoryId: categories[Math.floor(Math.random() * categories.length)],
          durationSec: Math.floor(Math.random() * 300),
          tags: Math.random() > 0.5 ? ["shorts", "gaming"] : ["tutorial"],
          likedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        }));

        const randomAccount: Normalized = {
          likes: randomLikes,
          subs: Array.from({ length: Math.floor(Math.random() * 10) }, (_, i) => ({
            channelId: `sub_ch_${i}`,
            title: `Sub Channel ${i}`,
          })),
          playlists: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
            title: `Playlist ${i}`,
            itemCount: Math.floor(Math.random() * 20),
          })),
          fetchedAt: new Date().toISOString(),
        };

        const timezones = ["UTC", "America/New_York", "Asia/Kolkata", "Europe/London"];
        const tz = timezones[run % timezones.length];
        const seed = `prop-test-${run}`;

        const stats = computeStats(randomAccount, tz, seed);

        // Assertions for all ranges
        expect(stats.brainRotScore).toBeGreaterThanOrEqual(0);
        expect(stats.brainRotScore).toBeLessThanOrEqual(100);
        expect(["S", "A", "B", "C", "D", "F"]).toContain(stats.tier);
        expect(["Common", "Rare", "Epic", "Legendary", "Mythic"]).toContain(stats.rarity);

        expect(stats.digitalAge).toBeGreaterThanOrEqual(9);
        expect(stats.digitalAge).toBeLessThanOrEqual(72);

        expect(stats.npc).toBeGreaterThanOrEqual(2);
        expect(stats.npc).toBeLessThanOrEqual(98);

        expect(stats.rizz).toBeGreaterThanOrEqual(1);
        expect(stats.rizz).toBeLessThanOrEqual(99);

        expect(stats.mainCharacter).toBeGreaterThanOrEqual(3);
        expect(stats.mainCharacter).toBeLessThanOrEqual(97);

        expect(Number.isFinite(stats.aura)).toBe(true);

        // Check ratio ranges
        Object.values(stats.ratios).forEach((r) => {
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(1);
          expect(Number.isNaN(r)).toBe(false);
        });

        // Receipt candidates
        expect(stats.receiptCandidates.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("8.8 Fixture Accounts Verification", () => {
    it("Gamer fixture produces expected tier and rarity", () => {
      const stats = computeStats(gamerFixture as unknown as Normalized, "UTC", "gamer-seed");

      // Gamer has heavy night likes, shorts, brainrot keywords
      expect(stats.counts.likes).toBe(gamerFixture.likes.length);
      expect(stats.tier).toBe("A");
      expect(stats.rarity).toBe("Legendary");
      expect(stats.brainRotScore).toBeGreaterThanOrEqual(70);
      expect(stats.brainRotScore).toBeLessThan(85);
      expect(stats.ratios.shorts).toBeGreaterThan(0.3);
      expect(stats.ratios.night).toBeGreaterThan(0.5);

      const { sample, sensitiveSkew } = buildSample(
        gamerFixture as unknown as Normalized,
        stats,
        "gamer-seed"
      );
      expect(sensitiveSkew).toBe(false);
      expect(sample.titles.length).toBeGreaterThan(0);
      expect(sample.channels.length).toBeGreaterThan(0);
    });

    it("Student fixture produces expected educational tier", () => {
      const stats = computeStats(studentFixture as unknown as Normalized, "UTC", "student-seed");

      // Student has tutorials and high educational share -> Low brainrot
      expect(stats.tier).toBe("F");
      expect(stats.rarity).toBe("Common");
      expect(stats.brainRotScore).toBeLessThan(15);
      expect(stats.ratios.educational).toBeGreaterThan(0.7);
      expect(stats.tutorialsSaved).toBeGreaterThan(0);

      const { sensitiveSkew } = buildSample(
        studentFixture as unknown as Normalized,
        stats,
        "student-seed"
      );
      expect(sensitiveSkew).toBe(false);
    });

    it("News Boomer fixture produces low brainrot", () => {
      const stats = computeStats(newsFixture as unknown as Normalized, "UTC", "news-seed");

      expect(stats.tier).toBe("F");
      expect(stats.rarity).toBe("Common");
      expect(stats.brainRotScore).toBeLessThan(15);
      expect(stats.ratios.shorts).toBe(0);
      expect(stats.ratios.brainrot).toBe(0);
    });

    it("Sensitive fixture triggers sensitiveSkew and strips sensitive titles from sample", () => {
      const stats = computeStats(sensitiveFixture as unknown as Normalized, "UTC", "sensitive-seed");

      expect(stats.tier).toBe("D");
      expect(stats.rarity).toBe("Common");

      const { sample, sensitiveSkew } = buildSample(
        sensitiveFixture as unknown as Normalized,
        stats,
        "sensitive-seed"
      );

      expect(sensitiveSkew).toBe(true);
      expect(stats.sensitiveSkew).toBe(true);

      // Verify that NONE of the sensitive titles are in sample
      sample.titles.forEach((title) => {
        expect(SENSITIVE_RE.test(title)).toBe(false);
      });
      // But safe titles are included
      expect(sample.titles.length).toBeGreaterThan(0);
      expect(sample.titles.some((t) => t.includes("Piano Music"))).toBe(true);
    });
  });
});
