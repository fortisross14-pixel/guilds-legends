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

export const ROADS = [
  { id: 'old-road', name: 'The Old Road', ends: ['dunmere', null], area: 'old-road', legs: { dunmere: 1 }, gate: { storyDone: 'm2' }, lockedText: 'Nobody walks the Old Road alone. Hire a companion first (rent the hall, then find one at the Wayfarer).' },
  { id: 'thornwood-road', name: 'The Thornwood road', ends: ['dunmere', 'greenhollow'], area: 'thornwood-edge', legs: { dunmere: 2, greenhollow: 1 }, gate: { storyDone: 'c1-prior' }, lockedText: 'The Greenhollow wardens keep the Thornwood road shut to unknown banners. See Mother Aveline’s prayer book at Dawnwatch Temple first.' },
  { id: 'iron-road', name: 'The Iron Road', ends: ['greenhollow', 'ironford'], area: 'iron-road', legs: { greenhollow: 2, ironford: 2 } },
  { id: 'cliff-road', name: 'The cliff road', ends: ['ironford', 'windmere'], area: 'cliff-road', legs: { ironford: 1, windmere: 2 } },
  // Windmere back to Dunmere along the coast: the loop Dunmere, Greenhollow, Ironford, Windmere.
  { id: 'coast-road', name: 'The coast road', ends: ['windmere', 'dunmere'], area: 'coast-road', legs: { dunmere: 1, windmere: 2 }, gate: { storyDone: 'c1-prior' }, lockedText: 'The coast road waits on the same wardens as the Thornwood road. See Mother Aveline’s prayer book first.' },
  // Ironford's third road, east to Mooncourt: Chapter 2 (Champion status).
  { id: 'moon-road', name: 'The Moon Road', ends: ['ironford', 'mooncourt'], days: 4, gate: { chapterAtLeast: 3 }, lockedText: 'The Moon Road to Mooncourt opens in Chapter 3.' },
  { id: 'blackwood-track', name: 'The Blackwood track', ends: ['dunmere', null], area: 'blackwood', legs: { dunmere: 1 } },
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
