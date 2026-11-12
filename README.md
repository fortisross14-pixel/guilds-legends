# Guilds of Legend

A browser guild-management RPG built with React and Vite. You start as a level-1 founder with no company. You recruit heroes, take contracts, travel between cities, enter tournaments and climb the Regional, National and Global ladders. The campaign can run for centuries: heroes age, retire and die, and the chronicle remembers them.

The simulation is deterministic. Every campaign runs from a seed, so any bug can be reproduced.

## Run

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Test and build

```bash
npm test           # full suite (fast + long), what CI runs
npm run test:fast  # everything except the long simulations, a few seconds
npm run test:long  # 20–100 year seeded simulations, ~20 s
npm run lint
npm run typecheck  # JSDoc types over the engine
npm run test:e2e   # Playwright smoke test, uses installed Chrome
npm run build      # outputs dist/
npm run preview    # serve the built dist/
```

The game is hosted on **Vercel**: every push to `main` is built and deployed there (Vite preset: `npm run build`, output `dist/`). On GitHub, the "Build" workflow (`.github/workflows/build.yml`) runs lint and the build as a check. `vite.config.js` uses `base: './'`, so the site also works under a subpath.

## File map

```text
src/
  App.jsx               App shell: save slots, navigation, modals, UI action wiring
  main.jsx              React entry point
  components/           Shared UI (UI.jsx primitives, combat/mission/council modals)
  screens/              One component per nav screen (Hall, Missions, Heroes, …)
  data/                 Static content: classes, missions, formations, world, rival universe
  game/
    engine.js           Public engine API (re-export barrel)
    engine/             Engine modules: core, heroes, missions, tournaments, rankings,
                        economy, time, save, autoplay, … (see CLAUDE.md)
    types.js            JSDoc types for the game state
    combat.js           Deterministic duel and party combat
    missionGames.js     Playable Diplomacy / Expedition / Intrigue challenges
    legacy.js           Branch, ambition and artifact definitions
    storage.js          IndexedDB save slots, export/import
  styles/               index.css imports per-area files (base, layout, components, screens)
scripts/sim.mjs         npm run sim -- --seed 42 --years 20: yearly balance table
tests/
  engine.test.js        Engine regression tests (test:fast)
  long.test.js          Long-horizon seeded simulations (test:long)
  e2e/smoke.spec.js     Playwright smoke test (test:e2e)
docs/AUDIT_v1.9.md      Current audit and improvement plan
CHANGELOG.md            Version history
CLAUDE.md / AGENTS.md   Rules for AI assistants working on this repo
```

Saves live in IndexedDB (three slots). The save layer compacts old detail to keep century-long campaigns small, and supports JSON export and import.
