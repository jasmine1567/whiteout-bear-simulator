# 統計APIのセットアップ手順（初めての方向け）

このフォルダには「世代別統計」の投稿を受け付けて集計するプログラム（Cloudflare Worker）が入っています。
サイト本体（GitHub Pages）とは別の場所で動くので、**サイトのアップロード手順は今までと変わりません。**

所要時間の目安: 初回 40〜60分（ほとんどが画面での設定作業です）。費用: 無料枠で足ります。

---

## 全体の流れ

| 手順 | やること | 場所 |
|---|---|---|
| 0 | パソコンに Node.js を入れる | パソコン |
| 1 | Cloudflare のアカウントを作る | ブラウザ |
| 2 | このフォルダで準備コマンドを実行する | パソコン（黒い画面） |
| 3 | データ置き場（D1 と KV）を作って、IDを設定ファイルに貼る | パソコン |
| 4 | 人間確認（Turnstile）のキーを発行する | ブラウザ → パソコン |
| 5 | 本番に配置する（デプロイ） | パソコン |
| 6 | `api.whitesim-lab.com` を割り当てる | ブラウザ（Cloudflare とドメイン管理画面） |
| 7 | サイト側の設定ファイルにキーを貼ってアップロード | いつものzip作業 |
| 8 | 動作確認 | ブラウザ |

> **黒い画面（ターミナル）の開き方**
> - Windows: スタートメニューで「PowerShell」と検索して開く
> - Mac: 「ターミナル」アプリを開く（Launchpad → その他）
>
> 以下の `コード` の行は、この黒い画面に1行ずつ貼り付けて Enter を押します。

---

## 手順0. Node.js を入れる（入っていれば飛ばす）

1. https://nodejs.org/ を開き、**LTS** と書かれたボタンからダウンロードしてインストール（全部「次へ」でOK）
2. 黒い画面で次を実行し、`v22.x.x` のような数字が出れば成功

```
node -v
```

## 手順1. Cloudflare のアカウントを作る

1. https://dash.cloudflare.com/sign-up を開いてメールアドレスとパスワードで登録（クレジットカード不要）
2. 届いたメールでアドレスを確認
3. ログインできたら完了。**この時点ではドメインの追加はしなくて大丈夫です**

## 手順2. 準備コマンドを実行する

黒い画面で、このフォルダ（`cloudflare`）に移動します。フォルダをエクスプローラー/Finderで開いて、
そのパスをコピーしておくと楽です。

```
cd （ここに cloudflare フォルダのパスを貼る）
npm install
```

`npm install` は必要な道具を自動で集めるコマンドです。1〜2分かかります。警告（WARN）が出ても問題ありません。

次に Cloudflare にログインします。ブラウザが開くので「Allow」を押してください。

```
npx wrangler login
```

## 手順3. データ置き場を作る

### 3-1. D1（投稿を保存するデータベース）

```
npx wrangler d1 create whitesim-stats
```

すると、次のような表示が出ます。**`database_id` の右側の文字列をコピー**してください。

```
[[d1_databases]]
binding = "DB"
database_name = "whitesim-stats"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   ← これ
```

このフォルダの `wrangler.toml` をメモ帳などで開き、`REPLACE_WITH_D1_DATABASE_ID` をコピーした文字列に置き換えて保存します。

続けて、データベースの中に表を作ります。

```
npx wrangler d1 execute whitesim-stats --remote --file=./schema.sql
```

「Do you want to proceed?」と聞かれたら `y` を押して Enter。

### 3-2. KV（集計結果の置き場）

```
npx wrangler kv namespace create STATS
```

表示された `id = "..."` の文字列をコピーして、`wrangler.toml` の `REPLACE_WITH_KV_NAMESPACE_ID` を置き換えて保存します。

> ここまでで `wrangler.toml` に `REPLACE_WITH_` が残っていなければOKです。

## 手順4. 人間確認（Turnstile）のキーを発行する

ロボットによる連投を防ぐ仕組みです。

1. ブラウザで https://dash.cloudflare.com/ を開く → 左メニューの **Turnstile** → **Add widget（ウィジェットを追加）**
2. 入力内容
   - Widget name: `whitesim-stats`（何でもよい）
   - Hostname（ドメイン）: `whitesim-lab.com`
   - Widget Mode: **Managed** のまま
3. 作成すると **Site Key（サイトキー）** と **Secret Key（シークレットキー）** の2つが表示されます。両方コピーしてメモしておく
4. 黒い画面で、シークレットキーを Worker に登録します（貼り付けても画面に表示されません。そのまま Enter）

```
npx wrangler secret put TURNSTILE_SECRET
```

5. 続けて、IPアドレスを匿名化するための「塩」を登録します。**適当な長い文字列**（例: キーボードを30文字くらいでたらめに叩いたもの）を貼って Enter

```
npx wrangler secret put CLIENT_SALT
```

> サイトキーは手順7で使います。シークレットキーと塩は二度と表示されないので、パスワード管理アプリなどに控えておいてください。

## 手順5. 本番に配置する（デプロイ）

```
npx wrangler deploy
```

最後に `https://whitesim-stats.＜あなたのアカウント名＞.workers.dev` のようなURLが表示されれば成功です。
ブラウザでそのURLの末尾に `/v1/stats/summary` を付けて開くと、`{"updatedAt": ...}` のような文字が表示されます。

## 手順6. `api.whitesim-lab.com` を割り当てる

サイト側は `https://api.whitesim-lab.com` に接続するので、その名前を Worker に向けます。

1. Cloudflare ダッシュボード → **Workers & Pages** → `whitesim-stats` をクリック
2. **Settings** タブ → **Domains & Routes** → **Add** → **Custom Domain**
3. `api.whitesim-lab.com` と入力して Add

ここで2パターンに分かれます。

- **ドメインを Cloudflare で管理している場合**: これで完了です（自動で設定されます）
- **他社（お名前.com など）で管理している場合**: 画面に「CNAME レコードを追加してください」と、追加すべき値が表示されます。
  ドメイン管理画面の DNS 設定で、次の1行を追加してください。
  - 種類: `CNAME`
  - ホスト名: `api`
  - 値: Cloudflare の画面に表示されたもの（`xxxx.workers.dev` のような文字列）

反映まで数分〜1時間ほどかかります。ブラウザで `https://api.whitesim-lab.com/v1/stats/summary` を開いて JSON が表示されれば完了です。

## 手順7. サイト側にサイトキーを貼る

1. サイトのファイル `assets/config.js` をメモ帳などで開く
2. 次の行を探し、`""` の中に手順4でメモした **Site Key（サイトキー）** を貼る

```
window.WOS_TURNSTILE_SITEKEY = "";
```

3. 保存して、いつもどおり GitHub にアップロード

> シークレットキーの方は絶対にここに貼らないでください（サイトキーだけです）。

## 手順8. 動作確認

1. `https://whitesim-lab.com/submit/` を開き、自分の構成を投稿してみる
2. 「投稿ありがとうございます！」のカードが出ればOK
3. 集計は毎日 朝5時（日本時間）に自動で走ります。すぐ確認したい場合は
   Cloudflare ダッシュボード → Workers & Pages → whitesim-stats → **Triggers** タブ → Cron Triggers の **Run now**
4. 10件以上集まった世代のページで「実測」側に数字が入ります

---

## よくあるつまずき

| 症状 | 対処 |
|---|---|
| `npx` や `node` が「見つかりません」と出る | 手順0のインストール後、黒い画面を一度閉じて開き直す |
| `wrangler login` でブラウザが開かない | 表示されたURLを手でコピーしてブラウザに貼る |
| `deploy` で `database_id` のエラー | `wrangler.toml` に `REPLACE_WITH_` が残っている。手順3を確認 |
| 投稿ボタンを押すと「人間確認に失敗」 | Turnstile のドメインが `whitesim-lab.com` になっているか、サイトキーとシークレットキーを取り違えていないか確認 |
| 投稿すると「通信エラー」 | `https://api.whitesim-lab.com/v1/stats/summary` が開けるか確認（手順6の反映待ちの可能性） |
| 「実測」が「準備中」のまま | Worker が動いていないか、まだ投稿が10件未満。summary のURLで件数を確認 |

## 困ったときの逃げ道

サイトのファイル `assets/config.js` の `window.WOS_API = "https://api.whitesim-lab.com";` を
`window.WOS_API = "";` に変えてアップロードすると、実測パートだけが「準備中」表示になり、
理論値のページはそのまま動き続けます。Worker 側で何が起きてもサイトは壊れません。

---

## 日常の運用（セットアップ後）

- 英雄や世代が増えて理論値を作り直したとき（`node _solve_theory.js` を回したとき）は、
  Worker も新しい理論値を使うので、このフォルダで `npx wrangler deploy` をもう一度実行してください
- 動作テスト（Cloudflare に接続せずローカルで検証）: `npm test`

## 中身の説明（読まなくても大丈夫です）

```
wrangler.toml         設定ファイル（D1 / KV の ID を貼る場所）
schema.sql            データベースの表の定義
src/index.js          プログラム本体
src/heroes-min.json   英雄一覧（_solve_theory.js が自動生成。手で編集しない）
test/worker.test.mjs  ローカルテスト
```

| 通信先 | 役割 |
|---|---|
| POST /v1/submit | 投稿を受け付ける。返事に順位・世代ラグ・理論値との差が入る |
| DELETE /v1/submit/:id | 編集キーで自分の投稿を削除 |
| GET /v1/stats/summary | 全世代の投稿件数 |
| GET /v1/stats/:gen | その世代の集計 |
| 毎日 20:00 UTC | 集計して KV に保存 |

無料枠の目安: 1日あたり Workers 10万リクエスト、D1 500万行読み取り、KV 10万読み取り。1日1万PVでも余裕があります。
