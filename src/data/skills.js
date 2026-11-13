// Skills, unlocked by level (docs/design/STORY_DRAFT.md, Levels). Used by src/game/combat.js.
// A hero learns from four sources (heroSkillTree):
//   class      levels 1, 4–5, ~20, ~35 (level 99: kept for enemies only, never learned by heroes)
//   element    levels 10, 25, 40 (by the hero's primal)
//   character  levels 15, 29 (by the hero's personality)
//   ultimate   level 48: one of three, chosen by the player (hero.ultimate)
//
// target: 'enemy' | 'allEnemies' | 'ally' | 'allAllies' | 'self' | 'koAlly'
// effect: 'damage' | 'heal' | 'buff' | 'status' | 'revive' | 'cure' | 'steal'
// physical: damage uses attack vs defense; otherwise magic vs reduced defense.
// status: { type: 'stun' | 'poison' | 'burn' | 'atkUp' | 'atkDown' | 'regen' | 'taunt' | 'guard', turns, chance } (see STATUSES)
// Damage spells use the caster's primal for primal advantage ("Fire Bolt" for a Fire mage).

/**
 * Battle statuses. Turns count down at the end of each round (stun counts
 * down when it costs a turn). icon is a short glyph shown on unit plates.
 */
export const STATUSES = {
  poison: { label: 'Poison', icon: '☠', bad: true, description: 'Loses 8% of max HP at the end of each round.' },
  burn: { label: 'Burn', icon: '♨', bad: true, description: 'Loses 10% of max HP at the end of each round.' },
  stun: { label: 'Stun', icon: '✷', bad: true, description: 'Loses its next turn. Stunning a charging foe interrupts it.' },
  atkDown: { label: 'Attack down', icon: '▼', bad: true, description: 'Deals 30% less damage.' },
  atkUp: { label: 'Attack up', icon: '▲', bad: false, description: 'Deals 30% more damage.' },
  guard: { label: 'Guard', icon: '◆', bad: false, description: 'Takes half damage.' },
  regen: { label: 'Regen', icon: '✚', bad: false, description: 'Recovers 8% of max HP at the end of each round.' },
  taunt: { label: 'Taunt', icon: '!', bad: false, description: 'Enemies must target this unit. Also guards.' },
};

const list = [
  // Guardian: protect the line.
  {
    id: 'shield-bash',
    classId: 'Guardian',
    level: 1,
    name: 'Shield Bash',
    mp: 4,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 1.0,
    status: { type: 'stun', turns: 1, chance: 0.35 },
    description: 'A heavy blow that may stun.',
  },
  {
    id: 'taunt',
    classId: 'Guardian',
    level: 4,
    name: 'Taunt',
    mp: 4,
    target: 'self',
    effect: 'buff',
    status: { type: 'taunt', turns: 2, chance: 1 },
    description: 'Enemies must attack you for 2 rounds. You also guard.',
  },
  {
    id: 'rally',
    classId: 'Guardian',
    level: 20,
    name: 'Rally',
    mp: 8,
    target: 'allAllies',
    effect: 'buff',
    status: { type: 'atkUp', turns: 3, chance: 1 },
    description: 'The whole party hits harder for 3 rounds.',
  },
  {
    id: 'bulwark',
    classId: 'Guardian',
    level: 99,
    name: 'Bulwark',
    mp: 10,
    target: 'allAllies',
    effect: 'buff',
    status: { type: 'guard', turns: 1, chance: 1 },
    description: 'The whole party guards this round.',
  },
  {
    id: 'earthshaker',
    classId: 'Guardian',
    level: 35,
    name: 'Earthshaker',
    mp: 16,
    target: 'allEnemies',
    effect: 'damage',
    physical: true,
    power: 0.9,
    status: { type: 'stun', turns: 1, chance: 0.2 },
    description: 'Strike every enemy; may stun.',
  },

  // Duelist: precise single-target damage.
  {
    id: 'lunge',
    classId: 'Duelist',
    level: 1,
    name: 'Lunge',
    mp: 3,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 1.4,
    description: 'A fast, strong thrust.',
  },
  {
    id: 'disarm',
    classId: 'Duelist',
    level: 5,
    name: 'Disarm',
    mp: 5,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 0.8,
    status: { type: 'stun', turns: 1, chance: 0.45 },
    description: 'May interrupt the target’s next move.',
  },
  {
    id: 'blade-dance',
    classId: 'Duelist',
    level: 99,
    name: 'Blade Dance',
    mp: 10,
    target: 'allEnemies',
    effect: 'damage',
    physical: true,
    power: 0.8,
    description: 'Cut through every enemy.',
  },
  {
    id: 'flurry',
    classId: 'Duelist',
    level: 20,
    name: 'Flurry',
    mp: 12,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 2.2,
    description: 'A storm of strikes on one foe.',
  },
  {
    id: 'finale',
    classId: 'Duelist',
    level: 35,
    name: 'Finale',
    mp: 18,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 3.0,
    description: 'A finishing blow.',
  },

  // Ranger: ranged pressure and poison.
  {
    id: 'aimed-shot',
    classId: 'Ranger',
    level: 1,
    name: 'Aimed Shot',
    mp: 3,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 1.4,
    description: 'A careful, strong shot.',
  },
  {
    id: 'poison-arrow',
    classId: 'Ranger',
    level: 4,
    name: 'Poison Arrow',
    mp: 5,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 0.8,
    status: { type: 'poison', turns: 3, chance: 0.85 },
    description: 'Poisons the target for 3 rounds.',
  },
  {
    id: 'volley',
    classId: 'Ranger',
    level: 20,
    name: 'Volley',
    mp: 9,
    target: 'allEnemies',
    effect: 'damage',
    physical: true,
    power: 0.75,
    description: 'Arrows rain on every enemy.',
  },
  {
    id: 'pinning-shot',
    classId: 'Ranger',
    level: 99,
    name: 'Pinning Shot',
    mp: 8,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 1.2,
    status: { type: 'stun', turns: 1, chance: 0.45 },
    description: 'May pin the target in place.',
  },
  {
    id: 'arrow-storm',
    classId: 'Ranger',
    level: 35,
    name: 'Arrow Storm',
    mp: 16,
    target: 'allEnemies',
    effect: 'damage',
    physical: true,
    power: 1.2,
    description: 'A storm of arrows on every enemy.',
  },

  // Rogue: backstabs, theft and poison.
  {
    id: 'backstab',
    classId: 'Rogue',
    level: 1,
    name: 'Backstab',
    mp: 4,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 1.5,
    description: 'Deals double damage to a stunned, poisoned or exposed target.',
  },
  {
    id: 'steal',
    classId: 'Rogue',
    level: 5,
    name: 'Steal',
    mp: 3,
    target: 'enemy',
    effect: 'steal',
    physical: true,
    power: 0.6,
    description: 'A light hit with a chance to steal a potion.',
  },
  {
    id: 'venom',
    classId: 'Rogue',
    level: 99,
    name: 'Venom',
    mp: 6,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 0.5,
    status: { type: 'poison', turns: 4, chance: 1 },
    description: 'Poisons the target for 4 rounds.',
  },
  {
    id: 'shadowstep',
    classId: 'Rogue',
    level: 20,
    name: 'Shadowstep',
    mp: 10,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 2.2,
    status: { type: 'atkDown', turns: 2, chance: 0.6 },
    description: 'Strike from the shadows; may weaken the target.',
  },
  {
    id: 'assassinate',
    classId: 'Rogue',
    level: 35,
    name: 'Assassinate',
    mp: 16,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 3.0,
    description: 'A lethal strike.',
  },

  // Cleric: healing, cleansing, revival.
  { id: 'cure', classId: 'Cleric', level: 1, name: 'Cure', mp: 4, target: 'ally', effect: 'heal', power: 0.9, description: 'Heal one ally.' },
  {
    id: 'renew',
    classId: 'Cleric',
    level: 4,
    name: 'Renew',
    mp: 5,
    target: 'ally',
    effect: 'buff',
    status: { type: 'regen', turns: 3, chance: 1 },
    description: 'One ally regains HP each round for 3 rounds.',
  },
  {
    id: 'purify',
    classId: 'Cleric',
    level: 99,
    name: 'Purify',
    mp: 3,
    target: 'ally',
    effect: 'cure',
    power: 0.3,
    description: 'Remove poison and stun, with a small heal.',
  },
  { id: 'cura', classId: 'Cleric', level: 20, name: 'Cura', mp: 9, target: 'allAllies', effect: 'heal', power: 0.7, description: 'Heal the whole party.' },
  {
    id: 'raise',
    classId: 'Cleric',
    level: 35,
    name: 'Raise',
    mp: 14,
    target: 'koAlly',
    effect: 'revive',
    power: 0.4,
    description: 'Revive a fallen ally at 40% HP.',
  },
  {
    id: 'holy',
    classId: 'Cleric',
    level: 99,
    name: 'Holy',
    mp: 14,
    target: 'enemy',
    effect: 'damage',
    physical: false,
    power: 2.0,
    description: 'Searing light on one foe.',
  },
  {
    id: 'curaga',
    classId: 'Cleric',
    level: 99,
    name: 'Curaga',
    mp: 20,
    target: 'allAllies',
    effect: 'heal',
    power: 1.4,
    description: 'A great heal for the whole party.',
  },

  // Mage: elemental spells (element = the mage's primal).
  {
    id: 'bolt',
    classId: 'Mage',
    level: 1,
    name: 'Bolt',
    mp: 4,
    target: 'enemy',
    effect: 'damage',
    physical: false,
    power: 1.4,
    elemental: true,
    description: 'A primal bolt on one foe.',
  },
  {
    id: 'storm',
    classId: 'Mage',
    level: 5,
    name: 'Storm',
    mp: 10,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 0.9,
    elemental: true,
    description: 'A primal storm on every enemy.',
  },
  {
    id: 'sleep',
    classId: 'Mage',
    level: 99,
    name: 'Sleep',
    mp: 8,
    target: 'enemy',
    effect: 'status',
    status: { type: 'stun', turns: 2, chance: 0.6 },
    description: 'May put the target to sleep for 2 rounds.',
  },
  {
    id: 'greater-bolt',
    classId: 'Mage',
    level: 20,
    name: 'Greater Bolt',
    mp: 12,
    target: 'enemy',
    effect: 'damage',
    physical: false,
    power: 2.4,
    elemental: true,
    description: 'A powerful primal bolt.',
  },
  {
    id: 'meteor',
    classId: 'Mage',
    level: 35,
    name: 'Meteor',
    mp: 24,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 2.0,
    elemental: true,
    description: 'Devastation on every enemy.',
  },

  // Scholar: buffs, weaknesses and support.
  {
    id: 'insight',
    classId: 'Scholar',
    level: 1,
    name: 'Insight',
    mp: 3,
    target: 'ally',
    effect: 'buff',
    status: { type: 'atkUp', turns: 3, chance: 1 },
    description: 'One ally hits harder for 3 rounds.',
  },
  {
    id: 'expose',
    classId: 'Scholar',
    level: 4,
    name: 'Sap Strength',
    mp: 4,
    target: 'enemy',
    effect: 'status',
    status: { type: 'atkDown', turns: 3, chance: 0.9 },
    description: 'Cuts the target’s attack by 30% for 3 rounds.',
  },
  { id: 'mend', classId: 'Scholar', level: 99, name: 'Mend', mp: 6, target: 'ally', effect: 'heal', power: 0.7, description: 'Heal one ally.' },
  {
    id: 'battle-plan',
    classId: 'Scholar',
    level: 20,
    name: 'Battle Plan',
    mp: 10,
    target: 'allAllies',
    effect: 'buff',
    status: { type: 'atkUp', turns: 3, chance: 1 },
    description: 'The whole party hits harder for 3 rounds.',
  },
  {
    id: 'mind-spike',
    classId: 'Scholar',
    level: 35,
    name: 'Mind Spike',
    mp: 12,
    target: 'enemy',
    effect: 'damage',
    physical: false,
    power: 2.0,
    status: { type: 'stun', turns: 1, chance: 0.3 },
    description: 'Psychic damage that may stun.',
  },

  // Artificer: gadgets and explosives.
  {
    id: 'flash-charge',
    classId: 'Artificer',
    level: 1,
    name: 'Flash Charge',
    mp: 4,
    target: 'enemy',
    effect: 'damage',
    physical: false,
    power: 0.9,
    status: { type: 'stun', turns: 1, chance: 0.4 },
    description: 'A blinding blast that may stun.',
  },
  {
    id: 'bomb-toss',
    classId: 'Artificer',
    level: 5,
    name: 'Bomb Toss',
    mp: 7,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 0.8,
    status: { type: 'burn', turns: 2, chance: 0.3 },
    description: 'Explosives hit every enemy and may set them burning.',
  },
  { id: 'repair-kit', classId: 'Artificer', level: 99, name: 'Field Kit', mp: 6, target: 'ally', effect: 'heal', power: 0.8, description: 'Patch up one ally.' },
  {
    id: 'overclock',
    classId: 'Artificer',
    level: 20,
    name: 'Overclock',
    mp: 10,
    target: 'ally',
    effect: 'buff',
    status: { type: 'atkUp', turns: 4, chance: 1 },
    description: 'One ally hits harder for 4 rounds.',
  },
  {
    id: 'cannon',
    classId: 'Artificer',
    level: 35,
    name: 'Hand Cannon',
    mp: 16,
    target: 'enemy',
    effect: 'damage',
    physical: false,
    power: 2.8,
    description: 'A massive single shot.',
  },
];

// Boss abilities (classId 'Boss'): one unique move per regional boss and the Blackwood finale.
list.push(
  {
    id: 'boss-hollow-oath',
    classId: 'Boss',
    level: 1,
    name: 'Hollow Oath',
    mp: 6,
    target: 'allEnemies',
    effect: 'damage',
    physical: true,
    power: 1.1,
    status: { type: 'atkDown', turns: 2, chance: 0.5 },
    description: 'A cursed sweep that saps strength.',
  },
  {
    id: 'boss-thorn-bloom',
    classId: 'Boss',
    level: 1,
    name: 'Thorn Bloom',
    mp: 6,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 0.8,
    status: { type: 'poison', turns: 3, chance: 0.7 },
    description: 'Thorns erupt and poison everyone.',
  },
  {
    id: 'boss-undertow',
    classId: 'Boss',
    level: 1,
    name: 'Undertow',
    mp: 6,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 1.0,
    status: { type: 'stun', turns: 1, chance: 0.35 },
    description: 'A crushing wave that may stun.',
  },
  {
    id: 'boss-solar-flare',
    classId: 'Boss',
    level: 1,
    name: 'Solar Flare',
    mp: 8,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 1.4,
    description: 'Blinding fire on the whole party.',
  },
  {
    id: 'boss-gale-wing',
    classId: 'Boss',
    level: 1,
    name: 'Gale Wing',
    mp: 5,
    target: 'enemy',
    effect: 'damage',
    physical: true,
    power: 2.2,
    description: 'A diving strike on one hero.',
  },
  {
    id: 'boss-glacier',
    classId: 'Boss',
    level: 1,
    name: 'Glacier',
    mp: 6,
    target: 'self',
    effect: 'buff',
    status: { type: 'guard', turns: 1, chance: 1 },
    description: 'Ice armor: halves damage this round.',
  },
  {
    id: 'boss-chorus',
    classId: 'Boss',
    level: 1,
    name: 'Discordant Chorus',
    mp: 7,
    target: 'allEnemies',
    effect: 'status',
    status: { type: 'stun', turns: 1, chance: 0.45 },
    description: 'Voices that freeze the mind.',
  },
  {
    id: 'boss-lantern-eater',
    classId: 'Boss',
    level: 1,
    name: 'Lantern Eater',
    mp: 8,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 1.3,
    status: { type: 'atkDown', turns: 2, chance: 0.6 },
    description: 'It drinks the light, and the strength, from the party.',
  },
);

// Enemy-only abilities (classId 'Enemy'): healer support and the charged boss attack.
list.push(
  {
    id: 'war-chant',
    classId: 'Enemy',
    level: 1,
    name: 'War Chant',
    mp: 5,
    target: 'allAllies',
    effect: 'buff',
    status: { type: 'atkUp', turns: 3, chance: 1 },
    description: 'Every ally hits harder for 3 rounds.',
  },
  {
    id: 'lantern-nova',
    classId: 'Enemy',
    level: 1,
    name: 'Lantern Nova',
    mp: 0,
    target: 'allEnemies',
    effect: 'damage',
    physical: false,
    power: 2.1,
    status: { type: 'burn', turns: 2, chance: 0.5 },
    charged: true,
    description: 'Released after a round of charging. Defend to halve it; stun or hit hard to interrupt the charge.',
  },
);


// ---------------------------------------------------------------- element skills (10, 25, 40)
const el = (id, element, level, name, mp, target, effect, extra, description) => ({ id, classId: 'Element', element, elemental: effect === 'damage', level, name, mp, target, effect, ...extra, description });
list.push(
  el('cinder-lash', 'Fire', 10, 'Cinder Lash', 6, 'enemy', 'damage', { power: 1.3, status: { type: 'burn', turns: 2, chance: 0.4 } }, 'A whip of fire that may set them burning.'),
  el('firestorm', 'Fire', 25, 'Firestorm', 12, 'allEnemies', 'damage', { power: 1.0, status: { type: 'burn', turns: 2, chance: 0.3 } }, 'Fire across every enemy.'),
  el('sunfall', 'Fire', 40, 'Sunfall', 20, 'allEnemies', 'damage', { power: 1.7, status: { type: 'burn', turns: 3, chance: 0.5 } }, 'The sky itself burns down on them.'),
  el('riptide', 'Water', 10, 'Riptide', 6, 'enemy', 'damage', { power: 1.3, status: { type: 'stun', turns: 1, chance: 0.25 } }, 'A pull of water that may knock them off their feet.'),
  el('healing-rain', 'Water', 25, 'Healing Rain', 12, 'allAllies', 'heal', { power: 0.6 }, 'Soft rain that heals the whole party.'),
  el('deluge', 'Water', 40, 'Deluge', 20, 'allEnemies', 'damage', { power: 1.7 }, 'A wall of water over every enemy.'),
  el('gust', 'Air', 10, 'Gust', 6, 'enemy', 'damage', { power: 1.2, status: { type: 'stun', turns: 1, chance: 0.3 } }, 'A blast of wind that may stagger them.'),
  el('thunderclap', 'Air', 25, 'Thunderclap', 12, 'allEnemies', 'damage', { power: 1.1, status: { type: 'stun', turns: 1, chance: 0.2 } }, 'Thunder over every enemy; some may reel.'),
  el('tempest', 'Air', 40, 'Tempest', 20, 'allEnemies', 'damage', { power: 1.8 }, 'A storm that tears through their line.'),
  el('thornwhip', 'Plant', 10, 'Thornwhip', 6, 'enemy', 'damage', { power: 1.2, status: { type: 'poison', turns: 3, chance: 0.5 } }, 'A lash of thorns that may poison.'),
  el('overgrowth', 'Plant', 25, 'Overgrowth', 12, 'allAllies', 'buff', { status: { type: 'regen', turns: 3, chance: 1 } }, 'Green life knits the whole party for 3 rounds.'),
  el('worldroot', 'Plant', 40, 'Worldroot', 20, 'allEnemies', 'damage', { power: 1.5, status: { type: 'poison', turns: 3, chance: 0.5 } }, 'Roots burst from the ground under every enemy.'),
  el('iron-skin', 'Iron', 10, 'Iron Skin', 6, 'self', 'buff', { status: { type: 'guard', turns: 2, chance: 1 } }, 'Skin like plate for 2 rounds.'),
  el('shrapnel', 'Iron', 25, 'Shrapnel', 12, 'allEnemies', 'damage', { physical: true, power: 1.1 }, 'A burst of steel into every enemy.'),
  el('juggernaut', 'Iron', 40, 'Juggernaut', 20, 'enemy', 'damage', { physical: true, power: 2.6 }, 'An unstoppable blow.'),
  el('feral-bite', 'Animal', 10, 'Feral Bite', 6, 'enemy', 'damage', { physical: true, power: 1.4 }, 'Teeth and claws, or near enough.'),
  el('pack-howl', 'Animal', 25, 'Pack Howl', 12, 'allAllies', 'buff', { status: { type: 'atkUp', turns: 3, chance: 1 } }, 'The whole party hunts harder for 3 rounds.'),
  el('primal-rampage', 'Animal', 40, 'Primal Rampage', 20, 'allEnemies', 'damage', { physical: true, power: 1.6 }, 'A rampage through every enemy.'),
  el('mind-prick', 'Psychic', 10, 'Mind Prick', 6, 'enemy', 'damage', { power: 1.2, status: { type: 'atkDown', turns: 2, chance: 0.6 } }, 'A needle in the mind that weakens their blows.'),
  el('dread-vision', 'Psychic', 25, 'Dread Vision', 12, 'allEnemies', 'status', { status: { type: 'stun', turns: 1, chance: 0.35 } }, 'Every enemy sees its death; some freeze.'),
  el('mindbreak', 'Psychic', 40, 'Mindbreak', 20, 'allEnemies', 'damage', { power: 1.6, status: { type: 'atkDown', turns: 2, chance: 0.5 } }, 'Their thoughts shatter.'),
);

// ---------------------------------------------------------------- character skills (15, 29): by personality
const ch = (id, personality, level, name, mp, target, effect, extra, description) => ({ id, classId: 'Character', personality, level, name, mp, target, effect, ...extra, description });
list.push(
  ch('stand-fast', 'Brave', 15, 'Stand Fast', 8, 'self', 'buff', { status: { type: 'atkUp', turns: 3, chance: 1 } }, 'Plant your feet and fight harder.'),
  ch('brave-charge', 'Brave', 29, 'Charge of the Brave', 16, 'allEnemies', 'damage', { physical: true, power: 1.2 }, 'Straight at all of them.'),
  ch('showboat', 'Vain', 15, 'Showboat', 8, 'self', 'buff', { status: { type: 'atkUp', turns: 3, chance: 1 } }, 'Play to the crowd; hit harder for it.'),
  ch('crowd-pleaser', 'Vain', 29, 'Crowd Pleaser', 16, 'enemy', 'damage', { physical: true, power: 2.0 }, 'A flourish that ends badly for them.'),
  ch('bide', 'Patient', 15, 'Bide', 8, 'self', 'buff', { status: { type: 'regen', turns: 3, chance: 1 } }, 'Breathe, wait, recover.'),
  ch('perfect-moment', 'Patient', 29, 'The Perfect Moment', 16, 'enemy', 'damage', { power: 2.3 }, 'Wait for it. Then strike.'),
  ch('spite', 'Jealous', 15, 'Spite', 8, 'enemy', 'status', { status: { type: 'atkDown', turns: 3, chance: 0.9 } }, 'Make sure they don’t shine either.'),
  ch('spotlight', 'Jealous', 29, 'Steal the Spotlight', 16, 'enemy', 'damage', { physical: true, power: 1.9, status: { type: 'stun', turns: 1, chance: 0.3 } }, 'Their moment, taken.'),
  ch('mercy', 'Merciful', 15, 'Mercy', 8, 'ally', 'heal', { power: 0.9 }, 'Tend a friend in the thick of it.'),
  ch('grace', 'Merciful', 29, 'Grace', 16, 'allAllies', 'heal', { power: 0.7 }, 'Kindness for the whole party.'),
  ch('study-foe', 'Obsessive', 15, 'Study the Foe', 8, 'enemy', 'status', { status: { type: 'atkDown', turns: 3, chance: 1 } }, 'Learn their every habit.'),
  ch('relentless', 'Obsessive', 29, 'Relentless', 16, 'enemy', 'damage', { physical: true, power: 2.2 }, 'Again. And again. And again.'),
  ch('brace', 'Cautious', 15, 'Brace', 8, 'self', 'buff', { status: { type: 'guard', turns: 2, chance: 1 } }, 'Take no chances for 2 rounds.'),
  ch('measured-strike', 'Cautious', 29, 'Measured Strike', 16, 'enemy', 'damage', { physical: true, power: 1.9 }, 'Exactly as hard as needed. Which is very.'),
  ch('jest', 'Witty', 15, 'Taunting Jest', 8, 'enemy', 'status', { status: { type: 'atkDown', turns: 2, chance: 0.9 } }, 'A joke that throws them off.'),
  ch('sharp-tongue', 'Witty', 29, 'Sharp Tongue', 16, 'allEnemies', 'status', { status: { type: 'atkDown', turns: 2, chance: 0.7 } }, 'Everyone gets a remark.'),
  ch('oath', 'Honorable', 15, 'Oath', 8, 'ally', 'buff', { status: { type: 'atkUp', turns: 3, chance: 1 } }, 'Swear it with them; they fight harder.'),
  ch('rally-line', 'Honorable', 29, 'Rally the Line', 16, 'allAllies', 'buff', { status: { type: 'atkUp', turns: 3, chance: 1 } }, 'The whole party fights for the oath.'),
  ch('quickstep', 'Restless', 15, 'Quickstep', 8, 'enemy', 'damage', { physical: true, power: 1.5 }, 'In and out before they turn.'),
  ch('whirlwind', 'Restless', 29, 'Whirlwind', 16, 'allEnemies', 'damage', { physical: true, power: 1.1 }, 'Everywhere at once.'),
);

// ---------------------------------------------------------------- ultimates (48): one of three, chosen
const ul = (id, name, target, effect, extra, description) => ({ id, classId: 'Ultimate', ultimate: true, level: 48, name, mp: 30, target, effect, ...extra, description });
list.push(
  ul('last-banner', 'The Last Banner', 'allAllies', 'heal', { power: 1.6 }, 'Every ally rises under the banner: a great heal for the whole party.'),
  ul('cataclysm', 'Cataclysm', 'allEnemies', 'damage', { power: 2.6, elemental: true }, 'The hero’s element unleashed on every enemy at once.'),
  ul('executioner', 'Executioner', 'enemy', 'damage', { physical: true, power: 5.0 }, 'One blow, and it is over.'),
);
export const ULTIMATES = ['last-banner', 'cataclysm', 'executioner'];
export const ULTIMATE_LEVEL = 48;

export const SKILLS = Object.fromEntries(list.map((skill) => [skill.id, skill]));

/** @type {Record<string, any[]>} */
export const CLASS_SKILLS = list.reduce((byClass, skill) => {
  (byClass[skill.classId] ||= []).push(skill);
  return byClass;
}, {});

/**
 * Everything a hero can learn, in level order: their class's skills, their element's, their
 * personality's, and the ultimate they chose (or, before choosing, none). `hero`: { classId, primal, personality, ultimate }.
 */
export function heroSkillTree(hero) {
  const classSkills = (CLASS_SKILLS[hero.classId] || CLASS_SKILLS.Guardian).filter((skill) => skill.level < 99);
  const element = (CLASS_SKILLS.Element || []).filter((skill) => skill.element === hero.primal);
  const character = (CLASS_SKILLS.Character || []).filter((skill) => skill.personality === hero.personality);
  const ultimate = hero.ultimate && SKILLS[hero.ultimate] ? [SKILLS[hero.ultimate]] : [];
  return [...classSkills, ...element, ...character, ...ultimate].sort((a, b) => a.level - b.level);
}

/** Skills a hero knows at their level, in unlock order. */
export function skillsForHero(hero) {
  return heroSkillTree(hero).filter((skill) => skill.level <= (hero.level || 1));
}

/** Skills a class knows at this level (enemies built from a class, with no personality or element). */
export function skillsForLevel(classId, level) {
  return (CLASS_SKILLS[classId] || CLASS_SKILLS.Guardian).filter((skill) => skill.level <= (level || 1));
}

/** Skills a hero newly learns going from levelBefore to levelAfter. */
export function skillsUnlockedFor(hero, levelBefore, levelAfter) {
  return heroSkillTree(hero).filter((skill) => skill.level > levelBefore && skill.level <= levelAfter);
}

/** Display name; elemental spells take the caster's primal ("Fire Bolt"). */
export function skillLabel(skill, primal) {
  return skill.elemental && primal && !skill.element && !skill.ultimate ? `${primal} ${skill.name}` : skill.name;
}
