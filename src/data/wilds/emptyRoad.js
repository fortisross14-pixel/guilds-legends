import { rows } from '../tiles.js';

// A road that is only a box for now (decided later): grass, a tree border and
// the road straight across from one end (`west`, a town) to the other (`east`).
// Walk it end to end to arrive in the other town. No decoration yet; bands jump anyone
// who leaves the road (`ambushes`, by `levels` [low, high] and the region's `types`).
const power = (level) => Math.min(98, Math.round(38 + 2.25 * level));
function roadBands(name, types, [low, high]) {
  const mid = Math.round((low + high) / 2);
  return [
    { id: 'pair', name: `${name} pair`, types: types.slice(0, 1), count: 2, level: low, power: power(low), reward: { gold: [low * 7, low * 11] } },
    { id: 'band', name: `${name} band`, types: types.slice(0, 3), count: 3, level: mid, power: power(mid), reward: { gold: [mid * 8, mid * 12] } },
    { id: 'crew', name: `${name} crew`, types: types.slice(1, 4), count: 3, level: high, power: power(high), reward: { gold: [high * 8, high * 13], items: { potion: 1 } } },
  ];
}

export function emptyRoad({ id, name, region, primal = 'Plant', west, east, map, description, bands = null }) {
  const width = 40;
  const height = 14;
  const line = (char, ends = 'T') => ends + char.repeat(width - 2) + ends;
  const tiles = [];
  for (let row = 0; row < height; row += 1) {
    if (row === 0 || row === height - 1) tiles.push('T'.repeat(width));
    else if (row === 6 || row === 7) tiles.push(':'.repeat(width));
    else tiles.push(line('.'));
  }
  return {
    id,
    kind: 'wild',
    name,
    tagline: `The road between ${west.name} and ${east.name}`,
    hub: west.town,
    region,
    primal,
    battle: 'bg.battle.oldroad',
    map,
    description: description || `The road between ${west.name} and ${east.name}. Nothing to see here yet.`,
    placeholder: true,
    width,
    height,
    arrive: [2, 6],
    tiles: rows(width, ...tiles),
    exit: { at: [0, 6], size: [1, 2], name: `To ${west.name}` },
    links: [
      { town: west.town, at: [0, 6], size: [1, 2], name: `To ${west.name}`, arrive: [2, 6] },
      { town: east.town, at: [width - 1, 6], size: [1, 2], name: `To ${east.name}`, arrive: [width - 3, 6] },
    ],
    camp: { at: [19, 3], size: [2, 2], name: 'A spot to rest' },
    props: [],
    enemies: [],
    ambushes: bands ? roadBands(bands.name, bands.types, bands.levels) : [],
    gathers: [],
  };
}

// Danger by road (the open world: anyone can walk anywhere; a band far above the guild sends it home).
export const coastRoad = emptyRoad({ id: 'coast-road', name: 'The coast road', region: 'Crownlands', primal: 'Water', west: { town: 'dunmere', name: 'Dunmere' }, east: { town: 'windmere', name: 'Windmere' }, map: { x: 21, y: 60 }, bands: { name: 'Wrecker', types: ['harbor-brute', 'reef-raider', 'tide-caller', 'brine-cleric'], levels: [14, 18] } });
export const ironRoad = emptyRoad({ id: 'iron-road', name: 'The Iron Road', region: 'Crownlands', primal: 'Iron', west: { town: 'greenhollow', name: 'Greenhollow' }, east: { town: 'ironford', name: 'Ironford' }, map: { x: 36, y: 42 }, bands: { name: 'Toll gang', types: ['shield-thug', 'road-bandit', 'field-priest', 'hedge-witch'], levels: [12, 16] } });
export const cliffRoad = emptyRoad({ id: 'cliff-road', name: 'The cliff road', region: 'Crownlands', primal: 'Air', west: { town: 'windmere', name: 'Windmere' }, east: { town: 'ironford', name: 'Ironford' }, map: { x: 33, y: 64 }, bands: { name: 'Cliff raider', types: ['cliff-brute', 'gale-skirmisher', 'storm-adept', 'wind-shaman'], levels: [18, 22] } });
