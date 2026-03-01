import { describe, it, expect } from "vitest";
import { COMPATIBILITY, RIVALRY } from "@/lib/relationships";

const ALL_CHARACTER_IDS = Array.from({ length: 32 }, (_, i) => i + 1);

function validateRelationshipMap(map: Record<number, { characterId: number; reason: string }>, label: string) {
  it("should have entries for all 32 characters", () => {
    for (const id of ALL_CHARACTER_IDS) {
      expect(map[id], `Missing ${label} for character ${id}`).toBeDefined();
    }
  });

  it("should reference valid character IDs", () => {
    for (const [id, rel] of Object.entries(map)) {
      expect(rel.characterId, `${label} for ${id} references invalid ID ${rel.characterId}`)
        .toBeGreaterThanOrEqual(1);
      expect(rel.characterId).toBeLessThanOrEqual(32);
    }
  });

  it("should not have self-references", () => {
    for (const [id, rel] of Object.entries(map)) {
      expect(rel.characterId, `Character ${id} has self-reference in ${label}`)
        .not.toBe(Number(id));
    }
  });

  it("should have a reason string for each entry", () => {
    for (const [id, rel] of Object.entries(map)) {
      expect(rel.reason, `${label} for ${id} missing reason`).toBeTruthy();
    }
  });
}

describe("COMPATIBILITY", () => {
  validateRelationshipMap(COMPATIBILITY, "compatibility");
});

describe("RIVALRY", () => {
  validateRelationshipMap(RIVALRY, "rivalry");
});

describe("COMPATIBILITY vs RIVALRY", () => {
  it("compatibility and rivalry targets should be different for each character", () => {
    for (const id of ALL_CHARACTER_IDS) {
      const compat = COMPATIBILITY[id];
      const rival = RIVALRY[id];
      if (compat && rival) {
        expect(compat.characterId, `Character ${id}: compatibility and rivalry point to same target`)
          .not.toBe(rival.characterId);
      }
    }
  });
});
