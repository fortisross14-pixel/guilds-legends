// The road network (Chapter 1, docs/design/road-network.svg). The world is not
// walked end to end: places are joined by roads. A road with an `area` is a
// walkable wild area (src/data/wilds): leave a town by that road's gate and you are
// on it; walk it to its far end and you arrive at the place there. A road without
// one is travelled from the world map, in days.
// `legs`: days from each end's town to the road. Leaving a town onto the road
// costs that town's leg; going on to the far town costs the far town's leg; turning
// back to where you came from costs nothing more.
// `gate`: a condition (src/data/dialogue/index.js) that must hold to take the road
// (story progress); `lockedText` says why it is closed.

import { LOCATION_BY_ID } from './world.js';

/** The roads past the first four towns: [from, to, name, band levels]. Every one is walked, as a box for now. */
export const WORLD_ROADS = [
  ['ironford', 'mooncourt', 'The Moon Road', [22, 28]],
  ['greenhollow', 'thornwatch', 'The Warden’s Path', [16, 22]],
  ['windmere', 'tidecross', 'The Salt Road', [20, 26]],
  ['tidecross', 'brasshaven', 'The Brass Road', [24, 30]],
  ['tidecross', 'sunspire', 'The Sun Road', [26, 32]],
  ['sunspire', 'mooncourt', 'The Gilded Road', [28, 34]],
  ['mooncourt', 'thornwatch', 'The Briar Road', [26, 32]],
  ['thornwatch', 'verdant-citadel', 'The Green Ascent', [30, 35]],
  ['thornwatch', 'skyreach', 'The Storm Stair', [30, 35]],
  ['skyreach', 'beaststeppe', 'The Steppe Road', [32, 35]],
  ['beaststeppe', 'irondeep', 'The Frost Pass', [33, 35]],
  ['verdant-citadel', 'irondeep', 'The Root Road', [34, 35]],
  ['skyreach', 'ashen-caldera', 'The Ash Road', [33, 35]],
  ['brasshaven', 'coral-crown', 'The Reef Road', [30, 35]],
  ['coral-crown', 'cloud-monastery', 'The Cloud Steps', [34, 35]],
  ['cloud-monastery', 'ashen-caldera', 'The Ember Stair', [33, 35]],
  ['ashen-caldera', 'starfall-archive', 'The Starfall Road', [34, 35]],
  ['starfall-archive', 'far-veil', 'The Veil Road', [35, 35]],
];

/** The id of a skeleton road's wild area. */
export const skeletonAreaId = (a, b) => `road-${a}-${b}`;

function skeletonRoad(a, b, name, levels) {
  const from = LOCATION_BY_ID[a];
  const to = LOCATION_BY_ID[b];
  const total = Math.max(2, Math.round(Math.hypot(to.x - from.x, to.y - from.y) / 8));
  return { id: skeletonAreaId(a, b), name, ends: [a, b], area: skeletonAreaId(a, b), legs: { [a]: Math.ceil(total / 2), [b]: Math.max(1, Math.floor(total / 2)) }, levels };
}

export const ROADS = [
  { id: 'old-road', name: 'The Old Road', ends: ['dunmere', null], area: 'old-road', legs: { dunmere: 1 }, gate: { storyDone: 'm2' }, lockedText: 'Nobody walks the Old Road alone. Hire a companion first (rent the hall, then find one at the Wayfarer).' },
  { id: 'thornwood-road', name: 'The Thornwood road', ends: ['dunmere', 'greenhollow'], area: 'thornwood-edge', legs: { dunmere: 2, greenhollow: 1 } },
  { id: 'iron-road', name: 'The Iron Road', ends: ['greenhollow', 'ironford'], area: 'iron-road', legs: { greenhollow: 2, ironford: 2 } },
  { id: 'cliff-road', name: 'The cliff road', ends: ['ironford', 'windmere'], area: 'cliff-road', legs: { ironford: 1, windmere: 2 } },
  // Windmere back to Dunmere along the coast: the loop Dunmere, Greenhollow, Ironford, Windmere.
  { id: 'coast-road', name: 'The coast road', ends: ['windmere', 'dunmere'], area: 'coast-road', legs: { dunmere: 1, windmere: 2 } },
  { id: 'blackwood-track', name: 'The Blackwood track', ends: ['dunmere', null], area: 'blackwood', legs: { dunmere: 1 } },
  // The rest of the world (the skeleton: box roads, src/data/wilds/skeletonRoads.js). `levels`: the
  // bands off the road; `legs` come from the map distance (about a day per 8 map units).
  ...WORLD_ROADS.map(([a, b, name, levels]) => skeletonRoad(a, b, name, levels)),
];

/** The road joining two places (either way round), or null. */
export function roadBetween(fromId, toId) {
  return ROADS.find((road) => road.ends.includes(fromId) && road.ends.includes(toId) && fromId !== toId) || null;
}

/** Every road out of a place. */
export function roadsFrom(placeId) {
  return ROADS.filter((road) => road.ends.includes(placeId));
}

/** The road that is a given wild area. */
export function roadForArea(areaId) {
  return ROADS.find((road) => road.area === areaId) || null;
}
