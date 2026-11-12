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
- UI changes follow [`docs/UX.md`](docs/UX.md): tap / drag / long-press / swipe / hold, a tap fallback for every drag, one interruption at a time, the HUD (orbs, ledger, place tag), the one screen template, one owner for the bottom of the screen, "gold" and the rest of the glossary. Icons only through `<Icon name>`; no emoji.

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
  2. After pushing to `main`, the "Build" workflow run succeeds and Vercel deploys the commit (the game is hosted on Vercel; Vercel reports each deployment on the commit in GitHub).
- **Do NOT** write tests, run test suites (including `test:fast`), simulations, balance or performance checks, Playwright, browser or device playthroughs, or take screenshots. This includes "quick" phone or touch runs.
- If old tests or lint rules break because of an intended change, leave the tests alone; they get rebuilt in Phase 8. Fix lint only if it blocks the build or deploy.
- Exception: visual phases (7C, 7D, 8) take screenshots to review layout.
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
src/App.jsx               Shell: save slots, the place (walkable scene or world map), the open section, the HUD, modals, the `actions` object (UI → engine)
src/hud/                  The HUD and the one screen template: Hud.jsx (Orb, Ledger, PlaceTag), Section.jsx (the template), sections.jsx (which tabs each section has and what they show), GuildScreen (Charter, Reputation, Patrons, Rivals, Finances), ContactsScreen, CreditsScreen, HireGate, dateLine.js
src/places/               MapScreen (world map, wild-area cards), RestDial (the hall's rest timeline), GuildHallRooms (the lot diorama: slots, the build list, a room's panel, heroes into rooms, the rest dial; and the Treasury, shown in Guild → Finances), JournalScreen (Now, Quests, Contracts, Calendar), CalendarScreen, routes.js (route ids → a place or a section)
src/components/           UI primitives and scene backdrop (UI.jsx), the icon set (Icon.jsx + iconPaths.js: game-icons.net and Phosphor), modals (combat, council, moments, road events), HeroStatusScreen, heroStatus.js, Prologue (the knock at the door), ChapterEnd; touch: gestures.js (long-press, swipe, vibration), useDraggable.js (drag and drop onto data-drop targets), usePanZoom.js, DraggableHero.jsx
src/screens/              Building/page content rendered inside places (Missions, Heroes, MainPartyScreen (Party → Main party, saved formations), Rankings + RivalryScreens, HistoryScreens, CodexScreen (Lore, Almanac, Bestiary, Guilds), ArenaScreen + GuildChampionships, …)
src/data/                 Static content: classes, missions, formations, world map + buildings, rival universe, skills, items, road events, events (town events, side jobs, festivals), enemies (rosters, bosses), story
  towns/, wilds/          Walkable town and wild-area layouts (tile rows, buildings, props, NPCs, enemy groups, gathering spots, camp)
  dialogue/               Data-driven conversations (opener variants, hub topics, goodbyes; choices with effects); format in dialogue/index.js, style and voices in docs/DIALOGUE.md; story.js and storyAct2.js hold the story scenes
  missions/               Contract sites (missions-in-world): index.js (each template's and story contract's place and objectives: fight, talk with stat tests, inspect, collect, escort; extras, par days, deadlines; family-built sites for the rest), places.js (free tiles in wild areas and towns, painted sites behind a door)
  story.js, lore.js       The Last Banner (docs/STORY.md): missions, steps, gates, evidence, story heroes, the prologue; the Broken Lantern's seven, the official story, the Lore codex
  tiles.js, playerHouse.js  Ground tiles for walkable layouts; the player's house (prologue): a painted scene (door, founder, Rook)
  interiors.js, people.js Building interiors as painted scenes (the painting per town, spots, hotspots and the door in percentages: interiorLayout); the regulars in each building and visitor name pools
  assets.js               Asset registry (every visual by id; real file → borrowed → placeholder); docs/ASSETS.md via scripts/assets-doc.mjs
  slice.js                Chapter 1 slice flag: reachable places and hidden systems
  rooms.js, lots.js       Room types with three tiers (cost, weeks, upkeep, what each gives), training equipment, the defeat, injury, Crown Room, Armory and visitor numbers; lots (slots, rent, deposit, purchase price, starter cabin, expansion steps; several cities supported)
  tournaments.js          The tournament calendar: three circuits (Initiation, Champion, Elite), 15 events, histories, the special titles, status names
  charters.js, patrons.js Founding charters and run paths; the three patrons, their levels, unlocks and rivalries
src/explore/              Walkable scenes: WalkableScene (touch/keyboard layer; the door and exit bubble), walkGame.js (lazy Phaser), pathfinding, sceneMap (layout → map; contract objectives and site doors as targets), TownScene, WildScene; SiteScene (a painted contract site) and SiteCard (an objective on site: talk, inspect, collect, escort); PaintedScene (a painting that covers the screen, things placed on it in percentages) and InteriorScene (a building as a painted scene: people, hotspots, the door); DialogueBox (scripted talk), PersonDialogue (people: offers and the interview)
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
  stories.js              regional boss contracts, shared event-effect rules
  townLife.js             weekly town events and news, festivals, side jobs, friendly challenges and wagers
  institution.js          succession, mentors, branches, artifacts, ambitions, retirement, release
  contracts.js            hero contracts and renewals, candidate scouting ranges, rival approaches, offer terms
  goals.js                promotion, evaluateStateInPlace (the old chapter goals and achievements are gone)
  economy.js              upkeep (wages, rent, lease, rooms), patron loans and debt, travel
  hall.js                 the guild's home: renting a lot, buying it, expanding it (owned only), building, upgrading and clearing rooms, training equipment, heroes into rooms, weekly construction, training and recovery, monthly room effects, trophies and Crown Room fame, the defeat rule, next-upgrade suggestion
  connections.js          patron rewards and exclusive contracts, the Connections read model, run path scores
  seasons.js              season review, awards, record book, and read models for the mission log, hall of fame, ladder history, head-to-head and hero careers (tallies live in core.js)
  story.js                The Last Banner: story missions and steps, scenes, story contracts and duels, evidence, the Lore codex, story recruits, the prologue, skip tutorial; the shared condition checker; progress runs from a finalize hook
  tournaments.js          tournament rules: entry checks (fame, battles won, status), guild ratings, seeding, fame and prizes, title records
  guildTournaments.js     the yearly 15 tournaments (three circuits), fields, rounds, champions, trophies, special titles, scheduled resolution
  tournamentEntry.js      arena team sign-up, tournament start days and forfeits, the arena read model, team bouts
  missions.js             contracts in the world: accepting one (its site and objectives placed), declining or giving up, the steps (Journal), where objectives stand (siteObjects, siteDoors), saved formations
  people.js               people in buildings (Phase 7C): regulars and monthly visitors built on candidates and contracts, offers (mission, hire, challenge), talking and the interview, bouts, Contacts
  outcomes.js             reporting a contract back: the grade from what was done (objectives, extras, knockouts, days), rewards and the Mission complete moment; deadlines; acknowledging tournament reports
  sites.js                doing a contract on site: talk (stat tests), inspect, collect, escort, site fights and their result (a loss is the defeat rule)
  encounters.js           active combat / mission-game actions and conclusion
  rivals.js               rival seasons, AI transfer market, rival institutions
  time.js                 day loop (advanceDays; weekly and monthly systems on rollover), advanceToDate (Guild Hall only), monthly council resolution, aging
  recruitment.js          roster actions: recruit, release, refound, training, appointments
  dashboard.js            UI read models (getNextAction, getDashboardSummary), small UI actions
  state.js                createNewGame and default state pieces
  save.js                 compactForSave, migrateGame, validateGame
  timeActions.js          the only ways time moves: travelTo + road events, continueJourney, restAtHall, restAtInn (contracts have no clock)
  exploration.js          walkable scenes: dialogue conditions/effects, scene positions, wild areas (enter, gather, camp, battles)
  autoplay.js             simulateAutoplay (long tests, sim script)
src/game/types.js         JSDoc typedefs (GameState, Hero, Guild, Mission, Tournament, Rival)
src/game/combat.js        Per-hero turn-based battles: commands, hit/crit/primal rolls, statuses, enemy AI profiles, boss phases, tell, turn order, target previews, auto-battle; each round records `encounter.events` that CombatArenaModal replays as animations
src/game/legacy.js        Branch, ambition and artifact definitions
src/game/storage.js       IndexedDB save slots, export/import
src/audio/sfx.js          Web Audio retro sound effects (playSound, configureSound, unlockAudio)
src/styles/index.css      Imports the per-area CSS files (base/, layout/, components/, screens/) in cascade order
scripts/sim.mjs           npm run sim: yearly balance table
tests/e2e/smoke.spec.js   Playwright smoke test (npm run test:e2e)
tests/engine.test.js      Engine regression tests (fast)
tests/long.test.js        Long seeded simulations
docs/AUDIT_v1.9.md        Audit and improvement waves
docs/UX.md                Touch-first UX: gesture language, screens and navigation, flows, glossary (follow it for any UI change)
docs/DIALOGUE.md          Dialogue style guide: rules, conversation shape, voices, audit (follow it for any line of dialogue)
```

## GameState shape (brief)

One plain JSON-serializable object, created by `createNewGame` and upgraded by `migrateGame`:

- `schemaVersion`, `seed`, `rngState`: save version and RNG state (advance the RNG only via `commitRng`)
- `date: { year, month, week, day }`: month 0–11, week 0–3, day 0–6; the campaign starts in June 1187. Time only passes through player actions (travel, rest, camps, contracts the founder joins). Travel is in days; missions, injuries and construction in weeks (missions also keep a `dueDay`). The home town is `HOME_LOCATION_ID` (Dunmere); away from it the travelling party is `travellingPartyIds(state)`
- `guild`: the player guild: `name`, `crowns` (gold), `fame`, `legacy`, `tierIndex`/`tier` (internal Regional/National/Global; players see the status names Initiation/Champion/Elite), `rank`, `houseBeds` (the founder's house: one bed), `lots` ({ [lotId]: { status: rented | owned, slots, rooms: [{ id, type, tier 1–3, equipment (training rooms), heroId (training, infirmary) }], nextRoom, construction ({ kind: build | upgrade | clear, type, tier, roomId, equipment, refund, weeksLeft, totalWeeks }), expansion, expansions } }), `hqLotId` (null until story mission 1 rents the Dunmere lot; no hall, no hires), `goldHistory` (treasury at each month's start, for the savings rate), `trophies` ({ [tournamentId]: { name, count, firstYear, lastYear } }: shown, with fame, only in a Crown Room), `titles` (special titles); beds are the only roster limit (house bed + 2 per bedroom), `appointments`, `formations`, `branches`, `founderHeroId`, `currentGuildmasterHeroId`, `successorHeroId`, `loan`, `unpaidMonths`, `mainParty` (up to 4 hero ids)
- `heroes[]`: the player roster, including dead and retired heroes. `status` is one of `available`, `mission`, `tournament`, `injured`, `dead` or `retired`. Each hero has `level`/`xp`, `health`/`mana` (percents; HP and MP carry over between battles), `injuryWeeks` and `defeated` (a lost fight: weeks by the infirmary's tier; nobody dies in battle), `monthlyActivity` (Rest, Scouting, Public Exhibition or Guild Duty; training and the infirmary are rooms), `power`, `attributes`, `rarity`, `primal`, `classId`, `career`, `history`, `loyalty`, `salary`, `contract` ({ years, salary, startSerial, endSerial } in month serials; none for the founder) and an optional `poachApproach`
- `historicHeroes[]`: archived player heroes (compacted)
- `candidates[]`: recruits on the market. Each has a `locationId`, a `signingFee`, a `scoutLevel` (0–3, how precisely its stats are known) and an optional `demand`
- `rivals[]`: 30 AI guilds, each with a `star` and `members[]`. `freeAgents[]` and `worldHistoricHeroes[]` hold the rest of the world's heroes
- `missions[]`: contracts (posted, held by people, or taken). A taken one has `accepted` and `site` ({ status: active | ready | failed, place: { kind: wild | town | painted, id }, slots: { objectiveId: { tile } or { at } or { box } }, done, progress, failed, escort, alarm, kos, rough, startDay, par, deadlineDay }), and `giverId`/`giverName` when a person gave it; story contracts carry `story` and `storyVariant`
- `activeEncounter` (combat in progress; `sourceType` site for a contract fight), `pendingReports[]` (tournaments): while one is set, time is paused
- `tournaments[]`: this year's 15 team tournaments (`circuit` Initiation/Champion/Elite, `teamSize` 2/4/5, a `signup: { heroIds, fee, day }` until the start day, then `assignments`), `tournamentHistory[]`, `titleRecords`, `tournamentWins` ({ [guildId]: { [tournamentId]: [years] } }), `guild.specialTitles` and `rival.specialTitles` ([{ id, name, year }])
- `world: { currentLocationId, visitedLocationIds, activeTravel ({ fromId, toId, daysRemaining, totalDays, cost }), wildAreaId, exploration }`: `wildAreaId` is the wild area the guild is walking (null in town); `exploration` holds `positions[sceneId]`, `discovered[sceneId]`, `talked[conversationId]`, `npcs` (relationship), `wild[areaId] = { cleared, gathered, visited, bosses }` (cleared/gathered hold the week serial they return)
- `chronicle[]`, `missionHistory[]`, `artifacts[]`, `sagas[]`, `stats`, `legacy`
- `inventory` (itemId → count), each hero's `gear` (weapon/armor/accessory item ids; `artifact:<id>` for a worn artifact)
- `moments[]`: reward screens queued for the UI (victory, levelUp, recruit); presentation only
- `world.roadEvents`, `pendingRoadEvent`: planned and current road events
- `reputation: { families: { Combat: pts, … }, regions: { Crownlands: pts, … } }`
- `guild.charter` (founding charter id), `patrons: { trade|temple|smiths: { points, granted, lastGift } }`, `paths` (monthly path scores and the best path, for the Chapter 1 ending), `stats.goldEarned`; contracts may carry `patron` and `exclusive`, candidates an `objection`
- `rivalries: { [rivalId]: { score, boutsWon, boutsLost, contractsTaken, poachedFromUs, poachedFromThem, challengesWon, challengesLost, lastChallengeSeason } }`, `nemesisIds[]`, `challenge` (pending/accepted nemesis challenge or null)
- `officialLedger[]` entries can also come from contracts and challenges (`source`)
- `pendingEvent` (a town event, festival or story card waiting for a choice), `news[]` + `newsUnread`
- `sideJobs[]` (board), `activeSideJobs[]` (running; heroes have status `sidejob`), `wager`
- `people: { [personId]: { met, talks, relationship, interview, asked, bouts, movedOn, name, role, portrait, locationId, building, offers } }`: memory only (who is where comes from `people.js`); candidates carry `postedSerial`, `venue` (tavern | arena), `boutFirst`/`boutWon`; contracts carry `unlocked`/`accepted`/`giverId` (only `unlocked`, story and boss contracts show on the notice board)
- `story: { prologue ('house'|'done'), tutorial ('active'|'done'|'skipped'), missions: { m1: { status, step, route } }, evidence, codex, choices, scene (a queued story scene), chapter, chapterDone }`, `defeatedBosses[]`; story contracts carry `story` ('m3.contract'), boss contracts `bossId`; story heroes carry `storyId`
- `seasons[year]`: per-year totals (`g` guild, `fam` per family, `spent` by category, `h[heroId]` per hero), ranks (`ranksStart`, `ranksEnd`, `best`, monthly `series`, every guild's end rank in `ladder`), `big`/`worst`, `broken[]` and the `review`; `records: { guild, hero }`, `streak`, `bossLog[]`; heroes carry `awards[]`, `signedFee` and `career.goldForGuild`
- `settings.sound`, `settings.volume`
- `tutorial`, `council` (last monthly report), `notifications[]`, `settings` (incl. `joystick`, `questMarker`), `flags` (`flags.dialogue` holds flags set by conversations)

`validateGame(state)` returns a list of invariant violations; the UI runs it after every action. Keep it in sync with state shape changes.
