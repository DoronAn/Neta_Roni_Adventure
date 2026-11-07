// The hero code: every choice except the free text, in 7 characters shown as XXX-XXXX. Printed on the card so the
// hero's picture can be rebuilt from it. 6 characters carry 30 bits; the 7th is a check, so a mistyped code is refused
// instead of turning into someone else's hero. Choices are stored as positions in the lists below, which is why
// catalog.js and kids.js say: add new entries at the END of a list, never in the middle.

const HeroCode = (() => {
  const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 characters: no 0/O, no 1/I
  const ABILITIES = () => Object.keys(CATALOG.abilities);
  const PAIRS = () => {
    const a = ABILITIES(), out = [];
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) out.push([a[i], a[j]]);
    return out; // 15 pairs
  };
  // [field, bits, list of values]. 4+1+3+4+3+3+4+4+3 = 29 bits.
  const FIELDS = () => [
    ["kid", 4, KIDS.map((_, i) => i)],
    ["gender", 1, ["m", "f"]],
    ["species", 3, Object.keys(CATALOG.species)],
    ["cls", 4, Object.keys(CATALOG.classes)],
    ["colour", 3, Object.keys(CATALOG.outfit_colors)],
    ["hat", 3, Object.keys(CATALOG.headwear)],
    ["pet", 4, Object.keys(CATALOG.companions)],
    ["strengths", 4, PAIRS().map((p) => p.join("+"))],
    ["homeland", 3, Object.keys(CATALOG.homelands)],
  ];

  // Odd weights: an odd number times a non-zero change is never a multiple of 32, so any one wrong character shows.
  function check(chars) {
    let s = 0;
    for (let i = 0; i < chars.length; i++) s += (2 * i + 1) * ALPHABET.indexOf(chars[i]);
    return ALPHABET[s % 32];
  }

  // A finished hero -> "XXX-XXXX". Throws if a choice is missing.
  function encode(h) {
    let v = 0;
    for (const [field, bits, list] of FIELDS()) {
      const value = field === "strengths" ? [...h.strengths].sort((a, b) => ABILITIES().indexOf(a) - ABILITIES().indexOf(b)).join("+") : h[field];
      const i = list.indexOf(value);
      if (i < 0 || i >= 2 ** bits) throw new Error(`hero code: no ${field}`);
      v = v * 2 ** bits + i;
    }
    let chars = "";
    for (let k = 0; k < 6; k++) { chars = ALPHABET[v % 32] + chars; v = Math.floor(v / 32); }
    chars += check(chars);
    return chars.slice(0, 3) + "-" + chars.slice(3);
  }

  // "XXX-XXXX" (any case; spaces and dashes ignored) -> the choices, or null if the code is mistyped.
  function decode(code) {
    const chars = String(code).toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (chars.length !== 7 || [...chars].some((c) => !ALPHABET.includes(c))) return null;
    if (check(chars.slice(0, 6)) !== chars[6]) return null;
    let v = 0;
    for (const c of chars.slice(0, 6)) v = v * 32 + ALPHABET.indexOf(c);
    const h = {};
    for (const [field, bits, list] of FIELDS().reverse()) {
      const i = v % 2 ** bits; v = Math.floor(v / 2 ** bits);
      if (i >= list.length) return null;
      h[field] = field === "strengths" ? list[i].split("+") : list[i];
    }
    return h;
  }

  return { encode, decode, PAIRS };
})();
