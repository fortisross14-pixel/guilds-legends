// The guild's home, from a rented room to a renowned hall (Phase 3).
// Engine: src/game/engine/hall.js (actions) and core.js (bedCount, roomLevel, hallStage).
//
// Requirements (all keys must hold): fame, tier (0 Regional…), contracts
// (completed contracts), trophies, rooms ({ roomId: level }).

/** The room above the Wayfarer in Dunmere: where every campaign starts. */
export const RENTED_ROOM = {
  name: 'Rented room above the Wayfarer',
  beds: 1,
  maxBeds: 4,
  bedCost: 40,
  rent: 20,
  bedRent: 6,
  chest: 12, // items the small chest holds
};

/** The old empty hall in Dunmere: buy it outright or lease it. */
export const HALL_PURCHASE = {
  name: 'The old hall on Banner Plaza',
  requires: { fame: 30, contracts: 2 },
  buy: { cost: 700 },
  lease: { cost: 160, rent: 35 },
  beds: 2, // a dormitory corner comes with the hall
  wings: 6, // empty wings to build rooms in
  renownedWings: 2, // extra wings once the hall is renowned
};

/**
 * Rooms. Each level: cost (crowns), weeks to build, monthly upkeep and its
 * requirement. `effect(level)` is the short line shown on the build list.
 */
export const ROOMS = [
  {
    id: 'bunks',
    name: 'Bunk room',
    icon: '☾',
    description: 'Bunks, chests and a stove. More heroes can live in the hall.',
    levels: [
      { cost: 260, weeks: 2, upkeep: 10, requires: {} },
      { cost: 480, weeks: 3, upkeep: 16, requires: { fame: 80 } },
      { cost: 760, weeks: 4, upkeep: 24, requires: { fame: 150, rooms: { training: 1 } } },
    ],
    effect: (level) => `+${level * 2} beds`,
  },
  {
    id: 'training',
    name: 'Training ground',
    icon: '⚔',
    activity: 'Training',
    description: 'Dummies, a sparring ring and a quiet corner for books.',
    levels: [
      { cost: 300, weeks: 2, upkeep: 12, requires: {} },
      { cost: 560, weeks: 3, upkeep: 18, requires: { fame: 90 } },
      { cost: 860, weeks: 4, upkeep: 26, requires: { fame: 160, rooms: { bunks: 2 } } },
    ],
    // Drills unlocked at each level (Fundamentals and Sparring at 1).
    drills: [['Fundamentals', 'Sparring'], ['Role Drills'], ['Study']],
    effect: (level) => `Training +${level * 25}% XP · drills: ${trainingDrills(level).join(', ')}`,
  },
  {
    id: 'infirmary',
    name: 'Infirmary',
    icon: '✚',
    activity: 'Infirmary',
    description: 'Clean beds, herb stores and a healer on call.',
    levels: [
      { cost: 340, weeks: 2, upkeep: 14, requires: {} },
      { cost: 640, weeks: 3, upkeep: 22, requires: { fame: 110 } },
    ],
    effect: (level) => (level >= 2 ? 'Injuries heal 2× faster · death risk on bad missions −30%' : 'Injuries heal 2× faster here'),
  },
  {
    id: 'armory',
    name: 'Armory',
    icon: '⚒',
    description: 'Racks, an anvil and a locked store.',
    levels: [{ cost: 420, weeks: 2, upkeep: 12, requires: { contracts: 4 } }],
    effect: () => `Chest holds ${RENTED_ROOM.chest + 20} items · shop prices −10% · upgrade gear one step`,
  },
  {
    id: 'war',
    name: 'War room',
    icon: '⚑',
    description: 'A big table, maps and markers for every hero.',
    levels: [{ cost: 280, weeks: 1, upkeep: 8, requires: {} }],
    effect: () => 'Main party (up to 4) and saved formations',
  },
  {
    id: 'scouts',
    name: 'Scout table',
    icon: '⌖',
    activity: 'Scouting',
    description: 'Maps, a ledger of rumors and a runner who knows every tavern.',
    levels: [{ cost: 340, weeks: 2, upkeep: 10, requires: { fame: 50 } }],
    effect: () => 'Scouting activity · recruit stats clear up faster · rumors of rare recruits',
  },
  {
    id: 'trophies',
    name: 'Trophy hall',
    icon: '♛',
    description: 'Cases and banners for everything the guild has won.',
    levels: [{ cost: 480, weeks: 3, upkeep: 10, requires: { trophies: 1 } }],
    effect: () => 'Shows titles, records and trophies · +2 fame a month per trophy (up to +10)',
  },
  {
    id: 'treasury',
    name: 'Treasury',
    icon: '◈',
    description: 'A strongbox, ledgers and a clerk who never smiles.',
    levels: [
      { cost: 220, weeks: 1, upkeep: 6, requires: {} },
      { cost: 560, weeks: 3, upkeep: 12, requires: { fame: 140 } },
    ],
    effect: (level) => (level >= 2 ? 'Income vs costs report · patron loans +50%' : 'Income vs costs report'),
  },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room]));

/** Training drills open at a training ground level. */
export function trainingDrills(level) {
  return ROOM_BY_ID.training.drills.slice(0, Math.max(0, level)).flat();
}

/**
 * Hall stages, in order. The stage advances from rooms built and their levels
 * (see hallStage in core.js). Each has an exterior (the walkable Dunmere town)
 * and an interior (the Guild Hall screen) asset id.
 */
export const HALL_STAGES = [
  { id: 1, key: 'rented', name: 'Rented room', exterior: 'town.dunmere.guildhall.stage1', interior: 'interior.guildhall.stage1', townLabel: 'Old hall · for sale' },
  { id: 2, key: 'empty', name: 'Empty hall', exterior: 'town.dunmere.guildhall.stage2', interior: 'interior.guildhall.stage2', townLabel: 'Guild Hall' },
  { id: 3, key: 'working', name: 'Working hall', exterior: 'town.dunmere.guildhall.stage3', interior: 'interior.guildhall.stage3', townLabel: 'Guild Hall' },
  { id: 4, key: 'renowned', name: 'Renowned hall', exterior: 'town.dunmere.guildhall.stage4', interior: 'interior.guildhall.stage4', townLabel: 'Guild Hall' },
];

/** Rooms built and total levels needed for the working and renowned stages. */
export const STAGE_RULES = { working: { rooms: 3 }, renowned: { rooms: 6, levels: 9 } };

/** Interior art for a built room at a level. */
export function roomInterior(roomId, level) {
  return `interior.room.${roomId}.${Math.max(1, level)}`;
}
