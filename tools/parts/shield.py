"""The broken shield for the first screen, from Doron's two Gemini drawings (2026-11-08): the star version
(shield_star) for its jagged cracks, with its pieces recoloured to alternate teal and orange, and the rooster
and koala from the crests version (shield_crests) in its centre, cut by the star version's crack.
python3 shield.py <out.webp> [preview.png]   (run from the folder holding parts/raw/*)"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from recolor import rgb2hsv
from join import cutout

A = np.asarray(Image.open("shield_star.jpg").convert("RGB")).astype(float) / 255
B = np.asarray(Image.open("shield_crests.jpg").convert("RGB")).astype(float) / 255
yy, xx = np.mgrid[0:1024, 0:1024]
def parts(a):
    h, s, v = rgb2hsv(a); lum = a @ [0.299, 0.587, 0.114]
    return h, s, lum, (lum > 0.86) & (s < 0.12)
h, s, lum, white = parts(A)
gold = (h >= 36) & (h <= 62) & (s > 0.3) & (lum > 0.35)
teal = (h > 150) & (h < 215) & (s > 0.15)
orange = (h > 5) & (h < 35) & (s > 0.3)
ang = np.degrees(np.arctan2(-(yy - 512), xx - 512)) % 360; rad = np.hypot(xx - 512, yy - 512)
ring = rad > 200

def sample(img, delta):
    """img rotated so that what sits at angle a lands at angle a - delta (degrees, counter-clockwise), about the centre."""
    t = np.radians(delta); x, yu = xx - 512, -(yy - 512)
    sx = 512 + x * np.cos(t) - yu * np.sin(t); sy = 512 - (x * np.sin(t) + yu * np.cos(t))
    if img.ndim == 2: return ndimage.map_coordinates(img.astype(float), [sy, sx], order=0) > 0.5
    return np.dstack([ndimage.map_coordinates(img[..., c], [sy, sx], order=1) for c in range(3)])

def wash(mask):                       # a piece's wash, without the darker fringe along its outline
    return ndimage.binary_erosion(mask & (lum > lum[mask].mean() * 0.75), iterations=3)

def donor_texture(target, donors):
    """Real watercolour for the pixels of `target`, taken from donor pieces of the right colour, each rotated onto it
    at the angle that covers it best; what no donor covers gets a smooth fill from around it (no streaks)."""
    cands = []
    for mask, nominal in donors:
        wm = wash(mask)
        for d in range(nominal - 20, nominal + 21, 2):
            cands.append(((target & sample(wm, d)).sum(), d, wm))
    cands.sort(key=lambda c: -c[0])
    new = np.zeros_like(A); covered = np.zeros(lum.shape, bool); used = []
    for _, d, wm in cands:
        if covered[target].all() or len(used) == 3: break
        if any(abs(d - u) < 10 for u in used): continue
        Wr = sample(wm, d) & ~covered
        if (Wr & target).sum() < 200: continue
        new[Wr] = sample(A, d)[Wr]; covered |= Wr; used.append(d)
    for sigma in (6, 20, 60):                   # normalised convolution: the average of nearby covered pixels
        if covered[target].all(): break
        wsum = ndimage.gaussian_filter(covered.astype(float), sigma)
        fill = np.dstack([ndimage.gaussian_filter(new[..., c] * covered, sigma) for c in range(3)]) / np.maximum(wsum, 1e-6)[..., None]
        ok = (wsum > 0.02) & ~covered
        new[ok] = fill[ok]; covered |= ok
    return new

def comp(colour_mask, a0, a1):
    lab, n = ndimage.label(colour_mask & ring)
    want = np.zeros_like(colour_mask)
    for i in range(1, n + 1):
        c = lab == i
        if c.sum() > 3000 and a0 <= ang[c].mean() <= a1: want |= c
    return want

def paint(out, region, new, line=None, feather_into=None, feather=14):
    """Lay `new` over `region`, keeping the piece's black outline (pixels darker than the wash fade back to the
    original), except `line`, which disappears. With feather_into, the new texture fades into that wash over
    `feather` px, so no seam shows."""
    ratio = lum / lum[region & (lum > 0.15)].mean()
    w = np.clip((ratio - 0.3) / 0.35, 0, 1)
    if line is not None: w = np.where(line, 1.0, w)
    area = ndimage.binary_dilation(region | (line if line is not None else False), iterations=6) & ~gold & ~white
    if feather_into is not None:
        d = ndimage.distance_transform_edt(~(region | (line if line is not None else False)))
        area = area | (feather_into & (d < feather)); w = w * np.where(feather_into & ~region, np.clip(1 - d / feather, 0, 1), 1)
    w = (w * area)[..., None]
    return out * (1 - w) + new * w

out = A.copy()
# 1. Pieces counter-clockwise from the right: orange 23, teal 61 (+ an orange sliver at 81), teal 114, teal 158,
#    orange 202, teal 247, orange 293, teal 339. To alternate, the top-left piece (114) turns orange, repainted from
#    the orange pieces; in the top-right piece, the sliver and the line beside it turn teal, repainted from the teal
#    pieces and faded into the piece's own teal.
orange_pieces = [(comp(orange, a - 15, a + 15), a - 114) for a in (23, 202, 293)]
teal_pieces = [(comp(teal, a - 15, a + 15), a - 70) for a in (158, 247, 339)]
top_left = comp(teal, 100, 130)
tl_area = ndimage.binary_dilation(top_left, iterations=6) & ~gold & ~white
out = paint(out, top_left, donor_texture(tl_area, orange_pieces))
tr_teal, tr_sliver = comp(teal, 45, 75), comp(orange, 70, 95)
edge = ndimage.binary_dilation(gold | white, iterations=7)
between = ndimage.binary_dilation(tr_teal, iterations=6) & ndimage.binary_dilation(tr_sliver, iterations=6)
line = ndimage.binary_dilation(between & (lum < 0.35) & ~edge, iterations=4) & ~edge
tr_area = ndimage.binary_dilation(tr_sliver | line, iterations=22) & ~gold & ~white
out = paint(out, tr_sliver, donor_texture(tr_area, teal_pieces), line=line, feather_into=tr_teal)

# 2. The centre: the crests version's disc (radius 185) scaled onto the star version's (radius 172), its straight
#    crack painted over with the gold beside it, then cut by the star version's jagged crack.
RA, RB = 172, 185
k = RB / RA
src_x = 512 + (xx - 512) * k; src_y = 512 + (yy - 512) * k
Bs = np.dstack([ndimage.map_coordinates(B[..., c], [src_y, src_x], order=1) for c in range(3)])
hb, sb, lb, wb = parts(Bs)
crackB = wb & (rad < RA - 4) & (np.abs(xx - 512) < 40)
crackB = ndimage.binary_dilation(crackB, iterations=5) & (rad < RA - 10)
crackB &= ~ndimage.binary_dilation(((hb > 5) & (hb < 35) & (sb > 0.35)) | ((hb > 150) & (hb < 215) & (sb > 0.2)), iterations=1)
# fill the old crack from the nearest gold
goldB = (hb >= 36) & (hb <= 62) & (sb > 0.3) & ~crackB
_, (gy, gx) = ndimage.distance_transform_edt(~goldB, return_indices=True)
fill = Bs.copy(); fill[crackB] = Bs[gy[crackB], gx[crackB]]
lab, n = ndimage.label(white & (rad < 205))
gap_labels = set(np.unique(lab[(rad > 180) & (rad < 192) & white])) - {0}
crackA = np.isin(lab, list(gap_labels)) & (rad < RA + 2)
disc = (rad <= RA + 1) & ~crackA
out[disc] = fill[disc]
d = ndimage.distance_transform_edt(~crackA)
ink = np.clip(5.5 - d, 0, 1) * (rad < RA - 2) * ~crackA                # a 5 px black edge along the crack, soft outside
out = out * (1 - ink[..., None]) + np.array([0.07, 0.06, 0.05]) * ink[..., None]
out[crackA] = A[crackA]

Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save("shield_composed.png")
im = cutout("shield_composed.png"); im = im.crop(im.getbbox())
im.resize((420, round(420 * im.height / im.width)), Image.LANCZOS).save(sys.argv[1], "WEBP", quality=90)
if len(sys.argv) > 2: Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(sys.argv[2])
print("ok")
