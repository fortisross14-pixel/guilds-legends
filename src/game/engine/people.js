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
import { PRACTICE_LEVELS, PRACTICE_TEAMS, REGULARS, REGULAR_BY_ID, VISITOR_FIRST, VISITOR_LAST, PETITIONER_ROLES, FIRST_LINES, PERSONALITY_VOICES, ROLE_VOICES, CHAT_TEXT, DREAM_LINES, FLAW_LINES, ORIGIN_LINES, RISK_LINES } from '../../data/people.js';
import { INTERIORS } from '../../data/interiors.js';
import { TOWNS } from '../../data/towns/index.js';
import { wildBuildings } from '../../data/wilds/index.js';
import { CLASSES, normalizeClassId } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { TOURNAMENTS } from '../../data/tournaments.js';
import { createDuelEncounter, createPartyEncounter } from '../combat.js';
import { addChronicle, campaignMonthSerial, clamp, clone, commitRng, finalize, freeBeds, hasHall, hashString, rngFor } from './core.js';
import { makeCandidate, recruitObjection } from './candidates.js';
import { baseSalaryFor, candidateRanges, contractSalary } from './contracts.js';
import { battleItems } from './inventory.js';
import { declineContract, firstStep } from './missions.js';
import { askAroundHere, askAroundReply, askedAroundInPlace } from './story.js';

const MAX_PEOPLE = 7; // a room fits one screen
const HIRE_YEARS = 2;
const BOUT_FAME = 3;

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pick = (list, seed) => list[hashString(seed) % list.length];

/** Buildings that have an interior in this town. */
function townBuildings(locationId) {
  // A wild area's buildings (Dawnwatch Temple on the Old Road) count as its hub town's.
  return [...(TOWNS[locationId]?.buildings || []), ...wildBuildings(locationId)].map((building) => building.building).filter((id) => INTERIORS[id]);
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

function visitorName(seed, taken = null) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const salt = attempt ? `${seed}:${attempt}` : seed;
    const name = `${pick(VISITOR_FIRST, `${salt}:first`)} ${pick(VISITOR_LAST, `${salt}:last`)}`;
    const first = name.split(' ')[0];
    if (!taken || !taken.has(first)) {
      taken?.add(first);
      return name;
    }
  }
  return `${pick(VISITOR_FIRST, `${seed}:first`)} ${pick(VISITOR_LAST, `${seed}:last`)}`;
}

/** A short label for a person: the first name, or first name and initial when two share it. */
export function shortLabels(people) {
  const count = {};
  people.forEach((person) => {
    const first = String(person.name).split(' ')[0];
    count[first] = (count[first] || 0) + 1;
  });
  return Object.fromEntries(
    people.map((person) => {
      const [first, ...rest] = String(person.name).split(' ');
      return [person.id, count[first] > 1 && rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first];
    }),
  );
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
  // Generated visitors take first names nobody in town has yet.
  const taken = new Set(people.map((person) => String(person.name).split(' ')[0]));
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
          name: visitorName(key, taken),
          role: mission.patron ? `${role} · ${mission.issuer}` : role === 'Traveller' && mission.issuer !== 'Anonymous petitioner' ? mission.issuer : role,
          locationId,
          building: buildings.includes(building) ? building : 'tavern',
          kind: 'visitor',
          voice: role,
          sprite: `npc.role.${slug(role)}`,
          portrait: `portrait.role.${slug(role)}`,
          offers: [{ type: 'mission', missionIds: [] }],
        });
      }
      byIssuer.get(key).offers[0].missionIds.push(mission.id);
    });
  people.push(...byIssuer.values());
  // Practice teams at the arena (src/data/people.js): three, by level band, a new captain each month.
  if (buildings.includes('arena')) {
    const classes = ['Duelist', 'Guardian', 'Ranger', 'Rogue', 'Mage', 'Cleric'];
    const teamSize = Math.max(2, ...TOURNAMENTS.filter((item) => item.locationId === locationId).map((item) => item.teamSize || 2));
    PRACTICE_TEAMS.forEach((team) => {
      const key = `spar-${locationId}-${team.id}-${campaignMonthSerial(state)}`;
      const classId = classes[hashString(key) % classes.length];
      const [low, high] = PRACTICE_LEVELS[LOCATION_BY_ID[locationId]?.tier]?.[team.id] || team.levels;
      const level = low + (hashString(`${key}:level`) % (high - low + 1));
      people.push({ id: key, name: visitorName(key, taken), role: `${classId} · ${team.name}, level ${level}`, locationId, building: 'arena', kind: 'visitor', voice: 'Fighter', sprite: `char.class.${classKey(classId)}`, portrait: `portrait.class.${classKey(classId)}`, classId, spar: { team: team.id, level, size: teamSize }, offers: [{ type: 'spar' }] });
    });
  }
  // A messenger waits at the herald while there is unread news.
  if (buildings.includes('herald') && state.newsUnread) {
    people.push({ id: `messenger-${locationId}`, name: 'A messenger', role: 'Messenger', voice: 'Messenger', locationId, building: 'herald', kind: 'visitor', sprite: 'npc.role.messenger', portrait: 'portrait.role.messenger', offers: [], service: 'news' });
  }
  // A traveller with rumours at the inn, a new one each month.
  if (locationId !== 'dunmere' && buildings.includes('tavern')) {
    const key = `traveller-${locationId}-${campaignMonthSerial(state)}`;
    people.push({ id: key, name: visitorName(key, taken), role: 'Traveller', voice: 'Traveller', locationId, building: 'tavern', kind: 'visitor', sprite: 'npc.role.traveller', portrait: 'portrait.role.traveller', offers: [], service: 'rumor' });
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
// Conversations follow docs/DIALOGUE.md: the person opens (with their name on
// a first meeting), the player asks topics in any order, each answer comes
// back to the topics with asked ones marked, and a goodbye fits the person.

const choice = (id, text, asked = false) => ({ id, text, asked });
const BACK = 'Let’s talk about something else.';

function candidateOf(state, person) {
  return person.candidateId ? (state.candidates || []).find((item) => item.id === person.candidateId) || null : null;
}

/** How someone speaks: regulars by their own lines, recruits by personality, the rest by role. */
function voiceFor(state, person) {
  const candidate = candidateOf(state, person);
  const base = candidate ? PERSONALITY_VOICES[candidate.personality] : ROLE_VOICES[person.voice];
  const fallback = { name: 'I’m {name}.', again: 'Back again?', more: 'What else?', ask: 'Ask what you like.', bye: 'Good day.' };
  const voice = { ...fallback, ...(base || {}) };
  if (person.kind === 'regular') {
    voice.again = person.again?.[0] || voice.again;
    voice.bye = person.bye || voice.bye;
    voice.more = 'Anything else?';
  }
  const fill = (text) => String(text).replace(/\{name\}/g, person.name).replace(/\{guild\}/g, state.guild?.name || 'friend');
  return Object.fromEntries(Object.entries(voice).map(([key, value]) => [key, fill(value)]));
}

/** What kind of visitor this is, for the first words and the small talk. */
function visitorKind(person) {
  return person.offers[0]?.type || person.service || null;
}

function serviceChoices(person, state, asked) {
  const here = person.locationId;
  switch (person.service) {
    case 'shop':
      return [choice('service.shop', 'Show me what you’ve got.')];
    case 'inn':
      return [choice('service.inn', 'I need a room for the night.')];
    case 'registrar':
      return [choice('service.registrar', 'I’d like to sign up a team.')];
    case 'referee': {
      const running = (state.tournaments || []).some((tournament) => tournament.locationId === here && tournament.status === 'active');
      return [choice('service.referee', running ? 'We’re ready for our bout.' : 'Any bouts today?')];
    }
    case 'clerk':
      return [choice('service.clerk', 'Where do we stand in the rankings?')];
    case 'news':
      return [choice('service.news', 'What’s the news?')];
    case 'rumor':
      return [choice('service.rumor', 'Heard anything on the road?', Boolean(asked['service.rumor']))];
    default:
      return [];
  }
}

/** The topics: small talk, the person's service, their offers, and goodbye. */
function hubChoices(state, person) {
  const asked = state.people?.[person.id]?.asked || {};
  const choices = [];
  const chat = person.kind === 'regular' ? person.chat?.[0] : CHAT_TEXT[visitorKind(person)];
  if (chat && visitorKind(person) !== 'mission') choices.push(choice('chat', chat, Boolean(asked.chat)));
  choices.push(...serviceChoices(person, state, asked));
  // A story "ask around" step in this town: anyone here can be asked.
  const around = (state.world?.currentLocationId || 'dunmere') === person.locationId ? askAroundHere(state, person.id) : null;
  if (around) choices.push(choice('lantern', around.text, Boolean(asked.lantern)));
  person.offers.forEach((offer) => {
    if (offer.type === 'mission') choices.push(nextMission(state, person).ready ? choice('mission', 'It’s done.') : choice('mission', 'Need anything done?', Boolean(asked.mission)));
    if (offer.type === 'hire') choices.push(choice('hire', 'Looking for work?', Boolean(asked.hire)));
    if (offer.type === 'challenge') choices.push(choice('challenge', 'Fancy a friendly bout?', Boolean(asked.challenge)));
    if (offer.type === 'spar') choices.push(choice('spar', 'Up for a training match?'));
  });
  choices.push(choice('bye', 'Goodbye.'));
  return choices;
}

function interviewChoices(memory) {
  const done = memory?.interview || {};
  return [
    choice('hire.about', 'Tell me about yourself.', Boolean(done.about)),
    choice('hire.skills', 'What can you do?', Boolean(done.skills)),
    choice('hire.terms', 'What would it take to sign you?', Boolean(done.terms)),
    choice('back', BACK),
  ];
}

/**
 * What a person says when you walk up to them. A first meeting: their first
 * words, then their name. A return visit: a familiar opener.
 */
export function getPersonTalk(state, personId) {
  const person = findPerson(state, personId);
  if (!person) return null;
  const voice = voiceFor(state, person);
  let lines;
  if (person.kind === 'regular') lines = person.met ? [voice.again] : person.hello || [voice.name];
  else if (person.met) lines = [voice.again];
  else {
    const kind = visitorKind(person);
    lines = [FIRST_LINES[kind] ? pick(FIRST_LINES[kind], person.id) : null, voice.name].filter(Boolean);
  }
  return { person, lines: lines.slice(0, 3), choices: hubChoices(state, person) };
}

function rememberInPlace(state, person, patch = {}) {
  state.people ||= {};
  const memory = state.people[person.id] || { id: person.id, met: false, talks: 0, relationship: 0, interview: {}, asked: {} };
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
    asked: { ...(memory.asked || {}) },
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

/** Small talk: where a recruit comes from, a regular's favourite subject, where a traveller is going. */
function chatLines(state, person) {
  if (person.kind === 'regular') return person.chat?.[1] || ['Not much to tell.'];
  const candidate = candidateOf(state, person);
  if (candidate) {
    const [origin, place] = String(candidate.origin || '').split(' of ');
    const line = ORIGIN_LINES[origin] || 'Here and there. Mostly there.';
    return [line.replace('{place}', place || 'the road')];
  }
  if (visitorKind(person) === 'rumor') return ['Wherever the next warm bed is.', 'Ask me about the roads. That’s what I’m good for.'];
  return ['Not much to tell.'];
}

function aboutLines(candidate) {
  return [DREAM_LINES[candidate.dream] || 'I mean to make a name for myself.', FLAW_LINES[candidate.flaw] || 'No bad habits worth mentioning. Yet.'];
}

function skillLines(state, candidate) {
  const ranges = candidateRanges(state, candidate);
  const span = ([low, high]) => (Math.round(low) === Math.round(high) ? `${Math.round(low)}` : `${Math.round(low)} to ${Math.round(high)}`);
  const trade = (CLASSES[normalizeClassId(candidate.classId)]?.description || '').replace(/\.$/, '').toLowerCase();
  const talent = candidate.rarity && candidate.rarity !== 'Common' ? ` ${candidate.rarity} talent, they tell me.` : '';
  return [
    `I’m a ${candidate.primal}-touched ${candidate.classId}, level ${candidate.level}.${talent}`,
    trade ? `${trade.charAt(0).toUpperCase()}${trade.slice(1)}: that’s my trade.` : 'I fight. I’m good at it.',
    `Call my power ${span(ranges.power)} today. Give me time and I’ll reach ${span(ranges.potential)}.`,
  ];
}

/** Terms and any reason the candidate would say no right now (in their words). */
export function hireTerms(state, candidate) {
  const salary = contractSalary(baseSalaryFor(candidate, state), HIRE_YEARS);
  const objection = recruitObjection(state, candidate);
  const blockers = [];
  if (candidate.boutFirst && !candidate.boutWon) blockers.push('Beat me in a bout first. Then we talk.');
  if (objection) blockers.push(objection);
  if (!hasHall(state)) blockers.push('Where would I sleep? Come back when you have a hall.');
  else if (freeBeds(state) <= 0) blockers.push('Where would I sleep? Every bed in your hall is taken.');
  if (state.guild.crowns < candidate.signingFee) blockers.push(`My fee is ${candidate.signingFee} gold. Come back when you have it.`);
  if (state.world?.activeTravel) blockers.push('Find me again when you are not on the road.');
  return { fee: candidate.signingFee, salary, years: HIRE_YEARS, bed: true, blockers };
}

/**
 * A petitioner's contracts: the next one to offer, one the guild is working on,
 * one finished and waiting to be reported, and one that ran past its deadline.
 */
function nextMission(state, person) {
  const offer = person.offers.find((item) => item.type === 'mission');
  const missions = (offer?.missionIds || []).map((id) => state.missions.find((mission) => mission.id === id)).filter(Boolean);
  const status = (mission) => mission.site?.status;
  return {
    open: missions.find((mission) => !mission.unlocked) || null,
    // Pinned on the notice board for the guild, not taken yet.
    pinned: missions.find((mission) => mission.unlocked && !mission.accepted) || null,
    working: missions.find((mission) => status(mission) === 'active') || null,
    ready: missions.find((mission) => status(mission) === 'ready') || null,
    failed: missions.find((mission) => status(mission) === 'failed') || null,
  };
}

/** A contract brief, as the petitioner would say it: its first sentence. */
function briefLine(mission) {
  const text = String(mission.brief || '').split(' The contract originates')[0];
  const first = text.match(/^[^.!?]*[.!?]/)?.[0] || text;
  return first.trim() || mission.title;
}

/**
 * Picks a choice in a conversation. Returns the next lines and choices, and
 * `ui` for the screen (open a panel, sign a recruit, close after the last line).
 * Choices: chat, mission, mission.post:<id> (pins it on the notice board), mission.decline:<id>, hire,
 * hire.about, hire.skills, hire.terms, hire.think, hire.sign, challenge,
 * challenge.fight, service.*, back, bye. Each choice comes with `asked`.
 */
export function talkToPerson(state, personId, choiceId) {
  const person = findPerson(state, personId);
  if (!person) return { state, error: 'They have gone.' };
  let next = clone(state);
  const memory = rememberInPlace(next, person, { met: true });
  const voice = voiceFor(next, person);
  const candidate = candidateOf(next, person);
  const [action, argument] = String(choiceId).split(':');
  const hub = () => hubChoices(next, person);
  let lines = [];
  let choices = null;
  let ui = null;
  if (['chat', 'mission', 'hire', 'challenge', 'service.rumor', 'lantern'].includes(action)) memory.asked[action] = true;

  if (action === 'bye') {
    return { state: finalize(next), error: null, lines: [voice.bye], choices: [], ui: { close: true } };
  } else if (action === 'back') {
    lines = [voice.more];
  } else if (action === 'lantern') {
    const around = askAroundHere(next, person.id);
    if (!around) return { state, error: 'They have nothing to say about that.' };
    lines = askAroundReply(next, around, person.id);
    askedAroundInPlace(next, around, person.id);
  } else if (action === 'chat') {
    lines = chatLines(next, person);
  } else if (action === 'mission') {
    const { open, pinned, working, ready, failed } = nextMission(next, person);
    if (failed) {
      // A missed deadline: they say so once, and the contract is gone.
      lines = [`You never came back about “${failed.title}”. I found someone else.`];
      next.missions = next.missions.filter((item) => item.id !== failed.id);
      memory.relationship = clamp(memory.relationship - 2, -10, 10);
    } else if (ready) {
      lines = ['You’re back. Well?'];
      choices = [choice(`mission.report:${ready.id}`, 'It’s done.'), choice('back', BACK)];
    } else if (working) lines = [`“${working.title}”: ${firstStep(next, working)?.text || 'you know what to do'}.`];
    else if (pinned) lines = [`“${pinned.title}” is pinned on the notice board, under your banner. Take it from there.`];
    else if (!open) lines = ['Nothing right now. Ask me next month.'];
    else {
      lines = [briefLine(open), `It pays ${open.reward} gold. ${RISK_LINES[clamp(open.risk || 1, 1, 5) - 1]}`, 'The terms are written up for the notice board. Want me to pin it there for you?'];
      choices = [choice(`mission.post:${open.id}`, 'Pin it. We’ll read it there.'), choice(`mission.decline:${open.id}`, 'Not this one.'), choice('back', BACK)];
    }
  } else if (action === 'mission.post') {
    // The job goes up on the notice board with the giver's name; the guild takes it there (missions.js acceptContract).
    const mission = next.missions.find((item) => item.id === argument);
    if (!mission) return { state, error: 'That contract is gone.' };
    mission.unlocked = true;
    mission.giverId = person.id;
    mission.giverName = person.name;
    memory.relationship = clamp(memory.relationship + 1, -10, 10);
    lines = ['Good.', `It’ll be on the notice board in the square: “${mission.title}”. Take it there, and come back to me when it’s done.`];
    ui = { notice: `“${mission.title}” is on the notice board.` };
  } else if (action === 'mission.report') {
    // The reward comes through one moment (outcomes.js reportContract, called by the screen).
    lines = ['Let me see.'];
    ui = { close: true, report: argument };
  } else if (action === 'mission.decline') {
    const result = declineContract(next, argument);
    if (result.error) return { state, error: result.error };
    next = result.state;
    lines = ['Then I’ll ask another guild.'];
  } else if (action === 'hire') {
    if (!candidate) return { state, error: 'They have already signed elsewhere.' };
    lines = [voice.ask];
    choices = interviewChoices(memory);
  } else if (action === 'hire.about' && candidate) {
    memory.interview.about = true;
    lines = aboutLines(candidate);
    choices = interviewChoices(memory);
  } else if (action === 'hire.skills' && candidate) {
    // Asking narrows what the guild knows about them (part of scouting).
    candidate.scoutLevel = Math.max(candidate.scoutLevel || 0, 2);
    memory.interview.skills = true;
    lines = skillLines(next, candidate);
    choices = interviewChoices(memory);
  } else if (action === 'hire.terms' && candidate) {
    memory.interview.terms = true;
    const terms = hireTerms(next, candidate);
    if (terms.blockers.length) {
      lines = [terms.blockers[0]];
      choices = interviewChoices(memory);
    } else {
      lines = [`${terms.fee} gold to sign. Then ${terms.salary} gold a month for ${terms.years} years.`, 'And a bed of my own.'];
      choices = [choice('hire.sign', `Deal. Welcome to ${next.guild.name}.`), choice('hire.think', 'Let me think about it.')];
    }
  } else if (action === 'hire.think' && candidate) {
    lines = ['Don’t think too long. Other guilds are hiring.'];
  } else if (action === 'hire.sign' && candidate) {
    return { state: finalize(next), error: null, lines: [], choices: [], ui: { recruit: candidate.id, years: HIRE_YEARS } };
  } else if (action === 'challenge') {
    const locked = person.offers.some((offer) => offer.locked);
    lines = ['One against one, friendly. First to yield loses.', locked ? 'Beat me and I’ll hear your offer.' : 'Win and the whole town hears about it.'];
    choices = [choice('challenge.fight', `You’re on. (+${BOUT_FAME} fame if we win)`), choice('back', 'Maybe another time.')];
  } else if (action === 'spar') {
    const size = person.spar?.size || 2;
    lines = [`Your fighters against my team: ${size} of us, level ${person.spar?.level || 4}. Blunted blades: nobody gets hurt, but you’ll be spent.`, 'The stronger we are next to you, the more you learn.'];
    choices = [choice('spar.fight', 'Let’s train.'), choice('back', 'Maybe later.')];
  } else if (action === 'spar.fight') {
    const started = startTrainingInPlace(next, person);
    if (started) return { state, error: started };
    return { state: finalize(next), error: null, lines: [], choices: [], ui: { close: true } };
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
    else lines = ['No bouts today.', 'Ask the registrar when the next tournament starts.'];
  } else if (action === 'service.clerk') {
    ui = { open: 'records', tab: 'rankings' };
  } else if (action === 'service.news') {
    ui = { open: 'news' };
  } else if (action === 'service.rumor') {
    const rumor = rumorInPlace(next, person);
    lines = rumor.lines;
    if (rumor.notice) ui = { notice: rumor.notice };
  } else {
    return { state, error: 'They do not follow.' };
  }
  return { state: finalize(next), error: null, lines, choices: choices || hub(), ui };
}

/** A traveller's rumour: a place the guild has not heard of yet becomes known. */
function rumorInPlace(state, person) {
  state.world.knowledge ||= { locations: {}, events: {}, sources: {} };
  const knowledge = state.world.knowledge;
  knowledge.locations ||= {};
  knowledge.sources ||= {};
  const unknown = Object.keys(TOWNS).filter((id) => !knowledge.locations[id] || knowledge.locations[id] === 'unknown');
  if (!unknown.length) return { lines: ['Nothing you haven’t heard already. The roads are quiet.'], notice: null };
  const place = LOCATION_BY_ID[pick(unknown, person.id)];
  knowledge.locations[place.id] = 'rumored';
  knowledge.sources[place.id] ||= { source: person.name, note: place.description };
  return { lines: [`Folk on the road keep talking about ${place.name}.`, place.description], notice: `${place.name} is on your map now.` };
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

/**
 * A training match at the arena: the fit party against a practice team of a set
 * level (src/data/people.js PRACTICE_TEAMS), as many as the city's tournaments field. XP for everyone who
 * fought; nobody is injured (encounters.js), but the fighters end spent.
 */
function startTrainingInPlace(state, person) {
  if (state.activeEncounter) return 'Another fight is already waiting.';
  const fighters = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter((hero) => hero?.status === 'available');
  const party = (fighters.length ? fighters : state.heroes.filter((hero) => hero.status === 'available').sort((a, b) => b.power - a.power)).slice(0, 4);
  if (!party.length) return 'Nobody is fit to fight.';
  const level = person.spar?.level || 4;
  const count = state.people?.[person.id]?.bouts || 0;
  state.activeEncounter = createPartyEncounter({
    id: `training-${person.id}-${count}`,
    seed: (state.rngState ^ hashString(`training:${person.id}:${count}`)) >>> 0,
    sourceType: 'training',
    sourceId: person.id,
    title: `Training match: ${person.name}`,
    roundName: `${LOCATION_BY_ID[person.locationId]?.name || ''} sparring ring`.trim(),
    objective: 'Blunted blades: win, and learn.',
    playerHeroes: party.map((hero) => ({ hero, role: 'Fighter' })),
    opponentName: person.name,
    opponentClassId: person.classId,
    opponentLevel: level,
    opponentPower: Math.round(38 + level * 2.6),
    enemyCount: clamp(person.spar?.size || 2, 1, 5),
    risk: 1,
    canFlee: true,
    items: battleItems(state),
  });
  state.activeEncounter.sourceMeta = { personId: person.id, team: person.spar?.team, level };
  // The captain by name, and their team.
  const first = String(person.name).split(' ')[0];
  state.activeEncounter.enemies.forEach((unit, index) => {
    unit.name = index === 0 ? person.name : `${first}’s ${['second', 'third', 'fourth', 'fifth'][index - 1] || 'mate'}`;
  });
  state.people[person.id].bouts = count + 1;
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
