from PIL import Image, ImageDraw, ImageFont
from join import cutout
from recolor import recolor, GARMENT, TARGETS
T = 170; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
cols = ["original"] + list(TARGETS)
sheet = Image.new("RGB", (100 + len(cols) * T, 30 + len(GARMENT) * T), "white"); d = ImageDraw.Draw(sheet)
for j, c in enumerate(cols): d.text((100 + j * T + 10, 6), c, fill="#2b1d14", font=f)
for i, body in enumerate(GARMENT):
    base = cutout(f"body_{body}.jpg")
    d.text((8, 30 + i * T + T // 2), body, fill="#2b1d14", font=f)
    for j, c in enumerate(cols):
        im = base if c == "original" else recolor(base, body, c)
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        sheet.paste(bg.convert("RGB").resize((T - 6, T - 6)), (100 + j * T, 30 + i * T))
sheet.save("../shots/colors.png"); print(sheet.size)
