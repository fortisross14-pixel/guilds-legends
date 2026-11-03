# Guilds of Legend Design System

<!-- impeccable:design-schema 1 -->

## Direction

**HD-2D: a 2026 game with a retro soul.** References: Octopath Traveler I & II, Triangle Strategy, Dragon Quest III HD-2D, Live A Live (2022), Sea of Stars. Pixel-art characters and worlds, presented with modern light, depth, elegant typography and restrained menus.

- **Art first.** Scenes, the overworld and character art fill the viewport edge to edge. The interface floats over them; it never boxes the art in.
- **One panel level.** Overlays are dark translucent panels with a thin brass edge. Inside a panel, grouping comes from spacing, hairlines and type, never from another box.
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

- **Cormorant Garamond** (600/700): titles, place names, character names, ceremonies, big numbers in ceremonies.
- **Cinzel** (500/600): small-caps labels, section labels, tab and nav labels, with 0.08–0.14em tracking. Never below 11px.
- **Manrope** (400–700): text, menus, data, buttons; `tabular-nums` for stats, gold and ranks.
- Scale: labels 11–12 Cinzel · body 14–15 Manrope · menu 15–16 Manrope · names 20–26 Cormorant · screen titles 34–44 Cormorant · logo 64–92 Cormorant.

## Panels

- `.panel` recipe (shared by every overlay: panels, modals, dock, status bar, party plates, battle plates, shop and map panels): vertical ink gradient at 84–90% opacity, `backdrop-filter: blur(14px) saturate(1.15)`, 1px brass edge at ~32% opacity, 4px radius, soft drop shadow, an inner top highlight, and four small brass corner flourishes (inline SVG background layers, `--orn-*`).
- Groups inside a panel: hairline rules (`--line-soft`) and spacing only. Former inset boxes become hairline-bounded bands with a faint horizontal light.
- Dialogue: parchment panel (`--parchment`) with ink text, a brass name plate and the speaker portrait.

## Menus and buttons

- Menus (`data-menu` lists): generous rows, hairline dividers, and one **glowing gem cursor** per menu that glides (220ms ease) to the hovered, focused or selected row (`useMenuKeys` in `UI.jsx`). The active row gets a soft horizontal light sweep, never a solid block. Arrow keys move, Enter activates.
- Buttons: Manrope text with a fine brass frame; glow on hover and focus. Primary actions are warm gold (gold text, gold edge, gold glow). Danger actions use the damage red edge.
- Tabs: Cinzel small-caps labels on a hairline; the active tab gets a gold underline and glow.

## Art and atmosphere

- `SceneBackdrop` (in `UI.jsx`): fixed full-viewport scene behind town, Guild Hall, Chronicle and building screens; layers: the scene (`cover`, slow drift), top and bottom depth-of-field blur (masked `backdrop-filter`), warm bloom, vignette, a scrim for text contrast, and drifting dust motes.
- World map: the pixel overworld fills the viewport with a slow drift and edge fog; locked towns sit under fog; reachable routes glow.
- Portraits: class medallion on the primal ground, a thin rarity-colour frame and glow; Epic and Legend frames shimmer.
- Sprites and enemies: `object-fit: contain`, soft elliptical ground shadow, gentle idle bob.
- Effects: hits flash `effect_14` (slash), heals `effect_08`, rewards `effect_12`.
- Icons: the 12×12 pixel icon set (`PixelIcon`) is drawn in brass with a soft glow, as engraved glyphs.

## Motion

- Panels fade and rise in (260ms, `cubic-bezier(.2,.8,.2,1)`); the cursor glides (220ms); hover glows 160ms.
- HP and MP bars ease down (300ms) with a lagging damage ghost (700ms after a 250ms delay).
- Numbers count up in ceremonies; dialogue types out (skippable with a click or key).
- Ceremonies (victory, level up, rank up, title change, story beats): a light burst, a slow title reveal and rising sparks, 600–1200ms.
- Ambient: dust motes, backdrop drift, sprite idle bob, rarity shimmer.
- `prefers-reduced-motion` and the in-game setting stop ambient motion, make transitions instant and show typed text at once.

## Layout

- **Desktop (≥ 1100px):** a slim translucent dock floats on the left; one slim status bar on top (date, time, location, gold, ranks, title, and a Journal toggle that opens upcoming events and the next step); content panels float over the backdrop; the party bar is a row of slim plates at the bottom, collapsible.
- **Tablet (760–1099px):** icon dock, same overlays.
- **Phone (< 760px):** art stays visible at the top of each place; detail panels become bottom sheets (rounded top, full width); bottom dock; party plates shrink to portrait + HP.

## Accessibility

44px targets, visible focus (gem cursor + gold outline), `aria-label` on icon buttons, text over art always on a panel or a scrim that keeps 4.5:1, and every ambient effect removed under reduced motion.
