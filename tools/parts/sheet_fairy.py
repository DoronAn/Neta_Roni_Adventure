import json, sys
from PIL import Image, ImageDraw, ImageFont
from join import cutout
from recolor import recolor, GARMENT
from recolor2 import recolor2
chins = json.load(open("heads.json")); S, CHIN_AT = 0.434, 124
WS = float(sys.argv[1]) if len(sys.argv) > 1 else 0.8; WY = int(sys.argv[2]) if len(sys.argv) > 2 else 250
wings = cutout("back_wings.jpg"); wings = wings.resize((int(1024 * WS), int(1024 * WS)), Image.LANCZOS)
def hero(cls, head, color="original"):
    b = cutout(f"body_{cls}.jpg")
    if color != "original": b = recolor(b, cls, color) if cls in GARMENT else recolor2(b, cls, color)
    h = cutout(f"head_{head}.jpg").resize((int(1024 * S), int(1024 * S)), Image.LANCZOS)
    off = int(1024 * S)
    c = Image.new("RGBA", (1024, 1024 + off), (255, 255, 255, 255))
    # wings: their joint (source 512, 520) behind the upper back
    c.alpha_composite(wings, (512 - int(512 * WS), off + WY - int(520 * WS)))
    c.alpha_composite(b, (0, off))
    c.alpha_composite(h, (512 - int(512 * S), off + CHIN_AT - int(chins[head] * S)))
    return c.convert("RGB").crop((20, 20, 1004, 1024 + off))
combos = [("fighter","fairy_m","original"),("wizard","fairy_f","purple"),("druid","fairy_f","original"),
          ("rogue","fairy_m","blue"),("bard","fairy_f","pink"),("paladin","fairy_m","original"),("cleric","fairy_f","blue"),("ranger","fairy_m","original")]
TW = 260; ims = [hero(*c) for c in combos]; TH = int(ims[0].height * TW / ims[0].width)
sheet = Image.new("RGB", (4 * (TW + 8) + 8, 2 * (TH + 8) + 8), "white")
for i, im in enumerate(ims): sheet.paste(im.resize((TW, TH), Image.LANCZOS), (8 + (i % 4) * (TW + 8), 8 + (i // 4) * (TH + 8)))
sheet.save("../shots/fairies.png"); print(sheet.size)
