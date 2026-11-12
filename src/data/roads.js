// The road network (Chapter 1). The world is not walked end to end: places are
// joined by roads. A road with an `area` is a walkable wild area (src/data/wilds):
// leave a town by that road's gate and you are on it; walk it to its far end and
// you arrive at the place there. A road without one is travelled from the world
// map, in days. Either way you can only go to a place a road reaches.
// `gate`: a condition (src/data/dialogue/index.js) that must hold to take the road
// (story progress); `lockedText` says why it is closed.

export const ROADS = [
  { id: 'old-road', name: 'The Old Road', ends: ['dunmere', null], area: 'old-road', gate: { storyDone: 'm2' }, lockedText: 'Nobody walks the Old Road alone. Hire a companion first (rent the hall, then find one at the Wayfarer).' },
  { id: 'thornwood-road', name: 'The Thornwood road', ends: ['dunmere', 'greenhollow'], area: 'thornwood-edge', gate: { storyDone: 'temple' }, lockedText: 'The Greenhollow wardens keep the Thornwood road shut to unknown banners. Bring down the Ash Abbot at Dawnwatch Temple first.' },
  { id: 'iron-road', name: 'The Iron Road', ends: ['greenhollow', 'ironford'], days: 2 },
  { id: 'cliff-road', name: 'The cliff road', ends: ['ironford', 'windmere'], days: 2 },
  // Windmere back to Dunmere along the coast: the loop Dunmere, Greenhollow, Ironford, Windmere.
  { id: 'coast-road', name: 'The coast road', ends: ['windmere', 'dunmere'], days: 3, gate: { storyDone: 'temple' }, lockedText: 'The coast road waits on the same wardens as the Thornwood road. Bring down the Ash Abbot first.' },
  // Ironford's third road, east to Mooncourt: Chapter 2 (Champion status).
  { id: 'moon-road', name: 'The Moon Road', ends: ['ironford', 'mooncourt'], days: 4, gate: { chapterAtLeast: 2 }, lockedText: 'The Moon Road to Mooncourt opens in Chapter 2.' },
  { id: 'blackwood-track', name: 'The Blackwood track', ends: ['dunmere', null], area: 'blackwood' },
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
