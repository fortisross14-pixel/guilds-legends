# Changelog

Newest first. Older entries were moved here from the README.

## Unreleased — Phase 5: history and records

- A season review at the end of every year: your record, titles, gold earned against gold spent, MVP, Rookie of the year and Best signing, the biggest win and worst defeat, how you moved on the three ladders (with a chart), records broken, and a word from a patron or your nemesis. Skip it any time; reopen it later.
- A record book at the Herald: guild and hero records with the year and holder, compared with the best rival guilds. Breaking a record gets its own "Record broken!" moment.
- A Career tab on every hero: stats by year with career totals, awards, records, the contracts they were on and their key moments.
- A mission log in the Chronicle menu: every contract, boss fight and tournament run, filterable by year, type, place, outcome and hero. Each entry opens its full report.
- A hall of fame for retired and fallen heroes who earned it.
- The Herald's ladders show your rank season by season, your best ever, and how far the next guild is; head-to-head pages compare any rival season by season.
- Removed the Chronicle's old mission archive, hall of fame and records tabs.

## Unreleased — Phase 4: identity

- Founding charters at new game: Merchant House, Free Company, Scholars’ Lodge and Shield of the People, each with clear modifiers, a starting bonus and a signature goal. The charter shows in the top bar and the Herald and colours a few first conversations.
- Three patrons: the Dunmere Trade House, the Temple of the Dawn and the Ironford Smiths’ Guild. Work for them, gift them and choose well in the story to go from Stranger to Ally (or Rival), unlocking discounts, exclusive contracts, a cleric recruit and a unique weapon. Patrons partly oppose each other. A Connections page in the Herald.
- What you take shapes what you are offered: boards lean toward the work you are known for, and recruits reflect your charter (some refuse guilds they dislike, and say why).
- Four run paths (Richest, Best connected, Strongest, Most legendary) with live scores in the Herald’s Path panel; the charter’s path is marked.
- Removed the old council/baron/independent alignment choice; its decisions now speak to patrons.

## Unreleased — Phase 3: from banner to hall

- New campaigns start in a rented room above the Wayfarer: one bed, the banner, a small chest. Hiring needs a free bed; rent more beds or build bunks.
- Buy or lease the old hall on Banner Plaza after a few contracts, then build rooms in its empty wings: Bunk room, Training ground, Infirmary, Armory, War room, Scout table, Trophy hall and Treasury, each with levels, build time, upkeep and a "Construction complete" moment.
- The hall grows through four stages (rented room, empty, working, renowned), and its look changes in walkable Dunmere.
- A one-line "Next upgrade" suggestion, construction in the Calendar, and a Treasury that compares income and costs.
- Room activities (training, infirmary, scouting) need their room; drills unlock with the Training ground; the War room unlocks the main party and saved formations; the Armory adds a shop discount, a bigger chest and gear upgrades.
- Removed the old facility upgrades and the Great Hall capacity rule.

## Unreleased — Phase 2: combat

- Turn order bar, and a tap-command-then-tap-target flow with damage/heal previews, hit chance and WEAK/RESIST on every target.
- Battles animate: lunges, hit flashes, crit shakes, floating numbers with MISS/CRIT/WEAK tags, easing HP/MP bars with a damage ghost, KO and victory poses, effect sprites, sounds in time.
- Enemies have personalities (brutes, casters, healers, skirmishers, tanks) and show their plans; three bosses with phases: the Grey Alpha's summons, Captain Rook's switch to aggression, and the Lantern-eater brood's charged Lantern Nova you can blunt or interrupt.
- Statuses: poison, burn, stun, guard, attack up/down and regen, with icons and turn counts.
- 1×/2× speed, auto-battle toggle, retry or retreat after a wipe in the wild, XP bars on the victory screen.

## Unreleased — Phase 1: explore

- Walkable Dunmere, Greenhollow and Ironford, each with its own tile layout, landmark and 6–7 townsfolk who give hints, rumors, small favours, recruit offers or open buildings.
- Data-driven dialogue with conditions (progress, rank, story, season) and choice effects; a dialogue box with portrait, tap to advance, Skip and Auto.
- Three wild areas (the Old Road, the Thornwood edge, the Blackwood) with enemy groups standing on the map, gathering spots, a camp to rest and a boss. Groups come back after a few weeks; the Blackwood opens with the story.
- World map: wild-area nodes and cards, an always-visible main quest marker, and arriving anywhere puts you straight into that place.
- Every scene has World map, Guild Hall, Quest log and Menu; buildings have a clear Leave that returns you to where you stood; the old tile menu is now the small Town directory.
- Removed the old Dunmere-only exploration code. 118 assets are now registered (`docs/ASSETS.md`, generated by `node scripts/assets-doc.mjs`).

## Unreleased — Phase 0: foundations and touch

- Walkable scenes (the opening room and Dunmere) share one touch-first layer: tap to walk with pathfinding, tap a person, door or their name to walk there and interact, a single context button (Talk / Enter / Inspect), hold-and-drag steering and an optional drag-anywhere joystick. The D-pad and "Space" prompts are gone on touch devices.
- The walkable game is created once per visit, so autosaves no longer restart it. Phaser loads only when a walkable scene opens: main bundle 2.2 MB → 781 KB.
- Names and HUD text are drawn over the canvas for crisp text; the canvas renders at the screen's pixel density.
- Asset registry with labelled placeholders for missing art (`src/data/assets.js`, `docs/ASSETS.md`).
- Chapter 1 slice flag: only Dunmere, Greenhollow and Ironford are reachable; succession, branches, mentors, artifacts, alignment and guild championships are hidden.
- Game-dev skills now load in Claude Code; `public.zip` removed.

## Unreleased — HD-2D visual pass

- New interface language: art first, with every scene, the overworld and battles full-screen behind dark translucent panels with thin brass edges and corner flourishes. Replaces the 16-bit JRPG windows. See `DESIGN.md` and `docs/UX_REDESIGN.md`.
- Type: Cormorant Garamond (titles, names, ceremonies), Cinzel (labels), Manrope (text and data). No pixel font in the interface.
- Atmosphere: vignette, depth-of-field edges, bloom and drifting dust on scenes; a gliding gem cursor in menus; HP bars with a damage ghost; counting numbers; typed dialogue on parchment; ceremonies with a light burst and sparks.
- One slim status bar with a Journal dropdown for the next step and upcoming events; slim collapsible party plates; floating dock; bottom sheets on phone.
- Battle: full-screen scene, breathing enemies on ground shadows, light rings for targeting, party plates with the command menu above the active hero.
- No engine changes.

## 16-bit JRPG visual pass

- New look: Dragon Quest-style windows (deep blue fill, white pixel frame), Pixelify Sans for the game voice and Atkinson Hyperlegible for reading text, command menus with a ▶ cursor and arrow-key navigation. Replaces "Midnight Guild Atlas". See `DESIGN.md` and `docs/UX_REDESIGN.md`.
- Title screen with Continue / New Game menu; status strip and World / Guild / Chronicle command dock; party status windows.
- Pixel overworld map with route lines, town tiles, a "You are here" pointer, boss and story markers; scene banners for towns and every building.
- Front-view battle screen with command and message windows, party status windows, damage numbers and hit/heal effects.
- Classic shop (buy/sell list, item window with per-hero stat comparison, gold window), JRPG hero status page, ladder tables, victory / level-up / rank-up moments, dialogue boxes for story and town events.
- CSS rebuilt as one system (tokens, windows, menus) in the per-area files; 12 old stylesheets deleted. No engine changes.

## Wave 8 (content and pacing)

- Weekly town events (29 cards and news items), seasonal festivals and a News feed. "+1 week" usually brings something.
- Side jobs on every Notice Board: 1 week, 1–2 heroes, small rewards.
- Friendly rival challenges: duels, exhibitions and wagers.
- Regional enemy rosters with roles and abilities, and one boss contract per region (unique ability, trophy, Bestiary).
- The Blackwood story arc: 7 beats over the first years, a final choice with a lasting perk and title, and a finale boss.
- Retro sound effects with on/off and volume in Settings.

## Wave 7 (specialization, rivalries and fixes)

- Reputation per mission family and per region, with named levels and perks: better pay and fame, extra and early contracts, cheaper regional recruits, and a top-level bonus. Specialization titles (Monster Hunters, Envoys, Pathfinders, Shadow Hand).
- Declined or expired contracts go to rival guilds, which gain fame, Legacy and Official points. There is a Decline button on the Notice Board.
- Rivalry scores and 1–2 nemeses with a head-to-head page in the Herald. Season challenge matches with gold, fame and Official points at stake. Nemeses outbid you for contracts and court your heroes.
- Fixes: the calendar follows the date; the ribbon is compact and collapsible on World and Guild only; the phone top bar is reworked; calendar goals (challenge windows, reputation milestones, almost-enterable tournaments).

## Wave 6 (recruitment depth)

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
