#!/usr/bin/env python3
"""解説用の画像（グレッグ・シリル・シリルのスキルアイコン）を _img_src/ から assets/img/ に切り出す。
使い方: python3 _build_extra_images.py   （_img_src/ は「_」始まりなので公開されない）"""
import os
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(ROOT, "_img_src"), os.path.join(ROOT, "assets", "img")

def rounded(im, r):
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), r, fill=255)
    im = im.convert("RGBA"); im.putalpha(m); return im

def save(im, name, q=86):
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6); print(name, im.size, os.path.getsize(os.path.join(OUT, name + ".webp")))

def main():
    os.makedirs(OUT, exist_ok=True)
    g = Image.open(os.path.join(SRC, "greg.png")).convert("RGBA")
    g = g.crop(g.getbbox())
    save(g.resize((round(g.width * 620 / g.height), 620), Image.LANCZOS), "greg")
    b = g.crop((0, 0, g.width, 560)); save(b.resize((round(b.width * 300 / b.height), 300), Image.LANCZOS), "greg-bust")
    c = Image.open(os.path.join(SRC, "cyril.jpg")).convert("RGB")
    save(c.crop((250, 78, 700, 548)).resize((450, 470), Image.LANCZOS), "cyril", 84)
    save(c.crop((296, 92, 486, 282)).resize((160, 160), Image.LANCZOS), "cyril-face", 84)
    boxes = {"cyril-talent": (76, 163, 189, 276), "cyril-s1": (165, 555, 268, 658), "cyril-s2": (310, 555, 413, 658), "cyril-s3": (457, 555, 560, 658), "cyril-s4": (602, 555, 707, 660)}
    for name, bx in boxes.items():
        im = c.crop(bx).resize((112, 112), Image.LANCZOS); save(rounded(im, 22), name, 88)

def troop_icons():
    """兵種アイコン（盾・槍・弓）。編成画面のスクショから切り出し、バッジの形で抜く"""
    src = os.path.join(SRC, "troop-icons.png")
    if not os.path.exists(src): return
    im = Image.open(src).convert("RGB"); K = 5
    for name, (x0, y0, x1, y1) in {"cls-inf": (4, 10, 31, 40), "cls-lan": (189, 9, 217, 39), "cls-mks": (374, 9, 402, 39)}.items():
        c = im.crop((x0, y0, x1, y1)); w, h = c.size
        c = c.resize((w * K, h * K), Image.LANCZOS)
        m = Image.new("L", c.size, 0); d = ImageDraw.Draw(m); i = int(1.2 * K)
        d.rounded_rectangle((i, i, w * K - i, int(h * K * 0.72)), int(7 * K), fill=255)          # 上側: 角丸の四角
        d.ellipse((i, int(h * K * 0.22), w * K - i, h * K - i), fill=255)                         # 下側: 丸くすぼまる
        c = c.convert("RGBA"); c.putalpha(m)
        side = max(c.size); sq = Image.new("RGBA", (side, side), (0, 0, 0, 0)); sq.paste(c, ((side - c.width) // 2, (side - c.height) // 2), c)
        save(sq.resize((96, 96), Image.LANCZOS), name, 90)

if __name__ == "__main__": main(); troop_icons()

# ---- 記事の見出し画像（キービジュアル）。_img_src/kv/<名前>.jpg → assets/kv/<名前>.webp（横長 2:1）----
KV_FOCUS = {"welcome": .27, "foundry": .46, "board": .40, "raiders": .36, "supplies": .42, "treasure": .22, "rocket": .36, "charge": .42, "heroes": .45,
            "feast": .38, "ship": .27, "mixing": .27, "castle": .52, "doctor": .30, "bear": .33, "shield": .33, "miners": .38, "flame": .36, "builder": .33, "training": .36}
def key_visuals():
    src = os.path.join(SRC, "kv"); out = os.path.join(ROOT, "assets", "kv")
    if not os.path.isdir(src): return
    os.makedirs(out, exist_ok=True)
    for fn in sorted(os.listdir(src)):
        name = os.path.splitext(fn)[0]
        im = Image.open(os.path.join(src, fn)).convert("RGB")
        m = round(im.width * 0.022); im = im.crop((m, m, im.width - m, im.height - m))     # 白いふちを落とす
        h = im.width // 2; cy = KV_FOCUS.get(name, .4) * im.height
        top = int(max(0, min(im.height - h, cy - h / 2)))
        b = im.crop((0, top, im.width, top + h)).resize((1000, 500), Image.LANCZOS)
        b.save(os.path.join(out, name + ".webp"), "WEBP", quality=80, method=6)
if __name__ == "__main__": key_visuals()
