// Drawn decorations in the invitation's style: an old adventure poster, in the sisters' teal and orange, and gold.
// Each function returns an SVG string. The "print" filter (defined once in index.html) roughens them like a
// screen print.

const UI = (() => {
  const TEAL = "#175e60", ORANGE = "#dd6a14", GOLD = "#d4a53a", CREAM = "#f3e6c8";   // Neta's and Roni's colours

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

  return { stamp, stars, star, chapter };
})();
