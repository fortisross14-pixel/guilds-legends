---
name: game-ui
description: Guilds of Legend's own GUI/UX rules. Load before changing any screen, menu, modal, card, HUD element, button, font, dialogue box or touch control in this repo (src/hud, src/places, src/screens, src/components, src/explore, src/styles). Covers the one screen template, the one close button, scrolling, fonts, the GUI kit skin, touch targets, and how to check a change on a phone.
---

# Guilds of Legend: GUI and UX rules

Read `docs/UX.md` first (gesture language, the HUD, the one screen template, the glossary).
These rules are the ones that keep breaking; follow them for every UI change. For general
craft, also use the `game-ui-ux`, `ux-usability-foundations` and
`information-architecture-navigation` skills in this folder.

## Structure

- **One screen template.** Every menu is a `Section` (`src/hud/Section.jsx`): title, tabs,
  a scrolling list, an optional details panel, one help line, one primary action at the
  bottom right. Don't build a screen with its own header, its own close button or its own
  scroll container.
- **One way to close.** The round ✕ (`.close-button`) at the top right closes every section,
  modal, details panel, sheet and card. Never add a "Back" text button that closes; never put
  a close control on the left. Esc and the left-edge swipe also close. A step back *inside*
  a screen (details → list) uses the details panel's own ✕.
- **One interruption at a time.** Cards and moments queue (App.jsx); a new modal must go
  through `Modal` (`src/components/UI.jsx`), which owns focus, Esc and the ✕.
- **Rooms and places are walked, not tapped.** Buildings are walkable rooms
  (`InteriorScene` + `interiorMap`); don't add tap-only overlays for things a person in the
  room should be walked to.

## Scrolling

- Only `.section__list` (and `.section__detail-body`, `.modal__body`) scroll. Nothing inside
  them sets its own `overflow: auto` with a fixed height; nested scrollers make scrolling
  "go crazy" on phones.
- The page itself never scrolls (`document.scrollingElement` stays put).
- Tab rows scroll sideways instead of cutting their last tab.
- Each tab opens at the top.

## Look (the GUI PRO Kit skin, `src/styles/skin/guikit.css`)

- Frames are the kit's panel (`border-image`, a real border so content never runs into it).
- Fonts: **Cinzel** only for screen titles (section and modal titles, the place tag);
  **Alegreya Sans** for everything else, including names and headings inside lists. Never
  uppercase long names.
- Buttons: `Button` with `variant` primary (gold), secondary (slate), danger (red). Icons only
  through `<Icon name>`; no emoji.
- Art comes from the hand-painted packs (see the `art-pipeline` skill). Don't add new
  generated or placeholder art to screens.

## Touch

- Every tap target is at least 44 × 44 px; nothing important within 12 px of a screen edge.
- Every drag has a tap fallback (tap the thing, then tap where it goes).
- Labels over the world never cover the HUD (WalkableScene places them).

## Checking a change

The prototype testing policy (CLAUDE.md) applies: build and lint. For a visual change, also
look at it on a phone:

1. `npm run build`, then `npx vite preview --port 4179`.
2. `node scripts/ui/menu-audit.cjs <scratch-dir>`: opens every orb menu on an iPhone 13
   viewport and reports what opened, whether the list scrolls inside its frame and not the
   page, and how many elements poke out of the frame; it saves a screenshot of each menu.
3. Look at the screenshots. Fix anything that overflows, overlaps, has a second close
   control, or scrolls the page.
4. For places: `#art-test:<place>@x,y` opens the art preview of a town or wild area at a tile.
