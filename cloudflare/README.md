# whitesim-lab.com 統計API（Cloudflare Workers）

投稿の受付・保存・日次集計を担う Worker です。サイト本体（GitHub Pages）とは独立してデプロイします。

## 構成
```
cloudflare/
├─ wrangler.toml      設定（D1 / KV の ID をここに貼る）
├─ schema.sql         D1 のテーブル定義
├─ src/index.js       Worker 本体
├─ src/heroes-min.json  英雄マスタ（_solve_theory.js が自動生成。手で編集しない）
└─ test/worker.test.mjs  ローカルテスト（D1/KV をモック）
```
`../assets/gen-map.js` と `../assets/theory.json` を直接 import しているので、
**サイト側で `node _solve_theory.js` を回したら Worker も再デプロイ**してください。

## 初回セットアップ（1回だけ）
```bash
cd cloudflare
npm install
npx wrangler login                                   # ブラウザで Cloudflare にログイン

npx wrangler d1 create whitesim-stats                # → database_id を wrangler.toml に貼る
npx wrangler d1 execute whitesim-stats --remote --file=./schema.sql

npx wrangler kv namespace create STATS               # → id を wrangler.toml に貼る

npx wrangler secret put TURNSTILE_SECRET             # Turnstile のシークレットキー
npx wrangler secret put CLIENT_SALT                  # 長いランダム文字列（例: openssl rand -hex 32）

npx wrangler deploy
```

### Turnstile
Cloudflare ダッシュボード → Turnstile → サイトを追加（ドメイン `whitesim-lab.com`）。
- サイトキー → サイト側 `assets/config.js` の `WOS_TURNSTILE_SITEKEY`
- シークレットキー → 上の `wrangler secret put TURNSTILE_SECRET`

### サブドメイン
Workers & Pages → whitesim-stats → Settings → Domains & Routes → Custom Domain に
`api.whitesim-lab.com` を追加。表示された CNAME を現在の DNS に1行追加。
`curl https://api.whitesim-lab.com/v1/stats/summary` が JSON を返せば完了。

## 日常運用
```bash
npm test          # ローカルで25項目の検証（D1/KV はモック）
npm run deploy    # 本番へ
```
集計は毎日 20:00 UTC（JST 05:00）に自動実行され、KV に書き出されます。
手動で集計し直したいときは `GET /v1/stats/summary` を KV が空の状態で叩くか、
ダッシュボードの Cron Triggers から手動実行してください。

## エンドポイント
| メソッド | パス | 役割 |
|---|---|---|
| POST | /v1/submit | 投稿。返り値に編集キーと診断（順位・世代ラグ・理論値との差） |
| DELETE | /v1/submit/:id | 編集キーで自分の投稿を削除 |
| GET | /v1/stats/summary | 全世代のサンプル数 |
| GET | /v1/stats/:gen | その世代の集計 |

## 無料枠の目安
Workers 10万リクエスト/日、D1 500万行読み取り/日、KV 10万読み取り/日。
1日1万PV規模でも余裕があります。

## 切り戻し
サイト側 `assets/config.js` の `WOS_API` を空文字にすると、実測パートだけが「集計中」表示になり、
理論値パートはそのまま動き続けます。Worker を止めてもサイトは壊れません。
