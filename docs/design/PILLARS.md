# The three pillars — design

The game rests on three things a player can chase, each with its own score and screens, all
feeding the same world:

1. **Standing**: who you are. Fame (how known), plus **Honor** (good ↔ evil) and **Dread**
   (how feared), earned through the choices you make on contracts and in the story. Standing
   changes how people and rival guilds treat you.
2. **The circuit**: how good you are. Tournaments, the ladders and the road from an unknown
   banner in Dunmere to champion of the world, told like a medieval sports paper.
3. **The Last Banner**: why it matters. The main story (`docs/STORY.md`), with choices that
   carry real consequences and rewards.

Fame is the bridge: missions and tournaments both raise it, tournaments need it to enter, and
the story is gated on it in places.

This file is the design. What already exists in code is noted under **Today**; everything else
is to build. Waves at the end give the order.

---

## Pillar 1 — Standing: fame, honor and dread

### Today
- Fame and legacy are plain numbers (`state.guild.fame`, `legacy`).
- Reputation by contract family (Combat, Diplomacy, Expedition, Intrigue) and by region, with levels and perks (`reputation.js`), and a specialization title.
- Charters, patrons (trade, temple, smiths) and run paths (richest, connected, strongest, legendary).
- **No alignment, no dread.** 28 contract templates carry an old, unused `choice` block (`content.js`, with `tag: mercy|truth|bold|honor`). Nothing resolves it.
- Rival guilds have no element or alignment of their own (only their star hero has a primal); `hostility` and `relationship` exist but are never read. Rivalry only ever goes up.

### The two new axes
| Axis | Range | Meaning | Shown as |
|---|---|---|---|
| **Honor** | −100 … +100 | Good (keeps its word, merciful, lawful) ↔ evil (cruel, greedy, treacherous) | A needle on a balance, gold to blood-red |
| **Dread** | 0 … 100 | How much people fear the banner, whatever its honor | A row of five marks (skulls on the evil side, iron gauntlets on the good) |

Both move slowly and decay a little toward the middle each season if left alone (a guild is
what it has done lately). They live in `state.guild.standing = { honor, dread, log: [] }`; the
log keeps the last deeds (`{ day, text, honor, dread }`) for the Guild screen.

**The standing name** comes from the pair (shown under the guild's name, and used by NPCs):

| | Low dread (0–33) | Some dread (34–66) | High dread (67–100) |
|---|---|---|---|
| **Honorable** (+34…) | The Kind Banner | Wardens | Iron Saints |
| **Neutral** | Sellswords | Hard Company | The Grim Company |
| **Wicked** (…−34) | Swindlers | Cutthroats | Butchers of the Road |

### Where it comes from: verdicts
A **verdict** is a short choice at a decisive moment, usually when a contract is done (before the
reward), sometimes mid-site. Data-driven, in `src/data/verdicts.js`, attached to contract families,
templates or story steps. Each option has effects: `{ honor, dread, gold, fame, reputation, patron, relationship, flag, item }`.

The example, *the thief begs for pardon* (bounty contracts):

| Option | Honor | Dread | Also |
|---|---|---|---|
| Cut off his hand and leave him | −15 | +12 | the watch frowns (Dunmere region −) |
| Hand him to the watch | +8 | +4 | bounty paid in full; watch captain +1 |
| Let him go for his purse | −6 | 0 | +gold now; he may turn up later as an informant (flag) |
| Let him go, no price | +10 | −4 | temple patron +; he may come back to join (rare recruit) |

More verdicts (a starting set of about 12, two or three per family): the bandit who surrenders,
the merchant who can't pay, the rival's injured fighter after a bout, the bribe to throw a
tournament bout, the forged ledger you could sell, the deserter, the poisoned well, the village
that hid the outlaws. Story choices get honor/dread too (Pillar 3).

Smaller sources: fleeing a fight you started (dread −), finishing off yielded foes (honor −,
dread +), paying wages late (honor −), winning a tournament cleanly against the odds (fame,
no change), giving to the temple (honor +).

### What it changes
- **Contracts.** Petitioners choose by standing: temple folk and villagers avoid wicked guilds;
  smugglers, nobles with dirty work and the Intrigue family seek them. Some contracts need a
  standing (e.g. *protect the abbess* needs honor ≥ 20; *collect the debt* pays more with
  dread ≥ 50).
- **People.** Dialogue openers and prices branch on the standing name (new condition keys
  `honorAtLeast`, `honorBelow`, `dreadAtLeast`, `standing`). High dread: some people won't
  talk, some talk faster (cheaper information, lower rents); wicked: shops charge more, the
  watch asks for bribes.
- **Recruits.** A candidate's personality reacts: Honorable and Merciful heroes refuse wicked
  guilds (an `objection`, as patrons do now), Jealous and Restless ones like dread; heroes
  already in the guild lose or gain loyalty after verdicts they disagree with.
- **Fights.** With high dread, outlaw bands sometimes yield before the fight (no XP, half the
  gold) or flee in the first round.
- **Patrons.** Temple likes honor, Trade doesn't care, the Smiths respect dread.

### Rivals: element and creed
Every rival guild gets an **element** (`primal`, from its star and home town) and a **creed**
(`honor`, `dread` like the player's, fixed by its archetype and drifting with its deeds in the
simulation). The Argent Crown: Iron, wicked, high dread.

A rivalry then has a **temper** as well as a score:
- **Affinity** at the start = element (a guild whose element beats yours, or that yours beats,
  is a natural rival) + creed distance (an honorable guild and a wicked one grate).
- Events push the score as today, but bouts and contracts between opposed creeds count double.
- **Nemeses** are the top rivals by score, weighted by affinity, so they emerge naturally: the
  wicked Iron guild that keeps taking your contracts.
- Rivals act on it: an opposed creed undercuts you on contracts and sends challenges; a close
  creed may offer an alliance (shared contracts, a joint exhibition), which the player can
  accept or refuse.

### Where the player sees it
- **Guild → Standing** (a new tab): the honor needle and dread marks, the standing name, the
  last ten deeds, and what the standing is doing ("Temple petitioners avoid you").
- After a verdict, a small moment: the choice, and the needle moving.
- Rival cards (Herald, Rivals) show element and creed.

---

## Pillar 2 — The circuit: tournaments and the sports desk

### Today
- 15 events a year in three circuits: Initiation (8 events, teams of 2), Champion (4, teams of 4),
  Elite (3, teams of 5). An 8-guild bracket each: quarterfinal, semifinal, final. The player's bouts are real
  team battles; the rest is simulated on ratings.
- History: `tournamentHistory` (every edition: champion, entrants, bracket with each bout's
  winner and combat summary, the player's finish and team), `titleRecords` (winners by year,
  record holder, wins by guild), `tournamentWins`, the official ledger, `seasons[year]` with guild
  and per-hero totals, `records`, a head-to-head panel, hero careers (bouts, bout wins, titles).
- Screens: Arena (sign-up, the bouts, a history board), Rankings (ladders, legends, record book,
  hall of fame), History (season reviews, mission log, ladder history, head-to-head, careers),
  the Crown Room (trophies). The Guild screen has nothing on tournaments.
- Missing: no record of each guild's results *at each tournament*, no per-year line for the
  guild, no meetings between two guilds per tournament, hero career fields `runnerUps`,
  `semifinals`, `titleWins` never written.

### The ladder to champion of the world
- **Status** climbs Initiation → Champion → Elite on official points (the rolling ledger), as
  now. Each circuit's events need a status and fame to enter.
- **Champion of the world** is the World Conclave Championship (Elite, the last event of the year).
  Winning it gives the title *Master of the World* for that year; the record book counts them.
- Each year ends with **the Grand Table**: every guild's points, titles and finishes, and the
  movers (the season review, rebuilt as a sports paper's year-end issue).

### The records to keep (data)
One new record, `state.circuit`, built as results come in, so every screen is a read model:
- `byTournament[defId][guildId] = { entries, bouts, boutWins, finals, titles, bestFinish, years: { [year]: finish } }`
- `meetings[guildA|guildB] = [{ year, defId, round, winnerId, method }]` (every bout between two guilds, AI ones too: the bracket already has them)
- `guildYears[guildId][year] = { entries, bouts, boutWins, titles, finals, points }`, for the player and every rival
- hero careers: fill `semifinals`, `runnerUps`, `titleWins`, and add `byYear`

### How it reads: The Herald's Gazette
The tone is a medieval sports broadsheet: ink on parchment, a masthead, columns, woodcut-style
icons, numbers in tables. The same style everywhere tournaments are shown.

- **The Gazette** (at the Herald, and in Journal → News): one issue per month. A front-page
  headline from the biggest result ("WOLFSBANE TAKE THE THORN CUP: Argent Crown out in the
  semis"), the standings table, *form guides* (last five bouts: W W L W L), the next events, a
  column on a rising guild, and your own results when you played.
- **Our record** (Guild → Record, new tab): the guild's line by year, as you described:

  | Year | Tournaments | Bouts | Won | % | Titles | Best |
  |---|---|---|---|---|---|---|
  | 1187 | 3 | 4 | 1 | 25% | 0 | semifinal |
  | 1188 | 5 | 11 | 7 | 64% | 1 | champion |

  plus the totals, the best and worst opponents (head-to-head), and each hero's tournament line.
- **At each arena, the Roll of Champions** (the arena's board): winners by year (vacated ones
  struck through), the guild with most titles, the record holder, the longest streak, the
  biggest upset, and *you here*: your finishes at this event year by year.
- **Before a bout, the tale of the tape**: both teams, levels and elements, the two guilds'
  meetings, their form, the seeds, and the bookmakers' odds (the rating chance, as odds).
- **After a tournament**: the bracket drawn as a broadsheet, with your path through it.
- **Rival cards** link to their year-by-year line and your meetings.

---

## Pillar 3 — The Last Banner: a story with consequences

### Today
- `docs/STORY.md` is the story, written by the author. Chapter 1 = prologue + missions m1–m8
  (with the Ash Abbot mission between m3 and m4) is built; m9–m12 are stubs (Chapter 2).
- Choices are stored (`story.choices`: prologue, bram, warning, m7, nessa, wren, wrenOutcome);
  some change routes (charter-gated approaches), skip steps or unlock a recruit (Bram, Wren);
  `warning` and `nessa` only change the end text. Rewards are fixed per mission. Evidence
  (5 items in Chapter 1) gates m8 and later the endings. One chapter ending; path scores only
  name a title.

### Rules for the story from here
1. **Every story choice has a consequence the player can name.** Each one goes into a
   *consequence ledger* (`story.ledger`: `{ choice, effect, when }`), shown in the Journal under
   Quests → "What you chose", with a line on what came of it once it lands ("You spared the
   enforcer. He testified for you at Ironford.").
2. **Choices also move standing** (Pillar 1). Story verdicts carry honor and dread, so the story
   shapes who the guild is.
3. **Rewards follow choices.** Each mission has a base reward and a choice reward: a different
   story hero, relic, patron favour, contract line or title. Example: m6, the ledger: force the
   archive (dread +, the Smiths' respect, a forged-steel relic) / talk the council round (honor +,
   a council seat later) / buy it (gold −, the Trade House owes you).
4. **Later content reads earlier choices.** Each Act II mission has at least one scene that
   changes with an Act I choice, and the Chapter 2 endings read the evidence, the choices and the
   standing: an honorable guild can expose the Crown in court; a dreaded one can break it by
   force; a wicked one can take its place (a darker Ending C).
5. **The story uses the other two pillars**, not a corridor beside them. Garrick Thorne and the
   Argent Crown are a real rival on the circuit (element Iron, wicked creed, the natural
   nemesis); the Crownfall Tournament is a real event; some story gates are standing or
   circuit results ("reach the Crownfall semifinal", "honor ≥ 30 or dread ≥ 60").
6. **Chapter endings branch.** Chapter 1 ends with one of three short epilogues by standing name
   and the path score, then the Wren cliffhanger.

### What each Chapter 1 mission gets (to write with the author)
| Mission | Choice to add or deepen | Consequence |
|---|---|---|
| Prologue | already four options | add honor/dread: hide the body (dread +), flee (honor −) |
| m3 Wolfskins | verdict on the handler (spare, hang, recruit) | spare: an informant in m6; hang: dread +, Old Road bands yield sooner |
| Ash Abbot | Malric yields: mercy, the temple's justice, or the sword | mercy: the temple patron and a healer; sword: dread +, temple cold |
| m4 Harvest Melee | Bram's challenge: accept fairly or fight dirty | dirty: honor −, Bram never joins, Thorne's man notices you |
| m5 Herbalist | protect Maren openly or move her by night | sets who knows about her in m8 |
| m6 Ledger | route already branches | each route a different reward and standing move (table above) |
| m7 Halden Marsh | duel or confession (exists) | duel: fame; confession: evidence and an ally in Chapter 2 |
| m8 Wren | return or let him go (exists) | Wren joins, or a letter in Chapter 2; ending epilogue by standing |

New story text is the author's; agents draft only with the author's say-so (`docs/DIALOGUE.md`).

---

## Waves (the order to build)

1. **Standing core.** `guild.standing`, the condition keys, verdicts data and the verdict moment
   after contracts (about 12 verdicts), the Guild → Standing tab, honor/dread on the prologue.
2. **Standing in the world.** Petitioner filters and contract requirements, prices and dialogue
   openers by standing, recruit objections and loyalty reactions, dread making bands yield.
3. **Rivals with a creed.** Element and creed on every rival, rivalry temper and nemesis
   weighting, opposed creeds undercutting, alliances.
4. **The sports desk data.** `state.circuit` (by tournament, meetings, guild years), hero career
   fields, filled from every bracket (player and AI).
5. **The Gazette and the records.** Guild → Record, the arena's Roll of Champions, the tale of the
   tape, the bracket sheet, the monthly Gazette, the year-end Grand Table, in the broadsheet style.
6. **The story ledger.** `story.ledger`, the Journal's "What you chose", choice rewards and
   standing moves for Chapter 1, the branching chapter epilogue (text from the author).

Waves 1, 4 and 6 don't depend on each other; 2 needs 1, 3 needs 1, 5 needs 4.

## Decisions (the author, 2026-11-13)
- Honor and dread **fade** toward the middle over time.
- Wicked play is **its own path with its own darker ending** (Ending C): not harder overall, with harder and easier parts (`VERDICTS.md`, the darker path).
- Verdict scenes: a first draft by an agent, adjusted by the author: [`VERDICTS.md`](VERDICTS.md).

- **The standing is an epithet the guild earns**, not a replacement name: a prefix or a "the
  … guild of" form, from the grid's cell ("the feared guild of the New Lantern", "Honourable New
  Lantern"). It changes once the guild is clearly past a line (a margin of 6 points), so it never
  flickers. Neutral in both earns no epithet.
- Items: equipment and inventory (goods, keepsakes, drops, items in missions): [`ITEMS.md`](ITEMS.md).
- Levels run to about 53 (cap 60); the top guilds are 45–50 (`STORY_DRAFT.md`, Levels).
- The main story draft (four chapters, primary and secondary missions in the Journal, mission
  types, the turn and the two paths): [`STORY_DRAFT.md`](STORY_DRAFT.md).
