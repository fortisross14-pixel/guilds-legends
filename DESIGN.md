# Guilds of Legend Design System

<!-- impeccable:design-schema 1 -->

## Direction

**HD-2D: a 2026 game with a retro soul.** References: Octopath Traveler I & II, Triangle Strategy, Dragon Quest III HD-2D, Live A Live (2022), Sea of Stars. Pixel-art characters and worlds, presented with modern light, depth, elegant typography and restrained menus.

- **Art first.** Scenes, the overworld and character art fill the viewport edge to edge. The interface floats over them; it never boxes the art in.
- **One panel level.** Overlays are dark translucent panels with a thin brass edge. Inside a panel, grouping comes from spacing, hairlines and type, never from another box.
- **One HUD.** Two orbs, a ledger and a fading place tag replace every navigation bar (Phase 7C).
- **Light and depth.** Backdrops get a vignette, a soft top-and-bottom depth-of-field blur, a warm bloom and drifting dust. Selections glow; they are never solid blocks.
- **No pixel font in the interface.** Pixel style lives in the art.

What it refuses: flat saturated blue, white box frames, nested boxes, pixel-font UI text, pill buttons, dashboard card grids, and gold used as decoration.

## Palette

Tokens live in `src/styles/base/tokens.css`. Inks are sampled from the dark tones of the scene art (shadowed stone, tavern wood, night sky).

| Token | Value | Use |
| --- | --- | --- |
| `--ink-0` | `#0b0c12` | page ground, deepest shadow |
| `--ink-1` | `#14131a` | panel base (blue-brown black) |
| `--panel` | `rgba(20, 18, 25, .84)` → `rgba(11, 10, 15, .9)` | translucent panel fill (vertical gradient) |
| `--panel-solid` | `#16141b` | panel fill where blur is unsupported |
| `--brass` | `#c9a66b` | panel edge, ornaments, icons |
| `--line` | `rgba(201, 166, 107, .32)` | panel edge |
| `--line-soft` | `rgba(236, 222, 196, .1)` | hairlines inside panels |
| `--text` | `#ece4d2` | primary text (ivory) |
| `--text-dim` | `#b6ab96` | secondary text |
| `--text-faint` | `#8c8270` | tertiary text, disabled |
| `--gold` | `#e6bf6e` | money, prestige, primary action |
| `--gold-bright` | `#f6dc9a` | glows, cursor gem |
| `--glow` | `rgba(246, 210, 140, .16)` | selected-row light sweep |
| `--parchment` | `#efe3c6` | dialogue and story panels |
| `--parchment-ink` | `#2c2216` | text on parchment |
| `--hp` | `#74c07a` | HP, success |
| `--mp` | `#6b97d8` | MP, info |
| `--dmg` | `#dc5f4f` | damage, danger |
| `--heal` | `#93e6a0` | heal numbers |
| `--xp` | `#ad8fd9` | XP, story accents |
| `--warn` | `#e3a957` | warnings |

Rarity (frames, glows, rarity tags): common `#b9b3a6`, uncommon `#7cc48b`, rare `#72a9e6`, epic `#b58be3`, legend `#e8c36c` (with shimmer). Primal (portrait ground, affinity tags, map tint): fire `#e07a4a`, air `#9ccfd9`, water `#5f98d6`, plant `#7cb86d`, animal `#c99a66`, psychic `#b28ad9`, iron `#a3abb8`.

## Type

Two faces, five sizes (tokens `--fs-1`…`--fs-5` in `tokens.css`). Nothing else.

- **Cormorant Garamond** (600/700): titles, place and character names, the dialogue line, ceremonies.
- **Manrope** (400–800): everything else: menus, data, buttons, help lines; `tabular-nums` for stats, gold and ranks.
- **Sizes:** 12 (`--fs-1`, tiny labels and meta) · 14 (`--fs-2`, secondary text and lists) · 16 (`--fs-3`, body, menus, buttons) · 21 (`--fs-4`, names and panel titles) · 28–38 (`--fs-5`, screen titles and ceremonies). The title-screen logo (`--fs-logo`) is art, not a sixth text size.
- **Small caps** (uppercase + 0.08–0.12em tracking) only for tiny labels at `--fs-1`: tab labels, orb names, stat captions.
- **Contrast:** every text meets WCAG AA. Dialogue is dark ink on parchment; panels are ivory on dark ink; never pale on pale.

## Icons

- **One set, one look.** Game concepts come from **game-icons.net** (CC BY 3.0; Lorc, Delapouite, Sbed), system icons from **Phosphor** (MIT, bold weight). Credits in `CREDITS.md` and System → Credits.
- **One component:** every icon is `<Icon name>` (`src/components/Icon.jsx`); the shapes live in `src/components/iconPaths.js`, so custom art can replace a shape without touching screens.
- **Tones:** `brass` (default: a gold gradient with a dark cut below and a faint highlight above, like the panel edges), `ink` (on parchment), `plain` (`currentColor`, for states such as damage red or heal green).
- **No emoji and no Unicode symbols as icons.** Arrows in prose (→), minus signs and the ▲▼ rank marks are typography, not icons. Old data that still names an icon with a symbol resolves to a drawn shape.
- Sizes: 14 inline with text, 16–18 in rows, 24 in orb items and tiles, 28 on orbs.

## Surfaces

- **One panel style** (the `.panel` recipe, shared by every overlay: sections, modals, ledger, orb labels, plates): vertical ink gradient at 84–90% opacity, `backdrop-filter: blur(14px) saturate(1.15)`, 1px brass edge at ~32% opacity, soft drop shadow, inner top highlight, four brass corner flourishes (`--orn-*`).
- **No boxes inside boxes.** Inside a section, older panels and cards become hairline-bounded bands (`shell.css`).
- **One button style** in three weights: **primary** (gold text, gold edge, gold glow), **secondary** (brass hairline frame), **quiet** (text only, for back and close). Danger uses the damage red edge.
- **One radius set:** `--r-1` 3px (controls, panels, chips), `--r-2` 10px (sections, bottom panels, sheets), round (orbs, portraits, badges). No pills.
- Dialogue: a parchment box (`--parchment`) with dark ink, a brass name plate and a portrait slot.

## Menus and tabs

- Menus (`data-menu` lists): generous rows, hairline dividers, and one **glowing gem cursor** per menu that glides to the hovered, focused or selected row (`useMenuKeys`). Arrow keys move, Enter activates.
- Tabs: small-caps labels with an icon on a hairline; the active tab gets a gold underline. A section's tabs also change by swiping the content sideways.
- View pickers (a few views inside one tab, such as Records → Rankings): hairline-framed toggles, the active one gold.

## Art and atmosphere

- `SceneBackdrop` (in `UI.jsx`): the scene behind sections and buildings, with depth-of-field blur, warm bloom, vignette, a text scrim and drifting dust.
- World map: the pixel overworld with drift and edge fog; locked towns under fog; reachable routes glow.
- Portraits: class medallion on the primal ground, thin rarity frame and glow; Epic and Legend frames shimmer.
- Sprites and enemies: `object-fit: contain`, soft elliptical ground shadow, gentle idle bob. In battle the party stands on the field, above the command HUD.
- **People in rooms:** a gold **?** badge over strangers; once met, small offer icons (alert, coin, padlock, crossed swords) before their first name. Rooms are 11 × 11 tiles, centred and fitted to the screen, on a dark vignette.
- **Placeholders look intentional** (`assetLoader.js`): people are silhouettes in their role or class colour, enemies are beast silhouettes, props are soft shapes, buildings are houses with a lit door, crests are shields, backdrops are mood gradients. Asset ids appear only with Settings → Developer → **Show asset ids** (off by default).

## Motion

- Quick and consistent: hover 160ms, panels and fans 260ms, all on `cubic-bezier(.2,.8,.2,1)`.
- The orb fan staggers its items (28ms apart); the ledger drops a row, shows the change ("+120", "▲2") and folds away after 2.6s; the place tag fades after about 4s.
- HP and MP bars ease down with a lagging damage ghost. Ceremonies get a light burst and a slow title reveal (600–1200ms).
- `prefers-reduced-motion` and the in-game setting stop ambient motion and make transitions instant.

## Layout

Screen zones are defined once (`shell.css`, and the zone tokens in `tokens.css`):

- **The place** fills the screen: the walkable scene or the world map (`--z-scene`).
- **The HUD** sits in the corners, inside the safe areas (`env(safe-area-inset-*)`, `100dvh`): place tag top left, ledger top right, the Guild orb bottom left, the World orb bottom right (`--z-hud`).
- **Sections** (the one screen template) cover the place (`--z-panel`): a large floating panel with a detail column on wide screens; the full screen with a bottom detail panel on phones.
- **The bottom has one owner at a time:** dialogue, then battle commands, then bottom panels, then the orbs. The orbs fade out whenever one of the others is on screen.
- **One layer scale:** scene 0 · world labels 10 · HUD 20 · panels 30 · dialogue 40 · overlays 50 · messages 60 · drag layers 70 · system 80. Components use 0–9 only for local stacking.
- World labels fade where they would sit under the HUD.
- A web app manifest (`public/manifest.webmanifest`, crest icons from `scripts/app-icons.mjs`) and the iOS/Android meta tags let the game run from the home screen without the browser bar.

## Accessibility

44px targets, visible focus (gem cursor + gold outline), labels on icon buttons and orb items, keyboard shortcuts (P, I, Q, M, R, Esc), text over art always on a panel or scrim at 4.5:1, and every ambient effect removed under reduced motion.
