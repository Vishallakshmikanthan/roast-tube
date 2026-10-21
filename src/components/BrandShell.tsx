"use client";

import { Link, useLocation } from "@/lib/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useSession } from "@/components/providers/AuthProvider";

export function BrandShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { data, signOut } = useSession();

  return (
    <div className="min-h-[100dvh] paper-grid flex flex-col justify-between">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="max-w-[1240px] mx-auto bg-[#fff8e8] border-[2.5px] border-[#18130f] shadow-[4px_4px_0_#18130f] px-4 py-2.5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline text-inherit"
            aria-label="RoastTube home"
          >
            <span className="w-9 h-9 bg-[#f6ce47] border-2 border-[#18130f] flex items-center justify-center">
              <img
                src="/images/pixel-cat-cutout.webp"
                alt=""
                className="w-9 h-9 object-contain"
              />
            </span>
            <span className="display text-[27px] leading-none">
              Roast<span className="text-[#f22968]">Tube</span>
            </span>
          </Link>
          <nav
            className={`${open ? "flex" : "hidden"} md:flex absolute md:static top-[64px] left-3 right-3 md:inset-auto flex-col md:flex-row items-stretch md:items-center gap-1 bg-[#fff8e8] md:bg-transparent border-2 md:border-0 border-[#18130f] p-3 md:p-0 shadow-[4px_4px_0_#18130f] md:shadow-none`}
          >
            {[
              ["/", "Home"],
              ["/roasts", "My roasts"],
              ["/battle", "Battle"],
              ["/privacy", "Privacy"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 text-sm font-extrabold no-underline text-[#18130f] hover:bg-[#f6ce47] ${location === href ? "bg-[#f6ce47]" : ""}`}
              >
                {label}
              </Link>
            ))}
            {data?.user && (
              <button
                onClick={() => void signOut("/")}
                className="px-3 py-2 text-left text-sm font-bold border border-black cursor-pointer hover:bg-rose-100"
              >
                Sign out
              </button>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {data?.user ? (
              <span className="hidden sm:block max-w-28 truncate mono text-[11px] bg-[#f6ce47] px-2 py-1 border border-black">
                {data.user.firstName || "Signed in"}
              </span>
            ) : (
              <Link
                href="/roast"
                className="hidden sm:inline-flex comic-button !py-2 !px-3 !text-sm no-underline"
              >
                <span className="text-lg">G</span> Sign in{" "}
                <span aria-hidden>→</span>
              </Link>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden bg-transparent border-2 border-black p-2 cursor-pointer"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
      <footer className="mt-14 bg-[#1b1713] text-[#f5edda] px-5 py-7">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-5 justify-between text-xs leading-relaxed">
          <div className="max-w-3xl space-y-2">
            <p>
              RoastTube’s use and transfer to any other app of information
              received from Google APIs adheres to the{" "}
              <a
                className="underline text-[#f6ce47]"
                target="_blank"
                rel="noreferrer"
                href="https://developers.google.com/terms/api-services-user-data-policy"
              >
                Google API Services User Data Policy
              </a>
              , including Limited Use requirements.
            </p>
            <p>
              By using RoastTube, you agree to the{" "}
              <a
                className="underline text-[#f6ce47]"
                target="_blank"
                rel="noreferrer"
                href="https://www.youtube.com/t/terms"
              >
                YouTube Terms
              </a>{" "}
              and{" "}
              <a
                className="underline text-[#f6ce47]"
                target="_blank"
                rel="noreferrer"
                href="https://policies.google.com/privacy"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="flex gap-5 shrink-0">
            <Link href="/privacy" className="text-[#f5edda] underline">
              Privacy policy
            </Link>
            <Link href="/terms" className="text-[#f5edda] underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
