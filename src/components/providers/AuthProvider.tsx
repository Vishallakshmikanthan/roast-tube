"use client";

import {
  SessionProvider,
  useSession as useNextAuthSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import React, { useCallback, useMemo } from "react";

export interface SessionUser {
  id?: string;
  googleSub?: string;
  firstName?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Session {
  user?: SessionUser;
  expires?: string;
}

export type Status = "loading" | "authenticated" | "unauthenticated";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useSession() {
  const nextAuth = useNextAuthSession();

  const signIn = useCallback(async (callbackUrl = "/roast") => {
    try {
      const cfgRes = await fetch("/api/auth/config", { credentials: "include" }).catch(() => null);
      if (cfgRes && cfgRes.ok) {
        const cfg = (await cfgRes.json()) as { googleConfigured?: boolean };
        if (!cfg.googleConfigured) {
          throw new Error("Google sign-in is not configured yet. Missing Google client ID/secret.");
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Google sign-in is not configured")) {
        throw e;
      }
    }

    const targetUrl = typeof callbackUrl === "string" && callbackUrl.length > 0 ? callbackUrl : "/roast";
    await nextAuthSignIn("google", { callbackUrl: targetUrl });
  }, []);

  const signOut = useCallback(async (callbackUrl = "/") => {
    const targetUrl = typeof callbackUrl === "string" && callbackUrl.length > 0 ? callbackUrl : "/";
    await nextAuthSignOut({ callbackUrl: targetUrl });
  }, []);

  return useMemo(
    () => ({
      data: (nextAuth.data as Session | null) ?? null,
      status: nextAuth.status as Status,
      signIn,
      signOut,
    }),
    [nextAuth.data, nextAuth.status, signIn, signOut]
  );
}
