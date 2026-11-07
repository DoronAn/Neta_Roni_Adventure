"""Writes the hero's pictures for the site, and parts.js, which says where each one goes.
python3 build_web.py <repo root> [--js-only]   (run from the working folder with parts/raw/* and tools/parts/* in it)
--js-only rewrites parts.js without making the pictures again (the slow part, about 12 minutes).

Everything is placed in "hero space": body pixels of the 1024 px body pictures, origin at the body picture's
top-left (a head and its hat reach above it, so y goes negative). Every layer in parts.js carries m = [a, b, c,
d, e, f], the canvas transform from its picture's pixels to hero space (x' = a x + c y + e, y' = b x + d y + f).
The page only places pictures: no colours are computed and nothing is cut in the browser."""
import sys, os, json, numpy as np
from PIL import Image
from join import cutout
from recolor import recolor, GARMENT
from recolor2 import recolor2
import accessories as A, hatcolor as HC

ROOT = sys.argv[1]; JS_ONLY = "--js-only" in sys.argv; OUT = os.path.join(ROOT, "parts", "web"); os.makedirs(OUT, exist_ok=True)
K = 0.7                  # picture pixels per hero pixel (bodies come out 717 px wide)
HAT_SCALE = 0.5          # hat pictures: half their trimmed source size
S, CHIN_AT = 0.434, 124  # head scale on the body, and the body row the chin sits on (as in sheet_full.py)
HEADS = ["human_m", "human_f", "elf_m", "elf_f", "dwarf_m", "dwarf_f", "dragonborn_m", "dragonborn_f",
         "tabaxi_m", "tabaxi_f", "fairy_m", "fairy_f"]
HATS = ["crown", "wizard", "cap", "flowers"]
PETS = ["fox", "owl", "cat", "dragon", "wolf", "raven", "frog", "hedgehog"]
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json")); GC = HC.garment_colours()

def save(im, name, scale):
    if JS_ONLY: return None
    if scale != 1: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    im.save(os.path.join(OUT, name), "WEBP", quality=86, method=6); return im.size
def m6(M): return [round(float(v), 5) for v in (M[0, 0], M[1, 0], M[0, 1], M[1, 1], M[0, 2], M[1, 2])]
def scale_shift(k, x, y): return np.array([[k, 0, x], [0, k, y], [0, 0, 1.0]])
def rel(name): return "parts/web/" + name

parts = {"K": K, "bodies": {}, "heads": {}, "hats": {}, "pets": {}, "colours": HC.COLOURS, "classes": HC.CLASSES}

# Bodies: 9 classes x 7 colours, drawn at the hero origin.
for cls in HC.CLASSES:
    raw = cutout(f"body_{cls}.jpg")
    for col in HC.COLOURS:
        if JS_ONLY: parts["bodies"][f"{cls}/{col}"] = rel(f"body_{cls}_{col}.webp"); continue
        b = raw if col == "original" else (recolor(raw, cls, col) if cls in GARMENT else recolor2(raw, cls, col))
        n = f"body_{cls}_{col}.webp"; save(b, n, K); parts["bodies"][f"{cls}/{col}"] = rel(n)
parts["body_m"] = m6(scale_shift(1 / K, 0, 0))

# Wings behind fairies (as in sheet_fairy.py: the wing joint on body row 300).
w = cutout("back_wings.jpg"); save(w, "wings.webp", K)
parts["wings"] = {"src": rel("wings.webp"), "m": m6(scale_shift(1 / K, 0, 300 - 520))}

# Heads: bare, and with the hair under each hat removed. Head pixels -> hero: scale S, chin on CHIN_AT.
def head_to_hero(n):
    return scale_shift(S, 512 - 512 * S, CHIN_AT + A.HEAD_DROP.get(n, 0) - chins[n] * S)
hat_src = {h: A.load_hat(h) for h in HATS}
for n in HEADS:
    src = cutout(f"head_{n}.jpg"); H = head_to_hero(n); parts["heads"][n] = {}
    variants = {"none": src}
    pls = {}
    for h in HATS:
        pls[h] = A.place(src, n, h, hat_src[h], chins, skulls)
        variants[h] = pls[h]["head"]
    for v, im in variants.items():
        if v != "none" and np.array_equal(np.asarray(im), np.asarray(src)):
            parts["heads"][n][v] = "none"; continue          # this hat hides no hair here: the bare head serves
        box = im.getbbox(); crop = im.crop(box); name = f"head_{n}_{v}.webp"; save(crop, name, S * K)
        # picture px -> head px: shift by the box corner, scale 1/(S K)
        M = H @ scale_shift(1 / (S * K), box[0], box[1])
        parts["heads"][n][v] = {"src": rel(name), "m": m6(M)}
    # Hats on this head: hat picture px (at HAT_SCALE) -> hat source px -> head canvas px (PAD on top) -> hero
    Hc = H @ scale_shift(1, 0, -A.PAD)
    for h in HATS:
        parts["hats"].setdefault(h, {})[n] = {k: m6(Hc @ M @ scale_shift(1 / HAT_SCALE, 0, 0)) for k, M in pls[h]["M"].items()}

# Hat pictures, in each class x colour. The flower ring as a back half and a front half.
for h in ([] if JS_ONLY else HATS):
    base = hat_src[h]
    for cls in HC.CLASSES:
        for col in HC.COLOURS:
            im = HC.recolor_hat(base, h, GC[f"{cls}/{col}"])
            if h == "flowers":
                a = np.asarray(im); half = im.height // 2
                b = a.copy(); b[half:, :, 3] = 0; f = a.copy(); f[:half, :, 3] = 0
                save(Image.fromarray(b, "RGBA"), f"hat_{h}_back_{cls}_{col}.webp", HAT_SCALE)
                save(Image.fromarray(f, "RGBA"), f"hat_{h}_front_{cls}_{col}.webp", HAT_SCALE)
            else:
                save(im, f"hat_{h}_{cls}_{col}.webp", HAT_SCALE)
# The outfit's colour as a swatch for the colour screen: the garment's median colour, per class.
import colorsys
# Brightened, since some garments are drawn very dark (the rogue's cloak); black stays dark, white stays white.
def swatch(key, h, s, v):
    if key.endswith("/black"): s, v = min(s, 0.15), max(v, 0.2)
    elif s >= 0.12: s, v = max(s, 0.4), max(v, 0.55)
    return "#%02x%02x%02x" % tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h / 360, s, v))
parts["swatch"] = {k: swatch(k, *hsv) for k, hsv in GC.items()}
parts["hat_src"] = "parts/web/hat_{hat}_{cls}_{col}.webp"            # {hat} is flowers_back / flowers_front for the ring

# Companions at the hero's right foot (as in sheet_full.py).
for p in PETS:
    im = A.load_pet(p); name = f"pet_{p}.webp"; save(im, name, K)
    parts["pets"][p] = {"src": rel(name), "m": m6(scale_shift(1 / K, 920 - im.width // 2, 985 - im.height))}

# Team crests, for the name screen and the card.
for t in ("neta", "roni"):
    im = cutout(f"crest_{t}.jpg"); im = im.crop(im.getbbox()); save(im, f"crest_{t}.webp", 320 / im.width)
parts["crests"] = {"neta": rel("crest_neta.webp"), "roni": rel("crest_roni.webp")}

with open(os.path.join(ROOT, "parts.js"), "w") as fh:
    fh.write("// Written by tools/parts/build_web.py: don't edit by hand. Where each hero picture goes; see that script.\n")
    fh.write("const PARTS = " + json.dumps(parts, ensure_ascii=False, separators=(",", ":")) + ";\n")
if not JS_ONLY: print("files:", len(os.listdir(OUT)), "size MB:", round(sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) / 1e6, 1))
