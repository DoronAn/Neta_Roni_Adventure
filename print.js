// The print page: a hero code in; the hero's round relief and the crest plate for its back out (previews and STLs).
// Not linked from the site.
(() => {
  const $ = (id) => document.getElementById(id);
  const FIELDS = [["diameter", "קוטר"], ["rim", "רוחב השוליים"], ["base", "עובי הבסיס"], ["relief", "גובה התבליט"],
    ["step", "בליטת הדמות מהרקע"], ["groove", "עומק החריטה"], ["engrave", "חריטת קווי הציור (1 כן, 0 לא)"],
    ["pocketDiameter", "קוטר שקע המגנט"], ["pocketDepth", "עומק שקע המגנט"], ["plateBase", "עובי הלוחית"],
    ["plateRelief", "גובה הסמל בלוחית"], ["grid", "רזולוציה"]];
  $("settings").innerHTML = FIELDS.map(([k, label]) =>
    `<label>${label}<input type="number" step="0.05" min="0" id="set-${k}" value="${Relief.DEFAULTS[k]}"></label>`).join("");
  const settings = () => Object.fromEntries(FIELDS.map(([k]) => {
    const v = parseFloat($(`set-${k}`).value);
    return [k, Number.isFinite(v) ? v : Relief.DEFAULTS[k]];
  }));

  const state = { code: "", hero: null, front: null, plate: null };
  window.printState = state;            // for the automated check

  async function make() {
    $("err").textContent = ""; $("download").disabled = $("download-plate").disabled = true;
    const code = $("code").value.trim().toUpperCase();
    const h = HeroCode.decode(code);
    if (!h) { $("err").textContent = "הקוד לא תקין. בדקו אותו שוב מול הכרטיס."; $("out").hidden = true; return; }
    const S = settings();
    if (S.base <= S.pocketDepth + 0.5) { $("err").textContent = "הבסיס צריך להיות עבה לפחות בחצי מילימטר משקע המגנט."; return; }
    $("make").disabled = true; $("make").textContent = "מכינים…";
    try {
      const kid = KIDS[h.kid], g = h.gender;
      $("who").textContent = `${kid.name} · ${TEAMS[kid.team].he}`;
      $("who2").textContent = `${CATALOG.species[h.species].he[g]} · ${CATALOG.classes[h.cls].he[g]} · ${CATALOG.headwear[h.hat]} · ${CATALOG.homelands[h.homeland].he || h.homeland}.`;
      const [front, plate, pc] = await Promise.all([Relief.front(h, S), Relief.plate(h, S), Relief.portrait(h, 512)]);
      Object.assign(state, { code, hero: h, front, plate });
      Relief.preview(front, $("relief"));
      Relief.preview(Relief.printed(front), $("printed"));
      Relief.preview(plate, $("plate"));
      const cv = $("portrait"); cv.width = cv.height = pc.width; cv.getContext("2d").drawImage(pc, 0, 0);
      $("out").hidden = false; $("download").disabled = $("download-plate").disabled = false;
      $("stats").textContent = `${S.diameter} מ"מ. התבליט בעובי ${front.top.toFixed(1)} מ"מ, הלוחית ${plate.top.toFixed(1)} מ"מ.`;
      history.replaceState(null, "", `?code=${code}`);
    } catch (e) { console.error(e); $("err").textContent = "משהו השתבש: " + e.message; }
    $("make").disabled = false; $("make").textContent = "הכנה";
  }

  function download(which) {
    const hm = state[which]; if (!hm) return;
    const buf = Relief.stl(hm, which === "plate" ? "Hero plate, millimetres" : "Hero relief, millimetres");
    const url = URL.createObjectURL(new Blob([buf], { type: "model/stl" }));
    const a = document.createElement("a"); a.href = url; a.download = which === "plate" ? `${state.code}-plate.stl` : `${state.code}.stl`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  $("make").addEventListener("click", make);
  $("code").addEventListener("keydown", (e) => { if (e.key === "Enter") make(); });
  $("download").addEventListener("click", () => download("front"));
  $("download-plate").addEventListener("click", () => download("plate"));
  const q = new URLSearchParams(location.search).get("code");
  if (q) { $("code").value = q; make(); }
})();
