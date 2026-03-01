import { describe, it, expect } from "vitest";
import { CHARACTERS, getCharacter } from "@/lib/characters";

describe("CHARACTERS", () => {
  it("should have exactly 32 characters", () => {
    expect(CHARACTERS).toHaveLength(32);
  });

  it("should have unique IDs from 1 to 32", () => {
    const ids = CHARACTERS.map((c) => c.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
  });

  it("should have all required fields for each character", () => {
    for (const char of CHARACTERS) {
      expect(char.id, `Character missing id`).toBeTypeOf("number");
      expect(char.name, `Character ${char.id} missing name`).toBeTruthy();
      expect(char.title, `Character ${char.id} missing title`).toBeTruthy();
      expect(char.category, `Character ${char.id} missing category`).toBeTruthy();
      expect(char.description, `Character ${char.id} missing description`).toBeTruthy();
      expect(char.history, `Character ${char.id} missing history`).toBeTruthy();
    }
  });
});

describe("getCharacter", () => {
  it("should return the correct character for valid IDs", () => {
    const char1 = getCharacter(1);
    expect(char1).toBe(CHARACTERS[0]);

    const char32 = getCharacter(32);
    expect(char32).toBe(CHARACTERS[31]);
  });

  it("should throw for invalid IDs", () => {
    expect(() => getCharacter(0)).toThrow("Character not found");
    expect(() => getCharacter(33)).toThrow("Character not found");
    expect(() => getCharacter(-1)).toThrow("Character not found");
  });
});
