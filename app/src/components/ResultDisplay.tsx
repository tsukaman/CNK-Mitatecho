"use client";

import Image from "next/image";
import type { Character, ResultData } from "@/types";
import { getCharacter } from "@/lib/characters";
import { splitPoem } from "@/lib/poem-utils";
import { COMPATIBILITY, RIVALRY } from "@/lib/relationships";
import { SCENARIOS } from "@/lib/scenarios";

interface ResultDisplayProps {
  result: ResultData;
  character: Character;
}

/**
 * descriptionの先頭「セリフ」を抽出する
 * 例: "「このアーキテクチャ、全部壊す」\n\n本文..." → ["「...」", "本文..."]
 */
function splitQuoteAndBody(description: string): [string | null, string] {
  const match = description.match(/^(「[^」]+」)\s*\n\n([\s\S]*)$/);
  if (match) {
    return [match[1], match[2]];
  }
  return [null, description];
}

export default function ResultDisplay({ result, character }: ResultDisplayProps) {
  const compatibility = COMPATIBILITY[character.id];
  const rivalry = RIVALRY[character.id];
  const scenario = SCENARIOS[result.card_id];

  let compatCharacter: Character | null = null;
  let rivalCharacter: Character | null = null;
  try {
    if (compatibility) compatCharacter = getCharacter(compatibility.characterId);
  } catch { /* skip */ }
  try {
    if (rivalry) rivalCharacter = getCharacter(rivalry.characterId);
  } catch { /* skip */ }

  const [quote, body] = splitQuoteAndBody(character.description);

  return (
    <div className="flex flex-col gap-8">
      {/* セリフ（太字で目立たせる） */}
      {quote && (
        <div className="animate-fade-in-d1 text-center">
          <p className="text-lg font-black text-sumi-900 leading-relaxed" style={{ fontFamily: "var(--font-zen)" }}>
            {quote}
          </p>
        </div>
      )}

      {/* こじつけストーリー + 史実解説 */}
      <div
        className="rounded-lg border-l-[3px] bg-white p-5 animate-fade-in-d1"
        style={{
          borderLeftColor: scenario?.colorCode || "#c43c3c",
          boxShadow: `inset 4px 0 8px -2px ${scenario?.colorCode || "#c43c3c"}20`,
        }}
      >
        <p className="whitespace-pre-line text-[15px] leading-[1.9] text-sumi-900">
          {body}
        </p>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-sumi-200" />
          <p className="text-xs font-bold text-sumi-400 tracking-widest shrink-0">史実</p>
          <div className="h-px flex-1 bg-sumi-200" />
        </div>

        <p className="text-sm leading-[1.9] text-sumi-500">
          {character.history}
        </p>
      </div>

      {/* 自由記述 + 解釈 */}
      {result.free_text && (() => {
        // テンプレートがセリフ途中（「…、）で終わる場合、自由記述はその続き→閉じ鉤括弧だけ
        const isContinuation = scenario?.sctTemplate.trimEnd().endsWith("、");

        // 続き型: テンプレートの地の文とセリフ行を分離し、セリフ行+自由記述を一体表示
        let narrativePart = "";
        let dialoguePart = "";
        if (isContinuation && scenario) {
          const lines = scenario.sctTemplate.split("\n");
          // 最後の非空行がセリフ行（「で始まる）
          const lastLine = lines[lines.length - 1];
          narrativePart = lines.slice(0, -1).join("\n");
          dialoguePart = lastLine;
        }

        return (
        <div className="rounded-lg border-2 bg-white p-5 animate-fade-in-d2" style={{ borderColor: "#CAA85B" }}>
          {scenario && !isContinuation && (
            <p className="text-sm leading-relaxed text-sumi-500 whitespace-pre-line">
              {scenario.sctTemplate}
            </p>
          )}
          {scenario && isContinuation && (
            <>
              {narrativePart && (
                <p className="text-sm leading-relaxed text-sumi-500 whitespace-pre-line">
                  {narrativePart}
                </p>
              )}
              <p className="mt-3 text-lg leading-relaxed text-sumi-900 text-center">
                <span className="text-sumi-500 text-sm">{dialoguePart}</span>
                <span className="font-bold">{result.free_text}」</span>
              </p>
            </>
          )}
          {!isContinuation && (
            <p className="mt-3 text-lg font-bold text-sumi-900 text-center">
              「{result.free_text}」
            </p>
          )}
          {scenario?.sctInterpretation && (
            <p className="mt-4 border-t pt-4 text-sm leading-relaxed text-sumi-600" style={{ borderColor: "#CAA85B40" }}>
              {scenario.sctInterpretation}
            </p>
          )}
        </div>
        );
      })()}

      {/* 短歌 */}
      {result.poem ? (() => {
        // 5行の短歌を上の句(5-7-5)と下の句(7-7)に分割
        const { kamiNoKu, shimoNoKu } = splitPoem(result.poem);
        return (
          <div className="poem-box relative overflow-hidden rounded-lg p-6 animate-fade-in-d3">
            {/* 筆ストローク装飾 */}
            <div className="pointer-events-none absolute -right-6 -top-6 z-0 w-24 rotate-[30deg] opacity-[0.06]">
              <Image src="/brush-stroke.webp" alt="" width={256} height={256} />
            </div>
            <p className="relative z-10 text-xs font-bold text-rokusyo-700">千人一首 ── AIがあなたに詠んだ一首</p>
            <div className="relative z-10 mt-4 text-center" style={{ fontFamily: "var(--font-poem)" }}>
              <p className="text-lg leading-loose tracking-wider text-sumi-800">
                {kamiNoKu}
              </p>
              <p className="mt-1 text-lg leading-loose tracking-wider text-sumi-800">
                {shimoNoKu}
              </p>
            </div>
          </div>
        );
      })() : result.poem_status === 'failed' ? (
        <div className="poem-box relative overflow-hidden rounded-lg p-6 animate-fade-in-d3">
          <p className="text-xs font-bold text-rokusyo-700">千人一首 ── AIがあなたに詠んだ一首</p>
          <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-beni-600" style={{ fontFamily: "var(--font-zen)" }}>
              一首の生成に失敗しました
            </p>
            <p className="text-xs text-sumi-400">
              しばし後ほど、同じ URL を開き直してください
            </p>
          </div>
        </div>
      ) : (
        <div className="poem-box relative overflow-hidden rounded-lg p-6 animate-fade-in-d3">
          <p className="text-xs font-bold text-rokusyo-700">千人一首 ── AIがあなたに詠んだ一首</p>
          <div className="mt-4 flex flex-col items-center gap-3 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sumi-300 border-t-rokusyo-600" />
            <p className="text-sm text-sumi-400" style={{ fontFamily: "var(--font-zen)" }}>
              一首、詠んでおります...
            </p>
          </div>
        </div>
      )}

      {/* 相性・好敵手 */}
      {(compatCharacter || rivalCharacter) && (
        <div className="flex flex-col gap-4 animate-fade-in-d4">
          {compatCharacter && compatibility && (
            <div
              className="rounded-lg border-l-[3px] bg-white p-5 text-center"
              style={{
                borderLeftColor: "var(--card-midori)",
                boxShadow: "inset 4px 0 8px -2px rgba(74, 140, 92, 0.15)",
              }}
            >
              <p className="text-xs font-bold tracking-wider" style={{ color: "var(--card-midori)" }}>相性の良い人物</p>
              <p className="mt-1 text-lg font-bold text-sumi-900" style={{ fontFamily: "var(--font-brush)" }}>{compatCharacter.name}</p>
              <p className="text-sm" style={{ color: "var(--card-midori)" }}>「{compatCharacter.title}」</p>
              <p className="mt-2 text-sm text-sumi-600">{compatibility.reason}</p>
            </div>
          )}
          {rivalCharacter && rivalry && (
            <div
              className="rounded-lg border-l-[3px] bg-white p-5 text-center"
              style={{
                borderLeftColor: "var(--card-aka)",
                boxShadow: "inset 4px 0 8px -2px rgba(196, 60, 60, 0.15)",
              }}
            >
              <p className="text-xs font-bold tracking-wider text-beni-700">好敵手</p>
              <p className="mt-1 text-lg font-bold text-sumi-900" style={{ fontFamily: "var(--font-brush)" }}>{rivalCharacter.name}</p>
              <p className="text-sm text-beni-700">「{rivalCharacter.title}」</p>
              <p className="mt-2 text-sm text-sumi-600">{rivalry.reason}</p>
            </div>
          )}
        </div>
      )}

      {/* 診断の仕組み解説 */}
      <div className="rounded-lg bg-sumi-50 p-4 animate-fade-in-d4">
        <p className="text-xs font-bold text-sumi-600 tracking-wider">── 風雲戦国見立帖の仕組み ──</p>
        <p className="mt-2 text-xs leading-relaxed text-sumi-500">
          この診断は、心理学の投影法（P-Fスタディ・TAT・SCT）のエッセンスを戦国の世界観に落とし込んだものです。第一問であなたの<strong className="text-sumi-700">行動パターン</strong>を、第二問でその奥にある<strong className="text-sumi-700">価値観や動機</strong>を読み取り、二つの組み合わせから最も近い戦国の人物像を導きました。自由記述のひと言が、あなただけの彩りを添えます。
        </p>
        <p className="mt-2 text-xs leading-relaxed text-sumi-400">
          ……とはいえ、小難しいことは脇に置いて。楽しんでいただけたなら、それが何よりの戦果です。
        </p>
      </div>
    </div>
  );
}
