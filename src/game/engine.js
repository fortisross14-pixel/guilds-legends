import {
  ACHIEVEMENTS,
  APPOINTMENTS,
  CHAPTER_GOALS,
  CLASSES,
  normalizeClassId,
  FACILITIES,
  MONTHS,
  ONBOARDING_STEPS,
  REGIONS,
  SAGA_DEFINITIONS,
  STARTING_HEROES,
  TIERS,
} from '../data/content.js';
import { FORMATION_TYPES, PARTY_ROLES, emptyFormations, formationForMission } from '../data/formations.js';
import { LOCATION_BY_ID, LOCATIONS, PRIMALS, PRIMAL_IDS, RARITIES, primalCombatModifier, unlockedLocations } from '../data/world.js';
import { GUILD_BLUEPRINTS, GUILD_TOURNAMENT_DEFINITIONS, INDIVIDUAL_TOURNAMENT_DEFINITIONS } from '../data/universe.js';
import { autoResolveEncounter, createDuelEncounter, createPartyEncounter, missionGradeFromCombat, performCombatAction } from './combat.js';
import { artifactEffectFromPrestige, defaultAmbitionForHero } from './legacy.js';
import { autoResolveMissionGame, createMissionGame, missionGradeFromMissionGame, performMissionGameAction } from './missionGames.js';
import {
  MAX_CHRONICLE,
  MAX_HEROES,
  MAX_HERO_HISTORY,
  MAX_MISSION_HISTORY,
  MAX_TITLE_HISTORY,
  MAX_TOURNAMENT_HISTORY,
  MAX_WORLD_HERO_HISTORY,
  SCHEMA_VERSION,
  activeHeroCount,
  addChronicle,
  addHeroHistory,
  appointmentHolder,
  campaignMonthSerial,
  clamp,
  clearHeroAppointmentInPlace,
  clone,
  commitRng,
  compactHero,
  completeTutorialTargetInPlace,
  dateLabel,
  ensureTournamentCareer,
  finalize,
  getCurrentLocation,
  getHero,
  getHeroGuildName,
  getReport,
  getWorldHeroes,
  hashString,
  heroCapacity,
  isGuildDefunct,
  makeRng,
  operationalLocationIds,
  partyCapacity,
  rngFor,
  tierIndexByName,
  uid,
} from './engine/core.js';
import {
  adjustRelationshipInPlace,
  applyXpInPlace,
  calculatePower,
  choosePrimal,
  createHeroFromBase,
  formationSlotFor,
  generateHero,
  normalizedFormationType,
  partyEstimate,
  roleRating,
} from './engine/heroes.js';
import {
  candidateDemandFor,
  fulfillPromisesInPlace,
  makeCandidate,
  refreshCandidatesForLocationInPlace,
  updatePromiseDeadlinesInPlace,
} from './engine/candidates.js';
import { createTitleRecords, createUniverseInPlace, createWorldArtifactsInPlace, refreshMissionsInPlace } from './engine/universe.js';
import { getGuildRankSummary } from './engine/rankings.js';
import {
  ensureGuildmasterInPlace,
  evaluateHeroAmbitionsInPlace,
  offerInheritedAmbitionsInPlace,
  releaseHeroInPlace,
  retireHeroInPlace,
  simulateBranchesInPlace,
  transferArtifactsFromHeroInPlace,
} from './engine/institution.js';
import { evaluateStateInPlace, getGoalMetric, promotionRequirement } from './engine/goals.js';
import { applyDebtInPlace, getPatronLoanOffer, monthlyUpkeep, progressTravelInPlace } from './engine/economy.js';

function facilityLevels() {
  return Object.fromEntries(
    FACILITIES.map((facility) => [
      facility.id,
      facility.id === 'great-hall' ? 1 : facility.id === 'training-yard' || facility.id === 'infirmary' || facility.id === 'archive' ? 1 : 0,
    ]),
  );
}

function initialStats() {
  return {
    eventSerial: 1,
    missionsCompleted: 0,
    missionsWon: 0,
    missionsLost: 0,
    combatWins: 0,
    tournamentBest: 99,
    tournamentsWon: 0,
    individualTournamentWins: 0,
    guildTournamentWins: 0,
    localTournamentWins: 0,
    professionalTournamentWins: 0,
    eliteTournamentWins: 0,
    perfectHardMission: 0,
    upsets: 0,
    inheritedWill: 0,
    rivalries: 0,
    mythicFeats: 0,
    signatureFeats: 0,
    branchesFounded: 0,
    successions: 0,
    ambitionsCompleted: 0,
    inheritedAmbitionsCompleted: 0,
    rivalSplits: 0,
    rivalPoaches: 0,
    alignmentChosen: 0,
    births: 0,
    deaths: 0,
    retirements: 0,
    highestPower: 0,
    yearsPlayed: 0,
    bankruptMonths: 0,
    patronLoans: 0,
    refoundings: 0,
  };
}

export function createNewGame(options = {}) {
  const seed = options.seed ?? hashString(`${options.guildName || 'Broken Lantern'}-${Date.now()}`);
  const rng = makeRng(seed);
  const founderName = (options.founderName || options.founder || 'Rowan Vale').replace(/^Guildmaster\s+/i, '').trim() || 'Rowan Vale';
  const founderClass = CLASSES[options.founderClass] ? options.founderClass : 'Guardian';
  const founderPrimal = PRIMALS[options.founderPrimal] ? options.founderPrimal : 'Fire';
  const state = {
    schemaVersion: SCHEMA_VERSION,
    id: options.id || `campaign-${seed.toString(36)}`,
    seed,
    rngState: seed,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    date: { year: 1187, month: 0 },
    guild: {
      id: 'player',
      name: options.guildName || 'The Broken Lantern',
      motto: options.motto || 'No light is lost forever.',
      crest: options.crest || 'lantern',
      founder: founderName,
      founderHeroId: 'founder-player',
      currentGuildmasterHeroId: 'founder-player',
      successorHeroId: null,
      tierIndex: 0,
      tier: 'Regional',
      fame: 8,
      legacy: 2,
      crowns: 720,
      alignment: 'Undeclared',
      rank: 18,
      contractsCompleted: 0,
      wins: 0,
      losses: 0,
      deaths: 0,
      fallen: false,
      charter: true,
      loan: null,
      unpaidMonths: 0,
      facilities: facilityLevels(),
      appointments: {},
      formations: emptyFormations(),
      branches: [],
      policies: { retreat: 'Measured', treasure: 'Guild Share', publicity: 'Truthful' },
      obligations: [],
      rivalries: [],
    },
    world: { currentLocationId: 'dunmere', visitedLocationIds: ['dunmere'], activeTravel: null },
    council: { lastReport: null, unread: false },
    heroes: [],
    historicHeroes: [],
    candidates: [],
    rivals: [],
    freeAgents: [],
    worldHistoricHeroes: [],
    missions: [],
    activeMissions: [],
    activeEncounter: null,
    activeMissionGame: null,
    pendingDecisions: [],
    missionHistory: [],
    tournamentHistory: [],
    pendingReports: [],
    chronicle: [],
    artifacts: [],
    worldArtifacts: [],
    titleRecords: {},
    guildTournaments: [],
    universeStats: {},
    sagas: SAGA_DEFINITIONS.map((saga) => ({ ...saga, progress: 0, completed: false, discovered: saga.tier === 'Regional' })),
    tournaments: [],
    tutorial: { step: 0, completed: false, acknowledged: false },
    goals: CHAPTER_GOALS.map((goal) => ({ ...goal, completed: false, claimed: false })),
    achievements: ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: false, unlockedDate: null })),
    stats: initialStats(),
    notifications: [],
    settings: { autosave: true, reducedMotion: false, compactMode: false, difficulty: 'Standard' },
    legacy: { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] },
    flags: {
      firstMissionInspected: false,
      firstHeroInspected: false,
      goalsInspected: false,
      politicalChoiceOffered: false,
      firstCompanionHired: false,
      firstTravelCompleted: false,
    },
  };

  const founder = createHeroFromBase(
    {
      id: 'founder-player',
      name: founderName,
      classId: founderClass,
      primal: founderPrimal,
      rarity: 'Rare',
      level: 1,
      xp: 0,
      age: 27,
      power: 48,
      potential: 84,
      personality: 'Determined',
      flaw: 'Pride',
      dream: 'Build a guild that outlives me',
      origin: 'Founder of the Broken Lantern',
      homeLocationId: 'dunmere',
      loyalty: 100,
      hook: `You raised the banner yourself. ${founderName} is a level 1 ${founderPrimal} ${founderClass} whose career will define the institution.`,
      hiddenTrait: 'None',
    },
    state,
    rng,
    { homeLocationId: 'dunmere' },
  );
  founder.salary = 0;
  founder.renown = 2;
  founder.legacy = 1;
  state.heroes = [founder];
  addHeroHistory(founder, state, {
    type: 'founding',
    title: `Founded ${state.guild.name}`,
    text: 'Signed the Dunmere charter alone, at level 1, with no company yet standing behind the banner.',
  });

  const openingPool = [...STARTING_HEROES];
  const openingPrimals = ['Fire', rng.pick(PRIMAL_IDS.filter((id) => id !== 'Fire')), rng.pick(PRIMAL_IDS.filter((id) => id !== 'Fire'))];
  if (openingPrimals[2] === openingPrimals[1]) {
    openingPrimals[2] = PRIMAL_IDS.find((id) => id !== 'Fire' && id !== openingPrimals[1]) || 'Water';
  }
  while (state.candidates.length < 3 && openingPool.length) {
    const index = rng.int(0, openingPool.length - 1);
    const base = openingPool.splice(index, 1)[0];
    const primal = openingPrimals[state.candidates.length] || choosePrimal(rng, 'dunmere');
    const candidate = createHeroFromBase(
      { ...base, power: 45 + rng.int(-2, 4), level: rng.int(1, 3), rarity: rng.chance(0.3) ? 'Rare' : 'Uncommon', primal, homeLocationId: 'dunmere' },
      state,
      rng,
      { homeLocationId: 'dunmere' },
    );
    candidate.status = 'candidate';
    candidate.locationId = 'dunmere';
    candidate.channel = 'Founding appeal';
    candidate.signingFee = 0;
    candidate.buyoutFee = 0;
    candidate.demand = null;
    candidate.expiresYear = state.date.year + 1;
    candidate.interest = 100;
    candidate.hook = `${candidate.hook} Will join the founding pair without a signing fee.`;
    state.candidates.push(candidate);
  }

  createUniverseInPlace(state, rng);
  refreshMissionsInPlace(state, rng, true);
  refreshCandidatesForLocationInPlace(state, rng, 'dunmere');
  createTournamentsInPlace(state, rng);
  commitRng(state, rng);

  addChronicle(state, {
    type: 'founding',
    importance: 5,
    title: `${founderName} raises the banner of ${state.guild.name}`,
    text: `A level 1 ${founderPrimal} ${founderClass} stands in Dunmere, searching for the first companion willing to rebuild the vanished company.`,
    heroIds: [founder.id],
    tags: ['founding', 'broken-lantern', founderPrimal],
  });
  state.notifications.push({
    id: 'welcome',
    tone: 'gold',
    title: 'A banner, not yet a company',
    text: 'Hire one local companion. Then choose what kind of company the pair can become.',
  });
  evaluateStateInPlace(state);
  return state;
}

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
  next.heroes.push(founder, recruit);
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

export function acknowledgeWelcome(state) {
  const next = clone(state);
  next.tutorial.acknowledged = true;
  completeTutorialTargetInPlace(next, 'acknowledgeWelcome');
  return finalize(next);
}

export function inspectMission(state, missionId) {
  const next = clone(state);
  const mission = next.missions.find((item) => item.id === missionId);
  if (mission) {
    mission.inspected = true;
    next.flags.firstMissionInspected = true;
    if (mission.templateId === 'wolves-old-road') completeTutorialTargetInPlace(next, 'inspectMission');
  }
  return finalize(next);
}

export function notePartySelection(state, missionId, formationTypeOrAssignments, maybeAssignments) {
  const next = clone(state);
  const mission = next.missions.find((item) => item.id === missionId);
  const legacyCall = Array.isArray(formationTypeOrAssignments);
  const formationType = normalizedFormationType(mission, legacyCall ? mission?.formationType || mission?.approach : formationTypeOrAssignments);
  const assignments = legacyCall ? formationTypeOrAssignments : maybeAssignments || [];
  const estimate = partyEstimate(next, missionId, formationType, assignments);
  if (mission?.templateId === 'wolves-old-road' && assignments.length >= 2 && estimate.missingSlots.length === 0) {
    completeTutorialTargetInPlace(next, 'selectParty');
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
  if (next.guild.crowns < supplyCost) return { state, error: `The guild needs ${supplyCost} crowns for supplies.` };

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
  addChronicle(next, {
    type: 'departure',
    importance: mission.risk >= 3 ? 2 : 1,
    title: `${mission.title} begins`,
    text: `${normalizedAssignments.map((assignment) => `${getHero(next, assignment.heroId)?.name} (${assignment.role})`).join(', ')} depart as a ${FORMATION_TYPES[selectedFormation].label}.`,
    heroIds: normalizedAssignments.map((assignment) => assignment.heroId),
    tags: [mission.family, selectedFormation],
  });
  if (mission.templateId === 'wolves-old-road') completeTutorialTargetInPlace(next, 'launchMission');
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

function missionDecision(activeMission) {
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

function missionCombatObjective(mission) {
  if (mission.family === 'Rescue' || mission.family === 'Escort') return { type: 'protect', target: 6, label: 'Protect the objective until relief arrives' };
  if (mission.family === 'Dungeon') return { type: 'break', target: 100, label: 'Break the hostile position' };
  if (mission.family === 'War Operation') return { type: 'hold', target: 7, label: 'Hold the field until relief arrives' };
  if (mission.family === 'Monster Hunt') return { type: 'eliminate', target: 100, label: 'Bring down the target' };
  return { type: 'capture', target: 100, label: 'Secure the objective' };
}

function createMissionCombatEncounterInPlace(state, mission) {
  const playerHeroes = mission.assignments
    .map((assignment) => ({ hero: getHero(state, assignment.heroId), role: assignment.role }))
    .filter((item) => item.hero && item.hero.status !== 'dead');
  if (playerHeroes.length < 2) return false;
  const encounterSeed = (state.rngState ^ hashString(`mission-combat:${mission.id}:${state.date.year}:${state.date.month}`)) >>> 0;
  const opponentPower = clamp(Math.round(mission.difficulty * 0.84 + mission.risk * 3), 32, 96);
  const opponentLevel = clamp(Math.round(1 + (mission.difficulty - 28) / 4.5), 1, 20);
  const objective = missionCombatObjective(mission);
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
    objectiveType: objective.type,
    objectiveTarget: objective.target,
    objectiveLabel: objective.label,
  });
  mission.combatStarted = true;
  addChronicle(state, {
    type: 'combat',
    importance: mission.risk >= 4 ? 3 : 1,
    title: `Battle joined: ${mission.title}`,
    text: `${playerHeroes.map((item) => item.hero.name).join(', ')} enter a turn-based engagement against ${state.activeEncounter.enemy.name}.`,
    heroIds: playerHeroes.map((item) => item.hero.id),
    tags: ['combat', mission.family, mission.enemyPrimal],
  });
  return true;
}

function queueDueCombatMissionInPlace(state) {
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

function queueDueMissionGameInPlace(state) {
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

function resolveMonthlyHeroActivities(state, rng) {
  const trainingLevel = state.guild.facilities['training-yard'] || 0;
  const trainingMaster = appointmentHolder(state, 'Training Master');
  const infirmaryLevel = (state.guild.facilities.infirmary || 0) + (appointmentHolder(state, 'Master Healer') ? 1 : 0);
  const results = [];
  let scouts = 0;
  let exhibitionFame = 0;

  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    if (hero.status === 'mission') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Mission', icon: '⌖', summary: 'Deployed on an active mission.' });
      return;
    }
    if (hero.status === 'tournament') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Tournament', icon: '♛', summary: 'Committed to an active tournament.' });
      return;
    }

    const requested = hero.monthlyActivity || (hero.status === 'injured' ? 'Infirmary' : 'Training');
    const activity = hero.status === 'injured' && !['Infirmary', 'Rest'].includes(requested) ? 'Infirmary' : requested;
    const before = {
      level: hero.level,
      xp: hero.xp || 0,
      careerXp: hero.career.xpEarned || 0,
      health: hero.health,
      fatigue: hero.fatigue,
      renown: hero.renown,
      loyalty: hero.loyalty,
    };
    let summary = '';

    if (hero.status === 'injured') {
      const treatmentBonus = activity === 'Infirmary' ? 1 + Math.floor(infirmaryLevel / 2) : 0;
      hero.injuryMonths -= 1 + treatmentBonus + (infirmaryLevel >= 3 && rng.chance(0.25) ? 1 : 0);
      hero.health = clamp(hero.health + 5 + infirmaryLevel * 3 + (activity === 'Infirmary' ? 5 : 0), 0, 100);
      hero.fatigue = clamp(hero.fatigue - (activity === 'Rest' ? 18 : 14), 0, 100);
      if (hero.injuryMonths <= 0) {
        hero.status = 'available';
        hero.injury = null;
        hero.health = Math.max(hero.health, 72);
        state.notifications.push({
          id: `recover-${hero.id}-${state.date.year}-${state.date.month}`,
          tone: 'green',
          title: `${hero.name} returns`,
          text: 'Recovery is complete and the hero is available again.',
        });
        addHeroHistory(hero, state, { type: 'recovery', title: 'Returned from injury', text: 'Cleared by the guild infirmary.' });
        summary = 'Cleared from injury and returned to active duty.';
      } else {
        summary = `${activity === 'Infirmary' ? 'Treated in the infirmary' : 'Rested'}; ${Math.max(1, hero.injuryMonths)} month${hero.injuryMonths === 1 ? '' : 's'} of recovery remain.`;
      }
    } else if (activity === 'Rest') {
      hero.fatigue = clamp(hero.fatigue - (24 + infirmaryLevel * 2), 0, 100);
      hero.health = clamp(hero.health + 7 + infirmaryLevel, 0, 100);
      hero.form = clamp(hero.form + 1, 35, 92);
      summary = 'Recovered health and fatigue.';
    } else if (activity === 'Infirmary') {
      hero.fatigue = clamp(hero.fatigue - (18 + infirmaryLevel * 2), 0, 100);
      hero.health = clamp(hero.health + 11 + infirmaryLevel * 3, 0, 100);
      const xp = Math.max(1, 2 + infirmaryLevel);
      applyXpInPlace(hero, xp, state, 'rehabilitation');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      summary = `Rehabilitated under medical supervision and gained ${xp} XP.`;
    } else if (activity === 'Scouting') {
      scouts += 1 + (['Ranger', 'Rogue'].includes(hero.classId) ? 1 : 0);
      const xp = 4 + (state.guild.facilities['scout-office'] || 0) * 2;
      applyXpInPlace(hero, xp, state, 'field scouting');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      hero.fatigue = clamp(hero.fatigue + 3, 0, 100);
      hero.roleExperience.Scout = (hero.roleExperience.Scout || 0) + 1;
      summary = `Searched the local region and gained ${xp} XP.`;
    } else if (activity === 'Public Exhibition') {
      const fame = rng.int(1, 3) + (normalizeClassId(hero.classId) === 'Scholar' ? 1 : 0);
      state.guild.fame += fame;
      exhibitionFame += fame;
      hero.renown += rng.int(1, 2);
      hero.fatigue = clamp(hero.fatigue + 4, 0, 100);
      const xp = 3;
      applyXpInPlace(hero, xp, state, 'public exhibition');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      summary = `Earned ${fame} guild fame and increased personal renown.`;
    } else if (activity === 'Guild Duty') {
      const appointed = Boolean(hero.appointment);
      hero.loyalty = clamp(hero.loyalty + (appointed ? 2 : 1), 0, 100);
      const xp = appointed ? 4 : 2;
      applyXpInPlace(hero, xp, state, 'guild duty');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      if (appointed && rng.chance(0.22)) state.guild.legacy += 1;
      summary = appointed
        ? `Worked as ${hero.appointment}; loyalty and institutional experience improved.`
        : 'Handled routine guild work and strengthened loyalty.';
    } else {
      hero.fatigue = clamp(hero.fatigue - (7 + infirmaryLevel), 0, 100);
      hero.health = clamp(hero.health + 2 + infirmaryLevel, 0, 100);
      hero.form = clamp(hero.form + rng.int(-2, 2), 35, 92);
      const focusBonus = { Fundamentals: 1, 'Role Drills': 2, Sparring: 3, Mentorship: 2, Study: 2 }[hero.training] || 1;
      const fatiguePenalty = hero.training === 'Sparring' ? 5 : hero.training === 'Role Drills' ? 2 : 1;
      const mentor = hero.mentorId ? getHero(state, hero.mentorId) : null;
      const mentorBonus =
        mentor && !['dead', 'retired', 'mission', 'tournament'].includes(mentor.status)
          ? Math.max(1, Math.min(4, Math.floor(((mentor.level || 1) - (hero.level || 1)) / 3) + 1))
          : 0;
      const xp = Math.max(
        2,
        5 + trainingLevel * 2 + focusBonus + (trainingMaster && trainingMaster.id !== hero.id ? 2 : 0) + mentorBonus - Math.floor(hero.level / 8),
      );
      applyXpInPlace(hero, xp, state, `${hero.training.toLowerCase()} training`);
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      hero.fatigue = clamp(hero.fatigue + fatiguePenalty, 0, 100);
      summary = `${hero.training} training produced ${xp} XP${mentorBonus ? `, including ${mentorBonus} from ${mentor.name}'s mentorship` : ''}.`;
    }

    results.push({
      heroId: hero.id,
      name: hero.name,
      activity,
      icon: { Training: '⚔', Rest: '☾', Infirmary: '✚', Scouting: '⌖', 'Public Exhibition': '✦', 'Guild Duty': '♜' }[activity] || '◆',
      summary,
      levelBefore: before.level,
      levelAfter: hero.level,
      xpDelta: Math.max(0, (hero.career.xpEarned || 0) - before.careerXp),
      healthDelta: hero.health - before.health,
      fatigueDelta: hero.fatigue - before.fatigue,
      renownDelta: hero.renown - before.renown,
      loyaltyDelta: hero.loyalty - before.loyalty,
    });
  });

  if (scouts > 0) {
    const locationId = state.world?.currentLocationId || 'dunmere';
    const extraCandidateChance = clamp(0.2 + scouts * 0.12 + (state.guild.facilities['scout-office'] || 0) * 0.08, 0, 0.85);
    if (rng.chance(extraCandidateChance)) {
      const candidate = makeCandidate(state, rng, scouts >= 3 ? 'veteran' : null, locationId);
      candidate.expiresYear = state.date.year + 1;
      state.candidates.push(candidate);
      state.notifications.push({
        id: `scout-recruit-${candidate.id}`,
        tone: 'blue',
        title: 'Scouts found new talent',
        text: `${candidate.name}, a ${candidate.rarity} ${candidate.classId}, has appeared in the local market.`,
      });
    }
  }

  return { results, scouts, exhibitionFame };
}

function simulateRivals(state, rng) {
  state.rivals.forEach((rival) => {
    rival.seasonPoints ||= 0;
    rival.careerPoints ||= 0;
    rival.prizeMoney ||= 0;
    const roster = [rival.star, ...(rival.members || [])].filter(Boolean);
    const activityChance = 0.48 + rival.risk * 0.3;
    if (rng.chance(activityChance)) {
      const participant = rng.chance(0.52) ? rival.star : rng.pick(roster);
      ensureTournamentCareer(participant);
      const difficulty = 47 + rival.tierIndex * 11 + rng.int(-8, 13);
      const effective =
        rival.power + rival.form * 0.12 + (participant.specializations?.missions || 0) * 0.7 + (rival.strategy === 'spend' ? 4 : 0) + rng.int(-9, 9);
      const winChance = clamp(1 / (1 + Math.exp(-(effective - difficulty) / 10)), 0.12, 0.9);
      const won = rng.chance(winChance);
      participant.career.missions += 1;
      if (won) {
        const fameGain = rng.int(3, 9) + rival.tierIndex * 2;
        rival.fame += fameGain;
        rival.legacy += Math.max(1, Math.round(fameGain * 0.4));
        rival.crowns += rng.int(90, 300) * (rival.tierIndex + 1);
        rival.wins += 1;
        rival.seasonPoints += 3 + rival.tierIndex;
        rival.careerPoints += 2 + rival.tierIndex;
        rival.form = clamp(rival.form + rng.int(1, 4), 35, 90);
        participant.renown += rng.int(1, 3);
        participant.career.wins += 1;
        participant.career.earnings += rng.int(30, 100) * (rival.tierIndex + 1);
        participant.specializations.missions = clamp((participant.specializations?.missions || 0) + (rng.chance(0.2) ? 1 : 0), 0, 15);
      } else {
        rival.losses += 1;
        rival.form = clamp(rival.form - rng.int(1, 5), 25, 90);
        rival.crowns -= rng.int(35, 140);
        participant.career.defeats += 1;
        rival.seasonPoints = Math.max(0, rival.seasonPoints - 1);
        if (rng.chance(0.025 * rival.risk)) {
          addChronicle(state, {
            type: 'rival',
            importance: 2,
            title: `${rival.name} returns bloodied`,
            text: `${participant.name} survives a disastrous contract that weakens the guild’s standing.`,
            guildIds: [rival.id],
            heroIds: [participant.id],
            tags: ['rival', 'defeat'],
          });
        }
      }
    }
    rival.crowns -= 25 + rival.tierIndex * 15;
    rival.power = Math.round(
      roster
        .sort((a, b) => b.power - a.power)
        .slice(0, 5)
        .reduce((sum, hero) => sum + hero.power, 0) / Math.max(1, Math.min(5, roster.length)),
    );
    if (rival.crowns < -500) rival.fallen = true;
    if (rival.fallen && rival.crowns > 300) rival.fallen = false;
    // Rival institutions keep their league identity stable. Their results,
    // rosters and rankings change, but a familiar Regional opponent does not
    // disappear from the ladder simply because its fame has grown.
    rival.tierIndex = rival.leagueTierIndex ?? rival.tierIndex;
  });
}

function runAiTransferMarketInPlace(state, rng) {
  const freeAgents = [...(state.freeAgents || [])]
    .filter((hero) => hero.status === 'free-agent')
    .sort(
      (a, b) => b.power + b.level * 1.7 + (b.specializations?.tournament || 0) * 1.4 - (a.power + a.level * 1.7 + (a.specializations?.tournament || 0) * 1.4),
    );
  let signings = 0;
  const signedIds = new Set();
  const released = [];

  for (const candidate of freeAgents) {
    if (signings >= 5) break;
    const candidateTier = heroCompetitionTier(state, candidate);
    const suitors = state.rivals
      .filter((guild) => (guild.leagueTierIndex ?? guild.tierIndex) >= candidateTier)
      .map((guild) => {
        const members = guild.members || [];
        const weakest = [...members].sort((a, b) => a.power + (a.specializations?.tournament || 0) - (b.power + (b.specializations?.tournament || 0)))[0];
        const fit = guild.specialty === candidate.classId ? 8 : 0;
        const need = weakest ? candidate.power - weakest.power : 12;
        return { guild, weakest, score: need + fit + rng.int(-4, 6) };
      })
      .filter((row) => !row.weakest || row.score >= 5)
      .sort((a, b) => b.score - a.score);
    if (!suitors.length) continue;
    const { guild, weakest } = suitors[0];
    if (weakest) {
      guild.members = guild.members.filter((hero) => hero.id !== weakest.id);
      if ((weakest.age || 24) < 36) {
        weakest.guildId = null;
        weakest.status = 'free-agent';
        released.push(weakest);
      } else {
        weakest.status = 'retired';
        weakest.retiredYear = state.date.year;
        if ((weakest.career?.titles || 0) > 0 || weakest.legacy >= 90) state.worldHistoricHeroes.push(compactHero(weakest));
      }
    }
    candidate.guildId = guild.id;
    candidate.status = 'active';
    candidate.homeLocationId = guild.homeLocationId;
    guild.members.push(candidate);
    guild.recent = [...(guild.recent || []).slice(-8), `${candidate.name} joined from the open circuit.`];
    signedIds.add(candidate.id);
    signings += 1;
    if (candidate.rarity === 'Legend' || candidate.renown >= 150) {
      addChronicle(state, {
        type: 'transfer',
        importance: 2,
        title: `${guild.name} signs ${candidate.name}`,
        text: `The ${candidate.rarity.toLowerCase()} ${candidate.classId.toLowerCase()} leaves the open circuit for a permanent banner.`,
        heroIds: [candidate.id],
        guildIds: [guild.id],
        tags: ['rival', 'transfer'],
      });
    }
  }

  state.freeAgents = state.freeAgents.filter((hero) => !signedIds.has(hero.id));
  for (const hero of released) {
    if (!state.freeAgents.some((candidate) => candidate.id === hero.id)) state.freeAgents.push(hero);
  }
}

function ageHeroes(state, rng) {
  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    hero.age += 1;
    hero.career.serviceYears = Math.max(0, state.date.year - hero.joinedYear);
    if (hero.age >= 35) {
      const declineChance = clamp(0.08 + (hero.age - 35) * 0.025, 0.08, 0.6);
      if (rng.chance(declineChance)) {
        const physical = rng.pick(['Might', 'Finesse', 'Endurance']);
        hero.attributes[physical] = clamp(hero.attributes[physical] - rng.int(1, 2), 20, 99);
        hero.power = calculatePower(hero.attributes);
      }
    }
    if (!['available', 'injured'].includes(hero.status)) return;
    const retirementChance = hero.age < 36 ? 0 : clamp(0.03 + (hero.age - 36) * 0.035 + hero.career.injuries * 0.01 - hero.loyalty * 0.0008, 0.01, 0.65);
    if (rng.chance(retirementChance)) retireHeroInPlace(state, hero, rng, 'voluntary');
  });

  const archiveNpc = (hero, guildName) => {
    hero.status = 'retired';
    hero.retiredYear = state.date.year;
    hero.career.serviceYears = Math.max(hero.career.serviceYears || 0, state.date.year - (hero.joinedYear || state.date.year));
    hero.legacy += Math.round((hero.renown || 0) * 0.25 + (hero.career.titles || 0) * 10);
    if ((hero.career.titles || 0) > 0 || hero.legacy >= 90 || hero.renown >= 80) {
      hero.hook = `${hero.name} completed a career with ${guildName}, winning ${hero.career.titles || 0} titles.`;
      state.worldHistoricHeroes.push(compactHero(hero));
    }
  };

  state.rivals.forEach((rival) => {
    const roster = [rival.star, ...(rival.members || [])].filter(Boolean);
    roster.forEach((hero) => {
      hero.age += 1;
      hero.career.serviceYears = (hero.career.serviceYears || 0) + 1;
      if (hero.age >= 36 && rng.chance(clamp(0.025 + (hero.age - 36) * 0.045, 0.02, 0.75))) archiveNpc(hero, rival.name);
    });
    let survivors = roster.filter((hero) => hero.status !== 'retired');
    const desired = rival.tierIndex === 2 ? 7 : rival.tierIndex === 1 ? 6 : 5;
    while (survivors.length < desired) {
      const replacement = ensureTournamentCareer(
        generateHero(state, rng, rival.tierIndex === 2 ? 'elite' : rival.tierIndex === 1 ? 'veteran' : 'normal', {
          guildId: rival.id,
          homeLocationId: rival.homeLocationId,
        }),
      );
      replacement.status = 'active';
      replacement.specializations.tournament = rng.chance(0.22) ? rng.int(4, 9) : rng.int(0, 3);
      survivors.push(replacement);
    }
    survivors.sort(
      (a, b) => b.power + b.renown * 0.08 + (b.specializations?.tournament || 0) - (a.power + a.renown * 0.08 + (a.specializations?.tournament || 0)),
    );
    const formerStar = rival.star;
    rival.star = survivors[0];
    rival.members = survivors.slice(1);
    if (formerStar?.id !== rival.star.id) {
      addChronicle(state, {
        type: 'rival',
        importance: 2,
        title: `${rival.star.name} becomes the face of ${rival.name}`,
        text: `${formerStar?.name || 'The prior captain'} yields the public role after a change of generation.`,
        heroIds: [rival.star.id],
        guildIds: [rival.id],
        tags: ['rival', 'succession'],
      });
    }
  });

  state.freeAgents = (state.freeAgents || []).filter((hero) => {
    hero.age += 1;
    hero.career.serviceYears = (hero.career.serviceYears || 0) + 1;
    if (hero.age > 39 && rng.chance(clamp(0.1 + (hero.age - 39) * 0.1, 0.1, 0.8))) {
      archiveNpc(hero, 'the open circuit');
      return false;
    }
    return true;
  });
  const annualFreeAgents = 2 + state.guild.tierIndex;
  for (let index = 0; index < annualFreeAgents; index += 1) {
    const location = rng.pick(LOCATIONS);
    const hero = ensureTournamentCareer(
      generateHero(state, rng, rng.chance(0.12) ? 'elite' : rng.chance(0.34) ? 'veteran' : 'normal', { guildId: null, homeLocationId: location.id }),
    );
    hero.status = 'free-agent';
    hero.guildId = null;
    hero.specializations.tournament = rng.chance(0.3) ? rng.int(4, 10) : rng.int(0, 3);
    state.freeAgents.push(hero);
  }
  runAiTransferMarketInPlace(state, rng);
  state.freeAgents.sort((a, b) => b.renown + b.power - (a.renown + a.power));
  state.freeAgents = state.freeAgents.slice(0, 40);
  state.worldHistoricHeroes = (state.worldHistoricHeroes || []).sort((a, b) => b.legacy - a.legacy).slice(0, 250);
}

function simulateRivalInstitutionsInPlace(state, rng) {
  state.legacy ||= { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] };
  const rivalEventsBefore = (state.stats.rivalPoaches || 0) + (state.stats.rivalSplits || 0);
  // Poaching creates memorable transfers between established guilds without making rosters chaotic.
  if (state.rivals.length && rng.chance(0.38)) {
    const targets = state.rivals.filter((guild) => guild.members?.length >= 4).sort((a, b) => a.fame - b.fame);
    const source = targets.slice(0, Math.max(1, Math.ceil(targets.length / 2)))[rng.int(0, Math.max(0, Math.ceil(targets.length / 2) - 1))];
    const suitors = state.rivals.filter((guild) => guild.id !== source?.id && guild.fame > (source?.fame || 0) * 1.25).sort((a, b) => b.crowns - a.crowns);
    const destination = suitors[0];
    const poachable = source?.members
      ?.filter((hero) => !['dead', 'retired'].includes(hero.status))
      .sort(
        (a, b) =>
          (b.rarity === 'Legend' ? 4 : b.rarity === 'Epic' ? 3 : b.rarity === 'Rare' ? 2 : 1) -
          (a.rarity === 'Legend' ? 4 : a.rarity === 'Epic' ? 3 : a.rarity === 'Rare' ? 2 : 1),
      )[0];
    if (source && destination && poachable && rng.chance(0.5)) {
      source.members = source.members.filter((hero) => hero.id !== poachable.id);
      poachable.guildId = destination.id;
      destination.members.push(poachable);
      destination.crowns -= 300 + poachable.level * 35;
      source.relationship = clamp((source.relationship || 0) - 10, -100, 100);
      destination.relationship = clamp((destination.relationship || 0) - 5, -100, 100);
      state.stats.rivalPoaches = (state.stats.rivalPoaches || 0) + 1;
      const event = { year: state.date.year, type: 'poach', sourceGuildId: source.id, destinationGuildId: destination.id, heroId: poachable.id };
      state.legacy.rivalInstitutionEvents.unshift(event);
      addChronicle(state, {
        type: 'transfer',
        importance: poachable.rarity === 'Legend' || poachable.rarity === 'Epic' ? 4 : 2,
        title: `${poachable.name} defects to ${destination.name}`,
        text: `${source.name} loses one of its established heroes to a richer rival.`,
        heroIds: [poachable.id],
        guildIds: [source.id, destination.id],
        tags: ['rival', 'poaching'],
      });
    }
  }

  // Strong internal factions occasionally split off. Cap total guilds so century saves remain readable.
  if (state.rivals.length < 36 && rng.chance(0.12)) {
    const parent = [...state.rivals].filter((guild) => guild.members?.length >= 6 && guild.fame >= 80).sort((a, b) => b.members.length - a.members.length)[0];
    if (parent && rng.chance(0.45)) {
      const defectors = parent.members.splice(-2);
      if (defectors.length === 2) {
        const leader = defectors.sort((a, b) => b.power - a.power)[0];
        const newId = uid('rival-split', rng);
        const newName = `${leader.name.split(' ')[0]} ${rng.pick(['Company', 'Covenant', 'Banner', 'Brotherhood', 'Circle'])}`;
        defectors.forEach((hero) => {
          hero.guildId = newId;
        });
        const newGuild = {
          ...clone(parent),
          id: newId,
          name: newName,
          motto: `No inheritance without a challenge.`,
          founded: state.date.year,
          fame: Math.max(25, Math.round(parent.fame * 0.28)),
          legacy: Math.max(10, Math.round(parent.legacy * 0.16)),
          crowns: 900 + rng.int(0, 1800),
          wins: 0,
          losses: 0,
          titles: 0,
          prizeMoney: 0,
          seasonPoints: 0,
          careerPoints: 0,
          hostility: rng.int(15, 55),
          relationship: 0,
          star: leader,
          members: defectors.filter((hero) => hero.id !== leader.id),
          recent: [`Split from ${parent.name} in ${state.date.year}.`],
          fallen: false,
        };
        while (newGuild.members.length < 4) {
          const replacement = ensureTournamentCareer(
            generateHero(state, rng, parent.tierIndex === 2 ? 'veteran' : 'normal', { guildId: newId, homeLocationId: parent.homeLocationId }),
          );
          replacement.status = 'active';
          newGuild.members.push(replacement);
        }
        parent.fame = Math.max(10, Math.round(parent.fame * 0.88));
        state.rivals.push(newGuild);
        state.stats.rivalSplits = (state.stats.rivalSplits || 0) + 1;
        state.legacy.rivalInstitutionEvents.unshift({ year: state.date.year, type: 'split', parentGuildId: parent.id, newGuildId: newId, leaderId: leader.id });
        addChronicle(state, {
          type: 'rival',
          importance: 4,
          title: `${newName} breaks away from ${parent.name}`,
          text: `${leader.name} leads a faction out beneath a new banner. The regional order changes overnight.`,
          heroIds: [leader.id],
          guildIds: [parent.id, newId],
          tags: ['rival', 'split', 'founding'],
        });
      }
    }
  }
  // If the universe has somehow remained perfectly static for several years,
  // force a single memorable transfer so long campaigns still develop rival history.
  if (
    (state.stats.rivalPoaches || 0) + (state.stats.rivalSplits || 0) === rivalEventsBefore &&
    rivalEventsBefore === 0 &&
    (state.stats.yearsPlayed || 0) >= 4 &&
    state.rivals.length >= 2
  ) {
    const source = [...state.rivals].filter((guild) => guild.members?.length >= 4).sort((a, b) => a.fame - b.fame)[0];
    const destination = [...state.rivals].filter((guild) => guild.id !== source?.id).sort((a, b) => b.fame + b.crowns * 0.01 - (a.fame + a.crowns * 0.01))[0];
    const poachable = source?.members?.filter((hero) => !['dead', 'retired'].includes(hero.status)).sort((a, b) => b.power - a.power)[0];
    if (source && destination && poachable) {
      source.members = source.members.filter((hero) => hero.id !== poachable.id);
      poachable.guildId = destination.id;
      destination.members.push(poachable);
      state.stats.rivalPoaches = (state.stats.rivalPoaches || 0) + 1;
      state.legacy.rivalInstitutionEvents.unshift({
        year: state.date.year,
        type: 'poach',
        sourceGuildId: source.id,
        destinationGuildId: destination.id,
        heroId: poachable.id,
        forced: true,
      });
      addChronicle(state, {
        type: 'transfer',
        importance: 3,
        title: `${poachable.name} changes banners`,
        text: `${destination.name} lures a proven rival hero away, ensuring the circuit never stays static for long.`,
        heroIds: [poachable.id],
        guildIds: [source.id, destination.id],
        tags: ['rival', 'poaching'],
      });
    }
  }
  state.legacy.rivalInstitutionEvents = state.legacy.rivalInstitutionEvents.slice(0, 80);
}

function annualCycle(state, rng) {
  state.stats.yearsPlayed += 1;
  state.universeStats.seasonsSimulated = (state.universeStats.seasonsSimulated || 0) + 1;
  ageHeroes(state, rng);
  const guildmaster = ensureGuildmasterInPlace(state);
  if (guildmaster) guildmaster.career.leadershipYears = (guildmaster.career.leadershipYears || 0) + 1;
  simulateRivalInstitutionsInPlace(state, rng);
  evaluateHeroAmbitionsInPlace(state);
  state.rivals.forEach((rival) => {
    rival.seasonPoints = 0;
  });
  state.candidates = (state.candidates || []).filter((candidate) => candidate.expiresYear >= state.date.year);
  const locations = unlockedLocations(state.guild.tierIndex);
  locations.forEach((location) => {
    const intake = 1 + (location.id === state.world?.currentLocationId ? 1 : 0) + Math.min(1, state.guild.facilities.academy || 0);
    for (let i = 0; i < intake; i += 1) state.candidates.push(makeCandidate(state, rng, null, location.id));
  });
  refreshCandidatesForLocationInPlace(state, rng, state.world?.currentLocationId || 'dunmere');
  createTournamentsInPlace(state, rng);
  archiveOldHeroesInPlace(state);
  addChronicle(state, {
    type: 'year',
    importance: 1,
    title: `Year ${state.date.year} begins in ${getCurrentLocation(state).name}`,
    text: `${state.guild.name} enters the year ranked #${state.guild.rank} in its current ladder, with ${state.guild.fame} fame, ${activeHeroCount(state)} active heroes and ${locations.length} reachable locations.`,
    tags: ['year'],
  });
}

function archiveOldHeroesInPlace(state) {
  if (state.heroes.length <= MAX_HEROES) return;
  const archival = state.heroes
    .filter((hero) => ['retired', 'dead'].includes(hero.status) && state.date.year - (hero.retiredYear || hero.deathYear || state.date.year) > 8)
    .sort((a, b) => b.legacy - a.legacy);
  while (state.heroes.length > MAX_HEROES && archival.length) {
    const hero = archival.pop();
    state.historicHeroes.push(compactHero(hero));
    state.heroes = state.heroes.filter((item) => item.id !== hero.id);
  }
  if (state.historicHeroes.length > 800) {
    state.historicHeroes.sort((a, b) => b.legacy - a.legacy);
    state.historicHeroes.length = 800;
  }
}

export function advanceMonths(state, count = 1, mutate = false) {
  if (state.activeEncounter) return { state, error: 'Conclude the active combat before advancing time.' };
  if (state.activeMissionGame) return { state, error: 'Conclude the active mission challenge before advancing time.' };
  if (state.pendingDecisions.length) return { state, error: 'Resolve the critical decision before advancing time.' };
  if ([...(state.tournaments || []), ...(state.guildTournaments || [])].some((tournament) => tournament.status === 'active')) {
    return { state, error: 'Finish the active tournament before advancing time.' };
  }
  let next = mutate ? state : clone(state);
  let advancedCount = 0;
  let latestCouncilMonth = null;
  for (let step = 0; step < count; step += 1) {
    if (next.pendingDecisions.length || next.activeEncounter || next.activeMissionGame) break;
    const rng = rngFor(next, `advance-${step}`);
    const upkeep = monthlyUpkeep(next);
    const monthLabel = `${MONTHS[next.date.month]} ${next.date.year}`;
    const crownsBefore = next.guild.crowns;
    const fameBefore = next.guild.fame;
    const legacyBefore = next.guild.legacy;
    next.guild.crowns -= upkeep;
    if (next.guild.crowns < 0) {
      next.stats.bankruptMonths += 1;
      next.guild.fallen = next.guild.crowns < -900 || next.stats.bankruptMonths >= 6;
    } else {
      next.stats.bankruptMonths = Math.max(0, next.stats.bankruptMonths - 1);
      if (next.guild.fallen && next.guild.crowns > 300) next.guild.fallen = false;
    }
    const debt = applyDebtInPlace(next);
    const councilResolution = resolveMonthlyHeroActivities(next, rng);
    const branchResolution = simulateBranchesInPlace(next, rng);
    simulateRivals(next, rng);
    progressTravelInPlace(next, rng);

    next.activeMissions.forEach((mission) => {
      mission.remaining -= 1;
    });
    queueDueCombatMissionInPlace(next);
    queueDueMissionGameInPlace(next);

    next.date.month += 1;
    if (next.date.month >= 12) {
      next.date.month = 0;
      next.date.year += 1;
    }
    updatePromiseDeadlinesInPlace(next);
    simulateScheduledCompetitionsInPlace(next, rng);
    if (next.date.month === 0) annualCycle(next, rng);
    refreshMissionsInPlace(next, rng);
    if (!next.tournaments?.length || next.tournaments[0].year < next.date.year) createTournamentsInPlace(next, rng);
    latestCouncilMonth = {
      id: `council-${next.date.year}-${next.date.month}-${step}`,
      label: monthLabel,
      upkeep,
      loanPayment: debt.loanPayment,
      walkouts: debt.walkouts,
      crownsBefore,
      crownsAfter: next.guild.crowns,
      fameDelta: next.guild.fame - fameBefore,
      legacyDelta: next.guild.legacy - legacyBefore,
      scouts: councilResolution.scouts,
      exhibitionFame: councilResolution.exhibitionFame,
      activities: councilResolution.results,
      branches: branchResolution,
    };
    advancedCount += 1;
    commitRng(next, rng);
    if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'advanceMonth') completeTutorialTargetInPlace(next, 'advanceMonth');
    evaluateStateInPlace(next);
  }
  if (advancedCount > 0 && latestCouncilMonth) {
    next.council ||= { lastReport: null, unread: false };
    next.council.lastReport = { ...latestCouncilMonth, advancedMonths: advancedCount };
    next.council.unread = true;
  }
  return { state: finalize(next), error: null };
}

export function advanceToNextEvent(state) {
  if (state.activeEncounter) return { state, error: 'Conclude the active combat before advancing time.' };
  if (state.activeMissionGame) return { state, error: 'Conclude the active mission challenge before advancing time.' };
  if (state.pendingDecisions.length) return { state, error: 'Resolve the critical decision before advancing time.' };
  if (!state.activeMissions.length) return advanceMonths(state, 1);
  const months = Math.max(1, Math.min(...state.activeMissions.map((mission) => mission.remaining)));
  return advanceMonths(state, months);
}

function gradeFromMargin(margin, roll, chance) {
  if (roll < 0.04 && chance >= 25) return 'Legendary';
  if (margin >= 35) return 'Legendary';
  if (margin >= 18) return 'Great Success';
  if (margin >= 0) return 'Success';
  if (margin >= -14) return 'Partial';
  if (margin >= -30) return 'Defeat';
  return 'Catastrophic';
}

function gradeMultiplier(grade) {
  return (
    {
      Legendary: 1.65,
      'Great Success': 1.3,
      Success: 1,
      Partial: 0.58,
      Defeat: 0.12,
      Catastrophic: 0,
    }[grade] ?? 0
  );
}

function injureHero(state, hero, mission, grade, rng, extraRisk = 0) {
  const supportPresent = mission.assignments.some((assignment) => ['Combat Support', 'Field Support', 'Advocate'].includes(assignment.role));
  const infirmary = (state.guild.facilities.infirmary || 0) + (appointmentHolder(state, 'Master Healer') ? 1 : 0);
  const gradeRisk = { Legendary: 0.01, 'Great Success': 0.02, Success: 0.04, Partial: 0.1, Defeat: 0.2, Catastrophic: 0.34 }[grade];
  const baseRisk = gradeRisk + mission.risk * 0.018 + extraRisk - (supportPresent ? 0.025 : 0) - infirmary * 0.012 + (hero.flaw === 'Injury-prone' ? 0.07 : 0);
  if (!rng.chance(clamp(baseRisk, 0.005, 0.7))) return { injured: false, died: false };

  const fatalBase = grade === 'Catastrophic' ? 0.025 + mission.risk * 0.009 : grade === 'Defeat' && mission.risk >= 4 ? 0.008 : 0.001;
  const policyFatalityFactor = 1 + clamp(extraRisk * 4, -0.3, 0.5);
  const fatality = fatalBase * (1 - infirmary * 0.13) * (supportPresent ? 0.72 : 1) * (hero.health < 65 ? 1.4 : 1) * policyFatalityFactor;
  if (rng.chance(clamp(fatality, 0, 0.12))) {
    hero.status = 'dead';
    clearHeroAppointmentInPlace(state, hero);
    hero.deathYear = state.date.year;
    hero.health = 0;
    hero.legacy += 20 + mission.risk * 6;
    state.guild.deaths += 1;
    state.stats.deaths += 1;
    transferArtifactsFromHeroInPlace(state, hero);
    offerInheritedAmbitionsInPlace(state, hero);
    addHeroHistory(hero, state, {
      type: 'death',
      title: `Died during ${mission.title}`,
      text: `The guild recovered ${hero.name}’s name, but not their future.`,
    });
    addChronicle(state, {
      type: 'death',
      importance: 5,
      title: `${hero.name} dies beneath the banner`,
      text: `${hero.name} is killed during ${mission.title}. The guild’s history will divide into before and after this day.`,
      heroIds: [hero.id],
      tags: ['death', mission.family],
    });
    return { injured: true, died: true };
  }

  const injuries = ['Broken ribs', 'Deep blade wound', 'Crushed shoulder', 'Fevered wound', 'Shattered ankle', 'Arcane burn', 'Severe concussion'];
  hero.status = 'injured';
  hero.monthlyActivity = 'Infirmary';
  hero.injury = rng.pick(injuries);
  hero.injuryMonths = rng.int(1, 2 + mission.risk);
  hero.health = clamp(hero.health - rng.int(14, 30), 20, 95);
  hero.career.injuries += 1;
  addHeroHistory(hero, state, {
    type: 'injury',
    title: hero.injury,
    text: `Suffered during ${mission.title}; expected recovery ${hero.injuryMonths} month${hero.injuryMonths === 1 ? '' : 's'}.`,
  });
  return { injured: true, died: false };
}

function assignmentForLegacyCheck(assignments, roleCheck) {
  const equivalents = {
    Captain: ['Commander', 'Negotiation Lead', 'Expedition Lead', 'Mastermind'],
    Vanguard: ['Fighter', 'Delegation Guard', 'Field Support', 'Extraction'],
    Striker: ['Fighter', 'Infiltrator'],
    Support: ['Combat Support', 'Field Support', 'Advocate'],
    Scout: ['Searcher', 'Lookout', 'Infiltrator'],
    Specialist: ['Curator', 'Strategist', 'Mastermind', 'Infiltrator'],
  };
  return assignments.find((assignment) => assignment.role === roleCheck || equivalents[roleCheck]?.includes(assignment.role));
}

function personalityReactionFor(hero, mission, option, grade) {
  const text = `${option.label || ''} ${option.note || ''} ${option.tag || ''}`.toLowerCase();
  let morale = 0;
  let loyalty = 0;
  const reasons = [];
  const likes = (condition, m, l, reason) => {
    if (condition) {
      morale += m;
      loyalty += l;
      reasons.push(reason);
    }
  };
  if (hero.personality === 'Brave')
    likes(
      /heroic|bold|fight|pursu|pressure|ambush/.test(text) || (mission.formationType === 'Combat' && mission.risk >= 3),
      2,
      1,
      'approved of the bold course',
    );
  if (hero.personality === 'Merciful') {
    likes(/mercy|protect|rescue|cure|civilian|spare/.test(text), 3, 1, 'approved of the humane choice');
    likes(/execute|kill|sacrifice|abandon/.test(text), -4, -2, 'was disturbed by the lack of mercy');
  }
  if (hero.personality === 'Honorable') {
    likes(/law|council|temple|evidence|truth|promise|protect/.test(text), 2, 2, 'saw the decision as honorable');
    likes(/steal|blackmail|lie|smuggl|assassin/.test(text), -3, -2, 'disliked the dishonorable method');
  }
  if (hero.personality === 'Obsessive')
    likes(/truth|artifact|clue|evidence|recover|investigat/.test(text) || mission.artifact, 2, 1, 'felt the decision served the deeper objective');
  if (hero.personality === 'Cautious') {
    likes(/protect|fortif|safe|careful|withdraw/.test(text), 2, 1, 'approved of the controlled risk');
    likes(/bait|reckless|dangerous|both rescues/.test(text), -2, -1, 'thought the guild took needless risk');
  }
  if (hero.personality === 'Vain') likes((option.fame || 0) >= 3 || grade === 'Legendary', 2, 1, 'enjoyed the public glory');
  if (hero.personality === 'Patient')
    likes(
      ['Diplomacy', 'Expedition'].includes(mission.formationType) && ['Success', 'Great Success', 'Legendary'].includes(grade),
      1,
      1,
      'valued the patient preparation',
    );
  if (hero.personality === 'Witty')
    likes(mission.formationType === 'Diplomacy' && ['Success', 'Great Success', 'Legendary'].includes(grade), 2, 1, 'thrived in the social contest');
  if (hero.personality === 'Restless') likes(/pursu|push|split|chase|follow/.test(text), 2, 0, 'preferred decisive movement');
  if (hero.flaw === 'Greed') likes((option.reward || 0) >= 60, 2, 0, 'approved of the richer outcome');
  if (hero.flaw === 'Pride') likes(/concede|submit|apolog|surrender/.test(text), -3, -2, 'resented the concession');
  if (hero.flaw === 'Recklessness') likes(/bold|bait|dangerous|pursu/.test(text), 1, 0, 'was energized by the danger');
  if (hero.flaw === 'Cowardice') likes(mission.risk >= 4 && /bold|bait|both|pursu/.test(text), -3, -1, 'was shaken by the risk');
  return { morale, loyalty, text: reasons.join('; ') };
}

function applyTeamRelationshipsInPlace(state, heroIds, grade, option) {
  const changes = [];
  const heroes = heroIds.map((id) => getHero(state, id)).filter(Boolean);
  const base = { Legendary: 3, 'Great Success': 2, Success: 1, Partial: 0, Defeat: -1, Catastrophic: -2 }[grade] || 0;
  for (const hero of heroes) {
    for (const other of heroes) {
      if (hero.id === other.id) continue;
      let delta = base;
      if (hero.personality === 'Jealous' && other.renown >= hero.renown + 15 && base > 0) delta -= 2;
      if (
        hero.personality === 'Merciful' &&
        other.personality === 'Merciful' &&
        /mercy|protect|rescue|cure/.test(`${option.label} ${option.tag}`.toLowerCase())
      )
        delta += 1;
      const changed = adjustRelationshipInPlace(hero, other.id, delta, `${grade} during ${option.label}`);
      if (changed?.delta) changes.push(changed);
    }
  }
  return changes;
}

export function resolveDecision(state, decisionId, optionId, mutate = false) {
  const next = mutate ? state : clone(state);
  const decisionIndex = next.pendingDecisions.findIndex((decision) => decision.id === decisionId);
  if (decisionIndex < 0) return { state, error: 'This decision is no longer pending.' };
  const decision = next.pendingDecisions[decisionIndex];
  const missionIndex = next.activeMissions.findIndex((mission) => mission.id === decision.missionId);
  if (missionIndex < 0) return { state, error: 'The expedition could not be found.' };
  const mission = next.activeMissions[missionIndex];
  const option = decision.options.find((item) => item.id === optionId);
  if (!option) return { state, error: 'Choose one of the available responses.' };

  const rng = rngFor(next, `resolve-${mission.id}-${option.id}`);
  const estimate = partyEstimate(next, mission.id, mission.formationType, mission.assignments);
  let adjustedChance = estimate.chance + (option.power || 0);
  if (next.guild.policies.retreat === 'Never retreat') adjustedChance += 4;
  if (next.guild.policies.retreat === 'Protect the wounded') adjustedChance -= 2;
  if (option.roleCheck) {
    const roleAssignment = assignmentForLegacyCheck(mission.assignments, option.roleCheck);
    if (roleAssignment) adjustedChance += Math.round((roleRating(getHero(next, roleAssignment.heroId), roleAssignment.role) - 55) * 0.2);
    else adjustedChance -= 8;
  }
  adjustedChance = clamp(adjustedChance, 3, 97);
  const forcedGrade = decision.forcedGrade || option.forcedGrade || null;
  const roll = forcedGrade ? Math.max(1, Math.min(99, 100 - adjustedChance)) : rng.next() * 100;
  const margin = adjustedChance - roll;
  const grade = forcedGrade || gradeFromMargin(margin, roll / 100, adjustedChance);
  const success = ['Partial', 'Success', 'Great Success', 'Legendary'].includes(grade);
  const cleanSuccess = ['Success', 'Great Success', 'Legendary'].includes(grade);
  const multiplier = gradeMultiplier(grade);
  let rewardMultiplier =
    next.guild.policies.treasure === 'Equal Shares'
      ? 0.9
      : next.guild.policies.treasure === "Captain's Discretion"
        ? 1.04
        : next.guild.policies.treasure === 'Public Trust'
          ? 0.82
          : 1;
  if (decision.missionGameSummary?.rewardModifier) rewardMultiplier *= decision.missionGameSummary.rewardModifier;
  if (next.guild.alignment === 'Baron' && ['Political Mission', 'War Operation'].includes(mission.family)) rewardMultiplier += 0.1;
  const reward = Math.max(0, Math.round((mission.reward + (option.reward || 0)) * multiplier * rewardMultiplier));
  const rawFame = Math.round((mission.fame + (option.fame || 0)) * multiplier);
  let fameMultiplier = 1 + (next.guild.facilities.archive || 0) * 0.04 + (appointmentHolder(next, 'Chronicler') ? 0.08 : 0);
  if (next.guild.policies.treasure === 'Public Trust') fameMultiplier += 0.18;
  if (next.guild.policies.publicity === 'Heroic') fameMultiplier += 0.12;
  if (next.guild.policies.publicity === 'Private') fameMultiplier -= 0.35;
  if (next.guild.policies.publicity === 'Propaganda') fameMultiplier += cleanSuccess ? 0.25 : 0.4;
  if (next.guild.alignment === 'Council' && ['Rescue', 'Investigation', 'Escort'].includes(mission.family)) fameMultiplier += 0.1;
  if (next.guild.alignment === 'Independent' && ['Exploration', 'Monster Hunt', 'Legend Quest'].includes(mission.family)) fameMultiplier += 0.08;
  const fame = Math.max(
    -8,
    rawFame > 0 ? Math.round(rawFame * Math.max(0.4, fameMultiplier)) : Math.round(rawFame * (next.guild.policies.publicity === 'Propaganda' ? 1.4 : 1)),
  );

  const teamSnapshot = mission.assignments
    .map((assignment) => {
      const hero = getHero(next, assignment.heroId);
      return hero
        ? {
            heroId: hero.id,
            name: hero.name,
            classId: hero.classId,
            role: assignment.role,
            slotId: assignment.slotId,
            primal: hero.primal,
            rarity: hero.rarity,
            level: hero.level,
            power: hero.power,
            roleRating: roleRating(hero, assignment.role),
            form: hero.form,
            fatigueAtResolution: hero.fatigue,
          }
        : null;
    })
    .filter(Boolean);

  const injuries = [];
  const deaths = [];
  const heroEffects = [];
  const expeditionHeroes = mission.assignments.map((assignment) => getHero(next, assignment.heroId)).filter(Boolean);
  const protectedStar = [...expeditionHeroes].sort((a, b) => b.renown - a.renown)[0];

  mission.assignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    if (!hero || hero.status === 'dead') return;
    const before = { form: hero.form, morale: hero.morale, loyalty: hero.loyalty, renown: hero.renown, legacy: hero.legacy, health: hero.health };
    hero.career.missions += 1;
    hero.career.earnings += Math.round(reward / mission.assignments.length);
    hero.fatigue = clamp(hero.fatigue + 12 + mission.risk * 5, 0, 100);
    hero.form = clamp(hero.form + (cleanSuccess ? rng.int(2, 7) : grade === 'Partial' ? rng.int(-1, 3) : rng.int(-8, -2)), 25, 96);
    hero.morale = clamp(hero.morale + (cleanSuccess ? rng.int(2, 6) : grade === 'Catastrophic' ? -10 : -3), 15, 100);
    if (next.guild.policies.treasure === 'Equal Shares') {
      hero.morale = clamp(hero.morale + 3, 15, 100);
      hero.loyalty = clamp(hero.loyalty + 1, 0, 100);
    }
    if (next.guild.policies.treasure === "Captain's Discretion")
      hero.loyalty = clamp(hero.loyalty + (['Commander', 'Negotiation Lead', 'Expedition Lead', 'Mastermind'].includes(assignment.role) ? 2 : -1), 0, 100);
    if (next.guild.policies.treasure === 'Public Trust') hero.legacy += 1;
    const personalityReaction = personalityReactionFor(hero, mission, option, grade);
    hero.morale = clamp(hero.morale + personalityReaction.morale, 15, 100);
    hero.loyalty = clamp(hero.loyalty + personalityReaction.loyalty, 0, 100);
    hero.renown = Math.max(0, hero.renown + Math.round(fame / mission.assignments.length) + (grade === 'Legendary' ? 6 : 0));
    hero.legacy += Math.max(0, Math.round(fame * 0.35) + (grade === 'Legendary' ? 12 : 0));
    if (cleanSuccess) hero.career.wins += 1;
    else if (grade === 'Partial') hero.career.partials += 1;
    else hero.career.defeats += 1;
    if (grade === 'Legendary') hero.career.legendary += 1;
    hero.career.fame += Math.max(0, Math.round(fame / mission.assignments.length));
    const xpMultiplier = { Legendary: 1.7, 'Great Success': 1.35, Success: 1, Partial: 0.78, Defeat: 0.52, Catastrophic: 0.34 }[grade] || 0.5;
    const xpGain = Math.round((42 + mission.risk * 18 + mission.duration * 8) * xpMultiplier);
    const levelBefore = hero.level;
    applyXpInPlace(hero, xpGain, next, `${mission.title} (${grade.toLowerCase()})`);
    hero.career.xpEarned = (hero.career.xpEarned || 0) + xpGain;
    if (!hero.career.bestMission || gradeMultiplier(grade) > gradeMultiplier(hero.career.bestMission.grade)) {
      hero.career.bestMission = { title: mission.title, grade, year: next.date.year };
    }
    let policyInjuryRisk = next.guild.policies.retreat === 'Never retreat' ? 0.04 : next.guild.policies.retreat === 'Protect the wounded' ? -0.03 : 0;
    if (next.guild.policies.retreat === 'Preserve the stars') policyInjuryRisk += hero.id === protectedStar?.id ? -0.045 : 0.015;
    const injury = injureHero(next, hero, mission, grade, rng, (option.injury || 0) + policyInjuryRisk);
    if (injury.injured) injuries.push(hero.name);
    if (injury.died) deaths.push(hero.name);
    if (!injury.died && hero.status !== 'injured') hero.status = 'available';
    addHeroHistory(hero, next, {
      type: 'mission-result',
      title: `${grade}: ${mission.title}`,
      text: `${option.label}. Served as ${assignment.role}; earned ${Math.max(0, Math.round(fame / mission.assignments.length))} renown.`,
    });
    heroEffects.push({
      heroId: hero.id,
      name: hero.name,
      role: assignment.role,
      status: hero.status,
      injury: hero.injury,
      formChange: hero.form - before.form,
      moraleChange: hero.morale - before.morale,
      loyaltyChange: hero.loyalty - before.loyalty,
      personalityReaction: personalityReaction.text || null,
      renownChange: hero.renown - before.renown,
      legacyChange: hero.legacy - before.legacy,
      healthChange: hero.health - before.health,
      xpGain,
      levelBefore,
      levelAfter: hero.level,
    });
  });

  const relationshipChanges = applyTeamRelationshipsInPlace(
    next,
    mission.assignments.map((assignment) => assignment.heroId),
    grade,
    option,
  );

  next.guild.crowns += reward;
  next.guild.fame = Math.max(0, next.guild.fame + fame);
  next.guild.legacy += Math.max(
    0,
    Math.round(fame * 0.25) + (grade === 'Legendary' ? 8 : 0) + (next.guild.policies.publicity === 'Private' && cleanSuccess ? 3 : 0),
  );
  if (next.guild.policies.publicity === 'Propaganda' && !success) {
    next.guild.legacy = Math.max(0, next.guild.legacy - 3);
    next.notifications.push({
      id: `scandal-${mission.id}`,
      tone: 'red',
      title: 'The heroic account collapses',
      text: 'Witnesses contradict the guild’s public version of the failed expedition.',
    });
  }
  next.stats.missionsCompleted += 1;
  if (cleanSuccess) {
    next.stats.missionsWon += 1;
    next.guild.wins += 1;
    next.guild.contractsCompleted += 1;
    if (mission.formationType === 'Combat') next.stats.combatWins += 1;
  } else {
    next.stats.missionsLost += 1;
    next.guild.losses += 1;
  }
  if (mission.risk >= 3 && cleanSuccess && injuries.length === 0) next.stats.perfectHardMission += 1;
  if (cleanSuccess && mission.estimateAtLaunch < 40) next.stats.upsets += 1;
  if (option.alignment) {
    next.guild.alignment = option.alignment;
    next.stats.alignmentChosen = 1;
  }
  if (option.rivalry && !next.guild.rivalries.includes(option.rivalry)) {
    next.guild.rivalries.push(option.rivalry);
    next.stats.rivalries += 1;
    const rival = next.rivals.find((item) => item.name === option.rivalry);
    if (rival) rival.hostility = clamp(rival.hostility + 35, 0, 100);
  }
  if (option.obligation) next.guild.obligations.push(option.obligation);
  if (option.clue && mission.saga) progressSagaInPlace(next, mission.saga, option.clue);
  if (mission.saga && cleanSuccess) progressSagaInPlace(next, mission.saga, grade === 'Legendary' ? 2 : 1);
  if (option.tag?.includes('feat') || grade === 'Legendary' || (mission.risk >= 4 && cleanSuccess)) next.stats.signatureFeats += 1;
  if (option.tag === 'mythic-feat') next.stats.mythicFeats += 1;
  if (option.tag === 'inherited-will' && next.flags.inheritedDream && !next.flags.inheritedDream.completed) {
    next.flags.inheritedDream.completed = true;
    next.stats.inheritedWill += 1;
  }

  const workshopLevel = next.guild.facilities.workshop || 0;
  const recoveredMissionArtifact = mission.artifact && (grade === 'Legendary' || (grade === 'Great Success' && rng.chance(0.12 + workshopLevel * 0.1)));
  const artifactName = option.artifact || (recoveredMissionArtifact ? mission.artifact : null);
  if (artifactName && cleanSuccess && !next.artifacts.some((artifact) => artifact.name === artifactName)) {
    const owner = mission.assignments
      .map((assignment) => getHero(next, assignment.heroId))
      .filter(Boolean)
      .sort((a, b) => b.renown - a.renown)[0];
    const prestige = mission.risk * 12 + (grade === 'Legendary' ? 20 : 0);
    const artifact = {
      id: uid('artifact', rng),
      name: artifactName,
      discoveredYear: next.date.year,
      originMission: mission.title,
      ownerId: owner?.id || null,
      legend: `${artifactName} entered the guild vault after ${mission.title}.`,
      prestige,
      effect: artifactEffectFromPrestige(prestige, artifactName),
      ownerHistory: [{ year: next.date.year, month: next.date.month, heroId: owner?.id || null, heroName: owner?.name || 'Guild Vault', action: 'claimed' }],
    };
    next.artifacts.push(artifact);
    if (owner) {
      owner.career.artifacts += 1;
      owner.career.artifactPrestige = (owner.career.artifactPrestige || 0) + prestige;
      owner.legacy += 10;
      owner.artifactIds ||= [];
      owner.artifactIds.push(artifact.id);
      owner.artifactPowerBonus = (owner.artifactPowerBonus || 0) + artifact.effect.bonus;
    }
  }

  const narrative = resultNarrative(mission, option, grade, reward, fame, injuries, deaths);
  const record = {
    id: `mission-record-${mission.id}`,
    kind: 'mission',
    missionId: mission.id,
    templateId: mission.templateId,
    title: mission.title,
    family: mission.family,
    region: mission.region,
    locationId: mission.locationId,
    locationName: mission.locationName || LOCATION_BY_ID[mission.locationId]?.name || mission.region,
    enemyPrimal: mission.enemyPrimal,
    patronPrimal: mission.patronPrimal,
    primalEdge: estimate.primalEdge || 0,
    issuer: mission.issuer,
    risk: mission.risk,
    difficulty: mission.difficulty,
    formationType: mission.formationType || formationForMission(mission),
    startedYear: mission.startedYear,
    startedMonth: mission.startedMonth,
    completedYear: next.date.year,
    completedMonth: next.date.month,
    completedDate: dateLabel(next),
    duration: mission.duration,
    grade,
    reward,
    fame,
    supplyCost: mission.supplyCost,
    estimateAtLaunch: mission.estimateAtLaunch,
    finalChance: adjustedChance,
    roll: Math.round(roll),
    decision: { prompt: decision.prompt, optionId: option.id, label: option.label, note: option.note },
    combat: decision.combatSummary || null,
    missionGame: decision.missionGameSummary || null,
    team: teamSnapshot,
    relationshipChanges,
    heroEffects,
    injuries,
    deaths,
    artifact: artifactName && cleanSuccess ? artifactName : null,
    narrative,
    consequences: [
      option.obligation ? `Obligation: ${option.obligation}` : null,
      option.rivalry ? `Rivalry: ${option.rivalry}` : null,
      option.alignment ? `Alignment: ${option.alignment}` : null,
    ].filter(Boolean),
  };
  next.missionHistory.unshift(record);
  if (next.missionHistory.length > MAX_MISSION_HISTORY) next.missionHistory.length = MAX_MISSION_HISTORY;
  next.pendingReports.unshift({ kind: 'mission', id: record.id });

  addChronicle(next, {
    type: cleanSuccess ? 'victory' : grade === 'Partial' ? 'mixed' : 'defeat',
    importance: grade === 'Legendary' || deaths.length ? 5 : mission.risk >= 3 ? 3 : 2,
    title: `${grade}: ${mission.title}`,
    text: narrative,
    heroIds: mission.assignments.map((assignment) => assignment.heroId),
    tags: [mission.family, grade, option.tag, mission.formationType].filter(Boolean),
    facts: { grade, reward, fame, chance: adjustedChance, roll: Math.round(roll), option: option.label },
    missionRecordId: record.id,
  });

  next.notifications.push({
    id: `result-${mission.id}`,
    tone: cleanSuccess ? 'green' : grade === 'Partial' ? 'gold' : 'red',
    title: `${grade}: ${mission.title}`,
    text: `${reward} crowns · ${fame >= 0 ? '+' : ''}${fame} fame${injuries.length ? ` · ${injuries.length} injured` : ''}`,
  });
  next.activeMissions.splice(missionIndex, 1);
  next.pendingDecisions.splice(decisionIndex, 1);
  if (!next.pendingDecisions.length) {
    queueDueCombatMissionInPlace(next);
    queueDueMissionGameInPlace(next);
  }
  if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'resolveChoice') completeTutorialTargetInPlace(next, 'resolveChoice');
  commitRng(next, rng);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: record };
}

function resultNarrative(mission, option, grade, reward, fame, injuries, deaths) {
  const opening = {
    Legendary: `The decision to “${option.label}” becomes the version sung in halls far beyond ${mission.region}.`,
    'Great Success': `The party executes “${option.label}” with authority and returns in triumph.`,
    Success: `The plan holds. The central objective is achieved without changing the age.`,
    Partial: `The mission succeeds in part, but the guild pays for every compromise.`,
    Defeat: `The party survives a failed attempt and returns with hard questions.`,
    Catastrophic: `The expedition collapses around the choice to “${option.label}.”`,
  }[grade];
  const consequence = deaths.length
    ? ` ${deaths.join(', ')} ${deaths.length === 1 ? 'does' : 'do'} not return.`
    : injuries.length
      ? ` ${injuries.join(', ')} return wounded.`
      : ' Every hero returns alive.';
  return `${opening}${consequence} The guild receives ${reward} crowns and ${fame} fame.`;
}

export function acknowledgeReport(state, reference) {
  const next = clone(state);
  const id = typeof reference === 'string' ? reference : reference?.id;
  next.pendingReports = (next.pendingReports || []).filter((item) => item.id !== id);
  completeTutorialTargetInPlace(next, 'viewMissionReport');
  return finalize(next);
}

function progressSagaInPlace(state, sagaId, amount) {
  const saga = state.sagas.find((item) => item.id === sagaId);
  if (!saga || saga.completed) return;
  saga.discovered = true;
  saga.progress = Math.min(saga.stages, saga.progress + amount);
  if (saga.progress >= saga.stages) {
    saga.completed = true;
    state.stats.signatureFeats += 1;
    state.guild.legacy += 40 + tierIndexByName(saga.tier) * 20;
    addChronicle(state, {
      type: 'saga',
      importance: 5,
      title: `${saga.id} concludes`,
      text: `The guild’s choices become the accepted ending of ${saga.id}.`,
      tags: ['saga', 'signature-feat'],
    });
  }
}

export function recruitCandidate(state, candidateId, negotiation = 'accept') {
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
  hero.promises = acceptedDemand ? [acceptedDemand] : [];
  addHeroHistory(hero, next, {
    type: 'joined',
    title: `Joined ${next.guild.name}`,
    text: `Recruited through ${candidate.channel} in ${LOCATION_BY_ID[recruitedLocationId]?.name || getCurrentLocation(next).name} as a level ${hero.level} ${hero.rarity} ${hero.primal} ${hero.classId}.${acceptedDemand ? ` The guild promised: ${acceptedDemand.label}.` : candidate.demand && !acceptingPromise ? ' The guild paid a premium for an unconditional contract.' : ''}`,
  });
  const wasFoundingSolo = activeHeroCount(next) === 1 && !next.flags.firstCompanionHired;
  next.heroes.push(hero);
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

export function acknowledgeCouncilReport(state) {
  const next = clone(state);
  next.council ||= { lastReport: null, unread: false };
  next.council.unread = false;
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

export function inspectGoals(state) {
  const next = clone(state);
  next.flags.goalsInspected = true;
  completeTutorialTargetInPlace(next, 'inspectGoals');
  return finalize(next);
}

function tournamentDefinition(tournament) {
  const source = tournament.kind === 'guild' ? GUILD_TOURNAMENT_DEFINITIONS : INDIVIDUAL_TOURNAMENT_DEFINITIONS;
  return source.find((definition) => definition.id === tournament.definitionId) || null;
}

function tournamentRequirements(tournament) {
  const definition = tournamentDefinition(tournament) || tournament;
  return {
    fame: definition.minFame || 0,
    combatWins: definition.minCombatWins || 0,
    tierIndex: definition.tierIndex || 0,
    level: definition.minLevel || 0,
  };
}

export function getTournamentAccess(state, tournament, heroId = null) {
  if (!tournament) return { unlocked: false, checks: [], locationMet: false, registrationOpen: false };
  const requirements = tournamentRequirements(tournament);
  const hero = heroId ? getHero(state, heroId) : null;
  const checks = [
    { id: 'fame', label: 'Guild fame', current: state.guild.fame, target: requirements.fame, met: state.guild.fame >= requirements.fame },
    {
      id: 'combatWins',
      label: 'Combat mission wins',
      current: state.stats.combatWins || 0,
      target: requirements.combatWins,
      met: (state.stats.combatWins || 0) >= requirements.combatWins,
    },
    {
      id: 'tierIndex',
      label: 'Guild tier',
      current: state.guild.tierIndex,
      target: requirements.tierIndex,
      met: state.guild.tierIndex >= requirements.tierIndex,
    },
    {
      id: 'level',
      label: 'Hero level',
      current: hero?.level || 0,
      target: requirements.level,
      met: !requirements.level || Boolean(hero && hero.level >= requirements.level),
    },
  ].filter((check) => check.target > 0);
  const locationMet = !tournament.locationId || (state.world?.currentLocationId || 'dunmere') === tournament.locationId;
  const registrationOpen = tournament.status === 'registration' && state.date.year === tournament.year && state.date.month <= tournament.month;
  return { unlocked: checks.every((check) => check.met), checks, locationMet, registrationOpen };
}

function heroTournamentRating(hero, tournament, opponentPrimal = null) {
  if (!hero) return 0;
  ensureTournamentCareer(hero);
  const attrs = hero.attributes || {};
  const classBonus = { Duelist: 9, Guardian: 5, Ranger: 4, Mage: 3, Rogue: 3, Cleric: 2, Scholar: 2, Artificer: 1 }[normalizeClassId(hero.classId)] || 0;
  const rarityBonus = { Common: -14, Uncommon: -8, Rare: 0, Epic: 8, Legend: 18 }[hero.rarity] || 0;
  const technical =
    (attrs.Finesse || hero.power) * 0.28 + (attrs.Might || hero.power) * 0.16 + (attrs.Presence || hero.power) * 0.13 + (attrs.Mind || hero.power) * 0.08;
  const primal = opponentPrimal ? primalCombatModifier(hero.primal, opponentPrimal) * 5.5 : 0;
  const circuitPressure = tournament.circuit === 'Global' ? (hero.level - 12) * 0.35 : tournament.circuit === 'National' ? (hero.level - 7) * 0.25 : 0;
  const agePressure = Math.max(0, (hero.age || 24) - 34) * 0.72;
  return (
    (hero.power + (hero.artifactPowerBonus || 0)) * 0.45 +
    technical +
    hero.form * 0.09 +
    classBonus +
    rarityBonus +
    (hero.specializations?.tournament || 0) +
    primal +
    circuitPressure -
    hero.fatigue * 0.055 -
    agePressure
  );
}

function guildTournamentRating(state, guildId) {
  if (guildId === 'player') {
    const active = state.heroes
      .filter((hero) => !['dead', 'retired'].includes(hero.status))
      .sort((a, b) => b.power - a.power)
      .slice(0, 5);
    return active.length
      ? active.reduce((sum, hero) => sum + hero.power + (hero.artifactPowerBonus || 0) + (hero.specializations?.tournament || 0) * 0.45, 0) / active.length
      : 0;
  }
  const guild = state.rivals.find((item) => item.id === guildId);
  if (!guild) return 0;
  const roster = [guild.star, ...(guild.members || [])]
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .sort((a, b) => b.power - a.power)
    .slice(0, 5);
  return roster.length
    ? roster.reduce((sum, hero) => sum + hero.power + (hero.specializations?.tournament || 0) * 0.45, 0) / roster.length + guild.form * 0.08
    : guild.power;
}

function heroCompetitionTier(state, hero) {
  if (hero.guildId === 'player') return state.guild.tierIndex;
  const rival = state.rivals.find((guild) => guild.id === hero.guildId);
  if (rival) return rival.leagueTierIndex ?? rival.tierIndex;
  const profile = (hero.renown || 0) + (hero.career?.tournamentFame || 0) * 0.25;
  if ((hero.level || 1) >= 14 || profile >= 480) return 2;
  if ((hero.level || 1) >= 8 || profile >= 110) return 1;
  return 0;
}

function eligibleWorldTournamentHeroes(state, definition) {
  const minLevel = Math.max(1, (definition.minLevel || 1) - 3);
  const maxTier = definition.circuit === 'Regional' ? 0 : definition.circuit === 'National' ? 1 : 2;
  const maxLevel = definition.circuit === 'Regional' ? 13 : definition.circuit === 'National' ? 18 : 20;
  const maxProfile = definition.circuit === 'Regional' ? 260 : definition.circuit === 'National' ? 1050 : Infinity;
  const maxCareerTitles = definition.circuit === 'Regional' ? 8 : definition.circuit === 'National' ? 20 : Infinity;
  return getWorldHeroes(state, false)
    .filter((hero) => ['active', 'free-agent', 'available'].includes(hero.status))
    .filter((hero) => hero.level >= minLevel && hero.level <= maxLevel)
    .filter((hero) => heroCompetitionTier(state, hero) <= maxTier)
    .filter((hero) => (hero.renown || 0) + (hero.career?.tournamentFame || 0) * 0.25 <= maxProfile)
    .filter((hero) => (hero.career?.individualTitles || 0) <= maxCareerTitles)
    .filter((hero) => definition.circuit !== 'Global' || ['Rare', 'Epic', 'Legend'].includes(hero.rarity));
}

function weightedTournamentSelection(rows, count, rng, exponent) {
  const selected = [];
  const pool = [...rows];
  while (selected.length < count && pool.length) {
    const index = Math.min(pool.length - 1, Math.floor(Math.pow(rng.next(), exponent) * pool.length));
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function buildIndividualTournamentField(state, rng, tournament, count) {
  const definition = tournamentDefinition(tournament) || tournament;
  const aiRepeatCeiling = (definition.record?.wins || 4) + 2;
  const all = eligibleWorldTournamentHeroes(state, definition)
    .filter((hero) => (hero.career?.titleWins?.[definition.id] || 0) < aiRepeatCeiling)
    .map((hero) => {
      const priorWins = hero.career?.titleWins?.[definition.id] || 0;
      const baseRepeatPressure = definition.circuit === 'Regional' ? 5.5 : definition.circuit === 'National' ? 4.2 : 3.2;
      const repeatPressure = priorWins * baseRepeatPressure + Math.max(0, priorWins - 4) * 8;
      const independentPenalty = hero.status === 'free-agent' ? 5 : 0;
      return { hero, score: heroTournamentRating(hero, tournament) + rng.int(-7, 7) - repeatPressure - independentPenalty };
    });

  const local = all.filter(({ hero }) => hero.homeLocationId === definition.locationId);
  const preferred = local.length >= Math.ceil(count * 0.6) ? local : all;
  const guildRows = preferred.filter(({ hero }) => hero.status !== 'free-agent').sort((a, b) => b.score - a.score);
  const freeRows = preferred.filter(({ hero }) => hero.status === 'free-agent').sort((a, b) => b.score - a.score);
  const freeCap = definition.circuit === 'Regional' ? Math.min(2, Math.ceil(count * 0.15)) : 1;
  const exponent = definition.circuit === 'Regional' ? 1.35 : definition.circuit === 'National' ? 1.8 : 2.25;
  const selectedFree = weightedTournamentSelection(freeRows.slice(0, Math.max(8, freeCap * 4)), Math.min(freeCap, freeRows.length), rng, exponent);
  const selectedGuild = weightedTournamentSelection(guildRows.slice(0, Math.max(count * 4, 36)), count - selectedFree.length, rng, exponent);
  const selected = [...selectedGuild, ...selectedFree];

  if (selected.length < count) {
    const used = new Set(selected.map((row) => row.hero.id));
    const fallback = all.filter((row) => !used.has(row.hero.id)).sort((a, b) => b.score - a.score);
    selected.push(...weightedTournamentSelection(fallback, count - selected.length, rng, exponent));
  }
  return selected.map((row) => row.hero.id);
}

function seedEntrants(state, tournament, ids, scoreFn) {
  return [...new Set(ids)]
    .map((id) => ({ id, score: scoreFn(id) }))
    .sort((a, b) => b.score - a.score)
    .map((row) => row.id);
}

function expectedFinishForSeed(seed, size, profile, prestige) {
  let expected = seed <= 2 ? 2 : seed <= 4 ? 4 : seed <= 8 ? 8 : size;
  // Seed represents current competitive strength; profile represents public pressure.
  // A world-famous hero entering a modest event is expected to dominate even when form is poor.
  if (profile >= prestige * 8) expected = 1;
  else if (profile >= prestige * 4) expected = Math.min(expected, 2);
  else if (profile >= prestige * 2) expected = Math.min(expected, 4);
  else if (seed === 1 && profile >= prestige * 1.3) expected = 1;
  return expected;
}

function tournamentFameDelta(hero, tournament, expectedFinish, actualFinish, boutWins, showmanshipWins = 0) {
  const prestige = tournament.prestige || 20;
  const profile = (hero.renown || 0) + (hero.career?.tournamentFame || 0) * 0.35;
  const expected = Math.max(1, expectedFinish || tournament.size);
  const actual = Math.max(1, actualFinish || tournament.size);
  const improvement = Math.log2(expected / actual);
  const newcomer = Math.max(0, prestige * 1.35 - profile) / Math.max(18, prestige * 0.75);
  let delta = boutWins * Math.max(1, prestige / 17) + improvement * Math.max(3, prestige / 5) + newcomer + showmanshipWins * 2;
  if (actual === 1) delta += prestige / 4;
  if (actual > expected) {
    const failure = Math.log2(actual / expected);
    delta = profile < prestige * 1.15 ? Math.max(0, (boutWins * prestige) / 24 + newcomer) : (-failure * prestige) / 6;
  }
  if (actual === tournament.size && profile < prestige * 0.9) delta = Math.max(1, Math.round(newcomer));
  return clamp(Math.round(delta), -30, 120);
}

function snapshotTournamentHero(state, heroId) {
  const hero = getHero(state, heroId);
  return hero
    ? {
        heroId: hero.id,
        name: hero.name,
        guildId: hero.guildId || null,
        guildName: getHeroGuildName(state, hero),
        classId: hero.classId,
        primal: hero.primal,
        rarity: hero.rarity,
        level: hero.level,
        power: hero.power,
        tournamentRating: Math.round(heroTournamentRating(hero, { circuit: 'Regional' })),
      }
    : null;
}

function updateIndividualTitleRecordInPlace(state, tournament, winner) {
  const record = state.titleRecords[tournament.definitionId];
  if (!record || !winner) return;
  const key = winner.id;
  record.winsByHero[key] = (record.winsByHero[key] || 0) + 1;
  const wins = record.winsByHero[key];
  record.winners.unshift({
    year: tournament.year,
    heroId: winner.id,
    heroName: winner.name,
    guildName: getHeroGuildName(state, winner),
    player: winner.guildId === 'player',
  });
  record.winners = record.winners.slice(0, MAX_TITLE_HISTORY);
  if (wins > record.recordWins) {
    record.recordWins = wins;
    record.recordHolderName = winner.name;
  }
}

function updateGuildTitleRecordInPlace(state, tournament, guildId) {
  const record = state.titleRecords[tournament.definitionId];
  if (!record) return;
  const guildName = guildId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildId)?.name || 'Unknown guild';
  record.winsByGuild[guildId] = (record.winsByGuild[guildId] || 0) + 1;
  const wins = record.winsByGuild[guildId];
  record.winners.unshift({ year: tournament.year, guildId, guildName, player: guildId === 'player' });
  record.winners = record.winners.slice(0, MAX_TITLE_HISTORY);
  if (wins > record.recordWins) {
    record.recordWins = wins;
    record.recordHolderName = guildName;
  }
}

function placementPrize(tournament, finish) {
  if (finish === 1) return tournament.purse;
  if (finish === 2) return Math.round(tournament.purse * 0.28);
  if (finish === 4) return Math.round(tournament.purse * 0.09);
  return 0;
}

function recordIndividualTournamentInPlace(state, tournament, championId, playerResult = null) {
  const champion = getHero(state, championId);
  if (!champion) return null;
  ensureTournamentCareer(champion);
  champion.career.titles += 1;
  champion.career.individualTitles += 1;
  champion.career.titleWins[tournament.definitionId] = (champion.career.titleWins[tournament.definitionId] || 0) + 1;
  champion.career.prizeMoney += tournament.purse;
  champion.career.tournamentFame += Math.round(tournament.prestige * 0.55);
  champion.career.bestTournamentFinish = 1;
  champion.renown += Math.round(tournament.prestige * 0.35);
  champion.legacy += Math.round(tournament.prestige * 0.5);
  applyXpInPlace(champion, 80 + tournament.prestige, champion.guildId === 'player' ? state : null, `${tournament.name} championship`);
  addHeroHistory(champion, state, {
    type: 'tournament-title',
    title: `Won ${tournament.name}`,
    text: `Claimed the ${tournament.trophy} and ${tournament.purse} crowns in prize money.`,
  });
  updateIndividualTitleRecordInPlace(state, tournament, champion);

  if (champion.guildId === 'player') {
    state.guild.crowns += tournament.purse;
    state.guild.legacy += Math.round(tournament.prestige * 0.28);
    state.stats.tournamentsWon += 1;
    state.stats.individualTournamentWins = (state.stats.individualTournamentWins || 0) + 1;
    if (tournament.circuit === 'Regional') state.stats.localTournamentWins += 1;
    if (tournament.circuit === 'National') state.stats.professionalTournamentWins += 1;
    if (tournament.circuit === 'Global') state.stats.eliteTournamentWins += 1;
    state.stats.signatureFeats += tournament.circuit === 'Global' ? 1 : 0;
  } else {
    const rival = state.rivals.find((guild) => guild.id === champion.guildId);
    if (rival) {
      rival.titles += 1;
      rival.prizeMoney = (rival.prizeMoney || 0) + tournament.purse;
      rival.fame += Math.round(tournament.prestige * 0.35);
      rival.legacy += Math.round(tournament.prestige * 0.3);
      rival.careerPoints = (rival.careerPoints || 0) + tournament.prestige;
    }
  }

  const record = {
    id: `individual-record-${tournament.id}`,
    kind: 'individual-tournament',
    tournamentId: tournament.id,
    definitionId: tournament.definitionId,
    title: tournament.name,
    circuit: tournament.circuit,
    location: tournament.location,
    year: tournament.year,
    championId,
    championName: champion.name,
    championGuild: getHeroGuildName(state, champion),
    prize: tournament.purse,
    prestige: tournament.prestige,
    entrants: tournament.initialEntrants.map((id) => snapshotTournamentHero(state, id)).filter(Boolean),
    bracket: clone(tournament.bracket),
    playerResult,
    narrative: playerResult
      ? `${playerResult.heroName} finished ${playerResult.finish === 1 ? 'as champion' : `in the top ${playerResult.finish}`}, against an expectation of top ${playerResult.expectedFinish}. ${playerResult.fameDelta >= 0 ? 'The run increased' : 'The result damaged'} public standing by ${Math.abs(playerResult.fameDelta)} fame.`
      : `${champion.name} of ${getHeroGuildName(state, champion)} won the ${tournament.name}.`,
  };
  state.tournamentHistory.unshift(record);
  state.tournamentHistory = state.tournamentHistory.slice(0, MAX_TOURNAMENT_HISTORY);
  state.universeStats.individualTournamentsResolved = (state.universeStats.individualTournamentsResolved || 0) + 1;
  if (playerResult) state.pendingReports.unshift({ kind: 'tournament', id: record.id });
  addChronicle(state, {
    type: 'tournament',
    importance: playerResult?.finish === 1 || tournament.circuit === 'Global' ? 5 : playerResult ? 2 : tournament.prestige >= 100 ? 4 : 2,
    title: `${champion.name} wins the ${tournament.name}`,
    text: record.narrative,
    heroIds: [championId, ...(playerResult && playerResult.heroId !== championId ? [playerResult.heroId] : [])],
    guildIds: champion.guildId ? [champion.guildId] : [],
    tags: ['tournament', tournament.circuit, 'individual'],
    tournamentRecordId: record.id,
  });
  return record;
}

function resolveAiDuel(state, tournament, heroAId, heroBId, rng) {
  const heroA = getHero(state, heroAId);
  const heroB = getHero(state, heroBId);
  if (!heroA) return heroBId;
  if (!heroB) return heroAId;
  const volatility = tournament.circuit === 'Regional' ? 12 : tournament.circuit === 'National' ? 10 : 8;
  const ratingA = heroTournamentRating(heroA, tournament, heroB.primal) + rng.int(-volatility, volatility);
  const ratingB = heroTournamentRating(heroB, tournament, heroA.primal) + rng.int(-volatility, volatility);
  const winner = ratingA >= ratingB ? heroA : heroB;
  const loser = winner.id === heroA.id ? heroB : heroA;
  ensureTournamentCareer(winner);
  ensureTournamentCareer(loser);
  winner.career.tournamentBouts += 1;
  winner.career.tournamentBoutWins += 1;
  loser.career.tournamentBouts += 1;
  winner.form = clamp(winner.form + 1, 30, 96);
  loser.form = clamp(loser.form - 1, 25, 96);
  return winner.id;
}

function resolveIndividualRoundInPlace(state, tournament, rng, playerTactic = 'Measured', forcedPlayerResult = null) {
  const entrants = [...tournament.activeEntrants];
  const pairs = [];
  for (let i = 0; i < entrants.length / 2; i += 1) pairs.push([entrants[i], entrants[entrants.length - 1 - i]]);
  const roundSize = entrants.length;
  const roundName = roundSize === 16 ? 'Round of 16' : roundSize === 8 ? 'Quarterfinal' : roundSize === 4 ? 'Semifinal' : 'Final';
  const winners = [];
  let playerLost = false;
  let showmanshipWin = false;
  for (const [heroAId, heroBId] of pairs) {
    let winnerId;
    let chance = null;
    let tactic = null;
    const playerId = tournament.playerHeroId;
    if (playerId && (heroAId === playerId || heroBId === playerId)) {
      const player = getHero(state, playerId);
      const opponent = getHero(state, heroAId === playerId ? heroBId : heroAId);
      const tacticMod = { Measured: 1, Aggressive: 4, Defensive: 0, Showmanship: -3 }[playerTactic] ?? 1;
      const fatigueCost = forcedPlayerResult
        ? clamp(5 + (forcedPlayerResult.turns || 4) * 2, 8, 22)
        : ({ Measured: 11, Aggressive: 17, Defensive: 7, Showmanship: 13 }[playerTactic] ?? 11);
      const playerRating = heroTournamentRating(player, tournament, opponent?.primal) + tacticMod;
      const opponentRating = heroTournamentRating(opponent, tournament, player?.primal);
      chance = clamp(Math.round(100 / (1 + Math.exp(-(playerRating - opponentRating) / 7.5))), 7, 93);
      winnerId = forcedPlayerResult ? (forcedPlayerResult.playerWon ? playerId : opponent.id) : rng.next() * 100 < chance ? playerId : opponent.id;
      tactic = forcedPlayerResult ? 'Turn-based' : playerTactic;
      ensureTournamentCareer(player);
      player.career.tournamentBouts += 1;
      player.fatigue = clamp(player.fatigue + fatigueCost, 0, 100);
      player.form = clamp(player.form + (winnerId === playerId ? 2 : -4), 25, 96);
      const xpGain = Math.round(
        (winnerId === playerId ? 62 : 36) + tournament.prestige * 0.45 + (forcedPlayerResult ? Math.min(20, (forcedPlayerResult.turns || 0) * 2) : 0),
      );
      applyXpInPlace(player, xpGain, state, `${tournament.name} ${roundName.toLowerCase()}`);
      player.career.xpEarned += xpGain;
      if (winnerId === playerId) {
        player.career.tournamentBoutWins += 1;
        tournament.playerBoutWins += 1;
        if (!forcedPlayerResult && playerTactic === 'Showmanship') {
          tournament.showmanshipWins += 1;
          showmanshipWin = true;
        }
      } else playerLost = true;
      addHeroHistory(player, state, {
        type: 'tournament',
        title: `${roundName}: ${winnerId === playerId ? 'victory' : 'defeat'} at ${tournament.name}`,
        text: forcedPlayerResult
          ? `${winnerId === playerId ? 'Defeated' : 'Lost to'} ${opponent.name} after ${forcedPlayerResult.turns || '?'} tactical turns.`
          : `${winnerId === playerId ? 'Defeated' : 'Lost to'} ${opponent.name} using a ${playerTactic.toLowerCase()} approach.`,
      });
      if (opponent) {
        ensureTournamentCareer(opponent);
        opponent.career.tournamentBouts += 1;
        if (winnerId === opponent.id) opponent.career.tournamentBoutWins += 1;
      }
    } else {
      winnerId = resolveAiDuel(state, tournament, heroAId, heroBId, rng);
    }
    winners.push(winnerId);
    tournament.bracket.push({
      round: roundName,
      heroAId,
      heroAName: getHero(state, heroAId)?.name,
      heroBId,
      heroBName: getHero(state, heroBId)?.name,
      winnerId,
      winnerName: getHero(state, winnerId)?.name,
      playerBout: Boolean(tournament.playerHeroId && [heroAId, heroBId].includes(tournament.playerHeroId)),
      chance,
      tactic,
      showmanshipWin,
      combat:
        forcedPlayerResult && tournament.playerHeroId && [heroAId, heroBId].includes(tournament.playerHeroId)
          ? {
              turns: forcedPlayerResult.turns,
              method: forcedPlayerResult.method,
              playerHpPct: forcedPlayerResult.playerHpPct,
              enemyHpPct: forcedPlayerResult.enemyHpPct,
            }
          : null,
    });
    state.universeStats.boutsResolved = (state.universeStats.boutsResolved || 0) + 1;
  }
  tournament.activeEntrants = winners;
  tournament.currentRoundSize = winners.length;
  return { roundSize, roundName, playerLost };
}

function finishPlayerIndividualTournamentInPlace(state, tournament, actualFinish) {
  const hero = getHero(state, tournament.playerHeroId);
  if (!hero) return null;
  ensureTournamentCareer(hero);
  hero.status = 'available';
  hero.career.bestTournamentFinish = Math.min(hero.career.bestTournamentFinish || 99, actualFinish);
  if (actualFinish === 2) hero.career.runnerUps += 1;
  if (actualFinish === 4) hero.career.semifinals += 1;
  const fameDelta = tournamentFameDelta(
    hero,
    tournament,
    tournament.expectedFinish,
    actualFinish,
    tournament.playerBoutWins || 0,
    tournament.showmanshipWins || 0,
  );
  const prize = placementPrize(tournament, actualFinish);
  hero.renown = Math.max(0, hero.renown + fameDelta);
  hero.career.tournamentFame += Math.max(0, fameDelta);
  hero.career.prizeMoney += prize;
  state.guild.fame = Math.max(0, state.guild.fame + fameDelta);
  state.guild.crowns += prize;
  state.stats.tournamentBest = Math.min(state.stats.tournamentBest, actualFinish);
  if (tournament.initialSeed > tournament.size / 2 && actualFinish <= 4) state.stats.upsets += 1;
  return {
    heroId: hero.id,
    heroName: hero.name,
    finish: actualFinish,
    expectedFinish: tournament.expectedFinish,
    initialSeed: tournament.initialSeed,
    boutWins: tournament.playerBoutWins || 0,
    fameDelta,
    prize,
    showmanshipWins: tournament.showmanshipWins || 0,
  };
}

function completeIndividualTournamentInPlace(state, tournament, rng, playerFinish = null) {
  // Count the edition once for every entrant. Player registration already increments this field.
  tournament.initialEntrants.forEach((heroId) => {
    const hero = getHero(state, heroId);
    if (!hero) return;
    ensureTournamentCareer(hero);
    if (heroId !== tournament.playerHeroId) {
      hero.career.tournaments += 1;
      hero.career.individualTournaments += 1;
    }
  });
  while (tournament.activeEntrants.length > 1) resolveIndividualRoundInPlace(state, tournament, rng, 'Measured');
  const championId = tournament.activeEntrants[0];
  const finalBout = [...tournament.bracket].reverse().find((bout) => bout.round === 'Final');
  const runnerUpId = finalBout ? (finalBout.heroAId === championId ? finalBout.heroBId : finalBout.heroAId) : null;
  const semifinalLosers = tournament.bracket
    .filter((bout) => bout.round === 'Semifinal')
    .map((bout) => (bout.heroAId === bout.winnerId ? bout.heroBId : bout.heroAId))
    .filter(Boolean);
  [{ id: runnerUpId, finish: 2 }, ...semifinalLosers.map((id) => ({ id, finish: 4 }))].forEach(({ id, finish }) => {
    const hero = getHero(state, id);
    if (!hero || id === tournament.playerHeroId) return;
    ensureTournamentCareer(hero);
    hero.career.bestTournamentFinish = Math.min(hero.career.bestTournamentFinish || 99, finish);
    if (finish === 2) hero.career.runnerUps += 1;
    else hero.career.semifinals += 1;
    const prize = placementPrize(tournament, finish);
    hero.career.prizeMoney += prize;
    hero.career.tournamentFame += Math.round(tournament.prestige * (finish === 2 ? 0.2 : 0.08));
    hero.renown += Math.round(tournament.prestige * (finish === 2 ? 0.12 : 0.05));
    const guild = state.rivals.find((item) => item.id === hero.guildId);
    if (guild) {
      guild.prizeMoney += prize;
      guild.seasonPoints += finish === 2 ? 5 : 2;
      guild.careerPoints += finish === 2 ? 8 : 3;
    }
  });
  tournament.status = 'completed';
  tournament.championId = championId;
  tournament.championName = getHero(state, championId)?.name || 'Unknown champion';
  tournament.finish = playerFinish;
  const playerResult = tournament.playerHeroId
    ? finishPlayerIndividualTournamentInPlace(state, tournament, playerFinish || (championId === tournament.playerHeroId ? 1 : tournament.size))
    : null;
  return recordIndividualTournamentInPlace(state, tournament, championId, playerResult);
}

function createIndividualTournamentsInPlace(state, rng) {
  state.tournaments = INDIVIDUAL_TOURNAMENT_DEFINITIONS.filter((definition) => !definition.cadence || state.date.year % definition.cadence === 0).map(
    (definition) => {
      const location = LOCATION_BY_ID[definition.locationId];
      const tournament = {
        id: `${definition.id}-${state.date.year}`,
        definitionId: definition.id,
        kind: 'individual',
        year: state.date.year,
        name: definition.name,
        circuit: definition.circuit,
        division: definition.circuit,
        locationId: definition.locationId,
        location: location.name,
        region: location.region,
        primal: location.primal,
        month: definition.month,
        size: definition.size,
        entryFee: definition.entryFee,
        purse: definition.purse,
        prestige: definition.prestige,
        trophy: definition.trophy,
        description: definition.description,
        status: 'registration',
        playerHeroId: null,
        playerBoutWins: 0,
        showmanshipWins: 0,
        initialSeed: null,
        expectedFinish: null,
        bracket: [],
        championId: null,
        championName: null,
      };
      tournament.initialEntrants = buildIndividualTournamentField(state, rng, tournament, tournament.size);
      tournament.activeEntrants = seedEntrants(state, tournament, tournament.initialEntrants, (id) => heroTournamentRating(getHero(state, id), tournament));
      tournament.currentRoundSize = tournament.activeEntrants.length;
      return tournament;
    },
  );
}

function buildGuildTournamentField(state, tournament) {
  const eligible = state.rivals
    .filter((guild) => guild.tierIndex >= tournament.tierIndex)
    .sort((a, b) => guildTournamentRating(state, b.id) - guildTournamentRating(state, a.id));
  return eligible.slice(0, tournament.size).map((guild) => guild.id);
}

function createGuildTournamentsInPlace(state) {
  state.guildTournaments = GUILD_TOURNAMENT_DEFINITIONS.map((definition) => {
    const location = LOCATION_BY_ID[definition.locationId];
    const tournament = {
      id: `${definition.id}-${state.date.year}`,
      definitionId: definition.id,
      kind: 'guild',
      year: state.date.year,
      name: definition.name,
      circuit: definition.circuit,
      division: definition.circuit,
      locationId: definition.locationId,
      location: location.name,
      region: location.region,
      primal: location.primal,
      month: definition.month,
      size: definition.size,
      entryFee: definition.entryFee,
      purse: definition.purse,
      prestige: definition.prestige,
      trophy: definition.trophy,
      description: definition.description,
      tierIndex: definition.tierIndex,
      status: 'registration',
      assignments: [],
      bracket: [],
      playerBoutWins: 0,
      initialSeed: null,
      expectedFinish: null,
      championGuildId: null,
    };
    tournament.initialEntrants = buildGuildTournamentField(state, tournament);
    tournament.activeEntrants = seedEntrants(state, tournament, tournament.initialEntrants, (id) => guildTournamentRating(state, id));
    tournament.currentRoundSize = tournament.activeEntrants.length;
    return tournament;
  });
}

function createTournamentsInPlace(state, rng) {
  createIndividualTournamentsInPlace(state, rng);
  createGuildTournamentsInPlace(state);
}

export function enterHeroTournament(state, tournamentId, heroId) {
  const next = clone(state);
  const tournament = next.tournaments.find((item) => item.id === tournamentId);
  const hero = getHero(next, heroId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Tournament registration is closed.' };
  if (!hero || !next.heroes.some((item) => item.id === heroId)) return { state, error: 'Choose one of your active heroes.' };
  const access = getTournamentAccess(next, tournament, heroId);
  if (!access.registrationOpen) return { state, error: 'This year’s registration window has closed.' };
  if (!access.locationMet) return { state, error: `Travel to ${tournament.location} before entering.` };
  if (!access.unlocked) return { state, error: 'The selected hero or guild does not meet the entry requirements.' };
  if (hero.status !== 'available') return { state, error: `${hero.name} is not currently available.` };
  if (next.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} crowns.` };
  if (next.tournaments.some((item) => item.status === 'active') || next.guildTournaments.some((item) => item.status === 'active'))
    return { state, error: 'Finish the current tournament before entering another.' };
  next.guild.crowns -= tournament.entryFee;
  tournament.playerHeroId = heroId;
  const entrants = tournament.initialEntrants.filter((id) => id !== heroId);
  if (entrants.length >= tournament.size) entrants.pop();
  entrants.push(heroId);
  tournament.initialEntrants = seedEntrants(next, tournament, entrants, (id) => heroTournamentRating(getHero(next, id), tournament));
  tournament.activeEntrants = [...tournament.initialEntrants];
  tournament.currentRoundSize = tournament.activeEntrants.length;
  tournament.initialSeed = tournament.initialEntrants.indexOf(heroId) + 1;
  tournament.expectedFinish = expectedFinishForSeed(
    tournament.initialSeed,
    tournament.size,
    hero.renown + hero.career.tournamentFame * 0.35,
    tournament.prestige,
  );
  tournament.status = 'active';
  hero.status = 'tournament';
  ensureTournamentCareer(hero);
  hero.career.tournaments += 1;
  hero.career.individualTournaments += 1;
  addHeroHistory(hero, next, {
    type: 'tournament-entry',
    title: `Entered ${tournament.name}`,
    text: `Seeded #${tournament.initialSeed}; public expectation: top ${tournament.expectedFinish}.`,
  });
  fulfillPromisesInPlace(next, hero, 'tournament', { tournamentId: tournament.id });
  addChronicle(next, {
    type: 'tournament',
    importance: 1,
    title: `${hero.name} enters the ${tournament.name}`,
    text: `The ${hero.rarity.toLowerCase()} ${hero.classId.toLowerCase()} is seeded #${tournament.initialSeed} in a field of ${tournament.size}. The public expects a top-${tournament.expectedFinish} finish.`,
    heroIds: [hero.id],
    tags: ['tournament', 'entry', tournament.circuit],
  });
  return { state: finalize(next), error: null };
}

function individualRoundLabel(size) {
  return size === 16 ? 'Round of 16' : size === 8 ? 'Quarterfinal' : size === 4 ? 'Semifinal' : 'Final';
}

function guildRoundLabel(size) {
  return size === 8 ? 'Quarterfinal' : size === 4 ? 'Semifinal' : 'Final';
}

function mirroredOpponentId(entrants, playerId) {
  const index = entrants.indexOf(playerId);
  if (index < 0) return null;
  const opponentIndex = entrants.length - 1 - index;
  if (opponentIndex < 0 || opponentIndex >= entrants.length || opponentIndex === index) return null;
  return entrants[opponentIndex];
}

function dominantRosterPrimal(heroes, fallback = 'Iron') {
  const counts = {};
  heroes.filter(Boolean).forEach((hero) => {
    counts[hero.primal] = (counts[hero.primal] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

export function beginHeroTournamentCombat(state, tournamentId) {
  const next = clone(state);
  if (next.activeEncounter) return { state, error: 'Another combat is already waiting for your command.' };
  const tournament = next.tournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'active' || !tournament.playerHeroId) return { state, error: 'No active hero tournament entry.' };
  const player = getHero(next, tournament.playerHeroId);
  const opponentId = mirroredOpponentId(tournament.activeEntrants, tournament.playerHeroId);
  const opponent = getHero(next, opponentId);
  if (!player || !opponent) return { state, error: 'The next tournament opponent could not be prepared.' };
  const roundName = individualRoundLabel(tournament.currentRoundSize || tournament.activeEntrants.length);
  next.activeEncounter = createDuelEncounter({
    id: `duel-${tournament.id}-${tournament.currentRoundSize}`,
    seed: (next.rngState ^ hashString(`duel:${tournament.id}:${tournament.currentRoundSize}:${player.id}:${opponent.id}`)) >>> 0,
    sourceType: 'hero-tournament',
    sourceId: tournament.id,
    title: tournament.name,
    roundName,
    playerHero: player,
    opponentHero: opponent,
    prestige: tournament.prestige,
  });
  next.activeEncounter.sourceMeta = { playerHeroId: player.id, opponentHeroId: opponent.id, tournamentId: tournament.id };
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function beginGuildTournamentCombat(state, tournamentId) {
  const next = clone(state);
  if (next.activeEncounter) return { state, error: 'Another combat is already waiting for your command.' };
  const tournament = next.guildTournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'active' || !tournament.assignments?.length) return { state, error: 'No active guild championship entry.' };
  const opponentGuildId = mirroredOpponentId(tournament.activeEntrants, 'player');
  const opponent = next.rivals.find((guild) => guild.id === opponentGuildId);
  if (!opponent) return { state, error: 'The opposing guild could not be prepared.' };
  const playerHeroes = tournament.assignments
    .map((assignment) => ({ hero: getHero(next, assignment.heroId), role: assignment.role }))
    .filter((item) => item.hero);
  const rosterTarget = clamp(playerHeroes.length, 2, 5);
  const opponentRoster = [opponent.star, ...(opponent.members || [])]
    .filter((hero) => hero && !['dead', 'retired'].includes(hero.status))
    .sort((a, b) => (b.power || 0) - (a.power || 0))
    .slice(0, rosterTarget);
  if (playerHeroes.length < 2 || opponentRoster.length < 2) return { state, error: 'Both companies need at least two active heroes.' };
  const roundName = guildRoundLabel(tournament.currentRoundSize || tournament.activeEntrants.length);
  next.activeEncounter = createPartyEncounter({
    id: `guild-battle-${tournament.id}-${tournament.currentRoundSize}`,
    seed: (next.rngState ^ hashString(`guild-battle:${tournament.id}:${tournament.currentRoundSize}:${opponent.id}`)) >>> 0,
    sourceType: 'guild-tournament',
    sourceId: tournament.id,
    title: tournament.name,
    roundName,
    objective: `Break ${opponent.name}'s formation and carry the banner into the next round.`,
    playerHeroes,
    opponentName: opponent.name,
    opponentPrimal: dominantRosterPrimal(opponentRoster, LOCATION_BY_ID[opponent.homeLocationId]?.primal || tournament.primal || 'Iron'),
    opponentClassId: opponent.star?.classId || 'Guardian',
    opponentPower: opponent.power,
    opponentLevel: Math.round(opponentRoster.reduce((sum, hero) => sum + (hero.level || 1), 0) / opponentRoster.length),
    opponentRoster,
    risk: tournament.circuit === 'Global' ? 5 : 4,
    prestige: tournament.prestige,
    objectiveType: 'eliminate',
    objectiveLabel: 'Break the opposing company',
  });
  next.activeEncounter.sourceMeta = { opponentGuildId: opponent.id, tournamentId: tournament.id };
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

function concludeMissionGameInPlace(state) {
  const game = state.activeMissionGame;
  if (!game || game.status === 'active' || !game.result) return false;
  const mission = state.activeMissions.find((item) => item.id === game.sourceId);
  if (!mission) {
    state.activeMissionGame = null;
    return false;
  }
  mission.missionGameResolved = true;
  const grade = missionGradeFromMissionGame(game);
  const decision = missionDecision(mission);
  decision.forcedGrade = grade;
  decision.missionGameResolved = true;
  decision.missionGameSummary = {
    type: game.type,
    grade,
    status: game.status,
    turns: game.result.turns,
    performance: game.result.performance,
    rewardModifier: game.result.rewardModifier,
    metrics: clone(game.result.metrics),
    log: clone(game.result.log || []),
  };
  const outcomeText =
    game.status === 'won'
      ? 'The company controls the decisive phase.'
      : game.status === 'partial'
        ? 'The company secures only part of what it came for.'
        : 'The decisive phase goes against the company.';
  decision.prompt = `${outcomeText} ${decision.prompt}`;
  state.pendingDecisions.push(decision);
  state.activeMissionGame = null;
  addChronicle(state, {
    type: game.status === 'won' ? 'mission-game-victory' : game.status === 'partial' ? 'mission-game-mixed' : 'mission-game-defeat',
    importance: mission.risk >= 4 ? 4 : 2,
    title: `${grade}: ${mission.title}`,
    text: `${game.type} play determined the mission after ${game.result.turns} turns. The company now faces the aftermath decision.`,
    heroIds: mission.assignments.map((assignment) => assignment.heroId),
    tags: [game.type, mission.family, grade],
  });
  return true;
}

export function performActiveMissionGameAction(state, actionId, leadHeroId = null) {
  if (!state.activeMissionGame) return { state, error: 'There is no active mission challenge.' };
  if (state.activeMissionGame.status !== 'active') return { state, error: 'This mission challenge is already resolved.' };
  const next = clone(state);
  const result = performMissionGameAction(next.activeMissionGame, actionId, leadHeroId);
  if (result.error) return { state, error: result.error };
  next.activeMissionGame = result.game;
  concludeMissionGameInPlace(next);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function autoResolveActiveMissionGame(state, mutate = false) {
  if (!state.activeMissionGame) return { state, error: 'There is no active mission challenge.' };
  const next = mutate ? state : clone(state);
  next.activeMissionGame = autoResolveMissionGame(next.activeMissionGame);
  concludeMissionGameInPlace(next);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function performActiveCombatAction(state, actionId, leadHeroId = null) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  if (state.activeEncounter.status !== 'active') return { state, error: 'The combat is over. Conclude the result before issuing another order.' };
  const next = clone(state);
  const normalizedAction = typeof actionId === 'string' ? actionId.toLowerCase() : actionId;
  next.activeEncounter = performCombatAction(next.activeEncounter, normalizedAction, leadHeroId);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function autoResolveActiveCombat(state, mutate = false) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  const next = mutate ? state : clone(state);
  next.activeEncounter = autoResolveEncounter(next.activeEncounter);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function concludeActiveCombat(state, mutate = false) {
  if (!state.activeEncounter) return { state, error: 'There is no combat to conclude.' };
  if (state.activeEncounter.status === 'active' || !state.activeEncounter.result) return { state, error: 'The combat has not finished yet.' };
  const next = mutate ? state : clone(state);
  const encounter = next.activeEncounter;
  const combatResult = clone(encounter.result);
  let report = null;
  let round = null;

  if (encounter.sourceType === 'mission') {
    const mission = next.activeMissions.find((item) => item.id === encounter.sourceId);
    if (!mission) return { state, error: 'The mission behind this combat can no longer be found.' };
    mission.combatResolved = true;
    const grade = missionGradeFromCombat(encounter);
    const decision = missionDecision(mission);
    decision.forcedGrade = grade;
    decision.combatResolved = true;
    decision.combatSummary = {
      grade,
      playerWon: combatResult.playerWon,
      turns: combatResult.turns,
      method: combatResult.method,
      playerHpPct: combatResult.playerHpPct,
      enemyHpPct: combatResult.enemyHpPct,
      playerDamage: combatResult.playerDamage,
      enemyDamage: combatResult.enemyDamage,
      log: encounter.log.slice(-12),
    };
    decision.prompt = `${combatResult.playerWon ? 'The hostile force breaks.' : 'The company is forced back.'} ${decision.prompt}`;
    next.pendingDecisions.push(decision);
    next.activeEncounter = null;
    if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'completeCombat') completeTutorialTargetInPlace(next, 'completeCombat');
    addChronicle(next, {
      type: combatResult.playerWon ? 'combat-victory' : 'combat-defeat',
      importance: mission.risk >= 4 ? 4 : 2,
      title: `${combatResult.playerWon ? 'Victory' : 'Defeat'} in ${mission.title}`,
      text: `${mission.title} was decided after ${combatResult.turns} tactical turns. The expedition now faces its aftermath decision.`,
      heroIds: mission.assignments.map((assignment) => assignment.heroId),
      tags: ['combat', mission.family, grade],
    });
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'mission-combat', grade, combat: combatResult } };
  }

  if (encounter.sourceType === 'hero-tournament') {
    const tournament = next.tournaments.find((item) => item.id === encounter.sourceId);
    if (!tournament || tournament.status !== 'active') return { state, error: 'The tournament round can no longer be found.' };
    const rng = rngFor(next, `hero-tournament-combat:${tournament.id}:${tournament.currentRoundSize}`);
    round = resolveIndividualRoundInPlace(next, tournament, rng, 'Measured', combatResult);
    if (round.playerLost) report = completeIndividualTournamentInPlace(next, tournament, rng, round.roundSize);
    else if (tournament.activeEntrants.length === 1) report = completeIndividualTournamentInPlace(next, tournament, rng, 1);
    commitRng(next, rng);
  } else if (encounter.sourceType === 'guild-tournament') {
    const tournament = next.guildTournaments.find((item) => item.id === encounter.sourceId);
    if (!tournament || tournament.status !== 'active') return { state, error: 'The guild championship round can no longer be found.' };
    const rng = rngFor(next, `guild-tournament-combat:${tournament.id}:${tournament.currentRoundSize}`);
    round = resolveGuildRoundInPlace(next, tournament, rng, 'Measured', combatResult);
    if (round.playerLost) report = completeGuildTournamentInPlace(next, tournament, rng, round.roundSize);
    else if (tournament.activeEntrants.length === 1) report = completeGuildTournamentInPlace(next, tournament, rng, 1);
    commitRng(next, rng);
  } else {
    return { state, error: 'Unknown combat source.' };
  }

  next.activeEncounter = null;
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: round, report };
}

// The tactic argument is kept for API compatibility; rounds now resolve through tactical combat.
export function fightHeroTournamentRound(state, tournamentId, _tactic = 'Measured') {
  const begun = beginHeroTournamentCombat(state, tournamentId);
  if (begun.error) return begun;
  const resolved = autoResolveActiveCombat(begun.state);
  if (resolved.error) return resolved;
  return concludeActiveCombat(resolved.state);
}

function tournamentTeamEstimate(state, assignments) {
  const formation = FORMATION_TYPES.Combat;
  const filled = assignments.map((assignment) => ({ ...assignment, slot: formationSlotFor('Combat', assignment) })).filter((assignment) => assignment.slot);
  const ids = new Set(filled.map((assignment) => assignment.heroId));
  const requiredMissing = formation.slots.filter((slot) => slot.required && !filled.some((assignment) => assignment.slot.id === slot.id));
  const breakdown = filled
    .map((assignment) => {
      const hero = getHero(state, assignment.heroId);
      return hero
        ? {
            heroId: hero.id,
            heroName: hero.name,
            classId: hero.classId,
            role: assignment.slot.role,
            slotId: assignment.slot.id,
            rating: roleRating(hero, assignment.slot.role),
          }
        : null;
    })
    .filter(Boolean);
  const power = breakdown.length
    ? Math.round(breakdown.reduce((sum, item) => sum + item.rating, 0) / breakdown.length + Math.max(0, breakdown.length - 2) * 2.5)
    : 0;
  return {
    power,
    breakdown,
    requiredMissing,
    valid: breakdown.length >= 2 && breakdown.length <= 5 && ids.size === breakdown.length && requiredMissing.length === 0,
  };
}

export function enterGuildTournament(state, tournamentId, formationType, assignments) {
  const next = clone(state);
  const tournament = next.guildTournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Guild championship registration is closed.' };
  const access = getTournamentAccess(next, tournament);
  if (!access.registrationOpen) return { state, error: 'This year’s registration window has closed.' };
  if (!access.locationMet) return { state, error: `Travel to ${tournament.location} before registering.` };
  if (!access.unlocked) return { state, error: 'The guild has not earned this championship license.' };
  if (formationType !== 'Combat') return { state, error: 'Guild championships require a Combat Company.' };
  const estimate = tournamentTeamEstimate(next, assignments);
  if (!estimate.valid) return { state, error: 'A guild championship company needs a Commander, a Fighter and no duplicate heroes.' };
  const unavailable = assignments.map((assignment) => getHero(next, assignment.heroId)).filter((hero) => !hero || hero.status !== 'available');
  if (unavailable.length) return { state, error: 'Every company member must be available.' };
  if (next.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} crowns.` };
  if (next.tournaments.some((item) => item.status === 'active') || next.guildTournaments.some((item) => item.status === 'active'))
    return { state, error: 'Finish the current tournament before entering another.' };
  next.guild.crowns -= tournament.entryFee;
  tournament.assignments = assignments.map((assignment) => {
    const slot = formationSlotFor('Combat', assignment);
    return { heroId: assignment.heroId, slotId: slot.id, role: slot.role };
  });
  const entrants = tournament.initialEntrants.filter((id) => id !== 'player');
  if (entrants.length >= tournament.size) entrants.pop();
  entrants.push('player');
  tournament.initialEntrants = seedEntrants(next, tournament, entrants, (id) => (id === 'player' ? estimate.power : guildTournamentRating(next, id)));
  tournament.activeEntrants = [...tournament.initialEntrants];
  tournament.initialSeed = tournament.initialEntrants.indexOf('player') + 1;
  tournament.expectedFinish = expectedFinishForSeed(tournament.initialSeed, tournament.size, next.guild.fame, tournament.prestige);
  tournament.status = 'active';
  tournament.teamPowerAtEntry = estimate.power;
  tournament.assignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    hero.status = 'tournament';
    ensureTournamentCareer(hero);
    hero.career.tournaments += 1;
    hero.roleExperience[assignment.role] = (hero.roleExperience[assignment.role] || 0) + 1;
    fulfillPromisesInPlace(next, hero, 'tournament', { tournamentId: tournament.id, guildTournament: true });
  });
  addChronicle(next, {
    type: 'tournament',
    importance: 2,
    title: `${next.guild.name} enters ${tournament.name}`,
    text: `The Combat Company is seeded #${tournament.initialSeed}; the expected finish is top ${tournament.expectedFinish}.`,
    heroIds: tournament.assignments.map((assignment) => assignment.heroId),
    tags: ['tournament', 'guild', tournament.circuit],
  });
  return { state: finalize(next), error: null };
}

function resolveGuildRoundInPlace(state, tournament, rng, tactic = 'Measured', forcedPlayerResult = null) {
  const entrants = [...tournament.activeEntrants];
  const pairs = [];
  for (let index = 0; index < entrants.length / 2; index += 1) pairs.push([entrants[index], entrants[entrants.length - 1 - index]]);
  const roundSize = entrants.length;
  const roundName = roundSize === 8 ? 'Quarterfinal' : roundSize === 4 ? 'Semifinal' : 'Final';
  const winners = [];
  let playerLost = false;
  for (const [guildAId, guildBId] of pairs) {
    let winnerId;
    let chance = null;
    let usedTactic = null;
    if ([guildAId, guildBId].includes('player')) {
      const opponentId = guildAId === 'player' ? guildBId : guildAId;
      const opponent = state.rivals.find((guild) => guild.id === opponentId);
      const heroes = tournament.assignments.map((assignment) => getHero(state, assignment.heroId)).filter(Boolean);
      const estimate = tournamentTeamEstimate(state, tournament.assignments);
      const tacticMod = { Measured: 2, Aggressive: 5, Defensive: 0, Showmanship: -2 }[tactic] ?? 2;
      const fatigue = heroes.reduce((sum, hero) => sum + hero.fatigue, 0) / Math.max(1, heroes.length);
      const primalEdge =
        heroes.reduce((sum, hero) => sum + primalCombatModifier(hero.primal, LOCATION_BY_ID[opponent?.homeLocationId]?.primal || tournament.primal) * 5, 0) /
        Math.max(1, heroes.length);
      const playerRating = estimate.power + tacticMod + primalEdge - fatigue * 0.07;
      const opponentRating = guildTournamentRating(state, opponentId);
      chance = clamp(Math.round(100 / (1 + Math.exp(-(playerRating - opponentRating) / 8))), 7, 93);
      winnerId = forcedPlayerResult ? (forcedPlayerResult.playerWon ? 'player' : opponentId) : rng.next() * 100 < chance ? 'player' : opponentId;
      usedTactic = forcedPlayerResult ? 'Turn-based' : tactic;
      heroes.forEach((hero) => {
        const fatigueCost = forcedPlayerResult
          ? clamp(5 + (forcedPlayerResult.turns || 4) * 2, 8, 22)
          : tactic === 'Aggressive'
            ? 17
            : tactic === 'Defensive'
              ? 8
              : 12;
        hero.fatigue = clamp(hero.fatigue + fatigueCost, 0, 100);
        hero.form = clamp(hero.form + (winnerId === 'player' ? 2 : -3), 25, 96);
        hero.career.tournamentBouts += 1;
        if (winnerId === 'player') hero.career.tournamentBoutWins += 1;
        const xpGain = Math.round(
          (winnerId === 'player' ? 70 : 38) + tournament.prestige * 0.32 + (forcedPlayerResult ? Math.min(18, (forcedPlayerResult.turns || 0) * 2) : 0),
        );
        applyXpInPlace(hero, xpGain, state, `${tournament.name} ${roundName.toLowerCase()}`);
        hero.career.xpEarned += xpGain;
      });
      if (winnerId === 'player') tournament.playerBoutWins += 1;
      else playerLost = true;
    } else {
      const ratingA = guildTournamentRating(state, guildAId) + rng.int(-8, 8);
      const ratingB = guildTournamentRating(state, guildBId) + rng.int(-8, 8);
      winnerId = ratingA >= ratingB ? guildAId : guildBId;
    }
    winners.push(winnerId);
    tournament.bracket.push({
      round: roundName,
      guildAId,
      guildAName: guildAId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildAId)?.name,
      guildBId,
      guildBName: guildBId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildBId)?.name,
      winnerId,
      winnerName: winnerId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === winnerId)?.name,
      playerBout: [guildAId, guildBId].includes('player'),
      chance,
      tactic: usedTactic,
      combat:
        forcedPlayerResult && [guildAId, guildBId].includes('player')
          ? {
              turns: forcedPlayerResult.turns,
              method: forcedPlayerResult.method,
              playerHpPct: forcedPlayerResult.playerHpPct,
              enemyHpPct: forcedPlayerResult.enemyHpPct,
            }
          : null,
    });
    state.universeStats.boutsResolved = (state.universeStats.boutsResolved || 0) + 1;
  }
  tournament.activeEntrants = winners;
  tournament.currentRoundSize = winners.length;
  return { roundSize, roundName, playerLost };
}

function finishPlayerGuildTournamentInPlace(state, tournament, actualFinish) {
  tournament.assignments.forEach((assignment) => {
    const hero = getHero(state, assignment.heroId);
    if (!hero) return;
    hero.status = 'available';
    if (actualFinish === 1) {
      hero.career.titles += 1;
      hero.career.guildTitles += 1;
      hero.legacy += Math.round(tournament.prestige * 0.26);
      hero.renown += Math.round(tournament.prestige * 0.13);
    }
  });
  const profileProxy = { renown: state.guild.fame, career: { tournamentFame: state.guild.legacy * 0.1 } };
  const fameDelta = tournamentFameDelta(profileProxy, tournament, tournament.expectedFinish, actualFinish, tournament.playerBoutWins || 0, 0);
  const prize = placementPrize(tournament, actualFinish);
  state.guild.fame = Math.max(0, state.guild.fame + fameDelta);
  state.guild.crowns += prize;
  state.guild.legacy += actualFinish === 1 ? Math.round(tournament.prestige * 0.5) : Math.max(0, Math.round(fameDelta * 0.25));
  state.stats.tournamentBest = Math.min(state.stats.tournamentBest, actualFinish);
  if (actualFinish === 1) {
    state.stats.tournamentsWon += 1;
    state.stats.guildTournamentWins = (state.stats.guildTournamentWins || 0) + 1;
    state.stats.signatureFeats += 1;
  }
  return {
    guildId: 'player',
    guildName: state.guild.name,
    finish: actualFinish,
    expectedFinish: tournament.expectedFinish,
    initialSeed: tournament.initialSeed,
    boutWins: tournament.playerBoutWins || 0,
    fameDelta,
    prize,
  };
}

function recordGuildTournamentInPlace(state, tournament, championGuildId, playerResult = null) {
  updateGuildTitleRecordInPlace(state, tournament, championGuildId);
  if (championGuildId !== 'player') {
    const guild = state.rivals.find((item) => item.id === championGuildId);
    if (guild) {
      guild.titles += 1;
      guild.prizeMoney = (guild.prizeMoney || 0) + tournament.purse;
      guild.fame += Math.round(tournament.prestige * 0.48);
      guild.legacy += Math.round(tournament.prestige * 0.45);
      guild.careerPoints = (guild.careerPoints || 0) + tournament.prestige * 1.3;
      const heroes = [guild.star, ...(guild.members || [])].sort((a, b) => b.power - a.power).slice(0, 5);
      heroes.forEach((hero) => {
        ensureTournamentCareer(hero);
        hero.career.titles += 1;
        hero.career.guildTitles += 1;
        hero.legacy += Math.round(tournament.prestige * 0.14);
      });
    }
  }
  const championName = championGuildId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === championGuildId)?.name || 'Unknown guild';
  const record = {
    id: `guild-record-${tournament.id}`,
    kind: 'guild-tournament',
    tournamentId: tournament.id,
    definitionId: tournament.definitionId,
    title: tournament.name,
    circuit: tournament.circuit,
    location: tournament.location,
    year: tournament.year,
    championGuildId,
    championName,
    prize: tournament.purse,
    prestige: tournament.prestige,
    entrants: tournament.initialEntrants.map((guildId) => ({
      guildId,
      guildName: guildId === 'player' ? state.guild.name : state.rivals.find((guild) => guild.id === guildId)?.name,
      rating: Math.round(guildTournamentRating(state, guildId)),
    })),
    bracket: clone(tournament.bracket),
    team: tournament.assignments
      .map((assignment) => {
        const hero = getHero(state, assignment.heroId);
        return hero
          ? { heroId: hero.id, name: hero.name, role: assignment.role, level: hero.level, rarity: hero.rarity, primal: hero.primal, power: hero.power }
          : null;
      })
      .filter(Boolean),
    playerResult,
    narrative: playerResult
      ? `${state.guild.name} finished top ${playerResult.finish}, against an expectation of top ${playerResult.expectedFinish}.`
      : `${championName} won the ${tournament.name}.`,
  };
  state.tournamentHistory.unshift(record);
  state.tournamentHistory = state.tournamentHistory.slice(0, MAX_TOURNAMENT_HISTORY);
  state.universeStats.guildTournamentsResolved = (state.universeStats.guildTournamentsResolved || 0) + 1;
  if (playerResult) state.pendingReports.unshift({ kind: 'tournament', id: record.id });
  addChronicle(state, {
    type: 'tournament',
    importance: championGuildId === 'player' || tournament.circuit === 'Global' ? 5 : 3,
    title: `${championName} wins ${tournament.name}`,
    text: record.narrative,
    guildIds: [championGuildId],
    heroIds: record.team.map((hero) => hero.heroId),
    tags: ['tournament', 'guild', tournament.circuit],
    tournamentRecordId: record.id,
  });
  return record;
}

function completeGuildTournamentInPlace(state, tournament, rng, playerFinish = null) {
  while (tournament.activeEntrants.length > 1) resolveGuildRoundInPlace(state, tournament, rng, 'Measured');
  const championGuildId = tournament.activeEntrants[0];
  tournament.status = 'completed';
  tournament.championGuildId = championGuildId;
  const playerResult = tournament.assignments.length
    ? finishPlayerGuildTournamentInPlace(state, tournament, playerFinish || (championGuildId === 'player' ? 1 : tournament.size))
    : null;
  return recordGuildTournamentInPlace(state, tournament, championGuildId, playerResult);
}

export function fightGuildTournamentRound(state, tournamentId, _tactic = 'Measured') {
  const begun = beginGuildTournamentCombat(state, tournamentId);
  if (begun.error) return begun;
  const resolved = autoResolveActiveCombat(begun.state);
  if (resolved.error) return resolved;
  return concludeActiveCombat(resolved.state);
}

function simulateScheduledCompetitionsInPlace(state, rng) {
  const all = [...(state.tournaments || []), ...(state.guildTournaments || [])];
  all.forEach((tournament) => {
    if (tournament.status !== 'registration') return;
    const hasPassed = state.date.year > tournament.year || (state.date.year === tournament.year && state.date.month > tournament.month);
    if (!hasPassed) return;
    if (tournament.kind === 'individual') completeIndividualTournamentInPlace(state, tournament, rng, null);
    else completeGuildTournamentInPlace(state, tournament, rng, null);
  });
}

export function enterTournament(state, tournamentId, formationType, assignments) {
  return enterGuildTournament(state, tournamentId, formationType, assignments);
}

export function fightTournamentRound(state, tournamentId, tactic = 'Measured') {
  return fightGuildTournamentRound(state, tournamentId, tactic);
}

export function dismissNotification(state, notificationId) {
  const next = clone(state);
  next.notifications = next.notifications.filter((notification) => notification.id !== notificationId);
  return finalize(next);
}

export function clearNotifications(state) {
  const next = clone(state);
  next.notifications = [];
  return finalize(next);
}

export function updateSettings(state, patch) {
  const next = clone(state);
  next.settings = { ...next.settings, ...patch };
  return finalize(next);
}

export function getNextAction(state) {
  if (state.activeEncounter) {
    const finished = state.activeEncounter.status !== 'active';
    return {
      kind: 'critical',
      title: state.activeEncounter.title || 'Combat in progress',
      body: finished
        ? `${state.activeEncounter.result?.playerWon ? 'Victory' : 'Defeat'} · Review the result and conclude the engagement.`
        : `${state.activeEncounter.roundName || 'Engagement'} · Turn ${state.activeEncounter.turn}. Read the opponent and choose your next action.`,
      screen: state.activeEncounter.sourceType?.includes('tournament') ? 'tournaments' : 'missions',
      action: 'combat',
    };
  }
  if (state.activeMissionGame) {
    return {
      kind: 'critical',
      title: `${state.activeMissionGame.type}: ${state.activeMissionGame.title}`,
      body: `Turn ${state.activeMissionGame.turn}. Choose a lead hero and play the decisive mission challenge.`,
      screen: 'missions',
      action: 'mission-game',
    };
  }
  if (isGuildDefunct(state)) {
    return {
      kind: 'critical',
      title: 'No active heroes remain',
      body: 'Every hero of the guild is dead or retired. Refound the guild with a new founder and one free recruit to continue the chronicle.',
      screen: 'hall',
      action: 'refound',
    };
  }
  if (!state.tutorial.completed) {
    return { kind: 'tutorial', ...ONBOARDING_STEPS[state.tutorial.step], step: state.tutorial.step + 1, total: ONBOARDING_STEPS.length };
  }
  if (state.pendingDecisions.length) {
    return { kind: 'critical', title: 'A critical decision is waiting', body: state.pendingDecisions[0].prompt, screen: 'hall', action: 'resolve' };
  }
  if (state.pendingReports?.length) {
    const report = getReport(state, state.pendingReports[0]);
    return {
      kind: 'critical',
      title: report ? `Read the report: ${report.title}` : 'An expedition report is waiting',
      body: 'Review the full team, formation, odds, rewards and consequences before continuing.',
      screen: 'chronicle',
      action: 'report',
    };
  }
  if (state.guild.crowns < monthlyUpkeep(state) * 1.5) {
    const loanOffer = getPatronLoanOffer(state);
    if (state.guild.crowns < 0 && loanOffer.available) {
      return {
        kind: 'warning',
        title: 'The guild is in debt',
        body: `You have ${state.guild.crowns} crowns and heroes are losing loyalty. A patron will advance ${loanOffer.amount} crowns (repay ${loanOffer.installment}/month).`,
        screen: 'hall',
        action: 'patron-loan',
      };
    }
    return {
      kind: 'warning',
      title: 'Treasury under pressure',
      body: `You have ${state.guild.crowns} crowns. Monthly upkeep is ${monthlyUpkeep(state)}. Take a contract before expanding.`,
      screen: 'missions',
    };
  }
  const activeGoal = state.goals.find((goal) => !goal.completed && tierIndexByName(goal.tier) <= state.guild.tierIndex);
  if (activeGoal) {
    const current = getGoalMetric(state, activeGoal.metric);
    const screenByMetric = {
      missionsWon: 'missions',
      missionsCompleted: 'missions',
      tournamentBest: 'tournaments',
      fame: 'missions',
      alignmentChosen: 'headquarters',
      tierIndex: 'goals',
      greatHallLevel: 'headquarters',
      legendHero: 'heroes',
      highestLevel: 'heroes',
      primalDiversity: 'world',
      professionalTournamentWins: 'tournaments',
      artifacts: 'chronicle',
      years: 'hall',
    };
    const actionByMetric = {
      missionsWon: 'Choose a contract you can cover with the recommended roles.',
      tournamentBest: 'Build a Combat Company, qualify for the next circuit and enter this year’s tournament.',
      fame: 'Favor high-fame contracts, saga choices and public victories.',
      alignmentChosen: 'Open Headquarters and decide who the guild will serve.',
      tierIndex: 'Review the promotion checklist and complete its next missing condition.',
      greatHallLevel: 'Save enough crowns to upgrade the Great Hall.',
      legendHero: 'Give a high-potential hero missions, training and meaningful roles.',
      highestLevel: 'Missions grant much more experience than monthly training. Keep the hero active without exhausting them.',
      primalDiversity: 'Travel to a differently aligned settlement and inspect its local recruitment market.',
      professionalTournamentWins: 'Meet the fame and combat-win thresholds, travel to Tidecross and win the professional circuit.',
      artifacts: 'Pursue missions that display an artifact possibility.',
      years: 'Keep the institution solvent and advance the chronicle.',
    };
    return {
      kind: 'goal',
      title: activeGoal.title,
      body: `${activeGoal.description} ${actionByMetric[activeGoal.metric] || ''}`.trim(),
      screen: screenByMetric[activeGoal.metric] || 'goals',
      progress: current,
      target: activeGoal.target,
    };
  }
  const requirement = promotionRequirement(state);
  if (requirement) {
    const checks = [
      ['fame', requirement.fame],
      ['successful contracts', requirement.contracts],
      ['guild rank', requirement.rank],
      ['signature achievements', requirement.feat],
      ['campaign years', requirement.time],
    ];
    const [label, missing] = checks.find(([, item]) => !item.met) || checks[0];
    const display = label === 'guild rank' ? `rank #${missing.current}; need #${missing.target} or better` : `${missing.current}/${missing.target} ${label}`;
    return {
      kind: 'promotion',
      title: `Path to ${requirement.target.id}`,
      body: `Next threshold: ${display}. Open the full checklist to choose how to achieve it.`,
      screen: 'goals',
    };
  }
  return {
    kind: 'legacy',
    title: 'Write the next chapter',
    body: 'Choose a dangerous contract, develop a successor or pursue a saga that history will remember.',
    screen: 'missions',
  };
}

export function getDashboardSummary(state) {
  const rankSummary = getGuildRankSummary(state);
  return {
    date: dateLabel(state),
    tier: state.guild.tier,
    rank: state.guild.rank,
    rankSummary,
    crowns: state.guild.crowns,
    fame: state.guild.fame,
    legacy: state.guild.legacy,
    upkeep: monthlyUpkeep(state),
    loan: state.guild.loan || null,
    unpaidMonths: state.guild.unpaidMonths || 0,
    activeHeroes: activeHeroCount(state),
    capacity: heroCapacity(state),
    activeMissions: state.activeMissions.length,
    partyCapacity: partyCapacity(state),
    decisions: state.pendingDecisions.length,
    combatActive: Boolean(state.activeEncounter),
    missionGameActive: Boolean(state.activeMissionGame),
    location: getCurrentLocation(state).name,
    locationId: getCurrentLocation(state).id,
    locationPrimal: getCurrentLocation(state).primal,
    travel: state.world?.activeTravel || null,
  };
}

export function compactForSave(state, aggressive = false) {
  const saved = clone(state);
  saved.notifications = saved.notifications.slice(-6);
  saved.pendingReports = (saved.pendingReports || []).slice(0, 6);
  saved.chronicle = saved.chronicle.slice(0, aggressive ? 420 : MAX_CHRONICLE);
  // Mission history is a first-class archive, but recent playable encounters now carry
  // tactical logs, relationship deltas and detailed hero effects. Preserve the complete
  // report for recent missions and collapse older entries into a historical record that
  // still supports Chronicle drill-down without making century saves progressively slower.
  saved.missionHistory = (saved.missionHistory || []).slice(0, aggressive ? 220 : MAX_MISSION_HISTORY).map((record, historyIndex) => {
    const keepFullDetail = historyIndex < (aggressive ? 48 : 110);
    const team = (record.team || []).map((hero) => ({
      heroId: hero.heroId,
      name: hero.name,
      classId: hero.classId,
      role: hero.role,
      primal: hero.primal,
      rarity: hero.rarity,
      level: hero.level,
      power: hero.power,
      roleRating: hero.roleRating,
      status: hero.status,
    }));
    const combat = record.combat
      ? {
          playerWon: record.combat.playerWon,
          turns: record.combat.turns,
          method: record.combat.method,
          playerHpPct: record.combat.playerHpPct,
          enemyHpPct: record.combat.enemyHpPct,
          performance: record.combat.performance,
          ...(keepFullDetail && record.combat.log ? { log: record.combat.log.slice(0, 10) } : {}),
        }
      : null;
    const missionGame = record.missionGame
      ? {
          type: record.missionGame.type,
          grade: record.missionGame.grade,
          status: record.missionGame.status,
          turns: record.missionGame.turns,
          performance: record.missionGame.performance,
          rewardModifier: record.missionGame.rewardModifier,
          metrics: record.missionGame.metrics,
          ...(keepFullDetail && record.missionGame.log ? { log: record.missionGame.log.slice(0, 10) } : {}),
        }
      : null;
    if (keepFullDetail)
      return {
        ...record,
        team,
        combat,
        missionGame,
        relationshipChanges: (record.relationshipChanges || []).slice(0, 12),
        heroEffects: (record.heroEffects || []).map((effect) => ({
          heroId: effect.heroId,
          name: effect.name,
          role: effect.role,
          status: effect.status,
          injury: effect.injury,
          formChange: effect.formChange,
          moraleChange: effect.moraleChange,
          loyaltyChange: effect.loyaltyChange,
          personalityReaction: effect.personalityReaction,
          renownChange: effect.renownChange,
          legacyChange: effect.legacyChange,
          healthChange: effect.healthChange,
          xpGain: effect.xpGain,
          levelBefore: effect.levelBefore,
          levelAfter: effect.levelAfter,
        })),
      };
    return {
      id: record.id,
      kind: record.kind,
      title: record.title,
      family: record.family,
      locationName: record.locationName,
      enemyPrimal: record.enemyPrimal,
      patronPrimal: record.patronPrimal,
      risk: record.risk,
      formationType: record.formationType,
      completedYear: record.completedYear,
      completedDate: record.completedDate,
      grade: record.grade,
      reward: record.reward,
      fame: record.fame,
      supplyCost: record.supplyCost,
      finalChance: record.finalChance,
      roll: record.roll,
      decision: record.decision ? { prompt: record.decision.prompt, label: record.decision.label, note: record.decision.note } : null,
      combat,
      missionGame,
      team: team.map((hero) => ({
        heroId: hero.heroId,
        name: hero.name,
        classId: hero.classId,
        role: hero.role,
        primal: hero.primal,
        level: hero.level,
        power: hero.power,
        roleRating: hero.roleRating,
        status: hero.status,
      })),
      injuries: record.injuries || [],
      deaths: record.deaths || [],
      artifact: record.artifact || null,
      narrative: record.narrative,
      consequences: record.consequences || [],
      archived: true,
    };
  });
  // Tournament history is one of the most valuable archives in the game, but the raw
  // simulation record contains redundant rating fields and null tactical properties. Keep
  // every historically useful name/identity/result while storing a compact archival shape.
  saved.tournamentHistory = (saved.tournamentHistory || []).slice(0, aggressive ? 160 : MAX_TOURNAMENT_HISTORY).map((record, historyIndex) => ({
    ...record,
    entrants: (historyIndex < (aggressive ? 60 : 120)
      ? (record.entrants || []).slice(0, aggressive ? 20 : 32)
      : (record.entrants || []).filter((entrant) => entrant.heroId === record.championId || entrant.heroId === record.playerResult?.heroId).slice(0, 2)
    ).map((entrant) => ({
      heroId: entrant.heroId,
      name: entrant.name,
      guildId: entrant.guildId,
      guildName: entrant.guildName,
      classId: entrant.classId,
      primal: entrant.primal,
      rarity: entrant.rarity,
      level: entrant.level,
    })),
    bracket: (historyIndex < (aggressive ? 50 : 100)
      ? (record.bracket || []).slice(-32)
      : (() => {
          const bracket = record.bracket || [];
          const important = bracket.filter((bout) => bout.playerBout);
          const finalBout = bracket.at(-1);
          if (finalBout && !important.includes(finalBout)) important.push(finalBout);
          return important.slice(-8);
        })()
    ).map((bout) => ({
      round: bout.round,
      ...(bout.heroAId ? { heroAId: bout.heroAId } : {}),
      ...(bout.heroAName ? { heroAName: bout.heroAName } : {}),
      ...(bout.heroBId ? { heroBId: bout.heroBId } : {}),
      ...(bout.heroBName ? { heroBName: bout.heroBName } : {}),
      ...(bout.guildAId ? { guildAId: bout.guildAId } : {}),
      ...(bout.guildAName ? { guildAName: bout.guildAName } : {}),
      ...(bout.guildBId ? { guildBId: bout.guildBId } : {}),
      ...(bout.guildBName ? { guildBName: bout.guildBName } : {}),
      ...(bout.winnerId ? { winnerId: bout.winnerId } : {}),
      ...(bout.winnerName ? { winnerName: bout.winnerName } : {}),
      ...(bout.playerBout ? { playerBout: true } : {}),
      ...(bout.chance != null ? { chance: bout.chance } : {}),
      ...(bout.tactic ? { tactic: bout.tactic } : {}),
      ...(bout.showmanshipWin ? { showmanshipWin: true } : {}),
      ...(bout.combat
        ? {
            combat: {
              playerWon: bout.combat.playerWon,
              turns: bout.combat.turns,
              method: bout.combat.method,
              playerHpPct: bout.combat.playerHpPct,
              enemyHpPct: bout.combat.enemyHpPct,
              performance: bout.combat.performance,
            },
          }
        : {}),
    })),
  }));
  saved.heroes.forEach((hero) => {
    hero.history = hero.history.slice(0, aggressive ? 50 : MAX_HERO_HISTORY);
    if (aggressive) hero.relationships = hero.relationships.slice(-12);
  });
  saved.historicHeroes = saved.historicHeroes
    .sort((a, b) => b.legacy - a.legacy)
    .slice(0, aggressive ? 350 : 800)
    .map((hero) => ({ ...hero, history: (hero.history || []).slice(0, aggressive ? 12 : 30) }));
  saved.rivals.forEach((rival) => {
    rival.recent = (rival.recent || []).slice(-10);
    [rival.star, ...(rival.members || [])].filter(Boolean).forEach((hero) => {
      hero.history = (hero.history || []).slice(0, aggressive ? 8 : MAX_WORLD_HERO_HISTORY);
      if (aggressive) hero.relationships = [];
    });
  });
  saved.freeAgents = (saved.freeAgents || [])
    .slice(0, aggressive ? 18 : 40)
    .map((hero) => ({ ...hero, history: (hero.history || []).slice(0, 8), relationships: aggressive ? [] : hero.relationships }));
  saved.worldHistoricHeroes = (saved.worldHistoricHeroes || [])
    .sort((a, b) => b.legacy - a.legacy)
    .slice(0, aggressive ? 120 : 250)
    .map((hero) => ({ ...hero, history: (hero.history || []).slice(0, aggressive ? 6 : 14), relationships: [] }));
  Object.values(saved.titleRecords || {}).forEach((record) => {
    record.winners = (record.winners || []).slice(0, MAX_TITLE_HISTORY);
  });
  if (saved.legacy) {
    saved.legacy.rivalInstitutionEvents = (saved.legacy.rivalInstitutionEvents || []).slice(0, aggressive ? 30 : 80);
    saved.legacy.inheritedAmbitions = (saved.legacy.inheritedAmbitions || []).slice(0, 30);
    saved.legacy.successionHistory = (saved.legacy.successionHistory || []).slice(0, 50);
  }
  (saved.artifacts || []).forEach((artifact) => {
    artifact.ownerHistory = (artifact.ownerHistory || []).slice(0, aggressive ? 12 : 30);
  });
  return saved;
}

export function migrateGame(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid save data.');
  const sourceVersion = raw.schemaVersion || 1;
  const next = clone({ ...raw, schemaVersion: sourceVersion });
  next.schemaVersion = SCHEMA_VERSION;
  next.notifications ||= [];
  next.historicHeroes ||= [];
  next.activeEncounter ||= null;
  next.activeMissionGame ||= null;
  next.pendingDecisions ||= [];
  next.missionHistory ||= [];
  next.tournamentHistory ||= [];
  next.pendingReports ||= [];
  next.artifacts ||= [];
  next.worldArtifacts ||= [];
  next.freeAgents ||= [];
  next.worldHistoricHeroes ||= [];
  next.titleRecords ||= {};
  next.guildTournaments ||= [];
  next.universeStats ||= {};
  next.world ||= { currentLocationId: 'dunmere', visitedLocationIds: ['dunmere'], activeTravel: null };
  next.world.currentLocationId ||= 'dunmere';
  next.world.visitedLocationIds ||= [next.world.currentLocationId];
  next.world.activeTravel ||= null;
  next.council = { lastReport: null, unread: false, ...(next.council || {}) };
  next.guild.tierIndex = clamp(next.guild.tierIndex || 0, 0, TIERS.length - 1);
  next.guild.tier = TIERS[next.guild.tierIndex].id;
  const oldSagas = next.sagas || [];
  next.sagas = SAGA_DEFINITIONS.map((saga) => {
    const previous = oldSagas.find((item) => item.id === saga.id);
    return {
      ...saga,
      progress: previous?.progress || 0,
      completed: Boolean(previous?.completed),
      discovered: previous?.discovered ?? saga.tier === 'Regional',
    };
  });
  const oldGoals = next.goals || [];
  next.goals = CHAPTER_GOALS.map((goal) => {
    const previous = oldGoals.find((item) => item.id === goal.id);
    return { ...goal, completed: Boolean(previous?.completed), claimed: Boolean(previous?.claimed) };
  });
  next.stats = { ...initialStats(), ...(next.stats || {}) };
  next.settings = { autosave: true, reducedMotion: false, compactMode: false, difficulty: 'Standard', ...(next.settings || {}) };
  next.flags ||= {};
  next.flags.firstTravelCompleted ||= false;
  next.guild.facilities = { ...facilityLevels(), ...(next.guild.facilities || {}) };
  next.guild.appointments ||= {};
  next.guild.obligations ||= [];
  next.guild.rivalries ||= [];
  next.guild.formations = { ...emptyFormations(), ...(next.guild.formations || {}) };
  next.guild.branches ||= [];
  next.guild.founderHeroId ||= next.heroes?.[0]?.id || null;
  next.guild.currentGuildmasterHeroId ||= next.guild.founderHeroId;
  next.guild.successorHeroId ||= null;
  next.guild.loan ??= null;
  next.guild.unpaidMonths ??= 0;
  next.legacy = { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [], ...(next.legacy || {}) };

  const migrateHero = (hero, index = 0) => {
    hero.classId = normalizeClassId(hero.classId);
    hero.history ||= [];
    hero.level ||= clamp(Math.round(((hero.power || 45) - 38) / 2.25), 1, 20);
    hero.xp ||= 0;
    hero.rarity ||=
      hero.potential >= 94 ? 'Legend' : hero.potential >= 88 ? 'Epic' : hero.potential >= 81 ? 'Rare' : hero.potential >= 74 ? 'Uncommon' : 'Common';
    hero.primal ||= PRIMAL_IDS[hashString(hero.id || hero.name || String(index)) % PRIMAL_IDS.length];
    hero.homeLocationId ||= 'dunmere';
    hero.monthlyActivity ||= hero.status === 'injured' ? 'Infirmary' : 'Training';
    hero.training ||= 'Fundamentals';
    hero.relationships ||= [];
    hero.promises ||= [];
    hero.mentorId ||= null;
    hero.apprenticeIds ||= [];
    hero.ambitions ||= [];
    if (!hero.ambitions.length && !['dead', 'retired'].includes(hero.status)) hero.ambitions.push(defaultAmbitionForHero(hero, 0));
    hero.artifactIds ||= [];
    hero.artifactPowerBonus ||= 0;
    hero.roleExperience = { ...Object.fromEntries(PARTY_ROLES.map((role) => [role.id, 0])), ...(hero.roleExperience || {}) };
    hero.career = {
      missions: 0,
      wins: 0,
      partials: 0,
      defeats: 0,
      legendary: 0,
      tournaments: 0,
      titles: 0,
      injuries: 0,
      rescues: 0,
      kills: 0,
      artifacts: 0,
      artifactPrestige: 0,
      fame: 0,
      earnings: 0,
      bestMission: null,
      peakPower: hero.power || 0,
      serviceYears: 0,
      xpEarned: 0,
      leadershipYears: 0,
      ...(hero.career || {}),
    };
    ensureTournamentCareer(hero);
  };
  next.heroes.forEach(migrateHero);
  next.historicHeroes.forEach(migrateHero);
  (next.candidates || []).forEach((hero, index) => {
    migrateHero(hero, index);
    hero.locationId ||= hero.homeLocationId || 'dunmere';
    hero.signingFee ||= Math.round((hero.level * 85 + hero.power * 3.5) * (RARITIES[hero.rarity]?.signing || 1));
    hero.buyoutFee ??= Math.round(hero.signingFee * (hero.rarity === 'Legend' ? 0.65 : hero.rarity === 'Epic' ? 0.5 : 0.35));
    if (sourceVersion < 11 && hero.signingFee > 0 && !hero.demand) hero.demand = candidateDemandFor(hero, next, rngFor(next, `migrate-demand-${hero.id}`));
  });
  next.artifacts.forEach((artifact) => {
    artifact.effect ||= artifactEffectFromPrestige(artifact.prestige || 0, artifact.name);
    artifact.ownerHistory ||= [
      {
        year: artifact.discoveredYear || next.date.year,
        month: 0,
        heroId: artifact.ownerId || null,
        heroName: artifact.ownerId ? getHero(next, artifact.ownerId)?.name || 'Unknown bearer' : 'Guild Vault',
        action: 'claimed',
      },
    ];
  });
  const universeRng = rngFor(next, 'migrate-universe-v12');
  if (
    !Array.isArray(next.rivals) ||
    next.rivals.length < GUILD_BLUEPRINTS.length ||
    next.rivals.some((rival) => !rival.star || !Array.isArray(rival.members))
  ) {
    createUniverseInPlace(next, universeRng);
  } else {
    next.rivals.forEach((rival) => {
      rival.members ||= [];
      rival.leagueTierIndex ??= rival.tierIndex;
      rival.tierIndex = rival.leagueTierIndex;
      rival.prizeMoney ||= 0;
      rival.seasonPoints ||= 0;
      rival.careerPoints ||= 0;
      [rival.star, ...rival.members].filter(Boolean).forEach((hero, index) => {
        migrateHero(hero, index);
        hero.status = ['dead', 'retired'].includes(hero.status) ? hero.status : 'active';
      });
    });
    next.freeAgents.forEach((hero, index) => migrateHero(hero, index));
    next.worldHistoricHeroes.forEach((hero, index) => migrateHero(hero, index));
    if (!Object.keys(next.titleRecords).length) next.titleRecords = createTitleRecords();
    if (!next.worldArtifacts.length) createWorldArtifactsInPlace(next, universeRng);
  }
  next.universeStats = { individualTournamentsResolved: 0, guildTournamentsResolved: 0, boutsResolved: 0, seasonsSimulated: 0, ...(next.universeStats || {}) };
  const defaultLocationByRegion = Object.fromEntries(
    REGIONS.map((region) => [region.id, LOCATIONS.find((location) => location.region === region.id)?.id || 'dunmere']),
  );
  (next.missions || []).forEach((mission) => {
    mission.approach ||= formationForMission(mission);
    mission.locationId ||= defaultLocationByRegion[mission.region] || 'dunmere';
    mission.locationName ||= LOCATION_BY_ID[mission.locationId]?.name || mission.region;
    mission.enemyPrimal ||= LOCATION_BY_ID[mission.locationId]?.primal || 'Fire';
    mission.patronPrimal ||= LOCATION_BY_ID[mission.locationId]?.primal || 'Fire';
  });
  (next.activeMissions || []).forEach((mission) => {
    mission.approach ||= formationForMission(mission);
    mission.formationType ||= mission.approach;
    mission.locationId ||= defaultLocationByRegion[mission.region] || next.world.currentLocationId;
    mission.locationName ||= LOCATION_BY_ID[mission.locationId]?.name || mission.region;
    mission.enemyPrimal ||= LOCATION_BY_ID[mission.locationId]?.primal || 'Fire';
    mission.patronPrimal ||= LOCATION_BY_ID[mission.locationId]?.primal || 'Fire';
    const slots = FORMATION_TYPES[mission.formationType]?.slots || FORMATION_TYPES.Combat.slots;
    mission.assignments = (mission.assignments || []).slice(0, 5).map((assignment, index) => ({
      heroId: assignment.heroId,
      slotId: assignment.slotId || slots[index]?.id || slots[slots.length - 1].id,
      role: assignment.role || slots[index]?.role || slots[slots.length - 1].role,
    }));
  });

  // Migration must be idempotent: loading a current save may not reroll its
  // mission board, recruitment market, tournament bracket or active combat.
  // Older prototypes did that here, which made a save/load change history.
  if (!Array.isArray(next.candidates) || next.candidates.length === 0) refreshCandidatesForLocationInPlace(next, universeRng, next.world.currentLocationId);
  if (!Array.isArray(next.missions) || next.missions.length === 0) refreshMissionsInPlace(next, universeRng);
  if (!Array.isArray(next.tournaments) || next.tournaments.length === 0 || !Array.isArray(next.guildTournaments) || next.guildTournaments.length === 0) {
    createTournamentsInPlace(next, universeRng);
  }
  // Very old saves predate persistent tournament commitments. Release only
  // orphaned tournament statuses that are not referenced by a live bracket.
  if (sourceVersion < 8) {
    const committed = new Set();
    (next.tournaments || [])
      .filter((tournament) => tournament.status === 'active' && tournament.playerHeroId)
      .forEach((tournament) => committed.add(tournament.playerHeroId));
    (next.guildTournaments || [])
      .filter((tournament) => tournament.status === 'active')
      .forEach((tournament) => (tournament.assignments || []).forEach((assignment) => committed.add(assignment.heroId)));
    next.heroes
      .filter((hero) => hero.status === 'tournament' && !committed.has(hero.id))
      .forEach((hero) => {
        hero.status = 'available';
      });
  }
  commitRng(next, universeRng);
  delete next.tournament;
  evaluateStateInPlace(next);
  return finalize(next);
}

export function validateGame(state) {
  const errors = [];
  if (!state || state.schemaVersion !== SCHEMA_VERSION) errors.push('Schema version mismatch.');
  if (!state.guild?.name) errors.push('Guild name is missing.');
  if (!Array.isArray(state.heroes) || state.heroes.length < 1) errors.push('No heroes exist.');
  if (!Array.isArray(state.rivals) || state.rivals.length < 25) errors.push('Too few rival guilds.');
  if (!Number.isFinite(state.guild?.crowns)) errors.push('Treasury is invalid.');
  if (!Number.isFinite(state.rngState)) errors.push('RNG state is invalid.');
  if (!state.world || !LOCATION_BY_ID[state.world.currentLocationId]) errors.push('Current guild location is invalid.');
  if (!Array.isArray(state.guild?.branches)) errors.push('Guild branches are invalid.');
  (state.guild?.branches || []).forEach((branch) => {
    if (!LOCATION_BY_ID[branch.locationId]) errors.push(`Branch has invalid location: ${branch.id}`);
    if (branch.active !== false && !state.heroes.some((hero) => hero.id === branch.commanderHeroId && !['dead', 'retired'].includes(hero.status)))
      errors.push(`Branch commander is invalid: ${branch.id}`);
  });
  if (!state.guild?.currentGuildmasterHeroId) errors.push('Current guildmaster is missing.');
  if (!state.legacy || !Array.isArray(state.legacy.inheritedAmbitions)) errors.push('Legacy state is missing.');

  if (state.world?.activeTravel && !LOCATION_BY_ID[state.world.activeTravel.toId]) errors.push('Travel destination is invalid.');
  if (state.activeEncounter && !['active', 'won', 'lost'].includes(state.activeEncounter.status)) errors.push('Combat encounter state is invalid.');
  if (state.activeMissionGame && !['active', 'won', 'lost', 'partial'].includes(state.activeMissionGame.status))
    errors.push('Mission challenge state is invalid.');
  const ids = new Set();
  const validateHero = (hero, context = 'hero') => {
    if (!hero?.id) {
      errors.push(`Missing ${context} id.`);
      return;
    }
    if (ids.has(hero.id)) errors.push(`Duplicate hero id: ${hero.id}`);
    ids.add(hero.id);
    if (!CLASSES[normalizeClassId(hero.classId)]) errors.push(`Unknown class: ${hero.classId}`);
    if (!Number.isFinite(hero.power)) errors.push(`Invalid power for ${hero.name}`);
    if (!Number.isFinite(hero.level) || hero.level < 1 || hero.level > 20) errors.push(`Invalid level for ${hero.name}`);
    if (!RARITIES[hero.rarity]) errors.push(`Unknown rarity for ${hero.name}`);
    if (!PRIMALS[hero.primal]) errors.push(`Unknown primal for ${hero.name}`);
    if (!Number.isFinite(hero.age) || hero.age < 0) errors.push(`Invalid age for ${hero.name}`);
    if (hero.monthlyActivity && !['Training', 'Rest', 'Infirmary', 'Scouting', 'Public Exhibition', 'Guild Duty'].includes(hero.monthlyActivity))
      errors.push(`Unknown monthly activity for ${hero.name}`);
  };
  state.heroes.forEach((hero) => validateHero(hero, 'player hero'));
  (state.historicHeroes || []).forEach((hero) => validateHero(hero, 'historic player hero'));
  (state.rivals || []).forEach((rival) => {
    if (!rival.star || !Array.isArray(rival.members)) errors.push(`Rival guild roster missing: ${rival.name}`);
    [rival.star, ...(rival.members || [])].filter(Boolean).forEach((hero) => validateHero(hero, `rival hero in ${rival.name}`));
  });
  (state.freeAgents || []).forEach((hero) => validateHero(hero, 'free agent'));
  (state.worldHistoricHeroes || []).forEach((hero) => validateHero(hero, 'world historic hero'));
  if (!TIERS[state.guild?.tierIndex]) errors.push('Guild tier index is invalid.');
  const deployed = new Set();
  (state.activeMissions || []).forEach((mission) => {
    (mission.assignments || []).forEach((assignment) => {
      if (deployed.has(assignment.heroId)) errors.push(`Hero is deployed twice: ${assignment.heroId}`);
      deployed.add(assignment.heroId);
      const hero = state.heroes.find((item) => item.id === assignment.heroId);
      if (!hero) errors.push(`Mission references missing hero: ${assignment.heroId}`);
      else if (hero.status !== 'mission') errors.push(`Deployed hero has invalid status: ${hero.name}`);
    });
  });
  (state.tournaments || [])
    .filter((tournament) => tournament.status === 'active')
    .forEach((tournament) => {
      if (!tournament.playerHeroId) errors.push(`Active individual tournament has no player hero: ${tournament.id}`);
      const hero = state.heroes.find((item) => item.id === tournament.playerHeroId);
      if (!hero) errors.push(`Tournament references missing hero: ${tournament.playerHeroId}`);
      else if (hero.status !== 'tournament') errors.push(`Tournament hero has invalid status: ${hero.name}`);
      else if (deployed.has(hero.id)) errors.push(`Hero is deployed twice: ${hero.id}`);
      else deployed.add(hero.id);
    });
  (state.guildTournaments || [])
    .filter((tournament) => tournament.status === 'active')
    .forEach((tournament) => {
      (tournament.assignments || []).forEach((assignment) => {
        if (deployed.has(assignment.heroId)) errors.push(`Hero is deployed twice: ${assignment.heroId}`);
        deployed.add(assignment.heroId);
        const hero = state.heroes.find((item) => item.id === assignment.heroId);
        if (!hero) errors.push(`Guild tournament references missing hero: ${assignment.heroId}`);
        else if (hero.status !== 'tournament') errors.push(`Tournament hero has invalid status: ${hero.name}`);
      });
    });
  if (!state.titleRecords || Object.keys(state.titleRecords).length < 8) errors.push('Tournament title records are missing.');
  if (!state.council || typeof state.council.unread !== 'boolean') errors.push('Council planning state is missing.');
  if (!Array.isArray(state.missionHistory)) errors.push('Mission history is missing.');
  if (!Array.isArray(state.tournamentHistory)) errors.push('Tournament history is missing.');
  if (!state.guild?.formations || Object.keys(FORMATION_TYPES).some((type) => !Array.isArray(state.guild.formations[type])))
    errors.push('Saved formations are invalid.');
  Object.entries(state.guild?.appointments || {}).forEach(([appointmentId, heroId]) => {
    if (!APPOINTMENTS.some((item) => item.id === appointmentId)) errors.push(`Unknown appointment: ${appointmentId}`);
    const hero = state.heroes.find((item) => item.id === heroId);
    if (!hero || ['dead', 'retired'].includes(hero.status)) errors.push(`Appointment references inactive hero: ${appointmentId}`);
  });
  (state.pendingDecisions || []).forEach((decision) => {
    if (decision.missionId && !state.activeMissions.some((mission) => mission.id === decision.missionId))
      errors.push(`Decision references missing mission: ${decision.id}`);
  });
  return errors;
}

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

export {
  clone,
  hashString,
  makeRng,
  getWorldHeroes,
  getHero,
  getGuild,
  getHeroGuildName,
  heroCapacity,
  headquartersRoomCapacity,
  usedFacilityRooms,
  activeHeroCount,
  branchCapacity,
  operationalLocationIds,
  getGuildmaster,
  isGuildDefunct,
  getGuildStar,
  getCurrentLocation,
  partyCapacity,
  getReport,
} from './engine/core.js';
export { xpForNextLevel, calculatePower, generateHero, roleRating, partyEstimate } from './engine/heroes.js';
export { getGuildRankings, getGuildRankSummary, getHeroRankings } from './engine/rankings.js';
export { designateSuccessor, assignMentor, foundBranch, assignBranchCommander, upgradeBranch, assignArtifact, inheritAmbition } from './engine/institution.js';
export { getGoalMetric, getPromotionRequirement } from './engine/goals.js';
export { getPatronLoanOffer, takePatronLoan, getTravelQuote, startTravel, upgradeFacility } from './engine/economy.js';
