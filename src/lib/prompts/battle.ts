// src/lib/prompts/battle.ts
import { z } from "zod";
import { BASE_RULES } from "./base";
import { SAFETY_BLOCK, GENTLE_BLOCK } from "./safety";
import { PERSONA_DEFS } from "./personas";
import { LANGUAGE_BLOCKS } from "./languages";
import { HEAT_BLOCKS } from "./heat";
import type { Heat, Lang, Persona } from "./schema";

export const BattleContent = z.object({
  verdict_title: z.string().max(70),
  duo_roast: z.string().min(80).max(600), // roasts the pair together
  shared_sin: z.string().max(200), // about shared channels (or "nothing in common" joke)
  winner_line: z.string().max(180), // addressed to the less-rotted (or tie line)
  loser_line: z.string().max(180), // addressed to the more-rotted
  wifi_line: z.string().max(140), // the "should not share a Wi-Fi password" style closer
  share_line: z.string().max(120),
});
export type BattleContent = z.infer<typeof BattleContent>;

export const BATTLE_OUTPUT_SPEC = `You are given a pairing: first names (A and B), computed compatibility %, brain rot scores, which of them is worse ("A", "B" or "tie"), shared top channels, and each person's top categories. Write ONLY this JSON, in the chosen language:
{
  "verdict_title": string,
  "duo_roast": string (3-4 sentences about the pair),
  "shared_sin": string (about the shared channels, or a joke about having nothing in common),
  "winner_line": string (to the less-rotted person),
  "loser_line": string (to the more-rotted person; if tie, both lines tease equally),
  "wifi_line": string (a one-line closer like 'you two should not share a Wi-Fi password'),
  "share_line": string
}
Use the provided first names exactly. Never invent numbers. Only mention channels from "shared". Same SAFETY rules apply. Return ONLY the JSON.`;

// Filter out base rule 4 (the evidence rule) for battles since battle output has no "evidence" field
export const BATTLE_BASE_RULES = BASE_RULES.replace(
  /\n4\. "evidence" must contain exactly 3 items[^\n]*/,
  ""
);

export function composeBattleSystem(o: {
  persona: Persona;
  lang: Lang;
  heat: Heat;
  gentle?: boolean;
}): string {
  const p = PERSONA_DEFS[o.persona];
  const personaBlock = `PERSONA: ${p.name}\n${p.voice}\nExample line in the required language (style reference only, do not copy): "${p.examples[o.lang]}"`;
  return [
    BATTLE_BASE_RULES,
    SAFETY_BLOCK,
    o.gentle ? GENTLE_BLOCK : "",
    personaBlock,
    LANGUAGE_BLOCKS[o.lang],
    HEAT_BLOCKS[o.gentle ? "mild" : o.heat],
    BATTLE_OUTPUT_SPEC,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export interface BattleData {
  nameA: string;
  nameB: string;
  compatibility: number;
  scoreA: number;
  scoreB: number;
  worse: "A" | "B" | "tie";
  sharedChannels: string[];
  topCategoriesA: { name: string; share: number }[];
  topCategoriesB: { name: string; share: number }[];
}

export function composeBattleUser(data: BattleData): string {
  return `<data>\n${JSON.stringify(data)}\n</data>\nWrite the battle verdict JSON now.`;
}
