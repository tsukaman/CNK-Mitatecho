/**
 * 24 fixed 4-char alphanumeric tokens for card×q1 combinations.
 * Used in URLs: /q2?t=<token>
 * Designed to be short, non-sequential, and non-guessable.
 */

interface TokenEntry {
  card: number;
  q1: number;
}

const TOKEN_MAP: Record<string, TokenEntry> = {
  // Card 1 (紅)
  "7kM2": { card: 1, q1: 1 },
  "Rp4x": { card: 1, q1: 2 },
  "vN8j": { card: 1, q1: 3 },
  "Qe3w": { card: 1, q1: 4 },
  // Card 2 (藍)
  "bT6f": { card: 2, q1: 1 },
  "Hy9m": { card: 2, q1: 2 },
  "dK2s": { card: 2, q1: 3 },
  "Wn5r": { card: 2, q1: 4 },
  // Card 3 (翠)
  "gJ4c": { card: 3, q1: 1 },
  "Lx7p": { card: 3, q1: 2 },
  "mF9t": { card: 3, q1: 3 },
  "Zq2v": { card: 3, q1: 4 },
  // Card 4 (金)
  "kS8a": { card: 4, q1: 1 },
  "Uw3h": { card: 4, q1: 2 },
  "nB6y": { card: 4, q1: 3 },
  "Xe5d": { card: 4, q1: 4 },
  // Card 5 (紫)
  "rG7n": { card: 5, q1: 1 },
  "Pj2k": { card: 5, q1: 2 },
  "tV9e": { card: 5, q1: 3 },
  "Cf4q": { card: 5, q1: 4 },
  // Card 6 (白)
  "hA3u": { card: 6, q1: 1 },
  "Ym8b": { card: 6, q1: 2 },
  "sD5w": { card: 6, q1: 3 },
  "Fk6z": { card: 6, q1: 4 },
};

// Reverse map: "card-q1" → token
const REVERSE_TOKEN_MAP: Record<string, string> = {};
for (const [token, entry] of Object.entries(TOKEN_MAP)) {
  REVERSE_TOKEN_MAP[`${entry.card}-${entry.q1}`] = token;
}

export function resolveToken(token: string): TokenEntry | null {
  return TOKEN_MAP[token] || null;
}

export function getToken(card: number, q1: number): string | null {
  return REVERSE_TOKEN_MAP[`${card}-${q1}`] || null;
}

/**
 * Card slug mapping: random 6-char slugs for /select/ URLs.
 * Prevents sequential card ID guessing.
 */
const CARD_SLUG_MAP: Record<string, number> = {
  "xT3mKw": 1,
  "qR8nLv": 2,
  "hJ5pYa": 3,
  "bW2cFg": 4,
  "dN9sXe": 5,
  "zV6rMu": 6,
};

const REVERSE_CARD_SLUG_MAP: Record<number, string> = {};
for (const [slug, cardId] of Object.entries(CARD_SLUG_MAP)) {
  REVERSE_CARD_SLUG_MAP[cardId] = slug;
}

export function resolveCardSlug(slug: string): number | null {
  return CARD_SLUG_MAP[slug] ?? null;
}

export function getCardSlug(cardId: number): string | null {
  return REVERSE_CARD_SLUG_MAP[cardId] ?? null;
}

export { TOKEN_MAP, REVERSE_TOKEN_MAP, CARD_SLUG_MAP };
