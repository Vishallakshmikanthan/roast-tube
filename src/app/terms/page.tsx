"use client";

import { Link } from "@/lib/navigation";
import { ArrowLeft } from "lucide-react";

const clauses = [
  [
    "01 / Entertainment, not evaluation",
    "RoastTube is for entertainment and comedy only. All diagnoses, meters, aura scores, red flags and AI-generated roasts are satirical; they are not factual assessments, psychological evaluations or medical advice.",
  ],
  [
    "02 / Age requirement",
    "You must be at least 13 years old (or the applicable minimum age in your jurisdiction) and have a valid Google account with YouTube access.",
  ],
  [
    "03 / YouTube terms",
    "Your use of this app is also subject to the YouTube Terms of Service. You authorize only the read-only data access shown on Google’s consent screen.",
  ],
  [
    "04 / Respectful use",
    "Do not use RoastTube to harass, threaten, impersonate or expose another person. Battle invitations and public sharing should be sent only with the other person’s consent.",
  ],
  [
    "05 / Service disclaimers",
    "The service is provided “as is” without warranties of any kind. RoastTube and its operators are not liable for damages resulting from use of the service, to the extent permitted by law.",
  ],
];

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-bold text-sm mb-7"
      >
        <ArrowLeft size={16} /> Back to RoastTube
      </Link>
      <article className="comic-card p-6 md:p-9">
        <p className="mono text-xs text-[#f22968]">
          THE SMALL PRINT / 100% HUMAN-READABLE
        </p>
        <h1 className="display text-6xl mt-2">Terms of service</h1>
        <div className="space-y-7 border-t border-black/20 pt-6 mt-6">
          {clauses.map(([title, copy]) => (
            <section key={title}>
              <h2 className="display text-3xl mb-2">{title}</h2>
              <p className="text-sm leading-relaxed">{copy}</p>
            </section>
          ))}
          <section>
            <h2 className="display text-3xl mb-2">06 / Third-party policies</h2>
            <p className="text-sm leading-relaxed">
              By using RoastTube, you acknowledge and agree that your usage is
              subject to the{" "}
              <a
                className="underline font-bold"
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
              >
                YouTube Terms of Service
              </a>{" "}
              and the{" "}
              <a
                className="underline font-bold"
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
