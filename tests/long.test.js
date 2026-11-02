import test from 'node:test';
import assert from 'node:assert/strict';
import { compactForSave, createNewGame, getHero, simulateAutoplay, validateGame } from '../src/game/engine.js';

// Long-horizon seeded simulations. Slow (~20s); run with `npm run test:long`.

test('campaign seeds are deterministic across repeated long simulations', () => {
  const a = simulateAutoplay(createNewGame({ seed: 424242 }), 60);
  const b = simulateAutoplay(createNewGame({ seed: 424242 }), 60);
  assert.equal(a.stats.missionsCompleted, b.stats.missionsCompleted);
  assert.equal(a.guild.crowns, b.guild.crowns);
  assert.equal(a.guild.fame, b.guild.fame);
  assert.deepEqual(a.titleRecords, b.titleRecords);
});

test('long-run tournament balance favors elite rarity but preserves rare upsets and bounded dynasties', () => {
  const state = simulateAutoplay(createNewGame({ seed: 20260727 }), 20 * 12);
  const individual = state.tournamentHistory.filter((record) => record.kind === 'individual-tournament');
  const rarityCounts = individual.reduce((counts, record) => {
    const champion = getHero(state, record.championId);
    const rarity = champion?.rarity || record.entrants.find((hero) => hero.heroId === record.championId)?.rarity || 'Archived';
    counts[rarity] = (counts[rarity] || 0) + 1;
    return counts;
  }, {});
  const eliteWins = (rarityCounts.Legend || 0) + (rarityCounts.Epic || 0);
  assert.ok(eliteWins / individual.length >= 0.7, `elite win share was ${eliteWins}/${individual.length}`);
  assert.ok((rarityCounts.Rare || 0) >= 1, 'Rare heroes never produced an upset champion');
  assert.ok(Math.max(...Object.values(state.titleRecords).filter((record) => record.kind === 'individual').map((record) => record.recordWins)) <= 8);
  assert.deepEqual(validateGame(state), []);
});

test('twenty-five years of autonomous simulation remains valid and creates history', () => {
  const state = simulateAutoplay(createNewGame({ seed: 987654 }), 25 * 12);
  assert.deepEqual(validateGame(state), []);
  assert.equal(state.date.year, 1212);
  assert.ok(state.chronicle.length >= 25);
  assert.ok(state.stats.missionsCompleted >= 10, `missionsCompleted=${state.stats.missionsCompleted}`);
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
