# Spec: missions happen in the world, not in pop-ups

## The problem
Today a contract is picked on the notice board, then plays out as a chain of pop-ups:
- party arrangement
- simulated weeks
- "key moment" decision cards
- mission-game modals (Diplomacy / Expedition / Intrigue)
- reports

Several of these can't be closed, sit off-position, or overlap. One example: the road-event card "A friendly peddler" has its "On the road" tag and narration text drawn underneath the choices at the bottom of the screen, and there's no way to close it.

This doesn't fit the game anymore. The game now has walkable towns and wild areas, people you talk to, and a story told through places and conversations.

## The rule
**A contract is a place to go and things to do there.** You walk to it, explore it, fight what's there and talk to who's there. No simulated mission time. No pop-ups during a mission, except the battle screen itself and dialogue with people on site.

## 1. Accepting a contract
- **Accepting a contract** (from a person, or from the notice board's list of unlocked contracts) does three things:
  - adds it to the Journal → Contracts
  - places a marker on the world map
  - places an entrance in the right scene (the edge of a wild area, a building, a camp or a ruin)
- **The contract shows its objectives as short steps.** Example: "Find the wolf den · Defeat the pack leader · Return to Corwin Pell".
- **Steps update as you do them.** No hidden rolls.

## 2. The mission site
Reuse the walkable scene system: wild-area maps, interiors, the pathfinding, and tap-to-walk. Each contract either opens a small site or uses part of an existing wild area. Its objectives are things in the world:
- **Fight:** visible enemy groups. Touching or tapping one starts the normal battle. Bosses are marked.
- **Talk:** witnesses, a captive, a rival, a quartermaster. Use the dialogue system, including choices with effects. Persuasion and lies use hero stats as visible checks ("Presence 52: likely").
- **Inspect:** clues, tracks, documents, a locked chest. Tap to inspect; some need a class or stat ("A Rogue could open this").
- **Collect:** herbs, ore, evidence. Same as the existing gathering spots.
- **Escort or protect:** an NPC follows the party to a destination, and fights near them include protecting them.
- **Optional extras:** a hidden chest, a side path, an alternative route (talk instead of fight).

## 3. Mission families become play styles, not pop-up mini-games
- **Combat (hunt, clear, escort):** mostly fights, plus one or two inspects.
- **Diplomacy:** mostly conversations with choices and stat checks.
- **Expedition:** exploring, collecting and inspecting, with an environmental fight or two.
- **Intrigue:** inspecting, talking and avoiding patrols (patrols are optional fights; being seen makes the next fight harder).

Remove the Diplomacy / Expedition / Intrigue turn-based pop-up mini-games (`missionGames.js` and `MissionGameModal`). Reuse their good content (lines, checks, outcomes) as site conversations and inspect points.

## 4. Finishing
- **Return to the giver** (or the notice board for posted jobs) to report back. The reward comes through a short dialogue plus one reward moment (gold, XP, loot, reputation), queued like any other moment.
- The grade (Partial / Success / Great / Legendary) comes from what you actually did: objectives done, optional extras found, heroes knocked out, time taken in days.
- Losing a battle on site follows the defeat rule in guild-hall-rooms.md: the party wakes in the infirmary. The contract stays open until its deadline, if it has one.
- **Deadlines:** some contracts have a calendar deadline, shown in the Journal. Missing it fails the contract, and the giver mentions it next time you talk.

## 5. Time
- No simulated mission duration. Time passes only through travel (days), camping, resting, and the founder's actions, as in docs/UX.md.
- Remove the old "weeks remaining" missions, `launchExpedition`, and auto-resolved mission outcomes.
- In Chapter 1, all contracts are played in person. Sending a squad off-screen is gone. Side jobs stay as the one off-screen activity (short, simple, results shown in Journal → Now and the ledger, no pop-up).

## 6. The story uses the same system
Story missions (docs/STORY.md) are sites and conversations. For example:
- "Wolves on the Old Road" = a site on the Old Road.
- "The Ledger of Ironford" = the archive as a small interior with inspect points, a keeper to talk to or sneak past.

Story steps are site objectives, and the Journal shows them the same way.

## 7. Pop-ups and interruptions
- Every remaining overlay (a road event, the battle screen, a reward moment, a rest summary) must:
  - follow the one interruption queue
  - fit on screen at 390×844 with nothing drawn under it
  - have a clear way to close or continue
- **Road events** become a proper card: title, one line of narration, choices as full-width rows, and nothing behind or under it. Where it fits, a road event can be an encounter on arrival instead of a card.
- **The "On the road" travel tag** never overlaps any card.

## 8. Data and content
- `src/data/missions/`: contract templates with site layout (or a reference to a wild area plus an entry point), objectives, people on site, enemy groups, inspect and collect points, optional extras, rewards and grade rules.
- Convert the existing contract templates and the Chapter 1 story contracts to this format. Every contract reachable in the slice (Dunmere, Greenhollow, Ironford, Windmere, the Old Road, Thornwood edge) must be playable this way.
- Add asset ids for site backdrops, objective markers and inspect props to docs/ASSETS.md.
