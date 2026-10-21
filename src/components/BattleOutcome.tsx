"use client";

import { useState } from "react";
import { Check, Copy, Swords } from "lucide-react";

export type BattleResult = {
  verdict_title: string;
  duo_roast: string;
  winner_line: string;
  loser_line?: string;
  wifi_line?: string;
  shared_sin: string;
  share_line?: string;
  nameA?: string;
  nameB?: string;
  comparison: {
    scoreA: number;
    scoreB: number;
    compatibility: number;
    worse?: "A" | "B" | "tie";
    shared?: string[];
  };
};

export const sampleBattle: BattleResult = {
  verdict_title: "Same Wi-Fi. Different problems.",
  duo_roast:
    "One of you saves tutorials for tomorrow. The other watches productivity videos to avoid being productive. Together, you could almost finish a single task.",
  winner_line: "Player B wins this sample round. Less cooked is still cooked.",
  shared_sin: "An impressive commitment to taking one more scroll break.",
  nameA: "Player A",
  nameB: "Player B",
  comparison: { scoreA: 78, scoreB: 64, compatibility: 72 },
};

export function BattleOutcome({
  result,
  sample,
  battleCode,
  onNewBattle,
}: {
  result: BattleResult;
  sample: boolean;
  battleCode?: string;
  onNewBattle?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyResult = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = battleCode
        ? `${origin}/battle?code=${encodeURIComponent(battleCode)}`
        : typeof window !== "undefined"
          ? window.location.href
          : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const nameA = result.nameA || "Player A";
  const nameB = result.nameB || "Player B";

  return (
    <article className="comic-card p-6 mt-7 bg-[#18130f] text-[#fff8e8] animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mono text-xs text-[#f6ce47]">
          {sample ? "SAMPLE BATTLE / ILLUSTRATIVE DATA" : "⚔️ LIVE BATTLE RESULT"}
        </p>
        <span className="mono text-xs px-2 py-0.5 border border-[#f6ce47] text-[#f6ce47]">
          COMPATIBILITY: {result.comparison.compatibility}%
        </span>
      </div>

      <h2 className="display text-4xl md:text-5xl mt-3 text-[#fff8e8]">
        {result.verdict_title}
      </h2>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-3 my-6">
        {[
          [nameA, result.comparison.scoreA, "/images/pixel-cat-cutout.webp"],
          [nameB, result.comparison.scoreB, "/images/judging-cat.webp"],
        ].map(([name, score, image], index) => (
          <div key={String(name)} className="contents">
            {index === 1 && (
              <strong className="display text-4xl text-[#f22968] animate-pulse">
                VS
              </strong>
            )}
            <div className="border-2 border-[#f5edda] p-3 bg-[#241c16]">
              <img
                src={String(image)}
                alt=""
                className="h-24 md:h-28 object-contain mx-auto"
              />
              <p className="mono text-xs font-bold uppercase mt-2 truncate text-[#f6ce47]">
                {name}
              </p>
              <p className="display text-4xl md:text-5xl text-[#f22968] mt-1">
                {score}
                <span className="text-xl md:text-2xl text-[#fff8e8]">/100</span>
              </p>
              <p className="mono text-[10px] text-[#cfbeaa]">BRAIN ROT SCORE</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-[#3d3128] pt-4">
        <div className="p-3 bg-[#281e18] border-l-4 border-[#f6ce47]">
          <p className="font-bold text-[#f6ce47]">{result.winner_line}</p>
          {result.loser_line && (
            <p className="text-sm text-[#e6d8c5] mt-1">{result.loser_line}</p>
          )}
        </div>

        <p className="text-base leading-relaxed text-[#fff8e8]">{result.duo_roast}</p>

        {result.shared_sin && (
          <div className="text-sm text-[#cfbeaa] flex items-start gap-2">
            <span className="text-[#f22968] font-bold">●</span>
            <span>{result.shared_sin}</span>
          </div>
        )}

        {result.wifi_line && (
          <p className="text-xs italic text-[#e6d8c5] border-t border-[#3d3128] pt-2">
            “{result.wifi_line}”
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-[#3d3128]">
        <button
          onClick={copyResult}
          className="comic-button bg-[#f6ce47] text-[#18130f] hover:bg-[#ffe37d] flex items-center gap-2"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Link Copied!" : "Share Battle Result"}
        </button>

        {onNewBattle && (
          <button
            onClick={onNewBattle}
            className="comic-button secondary flex items-center gap-2"
          >
            <Swords size={16} /> Battle Someone Else
          </button>
        )}
      </div>
    </article>
  );
}
