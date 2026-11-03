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

### Phase 5 — History, records and rankings
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

### Phase 6 — Story: Chapter 1, the Blackwood
- Rewrite the Blackwood arc with the `narrative-design` skill: **6–8 beats** connecting the three towns and the wild areas, 3–4 memorable NPCs, one rival guild involved, and a choice at the end with lasting effects.
- **Main quest guidance:** a quest marker on the world map and in town, and a quest log entry with the next step.
- **Story recruits:** 2 unique heroes join through the story, each with a personal side quest.
- **Chapter end:** an ending scene, a chapter summary (season-review style), and a teaser for Chapter 2. Free play continues afterwards.

### Phase 7 — Asset list (for the art AI)
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

### Phase 8 — Polish, balance and testing
- Turn the safety net back on: restore the full testing policy, put `npm test` back in `.github/workflows/deploy-pages.yml` (removed after Phase 3), add tests for the new systems, and run `npm run sim` for balance (the slice should take 2–3 hours; promotion near the end).
- Touch QA on phone and tablet sizes, performance (60 fps in walkable scenes on a mid-range phone), save stability.
- Then the Impeccable pass once real art has arrived.

## 5. Order and dependencies

```
Phase 0 → Phase 1 → Phase 2 ┐
                   Phase 3 ─┼→ Phase 6 → Phase 7 → Phase 8
                   Phase 4 ─┤
                   Phase 5 ─┘
```

Phases 2–5 can run in any order after Phase 1. Phase 6 needs the towns, combat and growth in place. Phase 7 can be updated continuously but is finalized last.

## 6. Rules for every phase
- Testing: only `npm run build` and a successful GitHub Pages deploy until Phase 8. No playthroughs or screenshots.
- Touch first: design every interaction for a thumb on a 390px phone, then check tablet and desktop.
- No keyboard-only actions and no hover-only information.
- Placeholders through the asset registry, never hard-coded colors standing in for art.
- Keep the engine pure and deterministic. Exploration position and flags go in state through engine functions.
- Stay inside the slice. Anything for later chapters goes in a "Later" list at the bottom of this file, not into the game.

## Later (not in Chapter 1)
- National and Global tiers, more regions, guild championships, branches, succession, mentorship lines, artifact custody history, alignment, sagas.
- Music.
