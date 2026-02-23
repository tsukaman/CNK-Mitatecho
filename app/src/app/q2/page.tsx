"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Q2Form from "@/components/Q2Form";
import { SCENARIOS } from "@/lib/scenarios";
import { resolveToken } from "@/lib/tokens";

function Q2Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
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
      <div className="flex flex-col items-center gap-4 py-12">
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
    <div className="flex flex-col gap-6">
      <div className="text-center animate-fade-in">
        <p className="text-xs text-sumi-500">
          {scenario.color}の巻 —— {scenario.name}
        </p>
        <h1 className="mt-1 text-xl font-black text-sumi-950 font-zen">
          風雲戦国見立帖
        </h1>
        <div className="kinpaku-line mx-auto mt-2 w-24" />
      </div>
      <Q2Form card={card} q1={q1} />
    </div>
  );
}

export default function Q2Page() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-sumi-400">読み込み中...</p>}>
      <Q2Content />
    </Suspense>
  );
}
