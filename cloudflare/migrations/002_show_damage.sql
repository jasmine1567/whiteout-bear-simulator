-- v11 以前の schema.sql で表を作った場合に1回だけ実行する（D1 のコンソールに貼って実行、または wrangler d1 execute）
ALTER TABLE submissions ADD COLUMN show_damage INTEGER NOT NULL DEFAULT 1;
