import { describe, it, expect } from "vitest";
import { SCENARIOS_SERVER as SCENARIOS_SERVER_RAW, getPromptContext } from "../../functions/utils/scenarios-server.js";

// SCENARIOS_SERVER は {1: ..., 2: ...} のリテラルキーで定義されているため
// 数値インデックスでのアクセスを TS に許可させるよう Record<number, ...> にキャスト。
const SCENARIOS_SERVER = SCENARIOS_SERVER_RAW as Record<number, {
  q1Choices: string[];
  q2: Record<number, { choices: { text: string; type: string }[] }>;
  sctTemplate: string;
}>;

describe("SCENARIOS_SERVER data integrity", () => {
  it("should have all 6 cards", () => {
    for (let c = 1; c <= 6; c++) {
      expect(SCENARIOS_SERVER[c], `card ${c} missing`).toBeDefined();
    }
  });

  it("each card should have 4 q1Choices", () => {
    for (let c = 1; c <= 6; c++) {
      expect(SCENARIOS_SERVER[c].q1Choices).toHaveLength(4);
      for (const choice of SCENARIOS_SERVER[c].q1Choices) {
        expect(typeof choice).toBe("string");
        expect(choice.length).toBeGreaterThan(0);
      }
    }
  });

  it("each card should have 4 q2 branches each with 4 choices {text, type}", () => {
    for (let c = 1; c <= 6; c++) {
      for (let q1 = 1; q1 <= 4; q1++) {
        const branch = SCENARIOS_SERVER[c].q2[q1];
        expect(branch, `card ${c} q1 ${q1} missing`).toBeDefined();
        expect(branch.choices).toHaveLength(4);
        for (const choice of branch.choices) {
          expect(typeof choice.text).toBe("string");
          expect(choice.text.length).toBeGreaterThan(0);
          expect(typeof choice.type).toBe("string");
          expect(choice.type.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("each card should have a non-empty sctTemplate", () => {
    for (let c = 1; c <= 6; c++) {
      expect(typeof SCENARIOS_SERVER[c].sctTemplate).toBe("string");
      expect(SCENARIOS_SERVER[c].sctTemplate.length).toBeGreaterThan(0);
    }
  });
});

describe("getPromptContext", () => {
  it("should return all four context fields for a valid combination", () => {
    const ctx = getPromptContext(1, 1, 1);
    expect(ctx.q1_choice_text).toBe("焚き火の前で兵に語りかける");
    expect(ctx.q2_choice_text).toBe("己の名を、この地に刻むためだ");
    expect(ctx.q2_choice_type).toBe("野心・自己実現");
    expect(ctx.sct_template).toContain("陣太鼓");
  });

  it("should return fields for all 96 combinations", () => {
    for (let c = 1; c <= 6; c++) {
      for (let q1 = 1; q1 <= 4; q1++) {
        for (let q2 = 1; q2 <= 4; q2++) {
          const ctx = getPromptContext(c, q1, q2);
          expect(ctx.q1_choice_text, `card=${c} q1=${q1} q2=${q2}`).not.toBe("");
          expect(ctx.q2_choice_text, `card=${c} q1=${q1} q2=${q2}`).not.toBe("");
          expect(ctx.q2_choice_type, `card=${c} q1=${q1} q2=${q2}`).not.toBe("");
          expect(ctx.sct_template, `card=${c} q1=${q1} q2=${q2}`).not.toBe("");
        }
      }
    }
  });

  it("should safely fail to empty strings for out-of-range inputs", () => {
    const empty = { q1_choice_text: "", q2_choice_text: "", q2_choice_type: "", sct_template: "" };
    expect(getPromptContext(0, 1, 1)).toEqual(empty);
    expect(getPromptContext(7, 1, 1)).toEqual(empty);
  });

  it("should partially fail gracefully for invalid q1/q2 within valid card", () => {
    const ctx = getPromptContext(1, 0, 1);
    expect(ctx.q1_choice_text).toBe("");
    expect(ctx.q2_choice_text).toBe("");
    expect(ctx.sct_template).toContain("陣太鼓"); // card-level sctTemplate still available

    const ctx2 = getPromptContext(1, 1, 5);
    expect(ctx2.q1_choice_text).toBe("焚き火の前で兵に語りかける"); // q1 is valid
    expect(ctx2.q2_choice_text).toBe(""); // q2 out of range
  });
});
