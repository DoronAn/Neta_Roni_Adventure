"""Headwear in the hero's outfit colour. The target is the garment's own colour on the recoloured body
(median hue, saturation and brightness of the garment pixels), so the hat matches the outfit, including
'original', where it takes the body's drawn garment colour. Only the hat's main colour changes:
the cap's beret (band and feather stay), the wizard hat's cloth (stars stay), the crown's jewel (the gold
stays), the flower crown's red and blue blossoms (leaves and yellow flowers stay)."""
import json, os, numpy as np
from PIL import Image
from join import cutout
from recolor import rgb2hsv, hsv2rgb, recolor, GARMENT, in_range
from recolor2 import recolor2, masks

COLOURS = ["original", "red", "green", "blue", "purple", "pink", "black"]
CLASSES = ["fighter", "wizard", "ranger", "bard", "rogue", "paladin", "cleric", "druid", "barbarian"]

def garment_mask(img, cls):
    a = np.asarray(img).astype(float) / 255; h, s, v = rgb2hsv(a[..., :3]); al = a[..., 3] > 0.5
    if cls in GARMENT:
        lo, hi, smin = GARMENT[cls]; return al & in_range(h, lo, hi) & (s >= smin)
    return masks(img, cls)[0]

def garment_colour(cls, colour):
    body = cutout(f"body_{cls}.jpg"); m = garment_mask(body, cls)
    if colour != "original": body = recolor(body, cls, colour) if cls in GARMENT else recolor2(body, cls, colour)
    a = np.asarray(body).astype(float)[..., :3] / 255; h, s, v = rgb2hsv(a)
    h, s, v = h[m], s[m], v[m]
    w = s + 1e-6; ang = np.radians(h)
    hm = np.degrees(np.arctan2((np.sin(ang) * w).sum(), (np.cos(ang) * w).sum())) % 360
    return [float(hm), float(np.median(s)), float(np.median(v))]

def garment_colours(path="garment_colours.json"):
    if os.path.exists(path): return json.load(open(path))
    out = {f"{c}/{k}": garment_colour(c, k) for c in CLASSES for k in COLOURS}
    json.dump(out, open(path, "w"), indent=1); return out

# The part of each hat that takes the colour: (hue ranges, minimum saturation).
HAT_PART = {
    "cap":     ([(330, 25)], 0.30),
    "wizard":  ([(180, 245)], 0.22),
    "crown":   ([(180, 245)], 0.22),
    "flowers": ([(330, 25), (185, 245)], 0.30),
}

SHINE = ("crown",)   # the crown's jewel: the outfit's hue at the jewel's own brightness

def recolor_hat(img, hat, target):
    th, ts, tv = target
    a = np.asarray(img).astype(float) / 255; rgb, al = a[..., :3], a[..., 3:]
    h, s, v = rgb2hsv(rgb); ranges, smin = HAT_PART[hat]
    m = np.zeros(h.shape, bool)
    for lo, hi in ranges: m |= in_range(h, lo, hi)
    m &= (s >= smin) & (al[..., 0] > 0)
    # each range is matched separately, so a red blossom and a blue one both land on the target
    h2, s2, v2 = h.copy(), s.copy(), v.copy()
    for lo, hi in ranges:
        mm = m & in_range(h, lo, hi)
        if not mm.any(): continue
        hs, ss, vs = h[mm], s[mm], v[mm]
        ang = np.radians(hs); hm = np.degrees(np.arctan2(np.sin(ang).mean(), np.cos(ang).mean())) % 360
        dh = ((hs - hm + 180) % 360) - 180
        h2[mm] = (th + dh * 0.5) % 360
        if hat in SHINE and not (ts < 0.2 and tv < 0.4):     # a jewel keeps its own shine, unless the outfit is black
            s2[mm] = np.clip(ss * max(ts, 0.4) / max(np.median(ss), 1e-3), 0, 1)
        else:
            s2[mm] = np.clip(ss * ts / max(np.median(ss), 1e-3), 0, 1)
            v2[mm] = np.clip(vs * tv / max(np.median(vs), 1e-3), 0, 1)
    out = np.where(m[..., None], hsv2rgb(h2, s2, v2), rgb)
    return Image.fromarray((np.dstack([out, al]) * 255).clip(0, 255).astype(np.uint8), "RGBA")
