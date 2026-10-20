// src/lib/prompts/schema.ts
import { z } from "zod";

export const RoastContent = z.object({
  tier_title: z.string().min(3).max(60),
  diagnosis: z.object({
    condition: z.string().max(80),
    symptoms: z.array(z.string().max(120)).length(3),
    treatment: z.string().max(140),
  }),
  red_flag: z.string().max(200),
  green_flag: z.string().max(200),
  roast: z.string().min(80).max(700),
  evidence: z.array(z.string().max(100)).length(3), // must be grounded in the sample
  receipts: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().max(60),
        joke: z.string().max(160),
      })
    )
    .length(3),
  aura_comment: z.string().max(160),
  digital_age_comment: z.string().max(160),
  meter_comments: z.object({
    rizz: z.string().max(100),
    npc: z.string().max(100),
    main_character: z.string().max(100),
  }),
  share_line: z.string().max(120),
});

export type RoastContent = z.infer<typeof RoastContent>;

export const PERSONAS = [
  "aunt",
  "gym_bro",
  "angry_chef",
  "gen_alpha",
  "news_anchor",
] as const;
export type Persona = (typeof PERSONAS)[number];

export const LANGS = ["en", "tanglish", "hinglish"] as const;
export type Lang = (typeof LANGS)[number];

export const HEATS = ["mild", "medium", "max"] as const;
export type Heat = (typeof HEATS)[number];

export const PROMPT_VERSION = "v1";
