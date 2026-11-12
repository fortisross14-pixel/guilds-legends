# Asset list

Every visual asset the game asks for, registered by id in [src/data/assets.js](../src/data/assets.js). Paths are relative to `public/`. This file is generated: run `node scripts/assets-doc.mjs` after changing the registry.

How it works: the loader uses the file at **Path** if it exists; otherwise **Borrows** (older shared art standing in); otherwise it draws a placeholder that looks intentional: a silhouette for people and enemies, a soft shape for props and buildings, a shield for crests, a mood gradient for backdrops (Settings → Developer → Show asset ids writes the id on it). Drop a file at the path and it is picked up with no code change. Status: *placeholder* = no file yet, *borrowed* = using older shared art, *ready* = dedicated file exists.

Walkable art (towns, wild areas) is generated from the place data in `src/data/towns/` and `src/data/wilds/`: every building, person, portrait, prop and enemy group placed there gets an entry. Building fronts are 5×5 tiles (160×160) with the door at the bottom centre; props are drawn one tile taller than their footprint. The ground tileset is one row of 32 px tiles in the order of `src/data/tiles.js`.

Phase 7 will add style notes and generation prompts for each entry.

## Backdrop (`bg`, placeholder #2f4a66)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `bg.title` | `art/bg/title.png` | 1280×576 | `art/scenes/scene_01.png` | borrowed | Title screen |
| `bg.chronicle` | `art/bg/chronicle.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Chronicle menu and its pages |
| `bg.town.dunmere` | `art/bg/town-dunmere.png` | 1280×576 | `art/scenes/scene_07.png` | borrowed | Dunmere town directory (fallback menu) |
| `bg.town.greenhollow` | `art/bg/town-greenhollow.png` | 1280×576 | `art/scenes/scene_07.png` | borrowed | Greenhollow town directory |
| `bg.town.ironford` | `art/bg/town-ironford.png` | 1280×576 | `art/scenes/scene_07.png` | borrowed | Ironford town directory |
| `bg.town.default` | `art/bg/town-default.png` | 1280×576 | `art/scenes/scene_07.png` | borrowed | Any other town directory |
| `bg.town.windmere` | `art/bg/town-windmere.png` | 1280×576 | `art/scenes/scene_07.png` | borrowed | Windmere town directory (no walkable layout yet) |
| `bg.story.house` | `art/bg/story-house.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Prologue: the player’s house at night, rain and firelight |
| `bg.story.warning` | `art/bg/story-warning.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Act I ending: outside the Dunmere arena after the Harvest Melee |
| `bg.story.greenhollow` | `art/bg/story-greenhollow.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Act II: Maren Bell’s herb room in Greenhollow |
| `bg.story.archive` | `art/bg/story-archive.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Act II: the Ironford archive vault |
| `bg.story.windmere` | `art/bg/story-windmere.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Act II: the cliffside ring at Windmere |
| `bg.story.thornwood` | `art/bg/story-thornwood.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Act II: the trapper’s hut at the Thornwood edge (Wren) |
| `bg.story.banner` | `art/bg/story-banner.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Chapter 1 ending: the Guild Hall, Wren facing the banner |
| `bg.story.chapter` | `art/bg/story-chapter.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Chapter summary and the Chapter 2 teaser |
| `bg.season.review` | `art/bg/season-review.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Season review cards (end of each year, re-opened from the record book) |

## Building exterior (`building`, placeholder #5a4636)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `town.dunmere.guildhall.stage1` | `art/packs/myart/buildings/dunmere-guildhall-stage1.png` | 393×512 | — | ready | Dunmere: the Guild Hall (wooden house) |
| `town.dunmere.herald` | `art/packs/myart/buildings/dunmere-herald.png` | 373×576 | — | ready | Dunmere: Herald’s Office (purple gable house) |
| `town.dunmere.tavern` | `art/packs/myart/buildings/dunmere-tavern.png` | 405×448 | — | ready | Dunmere: The Wayfarer (thatched, the beer sign) |
| `town.dunmere.shop` | `art/packs/myart/buildings/dunmere-shop.png` | 437×576 | — | ready | Dunmere: Mira’s Supply (orange gable house, the potion sign) |
| `town.dunmere.arena` | `art/packs/myart/buildings/dunmere-arena.png` | 455×512 | — | ready | Dunmere: the arena (dark wooden house, the sword sign) |
| `town.greenhollow.lodge` | `art/packs/myart/buildings/greenhollow-lodge.png` | 341×448 | — | ready | Greenhollow: the lodge (moss thatch) |
| `town.greenhollow.tavern` | `art/packs/myart/buildings/greenhollow-tavern.png` | 405×448 | — | ready | Greenhollow: the tavern |
| `town.greenhollow.shop` | `art/packs/myart/buildings/greenhollow-shop.png` | 437×576 | — | ready | Greenhollow: the shop |
| `town.greenhollow.arena` | `art/packs/myart/buildings/greenhollow-arena.png` | 455×512 | — | ready | Greenhollow: the arena |
| `town.ironford.offices` | `art/packs/myart/buildings/ironford-offices.png` | 393×512 | — | ready | Ironford: the offices |
| `town.ironford.herald` | `art/packs/myart/buildings/ironford-herald.png` | 373×576 | — | ready | Ironford: the herald (blue gable house) |
| `town.ironford.shop` | `art/packs/myart/buildings/ironford-shop.png` | 435×576 | — | ready | Ironford: the shop (the armor sign) |
| `town.ironford.tavern` | `art/packs/myart/buildings/ironford-tavern.png` | 405×448 | — | ready | Ironford: the tavern |
| `town.ironford.arena` | `art/packs/myart/buildings/ironford-arena.png` | 455×512 | — | ready | Ironford: the arena |
| `town.windmere.inn` | `art/packs/myart/buildings/windmere-inn.png` | 405×448 | — | ready | Windmere: the inn |
| `town.windmere.shop` | `art/packs/myart/buildings/windmere-shop.png` | 437×576 | — | ready | Windmere: the shop |
| `town.windmere.arena` | `art/packs/myart/buildings/windmere-arena.png` | 455×512 | — | ready | Windmere: the arena |
| `town.oldroad.temple` | `art/packs/myart/buildings/oldroad-temple.png` | 493×576 | — | ready | The Old Road: Dawnwatch Temple (blue gable house between white columns) |
| `town.oldroad.priory` | `art/packs/myart/buildings/oldroad-priory.png` | 341×448 | — | ready | The Old Road: the priests’ house (moss thatch) |

## Interior (`interior`, placeholder #6b4a24)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `scene.hall.lot` | `art/hall/lot.png` | 1080×1080 | `art/interiors/guildhall-stage1.png` | borrowed | Guild Hall: the lot seen from above (the cabin, the slots, the yard) |
| `scene.defeat` | `art/scenes/defeat.png` | 1280×576 | — | placeholder | Defeat: the party wakes in the infirmary (or the founder’s house) |
| `interior.tavern` | `art/packs/myart/interiors/tavern.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.shop` | `art/packs/myart/interiors/shop.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.arena` | `art/packs/myart/interiors/arena.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.herald` | `art/packs/myart/interiors/herald.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.noticeboard` | `art/interiors/noticeboard.png` | 1280×576 | `art/scenes/scene_10.png` | ready | Notice Board (contracts) |
| `interior.house` | `art/packs/myart/interiors/house.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.arena.dunmere` | `art/packs/myart/interiors/arena-dunmere.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.arena.greenhollow` | `art/packs/myart/interiors/arena-greenhollow.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.arena.ironford` | `art/packs/myart/interiors/arena-ironford.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.arena.windmere` | `art/packs/myart/interiors/arena-windmere.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `site.ironford.archive` | `art/sites/ironford-archive.png` | 1280×576 | `art/packs/myart/interiors/herald.jpg` | borrowed | Contract site: the Ironford archive vault (shelves, a desk, the quartermaster’s ledgers) |
| `site.ironford.slagpits` | `art/sites/ironford-slagpits.png` | 1280×576 | — | placeholder | Contract site: the slag pits behind the Ironford foundries |
| `site.windmere.cliffs` | `art/sites/windmere-cliffs.png` | 1280×576 | — | placeholder | Contract site: the cliff path above Windmere harbour |
| `interior.inn.greenhollow` | `art/packs/myart/interiors/inn-greenhollow.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.inn.ironford` | `art/packs/myart/interiors/inn-ironford.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.inn.windmere` | `art/packs/myart/interiors/inn-windmere.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.temple` | `art/packs/myart/interiors/temple.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.priory` | `art/packs/myart/interiors/priory.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |

## Prop (`prop`, placeholder #55602e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `hall.room.bedroom.1` | `art/hall/rooms/bedroom-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Bedroom, Basic |
| `hall.room.bedroom.2` | `art/hall/rooms/bedroom-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Bedroom, Advanced |
| `hall.room.bedroom.3` | `art/hall/rooms/bedroom-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Bedroom, State of the art |
| `hall.room.training.1` | `art/hall/rooms/training-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Training room, Basic |
| `hall.room.training.2` | `art/hall/rooms/training-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Training room, Advanced |
| `hall.room.training.3` | `art/hall/rooms/training-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Training room, State of the art |
| `hall.room.infirmary.1` | `art/hall/rooms/infirmary-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Infirmary, Basic |
| `hall.room.infirmary.2` | `art/hall/rooms/infirmary-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Infirmary, Advanced |
| `hall.room.infirmary.3` | `art/hall/rooms/infirmary-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Infirmary, State of the art |
| `hall.room.treasury.1` | `art/hall/rooms/treasury-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Treasury, Basic |
| `hall.room.treasury.2` | `art/hall/rooms/treasury-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Treasury, Advanced |
| `hall.room.treasury.3` | `art/hall/rooms/treasury-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Treasury, State of the art |
| `hall.room.armory.1` | `art/hall/rooms/armory-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Armory, Basic |
| `hall.room.armory.2` | `art/hall/rooms/armory-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Armory, Advanced |
| `hall.room.armory.3` | `art/hall/rooms/armory-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Armory, State of the art |
| `hall.room.scouts.1` | `art/hall/rooms/scouts-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Scout table, Basic |
| `hall.room.scouts.2` | `art/hall/rooms/scouts-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Scout table, Advanced |
| `hall.room.scouts.3` | `art/hall/rooms/scouts-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Scout table, State of the art |
| `hall.room.crown.1` | `art/hall/rooms/crown-1.png` | 256×256 | — | placeholder | Guild Hall slot tile: Crown Room, Basic |
| `hall.room.crown.2` | `art/hall/rooms/crown-2.png` | 256×256 | — | placeholder | Guild Hall slot tile: Crown Room, Advanced |
| `hall.room.crown.3` | `art/hall/rooms/crown-3.png` | 256×256 | — | placeholder | Guild Hall slot tile: Crown Room, State of the art |
| `hall.equipment.dummy.1` | `art/hall/equipment/dummy-1.png` | 128×128 | — | placeholder | Training equipment: Training dummy (Might), Basic |
| `hall.equipment.dummy.2` | `art/hall/equipment/dummy-2.png` | 128×128 | — | placeholder | Training equipment: Training dummy (Might), Advanced |
| `hall.equipment.dummy.3` | `art/hall/equipment/dummy-3.png` | 128×128 | — | placeholder | Training equipment: Training dummy (Might), State of the art |
| `hall.equipment.targets.1` | `art/hall/equipment/targets-1.png` | 128×128 | — | placeholder | Training equipment: Archery targets (Finesse), Basic |
| `hall.equipment.targets.2` | `art/hall/equipment/targets-2.png` | 128×128 | — | placeholder | Training equipment: Archery targets (Finesse), Advanced |
| `hall.equipment.targets.3` | `art/hall/equipment/targets-3.png` | 128×128 | — | placeholder | Training equipment: Archery targets (Finesse), State of the art |
| `hall.equipment.desk.1` | `art/hall/equipment/desk-1.png` | 128×128 | — | placeholder | Training equipment: Reading desk (Mind), Basic |
| `hall.equipment.desk.2` | `art/hall/equipment/desk-2.png` | 128×128 | — | placeholder | Training equipment: Reading desk (Mind), Advanced |
| `hall.equipment.desk.3` | `art/hall/equipment/desk-3.png` | 128×128 | — | placeholder | Training equipment: Reading desk (Mind), State of the art |
| `hall.equipment.shrine.1` | `art/hall/equipment/shrine-1.png` | 128×128 | — | placeholder | Training equipment: Shrine (Spirit), Basic |
| `hall.equipment.shrine.2` | `art/hall/equipment/shrine-2.png` | 128×128 | — | placeholder | Training equipment: Shrine (Spirit), Advanced |
| `hall.equipment.shrine.3` | `art/hall/equipment/shrine-3.png` | 128×128 | — | placeholder | Training equipment: Shrine (Spirit), State of the art |
| `hall.equipment.weights.1` | `art/hall/equipment/weights-1.png` | 128×128 | — | placeholder | Training equipment: Weights (Endurance), Basic |
| `hall.equipment.weights.2` | `art/hall/equipment/weights-2.png` | 128×128 | — | placeholder | Training equipment: Weights (Endurance), Advanced |
| `hall.equipment.weights.3` | `art/hall/equipment/weights-3.png` | 128×128 | — | placeholder | Training equipment: Weights (Endurance), State of the art |
| `hall.equipment.podium.1` | `art/hall/equipment/podium-1.png` | 128×128 | — | placeholder | Training equipment: Podium (Presence), Basic |
| `hall.equipment.podium.2` | `art/hall/equipment/podium-2.png` | 128×128 | — | placeholder | Training equipment: Podium (Presence), Advanced |
| `hall.equipment.podium.3` | `art/hall/equipment/podium-3.png` | 128×128 | — | placeholder | Training equipment: Podium (Presence), State of the art |
| `hall.crown.case` | `art/hall/crown-case.png` | 128×128 | — | placeholder | Crown Room: a trophy case (one per trophy, with its count) |
| `prop.campfire` | `art/packs/myart/props/prop-campfire.png` | 62×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.signpost` | `art/walk/props/signpost.png` | 32×48 | — | placeholder | Exit from a town or wild area |
| `prop.gather.herb` | `art/packs/myart/props/prop-gather-herb.png` | 57×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.gather.ore` | `art/packs/myart/props/prop-gather-ore.png` | 58×53 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.gather.coin` | `art/packs/myart/props/prop-gather-coin.png` | 62×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `site.marker.inspect` | `art/sites/marker-inspect.png` | 28×28 | — | placeholder | Contract objective on a walkable map: something to inspect (tracks, a clue, a lock) |
| `site.marker.collect` | `art/sites/marker-collect.png` | 28×28 | — | placeholder | Contract objective on a walkable map: something to collect (herbs, ore, evidence, a cache) |
| `site.marker.destination` | `art/sites/marker-destination.png` | 28×28 | — | placeholder | Contract objective on a walkable map: where an escort ends |
| `site.marker.door` | `art/sites/marker-door.png` | 32×40 | — | placeholder | A door in town to a painted contract site |
| `prop.fountain` | `art/packs/myart/props/fountain.png` | 192×192 | — | ready | Fountain basin |
| `prop.noticeboard` | `art/packs/myart/props/prop-noticeboard.png` | 123×113 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.well` | `art/packs/myart/props/well.png` | 127×166 | — | ready | Well (blue roof) |
| `prop.kiln` | `art/packs/myart/props/kiln.png` | 64×127 | — | ready | Kiln chimney |
| `prop.stall` | `art/packs/myart/props/stall.png` | 192×181 | — | ready | Market stall (striped awning) |
| `prop.lamp` | `art/packs/myart/props/lamp.png` | 61×256 | — | ready | Street lamp |
| `prop.elderoak` | `art/packs/myart/props/prop-elderoak.png` | 229×316 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.wardstone` | `art/packs/myart/props/prop-wardstone.png` | 61×107 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.herbcart` | `art/packs/myart/props/prop-herbcart.png` | 96×120 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.beehives` | `art/walk/props/beehives.png` | 64×64 | — | placeholder | Greenhollow: beehives |
| `prop.forge` | `art/packs/myart/props/prop-forge.png` | 61×124 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.plaque` | `art/packs/myart/props/prop-plaque.png` | 114×120 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.statue` | `art/packs/myart/props/prop-statue.png` | 62×115 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.anvil` | `art/packs/myart/props/prop-anvil.png` | 62×50 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.crates` | `art/packs/myart/props/crates.png` | 124×63 | — | ready | Crate and barrel |
| `prop.windbell` | `art/walk/props/windbell.png` | 64×96 | — | placeholder | Windmere: The wind bell |
| `prop.milestone` | `art/packs/myart/props/prop-milestone.png` | 94×121 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tent` | `art/packs/myart/props/deco-tent.png` | 192×256 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.log` | `art/packs/myart/props/deco-log.png` | 176×60 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.spit` | `art/packs/myart/props/deco-spit.png` | 123×93 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.cart` | `art/packs/myart/props/deco-cart.png` | 96×120 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.signpost` | `art/packs/myart/props/deco-signpost.png` | 64×125 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.signpost-2` | `art/packs/myart/props/deco-signpost-2.png` | 64×82 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rock-big` | `art/packs/myart/props/deco-rock-big.png` | 117×119 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stump` | `art/packs/myart/props/deco-stump.png` | 55×62 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rocks` | `art/packs/myart/props/deco-rocks.png` | 63×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.standing-stone` | `art/packs/myart/props/deco-standing-stone.png` | 94×121 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.banner` | `art/packs/myart/props/deco-banner.png` | 64×128 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.skull-pike` | `art/packs/myart/props/deco-skull-pike.png` | 34×124 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.campfire` | `art/packs/myart/props/deco-campfire.png` | 62×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.crate` | `art/packs/myart/props/deco-crate.png` | 126×77 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.firewood` | `art/packs/myart/props/deco-firewood.png` | 52×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.sacks` | `art/packs/myart/props/deco-sacks.png` | 64×89 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.grave-cross` | `art/packs/myart/props/deco-grave-cross.png` | 61×94 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.ruin-column` | `art/packs/myart/props/deco-ruin-column.png` | 62×115 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.log-hollow` | `art/packs/myart/props/deco-log-hollow.png` | 60×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stump-moss` | `art/packs/myart/props/deco-stump-moss.png` | 62×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.grave` | `art/packs/myart/props/deco-grave.png` | 60×93 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.flowers-white` | `art/packs/myart/props/deco-flowers-white.png` | 57×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.flowers-pink` | `art/packs/myart/props/deco-flowers-pink.png` | 44×57 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.flowers-red` | `art/packs/myart/props/deco-flowers-red.png` | 53×63 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.fern` | `art/packs/myart/props/deco-fern.png` | 51×49 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.fern-2` | `art/packs/myart/props/deco-fern-2.png` | 60×64 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.mushrooms` | `art/packs/myart/props/deco-mushrooms.png` | 115×125 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.reeds` | `art/packs/myart/props/deco-reeds.png` | 63×64 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.pebbles` | `art/packs/myart/props/deco-pebbles.png` | 59×53 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.bush` | `art/packs/myart/props/deco-bush.png` | 64×64 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.hollowwarden` | `art/walk/props/hollowwarden.png` | 32×64 | — | placeholder | The Blackwood: The Hollow Warden |
| `prop.brokenlantern` | `art/walk/props/brokenlantern.png` | 32×64 | — | placeholder | The Blackwood: Broken lantern |
| `deco.tree-oak` | `art/packs/myart/props/deco-tree-oak.png` | 191×298 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-pine` | `art/packs/myart/props/deco-tree-pine.png` | 186×311 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-dead` | `art/packs/myart/props/deco-tree-dead.png` | 117×302 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-broad` | `art/packs/myart/props/deco-tree-broad.png` | 229×316 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-dead-small` | `art/packs/myart/props/deco-tree-dead-small.png` | 47×116 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.bush-dead` | `art/packs/myart/props/deco-bush-dead.png` | 118×111 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rock-tall` | `art/packs/myart/props/deco-rock-tall.png` | 61×107 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rock-flat` | `art/packs/myart/props/deco-rock-flat.png` | 120×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stump-big` | `art/packs/myart/props/deco-stump-big.png` | 116×127 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.haystack` | `art/packs/myart/props/deco-haystack.png` | 125×109 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.barrel` | `art/packs/myart/props/deco-barrel.png` | 62×61 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.log-pile` | `art/packs/myart/props/deco-log-pile.png` | 128×124 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.bench` | `art/packs/myart/props/deco-bench.png` | 127×60 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.fence` | `art/packs/myart/props/deco-fence.png` | 171×64 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stocks` | `art/packs/myart/props/deco-stocks.png` | 114×83 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.crystals` | `art/packs/myart/props/deco-crystals.png` | 59×111 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |

## Character sprite (`char`, placeholder #8a6a23)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `hall.pose.patient` | `art/hall/pose-patient.png` | 96×96 | — | placeholder | Guild Hall: a hero lying in an infirmary bed (silhouette) |
| `hall.pose.sleeping` | `art/hall/pose-sleeping.png` | 96×96 | — | placeholder | Guild Hall: a hero asleep in a bedroom (silhouette) |
| `hall.pose.training` | `art/hall/pose-training.png` | 96×96 | — | placeholder | Guild Hall: a hero at the training equipment (silhouette) |
| `char.founder` | `art/packs/myart/chars/char-founder.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.guardian` | `art/packs/myart/chars/char-class-guardian.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.duelist` | `art/packs/myart/chars/char-class-duelist.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.ranger` | `art/packs/myart/chars/char-class-ranger.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.rogue` | `art/packs/myart/chars/char-class-rogue.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.cleric` | `art/packs/myart/chars/char-class-cleric.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.mage` | `art/packs/myart/chars/char-class-mage.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.scholar` | `art/packs/myart/chars/char-class-scholar.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.class.artificer` | `art/packs/myart/chars/char-class-artificer.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |

## Battle background (`battle`, placeholder #6a2f34)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `bg.battle.oldroad` | `art/battle/oldroad.png` | 1280×576 | — | ready | Battles on the Old Road |
| `bg.battle.thornwood` | `art/battle/thornwood.png` | 1280×576 | — | ready | Battles at the Thornwood edge |
| `bg.battle.blackwood` | `art/battle/blackwood.png` | 1280×576 | — | ready | Battles in the Blackwood |
| `bg.battle.arena` | `art/battle/arena.png` | 1280×576 | `art/scenes/scene_02.png` | ready | Tournaments, duels, challenges |
| `bg.battle.fire` | `art/battle/fire.png` | 1280×576 | `art/scenes/scene_12.png` | ready | Battles in Fire lands |
| `bg.battle.plant` | `art/battle/plant.png` | 1280×576 | `art/scenes/scene_11.png` | ready | Battles in Plant lands |
| `bg.battle.water` | `art/battle/water.png` | 1280×576 | `art/scenes/scene_04.png` | ready | Battles in Water lands |
| `bg.battle.air` | `art/battle/air.png` | 1280×576 | `art/scenes/scene_05.png` | ready | Battles in Air lands |
| `bg.battle.animal` | `art/battle/animal.png` | 1280×576 | `art/scenes/scene_11.png` | ready | Battles in Animal lands |
| `bg.battle.psychic` | `art/battle/psychic.png` | 1280×576 | `art/scenes/scene_06.png` | ready | Battles in Psychic lands |
| `bg.battle.iron` | `art/battle/iron.png` | 1280×576 | `art/scenes/scene_12.png` | ready | Battles in Iron lands |

## NPC sprite (`npc`, placeholder #4f3d78)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `npc.house.rook` | `art/walk/house/rook.png` | 88×56 | — | placeholder | Player’s house: Cassian Rook, wounded, on the floor |
| `npc.dunmere.merchant` | `art/packs/myart/chars/npc-dunmere-merchant.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.fighter` | `art/packs/myart/chars/npc-dunmere-fighter.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.stablemaster` | `art/packs/myart/chars/npc-dunmere-stablemaster.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.nessa` | `art/packs/myart/chars/npc-dunmere-nessa.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.traveler` | `art/packs/myart/chars/npc-dunmere-traveler.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.herald` | `art/packs/myart/chars/npc-dunmere-herald.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.kilnmaster` | `art/packs/myart/chars/npc-dunmere-kilnmaster.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.lamplighter` | `art/packs/myart/chars/npc-dunmere-lamplighter.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.herbalist` | `art/packs/myart/chars/npc-greenhollow-herbalist.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.warden` | `art/packs/myart/chars/npc-greenhollow-warden.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.storyteller` | `art/packs/myart/chars/npc-greenhollow-storyteller.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.stablehand` | `art/packs/myart/chars/npc-greenhollow-stablehand.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.cleric` | `art/packs/myart/chars/npc-greenhollow-cleric.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.foreman` | `art/packs/myart/chars/npc-ironford-foreman.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.tollkeeper` | `art/packs/myart/chars/npc-ironford-tollkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.smith` | `art/packs/myart/chars/npc-ironford-smith.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.guard` | `art/packs/myart/chars/npc-ironford-guard.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.scholar` | `art/packs/myart/chars/npc-ironford-scholar.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.archivist` | `art/packs/myart/chars/npc-ironford-archivist.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.courier` | `art/packs/myart/chars/npc-windmere-courier.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.monk` | `art/packs/myart/chars/npc-windmere-monk.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.high-priestess` | `art/packs/myart/chars/npc-role-high-priestess.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.priest` | `art/packs/myart/chars/npc-role-priest.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.innkeeper` | `art/packs/myart/chars/npc-dunmere-innkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.shopkeeper` | `art/packs/myart/chars/npc-role-shopkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.registrar` | `art/packs/myart/chars/npc-role-registrar.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.referee` | `art/packs/myart/chars/npc-role-referee.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.herald-s-clerk` | `art/packs/myart/chars/npc-role-herald-s-clerk.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.innkeeper` | `art/packs/myart/chars/npc-greenhollow-innkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.herb-seller` | `art/packs/myart/chars/npc-role-herb-seller.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.barkeep` | `art/packs/myart/chars/npc-ironford-barkeep.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.forge-trader` | `art/packs/myart/chars/npc-role-forge-trader.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.assay-clerk` | `art/packs/myart/chars/npc-role-assay-clerk.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.innkeeper` | `art/packs/myart/chars/npc-role-innkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.courier-supplier` | `art/packs/myart/chars/npc-role-courier-supplier.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.council-steward` | `art/packs/myart/chars/npc-role-council-steward.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.watch-sergeant` | `art/packs/myart/chars/npc-role-watch-sergeant.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.temple-acolyte` | `art/packs/myart/chars/npc-role-temple-acolyte.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.trader` | `art/packs/myart/chars/npc-role-trader.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.traveller` | `art/packs/myart/chars/npc-role-traveller.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.messenger` | `art/packs/myart/chars/npc-role-messenger.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |

## Tileset (`tileset`, placeholder #3a3a3a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `tiles.ground` | `art/walk/tiles/ground.png` | 384×32 | — | placeholder | Ground tiles for towns and wild areas, one row of 32 px tiles in src/data/tiles.js order |
| `tiles.handpainted` | `art/packs/myart/tiles/ground-atlas.png` | 512×512 | — | ready | Ground tiles (hand-painted), painted into each walkable map by src/explore/groundPaint.js |

## Portrait (`portrait`, placeholder #6a4a5e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `portrait.poi` | `art/portraits/npcs/poi.png` | 160×160 | — | placeholder | Dialogue portrait for places and objects (fountain, statue, wells…) |
| `portrait.arena.referee` | `art/portraits/npcs/arena-referee.png` | 160×160 | — | placeholder | Arena referee at the fighting ground (starts bouts) |
| `portrait.arena.registrar` | `art/portraits/npcs/arena-registrar.png` | 160×160 | — | placeholder | Arena registrar at the sign-up desk |
| `portrait.story.founder` | `art/portraits/story/founder.png` | 160×160 | `art/packs/myart/chars/char-founder-still.png` | borrowed | You, the founder, in dialogue (the class sprite stands in later) |
| `portrait.story.rook` | `art/portraits/story/rook.png` | 160×160 | — | placeholder | Lord Cassian Rook: battered armor, silver insignia, dying (prologue) |
| `portrait.story.thorne` | `art/portraits/story/thorne.png` | 160×160 | — | placeholder | Garrick Thorne: guildmaster of the Argent Crown, charming and cold |
| `portrait.story.mara` | `art/portraits/story/mara.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-innkeeper-still.png` | borrowed | Mara Fen: keeper of the Wayfarer, practical and funny |
| `portrait.story.nessa` | `art/portraits/story/nessa.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-nessa-still.png` | borrowed | Nessa Thornfield: young Ranger, hunter and guide |
| `portrait.story.bram` | `art/portraits/story/bram.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-fighter-still.png` | borrowed | Bram Calder: proud Duelist from Dunmere |
| `portrait.story.wren` | `art/portraits/story/wren.png` | 160×160 | — | placeholder | Wren: the Broken Lantern’s last scout, living as “Linnet” |
| `portrait.story.herbalist` | `art/portraits/story/herbalist.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-herbalist-still.png` | borrowed | Maren Bell: retired herbalist of Greenhollow |
| `portrait.story.quartermaster` | `art/portraits/story/quartermaster.png` | 160×160 | `art/packs/myart/chars/npc-ironford-archivist-still.png` | borrowed | Oswin Tull: former Argent Crown quartermaster, now an archive keeper in Ironford |
| `portrait.story.champion` | `art/portraits/story/champion.png` | 160×160 | — | placeholder | Halden Marsh: aging Windmere champion |
| `portrait.story.representative` | `art/portraits/story/representative.png` | 160×160 | — | placeholder | The Argent Crown’s well-dressed representative |
| `portrait.story.stablemaster` | `art/portraits/story/stablemaster.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-stablemaster-still.png` | borrowed | Gideon Rusk: owner of the old stable on Banner Plaza |
| `portrait.dunmere.merchant` | `art/portraits/npcs/dunmere-merchant.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-merchant-still.png` | borrowed | Dunmere: Corwin Pell, Road merchant (dialogue portrait) |
| `portrait.dunmere.fighter` | `art/portraits/npcs/dunmere-fighter.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-fighter-still.png` | borrowed | Dunmere: Bram Calder, Duelist (dialogue portrait) |
| `portrait.dunmere.stablemaster` | `art/portraits/npcs/dunmere-stablemaster.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-stablemaster-still.png` | borrowed | Dunmere: Gideon Rusk, Stable owner (dialogue portrait) |
| `portrait.dunmere.nessa` | `art/portraits/npcs/dunmere-nessa.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-nessa-still.png` | borrowed | Dunmere: Nessa Thornfield, Hunter (dialogue portrait) |
| `portrait.dunmere.traveler` | `art/portraits/npcs/dunmere-traveler.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-traveler-still.png` | borrowed | Dunmere: Iven Quill, Traveler (dialogue portrait) |
| `portrait.dunmere.herald` | `art/portraits/npcs/dunmere-herald.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-herald-still.png` | borrowed | Dunmere: Orren Pike, Herald (dialogue portrait) |
| `portrait.dunmere.kilnmaster` | `art/portraits/npcs/dunmere-kilnmaster.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-kilnmaster-still.png` | borrowed | Dunmere: Hesta Coal, Kiln-master (dialogue portrait) |
| `portrait.dunmere.lamplighter` | `art/portraits/npcs/dunmere-lamplighter.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-lamplighter-still.png` | borrowed | Dunmere: Pip, Lamplighter (dialogue portrait) |
| `portrait.greenhollow.herbalist` | `art/portraits/npcs/greenhollow-herbalist.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-herbalist-still.png` | borrowed | Greenhollow: Maren Bell, Herbalist (dialogue portrait) |
| `portrait.greenhollow.warden` | `art/portraits/npcs/greenhollow-warden.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-warden-still.png` | borrowed | Greenhollow: Warden Tamsin, Forest warden (dialogue portrait) |
| `portrait.greenhollow.storyteller` | `art/portraits/npcs/greenhollow-storyteller.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-storyteller-still.png` | borrowed | Greenhollow: Old Fen, Storyteller (dialogue portrait) |
| `portrait.greenhollow.stablehand` | `art/portraits/npcs/greenhollow-stablehand.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-stablehand-still.png` | borrowed | Greenhollow: Kit, Stablehand (dialogue portrait) |
| `portrait.greenhollow.cleric` | `art/portraits/npcs/greenhollow-cleric.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-cleric-still.png` | borrowed | Greenhollow: Brother Alder, Grove cleric (dialogue portrait) |
| `portrait.ironford.foreman` | `art/portraits/npcs/ironford-foreman.png` | 160×160 | `art/packs/myart/chars/npc-ironford-foreman-still.png` | borrowed | Ironford: Dagna Hale, Foundry foreman (dialogue portrait) |
| `portrait.ironford.tollkeeper` | `art/portraits/npcs/ironford-tollkeeper.png` | 160×160 | `art/packs/myart/chars/npc-ironford-tollkeeper-still.png` | borrowed | Ironford: Ansel Brook, Bridge toll-keeper (dialogue portrait) |
| `portrait.ironford.smith` | `art/portraits/npcs/ironford-smith.png` | 160×160 | `art/packs/myart/chars/npc-ironford-smith-still.png` | borrowed | Ironford: Corr Anvilson, Smith (dialogue portrait) |
| `portrait.ironford.guard` | `art/portraits/npcs/ironford-guard.png` | 160×160 | `art/packs/myart/chars/npc-ironford-guard-still.png` | borrowed | Ironford: Ysolde Marr, Caravan guard (dialogue portrait) |
| `portrait.ironford.scholar` | `art/portraits/npcs/ironford-scholar.png` | 160×160 | `art/packs/myart/chars/npc-ironford-scholar-still.png` | borrowed | Ironford: Venn Ashby, Visiting scholar (dialogue portrait) |
| `portrait.ironford.archivist` | `art/portraits/npcs/ironford-archivist.png` | 160×160 | `art/packs/myart/chars/npc-ironford-archivist-still.png` | borrowed | Ironford: Oswin Tull, Archive keeper (dialogue portrait) |
| `portrait.windmere.courier` | `art/portraits/npcs/windmere-courier.png` | 160×160 | `art/packs/myart/chars/npc-windmere-courier-still.png` | borrowed | Windmere: Sela Wick, Courier (dialogue portrait) |
| `portrait.windmere.monk` | `art/portraits/npcs/windmere-monk.png` | 160×160 | `art/packs/myart/chars/npc-windmere-monk-still.png` | borrowed | Windmere: Brother Hale, Monastery keeper (dialogue portrait) |
| `portrait.role.high-priestess` | `art/portraits/roles/high-priestess.png` | 160×160 | `art/packs/myart/chars/npc-role-high-priestess-still.png` | borrowed | Dialogue portrait: High priestess |
| `portrait.role.priest` | `art/portraits/roles/priest.png` | 160×160 | `art/packs/myart/chars/npc-role-priest-still.png` | borrowed | Dialogue portrait: Priest |
| `portrait.role.shopkeeper` | `art/portraits/roles/shopkeeper.png` | 160×160 | `art/packs/myart/chars/npc-role-shopkeeper-still.png` | borrowed | Dialogue portrait: Shopkeeper |
| `portrait.role.herald-s-clerk` | `art/portraits/roles/herald-s-clerk.png` | 160×160 | `art/packs/myart/chars/npc-role-herald-s-clerk-still.png` | borrowed | Dialogue portrait: Herald’s clerk |
| `portrait.greenhollow.innkeeper` | `art/portraits/npcs/greenhollow-innkeeper.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-innkeeper-still.png` | borrowed | Dialogue portrait: Innkeeper |
| `portrait.role.herb-seller` | `art/portraits/roles/herb-seller.png` | 160×160 | `art/packs/myart/chars/npc-role-herb-seller-still.png` | borrowed | Dialogue portrait: Herb seller |
| `portrait.ironford.barkeep` | `art/portraits/npcs/ironford-barkeep.png` | 160×160 | `art/packs/myart/chars/npc-ironford-barkeep-still.png` | borrowed | Dialogue portrait: Barkeep |
| `portrait.role.forge-trader` | `art/portraits/roles/forge-trader.png` | 160×160 | `art/packs/myart/chars/npc-role-forge-trader-still.png` | borrowed | Dialogue portrait: Forge trader |
| `portrait.role.assay-clerk` | `art/portraits/roles/assay-clerk.png` | 160×160 | `art/packs/myart/chars/npc-role-assay-clerk-still.png` | borrowed | Dialogue portrait: Assay clerk |
| `portrait.role.innkeeper` | `art/portraits/roles/innkeeper.png` | 160×160 | `art/packs/myart/chars/npc-role-innkeeper-still.png` | borrowed | Dialogue portrait: Innkeeper |
| `portrait.role.courier-supplier` | `art/portraits/roles/courier-supplier.png` | 160×160 | `art/packs/myart/chars/npc-role-courier-supplier-still.png` | borrowed | Dialogue portrait: Courier supplier |
| `portrait.role.council-steward` | `art/portraits/roles/council-steward.png` | 160×160 | `art/packs/myart/chars/npc-role-council-steward-still.png` | borrowed | Dialogue portrait by role: council steward |
| `portrait.role.watch-sergeant` | `art/portraits/roles/watch-sergeant.png` | 160×160 | `art/packs/myart/chars/npc-role-watch-sergeant-still.png` | borrowed | Dialogue portrait by role: watch sergeant |
| `portrait.role.temple-acolyte` | `art/portraits/roles/temple-acolyte.png` | 160×160 | `art/packs/myart/chars/npc-role-temple-acolyte-still.png` | borrowed | Dialogue portrait by role: temple acolyte |
| `portrait.role.trader` | `art/portraits/roles/trader.png` | 160×160 | `art/packs/myart/chars/npc-role-trader-still.png` | borrowed | Dialogue portrait by role: trader |
| `portrait.role.traveller` | `art/portraits/roles/traveller.png` | 160×160 | `art/packs/myart/chars/npc-role-traveller-still.png` | borrowed | Dialogue portrait by role: traveller |
| `portrait.role.messenger` | `art/portraits/roles/messenger.png` | 160×160 | `art/packs/myart/chars/npc-role-messenger-still.png` | borrowed | Dialogue portrait by role: messenger |
| `portrait.class.guardian` | `art/portraits/classes/guardian.png` | 160×160 | `art/portraits/guardian.png` | borrowed | Dialogue portrait for a Guardian recruit |
| `portrait.class.duelist` | `art/portraits/classes/duelist.png` | 160×160 | `art/portraits/duelist.png` | borrowed | Dialogue portrait for a Duelist recruit |
| `portrait.class.ranger` | `art/portraits/classes/ranger.png` | 160×160 | `art/portraits/ranger.png` | borrowed | Dialogue portrait for a Ranger recruit |
| `portrait.class.rogue` | `art/portraits/classes/rogue.png` | 160×160 | `art/portraits/rogue.png` | borrowed | Dialogue portrait for a Rogue recruit |
| `portrait.class.cleric` | `art/portraits/classes/cleric.png` | 160×160 | `art/portraits/cleric.png` | borrowed | Dialogue portrait for a Cleric recruit |
| `portrait.class.mage` | `art/portraits/classes/mage.png` | 160×160 | `art/portraits/mage.png` | borrowed | Dialogue portrait for a Mage recruit |
| `portrait.class.scholar` | `art/portraits/classes/scholar.png` | 160×160 | `art/portraits/scholar.png` | borrowed | Dialogue portrait for a Scholar recruit |
| `portrait.class.artificer` | `art/portraits/classes/artificer.png` | 160×160 | `art/portraits/artificer.png` | borrowed | Dialogue portrait for a Artificer recruit |
| `portrait.dunmere.innkeeper` | `art/portraits/npcs/dunmere-innkeeper.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-innkeeper-still.png` | borrowed | Dialogue portrait (its walking character until painted) |
| `portrait.role.registrar` | `art/portraits/npcs/role-registrar.png` | 160×160 | `art/packs/myart/chars/npc-role-registrar-still.png` | borrowed | Dialogue portrait (its walking character until painted) |
| `portrait.role.referee` | `art/portraits/npcs/role-referee.png` | 160×160 | `art/packs/myart/chars/npc-role-referee-still.png` | borrowed | Dialogue portrait (its walking character until painted) |

## Battle effect (`fx`, placeholder #5a2a6a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `fx.slash` | `art/fx/slash.png` | 152×130 | `art/effects/effect_14.png` | borrowed | Physical hit: slash |
| `fx.pierce` | `art/fx/pierce.png` | 152×130 | `art/effects/effect_07.png` | borrowed | Physical hit: arrows, daggers |
| `fx.fire` | `art/fx/fire.png` | 152×130 | `art/effects/effect_01.png` | borrowed | Fire spells, burn ticks, bombs |
| `fx.ice` | `art/fx/ice.png` | 152×130 | `art/effects/effect_02.png` | borrowed | Water spells (ice) |
| `fx.lightning` | `art/fx/lightning.png` | 152×130 | `art/effects/effect_06.png` | borrowed | Air, Iron and other spells (lightning) |
| `fx.heal` | `art/fx/heal.png` | 152×130 | `art/effects/effect_08.png` | borrowed | Heals, revives, regen ticks |
| `fx.buff` | `art/fx/buff.png` | 152×130 | `art/effects/effect_09.png` | borrowed | Buffs, guard, taunt |
| `fx.debuff` | `art/fx/debuff.png` | 152×130 | `art/effects/effect_13.png` | borrowed | Debuffs, stuns, charging |
| `fx.poison` | `art/fx/poison.png` | 152×130 | `art/effects/effect_11.png` | borrowed | Poison ticks |

## Crest (`crest`, placeholder #5c4a1e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `crest.charter.merchant` | `art/crests/charter-merchant.png` | 128×128 | — | placeholder | Charter crest: Merchant House (new game, top bar, Herald) |
| `crest.charter.free` | `art/crests/charter-free.png` | 128×128 | — | placeholder | Charter crest: Free Company (new game, top bar, Herald) |
| `crest.charter.scholars` | `art/crests/charter-scholars.png` | 128×128 | — | placeholder | Charter crest: Scholars’ Lodge (new game, top bar, Herald) |
| `crest.charter.shield` | `art/crests/charter-shield.png` | 128×128 | — | placeholder | Charter crest: Shield of the People (new game, top bar, Herald) |
| `crest.patron.trade` | `art/crests/patron-trade.png` | 128×128 | — | placeholder | Patron crest: The Dunmere Trade House (Connections) |
| `crest.patron.temple` | `art/crests/patron-temple.png` | 128×128 | — | placeholder | Patron crest: The Temple of the Dawn (Connections) |
| `crest.patron.smiths` | `art/crests/patron-smiths.png` | 128×128 | — | placeholder | Patron crest: The Ironford Smiths’ Guild (Connections) |
| `crest.argent-crown` | `art/crests/argent-crown.png` | 128×128 | — | placeholder | The Argent Crown’s emblem (scratched into the door, Herald, rival pages) |

## Interface (`ui`, placeholder #255a5a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `relic.banner` | `art/relics/last-banner.png` | 120×160 | — | placeholder | The Last Banner: torn, bloodstained, a golden lantern (naming card, Trophy hall, Lore codex) |
| `award.mvp` | `art/awards/award-mvp.png` | 64×64 | — | placeholder | MVP of the season (review, career tab, hall of fame) |
| `award.rookie` | `art/awards/award-rookie.png` | 64×64 | — | placeholder | Rookie of the year |
| `award.signing` | `art/awards/award-signing.png` | 64×64 | — | placeholder | Best signing of the year |
| `trophy.title` | `art/awards/trophy-title.png` | 64×64 | — | placeholder | Tournament title (season review, record book) |
| `trophy.record` | `art/awards/trophy-record.png` | 64×64 | — | placeholder | Record broken (moment, record book) |
| `trophy.hall` | `art/awards/trophy-hall.png` | 64×64 | — | placeholder | Hall of fame plaque |
| `ui.overworld` | `ui/overworld.png` | 200×125 | — | ready | World map terrain |

## Enemy on the map (`enemy`, placeholder #7a3a22)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `enemy.group.wolfskins` | `art/packs/myart/foes/group-wolfskins.png` | 386×301 | — | ready | Enemy group on the map: wolfskin, road-bandit, wolfskin |
| `enemy.group.bandits` | `art/packs/myart/foes/group-bandits.png` | 398×283 | — | ready | Enemy group on the map: road-bandit, shield-thug, field-priest |
| `enemy.group.witch` | `art/packs/myart/foes/group-witch.png` | 435×328 | — | ready | Enemy group on the map: hedge-witch, shield-thug |
| `enemy.boss.alpha` | `art/packs/myart/foes/boss-alpha.png` | 184×330 | — | ready | Boss on the map: grey-alpha |
| `enemy.boss.abbot` | `art/packs/myart/foes/boss-abbot.png` | 194×328 | — | ready | Boss on the map: ash-abbot |
| `enemy.group.stalkers` | `art/packs/myart/foes/group-stalkers.png` | 297×286 | — | ready | Enemy group on the map: thorn-stalker, thorn-stalker |
| `enemy.group.spores` | `art/packs/myart/foes/group-spores.png` | 359×294 | — | ready | Enemy group on the map: spore-caller, grove-mender |
| `enemy.group.barkhides` | `art/packs/myart/foes/group-barkhides.png` | 317×330 | — | ready | Enemy group on the map: bark-brute, moss-warden |
| `enemy.boss.captain` | `art/packs/myart/foes/boss-captain.png` | 194×307 | — | ready | Boss on the map: bandit-captain |
| `enemy.group.wraiths` | `art/packs/myart/foes/group-wraiths.png` | 398×291 | — | ready | Enemy group on the map: veil-wraith, mind-thief, veil-wraith |
| `enemy.group.hollow` | `art/packs/myart/foes/group-hollow.png` | 373×327 | — | ready | Enemy group on the map: hollow-knight, void-juggernaut |
| `enemy.boss.lanterneater` | `art/packs/myart/foes/boss-lanterneater.png` | 210×285 | — | ready | Boss on the map: lantern-brood |

## Battle sprite (`battler`, placeholder #6a3a1a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `battle.foe.road-bandit` | `art/packs/myart/foes/road-bandit.png` | 184×283 | — | ready | Enemy in battle: road-bandit (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.wolfskin` | `art/packs/myart/foes/wolfskin.png` | 170×301 | — | ready | Enemy in battle: wolfskin (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.hedge-witch` | `art/packs/myart/foes/hedge-witch.png` | 281×328 | — | ready | Enemy in battle: hedge-witch (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.field-priest` | `art/packs/myart/foes/field-priest.png` | 166×274 | — | ready | Enemy in battle: field-priest (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.shield-thug` | `art/packs/myart/foes/shield-thug.png` | 190×283 | — | ready | Enemy in battle: shield-thug (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.thorn-stalker` | `art/packs/myart/foes/thorn-stalker.png` | 192×286 | — | ready | Enemy in battle: thorn-stalker (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.bark-brute` | `art/packs/myart/foes/bark-brute.png` | 168×314 | — | ready | Enemy in battle: bark-brute (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.spore-caller` | `art/packs/myart/foes/spore-caller.png` | 232×294 | — | ready | Enemy in battle: spore-caller (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.grove-mender` | `art/packs/myart/foes/grove-mender.png` | 217×278 | — | ready | Enemy in battle: grove-mender (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.moss-warden` | `art/packs/myart/foes/moss-warden.png` | 205×330 | — | ready | Enemy in battle: moss-warden (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.reef-raider` | `art/packs/myart/foes/reef-raider.png` | 187×276 | — | ready | Enemy in battle: reef-raider (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.shell-guard` | `art/packs/myart/foes/shell-guard.png` | 175×285 | — | ready | Enemy in battle: shell-guard (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.tide-caller` | `art/packs/myart/foes/tide-caller.png` | 190×285 | — | ready | Enemy in battle: tide-caller (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.brine-cleric` | `art/packs/myart/foes/brine-cleric.png` | 186×304 | — | ready | Enemy in battle: brine-cleric (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.harbor-brute` | `art/packs/myart/foes/harbor-brute.png` | 158×276 | — | ready | Enemy in battle: harbor-brute (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.sea-hag` | `art/packs/myart/foes/sea-hag.png` | 222×278 | — | ready | Enemy in battle: sea-hag (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.ash-runner` | `art/packs/myart/foes/ash-runner.png` | 158×283 | — | ready | Enemy in battle: ash-runner (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.pyre-zealot` | `art/packs/myart/foes/pyre-zealot.png` | 239×314 | — | ready | Enemy in battle: pyre-zealot (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.sun-templar` | `art/packs/myart/foes/sun-templar.png` | 192×301 | — | ready | Enemy in battle: sun-templar (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.ember-acolyte` | `art/packs/myart/foes/ember-acolyte.png` | 195×282 | — | ready | Enemy in battle: ember-acolyte (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.arena-brute` | `art/packs/myart/foes/arena-brute.png` | 212×302 | — | ready | Enemy in battle: arena-brute (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.gale-skirmisher` | `art/packs/myart/foes/gale-skirmisher.png` | 190×276 | — | ready | Enemy in battle: gale-skirmisher (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.storm-adept` | `art/packs/myart/foes/storm-adept.png` | 200×275 | — | ready | Enemy in battle: storm-adept (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.cliff-brute` | `art/packs/myart/foes/cliff-brute.png` | 197×286 | — | ready | Enemy in battle: cliff-brute (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.wind-shaman` | `art/packs/myart/foes/wind-shaman.png` | 243×321 | — | ready | Enemy in battle: wind-shaman (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.thunder-shield` | `art/packs/myart/foes/thunder-shield.png` | 173×286 | — | ready | Enemy in battle: thunder-shield (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.frost-reaver` | `art/packs/myart/foes/frost-reaver.png` | 190×330 | — | ready | Enemy in battle: frost-reaver (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.tusk-brute` | `art/packs/myart/foes/tusk-brute.png` | 166×314 | — | ready | Enemy in battle: tusk-brute (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.rime-seer` | `art/packs/myart/foes/rime-seer.png` | 211×284 | — | ready | Enemy in battle: rime-seer (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.rime-mother` | `art/packs/myart/foes/rime-mother.png` | 221×277 | — | ready | Enemy in battle: rime-mother (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.frostbound` | `art/packs/myart/foes/frostbound.png` | 188×330 | — | ready | Enemy in battle: frostbound (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.veil-wraith` | `art/packs/myart/foes/veil-wraith.png` | 178×281 | — | ready | Enemy in battle: veil-wraith (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.mind-thief` | `art/packs/myart/foes/mind-thief.png` | 190×291 | — | ready | Enemy in battle: mind-thief (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.hollow-knight` | `art/packs/myart/foes/hollow-knight.png` | 194×327 | — | ready | Enemy in battle: hollow-knight (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.dream-weaver` | `art/packs/myart/foes/dream-weaver.png` | 215×282 | — | ready | Enemy in battle: dream-weaver (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.void-juggernaut` | `art/packs/myart/foes/void-juggernaut.png` | 241×295 | — | ready | Enemy in battle: void-juggernaut (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-oswin` | `art/packs/myart/foes/boss-oswin.png` | 204×330 | — | ready | Enemy in battle: boss-oswin (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-briarmother` | `art/packs/myart/foes/boss-briarmother.png` | 206×289 | — | ready | Enemy in battle: boss-briarmother (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-maelra` | `art/packs/myart/foes/boss-maelra.png` | 195×278 | — | ready | Enemy in battle: boss-maelra (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-pyrelord` | `art/packs/myart/foes/boss-pyrelord.png` | 198×314 | — | ready | Enemy in battle: boss-pyrelord (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-tempest` | `art/packs/myart/foes/boss-tempest.png` | 188×276 | — | ready | Enemy in battle: boss-tempest (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-jarnvald` | `art/packs/myart/foes/boss-jarnvald.png` | 207×330 | — | ready | Enemy in battle: boss-jarnvald (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.boss-nameless` | `art/packs/myart/foes/boss-nameless.png` | 205×276 | — | ready | Enemy in battle: boss-nameless (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.ash-abbot` | `art/packs/myart/foes/ash-abbot.png` | 194×328 | — | ready | Enemy in battle: ash-abbot (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.grey-alpha` | `art/packs/myart/foes/grey-alpha.png` | 184×330 | — | ready | Enemy in battle: grey-alpha (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.bandit-captain` | `art/packs/myart/foes/bandit-captain.png` | 194×307 | — | ready | Enemy in battle: bandit-captain (HeroEditor parts, scripts/art/foes.py) |
| `battle.foe.lantern-brood` | `art/packs/myart/foes/lantern-brood.png` | 210×285 | — | ready | Enemy in battle: lantern-brood (HeroEditor parts, scripts/art/foes.py) |

## Not yet routed through the registry

Hero portraits and battle sprites (`art/portraits`, `art/sprites`), enemy battle sprites (`art/enemies`), effects (`art/effects`) and primal grounds (`art/primals`) still load by path. They move into the registry in later phases.
