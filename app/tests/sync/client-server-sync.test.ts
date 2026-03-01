import { describe, it, expect } from "vitest";
import { CHARACTER_MAPPING as clientMapping } from "@/lib/mapping";
import { TOKEN_MAP as clientTokenMap } from "@/lib/tokens";

// Server-side modules (plain JS)
import { getCharacterId as serverGetCharacterId } from "../../functions/utils/mapping.js";
import { resolveToken as serverResolveToken } from "../../functions/utils/tokens.js";

describe("client/server mapping sync", () => {
  it("should have identical 96 mapping entries covering all combinations", () => {
    const clientKeys = Object.keys(clientMapping).sort();
    expect(clientKeys).toHaveLength(96);

    // Verify all 96 combinations match between client and server
    for (let card = 1; card <= 6; card++) {
      for (let q1 = 1; q1 <= 4; q1++) {
        for (let q2 = 1; q2 <= 4; q2++) {
          const key = `${card}-${q1}-${q2}`;
          const serverVal = serverGetCharacterId(card, q1, q2);
          const clientVal = clientMapping[key];
          expect(clientVal, `Client missing key ${key}`).toBeDefined();
          expect(serverVal, `Server returned null for ${key}`).not.toBeNull();
          expect(serverVal, `Mismatch for key ${key}`).toBe(clientVal);
        }
      }
    }
  });
});

describe("client/server token sync", () => {
  it("should have identical 24 token entries", () => {
    const clientTokens = Object.keys(clientTokenMap);
    expect(clientTokens).toHaveLength(24);

    for (const token of clientTokens) {
      const clientEntry = clientTokenMap[token];
      const serverEntry = serverResolveToken(token);
      expect(serverEntry, `Server missing token: ${token}`).not.toBeNull();
      expect(serverEntry.card, `Token ${token} card mismatch`).toBe(clientEntry.card);
      expect(serverEntry.q1, `Token ${token} q1 mismatch`).toBe(clientEntry.q1);
    }
  });

  it("server should return null for invalid tokens", () => {
    expect(serverResolveToken("XXXX")).toBeNull();
    expect(serverResolveToken("")).toBeNull();
  });
});
