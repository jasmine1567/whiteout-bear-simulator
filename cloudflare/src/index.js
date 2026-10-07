/* whitesim-lab.com 統計API（Cloudflare Worker）
   POST   /v1/usage           シミュレーターの利用データを自動記録（匿名ID×世代ごとに1件・上書き。非現実的な入力は flagged にして集計から除外）
   DELETE /v1/usage           {cid} の利用データを削除（「統計に使わない」を選んだとき）
   POST   /v1/submit          構成を投稿（Turnstile検証・妥当性チェック・同日同一クライアントは上書き）
   DELETE /v1/submit/:id      編集キーで自分の投稿を削除
   GET    /v1/stats/summary   全世代のサンプル数（ハブ用）
   GET    /v1/stats/:gen      その世代の集計（KVから。無ければその場で集計）
   GET    /v1/reviews/:gen    その世代の口コミ（投稿フォームの「ひとこと」付き投稿。新しい順・D1 から）
   POST   /v1/report/:id      口コミを通報（同一クライアントから1回。REPORT_HIDE 件で自動非表示）
   GET    /v1/admin/reviews   運営者用: 口コミ一覧（?key=ADMIN_KEY&status=all|ok|hidden|reported）
   POST   /v1/admin/reviews/:id  運営者用: {key, action:'hide'|'show'}
   cron   毎日 20:00 UTC      D1 を集計して KV に書き出す

   データはすべて匿名。IP は塩付きハッシュのみ保存し、レート制限にだけ使う。 */
import GM from '../../assets/gen-map.js';
import HEROES from './heroes-min.json';
import THEORY from '../../assets/theory.json';

const byId = Object.fromEntries(HEROES.map(h => [h.id, h]));
const CLS = ['inf', 'lan', 'mks'];
const TIERS = new Set(GM.TIER_ORDER);

/* ---------- 共通 ---------- */
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });

function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  const ok = allowed.includes(origin);
  return {
    'access-control-allow-origin': ok ? origin : allowed[0] || '',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}
async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const randHex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;          /* 未設定なら検証をスキップ（開発用） */
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip || '' });
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  return !!j.success;
}

/* ---------- 投稿の検証 ---------- */
function validate(b) {
  const e = [];
  /* 世代は「gen（1〜MAX）」で受ける。互換のため「days（経過日数）」も受け付け、DB には経過日数で保存する */
  let days = null, gen = null;
  const g = int(b.gen, 1, GM.MAX);
  if (g !== null) { gen = g; days = GM.UNLOCK[g]; }
  else { days = int(b.days, 0, 5000); if (days === null) e.push('gen'); else gen = GM.genFromDays(days); }
  const tier = TIERS.has(b.tier) ? b.tier : null; if (!tier) e.push('tier');
  const heroes = {};
  for (const c of CLS) {
    const h = byId[b[c]];
    if (!h) { e.push(c); continue; }
    if (h.cls !== c) e.push(c + ':cls');                 /* 弓枠に盾英雄など */
    else if (gen !== null && h.gen > gen) e.push(c + ':gen'); /* まだ実装されていない英雄 */
    heroes[c] = h;
  }
  let ratio = null;
  if (Array.isArray(b.ratio) && b.ratio.length === 3) {
    const r = b.ratio.map(v => int(v, 0, 100));
    if (r.every(v => v !== null) && r.reduce((a, v) => a + v, 0) === 100) ratio = r; else e.push('ratio');
  }
  const damage = b.damage == null || b.damage === '' ? null : int(b.damage, 0, 1e12);
  if (b.damage != null && b.damage !== '' && damage === null) e.push('damage');
  const fc = b.fc == null || b.fc === '' ? null : int(b.fc, 0, 20);
  let gear = [null, null, null];
  if (Array.isArray(b.gear) && b.gear.length === 3) gear = b.gear.map(v => v == null || v === '' ? null : int(v, 0, 10));
  /* 口コミ（ひとこと）と表示名。どちらも任意。URL・NGワードは弾く */
  const comment = cleanText(b.comment, 200), nick = cleanText(b.nick, 16).replace(/\n/g, ' ');
  if (comment && textProblem(comment, b.ngWords)) e.push('comment:' + textProblem(comment, b.ngWords));
  if (nick && textProblem(nick, b.ngWords)) e.push('nick:' + textProblem(nick, b.ngWords));
  const showDamage = (b.showDamage === false || b.showDamage === 0 || b.showDamage === '0') ? 0 : 1;   /* 口コミにダメージを出すか（既定: 出す） */
  return { errors: e, days, tier, gen, heroes, ratio, damage, fc, gear, comment: comment || null, nick: nick || null, showDamage };
}
/* 制御文字を除き、空白を整え、長さを切る */
export function cleanText(v, max) {
  if (v == null) return '';
  return String(v).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}
const URL_RE = /https?:\/\/|www\.|\.(com|net|jp|io|co|me|ly|gg)\b|t\.co\//i;
const DEFAULT_NG = ['死ね', '氏ね', '殺す', 'ころす', 'きもい', 'キモい', 'カス', 'クズ', 'ゴミ', 'バカ', 'アホ', '池沼', 'ガイジ', '出会い', '副業', '稼げる', 'LINE@', '無料配布', 'fuck', 'shit', 'bitch', 'nigger', 'cunt'];
export function textProblem(text, extraNg) {
  if (URL_RE.test(text)) return 'url';
  const ng = DEFAULT_NG.concat(String(extraNg || '').split(',').map(s => s.trim()).filter(Boolean));
  const low = text.toLowerCase();
  if (ng.some(w => w && low.includes(w.toLowerCase()))) return 'ng';
  return null;
}

/* ---------- 利用データ（シミュレーターからの自動記録） ---------- */
const STAT_KEYS = ['teamAtk', 'teamLeth', 'atkInf', 'lethInf', 'atkLan', 'lethLan', 'atkMks', 'lethMks'];
/* 個人情報保護の同意が必要な地域（EEA・英国・スイス）からは記録しない（サイトの同意モードと同じ扱い） */
const NO_LOG = new Set('AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE,IS,LI,NO,GB,CH'.split(','));
/* 「現実的な入力」の範囲。wrangler.toml の [vars] で上書きできる */
export function usageLimits(env = {}) {
  const n = (k, d) => { const v = parseFloat(env[k]); return Number.isFinite(v) ? v : d; };
  return {
    statMax: n('USAGE_STAT_MAX', 3000),        /* 攻撃%・殺傷% 1項目の上限 */
    statSumMin: n('USAGE_STAT_SUM_MIN', 50),   /* 8項目の合計の下限（ほぼ未入力を除外） */
    troopsMin: n('USAGE_TROOPS_MIN', 1000),    /* 兵士の合計数 */
    troopsMax: n('USAGE_TROOPS_MAX', 3000000),
    damageMax: n('USAGE_DAMAGE_MAX', 5e10),    /* 予測ダメージの上限 */
    perIpDaily: n('USAGE_PER_IP_DAILY', 40)    /* 同じIPから1日に新しく作れる記録の数 */
  };
}
const num = (v, lo, hi) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
/* 形式チェック（壊れた・あり得ないデータは保存しない） */
export function validateUsage(b) {
  const e = [];
  if (!b || typeof b !== 'object') return { errors: ['json'] };
  const cid = typeof b.cid === 'string' && /^[a-f0-9]{32}$/.test(b.cid) ? b.cid : null; if (!cid) e.push('cid');
  const gen = int(b.gen, 1, GM.MAX); if (gen === null) e.push('gen');
  const heroes = {}, gear = {};
  const L = b.leader && typeof b.leader === 'object' ? b.leader : {};
  for (const c of CLS) {
    const x = L[c] && typeof L[c] === 'object' ? L[c] : {}, h = byId[x.id];
    if (!h) { e.push(c); continue; }
    if (h.cls !== c) e.push(c + ':cls'); else if (gen !== null && h.gen > gen) e.push(c + ':gen');
    heroes[c] = h; gear[c] = x.gear == null ? null : int(x.gear, 0, 10);
  }
  const joiners = [];
  if (b.joiners != null && !Array.isArray(b.joiners)) e.push('joiners');
  (Array.isArray(b.joiners) ? b.joiners : []).slice(0, 4).forEach(id => {
    if (id == null || id === '') return;                       /* 空き枠 */
    const h = byId[id];
    if (!h || (gen !== null && h.gen > gen)) e.push('joiners'); else joiners.push(h.id);
  });
  joiners.sort();
  const stats = {}; const S = b.stats && typeof b.stats === 'object' ? b.stats : {};
  STAT_KEYS.forEach(k => { const v = num(S[k], -1e6, 1e6); if (v === null) e.push('stats:' + k); else stats[k] = Math.round(v * 10) / 10; });
  const tier = int(b.tier, 1, 12); if (tier === null) e.push('tier');
  const fc = b.fc == null || b.fc === '' ? null : int(b.fc, 0, 10);
  let troops = null, ratio = [null, null, null];
  if (Array.isArray(b.troops) && b.troops.length === 3) {
    const t = b.troops.map(v => num(v, 0, 1e9));
    if (t.every(v => v !== null)) {
      troops = Math.round(t[0] + t[1] + t[2]);
      if (troops > 0) { ratio = [Math.round(t[0] / troops * 100), Math.round(t[1] / troops * 100), 0]; ratio[2] = Math.max(0, 100 - ratio[0] - ratio[1]); }
    }
  }
  if (troops === null) e.push('troops');
  const damage = num(b.damage, 0, 1e15); if (damage === null) e.push('damage');
  const calib = b.calib == null ? null : num(b.calib, 0, 1e6);
  const sub = typeof b.sub === 'string' && /^[a-f0-9]{24}$/.test(b.sub) ? b.sub : null;
  return { errors: e, cid, gen, heroes, gear, joiners, stats, tier, fc, troops, ratio, damage: damage === null ? null : Math.round(damage), calib, sub };
}
/* 現実性チェック。理由を返したデータは保存するが status='flagged' にして集計から外す（あとで基準を見直せるように捨てない） */
export function realism(v, lim) {
  const vals = STAT_KEYS.map(k => v.stats[k]);
  if (vals.some(x => x < 0 || x > lim.statMax)) return 'stat_range';        /* ゲーム内であり得ない攻撃%・殺傷% */
  if (vals.reduce((a, x) => a + x, 0) < lim.statSumMin) return 'stat_zero';  /* ほぼ全部 0（未入力同然） */
  if (vals.every(x => x === vals[0])) return 'stat_uniform';                 /* 8項目すべて同じ数字（適当入力） */
  if (v.troops < lim.troopsMin || v.troops > lim.troopsMax) return 'troops';
  /* 補正係数C・詳細設定の係数はチェックしない: damage はブラウザ側で全員同じ既定の係数にそろえて計算した値が届く */
  if (!(v.damage > 0) || v.damage > lim.damageMax) return 'damage_range';
  return null;
}
/* 偏差値の母集団（ダメージの常用対数の平均・標準偏差）。両端の極端な値は四分位で除外 */
export function devStats(damages) {
  let xs = damages.filter(d => d > 0).map(d => Math.log10(d)).sort((a, b) => a - b);
  if (xs.length >= 8) { const q1 = quantile(xs, 0.25), q3 = quantile(xs, 0.75), k = 3 * (q3 - q1); xs = xs.filter(x => x >= q1 - k && x <= q3 + k); }
  if (xs.length < 5) return null;
  const mu = xs.reduce((a, x) => a + x, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mu) * (x - mu), 0) / xs.length);
  if (!(sd > 1e-6)) return null;
  const at = s => Math.round(Math.pow(10, mu + sd * (s - 50) / 10));
  const hist = []; for (let lo = 20; lo < 80; lo += 5) hist.push({ lo, n: 0 });
  xs.forEach(x => { const s = 50 + 10 * (x - mu) / sd; const i = Math.max(0, Math.min(hist.length - 1, Math.floor((s - 20) / 5))); hist[i].n++; });
  return { n: xs.length, mu: Math.round(mu * 1e5) / 1e5, sd: Math.round(sd * 1e5) / 1e5, scale: 'log10',
           marks: [30, 40, 50, 60, 70].map(s => ({ score: s, damage: at(s) })), hist };
}

/* ---------- 投稿直後に返す診断 ---------- */
function diagnose(v, rows) {
  const t = THEORY.gens[v.gen] && THEORY.gens[v.gen].byTier[v.tier];
  const best = t && t.top[0];
  const lag = {}; CLS.forEach(c => { lag[c] = v.gen - v.heroes[c].gen; });
  const out = { gen: v.gen, tier: v.tier, lag, n: rows.length };
  if (best) {
    out.theory = { ids: best.ids, score: best.score,
      matches: CLS.map((c, i) => v.heroes[c].id === best.ids[i]),
      swap: CLS.filter((c, i) => v.heroes[c].id !== best.ids[i]) };
  }
  if (v.damage != null && rows.length >= 5) {
    const ds = rows.map(r => r.damage).filter(d => d != null).sort((a, b) => a - b);
    if (ds.length >= 5) {
      const below = ds.filter(d => d < v.damage).length;
      out.rank = { pct: Math.round((1 - below / ds.length) * 100), n: ds.length, median: ds[Math.floor(ds.length / 2)] };
    }
  }
  return out;
}

/* ---------- 集計 ---------- */
function quantile(sorted, q) { if (!sorted.length) return null; const i = Math.min(sorted.length - 1, Math.floor(sorted.length * q)); return sorted[i]; }
function iqrFilter(vals) {
  if (vals.length < 8) return vals;
  const s = [...vals].sort((a, b) => a - b), q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), k = 1.5 * (q3 - q1);
  return s.filter(v => v >= q1 - k && v <= q3 + k);
}
function aggregate(rows, gen, env) {
  const minPub = parseInt(env.MIN_PUBLISH || '10', 10), minSplit = parseInt(env.MIN_TIER_SPLIT || '30', 10);
  const n = rows.length;
  const out = { gen, n, published: n >= minPub, updatedAt: now(), byTier: {} };
  if (!out.published) return out;
  const block = rs => {
    const slot = {}; CLS.forEach(c => slot[c] = {});
    const comps = {}, ratios = {}, lagSum = { inf: 0, lan: 0, mks: 0 };
    rs.forEach(r => {
      const ids = { inf: r.hero_inf, lan: r.hero_lan, mks: r.hero_mks };
      CLS.forEach(c => { slot[c][ids[c]] = (slot[c][ids[c]] || 0) + 1; const h = byId[ids[c]]; if (h) lagSum[c] += gen - h.gen; });
      const k = ids.inf + '|' + ids.lan + '|' + ids.mks; comps[k] = (comps[k] || 0) + 1;
      if (r.ratio_inf != null) { const rk = r.ratio_inf + ':' + r.ratio_lan + ':' + r.ratio_mks; ratios[rk] = (ratios[rk] || 0) + 1; }
    });
    const rank = m => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, c]) => ({ key: k, count: c, pct: Math.round(c / rs.length * 1000) / 10 }));
    const slotRank = {}; CLS.forEach(c => slotRank[c] = rank(slot[c]).map(x => ({ id: x.key, count: x.count, pct: x.pct })));
    const compRank = rank(comps).map(x => ({ ids: x.key.split('|'), count: x.count, pct: x.pct }));
    /* ダメージの統計は利用データ（全員同じ係数で計算した予測値）だけで作る。口コミ投稿のダメージは実測や補正後の値が混ざるので入れない */
    const dmgs = rs.filter(r => r.u).map(r => r.damage).filter(d => d != null);
    const ds = iqrFilter(dmgs).sort((a, b) => a - b);
    const damage = ds.length >= 5 ? { n: ds.length, median: quantile(ds, 0.5), p75: quantile(ds, 0.75), p90: quantile(ds, 0.9) } : null;
    const lag = {}; CLS.forEach(c => lag[c] = Math.round(lagSum[c] / rs.length * 10) / 10);
    const ratioTop = rank(ratios).slice(0, 3);
    /* 乗せ英雄（参加者）: 英雄ごとの採用率（その英雄を1枠以上使っている人の割合）と、4人の組み合わせ */
    const jr = rs.filter(r => r.joiners), jHero = {}, jSet = {};
    jr.forEach(r => { const ids = r.joiners.split(','); new Set(ids).forEach(id => { jHero[id] = (jHero[id] || 0) + 1; }); jSet[r.joiners] = (jSet[r.joiners] || 0) + 1; });
    const jrank = (m, lim) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, lim).map(([k, c]) => ({ key: k, count: c, pct: Math.round(c / jr.length * 1000) / 10 }));
    const joiners = jr.length >= 5 ? { n: jr.length, heroes: jrank(jHero, 10).map(x => ({ id: x.key, count: x.count, pct: x.pct })),
                                       sets: jrank(jSet, 5).map(x => ({ ids: x.key.split(','), count: x.count, pct: x.pct })) } : null;
    const dev = devStats(dmgs);
    return { n: rs.length, slot: slotRank, comps: compRank, damage, lag, ratio: ratioTop, joiners, dev };
  };
  Object.assign(out, block(rows));
  if (n >= minSplit) for (const tk of GM.TIER_ORDER) {
    const rs = rows.filter(r => r.spend_tier === tk);
    out.byTier[tk] = rs.length >= minPub ? block(rs) : { n: rs.length, published: false };
  }
  return out;
}
async function loadWindow(env) {
  const since = now() - parseInt(env.WINDOW_DAYS || '90', 10) * 86400;
  /* 利用データ（自動記録・現実性チェック済みのみ）＋ 口コミ投稿（同じ人の利用データがあれば二重に数えない） */
  const { results } = await env.DB.prepare(
    `SELECT server_days, spend_tier, hero_inf, hero_lan, hero_mks, ratio_inf, ratio_lan, ratio_mks, damage
       FROM submissions WHERE status='ok' AND created_at >= ?
        AND id NOT IN (SELECT sub_id FROM usage WHERE status='ok' AND sub_id IS NOT NULL)`).bind(since).all();
  const byGen = {}; for (let g = 1; g <= GM.MAX; g++) byGen[g] = [];
  results.forEach(r => { const g = GM.genFromDays(r.server_days); (byGen[g] = byGen[g] || []).push(r); });
  const us = await env.DB.prepare(
    `SELECT gen, spend_tier, hero_inf, hero_lan, hero_mks, ratio_inf, ratio_lan, ratio_mks, damage, joiners
       FROM usage WHERE status='ok' AND updated_at >= ?`).bind(since).all();
  (us.results || []).forEach(r => { r.u = 1; if (byGen[r.gen]) byGen[r.gen].push(r); });
  return byGen;
}
/* 世代ごとの件数（D1 から即時）。集計対象と同じ条件で数える */
async function liveCounts(env) {
  const since = now() - parseInt(env.WINDOW_DAYS || '90', 10) * 86400;
  const live = {}; for (let g = 1; g <= GM.MAX; g++) live[g] = 0;
  const a = await env.DB.prepare(`SELECT server_days, COUNT(*) AS n FROM submissions WHERE status='ok' AND created_at>=?
     AND id NOT IN (SELECT sub_id FROM usage WHERE status='ok' AND sub_id IS NOT NULL) GROUP BY server_days`).bind(since).all();
  (a.results || []).forEach(r => { const g = GM.genFromDays(r.server_days); if (live[g] != null) live[g] += r.n; });
  const b = await env.DB.prepare(`SELECT gen, COUNT(*) AS n FROM usage WHERE status='ok' AND updated_at>=? GROUP BY gen`).bind(since).all();
  (b.results || []).forEach(r => { if (live[r.gen] != null) live[r.gen] += r.n; });
  return live;
}
async function rebuildAll(env) {
  const byGen = await loadWindow(env);
  const summary = { updatedAt: now(), windowDays: parseInt(env.WINDOW_DAYS || '90', 10), gens: {} };
  for (let g = 1; g <= GM.MAX; g++) {
    const agg = aggregate(byGen[g], g, env);
    await env.STATS.put('stats:gen:' + g, JSON.stringify(agg));
    summary.gens[g] = { n: agg.n, published: agg.published };
  }
  await env.STATS.put('stats:summary', JSON.stringify(summary));
  return summary;
}

/* ---------- 口コミ（投稿フォームの「ひとこと」） ---------- */
function reviewItem(r) {
  return { id: r.id, at: r.updated_at || r.created_at, gen: GM.genFromDays(r.server_days), tier: r.spend_tier,
           inf: r.hero_inf, lan: r.hero_lan, mks: r.hero_mks, damage: (r.show_damage == null || r.show_damage) ? r.damage : null, comment: r.comment, nick: r.nick || null,
           status: r.review_status, reports: r.reports || 0 };
}
async function listReviews(env, g) {
  const range = GM.rangeOf(g), max = parseInt(env.REVIEW_MAX || '100', 10);
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, updated_at, server_days, spend_tier, hero_inf, hero_lan, hero_mks, damage, show_damage, comment, nick, review_status, reports
     FROM submissions WHERE status='ok' AND review_status='ok' AND comment IS NOT NULL AND comment!='' AND server_days>=? AND server_days<=?
     ORDER BY updated_at DESC LIMIT ?`).bind(range.from, range.to == null ? 99999 : range.to, max).all();
  return { gen: g, updatedAt: now(), items: results.map(r => { const it = reviewItem(r); delete it.status; delete it.reports; return it; }) };
}

/* ---------- ルーティング ---------- */
export default {
  async scheduled(_ev, env) { await rebuildAll(env); },

  async fetch(req, env) {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url), p = url.pathname;
    try {
      if (req.method === 'GET' && p === '/v1/stats/summary') {
        const s = await env.STATS.get('stats:summary');
        const sum = s ? JSON.parse(s) : await rebuildAll(env);
        /* 件数だけは D1 から即時反映（published の判定と実測の中身は日次集計のまま）。
           1回の SELECT で直近90日の行を数えるだけなので無料枠で十分収まる */
        const live = await liveCounts(env);
        for (let g = 1; g <= GM.MAX; g++) { sum.gens[g] = sum.gens[g] || { n: 0, published: false }; sum.gens[g].n = live[g]; }
        sum.liveCounts = true;
        return json(sum, 200, { ...h, 'cache-control': 'public, max-age=60' });
      }
      let m;
      if (req.method === 'GET' && (m = p.match(/^\/v1\/reviews\/(\d{1,2})$/))) {
        const g = parseInt(m[1], 10); if (g < 1 || g > GM.MAX) return json({ error: 'gen' }, 404, h);
        return json(await listReviews(env, g), 200, { ...h, 'cache-control': 'public, max-age=300' });
      }
      if (req.method === 'POST' && (m = p.match(/^\/v1\/report\/([a-f0-9]{24})$/))) {
        const ip = req.headers.get('CF-Connecting-IP') || '';
        const clientHash = await sha256(ip + '|' + (env.CLIENT_SALT || ''));
        const row = await env.DB.prepare('SELECT id, reports FROM submissions WHERE id=? AND status=\'ok\' AND comment IS NOT NULL').bind(m[1]).first();
        if (!row) return json({ error: 'not_found' }, 404, h);
        const ins = await env.DB.prepare('INSERT OR IGNORE INTO reports (sub_id, client_hash, created_at) VALUES (?,?,?)').bind(m[1], clientHash, now()).run();
        let reports = row.reports || 0;
        if (ins.meta.changes > 0) {
          reports += 1;
          const hide = reports >= parseInt(env.REPORT_HIDE || '3', 10);
          await env.DB.prepare('UPDATE submissions SET reports=?' + (hide ? ", review_status=CASE WHEN review_status='ok' THEN 'reported' ELSE review_status END" : '') + ' WHERE id=?').bind(reports, m[1]).run();
        }
        return json({ ok: true, reports }, 200, h);
      }
      if (p === '/v1/admin/reviews' || (m = p.match(/^\/v1\/admin\/reviews\/([a-f0-9]{24})$/))) {
        const body = req.method === 'POST' ? (await req.json().catch(() => ({}))) : {};
        const key = url.searchParams.get('key') || body.key || '';
        if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403, h);
        if (req.method === 'GET' && p === '/v1/admin/reviews') {
          const st = url.searchParams.get('status') || 'all';
          const where = st === 'all' ? "status='ok'" : "status='ok' AND review_status=?";
          const q = env.DB.prepare(`SELECT id, created_at, updated_at, server_days, spend_tier, hero_inf, hero_lan, hero_mks, damage, show_damage, comment, nick, review_status, reports
                                    FROM submissions WHERE comment IS NOT NULL AND comment!='' AND ${where} ORDER BY updated_at DESC LIMIT 300`);
          const { results } = await (st === 'all' ? q.bind() : q.bind(st)).all();
          return json({ ok: true, items: results.map(reviewItem) }, 200, h);
        }
        if (req.method === 'POST' && m) {
          const action = body.action === 'hide' ? 'hidden' : body.action === 'show' ? 'ok' : null;
          if (!action) return json({ error: 'action' }, 400, h);
          const r = await env.DB.prepare('UPDATE submissions SET review_status=?' + (action === 'ok' ? ', reports=0' : '') + ' WHERE id=?').bind(action, m[1]).run();
          if (action === 'ok') await env.DB.prepare('DELETE FROM reports WHERE sub_id=?').bind(m[1]).run();
          return json({ ok: true, changed: r.meta.changes > 0 }, 200, h);
        }
        return json({ error: 'not_found' }, 404, h);
      }
      if (req.method === 'GET' && (m = p.match(/^\/v1\/stats\/(\d{1,2})$/))) {
        const g = parseInt(m[1], 10); if (g < 1 || g > GM.MAX) return json({ error: 'gen' }, 404, h);
        const s = await env.STATS.get('stats:gen:' + g);
        if (s) {
          const agg = JSON.parse(s);
          if (!agg.published) {                          /* 未公開のうちは件数だけ D1 から最新を取る（「現在 N 件」を即時反映） */
            const live = await liveCounts(env);
            if (typeof live[g] === 'number') agg.n = live[g];
            /* 公開の件数に届いたら、朝の定時集計を待たずにその場で集計して公開する */
            if (agg.n >= parseInt(env.MIN_PUBLISH || '10', 10)) {
              const fresh = aggregate((await loadWindow(env))[g], g, env);
              await env.STATS.put('stats:gen:' + g, JSON.stringify(fresh));
              return json(fresh, 200, { ...h, 'cache-control': 'public, max-age=' + (fresh.published ? 600 : 60) });
            }
          }
          return json(agg, 200, { ...h, 'cache-control': 'public, max-age=' + (agg.published ? 600 : 60) });
        }
        const byGen = await loadWindow(env); const agg = aggregate(byGen[g], g, env);
        await env.STATS.put('stats:gen:' + g, JSON.stringify(agg));
        return json(agg, 200, h);
      }
      if (p === '/v1/usage' && (req.method === 'POST' || req.method === 'DELETE')) {
        /* sendBeacon でも送れるよう content-type は問わない（text/plain の JSON）。許可したサイト以外からは受け付けない */
        const origin = req.headers.get('Origin') || '';
        if (!(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).includes(origin)) return json({ error: 'origin' }, 403, h);
        const raw = await req.text(); if (raw.length > 4000) return json({ error: 'size' }, 413, h);
        let body = null; try { body = JSON.parse(raw); } catch (_) {}
        if (!body || typeof body !== 'object') return json({ error: 'json' }, 400, h);
        const salt = env.CLIENT_SALT || '';
        if (req.method === 'DELETE') {
          if (typeof body.cid !== 'string' || !/^[a-f0-9]{32}$/.test(body.cid)) return json({ error: 'cid' }, 400, h);
          const r = await env.DB.prepare('DELETE FROM usage WHERE cid_hash=?').bind(await sha256('cid|' + body.cid + '|' + salt)).run();
          return json({ ok: true, removed: r.meta.changes }, 200, h);
        }
        const v = validateUsage(body); if (v.errors.length) return json({ error: 'invalid', fields: v.errors }, 400, h);
        const country = (req.cf && req.cf.country) || '';
        if (NO_LOG.has(country)) return json({ ok: true, counted: false, reason: 'region' }, 200, h);
        const lim = usageLimits(env), flag = realism(v, lim), status = flag ? 'flagged' : 'ok';
        const cidHash = await sha256('cid|' + v.cid + '|' + salt);
        const clientHash = await sha256((req.headers.get('CF-Connecting-IP') || '') + '|' + salt);
        const t = now(), s = v.stats;
        const row = await env.DB.prepare('SELECT sub_id FROM usage WHERE cid_hash=? AND gen=?').bind(cidHash, v.gen).first();
        const vals = [v.heroes.inf.id, v.heroes.lan.id, v.heroes.mks.id, v.gear.inf, v.gear.lan, v.gear.mks, v.joiners.join(','), v.tier, v.fc,
          s.teamAtk, s.teamLeth, s.atkInf, s.lethInf, s.atkLan, s.lethLan, s.atkMks, s.lethMks, v.troops, v.ratio[0], v.ratio[1], v.ratio[2], v.damage, v.calib, status, flag];
        if (row) {
          await env.DB.prepare(`UPDATE usage SET updated_at=?, hits=hits+1, hero_inf=?, hero_lan=?, hero_mks=?, gear_inf=?, gear_lan=?, gear_mks=?, joiners=?, troop_tier=?, fc_level=?,
              team_atk=?, team_leth=?, atk_inf=?, leth_inf=?, atk_lan=?, leth_lan=?, atk_mks=?, leth_mks=?, troops=?, ratio_inf=?, ratio_lan=?, ratio_mks=?, damage=?, calib=?, status=?, flag=?
              WHERE cid_hash=? AND gen=?`).bind(t, ...vals, cidHash, v.gen).run();
        } else {
          const dayStart = t - (t % 86400);
          const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM usage WHERE client_hash=? AND created_at>=?').bind(clientHash, dayStart).first();
          if (c && c.n >= lim.perIpDaily) return json({ error: 'rate' }, 429, h);
          await env.DB.prepare(`INSERT INTO usage (cid_hash, gen, created_at, updated_at, hero_inf, hero_lan, hero_mks, gear_inf, gear_lan, gear_mks, joiners, troop_tier, fc_level,
              team_atk, team_leth, atk_inf, leth_inf, atk_lan, leth_lan, atk_mks, leth_mks, troops, ratio_inf, ratio_lan, ratio_mks, damage, calib, status, flag, client_hash)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(cidHash, v.gen, t, t, ...vals, clientHash).run();
        }
        /* 同じ人の口コミ投稿があれば紐づける（集計で二重に数えない・課金帯を引き継ぐ） */
        if (v.sub && !(row && row.sub_id)) {
          const sb = await env.DB.prepare("SELECT spend_tier FROM submissions WHERE id=? AND status='ok' AND server_days>=? AND server_days<=?")
            .bind(v.sub, GM.rangeOf(v.gen).from, GM.rangeOf(v.gen).to == null ? 99999 : GM.rangeOf(v.gen).to).first();
          if (sb) await env.DB.prepare('UPDATE usage SET sub_id=?, spend_tier=? WHERE cid_hash=? AND gen=?').bind(v.sub, sb.spend_tier, cidHash, v.gen).run();
        }
        /* その世代の偏差値の母集団（日次集計）を返す。偏差値そのものはブラウザ側で計算する */
        let dev = null, n = 0;
        const ks = await env.STATS.get('stats:gen:' + v.gen);
        if (ks) { const agg = JSON.parse(ks); n = agg.n || 0; if (agg.published && agg.dev) dev = { n: agg.dev.n, mu: agg.dev.mu, sd: agg.dev.sd }; }
        return json({ ok: true, counted: !flag, flag: flag || undefined, gen: v.gen, n, dev }, 200, h);
      }
      if (req.method === 'POST' && p === '/v1/submit') {
        const body = await req.json().catch(() => null); if (!body) return json({ error: 'json' }, 400, h);
        const ip = req.headers.get('CF-Connecting-IP') || '';
        if (!(await verifyTurnstile(env, body.turnstile, ip))) return json({ error: 'turnstile' }, 403, h);
        body.ngWords = env.NG_WORDS || ''; const v = validate(body); if (v.errors.length) return json({ error: 'invalid', fields: v.errors }, 400, h);
        const clientHash = await sha256(ip + '|' + (env.CLIENT_SALT || ''));
        const t = now(), dayStart = t - (t % 86400);
        /* 上書きは「同じ世代」の投稿に限る（同じ人が世代ごとに1件ずつ持てる） */
        const gr = GM.rangeOf(v.gen), gFrom = gr.from, gTo = gr.to == null ? 99999 : gr.to;
        let row = null;
        if (body.editKey) {
          const kh = await sha256(String(body.editKey));
          row = await env.DB.prepare('SELECT id FROM submissions WHERE edit_key_hash=? AND status!=\'removed\' AND server_days>=? AND server_days<=?').bind(kh, gFrom, gTo).first();
        }
        if (!row) row = await env.DB.prepare('SELECT id FROM submissions WHERE client_hash=? AND created_at>=? AND status=\'ok\' AND server_days>=? AND server_days<=?').bind(clientHash, dayStart, gFrom, gTo).first();
        let id, editKey = body.editKey && row ? String(body.editKey) : null;
        if (row) {                                       /* 上書き */
          id = row.id;
          if (!editKey) { editKey = randHex(16); }
          await env.DB.prepare(`UPDATE submissions SET updated_at=?, server_days=?, spend_tier=?, hero_inf=?, hero_lan=?, hero_mks=?,
              ratio_inf=?, ratio_lan=?, ratio_mks=?, damage=?, fc_level=?, gear_inf=?, gear_lan=?, gear_mks=?, edit_key_hash=?, comment=?, nick=?, show_damage=?, status='ok' WHERE id=?`)
            .bind(t, v.days, v.tier, v.heroes.inf.id, v.heroes.lan.id, v.heroes.mks.id,
              v.ratio ? v.ratio[0] : null, v.ratio ? v.ratio[1] : null, v.ratio ? v.ratio[2] : null,
              v.damage, v.fc, v.gear[0], v.gear[1], v.gear[2], await sha256(editKey), v.comment, v.nick, v.showDamage, id).run();
        } else {                                         /* 新規 */
          id = randHex(12); editKey = randHex(16);
          await env.DB.prepare(`INSERT INTO submissions (id, created_at, updated_at, server_days, spend_tier, hero_inf, hero_lan, hero_mks,
              ratio_inf, ratio_lan, ratio_mks, damage, fc_level, gear_inf, gear_lan, gear_mks, edit_key_hash, client_hash, status, comment, nick, show_damage)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'ok',?,?,?)`)
            .bind(id, t, t, v.days, v.tier, v.heroes.inf.id, v.heroes.lan.id, v.heroes.mks.id,
              v.ratio ? v.ratio[0] : null, v.ratio ? v.ratio[1] : null, v.ratio ? v.ratio[2] : null,
              v.damage, v.fc, v.gear[0], v.gear[1], v.gear[2], await sha256(editKey), clientHash, v.comment, v.nick, v.showDamage).run();
        }
        /* シミュレーターの利用データと紐づける（集計で二重に数えない・課金帯を引き継ぐ） */
        if (typeof body.cid === 'string' && /^[a-f0-9]{32}$/.test(body.cid)) {
          await env.DB.prepare('UPDATE usage SET sub_id=?, spend_tier=? WHERE cid_hash=? AND gen=?')
            .bind(id, v.tier, await sha256('cid|' + body.cid + '|' + (env.CLIENT_SALT || '')), v.gen).run();
        }
        /* 診断: 同世代・直近の投稿と比較 */
        const range = GM.rangeOf(v.gen), since = t - parseInt(env.WINDOW_DAYS || '90', 10) * 86400;
        const { results } = await env.DB.prepare(
          `SELECT damage FROM submissions WHERE status='ok' AND created_at>=? AND server_days>=? AND server_days<=? AND id!=?`)
          .bind(since, range.from, range.to == null ? 99999 : range.to, id).all();
        return json({ ok: true, id, editKey, review: !!v.comment, diag: diagnose(v, results) }, 200, h);
      }
      if (req.method === 'DELETE' && (m = p.match(/^\/v1\/submit\/([a-f0-9]{24})$/))) {
        const body = await req.json().catch(() => ({}));
        if (!body.editKey) return json({ error: 'editKey' }, 400, h);
        const kh = await sha256(String(body.editKey));
        const r = await env.DB.prepare('UPDATE submissions SET status=\'removed\', updated_at=? WHERE id=? AND edit_key_hash=?').bind(now(), m[1], kh).run();
        return json({ ok: true, removed: r.meta.changes > 0 }, 200, h);
      }
      return json({ error: 'not_found' }, 404, h);
    } catch (err) {
      return json({ error: 'internal', message: String(err && err.message || err) }, 500, h);
    }
  }
};
