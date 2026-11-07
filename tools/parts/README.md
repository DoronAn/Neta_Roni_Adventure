# Hero parts (dev tools)

The hero picture is a paper doll: a head (species × gender) on a body (class), plus hats and back parts.
The parts are drawn in Gemini by Doron and kept as they came in `parts/raw/`.

- `join.py`: `cutout()` removes the white background by flood-filling from the image edges.
- `heads.json`: each head's chin row in its 1024 px source image, the anchor for joining.
- `sheet_heads.py`: puts every head on the fighter body at one shared scale (0.434), the chin on the body's collar (row 124).

**To run:** copy `parts/raw/*` and `tools/parts/*` into one working folder, make a `shots/` folder beside it (the sheets are written to `../shots/`), and run from the working folder, e.g. `python3 review_hat.py cap`. Needs Pillow, NumPy and SciPy. Scripts were developed in a scratch folder on 2026-11-07 and copied here; they are dev tools, not part of the site.
- `sheet_bodies.py`: one head on each of the 9 bodies. Every body's neck stub sits at the same place (x 459-565, top row ~75), so one anchor (chin at row 124) fits them all.
- `recolor.py`: outfit colour by hue swap. Each recolourable body lists its garment's hue range and minimum saturation (`GARMENT`); pixels inside it move to the target hue, keeping their texture. Druid, cleric and barbarian stay as drawn. `sheet_colors.py` shows every body in every colour.
- `recolor2.py`: the three classes without one clear garment hue. Druid: the olive robe (hue 41-58) swaps, the leaves stay. Cleric: the white robe and cape (light, nearly colourless) take a pastel dye. Barbarian: the dark undershirt (sleeves, trousers) takes a strong dye; the fur and armour stay.
- `sheet_fairy.py`: fairies get `back_wings` behind the body, at full source size, the wing joint (source 512, 520) on body row 300.
- `sheet_crest.py`: the team crest on each body, at a spot chosen per body (`SPOT`: centre and size in body pixels). The fighter carries it on the shield; the cleric and paladin on the lower tabard, below their sun; the rest on the chest.
- `accessories.py`: headwear and companions. A hat's width is taken from the head's own width at the row where the hat sits (`HATS`: base row as a fraction from skull top to chin, `fit` as a multiple of that width), so it fits each head. The wizard hat and cap hide the hair above their bottom edge; cat ears and horns stay out beside the hat. The flower crown's far half sits behind the head. `FIX` holds per-head corrections (cat folk and dragon folk get smaller crowns and wizard hats, to sit between ears and horns). Companions are 380 body px tall (dragon and fox 1.2×) at the hero's right foot.
- `review_hat.py <hat> [tile px]`: one hat, large (450 px tiles by default), on all 12 heads: the check before showing anything.
- **The feathered cap is placed by its band** (`cap_on` in `accessories.py`, 2026-11-07, second session): the two ends of the beret's bottom lip (`CAP_BAND`, in the trimmed picture) go on the head's outline, the left end lower (`rL` = 0.27 of the way from skull top to chin) than the right (`rR` = 0.08), each 2% of the head's width outside it. Scale and tilt follow from those two points, so the band wraps every head and the beret is worn tilted, its puff over the left side; the head above the band is hidden. Cat folk and dragon folk wear it level between the ears or horns (`centre` in `FIX`). The cap's light outline rim is shaved off (`defringe`), since it showed as a white line over hair. `PAD` is 760 (was 600) so the feather fits.
- `review_cats.py`, `review_tilt.py`: records of earlier rounds; the tilt variants no longer apply to the cap.
- `sheet_hats.py`: every hat on every head. `sheet_full.py`: complete heroes with colour, hat, wings and companion.
