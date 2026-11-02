// @ts-check
// Save compaction, migration between schema versions, and validation.
import { APPOINTMENTS, CHAPTER_GOALS, CLASSES, normalizeClassId, REGIONS, SAGA_DEFINITIONS, TIERS } from '../../data/content.js';
import { FORMATION_TYPES, PARTY_ROLES, emptyFormations, formationForMission } from '../../data/formations.js';
import { LOCATION_BY_ID, LOCATIONS, PRIMALS, PRIMAL_IDS, RARITIES } from '../../data/world.js';
import { GUILD_BLUEPRINTS } from '../../data/universe.js';
import { artifactEffectFromPrestige, defaultAmbitionForHero } from '../legacy.js';
import {
  MAX_CHRONICLE,
  MAX_HERO_HISTORY,
  MAX_MISSION_HISTORY,
  MAX_TITLE_HISTORY,
  MAX_TOURNAMENT_HISTORY,
  MAX_WORLD_HERO_HISTORY,
  SCHEMA_VERSION,
  clamp,
  clone,
  commitRng,
  ensureTournamentCareer,
  finalize,
  getHero,
  hashString,
  rngFor,
} from './core.js';
import { candidateDemandFor, refreshCandidatesForLocationInPlace } from './candidates.js';
import { createTitleRecords, createUniverseInPlace, createWorldArtifactsInPlace, refreshMissionsInPlace } from './universe.js';
import { evaluateStateInPlace } from './goals.js';
import { createTournamentsInPlace } from './guildTournaments.js';
import { facilityLevels, initialStats } from './state.js';
import { createMissionCombatEncounterInPlace } from './missions.js';

export function compactForSave(state, aggressive = false) {
  const saved = clone(state);
  saved.notifications = saved.notifications.slice(-6);
  saved.moments = (saved.moments || []).slice(-6);
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
  next.world.roadEvents ||= [];
  next.pendingRoadEvent ??= null;
  next.inventory ||= {};
  next.moments ||= [];
  next.officialLedger ||= [];
  next.rankHistory ||= [];
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
    hero.gear ||= { weapon: null, armor: null, accessory: null };
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
  // v15 replaced the shared-HP combat model. An in-progress old battle is
  // rebuilt for missions; a tournament bout is simply started again.
  if (next.activeEncounter && !Array.isArray(next.activeEncounter.party)) {
    const old = next.activeEncounter;
    next.activeEncounter = null;
    const mission = old.sourceType === 'mission' ? next.activeMissions.find((item) => item.id === old.sourceId) : null;
    if (mission) createMissionCombatEncounterInPlace(next, mission);
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
