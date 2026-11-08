"""The broken shield for the first screen: Doron's Gemini drawing (parts/raw/shield_v2.jpg, 2026-11-08), with the
star behind the koala turned from teal to orange (Doron's ask), so the rooster stands on teal and the koala on
orange. The star behind the rooster stays teal.
python3 shield.py <out.webp> [preview.png]   (run from the folder holding parts/raw/*)
(An earlier version combined two other drawings; it is in the git history of this file.)"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from recolor import rgb2hsv, hsv2rgb
from join import cutout

A = np.asarray(Image.open("shield_v2.jpg").convert("RGB")).astype(float) / 255
h, s, v = rgb2hsv(A); lum = A @ [0.299, 0.587, 0.114]
yy, xx = np.mgrid[0:1024, 0:1024]; rad = np.hypot(xx - 512, yy - 512)
teal = (h > 150) & (h < 215) & (s > 0.2)
orange = (h > 5) & (h < 35) & (s > 0.35)
centre = rad < 255                                   # the centre disc (the gap around it starts at 260)
right = xx > 515                                     # the koala's half, right of the crack

# The drawing's ink lines split the koala's half into regions (the koala, the star's points, the gold). The star's
# points are the teal regions darker than the koala (mean brightness about 0.34 against the koala's 0.47).
regions, n = ndimage.label((lum > 0.18) & centre & right)
star = np.zeros(lum.shape, bool)
for i in range(1, n + 1):
    m = regions == i
    if m.sum() < 30: continue
    mh = np.degrees(np.arctan2(np.sin(np.radians(h[m])).mean(), np.cos(np.radians(h[m])).mean())) % 360
    if 150 < mh < 215 and lum[m].mean() < 0.41: star |= m
inked = ~((lum > 0.18) & centre & right)          # the ink between regions
star = star | (ndimage.binary_dilation(star, iterations=3) & inked & centre & right)   # and its soft edge into the ink

# Recolour: the orange of the outer pieces, with the star's own light and dark at the strength the orange pieces have.
def spread(m): return (lum[m] / lum[m].mean()).std()
pieces_o = orange & (rad > 280); target = A[pieces_o].mean(0)
th, ts, tv = (x[0, 0] for x in rgb2hsv(target[None, None, :]))
wash = star & (lum > 0.15)
ratio = lum / lum[wash].mean()
dev = (ratio - 1) * spread(pieces_o) / spread(wash)
new = hsv2rgb(np.full_like(lum, th), np.full_like(lum, ts), np.clip(tv * (1 + dev), 0, 1))
w = (np.clip((ratio - 0.35) / 0.35, 0, 1) * star)[..., None]       # darker than the wash (outline) stays as it was
out = A * (1 - w) + new * w

img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
if len(sys.argv) > 2: img.save(sys.argv[2])
img.save("shield_composed.png")
im = cutout("shield_composed.png"); im = im.crop(im.getbbox())
im.resize((420, round(420 * im.height / im.width)), Image.LANCZOS).save(sys.argv[1], "WEBP", quality=90)
print("star px", int(star.sum()))
