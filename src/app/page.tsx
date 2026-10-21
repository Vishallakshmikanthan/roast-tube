"use client";

import { Link, useLocation } from "@/lib/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useSession } from "@/components/providers/AuthProvider";
import { useState } from "react";
import { RoastTubeIntro } from "@/components/RoastTubeIntro";

export default function Home() {
  const { status, signIn } = useSession();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    if (status === "authenticated") {
      navigate("/roast");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await signIn("/roast");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start Google sign-in.",
      );
      setBusy(false);
    }
  };

  return (
    <>
      <RoastTubeIntro />
      <main className="max-w-[1240px] mx-auto px-4 pt-8">
      <section className="grid lg:grid-cols-[1fr_.92fr] gap-7 items-center min-h-[500px]">
        <div className="relative z-10 py-8">
          <span className="inline-flex border-2 border-black bg-[#f6ce47] px-3 py-1 font-extrabold text-xs uppercase tracking-wide -rotate-2 shadow-[3px_3px_0_#18130f]">
            Read-only. Roast-only. No chill.
          </span>
          <h1 className="display mt-6 text-[clamp(4rem,8vw,7rem)] leading-[.82] max-w-[690px]">
            Your YouTube
            <br />
            taste.
            <br />
            <span className="text-[#f22968]">Your public</span>
            <br />
            <span className="text-[#f22968]">humiliation.</span>
          </h1>
          <p className="max-w-[510px] mt-6 text-lg md:text-xl font-semibold leading-snug">
            Let the algorithm expose your questionable taste. You bring the
            watchlist; we bring the receipts.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={connect}
              disabled={busy || status === "loading"}
              className="comic-button text-lg"
            >
              {busy
                ? "Connecting…"
                : status === "authenticated"
                  ? "Roast my taste"
                  : "Connect YouTube"}{" "}
              <ArrowRight size={19} />
            </button>
            <Link
              href="/roast/demo"
              className="comic-button secondary text-lg no-underline"
            >
              <img
                src="/images/play-cat-cutout.webp"
                alt=""
                className="w-7 h-7 object-contain"
              />{" "}
              Try sample roast
            </Link>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-3 p-3 bg-[#ffe2e7] border-2 border-[#ed3346] font-bold text-sm"
            >
              {error}
            </p>
          )}
          <div className="mt-5 max-w-[550px] space-y-2">
            <div className="border-2 border-black bg-[#fff8e8] p-3 text-xs md:text-sm font-semibold flex items-start gap-2 shadow-[2px_2px_0_#18130f]">
              <ShieldCheck className="shrink-0 mt-0.5 text-[#278b6f]" size={18} />
              <span>
                <b>100% Read-Only:</b> We analyze your liked videos, subscriptions &amp;
                playlists. We never modify your account or ask for your password.
              </span>
            </div>
            {status !== "authenticated" && (
              <div className="border-2 border-black bg-[#fff2c2] p-3 text-xs font-semibold leading-relaxed shadow-[2px_2px_0_#18130f]">
                <p className="font-extrabold text-[#18130f] flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                  <span>💡</span> Sign-in Tip:
                </p>
                <p className="mt-1 text-[#332a21]">
                  When prompted by Google, be sure to tick the checkbox for{" "}
                  <b className="underline">“View your YouTube account”</b> so the AI can read your likes to roast you.
                  {" "}(If prompted with <i>“Unverified App”</i> during public beta, tap <b>Advanced ➔ Go to roasttube.vercel.app</b> to continue!)
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="meme-collage relative min-h-[390px] lg:min-h-[490px] flex items-center justify-center">
          <div className="absolute inset-3 bg-[#f22968] border-[3px] border-black rotate-2 shadow-[7px_7px_0_#18130f]"></div>
          <div className="absolute inset-5 border-2 border-black opacity-30 -rotate-3"></div>
          <img
            src="/images/pixel-cat-cutout.webp"
            alt="Pixel-art cat with a YouTube play button"
            className="relative z-10 w-[min(84%,460px)] max-h-[430px] object-contain drop-shadow-[5px_5px_0_#18130f]"
          />
          <img
            src="/images/judging-cat.webp"
            alt="A cat judging your questionable taste"
            className="absolute z-20 bottom-0 right-0 w-[39%] max-h-60 object-contain rotate-6 drop-shadow-[4px_4px_0_#18130f]"
          />
          <img
            src="/images/crying-doge.webp"
            alt=""
            className="absolute z-20 bottom-0 left-0 w-[42%] object-contain -rotate-6 drop-shadow-[4px_4px_0_#18130f]"
          />
          <div className="sticker absolute top-7 right-4 z-20 bg-[#fff8e8] px-4 py-3 display text-2xl leading-none">
            BRO WHAT
            <br />
            IS THIS?
          </div>
          <div className="absolute bottom-6 left-0 rotate-[-5deg] bg-[#f6ce47] border-2 border-black px-3 py-2 mono text-xs font-bold">
            BRAINROT
            <br />
            FOREVER?
          </div>
          <div
            className="absolute top-1/2 left-2 text-[#18130f] text-5xl display rotate-[-15deg]"
            aria-hidden
          >
            ?!
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {[
          ["NPC ENERGY", "A taste profile with receipts.", "#f6ce47"],
          ["TERMINAL BRAINROT", "The numbers do not lie.", "#f22968"],
          ["MAIN CHARACTER?", "A deeply unserious diagnosis.", "#33c9b4"],
          ["COOKED", "Friendship-safe levels of fire.", "#f28b45"],
        ].map(([title, desc, color]) => (
          <article
            key={title}
            className="comic-card p-4 min-h-[158px] relative overflow-hidden"
            style={{ backgroundColor: color }}
          >
            <h2 className="display relative z-10 text-3xl leading-none max-w-[145px]">
              {title}
            </h2>
            <p className="relative z-10 font-bold text-xs mt-4 max-w-[140px]">
              {desc}
            </p>
            <img
              src={
                title === "NPC ENERGY"
                  ? "/images/crying-doge.webp"
                  : title === "MAIN CHARACTER?"
                    ? "/images/judging-cat.webp"
                    : "/images/pixel-cat-cutout.webp"
              }
              alt=""
              className="absolute right-[-12px] bottom-[-12px] w-[100px] sm:w-[125px] object-contain opacity-80"
            />
          </article>
        ))}
      </section>
      <section className="grid md:grid-cols-[.75fr_1.25fr] gap-8 py-20 items-start">
        <div>
          <p className="mono text-xs font-bold text-[#f22968]">
            THE ROAST PROCESS / 01—03
          </p>
          <h2 className="display text-6xl leading-[.86] mt-3">
            A roast with
            <br />
            actual receipts.
          </h2>
          <p className="mt-4 max-w-sm font-medium text-[#554b40]">
            No vibes-based surveillance. Your roast is based on the YouTube data
            you authorize—and nothing else.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            [
              "01",
              "Connect",
              "Authorize read-only access through Google. We analyze your liked videos, subscriptions and playlists.",
            ],
            [
              "02",
              "Pick your heat",
              "Choose a roast persona, language and how spicy the truth should be.",
            ],
            [
              "03",
              "Take the hit",
              "Get a shareable diagnosis, receipts and a brainrot score.",
            ],
          ].map(([num, title, body]) => (
            <article key={num} className="comic-card p-5">
              <span className="mono text-[#f22968] font-bold">{num} /</span>
              <h3 className="display text-3xl mt-2">{title}</h3>
              <p className="text-sm mt-2 leading-relaxed">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-[3px] border-black bg-[#1b1713] text-[#fff8e8] p-6 md:p-9 shadow-[7px_7px_0_#f22968] mb-10 grid md:grid-cols-[1fr_auto] items-center gap-6">
        <div>
          <p className="mono text-xs text-[#f6ce47]">
            FIVE PERSONALITIES. THREE HEAT LEVELS.
          </p>
          <h2 className="display text-5xl mt-2">Choose your own damage.</h2>
          <p className="text-sm text-[#d3c5ad] mt-2 max-w-xl">
            Disappointed aunt, gym bro, angry chef, Gen Alpha or a news anchor
            who has seen too much. Mild, medium, or maximum.
          </p>
        </div>
        <Link
          href="/roast/demo"
          className="comic-button no-underline !bg-[#f6ce47] !text-black"
        >
          Preview a sample <ArrowRight size={18} />
        </Link>
      </section>
    </main>
    </>
  );
}
