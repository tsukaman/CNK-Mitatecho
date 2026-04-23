"use client";

import { useState } from "react";
import type { Character } from "@/types";
import { splitPoem } from "@/lib/poem-utils";

interface ShareButtonProps {
  character: Character;
  resultId: string;
  poem: string | null;
}

export default function ShareButton({ character, resultId, poem }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  // シェアURLは /share/[id] を指す。クローラはこのURLを取得して OGP メタタグを読み、
  // 人間は同エンドポイントから即座に /result?id=xxx にリダイレクトされる。
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/share/${resultId}`
    : "";

  const { kamiNoKu, shimoNoKu } = poem
    ? splitPoem(poem)
    : { kamiNoKu: "", shimoNoKu: "" };

  const textBody = [
    `⚔ 我は【${character.name}】`,
    `──${character.title}なり`,
    "",
    "🎴 AIが詠みし、われへの一首 ──",
    "",
    kamiNoKu,
    shimoNoKu,
    "",
    "#風雲戦国見立帖 #千人一首 #CloudNativeKaigi",
  ].join("\n");

  const handleTweet = async () => {
    // まず Web Share API を試す。モバイル OS / 対応デスクトップブラウザでは
    // ネイティブのシェアシートが出るため、X 新UIの二重 composer バグを回避できる。
    // 未対応ブラウザ (Firefox 等) では intent URL へフォールバック。
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `我は【${character.name}】なり`,
          text: textBody,
          url,
        });
        return;
      } catch (err) {
        // ユーザがダイアログを閉じた (AbortError) 場合は intent フォールバックさせない
        if (err instanceof Error && err.name === "AbortError") return;
        // それ以外は intent にフォールバック
      }
    }

    const text = `${textBody}\n\n${url}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleTweet}
        className="wa-cta flex-1 rounded-lg px-4 py-3 text-sm font-bold"
      >
        <svg viewBox="0 0 24 24" className="inline-block w-4 h-4 mr-1.5 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        でポスト
      </button>
      <button
        onClick={handleCopyUrl}
        className="wa-btn rounded-lg px-4 py-3 text-sm"
      >
        {copied ? "コピー済み" : "URLコピー"}
      </button>
    </div>
  );
}
