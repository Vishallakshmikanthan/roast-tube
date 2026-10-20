import { describe, it, expect } from "vitest";
import {
  RoastContent,
  PERSONAS,
  LANGS,
  HEATS,
  PROMPT_VERSION,
  type Persona,
  type Lang,
  type Heat,
} from "@/lib/prompts/schema";
import { BASE_RULES } from "@/lib/prompts/base";
import { SAFETY_BLOCK, GENTLE_BLOCK } from "@/lib/prompts/safety";
import { PERSONA_DEFS } from "@/lib/prompts/personas";
import { LANGUAGE_BLOCKS } from "@/lib/prompts/languages";
import { HEAT_BLOCKS } from "@/lib/prompts/heat";
import { composeSystem, composeUser, OUTPUT_SPEC } from "@/lib/prompts/compose";
import {
  BattleContent,
  composeBattleSystem,
  composeBattleUser,
  BATTLE_OUTPUT_SPEC,
  BATTLE_BASE_RULES,
  type BattleData,
} from "@/lib/prompts/battle";
import { computeStats } from "@/lib/stats/compute";
import { buildSample } from "@/lib/stats/sample";
import gamerFixture from "../../fixtures/gamer.json";
import type { Normalized } from "@/lib/youtube/types";

describe("Module 4: Prompt System (Generative Layer)", () => {
  describe("9.1 Output Schema & Types (RoastContent)", () => {
    const validRoast: RoastContent = {
      tier_title: "Terminally Cooked Doomscroller",
      diagnosis: {
        condition: "Acute Short-Form Brain Rot Syndrome",
        symptoms: [
          "Inability to focus past 45 seconds",
          "Randomly saying skibidi in conversation",
          "Subway surfers gameplay playing in memory",
        ],
        treatment: "Go touch grass immediately and delete YouTube shorts.",
      },
      red_flag: "You liked 14 videos between 2 AM and 5 AM on a Wednesday.",
      green_flag: "At least you saved a React tutorial you will never watch.",
      roast:
        "Your YouTube taste looks like an algorithmic crime scene. You spend all night watching Minecraft parkour and Kai Cenat clips, convincing yourself that staying up until 4 AM counts as productivity. Your brain has been deep-fried by dopamine, and your attention span couldn't survive a 2-minute tea timer.",
      evidence: [
        "CraftGod",
        "Minecraft Parkour But Floor Is Lava #Shorts",
        "BrainRotHD",
      ],
      receipts: [
        {
          id: "shorts",
          label: "Shorts liked",
          joke: "Your thumb has logged more miles on vertical scroll than your legs this year.",
        },
        {
          id: "night",
          label: "Late night likes",
          joke: "The only thing glowing at 3 AM is your screen and your regret.",
        },
        {
          id: "rot",
          label: "Brain rot vocabulary",
          joke: "Your vocabulary consists entirely of terms coined in Ohio.",
        },
      ],
      aura_comment: "-4,200 aura. The aura debt is generational.",
      digital_age_comment: "Your digital age is 12. Go do your homework.",
      meter_comments: {
        rizz: "12% rizz: Only effective on Minecraft villagers.",
        npc: "88% NPC: Following the TikTok algorithm like clockwork.",
        main_character: "14% Main Character: Definitely an extra in the background.",
      },
      share_line: "RoastTube clocked my brain rot score at 81. I am cooked.",
    };

    it("successfully parses valid RoastContent", () => {
      const parsed = RoastContent.parse(validRoast);
      expect(parsed).toEqual(validRoast);
    });

    it("rejects roasts shorter than 80 characters", () => {
      const invalid = { ...validRoast, roast: "Too short roast." };
      expect(() => RoastContent.parse(invalid)).toThrow();
    });

    it("rejects evidence with length other than 3", () => {
      const invalidTwo = { ...validRoast, evidence: ["A", "B"] };
      expect(() => RoastContent.parse(invalidTwo)).toThrow();

      const invalidFour = { ...validRoast, evidence: ["A", "B", "C", "D"] };
      expect(() => RoastContent.parse(invalidFour)).toThrow();
    });

    it("rejects receipts with length other than 3", () => {
      const invalidReceipts = {
        ...validRoast,
        receipts: [validRoast.receipts[0], validRoast.receipts[1]],
      };
      expect(() => RoastContent.parse(invalidReceipts)).toThrow();
    });

    it("rejects missing diagnosis fields", () => {
      const invalidDiagnosis = {
        ...validRoast,
        diagnosis: {
          condition: "Condition",
          symptoms: ["Symp1", "Symp2"], // only 2 symptoms, needs 3
          treatment: "Treatment",
        },
      };
      expect(() => RoastContent.parse(invalidDiagnosis)).toThrow();
    });

    it("exports valid PERSONAS, LANGS, HEATS and version", () => {
      expect(PERSONAS).toEqual([
        "aunt",
        "gym_bro",
        "angry_chef",
        "gen_alpha",
        "news_anchor",
      ]);
      expect(LANGS).toEqual(["en", "tanglish", "hinglish"]);
      expect(HEATS).toEqual(["mild", "medium", "max"]);
      expect(PROMPT_VERSION).toBe("v1");
    });
  });

  describe("9.2 Persona & Language Definitions", () => {
    it("has complete persona definitions for all 5 personas with trilingual examples", () => {
      PERSONAS.forEach((persona) => {
        const def = PERSONA_DEFS[persona];
        expect(def).toBeDefined();
        expect(def.name.length).toBeGreaterThan(0);
        expect(def.voice.length).toBeGreaterThan(20);
        LANGS.forEach((lang) => {
          expect(def.examples[lang]).toBeDefined();
          expect(def.examples[lang].length).toBeGreaterThan(10);
        });
      });
    });

    it("has complete language instructions for en, tanglish, and hinglish", () => {
      LANGS.forEach((lang) => {
        const block = LANGUAGE_BLOCKS[lang];
        expect(block).toBeDefined();
        expect(block.length).toBeGreaterThan(50);
      });

      // Tanglish & Hinglish must explicitly prohibit native scripts
      expect(LANGUAGE_BLOCKS.tanglish).toContain("NEVER use Tamil script");
      expect(LANGUAGE_BLOCKS.hinglish).toContain("NEVER use Devanagari script");
    });

    it("has complete heat instructions for mild, medium, and max", () => {
      HEATS.forEach((heat) => {
        const block = HEAT_BLOCKS[heat];
        expect(block).toBeDefined();
        expect(block.length).toBeGreaterThan(20);
      });
    });
  });

  describe("9.3 composeSystem Composer", () => {
    it("composes all 45 persona × lang × heat combinations properly", () => {
      for (const persona of PERSONAS) {
        for (const lang of LANGS) {
          for (const heat of HEATS) {
            const systemPrompt = composeSystem({ persona, lang, heat });

            // Verify core blocks are present
            expect(systemPrompt).toContain(BASE_RULES);
            expect(systemPrompt).toContain(SAFETY_BLOCK);
            expect(systemPrompt).toContain(PERSONA_DEFS[persona].name);
            expect(systemPrompt).toContain(PERSONA_DEFS[persona].voice);
            expect(systemPrompt).toContain(PERSONA_DEFS[persona].examples[lang]);
            expect(systemPrompt).toContain(LANGUAGE_BLOCKS[lang]);
            expect(systemPrompt).toContain(HEAT_BLOCKS[heat]);
            expect(systemPrompt).toContain(OUTPUT_SPEC);

            // GENTLE_BLOCK should not be included by default
            expect(systemPrompt).not.toContain(GENTLE_BLOCK);
          }
        }
      }
    });

    it("includes GENTLE_BLOCK and forces mild heat when gentle is true", () => {
      const systemPrompt = composeSystem({
        persona: "angry_chef",
        lang: "en",
        heat: "max", // User asked for max heat
        gentle: true, // But account has sensitive skew
      });

      expect(systemPrompt).toContain(GENTLE_BLOCK);
      // Heat should be forced to mild
      expect(systemPrompt).toContain(HEAT_BLOCKS.mild);
      expect(systemPrompt).not.toContain(HEAT_BLOCKS.max);
    });
  });

  describe("9.4 composeUser Composer", () => {
    it("formats computed stats and sample inside <data> tags", () => {
      const stats = computeStats(gamerFixture as unknown as Normalized, "UTC", "gamer-seed");
      const { sample } = buildSample(gamerFixture as unknown as Normalized, stats, "gamer-seed");

      const userPrompt = composeUser(stats, sample);

      expect(userPrompt.startsWith("<data>\n")).toBe(true);
      expect(userPrompt).toContain("</data>\nWrite the roast JSON now.");

      // Verify JSON payload inside <data> is parseable
      const jsonStr = userPrompt.substring(
        userPrompt.indexOf("<data>\n") + 7,
        userPrompt.indexOf("\n</data>")
      );
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveProperty("stats");
      expect(parsed.stats.brainRotScore).toBe(stats.brainRotScore);
      expect(parsed.stats.tier).toBe(stats.tier);
      expect(parsed.stats.rarity).toBe(stats.rarity);
      expect(parsed).toHaveProperty("receipts");
      expect(parsed.receipts.length).toBeLessThanOrEqual(3);
      expect(parsed).toHaveProperty("sample");
      expect(parsed.sample.titles).toEqual(sample.titles);
      expect(parsed.sample.channels).toEqual(sample.channels);
    });
  });

  describe("9.5 Battle Prompt (BattleContent & composeBattle)", () => {
    const validBattle: BattleContent = {
      verdict_title: "A Match Made in Algorithmic Purgatory",
      duo_roast:
        "Watching you two together is like witnessing a double trainwreck in slow motion. Between one of you doomscrolling Minecraft parkour all night and the other saving tutorials you will never open, neither of you has any hope of reclaiming a healthy dopamine baseline. You are both terminally cooked.",
      shared_sin:
        "You both secretly subscribe to BrainRotHD and pretend you only watch it ironically.",
      winner_line:
        "Alice wins by a razor-thin margin because her attention span lasted 10 seconds longer.",
      loser_line:
        "Bob lost entirely due to 3 AM Shorts bingeing with zero remorse.",
      wifi_line: "Under no circumstances should you two ever share a Wi-Fi password.",
      share_line: "RoastTube declared Alice the lesser disaster in our YouTube battle!",
    };

    it("successfully parses valid BattleContent", () => {
      const parsed = BattleContent.parse(validBattle);
      expect(parsed).toEqual(validBattle);
    });

    it("rejects battle roast shorter than 80 characters", () => {
      const invalid = { ...validBattle, duo_roast: "Too short duo roast." };
      expect(() => BattleContent.parse(invalid)).toThrow();
    });

    it("composes battle system prompt with BATTLE_BASE_RULES and BATTLE_OUTPUT_SPEC", () => {
      const battleSystem = composeBattleSystem({
        persona: "gym_bro",
        lang: "tanglish",
        heat: "medium",
      });

      expect(battleSystem).toContain(BATTLE_BASE_RULES);
      expect(battleSystem).toContain(BATTLE_OUTPUT_SPEC);
      expect(battleSystem).toContain(PERSONA_DEFS.gym_bro.name);
      expect(battleSystem).toContain(LANGUAGE_BLOCKS.tanglish);
      expect(battleSystem).toContain(HEAT_BLOCKS.medium);
      // Evidence rule should have been removed from BATTLE_BASE_RULES
      expect(battleSystem).not.toContain('"evidence" must contain exactly 3 items');
    });

    it("composes battle user message with battle data", () => {
      const battleData: BattleData = {
        nameA: "Alice",
        nameB: "Bob",
        compatibility: 42,
        scoreA: 81,
        scoreB: 65,
        worse: "A",
        sharedChannels: ["TwitchDaily", "Lofi Girl"],
        topCategoriesA: [{ name: "Gaming", share: 0.6 }],
        topCategoriesB: [{ name: "Education", share: 0.4 }],
      };

      const userMsg = composeBattleUser(battleData);
      expect(userMsg).toContain("<data>\n");
      expect(userMsg).toContain("</data>\nWrite the battle verdict JSON now.");

      const jsonStr = userMsg.substring(
        userMsg.indexOf("<data>\n") + 7,
        userMsg.indexOf("\n</data>")
      );
      const parsed = JSON.parse(jsonStr);
      expect(parsed.nameA).toBe("Alice");
      expect(parsed.nameB).toBe("Bob");
      expect(parsed.compatibility).toBe(42);
      expect(parsed.worse).toBe("A");
      expect(parsed.sharedChannels).toEqual(["TwitchDaily", "Lofi Girl"]);
    });
  });
});
