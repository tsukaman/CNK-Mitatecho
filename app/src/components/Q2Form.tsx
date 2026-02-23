"use client";

import { useState } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { api } from "@/lib/api-client";

interface Q2FormProps {
  card: number;
  q1: number;
}

type Step = "q2" | "sct" | "submitting";

export default function Q2Form({ card, q1 }: Q2FormProps) {
  const [step, setStep] = useState<Step>("q2");
  const [q2, setQ2] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [xAccount, setXAccount] = useState("");
  const [ogpInclude, setOgpInclude] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[card];
  if (!scenario) return <p>カードが見つかりません</p>;

  const q2Question = scenario.q2[q1];
  if (!q2Question) return <p>質問が見つかりません</p>;

  const handleQ2Select = (choice: number) => {
    setQ2(choice);
    setStep("sct");
  };

  const handleSubmit = async () => {
    if (q2 === null || freeText.trim().length === 0) return;
    setStep("submitting");
    setError(null);

    try {
      const q1ChoiceText = scenario.q1Choices[q1 - 1] || "";
      const q2Choice = q2Question.choices[q2 - 1];
      const result = await api.submit({
        card,
        q1,
        q2,
        free_text: freeText.trim(),
        x_account: xAccount.trim() || undefined,
        ogp_include: ogpInclude,
        q1_choice_text: q1ChoiceText,
        q2_choice_text: q2Choice?.text || "",
        q2_choice_type: q2Choice?.type || "",
        sct_template: scenario.sctTemplate,
      });
      window.location.href = `/result?id=${result.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setStep("sct");
    }
  };

  if (step === "q2") {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div
          className="rounded-lg bg-white p-4 text-sm leading-relaxed whitespace-pre-line text-sumi-800 border-l-[3px]"
          style={{
            borderLeftColor: scenario.colorCode,
            boxShadow: `inset 4px 0 8px -2px ${scenario.colorCode}20`,
          }}
        >
          {q2Question.situation}
        </div>
        <div className="flex flex-col gap-3">
          {q2Question.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleQ2Select(i + 1)}
              className="wa-btn rounded-lg px-4 py-3 text-left text-sm"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "sct" || step === "submitting") {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div
          className="rounded-lg bg-white p-4 text-sm leading-relaxed whitespace-pre-line text-sumi-800 border-l-[3px]"
          style={{
            borderLeftColor: scenario.colorCode,
            boxShadow: `inset 4px 0 8px -2px ${scenario.colorCode}20`,
          }}
        >
          {scenario.sctTemplate}
        </div>
        <div className="flex flex-col gap-2">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="あなたの言葉を入力してください"
            className="wa-input w-full rounded-lg px-4 py-3 text-sm"
            disabled={step === "submitting"}
          />
          <p className="text-right text-xs text-sumi-400">{freeText.length}/200</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-sumi-200 bg-washi-200 p-4">
          <p className="text-xs font-bold text-sumi-500">追加項目（任意）</p>
          <div className="flex flex-col gap-1">
            <label htmlFor="x-account" className="text-xs text-sumi-500">
              Xアカウント
            </label>
            <input
              id="x-account"
              type="text"
              value={xAccount}
              onChange={(e) => setXAccount(e.target.value)}
              placeholder="@username"
              maxLength={50}
              className="wa-input w-full rounded-lg px-3 py-2 text-sm"
              disabled={step === "submitting"}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-sumi-500">
            <input
              type="checkbox"
              checked={ogpInclude}
              onChange={(e) => setOgpInclude(e.target.checked)}
              disabled={step === "submitting"}
              className="rounded"
            />
            シェア画像にアカウント情報を含める
          </label>
        </div>

        {error && (
          <p className="text-sm text-beni-600">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={step === "submitting" || freeText.trim().length === 0}
          className="wa-cta rounded-lg px-6 py-3 text-sm font-bold"
        >
          {step === "submitting" ? (
            <span className="animate-gold-pulse">占い中...</span>
          ) : (
            "神託を受ける"
          )}
        </button>
      </div>
    );
  }

  return null;
}
