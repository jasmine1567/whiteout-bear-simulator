/* =====================================================================
   兵器工場争奪戦 フィールド作戦シミュレータ  app.js  (v3: デザイン刷新)
   - Claude Design の「領地戦シミュレーター」を当サイト規約(単一ファイル/素のJS)へ移植
   - チーム編成 → フェーズ別ターゲット割当(筆ブラシ) → 移動矢印つき再生 → 集合タイマー
   - 施設データ(ポイント毎分・バフ・開放時刻)は添付仕様(docx)に準拠
   - 保存: localStorage  /  施設数値は下記 BUILDINGS / BUFF を編集すれば調整可能
   ===================================================================== */
(function(){
"use strict";
var T = window.t || function(a){return a;};
var EN = (window.WOS_LANG||'ja')==='en';

/* ---------- 多言語UI ---------- */
var S = {
  h1a:T('兵器工場争奪戦','Foundry Battle'), h1b:T('フィールド作戦シミュレータ','Field Op Planner'),
  tag:T('フィールド作戦ツール','Field Op Tool'),
  title:T('領地戦シミュレーター','Field Op Simulator'), sub:T('フィールド占領プランニング・ツール','Field control planning tool'),
  lead:T('チームを編成し、<b>どのチームがどの拠点を狙うか</b>をフェーズ(時間軸)ごとに割り当てて作戦を作ります。フェーズを再生すると<b>移動矢印</b>でチームの動きが見え、各フェーズの占領状況から<b>毎分ポイントとバフ</b>を集計します。集合タイマーつき。',
            'Build teams and assign <b>which team targets which point</b> per phase. Play the phases to see <b>movement arrows</b>, and read each team\u2019s <b>points/min and buffs</b> from the current occupation. Includes a rally timer.'),
  rally:T('集合まで','Rally in'), start:T('開始','Start'), stop:T('停止','Stop'), reset:T('リセット','Reset'),
  play:T('再生','Play'), playing:T('停止','Stop'),
  safeL:T('自軍セーフ','Ally safe'), safeR:T('敵軍セーフ','Enemy safe'), move:T('移動','Move'),
  brush:T('筆','Brush'), brushOn:T('割当モード','Brush'),
  pTeams:T('チーム編成','Teams'), pDetail:T('拠点の詳細','Building'), pPhase:T('作戦フェーズ','Phases'), pTotal:T('ポイント/バフ集計','Points & buffs'),
  add:T('＋追加','＋Add'), team:T('チーム','Team'),
  detailHint:T('マップの拠点をクリックすると、ここに詳細と「占領チーム」の割当が表示されます。チーム行の筆を選ぶと、クリックで一括割当できます。','Click a building on the map to see its details and assign a holding team here. Pick a team\u2019s brush to assign by clicking.'),
  holder:T('占領チーム','Holding team'), unassign:T('未占領に','Clear'),
  occ:T('占領数','Held'), ptsMin:T('pt/分','pt/min'), heldNone:T('未占領','None'),
  phName:T('フェーズ名','Phase'), phTime:T('時刻','Time'), phNote:T('メモ','Notes'),
  dup:T('複製','Duplicate'), del:T('削除','Delete'), addPhase:T('＋フェーズ追加','＋Add phase'),
  resetAll:T('すべてリセット','Reset all'), resetConfirm:T('すべての編成・作戦をリセットします。よろしいですか？','Reset all teams and phases?'),
  open15:T('15分後開放','Opens +15m'), open20:T('20分後出現','Spawns +20m'), random:T('ランダム出現','Random spawn'),
  buff:T('バフ','Buff'), pt:T('ポイント','Points'),
  bAtk:T('攻撃','ATK'), bDef:T('被ダメ','DMG taken'), bDebuff:T('傭兵デバフ','Merc debuff'), bTp:T('転移CD','Teleport'), bCap:T('占領時間','Capture'), bInj:T('負傷','Injury'),
  setTimer:T('集合まで(mm:ss)を入力','Rally time (mm:ss)'),
  hHelp:T('使い方','How to use'),
  help1t:T('① チームを編成','① Build teams'), help1:T('右上「チーム編成」で色と名前を設定。「＋追加」でチームを増やせます。','Set color & name in Teams. Add more with ＋Add.'),
  help2t:T('② 拠点を割り当て','② Assign buildings'), help2:T('チーム行の<b>筆</b>を選び、マップの拠点をクリックで一括割当(再クリックで解除)。拠点クリックで詳細から個別割当も可。','Pick a team\u2019s <b>brush</b> and click buildings to assign (click again to clear). Or assign from the detail panel.'),
  help3t:T('③ フェーズで時間を刻む','③ Phases over time'), help3:T('「作戦フェーズ」で集合→第1波→…と段階を作成。各フェーズに占領状況を割当てると、<b>再生</b>で移動矢印が流れます。','Create phases (Rally → Wave 1 …). Assign per phase, then <b>Play</b> to animate movement arrows.'),
  help4t:T('④ ポイント/バフを確認','④ Read points & buffs'), help4:T('各フェーズの占領から、チームごとの<b>毎分ポイント</b>とバフを自動集計。王室+1800/試験場+1200/修理+600/その他+240(毎分)。','Each phase auto-totals <b>points/min</b> & buffs per team. Royal +1800 / Test +1200 / Repair +600 / others +240 per min.'),
  hData:T('施設データ(仕様準拠)','Facility data'),
  toReset:T('初期状態に戻しました','Reset to defaults'), toSaved:T('保存しました','Saved')
};

/* ---------- バフ定義(docx準拠) ---------- */
var BUFF = {
  injury: {ja:'駐屯兵10%が2分毎に負傷(自軍/敵軍とも)', en:'10% of troops injured every 2 min'},
  armory: {ja:'味方部隊 攻撃+15% / 被ダメ-15%(占拠中持続)', en:'Allied ATK +15% / DMG taken −15%'},
  merc:   {ja:'敵占領施設へ傭兵デバフ(敵 攻撃/防御 -10〜50%)', en:'Merc debuff on enemy buildings (−10〜50%)'},
  transit:{ja:'転移クールタイム -50%(12→6分)', en:'Teleport CD −50% (12→6 min)'},
  boiler: {ja:'占領時間 -50%(2→1分)', en:'Capture time −50% (2→1 min)'}
};

/* ---------- 拠点データ(座標=デザイン / 数値=docx) ---------- */
var BUILDINGS = [
  {id:1, num:'1', short:T('王室','RF'),  ja:'王室兵器工場',  en:'Royal Foundry',  role:'フィールド中央の最重要拠点。全拠点の司令塔であり、最終目標。', x:48,y:48, big:true, pts:1800, buff:'injury', openMin:15, cat:'prize'},
  {id:2, num:'2', short:T('試1','T1'),  ja:'第1武器試験場', en:'Test Field 1',  role:'新型兵器を試験する施設。確保で兵器性能が向上。', x:27,y:40, pts:1200, cat:'point'},
  {id:3, num:'3', short:T('試2','T2'),  ja:'第2武器試験場', en:'Test Field 2',  role:'新型兵器を試験する施設。確保で兵器性能が向上。', x:69,y:59, pts:1200, cat:'point'},
  {id:4, num:'4', short:T('修1','R1'),  ja:'第1武器修理工場',en:'Repair Factory 1',role:'損傷した兵器を修理・補給。前線維持に重要。', x:20,y:56, pts:600, cat:'point'},
  {id:5, num:'5', short:T('修2','R2'),  ja:'第2武器修理工場',en:'Repair Factory 2',role:'損傷した兵器を修理・補給。前線維持に重要。', x:77,y:47, pts:600, cat:'point'},
  {id:6, num:'6', short:T('修3','R3'),  ja:'第3武器修理工場',en:'Repair Factory 3',role:'損傷した兵器を修理・補給。前線維持に重要。', x:33,y:83, pts:600, cat:'point'},
  {id:7, num:'7', short:T('修4','R4'),  ja:'第4武器修理工場',en:'Repair Factory 4',role:'損傷した兵器を修理・補給。前線維持に重要。', x:59,y:14, pts:600, cat:'point'},
  {id:8, num:'8', short:T('倉庫','AR'), ja:'兵器倉庫',      en:'Armory',         role:'兵器を貯蔵する補給拠点。物資供給の要。', x:47,y:75, pts:240, buff:'armory', openMin:15, cat:'buff'},
  {id:9, num:'9', short:T('傭兵','MC'), ja:'傭兵野営地',    en:'Mercenary Camp', role:'傭兵の増援拠点。確保で敵施設へデバフ。', x:47,y:27, pts:240, buff:'merc', openMin:15, cat:'buff'},
  {id:10,num:'10',short:T('中継','TS'), ja:'中継所',        en:'Transit Station',role:'補給線を中継する拠点。後方支援を担う。', x:60,y:83, pts:240, buff:'transit', cat:'util'},
  {id:11,num:'11',short:T('蒸気','SB'), ja:'スチームボイラー',en:'Steam Boiler', role:'フィールド全体へ動力を供給。占領時間を短縮。', x:33,y:14, pts:240, buff:'boiler', cat:'util'},
  {id:12,num:T('工','W'),short:T('工房','WS'),ja:'武器工房(採集所)',en:'Weapon Workshop',role:'弾薬採集専用。20分後にランダム出現。占拠で総量4800を20分採集。', x:64,y:34, pts:240, openMin:20, random:true, cat:'res'}
];
var BMAP={}; BUILDINGS.forEach(function(b){ BMAP[b.id]=b; });
function bname(b){ return EN?b.en:b.ja; }

var PALETTE=['#2DD4BF','#F4A83A','#A78BFA','#60A5FA','#F472B6','#A3E635','#FB7185','#38BDF8','#FBBF24','#34D399'];

/* ---------- 状態 ---------- */
var KEY='wos_fieldsim_v1';
function defaults(){
  return {
    teams:[ {id:'t1',name:T('Aチーム','Team A'),color:'#2DD4BF'}, {id:'t2',name:T('Bチーム','Team B'),color:'#F4A83A'}, {id:'t3',name:T('Cチーム','Team C'),color:'#A78BFA'} ],
    phases:[
      {id:'p1',name:T('集合','Rally'),  time:'20:00', notes:T('両サイドのセーフゾーン付近に集合し、開始の合図を待つ。','Gather near both safe zones.'), assign:{}},
      {id:'p2',name:T('第1波','Wave 1'),time:'20:05', notes:T('外周の修理工場・試験場を一斉制圧。A=左翼、B=右翼、C=試験場。','Seize outer repair & test fields.'), assign:{'11':'t1','4':'t1','7':'t2','5':'t2','2':'t3','3':'t3'}},
      {id:'p3',name:T('第2波','Wave 2'),time:'20:12', notes:T('内側へ前進。傭兵野営地と倉庫を確保し中央へ圧力。','Push inward; take camp & armory.'), assign:{'9':'t1','2':'t1','8':'t2','10':'t2','3':'t3','5':'t3'}},
      {id:'p4',name:T('総攻撃','Assault'),time:'20:20',notes:T('全チームで王室兵器工場へ集中。Aが本丸、B/Cは隣接拠点から支援。','All-in on the Royal Foundry.'), assign:{'1':'t1','9':'t2','8':'t3'}}
    ],
    activePhaseId:'p2', selectedBuildingId:null, brushTeamId:null, showArrows:true, playing:false,
    timer:{remaining:1200, initial:1200, running:false}
  };
}
function load(){ try{ var r=localStorage.getItem(KEY); if(r){ var s=JSON.parse(r); return Object.assign(defaults(), s, {playing:false, selectedBuildingId:null}); } }catch(e){} return defaults(); }
var state=load();
function save(){ try{ var s=state; localStorage.setItem(KEY, JSON.stringify({teams:s.teams,phases:s.phases,activePhaseId:s.activePhaseId,brushTeamId:s.brushTeamId,showArrows:s.showArrows,timer:s.timer})); }catch(e){} }

/* ---------- ヘルパー ---------- */
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmt(sec){ sec=Math.max(0,sec|0); var m=Math.floor(sec/60),s=sec%60; return (m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
function activePhase(){ return state.phases.find(function(p){return p.id===state.activePhaseId;})||state.phases[0]; }
function teamById(id){ return state.teams.find(function(t){return t.id===id;})||null; }
function holderOf(bid){ var ap=activePhase(); var tid=ap.assign[String(bid)]; return tid?teamById(tid):null; }
function $(id){ return document.getElementById(id); }
var toastTimer=null;
function toast(m){ var t=$('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove('show');},1800); }
function track(a,p){ try{ if(window.gtag)gtag('event',a,Object.assign({tool:'foundry_battle'},p||{})); }catch(e){} }

/* =====================================================================
   描画
   ===================================================================== */
function render(){ renderHeader(); renderMap(); renderPanel(); save(); }

function renderHeader(){
  var ap=activePhase(), idx=state.phases.findIndex(function(p){return p.id===ap.id;});
  $('phName').textContent=ap.name||'—';
  $('phIdx').textContent=(idx+1)+'/'+state.phases.length+(ap.time?(' · '+ap.time):'');
  $('phPlay').textContent=state.playing?S.playing:S.play;
  var tm=state.timer; var v=$('tmVal'); v.textContent=fmt(tm.remaining); v.classList.toggle('run',tm.running);
  $('tmToggle').textContent=tm.running?S.stop:S.start;
}

function renderMap(){
  // 移動矢印
  var arr=$('arrows'); arr.innerHTML='';
  computeArrows().forEach(function(a){
    var line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',a.x1); line.setAttribute('y1',a.y1); line.setAttribute('x2',a.x2); line.setAttribute('y2',a.y2);
    line.setAttribute('stroke',a.color); line.setAttribute('stroke-width','0.9'); line.setAttribute('stroke-linecap','round');
    line.setAttribute('stroke-dasharray','2 1.6'); line.setAttribute('vector-effect','non-scaling-stroke');
    line.style.animation='fsflow .9s linear infinite';
    var dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',a.x2); dot.setAttribute('cy',a.y2); dot.setAttribute('r','1.5'); dot.setAttribute('fill',a.color);
    arr.appendChild(line); arr.appendChild(dot);
  });
  // 拠点タイル
  var host=$('tiles'); host.innerHTML='';
  BUILDINGS.forEach(function(b){
    var holder=holderOf(b.id), sel=state.selectedBuildingId===b.id;
    var div=document.createElement('div');
    div.className='fs-tile'+(b.big?' big':'')+(sel?' sel':'');
    div.style.left=b.x+'%'; div.style.top=b.y+'%';
    div.setAttribute('role','button'); div.setAttribute('tabindex','0');
    div.setAttribute('aria-label','#'+b.num+' '+bname(b)+(holder?('｜'+holder.name):''));
    var bc = holder?holder.color:'#9fb6c8';
    var tag = b.openMin===15?('<span class="tag">'+S.open15+'</span>') : b.random?('<span class="tag">'+S.open20+'</span>') : '';
    div.innerHTML =
      '<div class="fs-dia" style="border-color:'+bc+'">'+
        '<div class="fs-occ" style="background:'+bc+';opacity:'+(holder?'':'0')+'"></div>'+
        '<div class="bld"></div>'+
        '<div class="fs-badge">'+esc(b.num)+'</div>'+
      '</div>'+ tag +
      '<div class="fs-pill">'+esc(b.short)+'</div>';
    div.addEventListener('click',function(){ onBuildingClick(b.id); });
    div.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onBuildingClick(b.id);} });
    host.appendChild(div);
  });
  // オーバーレイ
  var ap=activePhase(); var held=Object.keys(ap.assign).length;
  $('ovPhase').textContent=ap.name||'—';
  $('ovInfo').textContent=(ap.time?ap.time+' · ':'')+held+' '+S.occ;
  $('arrToggle').classList.toggle('on',state.showArrows);
  // 筆インジケータ
  var bt=teamById(state.brushTeamId), bi=$('brushInd');
  bi.innerHTML = bt ? '<div class="fs-brush"><span class="dot" style="background:'+bt.color+'"></span>'+S.brushOn+'：'+esc(bt.name)+'<button id="brOff">×</button></div>' : '';
  if(bt){ var off=$('brOff'); if(off)off.addEventListener('click',function(e){ e.stopPropagation(); state.brushTeamId=null; render(); }); }
}

function computeArrows(){
  if(!state.showArrows) return [];
  var i=state.phases.findIndex(function(p){return p.id===state.activePhaseId;}); if(i<=0) return [];
  var cur=state.phases[i].assign, prev=state.phases[i-1].assign, out=[];
  state.teams.forEach(function(t){
    var prevB=Object.keys(prev).filter(function(k){return prev[k]===t.id;}).map(Number);
    var curB=Object.keys(cur).filter(function(k){return cur[k]===t.id;}).map(Number);
    var common={}; prevB.forEach(function(b){ if(curB.indexOf(b)>=0)common[b]=1; });
    var from=prevB.filter(function(b){return !common[b];}), to=curB.filter(function(b){return !common[b];});
    var used={};
    to.forEach(function(tb){ var best=-1,bd=1e9;
      from.forEach(function(fb,fi){ if(used[fi])return; var dx=BMAP[fb].x-BMAP[tb].x,dy=BMAP[fb].y-BMAP[tb].y,d=dx*dx+dy*dy; if(d<bd){bd=d;best=fi;} });
      if(best>=0){ used[best]=1; var fb=from[best]; out.push({x1:BMAP[fb].x,y1:BMAP[fb].y,x2:BMAP[tb].x,y2:BMAP[tb].y,color:t.color}); }
    });
  });
  return out;
}

/* ---------- サイドパネル ---------- */
function renderPanel(){
  var p=$('panel');
  p.innerHTML =
    cardTeams() + cardDetail() + cardPhases() + cardTotals() +
    '<button class="fs-reset" id="resetAll">'+S.resetAll+'</button>';
  wirePanel();
}

function cardTeams(){
  var rows=state.teams.map(function(t){
    var cnt=Object.values(activePhase().assign).filter(function(x){return x===t.id;}).length;
    return '<div class="fs-team" data-id="'+t.id+'">'+
      '<input type="color" value="'+t.color+'" class="tc">'+
      '<input type="text" value="'+esc(t.name)+'" class="tn" maxlength="20">'+
      '<span class="cnt">'+cnt+'</span>'+
      '<button class="bru'+(state.brushTeamId===t.id?' on':'')+'" title="'+S.brush+'">🖌</button>'+
      '<button class="del" title="'+S.del+'">×</button>'+
    '</div>';
  }).join('');
  return '<div class="fs-card"><h3>'+S.pTeams+'<span class="add" id="addTeam">'+S.add+'</span></h3>'+rows+'</div>';
}

function cardDetail(){
  var b=state.selectedBuildingId?BMAP[state.selectedBuildingId]:null;
  if(!b) return '<div class="fs-card" id="detailCard"><h3>'+S.pDetail+'</h3><div class="fs-hint">'+S.detailHint+'</div></div>';
  var holder=holderOf(b.id);
  var meta='<span class="m">'+S.pt+' +'+b.pts+'/'+T('分','min')+'</span>';
  if(b.buff) meta+='<span class="m buff">'+esc((EN?BUFF[b.buff].en:BUFF[b.buff].ja))+'</span>';
  if(b.openMin===15) meta+='<span class="m">'+S.open15+'</span>';
  if(b.random) meta+='<span class="m">'+S.open20+'・'+S.random+'</span>';
  if(b.id===12) meta+='<span class="m">'+T('総量4800/20分','4800 over 20m')+'</span>';
  var chips=state.teams.map(function(t){
    var on=holder&&holder.id===t.id;
    return '<button class="fs-chip'+(on?' on':'')+'" data-team="'+t.id+'" style="'+(on?('border-color:'+t.color+';box-shadow:0 0 0 2px '+t.color+'33'):'')+'"><span class="d" style="background:'+t.color+'"></span>'+esc(t.name)+'</button>';
  }).join('');
  return '<div class="fs-card" id="detailCard"><h3>'+S.pDetail+'</h3><div class="fs-det">'+
    '<div class="hd"><div class="nb">'+esc(b.num)+'</div><div class="nm">'+esc(bname(b))+'</div></div>'+
    '<div class="role">'+esc(b.role)+'</div>'+
    '<div class="meta">'+meta+'</div>'+
    '<div style="font:700 11px \'Noto Sans JP\';color:var(--fmut);margin-bottom:6px">'+S.holder+'</div>'+
    '<div class="fs-chips">'+chips+'<button class="fs-chip none" data-team="">'+S.unassign+'</button></div>'+
  '</div></div>';
}

function cardPhases(){
  var ap=activePhase();
  var list=state.phases.map(function(p){
    return '<div class="fs-prow'+(p.id===ap.id?' on':'')+'" data-id="'+p.id+'"><span class="pn">'+esc(p.name)+'</span><span class="pt">'+esc(p.time||'')+'</span></div>';
  }).join('');
  return '<div class="fs-card"><h3>'+S.pPhase+'<span class="add" id="addPhase">'+S.add+'</span></h3>'+
    '<div class="fs-plist">'+list+'</div>'+
    '<div class="fs-pedit">'+
      '<input type="text" id="peName" value="'+esc(ap.name)+'" placeholder="'+S.phName+'" maxlength="24">'+
      '<div class="row2"><input type="text" id="peTime" value="'+esc(ap.time||'')+'" placeholder="'+S.phTime+'" maxlength="10" style="flex:0 0 96px"><textarea id="peNote" rows="2" placeholder="'+S.phNote+'">'+esc(ap.notes||'')+'</textarea></div>'+
      '<div class="fs-pbtns"><button id="dupPhase">'+S.dup+'</button><button class="del" id="delPhase">'+S.del+'</button></div>'+
    '</div></div>';
}

function totalsFor(teamId){
  var ap=activePhase(), pts=0, arm=0, buffs={};
  Object.keys(ap.assign).forEach(function(k){ if(ap.assign[k]!==teamId)return; var b=BMAP[+k]; if(!b)return; pts+=b.pts;
    if(b.buff==='armory'){ arm++; buffs.atk=(buffs.atk||0)+15; buffs.def=(buffs.def||0)+15; }
    if(b.buff==='merc') buffs.merc=true; if(b.buff==='transit') buffs.tp=true; if(b.buff==='boiler') buffs.cap=true; if(b.buff==='injury') buffs.inj=true;
  });
  return {pts:pts, buffs:buffs};
}
function cardTotals(){
  var rows=state.teams.map(function(t){
    var tt=totalsFor(t.id), b=tt.buffs, chips=[];
    if(b.atk) chips.push(S.bAtk+'+'+b.atk+'%'); if(b.def) chips.push(S.bDef+'-'+b.def+'%');
    if(b.merc) chips.push(S.bDebuff); if(b.tp) chips.push(S.bTp+'-50%'); if(b.cap) chips.push(S.bCap+'-50%'); if(b.inj) chips.push(S.bInj+'10%');
    var cnt=Object.values(activePhase().assign).filter(function(x){return x===t.id;}).length;
    return '<div class="fs-totrow"><span class="d" style="background:'+t.color+'"></span>'+
      '<span class="nm">'+esc(t.name)+'</span>'+
      '<span class="pm">+'+tt.pts.toLocaleString('en-US')+'<small> '+S.ptsMin+' ・ '+cnt+S.occ+'</small></span></div>'+
      (chips.length?'<div class="fs-bchips">'+chips.map(function(c){return '<span class="bc">'+c+'</span>';}).join('')+'</div>':'');
  }).join('');
  return '<div class="fs-card" id="totalsCard"><h3>'+S.pTotal+'</h3><div class="fs-tot">'+rows+'</div></div>';
}

/* ---------- パネルのイベント結線 ---------- */
function wirePanel(){
  var at=$('addTeam'); if(at)at.addEventListener('click',function(){ addTeam(); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-team'),function(row){
    var id=row.getAttribute('data-id');
    row.querySelector('.tc').addEventListener('input',function(e){ patchTeam(id,{color:e.target.value}); softColor(); });
    row.querySelector('.tn').addEventListener('input',function(e){ patchTeam(id,{name:e.target.value}); softColor(); });
    row.querySelector('.bru').addEventListener('click',function(){ state.brushTeamId=state.brushTeamId===id?null:id; render(); });
    row.querySelector('.del').addEventListener('click',function(){ delTeam(id); });
  });
  // 拠点詳細チップ
  Array.prototype.forEach.call(document.querySelectorAll('.fs-chip'),function(ch){
    ch.addEventListener('click',function(){ setHolder(state.selectedBuildingId, ch.getAttribute('data-team')||null); });
  });
  // フェーズ
  var ap2=$('addPhase'); if(ap2)ap2.addEventListener('click',function(){ addPhase(); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-prow'),function(row){
    row.addEventListener('click',function(){ state.activePhaseId=row.getAttribute('data-id'); state.selectedBuildingId=null; render(); });
  });
  var pn=$('peName'); if(pn)pn.addEventListener('input',function(e){ patchPhase({name:e.target.value}); softHeader(); });
  var ptm=$('peTime'); if(ptm)ptm.addEventListener('input',function(e){ patchPhase({time:e.target.value}); softHeader(); });
  var pnt=$('peNote'); if(pnt)pnt.addEventListener('input',function(e){ patchPhase({notes:e.target.value}); save(); });
  var dp=$('dupPhase'); if(dp)dp.addEventListener('click',function(){ dupPhase(); });
  var delp=$('delPhase'); if(delp)delp.addEventListener('click',function(){ delPhase(state.activePhaseId); });
  var ra=$('resetAll'); if(ra)ra.addEventListener('click',function(){ if(window.confirm(S.resetConfirm)){ try{localStorage.removeItem(KEY);}catch(e){} state=defaults(); render(); toast(S.toReset);} });
}
// 入力中はフォーカス維持のため、編成カード以外だけを最小更新
function wireDetailChips(){ Array.prototype.forEach.call(document.querySelectorAll('#detailCard .fs-chip'),function(ch){ ch.addEventListener('click',function(){ setHolder(state.selectedBuildingId, ch.getAttribute('data-team')||null); }); }); }
function softColor(){ renderMap();
  var tc=$('totalsCard'); if(tc){ tc.outerHTML=cardTotals(); }
  var dc=$('detailCard'); if(dc){ dc.outerHTML=cardDetail(); wireDetailChips(); }
  save();
}
function softHeader(){ renderHeader(); renderMap(); save(); }

/* =====================================================================
   操作
   ===================================================================== */
function addTeam(){ var id='t'+Date.now().toString(36); var color=PALETTE[state.teams.length%PALETTE.length]; state.teams.push({id:id,name:(EN?'Team ':'チーム')+(state.teams.length+1),color:color}); render(); track('fs_team_add'); }
function delTeam(id){ state.teams=state.teams.filter(function(t){return t.id!==id;}); state.phases.forEach(function(p){ for(var k in p.assign){ if(p.assign[k]===id)delete p.assign[k]; } }); if(state.brushTeamId===id)state.brushTeamId=null; render(); }
function patchTeam(id,patch){ var t=teamById(id); if(t)Object.assign(t,patch); }
function onBuildingClick(bid){ state.selectedBuildingId=bid;
  if(state.brushTeamId){ var ap=activePhase(); if(ap.assign[String(bid)]===state.brushTeamId)delete ap.assign[String(bid)]; else ap.assign[String(bid)]=state.brushTeamId; track('fs_assign',{b:bid}); }
  render();
}
function setHolder(bid,teamId){ if(!bid)return; var ap=activePhase(); if(!teamId)delete ap.assign[String(bid)]; else ap.assign[String(bid)]=teamId; render(); }
function addPhase(){ var id='p'+Date.now().toString(36); state.phases.push({id:id,name:(EN?'Phase ':'フェーズ')+(state.phases.length+1),time:'',notes:'',assign:{}}); state.activePhaseId=id; render(); }
function dupPhase(){ var cur=activePhase(); var id='p'+Date.now().toString(36); var copy=Object.assign({},cur,{id:id,name:cur.name+(EN?' copy':' 複製'),assign:Object.assign({},cur.assign)}); var idx=state.phases.findIndex(function(p){return p.id===cur.id;}); state.phases.splice(idx+1,0,copy); state.activePhaseId=id; render(); }
function delPhase(id){ if(state.phases.length<=1)return; state.phases=state.phases.filter(function(p){return p.id!==id;}); if(state.activePhaseId===id)state.activePhaseId=state.phases[0].id; render(); }
function patchPhase(patch){ var ap=activePhase(); Object.assign(ap,patch); }
function stepPhase(dir){ var i=state.phases.findIndex(function(p){return p.id===state.activePhaseId;}); var n=i+dir; if(n<0)n=0; if(n>=state.phases.length)n=state.phases.length-1; state.activePhaseId=state.phases[n].id; state.selectedBuildingId=null; render(); }

/* 再生(1.7秒ごとに次フェーズ) */
var playT=null;
function togglePlay(){
  if(playT){ clearInterval(playT); playT=null; state.playing=false; renderHeader(); return; }
  state.playing=true; renderHeader();
  playT=setInterval(function(){ var i=state.phases.findIndex(function(p){return p.id===state.activePhaseId;});
    if(i>=state.phases.length-1){ clearInterval(playT); playT=null; state.playing=false; renderHeader(); return; }
    state.activePhaseId=state.phases[i+1].id; render();
  },1700);
}

/* 集合タイマー */
var tickT=setInterval(function(){ var tm=state.timer; if(tm.running&&tm.remaining>0){ tm.remaining--; renderHeader(); if(tm.remaining%5===0)save(); } else if(tm.running&&tm.remaining<=0){ tm.running=false; renderHeader(); } },1000);
function toggleTimer(){ state.timer.running=!state.timer.running; renderHeader(); save(); }
function resetTimer(){ state.timer.remaining=state.timer.initial; state.timer.running=false; renderHeader(); save(); }
function setTimerText(txt){ var m=/^\s*(\d{1,3}):([0-5]?\d)\s*$/.exec(txt||''); if(!m)return; var sec=(+m[1])*60+(+m[2]); state.timer.remaining=sec; state.timer.initial=sec; renderHeader(); save(); }

/* ---------- ヘッダー結線 ---------- */
function wireHeader(){
  $('phPrev').addEventListener('click',function(){ stepPhase(-1); });
  $('phNext').addEventListener('click',function(){ stepPhase(1); });
  $('phPlay').addEventListener('click',togglePlay);
  $('tmToggle').addEventListener('click',toggleTimer);
  $('tmReset').addEventListener('click',resetTimer);
  $('tmVal').addEventListener('click',function(){ var v=window.prompt(S.setTimer, fmt(state.timer.remaining)); if(v!=null)setTimerText(v); });
  $('arrToggle').addEventListener('click',function(){ state.showArrows=!state.showArrows; render(); });
}

/* ---------- 静的テキスト ---------- */
function buildStatic(){
  $('h1').innerHTML=S.h1a+' <span class="acc">'+S.h1b+'</span>';
  $('tag').textContent=S.tag; $('lead').innerHTML=S.lead;
  $('fsTitle').textContent=S.title; $('fsSub').textContent=S.sub;
  $('tmLab').textContent=S.rally; $('safeL').textContent=S.safeL; $('safeR').textContent=S.safeR; $('arrLab').textContent=S.move;
  $('hHelp').textContent=S.hHelp; $('hData').textContent=S.hData;
  $('helpgrid').innerHTML=[['help1t','help1'],['help2t','help2'],['help3t','help3'],['help4t','help4']].map(function(p){ return '<div class="fb-help"><b>'+S[p[0]]+'</b><br>'+S[p[1]]+'</div>'; }).join('');
  $('dataNote').textContent =
    T('番号→施設: ','No.→facility: ')+BUILDINGS.map(function(b){return '#'+b.num+'='+bname(b);}).join(' / ')+
    T('。ポイント(毎分)・バフ・開放時刻は添付仕様に準拠。位置は実マップ参照の暫定値です。数値は app.js の BUILDINGS / BUFF を編集すれば調整できます。占拠状態はフェーズ単位で保存されます。',
      '. Points/min, buffs and open times follow the spec; positions are provisional. Edit BUILDINGS/BUFF in app.js to adjust.');
  $('relbar').innerHTML=
    '<a href="../bear-hunt/index.html">'+T('→ 熊狩シミュレーター','→ Bear Hunt')+'</a>'+
    '<a href="../troop-ratio/index.html">'+T('→ 兵士比率シミュ','→ Troop Ratio')+'</a>'+
    '<a href="../king-castle/index.html">'+T('→ 王城戦','→ Castle Battle')+'</a>'+
    '<a href="../../guides/bear-hunt-guide.html">'+T('→ 攻略ガイド','→ Guides')+'</a>';
  if(EN){ $('htmlroot').lang='en'; document.title='Foundry Battle Field Op Planner | Whiteout Tools Lab';
    $('crumb').innerHTML='<a href="../../index.html?lang=en">Home</a> &gt; Field Op Planner'; }
}

/* ---------- 初期化 ---------- */
function init(){ buildStatic(); wireHeader(); render(); }
if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
