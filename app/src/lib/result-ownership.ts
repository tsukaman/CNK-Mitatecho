// 端末ローカルの「自分の結果」マーカー。改竄可能で認証用途には使えない。UI分岐専用。
const STORAGE_KEY = "cnk-owned-results";
const MAX_ENTRIES = 50;

function readOwned(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markResultOwned(id: string): void {
  if (typeof window === "undefined") return;
  const list = readOwned().filter((x) => x !== id);
  list.push(id);
  if (list.length > MAX_ENTRIES) list.splice(0, list.length - MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage 不可・容量超過などは握りつぶす
  }
}

export function isResultOwned(id: string): boolean {
  return readOwned().includes(id);
}
