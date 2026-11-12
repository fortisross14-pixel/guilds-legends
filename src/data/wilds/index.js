// Walkable wild areas (Chapter 1). Each is reached from its hub town, either
// through the town's exit or from the world map.
import oldRoad from './oldRoad.js';
import thornwood from './thornwood.js';
import blackwood from './blackwood.js';

export const WILD_AREAS = { [oldRoad.id]: oldRoad, [thornwood.id]: thornwood, [blackwood.id]: blackwood };
export const WILD_AREA_LIST = Object.values(WILD_AREAS);

/** Weeks before a defeated group or used gathering spot comes back. */
export const WILD_RESPAWN = { enemies: 6, gathers: 4 };

/** Every enemy group of an area, the bosses last (`boss`, then any in `bosses`). */
export function areaGroups(area) {
  if (!area) return [];
  const bosses = [...(area.boss ? [area.boss] : []), ...(area.bosses || [])];
  return [...area.enemies, ...bosses.map((boss) => ({ ...boss, isBoss: true }))];
}

/** A wild area's buildings that open as interiors (Dawnwatch Temple on the Old Road), for its hub town. */
export function wildBuildings(hubId) {
  return WILD_AREA_LIST.filter((area) => area.hub === hubId).flatMap((area) => (area.buildings || []).map((building) => ({ ...building, areaId: area.id })));
}
