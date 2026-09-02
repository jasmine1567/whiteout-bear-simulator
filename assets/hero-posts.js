/* 公式Xアカウント（@WOS_Japan）の「英雄紹介」投稿 → 世代ページに埋め込んで、どの英雄かを視覚的に示す。
   画像を直接置かず公式投稿の埋め込みにすることで権利面の問題を避ける。
   ブラウザ: window.WOS_HERO_POSTS / Node: require('./hero-posts.js')

   値は投稿の status ID。未確認の英雄は null にしておくと、ページ側は
   「公式Xで検索」リンクにフォールバックする（後から ID を貼るだけで埋め込みに変わる）。

   出典: posfie「【ホワサバ公式】英雄紹介攻略投稿まとめ」、note「【ホワサバ公式引用】各世代英雄紹介まとめ」、X検索結果。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WOS_HERO_POSTS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var ACCOUNT = 'WOS_Japan';
  var POSTS = {
    /* ---- 第1世代 ---- */
    jeronimo:   '1735477885581062567',
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
    freya:      null,
    blanchette: null,
    /* ---- 第11世代 ---- */
    eleonora:   null,
    lloyd:      null,
    rufus:      null,
    /* ---- 第12世代 ---- */
    hervor:     null,                    /* ヘルヴィル */
    karol:      '1969733348743631116',
    ligeia:     null,                    /* ライジーア */
    /* ---- 第13世代 ---- */
    gisela:     '1987082671126712542',
    flora:      '1974444397917053044',
    vulcanus:   null,
    /* ---- 第14世代 ---- */
    elif:       null,
    dominic:    null,
    cara:       null,
    /* ---- 第15世代 ---- */
    hank:       null,
    estrella:   null,
    viveca:     null,
    /* ---- 第16世代 ---- */
    seigel:     null,                    /* シガー */
    ursar:      null,                    /* ウルタール */
    aisling:    '2056298751652671779'
    /* 未確認の候補（英雄名が確認できていない公式投稿）:
         1878003929352491159 / 1959178805505098104 / 1994692937486405678 / 1997229537294426191
       中身を確認してから該当英雄の行に貼ってください。 */
  };
  function url(id) { return POSTS[id] ? 'https://x.com/' + ACCOUNT + '/status/' + POSTS[id] : null; }
  function searchUrl(nameJa) { return 'https://x.com/search?q=' + encodeURIComponent('from:' + ACCOUNT + ' 英雄紹介 ' + nameJa) + '&f=live'; }
  return { ACCOUNT: ACCOUNT, POSTS: POSTS, url: url, searchUrl: searchUrl };
});
