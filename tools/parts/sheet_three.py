from PIL import Image, ImageDraw, ImageFont
from join import cutout
from recolor2 import recolor2
cols = ["original","red","green","blue","purple","pink","black"]
T = 220; f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
sheet = Image.new("RGB", (110 + len(cols) * T, 30 + 3 * T), "white"); d = ImageDraw.Draw(sheet)
for j, c in enumerate(cols): d.text((110 + j * T + 10, 6), c, fill="#2b1d14", font=f)
for i, b in enumerate(["druid","cleric","barbarian"]):
    base = cutout(f"body_{b}.jpg"); d.text((8, 30 + i * T + T // 2), b, fill="#2b1d14", font=f)
    for j, c in enumerate(cols):
        im = base if c == "original" else recolor2(base, b, c)
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        sheet.paste(bg.convert("RGB").resize((T - 6, T - 6)), (110 + j * T, 30 + i * T))
sheet.save("../shots/colors3.png"); print(sheet.size)
