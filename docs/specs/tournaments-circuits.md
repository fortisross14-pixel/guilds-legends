# Spec: guild tournaments in three circuits

From the author. Replaces the current mix of individual and guild tournaments.

## 1. Every tournament is a guild tournament, with a team size cap
| Circuit (new name) | Old name | Team size | Number of tournaments |
|---|---|---|---|
| **Initiation** | Regional | up to **2** heroes | **8** |
| **Champion** | National | up to **4** heroes | **4** |
| **Elite** | Global | up to **5** heroes | **3** |

- Bouts are team battles using the normal per-hero combat (2v2, 4v4, 5v5).
- A guild may enter with fewer heroes than the cap.
- Individual tournaments (one hero per guild) are removed.
- Hero careers still count bouts, wins and titles for every hero who fought for the winning team.

## 2. Who can enter
- A guild enters tournaments of its **current status tier or lower:** an Initiation guild enters Initiation only; a Champion guild enters Initiation and Champion; an Elite guild enters all three.
- Existing fame and combat-win requirements stay per tournament. Sign up at that town's arena, as today (registrar, fee, be there on the day).

## 3. Names
- Rename the circuits everywhere: **Initiation tournaments, Champion tournaments, Elite tournaments.**
- Rename the guild status tiers to match: Regional → **Initiation**, National → **Champion**, Global → **Elite**. That includes the UI, docs, the glossary in docs/UX.md, and the Official ladder scopes.
- Status titles become: **Unknown → Contender → Initiation Power → Champion Power → Elite Power.**
- Keep internal ids if renaming them is risky; change what the player sees.

## 4. The calendar (one year)
The game starts in Brightwane, week 1. Initiation events are spread through the year, with two per Chapter 1 town, so there's always one within a couple of months, including in winter.

| Month | Week | Tournament | Circuit | Town |
|---|---|---|---|---|
| Deepwinter | 3 | Deepforge Brawl (new) | Initiation | Ironford |
| Thawrise | 2 | Gale Games (new) | Initiation | Windmere |
| Rainmoot | 3 | Tidecross Open | Champion | Tidecross |
| Greengale | 3 | Greenhollow Thorn Cup | Initiation | Greenhollow |
| Highsun | 2 | Windmere Cliff Duels | Initiation | Windmere |
| Highsun | 4 | Grand Companies Championship | Elite | Cloud Monastery |
| Brightwane | 1 | Sunspire Royal Arena | Champion | Sunspire |
| Harvestcall | 2 | Dunmere Harvest Melee | Initiation | Dunmere |
| Amberfall | 4 | The Caldera Crown | Elite | Ashen Caldera |
| Mistmarch | 2 | **The Crownfall Tournament** (the kingdom's premier event, from docs/STORY.md) | Champion | Mooncourt |
| Redleaf | 4 | Ironford Hammer Trials | Initiation | Ironford |
| Frostwane | 1 | Mooncourt Mindblade Invitational | Champion | Mooncourt |
| Frostwane | 3 | Hollow Lights Trial (new) | Initiation | Greenhollow |
| Longnight | 1 | World Conclave Championship | Elite | Coral Crown |
| Longnight | 3 | Lantern Night Bouts (new) | Initiation | Dunmere |

- The World Conclave becomes **yearly** (it was every 4 years), so the Triple Crown is achievable.
- New Initiation events need a name, a short description, a trophy and a history (past champions for the history board), all in `src/data/universe.js`.
- Purses, fees and fame requirements scale by circuit. Keep the existing numbers as the base and tune them in Phase 8.

## 5. Story fit
- Story mission 4 is still the Dunmere Harvest Melee (now teams of up to 2: the founder plus Nessa).
- Mission 7 is the Windmere Cliff Duels.
- The Crownfall Tournament is a Champion-circuit event in Mooncourt, the Act III finale, out of Chapter 1's reach. The Argent Crown's nine Crownfall titles and the "vacated" 1183 title stay.

## 6. Trophies and titles go to the Crown Room
See guild-hall-rooms.md (the Crown Room). Winning a tournament adds its trophy to the guild's collection. Fame from trophies needs a Crown Room, and special titles are unlocked by collections:

| Title | How |
|---|---|
| **Triple Crowned** | Win all 3 Elite tournaments (at any time) |
| **Master of the World** | Win all 15 tournaments (at any time) |
| **Initiation Grand Tour** | Win all 8 Initiation tournaments |
| **Champion's Slam** | Win all 4 Champion tournaments |
| **Season Sweep** | Win every tournament of one circuit in the same year |
| **Dynasty** | Win the same tournament 3 years in a row |
| **Giant Killer** | Beat a guild two status tiers above yours in a bout |

Titles show in the Crown Room, on the guild's Records page and in the season review. Rival guilds can earn them too (the Argent Crown may already hold some).
