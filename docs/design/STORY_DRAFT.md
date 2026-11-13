# The Last Banner — the mission plan (four chapters)

The plan for the main story, mission by mission, and the tracker for building it. Agreed with
the author (2026-11-13); it replaces the mission list in `docs/STORY.md` (the characters and the
world stay). Status: ⬜ to build · 🟨 building · ✅ built.

## What is agreed

- **The opening.** A wounded stranger gives you the fallen guild's banner (the Broken Lantern's
  cloth on its pole, and the bearer's medal). You repaint it with your colours and emblem. He
  makes you promise to find out what happened to them and leaves into the storm. He gives no
  name but "Rook".
- **The investigation.** Most people only remember the outline ("a small guild, cursed, gone").
  A few know more, and each wants something first: a beer, a job, a fight, gold, an item, a
  token of trust, or a threat they believe. Each points to the next.
- **The secret is kept to the end.** Who Rook was (the Argent Crown's old guildmaster, who
  ordered the Lantern destroyed and then tried to undo it) comes out only in Chapter 4.
- **The turn** (end of Chapter 3). Rook is found dead in the Blackwood, killed by Thorne's men;
  the Lantern's survivors rise again as **the Ashen Lantern**. The Ashen Lantern is good, the
  Argent Crown wicked. You first fight the guild that shares your standing, learn the truth, then
  go after the other. Each path has its own ending; a wicked guild's is the darker one.

## Levels (the scale)

Levels run from 1 to about **53**; the level cap becomes 60.

| | Party level | Circuit | Opposing teams |
|---|---|---|---|
| Chapter 1 | 1 → 12 | Initiation (teams of 2) | Dunmere's Harvest Melee about level 9 |
| Chapter 2 | 12 → 25 | Initiation titles, first Champion events | Initiation 10–16, Champion 18–24 |
| Chapter 3 | 25 → 40 | Champion (teams of 4) | Champion 25–38 |
| Chapter 4 | 40 → 50+ | Elite (teams of 5) | the top guilds 45–50 |

- **Beating a top guild:** a full team of five above level 45, with potions, good weapons and smart
  element play (fire on plant, water on fire). Or grind to about 53 and win easily. Player's choice.
- Levels in the tables below are the **party's level for a fair fight** (the foes' levels added
  up and shared among your fighters, as the XP rule reads them).
- Practice teams move with the scale (to set when Chapter 2 is built): about 6–10, 18–24, 30–36, 45–48.
- Done: hero level cap 60; foe strength follows level (power 38 + 2.25 per level, capped at 98).
- To change before Chapter 2 is built: rival rosters by circuit (opposing teams' levels), practice teams.

**Skills (built).** A hero learns from four sources (`src/data/skills.js`, `heroSkillTree`):

| Source | Levels | What |
|---|---|---|
| Class (Guardian, Duelist, Ranger…) | 1, 4–5, 20, 35 | the class's own moves |
| Element (the hero's primal) | 10, 25, 40 | a strike, a group skill, a great one |
| Character (personality) | 15, 29 | Brave stands fast, Merciful heals, Witty taunts… |
| Ultimate | 48 | one of three, chosen for good: The Last Banner (great party heal), Cataclysm (element on every foe), Executioner (one huge blow) |

The old middle class skills (levels 8–18) are kept for enemies only.

**The open world.** After Dunmere every road is open (only the Old Road waits on a companion).
Each area has its danger, shown on its map card; walking into one far above the guild sends it
home beaten (the defeat rule):

| Area | Bands (level) |
|---|---|
| The Old Road | 2–7 |
| The Thornwood | 7–9 |
| The coast road | 10–14 |
| The Iron Road | 13–18 |
| The cliff road | 18–24 |
| The Blackwood | 30–35 (the highest in the wild) |

## The Journal

- **Primary** (the story): one line, the current lead ("Find someone in Dunmere who knows about
  the fallen guild"), the clues found so far under it, and where the lead points. A dead end shows
  struck through, with why and what to do instead.
- **Secondary**: guild tasks (rent a hall, hire), contracts, people's errands ("Bring me three
  bundles of feverfew from the Old Road", "Beat the bandit who robbed my cart", "Find out who's
  been poaching in the Thornwood"), and tournaments you signed up for. A primary step that needs a
  secondary one says so ("First: hire a companion").

## Mission types

| Type | What you do |
|---|---|
| **Ask around** | Ask people in a place until one knows; most don't. |
| **Find someone** | Go to a named person in a place. |
| **Search** | Walk an area to find a thing (marked on the map once you have a clue). |
| **Gather** | Bring items: from fights (wolf pelts), from the ground (herbs, dyes), or from a camp (liquor). |
| **Trade** | Give an item or gold for something (a beer for a story, a token of trust). |
| **Convince** | A talk with a stat test, a bribe or a threat; what's on offer depends on your standing. |
| **Fight** | A battle, a duel or a training bout ("beat me and I'll tell you"). |
| **Errand fight** | "Beat someone for me": a band, a rival's fighter, a tournament round. |
| **Gate** | A person or place that needs a rank, a tournament result, a standing or a token. |

One trap of each kind across the story: **fight me first** (1.7), **a token of trust with three
ways to get it** (1.5), **a rank gate** (2.3) and **a standing dead end** (2.6).

**Standing on story choices.** Threatening means honor −, dread +. Beating the thing down by force for the
right reasons means dread +, honor + or none. Paying moves neither.

---

## Chapter 1 — A Guild of Nobodies
*Dunmere, the Old Road, Dawnwatch Temple, the Thornwood, Greenhollow · party 1 → 12 · Initiation*

| # | Mission | Types | What happens | Fights (party level) | Status |
|---|---|---|---|---|---|
| 1.0 | **The Knock at the Door** | scene | Rook, the banner and the medal, the promise. You paint your colours on it. | — | ✅ |
| 1.1 | **Who Remembers the Lantern?** | ask around, trade | Ask in Dunmere. Most shrug ("cursed, gone"). Old Ebb at the Wayfarer will talk for a beer (2 gold): the Lantern prayed at Dawnwatch Temple before every trip west, and the old priests kept their names. | — | ✅ |
| 1.2 | **A Roof and a Sword** | find someone ×2 | The watch won't let a lone walker onto the Old Road. *Needs:* rent a hall (Gideon's yard) and hire a companion (Mara points to Nessa). | — | ✅ |
| 1.3 | **Wolfskins on the Old Road** | errand fight, gather | Corwin the merchant: drive off the Wolfskins and bring him three wolf pelts as proof; he'll vouch for you at the temple. Verdict: the Wolfskin handler. | the pair (2), the camp (3), the handler and his pack (4) | ✅ |
| 1.4 | **The Ash Abbot** | fight | Brother Malric holds the temple gate and sells passage. Get ready (level 5, a weapon from Mira's), then beat him. Verdict: Malric yields. | the acolytes (5), Malric and two acolytes (7) | ✅ |
| 1.5 | **The Prior's Silence** | gate, trade / convince / fight | Prior Aubrey keeps the Lantern's prayer book, and shows it only to someone the Dunmere watch trusts. Sergeant Hobb will give you the watch's token: **pay** him (80 gold; neither honor nor dread), **bring** three bottles of liquor from the Wolfskin den (dread +, honor +), or **threaten** him (a fight with the watch: honor −, dread +). In the book a name is circled: Maren, herbalist, Greenhollow. | the den (7), or the watch (6) | ✅ |
| 1.6 | **The Thornwood Road** | search | The Thornwood road opens. Walk it to Greenhollow; on the way, find the Lantern's waystone (their marks carved in it) off the path, guarded by poachers. | poachers (7), the waystone's band (8) | ✅ |
| 1.7 | **The Herbalist's Son** | find someone, **fight me first** | Maren won't talk to a stranger with a borrowed banner. Her son Tobin, a warden, will test your arm in a training bout. Then she tells you: she treated two Lantern survivors after the Blackwood, and one spoke of a ledger kept at Ironford. Evidence: the herbalist's testimony. Verdict: Maren's safety. | Tobin and a warden (9) | ✅ |
| 1.8 | **Bram's Dare** | fight | Back in Dunmere, Bram Calder says the banner belongs to real fighters and dares you to a duel. Verdict: fair or dirty. | Bram, one on one (9) | ✅ |
| 1.9 | **The Harvest Melee** | tournament | Fight the Dunmere Harvest Melee; win at least one bout. After it the Argent Crown's man warns you to retire the banner. | Initiation teams of two (9–11) | ✅ |

*Chapter end:* the warning; your first epithet ("the honourable guild of the New Lantern"); Ironford is next.

**Build notes (Chapter 1, 2026-11-13).** Built as planned, with these choices:
- 1.5: **Mother Aveline** keeps the prayer book (she already lives at Dawnwatch), not a new Prior Aubrey. Threatening Sergeant Hobb starts a fight with the watch (level 6); win and the token is yours.
- 1.6: poachers camp at the waystone (level 8); beat them to copy the marks.
- 1.7: Tobin's test is a one-on-one duel at the Greenhollow arena (the story duel), not a two-a-side bout.
- 1.8: fighting dirty costs honor and starts Bram two levels down.
- Mission ids in code: 1.1 `c1-ask`, 1.2 `c1-road` (with `m1` and `m2` as its secondary tasks), 1.3 `m3`, 1.4 `temple`, 1.5 `c1-prior`, 1.6 `c1-thornwood`, 1.7 `m5`, 1.8 `c1-bram`, 1.9 `m4` (ends the chapter); errands `e1-feverfew` … `e6-nessa`.

**Secondary missions in Chapter 1** (people's errands, straightforward):
- ✅ Hesta Coal (the kiln): "Bring me three bundles of feverfew from the Old Road" (gather, 3).
- ✅ Corwin: "A bandit took my strongbox on the Old Road. Get it back" (errand fight, 4; return it whole or skim it).
- ✅ Holt Varga, the arena's referee: "Beat my novice team" (training, 4–6).
- ✅ Orren the herald: "Someone's been tearing down notices at night. Find out who" (ask around: it's Pip).
- ✅ Greenhollow's wardens: "Poachers in the Thornwood. Bring back their snares" (gather + fight, 8).
- ✅ Nessa (loyalty): "My brother's old camp is in the Thornwood. Come with me" (search, 8).

---

## Chapter 2 — The Names They Erased
*Ironford, the Iron Road, Windmere, the cliff and coast roads · party 12 → 25 · Initiation titles, the first Champion events*

| # | Mission | Types | What happens | Fights (party level) | Status |
|---|---|---|---|---|---|
| 2.1 | **The Iron Road** | search | Walk the Iron Road to Ironford. A toll gang has taken the bridge. | the toll gang (12) | ✅ |
| 2.2 | **The Ledger of Ironford** | convince / pay / fight | The ledger is in the foundry council's archive. Talk the council round (a test), buy a key from a clerk, force the archive at night (fight), or (Scholars) decipher a copy. Inside: a torn page, and a scrap in an old script nobody can read. Evidence: the ledger. | the archive guards (14) | ✅ |
| 2.3 | **The Archivist's Door** | find someone, **rank gate** | Magister Venn opens his door only to an Initiation champion or a Champion guild. Win any Initiation tournament (or reach Champion status). He reads a word: temple script, faded. Ask at Dawnwatch. | the tournament (14–16) | ✅ |
| 2.4 | **The Faded Papyrus** | find someone, gather | Dawnwatch can't read it; the priests send you to Sister Oriel, a scribe at the priests' house. She can restore it with three dyes: ochre from the Iron Road heights, woad from the cliff road, sea purple from the coast road. Each lies past a band. Restored: "The seven did not die in the fire. Ask the cliff champion who paid him to lose." | three road fights (16, 17, 18) | ✅ |
| 2.5 | **Windmere** | search, errand fight | Reach Windmere by the cliff road. The cliff champion is a recluse; the town wants a band of wreckers on the coast road gone before anyone will say where he lives. | the wreckers (19) | ✅ |
| 2.6 | **Two Doors** | find someone, **standing dead end** | Two people know Halden Marsh: Overseer Hale of the docks (talks only to honourable guilds) and Cass Vey, a fence (only to wicked ones). Oriel sends you to one; if your standing doesn't fit, it's a dead end and the Journal sends you back to her to ask for the other. A neutral guild can use either, for a price. | — | ✅ |
| 2.7 | **The Cliff Duels** | tournament | Marsh comes to watch the Windmere Cliff Duels. Reach the final and he'll come down to the sand. | Initiation teams (20–22) | ✅ |
| 2.8 | **The Fighter Who Never Lost** | fight / convince | Beat Marsh in a duel, or (honourable) show him the Lantern's medal, or (wicked) threaten his family. He confesses that Thorne paid him to throw the 1183 semifinal; he refused, and the Lantern won anyway. Evidence: the champion's testimony. | Marsh, one on one (23) | ✅ |
| 2.9 | **The Last Scout** | find someone, escort | Marsh knows a survivor hides in Greenhollow under another name: Linnet, really Wren, the Lantern's scout. The Crown's men are already there. Get her out: protect her, smuggle her, or ask door to door. Evidence: Wren's testimony. | the Crown's enforcers (24–25) | ✅ |

*Chapter end:* Wren's banner scene, and her line: "He gave you that? Then he's alive. And so is the man who sent us into the Blackwood."

**Build notes (Chapter 2, 2026-11-13).** Built as planned, with these choices:
- 2.2: the ledger's routes are as before (talk, buy, force at level 14–15, decipher); its read scene gives the scrap in the old script.
- 2.3: Magister Venn is Ironford's visiting scholar, Venn Ashby.
- 2.4: the dyes are gathering spots on the three roads, each behind a standing band: ochre on the Iron Road heights (16), woad on the cliff road ledge (17), sea purple on the coast road (18).
- 2.6: the honourable contact is **Overseer Dace** (not Hale: Ironford's foreman and Windmere's monk are already Hales). Dace helps honourable guilds, asks a neutral one for 100 gold (the widows' fund), refuses a wicked one; then Sela sends you to Cass Vey, who helps wicked guilds, charges neutral ones, refuses honourable ones.
- 2.7: either Windmere event counts (the Cliff Duels or the Gale Games).
- 2.8: Marsh duels at level 23; he skips the duel for Rook's note, for the Lantern's medal (honourable guilds) or a threat to his family (wicked: honor −10, dread +10).
- 2.9: Wren's hunters are fixed at level 24–25.
- Rook's secret stays for Chapter 4: Halden now says "someone high in the Crown", and Wren's banner scene ("He called himself Rook… Then he's alive") no longer names him as the Crown's guildmaster. Garrick Thorne is already named in Chapter 2 (the ledger's "G.T.", Wren's account); 3.1's envoy confirms it.
- Errands: Corr's ore, the pit fighters (a veteran practice team), Sela's letter to Dagna Hale, the wreck on the coast road.
- Mission ids: 2.1 `c2-ironroad`, 2.2 `m6`, 2.3 `c2-venn`, 2.4 `c2-papyrus`, 2.5 `c2-windmere`, 2.6 `c2-doors`, 2.7 `c2-duels`, 2.8 `m7`, 2.9 `m8` (ends the chapter); errands `e7-ore` … `e10-wreck`.
- Also built for Chapter 2: tournament teams by event level, practice teams by town tier, contract fights by town.

**Secondary missions in Chapter 2:** the foundry's missing shipment (search), the smith's ore from the heights (gather), a duel for a dock boss (errand fight), the lighthouse keeper's lamp oil (gather), the Ironford pit fighters (training), the wreck on the coast road (search + fight).

---

## Chapter 3 — The Blackwood
*the Moon Road, Mooncourt, the Blackwood (deep), Tidecross · party 25 → 40 · the Champion circuit*

| # | Mission | Types | What happens | Fights (party level) | Status |
|---|---|---|---|---|---|
| 3.1 | **The Price of Silence** | convince | A patron offers a fortune to sponsor the guild if you put the banner away. Take it (gold; the trail goes cold for a season) or refuse. His envoy lets slip a name: Lieutenant Garrick Thorne. | — | ⬜ |
| 3.2 | **The Moon Road** | search, gate | The Moon Road from Ironford opens to Champion guilds. Walk it to Mooncourt; the moon-cult raiders hold the pass. | the raiders (27), their priest (29) | ⬜ |
| 3.3 | **The Quartermaster's Favour** | errand fight | The Crown's old quartermaster, retired in Mooncourt, will trade the ambush maps for a favour: beat the Crown's second team in a Champion exhibition. | the second team of four (31) | ⬜ |
| 3.4 | **The Edge of the Blackwood** | search, gather | With Wren's map, walk past the Blackwood's edge. Find the Lantern's three trail marks, and cut through the briar with the warden's axe (from Tobin, if he trusts you; or bought in Mooncourt). | the wood's outlaws (32), the briar band (33) | ⬜ |
| 3.5 | **The Seven Stones** | search, fight | The ambush site: a burned camp, seven stones, the Crown's arrows. The Hollow Warden guards the last glade. Evidence: the Blackwood remains. | the wardens of the wood (34), the Hollow Warden (36) | ⬜ |
| 3.6 | **The Crown's Secret** | find someone, convince | A Mooncourt court clerk hands over the Crown's orders if your evidence is enough (4 of 6), for a heavy bribe, or (dreaded guilds) if you frighten him. The orders are signed by Thorne. | — | ⬜ |
| 3.7 | **The Tidecross Open** | tournament | The Argent Crown enters the Tidecross Open; so do you. Reach the semifinal to face Thorne in public; he walks away untouchable. | Champion teams of four (36–39) | ⬜ |
| 3.8 | **Blood on the Snow** | search, scene | A body by the seven stones: Rook, killed by Crown blades, a sealed letter "for the bearer" on him. That night the survivors raise a new banner: the Ashen Lantern. | the Crown's killers at the stones (40) | ⬜ |

*Chapter end (the turn):* two guilds stand in your way.

**Secondary missions in Chapter 3:** Mooncourt's stolen relic (search + fight), the moon-cult's prisoners (escort), the Tidecross smugglers (convince / fight), the Blackwood herbs for the temple (gather), a Champion guild's challenge (fight), the court's missing heir (ask around).

---

## Chapter 4 — Crownfall (the ending)
*Mooncourt, Crownfall, the World Conclave · party 40 → 50+ · Champion and Elite*

Three missions and two fights, then a symbolic last mission. Which guild comes first depends on
your standing at the turn: the one that shares it. A neutral guild chooses at the start of the chapter.

### The honourable path: the Ashen Lantern first
| # | Mission | Types | What happens | Fights (party level) | Status |
|---|---|---|---|---|---|
| 4.1 | **The Last Clue** | find someone | Rook's letter names "the one who held the knife"; Thorne's people say the Ashen Lantern killed Rook. Everything points at them. | — | ⬜ |
| 4.2 | **Ash and Embers** | fight | Corner the Ashen Lantern at the seven stones and beat them. Wren, wounded, shows you Rook's true letter: Rook was the Crown's guildmaster, ordered the ambush, and spent his last years trying to undo it. Thorne killed him to bury it. | the Ashen Lantern, five (45) | ⬜ |
| 4.3 | **The Crown Must Fall** | find someone, convince | With the Lantern beside you, put your evidence before the court and get Thorne named before Crownfall. | — | ⬜ |
| 4.4 | **Crownfall** | fight (final) | The Crownfall final against the Argent Crown, Thorne at its head. | the Argent Crown, five (48–50) | ⬜ |
| 4.5 | **A Banner at Rest** | symbolic | Bring the medal and the banner to Rook's grave at the seven stones. The Lantern's 1183 title is restored if your evidence is enough (Ending A); otherwise you are champions and the record still reads "vacated" (Ending B). | — | ⬜ |

### The wicked path: the Argent Crown first
| # | Mission | Types | What happens | Fights (party level) | Status |
|---|---|---|---|---|---|
| 4.1 | **The Last Clue** | find someone | Rook's letter names Thorne. Good: you've wanted the Crown's place since Mooncourt. | — | ⬜ |
| 4.2 | **The Crown's Fall** | fight | Beat the Argent Crown at Crownfall. Thorne, beaten, spits out Rook's secret as an insult, and warns you that the Lantern will come for you, because they know what you've done to get here. | the Argent Crown, five (45) | ⬜ |
| 4.3 | **Ashes to Ashes** | search, convince | Find the Ashen Lantern before they turn the court against you: buy an informant, or frighten one. | — | ⬜ |
| 4.4 | **The Last Lantern** | fight (final) | The Ashen Lantern, Wren at their head, in the ruins of the old Lantern hall. | the Ashen Lantern, five (48–50) | ⬜ |
| 4.5 | **The New Crown** | symbolic | Burn the old banner and raise yours over the Crown's hall in Mooncourt. Everyone fears you now (Ending C). | — | ⬜ |

Afterwards: the World Conclave Championship (Elite, top guilds 45–50) is there for the champion of the world.

---

## Open questions
- Rook's grave: at the seven stones (assumed above)?
- Names to keep or change: Old Ebb, Sergeant Hobb, Prior Aubrey, Tobin, Sister Oriel, Overseer
  Hale, Cass Vey, Magister Venn.
