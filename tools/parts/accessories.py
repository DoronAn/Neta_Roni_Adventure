import json, numpy as np
from PIL import Image
from join import cutout

def cutout_all_white(path, thresh=232):
    """For parts with enclosed background (the flower ring): every near-white pixel goes, not just the outer ones."""
    im = cutout(path); a = np.asarray(im).copy()
    a[..., 3][a[..., :3].min(axis=2) >= thresh] = 0
    return Image.fromarray(a, "RGBA")

def trim(im): return im.crop(im.getbbox())

# Headwear, in head-source pixels: width, and where the hat's base sits (fraction of the way from skull top to chin).
HATS = {
    "crown":   dict(w=380, base=0.13),
    "wizard":  dict(w=600, base=0.32, squash=0.62),
    "cap":     dict(w=780, base=0.20),
    "flowers": dict(w=640, base=0.15, ring=True),
}
def load_hat(name):
    im = cutout_all_white(f"hat_{name}.jpg") if HATS[name].get("ring") else cutout(f"hat_{name}.jpg")
    return trim(im)

def head_with_hat(head_img, head_name, hat, hat_img, chins, skulls):
    """Returns the head with the hat on, on a canvas PAD px taller at the top (so add PAD to the chin row)."""
    p = HATS[hat]; sk = skulls[head_name]; chin = chins[head_name]
    w = p["w"]; s = w / hat_img.width; hi = hat_img.resize((w, int(hat_img.height * s * p.get("squash", 1))), Image.LANCZOS)
    base_y = int(sk["top"] + p["base"] * (chin - sk["top"]))
    out = Image.new("RGBA", (head_img.width, head_img.height + PAD), (0, 0, 0, 0))
    x = sk["cx"] - w // 2; base_y += PAD
    if p.get("ring"):       # the far half of the ring goes behind the head, the near half in front
        y = base_y - hi.height // 2
        back = hi.copy(); a = np.asarray(back).copy(); a[hi.height // 2:, :, 3] = 0; back = Image.fromarray(a, "RGBA")
        front = hi.copy(); a = np.asarray(front).copy(); a[:hi.height // 2, :, 3] = 0; front = Image.fromarray(a, "RGBA")
        out.alpha_composite(back, (x, y)); out.alpha_composite(head_img, (0, PAD)); out.alpha_composite(front, (x, y))
    else:
        y = base_y - hi.height
        out.alpha_composite(head_img, (0, PAD)); out.alpha_composite(hi, (x, y))
    return out

PAD = 600     # room above the head for tall hats
PET_H = 380   # companion height in body pixels (the body is ~905 px tall)
def load_pet(name):
    im = trim(cutout(f"pet_{name}.jpg"))
    s = PET_H / max(im.height, im.width * 0.85)
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)

# Heads that sit lower on the body, in body pixels (Doron, 2026-11-07: the dragonborn sat too high).
HEAD_DROP = {"dragonborn_m": 26, "dragonborn_f": 26}
