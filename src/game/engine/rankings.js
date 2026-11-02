// @ts-check
// Guild ladders (Regional/National/Global) and hero all-time rankings.
import { TIERS } from '../../data/content.js';
import { ensureTournamentCareer, getHeroGuildName, getWorldHeroes } from './core.js';

function scopeIndex(scope) {
  if (scope === 'Regional') return 0;
  if (scope === 'National') return 1;
  return 2;
}

export function guildRankings(state, scope = null) {
  const ladder = scope || TIERS[state.guild.tierIndex]?.id || 'Regional';
  const maxTier = scopeIndex(ladder);
  const active = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const playerPower = active.length
    ? active
        .sort((a, b) => b.power - a.power)
        .slice(0, 5)
        .reduce((sum, hero) => sum + hero.power, 0) / Math.min(5, active.length)
    : 0;
  const rows = [
    {
      id: 'player',
      name: state.guild.name,
      motto: state.guild.motto,
      fame: state.guild.fame,
      legacy: state.guild.legacy,
      tierIndex: state.guild.tierIndex,
      form: active.reduce((sum, hero) => sum + hero.form, 0) / Math.max(1, active.length),
      power: playerPower,
      titles: state.stats.tournamentsWon || 0,
      prizeMoney: active.reduce((sum, hero) => sum + (hero.career?.prizeMoney || 0), 0),
      seasonPoints: state.stats.missionsWon + (state.stats.individualTournamentWins || 0) * 8 + (state.stats.guildTournamentWins || 0) * 15,
      careerPoints: state.guild.legacy + (state.stats.tournamentsWon || 0) * 25,
      rosterSize: active.length,
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
        fame: rival.fame,
        legacy: rival.legacy,
        tierIndex: rival.leagueTierIndex ?? rival.tierIndex,
        form: rival.form,
        power: rival.power,
        titles: rival.titles || 0,
        prizeMoney: rival.prizeMoney || 0,
        seasonPoints: rival.seasonPoints || 0,
        careerPoints: rival.careerPoints || 0,
        rosterSize: 1 + (rival.members?.length || 0),
        star: rival.star,
        player: false,
      })),
  ];
  return rows
    .map((row) => ({
      ...row,
      score: Math.round(
        row.fame * 1.7 + row.legacy * 1.05 + row.titles * 72 + row.power * 3.8 + row.form * 1.5 + row.careerPoints * 0.35 + row.seasonPoints * 2,
      ),
    }))
    .sort((a, b) => b.score - a.score || b.legacy - a.legacy)
    .map((row, index) => ({ ...row, rank: index + 1, scope: ladder }));
}

export function getGuildRankings(state, scope = null) {
  return guildRankings(state, scope);
}

export function getGuildRankSummary(state) {
  return ['Regional', 'National', 'Global'].map((scope) => {
    const rows = guildRankings(state, scope);
    const player = rows.find((row) => row.id === 'player');
    return { scope, rank: player?.rank || rows.length, total: rows.length, score: player?.score || 0 };
  });
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
