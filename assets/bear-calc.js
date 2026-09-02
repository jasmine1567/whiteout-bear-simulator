/* ホワサバ熊狩 ダメージ計算コア（共有モジュール）
   tools/bear-hunt/index.html から数式を無改変で切り出したもの。
   ブラウザ: window.WOS_CALC / Node: require('./bear-calc.js')

   createEngine(cfg, heroes, leaderSel, joinerSel).score(mode, opts)
     cfg        … 上級者パラメータと入力欄の値（文字列/数値どちらでも可）
     heroes     … WOS_HEROES 相当の配列
     leaderSel  … [{heroId,lv,gear} x3]（opts で上書き可）
     joinerSel  … [{heroId,lv} x4]（opts で上書き可）
     mode       … 'ev' | 'min' | 'max'
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WOS_CALC = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* index.html の上級者パラメータ input の value 属性と同値。
     ここを唯一の既定値の出どころにする（フォールバック値をハードコードしない）。 */
  var DEFAULTS = {
    betaA: '0.93', betaL: '1.00', kFactor: '0.63', p0: '0.2905',
    tierGrowth: '1.15', t12Bonus: '1.18', fcGrowth: '1.08',
    wI: '0.25', wL: '0.78', wM: '1.00', pI: '0.91', pL: '0.90',
    crowdDecay: '0.8', crowdRef: '40000', heroRate: '100',
    spAtk: '0', spLeth: '0', trapBonus: '25',
    tier: '', fcLevel: '', cyril: '', cyrilOverride: '',
    teamAtk: '', teamLeth: '', atkInf: '', lethInf: '',
    atkLan: '', lethLan: '', atkMks: '', lethMks: '',
    nInf: '20000', nLan: '60000', nMks: '120000',
    petAtk: '', petLeth: '', buffItem: '', buffLeth: '',
    petDefDown: '', buffDef: ''
  };

  function createEngine(cfg, heroes, leaderSel, joinerSel) {
    cfg = cfg || {};
    /* index.html の module スコープ定数（L1041, L1512 相当） */
    var n = 10;
    var i = [[1, 260.2], [3, 290.23], [7, 650.52], [16, 2131.7]];
    var r = [0, 2, 4, 6, 9, 12, 15, 18, 21, 24, 27, 30];
    var l = heroes;
    var u = { leader: leaderSel || [], joiner: joinerSel || [] };
    var h = function (id) { return l.find(function (x) { return x.id === id; }); };
    var b = function (e) { var v = parseFloat(e); return isFinite(v) ? v : 0; };

  /* --- c : index.html L1517-1531 より（数式は無改変） --- */
function c(e) {
  if ("number" == typeof e.expAtk) return e.expAtk;
  if ("R" === e.rar) return 100;
  if ("SR" === e.rar) return 140.11;
  const n = Math.max(1, Math.min(16, e.gen || 1));
  for (let e = 0; e < i.length - 1; e++) {
    const [t, a] = i[e],
      [r, l] = i[e + 1];
    if (n >= t && n <= r) {
      const e = (n - t) / (r - t);
      return a * Math.pow(l / a, e);
    }
  }
  return 260.2;
}

  /* --- d : index.html L1532-1534 より（数式は無改変） --- */
function d(e) {
  return "number" == typeof e.expLeth ? e.expLeth : "SSR" !== e.rar ? 0 : 0.2412 * c(e);
}

  /* --- j : index.html L1595-1659 より（数式は無改変） --- */
function j(e, t, a, r, l) {
  const s = (e, n, t) => ("min" === l ? e : "max" === l ? t : n);
  switch (e.k) {
    case "dmg":
      return 1 + e.v * t;
    case "ndmg":
      return 1 + e.v * t * 0.8;
    case "defdown": {
      var dEff = e.eff !== undefined ? e.eff : 0.5;
      var dv = e.v * t * dEff;
      dv = dv < 0 ? 0 : dv > 0.9 ? 0.9 : dv;
      return 1 / (1 - dv);
    }
    case "atk":
      return 1 + r.bA * e.v * t;
    case "leth":
      return 1 + r.bL * e.v * t;
    case "flat":
      return 1 + (e.m - 1) * t;
    case "chance":
      return s(1, 1 + e.p * e.v * t, 1 + e.v * t);
    case "chanceLeth":
      return s(1, 1 + r.bL * e.p * e.v * t, 1 + r.bL * e.v * t);
    case "chanceUptime": {
      var __up = 1 - Math.pow(1 - e.p, e.dur);
      return s(1, 1 + __up * e.v * t, 1 + e.v * t);
    }
    case "periodic":
      return 1 + (Math.floor(n / e.per) * e.v * t) / n;
    case "uptime":
      return 1 + (e.v * t * Math.min(n, Math.floor(n / e.per) * e.dur)) / n;
    case "tDmg": {
      const n = "im" === e.cls ? a.inf + a.mks : a[e.cls];
      return 1 + e.v * t * n;
    }
    case "tAtk": {
      const n = "im" === e.cls ? a.inf + a.mks : a[e.cls];
      return 1 + r.bA * e.v * t * n;
    }
    case "tPeriodic":
      return 1 + ((Math.floor(n / e.per) * e.v * t) / n) * a[e.cls];
    case "tUptime":
      return 1 + ((e.v * t * Math.min(n, Math.floor(n / e.per) * e.dur)) / n) * a[e.cls];
    case "tChance": {
      const n = a[e.cls];
      return s(1, 1 + e.p * e.v * t * n, 1 + e.v * t * n);
    }
    case "hector": {
      const r = (e) => {
        let t = 0;
        for (let a = 0; a < n; a++) {
          var d = a < 5 ? Math.pow(0.2, a) : 0;
          t += e * d;
        }
        return t / n;
      };
      var __im = a.inf + a.mks;
      return (
        (1 + a.inf * r(e.infV * t) + a.mks * r(e.mksV * t)) *
        s(1, 1 + __im * e.blitzP * e.blitzV * t, 1 + __im * e.blitzV * t)
      );
    }
  }
  return 1;
}

  /* --- C : index.html L1690-1697 より（数式は無改変） --- */
function C() {
  return {
    team: { a: b(cfg.teamAtk) || 0, l: b(cfg.teamLeth) || 0 },
    inf: { a: b(cfg.atkInf), l: b(cfg.lethInf) },
    lan: { a: b(cfg.atkLan), l: b(cfg.lethLan) },
    mks: { a: b(cfg.atkMks), l: b(cfg.lethMks) },
  };
}

  /* --- I : index.html L1698-1715 より（数式は無改変） --- */
function I(e) {
  const n = b(cfg.heroRate) / 100,
    t = { inf: { a: 0, l: 0 }, lan: { a: 0, l: 0 }, mks: { a: 0, l: 0 } };
  return (
    (e || u.leader).forEach((e) => {
      if (!e) return;
      const a = h(e.heroId);
      if (!a) return;
      ((t[a.cls].a += c(a) * n), (t[a.cls].l += d(a) * n));
      if (a.gearStat) {
        const gl = e.gear || 0,
          gf = gl / 10;
        (a.gearStat.a && (t[a.cls].a += a.gearStat.a * gf), a.gearStat.l && (t[a.cls].l += a.gearStat.l * gf));
      }
    }),
    t
  );
}

  /* --- w : index.html L1716-1728 より（数式は無改変） --- */
function w(e, n) {
  const a = {},
    pa = b(cfg.petAtk) || 0,
    pl = b(cfg.petLeth) || 0,
    bi = b(cfg.buffItem) || 0,
    bl = b(cfg.buffLeth) || 0;
  return (
    ["inf", "lan", "mks"].forEach((n) => {
      a[n] = { a: e.team.a + e[n].a + pa + bi, l: e.team.l + e[n].l + pl + bl };
    }),
    a
  );
}

  /* --- E : index.html L1729-1731 より（数式は無改変） --- */
function E() {
  return { bA: b(cfg.betaA) || 0.93, bL: b(cfg.betaL) || 1 };
}

  /* --- T : index.html L1732-1735 より（数式は無改変） --- */
function T(e) {
  const n = Math.max(1, e.inf + e.lan + e.mks);
  return { inf: e.inf / n, lan: e.lan / n, mks: e.mks / n };
}

  /* --- A : index.html L1736-1746 より（数式は無改変） --- */
function A(e) {
  const n = { inf: b(cfg.wI) || 0.25, lan: b(cfg.wL) || 0.78, mks: b(cfg.wM) || 1 };
  return (
    (e || u.leader).forEach((e) => {
      if (!e) return;
      const t = h(e.heroId);
      if (t && t.syn) for (const e in t.syn) n[e] += t.syn[e];
    }),
    n
  );
}

  /* --- N : index.html L1747-1751 より（数式は無改変） --- */
function N(e, n) {
  if (!e.gear || !n) return 0;
  const tbl = [0, 0, 0.05, 0.05, 0.075, 0.075, 0.1, 0.1, 0.125, 0.125, 0.15];
  return tbl[Math.max(0, Math.min(10, n))] || 0;
}

  /* --- F : index.html L1752-1765 より（数式は無改変） --- */
function F(e) {
  let n = 1;
  return (
    (e || u.leader).forEach((e) => {
      if (!e) return;
      const t = h(e.heroId);
      if (t) {
        const a = N(t, e.gear || 0);
        a > 0 && (n *= 1 + a);
      }
    }),
    n
  );
}

  /* --- P : index.html L1766-1867 より（数式は無改変） --- */
function P(e, n) {
  n = n || {};
  const t = E(),
    a = n.counts || { inf: b(cfg.nInf), lan: b(cfg.nLan), mks: b(cfg.nMks) },
    r = T(a),
    l = n.stats || C(),
    s = n.leader || u.leader,
    o = n.joiner || u.joiner,
    i = w(l, s),
    c = void 0 !== n.tier ? n.tier : b(cfg.tier) || 1,
    d =
      Math.pow(b(cfg.tierGrowth) || 1.15, c - 1) *
      (c >= 12 ? b(cfg.t12Bonus) || 1.18 : 1) *
      Math.pow(b(cfg.fcGrowth) || 1.08, void 0 !== n.fc ? n.fc : parseInt(cfg.fcLevel) || 0),
    p = void 0 !== n.trap ? n.trap : b(cfg.trapBonus) / 100,
    m = b(cfg.kFactor) || 0.63,
    v = b(cfg.p0) || 0.2905,
    g = b(cfg.spAtk) / 100,
    f = b(cfg.spLeth) / 100,
    S = void 0 !== n.cyril ? n.cyril : H(),
    y = A(s),
    x = {};
  let R = 0;
  var rho = b(cfg.crowdDecay);
  rho = isFinite(rho) && rho > 0 ? rho : 1;
  var Nref = b(cfg.crowdRef) || 40000;
  ["inf", "lan", "mks"].forEach((e) => {
    const ne = a[e] > 0 ? a[e] * Math.pow(a[e] / Nref, rho - 1) : 0,
      n = ne * y[e] * (1 + (t.bA * i[e].a) / 100) * (1 + (t.bL * i[e].l) / 100);
    ((x[e] = n), (R += n));
  });
  let j = 1;
  (a.inf <= 0 && (j *= b(cfg.pI) || 0.91), a.lan <= 0 && (j *= b(cfg.pL) || 0.9));
  var __ADD = {
    dmg: 1,
    ndmg: 1,
    atk: 1,
    leth: 1,
    tDmg: 1,
    tAtk: 1,
    defdown: 1,
    flat: 1,
    chance: 1,
    chanceLeth: 1,
    chanceUptime: 1,
    periodic: 1,
    uptime: 1,
    tPeriodic: 1,
    tUptime: 1,
    tChance: 1,
  };
  function __acc(list, kind, ab) {
    var ml = 1;
    list.forEach(function (sl) {
      if (!sl) return;
      var hr = h(sl.heroId),
        sk = hr && hr[kind];
      if (hr && hr.bearNoEffect) return;
      if (!sk || !sk.parts) return;
      var lv = sl.lv / 5;
      sk.parts.forEach(function (p) {
        var mt = __JSKILL(p, lv, r, t, e);
        if (__ADD[p.k] || p.tag) {
          var sg = p.tag ? p.tag : p.k + (p.cls ? ":" + p.cls : "");
          ab[sg] = (ab[sg] || 0) + (mt - 1);
        } else {
          ml *= mt;
        }
      });
    });
    return ml;
  }
  var abL = {},
    mlL = __acc(s, "leader", abL);
  var mLeader = mlL;
  for (var sg in abL) {
    mLeader *= 1 + abL[sg];
  }
  var abAll = JSON.parse(JSON.stringify(abL)),
    mlAll = mlL * __acc(o, "joiner", abAll);
  var mAll = mlAll;
  for (var sg in abAll) {
    mAll *= 1 + abAll[sg];
  }
  const L = mLeader,
    M = mLeader > 0 ? mAll / mLeader : 1;
  var dd = ((b(cfg.petDefDown) || 0) + (b(cfg.buffDef) || 0)) / 100;
  dd = dd < 0 ? 0 : dd > 0.9 ? 0.9 : dd;
  const ddMul = 1 / (1 - dd);
  const I = (1 + t.bA * p) * (1 + g) * (1 + f) * F(s) * ddMul,
    N = v * j * d * L * M * I * m * (1 + S / 100);
  return {
    score: N * R,
    neff: R * j,
    mL: L,
    mJ: M,
    mExtra: I,
    zeroPen: j,
    tot: i,
    perClassScore: { inf: N * x.inf, lan: N * x.lan, mks: N * x.mks },
  };
}

  /* --- H : index.html L1868-1871 より（数式は無改変） --- */
function H() {
  const e = parseFloat(cfg.cyrilOverride);
  return isNaN(e) ? r[parseInt(cfg.cyril) || 0] : e;
}

    var __JSKILL = j;

    return {
      score: P,          /* P : 1ラリーの期待ダメージ */
      expAtk: c,         /* c : 英雄の遠征攻撃ステ */
      expLeth: d,        /* d : 英雄の遠征殺傷ステ */
      skillPart: j,      /* j : スキル1パーツの倍率 */
      stats: C,          /* C : 入力ステータスの読み出し */
      heroStats: I,      /* I : 英雄の遠征ステを兵種別に合算（現行ツールでは未使用） */
      statsCombine: w,   /* w : 部隊+兵種別+ペット+バフの合算 */
      betas: E,          /* E : βA/βL */
      ratio: T,          /* T : 兵種比率 */
      weights: A,        /* A : 兵種重み+シナジー */
      gearTable: N,      /* N : 専用装備Lv→倍率 */
      gearMul: F,        /* F : 専用装備の合成倍率 */
      cyril: H           /* H : シリル天賦補正 */
    };
  }

  return { DEFAULTS: DEFAULTS, createEngine: createEngine };
});
