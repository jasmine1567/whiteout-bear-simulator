/* ホワサバ熊狩 共通英雄マスタ(全ツール・記事で共有) 自動生成 */
window.WOS_HERO_EN = {"smith": "Smith", "eugene": "Eugene", "charlie": "Charlie", "cloris": "Cloris", "sergey": "Sergey", "patrick": "Patrick", "jessie": "Jessie", "lingxue": "Ling Xue", "lumak": "Lumak Bokan", "gina": "Gina", "jasser": "Jasser", "seoyoon": "Seo-yoon", "bahiti": "Bahiti", "natalia": "Natalia", "jeronimo": "Jeronimo", "molly": "Molly", "zinman": "Zinman", "flint": "Flint", "philly": "Philly", "alonso": "Alonso", "logan": "Logan", "mia": "Mia", "greg": "Greg", "ahmose": "Ahmose", "reina": "Reina", "lynn": "Lynn", "hector": "Hector", "nora": "Nora", "gwen": "Gwen", "wuming": "Wu Ming", "renee": "Renee", "wayne": "Wayne", "edith": "Edith", "gordon": "Gordon", "bradley": "Bradley", "gatot": "Gatot", "sonya": "Sonya", "hendrik": "Hendrik", "magnus": "Magnus", "fred": "Fred", "xura": "Xura", "gregory": "Gregory", "freya": "Freya", "blanchette": "Blanchette", "eleonora": "Eleonora", "lloyd": "Lloyd", "rufus": "Rufus", "hervor": "Hervor", "karol": "Karol", "ligeia": "Ligeia", "gisela": "Gisela", "flora": "Flora", "vulcanus": "Vulcanus", "elif": "Elif", "dominic": "Dominic", "cara": "Cara", "hank": "Hank", "estrella": "Estrella", "viveca": "Viveca", "seigel": "Seigel", "ursar": "Ursar", "aisling": "Aisling"};
window.WOS_HEROES = (function(){
const HEROES = [
 /* ===== 常設 R ===== */
 {id:'smith',  name:'スミス',     cls:'inf', gen:0, rar:'R'},
 {id:'eugene', name:'ユージーン', cls:'inf', gen:0, rar:'R'},
 {id:'charlie',name:'チャーリー', cls:'lan', gen:0, rar:'R'},
 {id:'cloris', name:'クラリス',   cls:'mks', gen:0, rar:'R'},
 /* ===== 常設 SR ===== */
 {id:'sergey', name:'セルゲイ', cls:'inf', gen:0, rar:'SR'},
 {id:'patrick',name:'パトリック', cls:'lan', gen:0, rar:'SR', expAtk:140.11,
  joiner:null,
  leader:{label:'攻撃+25%(カロリー吸収)', parts:[{k:'atk',v:.25}]}},
 {id:'jessie', name:'ジェシー', cls:'lan', gen:0, rar:'SR', expAtk:140.11,
  joiner:{label:'与ダメ+5→25%(完全武装)', parts:[{k:'dmg',v:.25}]},
  leader:{label:'与ダメ25(完全武装)', parts:[{k:'dmg',v:.25}]}},
 {id:'lingxue',name:'リンセツ', cls:'lan', gen:0, rar:'SR'},
 {id:'lumak',  name:'ルム・ボーガン', cls:'lan', gen:0, rar:'SR'},
 {id:'gina',   name:'ジーナ', cls:'mks', gen:0, rar:'SR'},
 {id:'jasser', name:'ジャセル', cls:'mks', gen:0, rar:'SR', expAtk:140.11,
  joiner:{label:'与ダメ+5→25%(戦術演習)', parts:[{k:'dmg',v:.25}]},
  leader:{label:'与ダメ25(戦術演習)', parts:[{k:'dmg',v:.25}]}},
 {id:'seoyoon',name:'ソユン', cls:'mks', gen:0, rar:'SR', expAtk:140.11,
  joiner:{label:'攻撃+5→25%(征伐の陣太鼓)', parts:[{k:'atk',v:.25}]},
  leader:{label:'攻撃25(征伐の陣太鼓)', parts:[{k:'atk',v:.25}]}},
 {id:'bahiti', name:'バシティ', cls:'mks', gen:0, rar:'SR',
  joiner:null,
  leader:{label:'50%で与ダメ+50%', parts:[{k:'chance',p:.5,v:.50}]},
  syn:{mks:.03}},
 /* ===== 第1世代 ===== */
 {id:'natalia', name:'ナタリア', cls:'inf', gen:1, rar:'SSR',
  gear:{type:'leth', min:.05, max:.15, label:'集結殺傷+5→15%'},
  joiner:null,
  leader:{label:'攻撃25/与ダメ25/攻撃10',
   parts:[{k:'atk',v:.25},{k:'dmg',v:.25},{k:'atk',v:.10}]},
  syn:{inf:.03}},
 {id:'jeronimo', name:'ジェロニモ', cls:'inf', gen:1, rar:'SSR', expAtk:260.20,
  gear:{type:'atk', min:.05, max:.15, label:'集結攻撃+5→15%(真実の術)'},
  joiner:{label:'与ダメ+5→25%(決起集会)', parts:[{k:'dmg',v:.25}]},
  leader:{label:'与ダメ25/攻撃25/4T毎与ダメ30/殺傷15',
   parts:[{k:'dmg',v:.25},{k:'atk',v:.25},{k:'uptime',per:4,dur:2,v:.30},{k:'leth',v:.15}]},
  syn:{inf:.03}},
 {id:'molly', name:'ジャスミン', cls:'lan', gen:1, rar:'SSR',
  joiner:null,
  leader:{label:'50%で与ダメ50/固定与ダメ25',
   parts:[{k:'chance',p:.5,v:.50},{k:'dmg',v:.25}]},
  syn:{lan:.03}},
 {id:'zinman', name:'ジンマン', cls:'mks', gen:1, rar:'SSR'},
 /* ===== 第2世代 ===== */
 {id:'flint', name:'フリント', cls:'inf', gen:2, rar:'SSR',
  joiner:{label:'炎上20%/3T(期待+24%)', parts:[{k:'chanceUptime',p:.2,dur:3,v:.40}]},
  leader:{label:'攻撃25/殺傷25', parts:[{k:'atk',v:.25},{k:'leth',v:.25}]},
  syn:{inf:.04}},
 {id:'philly', name:'フレンダー', cls:'lan', gen:2, rar:'SSR',
  joiner:{label:'攻撃+15%', parts:[{k:'atk',v:.15}]},
  leader:{label:'攻撃15', parts:[{k:'atk',v:.15}]}, syn:{lan:.03}},
 {id:'alonso', name:'アロンゾ', cls:'mks', gen:2, rar:'SSR',
  gear:{type:'leth', min:.05, max:.15, label:'集結殺傷+5→15%'},
  joiner:null,
  leader:{label:'50%で与ダメ50/40%で殺傷50',
   parts:[{k:'chance',p:.5,v:.50},{k:'chanceLeth',p:.4,v:.50}]},
  syn:{mks:.05}},
 /* ===== 第3世代 ===== */
 {id:'logan', name:'ローガン', cls:'inf', gen:3, rar:'SSR',
  joiner:{label:'追撃20%/3T(期待+24%)', parts:[{k:'chanceUptime',p:.2,dur:3,v:.40}]},
  leader:null},
 {id:'mia', name:'ミア', cls:'lan', gen:3, rar:'SSR', expAtk:290.23, expLeth:70,
  gear:{type:'atk', min:.05, max:.15, label:'集結攻撃+5→15%(宿命の集結)'},
  joiner:{label:'50%で被ダメ+10→50%(不幸の連鎖)', parts:[{k:'chance',p:.5,v:.50}]},
  leader:{label:'50%被ダメ+50/50%与ダメ+50',
   parts:[{k:'chance',p:.5,v:.50},{k:'chance',p:.5,v:.50}]},
  syn:{lan:.05}},
 {id:'greg', name:'グレッグ', cls:'mks', gen:3, rar:'SSR', expAtk:290.23,
  gearNote:'集結HP+15%(熊補正なし)',
  joiner:{label:'20%で全軍ダメ+8→40%/3T(正義の剣)', parts:[{k:'chanceUptime',p:.2,dur:3,v:.40}]},
  leader:{label:'20%で全軍ダメ40/3T(正義の剣)', parts:[{k:'chanceUptime',p:.2,dur:3,v:.40}]},
  syn:{mks:.04}},
 /* ===== 第4世代 ===== */
 {id:'ahmose', name:'アクモス', cls:'inf', gen:4, rar:'SSR'},
 {id:'reina', name:'レイナ', cls:'lan', gen:4, rar:'SSR',
  gear:{type:'leth', min:.05, max:.15, label:'集結殺傷+5→15%'},
  joiner:{label:'通常攻撃ダメ+30%', parts:[{k:'dmg',v:.30}]},
  leader:{label:'通常攻撃30/槍25%で200%追撃',
   parts:[{k:'dmg',v:.30},{k:'tChance',cls:'lan',p:.25,v:2.00}]},
  syn:{lan:.05}},
 {id:'lynn', name:'リオン', cls:'mks', gen:4, rar:'SSR',
  joiner:{label:'40%で与ダメ+50%(期待+20%)', parts:[{k:'chance',p:.4,v:.50}]},
  leader:{label:'40%で与ダメ50', parts:[{k:'chance',p:.4,v:.50}]}},
 /* ===== 第5世代 ===== */
 {id:'hector', name:'ヘクトー', cls:'inf', gen:5, rar:'SSR',
  joiner:null,
  leader:{label:'減衰バフ(盾弓)+25%で200%追撃',
   parts:[{k:'hector',infV:2.00,mksV:1.00,blitzP:.25,blitzV:2.00}]},
  syn:{inf:.05}},
 {id:'nora', name:'ノラ', cls:'lan', gen:5, rar:'SSR',
  joiner:{label:'盾弓:与ダメ+15%', parts:[{k:'tDmg',cls:'im',v:.15}]},
  leader:null},
 {id:'gwen', name:'グエン', cls:'mks', gen:5, rar:'SSR',
  joiner:{label:'敵被ダメ+25%', parts:[{k:'dmg',v:.25}]},
  leader:{label:'敵被ダメ25', parts:[{k:'dmg',v:.25}]}},
 /* ===== 第6世代 ===== */
 {id:'wuming', name:'無名', cls:'inf', gen:6, rar:'SSR'},
 {id:'renee', name:'レネ', cls:'lan', gen:6, rar:'SSR',
  joiner:{label:'槍:3T毎に200%追撃', parts:[{k:'tPeriodic',cls:'lan',per:3,v:2.00}]},
  leader:null},
 {id:'wayne', name:'ウェイン', cls:'mks', gen:6, rar:'SSR',
  joiner:{label:'4T毎に100%追加攻撃(+20%)', parts:[{k:'periodic',per:4,v:1.00}]},
  leader:{label:'4T毎100%追加攻撃', parts:[{k:'periodic',per:4,v:1.00}]},
  syn:{mks:.04}},
 /* ===== 第7世代 ===== */
 {id:'edith', name:'エディス', cls:'inf', gen:7, rar:'SSR',
  joiner:{label:'槍:与ダメ+20%', parts:[{k:'tDmg',cls:'lan',v:.20}]},
  leader:null},
 {id:'gordon', name:'ゴードン', cls:'lan', gen:7, rar:'SSR',
  joiner:{label:'槍:2回毎に100%追撃', parts:[{k:'tPeriodic',cls:'lan',per:2,v:1.00}]},
  leader:null},
 {id:'bradley', name:'ブラッドリー', cls:'mks', gen:7, rar:'SSR', expAtk:650.52,
  gearNote:'防衛部隊攻撃+15%(熊補正なし)',
  joiner:{label:'攻撃+5→25%(老兵の誇り)', parts:[{k:'atk',v:.25}]},
  leader:{label:'攻撃25/4T毎与ダメ30(戦局洞察)',
   parts:[{k:'atk',v:.25},{k:'uptime',per:4,dur:2,v:.30}]},
  syn:{mks:.08}},
 /* ===== 第8世代 ===== */
 {id:'gatot', name:'ガト', cls:'inf', gen:8, rar:'SSR'},
 {id:'sonya', name:'ソニヤ', cls:'lan', gen:8, rar:'SSR',
  joiner:{label:'与ダメ+20%', parts:[{k:'dmg',v:.20}]},
  leader:{label:'与ダメ20/周期火力/槍強化',
   parts:[{k:'dmg',v:.20},{k:'flat',m:1.125},{k:'tDmg',cls:'lan',v:.375}]},
  syn:{lan:.05}},
 {id:'hendrik', name:'ヘンドリック', cls:'mks', gen:8, rar:'SSR'},
 /* ===== 第9世代 ===== */
 {id:'magnus', name:'マグヌス', cls:'inf', gen:9, rar:'SSR',
  joiner:{label:'攻撃+25%', parts:[{k:'atk',v:.25}]},
  leader:{label:'攻撃25/弓与ダメ10', parts:[{k:'atk',v:.25},{k:'tDmg',cls:'mks',v:.10}]},
  syn:{inf:.03}},
 {id:'fred', name:'フレッド', cls:'lan', gen:9, rar:'SSR'},
 {id:'xura', name:'シュラ', cls:'mks', gen:9, rar:'SSR'},
 /* ===== 第10世代 ===== */
 {id:'gregory', name:'グレゴリー', cls:'inf', gen:10, rar:'SSR'},
 {id:'freya', name:'フレイヤ', cls:'lan', gen:10, rar:'SSR'},
 {id:'blanchette', name:'ブランシュ', cls:'mks', gen:10, rar:'SSR',
  joiner:{label:'殺傷+25%', parts:[{k:'leth',v:.25}]},
  leader:{label:'殺傷25/3T毎弓75%追撃',
   parts:[{k:'leth',v:.25},{k:'tPeriodic',cls:'mks',per:3,v:.75}]},
  syn:{mks:.08}},
 /* ===== 第11世代 ===== */
 {id:'eleonora', name:'エリオノーラ', cls:'inf', gen:11, rar:'SSR'},
 {id:'lloyd', name:'ロイド', cls:'lan', gen:11, rar:'SSR'},
 {id:'rufus', name:'ルーファス', cls:'mks', gen:11, rar:'SSR',
  joiner:{label:'攻撃+25%', parts:[{k:'atk',v:.25}]},
  leader:{label:'攻撃25/弓与ダメ60', parts:[{k:'atk',v:.25},{k:'tDmg',cls:'mks',v:.60}]},
  syn:{mks:.08}},
 /* ===== 第12世代 ===== */
 {id:'hervor', name:'ヘルヴィル', cls:'inf', gen:12, rar:'SSR',
  joiner:{label:'殺傷+25%', parts:[{k:'leth',v:.25}]},
  leader:{label:'殺傷25', parts:[{k:'leth',v:.25}]},
  syn:{inf:.04}},
 {id:'karol', name:'カロール', cls:'lan', gen:12, rar:'SSR'},
 {id:'ligeia', name:'ライジーア', cls:'mks', gen:12, rar:'SSR'},
 /* ===== 第13世代 ===== */
 {id:'gisela', name:'ギーゼラ', cls:'inf', gen:13, rar:'SSR'},
 {id:'flora', name:'フローラ', cls:'lan', gen:13, rar:'SSR'},
 {id:'vulcanus', name:'ウルカヌス', cls:'mks', gen:13, rar:'SSR'},
 /* ===== 第14世代 ===== */
 {id:'elif', name:'エリーフ', cls:'inf', gen:14, rar:'SSR'},
 {id:'dominic', name:'ドミニク', cls:'lan', gen:14, rar:'SSR'},
 {id:'cara', name:'カーラ', cls:'mks', gen:14, rar:'SSR'},
 /* ===== 第15世代 ===== */
 {id:'hank', name:'ハンク', cls:'inf', gen:15, rar:'SSR'},
 {id:'estrella', name:'エステラ', cls:'lan', gen:15, rar:'SSR'},
 {id:'viveca', name:'ヴィヴィカ', cls:'mks', gen:15, rar:'SSR'},
 /* ===== 第16世代 ===== */
 {id:'seigel', name:'シガー', cls:'inf', gen:16, rar:'SSR', expAtk:2131.70,
  gearNote:'防衛部隊殺傷+15%(熊補正なし)',
  joiner:null,
  leader:{label:'盾兵攻撃-20%(永夜の堅城/熊では微減)',
   parts:[{k:'tAtk',cls:'inf',v:-.20}]}},
 {id:'ursar', name:'ウルタール', cls:'lan', gen:16, rar:'SSR'},
 {id:'aisling', name:'アシュリン', cls:'mks', gen:16, rar:'SSR', expAtk:2131.70,
  gearNote:'防衛部隊防御+15%(熊補正なし)',
  joiner:{label:'与ダメ+4→20%(密林の戦歌)', parts:[{k:'dmg',v:.20}]},
  leader:{label:'与ダメ20/3T毎弓与ダメ150/3T毎弓追撃40',
   parts:[{k:'dmg',v:.20},{k:'tUptime',cls:'mks',per:3,dur:1,v:1.50},{k:'tPeriodic',cls:'mks',per:3,v:.40}]},
  syn:{mks:.08}},
];
return HEROES;})();

window.WOS_CONST = {
  CLS: {inf:{n:"盾",c:"#9db4c9"}, lan:{n:"槍",c:"#7fb6d9"}, mks:{n:"弓",c:"#f2a23c"}},
  RAR_HEX: {R:"#5aa7e8", SR:"#b07ce8", SSR:"#e8c35a"},
  MAX_GEN: 16
};
window.WOS_ICON = function(hero){
  var C=window.WOS_CONST.CLS[hero.cls], c=C.c;
  var EN=(window.WOS_LANG||"ja")==="en";
  var g=hero.gen===0?(EN?"P":"常"):"G"+hero.gen;
  var glyph=EN?({inf:"I",lan:"L",mks:"M"})[hero.cls]:C.n;
  var s="<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><defs><radialGradient id='g' cx='50%' cy='32%'><stop offset='0%' stop-color='"+c+"'/><stop offset='100%' stop-color='#13202e'/></radialGradient></defs><rect width='96' height='96' rx='48' fill='url(#g)'/><text x='48' y='52' font-size='34' font-family='sans-serif' font-weight='bold' fill='#0a141f' text-anchor='middle'>"+glyph+"</text><rect x='26' y='60' width='44' height='20' rx='10' fill='#0a141f' opacity='.75'/><text x='48' y='75' font-size='14' font-family='sans-serif' font-weight='bold' fill='"+c+"' text-anchor='middle'>"+g+"</text></svg>";
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
};

/* スキルラベルの言語対応: 日本語ラベルを種類ベースで英訳 */
window.WOS_skillLabel = function(label){
  if((window.WOS_LANG||'ja')!=='en' || !label) return label;
  var s=label;
  // 1) 末尾の装飾スキル名(日本語の固有名)を除去: 「(決起集会)」など、日本語を含む丸括弧
  s=s.replace(/[（(][^()（）]*[\u3041-\u3096\u30a1-\u30f6\u4e00-\u9faf][^()（）]*[）)]/g,'');
  // 2) 用語を順に英訳(長い語から先に)
  var map = [
    [/通常攻撃ダメ\s*\+?/g,'Normal-atk DMG +'],[/敵被ダメ\s*\+?/g,'Enemy DMG-taken +'],
    [/追加攻撃/g,'extra attack'],[/追加/g,'extra '],
    [/全軍ダメ\s*\+?/g,'All-army DMG +'],[/与ダメ(ージ)?\s*\+?/g,'DMG +'],
    [/攻撃\s*\+?/g,'ATK +'],[/殺傷\s*\+?/g,'Lethality +'],[/被ダメ\s*\+?/g,'DMG-taken +'],
    [/追加攻撃/g,'extra attack'],[/追撃/g,'follow-up'],[/炎上/g,'burn'],[/呪い/g,'curse'],
    [/減衰バフ/g,'decaying buff'],[/固定/g,'flat '],
    [/盾弓/g,'Inf/Mks'],[/槍/g,'Lancer '],[/弓/g,'Mks '],[/盾兵/g,'Inf '],[/盾/g,'Inf '],
    [/(\d+)回毎に?/g,'every $1x'],[/(\d+)回/g,'$1x'],[/期待\s*\+?/g,'avg +'],[/で/g,' chance '],[/毎に?/g,' every '],[/保守的/g,'conservative'],
    [/換算/g,'equiv.'],[/UP/g,''],[/T(?=[\s\)）/]|$)/g,'T'],
    [/ダメ\s*\+?/g,'DMG +']
  ];
  map.forEach(function(m){ s=s.replace(m[0],m[1]); });
  // 3) 余分な空白整理
  s=s.replace(/\s+/g,' ').replace(/\(\s*\)/g,'').trim();
  return s;
};

/* 言語対応ヘルパー(EN時は英語名・INF/LAN/MKS表記) */
window.WOS_heroName = function(hero){
  if((window.WOS_LANG||'ja')==='en') return (window.WOS_HERO_EN&&window.WOS_HERO_EN[hero.id])||hero.id;
  return hero.name;
};
window.WOS_clsName = function(cls){
  var en={inf:'INF',lan:'LAN',mks:'MKS'}, ja={inf:'盾',lan:'槍',mks:'弓'};
  return (window.WOS_LANG||'ja')==='en'?en[cls]:ja[cls];
};
window.WOS_clsFull = function(cls){
  var en={inf:'Infantry',lan:'Lancer',mks:'Marksman'}, ja={inf:'盾兵',lan:'槍兵',mks:'弓兵'};
  return (window.WOS_LANG||'ja')==='en'?en[cls]:ja[cls];
};
window.WOS_genName = function(gen){
  if((window.WOS_LANG||'ja')==='en') return gen===0?'Permanent':'Gen '+gen;
  return gen===0?'常設':'第'+gen+'世代';
};

/* 専用装備のステータス上昇(世代別・推定値) gearを持つ英雄に付与 */
(function(){
  if(!window.WOS_HEROES) return;
  window.WOS_HEROES.forEach(function(hh){
    if(!hh.gear) return;
    // Lv10到達時に与える兵科ステ%(推定)。世代が上がるほど強い専用装備。
    // 第1世代 ≈ 攻撃/致命+8%、以降 世代ごとに +0.8%ずつ逓増(上限20%程度)
    var g = hh.gen===0 ? 1 : hh.gen;
    var base = Math.min(0.20, 0.08 + (g-1)*0.008);  // 8%→約20%
    // gear.type(集結specialの種類)に合わせて、ステ上昇も攻撃寄り/致命寄りに配分
    if(hh.gear.type==='atk'){
      hh.gearStat = {a: base, l: base*0.4};       // 攻撃型: 攻撃主体
    }else if(hh.gear.type==='leth'){
      hh.gearStat = {a: base*0.4, l: base};       // 致命型: 致命主体
    }else{
      hh.gearStat = {a: base*0.7, l: base*0.7};
    }
  });
})();
