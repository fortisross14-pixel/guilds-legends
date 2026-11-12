// @ts-check
// Tournaments (tournaments-circuits spec): every year all fifteen events of the
// three circuits are created, each a guild event with a field of guilds of its
// circuit; rounds (team bouts for the player, ratings for the rest), champions,
// title records, and the special titles collections of wins unlock.
import { LOCATION_BY_ID, primalCombatModifier } from '../../data/world.js';
import { SPECIAL_TITLE_BY_ID, TOURNAMENTS } from '../../data/tournaments.js';
import { MAX_TOURNAMENT_HISTORY, addChronicle, clamp, clone, ensureTournamentCareer, getHero, campaignWeekSerial, dateWeekSerial, pushMoment } from './core.js';
import { applyXpInPlace, battleXp, roleRating } from './heroes.js';
import {
  guildTournamentRating,
  placementPrize,
  seedEntrants,
  tournamentFameDelta,
  updateGuildTitleRecordInPlace,
} from './tournaments.js';
import { pushRankingsMomentInPlace, recordOfficialResultsInPlace } from './rankings.js';
import { awardTrophyInPlace } from './hall.js';
import { afterTournamentInPlace } from './seasons.js';

/**
 * The field: rival guilds of the circuit's status (a guild enters its own tier or
 * lower; the strongest of its tier are invited), topped up from the tier below
 * when there are too few.
 */
function buildTournamentField(state, tournament) {
  const byRating = (a, b) => guildTournamentRating(state, b.id) - guildTournamentRating(state, a.id);
  const own = state.rivals.filter((guild) => guild.tierIndex === tournament.tierIndex).sort(byRating);
  const below = state.rivals.filter((guild) => guild.tierIndex < tournament.tierIndex).sort(byRating);
  const above = state.rivals.filter((guild) => guild.tierIndex > tournament.tierIndex).sort(byRating);
  return [...own, ...below, ...above].slice(0, tournament.size).map((guild) => guild.id);
}

/** This year's fifteen tournaments, all guild events (the World Conclave too: it is yearly now). */
export function createTournamentsInPlace(state) {
  state.tournaments = TOURNAMENTS.map((definition) => {
    const location = LOCATION_BY_ID[definition.locationId];
    const tournament = {
      id: `${definition.id}-${state.date.year}`,
      definitionId: definition.id,
      kind: 'guild',
      year: state.date.year,
      name: definition.name,
      circuit: definition.circuit,
      locationId: definition.locationId,
      location: location?.name || definition.locationId,
      region: location?.region || '',
      primal: location?.primal || 'Iron',
      month: definition.month,
      week: definition.week,
      size: definition.size,
      teamSize: definition.teamSize,
      entryFee: definition.entryFee,
      purse: definition.purse,
      prestige: definition.prestige,
      trophy: definition.trophy,
      description: definition.description,
      tierIndex: definition.tierIndex,
      status: 'registration',
      signup: null,
      assignments: [],
      bracket: [],
      playerBoutWins: 0,
      initialSeed: null,
      expectedFinish: null,
      championGuildId: null,
    };
    tournament.initialEntrants = buildTournamentField(state, tournament);
    tournament.activeEntrants = seedEntrants(state, tournament, tournament.initialEntrants, (id) => guildTournamentRating(state, id));
    tournament.currentRoundSize = tournament.activeEntrants.length;
    return tournament;
  });
}

/** A team's strength for seeding: the heroes' average role rating, a little more for each extra hero. */
export function tournamentTeamEstimate(state, assignments) {
  const heroes = assignments.map((assignment) => getHero(state, assignment.heroId)).filter(Boolean);
  const breakdown = heroes.map((hero, index) => ({ heroId: hero.id, heroName: hero.name, classId: hero.classId, role: assignments[index]?.role || 'Fighter', rating: roleRating(hero, assignments[index]?.role || 'Fighter') }));
  const power = breakdown.length ? Math.round(breakdown.reduce((sum, item) => sum + item.rating, 0) / breakdown.length + Math.max(0, breakdown.length - 1) * 2.5) : 0;
  return { power, breakdown, valid: breakdown.length >= 1 };
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
        // A tournament bout counts as a fight a level under the hero's, worth the most of any kind (heroes.js battleXp); half for a loss.
        const xpGain = Math.round(battleXp(hero, hero.level - 1, 'tournament') * (winnerId === 'player' ? 1 : 0.5));
        applyXpInPlace(hero, xpGain, state, `${tournament.name} ${roundName.toLowerCase()}`);
        hero.career.xpEarned += xpGain;
      });
      if (winnerId === 'player') {
        tournament.playerBoutWins += 1;
        // Giant Killer: beating a guild two status tiers above yours.
        if ((opponent?.tierIndex || 0) >= state.guild.tierIndex + 2) grantTitleInPlace(state, 'player', 'giant-killer');
      } else playerLost = true;
    } else {
      const ratingA = guildTournamentRating(state, guildAId) + rng.int(-8, 8);
      const ratingB = guildTournamentRating(state, guildBId) + rng.int(-8, 8);
      winnerId = ratingA >= ratingB ? guildAId : guildBId;
      const winner = state.rivals.find((guild) => guild.id === winnerId);
      const loser = state.rivals.find((guild) => guild.id === (winnerId === guildAId ? guildBId : guildAId));
      if (winner && loser && loser.tierIndex >= winner.tierIndex + 2) grantTitleInPlace(state, winnerId, 'giant-killer');
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
  // A win's fame comes from showing the trophy in the Crown Room (hall.js), not at once.
  const fameDelta = actualFinish === 1 ? 0 : tournamentFameDelta(profileProxy, tournament, tournament.expectedFinish, actualFinish, tournament.playerBoutWins || 0, 0);
  const prize = placementPrize(tournament, actualFinish);
  state.guild.fame = Math.max(0, state.guild.fame + fameDelta);
  state.guild.crowns += prize;
  state.guild.legacy += actualFinish === 1 ? Math.round(tournament.prestige * 0.5) : Math.max(0, Math.round(fameDelta * 0.25));
  state.stats.tournamentBest = Math.min(state.stats.tournamentBest, actualFinish);
  if (actualFinish === 1) {
    awardTrophyInPlace(state, tournament.definitionId || tournament.id, tournament.trophy || tournament.name);
    state.stats.tournamentsWon += 1;
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
  noteWinInPlace(state, championGuildId, tournament);
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
    kind: 'tournament',
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
  state.universeStats.tournamentsResolved = (state.universeStats.tournamentsResolved || 0) + 1;
  recordOfficialResultsInPlace(state, tournament, 'guild');
  if (playerResult) {
    afterTournamentInPlace(state, { heroIds: record.team.map((member) => member.heroId), finish: playerResult.finish });
    state.pendingReports.unshift({ kind: 'tournament', id: record.id });
    pushRankingsMomentInPlace(state, `Rankings after the ${tournament.name}`);
  }
  addChronicle(state, {
    type: 'tournament',
    importance: championGuildId === 'player' || tournament.circuit === 'Elite' ? 5 : 3,
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

/** Tournaments whose two-week sign-up passed without the player resolve on their own. */
export function simulateScheduledCompetitionsInPlace(state, rng) {
  (state.tournaments || []).forEach((tournament) => {
    if (tournament.status !== 'registration') return;
    const hasPassed = campaignWeekSerial(state) >= dateWeekSerial({ year: tournament.year, month: tournament.month, week: tournament.week || 0 }) + 2;
    if (hasPassed) completeGuildTournamentInPlace(state, tournament, rng, null);
  });
}

// ---------------------------------------------------------------- special titles

/** A guild's wins by tournament, by year: state.tournamentWins[guildId][definitionId] = [years]. */
function noteWinInPlace(state, guildId, tournament) {
  state.tournamentWins ||= {};
  const wins = (state.tournamentWins[guildId] ||= {});
  (wins[tournament.definitionId] ||= []).push(tournament.year);
  checkCollectionTitlesInPlace(state, guildId, tournament.year);
}

/** Grants a special title once (the player's go in guild.specialTitles, a rival's on the rival). */
export function grantTitleInPlace(state, guildId, titleId) {
  const title = SPECIAL_TITLE_BY_ID[titleId];
  if (!title) return;
  const holder = guildId === 'player' ? state.guild : state.rivals.find((guild) => guild.id === guildId);
  if (!holder) return;
  holder.specialTitles ||= [];
  if (holder.specialTitles.some((item) => item.id === titleId)) return;
  holder.specialTitles.push({ id: titleId, name: title.name, year: state.date.year });
  const name = guildId === 'player' ? state.guild.name : holder.name;
  addChronicle(state, { type: 'title', importance: 4, title: `${name}: ${title.name}`, text: `${title.how}.`, guildIds: [guildId], tags: ['tournament', 'title'] });
  if (guildId === 'player') pushMoment(state, { type: 'statusTitle', title: 'A special title', statusTitle: title.name, text: title.how });
}

/** The collection titles: Triple Crowned, Master of the World, the Grand Tour, the Slam, a Season Sweep, a Dynasty. */
function checkCollectionTitlesInPlace(state, guildId, year) {
  const wins = state.tournamentWins?.[guildId] || {};
  const won = (definition) => (wins[definition.id] || []).length > 0;
  const of = (circuit) => TOURNAMENTS.filter((definition) => definition.circuit === circuit);
  if (of('Elite').every(won)) grantTitleInPlace(state, guildId, 'triple-crowned');
  if (of('Initiation').every(won)) grantTitleInPlace(state, guildId, 'initiation-grand-tour');
  if (of('Champion').every(won)) grantTitleInPlace(state, guildId, 'champions-slam');
  if (TOURNAMENTS.every(won)) grantTitleInPlace(state, guildId, 'master-of-the-world');
  if (['Initiation', 'Champion', 'Elite'].some((circuit) => of(circuit).every((definition) => (wins[definition.id] || []).includes(year)))) grantTitleInPlace(state, guildId, 'season-sweep');
  if (Object.values(wins).some((years) => years.some((first) => years.includes(first + 1) && years.includes(first + 2)))) grantTitleInPlace(state, guildId, 'dynasty');
}
