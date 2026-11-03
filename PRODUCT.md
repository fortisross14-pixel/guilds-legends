# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Players on phones, tablets and desktop who love story-driven console RPGs (Octopath Traveler, Triangle Strategy, the Dragon Quest HD-2D remakes, Sea of Stars) and want a long-running guild-management game. They come back for short sessions: a few weeks of game time, one contract, one battle, a look at the rankings.

## Product Purpose

Guilds of Legend lets a player found, run and remember a fantasy guild: recruit heroes at the tavern, take contracts from the notice board, fight turn-based battles, climb three ranking ladders and keep a chronicle that outlives every founder. The world is deterministic and seeded, so every campaign is a reproducible history.

## Positioning

An HD-2D guild RPG: pixel-art characters and places presented with modern light, depth, elegant type and restrained menus, wrapped around guild management, rival guilds and rankings. It should feel like a new premium console game with a retro soul, not an emulator and not a web dashboard.

## Operating Context

The loop is: look at the world map, walk into town, prepare a party, commit to a contract or tournament, fight, collect the reward, check the rankings, and read the chronicle. Play alternates between the overworld, town menus, battles and records. Touch is the main input on phones; keyboard and mouse on desktop, where arrow keys and Enter drive menus the way a controller would.

## Capabilities and Constraints

React 18 + Vite 5, plain JS/JSX. The engine (`src/game/*`) is pure and deterministic and is product truth; the UI is a thin layer that calls engine actions. The HD-2D art pack in `public/art/` (portraits, sprites, enemies, effects, scenes, primal grounds; see `public/ART_LIBRARY_PLAN.md`) is the visual source of truth. Asset URLs go through `import.meta.env.BASE_URL` (GitHub Pages subpath). No new runtime dependencies; Google Fonts and small files in `public/` are allowed.

## Brand Commitments

Art first: scenes, the map and characters fill the screen, and the interface floats over them on dark translucent panels with thin brass edges. Elegant serif display type for names, places and ceremonies; a clean sans for menus and data; no pixel font in the interface. Warm gold means money, prestige and the primary action. Light, depth and gentle motion (vignettes, glow, drifting dust, eased panels) make it feel current. Class drives hero art, rarity drives the frame and glow, primal drives the ground; rarity and primal stay separate systems.

## Evidence on Hand

All game content, systems and art live in this repository. The creative direction comes from the project owner; no outside brand claims or references are invented.

## Product Principles

- The art leads; the interface is a quiet layer of light over it.
- The next thing to do is always one menu entry away, with the cursor already on it.
- Heroes are characters with faces, levels and stories, not table rows.
- Victories, level-ups, promotions and story beats get a ceremony; routine actions get a quick, smooth response.
- Phones keep the art on screen and move detail into bottom sheets; wider screens float more panels, never a denser dashboard.

## Accessibility & Inclusion

Every control works with keyboard (arrows + Enter in menus) and assistive technology; icon-only buttons carry labels. Touch targets are at least 44px. Focus is always visible (the glowing cursor plus an outline). Text over art sits on a scrim or panel dark enough for 4.5:1 contrast. `prefers-reduced-motion` and the in-game reduced-motion setting remove ambient motion and make transitions instant; typed-out text appears at once.
