// @ts-check
// Recruitment market (candidates per location) and recruitment promises.
import { normalizeClassId, MONTHS } from '../../data/content.js';
import { RARITIES, unlockedLocations } from '../../data/world.js';
import { addChronicle, addHeroHistory, campaignMonthSerial, clamp, dateLabel } from './core.js';
import { generateHero } from './heroes.js';

function promiseDeadlineLabel(serial) {
  const year = Math.floor(serial / 12);
  const month = serial % 12;
  return `${MONTHS[month]} ${year}`;
}

export function candidateDemandFor(hero, state, rng) {
  if (hero.level <= 1 && hero.rarity === 'Common' && rng.chance(0.35)) return null;
  const dream = hero.dream || '';
  let kind = 'formation';
  let formationType = null;
  let label = '';
  let description = '';
  if (['Become champion', 'Surpass a famous parent'].includes(dream) || (hero.classId === 'Duelist' && rng.chance(0.45))) {
    kind = 'tournament';
    label = 'A place in the arena';
    description = 'Enter this hero in an individual tournament before the promise expires.';
  } else {
    if (dream === 'Map the world' || dream === 'Recover a lost artifact' || ['Ranger', 'Artificer', 'Scholar'].includes(normalizeClassId(hero.classId)))
      formationType = 'Expedition';
    else if (dream === 'Save a kingdom' || ['Scholar', 'Cleric'].includes(normalizeClassId(hero.classId))) formationType = 'Diplomacy';
    else if (hero.classId === 'Rogue') formationType = 'Intrigue';
    else formationType = 'Combat';
    label = `${formationType} opportunity`;
    description = `Field this hero in ${['Expedition', 'Intrigue'].includes(formationType) ? 'an' : 'a'} ${formationType.toLowerCase()} mission before the promise expires.`;
  }
  const duration = hero.rarity === 'Legend' ? 8 : hero.rarity === 'Epic' ? 10 : 12;
  const dueSerial = campaignMonthSerial(state) + duration;
  return {
    id: `promise-${hero.id}`,
    kind,
    formationType,
    label,
    description,
    dueSerial,
    dueLabel: promiseDeadlineLabel(dueSerial),
    status: 'offered',
  };
}

function promiseMatches(promise, eventType, details = {}) {
  if (!promise || promise.status !== 'active') return false;
  if (promise.kind === 'tournament') return eventType === 'tournament';
  if (promise.kind === 'formation') return eventType === 'mission' && promise.formationType === details.formationType;
  return false;
}

export function fulfillPromisesInPlace(state, hero, eventType, details = {}) {
  (hero.promises || []).forEach((promise) => {
    if (!promiseMatches(promise, eventType, details)) return;
    promise.status = 'fulfilled';
    promise.fulfilledSerial = campaignMonthSerial(state);
    promise.fulfilledLabel = dateLabel(state);
    hero.loyalty = clamp(hero.loyalty + 5, 0, 100);
    hero.morale = clamp(hero.morale + 3, 0, 100);
    addHeroHistory(hero, state, { type: 'promise', title: `Promise fulfilled: ${promise.label}`, text: promise.description });
    state.notifications.push({
      id: `promise-fulfilled-${hero.id}-${promise.id}`,
      tone: 'green',
      title: `${hero.name}: promise fulfilled`,
      text: `${promise.label} strengthens loyalty to the guild.`,
    });
  });
}

export function updatePromiseDeadlinesInPlace(state) {
  const now = campaignMonthSerial(state);
  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    (hero.promises || []).forEach((promise) => {
      if (promise.status !== 'active' || now < promise.dueSerial) return;
      promise.status = 'broken';
      promise.brokenSerial = now;
      hero.loyalty = clamp(hero.loyalty - 16, 0, 100);
      hero.morale = clamp(hero.morale - 9, 0, 100);
      addHeroHistory(hero, state, {
        type: 'promise-broken',
        title: `Broken promise: ${promise.label}`,
        text: `The guild failed to deliver before ${promise.dueLabel}.`,
      });
      state.notifications.push({
        id: `promise-broken-${hero.id}-${promise.id}`,
        tone: 'red',
        title: `${hero.name}: promise broken`,
        text: `${promise.label} was not honored. Loyalty falls sharply.`,
      });
      if (hero.rarity === 'Legend' || hero.rarity === 'Epic')
        addChronicle(state, {
          type: 'relationship',
          importance: 2,
          title: `${hero.name} accuses the guild of breaking its word`,
          text: `${promise.label} was promised when ${hero.name} signed, but the deadline passed.`,
          heroIds: [hero.id],
          tags: ['promise', 'broken'],
        });
    });
  });
}

export function makeCandidate(state, rng, forcedQuality, locationId = state.world?.currentLocationId || 'dunmere') {
  const academyLevel = state.guild.facilities['academy'] || 0;
  const scoutLevel = state.guild.facilities['scout-office'] || 0;
  const spymasterBonus = state.guild.appointments?.Spymaster ? 0.08 : 0;
  const qualityRoll = rng.next() + academyLevel * 0.08 + scoutLevel * 0.05 + spymasterBonus;
  const quality = forcedQuality || (qualityRoll > 1.12 ? 'elite' : qualityRoll > 0.92 ? 'veteran' : 'normal');
  const hero = generateHero(state, rng, quality, { homeLocationId: locationId });
  const rarityFactor = RARITIES[hero.rarity]?.signing || 1;
  const signingFee = Math.round((hero.level * 85 + hero.power * 3.5 + Math.max(0, hero.potential - 70) * 10) * rarityFactor);
  return {
    ...hero,
    status: 'candidate',
    locationId,
    channel:
      academyLevel > 0 && hero.age <= 20 && rng.chance(0.35)
        ? 'Academy'
        : scoutLevel > 0 && rng.chance(0.35)
          ? 'Scout network'
          : rng.pick(['Tavern board', 'Mercenary market', 'Temple recommendation', 'Defector rumor']),
    signingFee,
    buyoutFee: Math.round(signingFee * (hero.rarity === 'Legend' ? 0.65 : hero.rarity === 'Epic' ? 0.5 : 0.35)),
    demand: candidateDemandFor(hero, state, rng),
    expiresYear: state.date.year + 1,
    interest: clamp(63 + state.guild.tierIndex * 10 + Math.round(state.guild.fame / 110) - hero.level * 1.6 - (hero.rarity === 'Legend' ? 12 : 0), 20, 98),
  };
}

export function refreshCandidatesForLocationInPlace(state, rng, locationId = state.world?.currentLocationId || 'dunmere') {
  const unlockedIds = new Set(unlockedLocations(state.guild.tierIndex).map((location) => location.id));
  state.candidates = (state.candidates || []).filter(
    (candidate) => candidate.expiresYear >= state.date.year && unlockedIds.has(candidate.locationId || 'dunmere'),
  );
  const current = state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === locationId).length;
  const target = 3 + Math.min(2, state.guild.facilities['scout-office'] || 0);
  for (let i = current; i < target; i += 1) state.candidates.push(makeCandidate(state, rng, null, locationId));
  state.candidates.sort((a, b) => b.rarity.localeCompare(a.rarity) || b.level - a.level || b.potential - a.potential);
  state.candidates = state.candidates.slice(0, 60);
}
