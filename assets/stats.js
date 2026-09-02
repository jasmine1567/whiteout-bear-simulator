/* ==== 統計セクション共通スクリプト（/stats/, /submit/, 熊シミュの投稿ボタン） ====
   前提: config.js（WOS_API / WOS_TURNSTILE_SITEKEY / t()）, heroes.js（WOS_HEROES）, gen-map.js（WOS_GENMAP）
   実測パートは実行時に API から取得する。API が無い／落ちていても理論パート（静的HTML）はそのまま表示される。 */
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

  /* ---------- 表示ヘルパ ---------- */
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function clsName(c){ return EN ? CLS_EN[c] : CLS_JA[c]; }
  function heroName(id){ var h = byId[id]; if(!h) return id; return W.WOS_heroName ? W.WOS_heroName(h) : h.name; }
  function genLabel(g){ return g === 0 ? t('常設','Perm.') : (EN ? 'G' + g : 'G' + g); }
  function heroHtml(id, withCls){
    var h = byId[id]; if(!h) return esc(id);
    return '<span data-hero="' + esc(id) + '">' + (withCls ? '<span class="cls">' + clsName(h.cls) + '</span>' : '')
      + esc(heroName(id)) + '<span class="g">' + genLabel(h.gen) + '</span></span>';
  }
  function fmt(n){ return isFinite(n) ? Math.round(n).toLocaleString(EN ? 'en-US' : 'ja-JP') : '—'; }
  function fmtM(n){ if(!isFinite(n)) return '—'; if(n >= 1e6) return (n/1e6).toFixed(2) + 'M'; if(n >= 1e3) return (n/1e3).toFixed(0) + 'K'; return String(Math.round(n)); }
  S.esc = esc; S.heroHtml = heroHtml; S.heroName = heroName; S.clsName = clsName;

  /* 静的HTML内の英雄名を現在言語に揃える（英語ページ用） */
  function relabelHeroes(root){
    (root || D).querySelectorAll('[data-hero]').forEach(function(el){
      var h = byId[el.getAttribute('data-hero')]; if(!h) return;
      var g = el.querySelector('.g'), c = el.querySelector('.cls');
      el.innerHTML = (c ? '<span class="cls">' + clsName(h.cls) + '</span>' : '') + esc(heroName(h.id)) + (g ? '<span class="g">' + genLabel(h.gen) + '</span>' : '');
    });
  }

  /* ---------- 課金帯タブ ---------- */
  function initTierTabs(){
    D.querySelectorAll('.tier-tabs').forEach(function(tabs){
      var group = tabs.getAttribute('data-group') || 'theory';
      var btns = tabs.querySelectorAll('button');
      function pick(key){
        btns.forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-tier') === key); });
        D.querySelectorAll('.tier-pane[data-group="' + group + '"]').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-tier') === key); });
        try{ localStorage.setItem('wos_stats_tier', key); }catch(e){}
      }
      btns.forEach(function(b){ b.addEventListener('click', function(){ pick(b.getAttribute('data-tier')); }); });
      var saved = null; try{ saved = localStorage.getItem('wos_stats_tier'); }catch(e){}
      var first = btns[0] && btns[0].getAttribute('data-tier');
      pick(saved && tabs.querySelector('[data-tier="' + saved + '"]') ? saved : first);
    });
  }

  /* ---------- API ---------- */
  function getJSON(path){
    if(!API) return Promise.reject(new Error('no-api'));
    return fetch(API + path, { mode:'cors', credentials:'omit' }).then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }

  /* ---------- 実測パートの描画 ---------- */
  function slotBlock(title, rows, n){
    var html = '<div class="slot"><h4>' + esc(title) + ' <span style="color:var(--muted);font-weight:500">n=' + n + '</span></h4>';
    if(!rows || !rows.length) return html + '<div class="note">—</div></div>';
    rows.slice(0,5).forEach(function(r){
      html += '<div class="r"><span>' + heroHtml(r.id) + '</span><span class="pc">' + r.pct + '%</span>'
        + '<span class="bar"><i style="width:' + Math.min(100, r.pct) + '%"></i></span></div>';
    });
    return html + '</div>';
  }
  function liveBlock(b, gen, ref){
    var html = '';
    if(ref) html += '<p class="live-meta">' + t('サンプルが少ないため参考値です','Small sample — treat as indicative') + '<span class="badge-ref">' + t('参考値','indicative') + '</span></p>';
    html += '<h3 style="font-size:14px;margin:8px 0">' + t('枠別の採用率','Pick rate by slot') + '</h3><div class="slots3">'
      + slotBlock(t('盾枠','Infantry slot'), b.slot.inf, b.n) + slotBlock(t('槍枠','Lancer slot'), b.slot.lan, b.n) + slotBlock(t('弓枠','Marksman slot'), b.slot.mks, b.n) + '</div>';
    if(b.comps && b.comps.length){
      html += '<h3 style="font-size:14px;margin:8px 0">' + t('よく使われている組み合わせ','Most common trios') + '</h3><div class="comp-list">';
      b.comps.slice(0,5).forEach(function(c, i){
        html += '<div class="comp' + (i === 0 ? ' top' : '') + '"><span class="rk">' + (i+1) + '</span><span class="heroes">'
          + heroHtml(c.ids[0], true) + heroHtml(c.ids[1], true) + heroHtml(c.ids[2], true) + '</span>'
          + '<span class="sc">' + c.pct + '%<small>' + c.count + t('件','') + '</small></span>'
          + '<span class="bar"><i style="width:' + Math.min(100, c.pct) + '%"></i></span></div>';
      });
      html += '</div>';
    }
    html += '<div class="statcards">';
    if(b.damage){
      html += '<div class="statcard"><div class="big">' + fmtM(b.damage.median) + '</div><div class="lbl">' + t('ダメージ中央値','Median damage') + '</div></div>'
        + '<div class="statcard"><div class="big">' + fmtM(b.damage.p75) + '</div><div class="lbl">' + t('上位25%','Top 25%') + '</div></div>'
        + '<div class="statcard"><div class="big">' + fmtM(b.damage.p90) + '</div><div class="lbl">' + t('上位10%','Top 10%') + '</div></div>';
    }
    if(b.lag){
      html += '<div class="statcard"><div class="big" style="font-size:16px">' + clsName('inf') + ' ' + b.lag.inf + ' / ' + clsName('lan') + ' ' + b.lag.lan + ' / ' + clsName('mks') + ' ' + b.lag.mks + '</div><div class="lbl">' + t('平均世代ラグ（何世代前の英雄か）','Avg generation lag per slot') + '</div></div>';
    }
    html += '</div>';
    return html;
  }
  S.renderLive = function(gen, el){
    if(!el) return;
    var submitHref = (W.WOS_BASE || '') + '/submit/index.html?gen=' + gen;
    function empty(n){
      el.innerHTML = '<div class="live-empty"><b>' + t('データ募集中','Collecting data') + '</b>'
        + t('現在 ','') + '<b style="display:inline;font-size:15px">' + (n || 0) + '</b>' + t(' 件。10件で実測の公開が始まります。',' submissions so far. Live stats unlock at 10.')
        + '<br>' + t('あなたの構成を投稿すると、同世代の中での位置と理論値との差がすぐに分かります。','Submit your build to see where you stand and how far you are from the theoretical best.')
        + '<br><a class="btn" href="' + submitHref + '">' + t('この世代の構成を投稿する','Submit a build for this generation') + '</a></div>';
    }
    if(!API){ empty(0); return; }
    getJSON('/v1/stats/' + gen).then(function(s){
      if(!s || !s.published){ empty(s && s.n); return; }
      var d = new Date(s.updatedAt * 1000);
      var html = '<p class="live-meta">' + t('有効サンプル ','Valid samples: ') + '<b>' + s.n + '</b>' + t(' 件 ／ 直近90日 ／ 更新 ',' · last 90 days · updated ') + d.toLocaleDateString(EN ? 'en-US' : 'ja-JP') + '</p>';
      html += liveBlock(s, gen, s.n < 30);
      var tiers = GM.TIER_ORDER.filter(function(k){ return s.byTier && s.byTier[k] && s.byTier[k].n >= 10 && s.byTier[k].slot; });
      if(tiers.length){
        html += '<h3 style="font-size:14px;margin:14px 0 6px">' + t('課金帯別の内訳','Breakdown by spending tier') + '</h3><div class="tier-tabs" data-group="live">';
        tiers.forEach(function(k){ html += '<button type="button" data-tier="' + k + '">' + esc(EN ? GM.TIERS[k].label_en : GM.TIERS[k].label) + ' (' + s.byTier[k].n + ')</button>'; });
        html += '</div>';
        tiers.forEach(function(k){ html += '<div class="tier-pane" data-group="live" data-tier="' + k + '">' + liveBlock(s.byTier[k], gen, s.byTier[k].n < 30) + '</div>'; });
      }
      html += '<p class="note" style="margin-top:10px">' + t('自己申告データの集計です。外れ値は四分位範囲で自動除外しています。',"Self-reported data. Outliers removed by IQR.") + ' <a href="' + (W.WOS_BASE||'') + '/stats/methodology.html">' + t('集計方法','Methodology') + '</a></p>';
      el.innerHTML = html;
      initTierTabs();
    }).catch(function(){
      /* API 未設定・障害時も理論パートは生きているので、実測は「準備中」として投稿導線だけ出す */
      el.innerHTML = '<div class="live-empty"><b>' + t('実測データは準備中です','Live stats are being prepared') + '</b>'
        + t('集計サーバーに接続できませんでした。理論最適構成はこのまま参照できます。','Could not reach the stats server. Theoretical builds above are unaffected.')
        + '<br><a class="btn" href="' + submitHref + '">' + t('この世代の構成を投稿する','Submit a build for this generation') + '</a></div>';
    });
  };

  /* ハブ・世代帯チップ用: 世代ごとの件数を埋める */
  S.renderSummary = function(){
    var targets = D.querySelectorAll('[data-gen-n]');
    if(!targets.length || !API) return;
    getJSON('/v1/stats/summary').then(function(s){
      targets.forEach(function(el){
        var g = el.getAttribute('data-gen-n'), v = s.gens && s.gens[g];
        if(!v) return;
        el.textContent = (v.n || 0) + (el.classList.contains('n') ? '' : t('件',''));
        if(v.published) el.classList.add('pub');
      });
      var tot = D.querySelector('[data-total-n]'); if(tot){ var sum = 0; Object.keys(s.gens||{}).forEach(function(g){ sum += s.gens[g].n || 0; }); tot.textContent = sum.toLocaleString(); }
    }).catch(function(){});
  };

  /* ---------- 投稿フォーム ---------- */
  var LS_KEY = 'wos_stats_submission';
  function loadSaved(){ try{ return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }catch(e){ return null; } }
  function save(o){ try{ localStorage.setItem(LS_KEY, JSON.stringify(o)); }catch(e){} }

  function tsScript(){
    if(!W.WOS_TURNSTILE_SITEKEY || D.getElementById('cf-ts')) return;
    var s = D.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.defer = true;
    D.head.appendChild(s);
  }
  function tsToken(root){
    if(!W.WOS_TURNSTILE_SITEKEY) return '';
    try{ var w = root.querySelector('.cf-turnstile'); return W.turnstile && w ? (W.turnstile.getResponse(w) || '') : ''; }catch(e){ return ''; }
  }

  /* container に投稿フォームを描画する。opts.prefill = {days,tier,inf,lan,mks,ratio,damage,fc,gear} */
  S.mountForm = function(container, opts){
    opts = opts || {}; var pre = opts.prefill || {}; var saved = loadSaved() || {};
    var q = new URLSearchParams(location.search);
    var initDays = pre.days != null ? pre.days : (saved.days != null ? saved.days : (q.get('gen') ? GM.UNLOCK[parseInt(q.get('gen'),10)] : ''));
    var initTier = pre.tier || saved.tier || '';
    tsScript();

    var html = ''
      + '<div class="step"><h3><span class="num">1</span>' + t('あなたのサーバー','Your server') + '</h3>'
      + '<p class="hint">' + t('サーバー開設からの経過日数を入れると世代を自動判定します。太陽城の殿堂の初代執政官の就任日や、目標「星々の火」の達成日から逆算できます。','Enter days since your server opened; the generation is detected automatically.') + '</p>'
      + '<div class="row"><div><label>' + t('サーバー経過日数','Days since server launch') + '</label><input type="number" id="st-days" min="0" max="5000" step="1" value="' + esc(initDays) + '" placeholder="' + t('例: 1200','e.g. 1200') + '"><span class="genview" id="st-genview"></span></div></div>'
      + '<label style="margin-top:10px">' + t('課金帯','Spending tier') + '</label><div class="tier-pick" id="st-tier">';
    GM.TIER_ORDER.forEach(function(k){
      var T = GM.TIERS[k];
      html += '<label' + (initTier === k ? ' class="on"' : '') + '><input type="radio" name="st-tier" value="' + k + '"' + (initTier === k ? ' checked' : '') + '>' + esc(EN ? T.label_en : T.label)
        + '<small>' + esc(k === 'f2p' ? t('ルーレット英雄が中心','Mostly roulette heroes') : k === 'mid' ? t('世代ごとに1体は追加で育成','One extra hero per generation') : t('全英雄カンスト','All heroes maxed')) + '</small></label>';
    });
    html += '</div></div>'
      + '<div class="step"><h3><span class="num">2</span>' + t('集結主の英雄（盾・槍・弓）','Rally-leader heroes (INF / LAN / MKS)') + '</h3>'
      + '<p class="hint">' + t('あなたの世代で実装済みの英雄だけが選べます。','Only heroes released for your generation are listed.') + '</p><div class="row">';
    CLS.forEach(function(c){ html += '<div><label>' + clsName(c) + '</label><select id="st-' + c + '"></select></div>'; });
    html += '</div></div>'
      + '<div class="step"><h3><span class="num">3</span>' + t('兵種比率（盾:槍:弓）','Troop ratio (INF:LAN:MKS)') + '</h3>'
      + '<div class="ratio-presets" id="st-presets"></div>'
      + '<div class="row"><div><label>' + clsName('inf') + ' %</label><input type="number" id="st-r0" min="0" max="100"></div><div><label>' + clsName('lan') + ' %</label><input type="number" id="st-r1" min="0" max="100"></div><div><label>' + clsName('mks') + ' %</label><input type="number" id="st-r2" min="0" max="100"></div></div>'
      + '<details class="details-opt"><summary>' + t('もっと詳しく（任意）','More details (optional)') + '</summary><div class="row" style="margin-top:8px">'
      + '<div><label>' + t('1ラリーの記録ダメージ','Damage per rally (measured)') + '</label><input type="number" id="st-damage" min="0" step="1000" placeholder="' + t('例: 38500000','e.g. 38500000') + '"></div>'
      + '<div><label>' + t('火晶（炉）レベル','Fire Crystal level') + '</label><input type="number" id="st-fc" min="0" max="20"></div>'
      + '</div><div class="row" style="margin-top:8px">';
    CLS.forEach(function(c, i){ html += '<div><label>' + clsName(c) + t(' 専用装備Lv',' gear Lv') + '</label><input type="number" id="st-g' + i + '" min="0" max="10"></div>'; });
    html += '</div></details></div>'
      + '<label class="consent"><input type="checkbox" id="st-consent"><span>' + t('入力内容を匿名の統計データとして送信し、当サイトで集計・公開することに同意します。個人を特定する情報は送信されません。','I agree to submit this build as anonymous statistics to be aggregated and published on this site. No personally identifying information is sent.') + ' <a href="' + (W.WOS_BASE||'') + '/privacy.html" target="_blank" rel="noopener">' + t('プライバシーポリシー','Privacy policy') + '</a></span></label>'
      + (W.WOS_TURNSTILE_SITEKEY ? '<div class="cf-turnstile" data-sitekey="' + esc(W.WOS_TURNSTILE_SITEKEY) + '" data-size="flexible" style="margin:8px 0"></div>' : '')
      + '<button type="button" class="submit-btn" id="st-submit" disabled>' + t('統計に投稿する','Submit to stats') + '</button>'
      + (saved.editKey ? '<p class="note" style="margin-top:6px">' + t('前回の投稿を上書き更新します。','This will update your previous submission.') + ' <a href="#" id="st-forget">' + t('新規として投稿する','Submit as new') + '</a></p>' : '')
      + '<div class="err" id="st-err"></div><div id="st-result"></div>';
    container.innerHTML = html;

    var $ = function(id){ return container.querySelector('#' + id); };
    var days = $('st-days'), genview = $('st-genview'), sel = { inf:$('st-inf'), lan:$('st-lan'), mks:$('st-mks') };
    var r = [$('st-r0'), $('st-r1'), $('st-r2')], consent = $('st-consent'), btn = $('st-submit'), err = $('st-err'), res = $('st-result');
    var editKey = saved.editKey || null, submissionId = saved.id || null;
    var forget = $('st-forget'); if(forget) forget.onclick = function(e){ e.preventDefault(); editKey = null; submissionId = null; forget.parentNode.remove(); };

    function curGen(){ var d = parseInt(days.value, 10); return isFinite(d) && d >= 0 ? GM.genFromDays(d) : null; }
    function tier(){ var el = container.querySelector('input[name="st-tier"]:checked'); return el ? el.value : null; }
    function fillHeroes(){
      var g = curGen();
      genview.textContent = g ? (EN ? 'Gen ' + g : '第' + g + '世代') : '';
      CLS.forEach(function(c){
        var cur = sel[c].value || pre[c] || saved[c] || '';
        var list = H.filter(function(h){ return h.cls === c && (g == null || h.gen <= g); }).sort(function(a,b){ return b.gen - a.gen || (a.rar === 'SSR' ? -1 : 1); });
        sel[c].innerHTML = '<option value="">' + t('— 選択 —','— select —') + '</option>' + list.map(function(h){
          return '<option value="' + h.id + '"' + (h.id === cur ? ' selected' : '') + '>' + esc(heroName(h.id)) + ' (' + genLabel(h.gen) + (h.rar !== 'SSR' ? ' ' + h.rar : '') + ')</option>';
        }).join('');
      });
      validate();
    }
    var PRESETS = [[1,4,95],[5,5,90],[10,10,80],[10,30,60],[20,20,60]];
    var pres = $('st-presets');
    pres.innerHTML = PRESETS.map(function(p){ return '<button type="button" data-r="' + p.join(',') + '">' + p.join(':') + '</button>'; }).join('');
    pres.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ var p = b.getAttribute('data-r').split(','); r.forEach(function(el, i){ el.value = p[i]; }); markPreset(); validate(); }; });
    function markPreset(){ var v = r.map(function(el){ return el.value; }).join(','); pres.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-r') === v); }); }
    var initRatio = pre.ratio || saved.ratio || [1,4,95]; r.forEach(function(el, i){ el.value = initRatio[i]; }); markPreset();
    if(pre.damage != null) $('st-damage').value = pre.damage; else if(saved.damage != null) $('st-damage').value = saved.damage;
    if(pre.fc != null) $('st-fc').value = pre.fc; else if(saved.fc != null) $('st-fc').value = saved.fc;
    (pre.gear || saved.gear || []).forEach(function(v, i){ if(v != null && $('st-g' + i)) $('st-g' + i).value = v; });

    function validate(){
      var ok = curGen() != null && tier() && CLS.every(function(c){ return sel[c].value; });
      var rs = r.map(function(el){ return parseInt(el.value, 10); });
      if(rs.some(function(v){ return !isFinite(v) || v < 0; }) || rs[0] + rs[1] + rs[2] !== 100) ok = false;
      ok = ok && consent.checked;
      btn.disabled = !ok; return ok;
    }
    days.addEventListener('input', fillHeroes);
    container.querySelectorAll('input[name="st-tier"]').forEach(function(el){ el.addEventListener('change', function(){ container.querySelectorAll('.tier-pick label').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); }); validate(); }); });
    CLS.forEach(function(c){ sel[c].addEventListener('change', validate); });
    r.forEach(function(el){ el.addEventListener('input', function(){ markPreset(); validate(); }); });
    consent.addEventListener('change', validate);
    fillHeroes();

    btn.addEventListener('click', function(){
      if(!validate()) return;
      err.textContent = ''; btn.disabled = true; btn.textContent = t('送信中…','Sending…');
      var body = { days: parseInt(days.value, 10), tier: tier(), inf: sel.inf.value, lan: sel.lan.value, mks: sel.mks.value,
        ratio: r.map(function(el){ return parseInt(el.value, 10); }),
        damage: $('st-damage').value || null, fc: $('st-fc').value || null,
        gear: [0,1,2].map(function(i){ return $('st-g' + i).value || null; }),
        editKey: editKey, turnstile: tsToken(container) };
      if(!API){ err.textContent = t('投稿先が設定されていません。','Submission endpoint is not configured.'); btn.disabled = false; btn.textContent = t('統計に投稿する','Submit to stats'); return; }
      fetch(API + '/v1/submit', { method:'POST', mode:'cors', credentials:'omit', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) })
        .then(function(x){ return x.json().then(function(j){ return { ok: x.ok, j: j }; }); })
        .then(function(o){
          btn.textContent = t('統計に投稿する','Submit to stats'); btn.disabled = false;
          if(!o.ok || !o.j.ok){
            var m = o.j && o.j.error;
            err.textContent = m === 'turnstile' ? t('人間確認に失敗しました。ページを再読み込みしてください。','Verification failed. Please reload.')
              : m === 'invalid' ? t('入力内容に問題があります: ','Invalid input: ') + (o.j.fields || []).join(', ')
              : t('送信に失敗しました。','Submission failed.');
            try{ if(W.turnstile) W.turnstile.reset(); }catch(e){}
            return;
          }
          editKey = o.j.editKey; submissionId = o.j.id;
          save({ id: submissionId, editKey: editKey, days: body.days, tier: body.tier, inf: body.inf, lan: body.lan, mks: body.mks, ratio: body.ratio, damage: body.damage, fc: body.fc, gear: body.gear });
          res.innerHTML = resultCard(o.j.diag, body);
          relabelHeroes(res);
          if(W.WOS_TRACK) W.WOS_TRACK('stats_submit', { gen: o.j.diag.gen, tier: body.tier });
          res.scrollIntoView({ behavior:'smooth', block:'start' });
          if(opts.onSubmitted) opts.onSubmitted(o.j);
        })
        .catch(function(){ btn.disabled = false; btn.textContent = t('統計に投稿する','Submit to stats'); err.textContent = t('通信エラーです。時間をおいて再度お試しください。','Network error. Please try again later.'); });
    });
  };

  function resultCard(d, body){
    var base = (W.WOS_BASE || '');
    var html = '<div class="result-card"><h3>' + t('投稿ありがとうございます！','Thanks for submitting!') + ' ' + (EN ? 'Gen ' + d.gen : '第' + d.gen + '世代') + ' / ' + esc(EN ? GM.TIERS[d.tier].label_en : GM.TIERS[d.tier].label) + '</h3><div class="kv">';
    if(d.rank) html += '<div><b>' + t('同世代内の順位','Rank in generation') + '</b><span class="big">' + t('上位','Top ') + d.rank.pct + '%</span>' + t('（','(') + d.rank.n + t('件中）',' samples)') + '</div>';
    else html += '<div><b>' + t('同世代内の順位','Rank in generation') + '</b>' + t('ダメージ入力があると、同世代内の順位が出ます（5件以上で算出）。','Enter damage to see your rank (needs 5+ samples).') + '</div>';
    html += '<div><b>' + t('世代ラグ（何世代前の英雄か）','Generation lag per slot') + '</b>' + clsName('inf') + ' ' + d.lag.inf + ' / ' + clsName('lan') + ' ' + d.lag.lan + ' / ' + clsName('mks') + ' ' + d.lag.mks + '</div>';
    html += '</div>';
    if(d.theory){
      html += '<p class="swap"><b>' + t('あなたの課金帯の理論最適：','Theoretical best for your tier: ') + '</b>' + heroHtml(d.theory.ids[0], true) + ' ' + heroHtml(d.theory.ids[1], true) + ' ' + heroHtml(d.theory.ids[2], true) + '</p>';
      html += d.theory.swap.length
        ? '<p class="swap">' + t('乗り換え候補の枠：','Slots to consider swapping: ') + d.theory.swap.map(function(c){ return '<span class="slot-tag" style="display:inline-block;padding:2px 9px;border-radius:999px;background:var(--grad);color:#fff;font-size:11.5px;font-weight:700">' + clsName(c) + '</span>'; }).join(' ') + '</p>'
        : '<p class="swap">🎯 ' + t('理論最適構成と一致しています。','Your build matches the theoretical best.') + '</p>';
    }
    html += '<p class="note">' + t('投稿はこのブラウザに紐づいて保存され、次回は上書き更新になります。削除したい場合は ','Your submission is linked to this browser; next time it will be updated. To delete it, ') + '<a href="' + base + '/contact.html">' + t('お問い合わせ','contact us') + '</a>' + t(' から編集キー先頭6桁をお知らせください。',' with the first 6 characters of your edit key.') + '</p>';
    html += '<p><a class="btn" href="' + base + '/stats/gen-' + String(d.gen).padStart(2,'0') + '/index.html">' + t('この世代の統計を見る','See stats for this generation') + '</a></p></div>';
    return html;
  }

  /* ---------- 起動 ---------- */
  function boot(){
    relabelHeroes();
    initTierTabs();
    var live = D.getElementById('live'); if(live) S.renderLive(parseInt(live.getAttribute('data-gen'), 10), live);
    S.renderSummary();
    var form = D.getElementById('submit-form'); if(form) S.mountForm(form, {});
  }
  if(D.readyState !== 'loading') boot(); else D.addEventListener('DOMContentLoaded', boot);
})();
