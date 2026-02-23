"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Q2Form from "@/components/Q2Form";
import TitleLogo from "@/components/TitleLogo";
import { SCENARIOS } from "@/lib/scenarios";
import { resolveToken } from "@/lib/tokens";

function Q2Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-20 flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-beni-600">
          無効なリンクです。トップページからやり直してください。
        </p>
        <a href="/" className="text-sm underline text-rokusyo-500 hover:text-rokusyo-700">トップページへ</a>
      </div>
    );
  }

  const resolved = resolveToken(token);
  if (!resolved) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-20 flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-beni-600">
          無効なリンクです。トップページからやり直してください。
        </p>
        <a href="/" className="text-sm underline text-rokusyo-500 hover:text-rokusyo-700">トップページへ</a>
      </div>
    );
  }

  const { card, q1 } = resolved;
  const scenario = SCENARIOS[card];

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
      <div className="relative mx-auto max-w-lg px-4 pb-8 pt-10 flex flex-col gap-6">
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

        <Q2Form card={card} q1={q1} />
      </div>
    </>
  );
}

export default function Q2Page() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-sumi-400">読み込み中...</p>}>
      <Q2Content />
    </Suspense>
  );
}
