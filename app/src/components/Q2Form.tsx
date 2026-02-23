"use client";

import { useState } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { api } from "@/lib/api-client";
import { usePageTransition } from "@/components/PageTransition";

interface Q2FormProps {
  card: number;
  q1: number;
}

type Step = "q2" | "sct" | "submitting";

export default function Q2Form({ card, q1 }: Q2FormProps) {
  const { navigateWithTransition } = usePageTransition();
  const [step, setStep] = useState<Step>("q2");
  const [q2, setQ2] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknamePublic, setNicknamePublic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[card];
  if (!scenario) return <p>カードが見つかりません</p>;

  const q2Question = scenario.q2[q1];
  if (!q2Question) return <p>質問が見つかりません</p>;

  const [internalOverlay, setInternalOverlay] = useState(false);

  const handleQ2Select = (choice: number) => {
    setQ2(choice);
    setInternalOverlay(true);
    setTimeout(() => {
      setStep("sct");
      setInternalOverlay(false);
    }, 900);
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
        nickname: nickname.trim() || undefined,
        nickname_public: nicknamePublic,
        q1_choice_text: q1ChoiceText,
        q2_choice_text: q2Choice?.text || "",
        q2_choice_type: q2Choice?.type || "",
        sct_template: scenario.sctTemplate,
      });
      navigateWithTransition(`/result?id=${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setStep("sct");
    }
  };

  if (step === "q2") {
    return (
      <>
        {internalOverlay && <div className="page-transition-overlay" />}
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
          <p className="text-center text-sm text-sumi-500" style={{ fontFamily: "var(--font-zen)" }}>
            ── 第二問 ──<br />
            <span className="text-xs">あなたの選択が物語を動かします。その先の展開を選んでください</span>
          </p>
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
      </>
    );
  }

  if (step === "sct" || step === "submitting") {
    // テンプレートが台詞途中（「、」で終わる）か、呟き/回答を求めるかを判定
    const isContinuation = scenario.sctTemplate.trimEnd().endsWith("、");
    const sctGuide = isContinuation
      ? "上の台詞に続く一言を、自由に入力してください。"
      : "あなたならどう呟きますか？\n思い浮かんだ言葉を自由に入力してください。";

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
        <div className="text-center" style={{ fontFamily: "var(--font-zen)" }}>
          <p className="text-sm text-sumi-500">
            ── 最終問 ──
          </p>
          <p className="mt-1 text-xs text-sumi-500">
            ふと浮かんだ言葉にこそ、心の深層が映し出されます
          </p>
          <p className="mt-2 text-sm text-sumi-600 whitespace-pre-line">
            {sctGuide}
          </p>
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
          <p className="text-xs font-bold text-sumi-500">お名前（任意）</p>
          <div className="flex flex-col gap-1">
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ハンドルネームまたはニックネーム"
              maxLength={30}
              className="wa-input w-full rounded-lg px-3 py-2 text-sm"
              disabled={step === "submitting"}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-sumi-500">
            <input
              type="checkbox"
              checked={nicknamePublic}
              onChange={(e) => setNicknamePublic(e.target.checked)}
              disabled={step === "submitting" || nickname.trim().length === 0}
              className="rounded"
            />
            ギャラリーにお名前を公開してもよい
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
            <span className="animate-gold-pulse">紐解いています...</span>
          ) : (
            "運命を紐解く"
          )}
        </button>
      </div>
    );
  }

  return null;
}
