/**
 * RoastTube Intro Configuration & Gating Logic
 */

export const INTRO_STORAGE_KEY = "roasttube_intro_seen";

/**
 * Inspection finding:
 * Video total duration is 4.0s (96 frames at 24fps).
 * 0.0s - 0.7s: Cat mascot holds YouTube play button with floating sparkles.
 * 0.7s - 1.0s: Confetti burst starts, mascot transforms into rock-on pose with YouTube hat.
 *              The "ROASTTUBE" logo letters only begin ascending from the bottom at ~0.95s - 1.0s.
 * 1.0s - 1.35s: "ROASTTUBE" text rises up and settles cleanly into final lockup.
 * 1.35s - 4.0s: Visual is static with minor sparkles.
 *
 * Therefore, cutting at 0.8s - 1.0s prematurely cuts off the logo mid-ascent.
 * 1.4s represents the earliest complete mascot-to-logo lockup.
 */
export const INTRO_TARGET_DURATION = 1.4; // seconds
export const INTRO_SAFETY_TIMEOUT_MS = 2500; // ms
export const INTRO_FADE_DURATION_MS = 400; // ms

export interface ShouldPlayIntroOptions {
  hasSeenIntro: boolean;
  prefersReducedMotion: boolean;
  forcePlay?: boolean;
}

export function shouldPlayIntro(options: ShouldPlayIntroOptions): boolean {
  if (options.forcePlay) return true;
  if (options.prefersReducedMotion) return false;
  if (options.hasSeenIntro) return false;
  return true;
}

export function safeGetIntroSeen(storage?: Pick<Storage, "getItem"> | null): boolean {
  try {
    if (!storage) return false;
    return storage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function safeSetIntroSeen(storage?: Pick<Storage, "setItem"> | null): void {
  try {
    if (!storage) return;
    storage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // Ignore storage quota or access errors in incognito / restricted environments
  }
}
