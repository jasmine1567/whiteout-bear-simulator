#!/usr/bin/env node
/* 理論最適構成ソルバー
   世代 × 課金帯 ごとに、盾×槍×弓 の全組み合わせを総当たりして上位を assets/theory.json に書き出す。

   実行: node _solve_theory.js
   入力: assets/heroes.js（英雄マスタ）/ assets/gen-map.js（世代・入手経路・課金帯）/ assets/bear-calc.js（計算コア）
   出力: assets/theory.json

   前提（methodology.html に明記すること）:
   - 計算式は熊狩シミュレーターと同一（bear-calc.js）。係数の既定値は CALC.DEFAULTS（= input の value 属性）
   - 英雄の遠征ステータスは加算する（applyHeroStats）。シミュレーターの「かんたん入力」とは前提が異なる
   - 兵種比率は GENMAP.SOLVER_RATIO で固定し、英雄の組み合わせだけを比較する
   - 参加者は GENMAP.SOLVER_JOINER で固定
   - 課金帯ごとの装備・火晶・素ステは GENMAP.TIERS の暫定値 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = __dirname;
const CALC = require(path.join(ROOT, 'assets/bear-calc.js'));
const GM = require(path.join(ROOT, 'assets/gen-map.js'));

/* heroes.js はブラウザ用（window.WOS_HEROES）なので vm で読む */
const sb = { console }; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/heroes.js'), 'utf8'), sb);
const HEROES = sb.window.WOS_HEROES;
const byId = Object.fromEntries(HEROES.map(h => [h.id, h]));

const RATIO = GM.SOLVER_RATIO, JOINER = GM.SOLVER_JOINER, TOTAL = 100000;
const counts = { inf: TOTAL * RATIO[0] / 100, lan: TOTAL * RATIO[1] / 100, mks: TOTAL * RATIO[2] / 100 };
const TOP_N = 10;

function evalComp(ids, tier) {
  const leader = ids.map(id => ({ heroId: id, lv: 5, gear: tier.gear }));
  const cfg = Object.assign({}, CALC.DEFAULTS, { tier: String(tier.tier), fcLevel: String(tier.fc) });
  const eng = CALC.createEngine(cfg, HEROES, leader, JOINER);
  const add = eng.heroStats(leader);                    /* 遠征ステを加算（ソルバー専用） */
  const stats = { team: { a: tier.base.team.a, l: tier.base.team.l } };
  ['inf', 'lan', 'mks'].forEach(c => { stats[c] = { a: tier.base.per.a + add[c].a, l: tier.base.per.l + add[c].l }; });
  return eng.score('ev', { counts, stats, leader, joiner: JOINER }).score;
}

function solve(gen, tier) {
  const pool = cls => HEROES.filter(h => h.cls === cls && GM.usable(h, gen, tier));
  const out = [];
  const best = { inf: {}, lan: {}, mks: {} };            /* 枠別: その英雄を置いたときの最高スコア */
  for (const a of pool('inf')) for (const b of pool('lan')) for (const c of pool('mks')) {
    if (GM.hallCount([a, b, c]) > tier.hallSlots) continue;
    const sc = evalComp([a.id, b.id, c.id], tier);
    out.push({ ids: [a.id, b.id, c.id], score: sc });
    if (!(best.inf[a.id] > sc)) best.inf[a.id] = sc;
    if (!(best.lan[b.id] > sc)) best.lan[b.id] = sc;
    if (!(best.mks[c.id] > sc)) best.mks[c.id] = sc;
  }
  out.sort((x, y) => y.score - x.score);
  const top1 = out.length ? out[0].score : 1;
  const slotRank = {};
  for (const cls of ['inf', 'lan', 'mks']) {
    slotRank[cls] = Object.entries(best[cls]).sort((x, y) => y[1] - x[1])
      .map(([id, sc], i) => ({ id, rank: i + 1, index: Math.round(sc / top1 * 100) }));
  }
  return { evaluated: out.length, top: out.slice(0, TOP_N), slotRank };
}

const t0 = Date.now();
const result = {
  generatedAt: new Date().toISOString(),
  model: { ratio: RATIO, joiner: JOINER.map(j => j.heroId), totalTroops: TOTAL, applyHeroStats: true,
           defaults: CALC.DEFAULTS, note: '計算式は熊狩シミュレーターと同一。推定値であり実戦の記録ではない。' },
  tiers: GM.TIER_ORDER.map(k => ({ key: k, label: GM.TIERS[k].label, label_en: GM.TIERS[k].label_en,
           hallSlots: GM.TIERS[k].hallSlots, paid: GM.TIERS[k].paid, gear: GM.TIERS[k].gear,
           fc: GM.TIERS[k].fc, tier: GM.TIERS[k].tier })),
  gens: {}
};

for (let g = 1; g <= GM.MAX; g++) {
  const range = GM.rangeOf(g);
  const entry = { gen: g, unlockDay: GM.UNLOCK[g], rangeFrom: range.from, rangeTo: range.to,
    heroes: HEROES.filter(h => h.gen === g).map(h => ({ id: h.id, cls: h.cls, acq: GM.acqOf(h) })),
    byTier: {} };
  for (const tk of GM.TIER_ORDER) {
    const r = solve(g, GM.TIERS[tk]);
    entry.byTier[tk] = { evaluated: r.evaluated, top: r.top.map(t => ({ ids: t.ids, score: Math.round(t.score) })), slotRank: r.slotRank };
  }
  result.gens[g] = entry;
}

/* 次世代予測: 第N世代の最適解 → 第N+1世代の最適解 で、どの枠が入れ替わるか */
for (let g = 1; g < GM.MAX; g++) {
  for (const tk of GM.TIER_ORDER) {
    const cur = result.gens[g].byTier[tk].top[0], nxt = result.gens[g + 1].byTier[tk].top[0];
    if (!cur || !nxt) continue;
    const changed = ['inf', 'lan', 'mks'].filter((_, i) => cur.ids[i] !== nxt.ids[i]);
    result.gens[g].byTier[tk].next = {
      gen: g + 1, from: cur.ids, to: nxt.ids, changed,
      gainPct: Math.round((nxt.score / cur.score - 1) * 1000) / 10
    };
  }
}

/* 英雄ごとの評価データ: 各世代環境・各課金帯での枠別順位（英雄評価と「何世代まで1位を保つか」に使う） */
result.heroes = {};
HEROES.forEach(h => {
  if (h.gen === 0) return;
  const rec = { id: h.id, cls: h.cls, gen: h.gen, acq: GM.acqOf(h),
    leaderSkill: h.leader ? h.leader.label : null, joinerSkill: h.joiner ? h.joiner.label : null,
    bearNoEffect: !!h.bearNoEffect, ranks: {} };
  for (let g = h.gen; g <= GM.MAX; g++) {
    rec.ranks[g] = {};
    for (const tk of GM.TIER_ORDER) {
      const sr = result.gens[g].byTier[tk].slotRank[h.cls].find(x => x.id === h.id);
      rec.ranks[g][tk] = sr ? { rank: sr.rank, of: result.gens[g].byTier[tk].slotRank[h.cls].length, index: sr.index } : null;
    }
  }
  result.heroes[h.id] = rec;
});
fs.writeFileSync(path.join(ROOT, 'assets/theory.json'), JSON.stringify(result, null, 1));
/* Worker 用の軽量英雄マスタ（投稿の妥当性チェックに使う）も同時に出力して同期を保つ */
fs.mkdirSync(path.join(ROOT, 'cloudflare/src'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'cloudflare/src/heroes-min.json'),
  JSON.stringify(HEROES.map(h => ({ id: h.id, name: h.name, cls: h.cls, gen: h.gen, rar: h.rar }))));
const ms = Date.now() - t0;
const nm = id => byId[id].name + '(G' + byId[id].gen + ')';
console.log(`assets/theory.json を出力（${ms}ms）`);
for (const g of [1, 8, 16]) {
  console.log(`\n第${g}世代環境`);
  for (const tk of GM.TIER_ORDER) {
    const b = result.gens[g].byTier[tk];
    const t = b.top[0];
    const nx = b.next ? `  → 次世代: ${b.next.changed.map(c => ({ inf: '盾', lan: '槍', mks: '弓' })[c]).join('') || '変化なし'} ${b.next.gainPct >= 0 ? '+' : ''}${b.next.gainPct}%` : '';
    console.log(`  ${GM.TIERS[tk].label.padEnd(8)} 盾${nm(t.ids[0])} 槍${nm(t.ids[1])} 弓${nm(t.ids[2])}  ${t.score.toLocaleString()}${nx}`);
  }
}
