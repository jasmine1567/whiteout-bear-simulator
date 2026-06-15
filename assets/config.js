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
