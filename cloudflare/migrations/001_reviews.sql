-- すでに手順3で schema.sql を流したあとに v8 へ更新する場合だけ実行する（初回セットアップなら不要）
--   npx wrangler d1 execute whitesim-stats --remote --file=./migrations/001_reviews.sql
ALTER TABLE submissions ADD COLUMN comment TEXT;
ALTER TABLE submissions ADD COLUMN nick TEXT;
ALTER TABLE submissions ADD COLUMN review_status TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE submissions ADD COLUMN reports INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS reports (
  sub_id       TEXT    NOT NULL,
  client_hash  TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (sub_id, client_hash)
);
CREATE INDEX IF NOT EXISTS idx_sub_review ON submissions(review_status, status, updated_at);
