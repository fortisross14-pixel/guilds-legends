# Spec: author's playtest 1 feedback

From the author's first longer play session (2026-11-04). The overall verdict was "getting close, it was fun to play". Two of the problems reported are covered by specs not built yet:
- missions start a fight immediately → missions-in-world.md
- tournaments take only one person → tournaments-circuits.md

The rest are below.

## 1. Skip and Continue stay in one fixed place
In the dialogue box, the Skip button moves with the line length (in the prologue it jumps around the screen). Fix it:
- **Skip** sits fixed at the bottom-right corner of the dialogue box.
- **"Tap to continue"** (or the continue arrow) sits fixed at the bottom-left, or as a small arrow at the bottom-right just before Skip.
- Neither moves, whatever the text length, screen size or number of choices.
- The text block has a fixed area above them (with a max line count and a scroll if ever needed).

The same applies to every dialogue and card: story scenes, people, event cards and road events.

## 2. Interiors use the painted art
The painted interiors in `public/art/interiors/` (tavern, shop, herald, the arenas per town, the inns, the notice board, the Guild Hall) are only shown behind menus. The walk-in interior draws placeholder tiles instead. The paintings are front-facing scenes, not top-down maps, so:
- **Every building interior becomes a painted scene:** the interior art fills the screen (cover-fit, safe-area aware, cropped sensibly on phones).
- **People stand at fixed spots** placed on the painting (behind the bar, at a table, at the registrar's desk), drawn as their sprite or silhouette, with name and offer badges. Furniture and boards that do something (shop shelves, the history board, the ranking board, the notice board) are tappable hotspots on the painting.
- **Tap a person to talk, tap a hotspot to use it, tap the door hotspot to leave** (with the confirmation bubble from section 3). No walking inside buildings; the paintings aren't top-down maps.
- **Per-building data** (`src/data/interiors.js`): the asset id, the spots (x/y as percentages of the painting) for regulars and visitors, hotspots, and the door. Visitors fill free spots.
- **The player's house in the prologue** gets the same treatment once its painting exists (asset `interior.house`; add it to docs/ASSETS.md). Until then, keep a clean placeholder painting (a mood gradient, no grey boxes).
- **Fallback:** if an interior has no painting yet, use a mood-gradient backdrop with the same spot layout, never placeholder tiles.

## 3. Doors and exits need a confirmation tap
Walking next to a door (or tapping near one to reach a person standing there) currently enters or exits immediately, so you can't talk to someone standing by a door. Fix it:
- **Walking onto or past a door never triggers it.**
- **Tapping a door or exit opens a small bubble above it:** "Enter The Wayfarer" / "Leave to Dunmere" / "Travel: The Old Road". Tapping the bubble does it. Tapping anywhere else closes the bubble.
- The same applies to wild-area exits, town gates and the interior door hotspot.
- People and objects near doors are always tappable, and their tap takes priority over the door's.

## 4. Result screens: show, don't tell
The post-fight and post-mission screens have far too much text; nobody will read it. Rebuild them:
- **Victory screen (after a battle):**
  - a big result word ("Victory")
  - each hero as a portrait with an XP bar filling, a "Level up!" badge when it happens, HP left, and an injured mark
  - gold and loot as icons with numbers
  - one Continue button
  
  At most ~15 words of text on the screen.
- **Mission complete (after reporting back to the giver):**
  - the contract name and grade (stars or a word)
  - gold, fame and reputation as icons with numbers
  - loot icons
  - one line from the giver (at most ~12 words)
  - Continue
  
  At most ~25 words.
- **Defeat / infirmary moment:** one line plus the cost and recovery time as icons.
- **Details on request:** the full battle log, mission breakdown and per-hero numbers move behind a "Details" button (or long-press) and are never shown by default.
- **One queued moment per event:** never stack a victory screen, a level-up screen and a report one after another for the same fight. Merge them: level-ups show inside the victory screen.
