/* 公式wiki（whiteoutsurvival.wiki／Century Games）の遠征スキル原文から、熊狩シミュレーター用にモデル化したもの。
   対象: 2026-09-02 時点で assets/heroes.js に集結主スキルが未登録だった25体。
   `node _apply_wiki_skills.js` で assets/heroes.js に反映する。

   モデル化の規則（既存23体の書き方に合わせた）:
   - 与ダメ/攻撃/殺傷の全部隊バフ → dmg / atk / leth
   - 兵種限定の与ダメ → tDmg(cls)   ※ 'im' = 盾兵＋弓兵
   - 「N回攻撃する毎に追加ダメージ」 → tPeriodic(cls, per, v)
   - 「Nターン毎に…1ターン持続」 → tUptime / uptime(per, dur, v)
   - 「X%の確率で…」 → chance / chanceLeth / tChance
   - 「被ダメージ+X%」（熊側の被ダメ増）→ dmg + tag:'dtaken'（被ダメ枠・加算合成）。1ターン持続のものは発動率で按分
   - 「敵全体の防御力-X%」→ defdown。周期発動は按分
   - 通常攻撃ダメ → ndmg
   - 敵の攻撃/殺傷/与ダメ低下、味方の被ダメ低下・防御・HP・シールド・回避 → 熊狩では効果なし（省略）
   - 「敵盾兵/槍兵/弓兵に対する」効果 → 熊は兵種を持たないため効果なし（省略）
   - 3つの遠征スキルがすべて効果なし → bearNoEffect:true
   - joiner = 遠征スキル1つ目（効果が無ければ null）
   - 8つ目のスキルが「集結部隊の攻撃/殺傷+15%」→ gear（専用装備）
   ※ 「クリティカル」「スキルダメージ」は推定値（下記コメント参照）

   コミュニティ校正（2026-09-02）:
   - 文字通りにモデル化すると、フレイヤが槍でミアを上回る／シュラ・ライジーアが弓で最新世代を上回る結果になったが、
     攻略サイト（アルテマ・wosguru・h5joy）の熊狩り推奨は「槍＝ミア・ドミニク」「弓＝最新世代優先」で一致し、
     フレイヤ・シュラ・ライジーアは推奨に挙がらない。
   - 既存で検証済みの追撃系（ウェイン4T毎100%、ブランシュ3T毎75%）は平均+20〜25%相当なので、
     新規の「N回毎に追撃」「X%で追撃」も同じ帯に収まるよう倍率を半分にした（(校正) と明記）。
     同種の追撃を2つ持つライジーアは1つ分のみ算入。 */
module.exports = {
  zinman: { /* 堅固(防御/HP) ・ 建築の芸術 ・ 陣地戦の強者(殺傷+25%) */
    leader: { label: '殺傷25(陣地戦の強者)', parts: [{ k: 'leth', v: .25 }] },
    joiner: null,
    gearNote: '防衛部隊攻撃+15%(熊補正なし)' },
  logan: { /* 敵攻撃-20% ・ 味方被ダメ-20% ・ HP+25% → 熊では効果なし */
    bearNoEffect: true, gearNote: '防衛部隊防御+15%(熊補正なし)' },
  ahmose: { /* マムシ方陣(防御) ・ 火の祈願(盾兵与ダメ+100%) ・ 光鍛の刃(盾兵攻撃毎60%追加/被ダメ+25%) */
    leader: { label: '盾与ダメ100/盾攻撃毎60%追撃/被ダメ+25', parts: [
      { k: 'tDmg', cls: 'inf', v: 1.0 }, { k: 'tPeriodic', cls: 'inf', per: 1, v: .6 }, { k: 'dmg', v: .25, tag: 'dtaken' }] },
    joiner: null,
    gearNote: '防衛部隊HP+15%(熊補正なし)' },
  nora: { /* 多兵種戦術(盾弓与ダメ+15%) ・ 急所突き(槍攻撃時20%で全体100%追加) ・ 追撃攻勢(5回毎に全体与ダメ+25%/2T) */
    leader: { label: '盾弓与ダメ15/槍20%で100%追撃/5回毎与ダメ25', parts: [
      { k: 'tDmg', cls: 'im', v: .15 }, { k: 'tChance', cls: 'lan', p: .2, v: 1 }, { k: 'uptime', per: 5, dur: 2, v: .25 }] },
    joiner: { label: '盾弓:与ダメ+15%(多兵種戦術)', parts: [{ k: 'tDmg', cls: 'im', v: .15 }] },
    gearNote: '防衛部隊防御+15%(熊補正なし)' },
  wuming: { /* 避風補雨(防御) ・ 半月飛翔(与ダメ+20%) ・ 四象明晰(スキルダメ+25% ≈ 与ダメ+5%と推定) */
    leader: { label: '与ダメ20/スキルダメ25(≈+5)', parts: [{ k: 'dmg', v: .2 }, { k: 'dmg', v: .05 }] },
    joiner: null,
    gearNote: '防衛部隊防御+15%(熊補正なし)' },
  edith: { /* 攻守両立(槍与ダメ+20%) ・ 銅頭鉄腕(防御) ・ 鋼甲護体(HP) */
    leader: { label: '槍与ダメ20(攻守両立)', parts: [{ k: 'tDmg', cls: 'lan', v: .2 }] },
    joiner: { label: '槍:与ダメ+20%(攻守両立)', parts: [{ k: 'tDmg', cls: 'lan', v: .2 }] },
    gearNote: '防衛部隊HP+15%(熊補正なし)' },
  gatot: { /* 黄金の近衛(盾防御) ・ 列王の恩恵(シールド) ・ 王者の師(敵攻撃-25%) → 熊では効果なし */
    bearNoEffect: true, gearNote: '防衛部隊防御+15%(熊補正なし)' },
  fred: { /* 放水砲制圧(敵殺傷低下) ・ 酸性溶液(敵盾兵被ダメ→熊補正なし) ・ 猛烈な攻勢(槍4回毎に200%追加) */
    leader: { label: '槍:4回毎に100%追撃(校正)', parts: [{ k: 'tPeriodic', cls: 'lan', per: 4, v: 1 }] },
    joiner: null,
    gear: { type: 'atk', min: .05, max: .15, label: '集結攻撃+5→15%(英傑の鼓舞)' } },
  xura: { /* 霧の胞子(被ダメ低下) ・ 貫通の矢(弓2回毎100%追加/被ダメ+25%) ・ 変幻自在(弓与ダメ+10%) */
    leader: { label: '弓:2回毎50%追撃(校正)/被ダメ+12/弓与ダメ10', parts: [
      { k: 'tPeriodic', cls: 'mks', per: 2, v: .5 }, { k: 'dmg', v: .125, tag: 'dtaken' }, { k: 'tDmg', cls: 'mks', v: .1 }] },
    joiner: null,
    gearNote: '防衛部隊攻撃+15%(熊補正なし)' },
  gregory: { /* 灼熱の軍団(攻撃+15%) ・ 制圧突撃(25%でクリティカル≈+50%と推定) ・ 鋼鉄の防壁(盾防御) */
    leader: { label: '攻撃15/25%で会心(推定+50)', parts: [{ k: 'atk', v: .15 }, { k: 'chance', p: .25, v: .5 }] },
    joiner: { label: '攻撃+3→15%(灼熱の軍団)', parts: [{ k: 'atk', v: .15 }] },
    gearNote: '防衛部隊殺傷+15%(熊補正なし)' },
  freya: { /* 夕暮れの霧(敵攻撃低下) ・ 新月の鎌(通常攻撃後50%で100%追撃) ・ 疾風の一撃(盾弓与ダメ+15%) */
    leader: { label: '50%で50%追撃(校正)/盾弓与ダメ15', parts: [{ k: 'chance', p: .5, v: .5 }, { k: 'tDmg', cls: 'im', v: .15 }] },
    joiner: null,
    gearNote: '防衛部隊防御+15%(熊補正なし)' },
  eleonora: { /* 烈日の威光(HP) ・ ソラリス方陣(弓与ダメ+10%) ・ 烈火の飛光(盾5回毎に全体与ダメ+25%/2T) */
    leader: { label: '弓与ダメ10/5回毎与ダメ25', parts: [{ k: 'tDmg', cls: 'mks', v: .1 }, { k: 'uptime', per: 5, dur: 2, v: .25 }] },
    joiner: null,
    gearNote: '防衛部隊HP+15%(熊補正なし)' },
  lloyd: { /* 群鳥の侵襲(敵殺傷低下) ・ 氷霧爆弾(3T毎に槍ダメ+150%/1T) ・ 千変万化(40%で殺傷+50%) */
    leader: { label: '3T毎槍与ダメ150/40%で殺傷50', parts: [{ k: 'tUptime', cls: 'lan', per: 3, dur: 1, v: 1.5 }, { k: 'chanceLeth', p: .4, v: .5 }] },
    joiner: null,
    gearNote: '防衛部隊攻撃+15%(熊補正なし)' },
  karol: { /* 守護の翼(被ダメ低下) ・ ブレイクスピア(対槍兵/盾兵→熊補正なし) ・ 栄光の戦旗(攻撃+15%) */
    leader: { label: '攻撃15(栄光の戦旗)', parts: [{ k: 'atk', v: .15 }] },
    joiner: null,
    gear: { type: 'atk', min: .05, max: .15, label: '集結攻撃+15%(フロックアサルト)' } },
  ligeia: { /* スチールファング(敵防御-25%) ・ 崩壊の毒(弓2回毎100%追加/被ダメ+25%) ・ ポイズンファング(弓2回毎100%追加) */
    leader: { label: '敵防御-25/弓:2回毎50%追撃(校正・重複分は不算入)/被ダメ+12', parts: [
      { k: 'defdown', v: .25 }, { k: 'tPeriodic', cls: 'mks', per: 2, v: .5 }, { k: 'dmg', v: .125, tag: 'dtaken' }] },
    joiner: { label: '敵防御-25%(スチールファング/防御down枠)', parts: [{ k: 'defdown', v: .25 }] },
    gearNote: '防衛部隊攻撃+15%(熊補正なし)' },
  gisela: { /* 合金シールド(盾防御) ・ 臨時防衛工事(防御) ・ 試作型シールド(被ダメ軽減) → 熊では効果なし */
    bearNoEffect: true, gearNote: '防衛部隊攻撃+15%(熊補正なし)' },
  flora: { /* 刺蔓の舞(50%で敵被ダメ+50%) ・ 茨の花園(槍与ダメ+25%) ・ 芳香の霧(敵盾兵被ダメ→熊補正なし) */
    leader: { label: '50%で被ダメ+50/槍与ダメ25', parts: [{ k: 'chance', p: .5, v: .5, tag: 'dtaken' }, { k: 'tDmg', cls: 'lan', v: .25 }] },
    joiner: { label: '50%で被ダメ+10→50%(刺蔓の舞/被ダメ枠)', parts: [{ k: 'chance', p: .5, v: .5, tag: 'dtaken' }] },
    gearNote: '防衛部隊HP+15%(熊補正なし)' },
  vulcanus: { /* 覇者の怒り(敵攻撃低下) ・ 貫通裂刃(全体5回毎100%追加/被ダメ+15%) ・ 破砕の矢(3T毎 敵盾槍防御↓→熊補正なし・弓攻撃+60%/1T) */
    leader: { label: '5回毎100%追撃/被ダメ+15/3T毎弓攻撃60', parts: [
      { k: 'periodic', per: 5, v: 1 }, { k: 'uptime', per: 5, dur: 1, v: .15, tag: 'dtaken' }, { k: 'tUptime', cls: 'mks', per: 3, dur: 1, v: .55 }] },
    joiner: null,
    gear: { type: 'atk', min: .05, max: .15, label: '集結攻撃+5→15%(王者の威厳)' } },
  elif: { /* 軽紗の鎖(敵攻撃低下) ・ 千刃の陣(攻撃+15%) ・ 絢爛の幕(シールド) */
    leader: { label: '攻撃15(千刃の陣)', parts: [{ k: 'atk', v: .15 }] },
    joiner: null,
    gearNote: '防衛部隊防御+15%(熊補正なし)' },
  dominic: { /* イリュージョン(与ダメ+20%) ・ シリーローゼス(槍攻撃毎60%追加/被ダメ+5%) ・ ミラーメイズ(盾弓与ダメ+15%) */
    leader: { label: '与ダメ20/槍攻撃毎60%追撃/被ダメ+5/盾弓与ダメ15', parts: [
      { k: 'dmg', v: .2 }, { k: 'tPeriodic', cls: 'lan', per: 1, v: .6 }, { k: 'dmg', v: .05, tag: 'dtaken' }, { k: 'tDmg', cls: 'im', v: .15 }] },
    joiner: { label: '与ダメ+4→20%(イリュージョン)', parts: [{ k: 'dmg', v: .2 }] },
    gear: { type: 'leth', min: .05, max: .15, label: '集結殺傷+5→15%(イマジンステージ)' } },
  cara: { /* Smoky Encounter(敵殺傷低下) ・ Mech Pet(通常攻撃ダメ+30%) ・ Witch's Wrath(対槍兵/弓兵→熊補正なし) */
    leader: { label: '通常攻撃30(Mech Pet)', parts: [{ k: 'ndmg', v: .3 }] },
    joiner: null,
    gearNote: '防衛部隊殺傷+15%(熊補正なし)' },
  hank: { /* レイジングロアー(殺傷+25%) ・ スパークバースト(盾5回毎に全体与ダメ+25%) ・ バーサクパワー(敵盾兵被ダメ→熊補正なし) */
    leader: { label: '殺傷25/5回毎与ダメ25', parts: [{ k: 'leth', v: .25 }, { k: 'uptime', per: 5, dur: 2, v: .25 }] },
    joiner: { label: '殺傷+5→25%(レイジングロアー)', parts: [{ k: 'leth', v: .25 }] },
    gearNote: '防衛部隊HP+15%(熊補正なし)' },
  estrella: { /* Corrosive Color(敵防御-25%) ・ Dawn Canvas(攻撃+15%) ・ Splendid Scene(槍与ダメ+25%) */
    leader: { label: '敵防御-25/攻撃15/槍与ダメ25', parts: [{ k: 'defdown', v: .25 }, { k: 'atk', v: .15 }, { k: 'tDmg', cls: 'lan', v: .25 }] },
    joiner: { label: '敵防御-25%(Corrosive Color/防御down枠)', parts: [{ k: 'defdown', v: .25 }] },
    gearNote: '防衛部隊攻撃+15%(熊補正なし)' },
  viveca: { /* ナイトレギオン(攻撃+25%) ・ シャドウビジョン(弓攻撃時20%で全体100%追加) ・ ミストチャイルド(弓与ダメ+10%) */
    leader: { label: '攻撃25/弓20%で100%追撃/弓与ダメ10', parts: [{ k: 'atk', v: .25 }, { k: 'tChance', cls: 'mks', p: .2, v: 1 }, { k: 'tDmg', cls: 'mks', v: .1 }] },
    joiner: { label: '攻撃+5→25%(ナイトレギオン)', parts: [{ k: 'atk', v: .25 }] },
    gear: { type: 'leth', min: .05, max: .15, label: '集結殺傷+5→15%(夜明けの歌)' } },
  ursar: { /* 茸林の迷宮(敵攻撃低下) ・ 祖霊の角笛(2T毎 槍弓殺傷+30%・敵防御-30%/1T→按分) ・ 毒茸の鋭刃(槍2回毎100%追加/被ダメ+25%) */
    leader: { label: '殺傷15(按分)/敵防御-15(按分)/槍:2回毎50%追撃(校正)/被ダメ+12', parts: [
      { k: 'leth', v: .15 }, { k: 'defdown', v: .15 }, { k: 'tPeriodic', cls: 'lan', per: 2, v: .5 }, { k: 'dmg', v: .125, tag: 'dtaken' }] },
    joiner: null,
    gear: { type: 'atk', min: .05, max: .15, label: '集結攻撃+15%(暴風の戦鼓)' } }
};
