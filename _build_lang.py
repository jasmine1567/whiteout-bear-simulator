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
    return "/" + rel

# root html files to process (exclude orphan bear-hunt-index.html)
ROOT_PAGES = ["index.html", "about.html", "privacy.html", "terms.html", "contact.html",
              "recruit.html", "changelog.html"]
ROOT_PAGES += [f"guides/{os.path.basename(p)}" for p in sorted(glob.glob(os.path.join(ROOT, "guides", "*.html")))]
ROOT_PAGES += [f"tools/{d}/index.html" for d in sorted(os.listdir(os.path.join(ROOT, "tools")))
               if os.path.isfile(os.path.join(ROOT, "tools", d, "index.html"))]

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

# ---------- 1. transform root pages in place ----------
for rel in ROOT_PAGES:
    fp = os.path.join(ROOT, rel)
    with open(fp, encoding="utf-8") as f:
        html = f.read()
    jp = clean_path(rel)
    html = transform_common(html, jp)
    html = set_canonical_og(html, BASE_URL + jp)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("root:", rel, "->", jp)

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

for rel in ROOT_PAGES:
    fp = os.path.join(EN, rel)
    if not os.path.exists(fp):
        continue
    with open(fp, encoding="utf-8") as f:
        html = f.read()
    jp = clean_path(rel)
    en_url = BASE_URL + ("/en/" if jp == "/" else "/en" + jp)
    html = set_canonical_og(html, en_url)          # canonical/og -> /en/ variant
    html = html.replace('<html lang="ja"', '<html lang="en"', 1)  # static lang hint
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("en:  ", rel, "->", en_url)

print("DONE. root pages:", len(ROOT_PAGES))
