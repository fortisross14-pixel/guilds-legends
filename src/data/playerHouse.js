// The player's house in Dunmere, where the prologue ("The knock at the door",
// docs/STORY.md) plays. A walkable map for WalkableScene (src/explore). The
// house keeps one bed for the founder after the guild rents its hall.

const FURNITURE = [
  { asset: 'prop.house.hearth', x: 70, y: 66, w: 190, h: 52 },
  { asset: 'prop.house.table', x: 380, y: 230, w: 160, h: 64 },
  { asset: 'prop.house.bed', x: 690, y: 72, w: 190, h: 70 },
  { asset: 'prop.house.chest', x: 70, y: 410, w: 120, h: 44 },
];

export const PLAYER_HOUSE_MAP = {
  id: 'player-house',
  size: { width: 960, height: 540 },
  spawn: { x: 300, y: 170 },
  background: '#171116',
  ground: 'room.house.floor',
  player: { asset: 'char.founder', w: 26, h: 36 },
  zoom: 1.1,
  blocks: [
    { x: 0, y: 0, w: 960, h: 54 },
    { x: 0, y: 486, w: 960, h: 54 },
    { x: 0, y: 0, w: 54, h: 540 },
    { x: 906, y: 0, w: 54, h: 540 },
    ...FURNITURE.map(({ x, y, w, h }) => ({ x, y, w, h })),
  ],
  props: FURNITURE,
  targets: [
    {
      id: 'door',
      kind: 'door',
      name: 'The front door',
      verb: 'Open',
      x: 922,
      y: 318,
      asset: 'prop.house.door',
      w: 32,
      h: 92,
      approach: { x: 878, y: 300 },
      labelAt: { x: 922, y: 326 },
      reach: 44,
      beacon: true,
    },
    {
      id: 'rook',
      kind: 'npc',
      name: 'The stranger',
      verb: 'Kneel',
      x: 810,
      y: 330,
      asset: 'npc.house.rook',
      w: 44,
      h: 28,
      approach: { x: 760, y: 320 },
      labelAt: { x: 810, y: 340 },
      reach: 48,
      beacon: true,
      hideWhenInactive: true,
    },
  ],
};
