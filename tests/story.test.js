// The backstory (done-when 3 and 4): every species x class x gender x homeland, for leaders and guests of both teams,
// with every wording and a mix of strengths and companions. Each story must use only the hero's gender (no phrase
// from the other gender's side of any pair in story.js or catalog.js) and must mention the shield.
// Run: node tests/story.test.js            (node tests/story.test.js --show prints a few stories)
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = {}; vm.createContext(ctx);
for (const f of ["kids.js", "catalog.js", "story.js"])
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8") + "\n;this.KIDS=KIDS;this.TEAMS=TEAMS;this.CATALOG=typeof CATALOG!=='undefined'?CATALOG:undefined;this.HeroStory=typeof HeroStory!=='undefined'?HeroStory:undefined;", ctx);
const { KIDS, CATALOG, HeroStory } = ctx;
const pairs = [...HeroStory.PAIRS];
for (const sec of ["species", "classes"]) for (const k of Object.keys(CATALOG[sec])) pairs.push([CATALOG[sec][k].he.m, CATALOG[sec][k].he.f]);
for (const k of Object.keys(CATALOG.homelands)) pairs.push([CATALOG.homelands[k].flavor.m, CATALOG.homelands[k].flavor.f]);
const L = "א-ת";
const has = (text, phrase) => new RegExp(`(^|[^${L}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^${L}])`).test(text);
const ab = Object.keys(CATALOG.abilities), pets = Object.keys(CATALOG.companions);
const kids = [0, 1, KIDS.findIndex((k) => !k.leader && k.team === "neta"), KIDS.findIndex((k) => !k.leader && k.team === "roni")];
// Everything wrong with one story: any phrase from the other gender's side, no shield, or a hole in a template.
function problems(text, gender) {
  const out = [], other = gender === "f" ? 0 : 1;
  for (const p of pairs) if (p[0] !== p[1] && has(text, p[other])) out.push(`${gender} uses "${p[other]}": ${text}`);
  if (!text.includes("המגן")) out.push(`no shield: ${text}`);
  if (text.includes("שברי")) out.push(`"שברי" (Doron: the shield's pieces are "חלקי"): ${text}`);
  if (/undefined|null|\$\{/.test(text)) out.push(`template hole: ${text}`);
  return out;
}
let n = 0, bad = [];
for (const kid of kids) for (const gender of ["m", "f"]) for (const species of Object.keys(CATALOG.species))
  for (const cls of Object.keys(CATALOG.classes)) for (const homeland of Object.keys(CATALOG.homelands)) for (let seed = 0; seed < 4; seed++) {
    const i = n++, strengths = [ab[i % 6], ab[(i + 1 + (i >> 3) % 5) % 6]], pet = pets[i % pets.length];
    const name = gender === "f" ? "שירה האמיצה" : "יואב האמיץ";
    const text = HeroStory.write({ kid, gender, species, cls, homeland, strengths, pet, name, storySeed: seed });
    bad.push(...problems(text, gender));
  }
{ // the checker must catch one wrong-gender word, or the pass above means nothing
  const good = HeroStory.write({ kid: 2, gender: "f", species: "elf", cls: "bard", homeland: "sea", strengths: ["str", "dex"], pet: "fox", name: "שירה", storySeed: 0 });
  if (problems(good, "f").length || !problems(good.replace("בשירים שלה", "בשירים שלו"), "f").length) { console.error("the checker is broken"); process.exit(1); }
}
if (process.argv.includes("--show")) for (const [kid, g, sp, cl, hl, s, pet, seed] of [[2, "f", "elf", "ranger", "valley", ["dex", "wis"], "fox", 0], [6, "m", "dwarf", "barbarian", "caves", ["str", "con"], "frog", 1], [0, "f", "fairy", "bard", "forest", ["cha", "int"], "none", 2], [1, "m", "tabaxi", "rogue", "desert", ["dex", "int"], "cat", 0]])
  console.log(HeroStory.write({ kid, gender: g, species: sp, cls: cl, homeland: hl, strengths: s, pet, name: g === "f" ? "שירה האמיצה" : "יואב האמיץ", storySeed: seed }) + "\n");
if (bad.length) { console.error(bad.slice(0, 10).join("\n")); console.error(`${bad.length} problems in ${n} stories`); process.exit(1); }
console.log(`ok: ${n} stories, each in one gender and set in the shield's legend`);
