# Chapter 1 playthrough (Phase 8A)

The running log for Phase 8A (docs/PROJECT_PLAN.md): every issue found while playing Chapter 1 by touch (390×844, iPhone profile) and with a mouse (1440×900), its fix, and the proof. Any session picks up from **Where we are**.

Screenshots: `docs/screenshots/8a/` (issues and verification) and `docs/screenshots/clarity/` (the clarity spec, before and after).

## Where we are

| Step | Status |
|---|---|
| Spec: clarity-navigation | **done** (session 1) |
| Stage 1: play and log | not started |
| Spec: battle-hiring | not started |
| Spec: guild-hall-rooms | not started |
| Autoplay update and balance | not started |
| Stage 2: fix the log | not started |
| Stage 3: replay and verify | not started |

### Session notes
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

**Spec notes:**
- The spec asks for "guild name" on the new game screen; the founding moved to the banner on purpose (earlier user decision), so the new game screen keeps name, class, Begin and the skip box. Not changed.
- Records' first view counts 94 words: almost all are the 13 guild names of the ladder (a list, one line each).

## Balance

Measured with engine scripts (scratch, not committed) and `npm run sim`. Before and after numbers go here.

## Answers (sections A–E)

To be filled in during Stage 1 and confirmed in Stage 3.

## Final checklist

To be filled in during Stage 3.
