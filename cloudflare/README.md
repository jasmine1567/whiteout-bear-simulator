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
| 4 | 人間確認（Turnstile）のキーを発行し、合言葉3つを登録する | ブラウザ → パソコン |
| 5 | 本番に配置する（デプロイ） | パソコン |
| 6 | サイトから Worker への接続先を決める（カスタムドメイン or Worker の URL） | ブラウザ／メモ帳 |
| 7 | サイト側の設定ファイルにキーを貼ってアップロード | いつものzip作業 |
| 8 | 動作確認 | ブラウザ |
| 9 | 口コミの管理画面を確認する | ブラウザ |

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

6. 最後に、口コミ管理画面で使う**合言葉**を登録します。これも適当な長い文字列（塩とは別のもの）を貼って Enter

```
npx wrangler secret put ADMIN_KEY
```

> サイトキーは手順7で、合言葉は手順9で使います。シークレットキー・塩・合言葉は二度と表示されないので、パスワード管理アプリなどに控えておいてください。

## 手順5. 本番に配置する（デプロイ）

```
npx wrangler deploy
```

最後に `https://whitesim-stats.＜あなたのアカウント名＞.workers.dev` のようなURLが表示されれば成功です。
ブラウザでそのURLの末尾に `/v1/stats/summary` を付けて開くと、`{"updatedAt": ...}` のような文字が表示されます。

## 手順6. サイトから Worker への接続先を決める（2通り）

サイト側は既定で `https://api.whitesim-lab.com` に接続します。**Worker のカスタムドメインは、そのドメイン
（`whitesim-lab.com`）が Cloudflare に登録されている場合だけ使えます。** 登録していない場合は B を選んでください。

### A. `whitesim-lab.com` を Cloudflare で管理している（または管理に移す）場合

1. Cloudflare ダッシュボード → **Workers & Pages** → `whitesim-stats` → 上のタブ **ドメイン**
2. **ドメインを追加** → `api.whitesim-lab.com` と入力して追加（DNS と証明書は自動で設定されます）
3. 数分後に `https://api.whitesim-lab.com/v1/stats/summary` が開けば完了。`assets/config.js` はそのままでOK

> ドメインを Cloudflare に移すには、ダッシュボードの「ドメイン」→「ドメインを追加」で `whitesim-lab.com` を登録し、
> 表示されるネームサーバー2つをドメイン会社（お名前.com など）の設定で置き換えます。GitHub Pages 用の既存レコードは
> 自動で取り込まれます（反映まで最大24時間）。急がない・面倒な場合は B で十分です。

### B. ドメインは今のまま、Worker の URL をそのまま使う場合（かんたん）

1. 手順5で表示された Worker の URL（例: `https://whitesim-stats.hiroaki-c51.workers.dev`）をコピー
2. サイトのファイル `assets/config.js` の次の行を、その URL に書き換える（末尾に `/` は付けない）

```
window.WOS_API = "https://whitesim-stats.hiroaki-c51.workers.dev";
```

3. 手順7のサイトキーと一緒にアップロードすれば完了。ページ側の接続許可（CSP）は `*.workers.dev` を含めてあります

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

## 手順9. 口コミの管理画面を確認する

世代ページの「口コミ」欄は、投稿フォームの「ひとこと」を表示します（追加費用なし。統計と同じ D1 を使います）。
通報が3件集まった口コミは自動で非表示になるので、運営者が確認して「戻す／消す」ための管理画面があります。

1. ブラウザで `https://whitesim-lab.com/stats/admin.html` を開く
2. 手順4-6で登録した**合言葉（ADMIN_KEY）**を入れて「読み込む」。口コミの一覧（まだ無ければ「該当する口コミはありません」）が出ればOK
   （合言葉はそのブラウザに保存されます。他の人には教えないでください）
3. 通報が来たときは、上の「通報で非表示中」を選んで内容を確認し、「表示に戻す」か、そのまま非表示にしておく

> **古い schema.sql で手順3を実行済みの場合だけ**、表に列を足してください（初回セットアップなら不要）。
> D1 のコンソール（ストレージとデータベース → D1 → whitesim-stats → コンソール）に貼って実行するのが簡単です。
> - v7 以前で作成 → `migrations/001_reviews.sql` と `migrations/002_show_damage.sql` の両方
> - v8〜v11 で作成 → `migrations/002_show_damage.sql` だけ（1行: `ALTER TABLE submissions ADD COLUMN show_damage INTEGER NOT NULL DEFAULT 1;`）

---

## よくあるつまずき

| 症状 | 対処 |
|---|---|
| `npx` や `node` が「見つかりません」と出る | 手順0のインストール後、黒い画面を一度閉じて開き直す |
| Windows で「このシステムではスクリプトの実行が無効になっているため…npm.ps1 を読み込むことができません」と出る | PowerShell の設定です。`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` を実行して `Y` → もう一度 `npm install`。設定を変えたくない場合は `npm.cmd install` / `npx.cmd wrangler …` のように末尾に `.cmd` を付けて実行 |
| `wrangler login` でブラウザが開かない | 表示されたURLを手でコピーしてブラウザに貼る |
| `deploy` で `database_id` のエラー | `wrangler.toml` に `REPLACE_WITH_` が残っている。手順3を確認 |
| 投稿ボタンを押すと「人間確認に失敗」 | Turnstile のドメインが `whitesim-lab.com` になっているか、サイトキーとシークレットキーを取り違えていないか確認 |
| 投稿すると「通信エラー」 | `assets/config.js` の `WOS_API` の URL に `/v1/stats/summary` を付けてブラウザで開けるか確認（手順6） |
| 「実測」が「準備中」のまま | Worker が動いていないか、まだ投稿が10件未満。summary のURLで件数を確認 |
| 口コミ欄が「読み込めませんでした」 | 手順3の表に口コミ用の列が無い（v7以前の schema で作成）。手順9の枠内のコマンドで列を足す |
| 管理画面で「合言葉が違う」 | 手順4-6の `ADMIN_KEY` が未登録か、登録後に `npx wrangler deploy` していない |
| 投稿すると「使えない言葉が含まれています」 | 組み込みのNGワードに当たっている。増やしたい言葉は `wrangler.toml` の `NG_WORDS` にカンマ区切りで追加して deploy |

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
migrations/           古い表に列を足すためのSQL（v7以前から更新する時だけ）
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
| GET /v1/reviews/:gen | その世代の口コミ（「ひとこと」付き投稿を新しい順・100件まで） |
| POST /v1/report/:id | 口コミを通報（同じ人からは1回。3件で自動非表示） |
| GET/POST /v1/admin/reviews… | 運営者用（ADMIN_KEY）。一覧・非表示・再表示 |
| 毎日 20:00 UTC | 集計して KV に保存 |

無料枠の目安: 1日あたり Workers 10万リクエスト、D1 500万行読み取り、KV 10万読み取り。1日1万PVでも余裕があります。
