// Everything a hero can be built from.
//
// The Hebrew names are a FIRST DRAFT: the birthday kids get the final say. Each name
// has a masculine (m) and feminine (f) form; the page shows the one matching the
// hero's gender. Keys end up in heroes saved on the kids' phones, so rename the
// Hebrew freely, but don't change a key once the link is out.
//
// A plain script (not a module) so it also loads when the page is opened as a file.
const CATALOG = {
  "abilities": {
    "str": {
      "he": "כוח",
      "en": "Strength",
      "desc_he": "להרים, לדחוף ולשבור"
    },
    "dex": {
      "he": "זריזות",
      "en": "Dexterity",
      "desc_he": "לקפוץ, להתגנב ולכוון"
    },
    "con": {
      "he": "חוסן",
      "en": "Constitution",
      "desc_he": "לא להתעייף ולא לוותר"
    },
    "int": {
      "he": "תבונה",
      "en": "Intelligence",
      "desc_he": "חידות, צפנים ומפות"
    },
    "wis": {
      "he": "חוכמה",
      "en": "Wisdom",
      "desc_he": "לשים לב לפרטים ולהרגיש סכנה"
    },
    "cha": {
      "he": "כריזמה",
      "en": "Charisma",
      "desc_he": "לשכנע, לשיר ולהצחיק"
    }
  },
  "species": {
    "human": {
      "he": {
        "m": "בן אנוש",
        "f": "בת אנוש"
      },
      "en": "Human",
      "desc_he": "אמיץ, סקרן ומסוגל להכול"
    },
    "elf": {
      "he": {
        "m": "אלף",
        "f": "אלפית"
      },
      "en": "Elf",
      "desc_he": "חד עין וקל רגליים, חי מאות שנים"
    },
    "dwarf": {
      "he": {
        "m": "גמד",
        "f": "גמדה"
      },
      "en": "Dwarf",
      "desc_he": "חסון ועקשן, אוהב מערות ואוצרות"
    },
    "dragonborn": {
      "he": {
        "m": "בן דרקון",
        "f": "בת דרקון"
      },
      "en": "Dragonborn",
      "desc_he": "צאצא של דרקונים עם נשיפה עוצמתית"
    },
    "tabaxi": {
      "he": {
        "m": "בן חתול",
        "f": "בת חתול"
      },
      "en": "Tabaxi",
      "desc_he": "זריז וסקרן כמו חתול"
    },
    "fairy": {
      "he": {
        "m": "פֵיוֹן",
        "f": "פֵיָה"
      },
      "en": "Fairy",
      "desc_he": "קטן, מעופף וקסום"
    }
  },
  "classes": {
    "fighter": {
      "he": {
        "m": "לוחם",
        "f": "לוחמת"
      },
      "en": "Fighter",
      "desc_he": "מומחה לנשק ולקרב",
      "suggested": [
        "str",
        "con"
      ]
    },
    "wizard": {
      "he": {
        "m": "קוסם",
        "f": "קוסמת"
      },
      "en": "Wizard",
      "desc_he": "לומד לחשים מספרים עתיקים",
      "suggested": [
        "int",
        "wis"
      ]
    },
    "rogue": {
      "he": {
        "m": "חמקן",
        "f": "חמקנית"
      },
      "en": "Rogue",
      "desc_he": "שקט, זריז ופותח כל מנעול",
      "suggested": [
        "dex",
        "int"
      ]
    },
    "cleric": {
      "he": {
        "m": "מרפא",
        "f": "מרפאה"
      },
      "en": "Cleric",
      "desc_he": "מרפא חברים בכוח האור",
      "suggested": [
        "wis",
        "cha"
      ]
    },
    "ranger": {
      "he": {
        "m": "סייר",
        "f": "סיירת"
      },
      "en": "Ranger",
      "desc_he": "עוקב אחרי עקבות ומכיר כל שביל",
      "suggested": [
        "dex",
        "wis"
      ]
    },
    "bard": {
      "he": {
        "m": "פייטן",
        "f": "פייטנית"
      },
      "en": "Bard",
      "desc_he": "עושה קסמים בשירים ובסיפורים",
      "suggested": [
        "cha",
        "dex"
      ]
    },
    "barbarian": {
      "he": {
        "m": "ברברי",
        "f": "ברברית"
      },
      "en": "Barbarian",
      "desc_he": "חזק במיוחד ולא מפחד מכלום",
      "suggested": [
        "str",
        "con"
      ]
    },
    "druid": {
      "he": {
        "m": "דרואיד",
        "f": "דרואידית"
      },
      "en": "Druid",
      "desc_he": "מדבר עם חיות ויכול להפוך לחיה",
      "suggested": [
        "wis",
        "con"
      ]
    },
    "paladin": {
      "he": {
        "m": "אביר",
        "f": "אבירה"
      },
      "en": "Paladin",
      "desc_he": "נשבע להגן על החלשים",
      "suggested": [
        "str",
        "cha"
      ]
    }
  },
  "colors": {
    "red": "אדום",
    "orange": "כתום",
    "yellow": "צהוב",
    "green": "ירוק",
    "blue": "כחול",
    "purple": "סגול",
    "pink": "ורוד",
    "black": "שחור",
    "white": "לבן",
    "gold": "זהב",
    "silver": "כסף"
  },
  "strengths_per_hero": 2
};
