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
      {n_ja:'報復本能', n_en:'Rage Response', d_ja:'被弾時10%で攻撃+4〜12%（3秒・最大5重）。', d_en:'On hit, 10% chance: +4–12% Atk for 3s (max 5 stacks).'}
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
  }
};
