import json, sys
from PIL import Image, ImageDraw, ImageFont
from join import cutout
chins = json.load(open("heads.json")); S, CHIN_AT = 0.434, 124
SPOT = {"fighter": (772, 492, 130), "wizard": (585, 330, 120), "rogue": (512, 330, 120), "cleric": (512, 700, 120),
        "ranger": (600, 300, 110), "bard": (440, 275, 110), "barbarian": (512, 330, 120), "druid": (512, 330, 120),
        "paladin": (512, 655, 120)}   # crest: centre and diameter on the 1024 px body
crests = {t: cutout(f"crest_{t}.jpg") for t in ("neta", "roni")}
for t in crests: crests[t] = crests[t].crop(crests[t].getbbox())
heads = {"neta": ["human_f", "elf_m", "dwarf_m", "tabaxi_f", "fairy_f"], "roni": ["human_m", "elf_f", "dragonborn_m", "tabaxi_m", "dwarf_f"]}
classes = ["fighter","wizard","rogue","cleric","ranger","bard","barbarian","druid","paladin"]
def hero(cls, head, team):
    b = cutout(f"body_{cls}.jpg"); h = cutout(f"head_{head}.jpg").resize((int(1024 * S),) * 2, Image.LANCZOS)
    off = int(1024 * S); c = Image.new("RGBA", (1024, 1024 + off), (255, 255, 255, 255))
    CX, CY, CD = SPOT[cls]; cr = crests[team].resize((CD, CD), Image.LANCZOS)
    c.alpha_composite(b, (0, off)); c.alpha_composite(cr, (CX - CD // 2, off + CY - CD // 2))
    c.alpha_composite(h, (512 - int(512 * S), off + CHIN_AT - int(chins[head] * S)))
    return c.convert("RGB").crop((40, 40, 984, 1024 + off))
TW = 260; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
rows = []
for team in ("neta", "roni"):
    rows.append([hero(cls, heads[team][i % 5], team) for i, cls in enumerate(classes)])
TH = int(rows[0][0].height * TW / rows[0][0].width)
sheet = Image.new("RGB", (9 * (TW + 6) + 6, 2 * (TH + 30) + 6), "white"); d = ImageDraw.Draw(sheet)
for r, team in enumerate(("neta", "roni")):
    d.text((8, 6 + r * (TH + 30)), f"team {team}", fill="#2b1d14", font=f)
    for i, im in enumerate(rows[r]): sheet.paste(im.resize((TW, TH), Image.LANCZOS), (6 + i * (TW + 6), 28 + r * (TH + 30)))
sheet.save("../shots/crests-on-body.png"); print(sheet.size)
