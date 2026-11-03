import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeWelcome,
  autoResolveActiveCombat,
  autoResolveActiveMissionGame,
  assignArtifact,
  assignBranchCommander,
  assignMentor,
  beginHeroTournamentCombat,
  branchCapacity,
  concludeActiveCombat,
  activeHeroCount,
  advanceMonths,
  advanceWeeks,
  campaignWeekSerial,
  compactForSave,
  createNewGame,
  designateSuccessor,
  enterHeroTournament,
  buyItem,
  sellItem,
  equipItem,
  unequipItem,
  shopStock,
  useItemOnHero,
  acknowledgeMoment,
  assignArtifact as assignArtifactForGear,
  foundBranch,
  getGuildmaster,
  getGuildRankings,
  getGuildRankSummary,
  getGuildStar,
  getHero,
  getHeroRankings,
  getNextAction,
  getPatronLoanOffer,
  getPromotionRequirement,
  getTournamentAccess,
  getTravelQuote,
  headquartersRoomCapacity,
  inspectMission,
  isGuildDefunct,
  inheritAmbition,
  launchMission,
  migrateGame,
  notePartySelection,
  operationalLocationIds,
  partyEstimate,
  performActiveMissionGameAction,
  performActiveCombatAction,
  recruitCandidate,
  refoundGuild,
  releaseHero,
  renameFounderHero,
  renameGuild,
  resolveDecision,
  setHeroMonthlyActivity,
  simulateAutoplay,
  startTravel,
  travelTo,
  resolveRoadEvent,
  planRoadEvents,
  makeRng,
  takePatronLoan,
  upgradeFacility,
  upgradeBranch,
  usedFacilityRooms,
  validateGame,
  xpForNextLevel,
} from '../src/game/engine.js';
import { MISSION_TEMPLATES, TIERS } from '../src/data/content.js';
import { LOCATIONS, PRIMALS, RARITIES, locationBuildings, unlockedLocations } from '../src/data/world.js';
import { exportGame, importGame } from '../src/game/storage.js';
import { autoCommands, autoResolveEncounter, createPartyEncounter, performCombatRound } from '../src/game/combat.js';
import { skillsForLevel } from '../src/data/skills.js';
import { ITEMS } from '../src/data/items.js';
import {
  autoResolveMissionGame,
  createMissionGame,
  missionGameActionPreview,
  missionGradeFromMissionGame,
  performMissionGameAction,
} from '../src/game/missionGames.js';

function fightRound(state, tournamentId) {
  const begun = beginHeroTournamentCombat(state, tournamentId);
  if (begun.error) return begun;
  return concludeActiveCombat(autoResolveActiveCombat(begun.state).state);
}

function tutorialMission(state) {
  return state.missions.find((mission) => mission.templateId === 'wolves-old-road');
}

function combatPair(state) {
  const heroes = state.heroes.filter((hero) => hero.status === 'available');
  return [
    { heroId: heroes[0].id, slotId: 'combat-command', role: 'Commander' },
    { heroId: heroes[1].id, slotId: 'combat-fighter-1', role: 'Fighter' },
  ];
}

function hireFirstCompanion(state) {
  const result = recruitCandidate(state, state.candidates.find((candidate) => candidate.locationId === state.world.currentLocationId).id);
  assert.equal(result.error, null);
  return result.state;
}

test('new campaign starts Regional with a level-one player and the three Chapter 1 towns', () => {
  const one = createNewGame({ seed: 1187, guildName: 'Lantern Test', founderName: 'Oscar', founderClass: 'Duelist', founderPrimal: 'Water' });
  const two = createNewGame({ seed: 1187, guildName: 'Lantern Test', founderName: 'Oscar', founderClass: 'Duelist', founderPrimal: 'Water' });
  assert.deepEqual(validateGame(one), []);
  assert.equal(one.guild.tier, 'Regional');
  assert.equal(one.guild.tierIndex, 0);
  assert.equal(one.heroes.length, 1);
  assert.equal(one.heroes[0].name, 'Oscar');
  assert.equal(one.heroes[0].classId, 'Duelist');
  assert.equal(one.heroes[0].primal, 'Water');
  assert.equal(one.heroes[0].level, 1);
  assert.equal(one.heroes[0].xp, 0);
  assert.equal(unlockedLocations(one.guild.tierIndex).length, 3);
  assert.equal(one.candidates.length, 3);
  assert.deepEqual(
    one.candidates.map((candidate) => [candidate.name, candidate.level, candidate.rarity]),
    two.candidates.map((candidate) => [candidate.name, candidate.level, candidate.rarity]),
  );
});

test('opening candidates are deliberately primal-diverse instead of all mirroring Dunmere', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const state = createNewGame({ seed });
    const primals = state.candidates.slice(0, 3).map((candidate) => candidate.primal);
    assert.equal(primals.filter((primal) => primal === 'Fire').length <= 1, true, `seed ${seed} produced ${primals.join(', ')}`);
    assert.ok(new Set(primals).size >= 3, `seed ${seed} lacked diversity: ${primals.join(', ')}`);
  }
});

test('monthly council planning resolves multiple simultaneous hero activities', () => {
  let state = hireFirstCompanion(createNewGame({ seed: 9191 }));
  const [founder, companion] = state.heroes;
  state = setHeroMonthlyActivity(state, founder.id, 'Training');
  state = setHeroMonthlyActivity(state, companion.id, 'Public Exhibition');
  const fameBefore = state.guild.fame;
  const founderXpBefore = founder.career.xpEarned;
  const advanced = advanceMonths(state, 1);
  assert.equal(advanced.error, null);
  state = advanced.state;
  assert.equal(state.council.unread, true);
  assert.equal(state.council.lastReport.activities.length, 2);
  assert.ok(state.heroes.find((hero) => hero.id === founder.id).career.xpEarned > founderXpBefore);
  assert.ok(state.guild.fame > fameBefore);
  assert.ok(state.council.lastReport.activities.some((row) => row.activity === 'Training'));
  assert.ok(state.council.lastReport.activities.some((row) => row.activity === 'Public Exhibition'));
  assert.deepEqual(validateGame(state), []);
});

test('injured heroes can be sent to the infirmary and recover faster', () => {
  let state = createNewGame({ seed: 6161 });
  const founder = state.heroes[0];
  founder.status = 'injured';
  founder.injury = 'Test wound';
  founder.injuryWeeks = 12;
  founder.health = 45;
  founder.monthlyActivity = 'Infirmary';
  const advanced = advanceMonths(state, 1);
  state = advanced.state;
  const recovered = state.heroes[0];
  assert.ok(recovered.injuryWeeks <= 4, `injury weeks remained ${recovered.injuryWeeks}`);
  assert.ok(recovered.health > 45);
  assert.equal(state.council.lastReport.activities[0].activity, 'Infirmary');
});

test('guild and founder can be renamed without losing historical identity', () => {
  let state = createNewGame({ seed: 7171, guildName: 'Old Lantern', founderName: 'Rowan' });
  let result = renameGuild(state, 'Ashen Compass');
  assert.equal(result.error, null);
  state = result.state;
  result = renameFounderHero(state, 'Riven Vale');
  assert.equal(result.error, null);
  state = result.state;
  assert.equal(state.guild.name, 'Ashen Compass');
  assert.equal(state.guild.founder, 'Riven Vale');
  assert.equal(state.heroes.find((hero) => hero.id === state.guild.founderHeroId).name, 'Riven Vale');
  assert.ok(state.chronicle.some((entry) => entry.type === 'identity' && entry.title.includes('Ashen Compass')));
  assert.deepEqual(validateGame(state), []);
});

test('v1.4-style saves migrate into council planning without losing the campaign', () => {
  const old = structuredClone(createNewGame({ seed: 3333, guildName: 'Legacy Lantern' }));
  old.schemaVersion = 8;
  delete old.council;
  old.heroes.forEach((hero) => {
    delete hero.monthlyActivity;
  });
  const migrated = migrateGame(old);
  assert.equal(migrated.schemaVersion, 15);
  assert.equal(migrated.guild.name, 'Legacy Lantern');
  assert.equal(migrated.council.unread, false);
  assert.ok(migrated.heroes.every((hero) => hero.monthlyActivity));
  assert.deepEqual(validateGame(migrated), []);
});

test('the content supports three social scales, seven primals and long-term missions', () => {
  assert.deepEqual(
    TIERS.map((tier) => tier.id),
    ['Regional', 'National', 'Global'],
  );
  assert.equal(Object.keys(PRIMALS).length, 7);
  assert.equal(Object.keys(RARITIES).length, 5);
  assert.equal(LOCATIONS.filter((location) => location.tier === 'Regional').length, 4);
  assert.equal(LOCATIONS.filter((location) => ['Regional', 'National'].includes(location.tier)).length, 10);
  assert.ok(MISSION_TEMPLATES.length >= 20);
  assert.ok(MISSION_TEMPLATES.some((mission) => mission.tier === 'Global'));
  assert.ok(new Set(MISSION_TEMPLATES.map((mission) => mission.family)).size >= 8);
});

test('guided opening supports hiring a companion and completing a detailed mission', () => {
  let state = createNewGame({ seed: 20260726 });
  state = acknowledgeWelcome(state);
  state = hireFirstCompanion(state);
  assert.equal(activeHeroCount(state), 2);
  const opening = tutorialMission(state);
  assert.equal(opening.locationId, 'dunmere');
  state = inspectMission(state, opening.id);
  const party = combatPair(state);
  state = notePartySelection(state, opening.id, 'Combat', party);
  const launch = launchMission(state, opening.id, 'Combat', party);
  assert.equal(launch.error, null);
  state = launch.state;
  state = advanceMonths(state, 1).state;
  assert.ok(state.activeEncounter, 'combat mission should pause for a tactical encounter');
  assert.equal(state.activeEncounter.mode, 'party');
  state = autoResolveActiveCombat(state).state;
  assert.notEqual(state.activeEncounter.status, 'active');
  state = concludeActiveCombat(state).state;
  const decision = state.pendingDecisions[0];
  assert.ok(decision);
  assert.equal(decision.combatResolved, true);
  assert.ok(decision.combatSummary);
  const resolved = resolveDecision(state, decision.id, decision.options[0].id);
  assert.equal(resolved.error, null);
  assert.deepEqual(validateGame(resolved.state), []);
  assert.equal(resolved.state.stats.missionsCompleted, 1);
  assert.ok(resolved.state.pendingReports.length >= 1);
  const report = resolved.state.missionHistory[0];
  assert.ok(report.combat);
  assert.equal(report.locationName, 'Dunmere');
  assert.equal(report.team.length, 2);
  assert.ok(report.team.every((member) => member.level >= 1 && member.primal));
  assert.ok(report.heroEffects.every((effect) => effect.xpGain > 0));
});

test('primal combat matchups materially change mission estimates', () => {
  let state = hireFirstCompanion(createNewGame({ seed: 551 }));
  const mission = tutorialMission(state);
  mission.enemyPrimal = 'Fire';
  const party = combatPair(state);

  const advantaged = structuredClone(state);
  advantaged.heroes.forEach((hero) => {
    hero.primal = 'Water';
  });
  const disadvantaged = structuredClone(state);
  disadvantaged.heroes.forEach((hero) => {
    hero.primal = 'Plant';
  });

  const good = partyEstimate(advantaged, mission.id, 'Combat', party);
  const bad = partyEstimate(disadvantaged, mission.id, 'Combat', party);
  assert.ok(good.primalEdge > 0);
  assert.ok(bad.primalEdge < 0);
  assert.ok(good.chance >= bad.chance + 15, `${good.chance} should exceed ${bad.chance}`);
});

test('training creates slow visible level progress capped at twenty', () => {
  let state = createNewGame({ seed: 931 });
  const founderId = state.guild.founderHeroId;
  assert.equal(xpForNextLevel(1), 100);
  state = advanceMonths(state, 16).state;
  const founder = state.heroes.find((hero) => hero.id === founderId);
  assert.ok(founder.level >= 2, `founder remained level ${founder.level} with ${founder.xp} XP`);
  assert.ok(founder.level <= 20);
  assert.ok(founder.career.xpEarned > 0);
});

test('missions and recruitment are local; travel consumes time and opens a new market', () => {
  let state = createNewGame({ seed: 8080 });
  const remoteMission = state.missions.find((mission) => mission.locationId === 'greenhollow');
  assert.ok(remoteMission);
  const blocked = launchMission(state, remoteMission.id, 'Combat', []);
  assert.match(blocked.error, /travel (to|there)/i);

  const quote = getTravelQuote(state, 'greenhollow');
  assert.equal(quote.unlocked, true);
  assert.ok(quote.cost > 0);
  assert.ok(quote.weeks >= 1);
  const beforeGold = state.guild.crowns;
  const journey = startTravel(state, 'greenhollow');
  assert.equal(journey.error, null);
  state = journey.state;
  assert.equal(state.guild.crowns, beforeGold - quote.cost);
  assert.equal(state.world.activeTravel.toId, 'greenhollow');
  state = advanceWeeks(state, quote.weeks).state;
  assert.equal(state.world.currentLocationId, 'greenhollow');
  assert.equal(state.world.activeTravel, null);
  assert.ok(state.candidates.some((candidate) => candidate.locationId === 'greenhollow'));
  assert.ok(state.missions.some((mission) => mission.locationId === 'greenhollow'));
});

test('recruit cost and salary scale with level and rarity', () => {
  const state = createNewGame({ seed: 4444 });
  const candidates = [...state.candidates].sort((a, b) => a.level - b.level);
  assert.ok(candidates.every((candidate) => candidate.level >= 1 && candidate.level <= 20));
  assert.ok(candidates.every((candidate) => candidate.salary > 0));
  const low = candidates[0];
  const high = candidates[candidates.length - 1];
  if (high.level > low.level || high.rarity !== low.rarity) {
    assert.ok(high.salary >= low.salary);
  }
});

test('tournament licenses, hero level and physical location are separate requirements', () => {
  const state = createNewGame({ seed: 12345 });
  const founder = state.heroes[0];
  const regional = state.tournaments.find((tournament) => tournament.definitionId === 'dunmere-harvest-melee');
  const national = state.tournaments.find((tournament) => tournament.definitionId === 'tidecross-open');
  const regionalAccess = getTournamentAccess(state, regional, founder.id);
  const nationalAccess = getTournamentAccess(state, national, founder.id);
  assert.equal(regionalAccess.unlocked, true);
  assert.equal(regionalAccess.locationMet, true);
  assert.equal(nationalAccess.unlocked, false);
  assert.equal(nationalAccess.locationMet, false);
});

test('the opening universe contains rival rosters, free agents, historic champions and three guild ladders', () => {
  const state = createNewGame({ seed: 8181 });
  assert.equal(state.rivals.length, 30);
  assert.ok(state.rivals.every((guild) => guild.star && guild.members.length >= 3));
  const activeWorldHeroes = state.rivals.reduce((sum, guild) => sum + 1 + guild.members.length, 0);
  assert.ok(activeWorldHeroes >= 150, `only ${activeWorldHeroes} rival heroes`);
  assert.ok(state.freeAgents.length >= 20);
  assert.ok(state.worldHistoricHeroes.length >= 8);
  assert.equal(state.titleRecords['dunmere-harvest-melee'].recordWins, 4);
  assert.equal(state.titleRecords['sunspire-royal-arena'].recordWins, 6);
  const summary = getGuildRankSummary(state);
  assert.deepEqual(
    summary.map((row) => row.scope),
    ['Regional', 'National', 'Global'],
  );
  assert.deepEqual(
    summary.map((row) => row.total),
    [13, 23, 31],
  );
  assert.equal(getGuildRankings(state, 'Regional').filter((guild) => guild.player).length, 1);
  assert.ok(getHeroRankings(state).length >= activeWorldHeroes);
  assert.deepEqual(validateGame(state), []);
});

test('AI heroes resolve seasonal tournaments and dynamically update title history', () => {
  let state = createNewGame({ seed: 5005 });
  state = advanceMonths(state, 12).state;
  assert.ok(state.tournamentHistory.length >= 8, `only ${state.tournamentHistory.length} competitions resolved`);
  const individual = state.tournamentHistory.filter((record) => record.kind === 'individual-tournament');
  assert.ok(individual.length >= 6);
  assert.ok(individual.every((record) => record.championName && record.entrants.length >= 8));
  assert.ok(individual.some((record) => ['Rare', 'Epic', 'Legend'].includes(record.entrants.find((hero) => hero.heroId === record.championId)?.rarity)));
  assert.ok(Object.values(state.titleRecords).some((record) => record.winners.some((winner) => winner.year === 1187)));
  assert.ok(state.universeStats.boutsResolved > 40);
  assert.deepEqual(validateGame(state), []);
});

test('a player hero enters a live bracket, gains experience and receives a detailed report', () => {
  let state = createNewGame({ seed: 2222 });
  const hero = state.heroes[0];
  const tournament = state.tournaments.find((event) => event.definitionId === 'dunmere-harvest-melee');
  const entered = enterHeroTournament(state, tournament.id, hero.id);
  assert.equal(entered.error, null);
  state = entered.state;
  assert.equal(state.heroes[0].status, 'tournament');
  assert.equal(state.tournaments.find((event) => event.id === tournament.id).initialEntrants.length, 16);
  let report = null;
  for (let round = 0; round < 4 && state.tournaments.find((event) => event.id === tournament.id).status === 'active'; round += 1) {
    const result = fightRound(state, tournament.id);
    assert.equal(result.error, null);
    state = result.state;
    report = result.report || report;
  }
  assert.ok(report);
  assert.equal(report.kind, 'individual-tournament');
  assert.equal(report.playerResult.heroId, hero.id);
  assert.ok(report.bracket.length >= 8);
  assert.equal(state.heroes[0].status, 'available');
  assert.ok(state.heroes[0].career.tournamentBouts >= 1);
  assert.ok(state.pendingReports.some((item) => item.id === report.id));
  assert.deepEqual(validateGame(state), []);
});

test('famous champions are punished for an early exit in a modest local tournament', () => {
  let state = createNewGame({ seed: 1 });
  const hero = state.heroes[0];
  hero.renown = 500;
  hero.career.tournamentFame = 200;
  hero.level = 20;
  hero.power = 40;
  hero.form = 30;
  Object.keys(hero.attributes).forEach((key) => {
    hero.attributes[key] = 22;
  });
  state.guild.fame = 500;
  const tournament = state.tournaments.find((event) => event.definitionId === 'dunmere-harvest-melee');
  state = enterHeroTournament(state, tournament.id, hero.id).state;
  let report = null;
  while (state.tournaments.find((event) => event.id === tournament.id).status === 'active') {
    const result = fightRound(state, tournament.id);
    state = result.state;
    report = result.report || report;
  }
  assert.equal(report.playerResult.expectedFinish, 1);
  assert.ok(report.playerResult.finish > report.playerResult.expectedFinish, `finish was ${report.playerResult.finish}`);
  assert.ok(report.playerResult.fameDelta < 0);
});

test('turn-based duels expose readable intent and tactical actions before bracket resolution', () => {
  let state = createNewGame({ seed: 6060 });
  const hero = state.heroes[0];
  const tournament = state.tournaments.find((event) => event.definitionId === 'dunmere-harvest-melee');
  state = enterHeroTournament(state, tournament.id, hero.id).state;
  const begun = beginHeroTournamentCombat(state, tournament.id);
  assert.equal(begun.error, null);
  state = begun.state;
  assert.equal(state.activeEncounter.mode, 'duel');
  assert.equal(state.activeEncounter.status, 'active');
  assert.ok(state.activeEncounter.enemyIntent?.label);
  const beforeTurn = state.activeEncounter.turn;
  const hero0 = state.activeEncounter.party[0];
  const action = performActiveCombatAction(state, { [hero0.id]: { action: 'defend' } });
  assert.equal(action.error, null);
  state = action.state;
  assert.ok(state.activeEncounter.turn > beforeTurn || state.activeEncounter.status !== 'active');
  state = autoResolveActiveCombat(state).state;
  const concluded = concludeActiveCombat(state);
  assert.equal(concluded.error, null);
  state = concluded.state;
  const updated = state.tournaments.find((event) => event.id === tournament.id);
  assert.ok(updated.bracket.some((bout) => bout.playerBout && bout.combat));
  assert.deepEqual(validateGame(state), []);
});

test('tactical combat is deterministic for the same campaign state and actions', () => {
  let base = createNewGame({ seed: 7070 });
  const hero = base.heroes[0];
  const tournament = base.tournaments.find((event) => event.definitionId === 'dunmere-harvest-melee');
  base = enterHeroTournament(base, tournament.id, hero.id).state;
  const a0 = beginHeroTournamentCombat(base, tournament.id).state;
  const b0 = beginHeroTournamentCombat(base, tournament.id).state;
  const heroUnit = a0.activeEncounter.party[0].id;
  const sequence = [{ [heroUnit]: { action: 'defend' } }, {}, { [heroUnit]: { action: 'attack' } }, {}, {}, {}];
  let a = a0;
  let b = b0;
  for (const commands of sequence) {
    if (a.activeEncounter.status !== 'active' || b.activeEncounter.status !== 'active') break;
    a = performActiveCombatAction(a, commands).state;
    b = performActiveCombatAction(b, commands).state;
  }
  assert.deepEqual(a.activeEncounter, b.activeEncounter);
});

test('Regional promotion thresholds lead to National reach', () => {
  const requirement = getPromotionRequirement(createNewGame({ seed: 42 }));
  assert.equal(requirement.target.id, 'National');
  assert.equal(requirement.fame.target, 120);
  assert.equal(requirement.contracts.target, 10);
  assert.equal(requirement.rank.target, 8);
  assert.equal(requirement.time.target, 4);
});

test('headquarters enforces room limits while allowing upgrades', () => {
  let state = createNewGame({ seed: 77 });
  state.guild.crowns = 20000;
  assert.equal(headquartersRoomCapacity(state), 4);
  assert.equal(usedFacilityRooms(state), 4);
  const blocked = upgradeFacility(state, 'armory');
  assert.match(blocked.error, /no free room/i);
  const existing = upgradeFacility(state, 'training-yard');
  assert.equal(existing.error, null);
  assert.equal(usedFacilityRooms(existing.state), 4);
});

test('exported campaign backups import cleanly', () => {
  const original = simulateAutoplay(createNewGame({ seed: 9090 }), 36);
  const restored = importGame(exportGame(original));
  assert.deepEqual(validateGame(restored), []);
  assert.equal(restored.guild.name, original.guild.name);
  assert.equal(restored.world.currentLocationId, original.world.currentLocationId);
});

test('current saves preserve an active tactical encounter and tournament bracket across migration', () => {
  let state = createNewGame({ seed: 8833 });
  const tournament = state.tournaments.find((event) => event.definitionId === 'dunmere-harvest-melee');
  state = enterHeroTournament(state, tournament.id, state.heroes[0].id).state;
  state = beginHeroTournamentCombat(state, tournament.id).state;
  const beforeEncounter = structuredClone(state.activeEncounter);
  const beforeEntrants = [...state.tournaments.find((event) => event.id === tournament.id).activeEntrants];
  const beforeMissionIds = state.missions.map((mission) => mission.id);
  const migrated = migrateGame(compactForSave(state, false));
  assert.deepEqual(migrated.activeEncounter, beforeEncounter);
  assert.deepEqual(migrated.tournaments.find((event) => event.id === tournament.id).activeEntrants, beforeEntrants);
  assert.deepEqual(
    migrated.missions.map((mission) => mission.id),
    beforeMissionIds,
  );
  assert.equal(migrated.heroes[0].status, 'tournament');
  assert.deepEqual(validateGame(migrated), []);
});

test('Phase 3 mission games are deterministic and personality meaningfully changes action fit', () => {
  const hero = (id, personality) => ({
    id,
    name: id,
    classId: 'Bard',
    primal: 'Air',
    rarity: 'Rare',
    level: 7,
    power: 64,
    personality,
    flaw: 'Greed',
    dream: 'Save a kingdom',
    role: 'Negotiation Lead',
    attributes: { Might: 50, Finesse: 58, Mind: 70, Spirit: 68, Presence: 76, Endurance: 55 },
  });
  const mission = {
    id: 'diplomacy-qa',
    title: 'The Ash Accord',
    family: 'Political',
    formationType: 'Diplomacy',
    locationName: 'Dunmere',
    difficulty: 58,
    risk: 3,
    patronPrimal: 'Air',
    enemyPrimal: 'Fire',
  };
  const patientGame = createMissionGame({ mission, playerHeroes: [{ hero: hero('patient', 'Patient'), role: 'Negotiation Lead' }], seed: 9001 });
  const restlessGame = createMissionGame({ mission, playerHeroes: [{ hero: hero('restless', 'Restless'), role: 'Negotiation Lead' }], seed: 9001 });
  const patientPreview = missionGameActionPreview(patientGame, 'listen', 'patient');
  const restlessPreview = missionGameActionPreview(restlessGame, 'listen', 'restless');
  assert.ok(patientPreview.score > restlessPreview.score, `${patientPreview.score} should exceed ${restlessPreview.score}`);
  const a = autoResolveMissionGame(patientGame);
  const b = autoResolveMissionGame(createMissionGame({ mission, playerHeroes: [{ hero: hero('patient', 'Patient'), role: 'Negotiation Lead' }], seed: 9001 }));
  assert.notEqual(a.status, 'active');
  assert.deepEqual(a, b);
});

test('Expedition discoveries need verification for elite outcomes', () => {
  const base = {
    type: 'Expedition',
    status: 'won',
    requiresVerification: true,
    rewardModifier: 1,
    metrics: { progress: 110, evidence: 85, certainty: 10, supplies: 70, hazard: 12 },
  };
  assert.equal(missionGradeFromMissionGame(base), 'Partial');
  const verified = structuredClone(base);
  verified.metrics.certainty = 82;
  assert.ok(['Great Success', 'Legendary'].includes(missionGradeFromMissionGame(verified)));
});

test('Intrigue cannot simply extract before securing the objective', () => {
  const rogue = {
    id: 'rogue',
    name: 'Sable',
    classId: 'Rogue',
    primal: 'Psychic',
    rarity: 'Rare',
    level: 8,
    power: 68,
    personality: 'Cautious',
    flaw: 'Greed',
    dream: 'Expose a tyrant',
    role: 'Mastermind',
    attributes: { Might: 48, Finesse: 82, Mind: 76, Spirit: 55, Presence: 64, Endurance: 66 },
  };
  const mission = {
    id: 'intrigue-qa',
    title: 'The Sealed Ledger',
    family: 'Espionage',
    formationType: 'Intrigue',
    locationName: 'Dunmere',
    difficulty: 60,
    risk: 3,
    patronPrimal: 'Iron',
    enemyPrimal: 'Fire',
  };
  let game = createMissionGame({ mission, playerHeroes: [{ hero: rogue, role: 'Mastermind' }], seed: 7007 });
  const heatBefore = game.metrics.heat;
  game = performMissionGameAction(game, 'extract', rogue.id).game;
  assert.equal(game.status, 'active');
  assert.ok(game.metrics.heat > heatBefore);
  game = autoResolveMissionGame(game);
  assert.notEqual(game.status, 'active');
});

test('non-combat contracts pause for their playable mission game and preserve it in history', () => {
  let state = createNewGame({ seed: 17171 });
  state = hireFirstCompanion(state);
  state.guild.crowns = 5000;
  state.heroes.forEach((hero) => {
    hero.level = 10;
    hero.power = 78;
    Object.keys(hero.attributes).forEach((key) => {
      hero.attributes[key] = 78;
    });
  });
  const mission = tutorialMission(state);
  mission.family = 'Investigation';
  mission.approach = 'Expedition';
  const assignments = [
    { heroId: state.heroes[0].id, slotId: 'expedition-lead', role: 'Expedition Lead' },
    { heroId: state.heroes[1].id, slotId: 'expedition-searcher-1', role: 'Searcher' },
  ];
  const launched = launchMission(state, mission.id, 'Expedition', assignments);
  assert.equal(launched.error, null);
  state = advanceMonths(launched.state, 1).state;
  assert.equal(state.activeMissionGame?.type, 'Expedition');
  state = autoResolveActiveMissionGame(state).state;
  assert.equal(state.activeMissionGame, null);
  assert.equal(state.pendingDecisions.length, 1);
  const decision = state.pendingDecisions[0];
  state = resolveDecision(state, decision.id, decision.options[0].id).state;
  assert.ok(state.missionHistory[0].missionGame);
  assert.equal(state.missionHistory[0].formationType, 'Expedition');
  assert.ok(state.missionHistory[0].team.length >= 2);
  assert.ok(
    state.heroes.some((hero) => hero.relationships?.length),
    'shared success should begin relationship history',
  );
});

test('recruits can demand career promises or accept a more expensive unconditional contract', () => {
  let promised = createNewGame({ seed: 1 });
  promised = hireFirstCompanion(promised);
  promised.guild.crowns = 5000;
  const offered = promised.candidates.find((candidate) => candidate.demand);
  assert.ok(offered?.demand);
  const normalFee = offered.signingFee;
  const promiseResult = recruitCandidate(promised, offered.id, 'accept');
  assert.equal(promiseResult.error, null);
  const promisedHero = promiseResult.state.heroes.find((hero) => hero.id === offered.id);
  assert.ok(promisedHero.promises.some((promise) => promise.status === 'active'));
  assert.equal(promiseResult.state.guild.crowns, 5000 - normalFee);

  let bought = createNewGame({ seed: 1 });
  bought = hireFirstCompanion(bought);
  bought.guild.crowns = 5000;
  const buyCandidate =
    bought.candidates.find((candidate) => candidate.demand && candidate.name === offered.name) || bought.candidates.find((candidate) => candidate.demand);
  const buyCost = buyCandidate.signingFee + buyCandidate.buyoutFee;
  const buyResult = recruitCandidate(bought, buyCandidate.id, 'buyout');
  assert.equal(buyResult.error, null);
  const boughtHero = buyResult.state.heroes.find((hero) => hero.id === buyCandidate.id);
  assert.equal(boughtHero.promises.length, 0);
  assert.equal(buyResult.state.guild.crowns, 5000 - buyCost);
});

test('an ignored recruitment promise eventually damages loyalty and enters career history', () => {
  let state = createNewGame({ seed: 1 });
  state = hireFirstCompanion(state);
  state.guild.crowns = 5000;
  const candidate = state.candidates.find((item) => item.demand);
  state = recruitCandidate(state, candidate.id, 'accept').state;
  const heroId = candidate.id;
  const before = state.heroes.find((hero) => hero.id === heroId).loyalty;
  state = advanceMonths(state, 14).state;
  const hero = state.heroes.find((item) => item.id === heroId);
  assert.ok(hero.promises.some((promise) => promise.status === 'broken'));
  assert.ok(hero.loyalty <= before - 10, `${before} -> ${hero.loyalty}`);
  assert.ok(hero.history.some((entry) => /promise/i.test(`${entry.title} ${entry.text}`)));
});

test('matching field work fulfills an accepted recruitment promise immediately', () => {
  let state = createNewGame({ seed: 1 });
  state = hireFirstCompanion(state);
  state.guild.crowns = 5000;
  const candidate = state.candidates.find((item) => item.demand?.kind === 'formation' && item.demand.formationType === 'Expedition');
  assert.ok(candidate);
  state = recruitCandidate(state, candidate.id, 'accept').state;
  const promisedHero = state.heroes.find((hero) => hero.id === candidate.id);
  assert.equal(promisedHero.promises[0].status, 'active');
  const mission = tutorialMission(state);
  mission.family = 'Investigation';
  mission.approach = 'Expedition';
  const assignments = [
    { heroId: candidate.id, slotId: 'expedition-lead', role: 'Expedition Lead' },
    { heroId: state.guild.founderHeroId, slotId: 'expedition-searcher-1', role: 'Searcher' },
  ];
  const launched = launchMission(state, mission.id, 'Expedition', assignments);
  assert.equal(launched.error, null);
  const fulfilled = launched.state.heroes.find((hero) => hero.id === candidate.id).promises[0];
  assert.equal(fulfilled.status, 'fulfilled');
});

test('in-progress non-combat mission gameplay survives save migration exactly', () => {
  let state = createNewGame({ seed: 27272 });
  state = hireFirstCompanion(state);
  const mission = tutorialMission(state);
  mission.family = 'Political';
  mission.approach = 'Diplomacy';
  const assignments = [
    { heroId: state.heroes[0].id, slotId: 'diplomacy-lead', role: 'Negotiation Lead' },
    { heroId: state.heroes[1].id, slotId: 'diplomacy-strategist-1', role: 'Strategist' },
  ];
  state = launchMission(state, mission.id, 'Diplomacy', assignments).state;
  state = advanceMonths(state, 1).state;
  assert.equal(state.activeMissionGame?.type, 'Diplomacy');
  state = performActiveMissionGameAction(state, 'listen', state.heroes[0].id).state;
  const before = structuredClone(state.activeMissionGame);
  const migrated = migrateGame(compactForSave(state, false));
  assert.deepEqual(migrated.activeMissionGame, before);
  assert.deepEqual(validateGame(migrated), []);
});

test('National branches make a remote settlement operational while headquarters stays elsewhere', () => {
  let state = createNewGame({ seed: 18001 });
  state = hireFirstCompanion(state);
  state.guild.crowns = 12000;
  const secondCandidate = state.candidates[0];
  state = recruitCandidate(state, secondCandidate.id, 'buyout').state;
  state.guild.tierIndex = 1;
  state.guild.tier = 'National';
  state.world.visitedLocationIds = [...new Set([...state.world.visitedLocationIds, 'greenhollow'])];
  const commander = state.heroes[2];
  commander.level = 8;
  const founded = foundBranch(state, 'greenhollow', commander.id);
  assert.equal(founded.error, null);
  state = founded.state;
  assert.equal(branchCapacity(state), 1);
  assert.ok(operationalLocationIds(state).has('greenhollow'));
  assert.equal(state.world.currentLocationId, 'dunmere');
  const mission = state.missions.find((item) => item.locationId === 'greenhollow' && item.approach === 'Combat');
  assert.ok(mission);
  const fieldHeroes = state.heroes.filter((hero) => hero.id !== commander.id && hero.status === 'available');
  const assignments = [
    { heroId: fieldHeroes[0].id, slotId: 'combat-command', role: 'Commander' },
    { heroId: fieldHeroes[1].id, slotId: 'combat-fighter-1', role: 'Fighter' },
  ];
  const launch = launchMission(state, mission.id, 'Combat', assignments);
  assert.equal(launch.error, null);
  assert.ok(launch.state.activeMissions.some((item) => item.locationId === 'greenhollow'));
});

test('dormant branches can be restored beneath a new commander and upgraded', () => {
  let state = createNewGame({ seed: 18002 });
  state = hireFirstCompanion(state);
  state.guild.crowns = 15000;
  state = recruitCandidate(state, state.candidates[0].id, 'buyout').state;
  state.guild.tierIndex = 1;
  state.guild.tier = 'National';
  state.world.visitedLocationIds.push('greenhollow');
  state.heroes[1].level = 8;
  state.heroes[2].level = 8;
  state = foundBranch(state, 'greenhollow', state.heroes[1].id).state;
  const branchId = state.guild.branches[0].id;
  const newCommanderId = state.heroes[2].id;
  state = releaseHero(state, state.heroes[1].id).state;
  assert.equal(state.guild.branches[0].active, false);
  assert.equal(operationalLocationIds(state).has('greenhollow'), false);
  const reassigned = assignBranchCommander(state, branchId, newCommanderId);
  assert.equal(reassigned.error, null);
  state = reassigned.state;
  assert.equal(state.guild.branches[0].active, true);
  assert.equal(operationalLocationIds(state).has('greenhollow'), true);
  const levelBefore = state.guild.branches[0].level;
  const upgraded = upgradeBranch(state, branchId);
  assert.equal(upgraded.error, null);
  assert.equal(upgraded.state.guild.branches[0].level, levelBefore + 1);
});

test('a designated successor inherits the guildmaster mantle when the current era ends', () => {
  let state = createNewGame({ seed: 18003 });
  state = hireFirstCompanion(state);
  state.guild.tierIndex = 1;
  state.guild.tier = 'National';
  const successor = state.heroes[1];
  successor.age = 24;
  successor.loyalty = 75;
  const designated = designateSuccessor(state, successor.id);
  assert.equal(designated.error, null);
  state = designated.state;
  const founder = getGuildmaster(state);
  founder.status = 'retired';
  state = advanceMonths(state, 1).state;
  assert.equal(getGuildmaster(state).id, successor.id);
  assert.equal(state.stats.successions, 1);
  assert.ok(state.legacy.successionHistory.some((entry) => entry.toHeroId === successor.id));
});

test('formal mentorship accelerates apprentice training without granting free levels', () => {
  let base = createNewGame({ seed: 18004 });
  base = hireFirstCompanion(base);
  base.heroes[0].level = 10;
  base.heroes[0].age = 35;
  base.heroes[1].level = 2;
  base.heroes[1].age = 20;
  base.heroes.forEach((hero) => {
    hero.monthlyActivity = 'Training';
    hero.training = 'Fundamentals';
  });
  const plain = structuredClone(base);
  const mentoredResult = assignMentor(base, base.heroes[0].id, base.heroes[1].id);
  assert.equal(mentoredResult.error, null);
  const mentored = advanceMonths(mentoredResult.state, 1).state;
  const unmentored = advanceMonths(plain, 1).state;
  const mentoredXp = mentored.heroes.find((hero) => hero.id === base.heroes[1].id).career.xpEarned;
  const plainXp = unmentored.heroes.find((hero) => hero.id === base.heroes[1].id).career.xpEarned;
  assert.ok(mentoredXp > plainXp, `${mentoredXp} should exceed ${plainXp}`);
});

test('artifact custody has history and cannot farm prestige through repeated reassignment', () => {
  let state = createNewGame({ seed: 18005 });
  state.artifacts.push({
    id: 'qa-relic',
    name: 'QA Crown',
    discoveredYear: state.date.year,
    originMission: 'QA',
    ownerId: null,
    legend: 'A test relic.',
    prestige: 80,
    ownerHistory: [],
  });
  const heroId = state.heroes[0].id;
  state = assignArtifact(state, 'qa-relic', heroId).state;
  const first = state.heroes[0];
  const firstPrestige = first.career.artifactPrestige;
  const firstCount = first.career.artifacts;
  const firstBonus = first.artifactPowerBonus;
  state = assignArtifact(state, 'qa-relic', null).state;
  state = assignArtifact(state, 'qa-relic', heroId).state;
  const again = state.heroes[0];
  assert.equal(again.career.artifactPrestige, firstPrestige);
  assert.equal(again.career.artifacts, firstCount);
  assert.equal(again.artifactPowerBonus, firstBonus);
  assert.ok(state.artifacts[0].ownerHistory.length >= 3);
});

test('unfinished ambitions can be inherited and completed by a later generation', () => {
  let state = createNewGame({ seed: 18006 });
  state = hireFirstCompanion(state);
  const companion = state.heroes[1];
  companion.ambitions = [{ id: 'qa-will', templateId: 'qa-will', label: 'Prove the old oath', metric: 'level', target: 0, rewardLegacy: 20, status: 'active' }];
  state = releaseHero(state, companion.id).state;
  const record = state.legacy.inheritedAmbitions.find((item) => item.fromHeroId === companion.id && item.status === 'unclaimed');
  assert.ok(record);
  const inherited = inheritAmbition(state, record.id, state.guild.founderHeroId);
  assert.equal(inherited.error, null);
  state = advanceMonths(inherited.state, 1).state;
  const founder = state.heroes.find((hero) => hero.id === state.guild.founderHeroId);
  assert.ok(founder.ambitions.some((ambition) => ambition.inheritedFromHeroId === companion.id && ambition.status === 'completed'));
  assert.equal(state.stats.inheritedAmbitionsCompleted, 1);
});

test('rival institutions evolve through poaching or splinter guilds over long campaigns', () => {
  const state = simulateAutoplay(createNewGame({ seed: 2026 }), 60);
  assert.ok((state.stats.rivalPoaches || 0) + (state.stats.rivalSplits || 0) > 0);
  assert.ok(state.legacy.rivalInstitutionEvents.length > 0);
  assert.ok(state.rivals.length >= 30);
});

test('the guild star follows the current guildmaster, not the first roster entry', () => {
  let state = createNewGame({ seed: 18004 });
  state = hireFirstCompanion(state);
  assert.equal(getGuildStar(state).id, state.guild.founderHeroId);
  const companion = state.heroes[1];
  state.heroes[0].status = 'dead';
  state = advanceMonths(state, 1).state;
  assert.equal(getGuildmaster(state).id, companion.id);
  assert.equal(getGuildStar(state).id, companion.id);
});

test('released heroes join the free-agent pool with their career history intact', () => {
  let state = createNewGame({ seed: 18005 });
  state = hireFirstCompanion(state);
  const companion = state.heroes[1];
  const historyBefore = companion.history.length;
  const released = releaseHero(state, companion.id);
  assert.equal(released.error, null);
  state = released.state;
  assert.ok(!state.heroes.some((hero) => hero.id === companion.id), 'released hero should leave the player roster');
  const agent = state.freeAgents.find((hero) => hero.id === companion.id);
  assert.ok(agent, 'released hero should be a free agent');
  assert.equal(agent.status, 'free-agent');
  assert.equal(agent.guildId, null);
  assert.ok(agent.history.length > historyBefore);
  assert.ok(agent.history.some((entry) => entry.type === 'joined'));
  assert.equal(getHero(state, companion.id).id, companion.id);
  assert.deepEqual(validateGame(state), []);
  assert.deepEqual(validateGame(advanceMonths(state, 12).state), []);
});

test('a broke guild recovers through a patron loan without the autoplay emergency advance', () => {
  let state = createNewGame({ seed: 20260726 });
  state = acknowledgeWelcome(state);
  state = hireFirstCompanion(state);
  state.guild.crowns = -400;
  const opening = tutorialMission(state);
  const party = combatPair(state);
  assert.match(launchMission(state, opening.id, 'Combat', party).error, /crowns for supplies/);
  const offer = getPatronLoanOffer(state);
  assert.equal(offer.available, true);
  const loaned = takePatronLoan(state);
  assert.equal(loaned.error, null);
  state = loaned.state;
  assert.ok(state.guild.crowns > 0, 'the loan should clear the debt');
  assert.equal(state.guild.loan.remaining, offer.repayment);
  const launch = launchMission(state, opening.id, 'Combat', party);
  assert.equal(launch.error, null);
  state = advanceMonths(launch.state, 1).state;
  state = autoResolveActiveCombat(state).state;
  state = concludeActiveCombat(state).state;
  const decision = state.pendingDecisions[0];
  state = resolveDecision(state, decision.id, decision.options[0].id).state;
  assert.equal(state.stats.missionsCompleted, 1);
  assert.ok(state.guild.crowns > 0, `treasury should be positive, was ${state.guild.crowns}`);
  assert.equal(state.guild.unpaidMonths, 0);
  state = advanceMonths(state, 1).state;
  assert.ok(state.guild.loan.remaining < offer.repayment, 'installments should be paid down monthly');
  assert.deepEqual(validateGame(state), []);
});

test('patron loans are refused to a solvent guild', () => {
  const state = createNewGame({ seed: 18007 });
  assert.equal(getPatronLoanOffer(state).available, false);
  assert.ok(takePatronLoan(state).error);
});

test('unpaid wages cost loyalty each month and eventually drive heroes away', () => {
  let state = createNewGame({ seed: 18006 });
  state = hireFirstCompanion(state);
  const companionId = state.heroes[1].id;
  state.heroes[1].loyalty = 45;
  const founderLoyalty = state.heroes[0].loyalty;
  state.guild.crowns = -2000;
  state = advanceMonths(state, 1).state;
  assert.equal(state.guild.unpaidMonths, 1);
  assert.ok(state.heroes.find((hero) => hero.id === companionId).loyalty < 45);
  state = advanceMonths(state, 2).state;
  assert.equal(state.guild.unpaidMonths, 3);
  assert.ok(!state.heroes.some((hero) => hero.id === companionId), 'an unpaid low-loyalty hero should walk out');
  assert.ok(state.freeAgents.some((hero) => hero.id === companionId));
  assert.equal(getGuildmaster(state).loyalty, founderLoyalty, 'the unsalaried founder is not affected');
  assert.deepEqual(validateGame(state), []);
});

test('v12 saves migrate to v13 with an empty debt ledger', () => {
  const old = createNewGame({ seed: 18008 });
  old.schemaVersion = 12;
  delete old.guild.loan;
  delete old.guild.unpaidMonths;
  const migrated = migrateGame(old);
  assert.equal(migrated.guild.loan, null);
  assert.equal(migrated.guild.unpaidMonths, 0);
  assert.deepEqual(validateGame(migrated), []);
});

test('a guild with no active heroes is detected and can be refounded', () => {
  let state = createNewGame({ seed: 18009 });
  state = hireFirstCompanion(state);
  assert.equal(isGuildDefunct(state), false);
  assert.ok(refoundGuild(state, { founderName: 'Mara' }).error);
  state.heroes.forEach((hero) => {
    hero.status = 'dead';
  });
  state = advanceMonths(state, 1).state;
  assert.equal(isGuildDefunct(state), true);
  const next = getNextAction(state);
  assert.equal(next.kind, 'critical');
  assert.equal(next.action, 'refound');
  assert.ok(refoundGuild(state, { founderName: '  ' }).error);
  const refounded = refoundGuild(state, { founderName: 'Mara Quell', founderClass: 'Cleric', founderPrimal: 'Water' });
  assert.equal(refounded.error, null);
  state = refounded.state;
  assert.equal(isGuildDefunct(state), false);
  assert.equal(activeHeroCount(state), 2);
  const guildmaster = getGuildmaster(state);
  assert.equal(guildmaster.name, 'Mara Quell');
  assert.equal(guildmaster.classId, 'Cleric');
  assert.equal(guildmaster.level, 1);
  assert.equal(state.stats.refoundings, 1);
  assert.notEqual(getNextAction(state).action, 'refound');
  assert.deepEqual(validateGame(state), []);
  assert.deepEqual(validateGame(advanceMonths(state, 3).state), []);
});

function travelAll(state, destinationId) {
  let result = travelTo(state, destinationId);
  assert.equal(result.error, null);
  let next = result.state;
  const events = [];
  while (next.pendingRoadEvent) {
    events.push(next.pendingRoadEvent.type);
    const option = next.pendingRoadEvent.type === 'ambush' ? 'pay' : 'ignore';
    const choice = ['shortcut', 'delay'].includes(next.pendingRoadEvent.type) ? (next.pendingRoadEvent.type === 'delay' ? 'wait' : 'safe') : option;
    result = resolveRoadEvent(next, choice);
    assert.equal(result.error, null);
    next = result.state;
  }
  return { state: next, events };
}

test('travel moves the guild and advances time by the journey length', () => {
  let state = createNewGame({ seed: 30001 });
  state = hireFirstCompanion(state);
  const weeks = getTravelQuote(state, 'ironford').weeks;
  const before = campaignWeekSerial(state);
  const { state: arrived, events } = travelAll(state, 'ironford');
  const delays = events.filter((type) => type === 'delay').length;
  assert.equal(arrived.world.currentLocationId, 'ironford');
  assert.equal(arrived.world.activeTravel, null);
  assert.equal(campaignWeekSerial(arrived) - before, weeks + delays);
  assert.deepEqual(validateGame(arrived), []);
});

test('road events are seeded: the same journey yields the same events', () => {
  const run = () => travelAll(hireFirstCompanion(createNewGame({ seed: 30002 })), 'greenhollow');
  assert.deepEqual(run().events, run().events);
  const planned = (seed) => planRoadEvents(makeRng(seed), 3);
  assert.deepEqual(planned(7), planned(7));
  for (let seed = 1; seed < 60; seed += 1) {
    const events = planned(seed);
    assert.ok(events.length <= 2);
    assert.equal(new Set(events.map((event) => event.month)).size, events.length);
  }
});

test('advancing two months runs the monthly council resolution twice', () => {
  let state = hireFirstCompanion(createNewGame({ seed: 30003 }));
  const rested = advanceMonths(state, 2);
  assert.equal(rested.error, null);
  assert.equal(rested.state.date.month, state.date.month + 2);
  assert.equal(rested.state.council.lastReport.advancedMonths, 2);
  assert.ok(rested.state.council.lastReport.activities.length >= 2);
});

test('every location has a Guild Hall, a Tavern and a Notice Board; tournament hosts have an Arena', () => {
  const state = createNewGame({ seed: 30004 });
  LOCATIONS.forEach((location) => {
    const buildings = locationBuildings(location.id);
    ['guildHall', 'tavern', 'noticeBoard'].forEach((id) => assert.ok(buildings.includes(id), `${location.id} lacks ${id}`));
  });
  state.tournaments.forEach((tournament) =>
    assert.ok(locationBuildings(tournament.locationId).includes('arena'), `${tournament.locationId} hosts without an arena`),
  );
});

test('v13 saves migrate to v14 with road-event state', () => {
  const old = createNewGame({ seed: 30005 });
  old.schemaVersion = 13;
  delete old.pendingRoadEvent;
  delete old.world.roadEvents;
  const migrated = migrateGame(old);
  assert.equal(migrated.pendingRoadEvent, null);
  assert.deepEqual(migrated.world.roadEvents, []);
  assert.deepEqual(validateGame(migrated), []);
});

// ---------------------------------------------------------------- Wave 3: combat, skills, items

function testHero(id, classId, level, stat, extra = {}) {
  const attributes = Object.fromEntries(['Might', 'Finesse', 'Mind', 'Spirit', 'Presence', 'Endurance'].map((key) => [key, stat]));
  return { id, name: id, classId, primal: 'Iron', level, power: stat, attributes, gear: { weapon: null, armor: null, accessory: null }, ...extra };
}

function partyBattle({ seed = 11, heroes, power = 45, level = 2, count = 2, items = {} }) {
  return createPartyEncounter({
    id: `test-${seed}`,
    seed,
    sourceType: 'mission',
    sourceId: 'm',
    title: 'Test',
    roundName: 'Test',
    playerHeroes: heroes.map((hero) => ({ hero, role: 'Fighter' })),
    opponentName: 'Wolves',
    opponentPrimal: 'Animal',
    opponentPower: power,
    opponentLevel: level,
    enemyCount: count,
    items,
  });
}

test('battles are deterministic for the same seed and commands', () => {
  const make = () => partyBattle({ seed: 99, heroes: [testHero('a', 'Guardian', 3, 50), testHero('b', 'Mage', 3, 50)] });
  let x = make();
  let y = make();
  assert.deepEqual(x, y);
  for (let round = 0; round < 5 && x.status === 'active'; round += 1) {
    const commands = { 'party-a': { action: 'attack', targetId: x.enemies[0].id }, 'party-b': { action: 'skill', skillId: 'bolt', targetId: x.enemies[0].id } };
    x = performCombatRound(x, commands);
    y = performCombatRound(y, commands);
  }
  assert.deepEqual(x, y);
  assert.ok(x.party.every((unit) => Number.isFinite(unit.hp) && unit.hp <= unit.maxHp));
});

test('each hero and enemy has its own HP, MP and stats, and turn order follows speed', () => {
  const fast = testHero('fast', 'Rogue', 3, 50, { attributes: { Might: 50, Finesse: 95, Mind: 50, Spirit: 50, Presence: 50, Endurance: 50 } });
  const slow = testHero('slow', 'Guardian', 3, 50, { attributes: { Might: 50, Finesse: 20, Mind: 50, Spirit: 50, Presence: 50, Endurance: 50 } });
  const battle = partyBattle({ seed: 5, heroes: [slow, fast], power: 30, count: 1 });
  assert.equal(battle.party.length, 2);
  assert.ok(battle.party.every((unit) => unit.maxHp > 0 && unit.maxMp > 0 && unit.atk > 0 && unit.def >= 0 && unit.spd > 0));
  assert.ok(battle.enemies[0].sprite?.key?.startsWith('enemy_'));
  assert.ok(battle.enemyIntent?.telegraph, 'the strongest enemy shows a tell');
  const next = performCombatRound(battle, { 'party-fast': { action: 'attack' }, 'party-slow': { action: 'attack' } });
  const firstPartyAction = next.log.find((entry) => entry.turn === 1 && /attacks/.test(entry.text) && /^(fast|slow) /.test(entry.text));
  assert.match(firstPartyAction.text, /^fast /);
});

test('targeting: heals land on allies, attacks on enemies, taunt draws enemy attacks', () => {
  const cleric = testHero('c', 'Cleric', 9, 55);
  const guard = testHero('g', 'Guardian', 3, 55);
  let battle = partyBattle({ seed: 21, heroes: [guard, cleric], power: 40, count: 2 });
  battle.party[0].hp = 10;
  battle = performCombatRound(battle, {
    'party-c': { action: 'skill', skillId: 'cure', targetId: 'party-g' },
    'party-g': { action: 'skill', skillId: 'taunt' },
  });
  assert.ok(battle.party[0].hp > 10 || battle.party[0].ko === false, 'Cure healed the Guardian');
  assert.ok(battle.log.some((entry) => /uses Cure: g \+/.test(entry.text)));
  assert.ok(battle.party[0].status.taunt > 0, 'Taunt is active');
  if (battle.status === 'active') {
    const plans = Object.values(battle.enemyPlans).filter((plan) => plan.targetId);
    assert.ok(
      plans.every((plan) => plan.targetId === 'party-g'),
      'enemies target the taunting Guardian',
    );
  }
  // An attack aimed at an ally is ignored: attacks always resolve against an enemy.
  const fresh = partyBattle({ seed: 22, heroes: [testHero('d', 'Duelist', 3, 55)], power: 40, count: 1 });
  const after = performCombatRound(fresh, { 'party-d': { action: 'attack', targetId: 'party-d' } });
  assert.ok(after.enemies[0].hp < fresh.enemies[0].hp);
});

test('class skills unlock by level and level-ups announce new skills', () => {
  assert.deepEqual(
    skillsForLevel('Cleric', 1).map((skill) => skill.id),
    ['cure'],
  );
  assert.ok(skillsForLevel('Cleric', 9).some((skill) => skill.id === 'raise'));
  assert.ok(['Guardian', 'Duelist', 'Ranger', 'Rogue', 'Cleric', 'Mage', 'Scholar', 'Artificer'].every((classId) => skillsForLevel(classId, 20).length >= 4));
  let state = createNewGame({ seed: 40001, founderClass: 'Cleric' });
  const founder = state.heroes[0];
  const before = state.moments.length;
  state = structuredClone(state);
  state.heroes[0].xp = xpForNextLevel(1) + xpForNextLevel(2) - 1;
  state = advanceMonths(state, 1).state;
  const levelUp = state.moments.slice(before).find((moment) => moment.type === 'levelUp' && moment.heroId === founder.id);
  assert.ok(levelUp, 'a level-up moment is queued');
  assert.ok(levelUp.levelAfter >= 3);
  assert.ok(levelUp.newSkills.includes('Purify'));
  state = acknowledgeMoment(state);
  assert.equal(state.moments.length, Math.max(0, before));
});

test('items: potions heal, ethers restore MP, phoenix feathers revive, bombs hit every enemy', () => {
  let battle = partyBattle({
    seed: 31,
    heroes: [testHero('a', 'Guardian', 3, 50), testHero('b', 'Mage', 3, 50)],
    power: 30,
    count: 3,
    items: { potion: 1, ether: 1, 'phoenix-feather': 1, 'fire-bomb': 1 },
  });
  battle.party[0].hp = 5;
  battle.party[1].mp = 0;
  battle = performCombatRound(battle, {
    'party-a': { action: 'item', itemId: 'potion', targetId: 'party-a' },
    'party-b': { action: 'item', itemId: 'ether', targetId: 'party-b' },
  });
  assert.equal(battle.items.potion, 0);
  assert.ok(battle.log.some((entry) => /uses Potion: a \+\d+ HP/.test(entry.text)));
  assert.ok(battle.log.some((entry) => /uses Ether: b \+25 MP/.test(entry.text)));
  battle.party[1].ko = true;
  battle.party[1].hp = 0;
  battle = performCombatRound(battle, { 'party-a': { action: 'item', itemId: 'phoenix-feather', targetId: 'party-b' } });
  assert.ok(battle.log.some((entry) => /b revived/.test(entry.text)));
  assert.equal(battle.items['phoenix-feather'], 0);
  const thrower = testHero('t', 'Rogue', 5, 50, { attributes: { Might: 50, Finesse: 99, Mind: 50, Spirit: 50, Presence: 50, Endurance: 99 } });
  const fresh = partyBattle({ seed: 32, heroes: [thrower], power: 30, count: 3, items: { 'fire-bomb': 1 } });
  const bombed = performCombatRound(fresh, { 'party-t': { action: 'item', itemId: 'fire-bomb' } });
  const line = bombed.log.find((entry) => entry.text.includes('uses Fire Bomb'));
  assert.ok(line, 'the bomb was thrown');
  assert.equal(line.text.split('−').length - 1, 3, 'all three enemies were hit');
});

test('equipment adds stats, respects class restrictions, and artifacts are worn as accessories', () => {
  let state = createNewGame({ seed: 40002, founderClass: 'Guardian' });
  const id = state.heroes[0].id;
  state.inventory = { 'iron-sword': 1, 'oak-staff': 1, 'chain-mail': 1 };
  const bare = partyBattle({ seed: 1, heroes: [state.heroes[0]] }).party[0];
  assert.match(equipItem(state, id, 'oak-staff').error, /cannot use/);
  state = equipItem(state, id, 'iron-sword').state;
  state = equipItem(state, id, 'chain-mail').state;
  assert.equal(state.heroes[0].gear.weapon, 'iron-sword');
  assert.equal(state.inventory['iron-sword'], undefined);
  const geared = partyBattle({ seed: 1, heroes: [state.heroes[0]] }).party[0];
  assert.equal(geared.atk, bare.atk + ITEMS['iron-sword'].stats.atk);
  assert.equal(geared.def, bare.def + ITEMS['chain-mail'].stats.def);
  state = unequipItem(state, id, 'weapon').state;
  assert.equal(state.inventory['iron-sword'], 1);
  state.artifacts = [{ id: 'art-1', name: 'Old Crown', prestige: 50, ownerId: null, ownerHistory: [] }];
  state = assignArtifactForGear(state, 'art-1', id).state;
  assert.equal(state.heroes[0].gear.accessory, 'artifact:art-1');
  assert.ok(state.heroes[0].artifactStats.atk > 0);
  assert.deepEqual(validateGame(state), []);
});

test('shops sell by town tier, buy costs gold, selling returns half', () => {
  let state = createNewGame({ seed: 40003 });
  const stock = shopStock('dunmere');
  assert.ok(stock.includes('potion'));
  assert.ok(stock.every((id) => ITEMS[id].tier === 1));
  assert.deepEqual(shopStock('windmere'), [], 'villages have no shop');
  const gold = state.guild.crowns;
  state = buyItem(state, 'potion', 2).state;
  assert.equal(state.guild.crowns, gold - 40);
  assert.equal(state.inventory.potion, 5);
  state = sellItem(state, 'potion', 1).state;
  assert.equal(state.guild.crowns, gold - 30);
  assert.ok(buyItem(state, 'hi-potion').error, 'tier 2 items are not sold in a Regional town');
  state.heroes[0].health = 50;
  state = useItemOnHero(state, 'potion', state.heroes[0].id).state;
  assert.equal(state.heroes[0].health, 80);
});

test('combat missions drop loot and queue a victory moment', () => {
  let state = createNewGame({ seed: 20260726 });
  state = acknowledgeWelcome(state);
  state = hireFirstCompanion(state);
  const opening = tutorialMission(state);
  state = launchMission(state, opening.id, 'Combat', combatPair(state)).state;
  state = advanceMonths(state, 1).state;
  state = autoResolveActiveCombat(state).state;
  assert.equal(state.activeEncounter.result.playerWon, true, 'the opening fight is winnable on auto');
  state = concludeActiveCombat(state).state;
  const decision = state.pendingDecisions[0];
  state = resolveDecision(state, decision.id, decision.options[0].id).state;
  const record = state.missionHistory[0];
  assert.ok(Array.isArray(record.loot));
  assert.ok(state.moments.some((moment) => moment.type === 'victory'));
  assert.ok(
    state.moments.some((moment) => moment.type === 'recruit'),
    'hiring queued a recruit card',
  );
  assert.deepEqual(validateGame(state), []);
});

test('auto-battle wins easy fights and loses impossible ones', () => {
  const strong = [testHero('a', 'Guardian', 10, 75), testHero('b', 'Cleric', 10, 75)];
  const easy = autoResolveEncounter(partyBattle({ seed: 3, heroes: strong, power: 30, level: 1, count: 2 }));
  assert.equal(easy.result.playerWon, true);
  const weak = [testHero('a', 'Guardian', 1, 25), testHero('b', 'Cleric', 1, 25)];
  const impossible = autoResolveEncounter(partyBattle({ seed: 3, heroes: weak, power: 95, level: 20, count: 4 }));
  assert.equal(impossible.result.playerWon, false);
  assert.ok(Object.keys(autoCommands(partyBattle({ seed: 4, heroes: strong }))).length === 2);
});

test('v14 saves migrate to v15 with an inventory, gear slots and no stale battle', () => {
  const old = createNewGame({ seed: 40004 });
  old.schemaVersion = 14;
  delete old.inventory;
  delete old.moments;
  old.heroes.forEach((hero) => delete hero.gear);
  old.activeEncounter = { id: 'old', mode: 'duel', status: 'active', sourceType: 'hero-tournament', player: {}, enemy: {} };
  const migrated = migrateGame(old);
  assert.deepEqual(migrated.inventory, {});
  assert.deepEqual(migrated.moments, []);
  assert.deepEqual(migrated.heroes[0].gear, { weapon: null, armor: null, accessory: null });
  assert.equal(migrated.activeEncounter, null);
  assert.deepEqual(validateGame(migrated), []);
});
