/* ==== 熊狩シミュレーターの利用データを匿名で自動記録する（世代別統計の母集団） ====
   前提: config.js（WOS_API / t()）, シミュレーター本体のグローバル（u=編成, g=予測ダメージ, h()=英雄検索）
   - 送るもの: 世代・集結主3人・乗せ英雄4人・兵種Tier/火晶・攻撃%/殺傷%・兵数・予測ダメージ（補正係数C などの係数を全員同じ既定値にそろえて計算した値）
   - 実測キャリブレーション欄に実測ダメージが入っていれば一緒に送る（精度の検証用。サーバーは保存するだけで、どの画面にも出さない）
   - 送らないもの: 名前・同盟・ゲームID・Cookie・広告ID。ブラウザ内で作った乱数ID（wos_cid）だけを付ける
   - 計算できる状態（必須項目が入力済み）で、利用者が実際に操作したときだけ送る。同じ内容は二度送らない
   - 「統計に使わない」を選ぶと以後送らず、送信済みの分もサーバーから削除する
   - 現実的かどうかの判定はサーバー側（cloudflare/src/index.js の realism）。ここでは判定しない */
(function(){
  var W = window, D = document;
  var API = (W.WOS_API || '').replace(/\/$/, '');
  var t = W.t || function(a){ return a; };
  var EN = (W.WOS_LANG || 'ja') === 'en';
  var LS_CID = 'wos_cid', LS_OFF = 'wos_usage_off', LS_LAST = 'wos_usage_last';
  var DEBOUNCE_MS = 15000;
  /* 計算モデルの版数。統計用ダメージの計算方法を変えたら上げる（サーバーが古い版の値を新しい基準に直す）。2 = 兵数の効き方を見直した版 */
  var MODEL_VER = 2;
  var STAT_IDS = ['teamAtk','teamLeth','atkInf','lethInf','atkLan','lethLan','atkMks','lethMks'];
  /* 計算係数（補正係数C と詳細設定）。統計用のダメージは、これらを全員同じ既定値にそろえて計算し直す。
     人によって違ってよいのは「利用者が入力した自分の状態」（英雄・ステータス・兵数・ペット・バフ・罠・天賦）だけ */
  var COEF_IDS = ['kFactor','betaA','betaL','p0','tierGrowth','t12Bonus','fcGrowth','wI','wL','wM','pI','pL','crowdDecay','crowdRef','crowdTotal','crowdTotalRef','heroRate','spAtk','spLeth'];
  function ls(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  function el(id){ return D.getElementById(id); }
  function numOf(id){ var e = el(id); var v = e ? parseFloat(e.value) : NaN; return isFinite(v) ? v : null; }
  function cid(create){
    var c = ls(LS_CID);
    if(c && /^[a-f0-9]{32}$/.test(c)) return c;
    if(!create || !W.crypto || !crypto.getRandomValues) return null;
    var a = crypto.getRandomValues(new Uint8Array(16)); c = '';
    for(var i = 0; i < a.length; i++) c += (a[i] < 16 ? '0' : '') + a[i].toString(16);
    lsSet(LS_CID, c);
    return ls(LS_CID) === c ? c : null;      /* 保存できないブラウザ（プライベートモード等）では記録しない＝毎回別人として数えない */
  }
  W.WOS_USAGE = { cid: function(){ return isOff() ? null : cid(false); } };
  function isOff(){ return ls(LS_OFF) === '1'; }

  /* ---------- 送信内容 ---------- */
  /* 全員共通の条件（既定の係数）での予測ダメージ。画面に出ている数字（利用者が補正した値）とは別に計算する */
  function stdDamage(){
    try{
      if(typeof __cfg !== 'function' || !W.WOS_CALC || typeof l === 'undefined') return null;
      var cfg = __cfg();
      var DEF = W.WOS_CALC.DEFAULTS || {}; COEF_IDS.forEach(function(id){ if(DEF[id] != null) cfg[id] = DEF[id]; });
      var sc = W.WOS_CALC.createEngine(cfg, l, u.leader, u.joiner).score('ev').score;
      return isFinite(sc) && sc > 0 ? Math.ceil(sc) : null;
    }catch(e){ return null; }
  }
  W.WOS_USAGE.stdDamage = stdDamage;
  function build(){
    if(typeof g !== 'number' || !isFinite(g) || !(g > 0)) return null;      /* 必須項目が未入力＝計算されていない */
    if(typeof u === 'undefined' || typeof h !== 'function') return null;
    var gen = numOf('curGen'); if(!gen) return null;
    var leader = {};
    (u.leader || []).forEach(function(x){ if(!x) return; var hh = h(x.heroId); if(hh) leader[hh.cls] = { id: x.heroId, gear: x.gear || 0 }; });
    if(!leader.inf || !leader.lan || !leader.mks) return null;
    var stats = {};
    for(var i = 0; i < STAT_IDS.length; i++){ var v = numOf(STAT_IDS[i]); if(v == null) return null; stats[STAT_IDS[i]] = v; }
    var dmg = stdDamage(); if(!dmg) return null;
    var sub = null;
    try{ var sv = JSON.parse(ls('wos_stats_submission:' + gen) || 'null'); if(sv && sv.id) sub = sv.id; }catch(e){}
    return { gen: gen, leader: leader,
      joiners: (u.joiner || []).map(function(x){ return x ? x.heroId : null; }),
      tier: numOf('tier'), fc: numOf('fcLevel'), stats: stats,
      troops: [numOf('nInf') || 0, numOf('nLan') || 0, numOf('nMks') || 0],
      damage: dmg, calib: numOf('kFactor'), sub: sub || undefined,
      mv: MODEL_VER, observed: (function(){ var o = numOf('observed'); return o && o > 0 ? Math.round(o) : undefined; })() };
  }

  /* ---------- 送信 ---------- */
  var engaged = false, timer = null;
  function lastSent(){ try{ return JSON.parse(ls(LS_LAST) || '{}') || {}; }catch(e){ return {}; } }
  function pending(){
    if(!API || isOff() || !engaged) return null;
    var p = build(); if(!p) return null;
    var key = JSON.stringify(p), last = lastSent();
    if(last[p.gen] === key) return null;                                   /* 前回と同じ内容は送らない */
    var c = cid(true); if(!c) return null;
    p.cid = c;
    return { body: JSON.stringify(p), gen: p.gen, key: key };
  }
  function mark(x){ var last = lastSent(); last[x.gen] = x.key; lsSet(LS_LAST, JSON.stringify(last)); }
  function send(beacon){
    var x = pending(); if(!x) return;
    if(beacon){
      /* ページを離れるとき。text/plain なのでプリフライト無しで届く */
      try{ if(navigator.sendBeacon && navigator.sendBeacon(API + '/v1/usage', new Blob([x.body], { type: 'text/plain' }))) mark(x); }catch(e){}
      return;
    }
    fetch(API + '/v1/usage', { method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true, headers: { 'content-type': 'text/plain' }, body: x.body })
      .then(function(r){ if(r.ok || r.status === 400) mark(x); })           /* 400（形式エラー）は同じ内容を送り直しても通らない */
      .catch(function(){});
  }
  function touch(ev){
    if(ev && ev.isTrusted === false) return;
    engaged = true;
    clearTimeout(timer); timer = setTimeout(function(){ send(false); }, DEBOUNCE_MS);
  }
  if(API){
    D.addEventListener('input', touch, true); D.addEventListener('change', touch, true); D.addEventListener('click', touch, true);
    D.addEventListener('visibilitychange', function(){ if(D.visibilityState === 'hidden'){ clearTimeout(timer); send(true); } });
    W.addEventListener('pagehide', function(){ clearTimeout(timer); send(true); });
  }

  /* ---------- 表示: 偏差値と「統計に使わない」 ---------- */
  var box = null, devCache = {}, devGen = null;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  /* 標準正規分布の上側確率（偏差値 → 上位何%） */
  function upper(z){ var k = 1 / (1 + 0.2316419 * Math.abs(z)); var p = 0.3989423 * Math.exp(-z * z / 2) * k * (0.3193815 + k * (-0.3565638 + k * (1.781478 + k * (-1.821256 + k * 1.330274)))); return z >= 0 ? p : 1 - p; }
  function loadDev(gen, cb){
    if(!API){ cb(null); return; }
    if(devCache[gen]){ cb(devCache[gen]); return; }
    fetch(API + '/v1/stats/' + gen, { mode: 'cors', credentials: 'omit' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(s){ if(s){ devCache[gen] = s; } cb(s); }).catch(function(){ cb(null); });
  }
  function renderDev(){
    var out = box && box.querySelector('.ug-dev'); if(!out) return;
    var gen = numOf('curGen'), dmg = (typeof g === 'number' && isFinite(g) && g > 0) ? (stdDamage() || null) : null;
    if(!gen || !dmg || !API){ out.innerHTML = ''; return; }
    devGen = gen;
    loadDev(gen, function(s){
      if(devGen !== gen) return;
      var href = (W.WOS_BASE || '') + '/stats/gen-' + (gen < 10 ? '0' : '') + gen + '/index.html#live-dev';
      if(!s || !s.published || !s.dev){
        out.innerHTML = '<span class="ug-wait">' + t('第' + gen + '世代の偏差値はデータ集計中です', 'Gen ' + gen + ' score: still collecting data')
          + (s && typeof s.n === 'number' ? t('（現在 ' + s.n + ' 件・10件から公開）', ' (' + s.n + ' so far, opens at 10)') : '') + '</span>';
        return;
      }
      var z = (Math.log(dmg) / Math.LN10 - s.dev.mu) / s.dev.sd, score = 50 + 10 * z, top = upper(z) * 100;
      var topTxt = top < 1 ? t('上位1%以内', 'top 1%') : top > 99 ? t('下位1%以内', 'bottom 1%') : t('上位 約' + Math.round(top) + '%', 'top ~' + Math.round(top) + '%');
      out.innerHTML = '<span class="ug-lbl">' + t('第' + gen + '世代の中での偏差値', 'Score within Gen ' + gen) + '</span>'
        + '<b class="ug-score">' + score.toFixed(1) + '</b><span class="ug-top">' + esc(topTxt) + '</span>'
        + meter(s.dev, score)
        + '<a class="ug-more" href="' + href + '">' + t('n=' + s.dev.n + '・分布を見る →', 'n=' + s.dev.n + ' · see distribution →') + '</a>';
    });
  }
  /* 偏差値の位置を絵で見せる: その世代の分布（5刻み）の上に自分の位置を▼で示す */
  function meter(d, score){
    if(!d.hist || !d.hist.length) return '';
    var Wd = 280, Ht = 54, base = 36, max = 1, n = d.hist.length, pw = Wd / n, h = '';
    d.hist.forEach(function(b){ if(b.n > max) max = b.n; });
    d.hist.forEach(function(b, i){
      var bh = b.n ? Math.max(2, b.n / max * 24) : 0, mine = score >= b.lo && score < b.lo + 5;
      if(bh) h += '<rect class="ug-bar' + (mine ? ' me' : '') + '" x="' + (i * pw + 1).toFixed(1) + '" y="' + (base - bh).toFixed(1) + '" width="' + (pw - 2).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="2"/>';
    });
    var lo = d.hist[0].lo, hi = d.hist[n - 1].lo + 5, x = Math.max(4, Math.min(Wd - 4, (score - lo) / (hi - lo) * Wd));
    var ticks = ''; [30, 40, 50, 60, 70].forEach(function(v){ ticks += '<text class="ug-tk" x="' + ((v - lo) / (hi - lo) * Wd).toFixed(1) + '" y="' + (base + 12) + '" text-anchor="middle">' + v + '</text>'; });
    return '<svg class="ug-meter" viewBox="0 0 ' + Wd + ' ' + Ht + '" role="img" aria-label="' + t('世代内の分布と自分の位置', 'Distribution in your generation and your position') + '">' + h
      + '<line class="ug-ax" x1="0" x2="' + Wd + '" y1="' + base + '" y2="' + base + '"/>' + ticks
      + '<path class="ug-me" d="M' + (x - 5).toFixed(1) + ' 1h10l-5 7z"/><line class="ug-mel" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="8" y2="' + base + '"/></svg>';
  }
  function renderNote(){
    var out = box && box.querySelector('.ug-note'); if(!out) return;
    var pv = (W.WOS_BASE || '') + '/privacy.html#usage-stats';
    if(isOff()){
      out.innerHTML = t('この端末の入力は統計に使われません。', 'Your inputs on this device are not used for statistics.') + ' <a href="#" role="button" class="ug-btn" data-ug="on">' + t('統計に協力する', 'Contribute to the stats') + '</a>';
    }else{
      out.innerHTML = t('入力した構成とステータスは、匿名のまま世代別統計（偏差値・人気構成）の集計に使われます。名前・同盟・IDは送りません。',
                        'The build and stats you enter are used anonymously for the generation stats (scores and popular builds). No name, alliance or ID is sent.')
        + ' <a href="' + pv + '">' + t('くわしく', 'Details') + '</a> ／ <a href="#" role="button" class="ug-btn" data-ug="off">' + t('統計に使わない', 'Opt out') + '</a>';
    }
  }
  function setOff(off){
    if(off){
      var c = cid(false);
      lsSet(LS_OFF, '1'); lsSet(LS_LAST, null); clearTimeout(timer);
      if(c && API) fetch(API + '/v1/usage', { method: 'DELETE', mode: 'cors', credentials: 'omit', keepalive: true, headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ cid: c }) }).catch(function(){});
      lsSet(LS_CID, null);
    }else{ lsSet(LS_OFF, null); }
    renderNote();
    try{ if(W.WOS_TRACK) W.WOS_TRACK(off ? 'usage_optout' : 'usage_optin', { tool: 'bear_hunt' }); }catch(e){}
  }
  function mount(){
    var src = el('totalDmg'); if(!src || !API) return;
    var head = src.closest('.dmg-head') || src.parentNode;
    box = D.createElement('div'); box.id = 'usageBox';
    box.innerHTML = '<div class="ug-dev" aria-live="polite"></div><p class="ug-note"></p>';
    head.parentNode.insertBefore(box, head.nextSibling);
    var st = D.createElement('style');
    st.textContent = '#usageBox{margin:10px 0 4px}'
      + '#usageBox .ug-dev{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 10px;font-size:12.5px;color:var(--muted)}'
      + '#usageBox .ug-dev:empty{display:none}'
      + '#usageBox .ug-score{font-size:26px;font-weight:800;color:var(--frost);line-height:1;font-variant-numeric:tabular-nums}'
      + '#usageBox .ug-top{font-weight:700;color:var(--text,inherit)}'
      + '#usageBox .ug-meter{display:block;width:100%;max-width:300px;height:auto;margin:2px auto 0;flex-basis:100%;overflow:visible}'
      + '#usageBox .ug-bar{fill:#cfd4e1}#usageBox .ug-bar.me{fill:var(--frost-dim,#ff7a2f)}'
      + '#usageBox .ug-ax{stroke:#d9dce6;stroke-width:1}#usageBox .ug-tk{font-size:8.5px;fill:#6b7385}'
      + '#usageBox .ug-me{fill:#23283a}#usageBox .ug-mel{stroke:#23283a;stroke-width:1.5}'
      + '#usageBox .ug-more{color:var(--frost);text-decoration:none;font-weight:700}'
      + '#usageBox .ug-note{margin:8px 0 0;font-size:11px;line-height:1.6;color:var(--muted);text-align:center}'
      + '#usageBox .ug-note a{color:inherit}'
      + '#usageBox .ug-btn{color:inherit;text-decoration:underline;cursor:pointer}'
      + '#usageBox .ug-btn:focus-visible{outline:2px solid var(--frost);outline-offset:2px}';
    D.head.appendChild(st);
    box.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-ug]'); if(b){ e.preventDefault(); setOff(b.getAttribute('data-ug') === 'off'); } });
    renderNote(); renderDev();
    new MutationObserver(renderDev).observe(src, { childList: true, characterData: true, subtree: true });
    var cg = el('curGen'); if(cg) cg.addEventListener('change', function(){ setTimeout(renderDev, 0); });
  }
  if(D.readyState !== 'loading') mount(); else D.addEventListener('DOMContentLoaded', mount);
})();
