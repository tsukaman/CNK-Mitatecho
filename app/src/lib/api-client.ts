import type { SubmitRequest, SubmitResponse, ResultData, GalleryEntry, PoemEntry } from "@/types";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8788/api"
    : "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  // 非JSON（HTMLエラーページ等）でも SyntaxError で原因を隠さないよう防御的に処理
  let json: { success?: boolean; data?: unknown; error?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    // 204 No Content や空ボディ 2xx は undefined として許容（誤検知回避）
    if (res.ok) return undefined as T;
    throw new Error(res.status === 429 ? 'リクエストが多すぎます。少し時間をおいて再試行してください。' : `通信エラー (HTTP ${res.status})`);
  }
  if (!res.ok || !json || !json.success) {
    throw new Error(json?.error || `API error: ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  async submit(req: SubmitRequest): Promise<{ id: string; character_id: number }> {
    return fetchJSON(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  },

  async getResult(id: string): Promise<ResultData> {
    return fetchJSON(`${API_BASE}/result/${id}`);
  },

  async getGallery(card: number): Promise<{ entries: GalleryEntry[] }> {
    return fetchJSON(`${API_BASE}/gallery?card=${card}`);
  },

  async getPoems(limit = 12): Promise<{ entries: PoemEntry[] }> {
    return fetchJSON(`${API_BASE}/poems?limit=${limit}`);
  },
};
