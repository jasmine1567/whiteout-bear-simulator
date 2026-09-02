# 世代ページの解説文（手書き）

`gen-01.md` 〜 `gen-16.md` を置くと、`python3 _build_stats.py` 実行時に
各世代ページの「この世代の見どころ」に流し込まれます。**無い世代は theory.json から自動生成した文で埋まります。**

## 書き方
- 空行で段落。`**太字**` が使えます。それ以外のMarkdown記法は非対応。
- 英語版を付ける場合は `---en---` の行で区切って、その下に英語を書きます。無ければ英語ページは自動文になります。
- 1ページ200〜400字が目安。数字から読み取れることを一言添えるだけで十分です。

## 例（gen-16.md）
```
第16世代環境では、石油王・中課金とも盾は依然として**ジェロニモ**が理論最適です。
無課金・微課金は課金限定のジェロニモが使えないため、盾は**ヘクトー(G5)**で止めるのが最も効率的で、
これは実際の採用率でもジェロニモに次ぐ人気と一致しています。

弓はこの世代のルーレット英雄**アシュリン**が全課金帯で最適。乗り換えるべき枠は弓だけです。

---en---
In Gen 16, **Jeronimo** remains the theoretical best infantry pick for mid spenders and whales.
F2P players cannot obtain him, so **Hector (G5)** is the most efficient stop — matching his real pick rate.

**Aisling**, this generation's roulette hero, is the best marksman for every tier. The only slot worth swapping is MKS.
```
