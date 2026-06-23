'use strict';
function kcTrack(action,params){try{if(window.gtag)gtag('event',action,Object.assign({tool:'king_castle'},params||{}));}catch(e){}}
/* ====================================================================
   王城戦エリア配置管理ツール (統合版)
   14x14 アイソメtrックひし形 / 中心6x6 王城は設置不可
   モード: server / alliance / city。i18n対応。
   ==================================================================== */

const EN = (window.WOS_LANG === 'en');
function T(ja, en){ return EN ? en : ja; }

const N = 14, CASTLE = 6;
const LO = (N - CASTLE) / 2;   // 4
const HI = LO + CASTLE - 1;    // 9
const TW = 46, TH = 23, PAD = 64;
const BOARD_W = N * TW + PAD * 2;
const BOARD_H = N * TH + PAD * 2;
const OX = BOARD_W / 2, OY = PAD;

const isCastle = (r,c)=> (r>=LO&&r<=HI&&c>=LO&&c<=HI);
const CENTER_G = (N-1)/2;

function cellPoly(r,c){
  const cx=OX+(c-r)*(TW/2), cy=OY+(c+r)*(TH/2);
  return [[cx,cy-TH/2],[cx+TW/2,cy],[cx,cy+TH/2],[cx-TW/2,cy]];
}
function cellCenter(r,c){ return [OX+(c-r)*(TW/2), OY+(c+r)*(TH/2)]; }
function projCorner(r,c){ return [OX+(c-r)*(TW/2), OY+(c+r)*(TH/2)-TH/2]; }
function polyStr(p){ return p.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' '); }
function cellAngle(r,c){
  const x=(c-r), y=(c+r)-(CENTER_G*2);
  return (Math.atan2(y,x)*180/Math.PI + 360) % 360;
}
const EDIT=[];
for(let r=0;r<N;r++)for(let c=0;c<N;c++) if(!isCastle(r,c)) EDIT.push([r,c]);

const PALETTE=['#52c47a','#f2b03c','#b072e8','#2bc4c4','#e8748a','#9fbd3a','#ff9f40','#7ec8e3','#e0484d','#3d7ff0'];
const GREY='#5d6a82';

const state={
  mode:'server', zoom:1,
  server:{}, blueName:T('自サーバー','My Server'), redName:T('敵サーバー','Enemy Server'),
  allianceCount:6, alliances:[], allianceCell:{}, alliancePicking:-1,
  cities:[], cityCounter:0, showUnderlay:true, underlaySource:'none',
  pendingCity:null,
};

/* server 初期化: 左右ほぼ2分割。中央縦ライン(c-r==0)は青、ただし南側4マスは赤 */
function initServer(){
  state.server={};
  // 中央縦ライン = 画面x=0 のセル = (c-r)==0。南ほど (c+r) が大きい。
  const centerCol = EDIT.filter(([r,c])=>(c-r)===0).sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  // 南側4マス = (c+r)が大きい方から4つ
  const southSet = new Set(centerCol.slice(-4).map(([r,c])=>r+','+c));
  EDIT.forEach(([r,c])=>{
    const x=(c-r);
    let col;
    if(x<0) col='blue';
    else if(x>0) col='red';
    else col = southSet.has(r+','+c) ? 'red' : 'blue'; // 中央縦: 南4マスだけ赤
    state.server[r+','+c]=col;
  });
}
function initAlliances(keep){
  const n=state.allianceCount, prev=state.alliances, arr=[];
  for(let i=0;i<n;i++){
    arr.push({
      name:(keep&&prev[i])?prev[i].name:(T('同盟','Alliance ')+(i+1)),
      color:(keep&&prev[i])?prev[i].color:PALETTE[i%PALETTE.length],
      ratio:(keep&&prev[i])?prev[i].ratio:1,
      grey:(keep&&prev[i])?prev[i].grey:false,
    });
  }
  state.alliances=arr; recomputeAlliances();
}
// 12の整然パーツ(各象限を直線で3分割)。すべて王城の辺・対角に平行な直線境界。
// 時計回り: N=0,1,2 / E=3,4,5 / S=6,7,8 / W=9,10,11
function part12(r,c){
  const a=(r-c), b=(r+c)-2*((LO+HI)/2);
  const du=(c-r), dv=(c+r)-2*((LO+HI)/2);
  if(Math.abs(b)>=Math.abs(a)){            // 南北の象限(N/S)
    const seg = du<=-2?0 : du>=2?2 : 1;    // 西/中/東(画面x=du で3分割)
    if(b<0) return 0 + seg;                 // 北: 0,1,2
    return 6 + (2-seg);                      // 南: 6,7,8(時計回り反転)
  } else {                                  // 東西の象限(E/W)
    const seg = dv<=-2?0 : dv>=2?2 : 1;    // 北/中/南(画面y=dv で3分割)
    if(a<0) return 3 + seg;                 // 東: 3,4,5
    return 9 + (2-seg);                      // 西: 9,10,11
  }
}
// n同盟へのグループ化(連続パーツをまとめる。整然=直線優先、マス数差は許容)
const KC_GROUPS={
  3:[[11,0,1,2],[3,4,5,6],[7,8,9,10]],
  4:[[0,1,2],[3,4,5],[6,7,8],[9,10,11]],
  5:[[0,1,2],[3,4,5],[6,7,8],[9,10],[11]],
  6:[[0,1],[2,3],[4,5],[6,7],[8,9],[10,11]],
  7:[[0,1],[2,3],[4,5],[6,7],[8,9],[10],[11]],
  8:[[0,1],[2,3],[4,5],[6,7],[8],[9],[10],[11]],
  9:[[0,1],[2,3],[4,5],[6],[7],[8],[9],[10],[11]],
  10:[[0,1],[2,3],[4],[5],[6],[7],[8],[9],[10],[11]],
};

function recomputeAlliances(){
  const al=state.alliances;
  const n=al.length;
  const map={};

  if(n===2){
    // 2同盟: 王城を貫く1本の直線で南北2分割。完全な直線境界。
    const sorted=[...EDIT].sort((a,b)=>((a[0]+a[1])-(b[0]+b[1])) || ((a[1]-a[0])-(b[1]-b[0])));
    const cut=Math.round(EDIT.length/2);
    sorted.forEach((cell,i)=>{ map[cell[0]+','+cell[1]] = i<cut?0:1; });
    state.allianceCell=map;
    return;
  }

  // 3〜10同盟: 12の直線パーツを連続グループ化。境界はすべて王城の辺・対角に平行な直線。
  const groups=KC_GROUPS[n] || KC_GROUPS[10];
  const w2a={}; groups.forEach((g,ai)=>g.forEach(w=>w2a[w]=ai));
  EDIT.forEach(([r,c])=>{ map[r+','+c]=w2a[part12(r,c)]; });
  state.allianceCell=map;
}

/* ============ render ============ */
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){ const e=document.createElementNS(NS,tag); if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]); if(parent)parent.appendChild(e); return e; }
function cssc(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#888'; }
function serverColor(k){ const v=state.server[k]; return v==='blue'?'#3d7ff0':v==='red'?'#e0484d':GREY; }
function allianceFill(k){ const i=state.allianceCell[k]; if(i==null)return GREY; const a=state.alliances[i]; return (!a||a.grey)?GREY:a.color; }

function cityValid(r,c,ignore){
  if(r<0||c<0||r>=N||c>=N) return false;
  if(isCastle(r,c)) return false;
  for(const ct of state.cities){ if(ct.id===ignore) continue; if(ct.r===r&&ct.c===c) return false; }
  return true;
}

let boardSvg=null, highlightKey=null;
function render(forExport){
  const host=document.getElementById('svgHost'); host.innerHTML='';
  const W=BOARD_W,H=BOARD_H;
  const svg=el('svg',{class:'kc-board',viewBox:`0 0 ${W} ${H}`});
  if(forExport){ svg.setAttribute('width',W); svg.setAttribute('height',H); }
  else { svg.setAttribute('width',(W*state.zoom).toFixed(0)); svg.setAttribute('height',(H*state.zoom).toFixed(0)); }
  host.appendChild(svg); boardSvg=svg;

  el('rect',{x:0,y:0,width:W,height:H,fill:'#ffffff'},svg);

  // defs(castle grad) — エクスポートでも確実に出るよう先頭に
  const defs=el('defs',{},svg);
  const rg=el('radialGradient',{id:'kcCastleGrad',cx:'50%',cy:'45%',r:'62%'},defs);
  el('stop',{offset:'0%','stop-color':'#7fdcff'},rg);
  el('stop',{offset:'55%','stop-color':'#3f7fd0'},rg);
  el('stop',{offset:'100%','stop-color':'#23406e'},rg);

  const mode=state.mode;
  let underlay='none';
  if(mode==='city'&&state.showUnderlay){
    const s=state.underlaySource;
    if(s==='server')underlay='server';
    else if(s==='alliance')underlay='alliance';
  }

  const cells=el('g',{},svg);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(isCastle(r,c)) continue;
    const k=r+','+c;
    let fill='#eef0fb';
    if(mode==='server')fill=serverColor(k);
    else if(mode==='alliance')fill=allianceFill(k);
    else if(mode==='city'){ fill = underlay==='server'?serverColor(k): underlay==='alliance'?allianceFill(k):'#eef0fb'; }
    const poly=el('polygon',{points:polyStr(cellPoly(r,c)),fill,stroke:'rgba(0,0,0,.28)','stroke-width':0.5,'data-r':r,'data-c':c},cells);
    if(!forExport) poly.setAttribute('class','kc-cell');
    if(highlightKey===k && !forExport){
      // 選択中マスを派手に強調: 明るい黄緑+太い枠+脈動
      poly.setAttribute('fill','#ffe14d');
      poly.setAttribute('stroke','#ff4df0');
      poly.setAttribute('stroke-width','4');
      const hl=el('polygon',{points:polyStr(cellPoly(r,c)),fill:'#ffe14d','fill-opacity':0.9,stroke:'#ff4df0','stroke-width':4,'pointer-events':'none'},cells);
      const an=el('animate',{attributeName:'fill-opacity',values:'0.95;0.45;0.95',dur:'0.9s',repeatCount:'indefinite'},hl);
    }
  }

  // grid lines
  const gl=el('g',{},svg);
  for(let i=0;i<=N;i++){
    let a=projCorner(i,0),b=projCorner(i,N);
    el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'rgba(0,0,0,.07)','stroke-width':1},gl);
    let d=projCorner(0,i),e=projCorner(N,i);
    el('line',{x1:d[0],y1:d[1],x2:e[0],y2:e[1],stroke:'rgba(0,0,0,.07)','stroke-width':1},gl);
  }

  drawCastle(svg);
  // outer edge
  el('polygon',{points:polyStr([projCorner(0,0),projCorner(0,N),projCorner(N,N),projCorner(N,0)]),fill:'none',stroke:'rgba(0,0,0,.22)','stroke-width':1.6},svg);

  if(mode==='server') drawServerLabels(svg);
  if(mode==='alliance') drawAllianceLabels(svg);
  if(mode==='city') drawCities(svg);
  drawCompass(svg);

  if(!forExport) attachEvents(svg);
  return svg;
}

function drawCastle(svg){
  const top=projCorner(LO,LO),right=projCorner(LO,HI+1),bottom=projCorner(HI+1,HI+1),left=projCorner(HI+1,LO);
  const g=el('g',{},svg);
  el('polygon',{points:polyStr([top,right,bottom,left]),fill:'url(#kcCastleGrad)',stroke:'#5ad1e6','stroke-width':2.5},g);
  const cc=cellCenter((LO+HI)/2,(LO+HI)/2);
  el('text',{x:cc[0],y:cc[1]-5,'text-anchor':'middle',style:lblStyle(18,'#ffe8a8')},g).textContent=T('太陽城','SFC');
  el('text',{x:cc[0],y:cc[1]+16,'text-anchor':'middle',style:lblStyle(15,'#cfe8ff')},g).textContent=T('（設置不可）','(No build)');
}
function lblStyle(size,fill){ return `font-size:${size}px;font-weight:800;fill:${fill};paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px;font-family:sans-serif`; }
function lblStyleD(size){ return `font-size:${size}px;font-weight:800;fill:#1f2433;paint-order:stroke;stroke:rgba(255,255,255,.92);stroke-width:3.5px;font-family:sans-serif`; }

function drawCompass(svg){
  const g=el('g',{},svg);
  const top=projCorner(0,0),right=projCorner(0,N),bottom=projCorner(N,N),left=projCorner(N,0);
  [[T('北 N','N'),top,0,-12],[T('東 E','E'),right,30,4],[T('南 S','S'),bottom,0,24],[T('西 W','W'),left,-30,4]].forEach(([t,p,dx,dy])=>{
    el('text',{x:p[0]+dx,y:p[1]+dy,'text-anchor':'middle',style:lblStyleD(14)},g).textContent=t;
  });
}

function drawServerLabels(svg){
  const g=el('g',{},svg), grp={blue:[],red:[]};
  EDIT.forEach(([r,c])=>{ const v=state.server[r+','+c]; if(v==='blue'||v==='red')grp[v].push(cellCenter(r,c)); });
  [['blue',state.blueName],['red',state.redName]].forEach(([k,name])=>{
    const arr=grp[k]; if(!arr.length)return;
    let sx=0,sy=0; arr.forEach(p=>{sx+=p[0];sy+=p[1];});
    el('text',{x:sx/arr.length,y:sy/arr.length,'text-anchor':'middle',style:lblStyleD(19)},g).textContent=name;
  });
}
function drawAllianceLabels(svg){
  const g=el('g',{},svg), grp={};
  EDIT.forEach(([r,c])=>{ const i=state.allianceCell[r+','+c]; (grp[i]=grp[i]||[]).push(cellCenter(r,c)); });
  Object.keys(grp).forEach(i=>{
    const a=state.alliances[i]; if(!a)return; const arr=grp[i];
    let sx=0,sy=0; arr.forEach(p=>{sx+=p[0];sy+=p[1];});
    el('text',{x:sx/arr.length,y:sy/arr.length,'text-anchor':'middle',style:lblStyleD(17)},g)
      .textContent=a.name+(a.grey?T('（非表示）','(hidden)'):'');
  });
}
function drawCities(svg){
  const g=el('g',{},svg);
  // ①まず全ての都市タイルを描画(下層)
  state.cities.forEach(ct=>{
    el('polygon',{points:polyStr(cellPoly(ct.r,ct.c)),fill:'#ffd36b','fill-opacity':0.95,stroke:'#1a1206','stroke-width':1.4},g);
  });
  // ②次に全てのラベルを上層に描画(タイルに上書きされない)
  const labelLayer=el('g',{},svg);
  state.cities.forEach(ct=>{
    const cx=cellCenter(ct.r,ct.c)[0], cy=cellCenter(ct.r,ct.c)[1];
    if(ct.name){
      // 番号は小さくタイル上部、担当者名はタイル中央に読みやすく(縁取り付き)
      el('text',{x:cx,y:cy-4,'text-anchor':'middle',style:'font-size:9px;font-weight:800;fill:#1a1206;font-family:sans-serif'},labelLayer).textContent='#'+ct.id;
      el('text',{x:cx,y:cy+9,'text-anchor':'middle',style:lblStyleD(11)},labelLayer).textContent=ct.name;
    } else {
      el('text',{x:cx,y:cy+3,'text-anchor':'middle',style:'font-size:12px;font-weight:800;fill:#1a1206;font-family:sans-serif'},labelLayer).textContent='#'+ct.id;
    }
  });
}

/* ============ events ============ */
let painting=false;
function attachEvents(svg){
  if(state.mode==='city'){
    svg.addEventListener('click',e=>{
      const t=e.target;
      if(t.classList&&t.classList.contains('kc-cell')){
        const r=+t.getAttribute('data-r'), c=+t.getAttribute('data-c');
        if(isCastle(r,c)) return;
        if(!cityValid(r,c,null)){ flash('cityErr',T('そのマスには配置できません（王城・既設）。','Cannot place here (castle or already used).')); return; }
        state.pendingCity=[r,c]; highlightKey=r+','+c; render(false); openCityPop(r,c);
      }
    });
    return;
  }
  const onCell=(t)=>{
    const r=+t.getAttribute('data-r'), c=+t.getAttribute('data-c');
    if(Number.isNaN(r)||isCastle(r,c)) return;
    const k=r+','+c;
    if(state.mode==='server'){ state.server[k]=currentBrush; t.setAttribute('fill',serverColor(k)); }
    else if(state.mode==='alliance' && state.alliancePicking>=0){ state.allianceCell[k]=state.alliancePicking; t.setAttribute('fill',allianceFill(k)); }
  };
  svg.addEventListener('pointerdown',e=>{
    const t=e.target;
    if(t.classList&&t.classList.contains('kc-cell')){ painting=true; e.preventDefault(); onCell(t); }
  });
  svg.addEventListener('pointermove',e=>{
    if(!painting)return;
    e.preventDefault();
    const t=document.elementFromPoint(e.clientX,e.clientY);
    if(t&&t.classList&&t.classList.contains('kc-cell')) onCell(t);
  });
  window.addEventListener('pointerup',()=>{ if(painting){painting=false; render(false); if(state.mode==='server')updateServerCount(); if(state.mode==='alliance')buildAllianceList();} });
}

function openCityPop(r,c){
  document.getElementById('pop-title').textContent=T('この場所に都市を登録しますか？','Register a city here?');
  document.getElementById('pop-body').textContent=T('選択中のマスに都市を追加します。','A city will be added to the highlighted cell.');
  document.getElementById('cityPop').classList.add('show');
}
function closeCityPop(){ document.getElementById('cityPop').classList.remove('show'); highlightKey=null; state.pendingCity=null; render(false); }

/* ============ UI ============ */
let currentBrush='blue';
function setMode(m){
  state.mode=m;kcTrack("kc_set_mode",{mode:m});
  document.querySelectorAll('.kc-mode').forEach(b=>b.classList.toggle('on',b.getAttribute('data-mode')===m));
  document.querySelectorAll('.kc-mode-panel').forEach(p=>p.classList.add('hide'));
  document.getElementById('panel-'+m).classList.remove('hide');
  document.getElementById('stageHint').textContent={
    server:T('サーバーエリア編集モード','Server area mode'),
    alliance:T('同盟エリア編集モード','Alliance area mode'),
    city:T('都市配置モード','City placement mode')}[m];
  state.alliancePicking=-1; highlightKey=null;
  render(false);
  if(m==='server') updateServerCount();
  if(m==='alliance') buildAllianceList();
  if(m==='city') buildCityList();
}

function updateServerCount(){
  let b=0,r=0,g=0;
  EDIT.forEach(([rr,cc])=>{ const v=state.server[rr+','+cc]; if(v==='blue')b++; else if(v==='red')r++; else g++; });
  const box=document.getElementById('serverCount');
  box.innerHTML=
    `<div class="cnt blue">${b}<small>${escapeHtml(state.blueName)}</small></div>`+
    `<div class="cnt red">${r}<small>${escapeHtml(state.redName)}</small></div>`+
    (g>0?`<div class="cnt grey">${g}<small>${T('グレー','Grey')}</small></div>`:'');
}

function buildAllianceList(){
  const box=document.getElementById('allianceList'); box.innerHTML='';
  // 各同盟の保有マス数を集計
  const counts={};
  Object.values(state.allianceCell).forEach(i=>counts[i]=(counts[i]||0)+1);
  state.alliances.forEach((a,i)=>{
    const row=document.createElement('div');
    row.className='kc-li kc-ali'+(state.alliancePicking===i?' picking':'');
    row.innerHTML=`<span class="tag" style="background:${a.grey?GREY:a.color}">${i+1}</span>
      <input type="text" value="${escapeHtml(a.name)}" data-i="${i}" class="aname" maxlength="16" placeholder="${T('同盟名','Alliance name')}">
      <span class="kc-acount" title="${T('保有マス数','Cells')}">${counts[i]||0}${T('マス','')}</span>
      <label class="kc-colorlbl" title="${T('同盟カラー','Alliance color')}">
        <input type="color" value="${a.color}" data-i="${i}" class="acolor">
        <span>${T('色','Color')}</span>
      </label>`;
    const btns=document.createElement('div'); btns.className='row2';
    const pk=document.createElement('button'); pk.className='kc-btn sm'+(state.alliancePicking===i?' primary':'');
    pk.textContent=state.alliancePicking===i?T('塗替中','Painting'):T('個別塗替','Repaint');
    pk.onclick=()=>{ state.alliancePicking=state.alliancePicking===i?-1:i; buildAllianceList(); render(false); };
    const gy=document.createElement('button'); gy.className='kc-btn sm';
    gy.textContent=a.grey?T('表示','Show'):T('非表示','Hide');
    gy.onclick=()=>{ a.grey=!a.grey; buildAllianceList(); render(false); };
    btns.appendChild(pk); btns.appendChild(gy); row.appendChild(btns);
    box.appendChild(row);
  });
  box.querySelectorAll('.aname').forEach(inp=>inp.oninput=e=>{ state.alliances[+e.target.dataset.i].name=e.target.value; render(false); });
  box.querySelectorAll('.acolor').forEach(inp=>inp.oninput=e=>{
    const i=+e.target.dataset.i, v=e.target.value;
    if(state.alliances.some((a,j)=>j!==i&&!a.grey&&a.color.toLowerCase()===v.toLowerCase())){
      flash('allianceErr',T('他の同盟と同じ色は使えません。','That color is already used by another alliance.'));
      e.target.value=state.alliances[i].color; return;
    }
    state.alliances[i].color=v; buildAllianceList(); render(false);
  });
}

function buildCityList(){
  const box=document.getElementById('cityList'); box.innerHTML='';
  if(!state.cities.length){ box.innerHTML=`<div class="kc-note">${T('まだ都市がありません。空きマスをタップして登録してください。','No cities yet. Tap an empty cell to add one.')}</div>`; return; }
  state.cities.forEach(ct=>{
    const row=document.createElement('div'); row.className='kc-li';
    row.innerHTML=`<span class="tag" style="background:#ffd36b;color:#1a1206">${ct.id}</span>
      <input type="text" placeholder="${T('担当者名','Owner name')}" value="${escapeHtml(ct.name)}" data-id="${ct.id}" class="cname" maxlength="14">`;
    const del=document.createElement('button'); del.className='kc-btn sm danger'; del.textContent=T('削除','Delete');
    del.onclick=()=>{ state.cities=state.cities.filter(x=>x.id!==ct.id); render(false); buildCityList(); };
    row.appendChild(del); box.appendChild(row);
  });
  box.querySelectorAll('.cname').forEach(inp=>inp.oninput=e=>{ const ct=state.cities.find(c=>c.id===+e.target.dataset.id); if(ct){ct.name=e.target.value; render(false);} });
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function flash(id,msg){ const e=document.getElementById(id); e.textContent=msg; setTimeout(()=>e.textContent='',2800); }

/* ============ export (黒対策込み) ============ */
function buildExportSVG(){
  const svg=render(true);                 // forExport描画
  const clone=svg.cloneNode(true);
  render(false);                          // 表示を戻す
  const W=BOARD_W,H=BOARD_H,extra=52;
  clone.setAttribute('viewBox',`0 ${-extra} ${W} ${H+extra}`);
  clone.setAttribute('width',W); clone.setAttribute('height',H+extra);
  // タイトル帯
  const bg=document.createElementNS(NS,'rect');
  bg.setAttribute('x',0); bg.setAttribute('y',-extra); bg.setAttribute('width',W); bg.setAttribute('height',extra); bg.setAttribute('fill','#ffffff');
  clone.insertBefore(bg,clone.firstChild);
  const ttl=document.createElementNS(NS,'text');
  const titleText = state.mode==='server'?`${state.blueName} vs ${state.redName}`
    : state.mode==='alliance'?T('同盟エリア配置','Alliance Areas')
    : T('都市配置マップ','City Map');
  ttl.setAttribute('x',W/2); ttl.setAttribute('y',-16); ttl.setAttribute('text-anchor','middle');
  ttl.setAttribute('style','font-size:25px;font-weight:800;fill:#1f2433;font-family:sans-serif;paint-order:stroke;stroke:rgba(255,255,255,.9);stroke-width:3.5px');
  ttl.textContent=titleText; clone.appendChild(ttl);
  // サイトURL(左下に控えめに表示)
  const url=document.createElementNS(NS,'text');
  url.setAttribute('x',14); url.setAttribute('y',BOARD_H-12); url.setAttribute('text-anchor','start');
  url.setAttribute('style','font-size:17px;font-weight:700;fill:#1f2433;font-family:sans-serif;paint-order:stroke;stroke:rgba(255,255,255,.92);stroke-width:3.5px');
  url.textContent='whitesim-lab.com';
  clone.appendChild(url);
  return {clone, W, H:H+extra};
}
function renderToCanvas(cb){
  const {clone,W,H}=buildExportSVG();
  let xml=new XMLSerializer().serializeToString(clone);
  // xmlns重複の保険(一部環境で二重付与されるため)
  const m=xml.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g);
  if(m&&m.length>1){
    let first=true;
    xml=xml.replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ()=>{ if(first){first=false; return ' xmlns="http://www.w3.org/2000/svg"';} return ''; });
  }
  if(xml.indexOf('xmlns=')<0){ xml=xml.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'); }
  const draw=(img)=>{
    const scale=2;
    const canvas=document.createElement('canvas');
    canvas.width=W*scale; canvas.height=H*scale;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    canvas.toBlob(b=>cb(b,canvas),'image/png');
  };
  // data URI(UTF-8安全エンコード)でSVGを画像化。CSP img-src data: で許可済み。
  const img=new Image();
  img.onload=()=>{ try{ draw(img); }catch(e){ cb(null,null); } };
  img.onerror=()=>{
    // フォールバック: Blob URL を試す
    try{
      const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const img2=new Image();
      img2.onload=()=>{ try{ draw(img2); }catch(e){ cb(null,null);} URL.revokeObjectURL(url); };
      img2.onerror=()=>{ URL.revokeObjectURL(url); cb(null,null); };
      img2.src=url;
    }catch(e){ cb(null,null); }
  };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);
}
function exportImage(){
  kcTrack("kc_export_image",{mode:state.mode});
  renderToCanvas((blob)=>{
    if(!blob){ flash('exportMsg',T('画像の生成に失敗しました。','Image generation failed.')); return; }
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`oukasen_${state.mode}_${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    const m=document.getElementById('exportMsg'); m.style.color='#15a35b';
    m.textContent=T('✅ 画像を保存しました。','✅ Image saved.');
    setTimeout(()=>m.textContent='',3500);
  });
}
function shareX(){
  kcTrack("kc_share",{mode:state.mode});
  // 画像は自動添付できないため、テキスト+URLでX投稿画面を開く
  const txt = state.mode==='server'?T(`王城戦SvS: ${state.blueName} vs ${state.redName} のエリア配置を作成！`,`King Castle War: ${state.blueName} vs ${state.redName} area plan!`)
    : state.mode==='alliance'?T('王城戦の同盟エリア配置を作成！','Made an alliance area plan for King Castle War!')
    : T('王城戦の都市配置マップを作成！','Made a city map for King Castle War!');
  const tags=T('#ホワサバ #王城戦 #whitesim_lab','#WhiteoutSurvival #KingCastle #whitesim_lab');
  const url='https://whitesim-lab.com/tools/king-castle/';
  const u='https://twitter.com/intent/tweet?text='+encodeURIComponent(txt+' '+tags)+'&url='+encodeURIComponent(url);
  const w=window.open(u,'_blank','noopener,noreferrer'); if(w)w.opener=null;
  const m=document.getElementById('exportMsg'); m.style.color='#15a35b';
  m.textContent=T('Xの投稿画面を開きました。「画像を保存」した画像を添付できます。','Opened X. You can attach the saved image.');
  setTimeout(()=>m.textContent='',5000);
}

/* ============ i18n静的ラベル ============ */
function applyI18n(){
  if(!EN) return;
  const map={
    'pgtitle':'King Castle War Area Planner | Whiteout Tools Lab',
    't-title':'King Castle War Area Planner','t-intro':'Plan your SvS server split, alliance areas, and city placement — then share as an image or on X. The central Sun City (6×6) is a no-build zone.',
    't-m1':'Server Areas','t-m2':'Alliance Areas','t-m3':'City Placement',
    't-sh':'Server area settings','t-sh2':'Blue = your server / Red = enemy. Tap cells to paint.',
    't-blue':'Blue server name (yours)','t-red':'Red server name (enemy)','t-brush':'Brush','t-sw-grey':'Grey',
    't-snote':'Tap or drag to paint. Default is a near-even left/right split (south 4 cells of the center column are red).',
    't-sreset':'Reset server',
    't-ah':'Alliance area settings','t-ah2':'Enter a count and apply — it auto-divides along the castle edges with straight lines.',
    't-acount':'Number of alliances (2–10)',
    't-anote':'Repaint: press “Repaint”, then tap a cell to set it to that alliance. Hide: press “Hide” to grey out (hide) an alliance.',
    't-ch':'City placement','t-ch2':'Tap an empty cell → confirm in the popup. 1 cell = 1 city.',
    't-cguide':'Tap a cell to place. It lights up and a confirm popup appears. Press “Register” to add a numbered city.',
    't-underlay':'Show server/alliance colors underneath',
    't-ulayer':'Underlay layer','t-ul-server':'Server areas','t-ul-alliance':'Alliance areas','t-ul-none':'None',
  };
  for(const id in map){ const e=document.getElementById(id); if(e){ if(id==='pgtitle')document.title=map[id]; else e.textContent=map[id]; } }
  // ボタンテキスト
  setBtn('exportBtn','Save image'); setBtn('shareXBtn','𝕏 Share');
  document.getElementById('applyAlliance').textContent='Apply';
  document.getElementById('resetAlliance').textContent='Reset alliances';
  document.getElementById('resetCity').textContent='Reset cities';
  document.getElementById('blueName').value='My Server';
  document.getElementById('redName').value='Enemy Server';
  document.getElementById('popCancel').textContent='Cancel';
  document.getElementById('popConfirm').textContent='Register';
  document.getElementById('pop-title').textContent='Register a city here?';
  document.getElementById('pop-body').textContent='A city will be added to the highlighted cell.';
  // ブラシ表記
  document.querySelector('#serverBrush .blue').textContent='Blue';
  document.querySelector('#serverBrush .red').textContent='Red';
  document.documentElement.lang='en';
}
function setBtn(id,txt){ const e=document.getElementById(id); if(e&&txt)e.textContent=txt; }

/* ============ bind & boot ============ */
function bind(){
  document.querySelectorAll('.kc-mode').forEach(b=>b.onclick=()=>setMode(b.getAttribute('data-mode')));
  document.getElementById('blueName').oninput=e=>{ state.blueName=e.target.value; if(state.mode==='server'){render(false);updateServerCount();} };
  document.getElementById('redName').oninput=e=>{ state.redName=e.target.value; if(state.mode==='server'){render(false);updateServerCount();} };
  document.querySelectorAll('#serverBrush .kc-sw').forEach(s=>s.onclick=()=>{ currentBrush=s.getAttribute('data-brush');
    document.querySelectorAll('#serverBrush .kc-sw').forEach(x=>x.classList.toggle('on',x===s)); });
  document.getElementById('resetServer').onclick=()=>{ initServer(); render(false); updateServerCount(); };

  document.getElementById('allianceCount').onchange=e=>{ let v=parseInt(e.target.value)||2; v=Math.max(2,Math.min(10,v)); e.target.value=v; state.allianceCount=v; };
  document.getElementById('applyAlliance').onclick=()=>{ let v=parseInt(document.getElementById('allianceCount').value)||2; v=Math.max(2,Math.min(10,v)); state.allianceCount=v; initAlliances(true); buildAllianceList(); render(false); };
  document.getElementById('resetAlliance').onclick=()=>{ document.getElementById('allianceCount').value=6; state.allianceCount=6; initAlliances(false); buildAllianceList(); render(false); };

  document.getElementById('showUnderlay').onchange=e=>{ state.showUnderlay=e.target.checked; render(false); };
  document.getElementById('underlaySource').onchange=e=>{ state.underlaySource=e.target.value; render(false); };
  document.getElementById('resetCity').onclick=()=>{ state.cities=[]; state.cityCounter=0; render(false); buildCityList(); };

  document.getElementById('exportBtn').onclick=exportImage;
  document.getElementById('shareXBtn').onclick=shareX;
  document.getElementById('zoomIn').onclick=()=>{ state.zoom=Math.min(2.4,state.zoom+0.18); render(false); };
  document.getElementById('zoomOut').onclick=()=>{ state.zoom=Math.max(0.5,state.zoom-0.18); render(false); };

  // popup
  document.getElementById('popCancel').onclick=closeCityPop;
  document.getElementById('cityPop').addEventListener('click',e=>{ if(e.target.id==='cityPop')closeCityPop(); });
  document.getElementById('popConfirm').onclick=()=>{
    if(state.pendingCity){
      const [r,c]=state.pendingCity;
      if(cityValid(r,c,null)){ state.cityCounter++; state.cities.push({id:state.cityCounter,r,c,name:''}); }
    }
    document.getElementById('cityPop').classList.remove('show');
    highlightKey=null; state.pendingCity=null; render(false); buildCityList();
  };
}

function fitZoom(){
  const host=document.getElementById('kcScroll'); const avail=host.clientWidth-6;
  if(avail>0) state.zoom=Math.max(0.5,Math.min(1.5,avail/BOARD_W));
}
function boot(){
  applyI18n();
  // 念のため上限を10に強制(古いHTMLキャッシュ対策)
  var acInput=document.getElementById('allianceCount');
  if(acInput){ acInput.max='10'; acInput.setAttribute('max','10'); }
  initServer(); initAlliances(false); bind();
  fitZoom();
  setMode('server');
}
document.addEventListener('DOMContentLoaded',boot);
