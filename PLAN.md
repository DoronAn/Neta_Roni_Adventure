# Birthday Quest — plan

A hero generator for a Dungeons & Dragons–themed treasure-hunt birthday party. A kid opens the link on a parent's phone, builds a hero, and keeps the hero card as an image. It is a static site on GitHub Pages: no server, no database, no accounts.

> **This repo is going public**, because GitHub Pages on a free account only publishes public repos. **Never commit the address, kids' real names, photos or phone numbers.** Those stay in Doron's private notes.
> **Don't switch it to public as it is:** its history still holds the old private files. See "Going public" below.

## The decision (2026-10-03)
The first design was a portal: FastAPI + SQLite with RSVP, a tavern board and an admin view, hosted on Railway for about $5/month. Its backend was finished and tested on 2026-10-02. The next day it was replaced by this static generator, because:
- **The point is the kids' experience, not data management.** Everything that makes the creator magical (animation, sound, dice, the reveal) runs in the browser and needs no server.
- **A hero only has to reach two places:** the kid's phone and Doron's WhatsApp. The database was the heaviest part of the portal and served its least important features.
- **It's free, and there's nothing to keep running** for seven weeks.

The finished backend and the invitation are archived in Doron's private repo. Nothing is lost.

## Done means
**The party happened, and every kid who came brought a hero they made.** Done does not mean every feature shipped. Each item below is judged against that line.

## Scope

### v1: the hero generator (ships at M1)
1. **Hero creation:** hero name, hero gender (גיבור / גיבורה), species, class, two strengths, and look (avatar and color). Optional depth for older kids: catchphrase, companion, backstory. Ages are mixed, so the default path is short and the depth is opt-in.
2. **The reveal:** the moment the hero is finished is where the magic budget goes (animation, sound, a dice roll for the strengths). One great moment beats effects everywhere.
3. **The hero card as an image:** drawn on a canvas and sized to print. A share button sends it to WhatsApp or saves it to the phone's photos, with a download link as the fallback.
4. **The hero stays on the phone:** saved in the browser, so reopening the link shows it again. That's a convenience only, since browsers can clear it. The image is the real copy.
5. **The story around it:** the hook on the first screen ("דרקון ערמומי גנב את עוגת יום ההולדת והחביא אותה עמוק במערה. רק חבורה של גיבורים אמיצים תוכל להחזיר אותה!") and the costume note after the reveal ("בואו מחופשים לגיבור שיצרתם!"). No address or time: the invitation already carries them, and this site is public.

### Collecting heroes (Doron's side, manual on purpose)
- Parents send the card to Doron on WhatsApp. That chat is the record and the print queue.
- RSVPs and allergies come over WhatsApp, as for any party.
- **Printed hero cards** (v1.5 in the old plan) are now the same image, printed, so there's nothing separate to build. They still work as a prop during the hunt and a party favour after it.

### Optional: the tavern board
Doron adds each hero to a file as its card arrives, and the site shows them all. **Hero names and art only, no kids' names, because the site is public.** Build it only if v1 lands within budget.

### v2: game mechanics (only past the decision gate)
Candidates, ranked by value against risk. These are static pages only, so nothing can share live state between phones:
1. **Team clue pages.** A QR code at each station opens that station's next clue. (The old plan also logged each team's progress. That needed the server, so it's gone.)
2. **Strength-based dice.** When a challenge matches a hero's strength, the hero rolls with advantage (two dice, keep the higher). Stations map to strengths: riddle or code → תבונה, hidden object → חוכמה, obstacle course → זריזות, carrying or pulling → כוח, convincing an NPC → כריזמה.
3. **Inventory** of keys and gems, kept on the team's phone.

The quest map on a TV dropped out with the server, because it needed shared live state.

**Hard constraints for anything in v2:**
- **One device per team** (an adult's phone), not one per kid. Many 6–8 year olds won't have phones.
- **Paper fallback for every mechanic.** The hunt must still work if the wifi dies or a phone runs out of battery.

## Decision gates
- **Mechanics go/no-go at T-14** (link out, v1 live). Go only if v1 is stable, and pick **at most two** mechanics. **The default is no:** the physical hunt plus printed hero cards is already a complete party.
- **Feature freeze at T-3.** After that, only fixes and testing on real phones.

## Milestones (T = party day, 2026-11-21)
| Milestone | By | What |
|---|---|---|
| M0 | 2026-10-02 | Plan and portal backend ✅ (superseded 2026-10-03, archived) |
| M0.5 | 2026-10-03 | Invitation sent ✅ · switched to the static generator ✅ |
| M1 | 2026-11-04 (T-17) | Generator v1 live on Pages, tested on an iPhone and an Android phone |
| M2 | 2026-11-07 (T-14) | Link out to the parents on WhatsApp · **mechanics gate** |
| M3 | 2026-11-14 (T-7) | Chase: a direct message to every family whose hero hasn't arrived |
| M4 | 2026-11-16 (T-5) | Hero cards printed (a blank one for any kid without a hero) · teams assigned |
| M5 | 2026-11-18 (T-3) | Feature freeze |

Seven weeks is more room than the build needs. **The extra time is slack, not scope:** the two-evening budgets below stay the same.

## Time budget
- **Generator v1: two evenings.** **Mechanics, if approved: two evenings.**
- When something runs over budget, cut scope rather than add time.
- Evenings only.

## Architecture
- **Plain HTML, CSS and JavaScript.** No framework, no build step, no dependencies: `index.html`, `catalog.js` and the fonts.
- **Hosting:** GitHub Pages, deploying `main` from the root folder. It's free, includes HTTPS, and lives at `https://doronan.github.io/<repo-name>/`.
- **Saving:** the hero lives in the browser's `localStorage`. The image is the real copy.
- **Sharing:** the Web Share API with a file (`navigator.share({ files })`) opens the phone's share sheet, which offers WhatsApp and saving to photos. Current iPhone Safari and Android Chrome support it. Where it's missing, fall back to a download link.
- **Hebrew on the canvas:** set `ctx.direction = "rtl"`, and wait for the fonts (`document.fonts.load`) before drawing the card, or the first card comes out in a fallback font.
- **Fonts:** the invitation's (Secular One, Karantina, Heebo; SIL OFL, in `fonts/`), so the site matches the invitation. They're self-hosted, so nothing depends on another server.
- **Test locally through a small server** (`python3 -m http.server`), not by opening the file: some browsers block fonts and canvas export on `file://` pages.

## Hebrew notes
- **Class and species names have masculine and feminine forms** (לוחם / לוחמת). The kid picks the hero's gender, and the page shows the matching form.
- The names in `catalog.js` are a **first draft**. **The birthday kids get the final say on names.** It's their world, and naming things is half the fun.

## Going public (once, before M1)
The history of this repo still holds the old private files: the invitation art and the address. Rewriting the history isn't enough, because once a repo is public, GitHub's activity view links to the commits a force-push replaced. So:
1. Confirm the archive in Doron's private repo is complete (moved and checked file by file on 2026-10-03).
2. Delete this repo on GitHub (Settings → Danger Zone) and create it again, empty and public. **Choose the name at that point:** it becomes part of the address, and the current name carries two first names.
3. Push the current files as a single fresh commit.
4. Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

## Open questions
- Indoors or outdoors, and how many stations (shapes v2)
- Rough guest count (affects team count)
- Tavern board: yes or no (decide at M1, only if v1 came in within budget)
