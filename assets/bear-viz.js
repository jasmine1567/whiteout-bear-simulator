/* ==== 熊狩シミュレーター: 結果のグラフ表示 ====
   1ラリーのダメージが「どのあたりに出やすいか」の分布図（確率スキルの発動回数を乱数で振って 4000 回ぶん計算）。
   前提: シミュレーター本体のグローバル（__eng()=計算エンジン, g=予測ダメージ）, bear-calc.js（score({roll})）
   モデル: 1ラリー＝10回の攻撃。確率スキルは攻撃ごとに独立に発動すると仮定し、10回中の発動割合を roll として渡す。
           全部不発＝下限、全部発動＝上限（従来の表示）と一致する。期待値の計算式には手を入れていない */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  var N_SAMPLES = 4000, BINS = 26, VW = 320, VH = 118, PAD_L = 4, PAD_R = 4, TOP = 16, BASE = 96;
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
    if(!xs || xs[xs.length - 1] - xs[0] < 1){ box.innerHTML = ''; rb.classList.remove('has-viz'); return; }
    rb.classList.add('has-viz');
    var p5 = q(xs, 0.05), p50 = q(xs, 0.5), p95 = q(xs, 0.95), lo = xs[0], hi = xs[xs.length - 1];
    var span = hi - lo, x0 = lo - span * 0.02, x1 = hi + span * 0.02, bw = (x1 - x0) / BINS;
    var cnt = []; for(var i = 0; i < BINS; i++) cnt.push(0);
    xs.forEach(function(v){ cnt[Math.min(BINS - 1, Math.floor((v - x0) / bw))]++; });
    var max = Math.max.apply(null, cnt), pw = (VW - PAD_L - PAD_R) / BINS;
    function X(v){ return PAD_L + (v - x0) / (x1 - x0) * (VW - PAD_L - PAD_R); }
    var bars = '';
    cnt.forEach(function(c, i){
      var a = x0 + i * bw, b = a + bw, mid = (a + b) / 2, h = c ? Math.max(2, c / max * (BASE - TOP)) : 0;
      var inBand = mid >= p5 && mid <= p95;
      if(c) bars += '<rect class="dv-b' + (inBand ? '' : ' out') + '" x="' + (PAD_L + i * pw + 1).toFixed(1) + '" y="' + (BASE - h).toFixed(1) + '" width="' + (pw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"/>';
      bars += '<rect class="dv-hit" data-a="' + Math.round(a) + '" data-b="' + Math.round(b) + '" data-p="' + (c / xs.length * 100).toFixed(1) + '" x="' + (PAD_L + i * pw).toFixed(1) + '" y="' + TOP + '" width="' + pw.toFixed(1) + '" height="' + (BASE - TOP) + '"/>';
    });
    var ev = Math.min(x1, Math.max(x0, g)), xe = X(ev), anchor = xe < 60 ? 'start' : xe > VW - 60 ? 'end' : 'middle';
    var svg = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' + esc(t('1ラリーのダメージの出やすさの分布', 'Distribution of damage per rally')) + '">'
      + '<rect class="dv-band" x="' + X(p5).toFixed(1) + '" y="' + TOP + '" width="' + Math.max(1, X(p95) - X(p5)).toFixed(1) + '" height="' + (BASE - TOP) + '" rx="3"/>'
      + bars
      + '<line class="dv-axis" x1="' + PAD_L + '" x2="' + (VW - PAD_R) + '" y1="' + BASE + '" y2="' + BASE + '"/>'
      + '<line class="dv-ev" x1="' + xe.toFixed(1) + '" x2="' + xe.toFixed(1) + '" y1="' + (TOP - 3) + '" y2="' + BASE + '"/>'
      + '<text class="dv-evt" x="' + xe.toFixed(1) + '" y="9" text-anchor="' + anchor + '">' + esc(t('期待値 ', 'Expected ')) + fmtS(g) + '</text>'
      + '<text class="dv-tick" x="' + PAD_L + '" y="' + (BASE + 14) + '">' + fmtS(lo) + '</text>'
      + '<text class="dv-tick" x="' + (VW - PAD_R) + '" y="' + (BASE + 14) + '" text-anchor="end">' + fmtS(hi) + '</text>'
      + '<text class="dv-tick mid" x="' + ((X(p5) + X(p95)) / 2).toFixed(1) + '" y="' + (BASE + 14) + '" text-anchor="middle">' + esc(t('← 90%はこの範囲 →', '← 90% land here →')) + '</text>'
      + '</svg>';
    var above = 0; xs.forEach(function(v){ if(v >= g) above++; });
    box.innerHTML = '<div class="dv-chart">' + svg + '<div class="dv-tip" hidden></div></div>'
      + '<div class="dv-tiles">'
      + '<div class="dv-tile"><span>' + t('下振れ<br>20回に1回', 'Unlucky<br>1 in 20') + '</span><b>' + fmt(p5) + '</b></div>'
      + '<div class="dv-tile main"><span>' + t('ふつう<br>中央値', 'Typical<br>median') + '</span><b>' + fmt(p50) + '</b></div>'
      + '<div class="dv-tile"><span>' + t('上振れ<br>20回に1回', 'Lucky<br>1 in 20') + '</span><b>' + fmt(p95) + '</b></div>'
      + '</div>'
      + '<p class="dv-foot">' + t('期待値以上が出る確率は 約' + Math.round(above / xs.length * 100) + '%。', 'Chance of reaching the expected value or more: ~' + Math.round(above / xs.length * 100) + '%. ')
      + t('確率スキルが10回の攻撃で何回発動するかを4,000回ぶん試した結果です。理論上の範囲は ', 'Based on 4,000 simulated rallies (10 attacks each). Theoretical range: ')
      + esc((el('dmgMin').textContent || '').replace(/^\D+/, '')) + ' 〜 ' + esc((el('dmgMax').textContent || '').replace(/^\D+/, '')) + t('（全部不発〜全部発動）。', ' (none trigger – all trigger).') + '</p>';
    var tip = box.querySelector('.dv-tip'), chart = box.querySelector('.dv-chart');
    function show(r){
      box.querySelectorAll('.dv-hit.on').forEach(function(x){ x.classList.remove('on'); });
      if(!r){ tip.hidden = true; return; }
      r.classList.add('on');
      tip.innerHTML = '<b>' + r.getAttribute('data-p') + '%</b> ' + fmtS(+r.getAttribute('data-a')) + ' 〜 ' + fmtS(+r.getAttribute('data-b'));
      tip.hidden = false;
      var cr = chart.getBoundingClientRect(), rr = r.getBoundingClientRect();
      var x = rr.left - cr.left + rr.width / 2, half = tip.offsetWidth / 2;
      tip.style.left = Math.max(half, Math.min(cr.width - half, x)) + 'px';
    }
    chart.addEventListener('pointermove', function(e){ var r = e.target.closest && e.target.closest('.dv-hit'); show(r); });
    chart.addEventListener('pointerdown', function(e){ var r = e.target.closest && e.target.closest('.dv-hit'); show(r); });
    chart.addEventListener('pointerleave', function(){ show(null); });
  }

  function mount(){
    var rb = el('rangeBox'), src = el('totalDmg'); if(!rb || !src) return;
    var title = rb.querySelector('.rb-title'); if(title) title.textContent = t('🎲 1ラリーのダメージの出やすさ（確率スキルのぶれ）', '🎲 How damage per rally is distributed (chance skills)');
    box = D.createElement('div'); box.id = 'distViz'; rb.appendChild(box);
    var st = D.createElement('style');
    st.textContent = '#rangeBox.has-viz .range-vals,#rangeBox.has-viz .range-track{display:none}'
      + '#distViz .dv-chart{position:relative;margin-top:4px}'
      + '#distViz svg{display:block;width:100%;height:auto;overflow:visible}'
      + '#distViz .dv-band{fill:var(--frost);opacity:.08}'
      + '#distViz .dv-b{fill:var(--frost-dim,#ff7a2f)}#distViz .dv-b.out{opacity:.38}'
      + '#distViz .dv-hit{fill:transparent;cursor:crosshair}#distViz .dv-hit.on{fill:rgba(35,40,58,.07)}'
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
