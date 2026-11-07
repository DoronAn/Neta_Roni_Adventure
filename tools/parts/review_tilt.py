import json, sys, accessories
from PIL import Image, ImageDraw, ImageFont
from join import cutout
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json"))
hat, heads, variants = sys.argv[1], sys.argv[2].split(","), json.loads(sys.argv[3])
img = accessories.load_hat(hat)
T = 300; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
sheet = Image.new("RGB", (len(heads) * T, len(variants) * (T + 30)), "white"); d = ImageDraw.Draw(sheet)
for i, (label, fx) in enumerate(variants.items()):
    for j, n in enumerate(heads):
        fx2 = dict(fx); fx2.update(fx.get("per", {}).get(n, {})); fx2.pop("per", None)
        accessories.FIX[(hat, n)] = fx2
        im = accessories.head_with_hat(cutout("head_human_m.jpg" if n == "human_m" else f"head_{n}.jpg"), n, hat, img, chins, skulls)
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        c = bg.convert("RGB").crop((40, 330 + accessories.PAD - 600, 984, 1274 + accessories.PAD - 600)).resize((T - 6, T - 6), Image.LANCZOS)
        sheet.paste(c, (j * T + 3, i * (T + 30) + 26))
    d.text((6, i * (T + 30) + 4), label, fill="#2b1d14", font=f)
sheet.save(f"../shots/tilt_{hat}.png"); print(sheet.size)
