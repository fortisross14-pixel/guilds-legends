// Every visual asset the game asks for, by id. Paths are relative to public/.
// The loader (src/components/assetLoader.js) uses `path` when that file exists,
// then `borrow` (older shared art standing in), and otherwise draws a labelled,
// color-coded placeholder. Drop a file at `path` and it is used, no code change.
// Keep docs/ASSETS.md in sync when you add or change an entry.
import { TILES, TILE_SIZE } from './tiles.js';
import { TOWNS } from './towns/index.js';
import { WILD_AREA_LIST } from './wilds/index.js';
import { EQUIPMENT, HALL_EXTERIOR, LOT_DIORAMA, ROOMS, TIER_NAMES, equipmentArt, roomTileArt } from './rooms.js';
import { CHARTER_LIST } from './charters.js';
import { PATRON_LIST } from './patrons.js';
import { REGULARS } from './people.js';
import { CLASSES } from './content.js';

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
  // The Guild Hall (docs/specs/guild-hall-rooms.md): one exterior in walkable Dunmere,
  // and inside, the lot diorama with a tile per room type and tier.
  { id: HALL_EXTERIOR, group: 'building', path: 'art/walk/buildings/dunmere-guildhall-stage1.png', w: 160, h: 160, use: 'Dunmere: the Guild Hall building on its lot' },
  { id: LOT_DIORAMA, group: 'interior', path: 'art/hall/lot.png', borrow: 'art/interiors/guildhall-stage1.png', w: 1080, h: 1080, use: 'Guild Hall: the lot seen from above (the cabin, the slots, the yard)' },
  ...ROOMS.flatMap((room) =>
    TIER_NAMES.map((tierName, index) => ({ id: roomTileArt(room.id, index + 1), group: 'prop', path: `art/hall/rooms/${room.id}-${index + 1}.png`, w: 256, h: 256, use: `Guild Hall slot tile: ${room.name}, ${tierName}` })),
  ),
  ...EQUIPMENT.flatMap((piece) =>
    TIER_NAMES.map((tierName, index) => ({ id: equipmentArt(piece.id, index + 1), group: 'prop', path: `art/hall/equipment/${piece.id}-${index + 1}.png`, w: 128, h: 128, use: `Training equipment: ${piece.name} (${piece.stat}), ${tierName}` })),
  ),
  { id: 'hall.crown.case', group: 'prop', path: 'art/hall/crown-case.png', w: 128, h: 128, use: 'Crown Room: a trophy case (one per trophy, with its count)' },
  { id: 'hall.pose.patient', group: 'char', path: 'art/hall/pose-patient.png', w: 96, h: 96, use: 'Guild Hall: a hero lying in an infirmary bed (silhouette)' },
  { id: 'hall.pose.sleeping', group: 'char', path: 'art/hall/pose-sleeping.png', w: 96, h: 96, use: 'Guild Hall: a hero asleep in a bedroom (silhouette)' },
  { id: 'hall.pose.training', group: 'char', path: 'art/hall/pose-training.png', w: 96, h: 96, use: 'Guild Hall: a hero at the training equipment (silhouette)' },
  { id: 'scene.defeat', group: 'interior', path: 'art/scenes/defeat.png', ...SCENE, use: 'Defeat: the party wakes in the infirmary (or the founder’s house)' },
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

  // The player's house in Dunmere (the prologue, "The knock at the door"), walkable.
  { id: 'interior.house', group: 'interior', path: 'art/interiors/house.png', w: 1280, h: 576, use: 'Player’s house (prologue): a small room at night, the hearth, the table, the one bed, the front door on the right wall (a painted scene; a mood gradient until drawn)' },
  { id: 'npc.house.rook', group: 'npc', path: 'art/walk/house/rook.png', w: 88, h: 56, use: 'Player’s house: Cassian Rook, wounded, on the floor' },

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

  // The Last Banner (Phase 6b): story portraits, the Argent Crown crest, the banner relic, story backdrops.
  ...[
    ['founder', 'You, the founder, in dialogue (the class sprite stands in later)'],
    ['rook', 'Lord Cassian Rook: battered armor, silver insignia, dying (prologue)'],
    ['thorne', 'Garrick Thorne: guildmaster of the Argent Crown, charming and cold'],
    ['mara', 'Mara Fen: keeper of the Wayfarer, practical and funny'],
    ['nessa', 'Nessa Thornfield: young Ranger, hunter and guide'],
    ['bram', 'Bram Calder: proud Duelist from Dunmere'],
    ['wren', 'Wren: the Broken Lantern’s last scout, living as “Linnet”'],
    ['herbalist', 'Maren Bell: retired herbalist of Greenhollow'],
    ['quartermaster', 'Oswin Tull: former Argent Crown quartermaster, now an archive keeper in Ironford'],
    ['champion', 'Halden Marsh: aging Windmere champion'],
    ['representative', 'The Argent Crown’s well-dressed representative'],
    ['stablemaster', 'Gideon Rusk: owner of the old stable on Banner Plaza'],
  ].map(([id, use]) => ({ id: `portrait.story.${id}`, group: 'portrait', path: `art/portraits/story/${id}.png`, w: 160, h: 160, use })),
  { id: 'crest.argent-crown', group: 'crest', path: 'art/crests/argent-crown.png', w: 128, h: 128, use: 'The Argent Crown’s emblem (scratched into the door, Herald, rival pages)' },
  { id: 'relic.banner', group: 'ui', path: 'art/relics/last-banner.png', w: 120, h: 160, use: 'The Last Banner: torn, bloodstained, a golden lantern (naming card, Trophy hall, Lore codex)' },
  ...[
    ['house', 'Prologue: the player’s house at night, rain and firelight'],
    ['warning', 'Act I ending: outside the Dunmere arena after the Harvest Melee'],
    ['greenhollow', 'Act II: Maren Bell’s herb room in Greenhollow'],
    ['archive', 'Act II: the Ironford archive vault'],
    ['windmere', 'Act II: the cliffside ring at Windmere'],
    ['thornwood', 'Act II: the trapper’s hut at the Thornwood edge (Wren)'],
    ['banner', 'Chapter 1 ending: the Guild Hall, Wren facing the banner'],
    ['chapter', 'Chapter summary and the Chapter 2 teaser'],
  ].map(([id, use]) => ({ id: `bg.story.${id}`, group: 'bg', path: `art/bg/story-${id}.png`, borrow: scene(9), ...SCENE, use })),

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
// The people standing in the painted interiors (regulars, and silhouettes by role or class for visitors).
REGULARS.forEach((person) => {
  const role = person.role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sprite = person.sprite || `npc.role.${role}`;
  const portrait = person.portrait || `portrait.role.${role}`;
  add({ id: sprite, group: 'npc', path: person.sprite ? `art/walk/npcs/${slug(sprite)}.png` : `art/walk/npcs/role-${role}.png`, w: 26, h: 36, use: `${person.name}, ${person.role} (${person.locationId}, ${person.building})` });
  add({ id: portrait, group: 'portrait', path: person.portrait ? `art/portraits/npcs/${slug(portrait)}.png` : `art/portraits/roles/${role}.png`, w: 160, h: 160, use: `Dialogue portrait: ${person.role}` });
});
['council-steward', 'watch-sergeant', 'temple-acolyte', 'trader', 'traveller', 'messenger'].forEach((role) => {
  add({ id: `npc.role.${role}`, group: 'npc', path: `art/walk/npcs/role-${role}.png`, w: 26, h: 36, use: `Visitor silhouette by role: ${role.replace(/-/g, ' ')} (petitioners, travellers, messengers)` });
  add({ id: `portrait.role.${role}`, group: 'portrait', path: `art/portraits/roles/${role}.png`, w: 160, h: 160, use: `Dialogue portrait by role: ${role.replace(/-/g, ' ')}` });
});
Object.keys(CLASSES).forEach((classId) => {
  const key = classId.toLowerCase();
  add({ id: `char.class.${key}`, group: 'char', path: `art/walk/chars/class-${key}.png`, borrow: `art/sprites/${key}.png`, w: 30, h: 40, use: `Recruits and challengers in buildings: ${classId} (walk sprite)` });
  add({ id: `portrait.class.${key}`, group: 'portrait', path: `art/portraits/classes/${key}.png`, borrow: `art/portraits/${key}.png`, w: 160, h: 160, use: `Dialogue portrait for a ${classId} recruit` });
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
