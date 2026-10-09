#!/usr/bin/env python3
"""表示の「あと差し込み」を減らす: スクリプトが読み込み後に差し込んでいた飾りを、公開HTMLに直接書き込む。
  1) 記事・ツール冒頭の見出し画像（.kv）
  2) 攻略ガイドの解説枠（.callout → グレッグの解説）
  3) 絵文字 → 線画アイコン（Material Symbols の SVG）
スクリプト側（assets/hero-img.js, assets/toolkit.js）は「すでにあれば何もしない」ので、二重にはならない。
使い方: python3 _build_static.py   （_build_stats.py → _build_lang.py → _build_sitemap.py → これ → _build_links.py）
対応表を変えるときは、ここの KV と assets/hero-img.js の KV の両方を直す。"""
import json, os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIRS = {"node_modules", "cloudflare", ".git"}
KV = {"guides/bear-hunt-guide.html": "bear", "guides/beginner-faq.html": "welcome", "guides/common-myths.html": "training", "guides/damage-not-growing.html": "doctor",
      "guides/f2p-damage.html": "supplies", "guides/how-to-use.html": "ship", "guides/leader-formation.html": "charge", "guides/left-hero.html": "shield",
      "guides/light-spender.html": "treasure", "guides/troop-ratio.html": "mixing",
      "tools/hero-list/index.html": "heroes", "tools/left-hero/index.html": "shield", "tools/troop-ratio/index.html": "mixing", "tools/damage-doctor/index.html": "doctor",
      "tools/foundry-battle/index.html": "foundry", "tools/commander-type/index.html": "raiders", "stats/index.html": "bear", "stats/methodology.html": "builder",
      "recruit.html": "board", "about.html": "welcome"}
XV = "130"   # グレッグ画像の版数（assets/hero-img.js の XV と同じ）

# ---- 絵文字 → アイコン（対応表とパスは toolkit.js から読む） ----
tk = open(os.path.join(ROOT, "assets", "toolkit.js"), encoding="utf-8").read()
m = re.search(r"var D = document, MAP = (\{.*?\}), PATH = (\{.*?\});", tk, re.S)
EMO, PATH = json.loads(m.group(1)), json.loads(m.group(2))
DOT = {"\U0001F535": "#3b82f6", "\U0001F7E0": "#f08a24", "\U0001F7E3": "#8b5cf6", "⚪": "#c3c8d6"}
TONE = {"check_circle": "#1f9d57", "cancel": "#d93025", "warning": "#d97706"}
keys = sorted(list(EMO) + list(DOT), key=len, reverse=True)
EMO_RE = re.compile("(" + "|".join(map(re.escape, keys)) + ")️?[ 　]*")
def icon(k):
    if k in DOT: return '<span class="ei" style="display:inline-block;width:.6em;height:.6em;border-radius:50%%;vertical-align:.08em;margin-right:.3em;background:%s"></span>' % DOT[k]
    n = EMO.get(k)
    if not n: return ""
    return ('<svg viewBox="0 -960 960 960" aria-hidden="true" class="ei" style="width:1.15em;height:1.15em;flex:none;display:inline-block;vertical-align:-.2em;margin-right:.2em;fill:%s"><path d="%s"/></svg>'
            % (TONE.get(n, "currentColor"), PATH[n]))
RAW = ("script", "style", "textarea", "select", "title", "noscript", "code", "pre", "svg")
TOK = re.compile(r"<!--.*?-->|<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>", re.S)
def emoji_to_icons(html):
    out, pos, skip = [], 0, None
    for t in TOK.finditer(html):
        text = html[pos:t.start()]
        out.append(text if skip else EMO_RE.sub(lambda x: icon(x.group(1)), text))
        out.append(t.group(0)); pos = t.end()
        if t.group(2):
            name = t.group(2).lower()
            if skip is None and not t.group(1) and name in RAW and not t.group(0).endswith("/>"): skip = name
            elif skip and t.group(1) and name == skip: skip = None
    tail = html[pos:]; out.append(tail if skip else EMO_RE.sub(lambda x: icon(x.group(1)), tail))
    return "".join(out)

# ---- 見出し画像 ----
def add_kv(html, name):
    if 'class="kv"' in html: return html
    fig = '\n<figure class="kv"><img src="/assets/kv/%s.webp?v=1" alt="" width="1000" height="500" decoding="async"></figure>' % name
    b = html.find("<body"); m = re.compile(r'<p class="lead"[^>]*>.*?</p>', re.S).search(html, b) or re.compile(r"</h1>").search(html, b)
    return html if not m else html[:m.end()] + fig + html[m.end():]

# ---- グレッグの解説枠 ----
OPEN = re.compile(r'<div class="callout(?: (?:tip|info|point))?">')
DIVS = re.compile(r"<div\b|</div>")
LEAD_EMO = re.compile(r"^(\s*(?:<(?:b|strong)>\s*)?)(?:[←-⯿〰〽㊗㊙\U0001F000-\U0001FAFF])[️‍]*\s*")
def add_greg(html, en):
    out, pos = [], 0
    while True:
        m = OPEN.search(html, pos)
        if not m: break
        depth, end = 1, None
        for d in DIVS.finditer(html, m.end()):
            depth += 1 if d.group(0) != "</div>" else -1
            if depth == 0: end = d; break
        if end is None: break
        inner = html[m.end():end.start()]
        if len(re.sub(r"<[^>]+>", "", inner)) < 30: out.append(html[pos:end.end()]); pos = end.end(); continue
        inner = re.sub(r'^\s*<span class="ico">[^<]*</span>', "", inner); inner = LEAD_EMO.sub(r"\1", inner)
        out.append(html[pos:m.start()])
        out.append('<div class="%s greg-says"><img class="gs-pic" src="/assets/img/greg-bust.webp?v=%s" alt="" loading="lazy" decoding="async" width="422" height="300">'
                   '<div class="gs-body"><span class="gs-tag no-hero-ico">%s</span><div class="gs-txt">%s</div></div></div>'
                   % (m.group(0)[12:-2], XV, "GREG'S NOTE" if en else "グレッグの解説", inner))
        pos = end.end()
    out.append(html[pos:]); return "".join(out)

n = 0
for d, dirs, files in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith("_") and not x.startswith(".")]
    for f in files:
        if not f.endswith(".html"): continue
        p = os.path.join(d, f); rel = os.path.relpath(p, ROOT).replace(os.sep, "/"); en = rel.startswith("en/"); key = rel[3:] if en else rel
        s = open(p, encoding="utf-8").read(); t = s
        if key in KV: t = add_kv(t, KV[key])
        if key.startswith("guides/") and "greg-says" not in t: t = add_greg(t, en)
        t = emoji_to_icons(t)
        if t != s: open(p, "w", encoding="utf-8").write(t); n += 1
print("static decorations written to", n, "files")
