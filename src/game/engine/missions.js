// @ts-check
// Contract inspection, party selection, launch, and queueing mission encounters.
import { FORMATION_TYPES, emptyFormations } from '../../data/formations.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { createPartyEncounter } from '../combat.js';
import { PATRON_DELTAS } from '../../data/patrons.js';
import { adjustPatronInPlace } from './charter.js';
import { createMissionGame } from '../missionGames.js';
import {
  addChronicle,
  addHeroHistory,
  appointmentHolder,
  clamp,
  clone,
  finalize,
  getHero,
  hashString,
  operationalLocationIds,
  partyCapacity,
  campaignDaySerial,
  DAYS_PER_WEEK,
  tallyFamily,
  tallyGuild,
} from './core.js';
import { formationSlotFor, normalizedFormationType, partyEstimate } from './heroes.js';
import { fulfillPromisesInPlace } from './candidates.js';
import { evaluateStateInPlace } from './goals.js';
import { battleItems } from './inventory.js';
import { DECLINE_PENALTY, adjustRegionReputationInPlace, familyLevel } from './reputation.js';
import { rivalTakesContractInPlace } from './rivalry.js';
import { regionRoster } from '../../data/enemies.js';
import { bossForMission } from './stories.js';

export function inspectMission(state, missionId) {
  const next = clone(state);
  const mission = next.missions.find((item) => item.id === missionId);
  if (mission) {
    mission.inspected = true;
    next.flags.firstMissionInspected = true;
  }
  return finalize(next);
}

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
    id: `formation-${formationType}-${Date.now()}`,
    tone: 'blue',
    title: `${FORMATION_TYPES[formationType].label} saved`,
    text: 'The arrangement can be loaded for future missions and tournaments.',
  });
  return { state: finalize(next), error: null };
}

export function launchMission(state, missionId, formationTypeOrAssignments, maybeAssignments, mutate = false) {
  const next = mutate ? state : clone(state);
  const missionIndex = next.missions.findIndex((item) => item.id === missionId);
  if (missionIndex < 0) return { state, error: 'This contract is no longer available.' };
  const mission = next.missions[missionIndex];
  if (
    next.world?.activeTravel &&
    !(next.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === (mission.locationId || 'dunmere'))
  )
    return { state, error: 'Headquarters is traveling; only established branches can launch new missions until arrival.' };
  if (!operationalLocationIds(next).has(mission.locationId || 'dunmere')) {
    return {
      state,
      error: `This contract is in ${mission.locationName || LOCATION_BY_ID[mission.locationId]?.name || 'another location'}. Travel there or establish a branch before committing a company.`,
    };
  }
  const legacyCall = Array.isArray(formationTypeOrAssignments);
  const selectedFormation = normalizedFormationType(mission, legacyCall ? mission?.formationType || mission?.approach : formationTypeOrAssignments);
  const assignments = legacyCall ? formationTypeOrAssignments : maybeAssignments || [];
  if (next.activeMissions.length >= partyCapacity(next)) {
    return { state, error: `Every field company is already deployed (${partyCapacity(next)} maximum at ${next.guild.tier} tier).` };
  }
  const uniqueHeroIds = new Set(assignments.map((assignment) => assignment.heroId));
  if (assignments.length < 2 || assignments.length > 5 || uniqueHeroIds.size !== assignments.length) {
    return { state, error: 'Choose between two and five different heroes.' };
  }
  const estimate = partyEstimate(next, missionId, selectedFormation, assignments);
  if (estimate.missingSlots.length)
    return { state, error: `Fill the required ${estimate.missingSlots.join(' and ')} slot${estimate.missingSlots.length === 1 ? '' : 's'}.` };
  const unavailable = assignments.map((assignment) => getHero(next, assignment.heroId)).filter((hero) => !hero || hero.status !== 'available');
  if (unavailable.length) return { state, error: 'Every assigned hero must be available.' };
  const baseSupplyCost = 25 + mission.risk * 18 + mission.duration * 12 + (selectedFormation === 'Expedition' ? 12 : 0);
  const supplyCost = Math.max(20, Math.round(baseSupplyCost * (appointmentHolder(next, 'Quartermaster') ? 0.88 : 1)));
  if (next.guild.crowns < supplyCost) return { state, error: `The guild needs ${supplyCost} gold for supplies.` };

  next.guild.crowns -= supplyCost;
  const normalizedAssignments = assignments.map((assignment) => {
    const slot = formationSlotFor(selectedFormation, assignment);
    return { heroId: assignment.heroId, slotId: slot.id, role: slot.role };
  });
  const active = {
    ...mission,
    formationType: selectedFormation,
    assignments: clone(normalizedAssignments),
    remaining: mission.duration,
    dueDay: campaignDaySerial(next) + mission.duration * DAYS_PER_WEEK,
    startedYear: next.date.year,
    startedMonth: next.date.month,
    estimateAtLaunch: estimate.chance,
    powerAtLaunch: estimate.power,
    supplyCost,
  };
  normalizedAssignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    hero.status = 'mission';
    hero.fatigue = clamp(hero.fatigue + 10 + mission.risk * 4, 0, 100);
    hero.roleExperience[assignment.role] = (hero.roleExperience[assignment.role] || 0) + 1;
    addHeroHistory(hero, next, {
      type: 'mission-start',
      title: `Departed for ${mission.title}`,
      text: `Assigned as ${assignment.role} in a ${selectedFormation} arrangement.`,
    });
    fulfillPromisesInPlace(next, hero, 'mission', { formationType: selectedFormation, missionId: mission.id });
  });
  next.activeMissions.push(active);
  next.missions.splice(missionIndex, 1);
  tallyGuild(next, 'taken');
  tallyFamily(next, mission.family, 'taken');
  addChronicle(next, {
    type: 'departure',
    importance: mission.risk >= 3 ? 2 : 1,
    title: `${mission.title} begins`,
    text: `${normalizedAssignments.map((assignment) => `${getHero(next, assignment.heroId)?.name} (${assignment.role})`).join(', ')} depart as a ${FORMATION_TYPES[selectedFormation].label}.`,
    heroIds: normalizedAssignments.map((assignment) => assignment.heroId),
    tags: [mission.family, selectedFormation],
  });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function missionDecision(activeMission) {
  return {
    id: `decision-${activeMission.id}`,
    type: 'mission',
    missionId: activeMission.id,
    title: activeMission.title,
    prompt: activeMission.choice.prompt,
    options: activeMission.choice.options,
    createdAt: Date.now(),
  };
}

function missionEnemyClass(mission) {
  if (mission.family === 'Monster Hunt') return 'Ranger';
  if (mission.family === 'War Operation') return 'Guardian';
  if (mission.family === 'Rescue') return 'Duelist';
  if (mission.family === 'Escort') return 'Ranger';
  if (mission.family === 'Dungeon') return 'Guardian';
  return 'Guardian';
}

function missionOpponentName(mission) {
  if (mission.family === 'Monster Hunt') return `${mission.enemyPrimal || 'Wild'} apex beast`;
  if (mission.family === 'War Operation') return `${mission.locationName || mission.region} warband`;
  if (mission.family === 'Rescue') return 'Captors and their champion';
  if (mission.family === 'Escort') return 'Road ambushers';
  if (mission.family === 'Dungeon') return 'Dungeon guardians';
  return 'Hostile force';
}

export function createMissionCombatEncounterInPlace(state, mission) {
  const playerHeroes = mission.assignments
    .map((assignment) => ({ hero: getHero(state, assignment.heroId), role: assignment.role }))
    .filter((item) => item.hero && item.hero.status !== 'dead');
  if (playerHeroes.length < 2) return false;
  // The story's first fight (mission 3) is guaranteed winnable.
  const scripted = mission.story === 'm3.contract';
  const encounterSeed = (state.rngState ^ hashString(`mission-combat:${mission.id}:${state.date.year}:${state.date.month}`)) >>> 0;
  const opponentPower = clamp(Math.round(mission.difficulty * 0.84 + mission.risk * 3), 32, 96);
  // Per-hero combat: enemy level tracks difficulty (Regional contracts ~1-5, Global ~15-20).
  const opponentLevel = clamp(Math.round((mission.difficulty - 38) / 5), 1, 20);
  state.activeEncounter = createPartyEncounter({
    id: `combat-${mission.id}`,
    seed: encounterSeed,
    sourceType: 'mission',
    sourceId: mission.id,
    title: mission.title,
    roundName: 'Mission engagement',
    objective: mission.stakes || 'Break the hostile force and secure the mission objective.',
    playerHeroes,
    opponentName: missionOpponentName(mission),
    opponentPrimal: mission.enemyPrimal || LOCATION_BY_ID[mission.locationId]?.primal || 'Iron',
    opponentClassId: missionEnemyClass(mission),
    opponentPower,
    opponentLevel,
    risk: mission.risk,
    prestige: mission.fame || 0,
    // Low-risk contracts field weaker enemies than high-risk ones.
    strength: scripted ? 0.6 : (0.65 + mission.risk * 0.09) * (familyLevel(state, 'Combat') >= 4 ? 0.9 : 1),
    guaranteed: scripted,
    // Contracts use the same rosters as the wild areas around them; the Blackwood has its own.
    enemyTypes: regionRoster(/blackwood/i.test(`${mission.title} ${mission.stakes || ''}`) ? 'The Far Veil' : mission.region),
    boss: bossForMission(mission),
    items: battleItems(state),
  });
  mission.combatStarted = true;
  addChronicle(state, {
    type: 'combat',
    importance: mission.risk >= 4 ? 3 : 1,
    title: `Battle joined: ${mission.title}`,
    text: `${playerHeroes.map((item) => item.hero.name).join(', ')} enter a turn-based engagement against ${state.activeEncounter.enemyName}.`,
    heroIds: playerHeroes.map((item) => item.hero.id),
    tags: ['combat', mission.family, mission.enemyPrimal],
  });
  return true;
}

export function queueDueCombatMissionInPlace(state) {
  if (state.activeEncounter) return false;
  const mission = state.activeMissions.find(
    (item) =>
      item.remaining <= 0 &&
      item.formationType === 'Combat' &&
      !item.combatResolved &&
      !state.pendingDecisions.some((decision) => decision.missionId === item.id),
  );
  if (!mission) return false;
  return createMissionCombatEncounterInPlace(state, mission);
}

function createPlayableMissionGameInPlace(state, mission) {
  const playerHeroes = mission.assignments
    .map((assignment) => ({ hero: getHero(state, assignment.heroId), role: assignment.role }))
    .filter((item) => item.hero && item.hero.status !== 'dead');
  if (playerHeroes.length < 2) return false;
  const seed = (state.rngState ^ hashString(`mission-game:${mission.id}:${state.date.year}:${state.date.month}`)) >>> 0;
  const game = createMissionGame({ mission, playerHeroes, seed });
  if (!game) return false;
  state.activeMissionGame = game;
  mission.missionGameStarted = true;
  addChronicle(state, {
    type: 'mission-game',
    importance: mission.risk >= 4 ? 3 : 1,
    title: `${mission.formationType} challenge: ${mission.title}`,
    text: `${playerHeroes.map((item) => item.hero.name).join(', ')} reach the decisive ${mission.formationType.toLowerCase()} phase of the mission.`,
    heroIds: playerHeroes.map((item) => item.hero.id),
    tags: [mission.formationType, mission.family, 'playable'],
  });
  return true;
}

export function queueDueMissionGameInPlace(state) {
  if (state.activeEncounter || state.activeMissionGame) return false;
  const mission = state.activeMissions.find(
    (item) =>
      item.remaining <= 0 &&
      item.formationType !== 'Combat' &&
      !item.missionGameResolved &&
      !state.pendingDecisions.some((decision) => decision.missionId === item.id),
  );
  if (!mission) return false;
  if (createPlayableMissionGameInPlace(state, mission)) return true;
  state.pendingDecisions.push(missionDecision(mission));
  return true;
}

/** Decline a contract on the board: a rival takes it and the region thinks a little less of you. */
export function declineContract(state, missionId) {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission) return { state, error: 'This contract is no longer available.' };
  if (mission.story) return { state, error: 'Story contracts wait for you; they can’t be declined.' };
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
