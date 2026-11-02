// @ts-check
// Three ladders, for guilds and heroes:
//   Strength – current power (guild = average of its top 5 heroes). Moves fast.
//   Legacy   – all-time points from completed missions (difficulty × grade) and titles. Never decays.
//   Official – tennis-style tournament points from the last 12 months.
// Plus the status title (Unknown → Global Power), monthly rank snapshots and
// rankings moments. The old blended composite score is gone.
import { TIERS } from '../../data/content.js';
import { addChronicle, campaignMonthSerial, ensureTournamentCareer, getHero, getHeroGuildName, getWorldHeroes, pushMoment } from './core.js';

export const LADDERS = ['strength', 'legacy', 'official'];
export const LADDER_LABELS = { strength: 'Strength', legacy: 'Legacy', official: 'Official' };
export const SCOPES = ['Regional', 'National', 'Global'];

/** Points for winning a tournament, by circuit (the World Conclave is special). */
export const OFFICIAL_WINNER_POINTS = { Regional: 250, National: 1000, Global: 2000, 'world-conclave-championship': 4000 };
/** Share of the winner's points by finish (1 = champion, 2 = runner-up, 4 = semifinal, …). */
export const FINISH_SHARE = { 1: 1, 2: 0.6, 4: 0.36, 8: 0.18, 16: 0.09, 32: 0.045 };
export const OFFICIAL_WINDOW_MONTHS = 12;
export const MAX_RANK_HISTORY = 24;

/** Legacy points per point of mission difficulty, by grade. */
export const GRADE_LEGACY = { Legendary: 2, 'Great Success': 1.5, Success: 1, Partial: 0.4, Defeat: 0, Catastrophic: 0 };
export const GUILD_TITLE_LEGACY = 150;
export const HERO_TITLE_LEGACY = 150;
export const HERO_GUILD_TITLE_LEGACY = 60;

export const STATUS_TITLES = ['Unknown', 'Contender', 'Regional Power', 'National Power', 'Global Power'];
/** Official rank needed (in that tier's ladder) for the Regional/National/Global Power titles. */
export const POWER_TITLE_RANK = 5;

function scopeIndex(scope) {
  const index = SCOPES.indexOf(scope);
  return index < 0 ? 2 : index;
}

function currentScope(state) {
  return TIERS[state.guild.tierIndex]?.id || 'Regional';
}

function isActive(hero) {
  return hero && !['dead', 'retired'].includes(hero.status);
}

function topFiveAverage(heroes) {
  const powers = heroes
    .filter(isActive)
    .map((hero) => (hero.power || 0) + (hero.artifactPowerBonus || 0))
    .sort((a, b) => b - a)
    .slice(0, 5);
  return powers.length ? Math.round(powers.reduce((sum, power) => sum + power, 0) / powers.length) : 0;
}

// ---------------------------------------------------------------- official points

export function officialPointsFor(tournament, finish) {
  const base = OFFICIAL_WINNER_POINTS[tournament.definitionId] || OFFICIAL_WINNER_POINTS[tournament.circuit] || OFFICIAL_WINNER_POINTS.Regional;
  return Math.round(base * (FINISH_SHARE[finish] ?? 0.03));
}

/** Finish per entrant from a single-elimination bracket: champion 1, runner-up 2, semifinalists 4, … */
export function finishesFromBracket(entrantIds, bracket) {
  const wins = Object.fromEntries(entrantIds.map((id) => [id, 0]));
  (bracket || []).forEach((bout) => {
    if (bout.winnerId in wins) wins[bout.winnerId] += 1;
  });
  return Object.fromEntries(entrantIds.map((id) => [id, Math.max(1, Math.round(entrantIds.length / 2 ** wins[id]))]));
}

function pruneLedgerInPlace(state) {
  const cutoff = campaignMonthSerial(state) - OFFICIAL_WINDOW_MONTHS;
  state.officialLedger = (state.officialLedger || []).filter((entry) => entry.serial > cutoff);
}

/** Writes official points for every entrant of a finished tournament. kind: 'individual' | 'guild'. */
export function recordOfficialResultsInPlace(state, tournament, kind) {
  state.officialLedger ||= [];
  const serial = campaignMonthSerial(state);
  const finishes = finishesFromBracket(tournament.initialEntrants || [], tournament.bracket);
  Object.entries(finishes).forEach(([id, finish]) => {
    const points = officialPointsFor(tournament, finish);
    if (kind === 'individual') {
      const hero = getHero(state, id);
      state.officialLedger.push({ serial, tournamentId: tournament.id, heroId: id, guildId: hero?.guildId ?? null, points, finish });
    } else {
      state.officialLedger.push({ serial, tournamentId: tournament.id, heroId: null, guildId: id, points, finish });
    }
  });
  pruneLedgerInPlace(state);
}

function officialTotals(state) {
  const cutoff = campaignMonthSerial(state) - OFFICIAL_WINDOW_MONTHS;
  const guilds = {};
  const heroes = {};
  (state.officialLedger || []).forEach((entry) => {
    if (entry.serial <= cutoff) return;
    if (entry.guildId) guilds[entry.guildId] = (guilds[entry.guildId] || 0) + entry.points;
    if (entry.heroId) heroes[entry.heroId] = (heroes[entry.heroId] || 0) + entry.points;
  });
  return { guilds, heroes };
}

// ---------------------------------------------------------------- legacy points

/** Adds legacy for a resolved mission to the guild and (half) to each participant. */
export function addMissionLegacyInPlace(state, mission, grade, heroIds) {
  const points = Math.round((mission.difficulty || 0) * (GRADE_LEGACY[grade] ?? 0));
  if (!points) return 0;
  state.guild.legacyPoints = (state.guild.legacyPoints || 0) + points;
  heroIds.forEach((id) => {
    const hero = getHero(state, id);
    if (hero) hero.legacyPoints = (hero.legacyPoints || 0) + Math.round(points / 2);
  });
  return points;
}

function heroLegacy(hero) {
  ensureTournamentCareer(hero);
  const career = hero.career || {};
  return (
    (hero.legacyPoints || 0) +
    (career.individualTitles || 0) * HERO_TITLE_LEGACY +
    (career.guildTitles || 0) * HERO_GUILD_TITLE_LEGACY +
    (career.legendary || 0) * 40
  );
}

// ---------------------------------------------------------------- ladders

function sortLadder(rows, ladder) {
  return rows
    .map((row) => ({ ...row, value: row[ladder] }))
    .sort(
      (a, b) => b.value - a.value || b.official - a.official || b.legacy - a.legacy || b.strength - a.strength || String(a.name).localeCompare(String(b.name)),
    )
    .map((row, index) => ({ ...row, rank: index + 1, ladder }));
}

/** Guild ladder rows for a scope (Regional/National/Global), sorted, with rank and value. */
export function guildLadder(state, ladder = 'official', scope = null) {
  const maxTier = scopeIndex(scope || currentScope(state));
  const totals = officialTotals(state).guilds;
  const rows = [
    {
      id: 'player',
      name: state.guild.name,
      motto: state.guild.motto,
      tierIndex: state.guild.tierIndex,
      strength: topFiveAverage(state.heroes),
      legacy: (state.guild.legacyPoints || 0) + (state.stats.tournamentsWon || 0) * GUILD_TITLE_LEGACY,
      official: totals.player || 0,
      titles: state.stats.tournamentsWon || 0,
      rosterSize: state.heroes.filter(isActive).length,
      player: true,
    },
    ...state.rivals
      .filter((rival) => (rival.leagueTierIndex ?? rival.tierIndex) <= maxTier)
      .map((rival) => ({
        id: rival.id,
        name: rival.name,
        motto: rival.motto,
        archetype: rival.archetype,
        color: rival.color,
        tierIndex: rival.leagueTierIndex ?? rival.tierIndex,
        strength: topFiveAverage([rival.star, ...(rival.members || [])].filter(Boolean)),
        legacy: (rival.legacyPoints ?? rival.careerPoints ?? 0) + (rival.titles || 0) * GUILD_TITLE_LEGACY,
        official: totals[rival.id] || 0,
        titles: rival.titles || 0,
        rosterSize: 1 + (rival.members?.length || 0),
        star: rival.star,
        player: false,
      })),
  ];
  return sortLadder(rows, ladder).map((row) => ({ ...row, scope: scope || currentScope(state) }));
}

/** Hero ladder rows. Strength and Official cover active heroes; Legacy also includes retired legends. */
export function heroLadder(state, ladder = 'official') {
  const totals = officialTotals(state).heroes;
  const playerIds = new Set([...state.heroes, ...state.historicHeroes].map((hero) => hero.id));
  const pool =
    ladder === 'legacy'
      ? [...state.heroes, ...state.historicHeroes, ...getWorldHeroes(state, true)]
      : [...state.heroes.filter(isActive), ...getWorldHeroes(state, false).filter(isActive)];
  const seen = new Set();
  const rows = pool
    .filter((hero) => (seen.has(hero.id) ? false : (seen.add(hero.id), true)))
    .map((hero) => ({
      ...hero,
      guildName: getHeroGuildName(state, hero),
      player: playerIds.has(hero.id),
      strength: (hero.power || 0) + (hero.artifactPowerBonus || 0),
      legacy: heroLegacy(hero),
      official: totals[hero.id] || 0,
    }));
  return sortLadder(rows, ladder);
}

/** The player's rank on each ladder in a scope (default: the guild's current tier). */
export function getPlayerRanks(state, scope = null) {
  return Object.fromEntries(
    LADDERS.map((ladder) => {
      const rows = guildLadder(state, ladder, scope);
      const row = rows.find((item) => item.player);
      return [ladder, { rank: row?.rank || rows.length, total: rows.length, value: row?.value || 0 }];
    }),
  );
}

/** The guild just above the player on a ladder, and the points needed to pass it. */
export function getPointsToPass(state, ladder = 'official', scope = null) {
  const rows = guildLadder(state, ladder, scope);
  const index = rows.findIndex((row) => row.player);
  if (index <= 0) return null;
  const above = rows[index - 1];
  return { name: above.name, rank: above.rank, gap: above.value - rows[index].value + 1 };
}

export function getStatusTitle(state) {
  const official = officialTotals(state).guilds.player || 0;
  if (!official) return 'Unknown';
  const rankIn = (scope) => guildLadder(state, 'official', scope).find((row) => row.player)?.rank || 99;
  if (state.guild.tierIndex >= 2 && rankIn('Global') <= POWER_TITLE_RANK) return 'Global Power';
  if (state.guild.tierIndex >= 1 && rankIn('National') <= POWER_TITLE_RANK) return 'National Power';
  if (rankIn('Regional') <= POWER_TITLE_RANK) return 'Regional Power';
  return 'Contender';
}

/** Rank movement versus the last monthly snapshot: positive = moved up. */
export function getRankMovement(state) {
  const previous = (state.rankHistory || []).at(-1);
  const current = getPlayerRanks(state);
  return Object.fromEntries(LADDERS.map((ladder) => [ladder, previous ? previous[ladder] - current[ladder].rank : 0]));
}

/** Monthly snapshot of the player's ranks (small and bounded). */
export function recordRankSnapshotInPlace(state) {
  const ranks = getPlayerRanks(state);
  state.rankHistory ||= [];
  state.rankHistory.push({ serial: campaignMonthSerial(state), strength: ranks.strength.rank, legacy: ranks.legacy.rank, official: ranks.official.rank });
  if (state.rankHistory.length > MAX_RANK_HISTORY) state.rankHistory.splice(0, state.rankHistory.length - MAX_RANK_HISTORY);
  pruneLedgerInPlace(state);
}

/** Queues a "Rankings update" moment comparing current ranks with an earlier snapshot. */
export function pushRankingsMomentInPlace(state, title, previous = null) {
  const ranks = getPlayerRanks(state);
  const before = previous || (state.rankHistory || []).at(-1) || null;
  pushMoment(state, {
    type: 'rankings',
    title,
    scope: currentScope(state),
    statusTitle: getStatusTitle(state),
    ladders: LADDERS.map((ladder) => ({
      ladder,
      label: LADDER_LABELS[ladder],
      rank: ranks[ladder].rank,
      total: ranks[ladder].total,
      value: ranks[ladder].value,
      change: before ? before[ladder] - ranks[ladder].rank : 0,
    })),
  });
}

/** Keeps guild.statusTitle current and celebrates a change. */
export function updateStatusTitleInPlace(state) {
  const next = getStatusTitle(state);
  const previous = state.guild.statusTitle;
  state.guild.statusTitle = next;
  if (previous && previous !== next) {
    const promoted = STATUS_TITLES.indexOf(next) > STATUS_TITLES.indexOf(previous);
    pushMoment(state, { type: 'statusTitle', title: next, from: previous, to: next, promoted });
    addChronicle(state, {
      type: 'rankings',
      importance: promoted ? 4 : 2,
      title: promoted ? `${state.guild.name} is now a ${next}` : `${state.guild.name} falls to ${next}`,
      text: `The official ladder now names the guild ${next} (was ${previous}).`,
      tags: ['rankings', 'status'],
    });
  }
}

// ---------------------------------------------------------------- compatibility helpers

/** Official ladder rows for a scope (kept for older callers). */
export function getGuildRankings(state, scope = null) {
  return guildLadder(state, 'official', scope);
}

/** The player's official rank in each scope. */
export function getGuildRankSummary(state) {
  return SCOPES.map((scope) => {
    const rows = guildLadder(state, 'official', scope);
    const player = rows.find((row) => row.player);
    return { scope, rank: player?.rank || rows.length, total: rows.length, score: player?.value || 0 };
  });
}

export function getGuildLadder(state, ladder = 'official', scope = null) {
  return guildLadder(state, ladder, scope);
}

export function getHeroLadder(state, ladder = 'official') {
  return heroLadder(state, ladder);
}

function heroHistoricalComponents(hero) {
  ensureTournamentCareer(hero);
  const career = hero.career || {};
  const peak = career.peakPower || hero.power || 0;
  const majorDeeds = (career.legendary || 0) * 32 + (career.artifactPrestige || 0) * 0.65 + (career.artifacts || 0) * 18;
  const tournament =
    (career.individualTitles || 0) * 38 +
    (career.guildTitles || 0) * 19 +
    (career.runnerUps || 0) * 10 +
    (career.semifinals || 0) * 4 +
    (career.tournamentBoutWins || 0) * 1.4;
  const quests = (career.wins || 0) * 4.2 + (career.missions || 0) * 0.75 + (career.rescues || 0) * 8;
  const peakPerformance = peak * 2 + (hero.level || 1) * 2.5;
  const longevity = (career.serviceYears || 0) * 4 + Math.min(25, career.tournaments || 0) * 0.6;
  const completedAmbitions = (hero.ambitions || []).filter((ambition) => ambition.status === 'completed').length;
  const inheritedAmbitions = (hero.ambitions || []).filter((ambition) => ambition.status === 'completed' && ambition.inheritedFromHeroId).length;
  const leadership =
    (career.guildTitles || 0) * 14 +
    (career.leadershipYears || 0) * 5 +
    (hero.apprenticeIds?.length || 0) * 3 +
    (hero.appointment ? 12 : 0) +
    (hero.loyalty || 0) * 0.08;
  const ambitionLegacy = completedAmbitions * 12 + inheritedAmbitions * 18;
  const cultural = (hero.renown || 0) * 0.8 + (hero.legacy || 0) * 0.45 + (career.tournamentFame || 0) * 0.45;
  const weighted =
    majorDeeds * 0.24 +
    tournament * 0.19 +
    quests * 0.14 +
    peakPerformance * 0.14 +
    longevity * 0.09 +
    leadership * 0.11 +
    cultural * 0.05 +
    ambitionLegacy * 0.04;
  return {
    majorDeeds: Math.round(majorDeeds),
    tournament: Math.round(tournament),
    quests: Math.round(quests),
    peakPerformance: Math.round(peakPerformance),
    longevity: Math.round(longevity),
    leadership: Math.round(leadership),
    cultural: Math.round(cultural),
    weighted: Math.round(weighted),
  };
}

/** The all-time greats list (Herald → Records). */
export function getHeroRankings(state) {
  const playerIds = new Set([...state.heroes, ...state.historicHeroes].map((hero) => hero.id));
  return [...state.heroes, ...state.historicHeroes, ...getWorldHeroes(state, true)]
    .filter((hero, index, all) => all.findIndex((item) => item.id === hero.id) === index)
    .map((hero) => {
      const components = heroHistoricalComponents(hero);
      return {
        ...hero,
        guildName: getHeroGuildName(state, hero),
        player: playerIds.has(hero.id),
        historicalScore: components.weighted,
        historicalComponents: components,
      };
    })
    .sort((a, b) => b.historicalScore - a.historicalScore || (b.career?.titles || 0) - (a.career?.titles || 0) || b.legacy - a.legacy)
    .map((hero, index) => ({ ...hero, historicalRank: index + 1 }));
}
