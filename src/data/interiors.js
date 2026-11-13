// Building interiors (playtest-1-feedback): each is a painted scene, not a walkable
// map. The painting (public/art/interiors/) fills the screen; people stand at fixed
// spots on it, hotspots on it do something (shelves, boards), and the door leads out.
// Positions are percentages of the painting: spots are [x, y] of a person's feet,
// hotspots and the door [x, y, w, h] boxes. `spots` lists the spot ids the people
// model fills (src/game/engine/people.js): a regular names their spot, visitors take
// the free ones in order. The paintings are composed from the hand-painted interior
// tiles to this layout (scripts/art/interiors.py), so every town's painting of a
// building shares it; `towns` only picks that town's painting.

import ROOMS from './myart/rooms.json';

/** The door: a box at the bottom middle of every painting. */
const DOOR = [42, 86, 16, 14];

export const INTERIORS = {
  tavern: {
    id: 'tavern',
    art: 'interior.tavern',
    // The keeper behind the bar; guests at the tables (staggered, so names never share a row).
    spots: [
      { id: 'bar', keeper: true },
      { id: 't1a' },
      { id: 't2b' },
      { id: 't1b' },
      { id: 't2a' },
      { id: 't3a' },
      { id: 't3b' },
      { id: 'corner' },
    ],
    layout: {
      spots: { bar: [52, 31], t1a: [23, 58], t1b: [35, 60], t2a: [69, 56], t2b: [81, 58], t3a: [9, 76], t3b: [20, 79], corner: [91, 76] },
      hotspots: {},
      door: DOOR,
    },
    towns: {
      greenhollow: { art: 'interior.inn.greenhollow' },
      ironford: { art: 'interior.inn.ironford' },
      windmere: { art: 'interior.inn.windmere' },
    },
  },
  shop: {
    id: 'shop',
    art: 'interior.shop',
    spots: [{ id: 'counter', keeper: true }, { id: 'browse-1' }, { id: 'browse-2' }],
    layout: {
      spots: { counter: [86, 40], 'browse-1': [32, 62], 'browse-2': [62, 64] },
      // The shelves along the back wall, each one a part of the stock.
      hotspots: {
        'shelf-weapons': { box: [19, 4, 18, 26], name: 'Weapon rack', verb: 'Browse', shelf: 'weapon' },
        'shelf-potions': { box: [38, 4, 18, 26], name: 'Potions shelf', verb: 'Browse', shelf: 'consumable' },
        'shelf-armor': { box: [57, 4, 16, 26], name: 'Armor stand', verb: 'Browse', shelf: 'armor' },
        'shelf-charms': { box: [74, 4, 19, 26], name: 'Charm case', verb: 'Browse', shelf: 'accessory' },
      },
      door: DOOR,
    },
  },
  arena: {
    id: 'arena',
    art: 'interior.arena',
    spots: [{ id: 'desk', keeper: true }, { id: 'ground' }, { id: 'spar-1' }, { id: 'spar-2' }, { id: 'bench' }, { id: 'spar-3' }, { id: 'spar-4' }],
    layout: {
      spots: { desk: [18, 39], ground: [50, 60], 'spar-1': [40, 76], 'spar-2': [60, 76], bench: [12, 64], 'spar-3': [76, 82], 'spar-4': [24, 88] },
      hotspots: { board: { box: [78, 4, 20, 36], name: 'History board', verb: 'Read', board: 'history' } },
      door: DOOR,
    },
    towns: {
      dunmere: { art: 'interior.arena.dunmere' },
      greenhollow: { art: 'interior.arena.greenhollow' },
      ironford: { art: 'interior.arena.ironford' },
      windmere: { art: 'interior.arena.windmere' },
    },
  },
  herald: {
    id: 'herald',
    art: 'interior.herald',
    spots: [{ id: 'desk', keeper: true }, { id: 'bench' }, { id: 'door-side' }],
    layout: {
      spots: { desk: [50, 46], bench: [33, 75], 'door-side': [80, 78] },
      hotspots: {
        ranks: { box: [37, 4, 26, 34], name: 'Ranking board', verb: 'Read', board: 'rankings' },
        shelf: { box: [71, 6, 21, 36], name: 'Records shelf', verb: 'Read', board: 'records' },
      },
      door: DOOR,
    },
  },
};

// The founder's house in Dunmere (its painting is the prologue's, scripts/art/interiors.py `house`).
INTERIORS.house = {
  id: 'house',
  art: 'interior.house',
  spots: [],
  layout: { spots: {}, hotspots: {}, door: [37, 86, 26, 14] },
};

// Dawnwatch Temple and the priests' house, at the west end of the Old Road (src/data/wilds/chapter1Roads.js).
INTERIORS.temple = {
  id: 'temple',
  art: 'interior.temple',
  spots: [{ id: 'altar', keeper: true }, { id: 'pew-1' }, { id: 'pew-2' }, { id: 'pew-3' }],
  layout: { spots: { altar: [50, 39], 'pew-1': [27, 71], 'pew-2': [73, 71], 'pew-3': [33, 87] }, hotspots: {}, door: DOOR },
};
INTERIORS.priory = {
  id: 'priory',
  art: 'interior.priory',
  spots: [{ id: 'table', keeper: true }, { id: 'hearth' }, { id: 'cot' }],
  layout: { spots: { table: [43, 67], hearth: [26, 51], cot: [86, 84] }, hotspots: {}, door: DOOR },
};

/**
 * One building's painted scene in a town: the painting, where each spot stands,
 * the hotspots (with what they do) and the door. Town overrides replace positions only.
 */
export function interiorLayout(building, locationId) {
  const room = INTERIORS[building];
  if (!room) return null;
  const town = room.towns?.[locationId] || {};
  const hotspots = Object.entries(room.layout.hotspots).map(([id, spot]) => ({ id, ...spot, box: town.hotspots?.[id] || spot.box }));
  return {
    id: room.id,
    art: town.art || room.art,
    // A room painted by scripts/art/interiors.py knows where its people stand (seats, counters).
    spots: { ...room.layout.spots, ...(town.spots || {}), ...(ROOMS[town.art || room.art]?.spots || {}) },
    hotspots,
    door: room.layout.door,
  };
}
