// Building interiors (playtest-1-feedback): each is a painted scene, not a walkable
// map. The painting (public/art/interiors/) fills the screen; people stand at fixed
// spots on it, hotspots on it do something (shelves, boards), and the door leads out.
// Positions are percentages of the painting: spots are [x, y] of a person's feet,
// hotspots and the door [x, y, w, h] boxes. `spots` lists the spot ids the people
// model fills (src/game/engine/people.js): a regular names their spot, visitors take
// the free ones in order. Each building has a default layout for its default painting,
// and towns with their own painting override it (`towns`).

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
      greenhollow: {
        art: 'interior.inn.greenhollow',
        spots: { bar: [50, 31], t1a: [20, 58], t1b: [32, 61], t2a: [67, 58], t2b: [80, 61], t3a: [9, 80], t3b: [21, 82], corner: [89, 80] },
      },
      ironford: {
        art: 'interior.inn.ironford',
        spots: { bar: [50, 25], t1a: [22, 42], t1b: [36, 45], t2a: [65, 42], t2b: [78, 45], t3a: [22, 72], t3b: [36, 75], corner: [78, 72] },
      },
      windmere: {
        art: 'interior.inn.windmere',
        spots: { bar: [50, 27], t1a: [12, 46], t1b: [24, 49], t2a: [72, 43], t2b: [84, 46], t3a: [10, 76], t3b: [22, 79], corner: [80, 72] },
      },
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
    spots: [{ id: 'desk', keeper: true }, { id: 'ground' }, { id: 'spar-1' }, { id: 'spar-2' }, { id: 'bench' }],
    layout: {
      spots: { desk: [18, 39], ground: [50, 60], 'spar-1': [40, 76], 'spar-2': [60, 76], bench: [12, 64] },
      hotspots: { board: { box: [78, 4, 20, 36], name: 'History board', verb: 'Read', board: 'history' } },
      door: DOOR,
    },
    towns: {
      dunmere: { art: 'interior.arena.dunmere' },
      greenhollow: {
        art: 'interior.arena.greenhollow',
        spots: { desk: [86, 26], ground: [50, 58], 'spar-1': [40, 72], 'spar-2': [60, 72], bench: [10, 60] },
        hotspots: { board: [43, 2, 14, 24] },
      },
      ironford: {
        art: 'interior.arena.ironford',
        spots: { desk: [50, 18], ground: [50, 56], 'spar-1': [40, 72], 'spar-2': [60, 72], bench: [9, 52] },
        hotspots: { board: [70, 2, 16, 22] },
      },
      windmere: {
        art: 'interior.arena.windmere',
        spots: { desk: [20, 32], ground: [50, 58], 'spar-1': [40, 74], 'spar-2': [60, 74], bench: [88, 62] },
        hotspots: { board: [44, 4, 12, 20] },
      },
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
    spots: { ...room.layout.spots, ...(town.spots || {}) },
    hotspots,
    door: room.layout.door,
  };
}
