/* ==== 英雄アイコン画像 ====
   画像は assets/heroes/<英雄ID>.webp。下の一覧（WOS_HERO_IMGS）は _build_hero_images.py が自動で書き換える。
   一覧に無い英雄は、これまで通りの兵種アイコン（自作SVG）で表示される。
   ゲーム内画像の権利は Century Games に帰属。非公式・非営利のファンサイトでの利用として運営の案内に従って掲載（広告・収益化は行わない） */
window.WOS_HERO_IMGS = /*HERO_IMGS*/{"smith":"1cc61f","eugene":"17f4f0","charlie":"04524b","cloris":"fbc111","sergey":"9fef73","patrick":"c4708d","jessie":"7be5cd","lingxue":"500357","lumak":"42960b","gina":"6b7c4d","jasser":"6b262e","seoyoon":"d79a96","bahiti":"ba6fac","natalia":"94f27f","jeronimo":"0b673a","molly":"9892a8","zinman":"d35a92","flint":"56a6f2","philly":"6ccbaf","alonso":"f93b70","logan":"becf77","mia":"795655","greg":"02a3e9","ahmose":"5068e3","reina":"9ca242","lynn":"e843c3","hector":"6d140a","nora":"28690b","gwen":"1a834d","wuming":"a4d5b2","renee":"19bf6b","wayne":"da75a0","edith":"e9f29d","gordon":"8a207c","bradley":"4fd600","gatot":"0cf0ef","sonya":"708c3a","hendrik":"581d5f","magnus":"1461a4","fred":"282431","xura":"b8813e","gregory":"d2d5ed","freya":"4e87b0","blanchette":"e688a7","eleonora":"500402","lloyd":"274de2","rufus":"1a7c22","hervor":"870486","karol":"519060","ligeia":"ba073a","gisela":"5f56f6","flora":"84bfb3","vulcanus":"94a474","elif":"221d3e","dominic":"2d3412","cara":"6473e1","hank":"b84d15","estrella":"bef38d","viveca":"a8f9da","seigel":"10345b","ursar":"6f376f","aisling":"792b70","aiden":"6c5b79","bertha":"f79f12","eleanor":"6c76b4"}/*END*/;
/* 英雄名（[日本語, 英語]）。記事中の名前にアイコンを付けるために使う。これも _build_hero_images.py が書き換える */
window.WOS_HERO_NAMES = /*HERO_NAMES*/{"smith":["スミス","Smith"],"eugene":["ユージーン","Eugene"],"charlie":["チャーリー","Charlie"],"cloris":["クラリス","Cloris"],"sergey":["セルゲイ","Sergey"],"patrick":["パトリック","Patrick"],"jessie":["ジェシー","Jessie"],"lingxue":["リンセツ","Ling Xue"],"lumak":["ルム・ボーガン","Lumak Bokan"],"gina":["ジーナ","Gina"],"jasser":["ジャセル","Jasser"],"seoyoon":["ソユン","Seo-yoon"],"bahiti":["バシティ","Bahiti"],"natalia":["ナタリア","Natalia"],"jeronimo":["ジェロニモ","Jeronimo"],"molly":["ジャスミン","Molly"],"zinman":["ジンマン","Zinman"],"flint":["フリント","Flint"],"philly":["フレンダー","Philly"],"alonso":["アロンゾ","Alonso"],"logan":["ローガン","Logan"],"mia":["ミア","Mia"],"greg":["グレッグ","Greg"],"ahmose":["アクモス","Ahmose"],"reina":["レイナ","Reina"],"lynn":["リオン","Lynn"],"hector":["ヘクトー","Hector"],"nora":["ノラ","Nora"],"gwen":["グエン","Gwen"],"wuming":["無名","Wu Ming"],"renee":["レネ","Renee"],"wayne":["ウェイン","Wayne"],"edith":["エディス","Edith"],"gordon":["ゴードン","Gordon"],"bradley":["ブラッドリー","Bradley"],"gatot":["ガト","Gatot"],"sonya":["ソニヤ","Sonya"],"hendrik":["ヘンドリック","Hendrik"],"magnus":["マグヌス","Magnus"],"fred":["フレッド","Fred"],"xura":["シュラ","Xura"],"gregory":["グレゴリー","Gregory"],"freya":["フレイヤ","Freya"],"blanchette":["ブランシュ","Blanchette"],"eleonora":["エリオノーラ","Eleonora"],"lloyd":["ロイド","Lloyd"],"rufus":["ルーファス","Rufus"],"hervor":["ヘルヴィル","Hervor"],"karol":["カロール","Karol"],"ligeia":["ライジーア","Ligeia"],"gisela":["ギーゼラ","Gisela"],"flora":["フローラ","Flora"],"vulcanus":["ウルカヌス","Vulcanus"],"elif":["エリーフ","Elif"],"dominic":["ドミニク","Dominic"],"cara":["カーラ","Cara"],"hank":["ハンク","Hank"],"estrella":["エステラ","Estrella"],"viveca":["ヴィヴィカ","Viveca"],"seigel":["シガー","Seigel"],"ursar":["ウルタール","Ursar"],"aisling":["アシュリン","Aisling"],"aiden":["エイダン","Aiden"],"bertha":["ベルサ","Bertha"],"eleanor":["エリノ","Eleanor"]}/*END*/;
window.WOS_heroImg = function(h){
  var id = h && (h.id || h), v = id && window.WOS_HERO_IMGS[id];
  return v ? '/assets/heroes/' + id + '.webp?v=' + v : null;
};
/* ==== 英雄アイコンをページに反映する ====
   1) 英雄一覧のカードに画像を差し込む（#hero-<ID> で開くとそのカードへ移動）
   2) 記事・解説文の中の英雄名の前に小さなアイコンを付ける（1つの段落・箇条書きにつき英雄ごとに1回）
   3) 攻略記事の冒頭に「この記事に登場する英雄」の帯を出す
   4) トップページに英雄アイコンの帯を出す
   アイコンを付けたくない場所には class="no-hero-ico" を付ける */
(function(){
  var W = window, D = document;
  if(W.__WOS_HERO_DECO) return; W.__WOS_HERO_DECO = 1;
  var EN = (W.WOS_LANG || (/^\/en(\/|$)/.test(location.pathname) ? 'en' : 'ja')) === 'en';
  var BASE = EN ? '/en' : '';
  var NAMES = W.WOS_HERO_NAMES || {}, IMG = W.WOS_heroImg;
  var LIST = BASE + '/tools/hero-list/';
  var XV = '130', CYRIL_PAGE = /\/guides\/cyril-/.test(location.pathname);
  var EXTRA = [['シリル', 'Cyrille', 'cyril-face'], ['狩人の心得', "Hunter's Heart", 'cyril-talent'],
    ['巨熊キラー', "Ursa's Bane", 'cyril-s4', 1], ['リサイクル', 'Scavenging', 'cyril-s2', 1], ['武装特化', 'Weapon Master', 'cyril-s3', 1], ['包囲狩猟', 'Entrapment', 'cyril-s1', 1]];
  function srcOf(id){ return id.charAt(0) === '~' ? '/assets/img/' + id.slice(1) + '.webp?v=' + XV : IMG(id); }
  function nameOf(id){ var n = NAMES[id]; return n ? (EN ? n[1] : n[0]) : id; }

  function css(){
    if(D.getElementById('hero-deco-css')) return;
    var st = D.createElement('style'); st.id = 'hero-deco-css';
    st.textContent = '.hx{display:inline-block;width:1.45em;height:1.45em;border-radius:50%;object-fit:cover;vertical-align:-.38em;margin:0 .22em 0 .05em;background:#f1f2f7;box-shadow:0 0 0 1.5px #fff,0 0 0 2.5px rgba(232,93,18,.35)}'
      + 'h2 .hx,h3 .hx{width:1.3em;height:1.3em;vertical-align:-.3em}'
      + '.hero-strip{margin:16px 0 20px;padding:12px 14px;border:1px solid #ecedf3;border-radius:14px;background:linear-gradient(180deg,#fff8f1,#fff)}'
      + '.hero-strip .hs-t{font-size:12px;font-weight:800;color:#6b7385;margin-bottom:8px;letter-spacing:.04em}'
      + '.hero-strip .hs-l{display:flex;flex-wrap:wrap;gap:10px 8px}'
      + '.hero-strip a{display:flex;flex-direction:column;align-items:center;width:62px;text-decoration:none;color:#23283a;font-size:10.5px;font-weight:700;line-height:1.25;text-align:center}'
      + '.hero-strip img{width:52px;height:52px;border-radius:14px;object-fit:cover;margin-bottom:4px;background:#f1f2f7;box-shadow:0 2px 6px rgba(28,34,80,.14);transition:transform .15s}'
      + '.hero-strip a:hover img{transform:translateY(-2px)}'
      + '.hero-band{display:flex;align-items:center;flex-wrap:wrap;gap:10px 14px;margin-top:18px}'
      + '.hero-band .hb-f{display:flex;padding-left:10px}'
      + '.hero-band .hb-f img{width:44px;height:44px;border-radius:50%;object-fit:cover;margin-left:-10px;border:2.5px solid #fff;background:#f1f2f7;box-shadow:0 2px 6px rgba(28,34,80,.16)}'
      + '.hero-band a{font-size:13px;font-weight:800;color:inherit;text-decoration:none;border-bottom:1.5px solid currentColor;padding-bottom:1px}'
      + '.hero-card.hero-hit{outline:3px solid #ff7a2f;outline-offset:2px}.hero-card{scroll-margin-top:300px}'
      + '@media(max-width:560px){.hero-strip a{width:54px}.hero-strip img{width:46px;height:46px}.hero-band .hb-f img{width:38px;height:38px}}'
      + '.hx.sq{border-radius:24%;box-shadow:0 1px 3px rgba(28,34,80,.25)}'
      + 'table .hx.sq{width:2.3em;height:2.3em;vertical-align:-.75em;margin-right:.45em}'
      + '@media print{.hx,.hero-strip,.hero-band,.gs-pic{display:none}}';
    D.head.appendChild(st);
  }

  /* 1) 英雄一覧のカード */
  function cards(){
    D.querySelectorAll('article.hero-card[data-id]').forEach(function(card){
      var id = card.getAttribute('data-id');
      if(!card.id) card.id = 'hero-' + id;
      if(card.querySelector('.hero-pic')) return;
      var src = IMG(id); if(!src) return;
      var head = card.querySelector('.hc-head'); if(!head) return;
      var img = D.createElement('img');
      img.className = 'hero-pic'; img.src = src; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.width = 56; img.height = 56;
      head.insertBefore(img, head.firstChild); card.classList.add('has-pic');
    });
    var m = /^#hero-([a-z0-9_]+)$/.exec(location.hash || '');
    if(m){ var c = D.getElementById('hero-' + m[1]); if(c){ c.classList.add('hero-hit'); setTimeout(function(){ c.scrollIntoView({ block: 'start' }); }, 60); } }
  }

  /* 2) 文中の英雄名 */
  var KATA = /[ァ-ヺー-ヿㇰ-ㇿｦ-ﾟ]/, KANJI = /[一-鿿]/, ALNUM = /[A-Za-z0-9]/;
  function buildMatcher(){
    var byName = {}, list = [];
    Object.keys(NAMES).forEach(function(id){ if(!IMG(id)) return; var n = nameOf(id); if(n && n.length >= 2 && !byName[n]){ byName[n] = id; list.push(n); } });
    /* 専門家シリルと、そのスキル・天賦のアイコン（スキル名はシリルの解説ページでだけ付ける） */
    EXTRA.forEach(function(x){ if(x[3] && !CYRIL_PAGE) return; var n = EN ? x[1] : x[0]; if(!byName[n]){ byName[n] = '~' + x[2]; list.push(n); } });
    if(!list.length) return null;
    list.sort(function(a, b){ return b.length - a.length; });
    var re = new RegExp(list.map(function(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
    return { re: re, byName: byName };
  }
  /* 別の単語の一部（プレミアム の ミア など）には付けない */
  function standalone(text, i, name){
    var a = text.charAt(i - 1), b = text.charAt(i + name.length), f = name.charAt(0), l = name.charAt(name.length - 1);
    function same(edge, nb){ if(!nb) return false; return (KATA.test(edge) && KATA.test(nb)) || (KANJI.test(edge) && KANJI.test(nb)) || (ALNUM.test(edge) && ALNUM.test(nb)); }
    return !same(f, a) && !same(l, b);
  }
  var SKIP = 'script,style,select,option,textarea,input,button,nav,footer,svg,h1,code,pre,[data-hero],.no-hero-ico,.hero-strip,.hero-band,.hero-card,.crumb,.btn,.slot,.pitem,.picker,.sitefoot,.relbar,.toc,.chips,.st-byline,[contenteditable]';
  var BLOCK = 'p,li,td,th,dd,dt,h2,h3,h4,summary,figcaption,blockquote,div';
  function decorate(roots){
    var M = buildMatcher(); if(!M) return [];
    var found = [], seen = {}, perBlock = (typeof WeakMap === 'function') ? new WeakMap() : null;
    roots.forEach(function(root){
      var tw = D.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while((n = tw.nextNode())){ if(n.nodeValue && n.nodeValue.length >= 2 && n.parentElement && !n.parentElement.closest(SKIP)) nodes.push(n); }
      nodes.forEach(function(node){
        var text = node.nodeValue, m, cuts = [];
        var blk = node.parentElement.closest(BLOCK) || node.parentElement;
        var used = perBlock ? (perBlock.get(blk) || {}) : {};
        M.re.lastIndex = 0;
        while((m = M.re.exec(text))){
          var id = M.byName[m[0]];
          if(!standalone(text, m.index, m[0])) continue;
          if(!seen[id] && id.charAt(0) !== '~'){ seen[id] = 1; found.push(id); }
          if(used[id]) continue; used[id] = 1;
          if(m.index === 0 && node.previousSibling && node.previousSibling.nodeType === 1 && node.previousSibling.classList.contains('hx')) continue;   /* すでに付いている */
          cuts.push({ i: m.index, id: id });
        }
        if(perBlock) perBlock.set(blk, used);
        for(var k = cuts.length - 1; k >= 0; k--){
          var tail = node.splitText(cuts[k].i), img = D.createElement('img');
          img.className = 'hx' + (/^~cyril-(s|t)/.test(cuts[k].id) ? ' sq' : ''); img.src = srcOf(cuts[k].id); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.width = 20; img.height = 20;
          tail.parentNode.insertBefore(img, tail);
        }
      });
    });
    return found;
  }

  /* 3) 攻略記事の冒頭の帯 */
  function strip(ids){
    if(ids.length < 3 || D.querySelector('.hero-strip')) return;
    var wrap = D.querySelector('.wrap'); if(!wrap) return;
    var anchor = wrap.querySelector('.lead') || wrap.querySelector('h1'); if(!anchor) return;
    var box = D.createElement('div'); box.className = 'hero-strip';
    box.innerHTML = '<div class="hs-t">' + (EN ? 'Heroes in this article' : 'この記事に登場する英雄') + '</div><div class="hs-l">'
      + ids.slice(0, 12).map(function(id){ return '<a href="' + LIST + '#hero-' + id + '"><img src="' + IMG(id) + '" alt="" loading="lazy" width="52" height="52">' + nameOf(id) + '</a>'; }).join('') + '</div>';
    anchor.parentNode.insertBefore(box, anchor.nextSibling);
  }

  /* 4) トップページの帯 */
  var FACES = ['jeronimo', 'mia', 'gwen', 'natalia', 'hector', 'blanchette', 'reina', 'vulcanus', 'estrella', 'aisling', 'aiden', 'eleanor'];
  function band(){
    var cta = D.querySelector('.hm-hero .hm-cta'); if(!cta || D.querySelector('.hero-band')) return;
    var ids = FACES.filter(function(id){ return IMG(id); }); if(ids.length < 4) return;
    var n = Object.keys(W.WOS_HERO_IMGS || {}).length;
    var box = D.createElement('div'); box.className = 'hero-band';
    box.innerHTML = '<span class="hb-f">' + ids.map(function(id){ return '<img src="' + IMG(id) + '" alt="" width="44" height="44" title="' + nameOf(id) + '">'; }).join('') + '</span>'
      + '<a href="' + LIST + '">' + (EN ? 'Browse all ' + n + ' heroes' : '全' + n + '英雄のデータを見る') + ' →</a>';
    cta.parentNode.insertBefore(box, cta.nextSibling);
  }

  /* 5) 記事の「解説」枠（.callout。注意書きの .warn は除く）を、グレッグが解説している体裁にする */
  function greg(){
    D.querySelectorAll('.wrap .callout:not(.warn):not(.greg-says)').forEach(function(c){
      if(c.closest('.no-hero-ico') || (c.textContent || '').length < 30) return;
      var txt = D.createElement('div'); txt.className = 'gs-txt';
      while(c.firstChild) txt.appendChild(c.firstChild);
      var ico = txt.querySelector('.ico'); if(ico && !ico.querySelector('svg,img')) ico.parentNode.removeChild(ico);
      /* 見出しの頭の絵文字は外す */
      var tw = D.createTreeWalker(txt, NodeFilter.SHOW_TEXT, null), first;
      while((first = tw.nextNode())){ if(first.nodeValue.trim()){ first.nodeValue = first.nodeValue.replace(/^\s*(?:[\u2190-\u2BFF\u3030\u303D\u3297\u3299]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])[\uFE0F\u200D]*\s*/, ''); break; } }
      var body = D.createElement('div'); body.className = 'gs-body';
      body.innerHTML = '<span class="gs-tag no-hero-ico">' + (c.classList.contains('tip') ? (EN ? "MOLLY'S TIP" : 'ジャスミンのヒント') : (EN ? "GREG'S NOTE" : 'グレッグの解説')) + '</span>';
      body.appendChild(txt);
      var img = D.createElement('img'); img.className = 'gs-pic'; var mo = c.classList.contains('tip'); img.src = '/assets/img/' + (mo ? 'sp-molly' : 'sp-greg') + '.webp?v=1'; if(mo) c.classList.add('sp-molly'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.width = 176; img.height = 176;
      c.appendChild(img); c.appendChild(body); c.classList.add('greg-says');
    });
  }

  /* 6) 記事の見出し画像（ゲームのイラストを横長に切り出したもの）。ページ→画像の対応表 */
  var KV = { '/guides/bear-hunt-guide.html': 'bear', '/guides/beginner-faq.html': 'welcome', '/guides/common-myths.html': 'training', '/guides/damage-not-growing.html': 'doctor',
    '/guides/f2p-damage.html': 'supplies', '/guides/how-to-use.html': 'ship', '/guides/leader-formation.html': 'charge', '/guides/left-hero.html': 'shield',
    '/guides/light-spender.html': 'treasure', '/guides/troop-ratio.html': 'mixing',
    '/tools/hero-list/': 'heroes', '/tools/left-hero/': 'shield', '/tools/troop-ratio/': 'mixing', '/tools/damage-doctor/': 'doctor', '/tools/king-castle/': 'castle',
    '/tools/foundry-battle/': 'foundry', '/tools/commander-type/': 'raiders', '/stats/': 'bear', '/stats/methodology.html': 'builder', '/recruit.html': 'board', '/about.html': 'welcome' };
  function keyVisual(path){
    var name = KV[path] || KV[path.replace(/index\.html$/, '')]; if(!name || D.querySelector('.kv')) return;
    var wrap = D.querySelector('.wrap') || D.querySelector('main'); if(!wrap) return;
    var anchor = wrap.querySelector('.lead') || wrap.querySelector('h1'); if(!anchor) return;
    if(EN){ var be = D.getElementById('bodyen'); if(be && be.querySelector('.lead,h1')) anchor = be.querySelector('.lead') || be.querySelector('h1'); }
    var f = D.createElement('figure'); f.className = 'kv';
    f.innerHTML = '<img src="/assets/kv/' + name + '.webp?v=1" alt="" width="1000" height="500" decoding="async">';
    anchor.parentNode.insertBefore(f, anchor.nextSibling);
  }

  W.WOS_heroDecorate = function(roots){ if(!IMG) return; css(); decorate(roots); };
  function run(){
    if(!IMG) return;
    css(); cards(); band();
    var path = location.pathname.replace(/^\/en(?=\/)/, '');
    var isTool = /^\/tools\//.test(path), isGuide = /^\/guides\//.test(path);
    var roots = [].slice.call(D.querySelectorAll(isTool ? '.tool-article,.tool-about,.hl-intro' : '.wrap,.hm-in'));
    roots = roots.filter(function(r){ return !roots.some(function(o){ return o !== r && o.contains(r); }); });
    if(/^\/(changelog|privacy|terms|contact)\.html$/.test(path)) return;   /* 記録・規約のページには付けない */
    keyVisual(path);
    if(isGuide) greg();
    var ids = decorate(roots);
    if(isGuide) strip(ids);
  }
  if(D.readyState !== 'loading') run(); else D.addEventListener('DOMContentLoaded', run);
})();
