# Guilds of Legend: notes for AI assistants

`CLAUDE.md` and `AGENTS.md` have the same content. If you change one, change the other too.

A browser guild-management RPG (React 18 + Vite 5, plain JS/JSX). The simulation engine is pure and deterministic. The UI is a thin layer on top of it. The current plan is in `docs/AUDIT_v1.9.md`.

## Ground rules

- **The engine (`src/game/*`) stays pure and deterministic.** Never use `Math.random` or `Date.now` in simulation logic (ESLint blocks `Math.random` there). All randomness goes through the seeded RNG: `const rng = rngFor(state, 'salt')` … `commitRng(state, rng)`. IDs come from `uid(prefix, rng)`.
- **Every rule change needs a seeded test** in `tests/engine.test.js`.
- Engine functions never mutate their input. They `clone(state)`, change the copy, and return `{ state, error }` (a few simple setters return just the new state).
- Never delete or weaken an existing test to make it pass.
- Keep existing saves loadable. If the state shape changes, bump `SCHEMA_VERSION`, add defaults in `migrateGame`, and add a migration test.
- No gameplay or balance changes unless the task asks for them.
- Small, focused commits, one logical change each.
- If a spec or audit item looks wrong or unclear, write it down and skip it. Don't guess.

## The UI → engine pattern

```js
// In App.jsx (actions object)
launchMission: (id, formation, assignments) =>
  applyResult(launchMission(state, id, formation, assignments), 'The company has begun its mission.'),
```

The UI calls an engine function and gets `{ state, error }`. `applyResult` shows the error, or passes the new state to `commitState`. `commitState` runs `validateGame` and then `setState`, and autosave writes the slot about 0.7 s later. Screens receive `{ state, actions, navigate, slot }` and must not modify `state` directly.

## Testing policy

- **Work on `main`. Run the full suite only once, right before pushing.** Pushing to `main` deploys to GitHub Pages, and CI runs lint, the tests and the build.
- While working, run only the checks that cover your change:
  - Engine change: the matching tests, e.g. `node --test --test-name-pattern="patron" tests/engine.test.js`
  - UI-only change: `npm run build`
  - Pure code moves or refactors: `npm run test:fast`
- Before pushing: `npm run lint`, `npm run typecheck` (once it exists), `npm test`, `npm run build`.
- `npm run test:long` (20–100 year seeded simulations, ~20 s) is part of `npm test`. It is the proof that refactors did not change behavior.
- The Playwright smoke test (`npm run test:e2e`) is not part of `npm test` or CI. Run it at the end of larger UI work.
- If a check fails twice in a row, stop and report what is failing. Don't loop on retries.

## Commands

```bash
npm run dev         # local dev server
npm test            # full suite: tests/*.test.js
npm run test:fast   # tests/engine.test.js only
npm run test:long   # tests/long.test.js only
npm run lint        # ESLint
npm run format      # Prettier (JS/JSX)
npm run build       # production build to dist/ (not committed)
```

## File map

```text
src/App.jsx               Shell: save slots, nav, modals, the `actions` object (UI → engine)
src/components/           UI primitives (UI.jsx) and modals (combat, mission game, council)
src/screens/              One component per nav screen
src/data/                 Static content: classes, missions, formations, world map, rival universe
src/game/engine.js        Simulation entry point (all engine exports)
src/game/combat.js        Deterministic duel and party combat
src/game/missionGames.js  Playable Diplomacy / Expedition / Intrigue challenges
src/game/legacy.js        Branch, ambition and artifact definitions
src/game/storage.js       IndexedDB save slots, export/import
src/styles/index.css      Styles
tests/engine.test.js      Engine regression tests (fast)
tests/long.test.js        Long seeded simulations
docs/AUDIT_v1.9.md        Audit and improvement waves
```

## GameState shape (brief)

One plain JSON-serializable object, created by `createNewGame` and upgraded by `migrateGame`:

- `schemaVersion`, `seed`, `rngState`: save version and RNG state (advance the RNG only via `commitRng`)
- `date: { year, month }`: month 0–11; the campaign starts in 1187
- `guild`: the player guild: `name`, `crowns` (gold), `fame`, `legacy`, `tierIndex`/`tier` (Regional/National/Global), `rank`, `facilities`, `appointments`, `formations`, `branches`, `founderHeroId`, `currentGuildmasterHeroId`, `successorHeroId`, `loan`, `unpaidMonths`
- `heroes[]`: the player roster, including dead and retired heroes. `status` is one of `available`, `mission`, `tournament`, `injured`, `dead` or `retired`. Each hero has `level`/`xp`, `power`, `attributes`, `rarity`, `primal`, `classId`, `career`, `history`, `loyalty` and `salary`
- `historicHeroes[]`: archived player heroes (compacted)
- `candidates[]`: recruits on the market. Each has a `locationId`, a `signingFee` and an optional `demand`
- `rivals[]`: 30 AI guilds, each with a `star` and `members[]`. `freeAgents[]` and `worldHistoricHeroes[]` hold the rest of the world's heroes
- `missions[]` (contract board), `activeMissions[]` (deployed, with `assignments` and `remaining`)
- `activeEncounter` (combat in progress), `activeMissionGame` (non-combat challenge in progress), `pendingDecisions[]`, `pendingReports[]`: while any of these is set, time is paused
- `tournaments[]`, `guildTournaments[]`, `tournamentHistory[]`, `titleRecords`
- `world: { currentLocationId, visitedLocationIds, activeTravel }`
- `chronicle[]`, `missionHistory[]`, `artifacts[]`, `sagas[]`, `goals[]`, `achievements[]`, `stats`, `legacy`
- `tutorial`, `council` (last monthly report), `notifications[]`, `settings`, `flags`

`validateGame(state)` returns a list of invariant violations. It must return an empty list after every engine call.
