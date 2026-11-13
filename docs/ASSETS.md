# Asset list

Every visual asset the game asks for, registered by id in [src/data/assets.js](../src/data/assets.js). Paths are relative to `public/`. This file is generated: run `node scripts/assets-doc.mjs` after changing the registry.

How it works: the loader uses the file at **Path** if it exists; otherwise **Borrows** (older shared art standing in); otherwise it draws a placeholder that looks intentional: a silhouette for people and enemies, a soft shape for props and buildings, a shield for crests, a mood gradient for backdrops (Settings → Developer → Show asset ids writes the id on it). Drop a file at the path and it is picked up with no code change. Status: *placeholder* = no file yet, *borrowed* = using older shared art, *ready* = dedicated file exists.

Walkable art (towns, wild areas) is generated from the place data in `src/data/towns/` and `src/data/wilds/`: every building, person, portrait, prop and enemy group placed there gets an entry. Building fronts are 5×5 tiles (160×160) with the door at the bottom centre; props are drawn one tile taller than their footprint. The ground tileset is one row of 32 px tiles in the order of `src/data/tiles.js`.

Phase 7 will add style notes and generation prompts for each entry.

## Backdrop (`bg`, placeholder #2f4a66)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `bg.title` | `art/packs/myart/bg/background_00_title.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.chronicle` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.town.dunmere` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.town.greenhollow` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.town.ironford` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.town.default` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.town.windmere` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.house` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.warning` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.greenhollow` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.archive` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.windmere` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.thornwood` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.banner` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.story.chapter` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.season.review` | `art/packs/myart/bg/background_04_reward.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |

## Building exterior (`building`, placeholder #5a4636)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `town.dunmere.guildhall.stage1` | `art/packs/myart/buildings/dunmere-guildhall-stage1.png` | 393×512 | — | ready | Dunmere: the Guild Hall (wooden house) |
| `town.windmere.inn` | `art/packs/myart/buildings/windmere-inn.png` | 405×448 | — | ready | Windmere: the inn |
| `town.windmere.shop` | `art/packs/myart/buildings/windmere-shop.png` | 437×576 | — | ready | Windmere: the shop |
| `town.dunmere.herald` | `art/packs/myart/buildings/dunmere-herald.png` | 373×576 | — | ready | Dunmere: Herald’s Office (purple gable house) |
| `town.windmere.arena` | `art/packs/myart/buildings/windmere-arena.png` | 455×512 | — | ready | Windmere: the arena |
| `town.dunmere.tavern` | `art/packs/myart/buildings/dunmere-tavern.png` | 405×448 | — | ready | Dunmere: The Wayfarer (thatched, the beer sign) |
| `town.dunmere.shop` | `art/packs/myart/buildings/dunmere-shop.png` | 437×576 | — | ready | Dunmere: Mira’s Supply (orange gable house, the potion sign) |
| `town.dunmere.arena` | `art/packs/myart/buildings/dunmere-arena.png` | 455×512 | — | ready | Dunmere: the arena (dark wooden house, the sword sign) |
| `town.greenhollow.tavern` | `art/packs/myart/buildings/greenhollow-tavern.png` | 405×448 | — | ready | Greenhollow: the tavern |
| `town.ironford.tavern` | `art/packs/myart/buildings/ironford-tavern.png` | 405×448 | — | ready | Ironford: the tavern |
| `town.ironford.shop` | `art/packs/myart/buildings/ironford-shop.png` | 435×576 | — | ready | Ironford: the shop (the armor sign) |
| `town.ironford.herald` | `art/packs/myart/buildings/ironford-herald.png` | 373×576 | — | ready | Ironford: the herald (blue gable house) |
| `town.ironford.arena` | `art/packs/myart/buildings/ironford-arena.png` | 455×512 | — | ready | Ironford: the arena |
| `town.greenhollow.shop` | `art/packs/myart/buildings/greenhollow-shop.png` | 437×576 | — | ready | Greenhollow: the shop |
| `town.dunmere.house` | `art/packs/myart/buildings/dunmere-house.png` | 393×512 | — | ready | Dunmere: your house (a small wooden cottage, autumn wood) |
| `town.greenhollow.lodge` | `art/packs/myart/buildings/greenhollow-lodge.png` | 341×448 | — | ready | Greenhollow: the lodge (moss thatch) |
| `town.greenhollow.arena` | `art/packs/myart/buildings/greenhollow-arena.png` | 455×512 | — | ready | Greenhollow: the arena |
| `town.ironford.offices` | `art/packs/myart/buildings/ironford-offices.png` | 393×512 | — | ready | Ironford: the offices |
| `town.ironford.archive` | `art/packs/myart/buildings/ironford-archive.png` | 493×576 | — | ready | Ironford: the Smiths’ archive (purple gable between columns) |
| `town.house.blue` | `art/packs/myart/buildings/house-blue.png` | 373×576 | — | ready | A town house (blue gable), not entered |
| `town.house.wood-dark` | `art/packs/myart/buildings/house-wood-dark.png` | 393×512 | — | ready | A dark wooden house, not entered |
| `town.house.orange` | `art/packs/myart/buildings/house-orange.png` | 373×576 | — | ready | A town house (orange gable), not entered |
| `town.house.thatch` | `art/packs/myart/buildings/house-thatch.png` | 341×448 | — | ready | A thatched cottage, not entered |
| `town.house.purple` | `art/packs/myart/buildings/house-purple.png` | 373×576 | — | ready | A town house (purple gable), not entered |
| `town.house.green` | `art/packs/myart/buildings/house-green.png` | 373×576 | — | ready | A town house (green gable), not entered |
| `town.house.wood-fall` | `art/packs/myart/buildings/house-wood-fall.png` | 393×512 | — | ready | An autumn-wood house, not entered |
| `town.windmere.monastery` | `art/packs/myart/buildings/windmere-monastery.png` | 461×448 | — | ready | Windmere: the cliff monastery (moss thatch between columns) |
| `town.windmere.courier` | `art/packs/myart/buildings/windmere-courier.png` | 455×512 | — | ready | Windmere: the courier post (the arrow sign) |
| `town.house.wood` | `art/packs/myart/buildings/house-wood.png` | 393×512 | — | ready | A wooden house, not entered |
| `town.house.moss` | `art/packs/myart/buildings/house-moss.png` | 341×448 | — | ready | A moss-thatched cottage, not entered |
| `town.oldroad.temple` | `art/packs/myart/buildings/oldroad-temple.png` | 493×576 | — | ready | The Old Road: Dawnwatch Temple (blue gable house between white columns) |
| `town.oldroad.priory` | `art/packs/myart/buildings/oldroad-priory.png` | 341×448 | — | ready | The Old Road: the priests’ house (moss thatch) |
| `town.house.hut` | `art/packs/myart/buildings/house-hut.png` | 128×169 | — | ready | A fisher’s hut, not entered |

## Interior (`interior`, placeholder #6b4a24)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `scene.hall.lot` | `art/hall/lot.png` | 1080×1080 | `art/interiors/guildhall-stage1.png` | borrowed | Guild Hall: the lot seen from above (the cabin, the slots, the yard) |
| `scene.defeat` | `art/packs/myart/bg/background_01_loading.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `interior.tavern` | `art/packs/myart/interiors/tavern.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.shop` | `art/packs/myart/interiors/shop.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.arena` | `art/packs/myart/interiors/arena.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.herald` | `art/packs/myart/interiors/herald.jpg` | 2560×1152 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
| `interior.noticeboard` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `interior.house` | `art/packs/myart/interiors/house.jpg` | 1280×896 | — | ready | Building interior (hand-painted tiles, scripts/art/interiors.py) |
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
| `interior.tavern.front0` | `art/packs/myart/interiors/tavern-front0.png` | 281×199 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.tavern.front1` | `art/packs/myart/interiors/tavern-front1.png` | 281×199 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.tavern.front2` | `art/packs/myart/interiors/tavern-front2.png` | 57×57 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.tavern.front3` | `art/packs/myart/interiors/tavern-front3.png` | 64×64 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.greenhollow.front0` | `art/packs/myart/interiors/inn-greenhollow-front0.png` | 281×281 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.greenhollow.front1` | `art/packs/myart/interiors/inn-greenhollow-front1.png` | 281×281 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.greenhollow.front2` | `art/packs/myart/interiors/inn-greenhollow-front2.png` | 57×57 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.greenhollow.front3` | `art/packs/myart/interiors/inn-greenhollow-front3.png` | 64×64 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.ironford.front0` | `art/packs/myart/interiors/inn-ironford-front0.png` | 281×281 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.ironford.front1` | `art/packs/myart/interiors/inn-ironford-front1.png` | 281×281 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.ironford.front2` | `art/packs/myart/interiors/inn-ironford-front2.png` | 57×57 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.ironford.front3` | `art/packs/myart/interiors/inn-ironford-front3.png` | 64×64 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.windmere.front0` | `art/packs/myart/interiors/inn-windmere-front0.png` | 281×281 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.windmere.front1` | `art/packs/myart/interiors/inn-windmere-front1.png` | 281×281 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.windmere.front2` | `art/packs/myart/interiors/inn-windmere-front2.png` | 57×57 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
| `interior.inn.windmere.front3` | `art/packs/myart/interiors/inn-windmere-front3.png` | 64×64 | — | ready | A piece of a room drawn above the people behind it (scripts/art/interiors.py) |
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
| `prop.signpost` | `art/packs/myart/props/prop-signpost.png` | 64×125 | — | ready | Marker on the walk map (Extra Objects) |
| `prop.gather.herb` | `art/packs/myart/props/prop-gather-herb.png` | 57×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.gather.ore` | `art/packs/myart/props/prop-gather-ore.png` | 58×53 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.gather.coin` | `art/packs/myart/props/prop-gather-coin.png` | 62×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `site.marker.inspect` | `art/packs/myart/props/site-marker-inspect.png` | 72×30 | — | ready | Marker on the walk map (Extra Objects) |
| `site.marker.collect` | `art/packs/myart/props/site-marker-collect.png` | 62×58 | — | ready | Marker on the walk map (Extra Objects) |
| `site.marker.destination` | `art/packs/myart/props/site-marker-destination.png` | 64×128 | — | ready | Marker on the walk map (Extra Objects) |
| `site.marker.door` | `art/packs/myart/props/site-marker-door.png` | 56×118 | — | ready | Marker on the walk map (Extra Objects) |
| `prop.noticeboard` | `art/packs/myart/props/prop-noticeboard.png` | 123×113 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.lamp` | `art/packs/myart/props/lamp.png` | 61×256 | — | ready | Street lamp |
| `prop.fountain` | `art/packs/myart/props/fountain.png` | 192×192 | — | ready | Fountain basin |
| `prop.well` | `art/packs/myart/props/well.png` | 127×166 | — | ready | Well (blue roof) |
| `prop.kiln` | `art/packs/myart/props/kiln.png` | 64×127 | — | ready | Kiln chimney |
| `prop.stall` | `art/packs/myart/props/stall.png` | 192×181 | — | ready | Market stall (striped awning) |
| `prop.elderoak` | `art/packs/myart/props/prop-elderoak.png` | 229×316 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.wardstone` | `art/packs/myart/props/prop-wardstone.png` | 61×107 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.herbcart` | `art/packs/myart/props/prop-herbcart.png` | 96×120 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.beehives` | `art/walk/props/beehives.png` | 64×64 | — | placeholder | Greenhollow: beehives |
| `prop.forge` | `art/packs/myart/props/prop-forge.png` | 61×124 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.anvil` | `art/packs/myart/props/prop-anvil.png` | 62×50 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.log-pile` | `art/packs/myart/props/deco-log-pile.png` | 128×124 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.statue` | `art/packs/myart/props/prop-statue.png` | 62×115 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.cart` | `art/packs/myart/props/deco-cart.png` | 96×120 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.crates` | `art/packs/myart/props/crates.png` | 124×63 | — | ready | Crate and barrel |
| `deco.barrel` | `art/packs/myart/props/deco-barrel.png` | 62×61 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.sacks` | `art/packs/myart/props/deco-sacks.png` | 64×89 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.plaque` | `art/packs/myart/props/prop-plaque.png` | 114×120 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.haystack` | `art/packs/myart/props/deco-haystack.png` | 125×109 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.bench` | `art/packs/myart/props/deco-bench.png` | 127×60 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.grave-cross` | `art/packs/myart/props/deco-grave-cross.png` | 61×94 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.grave` | `art/packs/myart/props/deco-grave.png` | 60×93 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.banner` | `art/packs/myart/props/deco-banner.png` | 64×128 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.signpost` | `art/packs/myart/props/deco-signpost.png` | 64×125 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `prop.milestone` | `art/packs/myart/props/prop-milestone.png` | 94×121 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.firewood` | `art/packs/myart/props/deco-firewood.png` | 52×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.pond` | `art/packs/myart/props/deco-pond.png` | 256×256 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tent` | `art/packs/myart/props/deco-tent.png` | 192×256 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.log` | `art/packs/myart/props/deco-log.png` | 176×60 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.spit` | `art/packs/myart/props/deco-spit.png` | 123×93 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.signpost-2` | `art/packs/myart/props/deco-signpost-2.png` | 64×82 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rock-big` | `art/packs/myart/props/deco-rock-big.png` | 117×119 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stump` | `art/packs/myart/props/deco-stump.png` | 55×62 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rocks` | `art/packs/myart/props/deco-rocks.png` | 63×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.standing-stone` | `art/packs/myart/props/deco-standing-stone.png` | 94×121 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.skull-pike` | `art/packs/myart/props/deco-skull-pike.png` | 34×124 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.campfire` | `art/packs/myart/props/deco-campfire.png` | 62×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.crate` | `art/packs/myart/props/deco-crate.png` | 126×77 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.ruin-column` | `art/packs/myart/props/deco-ruin-column.png` | 62×115 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.log-hollow` | `art/packs/myart/props/deco-log-hollow.png` | 60×58 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stump-moss` | `art/packs/myart/props/deco-stump-moss.png` | 62×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
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
| `deco.rock-tall` | `art/packs/myart/props/deco-rock-tall.png` | 61×107 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.rock-flat` | `art/packs/myart/props/deco-rock-flat.png` | 120×59 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-oak` | `art/packs/myart/props/deco-tree-oak.png` | 191×298 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-pine` | `art/packs/myart/props/deco-tree-pine.png` | 186×311 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-dead` | `art/packs/myart/props/deco-tree-dead.png` | 117×302 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-broad` | `art/packs/myart/props/deco-tree-broad.png` | 229×316 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.tree-dead-small` | `art/packs/myart/props/deco-tree-dead-small.png` | 47×116 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.bush-dead` | `art/packs/myart/props/deco-bush-dead.png` | 118×111 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
| `deco.stump-big` | `art/packs/myart/props/deco-stump-big.png` | 116×127 | — | ready | Hand-painted grassland object (scripts/art/wilds.py) |
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
| `char.founder.guardian` | `art/packs/myart/chars/char-founder-guardian.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.duelist` | `art/packs/myart/chars/char-founder-duelist.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.ranger` | `art/packs/myart/chars/char-founder-ranger.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.rogue` | `art/packs/myart/chars/char-founder-rogue.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.cleric` | `art/packs/myart/chars/char-founder-cleric.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.mage` | `art/packs/myart/chars/char-founder-mage.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.scholar` | `art/packs/myart/chars/char-founder-scholar.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `char.founder.artificer` | `art/packs/myart/chars/char-founder-artificer.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |

## Battle background (`battle`, placeholder #6a2f34)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `bg.battle.oldroad` | `art/packs/myart/bg/background_05_sample_00.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.thornwood` | `art/packs/myart/bg/background_05_sample_00.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.blackwood` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.arena` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.fire` | `art/packs/myart/bg/background_01_loading.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.plant` | `art/packs/myart/bg/background_05_sample_00.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.water` | `art/packs/myart/bg/background_05_sample_00.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.air` | `art/packs/myart/bg/background_05_sample_00.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.animal` | `art/packs/myart/bg/background_05_sample_00.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.psychic` | `art/packs/myart/bg/background_03_character.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |
| `bg.battle.iron` | `art/packs/myart/bg/background_02_home.jpg` | 1920×1080 | — | ready | Backdrop (GUI PRO Kit painted background) |

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
| `npc.dunmere.rowe` | `art/walk/npcs/dunmere-rowe.png` | 26×36 | — | placeholder | Dunmere: Tavish Rowe, The Dawnriders (walk sprite) |
| `npc.dunmere.hobb` | `art/walk/npcs/dunmere-hobb.png` | 26×36 | — | placeholder | Dunmere: Sergeant Hobb, Watch sergeant (walk sprite) |
| `npc.dunmere.kilnmaster` | `art/packs/myart/chars/npc-dunmere-kilnmaster.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.lamplighter` | `art/packs/myart/chars/npc-dunmere-lamplighter.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.herbalist` | `art/packs/myart/chars/npc-greenhollow-herbalist.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.quell` | `art/walk/npcs/greenhollow-quell.png` | 26×36 | — | placeholder | Greenhollow: Morra Quell, The Black Thistle (walk sprite) |
| `npc.greenhollow.warden` | `art/packs/myart/chars/npc-greenhollow-warden.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.storyteller` | `art/packs/myart/chars/npc-greenhollow-storyteller.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.stablehand` | `art/packs/myart/chars/npc-greenhollow-stablehand.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.greenhollow.cleric` | `art/packs/myart/chars/npc-greenhollow-cleric.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.foreman` | `art/packs/myart/chars/npc-ironford-foreman.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.smith` | `art/packs/myart/chars/npc-ironford-smith.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.apprentice` | `art/packs/myart/chars/npc-ironford-apprentice.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.archivist` | `art/packs/myart/chars/npc-ironford-archivist.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.tollkeeper` | `art/packs/myart/chars/npc-ironford-tollkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.docker` | `art/packs/myart/chars/npc-ironford-docker.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.guard` | `art/packs/myart/chars/npc-ironford-guard.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.caravan` | `art/packs/myart/chars/npc-ironford-caravan.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.ironford.scholar` | `art/packs/myart/chars/npc-ironford-scholar.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.monk` | `art/packs/myart/chars/npc-windmere-monk.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.novice` | `art/packs/myart/chars/npc-windmere-novice.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.courier` | `art/packs/myart/chars/npc-windmere-courier.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.lookout` | `art/packs/myart/chars/npc-windmere-lookout.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.dace` | `art/walk/npcs/windmere-dace.png` | 26×36 | — | placeholder | Windmere: Overseer Dace, Dock overseer (walk sprite) |
| `npc.windmere.fisher` | `art/packs/myart/chars/npc-windmere-fisher.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.windmere.cass` | `art/walk/npcs/windmere-cass.png` | 26×36 | — | placeholder | Windmere: Cass Vey, Fence (walk sprite) |
| `npc.role.high-priestess` | `art/packs/myart/chars/npc-role-high-priestess.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.temple-acolyte` | `art/packs/myart/chars/npc-role-temple-acolyte.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.priest` | `art/packs/myart/chars/npc-role-priest.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.dunmere.innkeeper` | `art/packs/myart/chars/npc-dunmere-innkeeper.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.traveller` | `art/packs/myart/chars/npc-role-traveller.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
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
| `npc.role.trader` | `art/packs/myart/chars/npc-role-trader.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.role.messenger` | `art/packs/myart/chars/npc-role-messenger.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.story.rook` | `art/packs/myart/chars/npc-story-rook.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.story.thorne` | `art/packs/myart/chars/npc-story-thorne.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.story.wren` | `art/packs/myart/chars/npc-story-wren.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.story.champion` | `art/packs/myart/chars/npc-story-champion.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |
| `npc.story.representative` | `art/packs/myart/chars/npc-story-representative.png` | 112×120 | — | ready | Walking character (HeroEditor parts, scripts/art/characters.py) |

## Tileset (`tileset`, placeholder #3a3a3a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `tiles.ground` | `art/walk/tiles/ground.png` | 384×32 | — | placeholder | Ground tiles for towns and wild areas, one row of 32 px tiles in src/data/tiles.js order |
| `tiles.handpainted` | `art/packs/myart/tiles/ground-atlas.png` | 512×512 | — | ready | Ground tiles (hand-painted), painted into each walkable map by src/explore/groundPaint.js |

## Portrait (`portrait`, placeholder #6a4a5e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `portrait.poi` | `art/portraits/npcs/poi.png` | 160×160 | — | placeholder | Dialogue portrait for places and objects (fountain, statue, wells…) |
| `portrait.arena.referee` | `art/portraits/npcs/arena-referee.png` | 160×160 | `art/packs/myart/chars/npc-role-referee-bust.png` | borrowed | Arena referee at the fighting ground (starts bouts) |
| `portrait.arena.registrar` | `art/portraits/npcs/arena-registrar.png` | 160×160 | `art/packs/myart/chars/npc-role-registrar-bust.png` | borrowed | Arena registrar at the sign-up desk |
| `portrait.story.founder` | `art/portraits/story/founder.png` | 160×160 | `art/packs/myart/chars/char-founder-bust.png` | borrowed | You, the founder, in dialogue (the class sprite stands in later) |
| `portrait.story.rook` | `art/portraits/story/rook.png` | 160×160 | `art/packs/myart/chars/npc-story-rook-bust.png` | borrowed | Lord Cassian Rook: battered armor, silver insignia, dying (prologue) |
| `portrait.story.thorne` | `art/portraits/story/thorne.png` | 160×160 | `art/packs/myart/chars/npc-story-thorne-bust.png` | borrowed | Garrick Thorne: guildmaster of the Argent Crown, charming and cold |
| `portrait.story.mara` | `art/portraits/story/mara.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-innkeeper-bust.png` | borrowed | Mara Fen: keeper of the Wayfarer, practical and funny |
| `portrait.story.nessa` | `art/portraits/story/nessa.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-nessa-bust.png` | borrowed | Nessa Thornfield: young Ranger, hunter and guide |
| `portrait.story.bram` | `art/portraits/story/bram.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-fighter-bust.png` | borrowed | Bram Calder: proud Duelist from Dunmere |
| `portrait.story.wren` | `art/portraits/story/wren.png` | 160×160 | `art/packs/myart/chars/npc-story-wren-bust.png` | borrowed | Wren: the Broken Lantern’s last scout, living as “Linnet” |
| `portrait.story.herbalist` | `art/portraits/story/herbalist.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-herbalist-bust.png` | borrowed | Maren Bell: retired herbalist of Greenhollow |
| `portrait.story.quartermaster` | `art/portraits/story/quartermaster.png` | 160×160 | `art/packs/myart/chars/npc-ironford-archivist-bust.png` | borrowed | Oswin Tull: former Argent Crown quartermaster, now an archive keeper in Ironford |
| `portrait.story.champion` | `art/portraits/story/champion.png` | 160×160 | `art/packs/myart/chars/npc-story-champion-bust.png` | borrowed | Halden Marsh: aging Windmere champion |
| `portrait.story.representative` | `art/portraits/story/representative.png` | 160×160 | `art/packs/myart/chars/npc-story-representative-bust.png` | borrowed | The Argent Crown’s well-dressed representative |
| `portrait.story.stablemaster` | `art/portraits/story/stablemaster.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-stablemaster-bust.png` | borrowed | Gideon Rusk: owner of the old stable on Banner Plaza |
| `portrait.dunmere.merchant` | `art/portraits/npcs/dunmere-merchant.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-merchant-bust.png` | borrowed | Dunmere: Corwin Pell, Road merchant (dialogue portrait) |
| `portrait.dunmere.fighter` | `art/portraits/npcs/dunmere-fighter.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-fighter-bust.png` | borrowed | Dunmere: Bram Calder, Duelist (dialogue portrait) |
| `portrait.dunmere.stablemaster` | `art/portraits/npcs/dunmere-stablemaster.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-stablemaster-bust.png` | borrowed | Dunmere: Gideon Rusk, Stable owner (dialogue portrait) |
| `portrait.dunmere.nessa` | `art/portraits/npcs/dunmere-nessa.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-nessa-bust.png` | borrowed | Dunmere: Nessa Thornfield, Hunter (dialogue portrait) |
| `portrait.dunmere.traveler` | `art/portraits/npcs/dunmere-traveler.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-traveler-bust.png` | borrowed | Dunmere: Iven Quill, Traveler (dialogue portrait) |
| `portrait.dunmere.herald` | `art/portraits/npcs/dunmere-herald.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-herald-bust.png` | borrowed | Dunmere: Orren Pike, Herald (dialogue portrait) |
| `portrait.dunmere.rowe` | `art/portraits/npcs/dunmere-rowe.png` | 160×160 | — | placeholder | Dunmere: Tavish Rowe, The Dawnriders (dialogue portrait) |
| `portrait.dunmere.hobb` | `art/portraits/npcs/dunmere-hobb.png` | 160×160 | — | placeholder | Dunmere: Sergeant Hobb, Watch sergeant (dialogue portrait) |
| `portrait.dunmere.kilnmaster` | `art/portraits/npcs/dunmere-kilnmaster.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-kilnmaster-bust.png` | borrowed | Dunmere: Hesta Coal, Kiln-master (dialogue portrait) |
| `portrait.dunmere.lamplighter` | `art/portraits/npcs/dunmere-lamplighter.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-lamplighter-bust.png` | borrowed | Dunmere: Pip, Lamplighter (dialogue portrait) |
| `portrait.greenhollow.herbalist` | `art/portraits/npcs/greenhollow-herbalist.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-herbalist-bust.png` | borrowed | Greenhollow: Maren Bell, Herbalist (dialogue portrait) |
| `portrait.greenhollow.quell` | `art/portraits/npcs/greenhollow-quell.png` | 160×160 | — | placeholder | Greenhollow: Morra Quell, The Black Thistle (dialogue portrait) |
| `portrait.greenhollow.warden` | `art/portraits/npcs/greenhollow-warden.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-warden-bust.png` | borrowed | Greenhollow: Warden Tamsin, Forest warden (dialogue portrait) |
| `portrait.greenhollow.storyteller` | `art/portraits/npcs/greenhollow-storyteller.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-storyteller-bust.png` | borrowed | Greenhollow: Old Fen, Storyteller (dialogue portrait) |
| `portrait.greenhollow.stablehand` | `art/portraits/npcs/greenhollow-stablehand.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-stablehand-bust.png` | borrowed | Greenhollow: Kit, Stablehand (dialogue portrait) |
| `portrait.greenhollow.cleric` | `art/portraits/npcs/greenhollow-cleric.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-cleric-bust.png` | borrowed | Greenhollow: Brother Alder, Grove cleric (dialogue portrait) |
| `portrait.ironford.foreman` | `art/portraits/npcs/ironford-foreman.png` | 160×160 | `art/packs/myart/chars/npc-ironford-foreman-bust.png` | borrowed | Ironford: Dagna Hale, Foundry foreman (dialogue portrait) |
| `portrait.ironford.smith` | `art/portraits/npcs/ironford-smith.png` | 160×160 | `art/packs/myart/chars/npc-ironford-smith-bust.png` | borrowed | Ironford: Corr Anvilson, Smith (dialogue portrait) |
| `portrait.ironford.apprentice` | `art/portraits/npcs/ironford-apprentice.png` | 160×160 | `art/packs/myart/chars/npc-ironford-apprentice-bust.png` | borrowed | Ironford: Tibb, Smith’s apprentice (dialogue portrait) |
| `portrait.ironford.archivist` | `art/portraits/npcs/ironford-archivist.png` | 160×160 | `art/packs/myart/chars/npc-ironford-archivist-bust.png` | borrowed | Ironford: Oswin Tull, Archive keeper (dialogue portrait) |
| `portrait.ironford.tollkeeper` | `art/portraits/npcs/ironford-tollkeeper.png` | 160×160 | `art/packs/myart/chars/npc-ironford-tollkeeper-bust.png` | borrowed | Ironford: Ansel Brook, Bridge toll-keeper (dialogue portrait) |
| `portrait.ironford.docker` | `art/portraits/npcs/ironford-docker.png` | 160×160 | `art/packs/myart/chars/npc-ironford-docker-bust.png` | borrowed | Ironford: Rhoswen Tarr, Dock hand (dialogue portrait) |
| `portrait.ironford.guard` | `art/portraits/npcs/ironford-guard.png` | 160×160 | `art/packs/myart/chars/npc-ironford-guard-bust.png` | borrowed | Ironford: Ysolde Marr, Caravan guard (dialogue portrait) |
| `portrait.ironford.caravan` | `art/portraits/npcs/ironford-caravan.png` | 160×160 | `art/packs/myart/chars/npc-ironford-caravan-bust.png` | borrowed | Ironford: Haskel Dunn, Caravan master (dialogue portrait) |
| `portrait.ironford.scholar` | `art/portraits/npcs/ironford-scholar.png` | 160×160 | `art/packs/myart/chars/npc-ironford-scholar-bust.png` | borrowed | Ironford: Venn Ashby, Visiting scholar (dialogue portrait) |
| `portrait.windmere.monk` | `art/portraits/npcs/windmere-monk.png` | 160×160 | `art/packs/myart/chars/npc-windmere-monk-bust.png` | borrowed | Windmere: Brother Hale, Monastery keeper (dialogue portrait) |
| `portrait.windmere.novice` | `art/portraits/npcs/windmere-novice.png` | 160×160 | `art/packs/myart/chars/npc-windmere-novice-bust.png` | borrowed | Windmere: Sister Anwen, Monastery novice (dialogue portrait) |
| `portrait.windmere.courier` | `art/portraits/npcs/windmere-courier.png` | 160×160 | `art/packs/myart/chars/npc-windmere-courier-bust.png` | borrowed | Windmere: Sela Wick, Courier (dialogue portrait) |
| `portrait.windmere.lookout` | `art/portraits/npcs/windmere-lookout.png` | 160×160 | `art/packs/myart/chars/npc-windmere-lookout-bust.png` | borrowed | Windmere: Old Maud, Retired duelist (dialogue portrait) |
| `portrait.windmere.dace` | `art/portraits/npcs/windmere-dace.png` | 160×160 | — | placeholder | Windmere: Overseer Dace, Dock overseer (dialogue portrait) |
| `portrait.windmere.fisher` | `art/portraits/npcs/windmere-fisher.png` | 160×160 | `art/packs/myart/chars/npc-windmere-fisher-bust.png` | borrowed | Windmere: Jory Pell, Fisher (dialogue portrait) |
| `portrait.windmere.cass` | `art/portraits/npcs/windmere-cass.png` | 160×160 | — | placeholder | Windmere: Cass Vey, Fence (dialogue portrait) |
| `portrait.role.high-priestess` | `art/portraits/roles/high-priestess.png` | 160×160 | `art/packs/myart/chars/npc-role-high-priestess-bust.png` | borrowed | Dialogue portrait: High priestess |
| `portrait.role.temple-acolyte` | `art/portraits/npcs/role-temple-acolyte.png` | 160×160 | `art/packs/myart/chars/npc-role-temple-acolyte-bust.png` | borrowed | Dialogue portrait: Scribe |
| `portrait.role.priest` | `art/portraits/roles/priest.png` | 160×160 | `art/packs/myart/chars/npc-role-priest-bust.png` | borrowed | Dialogue portrait: Priest |
| `portrait.role.regular` | `art/portraits/roles/regular.png` | 160×160 | — | placeholder | Dialogue portrait: Regular |
| `portrait.role.shopkeeper` | `art/portraits/roles/shopkeeper.png` | 160×160 | `art/packs/myart/chars/npc-role-shopkeeper-bust.png` | borrowed | Dialogue portrait: Shopkeeper |
| `portrait.role.herald-s-clerk` | `art/portraits/roles/herald-s-clerk.png` | 160×160 | `art/packs/myart/chars/npc-role-herald-s-clerk-bust.png` | borrowed | Dialogue portrait: Herald’s clerk |
| `portrait.greenhollow.innkeeper` | `art/portraits/npcs/greenhollow-innkeeper.png` | 160×160 | `art/packs/myart/chars/npc-greenhollow-innkeeper-bust.png` | borrowed | Dialogue portrait: Innkeeper |
| `portrait.role.herb-seller` | `art/portraits/roles/herb-seller.png` | 160×160 | `art/packs/myart/chars/npc-role-herb-seller-bust.png` | borrowed | Dialogue portrait: Herb seller |
| `portrait.ironford.barkeep` | `art/portraits/npcs/ironford-barkeep.png` | 160×160 | `art/packs/myart/chars/npc-ironford-barkeep-bust.png` | borrowed | Dialogue portrait: Barkeep |
| `portrait.role.forge-trader` | `art/portraits/roles/forge-trader.png` | 160×160 | `art/packs/myart/chars/npc-role-forge-trader-bust.png` | borrowed | Dialogue portrait: Forge trader |
| `portrait.role.assay-clerk` | `art/portraits/roles/assay-clerk.png` | 160×160 | `art/packs/myart/chars/npc-role-assay-clerk-bust.png` | borrowed | Dialogue portrait: Assay clerk |
| `portrait.role.innkeeper` | `art/portraits/roles/innkeeper.png` | 160×160 | `art/packs/myart/chars/npc-role-innkeeper-bust.png` | borrowed | Dialogue portrait: Innkeeper |
| `portrait.role.courier-supplier` | `art/portraits/roles/courier-supplier.png` | 160×160 | `art/packs/myart/chars/npc-role-courier-supplier-bust.png` | borrowed | Dialogue portrait: Courier supplier |
| `portrait.role.council-steward` | `art/portraits/roles/council-steward.png` | 160×160 | `art/packs/myart/chars/npc-role-council-steward-bust.png` | borrowed | Dialogue portrait by role: council steward |
| `portrait.role.watch-sergeant` | `art/portraits/roles/watch-sergeant.png` | 160×160 | `art/packs/myart/chars/npc-role-watch-sergeant-bust.png` | borrowed | Dialogue portrait by role: watch sergeant |
| `portrait.role.trader` | `art/portraits/roles/trader.png` | 160×160 | `art/packs/myart/chars/npc-role-trader-bust.png` | borrowed | Dialogue portrait by role: trader |
| `portrait.role.traveller` | `art/portraits/roles/traveller.png` | 160×160 | `art/packs/myart/chars/npc-role-traveller-bust.png` | borrowed | Dialogue portrait by role: traveller |
| `portrait.role.messenger` | `art/portraits/roles/messenger.png` | 160×160 | `art/packs/myart/chars/npc-role-messenger-bust.png` | borrowed | Dialogue portrait by role: messenger |
| `portrait.class.guardian` | `art/packs/myart/chars/char-class-guardian-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.duelist` | `art/packs/myart/chars/char-class-duelist-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.ranger` | `art/packs/myart/chars/char-class-ranger-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.rogue` | `art/packs/myart/chars/char-class-rogue-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.cleric` | `art/packs/myart/chars/char-class-cleric-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.mage` | `art/packs/myart/chars/char-class-mage-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.scholar` | `art/packs/myart/chars/char-class-scholar-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.class.artificer` | `art/packs/myart/chars/char-class-artificer-bust.png` | 192×192 | — | ready | Class portrait (the HeroEditor close-up) |
| `portrait.dunmere.innkeeper` | `art/portraits/npcs/dunmere-innkeeper.png` | 160×160 | `art/packs/myart/chars/npc-dunmere-innkeeper-bust.png` | borrowed | Dialogue portrait (its walking character until painted) |
| `portrait.role.registrar` | `art/portraits/npcs/role-registrar.png` | 160×160 | `art/packs/myart/chars/npc-role-registrar-bust.png` | borrowed | Dialogue portrait (its walking character until painted) |
| `portrait.role.referee` | `art/portraits/npcs/role-referee.png` | 160×160 | `art/packs/myart/chars/npc-role-referee-bust.png` | borrowed | Dialogue portrait (its walking character until painted) |

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
| `crest.charter.merchant` | `art/packs/myart/emblems/crest-charter-merchant.png` | 361×294 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.charter.free` | `art/packs/myart/emblems/crest-charter-free.png` | 361×294 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.charter.scholars` | `art/packs/myart/emblems/crest-charter-scholars.png` | 361×294 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.charter.shield` | `art/packs/myart/emblems/crest-charter-shield.png` | 361×294 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.patron.trade` | `art/packs/myart/emblems/crest-patron-trade.png` | 149×129 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.patron.temple` | `art/packs/myart/emblems/crest-patron-temple.png` | 135×124 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.patron.smiths` | `art/packs/myart/emblems/crest-patron-smiths.png` | 135×89 | — | ready | Emblem (GUI PRO Kit icon) |
| `crest.argent-crown` | `art/packs/myart/emblems/crest-argent-crown.png` | 126×102 | — | ready | Emblem (GUI PRO Kit icon) |

## Interface (`ui`, placeholder #255a5a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `relic.banner` | `art/packs/myart/emblems/relic-banner.png` | 139×139 | — | ready | Emblem (GUI PRO Kit icon) |
| `award.mvp` | `art/packs/myart/emblems/award-mvp.png` | 93×117 | — | ready | Emblem (GUI PRO Kit icon) |
| `award.rookie` | `art/packs/myart/emblems/award-rookie.png` | 93×117 | — | ready | Emblem (GUI PRO Kit icon) |
| `award.signing` | `art/packs/myart/emblems/award-signing.png` | 116×126 | — | ready | Emblem (GUI PRO Kit icon) |
| `trophy.title` | `art/packs/myart/emblems/trophy-title.png` | 136×101 | — | ready | Emblem (GUI PRO Kit icon) |
| `trophy.record` | `art/packs/myart/emblems/trophy-record.png` | 116×112 | — | ready | Emblem (GUI PRO Kit icon) |
| `trophy.hall` | `art/packs/myart/emblems/trophy-hall.png` | 93×117 | — | ready | Emblem (GUI PRO Kit icon) |
| `ui.overworld` | `art/packs/myart/worldmap.jpg` | 2400×1500 | — | ready | World map: ink on parchment (scripts/art/worldmap.py) |

## Enemy on the map (`enemy`, placeholder #7a3a22)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `enemy.group.bandits` | `art/packs/myart/foes/group-bandits.png` | 398×283 | — | ready | Enemy group on the map: road-bandit, shield-thug, field-priest |
| `enemy.boss.alpha` | `art/packs/myart/foes/boss-alpha.png` | 184×330 | — | ready | Boss on the map: grey-alpha |
| `enemy.boss.abbot` | `art/packs/myart/foes/boss-abbot.png` | 194×328 | — | ready | Boss on the map: ash-abbot |
| `enemy.group.stalkers` | `art/packs/myart/foes/group-stalkers.png` | 297×286 | — | ready | Enemy group on the map: thorn-stalker, thorn-stalker |
| `enemy.boss.captain` | `art/packs/myart/foes/boss-captain.png` | 194×307 | — | ready | Boss on the map: bandit-captain |
| `enemy.boss.lanterneater` | `art/packs/myart/foes/boss-lanterneater.png` | 210×285 | — | ready | Boss on the map: lantern-brood |
| `enemy.group.wolfskins` | `art/packs/myart/foes/group-wolfskins.png` | 386×301 | — | ready | Enemy group on the map: wolfskin, road-bandit, wolfskin |
| `enemy.group.witch` | `art/packs/myart/foes/group-witch.png` | 435×328 | — | ready | Enemy group on the map: hedge-witch, shield-thug |
| `enemy.group.spores` | `art/packs/myart/foes/group-spores.png` | 359×294 | — | ready | Enemy group on the map: spore-caller, grove-mender |
| `enemy.group.barkhides` | `art/packs/myart/foes/group-barkhides.png` | 317×330 | — | ready | Enemy group on the map: bark-brute, moss-warden |
| `enemy.group.wraiths` | `art/packs/myart/foes/group-wraiths.png` | 398×291 | — | ready | Enemy group on the map: veil-wraith, mind-thief, veil-wraith |
| `enemy.group.hollow` | `art/packs/myart/foes/group-hollow.png` | 373×327 | — | ready | Enemy group on the map: hollow-knight, void-juggernaut |

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
