#!/usr/bin/env python3
"""Language-separation build: absolute assets, path-based language, hreflang, /en/ mirror."""
import os, re, shutil, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://whitesim-lab.com"

# --- clean canonical path per root html file ---
def clean_path(rel):
    if rel == "index.html":
        return "/"
    m = re.match(r"tools/([^/]+)/index\.html$", rel)
    if m:
        return f"/tools/{m.group(1)}/"
    m = re.match(r"stats/([^/]+)/index\.html$", rel)
    if m:
        return f"/stats/{m.group(1)}/"
    if rel == "stats/index.html":
        return "/stats/"
    if rel == "submit/index.html":
        return "/submit/"
    return "/" + rel

# root html files to process (exclude orphan bear-hunt-index.html)
ROOT_PAGES = ["index.html", "about.html", "privacy.html", "terms.html", "contact.html",
              "recruit.html", "changelog.html"]
# 記事・ツールは _src/ と直下の両方から拾う（_src/ にだけ置いた新ページも生成対象にする）
_guides = sorted({os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "guides", "*.html")) + glob.glob(os.path.join(ROOT, "_src", "guides", "*.html"))})
ROOT_PAGES += [f"guides/{n}" for n in _guides]
_tools = sorted({d for base in (ROOT, os.path.join(ROOT, "_src")) if os.path.isdir(os.path.join(base, "tools"))
                 for d in os.listdir(os.path.join(base, "tools")) if os.path.isfile(os.path.join(base, "tools", d, "index.html"))})
ROOT_PAGES += [f"tools/{d}/index.html" for d in _tools]
# 統計セクション（_build_stats.py が生成）と投稿ページ
if os.path.isdir(os.path.join(ROOT, "stats")):
    ROOT_PAGES += ["stats/index.html", "stats/methodology.html"]
    ROOT_PAGES += [f"stats/{d}/index.html" for d in sorted(os.listdir(os.path.join(ROOT, "stats")))
                   if os.path.isfile(os.path.join(ROOT, "stats", d, "index.html"))]
if os.path.isfile(os.path.join(ROOT, "submit", "index.html")):
    ROOT_PAGES += ["submit/index.html"]

OLD_LANG_SCRIPT = (
    '<script>(function(){try{var l=new URLSearchParams(location.search).get("lang")'
    '||localStorage.getItem("wos_lang")||"ja";if(l!=="en")l="ja";'
    'document.documentElement.setAttribute("data-wos-lang",l);}catch(e){'
    'document.documentElement.setAttribute("data-wos-lang","ja");}})();</script>'
)
NEW_LANG_SCRIPT = (
    '<script>(function(){try{var en=/^\\/en(\\/|$)/.test(location.pathname);'
    'document.documentElement.setAttribute("data-wos-lang",en?"en":"ja");}catch(e){'
    'document.documentElement.setAttribute("data-wos-lang","ja");}})();</script>'
)

HREFLANG_RE = re.compile(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">')

def hreflang_block(ja_path):
    en_path = "/en/" if ja_path == "/" else "/en" + ja_path
    return (
        f'<link rel="alternate" hreflang="ja" href="{BASE_URL}{ja_path}">'
        f'<link rel="alternate" hreflang="en" href="{BASE_URL}{en_path}">'
        f'<link rel="alternate" hreflang="x-default" href="{BASE_URL}{ja_path}">\n'
    )

def absolutize_assets(html):
    # href/src pointing at shared assets or favicons -> root-absolute
    html = re.sub(r'(href|src)="(?:\.\./)*assets/', r'\1="/assets/', html)
    html = re.sub(r'(href|src)="(?:\.\./)*favicon', r'\1="/favicon', html)
    return html

def strip_lang_params(html):
    html = re.sub(r'\?lang=(en|ja)', '', html)
    html = re.sub(r'&(amp;)?lang=(en|ja)', '', html)
    return html

def transform_common(html, ja_path):
    html = html.replace(OLD_LANG_SCRIPT, NEW_LANG_SCRIPT)
    html = strip_lang_params(html)
    html = absolutize_assets(html)
    # strip existing hreflang link tags, then insert fresh block before canonical
    html = HREFLANG_RE.sub("", html)
    block = hreflang_block(ja_path)
    html = re.sub(r'(<link rel="canonical")', block + r'\1', html, count=1)
    return html

def set_canonical_og(html, url):
    html = re.sub(r'(<link rel="canonical" href=")[^"]*(">)', r'\g<1>' + url + r'\g<2>', html, count=1)
    html = re.sub(r'(<meta property="og:url" content=")[^"]*(">)', r'\g<1>' + url + r'\g<2>', html, count=1)
    return html


# ---------- /en/ 内のリンクを英語ツリーに閉じる ----------
# 静的HTML内の href="/tools/..." のようなルート絶対のページリンクは、そのままだと日本語ページへ飛んでしまう。
# 共有アセット(/assets, /favicon*, /sitemap.xml 等)と既に /en/ のものは対象外。
_PAGE_LINK_RE = re.compile(r'href="/(?!en/|en"|assets/|favicon|sitemap|robots|ads\.txt|cloudflare)([^"#?]*)')
_LD_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
def en_prefix_links(html):
    html = _PAGE_LINK_RE.sub(lambda m: 'href="/en/' + m.group(1), html)
    # data-en 属性内(HTMLエスケープ済み)のリンクも同様に
    html = re.sub(r'href=&quot;/(?!en/|assets/|favicon)', 'href=&quot;/en/', html)
    # JSON-LD 内の自サイトURL(パンくず・記事URL)も英語版へ。hreflang/canonical は別途生成しているので触らない。
    def fix_ld(m):
        body = re.sub(r'https://whitesim-lab\.com/(?!en/)', 'https://whitesim-lab.com/en/', m.group(2))
        return m.group(1) + body + m.group(3)
    return _LD_RE.sub(fix_ld, html)

# ---------- 言語純化: 表示しない側の言語ブロックを物理的に取り除く ----------
# 各ページは .i18n-ja/.i18n-en(ブロック) と .i18n-ja-inline/.i18n-en-inline(インライン) で日英を併記し、
# CSS で片方だけ表示している。クローラ視点では「両言語を含む同一ページが2つ」になるため、
# 日本語ページからは英語側、英語ページからは日本語側の要素を削除する(表示は変わらない)。
_OPEN_RE = re.compile(r'<([a-zA-Z][a-zA-Z0-9]*)(\s[^<>]*?)?(/?)>')
def strip_lang(html, lang_to_remove):
    tokens = ('i18n-%s' % lang_to_remove, 'i18n-%s-inline' % lang_to_remove)
    cls_re = re.compile(r'\sclass="([^"]*)"')
    out = []; pos = 0; removed = 0
    while True:
        m = _OPEN_RE.search(html, pos)
        if not m:
            out.append(html[pos:]); break
        tag = m.group(1).lower(); attrs = m.group(2) or ''
        if tag in ('script', 'style'):
            end = html.find('</%s>' % tag, m.end())
            end = len(html) if end < 0 else end
            out.append(html[pos:end]); pos = end; continue
        cm = cls_re.search(attrs)
        if not cm or not any(t in cm.group(1).split() for t in tokens) or m.group(3) == '/':
            out.append(html[pos:m.end()]); pos = m.end(); continue
        # 対応する閉じタグまで同名タグの深さを数えて探す
        depth = 1; i = m.end()
        pair = re.compile(r'<(/?)%s\b[^<>]*?(/?)>' % re.escape(tag), re.I)
        while depth > 0:
            pm = pair.search(html, i)
            if not pm: raise ValueError('unclosed <%s> at %d' % (tag, m.start()))
            if pm.group(1) == '/': depth -= 1
            elif pm.group(2) != '/': depth += 1
            i = pm.end()
        out.append(html[pos:m.start()]); pos = i; removed += 1
    return ''.join(out), removed


# ---------- 英語ページの静的メタ情報 ----------
# 旧来は title/description/h1 を JS が実行時に差し替えていたため、英語ページの静的HTMLは日本語のままだった。
# _src/_en_meta.json の値を <title>, meta description, og:/twitter:, JSON-LD(headline/description), #art-h1 に埋め込む。
_EN_META_PATH = os.path.join(ROOT, "_src", "_en_meta.json")
EN_META = {}
if os.path.exists(_EN_META_PATH):
    import json as _json
    with open(_EN_META_PATH, encoding="utf-8") as f:
        EN_META = {k: v for k, v in _json.load(f).items() if not k.startswith("_")}

def _attr(v):
    return v.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")

_EN_META_INLINE_RE = re.compile(r'<!--EN-META (\{.*?\})-->', re.S)
def apply_en_meta(html, rel):
    m = EN_META.get(rel)
    if not m:
        # 生成ページ(_build_stats.py)は HTML 内の <!--EN-META {...}--> から読む
        mm = _EN_META_INLINE_RE.search(html)
        if not mm:
            return html
        m = _json.loads(mm.group(1)); m["_h1_any"] = True
        html = html.replace(mm.group(0), "")
    t, d, h1 = m.get("title"), m.get("description"), m.get("h1")
    if t:
        html = re.sub(r'(<title[^>]*>)[^<]*(</title>)', lambda x: x.group(1) + _attr(t) + x.group(2), html, count=1)
        html = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda x: x.group(1) + _attr(t) + x.group(2), html, count=1)
        html = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")', lambda x: x.group(1) + _attr(t) + x.group(2), html, count=1)
    if d:
        html = re.sub(r'(<meta name="description"[^>]*content=")[^"]*(")', lambda x: x.group(1) + _attr(d) + x.group(2), html, count=1)
        html = re.sub(r'(<meta property="og:description" content=")[^"]*(")', lambda x: x.group(1) + _attr(d) + x.group(2), html, count=1)
        html = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', lambda x: x.group(1) + _attr(d) + x.group(2), html, count=1)
    # JSON-LD: Article/WebPage の headline と最初の description を英語に
    def fix_ld(mm):
        body = mm.group(2)
        if t:
            body = re.sub(r'"headline":"[^"]*"', '"headline":' + _json.dumps(t.split(" | ")[0], ensure_ascii=False), body, count=1)
        if d:
            body = re.sub(r'"description":"[^"]*"', '"description":' + _json.dumps(d, ensure_ascii=False), body, count=1)
        body = body.replace('"inLanguage":"ja"', '"inLanguage":"en"').replace('"inLanguage": "ja"', '"inLanguage": "en"')
        return mm.group(1) + body + mm.group(3)
    html = _LD_RE.sub(fix_ld, html)
    if m.get("faq"):
        faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in m["faq"]]}
        new_ld = _json.dumps(faq_ld, ensure_ascii=False, separators=(',', ':'))
        html = re.sub(r'(<script type="application/ld\+json">)\{"@context":"https://schema\.org","@type":"FAQPage".*?(</script>)',
                      lambda x: x.group(1) + new_ld + x.group(2), html, count=1, flags=re.S)
    if m.get("lead"):
        html = re.sub(r'(<p class="lead"[^>]*>).*?(</p>)', lambda x: x.group(1) + m["lead"] + x.group(2), html, count=1, flags=re.S)
    if m.get("crumb"):
        html = re.sub(r'(<div class="crumb"[^>]*>).*?(</div>)', lambda x: x.group(1) + m["crumb"] + x.group(2), html, count=1, flags=re.S)
    if h1:
        if 'id="art-h1"' in html:
            # 既に英語の h1 が残っている（bodyen 側に h1 がある）ページは触らない
            html = re.sub(r'(<h1 id="art-h1"[^>]*>)(.*?)(</h1>)',
                          lambda x: x.group(1) + (h1 if _JP_RE.search(x.group(2)) else x.group(2)) + x.group(3), html, count=1, flags=re.S)
        elif m.get("_h1_any"):
            html = re.sub(r'(<h1(?:\s[^>]*)?>).*?(</h1>)', lambda x: x.group(1) + h1 + x.group(2), html, count=1, flags=re.S)
    return html

# ---------- #bodyja / #bodyen 方式（記事・運営ページ）の言語純化 ----------
def strip_body_lang(html, lang_to_remove):
    """<div id="bodyja">…</div> / <div id="bodyen" style="display:none">…</div> のうち、表示しない側を削除する。"""
    target = "bodyja" if lang_to_remove == "ja" else "bodyen"
    m = re.search(r'<div id="%s"[^>]*>' % target, html)
    if not m:
        return html, 0
    depth = 1; i = m.end()
    pair = re.compile(r'<(/?)div\b[^<>]*?(/?)>', re.I)
    while depth > 0:
        pm = pair.search(html, i)
        if not pm: raise ValueError('unclosed #%s' % target)
        if pm.group(1) == '/': depth -= 1
        elif pm.group(2) != '/': depth += 1
        i = pm.end()
    html = html[:m.start()] + html[i:]
    keep = "bodyen" if lang_to_remove == "ja" else "bodyja"
    # 残った本文を最初から表示状態にする（JS に頼らない）
    html = re.sub(r'(<div id="%s")\s+style="display:\s*none"' % keep, r'\1', html, count=1)
    # 「#body に JS でコピーする」方式のページは、残った本文を #body に直接入れて元ブロックを消す
    if re.search(r'<div id="body">\s*</div>', html):
        km = re.search(r'<div id="%s"[^>]*>' % keep, html)
        if km:
            kc = _find_close(html, km.end(), "div")
            if kc:
                inner = html[km.end():kc[0]]
                html = html[:km.start()] + html[kc[1]:]
                html = re.sub(r'<div id="body">\s*</div>', lambda x: '<div id="body">' + inner + '</div>', html, count=1)
    return html, 1


# ---------- TR辞書方式（_build_stats.py 生成ページ）の静的翻訳 ----------
# 生成ページは日本語HTML＋JSの TR 辞書で実行時に英語化していた。英語ミラーでは同じ規則をビルド時に適用し、
# 静的HTMLの段階で英語にしておく（実行時の翻訳はそのまま残るが、英語化済みテキストには何もしない）。
_JP_RE = re.compile(r'[ぁ-ゖァ-ヶ一-龯]')
_TR_DICT_RE = re.compile(r'var TR = (\{.*?\});\n', re.S)
_HERO_EN = None
def hero_en_map():
    global _HERO_EN
    if _HERO_EN is None:
        _HERO_EN = {}
        try:
            with open(os.path.join(ROOT, "assets", "heroes.js"), encoding="utf-8") as f:
                m = re.search(r'window\.WOS_HERO_EN\s*=\s*(\{.*?\});', f.read(), re.S)
            if m: _HERO_EN = _json.loads(m.group(1))
        except Exception:
            _HERO_EN = {}
    return _HERO_EN

def _find_close(html, pos, tag):
    """pos = 開始タグ直後。同名タグの深さを数えて対応する閉じタグの開始位置と終了位置を返す"""
    depth = 1; i = pos
    pair = re.compile(r'<(/?)%s\b[^<>]*?(/?)>' % re.escape(tag), re.I)
    while depth > 0:
        pm = pair.search(html, i)
        if not pm: return None
        if pm.group(1) == '/': depth -= 1
        elif pm.group(2) != '/': depth += 1
        i = pm.end()
    return pm.start(), pm.end()

def static_translate_en(html):
    m = _TR_DICT_RE.search(html)
    if not m:
        return html
    TR = _json.loads(m.group(1))
    def tr(sv):
        k = " ".join(sv.split())
        if not k: return sv
        if k in TR: return sv.replace(k, TR[k])
        mm = re.match(r'^((?:[^぀-ヿ一-龯]*?\s)?)(.+?)(\s→)?$', k)
        if mm and mm.group(2) in TR: return sv.replace(mm.group(2), TR[mm.group(2)])
        return sv
    # 1) data-en: 要素の中身を英語HTMLに置換（入れ子の span を考慮）
    out = []; pos = 0
    for om in re.finditer(r'<(span|li|p|div|h[1-6]|td|th)\b[^<>]*\sdata-en="([^"]*)"[^<>]*>', html):
        if om.start() < pos: continue
        cl = _find_close(html, om.end(), om.group(1))
        if not cl: continue
        out.append(html[pos:om.end()]); out.append(_html_unescape(om.group(2))); pos = cl[0]
    out.append(html[pos:]); html = ''.join(out)
    # 2) data-title-en / data-aria-en
    html = re.sub(r'title="[^"]*"(\s[^<>]*?)data-title-en="([^"]*)"', r'title="\2"\1data-title-en="\2"', html)
    html = re.sub(r'aria-label="[^"]*"(\s[^<>]*?)data-aria-en="([^"]*)"', r'aria-label="\2"\1data-aria-en="\2"', html)
    # 3) 英雄名 (data-hero): 名前テキストだけ英語に
    HE = hero_en_map()
    def hero_sub(mm):
        hid = mm.group(1); inner = mm.group(2)
        en = HE.get(hid)
        if not en: return mm.group(0)
        inner2 = re.sub(r'(</span>)?([^<]*[ぁ-ゖァ-ヶ一-龯][^<]*)(<span class="g">|$)',
                        lambda x: (x.group(1) or '') + en + x.group(3), inner, count=1)
        return mm.group(0).replace(inner, inner2, 1)
    html = re.sub(r'<span(?: class="[^"]*")? data-hero="([a-z0-9_-]+)"(?: class="[^"]*")?>((?:<span class="cls">[^<]*</span>)?[^<]*(?:<span class="g">[^<]*</span>)?)</span>', hero_sub, html)
    # 3b) JSON-LD（FAQ の質問・回答など）の文字列値も辞書で英語化
    def ld_walk(v):
        if isinstance(v, str): return tr(v) if _JP_RE.search(v) else v
        if isinstance(v, list): return [ld_walk(x) for x in v]
        if isinstance(v, dict): return {k: ld_walk(x) for k, x in v.items()}
        return v
    def ld_tr(mm):
        try: obj = _json.loads(mm.group(2))
        except Exception: return mm.group(0)
        return mm.group(1) + _json.dumps(ld_walk(obj), ensure_ascii=False, separators=(',', ':')) + mm.group(3)
    html = _LD_RE.sub(ld_tr, html)
    # 4) テキストノード: script/style の外側だけ、日本語を含むものを辞書で置換
    parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->|<[^>]+>)', html, flags=re.S)
    for i in range(0, len(parts), 2):
        t = parts[i]
        if t and _JP_RE.search(t): parts[i] = tr(t)
    return ''.join(parts)

import html as _htmlmod
def _html_unescape(v): return _htmlmod.unescape(v)

# ---------- 1. transform root pages in place ----------
# 日英併記の原本は _src/ に置く(GitHub Pages は _ 始まりのディレクトリを公開しない)。
# _src/ に無いページ(_build_stats.py が生成する stats/ submit/ など)はルートのファイルを原本として扱う。
SRC_DIR = os.path.join(ROOT, "_src")
GEN_NOTE = "<!-- generated by _build_lang.py from _src/%s — edit the file in _src/, not this one -->\n"
SRC = {}   # rel -> 両言語入りHTML(英語ミラーの元)
for rel in ROOT_PAGES:
    fp = os.path.join(ROOT, rel)
    sp = os.path.join(SRC_DIR, rel)
    with open(sp if os.path.exists(sp) else fp, encoding="utf-8") as f:
        html = f.read()
    html = re.sub(r'^<!-- generated by _build_lang\.py[^\n]*\n', '', html)
    jp = clean_path(rel)
    html = transform_common(html, jp)
    html = set_canonical_og(html, BASE_URL + jp)
    # 日本語ページ: 英語ブロックを除去する前に、英語ミラー用の原本(両言語入り)を保持
    SRC[rel] = html
    html, n_en = strip_lang(html, "en")
    html, _ = strip_body_lang(html, "en")
    # 生成ページの <!--EN-META--> コメントは、_build_lang.py を単独で再実行しても英語版を作れるよう日本語側にも残す
    if os.path.exists(sp):
        html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + (GEN_NOTE % rel).rstrip("\n"), 1)
    os.makedirs(os.path.dirname(fp) or ROOT, exist_ok=True)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("root:", rel, "->", jp, f"(-{n_en} en blocks)")

# ---------- 2. build /en/ mirror ----------
EN = os.path.join(ROOT, "en")
if os.path.exists(EN):
    shutil.rmtree(EN)
os.makedirs(EN)
# copy page dirs/files (NOT assets/favicons/sitemap/etc - shared at root, referenced absolutely)
for name in ["about.html", "privacy.html", "terms.html", "contact.html", "index.html",
             "recruit.html", "changelog.html"]:
    shutil.copy2(os.path.join(ROOT, name), os.path.join(EN, name))
shutil.copytree(os.path.join(ROOT, "guides"), os.path.join(EN, "guides"))
shutil.copytree(os.path.join(ROOT, "tools"), os.path.join(EN, "tools"))
for d in ["stats", "submit"]:
    if os.path.isdir(os.path.join(ROOT, d)):
        shutil.copytree(os.path.join(ROOT, d), os.path.join(EN, d))

for rel in ROOT_PAGES:
    fp = os.path.join(EN, rel)
    if not os.path.exists(fp):
        continue
    html = SRC.get(rel)
    if html is None:
        with open(fp, encoding="utf-8") as f:
            html = f.read()
    jp = clean_path(rel)
    en_url = BASE_URL + ("/en/" if jp == "/" else "/en" + jp)
    html = set_canonical_og(html, en_url)          # canonical/og -> /en/ variant
    html = html.replace('<html lang="ja"', '<html lang="en"', 1)  # static lang hint
    html = en_prefix_links(html)                    # ルート絶対のページリンクを /en/ 配下へ
    html, n_ja = strip_lang(html, "ja")             # 英語ページ: 日本語ブロックを除去
    html, _ = strip_body_lang(html, "ja")           # 記事・運営ページの #bodyja を除去
    html = apply_en_meta(html, rel)                 # title / description / h1 を静的に英語へ
    html = static_translate_en(html)                # TR辞書方式のページを静的に英語化
    if rel in SRC and os.path.exists(os.path.join(SRC_DIR, rel)):
        html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + (GEN_NOTE % rel).rstrip("\n"), 1)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("en:  ", rel, "->", en_url)

print("DONE. root pages:", len(ROOT_PAGES))
