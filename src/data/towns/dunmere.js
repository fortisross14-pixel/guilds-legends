import { rows } from '../tiles.js';

// Dunmere: the hub. A kiln-and-banner market town on a river. The plaza with
// the Banner Fountain sits between the north street (guild buildings) and the
// main road, which crosses the river bridge west to the Old Road.
// Legend: see src/data/tiles.js. Buildings and props are placed on top.
export default {
  id: 'dunmere',
  kind: 'town',
  name: 'Dunmere',
  tagline: 'Regional capital · your first home',
  landmark: 'The Banner Fountain',
  summary: 'Kilns smoke along the river and old banners hang from every balcony. Dunmere rebuilt itself around civic pride, and it notices who carries a new one.',
  districts: ['Banner Plaza', 'Kiln Row', 'The Bridge Road', 'Arena Lane'],
  width: 40,
  height: 26,
  spawn: [6, 17],
  arrive: [12, 16],
  tiles: rows(
    40,
    ['TTTTTTTTTT', 'TTTTTTTTTT', 'TTTTTTTTTT', 'TTTTTTTTTT'],
    ['~~~.......', '..........', '..........', '.........T'],
    ['~~~.......', '..........', '..........', '.........T'],
    ['~~~.......', '..........', '..........', '.........T'],
    ['~~~.......', '..........', '..........', '.........T'],
    ['~~~.......', '..........', '..........', '.........T'],
    ['~~~.......', '..........', '..........', '.........T'],
    ['~~~.======', '==========', '==========', '=======..T'],
    ['~~~.T....=', '=....#####', '######....', '==......TT'],
    ['~~~......=', '=....#####', '######....', '==.......T'],
    ['~~~......=', '=....#####', '######....', '==.......T'],
    ['~~~......=', '=....#####', '######....', '==.......T'],
    ['~~~......=', '=....#####', '######....', '==.......T'],
    ['~~~......=', '=....#####', '######....', '==.......T'],
    ['~~~......=', '=....#####', '######....', '==.......T'],
    ['bbb=======', '==========', '==========', '=========T'],
    ['bbb=======', '==========', '==========', '=========T'],
    ['~~~......=', '=.........', '..........', '==.......T'],
    ['~~~..T...=', '=.........', '..........', '==.......T'],
    ['~~~......=', '=.........', '..........', '==.......T'],
    ['~~~......=', '=.........', '..........', '==.......T'],
    ['~~~......=', '=.........', '..........', '==.......T'],
    ['~~~......=', '=.........', '..........', '==.......T'],
    ['~~~.======', '==========', '==========', '=======..T'],
    ['~~~.......', '..T.......', '.....T....', '.........T'],
    ['TTTTTTTTTT', 'TTTTTTTTTT', 'TTTTTTTTTT', 'TTTTTTTTTT'],
  ),
  // `door` is the street tile in front of the doorway; the building fills the 5×4 tiles above it.
  buildings: [
    { building: 'herald', label: 'Herald’s Office', door: [6, 7], asset: 'town.dunmere.herald' },
    { building: 'tavern', label: 'The Wayfarer', door: [14, 7], asset: 'town.dunmere.tavern' },
    { building: 'guildHall', label: 'Guild Hall', door: [22, 7], asset: 'town.dunmere.guildhall.stage1' },
    { building: 'shop', label: 'Mira’s Supply', door: [34, 7], asset: 'town.dunmere.shop' },
    { building: 'arena', label: 'Dunmere Arena', door: [20, 23], asset: 'town.dunmere.arena' },
  ],
  // `at` is the top-left tile, `size` in tiles. Props block movement unless `walkable`.
  props: [
    { id: 'fountain', asset: 'prop.fountain', at: [19, 10], size: [3, 3], poi: { name: 'Banner Fountain', verb: 'Inspect', dialogue: 'dunmere.fountain' } },
    { id: 'noticeBoard', asset: 'prop.noticeboard', at: [24, 12], size: [2, 2], poi: { name: 'Notice Board', verb: 'Inspect', building: 'noticeBoard' } },
    { id: 'well', asset: 'prop.well', at: [35, 11], size: [1, 1], poi: { name: 'Old well', verb: 'Inspect', dialogue: 'dunmere.well' } },
    { id: 'kiln', asset: 'prop.kiln', at: [33, 19], size: [2, 2], poi: { name: 'Hesta’s kiln', verb: 'Inspect', dialogue: 'dunmere.kiln' } },
    { id: 'stall-1', asset: 'prop.stall', at: [12, 18], size: [2, 1] },
    { id: 'stall-2', asset: 'prop.stall', at: [15, 18], size: [2, 1] },
    { id: 'stall-3', asset: 'prop.stall', at: [25, 18], size: [2, 1] },
    { id: 'lamp-1', asset: 'prop.lamp', at: [11, 14], size: [1, 1] },
    { id: 'lamp-2', asset: 'prop.lamp', at: [28, 14], size: [1, 1] },
  ],
  npcs: [
    { id: 'innkeeper', name: 'Sella Rowan', role: 'Innkeeper', at: [14, 9], dialogue: 'dunmere.innkeeper' },
    { id: 'merchant', name: 'Bram Hallow', role: 'Road merchant', at: [23, 14], dialogue: 'dunmere.merchant' },
    { id: 'fighter', name: 'Nia Voss', role: 'Local fighter', at: [24, 21], dialogue: 'dunmere.fighter' },
    { id: 'traveler', name: 'Iven Quill', role: 'Traveler', at: [4, 18], dialogue: 'dunmere.traveler' },
    { id: 'herald', name: 'Orren Pike', role: 'Herald', at: [7, 8], dialogue: 'dunmere.herald' },
    { id: 'kilnmaster', name: 'Hesta Coal', role: 'Kiln-master', at: [35, 21], dialogue: 'dunmere.kilnmaster' },
    { id: 'lamplighter', name: 'Pip', role: 'Lamplighter', at: [27, 10], dialogue: 'dunmere.lamplighter' },
  ],
  // Walking onto an exit leaves town for a wild area.
  exits: [{ id: 'exit-old-road', area: 'old-road', name: 'The Old Road', at: [0, 15], size: [1, 2] }],
};
