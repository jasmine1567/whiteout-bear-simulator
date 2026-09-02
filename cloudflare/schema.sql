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
  status        TEXT    NOT NULL DEFAULT 'ok'   -- ok / flagged / removed
);
CREATE INDEX IF NOT EXISTS idx_sub_days   ON submissions(server_days, status, created_at);
CREATE INDEX IF NOT EXISTS idx_sub_client ON submissions(client_hash, created_at);
