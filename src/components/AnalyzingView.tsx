"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles, Flame, RefreshCw } from "lucide-react";
import { BRAINROT_IMAGES } from "@/lib/brainrot";

export type Lang = "en" | "tanglish" | "hinglish";

export const LOADING_JOKES: Record<Lang, string[]> = {
  en: [
    "Judging your 3 AM watch history.",
    "Contacting your parents.",
    "Calculating how cooked you are.",
    "Counting your Shorts... please wait, this may take a lifetime.",
    "Asking an aunt for her opinion.",
    "Measuring your aura (it is not looking good).",
  ],
  tanglish: [
    "Un 3 AM watch history-ah judge panren.",
    "Un Amma-kitta phone pannitu irukken.",
    "Nee evlo cooked-nu kanakku pannren.",
    "Un Shorts-ah ennitu irukken, konjam wait pannu.",
    "Oru aunty kitta opinion kekkuren.",
    "Un aura-va alandhu paakkuren (nalla illa).",
  ],
  hinglish: [
    "Tere 3 baje ke watch history ko judge kar raha hoon.",
    "Tere ghar wale ko phone laga raha hoon.",
    "Check kar raha hoon tu kitna cooked hai.",
    "Tere Shorts gin raha hoon, thoda wait kar.",
    "Aunty se opinion le raha hoon.",
    "Teri aura naap raha hoon (scene achha nahi hai).",
  ],
};

const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  tanglish: "Tanglish (Tamil + EN)",
  hinglish: "Hinglish (Hindi + EN)",
};

interface AnalyzingViewProps {
  lang: Lang;
  onLanguageChange?: (lang: Lang) => void;
  busy?: boolean;
  error?: string;
  onRetry?: () => void;
  demo?: boolean;
}

export default function AnalyzingView({
  lang,
  onLanguageChange,
  busy = true,
  error,
  onRetry,
  demo = false,
}: AnalyzingViewProps) {
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const jokes = LOADING_JOKES[lang] || LOADING_JOKES.en;

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentJokeIndex((prev) => (prev + 1) % jokes.length);
        setFade(true);
      }, 250);
    }, 2000); // Rotate every 2s per Section 12.5 of implementation plan

    return () => clearInterval(timer);
  }, [jokes.length]);

  return (
    <section className="comic-card max-w-2xl mx-auto p-6 md:p-10 my-8 text-center relative overflow-hidden shadow-[8px_8px_0_#18130f]">
      {/* Decorative comic stamps */}
      <div className="absolute -top-3 -right-3 rotate-12 bg-[#f22968] text-white font-extrabold text-xs px-4 py-1 border-2 border-black shadow-[3px_3px_0_#18130f] flex items-center gap-1">
        <Flame size={14} /> LIVE AUDIT
      </div>

      {demo && (
        <p className="mono text-xs font-bold text-[#f22968] mb-3">
          SAMPLE PREVIEW / NO GOOGLE DATA ACCESSED
        </p>
      )}

      {/* Calculating Cat Meme Mascot */}
      <div className="relative mx-auto w-40 h-40 my-3">
        <div className="absolute inset-0 rounded-2xl bg-[#ffd23f] border-2 border-black rotate-3 shadow-[4px_4px_0_#18130f]"></div>
        <img
          src={BRAINROT_IMAGES.mathGalaxyCat}
          alt="Calculating math cat"
          className="relative z-10 w-full h-full object-cover rounded-2xl border-2 border-black -rotate-2"
        />
        <div className="absolute -bottom-2 -left-3 z-20 bg-[#18130f] text-[#f6ce47] text-[10px] mono px-2 py-0.5 border border-white font-bold">
          SOLVING 3 AM MATH
        </div>
      </div>

      <h1 className="display text-4xl md:text-5xl mt-4 leading-tight">
        ANALYSIS IN PROGRESS
      </h1>

      <p className="mt-2 text-sm text-[#4b4034] font-medium max-w-md mx-auto">
        Auditing your likes, subscriptions and playlists. Zero mercy, 100% receipts.
      </p>

      {/* Language Switcher for Roast / Jokes */}
      <div className="mt-5 inline-flex items-center gap-1 bg-[#ede2cb] p-1.5 border-2 border-black rounded-lg">
        <span className="text-xs font-bold px-2 text-[#5a4e3e]">ROAST DIALECT:</span>
        {(["en", "tanglish", "hinglish"] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLanguageChange?.(l)}
            className={`px-3 py-1 text-xs font-extrabold rounded border transition-all ${
              lang === l
                ? "bg-[#f22968] text-white border-black shadow-[2px_2px_0_#18130f]"
                : "bg-white text-black border-transparent hover:border-black"
            }`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      {/* Rotating 2s Joke Box */}
      <div className="mt-6 min-h-[96px] flex items-center justify-center">
        <div className="w-full bg-[#18130f] text-[#fff8e8] border-2 border-black p-4 rounded-xl shadow-[4px_4px_0_#f22968] relative">
          <div className="absolute -top-3 left-4 bg-[#ffd23f] text-black text-[10px] font-extrabold px-2 py-0.5 border border-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} /> AI THOUGHT PROCESS
          </div>
          <p
            className={`text-base md:text-lg font-bold leading-snug transition-opacity duration-200 ${
              fade ? "opacity-100 scale-100" : "opacity-20 scale-95"
            }`}
          >
            “{jokes[currentJokeIndex]}”
          </p>
          <div className="mono text-[11px] text-[#f6ce47] mt-1.5 opacity-80">
            Step {currentJokeIndex + 1} of {jokes.length} · Rotating every 2s
          </div>
        </div>
      </div>

      {/* Progress Bars and Actions */}
      <div className="mt-6 max-w-md mx-auto">
        <div className="h-3 border-2 border-black bg-white rounded-full overflow-hidden p-0.5 shadow-[2px_2px_0_#18130f]">
          <div
            className="h-full bg-gradient-to-r from-[#ffd23f] via-[#f22968] to-[#9b51e0] rounded-full animate-pulse transition-all duration-500"
            style={{
              width: `${Math.min(95, ((currentJokeIndex + 1) / jokes.length) * 100)}%`,
            }}
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 p-3 bg-[#ffe2e7] border-2 border-[#ed3346] font-bold text-sm text-[#b0132b]"
          >
            {error}
            {onRetry && (
              <button
                onClick={onRetry}
                className="comic-button mt-3 w-full text-sm"
              >
                <RefreshCw size={15} /> Retry analysis
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-[#554a3e]">
            <LoaderCircle className="animate-spin text-[#f22968]" size={16} />
            <span>Analyzing your YouTube collections... please do not close</span>
          </div>
        )}
      </div>
    </section>
  );
}
