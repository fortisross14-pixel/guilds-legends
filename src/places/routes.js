// Where each destination lives. Screens still call navigate('missions') etc.
// A route is either a place (the walkable scene or the world map) or a section
// (a screen in the one template, opened over the place; src/hud/sections.jsx).
export const ROUTES = {
  map: { view: 'map' },
  world: { view: 'map' },
  town: { view: 'scene' },
  hall: { section: 'hall', tab: null },
  rest: { section: 'hall', tab: 'rest' },
  headquarters: { section: 'hall', tab: 'office' },
  treasury: { section: 'guild', tab: 'finances' },
  finances: { section: 'guild', tab: 'finances' },
  guild: { section: 'guild', tab: 'charter' },
  warRoom: { section: 'party', tab: 'main' },
  heroes: { section: 'party', tab: 'roster' },
  equipment: { section: 'items' },
  items: { section: 'items' },
  // Buildings with an interior are walked into (people.js, src/data/interiors.js).
  tavern: { view: 'interior', building: 'tavern' },
  shop: { view: 'interior', building: 'shop' },
  tournaments: { view: 'interior', building: 'arena' },
  arena: { view: 'interior', building: 'arena' },
  herald: { view: 'interior', building: 'herald' },
  inn: { section: 'inn' },
  missions: { section: 'noticeBoard' },
  rankings: { section: 'records', tab: 'rankings' },
  reputation: { section: 'guild', tab: 'reputation' },
  patrons: { section: 'guild', tab: 'patrons' },
  rivals: { section: 'guild', tab: 'rivals' },
  menu: { section: 'system', tab: 'game' },
  settings: { section: 'system', tab: 'settings' },
  chronicle: { section: 'records', tab: 'codex', view: 'almanac' },
  journal: { section: 'journal', tab: 'now' },
  now: { section: 'journal', tab: 'now' },
  news: { section: 'journal', tab: 'now' },
  calendar: { section: 'journal', tab: 'calendar' },
  quests: { section: 'journal', tab: 'quests' },
  contracts: { section: 'journal', tab: 'contracts' },
  contacts: { section: 'contacts' },
  codex: { section: 'records', tab: 'codex' },
  lore: { section: 'records', tab: 'codex', view: 'lore' },
  legacy: { section: 'guild', tab: 'charter' },
};

/** A route from an id or an object. Old place objects ({ view: 'town', building }) still work. */
export function resolveRoute(target) {
  if (target && typeof target === 'object') {
    if (target.section) return target;
    // A building's inside (the house, the temple…) goes straight there.
    if (target.view === 'interior' && target.building) return target;
    if (target.building) return ROUTES[{ noticeBoard: 'missions', guildHall: 'hall' }[target.building] || target.building] || { section: target.building, tab: target.tab || null };
    if (target.view === 'town') return { view: 'scene' };
    if (target.view === 'menu') return ROUTES[target.page] || ROUTES.menu;
    return target;
  }
  return ROUTES[target] || ROUTES.map;
}
