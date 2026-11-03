// @ts-check
// Player actions that move time: travel (with road events), continuing a
// journey, resting at the Guild Hall, and sending companies out.
import { ROAD_EVENTS } from '../../data/roadEvents.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { createPartyEncounter } from '../combat.js';
import { addChronicle, clamp, clone, commitRng, completeTutorialTargetInPlace, finalize, hashString, partyCapacity, rngFor, uid } from './core.js';
import { addItemsInPlace, battleItems } from './inventory.js';
import { makeCandidate } from './candidates.js';
import { startTravel } from './economy.js';
import { launchMission } from './missions.js';
import { concludeActiveCombat } from './encounters.js';
import { advanceToNextEvent, advanceWeeks } from './time.js';

/**
 * Plans 0–2 road events for a journey of `months` weeks. Each fires on a
 * distinct week. Shortcuts need two weeks left; delays need one.
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
  next.world.roadEvents = planRoadEvents(rng, next.world.activeTravel.totalWeeks);
  commitRng(next, rng);
  return advanceWeeks(next, next.world.activeTravel.totalWeeks, true);
}

/** Resumes an interrupted journey. */
export function continueJourney(state) {
  const travel = state.world?.activeTravel;
  if (!travel) return { state, error: 'The guild is not travelling.' };
  return advanceWeeks(state, travel.weeksRemaining);
}

function travellers(state) {
  return state.heroes.filter((hero) => hero.status === 'available' && !hero.branchId);
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
  } else if (event.type === 'shortcut' && optionId === 'take' && travel && travel.weeksRemaining >= 2) {
    travel.weeksRemaining -= 1;
    travel.totalWeeks -= 1;
    party.forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue + 10, 0, 100);
    });
    result = 'The steep trail saves a week.';
  } else if (event.type === 'delay' && optionId === 'wait' && travel) {
    travel.weeksRemaining += 1;
    travel.totalWeeks += 1;
    result = 'The storm costs the journey a week.';
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
    // The opening march: after the road event, time runs until the wolves.
    completeTutorialTargetInPlace(next, 'roadEvent');
    return advanceToNextEvent(next);
  }
  if (next.world.activeTravel && !next.pendingDecisions.length && !next.activeEncounter && !next.activeMissionGame) {
    return advanceWeeks(next, next.world.activeTravel.weeksRemaining, true);
  }
  return { state: finalize(next), error: null };
}

/**
 * Launches a mission. When every field company is now deployed, time passes
 * until the next company comes back (a mission "runs").
 */
export function launchExpedition(state, missionId, formationType, assignments) {
  const mission = state.missions.find((item) => item.id === missionId);
  const launched = launchMission(state, missionId, formationType, assignments);
  if (launched.error) return launched;
  // Scripted opening: a guaranteed easy road event on the way to the first contract.
  if (mission?.templateId === 'wolves-old-road' && !launched.state.tutorial.completed && !launched.state.flags.openingPeddler) {
    launched.state.flags.openingPeddler = true;
    launched.state.pendingRoadEvent = { id: 'opening-peddler', type: 'peddler', month: 0, scripted: true, toId: mission.locationId };
    return launched;
  }
  if (launched.state.activeMissions.length < partyCapacity(launched.state)) return launched;
  return advanceToNextEvent(launched.state);
}

/** Conclude a finished battle; if it interrupted a journey, keep travelling. */
export function concludeCombatAndContinue(state) {
  const concluded = concludeActiveCombat(state);
  if (concluded.error) return concluded;
  const next = concluded.state;
  if (next.world?.activeTravel && !next.pendingDecisions.length && !next.activeEncounter && !next.activeMissionGame && !next.pendingRoadEvent) {
    return advanceWeeks(next, next.world.activeTravel.weeksRemaining, true);
  }
  return concluded;
}
