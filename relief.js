// The hero as a round relief for 3D printing: head and shoulders, headwear included, no companion, like a coin
// portrait. Built from the same pictures as the card (hero.js): the hero's silhouette is raised as a plateau and the
// drawing's black lines are raised on it, thickened so they print; a rim runs round the edge; a pocket for a disc
// magnet is left open in the back. Every size is a setting (millimetres). Output: a binary STL, closed (every edge
// shared by exactly two triangles), with the back flat on the print bed.
// A plain script (not a module). Needs PARTS, HeroArt.

const Relief = (() => {
  const DEFAULTS = {
    diameter: 40,        // across the whole disc
    rim: 2,              // the ring round the edge, at full height
    base: 4.0,           // the solid disc under the relief (deeper than the pocket, so the pocket can't cut through)
    relief: 1.6,         // the highest relief above the base (the rim and the lines)
    plateau: 0.9,        // how far the figure rises above the base at its middle; the lines rise the rest of the way
    dome: 1.6,           // how far in from its edge the figure takes to rise to full height (a rounded, coin-like body)
    pocketDiameter: 10.2, pocketDepth: 3.2,   // for a 10 x 3 mm disc magnet, open on the back
    grid: 0.15,          // millimetres between height samples
    minLine: 0.6,        // the thinnest raised line (a 0.4 mm nozzle lays it as one or two lines)
  };
  const SHOULDERS = 340;   // the portrait's bottom, in hero space (body pixels): below the shoulders

  // ---- masks on a square grid (Uint8Array of 0/1, n x n) ----
  function dilate(m, n, r) {
    const out = new Uint8Array(n * n), off = [];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r) off.push([dx, dy]);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!m[y * n + x]) continue;
      for (const [dx, dy] of off) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) out[Y * n + X] = 1; }
    }
    return out;
  }
  const invert = (m) => m.map((v) => 1 - v);
  const erode = (m, n, r) => invert(dilate(invert(m), n, r));
  // Drops connected pieces smaller than `min` pixels.
  function despeck(m, n, min) {
    const seen = new Uint8Array(n * n), out = new Uint8Array(m);
    for (let i = 0; i < n * n; i++) {
      if (!m[i] || seen[i]) continue;
      const stack = [i], piece = []; seen[i] = 1;
      while (stack.length) {
        const j = stack.pop(); piece.push(j); const x = j % n, y = (j / n) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy, k = Y * n + X;
          if (X >= 0 && Y >= 0 && X < n && Y < n && m[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
        }
      }
      if (piece.length < min) for (const j of piece) out[j] = 0;
    }
    return out;
  }
  // Distance (in pixels) from each pixel inside the mask to the nearest pixel outside it (two-pass chamfer).
  function distance(m, n) {
    const d = new Float32Array(n * n), INF = 1e9, a = 1, b = Math.SQRT2;
    for (let i = 0; i < n * n; i++) d[i] = m[i] ? INF : 0;
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
  function blur(a, n, sigma) {          // separable gaussian on a Float32Array n x n
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

  // The portrait drawn in colour on a square canvas of `px` pixels, framed from just above the headwear to below the
  // shoulders, centred on the body.
  async function portrait(h, px) {
    const b = await HeroArt.bounds(h, "portrait");
    const top = b[1] - (SHOULDERS - b[1]) * 0.04, side = SHOULDERS - top;
    const cv = document.createElement("canvas"); cv.width = cv.height = px;
    await HeroArt.draw(cv, h, { part: "portrait", frame: [512 - side / 2, top, 512 + side / 2, top + side], keepSize: true, dpr: 1 });
    return cv;
  }

  // The height map: z in millimetres at every grid point across the disc, plus the masks for the preview.
  async function heights(h, set = {}) {
    const S = { ...DEFAULTS, ...set };
    const N = Math.round(S.diameter / S.grid) + 1;           // grid points across the disc
    const inner = S.diameter - 2 * S.rim;
    const n = Math.round(inner / S.grid), n2 = n * 2;          // the portrait square, and twice as fine for the masks
    const cv = await portrait(h, n2);
    const px = cv.getContext("2d").getImageData(0, 0, n2, n2).data;
    let sil = new Uint8Array(n2 * n2), dark = new Uint8Array(n2 * n2);
    const c = n2 / 2;
    for (let i = 0; i < n2 * n2; i++) {
      const x = i % n2 + 0.5 - c, y = ((i / n2) | 0) + 0.5 - c;
      if (x * x + y * y > c * c) continue;                        // only inside the round window
      const a = px[i * 4 + 3] / 255, lum = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
      if (a > 0.5) { sil[i] = 1; if (lum < 0.3) dark[i] = 1; }
    }
    const fine = S.grid / 2;                                       // millimetres per mask pixel
    // the drawing's lines: dark, and not part of a wide dark area (a black cloak stays figure, not line)
    const wideR = Math.round(0.5 / fine);                          // dark areas more than about a millimetre across
    const wide = dilate(erode(dark, n2, wideR), n2, wideR);
    let line = dark.map((v, i) => (v && !wide[i] ? 1 : 0));
    line = dilate(line, n2, Math.max(1, Math.round(S.minLine / fine / 2 - 2)));      // thickened so they print
    line = despeck(line, n2, Math.round((S.minLine / fine) ** 2 * 0.6));
    sil = despeck(sil.map((v, i) => v | line[i]), n2, Math.round((2 / fine) ** 2));
    for (let i = 0; i < n2 * n2; i++) {                            // clip the thickened lines to the window again
      const x = i % n2 + 0.5 - c, y = ((i / n2) | 0) + 0.5 - c;
      if (x * x + y * y > c * c) { sil[i] = 0; line[i] = 0; }
    }
    // the figure rises from its edge like a rounded body: height grows with the distance in from the edge
    const dist = distance(sil, n2), D0 = S.dome / fine;
    const body = dist.map((d) => (d <= 0 ? 0 : Math.sqrt(Math.min(1, d / D0)) * 0.75 + 0.25));
    // down to the grid, averaging 2 x 2, so edges slope
    const bodyF = new Float32Array(n * n), lineF = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let s = 0, l = 0;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const j = (y * 2 + dy) * n2 + x * 2 + dx; s += body[j]; l += line[j]; }
      bodyF[y * n + x] = s / 4; lineF[y * n + x] = l / 4;
    }
    const top = blur(bodyF.map((s, i) => Math.min(S.relief, s * S.plateau + lineF[i] * (S.relief - S.plateau))), n, 0.6);
    // every grid point across the disc: base + relief inside the window, the rim outside it
    const z = new Float32Array(N * N), zb = new Float32Array(N * N), R = S.diameter / 2, Ri = inner / 2, off = (S.diameter - inner) / 2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i * S.grid - R, y = j * S.grid - R, r = Math.hypot(x, y);
      const u = Math.round((i * S.grid - off) / S.grid), v = Math.round((j * S.grid - off) / S.grid);
      const inside = u >= 0 && v >= 0 && u < n && v < n ? top[v * n + u] : 0;
      const t = Math.min(1, Math.max(0, (r - Ri) / 0.3 + 0.5));          // the rim's inner edge, sloped over 0.3 mm
      z[j * N + i] = S.base + inside * (1 - t) + S.relief * t;
      zb[j * N + i] = r <= S.pocketDiameter / 2 ? S.pocketDepth : 0;     // the pocket in the back
    }
    return { S, N, z, zb, portrait: cv };
  }

  // A closed mesh between the back (zb) and the top (z), over the grid cells inside the disc, walled at the edge.
  // Image rows run down; the mesh's y runs up, so row j is y = (N - 1 - j).
  function stl(hm) {
    const { S, N, z, zb } = hm, R = S.diameter / 2, g = S.grid;
    const inCell = (i, k) => i >= 0 && k >= 0 && i < N - 1 && k < N - 1 && Math.hypot((i + 0.5) * g - R, (k + 0.5) * g - R) <= R - g * 0.5;
    const tris = [];
    const P = (i, k, top) => { const j = N - 1 - k; return [i * g - R, k * g - R, top ? z[j * N + i] : zb[j * N + i]]; };
    for (let k = 0; k < N - 1; k++) for (let i = 0; i < N - 1; i++) {
      if (!inCell(i, k)) continue;
      const a = [i, k], b = [i + 1, k], c = [i + 1, k + 1], d = [i, k + 1];        // counter-clockwise seen from above
      tris.push([P(...a, 1), P(...b, 1), P(...c, 1)], [P(...a, 1), P(...c, 1), P(...d, 1)]);   // top, facing up
      tris.push([P(...a, 0), P(...c, 0), P(...b, 0)], [P(...a, 0), P(...d, 0), P(...c, 0)]);   // back, facing down
      // a wall on each side of the cell that has no cell beyond it, facing out
      for (const [p, q, ni, nk] of [[a, b, i, k - 1], [b, c, i + 1, k], [c, d, i, k + 1], [d, a, i - 1, k]]) {
        if (inCell(ni, nk)) continue;
        tris.push([P(...p, 1), P(...p, 0), P(...q, 0)], [P(...p, 1), P(...q, 0), P(...q, 1)]);
      }
    }
    const buf = new ArrayBuffer(84 + tris.length * 50), dv = new DataView(buf);
    const head = "Hero relief, millimetres"; for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
    dv.setUint32(80, tris.length, true);
    let o = 84;
    for (const [p, q, r] of tris) {
      const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      const nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0], l = Math.hypot(nx, ny, nz) || 1;
      for (const val of [nx / l, ny / l, nz / l, ...p, ...q, ...r]) { dv.setFloat32(o, val, true); o += 4; }
      o += 2;
    }
    return buf;
  }

  // A lit, bronze-coloured view of the top, for the page.
  function preview(hm, canvas) {
    const { S, N, z } = hm, ctx = canvas.getContext("2d"); canvas.width = canvas.height = N;
    const img = ctx.createImageData(N, N), L = [-0.55, -0.65, 0.52], R = (N - 1) / 2;   // light from the upper left, fairly low, as on a shelf
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const p = (j * N + i) * 4;
      if (Math.hypot(i - R, j - R) > R) continue;
      const zx = (z[j * N + Math.min(N - 1, i + 1)] - z[j * N + Math.max(0, i - 1)]) / (2 * S.grid);
      const zy = (z[Math.min(N - 1, j + 1) * N + i] - z[Math.max(0, j - 1) * N + i]) / (2 * S.grid);
      const n = [-zx, -zy, 1], l = Math.hypot(...n), sh = Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / l);
      const k = 0.35 + 0.75 * sh;
      img.data[p] = Math.min(255, 196 * k); img.data[p + 1] = Math.min(255, 150 * k); img.data[p + 2] = Math.min(255, 92 * k); img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  return { DEFAULTS, heights, stl, preview };
})();
