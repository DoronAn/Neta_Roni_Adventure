// The hero as a round relief for 3D printing, and a plate with the team's crest for its back. Head and shoulders,
// headwear included, no companion, like a coin portrait, on a pattern from the hero's homeland.
// The sculpted forms come from pictures made once, ahead of time, by tools/parts/relief_maps.py (a depth model reads
// every look the print page can draw): parts/relief/<species>_<m|f>_<class>_<hat>.webp holds the relief, the drawing's
// bold strokes (engraved into it) and the outline; pattern_<homeland>.webp and plate_<team>.webp the rest.
// Every size is a setting (millimetres). Output: binary STLs, closed (every edge shared by exactly two triangles),
// with the back flat on the print bed.
// A plain script (not a module). Needs PARTS, HeroArt, KIDS.

const Relief = (() => {
  const DEFAULTS = {
    diameter: 50,        // across the whole disc
    rim: 2,              // the ring round the edge, at full height
    base: 3.0,           // the solid disc under the relief
    relief: 2.0,         // the highest relief above the base (the rim, the hero's nearest parts)
    step: 0.6,           // how far the hero stands proud of the patterned field
    groove: 0.4,         // how deep the drawing's bold strokes are engraved
    engrave: 1,          // 1: engrave the strokes; 0: smooth sculpture only
    pocketDiameter: 6.3, pocketDepth: 2.1,   // for a 6 x 2 mm disc magnet, open on the back
    plateBase: 1.0,      // the plate: almost flat, the crest a shallow relief on it
    plateRelief: 0.4,
    grid: 0.1,           // millimetres between height samples
  };
  const PATTERN_MAX = 0.45, PLATE_MAX = 0.4, HALO = 0.5, RIM_GAP = 0.35;   // as relief_maps.py wrote them

  // ---- the portrait (relief_portraits.js draws every look this way) ----
  // Framed by the bare head: the head (ears and horns, no hat) fills FRAC of the frame's height, with ABOVE of the
  // frame left over it for the hat, so every face comes out the same size; a tall hat may run into the rim.
  const FRAC = 0.50, ABOVE = 0.24;
  async function frame(h) {
    const head = await HeroArt.bounds({ ...h, hat: "none" }, "head");
    const side = (head[3] - head[1]) / FRAC, top = head[1] - side * ABOVE, cx = (head[0] + head[2]) / 2;
    return [cx - side / 2, top, cx + side / 2, top + side];
  }
  // The portrait in colour on a square canvas of `px` pixels, in the drawn colours (one plastic colour, so the outfit
  // colour doesn't change the relief).
  async function portrait(h, px) {
    const look = { ...h, colour: "original", pet: "none" };
    const cv = document.createElement("canvas"); cv.width = cv.height = px;
    await HeroArt.draw(cv, look, { part: "portrait", frame: await frame(look), keepSize: true, dpr: 1 });
    return cv;
  }
  // What changes the portrait (not the colour, companion, homeland or strengths).
  const lookKey = (h) => `${h.species}_${h.gender}_${h.cls}_${h.hat}`;

  // ---- pictures and grids ----
  const pictures = new Map();
  function picture(src) {
    if (!pictures.has(src)) pictures.set(src, new Promise((ok, fail) => {
      const im = new Image();
      im.onload = () => {
        const cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        const ctx = cv.getContext("2d"); ctx.drawImage(im, 0, 0);
        ok({ n: cv.width, px: ctx.getImageData(0, 0, cv.width, cv.height).data });
      };
      im.onerror = () => { pictures.delete(src); fail(new Error("missing " + src)); };
      im.src = src;
    }));
    return pictures.get(src);
  }
  const channel = (pic, k, scale = 1) => { const n = pic.n, out = new Float32Array(n * n); for (let i = 0; i < n * n; i++) out[i] = pic.px[i * 4 + k] / 255 * scale; return out; };

  function blur(a, n, sigma) {          // separable gaussian on a Float32Array n x n
    if (sigma <= 0) return a;
    const r = Math.ceil(sigma * 3), k = [];
    let sum = 0; for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); sum += v; }
    k.forEach((v, i) => (k[i] = v / sum));
    const tmp = new Float32Array(n * n), out = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let s = 0; for (let i = -r; i <= r; i++) s += a[y * n + Math.min(n - 1, Math.max(0, x + i))] * k[i + r]; tmp[y * n + x] = s;
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let s = 0; for (let i = -r; i <= r; i++) s += tmp[Math.min(n - 1, Math.max(0, y + i)) * n + x] * k[i + r]; out[y * n + x] = s;
    }
    return out;
  }
  // Distance (in pixels) from each pixel outside the mask to the mask (two-pass chamfer); 0 inside.
  function distanceTo(m, n) {
    const d = new Float32Array(n * n), INF = 1e9, a = 1, b = Math.SQRT2;
    for (let i = 0; i < n * n; i++) d[i] = m[i] ? 0 : INF;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x; if (!d[i]) continue;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + a);
      if (y > 0) { d[i] = Math.min(d[i], d[i - n] + a); if (x > 0) d[i] = Math.min(d[i], d[i - n - 1] + b); if (x < n - 1) d[i] = Math.min(d[i], d[i - n + 1] + b); }
    }
    for (let y = n - 1; y >= 0; y--) for (let x = n - 1; x >= 0; x--) {
      const i = y * n + x; if (!d[i]) continue;
      if (x < n - 1) d[i] = Math.min(d[i], d[i + 1] + a);
      if (y < n - 1) { d[i] = Math.min(d[i], d[i + n] + a); if (x < n - 1) d[i] = Math.min(d[i], d[i + n + 1] + b); if (x > 0) d[i] = Math.min(d[i], d[i + n - 1] + b); }
    }
    return d;
  }
  // Bilinear sample of an n x n map at pixel coordinates (u, v); 0 outside.
  function sample(a, n, u, v) {
    const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    const at = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? 0 : a[y * n + x]);
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
  }
  // A grid of points across the disc; calls f(x, y, r) in millimetres from the centre (y down, as in the pictures).
  function disc(S, f) {
    const N = Math.round(S.diameter / S.grid) + 1, z = new Float32Array(N * N), R = S.diameter / 2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i * S.grid - R, y = j * S.grid - R;
      z[j * N + i] = f(x, y, Math.hypot(x, y));
    }
    return { N, z };
  }

  // ---- the front: the hero, the homeland pattern round it, the rim; the magnet pocket in the back ----
  async function front(h, set = {}) {
    const S = { ...DEFAULTS, ...set };
    const [hero, pat] = await Promise.all([picture(`parts/relief/${lookKey(h)}.webp`), picture(`parts/relief/pattern_${h.homeland}.webp`)]);
    const n = hero.n, win = S.diameter - 2 * S.rim, mm = win / n;          // the maps span the window
    const hn = channel(hero, 0, 1.05), mask = channel(hero, 2).map((v) => (v > 0.5 ? 1 : 0));
    const groove = blur(channel(hero, 1), n, 0.5);
    const pattern = channel(pat, 0, PATTERN_MAX);
    const dist = distanceTo(mask, n), c = n / 2, win2 = win / 2;
    let w = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i;
      if (mask[k]) {
        let zf = S.step + (S.relief - S.step) * Math.min(1.05, hn[k]) - (S.engrave ? S.groove * groove[k] : 0);
        w[k] = Math.max(zf, S.step * 0.6);
      } else {                                                          // the pattern, kept clear of the hero and the rim
        const r = Math.hypot((i + 0.5 - c) * mm, (j + 0.5 - c) * mm);
        const keep = Math.min(1, Math.max(0, (dist[k] * mm - HALO) / 0.15)) * Math.min(1, Math.max(0, (win2 - RIM_GAP - r) / 0.15));
        w[k] = pattern[k] * keep;
      }
    }
    w = blur(w, n, 0.5);
    const top = disc(S, (x, y, r) => {
      const inside = sample(w, n, (x + win2) / mm - 0.5, (y + win2) / mm - 0.5);
      const t = Math.min(1, Math.max(0, (r - win2) / 0.3 + 0.5));       // the rim's inner edge, sloped over 0.3 mm
      return S.base + inside * (1 - t) + S.relief * t;
    });
    const back = disc(S, (x, y, r) => (r <= S.pocketDiameter / 2 ? S.pocketDepth : 0));
    return { S, N: top.N, z: top.z, zb: back.z, top: S.base + S.relief };
  }

  // ---- the plate: the team's crest, almost flat, glued over the magnet ----
  async function plate(h, set = {}) {
    const S = { ...DEFAULTS, ...set };
    const team = KIDS[h.kid].team, pic = await picture(`parts/relief/plate_${team}.webp`);
    const n = pic.n, mm = S.diameter / n, crest = channel(pic, 0, S.plateRelief), R = S.diameter / 2;   // stored as 0..PLATE_MAX
    const top = disc(S, (x, y, r) => {
      const inside = sample(crest, n, (x + R) / mm - 0.5, (y + R) / mm - 0.5);
      const t = Math.min(1, Math.max(0, (r - (R - 1.2)) / 0.2 + 0.5));   // a rim 1.2 mm wide
      return S.plateBase + inside * (1 - t) + S.plateRelief * t;
    });
    return { S, N: top.N, z: top.z, zb: new Float32Array(top.N * top.N), top: S.plateBase + S.plateRelief };
  }

  // ---- STL: a closed mesh between the back (zb) and the top (z), over the grid cells inside the disc ----
  // Image rows run down; the mesh's y runs up, so row j is y = (N - 1 - j).
  function stl(hm, title = "Hero relief, millimetres") {
    const { S, N, z, zb } = hm, R = S.diameter / 2, g = S.grid;
    const inCell = (i, k) => i >= 0 && k >= 0 && i < N - 1 && k < N - 1 && Math.hypot((i + 0.5) * g - R, (k + 0.5) * g - R) <= R - g * 0.5;
    let count = 0;
    for (let k = 0; k < N - 1; k++) for (let i = 0; i < N - 1; i++) {
      if (!inCell(i, k)) continue;
      count += 4;
      if (!inCell(i, k - 1)) count += 2; if (!inCell(i + 1, k)) count += 2; if (!inCell(i, k + 1)) count += 2; if (!inCell(i - 1, k)) count += 2;
    }
    const buf = new ArrayBuffer(84 + count * 50), dv = new DataView(buf);
    for (let i = 0; i < Math.min(80, title.length); i++) dv.setUint8(i, title.charCodeAt(i) & 0x7f);
    dv.setUint32(80, count, true);
    let o = 84;
    const P = (i, k, top) => { const j = N - 1 - k; return [i * g - R, k * g - R, top ? z[j * N + i] : zb[j * N + i]]; };
    const put = (p, q, r) => {
      const u0 = q[0] - p[0], u1 = q[1] - p[1], u2 = q[2] - p[2], v0 = r[0] - p[0], v1 = r[1] - p[1], v2 = r[2] - p[2];
      const nx = u1 * v2 - u2 * v1, ny = u2 * v0 - u0 * v2, nz = u0 * v1 - u1 * v0, l = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true); o += 12;
      for (const v of [p, q, r]) { dv.setFloat32(o, v[0], true); dv.setFloat32(o + 4, v[1], true); dv.setFloat32(o + 8, v[2], true); o += 12; }
      o += 2;
    };
    for (let k = 0; k < N - 1; k++) for (let i = 0; i < N - 1; i++) {
      if (!inCell(i, k)) continue;
      const a = [i, k], b = [i + 1, k], c = [i + 1, k + 1], d = [i, k + 1];       // counter-clockwise seen from above
      put(P(...a, 1), P(...b, 1), P(...c, 1)); put(P(...a, 1), P(...c, 1), P(...d, 1));   // top, facing up
      put(P(...a, 0), P(...c, 0), P(...b, 0)); put(P(...a, 0), P(...d, 0), P(...c, 0));   // back, facing down
      for (const [p, q, ni, nk] of [[a, b, i, k - 1], [b, c, i + 1, k], [c, d, i, k + 1], [d, a, i - 1, k]]) {
        if (inCell(ni, nk)) continue;                                                   // a wall facing out
        put(P(...p, 1), P(...p, 0), P(...q, 0)); put(P(...p, 1), P(...q, 0), P(...q, 1));
      }
    }
    return buf;
  }

  // ---- previews: a lit metal top view, as the file is or as a 0.4 mm nozzle would print it ----
  // As printed: grooves and ridges narrower than the nozzle close up, heights snap to the layers, edges round a little.
  function printed(hm, nozzle = 0.4, layer = 0.08) {
    const { S, N, z } = hm, r = Math.max(1, Math.round(nozzle / 2 / S.grid)), off = [];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) off.push([dx, dy]);
    const filt = (a, pick) => {
      const out = new Float32Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let v = a[y * N + x];
        for (const [dx, dy] of off) { const X = Math.min(N - 1, Math.max(0, x + dx)), Y = Math.min(N - 1, Math.max(0, y + dy)); v = pick(v, a[Y * N + X]); }
        out[y * N + x] = v;
      }
      return out;
    };
    const closed = filt(filt(z, Math.max), Math.min), opened = filt(filt(closed, Math.min), Math.max);
    const snapped = opened.map((v) => Math.round(v / layer) * layer);
    return { ...hm, z: blur(snapped, N, 0.08 / S.grid) };
  }
  function preview(hm, canvas) {
    const { S, N, z } = hm, g = S.grid, ctx = canvas.getContext("2d"); canvas.width = canvas.height = N;
    const img = ctx.createImageData(N, N), R = (N - 1) / 2;
    const el = 38 * Math.PI / 180, lx = -0.62, ly = -0.55, ll = Math.hypot(lx, ly);
    const L = [lx / ll * Math.cos(el), ly / ll * Math.cos(el), Math.sin(el)];
    const Hv = (() => { const v = [L[0], L[1], L[2] + 1], l = Math.hypot(...v); return v.map((x) => x / l); })();
    const cav = blur(z, N, 0.35 / g);
    // cast shadows: march toward the light; lit falls off where the surface ahead stands higher than the ray
    const lit = new Float32Array(N * N).fill(1), rise = Math.tan(el) * g, dx = lx / ll, dy = ly / ll, steps = Math.min(400, Math.round(3 / (Math.tan(el) * g)) + 2);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const z0 = z[j * N + i]; let l = 1;
      for (let s = 1; s < steps && l > 0; s++) {
        const X = Math.round(i + dx * s), Y = Math.round(j + dy * s);
        if (X < 0 || Y < 0 || X >= N || Y >= N) break;
        l = Math.min(l, Math.max(0, Math.min(1, 1 - (z[Y * N + X] - (z0 + s * rise)) / 0.05)));
      }
      lit[j * N + i] = l;
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const p = (j * N + i) * 4;
      if (Math.hypot(i - R, j - R) > R) continue;
      const zx = (z[j * N + Math.min(N - 1, i + 1)] - z[j * N + Math.max(0, i - 1)]) / (2 * g);
      const zy = (z[Math.min(N - 1, j + 1) * N + i] - z[Math.max(0, j - 1) * N + i]) / (2 * g);
      const nl = Math.hypot(zx, zy, 1), n0 = -zx / nl, n1 = -zy / nl, n2 = 1 / nl;
      const diff = Math.max(0, n0 * L[0] + n1 * L[1] + n2 * L[2]);
      const ao = Math.min(1, Math.max(0.45, 1 - 1.6 * Math.max(0, cav[j * N + i] - z[j * N + i])));
      const sp = Math.pow(Math.max(0, n0 * Hv[0] + n1 * Hv[1] + n2 * Hv[2]), 40) * 0.25 * lit[j * N + i];
      const k = (0.30 + 0.80 * diff * lit[j * N + i]) * ao;
      img.data[p] = Math.min(255, 205 * k + 255 * sp); img.data[p + 1] = Math.min(255, 160 * k + 255 * sp); img.data[p + 2] = Math.min(255, 92 * k + 255 * sp); img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  return { DEFAULTS, frame, portrait, lookKey, front, plate, stl, printed, preview };
})();
