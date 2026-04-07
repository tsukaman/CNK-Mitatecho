"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TitleLogo from "@/components/TitleLogo";
import { api } from "@/lib/api-client";
import { getCharacter } from "@/lib/characters";
import { splitPoem } from "@/lib/poem-utils";
import { SCENARIOS } from "@/lib/scenarios";
import { getCardSlug } from "@/lib/tokens";
import type { PoemEntry } from "@/types";

const CARDS = [
  { id: 1, name: "壱", color: "紅", colorCode: "#c43c3c", kanji: "紅", stage: "合戦前夜の陣中" },
  { id: 2, name: "弐", color: "藍", colorCode: "#4a7fb5", kanji: "藍", stage: "月夜の城下町" },
  { id: 3, name: "参", color: "翠", colorCode: "#4a8c5c", kanji: "翠", stage: "山あいの隠れ里" },
  { id: 4, name: "肆", color: "金", colorCode: "#b8963e", kanji: "金", stage: "天守閣の大広間" },
  { id: 5, name: "伍", color: "紫", colorCode: "#8b5cad", kanji: "紫", stage: "霧に包まれた古寺" },
  { id: 6, name: "陸", color: "白", colorCode: "#8a9aad", kanji: "白", stage: "雪の茶室" },
];

const STAGGER = [
  "animate-fade-in-d1",
  "animate-fade-in-d2",
  "animate-fade-in-d3",
  "animate-fade-in-d4",
  "animate-fade-in-d5",
  "animate-fade-in-d6",
];

/** 短歌カード（マーキー内で使い回す） */
function PoemCard({ entry }: { entry: PoemEntry }) {
  const { kamiNoKu, shimoNoKu } = splitPoem(entry.poem);
  const scenario = SCENARIOS[entry.card_id];
  let charName = "";
  try { charName = getCharacter(entry.character_id).name; } catch { /* skip */ }
  const displayName = entry.nickname_public && entry.nickname ? entry.nickname : "詠まれ人知らず";

  return (
    <div className="poem-box relative overflow-hidden rounded-lg p-5 w-72 h-40 shrink-0 flex flex-col justify-center">
      <div className="text-center" style={{ fontFamily: "var(--font-poem)" }}>
        <p className="text-sm leading-loose tracking-wider text-sumi-800">{kamiNoKu}</p>
        <p className="text-sm leading-loose tracking-wider text-sumi-800">{shimoNoKu}</p>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-sumi-400">
        {scenario && <span style={{ color: scenario.colorCode }}>●</span>}
        <span style={{ fontFamily: "var(--font-brush)" }}>{charName}</span>
        <span>── {displayName}</span>
      </div>
    </div>
  );
}

/** 千人一首ギャラリー（4段マーキースクロール） */
function PoemGallery() {
  const [poems, setPoems] = useState<PoemEntry[]>([]);

  useEffect(() => {
    api.getPoems(30).then((data) => setPoems(data.entries)).catch((err) => console.error('Failed to load poems:', err));
  }, []);

  if (poems.length === 0) return null;

  // 短歌を4段に分配
  const rows: PoemEntry[][] = [[], [], [], []];
  poems.forEach((p, i) => rows[i % 4].push(p));

  const durations = ["50s", "65s", "55s", "70s"];
  const delays = ["-25s", "-32s", "-14s", "-45s"];
  const directions = ["marquee-track", "marquee-track-reverse", "marquee-track", "marquee-track-reverse"];

  return (
    <div className="py-10">
      <div className="mx-auto max-w-lg px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-sumi-200" />
          <p className="text-base font-bold text-sumi-600 tracking-widest shrink-0" style={{ fontFamily: "var(--font-zen)" }}>
            千人一首 ── これまでに詠まれた歌
          </p>
          <div className="h-px flex-1 bg-sumi-200" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row, ri) => (
          <div key={ri} className="overflow-hidden">
            <div
              className={`${directions[ri]} gap-4`}
              style={{ "--marquee-duration": durations[ri], animationDelay: delays[ri] } as React.CSSProperties}
            >
              {row.map((entry, i) => <PoemCard key={`${ri}a-${i}`} entry={entry} />)}
              {row.map((entry, i) => <PoemCard key={`${ri}b-${i}`} entry={entry} />)}
              {row.map((entry, i) => <PoemCard key={`${ri}c-${i}`} entry={entry} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ランディングページ（デフォルト表示） */
function PrairieCardLanding() {
  return (
    <>
      {/* ヒーロー */}
      <section className="relative w-full min-h-[50vh] sm:min-h-[60vh] overflow-hidden">
        <Image
          src="/hero-bg.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="relative z-10 flex min-h-[50vh] sm:min-h-[60vh] flex-col items-center justify-center px-4 pt-24 pb-8 text-center">
          <Image
            src="/logo-compact.png"
            alt="クラウドネイティブ会議"
            width={120}
            height={120}
            className="mb-6 drop-shadow-lg"
            priority
          />
          <TitleLogo />
          <div className="kinpaku-line mx-auto mt-4 w-32" />
          <p className="mt-6 text-sm font-bold text-sumi-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            汝の心に宿る戦国の魂、見定めん
          </p>
        </div>
      </section>

      {/* コンセプト説明 */}
      <div className="w-full bg-sumi-950 py-8">
        <div className="mx-auto max-w-lg px-4">
          <p
            className="text-center text-base font-bold tracking-[0.2em] text-washi-100 leading-relaxed"
            style={{ fontFamily: "var(--font-zen)" }}
          >
            戦国武将 × エンジニアタイプ診断
          </p>
          <p className="mt-4 text-center text-sm text-sumi-400 leading-relaxed">
            心理学の投影法をベースにした問答を通じて、<br />
            あなたの心に宿る戦国の人物像を導き出します。<br />
            さらにAIがあなただけの短歌を一首、詠みます。
          </p>
        </div>
      </div>

      {/* 体験の流れ */}
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-sumi-200" />
          <p className="text-base font-bold text-sumi-600 tracking-widest shrink-0" style={{ fontFamily: "var(--font-zen)" }}>
            体験の流れ
          </p>
          <div className="h-px flex-1 bg-sumi-200" />
        </div>

        <div className="flex flex-col gap-3">
          {[
            { step: "壱", text: "プレーリーカードをかざして巻を選ぶ", color: "#548a8a" },
            { step: "弐", text: "戦国の世界観に沿った三つの問いに答える", color: "#4a7fb5" },
            { step: "参", text: "あなたに見立てられた戦国武将が明かされる", color: "#8b5cad" },
            { step: "肆", text: "AIがあなただけの短歌を詠む", color: "#b8963e" },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-center gap-4 rounded-lg bg-white/60 backdrop-blur-sm p-4 border border-sumi-100">
              <span className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm shrink-0" style={{ fontFamily: "var(--font-brush)", backgroundColor: color }}>{step}</span>
              <p className="text-sm text-sumi-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 千人一首ギャラリー */}
      <PoemGallery />

      {/* イベント情報 */}
      <div className="mx-auto max-w-lg px-4 pb-6">
        <div className="rounded-lg border-2 border-beni-200 bg-white/90 backdrop-blur-sm p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-beni-800 leading-relaxed" style={{ fontFamily: "var(--font-zen)" }}>
            風雲戦国見立帖は、実行委員ブースにある<br className="hidden sm:inline" />
            プレーリーカードを読み取ることで体験することができます。
          </p>
        </div>
      </div>

      {/* 協賛 */}
      <div className="mx-auto max-w-lg px-4 pt-20 pb-10">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-sumi-400 tracking-widest">協賛</p>
          <a href="https://prairie.cards/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70">
            <Image src="/prairie-card-logo.png" alt="Prairie Card（プレーリーカード）" width={160} height={80} className="object-contain" />
          </a>
        </div>
      </div>
    </>
  );
}

/** カード選択ページ（?mode=remote 時に表示） */
function CardSelect() {
  return (
    <>
      <section className="relative w-full min-h-[28vh] sm:min-h-[32vh] overflow-hidden">
        <Image
          src="/hero-bg.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="relative z-10 flex min-h-[28vh] sm:min-h-[32vh] flex-col items-center justify-center px-4 pt-24 pb-8 text-center">
          <Image
            src="/logo-compact.png"
            alt="クラウドネイティブ会議"
            width={120}
            height={120}
            className="mb-6 drop-shadow-lg"
            priority
          />
          <TitleLogo />
          <div className="kinpaku-line mx-auto mt-4 w-32" />
          <p className="mt-4 text-sm font-bold text-sumi-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            汝の心に宿る戦国の魂、見定めん
          </p>
        </div>
      </section>

      <div className="w-full bg-sumi-950 py-5">
        <p className="text-center text-base font-bold tracking-[0.25em] text-washi-100" style={{ fontFamily: "var(--font-zen)" }}>
          直感で一枚、選ばれよ
        </p>
      </div>

      <div className="relative mx-auto max-w-lg px-4 pb-8 flex flex-col items-center gap-8 pt-10">
        <div className="pointer-events-none absolute bottom-0 -right-16 z-0 w-72 opacity-[0.12]">
          <Image
            src="/nagoya-castle-ink.png"
            alt=""
            width={384}
            height={211}
            className="object-contain"
          />
        </div>

        <div className="relative z-10 grid w-full grid-cols-2 gap-3">
          {CARDS.map((card, i) => (
            <Link
              key={card.id}
              href={`/select/${getCardSlug(card.id)}`}
              className={`cnk-card group relative flex flex-col items-center gap-2 p-4 ${STAGGER[i]}`}
              style={{ borderTopColor: card.colorCode, borderTopWidth: "3px" }}
            >
              <span
                className="text-4xl font-black transition-all duration-300 group-hover:scale-110"
                style={{ color: card.colorCode, fontFamily: "var(--font-brush)" }}
              >
                {card.kanji}
              </span>
              <span className="text-sm font-bold text-sumi-900" style={{ fontFamily: "var(--font-brush)" }}>
                {card.name}の巻
              </span>
              <span className="text-xs text-sumi-600">
                {card.stage}
              </span>
            </Link>
          ))}
        </div>

        <div className="relative z-10 mt-4 animate-fade-in rounded-lg border border-sumi-200 bg-washi-200/80 backdrop-blur-sm p-4 text-center">
          <p className="text-xs text-sumi-400">
            本診断はイベントを楽しむための余興です。<br />結果はあくまでお遊びとしてお楽しみください。
          </p>
        </div>
      </div>
    </>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const isRemote = searchParams.get("mode") === "remote";

  return isRemote ? <CardSelect /> : <PrairieCardLanding />;
}

export default function Home() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-sumi-400 pt-32">読み込み中...</p>}>
      <HomeContent />
    </Suspense>
  );
}
