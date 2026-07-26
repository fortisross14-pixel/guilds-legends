# Guilds of Legend

A Vite + React + TypeScript management simulation vertical slice based on the Guilds of Legend game design document.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The Vite `base` is set to `./`, so the generated `dist` can be deployed to GitHub Pages or any static host.

## Included systems

- Guided onboarding through explicit, ordered goals
- Longer seasonal and legacy objectives after the tutorial
- Hero careers, attributes, aging, form, fatigue, injuries and history
- Mission assignment and month-based resolution
- Rival guild simulation and rankings
- Political alignment choice
- Headquarters upgrades and economy
- Chronicle and historical scoring
- Local browser save

## GitHub Pages

Build the project and publish the `dist` folder, or add a GitHub Actions workflow for Pages. Because assets use relative paths, it works from a repository subdirectory.
