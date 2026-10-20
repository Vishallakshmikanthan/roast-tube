// src/lib/llm/moderate.ts
// Identity-term filter: output must not mention protected topics at all.
export const IDENTITY =
  /\b(muslim|hindu|christian|sikh|jewish|buddhist|dalit|brahmin|caste|gay|lesbian|transgender|obese|fat|ugly|autis\w*|disab\w*|cancer|depress\w*|suicid\w*|trump|modi|rahul|bjp|congress|dmk|aiadmk)\b/i;

// Profanity list: severe profanity / slurs across English, Hindi, and Tamil
export const PROFANITY =
  /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|asshole\w*|bastard\w*|nigger\w*|chutiya\w*|bhenchod\w*|madarchod\w*|thevidiya\w*|otha\w*)\b/i;

export function moderate(c: unknown): boolean {
  if (!c || typeof c !== "object") return false;
  const text = JSON.stringify(c);
  return !IDENTITY.test(text) && !PROFANITY.test(text);
}
