// @ts-check
// New campaign creation and default state pieces.
import { ACHIEVEMENTS, CHAPTER_GOALS, CLASSES, FACILITIES, SAGA_DEFINITIONS, STARTING_HEROES } from '../../data/content.js';
import { emptyFormations } from '../../data/formations.js';
import { PRIMALS, PRIMAL_IDS } from '../../data/world.js';
import { SCHEMA_VERSION, addChronicle, addHeroHistory, commitRng, hashString, makeRng } from './core.js';
import { choosePrimal, createHeroFromBase } from './heroes.js';
import { refreshCandidatesForLocationInPlace } from './candidates.js';
import { createUniverseInPlace, refreshMissionsInPlace } from './universe.js';
import { evaluateStateInPlace } from './goals.js';
import { createTournamentsInPlace } from './guildTournaments.js';
import { refreshSideJobsInPlace } from './townLife.js';

export function facilityLevels() {
  return Object.fromEntries(
    FACILITIES.map((facility) => [
      facility.id,
      facility.id === 'great-hall' ? 1 : facility.id === 'training-yard' || facility.id === 'infirmary' || facility.id === 'archive' ? 1 : 0,
    ]),
  );
}

export function initialStats() {
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
    date: { year: 1187, month: 0, week: 0 },
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
      legacyPoints: 0,
      officialPoints: 0,
      statusTitle: 'Unknown',
      mainParty: [],
      facilities: facilityLevels(),
      appointments: {},
      formations: emptyFormations(),
      branches: [],
      policies: { retreat: 'Measured', treasure: 'Guild Share', publicity: 'Truthful' },
      obligations: [],
      rivalries: [],
    },
    world: {
      currentLocationId: 'dunmere',
      visitedLocationIds: ['dunmere'],
      activeTravel: null,
      roadEvents: [],
      knowledge: { locations: { dunmere: 'visited' }, events: {}, sources: {} },
      // Walkable scenes: the wild area the guild is in (null = in town), and
      // per-scene positions, discoveries, conversations and wild-area state.
      wildAreaId: null,
      exploration: { positions: {}, discovered: {}, talked: {}, npcs: {}, wild: {} },
    },
    pendingRoadEvent: null,
    inventory: { potion: 3, antidote: 1 },
    moments: [],
    officialLedger: [],
    reputation: { families: {}, regions: {} },
    rivalries: {},
    nemesisIds: [],
    challenge: null,
    wager: null,
    pendingEvent: null,
    news: [],
    newsUnread: 0,
    sideJobs: [],
    activeSideJobs: [],
    story: { step: 0, next: null, choice: null, rivalId: null, done: false, postedMissionId: null },
    defeatedBosses: [],
    rankHistory: [],
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
    settings: { autosave: true, reducedMotion: false, compactMode: false, difficulty: 'Standard', sound: true, volume: 0.6, joystick: false, battleSpeed: 1 },
    legacy: { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] },
    flags: {
      // The exploration layer owns visual movement; this tiny serializable record
      // only preserves consequential opening progress across a refresh.
      opening: { phase: 'house', choices: [] },
      oldRoadIntroduced: false,
      harvestMeleeIntroduced: false,
      // Flags set by dialogue choices (src/data/dialogue).
      dialogue: {},
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
    candidate.scoutLevel = 3;
    candidate.hook = `${candidate.hook} Will join the founding pair without a signing fee.`;
    state.candidates.push(candidate);
  }

  createUniverseInPlace(state, rng);
  refreshMissionsInPlace(state, rng, true);
  refreshCandidatesForLocationInPlace(state, rng, 'dunmere');
  createTournamentsInPlace(state, rng);
  refreshSideJobsInPlace(state, rng);
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
