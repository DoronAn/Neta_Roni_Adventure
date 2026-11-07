from PIL import Image, ImageDraw
import numpy as np
from collections import deque

def cutout(path, thresh=232):
    im = Image.open(path).convert("RGB"); a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    light = a.min(axis=2) >= thresh
    bg = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if light[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if light[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([a.astype(np.uint8), alpha]), "RGBA")

if __name__ == "__main__":
    head = cutout("head_human_m.jpg")
    body = cutout("body_fighter.jpg")
    # erase the body's neck stub (everything above the collar, around the neck)
    b = np.asarray(body).copy(); b[:110, 430:600, 3] = 0; body = Image.fromarray(b, "RGBA")
    
    def join(scale, neck_row_at, out):
        hw, hh = head.size
        hs = head.resize((int(hw * scale), int(hh * scale)), Image.LANCZOS)
        # head's straight-neck row (y=800 in the source) and neck centre x (~513)
        hx = int(513 * scale); hy = int(800 * scale)
        W, H = 1024, 1024 + int(hh * scale)
        canvas = Image.new("RGBA", (W, H), (255, 255, 255, 0))
        off = H - 1024
        bx, by = 513, neck_row_at   # body neck centre and the row the head's neck should reach
        canvas.alpha_composite(hs, (bx - hx, off + by - hy))
        canvas.alpha_composite(body, (0, off))
        bbox = canvas.getbbox(); c = canvas.crop(bbox)
        bgc = Image.new("RGBA", (c.width + 80, c.height + 80), (255, 255, 255, 255)); bgc.alpha_composite(c, (40, 40))
        bgc.convert("RGB").save(out); return bgc
    
    a = join(0.38, 118, "join_a.png")
    b2 = join(0.52, 128, "join_b.png")
    # side by side
    T = 700
    def fit(im): r = T / im.height; return im.resize((int(im.width * r), T))
    A, B = fit(a), fit(b2)
    s = Image.new("RGB", (A.width + B.width + 60, T + 20), "white"); s.paste(A.convert("RGB"), (10, 10)); s.paste(B.convert("RGB"), (A.width + 50, 10))
    s.save("../shots/doll-test.png"); print(s.size)
