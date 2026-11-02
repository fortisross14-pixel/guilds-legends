# Guilds of Legend: notes for AI assistants

`CLAUDE.md` and `AGENTS.md` have the same content. If you change one, change the other too.

A browser guild-management RPG (React 18 + Vite 5, plain JS/JSX). The simulation engine is pure and deterministic. The UI is a thin layer on top of it. The game direction and current waves are in [`docs/GAME_VISION.md`](docs/GAME_VISION.md) (it replaces waves 2–6 of `docs/AUDIT_v1.9.md`).

## Ground rules

- **The engine (`src/game/*`) stays pure and deterministic.** Never use `Math.random` or `Date.now` in simulation logic (ESLint blocks `Math.random` there). All randomness goes through the seeded RNG: `const rng = rngFor(state, 'salt')` … `commitRng(state, rng)`. IDs come from `uid(prefix, rng)`.
- **Every rule change needs a seeded test** in `tests/engine.test.js`.
- New engine code goes in the right `src/game/engine/*.js` module, and new public functions are added to the `src/game/engine.js` barrel. Never import a later module from an earlier one (see the order in the file map).
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
- Before pushing: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
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
npm run typecheck   # tsc over the engine (JSDoc + // @ts-check)
npm run sim -- --seed 42 --years 20
npm run test:e2e    # Playwright smoke test (builds first)
npm run build       # production build to dist/ (not committed)
```

## File map

```text
src/App.jsx               Shell: save slots, the three-place nav, top bar, modals, the `actions` object (UI → engine)
src/places/               MapScreen (home), TownScreen (building tiles → building content), MenuScreen, routes.js
src/components/           UI primitives (UI.jsx) and modals (combat, mission game, council)
src/screens/              Building/page content rendered inside places (Hall, Missions, Heroes, …)
src/data/                 Static content: classes, missions, formations, world map, rival universe
src/game/engine.js        Public engine API: a re-export barrel. Import from here.
src/game/engine/          Engine implementation, layered bottom-up (each file imports only earlier ones):
  core.js                 clone, seeded RNG (rngFor/commitRng), uid, chronicle helpers, roster/guild queries
  heroes.js               hero generation, XP/levels, relationships, party role ratings and estimates
  candidates.js           recruitment market and recruitment promises
  universe.js             rival guilds, legends, title records, artifacts, contract board
  rankings.js             guild ladders and hero all-time rankings
  institution.js          succession, mentors, branches, artifacts, ambitions, retirement, release
  goals.js                goals, achievements, promotion, evaluateStateInPlace
  economy.js              upkeep, patron loans and debt, travel, facility upgrades
  tournaments.js          individual tournaments (ratings, fields, AI resolution, records)
  guildTournaments.js     guild championships, yearly creation, scheduled resolution
  tournamentEntry.js      player tournament entry and starting tournament combat
  missions.js             contract inspection, party selection, launch, encounter queueing
  outcomes.js             mission resolution: grades, injuries, rewards, reports, sagas
  encounters.js           active combat / mission-game actions and conclusion
  rivals.js               rival seasons, AI transfer market, rival institutions
  time.js                 monthly council resolution, aging, advanceMonths
  recruitment.js          roster actions: recruit, release, refound, training, appointments
  dashboard.js            UI read models (getNextAction, getDashboardSummary), small UI actions
  state.js                createNewGame and default state pieces
  save.js                 compactForSave, migrateGame, validateGame
  timeActions.js          travelTo + road events, continueJourney, restAtGuildHall, launchExpedition
  autoplay.js             simulateAutoplay (long tests, sim script)
src/game/types.js         JSDoc typedefs (GameState, Hero, Guild, Mission, Tournament, Rival)
src/game/combat.js        Deterministic duel and party combat
src/game/missionGames.js  Playable Diplomacy / Expedition / Intrigue challenges
src/game/legacy.js        Branch, ambition and artifact definitions
src/game/storage.js       IndexedDB save slots, export/import
src/styles/index.css      Imports the per-area CSS files (base/, layout/, components/, screens/) in cascade order
scripts/sim.mjs           npm run sim: yearly balance table
tests/e2e/smoke.spec.js   Playwright smoke test (npm run test:e2e)
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
