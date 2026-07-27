import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeWelcome,
  activeHeroCount,
  advanceMonths,
  compactForSave,
  createNewGame,
  getPromotionRequirement,
  getTournamentAccess,
  getTravelQuote,
  headquartersRoomCapacity,
  inspectMission,
  launchMission,
  notePartySelection,
  partyEstimate,
  recruitCandidate,
  resolveDecision,
  simulateAutoplay,
  startTravel,
  upgradeFacility,
  usedFacilityRooms,
  validateGame,
  xpForNextLevel,
} from '../src/game/engine.js';
import { MISSION_TEMPLATES, TIERS } from '../src/data/content.js';
import { LOCATIONS, PRIMALS, RARITIES, unlockedLocations } from '../src/data/world.js';
import { exportGame, importGame } from '../src/game/storage.js';

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

test('new campaign starts Regional with a level-one player and four reachable settlements', () => {
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
  assert.equal(unlockedLocations(one.guild.tierIndex).length, 4);
  assert.equal(one.candidates.length, 3);
  assert.deepEqual(one.candidates.map((candidate) => [candidate.name, candidate.level, candidate.rarity]), two.candidates.map((candidate) => [candidate.name, candidate.level, candidate.rarity]));
});

test('the content supports three social scales, seven primals and long-term missions', () => {
  assert.deepEqual(TIERS.map((tier) => tier.id), ['Regional', 'National', 'Global']);
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
  const decision = state.pendingDecisions[0];
  assert.ok(decision);
  const resolved = resolveDecision(state, decision.id, decision.options[0].id);
  assert.equal(resolved.error, null);
  assert.deepEqual(validateGame(resolved.state), []);
  assert.equal(resolved.state.stats.missionsCompleted, 1);
  assert.ok(resolved.state.pendingReports.length >= 1);
  const report = resolved.state.missionHistory[0];
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
  advantaged.heroes.forEach((hero) => { hero.primal = 'Water'; });
  const disadvantaged = structuredClone(state);
  disadvantaged.heroes.forEach((hero) => { hero.primal = 'Plant'; });

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
  assert.ok(quote.months >= 1);
  const beforeGold = state.guild.crowns;
  const journey = startTravel(state, 'greenhollow');
  assert.equal(journey.error, null);
  state = journey.state;
  assert.equal(state.guild.crowns, beforeGold - quote.cost);
  assert.equal(state.world.activeTravel.toId, 'greenhollow');
  state = advanceMonths(state, quote.months).state;
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

test('tournament licenses and physical location are separate requirements', () => {
  const state = createNewGame({ seed: 12345 });
  const local = state.tournaments.find((tournament) => tournament.division === 'Local');
  const professional = state.tournaments.find((tournament) => tournament.division === 'Professional');
  const localAccess = getTournamentAccess(state, local);
  const proAccess = getTournamentAccess(state, professional);
  assert.equal(localAccess.unlocked, true);
  assert.equal(localAccess.locationMet, true);
  assert.equal(proAccess.unlocked, false);
  assert.equal(proAccess.locationMet, false);
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

test('twenty-five years of autonomous simulation remains valid and creates history', () => {
  const state = simulateAutoplay(createNewGame({ seed: 987654 }), 25 * 12);
  assert.deepEqual(validateGame(state), []);
  assert.equal(state.date.year, 1212);
  assert.ok(state.chronicle.length >= 25);
  assert.ok(state.stats.missionsCompleted >= 10);
  assert.ok(Math.max(...state.heroes.map((hero) => hero.level || 1), ...state.historicHeroes.map((hero) => hero.level || 1)) >= 3);
  assert.ok(Number.isFinite(state.guild.crowns));
});

test('a century save remains bounded', () => {
  const state = simulateAutoplay(createNewGame({ seed: 314159 }), 100 * 12);
  const compact = compactForSave(state, false);
  const bytes = Buffer.byteLength(JSON.stringify(compact), 'utf8');
  assert.deepEqual(validateGame(state), []);
  assert.ok(bytes < 3_000_000, `save was ${bytes} bytes`);
});
