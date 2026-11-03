// @ts-check
// Upkeep, patron loans and debt, travel, facility upgrades.
import { HALL_PURCHASE, ROOM_BY_ID } from '../../data/rooms.js';
import { charterEffect } from './charter.js';
import { LOCATION_BY_ID, travelDays, unlockedLocations } from '../../data/world.js';
import {
  addChronicle,
  appointmentHolder,
  clamp,
  clone,
  finalize,
  roomLevel,
  spanLabel,
  travellingPartyIds,
  tallyGuild,
  tallySpend,
} from './core.js';
import { refreshCandidatesForLocationInPlace } from './candidates.js';
import { refreshMissionsInPlace } from './universe.js';
import { releaseHeroInPlace } from './institution.js';

// Debt rules (B2). A patron loan is the way back from an empty treasury.
const LOAN_INTEREST = 0.25;

const LOAN_TERM_MONTHS = 12;

const DEBT_LOYALTY_LOSS = 3;

const DEBT_WALKOUT_MONTHS = 3;

const DEBT_WALKOUT_LOYALTY = 50;

/** Days, cost and a label for a journey from where the guild stands. */
export function getTravelQuote(state, destinationId) {
  const fromId = state.world?.currentLocationId || 'dunmere';
  const destination = LOCATION_BY_ID[destinationId];
  const unlocked = unlockedLocations(state.guild.tierIndex).some((location) => location.id === destinationId);
  const days = destination ? travelDays(fromId, destinationId) : 0;
  const party = Math.max(1, travellingPartyIds(state, true).length);
  const cost = Math.round((12 + days * (4 + party * 2)) * (appointmentHolder(state, 'Quartermaster') ? 0.86 : 1));
  return { destination, unlocked, days, label: spanLabel(days), cost, same: fromId === destinationId };
}

export function startTravel(state, destinationId) {
  const next = clone(state);
  if (next.world?.activeTravel) return { state, error: 'The guild is already traveling.' };
  if (next.activeEncounter) return { state, error: 'Conclude the active combat before leaving.' };
  if (next.activeMissionGame) return { state, error: 'Conclude the active mission challenge before leaving.' };
  if (next.pendingDecisions.length) return { state, error: 'Resolve the critical decision before leaving.' };
  if ([...(next.tournaments || []), ...(next.guildTournaments || [])].some((tournament) => tournament.status === 'active'))
    return { state, error: 'Finish the active tournament before traveling.' };
  const quote = getTravelQuote(next, destinationId);
  if (!quote.destination) return { state, error: 'Unknown destination.' };
  if (!quote.unlocked) return { state, error: `${quote.destination.name} requires ${quote.destination.tier} status.` };
  if (quote.same) return { state, error: `The guild is already in ${quote.destination.name}.` };
  if (next.guild.crowns < quote.cost) return { state, error: `Travel requires ${quote.cost} gold.` };
  next.guild.crowns -= quote.cost;
  tallySpend(next, 'travel', quote.cost);
  next.world.knowledge ||= { locations: {}, events: {}, sources: {} };
  next.world.knowledge.locations ||= {};
  if (next.world.knowledge.locations[destinationId] !== 'visited' && next.world.knowledge.locations[destinationId] !== 'fullyExplored') {
    next.world.knowledge.locations[destinationId] = 'discovered';
  }
  // Leaving a wild area to travel; arriving starts at the town's gate, not the old spot.
  next.world.wildAreaId = null;
  if (next.world.exploration?.positions) delete next.world.exploration.positions[destinationId];
  next.world.activeTravel = {
    fromId: next.world.currentLocationId,
    toId: destinationId,
    daysRemaining: quote.days,
    totalDays: quote.days,
    cost: quote.cost,
  };
  addChronicle(next, {
    type: 'travel',
    importance: 1,
    title: `The guild departs for ${quote.destination.name}`,
    text: `The party takes the road; the heroes at home keep to their tasks. The journey will take ${quote.label} and ${quote.cost} gold.`,
    tags: ['travel', quote.destination.primal],
  });
  next.notifications.push({
    id: `travel-${destinationId}-${next.date.year}-${next.date.month}`,
    tone: 'blue',
    title: `Journey to ${quote.destination.name}`,
    text: `${quote.label} on the road.`,
  });
  return { state: finalize(next), error: null };
}

/** One day on the road: road events fire on their day; arrival when the days run out. */
export function progressTravelInPlace(state, rng) {
  const travel = state.world?.activeTravel;
  if (!travel) return;
  travel.daysRemaining -= 1;
  const elapsed = travel.totalDays - travel.daysRemaining;
  const roadEvents = state.world.roadEvents || [];
  const due = roadEvents.find((event) => event.day <= elapsed);
  if (due) {
    state.world.roadEvents = roadEvents.filter((event) => event !== due);
    state.pendingRoadEvent = { ...due, fromId: travel.fromId, toId: travel.toId };
  }
  const party = travellingPartyIds(state);
  state.heroes
    .filter((hero) => party.includes(hero.id) && hero.status === 'available' && rng.chance(0.3))
    .forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue + 1, 0, 100);
    });
  if (travel.daysRemaining > 0) return;
  const destination = LOCATION_BY_ID[travel.toId] || LOCATION_BY_ID.dunmere;
  state.world.currentLocationId = destination.id;
  state.world.visitedLocationIds ||= [];
  if (!state.world.visitedLocationIds.includes(destination.id)) state.world.visitedLocationIds.push(destination.id);
  state.world.knowledge ||= { locations: {}, events: {}, sources: {} };
  state.world.knowledge.locations ||= {};
  state.world.knowledge.locations[destination.id] = 'visited';
  state.world.activeTravel = null;
  state.flags.firstTravelCompleted = true;
  refreshCandidatesForLocationInPlace(state, rng, destination.id);
  refreshMissionsInPlace(state, rng);
  addChronicle(state, {
    type: 'travel',
    importance: 2,
    title: `${state.guild.name} arrives in ${destination.name}`,
    text: `The guild opens its temporary hall in a ${destination.primal.toLowerCase()}-aligned settlement. New contracts and local recruits are now available.`,
    tags: ['arrival', destination.primal],
  });
  state.notifications.push({
    id: `arrival-${destination.id}-${state.date.year}-${state.date.month}`,
    tone: 'green',
    title: `Arrived in ${destination.name}`,
    text: `${destination.primal} influence shapes the local missions, patrons and recruitment market.`,
  });
}

/** What the guild's home costs each month: the stable's rent while leased, and each room's upkeep. */
export function hallUpkeep(state) {
  const hall = state.guild.hall || {};
  const lease = hall.owned && hall.lease ? HALL_PURCHASE.lease.rent : 0;
  const rooms = Object.entries(hall.rooms || {})
    .filter(([, level]) => level > 0)
    .map(([id, level]) => ({ id, name: ROOM_BY_ID[id]?.name || id, level, upkeep: ROOM_BY_ID[id]?.levels[level - 1]?.upkeep || 0 }));
  const roomTotal = rooms.reduce((sum, room) => sum + room.upkeep, 0);
  return { lease, rooms, roomTotal, total: lease + roomTotal };
}

/** Monthly costs by line, for the Treasury and the council report. */
export function upkeepBreakdown(state) {
  const wages = state.heroes.filter((hero) => !['retired', 'dead', 'candidate'].includes(hero.status)).reduce((sum, hero) => sum + hero.salary, 0);
  const hall = hallUpkeep(state);
  const appointments = Object.keys(state.guild.appointments || {}).length * 7;
  const subtotal = wages + hall.total + appointments;
  const total = subtotal;
  return { wages, hall, appointments, loan: state.guild.loan?.installment || 0, total };
}

export function monthlyUpkeep(state) {
  return upkeepBreakdown(state).total;
}

export function getPatronLoanOffer(state) {
  const upkeep = monthlyUpkeep(state);
  const crowns = state.guild.crowns;
  const distressed = crowns < Math.max(100, upkeep * 2);
  // A level 2 Treasury convinces patrons to lend half as much again.
  const amount = Math.ceil(((300 + upkeep * 2 + Math.max(0, -crowns)) * (roomLevel(state, "treasury") >= 2 ? 1.5 : 1)) / 10) * 10;
  const repayment = Math.round(amount * (1 + LOAN_INTEREST));
  const remaining = (state.guild.loan?.remaining || 0) + repayment;
  // Free Company: no patron lends to a guild that answers to no one.
  if (charterEffect(state, 'noLoans', false)) return { available: false, amount: 0, repayment: 0, installment: 0, months: LOAN_TERM_MONTHS, outstanding: state.guild.loan?.remaining || 0, reason: 'A Free Company takes no patron’s money.' };
  return {
    available: distressed,
    amount,
    repayment,
    installment: Math.ceil(remaining / LOAN_TERM_MONTHS),
    months: LOAN_TERM_MONTHS,
    outstanding: state.guild.loan?.remaining || 0,
    reason: distressed ? null : 'Patrons only lend to a guild that cannot cover two months of upkeep.',
  };
}

export function takePatronLoan(state) {
  const offer = getPatronLoanOffer(state);
  if (!offer.available) return { state, error: offer.reason };
  const next = clone(state);
  const remaining = offer.outstanding + offer.repayment;
  next.guild.loan = { remaining, installment: offer.installment, takenYear: next.date.year, takenMonth: next.date.month };
  next.guild.crowns += offer.amount;
  next.stats.patronLoans = (next.stats.patronLoans || 0) + 1;
  addChronicle(next, {
    type: 'treasury',
    importance: 2,
    title: `${next.guild.name} accepts a patron loan`,
    text: `A patron advances ${offer.amount} gold. The guild owes ${remaining} gold, repaid at ${offer.installment} per month.`,
    tags: ['treasury', 'loan'],
  });
  next.notifications.push({
    id: `loan-${next.date.year}-${next.date.month}-${next.stats.patronLoans}`,
    tone: 'gold',
    title: 'Patron loan accepted',
    text: `+${offer.amount} gold now. Repay ${offer.installment} per month until ${remaining} is cleared.`,
  });
  return { state: finalize(next), error: null };
}

// Monthly loan installment and the cost of unpaid wages. Deterministic: no RNG.
export function applyDebtInPlace(state) {
  let loanPayment = 0;
  const loan = state.guild.loan;
  if (loan) {
    loanPayment = Math.min(loan.installment, loan.remaining);
    state.guild.crowns -= loanPayment;
    tallySpend(state, 'loan', loanPayment);
    loan.remaining -= loanPayment;
    if (loan.remaining <= 0) {
      state.guild.loan = null;
      addChronicle(state, {
        type: 'treasury',
        importance: 1,
        title: 'The patron loan is repaid',
        text: `${state.guild.name} clears its debt to its patron.`,
        tags: ['treasury', 'loan'],
      });
    }
  }
  const walkouts = [];
  if (state.guild.crowns >= 0) {
    state.guild.unpaidMonths = 0;
    return { loanPayment, walkouts };
  }
  state.guild.unpaidMonths = (state.guild.unpaidMonths || 0) + 1;
  const unpaid = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status) && hero.salary > 0);
  unpaid.forEach((hero) => {
    hero.loyalty = clamp(hero.loyalty - DEBT_LOYALTY_LOSS, 0, 100);
  });
  if (state.guild.unpaidMonths >= DEBT_WALKOUT_MONTHS) {
    const leaver = unpaid
      .filter(
        (hero) => ['available', 'injured'].includes(hero.status) && hero.id !== state.guild.currentGuildmasterHeroId && hero.loyalty < DEBT_WALKOUT_LOYALTY,
      )
      .sort((a, b) => a.loyalty - b.loyalty || a.id.localeCompare(b.id))[0];
    if (leaver) {
      walkouts.push(leaver.name);
      tallyGuild(state, 'released');
      releaseHeroInPlace(state, leaver, {
        title: `Walked out of ${state.guild.name}`,
        text: `Unpaid for ${state.guild.unpaidMonths} months, ${leaver.name} leaves to find a paying banner.`,
        chronicleText: `After ${state.guild.unpaidMonths} months of unpaid wages, ${leaver.name} walks out and becomes a free agent.`,
      });
      state.notifications.push({
        id: `walkout-${leaver.id}`,
        tone: 'red',
        title: `${leaver.name} walked out`,
        text: 'Unpaid wages drove a hero away. Take a contract or a patron loan to stop the bleeding.',
      });
    }
  }
  return { loanPayment, walkouts };
}

