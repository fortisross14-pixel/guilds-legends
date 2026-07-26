import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeWelcome,
  activeHeroCount,
  advanceMonths,
  compactForSave,
  createNewGame,
  getPromotionRequirement,
  headquartersRoomCapacity,
  inspectMission,
  launchMission,
  notePartySelection,
  recruitCandidate,
  resolveDecision,
  simulateAutoplay,
  upgradeFacility,
  usedFacilityRooms,
  validateGame,
} from '../src/game/engine.js';
import { MISSION_TEMPLATES } from '../src/data/content.js';
import { exportGame, importGame } from '../src/game/storage.js';

function tutorialMission(state) {
  return state.missions.find((mission) => mission.templateId === 'wolves-old-road');
}

function combatPair(state) {
  const heroes = state.heroes.filter((hero) => hero.status === 'available');
  return [
    { heroId: heroes[0].id, slotId: 'combat-commander', role: 'Commander' },
    { heroId: heroes[1].id, slotId: 'combat-fighter-1', role: 'Fighter' },
  ];
}

test('new campaign starts with the player alone and deterministic candidates', () => {
  const one = createNewGame({ seed: 1187, guildName: 'Lantern Test', founderName: 'Oscar', founderClass: 'Duelist' });
  const two = createNewGame({ seed: 1187, guildName: 'Lantern Test', founderName: 'Oscar', founderClass: 'Duelist' });
  assert.deepEqual(validateGame(one), []);
  assert.equal(one.heroes.length, 1);
  assert.equal(one.heroes[0].name, 'Oscar');
  assert.equal(one.heroes[0].classId, 'Duelist');
  assert.equal(one.candidates.length, 3);
  assert.deepEqual(one.candidates.map((c) => [c.name, c.classId]), two.candidates.map((c) => [c.name, c.classId]));
});

test('content breadth includes long-term missions', () => {
  assert.ok(MISSION_TEMPLATES.length >= 20);
  assert.ok(MISSION_TEMPLATES.some((mission) => mission.tier === 'World'));
  assert.ok(new Set(MISSION_TEMPLATES.map((mission) => mission.family)).size >= 8);
});

test('guided opening supports hiring a companion and completing a mission', () => {
  let state = createNewGame({ seed: 20260726 });
  state = acknowledgeWelcome(state);
  const recruit = recruitCandidate(state, state.candidates[0].id);
  assert.equal(recruit.error, null);
  state = recruit.state;
  assert.equal(activeHeroCount(state), 2);
  const opening = tutorialMission(state);
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
});

test('Local promotion thresholds remain intentional', () => {
  const requirement = getPromotionRequirement(createNewGame({ seed: 42 }));
  assert.equal(requirement.target.id, 'Regional');
  assert.equal(requirement.fame.target, 40);
  assert.equal(requirement.contracts.target, 8);
  assert.equal(requirement.rank.target, 5);
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
});

test('twenty-five years of autonomous simulation remains valid and creates history', () => {
  const state = simulateAutoplay(createNewGame({ seed: 987654 }), 25 * 12);
  assert.deepEqual(validateGame(state), []);
  assert.equal(state.date.year, 1212);
  assert.ok(state.chronicle.length >= 25);
  assert.ok(state.stats.missionsCompleted >= 10);
  assert.ok(Number.isFinite(state.guild.crowns));
});

test('a century save remains bounded', () => {
  const state = simulateAutoplay(createNewGame({ seed: 314159 }), 100 * 12);
  const compact = compactForSave(state, false);
  const bytes = Buffer.byteLength(JSON.stringify(compact), 'utf8');
  assert.deepEqual(validateGame(state), []);
  assert.ok(bytes < 3_000_000, `save was ${bytes} bytes`);
});
