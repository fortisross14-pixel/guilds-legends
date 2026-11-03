// @ts-check
// Primitives (clone, RNG, ids), chronicle/history helpers, roster and guild queries.
import { MONTHS, TIERS } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { BRANCH_RULES } from '../legacy.js';
import { HALL_PURCHASE, HALL_STAGES, RENTED_ROOM, STAGE_RULES, trainingDrills } from '../../data/rooms.js';
import { patronAtLeast } from './charter.js';

export const SCHEMA_VERSION = 15;

export const MAX_MOMENTS = 12;
export const WEEKS_PER_MONTH = 4;

export const DAYS_PER_WEEK = 7;

/** The guild's home town: its hall is the only place to rest freely. */
export const HOME_LOCATION_ID = 'dunmere';

export const MAX_CHRONICLE = 900;

export const MAX_HERO_HISTORY = 80;

export const MAX_HEROES = 300;

export const MAX_MISSION_HISTORY = 500;

export const MAX_TOURNAMENT_HISTORY = 260;

export const MAX_WORLD_HERO_HISTORY = 18;

export const MAX_TITLE_HISTORY = 120;

export function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seed) {
  let state = seed >>> 0 || 1;
  return {
    next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    chance(probability) {
      return this.next() < probability;
    },
    getState() {
      return state >>> 0;
    },
  };
}

export function rngFor(state, salt = '') {
  const rng = makeRng((state.rngState ^ hashString(`${salt}:${state.date.year}:${state.date.month}:${state.date.week || 0}`)) >>> 0);
  return rng;
}

export function commitRng(state, rng) {
  state.rngState = rng.getState();
}

export function uid(prefix, rng) {
  // IDs are RNG-derived so identical campaign seeds stay reproducible across runs.
  // Keep one RNG draw per ID so identity generation does not alter simulation pacing.
  const roll = Math.floor(rng.next() * 1e15);
  return `${prefix}-${roll.toString(36)}`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function tierIndexByName(name) {
  const aliases = { Local: 'Regional', Continental: 'Global', World: 'Global', 'Mythic Legacy': 'Global' };
  const normalized = aliases[name] || name;
  return Math.max(
    0,
    TIERS.findIndex((tier) => tier.id === normalized),
  );
}

export function dateLabel(state) {
  return `${MONTHS[state.date.month]} ${state.date.year}`;
}

export function addChronicle(state, event) {
  const record = {
    id: event.id || `event-${state.date.year}-${state.date.month}-${state.stats.eventSerial++}`,
    year: state.date.year,
    month: state.date.month,
    date: dateLabel(state),
    type: event.type || 'news',
    importance: event.importance ?? 1,
    title: event.title,
    facts: event.facts || {},
    text: event.text || '',
    heroIds: event.heroIds || [],
    guildIds: event.guildIds || [],
    tags: event.tags || [],
    missionRecordId: event.missionRecordId || null,
    tournamentRecordId: event.tournamentRecordId || null,
  };
  state.chronicle.unshift(record);
  if (state.chronicle.length > MAX_CHRONICLE) {
    state.chronicle.length = MAX_CHRONICLE;
  }
  return record;
}

export function addHeroHistory(hero, state, entry) {
  hero.history.unshift({
    year: state.date.year,
    month: state.date.month,
    date: dateLabel(state),
    ...entry,
  });
  if (hero.history.length > MAX_HERO_HISTORY) hero.history.length = MAX_HERO_HISTORY;
}

export function campaignMonthSerial(state) {
  return state.date.year * 12 + state.date.month;
}

export function ensureTournamentCareer(hero) {
  hero.career ||= {};
  hero.career.individualTournaments ||= 0;
  hero.career.tournamentBouts ||= 0;
  hero.career.tournamentBoutWins ||= 0;
  hero.career.individualTitles ||= 0;
  hero.career.guildTitles ||= 0;
  hero.career.runnerUps ||= 0;
  hero.career.semifinals ||= 0;
  hero.career.bestTournamentFinish ||= 99;
  hero.career.titleWins ||= {};
  hero.career.prizeMoney ||= 0;
  hero.career.tournamentFame ||= 0;
  hero.career.artifactPrestige ||= 0;
  hero.specializations ||= { tournament: 0, missions: 0, diplomacy: 0, exploration: 0 };
  return hero;
}

export function getWorldHeroes(state, includeHistoric = true) {
  const active = (state.rivals || []).flatMap((rival) => [rival.star, ...(rival.members || [])]).filter(Boolean);
  const free = state.freeAgents || [];
  return includeHistoric ? [...active, ...free, ...(state.worldHistoricHeroes || [])] : [...active, ...free];
}

export function getHero(state, heroId) {
  return (
    state.heroes.find((hero) => hero.id === heroId) ||
    state.historicHeroes.find((hero) => hero.id === heroId) ||
    getWorldHeroes(state, true).find((hero) => hero.id === heroId) ||
    null
  );
}

export function getGuild(state, guildId) {
  if (guildId === 'player') return { ...state.guild, id: 'player', player: true };
  return state.rivals.find((guild) => guild.id === guildId) || null;
}

export function getHeroGuildName(state, hero) {
  if (!hero) return 'Unknown';
  if (hero.guildId === 'player' || state.heroes.some((item) => item.id === hero.id) || state.historicHeroes.some((item) => item.id === hero.id))
    return state.guild.name;
  const rival = state.rivals.find((guild) => guild.id === hero.guildId);
  return rival?.name || hero.guildName || 'Free agent';
}

// ---- The guild's home (src/data/rooms.js; actions in hall.js) ----

/** Level of a built room (0 when not built). */
export function roomLevel(state, roomId) {
  return state.guild?.hall?.rooms?.[roomId] || 0;
}

/** Beds are the only roster limit: rented beds, the hall's dormitory corner and bunk rooms. */
export function bedCount(state) {
  const hall = state.guild?.hall || {};
  return (hall.rentedBeds || 0) + (hall.owned ? HALL_PURCHASE.beds : 0) + roomLevel(state, 'bunks') * 2;
}

export function freeBeds(state) {
  return bedCount(state) - activeHeroCount(state);
}

// ---- Season stats: per-year totals for the guild and each hero (seasons.js closes them) ----
// Kept small: totals only, never copies of events.

/** This year's season record (created on first use). */
export function seasonOf(state, year = state.date.year) {
  state.seasons ||= {};
  state.seasons[year] ||= { year, g: { fameStart: state.guild.fame, legacyStart: state.guild.legacy }, fam: {}, spent: {}, h: {}, series: [], broken: [], big: null, worst: null, review: null };
  return state.seasons[year];
}

/** Adds to a guild total for the season (contracts, battles, titles, recruits, losses…). */
export function tallyGuild(state, key, amount = 1) {
  const season = seasonOf(state);
  season.g[key] = (season.g[key] || 0) + amount;
}

/** Contracts by family: taken / won / failed. */
export function tallyFamily(state, family, key) {
  const season = seasonOf(state);
  season.fam[family] ||= {};
  season.fam[family][key] = (season.fam[family][key] || 0) + 1;
}

/** Gold spent by category (wages, hall, shop, recruits, travel, patrons, other). */
export function tallySpend(state, category, amount) {
  if (!(amount > 0)) return;
  const season = seasonOf(state);
  season.spent[category] = (season.spent[category] || 0) + Math.round(amount);
}

/** Adds to a hero's season total (missions, wins, battles, KOs, damage, healing, bouts, titles, injuries, levels, gold). */
export function tallyHero(state, heroId, key, amount = 1) {
  if (!heroId || !amount) return;
  const season = seasonOf(state);
  season.h[heroId] ||= {};
  season.h[heroId][key] = (season.h[heroId][key] || 0) + amount;
}

/** Keeps the season's biggest win or worst defeat ({ title, score, detail }). */
export function noteSeasonHighlight(state, kind, entry) {
  const season = seasonOf(state);
  if (!season[kind] || entry.score > season[kind].score) season[kind] = { ...entry, year: state.date.year, month: state.date.month };
}

/** Gold the guild earns (contracts, battles, finds): counted for the Richest path and the season. */
export function earnGoldInPlace(state, amount) {
  if (!amount) return;
  state.guild.crowns += amount;
  if (amount > 0) {
    state.stats.goldEarned = (state.stats.goldEarned || 0) + amount;
    tallyGuild(state, 'earned', amount);
  }
}

/** Items the guild chest holds (the armory adds racks and a store). */
export function chestCapacity(state) {
  return RENTED_ROOM.chest + (roomLevel(state, 'armory') ? 20 : 0) + (patronAtLeast(state, 'smiths', 'partner') ? 10 : 0);
}

/** Titles won, artifacts held and bosses defeated: what the Trophy hall displays. */
export function trophyCount(state) {
  const wildBosses = Object.values(state.world?.exploration?.wild || {}).reduce((sum, area) => sum + Math.min(1, area.bosses || 0), 0);
  return (state.stats?.individualTournamentWins || 0) + (state.stats?.guildTournamentWins || 0) + (state.artifacts?.length || 0) + (state.defeatedBosses?.length || 0) + wildBosses;
}

// Monthly activities that need a room. Rest and exhibitions work anywhere; guild duty needs the hall.
const ACTIVITY_ROOM = { Training: 'training', Infirmary: 'infirmary', Scouting: 'scouts' };

/** True when a monthly activity can be chosen: its room is built. */
export function activityAvailable(state, activity) {
  if (activity === 'Guild Duty') return Boolean(state.guild?.hall?.owned);
  const room = ACTIVITY_ROOM[activity];
  return room ? roomLevel(state, room) > 0 : ['Rest', 'Public Exhibition'].includes(activity);
}

/** Training drills the training ground offers at its level. */
export function availableDrills(state) {
  return trainingDrills(roomLevel(state, 'training'));
}

/** Hall stage: rented room → empty hall → working hall → renowned hall. */
export function hallStage(state) {
  const hall = state.guild?.hall || {};
  if (!hall.owned) return HALL_STAGES[0];
  const levels = Object.values(hall.rooms || {});
  const built = levels.filter((level) => level > 0).length;
  const total = levels.reduce((sum, level) => sum + level, 0);
  if (built >= STAGE_RULES.renowned.rooms && total >= STAGE_RULES.renowned.levels) return HALL_STAGES[3];
  if (built >= STAGE_RULES.working.rooms) return HALL_STAGES[2];
  return HALL_STAGES[1];
}

export function activeHeroCount(state) {
  return state.heroes.filter((hero) => !['retired', 'dead'].includes(hero.status)).length;
}

export function branchCapacity(state) {
  if ((state.guild?.tierIndex || 0) < 1) return 0;
  return state.guild.tierIndex >= 2 ? BRANCH_RULES.Global.max : BRANCH_RULES.National.max;
}

export function operationalLocationIds(state) {
  return new Set([
    state.world?.currentLocationId || 'dunmere',
    ...(state.guild?.branches || []).filter((branch) => branch.active !== false).map((branch) => branch.locationId),
  ]);
}

export function getGuildmaster(state) {
  return getHero(state, state.guild?.currentGuildmasterHeroId || state.guild?.founderHeroId);
}

// True when every player hero is dead or retired: the campaign cannot act
// until the guild is refounded.
export function isGuildDefunct(state) {
  return !state.heroes.some((hero) => !['dead', 'retired'].includes(hero.status));
}

// The hero shown as the player's public face: the current guildmaster while
// active, otherwise the strongest active hero.
export function getGuildStar(state) {
  const isActive = (hero) => hero && !['dead', 'retired'].includes(hero.status);
  const guildmaster = state.heroes.find((hero) => hero.id === state.guild?.currentGuildmasterHeroId);
  if (isActive(guildmaster)) return guildmaster;
  return [...state.heroes].filter(isActive).sort((a, b) => b.power - a.power)[0] || null;
}

export function getCurrentLocation(state) {
  return LOCATION_BY_ID[state.world?.currentLocationId || 'dunmere'] || LOCATION_BY_ID.dunmere;
}

export function partyCapacity(state) {
  return 1 + Math.min(2, state.guild.tierIndex);
}

export function appointmentHolder(state, appointmentId) {
  const heroId = state.guild.appointments?.[appointmentId];
  const hero = heroId ? getHero(state, heroId) : null;
  return hero && !['dead', 'retired'].includes(hero.status) ? hero : null;
}

export function clearHeroAppointmentInPlace(state, hero) {
  Object.entries(state.guild.appointments || {}).forEach(([appointmentId, heroId]) => {
    if (heroId === hero.id) delete state.guild.appointments[appointmentId];
  });
  hero.appointment = null;
}

export function compactHero(hero) {
  return {
    id: hero.id,
    name: hero.name,
    classId: hero.classId,
    primal: hero.primal,
    rarity: hero.rarity,
    level: hero.level,
    xp: hero.xp,
    age: hero.age,
    status: hero.status,
    power: hero.power,
    potential: hero.potential,
    renown: hero.renown,
    legacy: hero.legacy,
    dream: hero.dream,
    flaw: hero.flaw,
    origin: hero.origin,
    relationships: (hero.relationships || []).slice(0, 12),
    mentorId: hero.mentorId || null,
    apprenticeIds: (hero.apprenticeIds || []).slice(0, 8),
    ambitions: (hero.ambitions || []).slice(0, 6),
    artifactIds: (hero.artifactIds || []).slice(0, 8),
    artifactPowerBonus: hero.artifactPowerBonus || 0,
    joinedYear: hero.joinedYear,
    retiredYear: hero.retiredYear,
    deathYear: hero.deathYear,
    career: hero.career,
    history: hero.history.slice(0, 30),
  };
}

export function getReport(state, reference) {
  if (!reference) return null;
  const id = typeof reference === 'string' ? reference : reference.id;
  const explicitKind = typeof reference === 'string' ? null : reference.kind;
  if (explicitKind === 'tournament') return state.tournamentHistory?.find((record) => record.id === id) || null;
  if (explicitKind === 'mission') return state.missionHistory?.find((record) => record.id === id) || null;
  return state.tournamentHistory?.find((record) => record.id === id) || state.missionHistory?.find((record) => record.id === id) || null;
}

/** Hooks that run at the end of every engine action (the story registers one). */
const FINALIZE_HOOKS = [];
export function onFinalize(hook) {
  if (!FINALIZE_HOOKS.includes(hook)) FINALIZE_HOOKS.push(hook);
}

export function finalize(state) {
  FINALIZE_HOOKS.forEach((hook) => hook(state));
  state.lastPlayedAt = new Date().toISOString();
  state.guild.tier = TIERS[state.guild.tierIndex]?.id || state.guild.tier;
  state.notifications = state.notifications.slice(-12);
  return state;
}

/**
 * Queues a reward moment for the UI (victory, levelUp, recruit). Moments are
 * presentation only; they never block time.
 */
export function pushMoment(state, moment) {
  state.moments ||= [];
  state.moments.push({
    id: `moment-${state.date.year}-${state.date.month}-${state.moments.length}-${moment.type}-${moment.heroId || moment.title || ''}`,
    ...moment,
  });
  if (state.moments.length > MAX_MOMENTS) state.moments.splice(0, state.moments.length - MAX_MOMENTS);
}

/** Absolute week number for a { year, month, week } date (week 0–3). */
export function dateWeekSerial(date) {
  return (date.year * 12 + date.month) * WEEKS_PER_MONTH + (date.week || 0);
}

export function campaignWeekSerial(state) {
  return dateWeekSerial(state.date);
}

export function dateFromWeekSerial(serial) {
  const monthSerial = Math.floor(serial / WEEKS_PER_MONTH);
  return { year: Math.floor(monthSerial / 12), month: monthSerial % 12, week: serial % WEEKS_PER_MONTH };
}

/** Days since year 0 (7 days a week, 4 weeks a month). */
export function dateDaySerial(date) {
  return dateWeekSerial(date) * DAYS_PER_WEEK + (date.day || 0);
}

export function campaignDaySerial(state) {
  return dateDaySerial(state.date);
}

export function dateFromDaySerial(serial) {
  return { ...dateFromWeekSerial(Math.floor(serial / DAYS_PER_WEEK)), day: serial % DAYS_PER_WEEK };
}

/** "3 days" or "2 weeks" for a span of days. */
export function spanLabel(days) {
  if (days > 0 && days % DAYS_PER_WEEK === 0) return `${days / DAYS_PER_WEEK} week${days === DAYS_PER_WEEK ? '' : 's'}`;
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** True when the guild stands in its home town (not on the road, not in the wild). */
export function atHome(state) {
  return !state.world?.activeTravel && !state.world?.wildAreaId && (state.world?.currentLocationId || HOME_LOCATION_ID) === HOME_LOCATION_ID;
}

/**
 * Heroes travelling with the player while away from home: the main party if
 * set, otherwise the founder and the strongest fit heroes (up to four).
 * Everyone else stays at the hall and keeps to their task. `evenAtHome`
 * returns who would set out from home (travel quotes).
 */
export function travellingPartyIds(state, evenAtHome = false) {
  if (!evenAtHome && atHome(state)) return [];
  const fit = (hero) => hero && ['available', 'injured'].includes(hero.status) && !hero.branchId;
  const main = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter(fit);
  if (main.length) return main.slice(0, 4).map((hero) => hero.id);
  const founder = state.heroes.find((hero) => hero.id === state.guild.founderHeroId && fit(hero));
  const others = state.heroes.filter((hero) => fit(hero) && hero !== founder && hero.status === 'available').sort((a, b) => b.power - a.power);
  return [founder, ...others].filter(Boolean).slice(0, 4).map((hero) => hero.id);
}

export const MAX_NEWS = 60;

/** Minor world events go to the News feed instead of a pop-up. */
export function pushNewsInPlace(state, item) {
  state.news ||= [];
  state.news.unshift({
    id: `news-${campaignWeekSerial(state)}-${state.news.length}`,
    week: campaignWeekSerial(state),
    date: dateLabel(state),
    tone: 'neutral',
    ...item,
  });
  if (state.news.length > MAX_NEWS) state.news.length = MAX_NEWS;
  state.newsUnread = (state.newsUnread || 0) + 1;
}
