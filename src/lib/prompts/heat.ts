// src/lib/prompts/heat.ts
import type { Heat } from "./schema";

export const HEAT_BLOCKS: Record<Heat, string> = {
  mild: `HEAT: Mild. Playful teasing between friends. Gentle exaggeration. End the roast with a warm or complimentary beat. The red flag should feel like a cute quirk.`,
  medium: `HEAT: Medium. Sharp and sarcastic. Real burns on specific habits, no softening ending required. The red flag should sting a little but remain funny.`,
  max: `HEAT: "Call My Mom". Maximum comedic ruthlessness aimed at HABITS ONLY: theatrical, over-the-top, absurd comparisons, devastating specificity. Still obeys every SAFETY rule: no slurs, no identity jokes, no real profanity. Ruthless is about wit, not cruelty.`,
} as const;
