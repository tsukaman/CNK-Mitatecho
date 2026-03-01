import { describe, it, expect } from "vitest";
import { TOKEN_MAP, REVERSE_TOKEN_MAP, resolveToken, getToken } from "@/lib/tokens";

describe("TOKEN_MAP", () => {
  const tokens = Object.keys(TOKEN_MAP);

  it("should have exactly 24 entries (6 cards x 4 Q1)", () => {
    expect(tokens).toHaveLength(24);
  });

  it("should have all tokens be unique 4-character strings", () => {
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(24);
    for (const token of tokens) {
      expect(token).toHaveLength(4);
    }
  });

  it("should cover all 6 cards x 4 Q1 combinations", () => {
    const combos = new Set(
      Object.values(TOKEN_MAP).map((e) => `${e.card}-${e.q1}`)
    );
    expect(combos.size).toBe(24);
    for (let card = 1; card <= 6; card++) {
      for (let q1 = 1; q1 <= 4; q1++) {
        expect(combos.has(`${card}-${q1}`), `Missing combo ${card}-${q1}`).toBe(true);
      }
    }
  });
});

describe("resolveToken / getToken bidirectional consistency", () => {
  it("resolveToken -> getToken should round-trip", () => {
    for (const [token, entry] of Object.entries(TOKEN_MAP)) {
      const resolved = resolveToken(token);
      expect(resolved).toEqual(entry);
      const backToToken = getToken(entry.card, entry.q1);
      expect(backToToken, `Round-trip failed for token ${token}`).toBe(token);
    }
  });

  it("getToken -> resolveToken should round-trip", () => {
    for (let card = 1; card <= 6; card++) {
      for (let q1 = 1; q1 <= 4; q1++) {
        const token = getToken(card, q1);
        expect(token, `No token for card=${card}, q1=${q1}`).not.toBeNull();
        const entry = resolveToken(token!);
        expect(entry).toEqual({ card, q1 });
      }
    }
  });

  it("resolveToken should return null for unknown tokens", () => {
    expect(resolveToken("ZZZZ")).toBeNull();
    expect(resolveToken("")).toBeNull();
  });

  it("getToken should return null for out-of-range values", () => {
    expect(getToken(0, 1)).toBeNull();
    expect(getToken(7, 1)).toBeNull();
    expect(getToken(1, 5)).toBeNull();
  });
});

describe("REVERSE_TOKEN_MAP", () => {
  it("should have exactly 24 entries matching TOKEN_MAP", () => {
    expect(Object.keys(REVERSE_TOKEN_MAP)).toHaveLength(24);
  });
});
