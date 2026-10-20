// src/lib/llm/validate.ts
import { RoastContent, type Lang } from "@/lib/prompts/schema";
import type { Sample, Stats } from "@/lib/stats";
import { moderate } from "./moderate";

export const TAMIL = /[\u0B80-\u0BFF]/;
export const DEVANAGARI = /[\u0900-\u097F]/;

export function validateContent(
  raw: unknown,
  sample: Sample,
  lang: Lang,
  stats: Stats
): RoastContent {
  // 1) Schema validation
  const c = RoastContent.parse(raw);

  // 2) Script purity: no native Tamil or Devanagari script for Romanized Tanglish/Hinglish
  const all = JSON.stringify(c);
  if (lang !== "en" && (TAMIL.test(all) || DEVANAGARI.test(all))) {
    throw new Error("native script used");
  }

  // 3) Grounding: all 3 evidence items must match channels or titles in sample
  const pool = [...sample.channels, ...sample.titles].map((s) =>
    s.toLowerCase().trim()
  );
  const grounded = c.evidence.every((e) => {
    const item = e.toLowerCase().trim();
    return pool.some((p) => p.includes(item) || item.includes(p));
  });
  if (!grounded) {
    throw new Error("evidence not grounded");
  }

  // 4) Receipt IDs match top 3 candidate IDs in order
  const ids = stats.receiptCandidates.slice(0, 3).map((r) => r.id);
  if (!c.receipts.every((r, i) => r.id === ids[i])) {
    throw new Error("receipt ids mismatch");
  }

  // 5) Content moderation
  if (!moderate(c)) {
    throw new Error("moderation");
  }

  return c;
}
