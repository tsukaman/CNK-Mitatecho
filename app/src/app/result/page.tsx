"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api-client";
import { getCharacter } from "@/lib/characters";
import type { ResultData, Character } from "@/types";
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

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-sumi-400">神託を読み解いています...</p>
      </div>
    );
  }

  if (error || !result || !character || !id) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-beni-600">{error || "結果が見つかりません"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ResultDisplay result={result} character={character} />
      <ShareButton character={character} resultId={id} />
      <hr className="border-sumi-200" />
      <GalleryList card={result.card_id} />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-sumi-400">読み込み中...</p>}>
      <ResultContent />
    </Suspense>
  );
}
