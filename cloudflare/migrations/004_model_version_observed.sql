-- v127: 計算モデルの版数と、実測ダメージ（非公開・検証用）の列を追加。1回だけ実行する
-- ファイル指定が通らない回線では、下の2文を --command で1つずつ実行する（README 参照）
ALTER TABLE usage ADD COLUMN mv INTEGER NOT NULL DEFAULT 1;
ALTER TABLE usage ADD COLUMN observed INTEGER;
