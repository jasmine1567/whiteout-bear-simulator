/* ==== 統計セクション共通スクリプト（/stats/, /submit/, 熊シミュの投稿ボタン） ====
   前提: config.js（WOS_API / WOS_TURNSTILE_SITEKEY / t()）, heroes.js（WOS_HEROES）, gen-map.js（WOS_GENMAP）
   - 実測は実行時に API から取得し、世代ページの「理論 vs 実測」の実測側だけを埋める
   - API が無い／落ちていても理論側（静的HTML）はそのまま表示される
   - 投稿フォームの項目は FIELDS で増減できる（比率は現在オフ。将来オンにするだけで復活） */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  var EN = (W.WOS_LANG || 'ja') === 'en';
  var GM = W.WOS_GENMAP, H = W.WOS_HEROES || [];
  var API = (W.WOS_API || '').replace(/\/$/, '');
  var CLS = ['inf','lan','mks'];
  var CLS_JA = { inf:'盾', lan:'槍', mks:'弓' }, CLS_EN = { inf:'INF', lan:'LAN', mks:'MKS' };
  var byId = {}; H.forEach(function(h){ byId[h.id] = h; });
  var S = W.WOS_STATS = {};

  /* 投稿フォームの項目スイッチ（拡張用）。false の項目はUIに出さず、送信値は null */
  var FIELDS = { ratio: false, damage: true, fc: true, gear: true };
  S.FIELDS = FIELDS;

  /* ---------- 表示ヘルパ ---------- */
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function clsName(c){ return EN ? CLS_EN[c] : CLS_JA[c]; }
  function heroName(id){ var h = byId[id]; if(!h) return id; return W.WOS_heroName ? W.WOS_heroName(h) : h.name; }
  function genLabel(g){ return g === 0 ? t('常設','Perm.') : 'G' + g; }
  function heroHtml(id, withCls){
    var h = byId[id]; if(!h) return esc(id);
    return '<span data-hero="' + esc(id) + '">' + (withCls ? '<span class="cls">' + clsName(h.cls) + '</span>' : '')
      + esc(heroName(id)) + '<span class="g">' + genLabel(h.gen) + '</span></span>';
  }
  function fmtM(n){ if(!isFinite(n)) return '—'; if(n >= 1e6) return (n/1e6).toFixed(2) + 'M'; if(n >= 1e3) return (n/1e3).toFixed(0) + 'K'; return String(Math.round(n)); }
  S.esc = esc; S.heroHtml = heroHtml; S.heroName = heroName; S.clsName = clsName;
  S.relabelHeroes = function(root){ relabelHeroes(root); };

  function relabelHeroes(root){
    (root || D).querySelectorAll('[data-hero]').forEach(function(el){
      var h = byId[el.getAttribute('data-hero')]; if(!h) return;
      var g = el.querySelector('.g'), c = el.querySelector('.cls');
      el.innerHTML = (c ? '<span class="cls">' + clsName(h.cls) + '</span>' : '') + esc(heroName(h.id)) + (g ? '<span class="g">' + genLabel(h.gen) + '</span>' : '');
    });
  }

  /* ---------- 課金帯タブ ---------- */
  /* 同じ data-group のタブ群（ページ上部の大きな選択と、下の小さなタブ）は連動する。
     選んだ課金帯はブラウザに記憶し、次の世代ページでも同じ課金帯で開く（?tier= で上書き可） */
  var TIER_LS = 'wos_stats_tier';
  function initTierTabs(){
    var groups = {};
    D.querySelectorAll('.tier-tabs').forEach(function(tabs){
      var group = tabs.getAttribute('data-group') || 'theory';
      (groups[group] = groups[group] || []).push(tabs);
    });
    Object.keys(groups).forEach(function(group){
      var sets = groups[group], first = sets[0];
      if(first.getAttribute('data-init')) return; sets.forEach(function(s){ s.setAttribute('data-init','1'); });
      var btns = []; sets.forEach(function(s){ s.querySelectorAll('button').forEach(function(b){ btns.push(b); }); });
      var valid = {}; btns.forEach(function(b){ valid[b.getAttribute('data-tier')] = 1; });
      var def = first.getAttribute('data-default') || (btns[0] && btns[0].getAttribute('data-tier'));
      var want = null;
      try{ want = new URLSearchParams(location.search).get('tier'); }catch(e){}
      if(!want || !valid[want]){ try{ want = localStorage.getItem(TIER_LS); }catch(e){ want = null; } }
      if(!want || !valid[want]) want = def;
      function pick(key, remember){
        btns.forEach(function(b){ var on = b.getAttribute('data-tier') === key; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        D.querySelectorAll('.tier-pane[data-group="' + group + '"]').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-tier') === key); });
        if(remember){ try{ localStorage.setItem(TIER_LS, key); }catch(e){} }
      }
      btns.forEach(function(b){ b.addEventListener('click', function(){ pick(b.getAttribute('data-tier'), true); }); });
      pick(want, false);
    });
  }

  /* ---------- API ---------- */
  function getJSON(path){
    if(!API) return Promise.reject(new Error('no-api'));
    return fetch(API + path, { mode:'cors', credentials:'omit' }).then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }

  /* ---------- 世代ページ: 実測側の描画 ---------- */
  function rankList(rows, limit){
    if(!rows || !rows.length) return '<div class="note">—</div>';
    var html = '';
    rows.slice(0, limit || 5).forEach(function(r, i){
      html += '<div class="rk-row"><span class="rk-n">' + (i+1) + '</span><span class="rk-h">' + heroHtml(r.id) + '</span><span class="rk-v">' + r.pct + '%</span>'
        + '<span class="rk-bar live"><i style="width:' + Math.min(100, r.pct) + '%"></i></span></div>';
    });
    return html;
  }
  function trioList(comps, limit){
    if(!comps || !comps.length) return '<div class="note">—</div>';
    var html = '';
    comps.slice(0, limit || 3).forEach(function(c, i){
      html += '<div class="rk-row trio"><span class="rk-n">' + (i+1) + '</span><span class="rk-h">' + heroHtml(c.ids[0], true) + ' ' + heroHtml(c.ids[1], true) + ' ' + heroHtml(c.ids[2], true) + '</span><span class="rk-v">' + c.pct + '%</span>'
        + '<span class="rk-bar live"><i style="width:' + Math.min(100, c.pct) + '%"></i></span></div>';
    });
    return html;
  }
  function fillAll(sel, html){ D.querySelectorAll(sel).forEach(function(el){ el.innerHTML = html; }); }

  S.renderCompare = function(gen){
    var page = D.querySelector('[data-live-page]'); if(!page) return;
    var submitHref = (W.WOS_BASE || '') + '/submit/index.html?gen=' + gen;
    function notReady(title, body){
      var html = '<div class="live-empty"><b>' + title + '</b>' + body
        + '<br><a class="btn" href="' + submitHref + '">' + t('この世代の構成を投稿する','Submit a build for this generation') + '</a></div>';
      fillAll('[data-live="meta"]', html);
      fillAll('[data-live="slot"], [data-live="trio"]', '<div class="note live-none">' + t('投稿待ち','awaiting data') + '</div>');
      fillAll('[data-live="stats"]', '');
    }
    if(!API){ notReady(t('実測データは準備中です','Live stats coming soon'), ''); return; }
    getJSON('/v1/stats/' + gen).then(function(s){
      if(!s || !s.published){
        notReady(t('実測はデータ募集中','Collecting live data'),
          t('現在 ','') + '<b style="display:inline">' + (s && s.n || 0) + '</b>' + t(' 件。10件集まると公開されます。',' submissions so far. Opens at 10.'));
        return;
      }
      var d = new Date(s.updatedAt * 1000);
      var ref = s.n < 30 ? '<span class="badge-ref">' + t('参考値（30件未満）','indicative (<30)') + '</span>' : '';
      fillAll('[data-live="meta"]', '<span class="live-meta">' + t('投稿 ','Submissions: ') + '<b>' + s.n + '</b>' + t(' 件 ／ 直近90日 ／ 更新 ',' · last 90 days · updated ') + d.toLocaleDateString(EN ? 'en-US' : 'ja-JP') + ref + '</span>');
      /* 課金帯ごと: 内訳があればそれを、無ければ全体（合算）を表示して明示 */
      GM.TIER_ORDER.forEach(function(tk){
        var b = (s.byTier && s.byTier[tk] && s.byTier[tk].slot) ? s.byTier[tk] : null;
        var src = b || s;
        var tag = b ? '<span class="src-tag">' + t('この課金帯 n=','this tier n=') + b.n + '</span>' : '<span class="src-tag">' + t('全課金帯の合算 n=','all tiers n=') + s.n + '</span>';
        CLS.forEach(function(c){ fillAll('[data-live="slot"][data-tier="' + tk + '"][data-cls="' + c + '"]', rankList(src.slot[c], 5)); });
        fillAll('[data-live="trio"][data-tier="' + tk + '"]', trioList(src.comps, 3));
        fillAll('[data-live="srctag"][data-tier="' + tk + '"]', tag);
      });
      var st = '<div class="statcards">';
      if(s.damage) st += '<div class="statcard"><div class="big">' + fmtM(s.damage.median) + '</div><div class="lbl">' + t('ダメージ中央値','Median damage') + '</div></div>'
        + '<div class="statcard"><div class="big">' + fmtM(s.damage.p75) + '</div><div class="lbl">' + t('上位25%','Top 25%') + '</div></div>'
        + '<div class="statcard"><div class="big">' + fmtM(s.damage.p90) + '</div><div class="lbl">' + t('上位10%','Top 10%') + '</div></div>';
      if(s.lag) st += '<div class="statcard"><div class="big" style="font-size:15px">' + clsName('inf') + ' ' + s.lag.inf + ' / ' + clsName('lan') + ' ' + s.lag.lan + ' / ' + clsName('mks') + ' ' + s.lag.mks + '</div><div class="lbl">' + t('平均で何世代前の英雄か','Avg generations behind, per slot') + '</div></div>';
      st += '</div>';
      fillAll('[data-live="stats"]', st);
      relabelHeroes(page);
    }).catch(function(){
      notReady(t('実測データは準備中です','Live stats coming soon'), t('集計サーバーに接続できませんでした。理論側はそのまま参照できます。','Could not reach the stats server. The theory side is unaffected.'));
    });
  };

  /* ---------- 世代ページ: 口コミ（投稿フォームの「ひとこと」付き投稿を Worker から取得） ---------- */
  var RV_VISIBLE = 5;   /* これを超えたら枠内スクロール */
  var RV_LS = 'wos_stats_reported';
  function fmtDate(sec){ var d = new Date(sec * 1000); if(isNaN(d)) return ''; return d.toLocaleDateString(EN ? 'en-US' : 'ja-JP', { year:'numeric', month:'short', day:'numeric' }); }
  function reported(){ try{ return JSON.parse(localStorage.getItem(RV_LS) || '[]'); }catch(e){ return []; } }
  function reviewCard(it){
    var T = GM.TIERS[it.tier] || {};
    var who = it.nick ? esc(it.nick) : t('匿名','Anonymous');
    var dmg = it.damage ? '<span class="rv-dmg">⚔ ' + fmtM(it.damage) + '</span>' : '';
    var rep = reported().indexOf(it.id) >= 0;
    return '<div class="rv-item" data-id="' + esc(it.id) + '">'
      + '<div class="rv-head"><span class="rv-tier ' + esc(it.tier) + '">' + esc(EN ? T.label_en : T.label) + '</span><b>' + who + '</b><time>' + fmtDate(it.at) + '</time></div>'
      + '<div class="rv-build">' + heroHtml(it.inf, true) + ' ' + heroHtml(it.lan, true) + ' ' + heroHtml(it.mks, true) + dmg + '</div>'
      + '<div class="rv-text">' + esc(it.comment).replace(/\n/g, '<br>') + '</div>'
      + '<div class="rv-foot"><button type="button" class="rv-report"' + (rep ? ' disabled' : '') + '>' + (rep ? t('通報済み','Reported') : '⚑ ' + t('通報','Report')) + '</button></div></div>';
  }
  function bindReport(box){
    box.querySelectorAll('.rv-report').forEach(function(b){
      if(b.disabled) return;
      var step = 0;
      b.addEventListener('click', function(){
        var id = b.closest('.rv-item').getAttribute('data-id');
        if(step === 0){ step = 1; b.textContent = t('この口コミを通報しますか？ → はい','Report this review? → Yes'); b.classList.add('arm'); setTimeout(function(){ if(step === 1){ step = 0; b.textContent = '⚑ ' + t('通報','Report'); b.classList.remove('arm'); } }, 6000); return; }
        step = 2; b.disabled = true; b.textContent = t('送信中…','Sending…');
        fetch(API + '/v1/report/' + encodeURIComponent(id), { method:'POST', mode:'cors', credentials:'omit', headers:{ 'content-type':'application/json' }, body:'{}' })
          .then(function(r){ return r.json(); })
          .then(function(){ b.textContent = t('通報しました。ご協力ありがとうございます','Reported — thank you'); try{ var a = reported(); a.push(id); localStorage.setItem(RV_LS, JSON.stringify(a.slice(-200))); }catch(e){} })
          .catch(function(){ b.disabled = false; step = 0; b.textContent = t('送信できませんでした','Could not send'); });
      });
    });
  }
  S.renderReviews = function(gen){
    var box = D.querySelector('[data-reviews="' + gen + '"]'); if(!box) return;
    var submitHref = (W.WOS_BASE || '') + '/submit/index.html?gen=' + gen + '&review=1';
    function empty(title, body){ box.innerHTML = '<div class="rv-empty"><b>' + title + '</b>' + (body ? '<div>' + body + '</div>' : '') + '<a class="btn" href="' + submitHref + '">' + t('口コミを投稿する','Post a review') + '</a></div>'; }
    if(!API){ empty(t('口コミは準備中です','Reviews coming soon'), ''); return; }
    getJSON('/v1/reviews/' + gen).then(function(r){
      var items = (r && r.items) || [];
      if(!items.length){ empty(t('まだ口コミがありません','No reviews yet'), t('最初の口コミを投稿しませんか？ 投稿フォームの「ひとこと」に書くだけで、ここに載ります。','Be the first — just fill in the "one-liner" field on the submission form.')); return; }
      var html = '<div class="rv-meta">' + t('全 ','') + '<b>' + items.length + '</b>' + t(' 件・新しい順',' reviews · newest first') + '</div>';
      html += '<div class="rv-scroll' + (items.length > RV_VISIBLE ? ' on' : '') + '">' + items.map(reviewCard).join('') + '</div>'
        + (items.length > RV_VISIBLE ? '<div class="rv-more">' + t('▼ スクロールで続きを表示','▼ scroll for more') + '</div>' : '');
      box.innerHTML = html;
      relabelHeroes(box);
      bindReport(box);
    }).catch(function(){ empty(t('口コミを読み込めませんでした','Could not load reviews'), t('時間をおいて再読み込みしてください。','Please try again later.')); });
  };

  /* ハブ用: 世代ごとの件数 */
  S.renderSummary = function(){
    var targets = D.querySelectorAll('[data-gen-n]');
    if(!targets.length || !API) return;
    getJSON('/v1/stats/summary').then(function(s){
      targets.forEach(function(el){
        var g = el.getAttribute('data-gen-n'), v = s.gens && s.gens[g]; if(!v) return;
        el.textContent = (v.n || 0); if(v.published) el.classList.add('pub');
      });
      var tot = D.querySelector('[data-total-n]'); if(tot){ var sum = 0; Object.keys(s.gens||{}).forEach(function(g){ sum += s.gens[g].n || 0; }); tot.textContent = sum.toLocaleString(); }
    }).catch(function(){});
  };

  /* ---------- X 埋め込み（公式の英雄紹介） ---------- */
  function initTweets(){
    if(!D.querySelector('.twitter-tweet') || D.getElementById('tw-wjs')) return;
    var s = D.createElement('script'); s.id = 'tw-wjs'; s.src = 'https://platform.twitter.com/widgets.js'; s.async = true; s.charset = 'utf-8';
    D.head.appendChild(s);
  }

  /* ---------- 投稿フォーム ---------- */
  var LS_KEY = 'wos_stats_submission';
  function loadSaved(){ try{ return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }catch(e){ return null; } }
  function save(o){ try{ localStorage.setItem(LS_KEY, JSON.stringify(o)); }catch(e){} }
  function tsScript(){
    if(!W.WOS_TURNSTILE_SITEKEY || D.getElementById('cf-ts')) return;
    var s = D.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.defer = true; D.head.appendChild(s);
  }
  function tsToken(root){
    if(!W.WOS_TURNSTILE_SITEKEY) return '';
    try{ var w = root.querySelector('.cf-turnstile'); return W.turnstile && w ? (W.turnstile.getResponse(w) || '') : ''; }catch(e){ return ''; }
  }

  /* container に投稿フォームを描画。opts.prefill = {gen,tier,inf,lan,mks,ratio,damage,fc,gear} */
  S.mountForm = function(container, opts){
    opts = opts || {}; var pre = opts.prefill || {}; var saved = loadSaved() || {};
    var q = new URLSearchParams(location.search);
    var initGen = pre.gen || saved.gen || parseInt(q.get('gen'), 10) || GM.MAX;
    var initTier = pre.tier || saved.tier || 'f2p';
    tsScript();

    var genOpts = ''; for(var g = GM.MAX; g >= 1; g--) genOpts += '<option value="' + g + '"' + (g === initGen ? ' selected' : '') + '>' + (EN ? 'Gen ' + g : '第' + g + '世代') + '</option>';
    var html = ''
      + '<div class="step"><h3><span class="num">1</span>' + t('あなたの環境','Your environment') + '</h3>'
      + '<div class="row"><div><label>' + t('サーバーの最新世代','Latest generation on your server') + '</label><select id="st-gen">' + genOpts + '</select>'
      + '<p class="hint">' + t('英雄殿堂で買える最新の世代です。','The newest generation available in your Hall of Heroes.') + '</p></div></div>'
      + '<label>' + t('課金帯','Spending tier') + '</label><div class="tier-pick" id="st-tier">';
    GM.TIER_ORDER.forEach(function(k){
      var T = GM.TIERS[k];
      html += '<label' + (initTier === k ? ' class="on"' : '') + '><input type="radio" name="st-tier" value="' + k + '"' + (initTier === k ? ' checked' : '') + '>' + esc(EN ? T.label_en : T.label)
        + '<small>' + esc(k === 'f2p' ? t('ルーレット英雄が中心','Mostly roulette heroes') : k === 'mid' ? t('世代ごとに1体は追加で育成','One extra hero per generation') : t('全英雄カンスト','All heroes maxed')) + '</small></label>';
    });
    html += '</div></div>'
      + '<div class="step"><h3><span class="num">2</span>' + t('集結主の英雄','Rally-leader heroes') + '</h3>'
      + '<p class="hint">' + t('盾・槍・弓を1人ずつ。選んだ世代までの英雄だけが並びます。','One each: INF / LAN / MKS. Only heroes released up to your generation are listed.') + '</p><div class="row">';
    CLS.forEach(function(c){ html += '<div><label>' + clsName(c) + '</label><select id="st-' + c + '"></select></div>'; });
    html += '</div></div>';
    /* 任意項目（FIELDS で制御） */
    var optional = '';
    if(FIELDS.ratio){
      optional += '<div class="row"><div style="flex-basis:100%"><label>' + t('兵種比率（盾:槍:弓）','Troop ratio (INF:LAN:MKS)') + '</label><div class="ratio-presets" id="st-presets"></div></div>'
        + '<div><input type="number" id="st-r0" min="0" max="100" placeholder="' + clsName('inf') + '"></div><div><input type="number" id="st-r1" min="0" max="100" placeholder="' + clsName('lan') + '"></div><div><input type="number" id="st-r2" min="0" max="100" placeholder="' + clsName('mks') + '"></div></div>';
    }
    if(FIELDS.damage || FIELDS.fc){
      optional += '<div class="row">';
      if(FIELDS.damage) optional += '<div><label>' + t('1ラリーの記録ダメージ','Damage per rally') + '</label><input type="number" id="st-damage" min="0" step="1000" placeholder="' + t('例: 38500000','e.g. 38500000') + '"><p class="hint">' + t('入れると同世代内の順位が出ます','Enables your rank within the generation') + '</p></div>';
      if(FIELDS.fc) optional += '<div><label>' + t('火晶（炉）レベル','Fire Crystal level') + '</label><input type="number" id="st-fc" min="0" max="20"></div>';
      optional += '</div>';
    }
    if(FIELDS.gear){
      optional += '<div class="row">';
      CLS.forEach(function(c, i){ optional += '<div><label>' + clsName(c) + t(' 専用装備Lv',' gear Lv') + '</label><input type="number" id="st-g' + i + '" min="0" max="10"></div>'; });
      optional += '</div>';
    }
    if(optional) html += '<div class="step"><h3><span class="num">3</span>' + t('任意：もっと詳しく','Optional: more details') + '</h3>' + optional + '</div>';
    /* 口コミ（ひとこと）。書くと世代ページの「口コミ」欄に公開される */
    html += '<div class="step" id="st-review"><h3><span class="num">' + (optional ? 4 : 3) + '</span>' + t('任意：ひとこと（口コミとして公開）','Optional: one-liner (published as a review)') + '</h3>'
      + '<p class="hint">' + t('この構成の使用感・乗り換えた理由など。世代ページの「口コミ」欄に、上の構成と一緒に載ります。URL は書けません。','How this build feels, why you swapped, etc. Shown with your build in the generation page\'s Reviews block. No links.') + '</p>'
      + '<textarea id="st-comment" maxlength="200" rows="3" placeholder="' + t('例: ブランシュに替えて1割伸びた。無課金ならヘクトーで十分','e.g. Swapped to Blanchette and gained ~10%. Hector is enough for F2P') + '"></textarea>'
      + '<div class="row"><div><label>' + t('表示名（任意・16文字まで）','Display name (optional, 16 chars)') + '</label><input type="text" id="st-nick" maxlength="16" placeholder="' + t('空欄なら「匿名」','Blank = Anonymous') + '"></div><div style="align-self:flex-end"><span class="hint" id="st-count">0 / 200</span></div></div></div>';
    html += '<label class="consent"><input type="checkbox" id="st-consent"><span>' + t('匿名の統計データとして送信し、当サイトで集計・公開することに同意します（個人を特定する情報は送信されません。「ひとこと」と表示名は口コミとして公開されます）。','I agree to submit this as anonymous statistics for aggregation and publication on this site. No identifying information is sent; the one-liner and display name are published as a review.') + ' <a href="' + (W.WOS_BASE||'') + '/privacy.html" target="_blank" rel="noopener">' + t('プライバシーポリシー','Privacy policy') + '</a></span></label>'
      + (W.WOS_TURNSTILE_SITEKEY ? '<div class="cf-turnstile" data-sitekey="' + esc(W.WOS_TURNSTILE_SITEKEY) + '" data-size="flexible" style="margin:8px 0"></div>' : '')
      + '<button type="button" class="submit-btn" id="st-submit" disabled>' + t('統計に投稿する','Submit to stats') + '</button>'
      + (saved.editKey ? '<p class="note" style="margin-top:6px">' + t('前回の投稿を上書き更新します。','This will update your previous submission.') + ' <a href="#" id="st-forget">' + t('新規として投稿する','Submit as new') + '</a></p>' : '')
      + '<div class="err" id="st-err"></div><div id="st-result"></div>';
    container.innerHTML = html;

    var $ = function(id){ return container.querySelector('#' + id); };
    var genSel = $('st-gen'), sel = { inf:$('st-inf'), lan:$('st-lan'), mks:$('st-mks') };
    var consent = $('st-consent'), btn = $('st-submit'), err = $('st-err'), res = $('st-result');
    var editKey = saved.editKey || null, submissionId = saved.id || null;
    var forget = $('st-forget'); if(forget) forget.onclick = function(e){ e.preventDefault(); editKey = null; submissionId = null; forget.parentNode.remove(); };
    var curGen = function(){ return parseInt(genSel.value, 10); };
    var tier = function(){ var el = container.querySelector('input[name="st-tier"]:checked'); return el ? el.value : null; };

    function fillHeroes(){
      var g = curGen();
      CLS.forEach(function(c){
        var cur = sel[c].value || pre[c] || saved[c] || '';
        var list = H.filter(function(h){ return h.cls === c && h.gen <= g; }).sort(function(a,b){ return b.gen - a.gen || (a.rar === 'SSR' ? -1 : 1); });
        sel[c].innerHTML = '<option value="">' + t('— 選択 —','— select —') + '</option>' + list.map(function(h){
          return '<option value="' + h.id + '"' + (h.id === cur ? ' selected' : '') + '>' + esc(heroName(h.id)) + ' (' + genLabel(h.gen) + (h.rar !== 'SSR' ? ' ' + h.rar : '') + ')</option>';
        }).join('');
      });
      validate();
    }
    var r = FIELDS.ratio ? [$('st-r0'), $('st-r1'), $('st-r2')] : null;
    if(r){
      var PRESETS = [[1,4,95],[5,5,90],[10,10,80],[10,30,60]], pres = $('st-presets');
      pres.innerHTML = PRESETS.map(function(p){ return '<button type="button" data-r="' + p.join(',') + '">' + p.join(':') + '</button>'; }).join('');
      pres.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ var p = b.getAttribute('data-r').split(','); r.forEach(function(el, i){ el.value = p[i]; }); validate(); }; });
      var initRatio = pre.ratio || saved.ratio; if(initRatio) r.forEach(function(el, i){ el.value = initRatio[i]; });
      r.forEach(function(el){ el.addEventListener('input', validate); });
    }
    if(FIELDS.damage){ var dv = pre.damage != null ? pre.damage : saved.damage; if(dv != null) $('st-damage').value = dv; }
    if(FIELDS.fc){ var fv = pre.fc != null ? pre.fc : saved.fc; if(fv != null) $('st-fc').value = fv; }
    if(FIELDS.gear){ (pre.gear || saved.gear || []).forEach(function(v, i){ if(v != null && $('st-g' + i)) $('st-g' + i).value = v; }); }
    var cmt = $('st-comment'), nick = $('st-nick'), cnt = $('st-count');
    if(saved.comment) cmt.value = saved.comment; if(saved.nick) nick.value = saved.nick;
    function count(){ cnt.textContent = cmt.value.length + ' / 200'; } count(); cmt.addEventListener('input', count);
    if(q.get('review') === '1'){ setTimeout(function(){ try{ $('st-review').scrollIntoView({ behavior:'smooth', block:'center' }); cmt.focus(); }catch(e){} }, 300); }

    function ratioVal(){
      if(!r) return null;
      var rs = r.map(function(el){ return parseInt(el.value, 10); });
      if(rs.every(function(v){ return !isFinite(v); })) return null;          /* 未入力なら送らない */
      return rs;
    }
    function validate(){
      var ok = isFinite(curGen()) && tier() && CLS.every(function(c){ return sel[c].value; }) && consent.checked;
      var rs = ratioVal();
      if(rs && (rs.some(function(v){ return !isFinite(v) || v < 0; }) || rs[0] + rs[1] + rs[2] !== 100)) ok = false;
      btn.disabled = !ok; return ok;
    }
    genSel.addEventListener('change', fillHeroes);
    container.querySelectorAll('input[name="st-tier"]').forEach(function(el){ el.addEventListener('change', function(){ container.querySelectorAll('.tier-pick label').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); }); validate(); }); });
    CLS.forEach(function(c){ sel[c].addEventListener('change', validate); });
    consent.addEventListener('change', validate);
    fillHeroes();

    btn.addEventListener('click', function(){
      if(!validate()) return;
      err.textContent = ''; btn.disabled = true; btn.textContent = t('送信中…','Sending…');
      var body = { gen: curGen(), tier: tier(), inf: sel.inf.value, lan: sel.lan.value, mks: sel.mks.value,
        ratio: ratioVal(),
        damage: FIELDS.damage ? ($('st-damage').value || null) : null, fc: FIELDS.fc ? ($('st-fc').value || null) : null,
        gear: FIELDS.gear ? [0,1,2].map(function(i){ return $('st-g' + i).value || null; }) : null,
        comment: cmt.value.trim() || null, nick: nick.value.trim() || null,
        editKey: editKey, turnstile: tsToken(container) };
      if(!API){ err.textContent = t('投稿先が設定されていません。','Submission endpoint is not configured.'); btn.disabled = false; btn.textContent = t('統計に投稿する','Submit to stats'); return; }
      fetch(API + '/v1/submit', { method:'POST', mode:'cors', credentials:'omit', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) })
        .then(function(x){ return x.json().then(function(j){ return { ok: x.ok, j: j }; }); })
        .then(function(o){
          btn.textContent = t('統計に投稿する','Submit to stats'); btn.disabled = false;
          if(!o.ok || !o.j.ok){
            var m = o.j && o.j.error;
            err.textContent = m === 'turnstile' ? t('人間確認に失敗しました。ページを再読み込みしてください。','Verification failed. Please reload.')
              : m === 'invalid' ? fieldError(o.j.fields || [])
              : t('送信に失敗しました。','Submission failed.');
            try{ if(W.turnstile) W.turnstile.reset(); }catch(e){}
            return;
          }
          editKey = o.j.editKey; submissionId = o.j.id;
          save({ id: submissionId, editKey: editKey, gen: body.gen, tier: body.tier, inf: body.inf, lan: body.lan, mks: body.mks, ratio: body.ratio, damage: body.damage, fc: body.fc, gear: body.gear, comment: body.comment, nick: body.nick });
          res.innerHTML = resultCard(o.j.diag, o.j.review ? body : null);
          relabelHeroes(res);
          if(W.WOS_TRACK) W.WOS_TRACK('stats_submit', { gen: o.j.diag.gen, tier: body.tier });
          res.scrollIntoView({ behavior:'smooth', block:'start' });
          if(opts.onSubmitted) opts.onSubmitted(o.j);
        })
        .catch(function(){ btn.disabled = false; btn.textContent = t('統計に投稿する','Submit to stats'); err.textContent = t('通信エラーです。時間をおいて再度お試しください。','Network error. Please try again later.'); });
    });
  };

  function fieldError(fields){
    var f = fields.join(',');
    if(/comment:url|nick:url/.test(f)) return t('「ひとこと」「表示名」に URL は書けません。','Links are not allowed in the one-liner or display name.');
    if(/comment:ng|nick:ng/.test(f)) return t('「ひとこと」「表示名」に使えない言葉が含まれています。表現を変えてください。','The one-liner or display name contains a blocked word. Please rephrase.');
    return t('入力内容に問題があります: ','Invalid input: ') + fields.join(', ');
  }
  function resultCard(d, reviewBody){
    var base = (W.WOS_BASE || '');
    var html = '<div class="result-card"><h3>' + t('投稿ありがとうございます！','Thanks for submitting!') + '</h3>'
      + '<div class="kv">'
      + '<div><b>' + t('世代 ／ 課金帯','Generation / tier') + '</b>' + (EN ? 'Gen ' + d.gen : '第' + d.gen + '世代') + ' ／ ' + esc(EN ? GM.TIERS[d.tier].label_en : GM.TIERS[d.tier].label) + '</div>';
    if(d.rank) html += '<div><b>' + t('同世代内の順位','Rank in your generation') + '</b><span class="big">' + t('上位','Top ') + d.rank.pct + '%</span>' + t('（','(') + d.rank.n + t('件中）',' samples)') + '</div>';
    else html += '<div><b>' + t('同世代内の順位','Rank in your generation') + '</b>' + t('ダメージを入れると出ます（5件以上で算出）','Enter damage to see it (needs 5+ samples)') + '</div>';
    html += '<div><b>' + t('何世代前の英雄か','Generations behind') + '</b>' + clsName('inf') + ' ' + d.lag.inf + ' ／ ' + clsName('lan') + ' ' + d.lag.lan + ' ／ ' + clsName('mks') + ' ' + d.lag.mks + '</div>';
    html += '</div>';
    if(d.theory){
      html += '<div class="swap"><b>' + t('あなたの課金帯の理論最適','Theoretical best for your tier') + '</b><br>' + heroHtml(d.theory.ids[0], true) + ' ' + heroHtml(d.theory.ids[1], true) + ' ' + heroHtml(d.theory.ids[2], true) + '</div>';
      html += d.theory.swap.length
        ? '<div class="swap"><b>' + t('乗り換え候補の枠','Slots to consider swapping') + '</b><br>' + d.theory.swap.map(function(c){ return '<span class="slot-tag">' + clsName(c) + '</span>'; }).join(' ') + '</div>'
        : '<div class="swap">🎯 ' + t('理論最適構成と一致しています。','Your build matches the theoretical best.') + '</div>';
    }
    if(reviewBody) html += '<div class="swap">💬 ' + t('ひとことは口コミとして世代ページに掲載されました。','Your one-liner is now shown in the generation page\'s Reviews block.') + '</div>';
    html += '<p class="note">' + t('投稿はこのブラウザに保存され、次回は上書き更新になります。','Saved in this browser; your next submission updates this one.') + '</p>';
    html += '<p><a class="btn" href="' + base + '/stats/gen-' + String(d.gen).padStart(2,'0') + '/index.html">' + t('この世代の統計を見る','See stats for this generation') + '</a></p></div>';
    return html;
  }

  /* ---------- 起動 ---------- */
  function boot(){
    relabelHeroes();
    initTierTabs();
    initTweets();
    var page = D.querySelector('[data-live-page]'); if(page){ var g = parseInt(page.getAttribute('data-live-page'), 10); S.renderCompare(g); S.renderReviews(g); }
    S.renderSummary();
    var form = D.getElementById('submit-form'); if(form) S.mountForm(form, {});
  }
  if(D.readyState !== 'loading') boot(); else D.addEventListener('DOMContentLoaded', boot);
})();
