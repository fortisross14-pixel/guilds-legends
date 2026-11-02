# Guilds of Legend

A long-form guild-management, hero-career and living-history simulation built with React and Vite.

You begin as a Level 1 founder with one recruit, travel between primal cultures, build specialist companies, enter increasingly prestigious competitions and try to create heroes and guilds whose records survive for centuries.

## v1.8 — The Institution Outlives the Hero

Phase 4 adds the century-scale institutional game. National and Global guilds can establish permanent branches, operate contracts and recruitment markets in multiple places, appoint branch commanders and keep companies active while headquarters travels. Guildmasters now have true succession: designate an heir, survive retirement or death, and continue the campaign beneath a new named era.

Heroes can form formal mentor/apprentice lineages, pursue personal ambitions and inherit unfinished ambitions from retired or fallen predecessors. Artifacts now have bearers, small mechanical effects and custody histories, returning to the guild vault when a hero leaves active service. Rival institutions can poach established stars and occasionally split into new guilds, so the world itself develops institutional history.

See [`PHASE4_v1.8.md`](PHASE4_v1.8.md) and [`QA_REPORT_v1.8.md`](QA_REPORT_v1.8.md).

## v1.7 — People, Promises & Intrigue

Phase 3 makes non-combat missions as playable as Phase 2 combat. Diplomatic Delegations now negotiate turn by turn through Trust, Insight, Agreement and concessions; Expedition Teams manage route progress, evidence, Supplies, Hazard and artifact verification; Intrigue Cells balance Intel, objective progress, Heat and the timing of extraction. Every system uses the assigned heroes rather than a generic guild score.

Heroes now behave more like people. Personality and flaws alter field actions and aftermath reactions, companions build or damage relationships through shared experiences, and meaningful recruits can demand a promised tournament appearance or a mission in the career path they care about. The player may accept that obligation or pay a larger unconditional signing package. Broken promises cost loyalty and become part of the hero's career history.

See [`PHASE3_v1.7.md`](PHASE3_v1.7.md) and [`QA_REPORT_v1.7.md`](QA_REPORT_v1.7.md).

## v1.6 — Take the Field

Phase 2 makes combat missions and player tournament rounds genuinely playable. Individual competitors fight compact turn-based duels with readable enemy tells, stamina, Guard, Feint, Recover and class-specific Signatures. Combat Companies use the same tactical language without becoming a grid tactics game: the full formation contributes automatically while the player chooses a tactical lead and one company order per exchange.

Combat missions now include elimination, protection, hold-the-field, break-position and capture-style objectives. Routine encounters still support Auto Resolve, while important fights can be played personally for a tactical edge. Active battles and brackets now also survive save/load without world rerolls.

See [`PHASE2_v1.6.md`](PHASE2_v1.6.md) and [`QA_REPORT_v1.6.md`](QA_REPORT_v1.6.md).

## v1.5 — Run the Guild

Phase 1 of the management overhaul makes the month itself a playable decision. Every active hero now has a persistent assignment: train, rest, recover in the infirmary, scout, perform publicly or work guild duty. Missions and tournaments occupy their participants while the rest of the roster continues working in parallel. Advancing time resolves the whole institution together and produces a Council Report with costs, XP, level-ups, recovery and fame changes.

The opening recruitment pool is now deliberately primal-diverse, guild/founder names can be changed without rewriting history, mobile navigation is reduced to five core destinations plus a More sheet, and accessibility/focus behavior has been strengthened.

See [`PHASE1_v1.5.md`](PHASE1_v1.5.md) for the complete Phase 1 changes.

## v1.4 — Living Legends

The world now exists beyond the player guild.

### A simulated hero universe

- **30 recognizable rival guilds:** 12 Regional, 10 National and 8 Global.
- **150+ opening rival heroes**, plus free agents, annual cohorts, retirements and succession.
- Named rival stars and supporting rosters have levels, rarity, class, primal, form, renown, tournament specialization and career records.
- Rival guild identities remain recognizable while their heroes, titles, rewards, fame and rankings evolve.

### Individual tournament careers

Eight recurring titles create a complete career ladder:

- Regional: Dunmere Harvest Melee, Greenhollow Thorn Cup, Ironford Hammer Trials
- National: Tidecross Open, Sunspire Royal Arena, Mooncourt Mindblade Invitational
- Global: Caldera Crown and the four-year World Conclave Championship

Every event has a host city, entry threshold, purse, prestige, seeded field, trophy, historical champions and a repeat-title record to chase. Player matches use live brackets and four tactical approaches: Measured, Aggressive, Defensive and Showmanship.

### Fame versus expectation

Tournament fame depends on context. Unknown challengers can become famous through a strong run or even a respectable loss. Established stars are expected to reach late rounds, and a world-famous hero losing immediately in a modest Regional tournament can lose fame.

### Guild championships

- **The King’s Shield:** National eight-guild championship
- **Grand Companies Championship:** Global guild title

The player fields a fixed five-hero Combat Company. Roster depth, commander quality, support, role fit and primal coverage matter alongside star power.

### Three simultaneous guild ladders

The Rankings screen shows Regional, National and Global standing at the same time. A rising guild can be third regionally while still eighteenth nationally. Scores update from fame, legacy, titles, roster power, current form, season results and career points.

### Almanac and historical records

- Hero GOAT rankings use weighted major deeds, tournament record, quests, peak, longevity, leadership and cultural influence.
- Title archives retain every champion, runner-up, semifinalist and round result.
- Repeat-title records, prize-money leaders, artifacts and historic legends give the player concrete lifelong targets.
- Career facts remain inspectable after heroes retire or die.

See [`DESIGN_v1.4_UNIVERSE.md`](DESIGN_v1.4_UNIVERSE.md) for the complete mechanics and balance design.

## Existing core systems

- Three IndexedDB campaign save slots with JSON backup/import
- Founder creation: guild name, player name, class and primal
- Guided opening orders that teach hiring, arrangements, missions and reports
- Persistent gold, fame, legacy, rank and location strip
- Hero levels 1–20 with visible XP
- Common, Uncommon, Rare, Epic and Legend rarity
- Ten classes and seven primals
- Fire/Air/Water/Plant/Animal/Psychic/Iron matchup and cultural-alignment systems
- Combat, Diplomacy, Expedition and Intrigue arrangements with explicit roles
- Location-only contracts, recruitment and tournament registration
- Eighteen destinations and time/cost-based travel
- Mission results from Catastrophic to Legendary with key-moment decisions
- Detailed result popups and clickable mission/tournament Chronicle records
- Injuries, aging, retirement, death, renown, legacy and complete careers
- Headquarters rooms, facilities, appointments and building limitations
- Regional → National → Global institutional progression
- Sagas, political alignment, artifacts and inherited dreams

## Run in VS Code

Install Node.js 20 or later, open this project folder and run:

```bash
npm install
npm run dev
```

Vite normally opens the game at `http://localhost:5173`.

## Test and build

```bash
npm test
npm run build
npm run preview
```

The v1.8 regression suite contains **46 tests** covering:

- deterministic seeded campaign generation and long-run reproducibility
- succession, branches, mentorship, inherited ambitions, artifacts and rival institutional evolution
- simultaneous monthly council assignments and reports
- playable Diplomacy, Expedition and Intrigue mission resolution
- personality-sensitive action effectiveness and mission aftermath reactions
- recruitment promises, buyouts, fulfillment and broken-promise loyalty penalties
- hero relationship changes and active mission-game save migration
- infirmary recovery behavior
- opening primal diversity
- guild/founder rename continuity
- v1.4 save migration
- founder level, rarity and primal initialization
- the complete guided opening and detailed mission report
- primal advantages and disadvantages
- visible level progression
- local recruitment and travel
- recruitment price scaling
- tournament license, hero and location requirements
- rival rosters, free agents, title records and three ladders
- autonomous AI tournaments
- long-run rarity balance, rare upsets and bounded AI dynasties
- a complete player tournament bracket and report
- expectation-based fame loss
- live turn-based tournament duels and readable enemy tells
- tactical determinism for identical action sequences
- tell-aware play outperforming blind attack spam
- Feint-versus-Guard counterplay
- party objectives and selectable tactical leads
- in-progress combat save/load preservation
- Regional-to-National promotion
- headquarters room limits
- save export/import
- 25-year campaign validity
- 100-year bounded save stability

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Copy the **contents** of this folder into it.
3. Do not commit `node_modules` or `dist`; both are in `.gitignore`.
4. Push to `main`.
5. In **Settings → Pages**, choose **GitHub Actions** as the source.
6. The included workflow installs dependencies, runs all tests, builds and deploys `dist`.

The Vite configuration uses `base: './'`, so deployment works beneath a repository subpath.

## Save architecture

Campaigns are stored in IndexedDB rather than localStorage. The save layer catches storage failures, compacts old presentation detail while preserving historical facts, supports JSON backup/import and removes obsolete oversized prototype keys.

Tournament champions, title counts, career totals, artifacts and important Chronicle facts are preserved separately from generated narrative. A long-horizon simulation governor keeps 100–300 year campaigns bounded without deleting the records the Almanac needs.

## Project structure

```text
src/
  components/       Shared UI primitives and hero taxonomy badges
  data/             Classes, missions, formations, world and universe content
  game/
    combat.js       Deterministic duel/company tactical combat engine
    engine.js       Campaign simulation, tournaments, rankings, progression and institutional legacy
    legacy.js       Branch, ambition and artifact legacy definitions
    storage.js      IndexedDB save system
  screens/          Guild, missions, heroes, tournaments, world and archives
  styles/           Responsive visual design system
  App.jsx           Shell, resource strip, actions and report modals
  main.jsx          React entry point

tests/
  engine.test.js    Regression and long-horizon simulation tests
```
