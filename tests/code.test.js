// The hero code: every hero survives encode -> decode, and a mistyped character is caught.
// Run: node tests/code.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = {}; vm.createContext(ctx);
for (const f of ["kids.js", "catalog.js", "code.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8") + "\nthis.KIDS=typeof KIDS!=='undefined'?KIDS:this.KIDS;this.CATALOG=typeof CATALOG!=='undefined'?CATALOG:this.CATALOG;this.HeroCode=typeof HeroCode!=='undefined'?HeroCode:this.HeroCode;", ctx);
const { KIDS, CATALOG, HeroCode } = ctx;
const pick = (l) => l[Math.floor(Math.random() * l.length)];
let n = 0, caught = 0, typos = 0;
const ALPHA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
for (let i = 0; i < 20000; i++) {
  const ab = Object.keys(CATALOG.abilities); const s1 = pick(ab); const s2 = pick(ab.filter((a) => a !== s1));
  const h = { kid: Math.floor(Math.random() * KIDS.length), gender: pick(["m", "f"]), species: pick(Object.keys(CATALOG.species)),
    cls: pick(Object.keys(CATALOG.classes)), colour: pick(Object.keys(CATALOG.outfit_colors)), hat: pick(Object.keys(CATALOG.headwear)),
    pet: pick(Object.keys(CATALOG.companions)), strengths: [s1, s2], homeland: pick(Object.keys(CATALOG.homelands)) };
  const code = HeroCode.encode(h);
  if (!/^[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{4}$/.test(code)) throw new Error("bad shape " + code);
  const d = HeroCode.decode(code.toLowerCase());
  for (const k of Object.keys(h)) {
    const want = k === "strengths" ? [...h.strengths].sort().join() : h[k], got = k === "strengths" ? [...d.strengths].sort().join() : d[k];
    if (want !== got) throw new Error(`${code}: ${k} ${want} != ${got}`);
  }
  n++;
  // one character changed: must be refused
  const chars = code.replace("-", ""); const p = Math.floor(Math.random() * 7);
  const typo = chars.slice(0, p) + pick([...ALPHA].filter((c) => c !== chars[p])) + chars.slice(p + 1);
  typos++; if (HeroCode.decode(typo) === null) caught++;
}
if (caught !== typos) throw new Error(`only ${caught} of ${typos} single-character typos caught`);
if (HeroCode.decode("ABC-DEF") !== null || HeroCode.decode("") !== null) throw new Error("short codes must be refused");
console.log(`ok: ${n} heroes round-trip; ${caught}/${typos} single-character typos caught`);
