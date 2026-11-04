// @ts-check
// Autonomous campaign simulation used by long tests and the sim script.
import { ROAD_EVENTS } from '../../data/roadEvents.js';
import { resolveRoadEvent } from './timeActions.js';
import { siteFor } from '../../data/missions/index.js';
import { WEEKS_PER_MONTH, activeHeroCount, campaignDaySerial, campaignWeekSerial, clone } from './core.js';
import { buildRoom, getHallView, rentLotInPlace } from './hall.js';
import { acceptContract, activeContracts, declineContract, objectiveOpen } from './missions.js';
import { reportContract } from './outcomes.js';
import { siteAct } from './sites.js';
import { autoResolveActiveCombat, concludeActiveCombat } from './encounters.js';
import { advanceDays, advanceWeeks } from './time.js';
import { recruitCandidate } from './recruitment.js';
import { compactForSave } from './save.js';
import { resolveTownEvent } from './townLife.js';

/**
 * Plays one step of a contract in the world like a person would (missions-in-world):
 * the next open objective (a fight starts a battle; talk takes the first choice left,
 * cheapest first), a day passing for the walk; a finished contract is reported.
 * A step the party cannot do (a gate it does not meet) gives the contract up.
 */
function playContractStep(state, mission) {
  if (mission.site.status === 'ready') return reportContract(state, mission.id).state;
  const objective = siteFor(mission).objectives.find((item) => !item.optional && objectiveOpen(mission, item));
  if (!objective) return state;
  let acted;
  if (objective.kind === 'talk') {
    const choices = objective.choices.map((choice, index) => ({ choice, index })).filter(({ index }) => !mission.site.failed[`${objective.id}:${index}`]);
    const pick = choices.find(({ choice }) => !choice.cost && !choice.fight) || choices.find(({ choice }) => !choice.fight) || choices[0];
    acted = pick ? siteAct(state, mission.id, objective.id, { choice: pick.index }) : { error: 'no choice' };
  } else if (objective.kind === 'escort') {
    acted = siteAct(state, mission.id, objective.id, { arrive: mission.site.escort === objective.id });
  } else acted = siteAct(state, mission.id, objective.id);
  // A step the party cannot do now: rest a week (a story contract waits), or give the contract up.
  if (acted.error) return mission.story ? advanceDays(state, 7, true).state : declineContract(state, mission.id).state || state;
  return advanceDays(acted.state, 1, true).state;
}

// months: how long to simulate. Time runs in weeks internally.
export function simulateAutoplay(initialState, months = 240) {
  let state = clone(initialState);
  const totalWeeks = months * WEEKS_PER_MONTH;
  let elapsed = 0;
  const startWeek = campaignWeekSerial(state);
  let nextCompaction = 12 * WEEKS_PER_MONTH;

  while (elapsed < totalWeeks) {
    // Time spent on contracts (days at a time) counts too.
    elapsed = Math.max(elapsed, campaignWeekSerial(state) - startWeek);
    // Reports are presentation state. The long-horizon harness records the
    // immutable facts but clears the modal queue without cloning the world for
    // every acknowledgement.
    if (state.pendingReports?.length) {
      state.pendingReports = [];
    }

    if (state.activeEncounter) {
      if (state.activeEncounter.status === 'active') state = autoResolveActiveCombat(state, true).state;
      if (state.activeEncounter) state = concludeActiveCombat(state, true).state;
      continue;
    }

    if (state.moments?.length) state.moments = [];
    // Story scenes wait for a player; the simulation reads them as seen.
    if (state.story?.scene) state.story.scene = null;

    if (state.pendingEvent) {
      const options = state.pendingEvent.options;
      state = resolveTownEvent(state, (state.pendingEvent.source === 'story' ? options[0] : options.at(-1)).id).state;
      continue;
    }

    if (state.pendingRoadEvent) {
      state = resolveRoadEvent(state, ROAD_EVENTS[state.pendingRoadEvent.type].options.at(-1).id).state;
      continue;
    }

    const localCandidates = state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === (state.world?.currentLocationId || 'dunmere'));
    // Grow the home like a careful player: rent the stable (story mission 1), then build what is affordable.
    if (!state.guild.hqLotId) rentLotInPlace(state, undefined, 0);
    const hall = getHallView(state);
    if (hall.owned && !hall.construction) {
      const plan = hall.catalog.find((room) => !room.blocker && state.guild.crowns > room.cost + 300);
      if (plan) state = buildRoom(state, plan.id).state;
    }
    if (activeHeroCount(state) < 2 && localCandidates.length) {
      const candidate = [...localCandidates].sort((a, b) => a.signingFee - b.signingFee || b.potential - a.potential)[0];
      // The regression governor acts like a conservative AI guildmaster: when a
      // generation ends, it accepts a small emergency patron advance rather
      // than allowing the institution to become permanently unable to field a
      // legal party. The real player campaign never receives this automatic aid.
      if (state.guild.crowns < candidate.signingFee) state.guild.crowns = candidate.signingFee + 250;
      candidate.interest = Math.max(candidate.interest, 60);
      const recruited = recruitCandidate(state, candidate.id);
      if (!recruited.error) state = recruited.state;
    }

    // Contracts are played in person, one at a time: take the easiest local one, then work it.
    const available = state.heroes.filter((hero) => hero.status === 'available');
    const working = activeContracts(state)[0];
    if (working) {
      const day = campaignDaySerial(state);
      state = playContractStep(state, working);
      // Progress (a day passed, a fight began, the contract ended): keep going. Otherwise fall through.
      if (campaignDaySerial(state) !== day || state.activeEncounter || !activeContracts(state).some((item) => item.id === working.id)) continue;
    }
    const here = state.world?.currentLocationId || 'dunmere';
    const local = state.missions.filter((mission) => (mission.locationId || 'dunmere') === here && !mission.site);
    if (available.length >= 2 && local.length) {
      const mission = [...local].sort((a, b) => Number(Boolean(b.story)) - Number(Boolean(a.story)) || a.difficulty - b.difficulty)[0];
      const accepted = acceptContract(state, mission.id);
      if (!accepted.error) {
        state = accepted.state;
        continue;
      }
    }

    // Advance to the next meaningful interruption rather than cloning the
    // complete universe once per quiet month. Competitions, aging, finances,
    // travel, rival careers and annual generation still resolve month by month
    // inside advanceMonths.
    const weeksUntilMission = 4 * WEEKS_PER_MONTH;
    const weeksUntilCompaction = Math.max(1, nextCompaction - elapsed);
    const jump = Math.min(totalWeeks - elapsed, weeksUntilMission, weeksUntilCompaction, 12 * WEEKS_PER_MONTH);
    const before = campaignWeekSerial(state);
    const advanced = advanceWeeks(state, jump, true);
    state = advanced.state;
    const after = campaignWeekSerial(state);
    const progressed = Math.max(0, after - before);

    if (!progressed) {
      // A defensive escape hatch for malformed imported saves. A valid world
      // should always either advance or expose a decision/tournament.
      if ([...(state.tournaments || []), ...(state.guildTournaments || [])].some((tournament) => tournament.status === 'active')) {
        break;
      }
      const single = advanceWeeks(state, 1, true);
      if (single.state === state || single.error) break;
      state = single.state;
      elapsed += 1;
    } else {
      elapsed += progressed;
    }

    if (elapsed >= nextCompaction) {
      state = compactForSave(state, true);
      nextCompaction += 12 * WEEKS_PER_MONTH;
    }
  }

  state.pendingReports = [];
  return compactForSave(state, true);
}
