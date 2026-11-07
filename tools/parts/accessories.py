import json, numpy as np
from PIL import Image
from join import cutout

def cutout_all_white(path, thresh=232):
    """For parts with enclosed background (the flower ring): every near-white pixel goes, not just the outer ones."""
    im = cutout(path); a = np.asarray(im).copy()
    a[..., 3][a[..., :3].min(axis=2) >= thresh] = 0
    return Image.fromarray(a, "RGBA")

def trim(im): return im.crop(im.getbbox())

PAD = 600     # room above the head for tall hats
KEEP_TOP = ("tabaxi", "dragonborn")   # cat ears and horns stay visible beside a hat

# Headwear. base: where the hat's bottom sits, as a fraction of the way from skull top to chin.
# fit: the hat's width as a multiple of the head's width at that row. hide: the hair above the hat's
# bottom edge is under the hat, so it is removed. edge: which part of the picture is the hat's bottom
# (for the cap, the beret: the left 81% of the picture; the feather is on the right).
HATS = {
    "crown":   dict(base=0.15, fit=0.80),
    "wizard":  dict(base=0.24, fit=0.90, squash=0.62, hide=True),
    "cap":     dict(base=0.18, fit=1.22, hide=True, anchor=0.41, edge=(0.0, 0.81), tilt=14, dy=0, dx=-170),
    "flowers": dict(base=0.21, fit=1.14, squash=0.95, ring=True),
}
# Per-head corrections, checked one by one on the review sheets: dy moves the hat down (head px), fit scales it.
FIX = {
    ("crown", "tabaxi_m"): dict(fit=0.7), ("crown", "tabaxi_f"): dict(fit=0.7),
    ("crown", "dragonborn_m"): dict(fit=0.72), ("crown", "dragonborn_f"): dict(fit=0.72),
    ("wizard", "tabaxi_m"): dict(fit=0.95), ("wizard", "tabaxi_f"): dict(fit=0.9),
    ("wizard", "dragonborn_m"): dict(fit=0.85), ("wizard", "dragonborn_f"): dict(fit=0.85),
    ("cap", "tabaxi_m"): dict(fit=1.0, tilt=0, dy=0, dx=0), ("cap", "tabaxi_f"): dict(fit=1.0, tilt=0, dy=0, dx=0),
    ("cap", "dragonborn_m"): dict(tilt=0, dy=0, dx=0), ("cap", "dragonborn_f"): dict(tilt=0, dy=0, dx=0),
    ("flowers", "tabaxi_m"): dict(fit=0.66, dy=-25, squash=0.5, tilt=32, dx=-130),
    ("flowers", "tabaxi_f"): dict(fit=0.66, dy=14, squash=0.5, tilt=32, dx=-140),
}

def load_hat(name):
    im = cutout_all_white(f"hat_{name}.jpg") if HATS[name].get("ring") else cutout(f"hat_{name}.jpg")
    return trim(im)

def head_width(head_img, row):
    a = np.asarray(head_img)[..., 3] > 0
    xs = np.where(a[max(0, min(row, a.shape[0] - 1))])[0]
    return int(xs.min()), int(xs.max())

def head_with_hat(head_img, head_name, hat, hat_img, chins, skulls):
    """The head with the hat on, on a canvas PAD px taller at the top (add PAD to the chin row)."""
    p = dict(HATS[hat]); p.update(FIX.get((hat, head_name), {}))
    sk = skulls[head_name]; chin = chins[head_name]
    base = int(sk["top"] + p["base"] * (chin - sk["top"])) + p.get("dy", 0)
    x0, x1 = head_width(head_img, base)
    w = int((x1 - x0) * HATS[hat]["fit"] * FIX.get((hat, head_name), {}).get("fit", 1))
    s = w / hat_img.width
    hi = hat_img.resize((w, max(1, int(hat_img.height * s * p.get("squash", 1)))), Image.LANCZOS)
    cx = (x0 + x1) // 2 if not head_name.startswith(KEEP_TOP) else sk["cx"]
    x = cx - int(w * p.get("anchor", 0.5)) + p.get("dx", 0)
    out = Image.new("RGBA", (head_img.width, head_img.height + PAD), (0, 0, 0, 0))
    head = head_img
    if p.get("ring"):       # the far half of the ring goes behind the head, the near half in front
        y = PAD + base - hi.height // 2
        a = np.asarray(hi)
        back = a.copy(); back[hi.height // 2:, :, 3] = 0
        front = a.copy(); front[:hi.height // 2, :, 3] = 0
        back, front = Image.fromarray(back, "RGBA"), Image.fromarray(front, "RGBA")
        if p.get("tilt"):
            back = back.rotate(p["tilt"], resample=Image.BICUBIC, expand=True)
            front = front.rotate(p["tilt"], resample=Image.BICUBIC, expand=True)
            x -= (back.width - hi.width) // 2; y -= (back.height - hi.height) // 2
        out.alpha_composite(back, (x, y)); out.alpha_composite(head, (0, PAD))
        out.alpha_composite(front, (x, y))
        return out
    y = PAD + base - hi.height
    if p.get("tilt"):
        r = hi.rotate(p["tilt"], resample=Image.BICUBIC, expand=True)
        x -= (r.width - hi.width) // 2; y -= (r.height - hi.height) // 2; hi = r; w = hi.width
    if p.get("hide") and not head_name.startswith(KEEP_TOP):
        ha = np.asarray(hi)[..., 3] > 0
        e0, e1 = p.get("edge", (0.0, 1.0)); c0, c1 = int(e0 * w), int(e1 * w)
        bottoms = {c: np.where(ha[:, c])[0].max() for c in range(c0, c1) if ha[:, c].any()}
        cols = sorted(bottoms)
        hd = np.asarray(head).copy()
        for X in range(hd.shape[1]):
            c = X - x
            if c in bottoms: yb = bottoms[c]; lift = 28
            elif c < cols[0]: yb = bottoms[cols[0]]; lift = 0
            elif c > cols[-1]: yb = bottoms[cols[-1]]; lift = 0
            else: continue
            cut = y + yb - lift - PAD        # in head coordinates: under the hat, a little above its bottom edge
            if cut > 0: hd[:cut, X, 3] = 0
        head = Image.fromarray(hd, "RGBA")
    out.alpha_composite(head, (0, PAD)); out.alpha_composite(hi, (x, y))
    return out

PET_H = 380
PET_SCALE = {"dragon": 1.2, "fox": 1.2}
def load_pet(name):
    im = trim(cutout(f"pet_{name}.jpg"))
    s = PET_H * PET_SCALE.get(name, 1) / max(im.height, im.width * 0.85)
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)

# Heads that sit lower on the body, in body pixels (Doron, 2026-11-07: the dragonborn sat too high).
HEAD_DROP = {"dragonborn_m": 26, "dragonborn_f": 26}
