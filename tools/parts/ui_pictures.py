"""The round pictures for the screens: the six strength badges and the six homelands (Gemini, 2026-11-08).
Each is cut out along its outer black ring, not by its background, since one (the spell book) came on parchment.
Also: each badge with an orange centre for Roni's team (badge_<k>_orange; the teal ones are Neta's), and each
homeland's scene, cut from inside its frame, as the background of the finished hero (scene_<k>.jpg).
python3 ui_pictures.py <repo root>   (run from the folder holding parts/raw/*, like the other scripts)"""
import sys, os, numpy as np
from PIL import Image
from recolor import rgb2hsv, hsv2rgb

def to_orange(a):
    """The badge's teal (its centre, rings and the spell book's letters) in Roni's orange, keeping the wash's light and dark."""
    h, s, v = rgb2hsv(a / 255); lum = (a / 255) @ [0.299, 0.587, 0.114]
    m = (h > 160) & (h < 205) & (s > 0.35) & (lum < 0.75)
    ratio = lum / lum[m].mean()
    th, ts, tv = 24.0, 0.78, 0.88                      # the shield's orange pieces
    new = hsv2rgb(np.full_like(lum, th), np.full_like(lum, ts), np.clip(tv * (1 + (ratio - 1) * 0.8), 0, 1))
    w = (np.clip((ratio - 0.35) / 0.3, 0, 1) * m)[..., None]   # the black ink stays black
    return a * (1 - w) + new * 255 * w
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
    if n.startswith("icon_"):
        o = Image.fromarray(np.dstack([to_orange(a), alpha * 255]).astype(np.uint8), "RGBA")
        o.crop(box).resize((SIZE, SIZE), Image.LANCZOS).save(os.path.join(OUT, name.replace(".webp", "_orange.webp")), "WEBP", quality=88)
    else:   # the scene inside the frame (inner radius about 325), as an upright rectangle, 5:6
        r = 262 if n == "home_mountains" else 325   # the mountains sit inside an extra blue band
        w, hh = 2 * r * 0.648, 2 * r * 0.762
        scene = im.crop((int(cx - w / 2), int(cy - hh / 2), int(cx + w / 2), int(cy + hh / 2)))
        scene.resize((540, 636), Image.LANCZOS).save(os.path.join(OUT, n.replace("home_", "scene_") + ".jpg"), quality=86)
        # and wide, for the hero card's window (1020 x 830): the widest rectangle of that shape inside the frame
        w, hh = 2 * r * 0.7757, 2 * r * 0.6311
        wide = im.crop((int(cx - w / 2), int(cy - hh / 2), int(cx + w / 2), int(cy + hh / 2)))
        wide.resize((1020, 830), Image.LANCZOS).save(os.path.join(OUT, n.replace("home_", "scene_wide_") + ".jpg"), quality=86)
    print(name, "centre", round(cx), round(cy), "radius", round(r))
