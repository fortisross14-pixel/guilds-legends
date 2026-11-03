// Consumables and equipment. Prices are in gold; selling returns half.
// kind: 'consumable' | 'weapon' | 'armor' | 'accessory'
// tier: 1 Regional, 2 National, 3 Global (shops stock up to their town's tier).
// classes: which classes may equip it (omit = everyone).
// battle: consumable effect in combat. field: effect when used at the Guild Hall.

const CASTERS = ['Mage', 'Cleric', 'Scholar'];

const list = [
  // Consumables
  {
    id: 'potion',
    name: 'Potion',
    kind: 'consumable',
    tier: 1,
    price: 20,
    battle: { target: 'ally', heal: 50 },
    field: { health: 30, fatigue: -15 },
    description: 'Restore 50 HP in battle, or health at the Guild Hall.',
  },
  {
    id: 'hi-potion',
    name: 'Hi-Potion',
    kind: 'consumable',
    tier: 2,
    price: 60,
    battle: { target: 'ally', heal: 150 },
    field: { health: 60, fatigue: -30 },
    description: 'Restore 150 HP in battle.',
  },
  {
    id: 'ether',
    name: 'Ether',
    kind: 'consumable',
    tier: 1,
    price: 40,
    battle: { target: 'ally', mp: 25 },
    field: { morale: 10 },
    description: 'Restore 25 MP.',
  },
  { id: 'antidote', name: 'Antidote', kind: 'consumable', tier: 1, price: 15, battle: { target: 'ally', cure: true }, description: 'Cure poison and stun.' },
  {
    id: 'phoenix-feather',
    name: 'Phoenix Feather',
    kind: 'consumable',
    tier: 2,
    price: 120,
    battle: { target: 'koAlly', revive: 0.35 },
    description: 'Revive a fallen ally at 35% HP.',
  },
  {
    id: 'fire-bomb',
    name: 'Fire Bomb',
    kind: 'consumable',
    tier: 1,
    price: 50,
    battle: { target: 'allEnemies', damage: 40 },
    description: 'Deal 40 damage to every enemy.',
  },

  // Weapons
  { id: 'iron-sword', name: 'Iron Sword', kind: 'weapon', tier: 1, price: 60, stats: { atk: 5 }, classes: ['Guardian', 'Duelist'] },
  { id: 'steel-sword', name: 'Steel Sword', kind: 'weapon', tier: 2, price: 180, stats: { atk: 10 }, classes: ['Guardian', 'Duelist'] },
  { id: 'mithril-blade', name: 'Mithril Blade', kind: 'weapon', tier: 3, price: 460, stats: { atk: 16, spd: 2 }, classes: ['Guardian', 'Duelist'] },
  { id: 'knife', name: 'Knife', kind: 'weapon', tier: 1, price: 50, stats: { atk: 4, spd: 2 }, classes: ['Rogue', 'Duelist'] },
  { id: 'kris', name: 'Kris', kind: 'weapon', tier: 2, price: 160, stats: { atk: 8, spd: 3 }, classes: ['Rogue', 'Duelist'] },
  { id: 'shadow-fang', name: 'Shadow Fang', kind: 'weapon', tier: 3, price: 420, stats: { atk: 13, spd: 5 }, classes: ['Rogue', 'Duelist'] },
  { id: 'short-bow', name: 'Short Bow', kind: 'weapon', tier: 1, price: 60, stats: { atk: 5 }, classes: ['Ranger'] },
  { id: 'longbow', name: 'Longbow', kind: 'weapon', tier: 2, price: 180, stats: { atk: 10 }, classes: ['Ranger'] },
  { id: 'storm-bow', name: 'Storm Bow', kind: 'weapon', tier: 3, price: 440, stats: { atk: 15, spd: 2 }, classes: ['Ranger'] },
  { id: 'oak-staff', name: 'Oak Staff', kind: 'weapon', tier: 1, price: 60, stats: { mag: 5 }, classes: CASTERS },
  { id: 'runed-staff', name: 'Runed Staff', kind: 'weapon', tier: 2, price: 180, stats: { mag: 10, mp: 5 }, classes: CASTERS },
  { id: 'archmage-rod', name: 'Archmage Rod', kind: 'weapon', tier: 3, price: 460, stats: { mag: 16, mp: 10 }, classes: CASTERS },
  { id: 'mallet', name: 'Mallet', kind: 'weapon', tier: 1, price: 55, stats: { atk: 4, mag: 2 }, classes: ['Artificer', 'Guardian'] },
  { id: 'war-hammer', name: 'War Hammer', kind: 'weapon', tier: 2, price: 170, stats: { atk: 9, mag: 3 }, classes: ['Artificer', 'Guardian'] },
  // Forged by the Ironford Smiths' Guild for an allied guild (src/data/patrons.js); not sold in shops.
  { id: 'oathblade', name: 'Oathblade', kind: 'weapon', tier: 3, price: 600, unique: true, stats: { atk: 15, def: 3, spd: 2 }, classes: ['Guardian', 'Duelist', 'Rogue', 'Artificer', 'Ranger'], description: 'Ironford steel with the guild’s oath on the blade.' },
  { id: 'thunder-maul', name: 'Thunder Maul', kind: 'weapon', tier: 3, price: 440, stats: { atk: 14, mag: 5 }, classes: ['Artificer', 'Guardian'] },

  // Armor
  { id: 'leather-vest', name: 'Leather Vest', kind: 'armor', tier: 1, price: 50, stats: { def: 3, spd: 1 } },
  { id: 'mage-robe', name: 'Mage Robe', kind: 'armor', tier: 1, price: 55, stats: { def: 2, mag: 3 }, classes: CASTERS },
  { id: 'chain-mail', name: 'Chain Mail', kind: 'armor', tier: 1, price: 80, stats: { def: 6 }, classes: ['Guardian', 'Duelist', 'Ranger', 'Artificer'] },
  { id: 'brigandine', name: 'Brigandine', kind: 'armor', tier: 2, price: 170, stats: { def: 8, spd: 1 } },
  { id: 'sage-robe', name: 'Sage Robe', kind: 'armor', tier: 2, price: 180, stats: { def: 4, mag: 6 }, classes: CASTERS },
  { id: 'plate-armor', name: 'Plate Armor', kind: 'armor', tier: 2, price: 240, stats: { def: 12, spd: -2 }, classes: ['Guardian', 'Artificer'] },
  { id: 'dragonhide', name: 'Dragonhide', kind: 'armor', tier: 3, price: 420, stats: { def: 12, spd: 2 } },
  { id: 'archon-robe', name: 'Archon Robe', kind: 'armor', tier: 3, price: 440, stats: { def: 7, mag: 10 }, classes: CASTERS },
  { id: 'aegis-plate', name: 'Aegis Plate', kind: 'armor', tier: 3, price: 520, stats: { def: 18, spd: -2 }, classes: ['Guardian'] },

  // Accessories
  { id: 'power-ring', name: 'Power Ring', kind: 'accessory', tier: 1, price: 70, stats: { atk: 3 } },
  { id: 'guard-amulet', name: 'Guard Amulet', kind: 'accessory', tier: 1, price: 70, stats: { def: 3 } },
  { id: 'swift-boots', name: 'Swift Boots', kind: 'accessory', tier: 2, price: 160, stats: { spd: 4 } },
  { id: 'sage-charm', name: 'Sage Charm', kind: 'accessory', tier: 2, price: 160, stats: { mag: 4, mp: 10 } },
  { id: 'life-pendant', name: 'Life Pendant', kind: 'accessory', tier: 2, price: 180, stats: { hp: 30 } },
  { id: 'hero-crest', name: 'Hero’s Crest', kind: 'accessory', tier: 3, price: 480, stats: { atk: 4, def: 4, mag: 4 } },

  // Boss trophies (unique accessories; not sold in shops).
  { id: 'oswin-signet', name: 'Oswin’s Signet', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { atk: 6, def: 6 } },
  { id: 'briar-crown', name: 'Briar Crown', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { mag: 7, hp: 30 } },
  { id: 'tide-pearl', name: 'Tide Pearl', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { mag: 6, mp: 20 } },
  { id: 'sun-sigil', name: 'Sun Sigil', kind: 'accessory', tier: 9, price: 700, unique: true, stats: { atk: 5, mag: 5, spd: 2 } },
  { id: 'roc-feather', name: 'Roc Feather', kind: 'accessory', tier: 9, price: 700, unique: true, stats: { spd: 8, atk: 3 } },
  { id: 'frost-heart', name: 'Frost Heart', kind: 'accessory', tier: 9, price: 700, unique: true, stats: { def: 9, hp: 40 } },
  { id: 'veil-mask', name: 'Veil Mask', kind: 'accessory', tier: 9, price: 800, unique: true, stats: { mag: 9, spd: 3 } },
  {
    id: 'lantern-of-the-lost',
    name: 'Lantern of the Lost Company',
    kind: 'accessory',
    tier: 9,
    price: 1200,
    unique: true,
    stats: { atk: 6, def: 6, mag: 6, hp: 30 },
  },
];

export const ITEMS = Object.fromEntries(list.map((item) => [item.id, item]));

/** One-step gear upgrades at the Armory (same line, next tier). */
export const GEAR_UPGRADES = {
  'iron-sword': 'steel-sword',
  'steel-sword': 'mithril-blade',
  knife: 'kris',
  kris: 'shadow-fang',
  'short-bow': 'longbow',
  longbow: 'storm-bow',
  'oak-staff': 'runed-staff',
  'runed-staff': 'archmage-rod',
  mallet: 'war-hammer',
  'war-hammer': 'thunder-maul',
  'leather-vest': 'brigandine',
  brigandine: 'dragonhide',
  'mage-robe': 'sage-robe',
  'sage-robe': 'archon-robe',
  'chain-mail': 'plate-armor',
  'plate-armor': 'aegis-plate',
};
export const ITEM_LIST = list;
export const GEAR_SLOTS = ['weapon', 'armor', 'accessory'];

/** The accessory slot holds 'artifact:<id>' when a guild artifact is worn. */
export const ARTIFACT_PREFIX = 'artifact:';

export function canEquip(item, classId) {
  if (!item || !GEAR_SLOTS.includes(item.kind)) return false;
  return !item.classes || item.classes.includes(classId);
}

/** Summed stat bonuses from a hero's gear (artifacts use hero.artifactStats). */
export function gearStats(hero) {
  const total = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, spd: 0 };
  GEAR_SLOTS.forEach((slot) => {
    const id = hero?.gear?.[slot];
    if (!id) return;
    const stats = id.startsWith(ARTIFACT_PREFIX) ? hero.artifactStats : ITEMS[id]?.stats;
    Object.entries(stats || {}).forEach(([key, value]) => {
      total[key] = (total[key] || 0) + value;
    });
  });
  return total;
}

/** Combat stat bonus for an artifact worn as an accessory, from its prestige. */
export function artifactAccessoryStats(prestige = 0) {
  const step = Math.max(1, Math.round(prestige / 25));
  return { atk: step, def: step, mag: step, hp: step * 6 };
}
