import { primalCombatModifier } from '../data/world.js';
import { normalizeClassId } from '../data/content.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(encounter, salt = '') {
  encounter.rngStep = (encounter.rngStep || 0) + 1;
  let state = (encounter.seed ^ hashString(`${encounter.turn}:${encounter.rngStep}:${salt}`)) >>> 0;
  state += 0x6d2b79f5;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randomInt(encounter, min, max, salt = '') {
  return Math.floor(random(encounter, salt) * (max - min + 1)) + min;
}

function attr(hero, key, fallback = 50) {
  return Number(hero?.attributes?.[key] ?? fallback);
}

export const COMBAT_ACTIONS = [
  { id: 'attack', label: 'Attack', icon: '⚔', cost: 18, hint: 'Reliable pressure. Punishes an opponent who is recovering.', modes: ['duel', 'party'] },
  { id: 'guard', label: 'Guard', icon: '◆', cost: 7, hint: 'Brace against a telegraphed attack or dangerous Signature.', modes: ['duel', 'party'] },
  { id: 'feint', label: 'Feint', icon: '◈', cost: 20, hint: 'Break defensive play and leave the opponent exposed.', modes: ['duel', 'party'] },
  { id: 'recover', label: 'Recover', icon: '✚', cost: 0, hint: 'Restore stamina and a little health, but invite pressure.', modes: ['duel', 'party'] },
  {
    id: 'objective',
    label: 'Press Objective',
    icon: '⌖',
    cost: 16,
    hint: 'Advance the mission goal instead of maximizing damage this exchange.',
    modes: ['party'],
  },
  { id: 'signature', label: 'Signature', icon: '✦', cost: 22, hint: 'Use the selected hero’s class technique.', modes: ['duel', 'party'] },
];

export const CLASS_SIGNATURES = {
  Guardian: {
    name: 'Shield Bash',
    icon: '◆',
    cost: 20,
    cooldown: 2,
    text: 'Strike while raising guard; may stagger an aggressive opponent.',
    mode: 'guard-hit',
  },
  Duelist: { name: 'Riposte', icon: '✦', cost: 18, cooldown: 2, text: 'Set a counter. Direct attacks are answered with a precision strike.', mode: 'riposte' },
  Ranger: { name: 'Pinning Shot', icon: '➶', cost: 20, cooldown: 2, text: 'Accurate ranged pressure that exposes an attacking opponent.', mode: 'pin' },
  Rogue: { name: 'Shadowstep', icon: '◈', cost: 22, cooldown: 2, text: 'Devastating against an exposed target; otherwise creates evasion.', mode: 'shadow' },
  Cleric: { name: 'Radiant Ward', icon: '✚', cost: 20, cooldown: 3, text: 'Heal the line, raise guard and punish reckless pressure.', mode: 'ward' },
  Mage: { name: 'Arc Burst', icon: '✧', cost: 28, cooldown: 3, text: 'Heavy magical damage that ignores much of the target’s guard.', mode: 'burst' },
  Scholar: {
    name: 'Tactical Reading',
    icon: '▣',
    cost: 14,
    cooldown: 2,
    text: 'Recover stamina, gain focus and improve the read on the next exchange.',
    mode: 'verse',
  },
  Artificer: { name: 'Flash Charge', icon: '⚙', cost: 22, cooldown: 2, text: 'Strip guard and disrupt the opponent’s next action.', mode: 'flash' },
};

function heroSnapshot(hero, role = null) {
  return {
    id: hero.id,
    name: hero.name,
    classId: hero.classId,
    primal: hero.primal,
    rarity: hero.rarity,
    level: hero.level || 1,
    power: (hero.power || 50) + (hero.artifactPowerBonus || 0),
    role,
    attributes: { ...(hero.attributes || {}) },
  };
}

function syntheticHero({ id, name, classId, primal, level, power, role }) {
  const p = clamp(Math.round(power || 50), 30, 98);
  const classBias = {
    Guardian: ['Might', 'Endurance'],
    Duelist: ['Finesse', 'Presence'],
    Ranger: ['Finesse', 'Mind'],
    Rogue: ['Finesse', 'Mind'],
    Cleric: ['Spirit', 'Presence'],
    Mage: ['Mind', 'Spirit'],
    Scholar: ['Mind', 'Presence'],
    Artificer: ['Mind', 'Endurance'],
  }[classId] || ['Might', 'Endurance'];
  const attributes = Object.fromEntries(
    ['Might', 'Finesse', 'Mind', 'Spirit', 'Presence', 'Endurance'].map((key) => [key, clamp(p + (classBias.includes(key) ? 7 : -3), 28, 99)]),
  );
  return { id, name, classId: normalizeClassId(classId), primal, rarity: 'Uncommon', level: level || 1, power: p, role, attributes };
}

function sideFromRoster(name, roster, primalFallback = 'Iron') {
  const size = Math.max(1, roster.length);
  const avg = (key, fallback = 50) => roster.reduce((sum, hero) => sum + attr(hero, key, fallback), 0) / size;
  const avgLevel = roster.reduce((sum, hero) => sum + (hero.level || 1), 0) / size;
  const avgPower = roster.reduce((sum, hero) => sum + (hero.power || 50), 0) / size;
  const endurance = avg('Endurance', avgPower);
  const might = avg('Might', avgPower);
  const maxHp = Math.round((86 + endurance * 0.52 + might * 0.14 + avgLevel * 2.1) * (0.76 + size * 0.27));
  return {
    name,
    primal: roster[0]?.primal || primalFallback,
    roster,
    leadHeroId: roster[0]?.id || null,
    maxHp,
    hp: maxHp,
    maxStamina: 100,
    stamina: clamp(Math.round(82 + endurance * 0.14), 82, 100),
    guard: 0,
    focus: 0,
    exposed: 0,
    evasion: 0,
    staggered: 0,
    empowered: 0,
    signatureCooldown: 0,
    damageDealt: 0,
    healingDone: 0,
    style: 0,
  };
}

function duelSide(hero, nameOverride = null) {
  const snapshot = heroSnapshot({ ...hero, classId: normalizeClassId(hero.classId) }, 'Champion');
  return sideFromRoster(nameOverride || hero.name, [snapshot], hero.primal);
}

function intentDefinition(actionId, signature = null) {
  const definitions = {
    attack: {
      label: 'Direct pressure',
      icon: '⚔',
      description: 'A committed attack is coming.',
      telegraph: 'They shift forward and prepare a direct attack.',
    },
    guard: {
      label: 'Disciplined guard',
      icon: '◆',
      description: 'They intend to absorb your pressure and build control.',
      telegraph: 'They settle behind a disciplined guard.',
    },
    feint: {
      label: 'Feint',
      icon: '◈',
      description: 'They are trying to open your defense rather than trade cleanly.',
      telegraph: 'Their stance is deliberately loose — a feint is coming.',
    },
    recover: {
      label: 'Recovery',
      icon: '✚',
      description: 'They are sacrificing initiative to restore stamina.',
      telegraph: 'They give ground and try to recover stamina.',
    },
    objective: {
      label: 'Objective push',
      icon: '⌖',
      description: 'They are prioritizing mission progress over direct damage.',
      telegraph: 'They are ignoring you long enough to press the objective.',
    },
    signature: {
      label: signature?.name || 'Signature',
      icon: signature?.icon || '✦',
      description: 'A class-defining technique is being prepared.',
      telegraph: `They are preparing ${signature?.name || 'a class Signature'}.`,
    },
  };
  return { actionId, ...(definitions[actionId] || definitions.attack) };
}

function leadHero(side, requestedId = null) {
  return side.roster.find((hero) => hero.id === requestedId) || side.roster.find((hero) => hero.id === side.leadHeroId) || side.roster[0];
}

function avgRoster(side, key) {
  return side.roster.reduce((sum, hero) => sum + attr(hero, key, hero.power || 50), 0) / Math.max(1, side.roster.length);
}

function roleCount(side, role) {
  return side.roster.filter((hero) => hero.role === role).length;
}

function offenseRating(side, lead) {
  const fighters = roleCount(side, 'Fighter');
  const support = roleCount(side, 'Combat Support');
  const base = avgRoster(side, 'Might') * 0.28 + avgRoster(side, 'Finesse') * 0.25 + avgRoster(side, 'Mind') * 0.08;
  const leadSkill = attr(lead, 'Might', lead?.power || 50) * 0.14 + attr(lead, 'Finesse', lead?.power || 50) * 0.13 + (lead?.level || 1) * 1.1;
  return base + leadSkill + fighters * 4.2 + support * 0.8;
}

function defenseRating(side, lead) {
  const commander = roleCount(side, 'Commander');
  const support = roleCount(side, 'Combat Support');
  return avgRoster(side, 'Endurance') * 0.32 + avgRoster(side, 'Spirit') * 0.18 + attr(lead, 'Presence', lead?.power || 50) * 0.1 + commander * 4 + support * 4;
}

function supportRating(side) {
  return avgRoster(side, 'Spirit') * 0.26 + avgRoster(side, 'Mind') * 0.2 + roleCount(side, 'Combat Support') * 9;
}

function objectiveRating(side, lead) {
  return (
    avgRoster(side, 'Mind') * 0.22 +
    avgRoster(side, 'Finesse') * 0.2 +
    attr(lead, 'Presence', lead?.power || 50) * 0.14 +
    roleCount(side, 'Commander') * 5 +
    roleCount(side, 'Combat Support') * 2
  );
}

function signatureFor(hero) {
  return CLASS_SIGNATURES[hero?.classId] || CLASS_SIGNATURES.Guardian;
}

function chooseEnemyIntent(encounter) {
  const side = encounter.enemy;
  const player = encounter.player;
  const lead = leadHero(side);
  const sig = signatureFor(lead);
  const options = [];
  if (side.stamina < 24) options.push('recover', 'recover', 'guard');
  else {
    options.push('attack', 'attack', 'guard', 'feint');
    if (side.signatureCooldown <= 0 && side.stamina >= sig.cost) options.push('signature', 'signature');
    if (player.guard > 0.35) options.push('feint', 'feint');
    if (player.exposed > 0) options.push('attack', 'signature');
    if (encounter.mode === 'party' && encounter.objectiveState?.id !== 'eliminate') options.push('objective');
    if (side.hp / side.maxHp < 0.35) options.push('recover', ['Cleric', 'Scholar'].includes(normalizeClassId(lead?.classId)) ? 'signature' : 'guard');

    // Opponents learn obvious habits. The tell remains honest, so a player who reads it can still counter.
    const pattern = encounter.playerPattern || {};
    if (pattern.lastAction === 'attack' && pattern.streak >= 2) {
      options.push('guard', 'guard', 'guard', 'guard');
      if (side.signatureCooldown <= 0 && side.stamina >= sig.cost) options.push('signature', 'signature', 'signature', 'signature');
    } else if (pattern.lastAction === 'guard') {
      options.push('feint', 'feint', 'feint');
    } else if (pattern.lastAction === 'recover') {
      options.push('attack', 'attack', 'attack');
    } else if (pattern.lastAction === 'objective') {
      options.push('attack', 'signature');
    }
  }
  const actionId = options[randomInt(encounter, 0, options.length - 1, 'enemy-intent')] || 'attack';
  const playerRead = avgRoster(player, 'Mind') * 0.62 + avgRoster(player, 'Presence') * 0.18 + avgRoster(player, 'Finesse') * 0.2;
  const enemyDeception = avgRoster(side, 'Mind') * 0.58 + avgRoster(side, 'Finesse') * 0.3 + avgRoster(side, 'Presence') * 0.12;
  const confidence = clamp(0.62 + (playerRead - enemyDeception) * 0.0024, 0.54, 0.9);
  return { ...intentDefinition(actionId, sig), confidence };
}

function objectiveStateFromConfig(config) {
  const id = config.objectiveType || 'eliminate';
  const defaults = {
    eliminate: { label: 'Break the opposition', target: 100, progress: 0, enemyProgress: 0, protectedIntegrity: null },
    protect: { label: 'Protect the target until relief arrives', target: config.objectiveTarget || 6, progress: 0, enemyProgress: 0, protectedIntegrity: 100 },
    hold: { label: 'Hold the field until relief arrives', target: config.objectiveTarget || 6, progress: 0, enemyProgress: 0, protectedIntegrity: null },
    break: { label: 'Break the defended objective', target: config.objectiveTarget || 100, progress: 0, enemyProgress: 0, protectedIntegrity: null },
    capture: { label: 'Secure the target alive', target: config.objectiveTarget || 100, progress: 0, enemyProgress: 0, protectedIntegrity: null },
    escape: { label: 'Create an escape route', target: config.objectiveTarget || 100, progress: 0, enemyProgress: 0, protectedIntegrity: null },
  };
  return { id, ...(defaults[id] || defaults.eliminate), label: config.objectiveLabel || (defaults[id] || defaults.eliminate).label };
}

export function createDuelEncounter({ id, seed, sourceType, sourceId, title, roundName, playerHero, opponentHero, prestige = 0 }) {
  const encounter = {
    id,
    mode: 'duel',
    sourceType,
    sourceId,
    title,
    roundName,
    objective: 'Win the bout by knockout or by convincing the judges over ten tactical turns.',
    objectiveState: objectiveStateFromConfig({ objectiveType: 'eliminate' }),
    seed: seed >>> 0 || 1,
    rngStep: 0,
    turn: 1,
    maxTurns: 10,
    status: 'active',
    prestige,
    player: duelSide(playerHero),
    enemy: duelSide(opponentHero),
    enemyIntent: null,
    log: [],
    result: null,
    playerPattern: { lastAction: null, streak: 0 },
  };
  encounter.enemyIntent = chooseEnemyIntent(encounter);
  encounter.log.push({ turn: 0, tone: 'info', text: `${opponentHero.name} opens with a readable tell: ${encounter.enemyIntent.telegraph}` });
  return encounter;
}

export function createPartyEncounter({
  id,
  seed,
  sourceType,
  sourceId,
  title,
  roundName,
  objective,
  playerHeroes,
  opponentName,
  opponentPrimal,
  opponentClassId = 'Guardian',
  opponentPower = 55,
  opponentLevel = 5,
  opponentRoster = null,
  prestige = 0,
  risk = 2,
  objectiveType = 'eliminate',
  objectiveTarget = null,
  objectiveLabel = null,
}) {
  const playerRoster = playerHeroes.map(({ hero, role }) => heroSnapshot(hero, role));
  const desiredEnemySize = Math.max(2, Math.min(5, opponentRoster?.length || playerRoster.length || 2));
  const enemyRoster = opponentRoster?.length
    ? opponentRoster
        .slice(0, desiredEnemySize)
        .map((hero, index) => heroSnapshot(hero, index === 0 ? 'Commander' : index === desiredEnemySize - 1 ? 'Combat Support' : 'Fighter'))
    : Array.from({ length: desiredEnemySize }, (_, index) =>
        syntheticHero({
          id: `enemy-${id}-${index}`,
          name: index === 0 ? `${opponentName} captain` : `${opponentName} ${index + 1}`,
          classId: index === 0 ? opponentClassId : index === desiredEnemySize - 1 && desiredEnemySize >= 4 ? 'Cleric' : index % 2 ? 'Duelist' : opponentClassId,
          primal: opponentPrimal,
          level: clamp(opponentLevel + (index === 0 ? 1 : 0), 1, 20),
          power: clamp(opponentPower + (index === 0 ? 4 : randomInt({ seed: seed >>> 0 || 1, turn: 0, rngStep: index }, -5, 3, `enemy-${index}`)), 30, 98),
          role: index === 0 ? 'Commander' : index === desiredEnemySize - 1 && desiredEnemySize >= 4 ? 'Combat Support' : 'Fighter',
        }),
      );
  const encounter = {
    id,
    mode: 'party',
    sourceType,
    sourceId,
    title,
    roundName,
    objective: objective || 'Break the hostile force and secure the objective.',
    objectiveState: objectiveStateFromConfig({ objectiveType, objectiveTarget, objectiveLabel }),
    seed: seed >>> 0 || 1,
    rngStep: 0,
    turn: 1,
    maxTurns: objectiveType === 'protect' || objectiveType === 'hold' ? Math.max(6, objectiveTarget || 6) : risk >= 4 ? 9 : 8,
    status: 'active',
    prestige,
    risk,
    player: sideFromRoster('Your Combat Company', playerRoster, playerRoster[0]?.primal),
    enemy: sideFromRoster(opponentName, enemyRoster, opponentPrimal),
    enemyIntent: null,
    log: [],
    result: null,
    playerPattern: { lastAction: null, streak: 0 },
  };
  encounter.enemyIntent = chooseEnemyIntent(encounter);
  encounter.log.push({ turn: 0, tone: 'info', text: `Enemy tell: ${encounter.enemyIntent.telegraph}` });
  return encounter;
}

export function combatPrimalText(attackerPrimal, defenderPrimal) {
  const edge = primalCombatModifier(attackerPrimal, defenderPrimal);
  if (edge > 0) return `${attackerPrimal} has the primal edge over ${defenderPrimal}.`;
  if (edge < 0) return `${attackerPrimal} is at a primal disadvantage against ${defenderPrimal}.`;
  return `${attackerPrimal} and ${defenderPrimal} have no direct primal edge.`;
}

function actionDefinitionForSide(encounter, side, actionId, leadHeroId = null) {
  const base = COMBAT_ACTIONS.find((action) => action.id === actionId) || COMBAT_ACTIONS[0];
  const lead = leadHero(side || { roster: [] }, leadHeroId);
  if (actionId !== 'signature') {
    return {
      ...base,
      disabled: !base.modes.includes(encounter?.mode) || (actionId !== 'recover' && (side?.stamina || 0) < base.cost),
    };
  }
  const signature = signatureFor(lead);
  return {
    ...base,
    label: signature.name,
    icon: signature.icon,
    cost: signature.cost,
    hint: signature.text,
    cooldown: side?.signatureCooldown || 0,
    disabled: (side?.signatureCooldown || 0) > 0 || (side?.stamina || 0) < signature.cost,
  };
}

export function combatActionDefinition(encounter, actionId, leadHeroId = null) {
  return actionDefinitionForSide(encounter, encounter?.player, actionId, leadHeroId);
}

function spend(side, amount) {
  if (side.stamina < amount) return false;
  side.stamina -= amount;
  return true;
}

function heal(side, amount) {
  const before = side.hp;
  side.hp = clamp(side.hp + amount, 0, side.maxHp);
  side.healingDone += Math.max(0, side.hp - before);
  return side.hp - before;
}

function restoreStamina(side, amount) {
  side.stamina = clamp(side.stamina + amount, 0, side.maxStamina);
}

function primalMultiplier(attackerPrimal, defenderPrimal) {
  return 1 + primalCombatModifier(attackerPrimal, defenderPrimal) * 0.03;
}

function rawDamage(encounter, actor, target, lead, multiplier = 1, salt = '') {
  const offense = offenseRating(actor, lead);
  const defense = defenseRating(target, leadHero(target));
  const base = 8 + offense * 0.21 - defense * 0.055;
  const sizeScale = encounter.mode === 'party' ? 0.82 + actor.roster.length * 0.12 : 1;
  const exposed = target.exposed > 0 ? 1.24 : 1;
  const empowered = actor.empowered > 0 ? 1.17 : 1;
  const elemental = primalMultiplier(lead?.primal || actor.primal, target.primal);
  const variance = 0.9 + random(encounter, `dmg-${salt}`) * 0.2;
  return Math.max(2, Math.round(base * multiplier * sizeScale * exposed * empowered * elemental * variance));
}

function applyDamage(encounter, actor, target, damage, { ignoreGuard = 0, label = 'attack' } = {}) {
  if (target.evasion > 0 && random(encounter, `evasion-${label}`) < 0.42) {
    target.evasion = Math.max(0, target.evasion - 1);
    encounter.log.push({ turn: encounter.turn, tone: target === encounter.player ? 'good' : 'bad', text: `${target.name} slips clear of the ${label}.` });
    return 0;
  }
  const effectiveGuard = target.guard * (1 - ignoreGuard);
  const reduced = Math.round(damage * (1 - effectiveGuard));
  const final = Math.max(1, reduced);
  if (target.guard >= 0.48 && actor.stamina > 0) {
    actor.stamina = Math.max(0, actor.stamina - 4);
    target.focus = clamp(target.focus + 1, 0, 5);
  }
  target.guard = Math.max(0, target.guard - Math.min(0.55, damage / Math.max(1, target.maxHp)));
  target.hp = Math.max(0, target.hp - final);
  actor.damageDealt += final;
  return final;
}

function setupAction(encounter, side, actionId, actionDef, lead) {
  if (actionId === 'guard') {
    spend(side, actionDef.cost);
    side.guard = clamp(0.38 + defenseRating(side, lead) / 380, 0.42, 0.62);
    side.focus = clamp(side.focus + 1, 0, 5);
    restoreStamina(side, 4);
  } else if (actionId === 'recover') {
    const support = supportRating(side);
    restoreStamina(side, 28 + Math.round(support * 0.05));
    heal(side, Math.round(side.maxHp * (encounter.mode === 'party' ? 0.035 : 0.025) + support * 0.04));
    side.guard = Math.max(side.guard, 0.1);
    side.exposed = Math.max(side.exposed, 1);
  } else if (actionId === 'objective') {
    spend(side, actionDef.cost);
  }
}

function addObjectiveProgress(encounter, side, lead, amountMultiplier = 1) {
  if (!encounter.objectiveState || encounter.objectiveState.id === 'eliminate') return 0;
  const rating = objectiveRating(side, lead);
  const gain = Math.max(4, Math.round((7 + rating * 0.15 + side.focus * 2) * amountMultiplier));
  if (side === encounter.player) encounter.objectiveState.progress = clamp(encounter.objectiveState.progress + gain, 0, encounter.objectiveState.target);
  else encounter.objectiveState.enemyProgress = clamp(encounter.objectiveState.enemyProgress + gain, 0, encounter.objectiveState.target);
  return gain;
}

function applySignature(encounter, actor, target, lead, targetActionId) {
  const sig = signatureFor(lead);
  if (!spend(actor, sig.cost)) return false;
  actor.signatureCooldown = sig.cooldown + 1;
  let damage = 0;
  if (sig.mode === 'guard-hit') {
    actor.guard = Math.max(actor.guard, 0.42);
    damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 1.02, 'shield-bash'), { label: sig.name });
    if (['attack', 'signature'].includes(targetActionId) && random(encounter, 'guardian-stagger') < 0.38) target.staggered = 1;
  } else if (sig.mode === 'riposte') {
    actor.guard = Math.max(actor.guard, 0.28);
    actor.riposte = 2;
    if (!['attack', 'signature'].includes(targetActionId))
      damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.7, 'riposte-probe'), { label: sig.name });
  } else if (sig.mode === 'pin') {
    damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 1.05, 'pin'), { ignoreGuard: 0.2, label: sig.name });
    if (['attack', 'signature'].includes(targetActionId)) target.exposed = Math.max(target.exposed, 2);
  } else if (sig.mode === 'shadow') {
    if (target.exposed > 0) {
      damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 1.58, 'shadow'), { ignoreGuard: 0.32, label: sig.name });
      actor.style += 3;
    } else {
      actor.evasion = Math.max(actor.evasion, 2);
      damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.55, 'shadow-glance'), { label: sig.name });
    }
  } else if (sig.mode === 'ward') {
    const restored = heal(actor, Math.round(actor.maxHp * 0.09 + supportRating(actor) * 0.08));
    actor.guard = Math.max(actor.guard, 0.44);
    if (['attack', 'signature'].includes(targetActionId))
      damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.55, 'radiant'), { ignoreGuard: 0.15, label: sig.name });
    encounter.log.push({
      turn: encounter.turn,
      tone: actor === encounter.player ? 'good' : 'bad',
      text: `${lead.name} raises Radiant Ward and restores ${restored} health.`,
    });
  } else if (sig.mode === 'burst') {
    damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 1.42, 'arc-burst'), { ignoreGuard: 0.58, label: sig.name });
  } else if (sig.mode === 'breaker') {
    damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 1.55, 'breaker'), { ignoreGuard: 0.15, label: sig.name });
    actor.exposed = Math.max(actor.exposed, 2);
  } else if (sig.mode === 'verse') {
    restoreStamina(actor, 30);
    actor.focus = clamp(actor.focus + 3, 0, 5);
    actor.empowered = Math.max(actor.empowered, 2);
    actor.style += 3;
  } else if (sig.mode === 'flash') {
    target.guard = Math.max(0, target.guard - 0.45);
    damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.92, 'flash'), { ignoreGuard: 0.8, label: sig.name });
    target.staggered = 1;
  } else if (sig.mode === 'twin') {
    const first = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.72, 'twin-a'), { label: sig.name });
    const second =
      target.hp <= 0
        ? 0
        : applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, target.hp / target.maxHp < 0.4 ? 0.95 : 0.7, 'twin-b'), {
            label: sig.name,
          });
    damage = first + second;
  }
  if (damage > 0)
    encounter.log.push({
      turn: encounter.turn,
      tone: actor === encounter.player ? 'good' : 'bad',
      text: `${lead.name} uses ${sig.name} for ${damage} damage.`,
    });
  else if (sig.mode === 'verse')
    encounter.log.push({
      turn: encounter.turn,
      tone: actor === encounter.player ? 'good' : 'bad',
      text: `${lead.name} uses ${sig.name}; the whole side finds a new rhythm.`,
    });
  return true;
}

function executeAction(encounter, actor, target, actionId, targetActionId, lead) {
  if (actor.staggered > 0) {
    encounter.log.push({ turn: encounter.turn, tone: actor === encounter.player ? 'bad' : 'good', text: `${actor.name} loses the exchange while staggered.` });
    return;
  }
  const def = actionDefinitionForSide(encounter, actor, actionId, lead?.id);
  if (def.disabled && actionId !== 'recover') return executeAction(encounter, actor, target, 'recover', targetActionId, lead);
  if (actionId === 'attack') {
    spend(actor, def.cost);
    let mult = targetActionId === 'recover' || targetActionId === 'objective' ? 1.24 : 1;
    // Direct pressure into a correctly-read guard should be a real tactical mistake, not merely lower DPS.
    // This is the core rock-paper-scissors layer: Attack punishes recovery/objectives, Feint punishes Guard, Guard punishes Attack/Signature.
    if (targetActionId === 'guard') mult *= 0.76;
    if (targetActionId === 'feint') mult *= 1.08;
    const critChance = 0.04 + attr(lead, 'Finesse', 50) / 1200 + actor.focus * 0.015;
    const crit = random(encounter, `crit-${actor.name}`) < critChance;
    if (crit) mult *= 1.35;
    const damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, mult, 'attack'), {
      label: crit ? 'critical attack' : 'attack',
    });
    actor.style += crit ? 2 : 0;
    encounter.log.push({
      turn: encounter.turn,
      tone: actor === encounter.player ? 'good' : 'bad',
      text: `${lead.name} attacks for ${damage}${crit ? ' — critical hit.' : '.'}`,
    });
    if (targetActionId === 'guard' && target.guard >= 0.28 && target.hp > 0 && actor.hp > 0) {
      const counterLead = leadHero(target);
      const counterDamage = applyDamage(encounter, target, actor, rawDamage(encounter, target, actor, counterLead, 0.92, 'guard-counter'), {
        ignoreGuard: 0.12,
        label: 'guard counter',
      });
      target.style += 1;
      encounter.log.push({
        turn: encounter.turn,
        tone: target === encounter.player ? 'good' : 'bad',
        text: `${counterLead.name} turns the guarded blow into a ${counterDamage}-damage counter.`,
      });
    }
  } else if (actionId === 'feint') {
    spend(actor, def.cost);
    if (targetActionId === 'guard' || target.guard >= 0.35) {
      target.guard = Math.max(0, target.guard - 0.6);
      target.exposed = Math.max(target.exposed, 2);
      actor.focus = clamp(actor.focus + 2, 0, 5);
      actor.style += 2;
      const punish = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.62, 'feint-break'), {
        ignoreGuard: 0.85,
        label: 'feint break',
      });
      encounter.log.push({
        turn: encounter.turn,
        tone: actor === encounter.player ? 'good' : 'bad',
        text: `${lead.name} sells the feint, opens the defense and lands ${punish} damage.`,
      });
    } else {
      const damage = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.48, 'feint'), { label: 'feint' });
      target.exposed = Math.max(target.exposed, 1);
      actor.focus = clamp(actor.focus + 1, 0, 5);
      encounter.log.push({
        turn: encounter.turn,
        tone: actor === encounter.player ? 'good' : 'bad',
        text: `${lead.name} creates an opening and clips the opposition for ${damage}.`,
      });
    }
  } else if (actionId === 'objective') {
    spend(actor, def.cost);
    const bonus = targetActionId === 'guard' || targetActionId === 'recover' ? 1.28 : targetActionId === 'attack' || targetActionId === 'signature' ? 0.82 : 1;
    const gain = addObjectiveProgress(encounter, actor, lead, bonus);
    const chip = applyDamage(encounter, actor, target, rawDamage(encounter, actor, target, lead, 0.28, 'objective-chip'), { label: 'objective pressure' });
    encounter.log.push({
      turn: encounter.turn,
      tone: actor === encounter.player ? 'good' : 'bad',
      text: `${actor.name} presses the objective (+${gain}) while dealing ${chip} pressure damage.`,
    });
  } else if (actionId === 'signature') {
    applySignature(encounter, actor, target, lead, targetActionId);
  }
}

function priority(side, actionId, lead) {
  const base = { guard: 6, feint: 4.5, signature: 3.3, attack: 2.8, objective: 1.4, recover: 0 }[actionId] ?? 2;
  return base + attr(lead, 'Finesse', lead?.power || 50) * 0.025 + attr(lead, 'Presence', lead?.power || 50) * 0.008;
}

function decay(side) {
  side.guard = Math.max(0, side.guard * 0.28);
  side.exposed = Math.max(0, side.exposed - 1);
  side.evasion = Math.max(0, side.evasion - 1);
  side.staggered = Math.max(0, side.staggered - 1);
  side.empowered = Math.max(0, side.empowered - 1);
  side.signatureCooldown = Math.max(0, side.signatureCooldown - 1);
  restoreStamina(side, 4);
  if (side.riposte) side.riposte = Math.max(0, side.riposte - 1);
}

function updateObjectiveAfterTurn(encounter, playerAction, enemyAction) {
  const obj = encounter.objectiveState;
  if (!obj || encounter.mode !== 'party') return;
  if (obj.id === 'hold') obj.progress = Math.min(obj.target, encounter.turn);
  if (obj.id === 'protect') {
    obj.progress = Math.min(obj.target, encounter.turn);
    let loss = ['attack', 'signature'].includes(enemyAction) ? 14 : enemyAction === 'objective' ? 18 : enemyAction === 'feint' ? 9 : 5;
    if (playerAction === 'guard') loss = Math.round(loss * 0.38);
    if (playerAction === 'objective') loss = Math.round(loss * 0.7);
    obj.protectedIntegrity = clamp(obj.protectedIntegrity - loss, 0, 100);
  }
  if (enemyAction === 'objective' && !['hold', 'protect', 'eliminate'].includes(obj.id)) {
    const enemyLead = leadHero(encounter.enemy);
    const gain = addObjectiveProgress(encounter, encounter.enemy, enemyLead, playerAction === 'attack' ? 0.72 : 1);
    encounter.log.push({ turn: encounter.turn, tone: 'bad', text: `${encounter.enemy.name} gains ${gain} enemy objective progress.` });
  }
}

function outcomeScore(encounter) {
  const playerHpPct = Math.round((encounter.player.hp / encounter.player.maxHp) * 100);
  const enemyHpPct = Math.round((encounter.enemy.hp / encounter.enemy.maxHp) * 100);
  const obj = encounter.objectiveState;
  const playerObjective = obj && obj.target ? obj.progress / obj.target : 0;
  const enemyObjective = obj && obj.target ? obj.enemyProgress / obj.target : 0;
  return clamp(
    Math.round(
      50 +
        (playerHpPct - enemyHpPct) * 0.4 +
        (encounter.player.damageDealt - encounter.enemy.damageDealt) * 0.12 +
        (playerObjective - enemyObjective) * 24 +
        encounter.player.style * 2 +
        encounter.player.focus * 1.5,
    ),
    0,
    100,
  );
}

function finishEncounter(encounter, playerWon, method) {
  const playerHpPct = Math.round((encounter.player.hp / encounter.player.maxHp) * 100);
  const enemyHpPct = Math.round((encounter.enemy.hp / encounter.enemy.maxHp) * 100);
  encounter.status = playerWon ? 'won' : 'lost';
  encounter.result = {
    playerWon,
    turns: encounter.turn,
    method,
    playerHpPct,
    enemyHpPct,
    playerDamage: encounter.player.damageDealt,
    enemyDamage: encounter.enemy.damageDealt,
    performance: outcomeScore(encounter),
    objective: encounter.objectiveState ? clone(encounter.objectiveState) : null,
  };
  encounter.log.push({ turn: encounter.turn, tone: playerWon ? 'good' : 'bad', text: playerWon ? `Victory — ${method}.` : `Defeat — ${method}.` });
}

function evaluateEnd(encounter) {
  if (encounter.player.hp <= 0) return finishEncounter(encounter, false, 'company routed');
  if (encounter.enemy.hp <= 0) return finishEncounter(encounter, true, 'opposition broken');
  const obj = encounter.objectiveState;
  if (encounter.mode === 'party' && obj) {
    if (['break', 'capture', 'escape'].includes(obj.id) && obj.progress >= obj.target) return finishEncounter(encounter, true, obj.label.toLowerCase());
    if (obj.id === 'protect' && obj.protectedIntegrity <= 0) return finishEncounter(encounter, false, 'protected target lost');
    if (['hold', 'protect'].includes(obj.id) && obj.progress >= obj.target)
      return finishEncounter(encounter, true, obj.id === 'hold' ? 'field held until relief' : 'protected target survived');
    if (obj.enemyProgress >= obj.target) return finishEncounter(encounter, false, 'enemy completed its objective');
  }
  if (encounter.turn >= encounter.maxTurns) {
    const playerScore = outcomeScore(encounter);
    const playerWon = playerScore >= 50;
    return finishEncounter(encounter, playerWon, encounter.mode === 'duel' ? `judges’ decision (${playerScore})` : `tactical decision (${playerScore})`);
  }
  return null;
}

export function performCombatAction(encounterInput, actionId, leadHeroId = null) {
  const encounter = clone(encounterInput);
  if (!encounter || encounter.status !== 'active') return encounter;
  const playerLead = leadHero(encounter.player, leadHeroId);
  if (leadHeroId && encounter.player.roster.some((hero) => hero.id === leadHeroId)) encounter.player.leadHeroId = leadHeroId;
  const enemyLead = leadHero(encounter.enemy);
  const playerDef = combatActionDefinition(encounter, actionId, playerLead?.id);
  let playerAction = playerDef.disabled ? 'recover' : actionId;
  if (!COMBAT_ACTIONS.some((action) => action.id === playerAction && action.modes.includes(encounter.mode))) playerAction = 'attack';
  let enemyAction = encounter.enemyIntent?.actionId || 'attack';
  const readConfidence = encounter.enemyIntent?.confidence ?? 0.88;
  if (random(encounter, 'enemy-deception') > readConfidence) {
    const baitMap = {
      attack: 'feint',
      signature: 'feint',
      guard: 'attack',
      recover: 'guard',
      feint: 'guard',
      objective: 'attack',
    };
    const preferred = baitMap[enemyAction] || 'attack';
    const candidates = [preferred, 'attack', 'guard', 'feint', encounter.mode === 'party' ? 'objective' : 'recover'];
    const shifted = candidates.find(
      (candidate) => candidate !== enemyAction && !actionDefinitionForSide(encounter, encounter.enemy, candidate, enemyLead?.id).disabled,
    );
    if (shifted) {
      encounter.log.push({ turn: encounter.turn, tone: 'info', text: `${enemyLead.name} sold a false tell — ${enemyAction} becomes ${shifted}.` });
      enemyAction = shifted;
    }
  }
  const enemyDef = actionDefinitionForSide(encounter, encounter.enemy, enemyAction, enemyLead?.id);
  if (enemyDef.disabled) enemyAction = encounter.enemy.stamina < 18 ? 'recover' : 'attack';

  setupAction(encounter, encounter.player, playerAction, combatActionDefinition(encounter, playerAction, playerLead?.id), playerLead);
  setupAction(encounter, encounter.enemy, enemyAction, actionDefinitionForSide(encounter, encounter.enemy, enemyAction, enemyLead?.id), enemyLead);
  encounter.log.push({
    turn: encounter.turn,
    tone: 'neutral',
    text: `${playerLead.name}: ${combatActionDefinition(encounter, playerAction, playerLead.id).label}. ${enemyLead.name}: ${actionDefinitionForSide(encounter, encounter.enemy, enemyAction, enemyLead.id).label}.`,
  });

  const turns = [
    {
      actor: encounter.player,
      target: encounter.enemy,
      actionId: playerAction,
      targetActionId: enemyAction,
      lead: playerLead,
      initiative: priority(encounter.player, playerAction, playerLead) + random(encounter, 'player-init'),
    },
    {
      actor: encounter.enemy,
      target: encounter.player,
      actionId: enemyAction,
      targetActionId: playerAction,
      lead: enemyLead,
      initiative: priority(encounter.enemy, enemyAction, enemyLead) + random(encounter, 'enemy-init'),
    },
  ].sort((a, b) => b.initiative - a.initiative);

  for (const exchange of turns) {
    if (exchange.actor.hp <= 0 || exchange.target.hp <= 0) continue;
    if (!['guard', 'recover'].includes(exchange.actionId))
      executeAction(encounter, exchange.actor, exchange.target, exchange.actionId, exchange.targetActionId, exchange.lead);
    if (exchange.target.riposte && ['attack', 'signature'].includes(exchange.actionId) && exchange.target.hp > 0) {
      exchange.target.riposte = 0;
      const counterLead = leadHero(exchange.target);
      const damage = applyDamage(
        encounter,
        exchange.target,
        exchange.actor,
        rawDamage(encounter, exchange.target, exchange.actor, counterLead, 0.88, 'riposte-counter'),
        { ignoreGuard: 0.25, label: 'riposte' },
      );
      exchange.target.style += 2;
      encounter.log.push({
        turn: encounter.turn,
        tone: exchange.target === encounter.player ? 'good' : 'bad',
        text: `${counterLead.name} answers with a riposte for ${damage}.`,
      });
    }
  }

  updateObjectiveAfterTurn(encounter, playerAction, enemyAction);
  evaluateEnd(encounter);
  if (encounter.status !== 'active') return encounter;
  const previousAction = encounter.playerPattern?.lastAction;
  encounter.playerPattern = {
    lastAction: playerAction,
    streak: previousAction === playerAction ? (encounter.playerPattern?.streak || 0) + 1 : 1,
  };
  decay(encounter.player);
  decay(encounter.enemy);
  encounter.turn += 1;
  encounter.enemyIntent = chooseEnemyIntent(encounter);
  encounter.log.push({ turn: encounter.turn - 1, tone: 'info', text: `Next tell: ${encounter.enemyIntent.telegraph}` });
  return encounter;
}

export function autoResolveEncounter(encounterInput) {
  let encounter = clone(encounterInput);
  let safety = 30;
  while (encounter?.status === 'active' && safety-- > 0) {
    const intent = encounter.enemyIntent?.actionId || 'attack';
    const lead = leadHero(encounter.player);
    const sig = combatActionDefinition(encounter, 'signature', lead?.id);
    let action = 'attack';
    const tacticalRead = random(encounter, 'auto-tactical-read');
    if (encounter.player.stamina < 22) action = 'recover';
    else if (tacticalRead < 0.14) {
      if (intent === 'attack' || intent === 'signature') action = lead?.classId === 'Duelist' && !sig.disabled ? 'signature' : 'guard';
      else if (intent === 'guard') action = 'feint';
      else if (intent === 'recover') action = 'attack';
      else if (intent === 'objective') action = encounter.mode === 'party' ? 'objective' : 'attack';
      else if (!sig.disabled && encounter.player.focus >= 2) action = 'signature';
    } else if (tacticalRead < 0.26 && !sig.disabled && encounter.player.focus >= 2) action = 'signature';
    else if (encounter.mode === 'party' && encounter.objectiveState?.id !== 'eliminate' && tacticalRead > 0.96) action = 'objective';
    encounter = performCombatAction(encounter, action, lead?.id);
  }
  return encounter;
}

export function missionGradeFromCombat(encounter) {
  const result = encounter?.result;
  if (!result) return 'Defeat';
  const performance = result.performance ?? 50;
  if (!result.playerWon) {
    if (performance >= 48) return 'Partial';
    if (performance <= 18 || result.playerHpPct <= 10) return 'Catastrophic';
    return 'Defeat';
  }
  if (performance >= 88) return 'Legendary';
  if (performance >= 72) return 'Great Success';
  if (performance >= 45) return 'Success';
  return 'Partial';
}
