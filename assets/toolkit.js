/* 共通UIヘルパー(JP/EN対応) 全ツール・記事で使用。config.js を先に読むこと */
(function(){
  var L = window.WOS_LANG || 'ja';
  var EN = L==='en';
  var SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="ic-paw" viewBox="0 0 24 24"><g fill="currentColor"><ellipse cx="12" cy="16" rx="6.5" ry="5.2"></ellipse><circle cx="5" cy="10.5" r="2.5"></circle><circle cx="19" cy="10.5" r="2.5"></circle><circle cx="8.7" cy="6" r="2.2"></circle><circle cx="15.3" cy="6" r="2.2"></circle></g></symbol><symbol id="ic-shield" viewBox="0 0 24 24"><path d="M12 3l7 2.6v5.2c0 4.3-2.9 7.4-7 8.6-4.1-1.2-7-4.3-7-8.6V5.6L12 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></symbol><symbol id="ic-spear" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L18 6"></path><path d="M18 6l-4 .3M18 6l-.3 4"></path><path d="M4.5 19.5l1.6-1.6"></path></g></symbol><symbol id="ic-bow" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4a9 9 0 000 16"></path><path d="M7 4v16"></path><path d="M4 12h15"></path><path d="M19 12l-3-2.2M19 12l-3 2.2"></path></g></symbol><symbol id="ic-share" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.4"></circle><circle cx="17.5" cy="6" r="2.4"></circle><circle cx="17.5" cy="18" r="2.4"></circle><path d="M8.1 10.9l7.3-3.8M8.1 13.1l7.3 3.8"></path></g></symbol><symbol id="ic-help" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.4 9.2a2.7 2.7 0 015.2 1c0 1.8-2.6 2.2-2.6 4"></path><path d="M12 17.4h.01"></path></g></symbol><symbol id="ic-target" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.6"></circle><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"></circle></g></symbol><symbol id="ic-bolt" viewBox="0 0 24 24"><path d="M13 2.5L5.5 13H11l-1.5 8.5L18.5 10H12.5L13 2.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></symbol><symbol id="ic-chart" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h16"></path><path d="M7 15l3.5-3.8 2.8 2.4L20 7"></path><path d="M20 7h-3.4M20 7v3.4"></path></g></symbol><symbol id="ic-bookmark" viewBox="0 0 24 24"><path d="M6.5 4.5h11v15l-5.5-3.4-5.5 3.4v-15z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></symbol><symbol id="ic-image" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="2.5"></rect><circle cx="9" cy="10" r="1.6"></circle><path d="M5 18l4.5-4.5 3 2.6L16 12l3.5 3.6"></path></g></symbol><symbol id="ic-link" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10 13.5a3.5 3.5 0 005 .2l2.7-2.7a3.5 3.5 0 00-5-5l-1.4 1.4"></path><path d="M14 10.5a3.5 3.5 0 00-5-.2L6.3 13a3.5 3.5 0 005 5l1.4-1.4"></path></g></symbol><symbol id="ic-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path></symbol><symbol id="ic-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path></symbol><symbol id="ic-camera" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 8h3l1.4-2h7.2L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"></path><circle cx="12" cy="13" r="3.2"></circle></g></symbol><symbol id="ic-compare" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"></path><path d="M7 8L4 11l3 3"></path><path d="M17 8l3 3-3 3"></path><path d="M4 11h5M15 11h5"></path></g></symbol><symbol id="ic-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></symbol></defs></svg>';
  var NAV = EN ? {
    brand:"🐻 Whiteout Tools Lab", home:"Home", sim:"Bear Sim", left:"Left-Hero",
    ratio:"Troop Ratio", doctor:"Damage Doctor", castle:"Castle Battle", foundry:"Foundry", frost:"Frost Dragon", tools:"All Tools", cmd:"Commander", heroes:"Heroes", guide:"Guides", stats:"Gen Builds"
  } : {
    brand:"🐻 ホワサバ ツールラボ", home:"ホーム", sim:"熊狩シミュ", left:"左英雄チェッカー",
    ratio:"兵士比率", doctor:"ダメージ診断", castle:"王城戦", foundry:"兵器工場戦", frost:"霜竜配置", tools:"ツール一覧", cmd:"指揮官診断", heroes:"英雄一覧", guide:"攻略ガイド", stats:"世代別構成"
  };
  function langLink(){
    return EN
      ? '<a id="langtgl" href="#" onclick="WOS_setLang(\'ja\');return false" style="color:var(--ember)">日本語</a>'
      : '<a id="langtgl" href="#" onclick="WOS_setLang(\'en\');return false" style="color:var(--ember)">English</a>';
  }
  /* 言語別ルートを基準にした絶対パスでリンクを生成(日本語=/ , 英語=/en/)。
     共有アセット(CSS/JS/画像)は常にルート直下の /assets を参照する。
     引数 depth は後方互換のため受け取るが未使用。 */
  var B = (window.WOS_BASE || '');
  var T = function(ja,en){ return EN ? en : ja; };
  var esc = function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };

  /* ===== サイト全体のメニュー定義(階層ナビ・フッター・パンくず補助で共用) =====
     大カテゴリ → 中カテゴリ(グループ) → 小カテゴリ(ページ)。全ページをここで網羅する。
     項目: [パス, 日本語名, 英語名, (任意)日本語説明, (任意)英語説明] */
  var MENU = [
    { id:'tools', icon:'🧰', label:['ツール','Tools'], href:'index.html#tools',
      all:['ツール一覧を見る','See all tools'],
      groups:[
        { h:['熊狩り','Bear Hunt'], items:[
          ['tools/bear-hunt/index.html','熊狩ダメージ・シミュレーター','Bear Hunt Damage Simulator','集結1回のダメージを推定','Estimate one rally\'s damage'],
          ['tools/left-hero/index.html','左英雄チェッカー','Left-Hero Checker','乗りで効く英雄を判定','Which joiner heroes count'],
          ['tools/troop-ratio/index.html','兵士比率シミュレータ','Troop Ratio Simulator','盾:槍:弓の比率を比較','Compare Inf:Lan:Mks ratios'],
          ['tools/damage-doctor/index.html','ダメージが伸びない原因診断','Damage Doctor','伸び悩みの原因を診断','Find why damage stalls']
        ]},
        { h:['イベント','Events'], items:[
          ['tools/king-castle/index.html','王城戦エリア配置管理','Castle Battle Planner','都市配置をマス目で管理','Plan city placement on a grid'],
          ['tools/foundry-battle/index.html','兵器工場争奪戦シミュレーター','Foundry Battle Simulator','フィールドと配置を確認','Field & placement tool'],
          ['tools/frost-dragon/index.html','霜竜イベント配置計算','Frost Dragon Placement','入れ物同盟への割り振り','Assign alliances to hosts']
        ]},
        { h:['英雄・診断','Heroes & quizzes'], items:[
          ['tools/hero-list/index.html','英雄一覧・データベース','Hero Database','全英雄のスキルと専用装備','All heroes, skills & gear'],
          ['tools/commander-type/index.html','指揮官タイプ診断','Commander Type Quiz','あなたの熊狩りタイプは?','What kind of commander are you?']
        ]}
      ]},
    { id:'stats', icon:'📊', label:['世代別構成','Gen Builds'], href:'stats/index.html',
      all:['世代別まとめのトップへ','Open the generation hub'],
      groups:[
        { h:['世代を選ぶ(集結主のおすすめ構成)','Pick a generation (rally-leader builds)'], gens:16 },
        { h:['統計メニュー','Stats menu'], items:[
          ['stats/index.html','世代別まとめ(トップ)','Generation hub'],
          ['submit/index.html','自分の構成を投稿する','Submit your build'],
          ['stats/methodology.html','集計方法と計算の前提','Methodology']
        ]}
      ]},
    { id:'guides', icon:'📖', label:['攻略ガイド','Guides'], href:'guides/bear-hunt-guide.html',
      groups:[
        { h:['基礎知識','Basics'], items:[
          ['guides/bear-hunt-guide.html','熊狩行動のダメージの仕組み','How Bear Hunt damage works'],
          ['guides/beginner-faq.html','初心者FAQ','Beginner FAQ'],
          ['guides/common-myths.html','よくある勘違い7選','7 common myths'],
          ['guides/how-to-use.html','シミュレーターの使い方','How to use the simulator']
        ]},
        { h:['編成・英雄','Formations & heroes'], items:[
          ['guides/leader-formation.html','集結主におすすめの編成','Rally-leader formations'],
          ['guides/left-hero.html','左英雄とは?4枠ルール','Left hero & the 4-slot rule'],
          ['guides/troop-ratio.html','兵士比率は何が正解?','Which troop ratio is right?'],
          ['guides/cyril-expert.html','シリル徹底研究','Cyrille deep-dive'],
          ['guides/cyril-talent.html','シリル天賦を数字で検証','Cyrille talent verified']
        ]},
        { h:['強化・課金','Upgrades & spending'], items:[
          ['guides/damage-not-growing.html','ダメージが伸びない原因と対処',"Why damage isn't growing"],
          ['guides/f2p-damage.html','無課金で伸ばす方法','Growing damage as F2P'],
          ['guides/light-spender.html','微課金の投資先ランキング','Light-spender investments']
        ]}
      ]},
    { id:'site', icon:'ℹ️', label:['サイト情報','About'], href:'about.html',
      groups:[
        { h:['運営について','This site'], items:[
          ['about.html','運営者情報','About the creator'],
          ['contact.html','お問い合わせ','Contact'],
          ['changelog.html','更新履歴','Changelog'],
          ['recruit.html','同盟メンバー募集','Alliance recruitment']
        ]},
        { h:['規約','Policies'], items:[
          ['privacy.html','プライバシーポリシー','Privacy policy'],
          ['terms.html','利用規約','Terms of use']
        ]}
      ]}
  ];
  window.WOS_MENU = MENU;

  /* 現在ページ判定用にパスを正規化(/index.html と / を同一視、クエリ・ハッシュ除去) */
  function normPath(p){
    p = (p||'').split('#')[0].split('?')[0];
    p = p.replace(/\/index\.html$/,'/');
    return p;
  }
  var HERE = normPath(location.pathname);

  function itemLink(it, cls){
    var d = B + '/';
    var href = d + it[0];
    var cur = normPath(href.replace(/^https?:\/\/[^\/]+/,'')) === HERE;
    var desc = EN ? it[4] : it[3];
    return '<a class="'+(cls||'nav-item')+(cur?' is-here':'')+'" href="'+href+'"'+(cur?' aria-current="page"':'')+'>'
      +'<span class="nav-it">'+esc(EN?it[2]:it[1])+'</span>'
      +(desc?'<span class="nav-id">'+esc(desc)+'</span>':'')+'</a>';
  }
  function genLinks(){
    var d = B + '/', out = '';
    for(var g=1; g<=16; g++){
      var href = d + 'stats/gen-' + (g<10?'0'+g:g) + '/index.html';
      var cur = normPath(href) === HERE;
      out += '<a class="nav-gen'+(cur?' is-here':'')+'" href="'+href+'"'+(cur?' aria-current="page"':'')+'>'+(EN?'Gen '+g:'第'+g+'世代')+'</a>';
    }
    return '<div class="nav-gens">'+out+'</div>';
  }
  function catPanel(c){
    var d = B + '/';
    var html = '';
    c.groups.forEach(function(gr){
      html += '<div class="nav-grp'+(gr.gens?' nav-grp-gens':'')+'"><div class="nav-gh">'+esc(EN?gr.h[1]:gr.h[0])+'</div>';
      if(gr.gens) html += genLinks();
      else html += gr.items.map(function(it){ return itemLink(it); }).join('');
      html += '</div>';
    });
    if(c.all) html += '<a class="nav-all" href="'+d+c.href+'">'+esc(EN?c.all[1]:c.all[0])+' →</a>';
    return html;
  }
  function catIsHere(c){
    var d = B + '/';
    var hit = false;
    c.groups.forEach(function(gr){
      if(gr.gens){ if(/\/stats\/gen-\d\d\/$/.test(HERE)) hit = true; return; }
      gr.items.forEach(function(it){ if(normPath(d+it[0]) === HERE) hit = true; });
    });
    return hit;
  }
  window.WOS_NAV = function(depth){
    var d = B + '/';
    var cats = MENU.map(function(c){
      var here = catIsHere(c);
      return '<li class="nav-cat'+(here?' is-here':'')+'" data-cat="'+c.id+'">'
        +'<button type="button" class="nav-cbtn" aria-expanded="false" aria-controls="navp-'+c.id+'">'
        +'<span class="nav-ci" aria-hidden="true">'+c.icon+'</span><span class="nav-cl">'+esc(EN?c.label[1]:c.label[0])+'</span>'
        +'<svg class="ic nav-chev" aria-hidden="true"><use href="#ic-chev"></use></svg></button>'
        +'<div class="nav-panel" id="navp-'+c.id+'"><div class="nav-panel-in nav-panel-'+c.id+'">'+catPanel(c)+'</div></div>'
        +'</li>';
    }).join('');
    var sprite = document.getElementById('ic-paw') ? '' : SPRITE;
    return sprite+'<nav class="sitenav" aria-label="'+T('サイト内ナビゲーション','Site navigation')+'"><div class="in">'
      +'<a class="brand" href="'+d+'index.html">'+NAV.brand.replace(/^🐻\s*/,'<span class="logo"><svg class="ic"><use href="#ic-paw"></use></svg></span> ')+'</a>'
      +'<div class="nav-menu" id="wosmenu"><ul class="nav-top">'+cats+'</ul></div>'
      +'<div class="nav-side">'+langLink()
      +'<a class="nav-owner" href="'+d+'about.html" aria-label="'+(EN?'About the creator':'運営者について')+'"><img src="/assets/owner.png" alt="'+(EN?'Creator':'運営者')+'" onerror="this.style.display=\'none\'"></a>'
      +'<button type="button" class="nav-burger" aria-controls="wosmenu" aria-expanded="false" aria-label="'+T('メニューを開く','Open menu')+'"><span class="nav-bl"></span><span class="nav-bl"></span><span class="nav-bl"></span></button>'
      +'</div>'
      +'</div></nav>';
  };
  /* ナビの開閉制御(PC: クリック/ホバー/フォーカスでドロップダウン、スマホ: ハンバーガー→アコーディオン)。
     WOS_NAV() の描画はどのタイミングでも良いよう、document 全体への委譲で実装する。 */
  (function(){
    if(window.__wosNavBound) return; window.__wosNavBound = true;
    var mq = window.matchMedia ? window.matchMedia('(min-width:900px) and (hover:hover)') : null;
    function nav(){ return document.querySelector('nav.sitenav'); }
    function closeAll(except){
      var n = nav(); if(!n) return;
      Array.prototype.forEach.call(n.querySelectorAll('.nav-cat.open'), function(li){
        if(li===except) return;
        li.classList.remove('open');
        var b=li.querySelector('.nav-cbtn'); if(b) b.setAttribute('aria-expanded','false');
      });
    }
    function setMenu(open){
      var n = nav(); if(!n) return;
      n.classList.toggle('menu-open', open);
      var b=n.querySelector('.nav-burger'); if(b){ b.setAttribute('aria-expanded', open?'true':'false'); b.setAttribute('aria-label', open?T('メニューを閉じる','Close menu'):T('メニューを開く','Open menu')); }
      if(!open) closeAll();
    }
    document.addEventListener('click', function(e){
      var t = e.target;
      var burger = t.closest && t.closest('.nav-burger');
      if(burger){ var n=nav(); setMenu(!(n && n.classList.contains('menu-open'))); return; }
      var btn = t.closest && t.closest('.nav-cbtn');
      if(btn){
        var li = btn.parentNode, open = !li.classList.contains('open');
        /* PC(ホバーで既に開いている)状態でのマウスクリックは閉じない(キーボードのEnter/Spaceはトグル) */
        if(!open && mq && mq.matches && e.detail>0) return;
        closeAll(li);
        li.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open?'true':'false');
        return;
      }
      if(!(t.closest && t.closest('nav.sitenav'))){ closeAll(); }
    });
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape'){ var n=nav(); if(!n) return; var wasOpen = n.querySelector('.nav-cat.open'); closeAll(); setMenu(false);
        if(wasOpen){ var b=wasOpen.querySelector('.nav-cbtn'); if(b) b.focus(); } }
    });
    /* PC: ホバーで開く(タッチ端末はクリックのみ) */
    document.addEventListener('mouseover', function(e){
      if(!mq || !mq.matches) return;
      var li = e.target.closest && e.target.closest('.nav-cat'); if(!li) return;
      if(li.classList.contains('open')) return;
      closeAll(li); li.classList.add('open'); var b=li.querySelector('.nav-cbtn'); if(b) b.setAttribute('aria-expanded','true');
    });
    document.addEventListener('mouseout', function(e){
      if(!mq || !mq.matches) return;
      var li = e.target.closest && e.target.closest('.nav-cat'); if(!li) return;
      var to = e.relatedTarget; if(to && li.contains(to)) return;
      li.classList.remove('open'); var b=li.querySelector('.nav-cbtn'); if(b) b.setAttribute('aria-expanded','false');
    });
    /* フォーカスがカテゴリ外へ出たら閉じる(キーボード操作) */
    document.addEventListener('focusout', function(e){
      var li = e.target.closest && e.target.closest('.nav-cat'); if(!li) return;
      var to = e.relatedTarget; if(to && li.contains(to)) return;
      if(mq && mq.matches){ li.classList.remove('open'); var b=li.querySelector('.nav-cbtn'); if(b) b.setAttribute('aria-expanded','false'); }
    });
    if(mq && mq.addEventListener) mq.addEventListener('change', function(){ closeAll(); setMenu(false); });
  })();

  /* 同じページの別言語版URL */
  function altLang(){
    var p = location.pathname || '/';
    if(EN) return p.replace(/^\/en/,'') || '/';
    return '/en' + (p === '/' ? '/' : p);
  }
  window.WOS_FOOT = function(depth){
    var d = B + '/';
    var f = EN ? {
      note:"This is a fan-made, unofficial strategy site. Whiteout Survival is a trademark of Century Games; this site is not affiliated with the developer or operator."
    } : {
      note:"本サイトはファンメイドの非公式攻略サイトです。Whiteout Survival は Century Games の商標であり、当サイトは開発元・運営元とは一切関係ありません。"
    };
    var cols = MENU.map(function(c){
      var links = '';
      c.groups.forEach(function(gr){
        if(gr.gens){
          var gs=''; for(var g=1; g<=16; g++){ gs += '<a href="'+d+'stats/gen-'+(g<10?'0'+g:g)+'/index.html">'+(EN?'G'+g:'第'+g+'世代')+'</a>'; }
          links += '<div class="foot-gens">'+gs+'</div>'; return;
        }
        gr.items.forEach(function(it){ links += '<a href="'+d+it[0]+'">'+esc(EN?it[2]:it[1])+'</a>'; });
      });
      return '<div class="foot-col"><div class="foot-h"><a href="'+d+c.href+'">'+c.icon+' '+esc(EN?c.label[1]:c.label[0])+'</a></div>'+links+'</div>';
    }).join('');
    return '<footer class="sitefoot"><div class="in"><nav class="foot-grid" aria-label="'+T('フッターナビゲーション','Footer navigation')+'">'
      +'<div class="foot-col foot-col-home"><div class="foot-h"><a href="'+d+'index.html">🏠 '+NAV.home+'</a></div>'
      +'<a href="'+d+'index.html#tools">'+NAV.tools+'</a>'
      +'<a href="'+altLang()+'">'+(EN?'日本語版':'English version')+'</a></div>'
      +cols+'</nav>'+f.note+'<br>© '+(EN?'Whiteout Tools Lab':'ホワサバ ツールラボ')+'</div></footer>';
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
    if((location.pathname||'').indexOf('/tools/')<0 || window.WOS_SKIP_ENGAGE) return;
    var sent=false, m=(location.pathname.match(/\/tools\/([^\/]+)/)||[])[1]||'unknown';
    function fire(){ if(sent)return; sent=true; window.WOS_TRACK('tool_engaged',{tool:m});
      document.removeEventListener('click',fire,true); document.removeEventListener('input',fire,true); }
    document.addEventListener('click',fire,true); document.addEventListener('input',fire,true);
  })();
  /* ===== 関連記事(.relposts)・関連ツール(.relbar)の言語統一 =====
     静的HTMLの表記に関わらず、ページの言語(パスで確定)に合わせて
     見出し・記事タイトル・ツール名を置き換える。
     日本語ページに英語タイトルが出る問題(言語分離以前からの仕様)の恒久対策。 */
  (function(){
    /* 記事ファイル名 → [日本語タイトル, 英語タイトル] */
    var TT={
      'bear-hunt-guide.html':['熊狩行動のダメージの仕組みを徹底解説','How Bear Hunt damage works (full guide)'],
      'beginner-faq.html':['熊狩り初心者FAQ:よくある疑問に全部答えます','Bear Hunt beginner FAQ'],
      'common-myths.html':['熊狩りのよくある勘違い7選','7 common Bear Hunt myths'],
      'cyril-expert.html':['シリル徹底研究:全スキルと育成優先度','Cyrille deep-dive: all skills & priority'],
      'cyril-talent.html':['シリルは熊狩りでどこまで強い?天賦を数字で検証','How strong is Cyrille? Talent verified'],
      'damage-not-growing.html':['ダメージが伸びない原因まとめと対処',"Why your damage isn't growing, and fixes"],
      'f2p-damage.html':['無課金で熊狩りダメージを伸ばす方法','How to grow Bear Hunt damage as F2P'],
      'how-to-use.html':['熊狩シミュレーターの使い方','How to use the Damage Simulator'],
      'leader-formation.html':['集結主におすすめの編成と英雄の選び方','Rally leader: recommended formations & heroes'],
      'left-hero.html':['熊狩りの左英雄とは?乗りで使うべき英雄と4枠ルール','What is the left hero? Heroes to use & the 4-slot rule'],
      'light-spender.html':['微課金で熊狩りを伸ばす投資先ランキング','Light-spender investment ranking'],
      'troop-ratio.html':['熊狩りの兵士比率は何が正解?主要比率を徹底比較',"What's the right troop ratio? Major ratios compared"]
    };
    /* ツールディレクトリ名 → [日本語名, 英語名] (relbar内の表記ゆれ修正用) */
    var TOOLS={
      'bear-hunt':['熊狩ダメージ・シミュレーター','Bear Hunt Simulator'],
      'left-hero':['左英雄チェッカー','Left-Hero Checker'],
      'troop-ratio':['兵士比率シミュレータ','Troop Ratio Simulator'],
      'damage-doctor':['ダメージが伸びない原因診断','Damage Doctor'],
      'commander-type':['指揮官タイプ診断','Commander Type Quiz'],
      'hero-list':['英雄一覧・データベース','Hero Database'],
      'king-castle':['王城戦エリア配置管理','Castle Battle Planner'],
      'foundry-battle':['兵器工場争奪戦シミュレーター','Foundry Battle Simulator'],
      'frost-dragon':['霜竜イベント配置計算','Frost Dragon Placement']
    };
    var IDX=EN?1:0;
    var hasJa=function(t){ return /[぀-ヿ一-鿿]/.test(t||''); };
    function run(){
      /* 見出しとaria-label */
      var h=document.querySelector('.relposts-h'); if(h) h.textContent=EN?'Related articles':'関連記事';
      var nav=document.querySelector('.relposts'); if(nav) nav.setAttribute('aria-label',EN?'Related articles':'関連記事');
      /* 関連記事: 常に現在言語のタイトルへ置換 */
      Array.prototype.forEach.call(document.querySelectorAll('.relposts a'),function(a){
        var href=a.getAttribute('href')||'', file=href.split('/').pop().split('?')[0].split('#')[0];
        if(TT[file]) a.textContent=TT[file][IDX];
      });
      /* 関連ツールバー: 言語が食い違っている場合のみ置換(意図的なラベルは温存) */
      Array.prototype.forEach.call(document.querySelectorAll('.relbar a'),function(a){
        var href=a.getAttribute('href')||'';
        var m=href.match(/tools\/([^\/]+)\//);
        var t=a.textContent||'';
        var mismatch = EN ? hasJa(t) : !hasJa(t);
        if(m && TOOLS[m[1]] && mismatch){ a.textContent='→ '+TOOLS[m[1]][IDX]; return; }
        var file=href.split('/').pop().split('?')[0].split('#')[0];
        if(TT[file] && mismatch){ a.textContent='→ '+TT[file][IDX]; }
      });
    }
    if(document.readyState!=='loading') run(); else document.addEventListener('DOMContentLoaded',run);
  })();

  /* 記事(guides)・ツール(tools)への著者バイライン自動挿入: 執筆者・初回公開・最終更新・検証環境を表示。
     #updbox の直後(なければパンくずの直後、なければ h1 の直後)に1つだけ差し込む(日本語/英語はパスで確定)。
     統計ページ(/stats/ /submit/)は生成時に静的なバイラインを持つため対象外。 */
  var PAGE_DATES = {
    /* 記事: [初回公開, 最終更新] */
    'guides/bear-hunt-guide.html':['2026-06-21','2026-07-24'],'guides/beginner-faq.html':['2026-06-21','2026-07-24'],
    'guides/common-myths.html':['2026-06-21','2026-07-24'],'guides/cyril-expert.html':['2026-07-24','2026-07-24'],
    'guides/cyril-talent.html':['2026-06-21','2026-07-24'],'guides/damage-not-growing.html':['2026-06-21','2026-07-24'],
    'guides/f2p-damage.html':['2026-06-21','2026-07-24'],'guides/how-to-use.html':['2026-06-21','2026-09-03'],
    'guides/leader-formation.html':['2026-06-21','2026-09-04'],'guides/left-hero.html':['2026-06-21','2026-09-02'],
    'guides/light-spender.html':['2026-06-21','2026-07-24'],'guides/troop-ratio.html':['2026-06-21','2026-07-24'],
    /* ツール: [公開日, 最終更新] */
    'tools/bear-hunt':['2026-06-16','2026-09-14'],'tools/left-hero':['2026-06-16','2026-09-14'],
    'tools/troop-ratio':['2026-06-16','2026-09-14'],'tools/damage-doctor':['2026-06-16','2026-09-14'],
    'tools/commander-type':['2026-06-16','2026-09-14'],'tools/king-castle':['2026-06-19','2026-09-14'],
    'tools/foundry-battle':['2026-06-26','2026-09-14'],'tools/hero-list':['2026-06-26','2026-09-14'],
    'tools/frost-dragon':['2026-07-04','2026-09-14']
  };
  window.WOS_PAGE_DATES = PAGE_DATES;
  function pageKey(){
    var P=(location.pathname||'').replace(/^\/en(?=\/)/,'');
    var m=P.match(/\/tools\/([^\/]+)/); if(m) return 'tools/'+m[1];
    m=P.match(/\/guides\/([^\/]+\.html)$/); if(m) return 'guides/'+m[1];
    return '';
  }
  window.WOS_PAGE_DATE = function(){ return PAGE_DATES[pageKey()] || null; };
  (function(){
    var key = pageKey(); if(!key) return;
    var dates = PAGE_DATES[key] || ['2026-06-21','2026-07-24'];
    var isTool = key.indexOf('tools/')===0;
    function injectCss(){
      if(document.getElementById('wos-byline-css')) return;
      var s=document.createElement('style'); s.id='wos-byline-css';
      s.textContent='.wos-byline{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;'
        +'margin:10px 0 16px;padding:9px 13px;border:1px solid #e5e7f2;border-radius:10px;'
        +'background:#faf9ff;color:#5b6276;font-size:12px;line-height:1.6}'
        +'.wos-byline b{color:#1d2233;font-weight:700}'
        +'.wos-byline a{color:#e85d12;text-decoration:none;font-weight:700}'
        +'.wos-byline a:hover{text-decoration:underline}'
        +'.wos-byline .sep{color:#c7cbe0}'
        +'.wos-byline time{font-variant-numeric:tabular-nums}';
      document.head.appendChild(s);
    }
    function run(){
      if(document.querySelector('.wos-byline')) return;
      var pub=dates[0], upd=dates[1];
      var base=(window.WOS_BASE||'');
      var html = EN
        ? '<div class="wos-byline">✍ '+(isTool?'Made by':'Written by')+' <a href="'+base+'/about.html"><b>Jasmine</b></a>'
          +'<span class="sep">|</span>Published <time datetime="'+pub+'">'+pub+'</time>'
          +'<span class="sep">|</span>Last updated <time datetime="'+upd+'">'+upd+'</time>'
          +'<span class="sep">|</span>Verified on Server 1567 (Whiteout Survival)</div>'
        : '<div class="wos-byline">✍ '+(isTool?'制作：':'執筆：')+'<a href="'+base+'/about.html"><b>じゃすみん</b></a>'
          +'<span class="sep">|</span>'+(isTool?'公開日：':'初回公開：')+'<time datetime="'+pub+'">'+pub+'</time>'
          +'<span class="sep">|</span>最終更新：<time datetime="'+upd+'">'+upd+'</time>'
          +'<span class="sep">|</span>検証環境：1567サーバー</div>';
      injectCss();
      var wrap=document.createElement('div'); wrap.innerHTML=html; var el=wrap.firstChild;
      var anchor=document.getElementById('updbox') || document.querySelector('.crumb') || document.querySelector('h1');
      if(anchor && anchor.tagName==='H1' && anchor.parentNode && anchor.parentNode.tagName==='HEADER') anchor=anchor.parentNode;
      if(anchor && anchor.parentNode){ anchor.parentNode.insertBefore(el, anchor.nextSibling); }
      else { var w=document.querySelector('div.wrap'); if(w) w.insertBefore(el, w.firstChild); }
    }
    if(document.readyState!=='loading') run(); else document.addEventListener('DOMContentLoaded',run);
  })();

  /* ===== 記事共通: 折りたたみUI + 出典・参考文献ボックス =====
     - details.wos-acc : 重いデータ表を「見たい人だけ開く」ための共通アコーディオン
     - .wos-srcbox     : 記事ごとの出典リスト(下のWOS_SOURCESマップから自動挿入)
     出典は 公式 / 攻略サイト / コミュニティ / 当サイト検証 のバッジで区別する。 */
  (function(){
    function injectCss(){
      if(document.getElementById('wos-src-css')) return;
      var s=document.createElement('style'); s.id='wos-src-css';
      s.textContent=
        'details.wos-acc{border:1px solid #e5e7f2;border-radius:11px;background:#fbfaff;margin:12px 0;overflow:hidden}'
        +'details.wos-acc>summary{cursor:pointer;padding:11px 14px;font-size:13px;font-weight:800;color:#1d2233;'
        +'list-style:none;display:flex;align-items:center;gap:8px;user-select:none}'
        +'details.wos-acc>summary::-webkit-details-marker{display:none}'
        +'details.wos-acc>summary::after{content:"▼";margin-left:auto;font-size:10px;color:#6b7385;transition:transform .15s}'
        +'details.wos-acc[open]>summary::after{transform:rotate(180deg)}'
        +'details.wos-acc>summary:hover{background:#f4f3fb}'
        +'details.wos-acc>.wos-acc-in{padding:2px 14px 12px;font-size:12.5px;line-height:1.8;color:#3b4254}'
        +'details.wos-acc table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12.5px}'
        +'details.wos-acc th,details.wos-acc td{border:1px solid #e5e7f2;padding:6px 9px;text-align:left}'
        +'details.wos-acc th{background:#f4f3fb;white-space:nowrap}'
        +'details.wos-src{margin:18px 0 6px}'
        +'.wos-src-ul{margin:4px 0;padding-left:0;list-style:none}'
        +'.wos-src-ul li{margin:7px 0;font-size:12.5px;line-height:1.7}'
        +'.wos-src-ul a{color:#e85d12;font-weight:700;text-decoration:none}'
        +'.wos-src-ul a:hover{text-decoration:underline}'
        +'.wos-src-k{display:inline-block;font-size:10px;font-weight:800;border-radius:4px;padding:1px 6px;margin-right:7px;vertical-align:1px}'
        +'.wos-src-k.of{background:#dff1e2;color:#1c7a3d}'
        +'.wos-src-k.st{background:#e3edff;color:#2b5cc7}'
        +'.wos-src-k.cm{background:#f3e8ff;color:#7a3dc7}'
        +'.wos-src-k.we{background:#ffe7d6;color:#c94e00}'
        +'.wos-src-note{font-size:11px;color:#6b7385;margin:8px 0 0}'
        +'.tw-embed{margin:14px 0}'
        +'.tw-embed blockquote.twitter-tweet{border:1px solid #e5e7f2;border-radius:12px;padding:14px 16px;'
        +'margin:10px 0;background:#fbfaff;font-size:13px;line-height:1.8;color:#333}'
        +'.tw-embed blockquote.twitter-tweet a{color:#e85d12;word-break:break-all}';
      document.head.appendChild(s);
    }
    /* 記事ファイル名 → 出典リスト。k: of=公式 / st=攻略サイト / cm=コミュニティ・X / we=当サイト */
    var SRC={
      'bear-hunt-guide.html':[
        ['st','アルテマ「熊狩行動でダメージが出る方法を検証してみた」(公式Xでも紹介された実測検証)','Altema: Bear Hunt damage verification (featured by the official X account)','https://altema.jp/whiteoutsurvival/kumakarikensyou'],
        ['of','ホワサバ公式X:上記検証記事の紹介ポスト','Official WOS Japan X: post featuring the verification article','https://x.com/WOS_Japan/status/1866769908379660506'],
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」','Altema: recommended Bear Hunt formations & troop ratio (JP)','https://altema.jp/whiteoutsurvival/kumakari']],
      'troop-ratio.html':[
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」(10:30:60推奨・弓100%は約2割低下の記載)','Altema: Bear Hunt formations & ratio (recommends 10:30:60; notes ~20% drop at 100% archers)','https://altema.jp/whiteoutsurvival/kumakari'],
        ['of','ホワサバ公式X:熊狩り検証記事の紹介ポスト','Official WOS Japan X: Bear Hunt verification feature','https://x.com/WOS_Japan/status/1866769908379660506'],
        ['we','当サイト:兵士比率シミュレータ(自分の兵数で横並び比較)','This site: Troop Ratio Simulator','/tools/troop-ratio/index.html']],
      'left-hero.html':[
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」(参加者は左端スロットのみ効果発揮の記載)','Altema: Bear Hunt formations (joiners: only the leftmost slot takes effect)','https://altema.jp/whiteoutsurvival/kumakari'],
        ['of','ホワサバ公式X:ユーザー発信の熊狩り攻略紹介','Official WOS Japan X: community Bear Hunt guide feature','https://x.com/WOS_Japan/status/1753357597321912642'],
        ['we','当サイト:左英雄チェッカー(乗りで効くかを一発判定)','This site: Left-Hero Checker','/tools/left-hero/index.html']],
      'leader-formation.html':[
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」(集結主は3枠すべて火力バフ持ちを推奨)','Altema: Bear Hunt formations (rally leader: all 3 slots with damage-buff heroes)','https://altema.jp/whiteoutsurvival/kumakari'],
        ['of','ホワサバ公式X:ユーザー発信の熊狩り攻略紹介','Official WOS Japan X: community Bear Hunt guide feature','https://x.com/WOS_Japan/status/1753357597321912642'],
        ['we','当サイト:熊狩ダメージ・シミュレーター(編成A/B比較)','This site: Bear Hunt Damage Simulator','/tools/bear-hunt/index.html']],
      'damage-not-growing.html':[
        ['st','アルテマ「熊狩行動でダメージが出る方法を検証してみた」(要因別の実測上昇率)','Altema: damage verification (measured gain per factor)','https://altema.jp/whiteoutsurvival/kumakarikensyou'],
        ['cm','まゆか【ホワサバ攻略】:ダメージが伸びない原因の解説動画(X)','Mayuka (JP strategy YouTuber): why damage stalls, on X','https://x.com/mayuka_wos/status/1821853719958581403'],
        ['we','当サイト:ダメージが伸びない原因診断ツール','This site: Damage Doctor tool','/tools/damage-doctor/index.html']],
      'f2p-damage.html':[
        ['st','アルテマ「熊狩行動でダメージが出る方法を検証してみた」(課金に依らない上昇要素の実測)','Altema: damage verification (measured gains from non-paid factors)','https://altema.jp/whiteoutsurvival/kumakarikensyou'],
        ['cm','かかち先生:熊狩り特化ペット育成ガイド(無課金・微課金向け/note)','Kakachi-sensei: Bear Hunt pet guide for F2P/light spenders (note, JP)','https://note.com/ocatyan_0227/n/ndf5970ff7ab9'],
        ['we','当サイト:シリル徹底研究(無課金で+30%の狩人の心得)','This site: Cyrille deep-dive (+30% talent, free to level)','cyril-expert.html']],
      'light-spender.html':[
        ['st','アルテマ「熊狩行動でダメージが出る方法を検証してみた」(強化要素別の費用対効果の目安)','Altema: damage verification (cost-effectiveness reference per upgrade)','https://altema.jp/whiteoutsurvival/kumakarikensyou'],
        ['cm','かかち先生:熊狩り特化ペット育成ガイド(note)','Kakachi-sensei: Bear Hunt pet guide (note, JP)','https://note.com/ocatyan_0227/n/ndf5970ff7ab9'],
        ['we','当サイト:シリル徹底研究(専門家の育成優先度)','This site: Cyrille deep-dive (expert priority)','cyril-expert.html']],
      'cyril-talent.html':[
        ['of','ホワサバ公式wiki「シリル」(スキル・才能の一次情報)','Official WOS wiki: Cyrille (primary source)','https://www.whiteoutsurvival.wiki/ja/experts/%e3%82%b7%e3%83%aa%e3%83%ab/'],
        ['st','アルテマ「シリルの評価とスキル」(総合9.0点)','Altema: Cyrille review (9.0/10)','https://altema.jp/whiteoutsurvival/siriru'],
        ['we','当サイト:シリル徹底研究(全スキル一覧と育成優先度)','This site: Cyrille deep-dive (all skills & priority)','cyril-expert.html']],
      'beginner-faq.html':[
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」','Altema: Bear Hunt formations & ratio (JP)','https://altema.jp/whiteoutsurvival/kumakari'],
        ['cm','ロコのカンタン攻略ガイド「熊狩行動の攻略法(初心者&無課金向け)」','Roko: Bear Hunt basics for beginners (JP)','https://game.mariboshi.com/ws-kuma/'],
        ['of','ホワサバ公式X:ユーザー発信の熊狩り攻略紹介','Official WOS Japan X: community guide feature','https://x.com/WOS_Japan/status/1753357597321912642']],
      'common-myths.html':[
        ['st','アルテマ「熊狩行動でダメージが出る方法を検証してみた」(俗説の検証に使える実測データ)','Altema: damage verification (measured data useful against myths)','https://altema.jp/whiteoutsurvival/kumakarikensyou'],
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」','Altema: Bear Hunt formations & ratio (JP)','https://altema.jp/whiteoutsurvival/kumakari']],
      'how-to-use.html':[
        ['we','当サイト:熊狩ダメージ・シミュレーター本体','This site: the Bear Hunt Damage Simulator','/tools/bear-hunt/index.html'],
        ['st','アルテマ「熊狩行動のおすすめ英雄編成と兵士比率」(入力の参考になる編成の考え方)','Altema: formation thinking useful for inputs (JP)','https://altema.jp/whiteoutsurvival/kumakari']]
    };
    function run(){
      if((location.pathname||'').indexOf('/guides/')<0) return;
      if(document.querySelector('.wos-srcbox')) return;
      var file=(location.pathname.split('/').pop()||'');
      var list=SRC[file]; if(!list) return;
      injectCss();
      var K_JA={of:'公式',st:'攻略サイト',cm:'コミュニティ',we:'当サイト'};
      var K_EN={of:'Official',st:'Strategy site',cm:'Community',we:'This site'};
      var base=(window.WOS_BASE||'');
      var items=list.map(function(s){
        var kind=s[0], label=EN?s[2]:s[1], url=s[3];
        if(url.charAt(0)==='/') url=base+url; /* サイト内絶対パスは言語ツリーに合わせる */
        var cls={of:'of',st:'st',cm:'cm',we:'we'}[kind]||'st';
        var ext=/^https?:/.test(url);
        return '<li><span class="wos-src-k '+cls+'">'+(EN?K_EN[kind]:K_JA[kind])+'</span>'
          +'<a href="'+url+'"'+(ext?' target="_blank" rel="noopener noreferrer"':'')+'>'+label+'</a></li>';
      }).join('');
      var box=document.createElement('details');
      box.className='wos-acc wos-srcbox wos-src';
      box.innerHTML='<summary>📚 '+(EN?'Sources & references':'出典・参考文献')+' ('+list.length+')</summary>'
        +'<div class="wos-acc-in"><ul class="wos-src-ul">'+items+'</ul>'
        +'<p class="wos-src-note">'+(EN
          ?'Per site policy we distinguish official info, strategy sites, community voices and our own research. External content belongs to its authors.'
          :'当サイトの方針として、公式情報・攻略サイト・コミュニティの声・当サイト検証を区別して表記しています。外部リンクの内容は各著作者に帰属します。')+'</p></div>';
      var rel=document.querySelector('.relposts');
      if(rel && rel.parentNode) rel.parentNode.insertBefore(box, rel);
      else{ var w=document.querySelector('div.wrap'); if(w) w.appendChild(box); }
    }
    if(document.readyState!=='loading') run(); else document.addEventListener('DOMContentLoaded',run);
  })();


  /* ツール冒頭「このツールについて」: スマホでは2・3列目を折りたたみ、ボタンで展開 */
  (function(){
    function run(){
      Array.prototype.forEach.call(document.querySelectorAll('.tool-about'), function(box){
        if(box.querySelector('.tab-more')) return;
        Array.prototype.forEach.call(box.querySelectorAll('.tab-grid'), function(grid){
          var b=document.createElement('button'); b.type='button'; b.className='tab-more';
          b.textContent = EN ? 'Show how it works & how to use it ▾' : '計算の考え方・使い方も見る ▾';
          b.addEventListener('click', function(){ box.classList.add('open'); });
          grid.parentNode.insertBefore(b, grid.nextSibling);
        });
      });
    }
    if(document.readyState!=='loading') run(); else document.addEventListener('DOMContentLoaded',run);
  })();

  /* ツールページ共通の注意書き: 計算結果が推定値であること・検証環境・最終更新・出典方針を明示。
     .wrap 末尾(フッター前)に1つだけ差し込む。各ツールのJSには触れない。 */
  (function(){
    var P=(location.pathname||'');
    var isStats = P.indexOf('/stats/')>=0 || P.indexOf('/submit/')>=0;
    if(P.indexOf('/tools/')<0 && !isStats) return;
    function injectCss(){
      if(document.getElementById('wos-toolnote-css')) return;
      var s=document.createElement('style'); s.id='wos-toolnote-css';
      s.textContent='.wos-toolnote{margin:18px 0 4px;padding:13px 15px;border:1px solid #e5e7f2;'
        +'border-radius:12px;background:#faf9ff;color:#5b6276;font-size:12px;line-height:1.75}'
        +'.wos-toolnote h3{margin:0 0 6px;font-size:12.5px;color:#1d2233}'
        +'.wos-toolnote a{color:#e85d12;text-decoration:none;font-weight:700}'
        +'.wos-toolnote a:hover{text-decoration:underline}';
      document.head.appendChild(s);
    }
    function run(){
      if(document.querySelector('.wos-toolnote')) return;
      var wrap=document.querySelector('div.wrap'); if(!wrap) return;
      var base=(window.WOS_BASE||'');
      var upd=(window.WOS_PAGE_DATE && window.WOS_PAGE_DATE()) ? window.WOS_PAGE_DATE()[1] : '2026-09-14';
      var html = isStats ? (EN
        ? '<div class="wos-toolnote"><h3>About these statistics (please read)</h3>'
          +'<p>Live figures are aggregated from <b>anonymous, self-reported</b> user submissions over the last 90 days and skew toward this site\'s users. Theoretical builds are <b>model estimates</b> from the simulator\'s formula, not measurements. '
          +'Method: <a href="'+base+'/stats/methodology.html">Methodology</a> · Privacy: <a href="'+base+'/privacy.html">Privacy policy</a> · Change history: <a href="'+base+'/changelog.html">Changelog</a></p></div>'
        : '<div class="wos-toolnote"><h3>統計についての注意（必ずお読みください）</h3>'
          +'<p>実測の数値は利用者の<b>匿名・自己申告</b>による投稿を直近90日で集計したもので、当サイトの利用者に偏ります。理論最適構成はシミュレーターの計算式による<b>推定値</b>であり、実戦の記録ではありません。'
          +'集計方法：<a href="'+base+'/stats/methodology.html">集計方法と計算の前提</a> ／ 取り扱い：<a href="'+base+'/privacy.html">プライバシーポリシー</a> ／ 変更の記録：<a href="'+base+'/changelog.html">更新履歴</a></p></div>')
        : EN
        ? '<div class="wos-toolnote"><h3>About these results (please read)</h3>'
          +'<p>This tool\'s output is an <b>estimate</b> based on public specs and community/our own verification — not a reproduction of the game\'s internal formulas. Absolute values contain error; use the calibration/measurement features to fit them to your own account. Results may change with game updates.</p>'
          +'<p>Verification environment: Server 1567 (Whiteout Survival) · Last updated: '+upd+' · '
          +'How our numbers are checked: <a href="'+base+'/about.html">About</a> · Change history: <a href="'+base+'/changelog.html">Changelog</a></p></div>'
        : '<div class="wos-toolnote"><h3>計算結果についての注意（必ずお読みください）</h3>'
          +'<p>このツールの計算結果は、公開仕様とコミュニティ／当サイトの検証にもとづく<b>推定値</b>であり、ゲーム内部の計算式をそのまま再現したものではありません。絶対値には誤差が含まれます。実測キャリブレーション機能で自分の環境に合わせてご利用ください。ゲームのアップデートにより結果が変わることがあります。</p>'
          +'<p>検証環境：1567サーバー ／ 最終更新：'+upd+' ／ '
          +'数値の検証方法：<a href="'+base+'/about.html">運営者情報</a> ／ 変更の記録：<a href="'+base+'/changelog.html">更新履歴</a></p></div>';
      injectCss();
      var el=document.createElement('div'); el.innerHTML=html;
      var ft=wrap.querySelector(':scope > footer');
      if(ft) wrap.insertBefore(el.firstChild, ft); else wrap.appendChild(el.firstChild);
    }
    if(document.readyState!=='loading') setTimeout(run,0); else document.addEventListener('DOMContentLoaded',function(){setTimeout(run,0);});
  })();
})();
