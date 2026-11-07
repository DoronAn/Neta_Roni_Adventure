import numpy as np
from PIL import Image

def rgb2hsv(rgb):
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dd = np.where(d == 0, 1, d)
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    h = np.where(d == 0, 0, h)
    s = np.where(mx == 0, 0, d / np.where(mx == 0, 1, mx))
    return h, s, mx

def hsv2rgb(h, s, v):
    c = v * s; hp = (h % 360) / 60; x = c * (1 - np.abs(hp % 2 - 1)); m = v - c
    z = np.zeros_like(h)
    conds = [(hp < 1, c, x, z), (hp < 2, x, c, z), (hp < 3, z, c, x), (hp < 4, z, x, c), (hp < 5, x, z, c), (hp <= 6, c, z, x)]
    r = np.select([k[0] for k in conds], [k[1] for k in conds]); g = np.select([k[0] for k in conds], [k[2] for k in conds])
    b = np.select([k[0] for k in conds], [k[3] for k in conds])
    return np.stack([r + m, g + m, b + m], -1)

# Each recolourable body: the garment's hue range (degrees, may wrap), the minimum saturation that counts as garment.
GARMENT = {
    "fighter": (340, 18, 0.35),
    "wizard":  (185, 240, 0.25),
    "ranger":  (75, 135, 0.25),
    "bard":    (265, 315, 0.25),
    "rogue":   (110, 190, 0.10),
    "paladin": (190, 240, 0.25),
}
BOOST = {"ranger": 1.3, "rogue": 1.9}
TARGETS = {"red": 2, "orange": 26, "yellow": 48, "green": 120, "blue": 215, "purple": 280, "pink": 330, "black": None}

def in_range(h, lo, hi):
    return (h >= lo) & (h <= hi) if lo <= hi else (h >= lo) | (h <= hi)

def recolor(img, body, target):
    lo, hi, smin = GARMENT[body]
    a = np.asarray(img).astype(float) / 255
    rgb, al = a[..., :3], a[..., 3:]
    h, s, v = rgb2hsv(rgb)
    mask = in_range(h, lo, hi) & (s >= smin)
    centre = (lo + ((hi - lo) % 360) / 2) % 360
    if TARGETS[target] is None:          # black: drain the colour and darken
        s2, v2, h2 = s * 0.25, v * 0.42, h
    else:
        h2 = (TARGETS[target] + ((h - centre + 180) % 360 - 180) * 0.5) % 360
        s2, v2 = np.minimum(1, s * BOOST.get(body, 1)), v
        if target in ("yellow", "orange"): v2 = v + 0.35 * (1 - v); s2 = s2 * 0.9
        if target == "green": s2 = s2 * 0.75; v2 = v * 0.85
        if target in ("blue", "purple") and body == "fighter": v2 = v * 0.85
    out = np.where(mask[..., None], hsv2rgb(h2, s2, v2), rgb)
    return Image.fromarray((np.dstack([out, al]) * 255).clip(0, 255).astype(np.uint8), "RGBA")
