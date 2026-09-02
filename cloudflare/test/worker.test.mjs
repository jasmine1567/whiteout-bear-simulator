import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
const worker = (await import(new URL('../dist/worker.js', import.meta.url).href)).default;

/* D1 / KV の最小モック */
const db = new DatabaseSync(':memory:');
db.exec(fs.readFileSync(new URL('../schema.sql', import.meta.url),'utf8'));
const D1 = { prepare: sql => ({ bind: (...a) => ({
  first: async () => db.prepare(sql).get(...a) ?? null,
  all:   async () => ({ results: db.prepare(sql).all(...a) }),
  run:   async () => { const r = db.prepare(sql).run(...a); return { meta: { changes: r.changes } }; } }) }) };
const kv = new Map();
const KV = { get: async k => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } };
const env = { DB: D1, STATS: KV, ALLOWED_ORIGINS: 'https://whitesim-lab.com', WINDOW_DAYS: '90', MIN_PUBLISH: '10', MIN_TIER_SPLIT: '30', CLIENT_SALT: 'test' };
const req = (method, path, body, ip='1.2.3.4') => new Request('https://api.whitesim-lab.com'+path, { method,
  headers: { 'content-type':'application/json', 'Origin':'https://whitesim-lab.com', 'CF-Connecting-IP': ip }, body: body ? JSON.stringify(body) : undefined });
const call = async (...a) => { const r = await worker.fetch(req(...a), env); return { status: r.status, body: await r.json() }; };

let pass = 0, fail = 0;
const t = (name, cond, extra='') => { if (cond) pass++; else fail++; console.log((cond?'  ✅ ':'  ❌ ')+name+(extra?'  '+extra:'')); };

console.log('--- 妥当性チェック ---');
let r = await call('POST','/v1/submit',{ days:1200, tier:'whale', inf:'jeronimo', lan:'mia', mks:'aisling', ratio:[1,4,95], damage:5000000 });
t('正常投稿 → 200', r.status===200, JSON.stringify(r.body.diag));
const key1 = r.body.editKey, id1 = r.body.id;
r = await call('POST','/v1/submit',{ days:1200, tier:'f2p', inf:'aisling', lan:'mia', mks:'jeronimo' },'9.9.9.9');
t('弓枠に盾英雄 → 400', r.status===400 && r.body.fields.includes('inf:cls'), JSON.stringify(r.body.fields));
r = await call('POST','/v1/submit',{ days:100, tier:'mid', inf:'hector', lan:'mia', mks:'aisling' },'9.9.9.8');
t('未実装世代の英雄 → 400', r.status===400 && r.body.fields.includes('inf:gen'), JSON.stringify(r.body.fields));
r = await call('POST','/v1/submit',{ days:1200, tier:'whale', inf:'jeronimo', lan:'mia', mks:'aisling', ratio:[50,50,50] },'9.9.9.7');
t('比率が100にならない → 400', r.status===400 && r.body.fields.includes('ratio'));
r = await call('POST','/v1/submit',{ days:1200, tier:'ultra', inf:'jeronimo', lan:'mia', mks:'aisling' },'9.9.9.6');
t('不正な課金帯 → 400', r.status===400 && r.body.fields.includes('tier'));

r = await call('POST','/v1/submit',{ gen:16, tier:'f2p', inf:'hector', lan:'mia', mks:'aisling' },'9.9.9.5');
t('gen で投稿 → 200・第16世代として判定', r.status===200 && r.body.diag.gen===16, JSON.stringify(r.body.diag && r.body.diag.lag));
r = await call('POST','/v1/submit',{ gen:99, tier:'f2p', inf:'hector', lan:'mia', mks:'aisling' },'9.9.9.4');
t('範囲外の gen → 400', r.status===400 && r.body.fields.includes('gen'));
r = await call('POST','/v1/submit',{ gen:16, tier:'f2p', inf:'hector', lan:'mia', mks:'aisling' },'9.9.9.3');
t('比率なしでも投稿できる（任意項目）', r.status===200);
console.log('--- 上書き・削除 ---');
r = await call('POST','/v1/submit',{ days:1200, tier:'whale', inf:'natalia', lan:'mia', mks:'aisling', damage:6000000 });
t('同日同IPの再投稿は上書き（同じid）', r.body.id===id1, r.body.id+' vs '+id1);
t('キー無し再投稿では編集キーがローテーションする', r.body.editKey && r.body.editKey!==key1);
const key2 = r.body.editKey;
r = await call('POST','/v1/submit',{ days:1200, tier:'whale', inf:'jeronimo', lan:'mia', mks:'aisling', editKey:key1 },'5.5.5.5');
t('古いキーは無効（別IPなら新規行になる）', r.body.id!==id1);
const idStale = r.body.id;
r = await call('POST','/v1/submit',{ days:1200, tier:'whale', inf:'jeronimo', lan:'mia', mks:'aisling', editKey:key2 },'5.5.5.5');
t('現行キーでの更新は別IPでも同じid・キー維持', r.body.id===id1 && r.body.editKey===key2);
await call('DELETE','/v1/submit/'+idStale,{ editKey: (await call('POST','/v1/submit',{ days:1200, tier:'whale', inf:'jeronimo', lan:'mia', mks:'aisling' },'5.5.5.5')).body.editKey });
t('id1 系の有効行は1（gen経路の2件は別IP）', db.prepare("select count(*) c from submissions where status='ok'").get().c===3);
r = await call('DELETE','/v1/submit/'+id1,{ editKey:'wrongkey' });
t('間違った編集キーでは削除されない', r.body.removed===false);
r = await call('DELETE','/v1/submit/'+id1,{ editKey:key2 });
t('正しい編集キーで削除', r.body.removed===true && db.prepare("select status from submissions where id=?").get(id1).status==='removed');

console.log('--- 集計 ---');
/* 第16世代環境に40件、第8世代に5件 投げる */
const H = JSON.parse(fs.readFileSync(new URL('../src/heroes-min.json', import.meta.url),'utf8'));
const pick = (cls, maxGen, i) => { const a = H.filter(h=>h.cls===cls && h.gen<=maxGen && h.rar==='SSR'); return a[i % a.length].id; };
for (let i=0;i<40;i++) await call('POST','/v1/submit',{ days:1200+i, tier:['f2p','mid','whale'][i%3],
  inf: i<25 ? 'jeronimo' : pick('inf',16,i), lan: i<30 ? 'mia' : pick('lan',16,i), mks: i<20 ? 'aisling' : pick('mks',16,i),
  ratio:[1,4,95], damage: 1000000 + i*250000 + (i===39 ? 90000000 : 0) }, '10.0.0.'+i);
for (let i=0;i<5;i++) await call('POST','/v1/submit',{ days:530+i, tier:'mid', inf:'gatot', lan:'mia', mks:'bradley' }, '10.0.1.'+i);
await worker.scheduled({}, env);
const s16 = JSON.parse(kv.get('stats:gen:16')), s8 = JSON.parse(kv.get('stats:gen:8')), sum = JSON.parse(kv.get('stats:summary'));
t('summary に16世代分', Object.keys(sum.gens).length===16, JSON.stringify({g16:sum.gens[16], g8:sum.gens[8]}));
t('第16世代 n=42 公開', s16.n===42 && s16.published===true, 'n='+s16.n);
t('第8世代 n=5 は非公開', s8.n===5 && s8.published===false);
t('盾枠1位はジェロニモ', s16.slot.inf[0].id==='jeronimo' && s16.slot.inf[0].pct>=60, JSON.stringify(s16.slot.inf[0]));
t('組み合わせTOPが出る', s16.comps[0].ids.length===3 && s16.comps[0].count>=15, JSON.stringify(s16.comps[0]));
t('ダメージ分位（外れ値90Mを除外）', s16.damage && s16.damage.p90 < 50000000, JSON.stringify(s16.damage));
t('平均世代ラグ', typeof s16.lag.inf==='number' && s16.lag.inf>10, JSON.stringify(s16.lag));
t('n≥30 なので課金帯別内訳あり', Object.keys(s16.byTier).length===3, JSON.stringify(Object.fromEntries(Object.entries(s16.byTier).map(([k,v])=>[k,v.n]))));
r = await call('GET','/v1/stats/16');
t('GET /v1/stats/16 が KV から返る', r.status===200 && r.body.n===42);
r = await call('GET','/v1/stats/99');
t('存在しない世代 → 404', r.status===404);

console.log('--- 投稿直後の診断 ---');
r = await call('POST','/v1/submit',{ days:1200, tier:'f2p', inf:'flint', lan:'mia', mks:'vulcanus', damage:3000000 },'7.7.7.7');
const d = r.body.diag;
t('世代ラグ（盾G2→14, 槍G3→13, 弓G13→3）', d.lag.inf===14 && d.lag.lan===13 && d.lag.mks===3, JSON.stringify(d.lag));
t('理論値との差分（無課金の最適との比較・swap枠が返る）', d.theory && d.theory.ids.length===3 && Array.isArray(d.theory.swap), JSON.stringify(d.theory));
t('同世代内の順位が返る', d.rank && d.rank.n>=5 && d.rank.pct>0, JSON.stringify(d.rank));

console.log(`\n結果: ${pass} 件OK / ${fail} 件NG`);
process.exit(fail?1:0);
