# Dialogue: style guide, shape and voices

How every conversation in Guilds of Legend is written: town people, story scenes, visitors in buildings, the hiring interview. Read this before you write or change a line. The data format is documented at the top of [`src/data/dialogue/index.js`](../src/data/dialogue/index.js); people in buildings are generated in [`src/game/engine/people.js`](../src/game/engine/people.js) from the voices in [`src/data/people.js`](../src/data/people.js). The story itself is in [`STORY.md`](STORY.md); touch rules (tap to advance, hold to fast-forward) are in [`UX.md`](UX.md).

## The rules

1. **The NPC opens.** The person you walk up to speaks first. The player never starts with a line of their own.
2. **The player speaks only through choices.** Every choice is written as something the player says out loud ("What’s the job?", not "Ask about the job"). No automatic player lines, except in the authored scenes from `STORY.md` (the prologue, the Act I ending, Wren’s banner scene).
3. **Answers follow questions.** An NPC never answers something the player has not asked yet. If the answer matters, it is a topic.
4. **Short lines.** At most two sentences, about 120 characters per line; the player taps to advance. Split long speeches into beats.
5. **Hub and spokes.** Opener → 1–2 small-talk exchanges (choices) → a hub of 2–4 topics plus anything specific to now → each topic is 1–3 lines and comes back to the hub → a goodbye that fits the character. Asked topics are checked. New topics appear with progress (`if` on the topic).
6. **Offers are topics.** A contract ("Need anything done?"), a place in the guild ("Looking for work?") or a bout ("Fancy a friendly bout?") comes up like any other question. Game numbers (gold, fame) go in the choice in brackets, "(160 gold)", or in a notice, not in the speech.
7. **Memory.** First meeting: the NPC says their name. Return visits: a familiar opener (`talked: true`). Big events change the opener: story progress (`storyDone`), promotion (`tierAtLeast`), patron standing, season, charter. Reactions go first in the variants list, then the return opener, then the first meeting.
8. **One voice per character.** Each named character has a way of talking (notes below). If a line could be said by anyone, rewrite it.
9. **The player is one person.** Plain, direct, a little dry; polite with strangers, never grovelling, never cruel. Tone choices appear only where they change something (a relationship point, a story choice, a charter route).
10. **Lore lives in the codex.** Conversations hint and point; the history, the official story and the names go in the Lore codex (`{ codex: id }`). No one recites a page of history.
11. **Places and things are described, not spoken to.** A fountain or a lantern is a short narrated card with "Move on".
12. **Would a person say this?** No "as you know", no exposition at someone who already knows it, no menu words ("interact", "select") in speech.

## The shape

```text
Opener (the NPC; their name on a first meeting)
  └─ small talk: 2–3 choices, each with a one-line reply      (first meeting only)
Hub: the topics, asked in any order, asked ones checked
  ├─ Topic A → 1–3 lines → back to the hub
  ├─ Topic B → 1–3 lines (effects: a rumour, a flag, a codex entry) → back
  ├─ Topic C (only once the story allows it) → back
  └─ Goodbye (the player's line) → the NPC's farewell → closes
```

Story decisions use the same hub beside the decision (`decide: true`): the player can ask Gideon what the yard is and what it costs, then pay or haggle. Picking the decision completes the step.

People in buildings follow the same shape, generated: their first words (by what they want), their name (by personality or role), then topics: small talk ("Where are you from?"), their service ("Show me what you’ve got."), their offers, and "Goodbye." The interview is a small hub of its own: "Tell me about yourself." · "What can you do?" · "What would it take to sign you?" · "Let’s talk about something else."

### A full example: Iven Quill (Dunmere)

```js
'dunmere.traveler': {
  speaker: 'Iven Quill',
  variants: [
    // reactions first, then return visits, then the first meeting
    { if: { talked: true, tierAtLeast: 1 }, lines: ['The promoted guild! I’ve been telling your story in three towns. I improve it a little each time.'] },
    { if: { talked: true }, lines: ['Back again? Your boots look older. Good. Boots should earn their scuffs.'] },
    {
      lines: ['Another traveler? You’ve got road dust on your boots.', 'Iven Quill. I walk the roads and sell what I hear. Where are you headed?'],
      choices: [
        { text: 'Nowhere yet. I’ve only just started a guild.', reply: ['A guild! Then learn the roads before they learn you.'] },
        { text: 'Wherever the work is.', reply: ['Spoken like a sellsword. The roads have plenty of work. Most of it bites.'] },
        { text: 'Wherever my boots stop complaining.', effects: [{ relationship: 1 }], reply: ['Then you’ll never leave Dunmere. Mine haven’t stopped in twenty years.'] },
      ],
    },
  ],
  topics: [
    { id: 'ironford', text: 'How do I get to Ironford?', effects: [{ rumor: … }], lines: ['Follow the river east. You’ll hear the foundries before you see the walls.'] },
    { id: 'greenhollow', text: 'And Greenhollow?', effects: [{ rumor: … }], lines: ['North-east through the herb fields. Ask anyone for the Elder Oak; they point like it’s family.'] },
    { id: 'news', text: 'Heard any news on the road?', if: { storyDone: 'm6' }, lines: ['Windmere’s full of talk about an old cliff champion. Never lost a duel, they say.', 'Never is a long time. I’d like to meet him.'] },
    { id: 'news', text: 'Heard any news on the road?', lines: ['Wolves on the Old Road, bold as merchants. Somebody’s feeding them, if you ask me.'] },
    { id: 'self', text: 'You sell what you hear?', lines: ['A map is just a rumour someone wrote down. I just skip the writing.'] },
  ],
  bye: { text: 'Safe roads, Iven.', lines: ['And you. Mind the bridges; they remember who crossed them.'] },
},
```

What it shows: he opens; he names himself on the first meeting and asks a question; the player's answers are small talk with a tone (the joke earns a relationship point); directions are given only when asked; "news" has a later version that unlocks with the story; the goodbye is his.

## Voices

**The player (the founder):** plain and direct, dry when it fits, polite with strangers. Short sentences. Says "we" once there is a guild.

### Story characters

| Character | Voice | Sounds like |
|---|---|---|
| **Mara Fen** (the Wayfarer’s innkeeper) | Practical, skeptical, dry humour; calls people "love"; has heard every story and believes few. | "The official story? Their captain sold his luck to the Hollow Warden. That’s what the heralds say, anyway." |
| **Nessa Thornfield** (ranger, first companion) | Eager, quick, a little defiant; closes up the moment her brother comes near. Opens up in Act II. | "To see the world past the Old Road. And there’s someone I’m looking for. That can wait." / "…I said it can wait." |
| **Bram Calder** (duelist) | Cocky, competitive; every exchange is a contest; respects anyone who pushes back. | "Everyone says that. Then they meet me." |
| **Cassian Rook** (the dying guildmaster) | Bitter and broken; speaks in fragments; carries guilt. Only in the authored prologue. | "And whatever you do… don’t trust Garrick Thorne." |
| **Garrick Thorne** (Argent Crown), through **his representative** | Smooth, cold, reasonable-sounding; threats phrased as advice and courtesy. Authored Act I ending. | "Lord Thorne wishes to congratulate you on your performance. And offer some friendly advice." |
| **Wren** (the last scout; "Linnet" in hiding) | Wary and sharp; short sentences; watches the exits; trusts slowly. The banner scene is authored. | "Don’t. Not here. They’re already in town." |
| **Gideon Rusk** (landlord) | Gruff, money-minded, secretly decent; counts coins twice; "fair’s fair". | "Keys. Don’t burn it down." |
| **Corwin Pell** (Trade House merchant) | Brisk; counts everything, even favours; business metaphors. | "Coin, and the Trade House’s memory. The second is worth more." |
| **Maren Bell** (Greenhollow herbalist) | Tired, sharp-tongued, kind underneath; talks about plants and patients. | "Careful, that’s a seedbed, not a doormat." |
| **Oswin Tull** (Ironford archive keeper) | Dry, precise, frightened under it; talks like a filing clerk. | "Forty years of contracts, receipts and lies. All filed by date." |
| **Halden Marsh** (Windmere champion) | Old, proud, laconic; respects only fighters. | "You carry that banner like it’s heavy. Good. It should be." |

### Town people

| Character | Voice |
|---|---|
| **Iven Quill** (Dunmere, traveller) | Warm wanderer; talks in roads, boots and weather; sells rumours. |
| **Orren Pike** (Dunmere herald) | Pompous, theatrical; loves a name; speaks like a proclamation. |
| **Hesta Coal** (Dunmere kilnmaster) | Blunt, warm, smells of smoke; everything is about fire and clay. |
| **Pip** (Dunmere lamplighter) | A quick, nosy kid; knows everyone’s routes. |
| **Warden Tamsin** (Greenhollow) | Terse, watchful, protective; speaks in warnings. |
| **Old Fen** (Greenhollow storyteller) | Rambling, wry; answers questions with questions. |
| **Kit** (Greenhollow stablehand) | Chatty gossip; ends things with "just saying". |
| **Brother Alder** (Temple of the Dawn) | Serene, gentle, a little formal; the Dawn and the forest. |
| **Dagna Hale** (Smiths’ Guild) | Gruff, practical, proud of the craft; short sentences, no flattery. |
| **Ansel Brook** (Ironford toll-keeper) | Fussy, polite, a stickler for small rules. |
| **Corr Anvilson** (Ironford smith) | Quiet, proud, few words; lets the steel talk. "Mm." |
| **Ysolde Marr** (caravan guard) | Blunt, self-mocking, always looking for work. |
| **Venn Ashby** (Ironford scholar) | Excitable; tangents, footnotes, "did you know". |
| **Sela Wick** (Windmere courier) | Fast-talking, always half-leaving. |
| **Brother Hale** (Windmere monk) | Calm, slow, kind; speaks in short sayings. |
| **The Hollow Warden** | Not a speaker: described, felt, never chatty. |

### Keepers, clerks and referees (`src/data/people.js`)

Each regular has `hello` (first meeting with their name), `again`, one `chat` topic and a `bye`: Mira Holt (brisk, protective of her stock), Tamsin Reed (tidy, unflappable), Holt Varga (gruff, few words), Ada Penn (precise, proud of her ledgers), Rowe Fallow (warm, self-mocking host), Wick Bramble (dreamy, honest about guesswork), Elm Carrow (slow, patient), Sorrel Dane (roots), Mags (blunt house rules), Brannoc Pike (steel salesman), Ingrid Vale (practical), Gorm Halloway (clean blows), Petra Lund (honest weights), Gull Tamsen (wind and cold soup), Odo Finch (rope and maps), Brother Coll (monastic calm), Ysa Marten (the cliff).

### Generated visitors

Recruits and challengers speak by **personality**; petitioners, travellers and messengers by **role** (`PERSONALITY_VOICES`, `ROLE_VOICES`). Each voice has a name line, a return opener, a "what else?" line, an interview opener and a farewell. Their dream, flaw and origin are said as speech (`DREAM_LINES`, `FLAW_LINES`, `ORIGIN_LINES`).

| Personality | Voice |
|---|---|
| Brave | Straight, no hedging: "I don’t run, and I don’t ask twice." |
| Vain | Self-admiring, cheerful about it: "You’ve heard of me, surely. No? You will." |
| Patient | Slow, settled, unhurried. |
| Jealous | Compares themselves to everyone; touchy about it. |
| Merciful | Asks if you’re hurt; kind first. |
| Obsessive | Counting something; loves a list. |
| Cautious | Wary: "Who’s asking, exactly?" |
| Witty | Jokes, quick comebacks. |
| Honorable | Formal, "well met"; promises honest answers. |
| Restless | Impatient, fidgety, wants to move. |

| Role | Voice |
|---|---|
| Council steward | Formal; speaks for the council. |
| Watch sergeant | Overworked, gruff, dry. |
| Temple acolyte | Gentle; "peace on you". |
| Trader | Losing money and saying so. |
| Traveller | Easygoing; passing through. |
| Messenger | Breathless; news for the guild. |

## Audit (the dialogue pass, November 2026)

Problems found across the game, most common first:

- **Player lines spoken for you.** Scenes put words in the player's mouth (`you('Why won’t the guilds hire you?')`) and then answered them.
- **Answers before questions.** NPCs volunteered directions, history or their life story in the opener.
- **Monologues.** Openers of 3–5 long lines; the official story read out in full by Mara, Orren and Old Fen.
- **No way back.** A conversation was one opener and one choice; there was no topic list, so you could not ask a second thing.
- **No names, no memory.** Many people never said who they were; return visits repeated the first meeting.
- **One voice.** Visitors all said the same lines ("I am looking for work.", "Ask what you like.").
- **Menu speech.** People choices read like buttons ("Show me your wares", "Take “Title”", "Turn down “Title”") and answers like tooltips ("Title: brief. 80 gold, risk 3 of 5.").

| Conversation | What was wrong | What changed |
|---|---|---|
| Dunmere · Mara Fen (innkeeper) | Opened with the official story; no return opener | Names herself; topics (introductions to recruits, town talk in three versions, the Wayfarer, the Lantern); story reactions; goodbye |
| Dunmere · Corwin Pell (merchant) | One long pitch; patron standing as a status line | Opener with name, small talk, Trade House topics (standing, gift) in his voice |
| Dunmere · Bram Calder (fighter) | Bragging monologue | Contest-style opener and small talk; topics; reacts to the Melee |
| Dunmere · Gideon Rusk (stablemaster) | No name, one line | Landlord voice, name, the yard as topics, reaction once rented |
| Dunmere · Nessa (before joining) | Answered her own questions | Small talk, guarded topic about her brother |
| Dunmere · Iven Quill (traveller) | Gave directions unasked in the opener; no name | Name and a question first; directions as topics; news unlocks with the story; goodbye |
| Dunmere · Orren Pike (herald) | Read the official story aloud in one line | Proclamation voice; the story is a topic and goes to the codex; promotion reaction |
| Dunmere · Hesta Coal (kilnmaster) | Single line | Name, small talk, kiln topics |
| Dunmere · Pip (lamplighter) | Single line | Name, routes and gossip as topics |
| Dunmere · fountain, well, kiln | Read like speech | Narrated cards with "Move on" |
| Greenhollow · Maren Bell | Long opener; errand given unasked | Name, errand as a topic, Lantern topic gated by the story, reactions |
| Greenhollow · Warden Tamsin | Warnings dumped at once | Warning voice; dangers, Vask and the Blackwood as topics |
| Greenhollow · Old Fen | Told the whole tale unasked | Questions back at you; the tale, who paid, the names as topics; codex |
| Greenhollow · Kit | No name | Gossip voice, caravans and news topics |
| Greenhollow · Brother Alder | Patron standing as a line | Blessing topic (charter version), Temple standing and gift topics |
| Greenhollow · oak, ward stone, well | Read like speech | Narrated cards |
| Ironford · Oswin Tull | No return opener | Clerk voice, name, archive topics, story reaction |
| Ironford · Dagna Hale | Long patron speech | Name, small talk with a charter line, Smiths topics |
| Ironford · Ansel Brook | Toll as a status line | The toll as small talk with choices; river and bridge topics |
| Ironford · Corr Anvilson | Single line | Few words; the shop as a topic |
| Ironford · Ysolde Marr | Recruit offer unasked | "Know anyone looking for work?" topic, two versions |
| Ironford · Venn Ashby | History lecture | Questions first; the renaming as topics; story reaction |
| Ironford · forge, plaque, statue | Read like speech | Narrated cards |
| Windmere · Sela Wick, Brother Hale | No names, no topics | Names, small talk, topics, goodbyes |
| Windmere · wind bell | Read like speech | Narrated card |
| Wilds · milestone, ward marker, lantern | No way out label | "Move on" |
| Wilds · the Hollow Warden | One long line | Split into short beats |
| Story · m1 Gideon (rent the stable) | Terms explained before asked | Ask-then-decide: the place, the cost, selling, then pay or a charter route |
| Story · m2 Mara | Spoke the official story for the player | Opener; the story, her doubt and taverns as topics; "Introduce me." |
| Story · m2 Nessa | Auto player line asking her question | Topics (why no guild, what she wants, who she is looking for), then join |
| Story · m3 Corwin | Job explained unasked | The job, the pay, who drives the wolves as topics; then accept |
| Story · m3 thanks | Could be left before thanking | One natural reply; no other way out |
| Story · m4 Bram | Dare plus explanation in one block | The Melee and his motive as topics; three tone answers |
| Story · m4 warning (Act I ending) | Authored | Kept as written; no early way out |
| Story · m5 Maren, testimony, Nessa | Long speeches; auto player lines | Ask-then-decide; openers; lines split |
| Story · m6 keeper, the ledger | Scar line volunteered | The scar is a topic; lines split |
| Story · m7 Halden, testimony | Monologue | Ask-then-decide; short beats |
| Story · m8 Linnet, Wren's account | Auto player lines | Topics before the decision; opener added |
| Story · m8 banner (Wren) | Authored | Kept exactly as written |
| Prologue (the knock at the door) | Authored | Kept as written |
| People · 17 keepers, clerks, referees | One generic line; no names | `hello` with a name, `again`, a chat topic, a farewell, each in a voice |
| People · recruits and challengers | Same lines for everyone; menu speech | 10 personality voices; origin, dream and flaw as speech |
| People · petitioners | "Title: brief. 80 gold, risk 3 of 5." | The problem in their words, the pay and the danger; "We’ll take it." / "Not this one." |
| People · traveller, messenger | Tooltip rumour | The rumour as speech; "X is on your map now." as a notice |
| People · the interview | Buttons ("Would you join us?", "Agreed") | A small hub in their voice; asked questions checked; "Deal. Welcome to …" |
| Event cards, road events, moments | Narrated cards, not conversations | Unchanged: they are narration with choices, not people talking |

## Open points

- Halden, Linnet and Wren have short dialogue only in the story; once they join, they have no town conversation. That is Chapter 2 work.
- Generated visitors do not yet react to big events (only named characters do).
- No localization: lines are inline strings, not string-table ids. Fine for the prototype.
