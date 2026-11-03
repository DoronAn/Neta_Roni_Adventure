# Birthday Quest

A hero generator for a D&D treasure-hunt birthday party. Kids build a hero on a parent's phone and keep the hero card as an image. It's a static site on GitHub Pages, with no server and no database. The scope, the gates and the reasoning are in **[PLAN.md](PLAN.md)**.

**Status:** the plan and the hero catalog are ready. The generator page (`index.html`) comes next, due 2026-11-04.

> **This repo is going public.** Never commit the address, kids' real names, photos or phone numbers. Before switching it to public, follow "Going public" in PLAN.md: the old history still holds private files.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. Opening the file directly breaks the fonts and the image export in some browsers.

## Layout
- `index.html` (not yet created): the generator.
- `catalog.js`: everything a hero is built from: species, classes, strengths and colors, each with Hebrew masculine and feminine forms. **The Hebrew names are a draft**; rename freely, but don't change keys.
- `fonts/`: the invitation's fonts (SIL OFL), so the site matches it.

## Publish
GitHub Pages deploys `main` from the root folder. A push to `main` goes live within a minute or two.
