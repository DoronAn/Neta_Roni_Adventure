import json
from PIL import Image, ImageDraw, ImageFont
from join import cutout
chins = json.load(open("heads.json")); chins["human_m"] = chins.get("human_m", chins.get("human_m"))
S, CHIN_AT = 0.434, 124
def hero(body, head):
    b = cutout(f"body_{body}.jpg")
    hf = "head_human_m.jpg" if head == "human_m" else f"head_{head}.jpg"
    h = cutout(hf).resize((int(1024 * S), int(1024 * S)), Image.LANCZOS)
    off = int(1024 * S)
    c = Image.new("RGBA", (1024, 1024 + off), (255, 255, 255, 0))
    c.alpha_composite(b, (0, off))
    c.alpha_composite(h, (512 - int(512 * S), off + CHIN_AT - int(chins[head] * S)))
    bg = Image.new("RGBA", c.size, (255, 255, 255, 255)); bg.alpha_composite(c)
    return bg.convert("RGB")
pairs = [("fighter","human_f"),("bard","elf_m"),("druid","fairy_f"),("cleric","dwarf_m"),("paladin","human_m"),
         ("ranger","elf_f"),("wizard","dragonborn_m"),("barbarian","dwarf_f"),("rogue","tabaxi_m")]
W = 300; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
ims = [hero(b, h) for b, h in pairs]
ims = [im.resize((W, int(im.height * W / im.width))) for im in ims]
H = ims[0].height
sheet = Image.new("RGB", (5 * (W + 10) + 10, 2 * (H + 30) + 10), "white"); d = ImageDraw.Draw(sheet)
for i, ((b, h), im) in enumerate(zip(pairs, ims)):
    x = 10 + (i % 5) * (W + 10); y = 10 + (i // 5) * (H + 30)
    sheet.paste(im, (x, y + 24)); d.text((x + 6, y), f"{b} + {h}", fill="#2b1d14", font=f)
sheet.save("../shots/bodies.png"); print(sheet.size)
