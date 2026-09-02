/* whitesim-lab.com 統計API（Cloudflare Worker）
   POST   /v1/submit          構成を投稿（Turnstile検証・妥当性チェック・同日同一クライアントは上書き）
   DELETE /v1/submit/:id      編集キーで自分の投稿を削除
   GET    /v1/stats/summary   全世代のサンプル数（ハブ用）
   GET    /v1/stats/:gen      その世代の集計（KVから。無ければその場で集計）
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
  const days = int(b.days, 0, 5000); if (days === null) e.push('days');
  const tier = TIERS.has(b.tier) ? b.tier : null; if (!tier) e.push('tier');
  const gen = days === null ? null : GM.genFromDays(days);
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
  return { errors: e, days, tier, gen, heroes, ratio, damage, fc, gear };
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
    const ds = iqrFilter(rs.map(r => r.damage).filter(d => d != null)).sort((a, b) => a - b);
    const damage = ds.length >= 5 ? { n: ds.length, median: quantile(ds, 0.5), p75: quantile(ds, 0.75), p90: quantile(ds, 0.9) } : null;
    const lag = {}; CLS.forEach(c => lag[c] = Math.round(lagSum[c] / rs.length * 10) / 10);
    const ratioTop = rank(ratios).slice(0, 3);
    return { n: rs.length, slot: slotRank, comps: compRank, damage, lag, ratio: ratioTop };
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
  const { results } = await env.DB.prepare(
    `SELECT server_days, spend_tier, hero_inf, hero_lan, hero_mks, ratio_inf, ratio_lan, ratio_mks, damage
       FROM submissions WHERE status='ok' AND created_at >= ?`).bind(since).all();
  const byGen = {}; for (let g = 1; g <= GM.MAX; g++) byGen[g] = [];
  results.forEach(r => { const g = GM.genFromDays(r.server_days); (byGen[g] = byGen[g] || []).push(r); });
  return byGen;
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

/* ---------- ルーティング ---------- */
export default {
  async scheduled(_ev, env) { await rebuildAll(env); },

  async fetch(req, env) {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url), p = url.pathname;
    try {
      if (req.method === 'GET' && p === '/v1/stats/summary') {
        const s = await env.STATS.get('stats:summary'); if (s) return json(JSON.parse(s), 200, { ...h, 'cache-control': 'public, max-age=600' });
        return json(await rebuildAll(env), 200, h);
      }
      let m;
      if (req.method === 'GET' && (m = p.match(/^\/v1\/stats\/(\d{1,2})$/))) {
        const g = parseInt(m[1], 10); if (g < 1 || g > GM.MAX) return json({ error: 'gen' }, 404, h);
        const s = await env.STATS.get('stats:gen:' + g);
        if (s) return json(JSON.parse(s), 200, { ...h, 'cache-control': 'public, max-age=600' });
        const byGen = await loadWindow(env); const agg = aggregate(byGen[g], g, env);
        await env.STATS.put('stats:gen:' + g, JSON.stringify(agg));
        return json(agg, 200, h);
      }
      if (req.method === 'POST' && p === '/v1/submit') {
        const body = await req.json().catch(() => null); if (!body) return json({ error: 'json' }, 400, h);
        const ip = req.headers.get('CF-Connecting-IP') || '';
        if (!(await verifyTurnstile(env, body.turnstile, ip))) return json({ error: 'turnstile' }, 403, h);
        const v = validate(body); if (v.errors.length) return json({ error: 'invalid', fields: v.errors }, 400, h);
        const clientHash = await sha256(ip + '|' + (env.CLIENT_SALT || ''));
        const t = now(), dayStart = t - (t % 86400);
        let row = null;
        if (body.editKey) {
          const kh = await sha256(String(body.editKey));
          row = await env.DB.prepare('SELECT id FROM submissions WHERE edit_key_hash=? AND status!=\'removed\'').bind(kh).first();
        }
        if (!row) row = await env.DB.prepare('SELECT id FROM submissions WHERE client_hash=? AND created_at>=? AND status=\'ok\'').bind(clientHash, dayStart).first();
        let id, editKey = body.editKey && row ? String(body.editKey) : null;
        if (row) {                                       /* 上書き */
          id = row.id;
          if (!editKey) { editKey = randHex(16); }
          await env.DB.prepare(`UPDATE submissions SET updated_at=?, server_days=?, spend_tier=?, hero_inf=?, hero_lan=?, hero_mks=?,
              ratio_inf=?, ratio_lan=?, ratio_mks=?, damage=?, fc_level=?, gear_inf=?, gear_lan=?, gear_mks=?, edit_key_hash=?, status='ok' WHERE id=?`)
            .bind(t, v.days, v.tier, v.heroes.inf.id, v.heroes.lan.id, v.heroes.mks.id,
              v.ratio ? v.ratio[0] : null, v.ratio ? v.ratio[1] : null, v.ratio ? v.ratio[2] : null,
              v.damage, v.fc, v.gear[0], v.gear[1], v.gear[2], await sha256(editKey), id).run();
        } else {                                         /* 新規 */
          id = randHex(12); editKey = randHex(16);
          await env.DB.prepare(`INSERT INTO submissions (id, created_at, updated_at, server_days, spend_tier, hero_inf, hero_lan, hero_mks,
              ratio_inf, ratio_lan, ratio_mks, damage, fc_level, gear_inf, gear_lan, gear_mks, edit_key_hash, client_hash, status)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'ok')`)
            .bind(id, t, t, v.days, v.tier, v.heroes.inf.id, v.heroes.lan.id, v.heroes.mks.id,
              v.ratio ? v.ratio[0] : null, v.ratio ? v.ratio[1] : null, v.ratio ? v.ratio[2] : null,
              v.damage, v.fc, v.gear[0], v.gear[1], v.gear[2], await sha256(editKey), clientHash).run();
        }
        /* 診断: 同世代・直近の投稿と比較 */
        const range = GM.rangeOf(v.gen), since = t - parseInt(env.WINDOW_DAYS || '90', 10) * 86400;
        const { results } = await env.DB.prepare(
          `SELECT damage FROM submissions WHERE status='ok' AND created_at>=? AND server_days>=? AND server_days<=? AND id!=?`)
          .bind(since, range.from, range.to == null ? 99999 : range.to, id).all();
        return json({ ok: true, id, editKey, diag: diagnose(v, results) }, 200, h);
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
