"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { toPng, toBlob } from "html-to-image";
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  LoaderCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { ScorecardCard, ScorecardProps } from "./ScorecardCard";

interface ScorecardModalProps {
  roast: ScorecardProps["roast"];
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
}

export default function ScorecardModal({
  roast,
  isOpen,
  onClose,
  publicUrl,
}: ScorecardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string>("");

  const generateCardImage = useCallback(async (): Promise<{ dataUrl: string; blob: Blob | null } | null> => {
    if (!cardRef.current) return null;
    try {
      setGenerating(true);
      // Generate clean PNG data URL
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Crisp retina quality
      });
      setImageUrl(dataUrl);

      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      return { dataUrl, blob };
    } catch (err) {
      console.error("Failed to generate scorecard image:", err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  // When modal opens, pre-generate the high-res image
  useEffect(() => {
    if (isOpen) {
      setImageUrl(null);
      setShareStatus("");
      const timer = setTimeout(() => {
        generateCardImage();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generateCardImage]);

  if (!isOpen) return null;

  const downloadImage = async () => {
    let url = imageUrl;
    if (!url) {
      const result = await generateCardImage();
      url = result?.dataUrl || null;
    }
    if (!url) {
      setShareStatus("Failed to generate image.");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `RoastTube-Brainrot-Report-${roast.slug || "scorecard"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShareStatus("Scorecard PNG downloaded!");
  };

  const handleNativeShare = async () => {
    setShareStatus("");
    try {
      let resultBlob: Blob | null = null;
      if (cardRef.current) {
        setGenerating(true);
        resultBlob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true });
        setGenerating(false);
      }

      const score = roast.stats?.brainRotScore ?? 50;
      const title = `My RoastTube Brainrot Score: ${score}/100`;
      const text = `${roast.content?.share_line || "My YouTube taste has been roasted."}\n${publicUrl}`;

      if (resultBlob && navigator.share && navigator.canShare) {
        const file = new File([resultBlob], "RoastTube-Scorecard.png", {
          type: "image/png",
        });

        const shareData = {
          title,
          text,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareStatus("Scorecard shared!");
          return;
        }
      }

      // If mobile file share is not supported, download image + copy text
      await downloadImage();
      await navigator.clipboard.writeText(text);
      setShareStatus("Scorecard downloaded & roast text copied to clipboard!");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.warn("Share fallback:", err);
      await downloadImage();
    }
  };

  const copyShareText = async () => {
    const score = roast.stats?.brainRotScore ?? 50;
    const text = `🔥 My RoastTube Brainrot Score: ${score}/100 (${roast.content?.tier_title})\n\n"${roast.content?.roast?.slice(0, 140)}..."\n\nCheck your YouTube roast here:\n${publicUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setShareStatus("Share text & link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const score = roast.stats?.brainRotScore ?? 50;
    const text = encodeURIComponent(
      `🔥 My RoastTube Brainrot Score: ${score}/100 (${roast.content?.tier_title})\n"${roast.content?.share_line}"\n\n${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareX = () => {
    const score = roast.stats?.brainRotScore ?? 50;
    const text = encodeURIComponent(
      `My @RoastTube Brainrot Report Card: ${score}/100 (${roast.content?.tier_title}) 💀🔥\n\n${publicUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#f7f2e4] rounded-3xl border-[3px] border-black p-4 sm:p-6 shadow-[12px_12px_0_#18130f] my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border-2 border-black flex items-center justify-center hover:bg-[#ffe2e7] transition-colors z-20 shadow-[2px_2px_0_#18130f]"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#f22968] text-white font-black text-[11px] px-2.5 py-0.5 rounded-full border border-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> OFFICIAL SCORECARD
            </span>
            <span className="text-xs font-bold text-[#6d5f4f]">READY TO SHARE</span>
          </div>
          <h2 className="display text-3xl sm:text-4xl mt-1 leading-tight">
            Share Your Brainrot Scorecard
          </h2>
          <p className="text-xs sm:text-sm text-[#4b4034] font-medium">
            Share your official trading card and badge report directly as an image!
          </p>
        </div>

        {/* Scorecard Preview Area */}
        <div className="max-h-[62vh] overflow-y-auto overflow-x-auto rounded-2xl border-2 border-black/30 p-2 sm:p-4 bg-black/5 shadow-inner">
          <div className="flex justify-center min-w-[620px]">
            <ScorecardCard ref={cardRef} roast={roast} />
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleNativeShare}
              disabled={generating}
              className="comic-button w-full text-base flex items-center justify-center gap-2 py-3"
            >
              {generating ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <Share2 size={18} />
              )}
              Share Scorecard Image
            </button>

            <button
              onClick={downloadImage}
              disabled={generating}
              className="comic-button secondary w-full text-base flex items-center justify-center gap-2 py-3"
            >
              <Download size={18} /> Download Scorecard PNG
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/20 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={shareWhatsApp}
                className="px-3 py-1.5 bg-[#25d366] text-white font-extrabold rounded-lg border border-black shadow-[2px_2px_0_#18130f] hover:brightness-105"
              >
                WhatsApp
              </button>
              <button
                onClick={shareX}
                className="px-3 py-1.5 bg-black text-white font-extrabold rounded-lg border border-black shadow-[2px_2px_0_#333] hover:brightness-125"
              >
                Share on 𝕏
              </button>
              <button
                onClick={copyShareText}
                className="px-3 py-1.5 bg-white text-black font-extrabold rounded-lg border border-black shadow-[2px_2px_0_#18130f] hover:bg-neutral-100 flex items-center gap-1"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>

            {shareStatus && (
              <span className="font-extrabold text-[#f22968] animate-pulse">
                {shareStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
