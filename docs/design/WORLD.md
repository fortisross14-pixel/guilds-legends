# The world — skeleton

Every place and road of the game, for all four chapters. The four Chapter 1 towns, the
Old Road, the Thornwood, the Blackwood and the three Chapter 2 roads are built, all laid out by
`src/data/wilds/roadLayout.js` (specs in `chapter1Roads.js` and `chapter2Roads.js`; 96 × 34, the
Blackwood 80 × 30; the Old Road and the Blackwood are dead ends); everything else is a **box**: walkable, with
its buildings, its gates and its bands, waiting for the chapter that uses it to get its real
layout, art, people and places (docs/design/STORY_DRAFT.md: world skeleton first, then each
chapter's story and places together).

- **Open world.** Every place can be reached; only the Old Road waits on a companion. Status
  (Initiation, Champion, Elite) gates tournaments, not travel. Danger keeps a guild away: walk
  into bands far above it and it is carried home beaten.
- **The wild tops out at level 35.** Tournaments and the story's last fights go higher (45–50).
- **Where it lives:** places in `src/data/world.js` (and `LOCATION_BUILDINGS`); roads in
  `src/data/roads.js` (`WORLD_ROADS` for the skeleton's); box towns from
  `src/data/towns/boxTown.js`; box roads from `src/data/wilds/skeletonRoads.js` (`emptyRoad`,
  bands from the far end's region). The world map (`scripts/art/worldmap.py`) grows land along
  every road.
- **Days.** Leaving a town onto a road costs that town's leg; going on to the far town its leg;
  turning back costs nothing.

## Places

| Place | Region | Tier | Buildings | Layout |
|---|---|---|---|---|
| Dunmere | Crownlands | Regional | tavern, noticeBoard, arena, shop, herald | built |
| Greenhollow | Verdant Marches | Regional | tavern, noticeBoard, arena, shop | built |
| Ironford | Crownlands | Regional | tavern, noticeBoard, arena, shop, herald | built: 48×32; Foundry Row, Archive Square, the docks and pier, Market Square, the caravan yard, Gate Square |
| Windmere | Crownlands | Regional | tavern, noticeBoard, arena, shop | built: 44×33; Monastery Terrace and the duelists' graves, Courier Steps, the Cliff Ring and lookout, the docks under the cliff |
| Tidecross | Ember Coast | National | tavern, noticeBoard, arena, shop, herald | box |
| Sunspire | Sun Kingdoms | National | tavern, noticeBoard, arena, shop, herald | box |
| Thornwatch | Verdant Marches | National | tavern, noticeBoard | box |
| Skyreach | Storm Isles | National | tavern, noticeBoard, shop, herald | box |
| Mooncourt | Crownlands | National | tavern, noticeBoard, arena, shop, herald | box |
| Brasshaven | Ember Coast | National | tavern, noticeBoard, shop, herald | box |
| Coral Crown | Storm Isles | Global | tavern, noticeBoard, arena, shop, herald | box |
| Beaststeppe | Frost Frontier | Global | tavern, noticeBoard | box |
| Ashen Caldera | Sun Kingdoms | Global | tavern, noticeBoard, arena, shop, herald | box |
| Verdant Citadel | Verdant Marches | Global | tavern, noticeBoard, shop, herald | box |
| Starfall Archive | The Far Veil | Global | tavern, noticeBoard, shop, herald | box |
| Irondeep | Frost Frontier | Global | tavern, noticeBoard, shop, herald | box |
| Cloud Monastery | Storm Isles | Global | tavern, noticeBoard, arena, shop | box |
| The Far Veil | The Far Veil | Global | tavern, noticeBoard | box |

## Roads

| Road | From → to | Days (each end) | Bands (level) | Layout |
|---|---|---|---|---|
| The Old Road | Dunmere (dead end) | Dunmere 1 | 2–7 | built |
| The Thornwood road | Dunmere → Greenhollow | Dunmere 2, Greenhollow 1 | 7–9 | built |
| The Iron Road | Greenhollow → Ironford | Greenhollow 2, Ironford 2 | 12–16 | built |
| The cliff road | Ironford → Windmere | Ironford 1, Windmere 2 | 17–22 | built |
| The coast road | Windmere → Dunmere | Dunmere 1, Windmere 2 | 14–19 | built |
| The Blackwood track | Dunmere (dead end) | Dunmere 1 | 30–35 | built |
| The Moon Road | Ironford → Mooncourt | Ironford 2, Mooncourt 1 | 22–28 | box |
| The Warden’s Path | Greenhollow → Thornwatch | Greenhollow 1, Thornwatch 1 | 16–22 | box |
| The Salt Road | Windmere → Tidecross | Windmere 2, Tidecross 1 | 20–26 | box |
| The Brass Road | Tidecross → Brasshaven | Tidecross 1, Brasshaven 1 | 24–30 | box |
| The Sun Road | Tidecross → Sunspire | Tidecross 1, Sunspire 1 | 26–32 | box |
| The Gilded Road | Sunspire → Mooncourt | Sunspire 2, Mooncourt 1 | 28–34 | box |
| The Briar Road | Mooncourt → Thornwatch | Mooncourt 2, Thornwatch 1 | 26–32 | box |
| The Green Ascent | Thornwatch → Verdant Citadel | Thornwatch 1, Verdant Citadel 1 | 30–35 | box |
| The Storm Stair | Thornwatch → Skyreach | Thornwatch 2, Skyreach 2 | 30–35 | box |
| The Steppe Road | Skyreach → Beaststeppe | Skyreach 2, Beaststeppe 1 | 32–35 | box |
| The Frost Pass | Beaststeppe → Irondeep | Beaststeppe 1, Irondeep 1 | 33–35 | box |
| The Root Road | Verdant Citadel → Irondeep | Verdant Citadel 1, Irondeep 1 | 34–35 | box |
| The Ash Road | Skyreach → Ashen Caldera | Skyreach 1, Ashen Caldera 1 | 33–35 | box |
| The Reef Road | Brasshaven → Coral Crown | Brasshaven 2, Coral Crown 1 | 30–35 | box |
| The Cloud Steps | Coral Crown → Cloud Monastery | Coral Crown 2, Cloud Monastery 1 | 34–35 | box |
| The Ember Stair | Cloud Monastery → Ashen Caldera | Cloud Monastery 1, Ashen Caldera 1 | 33–35 | box |
| The Starfall Road | Ashen Caldera → Starfall Archive | Ashen Caldera 2, Starfall Archive 1 | 34–35 | box |
| The Veil Road | Starfall Archive → The Far Veil | Starfall Archive 1, The Far Veil 1 | 35–35 | box |

## Where the chapters happen

| Chapter | Places | Roads |
|---|---|---|
| 1 | Dunmere, Dawnwatch Temple (Old Road), Greenhollow | Old Road, Thornwood road |
| 2 | Ironford, Windmere, Greenhollow | Iron Road, cliff road, coast road |
| 3 | Mooncourt, the Blackwood (deep), Tidecross | Moon Road, Salt Road, Blackwood track |
| 4 | Mooncourt (Crownfall), Coral Crown (World Conclave) | Gilded Road, Brass and Reef Roads |
