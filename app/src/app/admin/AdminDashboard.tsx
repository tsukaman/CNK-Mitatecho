"use client";

import { useState, useEffect, useCallback } from "react";
import { CHARACTERS } from "@/lib/characters";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8788/api"
    : "/api";

const CARD_LABELS = [
  { id: 0, label: "全件", color: "#6b7280" },
  { id: 1, label: "壱/紅", color: "#c43c3c" },
  { id: 2, label: "弐/藍", color: "#4a7fb5" },
  { id: 3, label: "参/翠", color: "#4a8c5c" },
  { id: 4, label: "肆/金", color: "#b8963e" },
  { id: 5, label: "伍/紫", color: "#8b5cad" },
  { id: 6, label: "陸/白", color: "#8a9aad" },
];

type VisibilityFilter = "all" | "visible" | "hidden";

interface Entry {
  id: string;
  card_id: number;
  free_text: string;
  character_id: number;
  nickname: string | null;
  nickname_public: number;
  poem: string | null;
  is_hidden: number;
  created_at: string;
}

function getCharacterName(id: number): string {
  const char = CHARACTERS.find((c) => c.id === id);
  return char ? char.name : `#${id}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "Z");
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function AdminDashboard() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [useCFAccess, setUseCFAccess] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState({ free_text: "", nickname: "", nickname_public: 0, poem: "" });
  const [saving, setSaving] = useState(false);

  const fetchHeaders = useCallback((): HeadersInit => {
    if (useCFAccess) return {};
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }, [authToken, useCFAccess]);

  const fetchEntries = useCallback(
    async (card: number, visibility: VisibilityFilter = "all") => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (card > 0) params.set("card", String(card));
        if (visibility !== "all") params.set("visibility", visibility);
        const qs = params.toString();
        const url = `${API_BASE}/admin/list${qs ? `?${qs}` : ""}`;
        const res = await fetch(url, {
          headers: fetchHeaders(),
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            setAuthenticated(false);
            setAuthError("認証が無効です。再度ログインしてください。");
          }
          return;
        }
        const json = await res.json();
        if (json.success) {
          setEntries(json.data.entries);
          setTotal(json.data.total);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchHeaders]
  );

  // 初回: CF Access認証を試行
  useEffect(() => {
    async function tryAuth() {
      try {
        const res = await fetch(`${API_BASE}/admin/list`, { credentials: "include" });
        if (res.ok) {
          setUseCFAccess(true);
          setAuthenticated(true);
          const json = await res.json();
          if (json.success) { setEntries(json.data.entries); setTotal(json.data.total); }
          return;
        }
      } catch { /* CF Access not available */ }

      const saved = sessionStorage.getItem("admin_token");
      if (saved) {
        try {
          const res = await fetch(`${API_BASE}/admin/list`, { headers: { Authorization: `Bearer ${saved}` } });
          if (res.ok) {
            setAuthToken(saved);
            setAuthenticated(true);
            const json = await res.json();
            if (json.success) { setEntries(json.data.entries); setTotal(json.data.total); }
            return;
          }
        } catch { /* invalid token */ }
        sessionStorage.removeItem("admin_token");
      }
    }
    tryAuth();
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    if (!tokenInput.trim()) { setAuthError("APIキーを入力してください"); return; }
    try {
      const res = await fetch(`${API_BASE}/admin/list`, { headers: { Authorization: `Bearer ${tokenInput.trim()}` } });
      if (res.ok) {
        setAuthToken(tokenInput.trim());
        sessionStorage.setItem("admin_token", tokenInput.trim());
        setAuthenticated(true);
        const json = await res.json();
        if (json.success) { setEntries(json.data.entries); setTotal(json.data.total); }
      } else {
        setAuthError("認証に失敗しました。APIキーを確認してください。");
      }
    } catch { setAuthError("接続エラーが発生しました。"); }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthenticated(false);
    setEntries([]);
    setTotal(0);
    setSelectedEntry(null);
    sessionStorage.removeItem("admin_token");
    if (useCFAccess) {
      setUseCFAccess(false);
      window.location.href = `https://cnk-mitatecho.cloudflareaccess.com/cdn-cgi/access/logout?returnTo=${encodeURIComponent("https://cnk-mitatecho.pages.dev/admin")}`;
    }
  };

  const handleCardFilter = (card: number) => {
    setActiveCard(card);
    setSelectedEntry(null);
    fetchEntries(card, visibilityFilter);
  };

  const handleVisibilityFilter = (v: VisibilityFilter) => {
    setVisibilityFilter(v);
    setSelectedEntry(null);
    fetchEntries(activeCard, v);
  };

  const handleToggleVisibility = async (entry: Entry) => {
    setToggling(entry.id);
    try {
      const res = await fetch(`${API_BASE}/admin/toggle-visibility/${entry.id}`, {
        method: "POST",
        headers: fetchHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        fetchEntries(activeCard, visibilityFilter);
        if (selectedEntry?.id === entry.id) {
          setSelectedEntry({ ...entry, is_hidden: entry.is_hidden ? 0 : 1 });
        }
      }
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/delete/${deleteTarget.id}`, {
        method: "DELETE",
        headers: fetchHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        setDeleteTarget(null);
        if (selectedEntry?.id === deleteTarget.id) setSelectedEntry(null);
        fetchEntries(activeCard, visibilityFilter);
      } else {
        const json = await res.json().catch(() => null);
        if (json?.error) alert(json.error);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditTarget(entry);
    setEditForm({
      free_text: entry.free_text,
      nickname: entry.nickname || "",
      nickname_public: entry.nickname_public,
      poem: entry.poem || "",
    });
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/update/${editTarget.id}`, {
        method: "PATCH",
        headers: { ...fetchHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const json = await res.json();
        setEditTarget(null);
        if (selectedEntry?.id === editTarget.id && json.data) {
          setSelectedEntry(json.data);
        }
        fetchEntries(activeCard, visibilityFilter);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── 未認証: ログイン画面 ──
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 pt-20 pb-12">
        <div className="rounded-lg border border-sumi-200 bg-white p-8">
          <h1 className="text-xl font-bold text-center text-sumi-800 mb-6" style={{ fontFamily: "var(--font-zen)" }}>
            管理画面
          </h1>
          <p className="text-xs text-sumi-500 text-center mb-6">
            Cloudflare Access が設定されている場合は自動的に認証されます。
            <br />それ以外の場合はAPIキーを入力してください。
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="ADMIN_API_KEY"
              className="w-full rounded border border-sumi-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-400"
            />
            <button onClick={handleLogin} className="w-full rounded bg-sumi-800 px-4 py-2 text-sm font-bold text-white hover:bg-sumi-700 transition-colors">
              ログイン
            </button>
            {authError && <p className="text-xs text-red-600 text-center">{authError}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── 認証済み: ダッシュボード ──
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 pb-12">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-sumi-800" style={{ fontFamily: "var(--font-zen)" }}>管理画面</h1>
        <div className="flex items-center gap-3">
          {useCFAccess && <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">CF Access</span>}
          <button onClick={handleLogout} className="text-xs text-sumi-500 hover:text-sumi-800 underline">ログアウト</button>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 mb-2">
        {CARD_LABELS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCardFilter(c.id)}
            className={`px-3 py-1 text-sm rounded border transition-colors ${activeCard === c.id ? "text-white border-transparent" : "text-sumi-700 border-sumi-300 bg-white hover:bg-sumi-50"}`}
            style={activeCard === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {(["all", "visible", "hidden"] as VisibilityFilter[]).map((v) => {
          const label = v === "all" ? "すべて" : v === "visible" ? "表示中" : "非表示";
          return (
            <button
              key={v}
              onClick={() => handleVisibilityFilter(v)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${visibilityFilter === v ? "bg-sumi-800 text-white border-sumi-800" : "text-sumi-500 border-sumi-300 bg-white hover:bg-sumi-50"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 件数 */}
      <p className="text-xs text-sumi-500 mb-3">{loading ? "読み込み中..." : `${total} 件`}</p>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-lg border border-sumi-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sumi-200 bg-sumi-50">
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600 whitespace-nowrap">状態</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600 whitespace-nowrap">巻</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600 whitespace-nowrap">武将</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">投稿者</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600 whitespace-nowrap">日時</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">自由記述</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">短歌</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-sumi-600 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && !loading && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-sumi-400">データがありません</td></tr>
            )}
            {entries.map((entry) => {
              const cardInfo = CARD_LABELS.find((c) => c.id === entry.card_id);
              const hidden = !!entry.is_hidden;
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-sumi-100 cursor-pointer transition-colors ${hidden ? "opacity-50" : ""} ${selectedEntry?.id === entry.id ? "bg-ai-50" : "hover:bg-sumi-50"}`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {hidden ? (
                      <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">非表示</span>
                    ) : (
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">公開</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs font-bold" style={{ color: cardInfo?.color }}>{cardInfo?.label || entry.card_id}</span>
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ fontFamily: "var(--font-brush)" }}>{getCharacterName(entry.character_id)}</td>
                  <td className="px-3 py-2 text-xs text-sumi-500">{entry.nickname || <span className="text-sumi-300">-</span>}</td>
                  <td className="px-3 py-2 text-xs text-sumi-500 whitespace-nowrap">{formatDate(entry.created_at)}</td>
                  <td className="px-3 py-2 text-xs max-w-[200px]">{truncate(entry.free_text, 30)}</td>
                  <td className="px-3 py-2 text-xs max-w-[200px]" style={{ fontFamily: "var(--font-poem)" }}>
                    {entry.poem ? truncate(entry.poem, 25) : <span className="text-sumi-300">生成中...</span>}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleVisibility(entry); }}
                      disabled={toggling === entry.id}
                      className={`text-xs mr-2 hover:underline ${hidden ? "text-green-600 hover:text-green-800" : "text-yellow-600 hover:text-yellow-800"}`}
                    >
                      {toggling === entry.id ? "..." : hidden ? "表示" : "非表示"}
                    </button>
                    {hidden && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry); }}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        削除
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 詳細モーダル */}
      {selectedEntry && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setSelectedEntry(null)}>
          <div className="mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-sumi-700">投稿詳細</h2>
                {selectedEntry.is_hidden ? (
                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">非表示</span>
                ) : (
                  <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">公開中</span>
                )}
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-sumi-400 hover:text-sumi-600 text-lg leading-none">&times;</button>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-sumi-500 font-bold">ID</dt>
              <dd className="font-mono text-xs">{selectedEntry.id}</dd>
              <dt className="text-sumi-500 font-bold">巻</dt>
              <dd><span style={{ color: CARD_LABELS.find((c) => c.id === selectedEntry.card_id)?.color }}>{CARD_LABELS.find((c) => c.id === selectedEntry.card_id)?.label}</span></dd>
              <dt className="text-sumi-500 font-bold">武将</dt>
              <dd style={{ fontFamily: "var(--font-brush)" }}>{getCharacterName(selectedEntry.character_id)}<span className="text-sumi-400 text-xs ml-2">(#{selectedEntry.character_id})</span></dd>
              <dt className="text-sumi-500 font-bold">ニックネーム</dt>
              <dd>
                {selectedEntry.nickname || <span className="text-sumi-300">なし</span>}
                {selectedEntry.nickname && <span className="ml-2 text-xs text-sumi-400">({selectedEntry.nickname_public ? "公開" : "非公開"})</span>}
              </dd>
              <dt className="text-sumi-500 font-bold">自由記述</dt>
              <dd className="whitespace-pre-wrap">{selectedEntry.free_text}</dd>
              <dt className="text-sumi-500 font-bold">短歌</dt>
              <dd style={{ fontFamily: "var(--font-poem)" }}>{selectedEntry.poem || <span className="text-sumi-300">未生成</span>}</dd>
              <dt className="text-sumi-500 font-bold">日時</dt>
              <dd className="text-xs text-sumi-500">{selectedEntry.created_at}</dd>
            </dl>
            <div className="mt-4 pt-4 border-t border-sumi-100 flex justify-end gap-3">
              <button
                onClick={() => handleToggleVisibility(selectedEntry)}
                disabled={toggling === selectedEntry.id}
                className={`text-xs border rounded px-3 py-1 transition-colors ${selectedEntry.is_hidden ? "text-green-600 border-green-300 hover:bg-green-50" : "text-yellow-600 border-yellow-300 hover:bg-yellow-50"}`}
              >
                {selectedEntry.is_hidden ? "表示にする" : "非表示にする"}
              </button>
              <button
                onClick={() => handleEdit(selectedEntry)}
                className="text-xs text-ai-600 border border-ai-300 rounded px-3 py-1 hover:bg-ai-50 transition-colors"
              >
                編集
              </button>
              {selectedEntry.is_hidden ? (
                <button
                  onClick={() => setDeleteTarget(selectedEntry)}
                  className="text-xs text-red-500 border border-red-300 rounded px-3 py-1 hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              ) : (
                <span className="text-xs text-sumi-300 border border-sumi-200 rounded px-3 py-1 cursor-not-allowed" title="削除するには先に非表示にしてください">
                  削除
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-sumi-800 mb-4">投稿を編集</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-sumi-600 mb-1">自由記述</label>
                <textarea
                  value={editForm.free_text}
                  onChange={(e) => setEditForm({ ...editForm, free_text: e.target.value })}
                  className="w-full rounded border border-sumi-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sumi-600 mb-1">短歌</label>
                <textarea
                  value={editForm.poem}
                  onChange={(e) => setEditForm({ ...editForm, poem: e.target.value })}
                  className="w-full rounded border border-sumi-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-400"
                  rows={5}
                  style={{ fontFamily: "var(--font-poem)" }}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-sumi-600 mb-1">ニックネーム</label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full rounded border border-sumi-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sumi-600 mb-1">公開</label>
                  <button
                    onClick={() => setEditForm({ ...editForm, nickname_public: editForm.nickname_public ? 0 : 1 })}
                    className={`px-3 py-2 text-sm rounded border transition-colors ${editForm.nickname_public ? "bg-green-50 text-green-700 border-green-300" : "bg-sumi-50 text-sumi-500 border-sumi-300"}`}
                  >
                    {editForm.nickname_public ? "公開" : "非公開"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditTarget(null)}
                disabled={saving}
                className="text-xs text-sumi-600 border border-sumi-300 rounded px-4 py-2 hover:bg-sumi-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.free_text.trim()}
                className="text-xs text-white bg-ai-600 rounded px-4 py-2 hover:bg-ai-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-sumi-800 mb-3">削除確認</h3>
            <p className="text-xs text-sumi-600 mb-2">以下の投稿を削除しますか？ この操作は取り消せません。</p>
            <div className="rounded bg-sumi-50 p-3 mb-4 text-xs">
              <p><span className="font-bold">ID:</span> {deleteTarget.id}</p>
              <p><span className="font-bold">武将:</span> {getCharacterName(deleteTarget.character_id)}</p>
              <p><span className="font-bold">自由記述:</span> {truncate(deleteTarget.free_text, 50)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="text-xs text-sumi-600 border border-sumi-300 rounded px-4 py-2 hover:bg-sumi-50">キャンセル</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700 disabled:opacity-50">
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
