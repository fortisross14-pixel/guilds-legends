# Guilds of Legend

A long-form guild management and historical-career simulation built with React and Vite.

You are both the founding hero and the institution that outlives generations: recruit specialists, create mission arrangements, travel between primal cultures, compete with rival guilds and preserve every career in the Chronicle.

## v1.3 — The Primal Roads update

This build adds the strategic layer requested after the v1.2 field-report and map pass:

- **Visible hero progression:** every hero has a level from 1 to 20, current XP and an explicit next-level bar.
- **Three-part hero identity:** rarity, class and primal each solve a different roster question.
  - Rarity: Common, Uncommon, Rare, Epic or Legend; controls potential, salary and signing cost.
  - Class: Guardian, Duelist, Ranger, Rogue, Cleric, Mage, Berserker, Bard, Artificer or Beastmaster; controls formation-role fit.
  - Primal: Fire, Air, Water, Plant, Animal, Psychic or Iron; controls combat matchups and cultural alignment.
- **Primal matchup system:** each primal defeats one and is vulnerable to another. Diplomacy rewards affinity with the patron’s culture.
- **Local mission economy:** contracts, recruitment and tournament registration only work in the guild’s current settlement.
- **Travel:** moving the guild costs crowns and in-game months. Active expeditions and tournaments must conclude first.
- **Eighteen destinations:** four Regional settlements, ten total by National status, and eighteen by Global status.
- **Local recruitment markets:** candidate level and rarity increase both signing fees and monthly salaries. Each settlement favors specific classes and its dominant primal.
- **Tournament geography:** Local, Professional and Elite licenses are separate from physically reaching Dunmere, Tidecross or Ashen Caldera.
- **Persistent resource strip:** gold and fame remain visible at the top on desktop and mobile.
- **Responsive world interface:** the full route map is used on large screens; phones receive a touch-friendly destination list and location dossier.
- **IndexedDB saves:** no campaign is serialized into localStorage, avoiding the quota crash from the early prototype.

## Core game systems

- Three campaign save slots
- Founder creation: guild name, player name, class and primal
- Guided opening orders that teach recruitment, arrangements, time and field reports
- Combat, Diplomacy, Expedition and Intrigue formations with up to five explicit roles
- Mission results from Catastrophic to Legendary, key-moment decisions and detailed reports
- Clickable mission and tournament archives in the Chronicle
- Slow monthly training XP and faster mission/tournament XP
- Injuries, aging, retirement, death, renown, legacy and complete hero histories
- Rival guild simulation, rankings, titles, fame and institutional rise or decline
- Headquarters rooms, facilities, appointments and building limitations
- Regional → National → Global promotion
- Sagas, artifacts, political alignment, inherited dreams and long-term achievements

## Run in VS Code

Install Node.js 20 or later, open the project folder and run:

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

The regression suite currently covers:

- deterministic campaign generation
- founder level, rarity and primal initialization
- the complete guided opening and mission report
- primal combat advantages and disadvantages
- training-based level progression
- local-only contracts and travel arrival
- recruitment price scaling
- tournament license versus physical-location rules
- Regional-to-National thresholds
- headquarters room limits
- save export/import
- 25-year simulation stability
- 100-year save-size stability

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Copy the **contents** of this folder into the repository.
3. Do not commit `node_modules` or `dist`; both are already in `.gitignore`.
4. Push to the `main` branch.
5. Open **Settings → Pages** and choose **GitHub Actions** as the source.
6. The included workflow installs dependencies, runs tests, builds and deploys `dist`.

The Vite configuration uses `base: './'`, so it works under a repository subpath.

## Save architecture

Campaigns are stored in IndexedDB. The save layer:

- catches storage failures rather than crashing React
- compacts old chronicle and career data if necessary
- supports JSON export/import
- removes obsolete oversized prototype keys
- keeps century-long campaigns below the tested browser-save target

## Project structure

```text
src/
  components/       Reusable UI primitives and hero taxonomy badges
  data/             Classes, missions, formations, primals, locations and goals
  game/
    engine.js       Deterministic simulation, progression, travel and game rules
    storage.js      IndexedDB save system
  screens/          Guild, missions, heroes, tournaments, world and archives
  styles/           Responsive visual design system
  App.jsx           Shell, resources, save slots, actions and report modals
  main.jsx          React entry point

tests/
  engine.test.js    Regression and long-run simulation tests
```

## Design priorities

1. The next useful action should be visible within seconds.
2. Early orders are exact; later goals explain the destination without prescribing every click.
3. Recruitment is a strategic commitment, not merely buying a larger number.
4. Location creates opportunity cost: the perfect recruit or tournament may require a costly journey.
5. Rarity, class and primal must each matter without replacing team composition.
6. Every important result becomes a readable event now and a historical record later.
