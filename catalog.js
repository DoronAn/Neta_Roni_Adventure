// Everything a hero can be built from.
//
// Order matters: the hero code stores each choice as its position in these lists,
// so add new entries at the END of a list, never in the middle.
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
      "desc_he": {
        "m": "אמיץ, סקרן ומסוגל להכול",
        "f": "אמיצה, סקרנית ומסוגלת להכול"
      }
    },
    "elf": {
      "he": {
        "m": "אלף",
        "f": "אלפית"
      },
      "en": "Elf",
      "desc_he": {
        "m": "חד עין וקל רגליים, חי מאות שנים",
        "f": "חדת עין וקלת רגליים, חיה מאות שנים"
      }
    },
    "dwarf": {
      "he": {
        "m": "גמד",
        "f": "גמדה"
      },
      "en": "Dwarf",
      "desc_he": {
        "m": "חסון ועקשן, אוהב מערות ואוצרות",
        "f": "חסונה ועקשנית, אוהבת מערות ואוצרות"
      }
    },
    "dragonborn": {
      "he": {
        "m": "בן דרקון",
        "f": "בת דרקון"
      },
      "en": "Dragonborn",
      "desc_he": {
        "m": "צאצא של דרקונים עם נשיפה עוצמתית",
        "f": "צאצאית של דרקונים עם נשיפה עוצמתית"
      }
    },
    "tabaxi": {
      "he": {
        "m": "בן חתול",
        "f": "בת חתול"
      },
      "en": "Tabaxi",
      "desc_he": {
        "m": "זריז וסקרן כמו חתול",
        "f": "זריזה וסקרנית כמו חתולה"
      }
    },
    "fairy": {
      "he": {
        "m": "פֵיוֹן",
        "f": "פֵיָה"
      },
      "en": "Fairy",
      "desc_he": {
        "m": "קטן, מעופף וקסום",
        "f": "קטנה, מעופפת וקסומה"
      }
    }
  },
  "classes": {
    "fighter": {
      "he": {
        "m": "לוחם",
        "f": "לוחמת"
      },
      "en": "Fighter",
      "desc_he": {
        "m": "מומחה לנשק ולקרב",
        "f": "מומחית לנשק ולקרב"
      },
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
      "desc_he": {
        "m": "לומד לחשים מספרים עתיקים",
        "f": "לומדת לחשים מספרים עתיקים"
      },
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
      "desc_he": {
        "m": "שקט, זריז ופותח כל מנעול",
        "f": "שקטה, זריזה ופותחת כל מנעול"
      },
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
      "desc_he": {
        "m": "מרפא חברים בכוח האור",
        "f": "מרפאה חברים בכוח האור"
      },
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
      "desc_he": {
        "m": "עוקב אחרי עקבות ומכיר כל שביל",
        "f": "עוקבת אחרי עקבות ומכירה כל שביל"
      },
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
      "desc_he": {
        "m": "עושה קסמים בשירים ובסיפורים",
        "f": "עושה קסמים בשירים ובסיפורים"
      },
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
      "desc_he": {
        "m": "חזק במיוחד ולא מפחד מכלום",
        "f": "חזקה במיוחד ולא מפחדת מכלום"
      },
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
      "desc_he": {
        "m": "מדבר עם חיות ויכול להפוך לחיה",
        "f": "מדברת עם חיות ויכולה להפוך לחיה"
      },
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
      "desc_he": {
        "m": "נשבע להגן על החלשים",
        "f": "נשבעה להגן על החלשים"
      },
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
  "strengths_per_hero": 2,
  "skins": {
    "human": [
      "#f6d3b3",
      "#e2a878",
      "#b8774a",
      "#7a4a2c"
    ],
    "elf": [
      "#f8dcc2",
      "#e6b48a",
      "#b98a62",
      "#8a6a8e"
    ],
    "dwarf": [
      "#f2c9a6",
      "#d99a6c",
      "#a8683f",
      "#6e4428"
    ],
    "dragonborn": [
      "#5aa65a",
      "#c8503c",
      "#c08a3a",
      "#4a7fc0"
    ],
    "tabaxi": [
      "#e89a4a",
      "#9a9aa2",
      "#4a4048",
      "#efd9b0"
    ],
    "fairy": [
      "#fbe0cc",
      "#e8b48c",
      "#b07a52",
      "#a3d9c9"
    ]
  },
  "hair_styles": {
    "short": {
      "he": "קצר"
    },
    "long": {
      "he": "ארוך"
    },
    "bun": {
      "he": "קוקו"
    },
    "wild": {
      "he": "פרוע"
    }
  },
  "hair_colors": {
    "black": {
      "he": "שחור",
      "hex": "#2a2220"
    },
    "brown": {
      "he": "חום",
      "hex": "#6b4226"
    },
    "blond": {
      "he": "בלונדיני",
      "hex": "#e2bd62"
    },
    "red": {
      "he": "ג'ינג'י",
      "hex": "#b5482a"
    }
  },
  "color_hex": {
    "red": "#c8323c",
    "orange": "#e77d24",
    "yellow": "#f2c230",
    "green": "#3f9b4a",
    "blue": "#2f6fc0",
    "purple": "#7b4bb8",
    "pink": "#e46fa7",
    "black": "#3a3a44",
    "white": "#efece4",
    "gold": "#d4a92c",
    "silver": "#b8bec7"
  },
  "homelands": {
    "mountains": {
      "he": "הרי השלג",
      "in_he": "בהרי השלג",
      "flavor": {
        "m": "שם למד לטפס על צוקים קפואים",
        "f": "שם למדה לטפס על צוקים קפואים"
      }
    },
    "forest": {
      "he": "היער הלוחש",
      "in_he": "ביער הלוחש",
      "flavor": {
        "m": "שם העצים לחשו לו סודות עתיקים",
        "f": "שם העצים לחשו לה סודות עתיקים"
      }
    },
    "sea": {
      "he": "חוף הצדפים",
      "in_he": "בחוף הצדפים",
      "flavor": {
        "m": "שם למד לשחות עם הדולפינים",
        "f": "שם למדה לשחות עם הדולפינים"
      }
    },
    "desert": {
      "he": "מדבר החול הזהוב",
      "in_he": "במדבר החול הזהוב",
      "flavor": {
        "m": "שם למד למצוא את הדרך לפי הכוכבים",
        "f": "שם למדה למצוא את הדרך לפי הכוכבים"
      }
    },
    "valley": {
      "he": "עמק הפרחים",
      "in_he": "בעמק הפרחים",
      "flavor": {
        "m": "שם גדל בין פרחים שמאירים בלילה",
        "f": "שם גדלה בין פרחים שמאירים בלילה"
      }
    },
    "caves": {
      "he": "מערות הבדולח",
      "in_he": "במערות הבדולח",
      "flavor": {
        "m": "שם למד לראות גם בחושך",
        "f": "שם למדה לראות גם בחושך"
      }
    }
  }
};
