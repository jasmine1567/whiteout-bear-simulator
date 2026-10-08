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

if __name__ == "__main__": main()
