// @ts-check
// People (Phase 7C, docs/UX.md "Buildings and people"). One model for everyone
// the guild can meet inside a building: a name, a role, a place (town,
// building, spot), a look, a memory, and offers: `hire`, `mission`,
// `challenge` (plus services such as a shop or an inn for the regulars).
//
// Nothing is duplicated: recruits ARE the candidates (state.candidates),
// petitioners hold the contracts (state.missions, grouped by issuer), and a
// challenger is a candidate who only joins after you beat them in a bout.
// Regulars come from src/data/people.js. Only memory is stored, in
// state.people[id] (met, talks, relationship, interview, last seen).
import { REGULARS, REGULAR_BY_ID, VISITOR_FIRST, VISITOR_LAST, PETITIONER_ROLES, FIRST_LINES, OFFER_LINES } from '../../data/people.js';
import { INTERIORS } from '../../data/interiors.js';
import { TOWNS } from '../../data/towns/index.js';
import { CLASSES, normalizeClassId } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { createDuelEncounter } from '../combat.js';
import { addChronicle, campaignMonthSerial, clamp, clone, commitRng, finalize, freeBeds, hashString, rngFor } from './core.js';
import { makeCandidate, recruitObjection } from './candidates.js';
import { baseSalaryFor, candidateRanges, contractSalary } from './contracts.js';
import { battleItems } from './inventory.js';
import { declineContract } from './missions.js';

const MAX_PEOPLE = 7; // a room fits one screen
const HIRE_YEARS = 2;
const BOUT_FAME = 3;

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pick = (list, seed) => list[hashString(seed) % list.length];

/** Buildings that have an interior in this town. */
function townBuildings(locationId) {
  return (TOWNS[locationId]?.buildings || []).map((building) => building.building).filter((id) => INTERIORS[id]);
}

/** Is this contract on the board without anyone handing it over (story and boss contracts)? */
export function missionPosted(mission) {
  return Boolean(mission.story || mission.bossId);
}

/** Contracts the guild knows about: posted ones, and those people gave it. */
export function knownMissions(state) {
  return (state.missions || []).filter((mission) => missionPosted(mission) || mission.unlocked);
}

function petitionerFor(mission) {
  const [, role, building] = PETITIONER_ROLES.find(([pattern]) => pattern.test(mission.issuer || '')) || PETITIONER_ROLES[PETITIONER_ROLES.length - 1];
  return { role, building };
}

function visitorName(seed) {
  return `${pick(VISITOR_FIRST, `${seed}:first`)} ${pick(VISITOR_LAST, `${seed}:last`)}`;
}

const classKey = (classId) => String(normalizeClassId(classId) || 'Guardian').toLowerCase();

/**
 * Everyone in a town right now (regulars and visitors), each with a building.
 * Visitors fill the free spots of their building; a full room keeps the rest
 * waiting outside until someone leaves.
 */
export function townPeople(state, locationId) {
  const buildings = townBuildings(locationId);
  const people = REGULARS.filter((person) => person.locationId === locationId && buildings.includes(person.building)).map((person) => ({
    ...person,
    kind: 'regular',
    sprite: person.sprite || `npc.role.${slug(person.role)}`,
    portrait: person.portrait || `portrait.role.${slug(person.role)}`,
    offers: [],
  }));
  // Recruits and challengers: the candidates in this town.
  (state.candidates || [])
    .filter((candidate) => (candidate.locationId || 'dunmere') === locationId)
    .forEach((candidate) => {
      const venue = candidate.venue && buildings.includes(candidate.venue) ? candidate.venue : 'tavern';
      const offers = [{ type: 'hire', candidateId: candidate.id, locked: Boolean(candidate.boutFirst && !candidate.boutWon) }];
      if (candidate.boutFirst && !candidate.boutWon) offers.unshift({ type: 'challenge', candidateId: candidate.id });
      people.push({
        id: candidate.id,
        name: candidate.name,
        role: candidate.boutFirst ? `${candidate.classId} · challenger` : `${candidate.classId} · looking for work`,
        locationId,
        building: venue,
        kind: 'visitor',
        sprite: `char.class.${classKey(candidate.classId)}`,
        portrait: `portrait.class.${classKey(candidate.classId)}`,
        candidateId: candidate.id,
        offers,
      });
    });
  // Petitioners: one per issuer, holding that issuer's contracts.
  const byIssuer = new Map();
  (state.missions || [])
    .filter((mission) => mission.locationId === locationId && !missionPosted(mission))
    .forEach((mission) => {
      const key = `pet-${locationId}-${slug(mission.issuer || 'petitioner')}`;
      if (!byIssuer.has(key)) {
        const { role, building } = petitionerFor(mission);
        byIssuer.set(key, {
          id: key,
          name: visitorName(key),
          role: mission.patron ? `${role} · ${mission.issuer}` : role === 'Traveller' && mission.issuer !== 'Anonymous petitioner' ? mission.issuer : role,
          locationId,
          building: buildings.includes(building) ? building : 'tavern',
          kind: 'visitor',
          sprite: `npc.role.${slug(role)}`,
          portrait: `portrait.role.${slug(role)}`,
          offers: [{ type: 'mission', missionIds: [] }],
        });
      }
      byIssuer.get(key).offers[0].missionIds.push(mission.id);
    });
  people.push(...byIssuer.values());
  // A messenger waits at the herald while there is unread news.
  if (buildings.includes('herald') && state.newsUnread) {
    people.push({ id: `messenger-${locationId}`, name: 'A messenger', role: 'Messenger', locationId, building: 'herald', kind: 'visitor', sprite: 'npc.role.messenger', portrait: 'portrait.role.messenger', offers: [], service: 'news' });
  }
  // A traveller with rumours at the inn, a new one each month.
  if (locationId !== 'dunmere' && buildings.includes('tavern')) {
    const key = `traveller-${locationId}-${campaignMonthSerial(state)}`;
    people.push({ id: key, name: visitorName(key), role: 'Traveller', locationId, building: 'tavern', kind: 'visitor', sprite: 'npc.role.traveller', portrait: 'portrait.role.traveller', offers: [], service: 'rumor' });
  }
  return people;
}

/** The people in one building, each on a spot of its interior (src/data/interiors.js). */
export function peopleIn(state, locationId, building) {
  const room = INTERIORS[building];
  if (!room) return [];
  const here = townPeople(state, locationId).filter((person) => person.building === building);
  const free = room.spots.filter((spot) => !here.some((person) => person.kind === 'regular' && person.spot === spot.id));
  let next = 0;
  const placed = here.map((person) => {
    if (person.kind === 'regular') return person;
    const spot = free[next];
    next += 1;
    return spot ? { ...person, spot: spot.id } : null;
  });
  return placed.filter(Boolean).slice(0, MAX_PEOPLE).map((person) => withMemory(state, person));
}

function withMemory(state, person) {
  const memory = state.people?.[person.id] || null;
  return { ...person, met: Boolean(memory?.met), known: Boolean(memory?.met), relationship: memory?.relationship || 0, interview: memory?.interview || {} };
}

/** A person by id, wherever they are now (null when they have moved on). */
export function findPerson(state, personId) {
  const regular = REGULAR_BY_ID[personId];
  const locations = regular ? [regular.locationId] : Object.keys(TOWNS);
  for (const locationId of locations) {
    const person = townPeople(state, locationId).find((item) => item.id === personId);
    if (person) return withMemory(state, person);
  }
  return null;
}

// ---------------------------------------------------------------- talking

const choice = (id, text) => ({ id, text });

function serviceChoices(person, state) {
  const here = person.locationId;
  switch (person.service) {
    case 'shop':
      return [choice('service.shop', 'Show me your wares')];
    case 'inn':
      return [choice('service.inn', 'A room for the night')];
    case 'registrar':
      return [choice('service.registrar', 'Sign up for a tournament')];
    case 'referee': {
      const running = (state.tournaments || []).some((tournament) => tournament.locationId === here && tournament.status === 'active');
      return [choice('service.referee', running ? 'Start our bout' : 'Is there a bout today?')];
    }
    case 'clerk':
      return [choice('service.clerk', 'The rankings, please')];
    case 'news':
      return [choice('service.news', 'What news?')];
    case 'rumor':
      return [choice('service.rumor', 'Heard anything on the road?')];
    default:
      return [];
  }
}

function offerChoices(person) {
  return person.offers.flatMap((offer) => {
    if (offer.type === 'mission') return [choice('mission', 'Need anything done?')];
    if (offer.type === 'hire') return [choice('hire', 'Looking for work?')];
    if (offer.type === 'challenge') return [choice('challenge', 'Fancy a bout?')];
    return [];
  });
}

/**
 * What a person says when you walk up to them: first meetings are 1–3 lines
 * that reveal what they offer; people you know skip the small talk.
 */
export function getPersonTalk(state, personId) {
  const person = findPerson(state, personId);
  if (!person) return null;
  const lines = [];
  if (!person.met) {
    const main = person.offers[0]?.type || (person.service === 'rumor' ? 'rumor' : null);
    if (main && FIRST_LINES[main]) lines.push(pick(FIRST_LINES[main], person.id));
    else if (person.lines?.length) lines.push(person.lines[0]);
    person.offers.forEach((offer) => {
      if (offer.type !== person.offers[0]?.type || !FIRST_LINES[offer.type]) lines.push(OFFER_LINES[offer.type]);
    });
    if (!lines.length) lines.push('Good day.');
  } else {
    lines.push(person.relationship >= 3 ? `Good to see you again.` : person.lines?.[0] || 'Back again?');
  }
  return {
    person,
    lines: lines.slice(0, 3),
    choices: [...serviceChoices(person, state), ...offerChoices(person), choice('bye', 'Goodbye')],
  };
}

function rememberInPlace(state, person, patch = {}) {
  state.people ||= {};
  const memory = state.people[person.id] || { id: person.id, met: false, talks: 0, relationship: 0, interview: {} };
  state.people[person.id] = {
    ...memory,
    name: person.name,
    role: person.role,
    portrait: person.portrait,
    locationId: person.locationId,
    building: person.building,
    offers: person.offers.map((offer) => offer.type),
    service: person.service || null,
    lastSerial: campaignMonthSerial(state),
    movedOn: false,
    ...patch,
    interview: { ...memory.interview, ...(patch.interview || {}) },
  };
  return state.people[person.id];
}

/** Starts a conversation: the person now knows you (and you know what they offer). */
export function meetPerson(state, personId) {
  const person = findPerson(state, personId);
  if (!person) return { state, error: 'They have gone.' };
  const next = clone(state);
  const memory = rememberInPlace(next, person, { met: true });
  memory.talks += 1;
  return { state: finalize(next), error: null };
}

function heroLines(candidate) {
  const dream = String(candidate.dream || 'make a name').toLowerCase();
  return [
    `People call me ${String(candidate.personality || 'steady').toLowerCase()}. My worst habit? ${candidate.flaw || 'None worth mentioning'}.`,
    `One day I mean to ${dream.replace(/^become /, 'become ')}.`,
  ];
}

function skillLines(state, candidate) {
  const ranges = candidateRanges(state, candidate);
  const span = ([low, high]) => (low === high ? `${low}` : `${low} to ${high}`);
  const description = CLASSES[normalizeClassId(candidate.classId)]?.description || '';
  return [`A ${candidate.rarity.toLowerCase()} ${candidate.primal} ${candidate.classId}, level ${candidate.level}. ${description}`.trim(), `Call my power ${span(ranges.power)}, and there is more in me: ${span(ranges.potential)}.`];
}

/** Terms and any reason the candidate would say no right now. */
export function hireTerms(state, candidate) {
  const salary = contractSalary(baseSalaryFor(candidate, state), HIRE_YEARS);
  const objection = recruitObjection(state, candidate);
  const blockers = [];
  if (candidate.boutFirst && !candidate.boutWon) blockers.push('Beat me in a bout first. Then we talk.');
  if (objection) blockers.push(objection);
  if (freeBeds(state) <= 0) blockers.push('Where would I sleep? You have no free bed.');
  if (state.guild.crowns < candidate.signingFee) blockers.push(`My fee is ${candidate.signingFee} gold. Come back when you have it.`);
  if (state.world?.activeTravel) blockers.push('Find me again when you are not on the road.');
  return { fee: candidate.signingFee, salary, years: HIRE_YEARS, bed: true, blockers };
}

/**
 * Picks a choice in a conversation. Returns the next lines and choices, and
 * `ui` for the screen (open a panel, sign a recruit, close). Choices:
 * mission, mission.accept:<id>, mission.decline:<id>, hire, hire.about,
 * hire.skills, hire.terms, challenge, challenge.fight, service.*, back, bye.
 */
export function talkToPerson(state, personId, choiceId) {
  const person = findPerson(state, personId);
  if (!person) return { state, error: 'They have gone.' };
  const next = clone(state);
  const memory = rememberInPlace(next, person, { met: true });
  const back = [choice('back', 'Something else'), choice('bye', 'Goodbye')];
  const candidate = person.candidateId ? next.candidates.find((item) => item.id === person.candidateId) : null;
  const [action, argument] = String(choiceId).split(':');
  let lines = [];
  let choices = back;
  let ui = null;

  if (action === 'bye') {
    return { state: finalize(next), error: null, lines: [], choices: [], ui: { close: true } };
  } else if (action === 'back') {
    const talk = getPersonTalk(next, personId);
    lines = ['What else?'];
    choices = talk?.choices || back;
  } else if (action === 'mission') {
    const offer = person.offers.find((item) => item.type === 'mission');
    const missions = (offer?.missionIds || []).map((id) => next.missions.find((mission) => mission.id === id)).filter(Boolean);
    if (!missions.length) lines = ['Nothing right now. Ask me next month.'];
    missions.slice(0, 2).forEach((mission) => {
      lines.push(`${mission.title}: ${mission.brief.split('.')[0]}. ${mission.reward} gold, risk ${mission.risk} of 5.${mission.unlocked ? ' It is already on your board.' : ''}`);
    });
    choices = [
      ...missions.slice(0, 2).filter((mission) => !mission.unlocked).flatMap((mission) => [choice(`mission.accept:${mission.id}`, `Take “${mission.title}”`), choice(`mission.decline:${mission.id}`, `Turn down “${mission.title}”`)]),
      ...back,
    ];
  } else if (action === 'mission.accept') {
    const mission = next.missions.find((item) => item.id === argument);
    if (!mission) return { state, error: 'That contract is gone.' };
    mission.unlocked = true;
    mission.accepted = true;
    mission.giverId = person.id;
    memory.relationship = clamp(memory.relationship + 1, -10, 10);
    lines = ['Good. It is on your notice board in the square. Pick your party there.'];
    ui = { notice: `“${mission.title}” added to the notice board.` };
  } else if (action === 'mission.decline') {
    const result = declineContract(next, argument);
    if (result.error) return { state, error: result.error };
    return { state: result.state, error: null, lines: ['Then I will ask another guild.'], choices: back, ui: null };
  } else if (action === 'hire') {
    if (!candidate) return { state, error: 'They have already signed elsewhere.' };
    lines = ['Ask what you like.'];
    choices = [choice('hire.about', 'Tell me about yourself'), choice('hire.skills', 'What can you do?'), choice('hire.terms', 'Would you join us?'), ...back];
  } else if (action === 'hire.about' && candidate) {
    memory.interview.about = true;
    lines = heroLines(candidate);
    choices = [choice('hire.skills', 'What can you do?'), choice('hire.terms', 'Would you join us?'), ...back];
  } else if (action === 'hire.skills' && candidate) {
    // Asking narrows what the guild knows about them (part of scouting).
    candidate.scoutLevel = Math.max(candidate.scoutLevel || 0, 2);
    memory.interview.skills = true;
    lines = skillLines(next, candidate);
    choices = [choice('hire.about', 'Tell me about yourself'), choice('hire.terms', 'Would you join us?'), ...back];
  } else if (action === 'hire.terms' && candidate) {
    memory.interview.terms = true;
    const terms = hireTerms(next, candidate);
    lines = terms.blockers.length
      ? [terms.blockers[0]]
      : [`${terms.fee} gold to sign, then ${terms.salary} gold a month for ${terms.years} years. And a bed of my own.`];
    choices = terms.blockers.length ? back : [choice('hire.sign', 'Agreed. Welcome to the guild.'), choice('back', 'Let me think about it'), choice('bye', 'Goodbye')];
  } else if (action === 'hire.sign' && candidate) {
    return { state: finalize(next), error: null, lines: [], choices: [], ui: { recruit: candidate.id, years: HIRE_YEARS } };
  } else if (action === 'challenge') {
    lines = [`A friendly bout, one against one. Win and the town hears about it (+${BOUT_FAME} fame).${person.offers.some((offer) => offer.locked) ? ' Win, and I will hear your offer.' : ''}`];
    choices = [choice('challenge.fight', 'Let’s fight'), ...back];
  } else if (action === 'challenge.fight') {
    const started = startPersonBoutInPlace(next, person, candidate);
    if (started) return { state, error: started };
    return { state: finalize(next), error: null, lines: [], choices: [], ui: { close: true } };
  } else if (action === 'service.shop') {
    ui = { open: 'shop' };
  } else if (action === 'service.inn') {
    ui = { open: 'inn' };
  } else if (action === 'service.registrar') {
    ui = { open: 'arena', tab: 'registrar' };
  } else if (action === 'service.referee') {
    const running = (next.tournaments || []).some((tournament) => tournament.locationId === person.locationId && tournament.status === 'active');
    if (running) ui = { open: 'arena', tab: 'ground' };
    else lines = ['No tournament in progress. The registrar can tell you when the next one starts.'];
  } else if (action === 'service.clerk') {
    ui = { open: 'records', tab: 'rankings' };
  } else if (action === 'service.news') {
    ui = { open: 'news' };
  } else if (action === 'service.rumor') {
    lines = [rumorInPlace(next, person)];
  } else {
    return { state, error: 'They do not follow.' };
  }
  return { state: finalize(next), error: null, lines, choices, ui };
}

/** A traveller's rumour: a place the guild has not heard of yet becomes known. */
function rumorInPlace(state, person) {
  state.world.knowledge ||= { locations: {}, events: {}, sources: {} };
  const knowledge = state.world.knowledge;
  knowledge.locations ||= {};
  knowledge.sources ||= {};
  const unknown = Object.keys(TOWNS).filter((id) => !knowledge.locations[id] || knowledge.locations[id] === 'unknown');
  if (!unknown.length) return 'Nothing you have not heard already. The roads are quiet.';
  const place = LOCATION_BY_ID[pick(unknown, person.id)];
  knowledge.locations[place.id] = 'rumored';
  knowledge.sources[place.id] ||= { source: person.name, note: place.description };
  return `They talk about ${place.name}: ${place.description.toLowerCase()} It is on your map now.`;
}

// ---------------------------------------------------------------- bouts

function startPersonBoutInPlace(state, person, candidate) {
  if (state.activeEncounter) return 'Another fight is already waiting.';
  if (!candidate) return 'They have left.';
  const ready = state.heroes.filter((hero) => hero.status === 'available');
  const champion = [...ready].sort((a, b) => b.power - a.power)[0];
  if (!champion) return 'Nobody is fit to fight.';
  state.activeEncounter = createDuelEncounter({
    id: `bout-${person.id}-${campaignMonthSerial(state)}-${state.people?.[person.id]?.bouts || 0}`,
    seed: (state.rngState ^ hashString(`bout:${person.id}:${state.people?.[person.id]?.bouts || 0}`)) >>> 0,
    sourceType: 'person-bout',
    sourceId: person.id,
    title: `A friendly bout: ${candidate.name}`,
    roundName: `${LOCATION_BY_ID[person.locationId]?.name || ''} ${person.building === 'arena' ? 'sparring ring' : 'tavern floor'}`.trim(),
    playerHero: champion,
    opponentHero: { ...clone(candidate), id: `bout-${candidate.id}` },
    prestige: 6,
    items: battleItems(state),
  });
  state.people[person.id].bouts = (state.people[person.id].bouts || 0) + 1;
  return null;
}

/** A bout with a person ended (encounters.js): small fame stakes, respect, and maybe a recruit. */
export function personBoutResultInPlace(state, personId, won) {
  const memory = state.people?.[personId];
  const candidate = state.candidates.find((item) => item.id === personId);
  if (memory) memory.relationship = clamp((memory.relationship || 0) + (won ? 2 : 1), -10, 10);
  if (won) {
    state.guild.fame += BOUT_FAME;
    if (candidate) candidate.boutWon = true;
    state.notifications.push({ id: `bout-won-${personId}-${memory?.bouts || 0}`, tone: 'green', title: 'Bout won', text: `+${BOUT_FAME} fame.${candidate?.boutFirst ? ` ${candidate.name} will hear your offer now.` : ''}` });
    if (candidate) addChronicle(state, { type: 'challenge', importance: 1, title: `A friendly bout against ${candidate.name}`, text: 'The guild won. The town noticed.', tags: ['bout'] });
  } else {
    state.guild.fame = Math.max(0, state.guild.fame - 1);
    state.notifications.push({ id: `bout-lost-${personId}-${memory?.bouts || 0}`, tone: 'red', title: 'Bout lost', text: 'A good fight, but not yours. −1 fame. Try again when you are ready.' });
  }
}

// ---------------------------------------------------------------- introductions and rotation

/** A keeper's introduction: everyone looking for work in this tavern becomes known. */
export function introduceInPlace(state, locationId) {
  peopleIn(state, locationId, 'tavern')
    .filter((person) => person.offers.some((offer) => offer.type === 'hire'))
    .forEach((person) => rememberInPlace(state, person, { met: true }));
}

/**
 * Monthly: visitors rotate. Recruits and challengers nobody has met leave after
 * a month; the ones you met are remembered as having moved on. New faces come
 * in (src/game/engine/time.js calls this after the contract board refreshes).
 */
export function rotateVisitorsInPlace(state, rng) {
  const now = campaignMonthSerial(state);
  const towns = Object.keys(TOWNS);
  state.candidates = (state.candidates || []).filter((candidate) => {
    if (!towns.includes(candidate.locationId || 'dunmere')) return true;
    const stays = (candidate.postedSerial ?? now) >= now - 1;
    if (!stays && state.people?.[candidate.id]) state.people[candidate.id].movedOn = true;
    return stays;
  });
  towns.forEach((locationId) => {
    const buildings = townBuildings(locationId);
    const here = state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === locationId);
    const recruits = here.filter((candidate) => !candidate.boutFirst).length;
    for (let i = recruits; i < 3; i += 1) state.candidates.push({ ...makeCandidate(state, rng, null, locationId), postedSerial: now, venue: 'tavern' });
    // A challenger in the arena's sparring ring (or the tavern) who joins after a won bout.
    if (!here.some((candidate) => candidate.boutFirst)) {
      const venue = buildings.includes('arena') ? 'arena' : 'tavern';
      state.candidates.push({ ...makeCandidate(state, rng, rng.chance(0.3) ? 'veteran' : null, locationId), postedSerial: now, venue, boutFirst: true, boutWon: false });
    }
  });
  // Petitioners whose contracts are gone have moved on.
  Object.values(state.people || {}).forEach((memory) => {
    if (!String(memory.id).startsWith('pet-') || memory.movedOn) return;
    const still = state.missions.some((mission) => `pet-${mission.locationId}-${slug(mission.issuer || 'petitioner')}` === memory.id);
    if (!still) memory.movedOn = true;
  });
}

/** For a new campaign: the first visitors in every town. */
export function seedVisitorsInPlace(state) {
  const rng = rngFor(state, 'people-seed');
  rotateVisitorsInPlace(state, rng);
  commitRng(state, rng);
}

/**
 * Contacts (Guild orb): everyone you have met, where they are now (or that
 * they moved on and where they were last seen), what they offer, and how they feel.
 */
export function getContacts(state) {
  const towns = Object.values(TOWNS);
  const met = Object.values(state.people || {})
    .filter((memory) => memory.met)
    .map((memory) => {
      const now = memory.movedOn ? null : findPerson(state, memory.id);
      return {
        id: memory.id,
        name: memory.name,
        role: memory.role,
        portrait: memory.portrait,
        locationId: now?.locationId || memory.locationId,
        building: now?.building || memory.building,
        offers: now ? now.offers.map((offer) => offer.type) : memory.offers || [],
        service: memory.service || null,
        relationship: memory.relationship || 0,
        movedOn: !now,
      };
    });
  // People met in the streets (story characters and townsfolk).
  const talked = state.world?.exploration?.talked || {};
  const street = towns.flatMap((town) =>
    town.npcs
      .filter((npc) => talked[npc.dialogue])
      .map((npc) => ({
        id: `npc-${town.id}-${npc.id}`,
        name: npc.name,
        role: npc.role,
        portrait: `portrait.${town.id}.${npc.id}`,
        locationId: town.id,
        building: null,
        offers: [],
        service: null,
        relationship: state.world?.exploration?.npcs?.[npc.dialogue] || 0,
        movedOn: false,
      })),
  );
  return [...met, ...street].sort((a, b) => Number(a.movedOn) - Number(b.movedOn) || a.name.localeCompare(b.name));
}

export { REGULARS };
