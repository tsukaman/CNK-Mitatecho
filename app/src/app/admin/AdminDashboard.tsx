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

interface Entry {
  id: string;
  card_id: number;
  free_text: string;
  character_id: number;
  nickname: string | null;
  nickname_public: number;
  poem: string | null;
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
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHeaders = useCallback((): HeadersInit => {
    if (useCFAccess) return {};
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }, [authToken, useCFAccess]);

  const fetchEntries = useCallback(
    async (card: number) => {
      setLoading(true);
      try {
        const url = card > 0 ? `${API_BASE}/admin/list?card=${card}` : `${API_BASE}/admin/list`;
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
      // まずCF Access (cookie認証) を試す
      try {
        const res = await fetch(`${API_BASE}/admin/list`, {
          credentials: "include",
        });
        if (res.ok) {
          setUseCFAccess(true);
          setAuthenticated(true);
          const json = await res.json();
          if (json.success) {
            setEntries(json.data.entries);
            setTotal(json.data.total);
          }
          return;
        }
      } catch {
        // CF Access not available
      }

      // sessionStorageからAPI keyを復元
      const saved = sessionStorage.getItem("admin_token");
      if (saved) {
        try {
          const res = await fetch(`${API_BASE}/admin/list`, {
            headers: { Authorization: `Bearer ${saved}` },
          });
          if (res.ok) {
            setAuthToken(saved);
            setAuthenticated(true);
            const json = await res.json();
            if (json.success) {
              setEntries(json.data.entries);
              setTotal(json.data.total);
            }
            return;
          }
        } catch {
          // invalid token
        }
        sessionStorage.removeItem("admin_token");
      }
    }
    tryAuth();
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    if (!tokenInput.trim()) {
      setAuthError("APIキーを入力してください");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/list`, {
        headers: { Authorization: `Bearer ${tokenInput.trim()}` },
      });
      if (res.ok) {
        setAuthToken(tokenInput.trim());
        sessionStorage.setItem("admin_token", tokenInput.trim());
        setAuthenticated(true);
        const json = await res.json();
        if (json.success) {
          setEntries(json.data.entries);
          setTotal(json.data.total);
        }
      } else {
        setAuthError("認証に失敗しました。APIキーを確認してください。");
      }
    } catch {
      setAuthError("接続エラーが発生しました。");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthenticated(false);
    setUseCFAccess(false);
    setEntries([]);
    setTotal(0);
    setSelectedEntry(null);
    sessionStorage.removeItem("admin_token");
  };

  const handleCardFilter = (card: number) => {
    setActiveCard(card);
    setSelectedEntry(null);
    fetchEntries(card);
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
        fetchEntries(activeCard);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  // ── 未認証: ログイン画面 ──
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 pt-20 pb-12">
        <div className="rounded-lg border border-sumi-200 bg-white p-8">
          <h1
            className="text-xl font-bold text-center text-sumi-800 mb-6"
            style={{ fontFamily: "var(--font-zen)" }}
          >
            管理画面
          </h1>
          <p className="text-xs text-sumi-500 text-center mb-6">
            Cloudflare Access が設定されている場合は自動的に認証されます。
            <br />
            それ以外の場合はAPIキーを入力してください。
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
            <button
              onClick={handleLogin}
              className="w-full rounded bg-sumi-800 px-4 py-2 text-sm font-bold text-white hover:bg-sumi-700 transition-colors"
            >
              ログイン
            </button>
            {authError && (
              <p className="text-xs text-red-600 text-center">{authError}</p>
            )}
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
        <h1
          className="text-xl font-bold text-sumi-800"
          style={{ fontFamily: "var(--font-zen)" }}
        >
          管理画面
        </h1>
        <div className="flex items-center gap-3">
          {useCFAccess && (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
              CF Access
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-sumi-500 hover:text-sumi-800 underline"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* カードフィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CARD_LABELS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCardFilter(c.id)}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              activeCard === c.id
                ? "text-white border-transparent"
                : "text-sumi-700 border-sumi-300 bg-white hover:bg-sumi-50"
            }`}
            style={
              activeCard === c.id
                ? { backgroundColor: c.color, borderColor: c.color }
                : {}
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 件数 */}
      <p className="text-xs text-sumi-500 mb-3">
        {loading ? "読み込み中..." : `${total} 件`}
      </p>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-lg border border-sumi-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sumi-200 bg-sumi-50">
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">ID</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">巻</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">武将</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">日時</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">自由記述</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-sumi-600">短歌</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-sumi-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sumi-400">
                  データがありません
                </td>
              </tr>
            )}
            {entries.map((entry) => {
              const cardInfo = CARD_LABELS.find((c) => c.id === entry.card_id);
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-sumi-100 cursor-pointer transition-colors ${
                    selectedEntry?.id === entry.id
                      ? "bg-ai-50"
                      : "hover:bg-sumi-50"
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <td className="px-3 py-2 font-mono text-xs text-sumi-500">
                    {entry.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: cardInfo?.color }}
                    >
                      {cardInfo?.label || entry.card_id}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2 text-xs"
                    style={{ fontFamily: "var(--font-brush)" }}
                  >
                    {getCharacterName(entry.character_id)}
                  </td>
                  <td className="px-3 py-2 text-xs text-sumi-500 whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[200px]">
                    {truncate(entry.free_text, 30)}
                  </td>
                  <td
                    className="px-3 py-2 text-xs max-w-[200px]"
                    style={{ fontFamily: "var(--font-poem)" }}
                  >
                    {entry.poem ? truncate(entry.poem, 25) : (
                      <span className="text-sumi-300">生成中...</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(entry);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 詳細パネル */}
      {selectedEntry && (
        <div className="mt-6 rounded-lg border border-sumi-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-sumi-700">投稿詳細</h2>
            <button
              onClick={() => setSelectedEntry(null)}
              className="text-xs text-sumi-400 hover:text-sumi-600"
            >
              閉じる
            </button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-sumi-500 font-bold">ID</dt>
            <dd className="font-mono text-xs">{selectedEntry.id}</dd>

            <dt className="text-sumi-500 font-bold">巻</dt>
            <dd>
              <span style={{ color: CARD_LABELS.find((c) => c.id === selectedEntry.card_id)?.color }}>
                {CARD_LABELS.find((c) => c.id === selectedEntry.card_id)?.label}
              </span>
            </dd>

            <dt className="text-sumi-500 font-bold">武将</dt>
            <dd style={{ fontFamily: "var(--font-brush)" }}>
              {getCharacterName(selectedEntry.character_id)}
              <span className="text-sumi-400 text-xs ml-2">(#{selectedEntry.character_id})</span>
            </dd>

            <dt className="text-sumi-500 font-bold">ニックネーム</dt>
            <dd>
              {selectedEntry.nickname || (
                <span className="text-sumi-300">なし</span>
              )}
              {selectedEntry.nickname && (
                <span className="ml-2 text-xs text-sumi-400">
                  ({selectedEntry.nickname_public ? "公開" : "非公開"})
                </span>
              )}
            </dd>

            <dt className="text-sumi-500 font-bold">自由記述</dt>
            <dd className="whitespace-pre-wrap">{selectedEntry.free_text}</dd>

            <dt className="text-sumi-500 font-bold">短歌</dt>
            <dd style={{ fontFamily: "var(--font-poem)" }}>
              {selectedEntry.poem || (
                <span className="text-sumi-300">未生成</span>
              )}
            </dd>

            <dt className="text-sumi-500 font-bold">日時</dt>
            <dd className="text-xs text-sumi-500">{selectedEntry.created_at}</dd>
          </dl>
          <div className="mt-4 pt-4 border-t border-sumi-100 flex justify-end">
            <button
              onClick={() => setDeleteTarget(selectedEntry)}
              className="text-xs text-red-500 hover:text-red-700 border border-red-300 rounded px-3 py-1 hover:bg-red-50 transition-colors"
            >
              この投稿を削除
            </button>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-sumi-800 mb-3">
              削除確認
            </h3>
            <p className="text-xs text-sumi-600 mb-2">
              以下の投稿を削除しますか？ この操作は取り消せません。
            </p>
            <div className="rounded bg-sumi-50 p-3 mb-4 text-xs">
              <p>
                <span className="font-bold">ID:</span> {deleteTarget.id}
              </p>
              <p>
                <span className="font-bold">武将:</span>{" "}
                {getCharacterName(deleteTarget.character_id)}
              </p>
              <p>
                <span className="font-bold">自由記述:</span>{" "}
                {truncate(deleteTarget.free_text, 50)}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="text-xs text-sumi-600 border border-sumi-300 rounded px-4 py-2 hover:bg-sumi-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
