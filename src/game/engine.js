import {
  ACHIEVEMENTS,
  APPOINTMENTS,
  CHAPTER_GOALS,
  CLASSES,
  normalizeClassId,
  FACILITIES,
  REGIONS,
  SAGA_DEFINITIONS,
  STARTING_HEROES,
  TIERS,
} from '../data/content.js';
import { FORMATION_TYPES, PARTY_ROLES, emptyFormations, formationForMission } from '../data/formations.js';
import { LOCATION_BY_ID, LOCATIONS, PRIMALS, PRIMAL_IDS, RARITIES } from '../data/world.js';
import { GUILD_BLUEPRINTS } from '../data/universe.js';
import { artifactEffectFromPrestige, defaultAmbitionForHero } from './legacy.js';
import {
  MAX_CHRONICLE,
  MAX_HERO_HISTORY,
  MAX_MISSION_HISTORY,
  MAX_TITLE_HISTORY,
  MAX_TOURNAMENT_HISTORY,
  MAX_WORLD_HERO_HISTORY,
  SCHEMA_VERSION,
  activeHeroCount,
  addChronicle,
  addHeroHistory,
  clamp,
  clone,
  commitRng,
  completeTutorialTargetInPlace,
  ensureTournamentCareer,
  finalize,
  getHero,
  hashString,
  makeRng,
  rngFor,
} from './engine/core.js';
import { choosePrimal, createHeroFromBase, roleRating } from './engine/heroes.js';
import { candidateDemandFor, refreshCandidatesForLocationInPlace } from './engine/candidates.js';
import { createTitleRecords, createUniverseInPlace, createWorldArtifactsInPlace, refreshMissionsInPlace } from './engine/universe.js';
import { evaluateStateInPlace } from './engine/goals.js';
import { createTournamentsInPlace } from './engine/guildTournaments.js';
import { launchMission } from './engine/missions.js';
import { resolveDecision } from './engine/outcomes.js';
import { autoResolveActiveCombat, autoResolveActiveMissionGame, concludeActiveCombat } from './engine/encounters.js';
import { advanceMonths } from './engine/time.js';
import { recruitCandidate } from './engine/recruitment.js';

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
export { getTournamentAccess } from './engine/tournaments.js';
export { enterHeroTournament, beginHeroTournamentCombat, beginGuildTournamentCombat, enterGuildTournament, enterTournament } from './engine/tournamentEntry.js';
export { inspectMission, notePartySelection, saveFormation, launchMission } from './engine/missions.js';
export { resolveDecision, acknowledgeReport } from './engine/outcomes.js';
export {
  performActiveMissionGameAction,
  autoResolveActiveMissionGame,
  performActiveCombatAction,
  autoResolveActiveCombat,
  concludeActiveCombat,
  fightHeroTournamentRound,
  fightGuildTournamentRound,
  fightTournamentRound,
} from './engine/encounters.js';
export { advanceMonths, advanceToNextEvent } from './engine/time.js';
export {
  recruitCandidate,
  releaseHero,
  refoundGuild,
  setHeroTraining,
  setHeroMonthlyActivity,
  renameGuild,
  renameFounderHero,
  appointHero,
  chooseAlignment,
  inspectHero,
} from './engine/recruitment.js';
export {
  acknowledgeWelcome,
  acknowledgeCouncilReport,
  inspectGoals,
  dismissNotification,
  clearNotifications,
  updateSettings,
  getNextAction,
  getDashboardSummary,
} from './engine/dashboard.js';
