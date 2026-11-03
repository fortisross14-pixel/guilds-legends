# Guilds of Legend: notes for AI assistants

`CLAUDE.md` and `AGENTS.md` have the same content. If you change one, change the other too.

A browser guild-management RPG (React 18 + Vite 5, plain JS/JSX). The simulation engine is pure and deterministic. The UI is a thin layer on top of it. The game direction and current waves are in [`docs/GAME_VISION.md`](docs/GAME_VISION.md) (it replaces waves 2–6 of `docs/AUDIT_v1.9.md`).

## Ground rules

- **The engine (`src/game/*`) stays pure and deterministic.** Never use `Math.random` or `Date.now` in simulation logic (ESLint blocks `Math.random` there). All randomness goes through the seeded RNG: `const rng = rngFor(state, 'salt')` … `commitRng(state, rng)`. IDs come from `uid(prefix, rng)`.
- New engine code goes in the right `src/game/engine/*.js` module, and new public functions are added to the `src/game/engine.js` barrel. Never import a later module from an earlier one (see the order in the file map).
- Engine functions never mutate their input. They `clone(state)`, change the copy, and return `{ state, error }` (a few simple setters return just the new state).
- **Early prototype: no save compatibility.** Old saves may break; don't write migrations or bump `SCHEMA_VERSION` for compatibility. Starting a new campaign is fine.
- Gameplay changes follow the current wave in `docs/GAME_VISION.md`. No balance tuning yet; that happens after the final wave.
- Small, focused commits, one logical change each.
- If a spec or audit item looks wrong or unclear, write it down and skip it. Don't guess.

## The UI → engine pattern

```js
// In App.jsx (actions object)
launchMission: (id, formation, assignments) =>
  applyResult(launchMission(state, id, formation, assignments), 'The company has begun its mission.'),
```

The UI calls an engine function and gets `{ state, error }`. `applyResult` shows the error, or passes the new state to `commitState`. `commitState` runs `validateGame` and then `setState`, and autosave writes the slot about 0.7 s later. Screens receive `{ state, actions, navigate, slot }` and must not modify `state` directly.

## Testing policy (prototype mode, until all GAME_VISION waves are done)

- **Do NOT write new tests.** Do NOT run the full suite, long simulations, balance, performance, typecheck or e2e tests. Each wave will rework the previous one, so that effort is wasted now.
- After a change, only do a quick sanity check:
  - `npm run build` must succeed.
  - If you touched engine logic, run `npm run test:fast` once. If old tests break because of an intended design change, delete or update those tests. Don't work around the design to keep them passing.
- Then commit and push to `main`.
- Balance, performance, visual, save-compatibility and full regression testing happen once, after the final wave.
- If the same check fails twice in a row, stop and report what is failing. Don't loop on retries.

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
src/places/               MapScreen (home), TownScreen (buildings), GuildHallRooms, MenuScreen (Chronicle: settings, chronicle, codex, CalendarScreen, QuestLogScreen), routes.js
src/components/           UI primitives (UI.jsx), modals (combat, mission game, council, moments), PartyRail (party bar), HeroStatusScreen, heroStatus.js
src/screens/              Building/page content rendered inside places (Missions, Heroes, Rankings + RivalryScreens, …)
src/data/                 Static content: classes, missions, formations, world map + buildings, rival universe, skills, items, road events, events (town events, side jobs, festivals), enemies (rosters, bosses), story
src/game/engine.js        Public engine API: a re-export barrel. Import from here.
src/game/engine/          Engine implementation, layered bottom-up (each file imports only earlier ones):
  core.js                 clone, seeded RNG (rngFor/commitRng), uid, chronicle helpers, roster/guild queries
  reputation.js           family/region reputation, levels, perks, specialization title (pure helpers)
  heroes.js               hero generation, XP/levels (level-up moments), relationships, party role ratings and estimates
  inventory.js            guild inventory, gear, shops, loot, battle item settlement
  candidates.js           recruitment market and recruitment promises
  universe.js             rival guilds, legends, title records, artifacts, contract board
  rankings.js             Strength/Legacy/Official ladders, official points ledger, status titles, rank snapshots
  rivalry.js              rivalry scores, nemeses, rivals taking contracts, challenge matches (nemesis, duel, exhibition, wager)
  stories.js              Blackwood story arc, regional boss contracts, shared event-effect rules
  townLife.js             weekly town events and news, festivals, side jobs, friendly challenges and wagers
  institution.js          succession, mentors, branches, artifacts, ambitions, retirement, release
  contracts.js            hero contracts and renewals, candidate scouting ranges, rival approaches, offer terms
  goals.js                goals, achievements, promotion, evaluateStateInPlace
  economy.js              upkeep, patron loans and debt, travel, facility upgrades
  tournaments.js          individual tournaments (ratings, fields, AI resolution, records)
  guildTournaments.js     guild championships, yearly creation, scheduled resolution
  tournamentEntry.js      player tournament entry and starting tournament combat
  missions.js             contract inspection, party selection, launch, encounter queueing
  outcomes.js             mission resolution: grades, injuries, rewards, reports, sagas
  encounters.js           active combat / mission-game actions and conclusion
  rivals.js               rival seasons, AI transfer market, rival institutions
  time.js                 weekly loop (advanceWeeks/advanceMonths/advanceToDate), monthly council resolution, aging
  recruitment.js          roster actions: recruit, release, refound, training, appointments
  dashboard.js            UI read models (getNextAction, getDashboardSummary), small UI actions
  state.js                createNewGame and default state pieces
  save.js                 compactForSave, migrateGame, validateGame
  timeActions.js          travelTo + road events, continueJourney, launchExpedition
  autoplay.js             simulateAutoplay (long tests, sim script)
src/game/types.js         JSDoc typedefs (GameState, Hero, Guild, Mission, Tournament, Rival)
src/game/combat.js        Per-hero turn-based battles (commands, skills, items, tell, auto-battle)
src/game/missionGames.js  Playable Diplomacy / Expedition / Intrigue challenges
src/game/legacy.js        Branch, ambition and artifact definitions
src/game/storage.js       IndexedDB save slots, export/import
src/audio/sfx.js          Web Audio retro sound effects (playSound, configureSound, unlockAudio)
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
- `date: { year, month, week }`: month 0–11, week 0–3 (4 weeks per month); the campaign starts in 1187. Durations (travel, missions, injuries) are in weeks
- `guild`: the player guild: `name`, `crowns` (gold), `fame`, `legacy`, `tierIndex`/`tier` (Regional/National/Global), `rank`, `facilities`, `appointments`, `formations`, `branches`, `founderHeroId`, `currentGuildmasterHeroId`, `successorHeroId`, `loan`, `unpaidMonths`, `mainParty` (up to 4 hero ids)
- `heroes[]`: the player roster, including dead and retired heroes. `status` is one of `available`, `mission`, `tournament`, `injured`, `dead` or `retired`. Each hero has `level`/`xp`, `power`, `attributes`, `rarity`, `primal`, `classId`, `career`, `history`, `loyalty`, `salary`, `contract` ({ years, salary, startSerial, endSerial } in month serials; none for the founder) and an optional `poachApproach`
- `historicHeroes[]`: archived player heroes (compacted)
- `candidates[]`: recruits on the market. Each has a `locationId`, a `signingFee`, a `scoutLevel` (0–3, how precisely its stats are known) and an optional `demand`
- `rivals[]`: 30 AI guilds, each with a `star` and `members[]`. `freeAgents[]` and `worldHistoricHeroes[]` hold the rest of the world's heroes
- `missions[]` (contract board), `activeMissions[]` (deployed, with `assignments` and `remaining`)
- `activeEncounter` (combat in progress), `activeMissionGame` (non-combat challenge in progress), `pendingDecisions[]`, `pendingReports[]`: while any of these is set, time is paused
- `tournaments[]`, `guildTournaments[]`, `tournamentHistory[]`, `titleRecords`
- `world: { currentLocationId, visitedLocationIds, activeTravel }`
- `chronicle[]`, `missionHistory[]`, `artifacts[]`, `sagas[]`, `goals[]`, `achievements[]`, `stats`, `legacy`
- `inventory` (itemId → count), each hero's `gear` (weapon/armor/accessory item ids; `artifact:<id>` for a worn artifact)
- `moments[]`: reward screens queued for the UI (victory, levelUp, recruit); presentation only
- `world.roadEvents`, `pendingRoadEvent`: planned and current road events
- `reputation: { families: { Combat: pts, … }, regions: { Crownlands: pts, … } }`
- `rivalries: { [rivalId]: { score, boutsWon, boutsLost, contractsTaken, poachedFromUs, poachedFromThem, challengesWon, challengesLost, lastChallengeSeason } }`, `nemesisIds[]`, `challenge` (pending/accepted nemesis challenge or null)
- `officialLedger[]` entries can also come from contracts and challenges (`source`)
- `pendingEvent` (a town event, festival or story card waiting for a choice), `news[]` + `newsUnread`
- `sideJobs[]` (board), `activeSideJobs[]` (running; heroes have status `sidejob`), `wager`
- `story: { step, next, choice, rivalId, done, postedMissionId }`, `defeatedBosses[]`; story and boss contracts carry `story` / `bossId`
- `settings.sound`, `settings.volume`
- `tutorial`, `council` (last monthly report), `notifications[]`, `settings`, `flags`

`validateGame(state)` returns a list of invariant violations; the UI runs it after every action. Keep it in sync with state shape changes.
