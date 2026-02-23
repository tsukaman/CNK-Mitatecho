"use client";

import Image from "next/image";
import type { Character, ResultData } from "@/types";
import { getCharacter } from "@/lib/characters";
import { COMPATIBILITY, RIVALRY } from "@/lib/relationships";

interface ResultDisplayProps {
  result: ResultData;
  character: Character;
}

export default function ResultDisplay({ result, character }: ResultDisplayProps) {
  const compatibility = COMPATIBILITY[character.id];
  const rivalry = RIVALRY[character.id];

  let compatCharacter: Character | null = null;
  let rivalCharacter: Character | null = null;
  try {
    if (compatibility) compatCharacter = getCharacter(compatibility.characterId);
  } catch { /* skip */ }
  try {
    if (rivalry) rivalCharacter = getCharacter(rivalry.characterId);
  } catch { /* skip */ }

  return (
    <div className="relative flex flex-col gap-6">
      {/* 墨絵城 背景装飾 */}
      <div className="pointer-events-none absolute -right-4 top-0 z-0 w-36 opacity-[0.05]">
        <Image src="/nagoya-castle-ink.png" alt="" width={384} height={211} className="object-contain" />
      </div>

      <div className="relative z-10 text-center animate-fade-in">
        <p className="text-xs text-sumi-500">汝の戦国エンジニア格は――</p>
        <h2 className="mt-2 text-2xl font-black tracking-widest text-beni-800 font-zen">
          {character.name}
        </h2>
        <p className="mt-1 text-sm font-bold text-sumi-800">
          「{character.title}」
        </p>
        <div className="kinpaku-line mx-auto mt-3 w-24" />
      </div>

      <div className="rounded-lg border border-sumi-200 bg-white p-5 animate-fade-in-d1">
        <p className="whitespace-pre-line text-sm leading-relaxed text-sumi-800">
          {character.description}
        </p>
      </div>

      {result.free_text && (
        <div className="rounded-lg border border-sumi-200 bg-washi-200 p-4 animate-fade-in-d2">
          <p className="text-xs text-sumi-500">あなたの言葉</p>
          <p className="mt-1 text-sm font-bold text-sumi-900">「{result.free_text}」</p>
        </div>
      )}

      {result.poem && (
        <div className="poem-box relative overflow-hidden rounded-lg p-5 animate-fade-in-d3">
          {/* 筆ストローク装飾 */}
          <div className="pointer-events-none absolute -right-6 -top-6 z-0 w-24 rotate-[30deg] opacity-[0.06]">
            <Image src="/brush-stroke.webp" alt="" width={256} height={256} />
          </div>
          <p className="relative z-10 text-xs text-rokusyo-700">千人一首</p>
          <p className="relative z-10 mt-2 whitespace-pre-line text-sm leading-loose tracking-wider text-sumi-800">
            {result.poem}
          </p>
        </div>
      )}

      {(compatCharacter || rivalCharacter) && (
        <div className="flex flex-col gap-3 animate-fade-in-d4">
          {compatCharacter && compatibility && (
            <div
              className="rounded-lg border-l-[3px] bg-white p-4"
              style={{
                borderLeftColor: "var(--card-midori)",
                boxShadow: "inset 4px 0 8px -2px rgba(74, 140, 92, 0.15)",
              }}
            >
              <p className="text-xs font-bold" style={{ color: "var(--card-midori)" }}>相性の良い人物</p>
              <p className="mt-1 text-sm font-bold text-sumi-900">{compatCharacter.name}</p>
              <p className="text-xs" style={{ color: "var(--card-midori)" }}>「{compatCharacter.title}」</p>
              <p className="mt-1 text-xs text-sumi-500">{compatibility.reason}</p>
            </div>
          )}
          {rivalCharacter && rivalry && (
            <div
              className="rounded-lg border-l-[3px] bg-white p-4"
              style={{
                borderLeftColor: "var(--card-aka)",
                boxShadow: "inset 4px 0 8px -2px rgba(196, 60, 60, 0.15)",
              }}
            >
              <p className="text-xs font-bold text-beni-700">好敵手</p>
              <p className="mt-1 text-sm font-bold text-sumi-900">{rivalCharacter.name}</p>
              <p className="text-xs text-beni-700">「{rivalCharacter.title}」</p>
              <p className="mt-1 text-xs text-sumi-500">{rivalry.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
