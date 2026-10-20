// src/lib/prompts/compose.ts
import type { Stats, Sample } from "@/lib/stats";
import { BASE_RULES } from "./base";
import { GENTLE_BLOCK, SAFETY_BLOCK } from "./safety";
import { PERSONA_DEFS } from "./personas";
import { LANGUAGE_BLOCKS } from "./languages";
import { HEAT_BLOCKS } from "./heat";
import type { Heat, Lang, Persona } from "./schema";

export const OUTPUT_SPEC = `OUTPUT JSON SHAPE (all text fields in the chosen language, within limits):
{
  "tier_title": string (3-60 chars, a funny title that matches stats.tier; the letter tier is S=terminally cooked ... F=suspiciously healthy),
  "diagnosis": { "condition": string (a fake medical-sounding condition), "symptoms": [3 strings], "treatment": string },
  "red_flag": string, "green_flag": string,
  "roast": string (3-5 sentences, references real names from the sample),
  "evidence": [3 strings copied verbatim from the sample's channels or titles],
  "receipts": [ { "id": one of the provided receipt ids, "label": localized label, "joke": one-line joke about that number } x3, using the first three receipt candidates ],
  "aura_comment": string (comment on stats.aura),
  "digital_age_comment": string (comment on stats.digitalAge),
  "meter_comments": { "rizz": string, "npc": string, "main_character": string },
  "share_line": string (a short brag/dare someone would post, include the brain rot score)
}
Return ONLY the JSON object.`;

export function composeSystem(o: {
  persona: Persona;
  lang: Lang;
  heat: Heat;
  gentle?: boolean;
}): string {
  const p = PERSONA_DEFS[o.persona];
  const personaBlock = `PERSONA: ${p.name}\n${p.voice}\nExample line in the required language (style reference only, do not copy): "${p.examples[o.lang]}"`;
  return [
    BASE_RULES,
    SAFETY_BLOCK,
    o.gentle ? GENTLE_BLOCK : "",
    personaBlock,
    LANGUAGE_BLOCKS[o.lang],
    HEAT_BLOCKS[o.gentle ? "mild" : o.heat],
    OUTPUT_SPEC,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function composeUser(stats: Stats, sample: Sample): string {
  const {
    counts,
    ratios,
    topCategories,
    topChannels,
    brainRotScore,
    tier,
    rarity,
    aura,
    digitalAge,
    rizz,
    npc,
    mainCharacter,
    receiptCandidates,
  } = stats;
  const data = {
    stats: {
      counts,
      ratios,
      topCategories,
      topChannels,
      brainRotScore,
      tier,
      rarity,
      aura,
      digitalAge,
      rizz,
      npc,
      mainCharacter,
    },
    receipts: receiptCandidates.slice(0, 3),
    sample,
  };
  return `<data>\n${JSON.stringify(data)}\n</data>\nWrite the roast JSON now.`;
}
