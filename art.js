// The hero's picture: a front-facing "chibi" figure built from layered SVG parts.
//
// ART.svg(hero, mode) draws it in one of two ways from the same parts:
//   "color"  - the picture on the screen and on the card;
//   "relief" - every part filled with a grey that stands for its height, for the medal:
//              black = the medal's background, white = HMAX millimetres above it.
// Outlines become shallow grooves in relief, so parts at the same height stay apart.
//
// A hero is { gender: "m"|"f", species, cls, skin: 0-3, hair, hairColor, color },
// using the keys in catalog.js. The viewBox is 200 x 200 and the figure stays inside
// the circle of radius 96 around the centre, so it fits a round medal.
const ART = (() => {
  const HMAX = 1.6; // mm: the tallest part of the relief
  const GROOVE = 0.3; // mm: how deep the outlines cut in relief
  const OUTLINE = "#2b1d14";
  const H = {
    back: 0.5, leg: 0.75, boot: 0.8, body: 0.9, detail: 1.0, arm: 1.0, hand: 1.05,
    head: 1.1, face: 0.75, snout: 1.25, fur: 1.15, hair: 1.3, beard: 1.35, hat: 1.4,
    item: 1.6, itemTrim: 1.45,
  };

  // ---- colour helpers --------------------------------------------------------------
  function mix(hex, target, t) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(target.slice(1), 16);
    const ch = (v, s) => (v >> s) & 255;
    const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
    return "#" + ((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1);
  }
  const darker = (hex, t) => mix(hex, "#000000", t);
  const lighter = (hex, t) => mix(hex, "#ffffff", t);

  function palette(hero) {
    const main = CATALOG.color_hex[hero.color] || "#2f6fc0";
    const skin = CATALOG.skins[hero.species][hero.skin] || CATALOG.skins[hero.species][0];
    return {
      main, mainDark: darker(main, 0.3), mainLight: lighter(main, 0.35),
      skin, skinDark: darker(skin, 0.18),
      hair: (CATALOG.hair_colors[hero.hairColor] || CATALOG.hair_colors.brown).hex,
      metal: "#c9ced6", metalDark: "#8a929e", wood: "#9a6434", woodDark: "#6e4522",
      gold: "#e2b23a", boot: "#5a3a26", eye: "#2b1d14", white: "#ffffff",
      cheek: "#f29a9a", leaf: "#4f9a3c", leafLight: "#7cc35a", bone: "#efe3c8",
      wing: "#cdeffc", orb: "#7fd6ff", fur: "#b08a5a", pink: "#f4a6b8",
    };
  }

  // ---- the drawing kit ---------------------------------------------------------------
  function kit(hero, mode) {
    const P = palette(hero);
    const relief = mode === "relief";
    const grey = (h) => {
      const v = Math.max(0, Math.min(255, Math.round((255 * h) / HMAX)));
      return `rgb(${v},${v},${v})`;
    };
    const fill = (role, h) => (relief ? grey(h) : P[role] || role);
    const out = (h) => (relief ? grey(h - GROOVE) : OUTLINE);
    const k = {
      P, relief,
      shape: (d, role, h, extra = "") =>
        `<path d="${d}" fill="${fill(role, h)}" stroke="${out(h)}" stroke-width="3.5" stroke-linejoin="round" ${extra}/>`,
      circle: (cx, cy, r, role, h) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill(role, h)}" stroke="${out(h)}" stroke-width="3.5"/>`,
      ellipse: (cx, cy, rx, ry, role, h, rot = 0) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill(role, h)}" stroke="${out(h)}" stroke-width="3.5"/>`,
      // A thick stroke used as a shape (arms, staffs, tails): an outline stroke, then the colour.
      limb: (d, w, role, h) =>
        `<path d="${d}" fill="none" stroke="${out(h)}" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${fill(role, h)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
      // Marks that are too fine to print: drawn on the card only.
      fine: (svg) => (relief ? "" : svg),
      // A groove cut into a part (eyes, mouth): its own height, no outline.
      dent: (d, role, h, w) =>
        relief
          ? `<path d="${d}" fill="none" stroke="${grey(h)}" stroke-width="${w}" stroke-linecap="round"/>`
          : `<path d="${d}" fill="none" stroke="${P[role] || role}" stroke-width="${w}" stroke-linecap="round"/>`,
      blob: (cx, cy, rx, ry, role, h) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill(role, h)}"/>`,
    };
    return k;
  }

  const ROBE = { wizard: 186, cleric: 178, druid: 184 }; // robe hem height, by class
  const HOODED = { rogue: true, ranger: true };
  const HATTED = { wizard: true, bard: true, druid: true };

  // Where each class holds its hands: [left hand (viewer's left), right hand].
  const HANDS = {
    default: [[55, 150], [147, 148]],
    bard: [[64, 118], [116, 156]],
    ranger: [[56, 146], [147, 148]],
  };

  // ---- the parts ---------------------------------------------------------------------
  function back(h, k) {
    const s = [];
    if (h.species === "fairy") {
      const w = (cx, cy, rx, ry, rot) =>
        k.relief ? k.ellipse(cx, cy, rx, ry, "wing", H.back, rot)
          : k.ellipse(cx, cy, rx, ry, "wing", H.back, rot).replace("<ellipse", '<ellipse opacity="0.9"');
      s.push(w(50, 100, 34, 17, -32), w(150, 100, 34, 17, 32), w(58, 136, 22, 11, 28), w(142, 136, 22, 11, -28));
    }
    if (h.cls === "paladin") s.push(k.shape("M66 106 L50 186 Q100 196 150 186 L134 106 Z", "main", H.back));
    if (HOODED[h.cls]) {
      const role = h.cls === "rogue" ? "mainDark" : "main";
      s.push(k.shape("M64 108 L44 184 Q100 196 156 184 L136 108 Z", role, H.back));
      s.push(k.shape("M56 84 C50 34 78 18 100 18 C122 18 150 34 144 84 L146 112 L54 112 Z", role, H.back));
    }
    if (h.cls === "ranger") {
      s.push(k.shape("M116 104 L150 66 L160 76 L126 112 Z", "wood", H.back));
      s.push(k.fine(`<path d="M150 66 l-6 -10 M155 71 l2 -11 M160 76 l8 -6" stroke="#c8323c" stroke-width="4" stroke-linecap="round"/>`));
    }
    if (h.hair === "long" && !HOODED[h.cls] && h.species !== "dragonborn") {
      s.push(k.shape("M60 72 C56 30 80 20 100 20 C120 20 144 30 140 72 L146 124 Q140 134 126 128 L122 92 L78 92 L74 128 Q60 134 54 124 Z", "hair", H.back));
    }
    if (h.species === "dragonborn" && h.hair === "long") {
      s.push(k.shape("M62 50 L40 40 L52 60 L34 66 L56 76 L44 92 L64 86 Z", "hair", H.back));
      s.push(k.shape("M138 50 L160 40 L148 60 L166 66 L144 76 L156 92 L136 86 Z", "hair", H.back));
    }
    if (h.species === "tabaxi") s.push(k.limb("M126 158 C160 164 178 138 164 110", 11, "skin", H.back));
    if (h.species === "dragonborn") s.push(k.shape("M124 148 C156 160 180 150 184 126 C172 140 150 144 128 138 Z", "skin", H.back));
    return s.join("");
  }

  function legs(h, k) {
    const hem = ROBE[h.cls];
    const s = [];
    if (!hem || hem < 180) {
      s.push(k.shape("M78 154 h18 v28 h-18 Z", "mainDark", H.leg), k.shape("M104 154 h18 v28 h-18 Z", "mainDark", H.leg));
    }
    s.push(k.shape("M74 178 h24 v9 a5 5 0 0 1 -5 5 h-14 a5 5 0 0 1 -5 -5 Z", "boot", H.boot));
    s.push(k.shape("M102 178 h24 v9 a5 5 0 0 1 -5 5 h-14 a5 5 0 0 1 -5 -5 Z", "boot", H.boot));
    return s.join("");
  }

  function torso(h, k) {
    const s = [];
    const hem = ROBE[h.cls];
    if (hem) {
      s.push(k.shape(`M70 106 Q100 96 130 106 L${hem === 186 ? 142 : 138} ${hem} Q100 ${hem + 8} ${hem === 186 ? 58 : 62} ${hem} Z`, "main", H.body));
    } else if (h.cls === "barbarian") {
      s.push(k.shape("M70 106 Q100 96 130 106 L134 160 Q100 166 66 160 Z", "skin", H.body));
    } else if (h.cls === "paladin") {
      s.push(k.shape("M70 106 Q100 96 130 106 L134 160 Q100 166 66 160 Z", "metal", H.body));
    } else {
      s.push(k.shape("M70 106 Q100 96 130 106 L134 160 Q100 166 66 160 Z", "main", H.body));
    }
    switch (h.cls) {
      case "fighter":
        s.push(k.shape("M80 112 Q100 106 120 112 L118 140 Q100 146 82 140 Z", "metal", H.detail));
        s.push(k.shape("M67 148 h66 v9 h-66 Z", "woodDark", H.detail), k.shape("M94 147 h12 v11 h-12 Z", "gold", H.detail));
        break;
      case "wizard":
        s.push(k.shape("M70 146 Q100 152 130 146 L131 154 Q100 160 69 154 Z", "gold", H.detail));
        s.push(k.fine(`<path d="M86 166 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 Z M114 124 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1 Z" fill="#f2d16b"/>`));
        break;
      case "rogue":
        s.push(k.shape("M67 146 h66 v9 h-66 Z", "woodDark", H.detail), k.shape("M74 154 h14 v12 h-14 Z", "boot", H.detail));
        s.push(k.shape("M88 106 L100 128 L112 106 Z", "mainDark", H.detail));
        break;
      case "cleric":
        s.push(k.shape("M92 106 h16 v70 h-16 Z", "white", H.detail));
        s.push(k.circle(100, 128, 10, "gold", H.itemTrim));
        s.push(k.fine(`<path d="M100 112 v-3 M100 147 v-3 M84 128 h-3 M119 128 h-3" stroke="#e2b23a" stroke-width="3"/>`));
        break;
      case "ranger":
        s.push(k.shape("M67 146 h66 v9 h-66 Z", "woodDark", H.detail), k.shape("M94 145 h12 v11 h-12 Z", "gold", H.detail));
        s.push(k.shape("M72 108 L128 140 L126 148 L70 116 Z", "woodDark", H.detail));
        break;
      case "bard":
        s.push(k.shape("M86 106 L100 122 L114 106 L114 160 L86 160 Z", "mainLight", H.detail));
        s.push(k.shape("M67 148 h66 v9 h-66 Z", "woodDark", H.detail));
        break;
      case "barbarian":
        s.push(k.shape("M68 106 L88 106 L84 160 L66 160 Z", "main", H.detail), k.shape("M132 106 L112 106 L116 160 L134 160 Z", "main", H.detail));
        s.push(k.shape("M66 148 h68 v10 h-68 Z", "woodDark", H.detail), k.circle(100, 153, 7, "gold", H.detail));
        break;
      case "druid":
        s.push(k.shape("M70 146 Q100 152 130 146 L131 154 Q100 160 69 154 Z", "woodDark", H.detail));
        s.push(k.ellipse(84, 168, 9, 5, "leaf", H.detail, -30), k.ellipse(116, 172, 9, 5, "leaf", H.detail, 30));
        break;
      case "paladin":
        s.push(k.shape("M88 108 L112 108 L114 166 L86 166 Z", "main", H.detail));
        s.push(k.circle(100, 128, 7, "gold", H.itemTrim));
        s.push(k.shape("M67 148 h66 v9 h-66 Z", "woodDark", H.detail));
        break;
    }
    return s.join("");
  }

  function arms(h, k) {
    const [[lx, ly], [rx, ry]] = HANDS[h.cls] || HANDS.default;
    const role = h.cls === "barbarian" ? "skin" : h.cls === "paladin" || h.cls === "fighter" ? "metalDark" : "main";
    let s = k.limb(`M74 114 Q${(74 + lx) / 2 - 6} ${(114 + ly) / 2} ${lx} ${ly}`, 15, role, H.arm);
    s += k.limb(`M126 114 Q${(126 + rx) / 2 + 6} ${(114 + ry) / 2} ${rx} ${ry}`, 15, role, H.arm);
    if (h.cls === "fighter" || h.cls === "paladin") {
      s += k.ellipse(70, 110, 13, 9, "metal", H.detail, -15) + k.ellipse(130, 110, 13, 9, "metal", H.detail, 15);
    }
    if (h.cls === "barbarian") {
      s += k.shape("M60 114 Q64 100 76 104 Q82 94 92 103 Q100 96 108 103 Q118 94 124 104 Q136 100 140 114 Q100 122 60 114 Z", "fur", H.fur);
    }
    return s;
  }

  // Items behind the hands (the hand closes over the grip), then in front of them.
  function itemsBehind(h, k) {
    switch (h.cls) {
      case "fighter":
        return k.shape("M142 138 L142 64 L147 52 L152 64 L152 138 Z", "metal", H.item) +
          k.shape("M133 136 h28 v7 h-28 Z", "gold", H.item) + k.shape("M143 143 h8 v18 h-8 Z", "wood", H.item);
      case "wizard":
        return k.limb("M147 184 L147 44", 8, "wood", H.item) + k.circle(147, 36, 11, "orb", H.item) +
          k.fine(`<circle cx="143" cy="32" r="3.5" fill="#ffffff" opacity="0.8"/>`);
      case "rogue":
        return k.shape("M143 140 L144 114 L148 102 L152 114 L153 140 Z", "metal", H.item) + k.shape("M138 138 h20 v6 h-20 Z", "gold", H.item) +
          k.shape("M51 142 L52 116 L56 104 L60 116 L61 142 Z", "metal", H.item) + k.shape("M46 140 h20 v6 h-20 Z", "gold", H.item);
      case "cleric":
        return k.limb("M147 166 L147 104", 7, "wood", H.item) + k.circle(147, 96, 13, "metal", H.item) +
          k.fine(`<path d="M147 80 v-4 M161 96 h4 M133 96 h-4 M157 86 l3 -3 M137 86 l-3 -3" stroke="#2b1d14" stroke-width="3" stroke-linecap="round"/>`);
      case "ranger":
        return k.limb("M60 106 Q30 146 62 184", 7, "wood", H.item) +
          k.fine(`<path d="M60 106 L62 184" stroke="#efe3c8" stroke-width="2"/>`);
      case "barbarian":
        return k.limb("M147 174 L147 70", 8, "wood", H.item) +
          k.shape("M147 72 Q178 60 180 98 Q164 90 147 100 Z", "metal", H.item) +
          k.shape("M147 76 Q128 74 126 92 Q136 88 147 94 Z", "metalDark", H.item);
      case "druid":
        return k.limb("M147 186 Q140 124 150 74 Q156 54 142 42", 8, "wood", H.item) +
          k.ellipse(152, 40, 10, 5, "leaf", H.item, -30) + k.ellipse(136, 36, 9, 5, "leafLight", H.item, 25) +
          k.ellipse(146, 56, 8, 4, "leaf", H.item, 40);
      case "paladin":
        return k.limb("M147 176 L147 84", 7, "wood", H.item) + k.shape("M129 64 h36 v22 h-36 Z", "metal", H.item) +
          k.fine(`<path d="M135 70 v10 M159 70 v10" stroke="#8a929e" stroke-width="3"/>`);
    }
    return "";
  }

  function hands(h, k) {
    const [[lx, ly], [rx, ry]] = HANDS[h.cls] || HANDS.default;
    return k.circle(lx, ly, 9, "skin", H.hand) + k.circle(rx, ry, 9, "skin", H.hand);
  }

  function itemsFront(h, k) {
    switch (h.cls) {
      case "fighter":
        return k.circle(52, 146, 23, "metal", H.item) + k.circle(52, 146, 17, "main", H.itemTrim) + k.circle(52, 146, 5, "metal", H.item);
      case "bard":
        return k.limb("M96 142 L62 108", 8, "woodDark", H.item) + k.shape("M52 100 l10 -8 10 10 -8 10 Z", "woodDark", H.item) +
          k.ellipse(106, 154, 22, 17, "wood", H.item, -30) + k.circle(104, 152, 6, "woodDark", H.itemTrim) +
          k.fine(`<path d="M114 160 L64 110 M110 163 L61 113" stroke="#efe3c8" stroke-width="1.5"/>`);
    }
    return "";
  }

  function ears(h, k) {
    switch (h.species) {
      case "elf":
        return k.shape("M66 64 L34 46 L62 88 Z", "skin", H.head) + k.shape("M134 64 L166 46 L138 88 Z", "skin", H.head);
      case "fairy":
        return k.shape("M66 66 L46 54 L62 86 Z", "skin", H.head) + k.shape("M134 66 L154 54 L138 86 Z", "skin", H.head);
      case "human":
      case "dwarf":
        return k.circle(63, 76, 8, "skin", H.head) + k.circle(137, 76, 8, "skin", H.head);
    }
    return "";
  }

  function head(h, k) {
    let s = k.circle(100, 68, 38, "skin", H.head);
    if (h.species === "dragonborn") s += k.ellipse(100, 88, 23, 15, "skin", H.snout);
    return s;
  }

  function face(h, k) {
    const s = [];
    const ey = h.species === "dragonborn" ? 64 : 72;
    if (k.relief) {
      s.push(k.blob(86, ey, 5.5, 7, "eye", H.face), k.blob(114, ey, 5.5, 7, "eye", H.face));
    } else {
      s.push(k.blob(86, ey, 5.5, 7, "eye", 0), k.blob(114, ey, 5.5, 7, "eye", 0));
      s.push(`<circle cx="88" cy="${ey - 2.5}" r="2" fill="#fff"/><circle cx="116" cy="${ey - 2.5}" r="2" fill="#fff"/>`);
      if (h.gender === "f") {
        s.push(`<path d="M80.5 ${ey - 4} l-4.5 -3 M80.5 ${ey} l-5 -0.5 M119.5 ${ey - 4} l4.5 -3 M119.5 ${ey} l5 -0.5" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round"/>`);
      }
      if (h.species !== "dragonborn") {
        s.push(`<circle cx="78" cy="86" r="5.5" fill="#f29a9a" opacity="0.55"/><circle cx="122" cy="86" r="5.5" fill="#f29a9a" opacity="0.55"/>`);
      }
    }
    if (h.species === "tabaxi") {
      s.push(k.dent("M93 86 Q96.5 91 100 86 Q103.5 91 107 86", "eye", H.face, 3.2));
      s.push(k.fine(`<path d="M96 82 h8 l-4 4 Z" fill="#f4a6b8"/><path d="M78 84 h-18 M78 89 l-16 4 M122 84 h18 M122 89 l16 4" stroke="#2b1d14" stroke-width="1.8" stroke-linecap="round"/>`));
    } else if (h.species === "dragonborn") {
      s.push(k.dent("M86 94 Q100 101 114 94", "eye", H.face + 0.2, 3.5));
      s.push(k.fine(`<circle cx="94" cy="84" r="2" fill="#2b1d14"/><circle cx="106" cy="84" r="2" fill="#2b1d14"/>`));
    } else {
      s.push(k.dent("M91 88 Q100 96 109 88", "eye", H.face, 3.5));
    }
    return s.join("");
  }

  function beard(h, k) {
    if (h.species !== "dwarf" || h.gender !== "m") return "";
    return k.shape("M64 80 C68 114 84 130 100 134 C116 130 132 114 136 80 C126 96 114 102 100 102 C86 102 74 96 64 80 Z", "hair", H.beard) +
      k.shape("M84 92 Q92 85 100 91 Q108 85 116 92 Q108 98 100 95 Q92 98 84 92 Z", "hair", H.beard);
  }

  function hair(h, k) {
    if (HOODED[h.cls]) {
      const role = h.cls === "rogue" ? "mainDark" : "main";
      // a fringe peeking out of the hood, then the hood's front edge
      return k.shape("M70 60 C78 44 122 44 130 60 C120 54 80 54 70 60 Z", "hair", H.hair) +
        k.shape("M58 76 C58 40 78 28 100 28 C122 28 142 40 142 76 C134 54 118 44 100 44 C82 44 66 54 58 76 Z", role, H.hat);
    }
    if (h.species === "dragonborn") {
      const spikes = {
        short: "M80 34 L86 16 L94 31 L100 12 L106 31 L114 16 L120 34 Z",
        long: "M84 32 L92 18 L100 30 L108 18 L116 32 Z",
        bun: "M86 34 Q96 0 118 8 Q106 16 114 34 Z",
        wild: "M70 44 L66 24 L80 32 L82 10 L94 28 L100 6 L106 28 L118 10 L120 32 L134 24 L130 44 Z",
      };
      return k.shape(spikes[h.hair] || spikes.short, "hair", H.hair) +
        k.shape("M76 40 Q60 24 64 6 Q76 22 90 32 Z", "bone", H.hair) + k.shape("M124 40 Q140 24 136 6 Q124 22 110 32 Z", "bone", H.hair);
    }
    const cap = "M61 72 C58 36 80 24 100 24 C120 24 142 36 139 72 C132 56 118 46 100 50 C84 46 68 56 61 72 Z";
    const caps = {
      short: cap,
      long: cap,
      bun: cap,
      wild: "M60 74 Q46 56 60 50 Q52 30 74 32 Q76 12 98 20 Q116 8 124 30 Q146 28 140 50 Q154 56 140 74 C132 56 118 46 100 50 C84 46 68 56 60 74 Z",
    };
    let s = "";
    if (h.hair === "bun" && !HATTED[h.cls]) s += k.circle(100, 24, 15, "hair", H.hair);
    s += k.shape(caps[h.hair] || cap, "hair", H.hair);
    return s;
  }

  function topParts(h, k) {
    const s = [];
    if (h.species === "tabaxi") {
      s.push(k.shape("M66 52 L62 14 L92 34 Z", "skin", H.hair + 0.05), k.shape("M134 52 L138 14 L108 34 Z", "skin", H.hair + 0.05));
      s.push(k.fine(`<path d="M69 42 L67 24 L83 35 Z M131 42 L133 24 L117 35 Z" fill="#f4a6b8"/>`));
    }
    switch (h.cls) {
      case "wizard":
        s.push(k.shape("M66 42 L106 6 L134 42 Z", "main", H.hat), k.ellipse(100, 42, 46, 9, "mainDark", H.hat));
        s.push(k.fine(`<path d="M98 26 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1 Z" fill="#f2d16b"/>`));
        break;
      case "bard":
        s.push(k.shape("M126 34 Q154 12 170 8 Q152 28 134 42 Z", "mainLight", H.hat));
        s.push(k.ellipse(100, 38, 42, 14, "main", H.hat), k.shape("M60 42 Q100 52 140 42 L139 48 Q100 58 61 48 Z", "mainDark", H.hat));
        break;
      case "druid":
        [[68, 46, -50], [82, 34, -25], [100, 30, 0], [118, 34, 25], [132, 46, 50]].forEach(([x, y, r], i) =>
          s.push(k.ellipse(x, y, 10, 5.5, i % 2 ? "leafLight" : "leaf", H.hat, r + 90)));
        break;
    }
    if (h.species === "fairy" && !HATTED[h.cls] && !HOODED[h.cls]) {
      s.push(k.limb("M90 32 Q86 18 78 10", 4.5, "skinDark", H.hair), k.circle(78, 9, 5.5, "pink", H.hair));
      s.push(k.limb("M110 32 Q114 18 122 10", 4.5, "skinDark", H.hair), k.circle(122, 9, 5.5, "pink", H.hair));
    }
    return s.join("");
  }

  function svg(hero, mode = "color", size = null) {
    const k = kit(hero, mode);
    const dims = size ? ` width="${size}" height="${size}"` : "";
    const bg = k.relief ? `<rect width="200" height="200" fill="rgb(0,0,0)"/>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"${dims}>${bg}` +
      back(hero, k) + legs(hero, k) + torso(hero, k) + arms(hero, k) + itemsBehind(hero, k) +
      hands(hero, k) + itemsFront(hero, k) + ears(hero, k) + head(hero, k) + face(hero, k) +
      beard(hero, k) + hair(hero, k) + topParts(hero, k) + `</svg>`;
  }

  return { svg, HMAX };
})();
