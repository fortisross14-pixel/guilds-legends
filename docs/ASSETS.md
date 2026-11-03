# Asset list

Every visual asset the game asks for, registered by id in [src/data/assets.js](../src/data/assets.js). Paths are relative to `public/`.

How it works: the loader uses the file at **Path** if it exists; otherwise **Borrows** (older shared art standing in); otherwise it draws a labelled, color-coded placeholder showing the id. Drop a file at the path and it is picked up with no code change. Status: *placeholder* = no file yet, *borrowed* = using older shared art, *ready* = dedicated file exists.

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
| `town.dunmere.noticeboard` | `art/walk/dunmere/noticeboard.png` | 56×100 | — | placeholder | Dunmere: notice board |
| `prop.fountain` | `art/walk/props/fountain.png` | 160×140 | — | placeholder | Town fountain |
| `prop.tree` | `art/walk/props/tree.png` | 60×76 | — | placeholder | Town tree |

## NPC sprite (`npc`, placeholder #4f3d78)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `npc.opening.stranger` | `art/walk/opening/stranger.png` | 44×28 | — | placeholder | Opening room: wounded stranger, lying down |
| `npc.dunmere.innkeeper` | `art/walk/npcs/innkeeper.png` | 26×36 | — | placeholder | Sella Rowan, innkeeper |
| `npc.dunmere.merchant` | `art/walk/npcs/merchant.png` | 26×36 | — | placeholder | Bram Hallow, road merchant |
| `npc.dunmere.fighter` | `art/walk/npcs/fighter.png` | 26×36 | — | placeholder | Nia Voss, local fighter |
| `npc.dunmere.traveler` | `art/walk/npcs/traveler.png` | 26×36 | — | placeholder | Iven Quill, traveler |
| `npc.dunmere.herald` | `art/walk/npcs/herald.png` | 26×36 | — | placeholder | Orren Pike, herald |

## Town (walkable) (`town`, placeholder #35593b)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `town.dunmere.ground` | `art/walk/dunmere/ground.png` | 1400×840 | — | placeholder | Dunmere: streets, square and edges |

## Building exterior (`building`, placeholder #5a4636)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `town.dunmere.rooms` | `art/walk/dunmere/rooms.png` | 188×190 | — | placeholder | Dunmere: your rented rooms |
| `town.dunmere.guildhall.stage1` | `art/walk/dunmere/guildhall-stage1.png` | 188×190 | — | placeholder | Dunmere: Guild Hall, build stage 1 |
| `town.dunmere.tavern` | `art/walk/dunmere/tavern.png` | 188×190 | — | placeholder | Dunmere: The Wayfarer tavern |
| `town.dunmere.shop` | `art/walk/dunmere/shop.png` | 188×190 | — | placeholder | Dunmere: Mira’s Supply |
| `town.dunmere.arena` | `art/walk/dunmere/arena.png` | 188×190 | — | placeholder | Dunmere: arena |
| `town.dunmere.herald` | `art/walk/dunmere/herald.png` | 188×190 | — | placeholder | Dunmere: Herald’s Office |

## Character sprite (`char`, placeholder #8a6a23)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `char.founder` | `art/walk/chars/founder.png` | 26×36 | — | placeholder | Player founder, walking (4-direction sheet later) |

## Interface (`ui`, placeholder #255a5a)

| Id | Path | Size | Borrows | Status | Used for |
|---|---|---|---|---|---|
| `ui.overworld` | `ui/overworld.png` | 200×125 | — | ready | World map terrain |

## Not yet routed through the registry

Hero portraits and sprites (`art/portraits`, `art/sprites`), enemy sprites (`art/enemies`), effects (`art/effects`) and primal grounds (`art/primals`) still load by path. They move into the registry in later phases.
