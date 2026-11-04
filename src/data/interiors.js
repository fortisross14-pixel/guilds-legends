// Building interiors (Phase 7C): small walkable rooms that fit one screen.
// Coordinates are tiles (32 px) in an 11 × 11 room. Row 0 is the back wall;
// the exit is the doorway in the bottom row. `spots` are where people stand
// or sit (the people model in src/game/engine/people.js fills them); a spot
// with `behind: true` stands behind a counter or desk, so it is approached
// from two tiles below. Furniture blocks movement; `poi` furniture is tapped.
// The Guild Hall interior is not here: Phase 7D rebuilds it.

export const ROOM = { w: 11, h: 11 };

const wall = { id: 'back-wall', asset: 'furniture.wall', at: [0, 0], size: [11, 1] };

export const INTERIORS = {
  tavern: {
    id: 'tavern',
    floor: 'room.tavern',
    furniture: [
      wall,
      { id: 'bar', asset: 'furniture.bar', at: [2, 2], size: [7, 1] },
      { id: 'table-1', asset: 'furniture.table', at: [2, 5], size: [2, 1] },
      { id: 'table-2', asset: 'furniture.table', at: [7, 5], size: [2, 1] },
      { id: 'table-3', asset: 'furniture.table', at: [2, 8], size: [2, 1] },
      { id: 'hearth', asset: 'furniture.hearth', at: [8, 8], size: [2, 1] },
    ],
    // The keeper stands behind the bar; guests sit at the tables.
    spots: [
      { id: 'bar', at: [5, 1], behind: true, keeper: true },
      // Staggered, so the names over their heads never share a row.
      { id: 't1a', at: [1, 5] },
      { id: 't2b', at: [9, 4] },
      { id: 't1b', at: [4, 6] },
      { id: 't2a', at: [6, 7] },
      { id: 't3a', at: [1, 8] },
      { id: 't3b', at: [4, 9] },
      { id: 'corner', at: [8, 3] },
    ],
  },
  shop: {
    id: 'shop',
    floor: 'room.shop',
    furniture: [
      wall,
      { id: 'counter', asset: 'furniture.counter', at: [3, 2], size: [5, 1] },
      { id: 'shelf-potions', asset: 'furniture.shelf', at: [0, 4], size: [1, 3], poi: { name: 'Potions shelf', verb: 'Browse', shelf: 'consumable' } },
      { id: 'shelf-weapons', asset: 'furniture.rack', at: [10, 4], size: [1, 3], poi: { name: 'Weapon rack', verb: 'Browse', shelf: 'weapon' } },
      { id: 'shelf-armor', asset: 'furniture.stand', at: [2, 8], size: [2, 1], poi: { name: 'Armor stand', verb: 'Browse', shelf: 'armor' } },
      { id: 'shelf-charms', asset: 'furniture.case', at: [7, 8], size: [2, 1], poi: { name: 'Charm case', verb: 'Browse', shelf: 'accessory' } },
    ],
    spots: [
      { id: 'counter', at: [5, 1], behind: true, keeper: true },
      { id: 'browse-1', at: [3, 5] },
      { id: 'browse-2', at: [7, 5] },
    ],
  },
  arena: {
    id: 'arena',
    floor: 'room.arena',
    furniture: [
      wall,
      { id: 'desk', asset: 'furniture.desk', at: [1, 2], size: [3, 1] },
      { id: 'board', asset: 'furniture.historyboard', at: [7, 0], size: [3, 1], poi: { name: 'History board', verb: 'Read', board: 'history' }, wall: true },
      { id: 'ring', asset: 'furniture.ring', at: [5, 5], size: [4, 3], walkable: true },
      { id: 'bench', asset: 'furniture.bench', at: [1, 8], size: [3, 1] },
    ],
    spots: [
      { id: 'desk', at: [2, 1], behind: true, keeper: true },
      { id: 'ground', at: [7, 4] },
      { id: 'spar-1', at: [5, 8] },
      { id: 'spar-2', at: [8, 8] },
      { id: 'bench', at: [2, 7] },
    ],
  },
  herald: {
    id: 'herald',
    floor: 'room.herald',
    furniture: [
      wall,
      { id: 'desk', asset: 'furniture.desk', at: [4, 2], size: [3, 1] },
      { id: 'ranks', asset: 'furniture.rankboard', at: [0, 3], size: [1, 3], poi: { name: 'Ranking board', verb: 'Read', board: 'rankings' } },
      { id: 'shelf', asset: 'furniture.bookshelf', at: [10, 3], size: [1, 3], poi: { name: 'Records shelf', verb: 'Read', board: 'records' } },
      { id: 'bench', asset: 'furniture.bench', at: [3, 7], size: [3, 1] },
    ],
    spots: [
      { id: 'desk', at: [5, 1], behind: true, keeper: true },
      { id: 'bench', at: [4, 8] },
      { id: 'door-side', at: [8, 7] },
    ],
  },
};

/** The doorway: the bottom-middle tile. */
export const EXIT = { at: [5, 10] };
