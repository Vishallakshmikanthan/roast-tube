"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  INTRO_TARGET_DURATION,
  INTRO_SAFETY_TIMEOUT_MS,
  INTRO_FADE_DURATION_MS,
  shouldPlayIntro,
  safeGetIntroSeen,
  safeSetIntroSeen,
} from "@/lib/intro";

export interface RoastTubeIntroProps {
  onComplete?: () => void;
  videoSrc?: string;
  targetDuration?: number;
  forcePlay?: boolean;
}

export function RoastTubeIntro({
  onComplete,
  videoSrc = "/videos/roasttube-intro.mp4",
  targetDuration = INTRO_TARGET_DURATION,
  forcePlay = false,
}: RoastTubeIntroProps) {
  // Start with null/false so SSR does not mismatch. We verify in useEffect.
  const [shouldRender, setShouldRender] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishedRef = useRef(false);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const taglineTimerRef = useRef<NodeJS.Timeout | null>(null);

  const finishIntro = useCallback(
    (immediate = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      // Mark seen in session storage
      safeSetIntroSeen(typeof window !== "undefined" ? window.sessionStorage : null);

      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (taglineTimerRef.current) clearTimeout(taglineTimerRef.current);

      if (immediate) {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setShouldRender(false);
        onComplete?.();
        return;
      }

      // Begin graceful fade
      setIsFading(true);
      fadeTimerRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setShouldRender(false);
        onComplete?.();
      }, INTRO_FADE_DURATION_MS);
    },
    [onComplete]
  );

  useEffect(() => {
    // 1. Check URL query params for manual test trigger (?intro=1 or ?replay=1)
    const urlParams = new URLSearchParams(window.location.search);
    const forceFromUrl =
      urlParams.get("intro") === "1" || urlParams.get("replay") === "1";

    const hasSeen = safeGetIntroSeen(window.sessionStorage);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const shouldPlay = shouldPlayIntro({
      hasSeenIntro: hasSeen,
      prefersReducedMotion,
      forcePlay: forcePlay || forceFromUrl,
    });

    if (!shouldPlay) {
      // Clean up directly
      setShouldRender(false);
      onComplete?.();
      return;
    }

    setShouldRender(true);

    // 2. Safety fallback timer: If video stalls or takes too long to load, reveal homepage
    safetyTimerRef.current = setTimeout(() => {
      finishIntro(true);
    }, INTRO_SAFETY_TIMEOUT_MS);

    // 3. Tagline reveal timer: Reveal tagline as mascot-to-logo transition completes (~1.0s)
    taglineTimerRef.current = setTimeout(() => {
      setShowTagline(true);
    }, 950);

    // 4. Keyboard listener (Escape key skips immediately)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finishIntro(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (taglineTimerRef.current) clearTimeout(taglineTimerRef.current);
    };
  }, [forcePlay, onComplete, finishIntro]);

  // Attempt autoplay once mounted
  const handleCanPlay = () => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked by browser policy -> immediately reveal homepage
          finishIntro(true);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    if (videoRef.current.currentTime >= targetDuration) {
      finishIntro(false);
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <aside
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden select-none transition-opacity ease-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ transitionDuration: `${INTRO_FADE_DURATION_MS}ms` }}
      aria-label="RoastTube Intro Animation"
      role="dialog"
      aria-modal="true"
    >
      {/* Screen reader announcement */}
      <span className="sr-only" role="status">
        RoastTube introduction animation playing. Press Escape to skip.
      </span>

      {/* Accessible Skip Button */}
      <button
        type="button"
        onClick={() => finishIntro(true)}
        className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold mono uppercase tracking-wider text-[#f5edda] bg-[#18130f]/80 hover:bg-[#f22968] hover:text-white border-2 border-[#f5edda]/30 rounded-sm shadow-[2px_2px_0_#000] cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#f6ce47]"
        aria-label="Skip introduction animation"
      >
        <span>Skip intro</span>
        <kbd className="hidden sm:inline-block px-1 py-0.5 text-[10px] bg-white/10 rounded border border-white/20">
          Esc
        </kbd>
      </button>

      {/* Video Container (Strict 16:9 aspect ratio preservation) */}
      <div className="relative w-full max-w-[1240px] px-4 flex flex-col items-center justify-center">
        <div className="relative w-full aspect-video max-h-[75vh] flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            muted
            autoPlay
            preload="auto"
            onCanPlay={handleCanPlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => finishIntro(false)}
            onError={() => finishIntro(true)}
            className="w-full h-full object-contain pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Real Brand Tagline rendered in crisp HTML/CSS */}
        <div
          className={`mt-4 text-center transition-all duration-300 transform ${
            showTagline
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
          aria-hidden="true"
        >
          <p className="mono font-bold tracking-[0.22em] text-[#f6ce47] text-sm sm:text-base md:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            YOUR WATCH HISTORY. OUR ROAST.
          </p>
        </div>
      </div>
    </aside>
  );
}
