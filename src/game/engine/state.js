// @ts-check
// New campaign creation and default state pieces.
import { CLASSES, SAGA_DEFINITIONS } from '../../data/content.js';
import { CHARTERS } from '../../data/charters.js';
import { PATRON_LIST } from '../../data/patrons.js';
import { emptyFormations } from '../../data/formations.js';
import { PRIMALS } from '../../data/world.js';
import { SCHEMA_VERSION, commitRng, hashString, makeRng } from './core.js';
import { createHeroFromBase } from './heroes.js';
import { refreshCandidatesForLocationInPlace } from './candidates.js';
import { createUniverseInPlace, refreshMissionsInPlace } from './universe.js';
import { seedVisitorsInPlace } from './people.js';
import { evaluateStateInPlace } from './goals.js';
import { createTournamentsInPlace } from './guildTournaments.js';
import { refreshSideJobsInPlace } from './townLife.js';
import { progressStoryInPlace, skipTutorialInPlace } from './story.js';

/**
 * Every campaign starts in the founder's house: one bed, the banner, a small chest,
 * and no lot (story mission 1 rents one; src/data/lots.js).
 */
export function startingHome() {
  return { houseBeds: 1, lots: {}, hqLotId: null, goldHistory: [], standing: { honor: 0, dread: 0, honorBand: 'neutral', dreadBand: 'none', log: [] } };
}

export function initialStats() {
  return {
    eventSerial: 1,
    missionsCompleted: 0,
    missionsWon: 0,
    goldEarned: 0,
    missionsLost: 0,
    combatWins: 0,
    tournamentBest: 99,
    tournamentsWon: 0,
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
    // Early summer: the Dunmere Harvest Melee is about five weeks away (Act I, mission 4).
    date: { year: 1187, month: 5, week: 0, day: 0 },
    guild: {
      id: 'player',
      // Named at the end of the prologue (the Broken Lantern is the old, destroyed guild).
      name: options.guildName || 'The New Banner',
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
      crowns: 720 + (CHARTERS[options.charter]?.start?.gold || 0),
      // The founding charter (src/data/charters.js) shapes the whole run.
      rank: 18,
      contractsCompleted: 0,
      wins: 0,
      losses: 0,
      deaths: 0,
      fallen: false,
      charter: CHARTERS[options.charter] ? options.charter : 'free',
      loan: null,
      unpaidMonths: 0,
      legacyPoints: 0,
      officialPoints: 0,
      statusTitle: 'Unknown',
      mainParty: [],
      ...startingHome(),
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
    // Patron standing (src/data/patrons.js); the charter may start you with a contact.
    patrons: Object.fromEntries(PATRON_LIST.map((patron) => [patron.id, { points: CHARTERS[options.charter]?.start?.patrons?.[patron.id] || 0, granted: {}, lastGift: null }])),
    // Run path scores, recorded monthly for the end of Chapter 1 (connections.js).
    paths: null,
    rivalries: {},
    nemesisIds: [],
    challenge: null,
    wager: null,
    pendingEvent: null,
    news: [],
    newsUnread: 0,
    sideJobs: [],
    activeSideJobs: [],
    // The Last Banner (src/data/story.js, engine story.js). The prologue plays first.
    story: { missions: {}, evidence: {}, codex: {}, choices: {}, scene: null, tutorial: 'active', prologue: 'house', chapter: 1, chapterDone: false },
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
    activeEncounter: null,
    missionHistory: [],
    tournamentHistory: [],
    pendingReports: [],
    chronicle: [],
    artifacts: [],
    worldArtifacts: [],
    titleRecords: {},
    universeStats: {},
    sagas: SAGA_DEFINITIONS.map((saga) => ({ ...saga, progress: 0, completed: false, discovered: saga.tier === 'Regional' })),
    tournaments: [],
    stats: initialStats(),
    notifications: [],
    settings: { autosave: true, reducedMotion: false, compactMode: false, difficulty: 'Standard', sound: true, volume: 0.6, joystick: false, battleSpeed: 1, gestures: 'drag', haptics: true, seenHints: {}, questMarker: true, showAssetIds: false },
    legacy: { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] },
    flags: {
      oldRoadIntroduced: false,
      harvestMeleeIntroduced: false,
      // Flags set by dialogue choices (src/data/dialogue).
      dialogue: {},
      firstMissionInspected: false,
      firstHeroInspected: false,
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
      origin: 'A nobody in Dunmere',
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

  createUniverseInPlace(state, rng);
  refreshMissionsInPlace(state, rng);
  refreshCandidatesForLocationInPlace(state, rng, 'dunmere');
  createTournamentsInPlace(state, rng);
  refreshSideJobsInPlace(state, rng);
  commitRng(state, rng);
  // Everyone standing in the towns' buildings (people.js).
  state.people = {};
  seedVisitorsInPlace(state);

  // "Skip tutorial": the guild is still founded on the banner screen (name, motto,
  // charter), then the tutorial's end state is applied (story.js completePrologue).
  // Scripts that pass a guild name (the sim) skip straight away.
  if (options.skipTutorial && options.guildName) {
    skipTutorialInPlace(state, options.guildName);
    progressStoryInPlace(state);
  } else if (options.skipTutorial) state.story.skipRequested = true;
  evaluateStateInPlace(state);
  return state;
}
