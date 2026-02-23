"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { getCharacter } from "@/lib/characters";
import { SCENARIOS } from "@/lib/scenarios";
import type { GalleryEntry } from "@/types";

interface GalleryListProps {
  card: number;
  excludeId?: string;
}

export default function GalleryList({ card, excludeId }: GalleryListProps) {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getGallery(card)
      .then((data) => setEntries(data.entries))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [card]);

  if (loading) {
    return <p className="text-center text-sm text-sumi-400">読み込み中...</p>;
  }

  if (entries.length === 0) {
    return null;
  }

  const scenario = SCENARIOS[card];
  const isContinuation = scenario?.sctTemplate.trimEnd().endsWith("、");
  // 続き型の場合、セリフ行の前半を取得（例: 「この世で一番大切なものは、）
  let dialoguePrefix = "";
  if (isContinuation && scenario) {
    const lines = scenario.sctTemplate.split("\n");
    dialoguePrefix = lines[lines.length - 1];
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-rokusyo-700">
        同じ道を辿りし者たちの言葉
      </h3>
      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => {
          let characterName = "";
          try {
            characterName = getCharacter(entry.character_id).name;
          } catch {
            characterName = "???";
          }
          return (
            <div
              key={i}
              className="rounded border border-sumi-100 bg-washi-200 px-3 py-2 text-sm"
            >
              {isContinuation ? (
                <>
                  <span className="text-sumi-400">{dialoguePrefix}</span>
                  <span className="font-bold">{entry.free_text}」</span>
                </>
              ) : (
                <>
                  <span className="text-sumi-400">「</span>
                  <span className="font-bold">{entry.free_text}</span>
                  <span className="text-sumi-400">」</span>
                </>
              )}
              <span className="ml-2 text-xs text-sumi-500">
                — {entry.nickname_public && entry.nickname ? `${entry.nickname}（${characterName}型）` : `${characterName}型`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
