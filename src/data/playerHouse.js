// The player's house in Dunmere, where the prologue ("The knock at the door",
// docs/STORY.md) plays: a painted scene like the other interiors
// (playtest-1-feedback). Positions are percentages of the painting
// (`interior.house`; a mood gradient until it is painted). The house keeps one
// bed for the founder after the guild rents its hall.
export const PLAYER_HOUSE = {
  art: 'interior.house',
  /** The founder's feet, by the table. */
  founder: [46, 66],
  /** Cassian Rook, wounded on the floor once the door is open. */
  rook: [74, 72],
  /** The front door, on the right wall: [x, y, w, h]. */
  door: [84, 30, 13, 46],
};
