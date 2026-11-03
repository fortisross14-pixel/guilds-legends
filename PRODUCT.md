# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Players on phones, tablets and desktop who grew up with (or love) 16-bit console RPGs and want a long-running guild-management game. They come back for short sessions: a few weeks of game time, one contract, one battle, a look at the rankings.

## Product Purpose

Guilds of Legend lets a player found, run and remember a fantasy guild: recruit heroes at the tavern, take contracts from the notice board, fight turn-based battles, climb three ranking ladders and keep a chronicle that outlives every founder. The world is deterministic and seeded, so every campaign is a reproducible history.

## Positioning

A retro 16-bit JRPG (the menus, windows and battles of Final Fantasy III/VI and early Dragon Quest) wrapped around a guild-management and rankings game. The JRPG layer gives personal attachment to each hero; the management layer gives rival guilds, contracts, money and a world that keeps moving.

## Operating Context

The loop is: look at the world map, walk into town, prepare a party, commit to a contract or tournament, fight, collect the reward, check the rankings, and read the chronicle. Play alternates between the overworld, town menus, battles and records. Touch is the main input on phones; keyboard and mouse on desktop, where arrow keys and Enter should drive menus the way a controller would.

## Capabilities and Constraints

React 18 + Vite 5, plain JS/JSX. The engine (`src/game/*`) is pure and deterministic and is product truth; the UI is a thin layer that calls engine actions. Pixel art in `public/art/` (portraits, sprites, enemies, effects, scenes) is the visual source of truth and must be shown crisp. Asset URLs go through `import.meta.env.BASE_URL` (GitHub Pages subpath). No new runtime dependencies; Google Fonts and small files in `public/` are allowed.

## Brand Commitments

Guilds of Legend looks and feels like a 16-bit JRPG on a modern screen: Dragon Quest-style windows (solid deep-blue fill, white pixel frame), a pixel typeface for anything the player reads at a glance, short command lists with a ▶ cursor, and crisp pixel art at whole-number scales. It is not a dark web app, a dashboard or a card grid. Gold means money and prestige, never decoration. Class drives hero art, rarity drives the portrait frame colour, primal drives the portrait ground; rarity and primal stay separate systems.

## Evidence on Hand

All game content, systems and pixel art live in this repository. The creative direction comes from the project owner; no outside brand claims or references are invented.

## Product Principles

- The next thing to do is always one menu entry away, with the cursor already on it.
- Heroes are characters with faces, levels and stories, not table rows.
- Victories, level-ups and promotions get a ceremony; routine actions get a crisp, quick response.
- Phones get one window at a time with big targets; wider screens show more windows side by side, never a denser dashboard.
- The world and the guild's place in it (date, gold, ranks) are always visible in the status strip.

## Accessibility & Inclusion

Every control works with keyboard (arrows + Enter in menus) and assistive technology; icon-only buttons carry labels. Touch targets are at least 44px. Focus is always visible (the ▶ cursor plus an outline). Text that would be too small in the pixel face switches to the readable face instead of shrinking. `prefers-reduced-motion` and the in-game reduced-motion setting turn movement into instant state changes.
