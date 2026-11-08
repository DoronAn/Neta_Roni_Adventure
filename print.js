// The print page: a hero code in, the hero's round relief out (preview and STL). Not linked from the site.
(() => {
  const $ = (id) => document.getElementById(id);
  const FIELDS = [["diameter", "קוטר"], ["rim", "רוחב השוליים"], ["base", "עובי הבסיס"], ["relief", "גובה התבליט"],
    ["plateau", "גובה הדמות"], ["dome", "עיגול שולי הדמות"], ["minLine", "עובי קו מינימלי"], ["pocketDiameter", "קוטר שקע המגנט"], ["pocketDepth", "עומק שקע המגנט"],
    ["grid", "רזולוציה"]];
  $("settings").innerHTML = FIELDS.map(([k, label]) =>
    `<label>${label}<input type="number" step="0.05" min="0" id="set-${k}" value="${Relief.DEFAULTS[k]}"></label>`).join("");
  const settings = () => Object.fromEntries(FIELDS.map(([k]) => [k, parseFloat($(`set-${k}`).value) || Relief.DEFAULTS[k]]));

  const state = { code: "", hero: null, hm: null };
  window.printState = state;            // for the automated check

  async function make() {
    $("err").textContent = ""; $("download").disabled = true;
    const code = $("code").value.trim().toUpperCase();
    const h = HeroCode.decode(code);
    if (!h) { $("err").textContent = "הקוד לא תקין. בדקו אותו שוב מול הכרטיס."; $("out").hidden = true; return; }
    const S = settings();
    if (S.base <= S.pocketDepth) { $("err").textContent = "הבסיס צריך להיות עבה יותר מעומק שקע המגנט."; return; }
    $("make").disabled = true; $("make").textContent = "מכינים…";
    try {
      const kid = KIDS[h.kid], g = h.gender;
      $("who").textContent = `${kid.name} · ${TEAMS[kid.team].he}`;
      $("who2").textContent = `${CATALOG.species[h.species].he[g]} · ${CATALOG.classes[h.cls].he[g]} · ${CATALOG.headwear[h.hat]}. שם הגיבור לחריטה מופיע בכרטיס.`;
      const hm = await Relief.heights(h, S);
      Object.assign(state, { code, hero: h, hm });
      Relief.preview(hm, $("relief"));
      const pc = $("portrait"); pc.width = pc.height = hm.portrait.width; pc.getContext("2d").drawImage(hm.portrait, 0, 0);
      $("out").hidden = false; $("download").disabled = false;
      $("stats").textContent = `${S.diameter} מ"מ, עובי עד ${(S.base + S.relief).toFixed(1)} מ"מ`;
      history.replaceState(null, "", `?code=${code}`);
    } catch (e) { console.error(e); $("err").textContent = "משהו השתבש: " + e.message; }
    $("make").disabled = false; $("make").textContent = "הכנה";
  }

  function download() {
    if (!state.hm) return;
    const buf = Relief.stl(state.hm);
    const url = URL.createObjectURL(new Blob([buf], { type: "model/stl" }));
    const a = document.createElement("a"); a.href = url; a.download = `${state.code}.stl`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    $("stats").textContent = `${(buf.byteLength / 1e6).toFixed(1)} MB · ${new DataView(buf).getUint32(80, true).toLocaleString()} משולשים`;
  }

  $("make").addEventListener("click", make);
  $("code").addEventListener("keydown", (e) => { if (e.key === "Enter") make(); });
  $("download").addEventListener("click", download);
  const q = new URLSearchParams(location.search).get("code");
  if (q) { $("code").value = q; make(); }
})();
