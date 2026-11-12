// Chapter 1 vertical slice (docs/PROJECT_PLAN.md). Everything outside it stays
// in the code but is hidden from the player. Set `enabled: false` to see it all.

export const SLICE = {
  enabled: true,
  chapter: 1,
  // Travel destinations on the world map.
  locations: ['dunmere', 'greenhollow', 'ironford', 'windmere'],
  // Walkable wild areas, built in Phase 1. Listed here so later phases share one source.
  wildAreas: ['old-road', 'thornwood-edge', 'blackwood', 'iron-road', 'cliff-road', 'coast-road'],
  // Highest guild tier with content in the slice (0 = Regional).
  maxTier: 0,
  // Systems kept in code but not surfaced in Chapter 1.
  hiddenSystems: ['branches', 'succession', 'mentorship', 'artifactCustody', 'sagas', 'nationalGlobal'],
};

export const BEYOND_TEASER = {
  title: 'Beyond the known roads',
  text: 'Stories reach Dunmere from places past the edge of the map. They wait for a later chapter of your guild.',
};

/** True when the slice hides this system. */
export function sliceHides(system) {
  return SLICE.enabled && SLICE.hiddenSystems.includes(system);
}

/** True when a location can be reached in this build. */
export function inSlice(locationId) {
  return !SLICE.enabled || SLICE.locations.includes(locationId);
}

/** Caps a tier index at the slice's highest tier. */
export function sliceTier(tierIndex) {
  return SLICE.enabled ? Math.min(tierIndex, SLICE.maxTier) : tierIndex;
}
