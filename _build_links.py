#!/usr/bin/env python3
"""サイト内リンクの「…/index.html」を「…/」にそろえる（必ずビルドの最後に実行）。
canonical は「…/」なのにリンクが index.html を指していると、Google が index.html 側を正規URLに選んでしまい
Search Console に「重複しています。Google により、ユーザーがマークしたページとは異なるページが正規ページとして選択されました」と出る。
使い方: python3 _build_links.py   （_build_stats.py → _build_lang.py → _build_sitemap.py のあと）"""
import os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP = {"node_modules", "cloudflare", ".git"}
PAT = re.compile(r'(<a\b[^>]*?\bhref=")([^"#?]*?)index\.html([#?][^"]*)?(")', re.I)
PAT2 = re.compile(r'''(<a\b[^>'"]*?\bhref=")([^"'#?]*?)index\.html(')''', re.I)
def fix(m):
    pre = m.group(2)
    if re.match(r"^[a-z]+:", pre) and "whitesim-lab.com" not in pre: return m.group(0)      # 外部サイトはそのまま
    return m.group(1) + (pre or "./") + (m.group(3) or "") + m.group(4)
n = 0
for d, dirs, files in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in SKIP and not x.startswith("_") and not x.startswith(".")]
    for f in files:
        if not f.endswith(".html"): continue
        p = os.path.join(d, f); s = open(p, encoding="utf-8").read(); t = PAT.sub(fix, s)
        t = PAT2.sub(lambda m: m.group(1) + (m.group(2) or './') + m.group(3), t)      # ページ内スクリプトが組み立てるリンク
        if f != 'bear-hunt-index.html': t = t.replace('/index.html', '/')      # スクリプトや構造化データの中のリンクも同じ形に
        if t != s: open(p, "w", encoding="utf-8").write(t); n += 1
print("links normalized in", n, "files")
