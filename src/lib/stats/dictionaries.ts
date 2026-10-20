// src/lib/stats/dictionaries.ts
export const BRAINROT_RE =
  /\b(skibidi|sigma|ohio|rizz|gyatt|mewing|fanum|brain ?rot|looksmax\w*|npc|aura|griddy|subway surfers|minecraft parkour|family guy clip|satisfying|asmr|try not to laugh|you won'?t believe|pov|#fyp|edit)\b/i;

export const LOW_EFFORT_RE =
  /\b(compilation|reaction|reacts?|tiktok|memes?|funny moments|best of|top \d+|shorts|clips?|highlights?)\b/i;

export const TUTORIAL_RE =
  /\b(tutorial|course|learn|roadmap|crash course|full course|masterclass|beginner|bootcamp|how to)\b/i;

export const SENSITIVE_RE =
  /\b(depress\w*|anxiety|panic attack|therapy|suicid\w*|self[- ]?harm|eating disorder|anorexi\w*|bulimi\w*|cancer|chemo\w*|funeral|grief|bereave\w*|divorce|abuse\w*|rape|assault|miscarriage|overdose|addiction|rehab|trauma|ptsd)\b/i;
