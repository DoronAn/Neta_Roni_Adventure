"""Review sheets for the relief pictures (dev tool): every look, lit, one sheet per headwear (108 looks: 6 species x
2 genders x 9 classes), to catch the depth model misreading a picture. The composition follows relief.js (the hero on
a plain field, engraved strokes) at the pictures' own resolution; the light has no cast shadows, for speed.
  python3 tools/parts/relief_review.py <repo root> <out dir>"""
import os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont

SPECIES = ["human", "elf", "dwarf", "dragonborn", "tabaxi", "fairy"]
CLASSES = ["fighter", "wizard", "rogue", "cleric", "ranger", "bard", "barbarian", "druid", "paladin"]
HATS = ["none", "crown", "wizard", "cap", "flowers"]
WIN, RELIEF, STEP, GROOVE = 46.0, 2.0, 0.6, 0.4


def lit(path, tile=220):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float64) / 255
    hn, g, m = a[..., 0] * 1.05, a[..., 1], a[..., 2] > 0.5
    z = np.where(m, np.maximum(STEP + (RELIEF - STEP) * hn - GROOVE * g, STEP * 0.6), 0.0)
    mm = WIN / z.shape[0]
    gy, gx = np.gradient(z, mm)
    n = np.dstack([-gx, -gy, np.ones_like(z)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array([-0.5, -0.45, 0.74]); L /= np.linalg.norm(L)
    k = 0.3 + 0.8 * np.clip((n * L).sum(2), 0, 1)
    img = np.clip(np.array([205, 160, 92])[None, None] * k[..., None], 0, 255).astype(np.uint8)
    return Image.fromarray(img).resize((tile, tile), Image.LANCZOS)


def main():
    root, out = sys.argv[1:3]
    os.makedirs(out, exist_ok=True)
    rel = os.path.join(root, "parts", "relief")
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
    except OSError:
        font = None
    T = 220
    for hat in HATS:
        rows = [(s, g) for s in SPECIES for g in ("m", "f")]
        S = Image.new("RGB", (len(CLASSES) * T, len(rows) * (T + 16)), (236, 229, 212))
        d = ImageDraw.Draw(S)
        missing = 0
        for r, (s, g) in enumerate(rows):
            for c, cls in enumerate(CLASSES):
                key = f"{s}_{g}_{cls}_{hat}"
                p = os.path.join(rel, f"{key}.webp")
                x, y = c * T, r * (T + 16)
                if os.path.exists(p):
                    S.paste(lit(p, T), (x, y))
                else:
                    missing += 1
                d.text((x + 4, y + T + 1), key, fill=(40, 40, 40), font=font)
        S.save(os.path.join(out, f"review_{hat}.jpg"), quality=85)
        print(hat, "missing", missing)


if __name__ == "__main__":
    main()
