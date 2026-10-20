"use client";

import { useState } from "react";
import { Link } from "@/lib/navigation";
import { useSession } from "@/components/providers/AuthProvider";
import { apiError } from "@/lib/api-error";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function PrivacyPage() {
  const { data } = useSession();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const erase = async () => {
    if (confirm !== "DELETE" || busy || !data?.user) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/me", {
        method: "DELETE",
        credentials: "include",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(apiError(d, "Deletion could not be completed."));
      const identity = data?.user?.googleSub || data?.user?.email;
      if (identity) localStorage.removeItem(`roasttube:saved:${identity}`);
      sessionStorage.removeItem("roasttube:analysisId");
      setMessage(
        "Your RoastTube account data and this device’s saved roast list were removed.",
      );
      setConfirm("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Deletion request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-bold text-sm mb-7"
      >
        <ArrowLeft size={16} /> Back to RoastTube
      </Link>
      <section className="comic-card p-6 md:p-9">
        <p className="mono text-xs text-[#f22968]">
          YOUR DATA / NO FUNNY BUSINESS
        </p>
        <h1 className="display text-6xl mt-2">Privacy policy</h1>
        <p className="mt-3 text-sm text-[#62584b]">
          RoastTube analyzes limited YouTube data only after you authorize
          Google read-only access.
        </p>
        <div className="space-y-7 text-sm leading-relaxed border-t border-black/20 pt-6 mt-6">
          <section>
            <h2 className="display text-3xl mb-2">
              01 / Information we access
            </h2>
            <p>
              When you sign in with Google, RoastTube requests read-only YouTube
              access through the official{" "}
              <code className="bg-[#f5edda] px-1">
                https://www.googleapis.com/auth/youtube.readonly
              </code>{" "}
              scope, along with basic profile identity (your first name and
              avatar URL). The service analyzes liked videos, subscriptions and
              playlists. We never receive or store your Google password. The API
              does not provide your watch history or watch hours to RoastTube.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl mb-2">02 / How it is used</h2>
            <p>
              Your liked videos, subscriptions, and playlists are processed to
              calculate aggregated statistics (e.g. category distribution, brain
              rot score). A sanitized, non-sensitive sample of titles and
              channel names is sent to an AI language model provider solely to
              generate your humor roast. We do not sell your data, we display no
              third-party advertisements, and we do not use your data to train
              general machine learning models.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl mb-2">
              03 / Retention and storage
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Raw YouTube responses are held in server memory during
                processing and are not saved as persistent raw history.
              </li>
              <li>
                Encrypted sample data is stored using AES-256-GCM in cache for
                at most 24 hours to support persona/language changes without
                re-querying YouTube.
              </li>
              <li>
                Server-held roasts and derived statistics are retained for at
                most 30 days.
              </li>
              <li>
                Your “My roasts” list is saved in this browser on this device
                and scoped to the current account identity. It is not a
                server-side list.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="display text-3xl mb-2">
              04 / Google API Limited Use
            </h2>
            <p className="border-2 border-black bg-[#f6ce47] p-4">
              RoastTube’s use and transfer to any other app of information
              received from Google APIs will adhere to the{" "}
              <a
                className="underline font-bold"
                target="_blank"
                rel="noreferrer"
                href="https://developers.google.com/terms/api-services-user-data-policy"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl mb-2">
              05 / Your control and deletion
            </h2>
            <p>
              You can revoke RoastTube access at any time in{" "}
              <a
                className="underline font-bold"
                target="_blank"
                rel="noreferrer"
                href="https://myaccount.google.com/permissions"
              >
                Google Account Permissions
              </a>
              . You can also ask RoastTube to delete server-held data below.
              Browser-saved history can be removed from My roasts or cleared in
              your browser storage.
            </p>
          </section>
          {data?.user && (
            <section className="border-2 border-[#ed3346] bg-[#fff0ef] p-5">
              <h2 className="display text-3xl flex gap-2 items-center">
                <Trash2 /> Delete my RoastTube data
              </h2>
              <p className="mt-2">
                This permanently deletes the data associated with your account
                on RoastTube. Enter <b>DELETE</b> to confirm. This action is
                for your signed-in account, not the illustrative sample data.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <input
                  aria-label="Type DELETE to confirm"
                  className="border-2 border-black bg-[#fff8e8] p-3"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Type DELETE"
                />
                <button
                  className="comic-button !bg-[#ed3346]"
                  disabled={busy || confirm !== "DELETE"}
                  onClick={erase}
                >
                  {busy ? "Deleting…" : "Delete my data"}
                </button>
              </div>
              {message && (
                <p role="status" className="mt-3 font-bold">
                  {message}
                </p>
              )}
            </section>
          )}
          <section>
            <h2 className="display text-3xl mb-2">06 / Third-party policies</h2>
            <p>
              RoastTube uses YouTube API Services. By using this application you
              agree to the{" "}
              <a
                className="underline font-bold"
                target="_blank"
                rel="noreferrer"
                href="https://www.youtube.com/t/terms"
              >
                YouTube Terms of Service
              </a>{" "}
              and{" "}
              <a
                className="underline font-bold"
                target="_blank"
                rel="noreferrer"
                href="https://policies.google.com/privacy"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
