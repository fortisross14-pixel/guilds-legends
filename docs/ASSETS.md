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
| `town.dunmere.guildhall.stage1` | `art/walk/buildings/dunmere-guildhall-stage1.png` | 160×160 | — | ready | Dunmere: the Guild Hall building on its lot |
| `town.dunmere.herald` | `art/walk/buildings/dunmere-herald.png` | 160×160 | — | placeholder | Dunmere: Herald’s Office (front with door) |
| `town.dunmere.tavern` | `art/walk/buildings/dunmere-tavern.png` | 160×160 | — | ready | Dunmere: The Wayfarer (front with door) |
| `town.dunmere.shop` | `art/walk/buildings/dunmere-shop.png` | 160×160 | — | placeholder | Dunmere: Mira’s Supply (front with door) |
| `town.dunmere.arena` | `art/walk/buildings/dunmere-arena.png` | 160×160 | — | placeholder | Dunmere: Dunmere Arena (front with door) |
| `town.greenhollow.lodge` | `art/walk/buildings/greenhollow-lodge.png` | 160×160 | — | placeholder | Greenhollow: Guild lodge (front with door) |
| `town.greenhollow.tavern` | `art/walk/buildings/greenhollow-tavern.png` | 160×160 | — | placeholder | Greenhollow: The Mossy Kettle (front with door) |
| `town.greenhollow.shop` | `art/walk/buildings/greenhollow-shop.png` | 160×160 | — | placeholder | Greenhollow: Bramblewick Herbs (front with door) |
| `town.greenhollow.arena` | `art/walk/buildings/greenhollow-arena.png` | 160×160 | — | placeholder | Greenhollow: The Thorn Ring (front with door) |
| `town.ironford.offices` | `art/walk/buildings/ironford-offices.png` | 160×160 | — | placeholder | Ironford: Guild offices (front with door) |
| `town.ironford.herald` | `art/walk/buildings/ironford-herald.png` | 160×160 | — | placeholder | Ironford: Assay & Herald (front with door) |
| `town.ironford.shop` | `art/walk/buildings/ironford-shop.png` | 160×160 | — | placeholder | Ironford: Forge-Mart (front with door) |
| `town.ironford.tavern` | `art/walk/buildings/ironford-tavern.png` | 160×160 | — | placeholder | Ironford: The Quenched Anvil (front with door) |
| `town.ironford.arena` | `art/walk/buildings/ironford-arena.png` | 160×160 | — | placeholder | Ironford: The Hammer Yard (front with door) |
| `town.windmere.inn` | `art/walk/buildings/windmere-inn.png` | 160×160 | — | placeholder | Windmere: The Gull’s Rest (front with door) |
| `town.windmere.shop` | `art/walk/buildings/windmere-shop.png` | 160×160 | — | placeholder | Windmere: Courier Supply (front with door) |
| `town.windmere.arena` | `art/walk/buildings/windmere-arena.png` | 160×160 | — | placeholder | Windmere: The Cliff Ring (front with door) |

## Interior (`interior`, placeholder #6b4a24)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `scene.hall.lot` | `art/hall/lot.png` | 1080×1080 | `art/interiors/guildhall-stage1.png` | borrowed | Guild Hall: the lot seen from above (the cabin, the slots, the yard) |
| `scene.defeat` | `art/scenes/defeat.png` | 1280×576 | — | placeholder | Defeat: the party wakes in the infirmary (or the founder’s house) |
| `interior.tavern` | `art/interiors/tavern.png` | 1280×576 | `art/scenes/scene_08.png` | ready | Tavern (recruits) |
| `interior.shop` | `art/interiors/shop.png` | 1280×576 | `art/scenes/scene_01.png` | ready | Shop |
| `interior.arena` | `art/interiors/arena.png` | 1280×576 | `art/scenes/scene_02.png` | ready | Arena (tournaments) |
| `interior.herald` | `art/interiors/herald.png` | 1280×576 | `art/scenes/scene_03.png` | ready | Herald (rankings) |
| `interior.noticeboard` | `art/interiors/noticeboard.png` | 1280×576 | `art/scenes/scene_10.png` | ready | Notice Board (contracts) |
| `interior.arena.dunmere` | `art/interiors/arena-dunmere.png` | 1280×576 | `art/scenes/scene_02.png` | ready | Arena interior in Dunmere: fighting ground, sign-up desk, history board |
| `interior.arena.greenhollow` | `art/interiors/arena-greenhollow.png` | 1280×576 | `art/scenes/scene_02.png` | ready | Arena interior in Greenhollow: fighting ground, sign-up desk, history board |
| `interior.arena.ironford` | `art/interiors/arena-ironford.png` | 1280×576 | `art/scenes/scene_02.png` | ready | Arena interior in Ironford: fighting ground, sign-up desk, history board |
| `interior.arena.windmere` | `art/interiors/arena-windmere.png` | 1280×576 | `art/scenes/scene_02.png` | ready | Arena interior in Windmere: fighting ground, sign-up desk, history board |
| `interior.inn.greenhollow` | `art/interiors/inn-greenhollow.png` | 1280×576 | `art/scenes/scene_08.png` | ready | Inn in Greenhollow (rest 1–3 nights, recruits) |
| `interior.inn.ironford` | `art/interiors/inn-ironford.png` | 1280×576 | `art/scenes/scene_08.png` | ready | Inn in Ironford (rest 1–3 nights, recruits) |
| `interior.inn.windmere` | `art/interiors/inn-windmere.png` | 1280×576 | `art/scenes/scene_08.png` | ready | Inn in Windmere (rest 1–3 nights, recruits) |

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
| `prop.house.hearth` | `art/walk/house/hearth.png` | 190×52 | — | placeholder | Player’s house: the hearth (top left) |
| `prop.house.table` | `art/walk/house/table.png` | 160×64 | — | placeholder | Player’s house: table and two stools (middle) |
| `prop.house.bed` | `art/walk/house/bed.png` | 190×70 | — | placeholder | Player’s house: the one bed (top right) |
| `prop.house.chest` | `art/walk/house/chest.png` | 120×44 | — | placeholder | Player’s house: small chest (bottom left) |
| `prop.house.door` | `art/walk/house/door.png` | 32×92 | — | placeholder | Player’s house: the front door (later scratched with the Argent Crown emblem) |
| `prop.campfire` | `art/walk/props/campfire.png` | 64×64 | — | placeholder | Wild-area camp: rest spot |
| `prop.signpost` | `art/walk/props/signpost.png` | 32×48 | — | placeholder | Exit from a town or wild area |
| `prop.gather.herb` | `art/walk/props/gather-herb.png` | 28×28 | — | placeholder | Gathering spot: herbs |
| `prop.gather.ore` | `art/walk/props/gather-ore.png` | 28×28 | — | placeholder | Gathering spot: ore and shards |
| `prop.gather.coin` | `art/walk/props/gather-coin.png` | 28×28 | — | placeholder | Gathering spot: coin pouches |
| `furniture.wall` | `art/walk/furniture/wall.png` | 352×64 | — | placeholder | Interior furniture: back-wall (tavern) |
| `furniture.bar` | `art/walk/furniture/bar.png` | 224×64 | — | placeholder | Interior furniture: bar (tavern) |
| `furniture.table` | `art/walk/furniture/table.png` | 64×64 | — | placeholder | Interior furniture: table-1 (tavern) |
| `furniture.hearth` | `art/walk/furniture/hearth.png` | 64×64 | — | placeholder | Interior furniture: hearth (tavern) |
| `furniture.counter` | `art/walk/furniture/counter.png` | 160×64 | — | placeholder | Interior furniture: counter (shop) |
| `furniture.shelf` | `art/walk/furniture/shelf.png` | 32×128 | — | placeholder | Interior furniture: Potions shelf (shop) |
| `furniture.rack` | `art/walk/furniture/rack.png` | 32×128 | — | placeholder | Interior furniture: Weapon rack (shop) |
| `furniture.stand` | `art/walk/furniture/stand.png` | 64×64 | — | placeholder | Interior furniture: Armor stand (shop) |
| `furniture.case` | `art/walk/furniture/case.png` | 64×64 | — | placeholder | Interior furniture: Charm case (shop) |
| `furniture.desk` | `art/walk/furniture/desk.png` | 96×64 | — | placeholder | Interior furniture: desk (arena) |
| `furniture.historyboard` | `art/walk/furniture/historyboard.png` | 96×64 | — | placeholder | Interior furniture: History board (arena) |
| `furniture.ring` | `art/walk/furniture/ring.png` | 128×128 | — | placeholder | Interior furniture: ring (arena) |
| `furniture.bench` | `art/walk/furniture/bench.png` | 96×64 | — | placeholder | Interior furniture: bench (arena) |
| `furniture.rankboard` | `art/walk/furniture/rankboard.png` | 32×128 | — | placeholder | Interior furniture: Ranking board (herald) |
| `furniture.bookshelf` | `art/walk/furniture/bookshelf.png` | 32×128 | — | placeholder | Interior furniture: Records shelf (herald) |
| `prop.fountain` | `art/walk/props/fountain.png` | 96×128 | — | placeholder | Dunmere: Banner Fountain |
| `prop.noticeboard` | `art/walk/props/noticeboard.png` | 64×96 | — | placeholder | Dunmere: Notice Board |
| `prop.well` | `art/walk/props/well.png` | 32×64 | — | placeholder | Dunmere: Old well |
| `prop.kiln` | `art/walk/props/kiln.png` | 64×96 | — | placeholder | Dunmere: Hesta’s kiln |
| `prop.stall` | `art/walk/props/stall.png` | 64×64 | — | placeholder | Dunmere: stall-1 |
| `prop.lamp` | `art/walk/props/lamp.png` | 32×64 | — | placeholder | Dunmere: lamp-1 |
| `prop.elderoak` | `art/walk/props/elderoak.png` | 96×128 | — | placeholder | Greenhollow: The Elder Oak |
| `prop.wardstone` | `art/walk/props/wardstone.png` | 32×96 | — | placeholder | Greenhollow: Ward stone |
| `prop.herbcart` | `art/walk/props/herbcart.png` | 64×64 | — | placeholder | Greenhollow: herb-cart |
| `prop.beehives` | `art/walk/props/beehives.png` | 64×64 | — | placeholder | Greenhollow: beehives |
| `prop.forge` | `art/walk/props/forge.png` | 64×96 | — | placeholder | Ironford: The Great Forge |
| `prop.plaque` | `art/walk/props/plaque.png` | 32×64 | — | placeholder | Ironford: Bridge plaque |
| `prop.statue` | `art/walk/props/statue.png` | 32×96 | — | placeholder | Ironford: Statue of the First Smith |
| `prop.anvil` | `art/walk/props/anvil.png` | 32×64 | — | placeholder | Ironford: anvil |
| `prop.crates` | `art/walk/props/crates.png` | 64×64 | — | placeholder | Ironford: crates-1 |
| `prop.windbell` | `art/walk/props/windbell.png` | 64×96 | — | placeholder | Windmere: The wind bell |
| `prop.milestone` | `art/walk/props/milestone.png` | 32×64 | — | placeholder | The Old Road: Old milestone |
| `prop.hollowwarden` | `art/walk/props/hollowwarden.png` | 32×64 | — | placeholder | The Blackwood: The Hollow Warden |
| `prop.brokenlantern` | `art/walk/props/brokenlantern.png` | 32×64 | — | placeholder | The Blackwood: Broken lantern |

## Character sprite (`char`, placeholder #8a6a23)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `hall.pose.patient` | `art/hall/pose-patient.png` | 96×96 | — | placeholder | Guild Hall: a hero lying in an infirmary bed (silhouette) |
| `hall.pose.sleeping` | `art/hall/pose-sleeping.png` | 96×96 | — | placeholder | Guild Hall: a hero asleep in a bedroom (silhouette) |
| `hall.pose.training` | `art/hall/pose-training.png` | 96×96 | — | placeholder | Guild Hall: a hero at the training equipment (silhouette) |
| `char.founder` | `art/walk/chars/founder.png` | 26×36 | — | ready | Player founder, walking (4-direction sheet later) |
| `char.class.guardian` | `art/walk/chars/class-guardian.png` | 30×40 | `art/sprites/guardian.png` | borrowed | Recruits and challengers in buildings: Guardian (walk sprite) |
| `char.class.duelist` | `art/walk/chars/class-duelist.png` | 30×40 | `art/sprites/duelist.png` | borrowed | Recruits and challengers in buildings: Duelist (walk sprite) |
| `char.class.ranger` | `art/walk/chars/class-ranger.png` | 30×40 | `art/sprites/ranger.png` | borrowed | Recruits and challengers in buildings: Ranger (walk sprite) |
| `char.class.rogue` | `art/walk/chars/class-rogue.png` | 30×40 | `art/sprites/rogue.png` | borrowed | Recruits and challengers in buildings: Rogue (walk sprite) |
| `char.class.cleric` | `art/walk/chars/class-cleric.png` | 30×40 | `art/sprites/cleric.png` | borrowed | Recruits and challengers in buildings: Cleric (walk sprite) |
| `char.class.mage` | `art/walk/chars/class-mage.png` | 30×40 | `art/sprites/mage.png` | borrowed | Recruits and challengers in buildings: Mage (walk sprite) |
| `char.class.scholar` | `art/walk/chars/class-scholar.png` | 30×40 | `art/sprites/scholar.png` | borrowed | Recruits and challengers in buildings: Scholar (walk sprite) |
| `char.class.artificer` | `art/walk/chars/class-artificer.png` | 30×40 | `art/sprites/artificer.png` | borrowed | Recruits and challengers in buildings: Artificer (walk sprite) |

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

## Room (walkable) (`room`, placeholder #4a3140)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `room.house.floor` | `art/walk/house/floor.png` | 960×540 | — | placeholder | Player’s house: floor and walls, a hearth glow, rain on the windows (prologue) |
| `room.tavern` | `art/walk/rooms/tavern.png` | 352×352 | — | placeholder | Interior (walkable): the tavern room, floor and walls, seen from above (11×11 tiles) |
| `room.shop` | `art/walk/rooms/shop.png` | 352×352 | — | placeholder | Interior (walkable): the shop room, floor and walls, seen from above (11×11 tiles) |
| `room.arena` | `art/walk/rooms/arena.png` | 352×352 | — | placeholder | Interior (walkable): the arena room, floor and walls, seen from above (11×11 tiles) |
| `room.herald` | `art/walk/rooms/herald.png` | 352×352 | — | placeholder | Interior (walkable): the herald room, floor and walls, seen from above (11×11 tiles) |

## NPC sprite (`npc`, placeholder #4f3d78)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `npc.house.rook` | `art/walk/house/rook.png` | 44×28 | — | placeholder | Player’s house: Cassian Rook, wounded, on the floor |
| `npc.dunmere.merchant` | `art/walk/npcs/dunmere-merchant.png` | 26×36 | — | placeholder | Dunmere: Corwin Pell, Road merchant (walk sprite) |
| `npc.dunmere.fighter` | `art/walk/npcs/dunmere-fighter.png` | 26×36 | — | placeholder | Dunmere: Bram Calder, Duelist (walk sprite) |
| `npc.dunmere.stablemaster` | `art/walk/npcs/dunmere-stablemaster.png` | 26×36 | — | placeholder | Dunmere: Gideon Rusk, Stable owner (walk sprite) |
| `npc.dunmere.nessa` | `art/walk/npcs/dunmere-nessa.png` | 26×36 | — | ready | Dunmere: Nessa Thornfield, Hunter (walk sprite) |
| `npc.dunmere.traveler` | `art/walk/npcs/dunmere-traveler.png` | 26×36 | — | placeholder | Dunmere: Iven Quill, Traveler (walk sprite) |
| `npc.dunmere.herald` | `art/walk/npcs/dunmere-herald.png` | 26×36 | — | placeholder | Dunmere: Orren Pike, Herald (walk sprite) |
| `npc.dunmere.kilnmaster` | `art/walk/npcs/dunmere-kilnmaster.png` | 26×36 | — | placeholder | Dunmere: Hesta Coal, Kiln-master (walk sprite) |
| `npc.dunmere.lamplighter` | `art/walk/npcs/dunmere-lamplighter.png` | 26×36 | — | placeholder | Dunmere: Pip, Lamplighter (walk sprite) |
| `npc.greenhollow.herbalist` | `art/walk/npcs/greenhollow-herbalist.png` | 26×36 | — | placeholder | Greenhollow: Maren Bell, Herbalist (walk sprite) |
| `npc.greenhollow.warden` | `art/walk/npcs/greenhollow-warden.png` | 26×36 | — | placeholder | Greenhollow: Warden Tamsin, Forest warden (walk sprite) |
| `npc.greenhollow.storyteller` | `art/walk/npcs/greenhollow-storyteller.png` | 26×36 | — | placeholder | Greenhollow: Old Fen, Storyteller (walk sprite) |
| `npc.greenhollow.stablehand` | `art/walk/npcs/greenhollow-stablehand.png` | 26×36 | — | placeholder | Greenhollow: Kit, Stablehand (walk sprite) |
| `npc.greenhollow.cleric` | `art/walk/npcs/greenhollow-cleric.png` | 26×36 | — | placeholder | Greenhollow: Brother Alder, Grove cleric (walk sprite) |
| `npc.ironford.foreman` | `art/walk/npcs/ironford-foreman.png` | 26×36 | — | placeholder | Ironford: Dagna Hale, Foundry foreman (walk sprite) |
| `npc.ironford.tollkeeper` | `art/walk/npcs/ironford-tollkeeper.png` | 26×36 | — | placeholder | Ironford: Ansel Brook, Bridge toll-keeper (walk sprite) |
| `npc.ironford.smith` | `art/walk/npcs/ironford-smith.png` | 26×36 | — | placeholder | Ironford: Corr Anvilson, Smith (walk sprite) |
| `npc.ironford.guard` | `art/walk/npcs/ironford-guard.png` | 26×36 | — | placeholder | Ironford: Ysolde Marr, Caravan guard (walk sprite) |
| `npc.ironford.scholar` | `art/walk/npcs/ironford-scholar.png` | 26×36 | — | placeholder | Ironford: Venn Ashby, Visiting scholar (walk sprite) |
| `npc.ironford.archivist` | `art/walk/npcs/ironford-archivist.png` | 26×36 | — | placeholder | Ironford: Oswin Tull, Archive keeper (walk sprite) |
| `npc.windmere.courier` | `art/walk/npcs/windmere-courier.png` | 26×36 | — | placeholder | Windmere: Sela Wick, Courier (walk sprite) |
| `npc.windmere.monk` | `art/walk/npcs/windmere-monk.png` | 26×36 | — | placeholder | Windmere: Brother Hale, Monastery keeper (walk sprite) |
| `npc.dunmere.innkeeper` | `art/walk/npcs/dunmere-innkeeper.png` | 26×36 | — | ready | Mara Fen, Innkeeper (dunmere, tavern) |
| `npc.role.shopkeeper` | `art/walk/npcs/role-shopkeeper.png` | 26×36 | — | placeholder | Mira Holt, Shopkeeper (dunmere, shop) |
| `npc.role.registrar` | `art/walk/npcs/role-registrar.png` | 26×36 | — | placeholder | Tamsin Reed, Registrar (dunmere, arena) |
| `npc.role.referee` | `art/walk/npcs/role-referee.png` | 26×36 | — | placeholder | Holt Varga, Referee (dunmere, arena) |
| `npc.role.herald-s-clerk` | `art/walk/npcs/role-herald-s-clerk.png` | 26×36 | — | placeholder | Ada Penn, Herald’s clerk (dunmere, herald) |
| `npc.greenhollow.innkeeper` | `art/walk/npcs/greenhollow-innkeeper.png` | 26×36 | — | placeholder | Rowe Fallow, Innkeeper (greenhollow, tavern) |
| `npc.role.herb-seller` | `art/walk/npcs/role-herb-seller.png` | 26×36 | — | placeholder | Wick Bramble, Herb seller (greenhollow, shop) |
| `npc.ironford.barkeep` | `art/walk/npcs/ironford-barkeep.png` | 26×36 | — | placeholder | Mags, Barkeep (ironford, tavern) |
| `npc.role.forge-trader` | `art/walk/npcs/role-forge-trader.png` | 26×36 | — | placeholder | Brannoc Pike, Forge trader (ironford, shop) |
| `npc.role.assay-clerk` | `art/walk/npcs/role-assay-clerk.png` | 26×36 | — | placeholder | Petra Lund, Assay clerk (ironford, herald) |
| `npc.role.innkeeper` | `art/walk/npcs/role-innkeeper.png` | 26×36 | — | placeholder | Gull Tamsen, Innkeeper (windmere, tavern) |
| `npc.role.courier-supplier` | `art/walk/npcs/role-courier-supplier.png` | 26×36 | — | placeholder | Odo Finch, Courier supplier (windmere, shop) |
| `npc.role.council-steward` | `art/walk/npcs/role-council-steward.png` | 26×36 | — | placeholder | Visitor silhouette by role: council steward (petitioners, travellers, messengers) |
| `npc.role.watch-sergeant` | `art/walk/npcs/role-watch-sergeant.png` | 26×36 | — | placeholder | Visitor silhouette by role: watch sergeant (petitioners, travellers, messengers) |
| `npc.role.temple-acolyte` | `art/walk/npcs/role-temple-acolyte.png` | 26×36 | — | placeholder | Visitor silhouette by role: temple acolyte (petitioners, travellers, messengers) |
| `npc.role.trader` | `art/walk/npcs/role-trader.png` | 26×36 | — | placeholder | Visitor silhouette by role: trader (petitioners, travellers, messengers) |
| `npc.role.traveller` | `art/walk/npcs/role-traveller.png` | 26×36 | — | placeholder | Visitor silhouette by role: traveller (petitioners, travellers, messengers) |
| `npc.role.messenger` | `art/walk/npcs/role-messenger.png` | 26×36 | — | placeholder | Visitor silhouette by role: messenger (petitioners, travellers, messengers) |

## Tileset (`tileset`, placeholder #3a3a3a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `tiles.ground` | `art/walk/tiles/ground.png` | 384×32 | — | placeholder | Ground tiles for towns and wild areas, one row of 32 px tiles in src/data/tiles.js order |

## Portrait (`portrait`, placeholder #6a4a5e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `portrait.poi` | `art/portraits/npcs/poi.png` | 160×160 | — | placeholder | Dialogue portrait for places and objects (fountain, statue, wells…) |
| `portrait.arena.referee` | `art/portraits/npcs/arena-referee.png` | 160×160 | — | placeholder | Arena referee at the fighting ground (starts bouts) |
| `portrait.arena.registrar` | `art/portraits/npcs/arena-registrar.png` | 160×160 | — | placeholder | Arena registrar at the sign-up desk |
| `portrait.story.founder` | `art/portraits/story/founder.png` | 160×160 | — | placeholder | You, the founder, in dialogue (the class sprite stands in later) |
| `portrait.story.rook` | `art/portraits/story/rook.png` | 160×160 | — | placeholder | Lord Cassian Rook: battered armor, silver insignia, dying (prologue) |
| `portrait.story.thorne` | `art/portraits/story/thorne.png` | 160×160 | — | placeholder | Garrick Thorne: guildmaster of the Argent Crown, charming and cold |
| `portrait.story.mara` | `art/portraits/story/mara.png` | 160×160 | — | placeholder | Mara Fen: keeper of the Wayfarer, practical and funny |
| `portrait.story.nessa` | `art/portraits/story/nessa.png` | 160×160 | — | placeholder | Nessa Thornfield: young Ranger, hunter and guide |
| `portrait.story.bram` | `art/portraits/story/bram.png` | 160×160 | — | placeholder | Bram Calder: proud Duelist from Dunmere |
| `portrait.story.wren` | `art/portraits/story/wren.png` | 160×160 | — | placeholder | Wren: the Broken Lantern’s last scout, living as “Linnet” |
| `portrait.story.herbalist` | `art/portraits/story/herbalist.png` | 160×160 | — | placeholder | Maren Bell: retired herbalist of Greenhollow |
| `portrait.story.quartermaster` | `art/portraits/story/quartermaster.png` | 160×160 | — | placeholder | Oswin Tull: former Argent Crown quartermaster, now an archive keeper in Ironford |
| `portrait.story.champion` | `art/portraits/story/champion.png` | 160×160 | — | placeholder | Halden Marsh: aging Windmere champion |
| `portrait.story.representative` | `art/portraits/story/representative.png` | 160×160 | — | placeholder | The Argent Crown’s well-dressed representative |
| `portrait.story.stablemaster` | `art/portraits/story/stablemaster.png` | 160×160 | — | placeholder | Gideon Rusk: owner of the old stable on Banner Plaza |
| `portrait.dunmere.merchant` | `art/portraits/npcs/dunmere-merchant.png` | 160×160 | — | placeholder | Dunmere: Corwin Pell, Road merchant (dialogue portrait) |
| `portrait.dunmere.fighter` | `art/portraits/npcs/dunmere-fighter.png` | 160×160 | — | placeholder | Dunmere: Bram Calder, Duelist (dialogue portrait) |
| `portrait.dunmere.stablemaster` | `art/portraits/npcs/dunmere-stablemaster.png` | 160×160 | — | placeholder | Dunmere: Gideon Rusk, Stable owner (dialogue portrait) |
| `portrait.dunmere.nessa` | `art/portraits/npcs/dunmere-nessa.png` | 160×160 | — | placeholder | Dunmere: Nessa Thornfield, Hunter (dialogue portrait) |
| `portrait.dunmere.traveler` | `art/portraits/npcs/dunmere-traveler.png` | 160×160 | — | placeholder | Dunmere: Iven Quill, Traveler (dialogue portrait) |
| `portrait.dunmere.herald` | `art/portraits/npcs/dunmere-herald.png` | 160×160 | — | placeholder | Dunmere: Orren Pike, Herald (dialogue portrait) |
| `portrait.dunmere.kilnmaster` | `art/portraits/npcs/dunmere-kilnmaster.png` | 160×160 | — | placeholder | Dunmere: Hesta Coal, Kiln-master (dialogue portrait) |
| `portrait.dunmere.lamplighter` | `art/portraits/npcs/dunmere-lamplighter.png` | 160×160 | — | placeholder | Dunmere: Pip, Lamplighter (dialogue portrait) |
| `portrait.greenhollow.herbalist` | `art/portraits/npcs/greenhollow-herbalist.png` | 160×160 | — | placeholder | Greenhollow: Maren Bell, Herbalist (dialogue portrait) |
| `portrait.greenhollow.warden` | `art/portraits/npcs/greenhollow-warden.png` | 160×160 | — | placeholder | Greenhollow: Warden Tamsin, Forest warden (dialogue portrait) |
| `portrait.greenhollow.storyteller` | `art/portraits/npcs/greenhollow-storyteller.png` | 160×160 | — | placeholder | Greenhollow: Old Fen, Storyteller (dialogue portrait) |
| `portrait.greenhollow.stablehand` | `art/portraits/npcs/greenhollow-stablehand.png` | 160×160 | — | placeholder | Greenhollow: Kit, Stablehand (dialogue portrait) |
| `portrait.greenhollow.cleric` | `art/portraits/npcs/greenhollow-cleric.png` | 160×160 | — | placeholder | Greenhollow: Brother Alder, Grove cleric (dialogue portrait) |
| `portrait.ironford.foreman` | `art/portraits/npcs/ironford-foreman.png` | 160×160 | — | placeholder | Ironford: Dagna Hale, Foundry foreman (dialogue portrait) |
| `portrait.ironford.tollkeeper` | `art/portraits/npcs/ironford-tollkeeper.png` | 160×160 | — | placeholder | Ironford: Ansel Brook, Bridge toll-keeper (dialogue portrait) |
| `portrait.ironford.smith` | `art/portraits/npcs/ironford-smith.png` | 160×160 | — | placeholder | Ironford: Corr Anvilson, Smith (dialogue portrait) |
| `portrait.ironford.guard` | `art/portraits/npcs/ironford-guard.png` | 160×160 | — | placeholder | Ironford: Ysolde Marr, Caravan guard (dialogue portrait) |
| `portrait.ironford.scholar` | `art/portraits/npcs/ironford-scholar.png` | 160×160 | — | placeholder | Ironford: Venn Ashby, Visiting scholar (dialogue portrait) |
| `portrait.ironford.archivist` | `art/portraits/npcs/ironford-archivist.png` | 160×160 | — | placeholder | Ironford: Oswin Tull, Archive keeper (dialogue portrait) |
| `portrait.windmere.courier` | `art/portraits/npcs/windmere-courier.png` | 160×160 | — | placeholder | Windmere: Sela Wick, Courier (dialogue portrait) |
| `portrait.windmere.monk` | `art/portraits/npcs/windmere-monk.png` | 160×160 | — | placeholder | Windmere: Brother Hale, Monastery keeper (dialogue portrait) |
| `portrait.role.shopkeeper` | `art/portraits/roles/shopkeeper.png` | 160×160 | — | placeholder | Dialogue portrait: Shopkeeper |
| `portrait.role.herald-s-clerk` | `art/portraits/roles/herald-s-clerk.png` | 160×160 | — | placeholder | Dialogue portrait: Herald’s clerk |
| `portrait.greenhollow.innkeeper` | `art/portraits/npcs/greenhollow-innkeeper.png` | 160×160 | — | placeholder | Dialogue portrait: Innkeeper |
| `portrait.role.herb-seller` | `art/portraits/roles/herb-seller.png` | 160×160 | — | placeholder | Dialogue portrait: Herb seller |
| `portrait.ironford.barkeep` | `art/portraits/npcs/ironford-barkeep.png` | 160×160 | — | placeholder | Dialogue portrait: Barkeep |
| `portrait.role.forge-trader` | `art/portraits/roles/forge-trader.png` | 160×160 | — | placeholder | Dialogue portrait: Forge trader |
| `portrait.role.assay-clerk` | `art/portraits/roles/assay-clerk.png` | 160×160 | — | placeholder | Dialogue portrait: Assay clerk |
| `portrait.role.innkeeper` | `art/portraits/roles/innkeeper.png` | 160×160 | — | placeholder | Dialogue portrait: Innkeeper |
| `portrait.role.courier-supplier` | `art/portraits/roles/courier-supplier.png` | 160×160 | — | placeholder | Dialogue portrait: Courier supplier |
| `portrait.role.council-steward` | `art/portraits/roles/council-steward.png` | 160×160 | — | placeholder | Dialogue portrait by role: council steward |
| `portrait.role.watch-sergeant` | `art/portraits/roles/watch-sergeant.png` | 160×160 | — | placeholder | Dialogue portrait by role: watch sergeant |
| `portrait.role.temple-acolyte` | `art/portraits/roles/temple-acolyte.png` | 160×160 | — | placeholder | Dialogue portrait by role: temple acolyte |
| `portrait.role.trader` | `art/portraits/roles/trader.png` | 160×160 | — | placeholder | Dialogue portrait by role: trader |
| `portrait.role.traveller` | `art/portraits/roles/traveller.png` | 160×160 | — | placeholder | Dialogue portrait by role: traveller |
| `portrait.role.messenger` | `art/portraits/roles/messenger.png` | 160×160 | — | placeholder | Dialogue portrait by role: messenger |
| `portrait.class.guardian` | `art/portraits/classes/guardian.png` | 160×160 | `art/portraits/guardian.png` | borrowed | Dialogue portrait for a Guardian recruit |
| `portrait.class.duelist` | `art/portraits/classes/duelist.png` | 160×160 | `art/portraits/duelist.png` | borrowed | Dialogue portrait for a Duelist recruit |
| `portrait.class.ranger` | `art/portraits/classes/ranger.png` | 160×160 | `art/portraits/ranger.png` | borrowed | Dialogue portrait for a Ranger recruit |
| `portrait.class.rogue` | `art/portraits/classes/rogue.png` | 160×160 | `art/portraits/rogue.png` | borrowed | Dialogue portrait for a Rogue recruit |
| `portrait.class.cleric` | `art/portraits/classes/cleric.png` | 160×160 | `art/portraits/cleric.png` | borrowed | Dialogue portrait for a Cleric recruit |
| `portrait.class.mage` | `art/portraits/classes/mage.png` | 160×160 | `art/portraits/mage.png` | borrowed | Dialogue portrait for a Mage recruit |
| `portrait.class.scholar` | `art/portraits/classes/scholar.png` | 160×160 | `art/portraits/scholar.png` | borrowed | Dialogue portrait for a Scholar recruit |
| `portrait.class.artificer` | `art/portraits/classes/artificer.png` | 160×160 | `art/portraits/artificer.png` | borrowed | Dialogue portrait for a Artificer recruit |

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

## Battle sprite (`battler`, placeholder #6a3a1a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `battle.enemy_01` | `art/enemies/enemy_01.png` | 320×288 | — | ready | Enemy battle sprite 01 (see src/data/enemies.js rosters) |
| `battle.enemy_02` | `art/enemies/enemy_02.png` | 320×288 | — | ready | Enemy battle sprite 02 (see src/data/enemies.js rosters) |
| `battle.enemy_03` | `art/enemies/enemy_03.png` | 320×288 | — | ready | Enemy battle sprite 03 (see src/data/enemies.js rosters) |
| `battle.enemy_04` | `art/enemies/enemy_04.png` | 320×288 | — | ready | Enemy battle sprite 04 (see src/data/enemies.js rosters) |
| `battle.enemy_05` | `art/enemies/enemy_05.png` | 320×288 | — | ready | Enemy battle sprite 05 (see src/data/enemies.js rosters) |
| `battle.enemy_06` | `art/enemies/enemy_06.png` | 320×288 | — | ready | Enemy battle sprite 06 (see src/data/enemies.js rosters) |
| `battle.enemy_07` | `art/enemies/enemy_07.png` | 320×288 | — | ready | Enemy battle sprite 07 (see src/data/enemies.js rosters) |
| `battle.enemy_08` | `art/enemies/enemy_08.png` | 320×288 | — | ready | Enemy battle sprite 08 (see src/data/enemies.js rosters) |
| `battle.enemy_09` | `art/enemies/enemy_09.png` | 320×288 | — | ready | Enemy battle sprite 09 (see src/data/enemies.js rosters) |
| `battle.enemy_10` | `art/enemies/enemy_10.png` | 320×288 | — | ready | Enemy battle sprite 10 (see src/data/enemies.js rosters) |
| `battle.enemy_11` | `art/enemies/enemy_11.png` | 320×288 | — | ready | Enemy battle sprite 11 (see src/data/enemies.js rosters) |
| `battle.enemy_12` | `art/enemies/enemy_12.png` | 320×288 | — | ready | Enemy battle sprite 12 (see src/data/enemies.js rosters) |
| `battle.enemy_13` | `art/enemies/enemy_13.png` | 320×288 | — | ready | Enemy battle sprite 13 (see src/data/enemies.js rosters) |
| `battle.enemy_14` | `art/enemies/enemy_14.png` | 320×288 | — | ready | Enemy battle sprite 14 (see src/data/enemies.js rosters) |
| `battle.enemy_15` | `art/enemies/enemy_15.png` | 320×288 | — | ready | Enemy battle sprite 15 (see src/data/enemies.js rosters) |
| `battle.enemy_16` | `art/enemies/enemy_16.png` | 320×288 | — | ready | Enemy battle sprite 16 (see src/data/enemies.js rosters) |

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
| `enemy.group.wolves` | `art/walk/enemies/group-wolves.png` | 56×44 | — | placeholder | The Old Road: Grey wolf pair (standing on the map) |
| `enemy.group.bandits` | `art/walk/enemies/group-bandits.png` | 56×44 | — | placeholder | The Old Road: Bandit lookouts (standing on the map) |
| `enemy.group.witch` | `art/walk/enemies/group-witch.png` | 56×44 | — | placeholder | The Old Road: Hedge witch and guards (standing on the map) |
| `enemy.boss.alpha` | `art/walk/enemies/boss-alpha.png` | 80×64 | — | placeholder | The Old Road: The Grey Alpha (boss on the map) |
| `enemy.group.stalkers` | `art/walk/enemies/group-stalkers.png` | 56×44 | — | placeholder | Thornwood edge: Thorn stalkers (standing on the map) |
| `enemy.group.spores` | `art/walk/enemies/group-spores.png` | 56×44 | — | placeholder | Thornwood edge: Spore callers and a mender (standing on the map) |
| `enemy.group.barkhides` | `art/walk/enemies/group-barkhides.png` | 56×44 | — | placeholder | Thornwood edge: Barkhide brutes (standing on the map) |
| `enemy.boss.captain` | `art/walk/enemies/boss-captain.png` | 80×64 | — | placeholder | Thornwood edge: Captain Vask (boss on the map) |
| `enemy.group.shades` | `art/walk/enemies/group-shades.png` | 56×44 | — | placeholder | The Blackwood: Veil shades (standing on the map) |
| `enemy.group.hollow` | `art/walk/enemies/group-hollow.png` | 56×44 | — | placeholder | The Blackwood: Void hulks (standing on the map) |
| `enemy.boss.brood` | `art/walk/enemies/boss-brood.png` | 80×64 | — | placeholder | The Blackwood: Brood of the Lantern-eater (boss on the map) |

## Not yet routed through the registry

Hero portraits and battle sprites (`art/portraits`, `art/sprites`), enemy battle sprites (`art/enemies`), effects (`art/effects`) and primal grounds (`art/primals`) still load by path. They move into the registry in later phases.
