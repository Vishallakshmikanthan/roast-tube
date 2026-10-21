import { describe, it, expect } from "vitest";
import {
  getBrainrotCharacter,
  getBrainrotBadges,
  BRAINROT_IMAGES,
} from "../../src/lib/brainrot";
import { LOADING_JOKES } from "../../src/components/AnalyzingView";

describe("Brainrot Character & Badges Engine", () => {
  it("assigns nuclearCat or throneKitten for extreme cooked / Tier S scores", () => {
    const charS = getBrainrotCharacter({ score: 95, tier: "S", heat: "max" });
    expect(charS.url).toBe(BRAINROT_IMAGES.nuclearCat);
    expect(charS.title).toBe("NUCLEAR BRAIN DAMAGE");

    const char85 = getBrainrotCharacter({ score: 87, heat: "medium" });
    expect(char85.url).toBe(BRAINROT_IMAGES.throneKitten);
    expect(char85.title).toBe("SUPREME DOOMSCROLLER");
  });

  it("assigns gym_bro squatting tiger", () => {
    const charGym = getBrainrotCharacter({ persona: "gym_bro", score: 60 });
    expect(charGym.url).toBe(BRAINROT_IMAGES.squattingTiger);
    expect(charGym.title).toBe("GIGA CHAD TIGER");
  });

  it("assigns angry_chef boxer kitten", () => {
    const charChef = getBrainrotCharacter({ persona: "angry_chef", score: 55 });
    expect(charChef.url).toBe(BRAINROT_IMAGES.boxerKitten);
    expect(charChef.title).toBe("RAW & READY TO SCRAP");
  });

  it("assigns gen_alpha skibidi rizzler", () => {
    const charGen = getBrainrotCharacter({ persona: "gen_alpha", score: 50 });
    expect(charGen.url).toBe(BRAINROT_IMAGES.pixelTongueCat);
    expect(charGen.title).toBe("SKIBIDI RIZZLER");
  });

  it("assigns SRK twin for hinglish / tanglish banter", () => {
    const charDesi = getBrainrotCharacter({ lang: "hinglish", score: 65 });
    expect(charDesi.url).toBe(BRAINROT_IMAGES.srkNiche);
    expect(charDesi.title).toBe("TWIN I'M NICHE");
  });

  it("generates a rich set of earned badges based on user stats", () => {
    const badges = getBrainrotBadges({
      score: 75,
      nightLikes: 23,
      tutorialsSaved: 8,
      shortsCount: 60,
      aura: -1240,
      lang: "tanglish",
      heat: "medium",
    });

    expect(badges.length).toBeGreaterThanOrEqual(5);

    const ids = badges.map((b) => b.id);
    expect(ids).toContain("b-enjoyer");
    expect(ids).toContain("b-night");
    expect(ids).toContain("b-tutorials");
    expect(ids).toContain("b-shorts");
    expect(ids).toContain("b-aura-deficit");
    expect(ids).toContain("b-desi-niche");
    expect(ids).toContain("b-let-him-cook");
    expect(ids).toContain("b-council-prayers");

    // All badges must have valid image URLs from brainrot images
    badges.forEach((b) => {
      expect(b.imageUrl).toContain("/images/brainrot/");
      expect(b.name).toBeTruthy();
      expect(b.description).toBeTruthy();
    });
  });
});

describe("Section 12.5 Loading Jokes", () => {
  it("contains all exact jokes specified in Section 12.5 of the implementation plan", () => {
    expect(LOADING_JOKES.en).toEqual([
      "Judging your 3 AM watch history.",
      "Contacting your parents.",
      "Calculating how cooked you are.",
      "Counting your Shorts... please wait, this may take a lifetime.",
      "Asking an aunt for her opinion.",
      "Measuring your aura (it is not looking good).",
    ]);

    expect(LOADING_JOKES.tanglish).toEqual([
      "Un 3 AM watch history-ah judge panren.",
      "Un Amma-kitta phone pannitu irukken.",
      "Nee evlo cooked-nu kanakku pannren.",
      "Un Shorts-ah ennitu irukken, konjam wait pannu.",
      "Oru aunty kitta opinion kekkuren.",
      "Un aura-va alandhu paakkuren (nalla illa).",
    ]);

    expect(LOADING_JOKES.hinglish).toEqual([
      "Tere 3 baje ke watch history ko judge kar raha hoon.",
      "Tere ghar wale ko phone laga raha hoon.",
      "Check kar raha hoon tu kitna cooked hai.",
      "Tere Shorts gin raha hoon, thoda wait kar.",
      "Aunty se opinion le raha hoon.",
      "Teri aura naap raha hoon (scene achha nahi hai).",
    ]);
  });
});
