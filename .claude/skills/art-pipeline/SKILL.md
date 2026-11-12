---
name: art-pipeline
description: How art gets into Guilds of Legend from the private art repo (Unity Asset Store packs - 2D Hand Painted tilesets, Extra Objects, GUI PRO Kit, HeroEditor). Load before adding or changing any visual - a character, an enemy, a building, a prop, a room, ground tiles, the UI skin - or when the user adds new packs to the art repo.
---

# Guilds of Legend: the art pipeline

All art comes from the private repo `fortisross14-pixel/my-art` (clone it next to the game:
`../my-art`). Its packs are licensed for use in the game only, so the game repo is private and
holds only the pieces it uses (`public/art/packs/myart`, credits in `CREDITS.md`).

## One command

```
python3 scripts/art/import_myart.py ../my-art            # everything (about 2 minutes)
python3 scripts/art/import_myart.py ../my-art --no-characters   # skip characters and foes (fast)
```

It writes the images and `src/data/myart/assets.json` (applied over the older registry entries
by `src/data/assets.js`) and `src/data/myart/rooms.json` (furniture and spots of each room).
Never edit generated files by hand; change the script and run it again. Then regenerate
`docs/ASSETS.md` (bundle `scripts/assets-doc.mjs` with esbuild and run it, since Node needs
import attributes for the JSON).

## Where each kind of art is defined

- **Walking characters** (founder, townsfolk, regulars, visitors, recruits by class):
  `scripts/art/characters.py`, one recipe per asset id (HeroEditor parts). Each gets a walk
  sheet, a standing frame (`still`), a portrait close-up (`bust`); heroes also a battle figure.
- **Enemies** (all people): `scripts/art/foes.py`, one recipe per enemy id in
  `src/data/enemies.js`; groups for the wild maps in `GROUPS`/`BOSSES`.
- **The rig**: `scripts/art/heroeditor.py` reads HeroEditor's `Human.prefab` and sliced sprites.
  Its animation clips (`Common/Animation`) are not used yet (planned for battles).
- **Buildings and town props**: `import_myart.py` (gable, wooden, thatched houses, signs, the
  temple). Building art keeps its proportions (`aspect`, `scale`).
- **Wild objects and trees, wild ground**: `scripts/art/wilds.py` (Grassland and Extra Objects
  pieces by sheet tile). Trees are grown over every `T` tile by `src/explore/sceneMap.js`.
- **Ground** is painted at run time from a place's tile rows by `src/explore/groundPaint.js`
  (quarter-tile autotiling; wild areas use the grassland road and ponds).
- **The world map**: `scripts/art/worldmap.py` paints it (ink on parchment, land grown around the places of `src/data/world.js` and along every road); re-run it after moving a place or adding a road.
- **Rooms** (walkable interiors): `scripts/art/interiors.py`, a function per room that places
  furniture and the people's spots (`room.spot`, seats under guests). A room's size is set in
  `ROOMS` (default 20 x 9 tiles; the house is 10 x 7). Anyone standing *behind* a piece (the keeper
  behind the bar) needs `put(..., front=True)`: the piece is cut out again as a PNG and drawn above
  the people, sorted by its foot; never put a spot on top of painted furniture.
- **UI skin**: `src/styles/skin/guikit.css` and the kit pieces copied by `GUI_FILES`.

## New packs

When the user adds packs to the art repo: pull it, render each sheet with a tile grid to
read it, add the pieces you need to the right module above, run the import, look at the
result in the art preview (`#art-test:<place>@x,y`), and commit the script change with the
generated files.
