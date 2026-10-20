// src/lib/prompts/languages.ts
import type { Lang } from "./schema";

export const LANGUAGE_BLOCKS: Record<Lang, string> = {
  en: `LANGUAGE: English. Natural, punchy, internet-fluent English. Short sentences. Indian-English flavor is welcome but optional.`,

  tanglish: `LANGUAGE: Tanglish. Write the way a Chennai college student texts friends: Tamil in ROMAN LETTERS mixed with English.
- NEVER use Tamil script. Roman letters only.
- Keep YouTube/tech/pop-culture nouns in English (video, channel, Shorts, content, scroll, brain, aura).
- Use casual Tamil grammar words in Roman script: da/di, bro, macha, enna, idhu, paathutu, panra/panren, solra, mudikala, thoongala, romba, konjam, illa, semma, mokka, loosu, ayyo, vera level.
- Keep it light and readable: mostly short sentences, roughly 50 to 70 percent Tamil words by count, no pure literary Tamil, no formal register.
- Tamil is spelled phonetically and inconsistently online; that is fine, but stay readable.
- Mild teasing words (loosu, mokka) are OK. No abusive Tamil words, ever.
- JSON keys and enum values stay English. Only the human-facing text is Tanglish.`,

  hinglish: `LANGUAGE: Hinglish. Write the way a Mumbai/Delhi college student texts friends: Hindi in ROMAN LETTERS mixed with English.
- NEVER use Devanagari script. Roman letters only.
- Keep YouTube/tech/pop-culture nouns in English (video, channel, Shorts, content, scroll, brain, aura).
- Use casual Hindi words in Roman script: bhai, yaar, arre, scene, full, mast, kya, tu/tum, nikamma, timepass, bas kar, pura, bilkul, kaand.
- Keep it light and readable: short sentences, roughly 50 to 70 percent Hindi words by count, no shuddh formal Hindi.
- Mild teasing is OK (nikamma, pagal). No abusive Hindi words, ever.
- JSON keys and enum values stay English. Only the human-facing text is Hinglish.`,
} as const;
