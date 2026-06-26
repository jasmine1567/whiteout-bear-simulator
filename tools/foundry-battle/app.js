/* =====================================================================
   兵器工場争奪戦 マップシミュレータ  app.js
   - ビルド不要 / 依存ライブラリなし / 完全クライアントサイド
   - データモデルは仕様書のJSONスキーマに準拠(下記 TYPES / FACILITIES)
   - 公式値: 武器試験場 初回6000 / 1200per分(=20/sec)、武器修理工場 初回3000 / 600per分(=10/sec)
            兵器倉庫 部隊ダメージ+15% 被ダメ-15%(加算重複)、傭兵野営地 攻撃+10〜50%(階層)
            スチームボイラー 占領完了時間-50%、中継所 転移CD-50%、王室兵器工場 負傷10%デバフ
            武器工房 弾丸4800 / 採集20分(1200秒)
   ===================================================================== */
(function(){
"use strict";
var T = window.t || function(a){return a;};
var EN = (window.WOS_LANG||'ja')==='en';

/* ---------- 多言語UI文字列 ---------- */
var S = {
  h1a: T('兵器工場争奪戦','Foundry Battle'),
  h1b: T('マップシミュレータ','Map Simulator'),
  tag: T('マップシミュレータ','Map Simulator'),
  lead: T('「兵器工場争奪戦」のフィールドを再現。各施設をクリックすると <b>無所属 → 自軍(青) → 敵軍(赤)</b> と占領が切り替わり、占領バフ・獲得ポイント・弾丸を<b>その場で試算</b>します。再生ボタンで時間を進めると、占領継続ポイントが公式値どおりに積み上がります。',
            'A recreation of the Foundry Battle field. Click a facility to cycle <b>Neutral → Your alliance (Blue) → Enemy (Red)</b>; occupation buffs, points and bullets are <b>recalculated live</b>. Press play to advance time and watch points accumulate at the official rates.'),
  blue: T('自軍','Your alliance'), red: T('敵軍','Enemy'), none: T('無所属','Neutral'),
  pts: T('点','pts'), perMin: T('/分','/min'), bullets: T('弾丸','Bullets'),
  // toolbar
  grpSim: T('時間','Time'), play: T('再生','Play'), pause: T('一時停止','Pause'),
  resetClock: T('時間リセット','Reset time'), speed: T('速度','Speed'),
  grpBulk: T('一括占領','Bulk claim'), coreB: T('中枢を自軍','Core → Blue'), coreR: T('中枢を敵軍','Core → Red'),
  allB: T('全て自軍','All → Blue'), allR: T('全て敵軍','All → Red'), clearAll: T('全解除','Clear all'),
  grpEdit: T('編集','Edit'), undo: T('元に戻す','Undo'), redo: T('やり直し','Redo'),
  grpData: T('データ','Data'), exp: T('書き出し','Export'), imp: T('読み込み','Import'),
  // panel
  pScore: T('勢力スコア','Alliance score'), facHeld: T('施設','facilities'),
  tied: T('互角','Tied'), leadBy: T('リード','ahead by'),
  pBuff: T('戦力バフ集計','Buff totals'),
  bTroopDmg: T('部隊ダメージ','Troop damage'), bDmgTaken: T('被ダメージ','Damage taken'),
  bSiege: T('対施設攻撃','Siege damage'), bCapTime: T('占領完了時間','Capture time'),
  bTpCd: T('転移CD','Teleport CD'), bInjured: T('負傷(デバフ)','Injured (debuff)'),
  half: T('-50%','-50%'), none2: T('—','—'),
  pList: T('施設一覧','Facilities'), pFilter: T('表示フィルター','Filter'),
  pLegend: T('凡例','Legend'), pSave: T('シナリオ保存','Scenarios'),
  saveName: T('シナリオ名','Scenario name'), save: T('保存','Save'),
  load: T('読込','Load'), del: T('削除','Delete'), noScen: T('保存したシナリオはありません','No saved scenarios'),
  catPrize:T('中枢',' Core'), catPoint:T('得点','Points'), catBuff:T('バフ','Buff'), catUtil:T('補助','Support'), catRes:T('資源','Resource'),
  shapeNote: T('形=種別 / 色=占領勢力 / 線種=青実線・赤破線・無所属点線','Shape = type / color = owner / line = blue solid, red dashed, neutral dotted'),
  // tooltip
  tInitial: T('初回ボーナス','First capture'), tCont: T('継続ポイント','Per minute'),
  tOwner: T('占領','Owner'), tHarvest: T('弾丸採集','Bullet harvest'), tRemain: T('残り','remaining'),
  tDone: T('採集完了','Collected'), tAppear: T('登場','Appears at'), tMin: T('分','min'),
  tClick: T('クリックで占領を切替','Click to change owner'), tTier: T('段階','Tier'),
  // help
  hHelp: T('使い方とロジック','How it works'),
  help1t: T('占領の切り替え','Changing occupation'),
  help1: T('施設をクリック(またはキーボードでEnter)するたびに <b>無所属→自軍→敵軍→無所属</b> の順で切り替わります。右の一覧やマップ、どちらからでも操作できます。','Each click (or Enter on keyboard) cycles <b>Neutral→Blue→Red→Neutral</b>. Works from both the map and the list on the right.'),
  help2t: T('ポイントの貯まり方','How points accrue'),
  help2: T('占領した瞬間に<b>初回ボーナス</b>、その後は<b>毎分の継続ポイント</b>が加算されます。再生ボタンで時間を進めると公式レート(試験場6,000+1,200/分、修理工場3,000+600/分)で積み上がります。','Capturing grants a <b>first-capture bonus</b>, then <b>per-minute points</b> accrue. Press play to advance at the official rates (Test Field 6,000 + 1,200/min, Repair Factory 3,000 + 600/min).'),
  help3t: T('バフの重複','Stacking buffs'),
  help3: T('兵器倉庫は<b>占領数ぶん加算</b>(1棟ごとに部隊ダメージ+15%・被ダメ-15%)。傭兵野営地は占領時間に応じて<b>対施設攻撃+10〜50%</b>と段階的に上がります。','Armories <b>stack additively</b> (+15% troop damage / −15% damage taken each). The Mercenary Camp ramps <b>siege damage +10〜50%</b> with hold time.'),
  help4t: T('弾丸(武器工房)','Bullets (Workshop)'),
  help4: T('武器工房を占領すると<b>20分で弾丸4,800</b>を獲得。採集中に奪われると進行はリセットされます(出現は開始20分後)。','Holding the Workshop yields <b>4,800 bullets over 20 min</b>. Losing it mid-harvest resets progress (it appears 20 min in).'),
  hData: T('データモデル(JSONスキーマ準拠)','Data model (JSON schema)'),
  dataNote: T('各施設は id / name / type / x,y / size / basePointsInitial / basePointsPerSec / buffEffect / buffStackable / resourceYield / harvestTime / isOccupied / owner / cooldown / dependencies を持つオブジェクトとして管理しています。数値はゲーム更新で変わる場合があり、app.js 冒頭の TYPES を編集すれば一括で調整できます。本シミュレータの試算は理解補助用で、実際の挙動とは差異が出る場合があります。',
              'Each facility is an object with id / name / type / x,y / size / basePointsInitial / basePointsPerSec / buffEffect / buffStackable / resourceYield / harvestTime / isOccupied / owner / cooldown / dependencies. Values may change with game updates — edit TYPES at the top of app.js to adjust. Estimates are for learning and may differ from in-game behavior.'),
  toCleared: T('全施設を解除しました','Cleared all facilities'),
  toSaved: T('シナリオを保存しました','Scenario saved'),
  toLoaded: T('シナリオを読み込みました','Scenario loaded'),
  toExp: T('JSONを書き出しました','Exported JSON'),
  toImpErr: T('読み込みに失敗しました(形式が不正です)','Import failed (invalid format)'),
  wsAppear: T('武器工房が出現しました','Weapon Workshop appeared'),
  phase1: T('フェーズ1','Phase 1'), phase2: T('フェーズ2','Phase 2')
};

/* ---------- 施設タイプ定義(JSONスキーマの type 単位の基準値) ---------- */
var TYPES = {
  RoyalFoundry:  {ja:'王室兵器工場', en:'Royal Foundry',  cat:'prize', shape:'star',    initial:0,    perSec:0,  buff:{injured:0.10},                        stackable:false, yield:0,    harvest:0,    appear:15, ab:T('王','RF')},
  TestField:     {ja:'武器試験場',   en:'Test Field',     cat:'point', shape:'circle',  initial:6000, perSec:20, buff:{},                                    stackable:false, yield:0,    harvest:0,    appear:0,  ab:T('試','TF')},
  RepairFactory: {ja:'武器修理工場', en:'Repair Factory', cat:'point', shape:'circle',  initial:3000, perSec:10, buff:{},                                    stackable:false, yield:0,    harvest:0,    appear:0,  ab:T('修','RP')},
  Armory:        {ja:'兵器倉庫',     en:'Armory',         cat:'buff',  shape:'hex',     initial:0,    perSec:0,  buff:{troopDamage:0.15, damageTaken:-0.15}, stackable:true,  yield:0,    harvest:0,    appear:15, ab:T('倉','AR')},
  MercenaryCamp: {ja:'傭兵野営地',   en:'Mercenary Camp', cat:'buff',  shape:'hex',     initial:0,    perSec:0,  buff:{siege:'tier'},                        stackable:false, yield:0,    harvest:0,    appear:15, ab:T('傭','MC')},
  BoilerRoom:    {ja:'スチームボイラー', en:'Steam Boiler', cat:'util', shape:'diamond', initial:0,    perSec:0,  buff:{captureTimeMul:0.5},                  stackable:false, yield:0,    harvest:0,    appear:0,  ab:T('蒸','SB')},
  TransitStation:{ja:'中継所',       en:'Transit Station',cat:'util',  shape:'diamond', initial:0,    perSec:0,  buff:{teleportCdMul:0.5},                   stackable:false, yield:0,    harvest:0,    appear:0,  ab:T('中','TS')},
  WeaponWorkshop:{ja:'武器工房',     en:'Weapon Workshop',cat:'res',   shape:'square',  initial:0,    perSec:0,  buff:{},                                    stackable:true,  yield:4800, harvest:1200, appear:20, ab:T('工','WS')}
};
function tname(type, idx){ var d=TYPES[type]; var n=EN?d.en:d.ja; return idx?(n+idx):n; }

/* ---------- 施設インスタンス(座標はダミー地形・フリーフォーム配置) ---------- */
var FACILITIES = [
  {id:'royal',   type:'RoyalFoundry',  x:500, y:360, size:62, idx:''},
  {id:'test1',   type:'TestField',     x:300, y:360, size:46, idx:'1'},
  {id:'test2',   type:'TestField',     x:700, y:360, size:46, idx:'2'},
  {id:'armory',  type:'Armory',        x:500, y:196, size:44, idx:''},
  {id:'merc',    type:'MercenaryCamp', x:500, y:524, size:44, idx:''},
  {id:'boiler',  type:'BoilerRoom',    x:356, y:248, size:40, idx:''},
  {id:'transit', type:'TransitStation',x:644, y:248, size:40, idx:''},
  {id:'repair1', type:'RepairFactory', x:168, y:150, size:42, idx:'1'},
  {id:'repair2', type:'RepairFactory', x:832, y:150, size:42, idx:'2'},
  {id:'repair3', type:'RepairFactory', x:168, y:572, size:42, idx:'3'},
  {id:'repair4', type:'RepairFactory', x:832, y:572, size:42, idx:'4'},
  {id:'workshop',type:'WeaponWorkshop',x:500, y:626, size:42, idx:''}
];
var FAC = {}; FACILITIES.forEach(function(f){ FAC[f.id]=f; });
var CORE = ['royal','test1','test2'];

/* ---------- 状態 ---------- */
var state = {
  owners:{}, occSec:{}, harvestProg:{}, harvestDone:{},
  score:{Blue:0,Red:0}, bullets:{Blue:0,Red:0},
  elapsed:0, playing:false, speed:5,
  workshopVisible:false,
  hideCat:{}, view:{scale:1,tx:0,ty:0}
};
FACILITIES.forEach(function(f){ state.owners[f.id]=null; state.occSec[f.id]=0; state.harvestProg[f.id]=0; state.harvestDone[f.id]=false; });

/* ---------- Undo/Redo ---------- */
var undoStack=[], redoStack=[];
function snap(){ return JSON.parse(JSON.stringify({owners:state.owners,occSec:state.occSec,harvestProg:state.harvestProg,harvestDone:state.harvestDone,score:state.score,bullets:state.bullets,workshopVisible:state.workshopVisible})); }
function pushHistory(){ undoStack.push(snap()); if(undoStack.length>60) undoStack.shift(); redoStack=[]; updHistBtns(); }
function restore(s){ state.owners=s.owners; state.occSec=s.occSec; state.harvestProg=s.harvestProg; state.harvestDone=s.harvestDone; state.score=s.score; state.bullets=s.bullets; state.workshopVisible=s.workshopVisible; renderAll(); }
function undo(){ if(!undoStack.length) return; redoStack.push(snap()); restore(undoStack.pop()); updHistBtns(); }
function redo(){ if(!redoStack.length) return; undoStack.push(snap()); restore(redoStack.pop()); updHistBtns(); }
function updHistBtns(){ var u=document.getElementById('bUndo'),r=document.getElementById('bRedo'); if(u)u.disabled=!undoStack.length; if(r)r.disabled=!redoStack.length; }

/* ---------- 占領切替 ---------- */
var CYCLE=[null,'Blue','Red'];
function setOwner(id, owner){ // 個別(履歴に積む)
  if(state.owners[id]===owner) return;
  pushHistory(); applyOwner(id,owner); renderAll();
}
function cycle(id){ var cur=state.owners[id]; var ni=(CYCLE.indexOf(cur)+1)%3; setOwner(id, CYCLE[ni]); }
function applyOwner(id, owner){ // 内部処理(履歴に積まない)
  var f=FAC[id], ty=TYPES[f.type];
  state.owners[id]=owner; state.occSec[id]=0; state.harvestProg[id]=0; state.harvestDone[id]=false;
  if(owner && ty.initial>0) state.score[owner]+=ty.initial;
}
function bulk(ids, owner){ pushHistory(); ids.forEach(function(id){ if(FAC[id].type==='WeaponWorkshop' && !state.workshopVisible) return; applyOwner(id,owner); }); renderAll(); }
function visibleIds(){ return FACILITIES.filter(function(f){ return f.type!=='WeaponWorkshop'||state.workshopVisible; }).map(function(f){return f.id;}); }
function clearAll(){ pushHistory(); FACILITIES.forEach(function(f){ applyOwner(f.id,null); }); state.score={Blue:0,Red:0}; state.bullets={Blue:0,Red:0}; renderAll(); toast(S.toCleared); }

/* ---------- バフ集計 ---------- */
function mercTier(id){ return Math.max(1, Math.min(5, 1+Math.floor(state.occSec[id]/60))); }
function buffsFor(side){
  var b={troopDamage:0,damageTaken:0,siege:0,captureTime:false,teleportCd:false,injured:false};
  FACILITIES.forEach(function(f){
    if(state.owners[f.id]!==side) return;
    var ty=TYPES[f.type];
    if(f.type==='Armory'){ b.troopDamage+=0.15; b.damageTaken-=0.15; }
    if(f.type==='MercenaryCamp'){ b.siege=Math.max(b.siege, mercTier(f.id)*0.10); }
    if(f.type==='BoilerRoom') b.captureTime=true;
    if(f.type==='TransitStation') b.teleportCd=true;
    if(f.type==='RoyalFoundry') b.injured=true;
  });
  return b;
}

/* ---------- 表示用ヘルパー ---------- */
function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function pct(n){ return (n>=0?'+':'')+Math.round(n*100)+'%'; }
function mmss(sec){ var m=Math.floor(sec/60), s=Math.floor(sec%60); return m+':'+(s<10?'0':'')+s; }
function ownerColor(o){ return o==='Blue'?'#2256c8':o==='Red'?'#cf2e22':'#9aa3b5'; }
function ownerFill(o){ return o==='Blue'?'#cfe0fb':o==='Red'?'#f7d2cc':'#eef0f5'; }
function ownerDash(o){ return o==='Blue'?'':o==='Red'?'7 5':'2 5'; }
function ownerName(o){ return o==='Blue'?S.blue:o==='Red'?S.red:S.none; }

/* =====================================================================
   マップ描画
   ===================================================================== */
var svg=document.getElementById('fbMap'), tip=document.getElementById('tip'), mapwrap=document.getElementById('mapwrap');
var SVGNS='http://www.w3.org/2000/svg';
function el(tag,attrs){ var e=document.createElementNS(SVGNS,tag); if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]); return e; }

function buildMapStatic(){
  // 背景レイヤー(凍結戦場・ダミー地形) + 中央へのサプライライン
  var defs=el('defs');
  defs.innerHTML =
    '<radialGradient id="fbBg" cx="50%" cy="46%" r="62%">'+
      '<stop offset="0" stop-color="#fdfeff"/><stop offset="0.55" stop-color="#eef3fb"/><stop offset="1" stop-color="#dde6f2"/>'+
    '</radialGradient>'+
    '<pattern id="fbGrid" width="50" height="50" patternUnits="userSpaceOnUse">'+
      '<path d="M50 0H0V50" fill="none" stroke="#dfe7f1" stroke-width="1"/>'+
    '</pattern>'+
    '<filter id="fbSh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1a2540" flood-opacity="0.18"/></filter>';
  svg.appendChild(defs);

  var vp=el('g',{id:'vp'}); svg.appendChild(vp);
  vp.appendChild(el('rect',{x:0,y:0,width:1000,height:720,fill:'url(#fbBg)'}));
  vp.appendChild(el('rect',{x:0,y:0,width:1000,height:720,fill:'url(#fbGrid)',opacity:'0.5'}));
  // 雪原のダミー輪郭
  var ice=el('path',{d:'M120 120 Q300 60 520 110 T900 150 Q940 360 870 560 Q620 650 360 600 Q140 560 110 360 Z',
    fill:'none',stroke:'#cdd9e8',"stroke-width":2,"stroke-dasharray":'1 9',"stroke-linecap":'round'});
  vp.appendChild(ice);
  // 中央への補給線
  var lines=el('g',{id:'fbLines',stroke:'#c4d1e2',"stroke-width":2,fill:'none',opacity:'0.7'});
  FACILITIES.forEach(function(f){ if(f.id==='royal') return; lines.appendChild(el('line',{x1:500,y1:360,x2:f.x,y2:f.y,"stroke-dasharray":'4 6'})); });
  vp.appendChild(lines);
  // 施設グループ
  var g=el('g',{id:'fbFacs'}); vp.appendChild(g);
  return vp;
}

function shapePath(shape,r){
  // 中心(0,0)・半径r の図形を path d で返す(circle以外)
  if(shape==='hex'){ var p=[]; for(var i=0;i<6;i++){ var a=Math.PI/180*(60*i-30); p.push((r*Math.cos(a)).toFixed(1)+','+(r*Math.sin(a)).toFixed(1)); } return 'M'+p.join('L')+'Z'; }
  if(shape==='diamond') return 'M0 '+(-r)+'L'+r+' 0L0 '+r+'L'+(-r)+' 0Z';
  if(shape==='square'){ var s=r*0.86; return 'M'+(-s)+' '+(-s)+'h'+(2*s)+'v'+(2*s)+'h'+(-2*s)+'Z'; }
  if(shape==='star'){ var pts=[],o=r,inr=r*0.46; for(var k=0;k<10;k++){ var rad=(k%2===0)?o:inr; var ang=Math.PI/180*(36*k-90); pts.push((rad*Math.cos(ang)).toFixed(1)+','+(rad*Math.sin(ang)).toFixed(1)); } return 'M'+pts.join('L')+'Z'; }
  return '';
}

function buildFacilities(){
  var host=document.getElementById('fbFacs'); host.innerHTML='';
  FACILITIES.forEach(function(f){
    var ty=TYPES[f.type];
    var g=el('g',{'class':'fac','data-id':f.id,role:'button',tabindex:'0'});
    var r=f.size/2;
    // ヒット/フォーカス枠
    var hit;
    if(ty.shape==='circle'){ hit=el('circle',{'class':'hit',cx:0,cy:0,r:r+6,fill:'transparent',stroke:'transparent','stroke-width':3}); }
    else { hit=el('path',{'class':'hit',d:shapePath(ty.shape,r+6),fill:'transparent',stroke:'transparent','stroke-width':3}); }
    g.appendChild(hit);
    // 本体
    var body;
    if(ty.shape==='circle'){ body=el('circle',{'class':'ring',cx:0,cy:0,r:r,filter:'url(#fbSh)'}); }
    else { body=el('path',{'class':'ring',d:shapePath(ty.shape,r),filter:'url(#fbSh)'}); }
    g.appendChild(body);
    // ラベル
    var lbl=el('text',{'class':'lbl',x:0,y:0,'dominant-baseline':'central','font-size':Math.round(r*0.62)});
    lbl.textContent=ty.ab+(f.idx||'');
    g.appendChild(lbl);
    // 採集プログレス(武器工房)
    if(f.type==='WeaponWorkshop'){
      var prog=el('circle',{'class':'wsprog',cx:0,cy:0,r:r+9,fill:'none',stroke:'#f59f3a','stroke-width':4,
        'stroke-linecap':'round','stroke-dasharray':(2*Math.PI*(r+9)).toFixed(1),'stroke-dashoffset':(2*Math.PI*(r+9)).toFixed(1),
        transform:'rotate(-90)',opacity:'0'});
      g.appendChild(prog);
    }
    g.setAttribute('transform','translate('+f.x+' '+f.y+')');
    host.appendChild(g);

    // イベント
    g.addEventListener('click', function(ev){ ev.stopPropagation(); cycle(f.id); track('fb_cycle',{fac:f.id}); positionTip(f.id); });
    g.addEventListener('keydown', function(ev){ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); cycle(f.id); } });
    g.addEventListener('mouseenter', function(){ showTip(f.id); });
    g.addEventListener('mouseleave', hideTip);
    g.addEventListener('focus', function(){ showTip(f.id); });
    g.addEventListener('blur', hideTip);
  });
}

function paintFacilities(){
  FACILITIES.forEach(function(f){
    var g=svg.querySelector('.fac[data-id="'+f.id+'"]'); if(!g) return;
    var ty=TYPES[f.type], o=state.owners[f.id];
    var show=(f.type!=='WeaponWorkshop'||state.workshopVisible) && !state.hideCat[ty.cat];
    g.style.display = (f.type==='WeaponWorkshop'&&!state.workshopVisible)?'none':'';
    g.classList.toggle('dim', !!state.hideCat[ty.cat]);
    g.setAttribute('aria-label', tname(f.type,f.idx)+'｜'+ownerName(o));
    var body=g.querySelector('.ring');
    body.setAttribute('fill', ownerFill(o));
    body.setAttribute('stroke', ownerColor(o));
    body.setAttribute('stroke-width', o?3.4:2.4);
    body.setAttribute('stroke-dasharray', ownerDash(o));
    // 武器工房 採集リング
    if(f.type==='WeaponWorkshop'){
      var prog=g.querySelector('.wsprog'); var r=f.size/2+9; var C=2*Math.PI*r;
      var p = ty.harvest>0 ? Math.min(1, state.harvestProg[f.id]/ty.harvest) : 0;
      if(o && !state.harvestDone[f.id]){ prog.setAttribute('opacity','1'); prog.setAttribute('stroke', ownerColor(o)); prog.setAttribute('stroke-dashoffset', (C*(1-p)).toFixed(1)); }
      else if(o && state.harvestDone[f.id]){ prog.setAttribute('opacity','1'); prog.setAttribute('stroke','#2faa54'); prog.setAttribute('stroke-dashoffset','0'); }
      else prog.setAttribute('opacity','0');
    }
  });
}

/* ---------- ツールチップ ---------- */
var tipFor=null;
function tipHTML(id){
  var f=FAC[id], ty=TYPES[f.type], o=state.owners[id];
  var h='<h4>'+esc(tname(f.type,f.idx))+'<span class="ty">'+esc(catLabel(ty.cat))+'</span></h4>';
  if(ty.initial>0||ty.perSec>0){
    h+='<div class="row"><span>'+S.tInitial+'</span><b>'+fmt(ty.initial)+' '+S.pts+'</b></div>';
    h+='<div class="row"><span>'+S.tCont+'</span><b>'+fmt(ty.perSec*60)+' '+S.pts+S.perMin+'</b></div>';
  }
  var bd=buffText(f,o);
  if(bd) h+='<div class="buff">'+bd+'</div>';
  if(f.type==='WeaponWorkshop'){
    if(o){
      if(state.harvestDone[id]) h+='<div class="row"><span>'+S.tHarvest+'</span><b>'+S.tDone+' '+fmt(ty.yield)+'</b></div>';
      else { var rem=Math.max(0,ty.harvest-state.harvestProg[id]); h+='<div class="row"><span>'+S.tHarvest+'</span><b>'+fmt(ty.yield)+' / '+mmss(rem)+' '+S.tRemain+'</b></div>'; }
    } else h+='<div class="row"><span>'+S.tHarvest+'</span><b>'+fmt(ty.yield)+' / 20'+S.tMin+'</b></div>';
  }
  h+='<div class="ownr" style="color:'+(o?ownerColor(o):'#9aa3c0')+'">● '+ownerName(o)+'</div>';
  if(ty.appear>0) h+='<div class="row" style="margin-top:4px"><span>'+S.tAppear+'</span><b>'+ty.appear+S.tMin+'</b></div>';
  h+='<div class="hint">'+S.tClick+'</div>';
  return h;
}
function buffText(f,o){
  var ty=TYPES[f.type];
  if(f.type==='Armory') return T('部隊ダメージ+15% / 被ダメージ-15%(加算重複)','Troop dmg +15% / dmg taken −15% (stacks)');
  if(f.type==='MercenaryCamp'){ var tier=o?mercTier(f.id):1; return T('対施設攻撃 +','Siege dmg +')+(tier*10)+'%（'+S.tTier+' '+tier+'/5）'; }
  if(f.type==='BoilerRoom') return T('全施設の占領完了時間 -50%','Capture time −50% on all');
  if(f.type==='TransitStation') return T('転移クールダウン -50%（12→6分）','Teleport CD −50% (12→6 min)');
  if(f.type==='RoyalFoundry') return T('占領中 兵士10%が負傷(デバフ)','While held, 10% of troops injured (debuff)');
  return '';
}
function catLabel(c){ return c==='prize'?S.catPrize:c==='point'?S.catPoint:c==='buff'?S.catBuff:c==='util'?S.catUtil:S.catRes; }
function showTip(id){ tipFor=id; tip.innerHTML=tipHTML(id); tip.setAttribute('aria-hidden','false'); positionTip(id); tip.classList.add('show'); }
function hideTip(){ tipFor=null; tip.classList.remove('show'); tip.setAttribute('aria-hidden','true'); }
function positionTip(id){
  if(tipFor!==id) return;
  var g=svg.querySelector('.fac[data-id="'+id+'"]'); if(!g) return;
  var nr=g.getBoundingClientRect(), wr=mapwrap.getBoundingClientRect();
  var tw=tip.offsetWidth, th=tip.offsetHeight;
  var left=nr.left-wr.left+nr.width/2-tw/2;
  var top=nr.top-wr.top-th-10;
  if(top<6) top=nr.bottom-wr.top+10;
  left=Math.max(6, Math.min(left, wr.width-tw-6));
  tip.style.left=left+'px'; tip.style.top=top+'px';
}

/* =====================================================================
   サイドパネル
   ===================================================================== */
function renderSide(){
  var side=document.getElementById('side');
  side.innerHTML =
    card(S.pScore, scoreHTML(), 'fbScore') +
    card(S.pBuff, buffHTML(), 'fbBuff') +
    card(S.pList, listHTML(), 'fbList') +
    card(S.pFilter, filterHTML(), 'fbFilter') +
    card(S.pLegend, legendHTML(), 'fbLeg') +
    card(S.pSave, saveHTML(), 'fbSave');
  wireSide();
}
function card(title, body, id){ return '<div class="fb-card" id="'+id+'"><h3>'+title+'</h3>'+body+'</div>'; }

function scoreHTML(){
  var bc=countFor('Blue'), rc=countFor('Red');
  var lead='';
  var diff=state.score.Blue-state.score.Red;
  if(diff===0) lead=S.tied; else lead=(diff>0?S.blue:S.red)+' '+S.leadBy+' '+fmt(Math.abs(diff))+' '+S.pts;
  return '<div class="fb-score">'+
    '<div class="fb-team blue"><div class="nm">● '+S.blue+'</div><div class="pt" id="scB">'+fmt(state.score.Blue)+'</div><div class="sub">'+bc+' '+S.facHeld+' ・ 🔫 '+fmt(state.bullets.Blue)+'</div></div>'+
    '<div class="fb-team red"><div class="nm">● '+S.red+'</div><div class="pt" id="scR">'+fmt(state.score.Red)+'</div><div class="sub">'+rc+' '+S.facHeld+' ・ 🔫 '+fmt(state.bullets.Red)+'</div></div>'+
    '</div><div class="fb-lead" id="scLead">'+lead+'</div>';
}
function countFor(side){ var n=0; FACILITIES.forEach(function(f){ if(state.owners[f.id]===side) n++; }); return n; }

function buffHTML(){
  var B=buffsFor('Blue'), R=buffsFor('Red');
  function rw(k,bv,rv,cls){ return '<div class="fb-buff '+(cls||'')+'"><span class="k">'+k+'</span><span class="bv"><span class="bb">'+bv+'</span><span class="br">'+rv+'</span></span></div>'; }
  var h='';
  h+=rw(S.bTroopDmg, B.troopDamage?pct(B.troopDamage):S.none2, R.troopDamage?pct(R.troopDamage):S.none2);
  h+=rw(S.bDmgTaken, B.damageTaken?pct(B.damageTaken):S.none2, R.damageTaken?pct(R.damageTaken):S.none2);
  h+=rw(S.bSiege, B.siege?pct(B.siege):S.none2, R.siege?pct(R.siege):S.none2);
  h+=rw(S.bCapTime, B.captureTime?S.half:S.none2, R.captureTime?S.half:S.none2);
  h+=rw(S.bTpCd, B.teleportCd?S.half:S.none2, R.teleportCd?S.half:S.none2);
  h+=rw(S.bInjured, B.injured?'10%':S.none2, R.injured?'10%':S.none2,'dbf');
  return '<div class="fb-buffs">'+h+'</div>';
}

function listHTML(){
  var rows=visibleIds().map(function(id){
    var f=FAC[id], ty=TYPES[f.type], o=state.owners[id];
    var sub = (ty.initial||ty.perSec) ? (fmt(ty.perSec*60)+S.perMin) : (f.type==='WeaponWorkshop'?(fmt(ty.yield)+'🔫'):catLabel(ty.cat));
    return '<div class="fb-frow '+(o==='Blue'?'b':o==='Red'?'r':'')+'" data-id="'+id+'" role="button" tabindex="0">'+
      '<span class="dot" style="background:'+ownerColor(o)+'"></span>'+
      '<span class="fn">'+esc(tname(f.type,f.idx))+'</span>'+
      '<span class="fp">'+sub+'</span></div>';
  }).join('');
  return '<div class="fb-flist">'+rows+'</div>';
}

function filterHTML(){
  var cats=[['prize',S.catPrize],['point',S.catPoint],['buff',S.catBuff],['util',S.catUtil],['res',S.catRes]];
  return '<div class="fb-filt">'+cats.map(function(c){
    return '<button class="fb-chip '+(state.hideCat[c[0]]?'':'on')+'" data-cat="'+c[0]+'">'+c[1]+'</button>';
  }).join('')+'</div>';
}

function legendHTML(){
  var shapes=[['circle',S.catPoint],['hex',S.catBuff],['diamond',S.catUtil],['star',S.catPrize],['square',S.catRes]];
  var sh=shapes.map(function(s){ return '<span>'+miniShape(s[0])+s[1]+'</span>'; }).join('');
  return '<div class="fb-leg">'+
    '<span><span class="sw b"></span>'+S.blue+'</span>'+
    '<span><span class="sw r"></span>'+S.red+'</span>'+
    '<span><span class="sw n"></span>'+S.none+'</span></div>'+
    '<div class="fb-shapes">'+sh+'</div>'+
    '<p class="note" style="margin-top:8px">'+S.shapeNote+'</p>';
}
function miniShape(shape){
  var d=shape==='circle'?'<circle cx="9" cy="9" r="6.5"/>':'<path d="'+shapeMini(shape)+'"/>';
  return '<svg width="18" height="18" viewBox="-9 -9 18 18" style="overflow:visible"><g fill="#fff" stroke="#5b6276" stroke-width="1.6">'+
    (shape==='circle'?'<circle cx="0" cy="0" r="6.5"/>':'<path d="'+shapeMini(shape)+'"/>')+'</g></svg>';
}
function shapeMini(shape){ return shapePath(shape,6.5); }

function saveHTML(){
  var list=loadScen();
  var names=Object.keys(list).sort(function(a,b){return (list[b].ts||0)-(list[a].ts||0);});
  var rows = names.length ? names.map(function(n){
    return '<div class="fb-scen"><span class="sn"></span>'+
      '<button class="lo" data-n="'+esc(n)+'">'+S.load+'</button>'+
      '<button class="del" data-n="'+esc(n)+'">'+S.del+'</button></div>';
  }).join('') : '<div class="fb-empty">'+S.noScen+'</div>';
  return '<div class="fb-saverow"><input id="scenName" type="text" maxlength="40" placeholder="'+S.saveName+'">'+
    '<button class="fb-b on" id="scenSave">'+S.save+'</button></div>'+
    '<div id="scenList">'+rows+'</div>';
}

/* ---------- サイドのイベント結線 ---------- */
function wireSide(){
  // 施設リスト
  Array.prototype.forEach.call(document.querySelectorAll('.fb-frow'),function(row){
    row.addEventListener('click',function(){ cycle(row.getAttribute('data-id')); });
    row.addEventListener('keydown',function(ev){ if(ev.key==='Enter'||ev.key===' '){ev.preventDefault(); cycle(row.getAttribute('data-id'));} });
    row.addEventListener('mouseenter',function(){ showTip(row.getAttribute('data-id')); });
    row.addEventListener('mouseleave',hideTip);
  });
  // フィルター
  Array.prototype.forEach.call(document.querySelectorAll('.fb-chip'),function(ch){
    ch.addEventListener('click',function(){ var c=ch.getAttribute('data-cat'); state.hideCat[c]=!state.hideCat[c]; renderAll(); });
  });
  // セーブ
  var nameInp=document.getElementById('scenName'), saveBtn=document.getElementById('scenSave');
  if(saveBtn) saveBtn.addEventListener('click',function(){ saveScen(nameInp.value); });
  if(nameInp) nameInp.addEventListener('keydown',function(ev){ if(ev.key==='Enter') saveScen(nameInp.value); });
  Array.prototype.forEach.call(document.querySelectorAll('#scenList .lo'),function(b){ b.addEventListener('click',function(){ loadOne(b.getAttribute('data-n')); }); });
  Array.prototype.forEach.call(document.querySelectorAll('#scenList .del'),function(b){ b.addEventListener('click',function(){ delScen(b.getAttribute('data-n')); }); });
  // シナリオ名は textContent で安全に挿入
  var snEls=document.querySelectorAll('#scenList .sn'); var list=loadScen();
  var names=Object.keys(list).sort(function(a,b){return (list[b].ts||0)-(list[a].ts||0);});
  for(var i=0;i<snEls.length;i++) snEls[i].textContent=names[i]||'';
}

/* ---------- 軽量更新(再生中はDOM全再構築せず数値だけ更新) ---------- */
function tickUI(){
  var b=document.getElementById('scB'), r=document.getElementById('scR');
  if(b) b.textContent=fmt(state.score.Blue);
  if(r) r.textContent=fmt(state.score.Red);
  // スコアカードの下段(弾丸/施設数/リード)とバフ・採集リングは renderSoft で
  renderSoftNumbers();
  paintFacilities();
}
function renderSoftNumbers(){
  // スコアの sub / cnt / lead を再描画(構造は維持)
  var sc=document.getElementById('fbScore'); if(sc) sc.innerHTML='<h3>'+S.pScore+'</h3>'+scoreHTML();
  var bf=document.getElementById('fbBuff'); if(bf) bf.innerHTML='<h3>'+S.pBuff+'</h3>'+buffHTML();
}

/* =====================================================================
   再描画オーケストレーション
   ===================================================================== */
function renderAll(){ renderSide(); paintFacilities(); updHistBtns(); updClock(); }

/* =====================================================================
   ツールバー
   ===================================================================== */
function icon(name){
  var p={
    play:'<path d="M6 4l12 8-12 8z"/>', pause:'<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>',
    reset:'<path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/>', undo:'<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 010 10h-3"/>',
    redo:'<path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 000 10h3"/>',
    flag:'<path d="M6 21V4"/><path d="M6 5h11l-2 3 2 3H6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
    dl:'<path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M5 20h14"/>', up:'<path d="M12 20V9"/><path d="M8 13l4-4 4 4"/><path d="M5 4h14"/>'
  };
  return '<svg class="fb-ic" viewBox="0 0 24 24">'+(p[name]||'')+'</svg>';
}
function buildBar(){
  var bar=document.getElementById('bar');
  bar.innerHTML =
    '<div class="fb-grp"><span class="lbl">'+S.grpSim+'</span>'+
      '<button class="fb-b" id="bPlay">'+icon('play')+'<span id="playT">'+S.play+'</span></button>'+
      '<select class="fb-b" id="speed" aria-label="'+S.speed+'" style="padding-right:8px">'+
        '<option value="1">1×</option><option value="5" selected>5×</option><option value="60">60×</option></select>'+
      '<button class="fb-b" id="bClock">'+icon('reset')+S.resetClock+'</button>'+
    '</div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpBulk+'</span>'+
      '<button class="fb-b blue" id="bCoreB">'+icon('flag')+S.coreB+'</button>'+
      '<button class="fb-b red" id="bCoreR">'+icon('flag')+S.coreR+'</button>'+
      '<button class="fb-b blue" id="bAllB">'+S.allB+'</button>'+
      '<button class="fb-b red" id="bAllR">'+S.allR+'</button>'+
      '<button class="fb-b" id="bClear">'+icon('x')+S.clearAll+'</button>'+
    '</div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpEdit+'</span>'+
      '<button class="fb-b" id="bUndo" disabled>'+icon('undo')+S.undo+'</button>'+
      '<button class="fb-b" id="bRedo" disabled>'+icon('redo')+S.redo+'</button>'+
    '</div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpData+'</span>'+
      '<button class="fb-b" id="bExp">'+icon('dl')+S.exp+'</button>'+
      '<button class="fb-b" id="bImp">'+icon('up')+S.imp+'</button>'+
    '</div>';

  document.getElementById('bPlay').addEventListener('click',togglePlay);
  document.getElementById('speed').addEventListener('change',function(e){ state.speed=parseInt(e.target.value,10)||5; });
  document.getElementById('bClock').addEventListener('click',resetClock);
  document.getElementById('bCoreB').addEventListener('click',function(){ bulk(CORE,'Blue'); track('fb_bulk',{op:'coreB'}); });
  document.getElementById('bCoreR').addEventListener('click',function(){ bulk(CORE,'Red'); track('fb_bulk',{op:'coreR'}); });
  document.getElementById('bAllB').addEventListener('click',function(){ bulk(visibleIds(),'Blue'); track('fb_bulk',{op:'allB'}); });
  document.getElementById('bAllR').addEventListener('click',function(){ bulk(visibleIds(),'Red'); track('fb_bulk',{op:'allR'}); });
  document.getElementById('bClear').addEventListener('click',clearAll);
  document.getElementById('bUndo').addEventListener('click',undo);
  document.getElementById('bRedo').addEventListener('click',redo);
  document.getElementById('bExp').addEventListener('click',exportJSON);
  document.getElementById('bImp').addEventListener('click',function(){ document.getElementById('importFile').click(); });
  document.getElementById('importFile').addEventListener('change',importJSON);
}

/* ---------- 再生・時計 ---------- */
var timer=null;
function togglePlay(){ state.playing=!state.playing; var t=document.getElementById('playT'),b=document.getElementById('bPlay');
  b.innerHTML=(state.playing?icon('pause')+'<span id="playT">'+S.pause+'</span>':icon('play')+'<span id="playT">'+S.play+'</span>');
  b.classList.toggle('on',state.playing);
}
function resetClock(){ state.elapsed=0; state.playing=false; var b=document.getElementById('bPlay'); if(b){b.classList.remove('on'); b.innerHTML=icon('play')+'<span id="playT">'+S.play+'</span>';}
  FACILITIES.forEach(function(f){ state.occSec[f.id]=0; state.harvestProg[f.id]=0; state.harvestDone[f.id]=false; }); updClock(); paintFacilities(); }
function updClock(){
  var c=document.getElementById('clockT'); if(c) c.textContent=mmss(state.elapsed);
  var ph=document.getElementById('phase'); if(ph) ph.textContent = state.elapsed<900?S.phase1:S.phase2;
}
function step(){
  if(!state.playing) return;
  var dt=0.1*state.speed; state.elapsed+=dt;
  FACILITIES.forEach(function(f){
    var o=state.owners[f.id]; if(!o) return; var ty=TYPES[f.type];
    state.occSec[f.id]+=dt;
    if(ty.perSec>0) state.score[o]+=ty.perSec*dt;
    if(f.type==='WeaponWorkshop' && state.workshopVisible && !state.harvestDone[f.id]){
      state.harvestProg[f.id]+=dt;
      if(state.harvestProg[f.id]>=ty.harvest){ state.harvestProg[f.id]=ty.harvest; state.harvestDone[f.id]=true; state.bullets[o]+=ty.yield; }
    }
  });
  // 20分で武器工房 自動出現
  if(!state.workshopVisible && state.elapsed>=1200){ state.workshopVisible=true; renderSide(); paintFacilities(); toast(S.wsAppear); }
  updClock(); tickUI();
}

/* =====================================================================
   パン・ズーム
   ===================================================================== */
function applyView(){ var vp=document.getElementById('vp'); if(vp) vp.setAttribute('transform','translate('+state.view.tx+' '+state.view.ty+') scale('+state.view.scale+')'); }
function svgPt(clientX,clientY){ var rc=svg.getBoundingClientRect(); return {x:(clientX-rc.left)/rc.width*1000, y:(clientY-rc.top)/rc.height*720}; }
function zoomAt(cx,cy,factor){
  var p=svgPt(cx,cy); var ns=Math.max(0.6,Math.min(3,state.view.scale*factor));
  var wx=(p.x-state.view.tx)/state.view.scale, wy=(p.y-state.view.ty)/state.view.scale;
  state.view.scale=ns; state.view.tx=p.x-wx*ns; state.view.ty=p.y-wy*ns; applyView(); if(tipFor)positionTip(tipFor);
}
function setupPanZoom(){
  document.getElementById('zIn').addEventListener('click',function(){ var rc=svg.getBoundingClientRect(); zoomAt(rc.left+rc.width/2,rc.top+rc.height/2,1.25); });
  document.getElementById('zOut').addEventListener('click',function(){ var rc=svg.getBoundingClientRect(); zoomAt(rc.left+rc.width/2,rc.top+rc.height/2,0.8); });
  document.getElementById('zRst').addEventListener('click',function(){ state.view={scale:1,tx:0,ty:0}; applyView(); });
  svg.addEventListener('wheel',function(e){ e.preventDefault(); zoomAt(e.clientX,e.clientY, e.deltaY<0?1.12:0.9); },{passive:false});
  var drag=null;
  svg.addEventListener('pointerdown',function(e){
    if(e.target.closest && e.target.closest('.fac')) return; // 施設上はパンしない
    drag={x:e.clientX,y:e.clientY,tx:state.view.tx,ty:state.view.ty}; svg.classList.add('drag'); svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove',function(e){
    if(!drag) return; var rc=svg.getBoundingClientRect();
    state.view.tx=drag.tx+(e.clientX-drag.x)/rc.width*1000; state.view.ty=drag.ty+(e.clientY-drag.y)/rc.height*720; applyView();
  });
  function end(){ drag=null; svg.classList.remove('drag'); }
  svg.addEventListener('pointerup',end); svg.addEventListener('pointercancel',end);
}

/* =====================================================================
   シナリオ保存/読込/入出力
   ===================================================================== */
var SKEY='wos_foundry_scen_v1';
function loadScen(){ try{ return JSON.parse(localStorage.getItem(SKEY)||'{}')||{}; }catch(e){ return {}; } }
function writeScen(o){ try{ localStorage.setItem(SKEY,JSON.stringify(o)); }catch(e){} }
function saveScen(name){
  name=(name||'').trim(); if(!name) name=T('シナリオ','Scenario')+' '+new Date().toLocaleString();
  var all=loadScen(); all[name]={owners:JSON.parse(JSON.stringify(state.owners)),workshopVisible:state.workshopVisible,ts:Date.now()};
  writeScen(all); renderSide(); toast(S.toSaved);
}
function loadOne(name){
  var all=loadScen(), s=all[name]; if(!s) return;
  pushHistory();
  state.workshopVisible=!!s.workshopVisible;
  state.score={Blue:0,Red:0}; state.bullets={Blue:0,Red:0};
  FACILITIES.forEach(function(f){ state.occSec[f.id]=0; state.harvestProg[f.id]=0; state.harvestDone[f.id]=false; state.owners[f.id]=null; });
  FACILITIES.forEach(function(f){ var o=s.owners?s.owners[f.id]:null; if(o==='Blue'||o==='Red') applyOwner(f.id,o); });
  renderAll(); toast(S.toLoaded);
}
function delScen(name){ var all=loadScen(); delete all[name]; writeScen(all); renderSide(); }
function exportJSON(){
  var data={ app:'foundry-battle', v:1, exportedAt:new Date().toISOString(),
    owners:state.owners, workshopVisible:state.workshopVisible, elapsed:Math.round(state.elapsed),
    score:{Blue:Math.round(state.score.Blue),Red:Math.round(state.score.Red)}, bullets:state.bullets };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='foundry-battle-scenario.json';
  document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },100); toast(S.toExp);
}
function importJSON(e){
  var file=e.target.files&&e.target.files[0]; if(!file) return;
  var rd=new FileReader();
  rd.onload=function(){
    try{
      var d=JSON.parse(rd.result);
      if(!d||typeof d!=='object'||!d.owners) throw 0;
      pushHistory();
      state.workshopVisible=!!d.workshopVisible; state.score={Blue:0,Red:0}; state.bullets={Blue:0,Red:0};
      FACILITIES.forEach(function(f){ state.occSec[f.id]=0; state.harvestProg[f.id]=0; state.harvestDone[f.id]=false; state.owners[f.id]=null; });
      FACILITIES.forEach(function(f){ var o=d.owners[f.id]; if(o==='Blue'||o==='Red') applyOwner(f.id,o); });
      renderAll(); toast(S.toLoaded);
    }catch(err){ toast(S.toImpErr); }
    e.target.value='';
  };
  rd.readAsText(file);
}

/* =====================================================================
   その他
   ===================================================================== */
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
var toastTimer=null;
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){ t.classList.remove('show'); },1900); }
function track(a,p){ try{ if(window.gtag) gtag('event',a,Object.assign({tool:'foundry_battle'},p||{})); }catch(e){} }

/* ---------- 静的テキスト/補助セクション ---------- */
function buildStatic(){
  document.getElementById('h1').innerHTML = S.h1a+' <span class="acc">'+S.h1b+'</span>';
  document.getElementById('tag').textContent = S.tag;
  document.getElementById('lead').innerHTML = S.lead;
  document.getElementById('hHelp').textContent = S.hHelp;
  document.getElementById('hData').textContent = S.hData;
  document.getElementById('dataNote').textContent = S.dataNote;
  document.getElementById('helpgrid').innerHTML =
    [['help1t','help1'],['help2t','help2'],['help3t','help3'],['help4t','help4']].map(function(p){
      return '<div class="fb-help"><b>'+S[p[0]]+'</b><br>'+S[p[1]]+'</div>';
    }).join('');
  // 関連リンク
  var rel=document.getElementById('relbar');
  rel.innerHTML =
    '<a href="../bear-hunt/index.html">'+T('→ 熊狩シミュレーター','→ Bear Hunt Simulator')+'</a>'+
    '<a href="../troop-ratio/index.html">'+T('→ 兵士比率シミュ','→ Troop Ratio')+'</a>'+
    '<a href="../king-castle/index.html">'+T('→ 王城戦','→ Castle Battle')+'</a>'+
    '<a href="../../guides/bear-hunt-guide.html">'+T('→ 攻略ガイド','→ Guides')+'</a>';
  // EN ページメタ
  if(EN){
    document.getElementById('htmlroot').lang='en';
    document.title='Foundry Battle Map Simulator | Whiteout Tools Lab';
    document.getElementById('crumb').innerHTML='<a href="../../index.html?lang=en">Home</a> &gt; Foundry Battle Simulator';
    var ml=document.querySelector('#fbMap'); if(ml) ml.setAttribute('aria-label','Foundry Battle map');
    var z=document.getElementById('zIn'); if(z){ z.setAttribute('aria-label','Zoom in'); document.getElementById('zOut').setAttribute('aria-label','Zoom out'); document.getElementById('zRst').setAttribute('aria-label','Reset view'); }
  }
}

/* ---------- 初期化 ---------- */
function init(){
  buildStatic();
  buildMapStatic();
  buildFacilities();
  buildBar();
  setupPanZoom();
  renderAll();
  applyView();
  timer=setInterval(step,100);
  window.addEventListener('resize',function(){ if(tipFor)positionTip(tipFor); });
}
if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
