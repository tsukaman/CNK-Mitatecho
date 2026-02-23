"use client";

import { useState } from "react";
import type { Character } from "@/types";

interface ShareButtonProps {
  character: Character;
  resultId: string;
}

export default function ShareButton({ character, resultId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/result?id=${resultId}`
    : "";

  const text = `汝の戦国エンジニア格は ${character.name}（${character.title}）\n#風雲戦国見立帖 #千人一首 #CNDNagoya`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${character.name} - 風雲戦国見立帖`, text, url });
      } catch {
        // User cancelled
      }
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="wa-cta flex-1 rounded-lg px-4 py-3 text-sm font-bold"
      >
        シェアする
      </button>
      <button
        onClick={handleCopy}
        className="wa-btn rounded-lg px-4 py-3 text-sm"
      >
        {copied ? "コピー済み" : "URLコピー"}
      </button>
    </div>
  );
}
