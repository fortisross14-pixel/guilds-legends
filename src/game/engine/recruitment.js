// @ts-check
// Player roster actions: recruit, release, refound, training, appointments, identity.
import { APPOINTMENTS, CLASSES } from '../../data/content.js';
import { LOCATION_BY_ID, PRIMALS, RARITIES } from '../../data/world.js';
import {
  activeHeroCount,
  addChronicle,
  addHeroHistory,
  campaignMonthSerial,
  clone,
  commitRng,
  completeTutorialTargetInPlace,
  finalize,
  getCurrentLocation,
  getHero,
  heroCapacity,
  isGuildDefunct,
  operationalLocationIds,
  rngFor,
  uid,
  pushMoment,
  clamp,
} from './core.js';
import { createHeroFromBase, generateHero } from './heroes.js';
import { candidateDemandFor, refreshCandidatesForLocationInPlace } from './candidates.js';
import { releaseHeroInPlace } from './institution.js';
import { CONTRACT_LENGTHS, baseSalaryFor, makeContract, offerTerms } from './contracts.js';
import { evaluateStateInPlace } from './goals.js';

// Raises a new founder (level 1, the new guildmaster) plus one free local
// recruit, keeping the guild's name, treasury, history and rankings.
export function refoundGuild(state, options = {}) {
  if (!isGuildDefunct(state)) return { state, error: 'The guild still has active heroes.' };
  const founderName = String(options.founderName || '')
    .trim()
    .slice(0, 36);
  if (!founderName) return { state, error: 'The new founder needs a name.' };
  const next = clone(state);
  const rng = rngFor(next, 'refound');
  const locationId = next.world?.currentLocationId || 'dunmere';
  const classId = CLASSES[options.founderClass] ? options.founderClass : 'Guardian';
  const primal = PRIMALS[options.founderPrimal] ? options.founderPrimal : LOCATION_BY_ID[locationId]?.primal || 'Fire';
  const priorGuildmaster = getHero(next, next.guild.currentGuildmasterHeroId);
  const founder = createHeroFromBase(
    {
      id: uid('founder', rng),
      name: founderName,
      classId,
      primal,
      rarity: 'Rare',
      level: 1,
      xp: 0,
      age: 26,
      power: 48,
      potential: 84,
      personality: 'Determined',
      flaw: 'Pride',
      dream: 'Build a guild that outlives me',
      origin: `Refounder of ${next.guild.name}`,
      homeLocationId: locationId,
      loyalty: 100,
      hook: `${founderName} raised the fallen banner of ${next.guild.name} when no one else remained.`,
      hiddenTrait: 'None',
    },
    next,
    rng,
    { homeLocationId: locationId },
  );
  founder.salary = 0;
  const recruit = generateHero(next, rng, 'normal', { homeLocationId: locationId });
  recruit.loyalty = Math.max(recruit.loyalty, 60);
  recruit.contract = makeContract(next, recruit.salary, 2);
  recruit.salary = recruit.contract.salary;
  next.heroes.push(founder, recruit);
  pushMoment(next, {
    type: 'recruit',
    heroId: recruit.id,
    name: recruit.name,
    classId: recruit.classId,
    primal: recruit.primal,
    rarity: recruit.rarity,
    level: recruit.level,
    personality: recruit.personality,
    hook: recruit.hook,
  });
  addHeroHistory(founder, next, {
    type: 'founding',
    title: `Refounded ${next.guild.name}`,
    text: `Took up the banner after ${priorGuildmaster?.name || 'the last guildmaster'} and the old company were gone.`,
  });
  addHeroHistory(recruit, next, {
    type: 'joined',
    title: `Joined ${next.guild.name}`,
    text: `Answered ${founderName}'s call to refound the guild, without a signing fee.`,
  });
  next.guild.currentGuildmasterHeroId = founder.id;
  next.guild.successorHeroId = null;
  next.stats.refoundings = (next.stats.refoundings || 0) + 1;
  next.legacy ||= { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] };
  next.legacy.successionHistory.unshift({
    year: next.date.year,
    month: next.date.month,
    fromHeroId: priorGuildmaster?.id || null,
    fromName: priorGuildmaster?.name || next.guild.founder,
    toHeroId: founder.id,
    toName: founder.name,
    refounded: true,
  });
  addChronicle(next, {
    type: 'founding',
    importance: 5,
    title: `${founderName} refounds ${next.guild.name}`,
    text: `With every hero of the old company gone, ${founderName} and ${recruit.name} raise the banner again in ${LOCATION_BY_ID[locationId]?.name || 'the city'}.`,
    heroIds: [founder.id, recruit.id],
    tags: ['founding', 'refounding', 'era'],
  });
  next.notifications.push({
    id: `refound-${next.date.year}-${next.date.month}`,
    tone: 'gold',
    title: 'The banner rises again',
    text: `${founderName} leads ${next.guild.name}, with ${recruit.name} as the first companion.`,
  });
  commitRng(next, rng);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

// years: contract length 1–3 (longer = lower monthly salary).
export function recruitCandidate(state, candidateId, negotiation = 'accept', years = 2) {
  const next = clone(state);
  const index = next.candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index < 0) return { state, error: 'This candidate has left the region.' };
  const candidate = next.candidates[index];
  const currentLocationId = next.world?.currentLocationId || 'dunmere';
  if (!operationalLocationIds(next).has(candidate.locationId || 'dunmere')) {
    const location = LOCATION_BY_ID[candidate.locationId];
    return {
      state,
      error: `${candidate.name} is currently in ${location?.name || 'another settlement'}. Travel there or open a branch before negotiating a contract.`,
    };
  }
  if (
    next.world?.activeTravel &&
    !(next.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === (candidate.locationId || 'dunmere'))
  )
    return { state, error: 'Headquarters is traveling; recruitment can continue only through established branches.' };
  if (activeHeroCount(next) >= heroCapacity(next)) return { state, error: 'The Great Hall has no room for another active hero.' };
  const acceptingPromise = negotiation !== 'buyout' || !candidate.demand;
  const totalFee = candidate.signingFee + (!acceptingPromise ? candidate.buyoutFee || 0 : 0);
  if (next.guild.crowns < totalFee) return { state, error: `Recruitment requires ${totalFee} crowns.` };
  if (candidate.interest < 35 && next.guild.tierIndex === 0)
    return { state, error: `${candidate.name} does not believe the guild can fulfill their ambitions yet.` };
  next.guild.crowns -= totalFee;
  const hero = clone(candidate);
  const acceptedDemand = acceptingPromise && candidate.demand ? { ...candidate.demand, status: 'active', acceptedSerial: campaignMonthSerial(next) } : null;
  const recruitedLocationId = hero.locationId || currentLocationId;
  delete hero.signingFee;
  delete hero.buyoutFee;
  delete hero.demand;
  delete hero.channel;
  delete hero.expiresYear;
  delete hero.interest;
  delete hero.locationId;
  hero.homeLocationId = recruitedLocationId;
  hero.status = 'available';
  hero.guildId = 'player';
  hero.joinedYear = next.date.year;
  hero.contract = makeContract(next, hero.salary, CONTRACT_LENGTHS.includes(years) ? years : 2);
  hero.salary = hero.contract.salary;
  delete hero.scoutLevel;
  hero.promises = acceptedDemand ? [acceptedDemand] : [];
  addHeroHistory(hero, next, {
    type: 'joined',
    title: `Joined ${next.guild.name}`,
    text: `Recruited through ${candidate.channel} in ${LOCATION_BY_ID[recruitedLocationId]?.name || getCurrentLocation(next).name} as a level ${hero.level} ${hero.rarity} ${hero.primal} ${hero.classId}.${acceptedDemand ? ` The guild promised: ${acceptedDemand.label}.` : candidate.demand && !acceptingPromise ? ' The guild paid a premium for an unconditional contract.' : ''}`,
  });
  const wasFoundingSolo = activeHeroCount(next) === 1 && !next.flags.firstCompanionHired;
  next.heroes.push(hero);
  pushMoment(next, {
    type: 'recruit',
    heroId: hero.id,
    name: hero.name,
    classId: hero.classId,
    primal: hero.primal,
    rarity: hero.rarity,
    level: hero.level,
    personality: hero.personality,
    hook: hero.hook,
  });
  next.candidates.splice(index, 1);
  if (wasFoundingSolo) {
    next.flags.firstCompanionHired = true;
    next.candidates
      .filter((remaining) => (remaining.locationId || 'dunmere') === currentLocationId)
      .forEach((remaining) => {
        remaining.signingFee = Math.max(120, Math.round((remaining.level * 80 + remaining.power * 3) * (RARITIES[remaining.rarity]?.signing || 1)));
        remaining.buyoutFee = Math.round(remaining.signingFee * (remaining.rarity === 'Legend' ? 0.65 : remaining.rarity === 'Epic' ? 0.5 : 0.35));
        remaining.channel = 'Tavern board';
        remaining.hook = remaining.hook.replace(' Will join the founding pair without a signing fee.', '');
        if (!remaining.demand) {
          const rr = rngFor(next, `post-founder-demand-${remaining.id}`);
          remaining.demand = candidateDemandFor(remaining, next, rr);
        }
      });
    completeTutorialTargetInPlace(next, 'recruitCompanion');
  }
  addChronicle(next, {
    type: 'recruitment',
    importance: wasFoundingSolo ? 4 : hero.rarity === 'Legend' ? 4 : hero.rarity === 'Epic' ? 3 : 1,
    title: `${hero.name} joins the guild`,
    text: wasFoundingSolo
      ? `${hero.name}, a level ${hero.level} ${hero.rarity} ${hero.primal} ${hero.classId}, becomes ${next.guild.founder}’s first companion.`
      : `The level ${hero.level} ${hero.rarity} ${hero.primal} ${hero.classId} signs for ${totalFee} crowns in ${LOCATION_BY_ID[recruitedLocationId]?.name || getCurrentLocation(next).name}.${acceptedDemand ? ` The contract includes a promise: ${acceptedDemand.label}.` : candidate.demand && !acceptingPromise ? ' A buyout premium removes the candidate’s original career demand.' : ''}`,
    heroIds: [hero.id, ...(wasFoundingSolo ? [next.guild.founderHeroId] : [])],
    tags: ['recruitment', hero.rarity, hero.primal, ...(acceptedDemand ? ['promise'] : []), ...(wasFoundingSolo ? ['founding-companion'] : [])],
  });
  const rng = rngFor(next, `recruit-${candidateId}`);
  refreshCandidatesForLocationInPlace(next, rng, currentLocationId);
  commitRng(next, rng);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function releaseHero(state, heroId) {
  const next = clone(state);
  const hero = next.heroes.find((item) => item.id === heroId);
  if (!hero || ['dead', 'retired', 'mission', 'tournament'].includes(hero.status)) return { state, error: 'This hero cannot be released now.' };
  if (hero.id === next.guild.currentGuildmasterHeroId) return { state, error: 'The current guildmaster cannot be released while leading the institution.' };
  releaseHeroInPlace(next, hero, {
    title: `Released by ${next.guild.name}`,
    text: 'The hero enters the open circuit as a free agent; the career may continue elsewhere.',
    chronicleText: `The contract ends after ${hero.career.serviceYears} years of service. ${hero.name} becomes a free agent.`,
  });
  return { state: finalize(next), error: null };
}

export function setHeroTraining(state, heroId, training) {
  const next = clone(state);
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return next;
  hero.training = training;
  return finalize(next);
}

export function setHeroMonthlyActivity(state, heroId, activity) {
  const allowed = ['Training', 'Rest', 'Infirmary', 'Scouting', 'Public Exhibition', 'Guild Duty'];
  const next = clone(state);
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired', 'mission', 'tournament'].includes(hero.status) || !allowed.includes(activity)) return next;
  hero.monthlyActivity = activity;
  return finalize(next);
}

export function renameGuild(state, name) {
  const clean = String(name || '')
    .trim()
    .slice(0, 38);
  if (!clean) return { state, error: 'Guild name cannot be empty.' };
  if (clean === state.guild.name) return { state, error: null };
  const next = clone(state);
  const oldName = next.guild.name;
  next.guild.name = clean;
  addChronicle(next, {
    type: 'identity',
    importance: 2,
    title: `${oldName} becomes ${clean}`,
    text: `The guild formally adopts a new name while preserving the same charter and history.`,
    tags: ['identity', 'rename'],
  });
  return { state: finalize(next), error: null };
}

export function renameFounderHero(state, name) {
  const clean = String(name || '')
    .trim()
    .slice(0, 36);
  if (!clean) return { state, error: 'Founder name cannot be empty.' };
  const next = clone(state);
  const founder = getHero(next, next.guild.founderHeroId);
  if (!founder) return { state, error: 'The founder could not be found.' };
  if (clean === founder.name) return { state, error: null };
  const oldName = founder.name;
  founder.name = clean;
  next.guild.founder = clean;
  addHeroHistory(founder, next, { type: 'identity', title: `Known as ${clean}`, text: `The guild records were amended from ${oldName} to ${clean}.` });
  addChronicle(next, {
    type: 'identity',
    importance: 1,
    title: `${oldName} is now recorded as ${clean}`,
    text: `The founder’s name is updated throughout the living chronicle.`,
    heroIds: [founder.id],
    tags: ['identity', 'rename'],
  });
  return { state: finalize(next), error: null };
}

export function appointHero(state, heroId, appointmentId) {
  const next = clone(state);
  const hero = getHero(next, heroId);
  if (!hero || hero.status !== 'available') return { state, error: 'Only an available active hero can receive an appointment.' };
  if (!APPOINTMENTS.some((item) => item.id === appointmentId)) return { state, error: 'Unknown appointment.' };
  if (appointmentId === 'Master Healer' && (next.guild.facilities.infirmary || 0) < 2) return { state, error: 'Master Healer requires Infirmary level 2.' };
  Object.entries(next.guild.appointments).forEach(([key, value]) => {
    if (value === heroId) delete next.guild.appointments[key];
  });
  const previousHeroId = next.guild.appointments[appointmentId];
  if (previousHeroId) {
    const previous = getHero(next, previousHeroId);
    if (previous) previous.appointment = null;
  }
  next.guild.appointments[appointmentId] = heroId;
  hero.appointment = appointmentId;
  addHeroHistory(hero, next, {
    type: 'appointment',
    title: `Appointed ${appointmentId}`,
    text: 'The hero now carries an institutional responsibility between missions.',
  });
  return { state: finalize(next), error: null };
}

export function chooseAlignment(state, alignment) {
  const allowed = ['Council', 'Baron', 'Independent'];
  if (!allowed.includes(alignment)) return { state, error: 'Choose the council, the baron or independence.' };
  const next = clone(state);
  if (next.guild.alignment !== 'Undeclared') return { state, error: 'The guild has already made its first political commitment.' };
  next.guild.alignment = alignment;
  next.stats.alignmentChosen = 1;
  const effects = {
    Council: { crowns: 160, fame: 4, text: 'Town contracts pay modestly but local trust grows faster.' },
    Baron: { crowns: 320, fame: 1, text: 'Noble contracts and political obligations arrive together.' },
    Independent: { crowns: 60, fame: 8, text: 'The guild keeps its freedom and earns popular respect.' },
  }[alignment];
  next.guild.crowns += effects.crowns;
  next.guild.fame += effects.fame;
  addChronicle(next, {
    type: 'politics',
    importance: 3,
    title: `${next.guild.name} chooses ${alignment === 'Independent' ? 'independence' : `the ${alignment.toLowerCase()}`}`,
    text: effects.text,
    tags: ['politics', alignment],
  });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function inspectHero(state, heroId) {
  const next = clone(state);
  if (getHero(next, heroId)) {
    next.flags.firstHeroInspected = true;
    completeTutorialTargetInPlace(next, 'inspectHero');
  }
  return finalize(next);
}

// ---------------------------------------------------------------- rooms and main party

export const MAIN_PARTY_SIZE = 4;
const BASIC_ROOMS = ['Training', 'Rest', 'Infirmary'];

/** Away heroes (mission, tournament, branch duty, or travelling with the guild) can't change rooms. */
export function isHeroAway(state, hero) {
  return ['mission', 'tournament'].includes(hero.status) || Boolean(hero.branchId) || Boolean(state.world?.activeTravel);
}

function homeHeroes(state) {
  return state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status) && !isHeroAway(state, hero));
}

/** "Send all idle heroes here": moves heroes from the basic rooms (training, barracks, infirmary). */
export function sendIdleHeroesTo(state, activity) {
  if (!BASIC_ROOMS.includes(activity)) return { state, error: 'Only the Training Grounds, Barracks and Infirmary take everyone.' };
  const next = clone(state);
  homeHeroes(next)
    .filter((hero) => BASIC_ROOMS.includes(hero.monthlyActivity || 'Training'))
    .filter((hero) => !(hero.status === 'injured' && activity !== 'Infirmary'))
    .forEach((hero) => {
      hero.monthlyActivity = activity;
    });
  return { state: finalize(next), error: null };
}

/** Injured to the Infirmary, fatigue over 60 to the Barracks, everyone else to training. */
export function autoAssignRooms(state) {
  const next = clone(state);
  homeHeroes(next).forEach((hero) => {
    hero.monthlyActivity = hero.status === 'injured' ? 'Infirmary' : (hero.fatigue || 0) > 60 ? 'Rest' : 'Training';
  });
  return { state: finalize(next), error: null };
}

export function setMainParty(state, heroIds) {
  const ids = [...new Set(heroIds)].filter((id) => state.heroes.some((hero) => hero.id === id && !['dead', 'retired'].includes(hero.status)));
  if (ids.length > MAIN_PARTY_SIZE) return { state, error: `The main party holds up to ${MAIN_PARTY_SIZE} heroes.` };
  const next = clone(state);
  next.guild.mainParty = ids;
  return { state: finalize(next), error: null };
}

export function toggleMainPartyMember(state, heroId) {
  const current = (state.guild.mainParty || []).filter((id) => state.heroes.some((hero) => hero.id === id && !['dead', 'retired'].includes(hero.status)));
  return setMainParty(state, current.includes(heroId) ? current.filter((id) => id !== heroId) : [...current, heroId]);
}

// ---------------------------------------------------------------- offers to rival heroes and free agents

/** Offer a contract to a rival hero or free agent. Success depends on their loyalty; one try per hero per year. */
export function makeOffer(state, heroId) {
  const terms = offerTerms(state, heroId);
  if (!terms.fee && !terms.available) return { state, error: terms.reason };
  if (!terms.available) return { state, error: terms.reason };
  if (activeHeroCount(state) >= heroCapacity(state)) return { state, error: 'The Great Hall has no room for another active hero.' };
  if (state.guild.crowns < terms.fee) return { state, error: `The offer costs ${terms.fee} gold.` };
  const next = clone(state);
  const rng = rngFor(next, `offer-${heroId}`);
  const accepted = rng.next() < terms.chance;
  commitRng(next, rng);
  const rival = terms.rival ? next.rivals.find((item) => item.id === terms.rival.id) : null;
  const target = rival
    ? [rival.star, ...(rival.members || [])].find((item) => item?.id === heroId)
    : (next.freeAgents || []).find((item) => item.id === heroId);
  if (!accepted) {
    target.offerYear = next.date.year;
    target.loyalty = clamp((target.loyalty ?? 60) + 5, 0, 100);
    next.notifications.push({
      id: `offer-refused-${heroId}-${next.date.year}`,
      tone: 'red',
      title: `${target.name} refuses`,
      text: rival ? `They stay with ${rival.name} this year.` : 'They want to stay on the open circuit for now.',
    });
    return { state: finalize(next), error: null, accepted: false };
  }
  next.guild.crowns -= terms.fee;
  if (rival) {
    if (rival.star?.id === heroId) {
      const members = [...(rival.members || [])].sort((a, b) => b.power - a.power);
      rival.star = members[0] || rival.star;
      rival.members = members.slice(1);
    } else rival.members = rival.members.filter((item) => item.id !== heroId);
    rival.recent = [...(rival.recent || []).slice(-8), `${target.name} left for ${next.guild.name}.`];
  } else next.freeAgents = next.freeAgents.filter((item) => item.id !== heroId);
  target.status = 'available';
  target.guildId = 'player';
  target.joinedYear = next.date.year;
  target.monthlyActivity = 'Training';
  target.training ||= 'Fundamentals';
  target.promises = [];
  target.loyalty = Math.max(target.loyalty ?? 50, 55);
  target.gear ||= { weapon: null, armor: null, accessory: null };
  target.contract = makeContract(next, baseSalaryFor(target), 2);
  target.salary = target.contract.salary;
  delete target.offerYear;
  next.heroes.push(target);
  addHeroHistory(target, next, {
    type: 'joined',
    title: `Joined ${next.guild.name}`,
    text: rival ? `Signed away from ${rival.name} for ${terms.fee} gold.` : `Signed from the open circuit for ${terms.fee} gold.`,
  });
  addChronicle(next, {
    type: 'recruitment',
    importance: rival ? 3 : 2,
    title: rival ? `${target.name} leaves ${rival.name} for ${next.guild.name}` : `${target.name} signs with ${next.guild.name}`,
    text: `A ${target.rarity} ${target.classId} joins for ${terms.fee} gold.`,
    heroIds: [target.id],
    tags: ['recruitment', 'poaching'],
  });
  pushMoment(next, {
    type: 'recruit',
    heroId: target.id,
    name: target.name,
    classId: target.classId,
    primal: target.primal,
    rarity: target.rarity,
    level: target.level,
    personality: target.personality,
    hook: target.hook,
  });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, accepted: true };
}
