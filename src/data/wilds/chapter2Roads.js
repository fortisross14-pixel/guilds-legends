import { layRoad } from './roadLayout.js';
import { power, roadBands } from './emptyRoad.js';

// The Chapter 2 roads, laid out for walking (src/data/wilds/roadLayout.js): bigger than the
// Old Road (96 x 34 against its 64 x 30), each with its own element, ground and dressing,
// and the chapter's places on named clearings (docs/design/STORY_DRAFT.md, Chapter 2).

/** A walked road between two towns, from its layout and the places on it. */
function walkedRoad({ id, name, region, primal, west, east, map, description, battle, layout, bands, enemies = [], gathers = [], props = [], camp }) {
  const laid = layRoad(layout);
  const at = (spot, dx = 0, dy = 0) => [laid.spots[spot][0] + dx, laid.spots[spot][1] + dy];
  const W = layout.width;
  const [wx, wy] = laid.ends.west;
  const [ex, ey] = laid.ends.east;
  return {
    id,
    kind: 'wild',
    name,
    tagline: `The road between ${west.name} and ${east.name}`,
    hub: west.town,
    region,
    primal,
    battle,
    map,
    description,
    width: W,
    height: layout.height,
    arrive: [wx + 2, wy],
    tiles: laid.tiles,
    exit: { at: [0, wy], size: [1, 2], name: `To ${west.name}` },
    links: [
      { town: west.town, at: [0, wy], size: [1, 2], name: `To ${west.name}`, arrive: [2, wy] },
      { town: east.town, at: [W - 1, ey], size: [1, 2], name: `To ${east.name}`, arrive: [ex - 2, ey] },
    ],
    camp: { at: at(camp, -1, -1), size: [2, 2], name: 'A place to rest' },
    props: [...props.map((prop) => ({ ...prop, at: at(prop.spot, ...(prop.offset || [0, 0])) })), ...laid.props],
    enemies: enemies.map((group) => ({ ...group, at: at(group.spot, ...(group.offset || [0, 0])) })),
    ambushes: roadBands(bands.name, bands.types, bands.levels),
    gathers: gathers.map((spot) => ({ ...spot, at: at(spot.spot, ...(spot.offset || [0, 0])) })),
    anchors: laid.anchors,
  };
}

const group = (id, name, spot, types, level, gold, extra = {}) => ({ id, name, spot, asset: 'enemy.group.bandits', types, count: types.length, level, power: power(level), respawnWeeks: 100000, reward: { gold }, ...extra });

// The Iron Road (Iron): pine woods and broken hills between Greenhollow and Ironford, a river
// crossed by the bridge the toll gang holds, the ochre heights to the north-east.
export const ironRoad = walkedRoad({
  id: 'iron-road',
  name: 'The Iron Road',
  region: 'Crownlands',
  primal: 'Iron',
  west: { town: 'greenhollow', name: 'Greenhollow' },
  east: { town: 'ironford', name: 'Ironford' },
  map: { x: 36, y: 42 },
  battle: 'bg.battle.iron',
  description: 'The ore road from Greenhollow to Ironford: pine woods, broken hills and a river bridge that someone always wants a toll for.',
  layout: {
    width: 96,
    height: 34,
    salt: 3,
    verge: 3,
    path: [[0, 9], [14, 10], [28, 15], [42, 16], [52, 15], [64, 11], [78, 17], [95, 17]],
    river: { x: 46, width: 3 },
    clearings: [
      { id: 'bridge', x: 40, y: 11, rx: 4, ry: 2 },
      { id: 'heights', x: 80, y: 5, rx: 7, ry: 3 },
      { id: 'pit', x: 14, y: 26, rx: 6, ry: 3 },
      { id: 'camp', x: 58, y: 26, rx: 5, ry: 3 },
      { id: 'glade-1', x: 26, y: 4, rx: 5, ry: 2 },
      { id: 'glade-2', x: 72, y: 27, rx: 5, ry: 3 },
    ],
    dressing: ['deco.fern', 'deco.pebbles', 'deco.flowers-white', 'deco.fern-2', 'deco.stump-moss'],
    rocks: ['deco.rock-big', 'deco.rocks', 'deco.rock-tall', 'deco.stump'],
    rocky: 0.02,
  },
  camp: 'camp',
  bands: { name: 'Toll gang', types: ['shield-thug', 'road-bandit', 'field-priest', 'hedge-witch'], levels: [12, 16] },
  // 2.1 the toll gang on the bridge; 2.4 the ochre on the heights and who guards it; the ore for Corr's errand.
  enemies: [
    group('toll-gang', 'The toll gang on the bridge', 'bridge', ['shield-thug', 'road-bandit', 'shield-thug'], 12, [90, 130], { reward: { gold: [90, 130], items: { liquor: 2 } } }),
    group('heights-band', 'Ochre diggers gone bad', 'heights', ['shield-thug', 'hedge-witch', 'road-bandit'], 16, [110, 160], { offset: [-3, 0] }),
  ],
  gathers: [
    { id: 'ochre', kind: 'ore', name: 'Ochre seam', spot: 'heights', offset: [3, -1], if: { wildBeaten: 'iron-road:heights-band' }, guarded: 'The diggers on the heights won’t share their seam.', respawnWeeks: 8, reward: { items: { ochre: 1 } } },
    { id: 'ore', kind: 'ore', name: 'Iron ore', spot: 'pit', respawnWeeks: 2, reward: { items: { 'iron-ore': 2 } } },
    { id: 'ore-2', kind: 'ore', name: 'Iron ore', spot: 'pit', offset: [4, 1], respawnWeeks: 2, reward: { items: { 'iron-ore': 2 } } },
    { id: 'herbs', kind: 'herb', name: 'Hill sage', spot: 'glade-1', respawnWeeks: 4, reward: { items: { potion: 1 } } },
  ],
  props: [
    { id: 'sign-west', asset: 'deco.signpost', spot: 'pit', offset: [-4, -6], size: [1, 1] },
    { id: 'pit-cart', asset: 'deco.cart', spot: 'pit', offset: [-3, 1], size: [2, 1] },
    { id: 'heights-tent', asset: 'deco.tent', spot: 'heights', offset: [-6, -1], size: [2, 1] },
    { id: 'heights-fire', asset: 'deco.campfire', spot: 'heights', offset: [0, 2], size: [1, 1] },
    { id: 'toll-barrel', asset: 'deco.barrel', spot: 'bridge', offset: [3, -1], size: [1, 1] },
    { id: 'toll-crate', asset: 'deco.crate', spot: 'bridge', offset: [-3, -1], size: [1, 1] },
  ],
});

// The cliff road (Air): bare rock and wind-bent pines along the cliffs between Ironford and
// Windmere, the sea far below to the south; the woad grows on a ledge.
export const cliffRoad = walkedRoad({
  id: 'cliff-road',
  name: 'The cliff road',
  region: 'Crownlands',
  primal: 'Air',
  west: { town: 'windmere', name: 'Windmere' },
  east: { town: 'ironford', name: 'Ironford' },
  map: { x: 33, y: 64 },
  battle: 'bg.battle.air',
  description: 'A narrow road along the cliffs between Windmere and Ironford. The wind decides who arrives.',
  layout: {
    width: 96,
    height: 34,
    salt: 7,
    verge: 2,
    path: [[0, 20], [16, 19], [30, 12], [46, 10], [60, 15], [74, 9], [95, 8]],
    sea: { y: 29 },
    clearings: [
      { id: 'ledge', x: 14, y: 26, rx: 6, ry: 2 },
      { id: 'lookout', x: 46, y: 4, rx: 6, ry: 2 },
      { id: 'camp', x: 62, y: 24, rx: 5, ry: 2 },
      { id: 'saddle', x: 84, y: 20, rx: 6, ry: 3 },
      { id: 'cairn', x: 30, y: 24, rx: 4, ry: 2 },
    ],
    dressing: ['deco.pebbles', 'deco.fern', 'deco.flowers-white', 'deco.pebbles'],
    rocks: ['deco.rock-big', 'deco.rock-tall', 'deco.rocks', 'deco.rock-flat'],
    rocky: 0.05,
  },
  camp: 'camp',
  bands: { name: 'Cliff raider', types: ['cliff-brute', 'gale-skirmisher', 'storm-adept', 'wind-shaman'], levels: [18, 22] },
  // 2.4 the woad on the ledge and the raiders camped on it.
  enemies: [group('ledge-band', 'Raiders on the woad ledge', 'ledge', ['cliff-brute', 'storm-adept', 'gale-skirmisher'], 17, [120, 170], { offset: [3, 0] })],
  gathers: [
    { id: 'woad', kind: 'herb', name: 'Woad on the ledge', spot: 'ledge', offset: [-3, 0], if: { wildBeaten: 'cliff-road:ledge-band' }, guarded: 'The raiders camped on the ledge are in the way.', respawnWeeks: 8, reward: { items: { woad: 1 } } },
    { id: 'eggs', kind: 'herb', name: 'Gull eggs', spot: 'lookout', respawnWeeks: 4, reward: { items: { potion: 1 } } },
  ],
  props: [
    { id: 'cairn-stone', asset: 'deco.standing-stone', spot: 'cairn', size: [1, 1] },
    { id: 'lookout-sign', asset: 'deco.signpost-2', spot: 'lookout', offset: [3, 1], size: [1, 1] },
    { id: 'saddle-grave', asset: 'deco.grave-cross', spot: 'saddle', offset: [2, -1], size: [1, 1] },
    { id: 'ledge-banner', asset: 'deco.banner', spot: 'ledge', offset: [5, -1], size: [1, 1] },
  ],
});

// The coast road (Water): meadows and salt-bent oaks along the shore between Dunmere and
// Windmere, the sea along the south; wreckers to the north, shell-pickers on the beach.
export const coastRoad = walkedRoad({
  id: 'coast-road',
  name: 'The coast road',
  region: 'Crownlands',
  primal: 'Water',
  west: { town: 'dunmere', name: 'Dunmere' },
  east: { town: 'windmere', name: 'Windmere' },
  map: { x: 21, y: 60 },
  battle: 'bg.battle.water',
  description: 'The shore road from Dunmere to Windmere: salt meadows, gulls, and wreckers who light false lamps on stormy nights.',
  layout: {
    width: 96,
    height: 34,
    salt: 11,
    verge: 4,
    path: [[0, 13], [18, 15], [36, 12], [54, 16], [72, 13], [95, 11]],
    sea: { y: 27, beach: 3 },
    clearings: [
      { id: 'wreckers', x: 30, y: 4, rx: 6, ry: 2 },
      { id: 'shells', x: 72, y: 23, rx: 6, ry: 2 },
      { id: 'wreck', x: 16, y: 23, rx: 5, ry: 2 },
      { id: 'camp', x: 52, y: 4, rx: 4, ry: 2 },
      { id: 'dunes', x: 88, y: 22, rx: 4, ry: 2 },
    ],
    dressing: ['deco.reeds', 'deco.flowers-white', 'deco.pebbles', 'deco.flowers-pink', 'deco.reeds'],
    rocks: ['deco.rocks', 'deco.rock-flat', 'deco.log', 'deco.stump'],
    rocky: 0.015,
  },
  camp: 'camp',
  bands: { name: 'Wrecker', types: ['harbor-brute', 'reef-raider', 'tide-caller', 'brine-cleric'], levels: [14, 18] },
  // 2.5 the wreckers Windmere wants gone; 2.4 the shell-pickers by the sea purple; the wreck (errand).
  enemies: [
    group('wreckers', 'The wreckers of the coast road', 'wreckers', ['harbor-brute', 'reef-raider', 'tide-caller'], 19, [160, 220], { if: { storyStep: 'c2-windmere.wreckers' } }),
    group('press-gang', 'The press-gang and their prisoners', 'dunes', ['harbor-brute', 'shell-guard', 'harbor-brute'], 17, [140, 190], { if: { storyStep: 'g2-pressgang.fight' } }),
    group('shell-band', 'Shell-pickers with knives', 'shells', ['reef-raider', 'brine-cleric', 'reef-raider'], 18, [120, 170], { offset: [-3, 0] }),
  ],
  gathers: [{ id: 'sea-purple', kind: 'herb', name: 'Purple shells', spot: 'shells', offset: [3, 0], if: { wildBeaten: 'coast-road:shell-band' }, guarded: 'The shell-pickers won’t let anyone near their shells.', respawnWeeks: 8, reward: { items: { 'sea-purple': 1 } } }],
  props: [
    { id: 'wreck', asset: 'deco.cart', spot: 'wreck', size: [2, 1], poi: { name: 'A wrecked wagon', verb: 'Inspect', dialogue: 'wild.coast.wreck' } },
    { id: 'wreckers-fire', asset: 'deco.campfire', spot: 'wreckers', offset: [3, 1], size: [1, 1] },
    { id: 'wreckers-crate', asset: 'deco.crate', spot: 'wreckers', offset: [-4, 0], size: [1, 1] },
    { id: 'wreckers-lamp', asset: 'prop.lamp', spot: 'wreckers', offset: [5, -1], size: [1, 1] },
    { id: 'dune-sign', asset: 'deco.signpost', spot: 'dunes', size: [1, 1] },
  ],
});
