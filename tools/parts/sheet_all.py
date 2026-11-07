import json
from PIL import Image, ImageDraw, ImageFont
from join import cutout
from recolor import recolor, GARMENT
from recolor2 import recolor2
chins = json.load(open("heads.json"))
S, CHIN_AT = 0.434, 124
heads = ["human_m","human_f","elf_m","elf_f","dwarf_m","dwarf_f","dragonborn_m","dragonborn_f","tabaxi_m","tabaxi_f","fairy_m","fairy_f"]
H = {h: cutout(f"head_{h}.jpg").resize((int(1024 * S), int(1024 * S)), Image.LANCZOS) for h in heads}
classes = ["fighter","wizard","rogue","cleric","ranger","bard","barbarian","druid","paladin"]
colors = ["original","red","green","blue","purple","pink","black"]
def hero(body_img, head):
    off = int(1024 * S)
    c = Image.new("RGBA", (1024, 1024 + off), (255, 255, 255, 255))
    c.alpha_composite(body_img, (0, off))
    c.alpha_composite(H[head], (512 - int(512 * S), off + CHIN_AT - int(chins[head] * S)))
    return c.convert("RGB").crop((40, 40, 984, 1024 + off))
TW = 200; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
sample = hero(cutout("body_fighter.jpg"), "human_m"); TH = int(sample.height * TW / sample.width)
sheet = Image.new("RGB", (110 + len(colors) * (TW + 6), 34 + len(classes) * (TH + 8)), "white"); d = ImageDraw.Draw(sheet)
for j, c in enumerate(colors): d.text((110 + j * (TW + 6) + 8, 8), c, fill="#2b1d14", font=f)
for i, cls in enumerate(classes):
    base = cutout(f"body_{cls}.jpg"); y = 34 + i * (TH + 8)
    d.text((8, y + TH // 2 - 10), cls, fill="#2b1d14", font=f)
    for j, c in enumerate(colors):
        body = base if c == "original" else (recolor(base, cls, c) if cls in GARMENT else recolor2(base, cls, c))
        im = hero(body, heads[(i * 5 + j) % 12]).resize((TW, TH), Image.LANCZOS)
        sheet.paste(im, (110 + j * (TW + 6), y))
sheet.save("../shots/all-heroes.png"); print(sheet.size)
