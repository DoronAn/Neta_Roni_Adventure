// The hero card: one picture of the finished hero, to save, share on WhatsApp and print. 1200 x 1800 px, the shape
// of a 10 x 15 cm photo print. Drawn on a canvas from the same pictures as the screens (hero.js) and in the team's
// colours: the colour that leads the team's screens frames the card.
// A plain script (not a module), like the rest of the site. Needs CATALOG, KIDS, TEAMS, PARTS, HeroArt, HeroStory, HeroCode.

const HeroCard = (() => {
  const W = 1200, H = 1800;
  const GOLD = "#d4a53a", CREAM = "#fbf1dc", INK = "#183b3c", MUTED = "#56706f", CARD = "#f8f0dd";
  // A leads (the frame, the ribbon), B frames (lines, headings): the same roles as the screens.
  const COLOURS = { neta: { a: "#1c7778", aDark: "#0d4243", b: "#c25a10" }, roni: { a: "#dd6a14", aDark: "#9c470b", b: "#175e60" } };

  const fonts = () => Promise.all(["700 80px Karantina", "700 30px Heebo"].map((f) => document.fonts.load(f)));

  function arch(ctx, x, y, w, h, ry) {          // a window with a rounded top, square at the bottom
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + ry);
    ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, Math.PI, 2 * Math.PI); ctx.lineTo(x + w, y + h); ctx.closePath();
  }
  function star(ctx, cx, cy, r, fill) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  // The largest size (down to min) at which text fits maxW.
  function fit(ctx, text, family, size, min, maxW) {
    for (let s = size; s >= min; s -= 2) { ctx.font = `700 ${s}px ${family}`; if (ctx.measureText(text).width <= maxW) return s; }
    return min;
  }
  function wrap(ctx, text, maxW) {
    const lines = []; let line = "";
    for (const word of text.split(/\s+/)) {
      const t = line ? line + " " + word : word;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = word; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function draw(canvas, h) {
    await fonts();
    const kid = KIDS[h.kid], team = kid.team, C = COLOURS[team], g = h.gender === "f" ? "f" : "m";
    const t = (m, f) => (g === "f" ? f : m);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d"); ctx.direction = "rtl"; ctx.textBaseline = "alphabetic";
    const [paper, scene, crest, ...badges] = await Promise.all([
      HeroArt.load("ui/parchment.jpg"), HeroArt.load(`ui/scene_wide_${h.homeland}.jpg`), HeroArt.load(PARTS.crests[team]),
      ...h.strengths.map((k) => HeroArt.load(`ui/badge_${k}${team === "roni" ? "_orange" : ""}.webp`)),
    ]);

    // Paper, browning toward the edges, inside the team's frame.
    ctx.fillStyle = ctx.createPattern(paper, "repeat"); ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, "rgba(140,95,40,0)"); v.addColorStop(1, "rgba(140,95,40,0.32)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 22; ctx.strokeStyle = C.a; ctx.strokeRect(11, 11, W - 22, H - 22);
    ctx.lineWidth = 6; ctx.strokeStyle = C.b; ctx.strokeRect(33, 33, W - 66, H - 66);

    // The window: the homeland's scene, the hero standing in it as a sticker.
    const X = 90, Y = 150, WW = 1020, WH = 750, RY = 280;
    ctx.save(); ctx.shadowColor = "rgba(60,40,10,0.35)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    arch(ctx, X - 18, Y - 18, WW + 36, WH + 36, RY + 18); ctx.fillStyle = CARD; ctx.fill(); ctx.restore();
    arch(ctx, X - 11, Y - 11, WW + 22, WH + 22, RY + 11); ctx.lineWidth = 7; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.save(); arch(ctx, X, Y, WW, WH, RY); ctx.clip();
    ctx.drawImage(scene, X, Y, WW, WH);
    const dim = ctx.createRadialGradient(X + WW / 2, Y + WH * 0.55, WH * 0.35, X + WW / 2, Y + WH * 0.55, WH * 0.85);
    dim.addColorStop(0, "rgba(40,25,10,0)"); dim.addColorStop(1, "rgba(40,25,10,0.45)");
    ctx.fillStyle = dim; ctx.fillRect(X, Y, WW, WH);
    const ground = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    ground.addColorStop(0, "rgba(25,15,5,0.5)"); ground.addColorStop(1, "rgba(25,15,5,0)");
    ctx.save(); ctx.translate(X + WW / 2, Y + WH - 86); ctx.scale(280, 30); ctx.fillStyle = ground; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    // the hero stands above the name ribbon (its top edge is 70 px above the window's foot), clear of the crest
    const hc = document.createElement("canvas"); hc.width = 900; hc.height = 590;
    await HeroArt.draw(hc, h, { part: "all", keepSize: true, dpr: 1, outline: 10 });
    ctx.drawImage(hc, X + (WW - 900) / 2, Y + WH - 590 - 72);
    ctx.restore();
    arch(ctx, X, Y, WW, WH, RY); ctx.lineWidth = 7; ctx.strokeStyle = C.b; ctx.stroke();

    // The crest, the window's keystone.
    const CR = 84, CX = W / 2, CY = Y + 2;
    ctx.save(); ctx.shadowColor = "rgba(40,25,10,0.4)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.beginPath(); ctx.arc(CX, CY, CR + 13, 0, 2 * Math.PI); ctx.fillStyle = GOLD; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(CX, CY, CR + 6, 0, 2 * Math.PI); ctx.fillStyle = C.b; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, CR, 0, 2 * Math.PI); ctx.clip(); ctx.drawImage(crest, CX - CR, CY - CR, 2 * CR, 2 * CR); ctx.restore();

    // The name, on a ribbon across the window's foot.
    const name = (h.name || "").trim();
    const ns = fit(ctx, name, "Karantina", 104, 60, 860);
    ctx.font = `700 ${ns}px Karantina`;
    const rw = Math.max(560, Math.min(1080, ctx.measureText(name).width + 170)), rh = 128, ry = Y + WH - 6, notch = 26;
    ctx.save(); ctx.shadowColor = "rgba(40,25,10,0.35)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.beginPath(); ctx.moveTo(W / 2 - rw / 2, ry - rh / 2); ctx.lineTo(W / 2 + rw / 2, ry - rh / 2); ctx.lineTo(W / 2 + rw / 2 - notch, ry);
    ctx.lineTo(W / 2 + rw / 2, ry + rh / 2); ctx.lineTo(W / 2 - rw / 2, ry + rh / 2); ctx.lineTo(W / 2 - rw / 2 + notch, ry); ctx.closePath();
    ctx.fillStyle = C.a; ctx.fill(); ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = C.aDark; ctx.stroke();
    ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(251,241,220,0.7)";
    ctx.beginPath(); ctx.moveTo(W / 2 - rw / 2 + 40, ry - rh / 2 + 12); ctx.lineTo(W / 2 + rw / 2 - 40, ry - rh / 2 + 12);
    ctx.moveTo(W / 2 - rw / 2 + 40, ry + rh / 2 - 12); ctx.lineTo(W / 2 + rw / 2 - 40, ry + rh / 2 - 12); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = CREAM; ctx.textAlign = "center"; ctx.fillText(name, W / 2, ry + ns * 0.34);

    // Species and class; homeland and team.
    ctx.font = "700 76px Karantina"; ctx.fillStyle = C.b;
    ctx.fillText(`${CATALOG.species[h.species].he[g]} · ${CATALOG.classes[h.cls].he[g]}`, W / 2, 1068);
    ctx.font = "700 34px Heebo"; ctx.fillStyle = MUTED;
    ctx.fillText(`${t("בא", "באה")} מ${CATALOG.homelands[h.homeland].he}  ·  ${TEAMS[team].he}`, W / 2, 1120);

    // The two strengths, either side of a star.
    const SY = 1202, B = 136;
    h.strengths.forEach((k, i) => {
      const label = CATALOG.abilities[k].he; ctx.font = "700 64px Karantina";
      const lw = ctx.measureText(label).width, gw = B + 18 + lw, gx = i === 0 ? 900 : 300;   // first on the right
      const bx = gx + gw / 2 - B;                                                          // badge on the right of its label
      ctx.save(); ctx.shadowColor = "rgba(40,25,10,0.3)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      ctx.drawImage(badges[i], bx, SY - B / 2, B, B); ctx.restore();
      ctx.fillStyle = C.b; ctx.textAlign = "right"; ctx.fillText(label, bx - 18, SY + 21);
    });
    star(ctx, W / 2, SY, 20, C.a); star(ctx, W / 2 - 46, SY, 11, C.b); star(ctx, W / 2 + 46, SY, 11, C.b);

    // The story, in a framed panel; the text set as large as fits.
    const PX = 76, PY = 1292, PW = 1048, PH = 396;
    ctx.save(); ctx.shadowColor = "rgba(60,40,10,0.18)"; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 6;
    ctx.fillStyle = CARD; ctx.fillRect(PX, PY, PW, PH); ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = C.b; ctx.strokeRect(PX, PY, PW, PH);
    ctx.lineWidth = 2.5; ctx.strokeStyle = GOLD; ctx.strokeRect(PX + 10, PY + 10, PW - 20, PH - 20);
    const story = h.story || HeroStory.write(h);
    let size = 36, lines;
    for (; size >= 20; size -= 1) { ctx.font = `700 ${size}px Heebo`; lines = wrap(ctx, story, PW - 72); if (lines.length * size * 1.4 <= PH - 48) break; }
    ctx.fillStyle = INK; ctx.textAlign = "right";
    const top = PY + 24 + (PH - 48 - lines.length * size * 1.4) / 2;
    lines.forEach((l, i) => ctx.fillText(l, PX + PW - 36, top + size * (1.02 + i * 1.4)));

    // Footer: the quest's name, and the hero code (for the print page).
    ctx.font = "700 42px Karantina"; ctx.fillStyle = C.a; ctx.textAlign = "right";
    ctx.fillText("גיבורי המגן השבור", W - 80, 1748);
    star(ctx, W - 80 - ctx.measureText("גיבורי המגן השבור").width - 24, 1735, 11, C.b);
    let code = ""; try { code = HeroCode.encode(h); } catch (e) {}
    if (code) {
      ctx.direction = "ltr"; ctx.font = "700 30px ui-monospace, Menlo, Consolas, monospace"; ctx.textAlign = "left";
      const cw = ctx.measureText(code).width;
      ctx.setLineDash([8, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = C.b; ctx.strokeRect(80, 1708, cw + 36, 52); ctx.setLineDash([]);
      ctx.fillStyle = C.b; ctx.fillText(code, 98, 1745); ctx.direction = "rtl";
    }
    return canvas;
  }

  return { draw, W, H };
})();
