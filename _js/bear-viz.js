/* ==== 熊狩シミュレーター: 結果のグラフ表示 ====
   集結1回のダメージが「どのあたりに出やすいか」の分布図（確率スキルの発動回数を乱数で振って 4000 回ぶん計算）。
   前提: シミュレーター本体のグローバル（__eng()=計算エンジン, g=予測ダメージ）, bear-calc.js（score({roll})）
   モデル: 集結1回＝10回の攻撃。確率スキルは攻撃ごとに独立に発動すると仮定し、10回中の発動割合を roll として渡す。
           全部不発＝下限、全部発動＝上限（従来の表示）と一致する。期待値の計算式には手を入れていない */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  var N_SAMPLES = 6000, VW = 320, VH = 118, PAD_L = 4, PAD_R = 4, TOP = 16, BASE = 96;
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
    function area(a, b){
      var d = '', first = true, lastX = 0;
      for(var i = 0; i < FINE; i++){ var mid = x0 + (i + 0.5) * fw; if(mid < a || mid > b) continue; var px = X(mid), py = Y(dens[i]); d += (first ? 'M' + px.toFixed(1) + ' ' + BASE + 'L' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1); first = false; lastX = px; }
      return first ? '' : d + 'L' + lastX.toFixed(1) + ' ' + BASE + 'Z';
    }
    var line = dens.map(function(d, i){ return (i ? 'L' : 'M') + X(x0 + (i + 0.5) * fw).toFixed(1) + ' ' + Y(d).toFixed(1); }).join('');
    var bars = '<path class="dv-a out" d="' + area(x0, x1) + '"/><path class="dv-a" d="' + area(p5, p95) + '"/><path class="dv-l" d="' + line + '"/>'
      + '<line class="dv-cur" x1="0" x2="0" y1="' + TOP + '" y2="' + BASE + '" style="display:none"/><rect class="dv-hit" x="' + PAD_L + '" y="' + TOP + '" width="' + (VW - PAD_L - PAD_R) + '" height="' + (BASE - TOP) + '"/>';
    var ev = Math.min(x1, Math.max(x0, g)), xe = X(ev), anchor = xe < 60 ? 'start' : xe > VW - 60 ? 'end' : 'middle';
    var svg = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' + esc(t('集結1回のダメージの出やすさの分布', 'Distribution of damage per rally')) + '">'
      + '<rect class="dv-band" x="' + X(p5).toFixed(1) + '" y="' + TOP + '" width="' + Math.max(1, X(p95) - X(p5)).toFixed(1) + '" height="' + (BASE - TOP) + '" rx="3"/>'
      + bars
      + '<line class="dv-axis" x1="' + PAD_L + '" x2="' + (VW - PAD_R) + '" y1="' + BASE + '" y2="' + BASE + '"/>'
      + '<line class="dv-ev" x1="' + xe.toFixed(1) + '" x2="' + xe.toFixed(1) + '" y1="' + (TOP - 3) + '" y2="' + BASE + '"/>'
      + '<text class="dv-evt" x="' + xe.toFixed(1) + '" y="9" text-anchor="' + anchor + '">' + esc(t('期待値 ', 'Expected ')) + fmtS(g) + '</text>'
      + '<text class="dv-tick" x="' + PAD_L + '" y="' + (BASE + 14) + '">' + fmtS(lo) + '</text>'
      + '<text class="dv-tick" x="' + (VW - PAD_R) + '" y="' + (BASE + 14) + '" text-anchor="end">' + fmtS(hi) + '</text>'
      + '<text class="dv-tick mid" x="' + ((X(p5) + X(p95)) / 2).toFixed(1) + '" y="' + (BASE + 14) + '" text-anchor="middle">' + esc(t('← 90%はこの範囲 →', '← 90% land here →')) + '</text>'
      + '</svg>';
    W.__WOS_DIST = { g: g, p5: p5, p50: p50, p95: p95 };
    var above = 0; xs.forEach(function(v){ if(v >= g) above++; });
    box.innerHTML = '<div class="dv-chart">' + svg + '<div class="dv-tip" hidden></div></div>'
      + '<div class="dv-tiles">'
      + '<div class="dv-tile"><span>' + t('下振れ<br>20回に1回', 'Unlucky<br>1 in 20') + '</span><b>' + fmt(p5) + '</b></div>'
      + '<div class="dv-tile main"><span>' + t('ふつう<br>中央値', 'Typical<br>median') + '</span><b>' + fmt(p50) + '</b></div>'
      + '<div class="dv-tile"><span>' + t('上振れ<br>20回に1回', 'Lucky<br>1 in 20') + '</span><b>' + fmt(p95) + '</b></div>'
      + '</div>'
      + '<p class="dv-foot">' + t('期待値以上が出る確率は 約' + Math.round(above / xs.length * 100) + '%。', 'Chance of reaching the expected value or more: ~' + Math.round(above / xs.length * 100) + '%. ')
      + t('確率で発動するスキルの当たり外れを、何千回ぶんも試した結果です。理論上の範囲は ', 'Based on thousands of simulated rallies with chance-based skills. Theoretical range: ')
      + esc((el('dmgMin').textContent || '').replace(/^\D+/, '')) + ' 〜 ' + esc((el('dmgMax').textContent || '').replace(/^\D+/, '')) + t('（全部不発〜全部発動）。', ' (none trigger – all trigger).') + '</p>';
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
      var half = tip.offsetWidth / 2; tip.style.left = Math.max(half, Math.min(r.width - half, fx * r.width)) + 'px';
    }
    chart.addEventListener('pointermove', show);
    chart.addEventListener('pointerdown', show);
    chart.addEventListener('pointerleave', function(){ show(null); });
  }

  function mount(){
    var rb = el('rangeBox'), src = el('totalDmg'); if(!rb || !src) return;
    var title = rb.querySelector('.rb-title'); if(title) title.textContent = t('🎲 集結1回のダメージの出やすさ（確率スキルのぶれ）', '🎲 How damage per rally is distributed (chance skills)');
    box = D.createElement('div'); box.id = 'distViz'; rb.appendChild(box);
    var st = D.createElement('style');
    st.textContent = '#rangeBox.has-viz .range-vals,#rangeBox.has-viz .range-track{display:none}'
      + '#distViz .dv-chart{position:relative;margin-top:4px}'
      + '#distViz svg{display:block;width:100%;height:auto;overflow:visible}'
      + '#distViz .dv-band{fill:var(--frost);opacity:.08}'
      + '#distViz .dv-a{fill:var(--frost-dim,#ff7a2f);opacity:.85}#distViz .dv-a.out{opacity:.28}'
      + '#distViz .dv-l{fill:none;stroke:var(--frost,#e85d12);stroke-width:1.6;stroke-linejoin:round}'
      + '#distViz .dv-hit{fill:transparent;cursor:crosshair}#distViz .dv-cur{stroke:#23283a;stroke-width:1;opacity:.55}'
      + '#distViz .dv-axis{stroke:#d9dce6;stroke-width:1}'
      + '#distViz .dv-ev{stroke:#23283a;stroke-width:1.5;stroke-dasharray:3 2}'
      + '#distViz .dv-evt{font-size:9.5px;font-weight:800;fill:#23283a}'
      + '#distViz .dv-tick{font-size:8.5px;fill:#6b7385;font-variant-numeric:tabular-nums}#distViz .dv-tick.mid{font-weight:700}'
      + '#distViz .dv-tip{position:absolute;top:-4px;transform:translateX(-50%);background:#23283a;color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;font-variant-numeric:tabular-nums}'
      + '#distViz .dv-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}'
      + '#distViz .dv-tile{background:#f6f7fb;border-radius:9px;padding:7px 3px;text-align:center;min-width:0}'
      + '#distViz .dv-tile span{display:block;font-size:10px;color:#6b7385;line-height:1.3}'
      + '#distViz .dv-tile b{display:block;font-size:clamp(10.5px,3.1vw,12.5px);color:#23283a;font-variant-numeric:tabular-nums;margin-top:2px;white-space:nowrap;letter-spacing:-.02em}'
      + '#distViz .dv-tile.main{background:#fff3ea}#distViz .dv-tile.main b{font-weight:800}'
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
    sum.innerHTML = '<h3>' + ic('edit_note') + t('総評', 'Summary') + '</h3>' + (items.length
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
