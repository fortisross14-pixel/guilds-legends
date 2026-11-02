// @ts-check
// Active combat and mission-game actions, and concluding them.
import { ONBOARDING_STEPS } from '../../data/content.js';
import { autoResolveEncounter, missionGradeFromCombat, performCombatAction } from '../combat.js';
import { autoResolveMissionGame, missionGradeFromMissionGame, performMissionGameAction } from '../missionGames.js';
import { addChronicle, clone, commitRng, completeTutorialTargetInPlace, finalize, rngFor } from './core.js';
import { evaluateStateInPlace } from './goals.js';
import { completeIndividualTournamentInPlace, resolveIndividualRoundInPlace } from './tournaments.js';
import { completeGuildTournamentInPlace, resolveGuildRoundInPlace } from './guildTournaments.js';
import { beginGuildTournamentCombat, beginHeroTournamentCombat } from './tournamentEntry.js';
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

export function performActiveCombatAction(state, actionId, leadHeroId = null) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  if (state.activeEncounter.status !== 'active') return { state, error: 'The combat is over. Conclude the result before issuing another order.' };
  const next = clone(state);
  const normalizedAction = typeof actionId === 'string' ? actionId.toLowerCase() : actionId;
  next.activeEncounter = performCombatAction(next.activeEncounter, normalizedAction, leadHeroId);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
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

// The tactic argument is kept for API compatibility; rounds now resolve through tactical combat.
export function fightHeroTournamentRound(state, tournamentId, _tactic = 'Measured') {
  const begun = beginHeroTournamentCombat(state, tournamentId);
  if (begun.error) return begun;
  const resolved = autoResolveActiveCombat(begun.state);
  if (resolved.error) return resolved;
  return concludeActiveCombat(resolved.state);
}

export function fightGuildTournamentRound(state, tournamentId, _tactic = 'Measured') {
  const begun = beginGuildTournamentCombat(state, tournamentId);
  if (begun.error) return begun;
  const resolved = autoResolveActiveCombat(begun.state);
  if (resolved.error) return resolved;
  return concludeActiveCombat(resolved.state);
}

export function fightTournamentRound(state, tournamentId, tactic = 'Measured') {
  return fightGuildTournamentRound(state, tournamentId, tactic);
}
