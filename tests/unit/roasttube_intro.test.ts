import { describe, it, expect, vi } from "vitest";
import {
  shouldPlayIntro,
  safeGetIntroSeen,
  safeSetIntroSeen,
  INTRO_STORAGE_KEY,
  INTRO_TARGET_DURATION,
  INTRO_SAFETY_TIMEOUT_MS,
  INTRO_FADE_DURATION_MS,
} from "@/lib/intro";

describe("RoastTubeIntro Unit Tests", () => {
  describe("Gating & Session Logic", () => {
    it("plays intro for first-time visitor under normal conditions", () => {
      const result = shouldPlayIntro({
        hasSeenIntro: false,
        prefersReducedMotion: false,
      });
      expect(result).toBe(true);
    });

    it("does not replay intro if user has already seen it this session", () => {
      const result = shouldPlayIntro({
        hasSeenIntro: true,
        prefersReducedMotion: false,
      });
      expect(result).toBe(false);
    });

    it("respects prefers-reduced-motion and skips the intro animation", () => {
      const result = shouldPlayIntro({
        hasSeenIntro: false,
        prefersReducedMotion: true,
      });
      expect(result).toBe(false);
    });

    it("allows forcePlay override for manual preview/testing even if already seen", () => {
      const result = shouldPlayIntro({
        hasSeenIntro: true,
        prefersReducedMotion: false,
        forcePlay: true,
      });
      expect(result).toBe(true);
    });

    it("allows forcePlay override when testing with reduced-motion enabled", () => {
      const result = shouldPlayIntro({
        hasSeenIntro: false,
        prefersReducedMotion: true,
        forcePlay: true,
      });
      expect(result).toBe(true);
    });
  });

  describe("Safe Storage Access", () => {
    it("returns false if storage is null or undefined", () => {
      expect(safeGetIntroSeen(null)).toBe(false);
      expect(safeGetIntroSeen(undefined)).toBe(false);
    });

    it("reads intro seen status correctly from valid storage", () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue("true"),
      };
      expect(safeGetIntroSeen(mockStorage)).toBe(true);
      expect(mockStorage.getItem).toHaveBeenCalledWith(INTRO_STORAGE_KEY);
    });

    it("gracefully catches errors when storage throws in restricted environments", () => {
      const brokenStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error("SecurityError: Access is denied");
        }),
      };
      expect(safeGetIntroSeen(brokenStorage)).toBe(false);
    });

    it("sets intro seen in storage safely", () => {
      const mockStorage = {
        setItem: vi.fn(),
      };
      safeSetIntroSeen(mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith(INTRO_STORAGE_KEY, "true");
    });

    it("safely ignores setItem errors (e.g. QuotaExceededError)", () => {
      const brokenStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error("QuotaExceededError");
        }),
      };
      expect(() => safeSetIntroSeen(brokenStorage)).not.toThrow();
    });
  });

  describe("Timing & Cutoff Validation", () => {
    it("uses 1.4s cutoff to ensure full mascot-to-logo settlement", () => {
      // 0.8s–1.0s video inspection confirmed the logo text is mid-ascent and incomplete.
      // 1.4s is the verified point where the ROASTTUBE logo lockup settles.
      expect(INTRO_TARGET_DURATION).toBe(1.4);
      expect(INTRO_TARGET_DURATION).toBeGreaterThanOrEqual(1.35);
    });

    it("defines an appropriate safety timeout to prevent blocking the homepage", () => {
      expect(INTRO_SAFETY_TIMEOUT_MS).toBe(2500);
      expect(INTRO_SAFETY_TIMEOUT_MS).toBeGreaterThan(INTRO_TARGET_DURATION * 1000);
    });

    it("specifies smooth fade duration without visible gaps", () => {
      expect(INTRO_FADE_DURATION_MS).toBe(400);
    });
  });
});
