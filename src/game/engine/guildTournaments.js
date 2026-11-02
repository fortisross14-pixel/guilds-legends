// @ts-check
// Guild championships, yearly tournament creation and scheduled resolution.
import { FORMATION_TYPES } from '../../data/formations.js';
import { LOCATION_BY_ID, primalCombatModifier } from '../../data/world.js';
import { GUILD_TOURNAMENT_DEFINITIONS } from '../../data/universe.js';
import { MAX_TOURNAMENT_HISTORY, addChronicle, clamp, clone, ensureTournamentCareer, getHero } from './core.js';
import { applyXpInPlace, formationSlotFor, roleRating } from './heroes.js';
import {
  completeIndividualTournamentInPlace,
  createIndividualTournamentsInPlace,
  guildTournamentRating,
  placementPrize,
  seedEntrants,
  tournamentFameDelta,
  updateGuildTitleRecordInPlace,
} from './tournaments.js';

function buildGuildTournamentField(state, tournament) {
  const eligible = state.rivals
    .filter((guild) => guild.tierIndex >= tournament.tierIndex)
    .sort((a, b) => guildTournamentRating(state, b.id) - guildTournamentRating(state, a.id));
  return eligible.slice(0, tournament.size).map((guild) => guild.id);
}

function createGuildTournamentsInPlace(state) {
  state.guildTournaments = GUILD_TOURNAMENT_DEFINITIONS.map((definition) => {
    const location = LOCATION_BY_ID[definition.locationId];
    const tournament = {
      id: `${definition.id}-${state.date.year}`,
      definitionId: definition.id,
      kind: 'guild',
      year: state.date.year,
      name: definition.name,
      circuit: definition.circuit,
      division: definition.circuit,
      locationId: definition.locationId,
      location: location.name,
      region: location.region,
      primal: location.primal,
      month: definition.month,
      size: definition.size,
      entryFee: definition.entryFee,
      purse: definition.purse,
      prestige: definition.prestige,
      trophy: definition.trophy,
      description: definition.description,
      tierIndex: definition.tierIndex,
      status: 'registration',
      assignments: [],
      bracket: [],
      playerBoutWins: 0,
      initialSeed: null,
      expectedFinish: null,
      championGuildId: null,
    };
    tournament.initialEntrants = buildGuildTournamentField(state, tournament);
    tournament.activeEntrants = seedEntrants(state, tournament, tournament.initialEntrants, (id) => guildTournamentRating(state, id));
    tournament.currentRoundSize = tournament.activeEntrants.length;
    return tournament;
  });
}

export function createTournamentsInPlace(state, rng) {
  createIndividualTournamentsInPlace(state, rng);
  createGuildTournamentsInPlace(state);
}

export function tournamentTeamEstimate(state, assignments) {
  const formation = FORMATION_TYPES.Combat;
  const filled = assignments.map((assignment) => ({ ...assignment, slot: formationSlotFor('Combat', assignment) })).filter((assignment) => assignment.slot);
  const ids = new Set(filled.map((assignment) => assignment.heroId));
  const requiredMissing = formation.slots.filter((slot) => slot.required && !filled.some((assignment) => assignment.slot.id === slot.id));
  const breakdown = filled
    .map((assignment) => {
      const hero = getHero(state, assignment.heroId);
      return hero
        ? {
            heroId: hero.id,
            heroName: hero.name,
            classId: hero.classId,
            role: assignment.slot.role,
            slotId: assignment.slot.id,
            rating: roleRating(hero, assignment.slot.role),
          }
        : null;
    })
    .filter(Boolean);
  const power = breakdown.length
    ? Math.round(breakdown.reduce((sum, item) => sum + item.rating, 0) / breakdown.length + Math.max(0, breakdown.length - 2) * 2.5)
    : 0;
  return {
    power,
    breakdown,
    requiredMissing,
    valid: breakdown.length >= 2 && breakdown.length <= 5 && ids.size === breakdown.length && requiredMissing.length === 0,
  };
}

export function resolveGuildRoundInPlace(state, tournament, rng, tactic = 'Measured', forcedPlayerResult = null) {
  const entrants = [...tournament.activeEntrants];
  const pairs = [];
  for (let index = 0; index < entrants.length / 2; index += 1) pairs.push([entrants[index], entrants[entrants.length - 1 - index]]);
  const roundSize = entrants.length;
  const roundName = roundSize === 8 ? 'Quarterfinal' : roundSize === 4 ? 'Semifinal' : 'Final';
  const winners = [];
  let playerLost = false;
  for (const [guildAId, guildBId] of pairs) {
    let winnerId;
    let chance = null;
    let usedTactic = null;
    if ([guildAId, guildBId].includes('player')) {
      const opponentId = guildAId === 'player' ? guildBId : guildAId;
      const opponent = state.rivals.find((guild) => guild.id === opponentId);
      const heroes = tournament.assignments.map((assignment) => getHero(state, assignment.heroId)).filter(Boolean);
      const estimate = tournamentTeamEstimate(state, tournament.assignments);
      const tacticMod = { Measured: 2, Aggressive: 5, Defensive: 0, Showmanship: -2 }[tactic] ?? 2;
      const fatigue = heroes.reduce((sum, hero) => sum + hero.fatigue, 0) / Math.max(1, heroes.length);
      const primalEdge =
        heroes.reduce((sum, hero) => sum + primalCombatModifier(hero.primal, LOCATION_BY_ID[opponent?.homeLocationId]?.primal || tournament.primal) * 5, 0) /
        Math.max(1, heroes.length);
      const playerRating = estimate.power + tacticMod + primalEdge - fatigue * 0.07;
      const opponentRating = guildTournamentRating(state, opponentId);
      chance = clamp(Math.round(100 / (1 + Math.exp(-(playerRating - opponentRating) / 8))), 7, 93);
      winnerId = forcedPlayerResult ? (forcedPlayerResult.playerWon ? 'player' : opponentId) : rng.next() * 100 < chance ? 'player' : opponentId;
      usedTactic = forcedPlayerResult ? 'Turn-based' : tactic;
      heroes.forEach((hero) => {
        const fatigueCost = forcedPlayerResult
          ? clamp(5 + (forcedPlayerResult.turns || 4) * 2, 8, 22)
          : tactic === 'Aggressive'
            ? 17
            : tactic === 'Defensive'
              ? 8
              : 12;
        hero.fatigue = clamp(hero.fatigue + fatigueCost, 0, 100);
        hero.form = clamp(hero.form + (winnerId === 'player' ? 2 : -3), 25, 96);
        hero.career.tournamentBouts += 1;
        if (winnerId === 'player') hero.career.tournamentBoutWins += 1;
        const xpGain = Math.round(
          (winnerId === 'player' ? 70 : 38) + tournament.prestige * 0.32 + (forcedPlayerResult ? Math.min(18, (forcedPlayerResult.turns || 0) * 2) : 0),
        );
        applyXpInPlace(hero, xpGain, state, `${tournament.name} ${roundName.toLowerCase()}`);
        hero.career.xpEarned += xpGain;
      });
      if (winnerId === 'player') tournament.playerBoutWins += 1;
      else playerLost = true;
    } else {
      const ratingA = guildTournamentRating(state, guildAId) + rng.int(-8, 8);
      const ratingB = guildTournamentRating(state, guildBId) + rng.int(-8, 8);
      winnerId = ratingA >= ratingB ? guildAId : guildBId;
    }
    winners.push(winnerId);
    tournament.bracket.push({
      round: roundName,
      guildAId,
      guildAName: guildAId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildAId)?.name,
      guildBId,
      guildBName: guildBId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildBId)?.name,
      winnerId,
      winnerName: winnerId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === winnerId)?.name,
      playerBout: [guildAId, guildBId].includes('player'),
      chance,
      tactic: usedTactic,
      combat:
        forcedPlayerResult && [guildAId, guildBId].includes('player')
          ? {
              turns: forcedPlayerResult.turns,
              method: forcedPlayerResult.method,
              playerHpPct: forcedPlayerResult.playerHpPct,
              enemyHpPct: forcedPlayerResult.enemyHpPct,
            }
          : null,
    });
    state.universeStats.boutsResolved = (state.universeStats.boutsResolved || 0) + 1;
  }
  tournament.activeEntrants = winners;
  tournament.currentRoundSize = winners.length;
  return { roundSize, roundName, playerLost };
}

function finishPlayerGuildTournamentInPlace(state, tournament, actualFinish) {
  tournament.assignments.forEach((assignment) => {
    const hero = getHero(state, assignment.heroId);
    if (!hero) return;
    hero.status = 'available';
    if (actualFinish === 1) {
      hero.career.titles += 1;
      hero.career.guildTitles += 1;
      hero.legacy += Math.round(tournament.prestige * 0.26);
      hero.renown += Math.round(tournament.prestige * 0.13);
    }
  });
  const profileProxy = { renown: state.guild.fame, career: { tournamentFame: state.guild.legacy * 0.1 } };
  const fameDelta = tournamentFameDelta(profileProxy, tournament, tournament.expectedFinish, actualFinish, tournament.playerBoutWins || 0, 0);
  const prize = placementPrize(tournament, actualFinish);
  state.guild.fame = Math.max(0, state.guild.fame + fameDelta);
  state.guild.crowns += prize;
  state.guild.legacy += actualFinish === 1 ? Math.round(tournament.prestige * 0.5) : Math.max(0, Math.round(fameDelta * 0.25));
  state.stats.tournamentBest = Math.min(state.stats.tournamentBest, actualFinish);
  if (actualFinish === 1) {
    state.stats.tournamentsWon += 1;
    state.stats.guildTournamentWins = (state.stats.guildTournamentWins || 0) + 1;
    state.stats.signatureFeats += 1;
  }
  return {
    guildId: 'player',
    guildName: state.guild.name,
    finish: actualFinish,
    expectedFinish: tournament.expectedFinish,
    initialSeed: tournament.initialSeed,
    boutWins: tournament.playerBoutWins || 0,
    fameDelta,
    prize,
  };
}

function recordGuildTournamentInPlace(state, tournament, championGuildId, playerResult = null) {
  updateGuildTitleRecordInPlace(state, tournament, championGuildId);
  if (championGuildId !== 'player') {
    const guild = state.rivals.find((item) => item.id === championGuildId);
    if (guild) {
      guild.titles += 1;
      guild.prizeMoney = (guild.prizeMoney || 0) + tournament.purse;
      guild.fame += Math.round(tournament.prestige * 0.48);
      guild.legacy += Math.round(tournament.prestige * 0.45);
      guild.careerPoints = (guild.careerPoints || 0) + tournament.prestige * 1.3;
      const heroes = [guild.star, ...(guild.members || [])].sort((a, b) => b.power - a.power).slice(0, 5);
      heroes.forEach((hero) => {
        ensureTournamentCareer(hero);
        hero.career.titles += 1;
        hero.career.guildTitles += 1;
        hero.legacy += Math.round(tournament.prestige * 0.14);
      });
    }
  }
  const championName = championGuildId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === championGuildId)?.name || 'Unknown guild';
  const record = {
    id: `guild-record-${tournament.id}`,
    kind: 'guild-tournament',
    tournamentId: tournament.id,
    definitionId: tournament.definitionId,
    title: tournament.name,
    circuit: tournament.circuit,
    location: tournament.location,
    year: tournament.year,
    championGuildId,
    championName,
    prize: tournament.purse,
    prestige: tournament.prestige,
    entrants: tournament.initialEntrants.map((guildId) => ({
      guildId,
      guildName: guildId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildId)?.name,
      rating: Math.round(guildTournamentRating(state, guildId)),
    })),
    bracket: clone(tournament.bracket),
    team: tournament.assignments
      .map((assignment) => {
        const hero = getHero(state, assignment.heroId);
        return hero
          ? { heroId: hero.id, name: hero.name, role: assignment.role, level: hero.level, rarity: hero.rarity, primal: hero.primal, power: hero.power }
          : null;
      })
      .filter(Boolean),
    playerResult,
    narrative: playerResult
      ? `${state.guild.name} finished top ${playerResult.finish}, against an expectation of top ${playerResult.expectedFinish}.`
      : `${championName} won the ${tournament.name}.`,
  };
  state.tournamentHistory.unshift(record);
  state.tournamentHistory = state.tournamentHistory.slice(0, MAX_TOURNAMENT_HISTORY);
  state.universeStats.guildTournamentsResolved = (state.universeStats.guildTournamentsResolved || 0) + 1;
  if (playerResult) state.pendingReports.unshift({ kind: 'tournament', id: record.id });
  addChronicle(state, {
    type: 'tournament',
    importance: championGuildId === 'player' || tournament.circuit === 'Global' ? 5 : 3,
    title: `${championName} wins ${tournament.name}`,
    text: record.narrative,
    guildIds: [championGuildId],
    heroIds: record.team.map((hero) => hero.heroId),
    tags: ['tournament', 'guild', tournament.circuit],
    tournamentRecordId: record.id,
  });
  return record;
}

export function completeGuildTournamentInPlace(state, tournament, rng, playerFinish = null) {
  while (tournament.activeEntrants.length > 1) resolveGuildRoundInPlace(state, tournament, rng, 'Measured');
  const championGuildId = tournament.activeEntrants[0];
  tournament.status = 'completed';
  tournament.championGuildId = championGuildId;
  const playerResult = tournament.assignments.length
    ? finishPlayerGuildTournamentInPlace(state, tournament, playerFinish || (championGuildId === 'player' ? 1 : tournament.size))
    : null;
  return recordGuildTournamentInPlace(state, tournament, championGuildId, playerResult);
}

export function simulateScheduledCompetitionsInPlace(state, rng) {
  const all = [...(state.tournaments || []), ...(state.guildTournaments || [])];
  all.forEach((tournament) => {
    if (tournament.status !== 'registration') return;
    const hasPassed = state.date.year > tournament.year || (state.date.year === tournament.year && state.date.month > tournament.month);
    if (!hasPassed) return;
    if (tournament.kind === 'individual') completeIndividualTournamentInPlace(state, tournament, rng, null);
    else completeGuildTournamentInPlace(state, tournament, rng, null);
  });
}
