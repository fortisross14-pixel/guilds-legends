// @ts-check
// Tournaments, shared rules (tournaments-circuits spec): the definitions, who may
// enter (the guild's status tier or lower, fame, combat wins), guild ratings,
// seeding and expectations, fame from a finish, title records and prizes. The
// events themselves (creation, rounds, champions, special titles) are in
// guildTournaments.js; signing up and bouts in tournamentEntry.js.
import { TOURNAMENT_BY_ID } from '../../data/tournaments.js';
import { MAX_TITLE_HISTORY, clamp, campaignWeekSerial, dateWeekSerial } from './core.js';

function tournamentDefinition(tournament) {
  return TOURNAMENT_BY_ID[tournament?.definitionId] || TOURNAMENT_BY_ID[tournament?.id] || null;
}

export function tournamentRequirements(tournament) {
  const definition = tournamentDefinition(tournament) || tournament;
  return {
    fame: definition.minFame || 0,
    combatWins: definition.minCombatWins || 0,
    tierIndex: definition.tierIndex || 0,
  };
}

/** Whether the guild may enter: its status tier or lower, the event's fame and combat wins; where and when. */
export function getTournamentAccess(state, tournament) {
  if (!tournament) return { unlocked: false, checks: [], locationMet: false, registrationOpen: false };
  const requirements = tournamentRequirements(tournament);
  const checks = [
    { id: 'fame', label: 'Guild fame', current: state.guild.fame, target: requirements.fame, met: state.guild.fame >= requirements.fame },
    { id: 'combatWins', label: 'Battles won', current: state.stats.combatWins || 0, target: requirements.combatWins, met: (state.stats.combatWins || 0) >= requirements.combatWins },
    { id: 'tierIndex', label: 'Guild status', current: state.guild.tierIndex, target: requirements.tierIndex, met: state.guild.tierIndex >= requirements.tierIndex },
  ].filter((check) => check.target > 0);
  const locationMet = !tournament.locationId || (state.world?.currentLocationId || 'dunmere') === tournament.locationId;
  const registrationOpen =
    tournament.status === 'registration' && campaignWeekSerial(state) <= dateWeekSerial({ year: tournament.year, month: tournament.month, week: tournament.week || 0 });
  return { unlocked: checks.every((check) => check.met), checks, locationMet, registrationOpen };
}

export function guildTournamentRating(state, guildId) {
  if (guildId === 'player') {
    const active = state.heroes
      .filter((hero) => !['dead', 'retired'].includes(hero.status))
      .sort((a, b) => b.power - a.power)
      .slice(0, 5);
    return active.length
      ? active.reduce((sum, hero) => sum + hero.power + (hero.artifactPowerBonus || 0) + (hero.specializations?.tournament || 0) * 0.45, 0) / active.length
      : 0;
  }
  const guild = state.rivals.find((item) => item.id === guildId);
  if (!guild) return 0;
  const roster = [guild.star, ...(guild.members || [])]
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .sort((a, b) => b.power - a.power)
    .slice(0, 5);
  return roster.length
    ? roster.reduce((sum, hero) => sum + hero.power + (hero.specializations?.tournament || 0) * 0.45, 0) / roster.length + guild.form * 0.08
    : guild.power;
}

export function heroCompetitionTier(state, hero) {
  if (hero.guildId === 'player') return state.guild.tierIndex;
  const rival = state.rivals.find((guild) => guild.id === hero.guildId);
  if (rival) return rival.leagueTierIndex ?? rival.tierIndex;
  const profile = (hero.renown || 0) + (hero.career?.tournamentFame || 0) * 0.25;
  if ((hero.level || 1) >= 14 || profile >= 480) return 2;
  if ((hero.level || 1) >= 8 || profile >= 110) return 1;
  return 0;
}

export function seedEntrants(state, tournament, ids, scoreFn) {
  return [...new Set(ids)]
    .map((id) => ({ id, score: scoreFn(id) }))
    .sort((a, b) => b.score - a.score)
    .map((row) => row.id);
}

export function expectedFinishForSeed(seed, size, profile, prestige) {
  let expected = seed <= 2 ? 2 : seed <= 4 ? 4 : seed <= 8 ? 8 : size;
  // Seed represents current competitive strength; profile represents public pressure.
  // A world-famous hero entering a modest event is expected to dominate even when form is poor.
  if (profile >= prestige * 8) expected = 1;
  else if (profile >= prestige * 4) expected = Math.min(expected, 2);
  else if (profile >= prestige * 2) expected = Math.min(expected, 4);
  else if (seed === 1 && profile >= prestige * 1.3) expected = 1;
  return expected;
}

export function tournamentFameDelta(hero, tournament, expectedFinish, actualFinish, boutWins, showmanshipWins = 0) {
  const prestige = tournament.prestige || 20;
  const profile = (hero.renown || 0) + (hero.career?.tournamentFame || 0) * 0.35;
  const expected = Math.max(1, expectedFinish || tournament.size);
  const actual = Math.max(1, actualFinish || tournament.size);
  const improvement = Math.log2(expected / actual);
  const newcomer = Math.max(0, prestige * 1.35 - profile) / Math.max(18, prestige * 0.75);
  let delta = boutWins * Math.max(1, prestige / 17) + improvement * Math.max(3, prestige / 5) + newcomer + showmanshipWins * 2;
  if (actual === 1) delta += prestige / 4;
  if (actual > expected) {
    const failure = Math.log2(actual / expected);
    delta = profile < prestige * 1.15 ? Math.max(0, (boutWins * prestige) / 24 + newcomer) : (-failure * prestige) / 6;
  }
  if (actual === tournament.size && profile < prestige * 0.9) delta = Math.max(1, Math.round(newcomer));
  return clamp(Math.round(delta), -30, 120);
}

export function updateGuildTitleRecordInPlace(state, tournament, guildId) {
  const record = state.titleRecords[tournament.definitionId];
  if (!record) return;
  const guildName = guildId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildId)?.name || 'Unknown guild';
  record.winsByGuild[guildId] = (record.winsByGuild[guildId] || 0) + 1;
  const wins = record.winsByGuild[guildId];
  record.winners.unshift({ year: tournament.year, guildId, guildName, player: guildId === 'player' });
  record.winners = record.winners.slice(0, MAX_TITLE_HISTORY);
  if (wins > record.recordWins) {
    record.recordWins = wins;
    record.recordHolderName = guildName;
  }
}

export function placementPrize(tournament, finish) {
  if (finish === 1) return tournament.purse;
  if (finish === 2) return Math.round(tournament.purse * 0.28);
  if (finish === 4) return Math.round(tournament.purse * 0.09);
  return 0;
}

