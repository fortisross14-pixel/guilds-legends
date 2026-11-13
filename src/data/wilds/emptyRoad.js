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

export function emptyRoad({ id, name, region, primal = 'Plant', west, east, map, description, bands = null, enemies = [], gathers = [], props = [] }) {
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
    props,
    // Standing groups (a band holding a bridge, guarding a dye), gathering spots and props: the chapter's places on the box.
    enemies,
    ambushes: bands ? roadBands(bands.name, bands.types, bands.levels) : [],
    gathers,
  };
}

// Danger by road (the open world: anyone can walk anywhere; a band far above the guild sends it home).
export const coastRoad = emptyRoad({
  id: 'coast-road',
  name: 'The coast road',
  region: 'Crownlands',
  primal: 'Water',
  west: { town: 'dunmere', name: 'Dunmere' },
  east: { town: 'windmere', name: 'Windmere' },
  map: { x: 21, y: 60 },
  bands: { name: 'Wrecker', types: ['harbor-brute', 'reef-raider', 'tide-caller', 'brine-cleric'], levels: [14, 18] },
  // Chapter 2: the wreckers Windmere wants gone (2.5), the shell-pickers by the sea purple (2.4), the wreck (errand).
  enemies: [
    { id: 'wreckers', name: 'The wreckers of the coast road', at: [12, 3], asset: 'enemy.group.bandits', types: ['harbor-brute', 'reef-raider', 'tide-caller'], count: 3, level: 19, power: 81, if: { storyStep: 'c2-windmere.wreckers' }, respawnWeeks: 100000, reward: { gold: [160, 220] } },
    { id: 'shell-band', name: 'Shell-pickers with knives', at: [30, 10], asset: 'enemy.group.bandits', types: ['reef-raider', 'brine-cleric', 'reef-raider'], count: 3, level: 18, power: 79, respawnWeeks: 100000, reward: { gold: [120, 170] } },
  ],
  gathers: [{ id: 'sea-purple', kind: 'herb', name: 'Purple shells', at: [33, 11], if: { wildBeaten: 'coast-road:shell-band' }, guarded: 'The shell-pickers won’t let anyone near their shells.', respawnWeeks: 8, reward: { items: { 'sea-purple': 1 } } }],
  props: [{ id: 'wreck', asset: 'deco.cart', at: [6, 11], size: [2, 1], poi: { name: 'A wrecked wagon', verb: 'Inspect', dialogue: 'wild.coast.wreck' } }],
});
export const ironRoad = emptyRoad({
  id: 'iron-road',
  name: 'The Iron Road',
  region: 'Crownlands',
  primal: 'Iron',
  west: { town: 'greenhollow', name: 'Greenhollow' },
  east: { town: 'ironford', name: 'Ironford' },
  map: { x: 36, y: 42 },
  bands: { name: 'Toll gang', types: ['shield-thug', 'road-bandit', 'field-priest', 'hedge-witch'], levels: [12, 16] },
  // Chapter 2: the toll gang on the bridge (2.1), the ochre on the heights and who guards it (2.4), iron ore (errand).
  enemies: [
    { id: 'toll-gang', name: 'The toll gang on the bridge', at: [20, 5], asset: 'enemy.group.bandits', types: ['shield-thug', 'road-bandit', 'shield-thug'], count: 3, level: 12, power: 65, respawnWeeks: 100000, reward: { gold: [90, 130], items: { liquor: 2 } } },
    { id: 'heights-band', name: 'Ochre diggers gone bad', at: [31, 2], asset: 'enemy.group.bandits', types: ['shield-thug', 'hedge-witch', 'road-bandit'], count: 3, level: 16, power: 74, respawnWeeks: 100000, reward: { gold: [110, 160] } },
  ],
  gathers: [
    { id: 'ochre', kind: 'ore', name: 'Ochre seam', at: [34, 2], if: { wildBeaten: 'iron-road:heights-band' }, guarded: 'The diggers on the heights won’t share their seam.', respawnWeeks: 8, reward: { items: { ochre: 1 } } },
    { id: 'ore', kind: 'ore', name: 'Iron ore', at: [8, 11], respawnWeeks: 2, reward: { items: { 'iron-ore': 2 } } },
  ],
});
export const cliffRoad = emptyRoad({
  id: 'cliff-road',
  name: 'The cliff road',
  region: 'Crownlands',
  primal: 'Air',
  west: { town: 'windmere', name: 'Windmere' },
  east: { town: 'ironford', name: 'Ironford' },
  map: { x: 33, y: 64 },
  bands: { name: 'Cliff raider', types: ['cliff-brute', 'gale-skirmisher', 'storm-adept', 'wind-shaman'], levels: [18, 22] },
  // Chapter 2: the woad on the cliff ledge and the raiders camped on it (2.4).
  enemies: [{ id: 'ledge-band', name: 'Raiders on the woad ledge', at: [10, 10], asset: 'enemy.group.bandits', types: ['cliff-brute', 'storm-adept', 'gale-skirmisher'], count: 3, level: 17, power: 76, respawnWeeks: 100000, reward: { gold: [120, 170] } }],
  gathers: [{ id: 'woad', kind: 'herb', name: 'Woad on the ledge', at: [6, 11], if: { wildBeaten: 'cliff-road:ledge-band' }, guarded: 'The raiders camped on the ledge are in the way.', respawnWeeks: 8, reward: { items: { woad: 1 } } }],
});
