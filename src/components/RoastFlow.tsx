"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@/lib/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Flame,
  LoaderCircle,
  LockKeyhole,
  Share2,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
} from "lucide-react";
import { useSession } from "@/components/providers/AuthProvider";
import { apiError } from "@/lib/api-error";
import {
  BattleOutcome,
  sampleBattle,
  type BattleResult,
} from "./BattleOutcome";
import { BattleView } from "./BattleView";
import AnalyzingView from "./AnalyzingView";
import ScorecardModal from "./ScorecardModal";
import {
  getBrainrotCharacter,
  getBrainrotBadges,
  BRAINROT_IMAGES,
} from "@/lib/brainrot";

type Persona = "aunt" | "gym_bro" | "angry_chef" | "gen_alpha" | "news_anchor";
type Lang = "en" | "tanglish" | "hinglish";
type Heat = "mild" | "medium" | "max";
type Stats = {
  counts: { likes: number; subs: number; playlists: number };
  ratios: Record<string, number>;
  topCategories: { name: string; share: number }[];
  topChannels: { name: string; count: number }[];
  ghostSubs: number;
  tutorialsSaved: number;
  shortsCount: number;
  nightLikes: number;
  brainrotTitles: number;
  brainRotScore: number;
  tier: string;
  rarity: string;
  aura: number;
  digitalAge: number;
  rizz: number;
  npc: number;
  mainCharacter: number;
  partial: boolean;
};
type Content = {
  tier_title: string;
  diagnosis: { condition: string; symptoms: string[]; treatment: string };
  red_flag: string;
  green_flag: string;
  roast: string;
  evidence: string[];
  receipts: { id: string; label: string; joke: string }[];
  aura_comment: string;
  digital_age_comment: string;
  meter_comments: { rizz: string; npc: string; main_character: string };
  share_line: string;
};
type Roast = {
  slug: string;
  content: Content;
  degraded: boolean;
  isPublic: boolean;
  persona: Persona;
  lang: Lang;
  heat: Heat;
  stats?: Stats | null;
};
type Saved = {
  slug: string;
  content: Content;
  stats?: Stats | null;
  persona: Persona;
  heat: Heat;
  lang: Lang;
  at: string;
  demo?: boolean;
};
const personaLabels: Record<Persona, string> = {
  aunt: "Disappointed aunt",
  gym_bro: "Gym bro",
  angry_chef: "Angry chef",
  gen_alpha: "Gen Alpha",
  news_anchor: "News anchor",
};
const sampleContent: Content = {
  tier_title: "Certified Brainrot Enjoyer",
  diagnosis: {
    condition: "Algorithmic snack goblin",
    symptoms: [
      "One more video syndrome",
      "Tutorials saved for a future self",
      "A suspiciously late-night scroll",
    ],
    treatment: "Close the app. Touch grass. Maybe finish one tutorial first.",
  },
  red_flag:
    "Your watchlist has the structural integrity of a 2 a.m. rabbit hole.",
  green_flag:
    "At least your curiosity has range. The algorithm is working overtime.",
  roast:
    "Your YouTube history is giving “I opened one video to learn a skill and woke up three hours later watching a raccoon rate snacks.” There is ambition in there. It is just buried under a highly organized pile of distractions. The algorithm has stopped recommending things and started checking on you.",
  evidence: [
    "A suspiciously committed late-night viewing pattern",
    "Tutorials saved with the confidence of someone who will definitely start tomorrow",
    "A diverse channel roster held together by pure curiosity",
  ],
  receipts: [
    {
      id: "r1",
      label: "The midnight spiral",
      joke: "The clock says bedtime. Your history says one more video.",
    },
    {
      id: "r2",
      label: "The future project",
      joke: "Saved the tutorial. Considered the tutorial. That counts, right?",
    },
    {
      id: "r3",
      label: "Variety hour",
      joke: "Your recommendations need a map and a snack break.",
    },
  ],
  aura_comment:
    "Your aura is buffering—but there is a nice little glow behind the loading icon.",
  digital_age_comment: "Spiritually 17 tabs open.",
  meter_comments: {
    rizz: "The confidence is there. The follow-through is buffering.",
    npc: "You have side-quest energy.",
    main_character: "A protagonist with a chaotic watchlist.",
  },
  share_line: "My YouTube taste has been professionally roasted.",
};
function isDemoPath(path: string) {
  return path.includes("/demo");
}
function baseRoute(path: string) {
  const p = path.split("?")[0];
  if (p.startsWith("/battle")) return "/battle";
  return p;
}
function storageKey(identity: string) {
  return `roasttube:saved:${identity}`;
}
function readSaved(identity: string): Saved[] {
  try {
    const rows = JSON.parse(localStorage.getItem(storageKey(identity)) || "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter(
      (row: Saved) => Date.parse(row.at) > Date.now() - 30 * 24 * 3600 * 1000,
    );
  } catch {
    return [];
  }
}
function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function reportText(r: Roast) {
  return `ROASTTUBE — YOUR ROAST\n${r.content.tier_title}\n\n${r.content.roast}\n\nDiagnosis: ${r.content.diagnosis.condition}\n${r.content.diagnosis.symptoms.map((s) => `• ${s}`).join("\n")}\n\nReceipts:\n${r.content.receipts.map((x) => `• ${x.label}: ${x.joke}`).join("\n")}\n\nRed flag: ${r.content.red_flag}\nGreen flag: ${r.content.green_flag}\n\n${r.content.share_line}${r.stats ? `\n\nScore: ${r.stats.brainRotScore}/100 · Tier ${r.stats.tier}` : ""}\n`;
}
const human = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function RoastFlow() {
  const [path, setPath] = useLocation();
  const { data, status, signIn } = useSession();
  const identity = data?.user?.googleSub || data?.user?.email || "visitor";
  const demo = isDemoPath(path);
  const [persona, setPersona] = useState<Persona>("aunt");
  const [lang, setLang] = useState<Lang>("en");
  const [heat, setHeat] = useState<Heat>("medium");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [roast, setRoast] = useState<Roast | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [battleCode, setBattleCode] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        setBattleCode(code);
      } else {
        const m = window.location.pathname.match(/^\/battle\/([^/?#]+)/);
        if (m?.[1] && m[1] !== "page") {
          setBattleCode(m[1]);
        }
      }
    }
  }, [path]);
  const [shareState, setShareState] = useState("");
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [shareConsent, setShareConsent] = useState(false);
  const [battleConsent, setBattleConsent] = useState(false);
  useEffect(() => {
    setSaved(readSaved(identity));
  }, [identity]);
  useEffect(() => {
    if (path === "/roast" || path === "/roast/demo") setStep(0);
  }, [path]);
  useEffect(() => {
    if (path !== "/roast/demo/analyzing") return;
    const timer = window.setTimeout(() => setPath("/roast/demo/result"), 3800);
    return () => window.clearTimeout(timer);
  }, [path, setPath]);
  useEffect(() => {
    const match = routeMatchResult(path);
    let slug: string | null = null;
    try {
      slug = match ? decodeURIComponent(match) : null;
    } catch {
      setError("The roast link is malformed.");
    }
    if (slug && roast?.slug !== slug) {
      let cancelled = false;
      setLoadingShared(true);
      setError("");
      fetch(`/api/roast/${encodeURIComponent(slug)}`, {
        credentials: "include",
      })
        .then(async (res) => {
          const d = await res.json();
          if (!res.ok)
            throw new Error(apiError(d, "This roast could not be loaded."));
          if (!cancelled) setRoast(d as Roast);
        })
        .catch((e) => {
          if (!cancelled)
            setError(
              e instanceof Error
                ? e.message
                : "This roast could not be loaded.",
            );
        })
        .finally(() => {
          if (!cancelled) setLoadingShared(false);
        });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [path, roast, loadAttempt]);
  useEffect(() => {
    if (demo && roast?.slug !== "sample-demo") {
      setRoast({
        slug: "sample-demo",
        content: sampleContent,
        degraded: false,
        isPublic: false,
        persona: "aunt",
        lang: "en",
        heat: "medium",
        stats: {
          counts: { likes: 128, subs: 37, playlists: 8 },
          ratios: {
            shorts: 0.42,
            brainrot: 0.31,
            lowEffort: 0.2,
            educational: 0.15,
            night: 0.27,
            top3Share: 0.54,
          },
          topCategories: [
            { name: "Comedy", share: 0.32 },
            { name: "Gaming", share: 0.27 },
            { name: "Learning", share: 0.18 },
            { name: "Other", share: 0.23 },
          ],
          topChannels: [],
          ghostSubs: 14,
          tutorialsSaved: 6,
          shortsCount: 54,
          nightLikes: 23,
          brainrotTitles: 39,
          brainRotScore: 78,
          tier: "A",
          rarity: "Epic",
          aura: -1240,
          digitalAge: 19,
          rizz: 61,
          npc: 28,
          mainCharacter: 72,
          partial: false,
        },
      });
    }
  }, [demo, roast]);
  const startAnalyze = async () => {
    setBusy(true);
    setError("");
    setPath("/roast/analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiError(data, "Analysis request failed."));
      if (!data.analysisId) {
        throw new Error(
          "YouTube returned insufficient data for a roast. Check your liked videos, subscriptions and playlists, then try again.",
        );
      }
      sessionStorage.setItem("roasttube:analysisId", data.analysisId);
      const liveStats = (data.stats || null) as Stats | null;
      setStats(liveStats);
      if (data.partial !== undefined)
        sessionStorage.setItem("roasttube:partial", String(data.partial));
      const rr = await fetch("/api/roast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: data.analysisId,
          persona,
          lang,
          heat,
        }),
      });
      const rd = await rr.json();
      if (!rr.ok) throw new Error(apiError(rd, "Roast request failed."));
      const liveRoast: Roast = { ...rd, stats: liveStats };
      setRoast(liveRoast);
      setPath(`/roast/result/${encodeURIComponent(liveRoast.slug)}`);
      const entry: Saved = {
        slug: liveRoast.slug,
        content: liveRoast.content,
        stats: liveStats,
        persona,
        lang,
        heat,
        at: new Date().toISOString(),
      };
      const next = [
        entry,
        ...readSaved(identity).filter((x) => x.slug !== liveRoast.slug),
      ];
      localStorage.setItem(storageKey(identity), JSON.stringify(next));
      setSaved(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not analyze YouTube data.",
      );
    } finally {
      setBusy(false);
    }
  };
  const generate = async () => {
    if (demo) {
      setRoast({ ...roast!, persona, lang, heat });
      setPath("/roast/demo/analyzing");
      return;
    }
    const analysisId = sessionStorage.getItem("roasttube:analysisId");
    if (!analysisId) {
      setError("No live analysis is available. Start again from Connect.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, persona, lang, heat }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiError(data, "Roast request failed."));
      const r: Roast = { ...data, stats };
      setRoast(r);
      setPath(`/roast/result/${encodeURIComponent(r.slug)}`);
      const entry: Saved = {
        slug: r.slug,
        content: r.content,
        stats,
        persona,
        lang,
        heat,
        at: new Date().toISOString(),
      };
      const next = [
        entry,
        ...readSaved(identity).filter((x) => x.slug !== r.slug),
      ];
      localStorage.setItem(storageKey(identity), JSON.stringify(next));
      setSaved(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate roast.");
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    if (!roast) return;
    if (!demo && !shareConsent) {
      setShareState(
        "Please consent to making this roast public before sharing.",
      );
      return;
    }
    try {
      if (!demo) {
        const res = await fetch(
          `/api/roast/${encodeURIComponent(roast.slug)}/share`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public: true }),
          },
        );
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(apiError(d, "Share setting could not be updated."));
        }
        setRoast({ ...roast, isPublic: true });
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}${demo ? "/roast/demo" : `/roast/result/${encodeURIComponent(roast.slug)}`}`;
      // Open Scorecard Modal for sharing as image card per user request
      setScorecardOpen(true);
      setShareState("Scorecard ready! Choose how to share or download your card.");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setShareState(e instanceof Error ? e.message : "Sharing failed.");
    }
  };
  const makePrivate = async () => {
    if (!roast) return;
    try {
      const res = await fetch(
        `/api/roast/${encodeURIComponent(roast.slug)}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public: false }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(apiError(d, "Could not make this roast private."));
      }
      setRoast({ ...roast, isPublic: false });
      setShareState("This roast is private now.");
    } catch (e) {
      setShareState(
        e instanceof Error ? e.message : "Could not change visibility.",
      );
    }
  };
  const copyInvite = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(
        `${origin}/battle?code=${encodeURIComponent(battleCode || "")}`,
      );
      setShareState("Battle invitation copied.");
    } catch {
      setShareState(
        "Could not copy. Select and copy the invitation URL from your browser.",
      );
    }
  };
  const removeSaved = (slug: string) => {
    if (!window.confirm("Remove this roast from saved history on this device?"))
      return;
    const next = saved.filter((r) => r.slug !== slug);
    setSaved(next);
    localStorage.setItem(storageKey(identity), JSON.stringify(next));
  };
  const loadSaved = (r: Saved) => {
    setRoast({
      slug: r.slug,
      content: r.content,
      stats: r.stats,
      degraded: false,
      isPublic: false,
      persona: r.persona,
      lang: r.lang,
      heat: r.heat,
    });
    setPath(
      r.demo
        ? "/roast/demo/result"
        : `/roast/result/${encodeURIComponent(r.slug)}`,
    );
  };
  const route = baseRoute(path);
  let resultSlug: string | null = null;
  try {
    const match = routeMatchResult(path);
    resultSlug = match ? decodeURIComponent(match) : null;
  } catch {
    resultSlug = null;
  }
  const resultReady = Boolean(
    (route === "/roast/demo/result" && roast?.slug === "sample-demo") ||
    (route.startsWith("/roast/result") && roast && roast.slug === resultSlug),
  );
  const beginLive = async () => {
    if (status === "authenticated") {
      setStep(1);
    } else {
      try {
        await signIn("/roast");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Google sign-in could not start.",
        );
      }
    }
  };
  const prep =
    route === "/roast" ||
    route === "/roast/connect" ||
    route === "/roast/select" ||
    route === "/roast/confirm" ||
    route === "/roast/demo";
  const title =
    step === 0
      ? "Connect YouTube"
      : step === 1
        ? "Choose your roast"
        : step === 2
          ? "Review permissions"
          : step === 3
            ? "Final confirmation"
            : "";
  return (
    <main className="max-w-[1200px] mx-auto px-4 pt-8">
      {prep && (
        <section className="pop-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mono text-xs text-[#f22968] font-bold">
                {demo
                  ? "SAMPLE PREVIEW / NOT YOUR DATA"
                  : "LIVE ROAST / GOOGLE READ-ONLY"}
              </p>
              <h1 className="display text-6xl md:text-7xl leading-none mt-2">
                {title}
              </h1>
            </div>
            <div className="flex gap-1">
              {["Connect", "Select", "Review", "Confirm"].map((s, i) => (
                <span
                  key={s}
                  className={`mono text-[10px] font-bold px-2 py-1 border border-black ${i <= step ? "bg-[#f22968] text-white" : "bg-[#fff8e8]"}`}
                >
                  {i + 1} {s}
                </span>
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6 mt-7">
            <div className="comic-card p-5 md:p-7">
              {step === 0 && (
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#f6ce47] border-2 border-black flex items-center justify-center">
                      <ShieldCheck />
                    </div>
                    <div>
                      <h2 className="display text-3xl">What we access</h2>
                      <p className="mt-1 text-sm">
                        Google’s authorization screen will list the exact
                        requested scopes.
                      </p>
                    </div>
                  </div>
                  <ul className="grid sm:grid-cols-3 gap-3 my-6">
                    {[
                      ["Liked videos", "Your liked video metadata"],
                      ["Subscriptions", "Channel names and IDs"],
                      ["Playlists", "Playlist titles and item counts"],
                    ].map(([a, b]) => (
                      <li
                        key={a}
                        className="border-2 border-black bg-[#f5edda] p-3"
                      >
                        <Check className="text-[#278b6f]" />
                        <b className="block mt-2">{a}</b>
                        <span className="text-xs text-[#655b4c]">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="border-l-4 border-[#f22968] pl-3 text-sm font-semibold">
                    We analyze all three collections together. The current
                    service does not support deselecting individual sources.
                    Access is read-only; we cannot change your YouTube account.
                  </p>
                  <div className="mt-5 flex gap-3 flex-wrap">
                    <button
                      className="comic-button"
                      onClick={() => (demo ? setStep(1) : beginLive())}
                    >
                      {demo
                        ? "Continue sample preview"
                        : status === "authenticated"
                          ? "Continue to selection"
                          : "Sign in with Google"}{" "}
                      <ArrowRight size={18} />
                    </button>
                    {!demo && (
                      <p className="text-xs max-w-sm">
                        {status === "authenticated"
                          ? "You’re signed in. You may continue."
                          : "Google sign-in is required for a live analysis."}
                      </p>
                    )}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className="display text-3xl">Pick the voice</h2>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <label className="font-bold text-sm">
                      Roast persona
                      <select
                        className="block mt-2 w-full border-2 border-black bg-[#fff8e8] p-3"
                        value={persona}
                        onChange={(e) => setPersona(e.target.value as Persona)}
                      >
                        {Object.entries(personaLabels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="font-bold text-sm">
                      Language
                      <select
                        className="block mt-2 w-full border-2 border-black bg-[#fff8e8] p-3"
                        value={lang}
                        onChange={(e) => setLang(e.target.value as Lang)}
                      >
                        {[
                          ["en", "English"],
                          ["tanglish", "Tanglish"],
                          ["hinglish", "Hinglish"],
                        ].map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-5">
                    <p className="font-bold text-sm mb-2">Heat level</p>
                    <div className="flex flex-wrap gap-2">
                      {(["mild", "medium", "max"] as Heat[]).map((h) => (
                        <button
                          key={h}
                          onClick={() => setHeat(h)}
                          className={`px-4 py-2 border-2 border-black font-extrabold ${heat === h ? "bg-[#f22968] text-white shadow-[3px_3px_0_#18130f]" : "bg-[#f5edda]"}`}
                        >
                          {human(h)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-7">
                    <button
                      className="comic-button secondary"
                      onClick={() => setStep(0)}
                    >
                      <ArrowLeft size={17} /> Back
                    </button>
                    <button className="comic-button" onClick={() => setStep(2)}>
                      Review choices <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="display text-3xl">Google permission review</h2>
                  <p className="mt-2">
                    Your account will be asked to allow these read-only sources.
                    You can review and deny permissions on Google’s screen
                    before anything is analyzed.
                  </p>
                  <div className="space-y-3 mt-5">
                    {[
                      [
                        "Liked videos",
                        "Used to calculate topic and format patterns",
                      ],
                      [
                        "Subscriptions",
                        "Used to compare subscriptions with liked channels",
                      ],
                      [
                        "Playlists",
                        "Used to identify saved tutorial collections",
                      ],
                    ].map(([a, b]) => (
                      <div
                        key={a}
                        className="flex items-start gap-3 border-2 border-black bg-[#f5edda] p-3"
                      >
                        <Check className="text-[#278b6f] shrink-0" />
                        <div>
                          <b>{a}</b>
                          <p className="text-sm">{b}</p>
                        </div>
                        <span className="mono text-[10px] ml-auto">
                          READ ONLY
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4">
                    Sources are analyzed together. Individual source deselection
                    is not available in this backend. No view history or
                    watch-time access is requested.
                  </p>
                  <div className="flex gap-2 mt-5">
                    <button
                      className="comic-button secondary"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft size={17} /> Back
                    </button>
                    <button className="comic-button" onClick={() => setStep(3)}>
                      Review final choices <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="display text-3xl">Almost there.</h2>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      ["Persona", personaLabels[persona]],
                      ["Language", human(lang)],
                      ["Heat", human(heat)],
                      ["Access", "Read-only"],
                    ].map(([a, b]) => (
                      <div
                        key={a}
                        className="border-2 border-black bg-[#f5edda] p-3"
                      >
                        <small className="mono text-xs">
                          {a.toUpperCase()}
                        </small>
                        <b className="block mt-1">{b}</b>
                      </div>
                    ))}
                  </div>
                  <label className="flex gap-3 mt-5 p-3 border-2 border-black bg-[#fff8e8] text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="accent-[#f22968] mt-1"
                    />{" "}
                    I understand this is a playful roast based on authorized
                    YouTube data. I can revoke access and delete my RoastTube
                    data at any time.
                  </label>
                  <div className="flex gap-2 mt-5">
                    <button
                      className="comic-button secondary"
                      onClick={() => setStep(2)}
                    >
                      <ArrowLeft size={17} /> Back
                    </button>
                    <button
                      className="comic-button"
                      disabled={!consent || busy}
                      onClick={demo ? generate : startAnalyze}
                    >
                      {busy ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        "Start my roast"
                      )}{" "}
                      <Flame size={18} />
                    </button>
                  </div>
                </>
              )}
              {error && (
                <div
                  role="alert"
                  className="mt-5 p-3 bg-[#ffe3e5] border-2 border-[#ed3346] text-sm font-bold"
                >
                  {error}
                </div>
              )}
            </div>
            <aside className="space-y-4">
              <div className="comic-card bg-[#f6ce47] p-5">
                <h3 className="display text-3xl">Your data, your call.</h3>
                <p className="text-sm mt-2">
                  You can revoke Google access in your account settings.
                  RoastTube offers data deletion from Privacy at any time.
                </p>
                <Link
                  className="inline-block underline font-bold mt-3"
                  href="/privacy"
                >
                  Read the privacy details
                </Link>
              </div>
              <div className="comic-card p-5">
                <LockKeyhole />
                <h3 className="font-extrabold mt-2">No history scraping.</h3>
                <p className="text-sm mt-1">
                  The read-only API provides likes, subscriptions and playlists.
                  We do not claim to see your viewing history or watch hours.
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}
      {(route === "/roast/analyzing" || route === "/roast/demo/analyzing") && (
        <AnalyzingView
          lang={lang}
          onLanguageChange={setLang}
          busy={busy}
          error={error}
          onRetry={startAnalyze}
          demo={route === "/roast/demo/analyzing" || demo}
        />
      )}
      {route.startsWith("/roast/result") && !resultReady && loadingShared && (
        <section
          aria-label="Loading roast"
          className="comic-card max-w-3xl mx-auto p-6 mt-8 animate-pulse"
        >
          <div className="h-5 w-36 bg-[#e5d8c2]" />
          <div className="h-12 w-2/3 bg-[#e5d8c2] mt-4" />
          <div className="h-24 w-full bg-[#e5d8c2] mt-5" />
          <div className="h-10 w-1/2 bg-[#e5d8c2] mt-5" />
        </section>
      )}
      {route.startsWith("/roast/result") && !resultReady && error && (
        <section
          role="alert"
          className="comic-card max-w-2xl mx-auto p-7 mt-8 bg-[#ffe3e5]"
        >
          <h1 className="display text-4xl">Roast unavailable</h1>
          <p className="mt-2 font-semibold">{error}</p>
          <button
            className="comic-button mt-4"
            onClick={() => {
              setError("");
              setLoadAttempt((v) => v + 1);
            }}
          >
            Try again
          </button>
        </section>
      )}
      {resultReady && roast && (
        <Result
          roast={roast}
          demo={demo || roast.slug === "sample-demo"}
          consent={shareConsent}
          onShare={share}
          onPrivate={makePrivate}
          shareState={shareState}
          onDownload={() => download("roasttube-report.txt", reportText(roast))}
          onBattle={() => setPath("/battle")}
          onConsentChange={setShareConsent}
        />
      )}
      {roast && (
        <ScorecardModal
          roast={roast}
          isOpen={scorecardOpen}
          onClose={() => setScorecardOpen(false)}
          publicUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}${demo ? "/roast/demo" : `/roast/result/${encodeURIComponent(roast.slug)}`}`
              : ""
          }
        />
      )}
      {route === "/roasts" && (
        <section className="mt-8">
          <p className="mono text-xs text-[#f22968]">LOCAL HISTORY</p>
          <h1 className="display text-6xl">My roasts</h1>
          <p className="mt-2 font-semibold">
            Saved on this device only · scoped to{" "}
            {identity === "visitor"
              ? "this browser visitor"
              : data?.user?.firstName || "your signed-in account"}
            . This is not a server-side roast list.
          </p>
          {saved.length === 0 ? (
            <div className="comic-card mt-6 p-8 text-center">
              <h2 className="display text-4xl">No saved roasts yet.</h2>
              <p>Make a live roast or try a clearly labeled sample preview.</p>
              <Link
                href="/roast/demo"
                className="comic-button mt-4 no-underline"
              >
                Try sample roast
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {saved.map((r) => (
                <article key={r.slug} className="comic-card p-5">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="mono text-xs">
                        {r.demo
                          ? "DEMO · NOT REAL DATA"
                          : "SAVED ON THIS DEVICE"}
                      </p>
                      <h2 className="display text-3xl">
                        {r.content.tier_title}
                      </h2>
                    </div>
                    <button
                      onClick={() => removeSaved(r.slug)}
                      aria-label="Delete saved roast"
                      className="border-2 border-black p-2 h-fit bg-[#ffe3e5]"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm mt-2 line-clamp-2">
                    {r.content.share_line}
                  </p>
                  <button
                    className="comic-button mt-4"
                    onClick={() => loadSaved(r)}
                  >
                    Open roast <ArrowRight size={17} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {route === "/battle" && (
        <BattleView
          initialCode={battleCode}
          onNavigateHome={() => setPath("/")}
        />
      )}
      {route === "/roast/connect" && status !== "authenticated" && (
        <div className="sr-only" aria-live="polite">
          Sign in with Google to start a live roast.
        </div>
      )}
    </main>
  );
}

function routeMatchResult(path: string) {
  const m = path.match(/^\/roast\/result\/([^/?#]+)/);
  return m?.[1] || null;
}
function Result({
  roast: r,
  demo,
  consent,
  onShare,
  onPrivate,
  shareState,
  onDownload,
  onBattle,
  onConsentChange,
}: {
  roast: Roast;
  demo: boolean;
  consent: boolean;
  onShare: () => void;
  onPrivate: () => void;
  shareState: string;
  onDownload: () => void;
  onBattle: () => void;
  onConsentChange: (v: boolean) => void;
}) {
  const st = r.stats;
  const character = getBrainrotCharacter({
    persona: r.persona,
    score: st?.brainRotScore ?? 50,
    tier: st?.tier ?? "C",
    heat: r.heat,
    lang: r.lang,
    nightLikes: st?.nightLikes ?? 0,
    tutorialsSaved: st?.tutorialsSaved ?? 0,
    shortsCount: st?.shortsCount ?? 0,
    aura: st?.aura ?? 0,
    mainCharacter: st?.mainCharacter ?? 50,
  });

  const badges = getBrainrotBadges({
    score: st?.brainRotScore ?? 50,
    tier: st?.tier ?? "C",
    heat: r.heat,
    lang: r.lang,
    nightLikes: st?.nightLikes ?? 0,
    tutorialsSaved: st?.tutorialsSaved ?? 0,
    shortsCount: st?.shortsCount ?? 0,
    aura: st?.aura ?? 0,
  });

  return (
    <section className="mt-8 pop-in">
      {demo && (
        <div className="mb-5 border-2 border-[#a22646] bg-[#ffe3e8] p-3 font-extrabold text-sm">
          SAMPLE DEMO — all scores, categories, receipts and roast copy below
          are illustrative, not based on your YouTube account.
        </div>
      )}
      {!demo && r.degraded && (
        <div className="mb-5 border-2 border-[#b96a05] bg-[#fff0c8] p-3 font-bold text-sm">
          The roast service returned a degraded result. The content shown is the
          service response and may be limited.
        </div>
      )}
      {!demo && st?.partial && (
        <div className="mb-5 border-2 border-[#b96a05] bg-[#fff0c8] p-3 font-bold text-sm">
          Partial analysis: one or more YouTube data sources were unavailable.
          Treat these statistics as incomplete.
        </div>
      )}
      <div className="grid lg:grid-cols-[.72fr_1.28fr] gap-5">
        <article className="comic-card bg-[#18130f] text-[#fff8e8] p-5 relative overflow-hidden">
          <p className="mono text-xs text-[#f6ce47]">
            YOUR BRAINROT SCORE {demo ? "· DEMO" : ""}
          </p>
          <div className="flex items-end gap-1 mt-2">
            <strong className="display text-[108px] leading-[.85] text-[#f22968]">
              {st?.brainRotScore ?? "—"}
            </strong>
            <span className="display text-4xl mb-1">/100</span>
          </div>
          <div className="h-4 border-2 border-[#fff8e8] mt-4">
            <div
              className="h-full bg-[#f22968]"
              style={{
                width: `${Math.max(0, Math.min(100, st?.brainRotScore || 0))}%`,
              }}
            />
          </div>
          <div className="flex justify-between mono text-xs mt-3">
            <span>Tier {st?.tier ?? "—"}</span>
            <span>{st?.rarity ?? "—"}</span>
          </div>
          <h2 className="display text-3xl mt-6">{r.content.tier_title}</h2>
          <p className="text-sm mt-2 text-[#d6c9b5]">
            {r.content.aura_comment}
          </p>
          <img
            className="w-28 h-28 object-cover rounded-xl border-2 border-white/30 absolute right-2 bottom-2 opacity-95 shadow-lg"
            src={character.url}
            alt={character.title}
          />
        </article>
        <article className="comic-card p-5 md:p-7">
          <p className="mono text-xs text-[#f22968]">
            THE ROAST · {personaLabels[r.persona]}
          </p>
          <h1 className="display text-5xl mt-2">
            {r.content.diagnosis.condition}
          </h1>
          <p className="text-lg leading-relaxed mt-4 font-medium">
            “{r.content.roast}”
          </p>
          <div className="grid md:grid-cols-2 gap-3 mt-5">
            <div className="border-2 border-[#ed3346] bg-[#fff0ef] p-3">
              <b className="text-[#c91e40]">RED FLAG</b>
              <p className="text-sm mt-1">{r.content.red_flag}</p>
            </div>
            <div className="border-2 border-[#278b6f] bg-[#e6f6eb] p-3">
              <b className="text-[#176d54]">GREEN FLAG</b>
              <p className="text-sm mt-1">{r.content.green_flag}</p>
            </div>
          </div>
        </article>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Metric
          title="Your data"
          value={st ? `${st.counts.likes} likes` : "Unavailable"}
          detail={
            st
              ? `${st.counts.subs} subscriptions · ${st.counts.playlists} playlists`
              : "Stats were not returned by the service"
          }
        />
        <Metric
          title="Quick clips"
          value={st ? String(st.shortsCount) : "—"}
          detail="Classified from liked-video metadata"
        />
        <Metric
          title="Night likes"
          value={st ? String(st.nightLikes) : "—"}
          detail="Likes around midnight hours"
        />
        <Metric
          title="Saved tutorials"
          value={st ? String(st.tutorialsSaved) : "—"}
          detail="Matched from playlists and likes"
        />
      </div>
      <div className="grid md:grid-cols-[1fr_1fr] gap-5 mt-5">
        <article className="comic-card p-5">
          <h2 className="display text-3xl">Receipts</h2>
          {r.content.receipts.map((x, i) => (
            <div key={x.id} className="border-t border-black/20 py-3 mt-2">
              <b className="text-sm">
                {String(i + 1).padStart(2, "0")} / {x.label}
              </b>
              <p className="text-sm mt-1">{x.joke}</p>
            </div>
          ))}
        </article>
        <article className="comic-card p-5">
          <h2 className="display text-3xl">Your taste, at a glance</h2>
          {st?.topCategories?.length ? (
            <div className="mt-3 space-y-3">
              {st.topCategories.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{c.name}</span>
                    <span>{Math.round(c.share * 100)}%</span>
                  </div>
                  <div className="h-3 border border-black mt-1">
                    <div
                      className="h-full bg-[#f22968]"
                      style={{
                        width: `${Math.max(0, Math.min(100, c.share * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm mt-3">
              No category breakdown was included in this response.
            </p>
          )}
          <p className="mt-4 text-xs text-[#63594e]">
            Based on the API’s read-only analysis of likes, subscriptions and
            playlists. No viewing history or watch-time claim.
          </p>
        </article>
      </div>

      {/* Brainrot Character & Badges Showcase */}
      <article className="comic-card p-5 md:p-7 mt-5 border-[3px] border-black bg-[#faf4e6]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#ffd23f] text-black font-extrabold text-xs px-2.5 py-0.5 border border-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-[#f22968]" /> SUITABLE BRAINROT ARCHETYPE
              </span>
              <span className="mono text-xs font-bold text-[#635543]">
                {character.tag}
              </span>
            </div>
            <h2 className="display text-3xl md:text-4xl mt-1">
              {character.title}
            </h2>
            <p className="text-sm font-semibold text-[#5a4d3f]">
              “{character.quote}”
            </p>
          </div>
          <button
            onClick={onShare}
            className="comic-button text-sm flex items-center gap-2"
          >
            <Share2 size={16} /> Share Official Scorecard Card
          </button>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-6 mt-5 items-center">
          {/* Character Card Preview */}
          <div className="relative rounded-2xl bg-[#120e0a] border-[3px] border-[#e4a826] p-2.5 shadow-[0_0_20px_rgba(228,168,38,0.3)] max-w-[220px] mx-auto w-full">
            <div className="flex justify-between items-center text-[9px] font-black text-[#ffd23f] px-1 mb-1">
              <span>ROASTTUBE</span>
              <span>{character.tag}</span>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden border border-[#e4a826]/70 relative">
              <img
                src={character.url}
                alt={character.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 inset-x-1 bg-gradient-to-r from-[#d97706] to-[#fbbf24] text-black text-[9px] font-black py-0.5 px-1 rounded text-center truncate">
                ★ {character.title} ★
              </div>
            </div>
            <div className="text-[8px] mono font-bold text-[#d4af37] text-center mt-1">
              SCROLL • WATCH • LIKE • REPEAT
            </div>
          </div>

          {/* Earned Badges Grid */}
          <div>
            <h3 className="mono text-xs font-black text-[#4b4034] uppercase tracking-wider mb-3">
              EARNED BADGES ({badges.length}) — DERIVED FROM YOUR YOUTUBE DATA
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0_#18130f]"
                >
                  <div className="w-11 h-11 rounded-lg bg-[#ffd23f] border-2 border-black overflow-hidden shrink-0 shadow-sm">
                    <img
                      src={b.imageUrl}
                      alt={b.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                      <b className="text-xs text-black">{b.name}</b>
                      <span className="text-[9px] font-black text-[#f22968] uppercase">
                        {b.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#635543] mt-0.5 line-clamp-2">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>

      <div className="flex flex-wrap gap-3 mt-5">
        <Link href="/" className="comic-button secondary no-underline">
          <ArrowLeft size={17} /> Home
        </Link>
        <button className="comic-button" onClick={onShare}>
          <Share2 size={17} /> Share Scorecard Card
        </button>
        {!demo && r.isPublic && (
          <button className="comic-button secondary" onClick={onPrivate}>
            Make private
          </button>
        )}
        <button className="comic-button secondary" onClick={onDownload}>
          <Download size={17} /> Download text report
        </button>
        <button className="comic-button secondary" onClick={onBattle}>
          <Swords size={17} /> Battle
        </button>
      </div>
      {shareState && (
        <p className="mt-3 font-bold text-sm" role="status">
          {shareState}
        </p>
      )}
      {!demo && (
        <label className="block mt-4 text-xs">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
          />{" "}
          I consent to making this roast public when using Share. Share updates
          the service visibility before creating a share link.
        </label>
      )}
    </section>
  );
}
function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="comic-card p-4">
      <p className="mono text-[10px]">{title.toUpperCase()}</p>
      <strong className="display text-4xl block mt-1">{value}</strong>
      <p className="text-xs mt-1">{detail}</p>
    </article>
  );
}

