// Walkable towns (Chapter 1). One file per town; see src/explore/sceneMap.js
// for how a layout becomes a walkable map.
import dunmere from './dunmere.js';
import greenhollow from './greenhollow.js';
import ironford from './ironford.js';

export const TOWNS = { dunmere, greenhollow, ironford };

export function townFor(locationId) {
  return TOWNS[locationId] || null;
}
