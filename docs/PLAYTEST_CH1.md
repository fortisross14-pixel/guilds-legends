# Chapter 1 playthrough (Phase 8A)

The running log for Phase 8A (docs/PROJECT_PLAN.md): every issue found while playing Chapter 1 by touch (390×844, iPhone profile) and with a mouse (1440×900), its fix, and the proof. Any session picks up from **Where we are**.

Screenshots: `docs/screenshots/8a/` (issues and verification) and `docs/screenshots/clarity/` (the clarity spec, before and after).

## Where we are

| Step | Status |
|---|---|
| Spec: clarity-navigation | **done** (session 1) |
| Stage 1: play and log | in progress: tutorial path on the phone through mission 3's contract (P-1…P-17). Blockers on the way were fixed at once so play could go on |
| Spec: battle-hiring | **done** (session 2; proof in `docs/screenshots/8a/battle-hiring/`) |
| Spec: guild-hall-rooms | not started |
| Spec: missions-in-world | not started (owns P-9, P-12, P-15, the mission-game modals, decision cards and reports) |
| Spec: tournaments-circuits | not started |
| Autoplay update and balance | not started (owns P-16) |
| Stage 2: fix the log | ongoing (fixes land as they are found) |
| Stage 3: replay and verify | not started |

**Order of work** (each spec changes what the playthrough sees, so build before replaying):
1. Finish Stage 1 for what no spec replaces: every town, building, NPC and conversation; hiring; Party, Items, the hero page; the hall and resting; travel; the wild areas; the arena sign-up; menus and save/load; the desktop size.
2. battle-hiring → guild-hall-rooms (rooms, infirmary, the defeat rule) → missions-in-world (needs the defeat rule) → tournaments-circuits.
3. Autoplay that plays like a person, then balance with data only.
4. Stage 3: replay both paths at both sizes; verify every entry.

**Play driver** (scratch, not committed): Playwright scripts with helpers for a new game, the prologue, the goal line, dialogue (ask every topic, then decide), cards, fights (Auto) and the board. They read `window.gol_state_text()` (App.jsx, a test hook with the place, the open section, the interruption, the date, gold, heroes and the story step) and the scene's `window.render_game_to_text()`. Note: tapping the dialogue box needs a forced click (Playwright never sees the full-screen layer as stable).

### Session notes
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
| P-1 | minor | Prologue | Knock lines, then tap the front door | The door is off screen; the founder walks ~7.5 s to it, the first thing the player does → the door closer to the start, or a faster first walk | 8a/phone-s1-005-after-door-tap.png | open |
| P-2 | minor | Founding card | Raise the banner | Four long charter cards (pitch, 3 modifiers, path) on one scroll; the banner relic is a placeholder → compact cards, details on tap | 8a/phone-s1-007-founding-card.png | open |
| P-3 | major | Dunmere | Arrive in town | Edge labels overlap: Gideon Rusk's pointer label sits on Orren Pike's → labels are placed by priority (quest beacons, the near target, the rest); one that would overlap a placed label fades, like labels under the HUD | 8a/phone-s1-009-town-arrival.png | fixed |
| P-4 | major | Moments | Mission 1: pay the rent | The card said "Construction complete", repeated its title, showed the grand-hall art, read "now a empty hall", and its Continue button was cut off → its own heading, the cabin art, no stage badge, a smaller headline and art on phones | 8a/phone-s2-002-story-m2.png → phone-s2-003-interruption-moment.png | fixed |
| P-5 | major | Interruptions | Any choice that queues a card while a conversation is open | The card opened over the open dialogue, hiding its reply → while a conversation is open, queued cards (moments, events, reports, story scenes) wait; fights and decisions can still interrupt | 8a/phone-s2-002-story-m2.png | fixed |
| P-6 | major | Interiors | Mission 2: enter the Wayfarer | No goal line inside buildings (Mara has a "!", nothing says to talk to her) → the goal line shows inside too: tap to walk to the story person, or to head out when the step is elsewhere | 8a/phone-s2-004-stuck.png | fixed |
| P-7 | minor | People | The Wayfarer, first visit | Two "Joren" and two "Ulric" in one room → generated visitors take unused first names; recruits who share one show an initial | 8a/phone-s2-004-stuck.png | fixed |
| P-8 | blocker | Cards | Mission 2: Nessa joins (also every town event and road event) | The quote card reused the \`.dialogue\` class, which is now the full-screen conversation layer: dark ink on dark, the name plate over the badges, and an invisible layer over the Close button (it could not be tapped) → the card has its own \`quote-card\` classes | 8a/phone-s2-006-interruption-moment.png → phone-s2-010-interruption-road.png | fixed |
| P-9 | major | Notice board | Mission 3: the board with one contract | A family filter for one contract, the contract twice (card and detail), "Hide intelligence", a difficulty grid, a formation picker and long help → a compact list; tap a contract for one panel with the party slots and Send | 8a/phone-s2-008-section-noticeBoard-.png | open |
| P-10 | minor | Notices | Any notice while a section is open | It covered the section title → it sits over the help line at the bottom left (the help line steps aside) | 8a/phone-s2-008-section-noticeBoard-.png | fixed |
| P-11 | minor | Party bar | Notice board → party bar | A "Quest log" button with no action (dead) → removed | 8a/phone-s2-008-section-noticeBoard-.png | fixed |
| P-12 | minor | Road events | Send the Old Road contract | "On the road to Dunmere" while leaving Dunmere; "Use them in battle with the Item command" (no such command now) | 8a/phone-s2-010-interruption-road.png | open |
| P-13 | major | Battle | Mission 3 fight | "Wolves on the Old Road" fields a boar called "Renegade Priest A" and a skeleton "Shield Thug B"; the hint says "Drag a hero onto a wolf" → wolves, named as wolves | 8a/phone-s2-012-battle-start.png | open |
| P-14 | major | Battle | Any fight on the phone | The first-fight hint box covers the turn order and the tell; heroes are small at the bottom; instruction text in the command panel; big name cards → the battle-hiring spec | 8a/phone-s2-012-battle-start.png | fixed |
| P-15 | minor | Reports | Mission 3 report | "Nessa Thornfield return wounded" (grammar); "Legendary" for a risk-1 job; a long report → fix the verb; shorter report | 8a/phone-s2-016-interruption-report.png | open |
| P-16 | major | Balance | Mission 3 | The first contract pays 498 gold (560 → 1003) for one week → the balance pass | 8a/phone-s2-016-interruption-report.png | open (balance) |
| P-17 | minor | Combat | Mission 3, won at 97% | Nessa ends the fight hurt and comes back injured after a 3-round win | 8a/phone-s2-013-battle-result.png | fixed: HP and MP now carry over; a knockout in a won fight is 1 HP and 1 week injured (the random mission injury goes with missions-in-world) |
| P-18 | major | Old Road | Tap "Bandit lookouts" (desktop and phone) | No route to the group: the founder never moves and no fight starts → check the layout (group at [24,4]) in the wild-area pass | 8a/battle-hiring/desktop.log | open |
| P-19 | blocker | Battle | Press a hero and drag (mouse, and touch where the image takes the gesture) | The browser started a native drag of the sprite image and swallowed the rest of the gesture, so dragging from the body did nothing → images never start a native drag (global `img` rule) | 8a/battle-hiring/phone-002-2-drag-ghost-line.png | fixed |
| P-20 | major | Battle | Drag a hero slowly across its own body or an ally | The rest timer opened the radial on whatever unit the finger passed (even the dragged hero) → it opens only when the finger rests still for 260 ms on another unit | 8a/battle-hiring/phone-004-4-radial-under-thumb.png | fixed |
| P-21 | major | Battle | Win any fight on the phone | The victory card was pushed off the right edge (its entrance animation replaced the centring transform) → its own animation keeps the centring | 8a/battle-hiring/phone-007-7-victory-hp.png | fixed |
| P-22 | minor | Battle | Drag onto an ally at full HP | "+0" heal previews → hidden | 8a/battle-hiring/desktop-004-4-radial-under-thumb.png | fixed |
| P-23 | minor | Recruits | The recruit card | Ranges with decimals ("57.25–87.25"); some recruits show potential below power (e.g. 72–80 power, 70–78 potential) → rounded; the potential oddity goes to the balance step | 8a/battle-hiring/phone-010-12-recruit-card-after-skills.png | fixed (rounding); open (data) |

**Spec notes:**
- battle-hiring: "Knocked out in a battle the party wins: 1 HP and injured (1 week)". A hero knocked out in a lost fight also ends at 1 HP; what happens next is the defeat rule in guild-hall-rooms.md. HP recovery: +6 health a day at home and full MP (data: `VITALS` in src/data/activities.js); camps, inns and the hall rest also restore MP. The big name cards are gone entirely (the plates under the units carry HP, MP and statuses).
- The spec asks for "guild name" on the new game screen; the founding moved to the banner on purpose (earlier user decision), so the new game screen keeps name, class, Begin and the skip box. Not changed.
- Records' first view counts 94 words: almost all are the 13 guild names of the ladder (a list, one line each).

## Balance

Measured with engine scripts (scratch, not committed) and `npm run sim`. Before and after numbers go here.

## Answers (sections A–E)

To be filled in during Stage 1 and confirmed in Stage 3.

## Final checklist

To be filled in during Stage 3.
