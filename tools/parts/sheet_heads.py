import json
from PIL import Image, ImageDraw, ImageFont
from join import cutout
chins = json.load(open("heads.json"))
body = cutout("body_fighter.jpg")
S = 0.434
def compose(name):
    head = cutout(f"head_{name}.jpg")
    hs = head.resize((int(1024 * S), int(1024 * S)), Image.LANCZOS)
    off = int(1024 * S)
    c = Image.new("RGBA", (1024, 1024 + off), (255, 255, 255, 0))
    c.alpha_composite(body, (0, off))
    c.alpha_composite(hs, (512 - int(512 * S), off + 104 - int(chins[name] * S)))
    return c
ims = []
for n in chins:
    c = compose(n)
    bg = Image.new("RGBA", c.size, (255, 255, 255, 255)); bg.alpha_composite(c)
    ims.append((n, bg.convert("RGB").crop((60, 0, 964, c.height)).resize((300, int(c.height * 300 / 904)))))
H = ims[0][1].height
f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
sheet = Image.new("RGB", (6 * 310 + 10, 2 * (H + 34) + 10), "white"); d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(ims):
    x = 10 + (i % 6) * 310; y = 10 + (i // 6) * (H + 34)
    sheet.paste(im, (x, y + 28)); d.text((x + 6, y), f"{i+1}. {n}", fill="#2b1d14", font=f)
sheet.save("../shots/heads-on-body.png"); print(sheet.size)
