/* 公式Xアカウント（@WOS_Japan）の「英雄紹介」投稿 → 世代ページに埋め込んで、どの英雄かを視覚的に示す。
   画像を直接置かず公式投稿の埋め込みにすることで権利面の問題を避ける。
   ブラウザ: window.WOS_HERO_POSTS / Node: require('./hero-posts.js')

   値は投稿の status ID。未確認の英雄は null にしておくと、ページ側は
   「公式Xで検索」リンクにフォールバックする（後から ID を貼るだけで埋め込みに変わる）。

   出典: サイト運営者による公式アカウントの調査（2026-09-02・英雄紹介1〜51）。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WOS_HERO_POSTS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var ACCOUNT = 'WOS_Japan';
  var POSTS = {
    /* ---- 第1世代 ---- */
    jeronimo:   '1735245277551075664',
    natalia:    '1741057537154363392',
    molly:      '1737420311224840557',   /* ジャスミン */
    zinman:     '1737779889498190280',
    /* ---- 第2世代 ---- */
    flint:      '1743935129867931986',
    philly:     '1745388012681498772',   /* フレンダー */
    alonso:     '1748293381548384679',
    /* ---- 第3世代 ---- */
    logan:      '1751552735919694307',
    mia:        '1754112572209659916',
    greg:       '1756619091195105371',
    /* ---- 第4世代 ---- */
    ahmose:     '1759155802642751918',   /* アクモス */
    reina:      '1761692515076276453',
    lynn:       '1763897041959178276',   /* リオン */
    /* ---- 第5世代 ---- */
    hector:     '1766403560550416500',
    nora:       '1768925170838667399',
    gwen:       '1771461890830663922',
    /* ---- 第6世代 ---- */
    wuming:     '1774013705107148987',   /* 無名 */
    renee:      '1776550423563829493',
    wayne:      '1779072042152714639',
    /* ---- 第7世代 ---- */
    edith:      '1781971138509492401',
    gordon:     '1784522950961672665',
    bradley:    '1789581279274426512',
    /* ---- 第8世代 ---- */
    gatot:      '1797191426641727964',
    sonya:      '1792133100111122551',
    hendrik:    '1794669807914332504',
    /* ---- 第9世代 ---- */
    magnus:     '1835242155520204964',
    fred:       '1842852294842266035',
    xura:       '1832705437684359254',   /* シュラ */
    /* ---- 第10世代 ---- */
    gregory:    '1938885084914033141',
    freya:      '1936363464043483564',
    blanchette: '1933811660483125579',
    /* ---- 第11世代 ---- */
    eleonora:   '1949031940667163014',
    lloyd:      '1946495235711717600',
    rufus:      '1951613954955837682',
    /* ---- 第12世代 ---- */
    hervor:     '1961353129837949120',                    /* ヘルヴィル */
    karol:      '1969733348743631116',
    ligeia:     '1959178805505098104',                    /* ライジーア */
    /* ---- 第13世代 ---- */
    gisela:     '1987082671126712542',
    flora:      '1974444397917053044',
    vulcanus:   '1982371624511762551',
    /* ---- 第14世代 ---- */
    elif:       '1994692937486405678',
    dominic:    '2000128629431509023',
    cara:       '1997229537294426191',
    /* ---- 第15世代 ---- */
    hank:       '2025133399779013025',
    estrella:   '2020422357849120903',
    viveca:     '2017523258124620153',
    /* ---- 第16世代 ---- */
    seigel:     '2066083222283292790',                    /* シガー */
    ursar:      '2063184116749918622',                    /* ウルタール */
    aisling:    '2056298751652671779'
    /* 2026-09-02 サイト運営者の調査により全48体分を登録（英雄紹介1〜50）。
       アシュリンは英雄紹介48(2056298751652671779)と51(2086014558712340588)の2投稿があり、48を採用。
       英雄紹介26「リンソウ」は英雄マスタ(heroes.js)に未収録のため対象外。 */
  };
  function url(id) { return POSTS[id] ? 'https://x.com/' + ACCOUNT + '/status/' + POSTS[id] : null; }
  function searchUrl(nameJa) { return 'https://x.com/search?q=' + encodeURIComponent('from:' + ACCOUNT + ' 英雄紹介 ' + nameJa) + '&f=live'; }

  /* 公式wiki（whiteoutsurvival.wiki / Century Games）の英雄ページ。日本語ページのスラッグは基本的に英雄名。例外だけ列挙 */
  var WIKI = 'https://www.whiteoutsurvival.wiki/ja/heroes/';
  var WIKI_SLUG = { wuming: '無名-2', seigel: 'seigel-5', ursar: 'ウルタール-2' };
  function wikiUrl(hero) { if (!hero) return null; return WIKI + encodeURIComponent(WIKI_SLUG[hero.id] || hero.name) + '/'; }
  return { ACCOUNT: ACCOUNT, POSTS: POSTS, url: url, searchUrl: searchUrl, wikiUrl: wikiUrl };
});
