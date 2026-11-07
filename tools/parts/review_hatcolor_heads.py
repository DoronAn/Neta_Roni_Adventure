"""One hat, large, on heads only: columns = the 7 outfit colours, rows = classes (heads rotate)."""
import sys, json
from PIL import Image, ImageDraw, ImageFont
from join import cutout
import accessories as A, hatcolor as HC
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json")); GC = HC.garment_colours()
hat = sys.argv[1]; classes = sys.argv[2].split(","); heads = sys.argv[3].split(","); T = int(sys.argv[4]) if len(sys.argv) > 4 else 300
base = A.load_hat(hat); f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
CROP = (60, A.PAD - 60, 964, A.PAD + 640)
TH = int(T * (CROP[3] - CROP[1]) / (CROP[2] - CROP[0]))
sheet = Image.new("RGB", (7 * T, len(classes) * (TH + 24)), "white"); d = ImageDraw.Draw(sheet)
for r, cls in enumerate(classes):
    for c, col in enumerate(HC.COLOURS):
        n = heads[(r + c) % len(heads)]
        im = A.head_with_hat(cutout(f"head_{n}.jpg"), n, hat, HC.recolor_hat(base, hat, GC[f"{cls}/{col}"]), chins, skulls)
        bg = Image.new("RGBA", im.size, "white"); bg.alpha_composite(im)
        sheet.paste(bg.convert("RGB").crop(CROP).resize((T - 4, TH), Image.LANCZOS), (c * T + 2, r * (TH + 24) + 22))
        d.text((c * T + 4, r * (TH + 24) + 2), f"{cls} {col}", fill="black", font=f)
sheet.save(f"../shots/hc_heads_{hat}.png"); print(sheet.size)
