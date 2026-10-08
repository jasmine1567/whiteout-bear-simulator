/* ==== 熊狩シミュレーター: 結果のグラフ表示 ====
   集結1回のダメージが「どのあたりに出やすいか」の分布図（確率スキルの発動回数を乱数で振って 4000 回ぶん計算）。
   前提: シミュレーター本体のグローバル（__eng()=計算エンジン, g=予測ダメージ）, bear-calc.js（score({roll})）
   モデル: 集結1回＝10回の攻撃。確率スキルは攻撃ごとに独立に発動すると仮定し、10回中の発動割合を roll として渡す。
           全部不発＝下限、全部発動＝上限（従来の表示）と一致する。期待値の計算式には手を入れていない */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  var N_SAMPLES = 6000, VW = 360, VH = 184, PAD_L = 6, PAD_R = 6, TOP = 32, BASE = 138;
  function el(id){ return D.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function fmt(n){ return isFinite(n) ? Math.round(n).toLocaleString('ja-JP') : '—'; }
  function fmtS(n){ if(!isFinite(n)) return '—'; if(n >= 1e9) return (n/1e9).toFixed(2) + 'B'; if(n >= 1e6) return (n/1e6).toFixed(n >= 1e8 ? 0 : 1) + 'M'; if(n >= 1e3) return (n/1e3).toFixed(0) + 'K'; return String(Math.round(n)); }
  /* 再計算のたびに形が揺れないよう、乱数は固定の種から作る */
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  function sample(){
    if(typeof __eng !== 'function') return null;
    var eng = __eng(), T = (W.WOS_CALC && W.WOS_CALC.TURNS) || 10, rnd = rng(20261007), out = new Array(N_SAMPLES);
    var mode = { roll: function(p){
      var pe = p.k === 'chanceUptime' ? 1 - Math.pow(1 - p.p, p.dur) : p.p, k = 0;
      for(var i = 0; i < T; i++) if(rnd() < pe) k++;
      return k / T;
    } };
    for(var i = 0; i < N_SAMPLES; i++){ var s = eng.score(mode).score; if(!isFinite(s)) return null; out[i] = Math.ceil(s); }
    out.sort(function(a, b){ return a - b; });
    return out;
  }
  function q(xs, p){ return xs[Math.min(xs.length - 1, Math.max(0, Math.round((xs.length - 1) * p)))]; }

  var box, lastKey = '';
  function render(){
    var rb = el('rangeBox'); if(!rb || !box) return;
    if(rb.style.display === 'none' || typeof g !== 'number' || !(g > 0)){ lastKey = ''; return; }
    var key = el('totalDmg').textContent + '|' + el('dmgMin').textContent + '|' + el('dmgMax').textContent;
    if(key === lastKey) return; lastKey = key;
    var xs; try{ xs = sample(); }catch(e){ xs = null; }
    if(!xs || xs[xs.length - 1] - xs[0] < 1){ box.innerHTML = ''; rb.classList.remove('has-viz'); W.__WOS_DIST = null; return; }
    rb.classList.add('has-viz');
    var p5 = q(xs, 0.05), p50 = q(xs, 0.5), p95 = q(xs, 0.95), lo = xs[0], hi = xs[xs.length - 1];
    var span = hi - lo, x0 = lo - span * 0.06, x1 = hi + span * 0.06;
    /* 起こりうる値は飛び飛び（発動回数は整数）なので、そのまま棒にすると歯抜けに見える。
       細かく数えてから、なだらかにならして「出やすさの山」として描く（下振れ・中央値・上振れの数字は元の試行結果から出す） */
    var FINE = 96, fw = (x1 - x0) / FINE, cnt = [], dens = [], sg = FINE / 30, R = Math.ceil(sg * 3);
    for(var i = 0; i < FINE; i++) cnt.push(0);
    xs.forEach(function(v){ cnt[Math.min(FINE - 1, Math.max(0, Math.floor((v - x0) / fw)))]++; });
    for(i = 0; i < FINE; i++){ var acc = 0; for(var j = -R; j <= R; j++){ var k = i + j; if(k >= 0 && k < FINE) acc += cnt[k] * Math.exp(-j * j / (2 * sg * sg)); } dens.push(acc); }
    var max = Math.max.apply(null, dens) || 1;
    function X(v){ return PAD_L + (v - x0) / (x1 - x0) * (VW - PAD_L - PAD_R); }
    function Y(d){ return BASE - d / max * (BASE - TOP); }
    function dAt(v){ return dens[Math.min(FINE - 1, Math.max(0, Math.floor((v - x0) / fw)))]; }
    function area(a, b){
      var d = '', first = true, lastX = 0;
      for(var i = 0; i < FINE; i++){ var mid = x0 + (i + 0.5) * fw; if(mid < a || mid > b) continue; var px = X(mid), py = Y(dens[i]); d += (first ? 'M' + px.toFixed(1) + ' ' + BASE + 'L' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1); first = false; lastX = px; }
      return first ? '' : d + 'L' + lastX.toFixed(1) + ' ' + BASE + 'Z';
    }
    var line = dens.map(function(d, i){ return (i ? 'L' : 'M') + X(x0 + (i + 0.5) * fw).toFixed(1) + ' ' + Y(d).toFixed(1); }).join('');
    var x5 = X(p5), x50 = X(p50), x95 = X(p95), BRK = TOP - 9, f1 = function(n){ return n.toFixed(1); };
    /* 目盛り線（きりのいい数字） */
    var raw = (x1 - x0) / 4, p10 = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), fr = raw / p10, step = (fr < 1.5 ? 1 : fr < 3.5 ? 2 : fr < 7.5 ? 5 : 10) * p10, grid = '';
    for(var gv = Math.ceil(x0 / step) * step; gv < x1; gv += step){ var gx = X(gv); if(gx < PAD_L + 8 || gx > VW - PAD_R - 8) continue; grid += '<line class="dv-grid" x1="' + f1(gx) + '" x2="' + f1(gx) + '" y1="' + TOP + '" y2="' + BASE + '"/><text class="dv-scale" x="' + f1(gx) + '" y="' + (VH - 3) + '" text-anchor="middle">' + fmtS(gv) + '</text>'; }
    for(i = 1; i <= 3; i++) grid += '<line class="dv-grid h" x1="' + PAD_L + '" x2="' + (VW - PAD_R) + '" y1="' + f1(BASE - (BASE - TOP) * i / 4) + '" y2="' + f1(BASE - (BASE - TOP) * i / 4) + '"/>';
    /* 試行結果そのものを、等間隔に抜き出して目盛りとして並べる（密なところ＝出やすいところ） */
    var rug = '', RUG = 150;
    for(i = 0; i < RUG; i++){ var rx = X(xs[Math.floor((i + 0.5) / RUG * xs.length)]); rug += 'M' + f1(rx) + ' ' + (BASE + 1.5) + 'v4'; }
    function mark(x, v, cls, name, top){
      var an = x < 26 ? 'start' : x > VW - 26 ? 'end' : 'middle', yc = Y(dAt(v));
      return '<g class="dv-mk ' + cls + '"><line x1="' + f1(x) + '" x2="' + f1(x) + '" y1="' + f1(top == null ? yc : top) + '" y2="' + (BASE + 7) + '"/><circle cx="' + f1(x) + '" cy="' + f1(yc) + '" r="3"/>'
        + (name ? '<text class="v" x="' + f1(x) + '" y="' + (BASE + 18) + '" text-anchor="' + an + '">' + fmtS(v) + '</text><text class="n" x="' + f1(x) + '" y="' + (BASE + 28) + '" text-anchor="' + an + '">' + esc(name) + '</text>' : '') + '</g>';
    }
    var ev = Math.min(x1, Math.max(x0, g)), xe = X(ev), anchor = xe < 60 ? 'start' : xe > VW - 60 ? 'end' : 'middle';
    var showMid = x50 - x5 > 40 && x95 - x50 > 40;
    var bx = (x5 + x95) / 2;
    var svg = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' + esc(t('集結1回のダメージの出やすさの分布', 'Distribution of damage per rally')) + '">'
      + '<defs><linearGradient id="dvG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a4d" stop-opacity=".95"/><stop offset="1" stop-color="#ff6a1f" stop-opacity=".18"/></linearGradient>'
      + '<linearGradient id="dvG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa0c8" stop-opacity=".5"/><stop offset="1" stop-color="#8fa0c8" stop-opacity=".06"/></linearGradient></defs>'
      + grid
      + '<rect class="dv-band" x="' + f1(x5) + '" y="' + TOP + '" width="' + f1(Math.max(1, x95 - x5)) + '" height="' + (BASE - TOP) + '"/>'
      + '<g class="dv-rise"><path class="dv-a out" d="' + area(x0, x1) + '"/><path class="dv-a" d="' + area(p5, p95) + '"/><path class="dv-l" d="' + line + '"/></g>'
      + '<path class="dv-rug" d="' + rug + '"/>'
      + '<line class="dv-axis" x1="' + PAD_L + '" x2="' + (VW - PAD_R) + '" y1="' + BASE + '" y2="' + BASE + '"/>'
      + '<g class="dv-in">'
      + '<path class="dv-brk" d="M' + f1(x5) + ' ' + (BRK + 5) + 'V' + BRK + 'H' + f1(x95) + 'V' + (BRK + 5) + '"/>'
      + '<text class="dv-brkt" x="' + f1(bx) + '" y="' + (BRK + 3) + '" text-anchor="middle">' + esc(t('10回中9回はこの範囲', '9 in 10 rallies land here')) + '</text>'
      + '<line class="dv-ev" x1="' + f1(xe) + '" x2="' + f1(xe) + '" y1="' + TOP + '" y2="' + BASE + '"/><line class="dv-ev" x1="' + f1(xe) + '" x2="' + f1(xe) + '" y1="11.5" y2="' + (BRK - 3) + '"/>'
      + '<text class="dv-evt" x="' + f1(xe) + '" y="9" text-anchor="' + anchor + '">' + esc(t('期待値 ', 'Expected ')) + fmtS(g) + '</text>'
      + mark(x5, p5, 'lo', t('下振れ', 'Unlucky'), BRK) + mark(x95, p95, 'hi', t('上振れ', 'Lucky'), BRK) + mark(x50, p50, 'mid', showMid ? t('中央値', 'Median') : '', null)
      + '</g><g class="dv-rolls"></g>'
      + '<line class="dv-cur" x1="0" x2="0" y1="' + TOP + '" y2="' + BASE + '" style="display:none"/><rect class="dv-hit" x="' + PAD_L + '" y="' + TOP + '" width="' + (VW - PAD_L - PAD_R) + '" height="' + (BASE - TOP) + '"/>'
      + '</svg>';
    W.__WOS_DIST = { g: g, p5: p5, p50: p50, p95: p95, lo: lo, hi: hi, x0: x0, x1: x1, dens: dens, max: max };
    var above = 0; xs.forEach(function(v){ if(v >= g) above++; });
    box.innerHTML = '<div class="dv-chart">' + svg + '<div class="dv-tip" hidden></div>'
      + '<div class="dv-bar"><a class="dv-roll" href="#" role="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/></svg>' + t('集結5回をシミュレーション', 'Simulate 5 rallies') + '</a>'
      + '<span class="dv-res">' + t(N_SAMPLES.toLocaleString() + '回の試行から作成', 'Built from ' + N_SAMPLES.toLocaleString() + ' simulated rallies') + '</span></div><div class="dv-out" hidden></div></div>'
      + '<div class="dv-tiles">'
      + '<div class="dv-tile lo"><span><i></i>' + t('下振れライン', 'Unlucky line') + '</span><b>' + fmt(p5) + '</b><em>' + t('20回に1回はこれ以下', '1 in 20 falls below') + '</em></div>'
      + '<div class="dv-tile main"><span><i></i>' + t('ふつう（中央値）', 'Typical (median)') + '</span><b>' + fmt(p50) + '</b><em>' + t('2回に1回はこれ以上', 'Half land above') + '</em></div>'
      + '<div class="dv-tile hi"><span><i></i>' + t('上振れライン', 'Lucky line') + '</span><b>' + fmt(p95) + '</b><em>' + t('20回に1回はこれ以上', '1 in 20 goes above') + '</em></div>'
      + '</div>'
      + '<p class="dv-foot">' + t('期待値以上が出る確率は 約' + Math.round(above / xs.length * 100) + '%。', 'Chance of reaching the expected value or more: ~' + Math.round(above / xs.length * 100) + '%. ')
      + t('山の形は、いまの編成とスキルから毎回計算しています（同じ入力なら同じ形になります）。理論上の範囲は ', 'The curve is recomputed from your lineup and skills each time (same inputs give the same shape). Theoretical range: ')
      + esc((el('dmgMin').textContent || '').replace(/^\D+/, '')) + ' 〜 ' + esc((el('dmgMax').textContent || '').replace(/^\D+/, '')) + t('（全部不発〜全部発動）。', ' (none trigger – all trigger).') + '</p>';
    /* 「集結5回をシミュレーション」: 熊狩り1回（30分）でかけられる集結は最大5回。試行結果から5つ選んで図に落とし、1〜5回目と最高・最低・平均を出す */
    var rolls = box.querySelector('.dv-rolls'), res = box.querySelector('.dv-res'), out = box.querySelector('.dv-out'), NS = 'http://www.w3.org/2000/svg', nRun = 0, RALLIES = 5;
    function verdictOf(top){ return top <= 5 ? [t('大きく上振れ', 'very lucky'), 'up2'] : top <= 30 ? [t('やや上振れ', 'a bit lucky'), 'up'] : top < 70 ? [t('ふつう', 'typical'), ''] : top < 95 ? [t('やや下振れ', 'a bit unlucky'), 'dn'] : [t('大きく下振れ', 'very unlucky'), 'dn2']; }
    box.querySelector('.dv-roll').addEventListener('click', function(e){
      e.preventDefault(); nRun++;
      var picks = [], k;
      for(k = 0; k < RALLIES; k++){ var idx = Math.floor(Math.random() * xs.length); picks.push({ v: xs[idx], top: Math.max(1, Math.round((1 - idx / xs.length) * 100)) }); }
      /* 前回までの結果は小さな点として残す（最大60個） */
      [].forEach.call(rolls.querySelectorAll('.now'), function(n){ var c = n.querySelector('circle'), d = D.createElementNS(NS, 'circle'); d.setAttribute('class', 'past'); d.setAttribute('cx', c.getAttribute('cx')); d.setAttribute('cy', f1(BASE - 4 - Math.random() * 10)); d.setAttribute('r', '1.5'); rolls.insertBefore(d, rolls.firstChild); n.parentNode.removeChild(n); });
      var old = rolls.querySelectorAll('.past'); for(k = 0; k < old.length - 60; k++) rolls.removeChild(old[old.length - 1 - k]);
      picks.forEach(function(pk, i){
        var px = X(pk.v), py = Y(dAt(pk.v)) - 7, gp = D.createElementNS(NS, 'g'); gp.setAttribute('class', 'now'); gp.setAttribute('style', 'animation-delay:' + (i * 110) + 'ms');
        gp.innerHTML = '<line x1="' + f1(px) + '" x2="' + f1(px) + '" y1="' + f1(py) + '" y2="' + BASE + '"/><circle cx="' + f1(px) + '" cy="' + f1(py) + '" r="5.2"/><text x="' + f1(px) + '" y="' + f1(py + 2.6) + '" text-anchor="middle">' + (i + 1) + '</text>';
        rolls.appendChild(gp);
      });
      var vs = picks.map(function(pk){ return pk.v; }), mx = Math.max.apply(null, vs), mn = Math.min.apply(null, vs), sum = vs.reduce(function(a, v){ return a + v; }, 0), avg = sum / RALLIES;
      var diff = Math.round((avg / g - 1) * 100), dtx = (diff > 0 ? '+' : '') + diff + '%';
      res.className = 'dv-res on'; res.innerHTML = t(nRun + '回目の挑戦', 'Run #' + nRun);
      out.hidden = false;
      out.innerHTML = '<ol class="dv-list">' + picks.map(function(pk, i){
          var vd = verdictOf(pk.top), w = Math.max(3, Math.min(100, (pk.v - x0) / (x1 - x0) * 100));
          return '<li class="' + (pk.v === mx ? 'dv-best ' : '') + (pk.v === mn && mx !== mn ? 'dv-worst' : '') + '" style="animation-delay:' + (i * 110) + 'ms"><span class="no">' + (i + 1) + '</span><span class="lb">' + t((i + 1) + '回目', 'Rally ' + (i + 1)) + '</span>'
            + '<span class="br"><span style="width:' + w.toFixed(1) + '%"></span></span><b>' + fmt(pk.v) + '</b><span class="vd ' + vd[1] + '">' + vd[0] + '</span></li>';
        }).join('') + '</ol>'
        + '<div class="dv-sum">'
        + '<div class="hi"><span>' + t('上振れ（最高）', 'Best') + '</span><b>' + fmt(mx) + '</b></div>'
        + '<div class="av"><span>' + t('5回の平均', 'Average of 5') + '</span><b>' + fmt(avg) + '</b></div>'
        + '<div class="lo"><span>' + t('下振れ（最低）', 'Worst') + '</span><b>' + fmt(mn) + '</b></div>'
        + '<div class="to"><span>' + t('5回の合計', 'Total of 5') + '</span><b>' + fmt(sum) + '</b></div>'
        + '</div><p class="dv-cmp">' + t('今回の平均は期待値とくらべて <b>' + dtx + '</b>。もう一度押すと、別の5回を試せます。', 'This run averaged <b>' + dtx + '</b> vs. the expected value. Press again for another five.') + '</p>';
    });
    var tip = box.querySelector('.dv-tip'), chart = box.querySelector('.dv-chart'), svgEl = box.querySelector('svg'), cur = box.querySelector('.dv-cur');
    function show(e){
      if(!e){ tip.hidden = true; cur.style.display = 'none'; return; }
      var r = svgEl.getBoundingClientRect(), fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), vx = fx * VW;
      var v = x0 + (vx - PAD_L) / (VW - PAD_L - PAD_R) * (x1 - x0), a = 0, b = xs.length;
      while(a < b){ var m = (a + b) >> 1; if(xs[m] < v) a = m + 1; else b = m; }
      var pc = (1 - a / xs.length) * 100;
      cur.setAttribute('x1', vx.toFixed(1)); cur.setAttribute('x2', vx.toFixed(1)); cur.style.display = '';
      tip.innerHTML = '<b>' + fmtS(Math.max(0, v)) + '</b> ' + t('以上が出る確率 ', 'or more: ') + '<b>' + (pc > 99.4 ? '99%+' : pc < 0.6 ? '1%' + t('未満', '-') : Math.round(pc) + '%') + '</b>';
      tip.hidden = false;
      var half = tip.offsetWidth / 2; tip.style.left = (svgEl.offsetLeft + Math.max(half, Math.min(r.width - half, fx * r.width))) + 'px';
    }
    svgEl.addEventListener('pointermove', show);
    svgEl.addEventListener('pointerdown', show);
    svgEl.addEventListener('pointerleave', function(){ show(null); });
  }

  function mount(){
    var rb = el('rangeBox'), src = el('totalDmg'); if(!rb || !src) return;
    var title = rb.querySelector('.rb-title'); if(title) title.textContent = t('🎲 集結1回のダメージの出やすさ（確率スキルのぶれ）', '🎲 How damage per rally is distributed (chance skills)');
    box = D.createElement('div'); box.id = 'distViz'; rb.appendChild(box);
    var st = D.createElement('style');
    st.textContent = '#rangeBox.has-viz .range-vals,#rangeBox.has-viz .range-track{display:none}'
      + '#distViz .dv-chart{position:relative;margin-top:6px;padding:12px 10px 10px;border-radius:14px;background:linear-gradient(180deg,#171c30,#0f1322);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}'
      + '#distViz svg{display:block;width:100%;height:auto;overflow:visible;touch-action:pan-y}'
      + '#distViz .dv-grid{stroke:#fff;stroke-opacity:.07;stroke-width:1}#distViz .dv-grid.h{stroke-dasharray:2 4}'
      + '#distViz .dv-scale{font-size:7.5px;fill:#7f89a6;font-variant-numeric:tabular-nums}'
      + '#distViz .dv-band{fill:#ff8a3d;opacity:.07}'
      + '#distViz .dv-a{fill:url(#dvG)}#distViz .dv-a.out{fill:url(#dvG2)}'
      + '#distViz .dv-l{fill:none;stroke:#ffb37a;stroke-width:1.6;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(255,138,61,.7))}'
      + '#distViz .dv-rise{transform-origin:0 138px;animation:dvRise .7s cubic-bezier(.2,.8,.2,1) both}'
      + '#distViz .dv-in{animation:dvIn .45s .45s both}'
      + '@keyframes dvRise{from{transform:scaleY(0)}to{transform:none}}@keyframes dvIn{from{opacity:0}to{opacity:1}}'
      + '@media(prefers-reduced-motion:reduce){#distViz .dv-rise,#distViz .dv-in{animation:none}}'
      + '#distViz .dv-rug{stroke:#ffb37a;stroke-opacity:.45;stroke-width:.6}'
      + '#distViz .dv-hit{fill:transparent;cursor:crosshair}#distViz .dv-cur{stroke:#fff;stroke-width:1;opacity:.6}'
      + '#distViz .dv-axis{stroke:#fff;stroke-opacity:.28;stroke-width:1}'
      + '#distViz .dv-ev{stroke:#ffd166;stroke-width:1.2;stroke-dasharray:3 2}'
      + '#distViz .dv-evt{font-size:9.5px;font-weight:800;fill:#ffd166}'
      + '#distViz .dv-brk{fill:none;stroke:#c9d2ea;stroke-width:1}'
      + '#distViz .dv-brkt{font-size:8.5px;font-weight:700;fill:#e8ecf8;paint-order:stroke;stroke:#151a2d;stroke-width:5px;stroke-linejoin:round}'
      + '#distViz .dv-mk line{stroke-width:1.2}#distViz .dv-mk circle{stroke:#11162a;stroke-width:1.2}'
      + '#distViz .dv-mk .v{font-size:10px;font-weight:800;font-variant-numeric:tabular-nums}#distViz .dv-mk .n{font-size:7.5px;font-weight:700;opacity:.85}'
      + '#distViz .dv-mk.lo line{stroke:#6cb6ff}#distViz .dv-mk.lo circle,#distViz .dv-mk.lo text{fill:#6cb6ff}'
      + '#distViz .dv-mk.hi line{stroke:#4fe0c0}#distViz .dv-mk.hi circle,#distViz .dv-mk.hi text{fill:#4fe0c0}'
      + '#distViz .dv-mk.mid line{stroke:#fff;stroke-opacity:.75;stroke-dasharray:1.5 2}#distViz .dv-mk.mid circle,#distViz .dv-mk.mid text{fill:#fff}'
      + '#distViz .dv-rolls .past{fill:#ff5fa2;opacity:.45}#distViz .dv-rolls .now line{stroke:#ff5fa2;stroke-width:1.2}#distViz .dv-rolls .now circle{fill:#ff5fa2;stroke:#fff;stroke-width:1.1}'
      + '#distViz .dv-rolls .now text{font-size:7px;font-weight:800;fill:#fff;pointer-events:none}'
      + '#distViz .dv-out{margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px}'
      + '#distViz .dv-list{list-style:none;margin:0;padding:0;display:grid;gap:5px}'
      + '#distViz .dv-list li{display:grid;grid-template-columns:20px auto minmax(30px,1fr) auto 74px;align-items:center;gap:8px;font-size:12px;color:#c9d2ea;animation:dvRow .35s both}'
      + '@keyframes dvRow{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}'
      + '#distViz .dv-list .no{width:20px;height:20px;border-radius:50%;background:#ff5fa2;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center}'
      + '#distViz .dv-list .lb{font-size:11px;color:#9aa5c4;white-space:nowrap}'
      + '#distViz .dv-list .br{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}#distViz .dv-list .br span{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#ff6a1f,#ffb37a)}'
      + '#distViz .dv-list b{font-size:13.5px;color:#fff;font-variant-numeric:tabular-nums;text-align:right;letter-spacing:-.01em}'
      + '#distViz .dv-list .vd{font-size:10.5px;font-weight:700;color:#aab3cc;white-space:nowrap}#distViz .dv-list .vd.up,#distViz .dv-list .vd.up2{color:#4fe0c0}#distViz .dv-list .vd.dn,#distViz .dv-list .vd.dn2{color:#6cb6ff}'
      + '#distViz .dv-list li.dv-best b{color:#4fe0c0}#distViz .dv-list li.dv-worst b{color:#6cb6ff}'
      + '#distViz .dv-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}'
      + '#distViz .dv-sum div{background:rgba(255,255,255,.06);border-radius:9px;padding:7px 4px;text-align:center;min-width:0}'
      + '#distViz .dv-sum span{display:block;font-size:9.5px;font-weight:700;color:#aab3cc;white-space:nowrap}#distViz .dv-sum b{display:block;font-size:clamp(10.5px,2.9vw,12.5px);color:#fff;font-variant-numeric:tabular-nums;margin-top:2px;letter-spacing:-.02em;white-space:nowrap}'
      + '#distViz .dv-sum .hi span{color:#4fe0c0}#distViz .dv-sum .lo span{color:#6cb6ff}#distViz .dv-sum .av span{color:#ffd166}#distViz .dv-sum .to span{color:#ff9cc6}'
      + '#distViz .dv-cmp{margin:8px 0 0;font-size:11px;color:#9aa5c4}#distViz .dv-cmp b{color:#ffd166}'
      + '@media(max-width:420px){#distViz .dv-sum{grid-template-columns:repeat(2,1fr)}#distViz .dv-list li{grid-template-columns:20px minmax(20px,1fr) auto 66px;gap:6px}#distViz .dv-list .lb{display:none}}'
      + '#distViz .dv-rolls .now{animation:dvDrop .35s cubic-bezier(.3,1.4,.5,1) both}@keyframes dvDrop{from{transform:translateY(-26px);opacity:0}to{transform:none;opacity:1}}'
      + '#distViz .dv-tip{position:absolute;top:4px;transform:translateX(-50%);background:#fff;color:#23283a;font-size:11px;padding:3px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;font-variant-numeric:tabular-nums;box-shadow:0 2px 8px rgba(0,0,0,.3)}'
      + '#distViz .dv-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:8px}'
      + '#distViz .dv-roll{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(255,95,162,.14);box-shadow:inset 0 0 0 1px rgba(255,95,162,.55);color:#ff9cc6;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap}'
      + '#distViz .dv-roll:active{transform:scale(.97)}#distViz .dv-roll svg{width:15px;height:15px;fill:currentColor;display:block}'
      + '#distViz .dv-res{font-size:11px;color:#7f89a6;font-variant-numeric:tabular-nums}#distViz .dv-res.on{color:#e8ecf8;font-size:12px}#distViz .dv-res b{color:#ff9cc6;font-size:13.5px}#distViz .dv-res span{color:#aab3cc}'
      + '#distViz .dv-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}'
      + '#distViz .dv-tile{background:#f6f7fb;border-radius:9px;padding:7px 3px 6px;text-align:center;min-width:0}'
      + '#distViz .dv-tile.main{background:#fff3ea}'
      + '#distViz .dv-tile span{display:block;font-size:10px;font-weight:700;color:#2f8be6;line-height:1.3}#distViz .dv-tile.main span{color:#23283a}#distViz .dv-tile.hi span{color:#0d9c81}'
      + '#distViz .dv-tile span i{display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;margin-right:4px;vertical-align:1px}'
      + '#distViz .dv-tile b{display:block;font-size:clamp(10.5px,3.1vw,12.5px);color:#23283a;font-variant-numeric:tabular-nums;margin-top:2px;white-space:nowrap;letter-spacing:-.02em}'
      + '#distViz .dv-tile em{display:block;font-style:normal;font-size:9px;color:#6b7385;line-height:1.3;margin-top:1px}'
      + '#distViz .dv-tile.main b{font-weight:800}'
      + '#distViz .dv-foot{margin:8px 0 0;font-size:10.5px;line-height:1.6;color:#6b7385}';
    D.head.appendChild(st);
    var tm = null, kick = function(){ clearTimeout(tm); tm = setTimeout(render, 120); };
    new MutationObserver(kick).observe(src, { childList: true, characterData: true, subtree: true });
    new MutationObserver(kick).observe(rb, { attributes: true, attributeFilter: ['style'] });
    ['dmgMin', 'dmgMax'].forEach(function(id){ var e = el(id); if(e) new MutationObserver(kick).observe(e, { childList: true, characterData: true, subtree: true }); });
    kick();
  }
  if(D.readyState !== 'loading') mount(); else D.addEventListener('DOMContentLoaded', mount);
})();

/* ==== 分析レポート ====
   結果一式（.rcol）を入力欄の下に全幅の「レポート」として並べ直し、総評・兵種の内訳・スキル効果の図を足す。
   予測ダメージは画面下のバー（#rpBar）で常に見え、押すとレポートへ移動する。
   数字はすべて既存の表示（#totalDmg など）と分布図の結果から読むだけで、計算には触れない */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  function el(id){ return D.getElementById(id); }
  function n(txt){ var v = parseFloat(String(txt == null ? '' : txt).replace(/[^\d.\-]/g, '')); return isFinite(v) ? v : 0; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function mk(tag, cls, html){ var e = D.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  var rcol, res, c1, c2, c3, sum, bar, lineup;
  /* Google Material Symbols（Rounded・Apache-2.0）の形を inline SVG で描く */
  var IC = {"bar_chart":"M690-160q-12.75 0-21.37-8.63Q660-177.25 660-190v-220q0-12.75 8.63-21.38Q677.25-440 690-440h80q12.75 0 21.38 8.62Q800-422.75 800-410v220q0 12.75-8.62 21.37Q782.75-160 770-160h-80Zm-250 0q-12.75 0-21.37-8.63Q410-177.25 410-190v-580q0-12.75 8.63-21.38Q427.25-800 440-800h80q12.75 0 21.38 8.62Q550-782.75 550-770v580q0 12.75-8.62 21.37Q532.75-160 520-160h-80Zm-250 0q-12.75 0-21.37-8.63Q160-177.25 160-190v-380q0-12.75 8.63-21.38Q177.25-600 190-600h80q12.75 0 21.38 8.62Q300-582.75 300-570v380q0 12.75-8.62 21.37Q282.75-160 270-160h-80Z","trending_up":"M102-252q-9-9-9-21.5t9-21.5l228-227q16.93-17 41.97-17Q397-539 414-522l125 125 241-241h-97q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h167q12.75 0 21.38 8.62Q880-680.75 880-668v167q0 12-8.27 21t-20.5 9Q839-471 830-480t-9-21v-93L580-354q-16.93 17-41.97 17Q513-337 496-354L371-478 145-252q-9 9-21.5 9t-21.5-9Z","warning":"M92-120q-9 0-15.5-4T66-135q-4-7-4.5-14.5T66-165l388-670q5-8 11.5-11.5T480-850q8 0 14.5 3.5T506-835l388 670q5 8 4.5 15.5T894-135q-4 7-10.5 11t-15.5 4H92Zm52-60h672L480-760 144-180Zm361.5-65.5Q514-254 514-267t-8.5-21.5Q497-297 484-297t-21.5 8.5Q454-280 454-267t8.5 21.5Q471-237 484-237t21.5-8.5Zm0-111Q514-365 514-378v-164q0-13-8.5-21.5T484-572q-13 0-21.5 8.5T454-542v164q0 13 8.5 21.5T484-348q13 0 21.5-8.5ZM480-470Z","share":"M686-80q-47.5 0-80.75-33.25T572-194q0-8 5-34L278-403q-16.28 17.34-37.64 27.17Q219-366 194-366q-47.5 0-80.75-33T80-480q0-48 33.25-81T194-594q24 0 45 9.3 21 9.29 37 25.7l301-173q-2-8-3.5-16.5T572-766q0-47.5 33.25-80.75T686-880q47.5 0 80.75 33.25T800-766q0 47.5-33.25 80.75T686-652q-23.27 0-43.64-9Q622-670 606-685L302-516q3 8 4.5 17.5t1.5 18q0 8.5-1 16t-3 15.5l303 173q16-15 36.09-23.5 20.1-8.5 43.07-8.5Q734-308 767-274.75T800-194q0 47.5-33.25 80.75T686-80Zm.04-60q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm-492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5ZM724.5-727.54q15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5 22.96 0 38.46-15.54ZM686-194ZM194-480Zm492-286Z","forum":"M850.33-123q-5.33 0-10.83-2t-10.5-7L721-240H300q-24.75 0-42.37-17.63Q240-275.25 240-300v-80h440q24.75 0 42.38-17.63Q740-415.25 740-440v-280h80q24.75 0 42.38 17.62Q880-684.75 880-660v507q0 14-9.5 22t-20.17 8ZM140-425l75-75h405v-320H140v395Zm-30.33 103Q99-322 89.5-330q-9.5-8-9.5-22v-468q0-24.75 17.63-42.38Q115.25-880 140-880h480q24.75 0 42.38 17.62Q680-844.75 680-820v320q0 24.75-17.62 42.37Q644.75-440 620-440H240L131-331q-5 5-10.5 7t-10.83 2ZM140-500v-320 320Z","photo_camera":"M479.5-267q72.5 0 121.5-49t49-121.5q0-72.5-49-121T479.5-607q-72.5 0-121 48.5t-48.5 121q0 72.5 48.5 121.5t121 49Zm0-60q-47.5 0-78.5-31.5t-31-79q0-47.5 31-78.5t78.5-31q47.5 0 79 31t31.5 78.5q0 47.5-31.5 79t-79 31.5ZM140-120q-24 0-42-18t-18-42v-513q0-23 18-41.5t42-18.5h147l55-66q8-11 20-16t26-5h184q14 0 26 5t20 16l55 66h147q23 0 41.5 18.5T880-693v513q0 24-18.5 42T820-120H140Zm0-60h680v-513H645l-73-87H388l-73 87H140v513Zm340-257Z","save":"M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h478q12.44 0 23.72 5T701-822l121 121q8 8 13 19.28 5 11.28 5 23.72v478q0 24-18 42t-42 18H180Zm600-536L656-780H180v600h600v-476ZM553.5-275.26q30.5-30.27 30.5-73.5 0-43.24-30.26-73.74-30.27-30.5-73.5-30.5-43.24 0-73.74 30.26-30.5 30.27-30.5 73.5 0 43.24 30.26 73.74 30.27 30.5 73.5 30.5 43.24 0 73.74-30.26ZM263-584h298q12.75 0 21.38-8.63Q591-601.25 591-614v-83q0-12.75-8.62-21.38Q573.75-727 561-727H263q-12.75 0-21.37 8.62Q233-709.75 233-697v83q0 12.75 8.63 21.37Q250.25-584 263-584Zm-83-72v476-600 124Z","casino":"M335.5-264.62q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm0-360q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm180 180q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm180 180q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62Zm0-360q14.5-14.62 14.5-35.5 0-20.88-14.62-35.38-14.62-14.5-35.5-14.5-20.88 0-35.38 14.62-14.5 14.62-14.5 35.5 0 20.88 14.62 35.38 14.62 14.5 35.5 14.5 20.88 0 35.38-14.62ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Z","target":"M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM721-239q99-99 99-241t-99-241q-99-99-241-99t-241 99q-99 99-99 241t99 241q99 99 241 99t241-99Zm-411-71q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm297.5-42.5Q660-405 660-480t-52.5-127.5Q555-660 480-660t-127.5 52.5Q300-555 300-480t52.5 127.5Q405-300 480-300t127.5-52.5Zm-184-71Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5Z","image":"M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0 0v-600 600Zm86-97h429q8.5 0 12.75-8t-.75-16L590-457q-5-6-12-6t-12 6L446-302l-81-111q-5-6-12-6t-12 6l-86 112q-6 8-1.75 16t12.75 8Z","edit_note":"M190-410q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h240q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm0-165q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h410q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm0-165q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h410q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm330 550v-81q0-5.57 2-10.78 2-5.22 7-10.22l211.61-210.77q9.11-9.12 20.25-13.18Q772-520 783-520q12 0 23 4.5t20 13.5l37 37q9 9 13 20t4 22q0 11-4.5 22.5t-13.58 20.62L652-169q-5 5-10.22 7-5.21 2-10.78 2h-81q-12.75 0-21.37-8.63Q520-177.25 520-190Zm300-233-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z","extension":"M180-180h560v-173q0-9 4.5-16t12.5-11l24-11q19-8 30.5-27t11.5-40q0-21.43-11.5-39.72Q800-516 781-525l-24-11q-8.13-3.75-12.57-10.88Q740-554 740-563v-177H564q-10.66 0-18.83-7-8.17-7-10.17-18.33L530-791q-5-27-24.67-45.5-19.68-18.5-45.91-18.5Q432-855 412-836.5T387-791l-5 25.67Q380-754 371.83-747q-8.17 7-18.83 7H181v110q55 20 89 66.78t34 105.5q0 59.72-34 107.22T180-287v107Zm11 60q-29 0-50-21t-21-51v-121q0-8 5-13t13-7q45-9 75.5-43.08T244-458q0-48.03-30-82.52Q184-575 139-583q-8-2-13-7t-5-13v-126q0-30 20.5-50.5T192-800h136q6.63-48.88 43.58-81.94Q408.53-915 458.74-915q49.26 0 86.45 33.06Q582.37-848.88 590-800h139q30 0 50.5 20.5T800-729v147q38 18 60.5 49.5T883-458q0 43-22.5 75T800-334v142q0 30-20.5 51T729-120H191Zm311-338Z","check_circle":"m421-389-98-98q-9-9-22-9t-23 10q-9 9-9 22t9 22l122 123q9 9 21 9t21-9l239-239q10-10 10-23t-10-23q-10-9-23.5-8.5T635-603L421-389Zm59 309q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z","shield":"M470.12-85q-4.56-1-9.12-3-139-47-220-168.5t-81-266.61V-719q0-19.26 10.88-34.66Q181.75-769.07 199-776l260-97q11-4 21-4t21 4l260 97q17.25 6.93 28.13 22.34Q800-738.26 800-719v195.89Q800-378 719-256.5T499-88q-4.56 2-9.12 3T480-84q-5.32 0-9.88-1Zm9.88-58q115-38 187.5-143.5T740-523v-196l-260-98-260 98v196q0 131 72.5 236.5T480-143Zm0-337Z","groups":"M30-240q-12.75 0-21.37-8.63Q0-257.25 0-270v-23q0-38.57 41.5-62.78Q83-380 150.38-380q12.16 0 23.39.5t22.23 2.15q-8 17.35-12 35.17-4 17.81-4 37.18v65H30Zm240 0q-12.75 0-21.37-8.63Q240-257.25 240-270v-35q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v35q0 12.75-8.62 21.37Q702.75-240 690-240H270Zm510 0v-65q0-19.86-3.5-37.43T765-377.27q11-1.73 22.17-2.23 11.17-.5 22.83-.5 67.5 0 108.75 23.77T960-293v23q0 12.75-8.62 21.37Q942.75-240 930-240H780Zm-480-60h360v-6q0-37-50.5-60.5T480-390q-79 0-129.5 23.5T300-305v5ZM149.57-410q-28.57 0-49.07-20.56Q80-451.13 80-480q0-29 20.56-49.5Q121.13-550 150-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T149.57-410Zm660 0q-28.57 0-49.07-20.56Q740-451.13 740-480q0-29 20.56-49.5Q781.13-550 810-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T809.57-410ZM480-480q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm.35-60Q506-540 523-557.35t17-43Q540-626 522.85-643t-42.5-17q-25.35 0-42.85 17.15t-17.5 42.5q0 25.35 17.35 42.85t43 17.5ZM480-300Zm0-300Z","tune":"M435.5-128.63Q427-137.25 427-150v-165q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v53h323q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H487v52q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM150-202q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h187q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H150Zm165.5-174.63Q307-385.25 307-398v-52H150q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h157v-54q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v166q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM457-450q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h353q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H457Zm144.5-173.63Q593-632.25 593-645v-165q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v52h157q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H653v53q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM150-698q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h353q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H150Z","arrow_forward":"M686-450H190q-13 0-21.5-8.5T160-480q0-13 8.5-21.5T190-510h496L459-737q-9-9-9-21t9-21q9-9 21-9t21 9l278 278q5 5 7 10t2 11q0 6-2 11t-7 10L501-181q-9 9-21 9t-21-9q-9-9-9-21t9-21l227-227Z","arrow_downward":"M450-274v-496q0-13 8.5-21.5T480-800q13 0 21.5 8.5T510-770v496l227-227q9-9 21-9t21 9q9 9 9 21t-9 21L501-181q-5 5-10 7t-11 2q-6 0-11-2t-10-7L181-459q-9-9-9-21t9-21q9-9 21-9t21 9l227 227Z","calculate":"M314-316v63q0 10.83 7.12 17.92 7.11 7.08 18 7.08 10.88 0 17.88-7.08 7-7.09 7-17.92v-63h63q10.83 0 17.92-7.12 7.08-7.11 7.08-18 0-10.88-7.08-17.88-7.09-7-17.92-7h-63v-63q0-10.83-7.12-17.92-7.11-7.08-18-7.08-10.88 0-17.88 7.08-7 7.09-7 17.92v63h-63q-10.83 0-17.92 7.12-7.08 7.11-7.08 18 0 10.88 7.08 17.88 7.09 7 17.92 7h63Zm240 53h152q10.4 0 17.2-7.12 6.8-7.11 6.8-18 0-10.88-6.5-17.38Q717-312 706-312H553q-10.4 0-17.2 6.5-6.8 6.5-6.8 17.38 0 10.89 7.08 18Q543.17-263 554-263Zm0-107h151q10.83 0 17.92-7.12 7.08-7.11 7.08-18 0-10.88-7.08-17.88-7.09-7-17.92-7H554q-10.83 0-17.92 7.12-7.08 7.11-7.08 18 0 10.88 7.08 17.88 7.09 7 17.92 7ZM266-605h146q10.83 0 17.92-7.12 7.08-7.11 7.08-18 0-10.88-7.08-17.88-7.09-7-17.92-7H266q-10.83 0-17.92 7.12-7.08 7.11-7.08 18 0 10.88 7.08 17.88 7.09 7 17.92 7Zm-86 485q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Zm447 186 43 43q7.64 8 17.82 8t18.18-8q8-8 8-18t-8-18l-43-43 43-43q8-7.64 8-17.82T706-709q-8-8-18.18-8T670-709l-43 43-43-43q-7.64-8-17.82-8T548-709q-8 8-8 18.18t8 17.82l43 43-43 43q-8 7.71-8 18t8 18q7.64 8 17.82 8t18.18-8l43-43Z","lightbulb":"M422.5-103.5Q399-127 399-161h162q0 34-23.5 57.5T480-80q-34 0-57.5-23.5ZM348-223q-13 0-21.5-8.5T318-253q0-13 8.5-21.5T348-283h264q13 0 21.5 8.5T642-253q0 13-8.5 21.5T612-223H348Zm-25-121q-66-43-104.5-107.5T180-597q0-122 89-211t211-89q122 0 211 89t89 211q0 81-38 145.5T637-344H323Zm22-60h271q48-32 76-83t28-110q0-99-70.5-169.5T480-837q-99 0-169.5 70.5T240-597q0 59 28 110t77 83Zm135 0Z","compare_arrows":"M396-323H110q-13 0-21.5-8.5T80-353q0-13 8.5-21.5T110-383h286L296-483q-9-9-9-21t9-21q9-9 21-9t21 9l151 151q5 5 7 10t2 11q0 6-2 11t-7 10L338-181q-9 9-21 9t-21-9q-9-9-9-21t9-21l100-100Zm168-254 100 100q9 9 9 21t-9 21q-9 9-21 9t-21-9L471-586q-5-5-7-10t-2-11q0-6 2-11t7-10l151-151q9-9 21-9t21 9q9 9 9 21t-9 21L564-637h286q13 0 21.5 8.5T880-607q0 13-8.5 21.5T850-577H564Z","info":"M504.5-288.63q8.5-8.62 8.5-21.37v-180q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v180q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63Zm-1-314.57q9.5-9.2 9.5-22.8 0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2t23.52-9.2ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z","military_tech":"m480-161-73 54q-9 7-17.5.5T384-124l28-90-73-54q-9-7-5.25-17T348-295h90l25-97-140-82q-20.37-11.7-31.68-30.85Q280-524 280-547v-273q0-24.75 17.63-42.38Q315.25-880 340-880h280q24.75 0 42.38 17.62Q680-844.75 680-820v273q0 23-11.32 42.15Q657.37-485.7 637-474l-141 82 26 97h89q10.5 0 14.25 10T620-268l-73 54 28 90q3 11-5.5 17t-17.5-1l-72-53ZM340-820v273q0 7 4.5 13t13.5 11l96 53v-350H340Zm280 0H514v350l88-53q9-5 13.5-11t4.5-13v-273ZM484-637Zm-30-8Zm60 0Z","rate_review":"M270-400h81q5.57 0 10.78-2 5.22-2 10.22-7l189.83-190.56q9.08-9.13 13.63-20.78Q580-632 580-643t-4-22q-4-11-13-20l-36.8-37.19Q517-731 506-735.5t-23-4.5q-11 0-22 4t-20.18 13.14L249-532q-5 5-7 10.22-2 5.21-2 10.78v81q0 12.75 8.63 21.37Q257.25-400 270-400Zm250-243-37-37 37 37ZM300-460v-38l102-101 19 18 18 19-101 102h-38Zm121-121 18 19-37-37 19 18Zm14 181h255q12.75 0 21.38-8.68 8.62-8.67 8.62-21.5 0-12.82-8.62-21.32-8.63-8.5-21.38-8.5H495l-60 60ZM240-240 131-131q-14 14-32.5 6.34Q80-132.31 80-152v-668q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H240Zm-26-60h606v-520H140v600l74-80Zm-74 0v-520 520Z","analytics":"M292.5-473.38Q284-464.75 284-452v145q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-145q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62Zm332-215Q616-679.75 616-667v360q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-360q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62Zm-166 302Q450-377.75 450-365v58q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-58q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Zm321.5 289.32q8.5-8.67 8.5-21.5 0-12.82-8.68-21.32-8.67-8.5-21.5-8.5-12.82 0-21.32 8.68-8.5 8.67-8.5 21.5 0 12.82 8.68 21.32 8.67 8.5 21.5 8.5 12.82 0 21.32-8.68Z","my_location":"M450-72v-45q-137-14-228-105T117-450H72q-13 0-21.5-8.5T42-480q0-13 8.5-21.5T72-510h45q14-137 105-228t228-105v-45q0-13 8.5-21.5T480-918q13 0 21.5 8.5T510-888v45q137 14 228 105t105 228h45q13 0 21.5 8.5T918-480q0 13-8.5 21.5T888-450h-45q-14 137-105 228T510-117v45q0 13-8.5 21.5T480-42q-13 0-21.5-8.5T450-72Zm244.5-193.5Q784-355 784-480t-89.5-214.5Q605-784 480-784t-214.5 89.5Q176-605 176-480t89.5 214.5Q355-176 480-176t214.5-89.5Zm-321-108Q330-417 330-480t43.5-106.5Q417-630 480-630t106.5 43.5Q630-543 630-480t-43.5 106.5Q543-330 480-330t-106.5-43.5ZM544-416q26-26 26-64t-26-64q-26-26-64-26t-64 26q-26 26-26 64t26 64q26 26 64 26t64-26Zm-64-64Z","swords":"M769-88 645-212l-67 67q-19 19-35.5 4.5T514-167q-17-17-17-42t17-42l199-199q17-17 42-17t42 17q12 12 26.5 28.5T819-386l-67 67 123 124q9 9 9 21t-9 21l-64 65q-9 9-21 9t-21-9Zm102-627L427-271l19 20q30 30 15 57t-37 49q-9 9-21 9t-21-9l-67-67L191-88q-9 9-21 9t-21-9l-65-65q-9-9-9-21t9-21l124-124-67-67q-9-9-9-21t9-21q22-22 49-37t57 15l20 19 435-435q8-8 19.5-13t23.5-5h105q13 0 21.5 8.5T880-854v118q0 6-2 11t-7 10ZM320-568l38-38 38-38-38 38-38 38Zm-63 21L98-706q-8-8-13-19.5T80-749v-105q0-13 8.5-21.5T110-884h105q12 0 23.5 5t19.5 13l159 159q9 9 9 21t-9 21q-9 9-21 9t-21-9L215-824h-75v75l159 160q9 9 9 21t-9 21q-9 9-21 9t-21-9Zm126 233 437-435v-75h-75L308-389l75 75Zm0 0-37-38-38-37 38 37 37 38Z","leaderboard":"M140-180h187v-360H140v360Zm247 0h186v-600H387v600Zm246 0h187v-280H633v280Zm-553 0v-360q0-24.75 17.63-42.38Q115.25-600 140-600h187v-180q0-24.75 17.63-42.38Q362.25-840 387-840h186q24.75 0 42.38 17.62Q633-804.75 633-780v260h187q24.75 0 42.38 17.62Q880-484.75 880-460v280q0 24.75-17.62 42.37Q844.75-120 820-120H140q-24.75 0-42.37-17.63Q80-155.25 80-180Z","monitoring":"M128.5-128.63Q120-137.25 120-150v-46q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v46q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q285-137.25 285-150v-206q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v206q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q450-137.25 450-150v-146q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v146q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q615-137.25 615-150v-246q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v246q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63Zm165 0Q780-137.25 780-150v-366q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v366q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63ZM559.5-499q-11.5 0-22.46-4.7-10.97-4.69-20.04-13.3L400-634 172-407q-9.07 9-21.53 8.5-12.47-.5-21.34-9.5-8.13-9-8.63-21t8.5-21l229-227q9.07-8.87 20.04-12.93Q389-694 400-694t22.34 4.07Q433.68-685.87 442-677l118 118 229-229q9-9 21-9t20.87 9q8.13 9 8.63 21t-8.5 21L602-517q-8 9-19.5 13.5t-23 4.5Z"};
  function ic(name){ return IC[name] ? '<svg class="ms rp-ic" viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="' + IC[name] + '"/></svg>' : ''; }
  /* 見出しやボタンの先頭にある絵文字を、対応するアイコンに差し替える */
  var EMO = { '📊': 'bar_chart', '📈': 'trending_up', '⚠': 'warning', '🔗': 'share', '💬': 'forum', '📸': 'photo_camera', '💾': 'save', '🎲': 'casino', '🎯': 'my_location', '🖼': 'image', '📝': 'edit_note', '🧩': 'extension', '✅': 'check_circle', '📲': 'info', '🛡': 'shield', '⚙': 'tune', '💡': 'lightbulb', '📋': 'analytics', '🏹': 'swords', '⬆': 'trending_up', '🔍': 'analytics' };
  var EMO_RE = /^\s*(📊|📈|⚠|🔗|💬|📸|💾|🎲|🎯|🖼|📝|🧩|✅|📲|🛡|⚙|💡|📋|🏹|⬆|🔍)\uFE0F?\s*/;
  function iconize(root){
    (root || D).querySelectorAll('h2,h3,h4,summary,button,.rb-title,.note,label,a.ghost,b').forEach(function(e){
      var tn = e.firstChild; while(tn && tn.nodeType === 1 && !tn.classList.contains('ms') && tn.firstChild) tn = tn.firstChild;
      if(!tn || tn.nodeType !== 3) return;
      var m = EMO_RE.exec(tn.nodeValue); if(!m) return;
      tn.nodeValue = tn.nodeValue.slice(m[0].length);
      var w = D.createElement('span'); w.innerHTML = ic(EMO[m[1]]); if(w.firstChild) tn.parentNode.insertBefore(w.firstChild, tn);
    });
  }
  /* 「内容を見る」などを押したとき、移動先がどこか一目で分かるよう枠を光らせる */
  function flash(tg){
    if(!tg) return;
    var dt = tg.closest('details'); if(dt) dt.open = true;
    var box = tg.matches('input,select') ? (tg.closest('details') || tg.parentNode) : tg;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.classList.remove('rp-flash'); void box.offsetWidth; box.classList.add('rp-flash');
    setTimeout(function(){ box.classList.remove('rp-flash'); }, 2600);
    if(tg.matches('input,select')) setTimeout(function(){ try{ tg.focus({ preventScroll: true }); }catch(_){} }, 500);
  }
  function heroPic(id, cls){ var src = W.WOS_heroImg && W.WOS_heroImg(id); var hh = (typeof h === 'function') ? h(id) : null; var nm = hh ? (W.WOS_heroName ? W.WOS_heroName(hh) : hh.name) : id;
    return '<span class="rp-hero ' + (cls || '') + '">' + (src ? '<img src="' + src + '" alt="" width="40" height="40">' : '<i></i>') + '<em>' + esc(nm) + '</em></span>'; }

  function layout(){
    rcol = D.querySelector('.rcol'); res = rcol && rcol.querySelector('.result'); if(!rcol || !res) return false;
    D.body.classList.add('rp-on'); rcol.id = 'report';
    rcol.insertBefore(mk('div', 'rp-head', '<span class="rp-k">REPORT</span><h2>' + t('分析レポート', 'Analysis report') + '</h2><p>'
      + t('入力した編成から、予測ダメージ・運による振れ幅・内訳・次の一手までまとめて分析します。', 'From your setup: estimated damage, luck range, breakdown and the best next step.') + '</p>'), rcol.firstChild);
    var cols = mk('div', 'rp-cols'); c1 = mk('div'); c2 = mk('div'); c3 = mk('div'); cols.appendChild(c1); cols.appendChild(c2); cols.appendChild(c3);
    var head = res.querySelector('.dmg-head'); head.parentNode.insertBefore(cols, head.nextSibling);
    lineup = mk('div', 'rp-lineup'); head.parentNode.insertBefore(lineup, cols);
    c1.appendChild(mk('div', 'rp-t', t('同じ世代の中での位置', 'Where you stand in your generation')));
    c1.appendChild(mk('div', '', '<div class="rp-t rp-sec">' + t('スキル・装備の効果', 'Skill and gear effects') + '</div><div class="rp-mul" id="rpMul"></div>'));
    var rb = el('rangeBox'); if(rb) c2.appendChild(rb);
    c3.appendChild(mk('div', 'rp-t', t('兵種別のダメージ', 'Damage by troop type')));
    c3.appendChild(mk('div', '', '<div class="rp-stack" id="rpStack"></div><div class="rp-legend" id="rpLegend"></div>'));
    var bars = res.querySelector('.bars'); if(bars) c3.appendChild(bars);
    sum = mk('div', '', ''); sum.id = 'rpSummary'; res.parentNode.insertBefore(sum, res.nextSibling);
    var r2 = mk('div', 'rp-row2'), r3 = mk('div', 'rp-row3');
    sum.parentNode.insertBefore(r2, sum.nextSibling); r2.parentNode.insertBefore(r3, r2.nextSibling);
    ['adviceBox', 'overlapBox'].forEach(function(id){ var e = el(id); if(e) r2.appendChild(e); });
    ['shareBox', 'statsBox', 'snapBox', 'presetBox'].forEach(function(id){ var e = el(id); if(e) r3.appendChild(e); });
    bar = mk('div', '', '<span class="l">' + t('予測ダメージ', 'EST. DAMAGE') + '</span><span class="v">—</span><span class="d"></span><a href="#report">' + t('レポートを見る', 'See report') + ic('arrow_downward') + '</a>');
    bar.id = 'rpBar'; D.body.appendChild(bar);
    bar.querySelector('a').addEventListener('click', function(e){ e.preventDefault(); rcol.scrollIntoView({ behavior: 'smooth', block: 'start' }); res.classList.remove('rp-flash'); void res.offsetWidth; res.classList.add('rp-flash'); setTimeout(function(){ res.classList.remove('rp-flash'); }, 2600); });
    return true;
  }
  function adoptUsage(){ var u = el('usageBox'); if(u && c1 && u.parentNode !== c1) c1.insertBefore(u, c1.children[1] || null); }

  function render(){
    if(!res) return; adoptUsage();
    var dmg = (typeof g === 'number' && isFinite(g) && g > 0) ? g : 0;
    /* 兵種の内訳 */
    var parts = [['inf', n(el('dInf').textContent), t('盾兵', 'Infantry')], ['lan', n(el('dLan').textContent), t('槍兵', 'Lancer')], ['mks', n(el('dMks').textContent), t('弓兵', 'Marksman')]];
    var tot = parts[0][1] + parts[1][1] + parts[2][1];
    var pct = function(v){ var p = tot > 0 ? v / tot * 100 : 0; return p >= 9.95 || p === 0 ? Math.round(p) : p.toFixed(1); };
    el('rpStack').innerHTML = tot > 0 ? parts.map(function(p){ return p[1] > 0 ? '<i class="s-' + p[0] + '" style="flex:' + Math.max(p[1] / tot, 0.004) + '" title="' + p[2] + ' ' + pct(p[1]) + '%"></i>' : ''; }).join('') : '';
    el('rpLegend').innerHTML = tot > 0 ? parts.map(function(p){ return '<span><i style="background:var(--' + p[0] + ')"></i>' + p[2] + ' <b>' + pct(p[1]) + '%</b></span>'; }).join('') : '';
    /* スキル・装備の効果 */
    var muls = [[t('集結主スキル', 'Leader skills'), n(el('leaderMod').textContent)], [t('参加者スキル', 'Joiner skills'), n(el('joinerMod').textContent)], [t('罠・専用装備', 'Trap & gear'), n(el('extraMod').textContent)]];
    var mx = Math.max(2, muls[0][1], muls[1][1], muls[2][1]);
    el('rpMul').innerHTML = dmg ? muls.map(function(m){ var w = m[1] > 1 ? Math.log(m[1]) / Math.log(mx) * 100 : 2; return '<span>' + m[0] + '</span><span class="tr"><i style="width:' + Math.max(2, Math.min(100, w)).toFixed(0) + '%"></i></span><b>×' + m[1].toFixed(2) + '</b>'; }).join('') : '<span style="grid-column:1/-1;color:#9aa0b0">—</span>';
    /* 総評 */
    var items = [];
    if(dmg){
      var dist = W.__WOS_DIST;
      if(dist && dist.g === dmg && dist.p95 > dist.p5){
        var lo = Math.round((dist.p5 / dist.p50 - 1) * 100), hi = Math.round((dist.p95 / dist.p50 - 1) * 100);
        items.push(['casino', '', t('運による振れ幅は <b>' + lo + '% 〜 +' + hi + '%</b>。ふつうは <b>' + Math.round(dist.p50).toLocaleString('ja-JP') + '</b> 前後に落ち着きます。',
          'Luck swings the result by <b>' + lo + '% to +' + hi + '%</b>; a typical rally lands near <b>' + Math.round(dist.p50).toLocaleString('en-US') + '</b>.')]);
      }
      var top = parts.slice().sort(function(a, b){ return b[1] - a[1]; })[0];
      if(tot > 0){
        var zero = [];
        if(!(n(el('nInf').value) > 0)) zero.push(t('盾兵', 'infantry')); if(!(n(el('nLan').value) > 0)) zero.push(t('槍兵', 'lancers'));
        if(zero.length) items.push(['warning', 'warn', t('<b>' + zero.join('・') + 'が0人</b>です。少しでも入れると目減りを避けられます。', '<b>No ' + zero.join(' or ') + '</b> in the march — adding even a few avoids a loss.')]);
        else items.push(['swords', '', t('ダメージの <b>' + pct(top[1]) + '%</b> は' + top[2] + 'が出しています。' + top[2] + 'の攻撃・殺傷を伸ばすのが近道です。', '<b>' + pct(top[1]) + '%</b> of the damage comes from ' + top[2].toLowerCase() + ' — raising their attack and lethality pays off most.')]);
      }
      var adv = D.querySelector('#adviceList li');
      if(adv && el('adviceBox').style.display !== 'none'){
        var sp = adv.querySelectorAll('span');
        items.push(['trending_up', 'good', t('いちばん伸びる一手：<b>' + esc(sp[0].textContent) + '</b>（' + esc(sp[1] ? sp[1].textContent : '') + '）', 'Best next step: <b>' + esc(sp[0].textContent) + '</b> (' + esc(sp[1] ? sp[1].textContent : '') + ')') + ' <a href="#adviceBox">' + t('ほかの候補', 'more') + ic('arrow_forward') + '</a>']);
      }
      var ov = el('overlapBox');
      if(ov && ov.style.display !== 'none'){
        var k = ov.querySelectorAll('#overlapList li').length;
        items.push(['extension', 'warn', t('スキルの<b>枠かぶりが ' + k + ' 件</b>あります。種類をばらすと掛け算で伸びます。', '<b>' + k + ' overlapping skill slot(s)</b> — spreading skill types multiplies better.') + ' <a href="#overlapBox">' + t('内容を見る', 'details') + ic('arrow_forward') + '</a>']);
      } else if(ov){
        items.push(['check_circle', 'good', t('スキルの枠かぶりはありません。種類がうまく分かれています。', 'No overlapping skill slots — your skill types are well spread.')]);
      }
      var sc = D.querySelector('#usageBox .ug-score');
      if(sc){ var tp = D.querySelector('#usageBox .ug-top'); items.push(['leaderboard', '', t('同じ世代の利用者の中で<b>偏差値 ' + esc(sc.textContent) + '</b>（' + esc(tp ? tp.textContent : '') + '）です。', 'Your score among players of the same generation is <b>' + esc(sc.textContent) + '</b> (' + esc(tp ? tp.textContent : '') + ').')]); }
      var kf = el('kFactor');
      if(kf && Math.abs(n(kf.value) - n(kf.defaultValue)) < 1e-9) items.push(['my_location', '', t('実際のダメージを1回入れると、あなたの環境に合わせて補正できます。', 'Enter one real result to calibrate the estimate to your account.') + ' <a href="#observed">' + t('実測を入れる', 'calibrate') + ic('arrow_forward') + '</a>']);
    }
    sum.innerHTML = '<div class="rp-sh"><img class="rp-greg" src="/assets/img/greg-bust.webp?v=130" alt="" width="422" height="300" decoding="async"><div><h3>' + ic('edit_note') + t('総評', 'Summary') + '</h3>'
      + '<p class="no-hero-ico">' + t('分析担当のグレッグが、今回の結果から読み取れることをまとめました。', 'Greg, our analyst, sums up what this result tells you.') + '</p></div></div>' + (items.length
      ? '<ul>' + items.map(function(it){ return '<li class="' + it[1] + '"><span class="ic">' + ic(it[0]) + '</span><span>' + it[2] + '</span></li>'; }).join('') + '</ul>'
      : '<p class="note" style="margin:0">' + t('STEP2 の必須項目を入力すると、ここに分析結果が表示されます。', 'Fill in the required fields in STEP 2 to see the analysis here.') + '</p>');
    sum.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener('click', function(e){ var tg = el(a.getAttribute('href').slice(1)); if(!tg) return; e.preventDefault(); flash(tg); }); });
    /* 編成（集結主3人・参加者4人）を顔つきで並べる */
    try{
      var Ls = (u.leader || []).filter(Boolean), Js = (u.joiner || []).filter(Boolean);
      lineup.innerHTML = '<div><span class="rp-lt">' + t('集結主', 'Leader') + '</span>' + Ls.map(function(x){ return heroPic(x.heroId, 'ld'); }).join('') + '</div>'
        + '<div><span class="rp-lt">' + t('参加者', 'Joiners') + '</span>' + (Js.length ? Js.map(function(x){ return heroPic(x.heroId); }).join('') : '<span class="rp-none">—</span>') + '</div>';
    }catch(_){ lineup.innerHTML = ''; }
    /* 文中の英雄名に顔アイコンを付け、絵文字はアイコンに差し替える */
    if(W.WOS_heroDecorate) W.WOS_heroDecorate([sum, el('adviceBox'), el('overlapBox')].filter(Boolean));
    iconize(rcol);
    /* 画面下のバー */
    bar.querySelector('.v').textContent = dmg ? el('totalDmg').textContent : '—';
    var sc2 = D.querySelector('#usageBox .ug-score'); bar.querySelector('.d').textContent = dmg && sc2 ? t('偏差値 ', 'Score ') + sc2.textContent : '';
    barState.has = !!dmg; showBar();
  }
  var barState = { has: false, seen: false };
  function showBar(){ if(bar) bar.classList.toggle('show', barState.has && !barState.seen); }

  function mount(){
    if(!el('totalDmg') || !layout()) return;
    var tm = null, kick = function(){ clearTimeout(tm); tm = setTimeout(render, 420); };
    new MutationObserver(kick).observe(res, { childList: true, characterData: true, subtree: true });
    ['adviceBox', 'overlapBox'].forEach(function(id){ var e = el(id); if(e) new MutationObserver(kick).observe(e, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] }); });
    ['nInf', 'nLan', 'kFactor'].forEach(function(id){ var e = el(id); if(e) e.addEventListener('input', kick); });
    if('IntersectionObserver' in W){
      new IntersectionObserver(function(es){ es.forEach(function(e){ barState.seen = e.isIntersecting; showBar(); }); }, { threshold: 0 }).observe(rcol);
    }
    iconize(D.querySelector('.grid') || D.body);
    setTimeout(render, 0); setTimeout(render, 900);
  }
  if(D.readyState !== 'loading') mount(); else D.addEventListener('DOMContentLoaded', mount);
})();


/* ==== 共有用の画像（Xに貼りやすい 16:9・1600×900） ====
   レポートの要点（予測ダメージ・運の振れ幅と分布・偏差値・兵種の内訳・スキルの効果・編成の顔ぶれ）を1枚にまとめる。
   本体の buildResultCanvas() を差し替える形で使う（保存・端末共有・プレビューの流れは本体のまま） */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  function el(id){ return D.getElementById(id); }
  function n(txt){ var v = parseFloat(String(txt == null ? '' : txt).replace(/[^\d.\-]/g, '')); return isFinite(v) ? v : 0; }
  var NUM = '"Outfit","Noto Sans JP",sans-serif', TXT = '"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif';
  var imgs = {};
  function pic(id){
    if(imgs[id]) return imgs[id];
    var src = W.WOS_heroImg && W.WOS_heroImg(id); if(!src) return null;
    var im = new Image(); im.decoding = 'async'; im.src = src; imgs[id] = im; return im;
  }
  function heroName(id){ var hh = (typeof h === 'function') ? h(id) : null; return hh ? (W.WOS_heroName ? W.WOS_heroName(hh) : hh.name) : id; }
  function preload(){ try{ (u.leader || []).concat(u.joiner || []).forEach(function(x){ if(x) pic(x.heroId); }); }catch(e){} }
  function rr(x, X, Y, w, hh, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + hh, r); x.arcTo(X + w, Y + hh, X, Y + hh, r); x.arcTo(X, Y + hh, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function fit(x, text, font, size, maxW){ do{ x.font = font.replace('%', size); if(x.measureText(text).width <= maxW) break; size -= 2; }while(size > 18); return size; }
  function fmtS(v){ if(!isFinite(v)) return '—'; if(v >= 1e9) return (v / 1e9).toFixed(2) + 'B'; if(v >= 1e6) return (v / 1e6).toFixed(v >= 1e8 ? 0 : 1) + 'M'; if(v >= 1e3) return (v / 1e3).toFixed(0) + 'K'; return String(Math.round(v)); }
  function grad(x, x0, y0, x1, y1){ var gd = x.createLinearGradient(x0, y0, x1, y1); gd.addColorStop(0, '#ffb23f'); gd.addColorStop(1, '#ff5a36'); return gd; }
  function avatar(x, id, cx, cy, r, ring){
    var im = pic(id);
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.closePath();
    if(im && im.complete && im.naturalWidth){ x.clip(); x.drawImage(im, cx - r, cy - r, r * 2, r * 2); }
    else { x.fillStyle = '#3a3d4d'; x.fill(); x.fillStyle = '#fff'; x.font = '700 ' + Math.round(r * 0.9) + 'px ' + TXT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(heroName(id).charAt(0), cx, cy + 2); }
    x.restore();
    x.beginPath(); x.arc(cx, cy, r + 3, 0, Math.PI * 2); x.lineWidth = 5; x.strokeStyle = ring ? grad(x, cx - r, cy - r, cx + r, cy + r) : 'rgba(255,255,255,.28)'; x.stroke();
  }

  function build(){
    var CW = 1600, CH = 900, cv = D.createElement('canvas'); cv.width = CW; cv.height = CH;
    var x = cv.getContext('2d'); x.textBaseline = 'alphabetic';
    var dmg = (typeof g === 'number' && g > 0) ? g : 0, EN = (W.WOS_LANG || 'ja') === 'en';
    /* 背景 */
    var bg = x.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, '#12131a'); bg.addColorStop(1, '#1e2030'); x.fillStyle = bg; x.fillRect(0, 0, CW, CH);
    var gl = x.createRadialGradient(260, 120, 0, 260, 120, 760); gl.addColorStop(0, 'rgba(255,122,47,.30)'); gl.addColorStop(1, 'rgba(255,122,47,0)'); x.fillStyle = gl; x.fillRect(0, 0, CW, CH);
    var gl2 = x.createRadialGradient(1500, 880, 0, 1500, 880, 620); gl2.addColorStop(0, 'rgba(123,97,255,.20)'); gl2.addColorStop(1, 'rgba(123,97,255,0)'); x.fillStyle = gl2; x.fillRect(0, 0, CW, CH);
    x.fillStyle = grad(x, 0, 0, CW, 0); x.fillRect(0, 0, CW, 8);
    /* ヘッダー */
    var L = 72;
    rr(x, L, 48, 46, 46, 13); x.fillStyle = grad(x, L, 48, L + 46, 94); x.fill();
    x.fillStyle = '#fff'; x.font = '800 26px ' + NUM; x.textAlign = 'center'; x.fillText('W', L + 23, 81); x.textAlign = 'left';
    x.fillStyle = '#fff'; x.font = '800 28px ' + TXT; x.fillText(t('ホワサバ ツールラボ', 'Whiteout Tools Lab'), L + 62, 70);
    x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '500 19px ' + TXT; x.fillText(t('熊狩ダメージ・シミュレーター ｜ 分析レポート', 'Bear Hunt Damage Simulator | Analysis report'), L + 62, 96);
    var gen = n(el('curGen') && el('curGen').value), chip = t('第' + gen + '世代', 'Gen ' + gen);
    x.font = '800 26px ' + TXT; var cw = x.measureText(chip).width + 44; rr(x, CW - 72 - cw, 50, cw, 46, 23); x.strokeStyle = '#ff8a3d'; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = '#ffb27a'; x.textAlign = 'center'; x.fillText(chip, CW - 72 - cw / 2, 83); x.textAlign = 'left';
    /* 予測ダメージ */
    x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '700 24px ' + TXT; x.fillText(t('予測ダメージ（集結1回の期待値）', 'ESTIMATED DAMAGE PER RALLY'), L, 170);
    var numT = Math.round(dmg).toLocaleString(EN ? 'en-US' : 'ja-JP'), sz = fit(x, numT, '800 %px ' + NUM, 158, 880);
    x.fillStyle = grad(x, L, 190, L + 880, 320); x.fillText(numT, L - 4, 190 + sz * 0.86);
    /* 下振れ・ふつう・上振れ */
    var d = W.__WOS_DIST, hasD = d && d.g === dmg && d.p95 > d.p5, ty = 360;
    var tiles = hasD ? [[t('下振れ', 'UNLUCKY'), d.p5, t('20回に1回', '1 in 20')], [t('ふつう', 'TYPICAL'), d.p50, t('中央値', 'median')], [t('上振れ', 'LUCKY'), d.p95, t('20回に1回', '1 in 20')]] : [];
    tiles.forEach(function(tl, i){
      var tx = L + i * 300, mid = i === 1;
      rr(x, tx, ty, 280, 112, 20); x.fillStyle = mid ? 'rgba(255,138,61,.20)' : 'rgba(255,255,255,.07)'; x.fill();
      if(mid){ x.strokeStyle = 'rgba(255,138,61,.75)'; x.lineWidth = 2; x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,.72)'; x.font = '700 20px ' + TXT; x.fillText(tl[0], tx + 22, ty + 38);
      x.fillStyle = 'rgba(255,255,255,.42)'; x.font = '500 16px ' + TXT; x.textAlign = 'right'; x.fillText(tl[2], tx + 258, ty + 37); x.textAlign = 'left';
      x.fillStyle = '#fff'; x.font = '800 44px ' + NUM; x.fillText(fmtS(tl[1]), tx + 22, ty + 90);
    });
    /* 分布の山 */
    var gx = L, gw = 880, gy0 = 502, gb = 646;
    if(hasD && d.dens){
      var N = d.dens.length, X = function(i){ return gx + (i + 0.5) / N * gw; }, Y = function(v){ return gb - v / d.max * (gb - gy0); };
      var vx = function(v){ return gx + (v - d.x0) / (d.x1 - d.x0) * gw; };
      var path = function(a, b){ x.beginPath(); var st = false, lx = 0; for(var i = 0; i < N; i++){ var px = X(i); if(px < a || px > b) continue; if(!st){ x.moveTo(px, gb); st = true; } x.lineTo(px, Y(d.dens[i])); lx = px; } if(st){ x.lineTo(lx, gb); x.closePath(); } return st; };
      if(path(gx, gx + gw)){ x.fillStyle = 'rgba(255,138,61,.20)'; x.fill(); }
      if(path(vx(d.p5), vx(d.p95))){ var ag = x.createLinearGradient(0, gy0, 0, gb); ag.addColorStop(0, 'rgba(255,150,70,.95)'); ag.addColorStop(1, 'rgba(255,94,58,.35)'); x.fillStyle = ag; x.fill(); }
      x.beginPath(); for(var i = 0; i < N; i++){ if(i) x.lineTo(X(i), Y(d.dens[i])); else x.moveTo(X(i), Y(d.dens[i])); } x.strokeStyle = '#ffb27a'; x.lineWidth = 3; x.lineJoin = 'round'; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 2; x.beginPath(); x.moveTo(gx, gb); x.lineTo(gx + gw, gb); x.stroke();
      var ex = Math.max(gx, Math.min(gx + gw, vx(dmg))); x.setLineDash([7, 6]); x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(ex, gy0 - 6); x.lineTo(ex, gb); x.stroke(); x.setLineDash([]);
      x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '500 17px ' + NUM; x.fillText(fmtS(d.lo), gx, gb + 26); x.textAlign = 'right'; x.fillText(fmtS(d.hi), gx + gw, gb + 26);
      x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,.72)'; x.font = '700 17px ' + TXT; x.fillText(t('ダメージの出やすさ（90%はオレンジの範囲）', 'How likely each result is (90% fall in the orange band)'), gx + gw / 2, gb + 26); x.textAlign = 'left';
    } else {
      x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '500 20px ' + TXT; x.fillText(t('この編成は確率スキルによるぶれがありません。', 'No chance-based variance in this setup.'), gx, 420);
    }
    /* 右パネル */
    var px = 1010, pw = 518, py = 142, ph = 528; rr(x, px, py, pw, ph, 28); x.fillStyle = 'rgba(255,255,255,.06)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.10)'; x.lineWidth = 1.5; x.stroke();
    var ix = px + 34, iw = pw - 68, cy = py + 48;
    var sc = D.querySelector('#usageBox .ug-score'), tp = D.querySelector('#usageBox .ug-top');
    x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '700 21px ' + TXT; x.fillText(t('同じ世代の中での位置', 'POSITION IN YOUR GENERATION'), ix, cy);
    if(sc){
      x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '700 26px ' + TXT; x.fillText(t('偏差値', 'Score'), ix, cy + 78);
      x.fillStyle = grad(x, ix, cy + 20, ix + 300, cy + 100); x.font = '800 96px ' + NUM; x.fillText(sc.textContent, ix + (EN ? 84 : 96), cy + 92);
      var tw0 = x.measureText(sc.textContent).width, pt = tp ? tp.textContent : '';
      if(pt){ x.font = '800 24px ' + TXT; var pwd = x.measureText(pt).width + 32, pxx = Math.min(ix + (EN ? 84 : 96) + tw0 + 18, px + pw - 34 - pwd); rr(x, pxx, cy + 46, pwd, 42, 21); x.fillStyle = '#fff'; x.fill(); x.fillStyle = '#e85d12'; x.textAlign = 'center'; x.fillText(pt, pxx + pwd / 2, cy + 76); x.textAlign = 'left'; }
    } else {
      x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '500 22px ' + TXT; x.fillText(t('この世代はデータ集計中', 'Still collecting data for this generation'), ix, cy + 62);
    }
    /* 兵種の内訳 */
    cy += 150; x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '700 21px ' + TXT; x.fillText(t('兵種別のダメージ', 'DAMAGE BY TROOP TYPE'), ix, cy);
    var parts = [[t('盾', 'INF'), n(el('dInf').textContent), '#8fb3d9'], [t('槍', 'LAN'), n(el('dLan').textContent), '#3ecf9a'], [t('弓', 'MKS'), n(el('dMks').textContent), '#ff9a3d']];
    var tot = parts[0][1] + parts[1][1] + parts[2][1] || 1, bx = ix;
    parts.forEach(function(p){ var w = Math.max(p[1] / tot * (iw - 8), p[1] > 0 ? 6 : 0); if(w > 0){ rr(x, bx, cy + 20, w, 24, 6); x.fillStyle = p[2]; x.fill(); bx += w + 4; } });
    var lx = ix; parts.forEach(function(p){ var pc = p[1] / tot * 100, txt = p[0] + ' ' + (pc >= 9.95 || pc === 0 ? Math.round(pc) : pc.toFixed(1)) + '%';
      x.fillStyle = p[2]; rr(x, lx, cy + 62, 16, 16, 5); x.fill(); x.fillStyle = '#fff'; x.font = '700 22px ' + TXT; x.fillText(txt, lx + 24, cy + 78); lx += x.measureText(txt).width + 52; });
    /* スキル・装備の効果 */
    cy += 132; x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '700 21px ' + TXT; x.fillText(t('スキル・装備の効果', 'SKILL AND GEAR EFFECTS'), ix, cy);
    var muls = [[t('集結主スキル', 'Leader skills'), n(el('leaderMod').textContent)], [t('参加者スキル', 'Joiner skills'), n(el('joinerMod').textContent)], [t('罠・専用装備', 'Trap & gear'), n(el('extraMod').textContent)]];
    var mx = Math.max(2, muls[0][1], muls[1][1], muls[2][1]);
    muls.forEach(function(m, i){ var yy = cy + 44 + i * 44, tx0 = ix + 168, tw = iw - 168 - 96, w = m[1] > 1 ? Math.log(m[1]) / Math.log(mx) * tw : 6;
      x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 20px ' + TXT; x.fillText(m[0], ix, yy);
      rr(x, tx0, yy - 15, tw, 14, 7); x.fillStyle = 'rgba(255,255,255,.12)'; x.fill(); rr(x, tx0, yy - 15, Math.max(8, Math.min(tw, w)), 14, 7); x.fillStyle = grad(x, tx0, 0, tx0 + tw, 0); x.fill();
      x.fillStyle = '#fff'; x.font = '800 24px ' + NUM; x.textAlign = 'right'; x.fillText('×' + m[1].toFixed(2), ix + iw, yy + 2); x.textAlign = 'left'; });
    /* 編成の顔ぶれ */
    var ly = 764, cx = L;
    try{
      var Ls = (u.leader || []).filter(Boolean), Js = (u.joiner || []).filter(Boolean);
      x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '700 20px ' + TXT; x.fillText(t('集結主', 'LEADER'), cx, ly - 60);
      Ls.forEach(function(s2){ avatar(x, s2.heroId, cx + 40, ly, 40, true); var nm = heroName(s2.heroId); x.fillStyle = '#fff'; x.font = '700 22px ' + TXT; x.fillText(nm, cx + 94, ly + 8); cx += 94 + x.measureText(nm).width + 34; });
      cx += 26; x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(cx - 30, ly - 40, 2, 80);
      x.fillStyle = 'rgba(255,255,255,.66)'; x.font = '700 20px ' + TXT; x.fillText(t('参加者', 'JOINERS'), cx, ly - 60);
      var room = CW - 72 - cx, each = Js.length ? Math.min(210, room / Js.length) : 0;
      Js.forEach(function(s2, i){ var ax = cx + i * each; avatar(x, s2.heroId, ax + 32, ly, 32, false); var nm = heroName(s2.heroId); x.fillStyle = 'rgba(255,255,255,.92)'; fit(x, nm, '600 %px ' + TXT, 20, each - 84); x.fillText(nm, ax + 76, ly + 7); });
    }catch(e){}
    /* フッター */
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(72, 826, CW - 144, 1.5);
    x.fillStyle = '#ff9a55'; x.font = '800 28px ' + NUM; x.fillText('whitesim-lab.com', 72, 870);
    x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '500 19px ' + TXT; x.textAlign = 'right';
    x.fillText(t('非公式ファンツールによる推定値です　#ホワサバ', 'Estimate by an unofficial fan tool   #WhiteoutSurvival'), CW - 72, 868); x.textAlign = 'left';
    return cv;
  }
  /* 投稿文（本体の共有ボタンから使う） */
  W.WOS_shareText = function(){
    var dmg = (typeof g === 'number' && g > 0) ? g : 0, gen = n(el('curGen') && el('curGen').value);
    var sc = D.querySelector('#usageBox .ug-score'), tp = D.querySelector('#usageBox .ug-top');
    var ja = '熊狩りの予測ダメージは ' + fmtS(dmg) + '（第' + gen + '世代）' + (sc ? '\n偏差値 ' + sc.textContent + (tp ? '・' + tp.textContent : '') : '') + '\n#ホワサバ #ホワイトアウトサバイバル';
    var en = 'My Bear Hunt estimate: ' + fmtS(dmg) + ' (Gen ' + gen + ')' + (sc ? '\nScore ' + sc.textContent + (tp ? ', ' + tp.textContent : '') : '') + '\n#WhiteoutSurvival #BearHunt';
    return t(ja, en);
  };
  function mount(){
    if(!el('totalDmg') || typeof W.buildResultCanvas !== 'function') return;
    W.buildResultCanvas = build;
    preload(); var src = el('totalDmg'); new MutationObserver(function(){ setTimeout(preload, 200); }).observe(src, { childList: true, characterData: true, subtree: true });
    ['leaderSlots', 'joinerSlots'].forEach(function(id){ var e = el(id); if(e) new MutationObserver(function(){ setTimeout(preload, 100); }).observe(e, { childList: true, subtree: true }); });
  }
  if(D.readyState !== 'loading') mount(); else D.addEventListener('DOMContentLoaded', mount);
})();
