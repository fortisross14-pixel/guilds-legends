// Regional enemy rosters and bosses. Missions draw enemies from their region's
// roster (scaled by difficulty and risk). Sprites are public/art/enemies/enemy_NN.png;
// with 16 images, types reuse sprites with different names, stats and primals.

/**
 * Stat multipliers, base class (for skills) and behavior profile per role.
 * Profiles (src/game/combat.js, planFor):
 *   brute       hits the hero with the lowest defense; enrages below 40% HP
 *   caster      casts at the hero weak to its primal; retreats behind allies when hurt
 *   healer      heals the most-damaged ally; buffs when everyone is healthy
 *   skirmisher  picks off the lowest-HP hero; may flee when left alone
 *   tank        guards allies and taunts
 */
export const ENEMY_ROLES = {
  brute: { classId: 'Guardian', profile: 'brute', mods: { hp: 1.15, atk: 1.25, def: 1, mag: 0.7, spd: 0.9 } },
  swift: { classId: 'Rogue', profile: 'skirmisher', mods: { hp: 0.85, atk: 1.05, def: 0.8, mag: 0.8, spd: 1.4 } },
  caster: { classId: 'Mage', profile: 'caster', mods: { hp: 0.8, atk: 0.7, def: 0.8, mag: 1.35, spd: 1 } },
  healer: { classId: 'Cleric', profile: 'healer', mods: { hp: 0.95, atk: 0.7, def: 0.9, mag: 1.1, spd: 0.95 } },
  tank: { classId: 'Guardian', profile: 'tank', mods: { hp: 1.5, atk: 0.85, def: 1.45, mag: 0.7, spd: 0.8 } },
};

/** Profile for enemies built from real heroes (rival guilds, duels). */
export const CLASS_PROFILES = { Guardian: 'tank', Duelist: 'brute', Ranger: 'skirmisher', Rogue: 'skirmisher', Cleric: 'healer', Mage: 'caster', Scholar: 'caster', Artificer: 'caster' };

// [id, name, role, sprite, abilities]
const ROSTERS = {
  Crownlands: [
    ['road-bandit', 'Road Bandit', 'swift', 1, ['backstab']],
    ['grey-wolf', 'Grey Wolf', 'brute', 2, ['lunge']],
    ['hedge-witch', 'Hedge Witch', 'caster', 3, ['bolt', 'sleep']],
    ['field-priest', 'Renegade Priest', 'healer', 4, ['cure', 'war-chant']],
    ['shield-thug', 'Shield Thug', 'tank', 5, ['taunt']],
  ],
  'Verdant Marches': [
    ['thorn-stalker', 'Thorn Stalker', 'swift', 6, ['poison-arrow']],
    ['bark-brute', 'Barkhide Brute', 'brute', 7, ['shield-bash']],
    ['spore-caller', 'Spore Caller', 'caster', 8, ['storm', 'sleep']],
    ['grove-mender', 'Grove Mender', 'healer', 9, ['cure', 'renew']],
    ['moss-golem', 'Moss Golem', 'tank', 10, ['bulwark']],
  ],
  'Ember Coast': [
    ['reef-raider', 'Reef Raider', 'swift', 11, ['venom']],
    ['deep-crab', 'Deep Crab', 'tank', 12, ['taunt']],
    ['tide-caller', 'Tide Caller', 'caster', 13, ['bolt', 'storm']],
    ['brine-cleric', 'Brine Cleric', 'healer', 14, ['cure']],
    ['harbor-brute', 'Harbor Brute', 'brute', 15, ['lunge']],
    ['sea-hag', 'Sea Hag', 'caster', 16, ['sleep']],
  ],
  'Sun Kingdoms': [
    ['ash-hound', 'Ash Hound', 'swift', 2, ['lunge']],
    ['pyre-zealot', 'Pyre Zealot', 'caster', 3, ['bolt', 'storm']],
    ['sun-templar', 'Sun Templar', 'tank', 5, ['bulwark']],
    ['ember-acolyte', 'Ember Acolyte', 'healer', 4, ['cura']],
    ['arena-brute', 'Arena Brute', 'brute', 7, ['shield-bash']],
  ],
  'Storm Isles': [
    ['gale-harpy', 'Gale Harpy', 'swift', 6, ['aimed-shot']],
    ['storm-adept', 'Storm Adept', 'caster', 8, ['storm', 'greater-bolt']],
    ['cliff-ogre', 'Cliff Ogre', 'brute', 10, ['lunge']],
    ['wind-shaman', 'Wind Shaman', 'healer', 9, ['cure']],
    ['thunder-shell', 'Thunder Shell', 'tank', 12, ['taunt']],
  ],
  'Frost Frontier': [
    ['dire-wolf', 'Dire Wolf', 'swift', 1, ['lunge']],
    ['tusk-brute', 'Tusk Brute', 'brute', 11, ['shield-bash']],
    ['rime-seer', 'Rime Seer', 'caster', 13, ['sleep', 'bolt']],
    ['herd-mother', 'Herd Mother', 'healer', 14, ['cura']],
    ['frost-giant', 'Frost Giant', 'tank', 15, ['earthshaker']],
  ],
  'The Far Veil': [
    ['veil-shade', 'Veil Shade', 'swift', 16, ['backstab', 'venom']],
    ['mind-leech', 'Mind Leech', 'caster', 3, ['mind-spike']],
    ['hollow-knight', 'Hollow Knight', 'tank', 5, ['bulwark']],
    ['dream-weaver', 'Dream Weaver', 'healer', 8, ['cura', 'renew']],
    ['void-hulk', 'Void Hulk', 'brute', 10, ['earthshaker']],
  ],
};

export const REGION_ENEMIES = Object.fromEntries(
  Object.entries(ROSTERS).map(([region, rows]) => [
    region,
    rows.map(([id, name, role, sprite, skills]) => ({ id, name, role, sprite: `enemy_${String(sprite).padStart(2, '0')}`, skills })),
  ]),
);

/**
 * One boss per region (plus the Blackwood finale, used by the story). A boss
 * contract appears once the guild is Known (100+) in that region.
 */
export const BOSSES = {
  Crownlands: {
    id: 'boss-oswin',
    name: 'Graveknight Oswin',
    role: 'brute',
    sprite: 'enemy_05',
    skills: ['boss-hollow-oath', 'shield-bash'],
    trophy: 'oswin-signet',
    intro: '“Another banner come to rot on my road?”',
  },
  'Verdant Marches': {
    id: 'boss-briarmother',
    name: 'The Briarmother',
    role: 'healer',
    sprite: 'enemy_09',
    skills: ['boss-thorn-bloom', 'cura'],
    trophy: 'briar-crown',
    intro: '“The forest remembers every axe.”',
  },
  'Ember Coast': {
    id: 'boss-maelra',
    name: 'Maelra of the Deep',
    role: 'caster',
    sprite: 'enemy_16',
    skills: ['boss-undertow', 'storm'],
    trophy: 'tide-pearl',
    intro: '“Come closer, little sailors. The water is warm.”',
  },
  'Sun Kingdoms': {
    id: 'boss-pyrelord',
    name: 'Pyrelord Kassad',
    role: 'caster',
    sprite: 'enemy_03',
    skills: ['boss-solar-flare', 'bolt'],
    trophy: 'sun-sigil',
    intro: '“Kneel, and burn with dignity.”',
  },
  'Storm Isles': {
    id: 'boss-tempest',
    name: 'Tempest Roc',
    role: 'swift',
    sprite: 'enemy_06',
    skills: ['boss-gale-wing', 'aimed-shot'],
    trophy: 'roc-feather',
    intro: 'A scream splits the sky. Lightning crawls along its wings.',
  },
  'Frost Frontier': {
    id: 'boss-jarnvald',
    name: 'Jarnvald the Unthawed',
    role: 'tank',
    sprite: 'enemy_15',
    skills: ['boss-glacier', 'earthshaker'],
    trophy: 'frost-heart',
    intro: '“Winter does not hurry. Neither do I.”',
  },
  'The Far Veil': {
    id: 'boss-nameless',
    name: 'The Nameless Chorus',
    role: 'caster',
    sprite: 'enemy_08',
    skills: ['boss-chorus', 'mind-spike'],
    trophy: 'veil-mask',
    intro: 'Many voices speak at once, and all of them are yours.',
  },
};

export const STORY_BOSS = {
  id: 'boss-hollow-warden',
  name: 'The Hollow Warden',
  role: 'tank',
  sprite: 'enemy_10',
  skills: ['boss-lantern-eater', 'earthshaker', 'bulwark'],
  trophy: null,
  intro: '“The Broken Lantern came here once. Its light still feeds me.”',
  charge: { skill: 'lantern-nova', every: 4 },
  phases: [{ at: 0.5, banner: 'The Warden’s lanterns blaze white. It charges faster now.', charge: { skill: 'lantern-nova', every: 2 }, statuses: { atkUp: 9 } }],
};

/**
 * Wild-area bosses with phase scripts. A phase starts when the boss drops
 * below `at` of its max HP: it shows `banner` and can summon allies, change
 * the boss's profile, add statuses, favour an area skill, or change the
 * charged attack (`charge`: charge for a round, then release the skill).
 */
export const AREA_BOSSES = {
  'grey-alpha': {
    id: 'grey-alpha',
    name: 'The Grey Alpha',
    role: 'brute',
    sprite: 'enemy_02',
    skills: ['lunge'],
    intro: 'A scarred wolf twice the size of the pack rises from the mud. Its eyes find the weakest of you.',
    phases: [{ at: 0.5, banner: 'The Alpha howls, and the pack answers!', summon: { type: 'grey-wolf', count: 2 } }],
  },
  'bandit-captain': {
    id: 'bandit-captain',
    name: 'Captain Vask',
    role: 'tank',
    sprite: 'enemy_05',
    skills: ['taunt', 'shield-bash', 'blade-dance'],
    intro: '“Shields up, lads. Let them tire themselves out.”',
    phases: [{ at: 0.5, banner: 'Vask throws the shield aside: “Enough. Cut them down!”', profile: 'brute', statuses: { atkUp: 9 }, areaSkill: 'blade-dance' }],
  },
  'lantern-brood': {
    id: 'lantern-brood',
    name: 'Brood of the Lantern-eater',
    role: 'tank',
    sprite: 'enemy_10',
    skills: ['boss-lantern-eater', 'bulwark'],
    intro: 'Lantern light gathers into a shape that remembers being hungry.',
    charge: { skill: 'lantern-nova', every: 4 },
    phases: [{ at: 0.5, banner: 'The light swells. It draws breath faster now.', profile: 'caster', charge: { skill: 'lantern-nova', every: 2 } }],
  },
};

export const BOSS_LIST = [...Object.values(BOSSES), STORY_BOSS];

/** Every roster type by id (for summons and wild groups). */
export const ENEMY_TYPES = Object.fromEntries(Object.values(REGION_ENEMIES).flat().map((enemy) => [enemy.id, enemy]));

export function regionRoster(region) {
  return REGION_ENEMIES[region] || REGION_ENEMIES.Crownlands;
}
