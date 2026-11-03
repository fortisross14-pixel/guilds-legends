// Patrons and factions (Phase 4). Relationship points per patron live in
// state.patrons[id].points; levels and unlocks are read in
// src/game/engine/charter.js and granted in src/game/engine/connections.js.
// They partly oppose each other: working for one costs standing with others.

/** Relationship levels, highest first. Rival at or below −30. */
export const PATRON_LEVELS = [
  { id: 'ally', name: 'Ally', index: 3, min: 120 },
  { id: 'partner', name: 'Partner', index: 2, min: 60 },
  { id: 'contact', name: 'Contact', index: 1, min: 20 },
  { id: 'stranger', name: 'Stranger', index: 0, min: -29 },
  { id: 'rival', name: 'Rival', index: -1, min: -Infinity },
];

/** Standing changes (before charter modifiers). */
export const PATRON_DELTAS = {
  contractWin: 12,
  contractGreat: 15,
  contractPartial: 5,
  contractFail: -5,
  decline: -4,
  expire: -2,
  gift: 6,
  giftCost: 50,
};

export const PATRONS = {
  trade: {
    id: 'trade',
    name: 'The Dunmere Trade House',
    short: 'Trade House',
    home: 'dunmere',
    crest: 'crest.patron.trade',
    rep: { name: 'Bram Hallow', role: 'Road merchant', portrait: 'portrait.dunmere.merchant', dialogue: 'dunmere.merchant' },
    about: 'Money, caravans and merchant contracts. They like a guild that turns a profit and keeps the roads open.',
    families: ['Political', 'Investigation', 'Tournament'],
    // Working for the Trade House undercuts the Smiths and worries the Temple.
    opposes: { smiths: 4, temple: 2 },
    unlocks: {
      contact: 'Shop prices −5%',
      partner: 'An exclusive, high-paying Trade House contract on the Dunmere board each month',
      ally: 'Shop prices −10% and +25% pay on Trade House contracts',
    },
  },
  temple: {
    id: 'temple',
    name: 'The Temple of the Dawn',
    short: 'Temple',
    home: 'greenhollow',
    crest: 'crest.patron.temple',
    rep: { name: 'Brother Alder', role: 'Grove cleric', portrait: 'portrait.greenhollow.cleric', dialogue: 'greenhollow.cleric' },
    about: 'Healing, faith and protection contracts. They trust a guild that rescues people before it counts the pay.',
    families: ['Rescue'],
    opposes: { trade: 1 },
    unlocks: {
      contact: 'Healing items −25% and injuries heal a week sooner',
      partner: 'Counts as an extra Infirmary level; Sister Maelle, a Dawn cleric, offers to join',
      ally: '+25% pay on Temple contracts and +5 fame a month',
    },
  },
  smiths: {
    id: 'smiths',
    name: 'The Ironford Smiths’ Guild',
    short: 'Smiths',
    home: 'ironford',
    crest: 'crest.patron.smiths',
    rep: { name: 'Dagna Hale', role: 'Foundry foreman', portrait: 'portrait.ironford.foreman', dialogue: 'ironford.foreman' },
    about: 'Gear, mining and monster contracts. They respect a guild that comes back with dented armor and a carcass.',
    families: ['Monster Hunt', 'Dungeon'],
    opposes: { trade: 4 },
    unlocks: {
      contact: 'Gear upgrades without an Armory, and upgrades cost 20% less',
      partner: 'Chest +10 and weapons and armor −10% at shops',
      ally: 'The Oathblade, a weapon forged for your guild',
    },
  },
};

export const PATRON_LIST = Object.values(PATRONS);

/** The unique recruit the Temple sends at Partner. */
export const TEMPLE_RECRUIT = { name: 'Sister Maelle', classId: 'Cleric', primal: 'Plant', rarity: 'Rare', level: 4 };

/** The unique weapon the Smiths forge at Ally (src/data/items.js). */
export const SMITHS_WEAPON = 'oathblade';
