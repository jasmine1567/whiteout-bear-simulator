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
    if rel in SRC and os.path.exists(os.path.join(SRC_DIR, rel)):
        html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + (GEN_NOTE % rel).rstrip("\n"), 1)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("en:  ", rel, "->", en_url)

print("DONE. root pages:", len(ROOT_PAGES))
