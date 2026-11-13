// The world skeleton's roads (src/data/roads.js WORLD_ROADS): each a walkable box (emptyRoad)
// from one town to the next, with bands off the road from the far end's region at the road's
// levels. Art, props and places on them come with each chapter (docs/design/STORY_DRAFT.md).
import { WORLD_ROADS, skeletonAreaId } from '../roads.js';
import { LOCATION_BY_ID } from '../world.js';
import { REGION_ENEMIES } from '../enemies.js';
import { emptyRoad } from './emptyRoad.js';

// A band's name by region: who lies in wait along those roads.
const BAND_NAMES = {
  Crownlands: 'Highwaymen',
  'Verdant Marches': 'Thornfolk',
  'Ember Coast': 'Corsairs',
  'Sun Kingdoms': 'Ash zealots',
  'Storm Isles': 'Storm raiders',
  'Frost Frontier': 'Rime reavers',
  'The Far Veil': 'Veil-touched',
};

export const SKELETON_ROADS = WORLD_ROADS.map(([a, b, name, levels]) => {
  const from = LOCATION_BY_ID[a];
  const to = LOCATION_BY_ID[b];
  const region = to.region;
  const types = (REGION_ENEMIES[region] || REGION_ENEMIES.Crownlands).map((enemy) => enemy.id);
  return emptyRoad({
    id: skeletonAreaId(a, b),
    name,
    region,
    primal: to.primal || 'Iron',
    west: { town: a, name: from.name },
    east: { town: b, name: to.name },
    map: { x: Math.round((from.x + to.x) / 2), y: Math.round((from.y + to.y) / 2) },
    description: `The road from ${from.name} to ${to.name}. Bands of level ${levels[0]}–${levels[1]} wait off the road.`,
    bands: { name: BAND_NAMES[region] || 'Raider', types: [types[4] || types[0], types[0], types[2], types[3]].filter(Boolean), levels },
  });
});
