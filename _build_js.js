#!/usr/bin/env node
/* _js/ の原本（コメント付き・読みやすい形）から、公開用の assets/*.js を作る。
   公開用はコメントを取り除いて圧縮する（計算の中身や調整の経緯を外から読み取りにくくするため）。
   使い方: node _build_js.js   ※ _js/ のファイルを直したら必ず実行。assets/ 側の同名ファイルは直接編集しない。
   esbuild は cloudflare/node_modules のものを使う（無ければ cloudflare フォルダで npm install）。 */
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
let esbuild;
for (const p of [path.join(ROOT, 'cloudflare/node_modules/esbuild'), 'esbuild', '/opt/npm-tools/node_modules/esbuild']) {
  try { esbuild = require(p); break; } catch (e) {}
}
if (!esbuild) { console.error('esbuild が見つかりません。cloudflare フォルダで npm install を実行してください。'); process.exit(1); }
const FILES = ['bear-calc.js', 'heroes.js', 'gen-map.js', 'usage.js', 'bear-viz.js', 'bear-ratio.js', 'stats.js'];
for (const f of FILES) {
  const src = fs.readFileSync(path.join(ROOT, '_js', f), 'utf8');
  const out = esbuild.transformSync(src, { minify: true, charset: 'utf8', legalComments: 'none', target: 'es2017' });
  fs.writeFileSync(path.join(ROOT, 'assets', f), out.code);
  console.log(f.padEnd(14), src.length, '->', out.code.length);
}
