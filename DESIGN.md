# Guilds of Legend Design System

<!-- impeccable:design-schema 1 -->

## Direction

**Midnight Guild Atlas** — an illuminated field guide to a living institution. The world map is the front door; the guild hall, town destinations, and chronicle are places in a shared world rather than pages in an application. A compact command dock makes the three primary places immediately reachable: World, Guild, and Chronicle. Contextual actions stay near the thing they affect.

The system is built code-first. Direction seed: `seed:702e83464620b45e`.

## UX Audit

The incumbent UI has strong mechanics and art but often presents them through web-product conventions: broad lists of similarly weighted panels, tabs within tabs, generic dashboard headers, small all-purpose icons, and many places where a player must read labels before understanding priority. Hero, mission, and battle content frequently compete with the persistent administrative shell. Phone layouts mostly collapse desktop grids instead of changing the composition or interaction model.

The replacement makes the current place, active situation, and next consequential action visible before secondary information. It retains every current destination and engine action, but changes their hierarchy: world and guild status lead, teams are character-forward, and records are treated as a history to browse.

## Concepts considered

1. **The Banner House** — a painterly headquarters with rooms as the entire navigation system. Emotionally rich, but too indirect for the map-first travel and competition loop.
2. **The Tournament Broadcast** — a sports-network shell where standings and events lead. Excellent for prestige, but would diminish recruitment, legacy, and quiet preparation.
3. **The Traveling Codex** — an illustrated campaign journal with locations as chapters. Great for history, but it risks burying fast recurring actions.
4. **The War Table** — a tactical planning table with map and formation controls always visible. Clear under pressure, but too martial and narrow for an institution spanning generations.
5. **Midnight Guild Atlas** — selected. A deep-night atlas makes discovery and travel the front door while a warm lantern core makes the player’s guild feel like home. The signature move is the **living route line**: the current location, active mission, return, and next event share one subtle line of travel across World, Guild, and Chronicle contexts.
6. **The Hall of Names** — an archival memorial organized around hero legacies. Distinctive for long campaigns, but too retrospective for early play.
7. **The Caravan** — a portable command kit that keeps the party together on a strip. Strong on mobile, but would make fixed places feel interchangeable.

## Navigation

- **World** is the game’s opening view and the primary discovery surface. It answers where the guild is and what is within reach.
- **Guild** is the home command surface. It resolves to the current town and guild rooms, with the hall, tavern, notice board, herald, shop, and arena as recognizable destinations.
- **Chronicle** contains history, goals, legacy, settings, and persistent records.
- The command dock sits at the thumb edge on phones and becomes a left rail on wider screens. It never hides the current location or time controls.
- The party rail is a persistent, character-first shortcut. It is a roster and a status signal, not a miniature table.
- High-commitment actions use dedicated layers or full-screen moments; routine inspection does not.

## Color and semantic language

| Role | Value | Use |
| --- | --- | --- |
| Night | `#07121f` | page ground and battlefield edge |
| Slate | `#10243a` | elevated command surfaces |
| Deep teal | `#163c49` | active navigation and exploratory context |
| Lantern | `#e7b84f` | primary commitment, earned prestige |
| Ink | `#eaf2f5` | primary text |
| Mist | `#aec2cf` | secondary text |
| Danger | `#d96965` | irreversible or critical state |
| Ready | `#82c99a` | availability and successful completion |

Primal color is reserved for hero backgrounds, effects, affinity, and a small amount of contextual emphasis. Rarity stays on portrait frames and reward treatments only: neutral, green, blue, violet, and gold. They never substitute for one another.

## Type, space, and surfaces

The display voice is **Cinzel** for ceremonies, location names, and victory moments; **Manrope** handles controls, prose, and dense data. Tabular figures use `font-variant-numeric: tabular-nums`.

Space follows a 4px rhythm: 4, 8, 12, 16, 24, 32, 48. Surfaces are dark slate planes separated by hairline seams and a single soft, offset shadow; gold is an action signal, not a border treatment. Rounded frames are reserved for hero portraits, control groups, and protected overlays. Large panels gain composition through art, labels, and content hierarchy rather than repeated metric-card grids.

## Interaction and motion

Every actionable control has a 44px target minimum, a visible pressed state, focus ring, disabled state, and textual label where the action is not obvious. On phone, selection happens through direct portrait taps and bottom sheets; tablet uses adjacent detail panes; desktop adds efficient pointer states without relying on hover.

Routine feedback takes 140–220ms: a button settles inward, a selected hero frame illuminates, a panel opens along its dominant axis. Ceremony moments may use 420–700ms with spatial continuity. `prefers-reduced-motion` turns movement into immediate state changes.

## Responsive composition

- **Phone portrait:** one clear primary task, bottom command dock, horizontally safe party rail, stacked detail sheets, and persistent date/state.
- **Tablet landscape:** map or place view leads; secondary details sit beside it; party and time remain visible.
- **Desktop:** uses the same zones as tablet with a permanent rail and wider art-led staging. It does not become an enterprise dashboard.

## Component contracts

- `Button`, `Modal`, progress, hero portrait, rarity, and primal primitives remain the common interaction foundation.
- Place screens own local context; the shell owns global position, party, time, navigation, and interruption layers.
- `HeroPortrait` always receives class art, rarity-frame, primal-background, and status independently.
- Battle owns the viewport while it is active. Administrative shell components yield visual priority to it.
