import { describe, it, expect } from "vitest";
import { CHARACTER_MAPPING, getCharacterId } from "@/lib/mapping";

describe("CHARACTER_MAPPING", () => {
  const keys = Object.keys(CHARACTER_MAPPING);
  const values = Object.values(CHARACTER_MAPPING);

  it("should have exactly 96 entries (6 cards x 4 Q1 x 4 Q2)", () => {
    expect(keys).toHaveLength(96);
  });

  it("should have all 96 expected keys", () => {
    for (let card = 1; card <= 6; card++) {
      for (let q1 = 1; q1 <= 4; q1++) {
        for (let q2 = 1; q2 <= 4; q2++) {
          expect(CHARACTER_MAPPING).toHaveProperty(`${card}-${q1}-${q2}`);
        }
      }
    }
  });

  it("should only contain character IDs in range 1-32", () => {
    for (const [key, value] of Object.entries(CHARACTER_MAPPING)) {
      expect(value, `Key ${key} has invalid value ${value}`).toBeGreaterThanOrEqual(1);
      expect(value, `Key ${key} has invalid value ${value}`).toBeLessThanOrEqual(32);
    }
  });

  it("should include all 32 characters at least once", () => {
    const usedIds = new Set(values);
    for (let id = 1; id <= 32; id++) {
      expect(usedIds.has(id), `Character ID ${id} is never used in mapping`).toBe(true);
    }
  });
});

describe("getCharacterId", () => {
  it("should return correct character ID for valid combinations", () => {
    expect(getCharacterId(1, 1, 1)).toBe(1);
    expect(getCharacterId(6, 4, 4)).toBe(18);
  });

  it("should throw for invalid combinations", () => {
    expect(() => getCharacterId(0, 1, 1)).toThrow("Invalid combination");
    expect(() => getCharacterId(7, 1, 1)).toThrow("Invalid combination");
    expect(() => getCharacterId(1, 5, 1)).toThrow("Invalid combination");
  });
});
