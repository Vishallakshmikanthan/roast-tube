"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Flame, LogIn, LogOut, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

export function AuthButtons() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl: "/roast" });
    } catch (err) {
      console.error("Sign in failed:", err);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Sign out failed:", err);
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (session?.user) {
    const firstName = session.user.firstName || session.user.name?.split(" ")[0] || "Friend";

    return (
      <div className="w-full max-w-md mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-5">
        <div className="flex items-center gap-4 w-full pb-4 border-b border-slate-800/80">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={firstName}
              width={48}
              height={48}
              className="rounded-full ring-2 ring-rose-500/50"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-lg">
              {firstName[0]}
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 inline" /> Authenticated
            </span>
            <span className="font-semibold text-slate-100 truncate text-base">
              Welcome, {firstName}!
            </span>
            <span className="text-xs text-slate-400 truncate">
              {session.user.email ?? "Google account linked"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/roast"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Flame className="w-5 h-5 fill-current animate-pulse text-amber-200" />
            <span>Generate My Roast</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4">
      {/* Consent Box as mandated by Module 1 §6.2 */}
      <div className="w-full p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left text-xs text-slate-400 leading-relaxed backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Read-Only YouTube Permission</span>
        </div>
        <p>
          We&apos;ll read your liked videos, subscriptions and playlists (read-only). We send a short sample of titles and channel names to an AI model to write your roast. We don&apos;t keep your raw data: the sample is erased within 24 hours, and you can delete everything anytime.
        </p>
      </div>

      {/* Main Google Sign-In Button */}
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-rose-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
        <span>Sign in with Google to Roast Me</span>
      </button>

      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
        <span>🔒 No passwords accessed</span>
        <span>•</span>
        <span>⚡ Read-only access</span>
        <span>•</span>
        <span>🗑️ 24h automatic purge</span>
      </div>
    </div>
  );
}
