import { AuthButtons } from "@/components/auth/AuthButtons";
import { Flame, Sparkles, Shield, Zap, Skull, Swords, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex-1 flex flex-col justify-between overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-rose-600/20 via-amber-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-xl shadow-lg shadow-rose-900/30">
            <Flame className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Roast<span className="text-rose-500">Tube</span>
          </span>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-400">
          <Link href="/privacy" className="hover:text-slate-200 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-200 transition-colors">
            Terms
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Brutally Honest AI Roasting for YouTube</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
          How <span className="bg-gradient-to-r from-rose-500 via-red-500 to-amber-400 bg-clip-text text-transparent">cooked</span> is your YouTube?
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10">
          Sign in with Google. We safely scan your liked videos, subscriptions and playlists (100% read-only), and an AI roasts your taste ruthlessly in <span className="text-white font-medium">English</span>, <span className="text-rose-400 font-medium">Tanglish</span>, or <span className="text-amber-400 font-medium">Hinglish</span>.
        </p>

        {/* Auth CTA & Google Consent */}
        <div className="w-full mb-16">
          <AuthButtons />
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <Skull className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-base mb-1">5 Personas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Angry Chef, Disappointed Aunt, Gym Bro, Gen Alpha Kid, and 90s News Anchor.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-base mb-1">3 Heat Levels</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              From friendly teasing (Mild) to &quot;Call My Mom&quot; emotional destruction.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-base mb-1">3 Languages</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant toggling between English, Tanglish, and Hinglish with zero re-scanning.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Swords className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-base mb-1">Roast Battle</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Challenge friends with an invite link to crown the bigger algorithm disaster.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance and Policy Footer as mandated in §1.4, §14.2, §16.1 */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p>
              RoastTube&apos;s use and transfer to any other app of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-300"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p>
              By using RoastTube, you agree to the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-300"
              >
                YouTube Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-300"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
