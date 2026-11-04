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
  treasury: { section: 'hall', tab: 'treasury' },
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
  reputation: { section: 'records', tab: 'rankings', view: 'reputation' },
  menu: { section: 'system', tab: 'game' },
  settings: { section: 'system', tab: 'settings' },
  chronicle: { section: 'records', tab: 'almanac' },
  calendar: { section: 'calendar', tab: 'calendar' },
  news: { section: 'calendar', tab: 'news' },
  quests: { section: 'quests', tab: 'main' },
  contacts: { section: 'contacts' },
  codex: { section: 'records', tab: 'goals' },
  goals: { section: 'records', tab: 'goals' },
  legacy: { section: 'records', tab: 'goals' },
  lore: { section: 'records', tab: 'lore' },
};

/** A route from an id or an object. Old place objects ({ view: 'town', building }) still work. */
export function resolveRoute(target) {
  if (target && typeof target === 'object') {
    if (target.section) return target;
    if (target.building) return ROUTES[target.building === 'noticeBoard' ? 'missions' : target.building] || { section: target.building, tab: target.tab || null };
    if (target.view === 'town') return { view: 'scene' };
    if (target.view === 'menu') return ROUTES[target.page] || ROUTES.menu;
    return target;
  }
  return ROUTES[target] || ROUTES.map;
}
