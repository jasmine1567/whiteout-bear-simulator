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
  damage        INTEGER,                   -- 集結1回の記録ダメージ（任意）
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
-- シミュレーター利用データ（自動記録・匿名）。口コミ投稿（submissions）とは別テーブル
CREATE TABLE IF NOT EXISTS usage (
  cid_hash    TEXT    NOT NULL,           -- ブラウザごとの匿名ID（乱数）の SHA-256。個人は特定できない
  gen         INTEGER NOT NULL,           -- シミュレーターで選んだ世代
  created_at  INTEGER NOT NULL,           -- unix秒
  updated_at  INTEGER NOT NULL,
  hits        INTEGER NOT NULL DEFAULT 1, -- 何回更新されたか
  hero_inf    TEXT    NOT NULL,           -- 集結主
  hero_lan    TEXT    NOT NULL,
  hero_mks    TEXT    NOT NULL,
  gear_inf    INTEGER,
  gear_lan    INTEGER,
  gear_mks    INTEGER,
  joiners     TEXT    NOT NULL DEFAULT '', -- 乗せ英雄のID（カンマ区切り・並べ替え済み・最大4）
  troop_tier  INTEGER,
  fc_level    INTEGER,
  team_atk    REAL, team_leth REAL,
  atk_inf     REAL, leth_inf  REAL,
  atk_lan     REAL, leth_lan  REAL,
  atk_mks     REAL, leth_mks  REAL,
  troops      INTEGER,
  ratio_inf   INTEGER, ratio_lan INTEGER, ratio_mks INTEGER,
  damage      INTEGER NOT NULL,           -- 予測ダメージ（補正係数C などの係数を全員同じ既定値にそろえて計算した値）
  calib       REAL,                       -- 利用者が設定していた補正係数C（参考。damage には使っていない）
  spend_tier  TEXT,                       -- 口コミ投稿をした人だけ（投稿フォームの課金帯）
  sub_id      TEXT,                       -- 同じ人の口コミ投稿ID（二重に数えないため）
  client_hash TEXT    NOT NULL,           -- IP+塩 のSHA-256（レート制限用。IPそのものは保存しない）
  status      TEXT    NOT NULL DEFAULT 'ok',  -- ok / flagged（非現実的な入力。集計から除外）
  flag        TEXT,                       -- 除外理由（stat_range など）
  PRIMARY KEY (cid_hash, gen)
);
CREATE INDEX IF NOT EXISTS idx_usage_win    ON usage(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_usage_client ON usage(client_hash, created_at);
