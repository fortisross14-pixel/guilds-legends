// @ts-check
// Player actions that move time: travel (with road events), continuing a
// journey, resting at the Guild Hall, and sending companies out.
import { ROAD_EVENTS } from '../../data/roadEvents.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { addChronicle, clamp, clone, commitRng, finalize, partyCapacity, rngFor, uid } from './core.js';
import { applyXpInPlace } from './heroes.js';
import { makeCandidate } from './candidates.js';
import { startTravel } from './economy.js';
import { launchMission } from './missions.js';
import { advanceMonths, advanceToNextEvent } from './time.js';

export const MAX_REST_MONTHS = 3;

/**
 * Plans 0–2 road events for a journey of `months` months. Each fires on a
 * distinct month. Shortcuts need two months left; delays need one.
 */
export function planRoadEvents(rng, months) {
  const roll = rng.next();
  let count = months <= 1 ? (roll < 0.4 ? 1 : 0) : roll < 0.2 ? 2 : roll < 0.65 ? 1 : 0;
  count = Math.min(count, months);
  const monthPool = Array.from({ length: months }, (_, index) => index + 1);
  const events = [];
  for (let index = 0; index < count; index += 1) {
    const month = monthPool.splice(rng.int(0, monthPool.length - 1), 1)[0];
    const types = ['ambush', 'merchant', 'recruit'];
    if (months - month >= 2) types.push('shortcut');
    if (months - month >= 1) types.push('delay');
    events.push({ id: uid('road', rng), type: rng.pick(types), month });
  }
  return events.sort((a, b) => a.month - b.month);
}

/** Departs for a town and lets the journey's months pass (pausing for events). */
export function travelTo(state, destinationId) {
  const started = startTravel(state, destinationId);
  if (started.error) return started;
  const next = started.state;
  const rng = rngFor(next, `road-${destinationId}`);
  next.world.roadEvents = planRoadEvents(rng, next.world.activeTravel.totalMonths);
  commitRng(next, rng);
  return advanceMonths(next, next.world.activeTravel.totalMonths, true);
}

/** Resumes an interrupted journey. */
export function continueJourney(state) {
  const travel = state.world?.activeTravel;
  if (!travel) return { state, error: 'The guild is not travelling.' };
  return advanceMonths(state, travel.monthsRemaining);
}

function travellers(state) {
  return state.heroes.filter((hero) => hero.status === 'available' && !hero.branchId);
}

function woundInPlace(hero, rng) {
  hero.status = 'injured';
  hero.injury = 'Road wound';
  hero.injuryMonths = rng.int(1, 2);
  hero.health = clamp((hero.health ?? 100) - 20, 1, 100);
  hero.monthlyActivity = 'Infirmary';
}

/** Applies the chosen road-event option, then continues the journey. */
export function resolveRoadEvent(state, optionId) {
  const event = state.pendingRoadEvent;
  if (!event) return { state, error: 'There is no event on the road.' };
  const definition = ROAD_EVENTS[event.type];
  if (!definition?.options.some((option) => option.id === optionId)) return { state, error: 'Choose one of the offered options.' };
  const next = clone(state);
  const rng = rngFor(next, `road-resolve-${event.id}`);
  const tier = next.guild.tierIndex + 1;
  const party = travellers(next);
  const travel = next.world.activeTravel;
  let result = 'You move on.';

  if (event.type === 'ambush' && optionId === 'fight') {
    const fighters = [...party].sort((a, b) => b.power - a.power).slice(0, 4);
    const strength = fighters.reduce((sum, hero) => sum + hero.power, 0);
    const threat = 60 + next.guild.tierIndex * 90;
    const winChance = fighters.length ? clamp(0.35 + (strength - threat) / 200, 0.1, 0.92) : 0;
    if (rng.chance(winChance)) {
      const loot = rng.int(30, 90) * tier;
      next.guild.crowns += loot;
      fighters.forEach((hero) => applyXpInPlace(hero, 25, next, 'road ambush'));
      result = `The bandits scatter. +${loot} gold and +25 XP for ${fighters.length} fighter${fighters.length === 1 ? '' : 's'}.`;
    } else {
      const lost = Math.min(Math.max(0, next.guild.crowns), rng.int(40, 100) * tier);
      next.guild.crowns -= lost;
      const hurt = fighters.length ? rng.pick(fighters) : null;
      if (hurt && rng.chance(0.4)) woundInPlace(hurt, rng);
      result = `The bandits win the skirmish and take ${lost} gold.${hurt?.status === 'injured' ? ` ${hurt.name} is wounded.` : ''}`;
    }
  } else if (event.type === 'ambush' && optionId === 'pay') {
    const toll = 40 * tier;
    if (next.guild.crowns < toll) return { state, error: `The toll is ${toll} gold. You cannot pay it.` };
    next.guild.crowns -= toll;
    result = `You pay ${toll} gold and pass unharmed.`;
  } else if (event.type === 'merchant' && optionId === 'sell') {
    const gain = rng.int(40, 90) * tier;
    next.guild.crowns += gain;
    result = `The merchant pays ${gain} gold for your spare gear.`;
  } else if (event.type === 'merchant' && optionId === 'provisions') {
    const cost = 30 * tier;
    if (next.guild.crowns < cost) return { state, error: `Provisions cost ${cost} gold.` };
    next.guild.crowns -= cost;
    party.forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue - 15, 0, 100);
    });
    result = `You spend ${cost} gold on provisions. The travellers feel rested.`;
  } else if (event.type === 'recruit' && optionId === 'invite') {
    const locationId = travel?.toId || next.world.currentLocationId;
    const candidate = makeCandidate(next, rng, null, locationId);
    candidate.signingFee = Math.round(candidate.signingFee / 2);
    candidate.buyoutFee = Math.round((candidate.buyoutFee || 0) / 2);
    candidate.interest = Math.max(candidate.interest || 0, 70);
    candidate.channel = 'Met on the road';
    next.candidates.push(candidate);
    result = `${candidate.name}, a level ${candidate.level} ${candidate.classId}, will wait for you at the tavern in ${LOCATION_BY_ID[locationId]?.name || 'town'}.`;
  } else if (event.type === 'shortcut' && optionId === 'take' && travel && travel.monthsRemaining >= 2) {
    travel.monthsRemaining -= 1;
    travel.totalMonths -= 1;
    party.forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue + 10, 0, 100);
    });
    result = 'The steep trail saves a month.';
  } else if (event.type === 'delay' && optionId === 'wait' && travel) {
    travel.monthsRemaining += 1;
    travel.totalMonths += 1;
    result = 'The storm costs the journey a month.';
  } else if (event.type === 'delay' && optionId === 'push') {
    party.forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue + 15, 0, 100);
    });
    const hurt = party.length && rng.chance(0.2) ? rng.pick(party) : null;
    if (hurt) woundInPlace(hurt, rng);
    result = `You push through the storm.${hurt ? ` ${hurt.name} is hurt on the way.` : ''}`;
  }

  next.pendingRoadEvent = null;
  commitRng(next, rng);
  addChronicle(next, { type: 'travel', importance: 1, title: definition.title, text: result, tags: ['travel', 'road-event', event.type] });
  next.notifications.push({ id: `road-${event.id}`, tone: 'blue', title: definition.title, text: result });
  if (next.world.activeTravel && !next.pendingDecisions.length && !next.activeEncounter && !next.activeMissionGame) {
    return advanceMonths(next, next.world.activeTravel.monthsRemaining, true);
  }
  return { state: finalize(next), error: null };
}

/** Wait 1–3 months at the Guild Hall; heroes follow their monthly assignments. */
export function restAtGuildHall(state, months = 1) {
  const count = Math.round(Number(months));
  if (!Number.isFinite(count) || count < 1 || count > MAX_REST_MONTHS) return { state, error: `Rest for 1 to ${MAX_REST_MONTHS} months.` };
  if (state.world?.activeTravel) return { state, error: 'The guild is on the road. Continue the journey instead.' };
  return advanceMonths(state, count);
}

/**
 * Launches a mission. When every field company is now deployed, time passes
 * until the next company comes back (a mission "runs").
 */
export function launchExpedition(state, missionId, formationType, assignments) {
  const launched = launchMission(state, missionId, formationType, assignments);
  if (launched.error) return launched;
  if (launched.state.activeMissions.length < partyCapacity(launched.state)) return launched;
  return advanceToNextEvent(launched.state);
}
