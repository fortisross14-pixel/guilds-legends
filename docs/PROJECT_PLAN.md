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

One phase per agent session. Each phase ends with a playable build pushed to `main` and a short summary. Prototype-mode testing rules from `CLAUDE.md` apply until Phase 8.

### Phase 0 — Foundations and touch (do first)
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
- **Done when:** the opening room and Dunmere play smoothly by touch on a phone, with no "Space" anywhere and no restarts on state change.

### Phase 1 — Explore: towns, interiors, NPCs and the world map
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

### Phase 2 — Combat that feels exciting
- **Turn order bar** at the top, showing upcoming turns.
- **Touch flow:** tap a hero's command (Attack, Skill, Item, Defend), then tap the target directly on the battlefield. Show a preview of expected damage or heal and a hit chance.
- **Feedback:**
  - attack lunge, hit flash, screen shake on crits
  - floating numbers; HP bars that ease down with a lagging bar
  - KO and victory poses (placeholders until art)
- **Enemy AI with personality** (use the `game-ai` skill): brutes, casters, healers and cowards with readable patterns, plus the existing "tell". Bosses have phases: a pattern change at 50% HP, and summons.
- **Speed and flow:** 1×/2× speed, auto-battle, retry from the start on a wipe in wild areas, a battle result screen with XP bars filling.
- **Encounters for the slice:** 3–4 enemy groups per wild area, the Old Road wolf pack, a Thornwood bandit camp, and the Blackwood boss.

### Phase 3 — Guild growth: from banner to hall
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

### Phase 4 — Identity and replayability
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
- Turn the safety net back on: restore the full testing policy, add tests for the new systems, and run `npm run sim` for balance (the slice should take 2–3 hours; promotion near the end).
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
- Touch first: design every interaction for a thumb on a 390px phone, then check tablet and desktop.
- No keyboard-only actions and no hover-only information.
- Placeholders through the asset registry, never hard-coded colors standing in for art.
- Keep the engine pure and deterministic. Exploration position and flags go in state through engine functions.
- Stay inside the slice. Anything for later chapters goes in a "Later" list at the bottom of this file, not into the game.

## Later (not in Chapter 1)
- National and Global tiers, more regions, guild championships, branches, succession, mentorship lines, artifact custody history, alignment, sagas.
- Music.
