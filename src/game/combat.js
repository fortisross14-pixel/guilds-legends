// @ts-check
// Per-hero, turn-based battles (front view, Dragon Quest style).
//
// Each round the player gives one command per living hero (attack, skill,
// item, defend) with a target. Enemies plan their moves at the start of the
// round; the strongest enemy's plan is shown as the "tell". Everyone then acts
// in speed order. Pure and deterministic: all randomness comes from the
// encounter seed.
import { primalCombatModifier } from '../data/world.js';
import { normalizeClassId } from '../data/content.js';
import { SKILLS, skillLabel, skillsForLevel } from '../data/skills.js';
import { ITEMS, gearStats } from '../data/items.js';
import { ENEMY_ROLES } from '../data/enemies.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));
const ENEMY_SPRITE_COUNT = 16;

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

export const COMMANDS = [
  { id: 'attack', label: 'Attack', icon: '⚔' },
  { id: 'skill', label: 'Skill', icon: '✦' },
  { id: 'item', label: 'Item', icon: '✚' },
  { id: 'defend', label: 'Defend', icon: '◆' },
];

// ---------------------------------------------------------------- combatants

// mods: per-stat multipliers (enemy roles, bosses); skills: replaces class skills.
function makeCombatant(hero, side, { role = null, sprite = null, scale = 1, mods = null, skills = null } = {}) {
  const level = hero.level || 1;
  const attributes = hero.attributes || {};
  const get = (key) => Number(attributes[key] ?? hero.power ?? 50);
  const gear = gearStats(hero);
  const classId = normalizeClassId(hero.classId);
  const m = { hp: 1, atk: 1, def: 1, mag: 1, spd: 1, ...(mods || {}) };
  const maxHp = Math.round((30 + get('Endurance') * 1.0 + get('Might') * 0.2 + level * 3 + gear.hp) * scale * m.hp);
  const maxMp = Math.round(8 + (get('Mind') + get('Spirit')) * 0.15 + level * 1.5 + gear.mp);
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
    maxHp,
    hp: maxHp,
    maxMp,
    mp: maxMp,
    atk: Math.round((get('Might') * 0.45 + get('Finesse') * 0.25 + level * 0.8 + gear.atk) * scale * m.atk),
    def: Math.round((get('Endurance') * 0.3 + get('Spirit') * 0.1 + level * 0.5 + gear.def) * m.def),
    mag: Math.round((get('Mind') * 0.4 + get('Spirit') * 0.3 + level * 0.8 + gear.mag) * scale * m.mag),
    spd: Math.round((get('Finesse') * 0.5 + get('Presence') * 0.15 + gear.spd) * m.spd),
    skills: skills || skillsForLevel(classId, level).map((skill) => skill.id),
    status: {},
    ko: false,
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
    result: null,
    enemyPlans: {},
    enemyIntent: null,
    items: {},
    itemsAtStart: {},
    stolen: 0,
    ...fields,
    seed: fields.seed >>> 0 || 1,
  };
}

function startEncounter(encounter, items) {
  const consumables = Object.fromEntries(Object.entries(items || {}).filter(([id, count]) => ITEMS[id]?.kind === 'consumable' && count > 0));
  encounter.items = { ...consumables };
  encounter.itemsAtStart = { ...consumables };
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
 * championships) or are generated from opponentPower/Level (missions, roads).
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
  });
  if (opponentRoster?.length) {
    encounter.enemies = opponentRoster
      .slice(0, 5)
      .map((hero, index) =>
        makeCombatant(hero, 'enemy', { role: index === 0 ? 'Captain' : 'Fighter', sprite: { kind: 'hero', classId: normalizeClassId(hero.classId) } }),
      );
  } else {
    const count = clamp(enemyCount ?? party.length - 1 + Math.ceil(risk / 2), 1, 5);
    if (boss || enemyTypes?.length) {
      // Typed enemies: a regional roster (and optionally a boss leading them).
      const roster = enemyTypes?.length ? enemyTypes : [];
      const start = hashString(`${id}:types`);
      const total = boss ? clamp(count - 1, 1, 3) + 1 : count;
      for (let index = 0; index < total; index += 1) {
        const type = boss && index === 0 ? boss : roster[(start + index) % roster.length];
        if (!type) continue;
        const role = ENEMY_ROLES[type.role] || ENEMY_ROLES.brute;
        const isBoss = boss && index === 0;
        const enemy = syntheticEnemy({
          id: `${id}-e${index}`,
          name: isBoss ? type.name : `${type.name}${total > 1 && !boss ? ` ${String.fromCharCode(65 + index)}` : ''}`,
          classId: role.classId,
          primal: opponentPrimal,
          level: clamp(opponentLevel + (isBoss ? 3 : 0), 1, 20),
          power: opponentPower + (isBoss ? 8 : -2 - index),
        });
        const mods = isBoss ? { ...role.mods, hp: role.mods.hp * 3.2, atk: role.mods.atk * 1.25, mag: role.mods.mag * 1.25 } : role.mods;
        encounter.enemies.push(
          makeCombatant(enemy, 'enemy', {
            role: isBoss ? 'Boss' : type.role,
            scale: (isBoss ? 1 : 0.85) * strength,
            mods,
            skills: type.skills,
            sprite: { kind: 'enemy', key: type.sprite },
          }),
        );
      }
      if (boss?.intro) encounter.intro = `${boss.name}: ${boss.intro}`;
      return startEncounter(encounter, items);
    }
    const spriteBase = hashString(`${id}:${opponentName}`);
    const classes = [opponentClassId, 'Duelist', 'Ranger', 'Mage', 'Cleric'];
    for (let index = 0; index < count; index += 1) {
      const captain = index === 0;
      const enemy = syntheticEnemy({
        id: `${id}-e${index}`,
        name: captain ? `${opponentName} captain` : `${opponentName} ${String.fromCharCode(65 + index - 1)}`,
        classId: classes[index % classes.length],
        primal: opponentPrimal,
        level: clamp(opponentLevel + (captain ? 1 : 0), 1, 20),
        power: opponentPower + (captain ? 4 : -2 - index),
      });
      const spriteNumber = ((spriteBase + (captain ? 0 : 1 + (index % 2))) % ENEMY_SPRITE_COUNT) + 1;
      encounter.enemies.push(
        makeCombatant(enemy, 'enemy', {
          role: captain ? 'Captain' : 'Minion',
          scale: (captain ? 1 : 0.8) * strength,
          sprite: { kind: 'enemy', key: `enemy_${String(spriteNumber).padStart(2, '0')}` },
        }),
      );
    }
  }
  return startEncounter(encounter, items);
}

export function combatPrimalText(attackerPrimal, defenderPrimal) {
  const edge = primalCombatModifier(attackerPrimal, defenderPrimal);
  if (edge > 0) return `${attackerPrimal} has the primal edge over ${defenderPrimal}.`;
  if (edge < 0) return `${attackerPrimal} is at a primal disadvantage against ${defenderPrimal}.`;
  return `${attackerPrimal} and ${defenderPrimal} have no direct primal edge.`;
}

// ---------------------------------------------------------------- effects

function primalMultiplier(attacker, defender) {
  const edge = primalCombatModifier(attacker.primal, defender.primal);
  return edge > 0 ? 1.25 : edge < 0 ? 0.8 : 1;
}

function log(encounter, actor, text) {
  encounter.log.push({ turn: encounter.turn, tone: actor?.side === 'enemy' ? 'bad' : 'good', text });
  if (encounter.log.length > 80) encounter.log.splice(0, encounter.log.length - 80);
}

function knockOut(encounter, unit) {
  unit.hp = 0;
  unit.ko = true;
  unit.status = {};
  log(encounter, unit.side === 'party' ? { side: 'enemy' } : { side: 'party' }, `${unit.name} is knocked out!`);
}

function dealDamage(encounter, actor, target, { power = 1, physical = true, flat = 0, salt = '' } = {}) {
  let damage;
  if (flat) damage = flat * (0.9 + random(encounter, `flat-${salt}`) * 0.2);
  else {
    const attack = (physical ? actor.atk : actor.mag) * (actor.status.buff ? 1.3 : 1);
    const defense = target.def * (physical ? 0.5 : 0.3) * (target.status.exposed ? 0.5 : 1);
    damage = (attack * power - defense) * (0.9 + random(encounter, `dmg-${salt}`) * 0.2) * primalMultiplier(actor, target);
  }
  if (target.status.guard) damage *= 0.5;
  const amount = Math.max(1, Math.round(damage));
  // Scripted battles can't be lost unfairly: heroes hold on at 1 HP.
  target.hp = Math.max(encounter.guaranteed && target.side === 'party' ? 1 : 0, target.hp - amount);
  if (actor) actor.damageDealt += amount;
  if (target.hp <= 0) knockOut(encounter, target);
  return amount;
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
  if (status.type === 'taunt') target.status.guard = 1;
  return true;
}

/** Valid targets for a skill or item target type, from the actor's point of view. */
export function targetsFor(encounter, actor, targetType) {
  if (targetType === 'self') return [actor];
  if (targetType === 'ally' || targetType === 'allAllies') return living(alliesOf(encounter, actor));
  if (targetType === 'koAlly') return alliesOf(encounter, actor).filter((unit) => unit.ko);
  return living(opponentsOf(encounter, actor));
}

function resolveSingleTarget(encounter, actor, targetType, targetId) {
  const options = targetsFor(encounter, actor, targetType);
  if (!options.length) return null;
  if (targetType === 'enemy' && actor.side === 'enemy') {
    const taunter = options.find((unit) => unit.status.taunt);
    if (taunter) return taunter;
  }
  if (targetType === 'enemy' && actor.side === 'party') {
    // Party attacks are also drawn to a taunting enemy.
    const taunter = options.find((unit) => unit.status.taunt);
    if (taunter && targetId !== taunter.id) return taunter;
  }
  return options.find((unit) => unit.id === targetId) || (targetType === 'ally' ? [...options].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : options[0]);
}

function applySkill(encounter, actor, skill, targetId) {
  const name = skillLabel(skill, actor.primal);
  if (actor.mp < skill.mp) {
    log(encounter, actor, `${actor.name} lacks the MP for ${name} and attacks instead.`);
    return applyAttack(encounter, actor, targetId);
  }
  actor.mp -= skill.mp;
  const area = skill.target === 'allEnemies' || skill.target === 'allAllies';
  const targets = area ? targetsFor(encounter, actor, skill.target) : [resolveSingleTarget(encounter, actor, skill.target, targetId)].filter(Boolean);
  if (!targets.length) {
    log(encounter, actor, `${actor.name}'s ${name} finds no target.`);
    return;
  }
  const parts = [];
  targets.forEach((target, index) => {
    const salt = `${actor.id}-${skill.id}-${index}`;
    if (skill.effect === 'damage' || skill.effect === 'steal') {
      if (target.ko) return;
      const vulnerable = skill.id === 'backstab' && (target.status.stun || target.status.poison || target.status.exposed);
      const amount = dealDamage(encounter, actor, target, { power: skill.power * (vulnerable ? 2 : 1), physical: skill.physical !== false, salt });
      let note = `${target.name} −${amount}`;
      if (skill.status && applyStatus(encounter, target, skill.status, salt)) note += ` (${skill.status.type})`;
      if (skill.effect === 'steal' && actor.side === 'party' && random(encounter, `steal-${salt}`) < 0.5) {
        encounter.items.potion = (encounter.items.potion || 0) + 1;
        encounter.stolen += 1;
        note += ', stole a Potion';
      }
      parts.push(note);
    } else if (skill.effect === 'heal') {
      parts.push(`${target.name} +${healUnit(target, actor.mag * skill.power + 10)}`);
    } else if (skill.effect === 'cure') {
      delete target.status.poison;
      delete target.status.stun;
      parts.push(`${target.name} cured +${healUnit(target, actor.mag * skill.power + 5)}`);
    } else if (skill.effect === 'revive') {
      if (!target.ko) return;
      target.ko = false;
      target.hp = Math.max(1, Math.round(target.maxHp * skill.power));
      parts.push(`${target.name} revived`);
    } else if (skill.effect === 'buff' || skill.effect === 'status') {
      parts.push(applyStatus(encounter, target, skill.status, salt) ? `${target.name}: ${skill.status.type}` : `${target.name} resists`);
    }
  });
  log(encounter, actor, `${actor.name} uses ${name}: ${parts.join(', ') || 'no effect'}.`);
}

function applyAttack(encounter, actor, targetId) {
  const target = resolveSingleTarget(encounter, actor, 'enemy', targetId);
  if (!target) return;
  const amount = dealDamage(encounter, actor, target, { power: 1, physical: true, salt: `${actor.id}-attack` });
  log(encounter, actor, `${actor.name} attacks ${target.name} for ${amount}.`);
}

function applyItem(encounter, actor, itemId, targetId) {
  const item = ITEMS[itemId];
  if (!item?.battle || !(encounter.items[itemId] > 0)) {
    log(encounter, actor, `${actor.name} reaches for an item that is not there and defends.`);
    actor.status.guard = 1;
    return;
  }
  encounter.items[itemId] -= 1;
  const effect = item.battle;
  const area = effect.target === 'allEnemies';
  const targets = area ? targetsFor(encounter, actor, 'allEnemies') : [resolveSingleTarget(encounter, actor, effect.target, targetId)].filter(Boolean);
  const parts = targets.map((target, index) => {
    if (effect.damage) return `${target.name} −${dealDamage(encounter, actor, target, { flat: effect.damage, salt: `${itemId}-${index}` })}`;
    if (effect.revive) {
      if (!target.ko) return `${target.name} is not down`;
      target.ko = false;
      target.hp = Math.max(1, Math.round(target.maxHp * effect.revive));
      return `${target.name} revived`;
    }
    const notes = [];
    if (effect.heal) notes.push(`+${healUnit(target, effect.heal)} HP`);
    if (effect.mp) {
      const before = target.mp;
      target.mp = Math.min(target.maxMp, target.mp + effect.mp);
      notes.push(`+${target.mp - before} MP`);
    }
    if (effect.cure) {
      delete target.status.poison;
      delete target.status.stun;
      notes.push('cured');
    }
    return `${target.name} ${notes.join(' ')}`;
  });
  log(encounter, actor, `${actor.name} uses ${item.name}: ${parts.join(', ') || 'no effect'}.`);
}

// ---------------------------------------------------------------- AI

function strongestEnemy(encounter) {
  return [...living(encounter.enemies)].sort((a, b) => b.atk + b.mag - (a.atk + a.mag))[0] || null;
}

function bestSkill(unit, filter) {
  return unit.skills
    .map((id) => SKILLS[id])
    .filter((skill) => skill && skill.mp <= unit.mp && filter(skill))
    .sort((a, b) => (b.power || 0) - (a.power || 0) || b.level - a.level)[0];
}

function planFor(encounter, enemy) {
  const allies = living(encounter.enemies);
  const foes = living(encounter.party);
  if (!foes.length) return { action: 'defend' };
  const roll = random(encounter, `plan-${enemy.id}`);
  const hurtAlly = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const heal = bestSkill(enemy, (skill) => skill.effect === 'heal');
  if (heal && hurtAlly && hurtAlly.hp / hurtAlly.maxHp < 0.4) return { action: 'skill', skillId: heal.id, targetId: hurtAlly.id };
  const taunter = foes.find((unit) => unit.status.taunt);
  const weakest = [...foes].sort((a, b) => a.hp - b.hp)[0];
  const target = taunter || (roll < 0.55 ? weakest : foes[Math.floor(random(encounter, `target-${enemy.id}`) * foes.length)]);
  const area = bestSkill(enemy, (skill) => skill.effect === 'damage' && skill.target === 'allEnemies');
  if (area && foes.length >= 2 && roll < 0.3) return { action: 'skill', skillId: area.id };
  const single = bestSkill(enemy, (skill) => ['damage', 'steal'].includes(skill.effect) && skill.target === 'enemy');
  if (single && roll < 0.6) return { action: 'skill', skillId: single.id, targetId: target.id };
  const status = bestSkill(enemy, (skill) => skill.effect === 'status' && skill.target === 'enemy');
  if (status && roll > 0.9) return { action: 'skill', skillId: status.id, targetId: target.id };
  if (enemy.hp / enemy.maxHp < 0.25 && roll > 0.8) return { action: 'defend' };
  return { action: 'attack', targetId: target.id };
}

function describePlan(encounter, enemy, plan) {
  const target = plan.targetId ? unitById(encounter, plan.targetId) : null;
  if (plan.action === 'defend') return { label: 'Defend', telegraph: `${enemy.name} raises its guard.`, big: false };
  if (plan.action === 'attack') return { label: 'Attack', telegraph: `${enemy.name} is about to attack ${target?.name || 'your party'}.`, big: false };
  const skill = SKILLS[plan.skillId];
  const name = skillLabel(skill, enemy.primal);
  const big = (skill.power || 0) >= 1.4 || skill.target === 'allEnemies';
  const aim = skill.target === 'allEnemies' ? 'your whole party' : target?.name || 'an ally';
  return { label: name, telegraph: `${enemy.name} prepares ${name} against ${aim}${big ? ' — defend or stun it!' : '.'}`, big };
}

function planEnemies(encounter) {
  encounter.enemyPlans = {};
  living(encounter.enemies).forEach((enemy) => {
    encounter.enemyPlans[enemy.id] = planFor(encounter, enemy);
  });
  const strongest = strongestEnemy(encounter);
  if (!strongest) {
    encounter.enemyIntent = null;
    return;
  }
  const plan = encounter.enemyPlans[strongest.id];
  const target = plan.targetId ? unitById(encounter, plan.targetId) : null;
  encounter.enemyIntent = {
    actorId: strongest.id,
    actorName: strongest.name,
    ...plan,
    targetName: target?.name || null,
    ...describePlan(encounter, strongest, plan),
  };
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
  living(encounter.party).forEach((hero) => {
    const allies = living(encounter.party);
    const fallen = encounter.party.filter((unit) => unit.ko);
    const hurt = [...allies].filter((unit) => unit.hp / unit.maxHp < 0.45).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const revive = bestSkill(hero, (skill) => skill.effect === 'revive');
    if (fallen.length && revive) return (commands[hero.id] = { action: 'skill', skillId: revive.id, targetId: fallen[0].id });
    if (fallen.length && hero.hp / hero.maxHp > 0.5 && take('phoenix-feather'))
      return (commands[hero.id] = { action: 'item', itemId: 'phoenix-feather', targetId: fallen[0].id });
    const groupHeal = bestSkill(hero, (skill) => skill.effect === 'heal' && skill.target === 'allAllies');
    if (hurt.length >= 2 && groupHeal) return (commands[hero.id] = { action: 'skill', skillId: groupHeal.id });
    const heal = bestSkill(hero, (skill) => skill.effect === 'heal');
    if (hurt.length && heal) return (commands[hero.id] = { action: 'skill', skillId: heal.id, targetId: hurt[0].id });
    if (hurt[0]?.hp / hurt[0]?.maxHp < 0.3) {
      const potion = ['hi-potion', 'potion'].find((id) => take(id));
      if (potion) return (commands[hero.id] = { action: 'item', itemId: potion, targetId: hurt[0].id });
    }
    if (intent?.big && intent.targetId === hero.id && hero.hp / hero.maxHp < 0.6) return (commands[hero.id] = { action: 'defend' });
    const stunner = bestSkill(hero, (skill) => skill.status?.type === 'stun' && skill.target === 'enemy');
    const strongest = intent ? unitById(encounter, intent.actorId) : null;
    if (intent?.big && stunner && strongest && !strongest.ko && !strongest.status.stun)
      return (commands[hero.id] = { action: 'skill', skillId: stunner.id, targetId: strongest.id });
    const weakest = [...enemies].sort((a, b) => a.hp - b.hp)[0];
    const area = bestSkill(hero, (skill) => skill.effect === 'damage' && skill.target === 'allEnemies');
    if (area && enemies.length >= 3 && hero.mp >= area.mp * 1.5) return (commands[hero.id] = { action: 'skill', skillId: area.id });
    const strike = bestSkill(hero, (skill) => skill.effect === 'damage' && skill.target === 'enemy');
    if (strike && weakest && hero.mp / hero.maxMp > 0.35) return (commands[hero.id] = { action: 'skill', skillId: strike.id, targetId: weakest.id });
    commands[hero.id] = { action: 'attack', targetId: weakest?.id };
  });
  return commands;
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
  allUnits(encounter).forEach((unit) => {
    if (unit.ko) return;
    if (unit.status.poison) {
      const amount = Math.max(1, Math.round(unit.maxHp * 0.08));
      unit.hp = Math.max(0, unit.hp - amount);
      log(encounter, unit.side === 'party' ? { side: 'enemy' } : { side: 'party' }, `${unit.name} takes ${amount} poison damage.`);
      if (unit.hp <= 0) knockOut(encounter, unit);
    }
    delete unit.status.guard;
    ['poison', 'stun', 'buff', 'taunt', 'exposed'].forEach((key) => {
      if (unit.status[key]) {
        unit.status[key] -= 1;
        if (unit.status[key] <= 0) delete unit.status[key];
      }
    });
  });
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
  encounter.result = {
    playerWon,
    turns: encounter.turn,
    method,
    playerHpPct,
    enemyHpPct,
    playerDamage: encounter.party.reduce((sum, unit) => sum + unit.damageDealt, 0),
    enemyDamage: encounter.enemies.reduce((sum, unit) => sum + unit.damageDealt, 0),
    performance,
    knockedOut,
    itemsUsed: Object.fromEntries(
      Object.keys({ ...encounter.itemsAtStart, ...encounter.items })
        .map((id) => [id, (encounter.itemsAtStart[id] || 0) - (encounter.items[id] || 0)])
        .filter(([, used]) => used !== 0),
    ),
  };
  encounter.log.push({ turn: encounter.turn, tone: playerWon ? 'good' : 'bad', text: playerWon ? `Victory — ${method}.` : `Defeat — ${method}.` });
}

function checkEnd(encounter) {
  if (!living(encounter.enemies).length) return finish(encounter, true, encounter.mode === 'duel' ? 'knockout' : 'all enemies defeated'), true;
  if (!living(encounter.party).length) return finish(encounter, false, encounter.mode === 'duel' ? 'knocked out' : 'party wiped out'), true;
  return false;
}

/**
 * Plays one round. commands: { [partyUnitId]: { action, skillId?, itemId?, targetId? } }.
 * Missing or invalid commands fall back to the auto-battle choice.
 */
export function performCombatRound(encounterInput, commands = {}) {
  const encounter = clone(encounterInput);
  if (!encounter || encounter.status !== 'active') return encounter;
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
    if (order.action === 'defend') {
      const unit = unitById(encounter, id);
      if (unit && !unit.ko) unit.status.guard = 1;
    }
  });
  const order = living(allUnits(encounter))
    .map((unit) => ({ unit, initiative: unit.spd + random(encounter, `init-${unit.id}`) * 8 }))
    .sort((a, b) => b.initiative - a.initiative)
    .map((entry) => entry.unit);

  for (const actor of order) {
    if (actor.ko) continue;
    if (actor.status.stun) {
      log(encounter, actor, `${actor.name} is stunned and cannot act.`);
      continue;
    }
    const command = orders[actor.id] || planFor(encounter, actor);
    if (command.action === 'attack') applyAttack(encounter, actor, command.targetId);
    else if (command.action === 'skill' && SKILLS[command.skillId]) applySkill(encounter, actor, SKILLS[command.skillId], command.targetId);
    else if (command.action === 'item') applyItem(encounter, actor, command.itemId, command.targetId);
    else if (command.action === 'defend') log(encounter, actor, `${actor.name} defends.`);
    if (checkEnd(encounter)) return encounter;
  }

  endOfRound(encounter);
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
  planEnemies(encounter);
  if (encounter.enemyIntent) encounter.log.push({ turn: encounter.turn, tone: 'info', text: `Tell: ${encounter.enemyIntent.telegraph}` });
  return encounter;
}

/** Try to run away. On failure the party loses the round while the enemies act. */
export function attemptFlee(encounterInput) {
  const encounter = clone(encounterInput);
  if (!encounter || encounter.status !== 'active' || !encounter.canFlee) return encounter;
  const avg = (units) => units.reduce((sum, unit) => sum + unit.spd, 0) / Math.max(1, units.length);
  const chance = clamp(0.5 + (avg(living(encounter.party)) - avg(living(encounter.enemies))) / 50, 0.2, 0.9);
  if (random(encounter, 'flee') < chance) {
    finish(encounter, false, 'withdrew');
    return encounter;
  }
  encounter.log.push({ turn: encounter.turn, tone: 'bad', text: 'The party fails to escape!' });
  const wait = Object.fromEntries(living(encounter.party).map((hero) => [hero.id, { action: 'wait' }]));
  return performCombatRound(encounter, wait);
}

/** Auto-battle to the end. */
export function autoResolveEncounter(encounterInput) {
  let encounter = clone(encounterInput);
  let safety = 40;
  while (encounter?.status === 'active' && safety-- > 0) encounter = performCombatRound(encounter, autoCommands(encounter));
  return encounter;
}

export function missionGradeFromCombat(encounter) {
  const result = encounter?.result;
  if (!result) return 'Defeat';
  const performance = result.performance ?? 50;
  if (!result.playerWon) {
    if (result.method === 'withdrew') return 'Defeat';
    if (performance <= 18 || result.playerHpPct <= 10) return 'Catastrophic';
    return 'Defeat';
  }
  if (performance >= 88) return 'Legendary';
  if (performance >= 72) return 'Great Success';
  if (performance >= 45) return 'Success';
  return 'Partial';
}

/** Battle stats a hero would bring into combat (for the status screen). */
export function heroBattleStats(hero) {
  const unit = makeCombatant(hero, 'party');
  return { maxHp: unit.maxHp, maxMp: unit.maxMp, atk: unit.atk, def: unit.def, mag: unit.mag, spd: unit.spd };
}
