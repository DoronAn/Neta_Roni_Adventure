import json
from PIL import Image, ImageDraw, ImageFont
from join import cutout
from accessories import HATS, PAD, load_hat, head_with_hat
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json"))
heads = list(chins)
hats = {h: load_hat(h) for h in HATS}
T = 150; TH = int((T - 4) * (1004 + PAD) / 1024) + 6; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
sheet = Image.new("RGB", (90 + len(heads) * T, 24 + len(hats) * TH), "white"); d = ImageDraw.Draw(sheet)
for j, n in enumerate(heads): d.text((90 + j * T + 4, 4), n.replace("_m2", "_m"), fill="#2b1d14", font=f)
for i, h in enumerate(hats):
    d.text((6, 24 + i * TH + TH // 2), h, fill="#2b1d14", font=f)
    for j, n in enumerate(heads):
        src = cutout("head_human_m.jpg" if n == "human_m" else f"head_{n}.jpg")
        im = head_with_hat(src, n, h, hats[h], chins, skulls)
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        crop = bg.convert("RGB").crop((0, 20, 1024, 1024 + PAD))
        sheet.paste(crop.resize((T - 4, int((T - 4) * crop.height / crop.width)), Image.LANCZOS), (90 + j * T, 24 + i * TH))
sheet.save("../shots/hats.png"); print(sheet.size)
