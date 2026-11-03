// Small, data-driven town briefs for the exploration layer. Dunmere has a
// bespoke walkable scene today; these definitions give every settlement a
// readable identity and a common layout contract for future walkable scenes.

const REGIONAL_LAYOUTS = {
  dunmere: {
    landmark: 'Kiln Square',
    summary: 'A stone market square threaded by kiln smoke, old banners and a busy road gate.',
    districts: ['Banner Row', 'Kiln Square', 'Old Road Gate'],
  },
  greenhollow: {
    landmark: 'The Elder Road',
    summary: 'Footbridges, herb stalls and living root-halls gather around the oldest road in the Marches.',
    districts: ['Root Market', 'Warden Grove', 'Elder Road'],
  },
  ironford: {
    landmark: 'The Foundry Bridge',
    summary: 'Shift bells, river barges and forge-light make the bridge district loud long after dark.',
    districts: ['Foundry Bridge', 'Caravan Yard', 'River Gate'],
  },
  windmere: {
    landmark: 'The Cliff Steps',
    summary: 'A compact hillside village of courier lofts and wind-worn dueling terraces.',
    districts: ['Courier Yard', 'Cliff Steps', 'Duel Terrace'],
  },
};

const TIER_TEMPLATES = {
  Regional: { landmark: 'Town Square', summary: 'A close-knit settlement where the guild can learn its roads by walking them.', districts: ['Market', 'Guild Quarter', 'Road Gate'] },
  National: { landmark: 'Civic Quarter', summary: 'A busy regional capital with several routes through its guild district.', districts: ['Guild Quarter', 'Trade Ward', 'City Gate'] },
  Global: { landmark: 'Concourse', summary: 'A far-reaching city whose districts open as the guild earns its way through them.', districts: ['Concourse', 'Embassy Ward', 'Harbor Gate'] },
};

/**
 * Normalized town layout data. `buildings` is supplied by world.js so a future
 * walker can place only the institutions that actually exist in this town.
 */
export function townLayoutFor(location, buildings) {
  const brief = REGIONAL_LAYOUTS[location.id] || TIER_TEMPLATES[location.tier] || TIER_TEMPLATES.Regional;
  return {
    ...brief,
    id: location.id,
    spawnDistrict: brief.districts[0],
    buildings: buildings.map((buildingId, index) => ({ buildingId, district: brief.districts[index % brief.districts.length] })),
  };
}
