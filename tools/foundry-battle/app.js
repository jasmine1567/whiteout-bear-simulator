/* =====================================================================
   兵器工場争奪戦 ツール  app.js  (v5)
   作戦シミュレータ(計画) ⇄ 模擬戦シミュレータ(敵を加えた試算)。共有リンク対応。
   ゲーム時間: 60分 / 0-3分=準備(移転・攻撃不可) / 3-18分=中央以外攻撃可 /
   18-60分=全施設攻撃可 / 23-60分=武器工房(四隅)出現。占拠120秒。占拠"開始"時に被占領側ポイント半分散逸。
   数値は BUILDINGS / BUFF / GAME で調整可能。
   ===================================================================== */
(function(){
"use strict";
var T=window.t||function(a){return a;}; var EN=(window.WOS_LANG||'ja')==='en';
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function mmss(sec){ sec=Math.max(0,Math.round(sec)); var m=Math.floor(sec/60),s=sec%60; return (m<10?'0':'')+m+':'+(s<10?'0':'')+s; }
function fmtN(n){ return Math.round(n).toLocaleString('en-US'); }
function avg(a){ return a.reduce(function(s,x){return s+x;},0)/a.length; }
var toastTimer=null;
function toast(m){ var t=$('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove('show');},1900); }
function track(a,p){ try{ if(window.gtag)gtag('event',a,Object.assign({tool:'foundry_battle'},p||{})); }catch(e){} }

/* ===== ゲーム共通仕様(分) ===== */
var GAME={ EVENT:60, PREP:3, CENTRAL:18, WORKSHOP:23, CAP_SEC:120, REENTRY_SEC:720 };
var SCATTER=0.5;

/* ===== バフ定義 ===== */
var BUFF={
  injury:{ja:'駐屯兵10%が2分毎に負傷(自軍/敵軍とも)',en:'10% troops injured /2min'},
  armory:{ja:'味方部隊 攻撃+15% / 被ダメ-15%',en:'ATK +15% / DMG −15%'},
  merc:{ja:'敵占領施設へ傭兵デバフ(攻撃/防御 -10〜50%)',en:'Merc debuff on enemy −10〜50%'},
  transit:{ja:'転移CT -50%(12→6分)',en:'Teleport CD −50%'},
  boiler:{ja:'占領時間 -50%(2→1分)',en:'Capture time −50%'}
};
function buffText(k){ return k?(EN?BUFF[k].en:BUFF[k].ja):''; }

/* ===== 拠点データ(正式名称/座標/初回支配ポイント/毎分/バフ/開放分) ===== */
var BUILDINGS=[
 {id:1, num:'1', ja:'王室兵器工場',  en:'Royal Foundry',  role:'フィールド中央の最重要拠点。全拠点の司令塔であり最終目標。', x:48,y:48, big:true, init:9000, pts:1800, buff:'injury', openMin:GAME.CENTRAL, cat:'prize'},
 {id:2, num:'2', ja:'第1武器試験場', en:'1st Weapon Test', role:'新型兵器を試験。確保で兵器性能が向上。', x:27,y:40, init:6000, pts:1200, openMin:GAME.PREP, cat:'point'},
 {id:3, num:'3', ja:'第2武器試験場', en:'2nd Weapon Test', role:'新型兵器を試験。確保で兵器性能が向上。', x:69,y:59, init:6000, pts:1200, openMin:GAME.PREP, cat:'point'},
 {id:4, num:'4', ja:'第1武器修理工場',en:'1st Repair Factory',role:'損傷した兵器を修理・補給。前線維持に重要。', x:20,y:56, init:3000, pts:600, openMin:GAME.PREP, cat:'point'},
 {id:5, num:'5', ja:'第2武器修理工場',en:'2nd Repair Factory',role:'損傷した兵器を修理・補給。前線維持に重要。', x:77,y:47, init:3000, pts:600, openMin:GAME.PREP, cat:'point'},
 {id:6, num:'6', ja:'第3武器修理工場',en:'3rd Repair Factory',role:'損傷した兵器を修理・補給。前線維持に重要。', x:33,y:83, init:3000, pts:600, openMin:GAME.PREP, cat:'point'},
 {id:7, num:'7', ja:'第4武器修理工場',en:'4th Repair Factory',role:'損傷した兵器を修理・補給。前線維持に重要。', x:59,y:14, init:3000, pts:600, openMin:GAME.PREP, cat:'point'},
 {id:8, num:'8', ja:'兵器倉庫',      en:'Armory',         role:'兵器を貯蔵する補給拠点。物資供給の要。', x:47,y:75, init:1200, pts:240, buff:'armory', openMin:GAME.CENTRAL, cat:'buff'},
 {id:9, num:'9', ja:'傭兵野営地',    en:'Mercenary Camp', role:'傭兵の増援拠点。確保で敵施設へデバフ。', x:47,y:27, init:1200, pts:240, buff:'merc', openMin:GAME.CENTRAL, cat:'buff'},
 {id:10,num:'10',ja:'中継所',        en:'Relay Station',  role:'補給線を中継。転移CTを短縮。', x:60,y:83, init:1200, pts:240, buff:'transit', openMin:GAME.PREP, cat:'util'},
 {id:11,num:'11',ja:'スチームボイラー',en:'Steam Boiler', role:'フィールド全体へ動力を供給。占領時間を短縮。', x:33,y:14, init:1200, pts:240, buff:'boiler', openMin:GAME.PREP, cat:'util'},
 {id:12,num:'12',ja:'武器工房①',    en:'Workshop 1',     role:'弾薬採集場。23分に四隅へ出現。占拠で総量4800を20分採集。', x:16,y:20, init:0, pts:0, openMin:GAME.WORKSHOP, appear:true, yield:4800, harvest:1200, cat:'res'},
 {id:13,num:'13',ja:'武器工房②',    en:'Workshop 2',     role:'弾薬採集場。23分に四隅へ出現。占拠で総量4800を20分採集。', x:84,y:20, init:0, pts:0, openMin:GAME.WORKSHOP, appear:true, yield:4800, harvest:1200, cat:'res'},
 {id:14,num:'14',ja:'武器工房③',    en:'Workshop 3',     role:'弾薬採集場。23分に四隅へ出現。占拠で総量4800を20分採集。', x:16,y:80, init:0, pts:0, openMin:GAME.WORKSHOP, appear:true, yield:4800, harvest:1200, cat:'res'},
 {id:15,num:'15',ja:'武器工房④',    en:'Workshop 4',     role:'弾薬採集場。23分に四隅へ出現。占拠で総量4800を20分採集。', x:84,y:80, init:0, pts:0, openMin:GAME.WORKSHOP, appear:true, yield:4800, harvest:1200, cat:'res'}
];
var BMAP={}; BUILDINGS.forEach(function(b){ BMAP[b.id]=b; });
function bname(b){ return EN?b.en:b.ja; }
var SHORT={1:'王室',2:'試1',3:'試2',4:'修1',5:'修2',6:'修3',7:'修4',8:'倉庫',9:'傭兵',10:'中継',11:'蒸気',12:'工1',13:'工2',14:'工3',15:'工4'};
function bshort(b){ return EN?('#'+b.num):(SHORT[b.id]||('#'+b.num)); }
function pillHTML(b){ return '<div class="fs-pill"><span class="nm-full">'+esc(bname(b))+'</span><span class="nm-short">'+esc(bshort(b))+'</span></div>'; }
var PALETTE=['#2DD4BF','#F4A83A','#A78BFA','#60A5FA','#F472B6','#A3E635','#FB7185','#38BDF8'];
var MAX_TEAMS=8;

/* DOM */
var tiles=$('tiles'), ovTL=$('ovTL'), ovTR=$('ovTR'), brushInd=$('brushInd'), scnBar=$('scnBar'),
    panel=$('panel'), header=$('toolHeader'), scorebar=$('scorebar'), banner=$('fsBanner'), modalHost=$('modalHost');
var SVGNS='http://www.w3.org/2000/svg';

/* ===== タイル委譲クリック(取りこぼし防止=自軍/敵軍切替の不具合対策) ===== */
tiles.addEventListener('click',function(e){ var el=e.target.closest('.fs-tile'); if(!el)return; var bid=+el.getAttribute('data-bid'); onTileClick(bid); });
tiles.addEventListener('keydown',function(e){ if(e.key!=='Enter'&&e.key!==' ')return; var el=e.target.closest('.fs-tile'); if(!el)return; e.preventDefault(); onTileClick(+el.getAttribute('data-bid')); });
function onTileClick(bid){ if(MODE==='mock'){ mockApply(bid); } else if(P.view==='edit'&&P.editTeamId){ planToggleAssign(bid); } else { P.selectedBuildingId=bid; renderPlan(); } }

/* ===== 共有(URLハッシュ) ===== */
function b64enc(s){ return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64dec(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return decodeURIComponent(escape(atob(s))); }
function shareURL(){ var c=SCN(); var data={v:2,n:c.name,t:c.teams,p:c.phases}; return location.origin+location.pathname+'#s='+b64enc(JSON.stringify(data)); }
function tryLoadShare(){ var m=/[#&]s=([^&]+)/.exec(location.hash||''); if(!m)return false;
  try{ var d=JSON.parse(b64dec(m[1])); if(d&&d.t&&d.p){ var sc=normScenario({id:uid('s'),name:(d.n||T('共有シナリオ','Shared'))+T('（共有）',' (shared)'),teams:d.t,phases:d.p}); P.scenarios.push(sc); P.currentId=sc.id; planBind(); P.editPhaseId=(P.phases[0]&&P.phases[0].id)||'p1'; planSave(); try{history.replaceState(null,'',location.pathname+location.search);}catch(e){} return true; } }catch(e){}
  return false; }
function openShareModal(){
  var url=shareURL();
  var html='<div class="fs-modal" id="shModal"><div class="box"><h4>'+T('シミュレーションを共有','Share simulation')+'</h4>'+
    '<p>'+T('下のURLを送ると、相手の画面で同じチーム編成・作戦フェーズが再現されます。模擬戦でもこの作戦が使われます。','Send this URL to reproduce your teams & phases on another device. The mock battle also uses it.')+'</p>'+
    '<textarea id="shUrl" readonly>'+esc(url)+'</textarea>'+
    '<div class="acts"><button id="shClose">'+T('閉じる','Close')+'</button><button class="pri" id="shCopy">'+T('URLをコピー','Copy URL')+'</button></div></div></div>';
  modalHost.innerHTML=html;
  $('shClose').addEventListener('click',function(){ modalHost.innerHTML=''; });
  $('shModal').addEventListener('click',function(e){ if(e.target.id==='shModal')modalHost.innerHTML=''; });
  $('shCopy').addEventListener('click',function(){ var ta=$('shUrl'); ta.select();
    function ok(){ toast(T('共有URLをコピーしました','Copied URL')); }
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(ok,function(){ try{document.execCommand('copy');ok();}catch(e){} }); }
    else { try{document.execCommand('copy');ok();}catch(e){} } });
  track('fb_share');
}

/* ===== モード ===== */
var MODE=(function(){ try{ return localStorage.getItem('wos_fb_mode')||'plan'; }catch(e){ return 'plan'; } })();
function setMode(m){ if(m===MODE)return; teardown(); MODE=m; try{localStorage.setItem('wos_fb_mode',m);}catch(e){} renderModeBar(); render(); track('fb_mode',{m:m}); }
function renderModeBar(){
  $('modeBar').innerHTML=
    '<button class="fs-mode'+(MODE==='plan'?' on':'')+'" data-m="plan"><span class="ic">🗺️</span>'+T('作戦シミュレータ','Op Planner')+'</button>'+
    '<button class="fs-mode'+(MODE==='mock'?' on':'')+'" data-m="mock"><span class="ic">⚔️</span>'+T('模擬戦シミュレータ','Mock Battle')+'</button>'+
    '<div class="fs-sharewrap"><button class="fs-share" id="shareBtn">🔗 '+T('共有','Share')+'</button></div>';
  Array.prototype.forEach.call(document.querySelectorAll('.fs-mode'),function(b){ b.addEventListener('click',function(){ setMode(b.getAttribute('data-m')); }); });
  $('shareBtn').addEventListener('click',openShareModal);
}
function teardown(){ if(planClockT){clearInterval(planClockT);planClockT=null;} P.clock.running=false; M.playing=false;
  tiles.innerHTML=''; ovTL.innerHTML=''; ovTR.innerHTML=''; brushInd.innerHTML=''; banner.innerHTML=''; }
function render(){ renderScnBar(); if(MODE==='plan'){ scorebar.style.display='none'; renderPlan(); } else { renderMock(); } }

function scnOptions(selId){ return P.scenarios.map(function(s){ return '<option value="'+s.id+'"'+(s.id===selId?' selected':'')+'>'+esc(s.name)+'</option>'; }).join(''); }
function renderScnBar(){
  if(MODE==='plan'){
    scnBar.style.display='';
    scnBar.innerHTML='<span class="lb">🗂 '+T('シナリオ','Scenario')+'</span>'+
      '<select id="scnSel">'+scnOptions(P.currentId)+'</select>'+
      '<button id="scnRen">'+T('名前変更','Rename')+'</button>'+
      '<button class="pri" id="scnNew">＋'+T('新規','New')+'</button>'+
      '<button class="pri" id="scnCopy">⧉ '+T('複製','Copy')+'</button>'+
      (P.scenarios.length>1?'<button class="dl" id="scnDel">'+T('削除','Delete')+'</button>':'')+
      '<span class="note">'+T('※ 模擬戦はこのシナリオ通りに自軍が自動行動','Mock auto-plays your side from this')+'</span>';
    $('scnSel').addEventListener('change',function(e){ selectScenario(e.target.value); });
    $('scnNew').addEventListener('click',function(){ addScenario(null); });
    $('scnCopy').addEventListener('click',function(){ addScenario(P.currentId); });
    $('scnRen').addEventListener('click',function(){ var v=window.prompt(T('シナリオ名','Scenario name'),SCN().name); if(v!=null&&v.trim())renameScenario(v.trim()); });
    var dl=$('scnDel'); if(dl)dl.addEventListener('click',function(){ if(window.confirm(T('このシナリオを削除しますか？','Delete this scenario?')))deleteScenario(); });
  } else {
    // 模擬戦: 自軍が従うシナリオを選択
    scnBar.style.display='';
    scnBar.innerHTML='<span class="lb">⚔ '+T('使用シナリオ','Scenario in play')+'</span>'+
      '<select id="mScnSel">'+scnOptions(M.scenarioId)+'</select>'+
      '<span class="note">'+T('※ 自軍はこの作戦シナリオ通りに自動で動きます','Your side auto-follows this plan')+'</span>';
    $('mScnSel').addEventListener('change',function(e){ M.scenarioId=e.target.value; mockSave(); renderMock(); });
  }
}

/* ===== ゲーム時間ヘルパ(共通) ===== */
function lockedAt(b,elapsedSec){ return elapsedSec < b.openMin*60; }
function visibleAt(b,elapsedSec){ if(b.appear) return elapsedSec>=b.openMin*60; return true; }
function ruleText(elapsedSec){ var m=elapsedSec/60;
  if(m<GAME.PREP) return T('準備時間：移転・攻撃ともに不可','Prep: no transfer or attacks');
  if(m<GAME.CENTRAL) return T('中央施設以外への攻撃が可能','Attack non-central facilities');
  return T('全施設(中央含む)への攻撃が可能','All facilities attackable')+(m>=GAME.WORKSHOP?T('・武器工房 出現中','・workshops active'):'');
}
function timelineHTML(elapsedSec){
  var ev=GAME.EVENT*60, now=Math.min(100,elapsedSec/ev*100);
  function mk(min,cls,lab){ var L=min/GAME.EVENT*100; return '<div class="pf '+cls+'" style="left:'+L+'%"></div><div class="pl" style="left:'+L+'%">'+lab+'</div>'; }
  return '<div class="fs-tl"><div class="now" style="width:'+now+'%"></div>'+
    mk(GAME.PREP,'ph',T('戦闘開始','Combat'))+mk(GAME.CENTRAL,'r',T('中央開放','Central'))+mk(GAME.WORKSHOP,'r',T('工房','Shops'))+'</div>';
}

/* =====================================================================
   ================= 作戦シミュレータ (PLANNER) =================
   ===================================================================== */
var KEYP='wos_fieldsim_v3';
function sampleScenario(){
  return { id:'sample', name:T('サンプルシナリオ','Sample scenario'),
    teams:[ {id:'t1',name:T('Aチーム','Team A'),color:'#2DD4BF',leader:T('Aさん','A-san')}, {id:'t2',name:T('Bチーム','Team B'),color:'#F4A83A',leader:T('Bさん','B-san')}, {id:'t3',name:T('Cチーム','Team C'),color:'#A78BFA',leader:T('Cさん','C-san')} ],
    phases:[
      {id:'p1',name:T('開幕時の初回占領狙い','Opening grab'),time:3, desc:T('準備明け。外周の試験場・修理工場・中継所・ボイラーを各チームで一斉に初回占領。中央はまだ開放されない。','Right after prep: grab outer test/repair/relay/boiler. Center still locked.'), assign:{'11':'t1','4':'t1','2':'t2','7':'t2','3':'t3','5':'t3'}},
      {id:'p2',name:T('フェーズ２','Phase 2'),time:20, desc:T('中央が開放(18分)。傭兵野営地・兵器倉庫を確保しバフを固めつつ、王室兵器工場へ圧力をかける。','Center opens (18m). Take camp & armory, pressure the Royal Foundry.'), assign:{'9':'t1','6':'t1','8':'t2','10':'t2','3':'t3','1':'t3'}},
      {id:'p3',name:T('後半戦','Late game'),time:45, desc:T('武器工房(四隅)で弾薬を稼ぎつつ、王室兵器工場の保持を最優先。要所を厚く守る。','Farm workshops; prioritize holding the Royal Foundry.'), assign:{'1':'t1','12':'t2','13':'t2','14':'t3','15':'t3'}},
      {id:'p4',name:T('終了5分前','Final 5 min'),time:55, desc:T('全チームで王室兵器工場と高得点拠点を死守。被占領で半分散逸するため、終盤の奪取に注意。','All-in defense of high-value points; beware late steals (half scatters).'), assign:{'1':'t1','9':'t1','8':'t2','2':'t2','3':'t3'}}
    ]
  };
}
function planDefaults(){ var sc=sampleScenario(); return { scenarios:[sc], currentId:sc.id, teams:sc.teams, phases:sc.phases, view:'home', editTeamId:null, editPhaseId:'p1', clock:{elapsed:0,running:false}, speed:10, selectedBuildingId:null }; }
function normScenario(sc){ if(!sc.teams)sc.teams=[]; if(!sc.phases)sc.phases=[]; sc.teams.forEach(function(t){if(t.leader==null)t.leader='';}); sc.phases.forEach(function(p){if(!p.assign)p.assign={}; if(p.desc==null)p.desc='';}); return sc; }
function planLoad(){ try{ var r=localStorage.getItem(KEYP); if(r){ var s=JSON.parse(r);
  if(s.scenarios&&s.scenarios.length){ s.scenarios.forEach(normScenario);
    var st={ scenarios:s.scenarios, currentId:(s.scenarios.some(function(x){return x.id===s.currentId;})?s.currentId:s.scenarios[0].id),
      view:s.view==='edit'?'edit':'home', editTeamId:null, editPhaseId:s.editPhaseId||(s.scenarios[0].phases[0]&&s.scenarios[0].phases[0].id)||'p1',
      clock:{elapsed:(s.clock&&s.clock.elapsed)||0,running:false}, speed:s.speed||30, selectedBuildingId:null };
    var cur=st.scenarios.find(function(x){return x.id===st.currentId;}); st.teams=cur.teams; st.phases=cur.phases; return st; } } }catch(e){}
  return planDefaults(); }
var P=planLoad();
function SCN(){ return P.scenarios.find(function(s){return s.id===P.currentId;})||P.scenarios[0]; }
function planBind(){ var c=SCN(); P.teams=c.teams; P.phases=c.phases; }
function planSave(){ try{ localStorage.setItem(KEYP, JSON.stringify({scenarios:P.scenarios,currentId:P.currentId,view:P.view,editPhaseId:P.editPhaseId,clock:{elapsed:P.clock.elapsed},speed:P.speed})); }catch(e){} }
function uid(p){ return (p||'x')+Date.now().toString(36)+Math.floor(Math.random()*900+100); }
function selectScenario(id){ if(!P.scenarios.some(function(s){return s.id===id;}))return; P.currentId=id; planBind(); P.editTeamId=null; P.selectedBuildingId=null; P.editPhaseId=(P.phases[0]&&P.phases[0].id)||'p1'; renderPlan(); }
function addScenario(copyFromId){
  var src=copyFromId?P.scenarios.find(function(s){return s.id===copyFromId;}):null;
  var sc; if(src){ sc=JSON.parse(JSON.stringify(src)); sc.id=uid('s'); sc.name=src.name+T(' のコピー',' copy'); }
  else { sc={id:uid('s'),name:T('新規シナリオ','New scenario'),teams:[{id:'t1',name:T('Aチーム','Team A'),color:'#2DD4BF',leader:T('Aさん','A-san')}],phases:[{id:'p1',name:T('フェーズ1','Phase 1'),time:3,desc:'',assign:{}}]}; }
  P.scenarios.push(sc); selectScenario(sc.id);
}
function renameScenario(name){ SCN().name=name; var sel=$('scnSel'); if(sel){var o=sel.options[sel.selectedIndex]; if(o)o.text=name;} planSave(); }
function deleteScenario(){ if(P.scenarios.length<=1)return; P.scenarios=P.scenarios.filter(function(s){return s.id!==P.currentId;}); P.currentId=P.scenarios[0].id; planBind(); P.editTeamId=null; P.editPhaseId=(P.phases[0]&&P.phases[0].id)||'p1'; renderPlan(); }
function pTeam(id){ return P.teams.find(function(t){return t.id===id;})||null; }
function pPhaseById(id){ return P.phases.find(function(p){return p.id===id;})||P.phases[0]; }
function pPhasesSorted(){ return P.phases.slice().sort(function(a,b){return a.time-b.time;}); }
function pActivePhase(){ var el=P.clock.elapsed, sorted=pPhasesSorted(), cur=null; sorted.forEach(function(p){ if(p.time*60<=el)cur=p; }); return cur; }
function pViewPhase(){ if(P.view==='home') return pActivePhase(); return pPhaseById(P.editPhaseId); }
function pHolder(bid,ph){ ph=ph||pViewPhase(); if(!ph)return null; var tid=ph.assign[String(bid)]; return tid?pTeam(tid):null; }
function scenarioReady(phs){ phs=phs||P.phases; return phs.some(function(p){return Object.keys(p.assign).length>0;}); }
function mockScenario(){ return P.scenarios.find(function(s){return s.id===M.scenarioId;})||P.scenarios[0]; }

function renderPlan(){ renderScnBar(); scorebar.style.display='none'; renderPlanHeader(); renderPlanBanner(); renderPlanMap(); renderPlanPanel(); planSave(); }

function renderPlanHeader(){
  header.className='fs-head';
  var sub='<div class="fs-subnav"><button class="fs-tab'+(P.view==='home'?' on':'')+'" data-v="home">'+T('ホーム(再生)','Home')+'</button><button class="fs-tab'+(P.view==='edit'?' on':'')+'" data-v="edit">'+T('チーム編集','Teams')+'</button></div>';
  if(P.view==='home'){
    var cl=P.clock;
    function spd(v){ return '<button class="fs-spbtn'+(P.speed===v?' on':'')+'" data-s="'+v+'">×'+v+'</button>'; }
    header.innerHTML='<div class="fs-title"><div class="t"><span class="dot"></span>'+T('作戦シミュレータ','Op Planner')+'</div><div class="s">'+T('ゲーム開始からの時間で作戦が進行','Plays out from game start')+'</div></div>'+sub+
      '<div class="fs-transport">'+
        '<button class="fs-bigplay'+(cl.running?' playing':'')+'" id="pPlay"><span class="ic">'+(cl.running?'⏸':'▶')+'</span>'+(cl.running?T('一時停止','Pause'):T('シミュレーション開始','Start sim'))+'</button>'+
        '<div class="fs-clockbox"><span class="lab">'+T('経過','Elapsed')+'</span><span class="fs-clock'+(cl.running?' run':'')+'">'+mmss(cl.elapsed)+'</span><span class="lab">/ 60:00</span></div>'+
        '<div class="fs-spd"><span class="lab">'+T('速度','Speed')+'</span>'+spd(1)+spd(5)+spd(10)+spd(30)+spd(60)+'</div>'+
        '<button class="fs-rew" id="pReset"><span class="ic">⏮</span>'+T('最初から','Restart')+'</button>'+
      '</div>';
    $('pPlay').addEventListener('click',planTogglePlay);
    Array.prototype.forEach.call(document.querySelectorAll('.fs-spd .fs-spbtn'),function(btn){ btn.addEventListener('click',function(){ P.speed=parseInt(btn.getAttribute('data-s'),10)||10; Array.prototype.forEach.call(document.querySelectorAll('.fs-spd .fs-spbtn'),function(x){x.classList.remove('on');}); btn.classList.add('on'); planSave(); }); });
    $('pReset').addEventListener('click',function(){ P.clock.elapsed=0; P.clock.running=false; if(planClockT){clearInterval(planClockT);planClockT=null;} renderPlan(); });
  } else {
    header.innerHTML='<div class="fs-title"><div class="t"><span class="dot"></span>'+T('チーム編集','Team setup')+'</div><div class="s">'+T('チーム編成とフェーズ別の作戦内容を設定','Set teams & per-phase plans')+'</div></div>'+sub;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.fs-tab'),function(b){ b.addEventListener('click',function(){ P.view=b.getAttribute('data-v'); P.editTeamId=null; P.selectedBuildingId=null; renderPlan(); }); });
}

function renderPlanBanner(){
  if(P.view!=='home'){ banner.innerHTML=''; return; }
  var ph=pActivePhase(), el=P.clock.elapsed;
  var nm,no;
  if(!ph){ nm=T('準備フェーズ（移転禁止）','Prep phase'); no=T('開始3分間は移転・攻撃ともにできません。各チームはセーフエリアで待機します。','First 3 min: no transfer or attacks. Wait at the safe areas.'); }
  else { nm=ph.name; no=ph.desc||''; }
  banner.innerHTML='<div class="fs-banner"><div class="ph"><span>'+T('現在の作戦','Current plan')+'</span><span class="clk">'+mmss(el)+' / '+GAME.EVENT+':00</span></div>'+
    '<div class="nm">'+esc(nm)+'</div><div class="no">'+esc(no)+'</div><div class="rule">'+ruleText(el)+'</div></div>';
}

function renderPlanMap(){
  var ph=pViewPhase(), el=(P.view==='home')?P.clock.elapsed:GAME.EVENT*60;
  tiles.innerHTML='';
  BUILDINGS.forEach(function(b){
    var holder=pHolder(b.id,ph), sel=P.selectedBuildingId===b.id;
    var isEditTeam=P.view==='edit'&&P.editTeamId;
    var mine=holder&&P.editTeamId&&holder.id===P.editTeamId;
    var bc=holder?holder.color:'#9fb6c8';
    var tag = b.openMin===GAME.CENTRAL?('<span class="tag">'+T('18分開放','+18m')+'</span>') : b.appear?('<span class="tag">'+T('23分出現','+23m')+'</span>') : '';
    var lead = (holder&&holder.leader)?('<span class="fs-leadtag" style="background:'+bc+'">'+esc(holder.leader)+'</span>'):'';
    var cls='fs-tile'+(b.big?' big':'')+(sel?' sel':'')+(lead?' hasocc':'');
    if(isEditTeam && holder && !mine) cls+=' dim';
    var div=document.createElement('div'); div.className=cls; div.style.left=b.x+'%'; div.style.top=b.y+'%';
    div.setAttribute('data-bid',b.id); div.setAttribute('role','button'); div.setAttribute('tabindex','0');
    div.setAttribute('aria-label','#'+b.num+' '+bname(b)+(holder?('｜'+holder.name):''));
    div.innerHTML='<div class="fs-dia" style="border-color:'+bc+'"><div class="fs-occ" style="background:'+bc+';opacity:'+(holder?'':'0')+'"></div><div class="bld"></div><div class="fs-badge">'+esc(b.num)+'</div></div>'+lead+tag+pillHTML(b);
    tiles.appendChild(div);
  });
  // オーバーレイ
  if(ph){ var held=Object.keys(ph.assign).length;
    ovTL.className='fs-ov tl'; ovTL.innerHTML='<div class="pn">'+esc(ph.name)+'</div><div class="pi">'+(ph.time)+T('分','m')+' · '+held+T('拠点','held')+'</div>'; }
  else { ovTL.className='fs-ov tl'; ovTL.innerHTML='<div class="pn">'+T('準備中','Prep')+'</div><div class="pi">0:00–3:00</div>'; }
  ovTR.innerHTML=''; 
  // 編集中チームの筆インジケータ
  var et=P.editTeamId&&pTeam(P.editTeamId);
  brushInd.innerHTML = et ? '<div class="fs-brush"><span class="dot" style="background:'+et.color+'"></span>'+T('割当中','Editing')+'：'+esc(et.name)+' — '+T('拠点クリックで担当ON/OFF','click tiles')+'</div>' : '';
}

function renderPlanPanel(){
  if(P.view==='home'){ panel.innerHTML = planDetailCard() + planBuffCard() + planPointsCard() + planTimeCard(); }
  else if(P.editTeamId){ panel.innerHTML = teamPlanPanel(); }
  else { panel.innerHTML = planTeamsCard() + planPhasesCard() + planTimeCard(); }
  planWire();
}

/* --- ホーム: 拠点情報 --- */
function planDetailCard(){
  var b=P.selectedBuildingId?BMAP[P.selectedBuildingId]:null;
  if(!b) return '<div class="fs-card"><h3>'+T('拠点の情報','Building info')+'</h3><div class="fs-hint">'+T('マップの拠点をクリックすると、ここに名称・役割・ポイント・バフ・開放時間が表示されます。','Click a building to see its name, role, points, buff and open time.')+'</div></div>';
  var holder=pHolder(b.id,pActivePhase());
  var meta='<span class="m">'+T('初回支配','First-cap')+' '+fmtN(b.init)+'</span><span class="m">+'+b.pts+'/'+T('分','m')+'</span>';
  if(b.buff) meta+='<span class="m buff">'+esc(buffText(b.buff))+'</span>';
  meta+='<span class="m">'+(b.appear?T('23分に四隅へ出現','+23m corners'):(b.openMin===GAME.CENTRAL?T('18分開放','opens +18m'):T('3分開放','opens +3m')))+'</span>';
  if(b.cat==='res') meta+='<span class="m">'+T('弾薬 総量4800/20分','4800 bullets/20m')+'</span>';
  return '<div class="fs-card"><h3>'+T('拠点の情報','Building info')+'</h3><div class="fs-det">'+
    '<div class="hd"><div class="nb">'+esc(b.num)+'</div><div class="nm">'+esc(bname(b))+'</div></div>'+
    '<div class="role">'+esc(b.role)+'</div><div class="meta">'+meta+'</div>'+
    (holder?'<div style="margin-top:8px;font:700 11px \'Noto Sans JP\';color:'+holder.color+'">'+T('現在の担当：','Assigned: ')+esc(holder.name)+(holder.leader?(' ('+esc(holder.leader)+')'):'')+'</div>':'')+
    '</div></div>';
}
function aggBuffs(ph){ var o={atk:0,def:0,merc:false,tp:false,cap:false,inj:false}; if(!ph)return o;
  Object.keys(ph.assign).forEach(function(k){ var b=BMAP[+k]; if(!b)return; if(b.buff==='armory'){o.atk+=15;o.def+=15;} if(b.buff==='merc')o.merc=true; if(b.buff==='transit')o.tp=true; if(b.buff==='boiler')o.cap=true; if(b.buff==='injury')o.inj=true; }); return o; }
function planBuffCard(){
  var o=aggBuffs(pActivePhase());
  function rw(k,v,on){ return '<div class="fs-bf"><span class="k">'+k+'</span><span class="v'+(on?'':' off')+'">'+v+'</span></div>'; }
  return '<div class="fs-card"><h3>'+T('全体バフ(全チーム共有)','Alliance buffs')+'</h3><div class="fs-buffs">'+
    rw(T('部隊 攻撃','Troop ATK'),o.atk?'+'+o.atk+'%':'—',o.atk)+
    rw(T('被ダメージ','DMG taken'),o.def?'-'+o.def+'%':'—',o.def)+
    rw(T('傭兵デバフ','Merc debuff'),o.merc?'ON':'—',o.merc)+
    rw(T('転移CT','Teleport CD'),o.tp?'-50%':'—',o.tp)+
    rw(T('占領時間','Capture time'),o.cap?'-50%':'—',o.cap)+
    rw(T('駐屯兵 負傷','Garrison injury'),o.inj?'10%':'—',o.inj)+
  '</div></div>';
}
function planPointsCard(){
  var ph=pActivePhase(), total=0, per=0;
  if(ph)Object.keys(ph.assign).forEach(function(k){ var b=BMAP[+k]; if(b){ per+=b.pts; total+=b.init; } });
  return '<div class="fs-card"><h3>'+T('占領ポイント(現フェーズ計画)','Planned points')+'</h3><div class="fs-buffs">'+
    '<div class="fs-bf"><span class="k">'+T('初回支配 合計','First-cap total')+'</span><span class="v b">'+fmtN(total)+'</span></div>'+
    '<div class="fs-bf"><span class="k">'+T('毎分 合計','Per-min total')+'</span><span class="v b">+'+fmtN(per)+'</span></div></div></div>';
}
function planTimeCard(){
  return '<div class="fs-card"><h3>'+T('ゲーム時間の仕様','Match timeline')+'</h3>'+timelineHTML(P.view==='home'?P.clock.elapsed:0)+
    '<div class="fs-hint" style="margin-top:2px">'+T('0–3分 準備(移転・攻撃不可) ／ 3–18分 中央以外を攻撃可 ／ 18–60分 全施設攻撃可 ／ 23分 武器工房が四隅に出現。','0–3 prep / 3–18 outer / 18–60 all / 23 workshops appear.')+'</div></div>';
}

/* --- 編集: チーム一覧 --- */
function planTeamsCard(){
  var rows=P.teams.map(function(t){
    var cnt=0; P.phases.forEach(function(p){ for(var k in p.assign){ if(p.assign[k]===t.id)cnt++; } });
    return '<div class="fs-team" data-id="'+t.id+'"><input type="color" value="'+t.color+'" class="tc"><input type="text" value="'+esc(t.name)+'" class="tn" maxlength="18"><span class="cnt">'+cnt+'</span><button class="del">×</button></div>'+
      '<div class="fs-leadrow"><span class="lab">'+T('終結主','Leader')+'</span><input type="text" class="ld" value="'+esc(t.leader||'')+'" placeholder="'+T('リーダー名','Leader')+'" maxlength="16" data-id="'+t.id+'"></div>'+
      '<button class="fs-editbtn" data-id="'+t.id+'">'+T('このチームの作戦を編集 →','Edit this team\u2019s plan →')+'</button>';
  }).join('');
  var add=P.teams.length>=MAX_TEAMS?'<span class="add" style="opacity:.5;cursor:default">'+T('最大8','Max 8')+'</span>':'<span class="add" id="addTeam">'+T('＋追加','＋Add')+'</span>';
  return '<div class="fs-card"><h3>'+T('チーム編成','Teams')+add+'</h3>'+rows+'</div>';
}
function planPhasesCard(){
  var ep=pPhaseById(P.editPhaseId);
  var list=pPhasesSorted().map(function(p){ return '<div class="fs-prow'+(p.id===ep.id?' on':'')+'" data-id="'+p.id+'"><span class="pn">'+esc(p.name)+'</span><span class="pt">'+p.time+T('分','m')+'</span></div>'; }).join('');
  return '<div class="fs-card"><h3>'+T('作戦フェーズ','Phases')+'<span class="add" id="addPhase">'+T('＋追加','＋Add')+'</span></h3><div class="fs-plist">'+list+'</div>'+
    '<div class="fs-pedit"><span class="lab">'+T('フェーズ名','Phase name')+'</span><input type="text" id="peName" value="'+esc(ep.name)+'" maxlength="24">'+
    '<div class="row2"><span class="lab">'+T('開始(分)','Start (min)')+'</span><input type="number" id="peTime" value="'+ep.time+'" min="0" max="60"></div>'+
    '<span class="lab">'+T('このフェーズの作戦内容(説明)','Plan for this phase')+'</span><textarea id="peDesc" placeholder="'+T('例: 外周を一斉占領…','e.g. seize outer ring…')+'">'+esc(ep.desc||'')+'</textarea>'+
    '<div class="fs-pbtns"><button id="dupPhase">'+T('複製','Dup')+'</button><button class="del" id="delPhase">'+T('削除','Del')+'</button></div></div></div>';
}

/* --- 編集: 個別チームの作戦編集 --- */
function teamPlanPanel(){
  var t=pTeam(P.editTeamId); if(!t){ P.editTeamId=null; return planTeamsCard(); }
  var ep=pPhaseById(P.editPhaseId);
  var phs=pPhasesSorted().map(function(p){ return '<div class="fs-prow'+(p.id===ep.id?' on':'')+'" data-id="'+p.id+'"><span class="pn">'+esc(p.name)+'</span><span class="pt">'+p.time+T('分','m')+'</span></div>'; }).join('');
  var mine=Object.keys(ep.assign).filter(function(k){return ep.assign[k]===t.id;}).map(function(k){ return esc(bname(BMAP[+k])); });
  return '<div class="fs-card"><h3><span style="display:inline-flex;align-items:center;gap:7px"><span style="width:12px;height:12px;border-radius:3px;background:'+t.color+'"></span>'+esc(t.name)+'</span><span class="add" id="backTeams">← '+T('一覧へ','Back')+'</span></h3>'+
    '<div class="fs-team" data-id="'+t.id+'" style="padding-top:0"><input type="color" value="'+t.color+'" class="tc"><input type="text" value="'+esc(t.name)+'" class="tn" maxlength="18"></div>'+
    '<div class="fs-leadrow"><span class="lab">'+T('終結主','Leader')+'</span><input type="text" class="ld" value="'+esc(t.leader||'')+'" placeholder="'+T('リーダー名','Leader')+'" maxlength="16" data-id="'+t.id+'"></div></div>'+
    '<div class="fs-card"><h3>'+T('フェーズを選択','Pick phase')+'</h3><div class="fs-plist">'+phs+'</div>'+
      '<span class="fs-pedit lab" style="display:block;margin-bottom:5px">'+T('このフェーズの作戦内容','Plan for this phase')+'</span>'+
      '<textarea id="peDesc" class="fs-pedit" style="width:100%;min-height:54px;border:1px solid var(--fline);border-radius:7px;padding:6px 8px;font:500 12px \'Noto Sans JP\'">'+esc(ep.desc||'')+'</textarea>'+
      '<div class="fs-hint" style="margin-top:8px"><b>'+T('担当拠点','Targets')+'：</b>'+(mine.length?mine.join('、'):T('（マップの拠点をクリックして設定）','(click buildings on the map)'))+'</div>'+
    '</div>';
}

function planWire(){
  // home play handled in header
  // teams card
  var at=$('addTeam'); if(at)at.addEventListener('click',function(){ if(P.teams.length>=MAX_TEAMS)return; var id='t'+Date.now().toString(36); P.teams.push({id:id,name:(EN?'Team ':'チーム')+(P.teams.length+1),color:PALETTE[P.teams.length%PALETTE.length],leader:''}); renderPlan(); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-team'),function(row){ var id=row.getAttribute('data-id');
    var tc=row.querySelector('.tc'); if(tc)tc.addEventListener('input',function(e){ pTeam(id).color=e.target.value; planSoft(); });
    var tn=row.querySelector('.tn'); if(tn)tn.addEventListener('input',function(e){ pTeam(id).name=e.target.value; planSoft(); });
    var del=row.querySelector('.del'); if(del)del.addEventListener('click',function(){ if(P.teams.length<=1)return; P.teams=P.teams.filter(function(t){return t.id!==id;}); P.phases.forEach(function(p){ for(var k in p.assign){ if(p.assign[k]===id)delete p.assign[k]; } }); if(P.editTeamId===id)P.editTeamId=null; renderPlan(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-leadrow .ld'),function(inp){ inp.addEventListener('input',function(e){ var t=pTeam(inp.getAttribute('data-id')); if(t)t.leader=e.target.value; planSave(); }); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-editbtn'),function(b){ b.addEventListener('click',function(){ P.editTeamId=b.getAttribute('data-id'); P.selectedBuildingId=null; renderPlan(); }); });
  var bk=$('backTeams'); if(bk)bk.addEventListener('click',function(){ P.editTeamId=null; renderPlan(); });
  // phases
  var ap=$('addPhase'); if(ap)ap.addEventListener('click',function(){ var id='p'+Date.now().toString(36); P.phases.push({id:id,name:(EN?'Phase ':'フェーズ')+(P.phases.length+1),time:Math.min(60,(pPhasesSorted().slice(-1)[0]||{time:0}).time+5),desc:'',assign:{}}); P.editPhaseId=id; renderPlan(); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-prow'),function(row){ row.addEventListener('click',function(){ P.editPhaseId=row.getAttribute('data-id'); renderPlan(); }); });
  var pn=$('peName'); if(pn)pn.addEventListener('input',function(e){ pPhaseById(P.editPhaseId).name=e.target.value; planSave(); var on=document.querySelector('.fs-prow.on .pn'); if(on)on.textContent=e.target.value; });
  var ptm=$('peTime'); if(ptm)ptm.addEventListener('change',function(e){ var v=parseInt(e.target.value,10); if(isNaN(v))v=0; v=Math.max(0,Math.min(60,v)); pPhaseById(P.editPhaseId).time=v; renderPlan(); });
  var pd=$('peDesc'); if(pd)pd.addEventListener('input',function(e){ pPhaseById(P.editPhaseId).desc=e.target.value; planSave(); });
  var dup=$('dupPhase'); if(dup)dup.addEventListener('click',function(){ var cur=pPhaseById(P.editPhaseId); var id='p'+Date.now().toString(36); P.phases.push(Object.assign({},cur,{id:id,name:cur.name+(EN?' copy':' 複製'),time:Math.min(60,cur.time+1),assign:Object.assign({},cur.assign)})); P.editPhaseId=id; renderPlan(); });
  var delp=$('delPhase'); if(delp)delp.addEventListener('click',function(){ if(P.phases.length<=1)return; P.phases=P.phases.filter(function(p){return p.id!==P.editPhaseId;}); P.editPhaseId=P.phases[0].id; renderPlan(); });
}
function planSoft(){ renderPlanMap(); planSave(); }
function planToggleAssign(bid){ var ep=pPhaseById(P.editPhaseId); if(ep.assign[String(bid)]===P.editTeamId)delete ep.assign[String(bid)]; else ep.assign[String(bid)]=P.editTeamId; renderPlanMap(); var host=document.querySelector('.fs-hint b'); if(host){ renderPlanPanel(); } planSave(); }

var planClockT=null;
function planTogglePlay(){
  if(planClockT){ clearInterval(planClockT); planClockT=null; P.clock.running=false; renderPlanHeader(); return; }
  if(P.clock.elapsed>=GAME.EVENT*60)P.clock.elapsed=0;
  P.clock.running=true; renderPlanHeader();
  planClockT=setInterval(function(){ if(MODE!=='plan'||P.view!=='home'){ return; } P.clock.elapsed+=0.1*P.speed;
    var ended=false;
    if(P.clock.elapsed>=GAME.EVENT*60){ P.clock.elapsed=GAME.EVENT*60; clearInterval(planClockT); planClockT=null; P.clock.running=false; ended=true; }
    var cl=document.querySelector('.fs-clock'); if(cl)cl.textContent=mmss(P.clock.elapsed);
    renderPlanBanner(); renderPlanMap();
    var tcard=document.querySelector('.fs-tl .now'); if(tcard)tcard.style.width=Math.min(100,P.clock.elapsed/(GAME.EVENT*60)*100)+'%';
    refreshPlanHomeCards();
    if(ended)renderPlanHeader();
    if(P.clock.elapsed%2<0.1*P.speed)planSave();
  },100);
}
function refreshPlanHomeCards(){ if(P.view!=='home')return;
  var cards=panel.children; // detail,buff,points,time
  if(cards[1]) cards[1].outerHTML=planBuffCard();
  var cards2=panel.children; if(cards2[2]) cards2[2].outerHTML=planPointsCard();
}

/* =====================================================================
   ================= 模擬戦シミュレータ (MOCK) =================
   ===================================================================== */
var KEYM='wos_fb_mock_v5';
function mockBlank(){ var o={owners:{},capturing:{},occSec:{},bank:{},harvestProg:{},harvestDone:{},firstTaken:{}};
  BUILDINGS.forEach(function(b){ o.owners[b.id]=null; o.capturing[b.id]=null; o.occSec[b.id]=0; o.bank[b.id]=0; o.harvestProg[b.id]=0; o.harvestDone[b.id]=false; o.firstTaken[b.id]=false; }); return o; }
function mockDefaults(){ return Object.assign(mockBlank(),{ score:{Blue:0,Red:0}, bullets:{Blue:0,Red:0}, elapsed:0, playing:false, speed:10, ended:false, brush:'Red', capTimed:true, self:{inField:true,reentryRemain:0}, auto:true, diff:'even', lastDecide:0, scenarioId:'sample', recovery:0.5, advice:[], aces:{} }); }
function mockLoad(){ try{ var r=localStorage.getItem(KEYM); if(r){ var s=JSON.parse(r); var m=Object.assign(mockDefaults(),s,{playing:false}); if(typeof m.recovery!=='number')m.recovery=0.5; if(!Array.isArray(m.advice))m.advice=[]; if(!m.aces)m.aces={}; return m; } }catch(e){} return mockDefaults(); }
var M=mockLoad();
if(!P.scenarios.some(function(s){return s.id===M.scenarioId;})) M.scenarioId=P.currentId;
function mockSave(){ try{ localStorage.setItem(KEYM, JSON.stringify(M)); }catch(e){} }
var MS={ blue:T('自軍','Blue'), red:T('敵軍','Red'), npc:T('NPC','NPC'),
  toScatter:T('💥 占拠開始でポイントの半分が散らばった','💥 Half the points scattered'), toLocked:T('まだ攻撃できません','Not open yet'), toEnd:T('試合終了(60分)','Match ended'),
  scatterMsg:function(lost,rec,en){ return EN?('💥 Stolen! '+fmtN(lost)+' scattered → recover '+fmtN(rec)+' / enemy '+fmtN(en)):('💥 奪取！施設の'+fmtN(lost)+'ptが散逸 → 回収'+fmtN(rec)+' / 敵軍'+fmtN(en)); },
  cap:T('占拠中','Capturing'), facHeld:T('施設','facs') };
function ownerColor(o){ return o==='Blue'?'#2256c8':o==='Red'?'#cf2e22':'#9fb6c8'; }
function ownerName(o){ return o==='Blue'?MS.blue:o==='Red'?MS.red:MS.npc; }

/* Undo/Redo */
var mUndo=[],mRedo=[];
function mSnap(){ return JSON.parse(JSON.stringify({owners:M.owners,capturing:M.capturing,occSec:M.occSec,bank:M.bank,harvestProg:M.harvestProg,harvestDone:M.harvestDone,score:M.score,bullets:M.bullets})); }
function mPush(){ mUndo.push(mSnap()); if(mUndo.length>60)mUndo.shift(); mRedo=[]; }
function mRestore(s){ ['owners','capturing','occSec','bank','harvestProg','harvestDone','score','bullets'].forEach(function(k){ M[k]=s[k]; }); renderMock(); }
function mockUndo(){ if(!mUndo.length)return; mRedo.push(mSnap()); mRestore(mUndo.pop()); }
function mockRedo(){ if(!mRedo.length)return; mUndo.push(mSnap()); mRestore(mRedo.pop()); }

function sideHasBoiler(side){ return BUILDINGS.some(function(b){ return b.buff==='boiler'&&M.owners[b.id]===side&&!M.capturing[b.id]; }); }
function captureTime(side,isSteal){ var t=isSteal?GAME.CAP_SEC:Math.min(GAME.CAP_SEC,8); if(sideHasBoiler(side))t*=0.5; return Math.max(1,t); }
function mercTier(id){ return Math.max(1,Math.min(5,1+Math.floor(M.occSec[id]/60))); }

function mScatter(id,prev,by){ var b=BMAP[id], r=(typeof M.recovery==='number'?M.recovery:0.5);
  if(b.cat==='res'){ if(!M.harvestDone[id]){ var stored=(M.harvestProg[id]/b.harvest)*b.yield, lost=stored*SCATTER, toEn=lost*(1-r);
      M.harvestProg[id]=((stored-lost)/b.yield)*b.harvest; if(by)M.bullets[by]+=toEn; if(stored>1)toast(MS.toScatter); } return; }
  var B=M.bank[id]; if(B<=0){ M.bank[id]=0; return; }
  var lost=B*SCATTER;            // 半分が散逸(=軍事施設資材)
  var rec=lost*r;                // 回収(元所有者へ)
  var toEnemy=lost*(1-r);        // 敵軍へ加算
  M.score[prev]=Math.max(0, M.score[prev]-lost+rec);
  if(by) M.score[by]+=toEnemy;
  M.bank[id]=0;                   // 施設のポイントはリセット
  toast(MS.scatterMsg(Math.round(lost),Math.round(rec),Math.round(toEnemy)));
}
function mStartCapture(id,by){ var b=BMAP[id], prev=M.owners[id], isSteal=!!(prev&&prev!==by);
  if(isSteal){ mScatter(id,prev,by); }   /* 占拠"開始"の瞬間に散逸＋テロップ */
  if(M.capTimed){ var ct=captureTime(by,isSteal); M.capturing[id]={by:by,remain:ct,total:ct}; } else { mFinalize(id,by); }
}
function mFinalize(id,by){ var b=BMAP[id]; M.owners[id]=by; M.capturing[id]=null; M.occSec[id]=0;
  M.bank[id]=0;                                  /* 占領完了＝施設の獲得ポイントは0スタート */
  if(by && b.init>0 && !M.firstTaken[id]){ M.score[by]+=b.init; M.firstTaken[id]=true; } } /* 初回支配ボーナスは“初回占領”のみ */
function mAbandon(id){ var b=BMAP[id]; M.owners[id]=null; M.capturing[id]=null; M.occSec[id]=0; M.bank[id]=0; if(b.cat==='res'){ M.harvestProg[id]=0; M.harvestDone[id]=false; } }

function mockApply(id){ var b=BMAP[id]; if(!visibleAt(b,M.elapsed))return; if(lockedAt(b,M.elapsed)){ toast(MS.toLocked); return; } if(M.ended)return;
  var br=M.brush; mPush();
  if(br==='clear'){ mAbandon(id); }
  else { if(M.owners[id]===br&&!M.capturing[id]){ mUndo.pop(); return; } mStartCapture(id,br); }
  updateAdvice(); renderMock();
}
function mockBulk(owner){ mPush(); BUILDINGS.forEach(function(b){ if(!visibleAt(b,M.elapsed)||lockedAt(b,M.elapsed))return; if(owner)mStartCapture(b.id,owner); else mAbandon(b.id); }); renderMock(); }
function mockClearAll(){ mPush(); BUILDINGS.forEach(function(b){ mAbandon(b.id); }); M.score={Blue:0,Red:0}; M.bullets={Blue:0,Red:0}; renderMock(); }

function buffsFor(side){ var o={atk:0,def:0,siege:0,cap:false,tp:false,inj:false}; BUILDINGS.forEach(function(b){ if(M.owners[b.id]!==side||M.capturing[b.id])return; if(b.buff==='armory'){o.atk+=15;o.def+=15;} if(b.buff==='merc')o.siege=Math.max(o.siege,mercTier(b.id)*10); if(b.buff==='boiler')o.cap=true; if(b.buff==='transit')o.tp=true; if(b.buff==='injury')o.inj=true; }); return o; }
function perMinFor(side){ var s=0; BUILDINGS.forEach(function(b){ if(M.owners[b.id]===side&&!M.capturing[b.id])s+=b.pts; }); return s; }
function mCount(side){ var n=0; BUILDINGS.forEach(function(b){ if(M.owners[b.id]===side)n++; }); return n; }

/* 作戦シナリオ → 自軍(Blue)の目標(累積) */
function allyTargets(){ var set={}, el=M.elapsed, phs=mockScenario().phases.slice().sort(function(a,b){return a.time-b.time;}); phs.forEach(function(p){ if(p.time*60<=el){ for(var k in p.assign)set[k]=1; } }); return Object.keys(set).map(Number); }
/* シナリオ上、各拠点の担当チーム(累積) → 占領者名(リーダー) */
function scnAssignMap(){ var m={}, el=M.elapsed, phs=mockScenario().phases.slice().sort(function(a,b){return a.time-b.time;}); phs.forEach(function(p){ if(p.time*60<=el){ for(var k in p.assign)m[k]=p.assign[k]; } }); return m; }
function scnLeaderOf(bid){ var tid=scnAssignMap()[String(bid)]; if(!tid)return null; var t=(mockScenario().teams||[]).find(function(x){return x.id===tid;}); return t?(t.leader||t.name):null; }
function teamCountM(){ return Math.max(1,(mockScenario().teams||[]).length); }
/* 自軍1軍(キー拠点): 各チームが担当する中で最も価値の高い拠点 */
function allyKeyMap(){ var am=scnAssignMap(), best={}; for(var k in am){ var tid=am[k], b=BMAP[+k]; if(!b)continue; var v=bValue(b); if(!best[tid]||v>best[tid].v)best[tid]={bid:+k,v:v}; } var map={}; for(var t in best)map[best[t].bid]=t; return map; } // bid -> teamId(1軍)
function allyKeyset(){ return allyKeyMap(); }
/* 敵エースの配置: 敵が保持する高価値拠点 上位N (N=チーム数)。格上は最重要N拠点を死守 */
function aceCount(){ return M.diff==='strong'?5:teamCountM(); }
function enemyAceIds(){ var N=aceCount();
  var held=BUILDINGS.filter(function(b){ return M.owners[b.id]==='Red'||(M.capturing[b.id]&&M.capturing[b.id].by==='Red'); }).sort(function(a,b){ return (bValue(b)+(M.bank[b.id]||0))-(bValue(a)+(M.bank[a.id]||0)); }).slice(0,N).map(function(b){return b.id;});
  return held;
}
function aceLabel(rank){ return (M.diff==='strong'?'格上':'')+'エース'+rank; }

function renderMock(){
  renderScnBar();
  scorebar.style.display='';
  if(!scenarioReady(mockScenario().phases)){ renderMockNoScenario(); return; }
  updateAdvice();
  renderMockHeader(); renderMockBar(); renderMockMap(); renderMockPanel(); mockSave();
}
function renderMockNoScenario(){
  header.className='fs-head'; header.innerHTML='<div class="fs-title"><div class="t"><span class="dot"></span>'+T('模擬戦シミュレータ','Mock Battle')+'</div><div class="s">'+T('作戦シナリオに敵の動きを加えて試算','Add enemy moves to your plan')+'</div></div>';
  scorebar.style.display='none'; tiles.innerHTML=''; ovTL.innerHTML=''; ovTR.innerHTML=''; brushInd.innerHTML=''; panel.innerHTML='';
  banner.innerHTML='<div class="fs-notice"><div class="tx">'+T('まず <b>作戦シミュレータ</b> でチーム編成とフェーズ別の作戦を設定してください。模擬戦は、その作戦に沿って自軍が動き、敵の動きを加えてゲームを再現します。','First set up your teams & phase plans in the <b>Op Planner</b>. The mock battle drives your side from that plan and adds the enemy.')+'</div><button id="goPlan">'+T('作戦シミュレータへ →','Open Op Planner →')+'</button></div>';
  $('goPlan').addEventListener('click',function(){ setMode('plan'); });
}

function renderMockHeader(){
  header.className='fs-head';
  function spd(v){ return '<button class="fs-spbtn'+(M.speed===v?' on':'')+'" data-s="'+v+'">×'+v+'</button>'; }
  header.innerHTML='<div class="fs-title"><div class="t"><span class="dot"></span>'+T('模擬戦シミュレータ','Mock Battle')+'</div><div class="s">'+T('自軍は作戦どおり／敵を手動or自動で','Ally follows plan; enemy manual/auto')+'</div></div>'+
    '<div class="fs-transport">'+
      '<button class="fs-bigplay'+(M.playing?' playing':'')+'" id="mPlay"><span class="ic">'+(M.playing?'⏸':'▶')+'</span>'+(M.playing?T('一時停止','Pause'):T('シミュレーション開始','Start sim'))+'</button>'+
      '<div class="fs-clockbox"><span class="lab">'+T('経過','Elapsed')+'</span><span class="fs-clock'+(M.playing?' run':'')+'">'+mmss(M.elapsed)+'</span><span class="lab">/ 60:00</span></div>'+
      '<div class="fs-spd"><span class="lab">'+T('速度','Speed')+'</span>'+spd(1)+spd(5)+spd(10)+spd(30)+spd(60)+'</div>'+
      '<button class="fs-rew" id="mReset"><span class="ic">⏮</span>'+T('最初から','Restart')+'</button>'+
    '</div>'+
    '<div class="fs-tb">'+
      '<div class="fs-tg"><span class="lb">'+T('手動で占拠','Manual')+'</span>'+
        '<button class="fs-tbtn b'+(M.brush==='Blue'?' on':'')+'" data-br="Blue"><span class="d" style="background:#2256c8"></span>'+MS.blue+'</button>'+
        '<button class="fs-tbtn r'+(M.brush==='Red'?' on':'')+'" data-br="Red"><span class="d" style="background:#cf2e22"></span>'+MS.red+'</button>'+
        '<button class="fs-tbtn'+(M.brush==='clear'?' on':'')+'" data-br="clear">'+T('解除','Clear')+'</button></div>'+
      '<div class="fs-tg"><span class="lb">'+T('一括','Bulk')+'</span><button class="fs-tbtn b" id="mAllB">'+T('全自軍','All B')+'</button><button class="fs-tbtn r" id="mAllR">'+T('全敵軍','All R')+'</button><button class="fs-tbtn" id="mClear">'+T('全解除','Clear')+'</button></div>'+
      '<div class="fs-tg"><span class="lb">'+T('手動操作','Edit')+'</span><button class="fs-tbtn" id="mUndo"'+(mUndo.length?'':' disabled')+'>↶ '+T('戻す','Undo')+'</button><button class="fs-tbtn" id="mRedo"'+(mRedo.length?'':' disabled')+'>'+T('やり直し','Redo')+' ↷</button></div>'+
    '</div>';
  Array.prototype.forEach.call(document.querySelectorAll('.fs-tbtn[data-br]'),function(b){ b.addEventListener('click',function(){ M.brush=b.getAttribute('data-br'); renderMockHeader(); mockSave(); }); });
  $('mPlay').addEventListener('click',function(){ if(M.ended)return; M.playing=!M.playing; renderMockHeader(); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-spd .fs-spbtn'),function(btn){ btn.addEventListener('click',function(){ M.speed=parseInt(btn.getAttribute('data-s'),10)||10; Array.prototype.forEach.call(document.querySelectorAll('.fs-spd .fs-spbtn'),function(x){x.classList.remove('on');}); btn.classList.add('on'); mockSave(); }); });
  $('mReset').addEventListener('click',function(){ M.playing=false; M.elapsed=0; M.ended=false; M.lastDecide=0; var sid=M.scenarioId,rec=M.recovery,au=M.auto,df=M.diff,sp2=M.speed; Object.assign(M,mockBlank()); M.score={Blue:0,Red:0}; M.bullets={Blue:0,Red:0}; M.self={inField:true,reentryRemain:0}; M.scenarioId=sid; M.recovery=rec; M.auto=au; M.diff=df; M.speed=sp2; M.brush='Red'; mUndo=[];mRedo=[]; renderMock(); });
  $('mAllB').addEventListener('click',function(){ mockBulk('Blue'); }); $('mAllR').addEventListener('click',function(){ mockBulk('Red'); }); $('mClear').addEventListener('click',mockClearAll);
  $('mUndo').addEventListener('click',mockUndo); $('mRedo').addEventListener('click',mockRedo);
}

function renderMockBar(){
  var B=M.score.Blue,R=M.score.Red,total=B+R,bp=total>0?B/total:0.5,edge=(bp*100).toFixed(2);
  var net=perMinFor('Blue')-perMinFor('Red'),adv;
  if(Math.abs(net)<1) adv='<div class="ind e" style="left:'+edge+'%">'+T('互角','Even')+'</div>';
  else if(net>0) adv='<div class="ind b" style="left:'+edge+'%">'+T('自軍優勢','Blue')+' +'+fmtN(net)+'/'+T('分','m')+' ▶</div>';
  else adv='<div class="ind r" style="left:'+edge+'%">◀ '+T('敵軍優勢','Red')+' +'+fmtN(-net)+'/'+T('分','m')+'</div>';
  scorebar.innerHTML=
    '<div class="fs-sb-top"><div class="s b">'+fmtN(B)+'<small>● '+MS.blue+' ・ '+mCount('Blue')+MS.facHeld+' ・ 🔫'+fmtN(M.bullets.Blue)+'</small></div>'+
      '<div class="s r"><small>🔫'+fmtN(M.bullets.Red)+' ・ '+mCount('Red')+MS.facHeld+' ・ '+MS.red+' ●</small>'+fmtN(R)+'</div></div>'+
    '<div class="fs-sb-track"><div class="fs-sb-b" style="width:'+edge+'%"></div><div class="fs-sb-r" style="width:'+(100-edge)+'%"></div><div class="fs-sb-edge" style="left:'+edge+'%"></div><div class="fs-clash" style="left:'+edge+'%">⚔️</div></div>'+
    '<div class="fs-adv">'+adv+'</div>';
}

function renderMockMap(){
  tiles.innerHTML='';
  var keymap=allyKeyset(), aces=enemyAceIds();
  BUILDINGS.forEach(function(b){ if(!visibleAt(b,M.elapsed))return;
    var o=M.owners[b.id],cap=M.capturing[b.id],shown=cap?cap.by:o,bc=ownerColor(shown),locked=lockedAt(b,M.elapsed);
    var div=document.createElement('div'); div.className='fs-tile'+(b.big?' big':'')+(locked?' locked':''); div.style.left=b.x+'%'; div.style.top=b.y+'%';
    div.setAttribute('data-bid',b.id); div.setAttribute('role','button'); div.setAttribute('tabindex','0');
    // 占領者名 / 敵エース
    var occLab='';
    if(o==='Blue'&&!cap){ var ld=scnLeaderOf(b.id); var key=keymap[b.id]; if(ld)occLab='<span class="fs-leadtag" style="background:'+bc+'">'+(key?'★1軍 ':'')+esc(ld)+'</span>'; else if(key)occLab='<span class="fs-leadtag" style="background:'+bc+'">★1軍</span>'; }
    else { var redAssoc=(o==='Red')||(cap&&cap.by==='Red'); if(redAssoc){ var ai=aces.indexOf(b.id); if(ai>=0)occLab='<span class="fs-leadtag ace" style="background:#cf2e22">'+esc(aceLabel(ai+1))+'</span>'; } }
    if(occLab)div.className+=' hasocc';
    var occName=locked?T('未開放','locked'):(cap?(ownerName(cap.by)+MS.cap):(o==='Blue'?(scnLeaderOf(b.id)||ownerName(o)):(o==='Red'?(aces.indexOf(b.id)>=0?aceLabel(aces.indexOf(b.id)+1):ownerName(o)):ownerName(o))));
    div.setAttribute('aria-label','#'+b.num+' '+bname(b)+'｜'+occName);
    var ring='';
    if(cap){ ring=ringSVG(ownerColor(cap.by),1-cap.remain/cap.total); }
    else if(b.cat==='res'&&o){ ring=ringSVG(M.harvestDone[b.id]?'#2faa54':'#f59f3a',Math.min(1,M.harvestProg[b.id]/b.harvest)); }
    var ptlab = (o && !cap) ? '<span class="fs-pts" style="background:'+bc+'">'+fmtN(M.bank[b.id]||0)+'</span>' : '';
    div.innerHTML=ring+'<div class="fs-dia" style="border-color:'+bc+'"><div class="fs-occ" style="background:'+bc+';opacity:'+(shown?'':'0')+'"></div><div class="bld"></div>'+
      '<div class="fs-badge" style="background:radial-gradient(circle at 38% 32%,'+(shown?bc:'#2f7fb0')+','+(shown?bc:'#145079')+');opacity:'+(locked?'.3':'1')+'">'+esc(b.num)+'</div></div>'+
      occLab+ptlab+(locked?'<span class="lockico">🔒</span>':'')+pillHTML(b);
    tiles.appendChild(div);
  });
  var ph=M.elapsed<GAME.PREP*60?T('準備','Prep'):M.elapsed<GAME.CENTRAL*60?T('中央以外 攻撃可','Outer'):M.elapsed<GAME.WORKSHOP*60?T('全施設 攻撃可','All'):T('工房出現','Workshops');
  ovTL.className='fs-ov tl'; ovTL.innerHTML='<div class="pn fs-raj" style="font-size:15px">'+mmss(M.elapsed)+'</div><div class="pi">'+ph+'</div>';
  ovTR.innerHTML=''; brushInd.innerHTML='';
}
function ringSVG(color,p){ var C=2*Math.PI*45; return '<svg class="fs-cap" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="'+color+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-p)).toFixed(1)+'" transform="rotate(-90 50 50)"/></svg>'; }

function renderMockPanel(){ panel.innerHTML = mockTimeCard()+mockAdviceCard()+mockAutoCard()+mockExitCard()+mockBuffCard()+mockListCard()+mockSetCard(); mockWire(); }
function mockTimeCard(){ var rem=Math.max(0,GAME.EVENT*60-M.elapsed);
  return '<div class="fs-card" id="evCard"><h3>'+T('ゲーム時間','Match time')+'</h3><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font:700 11px \'Noto Sans JP\';color:var(--fmut)">'+ruleText(M.elapsed)+'</span><span class="fs-raj" style="font:900 18px \'Rajdhani\'">'+(M.ended?MS.toEnd:T('残り','Left')+' '+mmss(rem))+'</span></div>'+timelineHTML(M.elapsed)+'</div>'; }
/* ===== 戦況アドバイス ===== */
function computeAdvice(){
  var out=[], keymap=allyKeyset(), aces=enemyAceIds();
  // 1) 防衛: 自軍の重要拠点(高得点 or 1軍)が敵に占拠開始されている
  BUILDINGS.forEach(function(b){ if(M.owners[b.id]==='Blue'&&M.capturing[b.id]&&M.capturing[b.id].by==='Red'&&((M.bank[b.id]||0)>=1000||keymap[b.id])){ out.push({key:'def'+b.id,act:'defend',bid:b.id,prio:(M.bank[b.id]||0)+9000,text:'⚠ '+bname(b)+'('+fmtN(M.bank[b.id]||0)+'pt)が奪われそう。'+(keymap[b.id]?'1軍で死守！':'守りを増やすか、奪われたら即奪回を。')}); } });
  // 2) 奪回: 敵の高得点拠点(奪えば敵を半減)
  BUILDINGS.filter(function(b){ return M.owners[b.id]==='Red'&&!M.capturing[b.id]&&(M.bank[b.id]||0)>=3000; }).sort(function(a,b){return M.bank[b.id]-M.bank[a.id];}).slice(0,1).forEach(function(b){ var ace=aces.indexOf(b.id)>=0;
    out.push({key:'take'+b.id,act:'capture',bid:b.id,prio:(M.bank[b.id]||0)+ (ace?0:2000),text:'敵の'+bname(b)+'は'+fmtN(M.bank[b.id]||0)+'pt。'+(ace?(M.diff==='strong'?'格上エースが死守中。複数チームで集中攻撃を。':'敵エース拠点。集中攻撃で奪えば大きく削れる。'):'奪えば敵ポイントを半減できる。')}); });
  // 3) 確保: 未占領の高価値拠点
  BUILDINGS.filter(function(b){ return visibleAt(b,M.elapsed)&&!lockedAt(b,M.elapsed)&&M.owners[b.id]===null; }).sort(function(a,b){return bValue(b)-bValue(a);}).slice(0,1).forEach(function(b){ out.push({key:'cap'+b.id,act:'capture',bid:b.id,prio:bValue(b)/3,text:'未占領の'+bname(b)+'を確保しましょう。'}); });
  // 4) 武器工房の出現
  if(M.elapsed>=GAME.WORKSHOP*60-40&&M.elapsed<GAME.WORKSHOP*60+90){ out.push({key:'ws',act:'info',bid:0,prio:500,text:'まもなく四隅に武器工房が出現。弾薬確保の準備を。'}); }
  // 5) 1軍拠点の確認(序盤)
  if(M.elapsed<GAME.CENTRAL*60){ var keyArr=Object.keys(keymap).map(Number).filter(function(id){return M.owners[id]!=='Blue';}); if(keyArr.length){ var b=BMAP[keyArr[0]]; out.push({key:'key'+b.id,act:'capture',bid:b.id,prio:4000,text:'まず1軍の要所「'+bname(b)+'」を確保して守りを固めましょう。'}); } }
  out.sort(function(a,b){return b.prio-a.prio;});
  return out.slice(0,3);
}
function adviceDone(a){ var bid=a.bid, capBlue=M.capturing[bid]&&M.capturing[bid].by==='Blue';
  if(a.act==='capture')return M.owners[bid]==='Blue'||capBlue;                 // 占拠を開始/完了したらGOOD
  if(a.act==='defend')return capBlue||(M.owners[bid]==='Blue'&&!(M.capturing[bid]&&M.capturing[bid].by==='Red')); // 守り切る/奪回着手でGOOD
  return false; }
function updateAdvice(){
  var now=M.elapsed, desired=computeAdvice(), have={};
  M.advice.forEach(function(a){ have[a.key]=a; });
  // 達成チェック(GOOD!! は実時間で約4秒保持)
  M.advice.forEach(function(a){ if(!a.good&&adviceDone(a)){ a.good=true; a.goodReal=Date.now(); } });
  // 新規追加
  desired.forEach(function(d){ if(!have[d.key]){ d.born=now; M.advice.push(d); } else { have[d.key].text=d.text; have[d.key].prio=d.prio; } });
  // 掃除: GOODは実時間4秒保持 / 未達成は現在の候補のみ保持
  var keys={}; desired.forEach(function(d){keys[d.key]=1;});
  M.advice=M.advice.filter(function(a){ if(a.good)return (Date.now()-(a.goodReal||0))<4000; return !!keys[a.key]; });
  M.advice.sort(function(a,b){ if(!!b.good!==!!a.good)return (b.good?1:0)-(a.good?1:0); return (b.prio||0)-(a.prio||0); });
  if(M.advice.length>4)M.advice=M.advice.slice(0,4);
}
function mockAdviceCard(){
  if(!M.advice.length){ return '<div class="fs-card fs-advisecard"><h3>'+T('戦況アドバイス','Live advice')+'</h3><div class="fs-hint">'+T('シミュレーションを開始すると、状況に応じた次の一手をここに表示します。','Start the sim to get live next-move advice here.')+'</div></div>'; }
  var items=M.advice.map(function(a){ return '<div class="fs-adv-item'+(a.good?' good':'')+'">'+(a.good?'<span class="gd">GOOD!!</span>':'<span class="bj">▶</span>')+'<span class="tx">'+esc(a.text)+'</span></div>'; }).join('');
  return '<div class="fs-card fs-advisecard"><h3>'+T('戦況アドバイス','Live advice')+'</h3><div class="fs-advlist">'+items+'</div></div>';
}

function mockAutoCard(){
  function db(k,lab){ return '<button class="'+(M.diff===k?'on':'')+'" data-d="'+k+'"'+(M.auto?'':' disabled')+'>'+lab+'</button>'; }
  var dtxt={ weak:T('格下：拠点はほぼ自軍が確保できる。ただし高得点になった拠点を順に集中攻撃。武器工房は積極的に奪いに来る。','Weaker: you take most; enemy focus-fires high-point sites and grabs workshops.'),
    even:T('同格：敵も同数のエースを持つ。各チームの1軍が守る拠点は維持できるが、それ以外は奪われやすい。','Even: enemy has the same number of aces; your 1st-team key points hold, the rest are vulnerable.'),
    strong:T('格上：敵エースが最重要N拠点を死守(複数チームでやっと崩せる)。高得点が溜まると集中攻撃してくる。','Stronger: enemy aces lock the top sites; you need several teams to break one. They focus-fire big banks.') }[M.diff]||'';
  return '<div class="fs-card" id="autoCard"><h3>'+T('敵の自動シミュレーション','Enemy auto-sim')+'<span class="add" id="autoTgl" style="'+(M.auto?'background:var(--facc);color:#fff;border-color:var(--facc)':'')+'">'+(M.auto?T('自動 ON','Auto ON'):T('自動 OFF','Auto OFF'))+'</span></h3>'+
    '<div class="fs-hint"><b style="color:var(--facc)">'+T('自軍は上で選んだ作戦シナリオの通りに自動行動します。','Your side auto-follows the chosen scenario above.')+'</b> '+T('敵は、自動OFFなら手動占拠、ONなら下の強さに応じて自動で攻防します。','Enemy is manual when off, or auto at the strength below.')+'</div>'+
    '<div class="fs-diffrow'+(M.auto?'':' off')+'">'+db('weak',T('格下','Weaker'))+db('even',T('同格','Even'))+db('strong',T('格上','Stronger'))+'</div>'+
    '<div class="fs-hint" style="margin-top:7px'+(M.auto?'':';color:var(--fmut)')+'">'+(M.auto?dtxt:T('※ 強さ設定は「自動 ON」のときだけ有効です。','Strength applies only when Auto is ON.'))+'</div></div>';
}
function mockExitCard(){ var sf=M.self;
  if(sf.inField) return '<div class="fs-card" id="exCard"><h3>'+T('自分の状態','Your status')+'</h3><div class="fs-exit"><div class="st"><span class="pin" style="background:#2faa54"></span>'+T('在場中','In field')+'</div><button id="exitBtn">'+T('一時退出','Temp exit')+'</button></div></div>';
  var ready=sf.reentryRemain<=0;
  return '<div class="fs-card" id="exCard"><h3>'+T('自分の状態','Your status')+'</h3><div class="fs-exit"><div class="st"><span class="pin" style="background:#e2462f"></span>'+T('退出中','Out')+'</div><div class="big" style="color:'+(ready?'#2faa54':'#cf2e22')+'">'+(ready?T('再入場できます','Ready'):T('再入場まで','Re-entry')+' '+mmss(sf.reentryRemain))+'</div><button id="reBtn"'+(ready?'':' disabled')+'>'+T('再入場','Re-enter')+'</button></div></div>';
}
function mockBuffCard(){ var B=buffsFor('Blue'),R=buffsFor('Red');
  function rw(k,b,r){ return '<div class="fs-bf2"><span class="k">'+k+'</span><span class="vb">'+b+'</span><span class="vr">'+r+'</span></div>'; }
  return '<div class="fs-card" id="bfCard"><h3>'+T('戦力バフ集計','Buffs')+' <small style="font:600 9px \'Noto Sans JP\';color:var(--fmut)">'+MS.blue+' / '+MS.red+'</small></h3><div class="fs-buffs">'+
    rw(T('部隊ダメージ','Troop dmg'),B.atk?'+'+B.atk+'%':'—',R.atk?'+'+R.atk+'%':'—')+
    rw(T('被ダメージ','Dmg taken'),B.def?'-'+B.def+'%':'—',R.def?'-'+R.def+'%':'—')+
    rw(T('対施設攻撃','Siege'),B.siege?'+'+B.siege+'%':'—',R.siege?'+'+R.siege+'%':'—')+
    rw(T('占領時間','Capture'),B.cap?'-50%':'—',R.cap?'-50%':'—')+
    rw(T('転移CT','Teleport'),B.tp?'-50%':'—',R.tp?'-50%':'—')+
    rw(T('駐屯兵 負傷','Injury'),B.inj?'10%':'—',R.inj?'10%':'—')+'</div></div>';
}
function mockListCard(){
  var aces=enemyAceIds(), keymap=allyKeyset();
  var rows=BUILDINGS.filter(function(b){return visibleAt(b,M.elapsed);}).map(function(b){ var o=M.owners[b.id],cap=M.capturing[b.id],locked=lockedAt(b,M.elapsed),col=cap?cap.by:o;
    var who='';
    if(!locked&&!cap){ if(o==='Blue'){ var ld=scnLeaderOf(b.id); who=(keymap[b.id]?'★':'')+(ld||MS.blue); } else if(o==='Red'){ var ai=aces.indexOf(b.id); who=ai>=0?aceLabel(ai+1):MS.red; } }
    var sub=locked?(T('解放','opens ')+b.openMin+T('分','m')):cap?(MS.cap+' '+mmss(cap.remain)):(o?(fmtN(M.bank[b.id]||0)+'pt'):(b.pts?('+'+b.pts+'/'+T('分','m')):(b.cat==='res'?(fmtN(b.yield)+'🔫'):'—')));
    return '<div class="fs-fr '+(col==='Blue'?'b':col==='Red'?'r':'')+(locked?' lk':'')+'" data-bid="'+b.id+'" role="button" tabindex="0"><span class="dot" style="background:'+ownerColor(col)+'"></span><span class="fn">'+(locked?'🔒':'')+'#'+b.num+' '+esc(bname(b))+(who?' <small style="color:'+ownerColor(col)+';font-weight:700">['+esc(who)+']</small>':'')+'</span><span class="fp">'+sub+'</span></div>';
  }).join('');
  return '<div class="fs-card" id="lsCard"><h3>'+T('施設一覧','Facilities')+'</h3><div class="fs-flist">'+rows+'</div></div>';
}
function mockSetCard(){ return '<div class="fs-card"><h3>'+T('詳細設定','Settings')+'</h3><div class="fs-set">'+
  '<label>'+T('占拠時間(秒)','Capture (s)')+'<input type="number" id="csCap" value="'+GAME.CAP_SEC+'" min="1"></label>'+
  '<label>'+T('軍事施設資材 獲得率(%)','Resource recovery (%)')+'<input type="number" id="csRec" value="'+Math.round((M.recovery||0)*100)+'" min="0" max="100"></label>'+
  '<label>'+T('試合時間','Match')+'<span class="fixed">60:00 ('+T('固定','fixed')+')</span></label>'+
  '<label>'+T('再入場','Re-entry')+'<span class="fixed">12:00 ('+T('固定','fixed')+')</span></label></div>'+
  '<div class="fs-hint" style="margin-top:8px">'+T('奪われると施設ポイントの半分が散逸。散逸分のうち獲得率ぶんを元所有者が回収し、残りが敵軍へ加算されます。','When stolen, half the facility points scatter; you recover the recovery-rate share, the rest goes to the enemy.')+'</div></div>'; }

function mockWire(){
  var lc=$('lsCard'); if(lc)lc.addEventListener('click',function(e){ var r=e.target.closest('.fs-fr'); if(r)mockApply(+r.getAttribute('data-bid')); });
  var ag=$('autoTgl'); if(ag)ag.addEventListener('click',function(){ M.auto=!M.auto; renderMockPanel(); mockSave(); });
  Array.prototype.forEach.call(document.querySelectorAll('.fs-diffrow button'),function(b){ b.addEventListener('click',function(){ if(!M.auto)return; M.diff=b.getAttribute('data-d'); renderMockPanel(); mockSave(); }); });
  var rec=$('csRec'); if(rec)rec.addEventListener('change',function(e){ var v=parseInt(e.target.value,10); if(isNaN(v))v=50; v=Math.max(0,Math.min(100,v)); M.recovery=v/100; e.target.value=v; mockSave(); });
  var eb=$('exitBtn'); if(eb)eb.addEventListener('click',function(){ M.self.inField=false; M.self.reentryRemain=GAME.REENTRY_SEC; renderMockPanel(); mockSave(); });
  var rb=$('reBtn'); if(rb)rb.addEventListener('click',function(){ if(M.self.reentryRemain<=0){ M.self.inField=true; renderMockPanel(); mockSave(); } });
  var cap=$('csCap'); if(cap)cap.addEventListener('change',function(e){ var v=parseInt(e.target.value,10); if(v>0)GAME.CAP_SEC=v; });
}

/* 自動意思決定 */
function countCapturing(side){ var n=0; BUILDINGS.forEach(function(b){ if(M.capturing[b.id]&&M.capturing[b.id].by===side)n++; }); return n; }
function bValue(b){ return b.init + b.pts*8 + (b.buff?2000:0); }
/* 施設に貯まっているポイントが高いほど、奪う価値が高い(相手のポイントを半減できる) */
function liveValue(b){ return bValue(b) + (M.bank[b.id]||0)*1.5; }
function decide(){
  var N=teamCountM(), keymap=allyKeyset(); // 自軍1軍拠点(bid->teamId)
  var aceHomes=enemyAceIds();             // 敵エースが現在守る拠点(価値上位N)
  var isAceHome=function(id){ return aceHomes.indexOf(id)>=0; };
  var isAllyKey=function(id){ return !!keymap[id]; };
  var plan=allyTargets(), inPlan=function(id){return plan.indexOf(id)>=0;};

  // ===== 自軍 =====
  var allySlots=Math.min(6, P.teams.length+2) - countCapturing('Blue');
  if(allySlots>0){
    var targets=BUILDINGS.filter(function(b){ if(!visibleAt(b,M.elapsed)||lockedAt(b,M.elapsed))return false; if(M.owners[b.id]==='Blue')return false; if(M.capturing[b.id]&&M.capturing[b.id].by==='Blue')return false;
        var isRed=M.owners[b.id]==='Red';
        // 自軍は: 作戦目標 / 未占領 / (敵保持なら)自分の要所か高得点拠点のみ奪い返す
        var retake=isRed&&(inPlan(b.id)||keymap[b.id]||(M.bank[b.id]||0)>=4000);
        if(!(inPlan(b.id)||M.owners[b.id]===null||retake))return false;
        // 格上: 敵エース拠点は複数チーム集中時のみ(=低確率)しか崩せない
        if(M.diff==='strong'&&isRed&&isAceHome(b.id)){ var rank=aceHomes.indexOf(b.id); // 0,1=1-2軍(死守) / 2+=3-5軍(協力で突破可)
          var p=rank<2?0.05:0.30; if(!(Math.random()<p))return false; }
        return true; })
      .sort(function(a,b){ var pa=inPlan(a.id)?1:0, pb=inPlan(b.id)?1:0; if(pa!==pb)return pb-pa; return liveValue(b)-liveValue(a); });
    for(var i=0;i<targets.length&&allySlots>0;i++){ mStartCapture(targets[i].id,'Blue'); allySlots--; }
  }
  if(!M.auto)return;

  // ===== 敵(難易度) =====
  var cfg={ weak:{slots:2}, even:{slots:N+1}, strong:{slots:Math.max(6,N+2)} }[M.diff]||{slots:N};
  var enSlots=cfg.slots - countCapturing('Red');
  if(enSlots<=0)return;
  var cands=BUILDINGS.filter(function(b){ if(!visibleAt(b,M.elapsed)||lockedAt(b,M.elapsed))return false; if(M.owners[b.id]==='Red')return false; if(M.capturing[b.id]&&M.capturing[b.id].by==='Red')return false;
    var bk=M.bank[b.id]||0, isBlue=M.owners[b.id]==='Blue', isNull=M.owners[b.id]===null;
    if(M.diff==='even'){ // 自軍1軍拠点は奪わない(未占領でも避ける) → 1軍は守れる。それ以外は奪う
      if(isAllyKey(b.id))return false; return true;
    }
    if(M.diff==='strong'){ // 何でも狙う。高得点は集中攻撃
      return true;
    }
    // weak: 拠点は殆ど自軍が確保。敵は高得点拠点を順に集中攻撃 + 武器工房(武器攻防)を積極奪取
    if(isAllyKey(b.id))return false;
    if(b.cat==='res')return true;            // 武器工房は積極的に
    if(isBlue&&bk>=2500)return true;          // 高得点化した自軍拠点を集中攻撃
    return false;                              // それ以外(未占領含む)は基本狙わない=自軍が確保
  }).sort(function(a,b){
    var ba=M.bank[a.id]||0, bb=M.bank[b.id]||0, na=M.owners[a.id]===null?1:0, nb=M.owners[b.id]===null?1:0;
    if(M.diff==='strong'){ // エース帰巣(未確保のエース拠点)最優先→高得点→価値
      var ha=isAceHome(a.id)&&M.owners[a.id]!=='Red'?1:0, hb=isAceHome(b.id)&&M.owners[b.id]!=='Red'?1:0;
      return (hb*1e7+bb*3+bValue(b)) - (ha*1e7+ba*3+bValue(a));
    }
    if(M.diff==='weak'){ // 高得点を順に + 工房優先
      var wa=a.cat==='res'?1:0, wb=b.cat==='res'?1:0;
      return (bb*4+wb*4000+nb*1500) - (ba*4+wa*4000+na*1500);
    }
    // even: 未占領優先→価値
    return (bb*2+nb*4000+bValue(b)) - (ba*2+na*4000+bValue(a));
  });
  for(var j=0;j<cands.length&&enSlots>0;j++){ mStartCapture(cands[j].id,'Red'); enSlots--; }

  // 取りこぼし防止: 未占領の解放済み拠点は即どちらかが確保(枠制限なし・速攻占領)
  BUILDINGS.forEach(function(b){ if(!visibleAt(b,M.elapsed)||lockedAt(b,M.elapsed))return; if(M.owners[b.id]!==null||M.capturing[b.id])return;
    var toAlly = inPlan(b.id)||isAllyKey(b.id)||M.diff==='weak'; // 作戦目標/1軍/格下は自軍、その他は敵が確保
    mStartCapture(b.id, toAlly?'Blue':'Red');
  });
}

var mockStepT=null;
function mockStep(){ if(MODE!=='mock'||!M.playing||M.ended||!scenarioReady(mockScenario().phases))return; var dt=0.1*M.speed; M.elapsed+=dt;
  // 占拠進行
  BUILDINGS.forEach(function(b){ var cap=M.capturing[b.id]; if(cap){ cap.remain-=dt; if(cap.remain<=0)mFinalize(b.id,cap.by); } });
  // 生産(占拠中は停止)
  BUILDINGS.forEach(function(b){ var o=M.owners[b.id]; if(!o||M.capturing[b.id])return; M.occSec[b.id]+=dt;
    if(b.pts>0){ var add=b.pts/60*dt; M.score[o]+=add; M.bank[b.id]+=add; }
    if(b.cat==='res'&&!M.harvestDone[b.id]){ M.harvestProg[b.id]+=dt; if(M.harvestProg[b.id]>=b.harvest){ M.harvestProg[b.id]=b.harvest; M.harvestDone[b.id]=true; M.bullets[o]+=b.yield; } } });
  // 再入場CD
  if(!M.self.inField&&M.self.reentryRemain>0)M.self.reentryRemain=Math.max(0,M.self.reentryRemain-dt);
  // 意思決定(1ゲーム秒ごと)
  if(M.elapsed-M.lastDecide>=1){ M.lastDecide=M.elapsed; decide(); updateAdvice(); }
  if(M.elapsed>=GAME.EVENT*60){ M.elapsed=GAME.EVENT*60; M.ended=true; M.playing=false; toast(MS.toEnd); renderMockHeader(); }
  renderMockBar(); renderMockMap();
  var ev=$('evCard'); if(ev)ev.outerHTML=mockTimeCard();
  var ac=$('autoCard'); var advc=document.querySelector('.fs-advisecard'); if(advc)advc.outerHTML=mockAdviceCard();
  var ex=$('exCard'); if(ex){ ex.outerHTML=mockExitCard(); var eb=$('exitBtn'); if(eb)eb.addEventListener('click',function(){ M.self.inField=false; M.self.reentryRemain=GAME.REENTRY_SEC; renderMockPanel(); }); var rb=$('reBtn'); if(rb)rb.addEventListener('click',function(){ if(M.self.reentryRemain<=0){ M.self.inField=true; renderMockPanel(); } }); }
  var bf=$('bfCard'); if(bf)bf.outerHTML=mockBuffCard();
  var ls=$('lsCard'); if(ls){ ls.outerHTML=mockListCard(); var l2=$('lsCard'); if(l2)l2.addEventListener('click',function(e){ var r=e.target.closest('.fs-fr'); if(r)mockApply(+r.getAttribute('data-bid')); }); }
  if(M.elapsed%2<dt)mockSave();
}

/* ===================== 静的・初期化 ===================== */
function buildStatic(){
  $('h1').innerHTML=T('兵器工場争奪戦','Foundry Battle')+' <span class="acc">'+T('フィールドツール','Field Tool')+'</span>';
  $('tag').textContent=T('フィールド作戦ツール','Field Tool');
  $('lead').innerHTML=T('「兵器工場争奪戦」のフィールドツール。<b>作戦シミュレータ</b>でチームとフェーズ別の作戦を計画し、<b>模擬戦シミュレータ</b>で敵の動き(手動/自動)を加えてゲームを再現。結果は共有リンクで配れます。',
    'Field tool for Foundry Battle. Plan teams & phases in the <b>Op Planner</b>, then add enemy moves (manual/auto) in the <b>Mock Battle</b>. Share results via link.');
  $('hHelp').textContent=T('使い方','How to use'); $('hData').textContent=T('施設データ(仕様準拠)','Facility data');
  $('helpgrid').innerHTML=[
    [T('① 作戦を立てる','① Plan'),T('「作戦」→「チーム編集」でチーム(最大8)と終結主を設定。各チームの「作戦を編集」でフェーズ毎の担当拠点を割り当てます。','Set up to 8 teams & leaders, then edit each team\u2019s per-phase targets.')],
    [T('② 再生で確認','② Play'),T('「ホーム」でゲーム開始を押すと時計が進み、各フェーズの作戦内容がバナーに表示。拠点クリックで情報確認。','Press Start on Home; phases play out over time. Click buildings for info.')],
    [T('③ 模擬戦で敵を加える','③ Mock'),T('自軍は作戦どおり自動行動。敵を手動占拠、または自動シミュ(格下/同格/格上)で攻防を再現します。','Ally follows the plan; play the enemy manually or auto (weaker/even/stronger).')],
    [T('④ 共有','④ Share'),T('右上「共有」でURLをコピー。相手の画面で同じ作戦が再現され、模擬戦にも反映されます。','Copy the share URL; it reproduces your plan and feeds the mock battle.')]
  ].map(function(p){ return '<div class="fb-help"><b>'+p[0]+'</b><br>'+p[1]+'</div>'; }).join('');
  $('dataNote').textContent=T('番号→施設 / 初回支配ポイント / 毎分: ','No.→facility / first-cap / per-min: ')+
    BUILDINGS.filter(function(b){return b.cat!=='res';}).map(function(b){ return '#'+b.num+'='+bname(b)+'('+fmtN(b.init)+'/+'+b.pts+')'; }).join(' / ')+
    T('。試合60分・0-3分準備・3-18分は中央以外・18分で中央開放・23分に武器工房④が四隅出現。占拠120秒。被占領は"占拠開始"時にポイント半分散逸。再入場12分固定。数値は app.js の BUILDINGS / GAME で調整可。',
      '. 60-min match; 0-3 prep; 18 central opens; 23 four workshops; 120s capture; half scatters at capture start; 12-min re-entry. Edit BUILDINGS/GAME in app.js.');
  $('relbar').innerHTML='<a href="../bear-hunt/index.html">'+T('→ 熊狩シミュレーター','→ Bear Hunt')+'</a><a href="../troop-ratio/index.html">'+T('→ 兵士比率シミュ','→ Troop Ratio')+'</a><a href="../king-castle/index.html">'+T('→ 王城戦','→ Castle Battle')+'</a><a href="../../guides/bear-hunt-guide.html">'+T('→ 攻略ガイド','→ Guides')+'</a>';
  if(EN){ $('htmlroot').lang='en'; document.title='Foundry Battle Field Tool | Whiteout Tools Lab'; $('crumb').innerHTML='<a href="../../index.html?lang=en">Home</a> &gt; Foundry Battle'; }
}
function init(){ var loaded=tryLoadShare(); buildStatic(); renderModeBar(); render(); if(loaded)toast(T('共有された作戦を読み込みました','Loaded shared plan'));
  mockStepT=setInterval(mockStep,100); }
if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
