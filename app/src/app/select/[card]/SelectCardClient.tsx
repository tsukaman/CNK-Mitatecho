"use client";

import Image from "next/image";
import TitleLogo from "@/components/TitleLogo";
import { SCENARIOS } from "@/lib/scenarios";
import { getToken } from "@/lib/tokens";
import { usePageTransition } from "@/components/PageTransition";

interface Props {
  cardId: number;
}

export default function SelectCardClient({ cardId }: Props) {
  const { navigateWithTransition } = usePageTransition();
  const scenario = SCENARIOS[cardId];

  const handleSelect = (q1: number) => {
    const token = getToken(cardId, q1);
    if (token) {
      navigateWithTransition(`/q2?t=${token}`);
    }
  };

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
          <p
            className="mb-3 text-lg font-bold tracking-widest drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
            style={{ color: scenario.colorCode, fontFamily: "var(--font-zen)" }}
          >
            {scenario.color}の巻 ─ {scenario.name}
          </p>
          <TitleLogo />
        </div>
      </section>

      {/* コンテンツ */}
      <div className="relative mx-auto max-w-lg px-4 pb-8 pt-10 flex flex-col gap-6 animate-fade-in">
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
        <div
          className="relative z-10 rounded-lg bg-white p-4 text-sm leading-relaxed whitespace-pre-line text-sumi-800 border-l-[3px]"
          style={{
            borderLeftColor: scenario.colorCode,
            boxShadow: `inset 4px 0 8px -2px ${scenario.colorCode}20`,
          }}
        >
          {scenario.q1Situation}
        </div>

        <p className="relative z-10 text-center text-sm text-sumi-500" style={{ fontFamily: "var(--font-zen)" }}>
          ── 第一問 ──<br />
          <span className="text-xs">この場面であなたがとる行動を選んでください</span>
        </p>

        <div className="relative z-10 flex flex-col gap-3">
          {scenario.q1Choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i + 1)}
              className="wa-btn rounded-lg px-4 py-3 text-left text-sm"
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
