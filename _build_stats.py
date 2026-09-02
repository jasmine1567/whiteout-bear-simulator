#!/usr/bin/env python3
"""統計セクションのページ生成
   入力: assets/theory.json（node _solve_theory.js の出力）, assets/heroes.js, assets/gen-map.js, _stats_notes/gen-NN.md（任意・手書き解説）
   出力: stats/index.html, stats/gen-01..16/index.html, stats/methodology.html, submit/index.html
   実行順: node _solve_theory.js → python3 _build_stats.py → python3 _build_lang.py → python3 _build_sitemap.py
"""
import os, re, json, html, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://whitesim-lab.com"
V = "96"            # 共有アセットの版数（toolkit/config/stats.*）
HV = "86"           # heroes.js の版数
UPDATED = "2026-09-02"
NOTES_DIR = os.path.join(ROOT, "_stats_notes")

theory = json.load(open(os.path.join(ROOT, "assets/theory.json"), encoding="utf-8"))
GENS = sorted(int(g) for g in theory["gens"])
MAXG = max(GENS)
TIERS = theory["tiers"]                        # [{key,label,label_en,...}]
TIER_KEYS = [t["key"] for t in TIERS]

# heroes.js / gen-map.js は Node で読む（ブラウザ用の形式なので）
_dump = subprocess.run(["node", "-e", """
const fs=require('fs'),vm=require('vm');const sb={console};sb.window=sb;vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/heroes.js','utf8'),sb);
const GM=require('./assets/gen-map.js');
const H=sb.window.WOS_HEROES.map(h=>({id:h.id,name:h.name,en:(sb.window.WOS_HERO_EN||{})[h.id]||h.id,cls:h.cls,gen:h.gen,rar:h.rar,acq:GM.acqOf(h)}));
console.log(JSON.stringify({heroes:H,unlock:GM.UNLOCK,tiers:GM.TIERS}));
"""], cwd=ROOT, capture_output=True, text=True, check=True)
_d = json.loads(_dump.stdout)
HEROES = {h["id"]: h for h in _d["heroes"]}
UNLOCK = _d["unlock"]
TIERDEF = _d["tiers"]

CLS_JA = {"inf": "盾", "lan": "槍", "mks": "弓"}
CLS_EN = {"inf": "INF", "lan": "LAN", "mks": "MKS"}
ACQ_JA = {"roulette": "ルーレット", "paid": "課金限定", "event": "イベント配布", "hall": "英雄殿堂", "common": "常設"}
ACQ_EN = {"roulette": "Roulette", "paid": "Paid only", "event": "Event", "hall": "Hall of Heroes", "common": "Permanent"}

# ---------------- 翻訳辞書（ページごとに使った文字列だけを出力） ----------------
class Tr:
    def __init__(self): self.m = {}
    def __call__(self, ja, en):
        self.m[ja] = en; return ja
    def script(self):
        return json.dumps(self.m, ensure_ascii=False)

def esc(s): return html.escape(str(s), quote=True)
def hero_html(hid, with_cls=False):
    h = HEROES[hid]
    cls = f'<span class="cls">{CLS_JA[h["cls"]]}</span>' if with_cls else ""
    return f'<span data-hero="{hid}">{cls}{esc(h["name"])}<span class="g">G{h["gen"]}</span></span>'
def gen_dir(g): return f"gen-{g:02d}"
def gen_ja(g): return f"第{g}世代"
def fmt(n): return f"{int(n):,}"

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
       "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://www.googletagmanager.com; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; "
       "frame-src https://challenges.cloudflare.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'none'")

def head(title_ja, desc_ja, path, extra_css=""):
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
{extra_css}<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=85">
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
    """フッター・共通スクリプト・EN化スクリプト"""
    return f"""<div id="foot"></div>
<script src="/assets/config.js?v={V}"></script>
<script src="/assets/toolkit.js?v={V}"></script>
<script src="/assets/heroes.js?v={HV}"></script>
<script src="/assets/gen-map.js?v={V}"></script>
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
  var crumb = document.querySelector(".crumb");
  if (crumb) crumb.innerHTML = {json.dumps(crumb_en, ensure_ascii=False)};
}});
</script></body>
</html>
"""

# ---------------- 部品 ----------------
def gen_strip(cur, tr, with_counts=False):
    out = ['<div class="gen-strip">']
    for g in GENS:
        cls = ' class="on"' if g == cur else ""
        n = f'<span class="n" data-gen-n="{g}"></span>' if with_counts else ""
        out.append(f'<a href="/stats/{gen_dir(g)}/index.html"{cls}>G{g}{n}</a>')
    out.append('</div>')
    return "".join(out)

def comp_list(top, tr, limit=5):
    if not top: return f'<p class="note">{tr("計算対象がありません。","No candidates.")}</p>'
    best = top[0]["score"]
    out = ['<div class="comp-list">']
    for i, c in enumerate(top[:limit]):
        idx = round(c["score"] / best * 100)
        out.append(f'<div class="comp{" top" if i == 0 else ""}"><span class="rk">{i+1}</span><span class="heroes">'
                   + "".join(hero_html(h, True) for h in c["ids"])
                   + f'</span><span class="sc" title="{fmt(c["score"])}">{idx}<small>{tr("理論指数","index")}</small></span>'
                   + f'<span class="bar"><i style="width:{idx}%"></i></span></div>')
    out.append('</div>')
    return "".join(out)

def next_box(nx, tr):
    if not nx: return ""
    if not nx["changed"]:
        return (f'<div class="next-box"><b class="t">{tr("次の世代（第", "Next generation (Gen ")}{nx["gen"]}{tr("世代）が来たら", ")")}</b>'
                f'{tr("理論最適構成は変わりません。この世代の構成のまま育成を続けるのが最も効率的です。", "The theoretical best does not change. Keep investing in the current trio.")}</div>')
    slots = " ".join(f'<span class="slot-tag">{CLS_JA[c]}</span>' for c in nx["changed"])
    to = " ".join(hero_html(nx["to"][["inf","lan","mks"].index(c)], True) for c in nx["changed"])
    return (f'<div class="next-box"><b class="t">{tr("次の世代（第", "Next generation (Gen ")}{nx["gen"]}{tr("世代）が来たら", ")")}</b>'
            f'{tr("乗り換え枠：", "Slot to swap: ")}{slots} → {to}'
            f'<br>{tr("理論ダメージの伸び：", "Theoretical gain: ")}<span class="gain">+{nx["gainPct"]}%</span>'
            f'<span class="note">（{tr("理論指数ベース・推定", "model estimate")}）</span></div>')

def read_note(g):
    """_stats_notes/gen-NN.md → (ja_html, en_html)。無ければ (None, None)"""
    p = os.path.join(NOTES_DIR, f"{gen_dir(g)}.md")
    if not os.path.exists(p): return None, None
    raw = open(p, encoding="utf-8").read()
    ja, _, en = raw.partition("\n---en---\n")
    def md(s):
        s = s.strip()
        if not s: return None
        paras = [p.strip() for p in re.split(r"\n\s*\n", s) if p.strip()]
        out = []
        for p in paras:
            p = esc(p)
            p = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", p)
            out.append("<p>" + p.replace("\n", "<br>") + "</p>")
        return "".join(out)
    return md(ja), md(en)

def auto_note(g):
    """解説文が無いときの自動生成文（データから読める事実だけを書く）"""
    e = theory["gens"][str(g)]
    lines_ja, lines_en = [], []
    for tk in TIER_KEYS:
        b = e["byTier"][tk]; top = b["top"][0]
        lab = next(t for t in TIERS if t["key"] == tk)
        names_ja = "／".join(f'{CLS_JA[HEROES[h]["cls"]]}{HEROES[h]["name"]}(G{HEROES[h]["gen"]})' for h in top["ids"])
        names_en = " / ".join(f'{CLS_EN[HEROES[h]["cls"]]} {HEROES[h]["en"]} (G{HEROES[h]["gen"]})' for h in top["ids"])
        lines_ja.append(f"<b>{lab['label']}</b>の理論最適は {names_ja}。")
        lines_en.append(f"<b>{lab['label_en']}</b>: theoretical best is {names_en}.")
        nx = b.get("next")
        if nx and nx["changed"]:
            sl_ja = "・".join(CLS_JA[c] for c in nx["changed"]); sl_en = "/".join(CLS_EN[c] for c in nx["changed"])
            lines_ja.append(f"次の第{nx['gen']}世代では{sl_ja}枠を替えると理論値が約{nx['gainPct']}%伸びます。")
            lines_en.append(f"In Gen {nx['gen']}, swapping the {sl_en} slot raises the theoretical value by about {nx['gainPct']}%.")
        elif nx:
            lines_ja.append(f"第{nx['gen']}世代になっても理論最適は変わりません。")
            lines_en.append(f"The theoretical best stays the same in Gen {nx['gen']}.")
    rou = [h for h in e["heroes"] if h["acq"] == "roulette"]
    if rou:
        r = HEROES[rou[0]["id"]]
        lines_ja.append(f"この世代のルーレット英雄は{CLS_JA[r['cls']]}の{r['name']}。無課金・微課金はこの枠が更新の機会です。")
        lines_en.append(f"This generation's roulette hero is {r['en']} ({CLS_EN[r['cls']]}) — the upgrade window for F2P players.")
    return "<p>" + " ".join(lines_ja) + "</p>", "<p>" + " ".join(lines_en) + "</p>"

# ---------------- 世代ページ ----------------
def build_gen(g):
    tr = Tr()
    e = theory["gens"][str(g)]
    path = f"/stats/{gen_dir(g)}/"
    rf, rt = e["rangeFrom"], e["rangeTo"]
    period_ja = f"サーバー{rf}日目〜" + (f"{rt}日目" if rt else "")
    period_en = f"Server day {rf}–" + (f"{rt}" if rt else "")
    best_whale = e["byTier"]["whale"]["top"][0]["ids"]
    best_f2p = e["byTier"]["f2p"]["top"][0]["ids"]
    title_ja = f"第{g}世代環境の熊狩り構成｜採用率と理論最適（課金帯別） | ホワサバ ツールラボ"
    title_en = f"Gen {g} Bear Hunt Builds: Pick Rates & Theoretical Best by Spending Tier | Whiteout Tools Lab"
    desc_ja = (f"ホワサバ第{g}世代環境（{period_ja}）の集結主・熊狩り構成。盾・槍・弓それぞれの採用率（実測）と、"
               f"無課金・中課金・石油王ごとの理論最適構成、次世代への乗り換え予測をまとめました。")
    lead_ja = tr(f"{period_ja}の環境で、集結主が盾・槍・弓に誰を置いているか。利用者の投稿から集計した<b>実測の採用率</b>と、熊狩シミュレーターの計算式で総当たりした<b>理論上の最適構成</b>を、課金帯ごとに並べて見られます。",
                 f"Who rally leaders put in the INF / LAN / MKS slots in the {period_en} environment. Compare <b>measured pick rates</b> from user submissions with the <b>theoretical best</b> computed by brute force from the simulator's formula, per spending tier.")
    h1_en = f'Gen {g} <span class="acc">Bear Hunt Builds</span>'

    # 概要
    heroes_html = "".join(
        f'<div><b>{tr("この世代の" + CLS_JA[h["cls"]] + "英雄", "New " + CLS_EN[h["cls"]] + " hero")}</b>{hero_html(h["id"])}'
        f'<span class="acq {h["acq"]}">{tr(ACQ_JA[h["acq"]], ACQ_EN[h["acq"]])}</span></div>'
        for h in sorted(e["heroes"], key=lambda x: ["inf","lan","mks"].index(x["cls"])))
    overview = f"""<div class="card">
<div class="gen-meta">
<div><b>{tr("解放の目安","Unlock (approx.)")}</b>{tr(f"サーバー開設 {e['unlockDay']} 日目〜", f"Day {e['unlockDay']} after server launch")}</div>
<div><b>{tr("この世代環境の期間","Period")}</b>{tr(period_ja, period_en)}</div>
{heroes_html}
</div>
<p class="note">{tr("解放日はサーバーや運営の調整で前後します。推定値としてご覧ください。","Unlock timing varies by server; treat as an estimate.")}</p>
</div>"""

    # 理論パート
    tabs = '<div class="tier-tabs" data-group="theory">' + "".join(
        f'<button type="button" data-tier="{t["key"]}">{tr(t["label"], t["label_en"])}</button>' for t in TIERS) + '</div>'
    panes = ""
    for t in TIERS:
        b = e["byTier"][t["key"]]
        td = TIERDEF[t["key"]]
        desc = tr(f"前提：課金限定英雄{'あり' if td['paid'] else 'なし'}／英雄殿堂で集めるSSRは{td['hallSlots']}枠まで／専用装備Lv{td['gear']}／火晶Lv{td['fc']}／候補 {b['evaluated']:,} 通りを総当たり",
                  f"Assumptions: paid-only heroes {'allowed' if td['paid'] else 'excluded'} / up to {td['hallSlots']} Hall-of-Heroes SSR / gear Lv{td['gear']} / FC Lv{td['fc']} / {b['evaluated']:,} combinations evaluated")
        panes += f'<div class="tier-pane" data-group="theory" data-tier="{t["key"]}"><p class="tier-desc">{desc}</p>{comp_list(b["top"], tr)}{next_box(b.get("next"), tr)}</div>'
    theory_sec = f"""<h2>{tr("理論上の最適構成（課金帯別）","Theoretical best builds by spending tier")}</h2>
<p style="font-size:13px">{tr("その世代で入手できる英雄を盾×槍×弓で総当たりし、熊狩シミュレーターと同じ計算式で期待ダメージが最も高くなる組み合わせを出しています。理論指数は各課金帯の1位を100とした相対値です。","All obtainable INF × LAN × MKS combinations for this generation are evaluated with the same formula as the Bear Hunt Simulator. The index is relative to the #1 build in each tier (=100).")}</p>
{tabs}{panes}
<p class="note">{tr("兵種比率はページには出していません（計算上は弓に大きく寄せた比率で固定）。比率の最適化は熊狩シミュレーターをお使いください。","Troop ratio is fixed internally (heavily marksman-weighted) and not shown. Use the simulator to optimize your ratio.")} <a href="/stats/methodology.html">{tr("計算の前提","Methodology")}</a></p>"""

    # 実測パート
    live_sec = f"""<h2>{tr("みんなの実測（同世代の集結主）","Live stats from rally leaders in this generation")}</h2>
<div id="live" data-gen="{g}"><div class="skel"></div><div class="skel" style="width:70%"></div><div class="skel" style="width:85%"></div></div>"""

    # 解説
    nj, ne = read_note(g)
    aj, ae = auto_note(g)
    note_ja = nj or aj
    note_en = ne or ae
    note_sec = f"""<h2>{tr("この世代の見どころ","Takeaways for this generation")}</h2>
<div class="card" id="note-ja">{note_ja}</div>
<div class="card" id="note-en" style="display:none">{note_en}</div>"""

    prev_g, next_g = (g - 1 if g > 1 else None), (g + 1 if g < MAXG else None)
    prevnext = '<div class="gen-prevnext">' \
        + (f'<a href="/stats/{gen_dir(prev_g)}/index.html">← {tr(f"第{prev_g}世代", f"Gen {prev_g}")}</a>' if prev_g else "<span></span>") \
        + f'<a href="/stats/index.html">{tr("世代一覧","All generations")}</a>' \
        + (f'<a href="/stats/{gen_dir(next_g)}/index.html">{tr(f"第{next_g}世代", f"Gen {next_g}")} →</a>' if next_g else "<span></span>") + '</div>'

    body = f"""<div class="wrap wide">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別統計","Generation stats")}</a> &gt; {tr(f"第{g}世代", f"Gen {g}")}</div>
<h1>{tr(f"第{g}世代環境の", f"Gen {g}")} <span class="acc">{tr("熊狩り構成","Bear Hunt Builds")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>
{gen_strip(g, tr, True)}
{overview}
{theory_sec}
{live_sec}
{note_sec}
<div class="relbar">
  <a href="/submit/index.html?gen={g}">→ {tr("この世代の構成を投稿する","Submit your build")}</a>
  <a href="/tools/bear-hunt/index.html">→ {tr("熊狩ダメージ・シミュレーター","Bear Hunt Simulator")}</a>
  <a href="/guides/leader-formation.html">→ {tr("集結主におすすめの編成と英雄の選び方","Rally leader: recommended formations")}</a>
  <a href="/stats/methodology.html">→ {tr("集計方法と計算の前提","Methodology")}</a>
</div>
{prevnext}
</div>
"""
    extra_js = "if((window.WOS_LANG||'ja')==='en'){var a=document.getElementById('note-ja'),b=document.getElementById('note-en');if(a&&b){a.style.display='none';b.style.display='';}}"
    crumb_en = f'<a href="/en/index.html">Home</a> &gt; <a href="/en/stats/index.html">Generation stats</a> &gt; Gen {g}'
    lead_en = tr.m[lead_ja]
    return head(title_ja, desc_ja, path) + body + tail(tr, title_en, crumb_en, h1_en, lead_en, extra_js)

# ---------------- ハブ ----------------
def build_hub():
    tr = Tr()
    path = "/stats/"
    title_ja = "世代別 熊狩り構成の統計｜盾・槍・弓の採用率と理論最適 | ホワサバ ツールラボ"
    title_en = "Bear Hunt Builds by Generation: Pick Rates & Theoretical Best | Whiteout Tools Lab"
    desc_ja = "ホワサバの集結主・熊狩り構成を世代ごとに集計。利用者の投稿から盾・槍・弓の採用率を出し、課金帯別の理論最適構成と並べて公開しています。"
    lead_ja = tr("同じ世代・同じ課金帯の集結主が、盾・槍・弓に誰を置いているか。利用者の投稿を世代ごとに集計し、熊狩シミュレーターの計算式で出した<b>理論上の最適構成</b>と並べています。自分の世代を選んでください。",
                 "Who rally leaders in your generation and spending tier put in each slot. User submissions are aggregated per generation and shown alongside the <b>theoretical best</b> from the simulator's formula. Pick your generation.")
    cards = ""
    for g in GENS:
        e = theory["gens"][str(g)]
        rt = e["rangeTo"]
        per = f"{e['rangeFrom']}〜{rt}日" if rt else f"{e['rangeFrom']}日〜"
        per_en = f"Day {e['rangeFrom']}–{rt}" if rt else f"Day {e['rangeFrom']}+"
        rou = next((HEROES[h["id"]] for h in e["heroes"] if h["acq"] == "roulette"), None)
        best = e["byTier"]["whale"]["top"][0]["ids"]
        cards += (f'<a class="tool-tile" href="/stats/{gen_dir(g)}/index.html" style="text-decoration:none;color:inherit">'
                  f'<div style="font-weight:800;font-size:15px;color:var(--frost)">{tr(f"第{g}世代", f"Gen {g}")}<span class="note" style="margin-left:8px">{tr(per, per_en)}</span></div>'
                  f'<div style="font-size:12px;margin:4px 0">{tr("ルーレット英雄：","Roulette hero: ")}{hero_html(rou["id"]) if rou else "—"}</div>'
                  f'<div style="font-size:12px">{tr("理論最適（石油王）：","Theoretical best (whale): ")}{" ".join(hero_html(h, True) for h in best)}</div>'
                  f'<div class="note" style="margin-top:4px">{tr("投稿数 ","Submissions: ")}<span data-gen-n="{g}">—</span></div></a>')
    body = f"""<div class="wrap wide">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; {tr("世代別統計","Generation stats")}</div>
<h1>{tr("世代別","By generation")} <span class="acc">{tr("熊狩り構成の統計","Bear Hunt Build Stats")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>
<div class="callout" style="background:#fff;border:1px solid var(--line)"><span>📊</span><div>{tr("総投稿数 ","Total submissions: ")}<b data-total-n>—</b>{tr(" 件。各世代は10件以上で実測を公開します。理論最適構成は投稿数に関係なく全世代で見られます。"," — live stats open at 10 per generation. Theoretical builds are available for every generation regardless.")}
 <a class="btn" style="margin-left:10px;padding:6px 14px;font-size:12px" href="/submit/index.html">{tr("構成を投稿する","Submit a build")}</a></div></div>
<h2>{tr("世代を選ぶ","Choose a generation")}</h2>
<div class="tool-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">{cards}</div>
<h2>{tr("このページの見かた","How to read these pages")}</h2>
<div class="card" style="font-size:13.5px">
<p><b>{tr("世代","Generation")}</b>：{tr("サーバー開設からの経過日数で決まる「実装済みの最新英雄世代」です。第2世代以降はおよそ80日ごとに進みます。","Determined by days since server launch. From Gen 2 on, a new generation arrives roughly every 80 days.")}</p>
<p><b>{tr("課金帯","Spending tier")}</b>：{tr("無課金・微課金（ルーレット英雄が中心）／中課金（世代ごとに1体は追加で育成）／石油王（全英雄カンスト）の3段階。入手できる英雄と育成度が違うので、理論最適も別々に出しています。","F2P/light (mostly roulette heroes), mid (one extra hero per generation), whale (everything maxed). Since obtainable heroes differ, the theoretical best is computed per tier.")}</p>
<p><b>{tr("実測","Live stats")}</b>：{tr("利用者の匿名投稿を直近90日で集計。枠別の採用率、よく使われる組み合わせ、ダメージの分位、平均世代ラグを出します。","Anonymous submissions over the last 90 days: pick rate per slot, common trios, damage quantiles, average generation lag.")}</p>
<p><b>{tr("理論最適","Theoretical best")}</b>：{tr("熊狩シミュレーターと同じ計算式で、その世代で入手できる英雄の盾×槍×弓を総当たりした結果。推定値であり実戦の記録ではありません。","Brute-force over all obtainable INF × LAN × MKS with the simulator's formula. An estimate, not a measurement.")} <a href="/stats/methodology.html">{tr("詳しい前提","Details")}</a></p>
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
    desc_ja = "世代別統計の集計方法（対象期間・除外基準・公開基準）と、理論最適構成の計算前提（計算式・固定比率・課金帯モデル）を公開しています。"
    lead_ja = tr("数字を出す以上、出し方を説明します。実測はどう集めてどう除外しているか、理論値は何を固定して何を比較しているか。","Since we publish numbers, we explain how they are made: how live data is collected and filtered, and what the theoretical builds hold fixed.")
    m = theory["model"]
    tiers_rows = "".join(
        f'<tr><td>{tr(t["label"], t["label_en"])}</td><td>{tr("可" if TIERDEF[t["key"]]["paid"] else "不可", "yes" if TIERDEF[t["key"]]["paid"] else "no")}</td><td>{TIERDEF[t["key"]]["hallSlots"]}</td><td>{TIERDEF[t["key"]]["gear"]}</td><td>{TIERDEF[t["key"]]["fc"]}</td><td>T{TIERDEF[t["key"]]["tier"]}</td><td>{TIERDEF[t["key"]]["base"]["team"]["a"]}% / {TIERDEF[t["key"]]["base"]["team"]["l"]}%</td></tr>'
        for t in TIERS)
    unlock_rows = "".join(f'<tr><td>{tr(f"第{g}世代", f"Gen {g}")}</td><td>{UNLOCK[g]}</td></tr>' for g in GENS)
    body = f"""<div class="wrap">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別統計","Generation stats")}</a> &gt; {tr("集計方法","Methodology")}</div>
<h1>{tr("集計方法と","Methodology:")} <span class="acc">{tr("理論値の前提","stats & theory")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>

<h2>{tr("1. 実測データ（みんなの投稿）","1. Live data (user submissions)")}</h2>
<div class="card" style="font-size:13.5px">
<p><b>{tr("集めているもの","What we collect")}</b>：{tr("サーバー経過日数、課金帯、集結主の盾・槍・弓の英雄、兵種比率、（任意）1ラリーの記録ダメージ・火晶レベル・専用装備Lv。同盟名・ゲームIDなど個人を特定できる情報は集めていません。IPアドレスは塩付きハッシュのみ保存し、連投防止にだけ使います。","Days since server launch, spending tier, the three rally-leader heroes, troop ratio, and optionally damage per rally, Fire Crystal level, gear levels. No alliance names, game IDs or other identifying data. IP addresses are stored only as a salted hash for rate limiting.")}</p>
<p><b>{tr("世代の判定","Generation")}</b>：{tr("投稿者の申告ではなく、経過日数から下表で自動判定します。境界日数は推定値で、ズレが分かれば修正します（修正後は過去の投稿も再判定されます）。","Derived from days since launch using the table below, not self-reported. Boundaries are estimates and may be corrected; past submissions are re-classified automatically.")}</p>
<p><b>{tr("集計期間","Window")}</b>：{tr("直近90日の投稿のみ。環境の変化に追随させるためです。","Last 90 days only, so the stats track the current meta.")}</p>
<p><b>{tr("公開基準","Publication threshold")}</b>：{tr("世代ごとに10件未満は非公開、30件未満は「参考値」と表示。課金帯別の内訳は世代全体が30件以上、かつ各課金帯が10件以上のときだけ出します。","Fewer than 10 per generation: hidden. Fewer than 30: marked indicative. Per-tier breakdowns require 30+ overall and 10+ in that tier.")}</p>
<p><b>{tr("除外","Filtering")}</b>：{tr("ダメージは四分位範囲（IQR×1.5）の外側を外れ値として除外。英雄と兵種の不一致、未実装世代の英雄、比率の合計が100でないものは受付時に弾きます。同じブラウザ・同じ日からの再投稿は上書きです。","Damage outliers beyond 1.5×IQR are removed. Hero/class mismatches, unreleased heroes and ratios not summing to 100 are rejected. Re-submissions from the same browser or the same day overwrite the previous entry.")}</p>
<p><b>{tr("偏り","Bias")}</b>：{tr("このサイトの利用者、つまり熊狩りに熱心なプレイヤーに偏ります。サーバー全体の平均ではありません。","The sample skews toward this site's users — engaged Bear Hunt players — and is not a server-wide average.")}</p>
</div>

<h2>{tr("2. 理論最適構成","2. Theoretical best builds")}</h2>
<div class="card" style="font-size:13.5px">
<p><b>{tr("計算式","Formula")}</b>：{tr("熊狩ダメージ・シミュレーターと同一の計算コア（assets/bear-calc.js）。係数はシミュレーターの上級者パラメータの初期値と同じです。","The same calculation core as the Bear Hunt Simulator (assets/bear-calc.js), with the simulator's default advanced parameters.")}</p>
<p><b>{tr("比較しているもの","What is compared")}</b>：{tr("その世代で入手できる英雄を盾×槍×弓で総当たりし、期待ダメージの高い順に並べています。兵種比率は","All obtainable INF × LAN × MKS combinations for the generation, ranked by expected damage. Troop ratio is fixed at ")} {":".join(map(str, m["ratio"]))} {tr("で固定、参加者は","; joiners are fixed to ")} {"・".join(HEROES[j]["name"] for j in m["joiner"])} {tr("で固定です。英雄の遠征ステータスは加算しています（シミュレーターの「かんたん入力」とは前提が違います）。","; hero expedition stats are added (unlike the simulator's simple-input mode).")}</p>
<p><b>{tr("理論指数","Index")}</b>：{tr("各課金帯の1位を100とした相対値。絶対値のダメージは環境差が大きく意味が薄いため出していません。","Relative to the #1 build in each tier (=100). Absolute damage is not shown because it depends heavily on individual stats.")}</p>
<p><b>{tr("課金帯モデル","Spending-tier model")}</b>：{tr("入手できる英雄と育成度を次のように置いています。数値は暫定で、実測が集まったら各課金帯の中央値に置き換えます。","Obtainable heroes and investment are assumed as follows. Values are provisional and will be replaced by measured medians.")}</p>
<div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border-collapse:collapse"><thead><tr><th>{tr("課金帯","Tier")}</th><th>{tr("課金限定英雄","Paid-only heroes")}</th><th>{tr("殿堂SSRの上限","Hall SSR cap")}</th><th>{tr("専用装備Lv","Gear Lv")}</th><th>{tr("火晶Lv","FC Lv")}</th><th>Tier</th><th>{tr("部隊攻撃/殺傷","Army ATK/LETH")}</th></tr></thead><tbody>{tiers_rows}</tbody></table></div>
<p style="margin-top:8px"><b>{tr("入手経路","Acquisition")}</b>：{tr("各世代のラッキールーレット英雄（無課金でも入手可）は弓→盾→槍の順で1体ずつ。ナタリア・ジェロニモは初回チャージ／VIP限定。それ以外のSSRは英雄殿堂で時間をかけて集める前提です。","Each generation's roulette hero (F2P-obtainable) cycles MKS → INF → LAN. Natalia and Jeronimo are first-purchase/VIP only. Other SSRs are assumed to come from the Hall of Heroes over time.")}</p>
<p class="note">{tr("理論値はモデル上の推定であり、実戦の記録ではありません。絶対値には誤差があります。","Theoretical values are model estimates, not measurements, and carry error.")}</p>
</div>

<h2>{tr("3. 世代の境界（経過日数）","3. Generation boundaries (days)")}</h2>
<div class="card"><div style="overflow-x:auto"><table style="font-size:12.5px;border-collapse:collapse;min-width:260px"><thead><tr><th>{tr("世代","Gen")}</th><th>{tr("解放日（目安）","Unlock day (approx.)")}</th></tr></thead><tbody>{unlock_rows}</tbody></table></div>
<p class="note">{tr("出典：スマホゲームNavi「英雄世代の解放スケジュール」、アルテマ「サーバー経過日数と各コンテンツの解放時期」。","Sources: appmatch.jp generation schedule; altema.jp server-day unlock guide.")}</p></div>

<h2>{tr("4. 投稿の削除","4. Deleting a submission")}</h2>
<div class="card" style="font-size:13.5px"><p>{tr("投稿時に発行される編集キー（ブラウザに保存）で上書き・削除ができます。ブラウザを変えた場合は、お問い合わせから編集キーの先頭6桁を添えてご連絡ください。","Your edit key (stored in your browser) lets you update or delete. If you switched browsers, contact us with the first 6 characters of the key.")} <a href="/contact.html">{tr("お問い合わせ","Contact")}</a></p></div>

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
    desc_ja = "集結主の熊狩り構成（盾・槍・弓の英雄と兵種比率）を匿名で投稿。投稿するとすぐに、同世代内の順位・世代ラグ・課金帯別の理論最適との差が分かります。"
    lead_ja = tr("3ステップで完了します。投稿すると<b>同じ世代の中での位置</b>と、<b>あなたの課金帯の理論最適構成との差</b>がその場で分かります。個人を特定する情報は送信されません。",
                 "Three steps. You immediately see <b>where you stand in your generation</b> and <b>how your build compares with the theoretical best for your tier</b>. Nothing identifying is sent.")
    body = f"""<div class="wrap">
<div class="crumb"><a href="/index.html">{tr("ホーム","Home")}</a> &gt; <a href="/stats/index.html">{tr("世代別統計","Generation stats")}</a> &gt; {tr("構成を投稿","Submit")}</div>
<h1>{tr("熊狩り構成を","Submit your")} <span class="acc">{tr("投稿する","Bear Hunt build")}</span></h1>
<div id="updbox"></div>
<p class="lead">{lead_ja}</p>
<div id="submit-form"><div class="skel"></div><div class="skel" style="width:60%"></div></div>
<p class="note" style="margin-top:14px">{tr("熊狩ダメージ・シミュレーターで計算した構成は、シミュレーターの結果画面から1クリックで投稿できます。","If you use the Bear Hunt Simulator, you can submit straight from its result panel.")} <a href="/tools/bear-hunt/index.html">{tr("シミュレーターへ","Open the simulator")}</a></p>
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
missing = []
for g in GENS:
    write(f"stats/{gen_dir(g)}/index.html", build_gen(g))
    if read_note(g)[0] is None: missing.append(g)
if missing:
    print(f"NOTE: 手書き解説が無い世代（自動文で埋めています）: {', '.join(map(str, missing))}  → _stats_notes/gen-NN.md を置くと差し替わります")
print("DONE:", 3 + len(GENS), "pages")
