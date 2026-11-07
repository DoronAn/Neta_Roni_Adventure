// Every picture a hero can need exists: bodies, heads under each hat, each hat in every class x colour, companions.
// Run: node tests/parts.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, ".."); const ctx = {}; vm.createContext(ctx);
for (const f of ["catalog.js", "parts.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8") + ";this.CATALOG=CATALOG;" + (f === "parts.js" ? "this.PARTS=PARTS;" : ""), ctx);
const { CATALOG, PARTS } = ctx; const need = new Set(); const miss = [];
const cls = Object.keys(CATALOG.classes), cols = Object.keys(CATALOG.outfit_colors), hats = Object.keys(CATALOG.headwear).filter((h) => h !== "none");
for (const c of cls) for (const k of cols) { const b = PARTS.bodies[`${c}/${k}`]; if (!b) miss.push(`body ${c}/${k}`); else need.add(b); if (!PARTS.swatch[`${c}/${k}`]) miss.push(`swatch ${c}/${k}`); }
for (const s of Object.keys(CATALOG.species)) for (const g of ["m", "f"]) {
  const key = `${s}_${g}`, hd = PARTS.heads[key];
  if (!hd) { miss.push("head " + key); continue; }
  for (const h of ["none", ...hats]) { const v = hd[h] === "none" ? hd.none : hd[h]; if (!v) miss.push(`head ${key}/${h}`); else need.add(v.src); }
  for (const h of hats) if (!PARTS.hats[h] || !PARTS.hats[h][key]) miss.push(`hat placement ${h} on ${key}`);
}
for (const h of hats) for (const c of cls) for (const k of cols)
  for (const name of h === "flowers" ? ["flowers_back", "flowers_front"] : [h]) need.add(PARTS.hat_src.replace("{hat}", name).replace("{cls}", c).replace("{col}", k));
for (const p of Object.keys(CATALOG.companions).filter((p) => p !== "none")) { if (!PARTS.pets[p]) miss.push("pet " + p); else need.add(PARTS.pets[p].src); }
need.add(PARTS.wings.src); need.add(PARTS.crests.neta); need.add(PARTS.crests.roni);
for (const f of need) if (!fs.existsSync(path.join(root, f))) miss.push("file " + f);
if (miss.length) { console.error(miss.slice(0, 20).join("\n")); process.exit(1); }
console.log(`ok: ${need.size} pictures, all present`);
