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

  // Line icons, navy, for strengths and homelands. Stand-ins until painted ones arrive.
  const ICONS = {
    str: `<path d="M8 40 L30 18 M27 12 L36 21 M25 23 L36 12 L40 16 L29 27 M10 34 L14 38 M6 42 L10 38"/>`,
    dex: `<path d="M26 4 L12 26 H23 L18 44 L36 18 H25 Z" stroke-linejoin="round"/>`,
    con: `<path d="M24 5 L39 11 V22 C39 33 32 40 24 44 C16 40 9 33 9 22 V11 Z M24 33 C18 28 15 25 15 21 C15 18 18 16 20.5 16 C22 16 23.4 17 24 18.5 C24.6 17 26 16 27.5 16 C30 16 33 18 33 21 C33 25 30 28 24 33 Z"/>`,
    int: `<path d="M6 12 C12 10 18 10 24 14 C30 10 36 10 42 12 V38 C36 36 30 36 24 40 C18 36 12 36 6 38 Z M24 14 V40 M11 18 H19 M11 23 H19 M29 18 H37 M29 23 H37"/>`,
    wis: `<path d="M4 24 C10 14 17 10 24 10 C31 10 38 14 44 24 C38 34 31 38 24 38 C17 38 10 34 4 24 Z"/><circle cx="24" cy="24" r="7"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/>`,
    cha: `<path d="M18 36 V10 L38 6 V30"/><ellipse cx="13" cy="36" rx="6" ry="4.5" fill="currentColor"/><ellipse cx="33" cy="31" rx="6" ry="4.5" fill="currentColor"/><path d="M18 16 L38 12"/>`,
    mountains: `<path d="M3 40 L17 16 L25 28 L31 18 L45 40 Z M12 24.5 L17 16 L21 22 L18 21 L15 24 Z M27.5 24 L31 18 L35 25 L32 23.5 Z" stroke-linejoin="round"/>`,
    forest: `<path d="M24 4 L34 18 H29 L37 29 H31 L40 40 H8 L17 29 H11 L19 18 H14 Z M24 40 V45" stroke-linejoin="round"/>`,
    sea: `<path d="M24 8 C14 8 8 16 9 26 L24 32 L39 26 C40 16 34 8 24 8 Z M24 8 V32 M16 11 L18 30 M32 11 L30 30 M4 40 C9 36 14 44 19 40 C24 36 29 44 34 40 C39 36 42 42 44 40" stroke-linejoin="round"/>`,
    desert: `<circle cx="33" cy="14" r="6"/><path d="M3 38 C12 26 20 26 27 34 C31 30 38 28 45 34 M3 44 H45"/>`,
    valley: `<circle cx="24" cy="18" r="4"/><path d="M24 10 C27 4 33 8 28 13 C34 12 34 20 28 20 C32 25 26 29 24 23 C22 29 16 25 20 20 C14 20 14 12 20 13 C15 8 21 4 24 10 Z M24 26 V44 M24 36 C20 32 15 33 13 35 C17 38 21 38 24 36"/>`,
    caves: `<path d="M16 42 L12 22 L20 8 L26 24 L22 42 Z M26 42 L28 18 L36 10 L40 26 L34 42 Z M6 42 H44" stroke-linejoin="round"/>`,
  };
  function icon(name, cls = "") {
    return `<svg class="icon ${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${ICONS[name] || ""}</svg>`;
  }

  // Hebrew numerals for the chapters: א׳ ב׳ ...
  const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];
  const chapter = (i) => `פרק ${LETTERS[i]}׳`;

  return { shield, stamp, stars, star, icon, chapter };
})();
