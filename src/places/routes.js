// Where each destination lives. Screens still call navigate('missions') etc.;
// these ids map onto the three places: the world map, the current town
// (building + optional tab) and the menu (page + optional tab).
export const ROUTES = {
  map: { view: 'map' },
  world: { view: 'map' },
  town: { view: 'town' },
  hall: { view: 'town', building: 'guildHall', tab: 'overview' },
  heroes: { view: 'town', building: 'guildHall', tab: 'roster' },
  headquarters: { view: 'town', building: 'guildHall', tab: 'headquarters' },
  tavern: { view: 'town', building: 'tavern' },
  missions: { view: 'town', building: 'noticeBoard' },
  tournaments: { view: 'town', building: 'arena' },
  shop: { view: 'town', building: 'shop' },
  rankings: { view: 'town', building: 'herald' },
  menu: { view: 'menu' },
  settings: { view: 'menu', page: 'settings' },
  chronicle: { view: 'menu', page: 'chronicle' },
  codex: { view: 'menu', page: 'codex', tab: 'goals' },
  goals: { view: 'menu', page: 'codex', tab: 'goals' },
  legacy: { view: 'menu', page: 'codex', tab: 'legacy' },
};

export function resolveRoute(target) {
  if (target && typeof target === 'object') return target;
  return ROUTES[target] || ROUTES.map;
}
