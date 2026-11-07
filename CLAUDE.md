# CLAUDE.md

A hero generator for a children's birthday treasure hunt: a static site (plain HTML, CSS and JavaScript, no build step), served by GitHub Pages from `main`.

## Rules for this repo
- **It is public.** Kids' first names are allowed (in `kids.js`); never commit surnames, the address, photos or phone numbers.
- **Nothing about how the party ends.** Keep the hunt's surprises out of the code, comments and docs.
- The hero's pictures are made by `tools/parts/build_web.py`; never edit `parts.js` or `parts/web/` by hand.
- Don't reorder or rename keys in `catalog.js` and `kids.js`: the hero code stores positions.

## How we build (Doron, 2026-10-11)
Everything except chat-ops (todos, logging, status questions, answering questions) goes through
three phases, each ending in my explicit approval:
1. Spec: what it does and doesn't do. Ask me questions a few at a time, each with a recommended
   answer, and write my answers into a spec file (why / what it does / what it doesn't / done when).
   No technical detail.
2. Tech plan: how. Same loop, same file, complete enough that the build never has to guess.
3. Build the approved plan through and report at the end; stop and come back only if the plan
   turns out wrong.
Bug fixes and drafts get short phases, not skipped ones. Full process: WORKFLOW.md in DoronAn/Doron-OS.
