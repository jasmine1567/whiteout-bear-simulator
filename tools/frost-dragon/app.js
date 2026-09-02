/* =====================================================================
   霜竜イベント 同盟配置計算ツール  app.js
   - ビルド不要 / 依存ライブラリなし / 完全クライアントサイド
   - 入れ物(集合先同盟) 1〜3 に対応。全入れ物がボーダーを超える配置を
     総当たり探索し、必要なら1同盟の「分割指示(総力ベース)」も自動生成。
   - 二言語: window.WOS_LANG / data-wos-lang に追従（切替はページ再読込前提）
   ===================================================================== */
(function(){
"use strict";

var EN = (function(){
  try{
    if(window.WOS_LANG) return window.WOS_LANG === 'en';
    return document.documentElement.getAttribute('data-wos-lang') === 'en';
  }catch(e){ return false; }
})();
function T(ja,en){ return EN ? en : ja; }

/* ================= 数値パース / フォーマット ================= */
function toHalf(s){
  return s.replace(/[０-９．，]/g, function(ch){
    if(ch === '．') return '.';
    if(ch === '，') return ',';
    return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
  });
}
/* 「3億5000万」「1,200,000」「3.5B」「550M」「12k」等に対応 */
function parsePower(raw){
  if(raw == null) return NaN;
  var s = toHalf(String(raw)).replace(/[,\s、]/g,'');
  if(s === '') return NaN;
  var re = /(\d+(?:\.\d+)?)(億|万|[bB]|[mM]|[kK]|[gG])?/g;
  var m, total = 0, matchedLen = 0;
  while((m = re.exec(s)) !== null){
    if(m[0] === '') break;
    var v = parseFloat(m[1]);
    var u = m[2] || '';
    var unit = 1;
    if(u === '億') unit = 1e8;
    else if(u === '万') unit = 1e4;
    else if(u === 'b' || u === 'B' || u === 'g' || u === 'G') unit = 1e9;
    else if(u === 'm' || u === 'M') unit = 1e6;
    else if(u === 'k' || u === 'K') unit = 1e3;
    total += v * unit;
    matchedLen += m[0].length;
  }
  if(matchedLen !== s.length || matchedLen === 0) return NaN;
  return total;
}
function parseIntPos(raw){
  var s = toHalf(String(raw == null ? '' : raw)).replace(/[,\s人]/g,'');
  if(s === '') return NaN;
  var n = Number(s);
  return (isFinite(n) && n >= 0) ? Math.floor(n) : NaN;
}
function trimNum(v){
  var r = Math.round(v * 100) / 100;
  return String(r).replace(/\.0+$/,'').replace(/(\.\d*[1-9])0+$/,'$1');
}
function fmtPower(n){
  if(!isFinite(n)) return '-';
  var neg = n < 0, a = Math.abs(n), out;
  if(EN){
    if(a >= 1e9) out = trimNum(a/1e9) + 'B';
    else if(a >= 1e6) out = trimNum(a/1e6) + 'M';
    else if(a >= 1e3) out = trimNum(a/1e3) + 'K';
    else out = String(Math.round(a));
  }else{
    if(a >= 1e8) out = trimNum(a/1e8) + '億';
    else if(a >= 1e4) out = trimNum(a/1e4) + '万';
    else out = String(Math.round(a));
  }
  return (neg ? '-' : '') + out;
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ================= UI文字列 ================= */
var VNUM = ['①','②','③'];
var S = {
  vesselTitle: function(i){ return T('❄ 入れ物' + VNUM[i], '❄ Host ' + VNUM[i]); },
  vesselName: T('同盟名','Alliance name'),
  vesselNamePh: function(i){ return ['ABC', 'XYZ', 'QRS'][i] + T('同盟',''); },
  slots: T('空き人数','Free slots'),
  slotsPh: ['40','55','30'],
  curPower: T('現在の総力','Current power'),
  curPowerPh: EN ? ['1.2B','900M','700M'] : ['12億','9億','7億'],
  borderPh: EN ? 'e.g. 3B / 3000000000' : '例: 30億 / 3000000000',
  appName: T('同盟名','Alliance name'),
  appNamePh: T('例: DEF同盟','e.g. DEF'),
  members: T('人数','Members'),
  membersPh: T('例: 25','e.g. 25'),
  power: T('総力','Power'),
  powerPh: EN ? 'e.g. 800M' : '例: 8億',
  del: T('✕ 削除','✕ Remove'),
  parsed: function(v){ return '= ' + fmtPower(v); },
  parseErr: T('数値を読み取れません','Could not read the number'),
  defAlliance: function(i){ return T('同盟','Alliance ') + (i+1); },
  errBorder: T('ボーダー総力を入力してください。','Please enter the border power.'),
  errVSlots: function(l){ return T(l + 'の空き人数を入力してください。','Enter free slots for ' + l + '.'); },
  errVPower: function(l){ return T(l + 'の現在の総力を入力してください。','Enter current power for ' + l + '.'); },
  errAppMem: function(n){ return T(n + ' の人数を入力してください。','Enter members for ' + n + '.'); },
  errAppPow: function(n){ return T(n + ' の総力を入力してください。','Enter power for ' + n + '.'); },
  errNoApps: T('参加希望の同盟を1つ以上入力してください。','Please enter at least one applicant alliance.'),
  shareTitle: T('❄️霜竜イベント 配置指示❄️','❄️ Frost Dragon — Placement Orders ❄️'),
  shareBorder: T('ボーダー','Border'),
  hostLabel: function(i,name){ return T('■入れ物' + VNUM[i] + '「' + name + '」','■ Host ' + VNUM[i] + ' "' + name + '"'); },
  hostState: function(p,s){ return T('（現在' + p + ' / 空き' + s + '）',' (now ' + p + ' / ' + s + ' slots)'); },
  memberLine: function(n,m,p){ return '・' + n + ' ' + m + T('人','') + ' / ' + p; },
  memberLineSplit: function(n,m,p){ return '・' + n + T('(分割) ',' (split) ') + m + T('人','') + ' / ' + T('約','~') + p; },
  afterTotal: function(p,rest){ return T('→ 合流後: ' + p + '（空き残り' + rest + '）','→ After merge: ' + p + ' (' + rest + ' slots left)'); },
  passed: function(d){ return T('✅ボーダー達成（+' + d + '）','✅ Border cleared (+' + d + ')'); },
  failed: function(d){ return T('⚠️未達（あと' + d + '）','⚠️ Short by ' + d); },
  badgeOk: function(d){ return T('✅ 達成 +' + d,'✅ Cleared +' + d); },
  badgeNg: function(d){ return T('⚠️ 未達 あと' + d,'⚠️ Short by ' + d); },
  noJoin: T('合流なし（現在のメンバーのみ）','No merges (current members only)'),
  curState: function(p,s){ return T('現在 ' + p + ' / 空き' + s + '人','Now ' + p + ' / ' + s + ' free slots'); },
  totalLabel: T('合流後の総力','Power after merge'),
  slotLeft: function(r){ return T('空き残り ' + r + '人',r + ' slots left'); },
  splitHead: T('✂ 分割指示','✂ Split order'),
  splitIntro: function(n,m,p){ return T('<b>' + n + '</b>（' + m + '人 / ' + p + '）は分割してください:','<b>' + n + '</b> (' + m + ' members / ' + p + ') should be split:'); },
  splitTo: function(i,name,pow,mem){ return T('→ 入れ物' + VNUM[i] + '「' + name + '」へ <b>約' + pow + '（' + mem + '人）</b>','→ move <b>~' + pow + ' (' + mem + ' members)</b> to Host ' + VNUM[i] + ' "' + name + '"'); },
  splitRest: function(pow,mem){ return T('→ 残り 約' + pow + '（' + mem + '人）は見送り','→ remaining ~' + pow + ' (' + mem + ' members) sit out'); },
  splitShareIntro: function(n,m,p){ return '・' + n + T('（' + m + '人/' + p + '）は分割:',' (' + m + ' members / ' + p + ') split as follows:'); },
  splitShareTo: function(i,name,pow,mem){ return '  ' + T('→「' + name + '」へ 約' + pow + '（' + mem + '人）','→ ~' + pow + ' (' + mem + ') to "' + name + '"'); },
  splitShareRest: function(pow,mem){ return '  ' + T('→ 残り 約' + pow + '（' + mem + '人）は見送り','→ remaining ~' + pow + ' (' + mem + ') sit out'); },
  outHead: T('参加見送り（空き人数の都合）','Sitting out (capacity limits)'),
  outShareHead: T('■参加見送り','■ Sitting out'),
  lackAll: T('⚠️ この組み合わせでは全ての入れ物がボーダーを超えられません。','⚠️ With these inputs, not every host can clear the border.'),
  lackLine: function(i,d){ return T('・入れ物' + VNUM[i] + ': あと' + d + '不足','・Host ' + VNUM[i] + ': short by ' + d); },
  lackAdvice: T('入れ物の数を減らして集約する、参加同盟を増やす、空き人数を増やす等をご検討ください。','Consider using fewer hosts, adding more applicants, or freeing up more slots.'),
  lackShare: function(i,d){ return T('⚠️入れ物' + VNUM[i] + ' あと' + d + '不足','⚠️ Host ' + VNUM[i] + ' short by ' + d); },
  singleLack: function(d){ return T('⚠️ ボーダーまで <b>あと' + d + '</b> 足りません。空き人数の確保、または参加同盟の追加を検討してください。','⚠️ Still <b>' + d + ' short</b> of the border. Try freeing up more slots or adding applicants.'); },
  approxNote: T('同盟数が多いため近似計算です。結果は目安としてご利用ください。','Too many alliances for an exact search — this result is a good approximation.'),
  noCombo: T('空き人数の制約で配置できる組み合わせがありません。入れ物の空き人数を確認してください。','No feasible combination under the slot limits. Please check each host\'s free slots.'),
  copied: T('✅ コピーしました','✅ Copied'),
  copyLabel: '📋 ' + T('コピー','Copy')
};

/* ================= 入れ物UIの生成 ================= */
var vesselCount = 1;
var vesselValues = [ {name:'',slots:'',power:''}, {name:'',slots:'',power:''}, {name:'',slots:'',power:''} ];

function renderVessels(){
  var box = document.getElementById('fdVessels');
  box.innerHTML = '';
  for(var i=0;i<vesselCount;i++){
    (function(i){
      var d = document.createElement('div');
      d.className = 'fd-vessel';
      d.setAttribute('data-v', String(i));
      d.innerHTML =
        '<h3>' + S.vesselTitle(i) + '</h3>' +
        '<label>' + esc(S.vesselName) + '</label>' +
        '<input type="text" class="fdv-name" placeholder="' + esc(S.vesselNamePh(i)) + '">' +
        '<div class="fd-grid2" style="margin-top:10px;">' +
          '<div><label>' + esc(S.slots) + '</label>' +
            '<input type="text" class="fdv-slots" inputmode="numeric" placeholder="' + esc(T('例: ','e.g. ') + S.slotsPh[i]) + '"></div>' +
          '<div><label>' + esc(S.curPower) + '</label>' +
            '<input type="text" class="fdv-power" inputmode="decimal" placeholder="' + esc(T('例: ','e.g. ') + S.curPowerPh[i]) + '">' +
            '<div class="fd-pv"></div></div>' +
        '</div>';
      box.appendChild(d);
      var nameI = d.querySelector('.fdv-name'), slotsI = d.querySelector('.fdv-slots'), powI = d.querySelector('.fdv-power'), pv = d.querySelector('.fd-pv');
      nameI.value = vesselValues[i].name; slotsI.value = vesselValues[i].slots; powI.value = vesselValues[i].power;
      nameI.addEventListener('input', function(){ vesselValues[i].name = nameI.value; });
      slotsI.addEventListener('input', function(){ vesselValues[i].slots = slotsI.value; });
      powI.addEventListener('input', function(){
        vesselValues[i].power = powI.value;
        showPv(powI, pv);
      });
      showPv(powI, pv);
    })(i);
  }
}
function showPv(inp, pv){
  var v = parsePower(inp.value);
  if(inp.value.replace(/\s/g,'') === ''){ pv.textContent=''; pv.classList.remove('bad'); return; }
  if(isFinite(v)){ pv.textContent = S.parsed(v); pv.classList.remove('bad'); }
  else{ pv.textContent = S.parseErr; pv.classList.add('bad'); }
}

document.getElementById('fdSeg').addEventListener('click', function(e){
  var b = e.target.closest('button'); if(!b) return;
  vesselCount = Number(b.getAttribute('data-n'));
  var btns = document.querySelectorAll('#fdSeg button');
  for(var i=0;i<btns.length;i++) btns[i].classList.toggle('on', btns[i] === b);
  renderVessels();
});

/* ================= 参加希望リスト ================= */
function addAppRow(){
  var list = document.getElementById('fdAppList');
  var d = document.createElement('div');
  d.className = 'fd-approw';
  d.innerHTML =
    '<div class="fd-grid3">' +
      '<div><label>' + esc(S.appName) + '</label>' +
        '<input type="text" class="fda-name" placeholder="' + esc(S.appNamePh) + '"></div>' +
      '<div><label>' + esc(S.members) + '</label>' +
        '<input type="text" class="fda-mem" inputmode="numeric" placeholder="' + esc(S.membersPh) + '"></div>' +
      '<div><label>' + esc(S.power) + '</label>' +
        '<input type="text" class="fda-pow" inputmode="decimal" placeholder="' + esc(S.powerPh) + '">' +
        '<div class="fd-pv"></div></div>' +
      '<button type="button" class="fd-del" title="' + esc(S.del) + '">' + esc(S.del) + '</button>' +
    '</div>';
  list.appendChild(d);
  d.querySelector('.fd-del').addEventListener('click', function(){ d.remove(); });
  var powI = d.querySelector('.fda-pow'), pv = d.querySelector('.fd-pv');
  powI.addEventListener('input', function(){ showPv(powI, pv); });
}
document.getElementById('fdAddApp').addEventListener('click', addAppRow);

/* ボーダーのプレビュー */
(function(){
  var b = document.getElementById('fdBorder'), pv = document.getElementById('fdBorderPv');
  b.placeholder = S.borderPh;
  b.addEventListener('input', function(){ showPv(b, pv); });
})();

/* ================= 入力収集 ================= */
function collect(){
  var errs = [];
  var border = parsePower(document.getElementById('fdBorder').value);
  if(!isFinite(border) || border <= 0) errs.push(S.errBorder);

  var vessels = [];
  var vEls = document.querySelectorAll('#fdVessels .fd-vessel');
  for(var i=0;i<vEls.length;i++){
    var label = T('入れ物' + VNUM[i], 'Host ' + VNUM[i]);
    var name = vEls[i].querySelector('.fdv-name').value.replace(/^\s+|\s+$/g,'') || label;
    var slots = parseIntPos(vEls[i].querySelector('.fdv-slots').value);
    var power = parsePower(vEls[i].querySelector('.fdv-power').value);
    if(!isFinite(slots)) errs.push(S.errVSlots(label));
    if(!isFinite(power)) errs.push(S.errVPower(label));
    vessels.push({ name:name, slots:isFinite(slots)?slots:0, power:isFinite(power)?power:0 });
  }

  var apps = [];
  var rows = document.querySelectorAll('.fd-approw');
  for(var r=0;r<rows.length;r++){
    var nameRaw = rows[r].querySelector('.fda-name').value.replace(/^\s+|\s+$/g,'');
    var memRaw = rows[r].querySelector('.fda-mem').value.replace(/\s/g,'');
    var powRaw = rows[r].querySelector('.fda-pow').value.replace(/\s/g,'');
    if(nameRaw === '' && memRaw === '' && powRaw === '') continue; // 空行スキップ
    var nm = nameRaw || S.defAlliance(r);
    var mem = parseIntPos(memRaw);
    var pow = parsePower(powRaw);
    if(!isFinite(mem) || mem <= 0){ errs.push(S.errAppMem(nm)); continue; }
    if(!isFinite(pow) || pow < 0){ errs.push(S.errAppPow(nm)); continue; }
    apps.push({ name:nm, members:mem, power:pow });
  }
  return { border:border, vessels:vessels, apps:apps, errs:errs };
}

/* ================= ソルバー（入れ物 V=1..3 汎用） =================
   割当コード: 0..V-1 = 各入れ物 / V = 参加しない
   スコア(辞書順): [全入れ物ボーダー達成(1/0), 参加人数, 最小余裕] */
function cmpScore(a,b){
  for(var i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]-b[i]; }
  return 0;
}
var EXACT_LIMITS = { 1:18, 2:13, 3:10 };

function evalAssign(apps, vessels, border, assign){
  var V = vessels.length, i;
  var m = [], p = [];
  for(i=0;i<V;i++){ m.push(0); p.push(vessels[i].power); }
  var inc = 0;
  for(i=0;i<apps.length;i++){
    var a = assign[i];
    if(a < V){
      m[a] += apps[i].members;
      p[a] += apps[i].power;
      inc += apps[i].members;
    }
  }
  for(i=0;i<V;i++) if(m[i] > vessels[i].slots) return null;
  var feasAll = 1, minS = Infinity;
  for(i=0;i<V;i++){
    if(p[i] < border) feasAll = 0;
    var s = p[i] - border;
    if(s < minS) minS = s;
  }
  return { assign:assign.slice(), m:m, p:p, inc:inc, feas:feasAll, score:[feasAll, inc, minS] };
}

function greedyAssign(apps, vessels, border, excludeIdx){
  var V = vessels.length, n = apps.length;
  var order = [];
  for(var i=0;i<n;i++) if(i !== excludeIdx) order.push(i);
  order.sort(function(a,b){ return apps[b].power - apps[a].power; });
  var assign = new Array(n); for(i=0;i<n;i++) assign[i] = V;
  var m = [], p = [];
  for(i=0;i<V;i++){ m.push(0); p.push(vessels[i].power); }
  for(var k=0;k<order.length;k++){
    var idx = order[k], a = apps[idx];
    var bestV = -1, bestDef = -Infinity;
    for(var v=0;v<V;v++){
      if(m[v] + a.members > vessels[v].slots) continue;
      var deficit = border - p[v]; // 不足が大きい入れ物を優先
      if(deficit > bestDef){ bestDef = deficit; bestV = v; }
    }
    if(bestV >= 0){ assign[idx] = bestV; m[bestV] += a.members; p[bestV] += a.power; }
  }
  return assign;
}
function localImprove(apps, vessels, border, assign, excludeIdx){
  var V = vessels.length, n = apps.length;
  var cur = evalAssign(apps, vessels, border, assign);
  for(var pass=0; pass<4; pass++){
    var improved = false;
    for(var i=0;i<n;i++){
      if(i === excludeIdx) continue;
      var old = assign[i];
      for(var t=0;t<=V;t++){
        if(t === old) continue;
        assign[i] = t;
        var r = evalAssign(apps, vessels, border, assign);
        if(r && cur && cmpScore(r.score, cur.score) > 0){ cur = r; old = t; improved = true; }
        else if(r && !cur){ cur = r; old = t; improved = true; }
        else assign[i] = old;
      }
      assign[i] = old;
    }
    if(!improved) break;
  }
  return cur;
}

function solveWhole(apps, vessels, border){
  var V = vessels.length, n = apps.length;
  var approx = n > EXACT_LIMITS[V];
  var best = null;
  if(!approx){
    var base = V + 1;
    var total = Math.pow(base, n);
    var assign = new Array(n);
    for(var code=0; code<total; code++){
      var c = code;
      for(var i=0;i<n;i++){ assign[i] = c % base; c = (c - assign[i]) / base; }
      var r = evalAssign(apps, vessels, border, assign);
      if(r && (!best || cmpScore(r.score, best.score) > 0)) best = r;
    }
  }else{
    var g = greedyAssign(apps, vessels, border, -1);
    best = localImprove(apps, vessels, border, g, -1);
  }
  return { best:best, approx:approx };
}

/* ---- 1同盟の分割を許した探索 ----
   分割候補 s を除いた残りを割当て、s の総力で各入れ物の不足を埋める。
   配分は総力ベース、必要人数は平均総力(密度)から算出。 */
function trySplit(apps, vessels, border, sIdx, assign){
  var V = vessels.length, i;
  var Sp = apps[sIdx];
  if(Sp.members <= 0 || Sp.power <= 0) return null;
  var base = evalAssign(apps, vessels, border, assign); // s は「不参加」を渡す前提
  if(!base) return null;
  var needs = [], needTotal = 0, freeSlots = [];
  for(i=0;i<V;i++){
    var nd = Math.max(0, border - base.p[i]);
    needs.push(nd); needTotal += nd;
    freeSlots.push(vessels[i].slots - base.m[i]);
  }
  if(needTotal <= 0) return null;              // 分割不要（通常探索で拾える）
  if(needTotal > Sp.power + 1e-6) return null; // 総力が足りない
  var d = Sp.power / Sp.members;               // 1人あたり総力(密度)

  // 1) 不足を埋める最低人数を各入れ物へ
  var mem = [], usedMem = 0;
  for(i=0;i<V;i++){
    var need = needs[i];
    var mm = need > 0 ? Math.ceil(need / d - 1e-9) : 0;
    if(mm > freeSlots[i]) return null;         // 枠が足りない
    mem.push(mm); usedMem += mm;
  }
  if(usedMem > Sp.members) return null;

  // 2) 余った人数を、枠に余裕のある入れ物へ分配（できるだけ全員参加）
  var rest = Sp.members - usedMem;
  var idxByFree = [];
  for(i=0;i<V;i++) idxByFree.push(i);
  idxByFree.sort(function(a,b){ return (freeSlots[b]-mem[b]) - (freeSlots[a]-mem[a]); });
  for(var k=0;k<idxByFree.length && rest>0;k++){
    var vi = idxByFree[k];
    var room = freeSlots[vi] - mem[vi];
    var put = Math.min(room, rest);
    if(put > 0){ mem[vi] += put; rest -= put; }
  }
  var allIn = (rest === 0);

  // 3) 集計
  var pows = [], p = [], m = [], inc = base.inc;
  var minS = Infinity, feasAll = 1;
  for(i=0;i<V;i++){
    var pw = mem[i] * d;
    pows.push(pw);
    p.push(base.p[i] + pw);
    m.push(base.m[i] + mem[i]);
    inc += mem[i];
    if(p[i] < border - 1e-6) feasAll = 0;
    var su = p[i] - border; if(su < minS) minS = su;
  }
  if(!feasAll) return null;
  return {
    splitIdx: sIdx, mem: mem, pows: pows, allIn: allIn,
    restMem: Sp.members - (Sp.members - rest), // = rest
    restPow: rest * d,
    othersAssign: assign.slice(),
    m: m, p: p, inc: inc, feas: 1,
    score: [1, inc, minS]
  };
}

function solveSplit(apps, vessels, border, approx){
  var V = vessels.length, n = apps.length;
  var best = null;
  if(!approx){
    var base = V + 1;
    for(var s=0;s<n;s++){
      var total = Math.pow(base, n - 1);
      var assign = new Array(n);
      for(var code=0; code<total; code++){
        var c = code;
        for(var i=0;i<n;i++){
          if(i === s){ assign[i] = V; continue; } // s は不参加として渡す
          assign[i] = c % base; c = (c - (c % base)) / base;
        }
        var r = trySplit(apps, vessels, border, s, assign);
        if(r && (!best || cmpScore(r.score, best.score) > 0)) best = r;
      }
    }
  }else{
    for(var s2=0;s2<n;s2++){
      var g = greedyAssign(apps, vessels, border, s2);
      g[s2] = V;
      var cur = localImprove(apps, vessels, border, g, s2);
      if(!cur) continue;
      var r2 = trySplit(apps, vessels, border, s2, cur.assign);
      if(r2 && (!best || cmpScore(r2.score, best.score) > 0)) best = r2;
    }
  }
  return best;
}

/* ================= 結果表示 ================= */
function renderVesselResult(i, v, list, splitPart, totalP, totalM, border, share){
  var feas = totalP >= border - 1e-6;
  var diff = totalP - border;
  var items = '';
  for(var k=0;k<list.length;k++){
    var a = list[k];
    items += '<li><span class="w">' + esc(a.name) + '</span><span class="st">' + a.members + T('人','') + ' / ' + fmtPower(a.power) + '</span></li>';
  }
  if(splitPart && splitPart.mem > 0){
    items += '<li><span class="w">' + esc(splitPart.name) + ' <span style="color:var(--fwarn)">' + T('(分割)','(split)') + '</span></span><span class="st">' + splitPart.mem + T('人','') + ' / ' + T('約','~') + fmtPower(splitPart.pow) + '</span></li>';
  }
  if(items === '') items = '<li><span class="st">' + esc(S.noJoin) + '</span></li>';

  share.push(S.hostLabel(i, v.name) + S.hostState(fmtPower(v.power), v.slots));
  for(k=0;k<list.length;k++) share.push(S.memberLine(list[k].name, list[k].members, fmtPower(list[k].power)));
  if(splitPart && splitPart.mem > 0) share.push(S.memberLineSplit(splitPart.name, splitPart.mem, fmtPower(splitPart.pow)));
  share.push(S.afterTotal(fmtPower(totalP), v.slots - totalM));
  share.push(feas ? S.passed(fmtPower(diff)) : S.failed(fmtPower(-diff)));
  share.push('');

  return '<div class="fd-rv">' +
    '<div class="fd-rv-head">' +
      '<span class="fd-rv-name">❄ ' + T('入れ物','Host ') + VNUM[i] + '「' + esc(v.name) + '」</span>' +
      '<span class="fd-badge ' + (feas ? 'ok' : 'ng') + '">' + (feas ? S.badgeOk(fmtPower(diff)) : S.badgeNg(fmtPower(-diff))) + '</span>' +
    '</div>' +
    '<div style="color:var(--fmut);font-size:12.5px;">' + esc(S.curState(fmtPower(v.power), v.slots)) + '</div>' +
    '<ul class="fd-rl">' + items + '</ul>' +
    '<div class="fd-rt"><span>' + esc(S.totalLabel) + '</span><span class="num">' + fmtPower(totalP) + '</span><span class="slot">' + esc(S.slotLeft(v.slots - totalM)) + '</span></div>' +
  '</div>';
}

function renderOut(outs, share){
  if(!outs.length) return '';
  var items = '';
  share.push(S.outShareHead);
  for(var k=0;k<outs.length;k++){
    items += '<li><span class="w">' + esc(outs[k].name) + '</span><span class="st">' + outs[k].members + T('人','') + ' / ' + fmtPower(outs[k].power) + '</span></li>';
    share.push(S.memberLine(outs[k].name, outs[k].members, fmtPower(outs[k].power)));
  }
  share.push('');
  return '<div class="fd-rv" style="border-style:dashed;opacity:.85;">' +
    '<div class="fd-rv-head"><span class="fd-rv-name" style="color:var(--fmut);">' + esc(S.outHead) + '</span></div>' +
    '<ul class="fd-rl">' + items + '</ul></div>';
}

document.getElementById('fdCalc').addEventListener('click', function(){
  var data = collect();
  var area = document.getElementById('fdResult');
  var body = document.getElementById('fdResultBody');
  var shareTa = document.getElementById('fdShareText');

  if(data.errs.length){
    area.style.display = 'block';
    var h = '';
    for(var e=0;e<data.errs.length;e++) h += '・' + esc(data.errs[e]) + '<br>';
    body.innerHTML = '<div class="fd-warn">' + h + '</div>';
    shareTa.value = '';
    area.scrollIntoView({ behavior:'smooth', block:'start' });
    return;
  }
  var vessels = data.vessels, apps = data.apps, border = data.border;
  var V = vessels.length;

  var allHostsPass = true;
  for(var vv=0;vv<V;vv++) if(vessels[vv].power < border) allHostsPass = false;
  if(apps.length === 0 && !allHostsPass){
    area.style.display = 'block';
    body.innerHTML = '<div class="fd-warn">' + esc(S.errNoApps) + '</div>';
    shareTa.value = '';
    area.scrollIntoView({ behavior:'smooth', block:'start' });
    return;
  }

  var whole = solveWhole(apps, vessels, border);
  var best = whole.best;
  var split = null;
  if(!best || !best.feas){
    split = solveSplit(apps, vessels, border, whole.approx);
  }

  var html = '', share = [];
  share.push(S.shareTitle);
  share.push(S.shareBorder + ': ' + fmtPower(border));
  share.push('');

  if(!best && !split){
    html = '<div class="fd-warn">' + esc(S.noCombo) + '</div>';
  }else{
    var lists = [], outs = [], i, k;
    for(i=0;i<V;i++) lists.push([]);
    var totals, members;

    if(split){
      var oa = split.othersAssign;
      for(i=0;i<apps.length;i++){
        if(i === split.splitIdx) continue;
        if(oa[i] < V) lists[oa[i]].push(apps[i]);
        else outs.push(apps[i]);
      }
      totals = split.p; members = split.m;
      for(i=0;i<V;i++){
        var sp = (split.mem[i] > 0) ? { name:apps[split.splitIdx].name, mem:split.mem[i], pow:split.pows[i] } : null;
        html += renderVesselResult(i, vessels[i], lists[i], sp, totals[i], members[i], border, share);
      }
      // 分割指示ブロック
      var Spp = apps[split.splitIdx];
      var lines = '';
      var shareSplit = [S.splitHead, S.splitShareIntro(Spp.name, Spp.members, fmtPower(Spp.power))];
      lines += S.splitIntro(esc(Spp.name), Spp.members, fmtPower(Spp.power)) + '<br>';
      for(i=0;i<V;i++){
        if(split.mem[i] <= 0) continue;
        lines += S.splitTo(i, esc(vessels[i].name), fmtPower(split.pows[i]), split.mem[i]) + '<br>';
        shareSplit.push(S.splitShareTo(i, vessels[i].name, fmtPower(split.pows[i]), split.mem[i]));
      }
      if(!split.allIn){
        var restMem = Spp.members - split.mem.reduce(function(a,b){return a+b;},0);
        lines += S.splitRest(fmtPower(split.restPow), restMem);
        shareSplit.push(S.splitShareRest(fmtPower(split.restPow), restMem));
      }
      html += '<div class="fd-split"><h4>' + esc(S.splitHead) + '</h4><p>' + lines + '</p></div>';
      share = share.concat(shareSplit); share.push('');
      html += renderOut(outs, share);
    }else{
      for(i=0;i<apps.length;i++){
        var a = best.assign[i];
        if(a < V) lists[a].push(apps[i]);
        else outs.push(apps[i]);
      }
      totals = best.p; members = best.m;
      for(i=0;i<V;i++){
        html += renderVesselResult(i, vessels[i], lists[i], null, totals[i], members[i], border, share);
      }
      html += renderOut(outs, share);
      if(!best.feas){
        if(V === 1){
          var lack = border - totals[0];
          html += '<div class="fd-warn">' + S.singleLack(fmtPower(lack)) + '</div>';
          share.push(S.lackShare(0, fmtPower(lack)));
        }else{
          var msg = esc(S.lackAll);
          for(i=0;i<V;i++){
            if(totals[i] < border){
              var dd = fmtPower(border - totals[i]);
              msg += '<br>' + esc(S.lackLine(i, dd));
              share.push(S.lackShare(i, dd));
            }
          }
          msg += '<br>' + esc(S.lackAdvice);
          html += '<div class="fd-warn">' + msg + '</div>';
        }
      }
    }
    if(whole.approx) html += '<div class="fd-info">' + esc(S.approxNote) + '</div>';
  }

  area.style.display = 'block';
  body.innerHTML = html;
  shareTa.value = share.join('\n').replace(/\n{3,}/g,'\n\n').replace(/\s+$/,'');
  area.scrollIntoView({ behavior:'smooth', block:'start' });

});

/* ================= コピー / 共有 ================= */
document.getElementById('fdCopy').addEventListener('click', function(){
  var ta = document.getElementById('fdShareText');
  var btn = document.getElementById('fdCopy');
  function done(){
    btn.textContent = S.copied;
    btn.classList.add('copied');
    setTimeout(function(){
      btn.textContent = S.copyLabel;
      btn.classList.remove('copied');
    }, 1600);
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(ta.value).then(done, function(){ legacy(); done(); });
  }else{ legacy(); done(); }
  function legacy(){
    ta.removeAttribute('readonly'); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    ta.setAttribute('readonly','');
    try{ window.getSelection().removeAllRanges(); }catch(e){}
  }
});
document.getElementById('fdShare').addEventListener('click', function(){
  var text = document.getElementById('fdShareText').value;
  if(navigator.share){
    navigator.share({ title: S.shareTitle, text: text }).catch(function(){});
  }else{
    document.getElementById('fdCopy').click();
  }
});

/* ================= ガイドモーダル ================= */
(function(){
  var modal = document.getElementById('fdGuide');
  var openBtn = document.getElementById('fdGuideBtn');
  var lastFocus = null;
  function open(){
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    var c = modal.querySelector('.fd-modal-close');
    if(c) c.focus();
  }
  function close(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  openBtn.addEventListener('click', open);
  modal.addEventListener('click', function(e){
    if(e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal.classList.contains('open')) close();
  });
})();

/* ================= 初期化 ================= */
renderVessels();
addAppRow(); addAppRow(); addAppRow();

/* テスト用エクスポート（ページ動作には不使用） */
window.FD_TEST = { parsePower:parsePower, fmtPower:fmtPower, solveWhole:solveWhole, solveSplit:solveSplit, evalAssign:evalAssign };

})();
