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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_answers_card ON answers(card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_character ON answers(character_id);
