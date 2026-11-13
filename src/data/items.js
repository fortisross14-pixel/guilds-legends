// Items (docs/design/ITEMS.md). Prices are in gold; selling returns half, except goods (full price).
// kind: 'consumable' | 'weapon' | 'armor' | 'accessory' (Equipment) | 'good' (sell or hand in) | 'keepsake' (story; never sold)
// tier: 1 Regional, 2 National, 3 Global, 4 legendary (consumables: shops stock up to their town's tier).
// level (gear): the hero level needed to wear it, 1 to 50. Shops stock gear up to their town's
// gear level (SHOP_GEAR_LEVEL), plus a showpiece or two above it (SHOWPIECES).
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
  { id: 'iron-sword', name: 'Iron Sword', kind: 'weapon', tier: 1, level: 1, price: 60, stats: { atk: 5 }, classes: ['Guardian', 'Duelist'] },
  { id: 'steel-sword', name: 'Steel Sword', kind: 'weapon', tier: 2, level: 18, price: 720, stats: { atk: 10 }, classes: ['Guardian', 'Duelist'] },
  { id: 'mithril-blade', name: 'Mithril Blade', kind: 'weapon', tier: 3, level: 32, price: 2400, stats: { atk: 16, spd: 2 }, classes: ['Guardian', 'Duelist'] },
  { id: 'knife', name: 'Knife', kind: 'weapon', tier: 1, level: 1, price: 50, stats: { atk: 4, spd: 2 }, classes: ['Rogue', 'Duelist'] },
  { id: 'kris', name: 'Kris', kind: 'weapon', tier: 2, level: 16, price: 640, stats: { atk: 8, spd: 3 }, classes: ['Rogue', 'Duelist'] },
  { id: 'shadow-fang', name: 'Shadow Fang', kind: 'weapon', tier: 3, level: 31, price: 2200, stats: { atk: 13, spd: 5 }, classes: ['Rogue', 'Duelist'] },
  { id: 'short-bow', name: 'Short Bow', kind: 'weapon', tier: 1, level: 1, price: 60, stats: { atk: 5 }, classes: ['Ranger'] },
  { id: 'longbow', name: 'Longbow', kind: 'weapon', tier: 2, level: 18, price: 720, stats: { atk: 10 }, classes: ['Ranger'] },
  { id: 'storm-bow', name: 'Storm Bow', kind: 'weapon', tier: 3, level: 32, price: 2300, stats: { atk: 15, spd: 2 }, classes: ['Ranger'] },
  { id: 'oak-staff', name: 'Oak Staff', kind: 'weapon', tier: 1, level: 1, price: 60, stats: { mag: 5 }, classes: CASTERS },
  { id: 'runed-staff', name: 'Runed Staff', kind: 'weapon', tier: 2, level: 18, price: 720, stats: { mag: 10, mp: 5 }, classes: CASTERS },
  { id: 'archmage-rod', name: 'Archmage Rod', kind: 'weapon', tier: 3, level: 33, price: 2400, stats: { mag: 16, mp: 10 }, classes: CASTERS },
  { id: 'mallet', name: 'Mallet', kind: 'weapon', tier: 1, level: 1, price: 55, stats: { atk: 4, mag: 2 }, classes: ['Artificer', 'Guardian'] },
  { id: 'war-hammer', name: 'War Hammer', kind: 'weapon', tier: 2, level: 17, price: 680, stats: { atk: 9, mag: 3 }, classes: ['Artificer', 'Guardian'] },
  // Forged by the Ironford Smiths' Guild for an allied guild (src/data/patrons.js); not sold in shops.
  { id: 'oathblade', name: 'Oathblade', kind: 'weapon', tier: 3, level: 35, price: 600, unique: true, stats: { atk: 15, def: 3, spd: 2 }, classes: ['Guardian', 'Duelist', 'Rogue', 'Artificer', 'Ranger'], description: 'Ironford steel with the guild’s oath on the blade.' },
  { id: 'thunder-maul', name: 'Thunder Maul', kind: 'weapon', tier: 3, level: 32, price: 2300, stats: { atk: 14, mag: 5 }, classes: ['Artificer', 'Guardian'] },

  // Armor
  { id: 'leather-vest', name: 'Leather Vest', kind: 'armor', tier: 1, level: 1, price: 50, stats: { def: 3, spd: 1 } },
  { id: 'mage-robe', name: 'Mage Robe', kind: 'armor', tier: 1, level: 1, price: 55, stats: { def: 2, mag: 3 }, classes: CASTERS },
  { id: 'chain-mail', name: 'Chain Mail', kind: 'armor', tier: 1, level: 4, price: 110, stats: { def: 6 }, classes: ['Guardian', 'Duelist', 'Ranger', 'Artificer'] },
  { id: 'brigandine', name: 'Brigandine', kind: 'armor', tier: 2, level: 15, price: 600, stats: { def: 8, spd: 1 } },
  { id: 'sage-robe', name: 'Sage Robe', kind: 'armor', tier: 2, level: 16, price: 640, stats: { def: 4, mag: 6 }, classes: CASTERS },
  { id: 'plate-armor', name: 'Plate Armor', kind: 'armor', tier: 2, level: 20, price: 1200, stats: { def: 12, spd: -2 }, classes: ['Guardian', 'Artificer'] },
  { id: 'dragonhide', name: 'Dragonhide', kind: 'armor', tier: 3, level: 30, price: 2100, stats: { def: 12, spd: 2 } },
  { id: 'archon-robe', name: 'Archon Robe', kind: 'armor', tier: 3, level: 31, price: 2200, stats: { def: 7, mag: 10 }, classes: CASTERS },
  { id: 'aegis-plate', name: 'Aegis Plate', kind: 'armor', tier: 3, level: 35, price: 2800, stats: { def: 18, spd: -2 }, classes: ['Guardian'] },

  // Accessories
  { id: 'power-ring', name: 'Power Ring', kind: 'accessory', tier: 1, level: 3, price: 80, stats: { atk: 3 } },
  { id: 'guard-amulet', name: 'Guard Amulet', kind: 'accessory', tier: 1, level: 3, price: 80, stats: { def: 3 } },
  { id: 'swift-boots', name: 'Swift Boots', kind: 'accessory', tier: 2, level: 15, price: 600, stats: { spd: 4 } },
  { id: 'sage-charm', name: 'Sage Charm', kind: 'accessory', tier: 2, level: 15, price: 600, stats: { mag: 4, mp: 10 } },
  { id: 'life-pendant', name: 'Life Pendant', kind: 'accessory', tier: 2, level: 17, price: 700, stats: { hp: 30 } },
  { id: 'hero-crest', name: 'Hero’s Crest', kind: 'accessory', tier: 3, level: 34, price: 2600, stats: { atk: 4, def: 4, mag: 4 } },

  // Legendary gear (level 45–50): sold in the far towns (Global), the guild's last purchases.
  { id: 'kingsbane', name: 'Kingsbane', kind: 'weapon', tier: 4, level: 47, price: 7800, stats: { atk: 24, spd: 3 }, classes: ['Guardian', 'Duelist'] },
  { id: 'nightglass-fang', name: 'Nightglass Fang', kind: 'weapon', tier: 4, level: 46, price: 7200, stats: { atk: 20, spd: 7 }, classes: ['Rogue', 'Duelist'] },
  { id: 'skyreach-bow', name: 'Skyreach Bow', kind: 'weapon', tier: 4, level: 47, price: 7600, stats: { atk: 23, spd: 3 }, classes: ['Ranger'] },
  { id: 'starfall-rod', name: 'Starfall Rod', kind: 'weapon', tier: 4, level: 48, price: 8000, stats: { mag: 24, mp: 16 }, classes: CASTERS },
  { id: 'titan-maul', name: 'Titan Maul', kind: 'weapon', tier: 4, level: 47, price: 7600, stats: { atk: 21, mag: 8 }, classes: ['Artificer', 'Guardian'] },
  { id: 'wyrmscale', name: 'Wyrmscale', kind: 'armor', tier: 4, level: 45, price: 6800, stats: { def: 18, spd: 3 } },
  { id: 'astral-robe', name: 'Astral Robe', kind: 'armor', tier: 4, level: 46, price: 7000, stats: { def: 11, mag: 15 }, classes: CASTERS },
  { id: 'bastion-plate', name: 'Bastion Plate', kind: 'armor', tier: 4, level: 49, price: 8800, stats: { def: 27, spd: -2 }, classes: ['Guardian'] },
  { id: 'legend-crest', name: 'Legend’s Crest', kind: 'accessory', tier: 4, level: 48, price: 8200, stats: { atk: 7, def: 7, mag: 7 } },
  { id: 'phoenix-heart', name: 'Phoenix Heart', kind: 'accessory', tier: 4, level: 50, price: 9500, stats: { hp: 80, mp: 20 } },

  // Boss trophies (unique accessories; not sold in shops).
  { id: 'oswin-signet', name: 'Oswin’s Signet', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { atk: 6, def: 6 } },
  { id: 'briar-crown', name: 'Briar Crown', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { mag: 7, hp: 30 } },
  { id: 'tide-pearl', name: 'Tide Pearl', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { mag: 6, mp: 20 } },
  { id: 'sun-sigil', name: 'Sun Sigil', kind: 'accessory', tier: 9, price: 700, unique: true, stats: { atk: 5, mag: 5, spd: 2 } },
  { id: 'roc-feather', name: 'Roc Feather', kind: 'accessory', tier: 9, price: 700, unique: true, stats: { spd: 8, atk: 3 } },
  { id: 'frost-heart', name: 'Frost Heart', kind: 'accessory', tier: 9, price: 700, unique: true, stats: { def: 9, hp: 40 } },
  { id: 'veil-mask', name: 'Veil Mask', kind: 'accessory', tier: 9, price: 800, unique: true, stats: { mag: 9, spd: 3 } },
  // Sold only to guilds of one standing (`creed`), at a few shops (`shops`): not basic gear.
  { id: 'oathkeeper', name: 'Oathkeeper', kind: 'weapon', tier: 2, level: 16, price: 800, creed: 'honourable', shops: ['dunmere', 'ironford'], stats: { atk: 9, def: 3 }, classes: ['Guardian', 'Duelist'], description: 'A plain, perfect blade the Dunmere smiths sell only to guilds who keep their word.' },
  { id: 'dawn-bow', name: 'Dawnwatch Bow', kind: 'weapon', tier: 2, level: 16, price: 780, creed: 'honourable', shops: ['greenhollow'], stats: { atk: 9, spd: 2 }, classes: ['Ranger'], description: 'Blessed at Dawnwatch. The Greenhollow fletchers keep it for people they trust.' },
  { id: 'pilgrim-staff', name: 'Pilgrim’s Staff', kind: 'weapon', tier: 2, level: 16, price: 780, creed: 'honourable', shops: ['windmere'], stats: { mag: 9, mp: 8 }, classes: ['Mage', 'Cleric', 'Scholar'], description: 'Walked a thousand miles to the cliff monasteries. Sold to kind hands only.' },
  { id: 'cutthroat-kris', name: 'Cutthroat’s Kris', kind: 'weapon', tier: 2, level: 16, price: 760, creed: 'wicked', shops: ['ironford', 'windmere'], stats: { atk: 9, spd: 3 }, classes: ['Rogue', 'Duelist'], description: 'Sold under the counter, to buyers who won’t say what it’s for.' },
  { id: 'bonebreaker', name: 'Bonebreaker', kind: 'weapon', tier: 2, level: 16, price: 800, creed: 'wicked', shops: ['dunmere', 'greenhollow'], stats: { atk: 11, spd: -1 }, classes: ['Guardian', 'Artificer'], description: 'A maul with a name. The shopkeeper only shows it to people who frighten them.' },
  { id: 'hexed-rod', name: 'Hexed Rod', kind: 'weapon', tier: 2, level: 16, price: 780, creed: 'wicked', shops: ['ironford'], stats: { mag: 11 }, classes: ['Mage', 'Scholar'], description: 'It hums. Honest folk won’t touch it, and the seller won’t sell it to them.' },
  // Rough gear off beaten foes (not sold in shops).
  { id: 'rusty-sword', name: 'Rusty Sword', kind: 'weapon', tier: 0, price: 20, loot: true, stats: { atk: 2 }, classes: ['Guardian', 'Duelist', 'Rogue'] },
  { id: 'wolfskin-vest', name: 'Wolfskin Vest', kind: 'armor', tier: 0, price: 24, loot: true, stats: { def: 2 } },
  { id: 'hunting-knife', name: 'Hunting Knife', kind: 'weapon', tier: 0, price: 18, loot: true, stats: { atk: 2, spd: 1 }, classes: ['Rogue', 'Duelist', 'Ranger'] },
  // Goods: dropped, found or gathered; sold at full price, or handed in for errands.
  { id: 'wolf-pelt', name: 'Wolf Pelt', kind: 'good', tier: 0, price: 6, use: 'Wolfskins wear them. Corwin and the tanners buy them.' },
  { id: 'bandit-dagger', name: 'Bandit’s Dagger', kind: 'good', tier: 0, price: 10, use: 'Cheap steel. Any smith buys it for scrap.' },
  { id: 'feverfew', name: 'Feverfew', kind: 'good', tier: 0, price: 4, use: 'A healing herb from the Old Road. Mira buys it.' },
  { id: 'liquor', name: 'Bottle of Liquor', kind: 'good', tier: 0, price: 8, use: 'Raiders’ rotgut. The watch drinks it too.' },
  { id: 'poacher-snare', name: 'Poacher’s Snare', kind: 'good', tier: 0, price: 5, use: 'The Greenhollow wardens want these out of the Thornwood.' },
  { id: 'ochre', name: 'Ochre', kind: 'good', tier: 0, price: 15, use: 'A yellow-red earth from the Iron Road heights. Scribes use it.' },
  { id: 'woad', name: 'Woad', kind: 'good', tier: 0, price: 15, use: 'A blue dye plant from the cliff road.' },
  { id: 'iron-ore', name: 'Iron Ore', kind: 'good', tier: 0, price: 7, use: 'Raw ore from the Iron Road. Ironford’s smiths buy it.' },
  { id: 'sea-purple', name: 'Sea Purple', kind: 'good', tier: 0, price: 18, use: 'A purple dye from coast-road shells.' },
  // Keepsakes: story and quest items. Never sold.
  { id: 'lantern-medal', name: 'The Lantern’s Medal', kind: 'keepsake', tier: 0, price: 0, for: 'The bearer’s medal of the Broken Lantern. Rook gave it to you with the banner.' },
  { id: 'watch-token', name: 'The Watch’s Token', kind: 'keepsake', tier: 0, price: 0, for: 'Sergeant Hobb’s token of trust. Show it to Prior Aubrey at Dawnwatch.' },
  { id: 'corwin-strongbox', name: 'Corwin’s Strongbox', kind: 'keepsake', tier: 0, price: 0, for: 'Corwin’s, taken by a bandit on the Old Road. Bring it back to him.' },
  { id: 'old-scrap', name: 'A Scrap in an Old Script', kind: 'keepsake', tier: 0, price: 0, for: 'Torn from the Ironford ledger. Nobody in the archive can read it.' },
  { id: 'restored-papyrus', name: 'The Restored Scrap', kind: 'keepsake', tier: 0, price: 0, for: '“The seven did not die in the fire. Ask the cliff champion who paid him to lose.”' },
  { id: 'sealed-letter', name: 'A Sealed Letter', kind: 'keepsake', tier: 0, price: 0, for: 'Sela Wick’s letter for Foreman Brandt in Ironford.' },
  { id: 'waystone-rubbing', name: 'Waystone Rubbing', kind: 'keepsake', tier: 0, price: 0, for: 'The Lantern’s marks, copied off the waystone in the Thornwood.' },
  // Story rewards (The Last Banner, src/data/story.js).
  { id: 'marens-satchel', name: 'Maren’s Satchel', kind: 'accessory', tier: 9, price: 500, unique: true, stats: { hp: 25, mag: 3 } },
  { id: 'gull-feather', name: 'Halden’s Gull Feather', kind: 'accessory', tier: 9, price: 600, unique: true, stats: { spd: 6, atk: 3 } },
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
  'mithril-blade': 'kingsbane',
  'shadow-fang': 'nightglass-fang',
  'storm-bow': 'skyreach-bow',
  'archmage-rod': 'starfall-rod',
  'thunder-maul': 'titan-maul',
  dragonhide: 'wyrmscale',
  'archon-robe': 'astral-robe',
  'aegis-plate': 'bastion-plate',
};
export const ITEM_LIST = list;
/** Inventory groups (Party → Inventory); everything else is Equipment. */
export const INVENTORY_KINDS = { consumable: 'Supplies', good: 'Goods', keepsake: 'Keepsakes' };
/** What an item sells for (goods at full price, keepsakes never). */
export function sellValue(item) {
  if (!item || item.kind === 'keepsake') return 0;
  return item.kind === 'good' ? item.price : Math.floor(item.price * 0.5);
}
export const GEAR_SLOTS = ['weapon', 'armor', 'accessory'];

/** The accessory slot holds 'artifact:<id>' when a guild artifact is worn. */
export const ARTIFACT_PREFIX = 'artifact:';

/** Whether a class may wear it (and, given a level, whether the hero is high enough). */
export function canEquip(item, classId, level) {
  if (!item || !GEAR_SLOTS.includes(item.kind)) return false;
  if (level !== undefined && (item.level || 1) > level) return false;
  return !item.classes || item.classes.includes(classId);
}

/** The highest gear level each shop stocks (others by the town's tier: Regional 5, National 35, Global 50). */
export const SHOP_GEAR_LEVEL = { dunmere: 5, greenhollow: 5, ironford: 20, windmere: 20, Regional: 5, National: 35, Global: 50 };
/** Pieces a shop shows above its level: a goal to save for. */
export const SHOWPIECES = { dunmere: ['plate-armor'], greenhollow: ['longbow'], ironford: ['mithril-blade'], windmere: ['archon-robe'] };

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
