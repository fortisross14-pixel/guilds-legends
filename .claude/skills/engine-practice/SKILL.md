---
name: engine-practice
description: Code practice for Guilds of Legend. Load before changing game logic or data (src/game, src/data) or wiring a UI action to the engine. Covers purity and the seeded RNG, the layered engine modules, the { state, error } pattern, data-driven content, the no-monsters rule, commits and checks.
---

# Guilds of Legend: engine and code practice

CLAUDE.md is the source of truth; this is the checklist.

## The engine (`src/game/engine/*`)

- **Pure and deterministic.** No `Math.random`, no `Date.now`. Randomness:
  `const rng = rngFor(state, 'salt')` … `commitRng(state, rng)`; ids from `uid(prefix, rng)`.
- **Never mutate the input.** `clone(state)`, change the copy, return `{ state, error }`.
  Helpers ending in `InPlace` mutate a state you already cloned.
- **Layers.** A module imports only earlier ones (order in CLAUDE.md's file map). New public
  functions go in the `src/game/engine.js` barrel.
- **Data, not code.** Content (enemies, places, people, rooms, dialogue) lives in `src/data`;
  the engine reads it. Data files never import the engine.
- **Time is counted by the day.** Recovery and injuries run in `time.js` (recoverDailyInPlace);
  weekly and monthly systems run on rollover. Keep UI wording in days for short waits.
- **No save migrations** (early prototype). Don't bump `SCHEMA_VERSION` for compatibility.
- Keep `validateGame` (save.js) in sync with state shape changes.

## Content rules

- **No monsters.** Every enemy is a person (bandits, zealots, elemental adepts, the Veil's dead),
  drawn with HeroEditor parts (`scripts/art/foes.py`). Bounties and outlaws, not beasts.
- Story, places and people follow `docs/STORY.md`, `docs/GAME_VISION.md`, `docs/DIALOGUE.md`.
- If a spec looks wrong or unclear, write it down and skip it; don't guess.

## UI ↔ engine

- Screens get `{ state, actions, navigate, slot }` and never modify `state`.
- An action calls an engine function and passes its `{ state, error }` to `applyResult`.

## Commits and checks

- Small, focused commits, one logical change each; the message says what changed for the player.
- Before pushing: `npm run build` and `npm run lint` (0 errors). The GitHub "Build" workflow and
  the Vercel deploy must pass. Don't write or run tests until Phase 8 (CLAUDE.md).
- If the build or deploy fails twice in a row, stop and report.
