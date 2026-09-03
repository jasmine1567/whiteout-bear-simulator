-- 投稿テーブル（世代は保存せず経過日数を保存する。世代マップを直しても再判定できる）
CREATE TABLE IF NOT EXISTS submissions (
  id            TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,          -- unix秒
  updated_at    INTEGER NOT NULL,
  server_days   INTEGER NOT NULL,          -- サーバー経過日数
  spend_tier    TEXT    NOT NULL,          -- f2p / mid / whale
  hero_inf      TEXT    NOT NULL,
  hero_lan      TEXT    NOT NULL,
  hero_mks      TEXT    NOT NULL,
  ratio_inf     INTEGER,
  ratio_lan     INTEGER,
  ratio_mks     INTEGER,
  damage        INTEGER,                   -- 1ラリーの記録ダメージ（任意）
  fc_level      INTEGER,
  gear_inf      INTEGER,
  gear_lan      INTEGER,
  gear_mks      INTEGER,
  edit_key_hash TEXT    NOT NULL,          -- 編集キーのSHA-256
  client_hash   TEXT    NOT NULL,          -- IP+塩 のSHA-256（IPそのものは保存しない）
  status        TEXT    NOT NULL DEFAULT 'ok',  -- ok / flagged / removed
  comment       TEXT,                       -- 口コミ（ひとこと・任意・公開される。最大200文字）
  nick          TEXT,                       -- 表示名（任意・最大16文字）
  review_status TEXT    NOT NULL DEFAULT 'ok',  -- ok / reported（通報で自動非表示） / hidden（運営者が非表示）
  reports       INTEGER NOT NULL DEFAULT 0,
  show_damage   INTEGER NOT NULL DEFAULT 1   -- 口コミにダメージを表示するか（1=表示）
);
-- 通報（同じクライアントからは1件の口コミに1回だけ）
CREATE TABLE IF NOT EXISTS reports (
  sub_id       TEXT    NOT NULL,
  client_hash  TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (sub_id, client_hash)
);
CREATE INDEX IF NOT EXISTS idx_sub_review ON submissions(review_status, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_sub_days   ON submissions(server_days, status, created_at);
CREATE INDEX IF NOT EXISTS idx_sub_client ON submissions(client_hash, created_at);
