// @ts-check
// Individual tournaments: access, ratings, fields, AI resolution, records.
import { normalizeClassId } from '../../data/content.js';
import { LOCATION_BY_ID, primalCombatModifier } from '../../data/world.js';
import { GUILD_TOURNAMENT_DEFINITIONS, INDIVIDUAL_TOURNAMENT_DEFINITIONS } from '../../data/universe.js';
import {
  MAX_TITLE_HISTORY,
  MAX_TOURNAMENT_HISTORY,
  addChronicle,
  addHeroHistory,
  clamp,
  clone,
  ensureTournamentCareer,
  getHero,
  getHeroGuildName,
  getWorldHeroes,
  rngFor,
  hashString,
  campaignWeekSerial,
  dateWeekSerial,
} from './core.js';
import { applyXpInPlace } from './heroes.js';
import { addItemsInPlace, lootNames, rollLoot } from './inventory.js';
import { pushRankingsMomentInPlace, recordOfficialResultsInPlace } from './rankings.js';

function tournamentDefinition(tournament) {
  const source = tournament.kind === 'guild' ? GUILD_TOURNAMENT_DEFINITIONS : INDIVIDUAL_TOURNAMENT_DEFINITIONS;
  return source.find((definition) => definition.id === tournament.definitionId) || null;
}

export function tournamentRequirements(tournament) {
  const definition = tournamentDefinition(tournament) || tournament;
  return {
    fame: definition.minFame || 0,
    combatWins: definition.minCombatWins || 0,
    tierIndex: definition.tierIndex || 0,
    level: definition.minLevel || 0,
  };
}

export function getTournamentAccess(state, tournament, heroId = null) {
  if (!tournament) return { unlocked: false, checks: [], locationMet: false, registrationOpen: false };
  const requirements = tournamentRequirements(tournament);
  const hero = heroId ? getHero(state, heroId) : null;
  const checks = [
    { id: 'fame', label: 'Guild fame', current: state.guild.fame, target: requirements.fame, met: state.guild.fame >= requirements.fame },
    {
      id: 'combatWins',
      label: 'Combat mission wins',
      current: state.stats.combatWins || 0,
      target: requirements.combatWins,
      met: (state.stats.combatWins || 0) >= requirements.combatWins,
    },
    {
      id: 'tierIndex',
      label: 'Guild tier',
      current: state.guild.tierIndex,
      target: requirements.tierIndex,
      met: state.guild.tierIndex >= requirements.tierIndex,
    },
    {
      id: 'level',
      label: 'Hero level',
      current: hero?.level || 0,
      target: requirements.level,
      met: !requirements.level || Boolean(hero && hero.level >= requirements.level),
    },
  ].filter((check) => check.target > 0);
  const locationMet = !tournament.locationId || (state.world?.currentLocationId || 'dunmere') === tournament.locationId;
  const registrationOpen =
    tournament.status === 'registration' &&
    campaignWeekSerial(state) <= dateWeekSerial({ year: tournament.year, month: tournament.month, week: tournament.week || 0 });
  return { unlocked: checks.every((check) => check.met), checks, locationMet, registrationOpen };
}

export function heroTournamentRating(hero, tournament, opponentPrimal = null) {
  if (!hero) return 0;
  ensureTournamentCareer(hero);
  const attrs = hero.attributes || {};
  const classBonus = { Duelist: 9, Guardian: 5, Ranger: 4, Mage: 3, Rogue: 3, Cleric: 2, Scholar: 2, Artificer: 1 }[normalizeClassId(hero.classId)] || 0;
  const rarityBonus = { Common: -14, Uncommon: -8, Rare: 0, Epic: 8, Legend: 18 }[hero.rarity] || 0;
  const technical =
    (attrs.Finesse || hero.power) * 0.28 + (attrs.Might || hero.power) * 0.16 + (attrs.Presence || hero.power) * 0.13 + (attrs.Mind || hero.power) * 0.08;
  const primal = opponentPrimal ? primalCombatModifier(hero.primal, opponentPrimal) * 5.5 : 0;
  const circuitPressure = tournament.circuit === 'Global' ? (hero.level - 12) * 0.35 : tournament.circuit === 'National' ? (hero.level - 7) * 0.25 : 0;
  const agePressure = Math.max(0, (hero.age || 24) - 34) * 0.72;
  return (
    (hero.power + (hero.artifactPowerBonus || 0)) * 0.45 +
    technical +
    hero.form * 0.09 +
    classBonus +
    rarityBonus +
    (hero.specializations?.tournament || 0) +
    primal +
    circuitPressure -
    hero.fatigue * 0.055 -
    agePressure
  );
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

function eligibleWorldTournamentHeroes(state, definition) {
  const minLevel = Math.max(1, (definition.minLevel || 1) - 3);
  const maxTier = definition.circuit === 'Regional' ? 0 : definition.circuit === 'National' ? 1 : 2;
  const maxLevel = definition.circuit === 'Regional' ? 13 : definition.circuit === 'National' ? 18 : 20;
  const maxProfile = definition.circuit === 'Regional' ? 260 : definition.circuit === 'National' ? 1050 : Infinity;
  const maxCareerTitles = definition.circuit === 'Regional' ? 8 : definition.circuit === 'National' ? 20 : Infinity;
  return getWorldHeroes(state, false)
    .filter((hero) => ['active', 'free-agent', 'available'].includes(hero.status))
    .filter((hero) => hero.level >= minLevel && hero.level <= maxLevel)
    .filter((hero) => heroCompetitionTier(state, hero) <= maxTier)
    .filter((hero) => (hero.renown || 0) + (hero.career?.tournamentFame || 0) * 0.25 <= maxProfile)
    .filter((hero) => (hero.career?.individualTitles || 0) <= maxCareerTitles)
    .filter((hero) => definition.circuit !== 'Global' || ['Rare', 'Epic', 'Legend'].includes(hero.rarity));
}

function weightedTournamentSelection(rows, count, rng, exponent) {
  const selected = [];
  const pool = [...rows];
  while (selected.length < count && pool.length) {
    const index = Math.min(pool.length - 1, Math.floor(Math.pow(rng.next(), exponent) * pool.length));
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function buildIndividualTournamentField(state, rng, tournament, count) {
  const definition = tournamentDefinition(tournament) || tournament;
  const aiRepeatCeiling = (definition.record?.wins || 4) + 2;
  const all = eligibleWorldTournamentHeroes(state, definition)
    .filter((hero) => (hero.career?.titleWins?.[definition.id] || 0) < aiRepeatCeiling)
    .map((hero) => {
      const priorWins = hero.career?.titleWins?.[definition.id] || 0;
      const baseRepeatPressure = definition.circuit === 'Regional' ? 5.5 : definition.circuit === 'National' ? 4.2 : 3.2;
      const repeatPressure = priorWins * baseRepeatPressure + Math.max(0, priorWins - 4) * 8;
      const independentPenalty = hero.status === 'free-agent' ? 5 : 0;
      return { hero, score: heroTournamentRating(hero, tournament) + rng.int(-7, 7) - repeatPressure - independentPenalty };
    });

  const local = all.filter(({ hero }) => hero.homeLocationId === definition.locationId);
  const preferred = local.length >= Math.ceil(count * 0.6) ? local : all;
  const guildRows = preferred.filter(({ hero }) => hero.status !== 'free-agent').sort((a, b) => b.score - a.score);
  const freeRows = preferred.filter(({ hero }) => hero.status === 'free-agent').sort((a, b) => b.score - a.score);
  const freeCap = definition.circuit === 'Regional' ? Math.min(2, Math.ceil(count * 0.15)) : 1;
  const exponent = definition.circuit === 'Regional' ? 1.35 : definition.circuit === 'National' ? 1.8 : 2.25;
  const selectedFree = weightedTournamentSelection(freeRows.slice(0, Math.max(8, freeCap * 4)), Math.min(freeCap, freeRows.length), rng, exponent);
  const selectedGuild = weightedTournamentSelection(guildRows.slice(0, Math.max(count * 4, 36)), count - selectedFree.length, rng, exponent);
  const selected = [...selectedGuild, ...selectedFree];

  if (selected.length < count) {
    const used = new Set(selected.map((row) => row.hero.id));
    const fallback = all.filter((row) => !used.has(row.hero.id)).sort((a, b) => b.score - a.score);
    selected.push(...weightedTournamentSelection(fallback, count - selected.length, rng, exponent));
  }
  return selected.map((row) => row.hero.id);
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

function snapshotTournamentHero(state, heroId) {
  const hero = getHero(state, heroId);
  return hero
    ? {
        heroId: hero.id,
        name: hero.name,
        guildId: hero.guildId || null,
        guildName: getHeroGuildName(state, hero),
        classId: hero.classId,
        primal: hero.primal,
        rarity: hero.rarity,
        level: hero.level,
        power: hero.power,
        tournamentRating: Math.round(heroTournamentRating(hero, { circuit: 'Regional' })),
      }
    : null;
}

function updateIndividualTitleRecordInPlace(state, tournament, winner) {
  const record = state.titleRecords[tournament.definitionId];
  if (!record || !winner) return;
  const key = winner.id;
  record.winsByHero[key] = (record.winsByHero[key] || 0) + 1;
  const wins = record.winsByHero[key];
  record.winners.unshift({
    year: tournament.year,
    heroId: winner.id,
    heroName: winner.name,
    guildName: getHeroGuildName(state, winner),
    player: winner.guildId === 'player',
  });
  record.winners = record.winners.slice(0, MAX_TITLE_HISTORY);
  if (wins > record.recordWins) {
    record.recordWins = wins;
    record.recordHolderName = winner.name;
  }
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

function recordIndividualTournamentInPlace(state, tournament, championId, playerResult = null) {
  const champion = getHero(state, championId);
  if (!champion) return null;
  ensureTournamentCareer(champion);
  champion.career.titles += 1;
  champion.career.individualTitles += 1;
  champion.career.titleWins[tournament.definitionId] = (champion.career.titleWins[tournament.definitionId] || 0) + 1;
  champion.career.prizeMoney += tournament.purse;
  champion.career.tournamentFame += Math.round(tournament.prestige * 0.55);
  champion.career.bestTournamentFinish = 1;
  champion.renown += Math.round(tournament.prestige * 0.35);
  champion.legacy += Math.round(tournament.prestige * 0.5);
  applyXpInPlace(champion, 80 + tournament.prestige, champion.guildId === 'player' ? state : null, `${tournament.name} championship`);
  addHeroHistory(champion, state, {
    type: 'tournament-title',
    title: `Won ${tournament.name}`,
    text: `Claimed the ${tournament.trophy} and ${tournament.purse} crowns in prize money.`,
  });
  updateIndividualTitleRecordInPlace(state, tournament, champion);

  if (champion.guildId === 'player') {
    state.guild.crowns += tournament.purse;
    state.guild.legacy += Math.round(tournament.prestige * 0.28);
    state.stats.tournamentsWon += 1;
    state.stats.individualTournamentWins = (state.stats.individualTournamentWins || 0) + 1;
    if (tournament.circuit === 'Regional') state.stats.localTournamentWins += 1;
    if (tournament.circuit === 'National') state.stats.professionalTournamentWins += 1;
    if (tournament.circuit === 'Global') state.stats.eliteTournamentWins += 1;
    state.stats.signatureFeats += tournament.circuit === 'Global' ? 1 : 0;
  } else {
    const rival = state.rivals.find((guild) => guild.id === champion.guildId);
    if (rival) {
      rival.titles += 1;
      rival.prizeMoney = (rival.prizeMoney || 0) + tournament.purse;
      rival.fame += Math.round(tournament.prestige * 0.35);
      rival.legacy += Math.round(tournament.prestige * 0.3);
      rival.careerPoints = (rival.careerPoints || 0) + tournament.prestige;
    }
  }

  const record = {
    id: `individual-record-${tournament.id}`,
    kind: 'individual-tournament',
    tournamentId: tournament.id,
    definitionId: tournament.definitionId,
    title: tournament.name,
    circuit: tournament.circuit,
    location: tournament.location,
    year: tournament.year,
    championId,
    championName: champion.name,
    championGuild: getHeroGuildName(state, champion),
    prize: tournament.purse,
    prestige: tournament.prestige,
    entrants: tournament.initialEntrants.map((id) => snapshotTournamentHero(state, id)).filter(Boolean),
    bracket: clone(tournament.bracket),
    playerResult,
    narrative: playerResult
      ? `${playerResult.heroName} finished ${playerResult.finish === 1 ? 'as champion' : `in the top ${playerResult.finish}`}, against an expectation of top ${playerResult.expectedFinish}. ${playerResult.fameDelta >= 0 ? 'The run increased' : 'The result damaged'} public standing by ${Math.abs(playerResult.fameDelta)} fame.`
      : `${champion.name} of ${getHeroGuildName(state, champion)} won the ${tournament.name}.`,
  };
  state.tournamentHistory.unshift(record);
  state.tournamentHistory = state.tournamentHistory.slice(0, MAX_TOURNAMENT_HISTORY);
  state.universeStats.individualTournamentsResolved = (state.universeStats.individualTournamentsResolved || 0) + 1;
  recordOfficialResultsInPlace(state, tournament, 'individual');
  if (playerResult) {
    state.pendingReports.unshift({ kind: 'tournament', id: record.id });
    pushRankingsMomentInPlace(state, `Rankings after the ${tournament.name}`);
  }
  addChronicle(state, {
    type: 'tournament',
    importance: playerResult?.finish === 1 || tournament.circuit === 'Global' ? 5 : playerResult ? 2 : tournament.prestige >= 100 ? 4 : 2,
    title: `${champion.name} wins the ${tournament.name}`,
    text: record.narrative,
    heroIds: [championId, ...(playerResult && playerResult.heroId !== championId ? [playerResult.heroId] : [])],
    guildIds: champion.guildId ? [champion.guildId] : [],
    tags: ['tournament', tournament.circuit, 'individual'],
    tournamentRecordId: record.id,
  });
  return record;
}

function resolveAiDuel(state, tournament, heroAId, heroBId, rng) {
  const heroA = getHero(state, heroAId);
  const heroB = getHero(state, heroBId);
  if (!heroA) return heroBId;
  if (!heroB) return heroAId;
  const volatility = tournament.circuit === 'Regional' ? 12 : tournament.circuit === 'National' ? 10 : 8;
  const ratingA = heroTournamentRating(heroA, tournament, heroB.primal) + rng.int(-volatility, volatility);
  const ratingB = heroTournamentRating(heroB, tournament, heroA.primal) + rng.int(-volatility, volatility);
  const winner = ratingA >= ratingB ? heroA : heroB;
  const loser = winner.id === heroA.id ? heroB : heroA;
  ensureTournamentCareer(winner);
  ensureTournamentCareer(loser);
  winner.career.tournamentBouts += 1;
  winner.career.tournamentBoutWins += 1;
  loser.career.tournamentBouts += 1;
  winner.form = clamp(winner.form + 1, 30, 96);
  loser.form = clamp(loser.form - 1, 25, 96);
  return winner.id;
}

export function resolveIndividualRoundInPlace(state, tournament, rng, playerTactic = 'Measured', forcedPlayerResult = null) {
  const entrants = [...tournament.activeEntrants];
  const pairs = [];
  for (let i = 0; i < entrants.length / 2; i += 1) pairs.push([entrants[i], entrants[entrants.length - 1 - i]]);
  const roundSize = entrants.length;
  const roundName = roundSize === 16 ? 'Round of 16' : roundSize === 8 ? 'Quarterfinal' : roundSize === 4 ? 'Semifinal' : 'Final';
  const winners = [];
  let playerLost = false;
  let showmanshipWin = false;
  for (const [heroAId, heroBId] of pairs) {
    let winnerId;
    let chance = null;
    let tactic = null;
    const playerId = tournament.playerHeroId;
    if (playerId && (heroAId === playerId || heroBId === playerId)) {
      const player = getHero(state, playerId);
      const opponent = getHero(state, heroAId === playerId ? heroBId : heroAId);
      const tacticMod = { Measured: 1, Aggressive: 4, Defensive: 0, Showmanship: -3 }[playerTactic] ?? 1;
      const fatigueCost = forcedPlayerResult
        ? clamp(5 + (forcedPlayerResult.turns || 4) * 2, 8, 22)
        : ({ Measured: 11, Aggressive: 17, Defensive: 7, Showmanship: 13 }[playerTactic] ?? 11);
      const playerRating = heroTournamentRating(player, tournament, opponent?.primal) + tacticMod;
      const opponentRating = heroTournamentRating(opponent, tournament, player?.primal);
      chance = clamp(Math.round(100 / (1 + Math.exp(-(playerRating - opponentRating) / 7.5))), 7, 93);
      winnerId = forcedPlayerResult ? (forcedPlayerResult.playerWon ? playerId : opponent.id) : rng.next() * 100 < chance ? playerId : opponent.id;
      tactic = forcedPlayerResult ? 'Turn-based' : playerTactic;
      ensureTournamentCareer(player);
      player.career.tournamentBouts += 1;
      player.fatigue = clamp(player.fatigue + fatigueCost, 0, 100);
      player.form = clamp(player.form + (winnerId === playerId ? 2 : -4), 25, 96);
      const xpGain = Math.round(
        (winnerId === playerId ? 62 : 36) + tournament.prestige * 0.45 + (forcedPlayerResult ? Math.min(20, (forcedPlayerResult.turns || 0) * 2) : 0),
      );
      applyXpInPlace(player, xpGain, state, `${tournament.name} ${roundName.toLowerCase()}`);
      player.career.xpEarned += xpGain;
      if (winnerId === playerId) {
        player.career.tournamentBoutWins += 1;
        tournament.playerBoutWins += 1;
        if (!forcedPlayerResult && playerTactic === 'Showmanship') {
          tournament.showmanshipWins += 1;
          showmanshipWin = true;
        }
      } else playerLost = true;
      addHeroHistory(player, state, {
        type: 'tournament',
        title: `${roundName}: ${winnerId === playerId ? 'victory' : 'defeat'} at ${tournament.name}`,
        text: forcedPlayerResult
          ? `${winnerId === playerId ? 'Defeated' : 'Lost to'} ${opponent.name} after ${forcedPlayerResult.turns || '?'} tactical turns.`
          : `${winnerId === playerId ? 'Defeated' : 'Lost to'} ${opponent.name} using a ${playerTactic.toLowerCase()} approach.`,
      });
      if (opponent) {
        ensureTournamentCareer(opponent);
        opponent.career.tournamentBouts += 1;
        if (winnerId === opponent.id) opponent.career.tournamentBoutWins += 1;
      }
    } else {
      winnerId = resolveAiDuel(state, tournament, heroAId, heroBId, rng);
    }
    winners.push(winnerId);
    tournament.bracket.push({
      round: roundName,
      heroAId,
      heroAName: getHero(state, heroAId)?.name,
      heroBId,
      heroBName: getHero(state, heroBId)?.name,
      winnerId,
      winnerName: getHero(state, winnerId)?.name,
      playerBout: Boolean(tournament.playerHeroId && [heroAId, heroBId].includes(tournament.playerHeroId)),
      chance,
      tactic,
      showmanshipWin,
      combat:
        forcedPlayerResult && tournament.playerHeroId && [heroAId, heroBId].includes(tournament.playerHeroId)
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

function finishPlayerIndividualTournamentInPlace(state, tournament, actualFinish) {
  const hero = getHero(state, tournament.playerHeroId);
  if (!hero) return null;
  ensureTournamentCareer(hero);
  hero.status = 'available';
  hero.career.bestTournamentFinish = Math.min(hero.career.bestTournamentFinish || 99, actualFinish);
  if (actualFinish <= 2) {
    const prize = rollLoot(rngFor(state, `prize:${tournament.id}`), tournamentRequirements(tournament).tierIndex || 0, actualFinish === 1 ? 2 : 1);
    addItemsInPlace(state, prize);
    tournament.playerLoot = lootNames(prize);
  }
  if (actualFinish === 2) hero.career.runnerUps += 1;
  if (actualFinish === 4) hero.career.semifinals += 1;
  const fameDelta = tournamentFameDelta(
    hero,
    tournament,
    tournament.expectedFinish,
    actualFinish,
    tournament.playerBoutWins || 0,
    tournament.showmanshipWins || 0,
  );
  const prize = placementPrize(tournament, actualFinish);
  hero.renown = Math.max(0, hero.renown + fameDelta);
  hero.career.tournamentFame += Math.max(0, fameDelta);
  hero.career.prizeMoney += prize;
  state.guild.fame = Math.max(0, state.guild.fame + fameDelta);
  state.guild.crowns += prize;
  state.stats.tournamentBest = Math.min(state.stats.tournamentBest, actualFinish);
  if (tournament.initialSeed > tournament.size / 2 && actualFinish <= 4) state.stats.upsets += 1;
  return {
    heroId: hero.id,
    heroName: hero.name,
    finish: actualFinish,
    expectedFinish: tournament.expectedFinish,
    initialSeed: tournament.initialSeed,
    boutWins: tournament.playerBoutWins || 0,
    fameDelta,
    prize,
    showmanshipWins: tournament.showmanshipWins || 0,
  };
}

export function completeIndividualTournamentInPlace(state, tournament, rng, playerFinish = null) {
  // Count the edition once for every entrant. Player registration already increments this field.
  tournament.initialEntrants.forEach((heroId) => {
    const hero = getHero(state, heroId);
    if (!hero) return;
    ensureTournamentCareer(hero);
    if (heroId !== tournament.playerHeroId) {
      hero.career.tournaments += 1;
      hero.career.individualTournaments += 1;
    }
  });
  while (tournament.activeEntrants.length > 1) resolveIndividualRoundInPlace(state, tournament, rng, 'Measured');
  const championId = tournament.activeEntrants[0];
  const finalBout = [...tournament.bracket].reverse().find((bout) => bout.round === 'Final');
  const runnerUpId = finalBout ? (finalBout.heroAId === championId ? finalBout.heroBId : finalBout.heroAId) : null;
  const semifinalLosers = tournament.bracket
    .filter((bout) => bout.round === 'Semifinal')
    .map((bout) => (bout.heroAId === bout.winnerId ? bout.heroBId : bout.heroAId))
    .filter(Boolean);
  [{ id: runnerUpId, finish: 2 }, ...semifinalLosers.map((id) => ({ id, finish: 4 }))].forEach(({ id, finish }) => {
    const hero = getHero(state, id);
    if (!hero || id === tournament.playerHeroId) return;
    ensureTournamentCareer(hero);
    hero.career.bestTournamentFinish = Math.min(hero.career.bestTournamentFinish || 99, finish);
    if (finish === 2) hero.career.runnerUps += 1;
    else hero.career.semifinals += 1;
    const prize = placementPrize(tournament, finish);
    hero.career.prizeMoney += prize;
    hero.career.tournamentFame += Math.round(tournament.prestige * (finish === 2 ? 0.2 : 0.08));
    hero.renown += Math.round(tournament.prestige * (finish === 2 ? 0.12 : 0.05));
    const guild = state.rivals.find((item) => item.id === hero.guildId);
    if (guild) {
      guild.prizeMoney += prize;
      guild.seasonPoints += finish === 2 ? 5 : 2;
      guild.careerPoints += finish === 2 ? 8 : 3;
    }
  });
  tournament.status = 'completed';
  tournament.championId = championId;
  tournament.championName = getHero(state, championId)?.name || 'Unknown champion';
  tournament.finish = playerFinish;
  const playerResult = tournament.playerHeroId
    ? finishPlayerIndividualTournamentInPlace(state, tournament, playerFinish || (championId === tournament.playerHeroId ? 1 : tournament.size))
    : null;
  return recordIndividualTournamentInPlace(state, tournament, championId, playerResult);
}

export function createIndividualTournamentsInPlace(state, rng) {
  state.tournaments = INDIVIDUAL_TOURNAMENT_DEFINITIONS.filter((definition) => !definition.cadence || state.date.year % definition.cadence === 0).map(
    (definition) => {
      const location = LOCATION_BY_ID[definition.locationId];
      const tournament = {
        id: `${definition.id}-${state.date.year}`,
        definitionId: definition.id,
        kind: 'individual',
        year: state.date.year,
        name: definition.name,
        circuit: definition.circuit,
        division: definition.circuit,
        locationId: definition.locationId,
        location: location.name,
        region: location.region,
        primal: location.primal,
        month: definition.month,
        week: definition.week ?? hashString(definition.id) % 4,
        size: definition.size,
        entryFee: definition.entryFee,
        purse: definition.purse,
        prestige: definition.prestige,
        trophy: definition.trophy,
        description: definition.description,
        status: 'registration',
        playerHeroId: null,
        playerBoutWins: 0,
        showmanshipWins: 0,
        initialSeed: null,
        expectedFinish: null,
        bracket: [],
        championId: null,
        championName: null,
      };
      tournament.initialEntrants = buildIndividualTournamentField(state, rng, tournament, tournament.size);
      tournament.activeEntrants = seedEntrants(state, tournament, tournament.initialEntrants, (id) => heroTournamentRating(getHero(state, id), tournament));
      tournament.currentRoundSize = tournament.activeEntrants.length;
      return tournament;
    },
  );
}
