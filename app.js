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
    const i = DOTTED.indexOf(hero.step);
    const dots = DOTTED.map((s, j) => `<i class="${j < i ? "on" : j === i ? "now" : ""}"></i>`).join("");
    return `<div class="top"><button class="back" data-act="back" aria-label="חזרה">→</button><div class="dots">${dots}</div></div>`;
  }
  const bar = (label, enabled = true, act = "next", inline = false) =>
    `<div class="bar${inline ? " inline" : ""}"><div><button class="btn" data-act="${act}" ${enabled ? "" : "disabled"}>${label}</button></div></div>`;

  // Draws the hero (or part of it) on every canvas carrying data-hero, once the page has laid them out.
  function paint() {
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

  // ---------- the screens ----------
  const SCREENS = {
    legend() {
      return `<section class="legend">
        <svg class="shield" viewBox="0 0 150 170" aria-hidden="true">
          <g fill="#c8962e" stroke="#2b1d14" stroke-width="4" stroke-linejoin="round">
            <path d="M75 8 L136 28 Q138 98 75 160 Z" transform="translate(6,4)"/>
            <path d="M75 8 L14 28 Q12 98 75 160 Z" transform="translate(-6,-2) rotate(-4 75 80)"/>
          </g>
          <g fill="none" stroke="#2b1d14" stroke-width="3" stroke-linecap="round">
            <path d="M81 40 L74 62 L84 78 L72 100" transform="translate(6,4)"/>
            <path d="M44 50 L58 66" /><path d="M104 104 L116 92" />
          </g>
        </svg>
        <h1>המגן השבור</h1>
        <p>לפני הרבה מאוד שנים, מגן קסום שמר על הממלכה ונתן לה כוח גדול.</p>
        <p>אבל יום אחד שתי המלכות, שתי אחיות, רבו זו עם זו, והמגן נשבר. השברים שלו התפזרו בכל רחבי הממלכה.</p>
        <p>האגדה מספרת שיבוא יום, ותגיע חבורה של גיבורים ישרי לב, שתמצא את השברים ותאחד את הממלכה מחדש.</p>
        <p class="call">נטע ורוני יוצאות למסע וקוראות לגיבורים להצטרף אליהן.</p>
        ${bar("יוצאים לדרך!", true, "next", true)}
      </section>`;
    },

    kid() {
      const team = (k) => `<div class="team ${k}">
          <div class="team-head"><img src="${PARTS.crests[k]}" alt=""><h3>${TEAMS[k].he}</h3></div>
          <div class="names">${KIDS.map((c, i) => (c.team === k ? `<button class="card ${hero.kid === i ? "on" : ""}" data-act="kid" data-v="${i}">${esc(c.name)}</button>` : "")).join("")}</div>
        </div>`;
      return `${top()}<h2>איך קוראים לך?</h2><p class="sub">לחצו על השם שלכם</p>${team("neta")}${team("roni")}`;
    },

    gender() {
      return `${top()}<h2>${esc(kid().name)}, מי יוצא למסע?</h2>
        <div class="genders">
          <button class="card ${hero.gender === "m" ? "on" : ""}" data-act="gender" data-v="m">גיבור</button>
          <button class="card ${hero.gender === "f" ? "on" : ""}" data-act="gender" data-v="f">גיבורה</button>
        </div>`;
    },

    species() {
      const cards = Object.keys(CATALOG.species).map((k) => `<button class="card ${hero.species === k ? "on" : ""}" data-act="species" data-v="${k}">
          ${canvas({ species: k, hat: "none" }, "head", "sq", "fit")}
          <div class="name">${speciesName(k)}</div><div class="desc">${CATALOG.species[k].desc_he[g()]}</div></button>`).join("");
      return `${top()}<h2>${t("בחר את העם שלך", "בחרי את העם שלך")}</h2><div class="grid">${cards}</div>`;
    },

    cls() {
      const cards = Object.keys(CATALOG.classes).map((k) => `<button class="card ${hero.cls === k ? "on" : ""}" data-act="cls" data-v="${k}">
          ${canvas({ cls: k, colour: "original" }, "body", "tall", "fit")}
          <div class="name">${className(k)}</div><div class="desc">${CATALOG.classes[k].desc_he[g()]}</div></button>`).join("");
      return `${top()}<h2>${t("מה אתה יודע לעשות הכי טוב?", "מה את יודעת לעשות הכי טוב?")}</h2><div class="grid three">${cards}</div>`;
    },

    colour() {
      const sw = Object.keys(CATALOG.outfit_colors).map((k) => `<button class="swatch ${hero.colour === k ? "on" : ""}" data-act="colour" data-v="${k}">
          <b style="background:${PARTS.swatch[`${hero.cls}/${k}`]}"></b><span>${CATALOG.outfit_colors[k]}</span></button>`).join("");
      return `${top()}<div class="stage">${canvas({}, "all")}</div><h2>באיזה צבע הבגדים?</h2><div class="swatches">${sw}</div>${bar("המשך")}`;
    },

    hat() {
      const cards = Object.keys(CATALOG.headwear).map((k) => `<button class="card ${hero.hat === k ? "on" : ""}" data-act="hat" data-v="${k}">
          ${canvas({ hat: k }, "head", "sq", "fit")}<div class="name">${CATALOG.headwear[k]}</div></button>`).join("");
      return `${top()}<div class="stage">${canvas({}, "all")}</div><h2>מה על הראש?</h2><div class="grid three">${cards}</div>${bar("המשך")}`;
    },

    pet() {
      const cards = Object.keys(CATALOG.companions).map((k) => `<button class="card ${hero.pet === k ? "on" : ""}" data-act="pet" data-v="${k}">
          ${k === "none" ? `<div class="none-pet"></div>` : `<img src="${PARTS.pets[k].src}" alt="">`}<div class="name">${CATALOG.companions[k]}</div></button>`).join("");
      return `${top()}<div class="stage">${canvas({}, "all")}</div><h2>מי מצטרף אליך למסע?</h2><div class="grid three pets">${cards}</div>${bar("המשך")}`;
    },

    strengths() {
      const sug = CATALOG.classes[hero.cls].suggested;
      const cards = Object.keys(CATALOG.abilities).map((k) => {
        const a = CATALOG.abilities[k], on = hero.strengths.includes(k);
        return `<button class="card strength ${on ? "on" : ""}" data-act="strength" data-v="${k}">
          ${sug.includes(k) ? `<span class="tag">⭐ מתאים ל${className()}</span>` : ""}
          <div class="name">${a.he}</div><div class="desc">${a.desc_he}</div></button>`;
      }).join("");
      const n = hero.strengths.length;
      return `${top()}<h2>${t("במה אתה הכי חזק?", "במה את הכי חזקה?")}</h2>
        <p class="count">${n === 2 ? "מעולה!" : `${t("בחר", "בחרי")} עוד ${n === 1 ? "אחת" : "שתיים"}`}</p>
        <div class="grid">${cards}</div>${bar("המשך", n === 2)}`;
    },

    name() {
      return `${top()}<div class="stage small">${canvas({}, "all")}</div>
        <h2>${t("איך קוראים לגיבור שלך?", "איך קוראים לגיבורה שלך?")}</h2>
        <input class="field" id="hero-name" maxlength="24" autocomplete="off" enterkeyhint="done"
               placeholder="${t("שם הגיבור", "שם הגיבורה")}" value="${esc(hero.name)}">
        <div class="row"><button class="btn ghost small" data-act="suggest">הצעה לשם ✨</button></div>
        <p class="hint">${t("השם יופיע על כרטיס הגיבור", "השם יופיע על כרטיס הגיבורה")}</p>
        ${bar("המשך", hero.name.trim().length > 0)}`;
    },

    homeland() {
      if (!hero.homeland) set({ homeland: pick(Object.keys(CATALOG.homelands)) });
      const cards = Object.keys(CATALOG.homelands).map((k) => `<button class="card ${hero.homeland === k ? "on" : ""}" data-act="homeland" data-v="${k}">
          <div class="name">${CATALOG.homelands[k].he}</div></button>`).join("");
      return `${top()}<h2>${t("מאיפה אתה בא?", "מאיפה את באה?")}</h2><div class="homes">${cards}</div>
        <div class="story">${esc(draftStory())}</div>${bar("סיימתי!")}`;
    },

    done() {
      let code = "";
      try { code = HeroCode.encode(hero); } catch (e) { console.warn(e); }
      const str = hero.strengths.map((k) => CATALOG.abilities[k].he).join(" · ");
      return `<section class="done">${canvas({}, "all")}
        <div class="hero-name">${esc(hero.name)}</div>
        <p class="what">${speciesName()} · ${className()}</p>
        <p class="str">${str}</p>
        ${code ? `<span class="code">${code}</span>` : ""}
        <div class="stack">
          <button class="btn ghost" data-act="edit">לשנות משהו</button>
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
