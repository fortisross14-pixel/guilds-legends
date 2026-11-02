# Guilds of Legend — Audit (v1.9)

Audit date: 2026-11-02. Scope: whole repo (`src/`, `tests/`, configs, assets), checked against the game's goals:

1. **Old-school 2D pixel JRPG feel** (FF3 / early Dragon Quest) with combat
2. **Recruiting and team building**: meet, hire, fire, train
3. **Open world**: take or refuse contracts, choose to specialize or explore
4. **Stats and rankings as the signature feature**: strength ranking, legacy ranking, official tournament ranking ("am I a global power or just starting?")

The code is maintained by one person plus Claude and ChatGPT, so the advice favors small, testable steps.

---

## 1. Summary

**What's solid**
- `npm test` passes all 46 tests, and `npm run build` works.
- The simulation is deterministic (seeded RNG), so bugs can be reproduced. That's rare in hobby projects and very useful for AI-assisted work.
- Long campaigns hold up. A simulated 60-year campaign gives a ~1.7 MB save, ~15 ms state clone and ~15–25 ms per month advance, with no NaN values and no validation errors.
- Saves go to IndexedDB with a compaction fallback, export/import and an error boundary.
- The rival universe already exists: 30 guilds, 150+ heroes, 8 recurring titles, title histories and a GOAT list. The rankings fantasy has a good base.

**Main problems**
1. **Too much scope for its size.** There are 11 screens and many systems (branches, succession, mentorship, inherited ambitions, artifact custody, promises, sagas, alignment, council). None of them is deep yet, and the four core pillars are diluted.
2. **It doesn't feel like FF3 or Dragon Quest yet.** It looks like a modern dark dashboard with lots of text. Party combat uses a single shared HP/stamina pool, with no per-hero turns, MP or items. 16 enemy sprites, 14 effect sprites and 11 of the 12 scene images are never used.
3. **Rankings, the signature feature, are one opaque blended score** (fame, legacy, titles, power, form, points). The three separate ladders you want (strength, legacy, official) don't exist as separate things.
4. **The codebase is hard for AI tools to edit.** `src/game/engine.js` is 4,525 lines, with no linter or types, and the README has drifted from the code. Both Claude and ChatGPT will make conflicting or partial edits in a file that size.

---

## 2. Bugs found

All checked by running the code (engine scripts or a headless browser) unless marked *code reading*.

| # | Severity | Bug | Where | Fix |
|---|---|---|---|---|
| B1 | **High** | **Hero portraits and sprites break on GitHub Pages.** Image paths are absolute (`/art/portraits/x.png`). Under `user.github.io/guilds-legends/` they point to the domain root and 404. The CSS backdrop works because Vite rewrites CSS URLs, but JSX strings are left alone (checked in `dist/`). | `src/components/UI.jsx:42`, `:52` | Use `` `${import.meta.env.BASE_URL}art/portraits/${artKey}.png` `` |
| B2 | **High** | **Bankruptcy soft-lock.** Upkeep keeps draining gold below zero, and debt has no consequence besides a "Fallen" badge (tested: −2,000 went to −2,384 over 12 months, loyalty unchanged). With negative gold you also can't launch a mission ("needs 55 crowns for supplies") or travel ("requires 80 crowns"). If the player runs dry, the campaign can't recover. Tests miss this because `simulateAutoplay` quietly hands out an "emergency patron advance". | `engine.js:2067-2074` (upkeep), `:1334` (supplies), `:1076` (travel) | Add a real debt path: a patron loan or advance-paid contracts, plus consequences (loyalty loss, heroes leaving after N months unpaid). Add a test with no patron aid. |
| B3 | Medium | **No game-over or refound flow when the whole roster dies.** `ensureGuildmasterInPlace` returns `null`, the guildmaster stays a dead hero, and the UI keeps showing tutorial step 1. | `engine.js:1862` | Detect "no active heroes": offer to refound (new founder plus an emergency recruit) or end the campaign with a final chronicle. |
| B4 | Medium | **Importing a backup overwrites the current slot almost immediately.** The message says "Save now to replace this slot permanently", but autosave writes it to the slot 0.7 s later. Importing into the wrong slot loses that campaign. | `src/App.jsx` `importSave` | Ask "Import into slot N? This replaces it." first, or import onto the home screen into a chosen slot. |
| B5 | Low–Med | **The Rankings screen always shows `state.heroes[0]` (the founder) as your guild star**, even after the founder dies or retires. | `src/screens/RankingsScreen.jsx` `GuildLadders` | Use the strongest active hero, or the current guildmaster. |
| B6 | Low | **Firing a hero is the same as retiring them.** The history text says "the career may continue elsewhere", but the hero disappears from the world. | `engine.js:2625` `releaseHero` | Move released heroes into `freeAgents` so rivals can sign them (good story material). |
| B7 | Low | **World map routes don't connect the cities.** The paths are hardcoded and stretched by `preserveAspectRatio="none"`, so they show as broken diagonal bars (visible in the screenshot). | `src/screens/WorldScreen.jsx:45-48` | Generate path segments from `LOCATIONS` coordinates and add `vector-effect="non-scaling-stroke"`. |
| B8 | Low | **Autosave can race a delete.** A pending autosave timer (≤700 ms) can fire while `deleteCurrent` is awaiting and write the slot back. | `src/App.jsx` `deleteCurrent` | Clear the autosave timer, or set a "deleting" flag before deleting. |
| B9 | Low | The Council Report modal can open on top of the playable mission modal: its open condition checks `activeEncounter` but not `activeMissionGame`. *(code reading)* | `src/App.jsx` `CouncilReportModal open=` | Add `&& !state.activeMissionGame`. |
| B10 | Low | Logic duplicated in the UI: the XP bar uses `70 + level*30` instead of `xpForNextLevel()`, and the seed hashing in `App.jsx` duplicates `hashString`. | `src/App.jsx` | Import the engine helpers. |
| B11 | Hygiene | `vite.config.ts` imports `@vitejs/plugin-react`, which isn't installed. It's ignored only because `vite.config.js` takes precedence, but it misleads AI tools. Also tracked but unused: `tsconfig*.json`, `*.tsbuildinfo`, `vite.config.d.ts`. `dist/index.html` is committed despite `.gitignore`. | repo root | Delete them. Keep a single `vite.config.js`. |
| B12 | Hygiene | The README says v1.8 at the top while `package.json` says 1.9.0, and it links five docs that don't exist (`PHASE4_v1.8.md`, `QA_REPORT_v1.8.md`, …). | `README.md` | Rewrite the README as a short "what the game is, how to run it, where things live". Keep the changelog in `CHANGELOG.md`. |
| B13 | Hygiene | Unused art: `public/art/enemies/*` (16), `public/art/effects/*` (14), `public/art/scenes/*` (11 of 12). | `public/art` | Use them in Wave 4 or delete them. |

---

## 3. Feedback per pillar

### 3.1 JRPG feel and combat
- **Now:** Duels are good: enemy tells, guard/feint/recover and class signatures are a nice "read the enemy" loop. Party combat, though, is one shared HP bar where you pick a lead and one order. That's closer to a card-game abstraction than to FF3 or DQ.
- **Gap:** There are no per-hero HP or MP, no per-character command menus (Fight / Skill / Defend / Item), no visible enemy party, and no consumables.
- **Recommendation:** Build a **front-view, Dragon Quest-style battle screen**: enemies drawn in the middle (the unused enemy sprites), party status windows at the bottom, one command per hero per round, simple MP and skills per class, and items. Keep **Auto-battle** for routine fights. Keep the "enemy tell" idea from duels as the twist. That twist is your edge over a plain clone.
- **Visual identity:** Use a pixel font for headings and numbers (e.g. "Press Start 2P" or "Pixelify Sans"), DQ-style framed windows (blue or black panels with a white 2 px border), less prose per card, and `image-rendering: pixelated` everywhere (it's partly there already).
- **Realism note for AI tools:** Claude and ChatGPT write battle logic well. They are **bad at consistent pixel art**. Pick one CC0 or purchased sprite pack and its palette, and don't mix in AI-generated images.

### 3.2 Recruiting and team management
- **Now:** Rarity, personality, flaws, dreams, demands/promises vs buyout, salaries, mentorship and relationships give a good base.
- **Gaps:**
  - The only negotiation choice is "accept the promise" or "pay the buyout". There's no salary haggling and no contract length.
  - Contracts never expire. There's no renewal drama and no free agency for your own heroes.
  - Firing deletes the hero from the world (B6).
  - Rivals poach from each other, but you can't poach from them, and they can't poach from you.
  - Candidate stats are fully visible, so scouting doesn't reveal anything.
- **Recommendation:** Add **contracts** (years and salary) with renewal talks. Make candidate stats **ranges** ("Might 40–60") that Scouting narrows. Make released and expired heroes **free agents** who can join rivals. Make **poaching** work in both directions, driven by loyalty.

### 3.3 Open world and specialization
- **Now:** 18 destinations, travel costs time and gold, local contract boards and recruit pools, primal regions.
- **Gaps:**
  - Turning down a contract has no effect; it just expires.
  - "Specializing" has no mechanical identity beyond which formations you happen to use.
  - Travel has no road events.
  - The map routes are broken (B7).
- **Recommendation:**
  - Track **reputation per mission family** (Combat, Diplomacy, Expedition, Intrigue) and per region. High reputation brings better contracts and a perk ("Monster Hunters: +10% vs beasts"). This makes specializing a real choice.
  - Contracts you decline go to a rival, who gets the fame. Patrons remember being refused.
  - Add 1–2 random **road events** per trip (ambush, merchant, wandering recruit).

### 3.4 Rankings (the signature feature)
- **Now:** Regional, National and Global guild ladders all use one composite score: `fame*1.7 + legacy*1.05 + titles*72 + power*3.8 + form*1.5 + careerPoints*0.35 + seasonPoints*2`. There's also a hero GOAT list with weighted components. The player can't tell *why* they rank where they do.
- **Recommendation:** Make three **separate, readable ladders**, each for guilds and for heroes:
  1. **Strength ranking**: current power (average of the top 5 heroes for guilds, hero power for individuals). It moves quickly.
  2. **Legacy ranking**: all-time points from missions completed, weighted by difficulty and grade. It never decays.
  3. **Official ranking**: tennis-style tournament points (e.g. Regional winner 250 / National 1000 / Global 2000 / World Conclave 4000, scaled by round reached), **counting only the last 12 months**. This is what gives a status title: *Unknown → Contender → Regional Power → National Power → Global Power*. Tie promotions to it.
- **UX that sells it:**
  - Show movement arrows (▲3 ▼1) and a small rank-history sparkline.
  - Show "312 points to pass Ironveil (#7)".
  - Put an end-of-season "Rankings update" screen in the council report.
  - Put the three ranks permanently on the Guild Hall (top bar today shows a single rank).

---

## 4. Remove, merge or defer

There's too much on the screen. Cut to the pillars:

| Item | Recommendation |
|---|---|
| **Goals** screen | Merge into the Guild Hall as an "Objectives" panel |
| **Legacy** screen | Merge into Chronicle (history) and Rankings (records) |
| Branches, succession, inherited ambitions, artifact custody history | **Freeze them** (no new work) and unlock them only at Global tier. They're endgame systems; nothing in the first 10 hours needs them. |
| Two tournament fight modes (tactic dropdown `fightHeroTournamentRound` vs tactical combat `beginHeroTournamentCombat`) | Keep one: tactical combat plus auto-resolve. Remove the tactic-roll path. |
| Alignment, sagas | Keep only if they feed into specialization/reputation (§3.3). Otherwise hide them. |
| Four time buttons | Keep "+1 month" and "Next event". Drop "+Season", and hide "+1 year" until the tutorial ends (today a new player can skip a whole year on step 1). |
| Long flavor text on every card | Shorten it to one line, with "more" on click. |

Target navigation is 7 items: **Guild Hall, World/Map, Missions, Roster, Tournaments, Rankings, Chronicle** (Settings goes in a menu).

---

## 5. Improvement waves

> **Note (2026-11-02):** Waves 2–6 below are replaced by [GAME_VISION.md](GAME_VISION.md). Waves 0–1 stand as written.

Each wave is sized so one person with AI help can ship it in roughly 1–3 weeks. **Don't start a wave until the previous one's tests pass.**

### Wave 0: Stabilize (1–3 days) — ✅ Done (2026-11-02)

> Notes: B10 swaps the UI seed hash for the engine's `hashString`, so a given seed text now generates a different world than v1.9 did (saves are unaffected). Autoplay keeps its "emergency patron advance"; the new B2 test proves recovery without it.
- Fix B1–B10.
- Repo hygiene: B11–B12. Delete stray TS/config files and `dist/`, and rewrite the README.
- Add `CLAUDE.md` / `AGENTS.md` (same content) with:
  - the rules: "engine is pure and deterministic; never use `Math.random`; every rule change needs a test; run `npm test` before committing"
  - a file map
  - the state shape
- Add ESLint and Prettier, and run them in CI.
- **Done when:** no high bugs remain, CI runs lint, test and build, and the Pages deploy shows portraits.

### Wave 1: Make the codebase AI-friendly (1–2 weeks, no gameplay changes) — ✅ Done (2026-11-02)

> Notes: the engine split uses 21 modules instead of the 10 suggested. Many actions call `evaluateStateInPlace`, so goals, rankings and institution internals had to sit below the action modules to avoid cycles. The CSS split kept contiguous ranges in cascade order (the built CSS is byte-identical), so the 3-screen visual comparison was skipped as redundant. Typecheck is wired up, but most values are still implicitly `any`; annotating the public functions with the new typedefs is a follow-up.
- Split `engine.js` into modules of 300–600 lines each:
  - `state.js` (create/clone/rng)
  - `economy.js`
  - `recruitment.js`
  - `missions.js`
  - `tournaments.js`
  - `rankings.js`
  - `rivals.js`
  - `progression.js`
  - `legacy.js`
  - `save/migrate.js`
- Re-export everything from `engine/index.js` so the UI imports don't change. Do one module per PR and run the tests after each.
- Add JSDoc `@typedef` for `GameState`, `Hero`, `Guild` and `Mission`, and enable `// @ts-check` in the engine. This gives AI tools a contract to follow.
- Add `npm run sim -- --seed 42 --years 20`, printing a yearly gold, fame, rank and roster table. Use it to check balance after every change.
- Add one Playwright smoke test: create a campaign, visit every screen, advance a year, and assert no `.fatal-screen` and no console errors.
- Split `index.css` (1,911 lines) per screen.

### Wave 2: Rankings as the hook (1–2 weeks)
- Build the three ladders × (guild, hero) from §3.4, in a new `rankings.js` with unit tests (points table, 12-month rolling window, tie-breaks).
- Store a rank snapshot every month (just rank numbers, so it stays small) to power the arrows, sparklines and "points to next".
- Add status titles, and tie promotions to the official ranking instead of the hidden composite.
- Add the end-of-season rankings report, and show the three ranks on the Hall.

### Wave 3: Recruitment and team depth (2 weeks)
- Contracts (length and salary), expiry, renewal negotiation and loyalty-driven demands.
- Fog-of-war on candidate stats, with Scouting to narrow it.
- Released and expired heroes become free agents. Poaching works both ways.
- Make team chemistry (the existing relationships data) visible in the party builder, as a small bonus or penalty.

### Wave 4: JRPG look and battle (2–3 weeks)
- Front-view per-hero battle (commands, HP/MP, skills, items) built on the current deterministic combat engine, with auto-battle kept.
- Use the enemy, effect and scene sprites. Add a pixel font and DQ-style windows.
- Optional: short sound effects (hit, level-up, victory jingle) with a mute toggle.

### Wave 5: Open world and specialization (2 weeks)
- Reputation per mission family and region, with specialization perks.
- Declined contracts go to rivals; patrons have memory.
- Road events during travel. Fix the map rendering properly (B7) and make it the main hub screen.

### Wave 6: Trim and polish (ongoing)
- Apply the merges and cuts from §4, and onboarding that teaches only the four pillars.
- Balance pass using `npm run sim` across 10 seeds. Targets: Regional promotion around year 2–4, National around year 6–10, Global around year 15+.

---

## 6. Working with Claude, ChatGPT and yourself

- **One tool per branch or PR.** Don't let two assistants edit the same file in parallel. With a 4,500-line file they will overwrite each other's work; Wave 1 reduces this.
- **Give each request a small scope:** one wave item, the files involved, and "add or adjust tests". Paste the relevant section of this audit into the prompt.
- **Keep the engine pure:** UI → engine function → new state. Everything that changes rules gets a test with a fixed seed. This is already the pattern, so protect it in `CLAUDE.md`.
- **Keep docs small and current:** a README, a `CHANGELOG.md` and this audit. Delete design docs once implemented rather than keeping stale ones.
- **Don't switch frameworks.** React and Vite are fine for a menu-heavy management RPG. A front-view battle screen doesn't need Phaser. Reconsider only if you later want a walkable tile overworld.
