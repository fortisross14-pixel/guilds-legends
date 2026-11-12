// @ts-check
// Per-hero, turn-based battles.
//
// Each round the player gives one command per living hero (attack, skill,
// item, defend) with a target. Enemies plan their moves at the start of the
// round from their behavior profile (src/data/enemies.js); the boss's (or the
// strongest enemy's) plan is shown as the "tell". Everyone then acts in
// initiative order, rolled when the round is planned so the turn order bar
// can show it. Every action is recorded in `encounter.events` so the UI can
// replay the round as animations.
//
// Pure and deterministic: all randomness comes from the encounter seed.
import { primalCombatModifier } from '../data/world.js';
import { normalizeClassId } from '../data/content.js';
import { SKILLS, skillLabel, skillsForLevel } from '../data/skills.js';
import { ITEMS, gearStats } from '../data/items.js';
import { CLASS_PROFILES, ENEMY_ROLES, ENEMY_TYPES } from '../data/enemies.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));
const TIMED = ['poison', 'burn', 'regen', 'atkUp', 'atkDown', 'guard', 'taunt'];
const INTERRUPT_SHARE = 0.12; // one hit of 12% max HP breaks a charge

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


// ---------------------------------------------------------------- combatants

// mods: per-stat multipliers (enemy roles, bosses); skills: replaces class skills.
function makeCombatant(hero, side, { role = null, sprite = null, scale = 1, mods = null, skills = null, profile = null, boss = null } = {}) {
  const level = hero.level || 1;
  const attributes = hero.attributes || {};
  const get = (key) => Number(attributes[key] ?? hero.power ?? 50);
  const gear = gearStats(hero);
  const classId = normalizeClassId(hero.classId);
  const m = { hp: 1, atk: 1, def: 1, mag: 1, spd: 1, ...(mods || {}) };
  const maxHp = Math.round((30 + get('Endurance') * 1.0 + get('Might') * 0.2 + level * 3 + gear.hp) * scale * m.hp);
  const maxMp = Math.round(8 + (get('Mind') + get('Spirit')) * 0.15 + level * 1.5 + gear.mp);
  // The party fights with what it has (HP and MP carry over between battles; percents on the hero).
  const hpNow = side === 'party' ? Math.max(1, Math.min(maxHp, Math.round((maxHp * (hero.health ?? 100)) / 100))) : maxHp;
  const mpNow = side === 'party' ? Math.max(0, Math.min(maxMp, Math.round((maxMp * (hero.mana ?? 100)) / 100))) : maxMp;
  return {
    id: `${side}-${hero.id}`,
    heroId: side === 'party' ? hero.id : null,
    name: hero.name,
    side,
    classId,
    primal: hero.primal,
    level,
    role,
    sprite,
    profile: side === 'enemy' ? profile || CLASS_PROFILES[classId] || 'brute' : null,
    boss,
    maxHp,
    hp: hpNow,
    maxMp,
    mp: mpNow,
    atk: Math.round((get('Might') * 0.45 + get('Finesse') * 0.25 + level * 0.8 + gear.atk) * scale * m.atk),
    def: Math.round((get('Endurance') * 0.3 + get('Spirit') * 0.1 + level * 0.5 + gear.def) * m.def),
    mag: Math.round((get('Mind') * 0.4 + get('Spirit') * 0.3 + level * 0.8 + gear.mag) * scale * m.mag),
    spd: Math.round((get('Finesse') * 0.5 + get('Presence') * 0.15 + gear.spd) * m.spd),
    skills: skills || skillsForLevel(classId, level).map((skill) => skill.id),
    status: {},
    ko: false,
    fled: false,
    charging: null,
    enraged: false,
    retreated: false,
    damageDealt: 0,
  };
}

function syntheticEnemy({ id, name, classId, primal, level, power }) {
  const p = clamp(Math.round(power || 50), 25, 98);
  const bias = {
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
    ['Might', 'Finesse', 'Mind', 'Spirit', 'Presence', 'Endurance'].map((key) => [key, clamp(p + (bias.includes(key) ? 7 : -3), 20, 99)]),
  );
  return { id, name, classId: normalizeClassId(classId), primal, level: level || 1, power: p, attributes };
}

/** An enemy built from a roster type (src/data/enemies.js), optionally as a boss. */
function typedEnemy(encounter, type, { id, name, isBoss = false }) {
  const role = ENEMY_ROLES[type.role] || ENEMY_ROLES.brute;
  const base = encounter.enemyBase;
  const enemy = syntheticEnemy({
    id,
    name,
    classId: role.classId,
    primal: base.primal,
    level: clamp(base.level + (isBoss ? 3 : 0), 1, 20),
    power: base.power + (isBoss ? 8 : -2),
  });
  const mods = isBoss ? { ...role.mods, hp: role.mods.hp * 3.2, atk: role.mods.atk * 1.25, mag: role.mods.mag * 1.25 } : role.mods;
  return makeCombatant(enemy, 'enemy', {
    role: isBoss ? 'Boss' : type.role,
    scale: (isBoss ? 1 : 0.85) * base.strength,
    mods,
    skills: type.skills,
    sprite: { kind: 'enemy', key: type.sprite },
    profile: role.profile,
    boss: isBoss ? { id: type.id, phase: 0, phases: type.phases || [], charge: type.charge || null, areaSkill: null } : null,
  });
}

function living(list) {
  return list.filter((unit) => !unit.ko);
}

function allUnits(encounter) {
  return [...encounter.party, ...encounter.enemies];
}

function unitById(encounter, id) {
  return allUnits(encounter).find((unit) => unit.id === id) || null;
}

function alliesOf(encounter, unit) {
  return unit.side === 'party' ? encounter.party : encounter.enemies;
}

function opponentsOf(encounter, unit) {
  return unit.side === 'party' ? encounter.enemies : encounter.party;
}

// ---------------------------------------------------------------- creation

function baseEncounter(fields) {
  return {
    rngStep: 0,
    turn: 1,
    status: 'active',
    log: [],
    events: [],
    initiative: {},
    result: null,
    enemyPlans: {},
    enemyIntent: null,
    items: {},
    itemsAtStart: {},
    stolen: 0,
    summoned: 0,
    ...fields,
    seed: fields.seed >>> 0 || 1,
  };
}

function startEncounter(encounter, items) {
  const consumables = Object.fromEntries(Object.entries(items || {}).filter(([id, count]) => ITEMS[id]?.kind === 'consumable' && count > 0));
  encounter.items = { ...consumables };
  encounter.itemsAtStart = { ...consumables };
  rollInitiative(encounter);
  planEnemies(encounter);
  if (encounter.intro) encounter.log.push({ turn: 0, tone: 'bad', text: encounter.intro });
  encounter.log.push({
    turn: 0,
    tone: 'info',
    text: `${encounter.enemyName} appear${encounter.enemies.length === 1 ? 's' : ''}! ${encounter.enemyIntent?.telegraph || ''}`,
  });
  return encounter;
}

/** 1 v 1 tournament bout. Duels cannot be fled. */
export function createDuelEncounter({ id, seed, sourceType, sourceId, title, roundName, playerHero, opponentHero, prestige = 0, items = {} }) {
  const encounter = baseEncounter({
    id,
    mode: 'duel',
    sourceType,
    sourceId,
    title,
    roundName,
    objective: 'Knock out your opponent, or lead on HP when the judges call time.',
    seed,
    maxTurns: 15,
    canFlee: false,
    prestige,
    enemyName: opponentHero.name,
    party: [makeCombatant(playerHero, 'party', { role: 'Champion' })],
    enemies: [makeCombatant(opponentHero, 'enemy', { role: 'Champion', sprite: { kind: 'hero', classId: normalizeClassId(opponentHero.classId) } })],
  });
  return startEncounter(encounter, items);
}

/**
 * A party battle. Enemies come from opponentRoster (real heroes, guild
 * championships), from typed rosters (wild areas, regional missions, bosses)
 * or are generated from opponentPower/Level.
 */
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
  enemyCount = null,
  strength = 1,
  enemyTypes = null,
  boss = null,
  prestige = 0,
  risk = 2,
  canFlee = true,
  guaranteed = false,
  items = {},
}) {
  const party = playerHeroes.map(({ hero, role }) => makeCombatant(hero, 'party', { role }));
  const encounter = baseEncounter({
    id,
    mode: 'party',
    sourceType,
    sourceId,
    title,
    roundName,
    objective: objective || 'Defeat every enemy.',
    seed,
    maxTurns: 20,
    canFlee: canFlee && !guaranteed,
    guaranteed,
    prestige,
    risk,
    enemyName: opponentName,
    party,
    enemies: [],
    enemyBase: { primal: opponentPrimal, level: opponentLevel, power: opponentPower, strength },
  });
  if (opponentRoster?.length) {
    encounter.enemies = opponentRoster
      .slice(0, 5)
      .map((hero, index) =>
        makeCombatant(hero, 'enemy', { role: index === 0 ? 'Captain' : 'Fighter', sprite: { kind: 'hero', classId: normalizeClassId(hero.classId) } }),
      );
    return startEncounter(encounter, items);
  }
  const count = clamp(enemyCount ?? party.length - 1 + Math.ceil(risk / 2), 1, 5);
  if (boss || enemyTypes?.length) {
    // Typed enemies: a roster (and optionally a boss leading them).
    const roster = enemyTypes?.length ? enemyTypes : [];
    const start = hashString(`${id}:types`);
    const total = boss ? clamp(count - 1, 1, 3) + 1 : count;
    for (let index = 0; index < total; index += 1) {
      const isBoss = Boolean(boss) && index === 0;
      const type = isBoss ? boss : roster[(start + index) % roster.length];
      if (!type) continue;
      const name = isBoss ? type.name : `${type.name}${total > 1 && !boss ? ` ${String.fromCharCode(65 + index)}` : ''}`;
      encounter.enemies.push(typedEnemy(encounter, type, { id: `${id}-e${index}`, name, isBoss }));
    }
    if (boss?.intro) encounter.intro = `${boss.name}: ${boss.intro}`;
    return startEncounter(encounter, items);
  }
  const classes = [opponentClassId, 'Duelist', 'Ranger', 'Mage', 'Cleric'];
  for (let index = 0; index < count; index += 1) {
    const captain = index === 0;
    const classId = classes[index % classes.length];
    const enemy = syntheticEnemy({
      id: `${id}-e${index}`,
      name: captain ? `${opponentName} captain` : `${opponentName} ${String.fromCharCode(65 + index - 1)}`,
      classId,
      primal: opponentPrimal,
      level: clamp(opponentLevel + (captain ? 1 : 0), 1, 20),
      power: opponentPower + (captain ? 4 : -2 - index),
    });
    encounter.enemies.push(
      makeCombatant(enemy, 'enemy', {
        role: captain ? 'Captain' : 'Minion',
        scale: (captain ? 1 : 0.8) * strength,
        sprite: { kind: 'hero', classId: normalizeClassId(classId) },
      }),
    );
  }
  return startEncounter(encounter, items);
}

export function combatPrimalText(attackerPrimal, defenderPrimal) {
  const edge = primalCombatModifier(attackerPrimal, defenderPrimal);
  if (edge > 0) return `${attackerPrimal} has the primal edge over ${defenderPrimal}.`;
  if (edge < 0) return `${attackerPrimal} is at a primal disadvantage against ${defenderPrimal}.`;
  return `${attackerPrimal} and ${defenderPrimal} have no direct primal edge.`;
}

// ---------------------------------------------------------------- events

function log(encounter, actor, text) {
  encounter.log.push({ turn: encounter.turn, tone: actor?.side === 'enemy' ? 'bad' : 'good', text });
  if (encounter.log.length > 80) encounter.log.splice(0, encounter.log.length - 80);
}

/** Records one beat of the round for the UI to replay. */
function emit(encounter, data) {
  const event = { seq: encounter.events.length, turn: encounter.turn, hits: [], ...data };
  encounter.events.push(event);
  return event;
}

/** The effect sprite for an action (asset ids fx.* in src/data/assets.js). */
function fxFor(actor, skill = null) {
  if (skill) {
    if (skill.effect === 'heal' || skill.effect === 'cure' || skill.effect === 'revive') return 'heal';
    if (skill.effect === 'buff') return 'buff';
    if (skill.effect === 'status') return 'debuff';
    if (skill.physical === false) {
      return { Fire: 'fire', Water: 'ice', Air: 'lightning', Iron: 'lightning', Psychic: 'debuff', Plant: 'pierce', Animal: 'slash' }[actor.primal] || 'lightning';
    }
  }
  return ['Ranger', 'Rogue'].includes(actor.classId) ? 'pierce' : 'slash';
}

// ---------------------------------------------------------------- damage

function primalMultiplier(attacker, defender) {
  const edge = primalCombatModifier(attacker.primal, defender.primal);
  return edge > 0 ? 1.25 : edge < 0 ? 0.8 : 1;
}

/** 'WEAK' when the attacker's primal beats the target's, 'RESIST' when it loses. */
export function primalTag(attacker, defender) {
  const edge = primalCombatModifier(attacker.primal, defender.primal);
  return edge > 0 ? 'WEAK' : edge < 0 ? 'RESIST' : null;
}

function attackStat(actor, physical) {
  return (physical ? actor.atk : actor.mag) * (actor.status.atkUp ? 1.3 : 1) * (actor.status.atkDown ? 0.7 : 1);
}

function baseDamage(actor, target, power, physical) {
  const defense = target.def * (physical ? 0.5 : 0.3);
  return Math.max(1, attackStat(actor, physical) * power - defense) * primalMultiplier(actor, target) * (target.status.guard ? 0.5 : 1);
}

function hitChance(encounter, actor, target, physical) {
  if (!physical || (encounter.guaranteed && actor.side === 'party')) return 1;
  return clamp(0.92 + (actor.spd - target.spd) / 150, 0.7, 0.99);
}

function critChance(actor, physical) {
  return physical ? clamp(0.05 + actor.spd / 900, 0.05, 0.18) : 0.04;
}

function knockOut(encounter, unit) {
  unit.hp = 0;
  unit.ko = true;
  unit.status = {};
  unit.charging = null;
  log(encounter, unit.side === 'party' ? { side: 'enemy' } : { side: 'party' }, `${unit.name} is knocked out!`);
}

/** A charge broken by a stun or a heavy hit. */
function interrupt(encounter, unit, why) {
  if (!unit.charging) return false;
  const name = SKILLS[unit.charging]?.name || 'its attack';
  unit.charging = null;
  log(encounter, { side: 'party' }, `${unit.name}'s ${name} is interrupted ${why}!`);
  emit(encounter, { kind: 'interrupt', actorId: unit.id, banner: `${name} interrupted!` });
  return true;
}

/** Rolls and applies one hit. Returns the hit record for the event. */
function strike(encounter, actor, target, { power = 1, physical = true, flat = 0, salt = '' }) {
  const tag = flat ? null : primalTag(actor, target);
  if (!flat && random(encounter, `hit-${salt}`) > hitChance(encounter, actor, target, physical)) {
    return { targetId: target.id, type: 'miss', amount: 0, hp: target.hp };
  }
  let damage;
  let crit = false;
  if (flat) damage = flat * (0.9 + random(encounter, `flat-${salt}`) * 0.2) * (target.status.guard ? 0.5 : 1);
  else {
    damage = baseDamage(actor, target, power, physical) * (0.9 + random(encounter, `dmg-${salt}`) * 0.2);
    crit = random(encounter, `crit-${salt}`) < critChance(actor, physical);
    if (crit) damage *= 1.5;
  }
  const amount = Math.max(1, Math.round(damage));
  // Scripted battles can't be lost unfairly: heroes hold on at 1 HP.
  target.hp = Math.max(encounter.guaranteed && target.side === 'party' ? 1 : 0, target.hp - amount);
  if (actor) actor.damageDealt += amount;
  const hit = { targetId: target.id, type: 'damage', amount, crit, tag, hp: target.hp };
  if (target.hp <= 0) {
    knockOut(encounter, target);
    hit.ko = true;
    if (actor) actor.kos = (actor.kos || 0) + 1;
  } else if (target.charging && amount >= target.maxHp * INTERRUPT_SHARE) {
    hit.interrupted = true;
    interrupt(encounter, target, 'by a heavy blow');
  }
  return hit;
}

function healUnit(target, amount) {
  if (target.ko) return 0;
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + Math.round(amount));
  return target.hp - before;
}

function applyStatus(encounter, target, status, salt) {
  if (!status || target.ko) return false;
  if (status.chance < 1 && random(encounter, `status-${salt}`) > status.chance) return false;
  target.status[status.type] = Math.max(target.status[status.type] || 0, status.turns);
  if (status.type === 'taunt') target.status.guard = Math.max(target.status.guard || 0, status.turns);
  if (status.type === 'stun' && target.charging) interrupt(encounter, target, 'by a stun');
  return true;
}

/** Valid targets for a skill or item target type, from the actor's point of view. */
export function targetsFor(encounter, actor, targetType) {
  if (targetType === 'self') return [actor];
  if (targetType === 'ally' || targetType === 'allAllies') return living(alliesOf(encounter, actor));
  if (targetType === 'koAlly') return alliesOf(encounter, actor).filter((unit) => unit.ko && !unit.fled);
  return living(opponentsOf(encounter, actor));
}

function resolveSingleTarget(encounter, actor, targetType, targetId) {
  const options = targetsFor(encounter, actor, targetType);
  if (!options.length) return null;
  if (targetType === 'enemy') {
    // Attacks are drawn to a taunting unit.
    const taunter = options.find((unit) => unit.status.taunt);
    if (taunter) return taunter;
  }
  return options.find((unit) => unit.id === targetId) || (targetType === 'ally' ? [...options].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : options[0]);
}

// ---------------------------------------------------------------- actions

function applySkill(encounter, actor, skill, targetId) {
  const name = skillLabel(skill, actor.primal);
  if (actor.mp < skill.mp) {
    log(encounter, actor, `${actor.name} lacks the MP for ${name} and attacks instead.`);
    return applyAttack(encounter, actor, targetId);
  }
  actor.mp -= skill.mp;
  const area = skill.target === 'allEnemies' || skill.target === 'allAllies';
  const targets = area ? targetsFor(encounter, actor, skill.target) : [resolveSingleTarget(encounter, actor, skill.target, targetId)].filter(Boolean);
  const event = emit(encounter, { kind: 'skill', actorId: actor.id, label: name, fx: fxFor(actor, skill), area, mp: actor.mp, mpCost: skill.mp, big: Boolean(skill.charged) });
  if (!targets.length) {
    log(encounter, actor, `${actor.name}'s ${name} finds no target.`);
    return;
  }
  const parts = [];
  targets.forEach((target, index) => {
    const salt = `${actor.id}-${skill.id}-${index}`;
    if (skill.effect === 'damage' || skill.effect === 'steal') {
      if (target.ko) return;
      const vulnerable = skill.id === 'backstab' && (target.status.stun || target.status.poison || target.status.atkDown);
      const hit = strike(encounter, actor, target, { power: skill.power * (vulnerable ? 2 : 1), physical: skill.physical !== false, salt });
      let note = hit.type === 'miss' ? `${target.name} dodges` : `${target.name} −${hit.amount}${hit.crit ? ' (critical)' : ''}`;
      if (hit.type !== 'miss' && !target.ko) {
        const status = skill.status || (skill.elemental && actor.primal === 'Fire' ? { type: 'burn', turns: 2, chance: 0.3 } : null);
        if (status && applyStatus(encounter, target, status, salt)) {
          hit.status = status.type;
          note += ` (${status.type})`;
        }
      }
      if (skill.effect === 'steal' && hit.type !== 'miss' && actor.side === 'party' && random(encounter, `steal-${salt}`) < 0.5) {
        encounter.items.potion = (encounter.items.potion || 0) + 1;
        encounter.stolen += 1;
        note += ', stole a Potion';
      }
      event.hits.push(hit);
      parts.push(note);
    } else if (skill.effect === 'heal') {
      const amount = healUnit(target, actor.mag * skill.power + 10);
      actor.healingDone = (actor.healingDone || 0) + amount;
      event.hits.push({ targetId: target.id, type: 'heal', amount, hp: target.hp });
      parts.push(`${target.name} +${amount}`);
    } else if (skill.effect === 'cure') {
      delete target.status.poison;
      delete target.status.burn;
      delete target.status.stun;
      const amount = healUnit(target, actor.mag * skill.power + 5);
      event.hits.push({ targetId: target.id, type: 'heal', amount, hp: target.hp, status: 'cured' });
      parts.push(`${target.name} cured +${amount}`);
    } else if (skill.effect === 'revive') {
      if (!target.ko || target.fled) return;
      target.ko = false;
      target.hp = Math.max(1, Math.round(target.maxHp * skill.power));
      event.hits.push({ targetId: target.id, type: 'revive', amount: target.hp, hp: target.hp });
      parts.push(`${target.name} revived`);
    } else if (skill.effect === 'buff' || skill.effect === 'status') {
      const landed = applyStatus(encounter, target, skill.status, salt);
      event.hits.push({ targetId: target.id, type: landed ? 'status' : 'resist', status: skill.status.type, hp: target.hp });
      parts.push(landed ? `${target.name}: ${skill.status.type}` : `${target.name} resists`);
    }
  });
  log(encounter, actor, `${actor.name} uses ${name}: ${parts.join(', ') || 'no effect'}.`);
}

function applyAttack(encounter, actor, targetId) {
  const target = resolveSingleTarget(encounter, actor, 'enemy', targetId);
  if (!target) return;
  const hit = strike(encounter, actor, target, { power: 1, physical: true, salt: `${actor.id}-attack` });
  emit(encounter, { kind: 'attack', actorId: actor.id, label: 'Attack', fx: fxFor(actor), hits: [hit] });
  log(encounter, actor, hit.type === 'miss' ? `${actor.name} attacks ${target.name} and misses.` : `${actor.name} attacks ${target.name} for ${hit.amount}${hit.crit ? ' — critical!' : ''}.`);
}

function applyItem(encounter, actor, itemId, targetId) {
  const item = ITEMS[itemId];
  if (!item?.battle || !(encounter.items[itemId] > 0)) {
    log(encounter, actor, `${actor.name} reaches for an item that is not there and defends.`);
    actor.status.guard = Math.max(actor.status.guard || 0, 1);
    emit(encounter, { kind: 'defend', actorId: actor.id, label: 'Defend' });
    return;
  }
  encounter.items[itemId] -= 1;
  const effect = item.battle;
  const area = effect.target === 'allEnemies';
  const targets = area ? targetsFor(encounter, actor, 'allEnemies') : [resolveSingleTarget(encounter, actor, effect.target, targetId)].filter(Boolean);
  const event = emit(encounter, { kind: 'item', actorId: actor.id, label: item.name, fx: effect.damage ? 'fire' : 'heal', area });
  const parts = targets.map((target, index) => {
    if (effect.damage) {
      const hit = strike(encounter, actor, target, { flat: effect.damage, salt: `${itemId}-${index}` });
      event.hits.push(hit);
      return `${target.name} −${hit.amount}`;
    }
    if (effect.revive) {
      if (!target.ko || target.fled) return `${target.name} is not down`;
      target.ko = false;
      target.hp = Math.max(1, Math.round(target.maxHp * effect.revive));
      event.hits.push({ targetId: target.id, type: 'revive', amount: target.hp, hp: target.hp });
      return `${target.name} revived`;
    }
    const notes = [];
    const hit = { targetId: target.id, type: 'heal', amount: 0, hp: target.hp };
    if (effect.heal) {
      hit.amount = healUnit(target, effect.heal);
      actor.healingDone = (actor.healingDone || 0) + hit.amount;
      hit.hp = target.hp;
      notes.push(`+${hit.amount} HP`);
    }
    if (effect.mp) {
      const before = target.mp;
      target.mp = Math.min(target.maxMp, target.mp + effect.mp);
      hit.mp = target.mp;
      hit.mpGain = target.mp - before;
      notes.push(`+${target.mp - before} MP`);
    }
    if (effect.cure) {
      delete target.status.poison;
      delete target.status.burn;
      delete target.status.stun;
      hit.status = 'cured';
      notes.push('cured');
    }
    event.hits.push(hit);
    return `${target.name} ${notes.join(' ')}`;
  });
  log(encounter, actor, `${actor.name} uses ${item.name}: ${parts.join(', ') || 'no effect'}.`);
}

// ---------------------------------------------------------------- enemy AI

function strongestEnemy(encounter) {
  return [...living(encounter.enemies)].sort((a, b) => b.atk + b.mag - (a.atk + a.mag))[0] || null;
}

function affordable(unit, filter) {
  return unit.skills.map((id) => SKILLS[id]).filter((skill) => skill && skill.mp <= unit.mp && filter(skill));
}

function bestSkill(unit, filter) {
  return affordable(unit, filter).sort((a, b) => (b.power || 0) - (a.power || 0) || b.level - a.level)[0];
}

const ratio = (unit) => unit.hp / unit.maxHp;
const damaging = (skill) => ['damage', 'steal'].includes(skill.effect);

/**
 * One enemy's plan for the round, from its behavior profile (utility-style:
 * each profile scores its options and takes the best). Bosses follow their
 * phase script first: a charged attack, then a favoured area skill.
 */
function planFor(encounter, enemy) {
  const foes = living(encounter.party);
  if (!foes.length) return { action: 'defend' };
  const allies = living(encounter.enemies);
  const taunter = foes.find((unit) => unit.status.taunt);
  const roll = random(encounter, `plan-${enemy.id}`);
  const boss = enemy.boss;

  if (enemy.charging) return { action: 'skill', skillId: enemy.charging, release: true };
  if (boss?.charge && encounter.turn % boss.charge.every === 0) return { action: 'charge', skillId: boss.charge.skill };
  if (boss?.areaSkill && encounter.turn % 2 === 0) {
    const area = SKILLS[boss.areaSkill];
    if (area && enemy.mp >= area.mp) return { action: 'skill', skillId: area.id };
  }

  const area = bestSkill(enemy, (skill) => damaging(skill) && skill.target === 'allEnemies');
  const single = bestSkill(enemy, (skill) => damaging(skill) && skill.target === 'enemy');

  if (enemy.profile === 'brute') {
    const target = taunter || [...foes].sort((a, b) => a.def - b.def || a.hp - b.hp)[0];
    if (area && foes.length >= 3 && roll < 0.25) return { action: 'skill', skillId: area.id };
    if (single && roll < 0.5) return { action: 'skill', skillId: single.id, targetId: target.id };
    return { action: 'attack', targetId: target.id };
  }

  if (enemy.profile === 'caster') {
    const shield = allies.some((ally) => ally.id !== enemy.id && ally.profile !== 'caster');
    if (!enemy.retreated && shield && ratio(enemy) < 0.5) return { action: 'retreat' };
    const stunner = bestSkill(enemy, (skill) => skill.effect === 'status' && skill.status?.type === 'stun');
    const threat = [...foes].sort((a, b) => Math.max(b.atk, b.mag) - Math.max(a.atk, a.mag))[0];
    if (stunner && !foes.some((unit) => unit.status.stun) && roll < 0.25) return { action: 'skill', skillId: stunner.id, targetId: (taunter || threat).id };
    // Score every damaging spell against every hero: weaknesses first.
    let best = null;
    affordable(enemy, damaging).forEach((skill) => {
      if (skill.target === 'allEnemies') {
        const score = (skill.power || 1) * foes.reduce((sum, foe) => sum + primalMultiplier(enemy, foe), 0) * 0.75;
        if (!best || score > best.score) best = { score, skillId: skill.id };
      } else {
        (taunter ? [taunter] : foes).forEach((foe) => {
          const score = (skill.power || 1) * primalMultiplier(enemy, foe) * (skill.elemental ? 1.1 : 1) * (1.2 - ratio(foe) * 0.2);
          if (!best || score > best.score) best = { score, skillId: skill.id, targetId: foe.id };
        });
      }
    });
    if (best) return { action: 'skill', skillId: best.skillId, targetId: best.targetId };
    const target = taunter || [...foes].sort((a, b) => primalMultiplier(enemy, b) - primalMultiplier(enemy, a))[0];
    return { action: 'attack', targetId: target.id };
  }

  if (enemy.profile === 'healer') {
    const hurt = [...allies].filter((ally) => ratio(ally) < 0.7).sort((a, b) => ratio(a) - ratio(b));
    const groupHeal = bestSkill(enemy, (skill) => skill.effect === 'heal' && skill.target === 'allAllies');
    const heal = bestSkill(enemy, (skill) => skill.effect === 'heal' && skill.target === 'ally');
    if (hurt.length >= 2 && groupHeal) return { action: 'skill', skillId: groupHeal.id };
    if (hurt.length && (heal || groupHeal)) return { action: 'skill', skillId: (heal || groupHeal).id, targetId: hurt[0].id };
    if (allies.every((ally) => ratio(ally) > 0.85)) {
      const chant = bestSkill(enemy, (skill) => skill.effect === 'buff' && skill.target === 'allAllies' && skill.status?.type === 'atkUp');
      if (chant && allies.filter((ally) => ally.status.atkUp).length < allies.length / 2) return { action: 'skill', skillId: chant.id };
      const renew = bestSkill(enemy, (skill) => skill.effect === 'buff' && skill.status?.type === 'regen');
      const bare = [...allies].filter((ally) => !ally.status.regen).sort((a, b) => ratio(a) - ratio(b))[0];
      if (renew && bare) return { action: 'skill', skillId: renew.id, targetId: bare.id };
    }
    const target = taunter || [...foes].sort((a, b) => a.hp - b.hp)[0];
    return { action: 'attack', targetId: target.id };
  }

  if (enemy.profile === 'skirmisher') {
    // Only wild rabble run; champions and rival guild members stand their ground.
    if (!boss && enemy.sprite?.kind === 'enemy' && encounter.mode === 'party' && allies.length === 1 && ratio(enemy) < 0.6 && roll < 0.5) return { action: 'flee' };
    const target = taunter || [...foes].sort((a, b) => a.hp - b.hp)[0];
    const poison = bestSkill(enemy, (skill) => damaging(skill) && skill.status?.type === 'poison');
    if (poison && !target.status.poison && roll < 0.6) return { action: 'skill', skillId: poison.id, targetId: target.id };
    if (single && roll < 0.55) return { action: 'skill', skillId: single.id, targetId: target.id };
    return { action: 'attack', targetId: target.id };
  }

  if (enemy.profile === 'tank') {
    const exposedAlly = allies.some((ally) => ally.id !== enemy.id && ratio(ally) < 0.6);
    const taunt = bestSkill(enemy, (skill) => skill.status?.type === 'taunt');
    const wall = bestSkill(enemy, (skill) => skill.effect === 'buff' && skill.target === 'allAllies' && skill.status?.type === 'guard');
    if (!enemy.status.taunt && (exposedAlly || encounter.turn % 3 === 1)) {
      if (taunt) return { action: 'skill', skillId: taunt.id };
      if (wall && exposedAlly) return { action: 'skill', skillId: wall.id };
      if (exposedAlly) return { action: 'guard' };
    }
    const threat = taunter || [...foes].sort((a, b) => Math.max(b.atk, b.mag) - Math.max(a.atk, a.mag))[0];
    if (single && roll < 0.5) return { action: 'skill', skillId: single.id, targetId: threat.id };
    return { action: 'attack', targetId: threat.id };
  }

  const target = taunter || [...foes].sort((a, b) => a.hp - b.hp)[0];
  if (single && roll < 0.5) return { action: 'skill', skillId: single.id, targetId: target.id };
  return { action: 'attack', targetId: target.id };
}

/** A readable description of a plan, in the voice of the enemy's profile. */
function describePlan(encounter, enemy, plan) {
  const target = plan.targetId ? unitById(encounter, plan.targetId) : null;
  const who = enemy.name;
  const aim = target?.name || 'your party';
  if (plan.action === 'charge') {
    const name = SKILLS[plan.skillId]?.name || 'something terrible';
    return { icon: 'charge', label: `Charging ${name}`, telegraph: `${who} gathers power: next round it releases ${name} on everyone. Defend, or interrupt it with a stun or a heavy blow!`, big: true };
  }
  if (plan.action === 'flee') return { icon: 'flee', label: 'Fleeing', telegraph: `${who} is alone and looking for a way out.`, big: false };
  if (plan.action === 'retreat') return { icon: 'guard', label: 'Retreat', telegraph: `${who} slips behind its allies to recover.`, big: false };
  if (plan.action === 'guard' || plan.action === 'defend') return { icon: 'guard', label: 'Guard', telegraph: `${who} raises its guard.`, big: false };
  if (plan.action === 'attack') {
    const telegraph = {
      brute: `${who}${enemy.enraged ? ', enraged,' : ''} glares at ${aim}, the softest armor here.`,
      skirmisher: `${who} circles ${aim}, the most wounded.`,
      tank: `${who} braces and swings at ${aim}, the biggest threat.`,
      caster: `${who} lashes out at ${aim}.`,
      healer: `${who} has nobody to mend and strikes at ${aim}.`,
    }[enemy.profile] || `${who} is about to attack ${aim}.`;
    return { icon: 'attack', label: 'Attack', telegraph, big: false };
  }
  const skill = SKILLS[plan.skillId];
  const name = skillLabel(skill, enemy.primal);
  if (plan.release) return { icon: 'charge', label: name, telegraph: `${who} releases ${name} on your whole party! Defend now!`, big: true };
  if (skill.effect === 'heal') return { icon: 'heal', label: name, telegraph: `${who} prepares ${name} for ${skill.target === 'allAllies' ? 'all its allies' : target?.name || 'an ally'}.`, big: false };
  if (skill.status?.type === 'taunt') return { icon: 'taunt', label: name, telegraph: `${who} raises its shield and roars a challenge: attacks will go to it.`, big: false };
  if (skill.effect === 'buff') return { icon: 'buff', label: name, telegraph: `${who} begins ${name} for ${skill.target === 'allAllies' ? 'its allies' : target?.name || 'an ally'}.`, big: false };
  const big = (skill.power || 0) >= 1.4 || skill.target === 'allEnemies';
  const weak = target && primalTag(enemy, target) === 'WEAK';
  const area = skill.target === 'allEnemies';
  return {
    icon: skill.effect === 'status' ? 'debuff' : 'spell',
    label: name,
    telegraph: `${who} readies ${name} against ${area ? 'your whole party' : aim}${weak ? ` (${aim} is weak to ${enemy.primal})` : ''}${big ? '. Defend or stun it!' : '.'}`,
    big,
  };
}

function planEnemies(encounter) {
  encounter.enemyPlans = {};
  encounter.intents = {};
  living(encounter.enemies).forEach((enemy) => {
    const plan = planFor(encounter, enemy);
    encounter.enemyPlans[enemy.id] = plan;
    const described = describePlan(encounter, enemy, plan);
    encounter.intents[enemy.id] = { ...described, targetId: plan.targetId || null };
  });
  // The tell: the boss if there is one, else the strongest enemy.
  const teller = living(encounter.enemies).find((unit) => unit.boss) || strongestEnemy(encounter);
  if (!teller) {
    encounter.enemyIntent = null;
    return;
  }
  const plan = encounter.enemyPlans[teller.id];
  const target = plan.targetId ? unitById(encounter, plan.targetId) : null;
  encounter.enemyIntent = { actorId: teller.id, actorName: teller.name, ...plan, targetName: target?.name || null, ...encounter.intents[teller.id] };
}

/** Brutes enrage once they drop below 40% HP. */
function checkEnrage(encounter) {
  living(encounter.enemies).forEach((unit) => {
    if (unit.profile !== 'brute' || unit.enraged || ratio(unit) >= 0.4) return;
    unit.enraged = true;
    unit.status.atkUp = Math.max(unit.status.atkUp || 0, 3);
    log(encounter, unit, `${unit.name} is enraged!`);
    emit(encounter, { kind: 'enrage', actorId: unit.id, banner: `${unit.name} enrages!`, hits: [{ targetId: unit.id, type: 'status', status: 'atkUp', hp: unit.hp }] });
  });
}

/** Boss phase changes: banner, summons, new profile, statuses, area skill, charge. */
function checkPhases(encounter) {
  living(encounter.enemies).forEach((unit) => {
    const boss = unit.boss;
    const phase = boss?.phases?.[boss.phase];
    if (!phase || ratio(unit) > phase.at) return;
    boss.phase += 1;
    const event = emit(encounter, { kind: 'phase', actorId: unit.id, banner: phase.banner });
    log(encounter, unit, phase.banner);
    if (phase.profile) unit.profile = phase.profile;
    if (phase.areaSkill) boss.areaSkill = phase.areaSkill;
    if (phase.charge) boss.charge = phase.charge;
    Object.entries(phase.statuses || {}).forEach(([type, turns]) => {
      unit.status[type] = Math.max(unit.status[type] || 0, turns);
      event.hits.push({ targetId: unit.id, type: 'status', status: type, hp: unit.hp });
    });
    const type = phase.summon && ENEMY_TYPES[phase.summon.type];
    if (type) {
      const room = 5 - living(encounter.enemies).length;
      for (let index = 0; index < Math.min(room, phase.summon.count); index += 1) {
        encounter.summoned += 1;
        const summon = typedEnemy(encounter, type, { id: `${encounter.id}-s${encounter.summoned}`, name: `${type.name} ${encounter.summoned}` });
        encounter.enemies.push(summon);
        event.hits.push({ targetId: summon.id, type: 'summon', hp: summon.hp });
      }
    }
  });
}

/** Commands the auto-battle AI would give every living party member this round. */
export function autoCommands(encounter) {
  const commands = {};
  const reserved = {};
  const take = (itemId) => {
    if ((encounter.items[itemId] || 0) - (reserved[itemId] || 0) <= 0) return false;
    reserved[itemId] = (reserved[itemId] || 0) + 1;
    return true;
  };
  const intent = encounter.enemyIntent;
  const enemies = living(encounter.enemies);
  const charger = enemies.find((unit) => unit.charging || encounter.enemyPlans[unit.id]?.action === 'charge');
  living(encounter.party).forEach((hero) => {
    const allies = living(encounter.party);
    const fallen = encounter.party.filter((unit) => unit.ko);
    const hurt = [...allies].filter((unit) => ratio(unit) < 0.45).sort((a, b) => ratio(a) - ratio(b));
    const revive = bestSkill(hero, (skill) => skill.effect === 'revive');
    if (fallen.length && revive) return (commands[hero.id] = { action: 'skill', skillId: revive.id, targetId: fallen[0].id });
    if (fallen.length && ratio(hero) > 0.5 && take('phoenix-feather')) return (commands[hero.id] = { action: 'item', itemId: 'phoenix-feather', targetId: fallen[0].id });
    const groupHeal = bestSkill(hero, (skill) => skill.effect === 'heal' && skill.target === 'allAllies');
    if (hurt.length >= 2 && groupHeal) return (commands[hero.id] = { action: 'skill', skillId: groupHeal.id });
    const heal = bestSkill(hero, (skill) => skill.effect === 'heal');
    if (hurt.length && heal) return (commands[hero.id] = { action: 'skill', skillId: heal.id, targetId: hurt[0].id });
    if (hurt[0] && ratio(hurt[0]) < 0.3) {
      const potion = ['hi-potion', 'potion'].find((id) => take(id));
      if (potion) return (commands[hero.id] = { action: 'item', itemId: potion, targetId: hurt[0].id });
    }
    // A charged attack is coming: stun the charger if possible, otherwise brace.
    const stunner = bestSkill(hero, (skill) => skill.status?.type === 'stun' && skill.target === 'enemy');
    if (charger?.charging && stunner && !charger.status.stun) return (commands[hero.id] = { action: 'skill', skillId: stunner.id, targetId: charger.id });
    if (charger?.charging && ratio(hero) < 0.7) return (commands[hero.id] = { action: 'defend' });
    if (intent?.big && intent.targetId === hero.id && ratio(hero) < 0.6) return (commands[hero.id] = { action: 'defend' });
    const teller = intent ? unitById(encounter, intent.actorId) : null;
    if (intent?.big && stunner && teller && !teller.ko && !teller.status.stun) return (commands[hero.id] = { action: 'skill', skillId: stunner.id, targetId: teller.id });
    // Prefer targets weak to this hero's primal, then the most wounded.
    const weakest = [...enemies].sort((a, b) => primalMultiplier(hero, b) - primalMultiplier(hero, a) || a.hp - b.hp)[0];
    const area = bestSkill(hero, (skill) => skill.effect === 'damage' && skill.target === 'allEnemies');
    if (area && enemies.length >= 3 && hero.mp >= area.mp * 1.5) return (commands[hero.id] = { action: 'skill', skillId: area.id });
    const strike = bestSkill(hero, (skill) => skill.effect === 'damage' && skill.target === 'enemy');
    if (strike && weakest && hero.mp / hero.maxMp > 0.35) return (commands[hero.id] = { action: 'skill', skillId: strike.id, targetId: weakest.id });
    commands[hero.id] = { action: 'attack', targetId: weakest?.id };
  });
  return commands;
}

// ---------------------------------------------------------------- previews

/**
 * What a command would do to each valid target, before confirming it:
 * { [targetId]: { kind, min, max, hit, crit, tag, note } }.
 */
export function previewCommand(encounter, actorId, command) {
  const actor = unitById(encounter, actorId);
  if (!actor || !command) return {};
  const preview = {};
  if (command.action === 'attack') {
    targetsFor(encounter, actor, 'enemy').forEach((target) => {
      const base = baseDamage(actor, target, 1, true);
      preview[target.id] = { kind: 'damage', min: Math.max(1, Math.round(base * 0.9)), max: Math.max(1, Math.round(base * 1.1)), hit: hitChance(encounter, actor, target, true), crit: critChance(actor, true), tag: primalTag(actor, target) };
    });
    return preview;
  }
  if (command.action === 'skill') {
    const skill = SKILLS[command.skillId];
    if (!skill) return preview;
    targetsFor(encounter, actor, skill.target).forEach((target) => {
      if (damaging(skill)) {
        const physical = skill.physical !== false;
        const base = baseDamage(actor, target, skill.power || 1, physical);
        preview[target.id] = {
          kind: 'damage',
          min: Math.max(1, Math.round(base * 0.9)),
          max: Math.max(1, Math.round(base * 1.1)),
          hit: hitChance(encounter, actor, target, physical),
          crit: critChance(actor, physical),
          tag: primalTag(actor, target),
          note: skill.status ? `${Math.round((skill.status.chance || 1) * 100)}% ${skill.status.type}` : null,
        };
      } else if (skill.effect === 'heal' || skill.effect === 'cure') {
        const amount = Math.min(target.maxHp - target.hp, Math.round(actor.mag * skill.power + (skill.effect === 'heal' ? 10 : 5)));
        preview[target.id] = { kind: 'heal', min: amount, max: amount, hit: 1, note: skill.effect === 'cure' ? 'cures poison, burn, stun' : null };
      } else if (skill.effect === 'revive') {
        preview[target.id] = { kind: 'revive', min: Math.round(target.maxHp * skill.power), max: Math.round(target.maxHp * skill.power), hit: 1 };
      } else {
        preview[target.id] = { kind: 'status', hit: skill.status?.chance ?? 1, note: skill.status?.type };
      }
    });
    return preview;
  }
  if (command.action === 'item') {
    const effect = ITEMS[command.itemId]?.battle;
    if (!effect) return preview;
    targetsFor(encounter, actor, effect.target === 'allEnemies' ? 'allEnemies' : effect.target).forEach((target) => {
      if (effect.damage) preview[target.id] = { kind: 'damage', min: Math.round(effect.damage * 0.9), max: Math.round(effect.damage * 1.1), hit: 1, crit: 0, tag: null };
      else if (effect.revive) preview[target.id] = { kind: 'revive', min: Math.round(target.maxHp * effect.revive), max: Math.round(target.maxHp * effect.revive), hit: 1 };
      else {
        const amount = effect.heal ? Math.min(target.maxHp - target.hp, effect.heal) : 0;
        preview[target.id] = { kind: 'heal', min: amount, max: amount, hit: 1, note: [effect.mp ? `+${effect.mp} MP` : null, effect.cure ? 'cures' : null].filter(Boolean).join(', ') || null };
      }
    });
  }
  return preview;
}

// ---------------------------------------------------------------- turn order

/** Rolls this round's initiative (speed plus a small seeded roll). */
function rollInitiative(encounter) {
  encounter.initiative = Object.fromEntries(living(allUnits(encounter)).map((unit) => [unit.id, unit.spd + random(encounter, `init-${unit.id}`) * 8]));
}

function byInitiative(encounter, units) {
  return [...units].sort((a, b) => (encounter.initiative[b.id] ?? b.spd) - (encounter.initiative[a.id] ?? a.spd) || a.id.localeCompare(b.id));
}

/**
 * The next `count` turns: this round in initiative order, then the following
 * round estimated by speed. Stunned units are marked `skip`.
 */
export function turnOrder(encounter, count = 8) {
  if (!encounter || encounter.status !== 'active') return [];
  const now = byInitiative(encounter, living(allUnits(encounter)));
  const later = [...living(allUnits(encounter))].sort((a, b) => b.spd - a.spd || a.id.localeCompare(b.id));
  const turns = [];
  now.forEach((unit) => turns.push({ unitId: unit.id, side: unit.side, skip: (unit.status.stun || 0) > 0, round: encounter.turn }));
  for (let lap = 1; turns.length < count && later.length; lap += 1) {
    later.forEach((unit) => turns.push({ unitId: unit.id, side: unit.side, skip: (unit.status.stun || 0) > lap, round: encounter.turn + lap }));
  }
  return turns.slice(0, count);
}

// ---------------------------------------------------------------- rounds

function sanitize(encounter, hero, command) {
  if (!command || typeof command !== 'object') return null;
  if (command.action === 'skill' && !hero.skills.includes(command.skillId)) return null;
  if (command.action === 'item' && !(encounter.items[command.itemId] > 0)) return null;
  if (!['attack', 'skill', 'item', 'defend', 'wait'].includes(command.action)) return null;
  return command;
}

function endOfRound(encounter) {
  const event = emit(encounter, { kind: 'tick' });
  allUnits(encounter).forEach((unit) => {
    if (unit.ko) return;
    const hurt = (key, share, label) => {
      if (!unit.status[key]) return;
      const amount = Math.max(1, Math.round(unit.maxHp * share));
      unit.hp = Math.max(encounter.guaranteed && unit.side === 'party' ? 1 : 0, unit.hp - amount);
      log(encounter, unit.side === 'party' ? { side: 'enemy' } : { side: 'party' }, `${unit.name} takes ${amount} ${label} damage.`);
      const hit = { targetId: unit.id, type: 'damage', amount, status: key, hp: unit.hp };
      if (unit.hp <= 0) {
        knockOut(encounter, unit);
        hit.ko = true;
      }
      event.hits.push(hit);
    };
    hurt('poison', 0.08, 'poison');
    if (!unit.ko) hurt('burn', 0.1, 'burn');
    if (!unit.ko && unit.status.regen) {
      const amount = healUnit(unit, unit.maxHp * 0.08);
      if (amount) event.hits.push({ targetId: unit.id, type: 'heal', amount, status: 'regen', hp: unit.hp });
    }
    TIMED.forEach((key) => {
      if (unit.status[key]) {
        unit.status[key] -= 1;
        if (unit.status[key] <= 0) delete unit.status[key];
      }
    });
  });
  if (!event.hits.length) encounter.events.pop();
}

function hpPct(units) {
  const max = units.reduce((sum, unit) => sum + unit.maxHp, 0) || 1;
  return Math.round((units.reduce((sum, unit) => sum + unit.hp, 0) / max) * 100);
}

function finish(encounter, playerWon, method) {
  const playerHpPct = hpPct(encounter.party);
  const enemyHpPct = hpPct(encounter.enemies);
  const knockedOut = encounter.party.filter((unit) => unit.ko).map((unit) => unit.heroId);
  const performance = playerWon
    ? clamp(Math.round(45 + playerHpPct * 0.45 - knockedOut.length * 8 + Math.max(0, 8 - encounter.turn)), 0, 100)
    : method === 'withdrew'
      ? 30
      : clamp(Math.round((100 - enemyHpPct) * 0.45), 0, 47);
  encounter.status = playerWon ? 'won' : 'lost';
  encounter.enemyIntent = null;
  encounter.intents = {};
  encounter.result = {
    playerWon,
    turns: encounter.turn,
    method,
    playerHpPct,
    enemyHpPct,
    playerDamage: encounter.party.reduce((sum, unit) => sum + unit.damageDealt, 0),
    enemyDamage: encounter.enemies.reduce((sum, unit) => sum + unit.damageDealt, 0),
    damageByHero: Object.fromEntries(encounter.party.map((unit) => [unit.heroId, unit.damageDealt])),
    performance,
    knockedOut,
    itemsUsed: Object.fromEntries(
      Object.keys({ ...encounter.itemsAtStart, ...encounter.items })
        .map((id) => [id, (encounter.itemsAtStart[id] || 0) - (encounter.items[id] || 0)])
        .filter(([, used]) => used !== 0),
    ),
  };
  encounter.log.push({ turn: encounter.turn, tone: playerWon ? 'good' : 'bad', text: playerWon ? `Victory — ${method}.` : `Defeat — ${method}.` });
  emit(encounter, { kind: playerWon ? 'victory' : 'defeat' });
}

function checkEnd(encounter) {
  if (!living(encounter.enemies).length) return finish(encounter, true, encounter.mode === 'duel' ? 'knockout' : 'all enemies defeated'), true;
  if (!living(encounter.party).length) return finish(encounter, false, encounter.mode === 'duel' ? 'knocked out' : 'party wiped out'), true;
  return false;
}

/** Enemy actions outside skills: charge, retreat, guard, flee. */
function applyEnemyAction(encounter, actor, command) {
  if (command.action === 'charge') {
    actor.charging = command.skillId;
    const name = SKILLS[command.skillId]?.name || 'its attack';
    log(encounter, actor, `${actor.name} begins charging ${name}!`);
    emit(encounter, { kind: 'charge', actorId: actor.id, label: name, fx: 'debuff', banner: `${actor.name} charges ${name}!` });
    return true;
  }
  if (command.action === 'retreat') {
    actor.retreated = true;
    actor.status.guard = Math.max(actor.status.guard || 0, 2);
    log(encounter, actor, `${actor.name} slips behind its allies.`);
    emit(encounter, { kind: 'retreat', actorId: actor.id, label: 'Retreat', hits: [{ targetId: actor.id, type: 'status', status: 'guard', hp: actor.hp }] });
    return true;
  }
  if (command.action === 'guard') {
    actor.status.guard = Math.max(actor.status.guard || 0, 1);
    log(encounter, actor, `${actor.name} guards its allies.`);
    emit(encounter, { kind: 'defend', actorId: actor.id, label: 'Guard', hits: [{ targetId: actor.id, type: 'status', status: 'guard', hp: actor.hp }] });
    return true;
  }
  if (command.action === 'flee') {
    actor.fled = true;
    actor.ko = true;
    actor.status = {};
    log(encounter, actor, `${actor.name} flees the battle!`);
    emit(encounter, { kind: 'flee', actorId: actor.id, label: 'Flee', banner: `${actor.name} flees!` });
    return true;
  }
  return false;
}

/**
 * Plays one round. commands: { [partyUnitId]: { action, skillId?, itemId?, targetId? } }.
 * Missing or invalid commands fall back to the auto-battle choice.
 */
export function performCombatRound(encounterInput, commands = {}) {
  const encounter = clone(encounterInput);
  if (!encounter || encounter.status !== 'active') return encounter;
  encounter.events = [];
  const auto = autoCommands(encounter);
  const orders = {};
  living(encounter.party).forEach((hero) => {
    orders[hero.id] = sanitize(encounter, hero, commands[hero.id]) || auto[hero.id] || { action: 'defend' };
  });
  Object.entries(encounter.enemyPlans).forEach(([id, plan]) => {
    orders[id] = plan;
  });
  // Defending takes effect at once, before anyone moves.
  Object.entries(orders).forEach(([id, order]) => {
    const unit = unitById(encounter, id);
    if (order.action !== 'defend' || !unit || unit.ko) return;
    unit.status.guard = Math.max(unit.status.guard || 0, 1);
    emit(encounter, { kind: 'defend', actorId: unit.id, label: 'Defend', hits: [{ targetId: unit.id, type: 'status', status: 'guard', hp: unit.hp }] });
  });

  for (const actor of byInitiative(encounter, living(allUnits(encounter)))) {
    if (actor.ko) continue;
    if (actor.status.stun) {
      actor.status.stun -= 1;
      if (actor.status.stun <= 0) delete actor.status.stun;
      log(encounter, actor, `${actor.name} is stunned and cannot act.`);
      emit(encounter, { kind: 'stunned', actorId: actor.id, label: 'Stunned' });
      continue;
    }
    const command = orders[actor.id] || planFor(encounter, actor);
    if (command.release) {
      // The charge was broken earlier this round: nothing to release.
      if (!actor.charging) continue;
      actor.charging = null;
    }
    if (command.action === 'attack') applyAttack(encounter, actor, command.targetId);
    else if (command.action === 'skill' && SKILLS[command.skillId]) applySkill(encounter, actor, SKILLS[command.skillId], command.targetId);
    else if (command.action === 'item') applyItem(encounter, actor, command.itemId, command.targetId);
    else if (actor.side === 'enemy') applyEnemyAction(encounter, actor, command);
    checkPhases(encounter);
    checkEnrage(encounter);
    if (checkEnd(encounter)) return encounter;
  }

  endOfRound(encounter);
  checkPhases(encounter);
  if (checkEnd(encounter)) return encounter;
  if (encounter.turn >= encounter.maxTurns) {
    const party = hpPct(encounter.party);
    const enemies = hpPct(encounter.enemies);
    finish(
      encounter,
      encounter.guaranteed || party > enemies,
      encounter.mode === 'duel' ? `judges’ decision (${party}% vs ${enemies}% HP)` : `time ran out (${party}% vs ${enemies}% HP)`,
    );
    return encounter;
  }
  encounter.turn += 1;
  rollInitiative(encounter);
  planEnemies(encounter);
  if (encounter.enemyIntent) encounter.log.push({ turn: encounter.turn, tone: 'info', text: `Tell: ${encounter.enemyIntent.telegraph}` });
  return encounter;
}

/** Try to run away. On failure the party loses the round while the enemies act. */
export function attemptFlee(encounterInput) {
  const encounter = clone(encounterInput);
  if (!encounter || encounter.status !== 'active' || !encounter.canFlee) return encounter;
  encounter.events = [];
  const avg = (units) => units.reduce((sum, unit) => sum + unit.spd, 0) / Math.max(1, units.length);
  const chance = clamp(0.5 + (avg(living(encounter.party)) - avg(living(encounter.enemies))) / 50, 0.2, 0.9);
  if (random(encounter, 'flee') < chance) {
    finish(encounter, false, 'withdrew');
    return encounter;
  }
  encounter.log.push({ turn: encounter.turn, tone: 'bad', text: 'The party fails to escape!' });
  const wait = Object.fromEntries(living(encounter.party).map((hero) => [hero.id, { action: 'wait' }]));
  const next = performCombatRound(encounter, wait);
  next.events.unshift({ seq: -1, turn: encounter.turn, kind: 'fleeFailed', hits: [], banner: 'No way out!' });
  return next;
}

/** Auto-battle to the end (simulations and background resolution). */
export function autoResolveEncounter(encounterInput) {
  let encounter = clone(encounterInput);
  let safety = 40;
  while (encounter?.status === 'active' && safety-- > 0) encounter = performCombatRound(encounter, autoCommands(encounter));
  return encounter;
}

/** Battle stats a hero would bring into combat (for the status screen). */
export function heroBattleStats(hero) {
  const unit = makeCombatant(hero, 'party');
  return { maxHp: unit.maxHp, maxMp: unit.maxMp, atk: unit.atk, def: unit.def, mag: unit.mag, spd: unit.spd };
}
