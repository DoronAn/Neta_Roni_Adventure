# Recolouring for the three classes whose garment isn't one clear hue.
import numpy as np
from PIL import Image
from recolor import rgb2hsv, hsv2rgb, TARGETS

def _apply(img, mask, target, mode):
    a = np.asarray(img).astype(float) / 255
    rgb, al = a[..., :3], a[..., 3:]
    h, s, v = rgb2hsv(rgb)
    t = TARGETS[target]
    if t is None:                      # black
        h2, s2, v2 = h, s * 0.25, v * 0.42
        if mode in ("tint", "tintstrong"): v2 = v * 0.35
    elif mode == "tintstrong":         # dark cloth: a strong dye
        h2 = np.full_like(h, t); s2 = np.full_like(s, 0.62); v2 = np.minimum(1, v * 1.25 + 0.05)
    elif mode == "tint":               # colourless cloth (white, grey): add the colour
        h2 = np.full_like(h, t); s2 = np.clip(0.18 + s * 0.6 + (1 - v) * 0.35, 0, 0.6); v2 = v * 0.9
    else:                              # coloured cloth: swap the hue
        h2 = np.full_like(h, t) + ((h - h.mean()) * 0)
        s2, v2 = s, v
        if target in ("pink", "purple", "blue"): s2 = np.minimum(1, s * 1.1)
        if target == "green": s2 = s * 0.8
    out = np.where(mask[..., None], hsv2rgb(h2, s2, v2), rgb)
    return Image.fromarray((np.dstack([out, al]) * 255).clip(0, 255).astype(np.uint8), "RGBA")

def masks(img, body):
    a = np.asarray(img).astype(float) / 255
    h, s, v = rgb2hsv(a[..., :3]); al = a[..., 3] > 0.5
    H, W = h.shape; yy, xx = np.mgrid[0:H, 0:W]
    if body == "druid":     # the olive robe and its green leaves
        return al & (h >= 41) & (h <= 58) & (s >= 0.2), "swap"
    if body == "cleric":    # the white robe and cape: light and nearly colourless, below the neck
        return al & (s < 0.22) & (v > 0.62) & (yy > 140), "tint"
    if body == "barbarian": # the dark undershirt: low saturation, dark, and not the fur
        return al & (s < 0.32) & (v < 0.55) & (v > 0.12) & (yy > 140) & (xx > 300), "tintstrong"

def recolor2(img, body, target):
    m, mode = masks(img, body)
    return _apply(img, m, target, mode)
