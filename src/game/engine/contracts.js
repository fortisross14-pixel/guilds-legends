// @ts-check
// Hero contracts (length, salary, expiry, renewal talks), candidate scouting
// ranges, and rivals approaching disloyal heroes.
import { RARITIES } from '../../data/world.js';
import { addChronicle, addHeroHistory, campaignMonthSerial, clamp, clone, finalize, getHero, hashString, operationalLocationIds, roomLevel, tallyGuild } from './core.js';
import { releaseHeroInPlace } from './institution.js';
import { charterEffect } from './charter.js';
import { nemesisIds, recordRivalryInPlace } from './rivalry.js';

export const CONTRACT_LENGTHS = [1, 2, 3];
/** Longer contracts trade commitment for a lower monthly salary. */
export const CONTRACT_SALARY_FACTOR = { 1: 1, 2: 0.93, 3: 0.87 };
export const CONTRACT_WARNING_MONTHS = 3;
export const RENEWAL_WINDOW_MONTHS = 12;
export const RENEWAL_REFUSAL_LOYALTY = 25;
export const POACH_LOYALTY = 40;
/** Candidate stat range (± points) by scouting level 0–3. */
export const SCOUT_RANGE = [15, 9, 4, 0];
export const MAX_SCOUT_LEVEL = 3;

/** The salary a hero's level, potential and rarity justify (same rule as hiring). */
export function baseSalaryFor(hero, state = null) {
  // Merchant House heroes know what the guild can pay.
  const charter = state ? charterEffect(state, 'salary') : 1;
  return Math.max(12, Math.round((18 + (hero.level || 1) * 7 + Math.max(0, (hero.potential || 70) - 70) * 0.45) * (RARITIES[hero.rarity]?.salary || 1) * charter));
}

export function contractSalary(baseSalary, years) {
  return Math.max(1, Math.round(baseSalary * (CONTRACT_SALARY_FACTOR[years] || 1)));
}

export function makeContract(state, baseSalary, years, startSerial = campaignMonthSerial(state)) {
  return { years, salary: contractSalary(baseSalary, years), startSerial, endSerial: startSerial + years * 12 };
}

/** Months until the contract ends (null for the founder and other uncontracted heroes). */
export function contractMonthsLeft(state, hero) {
  return hero?.contract ? hero.contract.endSerial - campaignMonthSerial(state) : null;
}

/** What a hero asks for to renew: salary rises when loyalty is low; very disloyal heroes refuse. */
export function renewalTerms(state, hero) {
  const left = contractMonthsLeft(state, hero);
  const base = baseSalaryFor(hero, state);
  const mood = hero.loyalty >= 70 ? 1 : hero.loyalty >= 45 ? 1.15 : 1.3;
  return {
    monthsLeft: left,
    open: left !== null && left <= RENEWAL_WINDOW_MONTHS,
    refuses: (hero.loyalty ?? 100) < RENEWAL_REFUSAL_LOYALTY,
    options: CONTRACT_LENGTHS.map((years) => ({ years, salary: Math.round(contractSalary(base, years) * mood), bonus: Math.round(base * 2 * years) })),
  };
}

export function renewContract(state, heroId, years) {
  const hero = state.heroes.find((item) => item.id === heroId);
  if (!hero?.contract) return { state, error: 'This hero has no contract to renew.' };
  const terms = renewalTerms(state, hero);
  if (!terms.open) return { state, error: `Renewal talks open in the last ${RENEWAL_WINDOW_MONTHS} months of a contract.` };
  if (terms.refuses) return { state, error: `${hero.name} refuses to talk. Raise their loyalty first.` };
  const option = terms.options.find((item) => item.years === years);
  if (!option) return { state, error: 'Choose a contract length of 1 to 3 years.' };
  if (state.guild.crowns < option.bonus) return { state, error: `The signing bonus is ${option.bonus} gold.` };
  const next = clone(state);
  const renewed = next.heroes.find((item) => item.id === heroId);
  next.guild.crowns -= option.bonus;
  const start = Math.max(renewed.contract.endSerial, campaignMonthSerial(next));
  renewed.contract = { years, salary: option.salary, startSerial: start, endSerial: start + years * 12 };
  renewed.salary = option.salary;
  renewed.loyalty = clamp(renewed.loyalty + 5, 0, 100);
  delete renewed.contractWarned;
  addHeroHistory(renewed, next, {
    type: 'contract',
    title: `Renewed for ${years} year${years === 1 ? '' : 's'}`,
    text: `New salary ${option.salary} gold a month, bonus ${option.bonus}.`,
  });
  return { state: finalize(next), error: null };
}

/** Answer a rival's approach with a 20% raise: +15 loyalty and the approach ends. */
export function counterOffer(state, heroId) {
  const hero = state.heroes.find((item) => item.id === heroId);
  if (!hero?.poachApproach) return { state, error: 'No rival is courting this hero.' };
  const next = clone(state);
  const target = next.heroes.find((item) => item.id === heroId);
  target.salary = Math.round(target.salary * 1.2);
  if (target.contract) target.contract.salary = target.salary;
  target.loyalty = clamp(target.loyalty + 15, 0, 100);
  addHeroHistory(target, next, {
    type: 'contract',
    title: `Stayed despite ${target.poachApproach.rivalName}`,
    text: `A raise to ${target.salary} gold a month kept them.`,
  });
  delete target.poachApproach;
  return { state: finalize(next), error: null };
}

// ---------------------------------------------------------------- scouting ranges

export function candidateScoutLevel(state, candidate) {
  if (roomLevel(state, 'scouts') >= 3) return MAX_SCOUT_LEVEL;
  return clamp((candidate.scoutLevel || 0) + Math.min(1, roomLevel(state, 'scouts')), 0, MAX_SCOUT_LEVEL);
}

/** Stat ranges the guild knows for a candidate. The true value is always inside. */
export function candidateRanges(state, candidate) {
  const level = candidateScoutLevel(state, candidate);
  const width = SCOUT_RANGE[level];
  const range = (key, value) => {
    if (!width) return [value, value];
    const low = value - (hashString(`${candidate.id}:${key}`) % (2 * width + 1));
    return [Math.max(1, low), low + 2 * width];
  };
  // Potential is always at least power + 3, so its range never shows below power's
  // (both ranges still hold the true values).
  const power = range('power', candidate.power);
  const rawPotential = range('potential', candidate.potential);
  const potential = width ? [Math.max(rawPotential[0], Math.min(candidate.potential, power[0] + 3)), Math.max(rawPotential[1], power[1] + 3)] : rawPotential;
  return {
    level,
    exact: width === 0,
    power,
    potential,
    attributes: Object.fromEntries(Object.entries(candidate.attributes || {}).map(([key, value]) => [key, range(key, value)])),
  };
}

/** Monthly scouting narrows the ranges of candidates where the guild operates. */
export function scoutCandidatesInPlace(state, scouts) {
  if (!scouts) return;
  // The Scout table's ledgers make every report count for more.
  const gain = (scouts >= 3 ? 2 : 1) + (roomLevel(state, 'scouts') ? 1 : 0);
  const where = operationalLocationIds(state);
  (state.candidates || [])
    .filter((candidate) => where.has(candidate.locationId || 'dunmere'))
    .forEach((candidate) => {
      candidate.scoutLevel = clamp((candidate.scoutLevel || 0) + gain, 0, MAX_SCOUT_LEVEL);
    });
}

// ---------------------------------------------------------------- monthly processing

function moveToRivalInPlace(state, hero, rival) {
  tallyGuild(state, 'poached');
  releaseHeroInPlace(state, hero, {
    title: `Joined ${rival.name}`,
    text: `Poached by ${rival.name} after loyalty ran out.`,
    chronicleText: `${hero.name} accepts an offer from ${rival.name} and leaves the guild.`,
  });
  const index = (state.freeAgents || []).findIndex((item) => item.id === hero.id);
  if (index < 0) return;
  const [moved] = state.freeAgents.splice(index, 1);
  moved.guildId = rival.id;
  moved.status = 'active';
  delete moved.poachApproach;
  rival.members ||= [];
  rival.members.push(moved);
  recordRivalryInPlace(state, rival.id, 'poachedFromUs');
  rival.recent = [...(rival.recent || []).slice(-8), `${moved.name} joined from ${state.guild.name}.`];
}

/** Contract warnings and expiry (run when a month starts). */
export function processContractsInPlace(state) {
  state.heroes
    .filter((hero) => hero.contract && !['dead', 'retired'].includes(hero.status))
    .forEach((hero) => {
      const left = contractMonthsLeft(state, hero);
      if (left <= CONTRACT_WARNING_MONTHS && left > 0 && !hero.contractWarned) {
        hero.contractWarned = true;
        state.notifications.push({
          id: `contract-${hero.id}-${hero.contract.endSerial}`,
          tone: 'gold',
          title: `${hero.name}'s contract ends soon`,
          text: `${left} month${left === 1 ? '' : 's'} left. Open renewal talks from the hero's status screen.`,
        });
      }
      if (left > 0) return;
      if (hero.id === state.guild.currentGuildmasterHeroId) {
        // The guildmaster stays on: a quiet one-year extension at the same pay.
        hero.contract = { ...hero.contract, years: 1, startSerial: hero.contract.endSerial, endSerial: hero.contract.endSerial + 12 };
        delete hero.contractWarned;
        return;
      }
      if (['mission', 'tournament'].includes(hero.status)) return; // leaves when back
      state.notifications.push({
        id: `contract-expired-${hero.id}`,
        tone: 'red',
        title: `${hero.name} leaves`,
        text: 'The contract expired without renewal. They join the free agents.',
      });
      tallyGuild(state, 'released');
      releaseHeroInPlace(state, hero, {
        title: 'Contract expired',
        text: `The contract with ${state.guild.name} ran out; the hero enters the open circuit.`,
        chronicleText: `${hero.name}'s contract expires and they become a free agent.`,
      });
    });
}

/**
 * Rivals court heroes whose loyalty is below POACH_LOYALTY. The first month
 * brings an approach (answer with a counter-offer); if loyalty is still low
 * next month, the hero leaves for that rival.
 */
export function processPoachingInPlace(state, rng) {
  const candidates = state.heroes.filter(
    (hero) => !['dead', 'retired'].includes(hero.status) && hero.id !== state.guild.currentGuildmasterHeroId && hero.id !== state.guild.founderHeroId,
  );
  candidates.forEach((hero) => {
    if (hero.poachApproach) {
      const rival = state.rivals.find((item) => item.id === hero.poachApproach.rivalId);
      if (hero.loyalty < POACH_LOYALTY && rival && !['mission', 'tournament'].includes(hero.status)) {
        state.notifications.push({ id: `poached-${hero.id}`, tone: 'red', title: `${hero.name} was poached`, text: `${rival.name} signed them away.` });
        moveToRivalInPlace(state, hero, rival);
      } else if (hero.loyalty >= POACH_LOYALTY) {
        addHeroHistory(hero, state, { type: 'contract', title: `Turned down ${hero.poachApproach.rivalName}`, text: 'Loyalty to the guild won out.' });
        delete hero.poachApproach;
      }
      return;
    }
    if (hero.loyalty >= POACH_LOYALTY || !state.rivals.length) return;
    const nemeses = nemesisIds(state)
      .map((id) => state.rivals.find((rival) => rival.id === id))
      .filter(Boolean);
    const pressure = nemeses.length ? 1.5 : 1;
    if (!rng.chance(clamp(((POACH_LOYALTY - hero.loyalty) / 100 + (hero.level || 1) / 100) * pressure, 0, 0.75))) return;
    const suitors = state.rivals.filter((rival) => (rival.leagueTierIndex ?? rival.tierIndex) >= state.guild.tierIndex);
    const rival = nemeses.length ? rng.pick(nemeses) : rng.pick(suitors.length ? suitors : state.rivals);
    hero.poachApproach = { rivalId: rival.id, rivalName: rival.name, serial: campaignMonthSerial(state) };
    state.notifications.push({
      id: `approach-${hero.id}-${campaignMonthSerial(state)}`,
      tone: 'red',
      title: `${rival.name} is courting ${hero.name}`,
      text: 'Loyalty is low. Make a counter-offer from the hero status screen within a month, or lose them.',
    });
    addChronicle(state, {
      type: 'rival',
      importance: 1,
      title: `${rival.name} approaches ${hero.name}`,
      text: `${hero.name} is unhappy, and ${rival.name} has noticed.`,
      heroIds: [hero.id],
      guildIds: [rival.id],
      tags: ['rival', 'poaching'],
    });
  });
}

/** Is this hero one the player could make an offer to? (rival members or free agents) */
export function offerTerms(state, heroId) {
  const hero = getHero(state, heroId);
  if (!hero || state.heroes.some((item) => item.id === heroId)) return { available: false, reason: 'Already in your guild.' };
  const rival = state.rivals.find((item) => item.star?.id === heroId || (item.members || []).some((member) => member.id === heroId));
  const freeAgent = (state.freeAgents || []).some((item) => item.id === heroId);
  if (!rival && !freeAgent) return { available: false, reason: 'This hero is not signable.' };
  if (['dead', 'retired'].includes(hero.status)) return { available: false, reason: 'This hero has left active service.' };
  const fee = Math.round((hero.level * 90 + hero.power * 4 + (hero.renown || 0) * 2) * (RARITIES[hero.rarity]?.signing || 1) * (freeAgent ? 0.6 : 1.4));
  const chance = freeAgent ? 0.85 : clamp(0.1 + (70 - (hero.loyalty ?? 60)) / 80 + ((state.guild.fame || 0) - (rival.fame || 0)) / 3000, 0.05, 0.8);
  const triedThisYear = hero.offerYear === state.date.year;
  return {
    available: !triedThisYear,
    reason: triedThisYear ? `${hero.name} already refused an offer this year.` : null,
    fee,
    chance: Math.round(chance * 100) / 100,
    rival: rival ? { id: rival.id, name: rival.name } : null,
    freeAgent,
  };
}
