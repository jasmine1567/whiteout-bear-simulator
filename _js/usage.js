/* ==== 熊狩シミュレーターの利用データを匿名で自動記録する（世代別統計の母集団） ====
   前提: config.js（WOS_API / t()）, シミュレーター本体のグローバル（u=編成, g=予測ダメージ, h()=英雄検索）
   - 送るもの: 世代・集結主3人・乗せ英雄4人・兵種Tier/火晶・攻撃%/殺傷%・兵数・予測ダメージ（補正係数C などの係数を全員同じ既定値にそろえて計算した値）
   - 実測キャリブレーション欄に実測ダメージが入っていれば一緒に送る（精度の検証用。サーバーは保存するだけで、どの画面にも出さない）
   - 「自分で選んだか」の印も送る（v150）: gc=世代を自分で選んだ ／ lt=集結主の英雄を選び直した ／ jt=乗せ英雄を選び直した。
     初期値のまま計算しただけのデータを、世代別の統計や英雄利用度ランキングから分けて扱うため
   - 送らないもの: 名前・同盟・ゲームID・Cookie・広告ID。ブラウザ内で作った乱数ID（wos_cid）だけを付ける
   - 計算できる状態（必須項目が入力済み）で、利用者が実際に操作したときだけ送る。同じ内容は二度送らない
   - 「統計に使わない」を選ぶと以後送らず、送信済みの分もサーバーから削除する
   - 現実的かどうかの判定はサーバー側（cloudflare/src/index.js の realism）。ここでは判定しない
   - 偏差値まわりの表示は bear-pos.js（WOS_POS）に任せる。bear-pos.js が無いときは、ここの簡易表示に戻る */
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
    var gen = numOf('curGen'); if(!gen || !genChosen()) return null;        /* 世代を自分で選ぶまでは送らない（下の「世代の選択」） */
    var leader = {};
    (u.leader || []).forEach(function(x){ if(!x) return; var hh = h(x.heroId); if(hh) leader[hh.cls] = { id: x.heroId, gear: x.gear || 0 }; });
    if(!leader.inf || !leader.lan || !leader.mks) return null;
    var stats = {};
    for(var i = 0; i < STAT_IDS.length; i++){ var v = numOf(STAT_IDS[i]); if(v == null) return null; stats[STAT_IDS[i]] = v; }
    var dmg = stdDamage(); if(!dmg) return null;
    var sub = null;
    try{ var sv = JSON.parse(ls('wos_stats_submission:' + gen) || 'null'); if(sv && sv.id) sub = sv.id; }catch(e){}
    var tf = touchFlags(gen);
    return { gen: gen, gc: 1, lt: tf.lt, jt: tf.jt, leader: leader,
      joiners: (u.joiner || []).map(function(x){ return x ? x.heroId : null; }),
      tier: numOf('tier'), fc: numOf('fcLevel'), stats: stats,
      troops: [numOf('nInf') || 0, numOf('nLan') || 0, numOf('nMks') || 0],
      damage: dmg, calib: numOf('kFactor'), sub: sub || undefined,
      mv: MODEL_VER, observed: (function(){ var o = numOf('observed'); return o && o > 0 ? Math.round(o) : undefined; })() };
  }

  /* ---------- 英雄を自分で選び直したか（v150） ----------
     画面を開いた直後は、誰でも同じ初期編成（集結主 ジェロニモ・ミア・アロンソ ／ 乗せ ジェシー・ジャセル・ソユン・ウェイン）が入っている。
     そのまま計算した人まで「この英雄を使っている人」に数えると、初期編成の英雄だけ利用率が高く出てしまう。
     そこで「選び直した」と分かるときだけ印を付けて送る（サーバーは印のある人だけで英雄の利用度を出せる）:
       - 英雄の選択画面で選んだ ／ 保存した編成を呼び出した
       - 初期編成と違う編成になっている（世代別ページの「この構成で試算する」で入っただけの集結主は、選び直しには数えない）
     画面を開き直すと初期編成に戻るので、印は保存せず、その回の操作だけで判定する */
  var DEF_LEAD = { inf: 'jeronimo', lan: 'mia', mks: 'alonso' }, DEF_JOIN = ['jessie', 'jasser', 'seoyoon', 'wayne'];
  var picked = { l: false, j: false }, prefilled = false;
  try{ prefilled = /[?&](inf|lan|mks)=/.test(location.search); }catch(e){}
  function pickerKind(){ try{ return (typeof v !== 'undefined' && v && v.kind) || null; }catch(e){ return null; } }   /* v = 本体の「いま選択中の枠」 */
  D.addEventListener('click', function(ev){
    if(ev.isTrusted === false || !ev.target || !ev.target.closest) return;
    if(ev.target.closest('#pickerBody .pitem')){ var kd = pickerKind(); if(kd === 'leader') picked.l = true; else if(kd === 'joiner') picked.j = true; }
    else if(ev.target.closest('#presetList .pload')){ picked.l = picked.j = true; }
  }, true);
  function touchFlags(gen){
    var cur = {};
    (u.leader || []).forEach(function(x){ if(!x) return; var hh = h(x.heroId); if(hh) cur[hh.cls] = x.heroId; });
    var leadDiff = cur.inf !== DEF_LEAD.inf || cur.lan !== DEF_LEAD.lan || cur.mks !== DEF_LEAD.mks;
    /* 乗せの初期編成は、その世代でまだ使えない英雄が外れた形で比べる（世代を選ぶと自動で外れるため） */
    var jc = (u.joiner || []).filter(Boolean).map(function(x){ return x.heroId; }).sort().join(',');
    var jd = DEF_JOIN.filter(function(id){ var hh = h(id); return hh && hh.gen <= gen; }).sort().join(',');
    return { lt: (picked.l || (leadDiff && !prefilled)) ? 1 : 0, jt: (picked.j || jc !== jd) ? 1 : 0 };
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
  var box = null, devCache = {}, devWait = {}, devGen = null;
  function put(e, html){ if(e.__h !== html){ e.__h = html; e.innerHTML = html; } }      /* 同じ内容なら書き直さない */
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  /* 標準正規分布の上側確率（偏差値 → 上位何%） */
  function upper(z){ var k = 1 / (1 + 0.2316419 * Math.abs(z)); var p = 0.3989423 * Math.exp(-z * z / 2) * k * (0.3193815 + k * (-0.3565638 + k * (1.781478 + k * (-1.821256 + k * 1.330274)))); return z >= 0 ? p : 1 - p; }
  /* その世代の集計を読む。読み込み中に何度呼ばれても通信は1回だけ */
  function loadDev(gen, cb){
    if(!API){ cb(null); return; }
    if(devCache[gen]){ cb(devCache[gen]); return; }
    if(devWait[gen]){ devWait[gen].push(cb); return; }
    devWait[gen] = [cb];
    fetch(API + '/v1/stats/' + gen, { mode: 'cors', credentials: 'omit' }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
      .then(function(s){
        if(s) devCache[gen] = s;
        var q = devWait[gen] || []; devWait[gen] = null;
        q.forEach(function(f){ try{ f(s); }catch(e){} });
      });
  }
  function renderDev(){
    var out = box && box.querySelector('.ug-dev'); if(!out) return;
    var POS = W.WOS_POS || null, hide = function(){ try{ if(POS && POS.update) POS.update(null); }catch(e){} };
    var gen = numOf('curGen'), dmg = (typeof g === 'number' && isFinite(g) && g > 0) ? (stdDamage() || null) : null;
    if(dmg && API && (!gen || !genChosen())){
      put(out, '<a class="ug-wait ug-pick" href="#curGen">' + t('サーバーの世代を選ぶと、同じ世代の中での偏差値が出ます', 'Pick your server generation to see your score within it') + '</a>');
      hide(); return;
    }
    if(!gen || !dmg || !API){ put(out, ''); hide(); return; }
    devGen = gen;
    loadDev(gen, function(s){
      if(devGen !== gen) return;
      var href = (W.WOS_BASE || '') + '/stats/gen-' + (gen < 10 ? '0' : '') + gen + '/#live-dev';
      if(!s || !s.published || !s.dev){
        put(out, '<span class="ug-wait">' + t('第' + gen + '世代の偏差値はデータ集計中です', 'Gen ' + gen + ' score: still collecting data')
          + (s && typeof s.n === 'number' ? t('（現在 ' + s.n + ' 件・10件から公開）', ' (' + s.n + ' so far, opens at 10)') : '') + '</span>');
        hide(); return;
      }
      /* くわしい表示（ランク・分布・次の目標など）は bear-pos.js に任せる。読み込めていないときは下の簡易表示 */
      if(POS && POS.compact && POS.update){
        try{
          var ctx = { gen: gen, dmg: dmg, shown: g, s: s, href: href };
          put(out, POS.compact(ctx)); POS.update(ctx);
          return;
        }catch(e){ hide(); }
      }
      var z = (Math.log(dmg) / Math.LN10 - s.dev.mu) / s.dev.sd, score = 50 + 10 * z, top = upper(z) * 100;
      var topTxt = top < 1 ? t('上位1%以内', 'top 1%') : top > 99 ? t('下位1%以内', 'bottom 1%') : t('上位 約' + Math.round(top) + '%', 'top ~' + Math.round(top) + '%');
      put(out, '<span class="ug-lbl">' + t('第' + gen + '世代の中での偏差値', 'Score within Gen ' + gen) + '</span>'
        + '<b class="ug-score">' + score.toFixed(1) + '</b><span class="ug-top">' + esc(topTxt) + '</span>'
        + meter(s.dev, score)
        + '<a class="ug-more" href="' + href + '">' + t('n=' + s.dev.n + '・分布を見る →', 'n=' + s.dev.n + ' · see distribution →') + '</a>');
    });
  }
  /* bear-pos.js から呼ぶ: 表示の更新（編成や装備だけを変えたときにも採用率などを出し直すため） */
  W.WOS_USAGE.refresh = function(){ if(box) renderDev(); };
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

  /* ---------- 世代の選択（v148） ----------
     以前は「現在の世代」が最初から最新世代になっていたため、選び直さずに計算した人のデータが最新世代として記録されていた。
     いまは先頭に「— 世代を選択 —」を置き、自分で選ぶまでは未選択のままにする（計算は動く。統計には送らない）。
     「自分で選んだ」とみなすのは: 選択欄を操作した ／ 世代ページのリンク（?gen=…&inf=…）でその世代が入った ／ 選ばれている値が最新世代より小さい */
  var LS_GEN = 'bh_gen_chosen';
  function maxGen(){
    var sel = el('curGen'), mx = 0;
    if(sel) [].forEach.call(sel.options, function(o){ var v = parseInt(o.value, 10); if(v > mx) mx = v; });
    return mx;
  }
  function genChosen(){
    var gen = numOf('curGen');
    return !!gen && (ls(LS_GEN) === '1' || gen < maxGen());
  }
  function genNeedUI(){
    var sel = el('curGen'); if(!sel) return;
    var ok = genChosen(), note = D.getElementById('genNeed');
    sel.classList.toggle('gen-need', !ok);
    if(!note){ note = D.createElement('div'); note.id = 'genNeed'; note.className = 'gen-need-t'; sel.parentNode.appendChild(note); }
    note.textContent = ok ? '' : t('サーバーの世代を選んでください（世代別の統計・偏差値に使います）', 'Choose your server generation (used for per-generation stats and scores)');
    note.style.display = ok ? 'none' : '';
  }
  function genInit(){
    var sel = el('curGen'); if(!sel || sel.querySelector('option[value=""]')) return;
    var opt = D.createElement('option'); opt.value = ''; opt.textContent = t('— 世代を選択 —', '— Select generation —');
    sel.insertBefore(opt, sel.firstChild);
    /* 世代ページのリンク（?gen=10&inf=…）から来て、本体がその世代を選択欄に入れたときだけ「選んだ」とみなす。
       ?gen= だけが付いたURL（選択欄には反映されない）で、最新世代のまま「選んだ」ことにならないようにする（v150） */
    try{ var mg = /[?&]gen=(\d+)/.exec(location.search); if(mg && String(numOf('curGen')) === mg[1]) lsSet(LS_GEN, '1'); }catch(e){}
    if(!genChosen()) sel.value = '';
    sel.addEventListener('change', function(){ if(numOf('curGen')) lsSet(LS_GEN, '1'); genNeedUI(); });
    var st = D.createElement('style');
    st.textContent = '#curGen.gen-need{border-color:#e85d12 !important;box-shadow:0 0 0 3px rgba(232,93,18,.16)}'
      + '.gen-need-t{margin-top:5px;font-size:11.5px;font-weight:700;color:#c2500f;line-height:1.5}';
    D.head.appendChild(st);
    genNeedUI(); setInterval(genNeedUI, 1500);
    genHelp(sel);
  }
  /* 「世代がわからない方はこちら」: いちばん新しい英雄から世代を調べる一覧（v149） */
  function genHelp(sel){
    var link = D.createElement('a'); link.href = '#'; link.id = 'genHelp'; link.setAttribute('role', 'button');
    link.textContent = t('世代がわからない方はこちら', 'Not sure which generation?');
    sel.parentNode.appendChild(link);
    var row = sel.closest('.row') || sel.parentNode, panel = null;
    var st = D.createElement('style');
    st.textContent = '#genHelp{display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:#5b6276;text-decoration:underline;text-underline-offset:3px}'
      + '#genFind{margin:4px 0 14px;padding:14px 16px;border:1px solid #e3e5ed;border-radius:12px;background:#fff}'
      + '#genFind h4{margin:0 0 4px;font-size:14px;color:#23283a}#genFind p{margin:0 0 10px;font-size:12.5px;color:#5b6276;line-height:1.7}'
      + '#genFind .gf-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px;max-height:420px;overflow:auto;overscroll-behavior:contain;padding-right:2px}'
      + '#genFind .gf-i{display:grid;grid-template-columns:44px;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:center;gap:6px;padding:7px 8px;border:1px solid #e3e5ed;border-radius:10px;background:#fafbfe;text-decoration:none;color:#23283a}'
      + '#genFind .gf-i:hover,#genFind .gf-i:focus-visible{border-color:#e85d12;background:#fff7f1}'
      + '#genFind .gf-g{font:800 14px "Outfit",sans-serif;color:#e85d12}'
      + '#genFind .gf-h{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;font-size:10.5px;font-weight:700;line-height:1.2;text-align:center}'
      + '#genFind .gf-h img{width:38px;height:38px;border-radius:10px;object-fit:cover;background:#eef0f5}'
      + '#genFind .gf-h span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '#genFind .gf-x{float:right;font-size:12px;font-weight:700;color:#5b6276;text-decoration:none}'
      + '@media(max-width:560px){#genFind .gf-list{grid-template-columns:1fr;max-height:360px}}';
    D.head.appendChild(st);
    function nameOf(hh){ return W.WOS_heroName ? W.WOS_heroName(hh) : hh.name; }
    function build(){
      var heroes = W.WOS_HEROES || [], byGen = {}, mx = maxGen();
      heroes.forEach(function(hh){ if(hh.gen >= 1 && hh.gen <= mx) (byGen[hh.gen] = byGen[hh.gen] || []).push(hh); });
      var order = { inf: 0, lan: 1, mks: 2 }, html = '';
      for(var gn = mx; gn >= 1; gn--){
        var list = (byGen[gn] || []).slice().sort(function(a, b){ return (order[a.cls] || 0) - (order[b.cls] || 0); });
        if(!list.length) continue;
        html += '<a class="gf-i" href="#" role="button" data-gen="' + gn + '"><span class="gf-g">G' + gn + '</span>'
          + list.map(function(hh){ var src = W.WOS_heroImg && W.WOS_heroImg(hh);
              return '<span class="gf-h">' + (src ? '<img src="' + src + '" alt="" loading="lazy" width="38" height="38">' : '') + '<span>' + nameOf(hh) + '</span></span>'; }).join('')
          + '</a>';
      }
      panel = D.createElement('div'); panel.id = 'genFind';
      panel.innerHTML = '<a class="gf-x" href="#" role="button">' + t('閉じる', 'Close') + '</a><h4>' + t('いちばん新しい英雄から世代を調べる', 'Find your generation from your newest heroes') + '</h4><p>'
        + t('ゲーム内の「英雄」画面や英雄殿堂で、<b>自分のサーバーにいるいちばん新しい英雄</b>を確認し、その英雄がいる行を選んでください。新しい世代から順に並んでいます。',
            'In the game, check the <b>newest heroes available on your server</b> (Heroes screen or Hall of Heroes) and tap the row that shows them. Newest generation first.')
        + '</p><div class="gf-list">' + html + '</div>';
      row.parentNode.insertBefore(panel, row.nextSibling);
      panel.addEventListener('click', function(e){
        var a = e.target.closest('a'); if(!a) return;
        e.preventDefault();
        if(a.classList.contains('gf-i')){ sel.value = a.getAttribute('data-gen'); lsSet(LS_GEN, '1'); sel.dispatchEvent(new Event('change', { bubbles: true })); }
        panel.hidden = true;
      });
    }
    link.addEventListener('click', function(e){
      e.preventDefault();
      if(!panel) build(); else panel.hidden = !panel.hidden;
      if(!panel.hidden) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
  if(D.readyState !== 'loading') genInit(); else D.addEventListener('DOMContentLoaded', genInit);
  if(D.readyState !== 'loading') mount(); else D.addEventListener('DOMContentLoaded', mount);
})();
