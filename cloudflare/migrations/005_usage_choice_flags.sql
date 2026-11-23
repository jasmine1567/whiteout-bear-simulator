-- v150: 世代・英雄を自分で選んだかどうかの印を usage に追加する。
-- ふつうは実行不要（新しい Worker が、列が無いことに気づいた時点で自分で足す）。手作業で足したいときだけ1回実行する
-- ファイル指定が通らない回線では、下の3文を --command で1つずつ実行する（README 参照）
ALTER TABLE usage ADD COLUMN gen_chosen INTEGER;
ALTER TABLE usage ADD COLUMN lead_touched INTEGER;
ALTER TABLE usage ADD COLUMN join_touched INTEGER;
