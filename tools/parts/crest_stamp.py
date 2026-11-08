"""The team crests as rubber stamps: one ink colour, the linework solid, the shading as lighter ink, worn.
python3 crest_stamp.py <out dir>"""
import sys, numpy as np
from PIL import Image, ImageFilter
from join import cutout
from recolor import rgb2hsv
INK = {"neta": (23, 94, 96), "roni": (214, 100, 22)}
rng = np.random.default_rng(5)
def worn(shape, density):
    """A screen-print wear mask: mostly 1, with soft holes."""
    n = rng.random(shape)
    im = Image.fromarray((n * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    a = np.asarray(im).astype(float) / 255
    a = (a - a.mean()) / a.std()
    return np.clip(1.6 - density * np.maximum(a - 0.6, 0) * 3, 0, 1)
for team, ink in INK.items():
    im = cutout(f"crest_{team}.jpg"); im = im.crop(im.getbbox()).resize((640, 640), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255; rgb, al = a[..., :3], a[..., 3]
    h, s, v = rgb2hsv(rgb)
    lum = rgb @ [0.299, 0.587, 0.114]
    line = np.clip((0.42 - lum) / 0.22, 0, 1)                       # the black outlines and dark details
    # shading: the animal's own tones (not the saturated background or the gold rim) as lighter ink
    if team == "neta":
        body = (s < 0.25) & (lum < 0.75)                            # the grey koala, not the teal field
        leaves = (h > 90) & (h < 160) & (s > 0.25) & (lum < 0.6)    # the green leaves
        shade = np.where(body, np.clip((0.8 - lum) * 1.4, 0, 0.55), 0) + np.where(leaves, 0.45, 0)
    else:
        bird = (lum < 0.52) & ~((h > 22) & (h < 40) & (s > 0.7))     # the darker rooster tones, not the orange field
        comb = (h < 12) | (h > 340)
        shade = np.where(bird | comb, np.clip((0.75 - lum) * 1.3, 0, 0.6), 0)
    ink_a = np.clip(np.maximum(line, shade), 0, 1) * al
    ink_a *= worn(ink_a.shape, 0.75)
    out = np.dstack([np.full(ink_a.shape + (3,), ink, float) / 255, ink_a])
    Image.fromarray((out * 255).astype(np.uint8), "RGBA").resize((400, 400), Image.LANCZOS).save(f"{sys.argv[1]}/stamp_{team}.webp", "WEBP", quality=90)
    print(team, "ok")
