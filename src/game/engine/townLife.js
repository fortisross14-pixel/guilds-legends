// @ts-check
// Life between contracts: weekly town events (at most one card a week), the
// News feed, seasonal festivals, side jobs, friendly rival challenges and wagers.
import { FESTIVALS, FESTIVAL_EVENT, SIDE_JOBS, TOWN_EVENTS } from '../../data/events.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import {
  addChronicle,
  campaignMonthSerial,
  campaignWeekSerial,
  clone,
  commitRng,
  finalize,
  operationalLocationIds,
  pushNewsInPlace,
  rngFor,
  uid,
} from './core.js';
import { applyXpInPlace } from './heroes.js';
import { addItemsInPlace } from './inventory.js';
import { adjustRegionReputationInPlace } from './reputation.js';
import { issueChallengeInPlace, nemesisIds, recordRivalryInPlace } from './rivalry.js';
import { advanceStoryEventInPlace, applyEventEffectsInPlace, fillEventText } from './stories.js';
import { makeCandidate } from './candidates.js';

export const EVENT_CARD_CHANCE = 0.45;
export const NEWS_CHANCE = 0.35;
export const FRIENDLY_CHALLENGE_CHANCE = 0.05;
export const SIDE_JOBS_PER_TOWN = 3;

function homeHeroes(state) {
  return state.heroes.filter((hero) => hero.status === 'available' && !hero.branchId);
}

function matchesHero(hero, when = {}) {
  if (when.heroClass && !when.heroClass.includes(hero.classId)) return false;
  if (when.heroPersonality && !when.heroPersonality.includes(hero.personality)) return false;
  if (when.heroFlaw && !when.heroFlaw.includes(hero.flaw)) return false;
  if (when.heroDream && !when.heroDream.includes(hero.dream)) return false;
  return true;
}

function eligible(state, event) {
  const when = event.when || {};
  if (when.minTier && state.guild.tierIndex < when.minTier) return false;
  if (when.minFame && state.guild.fame < when.minFame) return false;
  if (when.season !== undefined && Math.floor(state.date.month / 3) !== when.season) return false;
  const heroes = homeHeroes(state).filter((hero) => matchesHero(hero, when));
  if (event.hero && !heroes.length) return false;
  if (event.hero2 && homeHeroes(state).length < 2) return false;
  if (event.needsRival && !state.rivals.length) return false;
  return true;
}

function weightedPick(rng, events) {
  const total = events.reduce((sum, event) => sum + (event.weight || 1), 0);
  let roll = rng.next() * total;
  return events.find((event) => (roll -= event.weight || 1) < 0) || events[0];
}

function pickRival(state, rng) {
  const nemeses = nemesisIds(state);
  if (nemeses.length && rng.chance(0.5)) return rng.pick(nemeses);
  const sameTier = state.rivals.filter((rival) => (rival.leagueTierIndex ?? rival.tierIndex) === state.guild.tierIndex);
  return rng.pick(sameTier.length ? sameTier : state.rivals).id;
}

function contextFor(state, event, rng, townId) {
  const ctx = { townId };
  if (event.hero) {
    const options = homeHeroes(state).filter((hero) => matchesHero(hero, event.when));
    ctx.heroId = rng.pick(options).id;
  }
  if (event.hero2) {
    const others = homeHeroes(state).filter((hero) => hero.id !== ctx.heroId);
    ctx.hero2Id = others.length ? rng.pick(others).id : null;
  }
  if (event.needsRival) ctx.rivalId = pickRival(state, rng);
  return ctx;
}

/** This season's festival: its town and week (week 2 of the season's first month). */
export function festivalFor(year, season) {
  const festival = FESTIVALS.find((item) => item.season === season) || FESTIVALS[0];
  return { ...festival, townId: festival.towns[(year + season) % festival.towns.length], date: { year, month: season * 3, week: 1 } };
}

function cardFromEvent(state, event, ctx) {
  return {
    source: event.id === 'festival' ? 'festival' : 'town',
    eventId: event.id,
    ...ctx,
    title: fillEventText(event.title, ctx, state),
    text: fillEventText(event.text, ctx, state),
    options: event.options.map((option) => ({ id: option.id, label: fillEventText(option.label, ctx, state), note: fillEventText(option.note, ctx, state) })),
  };
}

/**
 * Weekly roll for the guild's town (and branch towns). At most one event card
 * a week, and none while another card is waiting. News items don't pop up.
 */
export function rollWeeklyEventInPlace(state, rng) {
  if (state.world?.activeTravel) return;
  const towns = [...operationalLocationIds(state)];
  const townId = state.world?.currentLocationId || 'dunmere';
  const season = Math.floor(state.date.month / 3);
  const festival = festivalFor(state.date.year, season);
  const isFestivalWeek = state.date.month === festival.date.month && (state.date.week || 0) === festival.date.week;
  if (isFestivalWeek && !state.pendingEvent) {
    if (towns.includes(festival.townId)) {
      const ctx = { townId: festival.townId, festival: festival.name };
      state.pendingEvent = { ...cardFromEvent(state, FESTIVAL_EVENT, ctx), festival: festival.name };
      return;
    }
    pushNewsInPlace(state, { title: `The ${festival.name} in ${LOCATION_BY_ID[festival.townId]?.name}`, text: 'Too far away to join this year.' });
  }
  if (rng.chance(NEWS_CHANCE)) {
    const news = TOWN_EVENTS.filter((event) => event.category === 'news' && eligible(state, event));
    if (news.length) {
      const event = weightedPick(rng, news);
      const ctx = contextFor(state, event, rng, rng.pick(towns));
      applyEventEffectsInPlace(state, event.effects, ctx);
      if (event.effects?.recruit) state.candidates.push(makeCandidate(state, rng, null, ctx.townId));
      pushNewsInPlace(state, { title: fillEventText(event.title, ctx, state), text: fillEventText(event.text, ctx, state) });
    }
  }
  if (state.pendingEvent || !rng.chance(EVENT_CARD_CHANCE)) return;
  const cards = TOWN_EVENTS.filter((event) => event.category !== 'news' && eligible(state, event));
  if (!cards.length) return;
  const event = weightedPick(rng, cards);
  state.pendingEvent = cardFromEvent(state, event, contextFor(state, event, rng, townId));
}

/** Answer the waiting event card (town event, festival or story beat). */
export function resolveTownEvent(state, optionId) {
  const card = state.pendingEvent;
  if (!card) return { state, error: 'There is no event waiting.' };
  if (!card.options.some((option) => option.id === optionId)) return { state, error: 'Choose one of the offered options.' };
  const next = clone(state);
  const rng = rngFor(next, `event-${card.eventId || card.beatId}-${campaignWeekSerial(next)}`);
  const ctx = { heroId: card.heroId, hero2Id: card.hero2Id, rivalId: card.rivalId, townId: card.townId, festival: card.festival };
  next.pendingEvent = null;
  let result;
  if (card.source === 'story') {
    result = advanceStoryEventInPlace(next, card.beatId, optionId, ctx, rng) || '';
  } else {
    const event = card.source === 'festival' ? FESTIVAL_EVENT : TOWN_EVENTS.find((item) => item.id === card.eventId);
    const option = event?.options.find((item) => item.id === optionId);
    if (!option) return { state, error: 'That event no longer exists.' };
    const success = option.chance === undefined || rng.next() < option.chance;
    applyEventEffectsInPlace(next, success ? option.effects : option.fail || {}, ctx);
    result = fillEventText(success ? option.result || option.note : option.failResult || option.note, ctx, next);
    if (option.effects?.rivalry && ctx.rivalId) recordRivalryInPlace(next, ctx.rivalId, 'close');
  }
  commitRng(next, rng);
  pushNewsInPlace(next, { title: card.title, text: result, tone: card.source === 'story' ? 'purple' : 'neutral' });
  next.notifications.push({
    id: `event-${campaignWeekSerial(next)}-${optionId}`,
    tone: card.source === 'story' ? 'purple' : 'blue',
    title: card.title,
    text: result,
  });
  if (card.source === 'story') addChronicle(next, { type: 'story', importance: 2, title: card.title, text: result, tags: ['story'] });
  return { state: finalize(next), error: null };
}

/** Story beats arrive as event cards too (queued if another card is waiting). */
export function queueStoryCardInPlace(state, card) {
  if (!card) return;
  if (state.pendingEvent) {
    state.flags.storyCardWaiting = true;
    return;
  }
  state.pendingEvent = card;
  state.flags.storyCardWaiting = false;
}

// ---------------------------------------------------------------- side jobs

/** Monthly: keep a few side jobs on every board the guild can use. */
export function refreshSideJobsInPlace(state, rng) {
  const towns = operationalLocationIds(state);
  const now = campaignMonthSerial(state);
  state.sideJobs = (state.sideJobs || []).filter((job) => job.expiresSerial >= now && towns.has(job.locationId));
  [...towns].forEach((locationId) => {
    const wanted = SIDE_JOBS_PER_TOWN + (locationId === state.world?.currentLocationId ? state.flags.extraSideJob || 0 : 0);
    let local = state.sideJobs.filter((job) => job.locationId === locationId);
    let safety = 0;
    while (local.length < wanted && safety++ < 20) {
      const template = rng.pick(SIDE_JOBS);
      if (local.some((job) => job.templateId === template.id)) continue;
      const tier = state.guild.tierIndex + 1;
      const job = {
        id: uid('job', rng),
        templateId: template.id,
        title: template.title,
        stat: template.stat,
        difficulty: template.difficulty + state.guild.tierIndex * 8,
        gold: template.gold * tier,
        xp: template.xp * tier,
        rep: template.rep || 0,
        item: template.item || null,
        locationId,
        expiresSerial: now + 1,
      };
      state.sideJobs.push(job);
      local = state.sideJobs.filter((item) => item.locationId === locationId);
    }
  });
  state.flags.extraSideJob = 0;
}

export function startSideJob(state, jobId, heroIds) {
  const job = (state.sideJobs || []).find((item) => item.id === jobId);
  if (!job) return { state, error: 'That job is gone.' };
  const ids = [...new Set(heroIds)].filter(Boolean);
  if (ids.length < 1 || ids.length > 2) return { state, error: 'Send one or two heroes.' };
  if (!operationalLocationIds(state).has(job.locationId) || state.world?.activeTravel) return { state, error: 'Side jobs need the guild in town.' };
  const heroes = ids.map((id) => state.heroes.find((hero) => hero.id === id));
  if (heroes.some((hero) => !hero || hero.status !== 'available' || hero.branchId))
    return { state, error: 'Only available heroes at home can take a side job.' };
  const next = clone(state);
  next.sideJobs = next.sideJobs.filter((item) => item.id !== jobId);
  ids.forEach((id) => {
    next.heroes.find((hero) => hero.id === id).status = 'sidejob';
  });
  next.activeSideJobs = [...(next.activeSideJobs || []), { ...job, heroIds: ids, weeksLeft: 1 }];
  return { state: finalize(next), error: null };
}

/** Weekly: finish side jobs with a quick roll on the heroes' stat. */
export function progressSideJobsInPlace(state, rng) {
  const still = [];
  (state.activeSideJobs || []).forEach((job) => {
    job.weeksLeft -= 1;
    if (job.weeksLeft > 0) return still.push(job);
    const heroes = job.heroIds.map((id) => state.heroes.find((hero) => hero.id === id)).filter(Boolean);
    const score =
      heroes.reduce((sum, hero) => sum + (hero.attributes?.[job.stat] || hero.power || 40), 0) / Math.max(1, heroes.length) +
      (heroes.length - 1) * 6 +
      rng.int(-12, 12);
    const success = score >= job.difficulty;
    const gold = success ? job.gold : Math.round(job.gold / 3);
    state.guild.crowns += gold;
    heroes.forEach((hero) => {
      if (hero.status === 'sidejob') hero.status = 'available';
      if (success) applyXpInPlace(hero, job.xp, state, job.title);
    });
    if (success && job.item) addItemsInPlace(state, { [job.item]: 1 });
    if (success && job.rep) adjustRegionReputationInPlace(state, LOCATION_BY_ID[job.locationId]?.region, job.rep);
    const names = heroes.map((hero) => hero.name).join(' and ');
    const text = success
      ? `${names} did it well: +${gold} gold, +${job.xp} XP${job.item ? ', +1 item' : ''}.`
      : `${names} made a mess of it. Only ${gold} gold.`;
    pushNewsInPlace(state, { title: `Side job: ${job.title}`, text, tone: success ? 'green' : 'red' });
    state.notifications.push({ id: `job-${job.id}`, tone: success ? 'green' : 'gold', title: job.title, text });
  });
  state.activeSideJobs = still;
}

// ---------------------------------------------------------------- friendly challenges and wagers

/** Weekly: a same-tier rival may propose a duel, an exhibition or a wager. */
export function maybeFriendlyChallengeInPlace(state, rng) {
  if (state.challenge || state.wager || state.activeEncounter || !rng.chance(FRIENDLY_CHALLENGE_CHANCE)) return;
  const sameTier = state.rivals.filter(
    (rival) => (rival.leagueTierIndex ?? rival.tierIndex) === state.guild.tierIndex && !nemesisIds(state).includes(rival.id),
  );
  if (!sameTier.length || !homeHeroes(state).length) return;
  issueChallengeInPlace(state, rng.pick(sameTier).id, 'them', rng.pick(['duel', 'exhibition', 'wager']));
}

/** Contract done: does it win the wager? */
export function checkWagerOnContractInPlace(state, family) {
  const wager = state.wager;
  if (!wager || wager.family !== family) return;
  state.guild.crowns += wager.gold;
  recordRivalryInPlace(state, wager.rivalId, 'challengeWon');
  addChronicle(state, {
    type: 'rival',
    importance: 2,
    title: `Wager won against ${wager.rivalName}`,
    text: `A ${family} contract finished first: +${wager.gold} gold.`,
    guildIds: [wager.rivalId],
    tags: ['rival', 'wager'],
  });
  state.notifications.push({ id: `wager-won-${wager.deadlineWeek}`, tone: 'green', title: 'Wager won', text: `+${wager.gold} gold from ${wager.rivalName}.` });
  state.wager = null;
}

/** Weekly: a wager not won by the deadline is lost. */
export function expireWagerInPlace(state) {
  const wager = state.wager;
  if (!wager || campaignWeekSerial(state) <= wager.deadlineWeek) return;
  const lost = Math.min(Math.max(0, state.guild.crowns), wager.gold);
  state.guild.crowns -= lost;
  recordRivalryInPlace(state, wager.rivalId, 'challengeLost');
  addChronicle(state, {
    type: 'rival',
    importance: 1,
    title: `Wager lost to ${wager.rivalName}`,
    text: `They finished a ${wager.family} contract first. −${lost} gold.`,
    guildIds: [wager.rivalId],
    tags: ['rival', 'wager'],
  });
  pushNewsInPlace(state, { title: 'Wager lost', text: `${wager.rivalName} collects ${lost} gold.`, tone: 'red' });
  state.wager = null;
}

export function markNewsRead(state) {
  const next = clone(state);
  next.newsUnread = 0;
  return finalize(next);
}
