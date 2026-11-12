# Guilds of Legend: touch-first UX

Phases 7A and 7C. The game is designed for fingers first; mouse and keyboard are extras. This file is the reference for anyone changing the UI.

## 1. Gesture language

One set of rules for the whole game (`src/components/gestures.js`):

| Gesture | Means | Examples |
|---|---|---|
| **Tap** | select, go, confirm | walk to a spot, open a door, pick a radial action, hire |
| **Drag and drop** | do something *to* something | hero → enemy (from the hero on the battlefield), hero → room, hero → party slot, item → hero |
| **Long-press** (~400 ms) | inspect | unit card in battle, peek at a door or person, stat or skill details, why a button is disabled |
| **Swipe** | next / previous, dismiss, close | section tabs (sideways), hero pages, recruit cards, notices, a bottom panel (swipe its header down), dialogue log (swipe up), back (from the left edge) |
| **Hold** during animations | fast-forward | a battle round, dialogue lines |

- **No double-tap actions** anywhere (`touch-action: manipulation` removes the double-tap zoom delay).
- **Every drag has a tap fallback:** tap the source, then tap the target. Settings → Controls → **Drag gestures / Tap only** turns dragging off.
- **Discoverability:** the first time a gesture matters, a ghost hand shows it once (battle drag, room drag). It is never shown again after the gesture is used (`settings.seenHints`); Settings can show the hints again.
- **Vibration** on hit, crit, KO and drops where the device supports it; Settings can switch it off.
- **Feedback:** every press scales and brightens at once; drop targets light up under the finger; disabled buttons say why when tapped or long-pressed (`Button why=`).

## 2. Screens and navigation (Phase 7C)

Navigation used to live in four places (a sidebar, an 8-item top bar, a stack of buttons over towns and a bottom bar). Since 7C there is one HUD and one screen template.

### The HUD (while exploring)

```
┌ place tag ─────────────┐                       ┌──────── ledger ┐
│ ⌖ Dunmere              │                       │ ⛨  ◎ 980  ▤    │  ← tap: gold, fame, 3 ranks ▲▼,
│   June 1187 · week 2…  │  (fades after ~4 s)   └────────────────┘     status title, known for
│ ! Answer Bram's challenge  ← the goal line (stays; tap = go there)
│
│                         the walkable world
│
│  Party ○                                        ○ Map
│   Items ○                                     ○ Journal
│    Guild Hall ○                             ○ Records
│      Guild ○                              ○ System
│        Contacts ○
( Guild orb )                                    ( World orb )
```

- **Place tag (top left, passive):** location and date, small; fades after about 4 seconds, tap to show it again. The **goal line** under it stays, on one line: tap it and the founder walks to the next story step (or the scene plays when nobody needs to be walked to, or the map opens on the right town). Place tag, goal line and notices together never take more than the top ~15% of the screen.
- **Guild orb (bottom left), the guild itself:** Party, Items, Guild Hall, Guild, Contacts.
- **World orb (bottom right), places, time and history:** Map, Journal, Records, System.
- **Orb behaviour:** tap an orb and its items fan out in a quarter circle toward the screen centre, each with its label. Or press, slide onto an item and release (one gesture, like the combat radial). Tap outside or swipe to close. Badges sit on the orb and on the item (an injured hero, a story scene to play, unread news, a decision waiting in the hall). The orbs' names show under them for the first four uses, then only the item labels when open. Items are 48 px, the orb 56–60 px, and the arc (80°→2°, radius 156 px) never leaves a 390 px screen.
- **Ledger (top right), a short summary:** collapsed, the crest, gold and a book. Tap it: gold, fame, the Strength/Legacy/Official ranks with ▲▼, the status title and what the guild is known for, one line each (under ~40 words); each line opens its screen (Guild → Finances, Guild → Reputation, Records → Rankings, Guild → Charter). **It reacts on its own:** when gold, fame or a rank changes, it shows just that row with the change ("+120", "▲2") for 2.6 seconds and folds away.
- **Desktop:** the same HUD, plus keyboard shortcuts: **P** party, **I** items, **G** guild, **J** journal, **Q** quests, **M** map (again to return), **R** records, **Esc** system (or closes what is open).

### What each item opens

| Orb | Item | Opens |
|---|---|---|
| Guild | Party | heroes (one row each: portrait, name, level, class, health, status; the filter icon appears at 6+ heroes), main party (a lead and up to three companions; the War room adds saved formations), retired and fallen (only once someone is in it) |
| Guild | Items | the inventory; drag an item onto a hero to equip or use it |
| Guild | Guild Hall | the lot diorama: rooms in slots, heroes in rooms, building, resting, the office |
| Guild | Guild | Charter (charter, status, known for, promotion, paths), Reputation, Patrons, Rivals, Finances (costs, property, debt) |
| Guild | Contacts | everyone you have met: where they are, what they offer, how they feel; "moved on" for visitors who left |
| World | Map | the world map; travel |
| World | Journal | what is happening and what is next: **Now** (heroes away and when they return, injured heroes, construction, the tournament, news), **Quests** (the main mission as title, goal, current step, Go and Show on map; other steps and how it opened behind a tap; evidence; side quests; guild tasks; done), **Contracts** (the ones you are working on as short steps with their deadline, and the board's list), **Calendar** (its main button rests at the Guild Hall at home or the inn away) |
| World | Records | rankings and history: **Rankings** (the guild's status and three ranks, a Guilds/Heroes toggle and the ladder picker; long-press a ladder for what it measures), Seasons (reviews and season-by-season ranks), Record book, Hall of fame, Mission log, **Codex** (Lore, Almanac, Bestiary, Guilds) |
| World | System | Game (save, load or quit to title), Settings (short labelled rows, including the main quest marker), Credits |

### One screen template

Every section and building screen (`src/hud/Section.jsx`) has the same parts in the same places:

1. **Title and tabs** at the top; swipe the content sideways to change tab. **Two levels at most:** a section has tabs, and a tab has no row of buttons of its own (a small toggle such as Guilds/Heroes is fine).
2. **A list or grid** in the middle.
3. **A details area:** a side column on wide screens, a bottom panel on phones (swipe its grip down to close).
4. **A portrait** at the top of the details where it helps.
5. **One help line** at the bottom.

**Back** is always at the top left (also a swipe from the left edge, or Esc); the **primary action** is always at the bottom right.

### The bottom of the screen has one owner

In priority order: **dialogue**, then **battle commands**, then **bottom panels** (sections, modals, peek cards), then **the orbs**. While any of the first three is on screen, the orbs fade out (`shell.css`, the `:has()` rule).

**Notices** (the engine's notifications and the UI's short messages) go through one queue (`NoticeQueue` in `App.jsx`): one at a time, at most two lines, in the goal line's slot under the place tag (the goal line steps aside meanwhile), or over the help line at the bottom left when a section is open (the help line steps aside). Never over the scene's centre or a panel's content. Each steps aside after 4.5 seconds (errors 7); a tap dismisses it. They wait while an interruption is showing.

### Screen inventory

| Place | Screens |
|---|---|
| Walkable town or wild area | the scene with the HUD; doors, people and things to tap; long-press peeks; dialogue at the bottom |
| World map | the map (pan, pinch) with the place tag and the location card |
| Sections | Party, Items, Guild Hall, Guild, Contacts, Journal, Records, System |
| Building interiors | Tavern / Inn, Arena, Shop, Herald: walkable rooms with people; their panels (shop, inn, sign-up desk, history board) open in the template |
| Notice board | a compact list: contracts posted here and taken from people; tap one for its steps, place, pay, deadline and Accept / Report / Give up |
| Overlays | battle (full screen), story scenes and ceremonies (full screen), everything else as a bottom panel |

### The battle screen (battle-hiring spec)

- **The bodies are the interface.** Heroes stand on the left facing right, enemies on the right facing left, on one ground line and at one scale (`--unit` in battle.css; bosses a little larger). Up to two per row; extra units stand in a back row.
- **Under every unit, a plate:** first name, level, a slim HP bar (and MP for heroes), status icons, on a dark plate that stays readable on any backdrop. A check on a hero's plate means their command is chosen.
- **Drag from the body:** press a hero and drag; a ghost of the sprite follows the finger with a line from the hero, valid targets glow, and the target shows a preview (damage range and hit chance, heal, ☠ for a kill). Rest the finger on a target for a moment (it must be still, so passing over a unit does nothing) and the radial menu opens under the thumb; release on an action. Release on a target without resting: the same menu opens there. The dragged hero's own menu opens only by dropping on them.
- **Tap fallback:** tap a hero, then a target: the same radial menu. Long-press any unit or turn-order icon for its details.
- **The bar at the bottom:** the items (icon and ×count; tap one, then a hero, or drag it onto the hero) on the left; Undo, Auto, Speed and Flee as small icons on the right. No instruction text.
- **Top:** the turn order, centred; the tell right under it. Enemy intent is one small icon above the enemy (long-press for what it means).
- **First battle:** a ghost hand drags from the first hero to the first enemy, once (`settings.seenHints.battleDrag`).
- **HP and MP carry over** between battles (`hero.health` and `hero.mana`, percents). Heroes at home get +6 health a day and full MP; camping, inns and the hall restore MP. A hero knocked out in a battle the party wins ends at 1 HP and injured for a week. The victory card shows every hero's HP after the fight and marks the injured.
- **Images never start a native drag** (`img { -webkit-user-drag: none }`): every drag in the game is ours.

### Hiring: the recruit's ID card

From a recruit's first line, a card sits right above the conversation: portrait, name, class (icon and name), level, age, rarity, primal, and the stats as ranges. "What can you do?" and scouting narrow the ranges; the card updates at once.

### Rules

- **Max 3 taps** to common destinations: a hero's page (2: Guild orb → Party, then the hero), quests (2: World orb → Journal, or **Q**), what is happening now (2: Journal), rankings (2: World orb → Records, or the ledger), money (2: the ledger → Gold), the calendar (3), the Guild Hall (2), settings (3), the current goal (1: the goal line).
- **One interruption at a time**, in this order: battle, mission game, decision, road event, report, story scene, reward moment, town event, council report. The HUD hides while one is showing.
- **Minimal text:** icons and numbers first, one-line labels, details on tap or long-press. No explanatory paragraphs on menus; one line per list item; about 80 words at most on any screen's first view (dialogue and story scenes excepted).
- **Dialogue:** every dialogue box types its line out; the first tap finishes the line, the next moves on. **Skip** finishes the line, then jumps to the next choice (never past one) or the end of that part of the scene. Narration has no name tag.
- **Skip never moves** (playtest-1-feedback): while a line is read, the text has a fixed area (four lines; it scrolls if ever longer) and the controls a fixed row under it: "Tap to continue" at the bottom left, Skip at the bottom right. Event, road and recruit cards reserve the whole line's space while it types, so their choices never jump.
- **Doors and exits ask first:** walking onto or past a door never triggers it. Tapping a door, an exit or a town gate opens a bubble above it ("Enter The Wayfarer", "Leave to Dunmere", "Travel: The Old Road"); tapping the bubble does it, tapping anywhere else closes it. A person or object standing by a door wins the tap. Enemy groups still start their fight when touched.
- **Result screens show, don't tell:** a won fight shows "Victory" over the field, then one victory screen (each hero's portrait with an XP bar and "Level up!" in it, HP left, a bandage for the injured; gold and loot as icons with numbers; Continue). Level-ups from that fight fold into it: never a second screen. The battle log waits behind **Details**. A finished contract shows its name, the grade as stars, gold, fame and reputation as icons, loot, one line from the giver and Continue. A defeat shows one line, the cost and the recovery time as icons.
- **Safe areas:** nothing under the notch or the home bar (`viewport-fit=cover` plus `env(safe-area-inset-*)`); the game fills `100dvh` and can be added to the home screen.
- **World labels never collide with the HUD:** a name that would sit under the place tag, the ledger or an orb fades until the camera moves.

### The guild's home (7D)

- **No hall, no hires.** Until story mission 1 rents the Dunmere lot, recruits can be met and interviewed, but "What would it take to sign you?" ends with "Where would I sleep? Come back when you have a hall." The tavern's goal line, Contacts and Journal → Quests say so.
- **The lot:** rented, 6 slots, a cabin (Bedroom, 2 beds) already built. Each room takes a slot; an empty slot tile opens the build list. A rented lot cannot grow.
- **Long-term goals** (Guild Hall and Treasury, and the ledger): "Buy the property" (price, savings, "at this rate: about N months"), then "Expand the lot" one step at a time. Buying is a ceremony and a Chronicle entry.
- **Before renting** the hall door, the Guild orb item and the section all say **Empty lot**: the yard for rent, a button to talk to Gideon Rusk, and the house you live in until then.
- **Ledger money rows:** costs a month (rent · rooms · wages), saving (+N a month, measured from the second month), toward the deed or more land (%).

### The Guild Hall screen (guild-hall-rooms spec)

- **The lot diorama:** every slot on one phone screen, three to a row: the cabin's bedroom, each built room (icon, name, tier pips, what it gives, who is in it), the room being built (progress), and empty slots (dashed, **+**). Bedrooms show their two beds, filled or empty.
- **Tap an empty slot:** the bottom panel lists every room type (icon, one line, cost, weeks, upkeep, what it gives); a training room picks its equipment there. The next-upgrade line's **Build** opens the same list with its room marked.
- **Tap a built room:** the bottom panel shows who is in it and what it does, then **Upgrade** (to Advanced, then State of the art; training rooms upgrade their equipment), **Swap equipment** (training rooms; the old piece sells back for half) and **Clear the room** (a confirm; part of the price back; the slot is free in a week). The Crown Room's panel shows every trophy with its count (×2) and every special title.
- **Heroes into rooms:** drag a hero from the strip under the lot onto a training room or the infirmary; drag a hero out of a room onto the yard to take them out. Tap fallback: tap the hero (it lights up), then the room. **Auto-assign** puts the injured into infirmary beds and fit heroes into empty training rooms. One hero per training room, one patient per infirmary.
- **Below the strip:** **Rest and pass time…** (the rest dial in the bottom panel, with what each room will give this rest: "Nessa: +2 Finesse a month", "Crown Room: +3 fame a month"; it closes after resting), **Auto-assign**, **Office** (appointments), then the property goal.
- **One bottom panel at a time**, closed by its ✕. Routes `rest`, `build` and `office` open the hall with that panel up.
- **Defeat** (a lost battle, accepted): a calm card, "Carried home to Dunmere. They wake in the Guild Hall. Treatment and transport: 90 gold. Back on their feet in about a month." In the wild, the defeat card offers **Retry battle** and **Accept defeat**. Nobody dies in battle.

### Buildings and people (7C, Part 2)

**Every building is a walkable room** (`src/data/interiors.js`, `InteriorScene.jsx`, `interiorMap` in `sceneMap.js`): the room is painted from the hand-painted interior tiles (`scripts/art/interiors.py`, which also records the furniture you bump into), and you walk in it with the town's controls. 3–7 people stand at their spots with their name and offer badges and turn to face you; walk up to someone (or tap them) to talk, to a shelf or board (shop shelves, the history board, the ranking board, the records shelf) to use it, and to the door mat ("Out to …") for the "Leave to …" bubble. Each town has its own colours of the room on one shared layout. A painting with no walkable room falls back to a painted scene (tap to talk or use); the prologue house is one (`interior.house`). The Guild Hall is the exception: the lot diorama (The Guild Hall screen, above).

**One people model** (`src/game/engine/people.js`): each person has a name, a role, a place (town, building, spot), a look (a silhouette by role or class until art arrives), a memory (met, talks, relationship, interview) and **offers**: `mission`, `hire`, `challenge`. Regulars (keepers, clerks, registrars, referees, Mara Fen) stay; visitors rotate every month (recruits, petitioners, challengers, travellers, a messenger while there is news). Recruits *are* the candidates, petitioners hold the contracts, challengers are candidates who join only after a won bout: nothing is duplicated.

**Discovery through conversation:**
- Unknown people show **?** over their heads. They speak first: what they want from you, then their name. Then the topics you can ask, in any order; each answer comes back to the topics, asked ones checked, and goodbye gets their farewell. How lines are written: [`docs/DIALOGUE.md`](DIALOGUE.md).
- Once known, the label shows their offers: **!** (a contract), **coin** (looking for work; a padlock while they want a bout first), **crossed swords** (a bout).
- People remember you: the second time they greet you like someone they know.

**The questions:**

| Ask | Leads to |
|---|---|
| Need anything done? | the petitioner describes the problem, the pay and the danger → **We’ll take it.** (it starts at once: in the Journal, on the map, its objectives placed) or **Not this one.** (a rival takes it, a little regional reputation lost). Later: **It’s done.** reports it (the Mission complete screen); after a missed deadline they say so once. |
| Looking for work? | the interview, in their personality’s voice: **Tell me about yourself.** (dream, flaw) · **What can you do?** (narrows their stat ranges, like scouting) · **What would it take to sign you?** (fee, monthly wage, 2 years, a free bed; or why not: reputation, charter, no bed, gold, "beat me first") → **Deal. Welcome to …** hires them. "Where are you from?" is small talk. |
| Fancy a friendly bout? | a friendly one-on-one with the existing combat; win: +3 fame, more respect, and a challenger agrees to hear your offer; lose: −1 fame |
| A keeper's service | Shop: the shop panel slides up (shelves open their category) · Inn: rest 1–3 nights · Registrar: the sign-up desk · Referee: starts the bout during a tournament ("No tournament in progress" otherwise) · Herald's clerk: Records → Rankings · Messenger: the news · Traveller: a rumour puts a new place on the map |

**Each building:**
- **Tavern** (Dunmere's Wayfarer): Mara Fen at the bar (her story scenes, introductions: "Introduce me to someone" makes every recruit at the tables known), recruits at the tables, a traveller or petitioner with a contract.
- **Inn** (other towns): the innkeeper rents rooms; travellers with rumours; recruits and petitioners.
- **Arena:** the registrar at the desk, the referee on the fighting ground, the history board on the wall (champions and records), and a sparring challenger.
- **Herald's office** (Dunmere, Ironford): the clerk at the desk (rankings), the ranking board (rankings), the records shelf (almanac and lore), a messenger while there is unread news.
- **Shop:** the shopkeeper opens the shop; each shelf opens its category (potions, weapons, armor, charms).

**The notice board** (the one list): a physical board in each town square. It lists the contracts posted there (story and boss contracts) and the ones people here gave you, each with its status (New, Working, Done: report, Too late). Tap one for its panel: the stakes in one line, where it happens, its steps, the pay and the deadline, then **Accept** (and **Decline**), **Go**, **Report** (a posted job) or **Give up**. Contracts in other towns are listed under "Elsewhere".

### Contracts in the world (missions-in-world spec)

- **A contract is a place to go and things to do there.** Taking one (from a person or the board) adds it to Journal → Contracts as short steps ("Inspect wolf tracks · Defeat the pack · Defeat the handler · Return to Ulric Lark"), puts a marker on the world map and places its objectives: in the wild area by the town (the Old Road, the Thornwood edge, the Blackwood), in the town's own streets (talk-heavy jobs), or in a painted site behind a door in town (the Ironford archive vault and slag pits, the Windmere cliff path).
- **Objectives are things in the world**, all marked like a quest so they stay in view: enemy groups (touch or tap one for the normal battle; bosses wear a skull), people (talk; a choice may test a hero's stat, shown as "Presence 52: likely", or cost gold), clues and locks (inspect; some need a stat or class: "A Rogue could open this"; a failed sneak raises the alarm and the next fight there is harder), finds (collect, 1/3), and escorts (they come with you to the place marked "Bring Elsa here"). Extras (a hidden cache, a side clue) are optional.
- **Steps update as you do them**; nothing is rolled out of sight. When the required ones are done, report back to the giver ("It's done.") or at the board. Story contracts finish on the spot and the story moves on.
- **The grade comes from what you did:** Success for the job; a star more for every extra found, a star more for a clean job (nobody knocked out, within the days it should take), a star less for a rough one (two or more knocked out, a corner cut in talk, or twice the days). One Mission complete screen shows it.
- **No mission clock and no pop-ups:** time passes only through travel, camping and resting; some contracts have a calendar deadline (Journal, board, calendar). Losing a fight on site is the defeat rule; the contract stays open. Only the battle screen and talk with people on site interrupt.
- **Road events are a card:** the title, one line of narration and the choices as full-width rows, nothing under it.

**Contacts** (Guild orb): everyone you have met, with portrait, where they are (town and building), what they offer and how they feel about you; people who rotated out are marked "Moved on · last seen in …". **Map** shows their town.

## 3. Core flows: taps and gestures, before → after

Counts are taps or gestures from the place the flow starts. A drag counts as one gesture.

| Flow | Before (6b) | After (7A) | What changed |
|---|---|---|---|
| **First battle**, one hero's action | 3 (Attack, target, confirm); 4 for a skill (Skill, skill, target, confirm) | **1** drag (hero → wolf, release on Attack); tap fallback 3 (hero, wolf, Attack) | drag + radial; previews on the target; long-press to inspect |
| **Assign 2 heroes and rest a month** | 9 (room tile, 2 × pick from a list, back, Rest, 1 month…) | **5** (2 drags onto room tiles, Rest, drag the dial, Rest) | rooms take dropped heroes; the rest dial snaps to events |
| **Hire a recruit** | 3 (Tavern, scroll, Hire) | **3** (Tavern, swipe, Hire) | swipe cards; disabled Hire says why |
| **Contract → battle → result** (2 heroes, 2 rounds) | 1 board + 1 contract + 4 slot picks + Launch + 12 battle taps + 3 result = **22** | talk (2) + walk to the group (1) + 4 battle drags + Continue (1) = **8** | no party builder: the party travels with you; one gesture per battle action |
| **Tournament sign-up** | 4 (Arena, desk, team, Sign up) | **4** | long-press the Arena door peeks at the next tournament without walking |
| **Build a room** | 3 (Hall, empty wing, Build) | **3** | Build says why when blocked |
| **Travel** | 3 (Map, location, Travel) | **3** | the map pans and zooms; Travel says why when blocked |
| **Follow the story** (talk to the next person) | 4–6 (Quest log via the menu, read, walk taps, tap the NPC) | **1** (the goal chip walks there and talks) + the choice | quest markers, ! labels, goal chip |
| **Check rankings and history** | 2 (Herald door, tab) | **1** (ranks chip) or a long-press peek on the Herald door | ranks chip and peek |
| **Equip gear / use a potion** | 3 each (pick hero, open list, choose) | **1** drag each (item → hero) | live stat preview while hovering |

## 4. Glossary (one name per thing)

| Use | Not | Meaning |
|---|---|---|
| **gold** | crowns, coin | money (the state field is still `guild.crowns`) |
| **contract** | job, quest, mission | paid work from a person or a notice board, played in person at its site |
| **site** | dungeon, instance | where a contract happens: a wild area, the town, or a painted place behind a door |
| **objective** | task, goal | one thing to do at a site (fight, talk, inspect, collect, escort); an **extra** is optional |
| **story mission** | quest, chapter | one of the 12 missions of The Last Banner |
| **quest** | task, objective | any entry in Journal → Quests: main (story), side, guild |
| **tournament** | competition, championship | a guild event: teams of up to 2, 4 or 5 heroes by circuit |
| **circuit** | division, league | Initiation, Champion or Elite tournaments; a guild enters its status tier or lower |
| **status** | tier (for guilds), rank | the guild's standing: Initiation, Champion, Elite (internal ids Regional, National, Global) |
| **special title** | achievement, badge | a title earned by a collection of tournament wins (Triple Crowned, Dynasty, Giant Killer …) |
| **party** | company, squad | the heroes with the founder: they fight, talk and travel together |
| **main party** | team, lineup | a lead and up to three companions (Party → Main party); no room needed |
| **party lead** | captain, leader | the main party's first hero; takes the lead role in every arrangement |
| **task** | activity, assignment | what a hero not in a room does at home (rest, scouting, exhibitions, guild duty) |
| **rest** | wait, skip | let time pass: at the Guild Hall (any length), an inn (1–3 nights) or a camp (1 night) |
| **Guild Hall** | headquarters, HQ | the old stable on Banner Plaza, where rooms are built |
| **room** | facility, wing | a built part of the hall, in one slot (Bedroom, Training room, Infirmary, Treasury, Armory, Scout table, Crown Room) |
| **tier** | level (for rooms) | a room's grade: Basic, Advanced, State of the art |
| **equipment** | drill, focus | what a training room holds; it sets the stat (dummy: Might, targets: Finesse, reading desk: Mind, shrine: Spirit, weights: Endurance, podium: Presence) |
| **defeat** | death, wipe | losing a fight: the party wakes in the infirmary at home, pays treatment and transport, and recovers for weeks |
| **fame / legacy** | renown (for the guild) | public reputation / lasting history |
| **ranks** | ladders (in text) | Strength, Legacy, Official |
| **season** | year (in the review) | one calendar year of results |
| **evidence** | clues, proof | the five pieces against Garrick Thorne |
| **Lore codex** | wiki, encyclopedia | the world's history entries |
| **notice** | notification, toast | a short message under the place tag |
| **person** | NPC, candidate, contract giver | anyone you can talk to inside a building |
| **contact** | friend, acquaintance | a person you have met (Contacts) |
| **bout** | duel, spar | a friendly one-on-one fight with a person |
| **orb** | menu button, wheel | the Guild orb (bottom left) and the World orb (bottom right) |
| **ledger** | status bar, top bar | the gold-and-ranks book at the top right |
| **section** | page, menu screen | a screen in the one template (Party, Records…) |
| **Records** | Chronicle (menu), Herald (as a menu) | rankings, seasons, record book, hall of fame, mission log, almanac, lore |

## 5. Remaining issues for Phase 8

- **No device testing yet.** Drag thresholds (10 px), the long-press time (400 ms), radial size and the 24 px edge-swipe zone need checking on real phones; the edge swipe may fight iOS/Android system back gestures.
- **Long-press on the Phaser canvas** works on the floating labels, not on the sprites themselves.
- **The orbs’ press-and-slide** and the left-edge back swipe both start from screen edges; check on real phones that the system gestures do not win.
- **People and rooms:** first names over heads keep a full room readable; a room shows at most 7 people (more visitors wait for a free spot). 
- **Sections wrap older screens** (heroes, rankings, history, shop…): their inner layouts were flattened to hairline bands but not yet rebuilt as list + details. Phase 8 can finish that per screen.
- **Radial menus with many options** (casters with 6+ skills and several items) get crowded; consider paging or grouping.
- **Hold to fast-forward vs long-press to inspect** during a replaying round: both start with a press; inspect only fires on units.
- **Keyboard and gamepad:** the radial options and drop targets are buttons (tap fallback works with Enter), but there is no focus order for the drag flow and no gamepad navigation.
- **World map card** is still the side panel on wide screens, not a small floating card.
- **Dense text** remains in mission cards, reports, the council report and the Herald tables.
- **Formation positions** (front/back rows) are not draggable; only slots are.
- **Bottom panels** size to content but are not forced to half height; long panels still reach full height.
- **Ghost-hand hints** exist only for the battle drag and the room drag.
- **Old tests and Playwright smoke test** still describe the pre-7A flows; rebuild them in Phase 8.
