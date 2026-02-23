"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { getCharacter } from "@/lib/characters";
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

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-rokusyo-700">
        同じ城を訪れた者たちの言葉
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
              <span className="text-sumi-400">「</span>
              {entry.free_text}
              <span className="text-sumi-400">」</span>
              <span className="ml-2 text-xs text-sumi-500">
                — {characterName}型
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
