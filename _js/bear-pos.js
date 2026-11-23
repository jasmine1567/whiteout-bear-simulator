/* ==== 世代内ポジション分析（v150） ====
   予測ダメージが「同じ世代の利用者の中でどのあたりか」を、ランク・分布図・次の目標・要素別の位置・編成の採用率で見せる。
   前提: usage.js が集計（/v1/stats/:gen）を読み込み、WOS_POS.compact()（結果カード内の小さい表示）と WOS_POS.update()（レポートの節）を呼ぶ。
        シミュレーター本体のグローバル（u=編成, h()=英雄検索）と hero-img.js（WOS_heroImg）を使う
   - ここは表示だけ。計算・送信には触れない
   - 比べる数字は usage.js が渡す「全員同じ条件にそろえた予測ダメージ」（偏差値の母集団と同じもの）
   - 集計に新しい項目（dev.q / factors / usage）がまだ無いとき（集計APIが古い版のとき）は、ある項目だけで表示する
   - ランクは偏差値の区切り: D <35 ≦ C <45 ≦ B <55 ≦ A <65 ≦ S <70 ≦ SS */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  var EN = (W.WOS_LANG || 'ja') === 'en';
  function el(id){ return D.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(id){ var e = el(id); var x = e ? parseFloat(e.value) : NaN; return isFinite(x) ? x : null; }
  function pc(x){ return (Math.round(x * 100) / 100) + '%'; }
  /* Google Material Symbols（Rounded・Apache-2.0）の形を inline SVG で描く */
  var IC = {
    leaderboard: 'M140-180h187v-360H140v360Zm247 0h186v-600H387v600Zm246 0h187v-280H633v280Zm-553 0v-360q0-24.75 17.63-42.38Q115.25-600 140-600h187v-180q0-24.75 17.63-42.38Q362.25-840 387-840h186q24.75 0 42.38 17.62Q633-804.75 633-780v260h187q24.75 0 42.38 17.62Q880-484.75 880-460v280q0 24.75-17.62 42.37Q844.75-120 820-120H140q-24.75 0-42.37-17.63Q80-155.25 80-180Z',
    flag: 'M260-429v279q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-620q0-12.75 8.63-21.38Q217.25-800 230-800h289q10.5 0 18.75 6.5T548-776l14 62h208q12.75 0 21.38 8.62Q800-696.75 800-684v310q0 12.75-8.62 21.37Q782.75-344 770-344H568q-10.5 0-18.75-6T539-367l-14-62H260Zm335 25h145v-250H535q-10.5 0-18.75-6.5T506-678l-14-62H260v251h292q10.5 0 18.75 6T581-466l14 62Zm-95-168Z',
    tune: 'M435.5-128.63Q427-137.25 427-150v-165q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v53h323q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H487v52q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM150-202q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h187q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H150Zm165.5-174.63Q307-385.25 307-398v-52H150q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h157v-54q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v166q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM457-450q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h353q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H457Zm144.5-173.63Q593-632.25 593-645v-165q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v52h157q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H653v53q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM150-698q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h353q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H150Z',
    groups: 'M30-240q-12.75 0-21.37-8.63Q0-257.25 0-270v-23q0-38.57 41.5-62.78Q83-380 150.38-380q12.16 0 23.39.5t22.23 2.15q-8 17.35-12 35.17-4 17.81-4 37.18v65H30Zm240 0q-12.75 0-21.37-8.63Q240-257.25 240-270v-35q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v35q0 12.75-8.62 21.37Q702.75-240 690-240H270Zm510 0v-65q0-19.86-3.5-37.43T765-377.27q11-1.73 22.17-2.23 11.17-.5 22.83-.5 67.5 0 108.75 23.77T960-293v23q0 12.75-8.62 21.37Q942.75-240 930-240H780Zm-480-60h360v-6q0-37-50.5-60.5T480-390q-79 0-129.5 23.5T300-305v5ZM149.57-410q-28.57 0-49.07-20.56Q80-451.13 80-480q0-29 20.56-49.5Q121.13-550 150-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T149.57-410Zm660 0q-28.57 0-49.07-20.56Q740-451.13 740-480q0-29 20.56-49.5Q781.13-550 810-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T809.57-410ZM480-480q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm.35-60Q506-540 523-557.35t17-43Q540-626 522.85-643t-42.5-17q-25.35 0-42.85 17.15t-17.5 42.5q0 25.35 17.35 42.85t43 17.5ZM480-300Zm0-300Z',
    trending_up: 'M102-252q-9-9-9-21.5t9-21.5l228-227q16.93-17 41.97-17Q397-539 414-522l125 125 241-241h-97q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h167q12.75 0 21.38 8.62Q880-680.75 880-668v167q0 12-8.27 21t-20.5 9Q839-471 830-480t-9-21v-93L580-354q-16.93 17-41.97 17Q513-337 496-354L371-478 145-252q-9 9-21.5 9t-21.5-9Z',
    arrow_forward: 'M686-450H190q-13 0-21.5-8.5T160-480q0-13 8.5-21.5T190-510h496L459-737q-9-9-9-21t9-21q9-9 21-9t21 9l278 278q5 5 7 10t2 11q0 6-2 11t-7 10L501-181q-9 9-21 9t-21-9q-9-9-9-21t9-21l227-227Z',
    arrow_downward: 'M450-274v-496q0-13 8.5-21.5T480-800q13 0 21.5 8.5T510-770v496l227-227q9-9 21-9t21 9q9 9 9 21t-9 21L501-181q-5 5-10 7t-11 2q-6 0-11-2t-10-7L181-459q-9-9-9-21t9-21q9-9 21-9t21 9l227 227Z'
  };
  function ic(name){ return '<svg class="ps-ic" viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="' + IC[name] + '"/></svg>'; }

  var RANKS = [
    { k: 'D', lo: 20, hi: 35, c: '#8a94b0' }, { k: 'C', lo: 35, hi: 45, c: '#aab3cc' }, { k: 'B', lo: 45, hi: 55, c: '#6cb6ff' },
    { k: 'A', lo: 55, hi: 65, c: '#4fe0c0' }, { k: 'S', lo: 65, hi: 70, c: '#ff9a4d' }, { k: 'SS', lo: 70, hi: 80, c: '#ffd166' }
  ];
  function rankIdx(sc){ for(var i = RANKS.length - 1; i >= 0; i--) if(sc >= RANKS[i].lo) return i; return 0; }
  var CLS_N = { inf: t('盾兵', 'Infantry'), lan: t('槍兵', 'Lancer'), mks: t('弓兵', 'Marksman') };
  var CLS_S = { inf: t('盾', 'INF'), lan: t('槍', 'LAN'), mks: t('弓', 'MKS') };

  /* ---------- 数字の書き方 ---------- */
  function fmtM(d){
    if(!isFinite(d) || d <= 0) return '—';
    var m = d / 1e6;
    if(m >= 100) return Math.round(m).toLocaleString('en-US') + 'M';
    if(m >= 10) return m.toFixed(1) + 'M';
    if(m >= 1) return m.toFixed(2) + 'M';
    return Math.max(1, Math.round(d / 1e3)).toLocaleString('en-US') + 'K';
  }
  function fmtTroops(x){
    if(EN) return x >= 1e6 ? (x / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : x >= 1e3 ? Math.round(x / 1e3) + 'K' : String(Math.round(x));
    return x >= 1e4 ? (Math.round(x / 1e3) / 10).toLocaleString('ja-JP') + '万' : Math.round(x).toLocaleString('ja-JP');
  }
  function fmtPct(p){ return (p >= 99.95 ? '100' : p.toFixed(1)) + '%'; }
  function topTxt(tp){
    return tp < 1 ? t('上位 1%以内', 'top 1%') : tp > 99 ? t('下位 1%以内', 'bottom 1%') : t('上位 ' + Math.round(tp) + '%', 'top ' + Math.round(tp) + '%');
  }
  function ordTxt(r){ return t(r + '位', '#' + r); }
  /* 標準正規分布の上側確率（分位の表も分布も無いときの予備） */
  function upper(z){ var k = 1 / (1 + 0.2316419 * Math.abs(z)); var p = 0.3989423 * Math.exp(-z * z / 2) * k * (0.3193815 + k * (-0.3565638 + k * (1.781478 + k * (-1.821256 + k * 1.330274)))); return z >= 0 ? p : 1 - p; }

  /* ---------- 位置の計算 ---------- */
  function model(ctx){
    var s = ctx.s, d = s.dev, dmg = ctx.dmg, L10 = Math.LN10, n = d.n;
    var scoreOf = function(x){ return 50 + 10 * (Math.log(x) / L10 - d.mu) / d.sd; };
    var dmgAt = function(sc){ return Math.pow(10, d.mu + d.sd * (sc - 50) / 10); };
    var Q = d.q && d.q.p && d.q.d && d.q.p.length === d.q.d.length && d.q.p.length > 2 ? d.q : null;
    /* 下から何%の位置か。分位の表（dev.q）があれば実際の並びから、無ければ 5刻みの人数分布から内挿する */
    function pctl(x){
      if(Q){
        var P = Q.p, Dq = Q.d, m = P.length;
        if(x <= Dq[0]) return P[0] / 2;
        if(x >= Dq[m - 1]) return 100 - (100 - P[m - 1]) / 2;
        for(var i = 0; i < m - 1; i++){
          if(x < Dq[i + 1]){ var a = Math.log(Dq[i]), b = Math.log(Dq[i + 1]); return P[i] + (P[i + 1] - P[i]) * (b > a ? (Math.log(x) - a) / (b - a) : 0.5); }
        }
        return 99.5;
      }
      var sc = scoreOf(x);
      if(d.hist && d.hist.length){
        var above = 0, tot = 0;
        d.hist.forEach(function(b){ tot += b.n; if(sc <= b.lo) above += b.n; else if(sc < b.lo + 5) above += b.n * (b.lo + 5 - sc) / 5; });
        if(tot) return clamp(100 - above / tot * 100, 0.5, 99.5);
      }
      return clamp((1 - upper((sc - 50) / 10)) * 100, 0.5, 99.5);
    }
    /* 下から p% の人のダメージ。分位の表が無い（集計APIが古い）ときは、偏差値の母集団（平均と標準偏差）から出す。
       古い集計の damage.median / p75 / p90 は実際より低く出ていたので使わない */
    function line(p, z){
      if(Q){ var i = Q.p.indexOf(p); if(i >= 0 && Q.d[i] > 0) return Q.d[i]; }
      return dmgAt(50 + 10 * z);
    }
    function posOf(tp){ return clamp(Math.floor(tp / 100 * n) + 1, 1, n); }
    function need(target){
      var r = target / dmg;
      if(r <= 1) return null;
      return r < 2 ? t('あと +' + Math.max(1, Math.round((r - 1) * 100)) + '%', '+' + Math.max(1, Math.round((r - 1) * 100)) + '% to go') : t('あと ' + r.toFixed(1) + '倍', r.toFixed(1) + '× to go');
    }
    var score = scoreOf(dmg), top = 100 - pctl(dmg), ri = rankIdx(score), rk = RANKS[ri], nx = RANKS[ri + 1] || null;
    var med = line(50, 0), p75 = line(75, 0.6745), p90 = line(90, 1.2816);
    var m = { gen: ctx.gen, n: n, dmg: dmg, score: score, top: top, pos: posOf(top), ri: ri, rk: rk, nx: nx,
      scoreTxt: score.toFixed(1), topTxt: topTxt(top),
      posTxt: t(n + '人中 ' + posOf(top) + '位相当', 'about #' + posOf(top) + ' of ' + n),
      nextTxt: nx ? t('ランク' + nx.k + 'まで あと ' + (nx.lo - score).toFixed(1), (nx.lo - score).toFixed(1) + ' to rank ' + nx.k) : t('いちばん上のランクです', 'Top rank'),
      prog: clamp((score - rk.lo) / (rk.hi - rk.lo), 0.04, 1), step: Math.pow(10, d.sd / 10) - 1,
      med: med, p75: p75, p90: p90, scoreOf: scoreOf, dmgAt: dmgAt, need: need, hist: d.hist || [] };
    /* 次の目標: ランクの区切りと、中央値・上位25%・上位10% のライン。直近で超えたもの ＋ これから届くもの3つ */
    var T = [
      { name: t('ランクC', 'Rank C'), sub: t('偏差値35', 'score 35'), d: dmgAt(35) }, { name: t('ランクB', 'Rank B'), sub: t('偏差値45', 'score 45'), d: dmgAt(45) },
      { name: t('世代の中央値', 'Generation median'), d: med }, { name: t('ランクA', 'Rank A'), sub: t('偏差値55', 'score 55'), d: dmgAt(55) },
      { name: t('上位25%', 'Top 25%'), d: p75 }, { name: t('上位10%', 'Top 10%'), d: p90 },
      { name: t('ランクS', 'Rank S'), sub: t('偏差値65', 'score 65'), d: dmgAt(65) }, { name: t('ランクSS', 'Rank SS'), sub: t('偏差値70', 'score 70'), d: dmgAt(70) }
    ].sort(function(a, b){ return a.d - b.d; });
    var done = T.filter(function(x){ return dmg >= x.d; }), todo = T.filter(function(x){ return dmg < x.d; }).slice(0, 3);
    m.goals = done.slice(Math.max(0, done.length - (4 - todo.length))).concat(todo);
    /* いちばん伸びる一手（「つぎに強化すると伸びるもの」の1番目）を実行したときの位置 */
    var li = D.querySelector('#adviceList li'), ab = el('adviceBox');
    if(li && ab && ab.style.display !== 'none'){
      var ge = li.querySelector('.gain'), lb = li.firstElementChild, gain = ge ? parseFloat(String(ge.textContent).replace(/[^\d.\-]/g, '')) : NaN;
      if(lb && lb !== ge && isFinite(gain) && gain > 0){
        var d2 = dmg * (1 + gain / 100), s2 = scoreOf(d2), tp2 = 100 - pctl(d2);
        m.adv = { label: String(lb.textContent).replace(/\s+/g, ' ').trim(), gain: gain, score: s2, scoreTxt: s2.toFixed(1), pos: posOf(tp2), rank: RANKS[rankIdx(s2)].k };
      }
    }
    return m;
  }

  /* ---------- 編成の採用率 ---------- */
  function heroOf(id){ try{ return (typeof h === 'function') ? h(id) : null; }catch(e){ return null; } }
  function nameOf(hh){ return W.WOS_heroName ? W.WOS_heroName(hh) : hh.name; }
  function lineup(){ try{ return { leader: (u.leader || []).slice(), joiner: (u.joiner || []).slice() }; }catch(e){ return { leader: [], joiner: [] }; } }
  function troopsNow(){
    var tr = [num('nInf') || 0, num('nLan') || 0, num('nMks') || 0], tot = tr[0] + tr[1] + tr[2], r = null;
    if(tot > 0){ r = [Math.round(tr[0] / tot * 100), Math.round(tr[1] / tot * 100), 0]; r[2] = Math.max(0, 100 - r[0] - r[1]); }   /* 集計と同じ丸め方 */
    return { tr: tr, tot: tot, r: r };
  }
  function adoption(ctx){
    var s = ctx.s, U = s.usage && s.usage.all && s.usage.all.h ? s.usage : null, lu = lineup();
    var BL = U ? U[U.use && U.use.l === 'picked' && U.picked ? 'picked' : 'all'] : null, BJ = U ? U[U.use && U.use.j === 'picked' && U.picked ? 'picked' : 'all'] : null;
    function rate(B, idx, nn, id, cls){
      var c = (B.h[id] || [0, 0, 0])[idx], r = 1;
      Object.keys(B.h).forEach(function(k){ if(k === id || !(B.h[k][idx] > c)) return; if(cls){ var hk = heroOf(k); if(!hk || hk.cls !== cls) return; } r++; });
      return { pct: nn ? c / nn * 100 : 0, rank: c > 0 ? r : null };
    }
    function inList(list, id){ if(list) for(var i = 0; i < list.length; i++) if(list[i].id === id) return { pct: list[i].pct, rank: i + 1 }; return { pct: null, rank: null }; }
    var out = { lead: [], join: [], n: s.n, picked: !!(U && ((BL === U.picked) || (BJ === U.picked))), nL: BL ? BL.nL : s.n, nJ: BJ ? BJ.nJ : (s.joiners ? s.joiners.n : 0) };
    var lid = {};
    lu.leader.forEach(function(x){
      var hh = x && heroOf(x.heroId); if(!hh) return;
      lid[hh.cls] = hh.id;
      var r = BL && BL.nL ? rate(BL, 0, BL.nL, hh.id, hh.cls) : inList(s.slot && s.slot[hh.cls], hh.id);
      out.lead.push({ id: hh.id, cls: hh.cls, name: nameOf(hh), pct: r.pct, rank: r.rank });
    });
    var seen = {}, jids = [];
    lu.joiner.forEach(function(x){
      var hh = x && heroOf(x.heroId); if(!hh) return;
      jids.push(hh.id);
      if(seen[hh.id]) return; seen[hh.id] = 1;
      var r = BJ && BJ.nJ ? rate(BJ, 1, BJ.nJ, hh.id, null) : inList(s.joiners && s.joiners.heroes, hh.id);
      out.join.push({ id: hh.id, cls: hh.cls, name: nameOf(hh), pct: r.pct, rank: r.rank });
    });
    /* 集結主3人の組み合わせ・乗せ4人の組み合わせ・兵士の比率（集計は上位だけを返す。無ければ「上位◯位以外」） */
    if(lid.inf && lid.lan && lid.mks && s.comps){
      out.comp = { pct: null, rank: null, lim: s.comps.length };
      s.comps.forEach(function(c, i){ if(c.ids[0] === lid.inf && c.ids[1] === lid.lan && c.ids[2] === lid.mks) out.comp = { pct: c.pct, rank: i + 1 }; });
    }
    if(jids.length && s.joiners && s.joiners.sets){
      var key = jids.slice().sort().join(',');
      out.set = { pct: null, rank: null, lim: s.joiners.sets.length, k: jids.length };
      s.joiners.sets.forEach(function(c, i){ if(c.ids.join(',') === key) out.set = { pct: c.pct, rank: i + 1, k: jids.length }; });
    }
    var tn = troopsNow();
    if(tn.r && s.ratio && s.ratio.length){
      var rk = tn.r.join(':');
      out.ratio = { key: rk, pct: null, rank: null, best: s.ratio[0] };
      s.ratio.forEach(function(c, i){ if(c.key === rk) out.ratio = { key: rk, pct: c.pct, rank: i + 1, best: s.ratio[0] }; });
    }
    return out;
  }

  /* ---------- 要素別の位置（集計に factors があるときだけ） ---------- */
  /* 分位の表（0,5,…,100%）の中で x が下から何%か。同じ値が並ぶところは真ん中を返す */
  function pctlIn(q, x){
    var lo = 0, hi = 0;
    for(var i = 0; i < q.length; i++){ if(q[i] < x) lo++; if(q[i] <= x) hi++; }
    var step = 100 / (q.length - 1), p;
    if(hi > lo) p = (lo + hi - 1) / 2 * step;
    else if(lo === 0) p = 0;
    else if(lo >= q.length) p = 100;
    else p = (lo - 1 + (x - q[lo - 1]) / (q[lo] - q[lo - 1])) * step;
    return clamp(p, 1, 99);
  }
  function factors(ctx){
    var F = ctx.s.factors; if(!F) return null;
    var rows = [], lu = lineup(), tn = troopsNow();
    if(F.gear && F.gear.d && F.gear.n){
      var gsum = 0; lu.leader.forEach(function(x){ if(x) gsum += (x.gear || 0); });
      var below = 0, eq = 0, acc = 0, medG = 0, found = false;
      F.gear.d.forEach(function(c, i){ if(i < gsum) below += c; else if(i === gsum) eq = c; acc += c; if(!found && acc >= F.gear.n / 2){ medG = i; found = true; } });
      rows.push({ k: 'gear', name: t('専用装備（集結主3人）', 'Exclusive gear (3 leaders)'), p: clamp((below + eq / 2) / F.gear.n * 100, 1, 99),
        det: t('合計 Lv' + gsum + ' ／ 世代の中央値 Lv' + medG, 'Total Lv' + gsum + ' / generation median Lv' + medG) });
    }
    if(F.stat && F.stat.q && tn.r){
      var ta = num('teamAtk'), tl = num('teamLeth'), A = [num('atkInf'), num('atkLan'), num('atkMks')], Lh = [num('lethInf'), num('lethLan'), num('lethMks')];
      if(ta != null && tl != null && A.concat(Lh).every(function(x){ return x != null; })){
        var sum = 0, ws = 0, main = 0;
        for(var i = 0; i < 3; i++){ sum += tn.r[i] * (1 + (ta + A[i]) / 100) * (1 + (tl + Lh[i]) / 100); ws += tn.r[i]; if(tn.tr[i] > tn.tr[main]) main = i; }
        if(ws > 0){
          var cn = CLS_N[['inf', 'lan', 'mks'][main]], av = Math.round(ta + A[main]).toLocaleString('en-US'), lv = Math.round(tl + Lh[main]).toLocaleString('en-US');
          rows.push({ k: 'stat', name: t('攻撃・殺傷ステータス', 'Attack & lethality'), p: pctlIn(F.stat.q, sum / ws),
            det: t(cn + 'の合計 攻撃 ' + av + '%・殺傷 ' + lv + '%', cn + ' total: attack ' + av + '%, lethality ' + lv + '%') });
        }
      }
    }
    var tier = num('tier'), fc = num('fcLevel') || 0;
    if(F.tier && F.tier.d && F.tier.n && tier != null){
      var kv = tier * 100 + fc, b2 = 0, e2 = 0, best = null, bestC = -1;
      Object.keys(F.tier.d).forEach(function(k){
        var c = F.tier.d[k], pr = k.split(':'), v = (+pr[0]) * 100 + (+pr[1] || 0);
        if(v < kv) b2 += c; else if(v === kv) e2 += c;
        if(c > bestC){ bestC = c; best = pr; }
      });
      var tl2 = function(a, b){ return 'T' + a + (+b ? t('・FC', ' FC') + b : ''); };
      rows.push({ k: 'tier', name: t('兵種Tier・火晶', 'Troop tier & FC'), p: clamp((b2 + e2 / 2) / F.tier.n * 100, 1, 99),
        det: t(tl2(tier, fc) + ' ／ いちばん多いのは ' + tl2(best[0], best[1]), tl2(tier, fc) + ' / most common: ' + tl2(best[0], best[1])) });
    }
    if(F.troops && F.troops.q && tn.tot > 0){
      var isDef = tn.tot === 200000 && tn.r[0] === 10 && tn.r[1] === 30 && tn.r[2] === 60;
      rows.push(isDef
        ? { k: 'troops', name: t('兵士の数', 'Troop count'), p: null, det: t('兵士の数が初期値のままです。実際の数を入れると比べられます。', 'Troop counts are still the defaults — enter your real numbers to compare.') }
        : { k: 'troops', name: t('兵士の数', 'Troop count'), p: pctlIn(F.troops.q, tn.tot),
            det: t('合計 ' + fmtTroops(tn.tot) + ' ／ 世代の中央値 ' + fmtTroops(F.troops.q[10]), 'Total ' + fmtTroops(tn.tot) + ' / generation median ' + fmtTroops(F.troops.q[10])) });
    }
    if(!rows.length) return null;
    var weak = null; rows.forEach(function(r){ if(r.p != null && (!weak || r.p < weak.p)) weak = r; });
    if(weak && weak.p < 50) weak.weak = true; else weak = null;
    return { rows: rows, weak: weak };
  }

  /* ---------- 部品 ---------- */
  function emblem(rk, cls){ return '<span class="ps-emb ' + (cls || '') + (rk.k.length > 1 ? ' w2' : '') + '" style="--rk:' + rk.c + '">' + rk.k + '</span>'; }
  function strip(ri, score, marker){
    var x = clamp((score - 20) / 60 * 100, 1.5, 98.5);
    return '<div class="ps-strip' + (marker ? ' mk' : '') + '">' + (marker ? '<i class="ps-tri" style="left:' + pc(x) + '"></i>' : '')
      + RANKS.map(function(r, i){ return '<span class="' + (i === ri ? 'on' : '') + '" style="flex:' + (r.hi - r.lo) + ' 1 0;--rk:' + r.c + '"><i></i><em>' + r.k + '</em></span>'; }).join('') + '</div>';
  }
  function avatar(id){
    var src = W.WOS_heroImg && W.WOS_heroImg(id);
    return '<span class="ps-av">' + (src ? '<img src="' + esc(src) + '" alt="" width="34" height="34" loading="lazy">' : '') + '</span>';
  }
  function rankPill(r, lim){
    if(r == null) return '<span class="ps-rk0">' + (lim ? t('上位' + lim + '位以外', 'outside top ' + lim) : '—') + '</span>';
    return '<span class="ps-rkp' + (r === 1 ? ' r1' : '') + '">' + ordTxt(r) + '</span>';
  }

  /* ---------- 結果カード内の小さい表示（#usageBox .ug-dev の中身。.ug-score / .ug-top は総評と共有画像が読む） ---------- */
  function compact(ctx){
    var m = model(ctx);
    return '<div class="ps-mini">'
      + '<div class="psm-top">' + emblem(m.rk, 'sm') + '<div class="psm-tx"><span class="psm-k">' + t('第' + m.gen + '世代・' + m.posTxt, 'Gen ' + m.gen + ' · ' + m.posTxt) + '</span>'
      + '<div class="psm-s"><span class="ug-lbl">' + t('偏差値', 'Score') + '</span><b class="ug-score">' + m.scoreTxt + '</b><span class="ug-top">' + esc(m.topTxt) + '</span></div></div></div>'
      + strip(m.ri, m.score, true)
      + '<div class="psm-next"><b>' + t('ランク' + m.rk.k, 'Rank ' + m.rk.k) + '</b>' + t('・', ' · ') + esc(m.nextTxt) + '</div>'
      + '<a class="psm-more" href="#posBox" role="button" data-ps-go="1">' + t('くわしい分析を見る', 'See the full analysis') + ic('arrow_downward') + '</a>'
      + '</div>';
  }

  /* ---------- レポートの節 ---------- */
  function chart(m){
    var X = function(sc){ return (clamp(sc, 20, 80) - 20) / 60 * 100; };
    var curve = function(sc){ var z = (sc - 50) / 10; return m.n * 0.5 * Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); };
    var maxY = curve(50); m.hist.forEach(function(b){ if(b.n > maxY) maxY = b.n; }); maxY *= 1.12;
    var myBin = clamp(Math.floor((m.score - 20) / 5), 0, 11), bars = '';
    m.hist.forEach(function(b, i){
      if(!b.n) return;
      bars += '<i class="ps-b' + (i === myBin ? ' me' : '') + '" style="left:' + pc(X(b.lo) + 0.25) + ';width:' + pc(5 / 60 * 100 - 0.5) + ';height:' + pc(b.n / maxY * 100) + '" title="' + t('偏差値 ' + b.lo + '〜' + (b.lo + 5) + '：' + b.n + '人', 'score ' + b.lo + '–' + (b.lo + 5) + ': ' + b.n) + '"></i>';
    });
    var pts = []; for(var sc = 20; sc <= 80; sc += 1) pts.push([X(sc) * 6, (1 - curve(sc) / maxY) * 100]);
    var ln = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(2); }).join('');
    /* 中央値・上位25%・上位10% の線。ラベルが近いときは段をずらす */
    var mk = [['m0', t('中央値', 'Median'), m.med], ['m1', t('上位25%', 'Top 25%'), m.p75], ['m2', t('上位10%', 'Top 10%'), m.p90]]
      .map(function(a){ return { c: a[0], lb: a[1], x: X(m.scoreOf(a[2])) }; }).sort(function(a, b){ return a.x - b.x; });
    var prev = null;
    mk.forEach(function(a){ a.low = !!(prev && a.x - prev.x < 15 && !prev.low); prev = a; });
    var marks = mk.map(function(a){ return '<span class="ps-mk ' + a.c + (a.low ? ' low' : '') + (a.x < 7 ? ' al' : a.x > 93 ? ' ar' : '') + '" style="left:' + pc(a.x) + '"><em>' + a.lb + '</em></span>'; }).join('');
    var x = X(m.score), dotY = clamp(curve(clamp(m.score, 20, 80)) / maxY * 100, 0, 100);
    var ticks = [30, 40, 50, 60, 70].map(function(v){ return '<span style="left:' + pc(X(v)) + '"><b>' + v + '</b><em>' + fmtM(m.dmgAt(v)) + '</em></span>'; }).join('');
    return '<div class="ps-chart" role="img" aria-label="' + t('第' + m.gen + '世代の偏差値の分布とあなたの位置（偏差値 ' + m.scoreTxt + '）', 'Score distribution of Gen ' + m.gen + ' and your position (score ' + m.scoreTxt + ')') + '">'
      + '<span class="ps-pl" style="left:' + pc(clamp(x, 14, 86)) + '">' + t('あなた ', 'You ') + fmtM(m.dmg) + '</span>'
      + '<div class="ps-plot">' + bars
      + '<svg class="ps-cv" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="' + ln + 'L600 100L0 100Z"/><path class="l" d="' + ln + '" vector-effect="non-scaling-stroke"/></svg>'
      + marks + '<span class="ps-pin" style="left:' + pc(x) + '"></span><i class="ps-dot" style="left:' + pc(x) + ';bottom:' + pc(dotY) + '"></i></div></div>'
      + '<div class="ps-axis">' + ticks + '</div>' + strip(m.ri, m.score, false);
  }
  function section(ctx, m){
    var s = ctx.s, gen = m.gen, G = t('第' + gen + '世代', 'Gen ' + gen);
    var upd = s.updatedAt ? (function(){ var dt = new Date(s.updatedAt * 1000); return dt.getFullYear() + '/' + (dt.getMonth() + 1) + '/' + dt.getDate(); })() : '';
    var html = '<div class="ps-h"><h3>' + ic('leaderboard') + t('世代内ポジション分析', 'Where you stand in your generation') + '</h3>'
      + '<span class="ps-meta">' + G + t('・利用データ ' + m.n + '人', ' · ' + m.n + ' players') + (upd ? t('・' + upd + ' 更新', ' · updated ' + upd) : '') + '</span></div>';
    /* 濃い色のパネル: いまの位置 ＋ 分布図 ＋ 3つのライン */
    var kpi = function(cls, lb, v){
      var nd = m.need(v), r = m.dmg / v;
      var sub = nd || (r >= 2 ? t('あなたは ' + r.toFixed(1) + '倍', 'You: ' + r.toFixed(1) + '×') : r >= 1.005 ? t('あなたは +' + Math.round((r - 1) * 100) + '%', 'You: +' + Math.round((r - 1) * 100) + '%') : t('ちょうどこのあたり', 'Right about here'));
      return '<div class="' + cls + (nd ? '' : ' ok') + '"><span>' + lb + '</span><b>' + fmtM(v) + '</b><em>' + sub + '</em></div>';
    };
    html += '<div class="ps-dark"><div class="ps-you"><div class="ps-k">' + G + t('の利用者の中で', ' players') + '</div>'
      + '<div class="ps-big">' + emblem(m.rk, 'lg') + '<div><span>' + t('偏差値', 'Score') + '</span><b>' + m.scoreTxt + '</b></div></div>'
      + '<div class="ps-chips"><span class="c1">' + esc(m.topTxt) + '</span><span class="c2">' + esc(m.posTxt) + '</span></div>'
      + '<div class="ps-rk"><div><b>' + t('ランク' + m.rk.k, 'Rank ' + m.rk.k) + '</b><span>' + esc(m.nextTxt) + '</span></div><div class="tr"><i style="width:' + pc(m.prog * 100) + ';background:' + m.rk.c + '"></i></div></div>'
      + '<p class="ps-step">' + t('この世代では、ダメージが約' + Math.max(1, Math.round(m.step * 100)) + '%伸びるごとに偏差値が1上がります。', 'In this generation, about +' + Math.max(1, Math.round(m.step * 100)) + '% damage raises the score by 1.') + '</p></div>'
      + '<div class="ps-dist"><div class="ps-dh"><b>' + G + t('の分布とあなたの位置', ': distribution and you') + '</b><span><i class="b"></i>' + t('実際の人数', 'Players') + '<i class="l"></i>' + t('目安の線', 'Guide curve') + '</span></div>'
      + chart(m)
      + '<p class="ps-cap">' + t('横軸は偏差値（下の数字はその偏差値にあたる予測ダメージ）。棒は実際の利用者の人数です。ランクは偏差値で決まります（C 35〜／B 45〜／A 55〜／S 65〜／SS 70〜）。',
        'Horizontal axis: score (the number below is the estimated damage at that score). Bars show the actual number of players. Ranks follow the score (C 35+, B 45+, A 55+, S 65+, SS 70+).') + '</p></div>'
      + '<div class="ps-kpi">' + kpi('k0', t('世代の中央値', 'Generation median'), m.med) + kpi('k1', t('上位25%ライン', 'Top 25% line'), m.p75) + kpi('k2', t('上位10%ライン', 'Top 10% line'), m.p90) + '</div></div>';
    /* 次の目標まで */
    var goals = m.goals.map(function(x){
      var nd = m.need(x.d);
      return '<li class="' + (nd ? '' : 'ok') + '"><div><b>' + x.name + '</b>' + (x.sub ? '<small>' + x.sub + '</small>' : '') + '<span>' + fmtM(x.d) + '</span><em>' + (nd || t('達成', 'Reached')) + '</em></div>'
        + '<div class="tr"><i style="width:' + pc(clamp(m.dmg / x.d * 100, 2, 100)) + '"></i></div></li>';
    }).join('');
    var adv = m.adv ? '<p class="ps-adv">' + ic('trending_up') + '<span>' + t('いちばん伸びる一手「' + esc(m.adv.label) + '」（+' + m.adv.gain.toFixed(1) + '%）で、偏差値は <b>' + m.scoreTxt + ' → ' + m.adv.scoreTxt + '</b>'
        + (m.adv.pos < m.pos ? '、順位は <b>' + m.pos + '位 → ' + m.adv.pos + '位相当</b>' : '') + ' に上がる見込みです。',
        'The best next step, “' + esc(m.adv.label) + '” (+' + m.adv.gain.toFixed(1) + '%), would lift your score <b>' + m.scoreTxt + ' → ' + m.adv.scoreTxt + '</b>'
        + (m.adv.pos < m.pos ? ' and your position <b>#' + m.pos + ' → about #' + m.adv.pos + '</b>' : '') + '.') + '</span></p>' : '';
    var F = factors(ctx), fhtml = '';
    if(F){
      fhtml = '<div class="ps-card ps-fac"><h4>' + ic('tune') + t('要素別の位置', 'Position by factor') + '</h4><p class="ps-sub">' + t('同じ世代の中で、どの要素が強く、どこに伸びしろがあるかを比べます。', 'Compared within your generation: where you are strong and where there is room to grow.') + '</p><ul>'
        + F.rows.map(function(r){
            if(r.p == null) return '<li class="na"><div><b>' + r.name + '</b></div><span class="fd">' + r.det + '</span></li>';
            return '<li class="' + (r.weak ? 'weak' : '') + '"><div><b>' + r.name + '</b>' + (r.weak ? '<i>' + t('伸びしろ', 'Room to grow') + '</i>' : '') + '<em>' + topTxt(100 - r.p) + '</em></div>'
              + '<div class="tr"><i style="width:' + pc(r.p) + '"></i></div><span class="fd">' + r.det + '</span></li>';
          }).join('') + '</ul>'
        + '<p class="ps-fc">' + (F.weak ? t('いちばん差がついているのは<b>' + F.weak.name.replace(/（.*$/, '') + '</b>です。', 'The biggest gap is in <b>' + F.weak.name.replace(/\s*\(.*$/, '').toLowerCase() + '</b>.') : t('比べられる要素は、どれも世代の真ん中以上です。', 'Every comparable factor is at or above the middle of your generation.')) + '</p></div>';
    }
    html += '<div class="ps-grid' + (F ? '' : ' one') + '"><div class="ps-card ps-goal"><h4>' + ic('flag') + t('次の目標まで', 'Next goals') + '</h4><ul>' + goals + '</ul>' + adv + '</div>' + fhtml + '</div>';
    /* あなたの編成の採用率 */
    var A = adoption(ctx);
    if(A.lead.length || A.join.length){
      var row = function(o){
        var w = o.pct == null ? 0 : clamp(o.pct, 0, 100);
        return '<li>' + avatar(o.id) + '<div class="nm"><div><b>' + esc(o.name) + '</b><i class="cl ' + o.cls + '">' + CLS_S[o.cls] + '</i></div><div class="tr"><i class="' + o.cls + '" style="width:' + pc(w) + '"></i></div></div>'
          + '<span class="pv">' + (o.pct == null ? '—' : fmtPct(o.pct)) + '</span>' + rankPill(o.rank, null) + '</li>';
      };
      var combo = function(lb, c){ return '<div class="ps-combo"><span>' + lb + '</span><b>' + (c.pct == null ? '—' : fmtPct(c.pct)) + '</b>' + rankPill(c.rank, c.lim) + '</div>'; };
      var lcol = '<div><div class="ps-at">' + t('集結主', 'Rally leaders') + '</div><ul class="ps-rows">' + A.lead.map(row).join('') + '</ul>'
        + (A.comp ? combo(t('この3人の組み合わせ', 'This trio'), A.comp) : '')
        + (A.ratio ? (A.ratio.rank ? combo(t('兵士の比率 ', 'Troop ratio ') + A.ratio.key, A.ratio)
            : '<div class="ps-combo ref"><span>' + t('兵士の比率 ' + A.ratio.key + '（いちばん多いのは ' + A.ratio.best.key + '・' + fmtPct(A.ratio.best.pct) + '）', 'Troop ratio ' + A.ratio.key + ' (most common: ' + A.ratio.best.key + ', ' + fmtPct(A.ratio.best.pct) + ')') + '</span></div>') : '') + '</div>';
      var jcol = A.join.length ? '<div><div class="ps-at">' + t('乗せ（参加者）', 'Joiners') + '</div><ul class="ps-rows">' + A.join.map(row).join('') + '</ul>'
        + (A.set ? combo(t('この' + A.set.k + '人の組み合わせ', 'This set of ' + A.set.k), A.set) : '') + '</div>' : '';
      var basis = A.picked
        ? t(G + 'で英雄を自分で選び直した人（集結主 ' + A.nL + '人・乗せ ' + A.nJ + '人）のうち、同じ英雄を使っている人の割合です。', 'Share of ' + G + ' players who picked their own heroes (' + A.nL + ' leader line-ups, ' + A.nJ + ' joiner sets) using the same hero.')
        : t(G + 'の利用者 ' + A.n + '人のうち、同じ英雄を使っている人の割合です。', 'Share of the ' + A.n + ' ' + G + ' players using the same hero.');
      html += '<div class="ps-card ps-adopt"><div class="ps-ah"><h4>' + ic('groups') + t('あなたの編成の採用率', 'How common is your line-up') + '</h4><p class="ps-sub">' + basis + '</p></div>'
        + '<div class="ps-acols">' + lcol + jcol + '</div>'
        + '<a class="ps-link" href="' + (W.WOS_BASE || '') + '/stats/hero-usage/?gen=' + gen + '">' + t(G + 'の英雄利用度ランキングを見る', 'See the ' + G + ' hero usage ranking') + ic('arrow_forward') + '</a></div>';
      m.comp = A.comp && A.comp.rank ? A.comp : null;
    }
    html += '<p class="ps-foot">' + t('偏差値・ランク・順位は、このツールの利用データ（全員同じ条件にそろえた予測ダメージ）から出した目安です。ゲーム内の公式ランキングではありません。',
      'Score, rank and position are estimates from this tool’s usage data (estimated damage under the same conditions for everyone) — not an official in-game ranking.')
      + (ctx.shown && Math.abs(ctx.shown / m.dmg - 1) > 0.005 ? t(' 実測での補正や詳細設定を変えているときは、補正前の予測値（' + fmtM(m.dmg) + '）で比べています。', ' When you calibrate or change advanced settings, the comparison uses the uncalibrated estimate (' + fmtM(m.dmg) + ').') : '')
      + ' <a href="' + esc(ctx.href || '#') + '">' + t(G + 'の統計ページ', G + ' stats page') + ic('arrow_forward') + '</a></p>';
    return html;
  }

  /* ---------- 画面への反映 ---------- */
  var box = null, chip = null, lastKey = null, styled = false;
  function go(e){
    if(e) e.preventDefault();
    if(!box || box.hidden) return;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    box.classList.remove('rp-flash'); void box.offsetWidth; box.classList.add('rp-flash');
    setTimeout(function(){ box.classList.remove('rp-flash'); }, 2600);
  }
  function ensure(){
    if(!styled){ styled = true; var st = D.createElement('style'); st.textContent = CSS; D.head.appendChild(st); }
    if(!box){
      var res = D.querySelector('.rcol .result'); if(!res) return false;
      box = D.createElement('section'); box.id = 'posBox'; box.hidden = true;
      var sum = el('rpSummary');
      if(sum && sum.parentNode === res.parentNode) res.parentNode.insertBefore(box, sum); else res.parentNode.insertBefore(box, res.nextSibling);
      D.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('[data-ps-go]'); if(a) go(e); });
    }
    if(!chip){
      var head = D.querySelector('.rcol .dmg-head');
      if(head){ chip = D.createElement('a'); chip.className = 'ps-chip'; chip.href = '#posBox'; chip.setAttribute('role', 'button'); chip.setAttribute('data-ps-go', '1'); chip.hidden = true; head.appendChild(chip); }
    }
    return true;
  }
  function keyOf(ctx){
    var lu = lineup(), li = D.querySelector('#adviceList li'), ab = el('adviceBox');
    return JSON.stringify([ctx.gen, ctx.dmg, ctx.shown, ctx.s.updatedAt, ctx.s.n, lu.leader.map(function(x){ return x ? x.heroId + ':' + (x.gear || 0) : ''; }), lu.joiner.map(function(x){ return x ? x.heroId : ''; }),
      ['nInf', 'nLan', 'nMks', 'tier', 'fcLevel', 'teamAtk', 'teamLeth', 'atkInf', 'lethInf', 'atkLan', 'lethLan', 'atkMks', 'lethMks'].map(num),
      li && ab && ab.style.display !== 'none' ? li.textContent : '']);
  }
  function update(ctx){
    if(!ctx || !ctx.s || !ctx.s.dev || !(ctx.dmg > 0)){
      lastKey = null; W.__WOS_POS = null;
      if(box) box.hidden = true; if(chip) chip.hidden = true;
      return;
    }
    if(!ensure()) return;
    var key = keyOf(ctx); if(key === lastKey) return;
    lastKey = key;
    var m = model(ctx);
    box.innerHTML = section(ctx, m); box.hidden = false;
    if(chip){
      chip.innerHTML = emblem(m.rk, 'sm') + '<span class="pc-t"><span>' + t('第' + m.gen + '世代の中で', 'Within Gen ' + m.gen) + '</span><span class="pc-v"><i>' + t('偏差値', 'Score') + '</i><b>' + m.scoreTxt + '</b><em>' + esc(m.topTxt) + '</em></span></span>'
        + '<span class="pc-go">' + t('くわしく', 'Details') + ic('arrow_downward') + '</span>';
      chip.hidden = false;
    }
    /* 総評（bear-viz.js）が読む要約 */
    W.__WOS_POS = { gen: m.gen, n: m.n, score: m.scoreTxt, rank: m.rk.k, top: m.topTxt, pos: m.posTxt,
      adv: m.adv ? { from: m.scoreTxt, to: m.adv.scoreTxt } : null, comp: m.comp ? { rank: m.comp.rank, pct: m.comp.pct } : null };
  }
  /* 編成や装備だけを変えてダメージが動かなかったときにも採用率などを更新する */
  var tm = null;
  function kick(){ clearTimeout(tm); tm = setTimeout(function(){ try{ if(W.WOS_USAGE && W.WOS_USAGE.refresh) W.WOS_USAGE.refresh(); }catch(e){} }, 400); }
  D.addEventListener('click', kick, true); D.addEventListener('change', kick, true); D.addEventListener('input', kick, true);

  var CSS = [
    '.ps-ic{fill:currentColor;flex:none}',
    '.ps-emb{--rk:#4fe0c0;flex:none;display:grid;place-items:center;width:34px;height:38px;background:var(--rk);color:#10152a;font:800 17px/1 \'Outfit\',sans-serif;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}',
    '.ps-emb.w2{font-size:13px;letter-spacing:-.03em}',
    '.ps-emb.lg{width:62px;height:70px;font-size:32px}',
    '.ps-emb.lg.w2{font-size:25px}',
    '.ps-strip{position:relative;display:flex;gap:3px;margin-top:12px}',
    '.ps-strip.mk{padding-top:9px}',
    '.ps-strip span{min-width:0;text-align:center}',
    '.ps-strip span i{display:block;height:6px;border-radius:3px;background:var(--rk);opacity:.36}',
    '.ps-strip span em{display:block;font:700 9.5px/1.3 \'Outfit\',sans-serif;font-style:normal;color:#8a94b0;margin-top:3px}',
    '.ps-strip span.on i{opacity:1}',
    '.ps-strip span.on em{color:#23283a;font-weight:800}',
    '.ps-strip .ps-tri{position:absolute;top:0;width:0;height:0;border:5px solid transparent;border-top:7px solid #23283a;border-bottom:0;transform:translateX(-50%)}',
    '.dmg-head .ps-chip{margin-left:auto;align-self:center;display:flex;align-items:center;gap:10px;background:#fff;color:#23283a;text-decoration:none;border-radius:14px;padding:8px 14px 8px 10px;box-shadow:0 2px 10px rgba(120,40,0,.2);line-height:1.2;text-shadow:none}',
    '.dmg-head .ps-chip[hidden]{display:none}',
    '.ps-chip .pc-t{display:flex;flex-direction:column;gap:2px;min-width:0}',
    '.ps-chip .pc-t>span:first-child{font-size:10.5px;font-weight:700;color:#6b7385;letter-spacing:0}',
    '.ps-chip .pc-v{display:flex;align-items:baseline;gap:6px;white-space:nowrap}',
    '.ps-chip .pc-v i{font-style:normal;font-size:11px;font-weight:800}',
    '.ps-chip .pc-v b{font:800 22px/1 \'Outfit\',sans-serif;font-variant-numeric:tabular-nums}',
    '.ps-chip .pc-v em{font-style:normal;font-size:11.5px;font-weight:800}',
    '.ps-chip .pc-go{display:inline-flex;align-items:center;gap:2px;margin-left:6px;font-size:11.5px;font-weight:800;color:#e85d12;white-space:nowrap}',
    '.ps-chip .pc-go .ps-ic{width:15px;height:15px}',
    '.ps-chip:focus-visible,.psm-more:focus-visible,#posBox a:focus-visible{outline:2px solid #23283a;outline-offset:2px}',
    '@media(max-width:700px){.dmg-head .ps-chip{flex:1 1 100%;margin:10px 0 0}.ps-chip .pc-go{margin-left:auto}}',
    '#usageBox .ps-mini{flex:1 1 100%;min-width:0;text-align:left}',
    '.ps-mini .psm-top{display:flex;align-items:center;gap:12px}',
    '.ps-mini .psm-tx{min-width:0}',
    '.ps-mini .psm-k{display:block;font-size:11.5px;font-weight:600;color:#6b7385}',
    '.ps-mini .psm-s{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 7px}',
    '.ps-mini .ug-lbl{font-size:11.5px;font-weight:800;color:#23283a}',
    '.ps-mini .ug-score{font-family:\'Outfit\',sans-serif;font-size:28px}',
    '.ps-mini .ug-top{font-size:12.5px;color:#23283a}',
    '.ps-mini .psm-next{margin-top:8px;font-size:12px;color:#3a4055}',
    '.ps-mini .psm-next b{color:#23283a}',
    '.ps-mini .psm-more{display:inline-flex;align-items:center;gap:3px;margin-top:8px;font-size:12px;font-weight:800;color:#e85d12;text-decoration:none}',
    '.ps-mini .psm-more .ps-ic{width:15px;height:15px}',
    'body.rp-on #usageBox .ug-note{text-align:left;margin-top:12px}',
    '#posBox{container-type:inline-size;background:#fff;border:1px solid #ecedf3;border-radius:16px;padding:18px 20px;margin-top:14px;box-shadow:0 4px 16px rgba(28,34,80,.05);color:#23283a;scroll-margin-top:78px;font-size:13px;line-height:1.6;text-align:left}',
    '#posBox[hidden]{display:none}',
    '#posBox .ps-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 14px;margin:0 0 12px}',
    '#posBox h3{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;margin:0;line-height:1.4;color:#23283a;letter-spacing:0}',
    '#posBox h3 .ps-ic,#posBox h4 .ps-ic{width:20px;height:20px;color:#e85d12}',
    '#posBox .ps-meta{font-size:11.5px;color:#6b7385}',
    '#posBox h4{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:800;margin:0 0 8px;color:#23283a;line-height:1.4;letter-spacing:0}',
    '#posBox .ps-sub{margin:0 0 10px;font-size:12px;color:#6b7385;line-height:1.6}',
    '#posBox .tr{height:7px;border-radius:4px;background:#eef0f5;overflow:hidden}',
    '#posBox .tr i{display:block;height:100%;border-radius:4px}',
    '#posBox ul{list-style:none;margin:0;padding:0}',
    '#posBox li::before{content:none}',
    '#posBox .ps-dark{background:linear-gradient(180deg,#171c30,#0f1322);border-radius:14px;padding:18px 16px;color:#e8ecf8;display:grid;grid-template-columns:minmax(0,1fr);gap:20px}',
    '#posBox .ps-k{font-size:12px;font-weight:700;color:#9aa5c4}',
    '#posBox .ps-big{display:flex;align-items:center;gap:16px;margin:12px 0}',
    '#posBox .ps-big>div>span{display:block;font-size:11.5px;font-weight:700;color:#9aa5c4}',
    '#posBox .ps-big b{display:block;font:800 52px/1 \'Outfit\',sans-serif;font-variant-numeric:tabular-nums;color:#fff}',
    '#posBox .ps-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '#posBox .ps-chips span{font-size:12px;font-weight:800;border-radius:999px;padding:4px 11px;white-space:nowrap}',
    '#posBox .ps-chips .c1{background:#4fe0c0;color:#0f1322}',
    '#posBox .ps-chips .c2{background:rgba(255,255,255,.11);color:#e8ecf8}',
    '#posBox .ps-rk{margin-top:16px}',
    '#posBox .ps-rk>div:first-child{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 10px;font-size:12px;margin-bottom:6px}',
    '#posBox .ps-rk b{color:#fff;font-weight:800}',
    '#posBox .ps-rk span{color:#c9d1e6;font-weight:700}',
    '#posBox .ps-rk .tr{background:rgba(255,255,255,.11)}',
    '#posBox .ps-step{margin:14px 0 0;font-size:11.5px;color:#9aa5c4;line-height:1.6}',
    '#posBox .ps-dist{min-width:0}',
    '#posBox .ps-dh{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:4px 12px;font-size:12px}',
    '#posBox .ps-dh b{color:#e8ecf8;font-weight:700}',
    '#posBox .ps-dh span{display:inline-flex;align-items:center;gap:5px;color:#9aa5c4;font-size:11px}',
    '#posBox .ps-dh .b{width:9px;height:9px;border-radius:2px;background:#5a6079}',
    '#posBox .ps-dh .l{width:14px;height:2px;background:#ffb37a;margin-left:8px}',
    '#posBox .ps-chart{position:relative;height:200px;margin-top:8px}',
    '#posBox .ps-plot{position:absolute;left:0;right:0;top:56px;bottom:0;border-bottom:1px solid rgba(255,255,255,.28)}',
    '#posBox .ps-b{position:absolute;bottom:0;background:rgba(255,255,255,.13);border-radius:3px 3px 0 0}',
    '#posBox .ps-b.me{background:rgba(79,224,192,.34)}',
    '#posBox .ps-cv{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}',
    '#posBox .ps-cv .a{fill:rgba(255,179,122,.15)}',
    '#posBox .ps-cv .l{fill:none;stroke:#ffb37a;stroke-width:2}',
    '#posBox .ps-mk{position:absolute;top:-18px;bottom:0;width:0;border-left:1px dashed rgba(255,255,255,.5)}',
    '#posBox .ps-mk em{position:absolute;top:-15px;left:0;z-index:2;transform:translateX(-50%);font-style:normal;font-size:10px;font-weight:800;line-height:1.4;white-space:nowrap;color:#fff;background:rgba(21,26,46,.86);border-radius:3px;padding:0 3px}',
    '#posBox .ps-mk.low{top:-4px}',
    '#posBox .ps-mk.al em{transform:none}',
    '#posBox .ps-mk.ar em{transform:translateX(-100%)}',
    '#posBox .ps-mk.m1{border-color:rgba(108,182,255,.75)}',
    '#posBox .ps-mk.m1 em{color:#6cb6ff}',
    '#posBox .ps-mk.m2{border-color:rgba(255,209,102,.75)}',
    '#posBox .ps-mk.m2 em{color:#ffd166}',
    '#posBox .ps-pin{position:absolute;top:-34px;bottom:0;width:0;margin-left:-1px;border-left:2px solid #4fe0c0}',
    '#posBox .ps-dot{position:absolute;width:10px;height:10px;margin:0 0 -5px -5px;border-radius:50%;background:#4fe0c0;box-shadow:0 0 0 3px rgba(15,19,34,.92)}',
    '#posBox .ps-pl{position:absolute;top:0;transform:translateX(-50%);z-index:1;background:#4fe0c0;color:#0f1322;font-size:11.5px;font-weight:800;line-height:1.4;padding:3px 10px;border-radius:999px;white-space:nowrap}',
    '#posBox .ps-axis{position:relative;height:30px;margin-top:5px}',
    '#posBox .ps-axis span{position:absolute;top:0;transform:translateX(-50%);text-align:center}',
    '#posBox .ps-axis b{display:block;font:700 11px/1.3 \'Outfit\',sans-serif;color:#e8ecf8}',
    '#posBox .ps-axis em{display:block;font:600 9.5px/1.3 \'Outfit\',sans-serif;font-style:normal;color:#8a94b0}',
    '#posBox .ps-dark .ps-strip{margin-top:4px}',
    '#posBox .ps-dark .ps-strip span em{color:#6b7592}',
    '#posBox .ps-dark .ps-strip span.on em{color:#fff}',
    '#posBox .ps-cap{margin:10px 0 0;font-size:11px;color:#8a94b0;line-height:1.6}',
    '#posBox .ps-kpi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    '#posBox .ps-kpi>div{background:rgba(255,255,255,.06);border-radius:10px;padding:10px 12px;min-width:0}',
    '#posBox .ps-kpi span{display:block;font-size:11px;font-weight:700;color:#e8ecf8}',
    '#posBox .ps-kpi .k1 span{color:#6cb6ff}',
    '#posBox .ps-kpi .k2 span{color:#ffd166}',
    '#posBox .ps-kpi b{display:block;font:800 19px/1.3 \'Outfit\',sans-serif;font-variant-numeric:tabular-nums;color:#fff;white-space:nowrap}',
    '#posBox .ps-kpi em{display:block;font-style:normal;font-size:11px;font-weight:700;color:#c9d1e6}',
    '#posBox .ps-kpi .ok em{color:#4fe0c0}',
    '#posBox .ps-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:12px}',
    '#posBox .ps-card{border:1px solid #e3e5ed;border-radius:14px;padding:16px 18px;min-width:0;background:#fff}',
    '#posBox .ps-adopt{margin-top:12px}',
    '#posBox .ps-goal li{padding:7px 0}',
    '#posBox .ps-goal li>div:first-child{display:flex;align-items:baseline;gap:8px;margin-bottom:5px}',
    '#posBox .ps-goal li b{font-size:13px;font-weight:800}',
    '#posBox .ps-goal li small{font-size:11px;color:#6b7385}',
    '#posBox .ps-goal li span{font:600 11.5px/1.4 \'Outfit\',sans-serif;font-variant-numeric:tabular-nums;color:#6b7385}',
    '#posBox .ps-goal li em{margin-left:auto;font-style:normal;font-size:12.5px;font-weight:800;white-space:nowrap}',
    '#posBox .ps-goal li .tr i{background:#e85d12}',
    '#posBox .ps-goal li.ok em{color:#15803d}',
    '#posBox .ps-goal li.ok .tr i{background:#2faa54}',
    '#posBox .ps-adv{display:flex;gap:8px;align-items:flex-start;margin:12px 0 0;background:#effaf3;border-radius:10px;padding:10px 12px;font-size:12.5px;line-height:1.7;color:#3a4055}',
    '#posBox .ps-adv .ps-ic{width:18px;height:18px;color:#15803d;margin-top:2px}',
    '#posBox .ps-adv b{color:#23283a;white-space:nowrap}',
    '#posBox .ps-fac li{padding:7px 0}',
    '#posBox .ps-fac li>div:first-child{display:flex;align-items:center;gap:8px;margin-bottom:5px}',
    '#posBox .ps-fac li b{font-size:13px;font-weight:800}',
    '#posBox .ps-fac li>div:first-child>i{font-style:normal;font-size:10.5px;font-weight:800;line-height:1.6;color:#a15c00;background:#fff1dc;border-radius:999px;padding:0 8px}',
    '#posBox .ps-fac li em{margin-left:auto;font-style:normal;font-size:12.5px;font-weight:800;white-space:nowrap}',
    '#posBox .ps-fac li .tr i{background:#19b5a5}',
    '#posBox .ps-fac li.weak .tr i{background:#f0a23b}',
    '#posBox .ps-fac .fd{display:block;margin-top:4px;font-size:11.5px;color:#6b7385}',
    '#posBox .ps-fac li.na>div:first-child{margin-bottom:0}',
    '#posBox .ps-fc{margin:8px 0 0;font-size:12.5px;color:#3a4055}',
    '#posBox .ps-fc b{color:#23283a}',
    '#posBox .ps-ah{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 14px;margin-bottom:6px}',
    '#posBox .ps-ah h4,#posBox .ps-ah .ps-sub{margin:0}',
    '#posBox .ps-acols{display:grid;grid-template-columns:minmax(0,1fr);gap:14px 28px}',
    '#posBox .ps-at{font-size:11.5px;font-weight:800;color:#6b7385;letter-spacing:.04em;margin:6px 0 4px}',
    '#posBox .ps-rows li{display:grid;grid-template-columns:34px minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:6px 0}',
    '#posBox .ps-av{display:block;width:34px;height:34px;border-radius:10px;background:#eef0f5;overflow:hidden}',
    '#posBox .ps-av img{display:block;width:100%;height:100%;object-fit:cover}',
    '#posBox .ps-rows .nm{min-width:0}',
    '#posBox .ps-rows .nm>div:first-child{display:flex;align-items:center;gap:6px;margin-bottom:4px;min-width:0}',
    '#posBox .ps-rows .nm b{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#posBox .ps-rows .cl{flex:none;font-style:normal;font-size:10px;font-weight:800;line-height:1.7;border-radius:5px;padding:0 6px}',
    '#posBox .cl.inf{background:#e9eef4;color:#4b6889}',
    '#posBox .cl.lan{background:#e1f3ec;color:#157a5a}',
    '#posBox .cl.mks{background:#fdeedd;color:#b85a08}',
    '#posBox .tr i.inf{background:#5b7a9e}',
    '#posBox .tr i.lan{background:#1d9e74}',
    '#posBox .tr i.mks{background:#e8730c}',
    '#posBox .ps-rows .pv{min-width:48px;text-align:right;font:800 13.5px/1.4 \'Outfit\',sans-serif;font-variant-numeric:tabular-nums}',
    '#posBox .ps-rkp,#posBox .ps-rk0{min-width:34px;text-align:center;font-size:11px;font-weight:800;line-height:1.5;border-radius:999px;padding:2px 9px;white-space:nowrap;background:#eef0f5;color:#5b6276}',
    '#posBox .ps-rkp.r1{background:#fff1e8;color:#c2500f}',
    '#posBox .ps-rk0{font-weight:700;color:#8a94b0}',
    '#posBox .ps-combo{display:flex;align-items:center;gap:10px;background:#f6f7fb;border-radius:10px;padding:8px 12px;margin-top:6px;font-size:12.5px}',
    '#posBox .ps-combo span:first-child{flex:1;min-width:0;font-weight:700;color:#3a4055}',
    '#posBox .ps-combo b{font:800 13.5px/1.4 \'Outfit\',sans-serif;font-variant-numeric:tabular-nums}',
    '#posBox .ps-combo.ref span{font-weight:600;color:#6b7385}',
    '#posBox .ps-link{display:inline-flex;align-items:center;gap:4px;margin-top:14px;font-size:13px;font-weight:800;color:#e85d12;text-decoration:none}',
    '#posBox .ps-link .ps-ic{width:17px;height:17px}',
    '#posBox .ps-foot{margin:12px 2px 0;font-size:11px;line-height:1.7;color:#6b7385}',
    '#posBox .ps-foot a{display:inline-flex;align-items:center;gap:2px;color:#5b6276;font-weight:700;white-space:nowrap}',
    '#posBox .ps-foot .ps-ic{width:13px;height:13px}',
    '@container (min-width:720px){#posBox .ps-dark{grid-template-columns:minmax(0,.6fr) minmax(0,1fr);padding:20px 22px;gap:20px 30px}#posBox .ps-kpi{grid-column:1/-1}#posBox .ps-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#posBox .ps-grid.one{grid-template-columns:minmax(0,1fr)}#posBox .ps-acols{grid-template-columns:repeat(2,minmax(0,1fr))}#posBox .ps-chart{height:226px}}',
    '@container (max-width:460px){#posBox .ps-big b{font-size:44px}#posBox .ps-kpi>div{padding:9px 8px}#posBox .ps-kpi span{font-size:10.5px}#posBox .ps-kpi b{font-size:16.5px}#posBox .ps-kpi em{font-size:10.5px}#posBox .ps-chart{height:188px}#posBox .ps-rows li{gap:8px}}',
    '@media(max-width:560px){#posBox{padding:16px 14px}#posBox .ps-card{padding:14px}}'
  ].join('');
  W.WOS_POS = { compact: compact, update: update, ranks: RANKS };
})();
