// Draws every look a medal can have (6 species x 2 genders x 9 classes x 5 headwear = 540) as a 1024 px portrait,
// with the print page's own code and framing (Relief.portrait), for relief_maps.py. Serves the repo itself.
// Usage: node tools/parts/relief_portraits.js <repo root> <out dir> [only=<key,key,...>]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const [ROOT, OUT, ONLY] = process.argv.slice(2);
const only = ONLY ? new Set(ONLY.replace(/^only=/, "").split(",")) : null;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".css": "text/css" };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.route("http://relief.local/**", (r) => {
    const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: "" });
    r.fulfill({ body: fs.readFileSync(f), contentType: TYPES[path.extname(f)] || "application/octet-stream" });
  });
  await page.goto("http://relief.local/print.html");
  const looks = await page.evaluate(() => {
    const out = [];
    for (const species of Object.keys(CATALOG.species)) for (const gender of ["m", "f"])
      for (const cls of Object.keys(CATALOG.classes)) for (const hat of Object.keys(CATALOG.headwear))
        out.push({ species, gender, cls, hat });
    return out;
  });
  let n = 0;
  for (const look of looks) {
    const key = `${look.species}_${look.gender}_${look.cls}_${look.hat}`;
    if (only && !only.has(key)) continue;
    const file = path.join(OUT, `${key}.png`);
    if (fs.existsSync(file)) continue;
    const url = await page.evaluate(async (look) => {
      const h = { kid: 0, pet: "none", strengths: ["str", "dex"], homeland: Object.keys(CATALOG.homelands)[0], colour: "original", ...look };
      return (await Relief.portrait(h, 1024)).toDataURL("image/png");
    }, look);
    fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
    n++;
  }
  console.log(`${looks.length} looks, ${n} portraits written to ${OUT}`);
  await browser.close();
})();
