/* ==== 英雄利用度ランキング（/stats/hero-usage/）（v150） ====
   熊狩シミュレーターの利用データから、世代ごとに「編成に入っていることが多い英雄」を順位で見せる。
   前提: config.js（WOS_API / t()）, toolkit.js（WOS_MAXGEN）, heroes.js（WOS_HEROES / WOS_heroName）, hero-img.js（WOS_heroImg）
   - データは集計API（/v1/stats/summary と /v1/stats/:gen）。選んだ世代を先に出し、ほかの世代（前の世代との比較・移り変わりの表）はあとから読み込む
   - 集計に usage（英雄ごとの人数）があるときはそれを使う。初期編成のまま計算した人を除いた数（picked）が十分あれば、そちらで順位を出す
   - usage が無い（集計APIが古い）ときは、上位だけの一覧（slot / joiners）から出す。その場合「総合」は概算になる
   - 採用率 = その英雄を編成に入れている人の割合。集結主＝集結主3枠、乗せ＝参加者4枠、総合＝どちらかに入れている人 */
(function(){
  var W = window, D = document;
  var root = D.getElementById('huApp'); if(!root) return;
  var API = (W.WOS_API || '').replace(/\/$/, '');
  var t = W.t || function(a){ return a; };
  var BASE = W.WOS_BASE || '';
  var H = W.WOS_HEROES || [], byId = {}; H.forEach(function(h){ byId[h.id] = h; });
  var MAXG = W.WOS_MAXGEN || 17;
  var CLS = ['inf', 'lan', 'mks'];
  var CLS_S = { inf: t('盾', 'INF'), lan: t('槍', 'LAN'), mks: t('弓', 'MKS') };
  /* シミュレーターの初期編成（tools/bear-hunt の初期値と合わせる） */
  var DEF_L = { jeronimo: 1, mia: 1, alonso: 1 }, DEF_J = { jessie: 1, jasser: 1, seoyoon: 1, wayne: 1 };
  var ROLE_N = { a: t('総合', 'Overall'), l: t('集結主', 'Rally leader'), j: t('乗せ（参加者）', 'Joiner') };
  var IC = {
    database: 'M480-120q-151 0-255.5-46.5T120-280v-400q0-66 105.5-113T480-840q149 0 254.5 47T840-680v400q0 67-104.5 113.5T480-120Zm0-488q86 0 176.5-26.5T773-694q-27-32-117.5-59T480-780q-88 0-177 26t-117 60q28 35 116 60.5T480-608Zm-1 214q42 0 84-4.5t80.5-13.5q38.5-9 73.5-22t63-29v-155q-29 16-64 29t-74 22q-39 9-80 14t-83 5q-42 0-84-5t-80.5-14q-38.5-9-73-22T180-618v155q27 16 61 29t72.5 22q38.5 9 80.5 13.5t85 4.5Zm1 214q48 0 99-8.5t93.5-22.5q42.5-14 72-31t35.5-35v-125q-28 16-63 28.5T643.5-352q-38.5 9-80 13.5T479-334q-43 0-85-4.5T313.5-352q-38.5-9-72.5-21.5T180-402v126q5 17 34 34.5t72 31q43 13.5 94 22t100 8.5Z',
    history: 'M477-120q-142 0-243.5-95.5T121-451q-1-12 7.5-21t21.5-9q12 0 20.5 8.5T181-451q11 115 95 193t201 78q127 0 215-89t88-216q0-124-89-209.5T477-780q-68 0-127.5 31T246-667h75q13 0 21.5 8.5T351-637q0 13-8.5 21.5T321-607H172q-13 0-21.5-8.5T142-637v-148q0-13 8.5-21.5T172-815q13 0 21.5 8.5T202-785v76q52-61 123.5-96T477-840q75 0 141 28t115.5 76.5Q783-687 811.5-622T840-482q0 75-28.5 141t-78 115Q684-177 618-148.5T477-120Zm34-374 115 113q9 9 9 21.5t-9 21.5q-9 9-21 9t-21-9L460-460q-5-5-7-10.5t-2-11.5v-171q0-13 8.5-21.5T481-683q13 0 21.5 8.5T511-653v159Z',
    update: 'M483-120q-75 0-141-28.5T226.5-226q-49.5-49-78-115T120-482q0-75 28.5-140t78-113.5Q276-784 342-812t141-28q80 0 151.5 35T758-709v-76q0-13 8.5-21.5T788-815q13 0 21.5 8.5T818-785v148q0 13-8.5 21.5T788-607H639q-13 0-21.5-8.5T609-637q0-13 8.5-21.5T639-667h75q-44-51-103.5-82T483-780q-125 0-214 85.5T180-485q0 127 88 216t215 89q117 0 201-78t95-193q2-13 10.5-21.5T810-481q13 0 21.5 9t7.5 21q-11 140-112.5 235.5T483-120Zm28-374 115 113q9 9 9 21.5t-9 21.5q-9 9-21 9t-21-9L460-460q-5-5-7-10.5t-2-11.5v-171q0-13 8.5-21.5T481-683q13 0 21.5 8.5T511-653v159Z',
    crown: 'M233-160q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h494q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H233Zm20-144q-21.66 0-38.46-14.46Q197.73-332.93 194-355l-45-283q-5 2-9.5 2.5t-9.5.5q-20.83 0-35.42-14.62Q80-664.24 80-685.12 80-706 94.62-721q14.62-15 35.5-15Q151-736 166-721.13q15 14.88 15 36.13 0 8-2.5 16t-7.5 14l148 66 141-194q-14-6-22.5-18.5T429-830q0-20.83 14.82-35.42 14.83-14.58 36-14.58Q501-880 516-865.42q15 14.59 15 35.42 0 16-8.5 28.5T500-783l141 194 148-66q-5-6-7.5-14t-2.5-16q0-21.25 15-36.13Q809-736 829.5-736t35.5 14.82q15 14.83 15 36 0 21.18-14.87 35.68Q850.25-635 829-635q-5 0-9-1t-9-3l-45 284q-3.6 22.07-19.8 36.54Q730-304 707-304H253Zm0-60h454l32-203-73 33q-20 9-40.5 3T592-554L480-709 368-554q-13 17-33.5 23t-40.5-3l-73-33 32 203Zm227 0Z',
    fiber_new: 'M100-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h760q24.75 0 42.38 18Q920-764 920-740v520q0 24-17.62 42-17.63 18-42.38 18H100Zm0-60h760v-520H100v520Zm75-307 110 161q3 5 7.47 7 4.48 2 9.85 2h10.73q8.95 0 14.95-6.13 6-6.12 6-14.87v-203q0-9-6.5-15.5T312-603q-9 0-16 6.5t-7 15.5v148L182-593q-3-5-8.5-7.5t-10.47-2.5h-9.93q-9.1 0-16.1 6.5-7 6.5-7 15.5v202q0 9 7 15.5t16 6.5q9 0 15.5-7t6.5-16v-147Zm219 170h120q9 0 15.5-7t6.5-16q0-9-6.5-15.5T514-402h-85v-54h85q9 0 15.5-7t6.5-16q0-9-6.5-15.5T514-501h-85v-56h84q10.12 0 16.56-6.42 6.44-6.41 6.44-16.5 0-10.08-6.44-16.58-6.44-6.5-16.56-6.5H394q-6 0-10.5 4.5T379-588v216q0 6 4.5 10.5T394-357Zm233 0h170q14.45 0 24.22-9.49Q831-375.98 831-390v-191q0-9-6.5-15.5T809-603q-9 0-16 6.5t-7 15.5v174h-53v-133q0-9-6.5-15.5T711-562q-9 0-16 6.5t-7 15.5v133h-49v-174q0-9-6.5-15.5T617-603q-9 0-16 6.5t-7 15.5v191q0 14.02 9.49 23.51Q612.97-357 627-357ZM100-220v-520 520Z',
    groups: 'M30-240q-12.75 0-21.37-8.63Q0-257.25 0-270v-23q0-38.57 41.5-62.78Q83-380 150.38-380q12.16 0 23.39.5t22.23 2.15q-8 17.35-12 35.17-4 17.81-4 37.18v65H30Zm240 0q-12.75 0-21.37-8.63Q240-257.25 240-270v-35q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v35q0 12.75-8.62 21.37Q702.75-240 690-240H270Zm510 0v-65q0-19.86-3.5-37.43T765-377.27q11-1.73 22.17-2.23 11.17-.5 22.83-.5 67.5 0 108.75 23.77T960-293v23q0 12.75-8.62 21.37Q942.75-240 930-240H780Zm-480-60h360v-6q0-37-50.5-60.5T480-390q-79 0-129.5 23.5T300-305v5ZM149.57-410q-28.57 0-49.07-20.56Q80-451.13 80-480q0-29 20.56-49.5Q121.13-550 150-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T149.57-410Zm660 0q-28.57 0-49.07-20.56Q740-451.13 740-480q0-29 20.56-49.5Q781.13-550 810-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T809.57-410ZM480-480q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm.35-60Q506-540 523-557.35t17-43Q540-626 522.85-643t-42.5-17q-25.35 0-42.85 17.15t-17.5 42.5q0 25.35 17.35 42.85t43 17.5ZM480-300Zm0-300Z',
    bar_chart: 'M690-160q-12.75 0-21.37-8.63Q660-177.25 660-190v-220q0-12.75 8.63-21.38Q677.25-440 690-440h80q12.75 0 21.38 8.62Q800-422.75 800-410v220q0 12.75-8.62 21.37Q782.75-160 770-160h-80Zm-250 0q-12.75 0-21.37-8.63Q410-177.25 410-190v-580q0-12.75 8.63-21.38Q427.25-800 440-800h80q12.75 0 21.38 8.62Q550-782.75 550-770v580q0 12.75-8.62 21.37Q532.75-160 520-160h-80Zm-250 0q-12.75 0-21.37-8.63Q160-177.25 160-190v-380q0-12.75 8.63-21.38Q177.25-600 190-600h80q12.75 0 21.38 8.62Q300-582.75 300-570v380q0 12.75-8.62 21.37Q282.75-160 270-160h-80Z',
    arrow_forward: 'M686-450H190q-13 0-21.5-8.5T160-480q0-13 8.5-21.5T190-510h496L459-737q-9-9-9-21t9-21q9-9 21-9t21 9l278 278q5 5 7 10t2 11q0 6-2 11t-7 10L501-181q-9 9-21 9t-21-9q-9-9-9-21t9-21l227-227Z',
    calculate: 'M314-316v63q0 10.83 7.12 17.92 7.11 7.08 18 7.08 10.88 0 17.88-7.08 7-7.09 7-17.92v-63h63q10.83 0 17.92-7.12 7.08-7.11 7.08-18 0-10.88-7.08-17.88-7.09-7-17.92-7h-63v-63q0-10.83-7.12-17.92-7.11-7.08-18-7.08-10.88 0-17.88 7.08-7 7.09-7 17.92v63h-63q-10.83 0-17.92 7.12-7.08 7.11-7.08 18 0 10.88 7.08 17.88 7.09 7 17.92 7h63Zm240 53h152q10.4 0 17.2-7.12 6.8-7.11 6.8-18 0-10.88-6.5-17.38Q717-312 706-312H553q-10.4 0-17.2 6.5-6.8 6.5-6.8 17.38 0 10.89 7.08 18Q543.17-263 554-263Zm0-107h151q10.83 0 17.92-7.12 7.08-7.11 7.08-18 0-10.88-7.08-17.88-7.09-7-17.92-7H554q-10.83 0-17.92 7.12-7.08 7.11-7.08 18 0 10.88 7.08 17.88 7.09 7 17.92 7ZM266-605h146q10.83 0 17.92-7.12 7.08-7.11 7.08-18 0-10.88-7.08-17.88-7.09-7-17.92-7H266q-10.83 0-17.92 7.12-7.08 7.11-7.08 18 0 10.88 7.08 17.88 7.09 7 17.92 7Zm-86 485q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Zm447 186 43 43q7.64 8 17.82 8t18.18-8q8-8 8-18t-8-18l-43-43 43-43q8-7.64 8-17.82T706-709q-8-8-18.18-8T670-709l-43 43-43-43q-7.64-8-17.82-8T548-709q-8 8-8 18.18t8 17.82l43 43-43 43q-8 7.71-8 18t8 18q7.64 8 17.82 8t18.18-8l43-43Z'
  };
  function ic(name){ return '<svg class="hu-ic" viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="' + IC[name] + '"/></svg>'; }
  function el(id){ return D.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function nameOf(id){ var h = byId[id]; return h ? (W.WOS_heroName ? W.WOS_heroName(h) : h.name) : id; }
  function genTxt(g){ return t('第' + g + '世代', 'Gen ' + g); }
  function pctTxt(p){ return (p >= 99.95 ? '100' : p.toFixed(1)) + '%'; }
  function avatar(id, cls){
    var src = W.WOS_heroImg && W.WOS_heroImg(id);
    return '<span class="hu-av ' + (cls || '') + '">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" width="44" height="44">' : '') + '</span>';
  }
  function clsChip(h){ return '<i class="hu-cl ' + h.cls + '">' + CLS_S[h.cls] + '</i>'; }
  function genChip(h){ return '<i class="hu-g">' + (h.gen > 0 ? 'G' + h.gen : t('常設', 'Base')) + '</i>'; }

  /* ---------- 状態 ---------- */
  var state = { gen: null, role: 'a', cls: 'all', heat: 'mks', more: false };
  var data = {}, summary = null, loadedAll = false, failed = false;
  try{
    var qs = new URLSearchParams(location.search), qg = parseInt(qs.get('gen'), 10), qr = qs.get('role'), qc = qs.get('cls');
    if(qg >= 1 && qg <= MAXG) state.gen = qg;
    if(qr === 'l' || qr === 'j' || qr === 'a') state.role = qr;
    if(qc && CLS.indexOf(qc) >= 0) state.cls = qc;
  }catch(e){}
  function syncUrl(){
    try{ history.replaceState(null, '', location.pathname + '?gen=' + state.gen + (state.role !== 'a' ? '&role=' + state.role : '') + (state.cls !== 'all' ? '&cls=' + state.cls : '')); }catch(e){}
  }

  /* ---------- 読み込み（10分間はブラウザに覚えておく） ---------- */
  var SS_KEY = 'wos_hu_cache_v1', SS_TTL = 600000;
  function cacheLoad(){
    try{ var c = JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); if(c && Date.now() - c.ts < SS_TTL){ summary = c.summary || null; data = c.data || {}; } }catch(e){}
  }
  var saveTm = null;
  function cacheSave(){ clearTimeout(saveTm); saveTm = setTimeout(function(){ try{ sessionStorage.setItem(SS_KEY, JSON.stringify({ ts: Date.now(), summary: summary, data: data })); }catch(e){} }, 300); }
  function getJSON(path){
    return fetch(API + path, { mode: 'cors', credentials: 'omit' }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }
  var inflight = {};
  function loadGen(g){
    if(data[g]) return Promise.resolve(data[g]);
    if(!inflight[g]) inflight[g] = getJSON('/v1/stats/' + g).then(function(s){ inflight[g] = null; if(s){ data[g] = s; cacheSave(); } return s; });
    return inflight[g];
  }
  function published(g){ return !!(summary && summary.gens && summary.gens[g] && summary.gens[g].published); }
  function countOf(g){ return summary && summary.gens && summary.gens[g] ? summary.gens[g].n : 0; }

  /* ---------- 1世代ぶんの利用度: 役割ごとに「英雄ID → 採用率(%)」 ---------- */
  function usageOf(s){
    if(!s || !s.published) return null;
    if(s.__u) return s.__u;
    var U = s.usage && s.usage.all && s.usage.all.h ? s.usage : null, out;
    if(U){
      var pick = function(k){ return U.use && U.use[k] === 'picked' && U.picked && U.picked.h ? U.picked : U.all; };
      var BL = pick('l'), BJ = pick('j'), BA = pick('a');
      out = { exact: true, basis: { l: BL === U.all ? 'all' : 'picked', j: BJ === U.all ? 'all' : 'picked', a: BA === U.all ? 'all' : 'picked' },
              n: { l: BL.nL, j: BJ.nJ, a: BA.nA }, l: {}, j: {}, a: {}, defaults: U.defaults || {} };
      Object.keys(BL.h).forEach(function(id){ if(BL.h[id][0] > 0 && BL.nL) out.l[id] = BL.h[id][0] / BL.nL * 100; });
      Object.keys(BJ.h).forEach(function(id){ if(BJ.h[id][1] > 0 && BJ.nJ) out.j[id] = BJ.h[id][1] / BJ.nJ * 100; });
      Object.keys(BA.h).forEach(function(id){ if(BA.h[id][2] > 0 && BA.nA) out.a[id] = BA.h[id][2] / BA.nA * 100; });
    }else{
      /* 古い集計: 上位だけの一覧から。総合は「集結主か乗せのどちらかで使う」を、2つが独立だとみなして概算する */
      out = { exact: false, basis: { l: 'all', j: 'all', a: 'all' }, n: { l: s.n, j: s.joiners ? s.joiners.n : 0, a: s.n }, l: {}, j: {}, a: {}, defaults: {} };
      CLS.forEach(function(c){ ((s.slot && s.slot[c]) || []).forEach(function(x){ out.l[x.id] = x.pct; }); });
      ((s.joiners && s.joiners.heroes) || []).forEach(function(x){ out.j[x.id] = x.pct; });
      Object.keys(out.l).concat(Object.keys(out.j)).forEach(function(id){ out.a[id] = (1 - (1 - (out.l[id] || 0) / 100) * (1 - (out.j[id] || 0) / 100)) * 100; });
      var dj = Object.keys(DEF_J).filter(function(id){ return byId[id] && byId[id].gen <= s.gen; }).sort().join(',');
      ((s.joiners && s.joiners.sets) || []).forEach(function(x){ if(x.ids.join(',') === dj) out.defaults.j = x.pct / 100; });
      (s.comps || []).forEach(function(x){ if(x.ids.join(',') === 'jeronimo,mia,alonso') out.defaults.l = x.pct / 100; });
    }
    try{ Object.defineProperty(s, '__u', { value: out, enumerable: false }); }catch(e){}
    return out;
  }
  /* 順位表（同じ採用率は同じ順位） */
  function rankRows(g, role, cls){
    var u = usageOf(data[g]); if(!u) return null;
    var m = u[role], rows = [];
    Object.keys(m).forEach(function(id){
      var h = byId[id]; if(!h || h.gen > g) return;
      if(cls !== 'all' && h.cls !== cls) return;
      rows.push({ id: id, h: h, pct: m[id], l: u.l[id] || 0, j: u.j[id] || 0 });
    });
    rows.sort(function(a, b){ return b.pct - a.pct || (b.l + b.j) - (a.l + a.j) || (a.id < b.id ? -1 : 1); });
    rows.forEach(function(r, i){ r.rank = i > 0 && Math.abs(rows[i - 1].pct - r.pct) < 1e-9 ? rows[i - 1].rank : i + 1; });
    return rows;
  }

  /* ---------- 描画 ---------- */
  function renderMeta(){
    var box = el('huMeta'); if(!box) return;
    if(!summary){ box.innerHTML = ''; return; }
    var tot = 0, gens = 0; for(var g = 1; g <= MAXG; g++) if(published(g)){ tot += countOf(g); gens++; }
    box.innerHTML = '<span>' + ic('database') + t('利用データ ' + tot.toLocaleString('ja-JP') + '件', tot.toLocaleString('en-US') + ' line-ups') + '</span>'
      + '<span>' + ic('history') + t('直近' + (summary.windowDays || 90) + '日', 'last ' + (summary.windowDays || 90) + ' days') + '</span>'
      + '<span>' + ic('update') + t('毎朝5時ごろ更新', 'updated daily') + '</span>';
  }
  function renderCtl(){
    var gs = '';
    for(var g = 1; g <= MAXG; g++){
      var ok = published(g);
      gs += '<button type="button" class="hu-gb' + (g === state.gen ? ' on' : '') + '" data-gen="' + g + '"' + (ok ? '' : ' disabled') + ' aria-pressed="' + (g === state.gen) + '"><b>G' + g + '</b><em>' + (ok ? t(countOf(g) + '件', String(countOf(g))) : t('集計中', 'soon')) + '</em></button>';
    }
    el('huGens').innerHTML = gs;
    el('huRole').innerHTML = ['a', 'l', 'j'].map(function(k){ return '<button type="button" class="' + (k === state.role ? 'on' : '') + '" data-role="' + k + '" aria-pressed="' + (k === state.role) + '">' + ROLE_N[k] + '</button>'; }).join('');
    el('huCls').innerHTML = [['all', t('すべて', 'All')], ['inf', CLS_S.inf], ['lan', CLS_S.lan], ['mks', CLS_S.mks]].map(function(a){
      return '<button type="button" class="' + (a[0] === state.cls ? 'on' : '') + '" data-cls="' + a[0] + '" aria-pressed="' + (a[0] === state.cls) + '">' + a[1] + '</button>'; }).join('');
  }
  function moveHtml(r, prev, g){
    if(r.h.gen === g) return '<span class="hu-mv new">NEW</span>';
    if(!prev) return '<span class="hu-mv"></span>';
    var p = null; for(var i = 0; i < prev.length; i++) if(prev[i].id === r.id){ p = prev[i].rank; break; }
    if(p == null) return '<span class="hu-mv up" title="' + t('前の世代ではランク外', 'Unranked in the previous generation') + '">▲</span>';
    var d = p - r.rank;
    return d > 0 ? '<span class="hu-mv up">▲' + d + '</span>' : d < 0 ? '<span class="hu-mv dn">▼' + (-d) + '</span>' : '<span class="hu-mv eq">—</span>';
  }
  function barHtml(r, role){
    /* 濃い色＝集結主、淡い色＝乗せ。総合は全体の長さを採用率に合わせ、内訳は集結主ぶんを濃く塗る */
    var tot = Math.min(100, r.pct), dark = role === 'j' ? 0 : role === 'l' ? tot : Math.min(tot, r.l), light = Math.max(0, tot - dark);
    return '<span class="hu-bar ' + r.h.cls + '"><i style="width:' + dark.toFixed(2) + '%"></i><i class="lt" style="width:' + light.toFixed(2) + '%"></i></span>';
  }
  function detailTxt(r){ return t('集結主 ', 'Leader ') + (r.l > 0 ? pctTxt(r.l) : '—') + t('・乗せ ', ' · joiner ') + (r.j > 0 ? pctTxt(r.j) : '—'); }
  function defTag(r, u, role){
    var isDef = (role !== 'j' && u.basis.l === 'all' && DEF_L[r.id]) || (role !== 'l' && u.basis.j === 'all' && DEF_J[r.id]);
    return isDef ? '<i class="hu-def" title="' + t('シミュレーターを開いたときに最初から入っている英雄です。選び直していない人のぶんも含まれます', 'Pre-selected when the simulator opens, so this includes people who never changed it') + '">' + t('初期編成に含まれる', 'In the default line-up') + '</i>' : '';
  }
  function renderRank(){
    var box = el('huRank'), g = state.gen, s = data[g], u = usageOf(s);
    if(!u){
      box.innerHTML = '<p class="hu-wait">' + (failed ? t('集計データを読み込めませんでした。時間をおいて、もう一度開いてください。', 'Could not load the data. Please try again later.')
        : s && !s.published ? t(genTxt(g) + 'はデータを集計中です（10件から公開）。', genTxt(g) + ' is still collecting data (opens at 10).') : t('読み込み中…', 'Loading…')) + '</p>';
      return;
    }
    var rows = rankRows(g, state.role, state.cls) || [], prev = g > 1 && data[g - 1] ? rankRows(g - 1, state.role, state.cls) : null;
    var nn = u.n[state.role], basis = u.basis[state.role];
    var title = genTxt(g) + t('の' + (state.role === 'a' ? '総合' : state.role === 'l' ? '集結主' : '乗せ') + 'ランキング', ': ' + ROLE_N[state.role].toLowerCase() + ' ranking') + (state.cls !== 'all' ? t('（' + CLS_S[state.cls] + '）', ' (' + CLS_S[state.cls] + ')') : '');
    var sub = state.role === 'a' ? t('集結主3人か乗せ4人のどこかに入れている人の割合です。', 'Share of players who use the hero as a rally leader or as a joiner.')
      : state.role === 'l' ? t('集結主の3枠に入れている人の割合です。', 'Share of players who run the hero as one of the three rally leaders.')
      : t('乗せ（参加者）の4枠に入れている人の割合です。', 'Share of players who send the hero as one of the four joiners.');
    if(prev) sub += t(' ▲▼は' + genTxt(g - 1) + 'とくらべた順位の動きです。', ' ▲▼ shows the move versus ' + genTxt(g - 1) + '.');
    var html = '<div class="hu-rh"><h2>' + title + '</h2><span class="hu-n">n=' + nn + '</span></div><p class="hu-sub">' + sub + '</p>';
    if(!rows.length){
      box.innerHTML = html + '<p class="hu-wait">' + t('この条件にあてはまる英雄はまだいません。', 'No heroes match this filter yet.') + '</p>';
      return;
    }
    html += '<ol class="hu-pod">' + rows.slice(0, 3).map(function(r, i){
      return '<li class="p' + (i + 1) + '"><div class="pr"><b>' + r.rank + '</b><small>' + t('位', '') + '</small>' + (i === 0 ? ic('crown') : '') + moveHtml(r, prev, g) + '</div>'
        + '<div class="ph">' + avatar(r.id, 'lg') + '<div><strong>' + esc(nameOf(r.id)) + '</strong><span>' + clsChip(r.h) + genChip(r.h) + '</span></div></div>'
        + '<div class="pp"><b>' + pctTxt(r.pct) + '</b><small>' + t('採用率', 'pick rate') + '</small></div>' + barHtml(r, state.role)
        + '<div class="pd">' + detailTxt(r) + '</div>' + defTag(r, u, state.role) + '</li>';
    }).join('') + '</ol>';
    var rest = rows.slice(3), LIM = 12, show = state.more ? rest : rest.slice(0, LIM);
    if(show.length){
      html += '<ol class="hu-list">' + show.map(function(r){
        return '<li><b class="rk">' + r.rank + '</b>' + moveHtml(r, prev, g) + avatar(r.id) + '<div class="nm"><strong>' + esc(nameOf(r.id)) + '</strong><span>' + clsChip(r.h) + genChip(r.h) + defTag(r, u, state.role) + '</span></div>'
          + '<div class="br">' + barHtml(r, state.role) + '<small>' + detailTxt(r) + '</small></div><b class="pv">' + pctTxt(r.pct) + '</b></li>';
      }).join('') + '</ol>';
      if(rest.length > LIM) html += '<button type="button" class="hu-more" data-more="1">' + (state.more ? t('上位だけ表示', 'Show fewer') : t('残り ' + (rest.length - LIM) + '人も表示', 'Show ' + (rest.length - LIM) + ' more')) + '</button>';
    }
    /* 凡例と、数え方の注記 */
    html += '<div class="hu-leg"><span><i class="d"></i>' + t('濃い色＝集結主で使用', 'Dark: as rally leader') + '</span><span><i class="l"></i>' + t('淡い色＝乗せで使用', 'Light: as joiner') + '</span></div>';
    var note = '';
    if(basis === 'picked') note = t('英雄を自分で選び直した人（' + nn + '人）だけで集計しています。シミュレーターを開いたままの初期編成で計算されたデータは、この順位に入れていません。',
      'Counted only from the ' + nn + ' players who picked their own heroes. Line-ups left at the simulator’s default are not part of this ranking.');
    else{
      var dl = u.defaults && u.defaults.l, djv = u.defaults && u.defaults.j;
      note = t('シミュレーターを開いたときに最初から入っている編成（集結主 ジェロニモ・ミア・アロンソ／乗せ ジェシー・ジャセル・ソユン・ウェイン）のまま計算した人も含まれます。',
        'This includes people who calculated with the simulator’s pre-selected line-up (leaders Jeronimo, Mia, Alonso / joiners Jessie, Jasser, Seo-yoon, Wayne).');
      if(state.role !== 'j' && dl > 0.05) note += t(' ' + genTxt(g) + 'では集結主が初期編成と同じ人が ' + pctTxt(dl * 100) + ' います。', ' In ' + genTxt(g) + ', ' + pctTxt(dl * 100) + ' have exactly the default leaders.');
      if(state.role !== 'l' && djv > 0.05) note += t(' 乗せが初期編成と同じ人は ' + pctTxt(djv * 100) + ' です。', ' ' + pctTxt(djv * 100) + ' have exactly the default joiners.');
      note += t(' 「初期編成に含まれる」の印がある英雄は、実際より高めに出ている可能性があります。', ' Heroes tagged “In the default line-up” may read higher than they really are.');
    }
    if(!u.exact && state.role === 'a') note += t(' 総合は、集結主と乗せの割合から出した概算です。', ' Overall is an estimate from the leader and joiner shares.');
    html += '<p class="hu-note">' + note + '</p>';
    box.innerHTML = html;
  }
  function renderSide(){
    var g = state.gen, s = data[g], u = usageOf(s), nb = el('huNew'), cb = el('huCombo'), lb = el('huLinks');
    /* その世代で登場した英雄 */
    var news = H.filter(function(h){ return h.gen === g; }).sort(function(a, b){ return CLS.indexOf(a.cls) - CLS.indexOf(b.cls); });
    if(u && news.length){
      nb.hidden = false;
      nb.innerHTML = '<h3>' + ic('fiber_new') + genTxt(g) + t('の新英雄の採用率', ': new heroes') + '</h3><ul>' + news.map(function(h){
        var l = u.l[h.id] || 0, j = u.j[h.id] || 0;
        return '<li>' + avatar(h.id) + '<div><strong>' + esc(nameOf(h.id)) + clsChip(h) + '</strong><span class="hu-bar ' + h.cls + '"><i style="width:' + Math.min(100, l).toFixed(2) + '%"></i></span>'
          + '<small>' + t('集結主 ', 'Leader ') + '<b>' + (l > 0 ? pctTxt(l) : t('圏外', '—')) + '</b>' + t('・乗せ ', ' · joiner ') + '<b>' + (j > 0 ? pctTxt(j) : t('圏外', '—')) + '</b></small></div></li>';
      }).join('') + '</ul>';
    }else{ nb.hidden = true; nb.innerHTML = ''; }
    /* よく使われる組み合わせ */
    if(s && s.published && ((s.comps && s.comps.length) || (s.joiners && s.joiners.sets && s.joiners.sets.length))){
      var list = function(arr){ return '<ol>' + arr.slice(0, 3).map(function(c, i){ return '<li><b>' + (i + 1) + '</b><span>' + c.ids.map(function(id){ return esc(nameOf(id)); }).join(t('・', ', ')) + '</span><em>' + pctTxt(c.pct) + '</em></li>'; }).join('') + '</ol>'; };
      cb.hidden = false;
      cb.innerHTML = '<h3>' + ic('groups') + t('よく使われる組み合わせ', 'Popular combinations') + '</h3>'
        + (s.comps && s.comps.length ? '<h4>' + t('集結主の3人', 'Three rally leaders') + '</h4>' + list(s.comps) : '')
        + (s.joiners && s.joiners.sets && s.joiners.sets.length ? '<h4>' + t('乗せの4人', 'Four joiners') + '</h4>' + list(s.joiners.sets) : '')
        + '<p class="hu-note">' + t('組み合わせは、初期編成のまま計算した人も含めた割合です。', 'Combinations include people who kept the default line-up.') + '</p>';
    }else{ cb.hidden = true; cb.innerHTML = ''; }
    lb.innerHTML = '<a href="' + BASE + '/stats/gen-' + (g < 10 ? '0' : '') + g + '/">' + ic('bar_chart') + '<span>' + genTxt(g) + t('のおすすめ英雄・最強構成', ': best heroes & builds') + '</span>' + ic('arrow_forward') + '</a>'
      + '<a href="' + BASE + '/tools/bear-hunt/">' + ic('calculate') + '<span>' + t('自分の編成でダメージと偏差値を見る', 'Check your own damage and score') + '</span>' + ic('arrow_forward') + '</a>';
  }
  /* 世代ごとの移り変わり（全世代を読み込んでから出す） */
  function renderHeat(){
    var box = el('huHeat'); if(!box) return;
    var tabs = [['inf', t('盾（集結主）', 'INF (leader)')], ['lan', t('槍（集結主）', 'LAN (leader)')], ['mks', t('弓（集結主）', 'MKS (leader)')], ['j', t('乗せ', 'Joiners')]];
    var head = '<h2>' + t('世代ごとの移り変わり', 'How it shifts by generation') + '</h2><p class="hu-sub">'
      + (state.heat === 'j' ? t('乗せ（参加者）に入れている人の割合を、世代ごとに並べました。', 'Share of players sending each hero as a joiner, by generation.')
        : t('集結主の' + CLS_S[state.heat] + '枠に置いている人の割合を、世代ごとに並べました。', 'Share of players running each hero in the ' + CLS_S[state.heat] + ' leader slot, by generation.'))
      + t('数字は%で、色が濃いほどよく使われています。灰色はまだ登場していない世代、または集計中の世代です。', ' Numbers are %, darker means more common. Grey: not released yet in that generation, or still collecting data.') + '</p>'
      + '<div class="hu-tabs" role="group">' + tabs.map(function(a){ return '<button type="button" class="' + (a[0] === state.heat ? 'on' : '') + '" data-heat="' + a[0] + '" aria-pressed="' + (a[0] === state.heat) + '">' + a[1] + '</button>'; }).join('') + '</div>';
    if(!loadedAll){ box.innerHTML = head + '<p class="hu-wait">' + t('ほかの世代を読み込み中…', 'Loading the other generations…') + '</p>'; return; }
    var role = state.heat === 'j' ? 'j' : 'l', per = {}, ids = {};
    for(var g = 1; g <= MAXG; g++){
      var u = usageOf(data[g]); if(!u) continue;
      per[g] = u[role];
      Object.keys(u[role]).forEach(function(id){ var h = byId[id]; if(!h || h.gen > g) return; if(role === 'l' && h.cls !== state.heat) return; if(u[role][id] >= 3) ids[id] = 1; });
    }
    var rows = Object.keys(ids).map(function(id){ return byId[id]; }).sort(function(a, b){ return a.gen - b.gen || CLS.indexOf(a.cls) - CLS.indexOf(b.cls) || (a.id < b.id ? -1 : 1); });
    if(!rows.length){ box.innerHTML = head + '<p class="hu-wait">' + t('表示できるデータがまだありません。', 'Not enough data yet.') + '</p>'; return; }
    var RGB = { inf: '91,122,158', lan: '29,158,116', mks: '232,115,12' };
    var th = '<tr><th scope="col" class="h0">' + t('英雄', 'Hero') + '</th>'; for(g = 1; g <= MAXG; g++) th += '<th scope="col"' + (g === state.gen ? ' class="cur"' : '') + '>G' + g + '</th>'; th += '</tr>';
    var body = rows.map(function(h){
      var tr = '<tr><th scope="row" class="h0"><div>' + avatar(h.id, 'sm') + '<span>' + esc(nameOf(h.id)) + '</span>' + (role === 'j' ? clsChip(h) : '') + genChip(h) + '</div></th>';
      for(var g2 = 1; g2 <= MAXG; g2++){
        var cur = g2 === state.gen ? ' cur' : '';
        if(!per[g2] || h.gen > g2){ tr += '<td class="na' + cur + '"></td>'; continue; }
        var v = per[g2][h.id] || 0, a = v > 0 ? Math.min(0.92, 0.1 + v / 100 * 0.85) : 0;
        tr += '<td class="' + (v >= 55 ? 'hi' : '') + cur + '"' + (v >= 0.5 ? ' style="background:rgba(' + RGB[h.cls] + ',' + a.toFixed(2) + ')"' : '') + '>' + (v >= 0.5 ? Math.round(v) : '') + '</td>';
      }
      return tr + '</tr>';
    }).join('');
    box.innerHTML = head + '<div class="hu-scroll"><table class="hu-heat"><thead>' + th + '</thead><tbody>' + body + '</tbody></table></div>'
      + '<p class="hu-note">' + t('どこかの世代で3%以上使われている英雄だけを載せています。', 'Only heroes used by at least 3% in some generation are listed.') + '</p>';
  }
  function renderAll(){ renderCtl(); renderRank(); renderSide(); renderHeat(); }

  /* ---------- 操作 ---------- */
  function selectGen(g){
    state.gen = g; state.more = false; syncUrl(); renderAll();
    var need = [g]; if(g > 1 && published(g - 1)) need.push(g - 1);
    Promise.all(need.map(loadGen)).then(function(rs){ if(state.gen !== g) return; failed = !rs[0]; renderRank(); renderSide(); });
  }
  root.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('button'); if(!b || b.disabled) return;
    if(b.hasAttribute('data-gen')){ selectGen(parseInt(b.getAttribute('data-gen'), 10)); return; }
    if(b.hasAttribute('data-role')){ state.role = b.getAttribute('data-role'); state.more = false; syncUrl(); renderCtl(); renderRank(); return; }
    if(b.hasAttribute('data-cls')){ state.cls = b.getAttribute('data-cls'); state.more = false; syncUrl(); renderCtl(); renderRank(); return; }
    if(b.hasAttribute('data-heat')){ state.heat = b.getAttribute('data-heat'); renderHeat(); return; }
    if(b.hasAttribute('data-more')){ state.more = !state.more; renderRank(); }
  });

  /* ---------- 開始 ---------- */
  function start(){
    if(!API){ failed = true; el('huRank').innerHTML = '<p class="hu-wait">' + t('集計データを読み込めませんでした。', 'Could not load the data.') + '</p>'; return; }
    cacheLoad();
    (summary ? Promise.resolve(summary) : getJSON('/v1/stats/summary')).then(function(sm){
      if(!sm || !sm.gens){ failed = true; renderRank(); return; }
      summary = sm; cacheSave();
      /* 世代の指定が無い・集計中のときは、データがいちばん多い世代から */
      if(!state.gen || !published(state.gen)){ var best = null; for(var g = 1; g <= MAXG; g++) if(published(g) && (best == null || countOf(g) > countOf(best))) best = g; state.gen = best || state.gen || MAXG; }
      renderMeta(); selectGen(state.gen);
      /* 残りの世代は少しずつ読み込む（移り変わりの表用） */
      var queue = []; for(var g2 = 1; g2 <= MAXG; g2++) if(published(g2) && !data[g2]) queue.push(g2);
      var run = function(){ var g3 = queue.shift(); if(g3 == null) return Promise.resolve(); return loadGen(g3).then(run); };
      Promise.all([run(), run(), run()]).then(function(){ loadedAll = true; renderRank(); renderHeat(); });
    });
  }
  if(D.readyState !== 'loading') start(); else D.addEventListener('DOMContentLoaded', start);
})();
