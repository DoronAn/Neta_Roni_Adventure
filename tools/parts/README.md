# Hero parts (dev tools)

The hero picture is a paper doll: a head (species × gender) on a body (class), plus hats and back parts.
The parts are drawn in Gemini by Doron and kept as they came in `parts/raw/`.

- `join.py`: `cutout()` removes the white background by flood-filling from the image edges.
- `heads.json`: each head's chin row in its 1024 px source image, the anchor for joining.
- `sheet_heads.py`: puts every head on the fighter body at one shared scale (0.434), the chin on the body's collar (row 124).

Run from a folder holding the raw parts (these scripts expect `head_<name>.jpg` and `body_fighter.jpg` beside them).
