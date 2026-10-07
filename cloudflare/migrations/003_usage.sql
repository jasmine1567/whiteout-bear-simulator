-- v115: シミュレーター利用データの自動記録。すでに D1 を作成済みの場合に1回だけ実行する
--   npx wrangler d1 execute whitesim-stats --remote --file=./migrations/003_usage.sql
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
