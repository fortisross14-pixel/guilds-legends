// @ts-check
// Seasons like a sports career mode: per-year totals (tallied in core.js),
// the record book, end-of-year awards and the season review, plus the read
// models behind the Herald (records, hall of fame, ladders, head-to-head),
// the Chronicle (mission log, past reviews) and hero Career tabs.
import { TOURNAMENTS } from '../../data/tournaments.js';
import { PATRONS, PATRON_LIST } from '../../data/patrons.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { addChronicle, getHero, noteSeasonHighlight, pushMoment, seasonOf, tallyFamily, tallyGuild, tallyHero } from './core.js';
import { patronPoints } from './charter.js';
import { getPlayerRanks, getPointsToPass, guildLadder } from './rankings.js';

export const START_YEAR = 1187;
const LADDER_KEYS = { strength: 's', legacy: 'l', official: 'o' };

// ---------------------------------------------------------------- records

export const GUILD_RECORDS = {
  seasonWins: { label: 'Most contract wins in a season', unit: 'wins' },
  winStreak: { label: 'Longest win streak', unit: 'contracts in a row' },
  richestSeason: { label: 'Richest season', unit: 'gold earned' },
  seasonTitles: { label: 'Most titles in a season', unit: 'titles' },
  bestStrength: { label: 'Best Strength rank', lower: true, prefix: '#' },
  bestLegacy: { label: 'Best Legacy rank', lower: true, prefix: '#' },
  bestOfficial: { label: 'Best Official rank', lower: true, prefix: '#' },
  fastestPromotion: { label: 'Fastest promotion', lower: true, unit: 'months' },
  biggestUpset: { label: 'Biggest upset', lower: true, unit: '% estimate' },
};

export const HERO_RECORDS = {
  careerWins: { label: 'Most career contract wins', unit: 'wins' },
  careerTitles: { label: 'Most titles', unit: 'titles' },
  highestLevel: { label: 'Highest level', prefix: 'Lv ' },
  battleKos: { label: 'Most KOs in one battle', unit: 'KOs' },
  service: { label: 'Longest service', unit: 'years' },
  goldEarned: { label: 'Most gold earned for the guild', unit: 'gold' },
};

function recordsInPlace(state) {
  state.records ||= { guild: {}, hero: {} };
  state.records.guild ||= {};
  state.records.hero ||= {};
  return state.records;
}

/**
 * Sets a record if `value` beats it. The first holder is set quietly; after
 * that a broken record (by a new holder, for hero records) gets a "Record
 * broken!" moment and joins this season's review.
 */
export function considerRecordInPlace(state, scope, key, value, who = {}) {
  const definitions = scope === 'guild' ? GUILD_RECORDS : HERO_RECORDS;
  const definition = definitions[key];
  if (!definition || !Number.isFinite(value) || value <= 0) return false;
  const book = recordsInPlace(state)[scope];
  const current = book[key];
  const better = !current || (definition.lower ? value < current.value : value > current.value);
  if (!better) return false;
  book[key] = { value, year: state.date.year, heroId: who.heroId || null, name: who.name || state.guild.name, detail: who.detail || null };
  const announce = current && (scope === 'guild' || current.heroId !== who.heroId);
  if (announce) {
    const display = `${definition.prefix || ''}${value.toLocaleString()}${definition.unit ? ` ${definition.unit}` : ''}`;
    seasonOf(state).broken.push({ scope, key, label: definition.label, display, name: book[key].name, previous: current.name });
    pushMoment(state, {
      type: 'record',
      title: 'Record broken!',
      label: definition.label,
      display,
      holder: book[key].name,
      previous: `${current.name} (${current.year})`,
    });
  }
  return true;
}

// ---------------------------------------------------------------- hooks

/** A contract was resolved: season totals, hero totals, highlights and records. */
export function afterContractInPlace(state, { mission, grade, success, heroIds, reward, estimate }) {
  const family = mission.family || 'Contract';
  tallyFamily(state, family, success ? 'won' : 'failed');
  tallyGuild(state, success ? 'won' : 'failed');
  const share = heroIds.length ? Math.round(reward / heroIds.length) : 0;
  heroIds.forEach((heroId) => {
    tallyHero(state, heroId, 'missions');
    if (success) tallyHero(state, heroId, 'wins');
    tallyHero(state, heroId, 'gold', share);
    const hero = state.heroes.find((item) => item.id === heroId);
    if (!hero) return;
    hero.career.goldForGuild = (hero.career.goldForGuild || 0) + share;
    considerRecordInPlace(state, 'hero', 'careerWins', hero.career.wins || 0, { heroId, name: hero.name });
    considerRecordInPlace(state, 'hero', 'goldEarned', hero.career.goldForGuild, { heroId, name: hero.name });
  });
  const score = (mission.difficulty || 50) + (success ? 100 - (estimate ?? 50) : (estimate ?? 50));
  noteSeasonHighlight(state, success ? 'big' : 'worst', { title: mission.title, score, detail: `${grade} · ${estimate ?? '?'}% estimate`, kind: 'contract' });
  state.streak ||= { current: 0 };
  state.streak.current = success ? state.streak.current + 1 : 0;
  if (success) {
    considerRecordInPlace(state, 'guild', 'winStreak', state.streak.current, { detail: `ending with ${mission.title}` });
    if (Number.isFinite(estimate) && estimate < 50) considerRecordInPlace(state, 'guild', 'biggestUpset', estimate, { detail: mission.title });
  }
}

/** A battle ended: wins/losses and each hero's fighting numbers; wild boss fights join the mission log. */
export function afterBattleInPlace(state, encounter, result) {
  if (!encounter || !result) return;
  tallyGuild(state, result.playerWon ? 'battlesWon' : 'battlesLost');
  // Every won battle counts toward the tournaments' combat-win entry rule.
  if (result.playerWon) state.stats.combatWins = (state.stats.combatWins || 0) + 1;
  encounter.party.forEach((unit) => {
    if (!unit.heroId) return;
    tallyHero(state, unit.heroId, 'battles');
    tallyHero(state, unit.heroId, 'kosDealt', unit.kos || 0);
    tallyHero(state, unit.heroId, 'kosTaken', unit.ko ? 1 : 0);
    tallyHero(state, unit.heroId, 'damage', unit.damageDealt || 0);
    tallyHero(state, unit.heroId, 'healing', unit.healingDone || 0);
    if (unit.kos) considerRecordInPlace(state, 'hero', 'battleKos', unit.kos, { heroId: unit.heroId, name: unit.name, detail: encounter.title });
  });
  if (encounter.sourceType === 'wild' && encounter.sourceMeta?.boss) {
    state.bossLog ||= [];
    state.bossLog.unshift({
      id: `boss-${encounter.id}`,
      year: state.date.year,
      month: state.date.month,
      title: encounter.title,
      areaId: encounter.sourceMeta.areaId,
      won: result.playerWon,
      heroIds: encounter.party.map((unit) => unit.heroId).filter(Boolean),
    });
    state.bossLog.length = Math.min(state.bossLog.length, 60);
  }
  const big = result.playerWon && encounter.enemies.some((unit) => unit.boss);
  if (big) noteSeasonHighlight(state, 'big', { title: `${encounter.title} defeated`, score: 140, detail: `${result.turns} rounds`, kind: 'boss' });
}

/** The player finished a tournament: entries, best finish, titles and the hero's bouts. */
export function afterTournamentInPlace(state, { heroId = null, heroIds = [], finish, bouts = 0 }) {
  tallyGuild(state, 'entries');
  const season = seasonOf(state);
  season.g.bestFinish = Math.min(season.g.bestFinish || 99, finish);
  const ids = heroId ? [heroId] : heroIds;
  ids.forEach((id) => {
    if (bouts) tallyHero(state, id, 'bouts', bouts);
    if (finish === 1) tallyHero(state, id, 'titles');
  });
  if (finish === 1) tallyGuild(state, 'titles');
}

/** Monthly: rank series for the season chart, best ranks, and slow-moving hero records. */
export function seasonsMonthlyInPlace(state) {
  const season = seasonOf(state);
  const ranks = getPlayerRanks(state);
  const point = { m: state.date.month, s: ranks.strength.rank, l: ranks.legacy.rank, o: ranks.official.rank };
  season.ranksStart ||= { s: point.s, l: point.l, o: point.o };
  season.series = [...(season.series || []).filter((item) => item.m !== point.m), point].slice(-12);
  season.best = { s: Math.min(season.best?.s ?? 99, point.s), l: Math.min(season.best?.l ?? 99, point.l), o: Math.min(season.best?.o ?? 99, point.o) };
  considerRecordInPlace(state, 'guild', 'bestStrength', point.s);
  considerRecordInPlace(state, 'guild', 'bestLegacy', point.l);
  considerRecordInPlace(state, 'guild', 'bestOfficial', point.o);
  if (state.guild.tierIndex > 0 && !state.records?.guild?.fastestPromotion) {
    considerRecordInPlace(state, 'guild', 'fastestPromotion', (state.date.year - START_YEAR) * 12 + state.date.month || 1);
  }
  state.heroes
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .forEach((hero) => {
      const who = { heroId: hero.id, name: hero.name };
      considerRecordInPlace(state, 'hero', 'highestLevel', hero.level || 1, who);
      considerRecordInPlace(state, 'hero', 'careerTitles', hero.career?.titles || 0, who);
      considerRecordInPlace(state, 'hero', 'service', state.date.year - (hero.joinedYear || state.date.year), who);
    });
}

// ---------------------------------------------------------------- awards and review

/** A hero's season score (MVP and awards). */
export function heroSeasonScore(stats = {}) {
  return Math.round(
    (stats.wins || 0) * 10 +
      (stats.missions || 0) * 3 +
      (stats.battles || 0) * 2 +
      (stats.kosDealt || 0) * 4 +
      (stats.titles || 0) * 25 +
      (stats.bouts || 0) * 2 +
      (stats.levels || 0) * 5 +
      (stats.damage || 0) / 150 +
      (stats.healing || 0) / 100 +
      (stats.gold || 0) / 100,
  );
}

function allHeroes(state) {
  return [...(state.heroes || []), ...(state.historicHeroes || [])];
}

function heroName(state, heroId) {
  return allHeroes(state).find((hero) => hero.id === heroId)?.name || 'A former member';
}

function awardInPlace(state, heroId, id, label, year) {
  const hero = state.heroes.find((item) => item.id === heroId);
  if (!hero) return;
  hero.awards ||= [];
  if (!hero.awards.some((award) => award.year === year && award.id === id)) hero.awards.push({ year, id, label });
}

function reactionLine(state, season) {
  const good = (season.g.won || 0) >= (season.g.failed || 0);
  const patron = [...PATRON_LIST].sort((a, b) => patronPoints(state, b.id) - patronPoints(state, a.id))[0];
  if (patron && patronPoints(state, patron.id) >= 20) {
    const lines = {
      trade: good ? 'A profitable year. The House has opened a new page in the ledger for you.' : 'A thin year for the ledgers. The House expects better.',
      temple: good ? 'Many came home because of you this year. The Dawn is grateful.' : 'A hard year. The Dawn will pray, and so should you.',
      smiths: good ? 'Good, honest work this year. The forges approve.' : 'Too much broken steel for too little. Do better.',
    };
    return { speaker: PATRONS[patron.id].rep.name, role: PATRONS[patron.id].short, text: lines[patron.id] };
  }
  const nemesis = (state.rivals || []).find((rival) => (state.nemesisIds || []).includes(rival.id));
  if (nemesis)
    return {
      speaker: nemesis.name,
      role: 'Your nemesis',
      text: good ? 'Enjoy the season. It will not last.' : 'Another season, another banner in the mud. Ours stays high.',
    };
  return {
    speaker: 'The Dunmere crier',
    role: 'Town talk',
    text: good ? `${state.guild.name} had a season people will talk about.` : `${state.guild.name} had a season people would rather forget.`,
  };
}

/**
 * Closes a season: final ranks, awards, season records and the review
 * (a sequence of cards queued as a moment and kept for the record book).
 */
export function closeSeasonInPlace(state, year) {
  const season = state.seasons?.[year];
  if (!season || season.review) return;
  const ranks = getPlayerRanks(state);
  season.ranksEnd = { s: ranks.strength.rank, l: ranks.legacy.rank, o: ranks.official.rank };
  season.ranksStart ||= season.ranksEnd;
  season.g.fame = state.guild.fame - (season.g.fameStart || 0);
  season.g.legacy = state.guild.legacy - (season.g.legacyStart || 0);
  // Every guild's rank, for season-by-season head-to-heads.
  season.ladder = Object.fromEntries(
    ['strength', 'official'].map((ladder) => [
      LADDER_KEYS[ladder],
      Object.fromEntries(
        guildLadder(state, ladder)
          .filter((row) => !row.player)
          .map((row) => [row.id, row.rank]),
      ),
    ]),
  );

  const scores = Object.entries(season.h).map(([heroId, stats]) => ({ heroId, name: heroName(state, heroId), score: heroSeasonScore(stats) }));
  scores.sort((a, b) => b.score - a.score);
  const mvp = scores[0]?.score > 0 ? scores[0] : null;
  const rookies = scores.filter(({ heroId }) => {
    const hero = allHeroes(state).find((item) => item.id === heroId);
    return hero && hero.joinedYear === year && hero.id !== state.guild.founderHeroId;
  });
  const rookie = rookies[0] || null;
  const signing =
    [...rookies].sort((a, b) => {
      const fee = (id) => allHeroes(state).find((hero) => hero.id === id)?.signedFee || 0;
      return b.score / (fee(b.heroId) / 100 + 1) - a.score / (fee(a.heroId) / 100 + 1);
    })[0] || null;
  if (mvp) awardInPlace(state, mvp.heroId, 'mvp', 'MVP', year);
  if (rookie) awardInPlace(state, rookie.heroId, 'rookie', 'Rookie of the year', year);
  if (signing) awardInPlace(state, signing.heroId, 'signing', 'Best signing', year);

  considerRecordInPlace(state, 'guild', 'seasonWins', season.g.won || 0, { detail: `${year} season` });
  considerRecordInPlace(state, 'guild', 'richestSeason', season.g.earned || 0, { detail: `${year} season` });
  considerRecordInPlace(state, 'guild', 'seasonTitles', season.g.titles || 0, { detail: `${year} season` });

  const spent = Object.values(season.spent || {}).reduce((sum, value) => sum + value, 0);
  season.review = {
    year,
    record: { won: season.g.won || 0, failed: season.g.failed || 0, battlesWon: season.g.battlesWon || 0, battlesLost: season.g.battlesLost || 0 },
    titles: season.g.titles || 0,
    specialTitles: (state.guild.specialTitles || []).filter((title) => title.year === year).map((title) => title.name),
    bestFinish: season.g.bestFinish && season.g.bestFinish < 99 ? season.g.bestFinish : null,
    earned: season.g.earned || 0,
    spent,
    spentBy: season.spent,
    fame: season.g.fame,
    legacy: season.g.legacy,
    recruits: season.g.recruits || 0,
    lost: (season.g.released || 0) + (season.g.poached || 0) + (season.g.deaths || 0),
    mvp: mvp ? { ...mvp, stats: season.h[mvp.heroId] } : null,
    rookie,
    signing,
    big: season.big,
    worst: season.worst,
    ranksStart: season.ranksStart,
    ranksEnd: season.ranksEnd,
    best: season.best || season.ranksEnd,
    series: season.series,
    broken: season.broken.slice(0, 8),
    reaction: reactionLine(state, season),
  };
  pushMoment(state, { type: 'seasonReview', year, title: `The ${year} season` });
  addChronicle(state, {
    type: 'season',
    importance: 3,
    title: `The ${year} season: ${season.review.record.won}–${season.review.record.failed}`,
    text: `${mvp ? `${mvp.name} was the MVP.` : 'No hero stood out.'} Strength #${season.ranksStart.s} → #${season.ranksEnd.s}.`,
    tags: ['season'],
  });
  // The next season starts from today's ranks.
  const next = seasonOf(state, year + 1);
  next.ranksStart ||= { ...season.ranksEnd };
}

// ---------------------------------------------------------------- read models

/** Closed seasons (newest first) with a short line each. */
export function getSeasonList(state) {
  return Object.values(state.seasons || {})
    .filter((season) => season.review)
    .sort((a, b) => b.year - a.year)
    .map((season) => ({ year: season.year, record: season.review.record, mvp: season.review.mvp?.name || null, ranksEnd: season.review.ranksEnd }));
}

export function getSeasonReview(state, year) {
  return state.seasons?.[year]?.review || null;
}

function displayRecord(definition, record) {
  return `${definition.prefix || ''}${record.value.toLocaleString()}${definition.unit ? ` ${definition.unit}` : ''}`;
}

/** The record book: guild and hero records, and how the best rivals compare. */
export function getRecordBook(state) {
  const book = state.records || { guild: {}, hero: {} };
  const rivals = [...(state.rivals || [])];
  const topTitles = rivals.sort((a, b) => (b.titles || 0) - (a.titles || 0))[0];
  const strongest = guildLadder(state, 'strength').find((row) => !row.player);
  const ourTitles = (state.stats?.tournamentsWon || 0);
  return {
    guild: Object.entries(GUILD_RECORDS).map(([key, definition]) => ({
      key,
      label: definition.label,
      record: book.guild?.[key] || null,
      display: book.guild?.[key] ? displayRecord(definition, book.guild[key]) : '—',
    })),
    hero: Object.entries(HERO_RECORDS).map(([key, definition]) => ({
      key,
      label: definition.label,
      record: book.hero?.[key] || null,
      display: book.hero?.[key] ? displayRecord(definition, book.hero[key]) : '—',
    })),
    rivals: [
      topTitles ? `${topTitles.name} holds the most titles in the world with ${topTitles.titles || 0}. ${state.guild.name} has ${ourTitles}.` : null,
      strongest ? `${strongest.name} tops the Strength ladder.` : null,
    ].filter(Boolean),
  };
}

/** A hero's career by season, plus timeline, contracts and awards. Works for any hero. */
export function getHeroCareer(state, heroId) {
  const hero = allHeroes(state).find((item) => item.id === heroId) || getHero(state, heroId) || null;
  const years = Object.values(state.seasons || {})
    .filter((season) => season.h?.[heroId])
    .sort((a, b) => a.year - b.year)
    .map((season) => ({ year: season.year, ...season.h[heroId], score: heroSeasonScore(season.h[heroId]) }));
  const keys = ['missions', 'wins', 'battles', 'kosDealt', 'kosTaken', 'damage', 'healing', 'bouts', 'titles', 'injuries', 'levels', 'gold'];
  const total = Object.fromEntries(keys.map((key) => [key, years.reduce((sum, row) => sum + (row[key] || 0), 0)]));
  const contracts = (state.missionHistory || []).filter((record) => (record.team || []).some((member) => member.heroId === heroId)).slice(0, 30);
  const records = [
    ...Object.entries(state.records?.hero || {})
      .filter(([, record]) => record.heroId === heroId)
      .map(([key, record]) => ({ label: HERO_RECORDS[key]?.label || key, display: displayRecord(HERO_RECORDS[key] || {}, record), year: record.year })),
  ];
  return { hero, years, total, contracts, awards: hero?.awards || [], records, timeline: (hero?.history || []).slice(0, 40) };
}

/** The mission log: every contract, wild boss fight and tournament run, newest first, with filter options. */
export function getMissionLog(state) {
  const names = (ids) => ids.map((id) => heroName(state, id));
  const contracts = (state.missionHistory || []).map((record) => ({
    id: record.id,
    kind: 'contract',
    year: record.completedYear,
    month: record.completedMonth,
    title: record.title,
    family: record.family,
    locationId: record.locationId,
    locationName: record.locationName,
    outcome: ['Defeat', 'Catastrophic'].includes(record.grade) ? 'failed' : 'won',
    grade: record.grade,
    heroIds: (record.team || []).map((member) => member.heroId),
    heroes: (record.team || []).map((member) => member.name),
    report: { kind: 'mission', id: record.id },
  }));
  const bosses = (state.bossLog || []).map((entry) => ({
    id: entry.id,
    kind: 'boss',
    year: entry.year,
    month: entry.month,
    title: entry.title,
    family: 'Boss fight',
    locationId: entry.areaId,
    locationName: String(entry.areaId || '').replace(/-/g, ' '),
    outcome: entry.won ? 'won' : 'failed',
    grade: entry.won ? 'Victory' : 'Defeat',
    heroIds: entry.heroIds,
    heroes: names(entry.heroIds),
    report: null,
  }));
  const tournaments = (state.tournamentHistory || [])
    .filter((record) => record.playerResult)
    .map((record) => {
      const heroIds = record.team ? record.team.map((member) => member.heroId) : [record.playerResult.heroId].filter(Boolean);
      return {
        id: record.id,
        kind: 'tournament',
        year: record.year,
        month: 8,
        title: record.title,
        family: 'Tournament',
        locationId: record.location,
        locationName: LOCATION_BY_ID[record.location]?.name || String(record.location || ''),
        outcome: record.playerResult.finish === 1 ? 'won' : 'failed',
        grade: record.playerResult.finish === 1 ? 'Champion' : `Top ${record.playerResult.finish}`,
        heroIds,
        heroes: names(heroIds),
        report: { kind: 'tournament', id: record.id },
      };
    });
  const entries = [...contracts, ...bosses, ...tournaments].sort((a, b) => b.year - a.year || b.month - a.month);
  return {
    entries,
    years: [...new Set(entries.map((entry) => entry.year))].sort((a, b) => b - a),
    families: [...new Set(entries.map((entry) => entry.family))].sort(),
    locations: [...new Map(entries.map((entry) => [entry.locationId, LOCATION_BY_ID[entry.locationId]?.name || entry.locationName])).entries()],
    heroes: [...new Map(entries.flatMap((entry) => entry.heroIds.map((id, index) => [id, entry.heroes[index] || heroName(state, id)]))).entries()],
  };
}

/** Retired and fallen heroes who earned a place: awards, a record, or a strong career. */
export function getHallOfFame(state) {
  const departed = allHeroes(state).filter((hero) => ['retired', 'dead'].includes(hero.status) || hero.archived);
  return departed
    .map((hero) => {
      const career = getHeroCareer(state, hero.id);
      const best = [...career.years].sort((a, b) => b.score - a.score)[0] || null;
      const careerScore =
        (hero.career?.wins || 0) * 5 +
        (hero.career?.titles || 0) * 30 +
        (hero.career?.missions || 0) * 2 +
        (hero.awards?.length || 0) * 20 +
        career.records.length * 15;
      return {
        hero,
        best,
        awards: hero.awards || [],
        records: career.records,
        careerScore,
        ending: hero.status === 'dead' ? 'Fell in service' : 'Retired',
        inducted: careerScore >= 60 || (hero.awards || []).length > 0 || career.records.length > 0,
      };
    })
    .filter((entry) => entry.inducted)
    .sort((a, b) => b.careerScore - a.careerScore);
}

/** Each ladder: season-by-season ranks, best ever, current rank and the points to the next guild. */
export function getLadderHistory(state) {
  const seasons = Object.values(state.seasons || {}).sort((a, b) => a.year - b.year);
  const ranks = getPlayerRanks(state);
  return Object.entries(LADDER_KEYS).map(([ladder, key]) => ({
    ladder,
    current: ranks[ladder],
    best: state.records?.guild?.[`best${ladder[0].toUpperCase()}${ladder.slice(1)}`]?.value || ranks[ladder].rank,
    toPass: getPointsToPass(state, ladder),
    seasons: seasons
      .map((season) => ({ year: season.year, end: season.ranksEnd?.[key] ?? season.series?.at(-1)?.[key] ?? null, best: season.best?.[key] ?? null }))
      .filter((row) => row.end),
  }));
}

/** Head-to-head with a rival guild: rivalry numbers and season-by-season ranks side by side. */
export function getHeadToHead(state, rivalId) {
  const rival = (state.rivals || []).find((item) => item.id === rivalId);
  if (!rival) return null;
  const rivalry = state.rivalries?.[rivalId] || {};
  const strength = guildLadder(state, 'strength');
  const official = guildLadder(state, 'official');
  const seasons = Object.values(state.seasons || {})
    .filter((season) => season.ladder)
    .sort((a, b) => a.year - b.year)
    .map((season) => ({
      year: season.year,
      ours: { s: season.ranksEnd?.s, o: season.ranksEnd?.o },
      theirs: { s: season.ladder.s?.[rivalId], o: season.ladder.o?.[rivalId] },
    }));
  return {
    rival,
    nemesis: (state.nemesisIds || []).includes(rivalId),
    now: {
      ours: { s: strength.find((row) => row.player)?.rank, o: official.find((row) => row.player)?.rank },
      theirs: { s: strength.find((row) => row.id === rivalId)?.rank, o: official.find((row) => row.id === rivalId)?.rank },
    },
    rivalry: {
      boutsWon: rivalry.boutsWon || 0,
      boutsLost: rivalry.boutsLost || 0,
      challengesWon: rivalry.challengesWon || 0,
      challengesLost: rivalry.challengesLost || 0,
      contractsTaken: rivalry.contractsTaken || 0,
      poached: (rivalry.poachedFromUs || 0) + (rivalry.poachedFromThem || 0),
      score: rivalry.score || 0,
    },
    titles: { ours: (state.stats?.tournamentsWon || 0), theirs: rival.titles || 0 },
    seasons,
  };
}

// ---------------------------------------------------------------- the sports desk (docs/design/PILLARS.md, Pillar 2)
// Read models over state.circuit (filed by guildTournaments.js for every tournament, AI ones too).

const guildName = (state, id) => (id === 'player' ? state.guild.name : state.rivals.find((rival) => rival.id === id)?.name || 'Unknown guild');
const pct = (won, bouts) => (bouts ? Math.round((won / bouts) * 100) : 0);
const finishLabel = (place) => (place === 1 ? 'champion' : place === 2 ? 'final' : place <= 4 ? 'semifinal' : place <= 8 ? 'quarterfinal' : '—');

/** A guild's record by year (tournaments, bouts, won, %, titles, best), its totals, and its best and worst opponents. */
export function getGuildRecord(state, guildId = 'player') {
  const circuit = state.circuit || { guildYears: {}, byTournament: {}, meetings: {} };
  const years = Object.entries(circuit.guildYears[guildId] || {})
    .map(([year, row]) => {
      const best = Math.min(99, ...Object.values(circuit.byTournament).map((event) => event[guildId]?.years?.[year] ?? 99));
      return { year: Number(year), ...row, pct: pct(row.won, row.bouts), best: finishLabel(best) };
    })
    .sort((a, b) => b.year - a.year);
  const totals = years.reduce((sum, row) => ({ entries: sum.entries + row.entries, bouts: sum.bouts + row.bouts, won: sum.won + row.won, titles: sum.titles + row.titles, finals: sum.finals + row.finals }), { entries: 0, bouts: 0, won: 0, titles: 0, finals: 0 });
  const opponents = Object.entries(circuit.meetings)
    .filter(([key]) => key.split('|').includes(guildId))
    .map(([key, list]) => {
      const other = key.split('|').find((id) => id !== guildId) || guildId;
      const won = list.filter((meeting) => meeting.winnerId === guildId).length;
      return { id: other, name: guildName(state, other), won, lost: list.length - won, last: list[0] };
    })
    .sort((a, b) => b.won + b.lost - (a.won + a.lost));
  return { years, totals: { ...totals, pct: pct(totals.won, totals.bouts) }, opponents };
}

/** An arena's roll of champions: per event held there, winners by year, most titles, the record, and the guild's finishes there. */
export function getArenaRoll(state, locationId) {
  const circuit = state.circuit || { byTournament: {} };
  return TOURNAMENTS.filter((definition) => definition.locationId === locationId).map((definition) => {
    const record = state.titleRecords?.[definition.id] || {};
    const counts = Object.entries(circuit.byTournament[definition.id] || {})
      .map(([id, row]) => ({ id, name: guildName(state, id), titles: row.titles }))
      .filter((row) => row.titles)
      .sort((a, b) => b.titles - a.titles);
    const mine = circuit.byTournament[definition.id]?.player;
    return {
      definition,
      winners: (record.winners || []).slice(0, 10),
      mostTitles: counts[0] || null,
      recordHolder: record.recordHolderName ? { name: record.recordHolderName, wins: record.recordWins } : null,
      you: mine ? Object.entries(mine.years).map(([year, place]) => ({ year: Number(year), finish: finishLabel(place) })).sort((a, b) => b.year - a.year) : [],
      yourRecord: mine ? { bouts: mine.bouts, won: mine.won, titles: mine.titles } : null,
    };
  });
}

/** The guild's (or a rival's) last bouts, newest first: 'W' or 'L'. */
export function getForm(state, guildId = 'player', count = 5) {
  return (state.tournamentHistory || [])
    .flatMap((record) => [...(record.bracket || [])].reverse().filter((bout) => [bout.guildAId, bout.guildBId].includes(guildId)).map((bout) => (bout.winnerId === guildId ? 'W' : 'L')))
    .slice(0, count);
}

/**
 * The Herald's Gazette, this month's issue: a headline from the latest tournament, the standings,
 * the form guide (the guild and its great rival), what's coming, and the guild's own line.
 */
export function getGazette(state) {
  const months = ['Deepwinter', 'Thawrise', 'Rainmoot', 'Greengale', 'Highsun', 'Brightwane', 'Harvestcall', 'Amberfall', 'Mistmarch', 'Redleaf', 'Frostwane', 'Longnight'];
  const issue = (state.date.year - 1187) * 12 + state.date.month - 4;
  const latest = (state.tournamentHistory || [])[0] || null;
  const mine = (state.tournamentHistory || []).find((record) => record.playerResult) || null;
  const headline = latest
    ? latest.championGuildId === 'player'
      ? `${state.guild.name.toUpperCase()} TAKE THE ${latest.title.toUpperCase()}!`
      : `${latest.championName.toUpperCase()} WIN THE ${latest.title.toUpperCase()}`
    : 'THE SEASON AWAITS ITS FIRST CHAMPION';
  const final = latest?.bracket?.find((bout) => bout.round === 'Final');
  const lead = latest
    ? `${latest.championName} won the ${latest.title} in ${LOCATION_BY_ID[latest.location]?.name || latest.location || 'the ring'}${final ? `, beating ${final.winnerId === final.guildAId ? final.guildBName : final.guildAName} in the final` : ''}.${latest.playerResult ? ` ${state.guild.name} reached the ${finishLabel(latest.playerResult.finish)}.` : ''}`
    : 'No tournament has been fought yet this season. The heralds are sharpening their quills.';
  const great = (state.guild?.standing?.honorBand || 'neutral') === 'wicked' ? 'rival-dawn' : 'rival-thistle';
  const rival = state.rivals.find((item) => item.storyId === great) || null;
  const thisYear = state.circuit?.guildYears?.player?.[state.date.year] || null;
  return {
    issue: Math.max(1, issue),
    date: `${months[state.date.month]} ${state.date.year}`,
    headline,
    lead,
    standings: guildLadder(state, 'official').slice(0, 8).map((row, index) => ({ rank: index + 1, id: row.id, name: row.name, points: Math.round(row.official || 0), titles: row.titles || 0, player: row.player })),
    form: [
      { name: state.guild.name, form: getForm(state, 'player') },
      ...(rival ? [{ name: rival.name, form: getForm(state, rival.id), rival: true }] : []),
    ],
    upcoming: (state.tournaments || [])
      .filter((tournament) => tournament.status !== 'completed')
      .sort((a, b) => a.month - b.month || (a.week || 0) - (b.week || 0))
      .slice(0, 4)
      .map((tournament) => ({ id: tournament.id, name: tournament.name, where: LOCATION_BY_ID[tournament.locationId]?.name, when: months[tournament.month], circuit: tournament.circuit })),
    yours: thisYear ? `${thisYear.entries} tournament${thisYear.entries === 1 ? '' : 's'}, ${thisYear.bouts} bouts, ${thisYear.won} won (${pct(thisYear.won, thisYear.bouts)}%), ${thisYear.titles} title${thisYear.titles === 1 ? '' : 's'}.` : 'No tournaments for the guild yet this year.',
    lastYours: mine ? `${mine.title} ${mine.year}: ${finishLabel(mine.playerResult.finish)}.` : null,
  };
}
