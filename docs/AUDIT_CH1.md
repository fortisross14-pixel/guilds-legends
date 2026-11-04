# Chapter 1 audit: balance, clarity, navigation, gaps

Audit of `main` at `d36be1e` (2026-11-04), after Phases 0–7C and the dialogue pass. Balance numbers come from engine scripts on a skipped-tutorial campaign (Guardian founder plus Nessa; 40 seeds for the battle numbers) and from `npm run sim` (3 seeds × 4 years). Clarity and navigation come from the game itself at phone size (390×844).

## 1. Balance

| Area | Measured | Verdict |
|---|---|---|
| Starting gold | 980 gold: 720 base plus **260 from an old objective** ("Seek a Counter-Primal") that completes instantly because the founder and Nessa have different primals | Bug: a leftover from the old goals system |
| Monthly costs at start | 58 gold (wages 13, rent and rooms 45) | Very low |
| Going bankrupt | **17 months** of pure resting before gold drops below 0 | Far too safe: no money pressure at all |
| Contract pay | 137–348 gold per contract (median 224), each taking **1 week** | Too high: one week of work pays about 4 months of costs |
| After the first contract | +264 gold on average | Same |
| Getting rich | ~23 contracts (about 6 months of play) pays for the lot (6,000 gold) | The target was "years of saving"; it's months |
| Later game | The test player gains up to ~3,800 gold a month in year 4 | Money snowballs |
| Levelling | The party gains ~237 XP per contract (~118 each); the level curve is 70 + 30×level | Too fast: level 2 after 1 contract, level 5 after ~5, level 10 after ~17 (~4 months), level 20 after ~1–1.5 years. The story runs 3–5 years, so heroes max out halfway through. |
| First real battle (auto-battle, 2 heroes, low-risk contract) | **36 wins out of 40** (90%) | Fine for a first fight. The scripted tutorial battle can't be lost anyway. |
| Rankings | In all 3 test runs, the guild stays **#13 of 13 regionally for 4 years** | Climbing seems to require tournaments (Official points). The test player never enters tournaments or builds rooms, so this partly reflects it, but strength and legacy alone don't move the guild at all. |
| Work available | After the tutorial, **0 of 5** Dunmere contracts are unlocked (by design, you unlock them by talking to people) | OK if the game points the player to people; otherwise they'll think there's no work |

**Recommended direction for Phase 8** (tune with `npm run sim` after the test player learns to enter tournaments and build rooms):
- Remove the leftover chapter-goal rewards, or move them into the new story and guild tasks.
- Cut early contract pay roughly in half, or raise costs (supplies, wages that grow with level, rent), so money stays tight for the first year.
- Target: the lot purchase takes about 2–3 in-game years of good play.
- Make the level curve steeper (e.g. 100 + 50×level, plus a multiplier after level 10), and lower mission XP, so level 20 comes near the end of Act III.
- Raise early costs so a guild that does nothing goes broke in ~6 months, and a careless one can actually go bankrupt.
- Let Strength and Legacy move the regional rank too, or make tournaments obvious early, so the player sees the guild climb in year 1.

## 2. Clarity (too much text, unclear screens)

Words on screen at phone size:

| Screen | Words | Problems |
|---|---|---|
| Exploring Dunmere | 62 | A toast ("Objective complete: Seek a Counter-Primal…") covers the top of the scene at the start. The goal chip plus the toast plus the place tag take the top third. |
| Party | 299 | Three dropdown filters (class, primal, sort) take the whole first screen for a 2-hero roster. An explanatory paragraph ("A level is visible progress. Rarity controls…"). Hero cards are long. A "Retired & fallen" tab that's empty at the start. |
| Quests | 216 | A setting checkbox ("Show the main quest marker") at the top of the list. A paragraph per mission plus long step sentences. "How this mission opened" adds more. Evidence sits below in the same scroll. |
| Records | **571** | **12 tabs** (Rankings, Seasons, Record book, Hall of fame, Mission log, Almanac, Lore, Bestiary, Goals, Strength, Legacy, Official), plus **7 sub-buttons** inside Rankings (Guild ladders, Hero ladders, Path, Rivals, Reputation, Connections, Directory). The first thing shown is the founding charter, not the ranks. |
| Map | 248 | Text-heavy for a map. |
| System | 281 | Long for save/settings. |
| Ledger (opened) | 288 | Meant to be a quick drop-down of numbers. |
| Items | 114 | OK. |
| New game screen | 175 | Long for "name and class". |
| Save slots | 89 | Each empty slot repeats the same sentence. |

Other clarity issues:
- **Quests vs contracts vs missions:** story missions are in Quests, contracts are on the notice board, and active contracts are… unclear. The player needs one place to see "what my heroes are doing now".
- **Prologue:** on the first line ("THUD. THUD. THUD."), **Skip does nothing** (25 taps stayed on the same line), and the speaker name tag shows as an **empty dark pill**.
- **Toasts** overlap screen content (seen in Party and the field) instead of using the "one interruption at a time" rule.
- **Old systems leaking in:** chapter goals (the Counter-Primal objective), Goals and Bestiary tabs, the almanac. All from the pre-story version of the game.

Target: follow docs/UX.md strictly. One line per item, details on long-press, no explanatory paragraphs, filters hidden behind an icon until the roster is big, settings in System, and no screen over ~80 words on first view.

## 3. Navigation

Current: Guild orb (Party, Items, Guild Hall, Quests, Contacts) and World orb (Map, Calendar, Records, System), the ledger, the goal chip, the walkable town, building interiors, and the notice board.

Problems:
- **Records is a junk drawer** of 12 tabs plus 7 sub-views. Guild identity (charter, reputation, connections/patrons, path) sits in Records, but belongs in Guild. History (seasons, record book, hall of fame, mission log) and the world (almanac, lore, bestiary, directory) are mixed in.
- **No obvious "what's happening now" view:** active contracts, injured heroes, construction and the next tournament are spread across the calendar, quests, the Guild Hall and the notice board.
- **The ledger duplicates Records:** fine if it stays a short summary with links, but at 288 words it's a second Records.
- **"Retired & fallen" in Party** at the start: empty and confusing.

Proposed structure:
- **Guild orb:** Party (heroes, main party), Items, Guild Hall, **Guild** (charter, specialization, reputation, patrons, path, finances), Contacts.
- **World orb:** Map, **Journal** (quests, active contracts and the calendar together: "what's next"), Records (rankings and history only), System.
- **Lore, almanac and bestiary** become a "Codex" tab inside Records, or move to the Herald building.
- **Goals:** remove (they're replaced by story and guild tasks).

## 4. Other gaps

- **Phase 7D Part 2 isn't done:** room types (bedroom, training, infirmary, treasury…), equipment tiers, and the new defeat → infirmary rule (no death from battles).
- **Phase 7B isn't done:** the asset list has no per-asset style notes or generation prompts, and ~260 of 284 images are still placeholders or borrowed.
- **The test player is out of date:** it doesn't enter tournaments, build rooms, talk to people or follow the story, so `npm run sim` can't measure balance yet. Update it before Phase 8 tuning.
- **No music;** sound effects only.
- **Accessibility:** no text-size setting, and no colorblind check for the primal and rarity colors.
- **Testing debt:** tests have been off since Phase 6. Phase 8 must rebuild them (engine rules, save/load, a smoke test of the tutorial).
- **Content depth:** Chapter 1 has 4 towns, 3 wild areas, ~16 enemies and 8 story missions. Fine for a vertical slice, but side content (side jobs, town events) should be checked for repetition after the balance pass.
