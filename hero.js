// Draws a hero from its pictures. Every picture comes from tools/parts/build_web.py, already coloured and cut;
// this file only stacks them, each with the transform parts.js gives it (picture pixels -> "hero space", the
// body picture's own pixels). Used by the screens now, and by the card and the print page later.
// A plain script (not a module), like the rest of the site.

const HeroArt = (() => {
  const cache = new Map();
  function load(src) {
    if (!cache.has(src)) {
      cache.set(src, new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => { cache.delete(src); reject(new Error("missing picture " + src)); };
        im.src = src;
      }));
    }
    return cache.get(src);
  }

  const headKey = (h) => `${h.species}_${h.gender}`;

  // The head picture for this head under this hat: the hair under a wizard hat or cap is cut away.
  function headLayer(key, hat) {
    let v = PARTS.heads[key][hat || "none"];
    if (v === "none") v = PARTS.heads[key].none;
    return v;
  }

  function hatSrc(name, h) {
    return PARTS.hat_src.replace("{hat}", name).replace("{cls}", h.cls).replace("{col}", h.colour || "original");
  }

  // The layers, back to front. part: "all" (the whole hero), "head" (head and hat only), "body" (no hat or pet).
  function layers(h, part = "all") {
    const out = [];
    const key = headKey(h);
    const hat = part === "body" ? "none" : (h.hat || "none");
    const withBody = part !== "head" && h.cls;
    if (withBody && h.species === "fairy") out.push(PARTS.wings);
    if (withBody) out.push({ src: PARTS.bodies[`${h.cls}/${h.colour || "original"}`], m: PARTS.body_m });
    const cls = h.cls || "fighter";               // before a class is picked, hats show in the fighter's colours
    const hh = { ...h, cls };
    if (hat === "flowers") out.push({ src: hatSrc("flowers_back", hh), m: PARTS.hats.flowers[key].back });
    out.push(headLayer(key, hat));
    if (hat === "flowers") out.push({ src: hatSrc("flowers_front", hh), m: PARTS.hats.flowers[key].front });
    else if (hat !== "none") out.push({ src: hatSrc(hat, hh), m: PARTS.hats[hat][key].full });
    if (part === "all" && h.pet && h.pet !== "none") out.push(PARTS.pets[h.pet]);
    return out;
  }

  // Where a picture lands in hero space: the four corners through its transform.
  function rect(im, m) {
    const xs = [], ys = [];
    for (const [x, y] of [[0, 0], [im.width, 0], [0, im.height], [im.width, im.height]]) {
      xs.push(m[0] * x + m[2] * y + m[4]); ys.push(m[1] * x + m[3] * y + m[5]);
    }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }


  // Draws hero h on a canvas, fitted inside it and standing on its bottom edge.
  // opts.part as in layers(); opts.frame: [x0, y0, x1, y1] in hero space, or "fit" to frame the layers tightly;
  // opts.outline: a white sticker edge this many CSS pixels wide, with a soft shadow (for a hero on a picture).
  async function draw(canvas, h, opts = {}) {
    const part = opts.part || "all";
    const ls = layers(h, part);
    const ims = await Promise.all(ls.map((l) => load(l.src)));
    // "fit": tight around the layers. The whole hero ("all") is framed tight too, but kept centred on the body, so
    // a companion at the right foot doesn't push the hero sideways, with a little air around it.
    let frame = opts.frame || "fit";
    if (frame === "fit") {
      frame = [Infinity, Infinity, -Infinity, -Infinity];
      ims.forEach((im, i) => {
        const r = rect(im, ls[i].m);
        frame = [Math.min(frame[0], r[0]), Math.min(frame[1], r[1]), Math.max(frame[2], r[2]), Math.max(frame[3], r[3])];
      });
      if (part === "all") {
        const half = Math.max(512 - frame[0], frame[2] - 512), air = (frame[3] - frame[1]) * 0.04;
        frame = [512 - half - air, frame[1] - air, 512 + half + air, frame[3] + air * 0.5];
      }
    }
    const dpr = opts.dpr || window.devicePixelRatio || 1;
    const cw = canvas.clientWidth || canvas.width, ch = canvas.clientHeight || canvas.height;
    if (!opts.keepSize) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
    const W = canvas.width, H = canvas.height;
    const fw = frame[2] - frame[0], fh = frame[3] - frame[1];
    const k = Math.min(W / fw, H / fh);
    const ox = (W - fw * k) / 2 - frame[0] * k, oy = H - fh * k - frame[1] * k;
    const out = canvas.getContext("2d");
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.clearRect(0, 0, W, H);
    // With an outline, the layers are drawn on a scratch canvas first, then laid on a white silhouette of themselves.
    const target = opts.outline ? document.createElement("canvas") : canvas;
    if (opts.outline) { target.width = W; target.height = H; }
    const ctx = target.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ims.forEach((im, i) => {
      const m = ls[i].m;
      ctx.setTransform(k, 0, 0, k, ox, oy);
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      ctx.drawImage(im, 0, 0);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (opts.outline) {
      // A sticker's white edge: the hero's shape stamped in a ring of directions, filled white; then a soft shadow.
      const r = opts.outline * dpr, sil = document.createElement("canvas"); sil.width = W; sil.height = H;
      const s = sil.getContext("2d");
      for (const rr of [r, r * 0.55]) for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2; s.drawImage(target, Math.cos(a) * rr, Math.sin(a) * rr);
      }
      s.globalCompositeOperation = "source-in"; s.fillStyle = "#fffdf6"; s.fillRect(0, 0, W, H);
      out.save();
      out.shadowColor = "rgba(30, 20, 8, 0.45)"; out.shadowBlur = 9 * dpr; out.shadowOffsetY = 4 * dpr;
      out.drawImage(sil, 0, 0);
      out.restore();
      out.drawImage(target, 0, 0);
    }
  }

  // Fetches the pictures a hero needs ahead of time, so the next screen draws at once.
  function preload(h, part = "all") { layers(h, part).forEach((l) => load(l.src).catch(() => {})); }

  return { draw, preload, layers, load };
})();
