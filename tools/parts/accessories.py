import json, math, numpy as np
from PIL import Image, ImageFilter
from join import cutout

def cutout_all_white(path, thresh=232):
    """For parts with enclosed background (the flower ring): every near-white pixel goes, not just the outer ones."""
    im = cutout(path); a = np.asarray(im).copy()
    a[..., 3][a[..., :3].min(axis=2) >= thresh] = 0
    return Image.fromarray(a, "RGBA")

def trim(im): return im.crop(im.getbbox())

PAD = 760     # room above the head for tall hats
KEEP_TOP = ("tabaxi", "dragonborn")   # cat ears and horns stay visible beside a hat

# Headwear. base: where the hat's bottom sits, as a fraction of the way from skull top to chin.
# fit: the hat's width as a multiple of the head's width at that row. hide: the hair above the hat's
# bottom edge is under the hat, so it is removed. edge: which part of the picture is the hat's bottom.
# The cap is the exception: it is placed by its band (cap_on, below), not by base and fit.
HATS = {
    "crown":   dict(base=0.15, fit=0.80),
    "wizard":  dict(base=0.24, fit=0.90, squash=0.62, hide=True),
    "cap":     dict(band=True, rL=0.27, rR=0.08, out=0.02, lift=24),   # placed by its band: see cap_on()
    "flowers": dict(base=0.21, fit=1.14, squash=0.95, ring=True),
}
# Per-head corrections, checked one by one on the review sheets: dy moves the hat down (head px), fit scales it.
FIX = {
    ("crown", "tabaxi_m"): dict(fit=0.7), ("crown", "tabaxi_f"): dict(fit=0.7),
    ("crown", "dragonborn_m"): dict(fit=0.72), ("crown", "dragonborn_f"): dict(fit=0.72),
    ("wizard", "tabaxi_m"): dict(fit=0.95), ("wizard", "tabaxi_f"): dict(fit=0.9),
    ("wizard", "dragonborn_m"): dict(fit=0.85), ("wizard", "dragonborn_f"): dict(fit=0.85),
    # Cat folk and dragon folk: the cap sits level between the ears or horns (centre: band row, band width as a
    # multiple of the head's width at 30%, shift right as a fraction of that width).
    ("cap", "tabaxi_m"): dict(centre=(0.18, 0.64)), ("cap", "tabaxi_f"): dict(centre=(0.18, 0.64)),
    ("cap", "dragonborn_m"): dict(centre=(0.15, 0.52, 0.05)), ("cap", "dragonborn_f"): dict(centre=(0.15, 0.52, 0.05)),
    # The widest heads: the band ends exactly on the outline, so the beret's puff stays on the canvas.
    ("cap", "dwarf_f"): dict(out=0.0), ("cap", "elf_f"): dict(out=0.0),
    ("flowers", "tabaxi_m"): dict(fit=0.66, dy=-25, squash=0.5, tilt=32, dx=-130),
    ("flowers", "tabaxi_f"): dict(fit=0.66, dy=14, squash=0.5, tilt=32, dx=-140),
}

def defringe(im, px=2):
    """Shave the light anti-aliased rim the white background leaves around the outline."""
    r, g, b, al = im.split()
    for _ in range(px): al = al.filter(ImageFilter.MinFilter(3))
    return Image.merge("RGBA", (r, g, b, al))

def load_hat(name):
    im = cutout_all_white(f"hat_{name}.jpg") if HATS[name].get("ring") else cutout(f"hat_{name}.jpg")
    im = trim(im)
    return defringe(im) if HATS[name].get("band") else im

# The cap is placed by its band (the bottom lip of the beret) rather than by a width and a row: the band's
# two ends, CAP_BAND in the trimmed picture, are put on the head's outline, the left end lower (rL of the way
# from skull top to chin) than the right (rR), so the beret wraps the head and is worn tilted to the left,
# its puff hanging over the left side. Scale and tilt follow from the two points, so each head gets its own.
CAP_BAND = ((88, 528), (478, 527))

def _place(img, src, dst, size):
    """img drawn on a canvas of `size`, scaled and rotated so the two points src land on the two points dst."""
    (P0, P1), (T0, T1) = src, dst
    s = math.hypot(T1[0] - T0[0], T1[1] - T0[1]) / math.hypot(P1[0] - P0[0], P1[1] - P0[1])
    d = math.atan2(T1[1] - T0[1], T1[0] - T0[0]) - math.atan2(P1[1] - P0[1], P1[0] - P0[0])
    a, b, e, f = math.cos(d) / s, math.sin(d) / s, -math.sin(d) / s, math.cos(d) / s
    c0 = P0[0] - (a * T0[0] + b * T0[1]); f0 = P0[1] - (e * T0[0] + f * T0[1])
    return img.transform(size, Image.AFFINE, (a, b, c0, e, f, f0), resample=Image.BICUBIC)

def cap_on(head_img, head_name, hat_img, chins, skulls):
    p = dict(HATS["cap"]); p.update(FIX.get(("cap", head_name), {}))
    sk = skulls[head_name]; chin = chins[head_name]; top = sk["top"]
    a = np.asarray(head_img)[..., 3] > 0
    if "centre" in p:          # level, between ears or horns
        r, k, dx = (tuple(p["centre"]) + (0,))[:3]
        y = top + r * (chin - top) + PAD; half = k * sk["w30"] / 2; cx = sk["cx"] + dx * sk["w30"]
        TL, TR = (cx - half, y), (cx + half, y)
    else:                      # on the outline, tilted
        yL = int(top + p["rL"] * (chin - top)); yR = int(top + p["rR"] * (chin - top))
        xl = np.where(a[yL])[0].min(); xr = np.where(a[yR])[0].max(); o = p["out"] * (xr - xl)
        TL, TR = (xl - o, yL + PAD), (xr + o, yR + PAD)
    W, H = head_img.width, head_img.height + PAD
    hat = _place(hat_img, CAP_BAND, (TL, TR), (W, H))
    hd = np.asarray(head_img).copy()
    if not head_name.startswith(KEEP_TOP):     # the head inside the cap is hidden, down to just above its bottom edge
        ha = np.asarray(hat)[..., 3] > 40
        x0, x1 = int(math.ceil(TL[0])), int(TR[0])
        for X in range(W):
            if x0 <= X <= x1:
                ys = np.where(ha[:, X])[0]
                if not len(ys): continue
                cut = ys.max() - p["lift"]
            else:
                cut = TL[1] if X < x0 else TR[1]
            cut = int(cut) - PAD
            if cut > 0: hd[:cut, X, 3] = 0
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.alpha_composite(Image.fromarray(hd, "RGBA"), (0, PAD)); out.alpha_composite(hat)
    return out

def head_width(head_img, row):
    a = np.asarray(head_img)[..., 3] > 0
    xs = np.where(a[max(0, min(row, a.shape[0] - 1))])[0]
    return int(xs.min()), int(xs.max())

def head_with_hat(head_img, head_name, hat, hat_img, chins, skulls):
    """The head with the hat on, on a canvas PAD px taller at the top (add PAD to the chin row)."""
    if HATS[hat].get("band"): return cap_on(head_img, head_name, hat_img, chins, skulls)
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
