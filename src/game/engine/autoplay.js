// Autonomous campaign simulation used by long tests and the sim script.
import { FORMATION_TYPES, formationForMission } from '../../data/formations.js';
import { activeHeroCount, clone, completeTutorialTargetInPlace } from './core.js';
import { roleRating } from './heroes.js';
import { launchMission } from './missions.js';
import { resolveDecision } from './outcomes.js';
import { autoResolveActiveCombat, autoResolveActiveMissionGame, concludeActiveCombat } from './encounters.js';
import { advanceMonths } from './time.js';
import { recruitCandidate } from './recruitment.js';
import { compactForSave } from './save.js';

function autoplayAssignments(state, mission) {
  const formationType = formationForMission(mission);
  const formation = FORMATION_TYPES[formationType];
  const heroes = state.heroes.filter((hero) => hero.status === 'available').sort((a, b) => b.power - a.power);
  const used = new Set();
  const assignments = [];
  formation.slots.forEach((slot) => {
    if (assignments.length >= Math.min(5, heroes.length)) return;
    const candidates = heroes
      .filter((hero) => !used.has(hero.id))
      .map((hero) => ({ hero, score: roleRating(hero, slot.role) }))
      .sort((a, b) => b.score - a.score);
    const chosen = candidates[0]?.hero;
    if (chosen && (slot.required || assignments.length < Math.min(4, heroes.length))) {
      used.add(chosen.id);
      assignments.push({ heroId: chosen.id, slotId: slot.id, role: slot.role });
    }
  });
  return { formationType, assignments };
}

export function simulateAutoplay(initialState, months = 240) {
  let state = clone(initialState);
  let elapsed = 0;
  let nextCompaction = 12;

  while (elapsed < months) {
    // Reports are presentation state. The long-horizon harness records the
    // immutable facts but clears the modal queue without cloning the world for
    // every acknowledgement.
    if (state.pendingReports?.length) {
      state.pendingReports = [];
      completeTutorialTargetInPlace(state, 'viewMissionReport');
    }

    if (state.activeEncounter) {
      if (state.activeEncounter.status === 'active') state = autoResolveActiveCombat(state, true).state;
      if (state.activeEncounter) state = concludeActiveCombat(state, true).state;
      continue;
    }

    if (state.activeMissionGame) {
      state = autoResolveActiveMissionGame(state, true).state;
      continue;
    }

    if (state.pendingDecisions.length) {
      const decision = state.pendingDecisions[0];
      const option = decision.options[0];
      state = resolveDecision(state, decision.id, option.id, true).state;
      if (state.pendingReports?.length) {
        state.pendingReports = [];
        completeTutorialTargetInPlace(state, 'viewMissionReport');
      }
      continue;
    }

    const localCandidates = state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === (state.world?.currentLocationId || 'dunmere'));
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

    const available = state.heroes.filter((hero) => hero.status === 'available');
    const localMissions = state.missions.filter((mission) => (mission.locationId || 'dunmere') === (state.world?.currentLocationId || 'dunmere'));
    if (available.length >= 2 && state.activeMissions.length < 1 && localMissions.length) {
      const mission = [...localMissions].sort((a, b) => a.difficulty - b.difficulty)[0];
      const { formationType, assignments } = autoplayAssignments(state, mission);
      const launched = launchMission(state, mission.id, formationType, assignments, true);
      if (!launched.error) state = launched.state;
    }

    // Advance to the next meaningful interruption rather than cloning the
    // complete universe once per quiet month. Competitions, aging, finances,
    // travel, rival careers and annual generation still resolve month by month
    // inside advanceMonths.
    const monthsUntilMission = state.activeMissions.length ? Math.max(1, Math.min(...state.activeMissions.map((mission) => mission.remaining))) : 12;
    const monthsUntilCompaction = Math.max(1, nextCompaction - elapsed);
    const jump = Math.min(months - elapsed, monthsUntilMission, monthsUntilCompaction, 12);
    const before = state.date.year * 12 + state.date.month;
    const advanced = advanceMonths(state, jump, true);
    state = advanced.state;
    const after = state.date.year * 12 + state.date.month;
    const progressed = Math.max(0, after - before);

    if (!progressed) {
      // A defensive escape hatch for malformed imported saves. A valid world
      // should always either advance or expose a decision/tournament.
      if ([...(state.tournaments || []), ...(state.guildTournaments || [])].some((tournament) => tournament.status === 'active')) {
        break;
      }
      const single = advanceMonths(state, 1, true);
      if (single.state === state || single.error) break;
      state = single.state;
      elapsed += 1;
    } else {
      elapsed += progressed;
    }

    if (elapsed >= nextCompaction) {
      state = compactForSave(state, true);
      nextCompaction += 12;
    }
  }

  state.pendingReports = [];
  return compactForSave(state, true);
}
