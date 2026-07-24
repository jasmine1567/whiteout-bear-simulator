/* ===== 本番サイト確定情報(ここを正とする) ===== */
window.SITE = {
  name_ja: "ホワサバ ツールラボ",
  name_en: "Whiteout Tools Lab",
  url: "https://whitesim-lab.com",
  x: "https://x.com/tegetege_m",
  xHandle: "@tegetege_m",
  owner: "じゃすみん",
  ofuse: "https://ofuse.me/0ce02c0c",
  form: "https://docs.google.com/forms/d/e/1FAIpQLSfgqgKKPsBBryezhwaJPBCPCqVBcZZnV48lk-xHru0bTspeKg/viewform",
  hashtags: "ホワサバ,ホワイトアウトサバイバル"
};
/* ===== 言語管理(URLパスで確定: /en/ 配下=英語、それ以外=日本語) =====
   各言語は独立したURL(日本語=/ , 英語=/en/)で配信する。
   言語はパスだけで決まり、localStorage/クエリには依存しない(canonical と常に一致)。 */
window.WOS_BASE = (/^\/en(\/|$)/.test(location.pathname)) ? '/en' : '';
window.WOS_LANG = (window.WOS_BASE === '/en') ? 'en' : 'ja';
/* 言語トグル: 現在ページの対応言語URLへ遷移する */
window.WOS_setLang = function(l){
  var p = location.pathname || '/';
  var isEn = /^\/en(\/|$)/.test(p);
  var target;
  if(l === 'en'){ target = isEn ? p : ('/en' + (p === '/' ? '/' : p)); }
  else { target = isEn ? (p.replace(/^\/en/, '') || '/') : p; }
  if(!target) target = '/';
  location.href = target + location.hash;
};
/* t(ja, en): 現在の言語の文字列を返す簡易ヘルパー */
window.t = function(ja, en){ return window.WOS_LANG==='en' ? (en!==undefined?en:ja) : ja; };

/* ===== アフィリエイト導線(信頼を損ねない設置) =====
   提携承認後、各 url を「あなたのアフィリエイトURL」に置き換えてください。
   REPLACE_ で始まる間はそのリンクは表示されません(誤公開防止)。
   不要にする場合は enabled:false。 */
window.WOS_AFFILIATE = {
  enabled: true,
  vendors: {
    lootbar: { url: "REPLACE_WITH_LOOTBAR_AFFILIATE_URL" }, /* 本命: WoS直接トップアップ(最大10%/日本は www.lootbar.com/ja/top-up/whiteout-survival) */
    eneba: { url: "REPLACE_WITH_ENEBA_AFFILIATE_URL" }      /* 併載: 公式ギフトカード(地域非依存)。クリーンな“ログイン不要”重視ならSEAGMに差し替え可 */
  }
};
(function(){
  var A = window.WOS_AFFILIATE; if(!A) return;
  function ok(u){ return !!u && u.indexOf('REPLACE_') !== 0; }
  /* クリック計測(GAイベント: affiliate_click) */
  document.addEventListener('click', function(e){
    var el = e.target; if(el && el.nodeType === 3) el = el.parentElement;
    var a = el && el.closest && el.closest('a[data-aff]'); if(!a) return;
    try{ if(window.gtag) gtag('event','affiliate_click',{vendor:a.getAttribute('data-aff'),page:location.pathname}); }catch(_){}
  }, true);
  function injectCss(){
    if(document.getElementById('wos-aff-css')) return;
    var s=document.createElement('style'); s.id='wos-aff-css';
    s.textContent='.wos-aff{margin:14px 0;padding:13px 15px;border:1px solid #e5e7f2;border-radius:12px;'
      +'background:linear-gradient(180deg,#f7f6ff,#fbfaff);box-shadow:0 1px 3px rgba(28,34,80,.05)}'
      +'.wos-aff-h{display:flex;align-items:center;gap:8px;margin-bottom:9px;color:#1d2233;font-weight:700;font-size:12.5px}'
      +'.wos-aff-pr{font-size:10px;font-weight:800;letter-spacing:.08em;color:#fff;background:#6b7385;border-radius:4px;padding:1px 6px}'
      +'.wos-aff-body{display:flex;flex-wrap:wrap;gap:9px;align-items:center}'
      +'.wos-aff-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:9px;background:#ff7a2f;color:#fff;font-weight:800;text-decoration:none;font-size:13.5px}'
      +'.wos-aff-btn:hover{background:#f2620a}'
      +'.wos-aff-disc{font-size:11px;font-weight:700;background:rgba(255,255,255,.22);border-radius:5px;padding:2px 7px}'
      +'.wos-aff-alt{color:#e85d12;text-decoration:underline;font-size:12px}'
      +'.wos-aff-note{margin:9px 0 0;color:#6b7385;font-size:10.5px;line-height:1.55}';
    document.head.appendChild(s);
  }
  window.WOS_affiliateHTML = function(){
    if(!A.enabled) return '';
    var v=A.vendors||{}, t=window.t||function(a){return a;};
    var primary = ok(v.lootbar && v.lootbar.url), alt = ok(v.eneba && v.eneba.url);
    if(!primary && !alt) return '';
    var h='<aside class="wos-aff" aria-label="'+t('広告','Ad')+'">'
      +'<div class="wos-aff-h"><span class="wos-aff-pr">PR</span><span>'+t('強化を早く進めたいなら','Want to upgrade faster?')+'</span></div>'
      +'<div class="wos-aff-body">';
    if(primary) h+='<a class="wos-aff-btn" data-aff="lootbar" target="_blank" rel="sponsored noopener nofollow" href="'+v.lootbar.url+'">'
      +t('LootBar で割引トップアップ','Top up cheaper on LootBar')
      +'<span class="wos-aff-disc">'+t('公式より約15〜30%お得','~15-30% off')+'</span></a>';
    if(alt) h+='<a class="wos-aff-alt" data-aff="eneba" target="_blank" rel="sponsored noopener nofollow" href="'+v.eneba.url+'">'
      +t('ギフトカード派はこちら(Eneba)','Prefer gift cards? (Eneba)')+'</a>';
    h+='</div><p class="wos-aff-note">'
      +t('※ 広告(アフィリエイト)リンクです。リンク先での購入で当サイトに紹介料が入る場合があります。LootBarは自己受取(Self-TopUp)方式で、自分でログインしてパックを受け取り、ログアウト時にセッション情報は削除されます(スタッフにパスワードは渡しません)。Enebaは公式ストアのギフトカードです。第三者サービスを含むため、安全性はご自身でもご確認ください。',
         '* Affiliate ad links. We may earn a commission on qualifying purchases. LootBar uses a Self-TopUp flow (you log in yourself, redeem the pack, and the session is cleared on logout — no password is shared with staff). Eneba sells official-store gift cards. Some are third-party services, so verify safety yourself.')
      +'</p></aside>';
    return h;
  };
  window.WOS_mountAffiliate = function(refNode, where){
    try{
      var html=window.WOS_affiliateHTML(); if(!html || !refNode) return;
      injectCss();
      var wrap=document.createElement('div'); wrap.innerHTML=html; var card=wrap.firstChild;
      if(where==='before') refNode.parentNode.insertBefore(card, refNode);
      else if(where==='append') refNode.appendChild(card);
      else refNode.parentNode.insertBefore(card, refNode.nextSibling);
    }catch(_){}
  };
})();

/* ===== 応援(OFUSE)導線 =====================================================
   設計方針:
   - 広告(オレンジ/PRバッジ)とは色も語り口も明確に分ける。ティール系・PRバッジなし。
   - 「投げ銭してください」ではなく「感想・応援メッセージが届くと嬉しい」を主役に。
     OFUSEはファンレター(メッセージ)を送れるサービスなので、無料の気持ちも受け取れる。
   - 金額表示・ポップアップ・追従バナーはしない(銭ゲバ感の正体)。
   - 出す場所:
       1) 各ツールの「結果が出た直後」= 役に立った実感がある瞬間 → インラインカード(主役)
       2) 記事/ページ末尾のフッター前 → 常設カード(控えめ)
   - 各ツールのJSには触れず、このファイルだけで完結させる(結果の出現をObserverで検出)。
   - 不要にする場合は enabled:false。
   ========================================================================= */
window.WOS_SUPPORT = { enabled: true };
(function(){
  var S = window.WOS_SUPPORT; if(!S) return;
  function url(){ return (window.SITE && window.SITE.ofuse) || ''; }
  function ok(){ return !!(S.enabled && url()); }

  /* クリック計測(GAイベント: support_click) */
  document.addEventListener('click', function(e){
    var el = e.target; if(el && el.nodeType === 3) el = el.parentElement;
    var a = el && el.closest && el.closest('a[data-support]'); if(!a) return;
    try{ if(window.gtag) gtag('event','support_click',{placement:a.getAttribute('data-support'),page:location.pathname}); }catch(_){}
  }, true);

  function injectCss(){
    if(document.getElementById('wos-sup-css')) return;
    var s=document.createElement('style'); s.id='wos-sup-css';
    s.textContent=
      /* --- 共通ボタン --- */
      '.wos-sup-btn{display:inline-flex;align-items:center;gap:7px;padding:11px 20px;border-radius:999px;'
      +'background:linear-gradient(135deg,#6fd6cf,#0fa8a0);color:#fff;font-weight:800;text-decoration:none;'
      +'font-size:13.5px;letter-spacing:.02em;box-shadow:0 3px 10px rgba(15,168,160,.3);'
      +'transition:transform .1s,box-shadow .15s;white-space:nowrap}'
      +'.wos-sup-btn:hover{box-shadow:0 5px 16px rgba(15,168,160,.44)}'
      +'.wos-sup-btn:active{transform:scale(.97)}'

      /* --- 1) 結果直後のインラインカード(主役。少ししっかり見せる) --- */
      +'.wos-sup-inline{margin:16px 0 4px;padding:15px 17px;border:1px solid #cfe9e6;border-radius:14px;'
      +'background:linear-gradient(180deg,#f3fbfa,#eaf7f6);box-shadow:0 2px 10px rgba(15,168,160,.08);'
      +'display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px}'
      +'.wos-sup-inline .txt{flex:1 1 240px;min-width:0}'
      +'.wos-sup-inline .ttl{display:block;font-size:13.5px;font-weight:800;color:#0d7d77;margin-bottom:4px}'
      +'.wos-sup-inline p{margin:0;font-size:12.5px;line-height:1.75;color:#4a5a63}'
      +'.wos-sup-inline .free{display:block;margin-top:6px;font-size:11px;color:#5f8b88}'

      /* --- 2) フッター前カード(常設。控えめ) --- */
      +'.wos-sup{margin:16px 0;padding:15px 17px;border:1px solid #dfeceb;border-radius:14px;'
      +'background:linear-gradient(180deg,#f7fdfc,#f2faf9)}'
      +'.wos-sup-h{display:flex;align-items:center;gap:8px;margin-bottom:7px;color:#1d2233;font-weight:800;font-size:13.5px}'
      +'.wos-sup-h .ic{font-size:15px}'
      +'.wos-sup p{margin:0 0 11px;color:#5b6276;font-size:12.5px;line-height:1.8}'
      +'.wos-sup-body{display:flex;flex-wrap:wrap;gap:10px 13px;align-items:center}'
      +'.wos-sup-free{color:#0d7d77;font-size:11.5px;font-weight:700}'

      +'@media(max-width:520px){.wos-sup-btn{width:100%;justify-content:center}}'
      +'@media (prefers-reduced-motion: no-preference){'
      +'.wos-sup-inline{animation:wosSupIn .35s ease}'
      +'@keyframes wosSupIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}}';
    document.head.appendChild(s);
  }

  /* 1) 結果直後カード */
  window.WOS_supportInlineHTML = function(){
    if(!ok()) return '';
    var t = window.t || function(a){ return a; };
    return '<aside class="wos-sup-inline">'
      +'<div class="txt">'
      +'<span class="ttl">'+t('お役に立てましたか？😊','Did it help? 😊')+'</span>'
      +'<p>'+t('作者のじゃすみんです。「助かった！」のひとことをもらえると、飛び上がって喜びます。次のツールを作る元気になります！',
              'Hi, I\'m Jasmine, the creator! Even a quick "thanks!" makes my day — and fuels the next tool.')+'</p>'
      +'<span class="free">'+t('※ 無料のメッセージだけでも本当にうれしいです','* A free message alone genuinely makes me happy')+'</span>'
      +'</div>'
      +'<a class="wos-sup-btn" data-support="result" target="_blank" rel="noopener" href="'+url()+'">'
      +'💬 '+t('ひとこと送る','Say hi')+'</a></aside>';
  };

  /* 2) フッター前カード */
  window.WOS_supportHTML = function(){
    if(!ok()) return '';
    var t = window.t || function(a){ return a; };
    return '<aside class="wos-sup">'
      +'<div class="wos-sup-h"><span class="ic">👋</span><span>'
      +t('作った人より','From the creator')+'</span></div>'
      +'<p>'+t('こんにちは、じゃすみんです！このサイトは、1567サーバーでホワサバを遊びながらコツコツひとりで作っています。'
             +'ツールも記事もぜんぶ無料。「使ってるよ！」のひとことが届くと、本当にうれしくて次のツールがはかどります。よかったら気軽にどうぞ！',
              'Hi, I\'m Jasmine! I build this site solo while playing WoS on server 1567. '
             +'Everything here is free — and a quick "I use this!" honestly makes my day and speeds up the next tool. Feel free to drop by!')+'</p>'
      +'<div class="wos-sup-body">'
      +'<a class="wos-sup-btn" data-support="footer" target="_blank" rel="noopener" href="'+url()+'">'
      +'💬 '+t('応援メッセージを送る','Send a message')+'</a>'
      +'<span class="wos-sup-free">'+t('メッセージだけでも大歓迎！','Messages alone are more than welcome!')+'</span>'
      +'</div></aside>';
  };

  /* 汎用マウンタ */
  function mount(html, refNode, where){
    try{
      if(!html || !refNode) return null;
      injectCss();
      var wrap=document.createElement('div'); wrap.innerHTML=html; var card=wrap.firstChild;
      if(where==='before') refNode.parentNode.insertBefore(card, refNode);
      else if(where==='append') refNode.appendChild(card);
      else refNode.parentNode.insertBefore(card, refNode.nextSibling); /* after */
      return card;
    }catch(_){ return null; }
  }
  window.WOS_mountSupport = function(refNode, where){ mount(window.WOS_supportHTML(), refNode, where); };

  /* 結果直後カードは1ページに1つだけ */
  window.WOS_mountSupportInline = function(refNode, where){
    try{
      if(!ok() || !refNode) return;
      if(document.querySelector('.wos-sup-inline')) return; /* 二重表示防止 */
      mount(window.WOS_supportInlineHTML(), refNode, where || 'after');
    }catch(_){}
  };

  /* =====================================================================
     結果表示の自動検出（各ツールのJSに触らずに差し込む）
     sel   : 結果アンカー要素のセレクタ(この直後に差し込む)
     ready : その要素が「結果として表示された」と判定する関数
     ===================================================================== */
  /* =====================================================================
     結果表示の自動検出（各ツールのJSには触らない）

     重要: left-hero / troop-ratio / bear-hunt などは「リアルタイム計算型」で、
     ページを開いた時点から既定値の結果が表示されている。damage-doctor は
     結果欄にプレースホルダ文が入っている。そのため「結果要素が見えている」
     だけを条件にすると、ユーザーが何もしていないのにカードが出てしまう。

     そこで条件を2つにする:
       (1) ユーザーが実際にツールを操作した (click / change / input)
       (2) 結果要素が表示され、中身がある
     さらに操作から少し待ってから出す(結果を読む時間を与える)。
     ===================================================================== */
  var visible = function(el){
    if(!el) return false;
    if(el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    return el.getBoundingClientRect().height > 0;
  };
  var hasText = function(el){ return !!el && el.textContent.replace(/\s/g,'').length > 0; };

  var RULES = [
    /* 霜竜は app.js 側で「全入れ物がボーダー達成した時だけ」差し込む(未達時は出さない)
       のでここでは扱わない。 */

    /* ダメージ診断: 全問回答すると #result に診断結果が入る。
       初期はプレースホルダ文が入っているので、文章が伸びたことを条件にする。 */
    { path:'/tools/damage-doctor/', sel:'#result', needInteract:true, minTextLen:60,
      ready:function(){ var r=document.getElementById('result');
        return visible(r) && r.textContent.replace(/\s/g,'').length >= 60; } },

    /* 左英雄チェッカー: リアルタイム型。操作後に結果が出ていればOK */
    { path:'/tools/left-hero/', sel:'#result', needInteract:true,
      ready:function(){ var r=document.getElementById('result'); return visible(r) && hasText(r); } },

    /* 兵士比率: リアルタイム型。操作後に判定が出ていればOK */
    { path:'/tools/troop-ratio/', sel:'#verdict', needInteract:true,
      ready:function(){ var r=document.getElementById('verdict'); return visible(r) && hasText(r); } },

    /* 指揮官診断: 診断完了で #retry(もう一度)が現れる。これは結果画面の確実な印。 */
    { path:'/tools/commander-type/', sel:'#retry', needInteract:false,
      ready:function(){ return visible(document.getElementById('retry')); } },

    /* 兵器工場戦: 模擬戦を走らせるとスコアバーに結果が出る */
    { path:'/tools/foundry-battle/', sel:'#scorebar', needInteract:true,
      ready:function(){ var r=document.getElementById('scorebar'); return visible(r) && hasText(r); } },

    /* 熊狩シミュレーター: リアルタイム型で「結果の瞬間」がない。
       操作した上で、ダメージ表示を実際に見た(画面内に入った)ときに、
       結果パネル(.result)全体の直後へ置く。パネル内部に割り込ませない。 */
    { path:'/tools/bear-hunt/', sel:'#totalDmg', anchorUp:'.result',
      needInteract:true, scrollIn:'#totalDmg',
      ready:function(){ var r=document.querySelector('#totalDmg'); return visible(r) && hasText(r); } }
  ];

  function ruleForPage(){
    var p = location.pathname;
    for(var i=0;i<RULES.length;i++){
      if(p.indexOf(RULES[i].path) !== -1) return RULES[i];
    }
    return null;
  }

  function autoHookResult(){
    if(!ok()) return;
    var rule = ruleForPage(); if(!rule) return;

    var interacted = !rule.needInteract; /* 操作不要なルールは最初から満たす */
    var seen = !rule.scrollIn;           /* スクロール条件がなければ最初から満たす */
    var done = false;
    var obs = null, io = null;

    /* ユーザーがツールを操作したか(ページ内の入力/クリック) */
    if(rule.needInteract){
      var markInteracted = function(e){
        /* 支援カード自身のクリックや、ナビ/フッターのリンクは操作とみなさない */
        var el = e.target; if(el && el.nodeType === 3) el = el.parentElement;
        if(el && el.closest && (el.closest('.wos-sup-inline') || el.closest('#nav') || el.closest('#foot'))) return;
        interacted = true;
        setTimeout(tryMount, 400); /* 結果を読む間をおいて */
      };
      document.addEventListener('click', markInteracted, true);
      document.addEventListener('change', markInteracted, true);
      document.addEventListener('input', markInteracted, true);
    }

    /* 結果を実際に見た(画面内に入った)か */
    if(rule.scrollIn && 'IntersectionObserver' in window){
      var target = document.querySelector(rule.scrollIn);
      if(target){
        io = new IntersectionObserver(function(es){
          for(var i=0;i<es.length;i++){
            if(es[i].isIntersecting){ seen = true; tryMount(); }
          }
        }, { threshold:0.5 });
        io.observe(target);
      } else { seen = true; }
    }

    /* 差し込むアンカー(結果要素、または指定があればその祖先ブロックの直後) */
    function anchorEl(){
      var a = document.querySelector(rule.sel);
      if(a && rule.anchorUp){
        var up = a.closest(rule.anchorUp);
        if(up) return up;
      }
      return a;
    }

    function tryMount(){
      if(done) return;
      if(!interacted || !seen) return;
      if(rule.ready && !rule.ready()) return;
      var a = anchorEl(); if(!a) return;
      done = true;
      window.WOS_mountSupportInline(a, 'after');
      if(obs) obs.disconnect();
      if(io) io.disconnect();
    }

    /* 結果要素の変化を監視(操作後に結果が更新されるのを待つ) */
    if('MutationObserver' in window){
      obs = new MutationObserver(function(){ if(interacted && seen) tryMount(); });
      obs.observe(document.body, { childList:true, subtree:true, characterData:true,
        attributes:true, attributeFilter:['style','class','hidden'] });
    }
  }

  /* 全ページ共通: 常設カード
     品質ルール:
     - お願いは1ページ1回まで。結果後インラインが出るツールページには常設カードを出さない。
     - 規約/プライバシー/問い合わせ(法務系)には出さない。
     - カードは本文と同じコンテナ(.wrap)内に置き、レイアウトの箱を揃える。 */
  function autoMountFooter(){
    try{
      if(!ok()) return;
      if(document.querySelector('.wos-sup')) return;

      var path = location.pathname;
      /* 法務系ページには出さない */
      if(/\/(privacy|terms|contact)\.html$/.test(path)) return;
      /* 結果後インラインを持つツールページには出さない(お願いは1回まで) */
      if(ruleForPage()) return;
      if(path.indexOf('/tools/frost-dragon/') !== -1) return;

      var card = null;
      var wrap = document.querySelector('div.wrap');
      if(wrap){
        card = mount(window.WOS_supportHTML(), wrap, 'append'); /* 本文と同じ幅に収める */
      }else{
        var foot = document.getElementById('foot') || document.querySelector('footer.sitefoot');
        if(foot) card = mount(window.WOS_supportHTML(), foot, 'before');
      }
    }catch(_){}
  }

  function init(){ autoMountFooter(); autoHookResult(); }
  if(document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
