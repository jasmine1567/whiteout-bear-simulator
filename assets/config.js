/* ===== 本番サイト確定情報(ここを正とする) ===== */
window.SITE = {
  name_ja: "ホワサバ ツールラボ",
  name_en: "Whiteout Tools Lab",
  url: "https://whitesim-lab.com",
  x: "https://x.com/tegetege_m",
  xHandle: "@tegetege_m",
  owner: "じゃすみん",
  form: "https://docs.google.com/forms/d/e/1FAIpQLSfgqgKKPsBBryezhwaJPBCPCqVBcZZnV48lk-xHru0bTspeKg/viewform",
  hashtags: "ホワサバ,ホワイトアウトサバイバル"
};
/* ===== 言語管理(?lang=en または localStorage で切替) ===== */
window.WOS_LANG = (function(){
  try{
    var q=new URLSearchParams(location.search).get('lang');
    if(q==='en'||q==='ja'){ localStorage.setItem('wos_lang',q); return q; }
    var s=localStorage.getItem('wos_lang'); if(s) return s;
  }catch(e){}
  // ブラウザ言語から初期判定(日本語以外は英語)
  try{ if((navigator.language||'').toLowerCase().indexOf('ja')!==0) return 'en'; }catch(e){}
  return 'ja';
})();
window.WOS_setLang = function(l){
  try{ localStorage.setItem('wos_lang', l); }catch(e){}
  var u=new URL(location.href); u.searchParams.set('lang', l); location.href=u.toString();
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
