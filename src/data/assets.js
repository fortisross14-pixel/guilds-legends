// Every visual asset the game asks for, by id. Paths are relative to public/.
// The loader (src/components/assetLoader.js) uses `path` when that file exists,
// then `borrow` (older shared art standing in), and otherwise draws a labelled,
// color-coded placeholder. Drop a file at `path` and it is used, no code change.
// Keep docs/ASSETS.md in sync when you add or change an entry.
import { TILES, TILE_SIZE } from './tiles.js';
import { TOWNS } from './towns/index.js';
import { WILD_AREA_LIST } from './wilds/index.js';
import { HALL_STAGES, ROOMS, roomInterior } from './rooms.js';
import { CHARTER_LIST } from './charters.js';
import { PATRON_LIST } from './patrons.js';

/** Placeholder colors per group (background, ink). */
export const ASSET_GROUPS = {
  bg: { label: 'Backdrop', fill: '#2f4a66', ink: '#d7e6f5' },
  battle: { label: 'Battle background', fill: '#6a2f34', ink: '#f6d8d2' },
  interior: { label: 'Interior', fill: '#6b4a24', ink: '#f6e3c2' },
  town: { label: 'Town (walkable)', fill: '#35593b', ink: '#d9f0d6' },
  building: { label: 'Building exterior', fill: '#5a4636', ink: '#f3e2cd' },
  room: { label: 'Room (walkable)', fill: '#4a3140', ink: '#f2d9e6' },
  prop: { label: 'Prop', fill: '#55602e', ink: '#eef3cf' },
  char: { label: 'Character sprite', fill: '#8a6a23', ink: '#fff1c7' },
  npc: { label: 'NPC sprite', fill: '#4f3d78', ink: '#e9defd' },
  ui: { label: 'Interface', fill: '#255a5a', ink: '#d2f3f0' },
  portrait: { label: 'Portrait', fill: '#6a4a5e', ink: '#fbe3f1' },
  enemy: { label: 'Enemy on the map', fill: '#7a3a22', ink: '#ffe0cc' },
  tileset: { label: 'Tileset', fill: '#3a3a3a', ink: '#ffffff' },
  fx: { label: 'Battle effect', fill: '#5a2a6a', ink: '#f6dcff' },
  crest: { label: 'Crest', fill: '#5c4a1e', ink: '#fff0c4' },
  battler: { label: 'Battle sprite', fill: '#6a3a1a', ink: '#ffe6cc' },
  missing: { label: 'Unregistered', fill: '#7a1f6e', ink: '#ffd6f6' },
};

const SCENE = { w: 1280, h: 576 };
const scene = (n) => `art/scenes/scene_${String(n).padStart(2, '0')}.png`;

const LIST = [
  // Full-screen backdrops behind React screens.
  { id: 'bg.title', group: 'bg', path: 'art/bg/title.png', borrow: scene(1), ...SCENE, use: 'Title screen' },
  { id: 'bg.chronicle', group: 'bg', path: 'art/bg/chronicle.png', borrow: scene(9), ...SCENE, use: 'Chronicle menu and its pages' },
  { id: 'bg.town.dunmere', group: 'bg', path: 'art/bg/town-dunmere.png', borrow: scene(7), ...SCENE, use: 'Dunmere town directory (fallback menu)' },
  { id: 'bg.town.greenhollow', group: 'bg', path: 'art/bg/town-greenhollow.png', borrow: scene(7), ...SCENE, use: 'Greenhollow town directory' },
  { id: 'bg.town.ironford', group: 'bg', path: 'art/bg/town-ironford.png', borrow: scene(7), ...SCENE, use: 'Ironford town directory' },
  { id: 'bg.town.default', group: 'bg', path: 'art/bg/town-default.png', borrow: scene(7), ...SCENE, use: 'Any other town directory' },

  // Building interiors (art-backed menu scenes).
  // The Guild Hall grows in four stages (src/data/rooms.js): exterior in walkable Dunmere, interior behind the hall screen.
  ...HALL_STAGES.flatMap((stage) => [
    { id: stage.exterior, group: 'building', path: `art/walk/buildings/dunmere-guildhall-stage${stage.id}.png`, w: 160, h: 160, use: `Dunmere: the Guild Hall building, stage ${stage.id} (${stage.name})` },
    { id: stage.interior, group: 'interior', path: `art/interiors/guildhall-stage${stage.id}.png`, borrow: stage.id === 1 ? scene(8) : scene(9), ...SCENE, use: `Guild Hall interior, stage ${stage.id} (${stage.name})` },
  ]),
  // Every built room has its own interior per level.
  ...ROOMS.flatMap((room) =>
    room.levels.map((_, index) => ({ id: roomInterior(room.id, index + 1), group: 'interior', path: `art/interiors/rooms/${room.id}-${index + 1}.png`, ...SCENE, use: `${room.name}, level ${index + 1}` })),
  ),
  { id: 'interior.tavern', group: 'interior', path: 'art/interiors/tavern.png', borrow: scene(8), ...SCENE, use: 'Tavern (recruits)' },
  { id: 'interior.shop', group: 'interior', path: 'art/interiors/shop.png', borrow: scene(1), ...SCENE, use: 'Shop' },
  { id: 'interior.arena', group: 'interior', path: 'art/interiors/arena.png', borrow: scene(2), ...SCENE, use: 'Arena (tournaments)' },
  { id: 'interior.herald', group: 'interior', path: 'art/interiors/herald.png', borrow: scene(3), ...SCENE, use: 'Herald (rankings)' },
  { id: 'interior.noticeboard', group: 'interior', path: 'art/interiors/noticeboard.png', borrow: scene(10), ...SCENE, use: 'Notice Board (contracts)' },

  // Battle backgrounds. Area ones are new; primal ones borrow the old scenes.
  { id: 'bg.battle.oldroad', group: 'battle', path: 'art/battle/oldroad.png', ...SCENE, use: 'Battles on the Old Road' },
  { id: 'bg.battle.thornwood', group: 'battle', path: 'art/battle/thornwood.png', ...SCENE, use: 'Battles at the Thornwood edge' },
  { id: 'bg.battle.blackwood', group: 'battle', path: 'art/battle/blackwood.png', ...SCENE, use: 'Battles in the Blackwood' },
  { id: 'bg.battle.arena', group: 'battle', path: 'art/battle/arena.png', borrow: scene(2), ...SCENE, use: 'Tournaments, duels, challenges' },
  { id: 'bg.battle.fire', group: 'battle', path: 'art/battle/fire.png', borrow: scene(12), ...SCENE, use: 'Battles in Fire lands' },
  { id: 'bg.battle.plant', group: 'battle', path: 'art/battle/plant.png', borrow: scene(11), ...SCENE, use: 'Battles in Plant lands' },
  { id: 'bg.battle.water', group: 'battle', path: 'art/battle/water.png', borrow: scene(4), ...SCENE, use: 'Battles in Water lands' },
  { id: 'bg.battle.air', group: 'battle', path: 'art/battle/air.png', borrow: scene(5), ...SCENE, use: 'Battles in Air lands' },
  { id: 'bg.battle.animal', group: 'battle', path: 'art/battle/animal.png', borrow: scene(11), ...SCENE, use: 'Battles in Animal lands' },
  { id: 'bg.battle.psychic', group: 'battle', path: 'art/battle/psychic.png', borrow: scene(6), ...SCENE, use: 'Battles in Psychic lands' },
  { id: 'bg.battle.iron', group: 'battle', path: 'art/battle/iron.png', borrow: scene(12), ...SCENE, use: 'Battles in Iron lands' },

  // The opening room ("The Fallen Banner"), walkable.
  { id: 'room.opening.floor', group: 'room', path: 'art/walk/opening/floor.png', w: 960, h: 540, use: 'Opening room: floor and walls' },
  { id: 'prop.opening.table', group: 'prop', path: 'art/walk/opening/table.png', w: 224, h: 40, use: 'Opening room: table (top left)' },
  { id: 'prop.opening.shelf', group: 'prop', path: 'art/walk/opening/shelf.png', w: 218, h: 40, use: 'Opening room: shelf (top right)' },
  { id: 'prop.opening.bench', group: 'prop', path: 'art/walk/opening/bench.png', w: 255, h: 36, use: 'Opening room: bench (bottom left)' },
  { id: 'prop.opening.chest', group: 'prop', path: 'art/walk/opening/chest.png', w: 110, h: 44, use: 'Opening room: chest (bottom right)' },
  { id: 'prop.opening.door', group: 'prop', path: 'art/walk/opening/door.png', w: 32, h: 92, use: 'Opening room: door to Dunmere' },
  { id: 'npc.opening.stranger', group: 'npc', path: 'art/walk/opening/stranger.png', w: 44, h: 28, use: 'Opening room: wounded stranger, lying down' },

  // Walkable towns and wild areas: shared pieces. Buildings, NPCs, portraits,
  // props and enemy groups are generated from the town and area data below.
  { id: 'tiles.ground', group: 'tileset', path: 'art/walk/tiles/ground.png', w: TILES.length * TILE_SIZE, h: TILE_SIZE, tiles: TILES, use: 'Ground tiles for towns and wild areas, one row of 32 px tiles in src/data/tiles.js order' },
  { id: 'char.founder', group: 'char', path: 'art/walk/chars/founder.png', w: 26, h: 36, use: 'Player founder, walking (4-direction sheet later)' },
  { id: 'portrait.poi', group: 'portrait', path: 'art/portraits/npcs/poi.png', w: 160, h: 160, use: 'Dialogue portrait for places and objects (fountain, statue, wells…)' },
  { id: 'prop.campfire', group: 'prop', path: 'art/walk/props/campfire.png', w: 64, h: 64, use: 'Wild-area camp: rest spot' },
  { id: 'prop.signpost', group: 'prop', path: 'art/walk/props/signpost.png', w: 32, h: 48, use: 'Exit from a town or wild area' },
  { id: 'prop.gather.herb', group: 'prop', path: 'art/walk/props/gather-herb.png', w: 28, h: 28, use: 'Gathering spot: herbs' },
  { id: 'prop.gather.ore', group: 'prop', path: 'art/walk/props/gather-ore.png', w: 28, h: 28, use: 'Gathering spot: ore and shards' },
  { id: 'prop.gather.coin', group: 'prop', path: 'art/walk/props/gather-coin.png', w: 28, h: 28, use: 'Gathering spot: coin pouches' },

  // Battle effects (played over a target). Each borrows the closest existing effect until its own file exists.
  ...[
    ['slash', 14, 'Physical hit: slash'],
    ['pierce', 7, 'Physical hit: arrows, daggers'],
    ['fire', 1, 'Fire spells, burn ticks, bombs'],
    ['ice', 2, 'Water spells (ice)'],
    ['lightning', 6, 'Air, Iron and other spells (lightning)'],
    ['heal', 8, 'Heals, revives, regen ticks'],
    ['buff', 9, 'Buffs, guard, taunt'],
    ['debuff', 13, 'Debuffs, stuns, charging'],
    ['poison', 11, 'Poison ticks'],
  ].map(([id, n, use]) => ({ id: `fx.${id}`, group: 'fx', path: `art/fx/${id}.png`, borrow: `art/effects/effect_${String(n).padStart(2, '0')}.png`, w: 152, h: 130, use })),
  // Enemy battle sprites (the turn order bar uses them too).
  ...Array.from({ length: 16 }, (_, index) => {
    const n = String(index + 1).padStart(2, '0');
    return { id: `battle.enemy_${n}`, group: 'battler', path: `art/enemies/enemy_${n}.png`, w: 320, h: 288, use: `Enemy battle sprite ${n} (see src/data/enemies.js rosters)` };
  }),

  // Identity (Phase 4): founding charter crests and patron crests. Patron representatives
  // use their town NPC portraits (portrait.dunmere.merchant, portrait.greenhollow.cleric, portrait.ironford.foreman).
  ...CHARTER_LIST.map((charter) => ({ id: charter.crest, group: 'crest', path: `art/crests/charter-${charter.id}.png`, w: 128, h: 128, use: `Charter crest: ${charter.name} (new game, top bar, Herald)` })),
  ...PATRON_LIST.map((patron) => ({ id: patron.crest, group: 'crest', path: `art/crests/patron-${patron.id}.png`, w: 128, h: 128, use: `Patron crest: ${patron.name} (Connections)` })),

  // Arenas and inns (Phase 6a): one arena interior per slice town, the shared referee and
  // registrar NPCs, and inn interiors for the towns away from home (Dunmere's is the Wayfarer tavern).
  ...['dunmere', 'greenhollow', 'ironford', 'windmere'].map((town) => ({ id: `interior.arena.${town}`, group: 'interior', path: `art/interiors/arena-${town}.png`, borrow: scene(2), ...SCENE, use: `Arena interior in ${town[0].toUpperCase()}${town.slice(1)}: fighting ground, sign-up desk, history board` })),
  ...['greenhollow', 'ironford', 'windmere'].map((town) => ({ id: `interior.inn.${town}`, group: 'interior', path: `art/interiors/inn-${town}.png`, borrow: scene(8), ...SCENE, use: `Inn in ${town[0].toUpperCase()}${town.slice(1)} (rest 1–3 nights, recruits)` })),
  { id: 'portrait.arena.referee', group: 'portrait', path: 'art/portraits/npcs/arena-referee.png', w: 160, h: 160, use: 'Arena referee at the fighting ground (starts bouts)' },
  { id: 'portrait.arena.registrar', group: 'portrait', path: 'art/portraits/npcs/arena-registrar.png', w: 160, h: 160, use: 'Arena registrar at the sign-up desk' },
  { id: 'bg.town.windmere', group: 'bg', path: 'art/bg/town-windmere.png', borrow: scene(7), ...SCENE, use: 'Windmere town directory (no walkable layout yet)' },

  // History (Phase 5): the season review backdrop, award badges and record-book trophies.
  { id: 'bg.season.review', group: 'bg', path: 'art/bg/season-review.png', borrow: scene(9), ...SCENE, use: 'Season review cards (end of each year, re-opened from the record book)' },
  ...[
    ['award.mvp', 'MVP of the season (review, career tab, hall of fame)'],
    ['award.rookie', 'Rookie of the year'],
    ['award.signing', 'Best signing of the year'],
    ['trophy.title', 'Tournament title (season review, record book)'],
    ['trophy.record', 'Record broken (moment, record book)'],
    ['trophy.hall', 'Hall of fame plaque'],
  ].map(([id, use]) => ({ id, group: 'ui', path: `art/awards/${id.replace('.', '-')}.png`, w: 64, h: 64, use })),

  // Interface art.
  { id: 'ui.overworld', group: 'ui', path: 'ui/overworld.png', w: 200, h: 125, use: 'World map terrain' },
];

// Generated from the town and wild-area data, so every placed thing has an entry.
const slug = (id) => id.split('.').slice(1).join('-');
function add(entry) {
  if (!LIST.some((asset) => asset.id === entry.id)) LIST.push(entry);
}
Object.values(TOWNS).forEach((town) => {
  town.buildings.forEach((building) =>
    add({ id: building.asset, group: 'building', path: `art/walk/buildings/${slug(building.asset)}.png`, w: 5 * TILE_SIZE, h: 5 * TILE_SIZE, use: `${town.name}: ${building.label} (front with door)` }),
  );
  town.npcs.forEach((npc) => {
    add({ id: `npc.${town.id}.${npc.id}`, group: 'npc', path: `art/walk/npcs/${town.id}-${npc.id}.png`, w: 26, h: 36, use: `${town.name}: ${npc.name}, ${npc.role} (walk sprite)` });
    add({ id: `portrait.${town.id}.${npc.id}`, group: 'portrait', path: `art/portraits/npcs/${town.id}-${npc.id}.png`, w: 160, h: 160, use: `${town.name}: ${npc.name}, ${npc.role} (dialogue portrait)` });
  });
});
[...Object.values(TOWNS), ...WILD_AREA_LIST].forEach((place) => {
  (place.props || []).forEach((prop) =>
    add({ id: prop.asset, group: 'prop', path: `art/walk/props/${slug(prop.asset)}.png`, w: prop.size[0] * TILE_SIZE, h: (prop.size[1] + 1) * TILE_SIZE, use: `${place.name}: ${prop.poi?.name || prop.id}` }),
  );
});
WILD_AREA_LIST.forEach((area) => {
  area.enemies.forEach((group) =>
    add({ id: group.asset, group: 'enemy', path: `art/walk/enemies/${slug(group.asset)}.png`, w: 56, h: 44, use: `${area.name}: ${group.name} (standing on the map)` }),
  );
  if (area.boss) add({ id: area.boss.asset, group: 'enemy', path: `art/walk/enemies/${slug(area.boss.asset)}.png`, w: 80, h: 64, use: `${area.name}: ${area.boss.boss.name} (boss on the map)` });
});

export const ASSETS = Object.fromEntries(LIST.map((asset) => [asset.id, asset]));

/** The registry entry for an id; unknown ids get a loud "missing" placeholder entry. */
export function assetFor(id) {
  return ASSETS[id] || { id, group: 'missing', path: null, w: 640, h: 288, use: 'Not in src/data/assets.js' };
}

/** First registered id from a list (used for fallbacks like town → default). */
export function firstAsset(...ids) {
  return ids.find((id) => ASSETS[id]) || ids[ids.length - 1];
}
