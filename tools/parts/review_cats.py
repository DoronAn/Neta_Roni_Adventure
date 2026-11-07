# The cats' flower crown, in candidate placements, for choosing.
import json, accessories
from PIL import Image, ImageDraw, ImageFont
from join import cutout
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json"))
ring = accessories.load_hat("flowers")
variants = {
    "A small, between the ears": dict(fit=0.70, dy=-62, squash=0.5),
    "B tilted over one ear":     dict(fit=0.6, dy=-60, squash=0.55, tilt=24, dx=-150),
}
T = 380; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
sheet = Image.new("RGB", (4 * T, T + 40), "white"); d = ImageDraw.Draw(sheet); i = 0
for label, fx in variants.items():
    for n in ("tabaxi_m", "tabaxi_f"):
        fx = dict(fx)
        if n == "tabaxi_f": fx["dy"] = fx["dy"] - 15
        accessories.FIX[("flowers", n)] = fx
        im = accessories.head_with_hat(cutout(f"head_{n}.jpg"), n, "flowers", ring, chins, skulls)
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        c = bg.convert("RGB").crop((60, 560 + accessories.PAD - 600, 964, 1024 + accessories.PAD - 60)).resize((T - 8, int((T - 8) * 1004 / 904)))
        c = c.crop((0, 0, T - 8, T - 8))
        sheet.paste(c, (i * T + 4, 36)); d.text((i * T + 8, 6), label if n == "tabaxi_m" else "", fill="#2b1d14", font=f); i += 1
sheet.save("../shots/review_cats.png"); print(sheet.size)
