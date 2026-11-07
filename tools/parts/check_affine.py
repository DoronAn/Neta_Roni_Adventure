import json, numpy as np, accessories as A
from PIL import Image
from join import cutout
ch = json.load(open("heads.json")); sk = json.load(open("skulls.json"))
def draw(img, M, size):
    Mi = np.linalg.inv(M); return img.transform(size, Image.AFFINE, tuple(Mi[:2].ravel()), resample=Image.BICUBIC)
def halves(img):
    a = np.asarray(img); h = img.height // 2
    b = a.copy(); b[h:, :, 3] = 0; f = a.copy(); f[:h, :, 3] = 0
    return Image.fromarray(b, "RGBA"), Image.fromarray(f, "RGBA")
worst = []
for hat in A.HATS:
    hi = A.load_hat(hat)
    for n in ch:
        src = cutout(f"head_{n}.jpg"); pl = A.place(src, n, hat, hi, ch, sk); size = (src.width, src.height + A.PAD)
        ref = Image.new("RGBA", size, (0, 0, 0, 0))
        for im, xy in pl["back"] + pl["front"]: ref.alpha_composite(im, xy)
        new = Image.new("RGBA", size, (0, 0, 0, 0))
        if "full" in pl["M"]: new.alpha_composite(draw(hi, pl["M"]["full"], size))
        else:
            b, f = halves(hi); new.alpha_composite(draw(b, pl["M"]["back"], size)); new.alpha_composite(draw(f, pl["M"]["front"], size))
        ra, na = np.asarray(ref)[..., 3] > 128, np.asarray(new)[..., 3] > 128
        iou = (ra & na).sum() / max(1, (ra | na).sum())
        ys, xs = np.where(ra); ys2, xs2 = np.where(na)
        off = (xs2.mean() - xs.mean(), ys2.mean() - ys.mean())
        worst.append((iou, hat, n, round(off[0], 1), round(off[1], 1)))
worst.sort()
for w in worst[:6]: print(w)
print("min IoU", round(worst[0][0], 4))
