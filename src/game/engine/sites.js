// @ts-check
// Doing a contract in the world (missions-in-world spec): fights with the groups
// standing on its site, talking to people there (choices that test a hero's stat,
// shown as "Presence 52: likely"), inspecting clues and locks, collecting, and
// escorting someone to safety. Steps update as they are done; when the required
// ones are, the contract is ready to report (story contracts report at once).
// Losing a site fight follows the defeat rule (hall.js); the contract stays open.
import { createPartyEncounter } from '../combat.js';
import { BOSSES, ENEMY_TYPES } from '../../data/enemies.js';
import { WILD_AREAS } from '../../data/wilds/index.js';
import { normalizeClassId } from '../../data/content.js';
import { CONTRACT_BASE, CONTRACT_BASE_BY_TIER, siteFor } from '../../data/missions/index.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { VERDICTS_BY_FAMILY } from '../../data/dialogue/verdicts.js';
import { missionFamily } from './reputation.js';
import { campaignDaySerial, clamp, clone, commitRng, earnGoldInPlace, finalize, getHero, hashString, pushMoment, rngFor, travellingPartyIds } from './core.js';
import { applyXpInPlace, battleXp, enemyStrength, xpForNextLevel } from './heroes.js';
import { addItemsInPlace, battleItems, lootList, rollDrops, rollLoot } from './inventory.js';
import { defeatInPlace } from './hall.js';
import { objectiveOpen } from './missions.js';
import { reportContractInPlace } from './outcomes.js';
import { charterEffect } from './charter.js';

const STATS = ['Might', 'Finesse', 'Mind', 'Spirit', 'Endurance', 'Presence'];

/** The heroes with the founder on the job: the main party if fit, else the strongest available. */
export function siteFighters(state) {
  const fit = (hero) => hero && hero.status === 'available';
  const main = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter(fit);
  if (main.length) return main.slice(0, 4);
  return state.heroes.filter(fit).sort((a, b) => b.power - a.power).slice(0, 4);
}

/** The party's best value of a stat, and who has it. */
function bestStat(state, stat) {
  const party = travellingPartyIds(state).map((id) => getHero(state, id)).filter(Boolean);
  const pool = party.length ? party : siteFighters(state);
  return pool.reduce((best, hero) => ((hero.attributes?.[stat] || 0) > best.value ? { value: Math.round(hero.attributes[stat]), hero } : best), { value: 0, hero: null });
}

/** A test's chance from the party's best stat against its difficulty. */
function checkChance(value, dc) {
  return clamp(0.5 + (value - dc) / 30, 0.1, 0.95);
}

/** What a test reads like before you try it: "Presence 52: likely". */
export function checkLabel(state, check) {
  if (!check || !STATS.includes(check.stat)) return null;
  const { value, hero } = bestStat(state, check.stat);
  const chance = checkChance(value, check.dc);
  return { stat: check.stat, value, hero: hero?.name || null, chance, label: `${check.stat} ${value}: ${chance >= 0.7 ? 'likely' : chance >= 0.4 ? 'even odds' : 'unlikely'}` };
}

/** Whether the party meets a gate ({ classId } or { stat, min }). */
function meets(state, needs) {
  if (!needs) return true;
  const party = travellingPartyIds(state).map((id) => getHero(state, id)).filter(Boolean);
  if (needs.classId) return party.some((hero) => normalizeClassId(hero.classId) === needs.classId);
  if (needs.stat) return bestStat(state, needs.stat).value >= (needs.min || 0);
  return true;
}

function find(state, missionId, objectiveId) {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission?.site) return { mission: null, objective: null };
  return { mission, objective: siteFor(mission).objectives.find((item) => item.id === objectiveId) || null };
}

/**
 * What tapping an objective shows before acting: its name, line and choices
 * (each with its test as "Presence 52: likely", or what it costs).
 */
export function siteObjectiveView(state, missionId, objectiveId) {
  const { mission, objective } = find(state, missionId, objectiveId);
  if (!mission || !objective) return null;
  const escorting = mission.site.escort === objective.id;
  const base = { missionId, objectiveId, kind: objective.kind, name: objective.name, role: objective.role || null, title: mission.title };
  if (objective.kind === 'talk') {
    return {
      ...base,
      line: objective.line,
      choices: objective.choices.map((choice, index) => ({
        index,
        text: choice.text,
        test: checkLabel(state, choice.check),
        cost: choice.cost || 0,
        fight: Boolean(choice.fight),
        gone: Boolean(mission.site.failed[`${objective.id}:${index}`]),
      })),
    };
  }
  if (objective.kind === 'escort') return { ...base, line: escorting ? `${objective.name} is with you. Bring them to safety.` : objective.line, escorting };
  if (objective.kind === 'inspect') return { ...base, ready: meets(state, objective.needs), test: checkLabel(state, objective.check), line: meets(state, objective.needs) ? null : objective.alt || 'You can’t get at it yet.' };
  if (objective.kind === 'collect') return { ...base, progress: mission.site.progress[objective.id] || 0, count: objective.count };
  return base;
}

/** Marks an objective done; when the required ones are, the contract is ready (a story one reports at once). */
function completeInPlace(state, mission, objectiveId) {
  mission.site.done[objectiveId] = true;
  if (mission.site.escort === objectiveId) mission.site.escort = null;
  const required = siteFor(mission).objectives.filter((objective) => !objective.optional);
  if (required.every((objective) => mission.site.done[objective.id]) && mission.site.status === 'active') {
    mission.site.status = 'ready';
    if (mission.story) reportContractInPlace(state, mission);
    else {
      // The end-of-job choice for this contract's family (src/data/dialogue/verdicts.js), never the same one twice running.
      const list = VERDICTS_BY_FAMILY[missionFamily(mission)] || [];
      const seen = (state.story.verdictsSeen ||= []);
      const fresh = list.filter((id) => !seen.slice(-Math.max(1, list.length - 1)).includes(id));
      const pool = fresh.length ? fresh : list;
      if (pool.length) {
        mission.site.verdict = pool[hashString(mission.id) % pool.length];
        seen.push(mission.site.verdict);
        state.story.verdictsSeen = seen.slice(-12);
      }
    }
    if (!mission.story) state.notifications.push({ id: `contract-ready-${mission.id}`, tone: 'green', title: mission.title, text: `Done. Report to ${mission.giverName || 'the Notice Board'}.` });
  }
}

/**
 * Acts on an objective: inspect, collect, talk (with a choice), start or finish an
 * escort, or start its fight. Returns { state, error, result: { ok, text } }.
 */
export function siteAct(state, missionId, objectiveId, { choice = null, arrive = false, position = null } = {}) {
  const { mission, objective } = find(state, missionId, objectiveId);
  if (!mission || !objective) return { state, error: 'That is no longer here.' };
  if (!objectiveOpen(mission, objective)) return { state, error: 'Not yet.' };
  if (objective.kind === 'fight') return startSiteFight(state, missionId, objectiveId, position);
  const next = clone(state);
  const live = next.missions.find((item) => item.id === missionId);
  const rng = rngFor(next, `site-${missionId}-${objectiveId}-${campaignDaySerial(next)}-${choice ?? ''}`);
  let result = { ok: true, text: '' };

  if (objective.kind === 'inspect') {
    if (!meets(next, objective.needs)) return { state, error: objective.alt || 'You can’t get at it yet.' };
    let text = objective.text;
    if (objective.check) {
      const test = checkLabel(next, objective.check);
      if (!rng.chance(test.chance)) {
        live.site.alarm = true;
        text = `${objective.alarm || 'Someone saw you.'} ${objective.text}`;
        result.ok = false;
      }
    }
    completeInPlace(next, live, objective.id);
    result.text = text;
  } else if (objective.kind === 'collect') {
    const progress = (live.site.progress[objective.id] || 0) + 1;
    live.site.progress[objective.id] = progress;
    result.text = `${objective.name}: ${Math.min(progress, objective.count)}/${objective.count}.`;
    if (progress >= objective.count) {
      if (objective.loot) {
        const loot = rollLoot(rng, next.guild.tierIndex, 0);
        const gold = rng.int(10, 30);
        addItemsInPlace(next, loot);
        earnGoldInPlace(next, gold);
        result.text = `Inside: ${[`${gold} gold`, ...lootList(loot).map((item) => item.name)].join(', ')}.`;
      }
      completeInPlace(next, live, objective.id);
    }
  } else if (objective.kind === 'escort') {
    if (arrive && live.site.escort === objective.id) {
      completeInPlace(next, live, objective.id);
      result.text = `${objective.name} is safe.`;
    } else if (!live.site.escort) {
      live.site.escort = objective.id;
      result.text = objective.line;
    } else return { state, error: 'One escort at a time.' };
  } else if (objective.kind === 'talk') {
    const index = Number(choice);
    const option = objective.choices[index];
    if (!option || live.site.failed[`${objective.id}:${index}`]) return { state, error: 'Choose what to say.' };
    if (option.fight) {
      commitRng(next, rng);
      return startSiteFight(finalize(next), missionId, objectiveId, position, { name: objective.name, enemies: objective.fightWith || ['shield-thug', 'road-bandit'], count: 2, level: 2, power: 40 });
    }
    if (option.cost) {
      if (next.guild.crowns < option.cost) return { state, error: `That costs ${option.cost} gold.` };
      next.guild.crowns -= option.cost;
    }
    let ok = true;
    if (option.check) ok = rng.chance(checkLabel(next, option.check).chance);
    if (ok) {
      if (option.rough) live.site.rough += 1;
      completeInPlace(next, live, objective.id);
      result.text = option.success;
    } else {
      live.site.failed[`${objective.id}:${index}`] = true;
      result = { ok: false, text: option.fail || 'It doesn’t work.' };
    }
  }
  commitRng(next, rng);
  return { state: finalize(next), error: null, result };
}

/** Starts the fight with a site's group (or the one a talk turned into). */
export function startSiteFight(state, missionId, objectiveId, position = null, override = null) {
  const { mission, objective } = find(state, missionId, objectiveId);
  if (!mission || !objective) return { state, error: 'Nobody to fight here.' };
  if (state.activeEncounter) return { state, error: 'A battle is already under way.' };
  if (!siteFighters(state).length) return { state, error: 'Nobody in the guild is fit to fight. Rest first.' };
  const next = clone(state);
  siteEncounterInPlace(next, next.missions.find((item) => item.id === missionId), override || objective, objectiveId, 1);
  if (position && Number.isFinite(position.x) && mission.site.place.kind === 'wild') {
    next.world.exploration ||= {};
    next.world.exploration.positions ||= {};
    next.world.exploration.positions[mission.site.place.id] = { x: Math.round(position.x), y: Math.round(position.y) };
  }
  return { state: finalize(next), error: null };
}

/** Builds the battle for a site fight. A raised alarm makes it harder. `attempt` reseeds a retry. */
function siteEncounterInPlace(next, mission, fight, objectiveId, attempt) {
  const fighters = siteFighters(next);
  const area = mission.site.place.kind === 'wild' ? WILD_AREAS[mission.site.place.id] : null;
  const boss = fight.bossId ? BOSSES[fight.bossId] || Object.values(BOSSES).find((item) => item.id === fight.bossId) || null : null;
  const types = (fight.enemies || []).map((id) => ENEMY_TYPES[id]).filter(Boolean);
  const alarm = mission.site.alarm ? 1.2 : 1;
  // The fight's level where the contract is (src/data/missions/index.js CONTRACT_BASE), unless fixed.
  const base = CONTRACT_BASE[mission.locationId] ?? CONTRACT_BASE_BY_TIER[LOCATION_BY_ID[mission.locationId]?.tier] ?? 3;
  const level = fight.fixed ? fight.level || 2 : Math.max(1, base + (fight.level || 2) - 2);
  const power = fight.fixed ? fight.power || 40 : Math.min(98, Math.round(38 + 2.25 * level));
  // The story's first contract fight (mission 3) is a gentle one, and always winnable.
  const scripted = mission.story === 'm3.contract';
  next.activeEncounter = createPartyEncounter({
    id: `site-${mission.id}-${objectiveId}-${attempt}`,
    seed: (next.rngState ^ hashString(`site:${mission.id}:${objectiveId}:${attempt}`)) >>> 0,
    sourceType: 'site',
    sourceId: mission.id,
    title: boss ? boss.name : fight.name,
    roundName: mission.title,
    objective: fight.boss ? 'Bring down their leader.' : 'Win the fight.',
    playerHeroes: fighters.map((hero) => ({ hero, role: 'Fighter' })),
    opponentName: fight.name,
    opponentPrimal: area?.primal || 'Iron',
    opponentLevel: level,
    opponentPower: Math.round(power * alarm),
    enemyCount: clamp(fight.count || 3, 1, 5),
    enemyTypes: types.length ? types : null,
    boss,
    // As contract fights always were: low-risk contracts field weaker enemies (a raised alarm makes them harder).
    strength: scripted ? 0.6 : (0.65 + (mission.risk || 1) * 0.09) * alarm,
    guaranteed: scripted,
    risk: fight.boss ? 4 : 2,
    canFlee: true,
    items: battleItems(next),
  });
  next.activeEncounter.sourceMeta = { missionId: mission.id, objectiveId, fight: clone(fight) };
  if (area) next.activeEncounter.background = area.battle;
  next.activeEncounter.attempt = attempt;
}

/** After a lost site fight: fight the same group again from the start. */
export function retrySiteBattle(state) {
  const encounter = state.activeEncounter;
  if (encounter?.sourceType !== 'site' || encounter.status !== 'lost' || encounter.result?.method === 'withdrew') return { state, error: 'There is no lost battle to retry.' };
  const next = clone(state);
  const mission = next.missions.find((item) => item.id === encounter.sourceMeta.missionId);
  if (!mission) return { state, error: 'That contract is gone.' };
  siteEncounterInPlace(next, mission, encounter.sourceMeta.fight, encounter.sourceMeta.objectiveId, (encounter.attempt || 1) + 1);
  return { state: finalize(next), error: null };
}

/** A site fight is over (encounters.js): a win marks the objective done, a loss is a defeat. */
export function siteFightConcludedInPlace(next, encounter, combatResult) {
  const { missionId, objectiveId } = encounter.sourceMeta || {};
  const mission = next.missions.find((item) => item.id === missionId);
  const fighters = encounter.party.map((unit) => getHero(next, unit.heroId)).filter(Boolean);
  if (!combatResult.playerWon) {
    defeatInPlace(next, fighters.map((hero) => hero.id), mission?.locationId);
    return;
  }
  if (!mission?.site) return;
  mission.site.kos += (combatResult.knockedOut || []).length;
  const strength = enemyStrength((encounter.enemies || []).map((unit) => unit.level), fighters.length);
  const xp = fighters.map((hero) => {
    const xpAmount = battleXp(hero, strength);
    const fill = () => (xpForNextLevel(hero.level) ? (hero.xp || 0) / xpForNextLevel(hero.level) : 1);
    const levelBefore = hero.level;
    const from = fill();
    applyXpInPlace(hero, Math.round(xpAmount * charterEffect(next, 'combatXp')), next, mission.title);
    return { heroId: hero.id, name: hero.name, xp: xpAmount, levelBefore, levelAfter: hero.level, from, to: fill() };
  });
  const dropRng = rngFor(next, `site-drops:${encounter.id}`);
  const drops = rollDrops(dropRng, encounter.enemies);
  commitRng(next, dropRng);
  addItemsInPlace(next, drops);
  pushMoment(next, { type: 'victory', title: encounter.title, gold: 0, xp, loot: lootList(drops) });
  completeInPlace(next, mission, objectiveId);
}
