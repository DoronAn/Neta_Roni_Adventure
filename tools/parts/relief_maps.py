"""Relief pictures for the print page (dev tool; run once, outputs committed to parts/relief/).

For every look (relief_portraits.js draws them), a depth model estimates how near each part of the picture is; that is
turned into a gently sculpted relief (depth jumps compressed into slopes, 0 at the outline, local detail boosted), and
the drawing's bold strokes (outlines, eyes, brows, mouth) are found at the printer's pen width. Also writes the six
homeland patterns and the two team plates. The page (relief.js) puts them together into the print files.

  python3 tools/parts/relief_maps.py <repo root> <portraits dir> <model.onnx> [key,key,...]

Model: Depth Anything V2 Large, ONNX export (github.com/fabio-sim/Depth-Anything-ONNX, release v2.0.0,
depth_anything_v2_vitl_dynamic.onnx, 1.3 GB; never committed). Depth Anything V2 Large is CC BY-NC 4.0 (non-commercial
use only); the Small model (Apache 2.0) works the same way if needed. Needs numpy, scipy, Pillow, onnxruntime.

Outputs, all 512 x 512 lossless WebP, in parts/relief/:
  <species>_<m|f>_<class>_<hat>.webp red = relief (0..1.05 as 0..255), green = groove (255 = engraved), blue = outline
                                     (255 inside), over the medal's window (WIN mm across)
  pattern_<homeland>.webp            grey = pattern height (0..PAT_MAX mm as 0..255) over the window
  plate_<team>.webp                  grey = plate height (0..PLATE_MAX mm as 0..255) over the whole plate (DIAM mm)
"""
import os, sys, time
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.sparse import csr_matrix, diags
from scipy.sparse.linalg import spsolve

DIAM, RIM = 50.0, 2.0
WIN = DIAM - 2 * RIM            # the window inside the rim, mm
PEN = 0.45                      # the narrowest groove a 0.4 mm nozzle keeps, mm
OUT_PX = 512
PAT_MAX = 0.45
PLATE_MAX = 0.4


# ---------------------------------------------------------------- shared
def disk(r):
    r = max(1, int(round(r)))
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    return xx * xx + yy * yy <= r * r


def poisson_dirichlet(mask, gx, gy):
    """Solve lap(h) = div(g) inside mask, h = 0 outside. gx[y, x] = h[y, x+1] - h[y, x]; gy likewise down."""
    H, W = mask.shape
    idx = -np.ones((H, W), np.int64)
    ys, xs = np.nonzero(mask)
    idx[ys, xs] = np.arange(len(ys))
    n = len(ys)
    div = np.zeros((H, W))
    div += gx; div[:, 1:] -= gx[:, :-1]
    div += gy; div[1:, :] -= gy[:-1, :]
    rows, cols, vals = [], [], []
    for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        ny, nx = ys + dy, xs + dx
        ok = (ny >= 0) & (ny < H) & (nx >= 0) & (nx < W)
        j = np.full(n, -1)
        j[ok] = idx[ny[ok], nx[ok]]
        inside = j >= 0
        rows.append(np.arange(n)[inside]); cols.append(j[inside]); vals.append(np.ones(inside.sum()))
    A = csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n)) + diags(np.full(n, -4.0))
    h = spsolve(A.tocsc(), div[ys, xs])
    out = np.zeros((H, W)); out[ys, xs] = h
    return out


def reconstruct(seed, mask):
    """The parts of mask connected to seed (whole strokes from their bold cores)."""
    lab, nl = ndi.label(mask, structure=np.ones((3, 3)))
    keep = np.unique(lab[seed & mask]); keep = keep[keep > 0]
    return np.isin(lab, keep)


def rgb2hsv(rgb):
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dd = np.where(d == 0, 1, d)
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    h = np.where(d == 0, 0, h)
    s = np.where(mx == 0, 0, d / np.where(mx == 0, 1, mx))
    return h, s, mx


class Depth:
    def __init__(self, model):
        import onnxruntime as ort
        so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count() or 4
        self.sess = ort.InferenceSession(model, so, providers=["CPUExecutionProvider"])
        self.inp = self.sess.get_inputs()[0].name

    def __call__(self, rgba, side=518, bgv=255):
        """Relative depth (bigger = nearer) at the picture's own size; the picture is put on white first."""
        im = Image.fromarray(rgba)
        W, H = im.size
        bg = Image.new("RGBA", im.size, (bgv, bgv, bgv, 255)); bg.alpha_composite(im)
        x = np.asarray(bg.convert("RGB").resize((side, side), Image.BICUBIC), dtype=np.float32) / 255.0
        x = (x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
        d = self.sess.run(None, {self.inp: x.transpose(2, 0, 1)[None]})[0]
        d = np.squeeze(d).astype(np.float32)
        return np.asarray(Image.fromarray(d).resize((W, H), Image.BICUBIC))


def sculpt_from_depth(dn, mask, comp=0.02, detail=1.5, detail_sigma=2.0, top_pct=99.7):
    """Depth (0..1) inside mask -> a relief 0..~1: depth jumps compressed into slopes (Poisson), 0 at the outline."""
    gx = np.zeros_like(dn); gy = np.zeros_like(dn)
    gx[:, :-1] = dn[:, 1:] - dn[:, :-1]
    gy[:-1, :] = dn[1:, :] - dn[:-1, :]
    gx[:, :-1] *= mask[:, 1:] & mask[:, :-1]; gx[:, -1] = 0
    gy[:-1, :] *= mask[1:, :] & mask[:-1, :]; gy[-1, :] = 0
    mag = np.hypot(gx, gy); f = 1.0 / (1.0 + mag / comp); gx *= f; gy *= f
    h = poisson_dirichlet(mask, gx, gy)
    h = h - min(0.0, h[mask].min())
    if detail > 0:
        h = h + detail * (h - ndi.gaussian_filter(h, detail_sigma))
    h[~mask] = 0
    return np.clip(h / max(1e-9, np.percentile(h[mask], top_pct)), 0, 1.05)


def bold_strokes(rgb, mask, mmpx, pen=PEN, line_t=0.22, bold_w=0.12, blob_keep=0.55, wide=1.2, min_len=0.7):
    """The strokes the drawing draws boldly, each kept whole and widened to the pen; thin texture strokes (hair strands,
    scales) are left to the sculpture; dark blobs (pupils) as the pen sees them. A soft 0..1 groove map."""
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    ink = np.where(mask, 1 - lum, 0)
    hp = np.clip(ink - ndi.gaussian_filter(ink, wide / mmpx), 0, None)
    line = hp > line_t
    strokes = reconstruct(ndi.binary_opening(line, structure=disk(bold_w / 2 / mmpx)), line)
    lab, nl = ndi.label(strokes, structure=np.ones((3, 3)))
    if nl:
        objs = ndi.find_objects(lab)
        ok = np.zeros(nl + 1, bool)
        for i, sl in enumerate(objs):
            ok[i + 1] = max(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start) * mmpx >= min_len
        strokes = ok[lab]
    g = ndi.gaussian_filter(hp, pen / 2.355 / mmpx)
    blobs = g > blob_keep * np.percentile(g[mask], 99.5)
    m = ndi.binary_dilation(strokes, structure=disk(max(0.0, pen / 2 - 0.04) / mmpx)) | blobs
    m = ndi.binary_opening(m, structure=disk(pen * 0.45 / mmpx))
    m &= ndi.binary_erosion(mask, structure=disk(pen / mmpx))
    return ndi.gaussian_filter(m.astype(np.float64), 0.04 / mmpx)


def silhouette(alpha):
    N = alpha.shape[0]
    yy, xx = np.mgrid[0:N, 0:N]
    c = (N - 1) / 2
    m = (alpha > 0.5) & ((xx - c) ** 2 + (yy - c) ** 2 <= (N / 2) ** 2)
    m = ndi.binary_opening(m, iterations=1)
    lab, nl = ndi.label(m)
    if nl > 1:
        sizes = ndi.sum(m, lab, range(1, nl + 1))
        m = np.isin(lab, 1 + np.nonzero(sizes > 0.002 * N * N)[0])
    return m


def down(a, n=OUT_PX, resample=Image.BILINEAR):
    return np.asarray(Image.fromarray(a.astype(np.float32)).resize((n, n), resample)).astype(np.float64)


# ---------------------------------------------------------------- the heroes
def hero_maps(rgba, depth, work=512):
    """-> relief (0..1.05), groove (0..1), outline mask, all at OUT_PX over the window."""
    a = np.asarray(Image.fromarray(rgba).resize((work, work), Image.LANCZOS)).astype(np.float64) / 255
    d = np.asarray(Image.fromarray(depth.astype(np.float32)).resize((work, work), Image.BICUBIC)).astype(np.float64)
    mw = silhouette(a[..., 3])
    lo, hi = np.percentile(d[mw], [1, 99.5])
    hn = sculpt_from_depth(np.clip((d - lo) / (hi - lo), 0, 1), mw)
    # the strokes at the portrait's full resolution
    A = rgba.astype(np.float64) / 255
    N = A.shape[0]
    mh = silhouette(A[..., 3])
    g = bold_strokes(A[..., :3], mh, WIN / N)
    return down(hn), down(g), down(mh.astype(np.float64)) > 0.5


def save(path, a, mode):
    Image.fromarray(a, mode).save(path + ".part", format="WEBP", lossless=True, quality=100, method=6)
    os.replace(path + ".part", path)


def write_hero(path, hn, g, m):
    """The groove is stored hard (engraved or not); the page softens it a little, as the 0.04 mm blur did."""
    rgb = np.dstack([np.clip(hn / 1.05 * 255, 0, 255), (g > 0.5) * 255.0, m * 255.0]).round().astype(np.uint8)
    save(path, rgb, "RGB")


# ---------------------------------------------------------------- the homeland patterns
H, SOFT = 0.35, 0.06
WR = WIN / 2                    # the window's radius; the prototype's patterns were laid out for 18 mm
SC = WR / 18.0


def fill(sd, h=H):
    t = np.clip((sd + SOFT) / (2 * SOFT), 0, 1)
    return h * t * t * (3 - 2 * t)


def line_sd(dist, w):
    return w / 2 - dist


def circle_sd(X, Y, cx, cy, r):
    return r - np.hypot(X - cx, Y - cy)


def tri_sd(X, Y, ax, ay, bx, by, cx, cy):
    def edge(px, py, qx, qy):
        nx, ny = qy - py, -(qx - px)
        return ((X - px) * nx + (Y - py) * ny) / np.hypot(nx, ny)
    return np.minimum(np.minimum(edge(ax, ay, bx, by), edge(bx, by, cx, cy)), edge(cx, cy, ax, ay))


def stagger(X, Y, sx, sy):
    row = np.floor(Y / sy + 0.5)
    off = np.where(np.mod(row, 2) == 0, 0.0, sx / 2)
    col = np.floor((X - off) / sx + 0.5)
    return X - (col * sx + off), Y - row * sy, row, col


def sea(X, Y):
    s, P, A, w = 2.5, 5.0, 0.65, 0.7
    row = np.floor(Y / s + 0.5); yk = row * s
    ph = np.where(np.mod(row, 2) == 0, 0.0, np.pi)
    curve = yk + A * np.sin(2 * np.pi * X / P + ph)
    slope = A * 2 * np.pi / P * np.cos(2 * np.pi * X / P + ph)
    return fill(line_sd(np.abs(Y - curve) / np.sqrt(1 + slope ** 2), w))


def desert(X, Y):
    z = np.zeros_like(X)
    sx, sy, r = -10.5 * SC, -9.5 * SC, 2.4 * SC
    z = np.maximum(z, fill(circle_sd(X, Y, sx, sy, r)))
    th = np.arctan2(Y - sy, X - sx); rr = np.hypot(X - sx, Y - sy)
    k = np.abs(np.mod(th * 12 / (2 * np.pi), 1.0) - 0.5) * 2
    ray = (rr > r + 0.6) & (rr < r + 2.4 * SC)
    z = np.maximum(z, fill(np.where(ray, (0.5 - k) * (2 * np.pi * rr / 12) * 0.5, -1)))
    s, P, A, w = 2.6, 15.0, 1.1, 0.65
    row = np.floor((Y - 0.5) / s + 0.5); yk = row * s + 0.5
    curve = yk + A * np.sin(2 * np.pi * X / P + row * 1.3)
    slope = A * 2 * np.pi / P * np.cos(2 * np.pi * X / P + row * 1.3)
    dunes = np.where(yk > -2.0, fill(line_sd(np.abs(Y - curve) / np.sqrt(1 + slope ** 2), w)), 0.0)
    return np.maximum(z, dunes)


def forest(X, Y):
    lx, ly, row, col = stagger(X, Y, 5.6, 6.8)
    z = np.zeros_like(X)
    for top, wid, base in [(-2.9, 2.2, -1.0), (-1.6, 2.6, 0.4), (-0.2, 3.0, 1.8)]:
        z = np.maximum(z, fill(tri_sd(lx, ly, 0.0, top, -wid / 2, base, wid / 2, base)))
    return np.maximum(z, fill(np.minimum(0.4 - np.abs(lx), np.minimum(ly - 1.6, 2.7 - ly))))


def mountains(X, Y):
    z = np.zeros_like(X)
    for rw in range(-6, 7):
        y0 = rw * 4.4
        for cl in range(-6, 7):
            j = (rw * 7 + cl * 13) % 5
            x0 = cl * 6.0 + (3.0 if rw % 2 else 0.0) + (j - 2) * 0.35
            half = 2.6 + 0.25 * ((j * 3) % 4); hgt = 3.6 + 0.4 * ((j * 2) % 3)
            peak = tri_sd(X, Y, x0, y0 - hgt, x0 - half, y0 + 0.6, x0 + half, y0 + 0.6)
            inside = peak > -SOFT
            capline = y0 - hgt + hgt * 0.42 + 0.3 * np.abs(np.mod((X - x0) * 1.3, 1.0) - 0.5) * 2
            shape = np.maximum(fill(peak, 0.2), fill(np.minimum(peak, capline - Y), 0.45))
            z = np.where(inside, shape, z)
    return z


def caves(X, Y):
    z = np.zeros_like(X)
    rng = np.random.default_rng(11)
    R = WR - 0.4
    clusters = int(round(13 * SC))
    for c in range(clusters):
        a0 = 2 * np.pi * c / clusters + rng.uniform(-0.1, 0.1)
        for j in range(4):
            a = a0 + rng.uniform(-0.2, 0.2)
            L = rng.uniform(3.2, 6.0); W = rng.uniform(1.3, 1.9); tilt = rng.uniform(-0.45, 0.45)
            bx, by = (R + 0.6) * np.cos(a), (R + 0.6) * np.sin(a)
            dx, dy = -np.cos(a + tilt), -np.sin(a + tilt)
            px, py = -dy, dx
            u = (X - bx) * dx + (Y - by) * dy; v = (X - bx) * px + (Y - by) * py
            tipL = L - W * 0.9
            side = W / 2 - np.abs(v)
            shape = np.where(u < tipL, np.minimum(side, u), np.minimum((L - u) * (W / 2) / (W * 0.9) - np.abs(v), side))
            z = np.maximum(z, fill(shape, 0.22))
            z = np.maximum(z, fill(np.minimum(shape, v - 0.0), 0.45))
    return z


def valley(X, Y):
    lx, ly, row, col = stagger(X, Y, 5.2, 4.6)
    rot = row * 0.7 + col * 1.3
    z = np.zeros_like(X)
    for k in range(5):
        a = rot + 2 * np.pi * k / 5
        z = np.maximum(z, fill(circle_sd(lx, ly, 1.05 * np.cos(a), 1.05 * np.sin(a), 0.72), H * 0.75))
    return np.maximum(z, fill(circle_sd(lx, ly, 0, 0, 0.55), H))


PATTERNS = {"mountains": mountains, "forest": forest, "sea": sea, "desert": desert, "valley": valley, "caves": caves}


def pattern_map(home, n=OUT_PX):
    c = (np.arange(n) + 0.5) * (WIN / n) - WIN / 2
    X, Y = np.meshgrid(c, c)
    return PATTERNS[home](X, Y)


# ---------------------------------------------------------------- the team plates
def cutout(path, thresh=232):
    """White background removed by flood fill from the edges (as tools/parts/join.py)."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    light = a.min(axis=2) >= thresh
    lab, _ = ndi.label(light)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    return np.dstack([a.astype(np.uint8), np.where(bg, 0, 255).astype(np.uint8)])


def plate_map(team, root, depth):
    """The crest as a shallow relief: the animal rounded from the depth model with its bold strokes engraved, the crest's
    inner ring raised. Heights (mm) over the whole plate (DIAM) at OUT_PX."""
    rgba = cutout(os.path.join(root, "parts", "raw", f"crest_{team}.jpg"))
    a = rgba.astype(np.float64) / 255
    N = a.shape[0]
    rim_in = DIAM / 2 - 1.2
    mmpx = rim_in / 470.0                       # the crest's gold band starts at 470 px from its centre
    h, s, v = rgb2hsv(a[..., :3])
    yy, xx = np.mgrid[0:N, 0:N]
    r = np.hypot(xx - (N - 1) / 2, yy - (N - 1) / 2)
    field = ((h > 160) & (h < 200) & (s > 0.22) & (v > 0.35)) if team == "neta" else ((h > 18) & (h < 40) & (s > 0.62) & (v > 0.72))
    m = (r < 432) & ~field & (a[..., 3] > 0.5)
    m = ndi.binary_opening(m, structure=disk(3))
    m = ndi.binary_fill_holes(ndi.binary_closing(m, structure=disk(4)))
    lab, nl = ndi.label(m)
    if nl:
        sizes = ndi.sum(m, lab, range(1, nl + 1))
        m = np.isin(lab, 1 + np.nonzero(sizes > 0.002 * N * N)[0])
    d = depth(rgba).astype(np.float64)
    lo, hi = np.percentile(d[m], [1, 99.5])
    k = 2
    hn = sculpt_from_depth(np.clip((d - lo) / (hi - lo), 0, 1)[::k, ::k], m[::k, ::k], detail=1.0, top_pct=99.5)
    hn = np.clip(down(hn, N, Image.BICUBIC), 0, 1)
    STEP, GROOVE, H_RING = 0.15, 0.15, 0.3
    z = np.where(m, STEP + (PLATE_MAX - STEP) * hn - GROOVE * bold_strokes(a[..., :3], m, mmpx), 0.0)
    z = np.where(m, np.maximum(z, 0.08), 0.0)
    ring = np.clip(1 - (np.abs(r * mmpx - 444 * mmpx) - 0.3) / 0.05, 0, 1)
    z = ndi.gaussian_filter(np.maximum(z, H_RING * ring), 0.8)
    # resample onto the plate: OUT_PX over DIAM mm, centred
    c = (np.arange(OUT_PX) + 0.5) * (DIAM / OUT_PX) - DIAM / 2
    X, Y = np.meshgrid(c, c)
    return ndi.map_coordinates(z, [Y / mmpx + (N - 1) / 2, X / mmpx + (N - 1) / 2], order=1, mode="constant", cval=0.0)


def grey(path, z, zmax):
    save(path, np.clip(z / zmax * 255, 0, 255).round().astype(np.uint8), "L")


# ---------------------------------------------------------------- run
def main():
    root, portraits, model = sys.argv[1:4]
    only = set(sys.argv[4].split(",")) if len(sys.argv) > 4 else None
    out = os.path.join(root, "parts", "relief")
    os.makedirs(out, exist_ok=True)
    for home in PATTERNS:
        p = os.path.join(out, f"pattern_{home}.webp")
        if not os.path.exists(p):
            grey(p, pattern_map(home), PAT_MAX)
    depth = Depth(model)
    for team in ("neta", "roni"):
        p = os.path.join(out, f"plate_{team}.webp")
        if not os.path.exists(p):
            grey(p, plate_map(team, root, depth), PLATE_MAX)
            print("plate", team, flush=True)
    keys = sorted(f[:-4] for f in os.listdir(portraits) if f.endswith(".png"))
    if only:
        keys = [k for k in keys if k in only]
    t0, done = time.time(), 0
    for i, key in enumerate(keys):
        p = os.path.join(out, f"{key}.webp")
        if os.path.exists(p):
            continue
        rgba = np.asarray(Image.open(os.path.join(portraits, f"{key}.png")).convert("RGBA"))
        hn, g, m = hero_maps(rgba, depth(rgba))
        write_hero(p, hn, g, m)
        done += 1
        print(f"{i + 1}/{len(keys)} {key} {(time.time() - t0) / done:.1f} s each", flush=True)
    print("done", done, flush=True)


if __name__ == "__main__":
    main()
