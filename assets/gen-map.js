/* ホワサバ 世代マップ・入手経路・課金帯モデル（統計セクション用の設定ファイル）
   ブラウザ: window.WOS_GENMAP / Node: require('./gen-map.js')

   英雄そのものの一覧はここに書かない。/assets/heroes.js（WOS_HEROES）が唯一の出どころで、
   ここには「世代の解放日数」「入手経路」「課金帯モデル」だけを持つ。
   第17世代が来たら UNLOCK に1行、ACQ に1行足すだけでよい。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WOS_GENMAP = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* ===== 各世代の解放日（サーバー開設からの経過日数・推定値） =====
     第2世代以降はおよそ80日間隔。サーバーや運営の調整で前後するため「推定」として扱う。
     出典: スマホゲームNavi「英雄世代の解放スケジュール」/ アルテマ「サーバー経過日数」 */
  var UNLOCK = [
    0,     /* gen 0 : 常設（便宜上） */
    0,     /* gen 1 */
    40,    /* gen 2 */
    120,   /* gen 3 */
    200,   /* gen 4 */
    280,   /* gen 5 */
    360,   /* gen 6 */
    440,   /* gen 7 */
    520,   /* gen 8 */
    600,   /* gen 9 */
    680,   /* gen 10 */
    760,   /* gen 11 */
    840,   /* gen 12 */
    920,   /* gen 13 */
    1000,  /* gen 14 */
    1080,  /* gen 15 */
    1160   /* gen 16 */
  ];
  var MAX = UNLOCK.length - 1;

  /* 経過日数 → その時点で実装済みの最新世代 */
  function genFromDays(days) {
    var d = parseInt(days, 10);
    if (!isFinite(d) || d < 0) return 1;
    for (var g = MAX; g >= 1; g--) if (d >= UNLOCK[g]) return g;
    return 1;
  }
  /* 世代 → その世代環境が続く経過日数の範囲（to が null なら上限なし） */
  function rangeOf(gen) {
    var g = Math.max(1, Math.min(MAX, gen | 0));
    return { from: UNLOCK[g], to: g < MAX ? UNLOCK[g + 1] - 1 : null };
  }

  /* ===== 入手経路 =====
     roulette : ラッキールーレット。各世代1体、弓→盾→槍の3世代周期。無課金でも入手可
     paid     : 初回チャージ / VIP 限定。無課金は入手不可
     event    : ログイン等のイベント配布
     hall     : 上記以外のSSR。英雄殿堂で欠片を集める（時間はかかるが無課金でも可）
     common   : 常設の R / SR
     出典: アルテマ「英雄の入手先まとめ」 */
  var ACQ = {
    /* ルーレット（世代順） */
    zinman: 'roulette',     /* G1  弓 */
    flint: 'roulette',      /* G2  盾 */
    mia: 'roulette',        /* G3  槍 */
    lynn: 'roulette',       /* G4  弓 */
    hector: 'roulette',     /* G5  盾 */
    renee: 'roulette',      /* G6  槍 */
    bradley: 'roulette',    /* G7  弓 */
    gatot: 'roulette',      /* G8  盾 */
    fred: 'roulette',       /* G9  槍 */
    blanchette: 'roulette', /* G10 弓 */
    eleonora: 'roulette',   /* G11 盾 */
    karol: 'roulette',      /* G12 槍 */
    vulcanus: 'roulette',   /* G13 弓 */
    elif: 'roulette',       /* G14 盾 */
    estrella: 'roulette',   /* G15 槍 */
    aisling: 'roulette',    /* G16 弓 */
    /* 課金限定 */
    natalia: 'paid',        /* 初回チャージ / VIP1-6 */
    jeronimo: 'paid',       /* VIP7-12 */
    /* イベント配布 */
    molly: 'event'          /* ジャスミン: 7日間ログイン */
  };
  function acqOf(hero) {
    if (!hero) return 'common';
    if (ACQ[hero.id]) return ACQ[hero.id];
    return hero.rar === 'SSR' ? 'hall' : 'common';
  }

  /* ===== 課金帯モデル（理論ソルバーのプリセット） =====
     hallSlots : 3枠のうち「英雄殿堂で集める必要があるSSR」を何体まで使えるか
     paid      : 課金限定英雄を使えるか
     gear/fc/tier/base : 英雄装備・領主装備・宝石などの差を丸めた前提値
     ※ 数値は暫定。実測が集まったら各課金帯の中央値に置き換える。 */
  var TIERS = {
    f2p:   { key: 'f2p',   label: '無課金・微課金', label_en: 'F2P / light spender',
             hallSlots: 1, paid: false, gear: 1,  fc: 2, tier: 10,
             base: { team: { a: 70,  l: 45  }, per: { a: 35, l: 22 } } },
    mid:   { key: 'mid',   label: '中課金',        label_en: 'Mid spender',
             hallSlots: 2, paid: true,  gear: 5,  fc: 5, tier: 11,
             base: { team: { a: 110, l: 75  }, per: { a: 55, l: 38 } } },
    whale: { key: 'whale', label: '石油王',        label_en: 'Whale',
             hallSlots: 3, paid: true,  gear: 10, fc: 10, tier: 12,   /* 石油王＝全ステータスMAX（専用装備Lv10・火晶Lv10・T12）*/
             base: { team: { a: 160, l: 110 }, per: { a: 80, l: 55 } } }
  };
  var TIER_ORDER = ['f2p', 'mid', 'whale'];

  /* その課金帯・その世代で「使える」英雄か */
  function usable(hero, gen, tier) {
    if (!hero || hero.gen > gen) return false;
    var a = acqOf(hero);
    if (a === 'paid' && !tier.paid) return false;
    return true;
  }
  /* 3枠のうち英雄殿堂枠を消費する英雄の数 */
  function hallCount(heroes) {
    var n = 0;
    for (var i = 0; i < heroes.length; i++) if (acqOf(heroes[i]) === 'hall') n++;
    return n;
  }

  /* 理論ソルバーで内部固定する兵種比率（ページには表示しない） */
  var SOLVER_RATIO = [1, 4, 95];
  /* 参加者は標準セットで固定 */
  var SOLVER_JOINER = [
    { heroId: 'jessie', lv: 5 }, { heroId: 'jasser', lv: 5 },
    { heroId: 'seoyoon', lv: 5 }, { heroId: 'wayne', lv: 5 }
  ];

  return {
    UNLOCK: UNLOCK, MAX: MAX, genFromDays: genFromDays, rangeOf: rangeOf,
    ACQ: ACQ, acqOf: acqOf,
    TIERS: TIERS, TIER_ORDER: TIER_ORDER, usable: usable, hallCount: hallCount,
    SOLVER_RATIO: SOLVER_RATIO, SOLVER_JOINER: SOLVER_JOINER
  };
});
