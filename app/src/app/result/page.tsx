"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { getCharacter } from "@/lib/characters";
import { SCENARIOS } from "@/lib/scenarios";
import type { ResultData, Character } from "@/types";
import TitleLogo from "@/components/TitleLogo";
import ResultDisplay from "@/components/ResultDisplay";
import GalleryList from "@/components/GalleryList";
import ShareButton from "@/components/ShareButton";

function ResultContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [result, setResult] = useState<ResultData | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初回取得
  useEffect(() => {
    if (!id) {
      setError("IDが指定されていません");
      setLoading(false);
      return;
    }

    api
      .getResult(id)
      .then((data) => {
        setResult(data);
        setCharacter(getCharacter(data.character_id));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "結果が見つかりません");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 短歌が未生成の場合ポーリングで再取得（最大30秒）
  useEffect(() => {
    if (!id || !result || result.poem) return;

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await api.getResult(id);
        if (data.poem) {
          setResult(data);
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, result?.poem]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-32">
        <p className="text-sm text-sumi-400">見立帖を読み解いています...</p>
      </div>
    );
  }

  if (error || !result || !character || !id) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-20">
        <p className="text-sm text-beni-600">{error || "結果が見つかりません"}</p>
      </div>
    );
  }

  const scenario = SCENARIOS[result.card_id];

  return (
    <>
      {/* ヒーローセクション — 全幅 */}
      <section className="relative w-full min-h-[28vh] sm:min-h-[32vh] overflow-hidden">
        <Image
          src="/hero-bg.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="relative z-10 flex min-h-[28vh] sm:min-h-[32vh] flex-col items-center justify-center px-4 pt-14 pb-6 text-center">
          {scenario && (
            <p
              className="mb-3 text-lg font-bold tracking-widest drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
              style={{ color: scenario.colorCode, fontFamily: "var(--font-zen)" }}
            >
              {scenario.color}の巻 ─ {scenario.name}
            </p>
          )}
          <TitleLogo />
        </div>
      </section>

      {/* 黒帯セクション — 武将名・二つ名 */}
      <div className="w-full bg-sumi-950 py-6 animate-fade-in">
        <p className="text-center text-sm tracking-widest text-sumi-400" style={{ fontFamily: "var(--font-zen)" }}>
          これまでの問答から導かれし<br />
          汝の見立て ──
        </p>
        {/* カラーアクセントライン */}
        <div className="mx-auto mt-4 mb-3 w-16 h-px" style={{ backgroundColor: scenario?.colorCode }} />
        <h2
          className="text-center text-4xl font-black tracking-[0.15em] text-washi-100"
          style={{ fontFamily: "var(--font-brush)", textShadow: `0 0 24px ${scenario?.colorCode || "#c43c3c"}80` }}
        >
          {character.name}
        </h2>
        <p
          className="mt-2 text-center text-lg font-bold tracking-wider"
          style={{ fontFamily: "var(--font-zen)", color: scenario?.colorCode || "#c43c3c" }}
        >
          「{character.title}」
        </p>
        <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: scenario?.colorCode }} />
      </div>

      {/* コンテンツ */}
      <div className="relative mx-auto max-w-lg px-4 pb-8 pt-10 flex flex-col gap-8">
        {/* 墨絵城 装飾背景 */}
        <div className="pointer-events-none absolute -bottom-28 -right-16 z-0 w-72 opacity-[0.12]">
          <Image
            src="/nagoya-castle-ink.png"
            alt=""
            width={384}
            height={211}
            className="object-contain"
          />
        </div>

        <div className="relative z-10">
          <ResultDisplay result={result} character={character} />
        </div>
        <div className="relative z-10">
          <ShareButton character={character} resultId={id} poem={result.poem} />
        </div>
        <hr className="relative z-10 border-sumi-200" />
        <div className="relative z-10">
          <GalleryList card={result.card_id} />
        </div>
      </div>
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-sumi-400 pt-32">読み込み中...</p>}>
      <ResultContent />
    </Suspense>
  );
}
