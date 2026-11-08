# Birthday Quest

A hero generator for a D&D treasure-hunt birthday party. Kids build a hero on a parent's phone and keep the hero card as an image. It's a static site on GitHub Pages, with no server and no database. The scope, the gates and the reasoning are in **[PLAN.md](PLAN.md)**.

**Status (2026-11-08):** the hero is drawn from painted parts (a head on a body, with headwear and a companion), and the screens are built: the legend, your name, hero or heroine, species, class, outfit colour, headwear, companion, two strengths, the hero's name, the homeland and the backstory, and the finished hero as a card (a picture to save and share). Still to come: the reveal, and a print page.

> **This repo is public.** First names are fine; never commit surnames, the address, photos or phone numbers.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. Opening the file directly breaks the pictures in some browsers.

## Layout
- `index.html`, `style.css`, `app.js`: the screens and their flow. The hero is saved on the phone as it is built, so reopening the link carries on.
- `hero.js`: stacks the hero's pictures on a canvas: wings, body, head, hat, companion.
- `parts.js` and `parts/web/`: the pictures and where each one goes. **Written by `tools/parts/build_web.py`; don't edit by hand.**
- `story.js`: the backstory, written from the kid's choices in the hero's gender and set in the legend of the broken shield. A kid can ask for another version or rewrite it.
- `card.js`: the hero card, 1200 × 1800 (a 10 × 15 cm print), in the team's colours. The last screen shows it, with a button that opens the phone's share sheet (WhatsApp, Photos) or, where there is none, downloads it.
- `code.js`: the hero code (`XXX-XXXX`) printed on the card, which rebuilds the hero's picture.
- `catalog.js`: species, classes, strengths, colours, headwear, companions, homelands and name ideas, in Hebrew masculine and feminine forms. **The Hebrew is a draft**; rename freely, but don't change keys or reorder lists (the hero code stores positions).
- `kids.js`: the guests' first names and teams. Add new names at the end.
- `parts/raw/`: the painted parts as drawn. `tools/parts/`: the scripts that cut, colour and place them (see its README).
- `tests/`: `node tests/code.test.js` (every hero survives the code; typos are caught), `node tests/parts.test.js` (every picture exists), `node tests/story.test.js` (every story is in one gender and mentions the shield; `--show` prints a few).
- `fonts/`: the invitation's fonts (SIL OFL).

## Publish
GitHub Pages deploys `main` from the root folder. A push to `main` goes live within a minute or two.
