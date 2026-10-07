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
    if(!xs || xs[xs.length - 1] - xs[0] < 1){ box.innerHTML = ''; rb.classList.remove('has-viz'); W.__WOS_DIST = null; return; }
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
  var rcol, res, c1, c2, c3, sum, bar;

  function layout(){
    rcol = D.querySelector('.rcol'); res = rcol && rcol.querySelector('.result'); if(!rcol || !res) return false;
    D.body.classList.add('rp-on'); rcol.id = 'report';
    rcol.insertBefore(mk('div', 'rp-head', '<span class="rp-k">REPORT</span><h2>' + t('分析レポート', 'Analysis report') + '</h2><p>'
      + t('入力した編成から、予測ダメージ・運による振れ幅・内訳・次の一手までまとめて分析します。', 'From your setup: estimated damage, luck range, breakdown and the best next step.') + '</p>'), rcol.firstChild);
    var cols = mk('div', 'rp-cols'); c1 = mk('div'); c2 = mk('div'); c3 = mk('div'); cols.appendChild(c1); cols.appendChild(c2); cols.appendChild(c3);
    var head = res.querySelector('.dmg-head'); head.parentNode.insertBefore(cols, head.nextSibling);
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
    bar = mk('div', '', '<span class="l">' + t('予測ダメージ', 'EST. DAMAGE') + '</span><span class="v">—</span><span class="d"></span><a href="#report">' + t('レポートを見る ↓', 'See report ↓') + '</a>');
    bar.id = 'rpBar'; D.body.appendChild(bar);
    bar.querySelector('a').addEventListener('click', function(e){ e.preventDefault(); rcol.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
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
        items.push(['🎲', '', t('運による振れ幅は <b>' + lo + '% 〜 +' + hi + '%</b>。ふつうは <b>' + Math.round(dist.p50).toLocaleString('ja-JP') + '</b> 前後に落ち着きます。',
          'Luck swings the result by <b>' + lo + '% to +' + hi + '%</b>; a typical rally lands near <b>' + Math.round(dist.p50).toLocaleString('en-US') + '</b>.')]);
      }
      var top = parts.slice().sort(function(a, b){ return b[1] - a[1]; })[0];
      if(tot > 0){
        var zero = [];
        if(!(n(el('nInf').value) > 0)) zero.push(t('盾兵', 'infantry')); if(!(n(el('nLan').value) > 0)) zero.push(t('槍兵', 'lancers'));
        if(zero.length) items.push(['⚠️', 'warn', t('<b>' + zero.join('・') + 'が0人</b>です。少しでも入れると目減りを避けられます。', '<b>No ' + zero.join(' or ') + '</b> in the march — adding even a few avoids a loss.')]);
        else items.push(['🏹', '', t('ダメージの <b>' + pct(top[1]) + '%</b> は' + top[2] + 'が出しています。' + top[2] + 'の攻撃・殺傷を伸ばすのが近道です。', '<b>' + pct(top[1]) + '%</b> of the damage comes from ' + top[2].toLowerCase() + ' — raising their attack and lethality pays off most.')]);
      }
      var adv = D.querySelector('#adviceList li');
      if(adv && el('adviceBox').style.display !== 'none'){
        var sp = adv.querySelectorAll('span');
        items.push(['📈', 'good', t('いちばん伸びる一手：<b>' + esc(sp[0].textContent) + '</b>（' + esc(sp[1] ? sp[1].textContent : '') + '）', 'Best next step: <b>' + esc(sp[0].textContent) + '</b> (' + esc(sp[1] ? sp[1].textContent : '') + ')') + ' <a href="#adviceBox">' + t('ほかの候補 →', 'more →') + '</a>']);
      }
      var ov = el('overlapBox');
      if(ov && ov.style.display !== 'none'){
        var k = ov.querySelectorAll('#overlapList li').length;
        items.push(['🧩', 'warn', t('スキルの<b>枠かぶりが ' + k + ' 件</b>あります。種類をばらすと掛け算で伸びます。', '<b>' + k + ' overlapping skill slot(s)</b> — spreading skill types multiplies better.') + ' <a href="#overlapBox">' + t('内容を見る →', 'details →') + '</a>']);
      } else if(ov){
        items.push(['✅', 'good', t('スキルの枠かぶりはありません。種類がうまく分かれています。', 'No overlapping skill slots — your skill types are well spread.')]);
      }
      var sc = D.querySelector('#usageBox .ug-score');
      if(sc){ var tp = D.querySelector('#usageBox .ug-top'); items.push(['📊', '', t('同じ世代の利用者の中で<b>偏差値 ' + esc(sc.textContent) + '</b>（' + esc(tp ? tp.textContent : '') + '）です。', 'Your score among players of the same generation is <b>' + esc(sc.textContent) + '</b> (' + esc(tp ? tp.textContent : '') + ').')]); }
      var kf = el('kFactor');
      if(kf && Math.abs(n(kf.value) - n(kf.defaultValue)) < 1e-9) items.push(['🎯', '', t('実際のダメージを1回入れると、あなたの環境に合わせて補正できます。', 'Enter one real result to calibrate the estimate to your account.') + ' <a href="#observed">' + t('実測を入れる →', 'calibrate →') + '</a>']);
    }
    sum.innerHTML = '<h3>' + t('📝 総評', '📝 Summary') + '</h3>' + (items.length
      ? '<ul>' + items.map(function(it){ return '<li class="' + it[1] + '"><span class="ic">' + it[0] + '</span><span>' + it[2] + '</span></li>'; }).join('') + '</ul>'
      : '<p class="note" style="margin:0">' + t('STEP2 の必須項目を入力すると、ここに分析結果が表示されます。', 'Fill in the required fields in STEP 2 to see the analysis here.') + '</p>');
    sum.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener('click', function(e){ var tg = el(a.getAttribute('href').slice(1)); if(!tg) return; e.preventDefault(); var dt = tg.closest('details'); if(dt) dt.open = true; tg.scrollIntoView({ behavior: 'smooth', block: 'center' }); if(tg.focus) try{ tg.focus({ preventScroll: true }); }catch(_){} }); });
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
      new IntersectionObserver(function(es){ es.forEach(function(e){ barState.seen = e.isIntersecting; showBar(); }); }, { threshold: 0 }).observe(res.querySelector('.dmg-head'));
    }
    setTimeout(render, 0); setTimeout(render, 900);
  }
  if(D.readyState !== 'loading') mount(); else D.addEventListener('DOMContentLoaded', mount);
})();
