# Guilds of Legend: touch-first UX

Phase 7A. The game is designed for fingers first; mouse and keyboard are extras. This file is the reference for anyone changing the UI.

## 1. Gesture language

One set of rules for the whole game (`src/components/gestures.js`):

| Gesture | Means | Examples |
|---|---|---|
| **Tap** | select, go, confirm | walk to a spot, open a door, pick a radial action, hire |
| **Drag and drop** | do something *to* something | hero → enemy, hero → room, hero → party slot, item → hero |
| **Long-press** (~400 ms) | inspect | unit card in battle, peek at a door or person, stat or skill details, why a button is disabled |
| **Swipe** | next / previous, dismiss, close | hero pages, recruit cards, notices, a bottom panel (swipe its header down), dialogue log (swipe up), back (from the left edge) |
| **Hold** during animations | fast-forward | a battle round, dialogue lines |

- **No double-tap actions** anywhere (`touch-action: manipulation` removes the double-tap zoom delay).
- **Every drag has a tap fallback:** tap the source, then tap the target. Settings → Controls → **Drag gestures / Tap only** turns dragging off.
- **Discoverability:** the first time a gesture matters, a ghost hand shows it once (battle drag, room drag). It is never shown again after the gesture is used (`settings.seenHints`); Settings can show the hints again.
- **Vibration** on hit, crit, KO and drops where the device supports it; Settings can switch it off.
- **Feedback:** every press scales and brightens at once; drop targets light up under the finger; disabled buttons say why when tapped or long-pressed (`Button why=`).

## 2. Screens and navigation

### Navigation map

```
Top bar ─ ◀ back · date (→ calendar) · location (→ map) · gold · ranks chip (→ Herald)
Places ─┬─ World map ── location card → Travel; wild-area card → Enter/Travel
        ├─ Town (walkable) ── doors: Guild Hall · Tavern/Inn · Notice Board · Arena · Shop · Herald
        │                  └─ people (talk), objects (inspect), exits → wild areas
        └─ Chronicle menu ── Calendar · News · Quest log · Lore codex · Settings · Chronicle · Mission log · Season reviews · Codex
Party bar ─ hero cards (tap = hero page, drag = assign) · Quest log button
Overlays (one at a time) ─ battle · mission game · decision · road event · report · story scene · reward moment · town event · council report
```

### Screen inventory

| Place | Screens |
|---|---|
| World map | map (pan, pinch), location card, wild-area card |
| Town | walkable town or wild area, Town directory (fallback), building interiors |
| Guild Hall | floor plan (room tiles take dropped heroes), each room, Build list, Rest (task list + rest dial + calendar), War room (party zones), Armory (drag items), Treasury, Trophy hall, Office |
| Tavern / Inn | recruit cards (swipe), inn rest (away from home) |
| Notice Board | contract list, party builder (slots take dropped heroes) |
| Arena | fighting ground, sign-up desk, history board |
| Shop | buy / sell list, comparison (drag an item onto a hero row) |
| Herald | Path, Connections, ladders, record book, hall of fame, rivals, directory, tournaments |
| Chronicle menu | calendar (read-only), news, Quest log (Main / Side / Guild / Done), Lore codex, settings, chronicle, mission log, season reviews, codex |
| Overlays | battle (full screen), story scenes and ceremonies (full screen), everything else as a bottom panel |

### Rules

- **Back** is the same everywhere: the top-bar ◀ or a swipe from the left edge. It closes the open room, then the building or menu page, then returns to town.
- **Max 3 taps** to common destinations: hero page (1, party bar), Quest log (1, party bar), rankings (1, top bar chip), calendar (1, date), Guild Hall (2: Town, door), shop (2), settings (2: Chronicle, Settings), current goal (1: the goal chip).
- **Bottom panels** instead of pop-up windows on phones: they slide up, can be swiped down by the header, and size to their content. Full-screen layers only for battles, story scenes and ceremonies.
- **Thumb zone:** the goal chip, the battle actions, the rest button and the party bar sit in the bottom third on phones; the top bar is slim.
- **One interruption at a time**, in this order: battle, mission game, decision, road event, report, story scene, reward moment, town event, council report. Every ceremony can be skipped or continued with one tap.
- **Minimal text:** icons and numbers first, one-line labels, details on long-press, no paragraphs on menus, descriptions over 12 words cut or moved behind long-press.

## 3. Core flows: taps and gestures, before → after

Counts are taps or gestures from the place the flow starts. A drag counts as one gesture.

| Flow | Before (6b) | After (7A) | What changed |
|---|---|---|---|
| **First battle**, one hero's action | 3 (Attack, target, confirm); 4 for a skill (Skill, skill, target, confirm) | **1** drag (hero → wolf, release on Attack); tap fallback 3 (hero, wolf, Attack) | drag + radial; previews on the target; long-press to inspect |
| **Assign 2 heroes and rest a month** | 9 (room tile, 2 × pick from a list, back, Rest, 1 month…) | **5** (2 drags onto room tiles, Rest, drag the dial, Rest) | rooms take dropped heroes; the rest dial snaps to events |
| **Hire a recruit** | 3 (Tavern, scroll, Hire) | **3** (Tavern, swipe, Hire) | swipe cards; disabled Hire says why |
| **Contract → battle → result** (2 heroes, 2 rounds) | 1 board + 1 contract + 4 slot picks + Launch + 12 battle taps + 3 result = **22** | 1 + 1 + 2 drags + Launch + 4 battle drags + 3 = **12** | heroes drag into slots; one gesture per battle action |
| **Tournament sign-up** | 4 (Arena, desk, hero, Sign up) | **4** | long-press the Arena door peeks at the next tournament without walking |
| **Build a room** | 3 (Hall, empty wing, Build) | **3** | Build says why when blocked |
| **Travel** | 3 (Map, location, Travel) | **3** | the map pans and zooms; Travel says why when blocked |
| **Follow the story** (talk to the next person) | 4–6 (Quest log via the menu, read, walk taps, tap the NPC) | **1** (the goal chip walks there and talks) + the choice | quest markers, ! labels, goal chip |
| **Check rankings and history** | 2 (Herald door, tab) | **1** (ranks chip) or a long-press peek on the Herald door | ranks chip and peek |
| **Equip gear / use a potion** | 3 each (pick hero, open list, choose) | **1** drag each (item → hero) | live stat preview while hovering |

## 4. Glossary (one name per thing)

| Use | Not | Meaning |
|---|---|---|
| **gold** | crowns, coin | money (the state field is still `guild.crowns`) |
| **contract** | job, quest, mission | paid work from a notice board |
| **story mission** | quest, chapter | one of the 12 missions of The Last Banner |
| **quest** | task, objective | any Quest Log entry: main (story), side, guild |
| **tournament** | competition, event | an individual tournament (one hero per guild) |
| **championship** | guild tournament | a team tournament (outside Chapter 1) |
| **party** | company, squad | the heroes sent on a contract or a fight |
| **main party** | team, lineup | up to 4 heroes picked in the War room |
| **task** | activity, assignment | what a hero does at home (training, infirmary, scouting, rest, guild duty…) |
| **rest** | wait, skip | let time pass: at the Guild Hall (any length), an inn (1–3 nights) or a camp (1 night) |
| **Guild Hall** | headquarters, HQ | the old stable on Banner Plaza, where rooms are built |
| **room** | facility, wing | a built part of the hall (Training ground, Infirmary…) |
| **fame / legacy** | renown (for the guild) | public reputation / lasting history |
| **ranks** | ladders (in text) | Strength, Legacy, Official |
| **season** | year (in the review) | one calendar year of results |
| **evidence** | clues, proof | the five pieces against Garrick Thorne |
| **Lore codex** | wiki, encyclopedia | the world's history entries |
| **notice** | notification, toast | a short message in the corner |

## 5. Remaining issues for Phase 8

- **No device testing yet.** Drag thresholds (10 px), the long-press time (400 ms), radial size and the 24 px edge-swipe zone need checking on real phones; the edge swipe may fight iOS/Android system back gestures.
- **Long-press on the Phaser canvas** works on the floating labels, not on the sprites themselves.
- **Radial menus with many options** (casters with 6+ skills and several items) get crowded; consider paging or grouping.
- **Hold to fast-forward vs long-press to inspect** during a replaying round: both start with a press; inspect only fires on units.
- **Keyboard and gamepad:** the radial options and drop targets are buttons (tap fallback works with Enter), but there is no focus order for the drag flow and no gamepad navigation.
- **World map card** is still the side panel on wide screens, not a small floating card.
- **Dense text** remains in mission cards, reports, the council report and the Herald tables.
- **Formation positions** (front/back rows) are not draggable; only slots are.
- **Bottom panels** size to content but are not forced to half height; long panels still reach full height.
- **Ghost-hand hints** exist only for the battle drag and the room drag.
- **Old tests and Playwright smoke test** still describe the pre-7A flows; rebuild them in Phase 8.
