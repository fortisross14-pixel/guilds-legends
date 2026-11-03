# Changelog

Newest first. Older entries were moved here from the README.

## Unreleased — Wave 6 (recruitment depth)

- Contracts of 1–3 years with salary and expiry. A warning comes 3 months before, and heroes leave as free agents if not renewed. Renewal talks from the status screen: the asking salary depends on loyalty and level, and disloyal heroes refuse.
- Candidate stats show as ranges until scouting narrows them.
- Free agents in town are listed in the Tavern and can be signed.
- Poaching both ways. Rivals court low-loyalty heroes (counter-offer within a month or lose them). You can make offers to rival heroes; success depends on their loyalty and your fame.

## Wave 5 (your team, your time)

- Weekly time: dates are { year, month, week }. +1 week, +1 month and "Wait until…" (the calendar) live in the top bar. Monthly systems run on week 1. Travel takes 1–6 weeks, missions 1–4 weeks, and injuries heal weekly.
- Calendar page: a month grid by week with tournaments (enterable or locked), company returns, arrival, promises, wage days and season ends, plus "Advance to this date". The Upcoming strip shows the next 3 actionable events.
- Party bar on every screen: each hero's HP, fatigue, status icon, main-party star and a warning dot.
- Guild Hall rooms: Training Grounds, Infirmary, Barracks, Scouts' Table, Courtyard, Council Chamber, War Room, Treasury, Armory and Facilities. Move heroes between rooms, send everyone idle at once, or auto-assign.
- Hero status screen: stats, equipment, skills (locked ones too), room, character, relationships, career, actions, and Previous/Next.
- Main party of up to 4 pre-fills missions and tournament entry, with substitute hints.
- Quest Log: active contracts (shown on the map with a pin), promises and objectives.
- Fixes: old tutorial notices are cleared after skipping; the world map shows first, with its intro in a "?" tooltip.

## Wave 4 (rankings and the scripted opening)

- Three ladders, Strength, Legacy and Official (tournament points from the last 12 months), for guilds and heroes. They replace the old blended score.
- Status titles from Unknown to Global Power. Promotion uses the Official ladder.
- Rank movement arrows, a rank-history sparkline, and "N points to pass <guild> (#k)". The Herald is the rankings hub, and the top bar shows the three ranks plus the status title.
- A rankings update screen each season and after your tournaments, and a fanfare when the status title changes.
- Scripted first ten minutes: intro card, free first hire, the first contract, a guaranteed road event, a guaranteed first battle with hints, victory and level-up screens, the Herald's first rank change, then the first tournament on the calendar. The tutorial can be skipped.

## Wave 3 (real combat)

- Per-hero, turn-based battles. Each hero and enemy has HP, MP, attack, defense, magic, speed and status effects. Each round you pick a command (Attack, Skill, Item, Defend) and a target for every hero. The strongest enemy's next move is shown as a tell, and stuns can interrupt it. Auto-battle and Flee are available.
- Front-view battle screen with enemy sprites, party HP/MP windows, a command menu, click-to-target and a battle log.
- 5–6 skills per class, unlocked by level (src/data/skills.js).
- Items and equipment: consumables, weapon/armor/accessory slots with class limits, a guild inventory, town shops stocked by tier, and loot from missions, ambushes and tournament finishes. Artifacts are worn as accessories.
- Reward moments: victory screen, level-up screen (stat gains, new skills), recruit introduction card.
- Road ambushes are real battles, and merchants sell potions.
- Save schema v15.

## Wave 2 (the world is the game)

- The world map is the home screen, with a "You are here" marker, routes, locked tiers, and the guild's position while travelling.
- Towns have buildings: Guild Hall, Tavern, Notice Board, Arena, Shop (placeholder) and Herald. Each opens the existing functionality.
- Navigation is now Map / Town / Menu (Settings, Chronicle, Codex). The top bar shows date, location, gold and the three guild ranks.
- Time moves with actions. Travelling runs the journey's months, "Wait / rest at the Guild Hall" runs 1–3 months, and sending out your last free company runs time until it returns. The +1 month, +Season and +1 year buttons are gone.
- Road events: 0–2 seeded events per journey (ambush, merchant, wandering recruit, shortcut, storm delay).
- A calendar strip lists upcoming tournaments with entry requirements, deployed companies, the journey and promise deadlines.
- Save schema v14.

## Wave 1 (AI-friendly codebase, no behavior changes)

- Split the 6,000-line `src/game/engine.js` into 21 modules in `src/game/engine/` (126–582 lines each), layered so there are no circular imports. `engine.js` is now an explicit re-export barrel with the same 86 exports as before.
- JSDoc types in `src/game/types.js`, `// @ts-check` on every engine module, and `npm run typecheck` (TypeScript, no emit).
- `npm run sim -- --seed 42 --years 20` prints a yearly balance table.
- Playwright smoke test: `npm run test:e2e` (uses the installed Chrome; not in CI).
- Split `src/styles/index.css` into 25 per-area files. The built CSS is byte-identical.

## Wave 0 (stabilize)

See docs/AUDIT_v1.9.md for the bug IDs.

- B1: portraits and sprites load under the GitHub Pages subpath (import.meta.env.BASE_URL).
- B2: patron loans fix the bankruptcy soft-lock. Debt now costs loyalty, and unpaid heroes walk out after 3 months. Save schema v13.
- B3: a guild with no active heroes can be refounded (new founder plus one free recruit).
- B4: importing a backup asks for confirmation before replacing the slot.
- B5: Rankings shows the current guildmaster (or strongest active hero) as the guild star.
- B6: released heroes become free agents and keep their career history.
- B7: world map routes connect the cities.
- B8: deleting a campaign cancels any pending autosave first.
- B9: the Council Report no longer opens over a playable mission.
- B10: the UI uses the engine's xpForNextLevel and hashString. The same seed text now generates a different world than in v1.9.
- B11/B12: removed stray TypeScript configs and the tracked dist/, rewrote the README, and added this changelog.
- Tooling: ESLint, Prettier, CLAUDE.md/AGENTS.md, and the test:fast/test:long scripts.

## v1.9

Added the pixel art set: class portraits and sprites, enemy and effect sprites, and scene images (public/art/).

## v1.8 — The Institution Outlives the Hero

Phase 4 adds the century-scale institutional game. National and Global guilds can establish permanent branches, operate contracts and recruitment markets in multiple places, appoint branch commanders and keep companies active while headquarters travels. Guildmasters now have true succession: designate an heir, survive retirement or death, and continue the campaign beneath a new named era.

Heroes can form formal mentor/apprentice lineages, pursue personal ambitions and inherit unfinished ambitions from retired or fallen predecessors. Artifacts now have bearers, small mechanical effects and custody histories, returning to the guild vault when a hero leaves active service. Rival institutions can poach established stars and occasionally split into new guilds, so the world itself develops institutional history.

## v1.7 — People, Promises & Intrigue

Phase 3 makes non-combat missions as playable as Phase 2 combat. Diplomatic Delegations now negotiate turn by turn through Trust, Insight, Agreement and concessions; Expedition Teams manage route progress, evidence, Supplies, Hazard and artifact verification; Intrigue Cells balance Intel, objective progress, Heat and the timing of extraction. Every system uses the assigned heroes rather than a generic guild score.

Heroes now behave more like people. Personality and flaws alter field actions and aftermath reactions, companions build or damage relationships through shared experiences, and meaningful recruits can demand a promised tournament appearance or a mission in the career path they care about. The player may accept that obligation or pay a larger unconditional signing package. Broken promises cost loyalty and become part of the hero's career history.

## v1.6 — Take the Field

Phase 2 makes combat missions and player tournament rounds genuinely playable. Individual competitors fight compact turn-based duels with readable enemy tells, stamina, Guard, Feint, Recover and class-specific Signatures. Combat Companies use the same tactical language without becoming a grid tactics game: the full formation contributes automatically while the player chooses a tactical lead and one company order per exchange.

Combat missions now include elimination, protection, hold-the-field, break-position and capture-style objectives. Routine encounters still support Auto Resolve, while important fights can be played personally for a tactical edge. Active battles and brackets now also survive save/load without world rerolls.

## v1.5 — Run the Guild

Phase 1 of the management overhaul makes the month itself a playable decision. Every active hero now has a persistent assignment: train, rest, recover in the infirmary, scout, perform publicly or work guild duty. Missions and tournaments occupy their participants while the rest of the roster continues working in parallel. Advancing time resolves the whole institution together and produces a Council Report with costs, XP, level-ups, recovery and fame changes.

The opening recruitment pool is now deliberately primal-diverse, guild/founder names can be changed without rewriting history, mobile navigation is reduced to five core destinations plus a More sheet, and accessibility/focus behavior has been strengthened.

## v1.4 — Living Legends

The world now exists beyond the player guild.

#### A simulated hero universe

- **30 recognizable rival guilds:** 12 Regional, 10 National and 8 Global.
- **150+ opening rival heroes**, plus free agents, annual cohorts, retirements and succession.
- Named rival stars and supporting rosters have levels, rarity, class, primal, form, renown, tournament specialization and career records.
- Rival guild identities remain recognizable while their heroes, titles, rewards, fame and rankings evolve.

#### Individual tournament careers

Eight recurring titles create a complete career ladder:

- Regional: Dunmere Harvest Melee, Greenhollow Thorn Cup, Ironford Hammer Trials
- National: Tidecross Open, Sunspire Royal Arena, Mooncourt Mindblade Invitational
- Global: Caldera Crown and the four-year World Conclave Championship

Every event has a host city, entry threshold, purse, prestige, seeded field, trophy, historical champions and a repeat-title record to chase. Player matches use live brackets and four tactical approaches: Measured, Aggressive, Defensive and Showmanship.

#### Fame versus expectation

Tournament fame depends on context. Unknown challengers can become famous through a strong run or even a respectable loss. Established stars are expected to reach late rounds, and a world-famous hero losing immediately in a modest Regional tournament can lose fame.

#### Guild championships

- **The King’s Shield:** National eight-guild championship
- **Grand Companies Championship:** Global guild title

The player fields a fixed five-hero Combat Company. Roster depth, commander quality, support, role fit and primal coverage matter alongside star power.

#### Three simultaneous guild ladders

The Rankings screen shows Regional, National and Global standing at the same time. A rising guild can be third regionally while still eighteenth nationally. Scores update from fame, legacy, titles, roster power, current form, season results and career points.

#### Almanac and historical records

- Hero GOAT rankings use weighted major deeds, tournament record, quests, peak, longevity, leadership and cultural influence.
- Title archives retain every champion, runner-up, semifinalist and round result.
- Repeat-title records, prize-money leaders, artifacts and historic legends give the player concrete lifelong targets.
- Career facts remain inspectable after heroes retire or die.
