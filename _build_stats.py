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
V = "96"            # 共有アセットの版数
HV = "86"           # heroes.js の版数
UPDATED = "2026-09-02"
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
  leader:h.leader?h.leader.label:null, joiner:h.joiner?h.joiner.label:null, bearNoEffect:!!h.bearNoEffect, post:HP.url(h.id), search:HP.searchUrl(h.name)}));
console.log(JSON.stringify({heroes:H,unlock:GM.UNLOCK,tiers:GM.TIERS,skillEn:sb.window.WOS_SKILL_EN||{}}));
"""], cwd=ROOT, capture_output=True, text=True, check=True)
_d = json.loads(_dump.stdout)
HEROES = {h["id"]: h for h in _d["heroes"]}
UNLOCK = _d["unlock"]; TIERDEF = _d["tiers"]; SKILL_EN = _d["skillEn"]

CLS = ["inf", "lan", "mks"]
CLS_JA = {"inf": "盾", "lan": "槍", "mks": "弓"}
CLS_EN = {"inf": "INF", "lan": "LAN", "mks": "MKS"}
ACQ_JA = {"roulette": "ルーレット", "paid": "課金限定", "event": "イベント配布", "hall": "英雄殿堂", "common": "常設"}
ACQ_EN = {"roulette": "Roulette", "paid": "Paid only", "event": "Event", "hall": "Hall of Heroes", "common": "Permanent"}

class Tr:
    def __init__(self): self.m = {}
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
       "connect-src 'self' https://api.whitesim-lab.com https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.google-analytics.com; "
       "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://platform.twitter.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://www.googletagmanager.com; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; "
       "frame-src https://challenges.cloudflare.com https://platform.twitter.com https://syndication.twitter.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'none'")

def head(title_ja, desc_ja, path):
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
</head>
<body>
<div id="nav"></div>
"""

def tail(tr, title_en, crumb_en, h1_en, lead_en, extra_js=""):
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
var ub=document.getElementById('updbox'); if(ub) ub.innerHTML = WOS_UPDATEBOX({{date:'{UPDATED}',gen:{MAXG},note:'世代別統計セクション公開',note_en:'Generation stats section launched'}});
{extra_js}
</script>
<script>
window.addEventListener("DOMContentLoaded", function() {{
  if ((window.WOS_LANG || "ja") !== "en") return;
  var q = function(s) {{ return document.querySelector(s); }};
  document.getElementById("htmlroot").lang = "en";
  document.title = {json.dumps(title_en, ensure_ascii=False)};
  if (q("h1")) q("h1").innerHTML = {json.dumps(h1_en, ensure_ascii=False)};
  if (q(".lead")) q(".lead").innerHTML = {json.dumps(lead_en, ensure_ascii=False)};
  var TR = {tr.script()};
  function tr(s) {{ var k = s.replace(/\\s+/g, " ").trim(); var ar = k.indexOf("→ ") === 0 ? "→ " : ""; var kk = k.slice(ar.length); return TR[kk] != null ? s.replace(kk, TR[kk]) : s; }}
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  var nodes = [], n;
  while (n = w.nextNode()) nodes.push(n);
  nodes.forEach(function(node) {{
    var v = node.nodeValue; if (!v || !v.trim()) return;
    if (!/[\\u3041-\\u3096\\u30a1-\\u30f6\\u4e00-\\u9faf]/.test(v)) return;
    node.nodeValue = tr(v);
  }});
  document.querySelectorAll("[data-en]").forEach(function(el){{ el.innerHTML = el.getAttribute("data-en"); }});
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
    items.append((f"入手：{ACQ_JA[h['acq']]}" + ("（無課金でも入手可）" if h["acq"] == "roulette" else "（課金限定・無課金は不可）" if h["acq"] == "paid" else ""),
                  f"Source: {ACQ_EN[h['acq']]}" + (" (F2P-obtainable)" if h["acq"] == "roulette" else " (paid only)" if h["acq"] == "paid" else "")))
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
    if h["post"]:
        x = (f'<blockquote class="twitter-tweet" data-lang="ja" data-dnt="true"><a href="{h["post"]}">'
             f'{tr("公式X（@WOS_Japan）の英雄紹介を読み込み中…","Loading the official @WOS_Japan post…")}</a></blockquote>')
    else:
        x = (f'<a class="hc-xlink" href="{h["search"]}" target="_blank" rel="noopener">𝕏 '
             f'{tr("公式アカウントの英雄紹介を探す","Find the official hero post")}</a>')
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

def compare_section(g, tr):
    e = theory["gens"][str(g)]
    tabs = f'<div class="tier-tabs" data-group="cmp" data-default="{DEFAULT_TIER}">' + "".join(
        f'<button type="button" data-tier="{t["key"]}">{tr(t["label"], t["label_en"])}</button>' for t in TIERS) + '</div>'
    panes = ""
    for t in TIERS:
        b = e["byTier"][t["key"]]; td = TIERDEF[t["key"]]
        hs, gr, fc = td["hallSlots"], td["gear"], td["fc"]
        paid_ja, paid_en = ("あり", "included") if td["paid"] else ("なし", "excluded")
        assump = (f'<ul class="kv-list"><li>{tr("課金限定英雄：","Paid-only heroes: ")}{tr(paid_ja, paid_en)}</li>'
                  f'<li>{tr("英雄殿堂で集めるSSR：","Hall-of-Heroes SSRs: ")}{tr(str(hs) + "枠まで", "up to " + str(hs))}</li>'
                  f'<li>{tr("専用装備 Lv","Gear Lv")}{gr} ／ {tr("火晶 Lv","FC Lv")}{fc}</li></ul>')
        cols = ""
        for c in CLS:
            cols += (f'<div class="cmp-col"><h4>{cls_badge(c)}{tr(CLS_JA[c] + "枠", CLS_EN[c] + " slot")}</h4><div class="cmp-half">'
                     f'<div><div class="lab th">{tr("理論","THEORY")}</div>{theory_rank_list(b["slotRank"][c])}</div>'
                     f'<div><div class="lab lv">{tr("実測","LIVE")}</div><div data-live="slot" data-tier="{t["key"]}" data-cls="{c}"><div class="skel"></div><div class="skel" style="width:70%"></div></div></div>'
                     f'</div></div>')
        trio = (f'<div class="cmp-trio"><h4>{tr("3人の組み合わせ TOP3","Top-3 trios")} <span data-live="srctag" data-tier="{t["key"]}"></span></h4><div class="cmp-half">'
                f'<div><div class="lab th">{tr("理論","THEORY")}</div>{theory_trio_list(b["top"])}</div>'
                f'<div><div class="lab lv">{tr("実測","LIVE")}</div><div data-live="trio" data-tier="{t["key"]}"><div class="skel"></div></div></div></div></div>')
        panes += f'<div class="tier-pane" data-group="cmp" data-tier="{t["key"]}"><div class="tier-desc">{assump}</div><div class="cmp-grid">{cols}</div>{trio}</div>'
    return f"""<h2>{tr("理論 vs 実測","Theory vs Live")}</h2>
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
    return f"""<h2>{tr("次の世代でどうする？","What to do next generation")}</h2>
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
def build_gen(g):
    tr = Tr()
    e = theory["gens"][str(g)]
    path = f"/stats/{gen_dir(g)}/"
    title_ja = f"第{g}世代の熊狩り構成｜英雄評価・理論最適 vs 実測 | ホワサバ ツールラボ"
    title_en = f"Gen {g} Bear Hunt Builds: Hero Verdicts, Theory vs Live | Whiteout Tools Lab"
    desc_ja = f"ホワサバ第{g}世代の熊狩り（集結主）構成。この世代の英雄3体の熊狩評価、課金帯別の理論最適構成と利用者の実測採用率の対比、次世代への乗り換え予測。"
    lead_ja = tr(f"第{g}世代の英雄は熊狩りでどう使う？ 理論上の最適構成と、みんなが実際に使っている構成を並べて確認できます。",
                 f"How to use Gen {g} heroes in Bear Hunt: the theoretical best builds side by side with what players actually run.")
    h1_en = f'Gen {g} <span class="acc">Bear Hunt Builds</span>'
    heroes = "".join(hero_card(h["id"], g, tr) for h in sorted(e["heroes"], key=lambda x: CLS.index(x["cls"])))
    prev_g, next_g = (g - 1 if g > 1 else None), (g + 1 if g < MAXG else None)
    prevnext = ('<div class="gen-prevnext">'
        + (f'<a href="/stats/{gen_dir(prev_g)}/index.html">← {tr(f"第{prev_g}世代", f"Gen {prev_g}")}</a>' if prev_g else "<span></span>")
        + f'<a href="/stats/index.html">{tr("世代一覧","All generations")}</a>'
        + (f'<a href="/stats/{gen_dir(next_g)}/index.html">{tr(f"第{next_g}世代", f"Gen {next_g}")} →</a>' if next_g else "<span></span>") + '</div>')
    body = f"""<div class="wrap wide" data-live-page="{g}">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別統計","Generation stats")}</a> &gt; {tr(f"第{g}世代", f"Gen {g}")}</div>
<h1>{tr(f"第{g}世代の", f"Gen {g}")} <span class="acc">{tr("熊狩り構成","Bear Hunt Builds")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>
{gen_strip(g)}

<h2>{tr("この世代の英雄","This generation’s heroes")}</h2>
<p class="sec-lead">{tr("公式X（@WOS_Japan）の紹介投稿と、熊狩り（集結主）としての判定。","Official @WOS_Japan posts plus a Bear Hunt rally-leader verdict for each.")}</p>
<div class="hero-cards">{heroes}</div>

{compare_section(g, tr)}
{next_section(g, tr)}
{points_section(g, tr)}

<div class="callout" style="background:#fff;border:1px solid var(--line)"><span>📝</span><div>{tr("あなたの構成も投稿すると、この世代の実測に反映されます。投稿後すぐに、同世代内の位置と理論最適との差が分かります。","Submit your build to be counted here. You'll immediately see your rank in this generation and how it compares with the theoretical best.")}
 <a class="btn" style="margin-left:10px;padding:6px 14px;font-size:12px" href="/submit/index.html?gen={g}">{tr("投稿する","Submit")}</a></div></div>
<div class="relbar">
  <a href="/tools/bear-hunt/index.html">→ {tr("熊狩ダメージ・シミュレーター","Bear Hunt Simulator")}</a>
  <a href="/guides/leader-formation.html">→ {tr("集結主におすすめの編成と英雄の選び方","Rally leader: recommended formations")}</a>
  <a href="/stats/methodology.html">→ {tr("集計方法と計算の前提","Methodology")}</a>
</div>
{prevnext}
</div>
"""
    crumb_en = f'<a href="/en/index.html">Home</a> &gt; <a href="/en/stats/index.html">Generation stats</a> &gt; Gen {g}'
    return head(title_ja, desc_ja, path) + body + tail(tr, title_en, crumb_en, h1_en, tr.m[lead_ja])

# ---------------- ハブ ----------------
def build_hub():
    tr = Tr()
    path = "/stats/"
    title_ja = "世代別 熊狩り構成の統計｜英雄評価・理論最適 vs 実測 | ホワサバ ツールラボ"
    title_en = "Bear Hunt Builds by Generation: Hero Verdicts, Theory vs Live | Whiteout Tools Lab"
    desc_ja = "ホワサバの熊狩り（集結主）構成を世代ごとに。各世代の英雄の熊狩評価、課金帯別の理論最適構成、利用者の実測採用率を1ページで比較できます。"
    lead_ja = tr("自分の世代を選ぶと、その世代の英雄の熊狩評価・理論最適構成・みんなの実測構成が1ページで見られます。",
                 "Pick your generation to see hero verdicts, theoretical best builds and what players actually run — all on one page.")
    cards = ""
    for g in GENS:
        e = theory["gens"][str(g)]
        rou = next((HEROES[h["id"]] for h in e["heroes"] if h["acq"] == "roulette"), None)
        best = e["byTier"]["whale"]["top"][0]["ids"]
        heroes3 = " ".join(hero_html(h["id"], True) for h in sorted(e["heroes"], key=lambda x: CLS.index(x["cls"])))
        cards += (f'<a class="gen-card" href="/stats/{gen_dir(g)}/index.html">'
                  f'<div class="gc-t">{tr(f"第{g}世代", f"Gen {g}")}<span class="gc-n">{tr("投稿","posts")} <span data-gen-n="{g}">—</span></span></div>'
                  f'<div class="gc-row"><b>{tr("英雄","Heroes")}</b>{heroes3}</div>'
                  f'<div class="gc-row"><b>{tr("理論最適","Best")}</b>{" ".join(hero_html(h, True) for h in best)}</div></a>')
    body = f"""<div class="wrap wide">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; {tr("世代別統計","Generation stats")}</div>
<h1>{tr("世代別","By generation")} <span class="acc">{tr("熊狩り構成の統計","Bear Hunt Build Stats")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>
<div class="callout" style="background:#fff;border:1px solid var(--line)"><span>📊</span><div>{tr("総投稿数 ","Total submissions: ")}<b data-total-n>—</b>{tr(" 件。実測は世代ごとに10件から公開。理論最適は投稿数に関係なく全世代で見られます。"," — live stats open at 10 per generation. Theory is available for every generation.")}
 <a class="btn" style="margin-left:10px;padding:6px 14px;font-size:12px" href="/submit/index.html">{tr("構成を投稿する","Submit a build")}</a></div></div>
<h2>{tr("世代を選ぶ","Choose a generation")}</h2>
<div class="gen-cards">{cards}</div>
<h2>{tr("各ページに載っているもの","What each page shows")}</h2>
<div class="point-grid">
<div class="point"><div class="pt-h"><span class="ic">🆕</span>{tr("この世代の英雄","This generation’s heroes")}</div><ul>
<li>{tr("公式X（@WOS_Japan）の紹介投稿","Official @WOS_Japan post")}</li>
<li>{tr("熊狩り（集結主）としての判定：乗り換え推奨／有力候補／据え置きで可／熊狩では不要","Bear Hunt verdict: swap in / strong option / keep current / not for Bear Hunt")}</li>
<li>{tr("集結主スキル・理論順位・入手経路","Leader skill, theoretical rank, source")}</li></ul></div>
<div class="point"><div class="pt-h"><span class="ic">⚖️</span>{tr("理論 vs 実測","Theory vs Live")}</div><ul>
<li>{tr("盾・槍・弓それぞれの英雄ランキングを左右で対比","Per-slot hero rankings side by side")}</li>
<li>{tr("理論：シミュレーターの式で総当たり（1位=100の指数）","Theory: brute force with the simulator formula (index, #1 = 100)")}</li>
<li>{tr("実測：利用者の投稿の採用率（％）","Live: pick rate from submissions (%)")}</li>
<li>{tr("課金帯タブで切替（無課金・微課金／中課金／石油王）","Switch tiers: F2P / mid / whale")}</li></ul></div>
<div class="point"><div class="pt-h"><span class="ic">⏭️</span>{tr("次の世代でどうする？","Next generation")}</div><ul>
<li>{tr("次世代が来たとき、どの枠を替えると何％伸びるか","Which slot to swap next gen and the expected gain")}</li>
<li>{tr("無課金は3世代に1回しか各枠を更新できないので、ここが計画の要","F2P can refresh each slot only every 3 generations — plan around it")}</li></ul></div>
</div>
<div class="relbar">
  <a href="/submit/index.html">→ {tr("構成を投稿する","Submit your build")}</a>
  <a href="/tools/bear-hunt/index.html">→ {tr("熊狩ダメージ・シミュレーター","Bear Hunt Simulator")}</a>
  <a href="/stats/methodology.html">→ {tr("集計方法と計算の前提","Methodology")}</a>
</div>
</div>
"""
    crumb_en = '<a href="/en/index.html">Home</a> &gt; Generation stats'
    return head(title_ja, desc_ja, path) + body + tail(tr, title_en, crumb_en, 'By generation <span class="acc">Bear Hunt Build Stats</span>', tr.m[lead_ja])

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
<div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border-collapse:collapse"><thead><tr><th>{tr("課金帯","Tier")}</th><th>{tr("課金限定英雄","Paid-only heroes")}</th><th>{tr("殿堂SSRの上限","Hall SSR cap")}</th><th>{tr("専用装備Lv","Gear Lv")}</th><th>{tr("火晶Lv","FC Lv")}</th><th>Tier</th></tr></thead><tbody>{tiers_rows}</tbody></table></div>
<ul style="margin-top:8px"><li>{tr("ルーレット英雄（無課金でも入手可）は各世代1体、弓→盾→槍の順","Roulette hero (F2P-obtainable): one per generation, cycling MKS → INF → LAN")}</li>
<li>{tr("ナタリア・ジェロニモは初回チャージ／VIP限定","Natalia and Jeronimo are first-purchase / VIP only")}</li>
<li>{tr("実測が集まったら各課金帯の中央値に置き換えます","Will be replaced by measured medians once data accumulates")}</li></ul></div>
</div>
<p class="note">{tr("理論値はモデル上の推定であり、実戦の記録ではありません。","Theoretical values are model estimates, not measurements.")}</p>

<h2>{tr("3. 世代の境界","3. Generation boundaries")}</h2>
<div class="card"><p style="font-size:13px">{tr("投稿フォームでは世代を直接選びます。参考として、サーバー開設からの経過日数の目安を示します。","The form asks for the generation directly. For reference, approximate days since server launch:")}</p>
<div style="overflow-x:auto"><table style="font-size:12.5px;border-collapse:collapse;min-width:260px"><thead><tr><th>{tr("世代","Gen")}</th><th>{tr("解放日（目安）","Unlock day (approx.)")}</th></tr></thead><tbody>{unlock_rows}</tbody></table></div>
<p class="note">{tr("出典：スマホゲームNavi「英雄世代の解放スケジュール」、アルテマ「サーバー経過日数と各コンテンツの解放時期」。","Sources: appmatch.jp generation schedule; altema.jp server-day unlock guide.")}</p></div>

<h2>{tr("4. 投稿の削除","4. Deleting a submission")}</h2>
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
<li>{tr("投稿はブラウザに紐づいて保存され、次回は上書きになります","Saved to this browser; your next submission updates it")}</li>
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

# ---------------- 書き出し ----------------
def write(rel, s):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(s); print("write:", rel)

write("stats/index.html", build_hub())
write("stats/methodology.html", build_methodology())
write("submit/index.html", build_submit())
for g in GENS:
    write(f"stats/{gen_dir(g)}/index.html", build_gen(g))
nopost = [HEROES[h]["name"] for h in HEROES if HEROES[h]["gen"] > 0 and not HEROES[h]["post"]]
if nopost:
    print("NOTE: 公式Xの投稿IDが未登録の英雄（検索リンクで代替中）:", "、".join(nopost), "→ assets/hero-posts.js に貼ると埋め込みに変わります")
print("DONE:", 3 + len(GENS), "pages")
