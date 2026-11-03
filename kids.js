// The guests, by first name only, and their team. This repo is public:
// first names are fine (Doron, 2026-11-03); never add surnames, photos,
// phone numbers or the address.
//
// Order matters: the hero code stores a kid as their position in this list,
// so add a new kid at the END, never in the middle.
const TEAMS = {
  neta: { he: "החבורה של נטע", leader: "נטע" },
  roni: { he: "החבורה של רוני", leader: "רוני" },
};

const KIDS = [
  { name: "נטע", team: "neta", leader: true },
  { name: "רוני", team: "roni", leader: true },
  // Placeholders until the real names arrive.
  { name: "גיבור 1", team: "neta" },
  { name: "גיבור 2", team: "neta" },
  { name: "גיבור 3", team: "neta" },
  { name: "גיבור 4", team: "neta" },
  { name: "גיבור 5", team: "roni" },
  { name: "גיבור 6", team: "roni" },
  { name: "גיבור 7", team: "roni" },
  { name: "גיבור 8", team: "roni" },
];
