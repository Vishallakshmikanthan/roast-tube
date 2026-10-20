import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to RoastTube</span>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
      </div>

      <div className="space-y-6 text-sm leading-relaxed border-t border-slate-800 pt-6">
        <section>
          <h2 className="text-lg font-bold text-white mb-2">1. Information We Access</h2>
          <p>
            When you sign in with Google, RoastTube requests read-only access to your YouTube data via the official{" "}
            <code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded">https://www.googleapis.com/auth/youtube.readonly</code>{" "}
            scope, along with basic profile identity (your first name and avatar URL). We never receive or store your Google password.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Data</h2>
          <p>
            Your liked videos, subscriptions, and playlists are processed to calculate aggregated statistics (e.g. category distribution, brain rot score). A sanitized, non-sensitive sample of titles and channel names is sent to an AI language model provider solely to generate your humor roast. We do not sell your data, we display no third-party advertisements, and we do not use your data to train general machine learning models.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">3. Data Retention and Storage</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Raw YouTube responses:</strong> Kept in server memory only during your request and never saved to persistent storage.</li>
            <li><strong>Encrypted sample:</strong> Stored using AES-256-GCM in cache for at most 24 hours to allow language/persona switching without re-querying YouTube.</li>
            <li><strong>Roasts and derived stats:</strong> Retained for at most 30 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">4. Google API Limited Use Disclosure</h2>
          <p className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-slate-200">
            RoastTube&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              className="text-rose-400 underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">5. User Control & Deletion</h2>
          <p>
            You can delete all your stored stats and roasts at any time through the app. You can also revoke RoastTube&apos;s access immediately at any time via your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
              className="text-rose-400 underline"
            >
              Google Account Permissions
            </a>{" "}
            page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2">6. Third-Party Policies</h2>
          <p>
            RoastTube utilizes YouTube API Services. By using RoastTube, users agree to be bound by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="text-rose-400 underline"
            >
              YouTube Terms of Service
            </a>{" "}
            and the{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-rose-400 underline"
            >
              Google Privacy Policy
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
