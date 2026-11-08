// The screens, in order, and what each one saves. The hero is kept on the phone as it's built (localStorage),
// so closing the page and coming back carries on where the kid stopped. Steps 5-8 of the plan add the backstory,
// the card, the print page and the reveal; the "done" screen here is where the card will go.

(() => {
  const STORE = "nra-hero-v1";
  const STEPS = ["legend", "kid", "gender", "species", "cls", "colour", "hat", "pet", "strengths", "name", "homeland", "done"];
  const DOTTED = STEPS.slice(1, -1);                   // the steps that show progress dots
  const app = document.getElementById("app");

  // ---------- state ----------
  const blank = () => ({ step: "legend", colour: "original", hat: "none", pet: "none", strengths: [], name: "" });
  let hero = load();
  function load() {
    try { const h = JSON.parse(localStorage.getItem(STORE)); if (h && STEPS.includes(h.step)) return { ...blank(), ...h }; } catch (e) {}
    return blank();
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(hero)); } catch (e) {} }
  function set(changes) { Object.assign(hero, changes); save(); }

  // ---------- words ----------
  const g = () => hero.gender || "m";
  const t = (m, f) => (g() === "f" ? f : m);
  const kid = () => KIDS[hero.kid];
  const speciesName = (k = hero.species) => CATALOG.species[k].he[g()];
  const className = (k = hero.cls) => CATALOG.classes[k].he[g()];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- navigation ----------
  function go(step, push = true) {
    set({ step });
    if (push) history.pushState({ step }, "");
    render();
    window.scrollTo(0, 0);
  }
  function back() {
    const i = STEPS.indexOf(hero.step);
    if (i > 0) go(STEPS[i - 1]);
  }
  window.addEventListener("popstate", (e) => { if (e.state && e.state.step) { set({ step: e.state.step }); render(); } });

  function top() {
    const i = hero.step === "done" ? DOTTED.length : DOTTED.indexOf(hero.step);
    const stars = DOTTED.map((st, j) => UI.star(j < i ? "on" : j === i ? "now" : "")).join("");
    const crest = kid() ? `<img class="crest" src="${PARTS.crests[kid().team]}" alt="${TEAMS[kid().team].he}">` : `<span class="crest none"></span>`;
    return `<div class="top"><button class="back" data-act="back" aria-label="חזרה">→</button><div class="progress">${stars}</div>${crest}</div>`;
  }
  // A chapter heading: "פרק ג׳", the title (a word in <em> turns red), and a star divider unless it's tight.
  const head = (title, divider = true) =>
    `<p class="kicker">${UI.chapter(DOTTED.indexOf(hero.step))}</p><h2>${title}</h2>${divider ? UI.stars() : ""}`;
  const bar = (label, enabled = true, act = "next", inline = false) =>
    `<div class="bar${inline ? " inline" : ""}"><button class="btn" data-act="${act}" ${enabled ? "" : "disabled"}>${label}</button></div>`;

  // Draws the hero (or part of it) on every canvas carrying data-hero, once the page has laid them out.
  function paint() {
    // a sideways row keeps the chosen card in sight after the screen redraws
    app.querySelectorAll(".strip .card.on").forEach((c) => c.scrollIntoView({ block: "nearest", inline: "center" }));
    requestAnimationFrame(() => {
      app.querySelectorAll("canvas[data-hero]").forEach((cv) => {
        const h = { ...hero, ...JSON.parse(cv.dataset.hero) };
        HeroArt.draw(cv, h, { part: cv.dataset.part || "all", frame: cv.dataset.frame === "fit" ? "fit" : undefined })
          .catch((e) => console.warn(e));
      });
    });
  }
  const canvas = (h, part, cls = "", frame = "") =>
    `<canvas class="${cls}" data-hero='${esc(JSON.stringify(h))}' data-part="${part}" ${frame ? `data-frame="${frame}"` : ""}></canvas>`;
  const portrait = (small = false) => `<div class="stage${small ? " small" : ""}">${canvas({}, "all")}</div>`;

  // ---------- the screens ----------
  const SCREENS = {
    legend() {
      return `<section class="legend">
        <p class="call">הרפתקנים מכל קצוות הממלכה</p>
        <div class="scene"><img class="crest-stamp neta" src="ui/stamp_neta.webp" alt="">${UI.shield("shield")}<img class="crest-stamp roni" src="ui/stamp_roni.webp" alt=""></div>
        <h1>המגן <em>השבור</em></h1>
        ${UI.stars()}
        <div class="text">
          ${UI.stamp(["דרושים", "גיבורים"], "stamp")}
          <p>לפני הרבה מאוד שנים, מגן קסום שמר על הממלכה ונתן לה כוח גדול.</p>
          <p>אבל יום אחד שתי המלכות, שתי אחיות, רבו זו עם זו, והמגן נשבר. השברים שלו התפזרו בכל רחבי הממלכה.</p>
          <p>האגדה מספרת שיבוא יום, ותגיע חבורה של גיבורים ישרי לב, שתמצא את השברים ותאחד את הממלכה מחדש.</p>
        </div>
        <p class="call big">נטע ורוני יוצאות למסע<br>וקוראות לגיבורים להצטרף אליהן!</p>
        ${bar("יוצאים למסע!", true, "next", true)}
      </section>`;
    },

    kid() {
      const team = (k) => `<div class="team ${k}">
          <div class="team-head"><img src="${PARTS.crests[k]}" alt=""><span class="ribbon">${TEAMS[k].he}</span></div>
          <div class="names">${KIDS.map((c, i) => (c.team === k ? `<button class="card ${hero.kid === i ? "on" : ""}" data-act="kid" data-v="${i}">${esc(c.name)}</button>` : "")).join("")}</div>
        </div>`;
      return `${top()}${head("איך <em>קוראים</em> לך?")}${team("neta")}${team("roni")}`;
    },

    gender() {
      const card = (v, label) => `<button class="card ${hero.gender === v ? "on" : ""}" data-act="gender" data-v="${v}">
          ${canvas({ species: "human", gender: v, hat: "none" }, "head", "sq", "fit")}<div class="name">${label}</div></button>`;
      return `${top()}${head(`${esc(kid().name)}, מי יוצא <em>למסע</em>?`)}<div class="genders">${card("m", "גיבור")}${card("f", "גיבורה")}</div>`;
    },

    species() {
      const cards = Object.keys(CATALOG.species).map((k) => `<button class="card ${hero.species === k ? "on" : ""}" data-act="species" data-v="${k}">
          ${canvas({ species: k, hat: "none" }, "head", "sq", "fit")}
          <div class="name">${speciesName(k)}</div><div class="desc">${CATALOG.species[k].desc_he[g()]}</div></button>`).join("");
      return `${top()}${head(`${t("בחר", "בחרי")} את <em>העם</em> שלך`)}<div class="grid">${cards}</div>`;
    },

    cls() {
      const cards = Object.keys(CATALOG.classes).map((k) => `<button class="card ${hero.cls === k ? "on" : ""}" data-act="cls" data-v="${k}">
          ${canvas({ cls: k, colour: "original" }, "body", "tall", "fit")}
          <div class="name">${className(k)}</div><div class="desc">${CATALOG.classes[k].desc_he[g()]}</div></button>`).join("");
      return `${top()}${head(`מה ${t("אתה יודע", "את יודעת")} <em>הכי טוב</em>?`)}<div class="grid three">${cards}</div>`;
    },

    colour() {
      const sw = Object.keys(CATALOG.outfit_colors).map((k) => `<button class="swatch ${hero.colour === k ? "on" : ""}" data-act="colour" data-v="${k}">
          <b style="background:${PARTS.swatch[`${hero.cls}/${k}`]}"></b><span>${CATALOG.outfit_colors[k]}</span></button>`).join("");
      return `${top()}${portrait()}${head("באיזה <em>צבע</em> הבגדים?", false)}<div class="swatches">${sw}</div>${bar("המשך")}`;
    },

    hat() {
      const cards = Object.keys(CATALOG.headwear).map((k) => `<button class="card ${hero.hat === k ? "on" : ""}" data-act="hat" data-v="${k}">
          ${canvas({ hat: k }, "head", "sq", "fit")}<div class="name">${CATALOG.headwear[k]}</div></button>`).join("");
      return `${top()}${portrait()}${head("מה על <em>הראש</em>?", false)}<div class="strip">${cards}</div>${bar("המשך")}`;
    },

    pet() {
      const cards = Object.keys(CATALOG.companions).map((k) => `<button class="card ${hero.pet === k ? "on" : ""}" data-act="pet" data-v="${k}">
          ${k === "none" ? `<div class="none-pet"></div>` : `<img src="${PARTS.pets[k].src}" alt="">`}<div class="name">${CATALOG.companions[k]}</div></button>`).join("");
      return `${top()}${portrait()}${head("מי <em>מצטרף</em> אליך?", false)}<div class="strip">${cards}</div>${bar("המשך")}`;
    },

    strengths() {
      const sug = CATALOG.classes[hero.cls].suggested;
      const cards = Object.keys(CATALOG.abilities).map((k) => {
        const a = CATALOG.abilities[k], on = hero.strengths.includes(k);
        return `<button class="card strength ${on ? "on" : ""}" data-act="strength" data-v="${k}">
          ${sug.includes(k) ? `<span class="tag">★ מתאים ל${className()}</span>` : ""}
          ${UI.icon(k)}<div class="name">${a.he}</div><div class="desc">${a.desc_he}</div></button>`;
      }).join("");
      const n = hero.strengths.length;
      return `${top()}${head(`במה ${t("אתה", "את")} <em>${t("הכי חזק", "הכי חזקה")}</em>?`)}
        <p class="count">${n === 2 ? "מעולה!" : `${t("בחר", "בחרי")} עוד ${n === 1 ? "אחת" : "שתיים"}`}</p>
        <div class="grid">${cards}</div>${bar("המשך", n === 2)}`;
    },

    name() {
      return `${top()}${portrait(true)}${head(`איך קוראים ${t("לגיבור", "לגיבורה")} <em>שלך</em>?`, false)}
        <input class="field" id="hero-name" maxlength="24" autocomplete="off" enterkeyhint="done"
               placeholder="${t("שם הגיבור", "שם הגיבורה")}" value="${esc(hero.name)}">
        <div class="row"><button class="btn ghost small" data-act="suggest">✦ הצעה לשם</button></div>
        <p class="hint">${t("השם יופיע על כרטיס הגיבור", "השם יופיע על כרטיס הגיבורה")}</p>
        ${bar("המשך", hero.name.trim().length > 0)}`;
    },

    homeland() {
      if (!hero.homeland) set({ homeland: pick(Object.keys(CATALOG.homelands)) });
      const cards = Object.keys(CATALOG.homelands).map((k) => `<button class="card ${hero.homeland === k ? "on" : ""}" data-act="homeland" data-v="${k}">
          ${UI.icon(k)}<div class="name">${CATALOG.homelands[k].he}</div></button>`).join("");
      return `${top()}${head(`מאיפה ${t("אתה", "את")} <em>${t("בא", "באה")}</em>?`)}<div class="homes">${cards}</div>
        <div class="scroll">${esc(draftStory())}</div>${bar("סיימתי!")}`;
    },

    done() {
      let code = "";
      try { code = HeroCode.encode(hero); } catch (e) { console.warn(e); }
      const seals = hero.strengths.map((k) => `<div class="seal"><i>${UI.icon(k)}</i>${CATALOG.abilities[k].he}</div>`).join("");
      return `<section class="done">${top()}${portrait()}
        <div class="banner"><span>${esc(hero.name)}</span></div>
        <p class="what">${speciesName()} · ${className()}</p>
        <div class="seals">${seals}</div>
        ${code ? `<span class="code">${code}</span>` : ""}
        <div class="stack">
          <button class="btn ghost small" data-act="edit">לשנות משהו</button>
          <button class="btn ghost small" data-act="restart">להתחיל מחדש</button>
        </div></section>`;
    },
  };

  // The backstory is plan step 5 (story.js); until then, one line from the homeland.
  function draftStory() {
    const h = CATALOG.homelands[hero.homeland];
    return `${hero.name || t("הגיבור", "הגיבורה")} ${t("גדל", "גדלה")} ${h.in_he}. ${h.flavor[g()]}.`;
  }

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function suggestName() {
    const pool = hero.strengths.length ? hero.strengths : Object.keys(CATALOG.abilities);
    return `${kid().name} ${pick(CATALOG.epithets[pick(pool)][g()])}`;
  }

  // ---------- what a tap does ----------
  const next = () => go(STEPS[STEPS.indexOf(hero.step) + 1]);
  const ACTS = {
    back,
    next,
    kid: (v) => { set({ kid: +v }); teamClass(); next(); },
    gender: (v) => { set({ gender: v }); next(); },
    species: (v) => { set({ species: v }); next(); },
    cls: (v) => { set({ cls: v }); next(); },
    colour: (v) => { set({ colour: v }); render(); },
    hat: (v) => { set({ hat: v }); render(); },
    pet: (v) => { set({ pet: v }); render(); },
    strength: (v) => {
      let s = hero.strengths.filter((x) => x !== v);
      if (s.length === hero.strengths.length) s = [...s, v].slice(-2);   // a third pick replaces the oldest
      set({ strengths: s }); render();
    },
    suggest: () => { set({ name: suggestName() }); render(); },
    homeland: (v) => { set({ homeland: v }); render(); },
    edit: () => go("species"),
    restart: () => {
      if (!confirm("להתחיל גיבור חדש? הגיבור הזה יימחק מהטלפון (תמונה שכבר נשמרה נשארת).")) return;
      hero = blank(); save(); teamClass(); go("legend");
    },
  };
  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    if (hero.step === "name") set({ name: (document.getElementById("hero-name") || {}).value || hero.name });
    ACTS[b.dataset.act](b.dataset.v);
  });
  app.addEventListener("input", (e) => {
    if (e.target.id !== "hero-name") return;
    set({ name: e.target.value });
    const btn = app.querySelector('.bar [data-act="next"]');
    if (btn) btn.disabled = !e.target.value.trim();
  });
  app.addEventListener("keydown", (e) => {
    if (e.target.id === "hero-name" && e.key === "Enter" && e.target.value.trim()) { e.target.blur(); next(); }
  });

  function teamClass() {
    document.body.classList.remove("team-neta", "team-roni");
    if (kid()) document.body.classList.add("team-" + kid().team);
  }

  // ---------- drawing a screen ----------
  function ready(step) {      // a screen needs the choices before it; if one is missing, start from there
    const need = { gender: ["kid"], species: ["kid", "gender"], cls: ["species"], colour: ["cls"], hat: ["cls"], pet: ["cls"],
                   strengths: ["cls"], name: ["cls"], homeland: ["name"], done: ["homeland", "strengths"] }[step] || [];
    for (const k of need) {
      const missing = k === "kid" ? !kid() : k === "strengths" ? hero.strengths.length !== 2 : k === "name" ? !hero.name.trim() : !hero[k];
      if (missing) return k;              // each needed choice is made on the step of the same name
    }
    return step;
  }
  function render() {
    const step = ready(hero.step);
    if (step !== hero.step) set({ step });
    app.innerHTML = SCREENS[step]();
    paint();
    prefetch(step);
  }
  function prefetch(step) {      // the next screen's pictures, while the kid is still looking at this one
    if (step === "gender" || step === "species") Object.keys(CATALOG.species).forEach((s) => ["m", "f"].forEach((gg) => HeroArt.preload({ species: s, gender: gg, hat: "none" }, "head")));
    if (step === "species" && hero.species) Object.keys(CATALOG.classes).forEach((c) => HeroArt.preload({ ...hero, cls: c, colour: "original" }, "body"));
    if (step === "cls" && hero.cls) Object.keys(CATALOG.outfit_colors).forEach((c) => HeroArt.preload({ ...hero, colour: c }));
    if (step === "colour") Object.keys(CATALOG.headwear).forEach((k) => HeroArt.preload({ ...hero, hat: k }));
  }

  teamClass();
  history.replaceState({ step: hero.step }, "");
  render();
})();
