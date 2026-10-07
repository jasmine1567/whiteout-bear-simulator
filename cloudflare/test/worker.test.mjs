import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
const mod = await import(new URL('../dist/worker.js', import.meta.url).href);
const worker = mod.default;

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

console.log('--- 世代ごとに1件 ---');
r = await call('POST','/v1/submit',{ gen:3, tier:'mid', inf:'jeronimo', lan:'mia', mks:'alonso', comment:'G3の感想' },'40.0.0.1');
const g10id = r.body.id, g10key = r.body.editKey;
r = await call('POST','/v1/submit',{ gen:5, tier:'mid', inf:'jeronimo', lan:'mia', mks:'gwen', comment:'G5の感想' },'40.0.0.1');
t('同じ人・同じ日でも世代が違えば別の投稿になる', r.body.id!==g10id && db.prepare("select count(*) c from submissions where client_hash=(select client_hash from submissions where id=?) and status='ok'").get(g10id).c===2);
r = await call('POST','/v1/submit',{ gen:7, tier:'mid', inf:'jeronimo', lan:'mia', mks:'bradley', comment:'G7', editKey: g10key },'40.0.0.2');
t('別世代に古い編集キーを付けても上書きせず新規', r.body.id!==g10id && db.prepare('select comment from submissions where id=?').get(g10id).comment==='G3の感想');
r = await call('POST','/v1/submit',{ gen:3, tier:'mid', inf:'natalia', lan:'mia', mks:'alonso', comment:'G3を書き直し', editKey: g10key },'40.0.0.2');
t('同じ世代なら編集キーで上書き', r.body.id===g10id && db.prepare('select comment from submissions where id=?').get(g10id).comment==='G3を書き直し');

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
t('summary に全世代分', Object.keys(sum.gens).length>=16, JSON.stringify({g16:sum.gens[16], g8:sum.gens[8]}));
t('第16世代 n=42 公開', s16.n===42 && s16.published===true, 'n='+s16.n);
r = await call('GET','/v1/stats/summary');
await call('POST','/v1/submit',{ gen:12, tier:'mid', inf:'jeronimo', lan:'mia', mks:'rufus' },'10.0.2.1');
const sum2 = (await call('GET','/v1/stats/summary')).body;
t('summary の件数は投稿直後に反映（第12世代 0→1、published は日次のまま）', r.body.gens[12].n===0 && sum2.gens[12].n===1 && sum2.gens[12].published===false && sum2.liveCounts===true, JSON.stringify(sum2.gens[12]));
t('第8世代 n=5 は非公開', s8.n===5 && s8.published===false);
t('盾枠1位はジェロニモ', s16.slot.inf[0].id==='jeronimo' && s16.slot.inf[0].pct>=60, JSON.stringify(s16.slot.inf[0]));
t('組み合わせTOPが出る', s16.comps[0].ids.length===3 && s16.comps[0].count>=15, JSON.stringify(s16.comps[0]));
t('口コミ投稿だけの世代はダメージ統計を出さない（条件がそろっていないため）', s16.damage===null && s16.dev===null);
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

console.log('--- 口コミ（ひとこと） ---');
r = await call('POST','/v1/submit',{ gen:10, tier:'f2p', inf:'hector', lan:'mia', mks:'blanchette', damage:12000000, comment:'ブランシュに替えて1割伸びた。\n無課金ならヘクトーで十分', nick:'たろう' },'20.0.0.1');
t('ひとこと付き投稿 → review:true', r.status===200 && r.body.review===true, JSON.stringify(r.body));
const rid = r.body.id, rkey = r.body.editKey;
r = await call('POST','/v1/submit',{ gen:10, tier:'whale', inf:'jeronimo', lan:'mia', mks:'blanchette', comment:'詳細はこちら https://example.com/xx' },'20.0.0.2');
t('URL入りは弾く', r.status===400 && r.body.fields.includes('comment:url'), JSON.stringify(r.body.fields));
r = await call('POST','/v1/submit',{ gen:10, tier:'whale', inf:'jeronimo', lan:'mia', mks:'blanchette', comment:'運営は死ね' },'20.0.0.2');
t('NGワードは弾く', r.status===400 && r.body.fields.includes('comment:ng'));
r = await call('POST','/v1/submit',{ gen:10, tier:'whale', inf:'jeronimo', lan:'mia', mks:'blanchette', comment:'x'.repeat(500), nick:'n'.repeat(40) },'20.0.0.2');
t('長すぎる本文・名前は切り詰めて受理', r.status===200 && r.body.review===true);
r = await call('GET','/v1/reviews/10');
t('GET /v1/reviews/10: 新しい順・2件・本文と構成', r.body.items.length===2 && r.body.items[0].comment.length===200 && r.body.items[1].nick==='たろう' && r.body.items[1].inf==='hector' && r.body.items[1].damage===12000000, JSON.stringify(r.body.items[1]));
t('ひとこと無しの投稿は口コミに出ない（第16世代は0件）', (await call('GET','/v1/reviews/16')).body.items.length===0);
r = await call('POST','/v1/submit',{ gen:10, tier:'mid', inf:'jeronimo', lan:'mia', mks:'blanchette', damage:99000000, comment:'ダメージは内緒', showDamage:false },'20.0.0.3');
t('showDamage:false → 口コミにダメージが出ない（統計用には保存）', r.status===200 && (await call('GET','/v1/reviews/10')).body.items.find(i=>i.comment==='ダメージは内緒').damage===null && db.prepare('select damage from submissions where id=?').get(r.body.id).damage===99000000);
r = await call('POST','/v1/submit',{ gen:10, tier:'f2p', inf:'hector', lan:'mia', mks:'blanchette', comment:'書き直しました', editKey: rkey },'20.0.0.1');
t('同じ編集キーで上書き → 本文が更新', r.body.id===rid && (await call('GET','/v1/reviews/10')).body.items.some(i=>i.id===rid && i.comment==='書き直しました'));
/* 通報 */
r = await call('POST','/v1/report/'+rid,{},'30.0.0.1'); t('通報 1件目', r.body.ok && r.body.reports===1, JSON.stringify(r.body));
r = await call('POST','/v1/report/'+rid,{},'30.0.0.1'); t('同じクライアントの再通報は数えない', r.body.reports===1);
await call('POST','/v1/report/'+rid,{},'30.0.0.2'); r = await call('POST','/v1/report/'+rid,{},'30.0.0.3');
t('3件で自動非表示', r.body.reports===3 && !(await call('GET','/v1/reviews/10')).body.items.some(i=>i.id===rid));
r = await call('POST','/v1/report/zzzz',{}); t('存在しないIDの通報 → 404', r.status===404);
/* 運営者 */
r = await call('GET','/v1/admin/reviews?key=nope'); t('ADMIN_KEY 未設定なら管理APIは403', r.status===403);
const envA = { ...env, ADMIN_KEY:'secret' };
const callA = async (method, path, body) => { const x = await worker.fetch(req(method, path, body), envA); return { status:x.status, body: await x.json() }; };
r = await callA('GET','/v1/admin/reviews?key=secret&status=reported');
t('管理一覧: 通報済みが見える', r.status===200 && r.body.items.length===1 && r.body.items[0].id===rid && r.body.items[0].reports===3, JSON.stringify(r.body.items.map(i=>[i.id,i.status,i.reports])));
r = await callA('POST','/v1/admin/reviews/'+rid,{ key:'secret', action:'show' });
t('運営者が表示に戻す → 通報数リセット・再表示', r.body.changed && (await call('GET','/v1/reviews/10')).body.items.some(i=>i.id===rid) && db.prepare('select reports from submissions where id=?').get(rid).reports===0);
r = await callA('POST','/v1/admin/reviews/'+rid,{ key:'secret', action:'hide' });
t('運営者が非表示', r.body.changed && !(await call('GET','/v1/reviews/10')).body.items.some(i=>i.id===rid));
r = await callA('POST','/v1/admin/reviews/'+rid,{ key:'wrong', action:'show' }); t('合言葉違いは403', r.status===403);
r = await call('DELETE','/v1/submit/'+rid,{ editKey: rkey }); t('投稿者が削除すると口コミも消える', r.body.removed===true);
t('cleanText/textProblem', mod.cleanText('  a\u0000b   c\r\n\r\n\r\nd ', 100)==='ab c\n\nd' && mod.textProblem('www.example.com')==='url' && mod.textProblem('ふつうの感想')===null && mod.textProblem('ゴミ構成', '')==='ng' && mod.textProblem('ぬるぽ', 'ぬるぽ')==='ng');

console.log('--- 利用データの自動記録 ---');
{
  const cid = i => (i.toString(16).padStart(4,'0')).repeat(8);
  const base = (i, o={}) => ({ cid: cid(i), gen: 9, leader: { inf:{id:'jeronimo',gear:3}, lan:{id:'mia',gear:0}, mks:{id:'bradley',gear:5} },
    joiners: ['jessie','jasser','seoyoon','jessie'], tier: 10, fc: 3,
    stats: { teamAtk:300+i, teamLeth:250, atkInf:180, lethInf:150, atkLan:190, lethLan:160, atkMks:220, lethMks:170 },
    troops: [10000, 40000, 150000], damage: 2000000 + i*100000, calib: 0.63, ...o });
  const cnt = w => db.prepare('select count(*) c from usage where '+w).get().c;
  let u = await call('POST','/v1/usage', base(1), '50.0.0.1');
  t('利用データを記録 → counted', u.status===200 && u.body.counted===true && cnt("status='ok' and gen=9")===1, JSON.stringify(u.body));
  u = await call('POST','/v1/usage', base(1, { damage: 2500000 }), '50.0.0.1');
  t('同じブラウザ×同じ世代は上書き（1件のまま・hits=2）', cnt('gen=9')===1 && db.prepare('select hits,damage,joiners,ratio_mks from usage where gen=9').get().hits===2);
  t('乗せ英雄は並べ替えて保存・比率は兵数から計算', (x => x.joiners==='jasser,jessie,jessie,seoyoon' && x.ratio_mks===75)(db.prepare('select joiners,ratio_mks from usage where gen=9').get()));
  u = await call('POST','/v1/usage', base(2, { stats: { teamAtk:99999, teamLeth:250, atkInf:180, lethInf:150, atkLan:190, lethLan:160, atkMks:220, lethMks:170 } }), '50.0.0.2');
  t('攻撃% が非現実的 → flagged（保存はするが集計外）', u.body.counted===false && u.body.flag==='stat_range' && cnt("status='flagged'")===1, JSON.stringify(u.body));
  const fl = async (i, o) => (await call('POST','/v1/usage', base(i, o), '50.0.1.'+i)).body.flag;
  t('全部同じ数字 → stat_uniform', await fl(3, { stats: Object.fromEntries(['teamAtk','teamLeth','atkInf','lethInf','atkLan','lethLan','atkMks','lethMks'].map(k=>[k,999])) })==='stat_uniform');
  t('ほぼ全部0 → stat_zero', await fl(4, { stats: Object.fromEntries(['teamAtk','teamLeth','atkInf','lethInf','atkLan','lethLan','atkMks','lethMks'].map((k,j)=>[k,j?0:10])) })==='stat_zero');
  t('兵数が非現実的 → troops', await fl(5, { troops: [0, 0, 90000000] })==='troops');
  t('補正係数Cが違っても除外しない（ダメージは共通の係数で計算済み）', await fl(6, { calib: 25 })===undefined && await fl(7, { calib: 0.01 })===undefined);
  u = await call('POST','/v1/usage', base(8, { leader: { inf:{id:'mia'}, lan:{id:'mia'}, mks:{id:'bradley'} } }), '50.0.0.8');
  t('兵種違いの英雄 → 400（保存しない）', u.status===400 && u.body.fields.includes('inf:cls') && cnt("cid_hash!=''")===7, JSON.stringify(u.body));
  u = await call('POST','/v1/usage', base(9, { joiners: ['aisling'] }), '50.0.0.9');
  t('未実装世代の乗せ英雄 → 400', u.status===400 && u.body.fields.includes('joiners'));
  u = await worker.fetch(new Request('https://api.whitesim-lab.com/v1/usage', { method:'POST', headers:{ 'Origin':'https://evil.example' }, body: JSON.stringify(base(10)) }), env);
  t('許可していないサイトからは 403', u.status===403);
  u = await worker.fetch(Object.assign(new Request('https://api.whitesim-lab.com/v1/usage', { method:'POST', headers:{ 'Origin':'https://whitesim-lab.com', 'content-type':'text/plain' }, body: JSON.stringify(base(11)) }), { cf: { country: 'DE' } }), env);
  t('EEA からは記録しない', (await u.json()).reason==='region' && cnt('gen=9')===7);
  /* 第9世代に 30 件（うち1件は桁違いのダメージ）→ 集計 */
  for (let i=20;i<50;i++) await call('POST','/v1/usage', base(i, { joiners: i%3 ? ['jessie','jasser','seoyoon','jessie'] : ['jessie','jessie','jessie','jessie'],
    leader: { inf:{id: i%4 ? 'jeronimo':'flint'}, lan:{id:'mia'}, mks:{id:'bradley'} }, damage: i===49 ? 9e9 : 1000000 + (i-20)*200000 }), '60.0.0.'+i);
  /* 口コミ投稿と紐づけ（二重に数えない） */
  const sb = await call('POST','/v1/submit',{ gen:9, tier:'mid', inf:'jeronimo', lan:'mia', mks:'bradley', cid: cid(20), comment:'G9の感想' },'60.0.0.20');
  t('口コミ投稿に cid → 利用データに課金帯と投稿IDが付く', (x => x.spend_tier==='mid' && x.sub_id===sb.body.id)(db.prepare('select spend_tier, sub_id from usage where spend_tier is not null').get()));
  await worker.scheduled({}, env);
  const s9 = JSON.parse(kv.get('stats:gen:9'));
  t('第9世代 n=33（ok の利用データのみ・投稿は二重に数えない）', s9.n===33 && s9.published, 'n='+s9.n);
  t('集結主の人気ランキング', s9.slot.inf[0].id==='jeronimo' && s9.comps[0].ids.join()==='jeronimo,mia,bradley', JSON.stringify(s9.comps[0]));
  t('乗せ英雄の人気ランキング（英雄別・組み合わせ）', s9.joiners && s9.joiners.heroes[0].id==='jessie' && s9.joiners.heroes[0].pct===100 && s9.joiners.sets[0].ids.join()==='jasser,jessie,jessie,seoyoon', JSON.stringify(s9.joiners.sets[0]));
  t('ダメージ分位は利用データから', s9.damage && s9.damage.n>=30 && s9.damage.median>1e6, JSON.stringify(s9.damage));
  t('偏差値の母集団（桁違いの1件は除外）', s9.dev && s9.dev.n===32 && s9.dev.marks[2].score===50 && s9.dev.marks[2].damage>1e6 && s9.dev.marks[2].damage<1e7 && s9.dev.hist.reduce((a,b)=>a+b.n,0)===32, JSON.stringify(s9.dev.marks));
  u = await call('POST','/v1/usage', base(1, { damage: s9.dev.marks[3].damage }), '50.0.0.1');
  t('記録の応答に偏差値の母集団が付く', u.body.dev && u.body.dev.n===32 && Math.abs(50+10*(Math.log10(s9.dev.marks[3].damage)-u.body.dev.mu)/u.body.dev.sd-60)<0.1, JSON.stringify(u.body));
  const sm = (await call('GET','/v1/stats/summary')).body;
  t('summary の件数に利用データが入る', sm.gens[9].n===33, JSON.stringify(sm.gens[9]));
  /* 第5世代: 定時集計の時点では0件 → その後10件たまったら、次の閲覧で即公開される */
  for (let i=200;i<210;i++) await call('POST','/v1/usage', base(i, { gen: 5, leader:{ inf:{id:'jeronimo'}, lan:{id:'mia'}, mks:{id:'gwen'} }, joiners:['jessie','jasser'] }), '80.0.0.'+i);
  t('集計前は KV 上は未公開', JSON.parse(kv.get('stats:gen:5')).published===false);
  const g5 = (await call('GET','/v1/stats/5')).body;
  t('10件に届いた世代は定時集計を待たず公開', g5.published===true && g5.n>=10 && g5.slot.mks[0].id==='gwen' && JSON.parse(kv.get('stats:gen:5')).published===true, JSON.stringify({n:g5.n,p:g5.published}));
  const envR = { ...env, USAGE_PER_IP_DAILY: '2' };
  const cr = async i => (await worker.fetch(req('POST','/v1/usage', base(100+i, { gen: 4, leader:{ inf:{id:'jeronimo'}, lan:{id:'mia'}, mks:{id:'alonso'} }, joiners:[] }), '70.0.0.1'), envR)).status;
  t('同じIPからの大量作成は 429', await cr(1)===200 && await cr(2)===200 && await cr(3)===429);
  u = await call('DELETE','/v1/usage', { cid: cid(1) });
  t('利用データの削除（統計に使わない）', u.body.removed===1 && cnt('gen=9')===36, JSON.stringify(u.body)+' '+cnt('gen=9'));
  t('usageLimits は vars で上書きできる', mod.usageLimits({ USAGE_STAT_MAX: '500' }).statMax===500 && mod.usageLimits({}).statMax===3000);
}

console.log(`\n結果: ${pass} 件OK / ${fail} 件NG`);
process.exit(fail?1:0);
