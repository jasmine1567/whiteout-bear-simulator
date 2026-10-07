#!/usr/bin/env python3
"""英雄アイコン画像を取り込む。

使い方:
  1. _hero_src/ フォルダに画像を入れる（png / jpg / webp）。ファイル名は次のどれでもよい:
       英雄ID（例 jeronimo.png）／日本語名（例 ジェロニモ.png）／英語名（例 Jeronimo.png）
  2. python3 _build_hero_images.py   （初回だけ: pip install pillow）
  3. assets/heroes/<ID>.webp と assets/hero-img.js の一覧が更新される。あとはいつも通りアップロード。

画像は中央を正方形に切り抜いて 144px の WebP にする。_hero_src/ は「_」始まりなので公開されない。
"""
import hashlib, json, os, re, subprocess, sys, unicodedata
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, OUT, JS = os.path.join(ROOT, "_hero_src"), os.path.join(ROOT, "assets", "heroes"), os.path.join(ROOT, "assets", "hero-img.js")
SIZE = 144

def heroes():
    code = ("const fs=require('fs'),vm=require('vm');const sb={window:{}};vm.createContext(sb);"
            "vm.runInContext(fs.readFileSync('assets/heroes.js','utf8'),sb);"
            "console.log(JSON.stringify(sb.window.WOS_HEROES.map(h=>({id:h.id,name:h.name,en:(sb.window.WOS_HERO_EN&&sb.window.WOS_HERO_EN[h.id])||''}))))")
    return json.loads(subprocess.run(["node", "-e", code], cwd=ROOT, capture_output=True, text=True, check=True).stdout)

def norm(s):
    return re.sub(r"[\s_\-・.]+", "", unicodedata.normalize("NFKC", s)).lower()

def main():
    hs = heroes(); key = {}
    for h in hs:
        for k in (h["id"], h["name"], h["en"]):
            if k: key[norm(k)] = h["id"]
    os.makedirs(OUT, exist_ok=True)
    unmatched = []
    for fn in sorted(os.listdir(SRC)) if os.path.isdir(SRC) else []:
        stem, ext = os.path.splitext(fn)
        if ext.lower() not in (".png", ".jpg", ".jpeg", ".webp"): continue
        hid = key.get(norm(stem))
        if not hid: unmatched.append(fn); continue
        im = Image.open(os.path.join(SRC, fn)).convert("RGBA")
        w, h = im.size; s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((SIZE, SIZE), Image.LANCZOS)
        im.save(os.path.join(OUT, hid + ".webp"), "WEBP", quality=88, method=6)
    man = {}
    for h in hs:
        p = os.path.join(OUT, h["id"] + ".webp")
        if os.path.exists(p): man[h["id"]] = hashlib.md5(open(p, "rb").read()).hexdigest()[:6]
    js = open(JS, encoding="utf-8").read()
    js2 = re.sub(r"/\*HERO_IMGS\*/.*?/\*END\*/", lambda m: "/*HERO_IMGS*/" + json.dumps(man, separators=(",", ":")) + "/*END*/", js, flags=re.S)
    open(JS, "w", encoding="utf-8").write(js2)
    missing = [h["name"] for h in hs if h["id"] not in man]
    print(f"画像あり: {len(man)} / {len(hs)} 体")
    if missing: print("画像なし（兵種アイコンで表示）:", "、".join(missing))
    if unmatched: print("英雄名と一致しなかったファイル:", ", ".join(unmatched))

if __name__ == "__main__":
    main()
