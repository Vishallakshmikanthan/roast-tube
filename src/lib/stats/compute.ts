// src/lib/stats/compute.ts
import { rngFrom } from "@/lib/seed";
import type { Normalized } from "@/lib/youtube/types";
import { CATEGORY_NAMES } from "./categories";
import { BRAINROT_RE, LOW_EFFORT_RE, TUTORIAL_RE } from "./dictionaries";
import { buildReceipts, type ReceiptCandidate } from "./receipts";

export type Tier = "S" | "A" | "B" | "C" | "D" | "F";
export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

export interface Stats {
  counts: { likes: number; subs: number; playlists: number };
  ratios: {
    shorts: number;
    brainrot: number;
    lowEffort: number;
    educational: number;
    night: number;
    top3Share: number;
  };
  topCategories: { name: string; share: number }[];
  topChannels: { name: string; count: number }[];
  ghostSubs: number;
  tutorialsSaved: number;
  shortsCount: number;
  nightLikes: number;
  brainrotTitles: number;
  brainRotScore: number;
  tier: Tier;
  rarity: Rarity;
  aura: number;
  digitalAge: number;
  rizz: number;
  npc: number;
  mainCharacter: number;
  receiptCandidates: ReceiptCandidate[];
  partial: boolean;
  sensitiveSkew: boolean;
}

export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
export const norm = (v: number, full: number): number => clamp(v / full);

export function hourIn(iso: string, tz: string): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: tz,
    }).format(new Date(iso));
    const h = parseInt(formatted, 10);
    return isNaN(h) ? new Date(iso).getUTCHours() : h;
  } catch {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 0 : d.getUTCHours();
  }
}

export function computeStats(
  n: Normalized,
  tz: string,
  seedKey: string,
  partial = false
): Stats {
  const rnd = rngFrom(seedKey);
  const L = n.likes ?? [];
  const total = Math.max(L.length, 1);
  const hay = L.map(
    (v) => `${v.title ?? ""} ${(v.tags ?? []).slice(0, 5).join(" ")}`.toLowerCase()
  );

  const shortsCount = L.filter(
    (v) => (v.durationSec > 0 && v.durationSec <= 60) || /#shorts?\b/i.test(v.title ?? "")
  ).length;
  const brainrotTitles = hay.filter((t) => BRAINROT_RE.test(t)).length;
  const lowEffort = hay.filter((t) => LOW_EFFORT_RE.test(t)).length;
  const edu = L.filter((v) => ["27", "28", "26"].includes(v.categoryId)).length;
  const nightLikes = L.filter((v) => {
    const h = hourIn(v.likedAt, tz);
    return h >= 0 && h < 5;
  }).length;

  const byCh = new Map<string, number>();
  L.forEach((v) => {
    const ch = v.channelTitle || "Unknown";
    byCh.set(ch, (byCh.get(ch) ?? 0) + 1);
  });
  const topChannels = [...byCh]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const top3Share = topChannels.slice(0, 3).reduce((s, c) => s + c.count, 0) / total;

  const catCount = new Map<string, number>();
  L.forEach((v) => {
    const c = CATEGORY_NAMES[v.categoryId] ?? "Other";
    catCount.set(c, (catCount.get(c) ?? 0) + 1);
  });
  const topCategories = [...catCount]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, c]) => ({ name, share: c / total }));

  const likedCh = new Set(L.map((v) => v.channelId));
  const subs = n.subs ?? [];
  const ghostSubs = subs.filter((s) => !likedCh.has(s.channelId)).length;

  const playlists = n.playlists ?? [];
  const tutorialsSaved =
    playlists
      .filter((p) => TUTORIAL_RE.test((p.title ?? "").toLowerCase()))
      .reduce((s, p) => s + (p.itemCount ?? 0), 0) +
    hay.filter((t) => TUTORIAL_RE.test(t)).length;

  const ratios = {
    shorts: shortsCount / total,
    brainrot: brainrotTitles / total,
    lowEffort: lowEffort / total,
    educational: edu / total,
    night: nightLikes / total,
    top3Share,
  };

  // tune weights freely; keep them summing to 1
  const raw =
    0.3 * norm(ratios.brainrot, 0.25) +
    0.25 * norm(ratios.shorts, 0.6) +
    0.15 * norm(ratios.lowEffort, 0.5) +
    0.1 * norm(ratios.night, 0.4) +
    0.1 * norm(ratios.top3Share, 0.6) +
    0.1 * (1 - norm(ratios.educational, 0.5));

  const brainRotScore = Math.round(clamp(raw) * 100);
  const tier: Tier =
    brainRotScore >= 85
      ? "S"
      : brainRotScore >= 70
      ? "A"
      : brainRotScore >= 50
      ? "B"
      : brainRotScore >= 30
      ? "C"
      : brainRotScore >= 15
      ? "D"
      : "F";

  const rarity: Rarity =
    brainRotScore >= 90
      ? "Mythic"
      : brainRotScore >= 75
      ? "Legendary"
      : brainRotScore >= 55
      ? "Epic"
      : brainRotScore >= 35
      ? "Rare"
      : "Common";

  const j = (span: number) => Math.round((rnd() - 0.5) * 2 * span);
  const aura =
    Math.round(
      4000 * ratios.educational -
        8000 * ratios.brainrot -
        3000 * ratios.shorts -
        2000 * ratios.night
    ) + j(300);

  const digitalAge = Math.round(
    clamp(
      30 -
        18 * norm(ratios.shorts, 0.6) -
        8 * norm(ratios.brainrot, 0.25) +
        10 * norm(ratios.educational, 0.5) +
        j(2),
      9,
      72
    )
  );

  const npc = Math.round(
    clamp(
      0.6 * norm(top3Share, 0.6) + 0.4 * norm(ratios.shorts, 0.6) + j(5) / 100,
      0.02,
      0.98
    ) * 100
  );

  const rizz = Math.round(
    clamp(
      1 -
        (0.5 * norm(ratios.shorts, 0.6) + 0.5 * norm(ratios.brainrot, 0.25)) +
        j(6) / 100,
      0.01,
      0.99
    ) * 100
  );

  const mainCharacter = Math.round(
    clamp(1 - npc / 100 + j(6) / 100, 0.03, 0.97) * 100
  );

  const receiptCandidates = buildReceipts({
    shortsCount,
    nightLikes,
    ghostSubs,
    tutorialsSaved,
    brainrotTitles,
    topChannels,
    n,
    total,
  });

  return {
    counts: { likes: L.length, subs: subs.length, playlists: playlists.length },
    ratios,
    topCategories,
    topChannels,
    ghostSubs,
    tutorialsSaved,
    shortsCount,
    nightLikes,
    brainrotTitles,
    brainRotScore,
    tier,
    rarity,
    aura,
    digitalAge,
    rizz,
    npc,
    mainCharacter,
    receiptCandidates,
    partial,
    sensitiveSkew: false, // set by buildSample (§8.4)
  };
}
