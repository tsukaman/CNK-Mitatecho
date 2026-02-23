"use client";

import { useRouter } from "next/navigation";
import { SCENARIOS } from "@/lib/scenarios";
import { getToken } from "@/lib/tokens";

interface Props {
  cardId: number;
}

export default function SelectCardClient({ cardId }: Props) {
  const router = useRouter();
  const scenario = SCENARIOS[cardId];

  const handleSelect = (q1: number) => {
    const token = getToken(cardId, q1);
    if (token) {
      router.push(`/q2?t=${token}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <p className="text-xs text-sumi-500">
          {scenario.color}の巻 —— {scenario.name}
        </p>
        <h1 className="mt-1 text-xl font-black text-sumi-950 font-zen">
          風雲戦国見立帖
        </h1>
        <div className="kinpaku-line mx-auto mt-2 w-24" />
      </div>

      <div
        className="rounded-lg bg-white p-4 text-sm leading-relaxed whitespace-pre-line text-sumi-800 border-l-[3px]"
        style={{
          borderLeftColor: scenario.colorCode,
          boxShadow: `inset 4px 0 8px -2px ${scenario.colorCode}20`,
        }}
      >
        {scenario.q1Situation}
      </div>

      <div className="flex flex-col gap-3">
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
  );
}
