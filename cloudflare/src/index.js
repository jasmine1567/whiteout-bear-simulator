/* whitesim-lab.com 統計API（Cloudflare Worker）
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
        const since = now() - parseInt(env.WINDOW_DAYS || '90', 10) * 86400;
        const { results } = await env.DB.prepare('SELECT server_days, COUNT(*) AS n FROM submissions WHERE status=\'ok\' AND created_at>=? GROUP BY server_days').bind(since).all();
        const live = {}; for (let g = 1; g <= GM.MAX; g++) live[g] = 0;
        (results || []).forEach(r => { const g = GM.genFromDays(r.server_days); if (live[g] != null) live[g] += r.n; });
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
            const range = GM.rangeOf(g), since = now() - parseInt(env.WINDOW_DAYS || '90', 10) * 86400;
            const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM submissions WHERE status=\'ok\' AND created_at>=? AND server_days>=? AND server_days<=?')
              .bind(since, range.from, range.to == null ? 99999 : range.to).first();
            if (c && typeof c.n === 'number') agg.n = c.n;
          }
          return json(agg, 200, { ...h, 'cache-control': 'public, max-age=' + (agg.published ? 600 : 60) });
        }
        const byGen = await loadWindow(env); const agg = aggregate(byGen[g], g, env);
        await env.STATS.put('stats:gen:' + g, JSON.stringify(agg));
        return json(agg, 200, h);
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
