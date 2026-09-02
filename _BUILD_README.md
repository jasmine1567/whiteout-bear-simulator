# サイト構成メモ（日本語 / 英語の分離について）

AdSense審査対策として、日本語ページと英語ページを **別々のURL** に分離しました。

- 日本語（正規）: `/`, `/about.html`, `/guides/…`, `/tools/…/` など
- 英語: `/en/` 以下に同じ構成をミラー（`/en/`, `/en/about.html`, `/en/guides/…`, `/en/tools/…/`）

## 言語の決まり方

言語は **URLのパスだけ** で決まります（`assets/config.js`）。

- パスが `/en/` で始まる → 英語（`WOS_LANG='en'`, `WOS_BASE='/en'`）
- それ以外 → 日本語

`?lang=en` や localStorage による切替は廃止しました。各ページの `<head>` には
`hreflang`（ja / en / x-default）と、自分自身を指す `canonical` が入っています。
共有アセット（CSS/JS/画像）は常に `/assets/…`、`/favicon…` の **絶対パス** で参照します。

## 編集のしかた（重要）

**編集はリポジトリ直下（日本語側）のファイルだけを直してください。**
`/en/` 以下は下記のビルドで自動生成されるので、直接編集しないでください。

編集後、次の2つを実行すると `/en/` とサイトマップが再生成されます:

```bash
node _solve_theory.js       # 理論最適構成 → assets/theory.json（英雄・世代・課金帯モデルを変えたときだけ）
python3 _build_stats.py     # 統計セクション（stats/, submit/）を生成
python3 _build_lang.py      # ルート各ページを整形し、/en/ ツリーを再生成
python3 _build_sitemap.py   # sitemap.xml（日英+ hreflang）を再生成
```

`stats/` と `submit/` は生成物なので直接編集しないでください。
世代ページの解説文は `_stats_notes/gen-NN.md` に書きます（`_stats_notes/README.md` 参照）。
理論値を変えたら Cloudflare Worker も再デプロイしてください（`cloudflare/README.md`）。

（`_build_lang.py` は何度実行しても同じ結果になります＝冪等です。）

## 共通パーツ

- ナビ・フッター: `assets/toolkit.js`（言語別の絶対パスで生成）
- 記事の著者バイライン（執筆者・公開日・更新日・検証環境）: `assets/toolkit.js` が
  `/guides/…` ページに自動挿入
- ツールの「推定値・検証」注意書き: `assets/toolkit.js` が `/tools/…` ページに自動挿入

## 新規ページを追加するとき

`_build_lang.py` 内の `ROOT_PAGES` と `/en/` コピー対象リスト、
`_build_sitemap.py` の `paths` に、新しいページのパスを追記してください。
