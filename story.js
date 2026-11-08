// The hero's backstory, written from the kid's choices in the hero's gender and set in the legend of the broken
// shield (the first screen). A few parts come in more than one wording; which one is fixed by the hero's choices and
// a seed, so the same hero keeps the same story until the kid asks for another one.
// A plain script (not a module), like the rest of the site. Needs CATALOG, KIDS and TEAMS.

const HeroStory = (() => {
  // Every masculine/feminine pair this file uses for the hero, so the test can check a story uses only one gender.
  const PAIRS = [];
  const mf = (m, f) => { PAIRS.push([m, f]); return { m, f }; };

  // What each class does, in a sentence.
  const CLASS = {
    fighter: mf("מאז שהיה קטן הוא מתאמן בחרב ובמגן, ואין לוחם אמיץ ממנו בכל הסביבה.",
                "מאז שהייתה קטנה היא מתאמנת בחרב ובמגן, ואין לוחמת אמיצה ממנה בכל הסביבה."),
    wizard: mf("בלילות הוא קורא בספרי לחשים עתיקים, וכבר יודע להדליק אור בקצה המטה שלו.",
               "בלילות היא קוראת בספרי לחשים עתיקים, וכבר יודעת להדליק אור בקצה המטה שלה."),
    rogue: mf("הוא יודע לפתוח כל מנעול, ולהתגנב בלי להשמיע אפילו רחש.",
              "היא יודעת לפתוח כל מנעול, ולהתגנב בלי להשמיע אפילו רחש."),
    cleric: mf("בכוח האור הוא מרפא כל פצע, ואף פעם לא משאיר אף אחד מאחור.",
               "בכוח האור היא מרפאה כל פצע, ואף פעם לא משאירה אף אחד מאחור."),
    ranger: mf("הוא מכיר כל שביל, ויודע לקרוא עקבות כמו שאחרים קוראים ספר.",
               "היא מכירה כל שביל, ויודעת לקרוא עקבות כמו שאחרים קוראים ספר."),
    bard: mf("בשירים שלו יש קסם: כשהוא שר, אפילו העצים מקשיבים.",
             "בשירים שלה יש קסם: כשהיא שרה, אפילו העצים מקשיבים."),
    barbarian: mf("הוא לא מפחד משום דבר, וכשהוא שואג, ההרים רועדים.",
                  "היא לא מפחדת משום דבר, וכשהיא שואגת, ההרים רועדים."),
    druid: mf("הוא מדבר עם החיות, ויודע את השם של כל עץ ושל כל פרח.",
              "היא מדברת עם החיות, ויודעת את השם של כל עץ ושל כל פרח."),
    paladin: mf("הוא נשבע להגן על החלשים, והשריון שלו בוהק כמו השמש.",
                "היא נשבעה להגן על החלשים, והשריון שלה בוהק כמו השמש."),
  };

  // The two strengths, as things the hero is.
  const STRENGTH = {
    str: mf("חזק כמו דוב", "חזקה כמו דוב"),
    dex: mf("זריז כמו שועל", "זריזה כמו שועל"),
    con: mf("אף פעם לא מתעייף", "אף פעם לא מתעייפת"),
    int: mf("פותר כל חידה", "פותרת כל חידה"),
    wis: mf("שם לב לכל פרט קטן", "שמה לב לכל פרט קטן"),
    cha: mf("יכול לשכנע אפילו דרקון", "יכולה לשכנע אפילו דרקון"),
  };

  // Companions: the noun with its article, and its own gender (for "loyal" and "leaves").
  const PET = {
    fox: ["השועל", "m"], owl: ["הינשוף", "m"], cat: ["החתול", "m"], dragon: ["הדרקון הקטן", "m"],
    wolf: ["גור הזאב", "m"], raven: ["העורב", "m"], frog: ["הצפרדע", "f"], hedgehog: ["הקיפוד", "m"],
  };

  const HE = mf("הוא", "היא"), THAT_HE = mf("שהוא", "שהיא"), HIS = mf("שלו", "שלה"), HIM = mf("אותו", "אותה");
  const BESIDE = mf("לידו", "לידה"), PACKED = mf("ארז", "ארזה"), WENT = mf("יצא", "יצאה"), HEARD = mf("שמע", "שמעה");
  const UNDERSTOOD = mf("הבין", "הבינה"), HERO = mf("הגיבור", "הגיבורה"), ABOUT = mf("עליו", "עליה");
  const READY = mf("מוכן להיות אחד מהם", "מוכנה להיות אחת מהם"), FOUND = mf("מצא", "מצאה"), GATHERED = mf("אסף", "אספה");

  // A small, stable hash, so the wording a hero gets doesn't change on every visit.
  function hash(s) { let x = 2166136261; for (const c of s) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }

  // The backstory for hero h: { kid, gender, species, cls, strengths: [a, b], pet, homeland, name, storySeed }.
  function write(h) {
    const g = h.gender === "f" ? "f" : "m";
    const say = (pair) => pair[g];
    const kid = KIDS[h.kid] || {};
    const name = (h.name || "").trim() || say(HERO);
    const home = CATALOG.homelands[h.homeland];
    const pick = hash([h.kid, h.gender, h.species, h.cls, h.homeland, h.name, h.storySeed || 0].join("|"));
    const variant = (n, k) => Math.floor(pick / k) % n;

    const s = [];
    // Who and where from: "Roni is a ranger, an elf from the Valley of Flowers. There she grew up among..."
    s.push(`${name} ${say(HE)} ${CATALOG.classes[h.cls].he[g]}, ${CATALOG.species[h.species].he[g]} מ${home.he}.`);
    s.push(`${home.flavor[g]}.`);
    s.push(say(CLASS[h.cls]));
    // The strengths
    const [a, b] = h.strengths.map((k) => say(STRENGTH[k]));
    s.push([`כולם יודעים ${say(THAT_HE)} ${a} ו${b}.`,
            `בכל הממלכה מספרים ${say(THAT_HE)} ${a} ו${b}.`,
            `${say(HE)} ${a}, ו${b}.`][variant(3, 1)]);
    // The companion
    if (PET[h.pet]) {
      const [pet, pg] = PET[h.pet];
      s.push(`${pet} ${pg === "f" ? "הנאמנה" : "הנאמן"} ${say(HIS)} לא ${pg === "f" ? "עוזבת" : "עוזב"} ${say(HIM)} לרגע.`);
    }
    // The call to the quest, in the shield's legend
    if (kid.leader) {
      const other = KIDS.find((k) => k.leader && k.team !== kid.team);
      s.push(`יום אחד ${say(HE)} ${say(FOUND)} מפה עתיקה, שמראה לאן התפזרו חלקי המגן השבור.`);
      s.push(`${say(HE)} ${say(GATHERED)} חבורה של גיבורים אמיצים, ו${say(WENT)} בראשה לחפש אותם.`);
      if (other) s.push(`באותו זמן, בצד השני של הממלכה, גם ${other.name} כבר בדרך, בראש חבורה משלה.`);
    } else {
      s.push([`יום אחד הגיעה שמועה אל ${home.he}: חלקי המגן השבור מפוזרים בכל הממלכה, ונטע ורוני קוראות לגיבורים למצוא אותם.`,
              `בוקר אחד נחתה ${say(BESIDE)} יונה עם מכתב: נטע ורוני יוצאות למסע לאסוף את חלקי המגן השבור, וקוראות לגיבורים להצטרף אליהן.`,
              `ערב אחד, ליד המדורה, ${say(HE)} ${say(HEARD)} את האגדה על המגן השבור ועל שתי המלכות האחיות, ו${say(UNDERSTOOD)} שהגיע הזמן לצאת לדרך.`][variant(3, 3)]);
      const team = TEAMS[kid.team];
      s.push(`${say(HE)} ${say(PACKED)} את התיק ו${say(WENT)} לדרך, להצטרף לחבורה של ${team ? team.leader : "הגיבורים"}.`);
    }
    // The last line
    s.push([`אולי ${say(HE)} ${say(HERO)} שהאגדה מספרת ${say(ABOUT)}?`,
            `האגדה מספרת על חבורה של גיבורים ישרי לב, ו${name} ${say(READY)}.`][variant(2, 9)]);
    return s.join(" ");
  }

  return { write, PAIRS };
})();
