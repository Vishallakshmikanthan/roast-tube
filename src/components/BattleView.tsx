"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Swords,
  Copy,
  Check,
  LoaderCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Flame,
  Sparkles,
} from "lucide-react";
import { useSession } from "@/components/providers/AuthProvider";
import { apiError } from "@/lib/api-error";
import { BattleOutcome, sampleBattle, type BattleResult } from "./BattleOutcome";

type Persona = "aunt" | "gym_bro" | "angry_chef" | "gen_alpha" | "news_anchor";
type Lang = "en" | "tanglish" | "hinglish";
type Heat = "mild" | "medium" | "max";

const personaLabels: Record<Persona, string> = {
  aunt: "Disappointed aunt",
  gym_bro: "Gym bro",
  angry_chef: "Angry chef",
  gen_alpha: "Gen Alpha",
  news_anchor: "News anchor",
};

interface BattleData {
  id: string;
  code: string;
  status: "pending" | "accepted" | "done" | "declined" | "expired";
  creatorName: string;
  creatorAvatar: string | null;
  creatorScore: number | null;
  creatorTier?: string | null;
  opponentName: string | null;
  opponentAvatar: string | null;
  persona: Persona;
  lang: Lang;
  heat: Heat;
  result: BattleResult | null;
  slug: string | null;
  isCreator: boolean;
  isOpponent: boolean;
  expiresAt: string;
}

export function BattleView({
  initialCode = "",
  onNavigateHome,
}: {
  initialCode?: string;
  onNavigateHome?: () => void;
}) {
  const { status, signIn, data: sessionData } = useSession();

  // Selected battle settings (if creating)
  const [persona, setPersona] = useState<Persona>("aunt");
  const [lang, setLang] = useState<Lang>("en");
  const [heat, setHeat] = useState<Heat>("medium");

  // Battle code state
  const [code, setCode] = useState(initialCode);
  const [inputCode, setInputCode] = useState(initialCode);

  // Loaded battle data from server
  const [battleInfo, setBattleInfo] = useState<BattleData | null>(null);
  const [loadingBattle, setLoadingBattle] = useState(false);

  // Battle outcome to display
  const [outcome, setOutcome] = useState<BattleResult | null>(null);
  const [isSample, setIsSample] = useState(false);

  // Actions state
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // User analysis status check
  const [hasAnalysis, setHasAnalysis] = useState<boolean | null>(null);

  // Check if current user has an analysis in DB
  const checkUserAnalysis = useCallback(async () => {
    if (status !== "authenticated") {
      setHasAnalysis(false);
      return;
    }
    const localAnalysisId = typeof window !== "undefined"
      ? sessionStorage.getItem("roasttube:analysisId")
      : null;
    if (localAnalysisId) {
      setHasAnalysis(true);
      return;
    }
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const d = await res.json();
        setHasAnalysis(Boolean(d.hasAnalysis));
        if (d.latestAnalysisId && typeof window !== "undefined") {
          sessionStorage.setItem("roasttube:analysisId", d.latestAnalysisId);
        }
      }
    } catch {
      setHasAnalysis(false);
    }
  }, [status]);

  useEffect(() => {
    checkUserAnalysis();
  }, [checkUserAnalysis]);

  // Read battle code from URL query or path if initialCode is empty
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlCode = new URLSearchParams(window.location.search).get("code");
      if (urlCode && !code) {
        setCode(urlCode);
        setInputCode(urlCode);
      } else if (!code) {
        const match = window.location.pathname.match(/^\/battle\/([^/?#]+)/);
        if (match?.[1] && match[1] !== "page") {
          setCode(match[1]);
          setInputCode(match[1]);
        }
      }
    }
  }, [code]);

  // Fetch battle info by code
  const fetchBattle = useCallback(
    async (codeToFetch: string, silent = false) => {
      if (!codeToFetch.trim()) return;
      if (!silent) setLoadingBattle(true);
      setError("");
      try {
        const res = await fetch(`/api/battle/${encodeURIComponent(codeToFetch.trim())}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(apiError(data, "Could not find battle invite."));
        }
        setBattleInfo(data);
        if (data.status === "done" && data.result) {
          setOutcome(data.result);
          setIsSample(false);
        }
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : "Failed to load battle.");
        }
      } finally {
        if (!silent) setLoadingBattle(false);
      }
    },
    []
  );

  useEffect(() => {
    if (code) {
      fetchBattle(code);
    }
  }, [code, fetchBattle]);

  // Polling for creator while battle is pending
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (battleInfo && battleInfo.status === "pending" && battleInfo.isCreator && !outcome) {
      pollTimerRef.current = setInterval(() => {
        fetchBattle(battleInfo.code, true);
      }, 3500);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [battleInfo, outcome, fetchBattle]);

  // Copy invitation link
  const copyInviteLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const activeCode = battleInfo?.code || code;
    const url = `${origin}/battle?code=${encodeURIComponent(activeCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Please copy the URL manually from your address bar.");
    }
  };

  // 1. Create a new battle
  const handleCreateBattle = async () => {
    if (status !== "authenticated") {
      const returnUrl = `/battle`;
      await signIn(returnUrl);
      return;
    }

    setBusy(true);
    setBusyMessage("Setting up battle challenge…");
    setError("");

    try {
      let analysisId = typeof window !== "undefined"
        ? sessionStorage.getItem("roasttube:analysisId")
        : null;

      // If user has never analyzed, do a quick analysis first!
      if (!analysisId && !hasAnalysis) {
        setBusyMessage("Analyzing your YouTube stats for the challenge…");
        const aRes = await fetch("/api/analyze", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
        const aData = await aRes.json();
        if (!aRes.ok) throw new Error(apiError(aData, "YouTube analysis failed."));
        analysisId = aData.analysisId;
        if (typeof window !== "undefined" && analysisId) {
          sessionStorage.setItem("roasttube:analysisId", analysisId);
        }
        setHasAnalysis(true);
      }

      setBusyMessage("Generating your battle invite…");
      const res = await fetch("/api/battle", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysisId || undefined,
          persona,
          lang,
          heat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiError(data, "Could not create battle."));

      const newCode = data.code;
      setCode(newCode);
      setInputCode(newCode);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/battle?code=${encodeURIComponent(newCode)}`);
      }
      await fetchBattle(newCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create battle.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  };

  // 2. Join a battle (Opponent accepts challenge)
  const handleJoinBattle = async () => {
    const activeCode = battleInfo?.code || code;
    if (!activeCode) return;

    if (status !== "authenticated") {
      const returnUrl = `/battle?code=${encodeURIComponent(activeCode)}`;
      await signIn(returnUrl);
      return;
    }

    if (!consent) {
      setError("Please check the consent box to share your comparison.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      let analysisId = typeof window !== "undefined"
        ? sessionStorage.getItem("roasttube:analysisId")
        : null;

      // If user doesn't have an analysis, run one directly here
      if (!analysisId && !hasAnalysis) {
        setBusyMessage("Scanning your YouTube feeds to compare…");
        const aRes = await fetch("/api/analyze", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
        const aData = await aRes.json();
        if (!aRes.ok) throw new Error(apiError(aData, "YouTube scan failed."));
        analysisId = aData.analysisId;
        if (typeof window !== "undefined" && analysisId) {
          sessionStorage.setItem("roasttube:analysisId", analysisId);
        }
        setHasAnalysis(true);
      }

      setBusyMessage("Entering the ring & writing the verdict…");
      const res = await fetch(`/api/battle/${encodeURIComponent(activeCode)}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysisId || undefined,
          consent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiError(data, "Could not join battle."));

      if (data.status === "done" && data.result) {
        setOutcome(data.result);
        setIsSample(false);
      } else {
        await fetchBattle(activeCode);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join battle.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  };

  // Reset to start a new battle
  const handleNewBattle = () => {
    setOutcome(null);
    setIsSample(false);
    setBattleInfo(null);
    setCode("");
    setInputCode("");
    setError("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/battle");
    }
  };

  return (
    <section className="mt-8 max-w-[1100px] mx-auto px-2">
      {/* If battle outcome is ready, show outcome */}
      {outcome ? (
        <BattleOutcome
          result={outcome}
          sample={isSample}
          battleCode={battleInfo?.code || code}
          onNewBattle={handleNewBattle}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b-2 border-black pb-4">
            <p className="mono text-xs text-[#f22968] font-bold">
              ⚔️ ROASTTUBE BATTLE MODE
            </p>
            <h1 className="display text-5xl md:text-6xl mt-2">
              Who’s more cooked?
            </h1>
            <p className="font-semibold text-lg mt-2 text-[#4a3f35]">
              Compare your algorithmic brain rot side-by-side with a friend. No solo roasts—just pure head-to-head humiliation.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-4 bg-[#ffe3e5] border-2 border-[#ed3346] font-bold text-sm text-[#b01832] flex items-center justify-between"
            >
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="underline text-xs ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ACTIVE INVITE OR WAITING ROOM */}
          {code && battleInfo ? (
            <div className="comic-card p-6 md:p-8 bg-[#fff8e8]">
              {loadingBattle ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <LoaderCircle className="animate-spin text-[#f22968]" size={28} />
                  <span className="font-bold">Loading challenge info…</span>
                </div>
              ) : battleInfo.isCreator ? (
                /* CREATOR WAITING ROOM */
                <div>
                  <div className="flex items-center gap-2 text-[#f22968] font-bold mono text-xs">
                    <Sparkles size={16} /> CHALLENGE ACTIVE
                  </div>
                  <h2 className="display text-3xl md:text-4xl mt-2">
                    Waiting for your opponent to accept…
                  </h2>
                  <p className="mt-2 text-sm md:text-base">
                    Share this invitation link with your friend. As soon as they accept, this screen will automatically reveal the duel outcome!
                  </p>

                  <div className="mt-6 p-4 border-2 border-black bg-[#f6ce47]">
                    <span className="mono text-xs font-bold block text-black">
                      YOUR INVITE LINK
                    </span>
                    <p className="mono text-sm md:text-base font-bold mt-1 break-all bg-white p-3 border border-black">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/battle?code=${battleInfo.code}`
                        : `roast-tube.com/battle?code=${battleInfo.code}`}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <button
                        onClick={copyInviteLink}
                        className="comic-button bg-black text-white hover:bg-neutral-800 flex items-center gap-2"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copied Link!" : "Copy Invite Link"}
                      </button>
                      <button
                        onClick={() => fetchBattle(battleInfo.code)}
                        className="comic-button secondary flex items-center gap-2"
                      >
                        <RefreshCw size={16} /> Check Status
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3 text-sm text-[#4a3f35] bg-[#fff0d4] p-3 border border-black">
                    <LoaderCircle className="animate-spin text-[#f22968]" size={18} />
                    <span>
                      Listening for opponent… No need to refresh.
                    </span>
                  </div>

                  <button
                    onClick={handleNewBattle}
                    className="mt-6 text-sm underline font-bold text-neutral-600 block"
                  >
                    Cancel or create a different battle
                  </button>
                </div>
              ) : (
                /* FRIEND / INVITEE CHALLENGE CARD */
                <div>
                  <div className="inline-block bg-[#f22968] text-white px-2.5 py-1 mono text-xs font-bold mb-3">
                    CHALLENGE INVITATION
                  </div>
                  <h2 className="display text-3xl md:text-4xl">
                    <span className="text-[#f22968]">{battleInfo.creatorName}</span> challenged you to a Battle!
                  </h2>
                  <p className="mt-2 text-base text-[#4a3f35]">
                    {battleInfo.creatorName} wants to see whose YouTube history is deeper in the algorithmic trenches.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
                    <div className="border-2 border-black p-3 bg-[#f5edda]">
                      <small className="mono text-[10px] block">PERSONA</small>
                      <strong className="text-sm block mt-1">{personaLabels[battleInfo.persona]}</strong>
                    </div>
                    <div className="border-2 border-black p-3 bg-[#f5edda]">
                      <small className="mono text-[10px] block">HEAT LEVEL</small>
                      <strong className="text-sm block mt-1 capitalize">{battleInfo.heat}</strong>
                    </div>
                    <div className="border-2 border-black p-3 bg-[#f5edda] col-span-2 sm:col-span-1">
                      <small className="mono text-[10px] block">LANGUAGE</small>
                      <strong className="text-sm block mt-1 uppercase">{battleInfo.lang}</strong>
                    </div>
                  </div>

                  {status !== "authenticated" ? (
                    <div className="border-2 border-black p-6 bg-[#f6ce47] mt-5">
                      <h3 className="display text-2xl">Ready to battle?</h3>
                      <p className="text-sm mt-1 mb-4">
                        Sign in with Google so we can scan your liked videos and subscriptions (read-only).
                      </p>
                      <button
                        onClick={() =>
                          signIn(`/battle?code=${encodeURIComponent(battleInfo.code)}`)
                        }
                        className="comic-button bg-black text-white hover:bg-neutral-800 text-base"
                      >
                        Sign in with Google to Accept <ArrowRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-black p-6 bg-[#f6ce47] mt-5 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                        <Check className="text-emerald-700" size={18} />
                        Signed in as {sessionData?.user?.name || sessionData?.user?.email}
                      </div>

                      <label className="flex items-start gap-3 text-sm cursor-pointer select-none bg-[#fff8e8] p-3 border border-black">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-1 accent-[#f22968]"
                        />
                        <span>
                          I consent to read-only YouTube comparison (likes & subscriptions) for this battle against <b>{battleInfo.creatorName}</b>.
                        </span>
                      </label>

                      <button
                        onClick={handleJoinBattle}
                        disabled={!consent || busy}
                        className="comic-button text-base flex items-center gap-2 bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {busy ? (
                          <>
                            <LoaderCircle className="animate-spin" size={18} />
                            {busyMessage || "Battling…"}
                          </>
                        ) : (
                          <>
                            <Swords size={18} /> Accept Challenge & Battle Now
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleNewBattle}
                    className="mt-6 text-sm underline font-bold text-neutral-600 block"
                  >
                    Dismiss this challenge
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* CREATE OR JOIN SECTION (When no active code is loaded) */
            <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
              {/* CREATE CHALLENGE */}
              <article className="comic-card p-6 md:p-8 bg-[#fff8e8]">
                <div className="flex items-center gap-2 text-[#f22968] font-bold mono text-xs">
                  <Swords size={16} /> CREATE A CHALLENGE
                </div>
                <h2 className="display text-3xl md:text-4xl mt-2">
                  Challenge a friend
                </h2>
                <p className="mt-2 text-sm text-[#4a3f35]">
                  Pick your roast flavor. We’ll generate an invitation link for your friend to enter the arena.
                </p>

                {/* Persona */}
                <div className="mt-5">
                  <label className="block mono text-xs font-bold mb-2">
                    ROASTER PERSONA
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(personaLabels) as Persona[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPersona(p)}
                        className={`p-2.5 text-xs font-bold border-2 border-black text-left transition-colors ${
                          persona === p ? "bg-[#f22968] text-white" : "bg-[#f5edda] hover:bg-[#fff0d4]"
                        }`}
                      >
                        {personaLabels[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heat & Lang */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block mono text-xs font-bold mb-2">
                      HEAT LEVEL
                    </label>
                    <div className="flex gap-1">
                      {(["mild", "medium", "max"] as Heat[]).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHeat(h)}
                          className={`flex-1 py-2 text-xs font-bold border-2 border-black capitalize ${
                            heat === h ? "bg-[#f6ce47] text-black" : "bg-[#f5edda]"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mono text-xs font-bold mb-2">
                      LANGUAGE
                    </label>
                    <div className="flex gap-1">
                      {(["en", "tanglish", "hinglish"] as Lang[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLang(l)}
                          className={`flex-1 py-2 text-xs font-bold border-2 border-black uppercase ${
                            lang === l ? "bg-[#f6ce47] text-black" : "bg-[#f5edda]"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black">
                  <button
                    onClick={handleCreateBattle}
                    disabled={busy}
                    className="comic-button text-base flex items-center gap-2"
                  >
                    {busy ? (
                      <>
                        <LoaderCircle className="animate-spin" size={18} />
                        {busyMessage || "Creating challenge…"}
                      </>
                    ) : (
                      <>
                        <Swords size={18} /> Create Battle Invite
                      </>
                    )}
                  </button>
                  <p className="text-xs text-neutral-600 mt-2">
                    {status === "authenticated"
                      ? "Uses your connected YouTube account."
                      : "You will be prompted to sign in with Google."}
                  </p>
                </div>
              </article>

              {/* JOIN FRIEND CHALLENGE */}
              <article className="comic-card bg-[#f6ce47] p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h2 className="display text-3xl">Join a challenge</h2>
                  <p className="mt-2 text-sm font-semibold">
                    Received an invite code or link from a friend? Paste it below to battle them.
                  </p>

                  <label className="font-bold text-xs mono block mt-5">
                    INVITATION CODE OR URL
                    <input
                      className="block w-full border-2 border-black p-3 bg-[#fff8e8] mt-1 font-mono text-base"
                      value={inputCode}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val.includes("code=")) {
                          val = val.split("code=")[1]?.split("&")[0] || val;
                        }
                        setInputCode(val);
                      }}
                      placeholder="e.g. j7x92m4k"
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (!inputCode.trim()) return;
                      setCode(inputCode.trim());
                      fetchBattle(inputCode.trim());
                    }}
                    disabled={!inputCode.trim() || loadingBattle}
                    className="comic-button mt-4 w-full flex items-center justify-center gap-2"
                  >
                    {loadingBattle ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    Find Challenge
                  </button>
                </div>

                <div className="mt-8 pt-4 border-t border-black text-xs space-y-2">
                  <p className="font-bold">How it works:</p>
                  <p>1. Both players link their YouTube read-only stats.</p>
                  <p>2. We compute shared channels, category overlap & Brainrot score.</p>
                  <p>3. AI roasts both of you in a single ruthless verdict.</p>
                </div>
              </article>
            </div>
          )}

          {/* Sample battle button */}
          <div className="pt-2">
            <button
              className="comic-button secondary text-xs flex items-center gap-2"
              onClick={() => {
                setOutcome(sampleBattle);
                setIsSample(true);
              }}
            >
              <Sparkles size={14} /> Preview a sample battle result
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
