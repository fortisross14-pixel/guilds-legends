// @ts-check
// Player actions that move time (the only way time moves): travel with road
// events, continuing a journey, resting at the Guild Hall or an inn, and
// sending companies out (time passes for the player only if the founder goes).
import { ROAD_EVENTS } from '../../data/roadEvents.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { createPartyEncounter } from '../combat.js';
import { HOME_LOCATION_ID, activityAvailable, addChronicle, atHome, clamp, clone, commitRng, finalize, hashString, rngFor, tallySpend, travellingPartyIds, uid } from './core.js';
import { addItemsInPlace, battleItems } from './inventory.js';
import { makeCandidate } from './candidates.js';
import { startTravel } from './economy.js';
import { launchMission } from './missions.js';
import { concludeActiveCombat } from './encounters.js';
import { advanceDays, advanceUntilMissionReturns } from './time.js';
import { charterEffect } from './charter.js';

/**
 * Plans 0–2 road events for a journey of `days` days. Each fires on a
 * distinct day. Shortcuts need two days left; delays need one.
 */
export function planRoadEvents(rng, days) {
  const roll = rng.next();
  let count = days <= 2 ? (roll < 0.25 ? 1 : 0) : days <= 7 ? (roll < 0.4 ? 1 : 0) : roll < 0.2 ? 2 : roll < 0.65 ? 1 : 0;
  count = Math.min(count, days);
  const dayPool = Array.from({ length: days }, (_, index) => index + 1);
  const events = [];
  for (let index = 0; index < count; index += 1) {
    const day = dayPool.splice(rng.int(0, dayPool.length - 1), 1)[0];
    const types = ['ambush', 'merchant', 'recruit'];
    if (days - day >= 2) types.push('shortcut');
    if (days - day >= 1) types.push('delay');
    events.push({ id: uid('road', rng), type: rng.pick(types), day });
  }
  return events.sort((a, b) => a.day - b.day);
}

function keepTravellingInPlace(next) {
  const travel = next.world?.activeTravel;
  if (!travel || next.pendingDecisions.length || next.activeEncounter || next.activeMissionGame || next.pendingRoadEvent) return { state: finalize(next), error: null };
  return advanceDays(next, travel.daysRemaining, true);
}

/** Departs for a town and lets the journey's days pass (pausing for events). */
export function travelTo(state, destinationId) {
  const started = startTravel(state, destinationId);
  if (started.error) return started;
  const next = started.state;
  const rng = rngFor(next, `road-${destinationId}`);
  next.world.roadEvents = planRoadEvents(rng, next.world.activeTravel.totalDays);
  // Shield of the People: folk on the road warn you off ambushes and share supplies.
  if (charterEffect(next, 'roadHelp', false)) {
    next.world.roadEvents = next.world.roadEvents.map((event) => (event.type === 'ambush' && rng.chance(0.6) ? { ...event, type: 'peddler' } : event));
  }
  commitRng(next, rng);
  return advanceDays(next, next.world.activeTravel.totalDays, true);
}

/** Resumes an interrupted journey. */
export function continueJourney(state) {
  if (!state.world?.activeTravel) return { state, error: 'The guild is not travelling.' };
  return keepTravellingInPlace(clone(state));
}

function travellers(state) {
  const party = travellingPartyIds(state);
  return state.heroes.filter((hero) => hero.status === 'available' && (party.length ? party.includes(hero.id) : !hero.branchId));
}

function woundInPlace(hero, rng) {
  hero.status = 'injured';
  hero.injury = 'Road wound';
  hero.injuryWeeks = rng.int(2, 4);
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

  if (event.type === 'peddler') {
    if (optionId === 'accept') addItemsInPlace(next, { potion: 2 });
    result = optionId === 'accept' ? 'The peddler hands over two potions.' : 'You thank the peddler and march on.';
  } else if (event.type === 'ambush' && optionId === 'fight') {
    const fighters = [...party].sort((a, b) => b.power - a.power).slice(0, 4);
    if (!fighters.length) {
      const lost = Math.min(Math.max(0, next.guild.crowns), rng.int(40, 100) * tier);
      next.guild.crowns -= lost;
      result = `With nobody fit to fight, the bandits take ${lost} gold.`;
    } else {
      const locationId = travel?.toId || next.world.currentLocationId;
      next.activeEncounter = createPartyEncounter({
        id: `road-${event.id}`,
        seed: (next.rngState ^ hashString(`road-ambush:${event.id}`)) >>> 0,
        sourceType: 'road',
        sourceId: event.id,
        title: 'Ambush on the road',
        roundName: 'Road ambush',
        objective: 'Drive off the bandits.',
        playerHeroes: fighters.map((hero) => ({ hero, role: 'Fighter' })),
        opponentName: 'Bandits',
        opponentPrimal: LOCATION_BY_ID[locationId]?.primal || 'Iron',
        opponentClassId: 'Rogue',
        opponentPower: 40 + next.guild.tierIndex * 18,
        opponentLevel: 1 + next.guild.tierIndex * 5,
        enemyCount: clamp(fighters.length, 1, 4),
        risk: 2,
        canFlee: true,
        items: battleItems(next),
      });
      result = 'Steel is drawn on the road.';
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
  } else if (event.type === 'merchant' && optionId === 'buy') {
    const cost = 25 * tier;
    if (next.guild.crowns < cost) return { state, error: `Two potions cost ${cost} gold.` };
    next.guild.crowns -= cost;
    addItemsInPlace(next, { potion: 2 });
    result = `You buy two potions for ${cost} gold.`;
  } else if (event.type === 'recruit' && optionId === 'invite') {
    const locationId = travel?.toId || next.world.currentLocationId;
    const candidate = makeCandidate(next, rng, null, locationId);
    candidate.signingFee = Math.round(candidate.signingFee / 2);
    candidate.buyoutFee = Math.round((candidate.buyoutFee || 0) / 2);
    candidate.interest = Math.max(candidate.interest || 0, 70);
    candidate.channel = 'Met on the road';
    candidate.scoutLevel = 1;
    next.candidates.push(candidate);
    result = `${candidate.name}, a level ${candidate.level} ${candidate.classId}, will wait for you at the tavern in ${LOCATION_BY_ID[locationId]?.name || 'town'}.`;
  } else if (event.type === 'shortcut' && optionId === 'take' && travel && travel.daysRemaining >= 2) {
    travel.daysRemaining -= 1;
    travel.totalDays -= 1;
    party.forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue + 10, 0, 100);
    });
    result = 'The steep trail saves a day.';
  } else if (event.type === 'delay' && optionId === 'wait' && travel) {
    travel.daysRemaining += 1;
    travel.totalDays += 1;
    result = 'The storm costs the journey a day.';
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
  if (event.scripted) {
    // The story march (mission 3): after the road event, time runs until the wolves.
    const mission = next.activeMissions.find((item) => item.locationId === event.toId) || next.activeMissions[0];
    return mission ? advanceUntilMissionReturns(next, mission.id, true) : { state: finalize(next), error: null };
  }
  return keepTravellingInPlace(next);
}

/**
 * Launches a mission. The company is away for the contract's listed time. If
 * the founder goes, time passes for the player too until they are back;
 * otherwise the player keeps exploring.
 */
export function launchExpedition(state, missionId, formationType, assignments) {
  const mission = state.missions.find((item) => item.id === missionId);
  const launched = launchMission(state, missionId, formationType, assignments);
  if (launched.error) return launched;
  // Story mission 3: a guaranteed easy road event on the way to the first contract.
  if (mission?.story === 'm3.contract' && !launched.state.flags.openingPeddler) {
    launched.state.flags.openingPeddler = true;
    launched.state.pendingRoadEvent = { id: 'opening-peddler', type: 'peddler', day: 0, scripted: true, toId: mission.locationId };
    return launched;
  }
  const founderGoes = (assignments || []).some((assignment) => assignment.heroId === launched.state.guild.founderHeroId);
  if (!founderGoes) return launched;
  return advanceUntilMissionReturns(launched.state, missionId);
}

/** Conclude a finished battle; if it interrupted a journey, keep travelling. */
export function concludeCombatAndContinue(state) {
  const concluded = concludeActiveCombat(state);
  if (concluded.error) return concluded;
  const next = concluded.state;
  if (next.world?.activeTravel) return keepTravellingInPlace(next);
  return concluded;
}

// ---------------------------------------------------------------- resting

/** The longest single rest at the Guild Hall (the rest dial's end): 13 weeks. */
export const MAX_REST_DAYS = 91;
export const INN_NIGHT_COST = 6;

/**
 * Rests at the Guild Hall (home only): first applies the heroes' tasks chosen
 * on the rest screen ({ heroId: activity }), then lets `days` pass (the rest
 * dial: 1 day to 13 weeks). Room activities resolve at each month start.
 */
export function restAtHall(state, days, tasks = {}) {
  if (!Number.isInteger(days) || days < 1 || days > MAX_REST_DAYS) return { state, error: `Rest between 1 and ${MAX_REST_DAYS} days.` };
  if (!atHome(state)) return { state, error: `Rest at the Guild Hall in ${LOCATION_BY_ID[HOME_LOCATION_ID].name}, or at an inn while away.` };
  const next = clone(state);
  Object.entries(tasks || {}).forEach(([heroId, activity]) => {
    const hero = next.heroes.find((item) => item.id === heroId);
    if (!hero || ['dead', 'retired', 'mission', 'sidejob', 'tournament'].includes(hero.status)) return;
    if (activityAvailable(next, activity)) hero.monthlyActivity = activity;
  });
  return advanceDays(next, days, true);
}

/** A night or three at an inn away from home: the party heals and time passes. */
export function restAtInn(state, nights) {
  if (![1, 2, 3].includes(nights)) return { state, error: 'Stay one, two or three nights.' };
  if (state.world?.activeTravel || state.world?.wildAreaId) return { state, error: 'Inns are in towns.' };
  if (atHome(state)) return { state, error: 'At home, rest at the Guild Hall.' };
  const party = travellingPartyIds(state);
  const cost = INN_NIGHT_COST * nights * Math.max(1, party.length);
  if (state.guild.crowns < cost) return { state, error: `${nights} night${nights === 1 ? '' : 's'} for the party cost ${cost} gold.` };
  const next = clone(state);
  next.guild.crowns -= cost;
  tallySpend(next, 'other', cost);
  next.heroes
    .filter((hero) => party.includes(hero.id))
    .forEach((hero) => {
      hero.health = clamp((hero.health ?? 100) + 12 * nights, 0, 100);
      hero.mana = 100;
      hero.fatigue = clamp((hero.fatigue ?? 0) - 15 * nights, 0, 100);
    });
  return advanceDays(next, nights, true);
}
