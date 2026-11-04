# Chapter 1 playthrough (Phase 8A)

The running log for Phase 8A (docs/PROJECT_PLAN.md): every issue found while playing Chapter 1 by touch (390×844, iPhone profile) and with a mouse (1440×900), its fix, and the proof. Any session picks up from **Where we are**.

Screenshots: `docs/screenshots/8a/` (issues and verification) and `docs/screenshots/clarity/` (the clarity spec, before and after).

## Where we are

| Step | Status |
|---|---|
| Spec: clarity-navigation | **done** (session 1) |
| Stage 1: play and log | in progress: tutorial path on the phone through mission 3's contract (P-1…P-17). Blockers on the way were fixed at once so play could go on |
| Spec: battle-hiring | **done** (session 2; proof in `docs/screenshots/8a/battle-hiring/`) |
| Spec: guild-hall-rooms | **done** (session 3; proof in `docs/screenshots/8a/guild-hall-rooms/`) |
| Spec: playtest-1-feedback | **done** (session 4; proof in `docs/screenshots/8a/playtest-1-feedback/`) |
| Spec: missions-in-world | **done** (session 4; proof in `docs/screenshots/8a/missions-in-world/`) |
| Spec: tournaments-circuits | **done** (session 4; proof in `docs/screenshots/8a/tournaments-circuits/`) |
| Autoplay update and balance | autoplay plays contracts in person (missions-in-world); the economy is measured below, **tuning waits for targets** (owns P-16) |
| Stage 2: fix the log | ongoing (fixes land as they are found) |
| Stage 3: replay and verify | not started |

**Order of work** (each spec changes what the playthrough sees, so build before replaying):
1. Finish Stage 1 for what no spec replaces: every town, building, NPC and conversation; hiring; Party, Items, the hero page; the hall and resting; travel; the wild areas; the arena sign-up; menus and save/load; the desktop size.
2. battle-hiring → guild-hall-rooms (rooms, infirmary, the defeat rule) → missions-in-world (needs the defeat rule) → tournaments-circuits.
3. Autoplay that plays like a person, then balance with data only.
4. Stage 3: replay both paths at both sizes; verify every entry.

**Play driver** (scratch, not committed): Playwright scripts with helpers for a new game, the prologue, the goal line, dialogue (ask every topic, then decide), cards, fights (Auto) and the board. They read `window.gol_state_text()` (App.jsx, a test hook with the place, the open section, the interruption, the date, gold, heroes and the story step) and the scene's `window.render_game_to_text()`. Note: tapping the dialogue box needs a forced click (Playwright never sees the full-screen layer as stable).

### Session notes
- **Session 4, tournaments-circuits (2026-11-04):** built and proven at both sizes from engine-built saves: the Dunmere arena, the registrar ("I’d like to sign up a team."), the sign-up desk picking a pair for the Harvest Melee (Initiation, teams of up to 2), signed up; on the start day the referee, the fighting ground (the Ember Company’s pair against Thornwake Wardens), a team bout won ("Victory", one screen), the semifinal next; Records → Record book with the seven special titles (Dynasty held); the Official ladder; the history board with the 1187 champion. Engine checks: all 15 events created each year (8/4/3), sign-up, start day, a first-round loss, a title run (three bouts, champion, the Amber Blade stored as a trophy), Dynasty after three wins in a row, the Argent Crown holding Dynasty from the start, a valid state after each step; autoplay over five seeds runs the full year (contracts 6–10 a year; the spread against the old code is random variation in the contract board and rewards, not a stall). **Next:** pick the balance targets (see Balance), then Stage 1 for what no spec replaced (every town, building and conversation at both sizes; the arena now has team sign-ups), then Stage 3 (replay both paths at both sizes, verify every entry, the final checklist).
- **Session 4, missions-in-world (2026-11-04):** built and proven at both sizes from engine-built saves: a contract taken from a petitioner (the Journal's steps, the board's panel), a town contract's talk with a test ("Presence 46: even odds"), the Old Road with the wolf hunt's objectives marked, inspect, both fights ("Victory", one screen each), back to the giver in the Wayfarer ("It's done.") and the Mission complete screen (Great, 14 words); the Ironford archive as a painted site with tests on every choice; the road-event card. Engine checks: all 8 Regional templates in all 4 slice towns played end to end (31 of 32 finish; the Blackwood one at Ironford is a lost fight, see balance), a missed deadline (failed, the giver says so once, the contract leaves), and autoplay playing contracts in person (12 in a simulated year). **Next:** tournaments-circuits.
- **Session 4 (2026-11-04):** built playtest-1-feedback. Proof at both sizes: Skip at the same pixel on lines of 15–83 characters (prologue and people); the painted house with the door bubble; "Enter The Wayfarer", the painted tavern (Mara behind the bar, recruits at the tables), the arena and the herald, "Leave to Dunmere" from inside, "Travel: The Old Road" at the town edge; a won fight ("Victory" over the field, then one 6-word victory screen with Details, nothing queued after it); a lost one (the defeat card with −90 gold and 1 month as icons). **Next:** missions-in-world.
- **Session 3, open items (2026-11-04):** fixed P-1, P-2, P-12, P-13, P-15 (verb), P-18, P-23, P-27. Still open: P-9 (the notice board) and the rest of P-15 belong to missions-in-world, which replaces both; P-16 is balance, done after the specs. Proof in `docs/screenshots/8a/open-items/` and the engine checks named in each row.
- **Session 3 (2026-11-04):** built guild-hall-rooms. Proof at both sizes from a save built with the engine and loaded through Settings → Backup (scratch `make-hall-save.mjs`, `s-hall.mjs`): the lot diorama, building a training room, a real drag of a hero into it, upgrading its equipment to Advanced, the Crown Room with a trophy ×2, a lost fight → Accept defeat → the defeat card → the infirmary patient. An engine check (`check-hall.mjs`) confirmed what the screen does not print: +1 Finesse after a month in a Basic training room; a defeat costs treatment and transport, takes 4 weeks with a Basic infirmary, the second patient heals at half speed, nobody dies. Two loops: the rest panel now closes after resting (it hid the lot), the defeat card is calm (no ceremony burst, no borrowed tavern art). **Next session:** tournaments-circuits.
- **Session 2 (2026-11-04):** Stage 1 on the phone, tutorial path: the prologue, missions 1–3 up to the first report. Fixed on the way: P-4, P-5, P-6, P-7, P-8, P-10, P-11, and P-3 (labels by priority). Two new specs arrived (missions-in-world, tournaments-circuits); see the order of work above.
- **Session 1 (2026-11-04):** built the clarity-navigation spec (it was in hand when 8A started). Before and after screenshots and word counts in `docs/screenshots/clarity/` (`before-*`, `after-*`; three review loops). `view` = words inside the 390×844 viewport, `all` = every word in the panel including scrolled text. **Next session:** Stage 1, play and log (both paths, phone and desktop), starting from a new game.

### Word counts, first view at 390×844 (clarity spec)

| Screen | Before | After |
|---|---|---|
| Party | 97 (233 in the panel) | 19 |
| Quests → Journal → Quests | 130 (165) | 69 (74) |
| Journal → Now | (no such screen) | 17 |
| Records | 88 (302); Goals tab 87 (362) | 94 (113); the guild's ranks and one ladder of 13 guild names. Codex 48 |
| Ledger (open) | 38 | 15 |
| Map | 103 (235) | 42 |
| System → Game | 42 | 26; Settings 36 |
| New game | 76 (84) | 19 (27) |
| Save slots | 89 | 9 |
| Field HUD, top band | toast + place tag + 2-line goal: ~34% of the height | place tag + 1-line goal: ~12% |

## Issue log

Severity: **blocker** (can't continue), **major** (confusing or broken), **minor** (rough edge), **polish**. Status: open / fixed / verified.

| Id | Sev | Area | Steps | Wrong → should | Shot | Status |
|---|---|---|---|---|---|---|
| C-1 | major | Money | New game, skip tutorial, wait for the first action | "Seek a Counter-Primal" completes at once and pays 260 gold (old chapter goals) → no leftover rewards | clarity/before-records-goals.png | fixed |
| C-2 | major | Prologue | New game, first line, tap Skip | Skip jumps to "THUD. THUD. THUD." and then does nothing → Skip finishes the line, then ends that part of the scene | clarity/before-prologue-skip.png | fixed |
| C-3 | minor | Dialogue | Any narration line | An empty dark name pill → no tag without a speaker | clarity/before-prologue.png | fixed |
| C-4 | major | HUD | Any notice | Up to three toasts stacked over the scene or a panel, plus a separate message bar → one notice at a time, at most two lines, in one place | clarity/before-field.png | fixed |
| C-5 | major | Navigation | Open Records | 12 tabs plus 7 sub-buttons; opens on the charter, not the ranks → Records = Rankings, Seasons, Record book, Hall of fame, Mission log, Codex; opens on the ranks | clarity/before-records.png → after-records.png | fixed |
| C-6 | major | Navigation | Look for "what my heroes are doing" | Spread over Quests, Calendar, the hall and the board → Journal: Now, Quests, Contracts, Calendar | clarity/after-journal-now.png | fixed |
| C-7 | minor | Navigation | Guild identity | Charter, reputation, patrons, path and money split between Records and the Treasury → Guild section | clarity/after-guild.png | fixed |
| C-8 | major | Party | Open Party with 2 heroes | Three dropdowns, a rules paragraph and long cards; empty "Retired & fallen" tab → one row per hero, filters behind an icon from 6 heroes, the tab only when needed | clarity/before-party.png → after-party.png | fixed |
| C-9 | minor | Quests | Open Quests | Marker checkbox on top, paragraphs per mission → title, goal, step, Go / Show on map; marker setting in System → Settings | clarity/before-quests.png → after-journal.png | fixed |
| C-10 | minor | Map | Open the map on a phone | A text-heavy card, a legend, six "Beyond the known roads" rows → name, primal, one action, details behind a tap; one row for later chapters | clarity/before-map.png → after-map.png | fixed |
| C-11 | minor | Title | Title screen and new game | Empty slots repeat a sentence; tagline and footer; a long premise and skip description → "New game"; guild, year and crest; one-line premise | clarity/before-slots.png → after-slots.png | fixed |
| C-12 | minor | HUD | Field, any goal | The goal chip wraps to two lines and is cut at 190 px → one line across the row under the ledger | clarity/after-field.png | fixed |
| C-13 | minor | Records | Rankings when the guild is low | The guild's own row is off screen → pinned above the ladder when below 5th | (after the last loop; check in Stage 1) | fixed |
| C-14 | polish | Codex | Records → Codex → Lore | A third row of filter buttons and full paragraphs → one line per entry, grouped, tap to read | clarity/after-records-codex.png | fixed |
| C-15 | polish | Code | — | Dead screens and CSS: Goals, LegacyScreen (unreachable), IdentityScreens, NewsScreen, QuestLogScreen, hero cards, goals.css, old toasts → removed | — | fixed |

Stage 1 (playthrough) entries, tutorial path on the phone (`8a/phone-s1-*`, `8a/phone-s2-*`):

| Id | Sev | Area | Steps | Wrong → should | Shot | Status |
|---|---|---|---|---|---|---|
| P-1 | minor | Prologue | Knock lines, then tap the front door | The door is off screen; the founder walks ~7.5 s to it, the first thing the player does → the door closer to the start, or a faster first walk | 8a/phone-s1-005-after-door-tap.png | fixed: the founder starts by the table, 260 px from the door (was 600). Note: headless runs walk at ~38 px/s (slow frames, 50 ms step cap), so the 7 s seen in the log was mostly the test browser; at 60 fps the walk is ~1.4 s (8a/open-items/phone-001-p1-house-start.png) |
| P-2 | minor | Founding card | Raise the banner | Four long charter cards (pitch, 3 modifiers, path) on one scroll; the banner relic is a placeholder → compact cards, details on tap | 8a/phone-s1-007-founding-card.png | fixed: four compact tiles (crest and name), the chosen charter's pitch, modifiers and path in one panel below (8a/open-items/phone-002-p2-founding-charters.png). The banner relic stays a placeholder until its art arrives |
| P-3 | major | Dunmere | Arrive in town | Edge labels overlap: Gideon Rusk's pointer label sits on Orren Pike's → labels are placed by priority (quest beacons, the near target, the rest); one that would overlap a placed label fades, like labels under the HUD | 8a/phone-s1-009-town-arrival.png | fixed |
| P-4 | major | Moments | Mission 1: pay the rent | The card said "Construction complete", repeated its title, showed the grand-hall art, read "now a empty hall", and its Continue button was cut off → its own heading, the cabin art, no stage badge, a smaller headline and art on phones | 8a/phone-s2-002-story-m2.png → phone-s2-003-interruption-moment.png | fixed |
| P-5 | major | Interruptions | Any choice that queues a card while a conversation is open | The card opened over the open dialogue, hiding its reply → while a conversation is open, queued cards (moments, events, reports, story scenes) wait; fights and decisions can still interrupt | 8a/phone-s2-002-story-m2.png | fixed |
| P-6 | major | Interiors | Mission 2: enter the Wayfarer | No goal line inside buildings (Mara has a "!", nothing says to talk to her) → the goal line shows inside too: tap to walk to the story person, or to head out when the step is elsewhere | 8a/phone-s2-004-stuck.png | fixed |
| P-7 | minor | People | The Wayfarer, first visit | Two "Joren" and two "Ulric" in one room → generated visitors take unused first names; recruits who share one show an initial | 8a/phone-s2-004-stuck.png | fixed |
| P-8 | blocker | Cards | Mission 2: Nessa joins (also every town event and road event) | The quote card reused the \`.dialogue\` class, which is now the full-screen conversation layer: dark ink on dark, the name plate over the badges, and an invisible layer over the Close button (it could not be tapped) → the card has its own \`quote-card\` classes | 8a/phone-s2-006-interruption-moment.png → phone-s2-010-interruption-road.png | fixed |
| P-9 | major | Notice board | Mission 3: the board with one contract | A family filter for one contract, the contract twice (card and detail), "Hide intelligence", a difficulty grid, a formation picker and long help → a compact list; tap a contract for one panel with the party slots and Send | 8a/phone-s2-008-section-noticeBoard-.png | fixed: the board is a compact list; tap a contract for one panel (steps, place, pay, deadline, Accept); no party builder |
| P-10 | minor | Notices | Any notice while a section is open | It covered the section title → it sits over the help line at the bottom left (the help line steps aside) | 8a/phone-s2-008-section-noticeBoard-.png | fixed |
| P-11 | minor | Party bar | Notice board → party bar | A "Quest log" button with no action (dead) → removed | 8a/phone-s2-008-section-noticeBoard-.png | fixed |
| P-12 | minor | Road events | Send the Old Road contract | "On the road to Dunmere" while leaving Dunmere; "Use them in battle with the Item command" (no such command now) | 8a/phone-s2-010-interruption-road.png | fixed: the opening card says "Setting out: Wolves on the Old Road"; potions are "used in battle from the item bar". The rest of the road-event card goes with missions-in-world |
| P-13 | major | Battle | Mission 3 fight | "Wolves on the Old Road" fields a boar called "Renegade Priest A" and a skeleton "Shield Thug B"; the hint says "Drag a hero onto a wolf" → wolves, named as wolves | 8a/phone-s2-012-battle-start.png | fixed: a contract can name its enemies (the wolf hunt fields Grey Wolves and the Road Bandit driving them); every enemy type and boss now uses the sprite that looks like it (the priest was a boar, the thug a skeleton, the Tempest Roc a slime) |
| P-14 | major | Battle | Any fight on the phone | The first-fight hint box covers the turn order and the tell; heroes are small at the bottom; instruction text in the command panel; big name cards → the battle-hiring spec | 8a/phone-s2-012-battle-start.png | fixed |
| P-15 | minor | Reports | Mission 3 report | "Nessa Thornfield return wounded" (grammar); "Legendary" for a risk-1 job; a long report → fix the verb; shorter report | 8a/phone-s2-016-interruption-report.png | fixed: the verb; the report is gone, a contract ends on one short Mission complete screen whose grade comes from what was done |
| P-16 | major | Balance | Mission 3 | The first contract pays 498 gold (560 → 1003) for one week → the balance pass | 8a/phone-s2-016-interruption-report.png | open (balance) |
| P-17 | minor | Combat | Mission 3, won at 97% | Nessa ends the fight hurt and comes back injured after a 3-round win | 8a/phone-s2-013-battle-result.png | fixed: HP and MP now carry over; a knockout in a won fight is 1 HP and 1 week injured (the random mission injury goes with missions-in-world) |
| P-18 | major | Old Road | Tap "Bandit lookouts" (desktop and phone) | No route to the group: the founder never moves and no fight starts → check the layout (group at [24,4]) in the wild-area pass | 8a/battle-hiring/desktop.log | fixed: five targets had no path (the lookouts, the Void hulks, the Lantern Brood's den, the Ironford smith and bridge plaque): their approach spot fell inside an obstacle's padding. Walking now stops at the nearest reachable cell (up to 2 cells away); the lookouts and the plaque moved. An engine check walks to all 170 targets in towns, wild areas and buildings: all reachable |
| P-19 | blocker | Battle | Press a hero and drag (mouse, and touch where the image takes the gesture) | The browser started a native drag of the sprite image and swallowed the rest of the gesture, so dragging from the body did nothing → images never start a native drag (global `img` rule) | 8a/battle-hiring/phone-002-2-drag-ghost-line.png | fixed |
| P-20 | major | Battle | Drag a hero slowly across its own body or an ally | The rest timer opened the radial on whatever unit the finger passed (even the dragged hero) → it opens only when the finger rests still for 260 ms on another unit | 8a/battle-hiring/phone-004-4-radial-under-thumb.png | fixed |
| P-21 | major | Battle | Win any fight on the phone | The victory card was pushed off the right edge (its entrance animation replaced the centring transform) → its own animation keeps the centring | 8a/battle-hiring/phone-007-7-victory-hp.png | fixed |
| P-22 | minor | Battle | Drag onto an ally at full HP | "+0" heal previews → hidden | 8a/battle-hiring/desktop-004-4-radial-under-thumb.png | fixed |
| P-24 | minor | Guild Hall | Rest from the hall's rest panel | The panel stayed open over the lot, so what changed was hidden → it closes after resting | 8a/guild-hall-rooms/phone-006-4-built.png | fixed |
| P-25 | minor | Defeat | Lose a fight and accept defeat | The first defeat card used the construction ceremony (sparkle burst) and borrowed tavern art → a calm card of its own; the backdrop is a placeholder until `scene.defeat` is drawn | 8a/guild-hall-rooms/phone-023-11-defeat-moment.png | fixed |
| P-26 | minor | Scenes | Load a save while a town scene is mounting (desktop) | "Walkable scene failed to load" (the scene was gone before Phaser arrived) → nothing is built when the scene has already unmounted | 8a/guild-hall-rooms/desktop.log | fixed |
| P-27 | minor | Town events | "An argument" (week card) | The quote card shows only "Rowan Vale and Cassia Hollow", not what they argue about | 8a/guild-hall-rooms/phone-005-card-event.png | not a text bug: the screenshot caught the line mid-typewriter. Fixed what it showed: the name plate said "Rowan Vale" for a narration line; town events now name the town crier and a hero only lends the portrait |
| P-28 | major | Painted scenes | Tap a door bubble or a person on the painting | touch.css scales every pressed button, which replaced their centring transform: the bubble jumped off the finger between press and release, so the tap never landed → the transform is inline (bubbles) or kept in the pressed style (people) | 8a/playtest-1-feedback/phone-003-3-door-bubble.png | fixed |
| P-29 | minor | Painted interiors | Enter the tavern on a phone | Cover-fit shows about a fifth of the painting's width; recruits at the side tables are off screen with nothing saying so → arrows at the edges while there is more painting that way (a swipe pans too) | 8a/playtest-1-feedback/phone-town-002-6-tavern-painted.png | fixed |
| P-30 | major | Walking | Enter the Old Road after a contract was taken | The founder appeared at their town coordinates (the shared scene controller still belonged to the town when the wild area mounted) → only a rebuild of the same scene keeps the position | 8a/missions-in-world/phone-a-005-a5-old-road-objectives.png | fixed |
| P-31 | minor | Doors | Tap the town's Notice Board | It asked "Inspect Notice Board" in a door bubble → bubbles only for real doors (Enter) and exits | 8a/missions-in-world/phone-a-002-a2-notice-board.png | fixed |
| P-32 | minor | Site fights | Win a contract fight | The battle's old result card showed before the victory screen → site fights go straight from "Victory" to the one screen; a site wipe offers Retry battle and Accept defeat like the wild | 8a/missions-in-world/phone-a-007-a7-contract-done.png | fixed |
| P-33 | minor | Arena | The sign-up desk's other tournaments in June | Events earlier in the year (Deepforge Brawl, Gale Games) showed this year's date as "(today)" → an event whose week has gone by points to next year | 8a/tournaments-circuits/desktop-003-3-signup-team.png | fixed |
| P-34 | minor | Arena | A tournament bout won | The battle's result card, then the victory screen (two screens) → tournament bouts go straight from "Victory" to the one screen | 8a/tournaments-circuits/phone-007-7-bout-result.png | fixed |
| P-35 | cosmetic | Arena | The fighting ground | The two-hero team showed in grey boxes and the opponent had no status → a team card with portraits and the opposing guild's circuit | 8a/tournaments-circuits/phone-008-7b-after-bout.png | fixed |
| P-23 | minor | Recruits | The recruit card | Ranges with decimals ("57.25–87.25"); some recruits show potential below power (e.g. 72–80 power, 70–78 potential) → rounded; the potential oddity goes to the balance step | 8a/battle-hiring/phone-010-12-recruit-card-after-skills.png | fixed: rounding, and the potential range never shows below power (checked on 2,560 recruit cards; the true values stay inside) |

**Spec notes:**
- battle-hiring: "Knocked out in a battle the party wins: 1 HP and injured (1 week)". A hero knocked out in a lost fight also ends at 1 HP; what happens next is the defeat rule in guild-hall-rooms.md. HP recovery: +6 health a day at home and full MP (data: `VITALS` in src/data/activities.js); camps, inns and the hall rest also restore MP. The big name cards are gone entirely (the plates under the units carry HP, MP and statuses).
- tournaments-circuits, choices made where the spec was open or met the code:
  - **The new events' data** (names, descriptions, trophies, histories) live in `src/data/tournaments.js` with the whole calendar, not in `src/data/universe.js` as the spec says: one file for the circuits, the 15 events, the special titles and the status names. The old definition arrays in universe.js are gone.
  - **Internal ids stay** Regional/National/Global (locations, rivals, ladders); players see Initiation/Champion/Elite everywhere through `TIERS[i].name` and `statusName()`. Status titles are Unknown → Contender → Initiation Power → Champion Power → Elite Power.
  - **Entry rules** are fame, battles won and status; the old hero-level rule is gone with individual events. The team is any 1 to the circuit's size of the guild's fit heroes; both sides field the same number in a bout.
  - **Giant Killer** counts any bout (the player's or two rivals') where the winner's status is two tiers below the loser's. The Argent Crown starts with **Dynasty** (its nine Crownfall titles) as the spec suggests.
  - **Titles show** in the Crown Room (with its trophies), Records → Record book (all seven, held ones in gold) and the season review ("Special titles" when one was earned that year).
  - **Removed:** individual tournaments (sign-up of one hero, hero brackets, `enterTournament`, `beginHeroTournamentCombat`), the separate guild championships (`state.guildTournaments`, `enterGuildTournament`, `GuildChampionships.jsx`, the slice's `guildChampionships` flag), "Most individual titles" (now "Most tournament titles"), and the stats `individualTournamentWins`/`guildTournamentWins` (now `tournamentsWon`).
- missions-in-world, choices made where the spec was open or met the code:
  - **Three kinds of place:** the wild area by the town (Dunmere: the Old Road; Greenhollow: the Thornwood edge; the Blackwood for its own contract), the **town's own streets** for talk-heavy jobs (political, investigation, diplomacy, intrigue), and a **painted site behind a door in town** where a town has no wild area (Ironford: the slag pits and the archive vault; Windmere: the cliff path). Objectives stand on free tiles picked by a reachability script (`places.js`).
  - **Contract templates** keep their content in `src/data/content.js`; their sites are in `src/data/missions/`: hand-made for the 8 Regional templates and the Chapter 1 story contracts, built by family for the rest (National and Global ones are outside the slice).
  - **Story contracts finish on the spot** (no report back): their next story step is the giver's scene anyway.
  - **Escort** is a follower in the rules, not on screen: talk to start it, then the destination ("Bring Elsa here") finishes it. Fights near the escort are ordinary fights (no protect target yet).
  - **Contract fights** keep the old difficulty scaling (strength 0.65 + 0.09 × risk; the first story fight is gentle), with the site's own enemies; a raised alarm makes them 20% harder.
  - **The grade** has four steps (Partial, Success, Great, Legendary as one to four stars) from extras, knockouts, corners cut in talk and days; days count calendar days, and walking on site takes none (time moves only through travel, camping and resting, as the spec says).
  - **The party bar is gone** with the party builder; the Guild Hall has its own hero strip, and Party → Main party picks who travels.
  - **Removed:** the old launch and its weeks, key-moment decisions (`pendingDecisions`), the Diplomacy / Expedition / Intrigue mini-games (`missionGames.js`, `MissionGameModal`), mission reports and simulated outcomes (`resolveDecision`), `launchExpedition`, `activeMissions`, the "on mission" hero status, the party builder and `PartyRail`. Their lines did not carry over: the site talk is written fresh, short and in the dialogue style.
  - **Autoplay** now plays contracts like a person (accept, objectives in order, report), so the balance step measures the real loop.
- playtest-1-feedback, choices made:
  - **The paintings are 3/4 views**, not front-facing as the spec says, so people stand on the floor of the painting (their feet at the spot) rather than in a line; each town's inn and arena painting has its own spot positions (`towns` in interiors.js). The notice board's painting stays behind its section (it is a list, not a room).
  - **Cover-fit on a phone** keeps the full height and pans sideways (a 1280×576 painting at 844 px tall is 1875 px wide); it starts centred on the keeper.
  - **The prologue house** is a painted scene now too (no walking to the door), which also settles P-1.
  - **One screen per fight:** for wild and road fights the battle screen's own result card is skipped (the word "Victory", then the moment). Contract, tournament, challenge and duel wins keep the battle's result card until missions-in-world and tournaments-circuits replace their flows. The "Mission complete" screen is built (`missionComplete` moment) and missions-in-world uses it.
- guild-hall-rooms, choices made where the spec was open or met the code:
  - **Rooms hold heroes; tasks stay for the rest.** Training rooms (one hero) and infirmaries (one patient) hold heroes by `room.heroId`; a hero in no room keeps a monthly task (Rest, Scouting, Public Exhibition, Guild Duty). The Training and Infirmary tasks, drills (`hero.training`) and "send all idle heroes" are gone.
  - **Training is weekly:** a quarter of the month's gain each week (so resting days or weeks is pro-rated), plus 2 XP a week. Upgrading a training room's tier is "upgrading its equipment"; swapping the equipment type costs the tier's swap price, half back.
  - **Normal injuries take 1 week** everywhere (missions, road events, town events, a knockout in a won fight). An injured hero in an infirmary bed ends the week at full HP; elsewhere at 60 HP.
  - **The defeat rule** applies to wild-area and road fights now; contract defeats move to it with missions-in-world. Weeks by infirmary tier: none or Basic 4, Advanced 3, State of the art 2; treatment 30 a hero (−25% / −50%), transport 10 a day of travel home; what can't be paid becomes debt (added to the loan). "Retreat to camp" became **Accept defeat** next to **Retry battle**. "Cures lingering statuses" has nothing to cure yet (no lingering statuses exist).
  - **Fame from wins needs a Crown Room:** a guild championship win now pays prize, points and legacy but no fame at once; the trophy is counted in `guild.trophies` and gives fame monthly only with a Crown Room (2 per trophy, +0.5 per repeat, at most 4 per trophy; +50% at Advanced). Individual tournaments are removed by tournaments-circuits, so they were not changed.
  - **Armory:** 5/10/15% off by tier; gear upgrades need Advanced (one step) and State of the art climbs two steps in one upgrade. **Scout table:** Basic narrows ranges by one level in talk, Advanced brings rumors of rare recruits, State of the art shows exact stats and potential. "See rival teams before tournament bouts" waits for tournaments-circuits. **Treasury:** Basic shows the room-by-room costs and a higher loan limit; +1%/+2% interest; cheaper loans at State of the art.
  - **Crown Room, State of the art (visitors):** +0.1 on the recruit quality roll and +25% patron standing gains (data: `VISITORS`).
  - **The War room is gone:** Party → Main party holds the main party and the saved formations (`MainPartyScreen`); saving a formation needs no room.
  - **The Office** (appointments) has no slot: it opens from the hall's **Office** button.
  - **The diorama** is placeholder shapes for now: tiles by room type (icon, tier pips, colour), bedrooms show two beds, rooms with a hero show the portrait (greyed for a patient). Silhouette poses (`hall.pose.*`) and per-tier tile art are registered in ASSETS.md for later.
- The spec asks for "guild name" on the new game screen; the founding moved to the banner on purpose (earlier user decision), so the new game screen keeps name, class, Begin and the skip box. Not changed.
- Records' first view counts 94 words: almost all are the 13 guild names of the ladder (a list, one line each).

## Balance

Measured with engine scripts (scratch, not committed) and `npm run sim`. Before and after numbers go here.

**Measured (2026-11-04, after the three specs; seed 31 unless noted):**

| What | Number |
|---|---|
| Gold at the start (and after Skip tutorial) | 720 |
| Monthly upkeep at the start | 58: wages 13 (Nessa), lease 35, one Basic bedroom 10 |
| Regional contracts (pay, difficulty, risk) | Missing Apothecary 192 (43, 1) · Miller's Daughter 207 (40, 1) · Wolves on the Old Road 223 (53, 1) · Fog Ferry 284 (54, 2) · Harvest Melee prep 285 (55, 1) · Baron's Tithe 303 (52, 2) · Hollow Bell 374 (62, 2) · Blackwood Lanterns 450 (66, 3) |
| Story contract, mission 3 (P-16) | 498 for about a week |
| Rooms, Basic build / monthly upkeep | bedroom 260/10 · treasury 220/6 · training 300/12 · infirmary 340/14 · scout table 340/10 · armory 420/12 · Crown Room 480/10 (Advanced and State of the art about ×1.7 and ×2.8) |
| Recruits on the market | signing fee 185 (level 1) to 1,091 (level 7); wages 21–80 a month |
| Initiation tournaments | entry 35–55, purse 240–380 |
| Autoplay, one year, five seeds (old code → now) | contracts won 9/12/10/9/9 → 9/6/10/10/6; gold at the end 694/1962/2070/1383/1789 → 75/407/2248/1019/735. Same heroes and spending pattern: the spread is the contract board and rewards drawn differently, not a stall |

**What it says:** one Regional contract pays three to eight months of the starting upkeep, and a person can finish one in a few days of game time, so gold stops mattering after the first two or three contracts. Rooms and recruits are the only sinks; autoplay ends the year with 75 to 2,248 gold because it spends on rooms as soon as it can.

**Not tuned yet, and why:** no target is written down (gold per hour, when the hall should be full, when the guild should afford its third hero, the slice's 2–3 hours), and CLAUDE.md defers tuning until after the final wave. Proposals to pick from, all data-only:
1. Contract pay ×0.6 (Regional 115–270; mission 3 down to about 300), so a contract pays one to five months of upkeep.
2. Or keep pay and raise the sinks: lease 35 → 60, room upkeep ×1.5, wages ×1.5.
3. The Blackwood contract at Ironford (the one lost fight in 32 engine runs) and the slag pits: enemy strength from risk 3 is a step above the rest; lower its strength factor or its group size by one.
4. Autoplay keeps a reserve (two months of upkeep plus a recruit fee) before building, so the year-end gold measures the economy and not the build order.

## Answers (sections A–E)

To be filled in during Stage 1 and confirmed in Stage 3. **Open question:** the questions of sections A–E are not written in any doc in the repo (they came with an earlier prompt); add them here so Stage 3 can answer them.

## Final checklist

To be filled in during Stage 3.
