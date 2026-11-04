# Guilds of Legend — Project plan: Chapter 1 vertical slice

Written 2026-11-03 after reviewing `main` at `109b879`. This plan replaces "Wave 8 → design pass → testing" in `docs/GAME_VISION.md` as the way forward. Agents: read this file and do **only the phase you are asked for**.

## 1. The goal

Ship a **Chapter 1 vertical slice**: a small but complete game that plays great on a tablet or phone, even with placeholder graphics. Expand the world later.

The seven pillars, and how the slice delivers each one:

| Pillar | In the slice |
|---|---|
| Exciting turn-based combat | Animated per-hero battles, tap a hero's command then tap the target, enemy tells, bosses with patterns |
| Explore to recruit cool teams | Walkable towns with NPCs, recruits found in taverns, on roads and through quests, each with a hook |
| Feeling of growth | Start with a banner and one rented room. Build the Guild Hall room by room: beds, training ground, infirmary, armory… |
| Watching the guild rise | Strength, Legacy and Official ranks, plus a sports-style season review each year and a record book |
| Replayability | A founding charter, and a guild identity shaped by who you hire and which contracts you take |
| Open world with a story | 3 towns, 2–3 wild areas, the Blackwood story as the main quest |
| Modern 2D look | HD-2D direction (DESIGN.md). Art comes later from another AI; the slice uses labelled placeholders |

**Done means:**
- About 2–3 hours of play, from a lone founder with a banner to the end of the Blackwood story and Regional promotion.
- Fully playable by touch on a 390px phone and a tablet.
- Every placeholder is listed in `docs/ASSETS.md`.

## 2. Where the game is today (review of `main`)

**Strong:**
- The deterministic engine, per-hero combat with skills, items and gear, weekly time and calendar, and Guild Hall rooms.
- Contracts, scouting and poaching, reputation and nemeses, town events, side jobs, the Blackwood story beats, and the three ranking ladders.
- The HD-2D panel style and the scene backdrops (fixed).

**Problems to fix first:**
1. **Two game models side by side.** Most of the game is menus (map → town tiles → building screens). A new Phaser layer adds a walkable Dunmere and the "Fallen Banner" opening room. Only Dunmere is walkable, and it duplicates the town tile menu. *Decision below.*
2. **Keyboard-first input in the walkable layer.**
   - The prompts say "Space".
   - The on-screen D-pad covers the prompt box on phones.
   - Text inside the Phaser canvas is scaled blurry.
   - Tap-to-walk exists but isn't the main way to play.
3. **The walkable town restarts on every state change.** `DunmereExploration.jsx` rebuilds the Phaser game whenever `state` changes (`useEffect` depends on `state` and `actions`). Every autosave or action resets it, which causes flicker, lost position and wasted battery.
4. **The bundle is 2.25 MB** (Phaser is in the main chunk). It should load only when a walkable scene opens.
5. **Too many systems for a first chapter:** branches, succession, mentorship, artifact custody, promises, alignment, sagas, wagers, festivals and more. Most are invisible or confusing in the first hours.
6. **Skills setup:**
   - The new game-dev skills were installed to `.agents/skills/`. Claude Code reads `.claude/skills/`, so only `impeccable` loads.
   - `develop-web-game` didn't install at all; it's missing from `skills-lock.json`.
7. **Stray files:** `public.zip` (1.1 MB) is committed at the root.

## 3. Key decisions

1. **Hybrid structure (the Octopath / Dragon Quest model):**
   - **World map**: tap a location to travel. It's a node map, not walkable.
   - **Towns and wild areas**: walkable Phaser scenes. Tap to walk, tap a door or NPC to interact.
   - **Building interiors**: art-backed menu scenes (React), e.g. the Tavern shows who is there, the Shop is a shop list.
   - **Battles**: the existing React battle screen, upgraded.
   - **Guild management** (Guild Hall rooms, roster, records): React screens.
   - The old town tile menu stays only as an accessibility fallback ("Town directory").
2. **Touch is the primary input. Keyboard and mouse are extras.**
   - Tap to walk, tap a target to walk there and interact, and one context button ("Talk", "Enter", "Inspect") that appears when near something.
   - No keyboard hints on touch devices (`pointer: coarse`).
   - Optional drag-anywhere virtual joystick. Remove the fixed D-pad.
   - Every tap target is at least 44px.
3. **Slice scope:**
   - Locations: **Dunmere** (hub), **Greenhollow** and **Ironford** (towns), plus **the Old Road**, **Thornwood edge** and **the Blackwood** (wild areas).
   - All other locations show as "beyond the known roads", locked with a teaser.
   - One Regional tournament circuit (Dunmere Harvest Melee + Greenhollow Thorn Cup).
4. **Hide, don't delete,** systems outside the slice behind a `SLICE` flag in `src/data/slice.js`: branches, succession, mentorship, artifact custody history, alignment, sagas, guild championships, National/Global content. Keep their code; just don't surface them until later chapters.
5. **Placeholders everywhere art is missing.**
   - A placeholder is a labelled, color-coded block with the asset id (e.g. `bg.battle.blackwood`), loaded through one asset registry (`src/data/assets.js`).
   - When the real file exists at the listed path, it's used automatically.

## 4. Phases

One phase per agent session. Each phase ends with a playable build pushed to `main` and a short summary. **Until Phase 8 the only checks are: `npm run build` succeeds, and the GitHub Pages deploy succeeds.** No tests, playthroughs, device checks or screenshots (see `CLAUDE.md`).

### Phase 0 — Foundations and touch ✅ Done (2026-11-03)

**Notes:**
- Skills copied into `.claude/skills/`. `develop-web-game` was removed from `openai/skills` (PR #370), so it is installed from the last commit that had it (pinned in `skills-lock.json`). `public.zip` removed.
- Both walkable scenes now use one shared layer in `src/explore/` (`WalkableScene.jsx` + lazily imported `walkGame.js` + `pathfinding.js`). The Phaser game is created once per mount; React talks to it through a ref. Main bundle 2.2 MB → 781 KB (241 KB gzip); Phaser is a separate chunk loaded only by walkable scenes.
- Touch: tap to walk (A* around blocks), tap a target or its name to walk there and interact, one context button, hold-and-drag to steer, optional drag-anywhere joystick (Settings → Controls). D-pad removed. Names and HUD are React over the canvas; canvas renders at device pixel ratio (max 2). Off-screen key targets show as edge beacons. Keyboard (arrows/WASD, Space/Enter/E) on desktop only shows hints with a fine pointer.
- Asset registry `src/data/assets.js` (47 ids), loader + placeholder painter `src/components/assetLoader.js`, `<Asset>` / `useAssetUrl` in `src/components/Asset.jsx`. Backdrops, interiors, battle backgrounds, world map terrain and all walkable art go through it. See `docs/ASSETS.md`.
- Slice flag `src/data/slice.js`: only Dunmere, Greenhollow and Ironford are reachable; other places show as "Beyond the known roads". Mission pool capped at Regional. Hidden in the UI: Legacy office (succession, branches, mentors, artifacts), alignment panel, mentor picker, guild championships tab, branch buttons. Dunmere has a "Directory" button for the old tile menu.
- **Open issue for Phase 1:** in the phone check the opening room, Dunmere taps and tavern dialogue worked, but tapping the opening room's door to enter Dunmere did not trigger in the automated run (the founder reached the door; the context button should still work). Testing was stopped there at the owner's request, so Dunmere was not re-checked on the phone after that point.

- **Skills:**
  - Copy or symlink `.agents/skills/*` into `.claude/skills/`, so Claude Code loads them.
  - Install `develop-web-game` (`npx skills add openai/skills --skill develop-web-game -a claude-code`) and check it lands in `.claude/skills/`.
  - Remove `public.zip`.
- **Fix the Phaser lifecycle:**
  - Create the game once per scene mount.
  - Pass state through a ref or event bus, not through `useEffect` dependencies.
  - Lazy-load Phaser with a dynamic `import()`, so the first screen doesn't download it.
- **Shared touch input layer** for all walkable scenes:
  - tap to walk, with simple pathfinding around obstacles
  - tap a target to walk there and interact
  - a context button
  - an optional drag joystick
  - no keyboard hints on touch
  - crisp text: render HUD text in React over the canvas, or use integer scaling
- **Asset registry** plus placeholder component (React) and placeholder textures (Phaser). Start `docs/ASSETS.md`.
- **Slice flag:** hide out-of-slice systems and locations.
- **Done when:** the build and deploy succeed. The player checks the touch feel on their own device.

### Phase 1 — Explore: towns, interiors, NPCs and the world map ✅ Done (2026-11-03)

**Notes:**
- **Towns:** Dunmere, Greenhollow and Ironford are walkable, each from a tile layout in `src/data/towns/` (40×26 tiles of 32 px, one Phaser tilemap layer). Each has its own layout, primal and landmark: Dunmere (river, Banner Fountain plaza, bridge west to the Old Road), Greenhollow (Elder Oak green, stream with footbridges, lane north to the Thornwood), Ironford (walled, split by the river, the Great Bridge). 6–7 NPCs per town with a gentle idle bob (placeholder animation); landmarks you can inspect; notice boards open contracts. Buildings are 5×5-tile fronts with the door at the bottom.
- **Dialogue:** `src/data/dialogue/` (one file per town plus wild-area landmarks). A conversation has variants chosen by conditions (talked before, Old Road cleared, tier, story step/open, season, flags, recruit in town); choices have effects (gold, items, region reputation, relationship, flags, rumors, known events, open a building, recruit offer). The old Dunmere lines and their side effects (Old Road and Harvest Melee flags, Ironford rumor) moved in. Box: portrait placeholder, speaker, tap anywhere to advance, Skip and Auto.
- **Interiors:** kept the existing building screens over their interior art (via the asset registry), now titled with the town's own building name and a primary "◀ Leave" that returns to the walkable scene at the saved spot.
- **Wild areas:** Old Road (from Dunmere), Thornwood edge (from Greenhollow), Blackwood (from Dunmere, locked until the story opens it), in `src/data/wilds/`. 2–4 visible enemy groups, 3 gathering spots, a camp (1 week: heals health/fatigue, injuries 2 weeks faster) and a boss each. Walking into or tapping a group starts the existing battle with the area's background (`encounter.background`); beaten groups return after 6 weeks (bosses 16–20), gathering spots after 4. On the Old Road the wolf packs give way to bandits once the Wolves contract is done. Battles use the main party, else the four strongest fit heroes.
- **World map:** wild areas are nodes with their own card (what's there, Enter when in the hub town, else Travel to the hub). Town cards keep the existing dossier. An always-visible main quest marker (story pin, or Dunmere until the Old Road contract is done). The old Blackwood marker became the Blackwood node. Arriving (opening done, journey done, entering/leaving a wild area) puts you in that place's scene. Road events unchanged.
- **Navigation:** every scene has World map, Guild Hall, Quest log and Menu, plus a small "Town directory" (the old tile menu) and, in the wild, "Back to <town>". Positions are saved per scene through engine functions (`saveScenePosition`, and on every door, conversation, exit and battle).
- **Engine:** new module `src/game/engine/exploration.js` (after `timeActions.js`); wild-battle conclusion in `encounters.js`; state adds `world.wildAreaId`, `world.exploration`, `flags.dialogue`; `validateGame` checks the wild area. Travel clears the wild area and resets the arrival spot.
- **Removed:** `src/components/DunmereExploration.jsx`, `src/data/dunmere.js`, `src/data/townLayouts.js`, `recordDunmereExploration` (replaced by `recordSceneVisit`/`talkTo`), the old `.town-dialogue` styles and the separate Blackwood map label.
- **Choices to review:** the Guild Hall exists in every town (Dunmere's "Your rooms" also opens it); the Blackwood is reached from Dunmere; wild areas cost no travel time (only the camp does); the town cards on the world map stayed the existing dossier rather than a new smaller card.
- **Not checked:** per the phase rules only the build and the Pages deploy were checked; nothing was played or tested.

- Walkable **Dunmere, Greenhollow, Ironford**, built from small tile layouts (use the `tilemaps` and `level-design` skills): streets, doors, 5–8 NPCs each, and a few points of interest (a well, a statue, a notice board).
- Data-driven **dialogue system** (use the `dialogue-systems` skill):
  - speaker, portrait placeholder, lines, choices with effects (gold, reputation, relationship, quest flags, recruit offers)
  - lines that change with progress (the Old Road cleared, a rank reached)
  - tap anywhere to advance; skip and auto buttons
- **Interiors as scenes:** Tavern, Shop, Arena, Herald and Guild Hall open over interior art (placeholder), with their existing functions.
- **Wild areas** (Old Road, Thornwood edge, Blackwood):
  - small walkable maps with visible enemy groups (no random encounters), gathering spots, a camp to rest, and a boss spot
  - touching an enemy group starts a battle with that area's background
- **World map:** tap a location to see a short card, then travel. A "you are here" marker; the main quest marker always shows.
- Remove the old Dunmere-only exploration code, now superseded.

### Phase 2 — Combat that feels exciting ✅ Done (2026-11-03)

**Notes:**
- **Kept round-based combat** (every hero gets a command, then everyone acts in initiative order). Initiative is now rolled when the round is planned, so the **turn order bar** shows this round in order and the next round by speed; stunned units are marked. Each round records an event list (`encounter.events`) that the battle screen replays beat by beat.
- **Touch flow:** tap a command, then tap the target on the field (enemy sprite or ally plate). Every valid target shows its damage/heal range and WEAK/RESIST; the selected one adds hit and crit chance. Tap it again (or Confirm) to act; tap empty ground to cancel. Area and self skills select all valid targets at once. Skill and item descriptions are shown inline.
- **Rolls:** physical hits can miss (70–99% by speed) and crit (×1.5); primal matchups show as WEAK (×1.25) / RESIST (×0.8).
- **Feedback:** lunge, hit flash and knockback, screen shake on crits and big moments, floating numbers with MISS/CRIT/WEAK/RESIST tags, HP and MP bars that ease down with a lagging ghost, KO tilt and fade, victory hop, effect sprites `fx.slash/pierce/fire/ice/lightning/heal/buff/debuff/poison` (borrowing the old effect art). Beats are ~420 ms (half at 2×). Sounds now play with the animations.
- **Enemy AI:** profiles in `src/data/enemies.js` (brute, caster, healer, skirmisher, tank), utility-style choices in `planFor`. Brutes hit the lowest defense and enrage below 40%; casters pick the hero weak to their primal and retreat (guard 2 rounds) when hurt; healers heal the most-damaged ally, otherwise War Chant / Renew; skirmishers pick off the lowest HP and monsters may flee when alone; tanks taunt and guard. Every enemy shows its plan as an intent chip; the tell is the boss's (or strongest enemy's) plan in the profile's voice.
- **Bosses** (`AREA_BOSSES`): the Grey Alpha (Old Road) summons two wolves at 50%; Captain Rook (Thornwood) turns from tank to brute with Attack up and alternates Blade Dance; the Lantern-eater's brood (Blackwood) charges Lantern Nova every 4 rounds, every 2 below 50%. A Defend halves it; a stun or one hit of 12% max HP interrupts the charge. The story's Hollow Warden got the same charged attack. Intro line and phase banners.
- **Statuses:** poison, burn, stun, guard, attack up, attack down, regen (plus taunt for tanks). Old "buff"/"exposed" became attack up/down; Expose Weakness is now Sap Strength. New skills: Cleric Renew (lv 4), enemy War Chant and Lantern Nova. Stun now costs the unit's next turn (it no longer can expire unused). Icons with turns on every plate; tap a unit for details.
- **Flow:** 1×/2× speed (Settings and in battle, remembered), auto-battle toggle mid-battle (plays rounds animated), Retry battle / Retreat to camp after a wipe in the wild, victory result with XP bars filling and level-up callouts.
- **Encounters:** 3–4 groups per wild area with mixed profiles (Old Road changes after the Wolves contract); Blackwood contracts use the Blackwood roster.
- **Removed:** the instant "Auto" resolve button and its App action, the HP-diff damage pops, badge statuses, `STATUS_LABELS`, the log-parsing battle sounds in App, the old Thornback and Grey Matron bosses, and dead progress-bar battle CSS.
- **Not checked:** only the build and the Pages deploy. Some old combat tests may now disagree (misses, stun timing); they are left for Phase 8.

- **Turn order bar** at the top, showing upcoming turns.
- **Touch flow:** tap a hero's command (Attack, Skill, Item, Defend), then tap the target directly on the battlefield. Show a preview of expected damage or heal and a hit chance.
- **Feedback:**
  - attack lunge, hit flash, screen shake on crits
  - floating numbers; HP bars that ease down with a lagging bar
  - KO and victory poses (placeholders until art)
- **Enemy AI with personality** (use the `game-ai` skill): brutes, casters, healers and cowards with readable patterns, plus the existing "tell". Bosses have phases: a pattern change at 50% HP, and summons.
- **Speed and flow:** 1×/2× speed, auto-battle, retry from the start on a wipe in wild areas, a battle result screen with XP bars filling.
- **Encounters for the slice:** 3–4 enemy groups per wild area, the Old Road wolf pack, a Thornwood bandit camp, and the Blackwood boss.

### Phase 3 — Guild growth: from banner to hall ✅ Done (2026-11-03)

**Notes:**
- **Start:** every campaign begins in the rented room above the Wayfarer: 1 bed (the founder), the banner, a 12-item chest. Rent 20/month replaces facility upkeep. Extra beds can be rented up to 4 (40 crowns, +6/month each). Beds are the only roster limit; the Tavern shows "No free bed" with a Rent a bed / Build bunks / See the old hall shortcut. The first-companion tutorial now mentions renting a bed (its 40-crown reward covers it).
- **The old hall:** for sale once the guild has 30 fame and 2 completed contracts. Buy for 700, or lease for 160 now + 35/month. It brings 2 dormitory beds and 6 empty wings, and unlocks room building and Guild duty (the Office). A milestone moment marks it. The rented room is kept (its beds and rent) until the first Bunk room is finished, then given up automatically.
- **Rooms** (`src/data/rooms.js`, engine `src/game/engine/hall.js`): Bunk room (3 levels, +2 beds each), Training ground (3; +25% XP per level; drills unlock: Fundamentals and Sparring, then Role Drills, then Study), Infirmary (2; injuries heal 2× faster, level 2 cuts death risk ~30%), Armory (chest 12→32, shop −10%, one-step gear upgrades), War room (main party and saved formations, moved here), Scout table (Scouting activity, recruit ranges narrow faster, monthly rumors of elite recruits in other towns), Trophy hall (titles, records, artifacts and bosses on display; +2 fame a month per trophy, up to +10), Treasury (income vs costs; level 2 raises patron loans 50%). Each level has cost, requirement (fame, contracts, trophies, other rooms), weeks and upkeep. One construction at a time; it shows on the hall floor plan and in the Calendar, and ends with a "Construction complete" moment listing what it unlocked.
- **Activities need their room:** Training, Infirmary and Scouting need their room; Guild duty needs the hall; Rest and exhibitions work anywhere. Anything else falls back to Rest. New heroes start on Rest.
- **Stages:** rented room → empty hall (owned) → working hall (3 rooms) → renowned hall (6 rooms, 9 total levels; adds 2 wings). Each stage has an exterior (`town.dunmere.guildhall.stage1–4`, shown in walkable Dunmere, where the hall reads "Old hall · for sale" until bought) and an interior (`interior.guildhall.stage1–4`); every room level has `interior.room.<id>.<level>`.
- **Guidance:** one "Next upgrade" line with a button (no free beds, injuries, no training, unknown recruits, no war room, trophies with nowhere to go…).
- **Upkeep:** rent, lease and each room's upkeep (6–26/month by level) appear in the Treasury and the monthly costs; a full build adds well over 100 a month.
- **Removed:** the ten old facilities (`FACILITIES`, `guild.facilities`, `upgradeFacility`), the Great Hall capacity rule (`heroCapacity`, `headquartersRoomCapacity`, `usedFacilityRooms`), the facility grid on the Headquarters screen (now just the Office: appointments and doctrine), the Academy, Workshop and Hall of Records effects, the Armory's flat party-power bonus, Dunmere's separate "Your rooms" house, and the Great Hall goal (now "A Working Hall").
- **Tests:** per the rules none were written or run. The old facility test and its imports were deleted (they referenced removed functions), and the shared `hireFirstCompanion` test helper now gives the campaign 4 rented beds. The autoplay player rents beds, buys the hall and builds rooms when it can afford them.

- The campaign starts with **one rented room and one bed** (the founder). Hiring needs a free bed.
- The **Guild Hall is built room by room**, each with a cost, a requirement (fame, rank or story step) and a visible effect:
  - **Beds:** more roster slots, in several upgrades.
  - **Training ground:** training XP; levels unlock better drills.
  - **Infirmary:** healing speed.
  - **Armory:** gear slots, plus a discount at the smith.
  - **War room:** saved formations and the main party.
  - **Scout table:** better recruit info.
  - **Trophy hall:** shows titles and records, plus a fame bonus.
  - **Treasury.**
- **Visual progression:** the Guild Hall exterior and interior have 3–4 build stages (placeholder images per stage). Each new room shows up in the walkable town and in the hall scene.
- **"Construction complete" moment** screens. Suggest the next upgrade based on what's limiting the player.

### Phase 4 — Identity and replayability ✅ Done (2026-11-03)

**Notes:**
- **Charters** (`src/data/charters.js`), picked on the new-game screen: Merchant House (contracts +15%, +400 gold and a Trade House contact, salaries +15%; Richest), Free Company (combat XP +25%, hires +10 loyalty, patron gains −40%, no patron loans; Strongest, "without a patron Ally"), Scholars' Lodge (Expedition/Intrigue +6% success, Combat −4%, half-price Scout table, artifacts worth 50% more; Most legendary), Shield of the People (reputation +50%, recruits −20%, road ambushes often turn into helpful peddlers, contracts −10%, a Temple contact; Best connected). Shown in the top bar (with the specialization title) and the Herald; a few Dunmere, Greenhollow and Ironford openers change with the charter.
- **Patrons** (`src/data/patrons.js`): the Dunmere Trade House (Bram Hallow), the Temple of the Dawn in Greenhollow (Brother Alder) and the Ironford Smiths' Guild (Dagna Hale), reusing Phase 1 NPCs as representatives. Stranger → Contact (20) → Partner (60) → Ally (120), Rival at −30. Standing rises with their contracts (+12/+15), gifts (50 G, +6, once a month, via dialogue or the Connections page), dialogue and the Blackwood truth choice (restore → Temple, revenge → Smiths, bury → Trade House); it falls when you decline (−4), let contracts lapse (−2) or fail them (−5), and when you work for their rivals (Trade House work costs Smiths −4 and Temple −2; Smiths work costs Trade House −4; Temple work costs Trade House −1). Unlocks: Trade House shop −5% → a monthly exclusive charter contract (+60% pay) → shop −10% and +25% pay; Temple healing items −25% and faster recovery → an extra Infirmary level and Sister Maelle (a free Rare cleric in Greenhollow) → +25% pay and +5 fame a month; Smiths gear upgrades without an Armory (−20%) → chest +10 and gear −10% → the Oathblade. Contracts in a patron's line of work (Political/Investigation/Tournament, Rescue, Monster Hunt/Dungeon) are often theirs and carry their badge on the board. Connections page in the Herald.
- **Specialization loop:** the specialization title sits in the top bar and the Herald; boards now pick contracts weighted by family reputation (+0.75 per level), the charter's favoured family and Partner patrons' work; the notice board says so in one line.
- **Recruits:** the charter pulls certain classes (30% of tavern recruits; Temple Partner adds clerics). One in five recruits has an objection (spy work, too much blood, merchant houses, no friends in town, crossing the Temple or Smiths, no fame) and refuses with one line while it applies.
- **Paths:** Richest (gold earned, now tracked in `stats.goldEarned`), Best connected (patron standing + regional reputation/10), Strongest (Strength rank, battles and contracts won), Most legendary (legacy, titles, artifacts, trophies, story step, rare recruits). The Path tab in the Herald shows all four with progress toward a Chapter 1 target, marks the charter's path and the leader. Scores are stored monthly in `state.paths` (best path for Phase 6's ending).
- **Removed/merged:** the old alignment choice (Council / Baron / Independent): its action, Headquarters panel, contract modifiers, goal metric and state field. Contract decision options that used to set an alignment now raise Temple (Council) or Trade House (Baron) standing. The promotion flag `guild.charter` was renamed `royalCharter` so `guild.charter` holds the founding charter.
- **Choices to review:** charter numbers are first guesses; patrons only cover Regional contract families; Free Company's signature is shown as a note on its path, not enforced.

- **Founding charter** at new game: choose an ideal that shapes the run. For example:
  - **Merchant House:** richer contracts, trade deals, better connections.
  - **Free Company:** independent; strong combat growth; patrons distrust you.
  - **Scholars' Lodge:** expeditions and artifacts.
  - **Shield of the People:** reputation and cheaper recruits; lower pay.
  
  Each charter has 2–3 modifiers and its own milestone goals.
- **Patrons and factions:** 3 in the slice (the Dunmere Trade House, the Temple, the Ironford Smiths' Guild). Relationship levels open special contracts, recruits and items. Being "best connected" is a real path.
- **Specialization** from contracts completed (the existing reputation) shows as a guild title and perks.
- **Run goals:** a clear end-of-chapter score per path (richest, best connected, strongest, most legendary), so a second run with a different charter feels different.

### Phase 5 — History, records and rankings ✅ Done (2026-11-03)

**Notes:**
- **Season stats** (`src/game/engine/seasons.js`, tallies in `core.js`): `state.seasons[year]` holds totals only. Guild: contracts taken/won/failed (overall and per family), battles won/lost, tournament entries, best finish and titles, gold earned and spent by category (wages, hall, recruits, shop, travel, patrons, loan, other), fame and legacy gained, recruits, heroes released/poached/dead, rank at start/end/best on the three ladders and a monthly rank series. Hero (`h[heroId]`): missions, wins, battles, KOs dealt/suffered, damage, healing, bouts, titles, injuries, levels gained and gold earned (reward split evenly). Biggest win and worst defeat are scored from difficulty and the launch estimate.
- **Season review:** the year closes at the start of the next one (`closeSeasonInPlace` in the annual cycle). Awards: MVP (best season score: wins ×10, missions ×3, battles ×2, KOs ×4, titles ×25, bouts ×2, levels ×5, damage/150, healing/100, gold/100), Rookie of the year (best score among heroes who joined that year, not the founder) and Best signing (rookie score per signing fee). Awards stay on `hero.awards`. The review is a skippable sequence of cards (record, ledger, awards, moments, ladders with a chart, records broken, one line from the strongest patron, else the nemesis, else the town crier) and is kept in `season.review` so it can be reopened.
- **Record book** (`state.records`): guild records (most wins in a season, longest win streak, richest season, most titles in a season, best rank on each ladder, fastest promotion in months, biggest upset by lowest launch estimate) and hero records (career wins, titles, highest level, most KOs in one battle, longest service, gold earned for the guild). The first holder is set quietly; later breaks get a "Record broken!" moment and join the season review. The page compares with the rival holding the most titles and the Strength leader.
- **Hero Career tab** (hero status): stats by year with a career total row, awards and records, contracts (open the report) and the timeline. Rival heroes show their career line and timeline (no per-season stats are kept for them).
- **Mission log** (Chronicle menu): every contract, wild boss fight (`state.bossLog`, 60 kept) and the player's tournament runs; filters for year, type, place, outcome and hero; entries open the existing report.
- **Hall of fame** (Herald): retired, fallen and archived heroes with an award, a record, or a career score of 60+ (wins ×5, titles ×30, missions ×2, awards ×20, records ×15); shows the best season, awards, records and how the career ended.
- **Rankings:** the Guild ladders tab adds a season-by-season chart, best-ever rank and the gap to the next guild on each ladder. Head-to-head with any rival (from Rivals or the guild directory) adds the end-of-season ranks of both guilds (`season.ladder` stores every guild's Strength and Official rank) next to the existing nemesis numbers.
- **Navigation:** Herald tabs Record book and Hall of fame; Chronicle menu pages Mission log and Season reviews. Past reviews also open from the record book.
- **Removed/merged:** the Chronicle's Mission archive, Hall of fame and Records tabs (replaced by the mission log, the Herald hall of fame and the record book) and their CSS.
- **Choices to review:** award and hall-of-fame weights are first guesses; tournament bouts count wins only for individual tournaments; the old `rankHistory` sparkline stays beside the new season chart.

- **Season review every year,** sports style:
  - record (W/L in contracts and bouts), titles, MVP hero, best signing
  - biggest win and worst loss
  - rank movement (Strength, Legacy, Official) with a small chart
  - money earned and spent
- **Record book:** guild records (most wins in a season, longest streak, richest season…) and hero records, with the year each was set. Show "Record broken!" moments.
- **Member pages:** each hero's career stats **by year** (missions, wins, bouts, titles, injuries, level), a timeline, and the contracts they were on.
- **Mission log:** every contract, filterable by year, type, place and hero.
- **Hall of fame** for retired and fallen heroes.
- **Rankings:** the three ladders with history charts, your best-ever rank, and rival comparison.

> **Main story:** [`docs/STORY.md`](STORY.md) ("The Last Banner", by the author) is the source of truth for the story. Chapter 1 = Prologue + Acts I–II (missions 1–8). Phase 6 implements it, together with the new time model and arenas.

### Phase 6a — Time and arenas ✅ Done (2026-11-03)
- **Time only moves when you act.** The calendar gets days (7 a week, 4 weeks a month). Travel takes days (1–4 nearby, 1–3 weeks farther), resting at the Guild Hall (1 week, 1 month, 3 months, with each hero's task set on the same screen) is the only free skip, inns away from home rest 1–3 nights, contracts take their time (the player waits only if the founder goes), camping takes a night. No global skip buttons; the calendar is read-only except "Advance to this date" in the Guild Hall.
- **Arenas as places:** each town's arena is an interior with a fighting ground (referee), a sign-up desk (registrar: this town's tournament only, the rest listed for information) and a history board. Sign up, then be there on the start day; absent is a forfeit. Windmere joins the slice with the Cliff Duels.

**Notes:**
- **Days:** `date.day` (0–6) under the week. `advanceDays` runs travel and mission clocks daily, weekly systems (injuries, construction, side jobs, town events, AI tournaments) when the week rolls over, and monthly ones (upkeep, council report, rival seasons) when the month does. It stops early for battles, decisions, road events, mission games and an active tournament. `advanceWeeks` is now N×7 days; `advanceMonths` and `advanceToNextEvent` are gone.
- **Travel:** `travelDays` from map distance: ≤40 map units is 1–4 days (distance/10), then 1 week (≤60), 2 weeks (≤90) or 3 weeks. Dunmere to Greenhollow, Ironford or Windmere is 3–4 days. Cost is per day per traveller. Road events are planned by day (shortcuts save a day, storms cost one). Travel no longer waits for deployed companies.
- **Home and party:** the Guild Hall is in Dunmere (`HOME_LOCATION_ID`). Away from home (another town, the road or the wild), the travelling party is the main party, or else the founder plus the strongest fit heroes (up to 4). They skip their hall task; everyone else keeps it. The lodges in Greenhollow and Ironford still open the roster, but resting there points to the inn.
- **Resting:** `restAtHall(weeks, tasks)` sets the tasks chosen on the rest screen, then passes 1, 4 or 12 weeks. Tasks still pay off at each month start, so a one-week rest mid-month resolves no training; the rest screen says when the next payoff is. `restAtInn(nights)` costs 6 G per traveller per night, heals the party (+12 HP, −15 fatigue a night) and only works away from home. Camping passes 1 day (+20 HP, −20 fatigue, a week off injuries).
- **Contracts:** each active mission has a `dueDay`; `remaining` (weeks) is derived from it. If the founder is in the party, `launchExpedition` waits until the company is back (`advanceUntilMissionReturns`). Otherwise no time passes and the player keeps exploring.
- **Arenas:** `getArenaView` (`tournamentEntry.js`) feeds `ArenaScreen`. `signUpForTournament` requires being in the host town before the start day and a hero meeting the rules, and pays the fee (tallied as "tournaments" in season spending). On the start day (day 1 of its week), `startScheduledTournamentsInPlace` seats the hero and starts the bracket if the guild is in town and the hero is available; otherwise it is a forfeit (−5 fame, fee lost). Bouts start from the referee. The history board shows champions by year, the title record, repeat winners and the player's best result, with a link to the Herald's Tournament legends tab (`RankingsScreen` takes `initialTab`).
- **Windmere:** in the slice and on the world map, with an arena, shop, tavern (inn) and notice board, and the 8-hero Windmere Cliff Duels (month 5, Lv 2+, 5 fame, 40 G). It has no walkable layout yet, so it uses the town directory.
- **Calendar:** entries in other towns show "you are N days away"; signed-up tournaments are marked. "Advance to this date" and "Rest until week N" appear only in the calendar inside the Guild Hall's rest screen (and the engine refuses away from home).
- **Removed:** the top-bar "+1 week", "+1 month" and "Wait until…" buttons and their CSS; the "Wait for the company" button; `TournamentsScreen` (its guild championships moved to `GuildChampionships.jsx`, shown at the registrar only when the slice stops hiding them); instant tournament entry (`enterHeroTournament`); the tutorial's unused `advanceMonth` hook; dead tournament CSS.
- **Choices to review:** guild championships still use the old enter-now flow (outside the slice). Weekly systems (injuries, construction) still tick per week, not per day. Inn and travel prices are first guesses.

### Phase 6b — The Last Banner, Chapter 1 ✅ Done (2026-11-03)

**Notes:**
- **Story system** (`src/data/story.js`, engine `story.js`): 12 missions; 1–8 playable, 9–12 locked "Chapter 2" stubs. A mission opens on its gate or any alternative, then walks its steps: scenes (`src/data/dialogue/story.js`, `storyAct2.js`), story contracts (routes per charter or choice), checks and story duels. Progress runs after every engine action (a finalize hook), never on the calendar. Evidence, the Lore codex (`src/data/lore.js`), story choices and story recruits live in `state.story`. The story is optional: other systems never wait for it; it gives recruits (Nessa, Bram, Wren), two unique accessories, patron standing, the Blackwood edge and lore.
- **Gates** (one line each):
  - 1 A Banner Without a Hall: after the prologue (skip tutorial does it for you). Rent the stable: pay 160, work 2 days, or a charter route (Merchant haggles to 100, Free Company runs off squatters, Shield gets the neighbours, Scholars cite the deed for 80).
  - 2 The Tavern at the Crossroads: after mission 1. Mara Fen, then Nessa (free; needs a bed).
  - 3 Wolves on the Old Road: after mission 2. Corwin Pell, the guaranteed-winnable contract with one-line battle hints, then his thanks.
  - 4 The Dunmere Harvest Melee: after mission 3 (any regional tournament also counts). Bram Calder's dare, sign up, fight (any result), the Argent Crown's warning, then "Tutorial complete".
  - 5 The Herbalist's Witness: 3 contracts won after Act I; or Temple Contact; or Known in the Verdant Marches. Maren's errand (Expedition), skipped by showing the seven names (prologue) or Shield of the People.
  - 6 The Ledger of Ironford: 6 contracts won; or Smiths Contact; or Known in the Crownlands. Infiltrate (Intrigue) or negotiate (Diplomacy); Merchant buys it (300), Free Company forces it (Combat), Scholars decipher it (Expedition).
  - 7 The Fighter Who Never Lost: 60 fame; or fought in any Cliff Duels; or a level 5 Duelist. Fight in the Cliff Duels and duel Halden Marsh; Free Company challenges him at once; Rook's confession skips the duel.
  - 8 The Last Scout: 3 pieces of evidence; or Nessa at 70+ loyalty; or Temple Partner. Protect Wren (Combat; Intrigue to spirit her away; Shield: Diplomacy), her account, then the banner scene at home.
- **Prologue:** Scene 01 plays as written in the walkable house; the four choices give the clues from the implementation notes (hide → Mara trusts you; banner → the seven names, which also unlock a route in mission 5 and Wren's trust; search → Rook's confession, evidence and a route in mission 7; flee → you recognise the enforcer in missions 4 and 6). The guild is named on the last card; the banner is a relic artifact.
- **Act I and the hall:** the campaign starts in June 1187 in the founder's house (one bed). Mission 1 leases the old stable on Banner Plaza; rooms are built there and it can be bought outright later. The Melee is in week 2 of July, about five weeks in; its hint points to the hall's rest screen. "Skip tutorial" at new game names the guild, rents the stable, hires Nessa and marks missions 1–3 done.
- **Act II and the end:** Nessa's brother Tobin runs through missions 5, 6 and 8; Bram can join after Windmere if you answered his dare with respect. The banner scene follows the outcome: companion (you brought Wren back and Nessa is with you or you read the seven names), ally (brought back otherwise, or no free bed), helper (she stayed hidden). Then a chapter summary and the Chapter 2 teaser; free play continues.
- **World setup:** the Argent Crown (National, Mooncourt, Garrick Thorne as star) replaces Crown Champions; the King's Shield is the Crownfall Tournament ("the King's Tourney") with nine Argent Crown titles and a vacated 1183. Renames: Captain Rook → Captain Vask, Bram Hallow → Corwin Pell, Sella Rowan → Mara Fen, Mara Veyne → Tessaly Rune, Nessa Briar → Nell Briar; Aldric, Bram, Wren, Garrick and Rook left the name pools. The Blackwood is its east edge only, with the Hollow Warden on the path.
- **Quest Log and codex:** Main / Side / Guild / Done tabs, Show on map everywhere, a marker toggle; quest markers sit on the NPC holding the current scene. The Lore codex (Chronicle menu) unlocks from the story, the Dunmere herald and Old Fen (Thorne's official story), arena history boards and first visits.
- **Removed:** the Fallen Banner opening, its room and assets, the intro card, the old onboarding steps and every tutorial target, the old Blackwood arc (beats, story event cards, the Warden finale boss, its perks and item), the rented room and rent-a-bed, the old hall purchase, the free founding-appeal recruits (and their data), and `notePartySelection`.
- **Fixed:** recruiting at the tavern crashed since Phase 5 (the signing fee was set before the hero existed).
- **Dialogue pass (2026-11-03):** every conversation rewritten to the rules in [`docs/DIALOGUE.md`](DIALOGUE.md) (style guide, shape with the Iven Quill example, voice notes, audit table). The format gained hub `topics` (versions by id, asked ones remembered in `world.exploration.asked`), `bye`, `leave` and `decide` (ask, then decide, in story scenes). People in buildings speak by personality or role with names, return openers, topics with asked marks and an interview hub. Authored STORY.md scenes kept.
- **Choices to review:** gate numbers and contract difficulties are first guesses; Windmere still has no walkable streets, so its scenes play on arrival; Bram and Wren join only with a free bed.

- Implement [`docs/STORY.md`](STORY.md) Chapter 1: the prologue ("The knock at the door", the first choice and naming the guild), the tutorial (Act I missions 1–4, ending with the Dunmere Harvest Melee and the Argent Crown's warning) and Act II (missions 5–8, ending on the Wren banner scene).
- Follow the story's implementation notes: the 12-mission story system with 9–12 as locked Chapter 2 stubs, evidence tracking, quest-log gates, the renames, the Argent Crown as a real rival, and the Broken Lantern's seven.
- **Main quest guidance:** a quest marker on the world map and in town, and a quest log entry with the next step.
- **Chapter end:** the Wren banner scene, a chapter summary (season-review style) and a teaser for Chapter 2. Free play continues afterwards.

### Phase 7A — Touch-first UI/UX ✅ Done (2026-11-03)

**Notes** (details, flows and open issues in [`docs/UX.md`](UX.md)):
- **Gestures** live in `src/components/gestures.js` (long-press, swipe, vibration), `useDraggable.js` (pointer drag and drop onto `data-drop` targets, with a ghost label) and `usePanZoom.js`. Settings: Drag gestures / Tap only, vibration, show hints again (`settings.gestures`, `haptics`, `seenHints`).
- **Combat:** drag a hero onto a unit; resting on it opens a radial menu of only the valid actions (release on one to act); previews on targets (damage or heal, hit chance, WEAK/RESIST, ☠ when lethal); area actions light every affected unit; tap hero, target, action as the fallback; long-press any unit or turn-order icon for its card; hold to fast-forward; Undo, Auto and speed stay.
- **Exploring:** no context button (tap to go; the joystick is optional); icons over doors and people; long-press a label to peek; the goal chip walks to the current story step or opens the map; the world map pans and pinches; dialogue holds to fast-forward and swipes up for a log.
- **Guild:** the party bar's heroes drag onto hall rooms (tiles show who is inside), War room zones and contract slots; items drag onto heroes in the Armory (live stat preview) and onto hero rows in the shop; the rest dial (1–91 days, snapping to just before events) replaces the three rest buttons (`restAtHall(days, tasks)`); recruits swipe as cards; hero pages swipe and explain stats and skills on long-press.
- **Layout:** one interruption queue in `App.jsx`; back via the top-bar ◀ or a left-edge swipe; bottom panels swipe down to close; disabled buttons say why (`Button why=`); money is "gold" everywhere the player reads it; long menu descriptions cut.
- **Removed:** the battle command lists (Attack/Skill/Item menus, confirm step) and their CSS, the walk context button and its CSS, the Armory's equip and "Use on" dropdowns, the three fixed rest buttons (`HALL_REST_WEEKS`).
- **Choices to review:** the drag dwell (260 ms) before the radial opens, the 400 ms long-press, and the rest dial's uneven scale (days, weeks, months) are first guesses.

- One gesture language for the whole game (tap, drag and drop, long-press to inspect, swipe, hold to fast-forward; no double-tap; every gesture has a tap fallback and a "Tap only" setting), written at the top of `docs/UX.md`.
- Combat by dragging a hero onto a target, with a radial menu of valid actions, previews, long-press unit cards, undo, hold to fast-forward and vibration.
- Exploring by tapping (no context button by default), icons over people and doors, long-press peeks, a goal chip that walks you to the quest, a pan-and-zoom world map, dialogue with hold and a log.
- Guild management by drag and drop (rooms, party, items and gear), a rest dial on a timeline of events, swipeable recruits and hero pages.
- Bottom panels instead of pop-ups, primary actions in the thumb zone, minimal text, one name per thing, one interruption queue, consistent back. `docs/UX.md` holds the gestures, screens, navigation, flows with tap counts, glossary and open issues.

### Phase 7B — Asset list (for the art AI)
- Finalize `docs/ASSETS.md`: every placeholder in the game, grouped. For each asset list:
  - id
  - file path
  - pixel size and aspect
  - where it's used
  - style notes
  - a ready-to-use generation prompt in the HD-2D style
- Expected groups:
  - **Towns (walkable):** tilesets or backgrounds for Dunmere, Greenhollow and Ironford; props (well, statue, stalls, trees, lamps).
  - **Building exteriors:** Guild Hall in 4 build stages, tavern, shop, arena, herald, notice board, houses.
  - **Interiors:** tavern, shop, arena hall, herald office, and the Guild Hall rooms (rented room, beds, training ground, infirmary, armory, war room, scout table, trophy hall, treasury).
  - **Battle backgrounds:** road/field, forest, Thornwood camp, Blackwood, mountain pass, temple interior, tavern interior, arena, mine/cave.
  - **Characters:** hero class sprites (idle, attack, cast, hurt, KO, victory; 4-direction walk for exploration); NPC sprites; portraits.
  - **Enemies:** per area, plus 2–3 bosses.
  - **World map:** the slice region, with locked areas under fog.
  - **UI:** icons (stats, items, rooms, factions), frames, cursor, title logo.
  - **Effects:** hit, slash, fire, heal, buff, level-up.
- Placeholder fallback stays, so art can arrive in batches.

### Phase 7C — Game HUD, menus and walk-in buildings ✅ Done (2026-11-03)
**Part 1 ✅ Done (2026-11-03).** Notes (details in [`docs/UX.md`](UX.md) §2 and [`DESIGN.md`](../DESIGN.md)):
- **Removed:** the sidebar, the top bar and its journal, the mobile bottom bar, the town-scene button stack (SceneHud), the Town directory (TownScreen) and the Chronicle menu (MenuScreen), PixelIcon and UpcomingStrip. Windmere got a small walkable layout so every slice town is walkable.
- **HUD** (`src/hud/Hud.jsx`): place tag + goal line, ledger (reacts to gold, fame and rank changes), Guild and World orbs (tap or press-slide-release, badges, labels for the first four uses), keyboard shortcuts.
- **One screen template** (`src/hud/Section.jsx`, `sections.jsx`): every section and building screen; Records merges the old Chronicle and the Herald's tabs; System holds save, settings and credits.
- **Layout:** zone, layer, radius and type tokens (`tokens.css`); a rewritten `shell.css`; safe areas and `100dvh`; a web app manifest and crest icons (`scripts/app-icons.mjs`).
- **Visual language:** one icon set through `<Icon>` (game-icons.net + Phosphor, CREDITS.md); two fonts (Cinzel dropped) and five sizes; intentional placeholders with a "Show asset ids" developer setting.
- **Battle:** heroes stand on the battlefield; the drag starts from the sprite with a ghost under the finger; name plates tap. **Dialogue:** a full-width parchment box at the bottom, large choice rows, a name plate and portrait, the log as a bottom panel.
- **Choices to review:** older screens inside sections are flattened but not yet rebuilt as list + details; notices fade after 6 s; the orb arc (80°→2°, 156 px).

**Part 2 ✅ Done (2026-11-03).** Notes (details in [`docs/UX.md`](UX.md), "Buildings and people"):
- **People model** (`src/game/engine/people.js`): regulars from `src/data/people.js`; visitors built on the existing data (recruits = candidates, petitioners = contracts grouped by issuer, challengers = candidates with `boutFirst`), rotating monthly; memory in `state.people`. Bouts use `createDuelEncounter` (`sourceType: 'person-bout'`).
- **Interiors** (`src/data/interiors.js`, `InteriorScene.jsx`): tavern/inn, shop, arena and herald rooms that fit one screen; "?" over strangers, offer icons once met; services open their panels.
- **Hiring is an interview** (about, skills → scout level 2, terms with reasons to refuse); **contracts come from people** (take → notice board, turn down → a rival); **Contacts** in the Guild orb.
- **Moved inside:** Mara Fen (the Wayfarer's bar; her story hint updated), Rowe Fallow and Mags (now innkeepers with a service; their street conversations removed).
- **Removed:** the tavern recruit list (HeroesScreen's recruit tab), the dialogue recruit picker, the Herald-as-a-screen building, the "first contract" callout, "Go inside" dialogue choices, the tavern/herald building sections.
- **Choices to review:** a room holds at most 7 people; 3 recruits and 1 challenger per town each month; bout stakes (+3 / −1 fame); petitioners stand in the shop or the herald when their issuer fits, else the tavern. The arena panel still shows its three spots (also walkable in the room).

A visual phase (screenshots allowed, see `CLAUDE.md`). Two parts:
- **Part 1 — HUD, orbs, ledger and visual language.** One HUD instead of four navigations: a fading place-and-date tag (top left), the Guild orb (Party, Items, Guild Hall, Quests, Contacts; bottom left), the World orb (Map, Calendar, Records, System; bottom right) that fan out like the combat radial, and a ledger (gold, fame, ranks, title, specialization; top right) that opens itself when a value changes. One screen template for every section, defined screen zones, one z-index scale, safe areas, a web app manifest, one icon set (game-icons.net + Phosphor through `<Icon>`), two fonts and five sizes, intentional placeholders, battle drag from the sprite, a full-width dialogue box.
- **Part 2 — Walk-in buildings and people.** One people model (name, role, place, look, memory, offers: mission, hire, challenge) replacing the recruit, contract-giver and challenger lists; every building is a small walkable room that fits one screen; you discover offers by talking; hiring is an interview; the notice board lists the contracts people gave you; Contacts in the Guild orb. The Guild Hall interior is left for 7D.

### Phase 7D — The Guild Hall compound
Own pass: an empty lot with a small cabin that grows into a full compound (bedroom wings, training yard with stat equipment, infirmary, vault…).

**1. Lots, renting, buying and expanding ✅ Done (2026-11-03).** Notes:
- **Data model** (`src/data/lots.js`, `state.guild.lots`, `hqLotId`): several lots in several cities are supported, each with slots, rent, deposit, purchase price, starter rooms and expansion steps. Moving headquarters is model-only (no UI).
- **No hall, no hires:** before story mission 1 the founder's house has one bed (theirs). Recruits talk, but "What would it take to sign you?" ends with "Where would I sleep? Come back when you have a hall." Shown in the tavern, Contacts and the quest log (`HireGate`). Recruiting, offers and story recruits all check it; no exceptions.
- **Renting** (mission 1): the Dunmere lot, 6 slots, 35 gold a month; a small cabin (Bedroom level 1, 2 beds) already stands in one slot. The old "dormitory corner" beds are gone.
- **Buying:** 6,000 gold (years of saving); ends the rent; a milestone moment and a Chronicle entry. **Expanding** (owned only): 6 → 8 slots (3,500 gold, 6 weeks), 8 → 10 (6,500, 10 weeks).
- **Money:** the ledger shows costs a month (rent, rooms, wages), the savings rate and progress toward the deed or the next land; the Guild Hall and Treasury show the "Buy the property" / "Expand the lot" goal with an "at this rate" estimate.
- **The outside looks the same** at every stage (one exterior asset). No lot diorama yet, so expansions do not widen anything on screen.
- **Also:** the main party (a lead and up to three companions) no longer needs a War room; the lead takes the first slot of every arrangement, and the War room keeps saved formations. Before renting, the hall reads "Empty lot". Fixed the hall door opening an empty section.
- **Founding moved to the banner:** a new game asks only the founder's name and class (the founder is Fire-born, from Dunmere); the guild's name, motto and charter are chosen on the founding card when Rook's banner is in your hands (end of the prologue). Skipping the tutorial shows the same card first. The charter's starting gift is applied then (`applyCharterInPlace`).
- **Choices to review:** prices, rent and expansion costs are first guesses (balance comes in Phase 8); the savings rate averages up to the last six months; Gideon's lines in mission 1 now describe the yard and the cabin (docs/STORY.md says "a disused stable or guild office", which still fits).

### Phase 8A — Full Chapter 1 playthrough: audit and fix everything
The one pass where everything gets caught: play the prologue, the tutorial and the first towns end to end like a player (touch, phone and desktop), log every bug, layout problem, unclear screen and balance problem in docs/PLAYTEST_CH1.md, fix all of it, build the waiting specs in docs/specs/, and replay to prove it. Playing, screenshots, engine scripts and `npm run sim` are allowed in this phase.

### Phase 8 — Polish, balance and testing
- Turn the safety net back on: restore the full testing policy, put `npm test` back in `.github/workflows/deploy-pages.yml` (removed after Phase 3), add tests for the new systems, and run `npm run sim` for balance (the slice should take 2–3 hours; promotion near the end).
- Touch QA on phone and tablet sizes, performance (60 fps in walkable scenes on a mid-range phone), save stability.
- Then the Impeccable pass once real art has arrived.

## 5. Order and dependencies

```
Phase 0 → Phase 1 → Phase 2 ┐
                   Phase 3 ─┼→ Phase 6 → Phase 7A → Phase 7C → Phase 7D → Phase 7B → Phase 8
                   Phase 4 ─┤
                   Phase 5 ─┘
```

Phases 2–5 can run in any order after Phase 1. Phase 6 needs the towns, combat and growth in place. Phase 7B (assets) can be updated continuously but is finalized last.

## 6. Rules for every phase
- Testing: only `npm run build` and a successful GitHub Pages deploy until Phase 8. No playthroughs or screenshots, except in visual phases (7C, 7D, 8), which take screenshots to review layout.
- Touch first: design every interaction for a thumb on a 390px phone, then check tablet and desktop.
- No keyboard-only actions and no hover-only information.
- Placeholders through the asset registry, never hard-coded colors standing in for art.
- Keep the engine pure and deterministic. Exploration position and flags go in state through engine functions.
- Stay inside the slice. Anything for later chapters goes in a "Later" list at the bottom of this file, not into the game.

## Later (not in Chapter 1)
- National and Global tiers, more regions, guild championships, branches, succession, mentorship lines, artifact custody history, alignment, sagas.
- Music.
