export type BrainrotCharacter = {
  url: string;
  tag: string;
  title: string;
  quote: string;
};

export type BrainrotBadge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
};

// Map of curated images from image-references-brainrot
export const BRAINROT_IMAGES = {
  nuclearCat: "/images/brainrot/image(20261020-112915).png",
  throneKitten: "/images/brainrot/image(20261020-112929).png",
  squattingTiger: "/images/brainrot/image(20261020-113241).png",
  ryanSpeedboat: "/images/brainrot/image(20261020-114011).png",
  ryanThumbsUp: "/images/brainrot/image(20261020-114016).png",
  spongebobFloating: "/images/brainrot/image(20261020-113938).png",
  boxerKitten: "/images/brainrot/image(20261020-113124).png",
  marmotsCook: "/images/brainrot/image(20261020-113911).png",
  mathGalaxyCat: "/images/brainrot/image(20261020-114128).png",
  srkNiche: "/images/brainrot/image(20261020-113002).png",
  depremssiomDoge: "/images/brainrot/image(20261020-113038).png",
  carWindowDoge: "/images/brainrot/image(20261020-113040).png",
  kidneyCheems: "/images/brainrot/image(20261020-113021).png",
  watchCheckingCat: "/images/brainrot/image(20261020-112816).png",
  peaceSignCat: "/images/brainrot/image(20261020-112826).png",
  popcatSparkles: "/images/brainrot/image(20261020-112845).png",
  flowerCreature: "/images/brainrot/image(20261020-112856).png",
  patrickPeak: "/images/brainrot/image(20261020-113326).png",
  ballKnower: "/images/brainrot/image(20261020-114030).png",
  prayingCouncil: "/images/brainrot/image(20261020-114043).png",
  cryingPrayingCat: "/images/brainrot/image(20261020-113142).png",
  respectHandshake: "/images/brainrot/image(20261020-113920).png",
  aiNoThanks: "/images/brainrot/image(20261020-112952).png",
  lionSelfie: "/images/brainrot/image(20261020-113233).png",
  studyingTiredCat: "/images/brainrot/image(20261020-114155).png",
  pixelTongueCat: "/images/brainrot/image(20261020-105424).png",
  droolingCat: "/images/brainrot/image(20261020-112741).png",
  cursedStaringCat: "/images/brainrot/image(20261020-113321).png",
  sheetStickers: "/images/brainrot/image(20261020-113110).png",
};

export function getBrainrotCharacter(params: {
  persona?: string;
  score?: number;
  tier?: string;
  heat?: string;
  lang?: string;
  nightLikes?: number;
  tutorialsSaved?: number;
  shortsCount?: number;
  mainCharacter?: number;
  aura?: number;
}): BrainrotCharacter {
  const score = params.score ?? 50;
  const persona = params.persona || "aunt";
  const heat = params.heat || "medium";
  const lang = params.lang || "en";
  const nightLikes = params.nightLikes ?? 0;
  const tutorialsSaved = params.tutorialsSaved ?? 0;
  const mainCharacter = params.mainCharacter ?? 50;

  // 1. Extreme Heat or Tier S (Cooked to a crisp)
  if (score >= 85 || heat === "max" || params.tier === "S") {
    if (score >= 90) {
      return {
        url: BRAINROT_IMAGES.nuclearCat,
        tag: `#${score}`,
        title: "NUCLEAR BRAIN DAMAGE",
        quote: "BEYOND COOKED. IRREVERSIBLE DAMAGE.",
      };
    }
    return {
      url: BRAINROT_IMAGES.throneKitten,
      tag: `#${score}`,
      title: "SUPREME DOOMSCROLLER",
      quote: "RULER OF THE 3 AM RABBIT HOLE.",
    };
  }

  // 2. Specific Personas
  if (persona === "gym_bro") {
    return {
      url: BRAINROT_IMAGES.squattingTiger,
      tag: `#${score}`,
      title: "GIGA CHAD TIGER",
      quote: "LIGHTWEIGHT BABY! ALGORITHM CAN'T BENCH THIS.",
    };
  }

  if (persona === "angry_chef") {
    return {
      url: BRAINROT_IMAGES.boxerKitten,
      tag: `#${score}`,
      title: "RAW & READY TO SCRAP",
      quote: "IT'S RAW! SHUT DOWN THE WATCHLIST!",
    };
  }

  if (persona === "gen_alpha") {
    return {
      url: BRAINROT_IMAGES.pixelTongueCat,
      tag: `#${score}`,
      title: "SKIBIDI RIZZLER",
      quote: "FANUM TAX PAID TO THE YOUTUBE ALGORITHM.",
    };
  }

  // 3. High Main Character / Rizz
  if (mainCharacter >= 68) {
    return {
      url: BRAINROT_IMAGES.ryanSpeedboat,
      tag: `#${score}`,
      title: "LITERALLY ME",
      quote: "I DRIVE (THROUGH 800 SHORTS A DAY).",
    };
  }

  // 4. Cultural / Language preference highlights
  if ((lang === "hinglish" || lang === "tanglish") && score >= 40) {
    return {
      url: BRAINROT_IMAGES.srkNiche,
      tag: `#${score}`,
      title: "TWIN I'M NICHE",
      quote: "Y'ALL NEECH, MY TASTE IS ELITE BRO.",
    };
  }

  // 5. Heavy Night Watcher
  if (nightLikes >= 15) {
    return {
      url: BRAINROT_IMAGES.watchCheckingCat,
      tag: `#${score}`,
      title: "3 AM SCREENTIME DEMON",
      quote: "ONE LAST VIDEO BRO, PROMISE.",
    };
  }

  // 6. Tutorial Hoarder
  if (tutorialsSaved >= 5) {
    return {
      url: BRAINROT_IMAGES.studyingTiredCat,
      tag: `#${score}`,
      title: "CHRONIC TUTORIAL SAVER",
      quote: "SAVED TO WATCH NEVER.",
    };
  }

  // 7. Balanced / Medium Heat: "Hol up let him cook"
  if (heat === "medium" || (score >= 40 && score <= 75)) {
    return {
      url: BRAINROT_IMAGES.marmotsCook,
      tag: `#${score}`,
      title: "LET HIM COOK",
      quote: "HOL UP BRO, LET HIM COOK...",
    };
  }

  // Default Popcat
  return {
    url: BRAINROT_IMAGES.popcatSparkles,
    tag: `#${score}`,
    title: "CERTIFIED BRAINROT ENJOYER",
    quote: "SAME SHIT TOMORROW BRO...",
  };
}

export function getBrainrotBadges(params: {
  score?: number;
  tier?: string;
  heat?: string;
  lang?: string;
  nightLikes?: number;
  tutorialsSaved?: number;
  shortsCount?: number;
  topCategory?: string;
  aura?: number;
  mainCharacter?: number;
  rizz?: number;
}): BrainrotBadge[] {
  const badges: BrainrotBadge[] = [];

  // Default badge 1: Core status
  badges.push({
    id: "b-enjoyer",
    name: "Certified Brainrot Enjoyer",
    description: "Daily algorithm consumer with zero regrets.",
    imageUrl: BRAINROT_IMAGES.popcatSparkles,
    rarity: "Common",
  });

  // Night Likes
  if ((params.nightLikes ?? 0) > 0) {
    badges.push({
      id: "b-night",
      name: "3 AM Screen Demon",
      description: `Logged ${params.nightLikes} midnight likes while sleep wept.`,
      imageUrl: BRAINROT_IMAGES.watchCheckingCat,
      rarity: (params.nightLikes ?? 0) > 15 ? "Epic" : "Rare",
    });
  }

  // Tutorials Saved
  if ((params.tutorialsSaved ?? 0) > 0) {
    badges.push({
      id: "b-tutorials",
      name: "Eternal Tutorial Hoarder",
      description: `${params.tutorialsSaved} skills saved for a future self.`,
      imageUrl: BRAINROT_IMAGES.studyingTiredCat,
      rarity: "Rare",
    });
  }

  // Shorts Obsession
  if ((params.shortsCount ?? 0) >= 15) {
    badges.push({
      id: "b-shorts",
      name: "Shorts Dopamine Fiend",
      description: "Attention span measured in nanoseconds.",
      imageUrl: BRAINROT_IMAGES.pixelTongueCat,
      rarity: (params.shortsCount ?? 0) > 50 ? "Legendary" : "Rare",
    });
  }

  // Aura status
  if ((params.aura ?? 0) < 0) {
    badges.push({
      id: "b-aura-deficit",
      name: "Generational Aura Deficit",
      description: `${params.aura} aura points. Council prayers needed.`,
      imageUrl: BRAINROT_IMAGES.depremssiomDoge,
      rarity: "Epic",
    });
  } else {
    badges.push({
      id: "b-aura-peak",
      name: "Literally Him Energy",
      description: "Radiating +1000 main character aura.",
      imageUrl: BRAINROT_IMAGES.ryanThumbsUp,
      rarity: "Legendary",
    });
  }

  // Language / Culture
  if (params.lang === "hinglish" || params.lang === "tanglish") {
    badges.push({
      id: "b-desi-niche",
      name: "Twin I'm Niche",
      description: "Bollywood & desi banter certified.",
      imageUrl: BRAINROT_IMAGES.srkNiche,
      rarity: "Epic",
    });
  }

  // Medium heat / cooking
  if (params.heat === "medium" || (params.score ?? 0) >= 45) {
    badges.push({
      id: "b-let-him-cook",
      name: "Let Him Cook Award",
      description: "Something is burning, but we respect it.",
      imageUrl: BRAINROT_IMAGES.marmotsCook,
      rarity: "Rare",
    });
  }

  // Praying council if cooked
  if ((params.score ?? 0) >= 70) {
    badges.push({
      id: "b-council-prayers",
      name: "Council of Prayers",
      description: "Animal kingdom praying for your screentime.",
      imageUrl: BRAINROT_IMAGES.prayingCouncil,
      rarity: "Legendary",
    });
  }

  // Quality check / Peak
  badges.push({
    id: "b-ball-knower",
    name: "Ball Knower",
    description: "Points at the screen and knows exactly what is peak.",
    imageUrl: BRAINROT_IMAGES.ballKnower,
    rarity: "Rare",
  });

  return badges;
}
