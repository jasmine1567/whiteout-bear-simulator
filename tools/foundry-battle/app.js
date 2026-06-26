/* =====================================================================
   兵器工場争奪戦 マップシミュレータ  app.js  (v2: 実マップ準拠)
   - 実マップの配置(11施設+中央+武器工房)・セーフティエリア
   - 占拠時間 / 奪取時の弾散らばり / 味方・敵を選んで配置 / フェーズ解放
   - 横棒スコアバー(つばぜり合い+毎分差の矢印) / イベント時間 / 一時退出CD
   - 数値は下記 CONFIG / TYPES / FACILITIES を編集すれば調整可能
   ===================================================================== */
(function(){
"use strict";
var T = window.t || function(a){return a;};
var EN = (window.WOS_LANG||'ja')==='en';

/* ============ 調整しやすい設定(初期値・UIからも変更可) ============ */
var CFG = {
  captureSec: 60,    // 占拠完了までの秒数(スチームボイラー保持側は-50%)
  eventMin:   30,    // イベント(ゲーム)時間ぜんたい(分)
  reentrySec: 300,   // 一時退出後の再入場までの秒数
  phase2Min:  15,    // 中央(王室)・兵器倉庫・傭兵野営地が解放される時刻(分)
  workshopMin:20     // 武器工房が出現する時刻(分)
};
var SCATTER = 0.5;   // 奪われた時に散らばる弾の割合(=半分)

/* ============ 多言語UI ============ */
var S = {
  h1a:T('兵器工場争奪戦','Foundry Battle'), h1b:T('マップシミュレータ','Map Simulator'), tag:T('マップシミュレータ','Map Simulator'),
  lead:T('実際のフィールド配置を再現。上の<b>配置モード</b>で味方(青)/敵(赤)を選んで施設をクリックすると、その勢力が<b>占拠開始</b>します。占拠時間・フェーズ解放・奪取時の弾散らばりまで反映し、スコアの優劣を横棒バーで表示します。',
            'A recreation of the real field. Pick <b>Blue/Red</b> in the placement mode above, then click a facility to start its capture. Capture timers, phase unlocks and bullet scatter on loss are all modeled, with a tug-of-war score bar.'),
  blue:T('自軍','Blue'), red:T('敵軍','Red'), none:T('無所属','Neutral'), pts:T('点','pts'), perMin:T('/分','/min'),
  // ブラシ
  grpBrush:T('配置モード','Placement'), placeB:T('自軍で配置','Place Blue'), placeR:T('敵軍で配置','Place Red'), placeN:T('占領解除','Clear'),
  capToggle:T('占拠時間を反映','Capture time'),
  // 時間/再生
  grpSim:T('再生','Play'), play:T('再生','Play'), pause:T('停止','Pause'), resetClock:T('時間リセット','Reset time'), speed:T('速度','Speed'),
  // 一括/編集/データ
  grpBulk:T('一括','Bulk'), allB:T('全自軍','All Blue'), allR:T('全敵軍','All Red'), clearAll:T('全解除','Clear all'),
  grpEdit:T('編集','Edit'), undo:T('元に戻す','Undo'), redo:T('やり直し','Redo'),
  grpData:T('データ','Data'), exp:T('書き出し','Export'), imp:T('読み込み','Import'),
  // スコアバー
  tug:T('スコア勢力図','Score balance'), even:T('互角','Even'), facHeld:T('施設','facs'),
  // バフ
  pBuff:T('戦力バフ集計','Buff totals'), bTroopDmg:T('部隊ダメージ','Troop dmg'), bDmgTaken:T('被ダメージ','Dmg taken'),
  bSiege:T('対施設攻撃','Siege'), bCapTime:T('占領完了時間','Capture time'), bTpCd:T('転移CD','Teleport CD'),
  bInjured:T('負傷(デバフ)','Injured'), half:T('-50%','-50%'), none2:T('—','—'),
  // 一覧/フィルタ/凡例/設定/退出/保存
  pList:T('施設一覧','Facilities'), pFilter:T('表示フィルター','Filter'), pLegend:T('凡例','Legend'),
  pSettings:T('詳細設定','Settings'), pExit:T('自分の状態','Your status'), pSave:T('シナリオ保存','Scenarios'),
  sCapture:T('占拠時間(秒)','Capture (s)'), sEvent:T('イベント時間(分)','Event (min)'), sReentry:T('再入場CD(秒)','Re-entry (s)'),
  sPhase2:T('フェーズ2(分)','Phase 2 (min)'), sWorkshop:T('工房出現(分)','Workshop (min)'),
  inField:T('在場中','In field'), outField:T('退出中','Out'), exitBtn:T('一時退出','Temp exit'), reenterBtn:T('再入場','Re-enter'),
  reentryIn:T('再入場まで','Re-entry in'), canReenter:T('再入場できます','Ready to re-enter'),
  saveName:T('シナリオ名','Scenario name'), save:T('保存','Save'), load:T('読込','Load'), del:T('削除','Delete'), noScen:T('保存はありません','No scenarios'),
  catPrize:T('中枢','Core'), catPoint:T('得点','Points'), catBuff:T('バフ','Buff'), catUtil:T('補助','Support'), catRes:T('資源','Resource'),
  shapeNote:T('色=占領勢力 / 番号=施設No. / 占拠中はリングが回ります','Color = owner / number = facility No. / ring fills while capturing'),
  // ツールチップ
  tInitial:T('初回ボーナス','First capture'), tCont:T('継続','Per min'), tOwner:T('占領','Owner'),
  tHarvest:T('弾丸採集','Bullet harvest'), tRemain:T('残り','left'), tDone:T('採集完了','Collected'),
  tCapturing:T('占拠中','Capturing'), tCapLeft:T('占拠まで','Capture in'), tLocked:T('未解放','Locked'),
  tUnlock:T('解放','Unlocks at'), tMin:T('分','min'), tClickB:T('クリックで自軍が占拠開始','Click: Blue starts capture'),
  tClickR:T('クリックで敵軍が占拠開始','Click: Red starts capture'), tClickN:T('クリックで解除','Click to clear'),
  tTier:T('段階','Tier'),
  // イベント時間
  evtTime:T('ゲーム時間','Event time'), evtRemain:T('残り','Left'), evtEnd:T('イベント終了','Event ended'),
  phase1:T('フェーズ1','Phase 1'), phase2:T('フェーズ2','Phase 2'), phase3:T('終盤','Phase 3'),
  // セーフティ
  safeB:T('自軍セーフティ','Blue safe'), safeR:T('敵軍セーフティ','Red safe'),
  // トースト
  toCleared:T('全施設を解除しました','Cleared all'), toSaved:T('保存しました','Saved'), toLoaded:T('読み込みました','Loaded'),
  toExp:T('JSONを書き出しました','Exported'), toImpErr:T('読み込み失敗(形式不正)','Import failed'),
  toScatter:T('💥 奪取で弾が半分散らばりました','💥 Half the bullets scattered'),
  toLocked:T('この施設はまだ解放されていません','Not unlocked yet'), toEnd:T('イベント終了時刻に到達','Event time reached'),
  toExit:T('一時退出しました','You left the field'), toReenter:T('再入場しました','You re-entered'),
  // ヘルプ
  hHelp:T('使い方とロジック','How it works'),
  help1t:T('味方/敵を選んで配置','Place Blue or Red'),
  help1:T('上の<b>配置モード</b>で「自軍で配置／敵軍で配置／解除」を選び、施設をクリック。敵の初回占領もシミュレートできます。','Pick Place Blue / Place Red / Clear above, then click a facility. You can simulate the enemy capturing first, too.'),
  help2t:T('占拠には時間がかかる','Capture takes time'),
  help2:T('クリックすると<b>占拠開始</b>。リングが満ちると占領完了し、初回ボーナスと毎分ポイントが入ります。スチームボイラーを持つ側は占拠時間が半分になります。','Clicking starts a capture; when the ring fills, the facility is yours and points begin. Holding the Steam Boiler halves capture time.'),
  help3t:T('奪われると弾が半分散らばる','Lose it, lose half the bullets'),
  help3:T('武器工房を敵に奪われると、貯まっていた弾の<b>半分が散らばって消失</b>し、残りが新所有者へ引き継がれます。','If the enemy takes your Workshop, <b>half the stored bullets scatter</b> and vanish; the rest carry to the new owner.'),
  help4t:T('フェーズ解放とイベント時間','Phases & event time'),
  help4:T('フェーズ1では中央(王室)・兵器倉庫・傭兵野営地は<b>占拠不可</b>。設定の時刻で解放、武器工房は出現します。残り時間も上に表示。','In Phase 1 the Royal Foundry, Armory and Mercenary Camp are <b>locked</b>; they unlock and the Workshop appears at the times in Settings. Time remaining shows on top.'),
  hData:T('施設の対応(番号→種別)','Facility mapping (No. → type)'),
  dataNote:''
};

/* ============ 施設タイプ定義(基準値) ============ */
var TYPES = {
  RoyalFoundry:  {ja:'王室兵器工場', en:'Royal Foundry',  cat:'prize', initial:0,    perSec:0,  buff:{injured:0.10},                        yield:0,    harvest:0,    ab:T('王','RF')},
  TestField:     {ja:'武器試験場',   en:'Test Field',     cat:'point', initial:6000, perSec:20, buff:{},                                    yield:0,    harvest:0,    ab:T('試','TF')},
  RepairFactory: {ja:'武器修理工場', en:'Repair Factory', cat:'point', initial:3000, perSec:10, buff:{},                                    yield:0,    harvest:0,    ab:T('修','RP')},
  Armory:        {ja:'兵器倉庫',     en:'Armory',         cat:'buff',  initial:0,    perSec:0,  buff:{troopDamage:0.15, damageTaken:-0.15}, yield:0,    harvest:0,    ab:T('倉','AR')},
  MercenaryCamp: {ja:'傭兵野営地',   en:'Mercenary Camp', cat:'buff',  initial:0,    perSec:0,  buff:{siege:'tier'},                        yield:0,    harvest:0,    ab:T('傭','MC')},
  BoilerRoom:    {ja:'スチームボイラー', en:'Steam Boiler', cat:'util', initial:0,    perSec:0,  buff:{captureTimeMul:0.5},                  yield:0,    harvest:0,    ab:T('蒸','SB')},
  TransitStation:{ja:'中継所',       en:'Transit Station',cat:'util',  initial:0,    perSec:0,  buff:{teleportCdMul:0.5},                   yield:0,    harvest:0,    ab:T('中','TS')},
  WeaponWorkshop:{ja:'武器工房',     en:'Weapon Workshop',cat:'res',   initial:0,    perSec:0,  buff:{},                                    yield:4800, harvest:1200, ab:T('工','WS')}
};
function tname(type, idx){ var d=TYPES[type]; var n=EN?d.en:d.ja; return idx?(n+idx):n; }

/* ============ 施設インスタンス(座標は実マップ画像準拠 viewBox 1000x788) ============
   g(解放グループ): 'base'=最初から / 'p2'=フェーズ2 / 'ws'=武器工房出現 */
var FACILITIES = [
  {id:'royal',   num:1,  type:'RoyalFoundry',  x:479, y:376, size:88, idx:'',  g:'p2'},
  {id:'transit', num:2,  type:'TransitStation',x:269, y:317, size:58, idx:'',  g:'base'},
  {id:'boiler',  num:3,  type:'BoilerRoom',    x:690, y:471, size:58, idx:'',  g:'base'},
  {id:'repair1', num:4,  type:'RepairFactory', x:198, y:443, size:60, idx:'1', g:'base'},
  {id:'repair2', num:5,  type:'RepairFactory', x:767, y:369, size:60, idx:'2', g:'base'},
  {id:'repair3', num:6,  type:'RepairFactory', x:333, y:696, size:60, idx:'3', g:'base'},
  {id:'repair4', num:7,  type:'RepairFactory', x:595, y:114, size:60, idx:'4', g:'base'},
  {id:'merc',    num:8,  type:'MercenaryCamp', x:476, y:600, size:60, idx:'',  g:'p2'},
  {id:'armory',  num:9,  type:'Armory',        x:479, y:219, size:62, idx:'',  g:'p2'},
  {id:'test1',   num:10, type:'TestField',     x:595, y:741, size:62, idx:'1', g:'base'},
  {id:'test2',   num:11, type:'TestField',     x:333, y:114, size:62, idx:'2', g:'base'},
  {id:'workshop',num:12, type:'WeaponWorkshop',x:700, y:250, size:58, idx:'',  g:'ws'}
];
var FAC={}; FACILITIES.forEach(function(f){ FAC[f.id]=f; });
var SAFE={ blue:{x:84,y:383,w:150,h:150}, red:{x:916,y:383,w:150,h:150} };

function unlockSec(f){ if(f.g==='p2') return CFG.phase2Min*60; if(f.g==='ws') return CFG.workshopMin*60; return 0; }
function appeared(f){ return state.elapsed>=unlockSec(f) || f.g==='base'; } // ws/p2: 出現/解放時刻以降
function isVisible(f){ if(f.g==='ws') return state.elapsed>=unlockSec(f); return true; }
function isLocked(f){ return state.elapsed<unlockSec(f); }

/* ============ 状態 ============ */
var state = {
  owners:{}, capturing:{}, occSec:{}, harvestProg:{}, harvestDone:{},
  score:{Blue:0,Red:0}, bullets:{Blue:0,Red:0},
  elapsed:0, playing:false, speed:5, ended:false,
  brush:'Blue', capTimed:true,
  self:{inField:true, reentryRemain:0},
  hideCat:{}, view:{scale:1,tx:0,ty:0}
};
FACILITIES.forEach(function(f){ state.owners[f.id]=null; state.capturing[f.id]=null; state.occSec[f.id]=0; state.harvestProg[f.id]=0; state.harvestDone[f.id]=false; });

/* ============ Undo/Redo ============ */
var undoStack=[], redoStack=[];
function snap(){ return JSON.parse(JSON.stringify({owners:state.owners,capturing:state.capturing,occSec:state.occSec,harvestProg:state.harvestProg,harvestDone:state.harvestDone,score:state.score,bullets:state.bullets})); }
function pushHistory(){ undoStack.push(snap()); if(undoStack.length>60)undoStack.shift(); redoStack=[]; updHistBtns(); }
function restore(s){ ['owners','capturing','occSec','harvestProg','harvestDone','score','bullets'].forEach(function(k){ state[k]=s[k]; }); renderAll(); }
function undo(){ if(!undoStack.length)return; redoStack.push(snap()); restore(undoStack.pop()); updHistBtns(); }
function redo(){ if(!redoStack.length)return; undoStack.push(snap()); restore(redoStack.pop()); updHistBtns(); }
function updHistBtns(){ var u=document.getElementById('bUndo'),r=document.getElementById('bRedo'); if(u)u.disabled=!undoStack.length; if(r)r.disabled=!redoStack.length; }

/* ============ 占拠ロジック ============ */
function sideHasBoiler(side){ return FACILITIES.some(function(f){ return f.type==='BoilerRoom' && state.owners[f.id]===side && !state.capturing[f.id]; }); }
function captureTime(side){ var t=CFG.captureSec; if(sideHasBoiler(side)) t*=0.5; return Math.max(1,t); }

function applyBrush(id){
  var f=FAC[id];
  if(isLocked(f)){ toast(S.toLocked); return; }
  if(state.ended) return;
  var br=state.brush;
  pushHistory();
  if(br==='clear'){ abandon(id); }
  else {
    if(state.owners[id]===br && !state.capturing[id]){ /* 既に同勢力 */ undoStack.pop(); updHistBtns(); return; }
    if(state.capTimed){ state.capturing[id]={by:br, remain:captureTime(br), total:captureTime(br)}; }
    else { finalizeCapture(id, br); }
  }
  renderAll();
}
function abandon(id){
  var f=FAC[id];
  state.owners[id]=null; state.capturing[id]=null; state.occSec[id]=0;
  if(f.type==='WeaponWorkshop'){ state.harvestProg[id]=0; state.harvestDone[id]=false; }
}
function finalizeCapture(id, by){
  var f=FAC[id], ty=TYPES[f.type], prev=state.owners[id];
  // 武器工房を敵から奪取 → 貯弾の半分が散らばる
  if(f.type==='WeaponWorkshop' && prev && prev!==by && !state.harvestDone[id]){
    var stored = (state.harvestProg[id]/ty.harvest)*ty.yield;
    var keep = stored*(1-SCATTER);                 // 残り半分を新所有者が引き継ぐ
    state.harvestProg[id] = (keep/ty.yield)*ty.harvest;
    if(stored>1) toast(S.toScatter);
  }
  state.owners[id]=by; state.capturing[id]=null; state.occSec[id]=0;
  if(by && ty.initial>0) state.score[by]+=ty.initial;
}
function bulkAll(owner){ pushHistory(); FACILITIES.forEach(function(f){ if(isLocked(f)||!isVisible(f))return; if(owner){ finalizeCapture(f.id,owner); } else { abandon(f.id); } }); renderAll(); }
function clearAll(){ pushHistory(); FACILITIES.forEach(function(f){ abandon(f.id); }); state.score={Blue:0,Red:0}; state.bullets={Blue:0,Red:0}; renderAll(); toast(S.toCleared); }

/* ============ バフ集計 ============ */
function mercTier(id){ return Math.max(1,Math.min(5,1+Math.floor(state.occSec[id]/60))); }
function buffsFor(side){
  var b={troopDamage:0,damageTaken:0,siege:0,captureTime:false,teleportCd:false,injured:false};
  FACILITIES.forEach(function(f){
    if(state.owners[f.id]!==side || state.capturing[f.id]) return;
    if(f.type==='Armory'){ b.troopDamage+=0.15; b.damageTaken-=0.15; }
    if(f.type==='MercenaryCamp') b.siege=Math.max(b.siege, mercTier(f.id)*0.10);
    if(f.type==='BoilerRoom') b.captureTime=true;
    if(f.type==='TransitStation') b.teleportCd=true;
    if(f.type==='RoyalFoundry') b.injured=true;
  });
  return b;
}
function perMinFor(side){ var s=0; FACILITIES.forEach(function(f){ if(state.owners[f.id]===side && !state.capturing[f.id]) s+=TYPES[f.type].perSec*60; }); return s; }

/* ============ 表示ヘルパー ============ */
function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function pct(n){ return (n>=0?'+':'')+Math.round(n*100)+'%'; }
function mmss(s){ s=Math.max(0,s); var m=Math.floor(s/60),x=Math.floor(s%60); return m+':'+(x<10?'0':'')+x; }
function ownerColor(o){ return o==='Blue'?'#2256c8':o==='Red'?'#cf2e22':'#9aa3b5'; }
function ownerFill(o){ return o==='Blue'?'#cfe0fb':o==='Red'?'#f7d2cc':'#e7ebf2'; }
function ownerName(o){ return o==='Blue'?S.blue:o==='Red'?S.red:S.none; }
function catLabel(c){ return c==='prize'?S.catPrize:c==='point'?S.catPoint:c==='buff'?S.catBuff:c==='util'?S.catUtil:S.catRes; }
function countFor(side){ var n=0; FACILITIES.forEach(function(f){ if(state.owners[f.id]===side)n++; }); return n; }

/* =====================================================================
   マップ描画
   ===================================================================== */
var svg=document.getElementById('fbMap'), tip=document.getElementById('tip'), mapwrap=document.getElementById('mapwrap');
var NS='http://www.w3.org/2000/svg';
function el(tag,a){ var e=document.createElementNS(NS,tag); if(a)for(var k in a)e.setAttribute(k,a[k]); return e; }
function diamond(r){ return 'M0 '+(-r)+'L'+r+' 0L0 '+r+'L'+(-r)+' 0Z'; } // 等角ひし形(縦横同)
function isoPad(w,h){ return 'M0 '+(-h)+'L'+w+' 0L0 '+h+'L'+(-w)+' 0Z'; }

function buildMapStatic(){
  svg.setAttribute('viewBox','0 0 1000 788');
  var defs=el('defs');
  defs.innerHTML =
    '<radialGradient id="fbBg" cx="50%" cy="44%" r="70%"><stop offset="0" stop-color="#f3eef0"/><stop offset="0.5" stop-color="#e7dde2"/><stop offset="1" stop-color="#cdbfca"/></radialGradient>'+
    '<filter id="fbSh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#3a2030" flood-opacity="0.25"/></filter>';
  svg.appendChild(defs);
  var vp=el('g',{id:'vp'}); svg.appendChild(vp);
  // 背景(峡谷に囲まれた雪原フィールド)
  vp.appendChild(el('rect',{x:0,y:0,width:1000,height:788,fill:'#b6a3b0'}));
  vp.appendChild(el('path',{d:'M40 120 Q120 40 300 70 Q500 30 720 70 Q900 50 965 150 Q985 420 900 660 Q700 740 480 720 Q230 745 95 640 Q25 420 40 120 Z',fill:'url(#fbBg)',stroke:'#7a6470','stroke-width':10,opacity:'0.95'}));
  // セーフティエリア
  function safe(s,color,label){
    var g=el('g',{transform:'translate('+s.x+' '+s.y+')'});
    g.appendChild(el('path',{d:isoPad(s.w/1.4,s.h/2.6),fill:color,opacity:'0.5',stroke:color,'stroke-width':3}));
    var tx=el('text',{x:0,y:5,'text-anchor':'middle','font-size':14,'font-weight':800,fill:'#fff','font-family':'Noto Sans JP'}); tx.textContent=label; g.appendChild(tx);
    vp.appendChild(g);
  }
  safe(SAFE.blue,'#3a7bf0',S.safeB); safe(SAFE.red,'#e2462f',S.safeR);
  // 中央への補給線
  var lines=el('g',{stroke:'#9a8794','stroke-width':2,opacity:'0.45'});
  FACILITIES.forEach(function(f){ if(f.id==='royal')return; lines.appendChild(el('line',{x1:479,y1:376,x2:f.x,y2:f.y,'stroke-dasharray':'5 7'})); });
  vp.appendChild(lines);
  vp.appendChild(el('g',{id:'fbFacs'}));
  return vp;
}

function buildFacilities(){
  var host=document.getElementById('fbFacs'); host.innerHTML='';
  FACILITIES.forEach(function(f){
    var ty=TYPES[f.type], r=f.size/2;
    var g=el('g',{'class':'fac','data-id':f.id,role:'button',tabindex:'0',transform:'translate('+f.x+' '+f.y+')'});
    // 等角パッド
    g.appendChild(el('path',{'class':'pad',d:isoPad(r*1.15,r*0.72),filter:'url(#fbSh)'}));
    // 占拠リング
    var rr=r*0.92, C=2*Math.PI*rr;
    g.appendChild(el('circle',{'class':'cap-ring',cx:0,cy:0,r:rr,'stroke-dasharray':C.toFixed(1),'stroke-dashoffset':C.toFixed(1),opacity:'0'}));
    // 番号バッジ
    g.appendChild(el('circle',{'class':'badge',cx:0,cy:0,r:r*0.62}));
    var num=el('text',{'class':'num',x:0,y:0,'dominant-baseline':'central','font-size':Math.round(r*0.7)}); num.textContent=f.num; g.appendChild(num);
    // 種別略号(下)
    var ab=el('text',{'class':'lbl',x:0,y:r*0.72+13,'text-anchor':'middle','dominant-baseline':'central','font-size':12,'font-weight':800,fill:'#3a2c34'}); ab.textContent=ty.ab+(f.idx||''); g.appendChild(ab);
    // ロックアイコン
    var lock=el('text',{'class':'lock',x:0,y:0,'text-anchor':'middle','dominant-baseline':'central','font-size':Math.round(r*0.66),opacity:'0'}); lock.textContent='🔒'; g.appendChild(lock);
    host.appendChild(g);

    g.addEventListener('click', function(ev){ ev.stopPropagation(); applyBrush(f.id); positionTip(f.id); });
    g.addEventListener('keydown', function(ev){ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); applyBrush(f.id); } });
    g.addEventListener('mouseenter', function(){ showTip(f.id); });
    g.addEventListener('mouseleave', hideTip);
    g.addEventListener('focus', function(){ showTip(f.id); });
    g.addEventListener('blur', hideTip);
  });
}

function paintFacilities(){
  FACILITIES.forEach(function(f){
    var g=svg.querySelector('.fac[data-id="'+f.id+'"]'); if(!g)return;
    var ty=TYPES[f.type], o=state.owners[f.id], cap=state.capturing[f.id], r=f.size/2;
    g.style.display = isVisible(f)?'':'none';
    var locked=isLocked(f);
    g.classList.toggle('locked', locked);
    g.classList.toggle('dim', !!state.hideCat[ty.cat]);
    g.setAttribute('aria-label', '#'+f.num+' '+tname(f.type,f.idx)+'｜'+(locked?S.tLocked:(cap?(ownerName(cap.by)+' '+S.tCapturing):ownerName(o))));
    var pad=g.querySelector('.pad'), badge=g.querySelector('.badge'), lock=g.querySelector('.lock'), ring=g.querySelector('.cap-ring');
    var shown = cap?cap.by:o;
    pad.setAttribute('fill', ownerFill(shown));
    pad.setAttribute('stroke', ownerColor(shown));
    pad.setAttribute('stroke-width', shown?3.2:2);
    badge.setAttribute('fill', ownerColor(shown));
    badge.setAttribute('stroke','#fff'); badge.setAttribute('stroke-width',2);
    lock.setAttribute('opacity', locked?'1':'0');
    badge.setAttribute('opacity', locked?'0.15':'1');
    g.querySelector('.num').setAttribute('opacity', locked?'0':'1');
    // 占拠リング
    var rr=r*0.92, C=2*Math.PI*rr;
    if(cap){ var p=1-cap.remain/cap.total; ring.setAttribute('opacity','1'); ring.setAttribute('stroke',ownerColor(cap.by)); ring.setAttribute('stroke-dashoffset',(C*(1-p)).toFixed(1)); ring.classList.add('spin'); }
    else if(f.type==='WeaponWorkshop' && o){ // 採集リング
      var hp=Math.min(1,state.harvestProg[f.id]/ty.harvest); ring.classList.remove('spin');
      ring.setAttribute('opacity','1'); ring.setAttribute('stroke', state.harvestDone[f.id]?'#2faa54':'#f59f3a'); ring.setAttribute('stroke-dashoffset',(C*(1-hp)).toFixed(1));
    } else { ring.setAttribute('opacity','0'); ring.classList.remove('spin'); }
  });
}

/* ============ ツールチップ ============ */
var tipFor=null;
function tipHTML(id){
  var f=FAC[id], ty=TYPES[f.type], o=state.owners[id], cap=state.capturing[id];
  var h='<h4>#'+f.num+' '+esc(tname(f.type,f.idx))+'<span class="ty">'+esc(catLabel(ty.cat))+'</span></h4>';
  if(isLocked(f)){ h+='<div class="row"><span>'+S.tLocked+'</span><b>'+S.tUnlock+' '+Math.round(unlockSec(f)/60)+S.tMin+'</b></div>'; }
  if(ty.initial>0||ty.perSec>0){
    h+='<div class="row"><span>'+S.tInitial+'</span><b>'+fmt(ty.initial)+' '+S.pts+'</b></div>';
    h+='<div class="row"><span>'+S.tCont+'</span><b>'+fmt(ty.perSec*60)+' '+S.pts+S.perMin+'</b></div>';
  }
  var bd=buffText(f,o); if(bd) h+='<div class="buff">'+bd+'</div>';
  if(f.type==='WeaponWorkshop'){
    if(o && !cap){ if(state.harvestDone[id]) h+='<div class="row"><span>'+S.tHarvest+'</span><b>'+S.tDone+' '+fmt(ty.yield)+'</b></div>';
      else { var rem=Math.max(0,ty.harvest-state.harvestProg[id]); h+='<div class="row"><span>'+S.tHarvest+'</span><b>'+fmt(ty.yield)+' / '+mmss(rem)+'</b></div>'; } }
    else h+='<div class="row"><span>'+S.tHarvest+'</span><b>'+fmt(ty.yield)+' / 20'+S.tMin+'</b></div>';
  }
  if(cap){ h+='<div class="ownr" style="color:'+ownerColor(cap.by)+'">⏳ '+ownerName(cap.by)+' '+S.tCapturing+' — '+S.tCapLeft+' '+mmss(cap.remain)+'</div>'; }
  else { h+='<div class="ownr" style="color:'+(o?ownerColor(o):'#9aa3c0')+'">● '+ownerName(o)+'</div>'; }
  var hint = isLocked(f)?'' : (state.brush==='Blue'?S.tClickB:state.brush==='Red'?S.tClickR:S.tClickN);
  if(hint) h+='<div class="hint">'+hint+'</div>';
  return h;
}
function buffText(f){
  if(f.type==='Armory') return T('部隊ダメージ+15% / 被ダメージ-15%(加算重複)','Troop dmg +15% / taken −15% (stacks)');
  if(f.type==='MercenaryCamp'){ var tier=state.owners[f.id]&&!state.capturing[f.id]?mercTier(f.id):1; return T('対施設攻撃 +','Siege +')+(tier*10)+'%（'+S.tTier+' '+tier+'/5）'; }
  if(f.type==='BoilerRoom') return T('全施設の占領完了時間 -50%','Capture time −50%');
  if(f.type==='TransitStation') return T('転移クールダウン -50%（12→6分）','Teleport CD −50%');
  if(f.type==='RoyalFoundry') return T('占領中 兵士10%が負傷(デバフ)','While held, 10% injured (debuff)');
  return '';
}
function showTip(id){ tipFor=id; tip.innerHTML=tipHTML(id); tip.setAttribute('aria-hidden','false'); positionTip(id); tip.classList.add('show'); }
function hideTip(){ tipFor=null; tip.classList.remove('show'); tip.setAttribute('aria-hidden','true'); }
function positionTip(id){
  if(tipFor!==id)return; var g=svg.querySelector('.fac[data-id="'+id+'"]'); if(!g)return;
  var nr=g.getBoundingClientRect(), wr=mapwrap.getBoundingClientRect(), tw=tip.offsetWidth, th=tip.offsetHeight;
  var left=nr.left-wr.left+nr.width/2-tw/2, top=nr.top-wr.top-th-10;
  if(top<6) top=nr.bottom-wr.top+10;
  left=Math.max(6,Math.min(left,wr.width-tw-6));
  tip.style.left=left+'px'; tip.style.top=top+'px';
}

/* =====================================================================
   横棒スコアバー(つばぜり合い)
   ===================================================================== */
function renderScoreBar(){
  var host=document.getElementById('scorebar'); if(!host)return;
  var B=state.score.Blue, R=state.score.Red, total=B+R;
  var bluePct = total>0 ? B/total : 0.5;
  var bpm=perMinFor('Blue'), rpm=perMinFor('Red'), net=bpm-rpm;
  var edge=(bluePct*100).toFixed(2);
  var arrow;
  if(Math.abs(net)<1){ arrow='<div class="fb-sb-even" style="left:'+edge+'%">'+S.even+'</div>'; }
  else if(net>0){ arrow='<div class="fb-sb-arrow b" style="left:'+edge+'%"><span class="ar">◀</span>'+fmt(net)+S.perMin+'</div>'; }
  else { arrow='<div class="fb-sb-arrow r" style="left:'+edge+'%">'+fmt(-net)+S.perMin+'<span class="ar">▶</span></div>'; }
  host.innerHTML =
    '<div class="fb-sb-top">'+
      '<div class="s b">'+fmt(B)+'<small>● '+S.blue+' ・ '+countFor('Blue')+S.facHeld+' ・ 🔫'+fmt(state.bullets.Blue)+'</small></div>'+
      '<div class="s r"><small>🔫'+fmt(state.bullets.Red)+' ・ '+countFor('Red')+S.facHeld+' ・ '+S.red+' ●</small>'+fmt(R)+'</div>'+
    '</div>'+
    '<div class="fb-sb-track">'+
      '<div class="fb-sb-blue" style="width:'+edge+'%"></div>'+
      '<div class="fb-sb-red" style="width:'+(100-edge)+'%"></div>'+
      '<div class="fb-sb-edge" style="left:'+edge+'%"></div>'+
      '<div class="fb-clash spark" style="left:'+edge+'%">⚔️</div>'+
      arrow+
    '</div>';
}

/* =====================================================================
   サイドパネル
   ===================================================================== */
function renderSide(){
  var side=document.getElementById('side');
  side.innerHTML =
    card(S.evtTime, eventHTML(), 'fbEvent') +
    card(S.pExit, exitHTML(), 'fbExit') +
    card(S.pBuff, buffHTML(), 'fbBuff') +
    card(S.pList, listHTML(), 'fbList') +
    card(S.pFilter, filterHTML(), 'fbFilter') +
    card(S.pLegend, legendHTML(), 'fbLeg') +
    card(S.pSettings, settingsHTML(), 'fbSet') +
    card(S.pSave, saveHTML(), 'fbSave');
  wireSide();
}
function card(title, body, id){ return '<div class="fb-card" id="'+id+'"><h3>'+title+'</h3>'+body+'</div>'; }

function eventHTML(){
  var ev=CFG.eventMin*60, rem=Math.max(0,ev-state.elapsed);
  var nowPct=Math.min(100,state.elapsed/ev*100);
  var p2=CFG.phase2Min/CFG.eventMin*100, ws=CFG.workshopMin/CFG.eventMin*100;
  var ph = state.elapsed<CFG.phase2Min*60?S.phase1:(state.elapsed<CFG.workshopMin*60?S.phase2:S.phase3);
  return '<div style="display:flex;justify-content:space-between;align-items:baseline">'+
      '<span style="font-size:11px;color:var(--muted);font-weight:700">'+ph+'</span>'+
      '<span style="font-weight:900;font-size:18px;font-variant-numeric:tabular-nums">'+(state.ended?S.evtEnd:(S.evtRemain+' '+mmss(rem)))+'</span></div>'+
    '<div class="fb-timeline"><div class="now" style="width:'+nowPct+'%"></div>'+
      '<div class="pf" style="left:'+p2+'%"></div><div class="pl" style="left:'+p2+'%">'+S.phase2+'</div>'+
      '<div class="pf" style="left:'+ws+'%"></div><div class="pl" style="left:'+ws+'%">'+TYPES.WeaponWorkshop.ab+'</div></div>';
}

function exitHTML(){
  var sf=state.self;
  if(sf.inField){
    return '<div class="fb-exit"><div class="st"><span class="pin" style="background:#2faa54"></span>'+S.inField+'</div>'+
      '<button id="exitBtn">'+S.exitBtn+'</button></div>';
  }
  var ready=sf.reentryRemain<=0;
  return '<div class="fb-exit"><div class="st"><span class="pin" style="background:#e2462f"></span>'+S.outField+'</div>'+
    '<div class="big" style="color:'+(ready?'#2faa54':'#cf2e22')+'">'+(ready?S.canReenter:(S.reentryIn+' '+mmss(sf.reentryRemain)))+'</div>'+
    '<button class="re" id="reBtn"'+(ready?'':' disabled')+'>'+S.reenterBtn+'</button></div>';
}

function buffHTML(){
  var B=buffsFor('Blue'),R=buffsFor('Red');
  function rw(k,bv,rv,cls){ return '<div class="fb-buff '+(cls||'')+'"><span class="k">'+k+'</span><span class="bv"><span class="bb">'+bv+'</span><span class="br">'+rv+'</span></span></div>'; }
  return '<div class="fb-buffs">'+
    rw(S.bTroopDmg,B.troopDamage?pct(B.troopDamage):S.none2,R.troopDamage?pct(R.troopDamage):S.none2)+
    rw(S.bDmgTaken,B.damageTaken?pct(B.damageTaken):S.none2,R.damageTaken?pct(R.damageTaken):S.none2)+
    rw(S.bSiege,B.siege?pct(B.siege):S.none2,R.siege?pct(R.siege):S.none2)+
    rw(S.bCapTime,B.captureTime?S.half:S.none2,R.captureTime?S.half:S.none2)+
    rw(S.bTpCd,B.teleportCd?S.half:S.none2,R.teleportCd?S.half:S.none2)+
    rw(S.bInjured,B.injured?'10%':S.none2,R.injured?'10%':S.none2,'dbf')+'</div>';
}

function listHTML(){
  var rows=FACILITIES.filter(isVisible).map(function(f){
    var ty=TYPES[f.type], o=state.owners[f.id], cap=state.capturing[f.id], locked=isLocked(f);
    var sub = locked?(S.tUnlock+Math.round(unlockSec(f)/60)+S.tMin) : cap?(S.tCapturing+' '+mmss(cap.remain)) : (ty.initial||ty.perSec)?(fmt(ty.perSec*60)+S.perMin) : f.type==='WeaponWorkshop'?(fmt(ty.yield)+'🔫'):catLabel(ty.cat);
    var col=cap?cap.by:o;
    return '<div class="fb-frow '+(col==='Blue'?'b':col==='Red'?'r':'')+(locked?' lk':'')+'" data-id="'+f.id+'" role="button" tabindex="0">'+
      '<span class="dot" style="background:'+ownerColor(col)+'"></span>'+
      '<span class="fn">'+(locked?'🔒 ':'')+'#'+f.num+' '+esc(tname(f.type,f.idx))+'</span>'+
      '<span class="fp">'+sub+'</span></div>';
  }).join('');
  return '<div class="fb-flist">'+rows+'</div>';
}

function filterHTML(){
  var cats=[['prize',S.catPrize],['point',S.catPoint],['buff',S.catBuff],['util',S.catUtil],['res',S.catRes]];
  return '<div class="fb-filt">'+cats.map(function(c){ return '<button class="fb-chip '+(state.hideCat[c[0]]?'':'on')+'" data-cat="'+c[0]+'">'+c[1]+'</button>'; }).join('')+'</div>';
}

function legendHTML(){
  return '<div class="fb-leg">'+
    '<span><span class="sw b"></span>'+S.blue+'</span>'+
    '<span><span class="sw r"></span>'+S.red+'</span>'+
    '<span><span class="sw n"></span>'+S.none+'</span></div>'+
    '<p class="note" style="margin-top:8px">'+S.shapeNote+'</p>';
}

function settingsHTML(){
  function row(id,label,val){ return '<label>'+label+'<input type="number" id="'+id+'" value="'+val+'" min="0"></label>'; }
  return '<div class="fb-set">'+
    row('cfgCap',S.sCapture,CFG.captureSec)+
    row('cfgEvt',S.sEvent,CFG.eventMin)+
    row('cfgPh2',S.sPhase2,CFG.phase2Min)+
    row('cfgWs',S.sWorkshop,CFG.workshopMin)+
    row('cfgRe',S.sReentry,CFG.reentrySec)+
    '</div>';
}

function saveHTML(){
  var list=loadScen(), names=Object.keys(list).sort(function(a,b){return (list[b].ts||0)-(list[a].ts||0);});
  var rows = names.length ? names.map(function(){ return '<div class="fb-scen"><span class="sn"></span><button class="lo">'+S.load+'</button><button class="del">'+S.del+'</button></div>'; }).join('') : '<div class="fb-empty">'+S.noScen+'</div>';
  return '<div class="fb-saverow"><input id="scenName" type="text" maxlength="40" placeholder="'+S.saveName+'"><button class="fb-b on" id="scenSave">'+S.save+'</button></div><div id="scenList">'+rows+'</div>';
}

function wireSide(){
  Array.prototype.forEach.call(document.querySelectorAll('.fb-frow'),function(row){
    row.addEventListener('click',function(){ applyBrush(row.getAttribute('data-id')); });
    row.addEventListener('keydown',function(ev){ if(ev.key==='Enter'||ev.key===' '){ev.preventDefault(); applyBrush(row.getAttribute('data-id'));} });
    row.addEventListener('mouseenter',function(){ showTip(row.getAttribute('data-id')); });
    row.addEventListener('mouseleave',hideTip);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.fb-chip'),function(ch){ ch.addEventListener('click',function(){ var c=ch.getAttribute('data-cat'); state.hideCat[c]=!state.hideCat[c]; renderAll(); }); });
  // 設定
  function bind(id,key,mul){ var e=document.getElementById(id); if(!e)return; e.addEventListener('change',function(){ var v=parseFloat(e.value); if(isNaN(v)||v<0)v=0; CFG[key]=v; renderAll(); }); }
  bind('cfgCap','captureSec'); bind('cfgEvt','eventMin'); bind('cfgPh2','phase2Min'); bind('cfgWs','workshopMin'); bind('cfgRe','reentrySec');
  // 退出
  var eb=document.getElementById('exitBtn'); if(eb)eb.addEventListener('click',function(){ state.self.inField=false; state.self.reentryRemain=CFG.reentrySec; renderSide(); toast(S.toExit); });
  var rb=document.getElementById('reBtn'); if(rb)rb.addEventListener('click',function(){ if(state.self.reentryRemain<=0){ state.self.inField=true; state.self.reentryRemain=0; renderSide(); toast(S.toReenter);} });
  // セーブ
  var nameInp=document.getElementById('scenName'), saveBtn=document.getElementById('scenSave');
  if(saveBtn)saveBtn.addEventListener('click',function(){ saveScen(nameInp.value); });
  if(nameInp)nameInp.addEventListener('keydown',function(ev){ if(ev.key==='Enter')saveScen(nameInp.value); });
  var list=loadScen(), names=Object.keys(list).sort(function(a,b){return (list[b].ts||0)-(list[a].ts||0);});
  var los=document.querySelectorAll('#scenList .lo'), dels=document.querySelectorAll('#scenList .del'), sns=document.querySelectorAll('#scenList .sn');
  for(var i=0;i<sns.length;i++){ sns[i].textContent=names[i]||''; (function(n,lo,de){ if(lo)lo.addEventListener('click',function(){loadOne(n);}); if(de)de.addEventListener('click',function(){delScen(n);}); })(names[i],los[i],dels[i]); }
}

/* ============ 軽量更新(再生中) ============ */
function tickUI(){
  renderScoreBar();
  var ev=document.getElementById('fbEvent'); if(ev)ev.innerHTML='<h3>'+S.evtTime+'</h3>'+eventHTML();
  var ex=document.getElementById('fbExit'); if(ex)ex.innerHTML='<h3>'+S.pExit+'</h3>'+exitHTML(); wireExit();
  var bf=document.getElementById('fbBuff'); if(bf)bf.innerHTML='<h3>'+S.pBuff+'</h3>'+buffHTML();
  var ls=document.getElementById('fbList'); if(ls){ ls.innerHTML='<h3>'+S.pList+'</h3>'+listHTML(); wireList(); }
  paintFacilities();
  if(tipFor) showTip(tipFor);
}
function wireExit(){ var eb=document.getElementById('exitBtn'); if(eb)eb.addEventListener('click',function(){ state.self.inField=false; state.self.reentryRemain=CFG.reentrySec; renderSide(); toast(S.toExit); }); var rb=document.getElementById('reBtn'); if(rb)rb.addEventListener('click',function(){ if(state.self.reentryRemain<=0){ state.self.inField=true; renderSide(); toast(S.toReenter);} }); }
function wireList(){ Array.prototype.forEach.call(document.querySelectorAll('.fb-frow'),function(row){ row.addEventListener('click',function(){ applyBrush(row.getAttribute('data-id')); }); row.addEventListener('mouseenter',function(){ showTip(row.getAttribute('data-id')); }); row.addEventListener('mouseleave',hideTip); }); }

function renderAll(){ renderScoreBar(); renderSide(); paintFacilities(); updHistBtns(); }

/* =====================================================================
   ツールバー
   ===================================================================== */
function svgi(name){
  var p={play:'<path d="M6 4l12 8-12 8z"/>',pause:'<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>',reset:'<path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/>',undo:'<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 010 10h-3"/>',redo:'<path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 000 10h3"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',dl:'<path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M5 20h14"/>',up:'<path d="M12 20V9"/><path d="M8 13l4-4 4 4"/><path d="M5 4h14"/>'};
  return '<svg class="fb-ic" viewBox="0 0 24 24">'+(p[name]||'')+'</svg>';
}
function buildBar(){
  var bar=document.getElementById('bar');
  bar.innerHTML =
    '<div class="fb-grp"><span class="lbl">'+S.grpBrush+'</span>'+
      '<div class="fb-brush">'+
        '<button class="b'+(state.brush==='Blue'?' on b':'')+'" data-br="Blue"><span class="d" style="background:#2256c8"></span>'+S.placeB+'</button>'+
        '<button class="r'+(state.brush==='Red'?' on r':'')+'" data-br="Red"><span class="d" style="background:#cf2e22"></span>'+S.placeR+'</button>'+
        '<button class="n'+(state.brush==='clear'?' on n':'')+'" data-br="clear"><span class="d" style="background:#9aa3b5"></span>'+S.placeN+'</button>'+
      '</div></div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpSim+'</span>'+
      '<button class="fb-b" id="bPlay">'+svgi('play')+'<span id="playT">'+S.play+'</span></button>'+
      '<select class="fb-b" id="speed" aria-label="'+S.speed+'"><option value="1">1×</option><option value="5" selected>5×</option><option value="30">30×</option><option value="60">60×</option></select>'+
      '<button class="fb-b" id="bClock">'+svgi('reset')+S.resetClock+'</button>'+
      '<label class="fb-b" style="cursor:pointer"><input type="checkbox" id="capTimed" checked style="margin-right:5px">'+S.capToggle+'</label>'+
    '</div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpBulk+'</span>'+
      '<button class="fb-b blue" id="bAllB">'+S.allB+'</button>'+
      '<button class="fb-b red" id="bAllR">'+S.allR+'</button>'+
      '<button class="fb-b" id="bClear">'+svgi('x')+S.clearAll+'</button>'+
    '</div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpEdit+'</span>'+
      '<button class="fb-b" id="bUndo" disabled>'+svgi('undo')+S.undo+'</button>'+
      '<button class="fb-b" id="bRedo" disabled>'+svgi('redo')+S.redo+'</button>'+
    '</div>'+
    '<div class="fb-grp"><span class="lbl">'+S.grpData+'</span>'+
      '<button class="fb-b" id="bExp">'+svgi('dl')+S.exp+'</button>'+
      '<button class="fb-b" id="bImp">'+svgi('up')+S.imp+'</button>'+
    '</div>';

  Array.prototype.forEach.call(document.querySelectorAll('.fb-brush button'),function(b){ b.addEventListener('click',function(){ state.brush=b.getAttribute('data-br'); buildBar(); if(tipFor)showTip(tipFor); }); });
  document.getElementById('bPlay').addEventListener('click',togglePlay);
  document.getElementById('speed').addEventListener('change',function(e){ state.speed=parseInt(e.target.value,10)||5; });
  document.getElementById('capTimed').checked=state.capTimed;
  document.getElementById('capTimed').addEventListener('change',function(e){ state.capTimed=e.target.checked; });
  document.getElementById('bClock').addEventListener('click',resetClock);
  document.getElementById('bAllB').addEventListener('click',function(){ bulkAll('Blue'); track('fb_bulk',{op:'allB'}); });
  document.getElementById('bAllR').addEventListener('click',function(){ bulkAll('Red'); track('fb_bulk',{op:'allR'}); });
  document.getElementById('bClear').addEventListener('click',clearAll);
  document.getElementById('bUndo').addEventListener('click',undo);
  document.getElementById('bRedo').addEventListener('click',redo);
  document.getElementById('bExp').addEventListener('click',exportJSON);
  document.getElementById('bImp').addEventListener('click',function(){ document.getElementById('importFile').click(); });
  document.getElementById('importFile').addEventListener('change',importJSON);
  updHistBtns();
}

/* ============ 再生・時計 ============ */
var timer=null;
function togglePlay(){ if(state.ended)return; state.playing=!state.playing; var b=document.getElementById('bPlay'); b.innerHTML=(state.playing?svgi('pause')+'<span id="playT">'+S.pause+'</span>':svgi('play')+'<span id="playT">'+S.play+'</span>'); b.classList.toggle('on',state.playing); }
function resetClock(){ state.elapsed=0; state.playing=false; state.ended=false; var b=document.getElementById('bPlay'); if(b){b.classList.remove('on'); b.innerHTML=svgi('play')+'<span id="playT">'+S.play+'</span>';}
  FACILITIES.forEach(function(f){ state.occSec[f.id]=0; if(state.capturing[f.id])state.capturing[f.id]=null; }); state.self={inField:true,reentryRemain:0}; renderAll(); paintFacilities(); }
function step(){
  if(!state.playing||state.ended)return;
  var dt=0.1*state.speed; state.elapsed+=dt;
  // 占拠の進行
  FACILITIES.forEach(function(f){ var cap=state.capturing[f.id]; if(cap){ cap.remain-=dt; if(cap.remain<=0) finalizeCapture(f.id,cap.by); } });
  // 生産・採集
  FACILITIES.forEach(function(f){ var o=state.owners[f.id]; if(!o||state.capturing[f.id])return; var ty=TYPES[f.type];
    state.occSec[f.id]+=dt;
    if(ty.perSec>0) state.score[o]+=ty.perSec*dt;
    if(f.type==='WeaponWorkshop' && !state.harvestDone[f.id]){ state.harvestProg[f.id]+=dt; if(state.harvestProg[f.id]>=ty.harvest){ state.harvestProg[f.id]=ty.harvest; state.harvestDone[f.id]=true; state.bullets[o]+=ty.yield; } }
  });
  // 一時退出CD
  if(!state.self.inField && state.self.reentryRemain>0){ state.self.reentryRemain=Math.max(0,state.self.reentryRemain-dt); }
  // イベント終了
  if(state.elapsed>=CFG.eventMin*60){ state.elapsed=CFG.eventMin*60; state.ended=true; state.playing=false; var b=document.getElementById('bPlay'); if(b){b.classList.remove('on'); b.innerHTML=svgi('play')+'<span id="playT">'+S.play+'</span>';} toast(S.toEnd); renderSide(); }
  tickUI();
}

/* ============ パン・ズーム ============ */
function applyView(){ var vp=document.getElementById('vp'); if(vp)vp.setAttribute('transform','translate('+state.view.tx+' '+state.view.ty+') scale('+state.view.scale+')'); }
function svgPt(cx,cy){ var rc=svg.getBoundingClientRect(); return {x:(cx-rc.left)/rc.width*1000,y:(cy-rc.top)/rc.height*788}; }
function zoomAt(cx,cy,fac){ var p=svgPt(cx,cy),ns=Math.max(0.6,Math.min(3,state.view.scale*fac)); var wx=(p.x-state.view.tx)/state.view.scale,wy=(p.y-state.view.ty)/state.view.scale; state.view.scale=ns; state.view.tx=p.x-wx*ns; state.view.ty=p.y-wy*ns; applyView(); if(tipFor)positionTip(tipFor); }
function setupPanZoom(){
  document.getElementById('zIn').addEventListener('click',function(){ var rc=svg.getBoundingClientRect(); zoomAt(rc.left+rc.width/2,rc.top+rc.height/2,1.25); });
  document.getElementById('zOut').addEventListener('click',function(){ var rc=svg.getBoundingClientRect(); zoomAt(rc.left+rc.width/2,rc.top+rc.height/2,0.8); });
  document.getElementById('zRst').addEventListener('click',function(){ state.view={scale:1,tx:0,ty:0}; applyView(); });
  svg.addEventListener('wheel',function(e){ e.preventDefault(); zoomAt(e.clientX,e.clientY,e.deltaY<0?1.12:0.9); },{passive:false});
  var drag=null;
  svg.addEventListener('pointerdown',function(e){ if(e.target.closest&&e.target.closest('.fac'))return; drag={x:e.clientX,y:e.clientY,tx:state.view.tx,ty:state.view.ty}; svg.classList.add('drag'); svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove',function(e){ if(!drag)return; var rc=svg.getBoundingClientRect(); state.view.tx=drag.tx+(e.clientX-drag.x)/rc.width*1000; state.view.ty=drag.ty+(e.clientY-drag.y)/rc.height*788; applyView(); });
  function end(){ drag=null; svg.classList.remove('drag'); }
  svg.addEventListener('pointerup',end); svg.addEventListener('pointercancel',end);
}

/* ============ シナリオ ============ */
var SKEY='wos_foundry_scen_v2';
function loadScen(){ try{ return JSON.parse(localStorage.getItem(SKEY)||'{}')||{}; }catch(e){ return {}; } }
function writeScen(o){ try{ localStorage.setItem(SKEY,JSON.stringify(o)); }catch(e){} }
function saveScen(name){ name=(name||'').trim()||T('シナリオ','Scenario')+' '+new Date().toLocaleString(); var all=loadScen(); all[name]={owners:JSON.parse(JSON.stringify(state.owners)),ts:Date.now()}; writeScen(all); renderSide(); toast(S.toSaved); }
function applyOwnersSnapshot(owners){ state.score={Blue:0,Red:0}; state.bullets={Blue:0,Red:0}; FACILITIES.forEach(function(f){ state.occSec[f.id]=0; state.capturing[f.id]=null; state.harvestProg[f.id]=0; state.harvestDone[f.id]=false; state.owners[f.id]=null; }); FACILITIES.forEach(function(f){ var o=owners?owners[f.id]:null; if(o==='Blue'||o==='Red') finalizeCapture(f.id,o); }); }
function loadOne(name){ var all=loadScen(),s=all[name]; if(!s)return; pushHistory(); applyOwnersSnapshot(s.owners); renderAll(); toast(S.toLoaded); }
function delScen(name){ var all=loadScen(); delete all[name]; writeScen(all); renderSide(); }
function exportJSON(){ var data={app:'foundry-battle',v:2,exportedAt:new Date().toISOString(),owners:state.owners,elapsed:Math.round(state.elapsed),cfg:CFG,score:{Blue:Math.round(state.score.Blue),Red:Math.round(state.score.Red)},bullets:state.bullets}; var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='foundry-battle-scenario.json'; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},100); toast(S.toExp); }
function importJSON(e){ var file=e.target.files&&e.target.files[0]; if(!file)return; var rd=new FileReader(); rd.onload=function(){ try{ var d=JSON.parse(rd.result); if(!d||!d.owners)throw 0; pushHistory(); if(d.cfg){ for(var k in CFG) if(d.cfg[k]!=null)CFG[k]=d.cfg[k]; } applyOwnersSnapshot(d.owners); renderAll(); toast(S.toLoaded); }catch(err){ toast(S.toImpErr); } e.target.value=''; }; rd.readAsText(file); }

/* ============ その他 ============ */
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
var toastTimer=null;
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove('show');},1900); }
function track(a,p){ try{ if(window.gtag)gtag('event',a,Object.assign({tool:'foundry_battle'},p||{})); }catch(e){} }

/* ============ 静的テキスト ============ */
function mappingTable(){
  return FACILITIES.map(function(f){ return '#'+f.num+'='+tname(f.type,f.idx); }).join(' / ');
}
function buildStatic(){
  document.getElementById('h1').innerHTML=S.h1a+' <span class="acc">'+S.h1b+'</span>';
  document.getElementById('tag').textContent=S.tag;
  document.getElementById('lead').innerHTML=S.lead;
  document.getElementById('hHelp').textContent=S.hHelp;
  document.getElementById('hData').textContent=S.hData;
  document.getElementById('dataNote').textContent=
    T('番号→施設の対応(仮): ','No.→facility (proposed): ')+mappingTable()+
    T('。数値は app.js 冒頭の CONFIG / TYPES、配置は FACILITIES で調整できます。占拠時間・イベント時間・再入場CDは右の「詳細設定」からも変更可能。試算は理解補助用です。',
      '. Edit CONFIG/TYPES and FACILITIES at the top of app.js to adjust. Capture/event/re-entry times are also editable in Settings. Estimates are for learning.');
  document.getElementById('helpgrid').innerHTML=[['help1t','help1'],['help2t','help2'],['help3t','help3'],['help4t','help4']].map(function(p){ return '<div class="fb-help"><b>'+S[p[0]]+'</b><br>'+S[p[1]]+'</div>'; }).join('');
  document.getElementById('relbar').innerHTML=
    '<a href="../bear-hunt/index.html">'+T('→ 熊狩シミュレーター','→ Bear Hunt')+'</a>'+
    '<a href="../troop-ratio/index.html">'+T('→ 兵士比率シミュ','→ Troop Ratio')+'</a>'+
    '<a href="../king-castle/index.html">'+T('→ 王城戦','→ Castle Battle')+'</a>'+
    '<a href="../../guides/bear-hunt-guide.html">'+T('→ 攻略ガイド','→ Guides')+'</a>';
  if(EN){ document.getElementById('htmlroot').lang='en'; document.title='Foundry Battle Map Simulator | Whiteout Tools Lab';
    document.getElementById('crumb').innerHTML='<a href="../../index.html?lang=en">Home</a> &gt; Foundry Battle Simulator';
    var z=document.getElementById('zIn'); if(z){z.setAttribute('aria-label','Zoom in'); document.getElementById('zOut').setAttribute('aria-label','Zoom out'); document.getElementById('zRst').setAttribute('aria-label','Reset view');}
  }
}

/* ============ 初期化 ============ */
function init(){
  buildStatic(); buildMapStatic(); buildFacilities(); buildBar(); setupPanZoom(); renderAll(); applyView();
  timer=setInterval(step,100);
  window.addEventListener('resize',function(){ if(tipFor)positionTip(tipFor); });
}
if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
