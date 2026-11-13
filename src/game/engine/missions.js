// @ts-check
// Contracts in the world (missions-in-world spec): accepting one places its site
// (a wild area, the town itself, or a painted scene behind a door), its objectives
// and a marker; the Journal shows them as short steps. Declining, saved
// formations, and where each objective stands. Doing the objectives is sites.js;
// reporting back (grade, rewards) is outcomes.js. No simulated mission time.
import { FORMATION_TYPES, emptyFormations } from '../../data/formations.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { WILD_AREAS } from '../../data/wilds/index.js';
import { PATRON_DELTAS } from '../../data/patrons.js';
import { PAINTED_SITES, TOWN_ANCHORS, WILD_ANCHORS, placeFor, siteFor } from '../../data/missions/index.js';
import { adjustPatronInPlace } from './charter.js';
import { clone, finalize, campaignDaySerial } from './core.js';
import { formationSlotFor } from './heroes.js';
import { DECLINE_PENALTY, adjustRegionReputationInPlace } from './reputation.js';
import { rivalTakesContractInPlace } from './rivalry.js';

export function saveFormation(state, formationType, assignments) {
  const next = clone(state);
  if (!FORMATION_TYPES[formationType]) return { state, error: 'Unknown arrangement type.' };
  const availableIds = new Set(next.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).map((hero) => hero.id));
  next.guild.formations ||= emptyFormations();
  next.guild.formations[formationType] = clone(
    assignments
      .filter((assignment) => availableIds.has(assignment.heroId))
      .map((assignment) => ({
        slotId: assignment.slotId,
        role: formationSlotFor(formationType, assignment)?.role || assignment.role,
        heroId: assignment.heroId,
      })),
  );
  next.notifications.push({
    id: `formation-${formationType}-${campaignDaySerial(next)}`,
    tone: 'blue',
    title: `${FORMATION_TYPES[formationType].label} saved`,
    text: 'The arrangement can be loaded for tournaments.',
  });
  return { state: finalize(next), error: null };
}

// ---------------------------------------------------------------- the site of a contract

/** A contract's site definition (data/missions). */
export function contractSite(mission) {
  return siteFor(mission);
}

/** Where a contract is played: { kind: 'wild'|'town'|'painted', id, name }. */
export function contractPlace(mission) {
  const place = placeFor(contractSite(mission), mission.locationId);
  const name = place.kind === 'wild' ? WILD_AREAS[place.id]?.name : place.kind === 'painted' ? PAINTED_SITES[place.id]?.name : LOCATION_BY_ID[place.id]?.name;
  return { ...place, name: name || place.id };
}

const isActive = (mission) => mission.accepted && mission.site && ['active', 'ready'].includes(mission.site.status);

/** The contracts being played now. */
export function activeContracts(state) {
  return (state.missions || []).filter(isActive);
}

/**
 * Places each objective on a free spot of its place: tiles in a wild area or a
 * town, spots (people, fights) and boxes (clues) on a painting. Contracts sharing
 * a place start further along the list so they do not stand on each other.
 */
function slotsFor(state, mission, place, objectives) {
  const others = activeContracts(state).filter((item) => item.id !== mission.id && item.site?.place?.kind === place.kind && item.site?.place?.id === place.id).length;
  const slots = {};
  if (place.kind === 'painted') {
    const site = PAINTED_SITES[place.id];
    let spot = others;
    let box = others;
    objectives.forEach((objective) => {
      if (['inspect', 'collect'].includes(objective.kind)) slots[objective.id] = { box: site.boxes[box++ % site.boxes.length] };
      else slots[objective.id] = { at: site.spots[spot++ % site.spots.length] };
    });
    return slots;
  }
  const anchors = place.kind === 'wild' ? WILD_ANCHORS[place.id] || WILD_AREAS[place.id]?.anchors || [] : TOWN_ANCHORS[place.id] || [];
  objectives.forEach((objective, index) => {
    slots[objective.id] = { tile: anchors[(others * objectives.length + index) % Math.max(1, anchors.length)] || [2, 2] };
  });
  return slots;
}

/**
 * Accepts a contract in place: it becomes active, its site and objectives are
 * placed, and it shows in the Journal and on the map. `giver` is the person who
 * offered it ({ id, name }), or null for the notice board.
 */
export function acceptContractInPlace(state, mission, giver = null) {
  const site = contractSite(mission);
  const place = placeFor(site, mission.locationId);
  const today = campaignDaySerial(state);
  mission.unlocked = true;
  mission.accepted = true;
  if (giver) {
    mission.giverId = giver.id;
    mission.giverName = giver.name;
  }
  mission.site = {
    status: 'active',
    place,
    slots: slotsFor(state, mission, place, site.objectives),
    done: {},
    progress: {},
    failed: {},
    escort: null,
    alarm: false,
    kos: 0,
    rough: 0,
    startDay: today,
    par: site.par || 3,
    deadlineDay: site.deadline ? today + site.deadline : null,
  };
  // Story mission 3: a friendly peddler meets the party as it sets out (potions for the first fight).
  if (mission.story === 'm3.contract' && !state.flags.openingPeddler) {
    state.flags.openingPeddler = true;
    state.pendingRoadEvent = { id: 'opening-peddler', type: 'peddler', day: 0, scripted: true, toId: mission.locationId, where: `Setting out: ${mission.title}` };
  }
  const where = contractPlace(mission);
  state.notifications.push({ id: `contract-accepted-${mission.id}`, tone: 'blue', title: mission.title, text: `${where.name}: ${firstStep(state, mission)?.text || 'see the Journal'}.` });
}

/** Accepts a posted contract from the notice board. */
export function acceptContract(state, missionId) {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission) return { state, error: 'That contract is gone.' };
  if (isActive(mission)) return { state, error: 'You already took that one.' };
  const next = clone(state);
  acceptContractInPlace(
    next,
    next.missions.find((item) => item.id === missionId),
  );
  return { state: finalize(next), error: null };
}

/** Turns a contract down (or gives up on one): a rival takes it, and reputation drops a little. */
export function declineContract(state, missionId) {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission) return { state, error: 'This contract is no longer available.' };
  if (mission.story || mission.bossId) return { state, error: 'Story and boss contracts wait for you; they can’t be declined.' };
  const next = clone(state);
  next.missions = next.missions.filter((item) => item.id !== missionId);
  const rival = rivalTakesContractInPlace(next, mission, 'declined');
  adjustRegionReputationInPlace(next, mission.region, -DECLINE_PENALTY);
  if (mission.patron) adjustPatronInPlace(next, mission.patron, PATRON_DELTAS.decline, 'you turned down their contract');
  if (rival)
    next.notifications.push({
      id: `declined-${missionId}`,
      tone: 'blue',
      title: `${rival.name} took “${mission.title}”`,
      text: `Declined. ${mission.region} reputation −${DECLINE_PENALTY}.`,
    });
  return { state: finalize(next), error: null };
}

// ---------------------------------------------------------------- objectives and steps

/** An objective can be done now: not done, and the one it waits on is done. */
export function objectiveOpen(mission, objective) {
  const done = mission.site?.done || {};
  return !done[objective.id] && (!objective.after || Boolean(done[objective.after]));
}

const VERBS = { fight: 'Defeat', talk: 'Talk to', inspect: 'Inspect', collect: 'Collect', escort: 'Escort' };

/** One objective as a short step: "Defeat the pack", "Collect nightcap (1/3)". */
function stepText(mission, objective) {
  if (objective.kind === 'collect' && objective.count > 1) return `${VERBS.collect} ${objective.name.toLowerCase()} (${mission.site?.progress?.[objective.id] || 0}/${objective.count})`;
  if (objective.kind === 'escort' && mission.site?.escort === objective.id) return `Bring ${objective.name} to safety`;
  const name = objective.kind === 'talk' || objective.kind === 'escort' ? objective.name : objective.name.charAt(0).toLowerCase() + objective.name.slice(1);
  return `${VERBS[objective.kind] || 'Find'} ${name}`;
}

/** Who to report back to when the work is done. */
export function reportTo(mission) {
  if (mission.story) return null;
  return mission.giverName || 'the Notice Board';
}

/**
 * The contract as short steps for the Journal and the board: each objective
 * (done, open, waiting or optional), then "Return to …". Steps update as you do them.
 */
export function contractSteps(state, mission) {
  const site = contractSite(mission);
  const steps = site.objectives.map((objective) => ({
    id: objective.id,
    kind: objective.kind,
    text: stepText(mission, objective),
    done: Boolean(mission.site?.done?.[objective.id]),
    open: mission.site ? objectiveOpen(mission, objective) : !objective.after,
    optional: Boolean(objective.optional),
  }));
  const back = reportTo(mission);
  if (back) steps.push({ id: 'report', kind: 'report', text: `Return to ${back}`, done: false, open: mission.site?.status === 'ready', optional: false });
  return steps;
}

/** The next thing to do for a contract (the Journal's and the goal line's step). */
export function firstStep(state, mission) {
  return contractSteps(state, mission).find((step) => !step.done && step.open && !step.optional) || null;
}

/** A contract's deadline, in days from today (null when it has none). */
export function contractDaysLeft(state, mission) {
  if (!mission.site?.deadlineDay) return null;
  return mission.site.deadlineDay - campaignDaySerial(state);
}

/**
 * What stands at a place for the scenes: every open objective of every active
 * contract here, with where it stands. Escorts in progress add their destination.
 */
export function siteObjects(state, kind, id) {
  const out = [];
  activeContracts(state)
    .filter((mission) => mission.site.place.kind === kind && mission.site.place.id === id)
    .forEach((mission) => {
      const site = contractSite(mission);
      site.objectives.forEach((objective) => {
        if (!objectiveOpen(mission, objective)) return;
        if (objective.kind === 'escort' && mission.site.escort === objective.id) {
          const to = objective.to === 'exit' ? null : mission.site.slots[objective.to];
          out.push({ missionId: mission.id, objective, slot: to || exitSlot(kind, id), arrive: true, title: mission.title });
          return;
        }
        out.push({ missionId: mission.id, objective, slot: mission.site.slots[objective.id], title: mission.title });
      });
    });
  return out;
}

/** Where an escort to "the way out" ends: by the wild area's entrance, or the painted site's door. */
function exitSlot(kind, id) {
  if (kind === 'wild') return { tile: WILD_AREAS[id]?.arrive || [2, 2] };
  if (kind === 'painted') return { at: [50, 80] };
  return { tile: TOWN_ANCHORS[id]?.[0] || [2, 2] };
}

/** The painted sites with an active contract in this town (their doors stand in the town). */
export function siteDoors(state, townId) {
  const ids = new Set(activeContracts(state).filter((mission) => mission.site.place.kind === 'painted').map((mission) => mission.site.place.id));
  return [...ids].map((id) => ({ id, ...PAINTED_SITES[id] })).filter((site) => site.town === townId);
}
