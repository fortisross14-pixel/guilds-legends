// Walkable towns. The four of Chapter 1 are built by hand (one file each); every other place
// is a box from src/data/towns/boxTown.js until its chapter is built. See src/explore/sceneMap.js
// for how a layout becomes a walkable map.
import dunmere from './dunmere.js';
import greenhollow from './greenhollow.js';
import ironford from './ironford.js';
import windmere from './windmere.js';
import { boxTown } from './boxTown.js';
import { LOCATIONS } from '../world.js';

const BUILT = { dunmere, greenhollow, ironford, windmere };

export const TOWNS = { ...Object.fromEntries(LOCATIONS.filter((location) => !BUILT[location.id]).map((location) => [location.id, boxTown(location)])), ...BUILT };

export function townFor(locationId) {
  return TOWNS[locationId] || null;
}
