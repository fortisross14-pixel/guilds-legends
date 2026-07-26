# Guilds of Legend

A long-form guild management and historical-career simulation built with React and Vite.

You are not the chosen hero. You are the institution that discovers heroes, puts them under one banner, survives their failures, and preserves their names after they are gone.

## What is in this build

- Three campaign save slots stored in **IndexedDB**
- The Broken Lantern opening scenario in Year 1187
- Eight explicit opening orders that teach the loop one action at a time
- Long-term campaign goals and optional achievements after the tutorial
- Ten hero classes, six party roles, training, appointments, injuries, aging, retirement, death, renown, and full career histories
- Twenty-eight mission templates across Local, Regional, National, Continental, and World play
- Key-moment choices with graded outcomes from Catastrophic to Legendary
- Eight rival guilds with distinct strategies, stars, finances, titles, promotions, and failures
- Individual tournament brackets and tactical approaches
- Seven regions, four multi-stage sagas, artifacts, political alignment, and inherited-will stories
- Eight upgradeable headquarters facilities
- Guild rankings, historical hero rankings, records, artifacts, sagas, and a searchable Chronicle
- Monthly simulation, next-event advancement, season advancement, and yearly advancement
- Responsive desktop, tablet, and phone layouts
- GitHub Pages deployment through GitHub Actions

## Run in VS Code

Install Node.js 20 or later, open the project folder in VS Code, and run:

```bash
npm install
npm run dev
```

Vite will show a local address, usually `http://localhost:5173`.

## Test and build

```bash
npm test
npm run build
npm run preview
```

The automated simulation tests cover:

- deterministic campaign generation
- the complete guided opening
- Local promotion thresholds
- 25-year simulation stability and progression
- 100-year save-size limits
- content breadth and duplicate-state validation

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Copy the contents of this project into it. **Do not commit `node_modules` or `dist`.**
3. Commit and push to the `main` branch.
4. In the repository, open **Settings → Pages**.
5. Set **Source** to **GitHub Actions**.
6. Open the **Actions** tab and confirm that “Deploy to GitHub Pages” passes.

The included Vite config uses a relative base path, so the same build works whether the repository is named `guilds-of-legend` or something else.

## Save architecture

The previous prototype failed because it repeatedly serialized the entire campaign into `localStorage`, which has a small quota. This build:

- stores campaign data in IndexedDB
- keeps only one tiny optional last-slot preference in localStorage
- catches every storage error instead of crashing React
- compacts old chronicle and career history if a browser refuses a normal save
- supports JSON export and import from the Settings screen
- removes the known oversized legacy prototype keys when the database opens

## Project structure

```text
src/
  components/       Reusable interface primitives
  data/             Classes, missions, rivals, goals, regions, facilities
  game/
    engine.js       Deterministic simulation and game rules
    storage.js      IndexedDB save system
  screens/          Complete game screens
  styles/           Responsive visual design system
  App.jsx           Save slots, shell, actions, modals, navigation
  main.jsx          React entry point

tests/
  engine.test.js    Long-run simulation and balance tests
```

## Design priorities

1. The next important decision must be understandable within seconds.
2. Early instructions are exact; later ambitions explain the destination without dictating the method.
3. Great heroes matter, but composition, support, risk, finances, and time remain relevant.
4. Rival guilds produce believable successes and failures rather than waiting beneath the player.
5. Historical truth is stored as facts; the Chronicle and rankings interpret those facts.
6. Long campaigns broaden decisions instead of multiplying repetitive clicks.


## v1.2 update

- Responsive world map: desktop route map becomes a touch-friendly region browser on phones.
- Headquarters room limits: the Local rented hall has four physical rooms; new facilities require a free room, while upgrades reuse their existing room. Promotions and Great Hall expansion increase capacity.
- Founder-first opening, specialist mission formations, detailed expedition reports, clickable mission history and tournament divisions remain included.
- Engine regression suite: 8 tests covering onboarding, room limits, long simulation, backups and save size.
