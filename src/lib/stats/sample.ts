// src/lib/stats/sample.ts
import { rngFrom } from "@/lib/seed";
import type { Normalized } from "@/lib/youtube/types";
import { SENSITIVE_RE } from "./dictionaries";
import type { Stats } from "./compute";

export type Sample = {
  channels: string[];
  titles: string[];
  playlists: string[];
};

export const clean = (s: string, max: number): string =>
  (s ?? "")
    .replace(/[<>`]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export function buildSample(
  n: Normalized,
  stats: Stats,
  seedKey: string
): { sample: Sample; sensitiveSkew: boolean } {
  const rnd = rngFrom(seedKey + ":sample");
  const likes = n.likes ?? [];
  const sensitive = likes.filter((v) => SENSITIVE_RE.test(v.title ?? ""));
  const sensitiveSkew =
    sensitive.length / Math.max(likes.length, 1) >= 0.08 || sensitive.length >= 5;
  const safe = likes.filter((v) => !SENSITIVE_RE.test(v.title ?? "")); // sensitive titles never leave our server
  const recent = [...safe]
    .sort((a, b) => b.likedAt.localeCompare(a.likedAt))
    .slice(0, 20);
  const rest = safe
    .filter((v) => !recent.includes(v))
    .sort(() => rnd() - 0.5)
    .slice(0, 20);

  if (stats) {
    stats.sensitiveSkew = sensitiveSkew;
  }

  const topChannelsCleaned = (stats?.topChannels ?? [])
    .filter((c) => !SENSITIVE_RE.test(c.name ?? ""))
    .map((c) => clean(c.name, 60));

  const subsCleaned = (n.subs ?? [])
    .filter((s) => !SENSITIVE_RE.test(s.title ?? ""))
    .slice(0, 25)
    .map((s) => clean(s.title, 60));

  const channels = [...topChannelsCleaned, ...subsCleaned]
    .filter((v, i, a) => a.indexOf(v) === i && v.length > 0)
    .slice(0, 30);

  const titles = [...recent, ...rest]
    .map((v) => clean(v.title, 90))
    .filter((t) => t.length > 0);

  const playlists = (n.playlists ?? [])
    .filter((p) => !SENSITIVE_RE.test(p.title ?? ""))
    .slice(0, 10)
    .map((p) => clean(p.title, 50))
    .filter((p) => p.length > 0);

  return {
    sensitiveSkew,
    sample: {
      channels,
      titles,
      playlists,
    },
  };
}
