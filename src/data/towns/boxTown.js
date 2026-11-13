import { rows } from '../tiles.js';
import { LOCATIONS, LOCATION_BUILDINGS } from '../world.js';
import { ROADS } from '../roads.js';

// The world skeleton's towns: every place without a hand-built layout gets a walkable box
// (36 x 20): the main street across, the buildings it has along the top, the arena below,
// the notice board in the square, and a gate on each side a road leaves from. The real
// layout, art and people come with the chapter that uses the town (docs/design/STORY_DRAFT.md).

const W = 36;
const H = 20;
// Which built town lends its building art, by region (until the town gets its own).
const LOOK = {
  Crownlands: 'ironford',
  'Verdant Marches': 'greenhollow',
  'Ember Coast': 'windmere',
  'Storm Isles': 'windmere',
  'Sun Kingdoms': 'dunmere',
  'Frost Frontier': 'ironford',
  'The Far Veil': 'greenhollow',
};
const ART = {
  dunmere: { tavern: 'town.dunmere.tavern', shop: 'town.dunmere.shop', herald: 'town.dunmere.herald', arena: 'town.dunmere.arena' },
  ironford: { tavern: 'town.ironford.tavern', shop: 'town.ironford.shop', herald: 'town.ironford.herald', arena: 'town.ironford.arena' },
  greenhollow: { tavern: 'town.greenhollow.tavern', shop: 'town.greenhollow.shop', herald: 'town.dunmere.herald', arena: 'town.greenhollow.arena' },
  windmere: { tavern: 'town.windmere.inn', shop: 'town.windmere.shop', herald: 'town.dunmere.herald', arena: 'town.windmere.arena' },
};
const LABELS = { tavern: 'Tavern', shop: 'Shop', herald: 'Herald’s Office', arena: 'Arena' };

// Gates: where each side's exit is, and its tiles.
const GATES = {
  west: { at: [0, 7], size: [1, 2] },
  east: { at: [W - 1, 7], size: [1, 2] },
  north: { at: [17, 0], size: [2, 1] },
  south: { at: [17, H - 1], size: [2, 1] },
};

/** Which side a road leaves from: the direction of the far town, the next best if taken. */
function sides(location, roads) {
  const taken = new Set();
  return roads.map((road) => {
    const other = LOCATIONS.find((item) => item.id === road.ends.find((end) => end !== location.id));
    const dx = (other?.x ?? location.x) - location.x;
    const dy = (other?.y ?? location.y) - location.y;
    const order = Math.abs(dx) >= Math.abs(dy) ? [dx >= 0 ? 'east' : 'west', dy >= 0 ? 'south' : 'north', dy >= 0 ? 'north' : 'south', dx >= 0 ? 'west' : 'east'] : [dy >= 0 ? 'south' : 'north', dx >= 0 ? 'east' : 'west', dx >= 0 ? 'west' : 'east', dy >= 0 ? 'north' : 'south'];
    const side = order.find((item) => !taken.has(item)) || order[0];
    taken.add(side);
    return { road, side };
  });
}

function tilesFor(gates) {
  const grid = [];
  for (let y = 0; y < H; y += 1) {
    const line = [];
    for (let x = 0; x < W; x += 1) {
      const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      let char = border ? 'T' : '.';
      if (y === 7 || y === 8) char = border && !((x === 0 && gates.has('west')) || (x === W - 1 && gates.has('east'))) ? 'T' : '=';
      // The north–south street, out to a gate where there is one.
      if ((x === 17 || x === 18) && y > 8 && (y < H - 1 || gates.has('south'))) char = '=';
      if ((x === 17 || x === 18) && y < 7 && (y > 0 || gates.has('north'))) char = '=';
      // The square in front of the notice board.
      if (x >= 22 && x <= 28 && y >= 10 && y <= 13) char = '#';
      line.push(char);
    }
    grid.push(line.join(''));
  }
  return grid;
}

/** A walkable box for a place: its buildings, its square and a gate per road. */
export function boxTown(location) {
  const buildings = LOCATION_BUILDINGS[location.id] || ['tavern', 'noticeBoard'];
  const roads = ROADS.filter((road) => road.area && road.ends.includes(location.id));
  const gates = sides(location, roads);
  const art = ART[LOOK[location.region] || 'dunmere'];
  // Along the top street: tavern, shop, herald (doors on row 7; each building fills the 5 x 4 above).
  const top = ['tavern', 'shop', 'herald'].filter((id) => buildings.includes(id));
  const doors = [6, 13, 26];
  return {
    id: location.id,
    kind: 'town',
    name: location.name,
    tagline: `${location.region} · ${location.tier}`,
    landmark: location.landmark || null,
    summary: location.description || '',
    districts: [],
    skeleton: true,
    width: W,
    height: H,
    spawn: [18, 9],
    arrive: [18, 9],
    tiles: rows(W, ...tilesFor(new Set(gates.map((gate) => gate.side)))),
    buildings: [
      ...top.map((id, index) => ({ building: id, label: LABELS[id], door: [doors[index], 7], asset: art[id] })),
      ...(buildings.includes('arena') ? [{ building: 'arena', label: LABELS.arena, door: [9, 17], asset: art.arena }] : []),
    ],
    props: [
      ...(buildings.includes('noticeBoard') ? [{ id: 'noticeBoard', asset: 'prop.noticeboard', at: [24, 10], size: [2, 2], poi: { name: 'Notice Board', verb: 'Inspect', building: 'noticeBoard' } }] : []),
      { id: 'lamp-1', asset: 'prop.lamp', at: [15, 10], size: [1, 1] },
      { id: 'lamp-2', asset: 'prop.lamp', at: [20, 15], size: [1, 1] },
    ],
    npcs: [],
    exits: gates.map(({ road, side }) => ({ id: `exit-${road.area}`, area: road.area, name: road.name, ...GATES[side] })),
  };
}
