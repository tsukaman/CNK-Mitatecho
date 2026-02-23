/** Server-side token resolution (source of truth) */
const TOKEN_MAP = {
  "7kM2": { card: 1, q1: 1 },
  "Rp4x": { card: 1, q1: 2 },
  "vN8j": { card: 1, q1: 3 },
  "Qe3w": { card: 1, q1: 4 },
  "bT6f": { card: 2, q1: 1 },
  "Hy9m": { card: 2, q1: 2 },
  "dK2s": { card: 2, q1: 3 },
  "Wn5r": { card: 2, q1: 4 },
  "gJ4c": { card: 3, q1: 1 },
  "Lx7p": { card: 3, q1: 2 },
  "mF9t": { card: 3, q1: 3 },
  "Zq2v": { card: 3, q1: 4 },
  "kS8a": { card: 4, q1: 1 },
  "Uw3h": { card: 4, q1: 2 },
  "nB6y": { card: 4, q1: 3 },
  "Xe5d": { card: 4, q1: 4 },
  "rG7n": { card: 5, q1: 1 },
  "Pj2k": { card: 5, q1: 2 },
  "tV9e": { card: 5, q1: 3 },
  "Cf4q": { card: 5, q1: 4 },
  "hA3u": { card: 6, q1: 1 },
  "Ym8b": { card: 6, q1: 2 },
  "sD5w": { card: 6, q1: 3 },
  "Fk6z": { card: 6, q1: 4 },
};

export function resolveToken(token) {
  return TOKEN_MAP[token] || null;
}
