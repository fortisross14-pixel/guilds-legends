import { AREA_BOSSES } from '../enemies.js';
import { walkedRoad } from './chapter2Roads.js';

// The Chapter 1 roads, laid out like the Chapter 2 ones (src/data/wilds/roadLayout.js): a winding
// road through the woods, open verges, clearings at the ends of trails. Every place, band, boss,
// gathering spot and id is the one the story and the contracts use (docs/design/STORY_DRAFT.md).

const spot = (id, x, y, rx, ry) => ({ id, x, y, rx, ry });

// The Old Road (Animal): west from Dunmere to Dawnwatch Temple, a dead end. Stay on the road and
// you are mostly safe; every band waits off it. The Wolfskins' den lies deep in the southern woods
// (the Grey Alpha); at the far end the temple, its gate held by Brother Malric, the Ash Abbot.
// Once the Wolfskins on the Old Road contract is done, other bands move into the woods.
export const oldRoad = walkedRoad({
  id: 'old-road',
  name: 'The Old Road',
  tagline: 'West of Dunmere · to Dawnwatch Temple',
  region: 'Crownlands',
  primal: 'Animal',
  east: { town: 'dunmere', name: 'Dunmere' },
  battle: 'bg.battle.oldroad',
  map: { x: 8, y: 53 },
  description: 'The old pilgrim road west of Dunmere, to Dawnwatch Temple. Woods crowd it on both sides; the Wolfskins, raiders in wolf pelts, wait in the clearings.',
  layout: {
    width: 96,
    height: 34,
    salt: 5,
    verge: 3,
    deadEnd: 'west',
    path: [[12, 15], [22, 16], [34, 13], [46, 15], [58, 18], [70, 16], [82, 13], [95, 14]],
    // The temple yard: room for the temple, the priests' house and the gate in front.
    open: [{ x: 2, y: 5, w: 20, h: 9 }],
    clearings: [
      spot('temple', 10, 12, 9, 5),
      spot('pond', 15, 24, 5, 3),
      spot('lookouts', 30, 4, 5, 2),
      spot('camp', 47, 5, 5, 2),
      spot('shrine', 70, 5, 5, 2),
      spot('witch', 26, 27, 5, 2),
      spot('robber', 40, 25, 4, 2),
      spot('den', 55, 28, 7, 3),
      spot('pair', 80, 26, 5, 2),
      spot('mile', 62, 9, 3, 2),
    ],
    dressing: ['deco.flowers-white', 'deco.fern', 'deco.pebbles', 'deco.flowers-pink', 'deco.mushrooms', 'deco.bush'],
    rocks: ['deco.rock-big', 'deco.rocks', 'deco.stump', 'deco.log'],
  },
  camp: 'camp',
  campName: 'Roadside camp',
  // Doors as in towns: the building fills the 5 × 5 tiles above the door tile.
  buildings: [
    { building: 'temple', label: 'Dawnwatch Temple', spot: 'temple', offset: [-4, 0], asset: 'town.oldroad.temple', gate: 'ash-abbot' },
    { building: 'priory', label: 'The priests’ house', spot: 'temple', offset: [4, 0], asset: 'town.oldroad.priory' },
  ],
  props: [
    { id: 'pond', asset: 'deco.pond', spot: 'pond', offset: [-2, -2], size: [4, 4] },
    { id: 'milestone', asset: 'prop.milestone', spot: 'mile', offset: [1, 0], size: [1, 1], poi: { name: 'Old milestone', verb: 'Inspect', dialogue: 'wild.oldroad.milestone' } },
    { id: 'sign-temple', asset: 'deco.signpost-2', spot: 'temple', offset: [8, 1], size: [1, 1] },
    { id: 'grave-1', asset: 'deco.grave', spot: 'temple', offset: [-8, -5], size: [1, 1] },
    { id: 'grave-2', asset: 'deco.grave-cross', spot: 'temple', offset: [-7, -3], size: [1, 1] },
    { id: 'grave-3', asset: 'deco.grave', spot: 'temple', offset: [-8, -1], size: [1, 1] },
    { id: 'temple-column-1', asset: 'deco.ruin-column', spot: 'temple', offset: [-8, 2], size: [1, 1] },
    { id: 'temple-fire', asset: 'deco.campfire', spot: 'temple', offset: [1, 3], size: [1, 1] },
    { id: 'camp-tent', asset: 'deco.tent', spot: 'camp', offset: [2, -1], size: [2, 1] },
    { id: 'camp-log', asset: 'deco.log', spot: 'camp', offset: [-3, 1], size: [2, 1] },
    { id: 'camp-spit', asset: 'deco.spit', spot: 'camp', offset: [2, 1], size: [1, 1] },
    { id: 'lookout-sacks', asset: 'deco.sacks', spot: 'lookouts', offset: [3, 0], size: [1, 1] },
    { id: 'lookout-crate', asset: 'deco.crate', spot: 'lookouts', offset: [-3, 0], size: [1, 1] },
    { id: 'priest-grave', asset: 'deco.grave-cross', spot: 'shrine', offset: [2, -1], size: [1, 1] },
    { id: 'priest-column', asset: 'deco.ruin-column', spot: 'shrine', offset: [-2, -1], size: [1, 1] },
    { id: 'witch-spit', asset: 'deco.spit', spot: 'witch', offset: [-3, 0], size: [1, 1] },
    { id: 'robber-cart', asset: 'deco.cart', spot: 'robber', offset: [2, -1], size: [2, 1] },
    { id: 'den-tent-1', asset: 'deco.tent', spot: 'den', offset: [-4, -2], size: [2, 1] },
    { id: 'den-tent-2', asset: 'deco.tent', spot: 'den', offset: [3, -2], size: [2, 1] },
    { id: 'den-banner', asset: 'deco.banner', spot: 'den', offset: [-5, 1], size: [1, 1] },
    { id: 'den-pike', asset: 'deco.skull-pike', spot: 'den', offset: [5, 1], size: [1, 1] },
    { id: 'den-fire', asset: 'deco.campfire', spot: 'den', offset: [1, 2], size: [1, 1] },
    { id: 'den-crate', asset: 'deco.crate', spot: 'den', offset: [4, -1], size: [1, 1] },
    { id: 'pair-stump', asset: 'deco.stump-moss', spot: 'pair', offset: [-3, 0], size: [1, 1] },
  ],
  // Standing: the bandit who robbed Corwin's cart (errand 1.s3), there only while the errand is on.
  enemies: [
    { id: 'cart-robber', name: 'The cart robber and his mates', spot: 'robber', asset: 'enemy.group.bandits', types: ['road-bandit', 'shield-thug', 'road-bandit'], count: 3, level: 4, power: 47, if: { storyStep: 'e3-strongbox.box' }, respawnWeeks: 100000, reward: { gold: [30, 50], items: { 'corwin-strongbox': 1 } } },
  ],
  ambushes: [
    { id: 'wolves-near', name: 'Wolfskin pair', types: ['wolfskin'], count: 2, level: 2, power: 42, if: { oldRoadCleared: false }, reward: { gold: [24, 48], xp: 64 } },
    { id: 'wolf-pack', name: 'Wolfskins and a bandit', types: ['wolfskin', 'road-bandit'], count: 3, level: 3, power: 45, if: { oldRoadCleared: false }, reward: { gold: [36, 68], xp: 108 } },
    { id: 'bandit-lookouts', name: 'Bandit lookouts', types: ['road-bandit', 'shield-thug'], count: 3, level: 3, power: 45, reward: { gold: [60, 100], xp: 108 } },
    { id: 'hedge-witch', name: 'Hedge witch and guards', types: ['hedge-witch', 'shield-thug', 'field-priest'], count: 3, level: 5, power: 49, if: { oldRoadCleared: true }, reward: { gold: [68, 112], xp: 120 } },
    { id: 'renegades', name: 'Renegade priest’s band', types: ['field-priest', 'road-bandit', 'wolfskin'], count: 3, level: 5, power: 49, if: { oldRoadCleared: true }, reward: { gold: [68, 112], xp: 120 } },
  ],
  boss: {
    id: 'grey-alpha',
    name: 'The Grey Alpha’s den',
    spot: 'den',
    asset: 'enemy.boss.alpha',
    types: ['wolfskin', 'road-bandit'],
    count: 2,
    level: 7,
    power: 54,
    boss: AREA_BOSSES['grey-alpha'],
    respawnWeeks: 16,
    reward: { gold: [80, 120], xp: 60, items: { 'hi-potion': 1, liquor: 3 } },
  },
  // Brother Malric holds the temple gate (once beaten, he is gone for good; the temple opens).
  bosses: [
    {
      id: 'ash-abbot',
      name: 'The Ash Abbot at the temple gate',
      spot: 'temple',
      offset: [-4, 2],
      asset: 'enemy.boss.abbot',
      types: ['field-priest', 'shield-thug'],
      count: 3,
      level: 7,
      power: 54,
      boss: AREA_BOSSES['ash-abbot'],
      respawnWeeks: 100000,
      reward: { gold: [140, 190], xp: 90, items: { 'hi-potion': 2 } },
    },
  ],
  gathers: [
    { id: 'herbs-west', kind: 'herb', name: 'Feverfew', spot: 'pond', offset: [4, 1], reward: { items: { feverfew: 2 } } },
    { id: 'pouch-east', kind: 'coin', name: 'Lost coin pouch', spot: 'pair', offset: [2, 0], reward: { gold: [10, 25] } },
    { id: 'herbs-south', kind: 'herb', name: 'Bitterroot', spot: 'witch', offset: [2, 0], reward: { items: { antidote: 1 } } },
  ],
});

// The Thornwood edge (Plant): the road between Dunmere (west) and Greenhollow (east), where
// Greenhollow's wards end and the old forest begins. The Lantern's waystone and the poachers camped
// at it (1.6), Captain Vask's camp in the north thicket, Nessa's brother's old campsite (errand).
export const thornwood = walkedRoad({
  id: 'thornwood-edge',
  name: 'Thornwood edge',
  region: 'Verdant Marches',
  primal: 'Plant',
  west: { town: 'dunmere', name: 'Dunmere' },
  east: { town: 'greenhollow', name: 'Greenhollow' },
  hub: 'greenhollow',
  battle: 'bg.battle.thornwood',
  map: { x: 34, y: 14 },
  description: 'Where Greenhollow’s wards end and the old forest begins. Thorn stalkers hunt the undergrowth and a bandit crew has made camp in the meadow.',
  layout: {
    width: 96,
    height: 34,
    salt: 13,
    verge: 3,
    path: [[0, 16], [14, 15], [28, 19], [42, 17], [56, 13], [70, 16], [84, 18], [95, 17]],
    clearings: [
      spot('sage', 10, 6, 4, 2),
      spot('waystone', 34, 6, 5, 2),
      spot('vask', 62, 4, 7, 3),
      spot('ward', 86, 9, 3, 2),
      spot('oldcamp', 18, 27, 5, 3),
      spot('camp', 46, 28, 5, 2),
      spot('meadow', 76, 27, 5, 3),
    ],
    dressing: ['deco.fern', 'deco.fern-2', 'deco.mushrooms', 'deco.flowers-white', 'deco.bush'],
    rocks: ['deco.stump-moss', 'deco.log-hollow', 'deco.rocks', 'deco.stump'],
  },
  camp: 'camp',
  campName: 'Mossy clearing',
  props: [
    // The Broken Lantern's waystone (story 1.6): their marks carved in it.
    { id: 'waystone', asset: 'deco.standing-stone', spot: 'waystone', offset: [-2, -1], size: [1, 1], poi: { name: 'Old waystone', verb: 'Inspect', dialogue: 'wild.thornwood.waystone' } },
    // Nessa's brother's old camp (errand 1.s6).
    { id: 'old-camp', asset: 'deco.log-hollow', spot: 'oldcamp', offset: [-2, 0], size: [1, 1], poi: { name: 'An old campsite', verb: 'Inspect', dialogue: 'wild.thornwood.oldcamp' } },
    { id: 'ward-marker', asset: 'prop.wardstone', spot: 'ward', size: [1, 1], poi: { name: 'Fallen ward marker', verb: 'Inspect', dialogue: 'wild.thornwood.marker' } },
    { id: 'vask-tent', asset: 'deco.tent', spot: 'vask', offset: [-5, -1], size: [2, 1] },
    { id: 'vask-fire', asset: 'deco.campfire', spot: 'vask', offset: [3, 1], size: [1, 1] },
    { id: 'vask-crate', asset: 'deco.crate', spot: 'vask', offset: [5, -1], size: [1, 1] },
    { id: 'oldcamp-fire', asset: 'deco.firewood', spot: 'oldcamp', offset: [2, 1], size: [1, 1] },
    { id: 'meadow-log', asset: 'deco.log', spot: 'meadow', offset: [-3, 1], size: [2, 1] },
  ],
  // Standing: the poachers camped at the Lantern's waystone (story 1.6).
  enemies: [
    { id: 'waystone-band', name: 'Poachers at the waystone', spot: 'waystone', offset: [2, 0], asset: 'enemy.group.stalkers', types: ['thorn-stalker', 'bark-brute', 'thorn-stalker'], count: 3, level: 8, power: 56, respawnWeeks: 100000, reward: { gold: [60, 90], items: { 'poacher-snare': 1 } } },
  ],
  ambushes: [
    { id: 'stalkers', name: 'Thorn stalkers', types: ['thorn-stalker'], count: 2, level: 7, power: 54, reward: { gold: [48, 80], xp: 80 } },
    { id: 'spores', name: 'Spore callers and a mender', types: ['spore-caller', 'grove-mender'], count: 3, level: 7, power: 54, reward: { gold: [52, 88], xp: 120 } },
    { id: 'barkhides', name: 'Barkhide brutes', types: ['bark-brute', 'moss-warden'], count: 3, level: 8, power: 56, reward: { gold: [72, 120], xp: 132 } },
    { id: 'bandit-scouts', name: 'Bandit scouts', types: ['thorn-stalker', 'bark-brute', 'grove-mender'], count: 3, level: 8, power: 56, reward: { gold: [80, 132], xp: 132, items: { potion: 1 } } },
  ],
  boss: {
    id: 'bandit-captain',
    name: 'Captain Vask’s camp',
    spot: 'vask',
    asset: 'enemy.boss.captain',
    types: ['thorn-stalker', 'grove-mender'],
    count: 3,
    level: 9,
    power: 58,
    boss: AREA_BOSSES['bandit-captain'],
    if: { visitedArea: 'thornwood-edge' },
    respawnWeeks: 16,
    reward: { gold: [110, 160], xp: 80, items: { 'hi-potion': 1 } },
  },
  gathers: [
    { id: 'herbs-north', kind: 'herb', name: 'Thornwood sage', spot: 'sage', reward: { items: { potion: 1 } } },
    { id: 'herbs-east', kind: 'herb', name: 'Silverleaf', spot: 'meadow', offset: [2, 0], reward: { items: { ether: 1 } } },
    { id: 'pouch', kind: 'coin', name: 'Bandit stash', spot: 'oldcamp', offset: [0, 1], reward: { gold: [20, 40] } },
  ],
});

// The Blackwood (Psychic): dead trees and black mud past Dunmere's west woods, a dead end. Open
// from the start and the most dangerous place in the west (foes around level 30–35): a guild that
// walks in early is carried home. A wall of dead wood and the Hollow Warden bar the way deeper.
export const blackwood = walkedRoad({
  id: 'blackwood',
  name: 'The Blackwood',
  tagline: 'Where the Broken Lantern fell',
  region: 'The Far Veil',
  primal: 'Psychic',
  east: { town: 'dunmere', name: 'Dunmere' },
  battle: 'bg.battle.blackwood',
  map: { x: 8, y: 30 },
  description: 'Dead trees, black mud and lantern light where no one carries a lantern. Only the edge is passable: something vast blocks the way deeper.',
  layout: {
    width: 80,
    height: 30,
    salt: 17,
    verge: 2,
    deadEnd: 'west',
    path: [[13, 14], [24, 16], [36, 12], [50, 15], [64, 13], [79, 14]],
    wall: { x: 0, w: 9, char: 'T' },
    clearings: [
      spot('end', 13, 14, 3, 3),
      spot('lantern', 30, 4, 4, 2),
      spot('herbs', 56, 5, 4, 2),
      spot('brood', 42, 25, 6, 3),
      spot('camp', 66, 24, 4, 2),
    ],
    dressing: ['deco.bush-dead', 'deco.pebbles', 'deco.mushrooms', 'deco.bush-dead'],
    rocks: ['deco.tree-dead-small', 'deco.rocks', 'deco.stump', 'deco.crystals'],
    rocky: 0.03,
  },
  camp: 'camp',
  campName: 'A cold firepit at the edge',
  props: [
    { id: 'warden', asset: 'prop.hollowwarden', spot: 'end', offset: [-3, 0], size: [1, 1], poi: { name: 'The Hollow Warden', verb: 'Approach', dialogue: 'wild.blackwood.warden' } },
    { id: 'lantern', asset: 'prop.brokenlantern', spot: 'lantern', offset: [-2, -1], size: [1, 1], poi: { name: 'Broken lantern', verb: 'Inspect', dialogue: 'wild.blackwood.lantern' } },
    { id: 'brood-pike', asset: 'deco.skull-pike', spot: 'brood', offset: [-4, -1], size: [1, 1] },
    { id: 'brood-stone', asset: 'deco.standing-stone', spot: 'brood', offset: [4, -1], size: [1, 1] },
  ],
  // No standing groups: only story bosses stand on the map.
  enemies: [],
  ambushes: [
    { id: 'shades', name: 'Veil wraiths', types: ['veil-wraith', 'mind-thief'], count: 3, level: 30, power: 98, reward: { gold: [240, 360] } },
    { id: 'hulks', name: 'Void juggernauts', types: ['void-juggernaut', 'hollow-knight'], count: 3, level: 33, power: 98, reward: { gold: [260, 400] } },
  ],
  boss: {
    id: 'lantern-brood',
    name: 'The Lantern-eater’s circle',
    spot: 'brood',
    asset: 'enemy.boss.lanterneater',
    types: ['veil-wraith', 'mind-thief'],
    count: 3,
    level: 35,
    power: 98,
    boss: AREA_BOSSES['lantern-brood'],
    respawnWeeks: 20,
    reward: { gold: [320, 460], items: { 'phoenix-feather': 1 } },
  },
  gathers: [
    { id: 'black-herbs', kind: 'herb', name: 'Nightcap', spot: 'herbs', reward: { items: { ether: 1 } } },
    { id: 'ore', kind: 'ore', name: 'Veil-glass shard', spot: 'lantern', offset: [2, 0], reward: { gold: [40, 70] } },
  ],
});
