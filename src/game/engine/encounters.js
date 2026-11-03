// @ts-check
// Active combat and mission-game actions, and concluding them.
import { ONBOARDING_STEPS } from '../../data/content.js';
import { attemptFlee, autoResolveEncounter, missionGradeFromCombat, performCombatRound } from '../combat.js';
import { autoResolveMissionGame, missionGradeFromMissionGame, performMissionGameAction } from '../missionGames.js';
import { addChronicle, clone, commitRng, completeTutorialTargetInPlace, finalize, getHero, pushMoment, rngFor } from './core.js';
import { applyXpInPlace } from './heroes.js';
import { addItemsInPlace, lootNames, rollLoot, settleBattleItemsInPlace } from './inventory.js';
import { evaluateStateInPlace } from './goals.js';
import { completeIndividualTournamentInPlace, resolveIndividualRoundInPlace } from './tournaments.js';
import { completeGuildTournamentInPlace, resolveGuildRoundInPlace } from './guildTournaments.js';
import { missionDecision } from './missions.js';

function concludeMissionGameInPlace(state) {
  const game = state.activeMissionGame;
  if (!game || game.status === 'active' || !game.result) return false;
  const mission = state.activeMissions.find((item) => item.id === game.sourceId);
  if (!mission) {
    state.activeMissionGame = null;
    return false;
  }
  mission.missionGameResolved = true;
  const grade = missionGradeFromMissionGame(game);
  const decision = missionDecision(mission);
  decision.forcedGrade = grade;
  decision.missionGameResolved = true;
  decision.missionGameSummary = {
    type: game.type,
    grade,
    status: game.status,
    turns: game.result.turns,
    performance: game.result.performance,
    rewardModifier: game.result.rewardModifier,
    metrics: clone(game.result.metrics),
    log: clone(game.result.log || []),
  };
  const outcomeText =
    game.status === 'won'
      ? 'The company controls the decisive phase.'
      : game.status === 'partial'
        ? 'The company secures only part of what it came for.'
        : 'The decisive phase goes against the company.';
  decision.prompt = `${outcomeText} ${decision.prompt}`;
  state.pendingDecisions.push(decision);
  state.activeMissionGame = null;
  addChronicle(state, {
    type: game.status === 'won' ? 'mission-game-victory' : game.status === 'partial' ? 'mission-game-mixed' : 'mission-game-defeat',
    importance: mission.risk >= 4 ? 4 : 2,
    title: `${grade}: ${mission.title}`,
    text: `${game.type} play determined the mission after ${game.result.turns} turns. The company now faces the aftermath decision.`,
    heroIds: mission.assignments.map((assignment) => assignment.heroId),
    tags: [game.type, mission.family, grade],
  });
  return true;
}

export function performActiveMissionGameAction(state, actionId, leadHeroId = null) {
  if (!state.activeMissionGame) return { state, error: 'There is no active mission challenge.' };
  if (state.activeMissionGame.status !== 'active') return { state, error: 'This mission challenge is already resolved.' };
  const next = clone(state);
  const result = performMissionGameAction(next.activeMissionGame, actionId, leadHeroId);
  if (result.error) return { state, error: result.error };
  next.activeMissionGame = result.game;
  concludeMissionGameInPlace(next);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function autoResolveActiveMissionGame(state, mutate = false) {
  if (!state.activeMissionGame) return { state, error: 'There is no active mission challenge.' };
  const next = mutate ? state : clone(state);
  next.activeMissionGame = autoResolveMissionGame(next.activeMissionGame);
  concludeMissionGameInPlace(next);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

/** Plays one battle round. commands: { [partyUnitId]: { action, skillId?, itemId?, targetId? } }. */
export function performActiveCombatAction(state, commands = {}) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  if (state.activeEncounter.status !== 'active') return { state, error: 'The combat is over. Conclude the result before issuing another order.' };
  const next = clone(state);
  next.activeEncounter = performCombatRound(next.activeEncounter, commands && typeof commands === 'object' ? commands : {});
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function fleeActiveCombat(state) {
  if (!state.activeEncounter || state.activeEncounter.status !== 'active') return { state, error: 'There is no battle to flee.' };
  if (!state.activeEncounter.canFlee) return { state, error: 'There is no running from this fight.' };
  const next = clone(state);
  next.activeEncounter = attemptFlee(next.activeEncounter);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

function concludeRoadCombatInPlace(next, encounter, combatResult) {
  const fighters = encounter.party.map((unit) => getHero(next, unit.heroId)).filter(Boolean);
  const tier = next.guild.tierIndex + 1;
  const rng = rngFor(next, `road-combat:${encounter.id}`);
  if (combatResult.playerWon) {
    const gold = (30 + rng.int(0, 60)) * tier;
    next.guild.crowns += gold;
    const xp = fighters.map((hero) => {
      applyXpInPlace(hero, 25 * tier, next, 'a road ambush');
      return { heroId: hero.id, name: hero.name, xp: 25 * tier };
    });
    const loot = rollLoot(rng, next.guild.tierIndex, 0);
    addItemsInPlace(next, loot);
    pushMoment(next, { type: 'victory', title: 'Ambush repelled', grade: 'Victory', gold, xp, loot: lootNames(loot) });
    addChronicle(next, {
      type: 'travel',
      importance: 1,
      title: 'Bandits driven off',
      text: `The travellers win the skirmish and take ${gold} gold.`,
      tags: ['travel', 'road-event', 'combat'],
    });
  } else {
    const lost = Math.min(Math.max(0, next.guild.crowns), rng.int(40, 100) * tier);
    next.guild.crowns -= lost;
    fighters
      .filter((hero) => (combatResult.knockedOut || []).includes(hero.id))
      .forEach((hero) => {
        hero.status = 'injured';
        hero.injury = 'Road wound';
        hero.injuryWeeks = rng.int(2, 4);
        hero.monthlyActivity = 'Infirmary';
      });
    addChronicle(next, {
      type: 'travel',
      importance: 1,
      title: 'Robbed on the road',
      text: `The bandits win and take ${lost} gold.`,
      tags: ['travel', 'road-event', 'combat'],
    });
    next.notifications.push({ id: `road-loss-${encounter.id}`, tone: 'red', title: 'Robbed on the road', text: `The bandits take ${lost} gold.` });
  }
  commitRng(next, rng);
}

export function autoResolveActiveCombat(state, mutate = false) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  const next = mutate ? state : clone(state);
  next.activeEncounter = autoResolveEncounter(next.activeEncounter);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function concludeActiveCombat(state, mutate = false) {
  if (!state.activeEncounter) return { state, error: 'There is no combat to conclude.' };
  if (state.activeEncounter.status === 'active' || !state.activeEncounter.result) return { state, error: 'The combat has not finished yet.' };
  const next = mutate ? state : clone(state);
  const encounter = next.activeEncounter;
  const combatResult = clone(encounter.result);
  let report = null;
  let round = null;
  settleBattleItemsInPlace(next, combatResult.itemsUsed);

  if (encounter.sourceType === 'road') {
    concludeRoadCombatInPlace(next, encounter, combatResult);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'road-combat', combat: combatResult } };
  }

  if (encounter.sourceType === 'mission') {
    const mission = next.activeMissions.find((item) => item.id === encounter.sourceId);
    if (!mission) return { state, error: 'The mission behind this combat can no longer be found.' };
    mission.combatResolved = true;
    const grade = missionGradeFromCombat(encounter);
    const decision = missionDecision(mission);
    decision.forcedGrade = grade;
    decision.combatResolved = true;
    decision.combatSummary = {
      grade,
      playerWon: combatResult.playerWon,
      turns: combatResult.turns,
      method: combatResult.method,
      playerHpPct: combatResult.playerHpPct,
      enemyHpPct: combatResult.enemyHpPct,
      playerDamage: combatResult.playerDamage,
      enemyDamage: combatResult.enemyDamage,
      knockedOut: combatResult.knockedOut || [],
      log: encounter.log.slice(-12),
    };
    decision.prompt = `${combatResult.playerWon ? 'The hostile force breaks.' : 'The company is forced back.'} ${decision.prompt}`;
    next.pendingDecisions.push(decision);
    next.activeEncounter = null;
    if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'completeCombat') completeTutorialTargetInPlace(next, 'completeCombat');
    addChronicle(next, {
      type: combatResult.playerWon ? 'combat-victory' : 'combat-defeat',
      importance: mission.risk >= 4 ? 4 : 2,
      title: `${combatResult.playerWon ? 'Victory' : 'Defeat'} in ${mission.title}`,
      text: `${mission.title} was decided after ${combatResult.turns} tactical turns. The expedition now faces its aftermath decision.`,
      heroIds: mission.assignments.map((assignment) => assignment.heroId),
      tags: ['combat', mission.family, grade],
    });
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'mission-combat', grade, combat: combatResult } };
  }

  if (encounter.sourceType === 'hero-tournament') {
    const tournament = next.tournaments.find((item) => item.id === encounter.sourceId);
    if (!tournament || tournament.status !== 'active') return { state, error: 'The tournament round can no longer be found.' };
    const rng = rngFor(next, `hero-tournament-combat:${tournament.id}:${tournament.currentRoundSize}`);
    round = resolveIndividualRoundInPlace(next, tournament, rng, 'Measured', combatResult);
    if (combatResult.playerWon)
      pushMoment(next, { type: 'victory', title: `${tournament.name}: bout won`, grade: combatResult.method, gold: 0, xp: [], loot: [] });
    if (round.playerLost) report = completeIndividualTournamentInPlace(next, tournament, rng, round.roundSize);
    else if (tournament.activeEntrants.length === 1) report = completeIndividualTournamentInPlace(next, tournament, rng, 1);
    commitRng(next, rng);
  } else if (encounter.sourceType === 'guild-tournament') {
    const tournament = next.guildTournaments.find((item) => item.id === encounter.sourceId);
    if (!tournament || tournament.status !== 'active') return { state, error: 'The guild championship round can no longer be found.' };
    const rng = rngFor(next, `guild-tournament-combat:${tournament.id}:${tournament.currentRoundSize}`);
    round = resolveGuildRoundInPlace(next, tournament, rng, 'Measured', combatResult);
    if (round.playerLost) report = completeGuildTournamentInPlace(next, tournament, rng, round.roundSize);
    else if (tournament.activeEntrants.length === 1) report = completeGuildTournamentInPlace(next, tournament, rng, 1);
    commitRng(next, rng);
  } else {
    return { state, error: 'Unknown combat source.' };
  }

  next.activeEncounter = null;
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: round, report };
}
