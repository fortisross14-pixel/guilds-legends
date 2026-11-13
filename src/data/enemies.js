// Regional enemy rosters and bosses. Missions draw enemies from their region's
// roster (scaled by difficulty and risk). Every enemy is a person; its sprite is
// `foe.<id>` (battle: asset battle.foe.<id>), made by scripts/art/import_myart.py.

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

// [id, name, role, abilities]. Every foe is a person (there are no monsters): bandits,
// zealots, elemental adepts (fire, frost, storm, tide), the Veil's hollow dead. Each
// has its own battle and map sprite, `foe.<id>`, assembled from HeroEditor parts
// (recipes in scripts/art/foes.py).
const ROSTERS = {
  Crownlands: [
    ['road-bandit', 'Road Bandit', 'swift', ['backstab']],
    ['wolfskin', 'Wolfskin Raider', 'brute', ['lunge']],
    ['hedge-witch', 'Hedge Witch', 'caster', ['bolt', 'sleep']],
    ['field-priest', 'Renegade Priest', 'healer', ['cure', 'war-chant']],
    ['shield-thug', 'Shield Thug', 'tank', ['taunt']],
  ],
  'Verdant Marches': [
    ['thorn-stalker', 'Thorn Stalker', 'swift', ['poison-arrow']],
    ['bark-brute', 'Barkhide Brute', 'brute', ['shield-bash']],
    ['spore-caller', 'Spore Caller', 'caster', ['storm', 'sleep']],
    ['grove-mender', 'Grove Mender', 'healer', ['cure', 'renew']],
    ['moss-warden', 'Moss Warden', 'tank', ['bulwark']],
  ],
  'Ember Coast': [
    ['reef-raider', 'Reef Raider', 'swift', ['venom']],
    ['shell-guard', 'Shell Guard', 'tank', ['taunt']],
    ['tide-caller', 'Tide Caller', 'caster', ['bolt', 'storm']],
    ['brine-cleric', 'Brine Cleric', 'healer', ['cure']],
    ['harbor-brute', 'Harbor Brute', 'brute', ['lunge']],
    ['sea-hag', 'Sea Hag', 'caster', ['sleep']],
  ],
  'Sun Kingdoms': [
    ['ash-runner', 'Ash Runner', 'swift', ['lunge']],
    ['pyre-zealot', 'Pyre Zealot', 'caster', ['bolt', 'storm']],
    ['sun-templar', 'Sun Templar', 'tank', ['bulwark']],
    ['ember-acolyte', 'Ember Acolyte', 'healer', ['cura']],
    ['arena-brute', 'Arena Brute', 'brute', ['shield-bash']],
  ],
  'Storm Isles': [
    ['gale-skirmisher', 'Gale Skirmisher', 'swift', ['aimed-shot']],
    ['storm-adept', 'Storm Adept', 'caster', ['storm', 'greater-bolt']],
    ['cliff-brute', 'Cliff Brute', 'brute', ['lunge']],
    ['wind-shaman', 'Wind Shaman', 'healer', ['cure']],
    ['thunder-shield', 'Thunder Shield', 'tank', ['taunt']],
  ],
  'Frost Frontier': [
    ['frost-reaver', 'Frost Reaver', 'swift', ['lunge']],
    ['tusk-brute', 'Tusk Berserker', 'brute', ['shield-bash']],
    ['rime-seer', 'Rime Seer', 'caster', ['sleep', 'bolt']],
    ['rime-mother', 'Rime Mother', 'healer', ['cura']],
    ['frostbound', 'Frostbound', 'tank', ['earthshaker']],
  ],
  'The Far Veil': [
    ['veil-wraith', 'Veil Wraith', 'swift', ['backstab', 'venom']],
    ['mind-thief', 'Mind Thief', 'caster', ['mind-spike']],
    ['hollow-knight', 'Hollow Knight', 'tank', ['bulwark']],
    ['dream-weaver', 'Dream Weaver', 'healer', ['cura', 'renew']],
    ['void-juggernaut', 'Void Juggernaut', 'brute', ['earthshaker']],
  ],
};

/**
 * What each kind of foe can leave behind (docs/design/ITEMS.md): { item, chance } per foe,
 * rolled for every one beaten. "Bring three wolf pelts" means "beat Wolfskins".
 */
export const FOE_DROPS = {
  wolfskin: [{ item: 'wolf-pelt', chance: 0.75 }, { item: 'wolfskin-vest', chance: 0.06 }],
  'road-bandit': [{ item: 'bandit-dagger', chance: 0.35 }, { item: 'liquor', chance: 0.2 }, { item: 'hunting-knife', chance: 0.05 }],
  'shield-thug': [{ item: 'liquor', chance: 0.3 }, { item: 'rusty-sword', chance: 0.07 }],
  'hedge-witch': [{ item: 'feverfew', chance: 0.5 }],
  'field-priest': [{ item: 'liquor', chance: 0.25 }, { item: 'feverfew', chance: 0.25 }],
  'thorn-stalker': [{ item: 'poacher-snare', chance: 0.6 }, { item: 'hunting-knife', chance: 0.05 }],
  'bark-brute': [{ item: 'poacher-snare', chance: 0.3 }],
  'spore-caller': [{ item: 'feverfew', chance: 0.4 }],
  'harbor-brute': [{ item: 'liquor', chance: 0.3 }],
  'reef-raider': [{ item: 'sea-purple', chance: 0.25 }],
  'cliff-brute': [{ item: 'woad', chance: 0.25 }],
};

export const REGION_ENEMIES = Object.fromEntries(
  Object.entries(ROSTERS).map(([region, rows]) => [
    region,
    rows.map(([id, name, role, skills]) => ({ id, name, role, sprite: `foe.${id}`, skills })),
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
    sprite: 'foe.boss-oswin',
    skills: ['boss-hollow-oath', 'shield-bash'],
    trophy: 'oswin-signet',
    intro: '“Another banner come to rot on my road?”',
  },
  'Verdant Marches': {
    id: 'boss-briarmother',
    name: 'The Briarmother',
    role: 'healer',
    sprite: 'foe.boss-briarmother',
    skills: ['boss-thorn-bloom', 'cura'],
    trophy: 'briar-crown',
    intro: '“The forest remembers every axe.”',
  },
  'Ember Coast': {
    id: 'boss-maelra',
    name: 'Maelra of the Deep',
    role: 'caster',
    sprite: 'foe.boss-maelra',
    skills: ['boss-undertow', 'storm'],
    trophy: 'tide-pearl',
    intro: '“Come closer, little sailors. The water is warm.”',
  },
  'Sun Kingdoms': {
    id: 'boss-pyrelord',
    name: 'Pyrelord Kassad',
    role: 'caster',
    sprite: 'foe.boss-pyrelord',
    skills: ['boss-solar-flare', 'bolt'],
    trophy: 'sun-sigil',
    intro: '“Kneel, and burn with dignity.”',
  },
  'Storm Isles': {
    id: 'boss-tempest',
    name: 'Ysra the Tempest',
    role: 'swift',
    sprite: 'foe.boss-tempest',
    skills: ['boss-gale-wing', 'aimed-shot'],
    trophy: 'roc-feather',
    intro: 'Ysra laughs into the wind. Lightning crawls along both her blades.',
  },
  'Frost Frontier': {
    id: 'boss-jarnvald',
    name: 'Jarnvald the Unthawed',
    role: 'tank',
    sprite: 'foe.boss-jarnvald',
    skills: ['boss-glacier', 'earthshaker'],
    trophy: 'frost-heart',
    intro: '“Winter does not hurry. Neither do I.”',
  },
  'The Far Veil': {
    id: 'boss-nameless',
    name: 'The Nameless Chorus',
    role: 'caster',
    sprite: 'foe.boss-nameless',
    skills: ['boss-chorus', 'mind-spike'],
    trophy: 'veil-mask',
    intro: 'A masked figure opens its mouth, and many voices speak at once. All of them are yours.',
  },
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
    sprite: 'foe.grey-alpha',
    skills: ['lunge'],
    intro: 'A scarred raider in a grey wolf’s pelt rises from the mud, twice the size of his gang. His eyes find the weakest of you.',
    phases: [{ at: 0.5, banner: 'The Alpha howls, and the Wolfskins answer!', summon: { type: 'wolfskin', count: 2 } }],
  },
  // Dawnwatch Temple, at the west end of the Old Road: a fallen priest holds its gate.
  'ash-abbot': {
    id: 'ash-abbot',
    name: 'Brother Malric, the Ash Abbot',
    role: 'caster',
    sprite: 'foe.ash-abbot',
    skills: ['greater-bolt', 'sleep'],
    intro: '“The Dawn went out of this temple years ago. I keep its doors now, and they open for coin.”',
    phases: [{ at: 0.5, banner: 'Malric calls his acolytes from the cloister!', summon: { type: 'field-priest', count: 1 } }],
  },
  'bandit-captain': {
    id: 'bandit-captain',
    name: 'Captain Vask',
    role: 'tank',
    sprite: 'foe.bandit-captain',
    skills: ['taunt', 'shield-bash', 'blade-dance'],
    intro: '“Shields up, lads. Let them tire themselves out.”',
    phases: [{ at: 0.5, banner: 'Vask throws the shield aside: “Enough. Cut them down!”', profile: 'brute', statuses: { atkUp: 9 }, areaSkill: 'blade-dance' }],
  },
  'lantern-brood': {
    id: 'lantern-brood',
    name: 'The Lantern-eater',
    role: 'tank',
    sprite: 'foe.lantern-brood',
    skills: ['boss-lantern-eater', 'bulwark'],
    intro: 'A hooded warlock stands in a ring of dead lanterns, drinking the last of their light.',
    charge: { skill: 'lantern-nova', every: 4 },
    phases: [{ at: 0.5, banner: 'The stolen light swells in his hands. He draws breath faster now.', profile: 'caster', charge: { skill: 'lantern-nova', every: 2 } }],
  },
};

export const BOSS_LIST = Object.values(BOSSES);

/** Every roster type by id (for summons and wild groups). */
export const ENEMY_TYPES = Object.fromEntries(Object.values(REGION_ENEMIES).flat().map((enemy) => [enemy.id, enemy]));

export function regionRoster(region) {
  return REGION_ENEMIES[region] || REGION_ENEMIES.Crownlands;
}
