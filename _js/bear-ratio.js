/* ==== 熊狩シミュレーター STEP4: 兵士の比率の入力まわり ====
   - いまの比率を帯グラフと％で常に表示（人数から自動計算）
   - ％を1つ変えると、合計が100%になるよう残りを自動で調整（切り替え可）。各兵種に「残りを入れる」ボタン
   - プリセットは初期のものも含めて自由に削除でき、初期状態に戻せる
   本体の q()（プリセット描画）と K()（比率の適用）を差し替える。計算には触れない */
(function(){
  var W = window, D = document;
  var t = W.t || function(a){ return a; };
  function el(id){ return D.getElementById(id); }
  function num(id){ var v = parseFloat(el(id).value); return isFinite(v) ? v : 0; }
  function ls(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  if(!el('ratioBtns') || !el('rI') || typeof W.q !== 'function' || typeof W.K !== 'function') return;

  var CLS = [['inf', 'rI', 'nInf', t('盾兵', 'Infantry')], ['lan', 'rL', 'nLan', t('槍兵', 'Lancer')], ['mks', 'rM', 'nMks', t('弓兵', 'Marksman')]];
  var LS_LIST = 'bh_ratio_list', LS_AUTO = 'bh_ratio_auto', MAXP = 16;
  var DEFAULTS = [[10, 30, 60], [10, 10, 80], [5, 25, 70], [20, 40, 40], [1, 4, 95]];
  var editing = false;      /* プリセット整理モード */
  var origK = W.K;

  /* ---------- プリセットの保存 ---------- */
  function valid(a){ return Array.isArray(a) && a.length === 3 && a.every(function(v){ return typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100; }); }
  function list(){
    try{ var s = JSON.parse(ls(LS_LIST) || 'null'); if(Array.isArray(s)) return s.filter(valid).slice(0, MAXP); }catch(e){}
    /* 初回: これまでの初期プリセット＋利用者が登録していた分を引き継ぐ */
    var old = []; try{ old = (JSON.parse(ls('bh_ratios') || '[]') || []).filter(valid); }catch(e){}
    var seen = {}, out = [];
    DEFAULTS.concat(old).forEach(function(a){ var k = a.join(':'); if(!seen[k]){ seen[k] = 1; out.push(a); } });
    return out.slice(0, MAXP);
  }
  function save(a){ lsSet(LS_LIST, JSON.stringify(a.slice(0, MAXP))); }

  /* ---------- いまの比率 ---------- */
  function counts(){ return CLS.map(function(c){ return Math.max(0, num(c[2])); }); }
  function shares(){ var n = counts(), s = n[0] + n[1] + n[2]; return s > 0 ? n.map(function(v){ return v / s * 100; }) : [0, 0, 0]; }
  function pcts(){ return CLS.map(function(c){ return Math.max(0, num(c[1])); }); }
  function fmtP(v){ var r = Math.round(v * 10) / 10; return Math.abs(r - Math.round(r)) < 0.05 ? String(Math.round(r)) : r.toFixed(1); }
  function intRatio(){ var s = shares().map(function(v){ return Math.round(v); }); return s; }

  /* ---------- 画面の組み立て ---------- */
  var reg = D.querySelector('.ratio-reg'), grid = el('nInf').closest('.stat-grid'), btns = el('ratioBtns');
  var css = D.createElement('style');
  css.textContent = '.ratio-reg{display:none !important}'
    + '.rt-tools{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:2px 0 4px;font-size:12px}'
    + '.rt-link{color:var(--frost);font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap}'
    + '.rt-link.muted{color:var(--muted);font-weight:600}'
    + '.ratio-btns button .del{display:none}'
    + '.ratio-btns.editing button{padding-right:26px !important;animation:rtWiggle .5s ease-in-out}'
    + '.ratio-btns.editing button .del{display:grid !important;place-items:center;position:absolute;top:50%;right:5px;transform:translateY(-50%);width:17px;height:17px;border-radius:50%;background:#e5484d;color:#fff;font-size:10px;line-height:1}'
    + '@keyframes rtWiggle{0%,100%{transform:none}30%{transform:rotate(-1.5deg)}70%{transform:rotate(1.5deg)}}'
    + '.rt-now{margin:14px 0 10px;padding:14px 16px;border:1px solid #eef0f5;border-radius:13px;background:#fff}'
    + '.rt-now-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;margin-bottom:9px}'
    + '.rt-now-h b{font-size:13px;color:#23283a}'
    + '.rt-now-h .rt-big{font:800 22px "Outfit",sans-serif;color:#23283a;letter-spacing:.01em;font-variant-numeric:tabular-nums}'
    + '.rt-now-h .rt-sum{margin-left:auto;font-size:12px;font-weight:800;border-radius:999px;padding:3px 11px;background:#effaf3;color:#15a35b;white-space:nowrap}'
    + '.rt-now-h .rt-sum.bad{background:#fff1f0;color:#d93025}'
    + '.rt-bar{display:flex;height:18px;border-radius:9px;overflow:hidden;gap:2px;background:#fff}'
    + '.rt-bar i{display:block;min-width:4px;border-radius:3px;transition:flex-grow .25s}'
    + '.rt-bar .b-inf{background:var(--inf)}.rt-bar .b-lan{background:var(--lan)}.rt-bar .b-mks{background:var(--mks)}'
    + '.rt-auto{display:flex;align-items:center;gap:7px;margin-top:10px;font-size:12px;color:#5b6276;cursor:pointer;user-select:none}'
    + '.rt-auto input{width:16px;height:16px;accent-color:#ff7a2f;margin:0}'
    + '.troop-box .rt-f{display:grid;grid-template-columns:auto 1fr;gap:6px 8px;align-items:center}'
    + '.troop-box .rt-f label{font-size:11px;color:#6b7385;font-weight:700;margin:0;white-space:nowrap}'
    + '.troop-box .rt-p{display:flex;align-items:center;gap:6px;min-width:0}'
    + '.troop-box .rt-p input{width:74px !important;flex:none;font:800 15px "Outfit",sans-serif !important;text-align:right}'
    + '.troop-box .rt-p span{font-size:13px;font-weight:700;color:#6b7385}'
    + '.troop-box .rt-fill{margin-left:auto;font-size:11.5px;font-weight:800;color:var(--frost);background:#fff1e8;border-radius:8px;padding:6px 9px;text-decoration:none;white-space:nowrap;cursor:pointer;border:1px solid transparent}'
    + '.troop-box .rt-fill.need{border-color:#ff7a2f;box-shadow:0 0 0 3px rgba(255,122,47,.18)}'
    + '.troop-box .rt-fill.off{opacity:.35;pointer-events:none}'
    + '.troop-box h3{display:flex;align-items:baseline;gap:8px}'
    + '.troop-box h3 .rt-share{margin-left:auto;font:800 17px "Outfit",sans-serif;font-variant-numeric:tabular-nums}'
    + '@media(max-width:640px){'
    + '.rt-row{display:block !important}.rt-row>div{max-width:none !important;margin-bottom:10px}'
    + '.rt-grid{grid-template-columns:repeat(3,1fr) !important;gap:6px !important}'
    + '.rt-grid .troop-box{padding:9px 7px !important;min-width:0}'
    + '.rt-grid .troop-box h3{font-size:12px !important;gap:2px;flex-wrap:wrap}.rt-grid .troop-box h3 .rt-share{font-size:14px}'
    + '.rt-grid .rt-f{grid-template-columns:1fr !important;gap:3px !important}'
    + '.rt-grid .rt-p{flex-wrap:wrap;gap:4px}.rt-grid .rt-p input{width:calc(100% - 18px) !important;padding:8px 6px !important}'
    + '.rt-grid .rt-fill{margin:2px 0 4px;width:100%;text-align:center;padding:7px 2px;font-size:11px}'
    + '.rt-grid .rt-f>input{padding:8px 6px !important;font-size:12px !important;min-width:0;width:100%}'
    + '.rt-now{padding:12px}.rt-now-h .rt-sum{margin-left:0}}';
  D.head.appendChild(css);
  grid.classList.add('rt-grid'); var row = btns.closest('.row'); if(row) row.classList.add('rt-row');

  var tools = D.createElement('div'); tools.className = 'rt-tools';
  tools.innerHTML = '<a class="rt-link" href="#" data-rt="save">' + t('＋ いまの比率をプリセットに保存', '+ Save current ratio as preset') + '</a>'
    + '<a class="rt-link muted" href="#" data-rt="edit"></a><a class="rt-link muted" href="#" data-rt="reset" hidden>' + t('初期状態に戻す', 'Reset to defaults') + '</a>';
  btns.parentNode.insertBefore(tools, btns.nextSibling);

  var now = D.createElement('div'); now.className = 'rt-now';
  now.innerHTML = '<div class="rt-now-h"><b>' + t('いまの比率（盾：槍：弓）', 'Current ratio (Inf : Lan : Mks)') + '</b><span class="rt-big" id="rtBig">—</span><span class="rt-sum" id="rtSum"></span></div>'
    + '<div class="rt-bar" id="rtBar"></div>'
    + '<label class="rt-auto"><input type="checkbox" id="rtAuto"> ' + t('％を1つ変えたら、残りを自動で調整して合計100%にそろえる', 'When I change one %, adjust the rest automatically to total 100%') + '</label>';
  grid.parentNode.insertBefore(now, grid);
  el('rtAuto').checked = ls(LS_AUTO) !== '0';
  el('rtAuto').addEventListener('change', function(){ lsSet(LS_AUTO, this.checked ? '1' : '0'); paint(); });

  CLS.forEach(function(c, i){
    var box = el(c[2]).closest('.troop-box'), h3 = box.querySelector('h3');
    var sh = D.createElement('span'); sh.className = 'rt-share'; sh.id = 'rtS' + i; h3.appendChild(sh);
    var f = D.createElement('div'); f.className = 'rt-f';
    f.innerHTML = '<label for="' + c[1] + '">' + t('比率', 'Share') + '</label><div class="rt-p"></div><label for="' + c[2] + '">' + t('人数', 'Troops') + '</label>';
    var p = f.querySelector('.rt-p'), inp = el(c[1]); inp.step = '1'; p.appendChild(inp);
    var pc = D.createElement('span'); pc.textContent = '%'; p.appendChild(pc);
    var fill = D.createElement('a'); fill.href = '#'; fill.className = 'rt-fill'; fill.setAttribute('role', 'button'); fill.setAttribute('data-fill', i); fill.textContent = t('残りを入れる', 'Fill the rest'); p.appendChild(fill);
    var nIn = el(c[2]); box.appendChild(f); f.appendChild(nIn);
  });

  /* ---------- 動き ---------- */
  function applyPcts(p){
    /* ％ → 人数。合計が100%でなくても、入力どおりの人数にする（合計表示で気づけるようにする） */
    var total = Math.max(0, parseInt(el('totalTroops').value, 10) || 0);
    CLS.forEach(function(c, i){ el(c[2]).value = Math.round(total * p[i] / 100); });
    if(typeof W.z === 'function') W.z();
    paint();
  }
  function setPcts(p){ CLS.forEach(function(c, i){ el(c[1]).value = fmtP(p[i]); }); }
  function onPct(i){
    var p = pcts(); p[i] = Math.min(100, p[i]);
    if(el('rtAuto').checked){
      /* 変えた兵種以外で、いちばん割合の大きい兵種に残りを寄せる。足りなければもう一方も減らす */
      var o = [0, 1, 2].filter(function(k){ return k !== i; }).sort(function(a, b){ return p[b] - p[a]; });
      var rest = 100 - p[i], keep = Math.min(p[o[1]], rest);
      p[o[1]] = keep; p[o[0]] = Math.max(0, rest - keep);
      CLS.forEach(function(c, k){ if(k !== i) el(c[1]).value = fmtP(p[k]); });
    }
    applyPcts(p);
  }
  function fillRest(i){
    var p = pcts(), others = p.reduce(function(a, v, k){ return k === i ? a : a + v; }, 0);
    if(others > 100) return;
    p[i] = 100 - others; el(CLS[i][1]).value = fmtP(p[i]); applyPcts(p);
    var b = el(CLS[i][1]); b.classList.remove('rt-pop'); void b.offsetWidth;
  }
  function paint(){
    var sh = shares(), p = pcts(), sum = p[0] + p[1] + p[2], n = counts(), tot = n[0] + n[1] + n[2];
    el('rtBig').textContent = tot > 0 ? sh.map(fmtP).join(' : ') : '—';
    el('rtBar').innerHTML = tot > 0 ? CLS.map(function(c, i){ return sh[i] > 0 ? '<i class="b-' + c[0] + '" style="flex:' + Math.max(sh[i], 0.6) + '" title="' + c[3] + ' ' + fmtP(sh[i]) + '%"></i>' : ''; }).join('') : '';
    CLS.forEach(function(c, i){ el('rtS' + i).textContent = tot > 0 ? fmtP(sh[i]) + '%' : ''; el('rtS' + i).style.color = 'var(--' + c[0] + ')'; });
    var ok = Math.abs(sum - 100) < 0.05, s = el('rtSum');
    s.classList.toggle('bad', !ok);
    s.textContent = ok ? t('合計 100%', 'Total 100%') : (sum > 100 ? t('合計 ' + fmtP(sum) + '%（' + fmtP(sum - 100) + '% 多い）', 'Total ' + fmtP(sum) + '% (' + fmtP(sum - 100) + '% over)') : t('合計 ' + fmtP(sum) + '%（あと ' + fmtP(100 - sum) + '%）', 'Total ' + fmtP(sum) + '% (' + fmtP(100 - sum) + '% left)'));
    D.querySelectorAll('.rt-fill').forEach(function(b){
      var i = +b.getAttribute('data-fill'), others = sum - p[i];
      b.classList.toggle('need', !ok && others <= 100); b.classList.toggle('off', ok || others > 100);
      b.textContent = (!ok && others <= 100) ? t('残り ' + fmtP(100 - others) + '% にする', 'Set to ' + fmtP(100 - others) + '%') : t('残りを入れる', 'Fill the rest');
    });
    /* いまの比率と一致するプリセットを強調 */
    var cur = intRatio().join(':');
    btns.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', tot > 0 && b.getAttribute('data-r') === cur); });
  }
  /* 人数を直接変えた／別の処理で人数が変わったとき、％欄を人数に合わせる */
  function syncFromCounts(){
    var n = counts(), tot = n[0] + n[1] + n[2]; if(!(tot > 0)) { paint(); return; }
    var act = D.activeElement && D.activeElement.id;
    if(act !== 'rI' && act !== 'rL' && act !== 'rM') setPcts(shares());
    paint();
  }

  /* 本体の関数を差し替え */
  W.V = function(){ return list(); };
  W.q = function(){
    var a = list(); btns.innerHTML = ''; btns.classList.toggle('editing', editing);
    a.forEach(function(r, i){
      var b = D.createElement('button'); b.type = 'button'; b.setAttribute('data-r', r.join(':')); b.textContent = r.join(':');
      var d = D.createElement('span'); d.className = 'del'; d.title = t('削除', 'Delete'); d.textContent = '✕'; b.appendChild(d);
      b.onclick = function(){
        if(editing){ var cur = list(); cur.splice(i, 1); save(cur); W.q(); return; }
        W.K(r);
      };
      btns.appendChild(b);
    });
    var e = tools.querySelector('[data-rt="edit"]'); e.textContent = editing ? t('✓ 整理を終わる', '✓ Done') : t('プリセットを整理（削除）', 'Manage presets (delete)');
    tools.querySelector('[data-rt="reset"]').hidden = !editing;
    paint();
  };
  W.K = function(r){ origK(r); setPcts(r); paint(); };

  tools.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('[data-rt]'); if(!a) return; e.preventDefault();
    var k = a.getAttribute('data-rt');
    if(k === 'edit'){ editing = !editing; W.q(); }
    else if(k === 'reset'){ lsSet(LS_LIST, JSON.stringify(DEFAULTS)); lsSet('bh_ratios', null); W.q(); }
    else if(k === 'save'){
      var r = intRatio(); if(r[0] + r[1] + r[2] !== 100) r[2] = Math.max(0, 100 - r[0] - r[1]);
      var cur = list(); if(!cur.some(function(x){ return x.join() === r.join(); })){ cur.push(r); save(cur); }
      editing = false; W.q();
    }
  });
  D.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.rt-fill'); if(!b) return; e.preventDefault(); fillRest(+b.getAttribute('data-fill')); });
  CLS.forEach(function(c, i){
    el(c[1]).addEventListener('input', function(){ onPct(i); });
    el(c[2]).addEventListener('input', function(){ var n = counts(); el('totalTroops').value = n[0] + n[1] + n[2]; syncFromCounts(); });
  });
  /* 合計人数を変えたら、いまの比率のまま人数を計算し直す */
  el('totalTroops').addEventListener('input', function(){ var p = pcts(), s = p[0] + p[1] + p[2]; if(s > 0) applyPcts(p); });
  /* 最適比率の「この比率を登録」は、いまの仕組みで保存する */
  var ab = el('addRatio'); if(ab) ab.onclick = function(){ var cur = list(), r = pcts().map(function(v){ return Math.round(v); }); if(r[0] + r[1] + r[2] === 100 && !cur.some(function(x){ return x.join() === r.join(); })){ cur.push(r); save(cur); } W.K(r); W.q(); };
  /* 保存した編成の呼び出しなど、外から人数が変わった場合に追従 */
  var src = el('totalDmg'); if(src) new MutationObserver(function(){ setTimeout(syncFromCounts, 0); }).observe(src, { childList: true, characterData: true, subtree: true });

  W.q(); syncFromCounts();
})();
