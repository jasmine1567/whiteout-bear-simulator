/* ===== 英雄スキル詳細データ（探検1-3 / 遠征1-3） =====
   各英雄の探検スキル・遠征スキルを、攻略wiki（whiteoutsurvival.wiki ほか）を参照し
   当サイトが独自に要約したものです（原文の転載ではありません）。
   レアリティ別の数: 神話級SSR=探検3/遠征3, エピックSR=探検3/遠征2, レアR=探検2/遠征2
   バッチ1: 第1世代（ナタリア/ジェロニモ/ジャスミン/ジンマン）
   フィールド: n_ja/n_en=スキル名, d_ja/d_en=効果の要約
*/
window.WOS_HERO_SKILLS = {
  jeronimo: {
    explore: [
      {n_ja:'コンボスラッシュ', n_en:'Combo Slash', d_ja:'対象範囲の敵を打ち上げて3連斬。各段が攻撃160〜224%の範囲ダメージ。', d_en:'Knocks up enemies and slashes 3×, each Atk 160–224% AoE.'},
      {n_ja:'ソードアート', n_en:'Sword Art', d_ja:'通常攻撃ごとに前方直線へ剣気。攻撃15〜23%の追加範囲ダメージ。', d_en:'Each attack sends sword energy forward for Atk 15–23% damage.'},
      {n_ja:'一匹狼', n_en:'Lone Wolf', d_ja:'HP50%超のとき自身の攻撃+16〜48%（攻め継続で強化）。', d_en:'+16–48% Attack while above 50% HP.'}
    ],
    exped: [
      {n_ja:'戦いの宣言', n_en:'Battle Manifesto', d_ja:'全部隊の与ダメージ+5〜25%。集結主としての核となる火力バフ。', d_en:'+5–25% damage dealt to all troops. Core rally-leader buff.'},
      {n_ja:'剣の師', n_en:'Swordmentor', d_ja:'全部隊の攻撃+5〜25%。', d_en:'+5–25% Attack for all troops.'},
      {n_ja:'熟練剣術', n_en:'Expert Swordsmanship', d_ja:'全部隊の攻撃に4〜20%でスタン付与（1ターン）。対人で有効。', d_en:'4–20% chance for troop attacks to stun 1 turn. Strong in PvP.'}
    ]
  },
  natalia: {
    explore: [
      {n_ja:'ビーストチャージ', n_en:'Beast Charge', d_ja:'熊が地面を叩き範囲ノックバック＋1秒スタン。攻撃160〜224%の範囲ダメージ。', d_en:'Bear smash: AoE knockback + 1s stun, Atk 160–224% damage.'},
      {n_ja:'ウィップ', n_en:'Whip', d_ja:'鞭で単体に攻撃150〜210%のダメージ。', d_en:'Whips one target for Atk 150–210%.'},
      {n_ja:'報復本能', n_en:'Rage Response', d_ja:'被弾時10%で攻撃+4〜12%（3秒・最大5重）。', d_en:'On hit, 10% chance: +4–12% Attack for 3s (max 5 stacks).'}
    ],
    exped: [
      {n_ja:'野獣の守り', n_en:'Feral Protection', d_ja:'40%で全部隊の被ダメージ-10〜50%（高頻度の軽減）。※旧スキルはスタン。', d_en:'40% chance to cut all troops’ damage taken by 10–50%. (Old: stun.)'},
      {n_ja:'野生の女王', n_en:'Queen of the Wild', d_ja:'全部隊の攻撃+5〜25%（常時）。集結主としての主力。', d_en:'+5–25% Attack for all troops (always on). Main rally buff.'},
      {n_ja:'野生の呼び声', n_en:'Call of the Wild', d_ja:'全部隊の与ダメージ+5〜25%（特に対ビースト＝熊狩りで有効）。', d_en:'+5–25% damage dealt, esp. vs beasts (great for Bear Hunt).'}
    ]
  },
  molly: {
    explore: [
      {n_ja:'スーパースノーボール', n_en:'Super Snowball', d_ja:'範囲に攻撃180〜252%のダメージ＋1.5秒凍結。', d_en:'AoE Atk 180–252% damage + 1.5s freeze.'},
      {n_ja:'フロストアンブッシュ', n_en:'Frost Ambush', d_ja:'単体に攻撃150〜210%の強襲ダメージ。', d_en:'Single-target ambush for Atk 150–210%.'},
      {n_ja:'若さの粘り', n_en:'Youthful Persistence', d_ja:'HP50%以下で攻撃速度+20〜60%。', d_en:'+20–60% Attack Speed while below 50% HP.'}
    ],
    exped: [
      {n_ja:'雪の呼び声', n_en:'Calling of the Snow', d_ja:'全部隊の攻撃に4〜20%でスタン付与（1ターン）。', d_en:'4–20% chance for troop attacks to stun 1 turn.'},
      {n_ja:'氷の支配', n_en:'Ice Dominion', d_ja:'攻撃時50%で与ダメージ+10〜50%。', d_en:'50% chance on attack: +10–50% damage dealt.'},
      {n_ja:'若き怒り', n_en:'Youthful Rage', d_ja:'全部隊の与ダメージ+5〜25%（常時）。最優先で強化推奨。', d_en:'+5–25% damage dealt for all troops (always on). Top priority.'}
    ]
  },
  zinman: {
    explore: [
      {n_ja:'ネイルスキャター', n_en:'Nail Scatter', d_ja:'釘を連射し攻撃55〜75%のダメージ＋2秒スタン。', d_en:'Sprays nails for Atk 55–75% + 2s stun.'},
      {n_ja:'緊急防御', n_en:'Quick Defense', d_ja:'HP50%以下で自身の防御+50〜150%。', d_en:'+50–150% Defense while below 50% HP.'},
      {n_ja:'頑健', n_en:'Robust', d_ja:'攻撃速度+10〜30%。', d_en:'+10–30% Attack Speed.'}
    ],
    exped: [
      {n_ja:'鉄壁', n_en:'Implacable', d_ja:'全部隊の防御+2〜10%・HP+2〜10%（守り向け）。', d_en:'+2–10% Defense and +2–10% Health for all troops (defensive).'},
      {n_ja:'建築の達人', n_en:'Bastionist', d_ja:'基本資源の消費-3〜15%・建築速度+3〜15%（都市発展）。最優先。', d_en:'-3–15% basic resource cost, +3–15% build speed (city growth). Top priority.'},
      {n_ja:'布陣強打', n_en:'Positional Batter', d_ja:'全部隊の与ダメージ+5〜25%。', d_en:'+5–25% damage dealt for all troops.'}
    ]
  },
  flint: {
    explore: [
      {n_ja:'復讐の業火', n_en:'Fires of Vengeance', d_ja:'火炎放射で攻撃60〜84%（0.5秒毎）＋対象の被ダメージ+10〜30%（2秒）。', d_en:'Flame stream for Atk 60–84% /0.5s; target takes +10–30% damage for 2s.'},
      {n_ja:'焼却炉', n_en:'Incinerator', d_ja:'HP50%以下で最大HPの20〜40%を即時回復（1戦闘1回）。', d_en:'Below 50% HP, instantly heal 20–40% max HP (once per battle).'},
      {n_ja:'熱の拡散', n_en:'Heat Diffusion', d_ja:'味方英雄全体の攻撃速度+3〜7%。', d_en:'+3–7% Attack Speed for all allied heroes.'}
    ],
    exped: [
      {n_ja:'放火魔', n_en:'Pyromaniac', d_ja:'全部隊の攻撃20%で炎上、3ターン継続ダメージ（+8〜40%/ターン）。', d_en:'20% chance to ignite: +8–40% damage/turn for 3 turns.'},
      {n_ja:'燃える闘志', n_en:'Burning Resolve', d_ja:'全部隊の攻撃+5〜25%。集結主向けの主力バフ。', d_en:'+5–25% Attack for all troops. Core rally-leader buff.'},
      {n_ja:'焼身', n_en:'Immolation', d_ja:'全部隊の攻撃50%で敵の被ダメージ+10〜50%。', d_en:'50% chance to raise enemy damage taken by +10–50%.'}
    ]
  },
  philly: {
    explore: [
      {n_ja:'応急手当', n_en:'First Aid', d_ja:'全味方英雄を即時回復（攻撃200〜280%分）。最大級のAoE回復。', d_en:'Instantly heal all allied heroes (Atk 200–280%). Huge AoE heal.'},
      {n_ja:'癒しの手', n_en:'Restorative Hands', d_ja:'最も弱った味方英雄を回復（攻撃100〜140%分）。', d_en:'Heal the weakest ally hero (Atk 100–140%).'},
      {n_ja:'活性ショット', n_en:'Energizing Shot', d_ja:'味方を強化／妨害する補助スキル（2026年初頭に再調整）。', d_en:'A support/CC skill (reworked in early 2026).'}
    ],
    exped: [
      {n_ja:'奇跡の薬草', n_en:'Miracle Herb', d_ja:'全味方部隊を定期的に回復（長期戦で有効）。', d_en:'Periodically heals all friendly troops (great in long fights).'},
      {n_ja:'増量投与', n_en:'Dosage Boost', d_ja:'全部隊に確率で追加ダメージを付与。', d_en:'Chance for all troops to deal bonus damage.'}
    ]
  },
  alonso: {
    explore: [
      {n_ja:'トラップネット', n_en:'Trapnet', d_ja:'範囲に攻撃200〜280%＋1.5秒拘束。アリーナの主力。', d_en:'AoE Atk 200–280% + 1.5s immobilize. Arena staple.'},
      {n_ja:'タイダルフォース', n_en:'Tidal Force', d_ja:'範囲ダメージ（攻撃50〜70%）。', d_en:'AoE damage (Atk 50–70%).'},
      {n_ja:'ハープーンブラスト', n_en:'Harpoon Blast', d_ja:'通常攻撃5〜8回ごとにスタン0.2〜0.5秒。', d_en:'Stuns 0.2–0.5s after every 5–8 basic attacks.'}
    ],
    exped: [
      {n_ja:'猛攻', n_en:'Onslaught', d_ja:'全部隊の攻撃20%でスタン（1ターン）。', d_en:'20% chance for troop attacks to stun 1 turn.'},
      {n_ja:'鉄の意志', n_en:'Iron Strength', d_ja:'全部隊の攻撃20%で敵の与ダメージ-10〜50%（2ターン）。', d_en:'20% chance to cut enemy damage by 10–50% for 2 turns.'},
      {n_ja:'毒の銛', n_en:'Poison Harpoon', d_ja:'全部隊の攻撃50%で与ダメージ+10〜50%。', d_en:'50% chance for troops to deal +10–50% damage.'}
    ]
  },
  logan: {
    explore: [
      {n_ja:'破壊の鉄拳', n_en:'Fists of Destruction', d_ja:'攻撃120〜168%＋対象の攻撃速度-50%（4秒）。', d_en:'Atk 120–168% + target Attack Speed −50% for 4s.'},
      {n_ja:'パワースーツ', n_en:'Power Suit', d_ja:'被弾時8〜16%で防御+8〜20%（2秒・最大5重）。', d_en:'When hit, 8–16% chance: +8–20% Defense for 2s (max 5 stacks).'},
      {n_ja:'烈風撃', n_en:'Blustery Strike', d_ja:'扇状範囲に攻撃80〜112%＋30%でスタン1秒。', d_en:'Cone AoE Atk 80–112% + 30% chance to stun 1s.'}
    ],
    exped: [
      {n_ja:'獅子の一撃', n_en:'Lion Strike', d_ja:'全部隊の攻撃20%で追加ダメージ（3ターン・+8〜40%/ターン）。', d_en:'20% chance: +8–40% extra damage/turn for 3 turns.'},
      {n_ja:'獅子の威圧', n_en:'Lion Intimidation', d_ja:'全部隊の被ダメージ-4〜20%（常時）。守り・駐屯の要。', d_en:'−4–20% damage taken for all troops (always on). Key garrison buff.'},
      {n_ja:'指揮官の鼓舞', n_en:'Leader Inspiration', d_ja:'全部隊のHP+5〜25%。', d_en:'+5–25% Health for all troops.'}
    ]
  },
  mia: {
    explore: [
      {n_ja:'運命の終幕', n_en:"Fate's Finale", d_ja:'カードで攻撃270〜378%＋対象の攻撃-20%（2秒）かスタン1.5秒。', d_en:'Card hit Atk 270–378%; either −20% target Attack (2s) or 1.5s stun.'},
      {n_ja:'凶兆', n_en:'Bad Omen', d_ja:'敵に変動ダメージ（基準は攻撃50〜70%、実値は5〜600%に変動）。', d_en:'Fluctuating curse damage (base Atk 50–70%, rolls 5–600%).'},
      {n_ja:'運命の守護', n_en:'Guardian of Destiny', d_ja:'最弱の味方を回復（基準は攻撃100〜140%、実値5〜400%変動）。', d_en:'Heals weakest ally (base Atk 100–140%, rolls 5–400%).'}
    ],
    exped: [
      {n_ja:'不運の連鎖', n_en:'Bad Luck Streak', d_ja:'全部隊の攻撃50%で敵に呪い、被ダメージ+10〜50%。', d_en:'50% chance to curse enemy: +10–50% damage taken.'},
      {n_ja:'幸運のお守り', n_en:'Lucky Charm', d_ja:'全部隊の攻撃50%で与ダメージ+10〜50%。', d_en:'50% chance for troops to deal +10–50% damage.'},
      {n_ja:'儀式の解読', n_en:'Ritual Deciphering', d_ja:'全部隊40%で被ダメージ-10〜50%。', d_en:'40% chance to cut troops’ damage taken by 10–50%.'}
    ]
  },
  greg: {
    explore: [
      {n_ja:'正義の風', n_en:'Righteous Wind', d_ja:'空から檻を落とし範囲ダメージ（攻撃160〜224%）＋2秒スタン。', d_en:'Drops a cage: AoE Atk 160–224% + 2s stun.'},
      {n_ja:'詩的正義', n_en:'Poetic Justice', d_ja:'敵を裁き、懲罰（攻撃300%ダメージ）か恩赦（敵HP回復）のいずれか。', d_en:'Judges a target: punish (Atk 300%) or pardon (heals the enemy).'},
      {n_ja:'公正な裁き', n_en:'Fair Judgment', d_ja:'敵の被ダメージ+30%（3秒）。', d_en:'+30% damage taken on the enemy for 3s.'}
    ],
    exped: [
      {n_ja:'正義の剣', n_en:'Sword of Justice', d_ja:'全部隊20%で与ダメージ+40%（3ターン）。', d_en:'20% chance: +40% damage dealt for 3 turns.'},
      {n_ja:'法の抑止', n_en:'Deterrence of Law', d_ja:'敵の与ダメージ-50%（2ターン・被害軽減）。', d_en:'Cuts enemy damage by 50% for 2 turns.'},
      {n_ja:'法と秩序', n_en:'Law and Order', d_ja:'全部隊のHPを増加。長期戦での耐久を底上げ。', d_en:'Raises all troops’ Health for better sustain.'}
    ]
  },
  sergey: {
    explore: [
      {n_ja:'シールドストライク', n_en:'Shield Strike', d_ja:'盾で殴りノックバック＋範囲ダメージ（攻撃200〜280%）。', d_en:'Shield bash: knockback + AoE damage (Atk 200–280%).'},
      {n_ja:'組織防御', n_en:'Group Defense', d_ja:'味方英雄全体の防御+5〜15%。', d_en:'+5–15% Defense for all allied heroes.'},
      {n_ja:'シールドブロック', n_en:'Shield Block', d_ja:'自身の被ダメージ-10〜30%。', d_en:'Reduces his own damage taken by 10–30%.'}
    ],
    exped: [
      {n_ja:'守りの要', n_en:"Defender's Edge", d_ja:'全部隊の被ダメージ-4〜20%。防衛・駐屯の主力バフ。', d_en:'−4–20% damage taken for all troops. Core defensive buff.'},
      {n_ja:'弱体化', n_en:'Weaken', d_ja:'敵の攻撃-4〜20%。', d_en:'Reduces enemy Attack by 4–20%.'}
    ]
  },
  bahiti: {
    explore: [
      {n_ja:'精密射撃', n_en:'Precise Shot', d_ja:'単体に攻撃400〜560%の高ダメージ。', d_en:'Single-target hit for Atk 400–560%.'},
      {n_ja:'クイックショット', n_en:'Quick Shot', d_ja:'攻撃速度+10〜30%。', d_en:'+10–30% Attack Speed.'},
      {n_ja:'先見', n_en:'Pathfinder Vision', d_ja:'与ダメージ+10〜30%。', d_en:'+10–30% extra damage.'}
    ],
    exped: [
      {n_ja:'第六感', n_en:'Sixth Sense', d_ja:'全部隊の被ダメージ-4〜20%。', d_en:'−4–20% damage taken for all troops.'},
      {n_ja:'蛍光', n_en:'Fluorescence', d_ja:'全部隊の攻撃50%で与ダメージ+10〜50%（RNG依存）。', d_en:'50% chance for troops to deal +10–50% damage (RNG).'}
    ]
  },
  jessie: {
    explore: [
      {n_ja:'バーストファイア', n_en:'Burst Fire', d_ja:'前方扇状に機関銃掃射（攻撃55〜75%×0.5秒毎・計2秒）。', d_en:'Machine-gun arc: Atk 55–75% every 0.5s for 2s.'},
      {n_ja:'装甲強化', n_en:'Defense Upgrade', d_ja:'自身の防御+25〜70%。前衛も務まる耐久。', d_en:'+25–70% own Defense — tanky enough to frontline.'},
      {n_ja:'武器強化', n_en:'Weapon Upgrade', d_ja:'自身の攻撃+8〜24%。', d_en:'+8–24% own Attack.'}
    ],
    exped: [
      {n_ja:'武装連携', n_en:'Stand of Arms', d_ja:'全部隊の与ダメージ+5〜25%。集結参加（乗り手）で有効。', d_en:'+5–25% damage dealt for all troops. Great rally joiner buff.'},
      {n_ja:'防壁', n_en:'Bulwarks', d_ja:'全部隊の被ダメージ-4〜20%。', d_en:'−4–20% damage taken for all troops.'}
    ]
  },
  gina: {
    explore: [
      {n_ja:'焼夷の矢', n_en:'Incendiary Arrow', d_ja:'単体に攻撃210〜290%＋周囲に攻撃70〜98%。', d_en:'Atk 210–290% to target + 70–98% to nearby foes.'},
      {n_ja:'ウィンドトーカー', n_en:'Windtalker', d_ja:'攻撃速度+10〜30%。', d_en:'+10–30% Attack Speed.'},
      {n_ja:'鷹の目', n_en:'Eagle Eyes', d_ja:'クリティカル率+7〜20%。', d_en:'+7–20% Crit Rate.'}
    ],
    exped: [
      {n_ja:'持久訓練', n_en:'Endurance Training', d_ja:'出撃スタミナ消費-10〜20%。熊・極寒狩りで有効。', d_en:'−10–20% stamina cost. Great for Beast/Polar hunts.'},
      {n_ja:'俊足', n_en:'Quick Paced', d_ja:'進軍速度+20〜100%（戦闘バフは無し）。', d_en:'+20–100% march speed (no troop combat buff).'}
    ]
  },
  patrick: {
    explore: [
      {n_ja:'BBQフィースト', n_en:'BBQ Feast', d_ja:'周囲の味方を回復（攻撃200〜280%）＋攻撃+5〜7%（4秒）。', d_en:'Heals nearby allies (Atk 200–280%) + Attack +5–7% for 4s.'},
      {n_ja:'分厚い腹', n_en:'Thick Belly', d_ja:'自身の被ダメージ-10〜30%。', d_en:'Reduces his own damage taken by 10–30%.'},
      {n_ja:'緊急補給', n_en:'Emergency Snack', d_ja:'5秒毎に自己回復（攻撃50〜70%）。', d_en:'Self-heal Atk 50–70% every 5s.'}
    ],
    exped: [
      {n_ja:'高栄養食', n_en:'Super Nutrients', d_ja:'全部隊（集結・駐屯）のHP+5〜25%。守りで有効。', d_en:'+5–25% Health for all rally/garrison troops. Defensive.'},
      {n_ja:'カロリーブースト', n_en:'Caloric Booster', d_ja:'12ターン毎に集結部隊のHPを最大15%回復。', d_en:'Restores up to 15% rally troop HP every 12 turns.'}
    ]
  },
  jasser: {
    explore: [
      {n_ja:'三連射', n_en:'Triple Volley', d_ja:'3連射（攻撃100%／125〜175%／150〜210%、3発目は範囲）。', d_en:'3 shots (Atk 100% / 125–175% / 150–210%; 3rd is AoE).'},
      {n_ja:'制圧射撃', n_en:'Suppressive Fire', d_ja:'攻撃100〜140%＋対象の攻撃速度-30〜50%（2秒）。', d_en:'Atk 100–140% + target Attack Speed −30–50% for 2s.'},
      {n_ja:'天性の精度', n_en:'Natural Precision', d_ja:'自身の攻撃+8〜24%。', d_en:'+8–24% own Attack.'}
    ],
    exped: [
      {n_ja:'戦術の天才', n_en:'Tactical Genius', d_ja:'全部隊の与ダメージ+5〜25%。集結参加（乗り手）で有効。', d_en:'+5–25% damage dealt for all troops. Strong rally joiner buff.'},
      {n_ja:'知略の戦い', n_en:'Enlightened Warfare', d_ja:'都市の研究速度+3〜15%（常時・都市発展）。', d_en:'+3–15% city Research Speed (always on; city growth).'}
    ]
  },
  seoyoon: {
    explore: [
      {n_ja:'勇気の鼓動', n_en:'Heartbeat of Valor', d_ja:'太鼓で味方全体の攻撃+1.5〜3.5%・攻撃速度+2.5〜4.5%（4秒）。', d_en:'Drum buff: all allies +1.5–3.5% Attack, +2.5–4.5% Attack Speed (4s).'},
      {n_ja:'一撃必中', n_en:'Bullseye Bash', d_ja:'ドラムスティックで単体に攻撃150〜210%。', d_en:'Drumstick throw for Atk 150–210%.'},
      {n_ja:'疾風の鼓動', n_en:"Gale's Pulse", d_ja:'通常攻撃3回毎に攻撃速度+1〜5%（戦闘終了まで蓄積）。', d_en:'+1–5% Attack Speed per 3 basic attacks (stacks until battle end).'}
    ],
    exped: [
      {n_ja:'進軍の太鼓', n_en:'Rallying Beat', d_ja:'全部隊の攻撃+5〜25%。集結参加で有効。', d_en:'+5–25% Attack for all troops. Good rally joiner buff.'},
      {n_ja:'癒しの舞', n_en:'Soothing Dance', d_ja:'医療施設の治療速度+10〜50%（都市発展）。', d_en:'+10–50% Infirmary Healing Speed (city growth).'}
    ]
  },
  lingxue: {
    explore: [
      {n_ja:'ハリケーンワール', n_en:'Hurricane Whirl', d_ja:'前方範囲に攻撃300〜420%。', d_en:'Slashes the area ahead for Atk 300–420%.'},
      {n_ja:'疾風', n_en:'Galeforce', d_ja:'HP50%超で自身の攻撃+16〜48%。', d_en:'+16–48% own Attack while above 50% HP.'},
      {n_ja:'背水の陣', n_en:'Desperate Measures', d_ja:'HP50%以下で自身の防御+50〜150%。', d_en:'+50–150% own Defense while below 50% HP.'}
    ],
    exped: [
      {n_ja:'威圧の覇気', n_en:'Fearsome Aura', d_ja:'敵部隊の攻撃-4〜20%（防衛で有効）。', d_en:'−4–20% enemy troop Attack (good for defense).'},
      {n_ja:'統制', n_en:'Total Control', d_ja:'兵士の訓練速度+4〜20%（都市発展）。', d_en:'+4–20% troop Training Speed (city growth).'}
    ]
  },
  lumak: {
    explore: [
      {n_ja:'アースシェイク', n_en:'Earthshake', d_ja:'雄叫びで敵全体の攻撃-1〜5%（2秒）。', d_en:'War cry: −1–5% enemy Attack for 2s.'},
      {n_ja:'反響の鼓舞', n_en:'Echoing Boost', d_ja:'アースシェイク発動時、自分と周囲の味方の攻撃+15〜35%（2秒）。', d_en:'On Earthshake, +15–35% Attack to self and nearby allies (2s).'},
      {n_ja:'密林の俊敏', n_en:'Jungle-Born Agility', d_ja:'自分と周囲の攻撃速度+10〜30%。', d_en:'+10–30% Attack Speed for self and nearby allies.'}
    ],
    exped: [
      {n_ja:'戦術的欺瞞', n_en:'Tactical Deception', d_ja:'敵部隊の与ダメージ-4〜20%。', d_en:'−4–20% damage dealt by all enemy troops.'},
      {n_ja:'狩人の贈り物', n_en:"Huntsman's Gift", d_ja:'狩猟の進軍速度+20〜100%（熊・極寒狩りで有効）。', d_en:'+20–100% Hunting March Speed (great for Beast/Polar hunts).'}
    ]
  },
  smith: {
    explore: [
      {n_ja:'ハンマーバーン', n_en:'Hammer Burn', d_ja:'ハンマーで前方範囲に攻撃200〜280%。', d_en:'Hammer arc for Atk 200–280%.'},
      {n_ja:'装甲強化', n_en:'Armor Enhancement', d_ja:'自身の被ダメージ-10〜30%。前衛向け。', d_en:'−10–30% own damage taken. Tanky frontliner.'}
    ],
    exped: [
      {n_ja:'磨かれた鉄', n_en:'Burnished Iron', d_ja:'製鉄所の鉄生産+5〜25%（都市発展）。', d_en:'+5–25% city Iron Mine output (city growth).'},
      {n_ja:'匠の技', n_en:'Craftsmanship', d_ja:'マップ上の鉄の採集速度+5〜25%。', d_en:'+5–25% Iron gathering speed on the map.'}
    ]
  },
  eugene: {
    explore: [
      {n_ja:'アックスワール', n_en:'Axe Whirl', d_ja:'斧を回転させ周囲に攻撃80〜110%（0.5秒毎・3秒／計6回）。', d_en:'Axe spin: Atk 80–110% every 0.5s for 3s (6 hits).'},
      {n_ja:'鋭利な刃', n_en:'Razor Sharp', d_ja:'与ダメージ+10〜30%。', d_en:'+10–30% damage dealt.'}
    ],
    exped: [
      {n_ja:'森の継承者', n_en:'Woodland Inheritor', d_ja:'製材所の木材生産+5〜25%（都市発展）。', d_en:'+5–25% city Sawmill output (city growth).'},
      {n_ja:'木こりの達人', n_en:'Master Woodcutter', d_ja:'マップ上の木材の採集速度+5〜25%。', d_en:'+5–25% Wood gathering speed on the map.'}
    ]
  },
  charlie: {
    explore: [
      {n_ja:'榴散弾', n_en:'Shrapnel Load', d_ja:'自作爆弾で範囲に攻撃140〜196%。', d_en:'Homemade bomb: AoE Atk 140–196%.'},
      {n_ja:'手榴弾(スタン)', n_en:'Grenade Stun', d_ja:'グレネードに10〜20%でスタン付与（0.5〜1.5秒）。', d_en:'Grenades have 10–20% chance to stun 0.5–1.5s.'}
    ],
    exped: [
      {n_ja:'爆破の達人', n_en:'Demolitions Expert', d_ja:'炭鉱の石炭生産+5〜25%（都市発展）。', d_en:'+5–25% city Coal Mine output (city growth).'},
      {n_ja:'石炭採掘', n_en:'Coal Extraction', d_ja:'マップ上の石炭の採集速度+5〜25%。', d_en:'+5–25% Coal gathering speed on the map.'}
    ]
  },
  cloris: {
    explore: [
      {n_ja:'矢の雨', n_en:'Rain of Arrows', d_ja:'矢の雨で対象と周囲に攻撃180〜252%。', d_en:'Arrow hail: AoE Atk 180–252% around the target.'},
      {n_ja:'狙い撃ち', n_en:'Bullseye', d_ja:'対象への与ダメージ+10〜30%（その一撃）。', d_en:'+10–30% damage to the target for that hit.'}
    ],
    exped: [
      {n_ja:'一流の狩人', n_en:'Top Hunter', d_ja:'狩猟小屋の食料生産+5〜25%（都市発展）。', d_en:'+5–25% city Hunter’s Hut output (city growth).'},
      {n_ja:'捕食者', n_en:'Predator', d_ja:'マップ上の食料の採集速度+5〜25%。', d_en:'+5–25% Meat gathering speed on the map.'}
    ]
  },
  reina: {
    explore: [
      {n_ja:'幻影強襲', n_en:'Phantom Assault', d_ja:'幻影で背後から奇襲、範囲攻撃300〜420%。', d_en:'Illusion ambush from behind: AoE Atk 300–420%.'},
      {n_ja:'隠れ身の術', n_en:'Vanishing Technique', d_ja:'通常攻撃を受けた時5〜25%で敵を混乱させ自身は回避。', d_en:'On being hit, 5–25% chance to confuse the attacker and dodge.'},
      {n_ja:'幻影刺し', n_en:'Illusion Strike', d_ja:'敵(英雄優先)に幻影、攻撃100〜140%＋1.5秒拘束。', d_en:'Illusion on enemy (hero first): Atk 100–140% + 1.5s immobilize.'}
    ],
    exped: [
      {n_ja:'急所狙い', n_en:"Assassin's Instinct", d_ja:'全部隊の通常攻撃ダメージ+10〜30%。', d_en:'+10–30% normal-attack damage for all troops.'},
      {n_ja:'回避の指揮', n_en:'Evasive Command', d_ja:'全部隊に4〜20%で通常攻撃を回避。', d_en:'All troops gain 4–20% chance to dodge normal attacks.'},
      {n_ja:'連撃の策', n_en:'Twin Strike', d_ja:'槍兵が25%で追撃（120〜200%ダメージ）。', d_en:'Lancers have 25% chance for an extra hit (120–200% damage).'}
    ]
  },
  lynn: {
    explore: [
      {n_ja:'シドラクの賛歌', n_en:'Hymn of Sidrak', d_ja:'全部隊の妨害(凍結/スタン等)を解除し攻撃を上昇。', d_en:'Clears debuffs (freeze/stun) for all troops and raises Attack.'},
      {n_ja:'致命のフィナーレ', n_en:'Lethal Finale', d_ja:'複数の敵を巻き込むダメージスキル。', d_en:'Damage skill that hits multiple enemies.'},
      {n_ja:'不協和音', n_en:'Discordant Tune', d_ja:'敵の攻撃速度と回復を低下させる。', d_en:'Lowers enemy Attack Speed and healing.'}
    ],
    exped: [
      {n_ja:'獅子の歌', n_en:'Song of Lion', d_ja:'全部隊の攻撃40%で与ダメージ+10〜50%。', d_en:'40% chance for troops to deal +10–50% damage.'},
      {n_ja:'哀愁のバラード', n_en:'Melancholic Ballad', d_ja:'敵部隊の与ダメージ-4〜20%。', d_en:'−4–20% damage dealt by all enemy troops.'},
      {n_ja:'ウーナイのカデンツァ', n_en:'Oonai Cadenza', d_ja:'弓兵の攻撃を3回毎に+1〜5%（戦闘終了まで蓄積）。', d_en:'+1–5% Marksman attack per 3 attacks (stacks until battle end).'}
    ]
  },
  ahmose: {
    explore: [
      {n_ja:'クトゥグアの加護', n_en:"Cthugha's Protection", d_ja:'2秒間無敵(操作不能・状態異常無効)＋周囲の被ダメージ-30〜70%。', d_en:'2s invulnerability (immune to control) + nearby troops −30–70% damage taken.'},
      {n_ja:'払暁の刃', n_en:'Daybreak Knife', d_ja:'前方を貫き攻撃70〜98%＋敵の被ダメージ+20%（2秒）。', d_en:'Pierces front for Atk 70–98% + enemy takes +20% damage (2s).'},
      {n_ja:'祖先の祝福', n_en:'Ancestral Blessing', d_ja:'加護発動後、攻撃30〜42%分を5秒かけて自己回復。', d_en:'After Protection, self-heals Atk 30–42% over 5s.'}
    ],
    exped: [
      {n_ja:'蛇陣', n_en:'Viper Formation', d_ja:'4回攻撃毎に被ダメージ軽減（弓/槍-10〜30%・歩兵-10〜70%／2ターン）。', d_en:'Every 4 attacks: −10–30% damage taken (Lan/Mks), −10–70% (Inf) for 2 turns.'},
      {n_ja:'炎の祈り', n_en:'Prayer of Flame', d_ja:'友軍歩兵の与ダメージ+20〜100%。', d_en:'+20–100% damage dealt by friendly Infantry.'},
      {n_ja:'光の刃', n_en:'Blade of Light', d_ja:'歩兵の各攻撃が与ダメ増＋敵の被ダメージ+15%（1ターン）。', d_en:'Infantry attacks deal more + enemy takes +15% damage (1 turn).'}
    ]
  },
  hector: {
    explore: [
      {n_ja:'剣の旋風', n_en:'Sword Whirlwind', d_ja:'攻撃速度+80〜120%＋状態異常(凍結/スタン等)無効（4秒）。', d_en:'+80–120% Attack Speed + immune to control (freeze/stun) for 4s.'},
      {n_ja:'背水の構え', n_en:'Desperado', d_ja:'HP50%未満で被ダメージ-20〜60%。', d_en:'−20–60% damage taken while below 50% HP.'},
      {n_ja:'火事場の力', n_en:'Adrenaline Surge', d_ja:'HP50%未満で攻撃+16〜48%。', d_en:'+16–48% Attack while below 50% HP.'}
    ],
    exped: [
      {n_ja:'生存本能', n_en:'Survival Instincts', d_ja:'一定確率で発動し部隊の生存力を高める。', d_en:'Proc-based buff that boosts troop survivability.'},
      {n_ja:'猛攻', n_en:'Rampant', d_ja:'序盤ほど強い減衰型の部隊攻撃バフ。', d_en:'Decaying troop Attack buff — strongest in early turns.'},
      {n_ja:'電撃', n_en:'Blitz', d_ja:'部隊の攻撃が一定確率で2倍ダメージ。', d_en:'Troop attacks have a chance to deal double damage.'}
    ]
  },
  nora: {
    explore: [
      {n_ja:'バラージュ', n_en:'Barrage', d_ja:'5連グレネードを敵(英雄優先)に投擲、範囲攻撃60〜84%。', d_en:'5-grenade cascade at enemy (hero first): AoE Atk 60–84%.'},
      {n_ja:'閃光弾', n_en:'Flashbang', d_ja:'閃光弾で攻撃50〜70%＋対象を1.5秒スタン。', d_en:'Flashbang for Atk 50–70% + 1.5s stun.'},
      {n_ja:'ヴァルキリーの咆哮', n_en:'Valkyrie Cry', d_ja:'全部隊の攻撃+3〜5%。', d_en:'+3–5% Attack for all troops.'}
    ],
    exped: [
      {n_ja:'不意打ち', n_en:'Sneak Strike', d_ja:'槍兵が20%で全敵に+20〜100%追加ダメージ。', d_en:'Lancers 20% chance to deal +20–100% extra damage to all enemies.'},
      {n_ja:'諸兵連合', n_en:'Combined Arms', d_ja:'歩兵・弓兵の火力を高め被ダメージを軽減する。', d_en:'Boosts Infantry/Marksman damage and reduces their damage taken.'},
      {n_ja:'勢い', n_en:'Momentum', d_ja:'槍兵5回攻撃毎に全部隊の与ダメ+5〜25%・被ダメ-5〜25%（2ターン）。', d_en:'Every 5 lancer attacks: all troops +5–25% damage, −5–25% damage taken (2 turns).'}
    ]
  },
  gwen: {
    explore: [
      {n_ja:'一斉射撃', n_en:'Salvo', d_ja:'後方の敵(英雄優先)に範囲攻撃180〜252%＋対象の攻撃速度-50%（2秒）。', d_en:'AoE on rear enemies (hero first): Atk 180–252% + target Attack Speed −50% (2s).'},
      {n_ja:'空の狙撃', n_en:'Sky Sniper', d_ja:'後方の敵に攻撃100〜140%＋50%で2倍ダメージ。', d_en:'Strike on rear enemy: Atk 100–140% + 50% chance of double damage.'},
      {n_ja:'業火', n_en:'Hellfire', d_ja:'焼夷弾で範囲に毎秒攻撃35〜49%（3秒燃焼）。', d_en:'Incendiary AoE: Atk 35–49%/sec burn for 3s.'}
    ],
    exped: [
      {n_ja:'鷹の目', n_en:'Eagle Vision', d_ja:'対象の被ダメージ+25%（味方全体の火力を増幅）。', d_en:'Target takes +25% damage (amplifies whole squad’s damage).'},
      {n_ja:'制空権', n_en:'Air Dominance', d_ja:'5回攻撃毎に+20〜100%ダメージ＋次の任意の一撃+5〜15%。', d_en:'Every 5 attacks +20–100% damage + next attack (any source) +5–15%.'},
      {n_ja:'爆撃手', n_en:'Blastmaster', d_ja:'弓兵が4回攻撃毎に全敵へ+10〜50%ダメージ。', d_en:'Marksmen deal +10–50% damage to all enemies every 4 attacks.'}
    ]
  },
  wuming: {
    explore: [
      {n_ja:'旋風の障壁', n_en:'Cyclone Barrier', d_ja:'杖を高速旋回し範囲攻撃100〜140%＋2秒無敵。', d_en:'Staff spin: AoE Atk 100–140% + 2s invulnerability.'},
      {n_ja:'明鏡止水', n_en:'Inner Clarity', d_ja:'自身の攻撃+8〜24%・防御+16〜48%（4秒）。', d_en:'+8–24% Attack, +16–48% Defense for 4s.'},
      {n_ja:'練達の拳', n_en:'Martial Mastery', d_ja:'通常攻撃毎にランダムな敵へ追加で攻撃20〜28%。', d_en:'Each normal attack deals an extra Atk 20–28% to a random enemy.'}
    ],
    exped: [
      {n_ja:'影の回避', n_en:"Shadow's Evasion", d_ja:'部隊の通常攻撃被ダメ-25%・スキル被ダメ-30%。', d_en:'Troops take −25% normal-attack and −30% skill damage.'},
      {n_ja:'三日月の鼓舞', n_en:'Crescent Uplift', d_ja:'全部隊の与ダメージ+20%（万能）。', d_en:'+20% damage dealt for all troops (universal).'},
      {n_ja:'元素共鳴', n_en:'Elemental Resonance', d_ja:'友軍部隊のスキルダメージ+25%。', d_en:'+25% skill damage dealt by friendly troops.'}
    ]
  },
  renee: {
    explore: [
      {n_ja:'幻惑の霧', n_en:'Illusion Cloud', d_ja:'範囲攻撃140%＋敵を混乱（混乱した敵は味方も攻撃）。', d_en:'AoE Atk 140% + confuses enemies (confused foes hit their own side).'},
      {n_ja:'星彩', n_en:'Starpaint', d_ja:'敵に星印を付与し被ダメージを増加させる。', d_en:'Marks enemies with a Star Mark, raising their damage taken.'},
      {n_ja:'夢幻の眼', n_en:'Dream Vision', d_ja:'自身の攻撃を上げ、印の敵への与ダメージを増加。', d_en:'Raises own Attack and damage dealt to marked targets.'}
    ],
    exped: [
      {n_ja:'悪夢の刻印', n_en:'Nightmare Trace', d_ja:'数ターン毎に夢印を付与、槍兵の与ダメージ+40〜200%（次ターン）。', d_en:'Periodically applies Dream Mark: +40–200% Lancer damage next turn.'},
      {n_ja:'ドリームキャッチャー', n_en:'Dreamcatcher', d_ja:'印の敵への槍兵の与ダメージ+30〜150%。', d_en:'+30–150% Lancer damage to marked targets.'},
      {n_ja:'夢斬り', n_en:'Dreamslice', d_ja:'印の敵への全部隊の与ダメージ+15〜75%。', d_en:'+15–75% damage to marked targets for all troops.'}
    ]
  },
  wayne: {
    explore: [
      {n_ja:'ハリケーン・ブーメラン', n_en:'Hurricane Blowback', d_ja:'大型ブーメランで前方範囲にダメージ。', d_en:'Large boomerang dealing AoE damage to enemies ahead.'},
      {n_ja:'ファントム・ブリッツ', n_en:'Phantom Blitz', d_ja:'高速連射で敵を攻撃する。', d_en:'Rapid-fire barrage striking enemies.'},
      {n_ja:'精密射撃', n_en:'Deadeye', d_ja:'自身のクリティカル率・火力を強化（探検時）。', d_en:'Boosts own critical rate and damage in Exploration.'}
    ],
    exped: [
      {n_ja:'サンダーストライク', n_en:'Thunder Strike', d_ja:'部隊の与ダメージを継続的に強化する。', d_en:'Provides a consistent troop damage boost.'},
      {n_ja:'回り込み', n_en:'Roundabout Hit', d_ja:'敵の槍兵・弓兵に有効な追加ダメージ。', d_en:'Extra damage, effective vs Lancer/Marksman enemies.'},
      {n_ja:'機敏', n_en:'Fleet', d_ja:'全部隊のクリティカル率を上昇させる。', d_en:'Raises critical rate for all troops.'}
    ]
  },
  edith: {
    explore: [
      {n_ja:'鉄壁の鉄拳', n_en:'Ironclad Punch', d_ja:'Mr.Tinで扇状範囲に攻撃140%＋1秒スタン＋自身の攻撃+100%（2秒）。', d_en:'Mr. Tin punches a fan area: Atk 140% + 1s stun + self Attack +100% (2s).'},
      {n_ja:'脱出カプセル', n_en:'Escape Capsule', d_ja:'Mr.Tinを爆発させ周囲に攻撃280%。', d_en:'Ejects and detonates Mr. Tin for Atk 280% to nearby enemies.'},
      {n_ja:'先制警戒', n_en:'Preemptive Alerts', d_ja:'50%の確率で被ダメージ-50%。', d_en:'50% chance to reduce damage taken by 50%.'}
    ],
    exped: [
      {n_ja:'戦略的均衡', n_en:'Strategic Balance', d_ja:'弓兵の被ダメ-20%・槍兵の与ダメ+20%。', d_en:'Friendly Marksmen −20% damage taken; Lancers +20% damage dealt.'},
      {n_ja:'鉄壁', n_en:'Ironclad', d_ja:'歩兵の被ダメージ-20%。', d_en:'Friendly Infantry −20% damage taken.'},
      {n_ja:'鋼の守護', n_en:'Steel Sentinel', d_ja:'全部隊のHP+25%。', d_en:'+25% Health for all friendly troops.'}
    ]
  },
  gordon: {
    explore: [
      {n_ja:'毒の爆発', n_en:'Poison Blast', d_ja:'毒霧で周囲に毎0.5秒攻撃70%（3秒）。', d_en:'Toxic mist: Atk 70% every 0.5s for 3s to nearby enemies.'},
      {n_ja:'毒の火炎瓶', n_en:'Toxic Molotov', d_ja:'対象に毎0.5秒攻撃35%＋被ダメージ+25%（2秒）。', d_en:'Atk 35% every 0.5s + target takes +25% damage (2s).'},
      {n_ja:'耐毒', n_en:'Tolerization', d_ja:'自身の防御+75%。', d_en:'+75% own Defense.'}
    ],
    exped: [
      {n_ja:'毒の注入', n_en:'Venom Infusion', d_ja:'2回攻撃毎に槍兵が+100%追加ダメージ＋毒付与（毒の敵は与ダメ-20%）。', d_en:'Every 2 attacks, Lancers deal +100% damage + poison (poisoned foes −20% damage).'},
      {n_ja:'化学の恐怖', n_en:'Chemical Terror', d_ja:'3ターン毎に槍兵の与ダメ+150%・敵の与ダメ-30%（1ターン）。', d_en:'Every 3 turns: Lancers +150% damage, enemies −30% damage (1 turn).'},
      {n_ja:'毒の放出', n_en:'Toxic Release', d_ja:'毒状態の敵への追加ダメージ・弱体を強化する。', d_en:'Amplifies extra damage and debuffs against poisoned enemies.'}
    ]
  },
  bradley: {
    explore: [
      {n_ja:'破壊者', n_en:'Destructor', d_ja:'大砲で範囲攻撃300〜420%。', d_en:'Artillery shell: AoE Atk 300–420%.'},
      {n_ja:'焼夷弾', n_en:'Incendiary Shell', d_ja:'範囲攻撃84%＋着弾地に毎0.5秒21%（2秒燃焼）。', d_en:'AoE Atk 84% + flaming crater Atk 21% every 0.5s for 2s.'},
      {n_ja:'大胆', n_en:'Audacious', d_ja:'自身の攻撃+24%。', d_en:'+24% own Attack.'}
    ],
    exped: [
      {n_ja:'老兵の威光', n_en:"Veteran's Might", d_ja:'全部隊の攻撃+25%。集結で強力。', d_en:'+25% Attack for all troops. Strong rally buff.'},
      {n_ja:'強撃', n_en:'Power Shot', d_ja:'特定の兵種編成に有効な追加ダメージ。', d_en:'Extra damage effective against specific troop compositions.'},
      {n_ja:'戦術支援', n_en:'Tactical Assistance', d_ja:'断続的な火力スパイクで部隊を支援する。', d_en:'Provides periodic damage spikes to support troops.'}
    ]
  },
  hendrik: {
    explore: [
      {n_ja:'ルルイエの歌', n_en:"Song of R'lyeh", d_ja:'深淵の精霊で範囲攻撃220〜300%＋1.5秒スタン。', d_en:'Summons abyssal spirits: AoE Atk 220–300% + 1.5s stun.'},
      {n_ja:'沈黙の錨', n_en:'Sinking Anchor', d_ja:'巨大な錨で範囲攻撃100〜140%。', d_en:'Hurls a heavy anchor: AoE Atk 100–140%.'},
      {n_ja:'ヤツメウナギの口づけ', n_en:"Lamprey's Kiss", d_ja:'敵撃破毎に与ダメージ+0.5〜2.5%（最大15スタック）。', d_en:'+0.5–2.5% damage per defeated enemy (max 15 stacks).'}
    ],
    exped: [
      {n_ja:'船食い虫の蹂躙', n_en:"Worm's Ravage", d_ja:'敵部隊の防御-5〜25%。', d_en:'−5–25% Defense for all enemy troops.'},
      {n_ja:'フジツボの装甲', n_en:'Armor of Barnacles', d_ja:'4ターン毎に全部隊の防御+6〜30%（2ターン）。', d_en:'Every 4 turns: +6–30% Defense for all troops (2 turns).'},
      {n_ja:'竜の末裔', n_en:"Dragon's Heir", d_ja:'3ターン毎に全敵へ8〜40%ダメージ（弓兵と連携）。', d_en:'Every 3 turns: 8–40% damage to all enemies (with Marksmen).'}
    ]
  },
  gatot: {
    explore: [
      {n_ja:'王の決意', n_en:"King's Resolve", d_ja:'攻撃220〜380%分のシールド（5秒・優先で消費）。', d_en:'Shield equal to Atk 220–380% (absorbed first), lasts 5s.'},
      {n_ja:'王の威厳', n_en:'Royal Authority', d_ja:'敵英雄の攻撃-1〜5%＋威圧数に応じ自身の攻撃上昇（3秒）。', d_en:'Enemy heroes −1–5% Attack; self Attack scales with heroes intimidated (3s).'},
      {n_ja:'王の舞', n_en:'Regal Dance', d_ja:'通常攻撃を3〜15%回避＋クリティカル率+4〜20%。', d_en:'3–15% dodge vs normal attacks + 4–20% Crit Rate.'}
    ],
    exped: [
      {n_ja:'黄金の守護', n_en:'Golden Guard', d_ja:'歩兵の防御+6〜30%。', d_en:'+6–30% Infantry Defense.'},
      {n_ja:'王の恩寵', n_en:"King's Bestowal", d_ja:'歩兵が攻撃毎に攻撃6〜30%分のシールドを獲得（1ターン）。', d_en:'Infantry gain a shield of Atk 6–30% on each attack (1 turn).'},
      {n_ja:'王の軍団', n_en:'Royal Legion', d_ja:'敵の攻撃-5〜25%。', d_en:'−5–25% enemy Attack.'}
    ]
  },
  sonya: {
    explore: [
      {n_ja:'極寒', n_en:'Extreme Cold', d_ja:'冷凍ジェットで対象を1.5秒凍結＋範囲攻撃220〜300%。', d_en:'Cryo jet: freezes target 1.5s + AoE Atk 220–300%.'},
      {n_ja:'氷結爆弾', n_en:'Frozen Bomb', d_ja:'単体に攻撃100〜140%＋周囲の攻撃速度-50%（3秒）。', d_en:'Atk 100–140% + nearby enemies −50% Attack Speed (3s).'},
      {n_ja:'金の亡者', n_en:'Money-Hungry', d_ja:'自身の攻撃速度+10〜30%。', d_en:'+10–30% own Attack Speed.'}
    ],
    exped: [
      {n_ja:'トレジャーハンター', n_en:'Treasure Hunter', d_ja:'全部隊の与ダメージ+4〜20%。', d_en:'+4–20% Damage for all troops.'},
      {n_ja:'報奨の誘惑', n_en:'Bounty Temptation', d_ja:'槍兵が2回攻撃毎に+15〜75%ダメージ＋全部隊の攻撃+5〜25%（1ターン）。', d_en:'Lancers +15–75% damage every 2 attacks + all troops +5–25% Attack (1 turn).'},
      {n_ja:'激流の一撃', n_en:'Torrential Impact', d_ja:'槍兵が5ターン毎に50〜250%ダメージ＋1ターンスタン。', d_en:'Lancers deal 50–250% damage every 5 turns + 1-turn stun.'}
    ]
  },
  magnus: {
    explore: [
      {n_ja:'氷結の怒り', n_en:'Frozen Fury', d_ja:'双斧で周囲を挑発し毎0.5秒攻撃60〜84%（3秒）。', d_en:'Twin axes: taunts nearby foes + Atk 60–84% every 0.5s for 3s.'},
      {n_ja:'烈風の戦斧', n_en:'Wind Tomahawk', d_ja:'単体に攻撃100〜140%＋出血で追加50〜70%（3秒）。', d_en:'Axe throw Atk 100–140% + bleed Atk 50–70% over 3s.'},
      {n_ja:'破甲', n_en:'Sunderer', d_ja:'通常攻撃30%で攻撃50〜70%追加＋敵防御-5〜25%（2秒）。', d_en:'Normal attacks 30% chance: +Atk 50–70% & enemy −5–25% Defense (2s).'}
    ],
    exped: [
      {n_ja:'強欲', n_en:'Rapacious', d_ja:'友軍部隊の攻撃+25%。', d_en:'+25% Attack for friendly troops.'},
      {n_ja:'鉄の密集陣', n_en:'Iron Phalanx', d_ja:'歩兵が攻撃時40%で防御+50%（1ターン）。', d_en:'Infantry 40% chance to gain +50% Defense on attack (1 turn).'},
      {n_ja:'氷の男', n_en:'Iceman', d_ja:'友軍歩兵の被ダメ-10%・弓兵の与ダメ+10%。', d_en:'Friendly Infantry −10% damage taken; Marksmen +10% damage dealt.'}
    ]
  },
  fred: {
    explore: [
      {n_ja:'酸の雨', n_en:'Acid Rain', d_ja:'毎0.5秒攻撃84%＋対象の被ダメージ+15%（3秒）。', d_en:'Atk 84% every 0.5s + targets take +15% damage (3s).'},
      {n_ja:'放水砲', n_en:'Water Cannon', d_ja:'攻撃280%＋敵の戦闘バフを除去。', d_en:'Atk 280% and strips the enemy’s combat bonuses.'},
      {n_ja:'完璧な対応', n_en:'Perfect Responder', d_ja:'HP50%未満で攻撃+24%・防御+75%。', d_en:'Below 50% HP: +24% Attack, +75% Defense.'}
    ],
    exped: [
      {n_ja:'水圧制圧', n_en:'Hydraulic Suppression', d_ja:'敵部隊の殺傷-20%。', d_en:'−20% Lethality for all enemy troops.'},
      {n_ja:'酸化', n_en:'Acidification', d_ja:'敵歩兵の被ダメージ+20%。', d_en:'Enemy Infantry take +20% damage.'},
      {n_ja:'大洪水', n_en:'Floodbringer', d_ja:'槍兵が4回攻撃毎に+200%ダメージ＋次ターン敵の与ダメ-20%。', d_en:'Lancers +200% damage every 4 strikes; next turn enemies −20% damage.'}
    ]
  },
  xura: {
    explore: [
      {n_ja:'生命の舞', n_en:'Life Dance', d_ja:'舞で味方英雄を毎秒攻撃20〜100%回復＋被ダメージ-50%（3秒）。自身は状態異常無効。', d_en:'Heals friendly heroes Atk 20–100%/sec + −50% damage taken (3s); self immune to control.'},
      {n_ja:'胞子の呪縛', n_en:'Sporebind', d_ja:'対象に胞子、攻撃する度に攻撃100〜140%（3秒）。', d_en:'Infects target: Atk 100–140% each time it attacks, for 3s.'},
      {n_ja:'麻痺の吹き矢', n_en:'Numbing Dart', d_ja:'自身の攻撃+4〜12%＋20%で対象を1秒拘束。', d_en:'+4–12% own Attack + 20% chance to immobilize target 1s.'}
    ],
    exped: [
      {n_ja:'菌糸の霧', n_en:'Fungal Fog', d_ja:'友軍部隊の被ダメージ-4〜20%。', d_en:'−4–20% damage taken for friendly troops.'},
      {n_ja:'貫通の矢', n_en:'Piercing Arrow', d_ja:'弓兵が2回毎に+20〜100%ダメージ＋対象の被ダメ+5〜25%（1ターン）。', d_en:'Marksmen +20–100% damage every 2 strikes + target +5–25% damage (1 turn).'},
      {n_ja:'型破りの戦術', n_en:'Unorthodoxy', d_ja:'弓兵の与ダメ+3〜15%・被ダメ-2〜10%。', d_en:'Marksmen +3–15% damage dealt, −2–10% damage taken.'}
    ]
  },
  gregory: {
    explore: [
      {n_ja:'怒濤の一撃', n_en:'Furious Strike', d_ja:'範囲攻撃140%＋周囲をノックバック＋1秒スタン。', d_en:'AoE Atk 140% + knockback + 1s stun to nearby enemies.'},
      {n_ja:'大剣の構え', n_en:'Defensive Posture', d_ja:'大剣の構えで50%の確率で被ダメージ半減。', d_en:'Greatsword stance: 50% chance to halve damage taken.'},
      {n_ja:'犠牲の意志', n_en:'Sacrificial Will', d_ja:'撃破された後、全部隊の攻撃+8〜24%（5秒）。', d_en:'After Gregory falls, +8–24% Attack for all troops (5s).'}
    ],
    exped: [
      {n_ja:'太陽の軍団', n_en:'Legion of the Sun', d_ja:'全部隊の攻撃+3〜15%・防御+2〜10%。', d_en:'+3–15% Attack and +2–10% Defense for all troops.'},
      {n_ja:'突撃', n_en:'Charged Assault', d_ja:'全部隊の通常攻撃に5〜25%でクリティカル発生。', d_en:'All troops’ normal attacks gain 5–25% chance to crit.'},
      {n_ja:'不屈', n_en:'Unbroken', d_ja:'歩兵の被ダメージ-20%。', d_en:'−20% damage taken for Infantry.'}
    ]
  },
  freya: {
    explore: [
      {n_ja:'連鎖刻印', n_en:'Chain Mark', d_ja:'鎖で対象と周囲に攻撃280%＋刻印（刻印の敵への攻撃は80%が周囲へ波及）。', d_en:'Chain Atk 280% to target + nearby + mark (attacks on marked foe splash 80% to nearby).'},
      {n_ja:'鎖縛', n_en:'Chain Bind', d_ja:'鎖で対象に攻撃140%＋1.5秒拘束。', d_en:'Chain-smash: Atk 140% + 1.5s immobilize.'},
      {n_ja:'狂乱', n_en:'Frenzy', d_ja:'通常攻撃4回毎にクリティカル率+100%。', d_en:'+100% Crit Rate per 4 normal attacks.'}
    ],
    exped: [
      {n_ja:'収穫', n_en:'Reap', d_ja:'通常攻撃後、50%の確率で追撃「収穫」を発動。', d_en:'After a normal attack, 50% chance to perform a Reap follow-up.'},
      {n_ja:'煙幕', n_en:'Smoke Screen', d_ja:'敵部隊の攻撃-20%。', d_en:'−20% Attack for all enemy troops.'},
      {n_ja:'奇襲', n_en:'Surprise Raid', d_ja:'歩兵・弓兵の被ダメ-15%・与ダメ+15%。', d_en:'Friendly Infantry/Marksmen −15% damage taken, +15% damage dealt.'}
    ]
  },
  blanchette: {
    explore: [
      {n_ja:'三連銃', n_en:'Triple Blunderbuss', d_ja:'改造銃で3体に攻撃280%＋治療を5秒封じる。', d_en:'Musket hits 3 targets for Atk 280% + blocks healing for 5s.'},
      {n_ja:'散弾', n_en:'Scattershot', d_ja:'結晶片で範囲攻撃140%。', d_en:'Crystal shards: AoE Atk 140%.'},
      {n_ja:'紅の追撃', n_en:'Red Pursuit', d_ja:'対象のHPが減るほど与ダメージ最大+50%。', d_en:'Up to +50% damage dealt as the target’s HP decreases.'}
    ],
    exped: [
      {n_ja:'完全武装', n_en:'Armed to the Teeth', d_ja:'全部隊の殺傷+25%。', d_en:'+25% Lethality for all troops.'},
      {n_ja:'血の狩人', n_en:'Blood Hunter', d_ja:'弓兵が3回毎に結晶刃で+75%ダメージ。', d_en:'Marksmen fire a crystal blade every 3 rounds for +75% damage.'},
      {n_ja:'紅の狙撃', n_en:'Crimson Sniper', d_ja:'弓兵が2回毎に敵槍兵へ+40%・敵弓兵へ+20%ダメージ。', d_en:'Marksmen every 2 strikes: +40% vs enemy Lancers, +20% vs enemy Marksmen.'}
    ]
  },
  eleonora: {
    explore: [
      {n_ja:'烈火の盾', n_en:'Shield of Blaze', d_ja:'攻撃100〜220%分のシールド＋被ダメ30%を反射、3秒後に破裂し周囲へ60〜80%。', d_en:'Shield of Atk 100–220% + reflects 30% damage; ruptures after 3s for 60–80% AoE.'},
      {n_ja:'王の制裁', n_en:'Regal Sanction', d_ja:'大槌で攻撃100〜140%＋対象の防御-10〜30%（2秒）。', d_en:'Hammer Atk 100–140% + target −10–30% Defense (2s).'},
      {n_ja:'荘厳の冠', n_en:'Majestic Corona', d_ja:'自身の被ダメ-5〜15%・与ダメ+5〜15%。', d_en:'−5–15% own damage taken, +5–15% damage dealt.'}
    ],
    exped: [
      {n_ja:'灼熱の太陽', n_en:'Scorching Sun', d_ja:'全部隊のHP+5〜25%。', d_en:'+5–25% Health for all troops.'},
      {n_ja:'ソラリスの結束', n_en:'Solaris Nexus', d_ja:'歩兵の被ダメ-2〜10%・弓兵の与ダメ+2〜10%。', d_en:'Infantry −2–10% damage taken; Marksmen +2–10% damage dealt.'},
      {n_ja:'天翔ける炎', n_en:'Soaring Flame', d_ja:'歩兵5回攻撃毎に全部隊の与ダメ+5〜25%・被ダメ-5〜25%（2ターン）。', d_en:'Every 5 Infantry attacks: all troops +5–25% damage, −5–25% damage taken (2 turns).'}
    ]
  },
  lloyd: {
    explore: [
      {n_ja:'連続爆撃', n_en:'Rapid Bombardment', d_ja:'プロペラ爆弾3連、各範囲攻撃70〜98%。', d_en:'Three propeller bombs, each AoE Atk 70–98%.'},
      {n_ja:'弱点狙い', n_en:'Weakness Focus', d_ja:'攻撃100〜140%＋弱点露呈で対象の被ダメ+10〜20%（3秒）。', d_en:'Atk 100–140% + exposes weakness, target +10–20% damage (3s).'},
      {n_ja:'熟練の極み', n_en:'Practiced Perfection', d_ja:'自身の攻撃速度+10〜30%。', d_en:'+10–30% own Attack Speed.'}
    ],
    exped: [
      {n_ja:'機械鳥の襲来', n_en:'Bird Invasion', d_ja:'敵の殺傷-4〜20%。', d_en:'−4–20% enemy Lethality.'},
      {n_ja:'氷炎爆弾', n_en:'Iceflare Bomb', d_ja:'3ターン毎に槍兵の攻撃+30〜150%＋敵の殺傷-6〜30%（1ターン）。', d_en:'Every 3 turns: Lancers +30–150% attack + enemy −6–30% Lethality (1 turn).'},
      {n_ja:'匠の妙技', n_en:'Ingenious Mastery', d_ja:'40%で全部隊の殺傷+10〜50%。', d_en:'40% chance to grant all troops +10–50% Lethality.'}
    ]
  },
  rufus: {
    explore: [
      {n_ja:'流星衝', n_en:'Starfall Impact', d_ja:'範囲攻撃200〜280%＋地面炎上で毎0.5秒20〜30%（2秒）。', d_en:'AoE Atk 200–280% + ground ablaze Atk 20–30% every 0.5s for 2s.'},
      {n_ja:'炸裂弾', n_en:'Splinter Blast', d_ja:'単体に攻撃100〜140%＋破片で周囲に50〜70%。', d_en:'Atk 100–140% to target + splinters Atk 50–70% to nearby.'},
      {n_ja:'激昂', n_en:'Raging Fury', d_ja:'自身のクリティカル率+7〜20%。', d_en:'+7–20% own Crit Rate.'}
    ],
    exped: [
      {n_ja:'業火の連隊', n_en:'Inferno Regiment', d_ja:'全部隊の攻撃+5〜25%。', d_en:'+5–25% Attack for all troops.'},
      {n_ja:'装甲粉砕', n_en:'Armor Crush', d_ja:'弓兵の与ダメージ+12〜60%＋対象の被ダメ+5〜25%（1ターン）。', d_en:'Marksmen +12–60% damage + target +5–25% damage taken (1 turn).'},
      {n_ja:'憤怒の地震', n_en:'Wrathful Quake', d_ja:'全部隊が20%で敵を威圧し、敵の殺傷-10〜50%（2ターン）。', d_en:'All troops 20% chance to intimidate: −10–50% enemy Lethality (2 turns).'}
    ]
  },
  hervor: {
    explore: [
      {n_ja:'大地砕き', n_en:'Earthmover', d_ja:'前方に攻撃100〜140%＋1秒スタン＋威圧で敵の攻撃-25%（3秒）。', d_en:'Frontal Atk 100–140% + 1s stun + Intimidation −25% enemy Attack (3s).'},
      {n_ja:'山の膂力', n_en:'Mountain Strength', d_ja:'通常攻撃が5〜25%で威圧（敵の被ダメ+3〜15%・最大3スタック）。', d_en:'Normal attacks 5–25% chance to Intimidate (+3–15% enemy damage taken, max 3).'},
      {n_ja:'石の腕', n_en:'Stone Arms', d_ja:'自身の被ダメ-5〜25%＋開幕9秒間は状態異常無効。', d_en:'−5–25% own damage taken + immune to control for first 9s.'}
    ],
    exped: [
      {n_ja:'血の呼び声', n_en:'Call For Blood', d_ja:'全部隊の殺傷+5〜25%。', d_en:'+5–25% Lethality for all troops.'},
      {n_ja:'不死身', n_en:'Undying', d_ja:'歩兵の通常被ダメ-5〜25%・スキル被ダメ-6〜30%。', d_en:'Infantry −5–25% normal-attack and −6–30% skill damage taken.'},
      {n_ja:'血に飢えて', n_en:'Bloodthirsty', d_ja:'歩兵の被ダメ-3〜15%・与ダメ+2〜10%。', d_en:'Infantry −3–15% damage taken, +2–10% damage dealt.'}
    ]
  },
  karol: {
    explore: [
      {n_ja:'暁の突撃', n_en:'Dawn Charge', d_ja:'前方範囲に攻撃200〜280%＋敵の防御-5〜25%（2秒）。', d_en:'Charge: frontal AoE Atk 200–280% + enemy −5–25% Defense (2s).'},
      {n_ja:'連突', n_en:'Bristling Strike', d_ja:'連続突きで範囲攻撃110〜140%。', d_en:'Flurry of strikes: AoE Atk 110–140%.'},
      {n_ja:'勝利の高揚', n_en:'Soaring Victory', d_ja:'敵英雄撃破毎に攻撃+4〜12%＋HP2〜10%回復。', d_en:'+4–12% Attack per enemy hero felled + restores 2–10% Health.'}
    ],
    exped: [
      {n_ja:'側面援護', n_en:'In the Wings', d_ja:'全部隊の被ダメージ-4〜20%。', d_en:'−4–20% damage taken for all troops.'},
      {n_ja:'盾砕き', n_en:'Shieldbreaker', d_ja:'全部隊の対槍兵+6〜30%・対歩兵+5〜25%ダメージ。', d_en:'All troops +6–30% damage to Lancers, +5–25% to Infantry.'},
      {n_ja:'歴戦の軍旗', n_en:'Standard of Ages', d_ja:'全部隊の攻撃+3〜15%・防御+2〜10%。', d_en:'+3–15% Attack and +2–10% Defense for all troops.'}
    ]
  },
  ligeia: {
    explore: [
      {n_ja:'酸の逆流', n_en:'Acid Reflux', d_ja:'酸を吐く機械蜘蛛3体で範囲攻撃70〜98%＋敵の攻撃-5〜25%（2秒）。', d_en:'3 acid Mech-spiders: AoE Atk 70–98% + enemy −5–25% Attack (2s).'},
      {n_ja:'蜘蛛の女王', n_en:'Spider Madam', d_ja:'鋼の巣で攻撃50〜70%＋20〜100%で「共鳴」罠（5秒・自身への被ダメを対象へ転嫁）。', d_en:'Steelweb Atk 50–70% + 20–100% chance of Resonance trap (5s; redirects damage to target).'},
      {n_ja:'機械の牙', n_en:'Mechanical Teeth', d_ja:'守護蜘蛛を消費し弱体を1つ無効化＋10秒攻撃+8〜24%（守護蜘蛛最大3体）。', d_en:'Spends a Guard Spider to deflect a debuff + 10s +8–24% Attack (max 3 spiders).'}
    ],
    exped: [
      {n_ja:'毒の弱体', n_en:'Nerf Poison', d_ja:'敵全体の防御-5〜25%。', d_en:'−5–25% Defense for all enemy troops.'},
      {n_ja:'腐食', n_en:'Corrosion', d_ja:'弓兵が2回毎に+20〜100%ダメージ＋対象の被ダメ+5〜25%（1ターン）。', d_en:'Marksmen +20–100% damage every 2 attacks + target +5–25% damage taken (1 turn).'},
      {n_ja:'毒の鏃', n_en:'Toxic Tip', d_ja:'弓兵が2回毎に対象へ+20〜100%ダメージ＋対象の与ダメ-4〜20%（1ターン）。', d_en:'Marksmen +20–100% damage to target every 2 attacks + target −4–20% damage dealt (1 turn).'}
    ]
  },
  gisela: {
    explore: [
      {n_ja:'過負荷', n_en:'Superload', d_ja:'攻撃モード5秒、エネルギー50獲得＋攻撃速度+20〜60%・防御+50〜150%。', d_en:'Attack Mode 5s: +50 Energy, +20–60% Attack Speed, +50–150% Defense.'},
      {n_ja:'鋼の鉄槌', n_en:'Steel Hammer', d_ja:'メカアームで範囲攻撃100〜140%＋エネルギー25獲得。', d_en:'Mech-arm AoE Atk 100–140% + gains 25 Energy.'},
      {n_ja:'携行シールド', n_en:'Porta-Shield', d_ja:'エネルギー100で攻撃70〜190%分のシールド（3秒）。通常攻撃毎にエネルギー+3〜15。', d_en:'At 100 Energy, shield of Atk 70–190% (3s); +3–15 Energy per normal attack.'}
    ],
    exped: [
      {n_ja:'合金装甲', n_en:'Alloyed Defense', d_ja:'歩兵の防御+6〜30%。', d_en:'+6–30% Infantry Defense.'},
      {n_ja:'回収術', n_en:'Scavengeworks', d_ja:'歩兵が40%で全部隊の防御+10〜50%（1ターン）。', d_en:'Infantry 40% chance to grant all troops +10–50% Defense (1 turn).'},
      {n_ja:'試作シールド', n_en:'Trial Shield', d_ja:'40%で全部隊の被ダメージ-10〜50%。', d_en:'40% chance to reduce all troops’ damage taken by 10–50%.'}
    ]
  },
  flora: {
    explore: [
      {n_ja:'蔓の包囲', n_en:'Envelopment', d_ja:'蔓で範囲攻撃100〜140%＋2秒スタン。', d_en:'Vine AoE Atk 100–140% + 2s stun.'},
      {n_ja:'薔薇の開花', n_en:'Rosebloom', d_ja:'毒の花で範囲攻撃20〜40%＋食人薔薇を召喚（Floraの能力10〜30%を継承・周囲を攻撃）。', d_en:'Toxic bloom AoE Atk 20–40% + spawns a flesh-eating Adoria Rose (inherits 10–30% of Flora’s stats).'},
      {n_ja:'自然の力', n_en:"Nature's Strength", d_ja:'自身と召喚植物のHP+2〜10%・防御+4〜20%。', d_en:'Flora and summoned plants gain +2–10% Health, +4–20% Defense.'}
    ],
    exped: [
      {n_ja:'絡みつく蔓', n_en:'Enmiring Vines', d_ja:'全部隊が50%で敵の被ダメージ+10〜50%。', d_en:'All troops 50% chance to raise enemies’ damage taken by 10–50%.'},
      {n_ja:'繁茂', n_en:'Plantage', d_ja:'歩兵の被ダメ-5〜25%＋槍兵の連携攻撃+5〜25%ダメージ。', d_en:'Infantry −5–25% damage taken + Lancer joint attacks +5–25% damage.'},
      {n_ja:'幻惑の花粉', n_en:'Confusion Pollen', d_ja:'4ターン毎に敵歩兵の被ダメ+6〜30%・敵弓兵の与ダメ-6〜30%（2ターン）。', d_en:'Every 4 turns: enemy Infantry +6–30% damage taken, enemy Marksmen −6–30% damage dealt (2 turns).'}
    ]
  },
  vulcanus: {
    explore: [
      {n_ja:'攻城ボルト', n_en:'Siege Bolts', d_ja:'3本の大型ボルトで攻撃200〜280%＋出血（毎0.5秒10%・3秒）。', d_en:'Three heavy bolts: Atk 200–280% + Bleed (Atk 10% every 0.5s for 3s).'},
      {n_ja:'鎖縛', n_en:'Chainlinked', d_ja:'敵英雄に攻撃100〜140%＋2秒拘束スタン。', d_en:'Chained dart on an enemy hero: Atk 100–140% + 2s immobilize/stun.'},
      {n_ja:'希望の火', n_en:'Fire of Hope', d_ja:'護衛部隊の攻撃・防御+10〜30%。', d_en:'+10–30% Escorts’ Attack and Defense.'}
    ],
    exped: [
      {n_ja:'荒れ狂う嵐', n_en:'Raging Storm', d_ja:'敵全体の攻撃-4〜20%。', d_en:'−4–20% Attack for all enemy troops.'},
      {n_ja:'破鋼', n_en:'Breaker Steel', d_ja:'全部隊が5回攻撃毎に+20〜100%ダメージ＋対象の次撃の被ダメ+5〜15%。', d_en:'All troops +20–100% damage every 5 attacks + target +5–15% damage taken on next hit.'},
      {n_ja:'正撃', n_en:'True Strike', d_ja:'敵の歩兵・槍兵の防御-12〜60%（3ターン）＋弓兵の攻撃+12〜60%（1ターン）。', d_en:'Enemy Infantry/Lancer −12–60% Defense (3 turns) + Marksmen +12–60% Attack (1 turn).'}
    ]
  },
  elif: {
    explore: [
      {n_ja:'幻影の舞', n_en:'Spectral Glide', d_ja:'幻惑の動きで敵を1秒混乱＋10〜30%の確率で5秒間回避。', d_en:'Dazzling moves confuse enemies 1s + 10–30% dodge chance for 5s.'},
      {n_ja:'刃の舞', n_en:'Blade Dance', d_ja:'不規則な斬撃で攻撃100〜140%＋対象を1秒混乱。', d_en:'Erratic blade strikes: Atk 100–140% + confuse target 1s.'},
      {n_ja:'幽玄の歩み', n_en:'Ethereal Steps', d_ja:'回避率+7〜20%＋通常攻撃7〜20%で対象を1秒混乱。', d_en:'+7–20% dodge + normal attacks 7–20% chance to confuse 1s.'}
    ],
    exped: [
      {n_ja:'束縛の帳', n_en:'Shackling Veil', d_ja:'敵部隊の攻撃-5〜25%。', d_en:'−5–25% Attack for all enemy troops.'},
      {n_ja:'斬撃陣', n_en:'Slash Formation', d_ja:'全部隊の攻撃+3〜15%・防御+2〜10%。', d_en:'+3–15% Attack and +2–10% Defense for all troops.'},
      {n_ja:'魅惑の織物', n_en:'Enchanting Tapestry', d_ja:'歩兵が攻撃時に攻撃6〜30%分のシールド（1ターン）。', d_en:'Infantry gain a shield of Atk 6–30% on attack (1 turn).'}
    ]
  },
  dominic: {
    explore: [
      {n_ja:'箱のトリック', n_en:'Box Trick', d_ja:'3つの魔法の箱でそれぞれ範囲攻撃200〜280%＋1秒スタン。', d_en:'Three magic boxes, each AoE Atk 200–280% + 1s stun.'},
      {n_ja:'灼熱の薔薇', n_en:'Scorching Roses', d_ja:'薔薇を投げて攻撃100〜140%＋燃焼で毎0.5秒4〜12%（2秒）。', d_en:'Rose burst Atk 100–140% + burn Atk 4–12% every 0.5s for 2s.'},
      {n_ja:'二重のトリック', n_en:'Double Trouble', d_ja:'HPが0になると消え、5秒後に10〜50%のHPで復活（1戦闘1回）。', d_en:'On reaching 0 HP, vanish and revive after 5s with 10–50% HP (once per battle).'}
    ],
    exped: [
      {n_ja:'魔法仕掛け', n_en:'Mystic Mechanism', d_ja:'全部隊の与ダメージ+4〜20%。', d_en:'+4–20% damage dealt for all troops.'},
      {n_ja:'毒棘の強襲', n_en:'Spiky Assault', d_ja:'槍兵の与ダメ+12〜60%＋毒の敵の被ダメ+5〜25%（1ターン）。', d_en:'Lancers +12–60% damage + poisoned foes +5–25% damage taken (1 turn).'},
      {n_ja:'鏡の迷宮', n_en:'Mirror Maze', d_ja:'歩兵・弓兵の被ダメ-3〜15%・与ダメ+3〜15%。', d_en:'Infantry/Marksmen −3–15% damage taken, +3–15% damage dealt.'}
    ]
  },
  cara: {
    explore: [
      {n_ja:'秘術の砲撃', n_en:'Arcane Blast', d_ja:'大砲で範囲攻撃200〜280%。', d_en:'Cannon AoE Atk 200–280%.'},
      {n_ja:'陰鬱の霧', n_en:'Gloomy Mist', d_ja:'霧で敵の命中-7〜15%＋燃焼で毎0.5秒7〜15%（2秒）。', d_en:'Mist −7–15% enemy accuracy + burn Atk 7–15% every 0.5s for 2s.'},
      {n_ja:'深い友情', n_en:'Heartfelt Friendship', d_ja:'味方英雄が倒れる度に自身の攻撃+3〜15%（戦闘終了まで）。', d_en:'+3–15% own Attack each time an ally hero falls (until battle end).'}
    ],
    exped: [
      {n_ja:'煙幕の遭遇', n_en:'Smoky Encounter', d_ja:'煙幕で敵の殺傷-4〜20%。', d_en:'Smoke grenades reduce enemy Lethality by 4–20%.'},
      {n_ja:'メカペット', n_en:'Mech Pet', d_ja:'全部隊の通常攻撃ダメージ+10〜30%。', d_en:'+10–30% normal-attack damage for all troops.'},
      {n_ja:'魔女の怒り', n_en:"Witch's Wrath", d_ja:'弓兵が2回毎に敵槍兵へ+8〜40%・敵弓兵へ+4〜20%ダメージ。', d_en:'Marksmen every 2 attacks: +8–40% vs enemy Lancers, +4–20% vs enemy Marksmen.'}
    ]
  },
  hank: {
    explore: [
      {n_ja:'狂乱の斬撃', n_en:'Frenzied Slashes', d_ja:'フレンジー状態で2連斬、各攻撃120〜160%＋敵の防御-10〜30%（2秒）。', d_en:'Frenzy mode: two slashes, each Atk 120–160% + enemy −10–30% Defense (2s).'},
      {n_ja:'緊急出力', n_en:'Urgent Energy', d_ja:'HP50%未満で攻撃+10〜30%（1戦闘1回）。', d_en:'Below 50% HP: +10–30% Attack (once per battle).'},
      {n_ja:'再利用', n_en:'Recycle & Reuse', d_ja:'与ダメージの10〜30%をHPに変換（吸収）。', d_en:'Converts 10–30% of damage dealt into Health (lifesteal).'}
    ],
    exped: [
      {n_ja:'咆哮の怒り', n_en:'Roaring Rage', d_ja:'全部隊の殺傷+5〜25%。', d_en:'+5–25% Lethality for all troops.'},
      {n_ja:'飛散する火花', n_en:'Flying Sparks', d_ja:'歩兵5回攻撃毎に全部隊の与ダメ+5〜25%・被ダメ-5〜25%。', d_en:'Every 5 Infantry attacks: all troops +5–25% damage, −5–25% damage taken.'},
      {n_ja:'激怒の力', n_en:'Raging Force', d_ja:'4ターン毎に敵歩兵の被ダメ+6〜30%・敵弓兵の与ダメ-6〜30%（2ターン）。', d_en:'Every 4 turns: enemy Infantry +6–30% damage taken, enemy Marksmen −6–30% damage dealt (2 turns).'}
    ]
  },
  estrella: {
    explore: [
      {n_ja:'灼熱の緋', n_en:'Scorching Scarlet', d_ja:'緋色の塗料で範囲攻撃200〜280%＋敵の攻撃-5〜25%（2秒）。', d_en:'Scarlet paint AoE Atk 200–280% + enemy −5–25% Attack (2s).'},
      {n_ja:'溶けた金', n_en:'Molten Gold', d_ja:'攻撃100〜140%＋腐食で毎0.5秒2〜6%（4秒）。', d_en:'Atk 100–140% + Corrosion Atk 2–6% every 0.5s for 4s.'},
      {n_ja:'真夜中の青', n_en:'Midnight Blue', d_ja:'通常攻撃で対象の攻撃速度-10〜30%（2秒）。', d_en:'Normal attacks reduce target Attack Speed by 10–30% (2s).'}
    ],
    exped: [
      {n_ja:'腐食の色', n_en:'Corrosive Color', d_ja:'敵全体の防御-5〜25%。', d_en:'−5–25% Defense for all enemy troops.'},
      {n_ja:'暁の画布', n_en:'Dawn Canvas', d_ja:'全部隊の攻撃+3〜15%・防御+2〜10%。', d_en:'+3–15% Attack and +2–10% Defense for all troops.'},
      {n_ja:'壮麗な情景', n_en:'Splendid Scene', d_ja:'歩兵の被ダメ-5〜25%・槍兵の与ダメ+5〜25%。', d_en:'Infantry −5–25% damage taken; Lancers +5–25% damage dealt.'}
    ]
  },
  viveca: {
    explore: [
      {n_ja:'終焉の夜想曲', n_en:'Evernight Finale', d_ja:'単体に攻撃200〜280%＋出血で毎0.5秒7〜15%（2秒）。', d_en:'Single-target Atk 200–280% + Bleed Atk 7–15% every 0.5s for 2s.'},
      {n_ja:'闇の末裔', n_en:'Dark Scion', d_ja:'カラスで対象を6〜10秒マーク、被ダメ+5〜25%＋通常攻撃と終焉が対象に集中。', d_en:'Raven marks a target 6–10s: +5–25% damage taken, locks her attacks and finale onto it.'},
      {n_ja:'極寒の挽歌', n_en:'Frigid Dirge', d_ja:'敵英雄撃破毎に攻撃+3〜15%（戦闘終了まで）。', d_en:'+3–15% Attack per enemy hero defeated (until battle end).'}
    ],
    exped: [
      {n_ja:'夜の軍団', n_en:'Nightfall Legion', d_ja:'全部隊の攻撃+5〜25%。', d_en:'+5–25% Attack for all allied troops.'},
      {n_ja:'影の世界', n_en:'Shadow World', d_ja:'弓兵が20%の確率で全敵へ+20〜100%追加ダメージ。', d_en:'Marksmen 20% chance to deal +20–100% extra damage to all enemy troops.'},
      {n_ja:'霧の子ら', n_en:'Children of the Mist', d_ja:'歩兵の被ダメ-2〜10%・弓兵の与ダメ+2〜10%。', d_en:'Infantry −2–10% damage taken; Marksmen +2–10% damage dealt.'}
    ]
  },
  seigel: {
    explore: [
      {n_ja:'棘の守護', n_en:'Spike Guard', d_ja:'鎧の棘を展開（5秒）、防御+5〜25%＋被ダメの5〜25%を反射。', d_en:'Extends armor spikes (5s): +5–25% Defense + reflects 5–25% of damage.'},
      {n_ja:'月の槍', n_en:'Spear of the Moon', d_ja:'直線範囲に攻撃40〜60%＋扇状範囲に攻撃40〜60%。', d_en:'Line AoE Atk 40–60% then a fan-arc AoE Atk 40–60%.'},
      {n_ja:'呪われた守り', n_en:'Cursed Protection', d_ja:'被ダメ-4〜20%＋開幕6〜10秒は状態異常無効。', d_en:'−4–20% damage taken + immune to debuffs for the first 6–10s.'}
    ],
    exped: [
      {n_ja:'夜の鎧', n_en:'Armor of Night', d_ja:'全部隊のHP+5〜25%。', d_en:'+5–25% Health for all troops.'},
      {n_ja:'夜の守備', n_en:"Night's Defense", d_ja:'自軍歩兵の攻撃-4〜20%だが敵の弓兵・槍兵の攻撃-7〜35%。', d_en:'Own Infantry −4–20% Attack, but enemy Marksmen/Lancers −7–35% Attack.'},
      {n_ja:'永遠の先鋒', n_en:'Vanguard of Eternity', d_ja:'歩兵の通常被ダメ-5〜25%・スキル被ダメ-6〜30%。', d_en:'Infantry −5–25% normal-attack and −6–30% skill damage taken.'}
    ]
  },
  ursar: {
    explore: [
      {n_ja:'祖霊のトーテム', n_en:'Ancestral Totem', d_ja:'祖霊を召喚し攻撃速度+20〜60%・回避+10〜30%・移動速度+25%（5秒）。', d_en:'Summons a spirit: +20–60% Attack Speed, +10–30% Dodge, +25% Move Speed (5s).'},
      {n_ja:'風の穂先', n_en:'Wind Tip', d_ja:'槍を投げて攻撃100〜140%＋2秒スタン。', d_en:'Spear throw: Atk 100–140% + 2s stun.'},
      {n_ja:'風断ちの舞', n_en:'Dance of the Windbreakers', d_ja:'自身の攻撃速度+10〜30%。', d_en:'+10–30% own Attack Speed.'}
    ],
    exped: [
      {n_ja:'森の胞子', n_en:'Forest Spores', d_ja:'敵部隊の攻撃-5〜25%。', d_en:'−5–25% Attack for all enemy troops.'},
      {n_ja:'古の角笛', n_en:'Horn of the Ancients', d_ja:'槍兵・弓兵の殺傷+6〜30%（2ターン）＋敵の防御-6〜30%（1ターン）。', d_en:'Lancers/Marksmen +6–30% Lethality (2 turns) + enemy −6–30% Defense (1 turn).'},
      {n_ja:'毒の穂先', n_en:'Poison Tips', d_ja:'槍兵が2回毎に+20〜100%ダメージ＋対象の被ダメ+5〜25%（1ターン）。', d_en:'Lancers +20–100% damage every 2 attacks + target +5–25% damage taken (1 turn).'}
    ]
  },
  aisling: {
    explore: [
      {n_ja:'野生の成長', n_en:'Wild Growth', d_ja:'魔法の種で周囲の敵に攻撃200〜280%＋2秒スタン。', d_en:'Enchanted seed: AoE Atk 200–280% to nearby enemies + 2s stun.'},
      {n_ja:'豊穣の果実', n_en:'Fruits of Plenty', d_ja:'最も低HPの味方英雄を攻撃120〜200%分回復。', d_en:'Heals the lowest-HP ally hero by Atk 120–200%.'},
      {n_ja:'刃の石', n_en:'Bladestones', d_ja:'通常攻撃25%で攻撃100〜140%の追加ダメージ。', d_en:'Normal attacks 25% chance to deal +Atk 100–140% extra damage.'}
    ],
    exped: [
      {n_ja:'祖先の歌', n_en:'Songs of the Ancestors', d_ja:'部隊の与ダメージ+4〜20%。', d_en:'+4–20% damage dealt for troops.'},
      {n_ja:'岩の嵐', n_en:'Rock Storm', d_ja:'弓兵が3ターン毎に+30〜150%ダメージ＋疲弊した敵の与ダメ-6〜30%（1ターン）。', d_en:'Marksmen +30–150% damage every 3 turns + exhausted enemies −6–30% damage (1 turn).'},
      {n_ja:'森の怒り', n_en:'Forest Fury', d_ja:'弓兵が3ターン毎に全敵へ+8〜40%追加ダメージ。', d_en:'Marksmen +8–40% extra damage to all enemy troops every 3 turns.'}
    ]
  }
};
