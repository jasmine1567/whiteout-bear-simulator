/* 共通UIヘルパー(JP/EN対応) 全ツール・記事で使用。config.js を先に読むこと */
(function(){
  var L = window.WOS_LANG || 'ja';
  var EN = L==='en';
  var NAV = EN ? {
    brand:"🐻 Whiteout Tools Lab", home:"Home", sim:"Bear Sim", left:"Left-Hero",
    ratio:"Troop Ratio", doctor:"Damage Doctor", guide:"Guides"
  } : {
    brand:"🐻 ホワサバ ツールラボ", home:"ホーム", sim:"熊狩シミュ", left:"左英雄チェッカー",
    ratio:"兵士比率", doctor:"ダメージ診断", guide:"攻略ガイド"
  };
  function langLink(){
    return EN
      ? '<a href="#" onclick="WOS_setLang(\'ja\');return false" style="margin-left:auto;color:var(--ember)">日本語</a>'
      : '<a href="#" onclick="WOS_setLang(\'en\');return false" style="margin-left:auto;color:var(--ember)">English</a>';
  }
  window.WOS_NAV = function(depth){
    var d='../'.repeat(depth);
    return '<nav class="sitenav"><div class="in">'
      +'<a class="brand" href="'+d+'index.html">'+NAV.brand+'</a>'
      +'<a href="'+d+'tools/bear-hunt/index.html">'+NAV.sim+'</a>'
      +'<a href="'+d+'tools/left-hero/index.html">'+NAV.left+'</a>'
      +'<a href="'+d+'tools/troop-ratio/index.html">'+NAV.ratio+'</a>'
      +'<a href="'+d+'tools/damage-doctor/index.html">'+NAV.doctor+'</a>'
      +'<a href="'+d+'guides/bear-hunt-guide.html">'+NAV.guide+'</a>'
      +langLink()
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
})();
