"""Complete heroes: body in its colour, head with headwear in the outfit's colour, wings for fairies, companion.
python3 sheet_full.py  ->  ../shots/full-heroes.png. hero() is also used by review_hatcolor.py."""
import json
from PIL import Image
from join import cutout
from recolor import recolor, GARMENT
from recolor2 import recolor2
import accessories as A, hatcolor as HC
chins = json.load(open("heads.json")); skulls = json.load(open("skulls.json"))
S, CHIN_AT = 0.434, 124
wings = cutout("back_wings.jpg"); _hats = {}
def hero(cls, head, color="original", hat=None, pet=None):
    b = cutout(f"body_{cls}.jpg")
    if color != "original": b = recolor(b, cls, color) if cls in GARMENT else recolor2(b, cls, color)
    h = cutout(f"head_{head}.jpg"); chin = chins[head]
    if hat:
        hi = HC.recolor_hat(_hats.setdefault(hat, A.load_hat(hat)), hat, HC.garment_colours()[f"{cls}/{color}"])
        h = A.head_with_hat(h, head, hat, hi, chins, skulls); chin += A.PAD
    hs = h.resize((int(h.width * S), int(h.height * S)), Image.LANCZOS)
    top = int(A.PAD * S) + 460; right = 320
    c = Image.new("RGBA", (1024 + right, 1024 + top), (255, 255, 255, 255))
    if head.startswith("fairy"):
        w = wings.resize((1024, 1024)); c.alpha_composite(w, (0, top + 300 - 520))
    c.alpha_composite(b, (0, top))
    c.alpha_composite(hs, (512 - int(512 * S), top + CHIN_AT + A.HEAD_DROP.get(head, 0) - int(chin * S)))
    if pet:
        p = A.load_pet(pet); c.alpha_composite(p, (920 - p.width // 2, top + 985 - p.height))
    return c.convert("RGB").crop((60, 200, 1024 + 40, 1024 + top))
if __name__ == "__main__":
    combos = [("fighter","human_m","original","crown","fox"), ("wizard","elf_f","purple","wizard","owl"),
              ("rogue","tabaxi_m","black","cap","cat"), ("cleric","dwarf_m","blue","flowers","hedgehog"),
              ("ranger","fairy_f","original","flowers","wolf"), ("bard","human_f","pink","cap","frog"),
              ("barbarian","dragonborn_m","red",None,"dragon"), ("paladin","dwarf_f","original","crown","raven"),
              ("druid","fairy_m","green","wizard","owl"), ("wizard","dragonborn_f","blue","crown","dragon")]
    ims = [hero(*c) for c in combos]
    TW = 330; TH = int(ims[0].height * TW / ims[0].width)
    sheet = Image.new("RGB", (5 * (TW + 6) + 6, 2 * (TH + 6) + 6), "white")
    for i, im in enumerate(ims): sheet.paste(im.resize((TW, TH), Image.LANCZOS), (6 + (i % 5) * (TW + 6), 6 + (i // 5) * (TH + 6)))
    sheet.save("../shots/full-heroes.png"); print(sheet.size)
