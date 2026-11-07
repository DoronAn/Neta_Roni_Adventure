import json, sys
from PIL import Image, ImageDraw, ImageFont
from join import cutout
import importlib, accessories
hat = sys.argv[1]
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json"))
heads = list(chins); h_img = accessories.load_hat(hat)
T = 300; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
sheet = Image.new("RGB", (6 * T, 2 * (T + 60)), "white"); d = ImageDraw.Draw(sheet)
for j, n in enumerate(heads):
    src = cutout("head_human_m2.jpg" if n == "human_m2" else f"head_{n}.jpg")
    im = accessories.head_with_hat(src, n, hat, h_img, chins, skulls)
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    crop = bg.convert("RGB").crop((40, 170, 984, 1024 + 600 - 120))
    crop = crop.resize((T - 6, int((T - 6) * crop.height / crop.width)), Image.LANCZOS)
    x, y = (j % 6) * T, (j // 6) * (T + 60)
    sheet.paste(crop, (x + 3, y + 24)); d.text((x + 6, y + 2), n.replace("_m2", "_m"), fill="#2b1d14", font=f)
sheet.save(f"../shots/review_{hat}.png"); print(sheet.size)
