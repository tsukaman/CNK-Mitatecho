import { describe, it, expect } from "vitest";
import { SCENARIOS } from "@/lib/scenarios";

describe("SCENARIOS", () => {
  const cardIds = [1, 2, 3, 4, 5, 6];

  it("should have exactly 6 scenarios", () => {
    expect(Object.keys(SCENARIOS)).toHaveLength(6);
  });

  for (const cardId of cardIds) {
    describe(`Card ${cardId}`, () => {
      it("should exist", () => {
        expect(SCENARIOS[cardId]).toBeDefined();
      });

      it("should have required top-level fields", () => {
        const s = SCENARIOS[cardId];
        expect(s.name).toBeTruthy();
        expect(s.color).toBeTruthy();
        expect(s.colorCode).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(s.q1Situation).toBeTruthy();
        expect(s.sctTemplate).toBeTruthy();
        expect(s.sctInterpretation).toBeTruthy();
      });

      it("should have exactly 4 Q1 choices", () => {
        expect(SCENARIOS[cardId].q1Choices).toHaveLength(4);
        for (const choice of SCENARIOS[cardId].q1Choices) {
          expect(choice.trim().length).toBeGreaterThan(0);
        }
      });

      it("should have Q2 branches for all 4 Q1 choices", () => {
        const q2 = SCENARIOS[cardId].q2;
        expect(Object.keys(q2)).toHaveLength(4);
        for (let q1 = 1; q1 <= 4; q1++) {
          expect(q2[q1], `Missing Q2 for Q1=${q1}`).toBeDefined();
        }
      });

      it("should have exactly 4 choices for each Q2 branch", () => {
        const q2 = SCENARIOS[cardId].q2;
        for (let q1 = 1; q1 <= 4; q1++) {
          const branch = q2[q1];
          expect(branch.situation, `Q2[${q1}] missing situation`).toBeTruthy();
          expect(branch.choices, `Q2[${q1}] should have 4 choices`).toHaveLength(4);
          for (const choice of branch.choices) {
            expect(choice.text.trim().length).toBeGreaterThan(0);
            expect(choice.type.trim().length).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});
