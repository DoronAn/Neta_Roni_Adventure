// Drawn decorations in the invitation's style: an old adventure poster, in the sisters' teal and orange, and gold.
// Each function returns an SVG string. The "print" filter (defined once in index.html) roughens them like a
// screen print.

const UI = (() => {
  const TEAL = "#175e60", ORANGE = "#dd6a14", GOLD = "#d4a53a", CREAM = "#f3e6c8";   // Neta's and Roni's colours

  // The broken shield: an outer ring of eight pieces and a centre in two halves, a little apart.
  function shield(cls = "") {
    const cx = 100, cy = 100, r0 = 44, r1 = 74, segs = [];
    for (let i = 0; i < 8; i++) {
      const a0 = ((i * 45 + 2) * Math.PI) / 180, a1 = (((i + 1) * 45 - 2) * Math.PI) / 180, mid = (a0 + a1) / 2;
      const push = 7 + (i % 3) * 3, dx = Math.cos(mid) * push, dy = Math.sin(mid) * push, rot = (i % 2 ? 1 : -1) * (3 + (i % 3) * 2);
      const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
      const d = `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
      const fill = i % 2 ? ORANGE : TEAL;
      segs.push(`<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rot} ${cx} ${cy})">
        <path d="${d}" fill="${fill}" stroke="${GOLD}" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="${(cx + 59 * Math.cos(mid)).toFixed(1)}" cy="${(cy + 59 * Math.sin(mid)).toFixed(1)}" r="4" fill="${GOLD}"/></g>`);
    }
    const star = `<path d="M100 72 L107 92 L128 92 L111 105 L117 126 L100 113 L83 126 L89 105 L72 92 L93 92 Z" fill="${ORANGE}" stroke="${TEAL}" stroke-width="2.5" stroke-linejoin="round"/>`;
    const half = (side) => {
      const sx = side === "r" ? 1 : -1;
      return `<g transform="translate(${sx * 5} ${side === "r" ? 3 : -2}) rotate(${sx * 4} 100 100)">
        <clipPath id="sh-${side}"><rect x="${side === "r" ? 100 : 0}" y="0" width="100" height="200"/></clipPath>
        <g clip-path="url(#sh-${side})">
          <circle cx="100" cy="100" r="39" fill="${GOLD}" stroke="${TEAL}" stroke-width="3.5"/>
          <circle cx="100" cy="100" r="31" fill="none" stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="3 4"/>
          ${star}
        </g>
        <path d="M100 61 L104 76 L97 88 L104 100 L96 113 L102 126 L100 139" fill="none" stroke="${TEAL}" stroke-width="2.5" stroke-linejoin="round"/>
      </g>`;
    };
    return `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><g filter="url(#print)">${segs.join("")}${half("l")}${half("r")}</g></svg>`;
  }

  // A round rubber stamp, slightly crooked: two rings and up to three short lines.
  function stamp(lines, cls = "") {
    const ys = lines.length === 3 ? [43, 61, 78] : lines.length === 2 ? [57, 82] : [70];
    const sizes = lines.length === 3 ? [12, 19, 12] : [27, 27];
    return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true"><g filter="url(#print)" fill="none" stroke="${ORANGE}">
      <circle cx="60" cy="60" r="55" stroke-width="4"/><circle cx="60" cy="60" r="47" stroke-width="1.6"/>
      ${[0, 1, 2].map((i) => `<path d="M${46 + i * 14} 99 l1.8 4 4.2 0.5 -3.1 2.9 0.8 4.2 -3.7 -2.1 -3.7 2.1 0.8 -4.2 -3.1 -2.9 4.2 -0.5 Z" fill="${ORANGE}" stroke="none"/>`).join("")}
      ${lines.map((l, i) => `<text x="60" y="${ys[i]}" text-anchor="middle" fill="${ORANGE}" stroke="none" font-family="Karantina, 'Secular One', sans-serif" font-weight="700" font-size="${sizes[i] || 18}">${l}</text>`).join("")}
    </g></svg>`;
  }

  // ———— ★ ★ ★ ————
  function stars(cls = "") {
    const star = (x, c) => `<path transform="translate(${x} 2)" d="M8 0 L10 5.6 L16 5.8 L11.3 9.4 L13 15 L8 11.7 L3 15 L4.7 9.4 L0 5.8 L6 5.6 Z" fill="${c}"/>`;
    return `<svg class="divider ${cls}" viewBox="0 0 240 20" aria-hidden="true">
      <rect x="0" y="9" width="78" height="2.5" fill="${ORANGE}"/><rect x="162" y="9" width="78" height="2.5" fill="${ORANGE}"/>
      ${star(88, TEAL)}${star(112, ORANGE)}${star(136, TEAL)}</svg>`;
  }

  function star(cls = "") {
    return `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0 L10 5.6 L16 5.8 L11.3 9.4 L13 15 L8 11.7 L3 15 L4.7 9.4 L0 5.8 L6 5.6 Z"/></svg>`;
  }

  // Hebrew numerals for the chapters: א׳ ב׳ ...
  const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];
  const chapter = (i) => `פרק ${LETTERS[i]}׳`;

  return { shield, stamp, stars, star, chapter };
})();
