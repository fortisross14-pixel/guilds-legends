# Guilds of Legend Design System

<!-- impeccable:design-schema 1 -->

## Direction

**16-bit JRPG.** The game should read like Final Fantasy III/VI and early Dragon Quest on a modern screen. Every panel is a window: a solid deep-blue fill inside a crisp white pixel frame. Menus are short vertical command lists with a ▶ cursor. Numbers, names and commands are set in a pixel face; only longer reading text uses a clean prose face. Interface pixel art (frames, cursor, icons, crest, overworld) is drawn on a pixel grid and always rendered with `image-rendering: pixelated`. The character and scene art in `public/art/` is a detailed HD-2D pack (see `public/ART_LIBRARY_PLAN.md`): shown at 1× or larger it stays crisp; shrunk for avatars it is smoothed, because nearest-neighbour downscaling of detailed art drops pixels.

What it refuses: glass, blur, soft drop shadows, gradients on panels, pill buttons, card grids of equal tiles, eyebrow labels above headings, and gold used as decoration.

## Palette

Sampled from the art in `public/art/` (portrait navies `#112244` / `#223388`, scene sky `#5599ff`, warm skin and gold `#eebb55`, mage purples `#8855aa`). All tokens live in `src/styles/base/tokens.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--ground` | `#05081a` | page behind the windows |
| `--win` | `#12205e` | window fill |
| `--win-deep` | `#0a1440` | inset boxes, inputs, bar tracks |
| `--win-line` | `#34489a` | dividers inside a window |
| `--win-sel` | `#24398f` | selected / hovered menu row |
| `--edge` | `#f4f1ea` | window frame (white) |
| `--ink` | `#f6f3ea` | text |
| `--ink-dim` | `#b4bfe6` | secondary text |
| `--ink-faint` | `#8494cc` | tertiary text, disabled |
| `--cursor` | `#ffffff` | ▶ cursor |
| `--focus` | `#7fb2ff` | focus outline |
| `--hp` | `#5ad16a` | HP bars, success |
| `--mp` | `#5599ff` | MP bars, info |
| `--dmg` | `#ff5a4a` | damage numbers, danger, defeat |
| `--heal` | `#7dff9a` | heal numbers |
| `--xp` | `#c08af0` | XP, story, rarity-neutral purple accents |
| `--gold` | `#ffcf4a` | money, prestige, titles, rank-ups. Nothing else |
| `--warn` | `#ffc857` | warnings |

Rarity (portrait frame and rarity tags only): common `#c4c8d4`, uncommon `#6fd884`, rare `#5fb0ff`, epic `#c084fc`, legend `#ffcf4a`.

Primal (portrait ground, affinity tags, map tint only): fire `#ff7a3d`, air `#a8ecf7`, water `#4f9dff`, plant `#6fd06a`, animal `#e0a865`, psychic `#c88af2`, iron `#b0bacb`.

## Type

- **Pixel face: Pixelify Sans** (Google Fonts, 400–700). Headings, menu entries, buttons, numbers, battle text, labels, the status strip. Minimum 14px; below that it stops reading cleanly.
- **Prose face: Atkinson Hyperlegible** (Google Fonts, 400/700). Descriptions, story text, chronicle entries, `<p>`, `<small>`, `<blockquote>`, hints. Used for anything that would need to be smaller than 14px.
- Scale (pixel): 14 label · 16 menu/body · 20 window title · 24 section · 32 screen title · 40–72 logo. Prose: 15px body, 13px small, line-height 1.5.
- Numbers use `font-variant-numeric: tabular-nums` (`.num`, stats, gold, ranks).
- Labels are uppercase only at 14px with 0.04em tracking. No eyebrow kicker above a heading: subtitles sit under the title.

## Windows

One frame for everything: `.win` (and the component classes that share it, such as `.panel`, `.modal`, `.party-rail__member`).

- 4px pixel frame drawn as a 9-slice `border-image` (an inline SVG in `--frame`): 1px black outline, 3px white edge, chamfered pixel corners.
- Fill is solid `--win`, clipped to the padding box. No gradients, blur or soft shadows.
- Inside a window, groups are separated by 1px `--win-line` rules or by an inset box (`--win-deep` fill, 1px `--win-line` border, square corners). Windows are never nested inside windows.
- Windows sit directly on `--ground` or on a pixel scene.

## Menus

- **Command list** (`.cmd-menu` / `data-menu`): a vertical list of entries in the pixel face. The ▶ cursor (a pixel triangle mask in `--cursor-img`) appears on the hovered, focused or selected entry; the row tints to `--win-sel`. Arrow keys move between entries and Enter activates (`useMenuKeys` in `UI.jsx`).
- **Buttons** are framed command buttons: the small pixel frame, `--win` fill, pixel label, the cursor on hover/focus. Primary uses a brighter blue fill, danger a deep red fill. No pills.
- **Tabs** are a row of commands in a strip; the active tab carries the cursor and the selected fill.
- **Lists replace card grids** for town buildings, Guild Hall rooms, the notice board, the tavern, the shop and the Chronicle pages.

## Components

- `HeroPortrait`: square frame in the rarity colour, the primal ground image (`art/primals/<primal>.png`) behind the class medallion. Sizes: xs 36, sm/md 68, lg/xl 132 (frame included).
- `HeroSprite` and enemy art: 320×288 full figures in a 10:9 box, `object-fit: contain`, anchored bottom. Enemies are 220px wide on desktop, 160px on tablet and about 80px on phone.
- Scenes (`public/art/scenes`, 1280×576): `.scene` sets them with `background-size: cover` and a focal point (`--focus-x`, `--focus-y`). Assignments: title and town square = 07 fountain; Guild Hall = 09 strategy hall; Herald = 03 throne hall; shop = 01 harbor market; tavern = 08; notice board = 10; arena and tournament battles = 02 stone arena; other battles by the location's primal (Fire/Iron 12 frontier camp, Plant/Animal 11 forest road, Water 04 waterfall temple, Air 05 sky ruins, Psychic 06 crystal caverns).
- `ProgressBar`: 8px pixel bar, black track, solid fill, 1px highlight; width changes in steps.
- Status strip (top bar): date, time commands, location, gold, three rank arrows and status title, each a cell in one window.
- Command dock: World / Guild / Chronicle. Left column on desktop, icon column on tablet, bottom bar on phone.
- Party bar: each hero is a small status window (portrait, name, Lv, HP and fatigue bars, status icon).
- Battle: front view. Scene backdrop with enemies centred, tell window on top, command window (▶ cursor) and message window at the bottom, party status windows along the bottom. Damage and heal numbers pop over the unit; effect sprites flash on hits and heals.
- Moments (victory, level up, recruit, rank up, rankings, council, event cards): centred windows. Story beats are dialogue boxes with a speaker tab.
- Effects: hits flash `effect_14` (slash), heals `effect_08`, rewards `effect_12`.
- Pixel icons (`PixelIcon` in `src/components/PixelIcon.jsx`): 12×12 one-colour bitmaps drawn as SVG rects with `shape-rendering: crispEdges`, used for navigation, buildings, rooms, Chronicle pages and status-strip resources.

## Motion

Short and snappy: 100–200ms with `steps()` where it reads as pixel motion. Window open (scale 0.96 → 1 in steps), cursor nudge, damage numbers popping up, HP bars draining in steps. Ceremony (a short fanfare bounce and effect sprite) only for victory, level-up and rank-up. `prefers-reduced-motion` and the in-game setting make every change instant.

## Responsive

- **Phone (≤ 759px):** one window column, bottom command dock, party bar above it showing portraits and HP only, compact status strip. No horizontal page scroll.
- **Tablet (760–1099px):** icon-only side dock, two-column layouts where they fit.
- **Desktop (≥ 1100px):** labelled side dock, side-by-side windows (map + location window, list + detail), content capped at 1280px.

## Accessibility

44px minimum targets, visible focus (cursor + `--focus` outline), `aria-label` on icon-only buttons, readable contrast (`--ink-dim` on `--win` is above 7:1, `--ink-faint` above 4.5:1), and the prose face for any text below 14px.
