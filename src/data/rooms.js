// The guild's home: the founder's house, then a lot (src/data/lots.js: rented in
// story mission 1, bought later, expanded once owned). Every room takes one slot,
// and every room has three tiers: Basic → Advanced → State of the art. Building a
// room gives Basic; upgrading is done in place. A training room's tier is its
// equipment's tier (docs/specs/guild-hall-rooms.md). The numbers are first guesses
// (balance comes later); the engine is src/game/engine/hall.js.

/** The founder's house on Kiln Row, where every campaign starts: one bed, a small chest. */
export const HOUSE = {
  name: 'Your house on Kiln Row',
  beds: 1,
  chest: 12, // items the small chest holds
};

export const TIER_NAMES = ['Basic', 'Advanced', 'State of the art'];

/**
 * Room types. `tiers`: what building (tier 1) or upgrading to a tier costs, how
 * many weeks it takes, and its monthly upkeep. `gives` is one line per tier.
 */
export const ROOMS = [
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: 'moon',
    line: '+2 beds. Beds are the only roster limit.',
    tiers: [
      { cost: 260, weeks: 2, upkeep: 10 },
      { cost: 420, weeks: 3, upkeep: 14 },
      { cost: 720, weeks: 4, upkeep: 20 },
    ],
    gives: ['2 beds', '2 beds · faster rest · +1 loyalty a month', '2 beds · +morale · +1 rest day a week'],
  },
  {
    id: 'training',
    name: 'Training room',
    icon: 'sword',
    line: 'One hero at a time; its equipment raises one stat.',
    tiers: [
      { cost: 300, weeks: 2, upkeep: 12 },
      { cost: 520, weeks: 3, upkeep: 18 },
      { cost: 860, weeks: 4, upkeep: 26 },
    ],
    gives: ['+1 to its stat a month', '+2 to its stat a month', '+3 to its stat a month'],
  },
  {
    id: 'infirmary',
    name: 'Infirmary',
    icon: 'cross',
    line: 'One patient at a time; faster recovery.',
    tiers: [
      { cost: 340, weeks: 2, upkeep: 14 },
      { cost: 600, weeks: 3, upkeep: 20 },
      { cost: 940, weeks: 4, upkeep: 28 },
    ],
    gives: ['Defeat recovery 1 month', 'Defeat recovery 3 weeks · treatment −25%', 'Defeat recovery 2 weeks · treatment −50%'],
  },
  {
    id: 'treasury',
    name: 'Treasury',
    icon: 'coin',
    line: 'Income vs costs, bigger patron loans, interest on savings.',
    tiers: [
      { cost: 220, weeks: 1, upkeep: 6 },
      { cost: 520, weeks: 3, upkeep: 12 },
      { cost: 900, weeks: 4, upkeep: 18 },
    ],
    gives: ['Bigger patron loans', '+1% interest a month on savings', '+2% interest · cheaper loans'],
  },
  {
    id: 'armory',
    name: 'Armory',
    icon: 'shield',
    line: 'More gear storage and a discount at the shop.',
    tiers: [
      { cost: 420, weeks: 2, upkeep: 12 },
      { cost: 680, weeks: 3, upkeep: 16 },
      { cost: 980, weeks: 4, upkeep: 22 },
    ],
    gives: ['+10 storage · 5% off', '10% off · upgrade gear one step', '15% off · upgrade gear two steps'],
  },
  {
    id: 'scouts',
    name: 'Scout table',
    icon: 'eye',
    line: 'Recruits’ stats clear up faster; rumors of rare recruits.',
    tiers: [
      { cost: 340, weeks: 2, upkeep: 10 },
      { cost: 560, weeks: 3, upkeep: 14 },
      { cost: 880, weeks: 4, upkeep: 20 },
    ],
    gives: ['Ranges narrow faster in conversation', 'Rumors of rare recruits in other towns', 'See a recruit’s potential exactly'],
  },
  {
    id: 'crown',
    name: 'Crown Room',
    icon: 'crown',
    line: 'Shows your trophies and titles; trophies give fame each month.',
    tiers: [
      { cost: 480, weeks: 3, upkeep: 10 },
      { cost: 760, weeks: 3, upkeep: 14 },
      { cost: 1200, weeks: 4, upkeep: 20 },
    ],
    gives: ['Trophies give fame each month', '+50% fame from trophies · title banners', 'Visitors: more rare recruits, faster patron standing'],
  },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room]));

/** Training equipment: each piece raises one stat; its tier is the room's tier. */
export const EQUIPMENT = [
  { id: 'dummy', name: 'Training dummy', stat: 'Might', icon: 'sword' },
  { id: 'targets', name: 'Archery targets', stat: 'Finesse', icon: 'eye' },
  { id: 'desk', name: 'Reading desk', stat: 'Mind', icon: 'book' },
  { id: 'shrine', name: 'Shrine', stat: 'Spirit', icon: 'star' },
  { id: 'weights', name: 'Weights', stat: 'Endurance', icon: 'shield' },
  { id: 'podium', name: 'Podium', stat: 'Presence', icon: 'horn' },
];
export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));

/** Training numbers: stat gain a month by tier, XP a week, and swapping equipment. */
export const TRAINING = { gain: [1, 2, 3], xpPerWeek: 2, swapCost: [80, 140, 220], swapRefund: 0.5 };

/** Clearing a room: a partial refund of what it cost, one week of work. */
export const CLEARING = { refund: 0.4, weeks: 1 };

/**
 * Injuries and defeat (no deaths from battles). Normal injuries take a week; a
 * patient in an infirmary bed ends that week at full HP, anyone else at `restHp`.
 * Defeat: the party wakes in the infirmary (or the founder's house before the
 * lot is rented), pays treatment per hero plus transport per day of distance,
 * and needs `weeks[tier]` to recover (index 0: no infirmary). Patients beyond the
 * infirmary's beds recover at half speed.
 */
export const INJURY = { weeks: 1, restHp: 60 };
/** Armory by tier (index 0 = none): shop discount and how many steps one gear upgrade climbs. */
export const ARMORY = { discount: [0, 0.05, 0.1, 0.15], upgradeSteps: [0, 0, 1, 2] };

/** Crown Room, State of the art: visitors draw better recruits and patrons. */
export const VISITORS = { recruitQuality: 0.1, patronGain: 1.25 };

export const DEFEAT = { weeks: [4, 4, 3, 2], treatment: 30, transportPerDay: 10, discount: [0, 0, 0.25, 0.5], hp: 10 };

/** Crown Room fame: per trophy a month (each repeat of the same trophy adds less). */
export const CROWN = { fameFirst: 2, fameRepeat: 1, maxPerTrophy: 4, advancedBonus: 0.5 };

/** Art ids: the lot diorama and a tile per room type and tier (docs/ASSETS.md). */
export const HALL_EXTERIOR = 'town.dunmere.guildhall.stage1';
export const LOT_DIORAMA = 'scene.hall.lot';
export const roomTileArt = (type, tier) => `hall.room.${type}.${Math.max(1, tier)}`;
export const equipmentArt = (kind, tier) => `hall.equipment.${kind}.${Math.max(1, tier)}`;
