"use client";

import React, { forwardRef } from "react";
import {
  Flame,
  Crown,
  Play,
  Users,
  Moon,
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  Smile,
  Sparkles,
} from "lucide-react";
import {
  getBrainrotCharacter,
  getBrainrotBadges,
  BRAINROT_IMAGES,
} from "@/lib/brainrot";

export interface ScorecardProps {
  roast: {
    slug: string;
    persona: string;
    lang: string;
    heat: string;
    content: {
      tier_title: string;
      diagnosis: { condition: string; symptoms: string[]; treatment: string };
      red_flag: string;
      green_flag: string;
      roast: string;
      share_line: string;
      aura_comment: string;
    };
    stats?: {
      counts: { likes: number; subs: number; playlists: number };
      shortsCount: number;
      nightLikes: number;
      tutorialsSaved: number;
      brainRotScore: number;
      tier: string;
      rarity: string;
      aura: number;
      topChannels?: { name: string; count: number }[];
      topCategories?: { name: string; share: number }[];
    } | null;
  };
}

const RARITY_COLORS: Record<string, string> = {
  Legendary: "bg-[#ea580c] text-white border-black",
  Epic: "bg-[#9333ea] text-white border-black",
  Rare: "bg-[#2563eb] text-white border-black",
  Common: "bg-[#475569] text-white border-black",
};

export const ScorecardCard = forwardRef<HTMLDivElement, ScorecardProps>(
  function ScorecardCard({ roast }, ref) {
    const st = roast.stats;
    const score = st?.brainRotScore ?? 45;
    const tier = st?.tier ?? "C";
    const tierTitle = roast.content?.tier_title || "Lightly Toasted";
    const aura = st?.aura ?? -2041;
    const shortsCount = st?.shortsCount ?? 230;
    const nightLikes = st?.nightLikes ?? 0;
    const tutorialsSaved = st?.tutorialsSaved ?? 6;

    // Top obsession channel or category
    const topChannel = st?.topChannels?.[0]?.name;
    const topCategory = st?.topCategories?.[0]?.name;
    const obsessionName = topChannel || topCategory || "Algorithm Loops";
    const obsessionCount =
      st?.topChannels?.[0]?.count ?? Math.max(12, Math.round(shortsCount * 0.22));

    // Clean up aura display text to prevent duplication
    const rawAura = roast.content?.aura_comment || "Generational aura deficit in progress.";
    const auraDisplay = rawAura.toLowerCase().includes("aura")
      ? rawAura
      : `${aura} aura: ${rawAura}`;

    // Select character and badges from image-references-brainrot
    const character = getBrainrotCharacter({
      persona: roast.persona,
      score,
      tier,
      heat: roast.heat,
      lang: roast.lang,
      nightLikes,
      tutorialsSaved,
      shortsCount,
      aura,
    });

    const badges = getBrainrotBadges({
      score,
      tier,
      heat: roast.heat,
      lang: roast.lang,
      nightLikes,
      tutorialsSaved,
      shortsCount,
      aura,
    });

    // Vibe status
    const vibeStatus =
      score >= 80
        ? "BURNT"
        : score >= 60
        ? "COOKED"
        : score >= 40
        ? "LIGHT TOAST"
        : "RAW";

    return (
      <div
        ref={ref}
        id="roasttube-scorecard-export"
        className="w-[620px] min-w-[620px] max-w-[620px] mx-auto bg-[#faf4e6] text-[#18130f] border-[3.5px] border-black rounded-3xl p-6 shadow-[10px_10px_0_#18130f] relative font-sans select-none overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(#d6cbaf 1.2px, transparent 1.2px)",
          backgroundSize: "18px 18px",
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-black/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#ffd23f] border-2 border-black flex items-center justify-center p-1 shadow-[2px_2px_0_#18130f] overflow-hidden">
              <img
                src={BRAINROT_IMAGES.popcatSparkles}
                alt="RoastTube Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="display text-2xl tracking-wider leading-none">
              ROAST<span className="text-[#f22968]">TUBE</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mono text-xs font-black tracking-widest text-[#3b332a]">
            <span>YOUR PERSONAL ROAST CARD</span>
            <Crown size={15} className="text-[#f6ce47] fill-[#f6ce47]" />
          </div>
        </div>

        {/* Main Title Banner */}
        <div className="text-center my-3.5">
          <h1 className="display text-5xl tracking-tight leading-none">
            BRAINROT <span className="text-[#f22968]">REPORT</span>
          </h1>
          <p className="mono text-[11px] font-black tracking-[0.22em] text-[#635543] mt-1.5 uppercase">
            YOUR YOUTUBE HABITS • ROASTED • ANALYZED • NO MERCY
          </p>
        </div>

        {/* Upper 2-Column Section: Fixed Width Trading Card + Stats Panel */}
        <div className="flex flex-row gap-4 mt-2">
          {/* Left: Ornate Cyber/Comic Trading Card - FIXED 235px WIDTH */}
          <div className="w-[235px] shrink-0 rounded-2xl bg-[#0f0c0a] border-[3px] border-[#e4a826] p-2.5 shadow-[0_0_15px_rgba(228,168,38,0.35)] flex flex-col justify-between overflow-hidden">
            {/* Top Card Bar */}
            <div className="flex items-center justify-between z-10 px-1 pt-0.5">
              <span className="bg-[#ffd23f] text-black font-black text-[9px] px-2 py-0.5 rounded border border-black uppercase tracking-wider">
                ROASTTUBE
              </span>
              <span className="mono font-black text-xs text-[#ffd23f]">
                {character.tag}
              </span>
            </div>

            {/* Character Illustration with comic overlay badges */}
            <div className="relative my-2 w-full aspect-square rounded-xl overflow-hidden border-2 border-[#e4a826]/70 bg-gradient-to-b from-[#2b1c11] to-[#120a06] flex items-center justify-center">
              <img
                src={character.url}
                alt={character.title}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />

              {/* Hand-drawn graffiti overlay */}
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span className="display text-xs text-[#f6ce47] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] -rotate-6 inline-block leading-tight">
                  SAME HABITS<br />TOMORROW BRO...
                </span>
              </div>
              <div className="absolute top-2 right-2 text-[#f22968] z-10">
                <Crown size={20} className="fill-[#f6ce47] stroke-black" />
              </div>

              {/* Bottom Card Title Ribbon */}
              <div className="absolute bottom-1.5 inset-x-1.5 z-10 bg-gradient-to-r from-[#d97706] via-[#fbbf24] to-[#d97706] text-black font-black text-[10px] py-1 px-1.5 rounded border border-black shadow-md text-center truncate">
                ★ {character.title} ★
              </div>
            </div>

            {/* Trading Card Micro Footer */}
            <div className="flex justify-between items-center text-[8px] mono font-bold text-[#d4af37] px-1 py-0.5 border-t border-[#e4a826]/30">
              <span>∞ SCROLL</span>
              <span>•</span>
              <span>📊 WATCH</span>
              <span>•</span>
              <span>♥ LIKE</span>
              <span>•</span>
              <span>🔄 REPEAT</span>
            </div>
          </div>

          {/* Right: Stats Panel */}
          <div className="flex-1 min-w-0 rounded-2xl bg-[#14100c] text-[#fff8e8] border-[3px] border-black p-4 flex flex-col justify-between shadow-[4px_4px_0_#18130f]">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] font-black text-[#ffd23f] tracking-wider">
                  BRAINROT SCORE
                </span>
                <span className="mono text-[10px] font-bold text-[#d6c9b5] uppercase">
                  {st?.rarity ?? "Epic"}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-1">
                <span className="display text-6xl leading-none text-[#f22968]">
                  {score}
                </span>
                <span className="display text-2xl text-white/70">/100</span>
              </div>

              {/* Progress bar */}
              <div className="h-3 border border-white/40 bg-black/60 rounded-full p-0.5 mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#ffd23f] to-[#f22968] rounded-full"
                  style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
                />
              </div>

              <div className="mt-2">
                <div className="text-xs font-black text-white uppercase tracking-wide">
                  TIER {tier} • {tierTitle}
                </div>
                <div className="text-[11px] text-[#f6ce47] mono mt-0.5 truncate">
                  {auraDisplay}
                </div>
              </div>
            </div>

            {/* Stat rows */}
            <div className="space-y-2 mt-2.5 pt-2 border-t border-white/10 text-xs">
              {/* Row 1: Shorts */}
              <div>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#f22968]">
                    <Play size={12} className="fill-[#f22968]" /> SHORT-FORM LIKES
                  </span>
                  <span className="mono font-black text-white">{shortsCount}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#f22968]"
                    style={{
                      width: `${Math.min(100, Math.max(10, (shortsCount / 300) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-[#a89b88] mt-0.5">
                  Logged {shortsCount} on Short-form videos liked.
                </p>
              </div>

              {/* Row 2: Creator Obsession */}
              <div>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#ffd23f]">
                    <Users size={12} /> CREATOR OBSESSION
                  </span>
                  <span className="mono font-black text-white">{obsessionCount}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#ffd23f]"
                    style={{
                      width: `${Math.min(100, Math.max(15, (obsessionCount / 60) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-[#a89b88] mt-0.5 truncate">
                  Obsessed with {obsessionName}.
                </p>
              </div>

              {/* Row 3: Night Likes */}
              <div>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#60a5fa]">
                    <Moon size={12} /> NIGHT LIKES
                  </span>
                  <span className="mono font-black text-white">{nightLikes}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#60a5fa]"
                    style={{
                      width: `${Math.min(100, Math.max(5, (nightLikes / 40) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-[#a89b88] mt-0.5">
                  Likes around midnight hours.
                </p>
              </div>

              {/* Row 4: Tutorials */}
              <div>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#4ade80]">
                    <Bookmark size={12} /> SAVED TUTORIALS
                  </span>
                  <span className="mono font-black text-white">{tutorialsSaved}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#4ade80]"
                    style={{
                      width: `${Math.min(100, Math.max(10, (tutorialsSaved / 20) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-[#a89b88] mt-0.5">
                  Matched from playlists and likes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: THE ROAST */}
        <div className="mt-3.5 rounded-2xl bg-[#fffef9] border-2 border-[#f22968]/50 p-3.5 relative shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="mono text-[10px] font-black tracking-widest text-[#f22968] uppercase">
              THE ROAST
            </span>
            <Flame size={18} className="text-[#f22968] fill-[#f22968]" />
          </div>
          <h2 className="display text-2xl text-black leading-tight">
            {roast.content?.diagnosis?.condition ||
              "SUBCLINICAL YOUTUBE HABIT SYNDROME"}
          </h2>
          <p className="text-sm font-semibold leading-relaxed mt-1 text-[#2d251e] italic">
            “{roast.content?.roast
              ? roast.content.roast.slice(0, 160) +
                (roast.content.roast.length > 160 ? "…" : "")
              : "Your recommendations need a map and an intervention."}”
          </p>
        </div>

        {/* Bottom 3 Metric Cards: Red Flags, Green Flags, Vibe Check */}
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          {/* Red Flag */}
          <div className="rounded-xl border-2 border-black bg-[#ffe4e6] p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#e11d48]">
                <AlertTriangle size={13} /> RED FLAGS
              </div>
              <div className="display text-3xl text-[#e11d48] leading-none mt-1">
                02
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#881337] mt-1 line-clamp-2 leading-snug">
              {roast.content?.red_flag || "One last video like it is a contract."}
            </p>
          </div>

          {/* Green Flag */}
          <div className="rounded-xl border-2 border-black bg-[#dcfce7] p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#15803d]">
                <CheckCircle2 size={13} /> GREEN FLAGS
              </div>
              <div className="display text-3xl text-[#15803d] leading-none mt-1">
                01
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#14532d] mt-1 line-clamp-2 leading-snug">
              {roast.content?.green_flag || "At least you have taste in something."}
            </p>
          </div>

          {/* Vibe Check */}
          <div className="rounded-xl border-2 border-black bg-[#fef3c7] p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#b45309]">
                <Smile size={13} /> VIBE CHECK
              </div>
              <div className="display text-xl text-black leading-none mt-1">
                {vibeStatus}
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#78350f] mt-1 line-clamp-2 leading-snug">
              {character.quote}
            </p>
          </div>
        </div>

        {/* Badges Section: NO SCROLLBAR, LARGER MEME IMAGES, NO CUT OFF WORDS */}
        <div className="mt-3.5 bg-[#f0e6d2] border-2 border-black rounded-xl p-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="mono text-[11px] font-black text-[#3d3326] uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#f22968]" /> EARNED BADGES (ALL VISIBLE)
            </span>
            <span className="text-[10px] font-bold text-[#6d5b45]">
              {badges.length} UNLOCKED
            </span>
          </div>

          {/* Clean 2-column grid: NO scrollbar, larger meme images, no cut words */}
          <div className="grid grid-cols-2 gap-2.5">
            {badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0_#18130f]"
              >
                {/* Large Meme Image (w-14 h-14 / 56px) so the meme is clearly visible */}
                <div className="w-14 h-14 rounded-xl bg-[#ffd23f] border-2 border-black overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                  <img
                    src={badge.imageUrl}
                    alt={badge.name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-[11.5px] text-black leading-snug">
                      {badge.name}
                    </span>
                    <span
                      className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        RARITY_COLORS[badge.rarity] || "bg-gray-700 text-white border-black"
                      }`}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                  {/* Full description without truncate or line-clamp-1 so no words get cut */}
                  <p className="text-[10px] text-[#4b3f30] font-semibold leading-tight mt-1">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Pill */}
        <div className="mt-3.5">
          <div className="bg-[#18130f] text-[#fff8e8] py-2 px-4 rounded-xl border-2 border-black flex items-center justify-between text-xs font-black tracking-wider shadow-[3px_3px_0_#f22968]">
            <span className="text-[#ffd23f]">✦ ROASTTUBE</span>
            <span>THE RECEIPTS DON’T LIE</span>
            <span className="text-[#ffd23f]">✦</span>
          </div>
          <p className="text-center text-[9px] text-[#786b59] mt-1 font-bold">
            Based on available likes, subscriptions and playlists. Read-only audit.
          </p>
        </div>
      </div>
    );
  }
);
