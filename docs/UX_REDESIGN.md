# UX redesign: 16-bit JRPG

This pass replaces the "Midnight Guild Atlas" direction (dark navy app shell, Cinzel/Manrope, soft gradients), which only restyled the shell and still read as a web dashboard. The game now looks and plays like Final Fantasy III/VI and early Dragon Quest on a modern screen. It is a visual and UX pass only: no engine, rule or state changes, and every action, route and screen is still reachable. The system itself is documented in [`DESIGN.md`](../DESIGN.md); product intent in [`PRODUCT.md`](../PRODUCT.md).

## Direction

- **Windows everywhere.** Every panel is a Dragon Quest-style window: solid deep-blue fill (`#12205e`), a 1px black outline and 3px white edge with chamfered pixel corners, drawn by one 9-slice `border-image` (`--frame` in `src/styles/base/tokens.css`). No glass, blur, gradients on panels or soft shadows. Groups inside a window use dashed rules or a darker inset box; windows never nest.
- **Type.** Pixelify Sans (pixel face) for headings, menus, numbers, buttons, battle text and labels, never below 14px. Atkinson Hyperlegible for reading text (descriptions, story, chronicle, hints) and anything that would need to be smaller. Tabular numbers for stats, gold and ranks.
- **Menus.** Short vertical command lists with a pixel ▶ cursor on the hovered, focused or selected row. Arrow keys move through any `data-menu` list and Enter activates (`useMenuKeys` in `src/components/UI.jsx`). Buttons are framed command buttons, not pills. Tabs are command strips.
- **Colour.** Palette sampled from the art. Gold (`#ffcf4a`) is only money, prestige, titles and rank-ups. HP green, MP blue, damage red, XP purple, five rarity colours and seven primal colours are tokens.
- **Art.** Interface pixel art (frames, cursor, 30 one-colour 12×12 `PixelIcon`s, the pixel crest, the generated overworld) is always pixelated. The HD-2D art pack in `public/art/` is shown crisp at 1× and smoothed when shrunk for avatars, as its art plan recommends.
- **Motion.** 100–200ms stepped motion: window open, cursor nudge, damage numbers popping, HP bars draining in steps. Fanfare only on victory, level-up and rank-up. `prefers-reduced-motion` and the in-game setting make it instant.

## What changed per screen

- **Title screen and new campaign.** Town-square scene behind a logo window (pixel crest, title) and a Continue / New Game menu with one row per save slot plus a Delete command. The founder preview in the new-campaign dialog shows the chosen class portrait on its primal ground.
- **Status strip and dock.** The top bar is one window: date (opens the calendar), +1 week / +1 month / Wait until…, location, gold, three ranks with movement arrows and the status title. World / Guild / Chronicle is a command dock: labelled column on desktop, icon column on tablet, bottom bar on phone.
- **Party bar.** Each hero is a small status window (portrait, name, Lv, activity, HP and fatigue bars, warning blink). On phone it shrinks to portrait plus HP.
- **World map.** A generated pixel overworld (`public/ui/overworld.png`, from `scripts/make-overworld.mjs`) with terrain by each settlement's primal, stepped dashed routes, framed town tiles, a bouncing "You are here" pointer, skull boss markers, the Blackwood marker, pins, and small dimmed lock tiles for locked towns. The location window sits beside it on desktop and below it on phone, with the destination list underneath.
- **Town.** The town-square scene with the name window; buildings as a command menu with pixel icons and counts; each building opens with its own scene banner (tavern, notice board, arena, harbor market, strategy hall, throne hall) and a back command.
- **Guild Hall rooms.** Rooms as an icon menu; inside a room, heroes are status rows (portrait, name, Lv, status, HP and fatigue, controls).
- **Notice board, tavern, arena, herald.** Contracts are a cursor list with the planner window beside it; recruits are a single-column list inside the market window; arena events are windows; ladders are tables with a header row, the player row highlighted and arrows for movement.
- **Shop.** Classic layout: Buy / Sell tabs and the item list on the left, the item window with stats and a per-hero comparison (▲/▼ against what each hero wears) on the right, gold at the bottom.
- **Hero status.** Portrait top left, class, tags, XP / health / fatigue bars, a two-column stat table, attributes, then equipment beside skills, then contract, room, character, relationships, career and actions.
- **Battle.** Full-screen front view: the location's scene with enemies centred and named, the Tell window on top, the command window (Attack / Skill / Item / Defend with the ▶ cursor, auto-focused for keyboard play, Escape backs out), a message window for the log, and party status windows along the bottom. Targets get a blinking ▼ cursor; damage and heal numbers pop over units with a slash or heal effect.
- **Moments and reports.** Victory (headline, gold, XP per hero with portraits, loot list), level-up (stat-gain table), recruit introduction (dialogue box), rank-up fanfare with the crown, rankings update table, council and expedition reports, event cards. Story beats, town events and road events are dialogue boxes with a speaker tab.
- **Chronicle pages.** Calendar as one window with weeks as rows; quest log, chronicle timeline, news feed, codex, bestiary and settings in the same windows and lists.

## Removed CSS

The previous cascade (31 files, about 2,300 lines with heavy overrides) was replaced, not layered on. Deleted: `premium-atlas.css`, `screens/wave5.css`, `screens/places.css`, `screens/world-travel.css`, `screens/tournament-universe.css`, `screens/hall.css`, `screens/herald.css`, `components/formations-reports.css`, `components/dossier.css`, `components/council.css`, `components/combat.css`, `components/objective-ribbon.css`. Their live rules were folded into the new per-area files (`town.css`, `moments.css`, `shop.css`, `hero-status.css`, `tournaments.css`, `rankings.css`, …); about 140 selectors that no component used anymore were dropped.

## Verification

`npm run build` passes and ESLint is clean. Screenshots at 390×844 and 1440×900 are in [`docs/screenshots/`](screenshots/) (title, new game, world map, town, Guild Hall, tavern, notice board, hero status, shop, active battle, victory, calendar, herald, chronicle). No horizontal page scroll at either size. The e2e smoke test was updated for the "New Game" label but not run, per the prototype testing policy.

## Known gaps

- At 1440px the status strip wraps to two rows; rank names show as icons only below 1700px (they keep tooltips and screen-reader labels).
- Many in-content glyphs (mission families, formation, status icons) are still Unicode symbols; the pixel icon set covers navigation, buildings, rooms, Chronicle pages, map markers and the status strip.
- Story beats have no speaker portraits: story cards carry no speaker, so the dialogue box names the source (the Blackwood story, a festival, the town crier) instead.
- Reports, the codex, legacy office and headquarters screens were restyled through the shared window/list system but not individually screenshot-reviewed.
- The new HD-2D art pack (`public/art/`, added during this pass) is not part of these commits; the UI is already sized for it.
