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

## Testing policy (prototype mode, until Phase 8 of docs/PROJECT_PLAN.md)

The game is an early prototype and changes completely between phases. Tests written now get thrown away.

- **The only checks:**
  1. `npm run build` succeeds.
  2. After pushing to `main`, the "Deploy to GitHub Pages" workflow run succeeds.
- **Do NOT** write tests, run test suites (including `test:fast`), simulations, balance or performance checks, Playwright, browser or device playthroughs, or take screenshots. This includes "quick" phone or touch runs.
- If old tests or lint rules break because of an intended change, leave the tests alone; they get rebuilt in Phase 8. Fix lint only if it blocks the build or deploy.
- If the build or deploy fails twice in a row, stop and report what is failing. Don't loop on retries.

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
src/places/               MapScreen (world map, wild-area cards), TownScreen (the walkable town or wild scene, building interiors, Town directory fallback), GuildHallRooms, MenuScreen (Chronicle: settings, chronicle, mission log, season reviews, codex, CalendarScreen, QuestLogScreen), routes.js
src/components/           UI primitives and scene backdrop (UI.jsx), pixel icons (PixelIcon.jsx), modals (combat, mission game, council, moments), PartyRail (party bar), HeroStatusScreen, heroStatus.js
src/screens/              Building/page content rendered inside places (Missions, Heroes, Rankings + RivalryScreens, HistoryScreens, …)
src/data/                 Static content: classes, missions, formations, world map + buildings, rival universe, skills, items, road events, events (town events, side jobs, festivals), enemies (rosters, bosses), story
  towns/, wilds/          Walkable town and wild-area layouts (tile rows, buildings, props, NPCs, enemy groups, gathering spots, camp)
  dialogue/               Data-driven conversations (variants with conditions, choices with effects); format in dialogue/index.js
  tiles.js, openingRoom.js  Ground tiles for walkable layouts; the opening room map
  assets.js               Asset registry (every visual by id; real file → borrowed → placeholder); docs/ASSETS.md via scripts/assets-doc.mjs
  slice.js                Chapter 1 slice flag: reachable places and hidden systems
  rooms.js                Rented room, hall purchase, buildable rooms (levels, cost, weeks, upkeep, requirements), hall stages
  charters.js, patrons.js Founding charters and run paths; the three patrons, their levels, unlocks and rivalries
src/explore/              Walkable scenes: WalkableScene (touch/keyboard layer), walkGame.js (lazy Phaser), pathfinding, sceneMap (layout → map), TownScene, WildScene, DialogueBox, SceneHud
src/game/engine.js        Public engine API: a re-export barrel. Import from here.
src/game/engine/          Engine implementation, layered bottom-up (each file imports only earlier ones):
  charter.js              founding charter effects and patron standing (data-only imports, so it sits first)
  core.js                 clone, seeded RNG (rngFor/commitRng), uid, chronicle helpers, roster/guild queries, beds and hall stage
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
  economy.js              upkeep (wages, rent, lease, rooms), patron loans and debt, travel
  hall.js                 the guild's home: rented beds, buying/leasing the hall, building rooms, weekly construction, next-upgrade suggestion
  connections.js          patron rewards and exclusive contracts, the Connections read model, run path scores
  seasons.js              season review, awards, record book, and read models for the mission log, hall of fame, ladder history, head-to-head and hero careers (tallies live in core.js)
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
  exploration.js          walkable scenes: dialogue conditions/effects, scene positions, wild areas (enter, gather, camp, battles)
  autoplay.js             simulateAutoplay (long tests, sim script)
src/game/types.js         JSDoc typedefs (GameState, Hero, Guild, Mission, Tournament, Rival)
src/game/combat.js        Per-hero turn-based battles: commands, hit/crit/primal rolls, statuses, enemy AI profiles, boss phases, tell, turn order, target previews, auto-battle; each round records `encounter.events` that CombatArenaModal replays as animations
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
- `guild`: the player guild: `name`, `crowns` (gold), `fame`, `legacy`, `tierIndex`/`tier` (Regional/National/Global), `rank`, `hall` ({ owned, lease, rentedBeds, rooms: { roomId: level }, construction }; beds are the only roster limit), `appointments`, `formations`, `branches`, `founderHeroId`, `currentGuildmasterHeroId`, `successorHeroId`, `loan`, `unpaidMonths`, `mainParty` (up to 4 hero ids)
- `heroes[]`: the player roster, including dead and retired heroes. `status` is one of `available`, `mission`, `tournament`, `injured`, `dead` or `retired`. Each hero has `level`/`xp`, `power`, `attributes`, `rarity`, `primal`, `classId`, `career`, `history`, `loyalty`, `salary`, `contract` ({ years, salary, startSerial, endSerial } in month serials; none for the founder) and an optional `poachApproach`
- `historicHeroes[]`: archived player heroes (compacted)
- `candidates[]`: recruits on the market. Each has a `locationId`, a `signingFee`, a `scoutLevel` (0–3, how precisely its stats are known) and an optional `demand`
- `rivals[]`: 30 AI guilds, each with a `star` and `members[]`. `freeAgents[]` and `worldHistoricHeroes[]` hold the rest of the world's heroes
- `missions[]` (contract board), `activeMissions[]` (deployed, with `assignments` and `remaining`)
- `activeEncounter` (combat in progress), `activeMissionGame` (non-combat challenge in progress), `pendingDecisions[]`, `pendingReports[]`: while any of these is set, time is paused
- `tournaments[]`, `guildTournaments[]`, `tournamentHistory[]`, `titleRecords`
- `world: { currentLocationId, visitedLocationIds, activeTravel, wildAreaId, exploration }`: `wildAreaId` is the wild area the guild is walking (null in town); `exploration` holds `positions[sceneId]`, `discovered[sceneId]`, `talked[conversationId]`, `npcs` (relationship), `wild[areaId] = { cleared, gathered, visited, bosses }` (cleared/gathered hold the week serial they return)
- `chronicle[]`, `missionHistory[]`, `artifacts[]`, `sagas[]`, `goals[]`, `achievements[]`, `stats`, `legacy`
- `inventory` (itemId → count), each hero's `gear` (weapon/armor/accessory item ids; `artifact:<id>` for a worn artifact)
- `moments[]`: reward screens queued for the UI (victory, levelUp, recruit); presentation only
- `world.roadEvents`, `pendingRoadEvent`: planned and current road events
- `reputation: { families: { Combat: pts, … }, regions: { Crownlands: pts, … } }`
- `guild.charter` (founding charter id), `patrons: { trade|temple|smiths: { points, granted, lastGift } }`, `paths` (monthly path scores and the best path, for the Chapter 1 ending), `stats.goldEarned`; contracts may carry `patron` and `exclusive`, candidates an `objection`
- `rivalries: { [rivalId]: { score, boutsWon, boutsLost, contractsTaken, poachedFromUs, poachedFromThem, challengesWon, challengesLost, lastChallengeSeason } }`, `nemesisIds[]`, `challenge` (pending/accepted nemesis challenge or null)
- `officialLedger[]` entries can also come from contracts and challenges (`source`)
- `pendingEvent` (a town event, festival or story card waiting for a choice), `news[]` + `newsUnread`
- `sideJobs[]` (board), `activeSideJobs[]` (running; heroes have status `sidejob`), `wager`
- `story: { step, next, choice, rivalId, done, postedMissionId }`, `defeatedBosses[]`; story and boss contracts carry `story` / `bossId`
- `seasons[year]`: per-year totals (`g` guild, `fam` per family, `spent` by category, `h[heroId]` per hero), ranks (`ranksStart`, `ranksEnd`, `best`, monthly `series`, every guild's end rank in `ladder`), `big`/`worst`, `broken[]` and the `review`; `records: { guild, hero }`, `streak`, `bossLog[]`; heroes carry `awards[]`, `signedFee` and `career.goldForGuild`
- `settings.sound`, `settings.volume`
- `tutorial`, `council` (last monthly report), `notifications[]`, `settings` (incl. `joystick`), `flags` (`flags.dialogue` holds flags set by conversations)

`validateGame(state)` returns a list of invariant violations; the UI runs it after every action. Keep it in sync with state shape changes.
