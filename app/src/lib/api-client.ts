import type { SubmitRequest, SubmitResponse, ResultData, GalleryEntry } from "@/types";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8788/api"
    : "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `API error: ${res.status}`);
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
};
