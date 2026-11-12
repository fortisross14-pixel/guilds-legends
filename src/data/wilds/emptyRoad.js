import { rows } from '../tiles.js';

// A road that is only a box for now (decided later): grass, a tree border and
// the road straight across from one end (`west`, a town) to the other (`east`).
// Walk it end to end to arrive in the other town. No decoration, no fights.
export function emptyRoad({ id, name, region, primal = 'Plant', west, east, map, description }) {
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
    gathers: [],
  };
}

export const ironRoad = emptyRoad({ id: 'iron-road', name: 'The Iron Road', region: 'Crownlands', primal: 'Iron', west: { town: 'greenhollow', name: 'Greenhollow' }, east: { town: 'ironford', name: 'Ironford' }, map: { x: 36, y: 42 } });
export const cliffRoad = emptyRoad({ id: 'cliff-road', name: 'The cliff road', region: 'Crownlands', primal: 'Air', west: { town: 'windmere', name: 'Windmere' }, east: { town: 'ironford', name: 'Ironford' }, map: { x: 33, y: 64 } });
export const coastRoad = emptyRoad({ id: 'coast-road', name: 'The coast road', region: 'Crownlands', primal: 'Water', west: { town: 'dunmere', name: 'Dunmere' }, east: { town: 'windmere', name: 'Windmere' }, map: { x: 21, y: 60 } });
