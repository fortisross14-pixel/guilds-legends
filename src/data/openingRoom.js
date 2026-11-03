// The rented room above the old road, where "The Fallen Banner" prologue starts.
// A walkable map for WalkableScene (src/explore).

const FURNITURE = [
  { asset: 'prop.opening.table', x: 70, y: 72, w: 224, h: 40 },
  { asset: 'prop.opening.shelf', x: 666, y: 72, w: 218, h: 40 },
  { asset: 'prop.opening.bench', x: 70, y: 404, w: 255, h: 36 },
  { asset: 'prop.opening.chest', x: 768, y: 414, w: 110, h: 44 },
];

export const OPENING_ROOM_MAP = {
  id: 'opening-room',
  size: { width: 960, height: 540 },
  spawn: { x: 218, y: 290 },
  background: '#171116',
  ground: 'room.opening.floor',
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
      id: 'stranger',
      kind: 'npc',
      name: 'Wounded stranger',
      verb: 'Talk',
      x: 584,
      y: 306,
      asset: 'npc.opening.stranger',
      w: 44,
      h: 28,
      approach: { x: 536, y: 300 },
      labelAt: { x: 584, y: 316 },
      reach: 44,
      beacon: true,
    },
    {
      id: 'door',
      kind: 'door',
      name: 'Dunmere',
      verb: 'Enter',
      x: 922,
      y: 318,
      asset: 'prop.opening.door',
      w: 32,
      h: 92,
      approach: { x: 878, y: 296 },
      labelAt: { x: 922, y: 326 },
      reach: 44,
      beacon: true,
    },
  ],
};
