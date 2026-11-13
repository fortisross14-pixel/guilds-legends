// Walkable wild areas: the Chapter 1 roads and woods, then the rest of the world's roads (boxes). Each is reached from its hub town, either
// through the town's exit or from the world map.
import oldRoad from './oldRoad.js';
import thornwood from './thornwood.js';
import blackwood from './blackwood.js';
import { cliffRoad, coastRoad, ironRoad } from './chapter2Roads.js';
import { SKELETON_ROADS } from './skeletonRoads.js';

export const WILD_AREAS = {
  [oldRoad.id]: oldRoad,
  [thornwood.id]: thornwood,
  [blackwood.id]: blackwood,
  [ironRoad.id]: ironRoad,
  [cliffRoad.id]: cliffRoad,
  [coastRoad.id]: coastRoad,
  ...Object.fromEntries(SKELETON_ROADS.map((area) => [area.id, area])),
};
export const WILD_AREA_LIST = Object.values(WILD_AREAS);

/** Weeks before a defeated group or used gathering spot comes back. */
export const WILD_RESPAWN = { enemies: 6, gathers: 4 };

/**
 * The ends of a wild area: each { town, at, size, name, arrive } is an exit to that
 * town and where you arrive coming from it. A road (src/data/roads.js) has two ends;
 * a dead end (the Old Road, ending at Dawnwatch Temple) has one.
 */
export function areaLinks(area) {
  if (!area) return [];
  return area.links || [{ town: area.hub, at: area.exit.at, size: area.exit.size, name: area.exit.name, arrive: area.arrive }];
}

/** Every enemy group of an area, the bosses last (`boss`, then any in `bosses`). */
export function areaGroups(area) {
  if (!area) return [];
  const bosses = [...(area.boss ? [area.boss] : []), ...(area.bosses || [])];
  return [...area.enemies, ...bosses.map((boss) => ({ ...boss, isBoss: true }))];
}

/**
 * Off the road, bands of an area's `ambushes` jump the party (like wild encounters):
 * the walk engine counts steps off the road and the engine picks who attacks.
 * Ambush groups have ids `ambush:<id>`; they never stay cleared.
 */
export function findWildGroup(area, groupId) {
  if (!area) return null;
  if (String(groupId).startsWith('ambush:')) {
    const found = (area.ambushes || []).find((item) => `ambush:${item.id}` === groupId);
    return found ? { ...found, id: groupId, ambush: true } : null;
  }
  return areaGroups(area).find((item) => item.id === groupId) || null;
}

/** A wild area's buildings that open as interiors (Dawnwatch Temple on the Old Road), for its hub town. */
export function wildBuildings(hubId) {
  return WILD_AREA_LIST.filter((area) => area.hub === hubId).flatMap((area) => (area.buildings || []).map((building) => ({ ...building, areaId: area.id })));
}
