#!/usr/bin/env python3
"""Make web-ready WebP copies of the product photos in Tea/.

For every JPEG/PNG in Tea/ this writes:
  Tea/webp/<name>-card.webp   600x450 (4:3, centre-cropped) for product cards
  Tea/webp/<name>-large.webp  up to 1000px wide, original aspect, for quick view

Originals are never modified or deleted. Requires Pillow:  pip install Pillow
Usage (from the project root):  python3 tools/optimize-images.py
"""
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path("Tea")
OUT = SRC / "webp"
CARD = (600, 450)
LARGE_MAX_W = 1000
TARGET_KB = 60      # card images
LARGE_TARGET_KB = 120


def save_webp(img, path, start_q=80, target_kb=TARGET_KB):
    q = start_q
    while True:
        img.save(path, "WEBP", quality=q, method=6)
        if path.stat().st_size <= target_kb * 1024 or q <= 50:
            return q
        q -= 5


def main():
    OUT.mkdir(exist_ok=True)
    for src in sorted(SRC.iterdir()):
        if src.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        card = ImageOps.fit(img, CARD, Image.LANCZOS, centering=(0.5, 0.5))
        cq = save_webp(card, OUT / f"{src.stem}-card.webp")
        large = img.copy()
        if large.width > LARGE_MAX_W:
            large = large.resize((LARGE_MAX_W, round(large.height * LARGE_MAX_W / large.width)), Image.LANCZOS)
        lq = save_webp(large, OUT / f"{src.stem}-large.webp", 82, LARGE_TARGET_KB)
        print(f"{src.name:60s} {src.stat().st_size // 1024:4d} KB -> card {(OUT / f'{src.stem}-card.webp').stat().st_size // 1024:3d} KB (q{cq}), "
              f"large {large.width}x{large.height} {(OUT / f'{src.stem}-large.webp').stat().st_size // 1024:3d} KB (q{lq})")


if __name__ == "__main__":
    main()
