"""One hat, large, on all 12 heads: the check before showing anything.
python3 review_hat.py <hat> [tile px, default 450]  ->  ../shots/review_<hat>.png"""
import json, sys
from PIL import Image, ImageDraw, ImageFont
from join import cutout
import accessories
hat = sys.argv[1]; T = int(sys.argv[2]) if len(sys.argv) > 2 else 450
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json"))
heads = list(chins); h_img = accessories.load_hat(hat)
COLS = 6 if T <= 300 else 4; ROWS = -(-len(heads) // COLS)
CROP = (0, 120, 1024, 1024 + accessories.PAD - 80)          # the whole head and the tallest hat
TH = int((T - 6) * (CROP[3] - CROP[1]) / (CROP[2] - CROP[0]))
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
sheet = Image.new("RGB", (COLS * T, ROWS * (TH + 28)), "white"); d = ImageDraw.Draw(sheet)
for j, n in enumerate(heads):
    src = cutout(f"head_{n}.jpg")
    im = accessories.head_with_hat(src, n, hat, h_img, chins, skulls)
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    crop = bg.convert("RGB").crop(CROP).resize((T - 6, TH), Image.LANCZOS)
    x, y = (j % COLS) * T, (j // COLS) * (TH + 28)
    sheet.paste(crop, (x + 3, y + 26)); d.text((x + 6, y + 3), n, fill="#2b1d14", font=f)
sheet.save(f"../shots/review_{hat}.png"); print(sheet.size)
