// Balance check: run an autonomous campaign and print one row per year.
// Usage: npm run sim -- --seed 42 --years 20
import { activeHeroCount, createNewGame, getGuildRankSummary, simulateAutoplay } from '../src/game/engine.js';

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] !== undefined ? Number(process.argv[index + 1]) : fallback;
}

const seed = arg('seed', 42);
const years = arg('years', 20);
let state = createNewGame({ seed });

const columns = ['year', 'gold', 'fame', 'legacy', 'tier', 'regional', 'national', 'global', 'heroes', 'deaths'];
const rows = [];
for (let year = 1; year <= years; year += 1) {
  state = simulateAutoplay(state, 12);
  const ranks = Object.fromEntries(getGuildRankSummary(state).map((item) => [item.scope, `#${item.rank}/${item.total}`]));
  rows.push([
    state.date.year,
    state.guild.crowns,
    state.guild.fame,
    state.guild.legacy,
    state.guild.tier,
    ranks.Regional,
    ranks.National,
    ranks.Global,
    activeHeroCount(state),
    state.stats.deaths,
  ]);
}

const widths = columns.map((column, index) => Math.max(column.length, ...rows.map((row) => String(row[index]).length)));
const line = (cells) => cells.map((cell, index) => String(cell).padStart(widths[index])).join('  ');
console.log(`Seed ${seed}, ${years} years`);
console.log(line(columns));
rows.forEach((row) => console.log(line(row)));
