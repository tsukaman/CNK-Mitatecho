CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  card_id INTEGER NOT NULL,
  q1 INTEGER NOT NULL,
  q2 INTEGER NOT NULL,
  free_text TEXT NOT NULL,
  character_id INTEGER NOT NULL,
  poem TEXT,
  nickname TEXT,
  nickname_public INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_answers_card ON answers(card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_character ON answers(character_id);
CREATE INDEX IF NOT EXISTS idx_answers_hidden ON answers(is_hidden, card_id, created_at DESC);

-- /api/submit のレート制限用（10 req/60s/IP）
-- key: "submit:<ip>" 形式。window_start は unix 秒、count はその window 内のリクエスト数。
-- 同一 key の UPSERT で窓期限切れなら reset、そうでなければインクリメント。
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
