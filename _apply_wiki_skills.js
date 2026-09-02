#!/usr/bin/env node
/* _data/skills-from-wiki.js の内容を assets/heroes.js の該当英雄（スキル未登録の1行エントリ）に書き込む。
   実行後: node _solve_theory.js → python3 _build_stats.py … の順で再ビルド。 */
const fs = require('fs');
const S = require('./_data/skills-from-wiki.js');
let src = fs.readFileSync('assets/heroes.js', 'utf8');
const fmt = v => JSON.stringify(v).replace(/"([a-zA-Z_]+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ').replace(/\{/g, '{ ').replace(/\}/g, ' }');
let n = 0;
for (const [id, def] of Object.entries(S)) {
  const re = new RegExp(`^(\\s*)\\{ id: "${id}", name: "([^"]+)", cls: "(\\w+)", gen: (\\d+), rar: "(\\w+)" \\},?$`, 'm');
  const m = src.match(re);
  if (!m) { console.error('1行エントリが見つからない（既に登録済み?）:', id); continue; }
  const ind = m[1];
  const lines = [`${ind}{`, `${ind}  id: "${id}",`, `${ind}  name: "${m[2]}",`, `${ind}  cls: "${m[3]}",`, `${ind}  gen: ${m[4]},`, `${ind}  rar: "${m[5]}",`,
    `${ind}  /* 集結主/乗りスキル: 公式wiki(whiteoutsurvival.wiki)の遠征スキル原文からモデル化 2026-09-02 */`];
  if (def.bearNoEffect) lines.push(`${ind}  bearNoEffect: true,`);
  if (def.gear) lines.push(`${ind}  gear: ${fmt(def.gear)},`);
  if (def.gearNote) lines.push(`${ind}  gearNote: '${def.gearNote}',`);
  if (def.joiner !== undefined) lines.push(`${ind}  joiner: ${def.joiner ? fmt(def.joiner) : 'null'},`);
  if (def.leader) lines.push(`${ind}  leader: ${fmt(def.leader)},`);
  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  lines.push(`${ind}},`);
  src = src.replace(re, lines.join('\n'));
  n++;
}
fs.writeFileSync('assets/heroes.js', src);
console.log('heroes.js を更新:', n, '体');
