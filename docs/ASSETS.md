# Asset list

Every visual asset the game asks for, registered by id in [src/data/assets.js](../src/data/assets.js). Paths are relative to `public/`. This file is generated: run `node scripts/assets-doc.mjs` after changing the registry.

How it works: the loader uses the file at **Path** if it exists; otherwise **Borrows** (older shared art standing in); otherwise it draws a labelled, color-coded placeholder showing the id. Drop a file at the path and it is picked up with no code change. Status: *placeholder* = no file yet, *borrowed* = using older shared art, *ready* = dedicated file exists.

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

## Interior (`interior`, placeholder #6b4a24)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `interior.guildhall` | `art/interiors/guildhall.png` | 1280×576 | `art/scenes/scene_09.png` | borrowed | Guild Hall rooms |
| `interior.tavern` | `art/interiors/tavern.png` | 1280×576 | `art/scenes/scene_08.png` | borrowed | Tavern (recruits) |
| `interior.shop` | `art/interiors/shop.png` | 1280×576 | `art/scenes/scene_01.png` | borrowed | Shop |
| `interior.arena` | `art/interiors/arena.png` | 1280×576 | `art/scenes/scene_02.png` | borrowed | Arena (tournaments) |
| `interior.herald` | `art/interiors/herald.png` | 1280×576 | `art/scenes/scene_03.png` | borrowed | Herald (rankings) |
| `interior.noticeboard` | `art/interiors/noticeboard.png` | 1280×576 | `art/scenes/scene_10.png` | borrowed | Notice Board (contracts) |

## Battle background (`battle`, placeholder #6a2f34)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `bg.battle.oldroad` | `art/battle/oldroad.png` | 1280×576 | — | placeholder | Battles on the Old Road |
| `bg.battle.thornwood` | `art/battle/thornwood.png` | 1280×576 | — | placeholder | Battles at the Thornwood edge |
| `bg.battle.blackwood` | `art/battle/blackwood.png` | 1280×576 | — | placeholder | Battles in the Blackwood |
| `bg.battle.arena` | `art/battle/arena.png` | 1280×576 | `art/scenes/scene_02.png` | borrowed | Tournaments, duels, challenges |
| `bg.battle.fire` | `art/battle/fire.png` | 1280×576 | `art/scenes/scene_12.png` | borrowed | Battles in Fire lands |
| `bg.battle.plant` | `art/battle/plant.png` | 1280×576 | `art/scenes/scene_11.png` | borrowed | Battles in Plant lands |
| `bg.battle.water` | `art/battle/water.png` | 1280×576 | `art/scenes/scene_04.png` | borrowed | Battles in Water lands |
| `bg.battle.air` | `art/battle/air.png` | 1280×576 | `art/scenes/scene_05.png` | borrowed | Battles in Air lands |
| `bg.battle.animal` | `art/battle/animal.png` | 1280×576 | `art/scenes/scene_11.png` | borrowed | Battles in Animal lands |
| `bg.battle.psychic` | `art/battle/psychic.png` | 1280×576 | `art/scenes/scene_06.png` | borrowed | Battles in Psychic lands |
| `bg.battle.iron` | `art/battle/iron.png` | 1280×576 | `art/scenes/scene_12.png` | borrowed | Battles in Iron lands |

## Room (walkable) (`room`, placeholder #4a3140)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `room.opening.floor` | `art/walk/opening/floor.png` | 960×540 | — | placeholder | Opening room: floor and walls |

## Prop (`prop`, placeholder #55602e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `prop.opening.table` | `art/walk/opening/table.png` | 224×40 | — | placeholder | Opening room: table (top left) |
| `prop.opening.shelf` | `art/walk/opening/shelf.png` | 218×40 | — | placeholder | Opening room: shelf (top right) |
| `prop.opening.bench` | `art/walk/opening/bench.png` | 255×36 | — | placeholder | Opening room: bench (bottom left) |
| `prop.opening.chest` | `art/walk/opening/chest.png` | 110×44 | — | placeholder | Opening room: chest (bottom right) |
| `prop.opening.door` | `art/walk/opening/door.png` | 32×92 | — | placeholder | Opening room: door to Dunmere |
| `prop.campfire` | `art/walk/props/campfire.png` | 64×64 | — | placeholder | Wild-area camp: rest spot |
| `prop.signpost` | `art/walk/props/signpost.png` | 32×48 | — | placeholder | Exit from a town or wild area |
| `prop.gather.herb` | `art/walk/props/gather-herb.png` | 28×28 | — | placeholder | Gathering spot: herbs |
| `prop.gather.ore` | `art/walk/props/gather-ore.png` | 28×28 | — | placeholder | Gathering spot: ore and shards |
| `prop.gather.coin` | `art/walk/props/gather-coin.png` | 28×28 | — | placeholder | Gathering spot: coin pouches |
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
| `prop.milestone` | `art/walk/props/milestone.png` | 32×64 | — | placeholder | The Old Road: Old milestone |
| `prop.brokenlantern` | `art/walk/props/brokenlantern.png` | 32×64 | — | placeholder | The Blackwood: Broken lantern |

## NPC sprite (`npc`, placeholder #4f3d78)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `npc.opening.stranger` | `art/walk/opening/stranger.png` | 44×28 | — | placeholder | Opening room: wounded stranger, lying down |
| `npc.dunmere.innkeeper` | `art/walk/npcs/dunmere-innkeeper.png` | 26×36 | — | placeholder | Dunmere: Sella Rowan, Innkeeper (walk sprite) |
| `npc.dunmere.merchant` | `art/walk/npcs/dunmere-merchant.png` | 26×36 | — | placeholder | Dunmere: Bram Hallow, Road merchant (walk sprite) |
| `npc.dunmere.fighter` | `art/walk/npcs/dunmere-fighter.png` | 26×36 | — | placeholder | Dunmere: Nia Voss, Local fighter (walk sprite) |
| `npc.dunmere.traveler` | `art/walk/npcs/dunmere-traveler.png` | 26×36 | — | placeholder | Dunmere: Iven Quill, Traveler (walk sprite) |
| `npc.dunmere.herald` | `art/walk/npcs/dunmere-herald.png` | 26×36 | — | placeholder | Dunmere: Orren Pike, Herald (walk sprite) |
| `npc.dunmere.kilnmaster` | `art/walk/npcs/dunmere-kilnmaster.png` | 26×36 | — | placeholder | Dunmere: Hesta Coal, Kiln-master (walk sprite) |
| `npc.dunmere.lamplighter` | `art/walk/npcs/dunmere-lamplighter.png` | 26×36 | — | placeholder | Dunmere: Pip, Lamplighter (walk sprite) |
| `npc.greenhollow.herbalist` | `art/walk/npcs/greenhollow-herbalist.png` | 26×36 | — | placeholder | Greenhollow: Maren Bell, Herbalist (walk sprite) |
| `npc.greenhollow.warden` | `art/walk/npcs/greenhollow-warden.png` | 26×36 | — | placeholder | Greenhollow: Warden Tamsin, Forest warden (walk sprite) |
| `npc.greenhollow.storyteller` | `art/walk/npcs/greenhollow-storyteller.png` | 26×36 | — | placeholder | Greenhollow: Old Fen, Storyteller (walk sprite) |
| `npc.greenhollow.stablehand` | `art/walk/npcs/greenhollow-stablehand.png` | 26×36 | — | placeholder | Greenhollow: Kit, Stablehand (walk sprite) |
| `npc.greenhollow.innkeeper` | `art/walk/npcs/greenhollow-innkeeper.png` | 26×36 | — | placeholder | Greenhollow: Rowe Fallow, Innkeeper (walk sprite) |
| `npc.greenhollow.cleric` | `art/walk/npcs/greenhollow-cleric.png` | 26×36 | — | placeholder | Greenhollow: Brother Alder, Grove cleric (walk sprite) |
| `npc.ironford.foreman` | `art/walk/npcs/ironford-foreman.png` | 26×36 | — | placeholder | Ironford: Dagna Hale, Foundry foreman (walk sprite) |
| `npc.ironford.tollkeeper` | `art/walk/npcs/ironford-tollkeeper.png` | 26×36 | — | placeholder | Ironford: Ansel Brook, Bridge toll-keeper (walk sprite) |
| `npc.ironford.smith` | `art/walk/npcs/ironford-smith.png` | 26×36 | — | placeholder | Ironford: Corr Anvilson, Smith (walk sprite) |
| `npc.ironford.guard` | `art/walk/npcs/ironford-guard.png` | 26×36 | — | placeholder | Ironford: Ysolde Marr, Caravan guard (walk sprite) |
| `npc.ironford.scholar` | `art/walk/npcs/ironford-scholar.png` | 26×36 | — | placeholder | Ironford: Venn Ashby, Visiting scholar (walk sprite) |
| `npc.ironford.barkeep` | `art/walk/npcs/ironford-barkeep.png` | 26×36 | — | placeholder | Ironford: Mags, Barkeep (walk sprite) |

## Tileset (`tileset`, placeholder #3a3a3a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `tiles.ground` | `art/walk/tiles/ground.png` | 384×32 | — | placeholder | Ground tiles for towns and wild areas, one row of 32 px tiles in src/data/tiles.js order |

## Character sprite (`char`, placeholder #8a6a23)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `char.founder` | `art/walk/chars/founder.png` | 26×36 | — | placeholder | Player founder, walking (4-direction sheet later) |

## Portrait (`portrait`, placeholder #6a4a5e)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `portrait.poi` | `art/portraits/npcs/poi.png` | 160×160 | — | placeholder | Dialogue portrait for places and objects (fountain, statue, wells…) |
| `portrait.dunmere.innkeeper` | `art/portraits/npcs/dunmere-innkeeper.png` | 160×160 | — | placeholder | Dunmere: Sella Rowan, Innkeeper (dialogue portrait) |
| `portrait.dunmere.merchant` | `art/portraits/npcs/dunmere-merchant.png` | 160×160 | — | placeholder | Dunmere: Bram Hallow, Road merchant (dialogue portrait) |
| `portrait.dunmere.fighter` | `art/portraits/npcs/dunmere-fighter.png` | 160×160 | — | placeholder | Dunmere: Nia Voss, Local fighter (dialogue portrait) |
| `portrait.dunmere.traveler` | `art/portraits/npcs/dunmere-traveler.png` | 160×160 | — | placeholder | Dunmere: Iven Quill, Traveler (dialogue portrait) |
| `portrait.dunmere.herald` | `art/portraits/npcs/dunmere-herald.png` | 160×160 | — | placeholder | Dunmere: Orren Pike, Herald (dialogue portrait) |
| `portrait.dunmere.kilnmaster` | `art/portraits/npcs/dunmere-kilnmaster.png` | 160×160 | — | placeholder | Dunmere: Hesta Coal, Kiln-master (dialogue portrait) |
| `portrait.dunmere.lamplighter` | `art/portraits/npcs/dunmere-lamplighter.png` | 160×160 | — | placeholder | Dunmere: Pip, Lamplighter (dialogue portrait) |
| `portrait.greenhollow.herbalist` | `art/portraits/npcs/greenhollow-herbalist.png` | 160×160 | — | placeholder | Greenhollow: Maren Bell, Herbalist (dialogue portrait) |
| `portrait.greenhollow.warden` | `art/portraits/npcs/greenhollow-warden.png` | 160×160 | — | placeholder | Greenhollow: Warden Tamsin, Forest warden (dialogue portrait) |
| `portrait.greenhollow.storyteller` | `art/portraits/npcs/greenhollow-storyteller.png` | 160×160 | — | placeholder | Greenhollow: Old Fen, Storyteller (dialogue portrait) |
| `portrait.greenhollow.stablehand` | `art/portraits/npcs/greenhollow-stablehand.png` | 160×160 | — | placeholder | Greenhollow: Kit, Stablehand (dialogue portrait) |
| `portrait.greenhollow.innkeeper` | `art/portraits/npcs/greenhollow-innkeeper.png` | 160×160 | — | placeholder | Greenhollow: Rowe Fallow, Innkeeper (dialogue portrait) |
| `portrait.greenhollow.cleric` | `art/portraits/npcs/greenhollow-cleric.png` | 160×160 | — | placeholder | Greenhollow: Brother Alder, Grove cleric (dialogue portrait) |
| `portrait.ironford.foreman` | `art/portraits/npcs/ironford-foreman.png` | 160×160 | — | placeholder | Ironford: Dagna Hale, Foundry foreman (dialogue portrait) |
| `portrait.ironford.tollkeeper` | `art/portraits/npcs/ironford-tollkeeper.png` | 160×160 | — | placeholder | Ironford: Ansel Brook, Bridge toll-keeper (dialogue portrait) |
| `portrait.ironford.smith` | `art/portraits/npcs/ironford-smith.png` | 160×160 | — | placeholder | Ironford: Corr Anvilson, Smith (dialogue portrait) |
| `portrait.ironford.guard` | `art/portraits/npcs/ironford-guard.png` | 160×160 | — | placeholder | Ironford: Ysolde Marr, Caravan guard (dialogue portrait) |
| `portrait.ironford.scholar` | `art/portraits/npcs/ironford-scholar.png` | 160×160 | — | placeholder | Ironford: Venn Ashby, Visiting scholar (dialogue portrait) |
| `portrait.ironford.barkeep` | `art/portraits/npcs/ironford-barkeep.png` | 160×160 | — | placeholder | Ironford: Mags, Barkeep (dialogue portrait) |

## Interface (`ui`, placeholder #255a5a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `ui.overworld` | `ui/overworld.png` | 200×125 | — | ready | World map terrain |

## Building exterior (`building`, placeholder #5a4636)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `town.dunmere.herald` | `art/walk/buildings/dunmere-herald.png` | 160×160 | — | placeholder | Dunmere: Herald’s Office (front with door) |
| `town.dunmere.tavern` | `art/walk/buildings/dunmere-tavern.png` | 160×160 | — | placeholder | Dunmere: The Wayfarer (front with door) |
| `town.dunmere.guildhall.stage1` | `art/walk/buildings/dunmere-guildhall-stage1.png` | 160×160 | — | placeholder | Dunmere: Guild Hall (front with door) |
| `town.dunmere.shop` | `art/walk/buildings/dunmere-shop.png` | 160×160 | — | placeholder | Dunmere: Mira’s Supply (front with door) |
| `town.dunmere.rooms` | `art/walk/buildings/dunmere-rooms.png` | 160×160 | — | placeholder | Dunmere: Your rooms (front with door) |
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

## Enemy on the map (`enemy`, placeholder #7a3a22)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `enemy.group.wolves` | `art/walk/enemies/group-wolves.png` | 56×44 | — | placeholder | The Old Road: Grey wolf pack (standing on the map) |
| `enemy.group.bandits` | `art/walk/enemies/group-bandits.png` | 56×44 | — | placeholder | The Old Road: Bandit lookouts (standing on the map) |
| `enemy.boss.matron` | `art/walk/enemies/boss-matron.png` | 80×64 | — | placeholder | The Old Road: The Grey Matron (boss on the map) |
| `enemy.group.stalkers` | `art/walk/enemies/group-stalkers.png` | 56×44 | — | placeholder | Thornwood edge: Thorn stalkers (standing on the map) |
| `enemy.group.spores` | `art/walk/enemies/group-spores.png` | 56×44 | — | placeholder | Thornwood edge: Spore callers (standing on the map) |
| `enemy.boss.thornback` | `art/walk/enemies/boss-thornback.png` | 80×64 | — | placeholder | Thornwood edge: The Thornback (boss on the map) |
| `enemy.group.hollow` | `art/walk/enemies/group-hollow.png` | 56×44 | — | placeholder | The Blackwood: Hollow knights (standing on the map) |
| `enemy.group.shades` | `art/walk/enemies/group-shades.png` | 56×44 | — | placeholder | The Blackwood: Veil shades (standing on the map) |
| `enemy.boss.brood` | `art/walk/enemies/boss-brood.png` | 80×64 | — | placeholder | The Blackwood: Brood of the Lantern-eater (boss on the map) |

## Not yet routed through the registry

Hero portraits and battle sprites (`art/portraits`, `art/sprites`), enemy battle sprites (`art/enemies`), effects (`art/effects`) and primal grounds (`art/primals`) still load by path. They move into the registry in later phases.
