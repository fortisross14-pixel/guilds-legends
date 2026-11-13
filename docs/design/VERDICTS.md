# Verdicts — first draft of the scenes

A **verdict** is a short choice at a decisive moment, usually when a contract's work is done
and before the reward (design: [`PILLARS.md`](PILLARS.md), Pillar 1). This is a first pass for
the author to adjust. It follows [`DIALOGUE.md`](../DIALOGUE.md): the other person speaks first,
the player speaks only through choices, short lines.

**How it plays.** The scene opens over the site (the person kneels, pleads, offers). The choices
show **no numbers**: you choose by what you'd do, not by the score. After the choice, a small
card shows what happened and the honor needle and dread marks moving, with one line ("Word
travels: the Wolfskins will remember the banner that hanged their own.").

**Effects key.** H = honor, D = dread (both fade back toward the middle over time). Other effects
use the dialogue effect names (`gold`, `fame`, `patron`, `reputation`, `relationship`, `flag`).
Sizes: small ±4, medium ±8, large ±15.

---

## Contract verdicts (any town; by contract family)

### 1. The thief who begs (Bounty, Combat)
*Trigger: a bounty on a thief; the last objective is done.*
> **THIEF:** "Please. I only took bread and a purse. My sister's sick."
> **THIEF:** "Don't hand me to the watch. They'll take the hand anyway."

| Player says | Reply | Effects |
|---|---|---|
| "Then I'll save them the trouble." | *(narrated)* He screams. You leave him in the road. | H −15, D +12, region −small |
| "The watch can decide. Come on." | "…Fine. Fine." | H +8, D +4, bounty in full, flag `watch-friend` +1 |
| "Your purse, and you walk." | "Take it. Take it and go." | H −6, gold +purse, flag `thief-informant` (he sells you a rumour later) |
| "Go home to your sister." | "I won't forget this. I swear it." | H +10, D −4, temple patron +small, flag `thief-owes` (a rare recruit later) |

### 2. The bandit who yields (any fight objective)
*Trigger: the last fight of a contract against outlaws, won.*
> **BANDIT:** "Enough! I yield! I've a blade and a few coins. Take them."

| Player says | Reply | Effects |
|---|---|---|
| "Drop it and run. Tell your friends who did this." | "Yes. Yes, I'll tell them." | D +8, flag `bands-warned` (bands on this road yield more often) |
| "You're coming back to answer for it." | "They'll hang me." / "Maybe. That's not my call." | H +8, fame +small |
| "No yielding today." | *(narrated)* It's quick. Nobody talks about mercy on that road again. | H −12, D +15 |
| "Your coins. Then go." | "Thieves robbing thieves." | H −4, gold +small |

### 3. The farmer who can't pay (Expedition, any contract with a village giver)
*Trigger: reporting back to a poor giver.*
> **FARMER:** "You did all of it. I know. But the harvest failed, and I've half what I promised."

| Player says | Reply | Effects |
|---|---|---|
| "Half will do. Keep the rest for seed." | "Bless you. The whole valley will hear." | H +10, gold −half, region +medium |
| "We agreed a price." | "Then take the cow. She's all we have." | H −6, D +4, gold in full |
| "Then we'll take it out of your barn." | *(narrated)* You leave with sacks of grain. The children watch from the door. | H −12, D +8, gold in full, region −medium |
| "Pay us next year, with interest." | "Next year. I swear." | flag `farmer-debt` (gold +half and +a tenth next year; the farmer remembers either way) |

### 4. The forged ledger (Intrigue)
*Trigger: an Intrigue contract that recovers papers.*
> **CLERK:** "That's not the ledger they hired you for. That one shows who's been paid off."
> **CLERK:** "The council would pay to see it. The people in it would pay more not to."

| Player says | Reply | Effects |
|---|---|---|
| "Then the council sees it." | "Brave. Or foolish. We'll find out which." | H +10, D +4, council patron +medium, a rival guild in the ledger becomes hostile |
| "Let's find out who pays more." | "I'll make the introductions. For a share." | H −10, gold +large, flag `blackmail` (that guild pays quietly, and hates you) |
| "Burn it. It's not our business." | *(narrated)* The pages curl in the brazier. | nothing moves; the clerk: relationship +1 ("Sensible.") |

### 5. The deserter (Combat, escort)
*Trigger: on an escort, a soldier hiding in the brush.*
> **DESERTER:** "Don't shout. I ran from the Argent Crown's levy. They'll flog me to death."

| Player says | Reply | Effects |
|---|---|---|
| "Walk with us. Keep your head down." | "I owe you my back." | H +8, flag `deserter-joins` (a cheap Guardian recruit next month), Argent Crown rivalry +small |
| "They pay a reward for runaways." | "You're no better than them." | H −10, D +6, gold +medium |
| "We never saw you." | "…Thank you." | H +4 |

### 6. The injured rival (after a tournament bout)
*Trigger: you won a bout; the losing side's best fighter is badly hurt.*
> **RIVAL'S SECOND:** "Your last strike broke her arm. The healers want gold before they'll touch her."

| Player says | Reply | Effects |
|---|---|---|
| "Our healer will see to her. No charge." | "I… didn't expect that from you." | H +10, that rival: rivalry score −medium (respect), fame +small |
| "That's the arena." | "It is. We'll remember." | that rival: rivalry +medium |
| "Tell her to stay out of our way next time." | *(narrated)* The crowd hears it. Some cheer. | D +10, that rival: rivalry +large, fame +small |

### 7. The bribe to lose (any tournament, before a quarterfinal)
*Trigger: once a season, a stranger in the arena tunnel.*
> **STRANGER:** "A friend of mine has money on your opponents. Fall in the second round."
> **STRANGER:** "Two hundred gold. Nobody gets hurt. Nobody but your pride."

| Player says | Reply | Effects |
|---|---|---|
| "Get out of my tunnel." | "Your loss, champion." | H +6 |
| "Make it four hundred." | "Done. Fall well." | H −15, gold +400, the bout is forfeited; flag `fixer` (more offers; if found out: fame −large) |
| "Tell your friend to bet on us." | "Ha! Bold. I might." | D +4, fame +small if you win |

### 8. The village that hid the outlaws (Combat)
*Trigger: the outlaws' trail ends in a village.*
> **ELDER:** "Yes, we fed them. They'd have burned us if we didn't."
> **ELDER:** "Do what you came to do. But the children didn't choose this."

| Player says | Reply | Effects |
|---|---|---|
| "Nobody here will be punished. Point us at them." | "The mill. They sleep in the mill." | H +8, the next fight is easier (they're surprised) |
| "Next time, you'll fear us more than them." | *(narrated)* You make an example of the headman's barn. | H −12, D +15, region −medium, bands here yield sooner |
| "Then the village pays their bounty." | "With what?" / "You'll find it." | H −6, gold +medium |

### 9. The poisoned well (Expedition)
*Trigger: an expedition contract to a wild area's spring.*
> **HERBALIST:** "Someone soured the well on purpose. A rival trader, I'd wager."
> **HERBALIST:** "I can clean it. It takes a week, and your help hauling."

| Player says | Reply | Effects |
|---|---|---|
| "We'll haul. Start now." | "Good hands. The village will drink by Sunday." | H +8, 4 days pass, region +medium |
| "Find me who did it instead." | "Follow the cart tracks east." | D +4, an extra fight objective appears (the saboteur's men), gold +medium |
| "Our job was to find it, not fix it." | "Then go. I'll do it alone." | the herbalist: relationship −2 |

### 10. The prisoner who knows (Intrigue)
*Trigger: an Intrigue contract that captures a courier.*
> **COURIER:** "I'll talk. Names, places. Just don't let them take me back to Ironford."

| Player says | Reply | Effects |
|---|---|---|
| "Talk, and you go free." | "The foundry boss pays the raiders. There. I'm done." | H +4, flag (a lead: an Intrigue contract next month) |
| "You'll talk either way." | *(narrated)* He talks. It takes an hour. | H −10, D +10, the lead, and a second one |
| "Ironford can have you. Not my problem." | "Then you've killed me." | H −4, gold +medium (the council's reward) |

### 11. The debt collector's job (Diplomacy, from a noble)
*Trigger: a noble's contract to collect from a widow.*
> **WIDOW:** "He wants the house for a debt my husband ran up. I have nothing else."

| Player says | Reply | Effects |
|---|---|---|
| "Tell the noble the debt is paid. We'll cover it." | "Why would you do that?" / "Because we can." | H +15, gold −medium, the noble: relationship −1 |
| "You have a week to leave." | *(narrated)* She doesn't argue. That's the worst part. | H −10, D +6, gold in full, the noble: relationship +2 (more dirty work) |
| "Talk to him yourself. We'll stand with you." | "…You'd do that?" | a talk objective with a stat test: win it and H +10; lose and gold −small |

### 12. The shrine's gold (Expedition)
*Trigger: an expedition contract finds an old shrine.*
> **(narrated)** Under the moss, a box of offerings. Old coins, a silver lamp. No one has come in years.

| Player says | Reply | Effects |
|---|---|---|
| "Leave it. It isn't ours." | *(narrated)* You light the lamp before you go. | H +6, temple patron +small |
| "Take it. The dead don't spend." | *(narrated)* The lamp is heavier than it looks. | H −8, gold +medium, item `silver-lamp` (sells well) |
| "Take it to the temple in town." | "Dawn's blessing on you. And a small finder's fee." | H +8, gold +small, temple patron +medium |

---

## Story verdicts (Chapter 1)

These attach to the story missions in the table in `PILLARS.md`. The story text is the author's; these are proposals.

### S1. The Wolfskin handler (m3, after the last fight)
> **HANDLER:** "You've killed my pack. Kill me too, or let me crawl away. I don't care which."

| Player says | Effects |
|---|---|
| "Crawl, then. And tell whoever pays you that we're coming." | H +4, D +4, flag `handler-spared` (in m6 he names the Argent Crown's agent: a dialogue option) |
| "The road's had enough of your kind." | H −10, D +12; Old Road bands yield sooner |
| "Corwin can decide what to do with you." | H +8; Corwin: relationship +2, fame +small |

### S2. Brother Malric yields (the Ash Abbot)
> **MALRIC:** "Enough. The gate is yours. I only sold what the pilgrims were too frightened to keep."

| Player says | Effects |
|---|---|
| "The temple can judge you." | H +10; the temple patron +medium; a healer offers to join later |
| "Give back what you took. Then go." | H +6, gold +medium (returned to the pilgrims: region +medium) |
| "Kneel. The road will see this." | H −12, D +15; the temple: patron −medium; the priests' house closes to you until you make amends |

### S3. Bram's challenge (m4)
> **BRAM:** "First to yield. No tricks. Unless you're the kind who needs them."

| Player says | Effects |
|---|---|
| "No tricks." | the fair bout (as now) |
| "Whatever wins." | the bout starts with Bram's guard broken (easier), but H −8; Bram never joins; the Argent Crown's man is watching (a line in the Act I ending) |

### S4. Maren the herbalist (m5)
> **MAREN:** "If they know I talked, I won't see the spring."

| Player says | Effects |
|---|---|
| "Then we'll walk you home in daylight. Let them see us." | H +6, D +4; in m8 the Crown knows Maren talked (a harder scene) |
| "We'll move you by night. Nobody will know." | H +4; in m8 her name is safe (an easier scene) |
| "Your testimony first. Your safety's your own." | H −8; the evidence, but Maren won't speak to you again |

---

## The darker path (decision: its own ending)

A wicked guild (honor below −34 at the chapter's end) gets its own route through the story, not
a harder version of the good one. It has harder and easier parts:
- **Easier:** bribes and threats open some gates (m6: buy or force the ledger without the council;
  m7: Halden Marsh can be blackmailed instead of beaten); dreaded guilds face fewer fights.
- **Harder:** the temple, some recruits and the honest patrons close; the watch hunts you; evidence
  is worth less (no one trusts a wicked guild's testimony), so Ending A (expose the Crown in court)
  is out of reach.
- **Its own ending (C, the darker one):** the guild takes the Argent Crown's place: Thorne falls,
  and you are the new power everyone fears. The epilogue says what that cost.
