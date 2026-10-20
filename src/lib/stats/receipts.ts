// src/lib/stats/receipts.ts: candidates are computed here; LLM only writes the joke for the top 3
import type { Normalized } from "@/lib/youtube/types";

export interface ReceiptCandidate {
  id: string;
  labelEn: string;
  value: string;
  weight: number;
}

export interface BuildReceiptsParams {
  shortsCount: number;
  nightLikes: number;
  ghostSubs: number;
  tutorialsSaved: number;
  brainrotTitles: number;
  topChannels: { name: string; count: number }[];
  n: Normalized;
  total: number;
}

export function buildReceipts(x: BuildReceiptsParams): ReceiptCandidate[] {
  const total = Math.max(x.total || 0, 1);
  const topChName = x.topChannels[0]?.name ?? "one channel";
  const topChCount = x.topChannels[0]?.count ?? 0;

  const c: ReceiptCandidate[] = [
    {
      id: "shorts",
      labelEn: "Short-form videos liked",
      value: String(x.shortsCount),
      weight: x.shortsCount / total,
    },
    {
      id: "night",
      labelEn: "Likes between midnight and 5 AM",
      value: String(x.nightLikes),
      weight: (x.nightLikes / total) * 2,
    },
    {
      id: "ghost",
      labelEn: "Subscriptions you never liked anything from",
      value: String(x.ghostSubs),
      weight: Math.min(1, x.ghostSubs / 80),
    },
    {
      id: "tutorials",
      labelEn: "Tutorials saved or liked",
      value: String(x.tutorialsSaved),
      weight: Math.min(1, x.tutorialsSaved / 40),
    },
    {
      id: "rot",
      labelEn: "Titles with brain rot vocabulary",
      value: String(x.brainrotTitles),
      weight: (x.brainrotTitles / total) * 3,
    },
    {
      id: "topch",
      labelEn: `Likes from ${topChName}`,
      value: String(topChCount),
      weight: (topChCount / total) * 3,
    },
  ];

  return c.sort((a, b) => b.weight - a.weight).slice(0, 5);
}
