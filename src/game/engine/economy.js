// @ts-check
// Upkeep, patron loans and debt, travel, facility upgrades.
import { FACILITIES } from '../../data/content.js';
import { LOCATION_BY_ID, travelDuration, unlockedLocations } from '../../data/world.js';
import {
  activeHeroCount,
  addChronicle,
  appointmentHolder,
  clamp,
  clone,
  finalize,
  headquartersRoomCapacity,
  tierIndexByName,
  usedFacilityRooms,
} from './core.js';
import { refreshCandidatesForLocationInPlace } from './candidates.js';
import { refreshMissionsInPlace } from './universe.js';
import { releaseHeroInPlace } from './institution.js';
import { evaluateStateInPlace } from './goals.js';

// Debt rules (B2). A patron loan is the way back from an empty treasury.
const LOAN_INTEREST = 0.25;

const LOAN_TERM_MONTHS = 12;

const DEBT_LOYALTY_LOSS = 3;

const DEBT_WALKOUT_MONTHS = 3;

const DEBT_WALKOUT_LOYALTY = 50;

export function getTravelQuote(state, destinationId) {
  const fromId = state.world?.currentLocationId || 'dunmere';
  const destination = LOCATION_BY_ID[destinationId];
  const unlocked = unlockedLocations(state.guild.tierIndex).some((location) => location.id === destinationId);
  const months = destination ? travelDuration(fromId, destinationId) : 0;
  const cost = Math.round(35 + months * (38 + activeHeroCount(state) * 7) * (appointmentHolder(state, 'Quartermaster') ? 0.86 : 1));
  return { destination, unlocked, months, cost, same: fromId === destinationId };
}

export function startTravel(state, destinationId) {
  const next = clone(state);
  if (next.world?.activeTravel) return { state, error: 'The guild is already traveling.' };
  if (next.activeEncounter) return { state, error: 'Conclude the active combat before leaving.' };
  if (next.activeMissionGame) return { state, error: 'Conclude the active mission challenge before leaving.' };
  if (next.pendingDecisions.length) return { state, error: 'Resolve the critical decision before leaving.' };
  if (next.activeMissions.length && next.guild.tierIndex === 0)
    return { state, error: 'At Regional scale, wait for every deployed company to return before relocating headquarters.' };
  if ([...(next.tournaments || []), ...(next.guildTournaments || [])].some((tournament) => tournament.status === 'active'))
    return { state, error: 'Finish the active tournament before traveling.' };
  const quote = getTravelQuote(next, destinationId);
  if (!quote.destination) return { state, error: 'Unknown destination.' };
  if (!quote.unlocked) return { state, error: `${quote.destination.name} requires ${quote.destination.tier} status.` };
  if (quote.same) return { state, error: `The guild is already in ${quote.destination.name}.` };
  if (next.guild.crowns < quote.cost) return { state, error: `Travel requires ${quote.cost} crowns.` };
  next.guild.crowns -= quote.cost;
  next.world.activeTravel = {
    fromId: next.world.currentLocationId,
    toId: destinationId,
    monthsRemaining: quote.months,
    totalMonths: quote.months,
    cost: quote.cost,
  };
  addChronicle(next, {
    type: 'travel',
    importance: 1,
    title: `The guild departs for ${quote.destination.name}`,
    text: `${next.guild.tierIndex === 0 ? activeHeroCount(next) : next.heroes.filter((hero) => hero.status === 'available' && !hero.branchId).length} headquarters heroes take the road. Deployed companies and branches continue operating. The journey will require ${quote.months} month${quote.months === 1 ? '' : 's'} and ${quote.cost} crowns.`,
    tags: ['travel', quote.destination.primal],
  });
  next.notifications.push({
    id: `travel-${destinationId}-${next.date.year}-${next.date.month}`,
    tone: 'blue',
    title: `Journey to ${quote.destination.name}`,
    text: `${quote.months} month${quote.months === 1 ? '' : 's'} remaining. Advance time to travel.`,
  });
  return { state: finalize(next), error: null };
}

export function progressTravelInPlace(state, rng) {
  const travel = state.world?.activeTravel;
  if (!travel) return;
  travel.monthsRemaining -= 1;
  state.heroes
    .filter((hero) => hero.status === 'available')
    .forEach((hero) => {
      hero.fatigue = clamp(hero.fatigue + rng.int(1, 4), 0, 100);
    });
  if (travel.monthsRemaining > 0) return;
  const destination = LOCATION_BY_ID[travel.toId] || LOCATION_BY_ID.dunmere;
  state.world.currentLocationId = destination.id;
  state.world.visitedLocationIds ||= [];
  if (!state.world.visitedLocationIds.includes(destination.id)) state.world.visitedLocationIds.push(destination.id);
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

export function monthlyUpkeep(state) {
  const wages = state.heroes.filter((hero) => !['retired', 'dead', 'candidate'].includes(hero.status)).reduce((sum, hero) => sum + hero.salary, 0);
  const facilityUpkeep = Object.values(state.guild.facilities).reduce((sum, level) => sum + level * 8, 0);
  const appointmentUpkeep = Object.keys(state.guild.appointments).length * 7;
  return wages + facilityUpkeep + appointmentUpkeep;
}

export function getPatronLoanOffer(state) {
  const upkeep = monthlyUpkeep(state);
  const crowns = state.guild.crowns;
  const distressed = crowns < Math.max(100, upkeep * 2);
  const amount = Math.ceil((300 + upkeep * 2 + Math.max(0, -crowns)) / 10) * 10;
  const repayment = Math.round(amount * (1 + LOAN_INTEREST));
  const remaining = (state.guild.loan?.remaining || 0) + repayment;
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
    text: `A patron advances ${offer.amount} crowns. The guild owes ${remaining} crowns, repaid at ${offer.installment} per month.`,
    tags: ['treasury', 'loan'],
  });
  next.notifications.push({
    id: `loan-${next.date.year}-${next.date.month}-${next.stats.patronLoans}`,
    tone: 'gold',
    title: 'Patron loan accepted',
    text: `+${offer.amount} crowns now. Repay ${offer.installment} per month until ${remaining} is cleared.`,
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

export function upgradeFacility(state, facilityId) {
  const next = clone(state);
  const facility = FACILITIES.find((item) => item.id === facilityId);
  if (!facility) return { state, error: 'Unknown facility.' };
  if (facility.unlock && next.guild.tierIndex < tierIndexByName(facility.unlock))
    return { state, error: `${facility.name} unlocks at ${facility.unlock} tier.` };
  const level = next.guild.facilities[facilityId] || 0;
  if (level >= facility.max) return { state, error: `${facility.name} is already fully upgraded.` };
  if (level === 0 && usedFacilityRooms(next) >= headquartersRoomCapacity(next)) {
    return {
      state,
      error: `The headquarters has no free room. Reach a higher guild tier or expand the Great Hall first (${usedFacilityRooms(next)}/${headquartersRoomCapacity(next)} rooms occupied).`,
    };
  }
  const cost = Math.round(facility.baseCost * (1 + level * 0.72));
  if (next.guild.crowns < cost) return { state, error: `The upgrade requires ${cost} crowns.` };
  next.guild.crowns -= cost;
  next.guild.facilities[facilityId] = level + 1;
  next.guild.legacy += 2 + level;
  addChronicle(next, {
    type: 'facility',
    importance: level + 1 >= 3 ? 2 : 1,
    title: `${facility.name} reaches level ${level + 1}`,
    text: `${facility.description} ${facility.effect}.`,
    tags: ['facility'],
  });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}
