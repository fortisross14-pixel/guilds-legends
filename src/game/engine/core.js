// @ts-check
// Primitives (clone, RNG, ids), chronicle/history helpers, roster and guild queries.
import { MONTHS, ONBOARDING_STEPS, TIERS } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { BRANCH_RULES } from '../legacy.js';

export const SCHEMA_VERSION = 15;

export const MAX_MOMENTS = 12;
export const WEEKS_PER_MONTH = 4;

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

export function heroCapacity(state) {
  return 6 + (state.guild.facilities['great-hall'] || 0) * 2 + state.guild.tierIndex * 2;
}

export function headquartersRoomCapacity(state) {
  // The rented Regional hall begins with four usable rooms. Social promotion and
  // investment in the Great Hall expand the physical footprint gradually.
  const tierRooms = [4, 7, 11][state.guild.tierIndex] || 11;
  const hallExpansion = Math.max(0, (state.guild.facilities['great-hall'] || 0) - 1);
  return tierRooms + hallExpansion;
}

export function usedFacilityRooms(state) {
  return Object.entries(state.guild.facilities || {}).filter(([, level]) => Number(level) > 0).length;
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
  const greatHallBonus = (state.guild.facilities['great-hall'] || 0) >= 3 ? 1 : 0;
  return 1 + Math.min(2, state.guild.tierIndex) + greatHallBonus;
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

export function completeTutorialTargetInPlace(state, target) {
  if (state.tutorial.completed) return;
  const step = ONBOARDING_STEPS[state.tutorial.step];
  if (!step || step.target !== target) return;
  state.guild.crowns += step.reward;
  state.notifications.push({
    id: `tutorial-${step.id}`,
    tone: 'gold',
    title: `Order completed: ${step.title}`,
    text: `The guild receives ${step.reward} crowns.`,
  });
  state.tutorial.step += 1;
  if (state.tutorial.step >= ONBOARDING_STEPS.length) {
    state.tutorial.completed = true;
    state.notifications = state.notifications.filter((item) => item.id !== 'welcome' && !item.id.startsWith('tutorial-'));
    addChronicle(state, {
      type: 'milestone',
      importance: 3,
      title: 'The Broken Lantern stands on its own',
      text: 'The guildmaster no longer needs the council’s step-by-step orders. The first year is now theirs to shape.',
      tags: ['tutorial'],
    });
  }
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

export function finalize(state) {
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
