"""Every headwear in every outfit colour on every class: one sheet per hat, rows = colours, columns = classes."""
import sys, multiprocessing as mp
from PIL import Image, ImageDraw, ImageFont
import sheet_full as H, hatcolor as HC
HEADS = ["human_m", "elf_f", "dwarf_m", "fairy_f", "tabaxi_m", "dragonborn_f", "human_f", "dwarf_f", "fairy_m", "elf_m", "tabaxi_f", "dragonborn_m"]
def one(args):
    hat, r, c = args
    return H.hero(cls=HC.CLASSES[c], head=HEADS[(r + c) % 12], color=HC.COLOURS[r], hat=hat)
if __name__ == "__main__":
    TW = int(sys.argv[2]) if len(sys.argv) > 2 else 260
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    for hat in sys.argv[1].split(","):
        jobs = [(hat, r, c) for r in range(7) for c in range(9)]
        with mp.Pool(4) as p: ims = p.map(one, jobs)
        TH = int(ims[0].height * TW / ims[0].width)
        sheet = Image.new("RGB", (90 + 9 * (TW + 4), 7 * (TH + 4) + 4), "white"); d = ImageDraw.Draw(sheet)
        for i, im in enumerate(ims):
            r, c = divmod(i, 9)
            sheet.paste(im.resize((TW, TH), Image.LANCZOS), (90 + c * (TW + 4), 4 + r * (TH + 4)))
            if c == 0: d.text((6, 4 + r * (TH + 4) + TH // 2), HC.COLOURS[r], fill="black", font=f)
        sheet.save(f"../shots/hatcolor_{hat}.png"); print(hat, sheet.size, flush=True)
