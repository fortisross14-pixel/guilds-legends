# The Last Banner — main story

The story document for Guilds of Legend, written by the game's author. Agents: this is the source of truth for the main story. Implement it faithfully, keep the dialogue as written (light edits for flow are fine), and read **Implementation notes** at the end before building anything.

A three-act story about pride, betrayal, revenge, and the difference between winning a tournament and building something that deserves to survive.

**The twist, revealed in the prologue:** the dying man is not the innocent leader of a destroyed guild. He is the leader of the powerful rival guild that ordered its destruction, and he carries the banner of the people he tried to eliminate. The mystery: why is he trying to save the very guild he destroyed?

The story unfolds over several in-game years, with 12 major story missions, recurring characters, meaningful choices, and a final tournament that brings everything back to where the tragedy started.

---

## The central premise

Four years before the game begins, an obscure guild called **The Broken Lantern** achieved the impossible. At the prestigious **Crownfall Tournament**, they defeated **The Argent Crown**, the most powerful guild in the kingdom and reigning champions for nine consecutive years.

The Argent Crown's leader, **Lord Cassian Rook**, was humiliated. He lost sponsors, prestige and the aura of invincibility that had made him the most feared guildmaster in Valedorn. He ordered his trusted lieutenant to destroy the Broken Lantern before they could compete again.

The lieutenant arranged an ambush in the Blackwood. Seven heroes disappeared. Their guild hall was burned. Their victory was erased from official records and replaced with a story about forbidden magic and a cursed expedition.

But the order started something Rook could no longer control. His lieutenant, **Garrick Thorne**, became increasingly ruthless, using illegal magic, assassinations and bribery to secure the Argent Crown's dominance. When Rook finally tried to expose him, Thorne tried to have him murdered.

Rook escapes, wounded and carrying the stolen banner of the Broken Lantern. And he reaches your door.

---

## Prologue — The knock at the door

*Dunmere · Year 1187 · Night*

### Scene 01 — The stranger

The player is inside a small, modest house. A fire burns in the hearth. Rain lashes the windows. A sudden knock interrupts the silence.

*THUD. THUD. THUD.*

The player walks to the door and opens it. A man in battered armor stumbles inside. Blood runs down his sleeve. He clutches a wrapped object.

> **STRANGER:** "Close... the door."
> **PLAYER:** "Gods! What happened to you?"
> **STRANGER:** "No time. Are you alone?"
> **PLAYER:** "Yes. Sit down. I'll get a physician."
> **STRANGER:** "A physician won't help me."

He collapses to his knees. A silver guild insignia falls from his cloak.

> **PLAYER:** "Wait. That's a guild badge."
> **STRANGER:** "It was."
> **PLAYER:** "You're an adventurer? A real guild adventurer?"
> **STRANGER:** "I was a guildmaster."
> **PLAYER:** "A GUILDMASTER? Here? In my house?"
> **STRANGER:** "The Argent Crown. I led them."
> **PLAYER:** "The Argent Crown?! You won the King's Tourney three years in a row! I've seen your name on the Herald's wall!"

The man gives a bitter laugh, then coughs blood.

> **CASSIAN ROOK:** "Nine. We won nine."
> **PLAYER:** "What happened?"
> **ROOK:** "We lost."

He unwraps the bundle. Inside is a torn, bloodstained banner bearing a golden lantern.

> **ROOK:** "A little guild. Seven nobodies. They beat us in front of the entire kingdom."
> **PLAYER:** "The Broken Lantern? I thought they vanished in the Blackwood."
> **ROOK:** "They didn't vanish."

He hesitates.

> **ROOK:** "I had them killed."

Silence.

> **PLAYER:** "What?"
> **ROOK:** "I thought losing was the worst thing that could happen to a man. So I made sure they could never beat me again."
> **PLAYER:** "You murdered them?"
> **ROOK:** "I gave the order. And the man who carried it out... has come for me."

Footsteps sound outside. Rook's eyes turn toward the door.

> **ROOK:** "Listen to me. There may be survivors. Find them. Tell them the truth."
> **PLAYER:** "I'm nobody! I have no soldiers, no money. I don't even have a guild!"
> **ROOK:** "Then make one."

He presses the banner into the player's hands.

> **ROOK:** "Find a hall. Gather heroes. Give them a name. Let the world hear it."
> **PLAYER:** "Why me?"
> **ROOK:** "Because you don't know how powerful you are supposed to be."

He catches his breath.

> **ROOK:** "And whatever you do... don't trust Garrick Thorne."

Rook dies. Outside, the footsteps stop. Someone tries the door.

**Gameplay resumes.** The player decides what to do: hide the body, inspect the banner, search Rook's belongings, or flee. This first choice isn't cosmetic. It shows how the player responds to danger and gives them a first piece of information (see Implementation notes).

The attacker outside leaves when the town watch approaches. Before he goes, he scratches the Argent Crown's emblem into the door. Someone knows the banner is here.

The game then asks the player to **name their new guild**. The Broken Lantern remains the old, destroyed guild. The player creates a separate organization with its own identity, keeping the banner as an inherited relic.

---

## Act I — A Guild of Nobodies

*Year 1 · Dunmere and the surrounding settlements*

Intimate and grounded. The player knows nothing about running a guild. The great conspiracy is almost irrelevant next to finding money, allies and somewhere to sleep.

### Main missions

| # | Mission | Story and gameplay purpose |
|---|---|---|
| 1 | **A Banner Without a Hall** | The player finds a disused stable or guild office in Dunmere and persuades its owner to rent it, by completing a small job or negotiating terms. This becomes the first Guild Hall. |
| 2 | **The Tavern at the Crossroads** | The player meets potential companions through dialogue. The first recruit is free but has a personal motivation. Introduces recruitment and relationships. |
| 3 | **Wolves on the Old Road** | A merchant asks for protection. The first real contract and tactical battle. Returning to the merchant creates the guild's first local reputation. |
| 4 | **The Dunmere Harvest Melee** | A local fighter invites the player into their first tournament. The player experiences the competition system and sees how powerful established guilds are. |

### Characters introduced

- **Mara Fen — the tavernkeeper.** Knows everybody in Dunmere. Practical, skeptical and funny. She was once married to an adventurer who never returned. Introduces recruits, patrons and local gossip, and gradually becomes an ally of the guild.
- **Nessa Thornfield — the first companion.** A young Ranger working as a hunter and guide. She wants adventure but can't convince a reputable guild to hire her. Her older brother disappeared in the Blackwood (he was one of the Broken Lantern's seven). She doesn't reveal that connection at first.
- **Bram Calder — the local challenger.** A promising Duelist who thinks the player is a joke. He challenges the guild to a friendly match, becomes a recurring rival, and may eventually join depending on the relationship.

### The Act I ending

The player enters the Dunmere Harvest Melee, probably loses early, but earns recognition. After the tournament, a well-dressed representative of the Argent Crown approaches.

> **REPRESENTATIVE:** "An interesting banner you've been carrying."
> **PLAYER:** "What of it?"
> **REPRESENTATIVE:** "Lord Thorne wishes to congratulate you on your performance. And offer some friendly advice."
> **PLAYER:** "Which is?"
> **REPRESENTATIVE:** "Retire that banner before it brings you the same misfortune it brought its previous owners."

For the first time, the player realizes the dying stranger's warning was real.

---

## Act II — The Names They Erased

*Years 1–3 · Greenhollow, Ironford, Windmere and Mooncourt*

The guild is getting established. Recruitment, contracts, rivalries and tournaments are familiar. The story turns from survival into investigation. Every story mission reveals something about one of the original seven heroes and connects it to a living person today.

### The original Broken Lantern

Seven heroes. Their leader was **Aldric Vane**, a skilled but unconventional captain. His young scout, **Wren**, was rumored to have survived.

The official account says Aldric made a pact with the **Hollow Warden**, a supernatural entity in the Blackwood, and sacrificed his own guild for victory. The truth is more complicated.

### Main missions

| # | Mission | Discovery and significance |
|---|---|---|
| 5 | **The Herbalist's Witness** | In Greenhollow, a retired herbalist recalls treating wounded Broken Lantern members shortly after the tournament. The guild learns the heroes were being followed before they entered the Blackwood. Unlocks a new lead. |
| 6 | **The Ledger of Ironford** | A former Argent Crown quartermaster hid records of payments to mercenaries. The player infiltrates an archive, negotiates with its keeper, or obtains the ledger through a mission. The entries connect Rook's guild to the attack. |
| 7 | **The Fighter Who Never Lost** | At a Windmere tournament, the player meets an aging champion who competed against Aldric Vane. He reveals that the Broken Lantern won the Crownfall final fairly. A duel can earn his respect and testimony. |
| 8 | **The Last Scout** | The player finds Wren living under an assumed name. She is being hunted. The player must protect her, then decide whether to bring her back into guild life or help her stay hidden. |

### The second big revelation

Wren tells the player what happened in the Blackwood. The Argent Crown sent mercenaries to kill the Broken Lantern. But Garrick Thorne also hired an occultist to bind a forest spirit, the Hollow Warden, to trap anyone who escaped the ambush. The Warden grew beyond the occultist's control.

Some of the Broken Lantern died fighting the assassins. Others were taken into the forest. Aldric Vane led the survivors deeper into the Blackwood, hoping to escape the mercenaries. And that's where the trail ends.

The story of Aldric sacrificing his guild was deliberately spread by Thorne to hide the massacre.

### The emotional centerpiece

Wren visits the player's Guild Hall and sees the banner. She freezes.

> **WREN:** "Where did you get that?"
> **PLAYER:** "A man brought it to me."
> **WREN:** "Who?"
> **PLAYER:** "Cassian Rook."

She draws her dagger.

> **WREN:** "Then burn it."
> **PLAYER:** "It was your banner."
> **WREN:** "No. It was ours. And he carried it away while my friends were dying."

The player discovers that carrying a heroic symbol doesn't make them a hero. They must earn the right to represent it. Depending on earlier decisions, Wren becomes a companion, an allied NPC, or someone who helps expose the conspiracy while refusing to join.

---

## Act III — The Crown Must Fall

*Years 3–5 · The wider kingdom, the Blackwood and the Crownfall Tournament*

The guild has competed in tournaments, developed heroes, made enemies and built a reputation. Garrick Thorne is now guildmaster of the Argent Crown. He is not a brute: he's an excellent strategist, a charismatic leader and a formidable fighter, and his guild keeps winning. Publicly, he's the man who rebuilt the Argent Crown after Rook's "tragic death". Privately, he knows the player has the banner and may have Rook's confession.

### Main missions

| # | Mission | Story and gameplay significance |
|---|---|---|
| 9 | **The Price of Silence** | Thorne offers a lucrative sponsorship if the guild abandons its investigation and retires the old banner. Accepting brings resources but costs trust and changes later dialogue. Refusing strengthens the rivalry. |
| 10 | **The Blackwood Expedition** | The guild leads an expedition into the cursed forest: mercenaries, corrupted creatures and the Hollow Warden. They recover the remains of the lost heroes and discover that Aldric died protecting the survivors, not betraying them. |
| 11 | **The Crown's Secret** | With the ledger, Wren's testimony and the Blackwood evidence, the player challenges Thorne's public account. A political and investigative mission in Mooncourt decides whether the truth can be formally presented to the guild authorities. |
| 12 | **The Crownfall Tournament** | The final major championship. The player must qualify and face powerful guilds, possibly including the Argent Crown. The competition is genuine and uses the real guild and hero simulation, not a scripted win. |

### The penultimate confrontation

The player confronts Thorne before the championship.

> **THORNE:** "Do you know why Rook lost?"
> **PLAYER:** "Because the Broken Lantern were better."
> **THORNE:** "No. Because he mistook a single victory for greatness. Nine years of dominance, destroyed by one humiliating afternoon."
> **PLAYER:** "So you murdered them?"
> **THORNE:** "I preserved everything he had built."
> **PLAYER:** "You killed your own guildmaster."
> **THORNE:** "He was about to confess to the world. Destroy us all because his conscience finally caught up with him."
> **PLAYER:** "And if we win?"
> **THORNE:** "Then perhaps you'll understand why he did what he did."

Thorne believes reputation, titles and power justify almost anything; guilds are machines that must never lose. The player must prove that a guild's value comes from its people, its promises and its history.

### The final tournament

The Crownfall Tournament is the climax, not a boss battle. The player goes through the real brackets. Their heroes may face competitors they've met over several years: Bram as a rival in another guild, Nessa as a star Ranger, a former companion fighting for the opposition. The Argent Crown may have developed differently because of the simulation.

The final is not guaranteed to be the player versus Thorne; the story recognizes the actual bracket. If both guilds reach the final, the player's obscure guild faces the reigning powerhouse in the same competition where the tragedy began.

Before the match, Wren approaches.

> **WREN:** "Aldric used to say something before every final."
> **PLAYER:** "What?"
> **WREN:** "'Win if you can. Come home if you can't.'"
> **WREN:** "I never understood it until we didn't come home."

The player enters the arena. No more dialogue. The match carries the climax.

### Endings

Winning the final is not mandatory. Defeat is a legitimate part of history.

- **Ending A — The Banner Restored.** The player defeats the Argent Crown and has exposed Thorne. The tournament authorities formally recognize the Broken Lantern's historical victory and denounce the attack. The guild becomes famous for surviving the powerful without becoming like them. The seven lost heroes receive a permanent memorial.
- **Ending B — Truth Without Victory.** The player loses the championship but has enough evidence and allies to expose the conspiracy. Thorne is disgraced and the Broken Lantern's name is restored. The guild isn't champion, but its integrity is established. The Argent Crown may continue under a new leader, preserving a future rivalry.
- **Ending C — The Crown Endures.** The player can't expose Thorne decisively, or chooses not to pursue the truth. The Argent Crown stays powerful, and some of its crimes become an open secret. The guild can still prosper, win titles later and uncover more. The story closes with an unresolved rivalry, not a game over.

If Thorne is exposed, his fate depends on the evidence and choices: imprisonment, exile, or an escape that leaves him as a possible future antagonist. He should not simply vanish because the player wins a match.

### Epilogue — A banner outlives its owner

The final scene returns to the player's Guild Hall. Years have passed since the night of the knock. The old banner hangs on the wall. If Wren survived, she visits and looks at the names of her fallen companions.

> **WREN:** "They would have liked this place."
> **PLAYER:** "It's not the Broken Lantern."
> **WREN:** "No."

She looks around at the guild's heroes, trophies and banners.

> **WREN:** "It's something new."

That's the end of the main campaign, not the end of the game. Credits can roll, but the simulation continues: the player keeps leading the guild, training heroes, entering tournaments, fighting rivals and eventually passing leadership to the next generation.

The opening banner survives in the Hall of Legends, with its own provenance:

> *Carried by the Broken Lantern. Taken by Cassian Rook. Recovered in Dunmere, Year 1187. Preserved by the founder of [Guild Name].*

The whole campaign becomes the first chapter of the player's own history.

---

## How the story works as a game

- **The story is a backbone, not a corridor.** It runs alongside the simulated world: procedural heroes, side missions, dynamic rival guilds, recurring tournaments, succession. Every story mission feeds the same simulation and Chronicle.
- **Story missions unlock through relevant achievements and conversations,** not just the calendar. For example, Nessa's subplot advances after certain contracts or on reaching Greenhollow.
- **Garrick Thorne and the Argent Crown are real simulated competitors,** not cutscene villains: real rosters, rankings, injuries, transfers, championship results and careers. Thorne can lose a tournament to another guild before you ever face him. One of his best heroes can leave. Your recruits can defect. The story adapts where possible.

---

## Implementation notes (added by Claude, for agents)

These reconcile the story with the existing game. Follow them unless the author says otherwise.

### Chapters and scope
- **Chapter 1 (the current vertical slice) = Prologue + Act I + Act II (missions 1–8).** It ends on the Wren banner scene (a strong cliffhanger).
- **Chapter 2 = Act III (missions 9–12), the endings and the epilogue.** It needs National-tier content: Mooncourt, the Blackwood expedition at full scale, and the Crownfall Tournament.
- Build the story system for all 12 missions. Write full data for missions 1–8, and add missions 9–12 as locked stubs ("Chapter 2"), so nothing needs restructuring later.
- **Slice locations:** add **Windmere** to the slice for mission 7, with a small arena or exhibition ground for its tournament. Mooncourt stays outside the slice; in Chapter 1, Wren's location and every Act II mission must be reachable within the slice.
- **The Blackwood:** in Chapter 1, the wild area is reachable only at its edge. The Hollow Warden's presence blocks the way deeper, as a teaser for mission 10.

### Clashing names and lore already in the game (fix these)
- **The existing story data** (`src/data/story.js`) says Aldric traded the guild's luck to the Hollow Warden. That is now **Thorne's false official story**: keep it as the rumor NPCs repeat early on. Replace the beats with these 12 missions.
- **"Captain Rook"** (a bandit boss in `src/data/enemies.js`): rename, to avoid confusion with Cassian Rook.
- **"Bram Hallow"** (the road merchant and Trade House representative): rename, so Bram Calder is the only Bram. The merchant from mission 3 can be this renamed character.
- **"Mara Veyne"** (in `src/data/content.js`): rename, so Mara Fen is the only Mara. Mara Fen is the tavernkeeper of the Wayfarer in Dunmere (replace the existing innkeeper NPC).
- **"Nessa Briar"** (a historic Greenhollow Thorn Cup champion in `src/data/universe.js`): rename, so Nessa Thornfield is the only Nessa.
- Remove "Aldric", "Wren", "Rook" and "Bram" from the random name pools, so procedural heroes never share story names.

### The Argent Crown and the Crownfall Tournament
- **The Argent Crown** becomes a real rival guild in `src/data/universe.js`: a National-tier powerhouse with a strong roster, and Garrick Thorne as its guildmaster and star (a high-level hero with his own career record). Replacing an existing generic top guild (e.g. "Crown Champions") is fine.
- Its history includes **nine consecutive Crownfall titles** (1174–1182) and the **1183 loss to the Broken Lantern**, which official records list as "vacated". The history board and almanac show that erased entry, and Ending A restores it.
- **The Crownfall Tournament** is the kingdom's premier guild championship. Rename the existing National guild championship (the King's Shield) to it, or add it if renaming is messy. The player's line "the King's Tourney" is the common nickname for it.
- **The Broken Lantern's seven:** give all seven a name, class and fate in a data file (Aldric Vane, captain; Wren, scout; Nessa's older brother; four more), so missions and codex entries can reference them, and the Hall of Legends can list them.

### The prologue choice gives a first clue
Each option leads to the same story, but gives something different:
- **Search his belongings:** Rook's unfinished **confession letter**, an evidence item usable in mission 11.
- **Inspect the banner:** the seven names stitched inside the hem (codex entry plus a lead for Nessa's subplot).
- **Hide the body:** the watch asks no questions, and Mara Fen later trusts you more (she noticed).
- **Flee:** you spot the attacker's face, and recognize him later (an Argent Crown enforcer) for a dialogue advantage.

### Evidence
Track story evidence as items or flags:
- Rook's confession (prologue)
- the herbalist's testimony (5)
- the ledger (6)
- the champion's testimony (7)
- Wren's testimony (8)
- the Blackwood remains (10)

Mission 11 and the endings depend on how much evidence the player has. The quest log shows the evidence collected so far.

### Gates and guild identity
- Each mission lists its gate in the quest log (a contract, a tournament result, a location, a reputation or patron level, a hero class), plus at least one alternative.
- Where it fits, the charter opens a different route: Merchant House buys information, Free Company fights for it, Scholars' Lodge deciphers it, Shield of the People gets help from grateful people.
- Mission 9 (the sponsorship) is a real temptation for Merchant House and Trade House-allied guilds.

### Pacing and the tutorial
- **Act I missions 1–4 are the tutorial:** rent the hall (1), hire the first hero (2), complete the first contract and battle (3), and fight the first tournament (4).
- Start the campaign so the Dunmere Harvest Melee is about 1–2 months away, so the tutorial doesn't stall.
- After the Act I ending, the tutorial is over: the player is free to explore, grow, or follow the story.
- **Act II spreads over in-game years 1–3.** Gates (contracts, tournaments, reputation) set the pace, not the calendar.

### Endings and the Path scores
In Chapter 2, the ending (A/B/C) comes from the final result plus the evidence. The Phase 4 Path scores (Richest, Best connected, Strongest, Most legendary) add a title and flavor to the epilogue.
