/* 共通UIヘルパー(JP/EN対応) 全ツール・記事で使用。config.js を先に読むこと */
(function(){
  var L = window.WOS_LANG || 'ja';
  var EN = L==='en';
  var SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="ic-paw" viewBox="0 0 24 24"><g fill="currentColor"><ellipse cx="12" cy="16" rx="6.5" ry="5.2"></ellipse><circle cx="5" cy="10.5" r="2.5"></circle><circle cx="19" cy="10.5" r="2.5"></circle><circle cx="8.7" cy="6" r="2.2"></circle><circle cx="15.3" cy="6" r="2.2"></circle></g></symbol><symbol id="ic-shield" viewBox="0 0 24 24"><path d="M12 3l7 2.6v5.2c0 4.3-2.9 7.4-7 8.6-4.1-1.2-7-4.3-7-8.6V5.6L12 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></symbol><symbol id="ic-spear" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L18 6"></path><path d="M18 6l-4 .3M18 6l-.3 4"></path><path d="M4.5 19.5l1.6-1.6"></path></g></symbol><symbol id="ic-bow" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4a9 9 0 000 16"></path><path d="M7 4v16"></path><path d="M4 12h15"></path><path d="M19 12l-3-2.2M19 12l-3 2.2"></path></g></symbol><symbol id="ic-share" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.4"></circle><circle cx="17.5" cy="6" r="2.4"></circle><circle cx="17.5" cy="18" r="2.4"></circle><path d="M8.1 10.9l7.3-3.8M8.1 13.1l7.3 3.8"></path></g></symbol><symbol id="ic-help" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.4 9.2a2.7 2.7 0 015.2 1c0 1.8-2.6 2.2-2.6 4"></path><path d="M12 17.4h.01"></path></g></symbol><symbol id="ic-target" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.6"></circle><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"></circle></g></symbol><symbol id="ic-bolt" viewBox="0 0 24 24"><path d="M13 2.5L5.5 13H11l-1.5 8.5L18.5 10H12.5L13 2.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></symbol><symbol id="ic-chart" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h16"></path><path d="M7 15l3.5-3.8 2.8 2.4L20 7"></path><path d="M20 7h-3.4M20 7v3.4"></path></g></symbol><symbol id="ic-bookmark" viewBox="0 0 24 24"><path d="M6.5 4.5h11v15l-5.5-3.4-5.5 3.4v-15z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></symbol><symbol id="ic-image" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="2.5"></rect><circle cx="9" cy="10" r="1.6"></circle><path d="M5 18l4.5-4.5 3 2.6L16 12l3.5 3.6"></path></g></symbol><symbol id="ic-link" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10 13.5a3.5 3.5 0 005 .2l2.7-2.7a3.5 3.5 0 00-5-5l-1.4 1.4"></path><path d="M14 10.5a3.5 3.5 0 00-5-.2L6.3 13a3.5 3.5 0 005 5l1.4-1.4"></path></g></symbol><symbol id="ic-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path></symbol><symbol id="ic-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path></symbol><symbol id="ic-camera" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 8h3l1.4-2h7.2L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"></path><circle cx="12" cy="13" r="3.2"></circle></g></symbol><symbol id="ic-compare" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"></path><path d="M7 8L4 11l3 3"></path><path d="M17 8l3 3-3 3"></path><path d="M4 11h5M15 11h5"></path></g></symbol><symbol id="ic-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></symbol></defs></svg>';
  var NAV = EN ? {
    brand:"🐻 Whiteout Tools Lab", home:"Home", sim:"Bear Sim", left:"Left-Hero",
    ratio:"Troop Ratio", doctor:"Damage Doctor", castle:"Castle Battle", foundry:"Foundry", cmd:"Commander", guide:"Guides"
  } : {
    brand:"🐻 ホワサバ ツールラボ", home:"ホーム", sim:"熊狩シミュ", left:"左英雄チェッカー",
    ratio:"兵士比率", doctor:"ダメージ診断", castle:"王城戦", foundry:"兵器工場戦", cmd:"指揮官診断", guide:"攻略ガイド"
  };
  function langLink(){
    return EN
      ? '<a id="langtgl" href="#" onclick="WOS_setLang(\'ja\');return false" style="margin-left:auto;color:var(--ember)">日本語</a>'
      : '<a id="langtgl" href="#" onclick="WOS_setLang(\'en\');return false" style="margin-left:auto;color:var(--ember)">English</a>';
  }
  window.WOS_NAV = function(depth){
    var d='../'.repeat(depth);
    return SPRITE+'<nav class="sitenav"><div class="in">'
      +'<a class="brand" href="'+d+'index.html">'+NAV.brand.replace(/^🐻\s*/,'<span class="logo"><svg class="ic"><use href="#ic-paw"></use></svg></span> ')+'</a>'
      +'<a href="'+d+'tools/bear-hunt/index.html">'+NAV.sim+'</a>'
      +'<a href="'+d+'tools/left-hero/index.html">'+NAV.left+'</a>'
      +'<a href="'+d+'tools/troop-ratio/index.html">'+NAV.ratio+'</a>'
      +'<a href="'+d+'tools/damage-doctor/index.html">'+NAV.doctor+'</a>'
      +'<a href="'+d+'tools/king-castle/index.html">'+NAV.castle+'</a>'
      +'<a href="'+d+'tools/foundry-battle/index.html">'+NAV.foundry+'</a>'
      +'<a href="'+d+'tools/commander-type/index.html">'+NAV.cmd+'</a>'
      +'<a href="'+d+'guides/bear-hunt-guide.html">'+NAV.guide+'</a>'
      +langLink()
      +'<a class="nav-owner" href="'+d+'about.html" aria-label="'+(EN?'About the creator':'運営者について')+'"><img src="'+d+'assets/owner.png" alt="'+(EN?'Creator':'運営者')+'" onerror="this.style.display=\'none\'"></a>'
      +'</div></nav>';
  };
  window.WOS_FOOT = function(depth){
    var d='../'.repeat(depth);
    var f = EN ? {
      home:"Home", sim:"Bear Hunt Simulator", guide:"Guides", about:"About",
      privacy:"Privacy Policy", terms:"Terms", contact:"Contact",
      note:"This is a fan-made, unofficial strategy site. Whiteout Survival is a trademark of Century Games; this site is not affiliated with the developer or operator."
    } : {
      home:"ホーム", sim:"熊狩シミュレーター", guide:"攻略ガイド", about:"運営者情報",
      privacy:"プライバシーポリシー", terms:"利用規約", contact:"お問い合わせ",
      note:"本サイトはファンメイドの非公式攻略サイトです。Whiteout Survival は Century Games の商標であり、当サイトは開発元・運営元とは一切関係ありません。"
    };
    return '<footer class="sitefoot"><div class="in"><nav>'
      +'<a href="'+d+'index.html">'+f.home+'</a>'
      +'<a href="'+d+'tools/bear-hunt/index.html">'+f.sim+'</a>'
      +'<a href="'+d+'guides/bear-hunt-guide.html">'+f.guide+'</a>'
      +'<a href="'+d+'about.html">'+f.about+'</a>'
      +'<a href="'+d+'privacy.html">'+f.privacy+'</a>'
      +'<a href="'+d+'terms.html">'+f.terms+'</a>'
      +'<a href="'+d+'contact.html">'+f.contact+'</a>'
      +'</nav>'+f.note+'<br>© '+(EN?'Whiteout Tools Lab':'ホワサバ ツールラボ')+'</div></footer>';
  };
  window.WOS_UPDATEBOX = function(opt){
    opt=opt||{};
    var d=opt.date||'2026-06-15', g=opt.gen||16;
    if(EN) return '<div class="updbox"><span class="u1">Last verified '+d+'</span>'
      +'<span class="u2">Up to Gen '+g+'</span>'+(opt.note_en?'<span class="u3">Recent: '+opt.note_en+'</span>':'')+'</div>';
    return '<div class="updbox"><span class="u1">最終検証日 '+d+'</span>'
      +'<span class="u2">対応世代 〜第'+g+'世代</span>'+(opt.note?'<span class="u3">直近の仕様: '+opt.note+'</span>':'')+'</div>';
  };
  /* 共通イベント計測ヘルパー */
  window.WOS_TRACK = function(action, params){ try{ if(window.gtag) gtag('event', action, params||{}); }catch(e){} };
  /* ツールページの初回操作を1回だけ計測(used/not-used 判定用) */
  (function(){
    if((location.pathname||'').indexOf('/tools/')<0) return;
    var sent=false, m=(location.pathname.match(/\/tools\/([^\/]+)/)||[])[1]||'unknown';
    function fire(){ if(sent)return; sent=true; window.WOS_TRACK('tool_engaged',{tool:m});
      document.removeEventListener('click',fire,true); document.removeEventListener('input',fire,true); }
    document.addEventListener('click',fire,true); document.addEventListener('input',fire,true);
  })();
  /* 関連記事(.relposts)の英訳 + ?lang=en 付与 */
  (function(){
    var TT={
      'bear-hunt-guide.html':'How Bear Hunt damage works',
      'beginner-faq.html':'Bear Hunt beginner FAQ',
      'common-myths.html':'7 common Bear Hunt myths',
      'cyril-talent.html':'How strong is Cyrille? Talent test',
      'damage-not-growing.html':"Why your damage isn't growing",
      'f2p-damage.html':'Grow Bear Hunt damage as F2P',
      'how-to-use.html':'How to use the Damage Simulator',
      'leader-formation.html':'Best rally leader formation & heroes',
      'left-hero.html':'Left heroes & the 4-slot rule',
      'light-spender.html':'Best spends for light spenders',
      'troop-ratio.html':"What's the right troop ratio?"
    };
    function run(){
      if(!EN) return;
      var h=document.querySelector('.relposts-h'); if(h) h.textContent='Related articles';
      Array.prototype.forEach.call(document.querySelectorAll('.relposts a'),function(a){
        var href=a.getAttribute('href')||'', file=href.split('/').pop().split('?')[0].split('#')[0];
        if(TT[file]) a.textContent=TT[file];
        if(href && href.indexOf('lang=')<0) a.setAttribute('href', href+(href.indexOf('?')<0?'?':'&')+'lang=en');
      });
      var nav=document.querySelector('.relposts'); if(nav) nav.setAttribute('aria-label','Related articles');
    }
    if(document.readyState!=='loading') run(); else document.addEventListener('DOMContentLoaded',run);
  })();
})();
