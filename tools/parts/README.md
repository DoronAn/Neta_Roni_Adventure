# Hero parts (dev tools)

The hero picture is a paper doll: a head (species × gender) on a body (class), plus hats and back parts.
The parts are drawn in Gemini by Doron and kept as they came in `parts/raw/`.

- `join.py`: `cutout()` removes the white background by flood-filling from the image edges.
- `heads.json`: each head's chin row in its 1024 px source image, the anchor for joining.
- `sheet_heads.py`: puts every head on the fighter body at one shared scale (0.434), the chin on the body's collar (row 124).

Run from a folder holding the raw parts (these scripts expect `head_<name>.jpg` and `body_fighter.jpg` beside them).
- `sheet_bodies.py`: one head on each of the 9 bodies. Every body's neck stub sits at the same place (x 459-565, top row ~75), so one anchor (chin at row 124) fits them all.
- `recolor.py`: outfit colour by hue swap. Each recolourable body lists its garment's hue range and minimum saturation (`GARMENT`); pixels inside it move to the target hue, keeping their texture. Druid, cleric and barbarian stay as drawn. `sheet_colors.py` shows every body in every colour.
- `recolor2.py`: the three classes without one clear garment hue. Druid: the olive robe (hue 41-58) swaps, the leaves stay. Cleric: the white robe and cape (light, nearly colourless) take a pastel dye. Barbarian: the dark undershirt (sleeves, trousers) takes a strong dye; the fur and armour stay.
- `sheet_fairy.py`: fairies get `back_wings` behind the body, at full source size, the wing joint (source 512, 520) on body row 300.
- `sheet_crest.py`: the team crest on each body, at a spot chosen per body (`SPOT`: centre and size in body pixels). The fighter carries it on the shield; the cleric and paladin on the lower tabard, below their sun; the rest on the chest.
- `accessories.py`: headwear and companions. A hat's width is taken from the head's own width at the row where the hat sits (`HATS`: base row as a fraction from skull top to chin, `fit` as a multiple of that width), so it fits each head. The wizard hat and cap hide the hair above their bottom edge; cat ears and horns stay out beside the hat. The flower crown's far half sits behind the head. `FIX` holds per-head corrections (cat folk and dragon folk get smaller crowns and wizard hats, to sit between ears and horns). Companions are 380 body px tall (dragon and fox 1.2×) at the hero's right foot.
- `review_hat.py <hat>`: one hat, large, on all 12 heads: the check before showing anything.
- `sheet_hats.py`: every hat on every head. `sheet_full.py`: complete heroes with colour, hat, wings and companion.
