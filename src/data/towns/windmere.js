import { rows } from '../tiles.js';

// Windmere: a hill town of couriers and dueling schools on a cliff. Cobbled
// terraces climb north toward the monastery wall; the Cliff Ring stands on the
// southern edge above the drop. No guild hall and no herald here.
export default {
  id: 'windmere',
  kind: 'town',
  name: 'Windmere',
  tagline: 'Hill monasteries · cliff duels',
  landmark: 'The Cliff Ring',
  summary: 'Wind off the cliffs decides as many bouts as the blades. Old fighters come home to Windmere to die, or to keep fighting.',
  districts: ['Courier Steps', 'Monastery Terrace', 'The Cliff Ring'],
  width: 36,
  height: 24,
  spawn: [17, 21],
  arrive: [17, 21],
  tiles: rows(
    36,
    ['WWWWWWWWWW', 'WWWWWWW==W', 'WWWWWWWWWW', 'WWWWWW'],
    ['W.........', '.......==.', '..........', '.....W'],
    ['W.........', '.......==.', '..........', '.....W'],
    ['W.........', '.......==.', '..........', '.....W'],
    ['W.........', '.......==.', '..........', '.....W'],
    ['W.........', '.......==.', '..........', '.....W'],
    ['W.........', '.......==.', '..........', '.....W'],
    ['W..=======', '==========', '==========', '======'],
    ['W..=......', '..=.......', '...=......', '..=..W'],
    ['W..=......', '..=..#####', '#..=......', '..=..W'],
    ['W..=......', '..=..#####', '#..=......', '..=..W'],
    ['W..=......', '..=..#####', '#..=......', '..=..W'],
    ['W..=======', '==========', '==========', '===..W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W......===', '==========', '=========.', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['W.........', '..........', '..=.......', '.....W'],
    ['WWWWWWWWWW', 'WWWWWWWWWW', 'WW=WWWWWWW', 'WWWWWW'],
  ),
  buildings: [
    { building: 'tavern', label: 'The Gull’s Rest', door: [8, 7], asset: 'town.windmere.inn' },
    { building: 'shop', label: 'Courier Supply', door: [27, 7], asset: 'town.windmere.shop' },
    { building: 'arena', label: 'The Cliff Ring', door: [17, 19], asset: 'town.windmere.arena' },
  ],
  props: [
    { id: 'noticeBoard', asset: 'prop.noticeboard', at: [22, 10], size: [2, 2], poi: { name: 'Notice Board', verb: 'Inspect', building: 'noticeBoard' } },
    { id: 'windbell', asset: 'prop.windbell', at: [16, 9], size: [2, 2], poi: { name: 'The wind bell', verb: 'Inspect', dialogue: 'windmere.bell' } },
    { id: 'lamp-1', asset: 'prop.lamp', at: [4, 13], size: [1, 1] },
    { id: 'lamp-2', asset: 'prop.lamp', at: [31, 13], size: [1, 1] },
  ],
  npcs: [
    { id: 'courier', name: 'Sela Wick', role: 'Courier', at: [12, 15], dialogue: 'windmere.courier' },
    { id: 'monk', name: 'Brother Hale', role: 'Monastery keeper', at: [24, 15], dialogue: 'windmere.monk' },
    // Chapter 2 (2.6, Two Doors): the honest overseer of the docks and the fence.
    { id: 'dace', name: 'Overseer Dace', role: 'Dock overseer', at: [6, 20], dialogue: 'windmere.dace', asset: 'npc.role.council-steward' },
    { id: 'cass', name: 'Cass Vey', role: 'Fence', at: [30, 20], dialogue: 'windmere.cass', asset: 'npc.role.traveller' },
  ],
  exits: [
    { id: 'exit-cliff-road', area: 'cliff-road', name: 'The cliff road', at: [35, 7], size: [1, 1] },
    { id: 'exit-coast-road', area: 'coast-road', name: 'The coast road', at: [17, 0], size: [2, 1] },
    { id: 'exit-road-windmere-tidecross', area: 'road-windmere-tidecross', name: 'The Salt Road', at: [22, 23], size: [1, 1] },
  ],
};
