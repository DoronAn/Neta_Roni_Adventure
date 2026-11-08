"""The round pictures for the screens: the six strength badges and the six homelands (Gemini, 2026-11-08).
Each is cut out along its outer black ring, not by its background, since one (the spell book) came on parchment.
python3 ui_pictures.py <repo root>   (run from the folder holding parts/raw/*, like the other scripts)"""
import sys, os, numpy as np
from PIL import Image
ROOT = sys.argv[1]; OUT = os.path.join(ROOT, "ui"); SIZE = 288
NAMES = [f"icon_{k}" for k in ("str", "dex", "con", "int", "wis", "cha")] + \
        [f"home_{k}" for k in ("mountains", "forest", "sea", "desert", "valley", "caves")]
for n in NAMES:
    im = Image.open(f"{n}.jpg").convert("RGB"); a = np.asarray(im).astype(float)
    dark = (a @ [0.299, 0.587, 0.114]) < 90                     # the black ring and the drawing's lines
    rows = np.where(dark.sum(1) > 12)[0]; cols = np.where(dark.sum(0) > 12)[0]
    y0, y1, x0, x1 = rows.min(), rows.max(), cols.min(), cols.max()
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) / 2
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    alpha = np.clip(r - np.hypot(xx - cx, yy - cy) + 0.5, 0, 1)   # a soft one-pixel edge
    out = Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), "RGBA")
    box = (int(cx - r - 1), int(cy - r - 1), int(cx + r + 2), int(cy + r + 2))
    name = n.replace("icon_", "badge_") + ".webp"
    out.crop(box).resize((SIZE, SIZE), Image.LANCZOS).save(os.path.join(OUT, name), "WEBP", quality=88)
    print(name, "centre", round(cx), round(cy), "radius", round(r))
