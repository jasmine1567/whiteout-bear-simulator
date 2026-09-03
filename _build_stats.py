#!/usr/bin/env python3
"""統計セクションのページ生成
   入力: assets/theory.json（node _solve_theory.js の出力）, assets/heroes.js, assets/gen-map.js, assets/hero-posts.js,
         _stats_notes/gen-NN.md（任意・手書きの「ポイント」）, _stats_notes/heroes/<id>.md（任意・手書きの英雄評価）
   出力: stats/index.html, stats/gen-01..16/index.html, stats/methodology.html, submit/index.html
   実行順: node _solve_theory.js → python3 _build_stats.py → python3 _build_lang.py → python3 _build_sitemap.py
"""
import os, re, json, html, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://whitesim-lab.com"
V = "103"            # 共有アセットの版数
HV = "86"           # heroes.js の版数
UPDATED = "2026-09-03"
NOTES_DIR = os.path.join(ROOT, "_stats_notes")
DEFAULT_TIER = "whale"   # 理論側のデフォルト表示（石油王）

theory = json.load(open(os.path.join(ROOT, "assets/theory.json"), encoding="utf-8"))
GENS = sorted(int(g) for g in theory["gens"])
MAXG = max(GENS)
TIERS = theory["tiers"]
TIER_KEYS = [t["key"] for t in TIERS]
TIER_BY = {t["key"]: t for t in TIERS}

_dump = subprocess.run(["node", "-e", """
const fs=require('fs'),vm=require('vm');const sb={console};sb.window=sb;vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/heroes.js','utf8'),sb);
const GM=require('./assets/gen-map.js'), HP=require('./assets/hero-posts.js');
const H=sb.window.WOS_HEROES.map(h=>({id:h.id,name:h.name,en:(sb.window.WOS_HERO_EN||{})[h.id]||h.id,cls:h.cls,gen:h.gen,rar:h.rar,acq:GM.acqOf(h),
  leader:h.leader?h.leader.label:null, joiner:h.joiner?h.joiner.label:null, bearNoEffect:!!h.bearNoEffect, post:HP.url(h.id), search:HP.searchUrl(h.name), wiki:HP.wikiUrl(h),
  routes:GM.acqRoutes(h,false), routesEn:GM.acqRoutes(h,true)}));
console.log(JSON.stringify({heroes:H,unlock:GM.UNLOCK,tiers:GM.TIERS,skillEn:sb.window.WOS_SKILL_EN||{}}));
"""], cwd=ROOT, capture_output=True, text=True, check=True)
_d = json.loads(_dump.stdout)
HEROES = {h["id"]: h for h in _d["heroes"]}
UNLOCK = _d["unlock"]; TIERDEF = _d["tiers"]; SKILL_EN = _d["skillEn"]

CLS = ["inf", "lan", "mks"]
CLS_JA = {"inf": "盾", "lan": "槍", "mks": "弓"}
CLS_EN = {"inf": "INF", "lan": "LAN", "mks": "MKS"}
# 入手経路のバッジ表示（各世代3体＝ルーレット／イベント（デイリー割引・氷原支配者・最強王国・英雄集結）／英雄殿堂。出典: アルテマ「英雄の入手先まとめ」）
ACQ_JA = {"roulette": "ルーレット", "event": "デイリー割引・氷原支配者ほか", "hall": "英雄殿堂", "paid": "課金限定", "login": "ログイン配布", "common": "常設"}
ACQ_EN = {"roulette": "Lucky Wheel", "event": "Daily Deals / Frostfield Ruler etc.", "hall": "Hall of Heroes", "paid": "Paid only", "login": "Login reward", "common": "Permanent"}

class Tr:
    def __init__(self): self.m = {"盾": "INF", "槍": "LAN", "弓": "MKS"}
    def __call__(self, ja, en): self.m[ja] = en; return ja
    def script(self): return json.dumps(self.m, ensure_ascii=False)

def esc(s): return html.escape(str(s), quote=True)
def hero_html(hid, with_cls=False):
    h = HEROES[hid]
    cls = f'<span class="cls">{CLS_JA[h["cls"]]}</span>' if with_cls else ""
    return f'<span data-hero="{hid}">{cls}{esc(h["name"])}<span class="g">G{h["gen"]}</span></span>'
def gen_dir(g): return f"gen-{g:02d}"
def cls_badge(c): return f'<span class="hc-cls {c}">{CLS_JA[c]}</span>'

# ---------------- 共通の頭と尻 ----------------
GA = """<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Y8YMCVQDMG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','GB','CH','IS','LI','NO']});
  gtag('js', new Date());
  gtag('config', 'G-Y8YMCVQDMG');
</script>"""
CSP = ("default-src 'self'; "
       "connect-src 'self' https://api.whitesim-lab.com https://*.workers.dev https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.google-analytics.com; "
       "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://platform.twitter.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://www.googletagmanager.com; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; "
       "frame-src https://challenges.cloudflare.com https://platform.twitter.com https://syndication.twitter.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'none'")

def jsonld(objs):
    return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False, separators=(",", ":"))}</script>' for o in objs)

def ld_article(headline, desc, path, published):
    return {"@context": "https://schema.org", "@type": "Article", "headline": headline, "description": desc,
            "image": f"{BASE_URL}/favicon.png?v=85",
            "author": {"@type": "Person", "name": "じゃすみん", "url": f"{BASE_URL}/about.html"},
            "publisher": {"@type": "Organization", "name": "ホワサバ ツールラボ", "logo": {"@type": "ImageObject", "url": f"{BASE_URL}/favicon.png?v=85"}},
            "datePublished": published, "dateModified": UPDATED,
            "mainEntityOfPage": {"@type": "WebPage", "@id": f"{BASE_URL}{path}"}, "inLanguage": "ja"}

def ld_crumbs(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": f"{BASE_URL}{p}"} for i, (n, p) in enumerate(items)]}

def ld_faq(qas):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qas]}

def head(title_ja, desc_ja, path, ld=""):
    return f"""<!DOCTYPE html>
<html lang="ja" id="htmlroot">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&display=swap" rel="stylesheet">
{GA}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title_ja)}</title>
<meta name="description" content="{esc(desc_ja)}">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<link rel="stylesheet" href="/assets/site.css?v={V}">
<link rel="stylesheet" href="/assets/stats.css?v={V}">
<script>(function(){{try{{var en=/^\\/en(\\/|$)/.test(location.pathname);document.documentElement.setAttribute("data-wos-lang",en?"en":"ja");}}catch(e){{document.documentElement.setAttribute("data-wos-lang","ja");}}}})();</script>
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=85">
<link rel="icon" type="image/png" href="/favicon.png?v=85">
<link rel="shortcut icon" href="/favicon.ico?v=85">
<link rel="apple-touch-icon" href="/favicon.png?v=85">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ホワサバ ツールラボ">
<meta property="og:title" content="{esc(title_ja)}">
<meta property="og:description" content="{esc(desc_ja)}">
<meta property="og:url" content="{BASE_URL}{path}">
<meta property="og:image" content="{BASE_URL}/favicon.png?v=85">
<meta name="twitter:card" content="summary">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4593324513914979" crossorigin="anonymous"></script>
<link rel="canonical" href="{BASE_URL}{path}">
{ld}
</head>
<body>
<div id="nav"></div>
"""

def tail(tr, title_en, crumb_en, h1_en, lead_en, extra_js="", desc_en=""):
    desc_js = f'var md=q("meta[name=description]"); if(md) md.setAttribute("content", {json.dumps(desc_en, ensure_ascii=False)});' if desc_en else ""
    return f"""<div id="foot"></div>
<script src="/assets/config.js?v={V}"></script>
<script src="/assets/toolkit.js?v={V}"></script>
<script src="/assets/heroes.js?v={HV}"></script>
<script src="/assets/gen-map.js?v={V}"></script>
<script src="/assets/hero-posts.js?v={V}"></script>
<script src="/assets/stats.js?v={V}"></script>
<script>
document.getElementById('nav').innerHTML = WOS_NAV(2);
document.getElementById('foot').innerHTML = WOS_FOOT(2);
var ub=document.getElementById('updbox'); if(ub) ub.innerHTML = WOS_UPDATEBOX({{date:'{UPDATED}',gen:{MAXG},note:'世代別ページを全面改修（理想の英雄構成・FAQ）',note_en:'Generation pages reworked (ideal build, FAQ)'}});
{extra_js}
</script>
<script>
window.addEventListener("DOMContentLoaded", function() {{
  if ((window.WOS_LANG || "ja") !== "en") return;
  var q = function(s) {{ return document.querySelector(s); }};
  document.getElementById("htmlroot").lang = "en";
  document.title = {json.dumps(title_en, ensure_ascii=False)};
  {desc_js}
  if (q("h1")) q("h1").innerHTML = {json.dumps(h1_en, ensure_ascii=False)};
  if (q(".lead")) q(".lead").innerHTML = {json.dumps(lead_en, ensure_ascii=False)};
  var TR = {tr.script()};
  function tr(s) {{ var k = s.replace(/\\s+/g, " ").trim(); if (TR[k] != null) return s.replace(k, TR[k]);
    var m = k.match(/^((?:[^\\u3040-\\u30ff\\u4e00-\\u9faf]*?\\s)?)(.+?)(\\s→)?$/); if (!m) return s; var kk = m[2]; return TR[kk] != null ? s.replace(kk, TR[kk]) : s; }}
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  var nodes = [], n;
  while (n = w.nextNode()) nodes.push(n);
  nodes.forEach(function(node) {{
    var v = node.nodeValue; if (!v || !v.trim()) return;
    if (!/[\\u3041-\\u3096\\u30a1-\\u30f6\\u4e00-\\u9faf]/.test(v)) return;
    node.nodeValue = tr(v);
  }});
  document.querySelectorAll("[data-en]").forEach(function(el){{ el.innerHTML = el.getAttribute("data-en"); }});
  if (window.WOS_STATS && WOS_STATS.relabelHeroes) WOS_STATS.relabelHeroes();
  var crumb = document.querySelector(".crumb");
  if (crumb) crumb.innerHTML = {json.dumps(crumb_en, ensure_ascii=False)};
}});
</script></body>
</html>
"""

# ---------------- 部品 ----------------
def gen_strip(cur):
    return '<div class="gen-strip">' + "".join(
        f'<a href="/stats/{gen_dir(g)}/index.html"{" class=on" if g == cur else ""}>G{g}</a>' for g in GENS) + '</div>'

def bi(ja, en):
    """静的HTMLの日英切替: 日本語を表示し、英語ページでは data-en に置き換える（TR辞書に頼らない自由文用）"""
    return f'<span data-en="{esc(en)}">{ja}</span>'

def read_md(path):
    if not os.path.exists(path): return None, None
    raw = open(path, encoding="utf-8").read()
    ja, _, en = raw.partition("\n---en---\n")
    def md(s):
        s = s.strip()
        if not s: return None
        blocks, cur = [], []
        for line in s.split("\n"):
            if line.strip().startswith("- "):
                cur.append("<li>" + re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", esc(line.strip()[2:])) + "</li>")
            else:
                if cur: blocks.append("<ul>" + "".join(cur) + "</ul>"); cur = []
                if line.strip(): blocks.append("<p>" + re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", esc(line.strip())) + "</p>")
        if cur: blocks.append("<ul>" + "".join(cur) + "</ul>")
        return "".join(blocks)
    return md(ja), md(en)

# ---------------- 英雄の熊狩評価（データから自動生成・手書きで上書き可） ----------------
def hero_eval(hid, g):
    """(判定クラス, 判定ラベルja, en, 箇条書き[(ja,en)...])"""
    h = HEROES[hid]; rec = theory["heroes"].get(hid, {})
    ranks = rec.get("ranks", {}).get(str(g), {})
    items = []
    # 1) 第1遠征スキル
    if h["bearNoEffect"]:
        items.append(("集結主スキル：<b>熊狩では効果なし</b>", "Leader skill: <b>no effect in Bear Hunt</b>"))
    elif not h["leader"]:
        items.append(("集結主スキル：<b>データ未登録</b>（理論順位は遠征ステータスのみで計算）", "Leader skill: <b>not yet registered</b> (theoretical rank uses expedition stats only)"))
    else:
        items.append((f"集結主スキル：{esc(h['leader'])}", f"Leader skill: {esc(SKILL_EN.get(h['leader'], h['leader']))}"))
    if h["joiner"] and not h["bearNoEffect"]:
        items.append((f"乗り（参加者）スキル：{esc(h['joiner'])}", f"Joiner skill: {esc(SKILL_EN.get(h['joiner'], h['joiner']))}"))
    # 2) 理論順位（自分の世代環境）
    def pill(tk):
        r = ranks.get(tk)
        if not r: return None
        return f'<span class="rank-pill">{TIER_BY[tk]["label"]} {r["rank"]}位/{r["of"]}</span>', f'<span class="rank-pill">{TIER_BY[tk]["label_en"]} #{r["rank"]}/{r["of"]}</span>'
    pills = [p for p in (pill(tk) for tk in TIER_KEYS) if p]
    if pills:
        items.append((f"{CLS_JA[h['cls']]}枠の理論順位（第{g}世代環境）：" + " ".join(p[0] for p in pills),
                      f"Theoretical rank in {CLS_EN[h['cls']]} slot (Gen {g}): " + " ".join(p[1] for p in pills)))
    # 3) 何世代まで1位を保つか（石油王）
    streak = 0
    for gg in range(g, MAXG + 1):
        r = rec.get("ranks", {}).get(str(gg), {}).get("whale")
        if r and r["rank"] == 1: streak += 1
        else: break
    if streak >= 2:
        last = g + streak - 1
        items.append((f"石油王の理論1位を<b>第{last}世代まで維持</b>（{streak}世代）", f"Stays #1 for whales <b>through Gen {last}</b> ({streak} generations)"))
    # 4) 入手
    items.append((f"入手：{esc('、'.join(h['routes']))}" + ("（無課金でも入手可）" if h["acq"] == "roulette" else "（課金限定・無課金は不可）" if h["acq"] == "paid" else ""),
                  f"Source: {esc(', '.join(h['routesEn']))}" + (" (F2P-obtainable)" if h["acq"] == "roulette" else " (paid only)" if h["acq"] == "paid" else "")))
    # 判定
    wr = ranks.get("whale") or {}
    fr = ranks.get("f2p") or {}
    if h["bearNoEffect"]:
        v = ("v4", "熊狩では不要", "Not for Bear Hunt")
    elif not h["leader"]:
        v = ("v5", "評価保留（スキル未登録）", "Pending (skill data missing)")
    elif wr.get("rank") == 1 or fr.get("rank") == 1:
        v = ("v1", "乗り換え推奨", "Swap in")
    elif (wr.get("rank") or 99) <= 3 or (fr.get("rank") or 99) <= 3:
        v = ("v2", "有力候補", "Strong option")
    else:
        v = ("v3", "据え置きで可", "Keep current hero")
    # 手書き上書き
    nj, ne = read_md(os.path.join(NOTES_DIR, "heroes", f"{hid}.md"))
    return v, items, (nj, ne)

def hero_card(hid, g, tr):
    h = HEROES[hid]
    (vc, vja, ven), items, (nj, ne) = hero_eval(hid, g)
    wiki = f'<a class="hc-wiki" href="{h["wiki"]}" target="_blank" rel="noopener">📖 {tr("公式wikiで見る","Official wiki")}</a>'
    if h["post"]:
        x = (f'<blockquote class="twitter-tweet" data-lang="ja" data-dnt="true"><a href="{h["post"]}">'
             f'{tr("公式X（@WOS_Japan）の英雄紹介を読み込み中…","Loading the official @WOS_Japan post…")}</a></blockquote>{wiki}')
    else:
        x = (f'<a class="hc-xlink" href="{h["wiki"]}" target="_blank" rel="noopener">📖 '
             f'{tr("公式wikiで英雄を見る（画像・スキル）","See this hero on the official wiki")}</a>'
             f'<a class="hc-wiki" href="{h["search"]}" target="_blank" rel="noopener">𝕏 {tr("公式Xの紹介投稿を探す","Find the official X post")}</a>')
    lis = "".join(f"<li>{bi(ja, en)}</li>" for ja, en in items)
    note = f'<div class="note" style="margin-top:6px">{bi(nj, ne or nj)}</div>' if nj else ""
    return f"""<div class="hero-card">
<div class="hc-head">{cls_badge(h["cls"])}<span class="hc-name" data-hero="{hid}">{esc(h["name"])}</span><span class="hc-gen">G{h["gen"]}</span><span class="acq {h["acq"]}">{tr(ACQ_JA[h["acq"]], ACQ_EN[h["acq"]])}</span></div>
<div class="hc-x">{x}</div>
<div class="eval"><div style="margin-bottom:6px"><span class="verdict-badge {vc}">{tr(vja, ven)}</span> <span class="note">{tr("熊狩（集結主）としての判定","Bear Hunt rally-leader verdict")}</span></div>
<ul class="kv-list">{lis}</ul>{note}</div>
</div>"""

# ---------------- 理論 vs 実測 ----------------
def theory_rank_list(rows, limit=5):
    if not rows: return '<div class="note">—</div>'
    out = []
    for i, r in enumerate(rows[:limit]):
        nd = '<span class="nd" title="集結主スキル未登録・ステのみ">※</span>' if not HEROES[r["id"]]["leader"] and not HEROES[r["id"]]["bearNoEffect"] else ""
        out.append(f'<div class="rk-row"><span class="rk-n">{i+1}</span><span class="rk-h">{hero_html(r["id"])}{nd}</span><span class="rk-v">{r["index"]}</span>'
                   f'<span class="rk-bar"><i style="width:{r["index"]}%"></i></span></div>')
    return "".join(out)

def theory_trio_list(top, limit=3):
    if not top: return '<div class="note">—</div>'
    best = top[0]["score"]; out = []
    for i, c in enumerate(top[:limit]):
        idx = round(c["score"] / best * 100)
        out.append(f'<div class="rk-row trio"><span class="rk-n">{i+1}</span><span class="rk-h">{" ".join(hero_html(h, True) for h in c["ids"])}</span><span class="rk-v">{idx}</span>'
                   f'<span class="rk-bar"><i style="width:{idx}%"></i></span></div>')
    return "".join(out)

# ---------------- 課金帯の表現 ----------------
TIER_DESC = {  # 大きな選択ボタンに添える一言
    "f2p":   ("ルーレット英雄が中心・課金限定なし", "Roulette heroes, no paid-only"),
    "mid":   ("ルーレット＋毎世代1体を育成", "Roulette + one extra hero per gen"),
    "whale": ("全英雄カンスト・全ステータスMAX", "Every hero and stat maxed"),
}
TIER_ICON = {"f2p": "🎡", "mid": "💎", "whale": "👑"}

def tier_chips(tk, tr):
    td = TIERDEF[tk]
    paid = tr("課金限定英雄あり", "paid-only heroes") if td["paid"] else tr("課金限定英雄なし", "no paid-only heroes")
    mx = f'<span class="chip max">👑 {tr("全ステータスMAX", "Everything maxed")}</span>' if tk == "whale" else ""
    return (f'{mx}<span class="chip">{paid}</span>'
            f'<span class="chip">{tr("ルーレット以外のSSR ", "Non-wheel SSRs: ")}{td["hallSlots"]}{tr("体まで", " max")}</span>'
            f'<span class="chip">{tr("専用装備 Lv", "Gear Lv")}{td["gear"]}{tr("（最大）", " (max)") if td["gear"] >= 10 else ""}</span>'
            f'<span class="chip">{tr("火晶 Lv", "FC Lv")}{td["fc"]}{tr("（最大）", " (max)") if td["fc"] >= 10 else ""}</span>'
            f'<span class="chip">{tr("兵種 T", "Troops T")}{td["tier"]}{tr("（最大）", " (max)") if td["tier"] >= 12 else ""}</span>')

def tier_picker(tr, big=True):
    """課金帯の選択UI。big=True はページの核（説明付きの大きなボタン）、False は下部の小さなタブ。同じ data-group で連動"""
    if big:
        btns = "".join(
            f'<button type="button" data-tier="{t["key"]}" class="tp-btn"><span class="tp-ic">{TIER_ICON[t["key"]]}</span>'
            f'<span class="tp-t">{tr(t["label"], t["label_en"])}</span><span class="tp-d">{tr(*TIER_DESC[t["key"]])}</span></button>' for t in TIERS)
        return f'<div class="tier-tabs tier-picker" data-group="cmp" data-default="{DEFAULT_TIER}" role="group" aria-label="課金帯">{btns}</div>'
    btns = "".join(f'<button type="button" data-tier="{t["key"]}">{TIER_ICON[t["key"]]} {tr(t["label"], t["label_en"])}</button>' for t in TIERS)
    return f'<div class="tier-tabs tier-mini" data-group="cmp" data-default="{DEFAULT_TIER}"><span class="tm-lab">{tr("課金帯：","Tier: ")}</span>{btns}</div>'

def showing_label(tk, tr):
    t = TIER_BY[tk]
    return (f'<div class="showing"><span class="sh-ic">{TIER_ICON[tk]}</span><span class="sh-t">{tr("表示中：","Showing: ")}<b>{tr(t["label"], t["label_en"])}</b>'
            f'{tr("の構成","")}</span><span class="sh-hint">{tr("← 上のボタンで切替","← switch above")}</span></div>')

def sim_href(g, ids, tk):
    return f'/tools/bear-hunt/index.html?gen={g}&inf={ids[0]}&lan={ids[1]}&mks={ids[2]}&gear={TIERDEF[tk]["gear"]}'

# ---------------- 理想の英雄構成（ページの核） ----------------
def best_section(g, tr):
    e = theory["gens"][str(g)]
    panes = ""
    for t in TIERS:
        tk = t["key"]; b = e["byTier"][tk]; top = b["top"][0]; ids = top["ids"]
        tiles = ""
        for i, c in enumerate(CLS):
            hid = ids[i]; h = HEROES[hid]
            rows = b["slotRank"][c]
            idx = next((r["index"] for r in rows if r["id"] == hid), 100)
            runner = next((r for r in rows if r["id"] != hid), None)
            new = f'<span class="bt-new">{tr("この世代の新英雄","NEW this gen")}</span>' if h["gen"] == g else ""
            nd = f' <span class="nd" title="集結主スキル未登録・ステのみ">※</span>' if not h["leader"] and not h["bearNoEffect"] else ""
            alt = (f'<div class="bt-alt">{tr("次点：","Runner-up: ")}{hero_html(runner["id"])} <span class="bt-idx">{runner["index"]}</span></div>'
                   if runner else "")
            tiles += (f'<div class="best-tile {c}"><div class="bt-cls">{cls_badge(c)}<span>{tr(CLS_JA[c] + "枠", CLS_EN[c] + " slot")}</span>{new}</div>'
                      f'<div class="bt-name"><span data-hero="{hid}">{esc(h["name"])}</span>{nd}</div>'
                      f'<div class="bt-meta"><span class="hc-gen">G{h["gen"]}</span><span class="acq {h["acq"]}">{tr(ACQ_JA[h["acq"]], ACQ_EN[h["acq"]])}</span></div>'
                      f'{alt}</div>')
        panes += (f'<div class="tier-pane best-pane" data-group="cmp" data-tier="{tk}">'
                  f'{showing_label(tk, tr)}'
                  f'<div class="best-trio">{tiles}</div>'
                  f'<div class="best-foot"><div class="chips">{tier_chips(tk, tr)}</div>'
                  f'<a class="btn best-cta" href="{sim_href(g, ids, tk)}">🐻 {tr("この構成でダメージを試算する","Simulate this build")} →</a></div>'
                  f'</div>')
    return f"""<section class="best" id="best">
<div class="best-head"><div class="best-kicker">🏆 {tr("理想の英雄構成","Ideal hero build")}</div>
<h2 class="best-h2">{tr(f"第{g}世代の最強集結主構成（課金帯別）", f"Gen {g} best rally-leader build by tier")}</h2>
<p class="best-lead">{tr("あなたの課金帯を選んでください。その条件で入手できる英雄だけを 盾×槍×弓 で総当たりし、熊狩ダメージが理論上いちばん高い組み合わせを表示します。",
                        "Pick your spending tier. We brute-force every INF × LAN × MKS combination obtainable at that tier and show the one with the highest theoretical Bear Hunt damage.")}</p>
<div class="best-step">{tr("あなたの課金帯は？","Your tier?")}</div>
{tier_picker(tr, big=True)}
</div>
{panes}
<p class="note">※ {tr("理論値は熊狩ダメージ・シミュレーターと同じ計算式による推定です。兵種比率・参加者・係数は固定（","Estimates use the same formula as the Bear Hunt Simulator. Ratio, joiners and coefficients are fixed (")}<a href="/stats/methodology.html">{tr("前提を見る","see methodology")}</a>{tr("）。",").")}</p>
</section>"""

# ---------------- 結論（先に答え） ----------------
def tldr_section(g, tr):
    e = theory["gens"][str(g)]
    lis = []
    for t in TIERS:
        ids = e["byTier"][t["key"]]["top"][0]["ids"]
        lis.append(f'<li><span class="tl-k"><span class="ic">{TIER_ICON[t["key"]]}</span> {tr(t["label"], t["label_en"])}</span><span class="tl-v">{" ".join(hero_html(h, True) for h in ids)}</span></li>')
    swap = [h for h in sorted(e["heroes"], key=lambda x: CLS.index(x["cls"])) if hero_eval(h["id"], g)[0][0] == "v1"]
    if swap:
        lis.append(f'<li><span class="tl-k"><span class="ic">🔁</span> {tr("新英雄で乗り換え推奨","Swap in")}</span><span class="tl-v">{" ".join(hero_html(h["id"], True) for h in swap)}</span></li>')
    else:
        lis.append(f'<li><span class="tl-k"><span class="ic">🔁</span> {tr("新英雄で乗り換え推奨","Swap in")}</span><span class="tl-v">{tr("なし（据え置きで可）","none — keep current heroes")}</span></li>')
    return f'<div class="tldr"><div class="tl-h"><span class="ic">📌</span> {tr(f"第{g}世代の結論", f"Gen {g} in short")}</div><ul>{"".join(lis)}</ul></div>'

# ---------------- よくある質問（FAQ + 構造化データ） ----------------
def faq_section(g, tr):
    e = theory["gens"][str(g)]
    def names(ids): return "・".join(f"{CLS_JA[HEROES[h]['cls']]}{HEROES[h]['name']}" for h in ids)
    def names_en(ids): return ", ".join(f"{CLS_EN[HEROES[h]['cls']]} {HEROES[h]['en']}" for h in ids)
    def html_ids(ids): return " ".join(hero_html(h, True) for h in ids)
    w = e["byTier"]["whale"]["top"][0]["ids"]; f = e["byTier"]["f2p"]["top"][0]["ids"]; mid = e["byTier"]["mid"]["top"][0]["ids"]
    gen_heroes = sorted(e["heroes"], key=lambda x: CLS.index(x["cls"]))
    qas = []   # (q_ja, a_ja_html, a_ja_text, q_en, a_en_html)
    # Q1 最強構成
    qas.append((f"ホワサバ第{g}世代の熊狩りで最強の集結主構成は？",
                f"理論上の最強（石油王・全英雄カンスト前提）は {html_ids(w)} です。中課金なら {html_ids(mid)}、無課金・微課金なら {html_ids(f)} が理論最適です。",
                f"理論上の最強（石油王・全英雄カンスト前提）は {names(w)} です。中課金なら {names(mid)}、無課金・微課金なら {names(f)} が理論最適です。",
                f"What is the strongest Gen {g} rally-leader build in Bear Hunt?",
                f"Theoretical best for whales (every hero maxed): {html_ids(w)}. Mid spenders: {html_ids(mid)}. F2P / light spenders: {html_ids(f)}."))
    # Q2 無課金
    rou = next((HEROES[h["id"]] for h in gen_heroes if h["acq"] == "roulette"), None)
    rou_ja = f" この世代のルーレット英雄（無課金でも入手可）は{CLS_JA[rou['cls']]}{rou['name']}です。" if rou else ""
    rou_en = f" This generation’s roulette hero (F2P-obtainable) is {CLS_EN[rou['cls']]} {rou['en']}." if rou else ""
    qas.append((f"無課金・微課金は第{g}世代の熊狩りでどの英雄を使えばいい？",
                f"課金限定英雄を使わず、ルーレット以外のSSR（英雄殿堂・イベント）は1体までという前提での理論最適は {html_ids(f)} です。{rou_ja}",
                f"課金限定英雄を使わず、ルーレット以外のSSR（英雄殿堂・イベント）は1体までという前提での理論最適は {names(f)} です。{rou_ja}",
                f"Which heroes should F2P / light spenders use in Gen {g} Bear Hunt?",
                f"With no paid-only heroes and at most one non-wheel SSR (Hall of Heroes / events), the theoretical best is {html_ids(f)}.{rou_en}"))
    # Q3 新英雄
    vs = [(HEROES[h["id"]], hero_eval(h["id"], g)[0]) for h in gen_heroes]
    v_ja = "、".join(f"{CLS_JA[h['cls']]}{h['name']}は「{v[1]}」" for h, v in vs)
    v_en = "; ".join(f"{CLS_EN[h['cls']]} {h['en']}: {v[2]}" for h, v in vs)
    qas.append((f"第{g}世代の新英雄は熊狩りで乗り換えるべき？",
                f"熊狩り（集結主）としての判定は、{v_ja} です。判定の根拠（集結主スキル・理論順位・入手経路）は上の「この世代の英雄」に載せています。",
                f"熊狩り（集結主）としての判定は、{v_ja} です。",
                f"Should I swap to the Gen {g} heroes for Bear Hunt?",
                f"Rally-leader verdicts: {v_en}. See “This generation’s heroes” above for the reasoning."))
    # Q4 ジェロニモ無し（盾1位が課金限定のときだけ）
    if HEROES[w[0]]["acq"] == "paid" and f[0] != w[0]:
        qas.append((f"{HEROES[w[0]]['name']}を持っていない場合、第{g}世代の盾枠は誰がいい？",
                    f"課金限定英雄なしの理論順位では {hero_html(f[0], True)} が盾枠の1位です。",
                    f"課金限定英雄なしの理論順位では {CLS_JA['inf']}{HEROES[f[0]]['name']} が盾枠の1位です。",
                    f"What if I don’t have {HEROES[w[0]]['en']} for the INF slot in Gen {g}?",
                    f"Without paid-only heroes, {hero_html(f[0], True)} ranks first in the INF slot."))
    # Q5 次世代
    if g < MAXG:
        nx = e["byTier"]["whale"].get("next")
        if nx and nx["changed"]:
            ch = "・".join(f"{CLS_JA[c]}枠を{HEROES[nx['to'][CLS.index(c)]]['name']}" for c in nx["changed"])
            ch_en = ", ".join(f"{CLS_EN[c]} → {HEROES[nx['to'][CLS.index(c)]]['en']}" for c in nx["changed"])
            a_ja = f"石油王の理論最適では、第{g+1}世代で{ch}に替えると理論値が約{nx['gainPct']}%伸びます。課金帯ごとの詳細は「次の世代でどうする？」を見てください。"
            a_en = f"For whales, swapping {ch_en} in Gen {g+1} raises the theoretical value by about {nx['gainPct']}%. See “What to do next generation” for each tier."
        else:
            a_ja = f"第{g+1}世代では石油王の理論最適は変わりません。そのままの構成で問題ありません。"
            a_en = f"The theoretical best for whales does not change in Gen {g+1}; keep your current build."
        qas.append((f"次の第{g+1}世代で熊狩りの構成は変わる？", a_ja, a_ja, f"Does the build change in Gen {g+1}?", a_en))
    # Q6 自分の数字
    qas.append(("理論値ではなく自分のステータスでのダメージを知りたい",
                '<a href="/tools/bear-hunt/index.html">熊狩ダメージ・シミュレーター</a>に編成画面の攻撃%・殺傷%を入れると、集結1回のダメージポイントを推定できます。上の「この構成でダメージを試算する」ボタンを押すと、この世代の理論最適が集結主にセットされた状態で開きます。',
                "熊狩ダメージ・シミュレーターに編成画面の攻撃%・殺傷%を入れると、集結1回のダメージポイントを推定できます。",
                "How do I get the damage for my own stats instead of the theory?",
                'Enter your formation-screen ATK% / Lethality% into the <a href="/tools/bear-hunt/index.html">Bear Hunt Simulator</a>. The “Simulate this build” button above opens it with this generation’s best heroes pre-set.'))
    items = "".join(f'<details class="faq"><summary>{bi(esc(q), qen)}</summary><div class="faq-a">{bi(a, aen)}</div></details>' for q, a, _t, qen, aen in qas)
    ld = ld_faq([(q, t_) for q, _a, t_, _qe, _ae in qas])
    return f'<h2 id="faq">{tr("よくある質問","FAQ")}</h2><div class="faq-list">{items}</div>', ld

# ---------------- 口コミ（投稿フォームの「ひとこと」） ----------------
def reviews_section(g, tr):
    return f"""<h2 id="reviews">{tr(f"第{g}世代の熊狩り 口コミ", f"Gen {g} Bear Hunt reviews")}</h2>
<p class="sec-lead">{tr("みんなの構成と「ひとこと」を新しい順に表示します。投稿フォームで構成を送るとき「ひとこと」を書くと、ここに載ります（匿名・表示名は任意）。","Players’ builds and one-liners, newest first. Add a one-liner when you submit your build and it appears here (anonymous; display name optional).")}</p>
<div class="rv-bar">
  <a class="btn rv-post" href="/submit/index.html?gen={g}&review=1">💬 {tr("口コミを投稿する","Post a review")}</a>
</div>
<div class="rv-list" data-reviews="{g}"><div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel" style="width:60%"></div></div>
<p class="note">{tr("口コミは投稿者個人の意見で、当サイトの見解ではありません。URL・不適切な表現は投稿時に弾き、通報が集まった口コミは自動で非表示になります。自分の投稿は投稿フォームから上書き・削除できます。","Reviews are the posters’ own opinions, not this site’s. Links and abusive wording are rejected on submission, and reviews that receive several reports are hidden automatically. You can edit or delete your own from the submission form.")}</p>"""

def sim_cta(g, tr):
    e = theory["gens"][str(g)]
    ids = e["byTier"][DEFAULT_TIER]["top"][0]["ids"]
    return f"""<div class="sim-cta"><div class="sc-ic">🐻</div><div class="sc-body">
<div class="sc-t">{tr("理論値は「モデル上の推定」。あなたの数字はシミュレーターで","Theory is a model estimate — get your own number in the simulator")}</div>
<p>{tr("編成画面の攻撃%・殺傷%と兵数を入れるだけで、集結1回のダメージポイントと「次に強化すべき順」が出ます。この世代の理論最適を集結主にセットした状態で開けます。",
      "Enter your formation-screen ATK% / Lethality% and troop count to get the damage points of one rally plus what to upgrade next. Opens with this generation’s best heroes pre-set.")}</p>
<div class="sc-btns"><a class="btn" href="{sim_href(g, ids, DEFAULT_TIER)}">{tr("理論最適をセットしてシミュレーターを開く","Open the simulator with the best build")} →</a>
<a class="sc-sub" href="/tools/bear-hunt/index.html">{tr("自分の構成で開く","Open with my own build")}</a></div>
</div></div>"""

def byline(tr):
    return (f'<div class="st-byline">✍ {tr("執筆：","By ")}<a href="/about.html"><b>{tr("じゃすみん","Jasmine")}</b></a>'
            f'<span class="sep">|</span>{tr("最終更新：","Updated ")}{UPDATED}<span class="sep">|</span>{tr("検証環境：1567サーバー","Verified on Server 1567")}</div>')

def compare_section(g, tr):
    e = theory["gens"][str(g)]
    tabs = tier_picker(tr, big=False)
    panes = ""
    for t in TIERS:
        b = e["byTier"][t["key"]]; td = TIERDEF[t["key"]]
        assump = f'{showing_label(t["key"], tr)}<div class="chips" style="margin:6px 0 10px">{tier_chips(t["key"], tr)}</div>'
        cols = ""
        for c in CLS:
            cols += (f'<div class="cmp-col"><h4>{cls_badge(c)}{tr(CLS_JA[c] + "枠", CLS_EN[c] + " slot")}</h4><div class="cmp-half">'
                     f'<div><div class="lab th">{tr("理論","THEORY")}</div>{theory_rank_list(b["slotRank"][c])}</div>'
                     f'<div><div class="lab lv">{tr("実測","LIVE")}</div><div data-live="slot" data-tier="{t["key"]}" data-cls="{c}"><div class="skel"></div><div class="skel" style="width:70%"></div></div></div>'
                     f'</div></div>')
        trio = (f'<div class="cmp-trio"><h4>{tr("3人の組み合わせ TOP3","Top-3 trios")} <span data-live="srctag" data-tier="{t["key"]}"></span></h4><div class="cmp-half">'
                f'<div><div class="lab th">{tr("理論","THEORY")}</div>{theory_trio_list(b["top"])}</div>'
                f'<div><div class="lab lv">{tr("実測","LIVE")}</div><div data-live="trio" data-tier="{t["key"]}"><div class="skel"></div></div></div></div></div>')
        panes += f'<div class="tier-pane" data-group="cmp" data-tier="{t["key"]}">{assump}<div class="cmp-grid">{cols}</div>{trio}</div>'
    return f"""<h2 id="compare">{tr("理論 vs 実測：各枠の英雄ランキング","Theory vs Live: per-slot hero rankings")}</h2>
<ul class="kv-list sec-lead">
<li><b>{tr("理論","Theory")}</b>：{tr("その世代で入手できる英雄を盾×槍×弓で総当たりし、熊狩シミュレーターと同じ式で期待ダメージが高い順に並べたもの。数字は1位を100とした指数。","All obtainable INF×LAN×MKS combinations, ranked by the simulator’s formula. Numbers are an index (#1 = 100).")}</li>
<li><b>{tr("実測","Live")}</b>：{tr("利用者の投稿から集計した採用率（直近90日）。数字は％。","Pick rate from user submissions (last 90 days), in %.")}</li>
</ul>
<div data-live="meta"><div class="skel" style="width:40%"></div></div>
{tabs}{panes}
<p class="note" style="margin-top:8px">※ {tr("集結主スキルのデータが未登録の英雄は、遠征ステータスだけで順位を計算しています（スキルが強い場合は過小評価になります）。","Heroes without registered leader-skill data are ranked by expedition stats only (they may be underrated if their skill is strong).")}</p>
<div data-live="stats"></div>"""

def next_section(g, tr):
    e = theory["gens"][str(g)]
    if g >= MAXG:
        return f'<h2>{tr("次の世代でどうする？","What to do next generation")}</h2><div class="live-empty">{tr("第", "Gen ")}{g+1}{tr("世代はまだ実装されていません。実装されたらここに乗り換え予測が出ます。", " is not out yet. The swap forecast will appear here once it is.")}</div>'
    boxes = ""
    for t in TIERS:
        nx = e["byTier"][t["key"]].get("next")
        if not nx: continue
        if nx["changed"]:
            slots = " ".join(f'<span class="slot-tag">{CLS_JA[c]}</span>' for c in nx["changed"])
            to = " ".join(hero_html(nx["to"][CLS.index(c)], True) for c in nx["changed"])
            body = (f'<ul class="kv-list"><li>{tr("替える枠：","Swap: ")}{slots}</li><li>{tr("新しい英雄：","New hero: ")}{to}</li>'
                    f'<li>{tr("理論値の伸び：","Theoretical gain: ")}<span class="gain">+{nx["gainPct"]}%</span></li></ul>')
        else:
            body = f'<div class="keep">✔ {tr("そのままでOK。理論最適は変わりません。","No change — the theoretical best stays the same.")}</div>'
        boxes += f'<div class="next-box"><div class="nb-tier">{tr(t["label"], t["label_en"])}</div>{body}</div>'
    return f"""<h2>{tr(f"次の第{g+1}世代が来たらどうする？（乗り換え予測）", f"When Gen {g+1} arrives: swap forecast")}</h2>
<p class="sec-lead">{tr(f"第{g+1}世代が来たときに、理論最適構成がどう変わるかを課金帯ごとに示します。", f"How the theoretical best changes when Gen {g+1} arrives, per spending tier.")}</p>
<div class="next-grid">{boxes}</div>"""

def points_section(g, tr):
    """ポイント（箇条書きカード）。_stats_notes/gen-NN.md があればそれを優先"""
    nj, ne = read_md(os.path.join(NOTES_DIR, f"{gen_dir(g)}.md"))
    if nj:
        return f'<h2>{tr("この世代のポイント","Key points")}</h2><div class="card">{bi(nj, ne or nj)}</div>'
    e = theory["gens"][str(g)]
    cards = []
    # 課金帯ごとの最適（1カードにまとめる）
    lis = []
    for t in TIERS:
        top = e["byTier"][t["key"]]["top"][0]
        lis.append(f'<li><b>{tr(t["label"], t["label_en"])}</b>：{" ".join(hero_html(h, True) for h in top["ids"])}</li>')
    cards.append(f'<div class="point"><div class="pt-h"><span class="ic">🎯</span>{tr("課金帯別の理論最適","Theoretical best by tier")}</div><ul>{"".join(lis)}</ul></div>')
    # この世代の英雄の判定
    lis = []
    for h in sorted(e["heroes"], key=lambda x: CLS.index(x["cls"])):
        (vc, vja, ven), _, _ = hero_eval(h["id"], g)
        lis.append(f'<li>{hero_html(h["id"], True)}：<b>{tr(vja, ven)}</b></li>')
    cards.append(f'<div class="point"><div class="pt-h"><span class="ic">🆕</span>{tr("この世代の英雄の判定","Verdict on this generation’s heroes")}</div><ul>{"".join(lis)}</ul></div>')
    # 無課金の更新機会
    rou = next((HEROES[h["id"]] for h in e["heroes"] if h["acq"] == "roulette"), None)
    if rou:
        cards.append(f'<div class="point"><div class="pt-h"><span class="ic">🎡</span>{tr("無課金・微課金の更新枠","F2P upgrade window")}</div><ul>'
                     f'<li>{tr("この世代のルーレット英雄：","Roulette hero this gen: ")}{hero_html(rou["id"], True)}</li>'
                     f'<li>{tr("無課金は3世代に1回、この兵種の枠を更新できます","F2P can refresh this slot once every 3 generations")}</li></ul></div>')
    return f'<h2>{tr("この世代のポイント","Key points")}</h2><div class="point-grid">{"".join(cards)}</div>'

# ---------------- 世代ページ ----------------
PUBLISHED = "2026-09-02"

def build_gen(g):
    tr = Tr()
    e = theory["gens"][str(g)]
    path = f"/stats/{gen_dir(g)}/"
    gen_heroes = sorted(e["heroes"], key=lambda x: CLS.index(x["cls"]))
    hn_ja = "・".join(HEROES[h["id"]]["name"] for h in gen_heroes)
    hn_en = ", ".join(HEROES[h["id"]]["en"] for h in gen_heroes)
    w = e["byTier"]["whale"]["top"][0]["ids"]; f2 = e["byTier"]["f2p"]["top"][0]["ids"]
    def names(ids): return "・".join(f"{CLS_JA[HEROES[h]['cls']]}{HEROES[h]['name']}" for h in ids)
    def names_en(ids): return ", ".join(f"{CLS_EN[HEROES[h]['cls']]} {HEROES[h]['en']}" for h in ids)
    title_ja = f"ホワサバ 第{g}世代の熊狩り おすすめ英雄・最強構成【無課金〜石油王】 | ホワサバ ツールラボ"
    title_en = f"Whiteout Survival Gen {g} Bear Hunt: Best Heroes & Builds (F2P to Whale) | Whiteout Tools Lab"
    desc_ja = (f"ホワサバ第{g}世代の熊狩り（集結主）でおすすめの英雄と最強構成を課金帯別に解説。"
               f"新英雄{hn_ja}の評価、理論上の最強構成（石油王：{names(w)}）、無課金向けの構成、実測採用率、"
               + (f"第{g+1}世代への乗り換え予測まで。" if g < MAXG else "次世代への備えまで。"))
    desc_en = (f"Best Gen {g} Bear Hunt rally-leader heroes and builds in Whiteout Survival, by spending tier. Verdicts on {hn_en}, "
               f"the theoretical best ({names_en(w)} for whales, {names_en(f2)} for F2P), live pick rates and the next-generation swap forecast.")
    lead_ja = tr(f"ホワサバ（ホワイトアウト・サバイバル）第{g}世代の熊狩りで、集結主が使うべき英雄を課金帯別にまとめました。新英雄 {hn_ja} の評価、理論上の最強構成、みんなが実際に使っている構成、次の世代への備えまで、このページで分かります。",
                 f"Which heroes a rally leader should run in Gen {g} Bear Hunt, by spending tier: verdicts on {hn_en}, the theoretical best build, what players actually run, and how to prepare for the next generation.")
    h1_en = f'Gen {g} Bear Hunt: <span class="acc">Best Heroes &amp; Builds</span>'
    heroes = "".join(hero_card(h["id"], g, tr) for h in gen_heroes)
    prev_g, next_g = (g - 1 if g > 1 else None), (g + 1 if g < MAXG else None)
    prevnext = ('<div class="gen-prevnext">'
        + (f'<a href="/stats/{gen_dir(prev_g)}/index.html">← {tr(f"第{prev_g}世代の熊狩り構成", f"Gen {prev_g} builds")}</a>' if prev_g else "<span></span>")
        + f'<a href="/stats/index.html">{tr("世代一覧","All generations")}</a>'
        + (f'<a href="/stats/{gen_dir(next_g)}/index.html">{tr(f"第{next_g}世代の熊狩り構成", f"Gen {next_g} builds")} →</a>' if next_g else "<span></span>") + '</div>')
    faq_html, faq_ld = faq_section(g, tr)
    toc = (f'<nav class="toc" aria-label="目次"><a href="#best">🏆 {tr("理想の構成","Ideal build")}</a><a href="#heroes">🆕 {tr("新英雄の評価","New heroes")}</a>'
           f'<a href="#compare">⚖️ {tr("理論 vs 実測","Theory vs Live")}</a><a href="#next">⏭️ {tr("次の世代","Next gen")}</a><a href="#reviews">💬 {tr("口コミ","Reviews")}</a><a href="#faq">❓ FAQ</a></nav>')
    body = f"""<div class="wrap wide" data-live-page="{g}">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別 熊狩り構成","Bear Hunt builds by generation")}</a> &gt; {tr(f"第{g}世代", f"Gen {g}")}</div>
<div class="eyebrow">{tr("ホワサバ（Whiteout Survival）熊狩り攻略 ／ 世代別ガイド","Whiteout Survival Bear Hunt · generation guide")}</div>
<h1>{tr(f"第{g}世代の熊狩り", f"Gen {g} Bear Hunt:")} <span class="acc">{tr("おすすめ英雄・最強構成","Best Heroes &amp; Builds")}</span></h1>
<div id="updbox"></div>
{byline(tr)}
<p class="lead">{lead_ja}</p>
{gen_strip(g)}
{tldr_section(g, tr)}
{toc}

{best_section(g, tr)}

<h2 id="heroes">{tr(f"第{g}世代の新英雄は熊狩りで使える？", f"Are the Gen {g} heroes good for Bear Hunt?")}</h2>
<p class="sec-lead">{tr("公式X（@WOS_Japan）の紹介投稿と、熊狩り（集結主）としての判定。乗り換え推奨／有力候補／据え置きで可／熊狩では不要 の4段階です。","Official @WOS_Japan posts plus a rally-leader verdict: swap in / strong option / keep current / not for Bear Hunt.")}</p>
<div class="hero-cards">{heroes}</div>

{compare_section(g, tr)}
<div id="next"></div>
{next_section(g, tr)}
{points_section(g, tr)}
{reviews_section(g, tr)}
{sim_cta(g, tr)}
{faq_html}

<div class="callout" style="background:#fff;border:1px solid var(--line)"><span>📝</span><div>{tr("あなたの構成も投稿すると、この世代の実測に反映されます。投稿後すぐに、同世代内の位置と理論最適との差が分かります。","Submit your build to be counted here. You'll immediately see your rank in this generation and how it compares with the theoretical best.")}
 <a class="btn" style="margin-left:10px;padding:6px 14px;font-size:12px" href="/submit/index.html?gen={g}">{tr("投稿する","Submit")}</a></div></div>
<div class="relbar">
  <a href="/tools/bear-hunt/index.html">→ {tr("熊狩ダメージ・シミュレーター","Bear Hunt Simulator")}</a>
  <a href="/guides/leader-formation.html">→ {tr("集結主におすすめの編成と英雄の選び方","Rally leader: recommended formations")}</a>
  <a href="/tools/hero-list/index.html">→ {tr("英雄一覧・データベース","Hero database")}</a>
  <a href="/stats/methodology.html">→ {tr("集計方法と計算の前提","Methodology")}</a>
</div>
{prevnext}
</div>
"""
    crumb_en = f'<a href="/en/index.html">Home</a> &gt; <a href="/en/stats/index.html">Bear Hunt builds by generation</a> &gt; Gen {g}'
    ld = jsonld([ld_article(f"第{g}世代の熊狩り おすすめ英雄・最強構成", desc_ja, path, PUBLISHED),
                 ld_crumbs([("ホーム", "/"), ("世代別 熊狩り構成", "/stats/"), (f"第{g}世代", path)]), faq_ld])
    return head(title_ja, desc_ja, path, ld) + body + tail(tr, title_en, crumb_en, h1_en, tr.m[lead_ja], desc_en=desc_en)

# ---------------- ハブ ----------------
def hub_gen_card(g, tr, featured=False):
    e = theory["gens"][str(g)]
    gh = sorted(e["heroes"], key=lambda x: CLS.index(x["cls"]))
    best = e["byTier"]["whale"]["top"][0]["ids"]; f2 = e["byTier"]["f2p"]["top"][0]["ids"]
    chips = "".join(
        f'<span class="gh {h["cls"]}"><i>{CLS_JA[h["cls"]]}</i><span data-hero="{h["id"]}">{esc(HEROES[h["id"]]["name"])}</span>'
        + ('<em title="ルーレット（無課金でも入手可）">🎡</em>' if h["acq"] == "roulette" else '<em title="デイリー割引・氷原支配者・最強王国・英雄集結">🎪</em>' if h["acq"] == "event" else '<em title="英雄殿堂">🏛</em>' if h["acq"] == "hall" else "") + '</span>' for h in gh)
    swap = [h for h in gh if hero_eval(h["id"], g)[0][0] == "v1"]
    verdict = (f'<div class="gc-verdict">{bi("🔁 乗り換え推奨：" + "・".join(HEROES[h["id"]]["name"] for h in swap), "🔁 Swap in: " + ", ".join(HEROES[h["id"]]["en"] for h in swap))}</div>' if swap
               else f'<div class="gc-verdict muted">— {tr("新英雄は据え置きで可","No swap needed")}</div>')
    if featured:
        return f"""<a class="gen-feat" href="/stats/{gen_dir(g)}/index.html">
<div class="gf-l"><div class="gf-kicker">{tr("最新世代","Latest")}</div><div class="gf-t">{tr(f"第{g}世代", f"Gen {g}")}<span class="gf-sub">{tr("の熊狩り おすすめ英雄・最強構成","Bear Hunt best heroes & builds")}</span></div>
<div class="gc-heroes">{chips}</div>{verdict}</div>
<div class="gf-r"><div class="gf-row"><b>👑 {tr("石油王の理論最適","Whale best")}</b>{" ".join(hero_html(h, True) for h in best)}</div>
<div class="gf-row"><b>🎡 {tr("無課金・微課金の理論最適","F2P best")}</b>{" ".join(hero_html(h, True) for h in f2)}</div>
<div class="gf-row"><b>📊 {tr("投稿","Submissions")}</b><span data-gen-n="{g}">—</span> {tr("件","")}</div>
<span class="gf-go">{tr("この世代のページを見る","Open this generation")} →</span></div></a>"""
    return (f'<a class="gen-card" href="/stats/{gen_dir(g)}/index.html"><div class="gc-t"><span class="gc-num">G{g}</span><span class="gc-name">{tr(f"第{g}世代", f"Gen {g}")}</span>'
            f'<span class="gc-n">{tr("投稿","posts")} <span data-gen-n="{g}">—</span></span></div>'
            f'<div class="gc-heroes">{chips}</div>'
            f'<div class="gc-row"><b>👑 {tr("理論最適","Best")}</b>{" ".join(hero_html(h, True) for h in best)}</div>'
            f'{verdict}</a>')

def build_hub():
    tr = Tr()
    path = "/stats/"
    title_ja = f"ホワサバ 熊狩りのおすすめ英雄・最強構成を世代別にまとめ【第1〜{MAXG}世代】 | ホワサバ ツールラボ"
    title_en = f"Whiteout Survival Bear Hunt: Best Heroes & Builds by Generation (Gen 1–{MAXG}) | Whiteout Tools Lab"
    desc_ja = (f"ホワサバの熊狩りで集結主が使うべき英雄・最強構成を第1〜第{MAXG}世代まで世代別に解説。"
               "各世代の新英雄の熊狩り評価、無課金・中課金・石油王ごとの理論最適構成、実測採用率、次世代への乗り換え予測。")
    desc_en = (f"Best Bear Hunt rally-leader heroes and builds in Whiteout Survival for every generation (Gen 1–{MAXG}): "
               "verdicts on each generation’s heroes, theoretical best builds for F2P / mid / whale, live pick rates and swap forecasts.")
    lead_ja = tr(f"自分のサーバーの世代を選ぶと、その世代で集結主が使うべき英雄・課金帯別の最強構成・みんなの実測構成が1ページで分かります。第1〜第{MAXG}世代まで全世代に対応。",
                 f"Pick your server’s generation to see which heroes a rally leader should run, the best build for your spending tier, and what players actually use — every generation from 1 to {MAXG}.")
    cards = "".join(hub_gen_card(g, tr) for g in reversed(GENS) if g != MAXG)
    tiers = "".join(
        f'<div class="tier-card"><div class="tc-h"><span class="tc-ic">{TIER_ICON[t["key"]]}</span>{tr(t["label"], t["label_en"])}</div>'
        f'<p>{tr(*TIER_DESC[t["key"]])}</p><div class="chips">{tier_chips(t["key"], tr)}</div></div>' for t in TIERS)
    faq = [
        ("自分のサーバーが第何世代か分からない",
         "ゲーム内のラッキールーレット・英雄殿堂・デイリー割引などで入手できる「いちばん新しい英雄」の世代が、あなたのサーバーの世代です。各世代の新英雄は上のカードに書いてあるので、見覚えのある英雄が最新のカードを選んでください。",
         "I don’t know my server’s generation",
         "Your server’s generation is the generation of the newest hero available in the Hall of Heroes or roulette. Each card above lists that generation’s new heroes — pick the newest card whose heroes you recognise."),
        ("「世代」とは何ですか？",
         "ホワサバでは新しい英雄が盾・槍・弓の3体セットで順番に実装され、その区切りを世代と呼びます。サーバーごとに進み方が違うので、同じ英雄でも入手できる時期はサーバーによって変わります。",
         "What is a “generation”?",
         "New heroes arrive as a set of three (INF, LAN, MKS); each set is a generation. Servers progress at different speeds, so the same hero becomes available at different times."),
        ("理論最適と実測の違いは？",
         "理論最適は熊狩ダメージ・シミュレーターの計算式で、その世代で入手できる英雄を総当たりした結果（モデル上の推定）です。実測は利用者の匿名投稿を集計した採用率で、世代ごとに10件以上集まると公開されます。",
         "What is the difference between theory and live?",
         "Theory is a model estimate: every obtainable hero combination evaluated with the simulator formula. Live is the pick rate from anonymous user submissions, published once a generation has 10+ entries."),
        ("無課金でも上位の構成は組めますか？",
         "はい。各世代ページの「無課金・微課金」を選ぶと、課金限定英雄を使わずルーレット英雄を中心にした理論最適が出ます。無課金は3世代に1回しか各枠を更新できないので、乗り換えのタイミングが重要です。",
         "Can F2P players build a competitive team?",
         "Yes. Choose “F2P / light spender” on a generation page to get the best build without paid-only heroes, built around roulette heroes. F2P can refresh each slot only every three generations, so timing matters."),
    ]
    faq_html = "".join(f'<details class="faq"><summary>{bi(esc(q), qe)}</summary><div class="faq-a">{bi(esc(a), ae)}</div></details>' for q, a, qe, ae in faq)
    body = f"""<div class="wrap wide">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; {tr("世代別 熊狩り構成","Bear Hunt builds by generation")}</div>
<div class="hub-hero">
<div class="hh-l"><div class="eyebrow">{tr("ホワサバ（Whiteout Survival）熊狩り攻略","Whiteout Survival Bear Hunt guide")}</div>
<h1>{tr("熊狩りのおすすめ英雄・最強構成","Bear Hunt Best Heroes &amp; Builds")}<br><span class="acc">{tr(f"世代別まとめ（第1〜第{MAXG}世代）", f"by generation (Gen 1–{MAXG})")}</span></h1>
<p class="lead">{lead_ja}</p>
<div class="hh-btns"><a class="btn" href="/stats/{gen_dir(MAXG)}/index.html">{tr(f"最新の第{MAXG}世代を見る", f"Open the latest (Gen {MAXG})")} →</a>
<a class="btn ghost" href="/submit/index.html">{tr("自分の構成を投稿する","Submit my build")}</a></div></div>
<div class="hh-r"><div class="steps">
<div class="stp"><span class="sn">1</span><div><b>{tr("世代を選ぶ","Pick a generation")}</b><small>{tr("自分のサーバーの最新世代","Your server’s latest")}</small></div></div>
<div class="stp"><span class="sn">2</span><div><b>{tr("課金帯を選ぶ","Pick your tier")}</b><small>{tr("無課金・微課金／中課金／石油王","F2P / mid / whale")}</small></div></div>
<div class="stp"><span class="sn">3</span><div><b>{tr("シミュレーターで自分の数字を出す","Simulate with your stats")}</b><small>{tr("最強構成をワンタップでセット","Best build set in one tap")}</small></div></div>
</div></div>
</div>
<div id="updbox"></div>
{byline(tr)}
<div class="callout" style="background:#fff;border:1px solid var(--line)"><span>📊</span><div>{tr("総投稿数 ","Total submissions: ")}<b data-total-n>—</b>{tr(" 件。実測は世代ごとに10件から公開。理論最適は投稿数に関係なく全世代で見られます。"," — live stats open at 10 per generation. Theory is available for every generation.")}</div></div>

<h2>{tr("世代を選ぶ","Choose a generation")}</h2>
<p class="sec-lead">{tr("カードの英雄＝その世代の新英雄（🎡＝ルーレット・無課金でも入手可、🎪＝デイリー割引・氷原支配者などのイベント、🏛＝英雄殿堂）。理論最適は石油王の条件です。","Heroes on each card are that generation’s new heroes (🎡 = Lucky Wheel, F2P-obtainable; 🎪 = Daily Deals / event; 🏛 = Hall of Heroes). “Best” is for whales.")}</p>
{hub_gen_card(MAXG, tr, featured=True)}
<div class="gen-cards">{cards}</div>

<h2>{tr("課金帯の考え方","How the spending tiers are defined")}</h2>
<p class="sec-lead">{tr("各世代ページでは、この3つの前提で理論最適を出しています。自分に近いものを選んでください。","Each generation page computes the theoretical best under these three assumptions. Pick the closest to you.")}</p>
<div class="tier-cards">{tiers}</div>

<h2>{tr("各世代ページに載っているもの","What each generation page shows")}</h2>
<div class="point-grid four">
<div class="point"><div class="pt-h"><span class="ic">🏆</span>{tr("理想の英雄構成","Ideal build")}</div><ul>
<li>{tr("課金帯を選ぶと、その条件での最強の集結主3人が大きく表示","Pick a tier and the best three rally-leader heroes appear")}</li>
<li>{tr("ワンタップでシミュレーターにセットして自分の数字を確認","One tap sets them in the simulator for your own number")}</li></ul></div>
<div class="point"><div class="pt-h"><span class="ic">🆕</span>{tr("新英雄の熊狩り評価","New-hero verdicts")}</div><ul>
<li>{tr("公式X（@WOS_Japan）の紹介投稿つき","With the official @WOS_Japan post")}</li>
<li>{tr("乗り換え推奨／有力候補／据え置きで可／熊狩では不要","Swap in / strong option / keep current / not for Bear Hunt")}</li></ul></div>
<div class="point"><div class="pt-h"><span class="ic">⚖️</span>{tr("理論 vs 実測","Theory vs Live")}</div><ul>
<li>{tr("盾・槍・弓それぞれの英雄ランキングを左右で対比","Per-slot hero rankings side by side")}</li>
<li>{tr("実測は利用者の投稿の採用率（％）","Live: pick rate from submissions (%)")}</li></ul></div>
<div class="point"><div class="pt-h"><span class="ic">⏭️</span>{tr("次の世代でどうする？","Next generation")}</div><ul>
<li>{tr("次世代が来たとき、どの枠を替えると何％伸びるか","Which slot to swap next gen and the expected gain")}</li>
<li>{tr("無課金は3世代に1回しか各枠を更新できないので、ここが計画の要","F2P can refresh each slot only every 3 generations — plan around it")}</li></ul></div>
</div>

<h2 id="faq">{tr("よくある質問","FAQ")}</h2>
<div class="faq-list">{faq_html}</div>

<div class="relbar">
  <a href="/tools/bear-hunt/index.html">→ {tr("熊狩ダメージ・シミュレーター","Bear Hunt Simulator")}</a>
  <a href="/guides/leader-formation.html">→ {tr("集結主におすすめの編成と英雄の選び方","Rally leader: recommended formations")}</a>
  <a href="/submit/index.html">→ {tr("構成を投稿する","Submit your build")}</a>
  <a href="/stats/methodology.html">→ {tr("集計方法と計算の前提","Methodology")}</a>
</div>
</div>
"""
    crumb_en = '<a href="/en/index.html">Home</a> &gt; Bear Hunt builds by generation'
    ld = jsonld([ld_article("ホワサバ 熊狩りのおすすめ英雄・最強構成 世代別まとめ", desc_ja, path, PUBLISHED),
                 ld_crumbs([("ホーム", "/"), ("世代別 熊狩り構成", path)]),
                 ld_faq([(q, a) for q, a, _qe, _ae in faq])])
    h1_en = f'Bear Hunt Best Heroes &amp; Builds<br><span class="acc">by generation (Gen 1–{MAXG})</span>'
    return head(title_ja, desc_ja, path, ld) + body + tail(tr, title_en, crumb_en, h1_en, tr.m[lead_ja], desc_en=desc_en)

# ---------------- 方法論 ----------------
def build_methodology():
    tr = Tr()
    path = "/stats/methodology.html"
    title_ja = "統計の集計方法と理論値の前提 | ホワサバ ツールラボ"
    title_en = "Methodology: How the Stats and Theoretical Builds Are Computed | Whiteout Tools Lab"
    desc_ja = "世代別統計の集計方法（対象期間・除外基準・公開基準）と、理論最適構成の計算前提（計算式・課金帯モデル・入手経路）。"
    lead_ja = tr("数字の作り方をすべて公開しています。", "Everything about how the numbers are made.")
    m = theory["model"]
    tiers_rows = "".join(
        f'<tr><td>{tr(t["label"], t["label_en"])}</td><td>{tr("可" if TIERDEF[t["key"]]["paid"] else "不可", "yes" if TIERDEF[t["key"]]["paid"] else "no")}</td><td>{TIERDEF[t["key"]]["hallSlots"]}</td><td>{TIERDEF[t["key"]]["gear"]}</td><td>{TIERDEF[t["key"]]["fc"]}</td><td>T{TIERDEF[t["key"]]["tier"]}</td></tr>'
        for t in TIERS)
    unlock_rows = "".join(f'<tr><td>{tr(f"第{g}世代", f"Gen {g}")}</td><td>{UNLOCK[g]}</td></tr>' for g in GENS)
    body = f"""<div class="wrap">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別統計","Generation stats")}</a> &gt; {tr("集計方法","Methodology")}</div>
<h1>{tr("集計方法と","Methodology:")} <span class="acc">{tr("理論値の前提","stats & theory")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>

<h2>{tr("1. 実測（みんなの投稿）","1. Live data (submissions)")}</h2>
<div class="point-grid">
<div class="point"><div class="pt-h">{tr("集めているもの","What we collect")}</div><ul>
<li>{tr("サーバーの最新世代・課金帯（自己申告）","Latest generation on your server, spending tier (self-reported)")}</li>
<li>{tr("集結主の盾・槍・弓の英雄","The three rally-leader heroes")}</li>
<li>{tr("任意：1ラリーのダメージ・火晶レベル・専用装備Lv","Optional: damage per rally, FC level, gear levels")}</li>
<li><b>{tr("集めないもの：","Not collected: ")}</b>{tr("同盟名・ゲームID・お名前。IPは塩付きハッシュのみ（連投防止用）","alliance, game ID, name. IP only as a salted hash for rate limiting")}</li></ul></div>
<div class="point"><div class="pt-h">{tr("公開の基準","Publication rules")}</div><ul>
<li>{tr("集計対象は直近90日","Last 90 days only")}</li>
<li>{tr("世代ごとに10件未満は非公開","Fewer than 10 per generation: hidden")}</li>
<li>{tr("30件未満は「参考値」表示","Fewer than 30: marked indicative")}</li>
<li>{tr("課金帯別の内訳は世代30件以上・各課金帯10件以上","Per-tier breakdown needs 30+ overall and 10+ in the tier")}</li></ul></div>
<div class="point"><div class="pt-h">{tr("除外・上書き","Filtering")}</div><ul>
<li>{tr("ダメージの外れ値は四分位範囲（1.5×IQR）で除外","Damage outliers beyond 1.5×IQR removed")}</li>
<li>{tr("英雄と兵種の不一致、未実装世代の英雄は受付時に弾く","Hero/class mismatch and unreleased heroes rejected")}</li>
<li>{tr("同じブラウザ・同じ日からの再投稿は上書き","Same browser or same day: overwrite")}</li></ul></div>
<div class="point"><div class="pt-h">{tr("偏り","Bias")}</div><ul>
<li>{tr("このサイトの利用者＝熊狩りに熱心な層に偏ります","Skews toward this site’s users — engaged Bear Hunt players")}</li>
<li>{tr("サーバー全体の平均ではありません","Not a server-wide average")}</li></ul></div>
</div>

<h2>{tr("2. 理論最適構成","2. Theoretical best builds")}</h2>
<div class="point-grid">
<div class="point"><div class="pt-h">{tr("計算のしかた","How it is computed")}</div><ul>
<li>{tr("計算式は熊狩ダメージ・シミュレーターと同一（assets/bear-calc.js）","Same formula as the Bear Hunt Simulator (assets/bear-calc.js)")}</li>
<li>{tr("その世代で入手できる英雄を 盾×槍×弓 で総当たり","Brute force over all obtainable INF × LAN × MKS")}</li>
<li>{tr("英雄の遠征ステータスを加算（シミュレーターの「かんたん入力」とは前提が違います）","Hero expedition stats are added (unlike the simulator’s simple-input mode)")}</li>
<li>{tr("指数は各課金帯の1位を100とした相対値。絶対ダメージは出しません","Index relative to each tier’s #1 (=100). No absolute damage shown")}</li></ul></div>
<div class="point"><div class="pt-h">{tr("固定しているもの","Held fixed")}</div><ul>
<li>{tr("兵種比率：","Troop ratio: ")}{":".join(map(str, m["ratio"]))}{tr("（弓に大きく寄せた比率。ページには出しません）"," (heavily marksman-weighted, not shown)")}</li>
<li>{tr("参加者（乗り）：","Joiners: ")}{"・".join(HEROES[j]["name"] for j in m["joiner"])}</li>
<li>{tr("係数：シミュレーターの上級者パラメータの初期値","Coefficients: the simulator’s default advanced parameters")}</li></ul></div>
<div class="point" style="grid-column:1/-1"><div class="pt-h">{tr("課金帯モデル（暫定）","Spending-tier model (provisional)")}</div>
<div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border-collapse:collapse"><thead><tr><th>{tr("課金帯","Tier")}</th><th>{tr("課金限定英雄","Paid-only heroes")}</th><th>{tr("ルーレット以外のSSR上限","Non-wheel SSR cap")}</th><th>{tr("専用装備Lv","Gear Lv")}</th><th>{tr("火晶Lv","FC Lv")}</th><th>Tier</th></tr></thead><tbody>{tiers_rows}</tbody></table></div>
<ul style="margin-top:8px"><li>{tr("各世代の新英雄3体は入手経路が必ず3種類に分かれます：①ラッキールーレット（無課金でも入手可）②デイリー割引・氷原支配者・最強王国・英雄集結 ③英雄殿堂。第3世代以降はいずれも兵器工場ショップでも入手可（出典：アルテマ「英雄の入手先まとめ」）","Each generation’s three heroes come through three distinct routes: (1) Lucky Wheel (F2P-obtainable), (2) Daily Deals / Frostfield Ruler / Strongest Kingdom / Hero Gathering, (3) Hall of Heroes. From Gen 3 on, all three are also sold in the Foundry Shop (source: altema.jp)")}</li>
<li>{tr("ルーレット英雄は各世代1体、弓→盾→槍の順。無課金・微課金はこれが軸","One Lucky Wheel hero per generation, cycling MKS → INF → LAN — the backbone for F2P")}</li>
<li>{tr("ナタリア・ジェロニモは初回チャージ／VIP限定","Natalia and Jeronimo are first-purchase / VIP only")}</li>
<li>{tr("実測が集まったら各課金帯の中央値に置き換えます","Will be replaced by measured medians once data accumulates")}</li></ul></div>
</div>
<p class="note">{tr("理論値はモデル上の推定であり、実戦の記録ではありません。","Theoretical values are model estimates, not measurements.")}</p>

<h2>{tr("3. 世代の境界","3. Generation boundaries")}</h2>
<div class="card"><p style="font-size:13px">{tr("投稿フォームでは世代を直接選びます。参考として、サーバー開設からの経過日数の目安を示します。","The form asks for the generation directly. For reference, approximate days since server launch:")}</p>
<div style="overflow-x:auto"><table style="font-size:12.5px;border-collapse:collapse;min-width:260px"><thead><tr><th>{tr("世代","Gen")}</th><th>{tr("解放日（目安）","Unlock day (approx.)")}</th></tr></thead><tbody>{unlock_rows}</tbody></table></div>
<p class="note">{tr("出典：スマホゲームNavi「英雄世代の解放スケジュール」、アルテマ「サーバー経過日数と各コンテンツの解放時期」。","Sources: appmatch.jp generation schedule; altema.jp server-day unlock guide.")}</p></div>

<h2>{tr("4. 口コミ（ひとこと）","4. Reviews (one-liners)")}</h2>
<div class="card" style="font-size:13.5px"><ul class="kv-list">
<li>{tr("投稿フォームの「ひとこと」（最大200文字）と表示名（任意・最大16文字）を、構成・課金帯・投稿日と一緒に世代ページの口コミ欄へ新しい順に表示します（1世代100件まで）","The one-liner (up to 200 chars) and optional display name (16 chars) from the submission form are shown in the generation page’s Reviews block with the build, tier and date, newest first (up to 100 per generation)")}</li>
<li>{tr("URL・不適切な言葉を含む投稿は受付時に弾きます。通報が3件集まった口コミは自動で非表示になり、運営者が確認して戻すか消します","Posts containing links or abusive words are rejected. A review reported 3 times is hidden automatically until the operator reviews it")}</li>
<li>{tr("ダメージは「口コミにダメージを表示しない」にチェックすると口コミには出ません（統計の集計にだけ使われます）","Tick “Hide my damage in the review” and the damage is used only for aggregate stats, not shown in the review")}</li>
<li>{tr("投稿は世代ごとに1件ずつ持てます（第10世代と第12世代に別々の口コミを残せます）。同じ世代に同じブラウザから再投稿すると上書き（口コミも差し替え）。投稿フォームの「前回の投稿を削除する」で削除できます。運営者はガイドラインに反する口コミを予告なく非表示にすることがあります","You can keep one submission per generation (e.g. separate reviews for Gen 10 and Gen 12). Re-submitting the same generation from the same browser overwrites (review included); “Delete my previous submission” on the form removes it. The operator may hide reviews that violate the guidelines without notice")}</li></ul></div>

<h2>{tr("5. 投稿の削除","5. Deleting a submission")}</h2>
<div class="card" style="font-size:13.5px"><ul class="kv-list"><li>{tr("投稿時の編集キー（ブラウザに保存）で上書き・削除できます","Your edit key (saved in your browser) lets you update or delete")}</li>
<li>{tr("ブラウザを変えた場合は、編集キーの先頭6桁を添えて","If you switched browsers, contact us with the first 6 characters of the key: ")}<a href="/contact.html">{tr("お問い合わせ","Contact")}</a></li></ul></div>

<div class="relbar">
  <a href="/stats/index.html">→ {tr("世代別統計トップ","Generation stats")}</a>
  <a href="/submit/index.html">→ {tr("構成を投稿する","Submit your build")}</a>
  <a href="/privacy.html">→ {tr("プライバシーポリシー","Privacy policy")}</a>
</div>
</div>
"""
    crumb_en = '<a href="/en/index.html">Home</a> &gt; <a href="/en/stats/index.html">Generation stats</a> &gt; Methodology'
    return head(title_ja, desc_ja, path) + body + tail(tr, title_en, crumb_en, 'Methodology: <span class="acc">stats &amp; theory</span>', tr.m[lead_ja])

# ---------------- 投稿ページ ----------------
def build_submit():
    tr = Tr()
    path = "/submit/"
    title_ja = "熊狩り構成を投稿する｜世代別統計 | ホワサバ ツールラボ"
    title_en = "Submit Your Bear Hunt Build | Whiteout Tools Lab"
    desc_ja = "集結主の熊狩り構成（盾・槍・弓の英雄）を匿名で投稿。投稿するとすぐに、同世代内の順位と課金帯別の理論最適との差が分かります。"
    lead_ja = tr("世代・課金帯・英雄3人を選ぶだけ。個人を特定する情報は送信されません。",
                 "Pick your generation, tier and three heroes. Nothing identifying is sent.")
    body = f"""<div class="wrap">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別統計","Generation stats")}</a> &gt; {tr("構成を投稿","Submit")}</div>
<h1>{tr("熊狩り構成を","Submit your")} <span class="acc">{tr("投稿する","Bear Hunt build")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>
<ul class="kv-list" style="margin-bottom:14px">
<li>{tr("投稿するとすぐに、同じ世代の中での位置と、あなたの課金帯の理論最適との差が分かります","Right after submitting you see your rank in your generation and the gap to your tier’s theoretical best")}</li>
<li>{tr("投稿は世代ごとに1件。同じ世代に再投稿すると上書き、別の世代なら別の投稿になります","One submission per generation: re-submitting the same generation updates it, another generation adds a new one")}</li>
</ul>
<div id="submit-form"><div class="skel"></div><div class="skel" style="width:60%"></div></div>
<p class="note" style="margin-top:14px">{tr("熊狩ダメージ・シミュレーターの結果画面からも1クリックで投稿できます。","You can also submit straight from the Bear Hunt Simulator's result panel.")} <a href="/tools/bear-hunt/index.html">{tr("シミュレーターへ","Open the simulator")}</a></p>
<div class="relbar">
  <a href="/stats/index.html">→ {tr("世代別統計を見る","See generation stats")}</a>
  <a href="/stats/methodology.html">→ {tr("集計方法と計算の前提","Methodology")}</a>
</div>
</div>
"""
    crumb_en = '<a href="/en/index.html">Home</a> &gt; <a href="/en/stats/index.html">Generation stats</a> &gt; Submit'
    return head(title_ja, desc_ja, path) + body + tail(tr, title_en, crumb_en, 'Submit your <span class="acc">Bear Hunt build</span>', tr.m[lead_ja])

# ---------------- 運営者用: 口コミ管理 ----------------
def build_admin():
    tr = Tr()
    path = "/stats/admin.html"
    body = """<div class="wrap">
<div class="crumb"><a href="/index.html">ホーム</a> &gt; <a href="/stats/index.html">世代別 熊狩り構成</a> &gt; 口コミ管理</div>
<h1>口コミ<span class="acc">管理</span>（運営者用）</h1>
<p class="lead">通報された口コミの確認・非表示・再表示。合言葉（Worker の ADMIN_KEY）はこのブラウザに保存されます。</p>
<div class="step"><label>合言葉（ADMIN_KEY）</label><input type="password" id="adm-key" style="max-width:340px;width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:9px;font-size:14px">
<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="submit-btn" id="adm-load" style="padding:8px 16px;font-size:13px">読み込む</button>
<select id="adm-status" style="padding:8px;border:1px solid var(--line);border-radius:9px"><option value="reported">通報で非表示中</option><option value="hidden">運営者が非表示</option><option value="ok">表示中</option><option value="all" selected>すべて</option></select></div>
<div class="err" id="adm-err"></div></div>
<div id="adm-list"></div>
</div>
<script>
(function(){
  var $ = function(id){ return document.getElementById(id); };
  function api(){ return (window.WOS_API || '').replace(/\\/$/, ''); }   /* config.js は後から読み込まれるので使う時に参照 */
  var H = {}; function heroes(){ if(!Object.keys(H).length) (window.WOS_HEROES || []).forEach(function(h){ H[h.id] = h.name; }); return H; }
  var TL = { f2p:'無課金・微課金', mid:'中課金', whale:'石油王' }, SL = { ok:'表示中', reported:'通報で非表示', hidden:'運営者が非表示' };
  try{ $('adm-key').value = localStorage.getItem('wos_admin_key') || ''; }catch(e){}
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }
  function load(){
    var key = $('adm-key').value.trim(); if(!key){ $('adm-err').textContent = '合言葉を入れてください'; return; }
    try{ localStorage.setItem('wos_admin_key', key); }catch(e){}
    $('adm-err').textContent = ''; $('adm-list').innerHTML = '<div class="skel"></div>';
    if(!api()){ $('adm-err').textContent = '接続先（config.js の WOS_API）が読み込めていません'; return; }
    fetch(api() + '/v1/admin/reviews?key=' + encodeURIComponent(key) + '&status=' + $('adm-status').value, { mode:'cors' }).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ $('adm-err').textContent = j.error === 'forbidden' ? '合言葉が違うか、Worker に ADMIN_KEY が設定されていません' : '読み込めませんでした'; $('adm-list').innerHTML = ''; return; }
      if(!j.items.length){ $('adm-list').innerHTML = '<p class="note">該当する口コミはありません。</p>'; return; }
      $('adm-list').innerHTML = j.items.map(function(it){
        var d = new Date(it.at * 1000).toLocaleString('ja-JP');
        return '<div class="adm-item ' + esc(it.status) + '" data-id="' + esc(it.id) + '"><div class="adm-h"><span class="adm-st">' + (SL[it.status] || it.status) + '</span><span>通報 ' + it.reports + '</span><span>第' + it.gen + '世代 ／ ' + (TL[it.tier] || it.tier) + '</span><span>' + d + '</span><span>' + esc(it.nick || '匿名') + '</span></div>'
          + '<div style="font-size:12px;color:var(--muted)">盾' + esc(heroes()[it.inf] || it.inf) + '　槍' + esc(heroes()[it.lan] || it.lan) + '　弓' + esc(heroes()[it.mks] || it.mks) + '</div>'
          + '<div style="margin:4px 0;white-space:pre-wrap">' + esc(it.comment) + '</div>'
          + '<div class="adm-btns">' + (it.status === 'ok' ? '<button data-act="hide">非表示にする</button>' : '<button data-act="show">表示に戻す（通報数リセット）</button>') + '</div></div>';
      }).join('');
      $('adm-list').querySelectorAll('button[data-act]').forEach(function(b){
        b.onclick = function(){
          var id = b.closest('.adm-item').getAttribute('data-id'); b.disabled = true;
          fetch(api() + '/v1/admin/reviews/' + id, { method:'POST', mode:'cors', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ key: key, action: b.getAttribute('data-act') }) })
            .then(function(r){ return r.json(); }).then(function(){ load(); }).catch(function(){ b.disabled = false; });
        };
      });
    }).catch(function(){ $('adm-err').textContent = '通信エラー'; });
  }
  $('adm-load').onclick = load;
})();
</script>
"""
    h = head("口コミ管理（運営者用） | ホワサバ ツールラボ", "運営者用ページ", path).replace('<meta name="viewport"', '<meta name="robots" content="noindex,nofollow">\n<meta name="viewport"')
    return h + body + tail(tr, "Review admin | Whiteout Tools Lab", 'Admin', 'Review <span class="acc">admin</span>', 'Operator only.')

# ---------------- 書き出し ----------------
def write(rel, s):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(s); print("write:", rel)

write("stats/index.html", build_hub())
write("stats/methodology.html", build_methodology())
write("submit/index.html", build_submit())
write("stats/admin.html", build_admin())
for g in GENS:
    write(f"stats/{gen_dir(g)}/index.html", build_gen(g))
nopost = [HEROES[h]["name"] for h in HEROES if HEROES[h]["gen"] > 0 and not HEROES[h]["post"]]
if nopost:
    print("NOTE: 公式Xの投稿IDが未登録の英雄（検索リンクで代替中）:", "、".join(nopost), "→ assets/hero-posts.js に貼ると埋め込みに変わります")
print("DONE:", 3 + len(GENS), "pages")
