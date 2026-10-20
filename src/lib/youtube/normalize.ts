import { Normalized, VideoItem, InsufficientDataResult } from "./types";

/**
 * Converts ISO 8601 duration format (e.g. "PT1H2M10S", "PT45S", "P1DT2H") to seconds.
 */
export function isoToSec(iso: string): number {
  if (!iso || typeof iso !== "string") return 0;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!m) return 0;

  const days = +(m[1] ?? 0);
  const hours = +(m[2] ?? 0);
  const minutes = +(m[3] ?? 0);
  const seconds = +(m[4] ?? 0);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Sanitizes untrusted video titles, tags, and channel names to mitigate prompt injection.
 * Strips HTML tags, delimiters like <data> or markdown fences, and excessive whitespace.
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/<[^>]*>/g, "") // strip html/xml tags
    .replace(/[`${}[\]]/g, "") // strip backticks, template string and bracket delimiters
    .replace(/[\r\n\t]+/g, " ") // normalize newlines and tabs to space
    .replace(/\s{2,}/g, " ") // collapse multiple spaces
    .trim()
    .slice(0, 150); // limit length to avoid token bloating
}

/**
 * Checks if the user's account has insufficient data for a meaningful roast.
 * Requirement: < 15 likes and < 10 subs.
 */
export function isInsufficientData(n: Normalized): boolean {
  return n.likes.length < 15 && n.subs.length < 10;
}

/**
 * Returns canned empty/insufficient data card message for 3 supported locales.
 */
export function getInsufficientDataCard(n: Normalized): InsufficientDataResult {
  const isPrivateLikes = n.likes.length === 0 && n.subs.length > 0;

  return {
    insufficient: true,
    reason: isPrivateLikes ? "private_likes" : "empty",
    message: {
      en: isPrivateLikes
        ? "Your liked videos are private or empty! Please make sure your liked videos are visible, or watch and like a few more videos."
        : "Your YouTube is suspiciously empty. Go watch something before we can cook you.",
      tanglish: isPrivateLikes
        ? "Un liked videos private-ah irukku polaye! Settings-la check panni konjam public aakku, illa innum konjam videos like pannu."
        : "Un YouTube suspicious-ah empty-ah irukku. Pogi edhavadhu paaru, appo thaan roast panna mudiyum.",
      hinglish: isPrivateLikes
        ? "Tumhare liked videos private lag rahe hain! Settings check karke unhe visible karo ya kuch aur videos like karo."
        : "Tera YouTube shak karne layak khaali hai. Pehle kuch dekh le, fir aana roast hone.",
    },
    stats: {
      likesCount: n.likes.length,
      subsCount: n.subs.length,
    },
  };
}
