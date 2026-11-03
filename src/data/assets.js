// Every visual asset the game asks for, by id. Paths are relative to public/.
// The loader (src/components/assetLoader.js) uses `path` when that file exists,
// then `borrow` (older shared art standing in), and otherwise draws a labelled,
// color-coded placeholder. Drop a file at `path` and it is used, no code change.
// Keep docs/ASSETS.md in sync when you add or change an entry.

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
  { id: 'interior.guildhall', group: 'interior', path: 'art/interiors/guildhall.png', borrow: scene(9), ...SCENE, use: 'Guild Hall rooms' },
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

  // Dunmere, walkable.
  { id: 'town.dunmere.ground', group: 'town', path: 'art/walk/dunmere/ground.png', w: 1400, h: 840, use: 'Dunmere: streets, square and edges' },
  { id: 'town.dunmere.rooms', group: 'building', path: 'art/walk/dunmere/rooms.png', w: 188, h: 190, use: 'Dunmere: your rented rooms' },
  { id: 'town.dunmere.guildhall.stage1', group: 'building', path: 'art/walk/dunmere/guildhall-stage1.png', w: 188, h: 190, use: 'Dunmere: Guild Hall, build stage 1' },
  { id: 'town.dunmere.tavern', group: 'building', path: 'art/walk/dunmere/tavern.png', w: 188, h: 190, use: 'Dunmere: The Wayfarer tavern' },
  { id: 'town.dunmere.shop', group: 'building', path: 'art/walk/dunmere/shop.png', w: 188, h: 190, use: 'Dunmere: Mira’s Supply' },
  { id: 'town.dunmere.arena', group: 'building', path: 'art/walk/dunmere/arena.png', w: 188, h: 190, use: 'Dunmere: arena' },
  { id: 'town.dunmere.herald', group: 'building', path: 'art/walk/dunmere/herald.png', w: 188, h: 190, use: 'Dunmere: Herald’s Office' },
  { id: 'town.dunmere.noticeboard', group: 'prop', path: 'art/walk/dunmere/noticeboard.png', w: 56, h: 100, use: 'Dunmere: notice board' },
  { id: 'prop.fountain', group: 'prop', path: 'art/walk/props/fountain.png', w: 160, h: 140, use: 'Town fountain' },
  { id: 'prop.tree', group: 'prop', path: 'art/walk/props/tree.png', w: 60, h: 76, use: 'Town tree' },
  { id: 'char.founder', group: 'char', path: 'art/walk/chars/founder.png', w: 26, h: 36, use: 'Player founder, walking (4-direction sheet later)' },
  { id: 'npc.dunmere.innkeeper', group: 'npc', path: 'art/walk/npcs/innkeeper.png', w: 26, h: 36, use: 'Sella Rowan, innkeeper' },
  { id: 'npc.dunmere.merchant', group: 'npc', path: 'art/walk/npcs/merchant.png', w: 26, h: 36, use: 'Bram Hallow, road merchant' },
  { id: 'npc.dunmere.fighter', group: 'npc', path: 'art/walk/npcs/fighter.png', w: 26, h: 36, use: 'Nia Voss, local fighter' },
  { id: 'npc.dunmere.traveler', group: 'npc', path: 'art/walk/npcs/traveler.png', w: 26, h: 36, use: 'Iven Quill, traveler' },
  { id: 'npc.dunmere.herald', group: 'npc', path: 'art/walk/npcs/herald.png', w: 26, h: 36, use: 'Orren Pike, herald' },

  // Interface art.
  { id: 'ui.overworld', group: 'ui', path: 'ui/overworld.png', w: 200, h: 125, use: 'World map terrain' },
];

export const ASSETS = Object.fromEntries(LIST.map((asset) => [asset.id, asset]));

/** The registry entry for an id; unknown ids get a loud "missing" placeholder entry. */
export function assetFor(id) {
  return ASSETS[id] || { id, group: 'missing', path: null, w: 640, h: 288, use: 'Not in src/data/assets.js' };
}

/** First registered id from a list (used for fallbacks like town → default). */
export function firstAsset(...ids) {
  return ids.find((id) => ASSETS[id]) || ids[ids.length - 1];
}
