/* =====================================================================
   兵器工場争奪戦 ツール  app.js  (v4: 作戦/模擬戦 切替)
   - モード切替: 作戦シミュレータ(チーム編成・フェーズ・攻撃ライン) ⇄ 模擬戦シミュレータ(占領→ポイント/バフ)
   - マップ(拠点配置)は共通。数値は下記 BUILDINGS / BUFF / MOCKCFG を編集すれば調整可能
   ===================================================================== */
(function(){
"use strict";
var T = window.t || function(a){return a;};
var EN = (window.WOS_LANG||'ja')==='en';
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function mmss(sec){ sec=Math.max(0,sec|0); var m=Math.floor(sec/60),s=sec%60; return (m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
function fmtN(n){ return Math.round(n).toLocaleString('en-US'); }
var toastTimer=null;
function toast(m){ var t=$('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove('show');},1800); }
function track(a,p){ try{ if(window.gtag)gtag('event',a,Object.assign({tool:'foundry_battle'},p||{})); }catch(e){} }

/* ===================== 共通文字列 ===================== */
var S = {
  h1a:T('兵器工場争奪戦','Foundry Battle'), h1b:T('フィールドツール','Field Tool'), tag:T('フィールド作戦ツール','Field Tool'),
  lead:T('「兵器工場争奪戦」のフィールドツール。上のタブで <b>作戦シミュレータ</b>(チーム編成→拠点割当→攻撃ライン)と <b>模擬戦シミュレータ</b>(占領→ポイント/バフをリアルタイム試算)を切り替えられます。',
          'Field tool for Foundry Battle. Switch tabs between the <b>Op Planner</b> (teams → targets → attack lines) and the <b>Mock Battle</b> sim (occupy → live points & buffs).'),
  modePlan:T('作戦シミュレータ','Op Planner'), modeMock:T('模擬戦シミュレータ','Mock Battle'),
  safe:T('セーフエリア','Safe area'),
  hHelp:T('使い方','How to use'), hData:T('施設データ(仕様準拠)','Facility data'),
  // 共通バフ凡例
  blue:T('自軍','Blue'), red:T('敵軍','Red'), none:T('未占領','Neutral'),
  // help
  help1t:T('モード切替','Two modes'), help1:T('上のタブで「作戦」と「模擬戦」を切替。データはそれぞれ自動保存されます。','Switch modes with the tabs; each saves independently.'),
  help2t:T('作戦：チームと攻撃ライン','Planner: teams & lines'), help2:T('チーム(最大8)を作り、筆で拠点を割当。<b>優先度</b>に沿って各チームの<b>攻撃ライン</b>が伸びます。終結主も設定可。','Build up to 8 teams, brush-assign buildings; <b>attack lines</b> follow each team\u2019s <b>priority</b>. Set a leader per team.'),
  help3t:T('模擬戦：占領で試算','Mock: occupy & score'), help3:T('味方/敵を選んで拠点をクリック→占拠。<b>初回支配ポイント＋毎分</b>が貯まり、敵に奪われると<b>半分が散らばって消失</b>します。','Pick Blue/Red and click to capture. <b>First-capture + per-min</b> points accrue; lose it and <b>half scatters away</b>.'),
  help4t:T('時間と再入場','Time & re-entry'), help4:T('模擬戦は再生で時間が進行。中央は15分後、武器工房は20分後に解放。<b>一時退出の再入場は12分</b>固定です。','Mock advances on play; center opens at 15m, workshop at 20m. <b>Re-entry takes a fixed 12 min</b>.')
};

/* ===================== バフ定義(docx準拠) ===================== */
var BUFF = {
  injury: {ja:'駐屯兵10%が2分毎に負傷(自軍/敵軍とも)', en:'10% of troops injured every 2 min'},
  armory: {ja:'味方部隊 攻撃+15% / 被ダメ-15%(占拠中持続)', en:'Allied ATK +15% / DMG taken −15%'},
  merc:   {ja:'敵占領施設へ傭兵デバフ(敵 攻撃/防御 -10〜50%)', en:'Merc debuff on enemy buildings (−10〜50%)'},
  transit:{ja:'転移クールタイム -50%(12→6分)', en:'Teleport CD −50% (12→6 min)'},
  boiler: {ja:'占領時間 -50%(2→1分)', en:'Capture time −50% (2→1 min)'}
};

/* ===================== 拠点データ(座標=デザイン / 数値=docx+指定) =====================
   init=初回支配ポイント(同盟軍事施設ポイント) / pts=毎分 / buff / openMin=開放(分) */
var BUILDINGS = [
  {id:1, num:'1', short:T('王室','RF'),  ja:'王室兵器工場',  en:'Royal Foundry',  role:'フィールド中央の最重要拠点。全拠点の司令塔であり、最終目標。', x:48,y:48, big:true, init:9000, pts:1800, buff:'injury', openMin:15, cat:'prize'},
  {id:2, num:'2', short:T('試1','T1'),  ja:'第1武器試験場', en:'Test Field 1',  role:'新型兵器を試験する施設。確保で兵器性能が向上。', x:27,y:40, init:6000, pts:1200, cat:'point'},
  {id:3, num:'3', short:T('試2','T2'),  ja:'第2武器試験場', en:'Test Field 2',  role:'新型兵器を試験する施設。確保で兵器性能が向上。', x:69,y:59, init:6000, pts:1200, cat:'point'},
  {id:4, num:'4', short:T('修1','R1'),  ja:'第1武器修理工場',en:'Repair Factory 1',role:'損傷した兵器を修理・補給。前線維持に重要。', x:20,y:56, init:3000, pts:600, cat:'point'},
  {id:5, num:'5', short:T('修2','R2'),  ja:'第2武器修理工場',en:'Repair Factory 2',role:'損傷した兵器を修理・補給。前線維持に重要。', x:77,y:47, init:3000, pts:600, cat:'point'},
  {id:6, num:'6', short:T('修3','R3'),  ja:'第3武器修理工場',en:'Repair Factory 3',role:'損傷した兵器を修理・補給。前線維持に重要。', x:33,y:83, init:3000, pts:600, cat:'point'},
  {id:7, num:'7', short:T('修4','R4'),  ja:'第4武器修理工場',en:'Repair Factory 4',role:'損傷した兵器を修理・補給。前線維持に重要。', x:59,y:14, init:3000, pts:600, cat:'point'},
  {id:8, num:'8', short:T('倉庫','AR'), ja:'兵器倉庫',      en:'Armory',         role:'兵器を貯蔵する補給拠点。物資供給の要。', x:47,y:75, init:1200, pts:240, buff:'armory', openMin:15, cat:'buff'},
  {id:9, num:'9', short:T('傭兵','MC'), ja:'傭兵野営地',    en:'Mercenary Camp', role:'傭兵の増援拠点。確保で敵施設へデバフ。', x:47,y:27, init:1200, pts:240, buff:'merc', openMin:15, cat:'buff'},
  {id:10,num:'10',short:T('中継','TS'), ja:'中継所',        en:'Transit Station',role:'補給線を中継する拠点。後方支援を担う。', x:60,y:83, init:1200, pts:240, buff:'transit', cat:'util'},
  {id:11,num:'11',short:T('蒸気','SB'), ja:'スチームボイラー',en:'Steam Boiler', role:'フィールド全体へ動力を供給。占領時間を短縮。', x:33,y:14, init:1200, pts:240, buff:'boiler', cat:'util'},
  {id:12,num:T('工','W'),short:T('工房','WS'),ja:'武器工房(採集所)',en:'Weapon Workshop',role:'弾薬採集専用。20分後にランダム出現。占拠で総量4800を20分採集。', x:64,y:34, init:0, pts:0, openMin:20, random:true, cat:'res', yield:4800, harvest:1200}
];
var BMAP={}; BUILDINGS.forEach(function(b){ BMAP[b.id]=b; });
function bname(b){ return EN?b.en:b.ja; }
function buffText(key){ return key?(EN?BUFF[key].en:BUFF[key].ja):''; }
var PALETTE=['#2DD4BF','#F4A83A','#A78BFA','#60A5FA','#F472B6','#A3E635','#FB7185','#38BDF8'];
var MAX_TEAMS=8;

/* DOM参照(共通) */
var mapbox=$('mapbox'), tiles=$('tiles'), arrows=$('arrows'), ovTL=$('ovTL'), ovTR=$('ovTR'), brushInd=$('brushInd'),
    panel=$('panel'), header=$('toolHeader'), scorebar=$('scorebar');
var SVGNS='http://www.w3.org/2000/svg';

/* ===================== モード管理 ===================== */
var MODE = (function(){ try{ return localStorage.getItem('wos_fb_mode')||'plan'; }catch(e){ return 'plan'; } })();
function setMode(m){ if(m===MODE) return; teardown(); MODE=m; try{localStorage.setItem('wos_fb_mode',m);}catch(e){} renderModeBar(); render(); track('fb_mode',{m:m}); }
function renderModeBar(){
  $('modeBar').innerHTML =
    '<button class="fs-mode'+(MODE==='plan'?' on':'')+'" data-m="plan"><span class="ic">🗺️</span>'+S.modePlan+'</button>'+
    '<button class="fs-mode'+(MODE==='mock'?' on':'')+'" data-m="mock"><span class="ic">⚔️</span>'+S.modeMock+'</button>';
  Array.prototype.forEach.call(document.querySelectorAll('.fs-mode'),function(b){ b.addEventListener('click',function(){ setMode(b.getAttribute('data-m')); }); });
}
function teardown(){ if(planPlayT){clearInterval(planPlayT);planPlayT=null;} P.playing=false; M.playing=false;
  arrows.innerHTML=''; tiles.innerHTML=''; ovTL.innerHTML=''; ovTR.innerHTML=''; brushInd.innerHTML=''; }
function render(){ if(MODE==='plan'){ scorebar.style.display='none'; renderPlan(); } else { scorebar.style.display=''; renderMock(); } }

/* =====================================================================
   ============== 作戦シミュレータ (PLANNER) ==============
   ===================================================================== */
var PS = {
  title:T('作戦シミュレータ','Op Planner'), sub:T('チーム編成・拠点ターゲット・攻撃ライン','Teams, targets & attack lines'),
  rally:T('集合まで','Rally in'), start:T('開始','Start'), stop:T('停止','Stop'),
  play:T('再生','Play'), playing:T('停止','Stop'),
  line:T('攻撃ライン','Attack lines'),
  pTeams:T('チーム編成','Teams'), pDetail:T('拠点の詳細','Building'), pPhase:T('作戦フェーズ','Phases'), pTotal:T('ポイント/バフ集計','Points & buffs'),
  add:T('＋追加','＋Add'), addMax:T('最大8チーム','Max 8'),
  leader:T('終結主','Leader'), leaderPh:T('リーダー名','Leader'),
  detailHint:T('マップの拠点をクリックすると、詳細と「占領チーム」「優先度」を設定できます。チーム行の筆を選ぶと、クリックで一括割当できます。','Click a building to set its holding team and priority. Pick a team\u2019s brush to assign by clicking.'),
  holder:T('占領チーム','Holding team'), unassign:T('未割当に','Clear'), prio:T('攻撃優先度','Attack priority'),
  occ:T('占領数','Held'), ptsMin:T('pt/分','pt/min'),
  phName:T('フェーズ名','Phase'), phTime:T('時刻','Time'), phNote:T('メモ','Notes'),
  dup:T('複製','Duplicate'), del:T('削除','Delete'),
  resetAll:T('すべてリセット','Reset all'), resetConfirm:T('編成・作戦をリセットします。よろしいですか？','Reset all teams and phases?'),
  open15:T('15分後開放','+15m'), open20:T('20分後出現','+20m'),
  setTimer:T('集合まで(mm:ss)','Rally (mm:ss)'), brushOn:T('割当モード','Brush'),
  bAtk:T('攻撃','ATK'), bDef:T('被ダメ','DMG'), bDebuff:T('傭兵デバフ','Merc'), bTp:T('転移CD','TP'), bCap:T('占領時間','Cap'), bInj:T('負傷','Inj'),
  toReset:T('初期状態に戻しました','Reset')
};
var KEYP='wos_fieldsim_v1';
function planDefaults(){
  return {
    teams:[ {id:'t1',name:T('Aチーム','Team A'),color:'#2DD4BF',leader:''}, {id:'t2',name:T('Bチーム','Team B'),color:'#F4A83A',leader:''}, {id:'t3',name:T('Cチーム','Team C'),color:'#A78BFA',leader:''} ],
    phases:[
      {id:'p1',name:T('集合','Rally'),  time:'20:00', notes:T('両サイドのセーフエリア付近に集合し、開始の合図を待つ。','Gather near the safe areas.'), assign:{}, prio:{}},
      {id:'p2',name:T('第1波','Wave 1'),time:'20:05', notes:T('外周の修理工場・試験場を一斉制圧。','Seize outer repair & test fields.'), assign:{'11':'t1','4':'t1','7':'t2','5':'t2','2':'t3','3':'t3'}, prio:{'11':1,'4':2,'7':1,'5':2,'2':1,'3':2}},
      {id:'p3',name:T('第2波','Wave 2'),time:'20:12', notes:T('内側へ前進。傭兵野営地と倉庫を確保。','Push inward; take camp & armory.'), assign:{'9':'t1','2':'t1','8':'t2','10':'t2','3':'t3','5':'t3'}, prio:{'9':1,'2':2,'8':1,'10':2,'3':1,'5':2}},
      {id:'p4',name:T('総攻撃','Assault'),time:'20:20',notes:T('全チームで王室兵器工場へ集中。','All-in on the Royal Foundry.'), assign:{'1':'t1','9':'t2','8':'t3'}, prio:{'1':1,'9':1,'8':1}}
    ],
    activePhaseId:'p2', selectedBuildingId:null, brushTeamId:null, showArrows:true, playing:false,
    timer:{remaining:1200, initial:1200, running:false}
  };
}
function planLoad(){ try{ var r=localStorage.getItem(KEYP); if(r){ var s=JSON.parse(r); var d=planDefaults(); var st=Object.assign(d,s,{playing:false,selectedBuildingId:null});
  st.teams.forEach(function(t){ if(t.leader==null)t.leader=''; }); st.phases.forEach(function(p){ if(!p.prio)p.prio={}; }); return st; } }catch(e){} return planDefaults(); }
var P = planLoad();
function planSave(){ try{ localStorage.setItem(KEYP, JSON.stringify({teams:P.teams,phases:P.phases,activePhaseId:P.activePhaseId,brushTeamId:P.brushTeamId,showArrows:P.showArrows,timer:P.timer})); }catch(e){} }
function pPhase(){ return P.phases.find(function(p){return p.id===P.activePhaseId;})||P.phases[0]; }
function pTeam(id){ return P.teams.find(function(t){return t.id===id;})||null; }
function pHolder(bid){ var tid=pPhase().assign[String(bid)]; return tid?pTeam(tid):null; }

function renderPlan(){ renderPlanHeader(); renderPlanMap(); renderPlanPanel(); planSave(); }

function renderPlanHeader(){
  var ap=pPhase(), idx=P.phases.findIndex(function(p){return p.id===ap.id;}), tm=P.timer;
  header.className='fs-head';
  header.innerHTML =
    '<div class="fs-title"><div class="t"><span class="dot"></span>'+PS.title+'</div><div class="s">'+PS.sub+'</div></div>'+
    '<div class="fs-grp fs-timer"><div><span class="lab">'+PS.rally+'</span><span class="val'+(tm.running?' run':'')+'" id="tmVal" title="'+PS.setTimer+'">'+mmss(tm.remaining)+'</span></div>'+
      '<div style="display:flex;gap:4px"><button class="fs-btn" id="tmToggle">'+(tm.running?PS.stop:PS.start)+'</button><button class="fs-btn fs-ico" id="tmReset">↺</button></div></div>'+
    '<div class="fs-grp"><button class="fs-btn fs-ico" id="phPrev">‹</button><button class="fs-play" id="phPlay">'+(P.playing?PS.playing:PS.play)+'</button>'+
      '<button class="fs-btn fs-ico" id="phNext">›</button><div class="fs-pname"><span class="n">'+esc(ap.name||'—')+'</span><span class="i">'+(idx+1)+'/'+P.phases.length+(ap.time?(' · '+esc(ap.time)):'')+'</span></div></div>';
  $('phPrev').addEventListener('click',function(){ planStep(-1); });
  $('phNext').addEventListener('click',function(){ planStep(1); });
  $('phPlay').addEventListener('click',planTogglePlay);
  $('tmToggle').addEventListener('click',function(){ P.timer.running=!P.timer.running; renderPlanHeader(); planSave(); });
  $('tmReset').addEventListener('click',function(){ P.timer.remaining=P.timer.initial; P.timer.running=false; renderPlanHeader(); planSave(); });
  $('tmVal').addEventListener('click',function(){ var v=window.prompt(PS.setTimer, mmss(P.timer.remaining)); if(v!=null){ var m=/^\s*(\d{1,3}):([0-5]?\d)\s*$/.exec(v); if(m){ var sec=(+m[1])*60+(+m[2]); P.timer.remaining=sec; P.timer.initial=sec; renderPlanHeader(); planSave(); } } });
}

function avg(a){ return a.reduce(function(s,x){return s+x;},0)/a.length; }
function planLines(){
  if(!P.showArrows) return [];
  var ap=pPhase(), i=P.phases.findIndex(function(p){return p.id===ap.id;});
  var prev = i>0 ? P.phases[i-1].assign : {};
  var out=[];
  P.teams.forEach(function(t){
    var tb=Object.keys(ap.assign).filter(function(k){return ap.assign[k]===t.id;}).map(Number);
    if(!tb.length) return;
    tb.sort(function(a,b){ return ((ap.prio&&ap.prio[a])||99)-((ap.prio&&ap.prio[b])||99); });
    var pb=Object.keys(prev).filter(function(k){return prev[k]===t.id;}).map(Number);
    var ox,oy; if(pb.length){ ox=avg(pb.map(function(b){return BMAP[b].x;})); oy=avg(pb.map(function(b){return BMAP[b].y;})); } else { ox=50; oy=95; }
    var pts=[{x:ox,y:oy}]; tb.forEach(function(b){ pts.push({x:BMAP[b].x,y:BMAP[b].y}); });
    out.push({pts:pts,color:t.color});
  });
  return out;
}
function renderPlanMap(){
  // 攻撃ライン
  arrows.innerHTML='';
  planLines().forEach(function(L){
    var poly=document.createElementNS(SVGNS,'polyline');
    poly.setAttribute('points', L.pts.map(function(p){return p.x+','+p.y;}).join(' '));
    poly.setAttribute('fill','none'); poly.setAttribute('stroke',L.color); poly.setAttribute('stroke-width','0.9');
    poly.setAttribute('stroke-linejoin','round'); poly.setAttribute('stroke-linecap','round');
    poly.setAttribute('stroke-dasharray','2 1.6'); poly.setAttribute('vector-effect','non-scaling-stroke');
    poly.style.animation='fsflow .9s linear infinite'; poly.style.opacity='.9';
    arrows.appendChild(poly);
    var last=L.pts[L.pts.length-1];
    var dot=document.createElementNS(SVGNS,'circle'); dot.setAttribute('cx',last.x); dot.setAttribute('cy',last.y); dot.setAttribute('r','1.6'); dot.setAttribute('fill',L.color);
    arrows.appendChild(dot);
  });
  // タイル
  var ap=pPhase();
  tiles.innerHTML='';
  BUILDINGS.forEach(function(b){
    var holder=pHolder(b.id), sel=P.selectedBuildingId===b.id, bc=holder?holder.color:'#9fb6c8';
    var prio=ap.prio&&ap.prio[b.id];
    var div=document.createElement('div');
    div.className='fs-tile'+(b.big?' big':'')+(sel?' sel':''); div.style.left=b.x+'%'; div.style.top=b.y+'%';
    div.setAttribute('role','button'); div.setAttribute('tabindex','0'); div.setAttribute('aria-label','#'+b.num+' '+bname(b)+(holder?('｜'+holder.name):''));
    var tag = b.openMin===15?('<span class="tag">'+PS.open15+'</span>') : b.random?('<span class="tag">'+PS.open20+'</span>') : '';
    var pbadge = (holder&&prio)?('<span class="fs-prio" style="background:'+bc+'">'+prio+'</span>'):'';
    div.innerHTML =
      '<div class="fs-dia" style="border-color:'+bc+'"><div class="fs-occ" style="background:'+bc+';opacity:'+(holder?'':'0')+'"></div><div class="bld"></div><div class="fs-badge">'+esc(b.num)+'</div></div>'+
      pbadge + tag + '<div class="fs-pill">'+esc(b.short)+'</div>';
    div.addEventListener('click',function(){ planBuildingClick(b.id); });
    div.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); planBuildingClick(b.id);} });
    tiles.appendChild(div);
  });
  // オーバーレイ
  var held=Object.keys(ap.assign).length;
  ovTL.className='fs-ov tl'; ovTL.innerHTML='<div class="pn">'+esc(ap.name||'—')+'</div><div class="pi">'+(ap.time?esc(ap.time)+' · ':'')+held+' '+PS.occ+'</div>';
  ovTR.className='fs-ov tr'; ovTR.innerHTML='<div class="fs-toggle'+(P.showArrows?' on':'')+'" id="arrToggle"><span class="sw"></span>'+PS.line+'</div>';
  $('arrToggle').addEventListener('click',function(){ P.showArrows=!P.showArrows; renderPlan(); });
  var bt=pTeam(P.brushTeamId);
  brushInd.innerHTML = bt ? '<div class="fs-brush"><span class="dot" style="background:'+bt.color+'"></span>'+PS.brushOn+'：'+esc(bt.name)+'<button id="brOff">×</button></div>' : '';
  if(bt){ $('brOff').addEventListener('click',function(e){ e.stopPropagation(); P.brushTeamId=null; renderPlan(); }); }
}

function renderPlanPanel(){
  panel.innerHTML = planTeamsCard() + planDetailCard() + planPhasesCard() + planTotalsCard() + '<button class="fs-reset" id="resetAll">'+PS.resetAll+'</button>';
  planWire();
}
function planTeamsCard(){
  var rows=P.teams.map(function(t){
    var cnt=Object.values(pPhase().assign).filter(function(x){return x===t.id;}).length;
    return '<div class="fs-team" data-id="'+t.id+'">'+
        '<input type="color" value="'+t.color+'" class="tc">'+
        '<input type="text" value="'+esc(t.name)+'" class="tn" maxlength="18">'+
        '<span class="cnt">'+cnt+'</span>'+
        '<button class="bru'+(P.brushTeamId===t.id?' on':'')+'">🖌</button>'+
        '<button class="del">×</button>'+
      '</div>'+
      '<div class="fs-leadrow"><span class="lab">'+PS.leader+'</span><input type="text" class="ld" value="'+esc(t.leader||'')+'" placeholder="'+PS.leaderPh+'" maxlength="16" data-id="'+t.id+'"></div>';
  }).join('');
  var addBtn = P.teams.length>=MAX_TEAMS ? '<span class="add" style="opacity:.5;cursor:default">'+PS.addMax+'</span>' : '<span class="add" id="addTeam">'+PS.add+'</span>';
  return '<div class="fs-card"><h3>'+PS.pTeams+addBtn+'</h3>'+rows+'</div>';
}
function planDetailCard(){
  var b=P.selectedBuildingId?BMAP[P.selectedBuildingId]:null;
  if(!b) return '<div class="fs-card" id="detailCard"><h3>'+PS.pDetail+'</h3><div class="fs-hint">'+PS.detailHint+'</div></div>';
  var holder=pHolder(b.id), ap=pPhase();
  var meta='<span class="m">'+T('ポイント','Pts')+' '+fmtN(b.init)+' / +'+b.pts+'/'+T('分','m')+'</span>';
  if(b.buff) meta+='<span class="m buff">'+esc(buffText(b.buff))+'</span>';
  if(b.openMin===15) meta+='<span class="m">'+PS.open15+'</span>'; if(b.random) meta+='<span class="m">'+PS.open20+'</span>';
  var chips=P.teams.map(function(t){ var on=holder&&holder.id===t.id;
    return '<button class="fs-chip'+(on?' on':'')+'" data-team="'+t.id+'" style="'+(on?('border-color:'+t.color):'')+'"><span class="d" style="background:'+t.color+'"></span>'+esc(t.name)+'</button>'; }).join('');
  var prioEdit = holder ? '<div class="fs-prioedit"><span class="lab">'+PS.prio+'</span><input type="number" id="prioIn" min="1" max="20" value="'+((ap.prio&&ap.prio[b.id])||1)+'"></div>' : '';
  return '<div class="fs-card" id="detailCard"><h3>'+PS.pDetail+'</h3><div class="fs-det">'+
    '<div class="hd"><div class="nb">'+esc(b.num)+'</div><div class="nm">'+esc(bname(b))+'</div></div>'+
    '<div class="role">'+esc(b.role)+'</div><div class="meta">'+meta+'</div>'+
    '<div style="font:700 11px \'Noto Sans JP\';color:var(--fmut);margin-bottom:6px">'+PS.holder+'</div>'+
    '<div class="fs-chips">'+chips+'<button class="fs-chip none" data-team="">'+PS.unassign+'</button></div>'+ prioEdit +
  '</div></div>';
}
function planPhasesCard(){
  var ap=pPhase();
  var list=P.phases.map(function(p){ return '<div class="fs-prow'+(p.id===ap.id?' on':'')+'" data-id="'+p.id+'"><span class="pn">'+esc(p.name)+'</span><span class="pt">'+esc(p.time||'')+'</span></div>'; }).join('');
  return '<div class="fs-card"><h3>'+PS.pPhase+'<span class="add" id="addPhase">'+PS.add+'</span></h3><div class="fs-plist">'+list+'</div>'+
    '<div class="fs-pedit"><input type="text" id="peName" value="'+esc(ap.name)+'" placeholder="'+PS.phName+'" maxlength="24">'+
    '<div class="row2"><input type="text" id="peTime" value="'+esc(ap.time||'')+'" placeholder="'+PS.phTime+'" maxlength="10" style="flex:0 0 96px"><textarea id="peNote" rows="2" placeholder="'+PS.phNote+'">'+esc(ap.notes||'')+'</textarea></div>'+
    '<div class="fs-pbtns"><button id="dupPhase">'+PS.dup+'</button><button class="del" id="delPhase">'+PS.del+'</button></div></div></div>';
}
function planTotalsFor(teamId){ var ap=pPhase(), pts=0, buffs={};
  Object.keys(ap.assign).forEach(function(k){ if(ap.assign[k]!==teamId)return; var b=BMAP[+k]; if(!b)return; pts+=b.pts;
    if(b.buff==='armory'){ buffs.atk=(buffs.atk||0)+15; buffs.def=(buffs.def||0)+15; }
    if(b.buff==='merc')buffs.merc=true; if(b.buff==='transit')buffs.tp=true; if(b.buff==='boiler')buffs.cap=true; if(b.buff==='injury')buffs.inj=true; });
  return {pts:pts,buffs:buffs};
}
function planTotalsCard(){
  var rows=P.teams.map(function(t){ var tt=planTotalsFor(t.id), b=tt.buffs, chips=[];
    if(b.atk)chips.push(PS.bAtk+'+'+b.atk+'%'); if(b.def)chips.push(PS.bDef+'-'+b.def+'%'); if(b.merc)chips.push(PS.bDebuff);
    if(b.tp)chips.push(PS.bTp+'-50%'); if(b.cap)chips.push(PS.bCap+'-50%'); if(b.inj)chips.push(PS.bInj+'10%');
    var cnt=Object.values(pPhase().assign).filter(function(x){return x===t.id;}).length;
    var lead=t.leader?('<small> ・ '+PS.leader+':'+esc(t.leader)+'</small>'):'';
    return '<div class="fs-totrow"><span class="d" style="background:'+t.color+'"></span><span class="nm">'+esc(t.name)+lead+'</span>'+
      '<span class="pm">+'+fmtN(tt.pts)+'<small> '+PS.ptsMin+' ・ '+cnt+PS.occ+'</small></span></div>'+
      (chips.length?'<div class="fs-bchips">'+chips.map(function(c){return '<span class="bc">'+c+'</span>';}).join('')+'</div>':'');
  }).join('');
  return '<div class="fs-card" id="totalsCard"><h3>'+PS.pTotal+'</h3><div class="fs-tot">'+rows+'</div></div>';
}
function planWireDetailChips(){ Array.prototype.forEach.call(document.querySelectorAll('#detailCard .fs-chip'),function(ch){ ch.addEventListener('click',function(){ planSetHolder(P.selectedBuildingId, ch.getAttribute('data-team')||null); }); });
  var pin=$('prioIn'); if(pin)pin.addEventListener('input',function(e){ var v=parseInt(e.target.value,10); if(isNaN(v)||v<1)v=1; var ap=pPhase(); ap.prio[String(P.selectedBuildingId)]=v; renderPlanMap(); planSave(); }); }
function planWire(){
  var at=$('addTeam'); if(at)at.addEventListener('click',planAddTeam);
  Array.prototype.forEach.call(document.querySelectorAll('.fs-team'),function(row){ var id=row.getAttribute('data-id');
    row.querySelector('.tc').addEventListener('input',function(e){ pTeam(id).color=e.target.value; planSoft(); });
    row.querySelector('.tn').addEventListener('input',function(e){ pTeam(id).name=e.target.value; planSoft(); });
    row.querySelector('.bru').addEventListener('click',function(){ P.brushTeamId=P.brushTeamId===id?null:id; renderPlan(); });
    row.querySelector('.del').addEventListener('click',function(){ planDelTeam(id); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-leadrow .ld'),function(inp){ inp.addEventListener('input',function(e){ var t=pTeam(inp.getAttribute('data-id')); if(t){ t.leader=e.target.value; planSaveSoftTotals(); } }); });
  planWireDetailChips();
  var ap2=$('addPhase'); if(ap2)ap2.addEventListener('click',planAddPhase);
  Array.prototype.forEach.call(document.querySelectorAll('.fs-prow'),function(row){ row.addEventListener('click',function(){ P.activePhaseId=row.getAttribute('data-id'); P.selectedBuildingId=null; renderPlan(); }); });
  var pn=$('peName'); if(pn)pn.addEventListener('input',function(e){ pPhase().name=e.target.value; renderPlanHeader(); planSave(); });
  var ptm=$('peTime'); if(ptm)ptm.addEventListener('input',function(e){ pPhase().time=e.target.value; renderPlanHeader(); planSave(); });
  var pnt=$('peNote'); if(pnt)pnt.addEventListener('input',function(e){ pPhase().notes=e.target.value; planSave(); });
  var dp=$('dupPhase'); if(dp)dp.addEventListener('click',planDupPhase);
  var delp=$('delPhase'); if(delp)delp.addEventListener('click',function(){ planDelPhase(P.activePhaseId); });
  var ra=$('resetAll'); if(ra)ra.addEventListener('click',function(){ if(window.confirm(PS.resetConfirm)){ try{localStorage.removeItem(KEYP);}catch(e){} P=planDefaults(); renderPlan(); toast(PS.toReset);} });
}
function planSoft(){ renderPlanMap(); var tc=$('totalsCard'); if(tc)tc.outerHTML=planTotalsCard(); var dc=$('detailCard'); if(dc){ dc.outerHTML=planDetailCard(); planWireDetailChips(); } planSave(); }
function planSaveSoftTotals(){ var tc=$('totalsCard'); if(tc)tc.outerHTML=planTotalsCard(); planSave(); }

function planAddTeam(){ if(P.teams.length>=MAX_TEAMS)return; var id='t'+Date.now().toString(36); var color=PALETTE[P.teams.length%PALETTE.length]; P.teams.push({id:id,name:(EN?'Team ':'チーム')+(P.teams.length+1),color:color,leader:''}); renderPlan(); }
function planDelTeam(id){ if(P.teams.length<=1)return; P.teams=P.teams.filter(function(t){return t.id!==id;}); P.phases.forEach(function(p){ for(var k in p.assign){ if(p.assign[k]===id){ delete p.assign[k]; if(p.prio)delete p.prio[k]; } } }); if(P.brushTeamId===id)P.brushTeamId=null; renderPlan(); }
function planBuildingClick(bid){ P.selectedBuildingId=bid; if(P.brushTeamId){ var ap=pPhase(); if(ap.assign[String(bid)]===P.brushTeamId){ delete ap.assign[String(bid)]; delete ap.prio[String(bid)]; } else { ap.assign[String(bid)]=P.brushTeamId; var n=Object.keys(ap.assign).filter(function(k){return ap.assign[k]===P.brushTeamId;}).length; ap.prio[String(bid)]=n; } track('fs_assign',{b:bid}); } renderPlan(); }
function planSetHolder(bid,teamId){ if(!bid)return; var ap=pPhase(); if(!teamId){ delete ap.assign[String(bid)]; delete ap.prio[String(bid)]; } else { ap.assign[String(bid)]=teamId; if(!ap.prio[String(bid)]){ var n=Object.keys(ap.assign).filter(function(k){return ap.assign[k]===teamId;}).length; ap.prio[String(bid)]=n; } } renderPlan(); }
function planAddPhase(){ var id='p'+Date.now().toString(36); P.phases.push({id:id,name:(EN?'Phase ':'フェーズ')+(P.phases.length+1),time:'',notes:'',assign:{},prio:{}}); P.activePhaseId=id; renderPlan(); }
function planDupPhase(){ var cur=pPhase(); var id='p'+Date.now().toString(36); var copy=Object.assign({},cur,{id:id,name:cur.name+(EN?' copy':' 複製'),assign:Object.assign({},cur.assign),prio:Object.assign({},cur.prio||{})}); var idx=P.phases.findIndex(function(p){return p.id===cur.id;}); P.phases.splice(idx+1,0,copy); P.activePhaseId=id; renderPlan(); }
function planDelPhase(id){ if(P.phases.length<=1)return; P.phases=P.phases.filter(function(p){return p.id!==id;}); if(P.activePhaseId===id)P.activePhaseId=P.phases[0].id; renderPlan(); }
function planStep(dir){ var i=P.phases.findIndex(function(p){return p.id===P.activePhaseId;}); var n=i+dir; if(n<0)n=0; if(n>=P.phases.length)n=P.phases.length-1; P.activePhaseId=P.phases[n].id; P.selectedBuildingId=null; renderPlan(); }
var planPlayT=null;
function planTogglePlay(){ if(planPlayT){ clearInterval(planPlayT); planPlayT=null; P.playing=false; renderPlanHeader(); return; } P.playing=true; renderPlanHeader();
  planPlayT=setInterval(function(){ var i=P.phases.findIndex(function(p){return p.id===P.activePhaseId;}); if(i>=P.phases.length-1){ clearInterval(planPlayT); planPlayT=null; P.playing=false; renderPlanHeader(); return; } P.activePhaseId=P.phases[i+1].id; renderPlan(); },1700); }
// 集合タイマー(1秒)
setInterval(function(){ if(MODE!=='plan')return; var tm=P.timer; if(tm.running&&tm.remaining>0){ tm.remaining--; renderPlanHeader(); if(tm.remaining%5===0)planSave(); } else if(tm.running&&tm.remaining<=0){ tm.running=false; renderPlanHeader(); } },1000);

/* =====================================================================
   ============== 模擬戦シミュレータ (MOCK) ==============
   ===================================================================== */
var MS = {
  title:T('模擬戦シミュレータ','Mock Battle'), sub:T('占領→ポイント/バフをリアルタイム試算','Occupy → live points & buffs'),
  placeB:T('自軍で占拠','Capture Blue'), placeR:T('敵軍で占拠','Capture Red'), placeN:T('占領解除','Clear'),
  grpPlace:T('占拠モード','Capture'), grpSim:T('時間','Time'), grpBulk:T('一括','Bulk'), grpEdit:T('編集','Edit'),
  play:T('再生','Play'), pause:T('停止','Pause'), resetClock:T('時間リセット','Reset'), capToggle:T('占拠時間を反映','Capture time'),
  allB:T('全自軍','All Blue'), allR:T('全敵軍','All Red'), clearAll:T('全解除','Clear all'), undo:T('元に戻す','Undo'), redo:T('やり直し','Redo'),
  pBuff:T('戦力バフ集計','Buffs'), pList:T('施設一覧','Facilities'), pEvent:T('ゲーム時間','Event time'), pExit:T('自分の状態','Status'), pSet:T('詳細設定','Settings'),
  bAtk:T('部隊ダメージ','Troop dmg'), bDef:T('被ダメージ','Dmg taken'), bSiege:T('対施設攻撃','Siege'), bCap:T('占領完了時間','Capture'), bTp:T('転移CD','Teleport'), bInj:T('負傷','Injured'),
  half:T('-50%','-50%'), none2:T('—','—'), facHeld:T('施設','facs'), even:T('互角','Even'),
  evRemain:T('残り','Left'), evEnd:T('イベント終了','Ended'), phase1:T('フェーズ1','Phase 1'), phase2:T('フェーズ2','Phase 2'), phase3:T('終盤','Phase 3'),
  inField:T('在場中','In field'), outField:T('退出中','Out'), exitBtn:T('一時退出','Temp exit'), reenter:T('再入場','Re-enter'), reIn:T('再入場まで','Re-entry in'), reReady:T('再入場できます','Ready'), reFix:T('再入場CD','Re-entry'),
  sCap:T('占拠時間(秒)','Capture (s)'), sEvent:T('イベント時間(分)','Event (min)'), sReFix:T('再入場(固定)','Re-entry (fixed)'),
  cap:T('占拠中','Capturing'), capLeft:T('占拠まで','Capture in'), locked:T('未解放','Locked'), unlock:T('解放','Unlocks'),
  harvest:T('弾丸採集','Bullets'), done:T('採集完了','Collected'), tMin:T('分','m'),
  clickB:T('クリックで自軍が占拠開始','Click: Blue captures'), clickR:T('クリックで敵軍が占拠開始','Click: Red captures'), clickN:T('クリックで解除','Click to clear'),
  toClear:T('全施設を解除','Cleared'), toScatter:T('💥 奪取でポイントが半分散らばった','💥 Half the points scattered'), toLocked:T('まだ解放されていません','Not unlocked'), toEnd:T('イベント終了時刻に到達','Event ended'),
  toExit:T('一時退出しました','Left field'), toReenter:T('再入場しました','Re-entered'),
  initLbl:T('初回支配','First-cap'), tier:T('段階','Tier')
};
var MOCKCFG = { captureSec:120, eventMin:30, reentrySec:720 /* 12分固定 */, phase2Min:15, workshopMin:20 };
var SCATTER=0.5;
var KEYM='wos_fb_mock_v1';
function mockBlank(){ var o={owners:{},capturing:{},occSec:{},bank:{},harvestProg:{},harvestDone:{}};
  BUILDINGS.forEach(function(b){ o.owners[b.id]=null; o.capturing[b.id]=null; o.occSec[b.id]=0; o.bank[b.id]=0; o.harvestProg[b.id]=0; o.harvestDone[b.id]=false; }); return o; }
function mockDefaults(){ var o=mockBlank(); return Object.assign(o,{ score:{Blue:0,Red:0}, bullets:{Blue:0,Red:0}, elapsed:0, playing:false, speed:5, ended:false, brush:'Blue', capTimed:true, self:{inField:true,reentryRemain:0}, hideCat:{} }); }
function mockLoad(){ try{ var r=localStorage.getItem(KEYM); if(r){ var s=JSON.parse(r); var d=mockDefaults(); return Object.assign(d,s,{playing:false}); } }catch(e){} return mockDefaults(); }
var M = mockLoad();
function mockSave(){ try{ localStorage.setItem(KEYM, JSON.stringify(M)); }catch(e){} }
function unlockSec(b){ return b.openMin?b.openMin*60:0; }
function mVisible(b){ if(b.random) return M.elapsed>=unlockSec(b); return true; }
function mLocked(b){ return M.elapsed<unlockSec(b); }

/* Undo/Redo */
var mUndo=[], mRedo=[];
function mSnap(){ return JSON.parse(JSON.stringify({owners:M.owners,capturing:M.capturing,occSec:M.occSec,bank:M.bank,harvestProg:M.harvestProg,harvestDone:M.harvestDone,score:M.score,bullets:M.bullets})); }
function mPush(){ mUndo.push(mSnap()); if(mUndo.length>60)mUndo.shift(); mRedo=[]; }
function mRestore(s){ ['owners','capturing','occSec','bank','harvestProg','harvestDone','score','bullets'].forEach(function(k){ M[k]=s[k]; }); renderMock(); }
function mockUndo(){ if(!mUndo.length)return; mRedo.push(mSnap()); mRestore(mUndo.pop()); }
function mockRedo(){ if(!mRedo.length)return; mUndo.push(mSnap()); mRestore(mRedo.pop()); }

function sideHasBoiler(side){ return BUILDINGS.some(function(b){ return b.buff==='boiler' && M.owners[b.id]===side && !M.capturing[b.id]; }); }
function captureTime(side){ var t=MOCKCFG.captureSec; if(sideHasBoiler(side))t*=0.5; return Math.max(1,t); }
function mercTier(id){ return Math.max(1,Math.min(5,1+Math.floor(M.occSec[id]/60))); }

function mockApply(id){ var b=BMAP[id]; if(mLocked(b)){ toast(MS.toLocked); return; } if(M.ended)return; var br=M.brush; mPush();
  if(br==='clear'){ mockAbandon(id); }
  else { if(M.owners[id]===br && !M.capturing[id]){ mUndo.pop(); return; } if(M.capTimed){ M.capturing[id]={by:br,remain:captureTime(br),total:captureTime(br)}; } else { mockFinalize(id,br); } }
  renderMock();
}
function mockAbandon(id){ var b=BMAP[id]; M.owners[id]=null; M.capturing[id]=null; M.occSec[id]=0; M.bank[id]=0; if(b.id===12){ M.harvestProg[id]=0; M.harvestDone[id]=false; } }
function mockFinalize(id,by){ var b=BMAP[id], prev=M.owners[id];
  // 敵に奪われた → ポイントの半分が散らばって消失(残り半分は元所有者に残る)
  if(prev && prev!==by){
    if(b.id===12){ if(!M.harvestDone[id]){ var stored=(M.harvestProg[id]/b.harvest)*b.yield; var keep=stored*(1-SCATTER); M.harvestProg[id]=(keep/b.yield)*b.harvest; if(stored>1)toast(MS.toScatter); } }
    else { var scattered=M.bank[id]*SCATTER; M.score[prev]=Math.max(0,M.score[prev]-scattered); if(scattered>1)toast(MS.toScatter); }
  }
  M.owners[id]=by; M.capturing[id]=null; M.occSec[id]=0;
  if(by && b.init>0){ M.score[by]+=b.init; M.bank[id]=b.init; } else { M.bank[id]=0; }
}
function mockBulk(owner){ mPush(); BUILDINGS.forEach(function(b){ if(mLocked(b)||!mVisible(b))return; if(owner)mockFinalize(b.id,owner); else mockAbandon(b.id); }); renderMock(); }
function mockClear(){ mPush(); BUILDINGS.forEach(function(b){ mockAbandon(b.id); }); M.score={Blue:0,Red:0}; M.bullets={Blue:0,Red:0}; renderMock(); toast(MS.toClear); }

function buffsFor(side){ var o={atk:0,def:0,siege:0,cap:false,tp:false,inj:false}; BUILDINGS.forEach(function(b){ if(M.owners[b.id]!==side||M.capturing[b.id])return;
  if(b.buff==='armory'){ o.atk+=15; o.def+=15; } if(b.buff==='merc')o.siege=Math.max(o.siege,mercTier(b.id)*10); if(b.buff==='boiler')o.cap=true; if(b.buff==='transit')o.tp=true; if(b.buff==='injury')o.inj=true; }); return o; }
function perMinFor(side){ var s=0; BUILDINGS.forEach(function(b){ if(M.owners[b.id]===side&&!M.capturing[b.id])s+=b.pts; }); return s; }
function mCount(side){ var n=0; BUILDINGS.forEach(function(b){ if(M.owners[b.id]===side)n++; }); return n; }
function ownerColor(o){ return o==='Blue'?'#2256c8':o==='Red'?'#cf2e22':'#9fb6c8'; }
function ownerName(o){ return o==='Blue'?S.blue:o==='Red'?S.red:S.none; }

function renderMock(){ renderMockHeader(); renderMockBar(); renderMockMap(); renderMockPanel(); mockSave(); }

function renderMockHeader(){
  header.className='fs-head';
  header.innerHTML =
    '<div class="fs-title"><div class="t"><span class="dot"></span>'+MS.title+'</div><div class="s">'+MS.sub+'</div></div>'+
    '<div class="fs-tb">'+
      '<div class="fs-tg"><span class="lb">'+MS.grpPlace+'</span>'+
        '<button class="fs-tbtn b'+(M.brush==='Blue'?' on':'')+'" data-br="Blue"><span class="d" style="background:#2256c8"></span>'+MS.placeB+'</button>'+
        '<button class="fs-tbtn r'+(M.brush==='Red'?' on':'')+'" data-br="Red"><span class="d" style="background:#cf2e22"></span>'+MS.placeR+'</button>'+
        '<button class="fs-tbtn'+(M.brush==='clear'?' on':'')+'" data-br="clear">'+MS.placeN+'</button></div>'+
      '<div class="fs-tg"><span class="lb">'+MS.grpSim+'</span>'+
        '<button class="fs-tbtn" id="mPlay">'+(M.playing?MS.pause:MS.play)+'</button>'+
        '<select class="fs-tbtn" id="mSpeed"><option value="1">1×</option><option value="5">5×</option><option value="30">30×</option><option value="60">60×</option></select>'+
        '<button class="fs-tbtn" id="mReset">↺</button>'+
        '<label class="fs-tbtn" style="cursor:pointer"><input type="checkbox" id="mCap" style="margin-right:4px"'+(M.capTimed?' checked':'')+'>'+MS.capToggle+'</label></div>'+
      '<div class="fs-tg"><span class="lb">'+MS.grpBulk+'</span>'+
        '<button class="fs-tbtn b" id="mAllB">'+MS.allB+'</button><button class="fs-tbtn r" id="mAllR">'+MS.allR+'</button><button class="fs-tbtn" id="mClear">'+MS.clearAll+'</button></div>'+
      '<div class="fs-tg"><span class="lb">'+MS.grpEdit+'</span>'+
        '<button class="fs-tbtn" id="mUndo"'+(mUndo.length?'':' disabled')+'>'+MS.undo+'</button><button class="fs-tbtn" id="mRedo"'+(mRedo.length?'':' disabled')+'>'+MS.redo+'</button></div>'+
    '</div>';
  Array.prototype.forEach.call(document.querySelectorAll('.fs-tbtn[data-br]'),function(b){ b.addEventListener('click',function(){ M.brush=b.getAttribute('data-br'); renderMockHeader(); renderMockMap(); mockSave(); }); });
  $('mPlay').addEventListener('click',mockTogglePlay);
  var sp=$('mSpeed'); sp.value=String(M.speed); sp.addEventListener('change',function(e){ M.speed=parseInt(e.target.value,10)||5; });
  $('mReset').addEventListener('click',mockResetClock);
  $('mCap').addEventListener('change',function(e){ M.capTimed=e.target.checked; mockSave(); });
  $('mAllB').addEventListener('click',function(){ mockBulk('Blue'); }); $('mAllR').addEventListener('click',function(){ mockBulk('Red'); }); $('mClear').addEventListener('click',mockClear);
  $('mUndo').addEventListener('click',mockUndo); $('mRedo').addEventListener('click',mockRedo);
}

function renderMockBar(){
  var B=M.score.Blue,R=M.score.Red,total=B+R, bluePct=total>0?B/total:0.5, edge=(bluePct*100).toFixed(2);
  var net=perMinFor('Blue')-perMinFor('Red'), arrow;
  if(Math.abs(net)<1) arrow='<div class="fs-sb-even" style="left:'+edge+'%">'+MS.even+'</div>';
  else if(net>0) arrow='<div class="fs-sb-arr b" style="left:'+edge+'%">◀ '+fmtN(net)+'/'+T('分','m')+'</div>';
  else arrow='<div class="fs-sb-arr r" style="left:'+edge+'%">'+fmtN(-net)+'/'+T('分','m')+' ▶</div>';
  scorebar.innerHTML =
    '<div class="fs-sb-top"><div class="s b">'+fmtN(B)+'<small>● '+S.blue+' ・ '+mCount('Blue')+MS.facHeld+' ・ 🔫'+fmtN(M.bullets.Blue)+'</small></div>'+
      '<div class="s r"><small>🔫'+fmtN(M.bullets.Red)+' ・ '+mCount('Red')+MS.facHeld+' ・ '+S.red+' ●</small>'+fmtN(R)+'</div></div>'+
    '<div class="fs-sb-track"><div class="fs-sb-b" style="width:'+edge+'%"></div><div class="fs-sb-r" style="width:'+(100-edge)+'%"></div>'+
      '<div class="fs-sb-edge" style="left:'+edge+'%"></div><div class="fs-clash" style="left:'+edge+'%">⚔️</div>'+arrow+'</div>';
}

function renderMockMap(){
  arrows.innerHTML='';
  tiles.innerHTML='';
  BUILDINGS.forEach(function(b){
    if(!mVisible(b)){ return; }
    var o=M.owners[b.id], cap=M.capturing[b.id], shown=cap?cap.by:o, bc=ownerColor(shown), locked=mLocked(b);
    var div=document.createElement('div');
    div.className='fs-tile'+(b.big?' big':'')+(locked?' locked':''); div.style.left=b.x+'%'; div.style.top=b.y+'%';
    div.setAttribute('role','button'); div.setAttribute('tabindex','0'); div.setAttribute('aria-label','#'+b.num+' '+bname(b)+'｜'+(locked?MS.locked:(cap?(ownerName(cap.by)+MS.cap):ownerName(o))));
    var ring='';
    if(cap){ var p=1-cap.remain/cap.total; ring=ringSVG(ownerColor(cap.by),p,true); }
    else if(b.id===12 && o){ var hp=Math.min(1,M.harvestProg[b.id]/b.harvest); ring=ringSVG(M.harvestDone[b.id]?'#2faa54':'#f59f3a',hp,false); }
    div.innerHTML = ring +
      '<div class="fs-dia" style="border-color:'+bc+'"><div class="fs-occ" style="background:'+bc+';opacity:'+(shown?'':'0')+'"></div><div class="bld"></div>'+
        '<div class="fs-badge" style="background:'+(shown?'radial-gradient(circle at 38% 32%,'+bc+','+bc+')':'radial-gradient(circle at 38% 32%,#2f7fb0,#145079)')+';opacity:'+(locked?'.2':'1')+'">'+esc(b.num)+'</div></div>'+
      (locked?'<span class="lockico">🔒</span>':'')+'<div class="fs-pill">'+esc(b.short)+'</div>';
    div.addEventListener('click',function(){ mockApply(b.id); mShowTip(b.id); });
    div.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); mockApply(b.id);} });
    div.addEventListener('mouseenter',function(){ mShowTip(b.id); }); div.addEventListener('mouseleave',mHideTip);
    tiles.appendChild(div);
  });
  // オーバーレイ: 時計/フェーズ
  var ph=M.elapsed<MOCKCFG.phase2Min*60?MS.phase1:(M.elapsed<MOCKCFG.workshopMin*60?MS.phase2:MS.phase3);
  ovTL.className='fs-ov tl'; ovTL.innerHTML='<div class="pn fs-raj" style="font-size:15px">'+mmss(M.elapsed)+'</div><div class="pi">'+ph+'</div>';
  ovTR.className='fs-ov tr'; ovTR.innerHTML=''; brushInd.innerHTML='';
}
function ringSVG(color,p,spin){ var C=2*Math.PI*45; return '<svg class="fs-cap" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="'+color+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-p)).toFixed(1)+'" transform="rotate(-90 50 50)"'+(spin?' style="opacity:.95"':'')+'/></svg>'; }

/* 模擬戦ツールチップ(簡易) */
var mTipFor=null;
function mShowTip(id){ mTipFor=id; /* 詳細は施設一覧/バフで確認。タイルはaria-labelで補助 */ }
function mHideTip(){ mTipFor=null; }

function renderMockPanel(){
  panel.innerHTML = mockEventCard() + mockExitCard() + mockBuffCard() + mockListCard() + mockSetCard();
  mockWire();
}
function mockEventCard(){
  var ev=MOCKCFG.eventMin*60, rem=Math.max(0,ev-M.elapsed), nowPct=Math.min(100,M.elapsed/ev*100);
  var p2=MOCKCFG.phase2Min/MOCKCFG.eventMin*100, ws=MOCKCFG.workshopMin/MOCKCFG.eventMin*100;
  var ph=M.elapsed<MOCKCFG.phase2Min*60?MS.phase1:(M.elapsed<MOCKCFG.workshopMin*60?MS.phase2:MS.phase3);
  return '<div class="fs-card" id="evCard"><h3>'+MS.pEvent+'</h3><div style="display:flex;justify-content:space-between;align-items:baseline">'+
    '<span style="font:700 11px \'Noto Sans JP\';color:var(--fmut)">'+ph+'</span><span class="fs-raj" style="font:900 18px \'Rajdhani\'">'+(M.ended?MS.evEnd:(MS.evRemain+' '+mmss(rem)))+'</span></div>'+
    '<div class="fs-tl"><div class="now" style="width:'+nowPct+'%"></div><div class="pf" style="left:'+p2+'%"></div><div class="pl" style="left:'+p2+'%">'+MS.phase2+'</div>'+
    '<div class="pf" style="left:'+ws+'%"></div><div class="pl" style="left:'+ws+'%">'+T('工房','WS')+'</div></div></div>';
}
function mockExitCard(){
  var sf=M.self;
  if(sf.inField) return '<div class="fs-card" id="exCard"><h3>'+MS.pExit+'</h3><div class="fs-exit"><div class="st"><span class="pin" style="background:#2faa54"></span>'+MS.inField+'</div><button id="exitBtn">'+MS.exitBtn+'</button></div></div>';
  var ready=sf.reentryRemain<=0;
  return '<div class="fs-card" id="exCard"><h3>'+MS.pExit+'</h3><div class="fs-exit"><div class="st"><span class="pin" style="background:#e2462f"></span>'+MS.outField+'</div>'+
    '<div class="big" style="color:'+(ready?'#2faa54':'#cf2e22')+'">'+(ready?MS.reReady:(MS.reIn+' '+mmss(sf.reentryRemain)))+'</div>'+
    '<button id="reBtn"'+(ready?'':' disabled')+'>'+MS.reenter+'</button></div></div>';
}
function mockBuffCard(){
  var B=buffsFor('Blue'),R=buffsFor('Red');
  function rw(k,b,r,c){ return '<div class="fs-bf"><span class="k"'+(c?' style="color:#b4521a"':'')+'>'+k+'</span><span class="v"><span class="vb">'+b+'</span><span class="vr">'+r+'</span></span></div>'; }
  return '<div class="fs-card" id="bfCard"><h3>'+MS.pBuff+'</h3><div class="fs-buffs">'+
    rw(MS.bAtk,B.atk?'+'+B.atk+'%':MS.none2,R.atk?'+'+R.atk+'%':MS.none2)+
    rw(MS.bDef,B.def?'-'+B.def+'%':MS.none2,R.def?'-'+R.def+'%':MS.none2)+
    rw(MS.bSiege,B.siege?'+'+B.siege+'%':MS.none2,R.siege?'+'+R.siege+'%':MS.none2)+
    rw(MS.bCap,B.cap?MS.half:MS.none2,R.cap?MS.half:MS.none2)+
    rw(MS.bTp,B.tp?MS.half:MS.none2,R.tp?MS.half:MS.none2)+
    rw(MS.bInj,B.inj?'10%':MS.none2,R.inj?'10%':MS.none2,1)+'</div></div>';
}
function mockListCard(){
  var rows=BUILDINGS.filter(mVisible).map(function(b){ var o=M.owners[b.id],cap=M.capturing[b.id],locked=mLocked(b),col=cap?cap.by:o;
    var sub=locked?(MS.unlock+(b.openMin)+MS.tMin):cap?(MS.cap+' '+mmss(cap.remain)):(b.pts?('+'+b.pts+'/'+T('分','m')):(b.id===12?(fmtN(b.yield)+'🔫'):'—'));
    return '<div class="fs-fr '+(col==='Blue'?'b':col==='Red'?'r':'')+(locked?' lk':'')+'" data-id="'+b.id+'" role="button" tabindex="0"><span class="dot" style="background:'+ownerColor(col)+'"></span><span class="fn">'+(locked?'🔒':'')+'#'+b.num+' '+esc(bname(b))+'</span><span class="fp">'+sub+'</span></div>';
  }).join('');
  return '<div class="fs-card" id="lsCard"><h3>'+MS.pList+'</h3><div class="fs-flist">'+rows+'</div></div>';
}
function mockSetCard(){
  return '<div class="fs-card"><h3>'+MS.pSet+'</h3><div class="fs-set">'+
    '<label>'+MS.sCap+'<input type="number" id="csCap" value="'+MOCKCFG.captureSec+'" min="1"></label>'+
    '<label>'+MS.sEvent+'<input type="number" id="csEv" value="'+MOCKCFG.eventMin+'" min="1"></label>'+
    '<label>'+MS.sReFix+'<span class="fixed">12:00 ('+T('固定','fixed')+')</span></label>'+
    '</div></div>';
}
function mockWire(){
  Array.prototype.forEach.call(document.querySelectorAll('.fs-fr'),function(row){ row.addEventListener('click',function(){ mockApply(row.getAttribute('data-id')); }); });
  var eb=$('exitBtn'); if(eb)eb.addEventListener('click',function(){ M.self.inField=false; M.self.reentryRemain=MOCKCFG.reentrySec; renderMockPanel(); toast(MS.toExit); mockSave(); });
  var rb=$('reBtn'); if(rb)rb.addEventListener('click',function(){ if(M.self.reentryRemain<=0){ M.self.inField=true; renderMockPanel(); toast(MS.toReenter); mockSave(); } });
  var cap=$('csCap'); if(cap)cap.addEventListener('change',function(e){ var v=parseInt(e.target.value,10); if(v>0)MOCKCFG.captureSec=v; });
  var ev=$('csEv'); if(ev)ev.addEventListener('change',function(e){ var v=parseInt(e.target.value,10); if(v>0){ MOCKCFG.eventMin=v; renderMock(); } });
}

var mockStepT=null;
function mockTogglePlay(){ if(M.ended)return; M.playing=!M.playing; renderMockHeader(); }
function mockResetClock(){ M.playing=false; M.elapsed=0; M.ended=false; BUILDINGS.forEach(function(b){ M.occSec[b.id]=0; if(M.capturing[b.id])M.capturing[b.id]=null; }); M.self={inField:true,reentryRemain:0}; renderMock(); }
function mockStep(){ if(MODE!=='mock'||!M.playing||M.ended)return; var dt=0.1*M.speed; M.elapsed+=dt;
  BUILDINGS.forEach(function(b){ var cap=M.capturing[b.id]; if(cap){ cap.remain-=dt; if(cap.remain<=0)mockFinalize(b.id,cap.by); } });
  BUILDINGS.forEach(function(b){ var o=M.owners[b.id]; if(!o||M.capturing[b.id])return; M.occSec[b.id]+=dt;
    if(b.pts>0){ var add=b.pts/60*dt; M.score[o]+=add; M.bank[b.id]+=add; }
    if(b.id===12 && !M.harvestDone[b.id]){ M.harvestProg[b.id]+=dt; if(M.harvestProg[b.id]>=b.harvest){ M.harvestProg[b.id]=b.harvest; M.harvestDone[b.id]=true; M.bullets[o]+=b.yield; } } });
  if(!M.self.inField && M.self.reentryRemain>0) M.self.reentryRemain=Math.max(0,M.self.reentryRemain-dt);
  if(M.elapsed>=MOCKCFG.eventMin*60){ M.elapsed=MOCKCFG.eventMin*60; M.ended=true; M.playing=false; toast(MS.toEnd); renderMockHeader(); }
  renderMockBar(); renderMockMap();
  var ev=$('evCard'); if(ev)ev.outerHTML=mockEventCard(); var ex=$('exCard'); if(ex){ ex.outerHTML=mockExitCard(); var eb=$('exitBtn'); if(eb)eb.addEventListener('click',function(){ M.self.inField=false; M.self.reentryRemain=MOCKCFG.reentrySec; renderMockPanel(); }); var rb=$('reBtn'); if(rb)rb.addEventListener('click',function(){ if(M.self.reentryRemain<=0){ M.self.inField=true; renderMockPanel(); } }); }
  var bf=$('bfCard'); if(bf)bf.outerHTML=mockBuffCard(); var ls=$('lsCard'); if(ls){ ls.outerHTML=mockListCard(); Array.prototype.forEach.call(document.querySelectorAll('.fs-fr'),function(row){ row.addEventListener('click',function(){ mockApply(row.getAttribute('data-id')); }); }); }
  if(M.elapsed%2<dt)mockSave();
}

/* ===================== 静的テキスト・初期化 ===================== */
function buildStatic(){
  $('h1').innerHTML=S.h1a+' <span class="acc">'+S.h1b+'</span>';
  $('tag').textContent=S.tag; $('lead').innerHTML=S.lead;
  $('safeL').textContent=S.safe; $('safeR').textContent=S.safe;
  $('hHelp').textContent=S.hHelp; $('hData').textContent=S.hData;
  $('helpgrid').innerHTML=[['help1t','help1'],['help2t','help2'],['help3t','help3'],['help4t','help4']].map(function(p){ return '<div class="fb-help"><b>'+S[p[0]]+'</b><br>'+S[p[1]]+'</div>'; }).join('');
  $('dataNote').textContent =
    T('番号→施設 / 初回支配ポイント / 毎分: ','No.→facility / first-cap / per-min: ')+
    BUILDINGS.filter(function(b){return b.id!==12;}).map(function(b){ return '#'+b.num+'='+bname(b)+'('+fmtN(b.init)+'/+'+b.pts+')'; }).join(' / ')+
    T('。武器工房=20分後ランダム出現・総量4800を20分採集。敵に奪われるとポイントの半分が散らばって消失。中央(王室/倉庫/傭兵)は15分後開放。再入場は12分固定。数値は app.js の BUILDINGS / MOCKCFG で調整可能。',
      '. Workshop spawns +20m, 4800 over 20m. Losing a building scatters half its points. Center opens +15m. Re-entry fixed 12m. Edit BUILDINGS/MOCKCFG in app.js.');
  $('relbar').innerHTML=
    '<a href="../bear-hunt/index.html">'+T('→ 熊狩シミュレーター','→ Bear Hunt')+'</a>'+
    '<a href="../troop-ratio/index.html">'+T('→ 兵士比率シミュ','→ Troop Ratio')+'</a>'+
    '<a href="../king-castle/index.html">'+T('→ 王城戦','→ Castle Battle')+'</a>'+
    '<a href="../../guides/bear-hunt-guide.html">'+T('→ 攻略ガイド','→ Guides')+'</a>';
  if(EN){ $('htmlroot').lang='en'; document.title='Foundry Battle Field Tool | Whiteout Tools Lab'; $('crumb').innerHTML='<a href="../../index.html?lang=en">Home</a> &gt; Foundry Battle'; }
}
function init(){ buildStatic(); renderModeBar(); render(); mockStepT=setInterval(mockStep,100); }
if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
