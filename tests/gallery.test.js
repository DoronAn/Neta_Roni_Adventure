// The gallery: every card in gallery.js belongs to a kid in kids.js and its image is there, small enough for a phone.
// Run: node tests/gallery.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {}; vm.createContext(ctx);
for (const f of ["kids.js", "gallery.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8") + "\nthis.KIDS=typeof KIDS!=='undefined'?KIDS:this.KIDS;this.GALLERY=typeof GALLERY!=='undefined'?GALLERY:this.GALLERY;", ctx);
const { KIDS, GALLERY } = ctx;
let n = 0;
for (const [k, src] of Object.entries(GALLERY)) {
  const i = Number(k);
  if (!Number.isInteger(i) || !KIDS[i]) throw new Error(`gallery.js: ${k} is not a kid's position in kids.js`);
  if (src !== `gallery/${i}.jpg`) throw new Error(`gallery.js: ${k} should point at gallery/${i}.jpg, not ${src}`);
  const file = path.join(root, src);
  if (!fs.existsSync(file)) throw new Error(`gallery.js: ${src} is missing`);
  if (fs.statSync(file).size > 400 * 1024) throw new Error(`${src} is over 400 KB; shrink it to 600 px wide`);
  n++;
}
console.log(`gallery ok: ${n} of ${KIDS.length} heroes in`);
