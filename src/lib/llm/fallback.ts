// src/lib/llm/fallback.ts
import { RoastContent, type Persona, type Lang } from "@/lib/prompts/schema";
import type { Stats } from "@/lib/stats";

export const TEMPLATES = {
  en: {
    tier: {
      S: "Terminally Cooked",
      A: "Deep Fried",
      B: "Medium Rare Rot",
      C: "Lightly Toasted",
      D: "Barely Warm",
      F: "Suspiciously Healthy",
    },
    roast: (s: Stats) =>
      `You liked ${s.topChannels[0]?.name ?? "the same channel"} ${
        s.topChannels[0]?.count ?? "many"
      } times. That is not a hobby, that is a lifestyle. ${
        s.shortsCount
      } short-form likes later, your attention span has left the chat.`,
    red: "You say 'one last video' like it is a promise.",
    green: "At least you have taste in something.",
    share: (s: Stats) => `I got ${s.brainRotScore}% brain rot. Beat me, I dare you.`,
    diagnosis: {
      condition: "Subclinical YouTube Habit Syndrome",
      symptoms: [
        "Involuntary late-night scrolling reflex",
        "Infinite tutorial accumulation disorder",
        "Selective channel obsession",
      ],
      treatment: "Step outside, touch real grass, and turn on grayscale mode.",
    },
    aura: (s: Stats) =>
      s.aura >= 0
        ? `+${s.aura} aura: Somehow managing to stay positive.`
        : `${s.aura} aura: Generational aura deficit in progress.`,
    digitalAge: (s: Stats) => `Digital age clocked at ${s.digitalAge}. Act your age.`,
    meters: {
      rizz: "Modest rizz with occasional algorithmic flair.",
      npc: "Predominantly organic behavior with slight algorithmic obedience.",
      main_character: "Occasional main character tendencies in dark mode.",
    },
  },
  tanglish: {
    tier: {
      S: "Full-ah Cooked",
      A: "Deep Fried Macha",
      B: "Medium Rot",
      C: "Lightly Toasted",
      D: "Konjam Warm",
      F: "Suspicious-ah Healthy",
    },
    roast: (s: Stats) =>
      `${s.topChannels[0]?.name ?? "Oru channel"}-ku ${
        s.topChannels[0]?.count ?? "romba"
      } like pottirukka. Idhu hobby illa da, lifestyle. ${
        s.shortsCount
      } Shorts like-ku apram un attention span chat-ah vittu poiduchu.`,
    red: "'One last video'nu solra, adhu promise maari.",
    green: "Kam-se-kam ethavadhu-la taste irukku.",
    share: (s: Stats) =>
      `Naan ${s.brainRotScore}% brain rot vaangiruken. Beat pannu paakalam.`,
    diagnosis: {
      condition: "Chronic Night Time Algorithm Kolaru",
      symptoms: [
        "Thoongama 3 AM-ku Shorts scroll panradhu",
        "40 tutorial save pannitu onnum paakkama irukradhu",
        "Orey channel-ah loop-la paathu kaalam thallradhu",
      ],
      treatment: "Konjam veliya poitu, tea kudichittu, phone-ah pakkathula vei.",
    },
    aura: (s: Stats) =>
      s.aura >= 0
        ? `+${s.aura} aura: Paravalla, thapichitta.`
        : `${s.aura} aura: Semma loss bro, recovery kooda kashtam.`,
    digitalAge: (s: Stats) => `Un digital age ${s.digitalAge} dhaan. Romba scene podaatha.`,
    meters: {
      rizz: "Konjam rizz irukku, ana Shorts paathe keduthuta.",
      npc: "Algorithm solradha ketu scroll panra NPC maari.",
      main_character: "Mind voice-la main character, ana reality vera level.",
    },
  },
  hinglish: {
    tier: {
      S: "Pura Cooked",
      A: "Deep Fried Bhai",
      B: "Medium Rot",
      C: "Halka Toasted",
      D: "Bas Thoda Garam",
      F: "Shak Hai, Healthy Hai",
    },
    roast: (s: Stats) =>
      `${s.topChannels[0]?.name ?? "Ek channel"} ko ${
        s.topChannels[0]?.count ?? "bahut"
      } baar like kiya. Ye hobby nahi, lifestyle hai. ${
        s.shortsCount
      } Shorts ke baad tera attention span chat chhod gaya.`,
    red: "'Bas ek aur video' bolta hai jaise promise ho.",
    green: "Kam se kam kisi cheez mein taste to hai.",
    share: (s: Stats) =>
      `Mujhe ${s.brainRotScore}% brain rot mila. Haraa ke dikha.`,
    diagnosis: {
      condition: "Severe Dopamine Loop Bimari",
      symptoms: [
        "3 AM tak phone leke bister pe pade rehna",
        "Tutorial save karke kabhi open na karna",
        "Ek hi channel pe pura din barbaad karna",
      ],
      treatment: "Chai piyo, bahar nikal ke dhoop dekho, aur phone rakh do.",
    },
    aura: (s: Stats) =>
      s.aura >= 0
        ? `+${s.aura} aura: Bhai bach gaya thoda bahut.`
        : `${s.aura} aura: Bhari nuksaan, aura minus mein chali gayi.`,
    digitalAge: (s: Stats) => `Tera digital age ${s.digitalAge} hai. Sudhar ja thoda.`,
    meters: {
      rizz: "Thoda sa rizz hai par algorithm ne tabah kar diya.",
      npc: "Pura algorithm ke ishare pe nachne wala scene.",
      main_character: "Apni duniya ka hero, reality mein doomscroller.",
    },
  },
} as const;

export function buildFallback(
  stats: Stats,
  persona: Persona,
  lang: Lang
): RoastContent {
  const t = TEMPLATES[lang] ?? TEMPLATES.en;
  const tierTitle = t.tier[stats.tier] ?? "YouTube Enthusiast";

  const top1 = stats.topChannels[0]?.name ?? "Favorite Creator";
  const top2 = stats.topChannels[1]?.name ?? "Algorithm Feed";
  const top3 = stats.topChannels[2]?.name ?? "Trending Clips";
  const evidence = [top1, top2, top3];

  const receipts = stats.receiptCandidates.slice(0, 3).map((r) => {
    let joke = `Logged ${r.value} on ${r.labelEn}.`;
    if (lang === "tanglish") {
      joke = `${r.labelEn} count ${r.value} vandhurukku, semma sangadhi.`;
    } else if (lang === "hinglish") {
      joke = `${r.labelEn} mein ${r.value} ka score banaya hai, kya baat hai.`;
    }
    return {
      id: r.id,
      label: r.labelEn.slice(0, 60),
      joke: joke.slice(0, 160),
    };
  });

  while (receipts.length < 3) {
    const idx = receipts.length;
    receipts.push({
      id: `receipt_${idx}`,
      label: "Activity stat",
      joke: "Consistent engagement detected.",
    });
  }

  const result: RoastContent = {
    tier_title: tierTitle.slice(0, 60),
    diagnosis: {
      condition: t.diagnosis.condition.slice(0, 80),
      symptoms: [
        t.diagnosis.symptoms[0].slice(0, 120),
        t.diagnosis.symptoms[1].slice(0, 120),
        t.diagnosis.symptoms[2].slice(0, 120),
      ],
      treatment: t.diagnosis.treatment.slice(0, 140),
    },
    red_flag: t.red.slice(0, 200),
    green_flag: t.green.slice(0, 200),
    roast: t.roast(stats).slice(0, 700),
    evidence: [
      evidence[0].slice(0, 100),
      evidence[1].slice(0, 100),
      evidence[2].slice(0, 100),
    ],
    receipts: receipts.slice(0, 3),
    aura_comment: t.aura(stats).slice(0, 160),
    digital_age_comment: t.digitalAge(stats).slice(0, 160),
    meter_comments: {
      rizz: t.meters.rizz.slice(0, 100),
      npc: t.meters.npc.slice(0, 100),
      main_character: t.meters.main_character.slice(0, 100),
    },
    share_line: t.share(stats).slice(0, 120),
  };

  return RoastContent.parse(result);
}
